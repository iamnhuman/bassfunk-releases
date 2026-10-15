(function () {
  'use strict';

  const vertex = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;
  // A small, advected velocity field. RGBA8 encoding keeps this available on
  // devices without renderable float textures; 128 is exactly zero velocity.
  const simulation = `
    uniform sampler2D uPrevious;
    uniform vec2 uMouse;
    uniform vec2 uImpulse;
    uniform vec2 uTexel;
    uniform float uAspect;
    uniform float uDelta;
    uniform float uReset;
    varying vec2 vUv;
    const float zero = 128.0 / 255.0;
    const float range = 127.0 / 255.0;
    void main() {
      vec2 previous = (texture2D(uPrevious, vUv).rg - zero) / range;
      vec2 uv = clamp(vUv - previous * uDelta * 0.045, 0.0, 1.0);
      vec3 field = texture2D(uPrevious, uv).rgb * 0.6;
      field += texture2D(uPrevious, uv + vec2(uTexel.x, 0.0)).rgb * 0.1;
      field += texture2D(uPrevious, uv - vec2(uTexel.x, 0.0)).rgb * 0.1;
      field += texture2D(uPrevious, uv + vec2(0.0, uTexel.y)).rgb * 0.1;
      field += texture2D(uPrevious, uv - vec2(0.0, uTexel.y)).rgb * 0.1;
      vec2 velocity = (field.rg - zero) / range;
      float decay = exp(-3.8 * uDelta);
      velocity *= decay;
      float energy = field.b * decay;
      vec2 distance = vUv - uMouse;
      distance.x *= uAspect;
      float stamp = exp(-dot(distance, distance) * 85.0);
      float speed = min(1.0, length(uImpulse));
      velocity = mix(velocity, uImpulse, stamp * speed * 0.65);
      energy = max(energy, stamp * speed);
      if (uReset > 0.5) { velocity = vec2(0.0); energy = 0.0; }
      gl_FragColor = vec4(vec2(zero) + clamp(velocity, -1.0, 1.0) * range, energy, 1.0);
    }
  `;
  const composite = `
    uniform sampler2D uScene;
    uniform sampler2D uFlow;
    uniform vec2 uResolution;
    uniform vec2 uVelocity;
    uniform vec2 uDirection;
    uniform vec2 uMouse;
    uniform float uTravel;
    uniform float uProgress;
    uniform float uEnabled;
    varying vec2 vUv;
    const float zero = 128.0 / 255.0;
    const float range = 127.0 / 255.0;
    vec3 sampleScene(vec2 uv) {
      vec4 source = texture2D(uScene, clamp(uv, 0.001, 0.999));
      return source.rgb + vec3(0.0035, 0.0037, 0.0039) * (1.0 - source.a);
    }
    void main() {
      vec3 field = texture2D(uFlow, vUv).rgb;
      vec2 flow = (field.rg - zero) / range;
      vec2 center = vUv - 0.5;
      float aspect = uResolution.x / uResolution.y;
      vec2 plane = center * vec2(aspect, 1.0);
      float front = (uProgress * 2.0 - 1.0) * (aspect + 1.0) * 0.62;
      float distance = dot(plane, uDirection) - front;
      float wave = exp(-distance * distance * 4.5) * uTravel;
      float cursorPin = smoothstep(0.0, 0.075, length((vUv - uMouse) * vec2(aspect, 1.0)));
      vec2 offset = flow * 0.038;
      offset += uDirection / vec2(aspect, 1.0) * sin(distance * 7.0) * wave * 0.027;
      offset += uVelocity * dot(center, center) * 0.016;
      vec2 uv = vUv + offset * uEnabled * cursorPin;
      // A narrow spectral edge appears only under force, never as a permanent tint.
      vec2 split = (flow * 0.0018 + uDirection * wave * 0.0012) * uEnabled * cursorPin;
      vec3 color = sampleScene(uv);
      color.r = sampleScene(uv + split).r;
      color.b = sampleScene(uv - split).b;
      float grain = fract(sin(dot(floor(vUv * uResolution), vec2(12.9898, 78.233))) * 43758.5453);
      color += (grain - 0.5) * 0.0014;
      gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  function create(T, renderer, reducedMotion, performanceMode) {
    const simulationSize = performanceMode ? 128 : 192;
    const targetOptions = { type: T.UnsignedByteType, minFilter: T.LinearFilter,
      magFilter: T.LinearFilter, depthBuffer: false, stencilBuffer: false };
    let read = new T.WebGLRenderTarget(simulationSize, simulationSize, targetOptions);
    let write = read.clone();
    const sceneTarget = new T.WebGLRenderTarget(1, 1, { minFilter: T.LinearFilter,
      magFilter: T.LinearFilter, depthBuffer: true, stencilBuffer: false });
    // Multisample the gallery before sampling it through the liquid lens.
    sceneTarget.samples = renderer.capabilities.isWebGL2 && !performanceMode ? 4 : 0;
    const geometry = new T.PlaneGeometry(2, 2);
    const camera = new T.Camera();
    const simulationScene = new T.Scene();
    const compositeScene = new T.Scene();
    const impulse = new T.Vector2();
    const mouse = new T.Vector2(-10, -10);
    const drift = new T.Vector2();
    let reset = true;
    const simulationMaterial = new T.ShaderMaterial({ vertexShader: vertex, fragmentShader: simulation,
      depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { uPrevious: { value: read.texture }, uMouse: { value: mouse }, uImpulse: { value: impulse },
        uTexel: { value: new T.Vector2(1 / simulationSize, 1 / simulationSize) },
        uAspect: { value: 1 }, uDelta: { value: 1 / 60 }, uReset: { value: 1 } }
    });
    const compositeMaterial = new T.ShaderMaterial({ vertexShader: vertex, fragmentShader: composite,
      depthTest: false, depthWrite: false,
      uniforms: { uScene: { value: sceneTarget.texture }, uFlow: { value: read.texture },
        uResolution: { value: new T.Vector2(1, 1) }, uVelocity: { value: drift },
        uDirection: { value: new T.Vector2() }, uMouse: { value: mouse }, uTravel: { value: 0 }, uProgress: { value: 0 },
        uEnabled: { value: reducedMotion ? 0 : 1 } }
    });
    simulationScene.add(new T.Mesh(geometry, simulationMaterial));
    compositeScene.add(new T.Mesh(geometry, compositeMaterial));

    return {
      resize: function (width, height, pixelRatio) {
        sceneTarget.setSize(Math.round(width * pixelRatio), Math.round(height * pixelRatio));
        compositeMaterial.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
        simulationMaterial.uniforms.uAspect.value = width / height;
        reset = true;
      },
      pointer: function (x, y, dx, dy) {
        if (reducedMotion) return;
        mouse.set(x * 0.5 + 0.5, y * 0.5 + 0.5);
        impulse.x = Math.max(-1, Math.min(1, impulse.x + dx * 14));
        impulse.y = Math.max(-1, Math.min(1, impulse.y + dy * 14));
      },
      render: function (scene, sceneCamera, delta, velocity, navigation, envelope) {
        const dt = Math.max(1 / 240, Math.min(delta || 1 / 60, 0.05));
        const sim = simulationMaterial.uniforms;
        sim.uPrevious.value = read.texture;
        sim.uDelta.value = dt;
        sim.uReset.value = reset ? 1 : 0;
        if (reset || !reducedMotion) {
          renderer.setRenderTarget(write);
          renderer.render(simulationScene, camera);
          const previous = read; read = write; write = previous;
        }
        reset = false;
        impulse.multiplyScalar(Math.exp(-14 * dt));
        drift.lerp(velocity, 1 - Math.exp(-12 * dt));
        const post = compositeMaterial.uniforms;
        post.uFlow.value = read.texture;
        post.uTravel.value = reducedMotion ? 0 : envelope;
        post.uProgress.value = navigation ? navigation.progress : 0;
        post.uDirection.value.set(navigation ? navigation.directionX : 0, navigation ? navigation.directionY : 0);
        renderer.setRenderTarget(sceneTarget);
        renderer.render(scene, sceneCamera);
        renderer.setRenderTarget(null);
        renderer.render(compositeScene, camera);
      },
      destroy: function () {
        read.dispose(); write.dispose(); sceneTarget.dispose(); geometry.dispose();
        simulationMaterial.dispose(); compositeMaterial.dispose();
      }
    };
  }
  window.BassfunkWaveFluid = { create: create };
})();
