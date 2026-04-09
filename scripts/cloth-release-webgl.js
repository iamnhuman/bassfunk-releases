(function () {
  const LOCAL_THREE_URL = 'scripts/vendor/three.min.js';
  const FALLBACK_THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  const TEXTURE_WIDTH = 1024;
  const BASE_CARD_ASPECT = 2.19;
  const DEFAULT_TEXTURE_HEIGHT = Math.round(TEXTURE_WIDTH * BASE_CARD_ASPECT);
  const MAX_TEXTURE_HEIGHT = 4096;
  const PLANE_WIDTH = 1.38;
  const PLANE_HEIGHT = PLANE_WIDTH * BASE_CARD_ASPECT;
  const DEFAULT_AUDIO_VOLUME = 0.72;
  const FOOTER_VIDEO_URL = 'video/2016-seekable.mp4?v=20260408a';
  const DANCER_SCRIPT_URL = 'https://unpkg.com/dancer@0.4.0/dancer.min.js';
  const CLOTH_SEGMENTS_X = 26;
  const CLOTH_SEGMENTS_Y = 38;
  const CLOTH_ITERATIONS = 7;
  const CARD_SWITCH_OUT_MS = 170;
  const CARD_SWITCH_IN_MS = 220;
  const SQUIRCLE_CONTROL_FACTOR = 0.9;
  let threeLoaderPromise = null;
  let dancerLoaderPromise = null;
  let supportsCornerShapeSquircleValue = null;

  function loadThreeScript(src) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.threeRuntime = 'true';
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
      const existingScript = document.querySelector('script[data-three-runtime="true"]');
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

  function loadDancerScript() {
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = DANCER_SCRIPT_URL;
      script.async = true;
      script.dataset.dancerRuntime = 'true';
      script.onload = function () {
        if (window.Dancer) resolve(window.Dancer);
        else reject(new Error('Dancer is unavailable'));
      };
      script.onerror = function () {
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error('Failed to load Dancer from ' + DANCER_SCRIPT_URL));
      };
      document.head.appendChild(script);
    });
  }

  function ensureDancer() {
    if (window.Dancer) return Promise.resolve(window.Dancer);
    if (dancerLoaderPromise) return dancerLoaderPromise;

    dancerLoaderPromise = new Promise(function (resolve, reject) {
      const existingScript = document.querySelector('script[data-dancer-runtime="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', function () {
          if (window.Dancer) resolve(window.Dancer);
          else reject(new Error('Dancer is unavailable'));
        }, { once: true });
        existingScript.addEventListener('error', function () {
          reject(new Error('Failed to load Dancer'));
        }, { once: true });
        return;
      }
      loadDancerScript().then(resolve, reject);
    });

    return dancerLoaderPromise;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(start, end, alpha) {
    return start + (end - start) * alpha;
  }

  function smoothstep(edge0, edge1, value) {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function pointInTriangle(point, a, b, c) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const acx = c.x - a.x;
    const acy = c.y - a.y;
    const apx = point.x - a.x;
    const apy = point.y - a.y;
    const d00 = (abx * abx) + (aby * aby);
    const d01 = (abx * acx) + (aby * acy);
    const d11 = (acx * acx) + (acy * acy);
    const d20 = (apx * abx) + (apy * aby);
    const d21 = (apx * acx) + (apy * acy);
    const denominator = (d00 * d11) - (d01 * d01);
    if (Math.abs(denominator) < 1e-6) return false;
    const v = ((d11 * d20) - (d01 * d21)) / denominator;
    const w = ((d00 * d21) - (d01 * d20)) / denominator;
    const u = 1 - v - w;
    return u >= 0 && v >= 0 && w >= 0;
  }

  function supportsCornerShapeSquircle() {
    if (supportsCornerShapeSquircleValue != null) return supportsCornerShapeSquircleValue;
    try {
      supportsCornerShapeSquircleValue = !!(window.CSS && typeof window.CSS.supports === 'function' && window.CSS.supports('corner-shape', 'squircle'));
    } catch {
      supportsCornerShapeSquircleValue = false;
    }
    return supportsCornerShapeSquircleValue;
  }

  function roundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, Math.min(width, height) * 0.5));
    ctx.beginPath();
    if (!r) {
      ctx.rect(x, y, width, height);
      ctx.closePath();
      return;
    }
    const control = r * SQUIRCLE_CONTROL_FACTOR;
    const inset = r - control;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.bezierCurveTo(
      x + width - r + control, y,
      x + width, y + inset,
      x + width, y + r
    );
    ctx.lineTo(x + width, y + height - r);
    ctx.bezierCurveTo(
      x + width, y + height - r + control,
      x + width - inset, y + height,
      x + width - r, y + height
    );
    ctx.lineTo(x + r, y + height);
    ctx.bezierCurveTo(
      x + r - control, y + height,
      x, y + height - inset,
      x, y + height - r
    );
    ctx.lineTo(x, y + r);
    ctx.bezierCurveTo(
      x, y + r - control,
      x + inset, y,
      x + r, y
    );
    ctx.closePath();
  }

  function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.save();
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
  }

  function strokeRoundedRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth) {
    ctx.save();
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  function measureCardChipWidth(ctx, label, options) {
    const settings = options || {};
    const extraPadding = Number.isFinite(settings.extraPadding) ? settings.extraPadding : 86;
    return Math.ceil(ctx.measureText(String(label || '').trim()).width + extraPadding);
  }

  function fitCoverRect(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    if (!sourceWidth || !sourceHeight || !targetWidth || !targetHeight) {
      return { sx: 0, sy: 0, sw: sourceWidth || 1, sh: sourceHeight || 1 };
    }
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;
    if (sourceRatio > targetRatio) {
      const sw = sourceHeight * targetRatio;
      return {
        sx: (sourceWidth - sw) * 0.5,
        sy: 0,
        sw: sw,
        sh: sourceHeight
      };
    }
    const sh = sourceWidth / targetRatio;
    return {
      sx: 0,
      sy: (sourceHeight - sh) * 0.5,
      sw: sourceWidth,
      sh: sh
    };
  }

  function wrapTextLines(ctx, text, maxWidth, maxLines) {
    const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalizedText) return [];
    const words = normalizedText.split(' ');
    const tokens = [];
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      if (!word) continue;
      if (ctx.measureText(word).width <= maxWidth) {
        tokens.push(word);
        continue;
      }
      let fragment = '';
      for (let charIndex = 0; charIndex < word.length; charIndex += 1) {
        const nextFragment = fragment + word[charIndex];
        if (!fragment || ctx.measureText(nextFragment).width <= maxWidth) {
          fragment = nextFragment;
          continue;
        }
        tokens.push(fragment);
        fragment = word[charIndex];
      }
      if (fragment) tokens.push(fragment);
    }
    const lines = [];
    let currentLine = '';
    let tokenIndex = 0;

    for (; tokenIndex < tokens.length; tokenIndex += 1) {
      const word = tokens[tokenIndex];
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (!currentLine || ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
        continue;
      }
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }

    if (currentLine) lines.push(currentLine);

    if (lines.length > maxLines) {
      lines.length = maxLines;
    }

    const isTruncated = tokenIndex < tokens.length - 1;
    if (lines.length === maxLines && (tokens.length > maxLines || isTruncated)) {
      let lastLine = lines[maxLines - 1];
      while (ctx.measureText(lastLine + '...').width > maxWidth && lastLine.length > 1) {
        lastLine = lastLine.slice(0, -1).trim();
      }
      lines[maxLines - 1] = lastLine + '...';
    }

    return lines;
  }

  function loadImage(url) {
    if (!url) return Promise.resolve(null);
    return new Promise(function (resolve) {
      const image = new Image();
      try {
        const parsed = new URL(url, window.location.href);
        if (/^https?:$/.test(parsed.protocol) && parsed.origin !== window.location.origin) {
          image.crossOrigin = 'anonymous';
        }
      } catch {}
      image.decoding = 'async';
      image.onload = function () {
        resolve(image);
      };
      image.onerror = function () {
        resolve(null);
      };
      image.src = url;
    });
  }

  function waitForImageElement(image) {
    if (
      !image ||
      typeof HTMLImageElement === 'undefined' ||
      !(image instanceof HTMLImageElement)
    ) {
      return Promise.resolve(null);
    }
    if (image.complete) {
      return Promise.resolve(image.naturalWidth > 0 ? image : null);
    }
    return new Promise(function (resolve) {
      let settled = false;
      function finish(result) {
        if (settled) return;
        settled = true;
        image.removeEventListener('load', handleLoad);
        image.removeEventListener('error', handleError);
        resolve(result);
      }
      function handleLoad() {
        finish(image.naturalWidth > 0 ? image : null);
      }
      function handleError() {
        finish(null);
      }
      image.addEventListener('load', handleLoad, { once: true });
      image.addEventListener('error', handleError, { once: true });
      if (typeof image.decode === 'function') {
        image.decode().then(handleLoad).catch(function () {});
      }
    });
  }

  function isSameOriginArtworkUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.origin === window.location.origin || parsed.protocol === 'data:' || parsed.protocol === 'blob:';
    } catch {
      return false;
    }
  }

  function isSameOriginAudioUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') return true;
      if (parsed.protocol === 'file:') return false;
      return parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function resolveArtworkImage(cardData) {
    const artworkElement = cardData && cardData.artworkElement;
    const candidateUrls = [];
    const artworkUrl = cardData && cardData.artworkUrl;
    if (artworkUrl) candidateUrls.push(artworkUrl);
    if (artworkElement && typeof artworkElement.getAttribute === 'function') {
      candidateUrls.push(artworkElement.currentSrc || '');
      candidateUrls.push(artworkElement.src || '');
      candidateUrls.push(artworkElement.getAttribute('src') || '');
    }
    return (async function () {
      if (
        artworkElement &&
        typeof HTMLImageElement !== 'undefined' &&
        artworkElement instanceof HTMLImageElement
      ) {
        const elementUrl = resolveRuntimeUrl(
          artworkElement.currentSrc || artworkElement.src || (artworkElement.getAttribute ? (artworkElement.getAttribute('src') || '') : '')
        );
        if (isSameOriginArtworkUrl(elementUrl)) {
          const resolvedElement = await waitForImageElement(artworkElement);
          if (resolvedElement) return resolvedElement;
        }
      }
      const seenUrls = new Set();
      for (let index = 0; index < candidateUrls.length; index += 1) {
        const candidateUrl = resolveRuntimeUrl(candidateUrls[index]);
        if (!candidateUrl || seenUrls.has(candidateUrl) || !isSameOriginArtworkUrl(candidateUrl)) continue;
        seenUrls.add(candidateUrl);
        const cleanImage = await loadImage(candidateUrl);
        if (cleanImage && cleanImage.naturalWidth > 0) return cleanImage;
      }
      if (
        artworkElement &&
        typeof HTMLImageElement !== 'undefined' &&
        artworkElement instanceof HTMLImageElement &&
        artworkElement.complete &&
        artworkElement.naturalWidth > 0
      ) {
        const elementUrl = resolveRuntimeUrl(
          (artworkElement.currentSrc || artworkElement.src || (artworkElement.getAttribute ? (artworkElement.getAttribute('src') || '') : ''))
        );
        if (isSameOriginArtworkUrl(elementUrl)) {
          return artworkElement;
        }
      }
      return null;
    })();
  }

  function resolveArtworkOverlayUrl(cardData) {
    const artworkElement = cardData && cardData.artworkElement;
    const candidateUrls = [];
    if (cardData && cardData.artworkUrl) candidateUrls.push(cardData.artworkUrl);
    if (artworkElement && typeof artworkElement.getAttribute === 'function') {
      candidateUrls.push(artworkElement.currentSrc || '');
      candidateUrls.push(artworkElement.src || '');
      candidateUrls.push(artworkElement.getAttribute('src') || '');
    }
    for (let index = 0; index < candidateUrls.length; index += 1) {
      const nextUrl = resolveRuntimeUrl(candidateUrls[index]);
      if (nextUrl) return nextUrl;
    }
    return '';
  }

  function resolveRuntimeUrl(url) {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl) return '';
    try {
      return new URL(normalizedUrl, window.location.href).toString();
    } catch {
      return normalizedUrl;
    }
  }

  function shouldUseArtworkDomFallback(cardData) {
    try {
      if (window.location && window.location.protocol === 'file:') return true;
    } catch {}
    const overlayUrl = resolveArtworkOverlayUrl(cardData || {});
    if (!overlayUrl) return false;
    try {
      const parsedUrl = new URL(overlayUrl, window.location.href);
      return parsedUrl.protocol === 'file:';
    } catch {
      return false;
    }
  }

  async function renderArtworkCanvas(cardData, targetWidth, targetHeight, radius) {
    if (shouldUseArtworkDomFallback(cardData)) return null;
    const artworkImage = await resolveArtworkImage(cardData || {});
    if (!artworkImage || !targetWidth || !targetHeight) return null;
    const sourceWidth = artworkImage.naturalWidth || artworkImage.videoWidth || artworkImage.width || 0;
    const sourceHeight = artworkImage.naturalHeight || artworkImage.videoHeight || artworkImage.height || 0;
    if (!sourceWidth || !sourceHeight) return null;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(targetWidth));
    canvas.height = Math.max(1, Math.round(targetHeight));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    roundedRectPath(ctx, 0, 0, canvas.width, canvas.height, Math.max(0, radius));
    ctx.clip();
    const cover = fitCoverRect(sourceWidth, sourceHeight, canvas.width, canvas.height);
    ctx.drawImage(
      artworkImage,
      cover.sx,
      cover.sy,
      cover.sw,
      cover.sh,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();

    return canvas;
  }

  function drawCardChip(ctx, x, y, label, accent, options) {
    const settings = options || {};
    const text = String(label || '').trim();
    if (!text) return 0;
    const height = Number.isFinite(settings.height) ? settings.height : 110;
    const radiusScale = Number.isFinite(settings.radiusScale) ? settings.radiusScale : 0.5;
    const extraPadding = Number.isFinite(settings.extraPadding) ? settings.extraPadding : 86;
    ctx.save();
    ctx.font = '500 50px ' + getCanvasUiFontFamily();
    const width = measureCardChipWidth(ctx, text, { extraPadding: extraPadding });
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, accent || 'rgba(255, 255, 255, 0.16)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    fillRoundedRect(ctx, x, y, width, height, height * radiusScale, gradient);
    strokeRoundedRect(ctx, x, y, width, height, height * radiusScale, 'rgba(255, 255, 255, 0.18)', 2);
    ctx.fillStyle = '#f3f1ea';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width * 0.5 - ctx.measureText(text).width * 0.5, y + height * 0.54);
    ctx.restore();
    return width;
  }

  function getCanvasUiFontFamily() {
    try {
      const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--ui-font').trim();
      if (fontFamily) return fontFamily;
    } catch {}
    return '"Saira", sans-serif';
  }

  async function ensureCanvasFontsLoaded() {
    const uiFontFamily = getCanvasUiFontFamily();
    if (!document.fonts || typeof document.fonts.load !== 'function') return uiFontFamily;
    try {
      await Promise.allSettled([
        document.fonts.load('700 50px ' + uiFontFamily, 'APHEX TWIN'),
        document.fonts.load('500 15px ' + uiFontFamily, 'Computer Controlled Acoustic Instruments pt2 EP'),
        document.fonts.load('500 10px ' + uiFontFamily, 'Spotify')
      ]);
    } catch {}
    return uiFontFamily;
  }

  function measureTextBlockHeight(ctx, text, fallbackFontSize) {
    const metrics = ctx.measureText(String(text || 'M'));
    const ascent = metrics.actualBoundingBoxAscent || fallbackFontSize * 0.82;
    const descent = metrics.actualBoundingBoxDescent || fallbackFontSize * 0.22;
    return Math.max(fallbackFontSize, ascent + descent);
  }

  function drawAudioBlobPanel(ctx, options) {
    const settings = options || {};
    const x = settings.x || 0;
    const y = settings.y || 0;
    const width = settings.width || settings.size || 0;
    const height = settings.height || settings.size || 0;
    const scale = settings.scale || 1;
    const time = Number.isFinite(settings.time) ? settings.time : 0;
    const audioLevel = clamp(Number.isFinite(settings.audioLevel) ? settings.audioLevel : 0, 0, 1);
    const bassLevel = clamp(Number.isFinite(settings.audioBass) ? settings.audioBass : 0, 0, 1);
    const kickLevel = clamp(Number.isFinite(settings.audioKick) ? settings.audioKick : 0, 0, 1);
    const pulse = 1 + audioLevel * 0.07 + bassLevel * 0.08 + kickLevel * 0.06;
    const radius = clamp(Math.min(width, height) * 0.18, 10 * scale, 18 * scale);
    const screenGradient = ctx.createLinearGradient(x, y, x, y + height);
    screenGradient.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    screenGradient.addColorStop(0.08, 'rgba(81, 90, 108, 0.28)');
    screenGradient.addColorStop(0.36, 'rgba(16, 18, 25, 0.48)');
    screenGradient.addColorStop(1, 'rgba(5, 6, 10, 0.72)');
    fillRoundedRect(ctx, x, y, width, height, radius, screenGradient);

    ctx.save();
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
    const glassCore = ctx.createRadialGradient(
      x + width * 0.5,
      y + height * 0.46,
      Math.min(width, height) * 0.04,
      x + width * 0.5,
      y + height * 0.5,
      Math.max(width, height) * 0.58
    );
    glassCore.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    glassCore.addColorStop(0.26, 'rgba(122, 152, 188, 0.07)');
    glassCore.addColorStop(0.64, 'rgba(34, 44, 60, 0.04)');
    glassCore.addColorStop(1, 'rgba(255, 255, 255, 0)');
    fillRoundedRect(ctx, x, y, width, height, radius, glassCore);

    const screenGlow = ctx.createRadialGradient(
      x + width * 0.5,
      y + height * 0.52,
      Math.min(width, height) * 0.02,
      x + width * 0.5,
      y + height * 0.52,
      Math.max(width, height) * 0.68
    );
    screenGlow.addColorStop(0, 'rgba(154, 190, 232, 0.22)');
    screenGlow.addColorStop(0.22, 'rgba(108, 148, 186, 0.10)');
    screenGlow.addColorStop(0.56, 'rgba(45, 59, 82, 0.05)');
    screenGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    fillRoundedRect(ctx, x, y, width, height, radius, screenGlow);

    const screenSheen = ctx.createLinearGradient(x, y, x, y + height);
    screenSheen.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    screenSheen.addColorStop(0.16, 'rgba(255, 255, 255, 0.05)');
    screenSheen.addColorStop(0.44, 'rgba(255, 255, 255, 0.008)');
    screenSheen.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    screenSheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    fillRoundedRect(ctx, x, y, width, height, radius, screenSheen);

    const edgeGlow = ctx.createLinearGradient(x, y, x, y + height);
    edgeGlow.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    edgeGlow.addColorStop(0.24, 'rgba(255, 255, 255, 0.016)');
    edgeGlow.addColorStop(0.72, 'rgba(255, 255, 255, 0.03)');
    edgeGlow.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
    fillRoundedRect(ctx, x, y, width, height, radius, edgeGlow);

    const orbRadius = Math.max(8 * scale, Math.min(width, height) * 0.22 * pulse);
    const orbX = x + width * 0.5 + Math.sin(time * 0.88) * width * (0.022 + bassLevel * 0.014);
    const orbY = y + height * 0.48 + Math.cos(time * 0.72) * height * (0.02 + kickLevel * 0.02);
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, ' + (0.18 + audioLevel * 0.12).toFixed(3) + ')';
    ctx.shadowBlur = Math.max(10 * scale, orbRadius * (0.46 + audioLevel * 0.12));
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
    const orbFill = ctx.createRadialGradient(
      orbX - orbRadius * (0.28 + bassLevel * 0.03),
      orbY - orbRadius * (0.28 + kickLevel * 0.02),
      Math.max(1, orbRadius * 0.08),
      orbX,
      orbY,
      orbRadius
    );
    orbFill.addColorStop(0, 'rgba(255, 255, 255, 0.99)');
    orbFill.addColorStop(0.44, 'rgba(250, 251, 252, 0.98)');
    orbFill.addColorStop(0.72, 'rgba(228, 235, 245, 0.92)');
    orbFill.addColorStop(1, 'rgba(205, 214, 230, 0.7)');
    ctx.fillStyle = orbFill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1, scale * 0.4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(orbX - orbRadius * (0.28 + bassLevel * 0.01), orbY - orbRadius * (0.28 + kickLevel * 0.01), orbRadius * (0.18 + audioLevel * 0.05), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.restore();

    ctx.restore();

    strokeRoundedRect(ctx, x, y, width, height, radius, 'rgba(255, 255, 255, 0.1)', Math.max(1.0, scale * 0.26));
    strokeRoundedRect(ctx, x + scale * 0.6, y + scale * 0.8, width - scale * 1.2, height - scale * 1.6, Math.max(0, radius - scale * 0.7), 'rgba(255, 255, 255, 0.05)', Math.max(0.75, scale * 0.16));

    return {
      x: x,
      y: y,
      width: width,
      height: height,
      radius: radius
    };
  }

  function toViewportPoint(vector, rect) {
    return {
      x: (vector.x * 0.5 + 0.5) * rect.width,
      y: (-vector.y * 0.5 + 0.5) * rect.height
    };
  }

  function createShadowCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(192, 80, 12, 192, 80, 168);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.48)');
    gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0.22)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function createArtworkMaskCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 22, '#ffffff');
    return canvas;
  }

  async function buildCardTextureCanvas(cardData) {
    const canvas = document.createElement('canvas');
    const hotspots = [];
    canvas.width = TEXTURE_WIDTH;
    const scale = canvas.width / 205;
    const padding = 10 * scale;
    const contentInset = 2 * scale;
    const artworkRadius = 14 * scale;
    const contentWidth = canvas.width - padding * 2;
    const artworkX = padding;
    const artworkY = padding;
    const artworkWidth = contentWidth;
    const artworkHeight = artworkWidth;
    const contentX = padding + contentInset;
    const contentTop = artworkY + artworkHeight + 12 * scale;
    const textMaxWidth = contentWidth - 8 * scale;
    const uiFontFamily = await ensureCanvasFontsLoaded();
    const artistFontSize = 14 * scale;
    const titleFontSize = 12 * scale;
    const artistLineHeight = artistFontSize * 0.98;
    const titleLineHeight = titleFontSize * 1.16;
    const artistText = String(cardData && cardData.artistName || '').toUpperCase();
    const useDomArtworkFallback = shouldUseArtworkDomFallback(cardData);
    const hasArtworkCandidate = !!resolveArtworkOverlayUrl(cardData);
    const artworkCanvas = useDomArtworkFallback ? null : await renderArtworkCanvas(cardData, artworkWidth, artworkHeight, artworkRadius);
    const measureCanvas = document.createElement('canvas');
    measureCanvas.width = TEXTURE_WIDTH;
    measureCanvas.height = MAX_TEXTURE_HEIGHT;
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = '500 ' + artistFontSize + 'px ' + uiFontFamily;
    const artistLines = wrapTextLines(measureCtx, artistText, textMaxWidth, 2);
    const artistBlockHeight = Math.max(artistLineHeight, artistLines.length * artistLineHeight);
    measureCtx.font = '400 ' + titleFontSize + 'px ' + uiFontFamily;
    const titleLines = wrapTextLines(measureCtx, cardData && cardData.releaseTitle || '', textMaxWidth, 5);
    const titleY = contentTop + artistBlockHeight + 6 * scale;
    let contentBottom = titleY + titleLines.length * titleLineHeight;
    const bottomPadding = 14 * scale;
    canvas.height = Math.min(MAX_TEXTURE_HEIGHT, Math.ceil(contentBottom + bottomPadding));
    const ctx = canvas.getContext('2d');
    const cardX = 0;
    const cardY = 0;
    const cardWidth = canvas.width;
    const cardHeight = canvas.height;
    const cardRadius = 22 * scale;
    const innerRadius = 17 * scale;
    const artworkRect = {
      x: artworkX,
      y: artworkY,
      width: artworkWidth,
      height: artworkHeight,
      radius: artworkRadius
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const backgroundGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
    backgroundGradient.addColorStop(0, 'rgba(20, 24, 31, 0.98)');
    backgroundGradient.addColorStop(0.52, 'rgba(10, 13, 18, 0.98)');
    backgroundGradient.addColorStop(1, 'rgba(7, 9, 13, 0.99)');
    fillRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius, backgroundGradient);

    ctx.save();
    roundedRectPath(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.clip();

    const warmGlow = ctx.createRadialGradient(cardWidth * 0.18, cardHeight * 0.08, 20, cardWidth * 0.18, cardHeight * 0.08, cardWidth * 0.55);
    warmGlow.addColorStop(0, 'rgba(255, 174, 126, 0.36)');
    warmGlow.addColorStop(0.38, 'rgba(255, 174, 126, 0.12)');
    warmGlow.addColorStop(1, 'rgba(255, 174, 126, 0)');
    ctx.fillStyle = warmGlow;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    const coldGlow = ctx.createRadialGradient(cardWidth * 0.7, cardHeight * 0.24, 20, cardWidth * 0.7, cardHeight * 0.24, cardWidth * 0.72);
    coldGlow.addColorStop(0, 'rgba(109, 174, 255, 0.22)');
    coldGlow.addColorStop(0.42, 'rgba(109, 174, 255, 0.08)');
    coldGlow.addColorStop(1, 'rgba(109, 174, 255, 0)');
    ctx.fillStyle = coldGlow;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    const greenGlow = ctx.createRadialGradient(cardWidth * 0.48, cardHeight * 0.64, 10, cardWidth * 0.48, cardHeight * 0.64, cardWidth * 0.3);
    greenGlow.addColorStop(0, 'rgba(121, 194, 133, 0.18)');
    greenGlow.addColorStop(1, 'rgba(121, 194, 133, 0)');
    ctx.fillStyle = greenGlow;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    const sheenGradient = ctx.createRadialGradient(cardX + cardWidth * 0.28, cardY + cardHeight * 0.1, 30, cardX + cardWidth * 0.28, cardY + cardHeight * 0.1, cardWidth * 0.82);
    sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0.11)');
    sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheenGradient;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

    ctx.globalAlpha = 0.3;
    for (let stripeIndex = 0; stripeIndex < 58; stripeIndex += 1) {
      ctx.fillStyle = stripeIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.042)' : 'rgba(255, 255, 255, 0.016)';
      ctx.fillRect(cardX - 180 + stripeIndex * (5 * scale), cardY, Math.max(1, scale * 0.7), cardHeight);
    }
    ctx.globalAlpha = 1;

    if (useDomArtworkFallback && hasArtworkCandidate) {
      ctx.save();
      roundedRectPath(ctx, artworkX, artworkY, artworkWidth, artworkHeight, artworkRadius);
      ctx.clip();
      ctx.clearRect(artworkX, artworkY, artworkWidth, artworkHeight);
      ctx.restore();
    } else {
      const placeholderGradient = ctx.createLinearGradient(artworkX, artworkY, artworkX + artworkWidth, artworkY + artworkHeight);
      placeholderGradient.addColorStop(0, '#232936');
      placeholderGradient.addColorStop(1, '#0e1219');
      fillRoundedRect(ctx, artworkX, artworkY, artworkWidth, artworkHeight, artworkRadius, placeholderGradient);
    }

    if (artworkCanvas && !useDomArtworkFallback) {
      ctx.drawImage(artworkCanvas, artworkX, artworkY, artworkWidth, artworkHeight);
    }

    const artworkFade = ctx.createLinearGradient(artworkX, artworkY, artworkX, artworkY + artworkHeight);
    artworkFade.addColorStop(0, useDomArtworkFallback && hasArtworkCandidate
      ? 'rgba(255, 255, 255, 0.05)'
      : (artworkCanvas ? 'rgba(255, 255, 255, 0.025)' : (hasArtworkCandidate ? 'rgba(255, 255, 255, 0.028)' : 'rgba(255, 255, 255, 0.04)')));
    artworkFade.addColorStop(0.5, 'rgba(8, 10, 16, 0)');
    artworkFade.addColorStop(1, useDomArtworkFallback && hasArtworkCandidate
      ? 'rgba(8, 10, 16, 0.16)'
      : (artworkCanvas ? 'rgba(8, 10, 16, 0.06)' : (hasArtworkCandidate ? 'rgba(8, 10, 16, 0.045)' : 'rgba(8, 10, 16, 0.1)')));
    ctx.fillStyle = artworkFade;
    fillRoundedRect(ctx, artworkX, artworkY, artworkWidth, artworkHeight, artworkRadius, ctx.fillStyle);

    strokeRoundedRect(ctx, artworkX, artworkY, artworkWidth, artworkHeight, artworkRadius, 'rgba(255, 255, 255, 0.12)', 2);

    ctx.restore();

    strokeRoundedRect(
      ctx,
      cardX + scale * 0.5,
      cardY + scale * 0.5,
      cardWidth - scale,
      cardHeight - scale,
      cardRadius - scale * 0.6,
      'rgba(255, 255, 255, 0.045)',
      Math.max(0.8, scale * 0.24)
    );
    strokeRoundedRect(
      ctx,
      cardX + scale,
      cardY + scale,
      cardWidth - scale * 2,
      cardHeight - scale * 2,
      innerRadius,
      'rgba(255, 255, 255, 0.016)',
      Math.max(0.65, scale * 0.16)
    );

    ctx.save();
    ctx.fillStyle = 'rgba(243, 241, 234, 0.88)';
    ctx.font = '500 ' + artistFontSize + 'px ' + uiFontFamily;
    ctx.textBaseline = 'top';
    for (let artistLineIndex = 0; artistLineIndex < artistLines.length; artistLineIndex += 1) {
      ctx.fillText(artistLines[artistLineIndex], contentX, contentTop + artistLineIndex * artistLineHeight);
    }

    ctx.fillStyle = '#f4f1e8';
    ctx.font = '400 ' + titleFontSize + 'px ' + uiFontFamily;
    ctx.textBaseline = 'top';
    for (let lineIndex = 0; lineIndex < titleLines.length; lineIndex += 1) {
      ctx.fillText(titleLines[lineIndex], contentX, titleY + lineIndex * titleLineHeight);
    }

    ctx.restore();

    return {
      canvas: canvas,
      hotspots: hotspots,
      hasArtwork: !!artworkCanvas,
      usesDomArtwork: useDomArtworkFallback && hasArtworkCandidate,
      artworkRect: artworkRect,
      textureWidth: canvas.width,
      textureHeight: canvas.height,
      cardAspect: canvas.height / canvas.width
    };
  }

  function createWebGLRendererWithFallback(THREE) {
    const attempts = [
      { alpha: true, antialias: true, powerPreference: 'high-performance' },
      { alpha: true, antialias: false, powerPreference: 'default' },
      { alpha: true, antialias: false, powerPreference: 'low-power' }
    ];
    let lastError = null;

    for (let index = 0; index < attempts.length; index += 1) {
      const options = attempts[index];
      try {
        return new THREE.WebGLRenderer(options);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    throw new Error('Unable to create WebGL renderer');
  }

  function createRuntime(options) {
    const viewport = options && options.viewport;
    if (!viewport) throw new Error('Viewport is required');
    const onClose = options && typeof options.onClose === 'function' ? options.onClose : null;
    const onPrev = options && typeof options.onPrev === 'function' ? options.onPrev : null;
    const onNext = options && typeof options.onNext === 'function' ? options.onNext : null;
    const footerOrbCanvas = options && options.footerOrbCanvas && typeof options.footerOrbCanvas.getContext === 'function'
      ? options.footerOrbCanvas
      : null;
    const footerSyncNote = options && options.footerSyncNote && typeof options.footerSyncNote.textContent === 'string'
      ? options.footerSyncNote
      : null;
    const footerRetryButton = options && options.footerRetryButton && typeof options.footerRetryButton.hidden === 'boolean'
      ? options.footerRetryButton
      : null;

    let THREE = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let root = null;
    let artworkDomOverlay = null;
    let clothMesh = null;
    let artworkMesh = null;
    let audioBlobGroup = null;
    let audioBlobMesh = null;
    let audioBlobMaterial = null;
    let audioBlobGlowMesh = null;
    let audioBlobGlowMaterial = null;
    let shadowMesh = null;
    let shadowTexture = null;
    let artworkMaskTexture = null;
    let cardTexture = null;
    let artworkTexture = null;
    let artworkTextureKey = '';
    let cardHotspots = [];
    let raycaster = null;
    let animationFrameId = 0;
    let isActive = false;
    let scenePromise = null;
    let currentArtworkRect = null;
    let currentArtworkOverlayUrl = '';
    let hoveredHotspot = null;
    let currentCardData = null;
    let currentCardSetToken = 0;
    let audioElement = null;
    let dancerInstance = null;
    let kickDetector = null;
    let dancerReady = false;
    let dancerSpectrumReady = false;
    let audioSourceChangeToken = 0;
    let audioContext = null;
    let audioAnalyser = null;
    let audioAnalyserSource = null;
    let audioAnalyserBins = null;
    let audioAnalyserReady = false;
    let footerOrbCtx = null;
    let footerOrbPixelRatio = 1;
    let footerOrbCanvasWidth = 0;
    let footerOrbCanvasHeight = 0;
    let footerVideoElement = null;
    let footerVideoReady = false;
    let footerVideoLastJumpAt = 0;
    let footerVideoRandomState = Math.random() * 997.13;
    let footerVideoPrimed = false;
    let footerVideoPendingTime = -1;
    let footerVideoFlushAfterSeek = false;
    let footerVideoPendingBurstMs = 0;
    let footerVideoBurstTimeoutId = 0;
    let flatCardFallbackElement = null;
    let rendererUnavailable = false;
    const audioPlaybackUrlCache = new Map();

    const pointerNdc = { x: 0, y: 0 };
    const state = {
      time: 0,
      lastTime: 0,
      pointerUvX: 0.5,
      pointerUvY: 0.5,
      pointerTargetUvX: 0.5,
      pointerTargetUvY: 0.5,
      pointerLocalX: 0,
      pointerLocalY: 0,
      pointerLocalZ: 0,
      pointerInfluence: 0,
      pointerTargetInfluence: 0,
      dragActive: false,
      dragPointerId: null,
      dragStartClientX: 0,
      dragStartClientY: 0,
      dragStartPosX: 0,
      dragStartPosY: 0,
      targetPosX: 0,
      targetPosY: 0,
      posX: 0,
      posY: 0,
      velX: 0,
      velY: 0,
      openProgress: 0,
      frameScale: 1,
      cardAspect: BASE_CARD_ASPECT,
      textureWidth: TEXTURE_WIDTH,
      textureHeight: DEFAULT_TEXTURE_HEIGHT,
      frameBaseX: 0,
      frameBaseY: 0.03,
      frameIdleX: 0.05,
      frameIdleY: 0.04,
      pressHotspot: null,
      pressHotspotConsumed: false,
      movedSincePointerDown: false,
      shadowBaseY: -1.44,
      switchPhase: 'idle',
      switchProgress: 0,
      switchDirection: 1,
      switchStartedAt: 0,
      switchDuration: 0,
      audioLevel: 0,
      audioBass: 0,
      audioKick: 0,
      audioKickPulse: 0,
      audioLastSpectrumKickAt: 0,
      audioBlobPanel: null,
      audioBlobPanelFrame: null,
      audioBlobBaseScale: 1
    };

    function setFooterSyncMessage(message, tone, showRetry) {
      if (footerSyncNote) {
        footerSyncNote.textContent = String(message || '');
        if (tone) footerSyncNote.dataset.tone = tone;
        else delete footerSyncNote.dataset.tone;
      }
      if (footerRetryButton) {
        footerRetryButton.hidden = !showRetry;
      }
    }

    function resizeFooterOrbCanvas(canvas, context) {
      if (!canvas || !context) return false;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const canvasWidth = Math.max(1, Math.round(rect.width * pixelRatio));
      const canvasHeight = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
      if (footerOrbCanvasWidth !== canvasWidth || footerOrbCanvasHeight !== canvasHeight || footerOrbPixelRatio !== pixelRatio) {
        footerOrbCanvasWidth = canvasWidth;
        footerOrbCanvasHeight = canvasHeight;
        footerOrbPixelRatio = pixelRatio;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      return true;
    }

    function drawFooterOrbOnly(ctx, options) {
      if (!ctx || !options) return;
      const x = options.x || 0;
      const y = options.y || 0;
      const width = options.width || 0;
      const height = options.height || 0;
      const time = Number.isFinite(options.time) ? options.time : 0;
      const audioLevel = clamp(Number.isFinite(options.audioLevel) ? options.audioLevel : 0, 0, 1);
      const audioBass = clamp(Number.isFinite(options.audioBass) ? options.audioBass : 0, 0, 1);
      const audioKick = clamp(Number.isFinite(options.audioKick) ? options.audioKick : 0, 0, 1);
      const pulse = 1 + audioLevel * 0.12 + audioBass * 0.18 + audioKick * 0.08;
      const radius = Math.min(height * 0.5, 20);
      const orbRadius = Math.max(14, Math.min(height, width) * 0.46 * pulse);
      const orbX = x + width * 0.5 + Math.sin(time * 0.84) * Math.min(12, width * 0.02 + audioBass * 6);
      const orbY = y + height * 0.5 + Math.cos(time * 0.72) * Math.min(8, height * 0.06 + audioKick * 4);

      const panel = ctx.createLinearGradient(x, y, x, y + height);
      panel.addColorStop(0, 'rgba(15, 16, 18, 0.90)');
      panel.addColorStop(1, 'rgba(7, 8, 10, 0.96)');
      fillRoundedRect(ctx, x, y, width, height, radius, panel);

      ctx.save();
      const glow = ctx.createRadialGradient(
        orbX,
        orbY,
        Math.max(2, orbRadius * 0.12),
        orbX,
        orbY,
        orbRadius * 1.7
      );
      glow.addColorStop(0, 'rgba(255, 255, 255, ' + (0.18 + audioLevel * 0.08).toFixed(3) + ')');
      glow.addColorStop(0.42, 'rgba(228, 228, 228, ' + (0.12 + audioBass * 0.05).toFixed(3) + ')');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbRadius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      const rotX = -0.52 + Math.sin(time * 0.34) * 0.16 + audioBass * 0.18;
      const rotY = time * 0.54 + audioLevel * 0.22;
      const rotZ = Math.sin(time * 0.19) * 0.14 + audioKick * 0.08;
      const focal = 2.7;
      const sphereRadius = orbRadius * 0.96;
      const project = function (point) {
        let px = point.x;
        let py = point.y;
        let pz = point.z;
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosZ = Math.cos(rotZ);
        const sinZ = Math.sin(rotZ);
        let y1 = py * cosX - pz * sinX;
        let z1 = py * sinX + pz * cosX;
        py = y1;
        pz = z1;
        let x2 = px * cosY + pz * sinY;
        let z2 = -px * sinY + pz * cosY;
        px = x2;
        pz = z2;
        let x3 = px * cosZ - py * sinZ;
        let y3 = px * sinZ + py * cosZ;
        px = x3;
        py = y3;
        const depth = focal / (focal - pz);
        return {
          x: orbX + px * sphereRadius * depth,
          y: orbY + py * sphereRadius * depth,
          z: pz,
          depth: depth
        };
      };

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.34)';
      ctx.shadowBlur = 8;

      for (let latIndex = -6; latIndex <= 6; latIndex += 1) {
        const lat = (latIndex / 6) * (Math.PI * 0.5);
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        ctx.beginPath();
        for (let step = 0; step <= 64; step += 1) {
          const theta = (step / 64) * Math.PI * 2;
          const point = project({
            x: Math.cos(theta) * cosLat,
            y: sinLat,
            z: Math.sin(theta) * cosLat
          });
          if (step === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.10 + Math.abs(latIndex) * 0.012).toFixed(3) + ')';
        ctx.lineWidth = latIndex === 0 ? 1.25 : 0.9;
        ctx.stroke();
      }

      for (let lonIndex = 0; lonIndex < 10; lonIndex += 1) {
        const longitude = (lonIndex / 10) * Math.PI * 2;
        ctx.beginPath();
        for (let step = -24; step <= 24; step += 1) {
          const lat = (step / 24) * (Math.PI * 0.5);
          const sinLat = Math.sin(lat);
          const cosLat = Math.cos(lat);
          const point = project({
            x: Math.cos(longitude) * cosLat,
            y: sinLat,
            z: Math.sin(longitude) * cosLat
          });
          if (step === -24) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.14 + (lonIndex % 3) * 0.02).toFixed(3) + ')';
        ctx.lineWidth = 0.82;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    function renderFooterOrbFrame() {
      if (!footerOrbCanvas || !footerOrbCanvas.isConnected) return;
      if (footerVideoElement && footerVideoReady) return;
      if (!footerOrbCtx) {
        const nextContext = footerOrbCanvas.getContext('2d');
        if (!nextContext) return;
        footerOrbCtx = nextContext;
      }
      if (!resizeFooterOrbCanvas(footerOrbCanvas, footerOrbCtx)) return;
      const rect = footerOrbCanvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      footerOrbCtx.clearRect(0, 0, rect.width, rect.height);
      drawFooterOrbOnly(footerOrbCtx, {
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
        time: state.time,
        audioLevel: state.audioLevel,
        audioBass: state.audioBass,
        audioKick: state.audioKick
      });
    }

    function ensureFooterVideoElement() {
      if (!footerOrbCanvas || !footerOrbCanvas.parentNode) return null;
      if (footerVideoElement) return footerVideoElement;
      const video = document.createElement('video');
      video.className = 'cloth-release-footer__orb-video';
      video.preload = 'auto';
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = false;
      video.autoplay = false;
      video.playbackRate = 1;
      video.controls = false;
      video.setAttribute('aria-hidden', 'true');
      video.setAttribute('tabindex', '-1');
      video.src = resolveRuntimeUrl(FOOTER_VIDEO_URL);
      video.addEventListener('loadedmetadata', function () {
        footerVideoReady = Number.isFinite(video.duration) && video.duration > 0;
        if (footerOrbCanvas) footerOrbCanvas.style.display = footerVideoReady ? 'none' : '';
      });
      video.addEventListener('canplay', function () {
        footerVideoReady = Number.isFinite(video.duration) && video.duration > 0;
        if (footerOrbCanvas) footerOrbCanvas.style.display = footerVideoReady ? 'none' : '';
        syncFooterVideoPlaybackState();
      });
      video.addEventListener('seeked', function () {
        if (footerVideoPendingTime >= 0) {
          const nextPendingTime = footerVideoPendingTime;
          footerVideoPendingTime = -1;
          seekFooterVideoFrame(nextPendingTime);
          return;
        }
        if (footerVideoFlushAfterSeek) {
          const burstMs = footerVideoPendingBurstMs || 72;
          footerVideoFlushAfterSeek = false;
          footerVideoPendingBurstMs = 0;
          startFooterVideoBurst(burstMs);
          return;
        }
        footerVideoFlushAfterSeek = false;
        syncFooterVideoPlaybackState();
      });
      video.addEventListener('error', function () {
        footerVideoReady = false;
        if (footerOrbCanvas) footerOrbCanvas.style.display = '';
      });
      footerVideoElement = video;
      footerOrbCanvas.insertAdjacentElement('afterend', video);
      return footerVideoElement;
    }

    function clearFooterVideoBurstTimeout() {
      if (!footerVideoBurstTimeoutId) return;
      window.clearTimeout(footerVideoBurstTimeoutId);
      footerVideoBurstTimeoutId = 0;
    }

    function startFooterVideoBurst(durationMs) {
      clearFooterVideoBurstTimeout();
      const video = ensureFooterVideoElement();
      if (!video || !footerVideoReady) return;
      const burstMs = Math.max(40, Math.min(220, Math.round(durationMs || 96)));
      try {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      } catch {}
      footerVideoBurstTimeoutId = window.setTimeout(function () {
        footerVideoBurstTimeoutId = 0;
        try {
          video.pause();
        } catch {}
      }, burstMs);
    }

    function playFooterVideo() {
      const video = ensureFooterVideoElement();
      if (!video || !footerVideoReady) return;
      try {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      } catch {}
    }

    function flushFooterVideoFrame() {
      startFooterVideoBurst(54);
    }

    function syncFooterVideoPlaybackState() {
      const video = ensureFooterVideoElement();
      if (!video || !footerVideoReady) return;
      clearFooterVideoBurstTimeout();
      if (!audioState.isPlaying || !isActive) {
        footerVideoPrimed = false;
        footerVideoPendingTime = -1;
        footerVideoPendingBurstMs = 0;
        footerVideoFlushAfterSeek = false;
        try {
          video.pause();
        } catch {}
        return;
      }

      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!(duration > 0.2)) return;
      if (!footerVideoPrimed) {
        footerVideoPrimed = true;
        seekFooterVideoFrame(pickTimelineFooterVideoTime());
        return;
      }
      try {
        video.pause();
      } catch {}
    }

    function nextFooterVideoRandom() {
      footerVideoRandomState = (footerVideoRandomState * 9301.0 + 49297.0 + 233.0) % 233280.0;
      return footerVideoRandomState / 233280.0;
    }

    function randomizeFooterVideoMilliseconds(duration) {
      const safeDuration = Math.max(0, Number(duration) || 0);
      if (!(safeDuration > 0.2)) return 0;
      const durationMs = Math.max(1, Math.floor(safeDuration * 1000));
      return Math.floor(nextFooterVideoRandom() * durationMs);
    }

    function pickRandomFooterVideoTime(duration) {
      const safeDuration = Math.max(0, Number(duration) || 0);
      if (!(safeDuration > 0.2)) return 0;
      const randomMs = randomizeFooterVideoMilliseconds(safeDuration);
      return clamp(randomMs / 1000, 0, Math.max(0, safeDuration - 0.001));
    }

    function pickTimelineFooterVideoTime() {
      const video = ensureFooterVideoElement();
      if (!video || !footerVideoReady) return 0;
      const videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!(videoDuration > 0.2)) return 0;
      const audioDuration = Number.isFinite(audioState.duration) ? audioState.duration : 0;
      const audioCurrentTime = Number.isFinite(audioState.currentTime) ? audioState.currentTime : 0;
      if (!(audioDuration > 0.2)) {
        return pickRandomFooterVideoTime(videoDuration);
      }
      const progress = clamp(audioCurrentTime / audioDuration, 0, 0.9995);
      return clamp(progress * videoDuration, 0.02, Math.max(0.02, videoDuration - 0.08));
    }

    function seekFooterVideoFrame(targetTime) {
      const video = ensureFooterVideoElement();
      if (!video || !footerVideoReady) return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!(duration > 0.2)) return;
      const safeTargetTime = clamp(targetTime, 0.02, Math.max(0.02, duration - 0.08));
      if (video.seeking) {
        footerVideoPendingTime = safeTargetTime;
        return;
      }
      footerVideoPendingTime = -1;
      footerVideoPrimed = true;
      try {
        video.pause();
        video.currentTime = safeTargetTime;
      } catch {}
    }

    let clothGeometry = null;
    let clothMaterial = null;
    let artworkMaterial = null;
    let clothPoints = [];
    let clothConstraints = [];
    let dragPointIndex = -1;
    let switchPhaseResolve = null;
    const dragTargetLocal = { x: 0, y: 0, z: 0 };
    const audioState = {
      url: '',
      volume: DEFAULT_AUDIO_VOLUME,
      volumePanelOpen: false,
      isPlaying: false,
      available: false,
      autoplayBlocked: false,
      currentTime: 0,
      duration: 0
    };

    function pointIndex(x, y) {
      return y * (CLOTH_SEGMENTS_X + 1) + x;
    }

    function applyRootScale(multiplier) {
      if (!root) return;
      const yScale = state.frameScale * (state.cardAspect / BASE_CARD_ASPECT) * multiplier;
      root.scale.set(state.frameScale * multiplier, yScale, state.frameScale * multiplier);
    }

    function buildClothModel() {
      clothPoints = [];
      clothConstraints = [];
      const halfWidth = PLANE_WIDTH * 0.5;
      const halfHeight = PLANE_HEIGHT * 0.5;

      for (let y = 0; y <= CLOTH_SEGMENTS_Y; y += 1) {
        const v = y / CLOTH_SEGMENTS_Y;
        const baseY = halfHeight - (v * PLANE_HEIGHT);
        const pinStrength = y === 0 ? 1 : y === 1 ? 0.84 : y === 2 ? 0.34 : 0;
        for (let x = 0; x <= CLOTH_SEGMENTS_X; x += 1) {
          const u = x / CLOTH_SEGMENTS_X;
          const baseX = -halfWidth + (u * PLANE_WIDTH);
          clothPoints.push({
            x: baseX,
            y: baseY,
            z: 0,
            prevX: baseX,
            prevY: baseY,
            prevZ: 0,
            baseX: baseX,
            baseY: baseY,
            baseZ: 0,
            pinStrength: pinStrength
          });
        }
      }

      function addConstraint(ax, ay, bx, by, stiffness) {
        if (ax < 0 || ay < 0 || bx < 0 || by < 0 || ax > CLOTH_SEGMENTS_X || bx > CLOTH_SEGMENTS_X || ay > CLOTH_SEGMENTS_Y || by > CLOTH_SEGMENTS_Y) return;
        const a = pointIndex(ax, ay);
        const b = pointIndex(bx, by);
        const pointA = clothPoints[a];
        const pointB = clothPoints[b];
        const dx = pointB.baseX - pointA.baseX;
        const dy = pointB.baseY - pointA.baseY;
        const dz = pointB.baseZ - pointA.baseZ;
        clothConstraints.push({
          a: a,
          b: b,
          rest: Math.sqrt(dx * dx + dy * dy + dz * dz),
          stiffness: stiffness
        });
      }

      for (let y = 0; y <= CLOTH_SEGMENTS_Y; y += 1) {
        for (let x = 0; x <= CLOTH_SEGMENTS_X; x += 1) {
          addConstraint(x, y, x + 1, y, 1);
          addConstraint(x, y, x, y + 1, 1);
          addConstraint(x, y, x + 1, y + 1, 0.76);
          addConstraint(x + 1, y, x, y + 1, 0.76);
          addConstraint(x, y, x + 2, y, 0.42);
          addConstraint(x, y, x, y + 2, 0.42);
        }
      }
    }

    function resetDragState() {
      dragPointIndex = -1;
      dragTargetLocal.x = 0;
      dragTargetLocal.y = 0;
      dragTargetLocal.z = 0;
    }

    function resetClothState() {
      for (let i = 0; i < clothPoints.length; i += 1) {
        const point = clothPoints[i];
        point.x = point.baseX;
        point.y = point.baseY;
        point.z = point.baseZ;
        point.prevX = point.baseX;
        point.prevY = point.baseY;
        point.prevZ = point.baseZ;
      }
      resetDragState();
      if (!clothGeometry) return;
      const positions = clothGeometry.attributes.position.array;
      for (let i = 0; i < clothPoints.length; i += 1) {
        const point = clothPoints[i];
        const offset = i * 3;
        positions[offset] = point.x;
        positions[offset + 1] = point.y;
        positions[offset + 2] = point.z;
      }
      clothGeometry.attributes.position.needsUpdate = true;
      clothGeometry.computeVertexNormals();
    }

    function kickClothForSwitch(direction, amplitude) {
      if (!clothPoints.length) return;
      const switchDirection = direction < 0 ? -1 : 1;
      const strength = Math.max(0, amplitude || 0);
      for (let i = 0; i < clothPoints.length; i += 1) {
        const point = clothPoints[i];
        const hang = clamp((PLANE_HEIGHT * 0.5 - point.baseY) / PLANE_HEIGHT, 0, 1);
        const edge = Math.abs(point.baseX / Math.max(0.001, PLANE_WIDTH * 0.5));
        const weight = (0.16 + hang * 0.84) * (0.34 + edge * 0.66);
        point.prevX = point.x - (switchDirection * strength * weight);
        point.prevY = point.y + (strength * 0.08 * hang);
        point.prevZ = point.z - (strength * 0.72 * (0.2 + hang * 0.8));
      }
    }

    function setSurfaceOpacity(opacity) {
      const nextOpacity = clamp(opacity, 0, 1);
      if (clothMaterial) clothMaterial.opacity = nextOpacity;
      if (artworkMaterial) artworkMaterial.opacity = nextOpacity;
      if (audioBlobMaterial && audioBlobMaterial.uniforms && audioBlobMaterial.uniforms.uOpacity) {
        audioBlobMaterial.uniforms.uOpacity.value = nextOpacity;
      }
    }

    function resetSwitchState() {
      state.switchPhase = 'idle';
      state.switchProgress = 0;
      state.switchDirection = 1;
      state.switchStartedAt = 0;
      state.switchDuration = 0;
      if (switchPhaseResolve) {
        const resolve = switchPhaseResolve;
        switchPhaseResolve = null;
        resolve();
      }
      setSurfaceOpacity(1);
    }

    function runCardSwitchPhase(direction, phase, duration) {
      const switchDirection = direction < 0 ? -1 : 1;
      if (!duration) return Promise.resolve();
      if (switchPhaseResolve) {
        const resolve = switchPhaseResolve;
        switchPhaseResolve = null;
        resolve();
      }
      state.switchPhase = phase;
      state.switchProgress = 0;
      state.switchDirection = switchDirection;
      state.switchStartedAt = (window.performance && typeof window.performance.now === 'function')
        ? window.performance.now()
        : Date.now();
      state.switchDuration = duration;
      kickClothForSwitch(phase === 'out' ? switchDirection : -switchDirection, phase === 'out' ? 0.085 : 0.06);
      if (isActive && !animationFrameId) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
      return new Promise(function (resolve) {
        switchPhaseResolve = resolve;
      });
    }

    function pinClothHeader() {
      for (let i = 0; i < clothPoints.length; i += 1) {
        const point = clothPoints[i];
        if (!point.pinStrength) continue;
        point.x = lerp(point.x, point.baseX, point.pinStrength);
        point.y = lerp(point.y, point.baseY, point.pinStrength);
        point.z = lerp(point.z, point.baseZ, point.pinStrength);
        if (point.pinStrength >= 0.999) {
          point.prevX = point.baseX;
          point.prevY = point.baseY;
          point.prevZ = point.baseZ;
        }
      }
    }

    function solveConstraint(constraint) {
      const pointA = clothPoints[constraint.a];
      const pointB = clothPoints[constraint.b];
      const dx = pointB.x - pointA.x;
      const dy = pointB.y - pointA.y;
      const dz = pointB.z - pointA.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const difference = ((distance - constraint.rest) / distance) * constraint.stiffness;
      const weightA = 1 - pointA.pinStrength;
      const weightB = 1 - pointB.pinStrength;
      const totalWeight = weightA + weightB;
      if (totalWeight <= 0) return;
      const adjustA = weightA / totalWeight;
      const adjustB = weightB / totalWeight;

      pointA.x += dx * difference * adjustA;
      pointA.y += dy * difference * adjustA;
      pointA.z += dz * difference * adjustA;

      pointB.x -= dx * difference * adjustB;
      pointB.y -= dy * difference * adjustB;
      pointB.z -= dz * difference * adjustB;
    }

    function applyDragForce() {
      if (!state.dragActive || dragPointIndex < 0) return;
      const source = clothPoints[dragPointIndex];
      if (!source) return;
      const radius = 0.42;
      for (let i = 0; i < clothPoints.length; i += 1) {
        const point = clothPoints[i];
        const dx = point.baseX - source.baseX;
        const dy = point.baseY - source.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;
        const influence = Math.pow(1 - (distance / radius), 2);
        const resistance = 1 - point.pinStrength * 0.94;
        point.x += (dragTargetLocal.x + dx * 0.08 - point.x) * influence * 0.38 * resistance;
        point.y += (dragTargetLocal.y + dy * 0.04 - point.y) * influence * 0.38 * resistance;
        point.z += ((dragTargetLocal.z * influence) - point.z) * influence * 0.52 * resistance;
      }
    }

    function simulateCloth(delta) {
      if (!clothGeometry || !clothPoints.length) return { bottomDrop: 0, bottomDepth: 0 };
      const dt = Math.min(delta, 1 / 30);
      const forceScale = dt * dt * 18;
      const baseSway = Math.sin(state.time * 0.84) * 0.052 + Math.sin(state.time * 1.42) * 0.018;

      for (let i = 0; i < clothPoints.length; i += 1) {
        const point = clothPoints[i];
        if (point.pinStrength >= 0.999) {
          point.x = point.baseX;
          point.y = point.baseY;
          point.z = point.baseZ;
          point.prevX = point.baseX;
          point.prevY = point.baseY;
          point.prevZ = point.baseZ;
          continue;
        }
        const hang = clamp((PLANE_HEIGHT * 0.5 - point.baseY) / PLANE_HEIGHT, 0, 1);
        const vx = (point.x - point.prevX) * 0.985;
        const vy = (point.y - point.prevY) * 0.985;
        const vz = (point.z - point.prevZ) * 0.985;
        point.prevX = point.x;
        point.prevY = point.y;
        point.prevZ = point.z;

        const sway = baseSway + Math.sin(state.time * 1.24 + point.baseY * 1.7 + point.baseX * 0.6) * 0.018;
        const flutter = Math.sin(state.time * 2.55 + point.baseY * 7.6 + point.baseX * 4.3) * 0.008;
        const billow = Math.cos(state.time * 1.18 + point.baseX * 5.8 - point.baseY * 1.3) * 0.012;

        point.x += vx + sway * (0.16 + hang * 0.84) * forceScale;
        point.y += vy - (0.012 + hang * 0.024) * forceScale * 7.2;
        point.z += vz + (flutter + billow) * (0.22 + hang * 1.05) * forceScale * 2.2;
      }

      applyDragForce();

      for (let iteration = 0; iteration < CLOTH_ITERATIONS; iteration += 1) {
        for (let i = 0; i < clothConstraints.length; i += 1) {
          solveConstraint(clothConstraints[i]);
        }
        pinClothHeader();
        if (state.dragActive) applyDragForce();
      }

      const positions = clothGeometry.attributes.position.array;
      let bottomDrop = 0;
      let bottomDepth = 0;
      let bottomCount = 0;
      for (let i = 0; i < clothPoints.length; i += 1) {
        const point = clothPoints[i];
        const offset = i * 3;
        positions[offset] = point.x;
        positions[offset + 1] = point.y;
        positions[offset + 2] = point.z;
        if (i >= pointIndex(0, CLOTH_SEGMENTS_Y)) {
          bottomDrop += Math.max(0, point.baseY - point.y);
          bottomDepth += Math.abs(point.z);
          bottomCount += 1;
        }
      }
      clothGeometry.attributes.position.needsUpdate = true;
      clothGeometry.computeVertexNormals();

      return {
        bottomDrop: bottomCount ? bottomDrop / bottomCount : 0,
        bottomDepth: bottomCount ? bottomDepth / bottomCount : 0
      };
    }

    function getViewportRect() {
      return viewport.getBoundingClientRect();
    }

    function getWorldSizeAtPlane() {
      const rect = getViewportRect();
      const aspect = rect.width / Math.max(1, rect.height);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const worldHeight = 2 * Math.tan(verticalFov * 0.5) * camera.position.z;
      return {
        width: worldHeight * aspect,
        height: worldHeight
      };
    }

    function openExternalUrl(url) {
      if (!url) return;
      if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.openLink === 'function') {
        window.Telegram.WebApp.openLink(url);
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    function buildTextureCardData(cardData) {
      const payload = Object.assign({}, cardData || {});
      payload.audioState = {
        available: !!payload.audioUrl,
        isPlaying: !!audioState.isPlaying,
        volume: audioState.volume,
        volumePanelOpen: !!audioState.volumePanelOpen,
        currentTime: audioState.currentTime,
        duration: audioState.duration
      };
      return payload;
    }

    function mapTextureRectToPlaneRect(rect, textureWidth, textureHeight, zOffset) {
      if (!rect) return null;
      const resolvedTextureWidth = Math.max(1, textureWidth || TEXTURE_WIDTH);
      const resolvedTextureHeight = Math.max(1, textureHeight || DEFAULT_TEXTURE_HEIGHT);
      const uLeft = rect.x / resolvedTextureWidth;
      const uRight = (rect.x + rect.width) / resolvedTextureWidth;
      const vTop = rect.y / resolvedTextureHeight;
      const vBottom = (rect.y + rect.height) / resolvedTextureHeight;
      const centerX = (rect.x + rect.width * 0.5) / resolvedTextureWidth;
      const centerY = (rect.y + rect.height * 0.5) / resolvedTextureHeight;
      return {
        x: (centerX - 0.5) * PLANE_WIDTH,
        y: (0.5 - centerY) * PLANE_HEIGHT,
        z: zOffset || 0,
        width: PLANE_WIDTH * (rect.width / resolvedTextureWidth),
        height: PLANE_HEIGHT * (rect.height / resolvedTextureHeight),
        uLeft: uLeft,
        uRight: uRight,
        vTop: vTop,
        vBottom: vBottom,
        surfaceOffset: zOffset || 0
      };
    }

    function syncAudioBlobBaseScale() {
      if (state.audioBlobPanel) {
        const panelSize = Math.min(state.audioBlobPanel.width, state.audioBlobPanel.height);
        state.audioBlobBaseScale = clamp(panelSize / 2.42, 0.12, 0.34);
        return;
      }
      state.audioBlobBaseScale = 0.18;
    }

    function buildAudioBlobPanelFrame(panel) {
      if (!THREE || !panel) return null;
      const topLeft = getClothLocalPointAtUv(panel.uLeft, panel.vTop, panel.surfaceOffset || 0);
      const topRight = getClothLocalPointAtUv(panel.uRight, panel.vTop, panel.surfaceOffset || 0);
      const bottomLeft = getClothLocalPointAtUv(panel.uLeft, panel.vBottom, panel.surfaceOffset || 0);
      const bottomRight = getClothLocalPointAtUv(panel.uRight, panel.vBottom, panel.surfaceOffset || 0);
      const center = topLeft.clone()
        .add(topRight)
        .add(bottomLeft)
        .add(bottomRight)
        .multiplyScalar(0.25);
      const rightVector = topRight.clone().sub(topLeft).add(bottomRight.clone().sub(bottomLeft)).multiplyScalar(0.5);
      const downVector = bottomLeft.clone().sub(topLeft).add(bottomRight.clone().sub(topRight)).multiplyScalar(0.5);
      const width = Math.max(0.0001, rightVector.length());
      const height = Math.max(0.0001, downVector.length());
      const right = rightVector.multiplyScalar(1 / width);
      const down = downVector.multiplyScalar(1 / height);
      const up = down.clone().negate();
      const normal = new THREE.Vector3().crossVectors(right, up);
      if (normal.lengthSq() < 0.000001) {
        normal.set(0, 0, 1);
      } else {
        normal.normalize();
      }
      const basis = new THREE.Matrix4().makeBasis(right, up, normal);
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);
      return {
        topLeft: topLeft,
        topRight: topRight,
        bottomLeft: bottomLeft,
        bottomRight: bottomRight,
        center: center,
        width: width,
        height: height,
        right: right,
        up: up,
        down: down,
        normal: normal,
        quaternion: quaternion
      };
    }

    function getAudioBlobFacingNormal(panelFrame) {
      if (!THREE || !panelFrame) return null;
      const facingNormal = panelFrame.normal.clone();
      if (!root || !camera) return facingNormal;
      root.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const cameraWorldPosition = camera.getWorldPosition(new THREE.Vector3());
      const cameraLocalPosition = root.worldToLocal(cameraWorldPosition);
      const toCamera = cameraLocalPosition.sub(panelFrame.center);
      if (toCamera.dot(facingNormal) < 0) {
        facingNormal.negate();
      }
      return facingNormal.normalize();
    }

    function syncAudioBlobPanelState(textureResult) {
      const previousPanel = state.audioBlobPanel;
      const nextPanel = textureResult && textureResult.audioBlobRect
        ? mapTextureRectToPlaneRect(
          textureResult.audioBlobRect,
          textureResult.textureWidth || TEXTURE_WIDTH,
          textureResult.textureHeight || DEFAULT_TEXTURE_HEIGHT,
          0.0035
        )
        : null;
      state.audioBlobPanel = nextPanel;
      state.audioBlobPanelFrame = null;
      syncAudioBlobBaseScale();
      if (audioBlobGroup) audioBlobGroup.visible = !!nextPanel;
      if (!nextPanel) return;
      if (!audioBlobGroup) return;
      const nextPanelFrame = buildAudioBlobPanelFrame(nextPanel);
      state.audioBlobPanelFrame = nextPanelFrame;
      const shouldResetPosition = !previousPanel || (
        Math.abs(previousPanel.x - nextPanel.x) > 0.0001 ||
        Math.abs(previousPanel.y - nextPanel.y) > 0.0001 ||
        Math.abs(previousPanel.width - nextPanel.width) > 0.0001 ||
        Math.abs(previousPanel.height - nextPanel.height) > 0.0001
      );
      if (shouldResetPosition && nextPanelFrame) {
        const resetFacingNormal = getAudioBlobFacingNormal(nextPanelFrame) || nextPanelFrame.normal.clone();
        audioBlobGroup.position.copy(nextPanelFrame.center).add(resetFacingNormal.multiplyScalar(0.0048));
        audioBlobGroup.quaternion.copy(nextPanelFrame.quaternion);
      }
    }

    function syncAudioBlobClipPlanes() {
      if (
        !THREE ||
        !root ||
        !audioBlobMaterial ||
        !state.audioBlobPanel ||
        !Array.isArray(audioBlobMaterial.clippingPlanes) ||
        audioBlobMaterial.clippingPlanes.length < 4
      ) {
        return;
      }
      const panelFrame = state.audioBlobPanelFrame || buildAudioBlobPanelFrame(state.audioBlobPanel);
      if (!panelFrame) return;
      state.audioBlobPanelFrame = panelFrame;
      root.updateMatrixWorld(true);
      const worldQuaternion = root.getWorldQuaternion(new THREE.Quaternion());
      const topLeft = root.localToWorld(panelFrame.topLeft.clone());
      const topRight = root.localToWorld(panelFrame.topRight.clone());
      const bottomLeft = root.localToWorld(panelFrame.bottomLeft.clone());
      const bottomRight = root.localToWorld(panelFrame.bottomRight.clone());
      const worldNormal = panelFrame.normal.clone().applyQuaternion(worldQuaternion).normalize();
      const leftEdge = bottomLeft.clone().sub(topLeft).normalize();
      const rightEdge = bottomRight.clone().sub(topRight).normalize();
      const topEdge = topRight.clone().sub(topLeft).normalize();
      const bottomEdge = bottomRight.clone().sub(bottomLeft).normalize();
      const leftNormal = new THREE.Vector3().crossVectors(leftEdge, worldNormal).normalize();
      const rightNormal = new THREE.Vector3().crossVectors(worldNormal, rightEdge).normalize();
      const topNormal = new THREE.Vector3().crossVectors(worldNormal, topEdge).normalize();
      const bottomNormal = new THREE.Vector3().crossVectors(bottomEdge, worldNormal).normalize();
      const clipPadding = Math.min(panelFrame.width, panelFrame.height) * 0.08;
      audioBlobMaterial.clippingPlanes[0].setFromNormalAndCoplanarPoint(leftNormal, topLeft.clone().add(leftNormal.clone().multiplyScalar(clipPadding)));
      audioBlobMaterial.clippingPlanes[1].setFromNormalAndCoplanarPoint(rightNormal, topRight.clone().add(rightNormal.clone().multiplyScalar(clipPadding)));
      audioBlobMaterial.clippingPlanes[2].setFromNormalAndCoplanarPoint(topNormal, topLeft.clone().add(topNormal.clone().multiplyScalar(clipPadding)));
      audioBlobMaterial.clippingPlanes[3].setFromNormalAndCoplanarPoint(bottomNormal, bottomLeft.clone().add(bottomNormal.clone().multiplyScalar(clipPadding)));
    }

    function applyTextureResult(textureResult) {
      if (!textureResult) return;
      cardHotspots = Array.isArray(textureResult.hotspots) ? textureResult.hotspots.slice() : [];
      state.textureWidth = textureResult.textureWidth || TEXTURE_WIDTH;
      state.textureHeight = textureResult.textureHeight || DEFAULT_TEXTURE_HEIGHT;
      state.cardAspect = textureResult.cardAspect || (state.textureHeight / Math.max(1, state.textureWidth));
      syncAudioBlobPanelState(textureResult);
      updateFlatCardFallback(textureResult);
      if (!THREE || !renderer) return;
      const nextTexture = new THREE.CanvasTexture(textureResult.canvas);
      if ('colorSpace' in nextTexture) {
        nextTexture.colorSpace = THREE.SRGBColorSpace;
      } else if ('encoding' in nextTexture) {
        nextTexture.encoding = THREE.sRGBEncoding;
      }
      nextTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
      nextTexture.needsUpdate = true;

      if (cardTexture) cardTexture.dispose();
      cardTexture = nextTexture;
      if (clothMaterial) {
        clothMaterial.map = cardTexture;
        clothMaterial.needsUpdate = true;
      }
    }

    function syncAudioPlaybackState() {
      audioState.isPlaying = !!(audioElement && !audioElement.paused && !audioElement.ended);
      syncFooterVideoPlaybackState();
    }

    function syncAudioTimelineState() {
      if (!audioElement) return;
      audioState.currentTime = Number.isFinite(audioElement.currentTime) ? Math.max(0, audioElement.currentTime) : 0;
      audioState.duration = Number.isFinite(audioElement.duration) && audioElement.duration > 0 ? audioElement.duration : 0;
      if (audioState.isPlaying && isActive) {
        syncFooterVideoToAudioTimeline(false);
      }
    }

    async function ensureAudioAnalyser() {
      if (!audioElement) return false;
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (typeof AudioContextCtor !== 'function') return false;
      try {
        if (!audioContext) {
          audioContext = new AudioContextCtor();
        }
        if (!audioAnalyser) {
          audioAnalyser = audioContext.createAnalyser();
          audioAnalyser.fftSize = 512;
          audioAnalyser.smoothingTimeConstant = 0.76;
        }
        if (!audioAnalyserSource) {
          audioAnalyserSource = audioContext.createMediaElementSource(audioElement);
          audioAnalyserSource.connect(audioAnalyser);
          audioAnalyser.connect(audioContext.destination);
        }
        if (!audioAnalyserBins || audioAnalyserBins.length !== audioAnalyser.frequencyBinCount) {
          audioAnalyserBins = new Uint8Array(audioAnalyser.frequencyBinCount);
        }
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        audioAnalyserReady = true;
        return true;
      } catch (error) {
        audioAnalyserReady = false;
        console.warn('Web Audio analyser is unavailable.', error);
        return false;
      }
    }

    function readAudioAnalyserSpectrum() {
      if (!audioAnalyserReady || !audioAnalyser || !audioAnalyserBins || !audioState.isPlaying) return null;
      try {
        audioAnalyser.getByteFrequencyData(audioAnalyserBins);
        return audioAnalyserBins;
      } catch {
        return null;
      }
    }

    async function resolveAudioPlaybackUrl(url) {
      const normalizedUrl = resolveRuntimeUrl(url);
      if (!normalizedUrl) return '';
      if (!isSameOriginAudioUrl(normalizedUrl)) return normalizedUrl;
      try {
        const parsed = new URL(normalizedUrl, window.location.href);
        if (parsed.protocol === 'blob:' || parsed.protocol === 'data:' || parsed.protocol === 'file:') {
          return normalizedUrl;
        }
      } catch {
        return normalizedUrl;
      }
      if (audioPlaybackUrlCache.has(normalizedUrl)) {
        return audioPlaybackUrlCache.get(normalizedUrl) || normalizedUrl;
      }
      try {
        const response = await fetch(normalizedUrl, {
          credentials: 'same-origin'
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const audioBlob = await response.blob();
        const objectUrl = URL.createObjectURL(audioBlob);
        audioPlaybackUrlCache.set(normalizedUrl, objectUrl);
        return objectUrl;
      } catch (error) {
        console.warn('Failed to resolve audio via blob URL.', error);
        return normalizedUrl;
      }
    }

    function ensureAudioElement() {
      if (audioElement) return audioElement;
      audioElement = document.createElement('audio');
      audioElement.preload = 'auto';
      audioElement.loop = false;
      audioElement.playsInline = true;
      audioElement.defaultMuted = false;
      audioElement.muted = false;
      audioElement.volume = audioState.volume;
      audioElement.style.display = 'none';
      audioElement.setAttribute('aria-hidden', 'true');
      if (document.body && !audioElement.isConnected) {
        document.body.appendChild(audioElement);
      }
      audioElement.addEventListener('play', syncAudioPlaybackState);
      audioElement.addEventListener('playing', syncAudioPlaybackState);
      audioElement.addEventListener('pause', syncAudioPlaybackState);
      audioElement.addEventListener('ended', syncAudioPlaybackState);
      audioElement.addEventListener('canplay', syncAudioTimelineState);
      audioElement.addEventListener('canplaythrough', syncAudioTimelineState);
      audioElement.addEventListener('loadeddata', syncAudioTimelineState);
      audioElement.addEventListener('timeupdate', syncAudioTimelineState);
      audioElement.addEventListener('loadedmetadata', syncAudioTimelineState);
      audioElement.addEventListener('durationchange', syncAudioTimelineState);
      audioElement.addEventListener('seeked', syncAudioTimelineState);
      audioElement.addEventListener('volumechange', function () {
        if (!audioElement) return;
        audioState.volume = clamp(audioElement.volume, 0, 1);
      });
      audioElement.addEventListener('error', function () {
        audioState.isPlaying = false;
        audioState.autoplayBlocked = false;
        audioState.currentTime = 0;
        audioState.duration = 0;
        resetAudioReactiveState();
        setFooterSyncMessage('The audio file could not be loaded for this release.', 'error', false);
      });
      return audioElement;
    }

    function resetAudioReactiveState() {
      state.audioLevel = 0;
      state.audioBass = 0;
      state.audioKick = 0;
      state.audioKickPulse = 0;
      state.audioLastSpectrumKickAt = 0;
    }

    function handleDetectedKick(magnitude) {
      const now = (window.performance && typeof window.performance.now === 'function')
        ? window.performance.now()
        : Date.now();
      const kickStrength = clamp(Number.isFinite(magnitude) ? magnitude : 0.4, 0.18, 1);
      state.audioKickPulse = Math.max(state.audioKickPulse, kickStrength);
      if (!audioState.isPlaying || !isActive) return;
      const video = ensureFooterVideoElement();
      if (!video || !footerVideoReady) return;
      if (now - footerVideoLastJumpAt < 72) return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!(duration > 1.2)) return;
      const baseTime = pickTimelineFooterVideoTime();
      const jumpWindow = Math.max(0.08, Math.min(0.42, duration * 0.16));
      footerVideoRandomState += kickStrength * 37.1 + audioState.currentTime * 0.91 + now * 0.0001;
      const kickOffset = (nextFooterVideoRandom() - 0.5) * jumpWindow * (0.55 + kickStrength * 0.85);
      footerVideoPendingBurstMs = Math.round(72 + kickStrength * 72);
      footerVideoFlushAfterSeek = true;
      seekFooterVideoFrame(clamp(baseTime + kickOffset, 0.02, Math.max(0.02, duration - 0.08)));
      footerVideoLastJumpAt = now;
    }

    function syncFooterVideoToAudioTimeline(forceBurst) {
      const video = ensureFooterVideoElement();
      if (!video || !footerVideoReady || !audioState.available) return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!(duration > 0.2)) return;
      const targetTime = pickTimelineFooterVideoTime();
      const currentVideoTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      if (!forceBurst && Math.abs(currentVideoTime - targetTime) < 0.045) return;
      footerVideoPendingBurstMs = forceBurst ? 72 : 0;
      footerVideoFlushAfterSeek = !!forceBurst;
      seekFooterVideoFrame(targetTime);
    }

    async function ensureKickDetector() {
      if (!audioElement || !audioState.available) return false;
      try {
        const DancerCtor = await ensureDancer();
        if (!DancerCtor || typeof DancerCtor !== 'function') {
          setFooterSyncMessage('Track loaded, but Dancer.js is unavailable.', 'muted', false);
          return false;
        }
        if (typeof DancerCtor.isSupported === 'function' && !DancerCtor.isSupported()) {
          setFooterSyncMessage('Track plays, but this browser cannot run Dancer.js kick detection.', 'muted', false);
          return false;
        }
        if (!dancerInstance) {
          dancerInstance = new DancerCtor();
          dancerInstance.load(audioElement);
        }
        dancerSpectrumReady = true;
        if (!kickDetector && typeof dancerInstance.createKick === 'function') {
          kickDetector = dancerInstance.createKick({
            frequency: [0, 12],
            threshold: 0.18,
            decay: 0.025,
            onKick: function (mag) {
              handleDetectedKick(mag);
            }
          });
        }
        if (kickDetector && typeof kickDetector.on === 'function') {
          kickDetector.on();
        }
        if (audioState.isPlaying && typeof dancerInstance.play === 'function') {
          try {
            dancerInstance.play();
          } catch {}
        }
        dancerReady = true;
        setFooterSyncMessage('Dancer.js kick sync is active.', '', false);
        return true;
      } catch (error) {
        console.warn('Dancer.js kick detection is unavailable.', error);
        dancerReady = false;
        setFooterSyncMessage('Track plays, but kick detection could not start.', 'error', false);
        return false;
      }
    }

    function readDancerSpectrum() {
      if (!dancerSpectrumReady || !dancerInstance || !audioState.isPlaying) return null;
      try {
        const spectrum = dancerInstance.getSpectrum();
        return spectrum && typeof spectrum.length === 'number' && spectrum.length ? spectrum : null;
      } catch {
        return null;
      }
    }

    async function startAudioPlayback() {
      if (!audioState.url) return;
      const element = ensureAudioElement();
      if (element.readyState < 1) {
        try {
          element.load();
        } catch {}
      }
      element.volume = audioState.volume;
      setFooterSyncMessage('Loading track...', 'muted', false);
      await ensureAudioAnalyser();
      try {
        const playPromise = element.play();
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise;
        }
        audioState.autoplayBlocked = false;
        syncAudioPlaybackState();
        syncAudioTimelineState();
        ensureKickDetector().catch(function (error) {
          console.warn(error);
        });
      } catch (error) {
        audioState.isPlaying = false;
        audioState.autoplayBlocked = true;
        setFooterSyncMessage('Browser blocked autoplay. Tap Start Sync to retry.', 'error', true);
        throw error;
      }
    }

    function pauseAudioPlayback() {
      clearFooterVideoBurstTimeout();
      if (audioElement) {
        try {
          audioElement.pause();
        } catch {}
      }
      audioState.isPlaying = false;
      resetAudioReactiveState();
      syncFooterVideoPlaybackState();
    }

    async function setAudioSource(url, shouldResume) {
      const normalizedUrl = resolveRuntimeUrl(url);
      const element = ensureAudioElement();
      const sourceChangeToken = audioSourceChangeToken + 1;
      audioSourceChangeToken = sourceChangeToken;
      const resumePlayback = !!(normalizedUrl && shouldResume !== false);
      const currentElementSrc = String((element && (element.currentSrc || element.src)) || '').trim();
      if (audioState.url === normalizedUrl && (!normalizedUrl || currentElementSrc)) {
        audioState.available = !!normalizedUrl;
        element.volume = audioState.volume;
        if (normalizedUrl && element.readyState < 1) {
          try {
            element.load();
          } catch {}
        }
        if (!normalizedUrl) {
          setFooterSyncMessage('No direct audio file is attached to this release.', 'muted', false);
        } else if (resumePlayback) {
          try {
            await startAudioPlayback();
          } catch (error) {
            console.warn('Failed to start audio playback.', error);
          }
        }
        return;
      }
      try {
        element.pause();
      } catch {}
      audioState.isPlaying = false;
      audioState.currentTime = 0;
      audioState.duration = 0;
      audioState.autoplayBlocked = false;
      resetAudioReactiveState();
      footerVideoLastJumpAt = 0;
      footerVideoPrimed = false;
      footerVideoPendingTime = -1;
      footerVideoFlushAfterSeek = false;
      footerVideoPendingBurstMs = 0;
      clearFooterVideoBurstTimeout();
      audioState.available = !!normalizedUrl;
      const playbackUrl = normalizedUrl ? await resolveAudioPlaybackUrl(normalizedUrl) : '';
      if (audioSourceChangeToken !== sourceChangeToken) {
        return;
      }
      audioState.url = normalizedUrl;
      try {
        try {
          const parsedUrl = new URL(playbackUrl || normalizedUrl, window.location.href);
          const requiresCrossOrigin = /^https?:$/.test(parsedUrl.protocol) && parsedUrl.origin !== window.location.origin;
          if (requiresCrossOrigin) {
            element.crossOrigin = 'anonymous';
          } else {
            element.removeAttribute('crossorigin');
          }
        } catch {
          element.removeAttribute('crossorigin');
        }
        element.removeAttribute('src');
        if (playbackUrl) {
          element.src = playbackUrl;
          element.load();
        } else {
          element.load();
        }
      } catch (error) {
        console.warn('Failed to update audio source.', error);
      }
      element.volume = audioState.volume;
      syncFooterVideoPlaybackState();
      if (!normalizedUrl) {
        setFooterSyncMessage('No direct audio file is attached to this release.', 'muted', false);
      } else {
        setFooterSyncMessage('Preparing kick sync...', 'muted', false);
      }
      if (!resumePlayback) return;
      try {
        await startAudioPlayback();
      } catch (error) {
        console.warn('Failed to resume audio playback.', error);
      }
    }

    async function toggleAudioPlayback() {
      if (!audioState.url) return;
      if (audioState.isPlaying) {
        pauseAudioPlayback();
        return;
      }
      try {
        await startAudioPlayback();
      } catch (error) {
        console.warn('Failed to start audio playback.', error);
      }
    }

    function setAudioVolume(nextVolume) {
      const volume = clamp(nextVolume, 0, 1);
      audioState.volume = volume;
      if (audioElement) audioElement.volume = volume;
    }

    function toggleAudioVolumePanel() {
      if (!audioState.available) return;
      audioState.volumePanelOpen = !audioState.volumePanelOpen;
    }

    function setAudioProgress(nextProgress) {
      if (!audioState.available || !audioElement) return;
      const duration = Number.isFinite(audioElement.duration) && audioElement.duration > 0 ? audioElement.duration : audioState.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      const progress = clamp(nextProgress, 0, 1);
      const nextTime = duration * progress;
      try {
        audioElement.currentTime = nextTime;
      } catch {}
      audioState.currentTime = nextTime;
      audioState.duration = duration;
      if (isActive) {
        syncFooterVideoToAudioTimeline(true);
      }
    }

    function getFallbackAudioPhase() {
      const baseTime = Number.isFinite(audioState.currentTime) ? audioState.currentTime : 0;
      return baseTime + state.time * 0.35;
    }

    function maybeTriggerSpectrumKick(nextBass) {
      if (!audioState.isPlaying || !isActive) return;
      const now = (window.performance && typeof window.performance.now === 'function')
        ? window.performance.now()
        : Date.now();
      const previousBass = clamp(Number(state.audioBass) || 0, 0, 1);
      const bassRise = Math.max(0, nextBass - previousBass);
      if (nextBass < 0.16 || bassRise < 0.03) return;
      if (now - state.audioLastSpectrumKickAt < 118) return;
      state.audioLastSpectrumKickAt = now;
      handleDetectedKick(clamp((bassRise * 8.2) + nextBass * 0.42, 0.18, 1));
    }

    function sampleAudioLevel(delta) {
      let nextLevel = 0;
      let nextBass = 0;
      const spectrum = readDancerSpectrum() || readAudioAnalyserSpectrum();
      if (audioState.isPlaying && spectrum) {
        try {
          let weightedSum = 0;
          let peak = 0;
          const limit = Math.min(spectrum.length, 72);
          for (let index = 2; index < limit; index += 1) {
            const rawValue = Number(spectrum[index]) || 0;
            const normalizedValue = clamp(rawValue > 1 ? (rawValue / 255) : rawValue, 0, 1);
            weightedSum += normalizedValue * (1 + (index / Math.max(1, limit)) * 0.42);
            if (normalizedValue > peak) peak = normalizedValue;
          }
          nextLevel = clamp((weightedSum / Math.max(1, limit - 2)) * 0.78 + peak * 0.42, 0, 1);
          let bassSum = 0;
          let bassPeak = 0;
          let bassCount = 0;
          const bassLimit = Math.min(spectrum.length, 18);
          for (let index = 2; index < bassLimit; index += 1) {
            const normalizedValue = clamp(Number(spectrum[index]) || 0, 0, 1);
            const weight = 1.2 - ((index - 2) / Math.max(1, bassLimit - 2)) * 0.45;
            bassSum += normalizedValue * weight;
            bassPeak = Math.max(bassPeak, normalizedValue);
            bassCount += 1;
          }
          nextBass = clamp((bassSum / Math.max(1, bassCount)) * 0.92 + bassPeak * 0.36, 0, 1);
        } catch {
          nextLevel = 0;
          nextBass = 0;
        }
        maybeTriggerSpectrumKick(nextBass);
      } else if (audioState.isPlaying) {
        const phase = getFallbackAudioPhase();
        nextLevel = clamp(
          0.16 +
          (Math.sin(phase * 2.4) * 0.5 + 0.5) * 0.24 +
          (Math.cos(phase * 5.1 + 0.7) * 0.5 + 0.5) * 0.14,
          0,
          1
        );
        nextBass = clamp(
          0.12 +
          (Math.sin(phase * 1.6) * 0.5 + 0.5) * 0.36 +
          Math.pow(Math.max(0, Math.sin(phase * 3.2 - 0.4)), 2.4) * 0.34,
          0,
          1
        );
      }
      state.audioLevel += (nextLevel - state.audioLevel) * Math.min(1, delta * 7.5);
      state.audioBass += (nextBass - state.audioBass) * Math.min(1, delta * 9.2);
      state.audioKickPulse *= Math.exp(-delta * 10.8);
      state.audioKick = Math.max(state.audioKickPulse, state.audioKick * Math.exp(-delta * 10.8));
      return state.audioLevel;
    }

    function createAudioBlob() {
      if (!THREE || !root || audioBlobGroup) return;
      audioBlobGroup = new THREE.Group();
      audioBlobGroup.position.set(0, 0, 0.002);
      audioBlobGroup.scale.setScalar(state.audioBlobBaseScale || 1);
      audioBlobGroup.visible = false;

      audioBlobMaterial = new THREE.ShaderMaterial({
        transparent: true,
        wireframe: true,
        clipping: true,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        blending: THREE.NormalBlending,
        clippingPlanes: [
          new THREE.Plane(),
          new THREE.Plane(),
          new THREE.Plane(),
          new THREE.Plane()
        ],
          uniforms: {
            uTime: { value: 0 },
            uAudio: { value: 0 },
            uBass: { value: 0 },
            uKick: { value: 0 },
            uProgress: { value: 0 },
            uOpacity: { value: 1 },
            uColor: { value: new THREE.Color('#ffffff') }
          },
        vertexShader: [
          'uniform float uTime;',
          'uniform float uAudio;',
          'uniform float uBass;',
          'uniform float uKick;',
          'uniform float uProgress;',
          'varying float vAudio;',
          'float hash(vec3 p) {',
          '  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);',
          '}',
          'float noise3d(vec3 x) {',
          '  vec3 i = floor(x);',
          '  vec3 f = fract(x);',
          '  f = f * f * (3.0 - 2.0 * f);',
          '  float n000 = hash(i + vec3(0.0, 0.0, 0.0));',
          '  float n100 = hash(i + vec3(1.0, 0.0, 0.0));',
          '  float n010 = hash(i + vec3(0.0, 1.0, 0.0));',
          '  float n110 = hash(i + vec3(1.0, 1.0, 0.0));',
          '  float n001 = hash(i + vec3(0.0, 0.0, 1.0));',
          '  float n101 = hash(i + vec3(1.0, 0.0, 1.0));',
          '  float n011 = hash(i + vec3(0.0, 1.0, 1.0));',
          '  float n111 = hash(i + vec3(1.0, 1.0, 1.0));',
          '  float nx00 = mix(n000, n100, f.x);',
          '  float nx10 = mix(n010, n110, f.x);',
          '  float nx01 = mix(n001, n101, f.x);',
          '  float nx11 = mix(n011, n111, f.x);',
          '  float nxy0 = mix(nx00, nx10, f.y);',
          '  float nxy1 = mix(nx01, nx11, f.y);',
          '  return mix(nxy0, nxy1, f.z);',
          '}',
          'float fbm(vec3 p) {',
          '  float value = 0.0;',
          '  float amplitude = 0.5;',
          '  for (int octave = 0; octave < 4; octave++) {',
          '    value += noise3d(p) * amplitude;',
          '    p = p * 2.03 + vec3(17.0, 31.0, 11.0);',
          '    amplitude *= 0.5;',
          '  }',
          '  return value;',
          '}',
          'void main() {',
          '  vec3 displaced = position;',
          '  vec3 n = normalize(normal);',
          '  float weirdness = 0.06 + uBass * 0.08 + uKick * 0.06;',
          '  float time = uTime * (0.08 + uAudio * 0.22 + uBass * 0.28 + weirdness * 0.2 + uKick * 0.18);',
          '  float coarse = fbm(position * (1.34 + uBass * 0.62 + weirdness * 0.72) + vec3(time * 0.46, -time * 0.18, time * 0.24));',
          '  float ridged = 1.0 - abs(fbm(position.yzx * (2.05 + weirdness * 1.08) + vec3(-time * 0.22, time * 0.48, time * 0.11)) * 2.0 - 1.0);',
          '  float swirl = noise3d(position.zxy * (3.1 + weirdness * 1.2) + vec3(time * 0.62, -time * 0.34, time * 0.16));',
          '  float fracture = fbm(position.xzy * (2.46 + weirdness * 1.64) + vec3(-time * 0.26, time * 0.38, time * 0.54));',
          '  float kink = sin((position.x - position.y * 0.82 + position.z * 1.24) * (4.0 + weirdness * 3.8) + time * (1.3 + uKick * 2.2)) * 0.5 + 0.5;',
          '  vec3 warpedNormal = normalize(n + vec3((coarse - 0.5) * 0.76 + (fracture - 0.5) * (0.48 + weirdness * 0.42), (ridged - 0.5) * 0.94 + (kink - 0.5) * (0.34 + weirdness * 0.48), (swirl - 0.5) * 0.74 + (fracture - 0.5) * 0.3));',
          '  float ripple = sin(position.y * (3.2 + weirdness * 2.4) + time * 1.28 + position.x * 1.4) * 0.5 + 0.5;',
          '  float distortion = ((coarse - 0.5) * 0.84) + ((ridged - 0.5) * 1.16) + ((swirl - 0.5) * 0.62) + ((fracture - 0.5) * (0.52 + weirdness * 0.92)) + (ripple - 0.5) * (0.28 + uBass * 0.42 + weirdness * 0.58) + (kink - 0.5) * (0.34 + weirdness * 0.72);',
          '  float amplitude = 0.03 + uAudio * 0.08 + uBass * 0.14 + weirdness * 0.1 + uKick * 0.11;',
          '  displaced += warpedNormal * distortion * amplitude;',
          '  displaced.xy *= 1.0 + vec2(0.03 + uBass * 0.08 + weirdness * 0.12, 0.04 + uAudio * 0.06 + weirdness * 0.18) * vec2(sin(time * 0.92 + position.z * 1.7), cos(time * 0.88 + position.x * 1.4));',
          '  displaced.z *= 0.96 + (ridged * 0.08) + uBass * 0.04 + weirdness * 0.12 + uKick * 0.08;',
          '  vAudio = clamp(uAudio * 0.42 + uBass * 0.42 + weirdness * 0.24 + uKick * 0.34, 0.0, 1.0);',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'varying float vAudio;',
        'void main() {',
          '  float alpha = (0.05 + vAudio * 0.1) * uOpacity;',
          '  vec3 color = mix(uColor * 0.8, uColor, vAudio * 0.24);',
          '  gl_FragColor = vec4(color, alpha);',
          '}'
        ].join('\n')
      });

      audioBlobMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.02, 3), audioBlobMaterial);
      audioBlobMesh.rotation.set(0.14, -0.06, 0.08);
      audioBlobMesh.scale.set(1.18, 1.08, 0.78);
      audioBlobMesh.renderOrder = 3;
      audioBlobGroup.add(audioBlobMesh);

      root.add(audioBlobGroup);
    }

    function updateAudioBlob(delta, audioLevel) {
      if (!audioBlobGroup || !state.audioBlobPanel) return;
      const reactiveLevel = audioState.isPlaying && audioState.duration > 0 ? audioLevel : 0;
      const bassLevel = audioState.isPlaying && audioState.duration > 0 ? state.audioBass : 0;
      const kickLevel = audioState.isPlaying && audioState.duration > 0 ? state.audioKick : 0;
      const trackProgress = audioState.duration > 0
        ? clamp(audioState.currentTime / audioState.duration, 0, 1)
        : 0;
      const weirdness = 0.06 + bassLevel * 0.08 + kickLevel * 0.06;
      const idleDrift = reactiveLevel > 0.01 ? 1 : 0.14;
      const pulse = Math.sin(state.time * (0.82 + weirdness * 0.7) + bassLevel * (1.6 + weirdness * 1.1));
      const sway = Math.sin(state.time * (0.46 + weirdness * 0.52) + 0.7);
      const fracture = Math.sin(state.time * (1.28 + weirdness * 1.84) + 1.1);
      const kickJerk = kickLevel * (0.04 + weirdness * 0.1);
      const panel = state.audioBlobPanel;
      const panelFrame = buildAudioBlobPanelFrame(panel);
      if (!panelFrame) return;
      state.audioBlobPanelFrame = panelFrame;
      const facingNormal = getAudioBlobFacingNormal(panelFrame) || panelFrame.normal.clone();
      const xRange = Math.max(0.0025, panelFrame.width * 0.022);
      const yRange = Math.max(0.003, panelFrame.height * 0.028);
      const localOffsetX =
        Math.sin(state.time * (0.28 + weirdness * 0.18)) * (xRange * (0.16 * idleDrift + reactiveLevel * 0.22 + bassLevel * 0.14 + weirdness * 0.08)) -
        state.posX * (panelFrame.width * (0.0022 + reactiveLevel * 0.0042)) +
        fracture * kickJerk * panelFrame.width * 0.01;
      const localOffsetY =
        Math.cos(state.time * (0.31 + weirdness * 0.2)) * (yRange * (0.18 * idleDrift + reactiveLevel * 0.2 + weirdness * 0.08)) +
        state.posY * (panelFrame.height * (0.0028 + reactiveLevel * 0.0048)) +
        pulse * bassLevel * (panelFrame.height * (0.014 + weirdness * 0.008)) +
        kickLevel * (panelFrame.height * (0.01 + weirdness * 0.006));
      const maxOffsetX = panelFrame.width * 0.034;
      const maxOffsetY = panelFrame.height * 0.032;
      const clampedOffsetX = clamp(localOffsetX, -maxOffsetX, maxOffsetX);
      const clampedOffsetY = clamp(localOffsetY, -maxOffsetY, maxOffsetY);
      const targetPosition = panelFrame.center.clone()
        .add(panelFrame.right.clone().multiplyScalar(clampedOffsetX))
        .add(panelFrame.up.clone().multiplyScalar(clampedOffsetY))
        .add(facingNormal.multiplyScalar(0.0018 + reactiveLevel * 0.0024 + bassLevel * 0.0028 + kickLevel * 0.0022));
      const followAlpha = state.dragActive ? 1 : Math.min(1, delta * 4.4);
      audioBlobGroup.position.lerp(targetPosition, followAlpha);
      const wobbleEuler = new THREE.Euler(
        sway * (0.045 + weirdness * 0.02) + reactiveLevel * 0.03 + bassLevel * 0.04 + kickLevel * 0.035,
        Math.sin(state.time * (0.38 + weirdness * 0.22) + 1.2) * (0.055 + weirdness * 0.02) - reactiveLevel * 0.02 + bassLevel * 0.04 - kickLevel * 0.03,
        Math.sin(state.time * (0.26 + weirdness * 0.32) - 0.4) * (0.03 + weirdness * 0.012) + bassLevel * 0.018 + fracture * kickLevel * 0.03,
        'XYZ'
      );
      const targetQuaternion = panelFrame.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(wobbleEuler));
      const rotationAlpha = state.dragActive ? 1 : Math.min(1, delta * 3.8);
      audioBlobGroup.quaternion.slerp(targetQuaternion, rotationAlpha);
      const blobScale = (state.audioBlobBaseScale || 1) * (0.98 + reactiveLevel * 0.06 + bassLevel * 0.06 + weirdness * 0.018 + kickLevel * 0.045 + pulse * (0.01 + bassLevel * 0.012));
      const widthStretch = panelFrame.width / Math.max(panel.width, 0.001);
      const heightStretch = panelFrame.height / Math.max(panel.height, 0.001);
      const scaleX = blobScale * widthStretch * (1.01 + weirdness * 0.03 + bassLevel * 0.04 + sway * 0.02 + kickLevel * 0.025);
      const scaleY = blobScale * heightStretch * (1.0 + weirdness * 0.04 + bassLevel * 0.035 + Math.cos(state.time * (0.52 + weirdness * 0.26)) * 0.025 - kickLevel * 0.015);
      const scaleZ = blobScale * (0.7 + weirdness * 0.03 + bassLevel * 0.03 - sway * 0.015 + fracture * 0.015 + kickLevel * 0.02);
      audioBlobGroup.scale.set(scaleX, scaleY, scaleZ);
      if (audioBlobMaterial) {
        audioBlobMaterial.uniforms.uTime.value = state.time;
        audioBlobMaterial.uniforms.uAudio.value = reactiveLevel;
        audioBlobMaterial.uniforms.uBass.value = bassLevel;
        audioBlobMaterial.uniforms.uKick.value = kickLevel;
        audioBlobMaterial.uniforms.uProgress.value = trackProgress;
      }
    }

    function triggerHotspot(hotspot) {
      if (!hotspot) return;
      if (hotspot.action === 'close') {
        if (onClose) onClose();
        return;
      }
      if (hotspot.action === 'prev') {
        if (onPrev) onPrev();
        return;
      }
      if (hotspot.action === 'next') {
        if (onNext) onNext();
        return;
      }
      if (hotspot.url) openExternalUrl(hotspot.url);
    }

    function getHotspotIdentity(hotspot) {
      if (!hotspot) return '';
      if (hotspot.action) return 'action:' + hotspot.action;
      if (hotspot.url) return 'url:' + hotspot.url;
      return '';
    }

    function syncViewportCursor(hotspot) {
      const nextCursor = state.dragActive ? 'grabbing' : (hotspot ? 'pointer' : 'grab');
      if (viewport.style.cursor !== nextCursor) viewport.style.cursor = nextCursor;
    }

    function ensureFlatCardFallbackElement() {
      if (flatCardFallbackElement) return flatCardFallbackElement;
      flatCardFallbackElement = document.createElement('canvas');
      flatCardFallbackElement.setAttribute('aria-hidden', 'true');
      flatCardFallbackElement.style.position = 'absolute';
      flatCardFallbackElement.style.left = '50%';
      flatCardFallbackElement.style.top = '50%';
      flatCardFallbackElement.style.display = 'none';
      flatCardFallbackElement.style.pointerEvents = 'none';
      flatCardFallbackElement.style.transform = 'translate(-50%, -50%)';
      flatCardFallbackElement.style.transformOrigin = '50% 50%';
      flatCardFallbackElement.style.borderRadius = '24px';
      flatCardFallbackElement.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.34)';
      flatCardFallbackElement.style.filter = 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.24))';
      flatCardFallbackElement.style.zIndex = '1';
      viewport.appendChild(flatCardFallbackElement);
      return flatCardFallbackElement;
    }

    function hideFlatCardFallback() {
      if (!flatCardFallbackElement) return;
      flatCardFallbackElement.style.display = 'none';
      if (!state.dragActive) viewport.style.cursor = 'grab';
    }

    function syncFlatCardFallbackLayout() {
      if (!flatCardFallbackElement || flatCardFallbackElement.style.display === 'none') return;
      const rect = getViewportRect();
      if (!rect.width || !rect.height) return;
      const isCompact = rect.width < 760;
      const maxWidthPx = Math.min(200, rect.width - (isCompact ? 20 : 24));
      const maxHeightPx = Math.max(220, rect.height - (isCompact ? 28 : 36));
      const desiredWidthPx = Math.max(150, Math.min(maxWidthPx, maxHeightPx / Math.max(1, state.cardAspect)));
      const desiredHeightPx = desiredWidthPx * Math.max(1, state.cardAspect);
      flatCardFallbackElement.style.width = desiredWidthPx + 'px';
      flatCardFallbackElement.style.height = desiredHeightPx + 'px';
    }

    function updateFlatCardFallback(textureResult) {
      if (!textureResult || !textureResult.canvas) return;
      const fallbackCanvas = ensureFlatCardFallbackElement();
      if (fallbackCanvas.width !== textureResult.canvas.width) fallbackCanvas.width = textureResult.canvas.width;
      if (fallbackCanvas.height !== textureResult.canvas.height) fallbackCanvas.height = textureResult.canvas.height;
      const fallbackContext = fallbackCanvas.getContext('2d');
      if (!fallbackContext) return;
      fallbackContext.clearRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      fallbackContext.drawImage(textureResult.canvas, 0, 0);
      fallbackCanvas.style.display = rendererUnavailable ? 'block' : 'none';
      syncFlatCardFallbackLayout();
      if (rendererUnavailable) viewport.style.cursor = 'default';
    }

    function resetSceneAfterFailure() {
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
      window.removeEventListener('blur', releasePointer);
      if (renderer) {
        try {
          renderer.dispose();
        } catch {}
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      renderer = null;
      scene = null;
      camera = null;
      root = null;
      clothMesh = null;
      artworkMesh = null;
      audioBlobGroup = null;
      audioBlobMesh = null;
      audioBlobMaterial = null;
      audioBlobGlowMesh = null;
      audioBlobGlowMaterial = null;
      shadowMesh = null;
      raycaster = null;
      clothGeometry = null;
      clothMaterial = null;
      artworkMaterial = null;
      clothPoints = [];
      clothConstraints = [];
      hideArtworkDomOverlay();
      clearArtworkLayer();
    }

    function ensureArtworkDomOverlay() {
      if (artworkDomOverlay) return artworkDomOverlay;
      artworkDomOverlay = document.createElement('img');
      artworkDomOverlay.alt = '';
      artworkDomOverlay.decoding = 'async';
      artworkDomOverlay.draggable = false;
      artworkDomOverlay.setAttribute('aria-hidden', 'true');
      artworkDomOverlay.style.position = 'absolute';
      artworkDomOverlay.style.left = '0';
      artworkDomOverlay.style.top = '0';
      artworkDomOverlay.style.width = '1px';
      artworkDomOverlay.style.height = '1px';
      artworkDomOverlay.style.display = 'none';
      artworkDomOverlay.style.opacity = '0';
      artworkDomOverlay.style.objectFit = 'cover';
      artworkDomOverlay.style.pointerEvents = 'none';
      artworkDomOverlay.style.transformOrigin = '0 0';
      artworkDomOverlay.style.willChange = 'transform, opacity';
      artworkDomOverlay.style.zIndex = '0';
      viewport.appendChild(artworkDomOverlay);
      return artworkDomOverlay;
    }

    function hideArtworkDomOverlay() {
      currentArtworkRect = null;
      currentArtworkOverlayUrl = '';
      if (!artworkDomOverlay) return;
      artworkDomOverlay.style.display = 'none';
      artworkDomOverlay.style.opacity = '0';
      artworkDomOverlay.removeAttribute('src');
    }

    function updateArtworkDomOverlay(cardData, textureResult) {
      const overlayUrl = resolveArtworkOverlayUrl(cardData || {});
      const artRect = textureResult && textureResult.artworkRect ? Object.assign({}, textureResult.artworkRect) : null;
      if (!overlayUrl || !artRect) {
        hideArtworkDomOverlay();
        return;
      }
      const overlay = ensureArtworkDomOverlay();
      currentArtworkRect = artRect;
      if (currentArtworkOverlayUrl !== overlayUrl) {
        currentArtworkOverlayUrl = overlayUrl;
        overlay.src = overlayUrl;
      }
      overlay.style.display = 'block';
      overlay.style.opacity = '0.98';
      const radiusPercent = clamp(((artRect.radius || 0) / Math.max(1, Math.min(artRect.width, artRect.height))) * 100, 0, 50);
      const radiusValue = radiusPercent.toFixed(3) + '%';
      overlay.style.borderRadius = radiusValue;
      if (supportsCornerShapeSquircle()) {
        overlay.style.setProperty('corner-shape', 'squircle');
        overlay.style.clipPath = '';
      } else {
        overlay.style.removeProperty('corner-shape');
        overlay.style.clipPath = 'inset(0 round ' + radiusValue + ')';
      }
      syncArtworkDomOverlayTransform();
    }

    function getClothLocalPointAtUv(u, v, zOffset) {
      if (!clothPoints.length) return new THREE.Vector3(
        (clamp(u, 0, 1) - 0.5) * PLANE_WIDTH,
        (0.5 - clamp(v, 0, 1)) * PLANE_HEIGHT,
        zOffset || 0
      );
      const clampedU = clamp(u, 0, 1);
      const clampedV = clamp(v, 0, 1);
      const gridX = clampedU * CLOTH_SEGMENTS_X;
      const gridY = clampedV * CLOTH_SEGMENTS_Y;
      const x0 = clamp(Math.floor(gridX), 0, CLOTH_SEGMENTS_X);
      const y0 = clamp(Math.floor(gridY), 0, CLOTH_SEGMENTS_Y);
      const x1 = clamp(x0 + 1, 0, CLOTH_SEGMENTS_X);
      const y1 = clamp(y0 + 1, 0, CLOTH_SEGMENTS_Y);
      const tx = clamp(gridX - x0, 0, 1);
      const ty = clamp(gridY - y0, 0, 1);
      const topLeft = clothPoints[pointIndex(x0, y0)] || clothPoints[0];
      const topRight = clothPoints[pointIndex(x1, y0)] || topLeft;
      const bottomLeft = clothPoints[pointIndex(x0, y1)] || topLeft;
      const bottomRight = clothPoints[pointIndex(x1, y1)] || topLeft;
      const topX = lerp(topLeft.x, topRight.x, tx);
      const topY = lerp(topLeft.y, topRight.y, tx);
      const topZ = lerp(topLeft.z, topRight.z, tx);
      const bottomX = lerp(bottomLeft.x, bottomRight.x, tx);
      const bottomY = lerp(bottomLeft.y, bottomRight.y, tx);
      const bottomZ = lerp(bottomLeft.z, bottomRight.z, tx);
      return new THREE.Vector3(
        lerp(topX, bottomX, ty),
        lerp(topY, bottomY, ty),
        lerp(topZ, bottomZ, ty) + (zOffset || 0)
      );
    }

    function syncArtworkDomOverlayTransform() {
      if (!artworkDomOverlay || artworkDomOverlay.style.display === 'none' || !currentArtworkRect || !root || !camera || !scene || !THREE) return;
      const rect = getViewportRect();
      if (!rect.width || !rect.height) return;
      const textureWidth = state.textureWidth || TEXTURE_WIDTH;
      const textureHeight = state.textureHeight || DEFAULT_TEXTURE_HEIGHT;
      const artRect = currentArtworkRect;
      const uLeft = artRect.x / textureWidth;
      const uRight = (artRect.x + artRect.width) / textureWidth;
      const vTop = artRect.y / textureHeight;
      const vBottom = (artRect.y + artRect.height) / textureHeight;
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const topLeft = toViewportPoint(root.localToWorld(getClothLocalPointAtUv(uLeft, vTop, 0.01)).project(camera), rect);
      const topRight = toViewportPoint(root.localToWorld(getClothLocalPointAtUv(uRight, vTop, 0.01)).project(camera), rect);
      const bottomLeft = toViewportPoint(root.localToWorld(getClothLocalPointAtUv(uLeft, vBottom, 0.01)).project(camera), rect);
      const a = topRight.x - topLeft.x;
      const b = topRight.y - topLeft.y;
      const c = bottomLeft.x - topLeft.x;
      const d = bottomLeft.y - topLeft.y;
      if (![a, b, c, d, topLeft.x, topLeft.y].every(Number.isFinite)) {
        artworkDomOverlay.style.display = 'none';
        return;
      }
      artworkDomOverlay.style.transform = 'matrix(' + a + ',' + b + ',' + c + ',' + d + ',' + topLeft.x + ',' + topLeft.y + ')';
    }

    function clearArtworkLayer(options) {
      const preserveTexture = !!(options && options.preserveTexture);
      if (artworkTexture && !preserveTexture) {
        artworkTexture.dispose();
        artworkTexture = null;
        artworkTextureKey = '';
      }
      if (artworkMaterial && !preserveTexture) {
        artworkMaterial.map = null;
        artworkMaterial.needsUpdate = true;
      }
      if (artworkMesh) artworkMesh.visible = false;
    }

    function updateArtworkLayer(textureResult, nextArtworkTexture, nextArtworkTextureKey) {
      const reusingTexture = !!(artworkTexture && nextArtworkTexture && artworkTexture === nextArtworkTexture);
      clearArtworkLayer({ preserveTexture: reusingTexture });
      if (!artworkMaterial || !artworkMesh || !nextArtworkTexture || !textureResult || !textureResult.artworkRect) return;
      const artRect = textureResult.artworkRect;
      const textureWidth = textureResult.textureWidth || TEXTURE_WIDTH;
      const textureHeight = textureResult.textureHeight || DEFAULT_TEXTURE_HEIGHT;
      const artCenterX = (artRect.x + artRect.width * 0.5) / textureWidth;
      const artCenterY = (artRect.y + artRect.height * 0.5) / textureHeight;
      const planeWidth = PLANE_WIDTH * (artRect.width / textureWidth);
      const planeHeight = PLANE_HEIGHT * (artRect.height / textureHeight);
      artworkTexture = nextArtworkTexture;
      artworkTextureKey = nextArtworkTextureKey || artworkTextureKey;
      artworkMaterial.map = artworkTexture;
      artworkMaterial.needsUpdate = true;
      artworkMesh.scale.set(planeWidth, planeHeight, 1);
      artworkMesh.position.set(
        (artCenterX - 0.5) * PLANE_WIDTH,
        (0.5 - artCenterY) * PLANE_HEIGHT,
        -0.0028
      );
      artworkMesh.visible = true;
    }

    async function ensureArtworkLayerTexture(cardData) {
      const artworkKey = resolveArtworkOverlayUrl(cardData || {});
      if (!artworkKey || !THREE) return null;
      if (artworkTexture && artworkTextureKey === artworkKey) {
        return {
          texture: artworkTexture,
          key: artworkKey
        };
      }
      const artworkSource = await resolveArtworkImage(cardData || {});
      if (!artworkSource || !THREE) return null;
      const nextTexture = (typeof HTMLCanvasElement !== 'undefined' && artworkSource instanceof HTMLCanvasElement)
        ? new THREE.CanvasTexture(artworkSource)
        : new THREE.Texture(artworkSource);
      if ('colorSpace' in nextTexture) {
        nextTexture.colorSpace = THREE.SRGBColorSpace;
      } else if ('encoding' in nextTexture) {
        nextTexture.encoding = THREE.sRGBEncoding;
      }
      nextTexture.needsUpdate = true;
      nextTexture.wrapS = THREE.ClampToEdgeWrapping;
      nextTexture.wrapT = THREE.ClampToEdgeWrapping;
      nextTexture.minFilter = THREE.LinearFilter;
      nextTexture.magFilter = THREE.LinearFilter;
      return {
        texture: nextTexture,
        key: artworkKey
      };
    }

    async function syncArtworkFallbackLayer(textureResult, cardData, setToken) {
      if (textureResult && textureResult.usesDomArtwork) {
        hideArtworkDomOverlay();
        const resolvedTexture = await ensureArtworkLayerTexture(cardData || {});
        if (typeof setToken === 'number' && currentCardSetToken !== setToken) return;
        if (!resolvedTexture || !resolvedTexture.texture) {
          clearArtworkLayer();
          return;
        }
        updateArtworkLayer(textureResult, resolvedTexture.texture, resolvedTexture.key);
        return;
      }
      hideArtworkDomOverlay();
      if (textureResult && textureResult.hasArtwork) {
        clearArtworkLayer();
        return;
      }
      if (!textureResult || !textureResult.artworkRect) {
        clearArtworkLayer();
        return;
      }
      const resolvedTexture = await ensureArtworkLayerTexture(cardData || {});
      if (typeof setToken === 'number' && currentCardSetToken !== setToken) return;
      if (!resolvedTexture || !resolvedTexture.texture) {
        clearArtworkLayer();
        return;
      }
      updateArtworkLayer(textureResult, resolvedTexture.texture, resolvedTexture.key);
    }

    function renderSceneWithFallback() {
      if (!renderer || !scene || !camera) return;
      renderer.render(scene, camera);
    }

    function getCanvasPointFromUv(uv) {
      const textureWidth = state.textureWidth || TEXTURE_WIDTH;
      const textureHeight = state.textureHeight || DEFAULT_TEXTURE_HEIGHT;
      const normalizedX = typeof (uv && uv.x) === 'number' ? uv.x : 0;
      const normalizedY = typeof (uv && uv.y) === 'number' ? uv.y : 0;
      return {
        x: clamp(normalizedX, 0, 1) * textureWidth,
        y: (1 - clamp(normalizedY, 0, 1)) * textureHeight
      };
    }

    function findHotspotAtUv(uv) {
      if (!uv || !cardHotspots.length) return null;
      const point = getCanvasPointFromUv(uv);
      for (let i = cardHotspots.length - 1; i >= 0; i -= 1) {
        const hotspot = cardHotspots[i];
        const withinX = point.x >= hotspot.x && point.x <= hotspot.x + hotspot.width;
        const withinY = point.y >= hotspot.y && point.y <= hotspot.y + hotspot.height;
        if (withinX && withinY) return hotspot;
      }
      return null;
    }

    function updatePointerHit(clientX, clientY) {
      const rect = getViewportRect();
      if (!rect.width || !rect.height) return false;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointerNdc, camera);
      const intersections = clothMesh ? raycaster.intersectObject(clothMesh, false) : [];
      if (!intersections.length || !intersections[0].uv) {
        hoveredHotspot = null;
        syncViewportCursor(null);
        return false;
      }
      const localPoint = root.worldToLocal(intersections[0].point.clone());
      state.pointerTargetUvX = intersections[0].uv.x;
      state.pointerTargetUvY = intersections[0].uv.y;
      state.pointerLocalX = localPoint.x;
      state.pointerLocalY = localPoint.y;
      state.pointerLocalZ = localPoint.z;
      hoveredHotspot = findHotspotAtUv(intersections[0].uv);
      state.pointerTargetInfluence = (hoveredHotspot || state.pressHotspot) && !state.dragActive ? 0 : 1;
      syncViewportCursor(hoveredHotspot);
      return true;
    }

    function onPointerDown(event) {
      if (!isActive || event.button !== 0) return;
      const pointerHit = updatePointerHit(event.clientX, event.clientY);
      const uvHotspot = pointerHit ? findHotspotAtUv({
        x: state.pointerTargetUvX,
        y: state.pointerTargetUvY
      }) : null;
      if (!pointerHit) return;
      state.pressHotspot = uvHotspot;
      state.pressHotspotConsumed = false;
      state.dragActive = !state.pressHotspot;
      state.dragPointerId = event.pointerId;
      state.dragStartClientX = event.clientX;
      state.dragStartClientY = event.clientY;
      state.dragStartPosX = state.targetPosX;
      state.dragStartPosY = state.targetPosY;
      state.movedSincePointerDown = false;
      state.pointerTargetInfluence = state.dragActive ? 1.18 : 0;
      if (state.pressHotspot) {
        event.preventDefault();
      }
      if (state.dragActive && pointerHit) {
        const gridX = clamp(Math.round(((state.pointerLocalX + (PLANE_WIDTH * 0.5)) / PLANE_WIDTH) * CLOTH_SEGMENTS_X), 0, CLOTH_SEGMENTS_X);
        const gridY = clamp(Math.round((((PLANE_HEIGHT * 0.5) - state.pointerLocalY) / PLANE_HEIGHT) * CLOTH_SEGMENTS_Y), 0, CLOTH_SEGMENTS_Y);
        dragPointIndex = pointIndex(gridX, gridY);
        if (clothPoints[dragPointIndex]) {
          dragTargetLocal.x = clothPoints[dragPointIndex].x;
          dragTargetLocal.y = clothPoints[dragPointIndex].y;
          dragTargetLocal.z = clothPoints[dragPointIndex].z;
        }
        viewport.classList.add('is-dragging');
      }
      syncViewportCursor(state.pressHotspot);
      if (viewport.setPointerCapture) {
        try {
          viewport.setPointerCapture(event.pointerId);
        } catch {}
      }
    }

    function onPointerMove(event) {
      if (!isActive) return;
      if (state.dragPointerId === event.pointerId && state.dragActive) {
        const rect = getViewportRect();
        const worldSize = getWorldSizeAtPlane();
        const deltaX = event.clientX - state.dragStartClientX;
        const deltaY = event.clientY - state.dragStartClientY;
        if ((deltaX * deltaX) + (deltaY * deltaY) > 36) {
          state.movedSincePointerDown = true;
        }
        const localDeltaX = ((deltaX / Math.max(1, rect.width)) * worldSize.width) / Math.max(state.frameScale, 0.001);
        const localDeltaY = (-(deltaY / Math.max(1, rect.height)) * worldSize.height) / Math.max(state.frameScale, 0.001);
        state.targetPosX = clamp(localDeltaX * 0.14, -0.18, 0.18);
        state.targetPosY = clamp(localDeltaY * 0.14, -0.16, 0.16);
        if (dragPointIndex >= 0 && clothPoints[dragPointIndex]) {
          const source = clothPoints[dragPointIndex];
          dragTargetLocal.x = source.baseX + localDeltaX * 0.92;
          dragTargetLocal.y = source.baseY + localDeltaY * 0.92;
          dragTargetLocal.z = Math.min(0.44, 0.08 + Math.hypot(localDeltaX, localDeltaY) * 0.26);
        }
        updatePointerHit(event.clientX, event.clientY);
        event.preventDefault();
        return;
      }

      if (state.dragPointerId === event.pointerId) {
        updatePointerHit(event.clientX, event.clientY);
        return;
      }

      if (!updatePointerHit(event.clientX, event.clientY)) {
        state.pointerTargetInfluence = 0;
      }
    }

    function releasePointer(event) {
      if (state.dragPointerId == null) return;
      if (event && state.dragPointerId !== event.pointerId) return;
      const releaseHotspot = event ? findHotspotAtUv((updatePointerHit(event.clientX, event.clientY), {
        x: state.pointerTargetUvX,
        y: state.pointerTargetUvY
      })) : null;
      const pressedHotspotId = getHotspotIdentity(state.pressHotspot);
      const releaseHotspotId = getHotspotIdentity(releaseHotspot);
      const pressedHotspot = state.pressHotspot;
      const shouldOpenHotspot = !!(
        pressedHotspotId &&
        !state.pressHotspotConsumed &&
        !state.movedSincePointerDown &&
        (!releaseHotspotId || releaseHotspotId === pressedHotspotId)
      );
      if (viewport.releasePointerCapture && state.dragPointerId != null) {
        try {
          viewport.releasePointerCapture(state.dragPointerId);
        } catch {}
      }
      state.dragActive = false;
      state.dragPointerId = null;
      state.targetPosX = 0;
      state.targetPosY = 0;
      state.pointerTargetInfluence = 0;
      state.pressHotspot = null;
      state.pressHotspotConsumed = false;
      state.movedSincePointerDown = false;
      resetDragState();
      viewport.classList.remove('is-dragging');
      syncViewportCursor(hoveredHotspot);
      if (shouldOpenHotspot) triggerHotspot(releaseHotspotId === pressedHotspotId ? releaseHotspot : pressedHotspot);
    }

    function onPointerLeave() {
      if (state.dragActive) return;
      state.pointerTargetInfluence = 0;
      hoveredHotspot = null;
      syncViewportCursor(null);
    }

    async function ensureScene() {
      if (rendererUnavailable) return;
      if (renderer) return;
      if (scenePromise) return scenePromise;

      scenePromise = (async function () {
        THREE = await ensureThree();

        renderer = createWebGLRendererWithFallback(THREE);
        renderer.localClippingEnabled = true;
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        if ('outputColorSpace' in renderer) {
          renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else if ('outputEncoding' in renderer) {
          renderer.outputEncoding = THREE.sRGBEncoding;
        }

        viewport.textContent = '';
        viewport.appendChild(renderer.domElement);
        renderer.domElement.style.position = 'relative';
        renderer.domElement.style.zIndex = '1';
        ensureArtworkDomOverlay();

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
        camera.position.set(0, 0.03, 5);

        raycaster = new THREE.Raycaster();
        root = new THREE.Group();
        scene.add(root);
        createAudioBlob();

        clothGeometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, CLOTH_SEGMENTS_X, CLOTH_SEGMENTS_Y);
        buildClothModel();
        clothMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          roughness: 0.82,
          metalness: 0,
          clearcoat: 0.08,
          clearcoatRoughness: 0.74,
          sheen: 0.34,
          sheenRoughness: 0.9,
          sheenColor: new THREE.Color('#f4f1e8'),
          transmission: 0,
          thickness: 0.02,
          toneMapped: false
        });

        clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
        clothMesh.renderOrder = 2;
        root.add(clothMesh);

        artworkMaskTexture = new THREE.CanvasTexture(createArtworkMaskCanvas());
        artworkMaterial = new THREE.MeshBasicMaterial({
          map: null,
          alphaMap: artworkMaskTexture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
          color: 0xffffff,
          side: THREE.DoubleSide
        });

        artworkMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), artworkMaterial);
        artworkMesh.position.z = -0.0028;
        artworkMesh.renderOrder = 1;
        artworkMesh.visible = false;
        root.add(artworkMesh);

        const hemiLight = new THREE.HemisphereLight(0xf7f2ea, 0x10141c, 1.28);
        hemiLight.position.set(0, 1, 0);
        scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.02);
        keyLight.position.set(1.45, 1.8, 2.6);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xe5e7eb, 0.28);
        fillLight.position.set(-1.3, 0.7, 1.8);
        scene.add(fillLight);

        shadowTexture = new THREE.CanvasTexture(createShadowCanvas());
        const shadowMaterial = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.34
        });
        shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 0.66), shadowMaterial);
        shadowMesh.position.set(0, -1.38, -0.96);
        scene.add(shadowMesh);

        viewport.addEventListener('pointerdown', onPointerDown);
        viewport.addEventListener('pointermove', onPointerMove);
        viewport.addEventListener('pointerleave', onPointerLeave);
        window.addEventListener('pointerup', releasePointer);
        window.addEventListener('pointercancel', releasePointer);
        window.addEventListener('blur', releasePointer);
        viewport.style.cursor = 'grab';

        resetClothState();
        resize();
      })();

      try {
        await scenePromise;
        rendererUnavailable = false;
        hideFlatCardFallback();
      } catch (error) {
        rendererUnavailable = true;
        console.warn('Falling back to flat release card because WebGL setup failed.', error);
        resetSceneAfterFailure();
        if (currentCardData) {
          const textureResult = await buildCardTextureCanvas(buildTextureCardData(currentCardData));
          updateFlatCardFallback(textureResult);
        }
      } finally {
        scenePromise = null;
      }
    }

    function resize() {
      syncFlatCardFallbackLayout();
      if (!renderer || !camera) return;
      const rect = getViewportRect();
      if (!rect.width || !rect.height) return;
      const aspect = rect.width / Math.max(1, rect.height);
      const isCompact = rect.width < 760;
      const maxWidthPx = Math.min(200, rect.width - (isCompact ? 20 : 24));
      const maxHeightPx = Math.max(220, rect.height - (isCompact ? 28 : 36));
      const desiredWidthPx = Math.max(150, Math.min(maxWidthPx, maxHeightPx / Math.max(1, state.cardAspect)));
      camera.position.z = 5;
      camera.position.y = isCompact ? 0.02 : 0.03;
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      state.frameScale = (desiredWidthPx * 2 * Math.tan(verticalFov * 0.5) * camera.position.z) / (PLANE_WIDTH * rect.height);
      state.frameBaseX = 0;
      state.frameBaseY = isCompact ? 0.05 : 0.03;
      state.frameIdleX = isCompact ? 0.018 : 0.014;
      state.frameIdleY = isCompact ? 0.014 : 0.011;
      state.shadowBaseY = isCompact ? -1.18 : -1.26;
      applyRootScale(1);
      syncAudioBlobBaseScale();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      syncArtworkDomOverlayTransform();
      renderFooterOrbFrame();
      renderOnce();
    }

    function renderOnce() {
      if (!renderer || !scene || !camera) return;
      renderSceneWithFallback();
    }

    async function prime() {
      await ensureScene();
      renderOnce();
    }

    function animate(now) {
      if (!isActive) {
        animationFrameId = 0;
        return;
      }

      if (!renderer || !scene || !camera || !root || !shadowMesh || !clothGeometry || !clothMaterial) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      const deltaMs = state.lastTime ? Math.min(36, now - state.lastTime) : 16;
      const delta = Math.max(0.001, deltaMs / 1000);
      state.lastTime = now;
      state.time += delta;

      if (!state.dragActive) {
        state.targetPosX += (0 - state.targetPosX) * Math.min(1, delta * 4.4);
        state.targetPosY += (0 - state.targetPosY) * Math.min(1, delta * 4.4);
      }

      state.pointerUvX += (state.pointerTargetUvX - state.pointerUvX) * Math.min(1, delta * 8.4);
      state.pointerUvY += (state.pointerTargetUvY - state.pointerUvY) * Math.min(1, delta * 8.4);
      state.pointerInfluence += (state.pointerTargetInfluence - state.pointerInfluence) * Math.min(1, delta * 6.2);
      state.openProgress += ((isActive ? 1 : 0) - state.openProgress) * Math.min(1, delta * 4.8);

      const activeSwitchPhase = state.switchPhase;
      let switchProgress = state.switchProgress;
      let completedSwitchPhase = '';
      if (activeSwitchPhase !== 'idle') {
        const elapsed = now - state.switchStartedAt;
        switchProgress = clamp(elapsed / Math.max(1, state.switchDuration), 0, 1);
        state.switchProgress = switchProgress;
        if (switchProgress >= 1) completedSwitchPhase = activeSwitchPhase;
      }

      state.velX += (state.targetPosX - state.posX) * 18 * delta;
      state.velY += (state.targetPosY - state.posY) * 18 * delta;
      state.velX *= Math.exp(-8.4 * delta);
      state.velY *= Math.exp(-8.4 * delta);
      state.posX += state.velX * delta;
      state.posY += state.velY * delta;

      const audioLevel = sampleAudioLevel(delta);
      syncAudioTimelineState();
      const clothMetrics = simulateCloth(delta);
      const idleX = Math.sin(state.time * 0.36) * state.frameIdleX;
      const idleY = Math.cos(state.time * 0.31) * state.frameIdleY;
      const hoverX = (state.pointerUvX - 0.5) * 2;
      const hoverY = (state.pointerUvY - 0.5) * 2;
      let switchOffsetX = 0;
      let switchOffsetY = 0;
      let switchRotY = 0;
      let switchRotZ = 0;
      let switchScale = 1;
      let switchOpacity = 1;
      let switchDepth = 0;
      if (activeSwitchPhase === 'out') {
        const eased = smoothstep(0, 1, switchProgress);
        switchOffsetX = state.switchDirection * 0.3 * eased;
        switchOffsetY = 0.014 * eased;
        switchRotY = -state.switchDirection * 0.44 * eased;
        switchRotZ = state.switchDirection * 0.06 * eased;
        switchScale = 1 - eased * 0.09;
        switchOpacity = 1 - eased * 0.48;
        switchDepth = 0.024 * eased;
      } else if (activeSwitchPhase === 'in') {
        const eased = smoothstep(0, 1, switchProgress);
        const inv = 1 - eased;
        switchOffsetX = -state.switchDirection * 0.26 * inv;
        switchOffsetY = 0.012 * inv;
        switchRotY = state.switchDirection * 0.34 * inv;
        switchRotZ = -state.switchDirection * 0.045 * inv;
        switchScale = 0.92 + eased * 0.08;
        switchOpacity = 0.52 + eased * 0.48;
        switchDepth = 0.018 * inv;
      }
      const targetRotX = (-hoverY * 0.018 * state.pointerInfluence) - state.posY * 0.06 + idleY * 0.3;
      const targetRotY = (hoverX * 0.022 * state.pointerInfluence) + state.posX * 0.08 + idleX * 0.34 + switchRotY;
      const targetRotZ = (-state.posX * 0.02) + Math.sin(state.time * 0.44) * 0.012 + switchRotZ;

      root.rotation.x += (targetRotX - root.rotation.x) * Math.min(1, delta * 4.8);
      root.rotation.y += (targetRotY - root.rotation.y) * Math.min(1, delta * 4.8);
      root.rotation.z += (targetRotZ - root.rotation.z) * Math.min(1, delta * 4.2);

      root.position.x += ((state.frameBaseX + state.posX * 0.18 + idleX * 0.8 + switchOffsetX) - root.position.x) * Math.min(1, delta * 3.8);
      root.position.y += ((state.frameBaseY + state.posY * 0.16 + idleY * 0.72 + switchOffsetY) - root.position.y) * Math.min(1, delta * 3.8);
      root.position.z += ((Math.sin(state.time * 0.42) * 0.012 + state.openProgress * 0.012 + switchDepth) - root.position.z) * Math.min(1, delta * 3.2);
      applyRootScale(lerp(0.94, 1, smoothstep(0, 1, state.openProgress)) * switchScale);
      syncArtworkDomOverlayTransform();
      setSurfaceOpacity(switchOpacity);

      shadowMesh.position.x = root.position.x * 0.28;
      shadowMesh.position.y = state.shadowBaseY - clothMetrics.bottomDrop * 0.14;
      shadowMesh.scale.x = 1 + clothMetrics.bottomDepth * 0.22 + Math.abs(state.posX) * 0.08;
      shadowMesh.scale.y = 1 + clothMetrics.bottomDrop * 0.1 + clothMetrics.bottomDepth * 0.08;
      shadowMesh.material.opacity = clamp((0.18 + clothMetrics.bottomDepth * 0.18 + (state.dragActive ? 0.08 : 0)) * (0.72 + switchOpacity * 0.28), 0.1, 0.42);
      try {
        updateAudioBlob(delta, audioLevel);
        syncAudioBlobClipPlanes();
        renderFooterOrbFrame();
      } catch (error) {
        console.error(error);
      }

      renderSceneWithFallback();
      if (completedSwitchPhase) {
        const resolve = switchPhaseResolve;
        switchPhaseResolve = null;
        state.switchPhase = 'idle';
        state.switchProgress = 0;
        state.switchStartedAt = 0;
        state.switchDuration = 0;
        if (resolve) resolve();
      }
      animationFrameId = window.requestAnimationFrame(animate);
    }

    async function setCard(cardData, options) {
      await ensureScene();
      const settings = options || {};
      const shouldAnimateSwitch = !!(settings.animate && isActive && cardTexture && renderer && scene && camera);
      const switchDirection = settings.direction < 0 ? -1 : 1;
      const setToken = currentCardSetToken + 1;
      currentCardSetToken = setToken;
      currentCardData = Object.assign({}, cardData || {});
      const shouldResumeAudio = audioState.isPlaying;
      if (shouldAnimateSwitch) {
        await runCardSwitchPhase(switchDirection, 'out', CARD_SWITCH_OUT_MS);
      }
      await setAudioSource(currentCardData.audioUrl || '', shouldResumeAudio);
      const textureResult = await buildCardTextureCanvas(buildTextureCardData(currentCardData));
      if (currentCardSetToken !== setToken) {
        return;
      }
      applyTextureResult(textureResult);
      await syncArtworkFallbackLayer(textureResult, currentCardData, setToken);
      if (currentCardSetToken !== setToken) return;
      resize();
      resetClothState();
      if (shouldAnimateSwitch) {
        kickClothForSwitch(-switchDirection, 0.072);
      }
      renderOnce();
      if (shouldAnimateSwitch) {
        await runCardSwitchPhase(switchDirection, 'in', CARD_SWITCH_IN_MS);
      }
    }

    function setActive(nextActive) {
      const wasActive = isActive;
      isActive = !!nextActive;
      if (!isActive) {
        if (animationFrameId) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
        pauseAudioPlayback();
        state.lastTime = 0;
        state.dragActive = false;
        state.dragPointerId = null;
        state.pointerTargetInfluence = 0;
        resetDragState();
        resetSwitchState();
        viewport.classList.remove('is-dragging');
        viewport.style.cursor = 'grab';
        hideArtworkDomOverlay();
        syncFooterVideoPlaybackState();
        return;
      }

      syncFooterVideoPlaybackState();
      if (rendererUnavailable) {
        syncFlatCardFallbackLayout();
        return;
      }
      if (!wasActive && renderer && scene && camera) {
        resize();
        resetClothState();
        renderOnce();
        window.requestAnimationFrame(function () {
          if (!isActive || rendererUnavailable || !renderer || !scene || !camera) return;
          resize();
          resetClothState();
          renderOnce();
        });
      }
      if (!rendererUnavailable && renderer && scene && camera && !animationFrameId) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    }

    function destroy() {
      setActive(false);
      clearFooterVideoBurstTimeout();
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
      window.removeEventListener('blur', releasePointer);
      if (audioElement) {
        try {
          audioElement.pause();
        } catch {}
        try {
          audioElement.removeAttribute('src');
          audioElement.load();
        } catch {}
        if (audioElement.parentNode) {
          audioElement.parentNode.removeChild(audioElement);
        }
      }
      if (footerVideoElement) {
        try {
          footerVideoElement.pause();
        } catch {}
        try {
          footerVideoElement.removeAttribute('src');
          footerVideoElement.load();
        } catch {}
        if (footerVideoElement.parentNode) {
          footerVideoElement.parentNode.removeChild(footerVideoElement);
        }
      }
      if (kickDetector && typeof kickDetector.off === 'function') {
        try {
          kickDetector.off();
        } catch {}
      }
      audioPlaybackUrlCache.forEach(function (objectUrl) {
        if (!objectUrl) return;
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      });
      audioPlaybackUrlCache.clear();
      footerVideoPendingTime = -1;
      footerVideoPrimed = false;
      footerVideoFlushAfterSeek = false;
      audioElement = null;
      if (audioContext && typeof audioContext.close === 'function') {
        try {
          audioContext.close();
        } catch {}
      }
      audioContext = null;
      audioAnalyser = null;
      audioAnalyserSource = null;
      audioAnalyserBins = null;
      audioAnalyserReady = false;
      kickDetector = null;
      dancerInstance = null;
      dancerReady = false;
      dancerSpectrumReady = false;
      footerVideoElement = null;
      footerVideoReady = false;
      if (cardTexture) cardTexture.dispose();
      if (artworkTexture) artworkTexture.dispose();
      if (artworkMaskTexture) artworkMaskTexture.dispose();
      if (shadowTexture) shadowTexture.dispose();
      if (clothMesh) {
        clothMesh.geometry.dispose();
        clothMesh.material.dispose();
      }
      if (artworkMesh) {
        artworkMesh.geometry.dispose();
        artworkMesh.material.dispose();
      }
      if (audioBlobMesh) {
        audioBlobMesh.geometry.dispose();
        audioBlobMesh.material.dispose();
      }
      if (audioBlobGlowMesh) {
        audioBlobGlowMesh.geometry.dispose();
        audioBlobGlowMesh.material.dispose();
      }
      if (shadowMesh) {
        shadowMesh.geometry.dispose();
        shadowMesh.material.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      if (artworkDomOverlay && artworkDomOverlay.parentNode) {
        artworkDomOverlay.parentNode.removeChild(artworkDomOverlay);
      }
      if (flatCardFallbackElement && flatCardFallbackElement.parentNode) {
        flatCardFallbackElement.parentNode.removeChild(flatCardFallbackElement);
      }
      flatCardFallbackElement = null;
      rendererUnavailable = false;
      setFooterSyncMessage('', '', false);
    }

    function getAudioSnapshot() {
      return {
        available: !!audioState.available,
        isPlaying: !!audioState.isPlaying,
        volume: Number.isFinite(audioState.volume) ? audioState.volume : DEFAULT_AUDIO_VOLUME,
        volumePanelOpen: !!audioState.volumePanelOpen,
        currentTime: Number.isFinite(audioState.currentTime) ? audioState.currentTime : 0,
        duration: Number.isFinite(audioState.duration) ? audioState.duration : 0
      };
    }

    return {
      prime: prime,
      setCard: setCard,
      setActive: setActive,
      resize: resize,
      toggleAudioPlayback: toggleAudioPlayback,
      toggleAudioVolumePanel: toggleAudioVolumePanel,
      setAudioVolume: setAudioVolume,
      setAudioProgress: setAudioProgress,
      getAudioSnapshot: getAudioSnapshot,
      resumeAudioSync: startAudioPlayback,
      destroy: destroy
    };
  }

  window.BassfunkClothRelease = {
    create: createRuntime
  };
})();
