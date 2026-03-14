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
  const CLOTH_SEGMENTS_X = 26;
  const CLOTH_SEGMENTS_Y = 38;
  const CLOTH_ITERATIONS = 7;
  const CARD_SWITCH_OUT_MS = 170;
  const CARD_SWITCH_IN_MS = 220;
  let threeLoaderPromise = null;

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

  function roundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, Math.min(width, height) * 0.5));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
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

  function measureCardChipWidth(ctx, label) {
    return Math.ceil(ctx.measureText(String(label || '').trim()).width + 86);
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

  function shouldUseWebAudioForSource(url) {
    try {
      if (window.location && window.location.protocol === 'file:') return false;
    } catch {}
    try {
      const parsedUrl = new URL(String(url || ''), window.location.href);
      if (parsedUrl.protocol === 'file:') return false;
    } catch {}
    return true;
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

  function isImmediateAudioHotspotAction(action) {
    return action === 'audio-toggle' || action === 'audio-volume-toggle';
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

  function drawCardChip(ctx, x, y, label, accent) {
    const text = String(label || '').trim();
    if (!text) return 0;
    ctx.save();
    ctx.font = '500 50px ' + getCanvasUiFontFamily();
    const width = measureCardChipWidth(ctx, text);
    const height = 110;
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, accent || 'rgba(255, 255, 255, 0.16)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    fillRoundedRect(ctx, x, y, width, height, height * 0.5, gradient);
    strokeRoundedRect(ctx, x, y, width, height, height * 0.5, 'rgba(255, 255, 255, 0.18)', 2);
    ctx.fillStyle = '#f3f1ea';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width * 0.5 - ctx.measureText(text).width * 0.5, y + height * 0.54);
    ctx.restore();
    return width;
  }

  function getCanvasUiFontFamily() {
    if (window.location.protocol === 'file:') {
      return '"Helvetica Neue", Arial, sans-serif';
    }
    try {
      const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--ui-font').trim();
      if (fontFamily) return fontFamily;
    } catch {}
    return '"Montserrat", sans-serif';
  }

  async function ensureCanvasFontsLoaded() {
    const uiFontFamily = getCanvasUiFontFamily();
    if (!document.fonts || typeof document.fonts.load !== 'function') return uiFontFamily;
    try {
      await Promise.allSettled([
        document.fonts.load('500 15px ' + uiFontFamily, 'APHEX TWIN'),
        document.fonts.load('400 12px ' + uiFontFamily, 'Computer Controlled Acoustic Instruments pt2 EP'),
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

  function drawControlPlaySymbol(ctx, cx, cy, size, color) {
    const iconWidth = size * 0.34;
    const iconHeight = size * 0.42;
    const offsetX = size * 0.04;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - iconWidth * 0.44 + offsetX, cy - iconHeight * 0.5);
    ctx.lineTo(cx - iconWidth * 0.44 + offsetX, cy + iconHeight * 0.5);
    ctx.lineTo(cx + iconWidth * 0.56 + offsetX, cy);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawControlPauseSymbol(ctx, cx, cy, size, color) {
    const barWidth = Math.max(1.6, size * 0.09);
    const barHeight = size * 0.38;
    const gap = size * 0.08;
    const totalWidth = barWidth * 2 + gap;
    const leftX = cx - totalWidth * 0.5;
    const topY = cy - barHeight * 0.5;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(leftX, topY, barWidth, barHeight);
    ctx.fillRect(leftX + barWidth + gap, topY, barWidth, barHeight);
    ctx.restore();
  }

  function drawControlVolumeSymbol(ctx, cx, cy, size, color, volume) {
    const level = clamp(Number.isFinite(volume) ? volume : DEFAULT_AUDIO_VOLUME, 0, 1);
    const bodyWidth = size * 0.16;
    const bodyHeight = size * 0.22;
    const coneWidth = size * 0.14;
    const coneHeight = size * 0.3;
    const leftX = cx - size * 0.16;
    const bodyTop = cy - bodyHeight * 0.5;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(leftX, bodyTop);
    ctx.lineTo(leftX + bodyWidth, bodyTop);
    ctx.lineTo(leftX + bodyWidth + coneWidth, cy - coneHeight * 0.5);
    ctx.lineTo(leftX + bodyWidth + coneWidth, cy + coneHeight * 0.5);
    ctx.lineTo(leftX + bodyWidth, cy + bodyHeight * 0.5);
    ctx.lineTo(leftX, cy + bodyHeight * 0.5);
    ctx.closePath();
    ctx.fill();
    if (level > 0.04) {
      const waveBaseX = leftX + bodyWidth + coneWidth + size * 0.02;
      const maxWaveCount = level > 0.66 ? 2 : 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.4, size * 0.045);
      ctx.lineCap = 'round';
      for (let waveIndex = 0; waveIndex < maxWaveCount; waveIndex += 1) {
        const waveRadius = size * (0.13 + waveIndex * 0.085);
        ctx.beginPath();
        ctx.arc(waveBaseX, cy, waveRadius, -0.72, 0.72);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.6, size * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(leftX + bodyWidth + size * 0.03, cy - size * 0.12);
      ctx.lineTo(leftX + bodyWidth + size * 0.19, cy + size * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function formatAudioClock(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainderSeconds = totalSeconds % 60;
    return String(minutes) + ':' + String(remainderSeconds).padStart(2, '0');
  }

  function drawAudioSpectrum(ctx, options) {
    const settings = options || {};
    const x = settings.x || 0;
    const y = settings.y || 0;
    const width = settings.width || 0;
    const height = settings.height || 0;
    const bars = Array.isArray(settings.bars) ? settings.bars : [];
    const enabled = !!settings.enabled;
    const isPlaying = !!settings.isPlaying;
    const barCount = Math.max(10, bars.length || 12);
    const gap = Math.max(2, Math.round(width * 0.012));
    const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);
    fillRoundedRect(ctx, x, y + height * 0.72, width, Math.max(1.5, height * 0.18), Math.max(1, height * 0.09), 'rgba(255, 255, 255, 0.08)');
    let drawX = x;
    for (let index = 0; index < barCount; index += 1) {
      const value = bars.length ? clamp(bars[index] || 0, 0, 1) : 0;
      const barHeight = enabled
        ? Math.max(height * 0.22, height * (0.22 + value * (isPlaying ? 1.08 : 0.5)))
        : height * 0.14;
      const barY = y + (height - barHeight);
      const alpha = enabled ? (isPlaying ? 0.52 + value * 0.42 : 0.26 + value * 0.34) : 0.12;
      ctx.save();
      const fill = ctx.createLinearGradient(drawX, barY, drawX, y + height);
      fill.addColorStop(0, 'rgba(255, 205, 176, ' + Math.min(1, alpha + 0.1).toFixed(3) + ')');
      fill.addColorStop(1, 'rgba(109, 174, 255, ' + alpha.toFixed(3) + ')');
      ctx.shadowColor = isPlaying ? 'rgba(255, 166, 110, 0.34)' : 'rgba(255, 255, 255, 0.16)';
      ctx.shadowBlur = isPlaying ? 7 : 3;
      ctx.fillStyle = fill;
      fillRoundedRect(ctx, drawX, barY, barWidth, barHeight, Math.min(barWidth * 0.5, 2.5), ctx.fillStyle);
      ctx.restore();
      drawX += barWidth + gap;
    }
  }

  function toViewportPoint(vector, rect) {
    return {
      x: (vector.x * 0.5 + 0.5) * rect.width,
      y: (-vector.y * 0.5 + 0.5) * rect.height
    };
  }

  function drawCardControl(ctx, cx, cy, size, label, options) {
    const settings = options || {};
    const radius = size * 0.5;
    const left = cx - radius;
    const top = cy - radius;
    const gradient = ctx.createLinearGradient(left, top, left, top + size);
    gradient.addColorStop(0, settings.topColor || 'rgba(52, 58, 70, 0.68)');
    gradient.addColorStop(1, settings.bottomColor || 'rgba(16, 20, 28, 0.84)');

    ctx.save();
    ctx.globalAlpha = settings.disabled ? 0.32 : 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = settings.strokeColor || 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.02, radius * 0.86, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = settings.labelColor || 'rgba(255, 255, 255, 0.96)';
    if (typeof settings.drawSymbol === 'function') {
      settings.drawSymbol(ctx, cx, cy + (settings.labelOffsetY || 1), size, ctx.fillStyle);
    } else {
      ctx.font = '600 ' + (settings.fontSize || 46) + 'px "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy + (settings.labelOffsetY || 1));
    }
    ctx.restore();

    return {
      x: left,
      y: top,
      width: size,
      height: size
    };
  }

  function drawWrappedCardChips(ctx, items, options, hotspots) {
    const settings = options || {};
    const maxWidth = settings.maxWidth || 0;
    const gapX = settings.gapX || 0;
    const gapY = settings.gapY || gapX;
    const startX = settings.x || 0;
    let x = startX;
    let y = settings.y || 0;
    let rowHeight = 110;

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (!item || !item.label) continue;
      ctx.save();
      ctx.font = '500 50px "Helvetica Neue", Arial, sans-serif';
      const chipWidth = measureCardChipWidth(ctx, item.label);
      ctx.restore();
      if (maxWidth && x > startX && x + chipWidth > startX + maxWidth) {
        x = startX;
        y += rowHeight + gapY;
      }
      const drawnWidth = drawCardChip(ctx, x, y, item.label, typeof settings.getAccent === 'function' ? settings.getAccent(item, i) : null);
      if (hotspots && item.url) {
        hotspots.push({
          x: x,
          y: y,
          width: drawnWidth,
          height: rowHeight,
          url: item.url
        });
      }
      x += drawnWidth + gapX;
    }

    return y + rowHeight;
  }

  function drawAudioPlayerRow(ctx, options, hotspots) {
    const settings = options || {};
    const audioState = settings.audioState || {};
    const x = settings.x || 0;
    const y = settings.y || 0;
    const width = settings.width || 0;
    const height = settings.height || 0;
    const scale = settings.scale || 1;
    const uiFontFamily = settings.uiFontFamily || getCanvasUiFontFamily();
    const enabled = !!audioState.available;
    const isPlaying = enabled && !!audioState.isPlaying;
    const volume = clamp(Number.isFinite(audioState.volume) ? audioState.volume : DEFAULT_AUDIO_VOLUME, 0, 1);
    const volumePanelOpen = enabled && !!audioState.volumePanelOpen;
    const audioBands = Array.isArray(audioState.audioBands) ? audioState.audioBands : [];
    const duration = Number.isFinite(audioState.duration) && audioState.duration > 0 ? audioState.duration : 0;
    const currentTime = clamp(Number.isFinite(audioState.currentTime) ? audioState.currentTime : 0, 0, duration || Number.MAX_SAFE_INTEGER);
    const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
    const timeText = enabled ? (formatAudioClock(currentTime) + ' / ' + formatAudioClock(duration)) : 'DIRECT AUDIO IS NOT AVAILABLE';
    const radius = Math.min(height * 0.5, 18 * scale);
    const playerGradient = ctx.createLinearGradient(x, y, x, y + height);
    playerGradient.addColorStop(0, enabled ? 'rgba(24, 28, 36, 0.86)' : 'rgba(18, 21, 28, 0.7)');
    playerGradient.addColorStop(1, enabled ? 'rgba(10, 12, 18, 0.92)' : 'rgba(10, 12, 18, 0.84)');
    fillRoundedRect(ctx, x, y, width, height, radius, playerGradient);
    strokeRoundedRect(ctx, x, y, width, height, radius, enabled ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.08)', 2);

    const controlCenterY = y + height * 0.5;
    const playControlSize = Math.min(height - 6 * scale, 26 * scale);
    const sideControlSize = playControlSize;
    const volumeRightInset = 6 * scale;
    const volumeCenterX = x + width - volumeRightInset - sideControlSize * 0.5;
    const playCenterX = x + 11 * scale + playControlSize * 0.5;
    const playControl = drawCardControl(ctx, playCenterX, controlCenterY, playControlSize, '', {
      disabled: !enabled,
      labelOffsetY: 0,
      topColor: enabled ? 'rgba(255, 154, 105, 0.34)' : 'rgba(34, 39, 48, 0.68)',
      bottomColor: enabled ? 'rgba(60, 23, 15, 0.88)' : 'rgba(12, 15, 22, 0.88)',
      strokeColor: enabled ? 'rgba(255, 207, 185, 0.34)' : 'rgba(255, 255, 255, 0.12)',
      drawSymbol: isPlaying ? drawControlPauseSymbol : drawControlPlaySymbol
    });
    const volumeControl = drawCardControl(ctx, volumeCenterX, controlCenterY, sideControlSize, '', {
      disabled: !enabled,
      topColor: enabled ? 'rgba(38, 44, 56, 0.76)' : 'rgba(24, 28, 36, 0.62)',
      bottomColor: enabled ? 'rgba(10, 12, 18, 0.88)' : 'rgba(10, 12, 18, 0.78)',
      strokeColor: 'rgba(255, 255, 255, 0.14)',
      drawSymbol: function (iconCtx, cx, cy, size, color) {
        drawControlVolumeSymbol(iconCtx, cx, cy, size, color, volume);
      }
    });

    const textX = playControl.x + playControl.width + 10 * scale;
    const playerRightEdge = volumeControl.x - 10 * scale;
    const timeFontSize = 6.85 * scale;
    ctx.save();
    ctx.font = '400 ' + timeFontSize + 'px ' + uiFontFamily;
    const measuredTimeWidth = ctx.measureText(timeText).width;
    ctx.restore();
    const timeColumnWidth = volumePanelOpen
      ? 0
      : clamp(
        measuredTimeWidth + 4 * scale,
        28 * scale,
        Math.max(28 * scale, (playerRightEdge - textX) * 0.46)
      );
    const meterGap = volumePanelOpen ? 0 : 7 * scale;
    const meterX = volumePanelOpen ? textX : (textX + timeColumnWidth + meterGap);
    const meterWidth = Math.max(34 * scale, playerRightEdge - meterX);
    const meterHeight = Math.max(3, 3.2 * scale);
    const meterY = y + height - 9.5 * scale;
    const knobRadius = 4.7 * scale;
    const knobCenterX = meterX + meterWidth * progress;
    const knobCenterY = meterY + meterHeight * 0.5;
    const volumeSliderX = textX;
    const volumeSliderWidth = Math.max(28 * scale, volumeControl.x - volumeSliderX - 10 * scale);
    const volumeSliderHeight = Math.max(3, 3 * scale);
    const volumeSliderY = y + 18.6 * scale;
    const volumeKnobRadius = 4.3 * scale;
    const volumeKnobCenterX = volumeSliderX + volumeSliderWidth * volume;
    const volumeKnobCenterY = volumeSliderY + volumeSliderHeight * 0.5;
    const spectrumX = textX;
    const spectrumY = y + 6.8 * scale;
    const spectrumWidth = Math.max(28 * scale, volumeControl.x - spectrumX - 10 * scale);
    const spectrumHeight = Math.max(10.5 * scale, 13.5 * scale);

    drawAudioSpectrum(ctx, {
      x: spectrumX,
      y: spectrumY,
      width: spectrumWidth,
      height: spectrumHeight,
      bars: audioBands,
      enabled: enabled,
      isPlaying: isPlaying
    });

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = enabled ? 'rgba(243, 241, 234, 0.7)' : 'rgba(243, 241, 234, 0.38)';
    ctx.font = '400 ' + timeFontSize + 'px ' + uiFontFamily;
    if (!volumePanelOpen) {
      ctx.fillText(timeText, textX, knobCenterY - 0.15 * scale);
    }
    ctx.restore();

    if (enabled && volumePanelOpen) {
      fillRoundedRect(ctx, volumeSliderX, volumeSliderY, volumeSliderWidth, volumeSliderHeight, volumeSliderHeight * 0.5, 'rgba(255, 255, 255, 0.18)');
      fillRoundedRect(ctx, volumeSliderX, volumeSliderY, volumeSliderWidth * volume, volumeSliderHeight, volumeSliderHeight * 0.5, 'rgba(255, 255, 255, 0.96)');
      ctx.save();
      ctx.beginPath();
      ctx.arc(volumeKnobCenterX, volumeKnobCenterY, volumeKnobRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(10, 12, 18, 0.42)';
      ctx.lineWidth = Math.max(1, 1.05 * scale);
      ctx.stroke();
      ctx.restore();
    }

    fillRoundedRect(ctx, meterX, meterY, meterWidth, meterHeight, meterHeight * 0.5, 'rgba(255, 255, 255, 0.08)');
    if (enabled) {
      const meterFill = ctx.createLinearGradient(meterX, meterY, meterX + meterWidth, meterY);
      meterFill.addColorStop(0, isPlaying ? 'rgba(255, 150, 96, 0.84)' : 'rgba(255, 255, 255, 0.42)');
      meterFill.addColorStop(1, isPlaying ? 'rgba(109, 174, 255, 0.82)' : 'rgba(109, 174, 255, 0.48)');
      fillRoundedRect(ctx, meterX, meterY, meterWidth * progress, meterHeight, meterHeight * 0.5, meterFill);
      ctx.save();
      const knobGradient = ctx.createLinearGradient(knobCenterX, knobCenterY - knobRadius, knobCenterX, knobCenterY + knobRadius);
      knobGradient.addColorStop(0, enabled ? 'rgba(255, 205, 176, 0.98)' : 'rgba(247, 247, 247, 0.9)');
      knobGradient.addColorStop(1, enabled ? 'rgba(194, 93, 49, 0.97)' : 'rgba(173, 193, 255, 0.92)');
      ctx.beginPath();
      ctx.arc(knobCenterX, knobCenterY, knobRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = knobGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(12, 15, 20, 0.42)';
      ctx.lineWidth = Math.max(1, 1.1 * scale);
      ctx.stroke();
      ctx.restore();
    }

    if (hotspots && enabled) {
      const hitPadding = 8 * scale;
      const progressHotspotStartX = meterX - 2 * scale;
      const progressHotspotEndX = Math.min(
        meterX + meterWidth + 2 * scale,
        volumeControl.x - hitPadding - 8 * scale
      );
      hotspots.push({
        x: x + 3 * scale,
        y: y + 3 * scale,
        width: width - 6 * scale,
        height: height - 6 * scale,
        action: 'ui-block'
      });
      hotspots.push({
        x: playControl.x - hitPadding,
        y: playControl.y - hitPadding,
        width: playControl.width + hitPadding * 2,
        height: playControl.height + hitPadding * 2,
        action: 'audio-toggle'
      });
      if (progressHotspotEndX > progressHotspotStartX) {
        hotspots.push({
          x: progressHotspotStartX,
          y: meterY - 10 * scale,
          width: progressHotspotEndX - progressHotspotStartX,
          height: Math.max(18 * scale, meterHeight + 20 * scale),
          action: 'audio-progress-set',
          rangeMinX: meterX,
          rangeWidth: meterWidth
        });
      }
      hotspots.push({
        x: volumeControl.x - hitPadding,
        y: volumeControl.y - hitPadding,
        width: volumeControl.width + hitPadding * 2,
        height: volumeControl.height + hitPadding * 2,
        action: 'audio-volume-toggle'
      });
      if (volumePanelOpen) {
        hotspots.push({
          x: volumeSliderX - 6 * scale,
          y: volumeSliderY - 10 * scale,
          width: volumeSliderWidth + 12 * scale,
          height: Math.max(18 * scale, volumeSliderHeight + 20 * scale),
          action: 'audio-volume-set',
          rangeMinX: volumeSliderX,
          rangeWidth: volumeSliderWidth
        });
      }
    }

    return y + height;
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
    const controlSize = 26 * scale;
    const closeSize = controlSize;
    const closeInset = 12 * scale;
    const contentWidth = canvas.width - padding * 2;
    const artworkX = padding;
    const artworkY = padding;
    const artworkWidth = contentWidth;
    const artworkHeight = artworkWidth;
    const contentX = padding + contentInset;
    const contentTop = artworkY + artworkHeight + 12 * scale;
    const textMaxWidth = contentWidth - 8 * scale;
    const chipGapX = 6 * scale;
    const chipGapY = 8 * scale;
    const metaGapY = 14 * scale;
    const playerGapY = 12 * scale;
    const playerHeight = 32 * scale;
    const uiFontFamily = await ensureCanvasFontsLoaded();
    const artistFontSize = 15 * scale;
    const titleFontSize = 12 * scale;
    const artistLineHeight = artistFontSize * 0.98;
    const titleLineHeight = titleFontSize * 1.16;
    const metaLabelFontSize = 9 * scale;
    const artistText = String(cardData && cardData.artistName || '').toUpperCase();
    const releaseLinks = Array.isArray(cardData && cardData.releaseLinks) ? cardData.releaseLinks.slice(0, 4) : [];
    const socialLinks = Array.isArray(cardData && cardData.socialLinks) ? cardData.socialLinks.slice(0, 4) : [];
    const audioState = cardData && cardData.audioState ? cardData.audioState : null;
    const hasAudio = !!((audioState && audioState.available) || (cardData && cardData.audioUrl));
    const playerVisible = true;
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
    const titleY = contentTop + artistBlockHeight + 8 * scale;
    let contentBottom = titleY + titleLines.length * titleLineHeight;
    if (releaseLinks.length) {
      contentBottom = drawWrappedCardChips(measureCtx, releaseLinks, {
        x: contentX,
        y: contentBottom + 12 * scale,
        maxWidth: contentWidth,
        gapX: chipGapX,
        gapY: chipGapY
      });
    }
    if (playerVisible) {
      contentBottom += playerGapY + playerHeight;
    }
    if (socialLinks.length) {
      const dividerY = contentBottom + metaGapY;
      const metaLabelY = dividerY + 12 * scale;
      contentBottom = drawWrappedCardChips(measureCtx, socialLinks, {
        x: contentX,
        y: metaLabelY + metaLabelFontSize + 8 * scale,
        maxWidth: contentWidth,
        gapX: 8 * scale,
        gapY: chipGapY
      });
    }
    const bottomPadding = 10 * scale;
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

    const prevControl = drawCardControl(ctx, artworkX + 22 * scale, artworkY + artworkHeight * 0.56, controlSize, '\u2039', {
      disabled: !cardData.canGoPrev,
      fontSize: 17 * scale,
      labelOffsetY: -0.8 * scale,
      topColor: 'rgba(22, 26, 34, 0.66)',
      bottomColor: 'rgba(8, 10, 14, 0.82)',
      strokeColor: 'rgba(255, 255, 255, 0.18)'
    });
    if (cardData.canGoPrev) {
      const hitPadding = 8 * scale;
      hotspots.push({
        x: prevControl.x - hitPadding,
        y: prevControl.y - hitPadding,
        width: prevControl.width + hitPadding * 2,
        height: prevControl.height + hitPadding * 2,
        action: 'prev'
      });
    }

    const nextControl = drawCardControl(ctx, artworkX + artworkWidth - 22 * scale, artworkY + artworkHeight * 0.56, controlSize, '\u203a', {
      disabled: !cardData.canGoNext,
      fontSize: 17 * scale,
      labelOffsetY: -0.8 * scale,
      topColor: 'rgba(22, 26, 34, 0.66)',
      bottomColor: 'rgba(8, 10, 14, 0.82)',
      strokeColor: 'rgba(255, 255, 255, 0.18)'
    });
    if (cardData.canGoNext) {
      const hitPadding = 8 * scale;
      hotspots.push({
        x: nextControl.x - hitPadding,
        y: nextControl.y - hitPadding,
        width: nextControl.width + hitPadding * 2,
        height: nextControl.height + hitPadding * 2,
        action: 'next'
      });
    }

    const closeControl = drawCardControl(ctx, cardWidth - closeInset - closeSize * 0.5, closeInset + closeSize * 0.5, closeSize, '\u00d7', {
      topColor: 'rgba(22, 26, 34, 0.66)',
      bottomColor: 'rgba(8, 10, 14, 0.82)',
      fontSize: 12.4 * scale,
      labelOffsetY: -0.48 * scale,
      strokeColor: 'rgba(255, 255, 255, 0.18)'
    });
    const closeHitPadding = 8 * scale;
    hotspots.push({
      x: closeControl.x - closeHitPadding,
      y: closeControl.y - closeHitPadding,
      width: closeControl.width + closeHitPadding * 2,
      height: closeControl.height + closeHitPadding * 2,
      action: 'close'
    });

    ctx.restore();

    strokeRoundedRect(ctx, cardX + scale * 0.5, cardY + scale * 0.5, cardWidth - scale, cardHeight - scale, cardRadius - scale * 0.6, 'rgba(255, 255, 255, 0.1)', scale * 0.55);
    strokeRoundedRect(ctx, cardX + scale, cardY + scale, cardWidth - scale * 2, cardHeight - scale * 2, innerRadius, 'rgba(255, 255, 255, 0.04)', scale * 0.35);

    ctx.save();
    ctx.fillStyle = 'rgba(243, 241, 234, 0.82)';
    ctx.font = '500 ' + artistFontSize + 'px ' + uiFontFamily;
    ctx.textBaseline = 'top';
    for (let artistLineIndex = 0; artistLineIndex < artistLines.length; artistLineIndex += 1) {
      ctx.fillText(artistLines[artistLineIndex], contentX, contentTop + artistLineIndex * artistLineHeight);
    }

    ctx.fillStyle = '#f4f1e8';
    ctx.font = '400 ' + titleFontSize + 'px ' + uiFontFamily;
    for (let lineIndex = 0; lineIndex < titleLines.length; lineIndex += 1) {
      ctx.fillText(titleLines[lineIndex], contentX, titleY + lineIndex * titleLineHeight);
    }

    contentBottom = titleY + titleLines.length * titleLineHeight;
    if (releaseLinks.length) {
      contentBottom = drawWrappedCardChips(ctx, releaseLinks, {
        x: contentX,
        y: contentBottom + 12 * scale,
        maxWidth: contentWidth,
        gapX: chipGapX,
        gapY: chipGapY,
        getAccent: function (item, index) {
          return index === 0 ? 'rgba(255, 146, 96, 0.22)' : null;
        }
      }, hotspots);
    }

    if (playerVisible) {
      contentBottom = drawAudioPlayerRow(ctx, {
        x: contentX,
        y: contentBottom + playerGapY,
        width: contentWidth,
        height: playerHeight,
        scale: scale,
        uiFontFamily: uiFontFamily,
        audioState: {
          available: hasAudio,
          isPlaying: !!(audioState && audioState.isPlaying),
          volume: audioState && typeof audioState.volume === 'number' ? audioState.volume : DEFAULT_AUDIO_VOLUME,
          currentTime: audioState && typeof audioState.currentTime === 'number' ? audioState.currentTime : 0,
          duration: audioState && typeof audioState.duration === 'number' ? audioState.duration : 0
        }
      }, hotspots);
    }

    if (socialLinks.length) {
      const dividerY = contentBottom + metaGapY;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = Math.max(1, scale * 0.4);
      ctx.beginPath();
      ctx.moveTo(contentX, dividerY);
      ctx.lineTo(contentX + contentWidth, dividerY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(243, 241, 234, 0.9)';
      ctx.font = '500 ' + metaLabelFontSize + 'px ' + uiFontFamily;
      const metaLabelY = dividerY + 12 * scale;
      ctx.fillText('ARTIST LINKS', contentX, metaLabelY);

      drawWrappedCardChips(ctx, socialLinks, {
        x: contentX,
        y: metaLabelY + metaLabelFontSize + 8 * scale,
        maxWidth: contentWidth,
        gapX: 8 * scale,
        gapY: chipGapY,
        getAccent: function () {
          return 'rgba(109, 174, 255, 0.2)';
        }
      }, hotspots);
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

  function createRuntime(options) {
    const viewport = options && options.viewport;
    if (!viewport) throw new Error('Viewport is required');
    const onClose = options && typeof options.onClose === 'function' ? options.onClose : null;
    const onPrev = options && typeof options.onPrev === 'function' ? options.onPrev : null;
    const onNext = options && typeof options.onNext === 'function' ? options.onNext : null;

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
    let textureRefreshRafId = 0;
    let audioElement = null;
    let audioContext = null;
    let audioSourceNode = null;
    let analyserNode = null;
    let analyserData = null;
    let audioAnalyserSinkNode = null;

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
      volumeDragActive: false,
      movedSincePointerDown: false,
      shadowBaseY: -1.44,
      switchPhase: 'idle',
      switchProgress: 0,
      switchDirection: 1,
      switchStartedAt: 0,
      switchDuration: 0,
      audioLevel: 0,
      audioBass: 0,
      audioBlobBaseScale: 1,
      audioTextureRefreshAt: 0
    };

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
      let audioBands = sampleAudioBands();
      if (audioState.isPlaying && (!audioBands.length || audioBands.every(function (value) { return value < 0.015; }))) {
        audioBands = sampleFallbackAudioBands();
      }
      payload.audioState = {
        available: !!(payload.audioUrl),
        isPlaying: !!audioState.isPlaying,
        volume: audioState.volume,
        volumePanelOpen: !!audioState.volumePanelOpen,
        audioBands: audioBands,
        currentTime: audioState.currentTime,
        duration: audioState.duration
      };
      return payload;
    }

    function applyTextureResult(textureResult) {
      if (!textureResult || !THREE || !renderer) return;
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
      cardHotspots = Array.isArray(textureResult.hotspots) ? textureResult.hotspots.slice() : [];
      state.textureWidth = textureResult.textureWidth || TEXTURE_WIDTH;
      state.textureHeight = textureResult.textureHeight || DEFAULT_TEXTURE_HEIGHT;
      state.cardAspect = textureResult.cardAspect || (state.textureHeight / Math.max(1, state.textureWidth));
      if (clothMaterial) {
        clothMaterial.map = cardTexture;
        clothMaterial.needsUpdate = true;
      }
    }

    async function refreshCardTexture() {
      if (!currentCardData || !renderer || !THREE) return;
      const textureResult = await buildCardTextureCanvas(buildTextureCardData(currentCardData));
      applyTextureResult(textureResult);
      await syncArtworkFallbackLayer(textureResult, currentCardData);
      resize();
      renderOnce();
    }

    function scheduleCardTextureRefresh() {
      if (!currentCardData || textureRefreshRafId) return;
      textureRefreshRafId = window.requestAnimationFrame(function () {
        textureRefreshRafId = 0;
        refreshCardTexture().catch(function (error) {
          console.error(error);
        });
      });
    }

    function syncAudioPlaybackState() {
      audioState.isPlaying = !!(audioElement && !audioElement.paused && !audioElement.ended);
      scheduleCardTextureRefresh();
    }

    function syncAudioTimelineState() {
      if (!audioElement) return;
      audioState.currentTime = Number.isFinite(audioElement.currentTime) ? Math.max(0, audioElement.currentTime) : 0;
      audioState.duration = Number.isFinite(audioElement.duration) && audioElement.duration > 0 ? audioElement.duration : 0;
      scheduleCardTextureRefresh();
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
        scheduleCardTextureRefresh();
      });
      audioElement.addEventListener('error', function () {
        audioState.isPlaying = false;
        audioState.currentTime = 0;
        audioState.duration = 0;
        scheduleCardTextureRefresh();
      });
      return audioElement;
    }

    function disconnectAudioAnalysisGraph() {
      if (audioAnalyserSinkNode) {
        try {
          audioAnalyserSinkNode.disconnect();
        } catch {}
        audioAnalyserSinkNode = null;
      }
      if (analyserNode) {
        try {
          analyserNode.disconnect();
        } catch {}
        analyserNode = null;
      }
      if (audioSourceNode) {
        try {
          audioSourceNode.disconnect();
        } catch {}
        audioSourceNode = null;
      }
      analyserData = null;
    }

    function ensureAudioContext() {
      if (!shouldUseWebAudioForSource(audioState.url)) return null;
      if (audioContext) return audioContext;
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      try {
        audioContext = new AudioContextCtor();
      } catch (error) {
        console.warn('Audio context is unavailable.', error);
        audioContext = null;
        return null;
      }
      return audioContext;
    }

    function ensureAudioAnalyserGraph() {
      if (!shouldUseWebAudioForSource(audioState.url)) {
        disconnectAudioAnalysisGraph();
        return false;
      }
      if (!audioContext) return false;
      if (audioSourceNode && analyserNode && analyserData) return true;
      disconnectAudioAnalysisGraph();
      const element = ensureAudioElement();
      try {
        audioSourceNode = audioContext.createMediaElementSource(element);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.84;
        analyserData = new Uint8Array(analyserNode.frequencyBinCount);
        audioSourceNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
        return true;
      } catch (error) {
        console.warn('Audio analyser is unavailable.', error);
        disconnectAudioAnalysisGraph();
        return false;
      }
    }

    async function startAudioPlayback() {
      if (!audioState.url) return;
      const element = ensureAudioElement();
      const canUseWebAudio = shouldUseWebAudioForSource(audioState.url);
      const context = canUseWebAudio ? ensureAudioContext() : null;
      let resumePromise = null;
      if (element.readyState < 1) {
        try {
          element.load();
        } catch {}
      }
      if (context && context.state !== 'running' && typeof context.resume === 'function') {
        resumePromise = context.resume().catch(function (error) {
          console.warn('Failed to resume audio context.', error);
        });
      }
      element.volume = audioState.volume;
      try {
        const playPromise = element.play();
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise;
        }
        if (resumePromise) {
          await resumePromise;
        }
        if (canUseWebAudio && context && context.state === 'running') {
          ensureAudioAnalyserGraph();
        } else if (!canUseWebAudio) {
          disconnectAudioAnalysisGraph();
        }
        syncAudioPlaybackState();
        syncAudioTimelineState();
      } catch (error) {
        audioState.isPlaying = false;
        scheduleCardTextureRefresh();
        throw error;
      }
    }

    function pauseAudioPlayback() {
      if (audioElement) {
        try {
          audioElement.pause();
        } catch {}
      }
      audioState.isPlaying = false;
      scheduleCardTextureRefresh();
    }

    async function setAudioSource(url, shouldResume) {
      const normalizedUrl = resolveRuntimeUrl(url);
      const element = ensureAudioElement();
      const resumePlayback = !!(normalizedUrl && shouldResume);
      if (audioState.url === normalizedUrl) {
        audioState.available = !!normalizedUrl;
        element.volume = audioState.volume;
        if (normalizedUrl && element.readyState < 1) {
          try {
            element.load();
          } catch {}
        }
        scheduleCardTextureRefresh();
        return;
      }
      try {
        element.pause();
      } catch {}
      audioState.isPlaying = false;
      audioState.currentTime = 0;
      audioState.duration = 0;
      audioState.volumePanelOpen = false;
      audioState.url = normalizedUrl;
      audioState.available = !!normalizedUrl;
      if (!shouldUseWebAudioForSource(normalizedUrl)) {
        disconnectAudioAnalysisGraph();
        if (audioContext && typeof audioContext.close === 'function') {
          try {
            audioContext.close();
          } catch {}
        }
        audioContext = null;
      }
      try {
        try {
          const parsedUrl = new URL(normalizedUrl, window.location.href);
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
        if (normalizedUrl) {
          element.src = normalizedUrl;
          element.load();
        } else {
          element.load();
        }
      } catch (error) {
        console.warn('Failed to update audio source.', error);
      }
      element.volume = audioState.volume;
      scheduleCardTextureRefresh();
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
      scheduleCardTextureRefresh();
    }

    function toggleAudioVolumePanel() {
      if (!audioState.available) return;
      audioState.volumePanelOpen = !audioState.volumePanelOpen;
      scheduleCardTextureRefresh();
    }

    function getAudioProgressValueForHotspot(hotspot, uv) {
      if (!hotspot || (hotspot.action !== 'audio-progress-set' && hotspot.action !== 'audio-volume-set') || !uv) return 0;
      const textureWidth = state.textureWidth || TEXTURE_WIDTH;
      const px = clamp(uv.x, 0, 1) * textureWidth;
      const rangeMinX = typeof hotspot.rangeMinX === 'number' ? hotspot.rangeMinX : hotspot.x;
      const rangeWidth = Math.max(1, typeof hotspot.rangeWidth === 'number' ? hotspot.rangeWidth : hotspot.width);
      return clamp((px - rangeMinX) / rangeWidth, 0, 1);
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
      scheduleCardTextureRefresh();
    }

    function updateProgressFromHotspot(hotspot, uv) {
      if (!hotspot || hotspot.action !== 'audio-progress-set') return;
      setAudioProgress(getAudioProgressValueForHotspot(hotspot, uv));
    }

    function updateVolumeFromHotspot(hotspot, uv) {
      if (!hotspot || hotspot.action !== 'audio-volume-set') return;
      setAudioVolume(getAudioProgressValueForHotspot(hotspot, uv));
    }

    function getFallbackAudioPhase() {
      const baseTime = Number.isFinite(audioState.currentTime) ? audioState.currentTime : 0;
      return baseTime + state.time * 0.35;
    }

    function sampleFallbackAudioBands() {
      if (!audioState.isPlaying) return [];
      const phase = getFallbackAudioPhase();
      const bands = [];
      const bandCount = 12;
      for (let bandIndex = 0; bandIndex < bandCount; bandIndex += 1) {
        const bandPhase = phase * (1.7 + bandIndex * 0.11) + bandIndex * 0.82;
        const wave =
          Math.sin(bandPhase) * 0.5 +
          Math.sin(bandPhase * 1.93 + 0.4) * 0.3 +
          Math.cos(bandPhase * 0.61 - 0.2) * 0.2;
        const shaped = Math.pow(clamp((wave + 1) * 0.5, 0, 1), 1.2);
        bands.push(clamp(0.08 + shaped * (0.28 + (bandIndex / Math.max(1, bandCount - 1)) * 0.44), 0, 1));
      }
      return bands;
    }

    function sampleAudioBands() {
      if (!audioState.isPlaying) return [];
      if (!analyserNode || !analyserData) {
        return sampleFallbackAudioBands();
      }
      try {
        analyserNode.getByteFrequencyData(analyserData);
        const bands = [];
        const bandCount = 12;
        const startIndex = 2;
        const endIndex = Math.min(analyserData.length, 74);
        const span = Math.max(1, endIndex - startIndex);
        for (let bandIndex = 0; bandIndex < bandCount; bandIndex += 1) {
          const from = startIndex + Math.floor((bandIndex / bandCount) * span);
          const to = startIndex + Math.floor(((bandIndex + 1) / bandCount) * span);
          let sum = 0;
          let count = 0;
          for (let index = from; index < Math.max(from + 1, to); index += 1) {
            sum += analyserData[index] / 255;
            count += 1;
          }
          bands.push(clamp((sum / Math.max(1, count)) * 1.15, 0, 1));
        }
        if (!bands.length || bands.every(function (value) { return value < 0.015; })) {
          return sampleFallbackAudioBands();
        }
        return bands;
      } catch {
        return sampleFallbackAudioBands();
      }
    }

    function sampleAudioLevel(delta) {
      let nextLevel = 0;
      let nextBass = 0;
      if (audioState.isPlaying && analyserNode && analyserData) {
        try {
          analyserNode.getByteFrequencyData(analyserData);
          let weightedSum = 0;
          let peak = 0;
          const limit = Math.min(analyserData.length, 72);
          for (let index = 2; index < limit; index += 1) {
            const normalizedValue = analyserData[index] / 255;
            weightedSum += normalizedValue * (1 + (index / Math.max(1, limit)) * 0.42);
            if (normalizedValue > peak) peak = normalizedValue;
          }
          nextLevel = clamp((weightedSum / Math.max(1, limit - 2)) * 0.78 + peak * 0.42, 0, 1);
          let bassSum = 0;
          let bassPeak = 0;
          let bassCount = 0;
          const bassLimit = Math.min(analyserData.length, 18);
          for (let index = 2; index < bassLimit; index += 1) {
            const normalizedValue = analyserData[index] / 255;
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
      return state.audioLevel;
    }

    function createAudioBlob() {
      if (!THREE || !root || audioBlobGroup) return;
      audioBlobGroup = new THREE.Group();
      audioBlobGroup.position.set(0, 0.08, -0.74);
      audioBlobGroup.scale.setScalar(state.audioBlobBaseScale || 1);

      audioBlobMaterial = new THREE.ShaderMaterial({
        transparent: true,
        wireframe: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uAudio: { value: 0 },
          uBass: { value: 0 },
          uColor: { value: new THREE.Color('#f4f5f7') }
        },
        vertexShader: [
          'uniform float uTime;',
          'uniform float uAudio;',
          'uniform float uBass;',
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
          '  float time = uTime * (0.07 + uAudio * 0.18 + uBass * 0.24);',
          '  float coarse = fbm(position * (1.28 + uBass * 0.58) + vec3(time * 0.46, -time * 0.18, time * 0.24));',
          '  float ridged = 1.0 - abs(fbm(position.yzx * 2.05 + vec3(-time * 0.22, time * 0.48, time * 0.11)) * 2.0 - 1.0);',
          '  float swirl = noise3d(position.zxy * 3.1 + vec3(time * 0.62, -time * 0.34, time * 0.16));',
          '  vec3 warpedNormal = normalize(n + vec3((coarse - 0.5) * 0.7, (ridged - 0.5) * 0.94, (swirl - 0.5) * 0.66));',
          '  float ripple = sin(position.y * 3.2 + time * 1.28 + position.x * 1.4) * 0.5 + 0.5;',
          '  float distortion = ((coarse - 0.5) * 0.84) + ((ridged - 0.5) * 1.12) + ((swirl - 0.5) * 0.58) + (ripple - 0.5) * (0.28 + uBass * 0.42);',
          '  float amplitude = 0.026 + uAudio * 0.09 + uBass * 0.16;',
          '  displaced += warpedNormal * distortion * amplitude;',
          '  displaced.xy *= 1.0 + vec2(0.03 + uBass * 0.1, 0.06 + uAudio * 0.05) * vec2(sin(time * 0.92 + position.z * 1.7), cos(time * 0.88 + position.x * 1.4));',
          '  displaced.z *= 0.98 + (ridged * 0.08) + uBass * 0.04;',
          '  vAudio = clamp(uAudio * 0.68 + uBass * 0.58, 0.0, 1.0);',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform vec3 uColor;',
          'varying float vAudio;',
          'void main() {',
          '  float alpha = 0.12 + vAudio * 0.46;',
          '  gl_FragColor = vec4(uColor, alpha);',
          '}'
        ].join('\n')
      });

      audioBlobMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.98, 2), audioBlobMaterial);
      audioBlobMesh.rotation.set(0.24, 0.2, -0.12);
      audioBlobMesh.scale.set(1.24, 1.56, 0.82);
      audioBlobMesh.renderOrder = 0;
      audioBlobGroup.add(audioBlobMesh);

      root.add(audioBlobGroup);
    }

    function updateAudioBlob(delta, audioLevel) {
      if (!audioBlobGroup) return;
      const reactiveLevel = audioState.isPlaying && audioState.duration > 0 ? audioLevel : 0;
      const bassLevel = audioState.isPlaying && audioState.duration > 0 ? state.audioBass : 0;
      const idleDrift = reactiveLevel > 0.01 ? 1 : 0.14;
      const pulse = Math.sin(state.time * 0.82 + bassLevel * 1.6);
      const sway = Math.sin(state.time * 0.46 + 0.7);
      const targetX = Math.sin(state.time * 0.28) * (0.01 * idleDrift + reactiveLevel * 0.022 + bassLevel * 0.034) - state.posX * (0.024 + reactiveLevel * 0.03);
      const targetY = 0.08 + Math.cos(state.time * 0.31) * (0.012 * idleDrift + reactiveLevel * 0.018) + state.posY * (0.016 + reactiveLevel * 0.026) + pulse * bassLevel * 0.015;
      const targetZ = -0.72 - reactiveLevel * 0.05 - bassLevel * 0.08;
      audioBlobGroup.position.x += (targetX - audioBlobGroup.position.x) * Math.min(1, delta * 2.6);
      audioBlobGroup.position.y += (targetY - audioBlobGroup.position.y) * Math.min(1, delta * 2.6);
      audioBlobGroup.position.z += (targetZ - audioBlobGroup.position.z) * Math.min(1, delta * 2.8);
      const targetRotX = 0.24 + sway * 0.12 + reactiveLevel * 0.12 + bassLevel * 0.18;
      const targetRotY = 0.18 + Math.sin(state.time * 0.38 + 1.2) * 0.16 - reactiveLevel * 0.08 + bassLevel * 0.22;
      const targetRotZ = -0.14 + Math.sin(state.time * 0.26 - 0.4) * 0.08 + bassLevel * 0.09;
      audioBlobGroup.rotation.x += (targetRotX - audioBlobGroup.rotation.x) * Math.min(1, delta * 2.2);
      audioBlobGroup.rotation.y += (targetRotY - audioBlobGroup.rotation.y) * Math.min(1, delta * 2.2);
      audioBlobGroup.rotation.z += (targetRotZ - audioBlobGroup.rotation.z) * Math.min(1, delta * 2.1);
      const blobScale = (state.audioBlobBaseScale || 1) * (1.04 + reactiveLevel * 0.12 + bassLevel * 0.18 + pulse * (0.018 + bassLevel * 0.03));
      const rootScaleX = root && root.scale ? root.scale.x : 1;
      const rootScaleY = root && root.scale ? root.scale.y : 1;
      const yScaleCompensation = rootScaleX / Math.max(rootScaleY, 0.001);
      const scaleX = blobScale * (1.18 + bassLevel * 0.12 + sway * 0.05);
      const scaleY = blobScale * yScaleCompensation * (1.44 + bassLevel * 0.1 + Math.cos(state.time * 0.52) * 0.04);
      const scaleZ = blobScale * (0.82 + bassLevel * 0.08 - sway * 0.03);
      audioBlobGroup.scale.set(scaleX, scaleY, scaleZ);
      if (audioBlobMaterial) {
        audioBlobMaterial.uniforms.uTime.value = state.time;
        audioBlobMaterial.uniforms.uAudio.value = reactiveLevel;
        audioBlobMaterial.uniforms.uBass.value = bassLevel;
      }
    }

    function triggerHotspot(hotspot) {
      if (!hotspot) return;
      if (hotspot.action === 'ui-block') {
        return;
      }
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
      if (hotspot.action === 'audio-toggle') {
        toggleAudioPlayback();
        return;
      }
      if (hotspot.action === 'audio-volume-toggle') {
        toggleAudioVolumePanel();
        return;
      }
      if (hotspot.action === 'audio-volume-set') {
        updateVolumeFromHotspot(hotspot, {
          x: state.pointerTargetUvX,
          y: state.pointerTargetUvY
        });
        return;
      }
      if (hotspot.action === 'audio-progress-set') {
        updateProgressFromHotspot(hotspot, {
          x: state.pointerTargetUvX,
          y: state.pointerTargetUvY
        });
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
      overlay.style.borderRadius = radiusPercent.toFixed(3) + '%';
      overlay.style.clipPath = 'inset(0 round ' + radiusPercent.toFixed(3) + '%)';
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

    function findHotspotAtUv(uv) {
      if (!uv || !cardHotspots.length) return null;
      const textureWidth = state.textureWidth || TEXTURE_WIDTH;
      const textureHeight = state.textureHeight || DEFAULT_TEXTURE_HEIGHT;
      const px = clamp(uv.x, 0, 1) * textureWidth;
      const topDownY = clamp(uv.y, 0, 1) * textureHeight;
      const bottomUpY = (1 - clamp(uv.y, 0, 1)) * textureHeight;
      let mirroredMatch = null;
      for (let i = cardHotspots.length - 1; i >= 0; i -= 1) {
        const hotspot = cardHotspots[i];
        const withinX = px >= hotspot.x && px <= hotspot.x + hotspot.width;
        const withinTopDown = topDownY >= hotspot.y && topDownY <= hotspot.y + hotspot.height;
        const withinBottomUp = bottomUpY >= hotspot.y && bottomUpY <= hotspot.y + hotspot.height;
        if (!withinX) continue;
        if (withinTopDown) return hotspot;
        if (!mirroredMatch && withinBottomUp) mirroredMatch = hotspot;
      }
      return mirroredMatch;
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
      if (!updatePointerHit(event.clientX, event.clientY)) return;
      state.pressHotspot = findHotspotAtUv({
        x: state.pointerTargetUvX,
        y: state.pointerTargetUvY
      });
      const pressAction = state.pressHotspot && state.pressHotspot.action;
      state.pressHotspotConsumed = false;
      state.volumeDragActive = !!(pressAction === 'audio-progress-set' || pressAction === 'audio-volume-set');
      state.dragActive = !state.pressHotspot;
      state.dragPointerId = event.pointerId;
      state.dragStartClientX = event.clientX;
      state.dragStartClientY = event.clientY;
      state.dragStartPosX = state.targetPosX;
      state.dragStartPosY = state.targetPosY;
      state.movedSincePointerDown = false;
      state.pointerTargetInfluence = state.dragActive ? 1.18 : 0;
      if (state.volumeDragActive) {
        if (pressAction === 'audio-volume-set') {
          updateVolumeFromHotspot(state.pressHotspot, {
            x: state.pointerTargetUvX,
            y: state.pointerTargetUvY
          });
        } else {
          updateProgressFromHotspot(state.pressHotspot, {
            x: state.pointerTargetUvX,
            y: state.pointerTargetUvY
          });
        }
      } else if (isImmediateAudioHotspotAction(pressAction)) {
        state.dragActive = false;
        state.pressHotspotConsumed = true;
        triggerHotspot(state.pressHotspot);
      }
      if (state.pressHotspot) {
        event.preventDefault();
      }
      if (state.dragActive) {
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
      if (state.dragPointerId === event.pointerId && state.volumeDragActive) {
        if (updatePointerHit(event.clientX, event.clientY)) {
          if (state.pressHotspot && state.pressHotspot.action === 'audio-volume-set') {
            updateVolumeFromHotspot(state.pressHotspot, {
              x: state.pointerTargetUvX,
              y: state.pointerTargetUvY
            });
          } else {
            updateProgressFromHotspot(state.pressHotspot, {
              x: state.pointerTargetUvX,
              y: state.pointerTargetUvY
            });
          }
        }
        event.preventDefault();
        return;
      }
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
      const wasVolumeDrag = state.volumeDragActive;
      const shouldOpenHotspot = !!(
        pressedHotspotId &&
        !state.pressHotspotConsumed &&
        !state.movedSincePointerDown &&
        !wasVolumeDrag &&
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
      state.volumeDragActive = false;
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
      if (renderer) return;
      if (scenePromise) return scenePromise;

      scenePromise = (async function () {
        THREE = await ensureThree();

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
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

        const fillLight = new THREE.DirectionalLight(0x8ab7ff, 0.34);
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
      } catch (error) {
        scenePromise = null;
        throw error;
      }

      scenePromise = null;
    }

    function resize() {
      if (!renderer || !camera) return;
      const rect = getViewportRect();
      if (!rect.width || !rect.height) return;
      const aspect = rect.width / Math.max(1, rect.height);
      const isCompact = rect.width < 760;
      const maxWidthPx = Math.min(isCompact ? 198 : 205, rect.width - (isCompact ? 20 : 24));
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
      const desiredBlobLocalWidth = PLANE_WIDTH * (isCompact ? 1.52 : 1.66);
      state.audioBlobBaseScale = clamp(desiredBlobLocalWidth / 1.96, 0.96, 1.18);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      syncArtworkDomOverlayTransform();
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
      if (audioState.isPlaying && now - state.audioTextureRefreshAt > 72) {
        state.audioTextureRefreshAt = now;
        scheduleCardTextureRefresh();
      }
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
      updateAudioBlob(delta, audioLevel);

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
      const shouldAnimateSwitch = !!(settings.animate && isActive && cardTexture);
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
      isActive = !!nextActive;
      if (!isActive) {
        if (textureRefreshRafId) {
          window.cancelAnimationFrame(textureRefreshRafId);
          textureRefreshRafId = 0;
        }
        if (animationFrameId) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
        pauseAudioPlayback();
        state.lastTime = 0;
        state.dragActive = false;
        state.dragPointerId = null;
        state.pointerTargetInfluence = 0;
        state.volumeDragActive = false;
        resetDragState();
        resetSwitchState();
        viewport.classList.remove('is-dragging');
        viewport.style.cursor = 'grab';
        hideArtworkDomOverlay();
        return;
      }

      if (!animationFrameId) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    }

    function destroy() {
      setActive(false);
      if (textureRefreshRafId) {
        window.cancelAnimationFrame(textureRefreshRafId);
        textureRefreshRafId = 0;
      }
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
      disconnectAudioAnalysisGraph();
      if (audioContext && typeof audioContext.close === 'function') {
        try {
          audioContext.close();
        } catch {}
      }
      audioElement = null;
      audioContext = null;
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
    }

    return {
      prime: prime,
      setCard: setCard,
      setActive: setActive,
      resize: resize,
      destroy: destroy
    };
  }

  window.BassfunkClothRelease = {
    create: createRuntime
  };
})();
