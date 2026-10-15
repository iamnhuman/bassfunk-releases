import { Text, configureTextBuilder, preloadFont } from 'troika-three-text';

const T = window.THREE;
const fontUrl = new URL('./vendor/fonts/wave-title-complete.woff', document.currentScript.src).href;
configureTextBuilder({ defaultFontURL: fontUrl });

// Troika owns shaping, kerning, Unicode and edge antialiasing. The SDF also
// provides a smooth bevel normal for a shallow, reflective chrome surface.
const vertexShader = `
  uniform float uTime;
  uniform float uMotion;
  uniform float uReveal;
  uniform float uFontSize;
  varying vec2 vTitleUv;
  varying vec3 vTitlePosition;
  void main() {
    vec3 p = position;
    float wave = sin(p.x / uFontSize * 0.75 - uTime * 1.2);
    p.z += wave * uFontSize * (uMotion * 0.025 + uReveal * 0.065);
    vTitlePosition = p;
    vTitleUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragmentShader = `
  uniform float uTime;
  uniform float uReveal;
  uniform float uFontSize;
  uniform vec2 uPointer;
  varying vec2 vTitleUv;
  varying vec3 vTitlePosition;
  void main() {
    float sdf = troikaGetFragDistValue();
    float bevelWidth = uFontSize * 0.035;
    float bevel = 1.0 - smoothstep(0.0, bevelWidth, -sdf);
    vec2 gradient = vec2(dFdx(sdf), dFdy(sdf));
    gradient /= max(length(gradient), 0.001);
    vec3 n = normalize(vec3(-gradient * bevel * 1.8, 1.0));
    vec3 light = normalize(vec3(-0.5 + uPointer.x * 0.6, 0.8 + uPointer.y * 0.35, 1.1));
    float spec = pow(max(dot(n, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0), 42.0);
    float bend = sin(vTitlePosition.x / uFontSize * 0.65 + uTime * 0.25) * 0.1;
    float horizon = vTitleUv.y + n.y * 0.19 + bend + uPointer.y * 0.08;
    float reflection = 0.5 + 0.5 * sin(horizon * 7.0 + 0.5);
    float darkBand = exp(-pow((horizon - 0.46) * 12.0, 2.0));
    vec3 chrome = mix(vec3(0.14, 0.18, 0.26), vec3(0.88, 0.95, 1.0), reflection);
    chrome *= 1.0 - darkBand * 0.72;
    vec3 spectrum = 0.5 + 0.5 * cos(6.283185 * (vec3(0.0, 0.33, 0.67)
      + horizon * 0.65 + uPointer.x * 0.12));
    float rim = exp(-abs(sdf + uFontSize * 0.003) / (uFontSize * 0.006));
    vec3 color = chrome + spec * vec3(0.8, 0.9, 1.0) * bevel * 0.8;
    color += spectrum * bevel * 0.17 + vec3(0.7, 0.86, 1.0) * rim * 0.2;
    float glint = exp(-pow((vTitleUv.x - 0.5 - uPointer.x * 0.4
      - sin(uTime * 0.3) * 0.32) * 18.0, 2.0));
    color += glint * (0.06 + bevel * 0.18);
    gl_FragColor = vec4(color, 1.0 - smoothstep(0.15, 1.0, uReveal));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function create(three, container, title, pixelRatioLimit, onReady, reducedMotion) {
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) { return null; }
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'wave3d-caption__shader';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.hidden = true;
  container.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
  camera.position.z = 1000;
  const uniforms = {
    uTime: { value: 0 }, uPointer: { value: new T.Vector2() },
    uMotion: { value: 0 }, uReveal: { value: 0 }, uFontSize: { value: 64 }
  };
  const material = new T.ShaderMaterial({
    uniforms, vertexShader, fragmentShader, extensions: { derivatives: true },
    side: T.DoubleSide, transparent: true, depthWrite: false
  });
  const text = new Text();
  text.font = fontUrl;
  text.material = material;
  text.anchorX = 'center';
  text.anchorY = 'middle';
  text.textAlign = 'center';
  text.lineHeight = 1.1;
  text.letterSpacing = -0.018;
  text.overflowWrap = 'break-word';
  text.glyphGeometryDetail = 12;
  text.sdfGlyphSize = 128;
  scene.add(text);
  let dirty = true;
  let destroyed = false;
  let ready = false;
  let requestedText = '';
  let requestWidth = 0;
  let sizeAttempts = 0;
  let revealStarted = null;
  const padding = 24;

  function fallback() {
    ready = false;
    container.classList.remove('is-shader-ready');
    container.style.height = '';
    renderer.domElement.hidden = true;
  }

  function onSync() {
    if (destroyed) { text.dispose(); text.removeEventListener('synccomplete', onSync); return; }
    if (text.textRenderInfo.parameters.text !== requestedText || title.textContent.trim() !== requestedText) return;
    const bounds = text.textRenderInfo.blockBounds;
    const height = bounds[3] - bounds[1];
    if (height > text.fontSize * 2.3 && sizeAttempts < 3) {
      sizeAttempts += 1;
      text.fontSize = Math.max(18, text.fontSize * Math.sqrt(text.fontSize * 2.2 / height));
      text.sync();
      return;
    }
    const titleHeight = Math.ceil(height + 4);
    container.style.height = titleHeight + 'px';
    const width = requestWidth + padding * 2;
    const canvasHeight = titleHeight + padding * 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
    renderer.setSize(width, canvasHeight, false);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = canvasHeight / 2;
    camera.bottom = -canvasHeight / 2;
    camera.updateProjectionMatrix();
    uniforms.uFontSize.value = text.fontSize;
    text.curveRadius = -Math.max(600, requestWidth * 2.5);
    ready = true;
    revealStarted = null;
    renderer.domElement.hidden = false;
    container.dataset.textEngine = 'troika-sdf';
    container.dataset.shader = 'beveled-chrome';
    onReady();
  }
  text.addEventListener('synccomplete', onSync);
  preloadFont({ font: fontUrl, characters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', sdfGlyphSize: 128 }, () => {
    if (!destroyed) onReady();
  });

  return {
    invalidate() { dirty = true; },
    update(time, pointer, force) {
      const nextText = title.textContent.trim();
      if (dirty || requestedText !== nextText) {
        const rect = container.getBoundingClientRect();
        if (!rect.width || !nextText) { fallback(); return; }
        dirty = false;
        fallback();
        requestedText = nextText;
        requestWidth = rect.width;
        sizeAttempts = 0;
        text.text = nextText;
        text.fontSize = parseFloat(getComputedStyle(title).fontSize);
        text.maxWidth = Math.max(40, requestWidth - 12);
        text.sync();
        // An unchanged layout may already be cached and emit no sync event.
        if (text.textRenderInfo && text.textRenderInfo.parameters.text === requestedText
          && text.textRenderInfo.parameters.fontSize === text.fontSize
          && text.textRenderInfo.parameters.maxWidth === text.maxWidth) onSync();
      }
      if (!ready) return;
      if (revealStarted === null) revealStarted = time;
      uniforms.uTime.value = time;
      uniforms.uPointer.value.copy(reducedMotion ? { x: 0, y: 0 } : pointer);
      uniforms.uMotion.value = reducedMotion ? 0 : Math.min(1, Math.max(0, force || 0));
      uniforms.uReveal.value = reducedMotion ? 0 : Math.max(0, 1 - (time - revealStarted) / 0.65);
      text.rotation.set(0.035, reducedMotion ? 0 : pointer.x * 0.045, 0);
      renderer.render(scene, camera);
      container.classList.add('is-shader-ready');
    },
    destroy() {
      destroyed = true;
      // Keep the completion listener until any in-flight layout finishes so
      // its newly allocated geometry is also disposed.
      text.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      container.classList.remove('is-shader-ready');
      container.style.height = '';
    }
  };
}
window.BassfunkWaveTitle = { create };
