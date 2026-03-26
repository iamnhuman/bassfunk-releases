#!/usr/bin/env node

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT_DIR = process.cwd();
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'releases.json');
const USER_AGENT = 'Mozilla/5.0';
const FETCH_TIMEOUT_MS = 10000;
const PROCESS_TIMEOUT_MS = 15000;
const RENDER_TIMEOUT_MS = 30000;
const CHROME_CANDIDATE_PATHS = [
  process.env.GOOGLE_CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium'
].filter(Boolean);
const PROVIDER_LABELS = {
  warp: 'Warp',
  bandcamp: 'Bandcamp',
  spotify: 'Spotify',
  applemusic: 'Apple Music',
  soundcloud: 'SoundCloud',
  youtube: 'YouTube',
  vk: 'VK',
  file: 'Dropbox'
};
const DISPLAY_PROVIDER_ORDER = ['spotify', 'applemusic', 'bandcamp', 'soundcloud', 'youtube', 'vk', 'file'];
const SOCIAL_DISPLAY_ORDER = ['instagram', 'youtube', 'soundcloud', 'spotify', 'bandcamp', 'x', 'facebook', 'tiktok'];
const MIN_CONFIRMED_SOCIAL_MATCH_SCORE = 0.88;
const PLATFORM_SEARCHES = [
  { providerName: 'bandcamp', searchHost: 'bandcamp.com' },
  { providerName: 'spotify', searchHost: 'open.spotify.com' },
  { providerName: 'soundcloud', searchHost: 'soundcloud.com' }
];
const CORE_ARTIST_SOCIAL_SEARCHES = [
  { providerName: 'spotify', searchHost: 'open.spotify.com', label: 'Spotify' },
  { providerName: 'soundcloud', searchHost: 'soundcloud.com', label: 'SoundCloud' },
  { providerName: 'bandcamp', searchHost: 'bandcamp.com', label: 'Bandcamp' },
  { providerName: 'youtube', searchHost: 'youtube.com', label: 'YouTube' }
];
const EXTENDED_ARTIST_SOCIAL_SEARCHES = [
  { providerName: 'instagram', searchHost: 'instagram.com', label: 'Instagram' },
  { providerName: 'youtube', searchHost: 'youtube.com', label: 'YouTube' },
  { providerName: 'x', searchHost: 'x.com', label: 'X' },
  { providerName: 'facebook', searchHost: 'facebook.com', label: 'Facebook' }
];
const MANUAL_DETAIL_PATCHES = {
  '16': {
    socialLinks: [
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/flyinglotus/'
      },
      {
        label: 'YouTube',
        url: 'https://www.youtube.com/@FlyingLotus'
      },
      {
        label: 'SoundCloud',
        url: 'https://soundcloud.com/flyinglotus'
      },
      {
        label: 'Spotify',
        url: 'https://open.spotify.com/artist/29XOeO6KIWxGthejQqn793'
      },
      {
        label: 'Bandcamp',
        url: 'https://flyinglotus.bandcamp.com/'
      }
    ]
  },
  '30': {
    releaseLinks: [
      {
        label: 'Spotify',
        providerName: 'spotify',
        url: 'https://open.spotify.com/album/4eq90EsqRQXQ2jX07yDl80'
      },
      {
        label: 'Bandcamp',
        providerName: 'bandcamp',
        url: 'https://badtasterecordings.bandcamp.com/album/colossus'
      },
      {
        label: 'SoundCloud',
        providerName: 'soundcloud',
        url: 'https://soundcloud.com/billain/sets/billain-colossus-ep'
      }
    ],
    socialLinks: [
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/billain_aethek/'
      },
      {
        label: 'SoundCloud',
        url: 'https://soundcloud.com/billain'
      },
      {
        label: 'Spotify',
        url: 'https://open.spotify.com/artist/2RTatdYDZELwmURarJEAcZ'
      },
      {
        label: 'Bandcamp',
        url: 'https://billainaethek.bandcamp.com/'
      },
      {
        label: 'X',
        url: 'https://x.com/Billain'
      }
    ]
  },
  '117': {
    artistName: 'Chris Cobilis With Kenneth Goldsmith and Spektral Quartet',
    releaseTitle: 'This Is You',
    releaseUrl: 'https://room40.bandcamp.com/album/this-is-you',
    sourceUrl: 'https://room40.bandcamp.com/album/this-is-you',
    sourceLabel: 'Bandcamp',
    provider: 'bandcamp',
    releaseLinks: [
      {
        label: 'Bandcamp',
        providerName: 'bandcamp',
        url: 'https://room40.bandcamp.com/album/this-is-you'
      }
    ],
    socialLinks: [
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/kennethgoldsmith/'
      },
      {
        label: 'YouTube',
        url: 'https://www.youtube.com/@spektralquartet'
      },
      {
        label: 'SoundCloud',
        url: 'https://soundcloud.com/chriscobilis'
      },
      {
        label: 'Bandcamp',
        url: 'https://chriscobilis.bandcamp.com/'
      }
    ]
  },
  '118': {
    artistName: 'Chris Cobilis With Kenneth Goldsmith and Spektral Quartet',
    releaseTitle: 'This Is You',
    releaseUrl: 'https://room40.bandcamp.com/album/this-is-you',
    sourceUrl: 'https://room40.bandcamp.com/album/this-is-you',
    sourceLabel: 'Bandcamp',
    provider: 'bandcamp',
    releaseLinks: [
      {
        label: 'Bandcamp',
        providerName: 'bandcamp',
        url: 'https://room40.bandcamp.com/album/this-is-you'
      }
    ],
    socialLinks: [
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/kennethgoldsmith/'
      },
      {
        label: 'YouTube',
        url: 'https://www.youtube.com/@spektralquartet'
      },
      {
        label: 'SoundCloud',
        url: 'https://soundcloud.com/chriscobilis'
      },
      {
        label: 'Bandcamp',
        url: 'https://chriscobilis.bandcamp.com/'
      }
    ]
  }
};
const textFetchCache = new Map();
const jsonFetchCache = new Map();
const statusFetchCache = new Map();
const socialSearchCache = new Map();
const releaseParseCache = new Map();
const renderedFetchCache = new Map();
let soundCloudClientIdPromise = null;
let chromeBinaryPromise = null;

function getArg(name, fallbackValue) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) return fallbackValue;
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function decodeHtml(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/gi, "'");
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/&/g, ' and ')
    .replace(/([a-z])(\d)/gi, '$1 $2')
    .replace(/(\d)([a-z])/gi, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeArtistSlug(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '');
}

function tokenizeText(value) {
  const normalizedValue = normalizeText(value);
  return normalizedValue ? normalizedValue.split(' ') : [];
}

function computeTokenOverlap(left, right) {
  const leftTokens = new Set(tokenizeText(left));
  const rightTokens = new Set(tokenizeText(right));

  if (!leftTokens.size || !rightTokens.size) return 0;

  let sharedCount = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) sharedCount += 1;
  }

  return sharedCount / Math.max(Math.min(leftTokens.size, rightTokens.size), 1);
}

function computeStringMatch(left, right) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  const compactLeft = normalizedLeft.replace(/\s+/g, '');
  const compactRight = normalizedRight.replace(/\s+/g, '');

  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  if (compactLeft && compactLeft === compactRight) return 0.95;
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return 0.95;
  if (compactLeft && (compactLeft.includes(compactRight) || compactRight.includes(compactLeft))) return 0.9;

  return computeTokenOverlap(normalizedLeft, normalizedRight);
}

function computeReleaseMatchScore(expectedArtistName, expectedReleaseTitle, actualArtistName, actualReleaseTitle) {
  const artistScore = computeStringMatch(expectedArtistName, actualArtistName);
  const titleScore = computeStringMatch(expectedReleaseTitle, actualReleaseTitle);

  if (artistScore < 0.6 || titleScore < 0.6) return 0;

  return artistScore * 45 + titleScore * 55;
}

function pickMeta(html, attributeName, attributeValue) {
  const escapedValue = attributeValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(
    new RegExp(
      `<meta[^>]*${attributeName}=["']${escapedValue}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      'i'
    )
  );
  return match ? decodeHtml(match[1].trim()) : '';
}

function pickTitle(html) {
  const ogTitle = pickMeta(html, 'property', 'og:title') || pickMeta(html, 'name', 'twitter:title');
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? decodeHtml(titleMatch[1].trim()) : '';
}

function pickAnchor(html, itemIndex) {
  const normalizedIndex = String(Number(itemIndex));
  const directMatch = html.match(
    new RegExp(
      `<a[^>]*data-index=["']${normalizedIndex}["'][^>]*href=["']([^"']+)["'][^>]*>\\s*<img[^>]*src=["']([^"']+)["']`,
      'i'
    )
  );
  const tile = directMatch || [...html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>\s*<img[^>]*src=["']([^"']+)["']/gi)][Number(itemIndex) - 1];

  if (!tile) {
    throw new Error(`Could not find release tile at position ${itemIndex} in index.html`);
  }

  return {
    sourceUrl: decodeHtml(tile[1].trim()),
    imagePath: path.join(ROOT_DIR, decodeHtml(tile[2].trim()))
  };
}

async function fetchText(url) {
  if (!textFetchCache.has(url)) {
    textFetchCache.set(
      url,
      (async () => {
        const response = await fetch(url, {
          headers: {
            'user-agent': USER_AGENT,
            'accept-language': 'en-US,en;q=0.9'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });

        if (!response.ok) {
          throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
        }

        return await response.text();
      })()
    );
  }

  try {
    return await textFetchCache.get(url);
  } catch (error) {
    textFetchCache.delete(url);
    throw error;
  }
}

async function fetchJson(url) {
  if (!jsonFetchCache.has(url)) {
    jsonFetchCache.set(
      url,
      (async () => {
        const response = await fetch(url, {
          headers: {
            'user-agent': USER_AGENT,
            'accept-language': 'en-US,en;q=0.9'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });

        if (!response.ok) {
          throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      })()
    );
  }

  try {
    return await jsonFetchCache.get(url);
  } catch (error) {
    jsonFetchCache.delete(url);
    throw error;
  }
}

async function fetchStatus(url) {
  if (!statusFetchCache.has(url)) {
    statusFetchCache.set(
      url,
      (async () => {
        const response = await fetch(url, {
          headers: {
            'user-agent': USER_AGENT,
            'accept-language': 'en-US,en;q=0.9'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });

        return response.status;
      })()
    );
  }

  try {
    return await statusFetchCache.get(url);
  } catch (error) {
    statusFetchCache.delete(url);
    throw error;
  }
}

function cleanUrl(url) {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hash = '';
    const host = parsedUrl.hostname.replace(/^www\./, '');
    if (host.endsWith('youtube.com') && parsedUrl.pathname === '/watch') {
      const videoId = parsedUrl.searchParams.get('v');
      parsedUrl.search = videoId ? `?v=${videoId}` : '';
      return parsedUrl.toString();
    }
    if (host.endsWith('youtube.com') && parsedUrl.pathname === '/playlist') {
      const playlistId = parsedUrl.searchParams.get('list');
      parsedUrl.search = playlistId ? `?list=${playlistId}` : '';
      return parsedUrl.toString();
    }
    if (host.endsWith('vk.com') && /^\/audios?/i.test(parsedUrl.pathname)) {
      return parsedUrl.toString();
    }
    parsedUrl.search = '';
    return parsedUrl.toString();
  } catch {
    return String(url || '').trim();
  }
}

function normalizeHost(url) {
  return new URL(url).hostname.replace(/^www\./, '');
}

function isVkFallbackPage(html) {
  return /<title>\s*VK\s*\|\s*VK\s*<\/title>/i.test(html) || /BadBrowser__title/i.test(html);
}

function isVkCaptchaPage(html) {
  return /Проверяем,\s*что вы не робот/i.test(html) || /Confirming\s+that you are not a robot/i.test(html);
}

async function resolveChromeBinary() {
  if (!chromeBinaryPromise) {
    chromeBinaryPromise = (async () => {
      for (const candidatePath of CHROME_CANDIDATE_PATHS) {
        try {
          await fs.access(candidatePath);
          return candidatePath;
        } catch {
          continue;
        }
      }

      throw new Error('Could not find a Chrome binary for rendered VK scraping');
    })();
  }

  try {
    return await chromeBinaryPromise;
  } catch (error) {
    chromeBinaryPromise = null;
    throw error;
  }
}

function shellQuote(value) {
  return `'${String(value || '').replace(/'/g, `'\\''`)}'`;
}

async function fetchRenderedHtml(url) {
  if (!renderedFetchCache.has(url)) {
    renderedFetchCache.set(
      url,
      (async () => {
        const chromeBinary = await resolveChromeBinary();
        const budgets = [8000, 12000, 16000, 20000, 24000];

        for (let attemptIndex = 0; attemptIndex < budgets.length; attemptIndex += 1) {
          const tempPath = path.join(os.tmpdir(), `vk-rendered-${Date.now()}-${Math.random().toString(16).slice(2)}.html`);
          const scriptPath = path.join(os.tmpdir(), `vk-rendered-${Date.now()}-${Math.random().toString(16).slice(2)}.sh`);
          const scriptBody = [
            '#!/bin/bash',
            `${shellQuote(chromeBinary)} --headless=new --disable-gpu --virtual-time-budget=${budgets[attemptIndex]} --dump-dom ${shellQuote(url)} > ${shellQuote(tempPath)} 2>/dev/null || true`
          ].join('\n');

          try {
            await fs.writeFile(scriptPath, scriptBody, 'utf8');
            await execFileAsync('/bin/bash', [scriptPath], {
              timeout: RENDER_TIMEOUT_MS,
              maxBuffer: 1024 * 1024
            });
          } catch {
            // Ignore Chrome exit noise and inspect the captured file instead.
          }

          let renderedHtml = '';
          try {
            renderedHtml = await fs.readFile(tempPath, 'utf8');
          } catch {
            renderedHtml = '';
          }

          await fs.rm(scriptPath, { force: true });
          await fs.rm(tempPath, { force: true });

          if (!renderedHtml.trim()) {
            await new Promise((resolve) => setTimeout(resolve, 2500 * (attemptIndex + 1)));
            continue;
          }
          if (isVkCaptchaPage(renderedHtml)) {
            await new Promise((resolve) => setTimeout(resolve, 4000 * (attemptIndex + 1)));
            continue;
          }
          return renderedHtml;
        }

        throw new Error(`Rendered fetch returned empty output for ${url}`);
      })()
    );
  }

  try {
    return await renderedFetchCache.get(url);
  } catch (error) {
    renderedFetchCache.delete(url);
    throw error;
  }
}

function htmlToPlainText(htmlFragment) {
  return decodeHtml(
    String(htmlFragment || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function decodeBase64Url(value) {
  const normalizedValue = String(value || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  if (!normalizedValue) return '';

  try {
    const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=');
    return Buffer.from(paddedValue, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function extractAwayRedirectTarget(html) {
  const redirMatch = html.match(/<input[^>]*id=["']redir["'][^>]*value=["']([^"']+)["']/i);
  if (redirMatch) return decodeHtml(redirMatch[1]);
  const metaRefreshMatch = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*URL='([^']+)'/i);
  if (metaRefreshMatch) return decodeHtml(metaRefreshMatch[1]);
  return '';
}

function extractVkChallengeTarget(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    if (!host.endsWith('vk.com') || !/\/challenge\.html$/i.test(parsedUrl.pathname)) return '';
    const redirectValue = parsedUrl.searchParams.get('redirect');
    if (!redirectValue) return '';
    const decodedRedirect = decodeURIComponent(redirectValue);
    const redirectUrl = new URL(decodedRedirect, 'https://vk.com');
    const nestedTo = redirectUrl.searchParams.get('to');
    if (!nestedTo) return '';
    const decodedNestedTo = decodeBase64Url(nestedTo) || decodeURIComponent(nestedTo);
    if (/^https?:\/\//i.test(decodedNestedTo)) return decodedNestedTo;
    if (!/^away\.php\?/i.test(decodedNestedTo)) return '';
    const awayUrl = new URL(decodedNestedTo, 'https://vk.com');
    const targetValue = awayUrl.searchParams.get('to');
    return targetValue ? decodeURIComponent(targetValue) : '';
  } catch {
    return '';
  }
}

async function resolveUrlRedirectTarget(url, maxRedirects = 6) {
  let currentUrl = cleanUrl(url);

  for (let redirectIndex = 0; redirectIndex < maxRedirects; redirectIndex += 1) {
    const challengeTarget = extractVkChallengeTarget(currentUrl);
    if (challengeTarget) return cleanUrl(challengeTarget);

    try {
      if (normalizeHost(currentUrl) === 'vk.cc') {
        const awayHtml = await fetchText(`https://vk.com/away.php?to=${encodeURIComponent(currentUrl)}&utf=1`);
        const awayTarget = extractAwayRedirectTarget(awayHtml);
        if (awayTarget) return cleanUrl(awayTarget);
      }
    } catch {
      // Fall through to manual redirect handling.
    }

    let response;
    try {
      response = await fetch(currentUrl, {
        headers: {
          'user-agent': USER_AGENT,
          'accept-language': 'en-US,en;q=0.9'
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
    } catch {
      return currentUrl;
    }

    if (response.status < 300 || response.status >= 400) {
      const finalUrl = response.url || currentUrl;
      const finalChallengeTarget = extractVkChallengeTarget(finalUrl);
      return cleanUrl(finalChallengeTarget || finalUrl);
    }

    const location = response.headers.get('location');
    if (!location) return currentUrl;
    currentUrl = cleanUrl(new URL(location, currentUrl).toString());
  }

  return currentUrl;
}

async function runTesseract(imagePath, psm = '6') {
  const { stdout } = await execFileAsync('tesseract', [imagePath, 'stdout', '--psm', String(psm)], {
    timeout: PROCESS_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024
  });
  return stdout.trim();
}

async function prepareImageVariants(imagePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plain-release-ocr-'));
  const preparedPaths = [];

  try {
    const variants = [
      {
        name: 'gray',
        filters: 'scale=iw*4:ih*4,format=gray'
      },
      {
        name: 'contrast',
        filters: 'scale=iw*4:ih*4,format=gray,eq=contrast=2.6:brightness=0.04'
      }
    ];

    for (const variant of variants) {
      const outputPath = path.join(tempDir, `${variant.name}.png`);
      try {
        await execFileAsync('ffmpeg', ['-y', '-i', imagePath, '-vf', variant.filters, outputPath], {
          timeout: PROCESS_TIMEOUT_MS,
          maxBuffer: 10 * 1024 * 1024
        });
        preparedPaths.push(outputPath);
      } catch {
        continue;
      }
    }
  } catch {
    return {
      tempDir,
      preparedPaths
    };
  }

  return {
    tempDir,
    preparedPaths
  };
}

function extractCatalogCode(text) {
  const match = String(text || '').match(/\b[A-Z]{2,}\d{2,}[A-Z0-9]{1,}\b/);
  return match ? match[0] : '';
}

function sanitizeOcrLine(value) {
  return String(value || '')
    .replace(/[{}()[\]|]/g, ' ')
    .replace(/[^\w\s&'".,/+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsefulOcrLine(value) {
  const line = sanitizeOcrLine(value);
  const letters = (line.match(/[a-z]/gi) || []).length;
  const digits = (line.match(/\d/g) || []).length;
  const tokens = tokenizeText(line);
  if (!line) return false;
  if (line.length < 4) return false;
  if (letters + digits < 4) return false;
  if (tokens.length < 2 && letters < 6) return false;
  return true;
}

async function extractImageSearchPayload(imagePath) {
  const seenTexts = new Set();
  const texts = [];
  const { tempDir, preparedPaths } = await prepareImageVariants(imagePath);

  try {
    const variantPaths = [imagePath, ...preparedPaths];

    for (const variantPath of variantPaths) {
      for (const psm of ['6', '11']) {
        try {
          const text = await runTesseract(variantPath, psm);
          const normalizedText = text.replace(/\s+/g, ' ').trim();
          if (!normalizedText || seenTexts.has(normalizedText)) continue;
          seenTexts.add(normalizedText);
          texts.push(text);
        } catch {
          continue;
        }
      }
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  const baseQueries = [];
  const seenQueries = new Set();

  function pushQuery(query) {
    const cleanedQuery = sanitizeOcrLine(query);
    if (!cleanedQuery || seenQueries.has(cleanedQuery)) return;
    seenQueries.add(cleanedQuery);
    baseQueries.push(cleanedQuery);
  }

  for (const text of texts) {
    const catalogCode = extractCatalogCode(text);
    if (catalogCode) pushQuery(catalogCode);

    const lines = text
      .split('\n')
      .map((line) => sanitizeOcrLine(line))
      .filter(isUsefulOcrLine)
      .slice(0, 5);

    for (const line of lines) {
      pushQuery(line);
    }

    if (lines.length >= 2) pushQuery(`${lines[0]} ${lines[1]}`);
    if (lines.length >= 3) pushQuery(`${lines[0]} ${lines[1]} ${lines[2]}`);
  }

  const queries = [];
  const expandedSeen = new Set();
  for (const query of baseQueries.slice(0, 1)) {
    const variants = [query, `${query} Bandcamp`, `${query} SoundCloud`];
    for (const variant of variants) {
      const cleanedVariant = sanitizeOcrLine(variant);
      if (!cleanedVariant || expandedSeen.has(cleanedVariant)) continue;
      expandedSeen.add(cleanedVariant);
      queries.push(cleanedVariant);
    }
  }

  return {
    ocrTexts: texts,
    queries
  };
}

function extractSearchResults(html) {
  const matches = [...html.matchAll(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)[^"]*"/g)];
  const urls = [];
  const seen = new Set();

  for (const match of matches) {
    const decodedUrl = cleanUrl(decodeURIComponent(match[1]));
    if (seen.has(decodedUrl)) continue;
    seen.add(decodedUrl);
    urls.push(decodedUrl);
  }

  return urls;
}

function extractBraveSearchResults(html) {
  const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)];
  const urls = [];
  const seen = new Set();

  for (const match of matches) {
    const decodedUrl = cleanUrl(decodeHtml(match[1]));
    const host = normalizeHost(decodedUrl);

    if (!decodedUrl || seen.has(decodedUrl)) continue;
    if (host === 'search.brave.com') continue;
    if (host === 'cdn.search.brave.com') continue;
    if (host === 'imgs.search.brave.com') continue;
    if (host === 'tiles.search.brave.com') continue;

    seen.add(decodedUrl);
    urls.push(decodedUrl);
  }

  return urls;
}

async function collectSearchResults(searchQuery, includeDuckDuckGoFallback = true) {
  let urls = [];

  try {
    const braveHtml = await fetchText(`https://search.brave.com/search?q=${encodeURIComponent(searchQuery)}&source=web`);
    urls = extractBraveSearchResults(braveHtml);
  } catch {
    urls = [];
  }

  if (urls.length || !includeDuckDuckGoFallback) return urls;

  try {
    const duckHtml = await fetchText(`https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`);
    urls = extractSearchResults(duckHtml);
  } catch {
    urls = [];
  }

  return urls;
}

function extractJsonLdBlocks(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const objects = [];

  for (const block of blocks) {
    const payload = block[1].trim();
    if (!payload) continue;
    try {
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) {
        for (const item of parsed) objects.push(item);
      } else {
        objects.push(parsed);
      }
    } catch {
      continue;
    }
  }

  return objects;
}

function dedupeLinks(links) {
  const seen = new Set();
  const uniqueLinks = [];

  for (const link of links) {
    if (!link || !link.url) continue;
    const cleanedUrl = cleanUrl(link.url);
    if (!cleanedUrl || seen.has(cleanedUrl)) continue;
    seen.add(cleanedUrl);
    uniqueLinks.push({
      label: link.label,
      providerName: link.providerName,
      url: cleanedUrl
    });
  }

  return uniqueLinks;
}

function sortLinksByDisplayOrder(links) {
  return links.slice().sort((left, right) => {
    const leftIndex = DISPLAY_PROVIDER_ORDER.indexOf(left.providerName);
    const rightIndex = DISPLAY_PROVIDER_ORDER.indexOf(right.providerName);
    const normalizedLeftIndex = leftIndex === -1 ? DISPLAY_PROVIDER_ORDER.length : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? DISPLAY_PROVIDER_ORDER.length : rightIndex;

    return normalizedLeftIndex - normalizedRightIndex || String(left.label).localeCompare(String(right.label));
  });
}

function getReleaseLinkProviderName(link) {
  if (!link) return '';
  if (link.providerName) return String(link.providerName).toLowerCase();

  try {
    return getProviderForUrl(link.url)?.providerName || '';
  } catch {
    return '';
  }
}

function getSocialProviderName(link) {
  const label = String(link?.label || '').toLowerCase();
  if (label === 'instagram') return 'instagram';
  if (label === 'youtube') return 'youtube';
  if (label === 'soundcloud') return 'soundcloud';
  if (label === 'spotify') return 'spotify';
  if (label === 'bandcamp') return 'bandcamp';
  if (label === 'x' || label === 'twitter') return 'x';
  if (label === 'facebook') return 'facebook';
  if (label === 'tiktok') return 'tiktok';

  try {
    const host = normalizeHost(link.url);
    if (host.endsWith('instagram.com')) return 'instagram';
    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
    if (host.endsWith('soundcloud.com')) return 'soundcloud';
    if (host === 'open.spotify.com') return 'spotify';
    if (host.endsWith('bandcamp.com')) return 'bandcamp';
    if (host === 'x.com' || host === 'twitter.com') return 'x';
    if (host.endsWith('facebook.com')) return 'facebook';
    if (host.endsWith('tiktok.com')) return 'tiktok';
  } catch {
    return '';
  }

  return '';
}

function dedupeSocialLinks(links) {
  const seenUrls = new Set();
  const seenProviders = new Set();
  const uniqueLinks = [];

  for (const link of links) {
    if (!link || !link.url || !link.label) continue;
    const cleanedUrl = cleanUrl(link.url);
    const providerName = getSocialProviderName({ ...link, url: cleanedUrl });
    const providerKey = providerName || String(link.label).toLowerCase();

    if (!cleanedUrl || seenUrls.has(cleanedUrl) || seenProviders.has(providerKey)) continue;
    seenUrls.add(cleanedUrl);
    seenProviders.add(providerKey);
    uniqueLinks.push({
      label: link.label === 'Twitter' ? 'X' : link.label,
      url: cleanedUrl
    });
  }

  return uniqueLinks;
}

function sortSocialLinks(links) {
  return dedupeSocialLinks(links).sort((left, right) => {
    const leftProvider = getSocialProviderName(left);
    const rightProvider = getSocialProviderName(right);
    const leftIndex = SOCIAL_DISPLAY_ORDER.indexOf(leftProvider);
    const rightIndex = SOCIAL_DISPLAY_ORDER.indexOf(rightProvider);
    const normalizedLeftIndex = leftIndex === -1 ? SOCIAL_DISPLAY_ORDER.length : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? SOCIAL_DISPLAY_ORDER.length : rightIndex;

    return normalizedLeftIndex - normalizedRightIndex || left.label.localeCompare(right.label);
  });
}

function mergeReleaseLinks(baseLinks, overrideLinks) {
  const mergedByProvider = new Map();
  const passthroughLinks = [];

  for (const link of Array.isArray(baseLinks) ? baseLinks : []) {
    if (!link?.url) continue;
    const providerName = getReleaseLinkProviderName(link);
    const normalizedLink = {
      label: link.label,
      providerName: providerName || link.providerName,
      url: cleanUrl(link.url)
    };
    if (!normalizedLink.url) continue;
    if (providerName) {
      mergedByProvider.set(providerName, normalizedLink);
    } else {
      passthroughLinks.push(normalizedLink);
    }
  }

  for (const link of Array.isArray(overrideLinks) ? overrideLinks : []) {
    if (!link?.url) continue;
    const providerName = getReleaseLinkProviderName(link);
    const normalizedLink = {
      label: link.label,
      providerName: providerName || link.providerName,
      url: cleanUrl(link.url)
    };
    if (!normalizedLink.url) continue;
    if (providerName) {
      mergedByProvider.set(providerName, normalizedLink);
    } else {
      passthroughLinks.push(normalizedLink);
    }
  }

  return sortLinksByDisplayOrder(
    dedupeLinks(Array.from(mergedByProvider.values()).concat(passthroughLinks))
  );
}

function mergeSocialLinks(baseLinks, overrideLinks) {
  const mergedByProvider = new Map();
  const passthroughLinks = [];

  for (const link of Array.isArray(baseLinks) ? baseLinks : []) {
    if (!link?.url || !link?.label) continue;
    const providerName = getSocialProviderName(link);
    const normalizedLink = {
      label: link.label === 'Twitter' ? 'X' : link.label,
      url: cleanUrl(link.url)
    };
    if (!normalizedLink.url) continue;
    if (providerName) {
      mergedByProvider.set(providerName, normalizedLink);
    } else {
      passthroughLinks.push(normalizedLink);
    }
  }

  for (const link of Array.isArray(overrideLinks) ? overrideLinks : []) {
    if (!link?.url || !link?.label) continue;
    const providerName = getSocialProviderName(link);
    const normalizedLink = {
      label: link.label === 'Twitter' ? 'X' : link.label,
      url: cleanUrl(link.url)
    };
    if (!normalizedLink.url) continue;
    if (providerName) {
      mergedByProvider.set(providerName, normalizedLink);
    } else {
      passthroughLinks.push(normalizedLink);
    }
  }

  return sortSocialLinks(Array.from(mergedByProvider.values()).concat(passthroughLinks));
}

function applyManualDetailPatch(itemIndex, detail) {
  const patch = MANUAL_DETAIL_PATCHES[String(itemIndex)];
  if (!patch || !detail) return detail;

  return {
    ...detail,
    artistName: patch.artistName || detail.artistName,
    releaseTitle: patch.releaseTitle || detail.releaseTitle,
    releaseUrl: patch.releaseUrl || detail.releaseUrl,
    sourceUrl: patch.sourceUrl || detail.sourceUrl,
    sourceLabel: patch.sourceLabel || detail.sourceLabel,
    provider: patch.provider || detail.provider,
    releaseLinks: mergeReleaseLinks(detail.releaseLinks, patch.releaseLinks),
    socialLinks: mergeSocialLinks(detail.socialLinks, patch.socialLinks)
  };
}

function buildBandcampProfileUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}/`;
  } catch {
    return '';
  }
}

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match) {
    throw new Error('Could not find __NEXT_DATA__ on the WARP artist links page');
  }

  return JSON.parse(match[1]);
}

function parseWarpReleasePage(html, releaseUrl) {
  const description = pickMeta(html, 'name', 'description');
  const author = pickMeta(html, 'name', 'author');
  const ogTitle = pickMeta(html, 'property', 'og:title');
  const artistLinkMatch = html.match(/\/artist\/\d+-([^"'/?#]+)/i);

  let artistName = author.trim();
  let releaseTitle = '';

  const descriptionMatch = description.match(/^Buy\s+(.+?)\s+by\s+(.+?)\s+on\s+/i);
  if (descriptionMatch) {
    releaseTitle = descriptionMatch[1].trim();
    if (!artistName) artistName = descriptionMatch[2].trim();
  }

  if (!releaseTitle && ogTitle) {
    const ogMatch = ogTitle.match(/^(.*?)\s*-\s*(.*?)\.\s*Aphex Twin\.?$/i);
    if (ogMatch) {
      artistName = artistName || ogMatch[1].trim();
      releaseTitle = ogMatch[2].trim();
    }
  }

  if (!artistName || !releaseTitle) {
    throw new Error(`Could not parse artist/release metadata from ${releaseUrl}`);
  }

  if (!artistLinkMatch) {
    throw new Error(`Could not find a WARP artist slug on ${releaseUrl}`);
  }

  return {
    artistName,
    releaseTitle,
    artistSlug: decodeHtml(artistLinkMatch[1])
  };
}

function parseWarpArtistSocials(html, artistSlug) {
  const nextData = extractNextData(html);
  const apolloState = nextData?.props?.pageProps?.__APOLLO_STATE__ || {};

  const artistRecord = Object.values(apolloState).find((value) => {
    return value && value.__typename === 'artists' && value.slug === artistSlug;
  });

  if (!artistRecord || !Array.isArray(artistRecord.externalLinks)) {
    throw new Error(`Could not find external links for the artist "${artistSlug}" on WARP`);
  }

  const socialSection = artistRecord.externalLinks.find((group) => group.title === 'Social');
  if (!socialSection || !Array.isArray(socialSection.links) || !socialSection.links.length) {
    throw new Error(`Could not find a social links section for the artist "${artistSlug}" on WARP`);
  }

  return socialSection.links.map((link) => ({
    label: link.text,
    url: link.url
  }));
}

function extractBandcampJsonLd(html) {
  const jsonLdBlocks = extractJsonLdBlocks(html);

  return jsonLdBlocks.find((entry) => {
    const type = Array.isArray(entry?.['@type']) ? entry['@type'].join(' ') : String(entry?.['@type'] || '');
    return /MusicAlbum|MusicRecording|MusicRelease|Product/i.test(type);
  }) || null;
}

function parseBandcampReleasePage(html, releaseUrl) {
  const jsonLd = extractBandcampJsonLd(html);
  let artistName = '';
  let releaseTitle = '';
  let publisherName = '';
  let publisherUrl = '';

  if (jsonLd) {
    artistName = String(
      jsonLd?.byArtist?.name ||
        jsonLd?.albumRelease?.[0]?.byArtist?.name ||
        jsonLd?.albumRelease?.[0]?.recordingOf?.byArtist?.name ||
        ''
    ).trim();
    releaseTitle = String(
      jsonLd?.name ||
        jsonLd?.albumRelease?.[0]?.name ||
        jsonLd?.albumRelease?.[0]?.recordingOf?.name ||
        ''
    ).trim();
    publisherName = String(
      jsonLd?.publisher?.name ||
        jsonLd?.albumRelease?.[0]?.publisher?.name ||
        ''
    ).trim();
    publisherUrl = String(
      jsonLd?.publisher?.['@id'] ||
        jsonLd?.albumRelease?.[0]?.publisher?.['@id'] ||
        ''
    ).trim();
  }

  if (!artistName || !releaseTitle) {
    const ogTitle = pickMeta(html, 'property', 'og:title') || pickMeta(html, 'name', 'title');
    const byMatch = ogTitle.match(/^(.*?),\s+by\s+(.+)$/i);

    if (!byMatch) {
      throw new Error(`Could not parse Bandcamp release metadata from ${releaseUrl}`);
    }

    artistName = byMatch[2].trim();
    releaseTitle = byMatch[1].trim();
  }

  const socialLinks = [];
  let bandcampProfileUrl = buildBandcampProfileUrl(releaseUrl);
  if (publisherUrl) {
    try {
      const publisherHost = normalizeHost(publisherUrl);
      if (publisherHost.endsWith('bandcamp.com')) {
        bandcampProfileUrl = buildBandcampProfileUrl(publisherUrl);
      }
    } catch {
      // Keep the release host fallback.
    }
  }
  if (bandcampProfileUrl) {
    const urlHost = normalizeHost(bandcampProfileUrl);
    const handle = normalizeArtistSlug(urlHost.replace(/\.bandcamp\.com$/i, ''));
    const artistSlug = normalizeArtistSlug(artistName);
    const publisherScore = computeStringMatch(artistName, publisherName);

    if ((handle && artistSlug && handle === artistSlug) || publisherScore >= MIN_CONFIRMED_SOCIAL_MATCH_SCORE) {
      socialLinks.push({
        label: 'Bandcamp',
        url: bandcampProfileUrl
      });
    }
  }

  return {
    artistName,
    releaseTitle,
    socialLinks
  };
}

function parseSpotifyReleasePage(html, releaseUrl) {
  const ogTitle = pickMeta(html, 'property', 'og:title') || pickMeta(html, 'name', 'twitter:title');
  const ogDescription = pickMeta(html, 'property', 'og:description') || pickMeta(html, 'name', 'twitter:description');
  const pageTitle = pickTitle(html);
  const musicianDescription = pickMeta(html, 'name', 'music:musician_description');
  const musicianUrls = [...html.matchAll(/<meta[^>]*name=["']music:musician["'][^>]*content=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => cleanUrl(decodeHtml(match[1].trim())))
    .filter(Boolean);
  const titleMatch = pageTitle.match(/^(.*?)\s+-\s+.*?\bby\s+(.+?)\s+\|\s+Spotify$/i)
    || pageTitle.match(/^(.*?)\s+-\s+album\s+by\s+(.+?)\s+\|\s+Spotify$/i)
    || pageTitle.match(/^(.*?)\s+-\s+single\s+by\s+(.+?)\s+\|\s+Spotify$/i)
    || pageTitle.match(/^(.*?)\s+-\s+ep\s+by\s+(.+?)\s+\|\s+Spotify$/i);

  const descriptionParts = ogDescription
    .split(/\s+·\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const descriptionArtist = descriptionParts[0] || '';
  const descriptionTitle = descriptionParts[1] || '';

  const releaseTitle = titleMatch
    ? titleMatch[1].trim()
    : ogTitle.trim() || descriptionTitle;
  const artistName = titleMatch
    ? titleMatch[2].trim()
    : musicianDescription || descriptionArtist;
  const socialLinks = musicianUrls.length ? [{ label: 'Spotify', url: musicianUrls[0] }] : [];

  return {
    artistName,
    releaseTitle,
    socialLinks
  };
}

function splitArtistAndTitle(rawTitle, fallbackArtist) {
  const title = String(rawTitle || '').trim();
  const artistName = String(fallbackArtist || '').trim();
  const parts = title.split(/\s+-\s+/);

  if (parts.length >= 2) {
    const firstPart = parts[0].trim();
    const rest = parts.slice(1).join(' - ').trim();
    const artistMatch = computeStringMatch(firstPart, artistName);

    if (firstPart && rest && artistMatch < 0.75) {
      return {
        artistName: firstPart,
        releaseTitle: rest
      };
    }
  }

  return {
    artistName,
    releaseTitle: title
  };
}

async function parseSoundCloudReleasePage(releaseUrl) {
  const data = await fetchJson(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(releaseUrl)}`);
  const authorName = String(data.author_name || '').trim();
  const authorUrl = cleanUrl(String(data.author_url || '').trim());
  let releaseTitle = String(data.title || '').trim();

  if (authorName && releaseTitle.toLowerCase().startsWith(`${authorName.toLowerCase()} - `)) {
    releaseTitle = releaseTitle.slice(authorName.length + 3).trim();
  }

  if (authorName) {
    const authorPattern = authorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    releaseTitle = releaseTitle.replace(new RegExp(`\\s+by\\s+${authorPattern}$`, 'i'), '').trim();
  }

  const splitTitle = splitArtistAndTitle(releaseTitle, authorName);
  const resolvedArtistName = splitTitle.artistName || authorName;
  const authorMatchScore = computeStringMatch(resolvedArtistName, authorName);

  return {
    artistName: resolvedArtistName,
    releaseTitle: splitTitle.releaseTitle,
    socialLinks: authorUrl && authorMatchScore >= 0.75 ? [{ label: 'SoundCloud', url: authorUrl }] : []
  };
}

async function parseYouTubeReleasePage(releaseUrl) {
  const data = await fetchJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(releaseUrl)}`);
  const rawTitle = String(data.title || '').trim();
  const authorName = String(data.author_name || '').trim().replace(/VEVO$/i, '').trim();
  const authorUrl = cleanUrl(String(data.author_url || '').trim());
  const titleParts = rawTitle.split(/\s+-\s+/);
  const splitTitle =
    titleParts.length >= 2
      ? {
          artistName: titleParts[0].trim(),
          releaseTitle: titleParts.slice(1).join(' - ').trim()
        }
      : splitArtistAndTitle(rawTitle, authorName);
  const resolvedArtistName = splitTitle.artistName || authorName;
  const authorMatchScore = computeStringMatch(resolvedArtistName, authorName);

  return {
    artistName: resolvedArtistName,
    releaseTitle: splitTitle.releaseTitle || rawTitle,
    socialLinks: authorUrl && authorMatchScore >= 0.75 ? [{ label: 'YouTube', url: authorUrl }] : []
  };
}

async function runFfprobeJson(targetUrl) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    targetUrl
  ], {
    timeout: PROCESS_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024
  });

  return JSON.parse(stdout);
}

async function parseAudioFileReleasePage(releaseUrl) {
  const data = await runFfprobeJson(releaseUrl);
  const tags = data?.format?.tags || {};
  const artistName = String(tags.artist || tags.album_artist || '').trim();
  const releaseTitle = String(tags.title || tags.album || '').trim();

  if (!artistName || !releaseTitle) {
    throw new Error(`Could not parse artist/title tags from ${releaseUrl}`);
  }

  return {
    artistName,
    releaseTitle,
    socialLinks: []
  };
}

async function getSoundCloudClientId() {
  if (soundCloudClientIdPromise) return soundCloudClientIdPromise;

  soundCloudClientIdPromise = (async () => {
    const homepageHtml = await fetchText('https://soundcloud.com');
    const scriptUrls = [...homepageHtml.matchAll(/<script crossorigin src="([^"]+)"/g)]
      .map((match) => match[1]);

    for (let i = scriptUrls.length - 1; i >= 0; i -= 1) {
      const scriptUrl = scriptUrls[i];
      try {
        const scriptText = await fetchText(scriptUrl);
        const clientIdMatch =
          scriptText.match(/client_id\s*[:=]\s*["']([a-zA-Z0-9]+)["']/) ||
          scriptText.match(/[?&]client_id=([a-zA-Z0-9]+)/) ||
          scriptText.match(/clientId["']?\s*[:=]\s*["']([a-zA-Z0-9]+)["']/);

        if (clientIdMatch) {
          return clientIdMatch[1];
        }
      } catch {
        continue;
      }
    }

    throw new Error('Could not extract a SoundCloud client_id from the web app bundle');
  })();

  return soundCloudClientIdPromise;
}

async function searchSoundCloudViaApi(expectedArtistName, expectedReleaseTitle) {
  const clientId = await getSoundCloudClientId();
  const searchQueries = [
    `${expectedArtistName} ${expectedReleaseTitle}`,
    `${expectedArtistName} ${expectedReleaseTitle}`.replace(/\b(EP|LP|Album|Single)\b/gi, ' ').replace(/\s+/g, ' ').trim()
  ].filter(Boolean);
  const candidateUrls = [];
  const seen = new Set();

  for (let i = 0; i < searchQueries.length; i += 1) {
    const searchQuery = searchQueries[i];
    const endpoints = [
      `https://api-v2.soundcloud.com/search/playlists?q=${encodeURIComponent(searchQuery)}&client_id=${clientId}&limit=10&offset=0`,
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(searchQuery)}&client_id=${clientId}&limit=10&offset=0`
    ];

    for (let j = 0; j < endpoints.length; j += 1) {
      try {
        const payload = await fetchJson(endpoints[j]);
        const collection = Array.isArray(payload?.collection) ? payload.collection : [];

        for (let k = 0; k < collection.length; k += 1) {
          const permalinkUrl = cleanUrl(collection[k]?.permalink_url || '');
          if (!permalinkUrl || seen.has(permalinkUrl)) continue;
          seen.add(permalinkUrl);
          candidateUrls.push(permalinkUrl);
          if (candidateUrls.length >= 6) return candidateUrls;
        }
      } catch {
        continue;
      }
    }

    if (candidateUrls.length >= 3) break;
  }

  return candidateUrls;
}

const PROVIDERS = [
  {
    name: 'warp',
    matches(url) {
      return normalizeHost(url).endsWith('warp.net');
    },
    score: 100,
    async parseRelease(releaseUrl) {
      const releaseHtml = await fetchText(releaseUrl);
      const releaseDetails = parseWarpReleasePage(releaseHtml, releaseUrl);
      const socialsHtml = await fetchText(`https://warp.net/artists/${releaseDetails.artistSlug}/links/`);
      return {
        artistName: releaseDetails.artistName,
        releaseTitle: releaseDetails.releaseTitle,
        socialLinks: parseWarpArtistSocials(socialsHtml, releaseDetails.artistSlug)
      };
    }
  },
  {
    name: 'bandcamp',
    matches(url) {
      return normalizeHost(url).endsWith('bandcamp.com');
    },
    score: 90,
    async parseRelease(releaseUrl) {
      const releaseHtml = await fetchText(releaseUrl);
      return parseBandcampReleasePage(releaseHtml, releaseUrl);
    }
  },
  {
    name: 'spotify',
    matches(url) {
      return normalizeHost(url) === 'open.spotify.com';
    },
    score: 80,
    async parseRelease(releaseUrl) {
      const releaseHtml = await fetchText(releaseUrl);
      return parseSpotifyReleasePage(releaseHtml, releaseUrl);
    }
  },
  {
    name: 'soundcloud',
    matches(url) {
      return normalizeHost(url).endsWith('soundcloud.com');
    },
    score: 70,
    async parseRelease(releaseUrl) {
      return await parseSoundCloudReleasePage(releaseUrl);
    }
  },
  {
    name: 'youtube',
    matches(url) {
      const host = normalizeHost(url);
      return host === 'youtube.com' || host === 'youtu.be';
    },
    score: 60,
    async parseRelease(releaseUrl) {
      return await parseYouTubeReleasePage(releaseUrl);
    }
  },
  {
    name: 'file',
    matches(url) {
      try {
        return /\.mp3$/i.test(new URL(url).pathname);
      } catch {
        return false;
      }
    },
    score: 40,
    async parseRelease(releaseUrl) {
      return await parseAudioFileReleasePage(releaseUrl);
    }
  }
];

function getProviderForUrl(url) {
  return PROVIDERS.find((provider) => provider.matches(url)) || null;
}

function scoreReleaseCandidate(url) {
  const provider = getProviderForUrl(url);
  return provider ? provider.score : 0;
}

function pickBestReleaseUrl(urls) {
  const sortedUrls = urls
    .map((url) => ({ url, score: scoreReleaseCandidate(url) }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!sortedUrls.length) {
    throw new Error('No usable music release URL was found in the search results');
  }

  return sortedUrls[0].url;
}

async function parseReleaseWithProvider(releaseUrl) {
  const cleanedReleaseUrl = cleanUrl(releaseUrl);
  if (!releaseParseCache.has(cleanedReleaseUrl)) {
    releaseParseCache.set(
      cleanedReleaseUrl,
      (async () => {
        const provider = getProviderForUrl(cleanedReleaseUrl);
        if (!provider) {
          throw new Error(`No provider parser is registered for ${normalizeHost(cleanedReleaseUrl)}`);
        }

        const releaseDetails = await provider.parseRelease(cleanedReleaseUrl);

        if (!releaseDetails.artistName || !releaseDetails.releaseTitle) {
          throw new Error(`The ${provider.name} parser returned incomplete metadata for ${cleanedReleaseUrl}`);
        }

        return {
          provider: provider.name,
          artistName: releaseDetails.artistName,
          releaseTitle: releaseDetails.releaseTitle,
          socialLinks: sortSocialLinks(Array.isArray(releaseDetails.socialLinks) ? releaseDetails.socialLinks : [])
        };
      })()
    );
  }

  try {
    return await releaseParseCache.get(cleanedReleaseUrl);
  } catch (error) {
    releaseParseCache.delete(cleanedReleaseUrl);
    throw error;
  }
}

function isCandidateUrlForPlatform(url, platform) {
  const host = normalizeHost(url);
  const pathname = new URL(url).pathname;

  if (platform.providerName === 'bandcamp') {
    return host.endsWith('bandcamp.com') && !host.startsWith('daily.');
  }

  if (platform.providerName === 'spotify') {
    return host === 'open.spotify.com' && /\/(album|track)\//i.test(pathname);
  }

  if (platform.providerName === 'soundcloud') {
    return host.endsWith('soundcloud.com') && !/^\/search\b/i.test(pathname);
  }

  return false;
}

function buildPlatformSearchQueries(platform, artistName, releaseTitle) {
  const platformLabel = PROVIDER_LABELS[platform.providerName] || platform.providerName;
  return [
    `site:${platform.searchHost} "${artistName}" "${releaseTitle}"`,
    `"${artistName}" "${releaseTitle}" ${platformLabel}`,
    `${artistName} ${releaseTitle} ${platformLabel}`
  ];
}

async function collectPlatformCandidateUrls(platform, expectedArtistName, expectedReleaseTitle) {
  const candidateUrls = [];
  const seen = new Set();
  const searchQueries = buildPlatformSearchQueries(platform, expectedArtistName, expectedReleaseTitle);

  if (platform.providerName === 'soundcloud') {
    try {
      const soundCloudApiUrls = await searchSoundCloudViaApi(expectedArtistName, expectedReleaseTitle);
      for (const resultUrl of soundCloudApiUrls) {
        if (seen.has(resultUrl)) continue;
        seen.add(resultUrl);
        candidateUrls.push(resultUrl);
        if (candidateUrls.length >= 6) return candidateUrls;
      }
    } catch {
      // Fall back to external search if the SoundCloud API route is unavailable.
    }
  }

  for (const searchQuery of searchQueries) {
    let searchResults = [];

    try {
      searchResults = await collectSearchResults(searchQuery);
    } catch {
      searchResults = [];
    }

    searchResults = searchResults.filter((url) => isCandidateUrlForPlatform(url, platform));

    for (const resultUrl of searchResults) {
      if (seen.has(resultUrl)) continue;
      seen.add(resultUrl);
      candidateUrls.push(resultUrl);
      if (candidateUrls.length >= 6) return candidateUrls;
    }

    if (candidateUrls.length >= 3) break;
  }

  return candidateUrls;
}

async function searchPlatformRelease(platform, expectedArtistName, expectedReleaseTitle) {
  const candidateUrls = await collectPlatformCandidateUrls(platform, expectedArtistName, expectedReleaseTitle);

  if (!candidateUrls.length) return null;

  const matches = await Promise.all(
    candidateUrls.map(async (candidateUrl, index) => {
      try {
        const parsedCandidate = await parseReleaseWithProvider(candidateUrl);
        const matchScore = computeReleaseMatchScore(
          expectedArtistName,
          expectedReleaseTitle,
          parsedCandidate.artistName,
          parsedCandidate.releaseTitle
        );

        return {
          index,
          url: candidateUrl,
          label: PROVIDER_LABELS[platform.providerName],
          providerName: platform.providerName,
          score: matchScore
        };
      } catch {
        return null;
      }
    })
  );

  const bestMatch = matches
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.index - right.index)[0];

  if (!bestMatch || bestMatch.score < 78) return null;

  return {
    label: bestMatch.label,
    providerName: bestMatch.providerName,
    url: bestMatch.url
  };
}

async function findPlatformLinks(releaseUrl, providerName, artistName, releaseTitle, seededLinks = []) {
  const initialLinks = dedupeLinks(Array.isArray(seededLinks) ? seededLinks : []);
  const existingProviders = new Set(initialLinks.map((link) => link.providerName));
  const foundLinks = await Promise.all(
    PLATFORM_SEARCHES.map(async (platform) => {
      if (existingProviders.has(platform.providerName)) return null;
      if (platform.providerName === providerName) {
        return {
          label: PROVIDER_LABELS[platform.providerName],
          providerName: platform.providerName,
          url: releaseUrl
        };
      }

      try {
        return await searchPlatformRelease(platform, artistName, releaseTitle);
      } catch {
        return null;
      }
    })
  );

  return sortLinksByDisplayOrder(dedupeLinks(initialLinks.concat(foundLinks)));
}

function mapSourceLabelToProviderName(sourceLabel, sourceUrl) {
  const directProvider = getProviderForUrl(sourceUrl);
  if (directProvider) return directProvider.name;
  if (sourceLabel === 'VK') return 'vk';
  if (sourceLabel === 'YouTube') return 'youtube';
  if (sourceLabel === 'Dropbox') return 'file';
  return '';
}

function shouldIgnoreVkUtilityUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    if (host === 'login.vk.com' || host === 'api.vk.com' || host === 'away.vk.com') return true;
    if (host === 'st.vk.com' || host.endsWith('.vk.com') && host.startsWith('st.')) return true;
    if (!host.endsWith('vk.com')) return false;
    if (/^\/login\b/i.test(parsedUrl.pathname)) return true;
    if (/\/challenge\.html$/i.test(parsedUrl.pathname)) return true;
  } catch {
    return false;
  }

  return false;
}

function buildDirectReleaseLink(url) {
  if (!url) return null;
  if (shouldIgnoreVkUtilityUrl(url)) return null;
  const directProvider = getProviderForUrl(url);
  if (directProvider) {
    return {
      label: PROVIDER_LABELS[directProvider.name] || directProvider.name,
      providerName: directProvider.name,
      url
    };
  }

  const sourceLabel = getSourceLabel(url);
  const sourceProviderName = mapSourceLabelToProviderName(sourceLabel, url);
  if (normalizeHost(url) === 'itunes.apple.com' || normalizeHost(url) === 'music.apple.com') {
    return {
      label: 'Apple Music',
      providerName: 'applemusic',
      url
    };
  }
  if (!sourceProviderName) return null;

  return {
    label: sourceLabel,
    providerName: sourceProviderName,
    url
  };
}

function buildReleaseLinks(sourceUrl, sourceLabel, platformLinks, directSourceUrls = []) {
  const releaseLinks = Array.isArray(platformLinks) ? platformLinks.slice() : [];

  for (const directSourceUrl of Array.isArray(directSourceUrls) ? directSourceUrls : []) {
    const directLink = buildDirectReleaseLink(directSourceUrl);
    if (directLink) releaseLinks.push(directLink);
  }

  const sourceLink = buildDirectReleaseLink(sourceUrl);
  if (sourceLink && ['vk', 'youtube', 'file'].includes(sourceLink.providerName)) {
    releaseLinks.push(sourceLink);
  }

  return sortLinksByDisplayOrder(dedupeLinks(releaseLinks));
}

function getSourceLabel(sourceUrl) {
  const sourceHost = normalizeHost(sourceUrl);

  if (sourceHost.endsWith('vk.com')) return 'VK';
  if (sourceHost.endsWith('bandcamp.com')) return 'Bandcamp';
  if (sourceHost === 'open.spotify.com') return 'Spotify';
  if (sourceHost.endsWith('soundcloud.com')) return 'SoundCloud';
  if (sourceHost === 'youtu.be' || sourceHost.endsWith('youtube.com')) return 'YouTube';
  if (sourceHost.endsWith('dropbox.com')) return 'Dropbox';

  return sourceHost;
}

function stripTrailingYearSuffix(value) {
  return String(value || '').replace(/\s*[\[(](?:19|20)\d{2}[\])]\s*$/, '').trim();
}

function parseArtistAndReleaseFromHeadline(value) {
  const headline = String(value || '').trim().replace(/\s+/g, ' ');
  if (!headline) return null;
  const match = headline.match(/^(.+?)\s+[–—-]\s+(.+)$/);
  if (!match) return null;
  const artistName = match[1].trim();
  const releaseTitle = stripTrailingYearSuffix(match[2]) || match[2].trim();
  if (!artistName || !releaseTitle) return null;
  return {
    artistName,
    releaseTitle
  };
}

function humanizeHashtag(value) {
  return String(value || '')
    .replace(/^#+/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
}

function inferVkArtistAndReleaseFromText(postLines, postText) {
  const titleLine = Array.isArray(postLines)
    ? postLines.find((line) => !shouldSkipVkTextLine(line))
    : '';
  const releaseTitle = String(titleLine || '')
    .replace(/\s*\((?:19|20)\d{2}[^)]*\)\s*$/, '')
    .trim();

  const genericTags = new Set([
    'ost',
    'soundtrack',
    'originalsoundtrack',
    'original_score',
    'drumnbass',
    'breaks',
    'neurofunk',
    'deeppast',
    'gamez',
    'gaming',
    'electronic',
    'experimental'
  ]);

  const releaseSlug = normalizeArtistSlug(releaseTitle);
  const hashtagCandidates = [...String(postText || '').matchAll(/#([a-z0-9_]+)/gi)]
    .map((match) => match[1])
    .filter(Boolean)
    .filter((tag) => !genericTags.has(tag.toLowerCase()))
    .filter((tag) => normalizeArtistSlug(tag) !== releaseSlug)
    .map((tag) => humanizeHashtag(tag));

  return {
    artistName: hashtagCandidates[0] || '',
    releaseTitle: releaseTitle || ''
  };
}

function hasSuspiciousReleaseText(value) {
  const text = String(value || '').trim();
  if (!text) return true;
  if (/开发票|哪里可以|徐州58同城|发票/i.test(text)) return true;
  if (/https?:\/\//i.test(text)) return true;
  if (/#/.test(text)) return true;
  return false;
}

function isPlausibleReleaseMetadata(artistName, releaseTitle) {
  const artist = String(artistName || '').trim();
  const release = String(releaseTitle || '').trim();
  if (!artist || !release) return false;
  if (artist.length > 120 || release.length > 180) return false;
  if (hasSuspiciousReleaseText(artist) || hasSuspiciousReleaseText(release)) return false;
  return true;
}

function shouldSkipVkTextLine(value) {
  return /^(label|buy|full|stream|download|dl|listen|genre|cat(?:alog)?|order|pre[\s-]?order)\s*:/i.test(String(value || '').trim());
}

function extractVkPostText(renderedHtml) {
  const wallTextMatch = renderedHtml.match(/<div class="vkitFeedShowMoreText__text--[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/span>/i);
  const candidateTexts = [
    wallTextMatch ? wallTextMatch[1] : '',
    pickMeta(renderedHtml, 'property', 'og:description'),
    pickMeta(renderedHtml, 'name', 'description'),
    pickTitle(renderedHtml)
  ];

  for (const candidateText of candidateTexts) {
    const plainText = htmlToPlainText(candidateText);
    if (!plainText) continue;
    if (/sign up to view|read and comment on posts/i.test(plainText)) continue;
    return plainText;
  }

  return '';
}

function decodeVkAwayUrl(href) {
  try {
    const parsedUrl = new URL(href, 'https://vk.com');
    if (parsedUrl.pathname !== '/away.php') return '';
    const target = parsedUrl.searchParams.get('to');
    return target ? decodeURIComponent(target) : '';
  } catch {
    return '';
  }
}

function extractVkOutgoingUrls(renderedHtml, postText) {
  const urls = [];
  const seen = new Set();

  function pushUrl(url) {
    const cleanedUrl = cleanUrl(url);
    if (!cleanedUrl || seen.has(cleanedUrl)) return;
    seen.add(cleanedUrl);
    urls.push(cleanedUrl);
  }

  for (const match of renderedHtml.matchAll(/href="([^"]+)"/g)) {
    const href = decodeHtml(match[1]);
    if (!href) continue;
    if (/^\/away\.php\?/i.test(href) || /vk\.com\/away\.php\?/i.test(href)) {
      const awayTarget = decodeVkAwayUrl(href);
      if (awayTarget) pushUrl(awayTarget);
    }
  }

  for (const match of String(postText || '').matchAll(/\bhttps?:\/\/[^\s<>"')]+/gi)) {
    pushUrl(match[0]);
  }

  for (const match of String(postText || '').matchAll(/\bvk\.cc\/[a-z0-9]+\b/gi)) {
    pushUrl(`http://${match[0]}`);
  }

  return urls;
}

async function parseVkSourcePage(sourceUrl) {
  const renderedHtml = await fetchRenderedHtml(sourceUrl);
  const postText = extractVkPostText(renderedHtml);
  const postLines = postText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const headline = postLines.find((line) => !shouldSkipVkTextLine(line)) || '';
  const parsedHeadline = parseArtistAndReleaseFromHeadline(headline) || inferVkArtistAndReleaseFromText(postLines, postText);
  const expandedUrls = [];
  const outgoingUrls = extractVkOutgoingUrls(renderedHtml, postText);

  for (const outgoingUrl of outgoingUrls) {
    const host = normalizeHost(outgoingUrl);
    if (host === 'vk.cc') {
      expandedUrls.push(await resolveUrlRedirectTarget(outgoingUrl));
      continue;
    }
    expandedUrls.push(outgoingUrl);
  }

  return {
    sourceUrl,
    renderedHtml,
    postText,
    artistName: isPlausibleReleaseMetadata(parsedHeadline?.artistName, parsedHeadline?.releaseTitle) ? parsedHeadline.artistName : '',
    releaseTitle: isPlausibleReleaseMetadata(parsedHeadline?.artistName, parsedHeadline?.releaseTitle) ? parsedHeadline.releaseTitle : '',
    linkedUrls: dedupeLinks(expandedUrls.map((url) => ({ url }))).map((link) => link.url)
  };
}

async function resolveImageSearchRelease(sourceUrl, imagePath) {
  const { ocrTexts, queries } = await extractImageSearchPayload(imagePath);

  for (const searchQuery of queries) {
    try {
      const candidateUrls = await collectSearchResults(searchQuery, false);
      const releaseUrl = pickBestReleaseUrl(candidateUrls);
      return {
        releaseUrl,
        ocrText: ocrTexts.join('\n\n'),
        searchQuery
      };
    } catch {
      continue;
    }
  }

  throw new Error('No usable music release URL was found in the search results');
}

function shouldResolveViaImageSearch(sourceUrl) {
  const directProvider = getProviderForUrl(sourceUrl);
  if (directProvider) return false;
  return true;
}

function extractProfileHandle(providerName, url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    const segments = parsedUrl.pathname.split('/').filter(Boolean);

    if (providerName === 'instagram') {
      const blocked = new Set(['p', 'reel', 'tv', 'stories', 'explore', 'accounts', 'about', 'developer', 'directory']);
      return segments[0] && !blocked.has(segments[0]) ? normalizeArtistSlug(segments[0]) : '';
    }

    if (providerName === 'youtube') {
      if (!host.endsWith('youtube.com')) return '';
      if (!segments.length) return '';
      if (segments[0].startsWith('@')) return normalizeArtistSlug(segments[0].slice(1));
      if (['c', 'user'].includes(segments[0]) && segments[1]) return normalizeArtistSlug(segments[1]);
      return '';
    }

    if (providerName === 'soundcloud') {
      const blocked = new Set(['discover', 'search', 'charts', 'stream', 'upload', 'you', 'settings', 'stations', 'genres', 'tags']);
      return segments[0] && !blocked.has(segments[0]) ? normalizeArtistSlug(segments[0]) : '';
    }

    if (providerName === 'bandcamp') {
      if (!host.endsWith('bandcamp.com')) return '';
      return normalizeArtistSlug(host.replace(/\.bandcamp\.com$/i, ''));
    }

    if (providerName === 'x') {
      const blocked = new Set(['home', 'explore', 'search', 'intent', 'share', 'i', 'hashtag']);
      return segments[0] && !blocked.has(segments[0]) ? normalizeArtistSlug(segments[0]) : '';
    }

    if (providerName === 'facebook') {
      if (parsedUrl.searchParams.get('id')) return '';
      const blocked = new Set(['pages', 'watch', 'groups', 'events', 'marketplace', 'help', 'login', 'share', 'photo']);
      return segments[0] && !blocked.has(segments[0]) ? normalizeArtistSlug(segments[0]) : '';
    }

    if (providerName === 'spotify') {
      if (segments[0] === 'artist' && segments[1]) return normalizeArtistSlug(segments[1]);
      return '';
    }
  } catch {
    return '';
  }

  return '';
}

function isCandidateUrlForSocialPlatform(url, platform) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    const pathname = parsedUrl.pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (platform.providerName === 'instagram') {
      const firstSegment = pathname.split('/').filter(Boolean)[0] || '';
      return host.endsWith('instagram.com') && !!extractProfileHandle('instagram', url) && firstSegment !== 'p';
    }

    if (platform.providerName === 'spotify') {
      return host === 'open.spotify.com' && segments[0] === 'artist' && !!segments[1];
    }

    if (platform.providerName === 'soundcloud') {
      return host.endsWith('soundcloud.com') && !!extractProfileHandle('soundcloud', url) && segments.length === 1;
    }

    if (platform.providerName === 'bandcamp') {
      if (!host.endsWith('bandcamp.com') || host.startsWith('daily.')) return false;
      return segments.length === 0 || (segments.length === 1 && segments[0] === 'music');
    }

    if (platform.providerName === 'youtube') {
      return host.endsWith('youtube.com') && (
        pathname.startsWith('/@') ||
        /^\/(channel|c|user)\//i.test(pathname)
      );
    }

    if (platform.providerName === 'x') {
      return (host === 'x.com' || host === 'twitter.com') && !!extractProfileHandle('x', url);
    }

    if (platform.providerName === 'facebook') {
      return host.endsWith('facebook.com') && !/\/(posts|photos|videos|permalink|events|groups)\//i.test(pathname);
    }
  } catch {
    return false;
  }

  return false;
}

function normalizeArtistSocialUrl(providerName, url) {
  const cleanedUrl = cleanUrl(url);
  if (!cleanedUrl) return '';

  try {
    const parsedUrl = new URL(cleanedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    const segments = parsedUrl.pathname.split('/').filter(Boolean);

    if (providerName === 'bandcamp') {
      return host.endsWith('bandcamp.com') ? `https://${host}/` : cleanedUrl;
    }

    if (providerName === 'soundcloud') {
      return host.endsWith('soundcloud.com') && segments[0]
        ? `https://soundcloud.com/${segments[0]}`
        : cleanedUrl;
    }

    if (providerName === 'spotify') {
      return host === 'open.spotify.com' && segments[0] === 'artist' && segments[1]
        ? `https://open.spotify.com/artist/${segments[1]}`
        : cleanedUrl;
    }

    if (providerName === 'youtube') {
      if (!host.endsWith('youtube.com')) return cleanedUrl;
      if (segments[0] && segments[0].startsWith('@')) return `https://www.youtube.com/${segments[0]}`;
      if (['channel', 'c', 'user'].includes(segments[0]) && segments[1]) return `https://www.youtube.com/${segments[0]}/${segments[1]}`;
      return cleanedUrl;
    }
  } catch {
    return cleanedUrl;
  }

  return cleanedUrl;
}

function buildArtistSocialQueries(platform, artistName) {
  return [
    `site:${platform.searchHost} "${artistName}"`,
    `"${artistName}" ${platform.label}`,
    `${artistName} ${platform.label}`
  ];
}

function normalizeSocialPageTitle(title) {
  return String(title || '')
    .replace(/\s*[|:-]\s*(Instagram|YouTube|Spotify|SoundCloud|Facebook|X|Twitter).*$/i, '')
    .replace(/\s+\/\s+.*$/i, '')
    .trim();
}

function computeArtistHandleMatchScore(handle, artistName) {
  const artistSlug = normalizeArtistSlug(artistName);
  if (!handle || !artistSlug) return 0;
  if (handle === artistSlug) return 1;
  return Math.max(
    computeStringMatch(handle, artistSlug),
    handle.includes(artistSlug) || artistSlug.includes(handle) ? 0.92 : 0
  );
}

function usesReadableSocialHandle(providerName) {
  return ['instagram', 'soundcloud', 'bandcamp', 'youtube', 'x', 'facebook'].includes(providerName);
}

async function fetchArtistSocialTitleScore(url, artistName) {
  try {
    const html = await fetchText(url);
    const title = normalizeSocialPageTitle(pickTitle(html));
    return computeStringMatch(artistName, title);
  } catch {
    return 0;
  }
}

function buildGuessedArtistSocialUrls(platform, artistName) {
  const artistSlug = normalizeArtistSlug(artistName);
  if (!artistSlug || artistSlug.length < 3) return [];

  if (platform.providerName === 'instagram') {
    return [`https://www.instagram.com/${artistSlug}/`];
  }

  if (platform.providerName === 'soundcloud') {
    return [`https://soundcloud.com/${artistSlug}`];
  }

  if (platform.providerName === 'bandcamp') {
    return [`https://${artistSlug}.bandcamp.com/`];
  }

  if (platform.providerName === 'youtube') {
    return [`https://www.youtube.com/@${artistSlug}`];
  }

  return [];
}

async function verifyGuessedArtistSocial(url, platform, artistName) {
  return scoreArtistSocialCandidate(url, platform, artistName);
}

async function scoreArtistSocialCandidate(url, platform, artistName) {
  const handle = extractProfileHandle(platform.providerName, url);
  const handleScore = computeArtistHandleMatchScore(handle, artistName);

  if (usesReadableSocialHandle(platform.providerName) && handle && handleScore < MIN_CONFIRMED_SOCIAL_MATCH_SCORE) {
    return 0;
  }

  const titleScore = await fetchArtistSocialTitleScore(url, artistName);
  if (titleScore < MIN_CONFIRMED_SOCIAL_MATCH_SCORE) return 0;

  return Math.max(handleScore, titleScore);
}

function shouldAttemptBroadSocialSearch(artistName) {
  const normalized = String(artistName || '');
  if (!normalized || normalizeArtistSlug(normalized).length < 3) return false;
  if ((normalized.match(/,/g) || []).length >= 2) return false;
  if (/\b(ft|feat|featuring|vs)\b/i.test(normalized)) return false;
  return true;
}

function addArtistSearchAlias(aliasSet, alias) {
  const cleanedAlias = String(alias || '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    .trim();

  if (!cleanedAlias || normalizeArtistSlug(cleanedAlias).length < 3) return;
  aliasSet.add(cleanedAlias);
}

function buildArtistSearchAliases(artistName) {
  const rawArtistName = String(artistName || '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const aliasSet = new Set();

  addArtistSearchAlias(aliasSet, rawArtistName);
  addArtistSearchAlias(aliasSet, rawArtistName.replace(/\([^)]*\)/g, ' '));

  for (const match of rawArtistName.matchAll(/\(([^)]+)\)/g)) {
    if (/[,&+/]/.test(match[1]) || /\b(?:x|with|and|ft|feat|featuring|vs)\b/i.test(match[1])) continue;
    addArtistSearchAlias(aliasSet, match[1]);
  }

  return Array.from(aliasSet);
}

async function searchArtistSocial(platform, artistName) {
  const cacheKey = `${platform.providerName}::${normalizeArtistSlug(artistName)}`;
  if (!socialSearchCache.has(cacheKey)) {
    socialSearchCache.set(
      cacheKey,
      (async () => {
        const searchQueries = buildArtistSocialQueries(platform, artistName);
        const seen = new Set();
        const candidateUrls = [];
        const maxQueries = CORE_ARTIST_SOCIAL_SEARCHES.some((item) => item.providerName === platform.providerName) ? 2 : 1;
        const maxCandidates = CORE_ARTIST_SOCIAL_SEARCHES.some((item) => item.providerName === platform.providerName) ? 3 : 2;

        for (let queryIndex = 0; queryIndex < searchQueries.length; queryIndex += 1) {
          if (queryIndex >= maxQueries) break;
          const searchQuery = searchQueries[queryIndex];
          const searchResults = await collectSearchResults(searchQuery);
          for (const resultUrl of searchResults) {
            if (!isCandidateUrlForSocialPlatform(resultUrl, platform)) continue;
            if (seen.has(resultUrl)) continue;
            seen.add(resultUrl);
            candidateUrls.push(resultUrl);
            if (candidateUrls.length >= maxCandidates) break;
          }
          if (candidateUrls.length >= maxCandidates) break;
        }

        let bestMatch = null;

        for (let i = 0; i < candidateUrls.length; i += 1) {
          const candidateUrl = candidateUrls[i];
          const score = await scoreArtistSocialCandidate(candidateUrl, platform, artistName);
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              url: candidateUrl,
              score
            };
          }
        }

        if (bestMatch && bestMatch.score >= MIN_CONFIRMED_SOCIAL_MATCH_SCORE) {
          return {
            label: platform.label,
            url: normalizeArtistSocialUrl(platform.providerName, bestMatch.url)
          };
        }

        const guessedUrls = buildGuessedArtistSocialUrls(platform, artistName);
        for (const guessedUrl of guessedUrls) {
          const guessedScore = await verifyGuessedArtistSocial(guessedUrl, platform, artistName);
          if (guessedScore < MIN_CONFIRMED_SOCIAL_MATCH_SCORE) continue;
          return {
            label: platform.label,
            url: normalizeArtistSocialUrl(platform.providerName, guessedUrl)
          };
        }

        return null;
      })()
    );
  }

  try {
    return await socialSearchCache.get(cacheKey);
  } catch (error) {
    socialSearchCache.delete(cacheKey);
    throw error;
  }
}

async function collectArtistSocialLinks(artistName, primarySocialLinks, releaseLinks) {
  let collectedLinks = Array.isArray(primarySocialLinks) ? primarySocialLinks.slice() : [];

  const candidateReleaseLinks = Array.isArray(releaseLinks) ? releaseLinks : [];
  for (const releaseLink of candidateReleaseLinks) {
    if (!releaseLink?.url) continue;
    if (!['bandcamp', 'spotify', 'soundcloud', 'youtube'].includes(releaseLink.providerName)) continue;
    try {
      const parsedRelease = await parseReleaseWithProvider(releaseLink.url);
      collectedLinks = collectedLinks.concat(parsedRelease.socialLinks || []);
    } catch {
      continue;
    }
  }

  collectedLinks = sortSocialLinks(collectedLinks);

  if (!shouldAttemptBroadSocialSearch(artistName)) return collectedLinks;

  const existingProviders = new Set(collectedLinks.map((link) => getSocialProviderName(link)));

  for (const platform of CORE_ARTIST_SOCIAL_SEARCHES) {
    if (existingProviders.has(platform.providerName)) continue;
    try {
      const socialLink = await searchArtistSocial(platform, artistName);
      if (!socialLink) continue;
      collectedLinks = sortSocialLinks(collectedLinks.concat([socialLink]));
      existingProviders.add(platform.providerName);
    } catch {
      continue;
    }
  }

  for (const platform of EXTENDED_ARTIST_SOCIAL_SEARCHES) {
    if (existingProviders.has(platform.providerName)) continue;
    try {
      const socialLink = await searchArtistSocial(platform, artistName);
      if (!socialLink) continue;
      collectedLinks = sortSocialLinks(collectedLinks.concat([socialLink]));
      existingProviders.add(platform.providerName);
    } catch {
      continue;
    }
  }

  const artistAliases = buildArtistSearchAliases(artistName)
    .filter((alias) => normalizeArtistSlug(alias) !== normalizeArtistSlug(artistName));

  for (const artistAlias of artistAliases) {
    for (const platform of CORE_ARTIST_SOCIAL_SEARCHES.concat(EXTENDED_ARTIST_SOCIAL_SEARCHES)) {
      if (existingProviders.has(platform.providerName)) continue;
      try {
        const socialLink = await searchArtistSocial(platform, artistAlias);
        if (!socialLink) continue;
        collectedLinks = sortSocialLinks(collectedLinks.concat([socialLink]));
        existingProviders.add(platform.providerName);
      } catch {
        continue;
      }
    }
  }

  return collectedLinks;
}

async function refreshSocialLinksRange(fromIndex, toIndex, concurrency, existingDetails) {
  const resultsByIndex = {};
  const errorsByIndex = {};
  let nextIndex = fromIndex;

  async function worker() {
    while (true) {
      const itemIndex = nextIndex;
      nextIndex += 1;
      if (itemIndex > toIndex) return;

      const existingDetail = existingDetails[String(itemIndex)];
      if (!existingDetail) continue;

      try {
        const releaseLinks = Array.isArray(existingDetail.releaseLinks) ? existingDetail.releaseLinks.slice() : [];
        if (!releaseLinks.length && existingDetail.releaseUrl) {
          const provider = getProviderForUrl(existingDetail.releaseUrl);
          if (provider?.providerName) {
            releaseLinks.push({
              label: PROVIDER_LABELS[provider.providerName] || existingDetail.sourceLabel || provider.providerName,
              providerName: provider.providerName,
              url: existingDetail.releaseUrl
            });
          }
        }

        const socialLinks = await collectArtistSocialLinks(existingDetail.artistName, [], releaseLinks);
        resultsByIndex[String(itemIndex)] = applyManualDetailPatch(itemIndex, {
          ...existingDetail,
          socialLinks
        });
        console.error(`[${itemIndex}] socials: ${existingDetail.artistName} (${socialLinks.length})`);
      } catch (error) {
        errorsByIndex[String(itemIndex)] = error.message;
        console.error(`[${itemIndex}] socials error: ${error.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker())
  );

  return {
    resultsByIndex,
    errorsByIndex
  };
}

async function refreshSocialLinksIndexes(indexes, concurrency, existingDetails) {
  const resultsByIndex = {};
  const errorsByIndex = {};
  const queue = Array.from(new Set(indexes.map((index) => Number(index)))).filter((index) => index > 0);
  let nextPosition = 0;

  async function worker() {
    while (true) {
      const queuePosition = nextPosition;
      nextPosition += 1;
      if (queuePosition >= queue.length) return;
      const itemIndex = queue[queuePosition];

      const existingDetail = existingDetails[String(itemIndex)];
      if (!existingDetail) continue;

      try {
        const releaseLinks = Array.isArray(existingDetail.releaseLinks) ? existingDetail.releaseLinks.slice() : [];
        if (!releaseLinks.length && existingDetail.releaseUrl) {
          const provider = getProviderForUrl(existingDetail.releaseUrl);
          if (provider?.providerName) {
            releaseLinks.push({
              label: PROVIDER_LABELS[provider.providerName] || existingDetail.sourceLabel || provider.providerName,
              providerName: provider.providerName,
              url: existingDetail.releaseUrl
            });
          }
        }

        const socialLinks = await collectArtistSocialLinks(existingDetail.artistName, [], releaseLinks);
        resultsByIndex[String(itemIndex)] = applyManualDetailPatch(itemIndex, {
          ...existingDetail,
          socialLinks
        });
        console.error(`[${itemIndex}] socials: ${existingDetail.artistName} (${socialLinks.length})`);
      } catch (error) {
        errorsByIndex[String(itemIndex)] = error.message;
        console.error(`[${itemIndex}] socials error: ${error.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker())
  );

  return {
    resultsByIndex,
    errorsByIndex
  };
}

async function chooseSourceReleaseUrl(sourceDetails, fallbackUrl) {
  const candidateUrls = Array.isArray(sourceDetails?.linkedUrls)
    ? sourceDetails.linkedUrls.filter((url) => !!buildDirectReleaseLink(url))
    : [];

  if (!candidateUrls.length) return cleanUrl(fallbackUrl);

  let bestMatch = null;

  if (sourceDetails?.artistName && sourceDetails?.releaseTitle) {
    for (const candidateUrl of candidateUrls) {
      const directProvider = getProviderForUrl(candidateUrl);
      if (!directProvider) continue;
      try {
        const parsedCandidate = await parseReleaseWithProvider(candidateUrl);
        const matchScore = computeReleaseMatchScore(
          sourceDetails.artistName,
          sourceDetails.releaseTitle,
          parsedCandidate.artistName,
          parsedCandidate.releaseTitle
        );

        if (!bestMatch || matchScore > bestMatch.score || (matchScore === bestMatch.score && scoreReleaseCandidate(candidateUrl) > bestMatch.providerScore)) {
          bestMatch = {
            url: candidateUrl,
            score: matchScore,
            providerScore: scoreReleaseCandidate(candidateUrl)
          };
        }
      } catch {
        continue;
      }
    }
  }

  if (bestMatch && bestMatch.score >= 60) return bestMatch.url;

  try {
    return pickBestReleaseUrl(candidateUrls);
  } catch {
    return cleanUrl(fallbackUrl);
  }
}

async function resolveSourceToRelease(sourceUrl, imagePath) {
  if (!shouldResolveViaImageSearch(sourceUrl)) {
    return {
      releaseUrl: sourceUrl,
      ocrText: '',
      searchQuery: '',
      sourceDetails: null
    };
  }

  if (normalizeHost(sourceUrl).endsWith('vk.com')) {
    try {
      const vkSourceDetails = await parseVkSourcePage(sourceUrl);
      const releaseUrl = await chooseSourceReleaseUrl(vkSourceDetails, sourceUrl);
      if (vkSourceDetails.artistName || vkSourceDetails.releaseTitle || vkSourceDetails.linkedUrls.length) {
        return {
          releaseUrl,
          ocrText: vkSourceDetails.postText,
          searchQuery: '',
          sourceDetails: vkSourceDetails
        };
      }
    } catch {
      const sourceHtml = await fetchText(sourceUrl);
      if (!isVkFallbackPage(sourceHtml)) {
        return {
          releaseUrl: sourceUrl,
          ocrText: '',
          searchQuery: '',
          sourceDetails: null
        };
      }
    }

    const sourceHtml = await fetchText(sourceUrl);
    if (!isVkFallbackPage(sourceHtml)) {
      return {
        releaseUrl: sourceUrl,
        ocrText: '',
        searchQuery: '',
        sourceDetails: null
      };
    }
  }

  const resolvedRelease = await resolveImageSearchRelease(sourceUrl, imagePath);
  return {
    ...resolvedRelease,
    sourceDetails: null
  };
}

async function parseItem(itemIndex) {
  const indexHtml = await fs.readFile(INDEX_PATH, 'utf8');
  const { sourceUrl, imagePath } = pickAnchor(indexHtml, itemIndex);
  const releaseResolution = await resolveSourceToRelease(sourceUrl, imagePath);
  let releaseDetails = null;

  try {
    releaseDetails = await parseReleaseWithProvider(releaseResolution.releaseUrl);
  } catch (error) {
    if (!releaseResolution.sourceDetails?.artistName || !releaseResolution.sourceDetails?.releaseTitle) {
      throw error;
    }

    releaseDetails = {
      provider: 'vk',
      artistName: releaseResolution.sourceDetails.artistName,
      releaseTitle: releaseResolution.sourceDetails.releaseTitle,
      socialLinks: []
    };
  }

  const seededReleaseLinks = (releaseResolution.sourceDetails?.linkedUrls || [])
    .map((url) => buildDirectReleaseLink(url))
    .filter(Boolean);
  const platformLinks = await findPlatformLinks(
    releaseResolution.releaseUrl,
    releaseDetails.provider,
    releaseDetails.artistName,
    releaseDetails.releaseTitle,
    seededReleaseLinks
  );
  const sourceLabel = getSourceLabel(sourceUrl);
  const releaseLinks = buildReleaseLinks(
    sourceUrl,
    sourceLabel,
    platformLinks,
    releaseResolution.sourceDetails?.linkedUrls || []
  );
  const socialLinks = await collectArtistSocialLinks(
    releaseDetails.artistName,
    releaseDetails.socialLinks,
    releaseLinks
  );

  return {
    index: String(itemIndex),
    sourceUrl,
    imagePath,
    releaseUrl: releaseResolution.releaseUrl,
    provider: releaseDetails.provider,
    artistName: releaseDetails.artistName,
    releaseTitle: releaseDetails.releaseTitle,
    sourceLabel,
    platformLinks,
    releaseLinks,
    socialLinks,
    debug: {
      searchQuery: releaseResolution.searchQuery,
      ocrText: releaseResolution.ocrText
    }
  };
}

function formatResultForIndexHtml(result) {
  return applyManualDetailPatch(result.index, {
    artistName: result.artistName,
    releaseTitle: result.releaseTitle,
    releaseUrl: result.releaseUrl,
    sourceUrl: result.sourceUrl,
    sourceLabel: result.sourceLabel,
    provider: result.provider,
    releaseLinks: result.releaseLinks,
    socialLinks: result.socialLinks
  });
}

function extractPlainReleaseDetailsObject(html) {
  const match = html.match(/const plainReleaseDetailsByIndex = (\{[\s\S]*?\n\s*\});/);
  if (!match) {
    throw new Error('Could not find plainReleaseDetailsByIndex in index.html');
  }

  return vm.runInNewContext(`(${match[1]})`);
}

function sortNumericObjectKeys(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort((left, right) => Number(left) - Number(right))
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

function replacePlainReleaseDetailsBlock(html, detailsByIndex) {
  const serializedDetails = JSON.stringify(sortNumericObjectKeys(detailsByIndex), null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `      ${line}`))
    .join('\n');

  const replacement = `      const plainReleaseDetailsByIndex = ${serializedDetails};`;

  return html.replace(
    /      const plainReleaseDetailsByIndex = \{[\s\S]*?\n      \};(?=\n      const tiles = Array\.from\(releases\.querySelectorAll\('a'\)\);)/,
    replacement
  );
}

async function parseRange(fromIndex, toIndex, concurrency) {
  const resultsByIndex = {};
  const errorsByIndex = {};
  let nextIndex = fromIndex;

  async function worker() {
    while (true) {
      const itemIndex = nextIndex;
      nextIndex += 1;
      if (itemIndex > toIndex) return;

      try {
        const parsedItem = await parseItem(itemIndex);
        resultsByIndex[String(itemIndex)] = formatResultForIndexHtml(parsedItem);
        console.error(`[${itemIndex}] ok: ${parsedItem.artistName} - ${parsedItem.releaseTitle}`);
      } catch (error) {
        errorsByIndex[String(itemIndex)] = error.message;
        console.error(`[${itemIndex}] error: ${error.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker())
  );

  return {
    resultsByIndex,
    errorsByIndex
  };
}

function parseIndexList(value) {
  return String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

async function parseIndexes(indexes, concurrency) {
  const resultsByIndex = {};
  const errorsByIndex = {};
  const queue = Array.from(new Set(indexes.map((index) => Number(index)))).filter((index) => index > 0);
  let nextPosition = 0;

  async function worker() {
    while (true) {
      const queuePosition = nextPosition;
      nextPosition += 1;
      if (queuePosition >= queue.length) return;
      const itemIndex = queue[queuePosition];

      try {
        const parsedItem = await parseItem(itemIndex);
        resultsByIndex[String(itemIndex)] = formatResultForIndexHtml(parsedItem);
        console.error(`[${itemIndex}] ok: ${parsedItem.artistName} - ${parsedItem.releaseTitle}`);
      } catch (error) {
        errorsByIndex[String(itemIndex)] = error.message;
        console.error(`[${itemIndex}] error: ${error.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker())
  );

  return {
    resultsByIndex,
    errorsByIndex
  };
}

async function updateIndexHtmlWithRange(fromIndex, toIndex, concurrency) {
  const html = await fs.readFile(INDEX_PATH, 'utf8');
  const existingDetails = extractPlainReleaseDetailsObject(html);
  const { resultsByIndex, errorsByIndex } = await parseRange(fromIndex, toIndex, concurrency);
  const nextDetails = { ...existingDetails, ...resultsByIndex };
  const updatedHtml = replacePlainReleaseDetailsBlock(html, nextDetails);

  await fs.writeFile(INDEX_PATH, updatedHtml, 'utf8');

  return {
    updatedCount: Object.keys(resultsByIndex).length,
    errorCount: Object.keys(errorsByIndex).length,
    errorsByIndex
  };
}

async function updateIndexHtmlWithIndexes(indexes, concurrency) {
  const html = await fs.readFile(INDEX_PATH, 'utf8');
  const existingDetails = extractPlainReleaseDetailsObject(html);
  const { resultsByIndex, errorsByIndex } = await parseIndexes(indexes, concurrency);
  const nextDetails = { ...existingDetails, ...resultsByIndex };
  const updatedHtml = replacePlainReleaseDetailsBlock(html, nextDetails);

  await fs.writeFile(INDEX_PATH, updatedHtml, 'utf8');

  return {
    updatedCount: Object.keys(resultsByIndex).length,
    errorCount: Object.keys(errorsByIndex).length,
    errorsByIndex
  };
}

async function updateIndexHtmlSocialsWithRange(fromIndex, toIndex, concurrency) {
  const html = await fs.readFile(INDEX_PATH, 'utf8');
  const existingDetails = extractPlainReleaseDetailsObject(html);
  const { resultsByIndex, errorsByIndex } = await refreshSocialLinksRange(fromIndex, toIndex, concurrency, existingDetails);
  const nextDetails = { ...existingDetails, ...resultsByIndex };
  const updatedHtml = replacePlainReleaseDetailsBlock(html, nextDetails);

  await fs.writeFile(INDEX_PATH, updatedHtml, 'utf8');

  return {
    updatedCount: Object.keys(resultsByIndex).length,
    errorCount: Object.keys(errorsByIndex).length,
    errorsByIndex
  };
}

async function updateIndexHtmlSocialsWithIndexes(indexes, concurrency) {
  const html = await fs.readFile(INDEX_PATH, 'utf8');
  const existingDetails = extractPlainReleaseDetailsObject(html);
  const { resultsByIndex, errorsByIndex } = await refreshSocialLinksIndexes(indexes, concurrency, existingDetails);
  const nextDetails = { ...existingDetails, ...resultsByIndex };
  const updatedHtml = replacePlainReleaseDetailsBlock(html, nextDetails);

  await fs.writeFile(INDEX_PATH, updatedHtml, 'utf8');

  return {
    updatedCount: Object.keys(resultsByIndex).length,
    errorCount: Object.keys(errorsByIndex).length,
    errorsByIndex
  };
}

async function loadReleaseDataCatalog() {
  const rawCatalog = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'));
  const items = Array.isArray(rawCatalog?.items) ? rawCatalog.items : [];
  const itemsByIndex = {};

  for (const item of items) {
    if (!item?.index) continue;
    itemsByIndex[String(item.index)] = item;
  }

  return {
    rawCatalog,
    itemsByIndex
  };
}

async function writeReleaseDataCatalog(rawCatalog) {
  const payload = {
    ...rawCatalog,
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(DATA_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function isVkUrl(url) {
  return normalizeHost(url) === 'vk.com';
}

function isProblematicReleaseUrl(url) {
  const host = normalizeHost(url);
  return !host || host === 'vk.com' || host === 'itunes.apple.com';
}

function hasPlaceholderMetadata(detail) {
  return /^(original vk source|untitled release)$/i.test(String(detail?.releaseTitle || '')) || /^Release #/i.test(String(detail?.artistName || ''));
}

function normalizeExistingReleaseLinks(links) {
  return sortLinksByDisplayOrder(
    dedupeLinks(
      (Array.isArray(links) ? links : [])
        .map((link) => {
          if (!link?.url) return null;
          const providerName = getReleaseLinkProviderName(link) || mapSourceLabelToProviderName(link.label, link.url);
          return {
            label: PROVIDER_LABELS[providerName] || link.label || 'Link',
            providerName: providerName || link.providerName,
            url: cleanUrl(link.url)
          };
        })
        .filter(Boolean)
    )
  );
}

function normalizeExistingSocialLinks(links) {
  return sortSocialLinks(
    (Array.isArray(links) ? links : [])
      .map((link) => {
        if (!link?.url || !link?.label) return null;
        const providerName = getSocialProviderName(link);
        return {
          label: PROVIDER_LABELS[providerName] || (link.label === 'Twitter' ? 'X' : link.label),
          url: cleanUrl(link.url)
        };
      })
      .filter(Boolean)
  );
}

function choosePrimaryReleaseUrl(currentReleaseUrl, releaseLinks) {
  const directReleaseCandidates = [];
  const fallbackCandidates = [];
  const seenUrls = new Set();

  function pushCandidate(url) {
    const cleanedUrl = cleanUrl(url);
    if (!cleanedUrl || isVkUrl(cleanedUrl) || seenUrls.has(cleanedUrl)) return;
    seenUrls.add(cleanedUrl);
    fallbackCandidates.push(cleanedUrl);
    if (getProviderForUrl(cleanedUrl)) {
      directReleaseCandidates.push(cleanedUrl);
    }
  }

  if (currentReleaseUrl && !isProblematicReleaseUrl(currentReleaseUrl)) {
    pushCandidate(currentReleaseUrl);
  }

  for (const link of Array.isArray(releaseLinks) ? releaseLinks : []) {
    if (!link?.url) continue;
    pushCandidate(link.url);
  }

  if (directReleaseCandidates.length) {
    try {
      return pickBestReleaseUrl(directReleaseCandidates);
    } catch {
      return directReleaseCandidates[0];
    }
  }

  return fallbackCandidates[0] || cleanUrl(currentReleaseUrl);
}

async function repairExistingCatalogDetail(existingDetail) {
  const baseDetail = {
    ...existingDetail,
    releaseLinks: normalizeExistingReleaseLinks(existingDetail.releaseLinks),
    socialLinks: normalizeExistingSocialLinks(existingDetail.socialLinks)
  };
  const sourceUrl = cleanUrl(baseDetail.sourceUrl || '');
  const sourceLabel = baseDetail.sourceLabel || getSourceLabel(sourceUrl || baseDetail.releaseUrl);
  let artistName = baseDetail.artistName;
  let releaseTitle = baseDetail.releaseTitle;
  let releaseUrl = cleanUrl(baseDetail.releaseUrl || '');
  let providerName = (!isProblematicReleaseUrl(releaseUrl) && getProviderForUrl(releaseUrl)?.name) || String(baseDetail.provider || '').toLowerCase();
  let releaseLinks = normalizeExistingReleaseLinks(baseDetail.releaseLinks);
  const nonVkSeedLinks = releaseLinks.filter((link) => getReleaseLinkProviderName(link) && getReleaseLinkProviderName(link) !== 'vk');

  if (hasPlaceholderMetadata(baseDetail) && releaseUrl && !isProblematicReleaseUrl(releaseUrl) && getProviderForUrl(releaseUrl)) {
    try {
      const parsedRelease = await parseReleaseWithProvider(releaseUrl);
      artistName = parsedRelease.artistName;
      releaseTitle = parsedRelease.releaseTitle;
      providerName = parsedRelease.provider || providerName;
    } catch {
      // Keep the manually supplied metadata when the existing release URL cannot be parsed.
    }
  }

  const searchedReleaseLinks = await findPlatformLinks(
    isProblematicReleaseUrl(releaseUrl) ? '' : releaseUrl,
    isProblematicReleaseUrl(releaseUrl) ? '' : providerName,
    artistName,
    releaseTitle,
    nonVkSeedLinks
  );

  releaseLinks = mergeReleaseLinks(releaseLinks, searchedReleaseLinks);

  if (releaseLinks.some((link) => getReleaseLinkProviderName(link) && getReleaseLinkProviderName(link) !== 'vk')) {
    releaseLinks = releaseLinks.filter((link) => getReleaseLinkProviderName(link) !== 'vk');
  }

  const nextPrimaryReleaseUrl = choosePrimaryReleaseUrl(releaseUrl, releaseLinks);
  if (nextPrimaryReleaseUrl) {
    releaseUrl = nextPrimaryReleaseUrl;
    providerName = getProviderForUrl(releaseUrl)?.name || providerName;
  }

  if (releaseUrl && getProviderForUrl(releaseUrl)) {
    try {
      const parsedRelease = await parseReleaseWithProvider(releaseUrl);
      if (hasPlaceholderMetadata(baseDetail) || isProblematicReleaseUrl(existingDetail.releaseUrl)) {
        artistName = parsedRelease.artistName;
        releaseTitle = parsedRelease.releaseTitle;
      }
      providerName = parsedRelease.provider || providerName;
    } catch {
      // Keep the best-known metadata if the promoted release URL cannot be parsed.
    }
  }

  const confirmedReleaseLinks = releaseLinks.filter((link) => {
    const providerName = getReleaseLinkProviderName(link);
    return providerName && providerName !== 'vk';
  });
  const socialLinks = confirmedReleaseLinks.length
    ? await collectArtistSocialLinks(
        artistName,
        normalizeExistingSocialLinks(baseDetail.socialLinks),
        confirmedReleaseLinks
      )
    : normalizeExistingSocialLinks(baseDetail.socialLinks);

  return {
    ...baseDetail,
    artistName,
    releaseTitle,
    releaseUrl,
    sourceUrl,
    sourceLabel,
    provider: providerName,
    releaseLinks,
    socialLinks
  };
}

async function repairReleaseDataIndexes(indexes, concurrency) {
  const { rawCatalog, itemsByIndex } = await loadReleaseDataCatalog();
  const resultsByIndex = {};
  const errorsByIndex = {};
  const queue = Array.from(new Set(indexes.map((index) => Number(index)))).filter((index) => index > 0);
  let nextPosition = 0;

  async function worker() {
    while (true) {
      const queuePosition = nextPosition;
      nextPosition += 1;
      if (queuePosition >= queue.length) return;
      const itemIndex = queue[queuePosition];
      const existingDetail = itemsByIndex[String(itemIndex)];

      if (!existingDetail) continue;

      try {
        const repairedDetail = await repairExistingCatalogDetail(existingDetail);
        resultsByIndex[String(itemIndex)] = repairedDetail;
        console.error(`[${itemIndex}] repaired: ${repairedDetail.artistName} - ${repairedDetail.releaseTitle}`);
      } catch (error) {
        errorsByIndex[String(itemIndex)] = error.message;
        console.error(`[${itemIndex}] repair error: ${error.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker())
  );

  rawCatalog.items = rawCatalog.items.map((item) => resultsByIndex[String(item.index)] || item);
  await writeReleaseDataCatalog(rawCatalog);

  return {
    updatedCount: Object.keys(resultsByIndex).length,
    errorCount: Object.keys(errorsByIndex).length,
    errorsByIndex
  };
}

async function repairReleaseDataRange(fromIndex, toIndex, concurrency) {
  const indexes = [];
  for (let itemIndex = fromIndex; itemIndex <= toIndex; itemIndex += 1) {
    indexes.push(itemIndex);
  }

  return repairReleaseDataIndexes(indexes, concurrency);
}

async function main() {
  const explicitIndexes = parseIndexList(getArg('--indexes', ''));
  const rangeFrom = Number(getArg('--from', '0'));
  const rangeToArg = Number(getArg('--to', '0'));
  const rangeCount = Number(getArg('--count', '0'));

  if (explicitIndexes.length) {
    const concurrency = Number(getArg('--concurrency', '3'));

    if (hasFlag('--repair-release-data')) {
      const summary = await repairReleaseDataIndexes(explicitIndexes, concurrency);
      process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
      return;
    }

    if (hasFlag('--update-index-html')) {
      if (hasFlag('--refresh-socials')) {
        const summary = await updateIndexHtmlSocialsWithIndexes(explicitIndexes, concurrency);
        process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
        return;
      }
      const summary = await updateIndexHtmlWithIndexes(explicitIndexes, concurrency);
      process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
      return;
    }

    const results = await parseIndexes(explicitIndexes, concurrency);
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
    return;
  }

  if (rangeFrom > 0 || rangeToArg > 0 || rangeCount > 0) {
    const fromIndex = rangeFrom > 0 ? rangeFrom : 1;
    const toIndex = rangeToArg > 0 ? rangeToArg : fromIndex + Math.max(rangeCount, 1) - 1;
    const concurrency = Number(getArg('--concurrency', '3'));

    if (hasFlag('--repair-release-data')) {
      const summary = await repairReleaseDataRange(fromIndex, toIndex, concurrency);
      process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
      return;
    }

    if (hasFlag('--update-index-html')) {
      if (hasFlag('--refresh-socials')) {
        const summary = await updateIndexHtmlSocialsWithRange(fromIndex, toIndex, concurrency);
        process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
        return;
      }
      const summary = await updateIndexHtmlWithRange(fromIndex, toIndex, concurrency);
      process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
      return;
    }

    const rangeResults = await parseRange(fromIndex, toIndex, concurrency);
    process.stdout.write(JSON.stringify(rangeResults, null, 2) + '\n');
    return;
  }

  const itemIndex = getArg('--index', '1');
  const result = await parseItem(itemIndex);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
