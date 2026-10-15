import voroforce from './vendor/voroforce/index.js'
import mainFrag from './vendor/voroforce/display/scene/shaders/main.frag'

const DEFAULT_CELL_COUNT = 50000
// The source gallery uses the full corpus; do not collapse the Waves view to
// a small repeated sample of covers.
const MAX_MEDIA_ITEMS = 512
// The original project serves prebuilt GPU-compressed atlases. Our covers are
// composed in-browser, so use a compact atlas to keep first paint responsive.
const TILE_WIDTH = 96
const TILE_HEIGHT = 144
const VIRTUAL_COLS = 9
const VIRTUAL_ROWS = 6
const VIRTUAL_LAYERS = 50
const VIRTUAL_MEDIA_LAYER_CAPACITY = VIRTUAL_COLS * VIRTUAL_ROWS
const REAL_MEDIA_LAYERS = Math.ceil(DEFAULT_CELL_COUNT / VIRTUAL_MEDIA_LAYER_CAPACITY)
const VIRTUAL_MEDIA_VERSION_INDEX = 3
const WAVE_MODE_PREVIEW = 'preview'
const WAVE_MODE_SELECT = 'select'
const posterImageCache = new Map()

const waveVisualModes = {
  [WAVE_MODE_PREVIEW]: {
    fPixelSearchRadiusMod: 1,
    fBorderRoundnessMod: 0.75,
    fBorderThicknessMod: 1,
    fBorderSmoothnessMod: 1,
    fCenterForceBulgeStrength: 0.45,
    fCenterForceBulgeRadius: 0.65,
    fWeightOffsetScaleMod: 0.25,
    fUnweightedEffectMod: 1,
    fBaseXDistScale: 1.5,
    fWeightedXDistScale: 1.5,
    fRippleMod: 1,
    fNoiseOctaveMod: 1,
    fNoiseCenterOffsetMod: 1,
  },
  [WAVE_MODE_SELECT]: {
    fPixelSearchRadiusMod: 2,
    fBorderRoundnessMod: 0.75,
    fBorderThicknessMod: 1,
    fBorderSmoothnessMod: 0.75,
    fCenterForceBulgeStrength: 0.2,
    fCenterForceBulgeRadius: 0.6,
    fWeightOffsetScaleMod: 0,
    fUnweightedEffectMod: 1,
    fBaseXDistScale: 1.5,
    fWeightedXDistScale: 1.5,
    fRippleMod: 0,
    fNoiseOctaveMod: 0,
    fNoiseCenterOffsetMod: 0,
  },
}

const previewForceConfig = {
  parameters: {
    alpha: 0.15,
    velocityDecay: 0.7,
    velocityDecayBase: 0.7,
    velocityDecayTransitionEnterMode: 0.9,
  },
  forces: {
    type: 'omni',
    enabled: true,
    defaultLerpFactor: 0.025,
    manageWeights: true,
    primaryCellWeightPushFactorEnabled: true,
    smoothPrimaryCell: true,
    requestMediaVersions: {
      enabled: true,
      // The reference project uses compressed low-resolution poster atlases in
      // preview. This adaptation has only local cover artwork, so version 3 is
      // its preview atlas too.
      v3ColLevelAdjacencyThreshold: 2,
      v3RowLevelAdjacencyThreshold: 2,
      v2ColLevelAdjacencyThreshold: 3,
      v2RowLevelAdjacencyThreshold: 3,
      v1ColLevelAdjacencyThreshold: 6,
      v1RowLevelAdjacencyThreshold: 6,
    },
    breathing: {
      enabled: true,
    },
    push: {
      strength: 0.1,
      yFactor: 2.5,
      alignmentMaxLevelsX: 40,
      centerXStretchMod: 0.4,
      speedFactor: 1,
    },
    lattice: {
      strength: 0.8,
      yFactor: 3.75,
      xFactor: 1,
      maxLevelsFromPrimary: 30,
    },
    origin: {
      strength: 0.8,
      yFactor: 1.5,
    },
  },
}

const selectForceConfig = {
  parameters: {
    alpha: 0.15,
    velocityDecay: 0.8,
    velocityDecayBase: 0.8,
    velocityDecayTransitionEnterMode: 0.8,
  },
  forces: {
    type: 'omni',
    enabled: true,
    defaultLerpFactor: 0.025,
    manageWeights: true,
    primaryCellWeightPushFactorEnabled: false,
    smoothPrimaryCell: false,
    requestMediaVersions: {
      enabled: true,
      handleMediaSpeedLimits: false,
      v3ColLevelAdjacencyThreshold: 1,
      v3RowLevelAdjacencyThreshold: 1,
      v2ColLevelAdjacencyThreshold: 18,
      v2RowLevelAdjacencyThreshold: 18,
    },
    breathing: {
      enabled: false,
    },
    push: {
      strength: 0.05,
      selector: 'focused',
      yFactor: 1.5,
    },
    lattice: {
      strength: 1,
      yFactor: 1.5,
      xFactor: 1,
      maxLevelsFromPrimary: 50,
    },
    origin: {
      strength: 0.1,
      latticeScale: 3,
    },
  },
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function collectReleaseItems(releaseNodes) {
  return Array.from(releaseNodes || [])
    .map((node, index) => {
      const img = node.querySelector('img')
      const src = img?.currentSrc || img?.src || ''
      return {
        index: node.getAttribute('data-index') || String(index),
        href: node.getAttribute('href') || '#',
        src,
        label: img?.alt || '',
      }
    })
    .filter((item) => item.src)
}

function cellToMediaIndex(cellIndex, count) {
  if (count <= 1) return 0
  let hash = cellIndex + 1
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x7feb352d)
  hash ^= hash >>> 15
  hash = Math.imul(hash, 0x846ca68b)
  hash ^= hash >>> 16
  return Math.abs(hash) % count
}

function drawCoverToPoster(ctx, image, dx = 0, dy = 0) {
  const sourceRatio = image.naturalWidth / Math.max(1, image.naturalHeight)
  const targetRatio = TILE_WIDTH / TILE_HEIGHT
  let sx = 0
  let sy = 0
  let sw = image.naturalWidth
  let sh = image.naturalHeight

  if (sourceRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio
    sx = (image.naturalWidth - sw) * 0.5
  } else {
    sh = image.naturalWidth / targetRatio
    sy = (image.naturalHeight - sh) * 0.5
  }

  ctx.fillStyle = '#050505'
  ctx.fillRect(dx, dy, TILE_WIDTH, TILE_HEIGHT)
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, TILE_WIDTH, TILE_HEIGHT)

  const gradient = ctx.createLinearGradient(0, dy, 0, dy + TILE_HEIGHT)
  gradient.addColorStop(0, 'rgba(255,255,255,0.08)')
  gradient.addColorStop(0.46, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.24)')
  ctx.fillStyle = gradient
  ctx.fillRect(dx, dy, TILE_WIDTH, TILE_HEIGHT)
}

function cellToReleaseItem(cellIndex, items) {
  return items[cellToMediaIndex(cellIndex, items.length)]
}

async function loadPosterImage(src) {
  if (posterImageCache.has(src)) return posterImageCache.get(src)
  const image = new Image()
  image.decoding = 'async'
  image.loading = 'eager'
  const result = new Promise((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => {
      posterImageCache.delete(src)
      reject(new Error(`Failed to load cover: ${src}`))
    }
    image.src = src
    if (image.complete) {
      if (image.naturalWidth) resolve(image)
      else image.onerror()
    }
  })
  posterImageCache.set(src, result)
  return result
}

async function createPosterAtlas(layerIndex, items) {
  const canvas = document.createElement('canvas')
  canvas.width = VIRTUAL_COLS * TILE_WIDTH
  canvas.height = VIRTUAL_ROWS * TILE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const firstCellId = layerIndex * VIRTUAL_MEDIA_LAYER_CAPACITY
  const images = await Promise.all(
    Array.from({ length: VIRTUAL_MEDIA_LAYER_CAPACITY }, async (_, tileIndex) => {
      const item = cellToReleaseItem(firstCellId + tileIndex, items)
      return item?.src ? loadPosterImage(item.src) : null
    }),
  )

  images.forEach((image, tileIndex) => {
    if (!image) return
    const col = tileIndex % VIRTUAL_COLS
    const row = Math.floor(tileIndex / VIRTUAL_COLS)
    drawCoverToPoster(ctx, image, col * TILE_WIDTH, row * TILE_HEIGHT)
  })
  return canvas
}

function createConfig(items, resolvePosterAtlas) {
  const mediaItems = items.slice(0, MAX_MEDIA_ITEMS)
  const cellCount = DEFAULT_CELL_COUNT

  return {
    cells: cellCount,
    multiThreading: {
      enabled: false,
      renderInParallel: false,
    },
    ticker: {
      mode: 'auto',
    },
    controls: {
      autoFocusCenter: {
        enabled: true,
        random: false,
      },
      maxSpeed: 10,
      ease: 0.15,
      easePinned: 0.15,
      zoom: {
        enabled: true,
        min: 1,
        max: 1.5,
      },
      freezeOnShake: {
        enabled: false,
      },
      freezeOnJolt: {
        enabled: false,
      },
    },
    lattice: {
      enabled: true,
      aspect: TILE_WIDTH / TILE_HEIGHT,
      targetCellSizeViewportPercentage: 0.075,
    },
    media: {
      enabled: true,
      preload: false,
      maxConcurrentLoads: 2,
      versions: [
        {
          cols: 512,
          rows: 104,
          width: 4,
          height: 4,
          layers: 1,
          layerSrcFormat: '',
          type: 'compressed-grid',
        },
        {
          cols: 90,
          rows: 60,
          width: 4,
          height: 4,
          layers: 10,
          layerSrcFormat: '',
          type: 'compressed-grid',
        },
        {
          cols: 18,
          rows: 12,
          width: 4,
          height: 4,
          layers: 241,
          layerSrcFormat: '',
          type: 'compressed-grid',
        },
        {
          cols: 1,
          rows: 1,
          virtualCols: VIRTUAL_COLS,
          virtualRows: VIRTUAL_ROWS,
          virtualLayers: VIRTUAL_LAYERS,
          tileWidth: TILE_WIDTH,
          tileHeight: TILE_HEIGHT,
          width: VIRTUAL_COLS * TILE_WIDTH,
          height: VIRTUAL_ROWS * TILE_HEIGHT,
          layers: REAL_MEDIA_LAYERS,
          layerIndexStart: 0,
          layerSrcFormat: (layerIndex) => resolvePosterAtlas(layerIndex),
          type: 'uncompressed-single',
        },
      ],
    },
    simulation: {
      steps: {
        neighbors: {
          levels: 1,
        },
        force: {
          ...previewForceConfig,
        },
      },
      forceStepModeConfigs: {
        [WAVE_MODE_PREVIEW]: previewForceConfig,
        [WAVE_MODE_SELECT]: selectForceConfig,
      },
    },
    display: {
      renderer: {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        backgroundColor: '#000000ff',
      },
      scene: {
        post: {
          // The reference does not use the depth post-process. It bends the
          // whole viewport and was the source of the oversized, warped tiles.
          enabled: false,
          fragmentShader: undefined,
          uniforms: {},
        },
        main: {
          fragmentShader: mainFrag,
          uniforms: {
            iForcedMaxNeighborLevel: { value: 0 },
            fPixelSearchRadiusMod: { value: 1 },
            bMediaDistortion: { value: false },
            fMediaBboxScale: { value: 1 },
            fBaseColor: { value: [0, 0, 0] },
            fBorderRoundnessMod: { value: 0.75 },
            fBorderThicknessMod: { value: 1 },
            fBorderSmoothnessMod: { value: 1 },
            fCenterForceBulgeStrength: { value: 1 },
            fCenterForceBulgeRadius: { value: 0.75 },
            fWeightOffsetScaleMod: { value: 0.25 },
            fWeightOffsetScaleMediaMod: { value: 1 },
            fUnweightedEffectMod: { value: 1 },
            fBaseXDistScale: { value: 1.5 },
            fWeightedXDistScale: { value: 1.5 },
            fRippleMod: { value: 1 },
            fNoiseOctaveMod: { value: 1 },
            fNoiseCenterOffsetMod: { value: 1 },
          },
        },
      },
    },
  }
}

function applyWaveMode(instance, mode) {
  if (!instance) return
  const isSelect = mode === WAVE_MODE_SELECT
  const forceConfig = isSelect ? selectForceConfig : previewForceConfig
  const controlsConfig = isSelect
    ? {
        maxSpeed: 4,
        ease: 0.1,
        easePinned: 0.25,
        freezeOnShake: { enabled: false },
        freezeOnJolt: { enabled: false },
        zoom: { enabled: true, min: 1, max: 1.01 },
      }
    : {
        autoFocusCenter: {
          enabled: true,
          random: false,
      },
        maxSpeed: 10,
        ease: 0.15,
        easePinned: 0.15,
        zoom: { enabled: true, min: 1, max: 1.5 },
        freezeOnShake: { enabled: false },
        freezeOnJolt: { enabled: false },
      }

  instance.controls?.updateConfig?.(controlsConfig)
  instance.simulation?.updateForceStepConfig?.(forceConfig)
  const uniforms = instance.display?.scene?.mainProgram?.uniforms
  const visualConfig = waveVisualModes[mode] || waveVisualModes[WAVE_MODE_PREVIEW]
  if (uniforms) {
    Object.entries(visualConfig).forEach(([name, value]) => {
      if (uniforms[name]) uniforms[name].value = value
    })
  }
}

export function createWaveVoroforceScene(options) {
  const { container, releaseNodes } = options || {}
  if (!container) return null

  const items = collectReleaseItems(releaseNodes)
  if (!items.length) return null

  const prepared = items.slice(0, MAX_MEDIA_ITEMS)
  const posterAtlasCache = new Map()

  const resolvePosterAtlas = (layerIndex) => {
    if (!posterAtlasCache.has(layerIndex)) {
      // Keep CPU memory in step with the 50 physical GPU layers. Older atlas
      // canvases are regenerated on demand instead of accumulating forever.
      while (posterAtlasCache.size >= VIRTUAL_LAYERS) {
        posterAtlasCache.delete(posterAtlasCache.keys().next().value)
      }
      posterAtlasCache.set(layerIndex, createPosterAtlas(layerIndex, prepared))
    }
    return posterAtlasCache.get(layerIndex)
  }

  const host = document.createElement('div')
  host.className = 'canvas-space canvas-space--cards canvas-space--voroforce'
  host.setAttribute('aria-hidden', 'true')
  host.dataset.waveEngine = 'mounting'
  container.prepend(host)

  const caption = document.createElement('section')
  caption.className = 'wave-caption'
  caption.setAttribute('aria-live', 'polite')
  caption.hidden = true
  const captionArtist = document.createElement('p')
  const captionTitle = document.createElement('h2')
  caption.append(captionArtist, captionTitle)
  container.append(caption)

  const instance = voroforce(host, createConfig(prepared, resolvePosterAtlas))
  host.dataset.waveEngine = 'ready'
  host.dataset.waveMode = WAVE_MODE_PREVIEW
  host.dataset.waveCells = String(instance.cells?.length || 0)
  applyWaveMode(instance, WAVE_MODE_PREVIEW)
  instance.loader?.addEventListener?.('mediaLayerLoaded', () => {
    host.dataset.waveLoaded = String(instance.loader?.loadedIndex || 0)
  })
  instance.loader?.addEventListener?.('idle', () => {
    host.dataset.waveIdle = 'true'
  })
  if (typeof window !== 'undefined') {
    window.__bassfunkWaveVoroforceInstance = instance
  }
  const controls = instance.controls

  const selectHandler = (event) => {
    const cell = event?.cell
    if (!cell) {
      host.dataset.waveMode = WAVE_MODE_PREVIEW
      applyWaveMode(instance, WAVE_MODE_PREVIEW)
      return
    }
    host.dataset.waveMode = WAVE_MODE_SELECT
    applyWaveMode(instance, WAVE_MODE_SELECT)
    const item = cellToReleaseItem(cell.id, prepared)
      || prepared[cell.index % prepared.length]
    if (item) {
      const [artist, ...title] = item.label.split(' - ')
      captionArtist.textContent = artist || 'Now selected'
      captionTitle.textContent = title.join(' - ') || item.label || 'Untitled release'
      caption.hidden = false
    }
  }

  controls?.listen?.('selected', selectHandler)

  // Voroforce reads the cell id back from its GPU index buffer. Its stock
  // click handler can run before that asynchronous read finishes, leaving the
  // click without a selection. Resolve the id for this click and select the
  // cell through the engine's regular control API.
  const clickHandler = (event) => {
    if (!controls?.getCellIndices || controls.pointer?.dragging) return
    const position = { x: event.clientX, y: event.clientY }
    controls.getCellIndices(position, (cellIndex) => {
      if (cellIndex === undefined) return
      controls.assignPointer?.({ ...position, index: cellIndex })
      controls.focusCell?.(cellIndex)
      controls.selectCell?.(cellIndex)
    })
  }
  host.addEventListener('click', clickHandler)

  return {
    resize() {
      instance.resize?.()
    },
    destroy() {
      controls?.unlisten?.('selected', selectHandler)
      host.removeEventListener('click', clickHandler)
      instance.dispose?.()
      host.remove()
      caption.remove()
    },
    get instance() {
      return instance
    },
  }
}

if (typeof window !== 'undefined') {
  window.BassfunkWaveVoroforce = {
    createWaveVoroforceScene,
  }
  window.createWaveVoroforceScene = createWaveVoroforceScene
}
