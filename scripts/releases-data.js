const PROVIDER_LABELS = {
  warp: 'Warp',
  bandcamp: 'Bandcamp',
  spotify: 'Spotify',
  applemusic: 'Apple Music',
  soundcloud: 'SoundCloud',
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'X',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  vk: 'VK',
  file: 'Dropbox'
};

const RELEASE_LINK_ORDER = [
  'spotify',
  'applemusic',
  'bandcamp',
  'soundcloud',
  'youtube',
  'instagram',
  'x',
  'facebook',
  'tiktok',
  'vk',
  'file',
  'warp'
];

export const RELEASES_DATA_URL = new URL('../data/releases.json', import.meta.url);

function normalizeText(value) {
  return String(value || '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(value) {
  return String(value || '').trim();
}

function normalizeIndex(value, fallbackIndex) {
  const normalized = normalizeText(value);
  return normalized || String(fallbackIndex + 1);
}

export function getProviderLabel(provider) {
  return PROVIDER_LABELS[String(provider || '').toLowerCase()] || '';
}

export function getProviderFromLabel(label) {
  const normalized = normalizeText(label).toLowerCase();
  if (normalized === 'warp') return 'warp';
  if (normalized === 'spotify') return 'spotify';
  if (normalized === 'apple music') return 'applemusic';
  if (normalized === 'bandcamp') return 'bandcamp';
  if (normalized === 'soundcloud') return 'soundcloud';
  if (normalized === 'youtube') return 'youtube';
  if (normalized === 'instagram') return 'instagram';
  if (normalized === 'x' || normalized === 'twitter') return 'x';
  if (normalized === 'facebook') return 'facebook';
  if (normalized === 'tiktok') return 'tiktok';
  if (normalized === 'vk') return 'vk';
  if (normalized === 'dropbox') return 'file';
  if (normalized === 'source') return '';
  return '';
}

export function getProviderFromUrl(url) {
  if (!url) return '';
  try {
    const parsedUrl = new URL(url, window.location.href);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    if (host.endsWith('warp.net')) return 'warp';
    if (host.includes('music.apple.com')) return 'applemusic';
    if (host.endsWith('vk.com')) return 'vk';
    if (host.endsWith('bandcamp.com')) return 'bandcamp';
    if (host.endsWith('instagram.com')) return 'instagram';
    if (host.endsWith('soundcloud.com')) return 'soundcloud';
    if (host === 'open.spotify.com') return 'spotify';
    if (host === 'x.com' || host === 'twitter.com') return 'x';
    if (host.endsWith('facebook.com')) return 'facebook';
    if (host.endsWith('tiktok.com')) return 'tiktok';
    if (host.endsWith('youtube.com') || host === 'youtu.be') return 'youtube';
    if (host.endsWith('dropbox.com') || /\.(mp3|wav|flac|aac|m4a|ogg)(?:$|\?)/i.test(pathname)) return 'file';
  } catch {
    return '';
  }

  return '';
}

function getLinkProviderName(link) {
  if (!link) return '';
  if (link.providerName) return String(link.providerName).toLowerCase();
  return getProviderFromLabel(link.label) || getProviderFromUrl(link.url);
}

function dedupeLinks(links, keepSingleLabel) {
  const normalizedLinks = [];
  const seenKeys = new Set();
  const seenLabels = new Set();

  for (let index = 0; index < links.length; index += 1) {
    const link = links[index];
    if (!link || !link.url) continue;

    const label = normalizeText(link.label) || getProviderLabel(getLinkProviderName(link)) || 'Link';
    const url = normalizeUrl(link.url);
    const providerName = getLinkProviderName(link);
    const key = label.toLowerCase() + '|' + url;

    if (seenKeys.has(key)) continue;
    if (keepSingleLabel && seenLabels.has(label.toLowerCase())) continue;

    seenKeys.add(key);
    if (keepSingleLabel) seenLabels.add(label.toLowerCase());

    normalizedLinks.push({
      label,
      providerName,
      url
    });
  }

  return normalizedLinks;
}

export function sortReleaseLinks(links) {
  return dedupeLinks(Array.isArray(links) ? links : [], false).sort(function (left, right) {
    const leftProvider = getLinkProviderName(left);
    const rightProvider = getLinkProviderName(right);
    const leftIndex = RELEASE_LINK_ORDER.indexOf(leftProvider);
    const rightIndex = RELEASE_LINK_ORDER.indexOf(rightProvider);
    const normalizedLeftIndex = leftIndex === -1 ? RELEASE_LINK_ORDER.length : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? RELEASE_LINK_ORDER.length : rightIndex;

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex;
    }

    return String(left && left.label || '').localeCompare(String(right && right.label || ''));
  });
}

export function normalizeReleaseItem(item, fallbackIndex) {
  const sourceUrl = normalizeUrl(item && item.sourceUrl);
  const releaseUrl = normalizeUrl(item && item.releaseUrl) || sourceUrl;
  const provider =
    normalizeText(item && item.provider).toLowerCase() ||
    getProviderFromUrl(sourceUrl) ||
    getProviderFromUrl(releaseUrl);
  const sourceLabel =
    normalizeText(item && item.sourceLabel) ||
    getProviderLabel(provider) ||
    'Source';
  const normalizedReleaseLinks = sortReleaseLinks(
    Array.isArray(item && item.releaseLinks) && item.releaseLinks.length
      ? item.releaseLinks
      : releaseUrl
        ? [{ label: sourceLabel, providerName: provider, url: releaseUrl }]
        : []
  );
  const normalizedSocialLinks = sortReleaseLinks(dedupeLinks(Array.isArray(item && item.socialLinks) ? item.socialLinks : [], true));

  return {
    index: normalizeIndex(item && item.index, fallbackIndex),
    imageUrl: normalizeUrl(item && item.imageUrl),
    audioUrl: normalizeUrl(item && item.audioUrl),
    artistName: normalizeText(item && item.artistName) || 'Release #' + String(fallbackIndex + 1),
    releaseTitle: normalizeText(item && item.releaseTitle) || 'Untitled release',
    releaseUrl,
    sourceUrl: sourceUrl || releaseUrl,
    sourceLabel,
    provider,
    releaseLinks: normalizedReleaseLinks,
    socialLinks: normalizedSocialLinks
  };
}

export function normalizeReleaseCatalog(rawCatalog) {
  const rawItems = Array.isArray(rawCatalog)
    ? rawCatalog
    : Array.isArray(rawCatalog && rawCatalog.items)
      ? rawCatalog.items
      : [];

  return {
    updatedAt: normalizeText(rawCatalog && rawCatalog.updatedAt),
    items: rawItems.map(function (item, index) {
      return normalizeReleaseItem(item, index);
    })
  };
}

export async function loadReleaseCatalog(customUrl) {
  const response = await fetch(customUrl || RELEASES_DATA_URL.href, {
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error('Failed to load release catalog: ' + response.status);
  }

  const rawCatalog = await response.json();
  return normalizeReleaseCatalog(rawCatalog);
}

export function serializeReleaseCatalog(catalog) {
  const normalizedCatalog = normalizeReleaseCatalog(catalog);
  const payload = {
    updatedAt: normalizedCatalog.updatedAt || new Date().toISOString(),
    items: normalizedCatalog.items
  };

  return JSON.stringify(payload, null, 2) + '\n';
}

export function buildPlainReleaseDetailsByIndex(items) {
  const detailsByIndex = {};
  const normalizedItems = normalizeReleaseCatalog({ items }).items;

  for (let index = 0; index < normalizedItems.length; index += 1) {
    const item = normalizedItems[index];
    detailsByIndex[item.index] = {
      artistName: item.artistName,
      releaseTitle: item.releaseTitle,
      releaseUrl: item.releaseUrl,
      sourceUrl: item.sourceUrl,
      sourceLabel: item.sourceLabel,
      provider: item.provider,
      releaseLinks: item.releaseLinks.map(function (link) {
        return {
          label: link.label,
          providerName: link.providerName,
          url: link.url
        };
      }),
      socialLinks: item.socialLinks.map(function (link) {
        return {
          label: link.label,
          url: link.url
        };
      }),
      audioUrl: item.audioUrl
    };
  }

  return detailsByIndex;
}

export function syncPlainReleaseDetailsByIndex(target, items) {
  if (!target || typeof target !== 'object') return target;

  const nextDetails = buildPlainReleaseDetailsByIndex(items);
  Object.keys(target).forEach(function (key) {
    delete target[key];
  });
  Object.assign(target, nextDetails);
  return target;
}

export function getAssignedAudioMap(items, fallbackUrl) {
  const assignedAudio = {};
  const normalizedItems = normalizeReleaseCatalog({ items }).items;

  for (let index = 0; index < normalizedItems.length; index += 1) {
    const item = normalizedItems[index];
    assignedAudio[item.index] = item.audioUrl || normalizeUrl(fallbackUrl);
  }

  return assignedAudio;
}

export function renderReleaseTiles(container, items) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  const normalizedItems = normalizeReleaseCatalog({ items }).items;

  container.textContent = '';

  for (let index = 0; index < normalizedItems.length; index += 1) {
    const item = normalizedItems[index];
    const anchor = document.createElement('a');
    const image = document.createElement('img');

    anchor.setAttribute('data-index', item.index);
    anchor.href = item.sourceUrl || item.releaseUrl || '#';
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';

    image.src = item.imageUrl;
    image.alt = item.artistName && item.releaseTitle
      ? item.artistName + ' - ' + item.releaseTitle
      : item.artistName || item.releaseTitle || '';

    anchor.appendChild(image);
    fragment.appendChild(anchor);
  }

  container.appendChild(fragment);
}

export function slugifySegment(value, fallbackValue) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallbackValue;
}
