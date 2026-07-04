import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { motion } from 'motion/react';
import { Toaster } from 'sileo';

const HOVER_TOAST_ID = 'release-hover';
const HOVER_DURATION = null;
const DETAIL_DURATION = 600000;
let detailExpandTimer = 0;
let pinnedDetailOpen = false;
let activeDetail = null;
let setSileoToastState = null;
let pendingSileoToast = null;
let activeHoverLetters = null;
void Toaster;

const LINK_ICON_META = {
  soundcloud: {
    path: 'M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z'
  },
  bandcamp: { path: 'M0 18.75l7.437-13.5H24l-7.438 13.5H0z' },
  youtube: { path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  instagram: { path: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077' },
  spotify: { path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' },
  vk: { path: 'm9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z' },
  generic: { path: 'M14 3h7v7h-2V6.414l-6.293 6.293-1.414-1.414L17.586 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z' }
};

function getProviderName(link) {
  const explicit = String((link && link.providerName) || '').toLowerCase();
  if (explicit) return explicit;
  const label = String((link && link.label) || '').trim().toLowerCase();
  if (label === 'spotify') return 'spotify';
  if (label === 'bandcamp') return 'bandcamp';
  if (label === 'soundcloud') return 'soundcloud';
  if (label === 'youtube') return 'youtube';
  if (label === 'instagram') return 'instagram';
  if (label === 'vk' || label === 'vkontakte') return 'vk';
  try {
    const host = new URL(link && link.url ? link.url : '').hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'open.spotify.com') return 'spotify';
    if (host.endsWith('bandcamp.com')) return 'bandcamp';
    if (host.endsWith('soundcloud.com')) return 'soundcloud';
    if (host.endsWith('youtube.com') || host === 'youtu.be') return 'youtube';
    if (host.endsWith('instagram.com')) return 'instagram';
    if (host.endsWith('vk.com')) return 'vk';
  } catch {}
  return 'generic';
}

function publishSileoToast(nextToast) {
  pendingSileoToast = nextToast;
  if (setSileoToastState) setSileoToastState(nextToast);
}

function injectReleaseLetterHoverStyles() {
  if (document.getElementById('bassfunk-release-letter-hover-style')) return;
  const style = document.createElement('style');
  style.id = 'bassfunk-release-letter-hover-style';
  style.textContent = `
    .bassfunk-release-letter-stage {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 6;
      display: block;
      width: 100%;
      height: max(92px, calc(13vh + env(safe-area-inset-bottom, 0px)));
      pointer-events: none;
      overflow: hidden;
      opacity: 1;
      transform: translateZ(0);
    }
    .bassfunk-release-letter-canvas {
      display: block;
      width: 100%;
      height: 100%;
      mix-blend-mode: screen;
      opacity: 1;
      transform: translateZ(0);
    }
    body.is-release-panel-open .bassfunk-release-letter-stage {
      display: none;
    }
  `;
  document.head.appendChild(style);
}

function getReleaseLetterHoverKey(detail) {
  const sourceTile = detail && (detail.sourceTile || detail.tile || detail.sourceElement || detail.element);
  if (sourceTile && sourceTile.nodeType === 1 && sourceTile.getAttribute) {
    return sourceTile.getAttribute('data-index') || sourceTile.getAttribute('href') || '';
  }
  const index = sourceTile && typeof sourceTile === 'object' ? sourceTile.index : '';
  return String(index || '');
}

function splitHoverText(value) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim().toUpperCase();
  if (!normalized) return [];
  const words = normalized.split(' ');
  const lines = [];
  let current = '';

  for (let i = 0; i < words.length; i += 1) {
    const next = current ? `${current} ${words[i]}` : words[i];
    if (next.length <= 18 || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = words[i];
    if (lines.length >= 2) break;
  }

  if (current && lines.length < 2) lines.push(current);
  return lines.slice(0, 2);
}

function createReleaseLetterHover({ artistName = '', releaseTitle = '', key = '' }) {
  injectReleaseLetterHoverStyles();

  const stage = document.createElement('div');
  stage.className = 'bassfunk-release-letter-stage';
  stage.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.className = 'bassfunk-release-letter-canvas';
  stage.appendChild(canvas);
  document.body.appendChild(stage);

  const context = canvas.getContext('2d');
  const artistLines = splitHoverText(artistName);
  const titleLines = splitHoverText(releaseTitle);
  const lines = artistLines.length ? artistLines : titleLines;
  const startedAt = performance.now();
  const letters = [];
  let frame = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let cssWidth = 0;
  let cssHeight = 0;
  let closing = false;
  let closedAt = 0;

  function rebuild() {
    letters.length = 0;
    if (!context || !lines.length || !cssWidth || !cssHeight) return;

    const maxFontSize = lines.length > 1 ? 32 : 40;
    const fontSize = Math.max(16, Math.min(maxFontSize, cssWidth * (lines.length > 1 ? 0.036 : 0.044)));
    const lineHeight = fontSize * 0.82;
    const family = '"Saira", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.font = `800 ${fontSize}px ${family}`;
    context.textBaseline = 'middle';

    const totalHeight = lineHeight * Math.max(1, lines.length - 1);
    const startY = Math.max(
      fontSize * 0.62,
      cssHeight - Math.max(13, cssHeight * 0.2) - totalHeight
    );

    lines.forEach((line, lineIndex) => {
      const chars = Array.from(line);
      const centerCharIndex = (chars.length - 1) * 0.5;
      const measured = context.measureText(line).width;
      const scale = measured > cssWidth * 0.82 ? (cssWidth * 0.82) / measured : 1;
      const scaledFontSize = Math.max(15, fontSize * scale);
      context.font = `800 ${scaledFontSize}px ${family}`;
      const y = startY + lineIndex * lineHeight;
      let x = (cssWidth - context.measureText(line).width) * 0.5;

      chars.forEach((char, charIndex) => {
        const metrics = context.measureText(char);
        const width = metrics.width;
        letters.push({
          char,
          x: x + width * 0.5,
          y,
          width,
          fontSize: scaledFontSize,
          lineIndex,
          delay: (lineIndex * 34) + (charIndex * 8) + ((charIndex % 5) * 3),
          spreadX: (charIndex - centerCharIndex) * Math.min(16, scaledFontSize * 0.42),
          spreadY: (((charIndex + lineIndex) % 2) ? 1 : -1) * Math.min(8, scaledFontSize * 0.18),
          phase: (charIndex * 0.71) + (lineIndex * 1.9)
        });
        x += width;
      });
    });
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const nextCssWidth = Math.max(1, rect.width);
    const nextCssHeight = Math.max(1, rect.height);
    const nextWidth = Math.max(1, Math.round(nextCssWidth * ratio));
    const nextHeight = Math.max(1, Math.round(nextCssHeight * ratio));
    if (nextWidth === canvasWidth && nextHeight === canvasHeight) return;
    cssWidth = nextCssWidth;
    cssHeight = nextCssHeight;
    canvasWidth = nextWidth;
    canvasHeight = nextHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
    rebuild();
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function draw(time) {
    resize();
    if (!context) return;

    const elapsed = time - startedAt;
    const closeElapsed = closing ? time - closedAt : 0;
    const closeProgress = closing ? Math.min(1, closeElapsed / 180) : 0;
    const exitOpacity = 1 - closeProgress;

    context.clearRect(0, 0, cssWidth, cssHeight);
    context.save();
    context.globalCompositeOperation = 'source-over';
    const shade = context.createLinearGradient(0, cssHeight * 0.38, 0, cssHeight);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(0.38, 'rgba(0, 0, 0, 0.42)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.86)');
    context.fillStyle = shade;
    context.fillRect(0, 0, cssWidth, cssHeight);
    context.restore();

    context.save();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(255, 255, 255, 0.28)';
    context.shadowBlur = 10;

    letters.forEach((letter) => {
      const raw = Math.min(1, Math.max(0, (elapsed - letter.delay) / 175));
      const progress = easeOutCubic(raw);
      const jitter = Math.sin((elapsed * 0.006) + letter.phase) * (1.8 - progress);
      const scatter = Math.pow(1 - progress, 1.35);
      const scatterX = letter.spreadX * scatter;
      const scatterY = letter.spreadY * scatter;
      const bottomStart = cssHeight + letter.fontSize * 0.95 - letter.y;
      const rise = bottomStart * (1 - progress);
      const sink = closeProgress * (cssHeight * 0.28);
      const alpha = Math.min(1, progress * 1.25) * exitOpacity;
      if (alpha <= 0) return;

      context.font = `800 ${letter.fontSize}px "Saira", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.fillStyle = `rgba(255, 255, 255, ${0.86 * alpha})`;
      context.fillText(letter.char, letter.x + jitter + scatterX, letter.y + rise + sink + scatterY);
    });

    context.restore();

    if (closing && closeProgress >= 1) {
      stage.remove();
      return;
    }

    frame = window.requestAnimationFrame(draw);
  }

  frame = window.requestAnimationFrame(draw);

  return {
    key,
    close() {
      if (closing) return;
      closing = true;
      closedAt = performance.now();
    },
    destroy() {
      window.cancelAnimationFrame(frame);
      stage.remove();
    }
  };
}

function showReleaseLetterHover(detail = {}) {
  const title = detail.artistName || detail.releaseTitle || '';
  if (!title) return;
  const key = getReleaseLetterHoverKey(detail) || title;
  if (activeHoverLetters && activeHoverLetters.key === key) return;
  if (activeHoverLetters) activeHoverLetters.destroy();
  activeHoverLetters = createReleaseLetterHover({
    key,
    artistName: detail.artistName,
    releaseTitle: detail.releaseTitle
  });
}

function hideReleaseLetterHover() {
  if (!activeHoverLetters) return;
  const hover = activeHoverLetters;
  activeHoverLetters = null;
  hover.close();
}

function ReleaseDetail({ detail }) {
  const releaseLinks = Array.isArray(detail.releaseLinks) ? detail.releaseLinks : [];
  const artistLinks = Array.isArray(detail.artistLinks) ? detail.artistLinks : [];
  const dedupeLinks = (links) => {
    const seenLinks = new Set();
    return links.filter((link) => {
      if (!link || !link.url) return false;
      const key = `${link.label || ''}|${link.url || ''}`;
      if (seenLinks.has(key)) return false;
      seenLinks.add(key);
      return true;
    });
  };
  const normalizedReleaseLinks = dedupeLinks(releaseLinks);
  const normalizedArtistLinks = dedupeLinks(artistLinks);
  const renderLinkGroup = (title, links) => {
    if (!links.length) return null;
    return (
      <div className="bassfunk-sileo-card__link-group">
        {title ? <div className="bassfunk-sileo-card__link-label">{title}</div> : null}
        <div className="bassfunk-sileo-card__links">
          {links.slice(0, 4).map((link, index) => (
            (() => {
              const providerName = getProviderName(link);
              const icon = LINK_ICON_META[providerName] || LINK_ICON_META.generic;
              const label = providerName === 'vk' ? 'Vkontakte' : (link.label || 'Link');
              return (
                <a
                  key={`${link.url || ''}-${index}`}
                  className="bassfunk-sileo-card__link"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  data-platform={providerName}
                  onClick={(event) => event.stopPropagation()}
                >
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path fill="currentColor" d={icon.path} />
                  </svg>
                </a>
              );
            })()
          ))}
        </div>
      </div>
    );
  };
  const title = detail.releaseTitle || detail.artistName || 'Release';
  const IconClose = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" />
    </svg>
  );

  return (
    <div className="bassfunk-sileo-card">
      <button
        type="button"
        className="bassfunk-sileo-card__arrow bassfunk-sileo-card__close"
        data-sileo-card-action="close"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (typeof detail.onClose === 'function') detail.onClose();
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          if (typeof detail.onClose === 'function') detail.onClose();
        }}
        aria-label="Close release card"
      >
        {IconClose}
      </button>
      {detail.artworkUrl ? (
        <img className="bassfunk-sileo-card__artwork" src={detail.artworkUrl} alt="" />
      ) : null}
      <div className="bassfunk-sileo-card__body">
        <div className="bassfunk-sileo-card__heading">
          <div className="bassfunk-sileo-card__title">{title}</div>
        </div>
        <div className="bassfunk-sileo-card__link-list">
          {renderLinkGroup('', normalizedReleaseLinks)}
          {renderLinkGroup('Artist', normalizedArtistLinks)}
        </div>
      </div>
    </div>
  );
}

function injectSileoOverrides() {
  if (document.getElementById('bassfunk-sileo-hover-style')) return;
  const style = document.createElement('style');
  style.id = 'bassfunk-sileo-hover-style';
  style.textContent = `
    [data-sileo-viewport][data-position="bottom-center"] {
      z-index: 7;
    }
    .bassfunk-sileo-toast {
      position: relative;
      cursor: pointer;
      pointer-events: auto;
      touch-action: none;
      border: 0;
      background: transparent;
      padding: 0;
      width: var(--sileo-width);
      height: var(--_h, var(--sileo-height)) !important;
      opacity: 1;
      transform: translateZ(0) scale(1);
      transform-origin: center;
      overflow: visible;
      box-sizing: border-box;
    }
    .bassfunk-sileo-toast {
      --sileo-width: min(350px, calc(100vw - 24px));
      --sileo-height: 40px;
      --bassfunk-menu-radius: 12px;
      --bassfunk-artwork-radius: 10px;
      height: var(--_h, var(--sileo-height)) !important;
    }
    .bassfunk-sileo-toast[data-expanded="true"] {
      --sileo-width: min(560px, calc(100vw - 32px));
      --sileo-lobe-width: min(220px, calc(100vw - 64px));
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    [data-sileo-header] {
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      max-width: var(--sileo-width) !important;
      justify-content: center !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    [data-sileo-header-stack],
    [data-sileo-header-inner] {
      min-width: 0;
      width: 100%;
      max-width: 100%;
      justify-content: center;
    }
    .bassfunk-sileo-toast[data-expanded="false"] {
      pointer-events: none;
    }
    .bassfunk-sileo-toast[data-expanded="true"] {
      pointer-events: auto;
    }
    .bassfunk-sileo-card {
      position: relative;
      display: grid;
      grid-template-columns: 128px minmax(0, 1fr);
      align-items: start;
      gap: 18px;
      width: var(--sileo-width);
      max-width: calc(100vw - 32px);
      min-height: 160px;
      padding: 16px 52px 16px 16px;
      color: rgba(255, 255, 255, 0.7);
      box-sizing: border-box;
    }
    .bassfunk-sileo-card__artwork {
      width: 128px;
      height: 128px;
      align-self: start;
      object-fit: cover;
      border-radius: var(--bassfunk-artwork-radius);
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.3);
    }
    .bassfunk-sileo-card__body {
      min-width: 0;
      display: grid;
      align-content: start;
      gap: 10px;
    }
    .bassfunk-sileo-card__heading {
      min-width: 0;
      display: grid;
      gap: 6px;
    }
    .bassfunk-sileo-card__title {
      font-size: 14px;
      line-height: 1.05;
      font-weight: 700;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.76);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bassfunk-sileo-card__link-list {
      display: grid;
      gap: 10px;
    }
    .bassfunk-sileo-card__link-group + .bassfunk-sileo-card__link-group {
      margin-top: 8px;
    }
    .bassfunk-sileo-card__link-group {
      display: grid;
      gap: 7px;
      min-width: 0;
    }
    .bassfunk-sileo-card__link-label {
      color: rgba(255, 255, 255, 0.34);
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
      text-transform: uppercase;
    }
    .bassfunk-sileo-card__links {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }
    .bassfunk-sileo-card__link,
    .bassfunk-sileo-card__arrow {
      border: 0;
      border-radius: var(--bassfunk-menu-radius);
      corner-shape: squircle;
      background: rgba(255, 255, 255, 0.07);
      color: #f3f1ea;
      font: inherit;
      text-decoration: none;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.16),
        inset 0 0 0 1px rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(12px) saturate(135%);
      -webkit-backdrop-filter: blur(12px) saturate(135%);
      transition: background-color 160ms ease, color 160ms ease, opacity 160ms ease, box-shadow 160ms ease;
    }
    .bassfunk-sileo-card__link {
      width: 32px;
      height: 32px;
      min-width: 32px;
      max-width: 32px;
      padding: 0;
      box-sizing: border-box;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .bassfunk-sileo-card__link:hover,
    .bassfunk-sileo-card__arrow:not([aria-disabled="true"]):hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.24);
    }
    .bassfunk-sileo-card__link svg {
      width: 12px;
      height: 12px;
      display: block;
      fill: currentColor;
    }
    .bassfunk-sileo-card__link[data-platform="soundcloud"] svg {
      width: 16px;
      height: 16px;
    }
    .bassfunk-sileo-card__arrow {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }
    .bassfunk-sileo-card__arrow svg {
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.6;
    }
    .bassfunk-sileo-card__close {
      position: absolute;
      z-index: 4;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
    }
    .bassfunk-sileo-card__close svg {
      width: 12px;
      height: 12px;
    }
    .bassfunk-sileo-side-arrow {
      border: 0;
      border-radius: var(--bassfunk-menu-radius);
      corner-shape: squircle;
      background: rgba(255, 255, 255, 0.07);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.16),
        inset 0 0 0 1px rgba(255, 255, 255, 0.18);
      color: #f3f1ea;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      position: absolute;
      z-index: 60;
      top: calc(50% - 9px);
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      backdrop-filter: blur(12px) saturate(135%);
      -webkit-backdrop-filter: blur(12px) saturate(135%);
      transition: background-color 160ms ease, color 160ms ease, opacity 160ms ease, box-shadow 160ms ease;
    }
    .bassfunk-sileo-side-arrow:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.24);
    }
    .bassfunk-sileo-side-arrow svg {
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.6;
    }
    .bassfunk-sileo-side-arrow[aria-disabled="true"] {
      opacity: 0.28;
      cursor: default;
    }
    .bassfunk-sileo-side-arrow--prev {
      left: -40px;
    }
    .bassfunk-sileo-side-arrow--next {
      right: -40px;
    }
    .bassfunk-sileo-card__arrow[aria-disabled="true"] {
      opacity: 0.28;
      cursor: default;
    }
    @media (max-width: 420px) {
      .bassfunk-sileo-card {
        grid-template-columns: 82px minmax(0, 1fr);
        width: var(--sileo-width);
        max-width: calc(100vw - 24px);
        gap: 14px;
        min-height: 110px;
        padding: 14px 48px 14px 14px;
      }
      .bassfunk-sileo-card__artwork {
        width: 82px;
        height: 82px;
      }
      .bassfunk-sileo-card__title {
        font-size: 15px;
      }
      .bassfunk-sileo-card__link {
        width: 32px;
        height: 32px;
        min-width: 32px;
        max-width: 32px;
      }
      .bassfunk-sileo-card__arrow {
        width: 32px;
        height: 32px;
      }
      .bassfunk-sileo-card__close {
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
      }
      .bassfunk-sileo-side-arrow {
        top: auto;
        bottom: 58px;
        transform: none;
      }
      .bassfunk-sileo-side-arrow--prev {
        left: 18px;
      }
      .bassfunk-sileo-side-arrow--next {
        right: 18px;
      }
      .bassfunk-sileo-card__arrow svg {
        width: 14px;
        height: 14px;
      }
    }
    .bassfunk-sileo-title {
      display: block !important;
      width: 100% !important;
      max-width: calc(var(--sileo-width) - 32px) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      text-align: center !important;
      color: rgba(255, 255, 255, 0.86) !important;
      text-transform: none !important;
      font-weight: 700 !important;
      font-size: 15px !important;
      line-height: 1rem !important;
    }
    .bassfunk-sileo-toast[data-expanded="true"] .bassfunk-sileo-title {
      max-width: calc(var(--sileo-lobe-width) - 32px) !important;
      font-size: 15px !important;
      opacity: 1 !important;
      text-transform: uppercase !important;
      color: rgba(255, 255, 255, 0.72) !important;
    }
    .bassfunk-sileo-blob-canvas {
      display: block;
      width: min(286px, calc(var(--sileo-width) - 48px));
      height: 28px;
      border-radius: var(--bassfunk-menu-radius);
      opacity: 0.95;
      overflow: hidden;
      pointer-events: none;
      filter: saturate(1.08) contrast(1.08);
    }
    .bassfunk-sileo-description {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
      color: rgba(255, 255, 255, 0.58) !important;
    }
    .bassfunk-sileo-toast[data-expanded="true"] .bassfunk-sileo-description {
      padding: 0 !important;
    }
    .bassfunk-sileo-badge--hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function expandLatestToast() {
  const expand = () => {
    const toast = document.querySelector('.bassfunk-sileo-toast');
    if (!toast) return;
    toast.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
    toast.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, cancelable: true, view: window }));
  };
  window.requestAnimationFrame(expand);
  window.setTimeout(expand, 80);
  window.setTimeout(expand, 180);
  window.setTimeout(expand, 320);
}

function stopKeepingDetailExpanded() {
  if (!detailExpandTimer) return;
  window.clearInterval(detailExpandTimer);
  detailExpandTimer = 0;
}

function keepDetailExpanded() {
  stopKeepingDetailExpanded();
  expandLatestToast();
  detailExpandTimer = window.setInterval(expandLatestToast, 220);
}

function handleDelegatedCardAction(event) {
  const target = event.target && event.target.closest
    ? event.target.closest('[data-sileo-card-action]')
    : null;
  if (!target || !activeDetail) return;
  const action = target.getAttribute('data-sileo-card-action');
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

  if (action === 'close' && typeof activeDetail.onClose === 'function') {
    activeDetail.onClose();
    return;
  }
  if (action === 'prev' && activeDetail.canGoPrev && typeof activeDetail.onPrev === 'function') {
    activeDetail.onPrev();
    return;
  }
  if (action === 'next' && activeDetail.canGoNext && typeof activeDetail.onNext === 'function') {
    activeDetail.onNext();
  }
}

function handleDelegatedCardKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  handleDelegatedCardAction(event);
}

function SileoBlobCanvas({ active, text }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!active) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let animationFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    let blobs = [];
    const maskCanvas = document.createElement('canvas');
    const maskContext = maskCanvas.getContext('2d');
    const displayText = String(text || '').trim().toUpperCase();

    const rebuildBlobs = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      if (!maskContext || !displayText) {
        blobs = [];
        return;
      }

      maskCanvas.width = width;
      maskCanvas.height = height;
      maskContext.clearRect(0, 0, width, height);
      maskContext.fillStyle = '#fff';
      maskContext.textAlign = 'center';
      maskContext.textBaseline = 'middle';
      maskContext.font = '900 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      let measured = maskContext.measureText(displayText).width;
      if (measured > width - 18) {
        const fontSize = Math.max(10, Math.floor(16 * ((width - 18) / measured)));
        maskContext.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        measured = maskContext.measureText(displayText).width;
      }

      maskContext.fillText(displayText, width / 2, height / 2 + 1, width - 10);
      const imageData = maskContext.getImageData(0, 0, width, height).data;
      const points = [];
      const step = width > 240 ? 3 : 4;

      for (let y = 2; y < height - 2; y += step) {
        for (let x = 2; x < width - 2; x += step) {
          const alpha = imageData[((y * width + x) * 4) + 3];
          if (alpha > 34) points.push({ x, y, alpha });
        }
      }

      const maxBlobs = 150;
      const stride = Math.max(1, Math.ceil(points.length / maxBlobs));
      blobs = points.filter((_, index) => index % stride === 0).slice(0, maxBlobs).map((point, index) => ({
        x: point.x,
        y: point.y,
        radius: 2.5 + ((point.alpha / 255) * 1.9) + ((index % 3) * 0.22),
        phase: index * 0.79,
        speed: 0.72 + ((index % 7) * 0.035),
        drift: 0.65 + ((index % 5) * 0.18)
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const deviceRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * deviceRatio));
      const height = Math.max(1, Math.round(rect.height * deviceRatio));
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      canvas.width = width;
      canvas.height = height;
      context.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
      rebuildBlobs();
    };

    const draw = (time) => {
      resize();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'source-over';
      context.filter = 'blur(2.4px)';

      blobs.forEach((blob) => {
        const t = time * 0.001 * blob.speed + blob.phase;
        const x = blob.x + Math.sin(t) * blob.drift;
        const y = blob.y + Math.cos(t * 1.3) * blob.drift;
        const radius = blob.radius + Math.sin(t * 1.7) * 0.45;
        const gradient = context.createRadialGradient(x, y, 0.6, x, y, radius * 2.4);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
        gradient.addColorStop(0.46, 'rgba(218, 226, 238, 0.58)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius * 2.4, 0, Math.PI * 2);
        context.fill();
      });

      context.restore();
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [active, text]);

  return <canvas className="bassfunk-sileo-blob-canvas" ref={canvasRef} aria-hidden="true" />;
}

function SileoHoverToaster() {
  const [toast, setToast] = React.useState(pendingSileoToast);

  React.useEffect(() => {
    setSileoToastState = setToast;
    if (pendingSileoToast) setToast(pendingSileoToast);
    return () => {
      if (setSileoToastState === setToast) setSileoToastState = null;
    };
  }, []);

  if (!toast) {
    return <SileoMountProbe />;
  }

  const isExpanded = !!toast.expanded && !!toast.description;
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 800px)').matches;
  const toastWidth = isExpanded && isDesktop ? 560 : 350;
  const lobeWidth = isExpanded && isDesktop ? 220 : 350;
  const lobeX = (toastWidth - lobeWidth) / 2;
  const toastHeight = isExpanded && isDesktop ? 202 : isExpanded ? 154 : 40;
  const sileoRoundness = 10;
  const lobeHeight = isExpanded ? 40 + (sileoRoundness * 0.5 * 3) : 40;
  const contentHeight = Math.max(0, toastHeight - 40);
  const headerTransform = `translateY(${isExpanded ? 0 : 0}px) scale(${isExpanded ? 0.9 : 1})`;
  const canGoPrev = !!(activeDetail && activeDetail.canGoPrev);
  const canGoNext = !!(activeDetail && activeDetail.canGoNext);

  return (
    <>
      <section
        data-sileo-viewport
        data-position="bottom-center"
        data-theme="dark"
        aria-live="polite"
        style={{ bottom: 'max(18px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          className="bassfunk-sileo-toast"
          role="presentation"
          data-ready="true"
          data-expanded={isExpanded ? 'true' : 'false'}
          data-edge="top"
          data-position="center"
          data-state="success"
          style={{
            height: `${toastHeight}px`,
            width: `${toastWidth}px`,
            '--_h': `${toastHeight}px`,
            '--_pw': `${lobeWidth}px`,
            '--_px': `${lobeX}px`,
            '--_ht': headerTransform,
            '--_co': isExpanded ? '1' : '0'
          }}
          onMouseEnter={() => {
            if (toast.description) publishSileoToast({ ...toast, expanded: true });
          }}
          onMouseLeave={() => {
            if (pinnedDetailOpen || !toast.description) return;
            publishSileoToast({ ...toast, expanded: false });
          }}
        >
          <div data-sileo-canvas data-edge="top" style={{ filter: 'url(#bassfunk-sileo-gooey)' }}>
            <svg data-sileo-svg width={toastWidth} height={toastHeight} viewBox={`0 0 ${toastWidth} ${toastHeight}`}>
              <title>Sileo Notification</title>
              <defs>
                <filter id="bassfunk-sileo-gooey" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
                    result="goo"
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
              </defs>
              <motion.rect
                data-sileo-pill
                rx={sileoRoundness}
                ry={sileoRoundness}
                fill="#171717"
                stroke="transparent"
                strokeWidth={0}
                initial={false}
                animate={{ x: lobeX, width: lobeWidth, height: lobeHeight }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.6 }}
              />
              <motion.rect
                data-sileo-body
                y="40"
                width={toastWidth}
                rx={sileoRoundness}
                ry={sileoRoundness}
                fill="#171717"
                stroke="transparent"
                strokeWidth={0}
                initial={false}
                animate={{ height: contentHeight, opacity: isExpanded ? 1 : 0 }}
                transition={{ type: 'spring', bounce: isExpanded ? 0.25 : 0, duration: 0.6 }}
              />
            </svg>
          </div>
          <div data-sileo-header data-edge="top">
            <div data-sileo-header-stack>
              <div data-sileo-header-inner data-layer="current">
                <div data-sileo-badge data-state="success" className="bassfunk-sileo-badge--hidden" />
                {isExpanded ? (
                  <span data-sileo-title data-state="success" className="bassfunk-sileo-title">
                    {toast.title}
                  </span>
                ) : (
                  <SileoBlobCanvas active={!isExpanded} text={toast.title} />
                )}
              </div>
            </div>
          </div>
          {toast.description ? (
            <div data-sileo-content data-edge="top" data-visible={isExpanded ? 'true' : 'false'}>
              <div data-sileo-description className="bassfunk-sileo-description">
                {toast.description}
              </div>
            </div>
          ) : null}
          {isExpanded ? (
            <>
              <button
                type="button"
                tabIndex={canGoPrev ? 0 : -1}
                className="bassfunk-sileo-side-arrow bassfunk-sileo-side-arrow--prev"
                data-sileo-card-action="prev"
                disabled={!canGoPrev}
                aria-disabled={!canGoPrev}
                aria-label="Previous release"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 6L9 12L15 18" />
                </svg>
              </button>
              <button
                type="button"
                tabIndex={canGoNext ? 0 : -1}
                className="bassfunk-sileo-side-arrow bassfunk-sileo-side-arrow--next"
                data-sileo-card-action="next"
                disabled={!canGoNext}
                aria-disabled={!canGoNext}
                aria-label="Next release"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6L15 12L9 18" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </section>
      <SileoMountProbe />
    </>
  );
}

function SileoMountProbe() {
  React.useEffect(() => {
    document.documentElement.dataset.sileoReact = 'mounted';
  }, []);
  return null;
}

function mountSileoHover() {
  if (window.BassfunkSileoHover) return;
  injectSileoOverrides();

  window.BassfunkSileoHover = {
    show(detail = {}) {
      const { artistName = '', releaseTitle = '' } = detail;
      document.documentElement.dataset.sileoLastAction = 'show';
      if (pinnedDetailOpen) return;
      stopKeepingDetailExpanded();
      const title = artistName || releaseTitle;
      if (!title) return;
      publishSileoToast(null);
      showReleaseLetterHover(detail);
    },
    open(detail = {}) {
      document.documentElement.dataset.sileoLastAction = 'open';
      pinnedDetailOpen = true;
      activeDetail = detail;
      hideReleaseLetterHover();
      const title = detail.artistName || detail.releaseTitle || 'Release';
      publishSileoToast({
        id: HOVER_TOAST_ID,
        title,
        description: <ReleaseDetail detail={detail} />,
        expanded: true
      });
      stopKeepingDetailExpanded();
    },
    hide() {
      document.documentElement.dataset.sileoLastAction = 'hide';
      if (pinnedDetailOpen) return;
      stopKeepingDetailExpanded();
      hideReleaseLetterHover();
      publishSileoToast(null);
    },
    clear() {
      document.documentElement.dataset.sileoLastAction = 'clear';
      pinnedDetailOpen = false;
      activeDetail = null;
      stopKeepingDetailExpanded();
      hideReleaseLetterHover();
      publishSileoToast(null);
    },
    close() {
      document.documentElement.dataset.sileoLastAction = 'close';
      pinnedDetailOpen = false;
      activeDetail = null;
      stopKeepingDetailExpanded();
      hideReleaseLetterHover();
      publishSileoToast(null);
    }
  };
  document.documentElement.dataset.sileoBridge = 'ready';

  const rootElement = document.createElement('div');
  rootElement.id = 'bassfunk-sileo-hover-root';
  document.body.appendChild(rootElement);
  document.addEventListener('click', handleDelegatedCardAction, true);
  document.addEventListener('keydown', handleDelegatedCardKeydown, true);
  document.addEventListener('bassfunk:sileo-show', (event) => window.BassfunkSileoHover.show(event.detail || {}));
  document.addEventListener('bassfunk:sileo-open', (event) => window.BassfunkSileoHover.open(event.detail || {}));
  document.addEventListener('bassfunk:sileo-hide', () => window.BassfunkSileoHover.hide());
  document.addEventListener('bassfunk:sileo-close', () => window.BassfunkSileoHover.close());

  try {
    const root = createRoot(rootElement);
    flushSync(() => {
      root.render(<SileoHoverToaster />);
    });
  } catch (error) {
    console.error('Failed to mount Sileo hover toaster', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountSileoHover, { once: true });
} else {
  mountSileoHover();
}
