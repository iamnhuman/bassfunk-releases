(function () {
  'use strict';

  const MIN_ZOOM = 0.14;
  const MAX_ZOOM = 2.8;
  const DEFAULT_STEP = 1.24;
  const CARD_GAP = 0.06;

  const faceVertex = `
    #ifdef USE_INSTANCING
      attribute vec4 aMapRect;
      attribute float aHover;
      attribute float aTravel;
    #else
      uniform float uHover;
      uniform float uTravel;
    #endif
    varying vec2 vUv;
    varying vec2 vMapUv;
    varying float vHover;
    varying float vTravel;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vUv = uv;
      // Artwork and case share the same rigid transform, including at close range.
      #ifdef USE_INSTANCING
        vMapUv = aMapRect.xy + uv * aMapRect.zw;
        vHover = aHover;
        vTravel = aTravel;
        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      #else
        vMapUv = uv;
        vHover = uHover;
        vTravel = uTravel;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
      #endif
      vView = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `;

  const faceFragment = `
    uniform sampler2D uMap;
    uniform float uTime;
    uniform vec2 uPointer;
    uniform float uDistance;
    varying vec2 vUv;
    varying vec2 vMapUv;
    varying float vHover;
    varying float vTravel;
    varying vec3 vNormal;
    varying vec3 vView;
    float roundedDistance(vec2 p, float r) {
      vec2 q = abs(p) - vec2(0.5 - r);
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }
    void main() {
      float edge = roundedDistance(vUv - 0.5, 0.025);
      float aa = max(fwidth(edge), 0.00025);
      float mask = 1.0 - smoothstep(-aa, aa, edge);
      if (mask < 0.02) discard;
      vec3 art = texture2D(uMap, vMapUv).rgb;
      vec3 n = normalize(vNormal);
      vec3 view = normalize(vView);
      // A coated sleeve: broad softbox reflection, grazing interference and a
      // fine brushed finish. The artwork remains readable beneath the coating.
      vec3 light = normalize(vec3(-0.65 + sin(uTime * 0.11) * 0.12, 0.8, 1.65));
      vec3 halfVector = normalize(light + view);
      float diffuse = max(dot(n, light), 0.0);
      float facing = abs(dot(n, view));
      float fresnel = pow(1.0 - facing, 3.0);
      float specular = pow(max(dot(n, halfVector), 0.0), 64.0);
      vec3 reflected = reflect(-view, n);
      float softbox = exp(-pow((reflected.x + reflected.y * 0.38 - 0.2) * 5.0, 2.0));
      float sweep = sin(dot(vView.xy, vec2(0.12, -0.08)) + uTime * 0.16);
      vec3 film = 0.5 + 0.5 * cos(6.283185 * (vec3(0.0, 0.33, 0.67)
        + facing * 1.25 + sweep * 0.14));
      float rim = exp(-abs(edge + 0.004) * 260.0);
      float bevel = 1.0 - smoothstep(-0.025, -0.004, edge);
      float groovePhase = (vUv.x + vUv.y * 0.22) * 620.0;
      float grooves = sin(groovePhase) * (1.0 - smoothstep(0.4, 2.0, fwidth(groovePhase)));
      vec3 color = art * (0.78 + diffuse * 0.25);
      color *= 0.94 + bevel * 0.06;
      color += vec3(0.78, 0.88, 1.0) * specular * 0.15;
      color += mix(vec3(0.76, 0.87, 1.0), film, 0.55) * softbox
        * (0.045 + fresnel * 0.18 + vHover * 0.09);
      color += film * fresnel * 0.095;
      color += mix(vec3(0.7, 0.8, 0.92), film, 0.65) * rim
        * (0.025 + fresnel * 0.12 + vHover * 0.22 + vTravel * 0.08);
      color += grooves * 0.003 * (softbox + vHover);
      float depth = smoothstep(uDistance * 1.02, uDistance * 1.6, vView.z);
      color = mix(color, vec3(0.005, 0.007, 0.012), depth * 0.38);
      gl_FragColor = vec4(color, mask);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  function create(options) {
    const T = window.THREE;
    if (!T || !options.container) return null;
    const entries = options.releaseNodes.map(function (node) {
      const image = node.querySelector('img');
      return image ? {
        index: node.getAttribute('data-index') || '',
        source: node,
        url: image.currentSrc || image.src,
        detail: options.getDetail(node.getAttribute('data-index'), node) || {}
      } : null;
    }).filter(Boolean);
    if (!entries.length) return null;

    const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    const space = document.createElement('div');
    space.className = 'canvas-space canvas-space--wave3d';
    space.setAttribute('role', 'region');
    space.setAttribute('aria-label', '3D release gallery');
    space.tabIndex = 0;
    renderer.domElement.className = 'canvas-space__cards-surface';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const proxy = document.createElement('a');
    proxy.className = 'canvas-space__cards-proxy';
    proxy.tabIndex = -1;
    proxy.setAttribute('aria-hidden', 'true');
    const proxyImage = document.createElement('img');
    proxyImage.alt = '';
    proxy.appendChild(proxyImage);
    const caption = document.createElement('div');
    caption.className = 'wave3d-caption';
    caption.hidden = true;
    const artist = document.createElement('span');
    const title = document.createElement('strong');
    const titleContainer = document.createElement('div');
    titleContainer.className = 'wave3d-caption__title';
    titleContainer.appendChild(title);
    caption.append(artist, titleContainer);
    space.append(renderer.domElement, proxy, caption);
    options.container.prepend(space);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(42, 1, 0.1, 400);
    const ambient = new T.HemisphereLight(0xefeee7, 0x101112, 1.2);
    const keyLight = new T.PointLight(0xf4f0e6, 18, 24, 2);
    keyLight.position.set(-4, 4, 5);
    const edgeLight = new T.PointLight(0xc7cdc2, 12, 24, 2);
    edgeLight.position.set(5, -2, 4);
    scene.add(ambient, keyLight, edgeLight);
    const faceGeometry = new T.PlaneGeometry(1, 1);
    faceGeometry.translate(0, 0, 0.017);
    const shape = new T.Shape();
    const radius = 0.025;
    shape.moveTo(-0.5 + radius, -0.5);
    shape.lineTo(0.5 - radius, -0.5);
    shape.absarc(0.5 - radius, -0.5 + radius, radius, -Math.PI / 2, 0, false);
    shape.lineTo(0.5, 0.5 - radius);
    shape.absarc(0.5 - radius, 0.5 - radius, radius, 0, Math.PI / 2, false);
    shape.lineTo(-0.5 + radius, 0.5);
    shape.absarc(-0.5 + radius, 0.5 - radius, radius, Math.PI / 2, Math.PI, false);
    shape.lineTo(-0.5, -0.5 + radius);
    shape.absarc(-0.5 + radius, -0.5 + radius, radius, Math.PI, Math.PI * 1.5, false);
    const caseGeometry = new T.ExtrudeGeometry(shape, {
      depth: 0.012, bevelEnabled: true, bevelThickness: 0.002,
      bevelSize: 0.001, bevelSegments: 2, steps: 1, curveSegments: 12
    });
    const caseMaterial = new T.MeshStandardMaterial({ color: 0x252a32, metalness: 0.65, roughness: 0.32 });
    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const pointerWorld = new T.Vector3();
    const pointerPlane = new T.Plane(new T.Vector3(0, 0, 1), 0);
    const projected = new T.Vector3();
    const textures = new Map();
    const tiles = [];
    const faces = [];
    let cardMesh = null;
    let caseMesh = null;
    let mapRects = null;
    let hoverValues = null;
    let travelValues = null;
    const trackedPointers = new Map();
    const step = 1 + CARD_GAP;
    const catalogColumns = 24;
    let columns = 0;
    let rows = 0;
    let width = 1;
    let height = 1;
    let baseDistance = 8;
    let panX = 0;
    let panY = 0;
    let targetPanX = 0;
    let targetPanY = 0;
    let zoom = 1;
    let targetZoom = 1;
    let focusTransition = false;
    let navigation = null;
    let navigationEnvelope = 0;
    let panVelocityX = 0;
    let panVelocityY = 0;
    let hovered = null;
    let pointerInside = false;
    let dragging = false;
    let moved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastX = 0;
    let lastY = 0;
    let pinchDistance = 0;
    let pinchZoom = 1;
    let stopped = false;
    let paused = false;
    let raf = 0;
    let lastTimestamp = 0;
    let time = 0;
    let lastTexturePrune = 0;
    const reduceMotion = !!options.reducedMotion;
    space.dataset.waveMotion = reduceMotion ? 'reduced' : 'full';
    const pixelRatioLimit = options.performanceMode ? 1.5 : 2;
    const motionVelocity = new T.Vector2();
    const fluid = window.BassfunkWaveFluid
      ? window.BassfunkWaveFluid.create(T, renderer, reduceMotion, options.performanceMode) : null;
    space.dataset.waveEffect = fluid ? 'prismatic-liquid' : 'prismatic-depth';
    const titleShader = window.BassfunkWaveTitle
      ? window.BassfunkWaveTitle.create(T, titleContainer, title, pixelRatioLimit, ensureFrame, reduceMotion) : null;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (stopped || !titleShader) return;
        titleShader.invalidate();
        ensureFrame();
      });
    }

    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
    function mod(n, m) { return ((n % m) + m) % m; }

    const atlasBitmap = document.createElement('canvas');
    atlasBitmap.width = atlasBitmap.height = Math.min(4096, renderer.capabilities.maxTextureSize);
    const atlasContext = atlasBitmap.getContext('2d');
    atlasContext.fillStyle = '#182333';
    atlasContext.fillRect(0, 0, atlasBitmap.width, atlasBitmap.height);
    const atlas = new T.CanvasTexture(atlasBitmap);
    atlas.colorSpace = T.SRGBColorSpace;
    atlas.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const atlasColumns = Math.ceil(Math.sqrt(entries.length));
    const atlasCell = Math.floor(atlasBitmap.width / atlasColumns);
    const atlasPadding = 4;
    const atlasContent = atlasCell - atlasPadding * 2;
    const images = new Map();
    entries.forEach(function (entry, slot) { entry.slot = slot; });
    const cardMaterial = new T.ShaderMaterial({
      uniforms: { uMap: { value: atlas }, uTime: { value: 0 }, uPointer: { value: pointer }, uDistance: { value: 8 } },
      vertexShader: faceVertex, fragmentShader: faceFragment,
      extensions: { derivatives: true }, transparent: true, depthWrite: true, side: T.DoubleSide
    });

    function imageFor(entry, onLoad) {
      let cached = images.get(entry.index);
      if (cached) {
        if (cached.image.complete && cached.image.naturalWidth) onLoad(cached.image);
        else cached.callbacks.push(onLoad);
        return;
      }
      const image = new Image();
      cached = { image: image, callbacks: [onLoad] };
      images.set(entry.index, cached);
      image.onload = function () {
        if (stopped) return;
        cached.callbacks.forEach(function (callback) { callback(image); });
        cached.callbacks.length = 0;
        ensureFrame();
      };
      image.src = entry.url;
    }

    function atlasRect(entry) {
      const x = entry.slot % atlasColumns * atlasCell;
      const y = Math.floor(entry.slot / atlasColumns) * atlasCell;
      if (!entry.atlasRequested) {
        entry.atlasRequested = true;
        imageFor(entry, function (image) {
          const side = Math.min(image.naturalWidth, image.naturalHeight);
          atlasContext.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2,
            side, side, x + atlasPadding, y + atlasPadding, atlasContent, atlasContent);
          // Extend edge pixels into gutters so mipmaps cannot bleed adjacent covers.
          atlasContext.drawImage(atlasBitmap, x + atlasPadding, y + atlasPadding, 1, atlasContent,
            x, y + atlasPadding, atlasPadding, atlasContent);
          atlasContext.drawImage(atlasBitmap, x + atlasPadding + atlasContent - 1, y + atlasPadding, 1, atlasContent,
            x + atlasPadding + atlasContent, y + atlasPadding, atlasPadding, atlasContent);
          atlasContext.drawImage(atlasBitmap, x, y + atlasPadding, atlasCell, 1, x, y, atlasCell, atlasPadding);
          atlasContext.drawImage(atlasBitmap, x, y + atlasPadding + atlasContent - 1, atlasCell, 1,
            x, y + atlasPadding + atlasContent, atlasCell, atlasPadding);
          atlas.needsUpdate = true;
        });
      }
      return [
        (x + atlasPadding) / atlasBitmap.width,
        1 - (y + atlasPadding + atlasContent) / atlasBitmap.height,
        atlasContent / atlasBitmap.width, atlasContent / atlasBitmap.height
      ];
    }

    function textureFor(entry) {
      let cached = textures.get(entry.index);
      if (cached) { cached.usedAt = time; return cached.texture; }
      const bitmap = document.createElement('canvas');
      bitmap.width = bitmap.height = options.performanceMode ? 512 : 1024;
      const ctx = bitmap.getContext('2d');
      ctx.fillStyle = '#182333';
      ctx.fillRect(0, 0, bitmap.width, bitmap.height);
      const texture = new T.CanvasTexture(bitmap);
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      cached = { texture: texture, usedAt: time };
      textures.set(entry.index, cached);
      imageFor(entry, function (image) {
        if (stopped || textures.get(entry.index) !== cached) return;
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, bitmap.width, bitmap.height);
        texture.needsUpdate = true;
        ensureFrame();
      });
      return texture;
    }

    function buildPool() {
      const viewZoom = Math.min(zoom, targetZoom);
      const viewWidth = 2 * baseDistance * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.aspect / viewZoom;
      const nextColumns = Math.ceil((viewWidth / step * 1.4 + 6) / 4) * 4;
      const nextRows = Math.ceil((viewWidth / camera.aspect / step * 1.4 + 6) / 4) * 4;
      // Grow before a zoom transition, shrink only after its existing overscan is excessive.
      if (cardMesh && nextColumns <= columns && nextRows <= rows && columns * rows <= nextColumns * nextRows * 2) return;
      setHovered(null);
      for (const tile of tiles) {
        if (tile.detailFace) { scene.remove(tile.detailFace); tile.detailFace.material.dispose(); }
      }
      if (cardMesh) {
        scene.remove(cardMesh, caseMesh);
        cardMesh.dispose();
        caseMesh.dispose();
        // Release the previous instance attributes before resizing their buffers.
        faceGeometry.dispose();
      }
      tiles.length = 0;
      faces.length = 0;
      columns = nextColumns;
      rows = nextRows;
      const count = columns * rows;
      mapRects = new T.InstancedBufferAttribute(new Float32Array(count * 4), 4);
      hoverValues = new T.InstancedBufferAttribute(new Float32Array(count), 1);
      travelValues = new T.InstancedBufferAttribute(new Float32Array(count), 1);
      hoverValues.setUsage(T.DynamicDrawUsage);
      travelValues.setUsage(T.DynamicDrawUsage);
      faceGeometry.setAttribute('aMapRect', mapRects);
      faceGeometry.setAttribute('aHover', hoverValues);
      faceGeometry.setAttribute('aTravel', travelValues);
      cardMesh = new T.InstancedMesh(faceGeometry, cardMaterial, count);
      caseMesh = new T.InstancedMesh(caseGeometry, caseMaterial, count);
      cardMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      caseMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      cardMesh.frustumCulled = caseMesh.frustumCulled = false;
      cardMesh.boundingSphere = new T.Sphere(new T.Vector3(), 1000);
      scene.add(caseMesh, cardMesh);
      faces.push(cardMesh);
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < columns; col += 1) {
          tiles.push({ group: new T.Object3D(), row: row, col: col, entry: null, hover: 0,
            travel: 0, travelZ: 0, travelSlopeX: 0, travelSlopeY: 0, detailFace: null });
        }
      }
      space.dataset.waveCards = String(tiles.length);
    }

    function setHovered(tile) {
      if (hovered === tile) return;
      hovered = tile;
      space.classList.toggle('has-clickable-hover', !!tile && !dragging);
      caption.hidden = !tile || dragging;
      if (tile) {
        artist.textContent = tile.entry.detail.artistName || '';
        title.textContent = tile.entry.detail.releaseTitle || '';
      }
    }

    function pick(clientX, clientY) {
      const rect = space.getBoundingClientRect();
      const p = new T.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(p, camera);
      const hits = raycaster.intersectObjects(faces, false);
      for (const hit of hits) {
        const uv = hit.uv;
        if (uv) {
          const qx = Math.abs(uv.x - 0.5) - 0.475;
          const qy = Math.abs(uv.y - 0.5) - 0.475;
          if (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) > 0.025) continue;
        }
        return tiles[hit.instanceId] || null;
      }
      return null;
    }

    function updateScene(delta) {
      const dt = Number.isFinite(delta) ? clamp(delta, 0, 0.05) : 1 / 60;
      buildPool();
      const previousPanX = panX;
      const previousPanY = panY;
      const follow = reduceMotion ? 1 : 1 - Math.exp(-10 * dt);
      if (navigation) {
        // An exact critically damped spring keeps position and velocity continuous on reversal.
        const damping = reduceMotion ? 24 : 9;
        const decay = Math.exp(-damping * dt);
        const offsetX = panX - targetPanX;
        const offsetY = panY - targetPanY;
        const springX = panVelocityX + damping * offsetX;
        const springY = panVelocityY + damping * offsetY;
        panX = targetPanX + (offsetX + springX * dt) * decay;
        panY = targetPanY + (offsetY + springY * dt) * decay;
        panVelocityX = (panVelocityX - damping * springX * dt) * decay;
        panVelocityY = (panVelocityY - damping * springY * dt) * decay;
        navigation.progress = clamp((performance.now() - navigation.started) / navigation.duration, 0, 1);
        const pulse = reduceMotion ? 0 : Math.sin(navigation.progress * Math.PI) ** 2;
        navigationEnvelope += (pulse - navigationEnvelope) * (1 - Math.exp(-18 * dt));
      } else {
        panX += (targetPanX - panX) * follow;
        panY += (targetPanY - panY) * follow;
        panVelocityX = panVelocityY = navigationEnvelope = 0;
      }
      zoom += (targetZoom - zoom) * follow;
      const directionX = navigation ? navigation.directionX : 0;
      const directionY = navigation ? navigation.directionY : 0;
      const cameraEnvelope = navigationEnvelope * (navigation ? navigation.strength : 0);
      const bank = -0.035 + directionX * cameraEnvelope * 0.018;
      camera.up.set(Math.sin(bank), Math.cos(bank), 0);
      camera.position.set((pointerInside && !paused ? pointer.x * 0.12 : 0) + directionX * cameraEnvelope * 0.18,
        (pointerInside && !paused ? pointer.y * 0.08 : 0) + directionY * cameraEnvelope * 0.12,
        baseDistance / zoom * (1 + cameraEnvelope * 0.045));
      camera.lookAt(0, 0, -0.35);
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(pointerPlane, pointerWorld);
      const centerCol = Math.round(-panX / step);
      const centerRow = Math.round(panY / step);
      const usedTextures = new Set();
      const curvature = Math.min(1, zoom * zoom);
      const viewWidth = 2 * baseDistance / zoom * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      const velocityScale = 1 / Math.max(dt, 1 / 240) / viewWidth;
      motionVelocity.set(clamp((panX - previousPanX) * velocityScale, -1, 1),
        clamp((panY - previousPanY) * velocityScale * camera.aspect, -1, 1));
      const travelExtent = (viewWidth * Math.abs(directionX) + viewWidth / camera.aspect * Math.abs(directionY)) * 0.6 + 1;
      const travelFront = navigation ? (navigation.progress * 2 - 1) * travelExtent : 0;
      const travelFollow = reduceMotion ? 1 : 1 - Math.exp(-22 * dt);
      // Broaden the folds as the camera pulls back, instead of repeating tiny
      // ripples across the distant mosaic. Tangents follow this same surface.
      const waveScale = clamp(Math.pow(zoom, 0.6), 0.3, 1.15);
      const depthAmplitude = Math.min(1.65 / waveScale, baseDistance / zoom * 0.19);
      const frequencyX = 0.42 * waveScale;
      const frequencyY = 0.28 * waveScale;
      caseMesh.visible = zoom > 0.55;
      cardMaterial.uniforms.uTime.value = time;
      cardMaterial.uniforms.uDistance.value = camera.position.z;
      for (let slot = 0; slot < tiles.length; slot += 1) {
        const tile = tiles[slot];
        const col = centerCol + tile.col - Math.floor(columns / 2);
        const row = centerRow + tile.row - Math.floor(rows / 2);
        const entry = entries[mod(row * catalogColumns + col, entries.length)];
        if (tile.entry !== entry) {
          if (hovered === tile) setHovered(null);
          tile.entry = entry;
          mapRects.set(atlasRect(entry), slot * 4);
        }
        const x = col * step + panX;
        const y = -row * step + panY;
        const dx = x - pointerWorld.x;
        const dy = y - pointerWorld.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = pointerInside && !dragging ? Math.exp(-distance * distance / 2.2) : 0;
        tile.hover += ((hovered === tile && !dragging ? 1 : 0) - tile.hover) * (reduceMotion ? 1 : 1 - Math.exp(-12 * dt));
        // Intersecting long folds form a continuous fabric of rigid sleeves.
        const phase = x * frequencyX - y * frequencyY + time * 0.19;
        const crossPhase = x * frequencyX * 0.52 + y * frequencyY * 1.35 - time * 0.13;
        const wave = depthAmplitude * (Math.sin(phase) * 0.78 + Math.sin(crossPhase) * 0.22);
        const ribbonLift = Math.sin(phase * 0.75) * 0.09;
        const travelDistance = x * directionX + y * directionY - travelFront;
        const travel = Math.exp(-travelDistance * travelDistance / 1.8) * cameraEnvelope;
        const travelZ = travel * Math.sin(travelDistance * 1.8) * 0.12;
        const travelSlope = travel * (0.216 * Math.cos(travelDistance * 1.8) - travelDistance / 7.5 * Math.sin(travelDistance * 1.8));
        tile.travel += (travel - tile.travel) * travelFollow;
        tile.travelZ += (travelZ - tile.travelZ) * travelFollow;
        tile.travelSlopeX += (travelSlope * directionX - tile.travelSlopeX) * travelFollow;
        tile.travelSlopeY += (travelSlope * directionY - tile.travelSlopeY) * travelFollow;
        const z = (-x * x * 0.014 - y * y * 0.012) * curvature + wave + influence * 0.07 + tile.hover * 0.26 + tile.travelZ;
        const slopeX = -x * 0.028 * curvature + depthAmplitude * frequencyX * (Math.cos(phase) * 0.78 + Math.cos(crossPhase) * 0.1144) - influence * dx * 0.065 + tile.travelSlopeX;
        const slopeY = -y * 0.024 * curvature + depthAmplitude * frequencyY * (-Math.cos(phase) * 0.78 + Math.cos(crossPhase) * 0.297) - influence * dy * 0.065 + tile.travelSlopeY;
        tile.group.position.set(x, y + ribbonLift, z);
        tile.group.rotation.set(Math.atan(slopeY), -Math.atan(slopeX), Math.sin(crossPhase) * 0.035);
        tile.group.scale.setScalar(1 + tile.hover * 0.055);
        tile.group.updateMatrix();
        cardMesh.setMatrixAt(slot, tile.group.matrix);
        if (caseMesh.visible) caseMesh.setMatrixAt(slot, tile.group.matrix);
        const hover = Math.max(tile.hover, influence * 0.55);
        hoverValues.setX(slot, hover);
        travelValues.setX(slot, tile.travel);
        projected.copy(tile.group.position).project(camera);
        const useDetail = zoom > 1.25 && Math.abs(projected.x) < 1.3 && Math.abs(projected.y) < 1.3;
        if (useDetail) {
          usedTextures.add(entry.index);
          if (!tile.detailFace) {
            const material = new T.ShaderMaterial({
              uniforms: { uMap: { value: null }, uTime: { value: 0 }, uHover: { value: 0 }, uTravel: { value: 0 }, uPointer: { value: pointer }, uDistance: { value: 8 } },
              vertexShader: faceVertex, fragmentShader: faceFragment, extensions: { derivatives: true },
              transparent: true, depthWrite: true, side: T.DoubleSide, polygonOffset: true,
              polygonOffsetFactor: -1, polygonOffsetUnits: -1
            });
            tile.detailFace = new T.Mesh(faceGeometry, material);
            tile.detailFace.matrixAutoUpdate = false;
            scene.add(tile.detailFace);
          }
          tile.detailFace.matrix.copy(tile.group.matrix);
          tile.detailFace.material.uniforms.uMap.value = textureFor(entry);
          tile.detailFace.material.uniforms.uHover.value = hover;
          tile.detailFace.material.uniforms.uTravel.value = tile.travel;
          tile.detailFace.material.uniforms.uTime.value = time;
          tile.detailFace.material.uniforms.uDistance.value = camera.position.z;
        } else if (tile.detailFace) {
          scene.remove(tile.detailFace);
          tile.detailFace.material.dispose();
          tile.detailFace = null;
        }
      }
      cardMesh.instanceMatrix.needsUpdate = true;
      if (caseMesh.visible) caseMesh.instanceMatrix.needsUpdate = true;
      mapRects.needsUpdate = true;
      hoverValues.needsUpdate = true;
      travelValues.needsUpdate = true;
      scene.updateMatrixWorld(true);
      const browsing = Math.hypot(targetPanX - panX, targetPanY - panY) > 0.015;
      if (pointerInside && !dragging && !browsing && !paused && !options.coarsePointer) {
        const rect = space.getBoundingClientRect();
        setHovered(pick(rect.left + (pointer.x + 1) * rect.width / 2, rect.top + (1 - pointer.y) * rect.height / 2));
      } else setHovered(null);
      const now = performance.now();
      if (now - lastTexturePrune > 3000 && textures.size > usedTextures.size + 8) {
        lastTexturePrune = now;
        for (const [index, cached] of textures) {
          if (usedTextures.has(index)) continue;
          cached.texture.dispose();
          textures.delete(index);
        }
      }
      if (fluid) fluid.render(scene, camera, dt, motionVelocity, navigation, cameraEnvelope);
      else renderer.render(scene, camera);
      space.dataset.waveZoom = zoom.toFixed(3);
      space.dataset.waveSpacing = String(Math.round((step - 1) * 100));
      space.dataset.waveLod = zoom > 1.25 ? 'detail' : 'atlas';
      space.dataset.waveTransition = navigation ? 'flying' : 'idle';
      if (!caption.hidden && titleShader) titleShader.update(time, pointer, reduceMotion ? 0 : motionVelocity.length());
    }

    function frame(timestamp) {
      raf = 0;
      if (stopped || (paused && !focusTransition) || document.hidden) return;
      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
      lastTimestamp = timestamp;
      if (!reduceMotion && !paused) time += delta;
      updateScene(delta);
      const settling = Math.abs(targetPanX - panX) + Math.abs(targetPanY - panY) + Math.abs(targetZoom - zoom) > 0.001;
      const travelSettling = tiles.some(function (tile) { return Math.abs(tile.travelZ) + Math.abs(tile.travelSlopeX) + Math.abs(tile.travelSlopeY) + tile.travel > 0.001; });
      if (navigation && navigation.progress >= 1 && !settling && !travelSettling && navigationEnvelope < 0.001) {
        navigation = null;
        navigationEnvelope = panVelocityX = panVelocityY = 0;
        panX = targetPanX;
        panY = targetPanY;
        updateScene(0);
      }
      if (!settling && !navigation) focusTransition = false;
      const hoverSettling = tiles.some(function (tile) {
        return Math.abs(tile.hover - (hovered === tile && !dragging ? 1 : 0)) > 0.005;
      });
      if ((!paused && !reduceMotion) || settling || hoverSettling || navigation) ensureFrame();
    }

    function ensureFrame() {
      if (!stopped && (!paused || focusTransition) && !raf && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function focusRelease(index, transitionOptions) {
      const position = entries.findIndex(function (entry) { return entry.index === String(index); });
      if (position < 0 || stopped) return false;
      const centerCol = -targetPanX / step;
      const centerRow = targetPanY / step;
      const rowRadius = Math.ceil(entries.length / catalogColumns) + 1;
      let closest = null;
      // The wall repeats the catalog. Choose the nearest copy, including across its seam.
      for (let row = Math.round(centerRow) - rowRadius; row <= Math.round(centerRow) + rowRadius; row += 1) {
        const repeat = Math.round((row * catalogColumns + centerCol - position) / entries.length);
        const col = position + repeat * entries.length - row * catalogColumns;
        const distance = (col - centerCol) ** 2 + (row - centerRow) ** 2;
        if (!closest || distance < closest.distance) closest = { col: col, row: row, distance: distance };
      }
      const nextPanX = -closest.col * step;
      const nextPanY = closest.row * step;
      const moveX = nextPanX - panX;
      const moveY = nextPanY - panY;
      const moveDistance = Math.hypot(moveX, moveY);
      if (transitionOptions && transitionOptions.animate && moveDistance > 0.001) {
        navigation = {
          started: performance.now(), duration: reduceMotion ? 160 : 950 + Math.min(moveDistance / step, 3) * 60,
          progress: 0, directionX: moveX / moveDistance, directionY: moveY / moveDistance,
          strength: clamp(moveDistance / step, 0.7, 1.3)
        };
      }
      targetPanX = nextPanX;
      targetPanY = nextPanY;
      focusTransition = true;
      pointerInside = false;
      setHovered(null);
      ensureFrame();
      return true;
    }

    function resize() {
      if (stopped) return;
      const rect = space.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      const changed = nextWidth !== width || nextHeight !== height;
      width = nextWidth;
      height = nextHeight;
      if (titleShader) titleShader.invalidate();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
      renderer.setSize(width, height, false);
      if (fluid) fluid.resize(width, height, renderer.getPixelRatio());
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const visibleColumns = clamp(Math.round(width / 175), 3, 10);
      // Keep the gallery framing consistent across viewport sizes.
      baseDistance = visibleColumns * DEFAULT_STEP / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      if (changed || !tiles.length) buildPool();
      updateScene();
      ensureFrame();
    }

    function updatePointer(event) {
      const rect = space.getBoundingClientRect();
      const previousX = pointer.x;
      const previousY = pointer.y;
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      if (fluid) fluid.pointer(pointer.x, pointer.y,
        pointerInside ? (pointer.x - previousX) * 0.5 : 0,
        pointerInside ? (pointer.y - previousY) * 0.5 : 0);
      pointerInside = true;
    }

    function pointerDistance() {
      const points = Array.from(trackedPointers.values());
      return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    }

    function onPointerDown(event) {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      navigation = null;
      navigationEnvelope = panVelocityX = panVelocityY = 0;
      updatePointer(event);
      trackedPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragging = true;
      moved = trackedPointers.size > 1;
      lastX = dragStartX = event.clientX;
      lastY = dragStartY = event.clientY;
      if (trackedPointers.size === 2) { pinchDistance = pointerDistance(); pinchZoom = targetZoom; }
      space.setPointerCapture(event.pointerId);
      space.classList.add('is-dragging');
      setHovered(null);
      event.preventDefault();
      ensureFrame();
    }

    function onPointerMove(event) {
      updatePointer(event);
      if (trackedPointers.has(event.pointerId)) {
        trackedPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (trackedPointers.size > 1) {
          moved = true;
          targetZoom = clamp(pinchZoom * pointerDistance() / Math.max(1, pinchDistance), MIN_ZOOM, MAX_ZOOM);
        } else {
          moved = moved || Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) > 6;
          const worldPerPixel = 2 * (baseDistance / zoom) * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) / height;
          targetPanX += (event.clientX - lastX) * worldPerPixel;
          targetPanY -= (event.clientY - lastY) * worldPerPixel;
          lastX = event.clientX;
          lastY = event.clientY;
        }
        event.preventDefault();
      }
      ensureFrame();
    }

    function openTile(tile) {
      if (!tile || !tile.entry) return;
      projected.copy(tile.group.position).project(camera);
      const side = Math.min(width, height) / 5;
      proxy.style.left = ((projected.x + 1) * width / 2 - side / 2) + 'px';
      proxy.style.top = ((1 - projected.y) * height / 2 - side / 2) + 'px';
      proxy.style.width = proxy.style.height = side + 'px';
      proxy.href = tile.entry.source.getAttribute('href') || '#';
      proxy.dataset.index = tile.entry.index;
      proxyImage.src = tile.entry.url;
      options.onSelect(tile.entry.index, proxy);
    }

    function onPointerUp(event) {
      if (!trackedPointers.has(event.pointerId)) return;
      const shouldOpen = event.type === 'pointerup' && !moved && trackedPointers.size === 1;
      trackedPointers.delete(event.pointerId);
      if (space.hasPointerCapture(event.pointerId)) space.releasePointerCapture(event.pointerId);
      dragging = trackedPointers.size > 0;
      space.classList.toggle('is-dragging', dragging);
      if (shouldOpen) openTile(pick(event.clientX, event.clientY));
      if (dragging) {
        const remaining = Array.from(trackedPointers.values())[0];
        lastX = remaining.x;
        lastY = remaining.y;
      }
      ensureFrame();
    }

    function onPointerLeave() {
      if (dragging) return;
      pointerInside = false;
      setHovered(null);
      ensureFrame();
    }

    function onWheel(event) {
      event.preventDefault();
      navigation = null;
      navigationEnvelope = panVelocityX = panVelocityY = 0;
      updatePointer(event);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
      if (event.ctrlKey || event.metaKey) targetZoom = clamp(targetZoom * Math.exp(-event.deltaY * unit * 0.002), MIN_ZOOM, MAX_ZOOM);
      else {
        const speed = step / 170 / zoom;
        targetPanX -= event.deltaX * unit * speed;
        targetPanY += event.deltaY * unit * speed;
      }
      ensureFrame();
    }

    function onKeyDown(event) {
      if (paused) return;
      const movement = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (movement) { targetPanX += movement[0]; targetPanY += movement[1]; }
      else if (event.key === '+' || event.key === '=') targetZoom = clamp(targetZoom * 1.2, MIN_ZOOM, MAX_ZOOM);
      else if (event.key === '-') targetZoom = clamp(targetZoom / 1.2, MIN_ZOOM, MAX_ZOOM);
      else if (event.key === 'Enter') {
        const rect = space.getBoundingClientRect();
        openTile(hovered || pick(rect.left + rect.width / 2, rect.top + rect.height / 2));
      }
      else return;
      event.preventDefault();
      ensureFrame();
    }

    function onBlur() {
      for (const id of trackedPointers.keys()) {
        if (space.hasPointerCapture(id)) space.releasePointerCapture(id);
      }
      trackedPointers.clear();
      dragging = false;
      pointerInside = false;
      space.classList.remove('is-dragging');
      setHovered(null);
      ensureFrame();
    }

    function onVisibility() {
      lastTimestamp = 0;
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else ensureFrame();
    }

    space.addEventListener('pointerdown', onPointerDown);
    space.addEventListener('pointermove', onPointerMove);
    space.addEventListener('pointerup', onPointerUp);
    space.addEventListener('pointercancel', onPointerUp);
    space.addEventListener('pointerleave', onPointerLeave);
    space.addEventListener('wheel', onWheel, { passive: false });
    space.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    space.dataset.waveEngine = 'three-webgl';

    return {
      resize: resize,
      focusRelease: focusRelease,
      setZoomProgress: function (progress) {
        if (!Number.isFinite(progress) || stopped) return;
        const value = clamp(progress, 0, 1);
        targetZoom = value <= 0.5 ? MIN_ZOOM ** (1 - value * 2) : MAX_ZOOM ** ((value - 0.5) * 2);
        if (paused) focusTransition = true;
        ensureFrame();
      },
      zoomIn: function () { targetZoom = clamp(targetZoom * 1.2, MIN_ZOOM, MAX_ZOOM); ensureFrame(); },
      zoomOut: function () { targetZoom = clamp(targetZoom / 1.2, MIN_ZOOM, MAX_ZOOM); ensureFrame(); },
      setSizeFactor: function () { resize(); },
      setPaused: function (value) {
        paused = !!value;
        lastTimestamp = 0;
        if (paused) {
          cancelAnimationFrame(raf);
          raf = 0;
          caption.hidden = true;
          if (focusTransition) ensureFrame();
        }
        else ensureFrame();
      },
      destroy: function () {
        if (stopped) return;
        stopped = true;
        cancelAnimationFrame(raf);
        onBlur();
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibility);
        for (const tile of tiles) if (tile.detailFace) tile.detailFace.material.dispose();
        for (const cached of textures.values()) cached.texture.dispose();
        textures.clear();
        for (const cached of images.values()) { cached.image.onload = null; cached.callbacks.length = 0; }
        images.clear();
        cardMesh.dispose();
        caseMesh.dispose();
        cardMaterial.dispose();
        atlas.dispose();
        faceGeometry.dispose();
        caseGeometry.dispose();
        caseMaterial.dispose();
        if (titleShader) titleShader.destroy();
        if (fluid) fluid.destroy();
        renderer.dispose();
        renderer.forceContextLoss();
        space.remove();
      }
    };
  }

  window.BassfunkWave3D = { create: create };
})();
