const LOCAL_THREE_URL = 'scripts/vendor/three.min.js';
const FALLBACK_THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.min.js';
const MAX_SPHERES = 72;
const MAX_FLOAT_BALLS = 3;
const DIGIT_STYLES = [
  { rotate: -0.03, scaleX: 1.01, scaleY: 1.04, offsetY: 0.0 },
  { rotate: 0.0, scaleX: 1.0, scaleY: 1.03, offsetY: 0.01 },
  { rotate: -0.01, scaleX: 0.86, scaleY: 1.03, offsetY: 0.0 },
  { rotate: 0.02, scaleX: 1.0, scaleY: 1.04, offsetY: 0.01 }
];

let threeLoaderPromise = null;

function loadThreeScript(src) {
  return new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.year2016Three = 'true';
    script.onload = function () {
      if (window.THREE) resolve(window.THREE);
      else reject(new Error('THREE is unavailable'));
    };
    script.onerror = function () {
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('Failed to load THREE from ' + src));
    };
    document.head.appendChild(script);
  });
}

function ensureThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threeLoaderPromise) return threeLoaderPromise;

  threeLoaderPromise = new Promise(function (resolve, reject) {
    const existingScript = document.querySelector('script[data-year2016-three="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', function () {
        if (window.THREE) resolve(window.THREE);
        else reject(new Error('THREE is unavailable'));
      }, { once: true });
      existingScript.addEventListener('error', function () {
        reject(new Error('Failed to load THREE'));
      }, { once: true });
      return;
    }

    loadThreeScript(LOCAL_THREE_URL)
      .catch(function () {
        return loadThreeScript(FALLBACK_THREE_URL);
      })
      .then(resolve, reject);
  });

  return threeLoaderPromise;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, alpha) {
  return start + (end - start) * alpha;
}

function damp(current, target, lambda, deltaSeconds) {
  return lerp(current, target, 1 - Math.exp(-lambda * deltaSeconds));
}

function smoothMin(a, b, k) {
  if (!Number.isFinite(a)) return b;
  if (!Number.isFinite(b)) return a;
  const safeK = Math.max(0.0001, Number.isFinite(k) ? k : 0.0001);
  const h = clamp(0.5 + 0.5 * (b - a) / safeK, 0, 1);
  return lerp(b, a, h) - safeK * h * (1 - h);
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  if (inMin === inMax) return outMin;
  return outMin + (outMax - outMin) * clamp((value - inMin) / (inMax - inMin), 0, 1);
}

function alphaAt(imageData, width, x, y) {
  if (x < 0 || y < 0 || x >= width) return 0;
  const index = (y * width + x) * 4 + 3;
  return imageData[index] || 0;
}

function sampleGroupPoints(groupPoints, targetCount) {
  if (groupPoints.length <= targetCount) return groupPoints.slice();
  const sampled = [];
  const stride = groupPoints.length / targetCount;
  for (let i = 0; i < targetCount; i += 1) {
    sampled.push(groupPoints[Math.floor(i * stride)]);
  }
  return sampled;
}

function getYearLayoutConfig(viewportWidth, viewportHeight) {
  const rawViewportWidth = Math.max(140, Math.round(viewportWidth || 0));
  const safeViewportWidth = Math.max(320, rawViewportWidth);
  const safeViewportHeight = Math.max(320, Math.round(viewportHeight || 0));
  const aspect = safeViewportWidth / safeViewportHeight;
  const isMobile = safeViewportWidth <= 680;
  const isTablet = !isMobile && safeViewportWidth <= 1180;

  if (isMobile) {
    const widthMix = mapRange(safeViewportWidth, 320, 680, 0, 1);
    const narrowMix = 1 - mapRange(rawViewportWidth, 170, 320, 0, 1);
    return {
      mode: 'mobile',
      cameraZ: lerp(1.66, 1.46, widthMix),
      digitScale: lerp(0.74, 0.9, widthMix),
      bubbleScale: lerp(1.02, 1.05, widthMix),
      weirdness: lerp(0.08, 0.18, 1 - narrowMix),
      warpStrength: lerp(0.08, 0.18, 1 - narrowMix),
      nubStrength: 0,
      styleStrength: 0.02,
      blendStrength: 0.98,
      digitCenters: [
        { x: -0.005, y: 0.82 },
        { x: 0.0, y: 0.24 },
        { x: 0.005, y: -0.28 },
        { x: 0.01, y: -0.86 }
      ],
      floatSpreadX: 0.24,
      floatSpreadY: 0.72,
      floatOffsetY: -0.02,
      floatRadius: 0.024,
      floatBallCount: 1
    };
  }

  if (isTablet) {
    const tabletMix = mapRange(aspect, 0.75, 1.45, 0, 1);
    return {
      mode: 'tablet',
      cameraZ: lerp(1.48, 0.92, tabletMix),
      digitScale: lerp(1.08, 1.16, tabletMix),
      bubbleScale: lerp(1.05, 1.08, tabletMix),
      weirdness: 0.16,
      warpStrength: 0.18,
      nubStrength: 0,
      styleStrength: 0.16,
      blendStrength: 1.02,
      digitCenters: [
        { x: -0.66, y: 0.03 },
        { x: -0.21, y: 0.0 },
        { x: 0.17, y: 0.0 },
        { x: 0.62, y: 0.02 }
      ],
      floatSpreadX: 0.68,
      floatSpreadY: 0.28,
      floatOffsetY: 0.02,
      floatRadius: 0.032,
      floatBallCount: 2
    };
  }

  const desktopMix = mapRange(aspect, 1.2, 2.05, 0, 1);
  return {
    mode: 'desktop',
    cameraZ: lerp(0.92, 0.86, desktopMix),
    digitScale: lerp(1.12, 1.2, desktopMix),
    bubbleScale: lerp(1.06, 1.1, desktopMix),
    weirdness: 0.2,
    warpStrength: 0.22,
    nubStrength: 0,
    styleStrength: 0.2,
    blendStrength: 1.04,
    digitCenters: [
      { x: -0.71, y: 0.03 },
      { x: -0.215, y: 0.0 },
      { x: 0.18, y: 0.0 },
      { x: 0.675, y: 0.015 }
    ],
    floatSpreadX: 0.88,
    floatSpreadY: 0.28,
    floatOffsetY: 0.02,
    floatRadius: 0.036,
    floatBallCount: 3
  };
}

function buildYearSphereLayout(fontFamily, viewportWidth, viewportHeight, usePerformanceMode, layoutConfig) {
  const spheres = [];
  const layout = layoutConfig || getYearLayoutConfig(viewportWidth, viewportHeight);
  const digitCenters = layout.digitCenters || [
    { x: -0.72, y: 0.03 },
    { x: -0.23, y: 0.0 },
    { x: 0.18, y: 0.0 },
    { x: 0.69, y: 0.02 }
  ];
  const digitScale = layout.digitScale || 1;
  const bubbleScale = layout.bubbleScale || 1;
  const weirdness = layout.weirdness == null ? 0.82 : layout.weirdness;
  const warpStrength = layout.warpStrength == null ? 1 : layout.warpStrength;
  const nubStrength = layout.nubStrength == null ? 1 : layout.nubStrength;
  const styleStrength = layout.styleStrength == null ? 1 : layout.styleStrength;
  const blendStrength = layout.blendStrength == null ? 1 : layout.blendStrength;
  const showCenterDot = false;

  function transformDigitPoint(digitIndex, x, y) {
    const center = digitCenters[digitIndex] || { x: 0, y: 0 };
    const style = DIGIT_STYLES[digitIndex] || { rotate: 0, scaleX: 1, scaleY: 1, offsetY: 0 };
    const adjustedScaleX = lerp(1, style.scaleX, styleStrength);
    const adjustedScaleY = lerp(1, style.scaleY, styleStrength);
    const adjustedOffsetY = style.offsetY * styleStrength;
    const adjustedRotate = style.rotate * styleStrength;
    const scaledX = x * adjustedScaleX;
    const scaledY = (y + adjustedOffsetY) * adjustedScaleY;
    const sin = Math.sin(adjustedRotate);
    const cos = Math.cos(adjustedRotate);
    const localWarpX = (
      Math.sin((x * 8.4) + digitIndex * 1.3) * 0.0048 +
      Math.cos((y * 6.8) - digitIndex * 0.9) * 0.0034
    ) * weirdness * warpStrength;
    const localWarpY = (
      Math.cos((x * 5.9) - digitIndex * 1.7) * 0.0042 +
      Math.sin((y * 9.2) + digitIndex * 0.6) * 0.0032
    ) * weirdness * warpStrength;
    const abstractX = scaledX + localWarpX;
    const abstractY = scaledY + localWarpY;
    return {
      x: center.x + (abstractX * cos - abstractY * sin) * digitScale,
      y: center.y + (abstractX * sin + abstractY * cos) * digitScale
    };
  }

  function addSphere(digitIndex, x, y, radius, kValue, seedOffset) {
    const point = transformDigitPoint(digitIndex, x, y);
    const asymmetry = Math.sin(seedOffset * 1.83 + digitIndex * 2.41);
    const squirm = Math.cos(seedOffset * 2.71 - digitIndex * 1.17);
    const warpX = asymmetry * 0.0018 * weirdness * warpStrength * bubbleScale;
    const warpY = squirm * 0.0016 * weirdness * warpStrength * bubbleScale;
    const warpedX = point.x + warpX;
    const warpedY = point.y + warpY;
    const radiusMultiplier = 1 + asymmetry * 0.03 * weirdness + squirm * 0.018 * weirdness;
    const warpedRadius = Math.max(radius * 0.62, radius * radiusMultiplier);
    const warpedKValue = Math.max(0.008, kValue * (1 + squirm * 0.028 * weirdness));
    const z = Math.sin((warpedX + warpedY + digitIndex) * 6.4 + seedOffset * 0.7) * 0.0024 + (digitIndex - 1.5) * 0.003;
    spheres.push({
      type: 'text',
      digitIndex: digitIndex,
      x: warpedX,
      y: warpedY,
      z: z,
      baseX: warpedX,
      baseY: warpedY,
      baseZ: z,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: warpedRadius,
      kValue: warpedKValue,
      seed: seedOffset
    });

    const shouldAddNub = false;
    if (shouldAddNub) {
      const nubAngle = seedOffset * 1.91 + digitIndex * 0.7;
      const nubDistance = warpedRadius * (0.82 + Math.abs(squirm) * 0.28);
      const nubX = warpedX + Math.cos(nubAngle) * nubDistance;
      const nubY = warpedY + Math.sin(nubAngle) * nubDistance * (0.72 + Math.abs(asymmetry) * 0.3);
      const nubZ = z + Math.cos(seedOffset * 1.27) * 0.014;
      spheres.push({
        type: 'text',
        digitIndex: digitIndex,
        x: nubX,
        y: nubY,
        z: nubZ,
        baseX: nubX,
        baseY: nubY,
        baseZ: nubZ,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: warpedRadius * (0.42 + Math.abs(asymmetry) * 0.18) * nubStrength,
        kValue: warpedKValue * (0.82 + Math.abs(squirm) * 0.12),
        seed: seedOffset + 0.173
      });

      if (weirdness > 1.6 && nubStrength > 1.2 && ((Math.floor(seedOffset * 7) + digitIndex) % 3 === 0)) {
        const tailAngle = nubAngle + (asymmetry > 0 ? 0.9 : -0.9);
        const tailDistance = warpedRadius * (1.12 + Math.abs(asymmetry) * 0.38);
        const tailX = warpedX + Math.cos(tailAngle) * tailDistance;
        const tailY = warpedY + Math.sin(tailAngle) * tailDistance * 0.82;
        const tailZ = z - 0.008 + Math.sin(seedOffset * 2.41) * 0.018;
        spheres.push({
          type: 'text',
          digitIndex: digitIndex,
          x: tailX,
          y: tailY,
          z: tailZ,
          baseX: tailX,
          baseY: tailY,
          baseZ: tailZ,
          vx: 0,
          vy: 0,
          vz: 0,
          radius: warpedRadius * (0.26 + Math.abs(squirm) * 0.16) * nubStrength,
          kValue: warpedKValue * 0.7,
          seed: seedOffset + 0.319
        });
      }
    }
  }

  function addStroke(digitIndex, ax, ay, bx, by, steps, radiusStart, radiusEnd, kValue, seedBase) {
    for (let i = 0; i < steps; i += 1) {
      const t = steps <= 1 ? 0 : i / (steps - 1);
      const x = lerp(ax, bx, t);
      const y = lerp(ay, by, t);
      const radius = lerp(radiusStart, radiusEnd, t);
      addSphere(digitIndex, x, y, radius, kValue, seedBase + i * 0.37);
    }
  }

  function addLoop(digitIndex, cx, cy, rx, ry, steps, radius, kValue, startAngle, endAngle, seedBase) {
    for (let i = 0; i < steps; i += 1) {
      const t = steps <= 1 ? 0 : i / (steps - 1);
      const angle = lerp(startAngle, endAngle, t);
      addSphere(
        digitIndex,
        cx + Math.cos(angle) * rx,
        cy + Math.sin(angle) * ry,
        radius,
        kValue,
        seedBase + i * 0.41
      );
    }
  }

  const rMain = 0.058 * bubbleScale;
  const rThin = 0.043 * bubbleScale;
  const rDot = 0.024 * bubbleScale;
  const kMain = 0.05 * bubbleScale * blendStrength;
  const kThin = 0.038 * bubbleScale * blendStrength;

  // 2
  addLoop(0, -0.03, 0.15, 0.15, 0.11, 6, rMain * 1.02, kMain, 3.0, 0.16, 1);
  addStroke(0, 0.112, 0.098, -0.1, -0.074, 4, rMain * 0.92, rThin * 0.94, kMain, 11);
  addStroke(0, -0.118, -0.204, 0.156, -0.204, 4, rThin * 0.98, rMain * 0.9, kThin, 19);

  // 0
  addLoop(1, 0.0, -0.008, 0.14, 0.212, 8, rMain * 0.94, kMain * 0.98, 0.0, Math.PI * 2.0, 31);
  if (showCenterDot) addSphere(1, -0.01, 0.02, rDot * 0.9, kThin * 0.64, 45);

  // 1
  addStroke(2, 0.0, 0.204, 0.0, -0.204, 5, rThin * 0.98, rThin * 0.9, kThin, 51);
  addStroke(2, -0.036, 0.146, 0.032, 0.206, 2, rThin * 0.82, rThin * 0.84, kThin * 0.96, 61);
  addStroke(2, -0.074, -0.206, 0.078, -0.206, 3, rThin * 1.08, rThin * 1.02, kThin, 67);

  // 6
  addLoop(3, -0.01, -0.066, 0.138, 0.178, 8, rMain * 0.92, kMain * 0.98, 0.36, Math.PI * 2.08, 73);
  addStroke(3, 0.092, 0.158, -0.044, 0.06, 4, rThin * 1.02, rThin * 0.82, kThin, 87);
  addSphere(3, -0.058, 0.018, rThin * 0.94, kThin * 0.96, 93);

  return spheres;
}

function buildFloatBalls(textSpheres, count, layoutConfig) {
  const balls = [];
  const layout = layoutConfig || getYearLayoutConfig(0, 0);
  const digitCenters = layout.digitCenters || [
    { x: -0.72, y: 0.03 },
    { x: -0.23, y: 0.0 },
    { x: 0.18, y: 0.0 },
    { x: 0.69, y: 0.02 }
  ];
  const baseRadius = layout.floatRadius || 0.03;
  const clusterCount = Math.max(1, Math.min(MAX_FLOAT_BALLS, Math.round(count || 1)));
  const isMobile = layout.mode === 'mobile';
  const leftX = (digitCenters[0] ? digitCenters[0].x : -0.72) - (isMobile ? 0.02 : 0.08);
  const rightX = (digitCenters[digitCenters.length - 1] ? digitCenters[digitCenters.length - 1].x : 0.69) + (isMobile ? 0.02 : 0.08);
  const pathY = isMobile ? 0.08 : 0.06;
  const sweepY = isMobile ? 0.1 : 0.085;

  for (let i = 0; i < clusterCount; i += 1) {
    const laneMix = clusterCount <= 1 ? 0.5 : i / (clusterCount - 1);
    const phase = i * 1.27;
    const roamX = lerp(leftX, rightX, laneMix);
    const roamY = pathY + Math.sin(phase * 0.7) * (isMobile ? 0.028 : 0.022) + (laneMix - 0.5) * (isMobile ? 0.05 : 0.035);
    const roamZ = 0.14 + Math.cos(phase * 1.03) * 0.026;
    const touchDirection = i % 2 === 0 ? 1 : -1;
    const touchX = roamX + touchDirection * (isMobile ? 0.16 : 0.28);
    const touchY = roamY - sweepY + Math.cos(phase * 0.9) * 0.018;
    const touchZ = 0.094 + Math.sin(phase * 1.11) * 0.014;
    const segmentCount = 4;
    const clusterPhase = i * 0.91;
    const clusterSkew = i % 2 === 0 ? 1 : -1;
    const clusterSpanX = (isMobile ? 0.13 : 0.17) + (i % 2) * 0.035;
    const clusterSpanY = 0.022 + (i % 2) * 0.006;
    const clusterSpanZ = 0.018 + (i % 2) * 0.004;
    const clusterMid = Math.floor(segmentCount * 0.5);

    for (let j = 0; j < segmentCount; j += 1) {
      const t = segmentCount <= 1 ? 0.5 : j / (segmentCount - 1);
      const arc = (t - 0.5) * 2;
      const bulbMix = j === clusterMid ? 1.28 : (j === 0 || j === segmentCount - 1 ? 1.04 : 0.88);
      const bendA = Math.sin(arc * Math.PI * 0.88 + clusterPhase) * 0.024;
      const bendB = Math.cos(arc * Math.PI * 1.24 - clusterPhase * 0.72) * 0.012;
      const localX = arc * clusterSpanX + bendA + clusterSkew * Math.sin(j * 1.3 + clusterPhase) * 0.016;
      const localY = (
        Math.sin(arc * Math.PI * 0.74 - clusterPhase) * clusterSpanY +
        bendB +
        Math.cos(j * 1.46 + i * 0.6) * 0.012
      ) * bulbMix;
      const localZ = (
        Math.cos(arc * Math.PI * 1.04 + clusterPhase * 0.84) * clusterSpanZ +
        Math.sin(j * 1.18 + clusterPhase) * 0.009
      );
      const radius = baseRadius * (
        1.52 +
        Math.cos(j * 1.12 + i * 0.37) * 0.1 +
        (j === clusterMid ? 0.24 : 0.1)
      );
      balls.push({
        type: 'float',
        digitIndex: -1,
        x: roamX + localX,
        y: roamY + localY,
        z: roamZ + localZ,
        baseX: roamX + localX,
        baseY: roamY + localY,
        baseZ: roamZ + localZ,
        roamX: roamX,
        roamY: roamY,
        roamZ: roamZ,
        touchX: touchX,
        touchY: touchY,
        touchZ: touchZ,
        localX: localX,
        localY: localY,
        localZ: localZ,
        travelSpeed: 0.42 + i * 0.05,
        travelOffset: i * 1.19 + j * 0.16,
        orbitX: 0.008 + (j % 2) * 0.002,
        orbitY: 0.006 + ((j + 1) % 2) * 0.0015,
        orbitZ: 0.005 + (j % 3) * 0.0015,
        pulseStrength: 0.0024 + (segmentCount - j) * 0.00036,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: Math.max(baseRadius * 1.24, radius),
        kValue: 0.068 + Math.cos(i * 0.91 + j * 1.17) * 0.003,
        seed: i * 1.347 + j * 0.31 + textSpheres.length * 0.13
      });
    }
  }

  return balls;
}

function createBackgroundCanvas(width, height, variant) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const safeWidth = width || 1440;
  const safeHeight = height || 960;

  if (!ctx) return canvas;

  canvas.width = safeWidth;
  canvas.height = safeHeight;
  ctx.clearRect(0, 0, safeWidth, safeHeight);
  ctx.fillStyle = variant === 2 ? '#040608' : '#05070a';
  ctx.fillRect(0, 0, safeWidth, safeHeight);

  return canvas;
}

function createEnvCanvas(width, height) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const safeWidth = width || 1024;
  const safeHeight = height || 512;

  if (!ctx) return canvas;

  canvas.width = safeWidth;
  canvas.height = safeHeight;
  ctx.clearRect(0, 0, safeWidth, safeHeight);
  ctx.fillStyle = '#07090c';
  ctx.fillRect(0, 0, safeWidth, safeHeight);

  function blobGlow(x, y, radius, color, alpha) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(' + color + ',' + alpha + ')');
    gradient.addColorStop(0.52, 'rgba(' + color + ',' + (alpha * 0.22) + ')');
    gradient.addColorStop(1, 'rgba(' + color + ',0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  blobGlow(safeWidth * 0.16, safeHeight * 0.24, safeWidth * 0.11, '255,255,255', 0.7);
  blobGlow(safeWidth * 0.34, safeHeight * 0.68, safeWidth * 0.08, '210,224,255', 0.34);
  blobGlow(safeWidth * 0.72, safeHeight * 0.19, safeWidth * 0.09, '255,255,255', 0.6);
  blobGlow(safeWidth * 0.82, safeHeight * 0.58, safeWidth * 0.12, '236,245,255', 0.28);

  return canvas;
}

export function createYear2016Scene(options) {
  const settings = options || {};
  const canvasMode = settings.canvasMode;
  const usePerformanceMode = !!settings.usePerformanceMode;
  const fontFamily = settings.fontFamily || '"Saira", sans-serif';

  if (!canvasMode) return null;

  const space = document.createElement('div');
  const canvas = document.createElement('canvas');
  const loader = document.createElement('div');
  const pointer = {
    inside: false,
    active: false,
    down: false,
    id: null,
    x: 0.5,
    y: 0.5,
    worldX: 0,
    worldY: 0,
    vx: 0,
    vy: 0
  };
  const viewport = {
    width: 1,
    height: 1,
    dpr: 1
  };
  let activeLayout = getYearLayoutConfig(canvasMode.clientWidth || window.innerWidth || 0, canvasMode.clientHeight || window.innerHeight || 0);
  const cameraRig = {
    x: 0,
    y: 0,
    z: activeLayout.cameraZ || 0.75,
    lookX: 0,
    lookY: 0
  };

  let destroyed = false;
  let initialized = false;
  let paused = false;
  let rafId = 0;
  let lastTimestamp = 0;
  let renderer = null;
  let scene = null;
  let camera = null;
  let plane = null;
  let planeForward = null;
  let geometry = null;
  let material = null;
  let uniforms = null;
  let sphereTexture = null;
  let sphereData = null;
  let backgroundTexture1 = null;
  let backgroundTexture2 = null;
  let envTexture = null;
  let THREE = null;
  let textSpheres = [];
  let floatBalls = [];
  let allSpheres = [];

  space.className = 'canvas-space canvas-space--2016';
  canvas.className = 'canvas-space__year-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  loader.className = 'canvas-space__year-loader';
  loader.textContent = '';
  space.appendChild(canvas);
  space.appendChild(loader);
  canvasMode.prepend(space);
  setLoaderVisible(false);

  function setLoaderVisible(isVisible) {
    loader.hidden = !isVisible;
    loader.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  }

  function updatePointerWorldFromNormalized() {
    if (!camera) return;
    const aspect = camera.aspect || 1;
    const distance = Math.max(0.001, camera.position.z);
    const halfHeight = Math.tan((camera.fov * Math.PI / 180) * 0.5) * distance;
    const halfWidth = halfHeight * aspect;
    pointer.worldX = camera.position.x + (pointer.x * 2 - 1) * halfWidth;
    pointer.worldY = camera.position.y + (1 - pointer.y * 2) * halfHeight;
  }

  function updatePointerWorldFromClient(clientX, clientY) {
    const prevWorldX = pointer.worldX;
    const prevWorldY = pointer.worldY;
    const rect = canvas.getBoundingClientRect();
    const localX = rect.width ? (clientX - rect.left) / rect.width : 0.5;
    const localY = rect.height ? (clientY - rect.top) / rect.height : 0.5;
    pointer.x = clamp(localX, 0, 1);
    pointer.y = clamp(localY, 0, 1);
    updatePointerWorldFromNormalized();
    pointer.vx = clamp(pointer.worldX - prevWorldX, -0.18, 0.18);
    pointer.vy = clamp(pointer.worldY - prevWorldY, -0.18, 0.18);
  }

  function getMetaballDistanceAtPointer() {
    if (!allSpheres.length) return Number.POSITIVE_INFINITY;

    let minDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < allSpheres.length; i += 1) {
      const sphere = allSpheres[i];
      const dx = pointer.worldX - sphere.x;
      const dy = pointer.worldY - sphere.y;
      const dz = sphere.z;
      const distanceToSphere = Math.sqrt(dx * dx + dy * dy + dz * dz) - sphere.radius;
      minDistance = smoothMin(minDistance, distanceToSphere, sphere.kValue);
    }

    return minDistance;
  }

  function updatePointerInteractionState() {
    if (!pointer.inside) {
      pointer.active = false;
      return;
    }

    const contactPadding = pointer.down ? 0.07 : 0.028;
    pointer.active = getMetaballDistanceAtPointer() <= contactPadding;
  }

  function releasePointer(pointerId) {
    if (pointer.id != null && (pointerId == null || pointer.id === pointerId)) {
      if (space.releasePointerCapture) {
        try {
          space.releasePointerCapture(pointer.id);
        } catch {}
      }
      pointer.id = null;
    }
    pointer.down = false;
    pointer.vx = 0;
    pointer.vy = 0;
    updatePointerInteractionState();
    space.classList.remove('is-dragging');
  }

  function rebuildSphereLayout() {
    activeLayout = getYearLayoutConfig(viewport.width, viewport.height);
    textSpheres = buildYearSphereLayout(fontFamily, viewport.width, viewport.height, usePerformanceMode, activeLayout);
    const floatBallCount = activeLayout.floatBallCount == null
      ? (usePerformanceMode ? 3 : 5)
      : activeLayout.floatBallCount;
    floatBalls = buildFloatBalls(textSpheres, floatBallCount, activeLayout);
    allSpheres = textSpheres.concat(floatBalls).slice(0, MAX_SPHERES);
    if (uniforms) uniforms.u_numSpheres.value = allSpheres.length;
  }

  function rebuildBackgroundTextures() {
    if (!backgroundTexture1 || !backgroundTexture2 || !envTexture) return;
    backgroundTexture1.image = createBackgroundCanvas(1024, 1024, 1);
    backgroundTexture2.image = createBackgroundCanvas(1024, 1024, 2);
    envTexture.image = createEnvCanvas(1024, 512);
    backgroundTexture1.needsUpdate = true;
    backgroundTexture2.needsUpdate = true;
    envTexture.needsUpdate = true;
  }

  function setRayMarchPlaneScale() {
    if (!plane || !camera || !THREE) return;
    const width = camera.near * Math.tan((camera.fov * Math.PI / 180) * 0.5) * camera.aspect * 2;
    const height = width / camera.aspect;
    if (!planeForward) planeForward = new THREE.Vector3();
    camera.getWorldDirection(planeForward);
    plane.scale.set(width, height, 1);
    plane.position.copy(camera.position).addScaledVector(planeForward, camera.near + 0.001);
    plane.quaternion.copy(camera.quaternion);
  }

  function resizeRenderer() {
    const rect = space.getBoundingClientRect();
    viewport.width = Math.max(320, Math.round(rect.width || window.innerWidth || 320));
    viewport.height = Math.max(280, Math.round(rect.height || window.innerHeight || 280));
    viewport.dpr = Math.min(window.devicePixelRatio || 1, usePerformanceMode ? 1 : 1.1);
    activeLayout = getYearLayoutConfig(viewport.width, viewport.height);

    if (camera) {
      cameraRig.z = activeLayout.cameraZ || 0.75;
      camera.position.set(cameraRig.x, cameraRig.y, cameraRig.z);
      camera.aspect = viewport.width / viewport.height;
      camera.updateProjectionMatrix();
      setRayMarchPlaneScale();
    }

    if (renderer) {
      renderer.setPixelRatio(viewport.dpr);
      renderer.setSize(viewport.width, viewport.height, false);
    }

    rebuildSphereLayout();
    rebuildBackgroundTextures();
    updatePointerWorldFromNormalized();
  }

  function updateSphereData(timestamp, deltaSeconds) {
    if (!sphereData || !uniforms) return;

    pointer.vx *= 0.88;
    pointer.vy *= 0.88;
    updatePointerInteractionState();

    for (let i = 0; i < floatBalls.length; i += 1) {
      const sphere = floatBalls[i];
      const travel = timestamp * 0.00028 * sphere.travelSpeed + sphere.travelOffset;
      const glideMix = 0.5 + 0.5 * Math.sin(travel);
      const orbitX = Math.sin(travel * 1.37 + sphere.seed * 0.31) * sphere.orbitX;
      const orbitY = Math.cos(travel * 1.14 - sphere.seed * 0.27) * sphere.orbitY;
      const orbitZ = Math.sin(travel * 1.62 + sphere.seed * 0.43) * sphere.orbitZ;
      const pulse = Math.sin(travel * 1.91 + sphere.seed) * sphere.pulseStrength;
      const centerX = lerp(sphere.roamX, sphere.touchX, glideMix);
      const centerY = lerp(sphere.roamY, sphere.touchY, glideMix);
      const centerZ = lerp(sphere.roamZ, sphere.touchZ, glideMix);
      sphere.floatTargetX = centerX + sphere.localX + orbitX + pulse * 0.16;
      sphere.floatTargetY = centerY + sphere.localY + orbitY + pulse * 0.11;
      sphere.floatTargetZ = centerZ + sphere.localZ + orbitZ;
      sphere.impactMix = glideMix;
      sphere.impactPulse = 0;
    }

    for (let i = 0; i < MAX_SPHERES; i += 1) {
      const offset = i * 4;
      if (i >= allSpheres.length) {
        sphereData[offset] = 999;
        sphereData[offset + 1] = 999;
        sphereData[offset + 2] = 999;
        sphereData[offset + 3] = 0.0001;
        uniforms.u_sphereKValues.value[i] = 0.0001;
        continue;
      }

      const sphere = allSpheres[i];
      let targetX;
      let targetY;
      let targetZ;

      if (
        sphere.type === 'float' &&
        Number.isFinite(sphere.floatTargetX)
      ) {
        targetX = sphere.floatTargetX;
        targetY = sphere.floatTargetY;
        targetZ = sphere.floatTargetZ;
      } else {
        const idleX = Math.sin(timestamp * 0.00044 + sphere.seed) * (sphere.type === 'float' ? 0.014 : 0.0024);
        const idleY = Math.cos(timestamp * 0.00036 + sphere.seed * 0.7) * (sphere.type === 'float' ? 0.011 : 0.0018);
        const idleZ = Math.sin(timestamp * 0.00054 + sphere.seed * 1.1) * (sphere.type === 'float' ? 0.012 : 0.0021);
        targetX = sphere.baseX + idleX;
        targetY = sphere.baseY + idleY;
        targetZ = sphere.baseZ + idleZ;
        if (sphere.type === 'text') {
          const sway = Math.sin(timestamp * 0.0009 + sphere.seed * 0.7 + sphere.digitIndex * 0.9);
          targetX += Math.cos(timestamp * 0.00072 + sphere.seed * 0.5) * 0.0024;
          targetY += sway * 0.0028;
          targetZ += Math.cos(timestamp * 0.001 + sphere.seed) * 0.0016;

          let floatPushX = 0;
          let floatPushY = 0;
          let floatPushZ = 0;
          for (let j = 0; j < floatBalls.length; j += 1) {
            const floatSphere = floatBalls[j];
            const floatX = Number.isFinite(floatSphere.floatTargetX) ? floatSphere.floatTargetX : floatSphere.x;
            const floatY = Number.isFinite(floatSphere.floatTargetY) ? floatSphere.floatTargetY : floatSphere.y;
            const floatZ = Number.isFinite(floatSphere.floatTargetZ) ? floatSphere.floatTargetZ : floatSphere.z;
            const dx = sphere.baseX - floatX;
            const dy = sphere.baseY - floatY;
            const dz = sphere.baseZ - floatZ;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            const reach = sphere.radius + floatSphere.radius + 0.05;
            if (distance >= reach) continue;
            const falloff = 1 - distance / reach;
            const push = falloff * falloff * 0.026;
            floatPushX += (dx / distance) * push;
            floatPushY += (dy / distance) * push * 0.94;
            floatPushZ += falloff * 0.011;
          }

          targetX += floatPushX;
          targetY += floatPushY;
          targetZ += floatPushZ;
        }
      }
      let accelX = (targetX - sphere.x) * (sphere.type === 'float' ? 1.48 : 8.6);
      let accelY = (targetY - sphere.y) * (sphere.type === 'float' ? 1.48 : 8.6);
      let accelZ = (targetZ - sphere.z) * (sphere.type === 'float' ? 1.32 : 6.4);

      if (pointer.active) {
        const dx = sphere.x - pointer.worldX;
        const dy = sphere.y - pointer.worldY;
        const dz = sphere.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const pointerSpeed = Math.min(1.8, Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy) * 26);
        const influence = sphere.type === 'float' ? 0.18 : 0.13;
        const radius = pointer.down ? 0.24 + influence : 0.11 + influence;
        if (distance < radius) {
          const falloff = 1 - distance / radius;
          const forceBase = pointer.down ? 7.8 : 4.2;
          const force = falloff * falloff * forceBase * (1 + pointerSpeed * (pointer.down ? 1.45 : 1.1));
          accelX += (dx / distance) * force + pointer.vx * (pointer.down ? 8.4 : 5.2);
          accelY += (dy / distance) * force + pointer.vy * (pointer.down ? 8.4 : 5.2);
          accelZ += (dz / distance + 0.2) * force * 0.5 + pointerSpeed * 0.24;
        }
      }

      sphere.vx = (sphere.vx + accelX * deltaSeconds) * (sphere.type === 'float' ? 0.974 : 0.925);
      sphere.vy = (sphere.vy + accelY * deltaSeconds) * (sphere.type === 'float' ? 0.974 : 0.925);
      sphere.vz = (sphere.vz + accelZ * deltaSeconds) * (sphere.type === 'float' ? 0.968 : 0.91);
      sphere.x += sphere.vx * deltaSeconds;
      sphere.y += sphere.vy * deltaSeconds;
      sphere.z += sphere.vz * deltaSeconds;

      sphereData[offset] = sphere.x;
      sphereData[offset + 1] = sphere.y;
      sphereData[offset + 2] = sphere.z;
      sphereData[offset + 3] = sphere.radius;
      uniforms.u_sphereKValues.value[i] = sphere.kValue;
    }

    sphereTexture.needsUpdate = true;
  }

  function updateInteractiveCamera(deltaSeconds) {
    if (!camera) return;

    const targetZ = activeLayout.cameraZ || 0.75;

    cameraRig.x = damp(cameraRig.x, 0, 6.4, deltaSeconds);
    cameraRig.y = damp(cameraRig.y, 0, 6.4, deltaSeconds);
    cameraRig.z = damp(cameraRig.z, targetZ, 6.4, deltaSeconds);
    cameraRig.lookX = damp(cameraRig.lookX, 0, 6.4, deltaSeconds);
    cameraRig.lookY = damp(cameraRig.lookY, 0, 6.4, deltaSeconds);

    camera.position.set(cameraRig.x, cameraRig.y, cameraRig.z);
    camera.lookAt(cameraRig.lookX, cameraRig.lookY, 0);
    setRayMarchPlaneScale();
    updatePointerWorldFromNormalized();
  }

  function animateFrame(timestamp) {
    if (destroyed) return;
    rafId = window.requestAnimationFrame(animateFrame);
    if (!initialized || paused || !renderer || !uniforms || !camera) return;

    const deltaMs = lastTimestamp ? Math.min(34, timestamp - lastTimestamp) : 16;
    const deltaSeconds = deltaMs / 1000;
    lastTimestamp = timestamp;

    updateInteractiveCamera(deltaSeconds);
    updateSphereData(timestamp, deltaSeconds);
    uniforms.uTime.value = timestamp * 0.001;
    camera.updateMatrixWorld();
    uniforms.u_camPos.value.copy(camera.position);
    uniforms.u_camToWorldMat.value.copy(camera.matrixWorld);
    uniforms.u_camInvProjMat.value.copy(camera.projectionMatrixInverse);
    renderer.render(scene, camera);
  }

  function renderImmediately(timestamp) {
    if (!renderer || !uniforms || !camera) return;
    updateInteractiveCamera(1 / 60);
    updateSphereData(timestamp, 1 / 60);
    uniforms.uTime.value = timestamp * 0.001;
    camera.updateMatrixWorld();
    uniforms.u_camPos.value.copy(camera.position);
    uniforms.u_camToWorldMat.value.copy(camera.matrixWorld);
    uniforms.u_camInvProjMat.value.copy(camera.projectionMatrixInverse);
    renderer.render(scene, camera);
  }

  function onPointerDown(event) {
    pointer.inside = true;
    updatePointerWorldFromClient(event.clientX, event.clientY);
    updatePointerInteractionState();
    if (!pointer.active) return;
    pointer.down = true;
    pointer.id = event.pointerId;
    updatePointerInteractionState();
    if (space.setPointerCapture) {
      try {
        space.setPointerCapture(event.pointerId);
      } catch {}
    }
    space.classList.add('is-dragging');
    event.preventDefault();
  }

  function onPointerMove(event) {
    pointer.inside = true;
    updatePointerWorldFromClient(event.clientX, event.clientY);
    updatePointerInteractionState();
    if (pointer.active) event.preventDefault();
  }

  function onPointerUp(event) {
    if (pointer.id == null || event.pointerId === pointer.id) {
      releasePointer(event.pointerId);
    }
  }

  function onPointerLeave() {
    if (pointer.down) return;
    pointer.inside = false;
    pointer.active = false;
  }

  function onWindowBlur() {
    pointer.inside = false;
    pointer.active = false;
    releasePointer();
  }

  function disposeThreeObjects() {
    if (plane && scene) scene.remove(plane);
    if (geometry) geometry.dispose();
    if (material) material.dispose();
    if (sphereTexture) sphereTexture.dispose();
    if (backgroundTexture1) backgroundTexture1.dispose();
    if (backgroundTexture2) backgroundTexture2.dispose();
    if (envTexture) envTexture.dispose();
    if (renderer) renderer.dispose();
    geometry = null;
    material = null;
    plane = null;
    planeForward = null;
    sphereTexture = null;
    backgroundTexture1 = null;
    backgroundTexture2 = null;
    envTexture = null;
    renderer = null;
    scene = null;
    camera = null;
    uniforms = null;
  }

  function initThree(nextThree) {
    if (destroyed) return;
    THREE = nextThree;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !usePerformanceMode,
      powerPreference: usePerformanceMode ? 'low-power' : 'high-performance'
    });
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
    cameraRig.x = 0;
    cameraRig.y = 0;
    cameraRig.z = activeLayout.cameraZ || 0.75;
    cameraRig.lookX = 0;
    cameraRig.lookY = 0;
    camera.position.set(cameraRig.x, cameraRig.y, cameraRig.z);

    geometry = new THREE.PlaneGeometry(1, 1);
    sphereData = new Float32Array(MAX_SPHERES * 4);
    sphereTexture = new THREE.DataTexture(
      sphereData,
      MAX_SPHERES,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    sphereTexture.needsUpdate = true;
    sphereTexture.generateMipmaps = false;
    sphereTexture.minFilter = THREE.NearestFilter;
    sphereTexture.magFilter = THREE.NearestFilter;
    sphereTexture.wrapS = THREE.ClampToEdgeWrapping;
    sphereTexture.wrapT = THREE.ClampToEdgeWrapping;

    backgroundTexture1 = new THREE.CanvasTexture(createBackgroundCanvas(1024, 1024, 1));
    backgroundTexture2 = new THREE.CanvasTexture(createBackgroundCanvas(1024, 1024, 2));
    envTexture = new THREE.CanvasTexture(createEnvCanvas(1024, 512));
    [backgroundTexture1, backgroundTexture2, envTexture].forEach(function (texture) {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
    });

    uniforms = {
      u_eps: { value: 0.0012 },
      u_maxDis: { value: 2.2 },
      u_maxSteps: { value: usePerformanceMode ? 88 : 112 },
      u_camPos: { value: camera.position.clone() },
      u_camToWorldMat: { value: camera.matrixWorld.clone() },
      u_camInvProjMat: { value: camera.projectionMatrixInverse.clone() },
      u_numSpheres: { value: 0 },
      u_sphereKValues: { value: Array.from({ length: MAX_SPHERES }, function () { return 0.0001; }) },
      u_sphereTexture: { value: sphereTexture },
      u_backgroundTexture1: { value: backgroundTexture1 },
      u_backgroundTexture2: { value: backgroundTexture2 },
      u_envMap: { value: envTexture },
      u_reflectionReflectionFactor: { value: 1.18 },
      u_refractionFactor: { value: 0.46 },
      u_transparency: { value: 0.08 },
      u_saturation: { value: 1.18 },
      uTime: { value: 0 }
    };

    material = new THREE.ShaderMaterial({
      transparent: false,
      depthTest: false,
      depthWrite: false,
      uniforms: uniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * worldPos;
          vUv = uv;
        }
      `,
      fragmentShader: `
        precision highp float;

        #define MAX_SPHERES ${MAX_SPHERES}

        varying vec2 vUv;

        uniform float u_eps;
        uniform float u_maxDis;
        uniform int u_maxSteps;
        uniform vec3 u_camPos;
        uniform mat4 u_camToWorldMat;
        uniform mat4 u_camInvProjMat;
        uniform int u_numSpheres;
        uniform float u_sphereKValues[MAX_SPHERES];
        uniform sampler2D u_sphereTexture;
        uniform sampler2D u_backgroundTexture1;
        uniform sampler2D u_backgroundTexture2;
        uniform sampler2D u_envMap;
        uniform float u_reflectionReflectionFactor;
        uniform float u_refractionFactor;
        uniform float u_transparency;
        uniform float u_saturation;
        uniform float uTime;

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        vec4 readSphere(int index) {
          return texture2D(u_sphereTexture, vec2((float(index) + 0.5) / float(MAX_SPHERES), 0.5));
        }

        float scene(vec3 p) {
          float minDistance = 1e10;
          for (int i = 0; i < MAX_SPHERES; i++) {
            if (i >= u_numSpheres) break;
            vec4 sphereData = readSphere(i);
            float distanceToSphere = distance(p, sphereData.xyz) - sphereData.w;
            minDistance = smin(minDistance, distanceToSphere, u_sphereKValues[i]);
          }
          return minDistance;
        }

        float rayMarch(vec3 ro, vec3 rd) {
          float travel = 0.0;
          for (int i = 0; i < 220; i++) {
            if (i >= u_maxSteps) break;
            vec3 p = ro + rd * travel;
            float dist = scene(p);
            if (dist < u_eps || travel >= u_maxDis) break;
            travel += dist * 0.96;
          }
          return travel;
        }

        vec3 calcNormal(vec3 p) {
          vec3 e = vec3(u_eps, 0.0, 0.0);
          return normalize(vec3(
            scene(p + e.xyy) - scene(p - e.xyy),
            scene(p + e.yxy) - scene(p - e.yxy),
            scene(p + e.yyx) - scene(p - e.yyx)
          ));
        }

        vec3 adjustSaturation(vec3 color, float saturation) {
          float luminance = dot(color, vec3(0.299, 0.587, 0.114));
          return mix(vec3(luminance), color, saturation);
        }

        float fresnelTerm(vec3 direction, vec3 normalDirection, bool invertTerm) {
          vec3 nDirection = normalize(direction);
          vec3 nNormal = normalize(normalDirection);
          vec3 halfDirection = normalize(nNormal + nDirection);
          float cosine = dot(halfDirection, nDirection);
          float factor = pow(max(cosine, 0.0), 3.0);
          return invertTerm ? 1.0 - factor : factor;
        }

        vec3 sampleBackground(vec2 uv) {
          vec2 drift = vec2(
            sin(uv.y * 8.0 + uTime * 0.3),
            cos(uv.x * 7.0 - uTime * 0.22)
          ) * 0.004;
          vec3 bg1 = texture2D(u_backgroundTexture1, clamp(uv, 0.001, 0.999)).rgb;
          vec3 bg2 = texture2D(u_backgroundTexture2, clamp(uv + drift, 0.001, 0.999)).rgb;
          return mix(bg1, bg2, 0.42);
        }

        void main() {
          vec2 uv = vUv;
          vec3 ro = u_camPos;
          vec3 rd = normalize((u_camInvProjMat * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz);
          rd = normalize((u_camToWorldMat * vec4(rd, 0.0)).xyz);

          vec3 backgroundColor = sampleBackground(uv);
          float dist = rayMarch(ro, rd);

          if (dist >= u_maxDis) {
            gl_FragColor = vec4(backgroundColor, 1.0);
            return;
          }

          vec3 hitPos = ro + dist * rd;
          vec3 n = calcNormal(hitPos);
          vec3 reflectDir = reflect(rd, n);
          vec3 reflectionColor = texture2D(u_envMap, clamp(reflectDir.xy * 0.5 + 0.5, 0.001, 0.999)).rgb;
          vec3 refractDir = refract(rd, n, 1.0 / 1.4);
          vec2 refractedUV = uv;

          if (length(refractDir) > 0.0) {
            refractedUV = clamp(uv + refractDir.xy * 0.15 * u_refractionFactor, 0.001, 0.999);
          }

          vec3 refractedColor = sampleBackground(refractedUV);
          float reflection = fresnelTerm(-rd, n, false);
          float refraction = fresnelTerm(-rd, n, true);
          vec3 mixedGlass = mix(refractedColor, reflectionColor, reflection * u_reflectionReflectionFactor);
          vec3 finalColor = mix(mixedGlass, reflectionColor, reflection * 0.55);
          finalColor = mix(finalColor, refractedColor, u_transparency * refraction);

          vec3 lightA = normalize(vec3(-0.42, 0.74, 0.58));
          vec3 lightB = normalize(vec3(0.83, 0.18, 0.48));
          float specA = pow(max(dot(reflect(-lightA, n), -rd), 0.0), 28.0);
          float specB = pow(max(dot(reflect(-lightB, n), -rd), 0.0), 54.0);
          float diffA = max(dot(n, lightA), 0.0);
          float diffB = max(dot(n, lightB), 0.0);

          finalColor += vec3(1.0) * (specA * 0.75 + specB * 1.08);
          finalColor += reflectionColor * reflection * 0.35;
          finalColor += vec3(0.18, 0.2, 0.22) * (diffA * 0.22 + diffB * 0.14);
          finalColor = adjustSaturation(finalColor, u_saturation);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    planeForward = new THREE.Vector3();
    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    resizeRenderer();
    const initialTimestamp = window.performance && typeof window.performance.now === 'function'
      ? window.performance.now()
      : Date.now();
    renderImmediately(initialTimestamp);
    initialized = true;
    lastTimestamp = initialTimestamp;
    if (space.dataset.yearError) delete space.dataset.yearError;
    space.classList.add('is-ready');
    setLoaderVisible(false);
  }

  function handleInitFailure(error) {
    if (destroyed) return;
    console.error('[2016 effect] Failed to initialize metaball renderer:', error);
    space.dataset.yearError = error && error.message ? String(error.message) : 'unknown';
    setLoaderVisible(true);
  }

  space.addEventListener('pointerdown', onPointerDown);
  space.addEventListener('pointermove', onPointerMove);
  space.addEventListener('pointerup', onPointerUp);
  space.addEventListener('pointercancel', onPointerUp);
  space.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', onWindowBlur);

  rafId = window.requestAnimationFrame(animateFrame);
  ensureThree().then(function (nextThree) {
    try {
      initThree(nextThree);
    } catch (error) {
      handleInitFailure(error);
    }
  }, handleInitFailure);

  return {
    resize: function () {
      if (destroyed || !initialized) return;
      resizeRenderer();
      lastTimestamp = 0;
    },
    zoomIn: function () {},
    zoomOut: function () {},
    setPaused: function (nextValue) {
      paused = !!nextValue;
      if (!paused) lastTimestamp = 0;
    },
    destroy: function () {
      destroyed = true;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      releasePointer();
      window.removeEventListener('blur', onWindowBlur);
      space.removeEventListener('pointerdown', onPointerDown);
      space.removeEventListener('pointermove', onPointerMove);
      space.removeEventListener('pointerup', onPointerUp);
      space.removeEventListener('pointercancel', onPointerUp);
      space.removeEventListener('pointerleave', onPointerLeave);
      disposeThreeObjects();
      if (space.parentNode) space.parentNode.removeChild(space);
    }
  };
}
