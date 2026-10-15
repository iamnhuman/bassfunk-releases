var BassfunkWaveVoroforce = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

  // stub:voroforce-devtools-stub
  var voroforce_devtools_stub_exports = {};
  __export(voroforce_devtools_stub_exports, {
    default: () => DevTools
  });
  var DevTools;
  var init_voroforce_devtools_stub = __esm({
    "stub:voroforce-devtools-stub"() {
      DevTools = class {
        dispose() {
        }
      };
    }
  });

  // scripts/wave-voroforce.js
  var wave_voroforce_exports = {};
  __export(wave_voroforce_exports, {
    createWaveVoroforceScene: () => createWaveVoroforceScene
  });

  // scripts/vendor/voroforce/utils/array-buffer.js
  var arrayBuffer = (length3, shared = false) => new (shared && typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : ArrayBuffer)(length3);

  // scripts/vendor/voroforce/utils/device.js
  var isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);

  // scripts/vendor/voroforce/utils/logger.js
  var LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  };
  var LOG_COLORS = {
    ERROR: "#ff4444",
    WARN: "#ffaa00",
    INFO: "#4488ff",
    DEBUG: "#888888",
    TRACE: "#666666"
  };
  var Logger = class _Logger {
    constructor(namespace = "voroforce", level = LOG_LEVELS.INFO) {
      this.namespace = namespace;
      this.level = level;
      this.enabled = true;
    }
    setLevel(level) {
      if (typeof level === "string") {
        this.level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
      } else {
        this.level = level;
      }
    }
    setEnabled(enabled) {
      this.enabled = enabled;
    }
    createChild(childNamespace) {
      return new _Logger(`${this.namespace}:${childNamespace}`, this.level);
    }
    formatMessage(level, message, ...args) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1].split(".")[0];
      const prefix = `[${timestamp}] ${this.namespace} ${level}:`;
      return [prefix, message, ...args];
    }
    log(level, levelName, message, ...args) {
      if (!this.enabled || level > this.level) return;
      const formattedArgs = this.formatMessage(levelName, message, ...args);
      const color = LOG_COLORS[levelName];
      if (typeof window !== "undefined" && window.console) {
        console.log(
          `%c${formattedArgs[0]}`,
          `color: ${color}; font-weight: bold;`,
          ...formattedArgs.slice(1)
        );
      } else {
        console.log(...formattedArgs);
      }
    }
    error(message, ...args) {
      this.log(LOG_LEVELS.ERROR, "ERROR", message, ...args);
    }
    warn(message, ...args) {
      this.log(LOG_LEVELS.WARN, "WARN", message, ...args);
    }
    info(message, ...args) {
      this.log(LOG_LEVELS.INFO, "INFO", message, ...args);
    }
    debug(message, ...args) {
      this.log(LOG_LEVELS.DEBUG, "DEBUG", message, ...args);
    }
    trace(message, ...args) {
      this.log(LOG_LEVELS.TRACE, "TRACE", message, ...args);
    }
    group(label, collapsed = false) {
      if (!this.enabled) return;
      if (typeof window !== "undefined" && window.console) {
        if (collapsed) {
          console.groupCollapsed(`${this.namespace}: ${label}`);
        } else {
          console.group(`${this.namespace}: ${label}`);
        }
      }
    }
    groupEnd() {
      if (!this.enabled) return;
      if (typeof window !== "undefined" && window.console) {
        console.groupEnd();
      }
    }
    time(label) {
      if (!this.enabled) return;
      if (typeof window !== "undefined" && window.console) {
        console.time(`${this.namespace}:${label}`);
      }
    }
    timeEnd(label) {
      if (!this.enabled) return;
      if (typeof window !== "undefined" && window.console) {
        console.timeEnd(`${this.namespace}:${label}`);
      }
    }
    table(data) {
      if (!this.enabled || this.level < LOG_LEVELS.DEBUG) return;
      if (typeof window !== "undefined" && window.console && console.table) {
        console.table(data);
      }
    }
  };
  var defaultLogger = new Logger("voroforce");
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get("debug");
    const storedLevel = localStorage.getItem("voroforce-log-level");
    if (debugParam) {
      defaultLogger.setLevel(debugParam.toUpperCase());
    } else if (storedLevel) {
      defaultLogger.setLevel(storedLevel);
    }
    window.voroforceLogger = defaultLogger;
  } else {
  }
  function createLogger(namespace, level) {
    return new Logger(namespace, level ?? defaultLogger.level);
  }

  // scripts/vendor/voroforce/utils/math.js
  var conditionalReturn = (value, func) => value || value === 0 ? func(value) : func;
  var mapRange = (inMin, inMax, outMin, outMax, value) => {
    const inRange = inMax - inMin;
    const outRange = outMax - outMin;
    return conditionalReturn(
      value,
      (value2) => outMin + ((value2 - inMin) / inRange * outRange || 0)
    );
  };
  var clamp = (min2, max3, value) => conditionalReturn(
    value,
    (v) => value < min2 ? min2 : value > max3 ? max3 : value
  );
  var lerp = (v0, v1, t) => {
    return v0 * (1 - t) + v1 * t;
  };
  var minLerp = (start, end, factor, min2 = 1e-3) => {
    const diff = end - start;
    if (Math.abs(diff) < min2) return end;
    return start + diff * factor;
  };
  var MIN_LERP_EASING_TYPES = {
    linear: "linear",
    easeInQuad: "easeInQuad",
    easeOutQuad: "easeOutQuad",
    easeInOutQuad: "easeInOutQuad",
    easeInCubic: "easeInCubic",
    easeOutCubic: "easeOutCubic",
    easeInOutCubic: "easeInOutCubic",
    easeInExpo: "easeInExpo",
    easeOutExpo: "easeOutExpo",
    easeInOutExpo: "easeInOutExpo",
    elastic: "elastic",
    bounce: "bounce"
  };
  var easedMinLerp = (start, end, factor, easingType = MIN_LERP_EASING_TYPES.linear, min2 = 1e-3) => {
    const diff = end - start;
    if (Math.abs(diff) < min2) {
      return end;
    }
    let easedFactor;
    switch (easingType) {
      case "linear":
        easedFactor = factor;
        break;
      case "easeInQuad":
        easedFactor = factor * factor;
        break;
      case "easeOutQuad":
        easedFactor = factor * (2 - factor);
        break;
      case "easeInOutQuad":
        easedFactor = factor < 0.5 ? 2 * factor * factor : -1 + (4 - 2 * factor) * factor;
        break;
      case "easeInCubic":
        easedFactor = factor * factor * factor;
        break;
      case "easeOutCubic":
        easedFactor = (factor - 1) * factor * factor + 1;
        break;
      case "easeInOutCubic":
        easedFactor = factor < 0.5 ? 4 * factor * factor * factor : (factor - 1) * (2 * factor - 2) * (2 * factor - 2) + 1;
        break;
      case "easeInExpo":
        easedFactor = factor === 0 ? 0 : 2 ** (10 * (factor - 1));
        break;
      case "easeOutExpo":
        easedFactor = factor === 1 ? 1 : 1 - 2 ** (-10 * factor);
        break;
      case "easeInOutExpo":
        if (factor === 0) easedFactor = 0;
        if (factor === 1) easedFactor = 1;
        if (factor < 0.5) {
          easedFactor = 0.5 * 2 ** (10 * (2 * factor - 1));
        } else {
          easedFactor = 0.5 * (-(2 ** (-10 * (2 * factor - 1))) + 2);
        }
        break;
      case "elastic": {
        const p = 0.3;
        easedFactor = 2 ** (-10 * factor) * Math.sin((factor - p / 4) * (2 * Math.PI) / p) + 1;
        break;
      }
      case "bounce":
        if (factor < 1 / 2.75) {
          easedFactor = 7.5625 * factor * factor;
        } else if (factor < 2 / 2.75) {
          easedFactor = factor - 1.5 / 2.75;
          easedFactor = 7.5625 * easedFactor * easedFactor + 0.75;
        } else if (factor < 2.5 / 2.75) {
          easedFactor = factor - 2.25 / 2.75;
          easedFactor = 7.5625 * easedFactor * easedFactor + 0.9375;
        } else {
          easedFactor = factor - 2.625 / 2.75;
          easedFactor = 7.5625 * easedFactor * easedFactor + 0.984375;
        }
        break;
      default:
        easedFactor = factor;
    }
    return start + diff * easedFactor;
  };
  var distance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // scripts/vendor/voroforce/utils/type-check.js
  var isNumber = (v) => Number.isFinite(v);
  var isObject = (obj) => obj && typeof obj === "object";

  // scripts/vendor/voroforce/utils/merge-configs.js
  function mergeConfigs(...configs) {
    return configs.reduce((prev, obj = {}) => {
      Object.keys(obj).forEach((key) => {
        const pVal = prev[key];
        const oVal = obj[key];
        if (
          /*Array.isArray(pVal) && */
          Array.isArray(oVal)
        ) {
          prev[key] = oVal;
        } else if (isObject(pVal) && !Array.isArray(pVal) && isObject(oVal)) {
          prev[key] = mergeConfigs(pVal, oVal);
        } else {
          prev[key] = oVal;
        }
      });
      return prev;
    }, {});
  }

  // scripts/vendor/voroforce/utils/styles.js
  var setStyles = (element, styles) => {
    if (styles !== void 0) {
      Object.keys(styles).forEach((key) => {
        element.style.setProperty(key, styles[key]);
      });
    }
  };

  // scripts/vendor/voroforce/common/data/shared-cell.js
  var SharedCell = class {
    constructor(cellData, cellCoordsArray, cellAttributesArray, cellWeightsArray, cellMediaVersionsArray, cellIdsArray) {
      __publicField(this, "subgrid");
      __publicField(this, "subgridIndex");
      this.cellCoordsArray = cellCoordsArray;
      this.cellAttributesArray = cellAttributesArray;
      this.cellWeightsArray = cellWeightsArray;
      this.cellMediaVersionsArray = cellMediaVersionsArray;
      this.cellIdsArray = cellIdsArray;
      this.index = cellData.index;
      this.group = cellData.group;
      this.cellCoordsBaseOffset = 2 * this.index;
      this.cellAttributesBaseOffset = 10 * this.index;
      this.xIndex = this.cellCoordsBaseOffset + 0;
      this.yIndex = this.cellCoordsBaseOffset + 1;
      this.vxIndex = this.cellAttributesBaseOffset + 0;
      this.vyIndex = this.cellAttributesBaseOffset + 1;
      this.fxIndex = this.cellAttributesBaseOffset + 2;
      this.fyIndex = this.cellAttributesBaseOffset + 3;
      this.targetFxIndex = this.cellAttributesBaseOffset + 4;
      this.targetFyIndex = this.cellAttributesBaseOffset + 5;
      this.ixIndex = this.cellAttributesBaseOffset + 6;
      this.iyIndex = this.cellAttributesBaseOffset + 7;
      this.rowIndex = this.cellAttributesBaseOffset + 8;
      this.colIndex = this.cellAttributesBaseOffset + 9;
      this.mediaVersionIndex = 2 * this.index;
      this.targetMediaVersionIndex = 2 * this.index + 1;
      this.weightIndex = this.index;
      this.idIndex = this.index;
      this.initialVx = 0;
      this.initialVy = 0;
      this.vx = 0;
      this.vy = 0;
      this.localX = 0;
      this.localY = 0;
      this.localIx = 0;
      this.localIy = 0;
      this.localWeight = 0;
      this.localCol = 0;
      this.localRow = 0;
    }
    set x(v) {
      this.cellCoordsArray[this.xIndex] = v;
    }
    get x() {
      return this.cellCoordsArray[this.xIndex];
    }
    set y(v) {
      this.cellCoordsArray[this.yIndex] = v;
    }
    get y() {
      return this.cellCoordsArray[this.yIndex];
    }
    // set vx(v) {
    //   this.cellAttributesArray[this.vxIndex] = v
    // }
    //
    // get vx() {
    //   return this.cellAttributesArray[this.vxIndex]
    // }
    //
    // set vy(v) {
    //   this.cellAttributesArray[this.vyIndex] = v
    // }
    //
    // get vy() {
    //   return this.cellAttributesArray[this.vyIndex]
    // }
    set fx(v) {
      this.cellAttributesArray[this.fxIndex] = isNumber(v) ? v : 0;
    }
    get fx() {
      const v = this.cellAttributesArray[this.fxIndex];
      if (v === 0) return void 0;
      return v;
    }
    set fy(v) {
      this.cellAttributesArray[this.fyIndex] = isNumber(v) ? v : 0;
    }
    get fy() {
      const v = this.cellAttributesArray[this.fyIndex];
      if (v === 0) return void 0;
      return v;
    }
    set targetFx(v) {
      this.cellAttributesArray[this.targetFxIndex] = isNumber(v) ? v : 0;
    }
    get targetFx() {
      const v = this.cellAttributesArray[this.targetFxIndex];
      if (v === 0) return void 0;
      return v;
    }
    set targetFy(v) {
      this.cellAttributesArray[this.targetFyIndex] = isNumber(v) ? v : 0;
    }
    get targetFy() {
      const v = this.cellAttributesArray[this.targetFyIndex];
      if (v === 0) return void 0;
      return v;
    }
    set ix(v) {
      this.cellAttributesArray[this.ixIndex] = v;
    }
    get ix() {
      return this.cellAttributesArray[this.ixIndex];
    }
    set iy(v) {
      this.cellAttributesArray[this.iyIndex] = v;
    }
    get iy() {
      return this.cellAttributesArray[this.iyIndex];
    }
    set row(v) {
      this.cellAttributesArray[this.rowIndex] = v;
    }
    get row() {
      return this.cellAttributesArray[this.rowIndex];
    }
    set col(v) {
      this.cellAttributesArray[this.colIndex] = v;
    }
    get col() {
      return this.cellAttributesArray[this.colIndex];
    }
    set mediaVersion(v) {
      this.cellMediaVersionsArray[this.mediaVersionIndex] = v;
    }
    get mediaVersion() {
      return this.cellMediaVersionsArray[this.mediaVersionIndex];
    }
    set targetMediaVersion(v) {
      this.cellMediaVersionsArray[this.targetMediaVersionIndex] = v;
    }
    get targetMediaVersion() {
      return this.cellMediaVersionsArray[this.targetMediaVersionIndex];
    }
    set weight(v) {
      this.cellWeightsArray[this.weightIndex] = v;
    }
    get weight() {
      return this.cellWeightsArray[this.weightIndex];
    }
    set id(v) {
      this.cellIdsArray[this.idIndex] = v;
    }
    get id() {
      return this.cellIdsArray[this.idIndex];
    }
  };

  // scripts/vendor/voroforce/common/data/shared-cell-collection.js
  var SharedCellCollection = class extends Array {
    constructor() {
      super();
      this.focusedArrayIndex = 0;
      this.selectedArrayIndex = 1;
      this.draggingArrayIndex = 2;
    }
    static from(arr, cellCollectionData) {
      const c = super.from(arr);
      c.cellCollectionData = cellCollectionData;
      return c;
    }
    set focused(n) {
      this.cellCollectionData[this.focusedArrayIndex] = n?.index !== void 0 ? n.index : -1;
    }
    get focused() {
      return this[this.cellCollectionData[this.focusedArrayIndex]];
    }
    set focusedIndex(i) {
      this.cellCollectionData[this.focusedArrayIndex] = i !== void 0 ? i : -1;
    }
    get focusedIndex() {
      const index = this.cellCollectionData[this.focusedArrayIndex];
      return index !== -1 ? index : void 0;
    }
    set selected(n) {
      this.cellCollectionData[this.selectedArrayIndex] = n?.index !== void 0 ? n.index : -1;
    }
    get selected() {
      return this[this.cellCollectionData[this.selectedArrayIndex]];
    }
    set selectedIndex(i) {
      this.cellCollectionData[this.selectedArrayIndex] = i !== void 0 ? i : -1;
    }
    get selectedIndex() {
      const index = this.cellCollectionData[this.selectedArrayIndex];
      return index !== -1 ? index : void 0;
    }
    set dragging(n) {
      this.cellCollectionData[this.draggingArrayIndex] = n?.index ?? -1;
    }
    get dragging() {
      return this[this.cellCollectionData[this.draggingArrayIndex]];
    }
  };

  // scripts/vendor/voroforce/common/data/init-shared-cell-data.js
  var getNumCellsFromOptions = (cellOptions) => Array.isArray(cellOptions) ? cellOptions.length : Math.abs(cellOptions);
  var initSharedCellMediaVersionsData = (cellOptions, config) => {
    const numCells = getNumCellsFromOptions(cellOptions);
    const lenSqrd = Math.ceil(Math.sqrt(numCells));
    const sharedCellMediaVersionsTextureWidth = lenSqrd;
    const sharedCellMediaVersionsTextureHeight = lenSqrd;
    const sharedCellMediaVersionsBuffer = arrayBuffer(
      sharedCellMediaVersionsTextureHeight * sharedCellMediaVersionsTextureWidth * 4,
      // Uint16Array = 2 bytes per element, but we have RG (media version & target media version)
      config.multiThreading?.enabled
    );
    const sharedCellMediaVersions = new Uint16Array(sharedCellMediaVersionsBuffer);
    return {
      sharedCellMediaVersionsBuffer,
      sharedCellMediaVersions,
      sharedCellMediaVersionsTextureWidth,
      sharedCellMediaVersionsTextureHeight
    };
  };
  var initSharedCellIdsData = (cellOptions, config) => {
    const numCells = getNumCellsFromOptions(cellOptions);
    const lenSqrd = Math.ceil(Math.sqrt(numCells));
    const sharedCellIdsTextureWidth = lenSqrd;
    const sharedCellIdsTextureHeight = lenSqrd;
    const sharedCellIdsBuffer = arrayBuffer(
      sharedCellIdsTextureHeight * sharedCellIdsTextureWidth * 4,
      // 4 bytes
      config.multiThreading?.enabled
    );
    const sharedCellIds = new Uint32Array(sharedCellIdsBuffer);
    return {
      sharedCellIdsBuffer,
      sharedCellIds,
      sharedCellIdsTextureWidth,
      sharedCellIdsTextureHeight
    };
  };
  var initSharedCellWeightsData = (cellOptions, config) => {
    const numCells = getNumCellsFromOptions(cellOptions);
    const lenSqrd = Math.ceil(Math.sqrt(numCells));
    const sharedCellWeightsTextureWidth = lenSqrd;
    const sharedCellWeightsTextureHeight = lenSqrd;
    const sharedCellWeightsBuffer = arrayBuffer(
      sharedCellWeightsTextureHeight * sharedCellWeightsTextureWidth * 4,
      // 4 bytes
      config.multiThreading?.enabled
    );
    const sharedCellWeights = new Float32Array(sharedCellWeightsBuffer);
    return {
      sharedCellWeightsBuffer,
      sharedCellWeights,
      sharedCellWeightsTextureWidth,
      sharedCellWeightsTextureHeight
    };
  };
  var initSharedCellNeighborsData = (cellOptions, config) => {
    const numCells = getNumCellsFromOptions(cellOptions);
    let maxNeighbors = 8;
    const levels = config.simulation?.steps?.neighbors?.levels;
    switch (levels) {
      case 2:
        maxNeighbors = 24;
        break;
      case 3:
        maxNeighbors = 48;
        break;
      case 4:
        maxNeighbors = 80;
        break;
    }
    const cellNeighborsReservedSize = 2 + Math.min(maxNeighbors, numCells);
    const lenSqrd = Math.ceil(Math.sqrt(numCells * cellNeighborsReservedSize));
    const sharedCellNeighborsTextureWidth = lenSqrd;
    const sharedCellNeighborsTextureHeight = lenSqrd;
    const sharedCellNeighborsBuffer = arrayBuffer(
      sharedCellNeighborsTextureHeight * sharedCellNeighborsTextureWidth * 4,
      // 4 bytes
      config.multiThreading?.enabled
    );
    const sharedCellNeighbors = new Uint32Array(sharedCellNeighborsBuffer);
    return {
      sharedCellNeighborsTextureWidth,
      sharedCellNeighborsTextureHeight,
      sharedCellNeighborsBuffer,
      sharedCellNeighbors
    };
  };
  var initSharedCellCoordsData = (cellOptions, config) => {
    const numCells = getNumCellsFromOptions(cellOptions);
    const lenSqrd = Math.ceil(Math.sqrt(
      numCells
      /* * 2*/
    ));
    const sharedCellCoordsTextureWidth = lenSqrd;
    const sharedCellCoordsTextureHeight = lenSqrd;
    const sharedCellCoordsBuffer = arrayBuffer(
      // numCells * 8, // 4 bytes per float
      sharedCellCoordsTextureHeight * sharedCellCoordsTextureWidth * 2 * 4,
      // 4 bytes
      config.multiThreading
    );
    const sharedCellCoords = new Float32Array(sharedCellCoordsBuffer);
    return {
      sharedCellCoordsTextureWidth,
      sharedCellCoordsTextureHeight,
      sharedCellCoordsBuffer,
      sharedCellCoords
    };
  };
  var initSharedCellData = (cellOptions, config) => {
    const numCells = getNumCellsFromOptions(cellOptions);
    const sharedCellAttributes = new Float32Array(
      arrayBuffer(11 * numCells * 4, config.multiThreading?.enabled)
    );
    const sharedCellCollectionAttributes = new Float32Array(
      arrayBuffer(3 * 4, config.multiThreading?.enabled)
    ).fill(-1);
    const cellCoordsData = initSharedCellCoordsData(cellOptions, config);
    const cellWeightsData = initSharedCellWeightsData(cellOptions, config);
    const cellIdsData = initSharedCellIdsData(cellOptions, config);
    const cellMediaVersionsData = initSharedCellMediaVersionsData(
      cellOptions,
      config
    );
    const cells = SharedCellCollection.from(
      (Array.isArray(cellOptions) ? cellOptions : [...Array(numCells)]).map(
        (d, index) => new SharedCell(
          {
            id: index,
            index,
            group: index
          },
          cellCoordsData.sharedCellCoords,
          sharedCellAttributes,
          cellWeightsData.sharedCellWeights,
          cellMediaVersionsData.sharedCellMediaVersions,
          cellIdsData.sharedCellIds
        )
      ),
      sharedCellCollectionAttributes
    );
    return {
      cells,
      sharedCellAttributes,
      sharedCellCollectionAttributes,
      ...cellCoordsData,
      ...cellMediaVersionsData,
      ...cellWeightsData,
      ...cellIdsData,
      ...initSharedCellNeighborsData(cellOptions, config)
    };
  };

  // scripts/vendor/voroforce/common/data/shared-data.js
  var SharedData = class {
    constructor(data) {
      this.data = data;
    }
    set pointer(p) {
      this.data[0] = p.x;
      this.data[1] = p.y;
      this.data[2] = p.index !== void 0 ? p.index : -1;
    }
    get pointer() {
      return {
        x: this.data[0],
        y: this.data[1],
        index: this.data[2] !== -1 ? this.data[2] : void 0
      };
    }
    get centerForceX() {
      return this.data[8];
    }
    set centerForceX(value) {
      this.data[8] = value;
    }
    get centerForceY() {
      return this.data[9];
    }
    set centerForceY(value) {
      this.data[9] = value;
    }
    get centerForceStrengthMod() {
      return this.data[10];
    }
    set centerForceStrengthMod(value) {
      this.data[10] = value;
    }
  };

  // scripts/vendor/voroforce/common/data/shared-pointer.js
  var SharedPointer = class {
    constructor(data) {
      this.data = data;
      this.zoom = 1;
    }
    get x() {
      return this.data[0] !== -1 ? this.data[0] : void 0;
    }
    set x(value) {
      this.data[0] = value !== void 0 ? value : -1;
    }
    get y() {
      return this.data[1] !== -1 ? this.data[1] : void 0;
    }
    set y(value) {
      this.data[1] = value !== void 0 ? value : -1;
    }
    get index() {
      return this.data[2] !== -1 ? this.data[2] : void 0;
    }
    set index(value) {
      this.data[2] = value !== void 0 ? value : -1;
    }
    get indices() {
      return [
        this.data[2] !== -1 ? this.data[2] : void 0,
        this.data[3] !== -1 ? this.data[3] : void 0,
        this.data[4] !== -1 ? this.data[4] : void 0,
        this.data[5] !== -1 ? this.data[5] : void 0
      ];
    }
    set indices(value) {
      this.data[2] = value?.[0] !== void 0 ? value[0] : -1;
      this.data[3] = value?.[1] !== void 0 ? value[1] : -1;
      this.data[4] = value?.[2] !== void 0 ? value[2] : -1;
      this.data[5] = value?.[3] !== void 0 ? value[3] : -1;
    }
    get speedScale() {
      return this.data[6];
    }
    set speedScale(value) {
      this.data[6] = value;
    }
    get zoom() {
      return this.data[7];
    }
    set zoom(value) {
      this.data[7] = value;
    }
  };

  // scripts/vendor/voroforce/common/data/init-shared-data.js
  var initSharedData = (config) => {
    const sharedDataBuffer = arrayBuffer(11 * 4, config.multiThreading?.enabled);
    const sharedDataArray = new Float32Array(sharedDataBuffer);
    const sharedData = new SharedData(sharedDataArray);
    const sharedPointer = new SharedPointer(sharedDataArray);
    return {
      sharedDataBuffer,
      sharedDataArray,
      sharedData,
      sharedPointer
    };
  };

  // scripts/vendor/voroforce/common/data/shared-loaded-media-version-layers-data.js
  var SharedLoadedMediaVersionLayersData = class {
    constructor(data) {
      this.data = data;
    }
    getLayerStatus(layerIndex) {
      switch (this.data[layerIndex]) {
        case 1:
          return "loading";
        case 2:
          return "loaded";
      }
      return "empty";
    }
    setLayerLoading(layerIndex) {
      this.data[layerIndex] = 1;
    }
    setLayerLoaded(layerIndex) {
      this.data[layerIndex] = 2;
    }
    isLayerLoaded(layerIndex) {
      return this.data[layerIndex] === 2;
    }
  };

  // scripts/vendor/voroforce/common/data/init-shared-loaded-media-version-layers-data.js
  var initSharedLoadedMediaVersionLayersData = (config) => {
    const sharedLoadedMediaVersionLayersDataBuffers = config.media.versions.map(
      (version) => arrayBuffer(version.layers * 2, config.multiThreading?.enabled)
    );
    const sharedLoadedMediaVersionLayersDataArrays = sharedLoadedMediaVersionLayersDataBuffers.map(
      (buffer) => new Uint16Array(buffer)
    );
    const sharedLoadedMediaVersionLayersData = sharedLoadedMediaVersionLayersDataArrays.map(
      (array) => new SharedLoadedMediaVersionLayersData(array)
    );
    return {
      sharedLoadedMediaVersionLayersDataBuffers,
      sharedLoadedMediaVersionLayersDataArrays,
      sharedLoadedMediaVersionLayersData
    };
  };

  // scripts/vendor/voroforce/utils/custom-event-target.js
  var CustomEventTarget = class extends EventTarget {
    listen(type, callback, options) {
      this.addEventListener(type, callback, options);
    }
    listenOnce(type, callback, options) {
      this.addEventListener(type, callback, {
        ...options,
        once: true
      });
    }
    unlisten(type, callback, options) {
      this.removeEventListener(type, callback, options);
    }
  };

  // scripts/vendor/voroforce/common/helpers/dimensions.js
  var DimensionsEvent = class extends Event {
    constructor(data = {}) {
      super("resize");
      this.data = data;
    }
  };
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  var _state;
  var Dimensions = class extends CustomEventTarget {
    constructor(container, state) {
      super();
      __privateAdd(this, _state);
      __publicField(this, "handleResize");
      if (container) {
        this.container = container;
        this.update();
        const handleResize = () => {
          this.update();
          this.dispatchDimensionsEvent();
        };
        this.handleResize = debounce(handleResize, 100);
        window.addEventListener("resize", this.handleResize);
      } else if (state) {
        __privateSet(this, _state, state);
      }
    }
    dispatchDimensionsEvent() {
      this.dispatchEvent(new DimensionsEvent(__privateGet(this, _state)));
    }
    onResize(cb) {
      this.addEventListener("resize", cb);
    }
    update() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const diagonal = Math.sqrt(width ** 2 + height ** 2);
      const aspect = width / height;
      const pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2);
      __privateSet(this, _state, {
        width,
        height,
        diagonal,
        aspect,
        pixelRatio
      });
    }
    setState(s) {
      Object.assign(__privateGet(this, _state), typeof s === "function" ? s(__privateGet(this, _state)) : s);
      this.dispatchDimensionsEvent();
    }
    set(s) {
      this.setState(s);
    }
    getState(key) {
      if (key) {
        return __privateGet(this, _state)[key];
      }
      return __privateGet(this, _state);
    }
    get(key) {
      return this.getState(key);
    }
    get width() {
      return this.getState("width");
    }
    get height() {
      return this.getState("height");
    }
    get diagonal() {
      return this.getState("diagonal");
    }
    get aspect() {
      return this.getState("aspect");
    }
    get pixelRatio() {
      return this.getState("pixelRatio");
    }
    dispose() {
      if (this.handleResize) {
        window.removeEventListener("resize", this.handleResize);
      }
    }
  };
  _state = new WeakMap();

  // scripts/vendor/voroforce/common/helpers/loader.js
  var LoaderEvent = class extends Event {
    constructor(name, data) {
      super(name ?? "loaded");
      this.data = data;
    }
  };
  var Loader = class extends CustomEventTarget {
    constructor(sharedLoadedMediaVersionLayersData, config) {
      super();
      this.sharedLoadedMediaVersionLayersData = sharedLoadedMediaVersionLayersData?.sharedLoadedMediaVersionLayersData;
      this.config = config.media;
      this.loadedIndex = 0;
      this.loadingMediaLayers = 0;
      this.mediaLayerQueue = [];
      this.mediaLayerQueueKeys = /* @__PURE__ */ new Set();
      this.mediaLayerSourceCache = /* @__PURE__ */ new Map();
      this.maxConcurrentMediaLayerLoads = config.media?.maxConcurrentLoads ?? 24;
    }
    preloadAllMediaLayersVersion0(onLoad) {
      const count = this.config.versions[0].layers;
      let loaded = 0;
      const onLoadLayer = () => {
        loaded++;
        if (loaded === count) {
          this.dispatchEvent(new LoaderEvent("preloaded"));
          onLoad?.();
        }
      };
      for (let i = 0; i < count; i++) {
        void this.loadMediaLayer(0, i, onLoadLayer);
      }
    }
    preloadFirstMediaLayerAllGridVersions(onLoad) {
      const count = this.config.versions.filter(
        ({ type }) => !type || type === "compressed-grid"
      ).length;
      let loaded = 0;
      const onLoadLayer = () => {
        loaded++;
        if (loaded === count) {
          this.dispatchEvent(new LoaderEvent("preloaded"));
          onLoad?.();
        }
      };
      for (let i = 0; i < count; i++) {
        const type = this.config.versions[i].type;
        if (type && type !== "compressed-grid") continue;
        void this.loadMediaLayer(i, 0, onLoadLayer);
      }
    }
    async loadMediaLayer(versionIndex, layerIndex, onLoad) {
      if (this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] !== 0)
        return;
      const baseUrl = this.config.baseUrl;
      const config = this.config.versions[versionIndex];
      const ext = !config.type || config.type === "compressed-grid" ? this.config.compressionFormat : void 0;
      let src;
      if (typeof config.layerSrcFormat === "function") {
        src = await config.layerSrcFormat(layerIndex, this.store);
      } else {
        src = `${config.layerSrcFormat.startsWith("/") ? baseUrl : ""}${config.layerSrcFormat.replaceAll("{INDEX}", `${(config.layerIndexStart ?? 0) + layerIndex}`).replaceAll("{EXT}", ext)}`;
      }
      if (!src) return;
      this.loadingMediaLayers++;
      this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 1;
      let bytes;
      const type = config.type ?? "compressed-grid";
      const isDds = ext === "dds";
      const isKtx = ext === "ktx";
      if (isDds) {
        const MAGIC = 542327876;
        const DDPF_FOURCC = 4;
        const FOURCC_DXT1 = 827611204;
        const response = await fetch(src);
        const arrayBuffer2 = await response.arrayBuffer();
        const header = new Int32Array(arrayBuffer2, 0, 31);
        if (header[0] !== MAGIC) {
          console.log("src", src);
          throw new Error("Invalid DDS file format");
        }
        const height = header[3];
        const width = header[4];
        const pixelFormat = header[20];
        if (!(pixelFormat & DDPF_FOURCC)) {
          throw new Error("Unsupported DDS format: not compressed");
        }
        const fourCC = header[21];
        const blockSize = 8;
        if (fourCC !== FOURCC_DXT1) {
          throw new Error("Unsupported DDS format: not DXT1");
        }
        const size = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockSize;
        bytes = new Uint8Array(arrayBuffer2, 128, size);
      } else if (isKtx) {
        const response = await fetch(src);
        const arrayBuffer2 = await response.arrayBuffer();
        const idCheck = [
          171,
          75,
          84,
          88,
          32,
          49,
          49,
          187,
          13,
          10,
          26,
          10
        ];
        const id = new Uint8Array(arrayBuffer2, 0, 12);
        for (let i = 0; i < id.length; i++)
          if (id[i] !== idCheck[i])
            return console.error("File missing KTX identifier");
        const size = Uint32Array.BYTES_PER_ELEMENT;
        const head = new DataView(arrayBuffer2, 12, 13 * size);
        const littleEndian = head.getUint32(0, true) === 67305985;
        const glType = head.getUint32(size, littleEndian);
        if (glType !== 0) {
          throw new Error("only compressed formats currently supported");
        }
        const bytesOfKeyValueData = head.getUint32(12 * size, littleEndian);
        let offset = 12 + 13 * 4 + bytesOfKeyValueData;
        const levelSize = new Int32Array(arrayBuffer2, offset, 1)[0];
        offset += 4;
        bytes = new Uint8Array(arrayBuffer2, offset, levelSize);
      } else {
        async function loadImage(src2) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              URL.revokeObjectURL(img.src);
              resolve(img);
            };
            img.onerror = () => {
              reject(new Error("Failed to load image"));
            };
            img.src = src2;
          });
        }
        if (typeof src !== "string") {
          bytes = src;
        } else if (!this.mediaLayerSourceCache.has(src)) {
          this.mediaLayerSourceCache.set(
            src,
            (async () => {
              const blob = await (await fetch(src, {
                // mode: 'no-cors',
              })).blob();
              return loadImage(URL.createObjectURL(blob));
            })().catch((error) => {
              this.mediaLayerSourceCache.delete(src);
              throw error;
            })
          );
        }
        if (typeof src === "string") {
          bytes = await this.mediaLayerSourceCache.get(src);
        }
      }
      this.loadedIndex++;
      this.dispatchEvent(
        new LoaderEvent("mediaLayerLoaded", {
          bytes,
          versionIndex,
          layerIndex,
          type,
          isCompressed: isDds
        })
      );
      this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 2;
      onLoad?.();
      this.loadingMediaLayers--;
      this.drainMediaLayerQueue();
      this.checkFinish();
    }
    checkFinish() {
      if (this.loadingMediaLayers === 0) {
        this.dispatchEvent(new LoaderEvent("idle"));
      }
    }
    drainMediaLayerQueue() {
      while (this.loadingMediaLayers < this.maxConcurrentMediaLayerLoads && this.mediaLayerQueue.length > 0) {
        const { versionIndex, layerIndex } = this.mediaLayerQueue.shift();
        const key = `${versionIndex}:${layerIndex}`;
        this.mediaLayerQueueKeys.delete(key);
        void this.loadMediaLayer(versionIndex, layerIndex).catch((error) => {
          this.loadingMediaLayers = Math.max(0, this.loadingMediaLayers - 1);
          this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 0;
          console.error(error);
          this.drainMediaLayerQueue();
          this.checkFinish();
        });
      }
    }
    requestMediaLayerLoad(versionIndex, layers) {
      layers.forEach((layerIndex) => {
        const key = `${versionIndex}:${layerIndex}`;
        if (this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] === 0 && !this.mediaLayerQueueKeys.has(key)) {
          this.mediaLayerQueueKeys.add(key);
          this.mediaLayerQueue.push({ versionIndex, layerIndex });
        }
      });
      this.drainMediaLayerQueue();
    }
    load(src, onLoad) {
      let mediaElement;
      let loadEventName;
      if (src.endsWith(".mp4")) {
        loadEventName = "onplay";
        mediaElement = document.createElement("video");
        mediaElement.autoplay = true;
        mediaElement.loop = true;
        mediaElement.muted = true;
        mediaElement.playsInline = true;
        mediaElement.crossOrigin = "anonymous";
        mediaElement.src = src;
        void mediaElement.play();
      } else {
        loadEventName = "onload";
        mediaElement = new Image();
        mediaElement.src = src;
        mediaElement.crossOrigin = "anonymous";
      }
      mediaElement[loadEventName] = () => {
        this.dispatchEvent(new LoaderEvent("loaded", mediaElement));
        onLoad?.(mediaElement);
      };
    }
  };

  // scripts/vendor/voroforce/common/helpers/store.js
  function stripFunctions(obj) {
    if (typeof obj !== "object" || obj === null) return obj;
    if (Array.isArray(obj)) {
      return obj.map(stripFunctions);
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== "function") {
        result[key] = stripFunctions(value);
      }
    }
    return result;
  }
  var StoreEvent = class extends Event {
    constructor(state = {}) {
      super("state");
      this.state = state;
    }
  };
  var CustomStoreEvent = class extends Event {
    constructor(key, value) {
      super(`${key}`);
      this.value = value;
    }
  };
  var _state2;
  var _Store = class _Store extends CustomEventTarget {
    constructor(initialState) {
      super();
      __privateAdd(this, _state2);
      __privateSet(this, _state2, initialState);
    }
    setState(...args) {
      if (args.length > 1) {
        __privateGet(this, _state2)[args[0]] = typeof args[1] === "function" ? args[1](__privateGet(this, _state2)[args[0]]) : args[1];
        this.dispatchEvent(new CustomStoreEvent(args[0], __privateGet(this, _state2)[args[0]]));
      } else {
        Object.assign(
          __privateGet(this, _state2),
          typeof args[0] === "function" ? args[0](__privateGet(this, _state2)) : args[0]
        );
      }
      this.dispatchEvent(new StoreEvent(__privateGet(this, _state2)));
    }
    set(...args) {
      this.setState(...args);
      return this;
    }
    getState(key) {
      if (key) {
        return __privateGet(this, _state2)[key];
      }
      return __privateGet(this, _state2);
    }
    get(key) {
      return this.getState(key);
    }
    static fromSimulationWorkerState(state) {
      const {
        dimensions,
        cells,
        sharedDataArray,
        sharedPointerArray,
        sharedCellCoords,
        sharedCellAttributes,
        sharedCellWeights,
        sharedCellIds,
        sharedCellMediaVersions,
        sharedCellCollectionAttributes,
        sharedLoadedMediaVersionLayersDataArrays
      } = state;
      return new _Store(state).set("dimensions", new Dimensions(null, dimensions)).set(
        "cells",
        SharedCellCollection.from(
          cells.map(
            (cell) => new SharedCell(
              cell,
              sharedCellCoords,
              sharedCellAttributes,
              sharedCellWeights,
              sharedCellMediaVersions,
              sharedCellIds
            )
          ),
          sharedCellCollectionAttributes
        )
      ).set("sharedData", new SharedData(sharedDataArray)).set("sharedPointer", new SharedPointer(sharedDataArray)).set(
        "sharedLoadedMediaVersionLayersData",
        sharedLoadedMediaVersionLayersDataArrays?.map(
          (arr) => new SharedLoadedMediaVersionLayersData(arr)
        )
      );
    }
    getSimulationWorkerConfig() {
      const { display: _, media, ...config } = this.get("config");
      config.media = stripFunctions(media);
      return config;
    }
    getSimulationWorkerState() {
      const {
        ticker,
        dimensions,
        loader,
        controls,
        container,
        canvas,
        config,
        ...rest
      } = __privateGet(this, _state2);
      return {
        ...rest,
        config: this.getSimulationWorkerConfig(),
        dimensions: dimensions?.getState()
      };
    }
    dispose() {
      __privateSet(this, _state2, null);
    }
  };
  _state2 = new WeakMap();
  var Store = _Store;

  // scripts/vendor/voroforce/common/helpers/ticker/utils.js
  var TickEvent = class extends Event {
    constructor({ current, elapsed, delta }) {
      super("tick");
      this.current = current;
      this.elapsed = elapsed;
      this.delta = delta;
    }
  };

  // scripts/vendor/voroforce/common/helpers/ticker/auto-ticker.js
  var AutoTicker = class extends CustomEventTarget {
    constructor(fpsGraph, fpsCap = 60) {
      super();
      this.fpsGraph = fpsGraph;
      this.elapsed = 0;
      this.delta = 16;
      this.tick = this.tick.bind(this);
      this.fpsCap = fpsCap;
      this.frameInterval = 1e3 / this.fpsCap;
      this.current = this.initialFrameTime = this.lastFrameTime = 0;
    }
    init() {
      this.current = this.initialFrameTime = this.lastFrameTime = performance.now();
    }
    start() {
      if (this.killed) return;
      if (this.running) return;
      this.running = true;
      this.init();
      requestAnimationFrame(this.tick);
    }
    stop() {
      this.running = false;
    }
    kill() {
      this.killed = true;
    }
    tick() {
      if (!this.running) return;
      this.fpsGraph?.end();
      this.fpsGraph?.begin();
      requestAnimationFrame(this.tick);
      const currentTime = performance.now();
      this.delta = currentTime - this.current;
      if (this.delta >= this.frameInterval) {
        this.current = currentTime - this.delta % this.frameInterval;
        this.elapsed = this.current - this.initialFrameTime;
        this.dispatchEvent(
          new TickEvent({
            delta: this.delta,
            current: this.current,
            elapsed: this.elapsed
          })
        );
      }
    }
    freeze() {
      this.stop();
    }
    unfreeze() {
      this.start();
    }
  };

  // scripts/vendor/voroforce/common/helpers/ticker/manual-ticker.js
  var ManualTicker = class extends CustomEventTarget {
    constructor(fpsGraph) {
      super();
      __publicField(this, "nextRequests", 0);
      __publicField(this, "totalPausedTime", 0);
      __publicField(this, "pauseStart", 0);
      __publicField(this, "running", false);
      this.fpsGraph = fpsGraph;
      this.lastFrameTime = performance.now();
      this.current = this.lastFrameTime;
      this.pauseStart = this.lastFrameTime;
      this.elapsed = 0;
      this.delta = 16;
      this.tick = this.tick.bind(this);
    }
    start() {
      if (this.killed) return;
      if (this.running) return;
      this.running = true;
      if (this.pauseStart) {
        this.totalPausedTime += performance.now() - this.pauseStart;
      }
      requestAnimationFrame(this.tick);
    }
    stop() {
      this.running = false;
      this.pauseStart = performance.now();
      this.nextRequests = 0;
    }
    kill() {
      this.stop();
      this.killed = true;
    }
    tick() {
      this.nextRequests = 0;
      this.fpsGraph?.end();
      this.fpsGraph?.begin();
      const currentTime = performance.now();
      this.delta = currentTime - this.current;
      this.current = currentTime;
      this.elapsed = this.current - this.lastFrameTime - this.totalPausedTime;
      this.dispatchEvent(
        new TickEvent({
          delta: this.delta,
          current: this.current,
          elapsed: this.elapsed
        })
      );
    }
    next() {
      if (!this.running) return;
      this.nextRequests++;
      if (this.nextRequests !== 2) return;
      requestAnimationFrame(this.tick);
    }
    freeze() {
      this.stop();
    }
    unfreeze() {
      this.start();
    }
  };

  // scripts/vendor/voroforce/common/lattice/lattice.js
  function packLattice(cells, latticeConfig, immediate = false) {
    const numCells = cells?.length;
    if (numCells <= 0) {
      return cells;
    }
    const {
      cellWidth,
      cellHeight,
      rows,
      cols,
      plusHalfSize,
      hexagonal,
      offsetX = 0,
      offsetY = 0
    } = latticeConfig;
    let index = 0;
    let cell;
    let x;
    let y;
    for (let row = 0; row < rows; row++) {
      y = row * cellHeight + (plusHalfSize ? cellHeight / 2 : 0);
      y += offsetY;
      for (let col = 0; col < cols; col++) {
        cell = cells[index];
        if (!cell) break;
        x = col * cellWidth + (plusHalfSize ? cellWidth / 2 : 0);
        x += offsetX;
        if (immediate) {
          cell.x = x;
          cell.y = y;
        }
        cell.ix = x;
        cell.iy = y - (hexagonal && col % 2 === 0 ? cellHeight / 2 : 0);
        cell.row = row;
        cell.col = col;
        index++;
      }
    }
    return cells;
  }
  function generateCenterOutwardSubgridsAndAssignCellIds(latticeConfig, cells) {
    const {
      rows: totalRows,
      cols: totalCols,
      autoTargetMediaVersion2SubgridCount = 0,
      autoTargetMediaVersion1SubgridCount = 0
    } = latticeConfig;
    const elementCount = cells.length;
    const centerRow = Math.floor(totalRows / 2);
    const centerCol = Math.floor(totalCols / 2);
    const subgridConfig = latticeConfig.subgrid;
    const SUBGRID_ROWS = subgridConfig.rows;
    const SUBGRID_COLS = subgridConfig.cols;
    const SUBGRID_SIZE = SUBGRID_ROWS * SUBGRID_COLS;
    const SUBGRID_MAX_SUPPORTED_CAPACITY = subgridConfig.totalCapacity;
    const result = [];
    if (subgridConfig.virtualFallback) {
      for (let i = 0; i < elementCount; i += 1) {
        const cell = cells[i];
        if (!cell) continue;
        cell.id = i % SUBGRID_MAX_SUPPORTED_CAPACITY;
        cell.subgrid = Math.floor(cell.id / SUBGRID_SIZE);
        cell.subgridIndex = cell.id % SUBGRID_SIZE;
      }
      return result;
    }
    const maxCompleteSubgrids = Math.floor(elementCount / SUBGRID_SIZE);
    let remainingElements = elementCount;
    let direction = 0;
    let currentGridRow = 0;
    let currentGridCol = 0;
    const subgridOffsetRow = Math.floor(SUBGRID_ROWS / 2);
    const subgridOffsetCol = Math.floor(SUBGRID_COLS / 2);
    const visited = /* @__PURE__ */ new Set();
    visited.add("0,0");
    let currentCellId = 0;
    let currentSubgrid = 0;
    let currentSubgridIndex = 0;
    const addSubgrid = (gridRow, gridCol) => {
      const startRow = centerRow - subgridOffsetRow + gridRow * SUBGRID_ROWS;
      const startCol = centerCol - subgridOffsetCol + gridCol * SUBGRID_COLS;
      for (let r = 0; r < SUBGRID_ROWS && remainingElements > 0; r++) {
        for (let c = 0; c < SUBGRID_COLS && remainingElements > 0; c++) {
          const row = startRow + r;
          const col = startCol + c;
          if (row >= 0 && row < totalRows && col >= 0 && col < totalCols) {
            const cellIndex = row * totalCols + col;
            const cell = cells[cellIndex];
            if (cell) {
              result.push([row, col]);
              currentSubgrid = Math.floor(currentCellId / SUBGRID_SIZE);
              currentSubgridIndex = Math.floor(currentCellId % SUBGRID_SIZE);
              if (!cell.id) {
                cell.id = currentCellId;
                cell.subgrid = currentSubgrid;
                cell.subgridIndex = currentSubgridIndex;
              }
              if (cell.subgrid < autoTargetMediaVersion2SubgridCount) {
                cell.targetMediaVersion = 2;
              } else if (cell.subgrid < autoTargetMediaVersion1SubgridCount) {
                cell.targetMediaVersion = 1;
              }
              currentCellId++;
              if (currentCellId > SUBGRID_MAX_SUPPORTED_CAPACITY - 1) {
                currentCellId = 0;
              }
              remainingElements--;
            }
          }
        }
      }
    };
    addSubgrid(0, 0);
    const dirMovements = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0]
    ];
    let stepsInCurrentDirection = 1;
    let stepsTaken = 0;
    let directionChanges = 0;
    while (remainingElements > 0 && result.length < elementCount) {
      const [rowDelta, colDelta] = dirMovements[direction];
      currentGridRow += rowDelta;
      currentGridCol += colDelta;
      stepsTaken++;
      const posKey = `${currentGridRow},${currentGridCol}`;
      if (!visited.has(posKey)) {
        visited.add(posKey);
        addSubgrid(currentGridRow, currentGridCol);
      }
      if (stepsTaken === stepsInCurrentDirection) {
        direction = (direction + 1) % 4;
        stepsTaken = 0;
        directionChanges++;
        if (directionChanges % 2 === 0) {
          stepsInCurrentDirection++;
        }
      }
    }
    return result;
  }
  function calculateOptimalLattice(width, height, numCells, cellAspect, latticeAspect, latticeAspectConstraints) {
    const containerWidth = width;
    const containerHeight = height;
    const maxColumns = Math.min(numCells, Math.ceil(containerWidth));
    const minColumns = 1;
    let bestLayout = null;
    let minOverflow = Number.POSITIVE_INFINITY;
    for (let cols = minColumns; cols <= maxColumns; cols++) {
      const rows = Math.ceil(numCells / cols);
      const minCellWidth = containerWidth / cols;
      const minCellHeight = containerHeight / rows;
      let cellWidth = minCellWidth;
      let cellHeight = cellWidth / cellAspect;
      if (cellHeight * rows < containerHeight) {
        cellHeight = minCellHeight;
        cellWidth = cellHeight * cellAspect;
      }
      const latticeWidth = cellWidth * cols;
      const latticeHeight = cellHeight * rows;
      if (latticeWidth >= containerWidth && latticeHeight >= containerHeight) {
        const overflowWidth = latticeWidth - containerWidth;
        const overflowHeight = latticeHeight - containerHeight;
        const totalOverflow = overflowWidth * latticeHeight + overflowHeight * containerWidth - overflowWidth * overflowHeight;
        if (totalOverflow < minOverflow) {
          minOverflow = totalOverflow;
          bestLayout = {
            numCells,
            cols,
            rows,
            cellWidth,
            cellHeight,
            containerWidth,
            containerHeight,
            latticeWidth,
            latticeHeight,
            offsetX: -(latticeWidth - containerWidth) / 2,
            offsetY: -(latticeHeight - containerHeight) / 2
            // overflowX: overflowWidth,
            // overflowY: overflowHeight,
            // overflowPercent:
            //   (totalOverflow / (containerWidth * containerHeight)) * 100,
          };
        }
      }
    }
    if (!bestLayout) {
      const cellWidth = containerWidth;
      const cellHeight = containerHeight;
      bestLayout = {
        numCells,
        cols: 1,
        rows: 1,
        cellWidth,
        cellHeight,
        containerWidth,
        containerHeight,
        latticeWidth: cellWidth,
        latticeHeight: cellHeight,
        offsetX: 0,
        offsetY: 0
        // overflowX: 0,
        // overflowY: 0,
        // overflowPercent: 0,
      };
    }
    return bestLayout;
  }
  var handleLattice = (globalConfig, cells, width, height) => {
    const config = globalConfig.lattice;
    config.subgrid = globalConfig.media.versions.filter(({ type }) => !type || type === "compressed-grid").reduce(
      (prev, mediaVersion = {}) => {
        const layerCapacity = mediaVersion.cols * mediaVersion.rows;
        const totalCapacity = Math.min(
          prev.totalCapacity,
          layerCapacity * mediaVersion.layers
        );
        if (layerCapacity < prev.layerCapacity) {
          return {
            cols: mediaVersion.cols,
            rows: mediaVersion.rows,
            layers: mediaVersion.layers,
            layerCapacity,
            totalCapacity
          };
        }
        prev.totalCapacity = totalCapacity;
        return prev;
      },
      {
        layerCapacity: 9999999,
        totalCapacity: 9999999
      }
    );
    if (!config.subgrid.rows || !config.subgrid.cols) {
      const virtualMediaVersion = globalConfig.media.versions.find(
        ({ type }) => type && type !== "compressed-grid"
      );
      if (virtualMediaVersion) {
        const layerCapacity = virtualMediaVersion.virtualCols * virtualMediaVersion.virtualRows;
        config.subgrid = {
          cols: virtualMediaVersion.virtualCols,
          rows: virtualMediaVersion.virtualRows,
          layers: virtualMediaVersion.virtualLayers ?? virtualMediaVersion.layers,
          layerCapacity,
          totalCapacity: layerCapacity * (virtualMediaVersion.layers || 1),
          virtualFallback: true
        };
      }
    }
    const prevRows = config.rows;
    const prevCols = config.cols;
    let containerWidth = width;
    let containerHeight = height;
    if (config.latticeAspect === 1 && config.latticeAspectConstraints === "min") {
      const min2 = Math.min(width, height);
      containerWidth = containerHeight = min2;
    }
    Object.assign(
      config,
      calculateOptimalLattice(
        containerWidth,
        containerHeight,
        cells.length,
        config.aspect,
        config.latticeAspect,
        config.latticeAspectConstraints
      )
    );
    config.offsetX = -(config.latticeWidth - containerWidth) / 2 - (containerWidth - width) / 2;
    config.offsetY = -(config.latticeHeight - containerHeight) / 2 - (containerHeight - height) / 2;
    if (config.targetCellSizeViewportPercentage) {
      const landscape = width > height;
      const targetCellSize = (landscape ? width : height) * config.targetCellSizeViewportPercentage;
      const factor = targetCellSize / config[landscape ? "cellWidth" : "cellHeight"];
      config.cellWidth *= factor;
      config.cellHeight *= factor;
      config.latticeWidth *= factor;
      config.latticeHeight *= factor;
      config.offsetX = -(config.latticeWidth - containerWidth) / 2 + (containerWidth - width) / 2;
      config.offsetY = -(config.latticeHeight - containerHeight) / 2 + (containerHeight - height) / 2;
    }
    generateCenterOutwardSubgridsAndAssignCellIds(config, cells);
    const immediate = prevRows !== config.rows || prevCols !== config.cols;
    config.latticeScale = 1;
    packLattice(cells, config, immediate);
  };

  // scripts/vendor/voroforce/controls/default-controls-config.js
  var defaultControlsConfig = {
    debug: false,
    autoFocusCenter: {
      enabled: true,
      // true, false or 'touch'
      random: false,
      baseRandomOffsetPercentage: 0.1
    },
    maxSpeed: 10,
    // maxSpeedPinned: 5,
    ease: 0.15,
    // smoothing factor
    // easePinned: 0.05,
    zoom: {
      enabled: true,
      min: 1,
      max: 1.5
    },
    freezeOnShake: {
      enabled: true
    },
    freezeOnJolt: {
      enabled: true
    }
  };

  // scripts/vendor/voroforce/controls/controls-events.js
  var PointerShakeEvent = class extends Event {
    constructor(data) {
      super("pointerShake");
      Object.assign(this, data);
    }
  };
  var PointerFrozenChangeEvent = class extends Event {
    constructor(data) {
      super("pointerFrozenChange");
      Object.assign(this, data);
    }
  };
  var PointerPinnedChangeEvent = class extends Event {
    constructor(data) {
      super("pointerPinnedChange");
      Object.assign(this, data);
    }
  };
  var CellFocusedEvent = class extends Event {
    constructor(cell, cells) {
      super("focused");
      this.cell = cell;
      this.cells = cells;
    }
  };
  var CellSelectedEvent = class extends Event {
    constructor(cell, cells) {
      super("selected");
      this.cell = cell;
      this.cells = cells;
    }
  };

  // scripts/vendor/voroforce/controls/utils/auto-focus-center.js
  var autoFocusCenterEnabled = (config) => config.autoFocusCenter?.enabled && (config.autoFocusCenter.enabled !== "touch" || isTouchDevice);
  var autoFocusCenterBaseRandomOffsetPercentage = (config) => config.autoFocusCenter?.random ? config.autoFocusCenter?.baseRandomOffsetPercentage ?? 0.1 : 0;

  // scripts/vendor/voroforce/controls/utils/cell.js
  var getCellIndex = (cellOrCellIndex) => {
    if (cellOrCellIndex === null || cellOrCellIndex === void 0) return;
    return typeof cellOrCellIndex === "number" ? cellOrCellIndex : cellOrCellIndex.index;
  };
  var getCell = (cellOrCellIndex, cells) => {
    if (cellOrCellIndex === null || cellOrCellIndex === void 0) return;
    return typeof cellOrCellIndex === "number" ? cells[cellOrCellIndex] : cellOrCellIndex;
  };
  var getDirectionalNeighborCellIndex = (cell, direction, latticeConfig) => {
    const { cols, rows } = latticeConfig;
    const currentRow = cell.row;
    const currentCol = cell.col;
    let targetRow = currentRow;
    let targetCol = currentCol;
    switch (direction) {
      case "up":
        targetRow = Math.max(0, currentRow - 1);
        break;
      case "down":
        targetRow = Math.min(rows - 1, currentRow + 1);
        break;
      case "left":
        targetCol = Math.max(0, currentCol - 1);
        break;
      case "right":
        targetCol = Math.min(cols - 1, currentCol + 1);
        break;
    }
    if (targetRow === currentRow && targetCol === currentCol) {
      return null;
    }
    return targetRow * cols + targetCol;
  };

  // scripts/vendor/voroforce/controls/base-controls.js
  var BaseControls = class extends CustomEventTarget {
    constructor(store, display) {
      super();
      __publicField(this, "rawPosition");
      __publicField(this, "isTouching", false);
      __publicField(this, "isResizing", false);
      __publicField(this, "boundsPadding", 10);
      this.initGlobals(store, display);
      this.initProperties();
      this.handleFirstConfig();
      this.reset();
    }
    reset() {
      this.rawPosition = void 0;
      this.resetZoom();
    }
    initGlobals(store, display) {
      this.store = store;
      this.store.set("controls", this);
      this.globalConfig = this.store.get("config");
      this.config = this.globalConfig.controls;
      this.display = display;
    }
    initProperties() {
      this.container = this.store.get("container");
      this.dimensions = this.store.get("dimensions");
      this.pointer = this.store.get("sharedPointer");
      this.cells = this.store.get("cells");
      this.updateBounds();
      this.update = this.handleFirstUpdate;
    }
    handleFirstUpdate() {
      this.initEventListeners();
      this.update = this.handleUpdate;
      this.update();
    }
    handleFirstConfig() {
      this.container.style.setProperty("touch-action", "none");
      if (this.config.debug) this.logger = createLogger("controls");
      if (autoFocusCenterEnabled(this.config)) {
        this.handleAutoFocusCenter();
      }
      this.handleConfig();
    }
    handleAutoFocusCenter() {
      this.assignPointer(this.getAutoFocusCenter());
      this.update = this.handleAutoFocusUpdate;
    }
    handleConfig() {
    }
    updateConfig(config) {
      this.config = config;
      this.globalConfig.controls = config;
      this.handleConfig();
    }
    handleUpdate() {
      if (this.rawPosition) {
        this.assignPointer({
          x: this.rawPosition.x,
          y: this.rawPosition.y,
          speedScale: 0.2
          // tmp solution for omni force (base controls only)
        });
      }
      this.getCellIndices(this.pointer, (primaryIndex, indices) => {
        this.assignPointer({
          indices
        });
        this.focusCell(primaryIndex);
      });
    }
    getCellIndices(position, cb) {
      if (this.isResizing) return;
      if (Number.isNaN(position.x) || Number.isNaN(position.y)) return;
      this.display.getPositionCellIndices(position).then((indices) => {
        if (this.isResizing) return;
        const primaryIndex = indices?.[0];
        if (primaryIndex === void 0) {
          this.handlePointerOut();
          return false;
        }
        cb(primaryIndex, indices);
      });
    }
    getAutoFocusCenter() {
      const { width, height } = this.dimensions.get();
      const baseRandomOffsetPercentage = autoFocusCenterBaseRandomOffsetPercentage(this.config);
      return {
        x: Math.floor(
          width / 2 + (baseRandomOffsetPercentage ? (0.5 - Math.random()) * baseRandomOffsetPercentage * width : 0)
        ),
        y: Math.floor(
          height / 2 + (baseRandomOffsetPercentage ? (0.5 - Math.random()) * baseRandomOffsetPercentage * height : 0)
        )
      };
    }
    handleAutoFocusUpdate() {
      if (this.cells.focused) {
        this.update = this.handleFirstUpdate;
        return;
      }
      this.handleUpdate();
    }
    assignPointer(data) {
      Object.assign(this.pointer, data);
    }
    savePointer() {
      return {
        indices: this.pointer.indices,
        x: this.pointer.x,
        y: this.pointer.y,
        speedScale: 0
      };
    }
    updateRawPositionFromEvent(e) {
      this.rawPositionIdle = false;
      if (this.rawPositionIdleTimeout) {
        clearTimeout(this.rawPositionIdleTimeout);
      }
      this.rawPositionIdleTimeout = setTimeout(() => {
        this.rawPositionIdle = true;
        this.rawPositionIdleTimeout = void 0;
      }, 2e3);
      if (!this.rawPosition) this.rawPosition = {};
      Object.assign(this.rawPosition, {
        x: e.clientX || e.x,
        y: e.clientY || e.y
      });
    }
    onPointerDown(e) {
      if (this.isTouching) return;
      this.pointer.down = true;
      this.pointer.canDrag = true;
      this.pointer.downStartX = e.clientX || e.x;
      this.pointer.downStartY = e.clientY || e.y;
      this.logger?.debug("onPointerDown");
    }
    onPointerUp(e) {
      if (this.isTouching) return;
      this.pointer.down = false;
      this.pointer.canDrag = false;
      this.logger?.debug("onPointerUp");
    }
    onPointerMove(e) {
      this.updateRawPositionFromEvent(e);
      if (this.pointer.canDrag && !this.pointer.dragging) {
        const currentX = e.clientX || e.x;
        const currentY = e.clientY || e.y;
        const deltaX = currentX - this.pointer.downStartX;
        const deltaY = currentY - this.pointer.downStartY;
        const distance3 = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance3 > 20) this.pointer.dragging = true;
      }
    }
    onTouchMove(e) {
    }
    onTouchStart(e) {
      this.isTouching = true;
      this.logger?.debug("onTouchStart");
    }
    onTouchEnd(e) {
      this.isTouching = false;
      this.logger?.debug("onTouchEnd");
    }
    onBlur(event) {
      this.logger?.debug("onBlur");
      this.handlePointerOut();
    }
    onPointerOut(event) {
      if (this.isTouching) return;
      this.logger?.debug("onPointerOut");
      this.handlePointerOut();
    }
    handlePointerOut() {
      this.reset();
    }
    onPointerClick(e) {
      if (this.pointer.dragging) {
        this.pointer.dragging = false;
        return;
      }
      this.updateRawPositionFromEvent(e);
      this.requestSelection();
    }
    requestSelection() {
      let selectedCellIndex;
      if (!this.cells.selectedIndex) {
        if (this.pointer.index === this.cells.focusedIndex) {
          selectedCellIndex = this.cells.focusedIndex;
        }
      } else {
        if (this.cells.selectedIndex !== this.cells.focusedIndex) {
          selectedCellIndex = this.pointer.index;
        } else {
          this.deselect();
        }
      }
      if (selectedCellIndex !== void 0) {
        this.cells.selectedIndex = selectedCellIndex;
        this.dispatchEvent(new CellSelectedEvent(this.cells.selected));
        this.logger?.debug("select cell", this.cells.selectedIndex);
        return selectedCellIndex;
      }
    }
    deselect() {
      this.logger?.debug("deselect");
      this.cells.selectedIndex = void 0;
      this.dispatchEvent(new CellSelectedEvent(void 0));
      this.resetZoom();
    }
    initEventListeners() {
      this.logger?.debug("initEventListeners");
      this.boundOnBlur = this.onBlur.bind(this);
      this.boundOnPointerOut = this.onPointerOut.bind(this);
      this.boundOnPointerClick = this.onPointerClick.bind(this);
      this.boundOnTouchMove = this.onTouchMove.bind(this);
      this.boundOnTouchStart = this.onTouchStart.bind(this);
      this.boundOnTouchEnd = this.onTouchEnd.bind(this);
      this.boundOnPointerMove = this.onPointerMove.bind(this);
      this.boundOnPointerDown = this.onPointerDown.bind(this);
      this.boundOnPointerUp = this.onPointerUp.bind(this);
      window.addEventListener("blur", this.boundOnBlur);
      this.container.addEventListener("pointerout", this.boundOnPointerOut);
      if (isTouchDevice) {
        this.container.addEventListener("touchstart", this.boundOnTouchStart);
        this.container.addEventListener("touchmove", this.boundOnTouchMove);
        this.container.addEventListener("touchend", this.boundOnTouchEnd);
      } else {
        this.container.addEventListener("pointerdown", this.boundOnPointerDown);
        this.container.addEventListener("pointerup", this.boundOnPointerUp);
      }
      this.container.addEventListener("click", this.boundOnPointerClick);
      this.container.addEventListener("pointermove", this.boundOnPointerMove);
    }
    removeEventListeners() {
      window.removeEventListener("blur", this.boundOnBlur);
      this.container.removeEventListener("click", this.boundOnPointerClick);
      this.container.removeEventListener("pointermove", this.boundOnPointerMove);
      this.container.removeEventListener("pointerout", this.boundOnPointerOut);
      if (isTouchDevice) {
        this.container.removeEventListener("touchmove", this.boundOnTouchMove);
        this.container.removeEventListener("touchstart", this.boundOnTouchStart);
        this.container.removeEventListener("touchend", this.boundOnTouchEnd);
      } else {
        this.container.removeEventListener("pointerdown", this.boundOnPointerDown);
        this.container.removeEventListener("pointerup", this.boundOnPointerUp);
      }
    }
    startResize(dimensions) {
      this.logger?.debug("startResize");
      this.updateBounds();
      this.isResizing = true;
      this.assignPointer({
        x: void 0,
        y: void 0,
        indices: void 0,
        speedScale: 0
      });
      this.reset();
    }
    endResize(dimensions) {
      this.logger?.debug("endResize");
      this.isResizing = false;
      if (!this.cells.focused || this.outOfBounds(this.cells.focused)) {
        this.focusCell(void 0);
        if (autoFocusCenterEnabled(this.config)) {
          this.assignPointer(this.getAutoFocusCenter());
        }
        return;
      }
      this.assignPointer({
        x: this.cells.focused.x,
        y: this.cells.focused.y
      });
      this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells));
    }
    updateBounds() {
      const { width, height } = this.dimensions.get();
      this.bounds = [
        this.boundsPadding,
        this.boundsPadding,
        width - this.boundsPadding,
        height - this.boundsPadding
      ];
    }
    clampToBounds(position) {
      position.x = Math.min(Math.max(position.x, this.bounds[0]), this.bounds[2]);
      position.y = Math.min(Math.max(position.y, this.bounds[1]), this.bounds[3]);
      return position;
    }
    outOfBounds(position) {
      return !(position.x >= this.bounds[0] && position.x <= this.bounds[2] && position.y >= this.bounds[1] && position.y <= this.bounds[3]);
    }
    selectCell(cellOrCellIndex) {
      const cellIndex = getCellIndex(cellOrCellIndex);
      if (this.cells.selectedIndex !== cellIndex) {
        this.cells.selectedIndex = cellIndex;
        this.dispatchEvent(new CellSelectedEvent(this.cells.selected, this.cells));
        this.logger?.debug("select cell", this.cells.selectedIndex);
      }
    }
    focusCell(cellOrCellIndex) {
      const cellIndex = getCellIndex(cellOrCellIndex);
      if (this.cells.focusedIndex !== cellIndex) {
        this.cells.focusedIndex = cellIndex;
        this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells));
      }
    }
    hasSelection() {
      return this.cells.selectedIndex !== void 0;
    }
    hasFocus() {
      return this.cells.focusedIndex !== void 0;
    }
    focusedIsSelected() {
      return this.cells.focusedIndex === this.cells.selectedIndex;
    }
    resize(dimensions) {
      this.startResize();
      this.endResize();
    }
    dispose() {
      this.removeEventListeners();
    }
  };

  // scripts/vendor/voroforce/controls/utils/debug-marker.js
  var DebugMarker = class {
    constructor(container) {
      this.container = container;
      this.element = document.createElement("div");
      this.container.appendChild(this.element);
      setStyles(this.element, {
        width: "20px",
        height: "20px",
        "background-color": "red",
        "border-radius": "50%",
        "pointer-events": "none",
        position: "absolute",
        top: 0,
        left: 0,
        "z-index": 10,
        transform: "translate(-50%, -50%)"
      });
    }
    updatePosition(position) {
      setStyles(this.element, {
        left: `${position.x}px`,
        top: `${position.y}px`
      });
    }
    updateColor(color) {
      setStyles(this.element, {
        "background-color": color
      });
    }
    destroy() {
      this.container.removeChild(this.element);
      this.element = null;
    }
  };

  // scripts/vendor/voroforce/controls/utils/detach-gesture-handler.js
  var { max } = Math;
  var DetachGestureHandler = class {
    constructor(controls) {
      this.controls = controls;
    }
    detectDetachGesture() {
      return this.detectJolt() || this.detectShake();
    }
    detectJolt() {
      if (!this.controls.options.freezeOnJolt?.enabled) return;
      const detectedJolt = this.controls.rawSpeed.total > max(
        this.controls.avgRawSpeedTotal,
        this.controls.options.freezeOnJolt.minSpeedValue
      ) * this.controls.options.freezeOnJolt.factor;
      if (detectedJolt) this.controls.logger?.debug("detected jolt");
      return detectedJolt;
    }
    detectShake() {
      if (!this.controls.options.freezeOnShake?.enabled) return;
      if (this.controls.pointerFrozen || this.controls.rawSpeed.total <= this.controls.options.freezeOnShake.minSpeed) {
        this.resetShake();
        return;
      }
      const directionX = this.controls.rawSpeed.x > 0 ? "right" : this.controls.rawSpeed.x < 0 ? "left" : null;
      const directionY = this.controls.rawSpeed.y > 0 ? "down" : this.controls.rawSpeed.y < 0 ? "up" : null;
      if (this.lastShakeDirectionX && directionX && directionX !== this.lastShakeDirectionX) {
        this.shakeDirectionXChangeCount++;
        this.refreshShakeDirChangeTimeout();
      }
      if (this.lastShakeDirectionY && directionY && directionY !== this.lastShakeDirectionY) {
        this.shakeDirectionYChangeCount++;
        this.refreshShakeDirChangeTimeout();
      }
      this.lastShakeDirectionX = directionX;
      this.lastShakeDirectionY = directionY;
      if ((this.shakeDirectionXChangeCount >= this.controls.options.freezeOnShake.minShakes || this.shakeDirectionYChangeCount >= this.controls.options.freezeOnShake.minShakes) && !this.shakeCooldownActive) {
        this.controls.dispatchEvent(
          new PointerShakeEvent({
            pointer: this.controls.pointer,
            speed: this.controls.rawSpeed.total,
            directionXChanges: this.shakeDirectionXChangeCount,
            directionYChanges: this.shakeDirectionYChangeCount
          })
        );
        this.resetShake();
        this.shakeCooldownActive = true;
        setTimeout(() => {
          this.shakeCooldownActive = false;
        }, this.controls.options.freezeOnShake.cooldown);
        return true;
      }
    }
    resetShake() {
      this.shakeDirectionXChangeCount = 0;
      this.shakeDirectionYChangeCount = 0;
      this.lastShakeDirectionX = null;
      this.lastShakeDirectionX = null;
    }
    clearShakeDirChangeTimeout() {
      if (this.shakeDirChangeTimeout) {
        clearTimeout(this.shakeDirChangeTimeout);
      }
    }
    refreshShakeDirChangeTimeout() {
      this.clearShakeDirChangeTimeout();
      this.shakeDirChangeTimeout = setTimeout(() => {
        this.resetShake();
      }, this.controls.options.freezeOnShake.dirChangeTimeout);
    }
  };

  // scripts/vendor/voroforce/controls/controls.js
  var { pow, sqrt } = Math;
  var getAverageSpeedTotal = (array) => array.reduce((a, b) => a + b.total, 0) / array.length;
  var MAX_SPEED_HISTORY = 10;
  var Controls = class extends BaseControls {
    constructor() {
      super(...arguments);
      __publicField(this, "zoom", 1);
    }
    reset() {
      super.reset();
      this.speedHistory = [];
      this.rawSpeedHistory = [];
      this.position = null;
      this.lastPosition = null;
      this.lastRawPosition = null;
      this.speed = { x: 0, y: 0, total: 0 };
      this.rawSpeed = { x: 0, y: 0, total: 0 };
      this.avgRawSpeedTotal = 0;
      this.avgSpeedTotal = 0;
    }
    handleConfig() {
      super.handleConfig();
      this.options = {
        debug: this.config.debug || false,
        maxSpeed: this.config.maxSpeed || 10,
        maxSpeedPinned: this.config.maxSpeedPinned || this.config.maxSpeed || 10,
        ease: this.config.ease || 0.15,
        easePinned: this.config.easePinned || this.config.ease || 0.15,
        interactionMaxSpeed: this.config.interactionMaxSpeed || 5,
        zoom: typeof this.config.zoom?.enabled === "boolean" ? this.config.zoom.enabled : true,
        zoomMin: this.config.zoom?.min || 1,
        zoomMax: this.config.zoom?.max || 1.5,
        freezeOnJolt: {
          enabled: this.config.freezeOnJolt?.enabled || false,
          factor: this.config.freezeOnJolt?.factor || 7,
          minSpeedValue: this.config.freezeOnJolt?.minSpeedValue || 2
        },
        freezeOnShake: {
          enabled: this.config.freezeOnShake?.enabled || false,
          minSpeed: this.config.freezeOnShake?.minSpeed || 2,
          // Minimum velocity to count as a shake
          dirChangeTimeout: this.config.freezeOnShake?.dirChangeTimeout || 250,
          // Reset after this many ms of no dir change
          minShakes: this.config.freezeOnShake?.minShakes || 3,
          // Minimum direction changes to trigger a shake
          cooldown: this.config.freezeOnShake?.cooldown || 2e3
          // Minimum time between shake events
        }
      };
      if ((this.options.freezeOnJolt.enabled || this.options.freezeOnShake.enabled) && !this.detachGestureHandler) {
        this.detachGestureHandler = new DetachGestureHandler(this);
      }
      if (this.options.debug) {
        if (!this.debugMarker) this.debugMarker = new DebugMarker(this.container);
      } else if (this.debugMarker) {
        this.debugMarker.destroy();
        this.debugMarker = null;
      }
    }
    handleAutoFocusCenter() {
      super.handleAutoFocusCenter();
      this.freezePointer();
    }
    handleAutoFocusUpdate() {
      if (this.cells.focused) {
        this.pinPointer();
        this.update = this.handleFirstUpdate;
        return;
      }
      this.handleUpdate();
    }
    handleUpdate() {
      this.handlePositions();
      this.handleCursor();
      if (this.isDetached()) {
        if (this.rawPosition && !this.rawPositionIdle && this.avgSpeedTotal < this.options.interactionMaxSpeed) {
          if (this.hasSelection() || !this.isFrozen() || distance(this.rawPosition, this.frozenPosition) < 50) {
            this.getCellIndices(this.rawPosition, (index, indices) => {
              if (!this.rawPosition) return;
              Object.assign(this.rawPosition, {
                index,
                indices
              });
              if (this.cells.focusedIndex === index) {
                this.unfreezePointer();
              }
            });
          }
        }
      }
      if (!this.isFrozen()) {
        if (!this.position) return;
        this.assignPointer({
          x: this.position.x,
          y: this.position.y,
          speedScale: this.avgSpeedTotal / this.options.maxSpeed
        });
      }
      this.getCellIndices(this.pointer, (index, indices) => {
        this.assignPointer({
          indices
        });
        this.focusCell(index);
      });
    }
    handlePositions() {
      this.handleRawPosition();
      this.handleMainPosition();
    }
    handleMainPosition() {
      let targetPosition = this.rawPosition;
      if (this.pinnedPosition) {
        targetPosition = this.pinnedPosition;
        if (this.outOfBounds(targetPosition)) {
          this.freezePointer();
          return;
        }
      }
      if (!targetPosition) return;
      this.position = this.calcMainPosition(targetPosition);
      this.clampToBounds(this.position);
      this.speedHistory.push({
        ...this.speed
      });
      if (this.speedHistory.length > MAX_SPEED_HISTORY) {
        this.speedHistory.shift();
        this.avgSpeedTotal = getAverageSpeedTotal(this.speedHistory);
      }
      this.lastPosition = {
        x: this.position.x,
        y: this.position.y
      };
      this.debugMarker?.updatePosition(this.position);
    }
    calcMainPosition(targetPosition) {
      if (!this.lastPosition) return targetPosition;
      if (this.detectDetachGesture()) {
        this.freezePointer();
        return {
          x: this.lastPosition.x,
          y: this.lastPosition.y
        };
      }
      if (this.isFrozen()) {
        this.speed.x = 0;
        this.speed.y = 0;
        this.speed.total = 0;
        return targetPosition;
      }
      const deltaX = targetPosition.x - this.lastPosition.x;
      const deltaY = targetPosition.y - this.lastPosition.y;
      const distance3 = sqrt(pow(deltaX, 2) + pow(deltaY, 2));
      if (distance3 < 0.1) {
        this.speed.x = 0;
        this.speed.y = 0;
        this.speed.total = 0;
        return targetPosition;
      }
      const ease = this.pinnedPosition ? this.options.easePinned : this.options.ease;
      const maxSpeed = this.pinnedPosition ? this.options.maxSpeedPinned : this.options.maxSpeed;
      let cappedDeltaX = deltaX * ease;
      let cappedDeltaY = deltaY * ease;
      let speed = sqrt(cappedDeltaX * cappedDeltaX + cappedDeltaY * cappedDeltaY);
      if (speed > maxSpeed) {
        const ratio = maxSpeed / speed;
        cappedDeltaX *= ratio;
        cappedDeltaY *= ratio;
        speed = maxSpeed;
      }
      this.speed.x = cappedDeltaX;
      this.speed.y = cappedDeltaY;
      this.speed.total = speed;
      return {
        x: this.lastPosition.x + cappedDeltaX,
        y: this.lastPosition.y + cappedDeltaY
      };
    }
    handleRawPosition() {
      if (!this.rawPosition) return;
      this.clampToBounds(this.rawPosition);
      this.assignPointer({
        rawX: this.rawPosition.x,
        rawY: this.rawPosition.y
      });
      if (this.lastRawPosition) {
        this.rawSpeed.x = this.rawPosition.x - this.lastRawPosition.x;
        this.rawSpeed.y = this.rawPosition.y - this.lastRawPosition.y;
        this.rawSpeed.total = sqrt(
          pow(this.rawSpeed.x, 2) + pow(this.rawSpeed.y, 2)
        );
        this.rawSpeedHistory.push({
          ...this.rawSpeed
        });
        if (this.rawSpeedHistory.length > MAX_SPEED_HISTORY) {
          this.rawSpeedHistory.shift();
          this.avgRawSpeedTotal = getAverageSpeedTotal(this.rawSpeedHistory);
        }
      }
      this.lastRawPosition = { ...this.rawPosition };
    }
    handleCursor() {
      let cursor;
      if (this.isTouching) {
        cursor = "default";
      } else if (this.pointer.dragging) {
        cursor = "grabbing";
      } else if (this.isPinned() && this.hasSelection()) {
        if (this.rawIsPinned()) {
          cursor = "zoom-out";
        } else {
          cursor = "pointer";
        }
      } else {
        if (!this.isDetached()) {
          if (this.hasSelection()) {
            if (this.focusedIsSelected()) {
              cursor = "zoom-out";
            } else {
              cursor = "pointer";
            }
          } else {
            if (this.avgSpeedTotal < this.options.interactionMaxSpeed) {
              cursor = "pointer";
            } else {
              cursor = "default";
            }
          }
        } else {
          if (this.hasSelection()) {
            cursor = "pointer";
            if (this.rawIsSelected()) {
              cursor = "zoom-out";
            } else {
              cursor = "pointer";
            }
          } else {
            cursor = "default";
          }
        }
      }
      if (cursor) this.setCursor(cursor);
    }
    onPointerDown(e) {
      if (this.isTouching) return;
      this.pointer.down = true;
      if (this.rawIsFocused()) {
        this.pointer.canDrag = true;
        this.pointer.downStartX = e.clientX || e.x;
        this.pointer.downStartY = e.clientY || e.y;
      }
      this.logger?.debug("onPointerDown");
    }
    onPointerMove(e) {
      if (this.isPinching) return;
      super.onPointerMove(e);
      if (this.isTouching) {
        this.attach();
      } else if (this.pointer.down && !this.pointer.canDrag) {
        this.pinPointer(this.rawPosition);
      } else if (this.isPinned()) {
        if (this.hasSelection()) {
          if (!this.rawIsFocused()) {
            this.freezePointer();
          }
        } else {
          if (this.pinnedIsFocused()) this.freezePointer();
        }
      }
    }
    handlePointerOut() {
      this.pointer.dragging = false;
      this.pointer.down = false;
      this.pointer.canDrag = false;
      if (!this.isDetached()) {
        if (this.hasSelection()) {
          this.pinPointer();
        } else {
          this.freezePointer();
        }
      }
    }
    onPointerClick(e) {
      if (this.isPinching) return;
      if (this.pointer.dragging) {
        this.pointer.dragging = false;
        return;
      }
      this.logger?.debug("onPointerClick");
      this.updateRawPositionFromEvent(e);
      this.getCellIndices(this.rawPosition, (index, indices) => {
        if (!this.rawPosition) return;
        Object.assign(this.rawPosition, {
          index,
          indices
        });
        if (!this.isTouching && (this.frozenPosition || this.pinnedPosition && !this.rawIsPinned())) {
          this.navigateToCell(this.rawPosition.index);
        } else {
          this.requestSelection(this.rawPosition);
        }
      });
    }
    freezePointer(frozenPosition) {
      if (this.pinnedPosition) this.unpinPointer();
      this.pointer.speedScale = 0;
      this.frozenPosition = frozenPosition ?? this.frozenPosition ?? this.savePointer();
      this.dispatchEvent(
        new PointerFrozenChangeEvent({
          frozen: true,
          pointer: this.pointer,
          frozenPosition: this.frozenPosition
        })
      );
      this.logger?.debug("freeze pointer");
      this.debugMarker?.updateColor("blue");
    }
    unfreezePointer() {
      if (!this.frozenPosition) return;
      if (!this.lastPosition) this.lastPosition = {};
      Object.assign(this.lastPosition, this.frozenPosition);
      this.frozenPosition = null;
      this.dispatchEvent(
        new PointerFrozenChangeEvent({
          frozen: false,
          pointer: this.pointer
        })
      );
      this.logger?.debug("unfreeze pointer");
      this.debugMarker?.updateColor("red");
    }
    pinPointer(pinnedPosition) {
      this.pinnedPosition = pinnedPosition ?? this.pinnedPosition ?? this.cells.focused;
      if (!this.pinnedPosition) return;
      if (this.frozenPosition) this.unfreezePointer();
      this.dispatchEvent(
        new PointerPinnedChangeEvent({
          pinned: true,
          pointer: this.pointer,
          pinnedPosition: this.pinnedPosition
        })
      );
      this.logger?.debug("pin pointer");
      this.debugMarker?.updateColor("green");
    }
    unpinPointer() {
      if (!this.pinnedPosition) return;
      this.pinnedPosition = null;
      this.dispatchEvent(
        new PointerPinnedChangeEvent({
          pinned: false,
          pointer: this.pointer
        })
      );
      this.logger?.debug("unpin pointer");
      this.debugMarker?.updateColor("red");
    }
    requestSelection(pointer) {
      this.logger?.debug("handleSelectRequest");
      let selectCellIndex;
      const hasPreviousSelection = this.hasSelection();
      if (!hasPreviousSelection) {
        if (this.avgSpeedTotal < this.options.interactionMaxSpeed && pointer.index === this.cells.focusedIndex) {
          selectCellIndex = this.cells.focusedIndex;
        }
      } else {
        if (pointer.index !== this.cells.selectedIndex) {
          selectCellIndex = pointer.index;
        } else {
          this.deselect();
        }
      }
      if (selectCellIndex) {
        this.selectCell(selectCellIndex);
        if (hasPreviousSelection) {
          this.pinPointer(this.cells.selected);
        } else {
          this.resetZoom();
        }
        return selectCellIndex;
      }
    }
    deselect() {
      super.deselect();
    }
    deselectAndPin() {
      this.deselect();
      this.pinPointer();
    }
    navigateToCell(cellOrCellIndex) {
      const cell = getCell(cellOrCellIndex, this.cells);
      if (!cell) return;
      this.pinPointer(cell);
      if (this.hasSelection()) {
        this.selectCell(cell);
      }
    }
    navigateToCellById(id) {
      return this.navigateToCell(this.cells.find((cell) => cell.id === id));
    }
    onKeyDown(e) {
      if (!this.hasFocus()) return;
      switch (e.code) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          if (!this.globalConfig.lattice?.enabled) return;
          const directionMap = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right"
          };
          const direction = directionMap[e.key];
          e.preventDefault();
          this.navigateToCell(
            getDirectionalNeighborCellIndex(
              this.cells.focused,
              direction,
              this.globalConfig.lattice
            )
          );
          break;
        }
        case "Space":
        case "Enter": {
          e.preventDefault();
          this.requestSelection(this.pointer);
          break;
        }
        default:
          return;
      }
    }
    onTouchStart(e) {
      this.logger?.debug("onTouchStart");
      this.isTouching = true;
      if (e.touches.length === 1) {
        return;
      }
      if (e.touches.length === 2) {
        this.handlePinchGesture(e.touches);
      }
      e.preventDefault();
    }
    onTouchMove(e) {
      if (e.touches.length === 1) {
        return;
      }
      if (e.touches.length === 2) {
        this.handlePinchGesture(e.touches);
      }
      e.preventDefault();
    }
    onTouchEnd(e) {
      super.onTouchEnd(e);
      this.isPinching = false;
      this.lastPinchDistance = void 0;
    }
    handlePinchGesture(touches) {
      this.isPinching = true;
      this.logger?.debug("onPinch");
      if (!this.options.zoom) return;
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance3 = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      if (this.lastPinchDistance) {
        const pinchRatio = distance3 / this.lastPinchDistance;
        const deltaScale = Math.abs(pinchRatio - 1) * 2;
        this.zoom = pinchRatio > 1 ? Math.min(this.options.zoomMax, this.zoom + deltaScale) : Math.max(this.options.zoomMin, this.zoom - deltaScale);
        this.handleZoom(this.zoom);
      }
      this.lastPinchDistance = distance3;
    }
    onWheel(e) {
      this.logger?.debug("onWheel", { deltaY: e.deltaY });
      if (!this.options.zoom) return;
      const deltaScale = Math.abs(e.deltaY) * 1e-3;
      this.zoom = e.deltaY > 0 ? Math.max(this.options.zoomMin, this.zoom - deltaScale) : Math.min(this.options.zoomMax, this.zoom + deltaScale);
      this.handleZoom(this.zoom);
    }
    handleZoom(zoom) {
      this.logger?.debug("zoom", zoom);
      this.pointer.zoom = zoom;
      if (!this.hasSelection()) {
        if (zoom >= this.options.zoomMax) {
          this.requestSelection(this.pointer);
        }
      } else {
        if (zoom <= this.options.zoomMin) {
          this.deselect();
        }
      }
    }
    resetZoom() {
      this.pointer.zoom = this.zoom = 1;
    }
    initEventListeners() {
      super.initEventListeners();
      this.initWheelEventListeners();
      this.initKeyboardEventListeners();
    }
    removeEventListeners() {
      super.removeEventListeners();
      this.removeWheelEventListeners();
      this.removeKeyboardEventListeners();
    }
    initWheelEventListeners() {
      if (this.boundOnWheel) return;
      this.boundOnWheel = this.onWheel.bind(this);
      window.addEventListener("wheel", this.boundOnWheel);
    }
    removeWheelEventListeners() {
      if (!this.boundOnWheel) return;
      window.removeEventListener("wheel", this.boundOnWheel);
      this.boundOnWheel = void 0;
    }
    initKeyboardEventListeners() {
      if (this.boundOnKeyDown) return;
      this.boundOnKeyDown = this.onKeyDown.bind(this);
      window.addEventListener("keydown", this.boundOnKeyDown);
    }
    removeKeyboardEventListeners() {
      if (!this.boundOnKeyDown) return;
      window.removeEventListener("keydown", this.boundOnKeyDown);
      this.boundOnKeyDown = void 0;
    }
    onDeviceOrientation(e) {
    }
    initOrientationEventListeners() {
      if (this.boundOnDeviceOrientation) return;
      if (typeof DeviceOrientationEvent === "undefined") return;
      this.boundOnDeviceOrientation = this.onDeviceOrientation.bind(this);
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then((response) => {
          if (response === "granted") {
            window.addEventListener(
              "deviceorientation",
              this.boundOnDeviceOrientation
            );
          }
        }).catch(() => {
        });
      } else {
        window.addEventListener(
          "deviceorientation",
          this.boundOnDeviceOrientation
        );
      }
    }
    removeOrientationEventListeners() {
      if (!this.boundOnDeviceOrientation) return;
      window.removeEventListener(
        "deviceorientation",
        this.boundOnDeviceOrientation
      );
      this.boundOnDeviceOrientation = void 0;
    }
    startResize(dimensions) {
      super.startResize(dimensions);
    }
    endResize(dimensions) {
      super.endResize(dimensions);
      this.freezePointer(this.savePointer());
    }
    attach() {
      this.unpinPointer();
      this.unfreezePointer();
    }
    isDetached() {
      return this.isFrozen() || this.isPinned();
    }
    isFrozen() {
      return this.frozenPosition;
    }
    isPinned() {
      return this.pinnedPosition;
    }
    pinnedIsFocused() {
      return this.isPinned() && this.pinnedPosition.index === this.cells.focusedIndex;
    }
    rawIsFocused() {
      return this.rawPosition?.index === this.cells.focusedIndex;
    }
    rawIsSelected() {
      return this.hasSelection() && this.rawPosition?.index === this.cells.selectedIndex;
    }
    rawIsPinned() {
      return this.isPinned() && this.rawPosition?.index === this.pinnedPosition.index;
    }
    setCursor(cursor) {
      this.container.style.cursor = cursor;
    }
    detectDetachGesture() {
      if (this.detachGestureHandler && !this.isTouching && !this.pointer.down && !this.isDetached()) {
        return this.detachGestureHandler.detectDetachGesture();
      }
    }
  };

  // node_modules/ogl/src/math/functions/Vec3Func.js
  function length(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function set(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }
  function multiply(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }
  function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  }
  function scale(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  }
  function distance2(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function squaredDistance(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return x * x + y * y + z * z;
  }
  function squaredLength(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return x * x + y * y + z * z;
  }
  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }
  function inverse(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    return out;
  }
  function normalize(out, a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(out, a, b) {
    let ax = a[0], ay = a[1], az = a[2];
    let bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  function lerp2(out, a, b, t) {
    let ax = a[0];
    let ay = a[1];
    let az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  }
  function smoothLerp(out, a, b, decay, dt) {
    const exp = Math.exp(-decay * dt);
    let ax = a[0];
    let ay = a[1];
    let az = a[2];
    out[0] = b[0] + (ax - b[0]) * exp;
    out[1] = b[1] + (ay - b[1]) * exp;
    out[2] = b[2] + (az - b[2]) * exp;
    return out;
  }
  function transformMat4(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }
  function scaleRotateMat4(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z) / w;
    return out;
  }
  function transformMat3(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  }
  function transformQuat(out, a, q) {
    let x = a[0], y = a[1], z = a[2];
    let qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    let uvx = qy * z - qz * y;
    let uvy = qz * x - qx * z;
    let uvz = qx * y - qy * x;
    let uuvx = qy * uvz - qz * uvy;
    let uuvy = qz * uvx - qx * uvz;
    let uuvz = qx * uvy - qy * uvx;
    let w2 = qw * 2;
    uvx *= w2;
    uvy *= w2;
    uvz *= w2;
    uuvx *= 2;
    uuvy *= 2;
    uuvz *= 2;
    out[0] = x + uvx + uuvx;
    out[1] = y + uvy + uuvy;
    out[2] = z + uvz + uuvz;
    return out;
  }
  var angle = /* @__PURE__ */ (function() {
    const tempA = [0, 0, 0];
    const tempB = [0, 0, 0];
    return function(a, b) {
      copy(tempA, a);
      copy(tempB, b);
      normalize(tempA, tempA);
      normalize(tempB, tempB);
      let cosine = dot(tempA, tempB);
      if (cosine > 1) {
        return 0;
      } else if (cosine < -1) {
        return Math.PI;
      } else {
        return Math.acos(cosine);
      }
    };
  })();
  function exactEquals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  // node_modules/ogl/src/math/Vec3.js
  var Vec3 = class _Vec3 extends Array {
    constructor(x = 0, y = x, z = x) {
      super(x, y, z);
      return this;
    }
    get x() {
      return this[0];
    }
    get y() {
      return this[1];
    }
    get z() {
      return this[2];
    }
    set x(v) {
      this[0] = v;
    }
    set y(v) {
      this[1] = v;
    }
    set z(v) {
      this[2] = v;
    }
    set(x, y = x, z = x) {
      if (x.length) return this.copy(x);
      set(this, x, y, z);
      return this;
    }
    copy(v) {
      copy(this, v);
      return this;
    }
    add(va, vb) {
      if (vb) add(this, va, vb);
      else add(this, this, va);
      return this;
    }
    sub(va, vb) {
      if (vb) subtract(this, va, vb);
      else subtract(this, this, va);
      return this;
    }
    multiply(v) {
      if (v.length) multiply(this, this, v);
      else scale(this, this, v);
      return this;
    }
    divide(v) {
      if (v.length) divide(this, this, v);
      else scale(this, this, 1 / v);
      return this;
    }
    inverse(v = this) {
      inverse(this, v);
      return this;
    }
    // Can't use 'length' as Array.prototype uses it
    len() {
      return length(this);
    }
    distance(v) {
      if (v) return distance2(this, v);
      else return length(this);
    }
    squaredLen() {
      return squaredLength(this);
    }
    squaredDistance(v) {
      if (v) return squaredDistance(this, v);
      else return squaredLength(this);
    }
    negate(v = this) {
      negate(this, v);
      return this;
    }
    cross(va, vb) {
      if (vb) cross(this, va, vb);
      else cross(this, this, va);
      return this;
    }
    scale(v) {
      scale(this, this, v);
      return this;
    }
    normalize() {
      normalize(this, this);
      return this;
    }
    dot(v) {
      return dot(this, v);
    }
    equals(v) {
      return exactEquals(this, v);
    }
    applyMatrix3(mat3) {
      transformMat3(this, this, mat3);
      return this;
    }
    applyMatrix4(mat4) {
      transformMat4(this, this, mat4);
      return this;
    }
    scaleRotateMatrix4(mat4) {
      scaleRotateMat4(this, this, mat4);
      return this;
    }
    applyQuaternion(q) {
      transformQuat(this, this, q);
      return this;
    }
    angle(v) {
      return angle(this, v);
    }
    lerp(v, t) {
      lerp2(this, this, v, t);
      return this;
    }
    smoothLerp(v, decay, dt) {
      smoothLerp(this, this, v, decay, dt);
      return this;
    }
    clone() {
      return new _Vec3(this[0], this[1], this[2]);
    }
    fromArray(a, o = 0) {
      this[0] = a[o];
      this[1] = a[o + 1];
      this[2] = a[o + 2];
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      return a;
    }
    transformDirection(mat4) {
      const x = this[0];
      const y = this[1];
      const z = this[2];
      this[0] = mat4[0] * x + mat4[4] * y + mat4[8] * z;
      this[1] = mat4[1] * x + mat4[5] * y + mat4[9] * z;
      this[2] = mat4[2] * x + mat4[6] * y + mat4[10] * z;
      return this.normalize();
    }
  };

  // node_modules/ogl/src/core/Geometry.js
  var tempVec3 = /* @__PURE__ */ new Vec3();
  var ID = 1;
  var ATTR_ID = 1;
  var isBoundsWarned = false;
  var Geometry = class {
    constructor(gl, attributes = {}) {
      if (!gl.canvas) console.error("gl not passed as first argument to Geometry");
      this.gl = gl;
      this.attributes = attributes;
      this.id = ID++;
      this.VAOs = {};
      this.drawRange = { start: 0, count: 0 };
      this.instancedCount = 0;
      this.gl.renderer.bindVertexArray(null);
      this.gl.renderer.currentGeometry = null;
      this.glState = this.gl.renderer.state;
      for (let key in attributes) {
        this.addAttribute(key, attributes[key]);
      }
    }
    addAttribute(key, attr) {
      this.attributes[key] = attr;
      attr.id = ATTR_ID++;
      attr.size = attr.size || 1;
      attr.type = attr.type || (attr.data.constructor === Float32Array ? this.gl.FLOAT : attr.data.constructor === Uint16Array ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_INT);
      attr.target = key === "index" ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER;
      attr.normalized = attr.normalized || false;
      attr.stride = attr.stride || 0;
      attr.offset = attr.offset || 0;
      attr.count = attr.count || (attr.stride ? attr.data.byteLength / attr.stride : attr.data.length / attr.size);
      attr.divisor = attr.instanced || 0;
      attr.needsUpdate = false;
      attr.usage = attr.usage || this.gl.STATIC_DRAW;
      if (!attr.buffer) {
        this.updateAttribute(attr);
      }
      if (attr.divisor) {
        this.isInstanced = true;
        if (this.instancedCount && this.instancedCount !== attr.count * attr.divisor) {
          console.warn("geometry has multiple instanced buffers of different length");
          return this.instancedCount = Math.min(this.instancedCount, attr.count * attr.divisor);
        }
        this.instancedCount = attr.count * attr.divisor;
      } else if (key === "index") {
        this.drawRange.count = attr.count;
      } else if (!this.attributes.index) {
        this.drawRange.count = Math.max(this.drawRange.count, attr.count);
      }
    }
    updateAttribute(attr) {
      const isNewBuffer = !attr.buffer;
      if (isNewBuffer) attr.buffer = this.gl.createBuffer();
      if (this.glState.boundBuffer !== attr.buffer) {
        this.gl.bindBuffer(attr.target, attr.buffer);
        this.glState.boundBuffer = attr.buffer;
      }
      if (isNewBuffer) {
        this.gl.bufferData(attr.target, attr.data, attr.usage);
      } else {
        this.gl.bufferSubData(attr.target, 0, attr.data);
      }
      attr.needsUpdate = false;
    }
    setIndex(value) {
      this.addAttribute("index", value);
    }
    setDrawRange(start, count) {
      this.drawRange.start = start;
      this.drawRange.count = count;
    }
    setInstancedCount(value) {
      this.instancedCount = value;
    }
    createVAO(program) {
      this.VAOs[program.attributeOrder] = this.gl.renderer.createVertexArray();
      this.gl.renderer.bindVertexArray(this.VAOs[program.attributeOrder]);
      this.bindAttributes(program);
    }
    bindAttributes(program) {
      program.attributeLocations.forEach((location, { name, type }) => {
        if (!this.attributes[name]) {
          console.warn(`active attribute ${name} not being supplied`);
          return;
        }
        const attr = this.attributes[name];
        this.gl.bindBuffer(attr.target, attr.buffer);
        this.glState.boundBuffer = attr.buffer;
        let numLoc = 1;
        if (type === 35674) numLoc = 2;
        if (type === 35675) numLoc = 3;
        if (type === 35676) numLoc = 4;
        const size = attr.size / numLoc;
        const stride = numLoc === 1 ? 0 : numLoc * numLoc * 4;
        const offset = numLoc === 1 ? 0 : numLoc * 4;
        for (let i = 0; i < numLoc; i++) {
          this.gl.vertexAttribPointer(location + i, size, attr.type, attr.normalized, attr.stride + stride, attr.offset + i * offset);
          this.gl.enableVertexAttribArray(location + i);
          this.gl.renderer.vertexAttribDivisor(location + i, attr.divisor);
        }
      });
      if (this.attributes.index) this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.attributes.index.buffer);
    }
    draw({ program, mode = this.gl.TRIANGLES }) {
      if (this.gl.renderer.currentGeometry !== `${this.id}_${program.attributeOrder}`) {
        if (!this.VAOs[program.attributeOrder]) this.createVAO(program);
        this.gl.renderer.bindVertexArray(this.VAOs[program.attributeOrder]);
        this.gl.renderer.currentGeometry = `${this.id}_${program.attributeOrder}`;
      }
      program.attributeLocations.forEach((location, { name }) => {
        const attr = this.attributes[name];
        if (attr.needsUpdate) this.updateAttribute(attr);
      });
      let indexBytesPerElement = 2;
      if (this.attributes.index?.type === this.gl.UNSIGNED_INT) indexBytesPerElement = 4;
      if (this.isInstanced) {
        if (this.attributes.index) {
          this.gl.renderer.drawElementsInstanced(
            mode,
            this.drawRange.count,
            this.attributes.index.type,
            this.attributes.index.offset + this.drawRange.start * indexBytesPerElement,
            this.instancedCount
          );
        } else {
          this.gl.renderer.drawArraysInstanced(mode, this.drawRange.start, this.drawRange.count, this.instancedCount);
        }
      } else {
        if (this.attributes.index) {
          this.gl.drawElements(
            mode,
            this.drawRange.count,
            this.attributes.index.type,
            this.attributes.index.offset + this.drawRange.start * indexBytesPerElement
          );
        } else {
          this.gl.drawArrays(mode, this.drawRange.start, this.drawRange.count);
        }
      }
    }
    getPosition() {
      const attr = this.attributes.position;
      if (attr.data) return attr;
      if (isBoundsWarned) return;
      console.warn("No position buffer data found to compute bounds");
      return isBoundsWarned = true;
    }
    computeBoundingBox(attr) {
      if (!attr) attr = this.getPosition();
      const array = attr.data;
      const stride = attr.size;
      if (!this.bounds) {
        this.bounds = {
          min: new Vec3(),
          max: new Vec3(),
          center: new Vec3(),
          scale: new Vec3(),
          radius: Infinity
        };
      }
      const min2 = this.bounds.min;
      const max3 = this.bounds.max;
      const center = this.bounds.center;
      const scale5 = this.bounds.scale;
      min2.set(Infinity);
      max3.set(-Infinity);
      for (let i = 0, l = array.length; i < l; i += stride) {
        const x = array[i];
        const y = array[i + 1];
        const z = array[i + 2];
        min2.x = Math.min(x, min2.x);
        min2.y = Math.min(y, min2.y);
        min2.z = Math.min(z, min2.z);
        max3.x = Math.max(x, max3.x);
        max3.y = Math.max(y, max3.y);
        max3.z = Math.max(z, max3.z);
      }
      scale5.sub(max3, min2);
      center.add(min2, max3).divide(2);
    }
    computeBoundingSphere(attr) {
      if (!attr) attr = this.getPosition();
      const array = attr.data;
      const stride = attr.size;
      if (!this.bounds) this.computeBoundingBox(attr);
      let maxRadiusSq = 0;
      for (let i = 0, l = array.length; i < l; i += stride) {
        tempVec3.fromArray(array, i);
        maxRadiusSq = Math.max(maxRadiusSq, this.bounds.center.squaredDistance(tempVec3));
      }
      this.bounds.radius = Math.sqrt(maxRadiusSq);
    }
    remove() {
      for (let key in this.VAOs) {
        this.gl.renderer.deleteVertexArray(this.VAOs[key]);
        delete this.VAOs[key];
      }
      for (let key in this.attributes) {
        this.gl.deleteBuffer(this.attributes[key].buffer);
        delete this.attributes[key];
      }
    }
  };

  // node_modules/ogl/src/core/Program.js
  var ID2 = 1;
  var arrayCacheF32 = {};
  var Program = class {
    constructor(gl, {
      vertex,
      fragment,
      uniforms = {},
      transparent = false,
      cullFace = gl.BACK,
      frontFace = gl.CCW,
      depthTest = true,
      depthWrite = true,
      depthFunc = gl.LEQUAL
    } = {}) {
      if (!gl.canvas) console.error("gl not passed as first argument to Program");
      this.gl = gl;
      this.uniforms = uniforms;
      this.id = ID2++;
      if (!vertex) console.warn("vertex shader not supplied");
      if (!fragment) console.warn("fragment shader not supplied");
      this.transparent = transparent;
      this.cullFace = cullFace;
      this.frontFace = frontFace;
      this.depthTest = depthTest;
      this.depthWrite = depthWrite;
      this.depthFunc = depthFunc;
      this.blendFunc = {};
      this.blendEquation = {};
      this.stencilFunc = {};
      this.stencilOp = {};
      if (this.transparent && !this.blendFunc.src) {
        if (this.gl.renderer.premultipliedAlpha) this.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        else this.setBlendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      }
      this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
      this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      this.program = gl.createProgram();
      gl.attachShader(this.program, this.vertexShader);
      gl.attachShader(this.program, this.fragmentShader);
      this.setShaders({ vertex, fragment });
    }
    setShaders({ vertex, fragment }) {
      if (vertex) {
        this.gl.shaderSource(this.vertexShader, vertex);
        this.gl.compileShader(this.vertexShader);
        if (this.gl.getShaderInfoLog(this.vertexShader) !== "") {
          console.warn(`${this.gl.getShaderInfoLog(this.vertexShader)}
Vertex Shader
${addLineNumbers(vertex)}`);
        }
      }
      if (fragment) {
        this.gl.shaderSource(this.fragmentShader, fragment);
        this.gl.compileShader(this.fragmentShader);
        if (this.gl.getShaderInfoLog(this.fragmentShader) !== "") {
          console.warn(`${this.gl.getShaderInfoLog(this.fragmentShader)}
Fragment Shader
${addLineNumbers(fragment)}`);
        }
      }
      this.gl.linkProgram(this.program);
      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        return console.warn(this.gl.getProgramInfoLog(this.program));
      }
      this.uniformLocations = /* @__PURE__ */ new Map();
      let numUniforms = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
      for (let uIndex = 0; uIndex < numUniforms; uIndex++) {
        let uniform = this.gl.getActiveUniform(this.program, uIndex);
        this.uniformLocations.set(uniform, this.gl.getUniformLocation(this.program, uniform.name));
        const split = uniform.name.match(/(\w+)/g);
        uniform.uniformName = split[0];
        uniform.nameComponents = split.slice(1);
      }
      this.attributeLocations = /* @__PURE__ */ new Map();
      const locations = [];
      const numAttribs = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
      for (let aIndex = 0; aIndex < numAttribs; aIndex++) {
        const attribute = this.gl.getActiveAttrib(this.program, aIndex);
        const location = this.gl.getAttribLocation(this.program, attribute.name);
        if (location === -1) continue;
        locations[location] = attribute.name;
        this.attributeLocations.set(attribute, location);
      }
      this.attributeOrder = locations.join("");
    }
    setBlendFunc(src, dst, srcAlpha, dstAlpha) {
      this.blendFunc.src = src;
      this.blendFunc.dst = dst;
      this.blendFunc.srcAlpha = srcAlpha;
      this.blendFunc.dstAlpha = dstAlpha;
      if (src) this.transparent = true;
    }
    setBlendEquation(modeRGB, modeAlpha) {
      this.blendEquation.modeRGB = modeRGB;
      this.blendEquation.modeAlpha = modeAlpha;
    }
    setStencilFunc(func, ref, mask) {
      this.stencilRef = ref;
      this.stencilFunc.func = func;
      this.stencilFunc.ref = ref;
      this.stencilFunc.mask = mask;
    }
    setStencilOp(stencilFail, depthFail, depthPass) {
      this.stencilOp.stencilFail = stencilFail;
      this.stencilOp.depthFail = depthFail;
      this.stencilOp.depthPass = depthPass;
    }
    applyState() {
      if (this.depthTest) this.gl.renderer.enable(this.gl.DEPTH_TEST);
      else this.gl.renderer.disable(this.gl.DEPTH_TEST);
      if (this.cullFace) this.gl.renderer.enable(this.gl.CULL_FACE);
      else this.gl.renderer.disable(this.gl.CULL_FACE);
      if (this.blendFunc.src) this.gl.renderer.enable(this.gl.BLEND);
      else this.gl.renderer.disable(this.gl.BLEND);
      if (this.cullFace) this.gl.renderer.setCullFace(this.cullFace);
      this.gl.renderer.setFrontFace(this.frontFace);
      this.gl.renderer.setDepthMask(this.depthWrite);
      this.gl.renderer.setDepthFunc(this.depthFunc);
      if (this.blendFunc.src) this.gl.renderer.setBlendFunc(this.blendFunc.src, this.blendFunc.dst, this.blendFunc.srcAlpha, this.blendFunc.dstAlpha);
      this.gl.renderer.setBlendEquation(this.blendEquation.modeRGB, this.blendEquation.modeAlpha);
      if (this.stencilFunc.func || this.stencilOp.stencilFail) this.gl.renderer.enable(this.gl.STENCIL_TEST);
      else this.gl.renderer.disable(this.gl.STENCIL_TEST);
      this.gl.renderer.setStencilFunc(this.stencilFunc.func, this.stencilFunc.ref, this.stencilFunc.mask);
      this.gl.renderer.setStencilOp(this.stencilOp.stencilFail, this.stencilOp.depthFail, this.stencilOp.depthPass);
    }
    use({ flipFaces = false } = {}) {
      let textureUnit = -1;
      const programActive = this.gl.renderer.state.currentProgram === this.id;
      if (!programActive) {
        this.gl.useProgram(this.program);
        this.gl.renderer.state.currentProgram = this.id;
      }
      this.uniformLocations.forEach((location, activeUniform) => {
        let uniform = this.uniforms[activeUniform.uniformName];
        for (const component of activeUniform.nameComponents) {
          if (!uniform) break;
          if (component in uniform) {
            uniform = uniform[component];
          } else if (Array.isArray(uniform.value)) {
            break;
          } else {
            uniform = void 0;
            break;
          }
        }
        if (!uniform) {
          return warn(`Active uniform ${activeUniform.name} has not been supplied`);
        }
        if (uniform && uniform.value === void 0) {
          return warn(`${activeUniform.name} uniform is missing a value parameter`);
        }
        if (uniform.value.texture) {
          textureUnit = textureUnit + 1;
          uniform.value.update(textureUnit);
          return setUniform(this.gl, activeUniform.type, location, textureUnit);
        }
        if (uniform.value.length && uniform.value[0].texture) {
          const textureUnits = [];
          uniform.value.forEach((value) => {
            textureUnit = textureUnit + 1;
            value.update(textureUnit);
            textureUnits.push(textureUnit);
          });
          return setUniform(this.gl, activeUniform.type, location, textureUnits);
        }
        setUniform(this.gl, activeUniform.type, location, uniform.value);
      });
      this.applyState();
      if (flipFaces) this.gl.renderer.setFrontFace(this.frontFace === this.gl.CCW ? this.gl.CW : this.gl.CCW);
    }
    remove() {
      this.gl.deleteProgram(this.program);
    }
  };
  function setUniform(gl, type, location, value) {
    value = value.length ? flatten(value) : value;
    const setValue = gl.renderer.state.uniformLocations.get(location);
    if (value.length) {
      if (setValue === void 0 || setValue.length !== value.length) {
        gl.renderer.state.uniformLocations.set(location, value.slice(0));
      } else {
        if (arraysEqual(setValue, value)) return;
        setValue.set ? setValue.set(value) : setArray(setValue, value);
        gl.renderer.state.uniformLocations.set(location, setValue);
      }
    } else {
      if (setValue === value) return;
      gl.renderer.state.uniformLocations.set(location, value);
    }
    switch (type) {
      case 5126:
        return value.length ? gl.uniform1fv(location, value) : gl.uniform1f(location, value);
      // FLOAT
      case 35664:
        return gl.uniform2fv(location, value);
      // FLOAT_VEC2
      case 35665:
        return gl.uniform3fv(location, value);
      // FLOAT_VEC3
      case 35666:
        return gl.uniform4fv(location, value);
      // FLOAT_VEC4
      case 35670:
      // BOOL
      case 5124:
      // INT
      case 35678:
      // SAMPLER_2D
      case 36306:
      // U_SAMPLER_2D
      case 35680:
      // SAMPLER_CUBE
      case 36289:
        return value.length ? gl.uniform1iv(location, value) : gl.uniform1i(location, value);
      // SAMPLER_CUBE
      case 35671:
      // BOOL_VEC2
      case 35667:
        return gl.uniform2iv(location, value);
      // INT_VEC2
      case 35672:
      // BOOL_VEC3
      case 35668:
        return gl.uniform3iv(location, value);
      // INT_VEC3
      case 35673:
      // BOOL_VEC4
      case 35669:
        return gl.uniform4iv(location, value);
      // INT_VEC4
      case 35674:
        return gl.uniformMatrix2fv(location, false, value);
      // FLOAT_MAT2
      case 35675:
        return gl.uniformMatrix3fv(location, false, value);
      // FLOAT_MAT3
      case 35676:
        return gl.uniformMatrix4fv(location, false, value);
    }
  }
  function addLineNumbers(string) {
    let lines = string.split("\n");
    for (let i = 0; i < lines.length; i++) {
      lines[i] = i + 1 + ": " + lines[i];
    }
    return lines.join("\n");
  }
  function flatten(a) {
    const arrayLen = a.length;
    const valueLen = a[0].length;
    if (valueLen === void 0) return a;
    const length3 = arrayLen * valueLen;
    let value = arrayCacheF32[length3];
    if (!value) arrayCacheF32[length3] = value = new Float32Array(length3);
    for (let i = 0; i < arrayLen; i++) value.set(a[i], i * valueLen);
    return value;
  }
  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0, l = a.length; i < l; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  function setArray(a, b) {
    for (let i = 0, l = a.length; i < l; i++) {
      a[i] = b[i];
    }
  }
  var warnCount = 0;
  function warn(message) {
    if (warnCount > 100) return;
    console.warn(message);
    warnCount++;
    if (warnCount > 100) console.warn("More than 100 program warnings - stopping logs.");
  }

  // node_modules/ogl/src/core/Renderer.js
  var tempVec32 = /* @__PURE__ */ new Vec3();
  var ID3 = 1;
  var Renderer = class {
    constructor({
      canvas = document.createElement("canvas"),
      width = 300,
      height = 150,
      dpr = 1,
      alpha = false,
      depth = true,
      stencil = false,
      antialias = false,
      premultipliedAlpha = false,
      preserveDrawingBuffer = false,
      powerPreference = "default",
      autoClear = true,
      webgl = 2
    } = {}) {
      const attributes = { alpha, depth, stencil, antialias, premultipliedAlpha, preserveDrawingBuffer, powerPreference };
      this.dpr = dpr;
      this.alpha = alpha;
      this.color = true;
      this.depth = depth;
      this.stencil = stencil;
      this.premultipliedAlpha = premultipliedAlpha;
      this.autoClear = autoClear;
      this.id = ID3++;
      if (webgl === 2) this.gl = canvas.getContext("webgl2", attributes);
      this.isWebgl2 = !!this.gl;
      if (!this.gl) this.gl = canvas.getContext("webgl", attributes);
      if (!this.gl) console.error("unable to create webgl context");
      this.gl.renderer = this;
      this.setSize(width, height);
      this.state = {};
      this.state.blendFunc = { src: this.gl.ONE, dst: this.gl.ZERO };
      this.state.blendEquation = { modeRGB: this.gl.FUNC_ADD };
      this.state.cullFace = false;
      this.state.frontFace = this.gl.CCW;
      this.state.depthMask = true;
      this.state.depthFunc = this.gl.LEQUAL;
      this.state.premultiplyAlpha = false;
      this.state.flipY = false;
      this.state.unpackAlignment = 4;
      this.state.framebuffer = null;
      this.state.viewport = { x: 0, y: 0, width: null, height: null };
      this.state.textureUnits = [];
      this.state.activeTextureUnit = 0;
      this.state.boundBuffer = null;
      this.state.uniformLocations = /* @__PURE__ */ new Map();
      this.state.currentProgram = null;
      this.extensions = {};
      if (this.isWebgl2) {
        this.getExtension("EXT_color_buffer_float");
        this.getExtension("OES_texture_float_linear");
      } else {
        this.getExtension("OES_texture_float");
        this.getExtension("OES_texture_float_linear");
        this.getExtension("OES_texture_half_float");
        this.getExtension("OES_texture_half_float_linear");
        this.getExtension("OES_element_index_uint");
        this.getExtension("OES_standard_derivatives");
        this.getExtension("EXT_sRGB");
        this.getExtension("WEBGL_depth_texture");
        this.getExtension("WEBGL_draw_buffers");
      }
      this.getExtension("WEBGL_compressed_texture_astc");
      this.getExtension("EXT_texture_compression_bptc");
      this.getExtension("WEBGL_compressed_texture_s3tc");
      this.getExtension("WEBGL_compressed_texture_etc1");
      this.getExtension("WEBGL_compressed_texture_pvrtc");
      this.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
      this.vertexAttribDivisor = this.getExtension("ANGLE_instanced_arrays", "vertexAttribDivisor", "vertexAttribDivisorANGLE");
      this.drawArraysInstanced = this.getExtension("ANGLE_instanced_arrays", "drawArraysInstanced", "drawArraysInstancedANGLE");
      this.drawElementsInstanced = this.getExtension("ANGLE_instanced_arrays", "drawElementsInstanced", "drawElementsInstancedANGLE");
      this.createVertexArray = this.getExtension("OES_vertex_array_object", "createVertexArray", "createVertexArrayOES");
      this.bindVertexArray = this.getExtension("OES_vertex_array_object", "bindVertexArray", "bindVertexArrayOES");
      this.deleteVertexArray = this.getExtension("OES_vertex_array_object", "deleteVertexArray", "deleteVertexArrayOES");
      this.drawBuffers = this.getExtension("WEBGL_draw_buffers", "drawBuffers", "drawBuffersWEBGL");
      this.parameters = {};
      this.parameters.maxTextureUnits = this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
      this.parameters.maxAnisotropy = this.getExtension("EXT_texture_filter_anisotropic") ? this.gl.getParameter(this.getExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
    }
    setSize(width, height) {
      this.width = width;
      this.height = height;
      this.gl.canvas.width = width * this.dpr;
      this.gl.canvas.height = height * this.dpr;
      if (!this.gl.canvas.style) return;
      Object.assign(this.gl.canvas.style, {
        width: width + "px",
        height: height + "px"
      });
    }
    setViewport(width, height, x = 0, y = 0) {
      if (this.state.viewport.width === width && this.state.viewport.height === height) return;
      this.state.viewport.width = width;
      this.state.viewport.height = height;
      this.state.viewport.x = x;
      this.state.viewport.y = y;
      this.gl.viewport(x, y, width, height);
    }
    setScissor(width, height, x = 0, y = 0) {
      this.gl.scissor(x, y, width, height);
    }
    enable(id) {
      if (this.state[id] === true) return;
      this.gl.enable(id);
      this.state[id] = true;
    }
    disable(id) {
      if (this.state[id] === false) return;
      this.gl.disable(id);
      this.state[id] = false;
    }
    setBlendFunc(src, dst, srcAlpha, dstAlpha) {
      if (this.state.blendFunc.src === src && this.state.blendFunc.dst === dst && this.state.blendFunc.srcAlpha === srcAlpha && this.state.blendFunc.dstAlpha === dstAlpha)
        return;
      this.state.blendFunc.src = src;
      this.state.blendFunc.dst = dst;
      this.state.blendFunc.srcAlpha = srcAlpha;
      this.state.blendFunc.dstAlpha = dstAlpha;
      if (srcAlpha !== void 0) this.gl.blendFuncSeparate(src, dst, srcAlpha, dstAlpha);
      else this.gl.blendFunc(src, dst);
    }
    setBlendEquation(modeRGB, modeAlpha) {
      modeRGB = modeRGB || this.gl.FUNC_ADD;
      if (this.state.blendEquation.modeRGB === modeRGB && this.state.blendEquation.modeAlpha === modeAlpha) return;
      this.state.blendEquation.modeRGB = modeRGB;
      this.state.blendEquation.modeAlpha = modeAlpha;
      if (modeAlpha !== void 0) this.gl.blendEquationSeparate(modeRGB, modeAlpha);
      else this.gl.blendEquation(modeRGB);
    }
    setCullFace(value) {
      if (this.state.cullFace === value) return;
      this.state.cullFace = value;
      this.gl.cullFace(value);
    }
    setFrontFace(value) {
      if (this.state.frontFace === value) return;
      this.state.frontFace = value;
      this.gl.frontFace(value);
    }
    setDepthMask(value) {
      if (this.state.depthMask === value) return;
      this.state.depthMask = value;
      this.gl.depthMask(value);
    }
    setDepthFunc(value) {
      if (this.state.depthFunc === value) return;
      this.state.depthFunc = value;
      this.gl.depthFunc(value);
    }
    setStencilMask(value) {
      if (this.state.stencilMask === value) return;
      this.state.stencilMask = value;
      this.gl.stencilMask(value);
    }
    setStencilFunc(func, ref, mask) {
      if (this.state.stencilFunc === func && this.state.stencilRef === ref && this.state.stencilFuncMask === mask) return;
      this.state.stencilFunc = func || this.gl.ALWAYS;
      this.state.stencilRef = ref || 0;
      this.state.stencilFuncMask = mask || 0;
      this.gl.stencilFunc(func || this.gl.ALWAYS, ref || 0, mask || 0);
    }
    setStencilOp(stencilFail, depthFail, depthPass) {
      if (this.state.stencilFail === stencilFail && this.state.stencilDepthFail === depthFail && this.state.stencilDepthPass === depthPass) return;
      this.state.stencilFail = stencilFail;
      this.state.stencilDepthFail = depthFail;
      this.state.stencilDepthPass = depthPass;
      this.gl.stencilOp(stencilFail, depthFail, depthPass);
    }
    activeTexture(value) {
      if (this.state.activeTextureUnit === value) return;
      this.state.activeTextureUnit = value;
      this.gl.activeTexture(this.gl.TEXTURE0 + value);
    }
    bindFramebuffer({ target = this.gl.FRAMEBUFFER, buffer = null } = {}) {
      if (this.state.framebuffer === buffer) return;
      this.state.framebuffer = buffer;
      this.gl.bindFramebuffer(target, buffer);
    }
    getExtension(extension, webgl2Func, extFunc) {
      if (webgl2Func && this.gl[webgl2Func]) return this.gl[webgl2Func].bind(this.gl);
      if (!this.extensions[extension]) {
        this.extensions[extension] = this.gl.getExtension(extension);
      }
      if (!webgl2Func) return this.extensions[extension];
      if (!this.extensions[extension]) return null;
      return this.extensions[extension][extFunc].bind(this.extensions[extension]);
    }
    sortOpaque(a, b) {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      } else if (a.program.id !== b.program.id) {
        return a.program.id - b.program.id;
      } else if (a.zDepth !== b.zDepth) {
        return a.zDepth - b.zDepth;
      } else {
        return b.id - a.id;
      }
    }
    sortTransparent(a, b) {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      }
      if (a.zDepth !== b.zDepth) {
        return b.zDepth - a.zDepth;
      } else {
        return b.id - a.id;
      }
    }
    sortUI(a, b) {
      if (a.renderOrder !== b.renderOrder) {
        return a.renderOrder - b.renderOrder;
      } else if (a.program.id !== b.program.id) {
        return a.program.id - b.program.id;
      } else {
        return b.id - a.id;
      }
    }
    getRenderList({ scene, camera, frustumCull, sort }) {
      let renderList = [];
      if (camera && frustumCull) camera.updateFrustum();
      scene.traverse((node) => {
        if (!node.visible) return true;
        if (!node.draw) return;
        if (frustumCull && node.frustumCulled && camera) {
          if (!camera.frustumIntersectsMesh(node)) return;
        }
        renderList.push(node);
      });
      if (sort) {
        const opaque = [];
        const transparent = [];
        const ui = [];
        renderList.forEach((node) => {
          if (!node.program.transparent) {
            opaque.push(node);
          } else if (node.program.depthTest) {
            transparent.push(node);
          } else {
            ui.push(node);
          }
          node.zDepth = 0;
          if (node.renderOrder !== 0 || !node.program.depthTest || !camera) return;
          node.worldMatrix.getTranslation(tempVec32);
          tempVec32.applyMatrix4(camera.projectionViewMatrix);
          node.zDepth = tempVec32.z;
        });
        opaque.sort(this.sortOpaque);
        transparent.sort(this.sortTransparent);
        ui.sort(this.sortUI);
        renderList = opaque.concat(transparent, ui);
      }
      return renderList;
    }
    render({ scene, camera, target = null, update = true, sort = true, frustumCull = true, clear }) {
      if (target === null) {
        this.bindFramebuffer();
        this.setViewport(this.width * this.dpr, this.height * this.dpr);
      } else {
        this.bindFramebuffer(target);
        this.setViewport(target.width, target.height);
      }
      if (clear || this.autoClear && clear !== false) {
        if (this.depth && (!target || target.depth)) {
          this.enable(this.gl.DEPTH_TEST);
          this.setDepthMask(true);
        }
        if (this.stencil || (!target || target.stencil)) {
          this.enable(this.gl.STENCIL_TEST);
          this.setStencilMask(255);
        }
        this.gl.clear(
          (this.color ? this.gl.COLOR_BUFFER_BIT : 0) | (this.depth ? this.gl.DEPTH_BUFFER_BIT : 0) | (this.stencil ? this.gl.STENCIL_BUFFER_BIT : 0)
        );
      }
      if (update) scene.updateMatrixWorld();
      if (camera) camera.updateMatrixWorld();
      const renderList = this.getRenderList({ scene, camera, frustumCull, sort });
      renderList.forEach((node) => {
        node.draw({ camera });
      });
    }
  };

  // node_modules/ogl/src/math/functions/Vec4Func.js
  function copy2(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function set2(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }
  function normalize2(out, a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let w = a[3];
    let len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
    return out;
  }
  function dot2(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }

  // node_modules/ogl/src/math/functions/QuatFunc.js
  function identity(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
  }
  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    let s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }
  function multiply2(out, a, b) {
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  }
  function rotateX(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
  }
  function rotateY(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let by = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
  }
  function rotateZ(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bz = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
  }
  function slerp(out, a, b, t) {
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = b[0], by = b[1], bz = b[2], bw = b[3];
    let omega, cosom, sinom, scale0, scale1;
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    if (cosom < 0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (1 - cosom > 1e-6) {
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  }
  function invert(out, a) {
    let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    let dot4 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    let invDot = dot4 ? 1 / dot4 : 0;
    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
  }
  function conjugate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
  }
  function fromMat3(out, m) {
    let fTrace = m[0] + m[4] + m[8];
    let fRoot;
    if (fTrace > 0) {
      fRoot = Math.sqrt(fTrace + 1);
      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      let i = 0;
      if (m[4] > m[0]) i = 1;
      if (m[8] > m[i * 3 + i]) i = 2;
      let j = (i + 1) % 3;
      let k = (i + 2) % 3;
      fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1);
      out[i] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }
    return out;
  }
  function fromEuler(out, euler, order = "YXZ") {
    let sx = Math.sin(euler[0] * 0.5);
    let cx = Math.cos(euler[0] * 0.5);
    let sy = Math.sin(euler[1] * 0.5);
    let cy = Math.cos(euler[1] * 0.5);
    let sz = Math.sin(euler[2] * 0.5);
    let cz = Math.cos(euler[2] * 0.5);
    if (order === "XYZ") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "YXZ") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === "ZXY") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "ZYX") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === "YZX") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "XZY") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    }
    return out;
  }
  var copy3 = copy2;
  var set3 = set2;
  var dot3 = dot2;
  var normalize3 = normalize2;

  // node_modules/ogl/src/math/Quat.js
  var Quat = class extends Array {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      super(x, y, z, w);
      this.onChange = () => {
      };
      this._target = this;
      const triggerProps = ["0", "1", "2", "3"];
      return new Proxy(this, {
        set(target, property) {
          const success = Reflect.set(...arguments);
          if (success && triggerProps.includes(property)) target.onChange();
          return success;
        }
      });
    }
    get x() {
      return this[0];
    }
    get y() {
      return this[1];
    }
    get z() {
      return this[2];
    }
    get w() {
      return this[3];
    }
    set x(v) {
      this._target[0] = v;
      this.onChange();
    }
    set y(v) {
      this._target[1] = v;
      this.onChange();
    }
    set z(v) {
      this._target[2] = v;
      this.onChange();
    }
    set w(v) {
      this._target[3] = v;
      this.onChange();
    }
    identity() {
      identity(this._target);
      this.onChange();
      return this;
    }
    set(x, y, z, w) {
      if (x.length) return this.copy(x);
      set3(this._target, x, y, z, w);
      this.onChange();
      return this;
    }
    rotateX(a) {
      rotateX(this._target, this._target, a);
      this.onChange();
      return this;
    }
    rotateY(a) {
      rotateY(this._target, this._target, a);
      this.onChange();
      return this;
    }
    rotateZ(a) {
      rotateZ(this._target, this._target, a);
      this.onChange();
      return this;
    }
    inverse(q = this._target) {
      invert(this._target, q);
      this.onChange();
      return this;
    }
    conjugate(q = this._target) {
      conjugate(this._target, q);
      this.onChange();
      return this;
    }
    copy(q) {
      copy3(this._target, q);
      this.onChange();
      return this;
    }
    normalize(q = this._target) {
      normalize3(this._target, q);
      this.onChange();
      return this;
    }
    multiply(qA, qB) {
      if (qB) {
        multiply2(this._target, qA, qB);
      } else {
        multiply2(this._target, this._target, qA);
      }
      this.onChange();
      return this;
    }
    dot(v) {
      return dot3(this._target, v);
    }
    fromMatrix3(matrix3) {
      fromMat3(this._target, matrix3);
      this.onChange();
      return this;
    }
    fromEuler(euler, isInternal) {
      fromEuler(this._target, euler, euler.order);
      if (!isInternal) this.onChange();
      return this;
    }
    fromAxisAngle(axis, a) {
      setAxisAngle(this._target, axis, a);
      this.onChange();
      return this;
    }
    slerp(q, t) {
      slerp(this._target, this._target, q, t);
      this.onChange();
      return this;
    }
    fromArray(a, o = 0) {
      this._target[0] = a[o];
      this._target[1] = a[o + 1];
      this._target[2] = a[o + 2];
      this._target[3] = a[o + 3];
      this.onChange();
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      a[o + 3] = this[3];
      return a;
    }
  };

  // node_modules/ogl/src/math/functions/Mat4Func.js
  var EPSILON = 1e-6;
  function copy4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function set4(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function identity2(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function invert2(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  function determinant(a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  }
  function multiply3(out, a, b) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  function translate(out, a, v) {
    let x = v[0], y = v[1], z = v[2];
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  }
  function scale3(out, a, v) {
    let x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function rotate(out, a, rad, axis) {
    let x = axis[0], y = axis[1], z = axis[2];
    let len = Math.hypot(x, y, z);
    let s, c, t;
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    let b00, b01, b02;
    let b10, b11, b12;
    let b20, b21, b22;
    if (Math.abs(len) < EPSILON) {
      return null;
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  }
  function getTranslation(out, mat) {
    out[0] = mat[12];
    out[1] = mat[13];
    out[2] = mat[14];
    return out;
  }
  function getScaling(out, mat) {
    let m11 = mat[0];
    let m12 = mat[1];
    let m13 = mat[2];
    let m21 = mat[4];
    let m22 = mat[5];
    let m23 = mat[6];
    let m31 = mat[8];
    let m32 = mat[9];
    let m33 = mat[10];
    out[0] = Math.hypot(m11, m12, m13);
    out[1] = Math.hypot(m21, m22, m23);
    out[2] = Math.hypot(m31, m32, m33);
    return out;
  }
  function getMaxScaleOnAxis(mat) {
    let m11 = mat[0];
    let m12 = mat[1];
    let m13 = mat[2];
    let m21 = mat[4];
    let m22 = mat[5];
    let m23 = mat[6];
    let m31 = mat[8];
    let m32 = mat[9];
    let m33 = mat[10];
    const x = m11 * m11 + m12 * m12 + m13 * m13;
    const y = m21 * m21 + m22 * m22 + m23 * m23;
    const z = m31 * m31 + m32 * m32 + m33 * m33;
    return Math.sqrt(Math.max(x, y, z));
  }
  var getRotation = /* @__PURE__ */ (function() {
    const temp = [1, 1, 1];
    return function(out, mat) {
      let scaling = temp;
      getScaling(scaling, mat);
      let is1 = 1 / scaling[0];
      let is2 = 1 / scaling[1];
      let is3 = 1 / scaling[2];
      let sm11 = mat[0] * is1;
      let sm12 = mat[1] * is2;
      let sm13 = mat[2] * is3;
      let sm21 = mat[4] * is1;
      let sm22 = mat[5] * is2;
      let sm23 = mat[6] * is3;
      let sm31 = mat[8] * is1;
      let sm32 = mat[9] * is2;
      let sm33 = mat[10] * is3;
      let trace = sm11 + sm22 + sm33;
      let S = 0;
      if (trace > 0) {
        S = Math.sqrt(trace + 1) * 2;
        out[3] = 0.25 * S;
        out[0] = (sm23 - sm32) / S;
        out[1] = (sm31 - sm13) / S;
        out[2] = (sm12 - sm21) / S;
      } else if (sm11 > sm22 && sm11 > sm33) {
        S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
        out[3] = (sm23 - sm32) / S;
        out[0] = 0.25 * S;
        out[1] = (sm12 + sm21) / S;
        out[2] = (sm31 + sm13) / S;
      } else if (sm22 > sm33) {
        S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
        out[3] = (sm31 - sm13) / S;
        out[0] = (sm12 + sm21) / S;
        out[1] = 0.25 * S;
        out[2] = (sm23 + sm32) / S;
      } else {
        S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
        out[3] = (sm12 - sm21) / S;
        out[0] = (sm31 + sm13) / S;
        out[1] = (sm23 + sm32) / S;
        out[2] = 0.25 * S;
      }
      return out;
    };
  })();
  function decompose(srcMat, dstRotation, dstTranslation, dstScale) {
    let sx = length([srcMat[0], srcMat[1], srcMat[2]]);
    const sy = length([srcMat[4], srcMat[5], srcMat[6]]);
    const sz = length([srcMat[8], srcMat[9], srcMat[10]]);
    const det = determinant(srcMat);
    if (det < 0) sx = -sx;
    dstTranslation[0] = srcMat[12];
    dstTranslation[1] = srcMat[13];
    dstTranslation[2] = srcMat[14];
    const _m1 = srcMat.slice();
    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;
    _m1[0] *= invSX;
    _m1[1] *= invSX;
    _m1[2] *= invSX;
    _m1[4] *= invSY;
    _m1[5] *= invSY;
    _m1[6] *= invSY;
    _m1[8] *= invSZ;
    _m1[9] *= invSZ;
    _m1[10] *= invSZ;
    getRotation(dstRotation, _m1);
    dstScale[0] = sx;
    dstScale[1] = sy;
    dstScale[2] = sz;
  }
  function compose(dstMat, srcRotation, srcTranslation, srcScale) {
    const te = dstMat;
    const x = srcRotation[0], y = srcRotation[1], z = srcRotation[2], w = srcRotation[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const sx = srcScale[0], sy = srcScale[1], sz = srcScale[2];
    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;
    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;
    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;
    te[12] = srcTranslation[0];
    te[13] = srcTranslation[1];
    te[14] = srcTranslation[2];
    te[15] = 1;
    return te;
  }
  function fromQuat(out, q) {
    let x = q[0], y = q[1], z = q[2], w = q[3];
    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;
    let xx = x * x2;
    let yx = y * x2;
    let yy = y * y2;
    let zx = z * x2;
    let zy = z * y2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function perspective(out, fovy, aspect, near, far) {
    let f = 1 / Math.tan(fovy / 2);
    let nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
  }
  function ortho(out, left, right, bottom, top, near, far) {
    let lr = 1 / (left - right);
    let bt = 1 / (bottom - top);
    let nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }
  function targetTo(out, eye, target, up) {
    let eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
    let z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
    let len = z0 * z0 + z1 * z1 + z2 * z2;
    if (len === 0) {
      z2 = 1;
    } else {
      len = 1 / Math.sqrt(len);
      z0 *= len;
      z1 *= len;
      z2 *= len;
    }
    let x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
    len = x0 * x0 + x1 * x1 + x2 * x2;
    if (len === 0) {
      if (upz) {
        upx += 1e-6;
      } else if (upy) {
        upz += 1e-6;
      } else {
        upy += 1e-6;
      }
      x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
      len = x0 * x0 + x1 * x1 + x2 * x2;
    }
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
    out[0] = x0;
    out[1] = x1;
    out[2] = x2;
    out[3] = 0;
    out[4] = z1 * x2 - z2 * x1;
    out[5] = z2 * x0 - z0 * x2;
    out[6] = z0 * x1 - z1 * x0;
    out[7] = 0;
    out[8] = z0;
    out[9] = z1;
    out[10] = z2;
    out[11] = 0;
    out[12] = eyex;
    out[13] = eyey;
    out[14] = eyez;
    out[15] = 1;
    return out;
  }
  function add3(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
  }
  function subtract2(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
  }
  function multiplyScalar(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
  }

  // node_modules/ogl/src/math/Mat4.js
  var Mat4 = class extends Array {
    constructor(m00 = 1, m01 = 0, m02 = 0, m03 = 0, m10 = 0, m11 = 1, m12 = 0, m13 = 0, m20 = 0, m21 = 0, m22 = 1, m23 = 0, m30 = 0, m31 = 0, m32 = 0, m33 = 1) {
      super(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
      return this;
    }
    get x() {
      return this[12];
    }
    get y() {
      return this[13];
    }
    get z() {
      return this[14];
    }
    get w() {
      return this[15];
    }
    set x(v) {
      this[12] = v;
    }
    set y(v) {
      this[13] = v;
    }
    set z(v) {
      this[14] = v;
    }
    set w(v) {
      this[15] = v;
    }
    set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
      if (m00.length) return this.copy(m00);
      set4(this, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
      return this;
    }
    translate(v, m = this) {
      translate(this, m, v);
      return this;
    }
    rotate(v, axis, m = this) {
      rotate(this, m, v, axis);
      return this;
    }
    scale(v, m = this) {
      scale3(this, m, typeof v === "number" ? [v, v, v] : v);
      return this;
    }
    add(ma, mb) {
      if (mb) add3(this, ma, mb);
      else add3(this, this, ma);
      return this;
    }
    sub(ma, mb) {
      if (mb) subtract2(this, ma, mb);
      else subtract2(this, this, ma);
      return this;
    }
    multiply(ma, mb) {
      if (!ma.length) {
        multiplyScalar(this, this, ma);
      } else if (mb) {
        multiply3(this, ma, mb);
      } else {
        multiply3(this, this, ma);
      }
      return this;
    }
    identity() {
      identity2(this);
      return this;
    }
    copy(m) {
      copy4(this, m);
      return this;
    }
    fromPerspective({ fov, aspect, near, far } = {}) {
      perspective(this, fov, aspect, near, far);
      return this;
    }
    fromOrthogonal({ left, right, bottom, top, near, far }) {
      ortho(this, left, right, bottom, top, near, far);
      return this;
    }
    fromQuaternion(q) {
      fromQuat(this, q);
      return this;
    }
    setPosition(v) {
      this.x = v[0];
      this.y = v[1];
      this.z = v[2];
      return this;
    }
    inverse(m = this) {
      invert2(this, m);
      return this;
    }
    compose(q, pos, scale5) {
      compose(this, q, pos, scale5);
      return this;
    }
    decompose(q, pos, scale5) {
      decompose(this, q, pos, scale5);
      return this;
    }
    getRotation(q) {
      getRotation(q, this);
      return this;
    }
    getTranslation(pos) {
      getTranslation(pos, this);
      return this;
    }
    getScaling(scale5) {
      getScaling(scale5, this);
      return this;
    }
    getMaxScaleOnAxis() {
      return getMaxScaleOnAxis(this);
    }
    lookAt(eye, target, up) {
      targetTo(this, eye, target, up);
      return this;
    }
    determinant() {
      return determinant(this);
    }
    fromArray(a, o = 0) {
      this[0] = a[o];
      this[1] = a[o + 1];
      this[2] = a[o + 2];
      this[3] = a[o + 3];
      this[4] = a[o + 4];
      this[5] = a[o + 5];
      this[6] = a[o + 6];
      this[7] = a[o + 7];
      this[8] = a[o + 8];
      this[9] = a[o + 9];
      this[10] = a[o + 10];
      this[11] = a[o + 11];
      this[12] = a[o + 12];
      this[13] = a[o + 13];
      this[14] = a[o + 14];
      this[15] = a[o + 15];
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      a[o + 3] = this[3];
      a[o + 4] = this[4];
      a[o + 5] = this[5];
      a[o + 6] = this[6];
      a[o + 7] = this[7];
      a[o + 8] = this[8];
      a[o + 9] = this[9];
      a[o + 10] = this[10];
      a[o + 11] = this[11];
      a[o + 12] = this[12];
      a[o + 13] = this[13];
      a[o + 14] = this[14];
      a[o + 15] = this[15];
      return a;
    }
  };

  // node_modules/ogl/src/math/functions/EulerFunc.js
  function fromRotationMatrix(out, m, order = "YXZ") {
    if (order === "XYZ") {
      out[1] = Math.asin(Math.min(Math.max(m[8], -1), 1));
      if (Math.abs(m[8]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[10]);
        out[2] = Math.atan2(-m[4], m[0]);
      } else {
        out[0] = Math.atan2(m[6], m[5]);
        out[2] = 0;
      }
    } else if (order === "YXZ") {
      out[0] = Math.asin(-Math.min(Math.max(m[9], -1), 1));
      if (Math.abs(m[9]) < 0.99999) {
        out[1] = Math.atan2(m[8], m[10]);
        out[2] = Math.atan2(m[1], m[5]);
      } else {
        out[1] = Math.atan2(-m[2], m[0]);
        out[2] = 0;
      }
    } else if (order === "ZXY") {
      out[0] = Math.asin(Math.min(Math.max(m[6], -1), 1));
      if (Math.abs(m[6]) < 0.99999) {
        out[1] = Math.atan2(-m[2], m[10]);
        out[2] = Math.atan2(-m[4], m[5]);
      } else {
        out[1] = 0;
        out[2] = Math.atan2(m[1], m[0]);
      }
    } else if (order === "ZYX") {
      out[1] = Math.asin(-Math.min(Math.max(m[2], -1), 1));
      if (Math.abs(m[2]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[10]);
        out[2] = Math.atan2(m[1], m[0]);
      } else {
        out[0] = 0;
        out[2] = Math.atan2(-m[4], m[5]);
      }
    } else if (order === "YZX") {
      out[2] = Math.asin(Math.min(Math.max(m[1], -1), 1));
      if (Math.abs(m[1]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[5]);
        out[1] = Math.atan2(-m[2], m[0]);
      } else {
        out[0] = 0;
        out[1] = Math.atan2(m[8], m[10]);
      }
    } else if (order === "XZY") {
      out[2] = Math.asin(-Math.min(Math.max(m[4], -1), 1));
      if (Math.abs(m[4]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[5]);
        out[1] = Math.atan2(m[8], m[0]);
      } else {
        out[0] = Math.atan2(-m[9], m[10]);
        out[1] = 0;
      }
    }
    return out;
  }

  // node_modules/ogl/src/math/Euler.js
  var tmpMat4 = /* @__PURE__ */ new Mat4();
  var Euler = class extends Array {
    constructor(x = 0, y = x, z = x, order = "YXZ") {
      super(x, y, z);
      this.order = order;
      this.onChange = () => {
      };
      this._target = this;
      const triggerProps = ["0", "1", "2"];
      return new Proxy(this, {
        set(target, property) {
          const success = Reflect.set(...arguments);
          if (success && triggerProps.includes(property)) target.onChange();
          return success;
        }
      });
    }
    get x() {
      return this[0];
    }
    get y() {
      return this[1];
    }
    get z() {
      return this[2];
    }
    set x(v) {
      this._target[0] = v;
      this.onChange();
    }
    set y(v) {
      this._target[1] = v;
      this.onChange();
    }
    set z(v) {
      this._target[2] = v;
      this.onChange();
    }
    set(x, y = x, z = x) {
      if (x.length) return this.copy(x);
      this._target[0] = x;
      this._target[1] = y;
      this._target[2] = z;
      this.onChange();
      return this;
    }
    copy(v) {
      this._target[0] = v[0];
      this._target[1] = v[1];
      this._target[2] = v[2];
      this.onChange();
      return this;
    }
    reorder(order) {
      this._target.order = order;
      this.onChange();
      return this;
    }
    fromRotationMatrix(m, order = this.order) {
      fromRotationMatrix(this._target, m, order);
      this.onChange();
      return this;
    }
    fromQuaternion(q, order = this.order, isInternal) {
      tmpMat4.fromQuaternion(q);
      this._target.fromRotationMatrix(tmpMat4, order);
      if (!isInternal) this.onChange();
      return this;
    }
    fromArray(a, o = 0) {
      this._target[0] = a[o];
      this._target[1] = a[o + 1];
      this._target[2] = a[o + 2];
      return this;
    }
    toArray(a = [], o = 0) {
      a[o] = this[0];
      a[o + 1] = this[1];
      a[o + 2] = this[2];
      return a;
    }
  };

  // node_modules/ogl/src/core/Transform.js
  var Transform = class {
    constructor() {
      this.parent = null;
      this.children = [];
      this.visible = true;
      this.matrix = new Mat4();
      this.worldMatrix = new Mat4();
      this.matrixAutoUpdate = true;
      this.worldMatrixNeedsUpdate = false;
      this.position = new Vec3();
      this.quaternion = new Quat();
      this.scale = new Vec3(1);
      this.rotation = new Euler();
      this.up = new Vec3(0, 1, 0);
      this.rotation._target.onChange = () => this.quaternion.fromEuler(this.rotation, true);
      this.quaternion._target.onChange = () => this.rotation.fromQuaternion(this.quaternion, void 0, true);
    }
    setParent(parent, notifyParent = true) {
      if (this.parent && parent !== this.parent) this.parent.removeChild(this, false);
      this.parent = parent;
      if (notifyParent && parent) parent.addChild(this, false);
    }
    addChild(child, notifyChild = true) {
      if (!~this.children.indexOf(child)) this.children.push(child);
      if (notifyChild) child.setParent(this, false);
    }
    removeChild(child, notifyChild = true) {
      if (!!~this.children.indexOf(child)) this.children.splice(this.children.indexOf(child), 1);
      if (notifyChild) child.setParent(null, false);
    }
    updateMatrixWorld(force) {
      if (this.matrixAutoUpdate) this.updateMatrix();
      if (this.worldMatrixNeedsUpdate || force) {
        if (this.parent === null) this.worldMatrix.copy(this.matrix);
        else this.worldMatrix.multiply(this.parent.worldMatrix, this.matrix);
        this.worldMatrixNeedsUpdate = false;
        force = true;
      }
      for (let i = 0, l = this.children.length; i < l; i++) {
        this.children[i].updateMatrixWorld(force);
      }
    }
    updateMatrix() {
      this.matrix.compose(this.quaternion, this.position, this.scale);
      this.worldMatrixNeedsUpdate = true;
    }
    traverse(callback) {
      if (callback(this)) return;
      for (let i = 0, l = this.children.length; i < l; i++) {
        this.children[i].traverse(callback);
      }
    }
    decompose() {
      this.matrix.decompose(this.quaternion._target, this.position, this.scale);
      this.rotation.fromQuaternion(this.quaternion);
    }
    lookAt(target, invert4 = false) {
      if (invert4) this.matrix.lookAt(this.position, target, this.up);
      else this.matrix.lookAt(target, this.position, this.up);
      this.matrix.getRotation(this.quaternion._target);
      this.rotation.fromQuaternion(this.quaternion);
    }
  };

  // node_modules/ogl/src/math/functions/Mat3Func.js
  function fromMat4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
  }
  function fromQuat2(out, q) {
    let x = q[0], y = q[1], z = q[2], w = q[3];
    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;
    let xx = x * x2;
    let yx = y * x2;
    let yy = y * y2;
    let zx = z * x2;
    let zy = z * y2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;
    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;
    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;
    return out;
  }
  function copy5(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function set5(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
  }
  function identity3(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function invert3(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2];
    let a10 = a[3], a11 = a[4], a12 = a[5];
    let a20 = a[6], a21 = a[7], a22 = a[8];
    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;
    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
  }
  function multiply4(out, a, b) {
    let a00 = a[0], a01 = a[1], a02 = a[2];
    let a10 = a[3], a11 = a[4], a12 = a[5];
    let a20 = a[6], a21 = a[7], a22 = a[8];
    let b00 = b[0], b01 = b[1], b02 = b[2];
    let b10 = b[3], b11 = b[4], b12 = b[5];
    let b20 = b[6], b21 = b[7], b22 = b[8];
    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
  }
  function translate2(out, a, v) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v[0], y = v[1];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a10;
    out[4] = a11;
    out[5] = a12;
    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
  }
  function rotate2(out, a, rad) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;
    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
  }
  function scale4(out, a, v) {
    let x = v[0], y = v[1];
    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];
    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function normalFromMat4(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return out;
  }

  // node_modules/ogl/src/math/Mat3.js
  var Mat3 = class extends Array {
    constructor(m00 = 1, m01 = 0, m02 = 0, m10 = 0, m11 = 1, m12 = 0, m20 = 0, m21 = 0, m22 = 1) {
      super(m00, m01, m02, m10, m11, m12, m20, m21, m22);
      return this;
    }
    set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
      if (m00.length) return this.copy(m00);
      set5(this, m00, m01, m02, m10, m11, m12, m20, m21, m22);
      return this;
    }
    translate(v, m = this) {
      translate2(this, m, v);
      return this;
    }
    rotate(v, m = this) {
      rotate2(this, m, v);
      return this;
    }
    scale(v, m = this) {
      scale4(this, m, v);
      return this;
    }
    multiply(ma, mb) {
      if (mb) {
        multiply4(this, ma, mb);
      } else {
        multiply4(this, this, ma);
      }
      return this;
    }
    identity() {
      identity3(this);
      return this;
    }
    copy(m) {
      copy5(this, m);
      return this;
    }
    fromMatrix4(m) {
      fromMat4(this, m);
      return this;
    }
    fromQuaternion(q) {
      fromQuat2(this, q);
      return this;
    }
    fromBasis(vec3a, vec3b, vec3c) {
      this.set(vec3a[0], vec3a[1], vec3a[2], vec3b[0], vec3b[1], vec3b[2], vec3c[0], vec3c[1], vec3c[2]);
      return this;
    }
    inverse(m = this) {
      invert3(this, m);
      return this;
    }
    getNormalMatrix(m) {
      normalFromMat4(this, m);
      return this;
    }
  };

  // node_modules/ogl/src/core/Mesh.js
  var ID4 = 0;
  var Mesh = class extends Transform {
    constructor(gl, { geometry, program, mode = gl.TRIANGLES, frustumCulled = true, renderOrder = 0 } = {}) {
      super();
      if (!gl.canvas) console.error("gl not passed as first argument to Mesh");
      this.gl = gl;
      this.id = ID4++;
      this.geometry = geometry;
      this.program = program;
      this.mode = mode;
      this.frustumCulled = frustumCulled;
      this.renderOrder = renderOrder;
      this.modelViewMatrix = new Mat4();
      this.normalMatrix = new Mat3();
      this.beforeRenderCallbacks = [];
      this.afterRenderCallbacks = [];
    }
    onBeforeRender(f) {
      this.beforeRenderCallbacks.push(f);
      return this;
    }
    onAfterRender(f) {
      this.afterRenderCallbacks.push(f);
      return this;
    }
    draw({ camera } = {}) {
      if (camera) {
        if (!this.program.uniforms.modelMatrix) {
          Object.assign(this.program.uniforms, {
            modelMatrix: { value: null },
            viewMatrix: { value: null },
            modelViewMatrix: { value: null },
            normalMatrix: { value: null },
            projectionMatrix: { value: null },
            cameraPosition: { value: null }
          });
        }
        this.program.uniforms.projectionMatrix.value = camera.projectionMatrix;
        this.program.uniforms.cameraPosition.value = camera.worldPosition;
        this.program.uniforms.viewMatrix.value = camera.viewMatrix;
        this.modelViewMatrix.multiply(camera.viewMatrix, this.worldMatrix);
        this.normalMatrix.getNormalMatrix(this.modelViewMatrix);
        this.program.uniforms.modelMatrix.value = this.worldMatrix;
        this.program.uniforms.modelViewMatrix.value = this.modelViewMatrix;
        this.program.uniforms.normalMatrix.value = this.normalMatrix;
      }
      this.beforeRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));
      let flipFaces = this.program.cullFace && this.worldMatrix.determinant() < 0;
      this.program.use({ flipFaces });
      this.geometry.draw({ mode: this.mode, program: this.program });
      this.afterRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));
    }
  };

  // node_modules/ogl/src/core/Texture.js
  var emptyPixel = new Uint8Array(4);
  function isPowerOf2(value) {
    return (value & value - 1) === 0;
  }
  var ID5 = 1;
  var Texture = class {
    constructor(gl, {
      image,
      target = gl.TEXTURE_2D,
      type = gl.UNSIGNED_BYTE,
      format = gl.RGBA,
      internalFormat = format,
      wrapS = gl.CLAMP_TO_EDGE,
      wrapT = gl.CLAMP_TO_EDGE,
      wrapR = gl.CLAMP_TO_EDGE,
      generateMipmaps = target === (gl.TEXTURE_2D || gl.TEXTURE_CUBE_MAP),
      minFilter = generateMipmaps ? gl.NEAREST_MIPMAP_LINEAR : gl.LINEAR,
      magFilter = gl.LINEAR,
      premultiplyAlpha = false,
      unpackAlignment = 4,
      flipY = target == (gl.TEXTURE_2D || gl.TEXTURE_3D) ? true : false,
      anisotropy = 0,
      level = 0,
      width,
      // used for RenderTargets or Data Textures
      height = width,
      length: length3 = 1
    } = {}) {
      this.gl = gl;
      this.id = ID5++;
      this.image = image;
      this.target = target;
      this.type = type;
      this.format = format;
      this.internalFormat = internalFormat;
      this.minFilter = minFilter;
      this.magFilter = magFilter;
      this.wrapS = wrapS;
      this.wrapT = wrapT;
      this.wrapR = wrapR;
      this.generateMipmaps = generateMipmaps;
      this.premultiplyAlpha = premultiplyAlpha;
      this.unpackAlignment = unpackAlignment;
      this.flipY = flipY;
      this.anisotropy = Math.min(anisotropy, this.gl.renderer.parameters.maxAnisotropy);
      this.level = level;
      this.width = width;
      this.height = height;
      this.length = length3;
      this.texture = this.gl.createTexture();
      this.store = {
        image: null
      };
      this.glState = this.gl.renderer.state;
      this.state = {};
      this.state.minFilter = this.gl.NEAREST_MIPMAP_LINEAR;
      this.state.magFilter = this.gl.LINEAR;
      this.state.wrapS = this.gl.REPEAT;
      this.state.wrapT = this.gl.REPEAT;
      this.state.anisotropy = 0;
    }
    bind() {
      if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id) return;
      this.gl.bindTexture(this.target, this.texture);
      this.glState.textureUnits[this.glState.activeTextureUnit] = this.id;
    }
    update(textureUnit = 0) {
      const needsUpdate = !(this.image === this.store.image && !this.needsUpdate);
      if (needsUpdate || this.glState.textureUnits[textureUnit] !== this.id) {
        this.gl.renderer.activeTexture(textureUnit);
        this.bind();
      }
      if (!needsUpdate) return;
      this.needsUpdate = false;
      if (this.flipY !== this.glState.flipY) {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
        this.glState.flipY = this.flipY;
      }
      if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
        this.glState.premultiplyAlpha = this.premultiplyAlpha;
      }
      if (this.unpackAlignment !== this.glState.unpackAlignment) {
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment);
        this.glState.unpackAlignment = this.unpackAlignment;
      }
      if (this.minFilter !== this.state.minFilter) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.minFilter);
        this.state.minFilter = this.minFilter;
      }
      if (this.magFilter !== this.state.magFilter) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.magFilter);
        this.state.magFilter = this.magFilter;
      }
      if (this.wrapS !== this.state.wrapS) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS);
        this.state.wrapS = this.wrapS;
      }
      if (this.wrapT !== this.state.wrapT) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT);
        this.state.wrapT = this.wrapT;
      }
      if (this.wrapR !== this.state.wrapR) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_R, this.wrapR);
        this.state.wrapR = this.wrapR;
      }
      if (this.anisotropy && this.anisotropy !== this.state.anisotropy) {
        this.gl.texParameterf(this.target, this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropy);
        this.state.anisotropy = this.anisotropy;
      }
      if (this.image) {
        if (this.image.width) {
          this.width = this.image.width;
          this.height = this.image.height;
        }
        if (this.target === this.gl.TEXTURE_CUBE_MAP) {
          for (let i = 0; i < 6; i++) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.level, this.internalFormat, this.format, this.type, this.image[i]);
          }
        } else if (ArrayBuffer.isView(this.image)) {
          if (this.target === this.gl.TEXTURE_2D) {
            this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, this.image);
          } else if (this.target === this.gl.TEXTURE_2D_ARRAY || this.target === this.gl.TEXTURE_3D) {
            this.gl.texImage3D(this.target, this.level, this.internalFormat, this.width, this.height, this.length, 0, this.format, this.type, this.image);
          }
        } else if (this.image.isCompressedTexture) {
          for (let level = 0; level < this.image.length; level++) {
            this.gl.compressedTexImage2D(this.target, level, this.internalFormat, this.image[level].width, this.image[level].height, 0, this.image[level].data);
          }
        } else {
          if (this.target === this.gl.TEXTURE_2D) {
            this.gl.texImage2D(this.target, this.level, this.internalFormat, this.format, this.type, this.image);
          } else {
            this.gl.texImage3D(this.target, this.level, this.internalFormat, this.width, this.height, this.length, 0, this.format, this.type, this.image);
          }
        }
        if (this.generateMipmaps) {
          if (!this.gl.renderer.isWebgl2 && (!isPowerOf2(this.image.width) || !isPowerOf2(this.image.height))) {
            this.generateMipmaps = false;
            this.wrapS = this.wrapT = this.gl.CLAMP_TO_EDGE;
            this.minFilter = this.gl.LINEAR;
          } else {
            this.gl.generateMipmap(this.target);
          }
        }
        this.onUpdate && this.onUpdate();
      } else {
        if (this.target === this.gl.TEXTURE_CUBE_MAP) {
          for (let i = 0; i < 6; i++) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixel);
          }
        } else if (this.width) {
          if (this.target === this.gl.TEXTURE_2D) {
            this.gl.texImage2D(this.target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, null);
          } else {
            this.gl.texImage3D(this.target, this.level, this.internalFormat, this.width, this.height, this.length, 0, this.format, this.type, null);
          }
        } else {
          this.gl.texImage2D(this.target, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixel);
        }
      }
      this.store.image = this.image;
    }
  };

  // node_modules/ogl/src/extras/Triangle.js
  var Triangle = class extends Geometry {
    constructor(gl, { attributes = {} } = {}) {
      Object.assign(attributes, {
        position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
        uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
      });
      super(gl, attributes);
    }
  };

  // scripts/vendor/voroforce/display/renderer.js
  var Renderer2 = class {
    constructor(app) {
      this.initProperties(app);
      this.handleConfig();
      this.initInstance();
    }
    initProperties(app) {
      this.app = app;
      this.store = this.app.store;
      this.config = this.app.config.renderer;
      this.canvas = this.app.canvas;
      this.dimensions = this.app.dimensions;
    }
    handleConfig() {
      if (this.config.backgroundColor) {
        this.canvas.style.backgroundColor = this.config.backgroundColor;
      }
    }
    initInstance() {
      const {
        depth,
        preserveDrawingBuffer,
        alpha,
        premultipliedAlpha,
        antialias,
        clearColor,
        backgroundColor
      } = this.config;
      this.instance = new Renderer({
        canvas: this.canvas,
        alpha,
        premultipliedAlpha,
        antialias,
        depth,
        preserveDrawingBuffer,
        dpr: this.getPixelRatio(),
        width: this.dimensions.width,
        height: this.dimensions.height
      });
      this.gl = this.instance.gl;
      if (backgroundColor) this.canvas.style.backgroundColor = backgroundColor;
      if (clearColor) this.gl.clearColor(...clearColor);
      this.initScissor();
    }
    getPixelRatio(dimensions = this.dimensions) {
      return this.config.pixelRatio ?? dimensions.pixelRatio;
    }
    resize(dimensions = this.dimensions) {
      this.instance.dpr = this.getPixelRatio();
      this.instance.setSize(dimensions.width, dimensions.height);
      this.resizeScissor();
    }
    initScissor() {
      if (!this.config.scissor?.enabled) return;
      this.resizeScissor();
      this.instance.gl.enable(this.instance.gl.SCISSOR_TEST);
    }
    resizeScissor(newConfig) {
      if (newConfig)
        this.config.scissor = mergeConfigs(this.config.scissor, newConfig);
      const config = this.config.scissor;
      if (!config?.enabled) return;
      const pixelRatio = this.getPixelRatio();
      const padding = config?.padding ?? 0;
      const offsetTop = config?.offset?.top ?? 0;
      const offsetBottom = config?.offset?.bottom ?? 0;
      const offsetLeft = config?.offset?.left ?? 0;
      const offsetRight = config?.offset?.right ?? 0;
      const width = this.dimensions.width;
      const height = this.dimensions.height;
      this.instance.setScissor(
        (width - padding * 2 - offsetRight - offsetLeft) * pixelRatio,
        (height - padding * 2 - offsetTop - offsetBottom) * pixelRatio,
        (padding + offsetLeft) * pixelRatio,
        (padding + offsetTop) * pixelRatio
      );
    }
    update() {
      if (this.app.scene.instance.children.length === 0) return;
      this.instance.render({
        scene: this.app.scene.instance,
        camera: this.app.controls?.camera
      });
    }
    dispose() {
    }
  };

  // scripts/vendor/voroforce/display/scene/shaders/dev/dev-points.frag
  var dev_points_default = "precision mediump float;\nvoid main() {\n    vec2 coord = gl_PointCoord  * 2.0 - 1.0;\n    float dist = dot(coord, coord);\n    if (dist > 1.0) {\n        discard; // Discard fragments outside the circle\n    }\n    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color\n}\n";

  // scripts/vendor/voroforce/display/scene/shaders/dev/dev-points.vert
  var dev_points_default2 = "attribute vec2 position;\nuniform vec3 iResolution; // Size of the viewport in pixels\n\nvec2 ndc(vec2 screenPos) {\n    return vec2(\n        (screenPos.x / iResolution.x) * 2.0 - 1.0,\n        (screenPos.y / iResolution.y) * -2.0 + 1.0\n    );\n}\n\nvoid main() {\n    gl_Position = vec4(ndc(position), 0.0, 1.0);\n    gl_PointSize = 5.0; // Set the point size if drawing points\n}\n";

  // scripts/vendor/voroforce/display/scene/utils/compressed-media-grid-array-texture.js
  var CompressedMediaGridArrayTexture = class extends Texture {
    constructor(gl, args) {
      let ext;
      let internalFormat;
      if (args.compressionFormat === "etc") {
        ext = gl.getExtension("WEBGL_compressed_texture_etc");
        if (!ext) {
          console.error("ETC1 texture compression not supported");
        }
        internalFormat = ext.COMPRESSED_RGB_ETC1_WEBGL;
      } else if (args.compressionFormat === "ktx") {
        ext = gl.getExtension("WEBGL_compressed_texture_etc");
        if (!ext) {
          console.error("ETC texture compression not supported");
        }
        internalFormat = ext.COMPRESSED_RGB8_ETC2;
      } else {
        ext = gl.getExtension("WEBGL_compressed_texture_s3tc");
        if (!ext) {
          console.error("S3TC texture compression not supported");
        }
        internalFormat = ext.COMPRESSED_RGB_S3TC_DXT1_EXT;
      }
      super(gl, {
        ...args,
        target: gl.TEXTURE_2D_ARRAY,
        internalFormat,
        // These are the key parameters for bilinear filtering
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE
        // If using mipmaps
        // generateMipmaps: true, // For some compressed formats
        // minFilter: gl.LINEAR_MIPMAP_LINEAR, // Trilinear filtering with mipmaps
      });
      __publicField(this, "pendingLayerUpdates", []);
      this.compressedTexExt = ext;
      this.internalFormat = internalFormat;
      this.bind();
      gl.texStorage3D(
        gl.TEXTURE_2D_ARRAY,
        1,
        // mipmap levels
        internalFormat,
        this.width,
        this.height,
        this.length
        // (number of layers)
      );
    }
    bind() {
      if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id)
        return;
      this.gl.bindTexture(this.target, this.texture);
      this.glState.textureUnits[this.glState.activeTextureUnit] = this.id;
    }
    update(textureUnit = 0) {
      if (this.pendingLayerUpdates.length > 0 || this.glState.textureUnits[textureUnit] !== this.id) {
        this.gl.renderer.activeTexture(textureUnit);
        this.bind();
        if (this.flipY !== this.glState.flipY) {
          this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
          this.glState.flipY = this.flipY;
        }
        if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
          this.gl.pixelStorei(
            this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
            this.premultiplyAlpha
          );
          this.glState.premultiplyAlpha = this.premultiplyAlpha;
        }
        if (this.unpackAlignment !== this.glState.unpackAlignment) {
          this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment);
          this.glState.unpackAlignment = this.unpackAlignment;
        }
        if (this.minFilter !== this.state.minFilter) {
          this.gl.texParameteri(
            this.target,
            this.gl.TEXTURE_MIN_FILTER,
            this.minFilter
          );
          this.state.minFilter = this.minFilter;
        }
        if (this.magFilter !== this.state.magFilter) {
          this.gl.texParameteri(
            this.target,
            this.gl.TEXTURE_MAG_FILTER,
            this.magFilter
          );
          this.state.magFilter = this.magFilter;
        }
        if (this.wrapS !== this.state.wrapS) {
          this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS);
          this.state.wrapS = this.wrapS;
        }
        if (this.wrapT !== this.state.wrapT) {
          this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT);
          this.state.wrapT = this.wrapT;
        }
        if (this.wrapR !== this.state.wrapR) {
          this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_R, this.wrapR);
          this.state.wrapR = this.wrapR;
        }
        if (this.anisotropy && this.anisotropy !== this.state.anisotropy) {
          this.gl.texParameterf(
            this.target,
            this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,
            this.anisotropy
          );
          this.state.anisotropy = this.anisotropy;
        }
      }
      if (this.generateMipmaps) {
        this.gl.generateMipmap(this.target);
      }
      this.pendingLayerUpdates.forEach(({ index, bytes }) => {
        this.gl.compressedTexSubImage3D(
          this.gl.TEXTURE_2D_ARRAY,
          0,
          0,
          0,
          index,
          this.width,
          this.height,
          1,
          // media.internalFormat,
          // this.compressedTexExt.COMPRESSED_RGB_S3TC_DXT1_EXT,
          this.internalFormat,
          bytes
        );
      });
      this.pendingLayerUpdates = [];
    }
    prepareLayerUpdate(index, bytes) {
      this.pendingLayerUpdates.push({
        index,
        bytes
      });
      this.needsUpdate = true;
    }
  };

  // scripts/vendor/voroforce/display/scene/utils/copy-render-target-to-canvas.js
  var copyRenderTargetToCanvas = (gl, rt, canvas) => {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rt.buffer);
    if (rt.textures.length > 1) {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + (rt.output?.index ?? 0));
    }
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      rt.width,
      rt.height,
      // Source rectangle (the off-screen buffer)
      0,
      0,
      canvas.width,
      canvas.height,
      // Destination rectangle (the canvas)
      gl.COLOR_BUFFER_BIT,
      // Mask (copy only color data)
      gl.NEAREST
      // Filtering (use NEAREST for pixel-perfect or LINEAR for smooth)
    );
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
  };

  // scripts/vendor/voroforce/display/scene/utils/no-depth-multi-render-target.js
  var NoDepthMultiRenderTarget = class {
    constructor(gl, {
      // width = gl.canvas.clientWidth,
      // height = gl.canvas.clientHeight,
      width = gl.canvas.width,
      height = gl.canvas.height,
      target = gl.FRAMEBUFFER,
      attachments = [{}]
    } = {}) {
      this.gl = gl;
      this.width = width;
      this.height = height;
      this.buffer = this.gl.createFramebuffer();
      this.target = target;
      this.gl.renderer.bindFramebuffer(this);
      this.textures = [];
      this.attachments = [];
      const drawBuffers = [];
      for (let i = 0; i < attachments.length; i++) {
        const attachment = { ...attachments[i] };
        attachment.index = i;
        this.attachments.push(attachment);
        this[attachment.name] = attachment;
        const {
          wrapS = gl.CLAMP_TO_EDGE,
          wrapT = gl.CLAMP_TO_EDGE,
          minFilter = gl.LINEAR,
          magFilter = minFilter,
          type = gl.UNSIGNED_BYTE,
          format = gl.RGBA,
          internalFormat = format,
          unpackAlignment,
          premultiplyAlpha
        } = attachment.textureOptions ?? {};
        const texture = new Texture(gl, {
          width,
          height,
          wrapS,
          wrapT,
          minFilter,
          magFilter,
          type,
          format,
          internalFormat,
          unpackAlignment,
          premultiplyAlpha,
          flipY: false,
          generateMipmaps: false
        });
        this.textures.push(texture);
        attachment.texture = texture;
        texture.update();
        this.gl.framebufferTexture2D(
          this.target,
          this.gl.COLOR_ATTACHMENT0 + i,
          this.gl.TEXTURE_2D,
          texture.texture,
          0
        );
        drawBuffers.push(this.gl.COLOR_ATTACHMENT0 + i);
      }
      if (drawBuffers.length > 1) this.gl.renderer.drawBuffers(drawBuffers);
      this.gl.renderer.bindFramebuffer({ target: this.target });
    }
    setSize(width, height) {
      if (this.width === width && this.height === height) return;
      this.width = width;
      this.height = height;
      this.gl.renderer.bindFramebuffer(this);
      for (let i = 0; i < this.textures.length; i++) {
        const texture = this.textures[i];
        texture.width = width;
        texture.height = height;
        texture.needsUpdate = true;
        texture.update();
        this.gl.framebufferTexture2D(
          this.target,
          this.gl.COLOR_ATTACHMENT0 + i,
          this.gl.TEXTURE_2D,
          texture.texture,
          0
        );
      }
      this.gl.renderer.bindFramebuffer({ target: this.target });
    }
  };

  // scripts/vendor/voroforce/display/scene/utils/read-pixels-async.js
  var clientWaitAsync = (gl, sync, flags = 0, interval_ms = 10) => {
    return new Promise((resolve, reject) => {
      const check = () => {
        const res = gl.clientWaitSync(sync, flags, 0);
        if (res === gl.WAIT_FAILED) {
          reject();
          return;
        }
        if (res === gl.TIMEOUT_EXPIRED) {
          setTimeout(check, interval_ms);
          return;
        }
        resolve();
      };
      check();
    });
  };
  var readPixelsAsync = (gl, x, y, width, height, buffer, format = gl.RGBA, type = gl.UNSIGNED_BYTE) => {
    const bufpak = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, bufpak);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, buffer.byteLength, gl.STREAM_READ);
    gl.readPixels(x, y, width, height, format, type, 0);
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) return null;
    gl.flush();
    return clientWaitAsync(gl, sync, 0, 10).then(() => {
      gl.deleteSync(sync);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, bufpak);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, buffer);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      gl.deleteBuffer(bufpak);
      return buffer;
    });
  };

  // scripts/vendor/voroforce/display/scene/utils/shader-defines.js
  function setShaderDefines(shaderSource, defines = {}) {
    let result = shaderSource;
    const processedDefines = /* @__PURE__ */ new Set();
    Object.entries(defines).forEach(([key, value]) => {
      const defineRegex = new RegExp(
        `^\\s*#define\\s+${key}\\b(?:\\s+\\S.*)?`,
        "gm"
      );
      const hasDefine = defineRegex.test(result);
      defineRegex.lastIndex = 0;
      if (hasDefine) {
        if (value !== null && value !== void 0) {
          result = result.replace(
            defineRegex,
            `#define ${key} ${processReplacement(value)}`
          );
        } else {
          result = result.replace(defineRegex, "");
        }
        processedDefines.add(key);
      }
    });
    Object.entries(defines).forEach(([key, value]) => {
      if (!processedDefines.has(key) && value !== null && value !== void 0) {
        result = injectDefine(result, key, processReplacement(value));
      }
    });
    return result;
  }
  function processReplacement(value) {
    if (typeof value === "string") {
      return value.replaceAll("\n", "");
    }
    return value;
  }
  function injectDefine(shaderSource, key, value) {
    const lines = shaderSource.split("\n");
    let injected = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#version")) {
        lines.splice(i + 1, 0, `#define ${key} ${value}`);
        injected = true;
        break;
      }
      if (!line.startsWith("#") && line.length > 0 && !injected) {
        lines.splice(i, 0, `#define ${key} ${value}`);
        injected = true;
        break;
      }
    }
    if (!injected) {
      lines.unshift(`#define ${key} ${value}`);
    }
    return lines.join("\n");
  }

  // scripts/vendor/voroforce/display/scene/utils/virtual-media-grid-array-texture.js
  var VirtualMediaGridArrayTexture = class extends Texture {
    constructor(gl, args) {
      super(gl, {
        ...args,
        target: gl.TEXTURE_2D_ARRAY,
        // These are the key parameters for bilinear filtering
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE
      });
      __publicField(this, "pendingLayerUpdates", []);
      const {
        virtualCols: cols,
        virtualRows: rows,
        tileWidth,
        tileHeight,
        virtualLayers: length3 = 50
      } = args.mediaVersion;
      this.cols = cols;
      this.rows = rows;
      this.layerCapacity = cols * rows;
      this.tileWidth = tileWidth;
      this.tileHeight = tileHeight;
      this.length = length3;
      this.bind();
      gl.texStorage3D(
        gl.TEXTURE_2D_ARRAY,
        1,
        // mipmap levels
        this.gl.RGBA8,
        this.width,
        this.height,
        this.length
        // (number of layers)
      );
    }
    bind() {
      if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id)
        return;
      this.gl.bindTexture(this.target, this.texture);
      this.glState.textureUnits[this.glState.activeTextureUnit] = this.id;
    }
    update(textureUnit = 0) {
      if (this.pendingLayerUpdates.length > 0 || this.glState.textureUnits[textureUnit] !== this.id) {
        this.gl.renderer.activeTexture(textureUnit);
        this.bind();
        if (this.flipY !== this.glState.flipY) {
          this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
          this.glState.flipY = this.flipY;
        }
        if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
          this.gl.pixelStorei(
            this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
            this.premultiplyAlpha
          );
          this.glState.premultiplyAlpha = this.premultiplyAlpha;
        }
        if (this.unpackAlignment !== this.glState.unpackAlignment) {
          this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment);
          this.glState.unpackAlignment = this.unpackAlignment;
        }
        if (this.minFilter !== this.state.minFilter) {
          this.gl.texParameteri(
            this.target,
            this.gl.TEXTURE_MIN_FILTER,
            this.minFilter
          );
          this.state.minFilter = this.minFilter;
        }
        if (this.magFilter !== this.state.magFilter) {
          this.gl.texParameteri(
            this.target,
            this.gl.TEXTURE_MAG_FILTER,
            this.magFilter
          );
          this.state.magFilter = this.magFilter;
        }
        if (this.wrapS !== this.state.wrapS) {
          this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS);
          this.state.wrapS = this.wrapS;
        }
        if (this.wrapT !== this.state.wrapT) {
          this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT);
          this.state.wrapT = this.wrapT;
        }
        if (this.wrapR !== this.state.wrapR) {
          this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_R, this.wrapR);
          this.state.wrapR = this.wrapR;
        }
        if (this.anisotropy && this.anisotropy !== this.state.anisotropy) {
          this.gl.texParameterf(
            this.target,
            this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,
            this.anisotropy
          );
          this.state.anisotropy = this.anisotropy;
        }
      }
      if (this.generateMipmaps) {
        this.gl.generateMipmap(this.target);
      }
      this.pendingLayerUpdates.forEach(({ index, bytes }) => {
        const tileIndex = index % this.layerCapacity;
        const tileRow = Math.floor(tileIndex / this.cols);
        const tileCol = tileIndex % this.cols;
        const trueLayerIndex = Math.floor(index / this.layerCapacity);
        const virtualLayerIndex = trueLayerIndex % this.length;
        if (ArrayBuffer.isView(bytes)) {
          this.gl.texSubImage3D(
            this.gl.TEXTURE_2D_ARRAY,
            0,
            tileCol * this.tileWidth,
            tileRow * this.tileHeight,
            virtualLayerIndex,
            this.tileWidth,
            this.tileHeight,
            1,
            this.format,
            this.type,
            bytes
          );
        } else {
          this.gl.texSubImage3D(
            this.gl.TEXTURE_2D_ARRAY,
            0,
            0,
            0,
            virtualLayerIndex,
            this.width,
            this.height,
            1,
            this.format,
            this.type,
            bytes
          );
        }
      });
      this.pendingLayerUpdates = [];
    }
    prepareLayerUpdate(index, bytes) {
      this.pendingLayerUpdates.push({
        index,
        bytes
      });
      this.needsUpdate = true;
    }
  };

  // scripts/vendor/voroforce/display/scene/base-scene.js
  var BaseScene = class {
    constructor(app) {
      __publicField(this, "mainRenderTargets", null);
      __publicField(this, "postRenderTargets", null);
      __publicField(this, "activeMainRenderTarget", null);
      __publicField(this, "activePostRenderTarget", null);
      this.init(app);
    }
    init(app) {
      this.initProperties(app);
      this.initCustom();
      this.initMedia();
      this.initMeshes();
    }
    initProperties(app) {
      this.app = app;
      this.store = app.store;
      this.ticker = this.store.get("ticker");
      this.globalConfig = this.store.get("config");
      this.appConfig = this.app.config;
      this.config = this.appConfig.scene;
      this.gl = this.app.renderer.gl;
      this.loader = this.store.get("loader");
      this.cells = this.app.cells;
      this.pointer = this.store.get("sharedPointer");
      this.sharedData = this.store.get("sharedData");
      this.numCells = this.cells.length;
      this.dimensions = this.app.dimensions;
      this.camera = this.app.controls?.camera;
      this.instance = new Transform();
      this.refreshResolutionUniform(this.dimensions);
    }
    initCustom() {
    }
    initMeshes() {
      this.initMain();
      this.initPost();
      this.initDev();
    }
    update() {
      this.beforeUpdate();
      this.updateMedia();
      this.updateMain();
      this.updatePost();
      this.updateDev();
      this.afterUpdate();
    }
    beforeUpdate() {
      if (this.mainBaseUniforms) {
        const { rows, cols, cellWidth, cellHeight } = this.globalConfig.lattice;
        this.mainBaseUniforms.iLatticeCols.value = cols;
        this.mainBaseUniforms.iLatticeRows.value = rows;
        this.mainBaseUniforms.fLatticeCellWidth.value = cellWidth;
        this.mainBaseUniforms.fLatticeCellHeight.value = cellHeight;
      }
      if (this.baseUniforms) {
        if (this.cells.focused)
          this.baseUniforms.iFocusedIndex.value = this.cells.focused.index;
        this.baseUniforms.iTime.value = this.ticker.elapsed / 1e3;
        this.baseUniforms.fPointer.value = this.getPointer();
        this.updateCenterForceUniforms();
      }
      this.beforeUpdateCustom();
    }
    afterUpdate() {
      this.afterUpdateCustom();
    }
    beforeUpdateCustom() {
    }
    afterUpdateCustom() {
    }
    resize(dimensions = this.dimensions) {
      this.refreshResolutionUniform(dimensions);
      this.resizeMain();
      this.resizePost();
      this.resizeDev();
      this.refreshCustom();
    }
    initMain() {
      if (!this.config.main?.enabled) return;
      this.mainProgram = this.initProgram(
        this.config.main,
        this.initMainUniforms()
      );
      this.mainMesh = new Mesh(this.gl, {
        geometry: this.initGeometry(this.config.main),
        program: this.mainProgram
      });
      if (!this.mainRenderTargets && !this.config.post?.enabled)
        this.mainMesh.setParent(this.instance);
    }
    initPost() {
      if (!this.config.post?.enabled) return;
      this.postProgram = this.initProgram(
        this.config.post,
        this.initPostUniforms()
      );
      this.postMesh = new Mesh(this.gl, {
        geometry: this.initGeometry(this.config.post),
        program: this.postProgram
      });
      if (!this.postRenderTargets) this.postMesh.setParent(this.instance);
    }
    initDev() {
      if (!this.config.dev?.enabled) return;
      if (!this.devPointsMesh) {
        this.devPointsGeometry = new Geometry(this.gl, {
          position: {
            size: 2,
            data: this.store.get("sharedCellCoords")
          }
        });
        this.devPointsProgram = new Program(this.gl, {
          vertex: dev_points_default2,
          fragment: dev_points_default,
          uniforms: {
            iResolution: { value: this.resolutionUniform }
          },
          transparent: true
        });
        this.devPointsMesh = new Mesh(this.gl, {
          geometry: this.devPointsGeometry,
          program: this.devPointsProgram,
          mode: this.gl.POINTS
        });
      }
      if (!this.mainRenderTargets || this.config.post?.enabled)
        this.devPointsMesh.setParent(this.instance);
    }
    stopDev() {
      if (!this.devPointsMesh) return;
      this.devPointsMesh.setParent(null);
    }
    resizeMain() {
      if (!this.config.main?.enabled) return;
      this.mainProgram.uniforms.iResolution.value = this.resolutionUniform;
      if (this.baseUniforms) {
        setTimeout(() => this.resetCenterForceUniforms(), 100);
      }
      this.mainRenderTargets?.forEach(
        (target) => target.setSize(this.app.canvas.width, this.app.canvas.height)
      );
    }
    resizePost() {
      if (!this.config.post?.enabled) return;
      this.postProgram.uniforms.iResolution.value = this.resolutionUniform;
      this.postRenderTargets?.forEach(
        (target) => target.setSize(this.app.canvas.width, this.app.canvas.height)
      );
    }
    resizeDev() {
      if (this.devPointsProgram) {
        this.devPointsProgram.uniforms.iResolution.value = this.resolutionUniform;
      }
    }
    updateMain() {
      if (!this.config.main?.enabled) return;
      if (this.activeMainRenderTarget) {
        this.app.renderer.instance.render({
          scene: this.mainMesh,
          camera: this.camera,
          target: this.activeMainRenderTarget
        });
        if (!this.mainMesh.parent && !this.config.post?.enabled) {
          copyRenderTargetToCanvas(
            this.gl,
            this.activeMainRenderTarget,
            this.app.canvas
          );
        }
      }
    }
    updatePost() {
      if (!this.config.post?.enabled) return;
      if (this.activePostRenderTarget) {
        this.app.renderer.instance.render({
          scene: this.postMesh,
          camera: this.camera,
          target: this.activePostRenderTarget
        });
        if (!this.postMesh.parent) {
          copyRenderTargetToCanvas(
            this.gl,
            this.activePostRenderTarget,
            this.app.canvas
          );
        }
      }
    }
    updateDev() {
      if (!this.config.dev?.enabled) return;
      this.devPointsGeometry.attributes.position.needsUpdate = true;
      if (this.activeMainRenderTarget && !this.config.post?.enabled) {
        this.app.renderer.instance.render({
          scene: this.devPointsMesh,
          camera: this.camera,
          target: this.activeMainRenderTarget,
          clear: false
        });
      }
    }
    refreshCustom() {
    }
    initGeometry(config) {
      return new Triangle(this.gl, {
        depth: config.depth
      });
    }
    initProgram(config, uniforms) {
      let fragment = config.fragmentShader;
      if (config.defines) fragment = setShaderDefines(fragment, config.defines);
      return new Program(this.gl, {
        vertex: config.vertexShader,
        fragment,
        uniforms
      });
    }
    initRenderTargets(count = 1, options = {}) {
      return [...Array(count)].map(
        () => new NoDepthMultiRenderTarget(this.gl, options)
      );
    }
    refreshResolutionUniform(dimensions = this.dimensions) {
      this.resolutionUniform = [
        dimensions.width,
        dimensions.height,
        this.appConfig.renderer?.pixelRatio ?? dimensions.pixelRatio
      ];
    }
    getCompressedMediaVersions() {
      const compressedMediaVersions = this.globalConfig.media.versions.filter(
        ({ type }) => !type || type === "compressed-grid"
      );
      compressedMediaVersions.length = 3;
      return Array.from(compressedMediaVersions);
    }
    getUnCompressedMediaVersions() {
      const uncompressedMediaVersions = this.globalConfig.media.versions.filter(
        ({ type }) => type && type !== "compressed-grid"
      );
      uncompressedMediaVersions.length = 1;
      return uncompressedMediaVersions;
    }
    initMedia() {
      if (!this.globalConfig.media?.enabled) {
        const emptyTex = new Texture(this.gl, {});
        this.compressedMediaGridTextures = this.getCompressedMediaVersions().map(
          () => emptyTex
        );
        this.virtualMediaGridTextures = this.globalConfig.media.versions.filter(({ type }) => type && type !== "compressed-grid").map(() => emptyTex);
        return;
      }
      this.compressedMediaGridTextures = this.getCompressedMediaVersions().map(
        (mediaVersion) => {
          if (!mediaVersion) return new Texture(this.gl, {});
          const { width, height, layers } = mediaVersion;
          return new CompressedMediaGridArrayTexture(this.gl, {
            width,
            height,
            length: layers,
            compressionFormat: this.globalConfig.media.compressionFormat
          });
        }
      );
      this.virtualMediaGridTextures = this.getUnCompressedMediaVersions().map(
        (mediaVersion) => {
          const { width, height, layers } = mediaVersion;
          return new VirtualMediaGridArrayTexture(this.gl, {
            width,
            height,
            length: layers,
            mediaVersion
          });
        }
      );
      this.loader.addEventListener(
        "mediaLayerLoaded",
        ({ data: { versionIndex, layerIndex, bytes, type } }) => {
          if (!type || type === "compressed-grid") {
            this.compressedMediaGridTextures[versionIndex].prepareLayerUpdate?.(
              layerIndex,
              bytes
            );
          } else {
            this.virtualMediaGridTextures[0].prepareLayerUpdate(layerIndex, bytes);
          }
        }
      );
      switch (this.globalConfig.media.preload) {
        case "v0":
          this.loader.preloadAllMediaLayersVersion0();
          break;
        case "first":
          this.loader.preloadFirstMediaLayerAllGridVersions();
          break;
      }
    }
    updateMedia() {
      if (!this.globalConfig.media?.enabled) return;
    }
    initBaseMediaUniforms() {
      const compressedMediaVersions = this.getCompressedMediaVersions();
      const uncompressedMediaVersions = this.getUnCompressedMediaVersions();
      const firstUncompressedMediaVersion = uncompressedMediaVersions[0];
      const useUncompressedFallbackForV0 = !compressedMediaVersions[0] && firstUncompressedMediaVersion;
      const stdMediaVersionCols = compressedMediaVersions.map((v) => v?.cols ?? 0);
      const stdMediaVersionRows = compressedMediaVersions.map((v) => v?.rows ?? 0);
      const stdMediaVersionLayers = compressedMediaVersions.map(
        (v) => v?.layers ?? 0
      );
      if (useUncompressedFallbackForV0) {
        stdMediaVersionCols[0] = firstUncompressedMediaVersion.virtualCols;
        stdMediaVersionRows[0] = firstUncompressedMediaVersion.virtualRows;
        stdMediaVersionLayers[0] = firstUncompressedMediaVersion.virtualLayers;
      }
      return {
        bMediaEnabled: { value: this.globalConfig.media?.enabled ?? false },
        uMediaV0Texture: {
          value: useUncompressedFallbackForV0 ? this.virtualMediaGridTextures[0] : this.compressedMediaGridTextures[0]
        },
        uMediaV1Texture: { value: this.compressedMediaGridTextures[1] },
        uMediaV2Texture: { value: this.compressedMediaGridTextures[2] },
        uMediaV3Texture: {
          value: this.virtualMediaGridTextures[0] ?? new Texture(this.gl, {})
        },
        iStdMediaVersionNumCols: {
          value: stdMediaVersionCols
        },
        iStdMediaVersionNumRows: {
          value: stdMediaVersionRows
        },
        iStdMediaVersionNumLayers: {
          value: stdMediaVersionLayers
        },
        iVirtMediaVersionNumCols: {
          value: uncompressedMediaVersions[0]?.virtualCols ?? 0
        },
        iVirtMediaVersionNumRows: {
          value: uncompressedMediaVersions[0]?.virtualRows ?? 0
        },
        iVirtMediaVersionNumLayers: {
          value: uncompressedMediaVersions[0]?.virtualLayers ?? 0
        }
      };
    }
    getPointer() {
      return [
        this.pointer?.x ?? this.cells?.focused?.x ?? 0,
        this.pointer?.y ?? this.cells?.focused?.y ?? 0
      ];
    }
    getCenterForce() {
      return [
        !Number.isNaN(this.sharedData?.centerForceX) && this.sharedData?.centerForceX ? this.sharedData.centerForceX : this.dimensions.width / 2,
        !Number.isNaN(this.sharedData?.centerForceY) && this.sharedData?.centerForceY ? this.sharedData.centerForceY : this.dimensions.height / 2
      ];
    }
    getCenterForceStrengthMod() {
      return this.sharedData?.centerForceStrengthMod ?? 0;
    }
    initCenterForceUniforms() {
      const centerForce = this.getCenterForce();
      const centerForceStrengthMod = this.getCenterForceStrengthMod();
      return {
        fCenterForce: { value: centerForce },
        fCenterForceStrengthMod: {
          value: centerForceStrengthMod
        },
        fCenterForce2: { value: centerForce },
        fCenterForceStrengthMod2: {
          value: centerForceStrengthMod
        },
        fCenterForce3: { value: centerForce },
        fCenterForceStrengthMod3: {
          value: centerForceStrengthMod
        }
      };
    }
    updateCenterForceUniforms() {
      const centerForce = this.getCenterForce();
      const centerForceStrengthMod = this.getCenterForceStrengthMod();
      this.baseUniforms.fCenterForce.value = centerForce;
      this.baseUniforms.fCenterForceStrengthMod.value = centerForceStrengthMod;
      this.baseUniforms.fCenterForce2.value = [
        lerp(this.baseUniforms.fCenterForce2.value[0], centerForce[0], 0.125),
        lerp(this.baseUniforms.fCenterForce2.value[1], centerForce[1], 0.125)
      ];
      this.baseUniforms.fCenterForceStrengthMod2.value = lerp(
        this.baseUniforms.fCenterForceStrengthMod2.value,
        centerForceStrengthMod,
        0.125
      );
      this.baseUniforms.fCenterForce3.value = [
        lerp(this.baseUniforms.fCenterForce3.value[0], centerForce[0], 0.075),
        lerp(this.baseUniforms.fCenterForce3.value[1], centerForce[1], 0.075)
      ];
      this.baseUniforms.fCenterForceStrengthMod3.value = lerp(
        this.baseUniforms.fCenterForceStrengthMod3.value,
        centerForceStrengthMod,
        0.075
      );
    }
    resetCenterForceUniforms() {
      const centerForce = this.getCenterForce();
      const centerForceStrengthMod = this.getCenterForceStrengthMod();
      this.baseUniforms.fCenterForce.value = centerForce;
      this.baseUniforms.fCenterForceStrengthMod.value = centerForceStrengthMod;
      this.baseUniforms.fCenterForce2.value = centerForce;
      this.baseUniforms.fCenterForceStrengthMod2.value = centerForceStrengthMod;
      this.baseUniforms.fCenterForce3.value = centerForce;
      this.baseUniforms.fCenterForceStrengthMod3.value = centerForceStrengthMod;
    }
    initBaseUniforms() {
      if (!this.baseUniforms) {
        this.baseUniforms = {
          ...this.initBaseMediaUniforms(),
          iResolution: {
            value: this.resolutionUniform
          },
          iFocusedIndex: { value: this.cells?.focused?.index ?? -1 },
          iNumCells: {
            value: this.cells.length
          },
          iTime: { value: 0 },
          fPointer: { value: this.getPointer() },
          ...this.initCenterForceUniforms()
        };
      }
      return this.baseUniforms;
    }
    getConfigUniforms(config) {
      const uniforms = config.uniforms ?? {};
      Object.entries(uniforms).forEach(([k, v]) => {
        if (k.startsWith("iChannel")) {
          uniforms[k] = {
            value: new Texture(this.gl, {
              width: v.width,
              height: v.height,
              wrapS: this.gl.MIRRORED_REPEAT,
              wrapT: this.gl.MIRRORED_REPEAT
            })
          };
          const u = uniforms[k];
          this.loader.load(v.src, (image) => {
            u.value.image = image;
          });
        }
      });
      return uniforms;
    }
    initConfigUniforms() {
      if (!this.configUniforms)
        this.configUniforms = this.getConfigUniforms(this.config);
      return this.configUniforms;
    }
    initMainBaseUniforms() {
      const { cellWidth, cellHeight, rows, cols } = this.globalConfig.lattice;
      this.mainBaseUniforms = {
        fLatticeCellWidth: { value: cellWidth },
        fLatticeCellHeight: { value: cellHeight },
        iLatticeCols: { value: cols },
        iLatticeRows: { value: rows },
        iForcedMaxNeighborLevel: { value: 0 },
        fBorderRoundnessMod: { value: 1 },
        fBorderSmoothnessMod: { value: 1 },
        fBorderThicknessMod: { value: 1 },
        fBaseColor: { value: [0, 0, 0] },
        bDrawEdges: { value: !this.config.post?.enabled },
        bVoroEdgeBufferOutput: { value: this.config.post?.enabled }
      };
      return {
        ...this.initBaseUniforms(),
        ...this.mainBaseUniforms
      };
    }
    initMainCustomUniforms() {
      return {};
    }
    initMainConfigUniforms() {
      return {
        ...this.initConfigUniforms(),
        ...this.getConfigUniforms(this.config.main)
      };
    }
    initMainUniforms() {
      this.mainUniforms = {
        ...this.initMainBaseUniforms(),
        ...this.initMainCustomUniforms(),
        ...this.initMainConfigUniforms()
      };
      return this.mainUniforms;
    }
    initPostBaseUniforms() {
      return this.initBaseUniforms();
    }
    initPostCustomUniforms() {
      return {};
    }
    initPostConfigUniforms() {
      return {
        ...this.initConfigUniforms(),
        ...this.getConfigUniforms(this.config.post)
      };
    }
    initPostUniforms() {
      return {
        ...this.initPostBaseUniforms(),
        ...this.initPostCustomUniforms(),
        ...this.initPostConfigUniforms()
      };
    }
    initCellCoordsTexture() {
      this.cellCoordsTexture = new Texture(this.gl, {
        width: this.store.get("sharedCellCoordsTextureWidth"),
        height: this.store.get("sharedCellCoordsTextureHeight"),
        image: this.store.get("sharedCellCoords"),
        format: this.gl.RG,
        internalFormat: this.gl.RG32F,
        type: this.gl.FLOAT,
        wrapS: this.gl.CLAMP_TO_EDGE,
        wrapT: this.gl.CLAMP_TO_EDGE,
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        generateMipmaps: false,
        flipY: false
      });
    }
    getPositionRenderTarget() {
      return this.mainRenderTargets?.[0];
    }
    getPositionRenderTargetColorTexture(rt) {
      return rt.voroIndexBuffer?.index ?? 0;
    }
    async getPositionCellIndices(position) {
      const rt = this.getPositionRenderTarget();
      if (!rt) return;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, rt.buffer);
      if (rt.textures.length > 1) {
        this.gl.readBuffer(
          this.gl.COLOR_ATTACHMENT0 + this.getPositionRenderTargetColorTexture(rt)
        );
      }
      const data = new Uint32Array(4);
      await readPixelsAsync(
        this.gl,
        position.x * (rt.width / this.dimensions.width),
        rt.height - position.y * (rt.height / this.dimensions.height),
        1,
        1,
        data,
        this.gl.RGBA,
        this.gl.FLOAT
      );
      const index = data[0] - 1;
      const index2 = data[1] - 1;
      const index3 = data[2] - 1;
      const index4 = data[3] - 1;
      if (index >= 0) {
        return [index, index2, index3, index4];
      }
    }
    dispose() {
    }
  };

  // scripts/vendor/voroforce/display/scene/utils/swap.js
  function swap(obj, k1, k2) {
    const key1 = k1 === void 0 ? 0 : 1;
    const key2 = k2 === void 0 ? 1 : 0;
    const tmp = obj[key1];
    obj[key1] = obj[key2];
    obj[key2] = tmp;
    return obj;
  }

  // scripts/vendor/voroforce/display/scene/scene.js
  var Scene = class extends BaseScene {
    initCustom() {
      this.initCustomDataTextures();
      this.mainRenderTargets = this.initRenderTargets(2, {
        attachments: [
          {
            name: "voroIndexBuffer",
            textureOptions: {
              format: this.gl.RGBA,
              internalFormat: this.gl.RGBA32F,
              type: this.gl.FLOAT,
              minFilter: this.gl.NEAREST
            }
          },
          {
            name: "output"
          },
          ...this.config.post?.enabled ? [
            {
              name: "voroEdgeBuffer",
              textureOptions: {
                format: this.gl.RGBA,
                internalFormat: this.gl.RGBA32F,
                type: this.gl.FLOAT
                // minFilter: this.gl.NEAREST,
              }
            }
          ] : []
        ]
      });
      this.activeMainRenderTarget = this.mainRenderTargets[0];
      this.inactiveMainRenderTarget = this.mainRenderTargets[1];
      if (this.config.post?.enabled && this.config.post.voroIndexBuffer) {
        this.postRenderTargets = this.initRenderTargets(1, {
          attachments: [
            {
              name: "output"
            },
            {
              name: "voroIndexBuffer",
              textureOptions: {
                format: this.gl.RGBA,
                internalFormat: this.gl.RGBA32F,
                type: this.gl.FLOAT,
                minFilter: this.gl.NEAREST
              }
            }
          ]
        });
        this.activePostRenderTarget = this.postRenderTargets[0];
        this.inactivePostRenderTarget = this.postRenderTargets[0];
      }
    }
    initCustomDataTextures() {
      this.initCellCoordsTexture();
      this.initCellNeighborsTexture();
      this.initCellWeightsTexture();
      this.initCellMediaVersionsTexture();
      this.initCellIdsTexture();
    }
    beforeUpdateCustom() {
      this.cellCoordsTexture.needsUpdate = true;
      this.cellWeightsTexture.needsUpdate = true;
      this.cellMediaVersionsTexture.needsUpdate = true;
    }
    afterUpdateCustom() {
      if (!this.config.main?.enabled) return;
      this.swapMainRenderTargets();
      this.mainCustomUniforms.uVoroIndexBufferTexture.value = this.inactiveMainRenderTarget.voroIndexBuffer.texture;
      if (this.config.post?.enabled) {
        this.postCustomUniforms.uMainOutputTexture.value = this.inactiveMainRenderTarget.output.texture;
        this.postCustomUniforms.uVoroEdgeBufferTexture.value = this.inactiveMainRenderTarget.voroEdgeBuffer.texture;
        if (this.config.post.voroIndexBuffer) {
          this.postCustomUniforms.uVoroIndexBufferTexture.value = this.inactiveMainRenderTarget.voroIndexBuffer.texture;
        }
      }
    }
    swapMainRenderTargets() {
      swap(this.mainRenderTargets);
      this.activeMainRenderTarget = this.mainRenderTargets[0];
      this.inactiveMainRenderTarget = this.mainRenderTargets[1];
    }
    refreshCustom() {
      this.cellNeighborsTexture.needsUpdate = true;
    }
    initMainCustomUniforms() {
      this.mainCustomUniforms = {
        uCellCoordsTexture: {
          value: this.cellCoordsTexture
        },
        uCellNeighborsTexture: {
          value: this.cellNeighborsTexture
        },
        uCellWeightsTexture: {
          value: this.cellWeightsTexture
        },
        uCellMediaVersionsTexture: {
          value: this.cellMediaVersionsTexture
        },
        uCellIdMapTexture: {
          value: this.cellIdsTexture
        },
        uVoroIndexBufferTexture: {
          value: this.inactiveMainRenderTarget.voroIndexBuffer.texture
        }
      };
      return {
        ...this.initCustomUniforms(),
        ...this.mainCustomUniforms
      };
    }
    initPostCustomUniforms() {
      this.postCustomUniforms = {
        uVoroEdgeBufferTexture: {
          value: this.inactiveMainRenderTarget.voroEdgeBuffer.texture
        },
        uMainOutputTexture: {
          value: this.inactiveMainRenderTarget.output.texture
        },
        ...this.config.post.voroIndexBuffer ? {
          uVoroIndexBufferTexture: {
            value: this.inactiveMainRenderTarget.voroIndexBuffer.texture
          }
        } : {}
      };
      return {
        ...this.initCustomUniforms(),
        ...this.postCustomUniforms
      };
    }
    initCustomUniforms() {
      this.customUniforms = {};
      return this.customUniforms;
    }
    getPositionRenderTarget() {
      if (this.config.post?.enabled && this.config.post.voroIndexBuffer) {
        return this.inactivePostRenderTarget;
      }
      return this.inactiveMainRenderTarget;
    }
    initCellNeighborsTexture() {
      this.cellNeighborsTexture = new Texture(this.gl, {
        width: this.store.get("sharedCellNeighborsTextureWidth"),
        height: this.store.get("sharedCellNeighborsTextureHeight"),
        image: this.store.get("sharedCellNeighbors"),
        format: this.gl.RED_INTEGER,
        internalFormat: this.gl.R32UI,
        type: this.gl.UNSIGNED_INT,
        wrapS: this.gl.CLAMP_TO_EDGE,
        wrapT: this.gl.CLAMP_TO_EDGE,
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        generateMipmaps: false,
        flipY: false
      });
    }
    initCellWeightsTexture() {
      this.cellWeightsTexture = new Texture(this.gl, {
        width: this.store.get("sharedCellWeightsTextureWidth"),
        height: this.store.get("sharedCellWeightsTextureHeight"),
        image: this.store.get("sharedCellWeights"),
        format: this.gl.RED,
        internalFormat: this.gl.R32F,
        type: this.gl.FLOAT,
        // internalFormat: this.gl.R16F,
        // type: this.gl.HALF_FLOAT,
        wrapS: this.gl.CLAMP_TO_EDGE,
        wrapT: this.gl.CLAMP_TO_EDGE,
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        generateMipmaps: false,
        flipY: false
      });
    }
    initCellMediaVersionsTexture() {
      this.cellMediaVersionsTexture = new Texture(this.gl, {
        width: this.store.get("sharedCellMediaVersionsTextureWidth"),
        height: this.store.get("sharedCellMediaVersionsTextureHeight"),
        image: this.store.get("sharedCellMediaVersions"),
        format: this.gl.RG_INTEGER,
        internalFormat: this.gl.RG16UI,
        type: this.gl.UNSIGNED_SHORT,
        // type: this.gl.UNSIGNED_INT,
        wrapS: this.gl.CLAMP_TO_EDGE,
        wrapT: this.gl.CLAMP_TO_EDGE,
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        generateMipmaps: false,
        flipY: false
      });
    }
    initCellIdsTexture() {
      this.cellIdsTexture = new Texture(this.gl, {
        width: this.store.get("sharedCellIdsTextureWidth"),
        height: this.store.get("sharedCellIdsTextureHeight"),
        image: this.store.get("sharedCellIds"),
        format: this.gl.RED_INTEGER,
        internalFormat: this.gl.R32UI,
        type: this.gl.UNSIGNED_INT,
        wrapS: this.gl.CLAMP_TO_EDGE,
        wrapT: this.gl.CLAMP_TO_EDGE,
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        generateMipmaps: false,
        flipY: false
      });
    }
  };

  // scripts/vendor/voroforce/display/scene/shaders/default.vert
  var default_default = "#version 300 es\n\nin vec2 position;\nin vec2 uv;\n\nout vec2 vUv;\n\nvoid main() {\n    vUv = uv;\n    gl_Position = vec4(position, 0., 1.);\n}\n";

  // scripts/vendor/voroforce/display/scene/default-scene-config.js
  var defaultSceneConfig = {
    dev: {
      enabled: false
    },
    main: {
      enabled: true,
      geometry: "triangle",
      vertexShader: default_default
    },
    post: {
      enabled: false,
      geometry: "triangle",
      vertexShader: default_default
    }
  };

  // scripts/vendor/voroforce/display/utils/dev-tools.js
  function setupDevTools(devTools, app, config) {
    const d = devTools.paneFolders[1];
    const dMain = d.addFolder({
      title: "Main",
      expanded: true
    });
    Object.keys(config.scene.main.uniforms).forEach((key) => {
      if (isObject(config.scene.main.uniforms[key].value)) return;
      dMain.addBinding(config.scene.main.uniforms[key], "value").on("change", () => {
        app.scene.refreshCustom();
      }).label = key;
    });
    if (config.scene.post?.uniforms) {
      const dPost = d.addFolder({
        title: "Post",
        expanded: true
      });
      Object.keys(config.scene.post.uniforms).forEach((key) => {
        if (isObject(config.scene.post.uniforms[key].value)) return;
        dPost.addBinding(config.scene.post.uniforms[key], "value").on("change", () => {
          app.scene.refreshCustom();
        }).label = key;
      });
    }
  }

  // scripts/vendor/voroforce/display/display.js
  var Display = class {
    constructor(store) {
      this.initGlobals(store);
      this.initProperties();
      this.initComponents();
    }
    initGlobals(store) {
      this.store = store;
      this.globalConfig = this.store.get("config");
      this.config = this.globalConfig.display;
    }
    initProperties() {
      this.canvas = this.store.get("canvas");
      this.cells = this.store.get("cells");
      this.dimensions = this.store.get("dimensions");
    }
    initComponents() {
      this.initRenderer();
      this.initScene();
      this.initDevTools();
    }
    initRenderer() {
      this.renderer = new Renderer2(this);
      this.gl = this.renderer.gl;
      this.handleRendererCompatibility();
    }
    handleRendererCompatibility() {
      const media = this.globalConfig.media;
      if (!media?.enabled) return;
      const compressionFormats = {
        dds: "WEBGL_compressed_texture_s3tc",
        ktx: "WEBGL_compressed_texture_etc"
      };
      const compressionFormatKeys = Object.keys(compressionFormats);
      const index = compressionFormatKeys.indexOf(media.compressionFormat);
      if (index === -1) {
        throw new Error("Media compression format must be either dds or ktx.");
      }
      if (!this.gl.getExtension(compressionFormats[media.compressionFormat])) {
        media.compressionFormat = compressionFormatKeys[(index + 1) % compressionFormatKeys.length];
        if (!this.gl.getExtension(compressionFormats[media.compressionFormat])) {
          throw new Error("All compression formats are not supported.");
        }
      }
    }
    initScene() {
      this.scene = new Scene(this);
    }
    initDevTools() {
      this.handleDevTools = ({ value: devTools }) => {
        if (!devTools) return;
        setupDevTools(devTools, this, this.config);
      };
      this.store.addEventListener("devTools", this.handleDevTools);
    }
    resize(dimensions) {
      this.renderer.resize(dimensions);
      this.scene.resize(dimensions);
    }
    update() {
      this.scene.update();
      this.renderer.update();
    }
    getPositionCellIndices(position) {
      return this.scene.getPositionCellIndices(position);
    }
    dispose() {
      this.renderer.dispose();
      this.scene.dispose();
      this.store.removeEventListener("devTools", this.handleDevTools);
    }
  };

  // scripts/vendor/voroforce/display/default-display-config.js
  var defaultDisplayConfig = {
    scene: defaultSceneConfig,
    renderer: {
      depth: false,
      preserveDrawingBuffer: false,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      backgroundColor: "#ffffff00",
      // clearColor: [0, 1, 0, 1],
      // pixelRatio: 1, // override device pixel ratio
      scissor: {
        enabled: false,
        offset: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      }
    }
  };

  // scripts/vendor/voroforce/simulation/default-simulation-config.js
  var defaultNeighborsSimulationStepConfig = {
    levels: 1
  };
  var defaultForceSimulationStepConfig = {
    parameters: {
      alpha: 0.2,
      alphaTarget: 0,
      alphaDecay: 0,
      alphaMin: 0,
      velocityDecay: 0.7
    },
    forces: [
      {
        type: "lattice",
        enabled: true,
        strength: 0.8
      },
      {
        type: "origin",
        enabled: true,
        strength: 0.8
      },
      {
        type: "push",
        enabled: true,
        strength: 0.3,
        selector: "focused"
      }
    ]
  };
  var defaultSimulationConfig = {
    steps: {
      neighbors: defaultNeighborsSimulationStepConfig,
      force: defaultForceSimulationStepConfig
    }
  };

  // scripts/vendor/voroforce/simulation/utils/dev-tools.js
  function setupDevTools2(devTools, onChange, config, globalConfig) {
    const d = devTools.paneFolders[0];
    const tab = d.addTab({
      pages: [{ title: "General" }, { title: "Forces" }]
    });
    const dGeneral = tab.pages[0];
    const parameters = config.steps.force.parameters;
    const parameterBindings = [
      dGeneral.addBinding(parameters, "alpha", {
        step: 0.05,
        min: 0,
        max: 1
      }),
      // dGeneral.addBinding(parameters, 'alphaTarget', {
      //   step: 0.05,
      //   min: 0,
      //   max: 1,
      // }),
      // dGeneral.addBinding(parameters, 'alphaDecay', {
      //   step: 0.05,
      //   min: 0,
      //   max: 1,
      // }),
      // dGeneral.addBinding(parameters, 'alphaMin', {
      //   step: 0.05,
      //   min: 0,
      //   max: 1,
      // }),
      // .on('change', onChange).label = 'alphaMin'
      dGeneral.addBinding(parameters, "velocityDecay", {
        step: 0.05,
        min: 0,
        max: 1
      })
    ];
    if (globalConfig.multiThreading?.enabled) {
      parameterBindings.forEach((binding) => {
        binding.on("change", onChange);
      });
    }
  }

  // scripts/vendor/voroforce/simulation/base-simulation.js
  var BaseSimulation = class {
    constructor(store, { onUpdated = () => {
    } } = { onUpdated: () => {
    } }) {
      this.onUpdated = onUpdated;
      this.initGlobals(store);
      this.initProperties();
      this.initDevTools();
    }
    initGlobals(store) {
      this.store = store;
      this.globalConfig = this.store.get("config");
      this.config = this.globalConfig.simulation;
    }
    initProperties() {
      this.container = this.store.get("container");
      this.dimensions = this.store.get("dimensions");
      this.cells = this.store.get("cells");
    }
    initDevTools() {
      this.handleDevTools = ({ value: devTools }) => {
        if (!devTools) return;
        setupDevTools2(
          devTools,
          () => this.handleDevToolsChange(),
          this.config,
          this.globalConfig
        );
      };
      this.store.addEventListener("devTools", this.handleDevTools);
    }
    handleDevToolsChange() {
    }
    update() {
    }
    resize(dimensions) {
    }
    updateForceStepConfig(config) {
      this.config.steps.force = mergeConfigs(
        defaultForceSimulationStepConfig,
        config
      );
      this.handleForceStepConfigUpdated();
    }
    updateForceStepConfigParameters(parameters) {
      this.config.steps.force.parameters = mergeConfigs(
        defaultForceSimulationStepConfig.parameters,
        parameters
      );
      this.handleForceStepConfigParametersUpdated();
    }
    handleForceStepConfigUpdated() {
    }
    handleForceStepConfigParametersUpdated() {
    }
    dispose() {
    }
  };

  // scripts/vendor/voroforce/simulation/multi-threaded-simulation.js
  var import_meta = {};
  var MultiThreadedSimulation = class extends BaseSimulation {
    constructor(store, options) {
      super(store, options);
      __publicField(this, "workers", []);
      const workerState = this.store.getSimulationWorkerState();
      this.initForceWorker(workerState);
      this.initNeighborsWorker(workerState);
      for (let i = 0; i < this.workers.length; i++) {
        this.workers[i].addEventListener(
          "message",
          this.handleWorkerEvent.bind(this)
        );
      }
      this.updatingWorkersCount = 0;
    }
    initNeighborsWorker(workerState) {
      this.neighborsWorker = new Worker(
        new URL("./steps/neighbors-step/worker", import_meta.url),
        {
          type: "module",
          name: "neighbors-worker"
        }
      );
      this.neighborsWorker.postMessage({
        type: "init",
        state: workerState
      });
      this.workers.push(this.neighborsWorker);
    }
    initForceWorker(workerState) {
      this.forceWorker = new Worker(
        new URL("./steps/forces-step/worker", import_meta.url),
        {
          type: "module",
          name: "force-worker"
        }
      );
      this.forceWorker.addEventListener("message", ({ data: { type, data } }) => {
        if (type === "mediaVersionLayerLoadRequests") {
          const { versionIndex, layers } = data;
          this.store.get("loader").requestMediaLayerLoad(versionIndex, layers);
        }
      });
      this.forceWorker.postMessage({
        type: "init",
        state: workerState
      });
      this.workers.push(this.forceWorker);
    }
    update() {
      this.updatingWorkersCount += this.workers.length;
      for (let i = 0; i < this.workers.length; i++) {
        this.workers[i].postMessage({ type: "update" });
      }
    }
    resize(dimensions, onResize) {
      this.resizingWorkersCount = this.workers.length;
      const config = this.store.getSimulationWorkerConfig();
      for (let i = 0; i < this.resizingWorkersCount; i++) {
        this.workers[i].postMessage({
          type: "resize",
          data: {
            config,
            dimensions
          }
        });
      }
      this.onResize = onResize;
    }
    handleDevToolsChange() {
      this.updateForceWorkerConfig();
    }
    handleWorkerEvent({ data: { type } }) {
      switch (type) {
        case "updated":
          this.onWorkerUpdated();
          break;
        case "resized":
          this.onWorkerResized();
          break;
      }
    }
    onWorkerUpdated() {
      this.updatingWorkersCount--;
      if (this.updatingWorkersCount === 0) this.onUpdated();
    }
    onWorkerResized() {
      this.resizingWorkersCount--;
      if (this.resizingWorkersCount === 0) this.onResize?.();
    }
    updateForceWorkerConfig() {
      this.updateWorkerConfig(this.forceWorker);
    }
    updateWorkerConfig(worker) {
      worker.postMessage({
        type: "setConfig",
        data: this.store.getSimulationWorkerConfig()
      });
    }
    handleForceStepConfigUpdated() {
      this.updateForceWorkerConfig();
    }
    handleForceStepConfigParametersUpdated() {
      this.forceWorker.postMessage({
        type: "updateParameters",
        data: this.globalConfig.simulation?.steps?.force?.parameters ?? {}
      });
    }
  };

  // scripts/vendor/voroforce/simulation/steps/common/base-simulation-step.js
  var BaseSimulationStep = class {
    constructor(store) {
      this.initGlobals(store);
      this.initProperties();
    }
    initGlobals(store) {
      this.store = store;
      this.updateConfig(this.store.get("config"));
    }
    updateConfig(config) {
      this.globalConfig = config;
      this.simulationConfig = config.simulation;
      this.config = {};
    }
    initProperties() {
      this.dimensions = this.store.get("dimensions");
      this.cells = this.store.get("cells");
      this.numCells = this.cells.length;
      this.pointer = this.store.get("sharedPointer");
      this.sharedData = this.store.get("sharedData");
      this.isWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
    }
    refresh() {
    }
    resize(dimensions) {
      this.refresh();
    }
    setConfig(config) {
      this.updateConfig(config);
      this.refresh();
    }
    setConfigAndResize(config) {
      this.updateConfig(config);
      this.refresh();
    }
    update() {
    }
    dispose() {
    }
    start() {
      this.running = true;
    }
    stop() {
      this.running = false;
    }
  };

  // scripts/vendor/voroforce/simulation/steps/forces-step/forces/index.js
  var forces_exports = {};
  __export(forces_exports, {
    omni: () => omniForce,
    origin: () => originForce
  });

  // scripts/vendor/voroforce/simulation/steps/forces-step/forces/origin-force.js
  var originForce = ({
    cells,
    config: { strength = 0.1, xFactor = 1, yFactor = 1 },
    handleEnd
  }) => {
    function force(alpha) {
      for (let i = 0, n = cells.length, cell; i < n; ++i) {
        cell = cells[i];
        cell.vx += (cell.ix - cell.x) * strength * alpha * xFactor;
        cell.vy += (cell.iy - cell.y) * strength * alpha * yFactor;
        handleEnd?.(cell);
      }
    }
    return force;
  };

  // scripts/vendor/voroforce/simulation/steps/forces-step/forces/utils/diaphragmatic-breathing.js
  function smoothInhaleEasing(t) {
    return Math.sin(t * Math.PI / 2);
  }
  function smoothExhaleEasing(t) {
    return Math.cos(t * Math.PI / 2);
  }
  function createSeededRandom(seed) {
    return function(n = 0) {
      const x = Math.sin(n + seed) * 1e4;
      return x - Math.floor(x);
    };
  }
  function diaphragmaticBreathing(_t, options = {}) {
    const {
      inhaleRatio = 0.45,
      // 45% of cycle spent inhaling
      exhaleRatio = 0.55,
      // 55% of cycle spent exhaling
      variationAmount = 0.5,
      // Amount of natural variation (0-1)
      seed = Date.now()
      // Seed for pseudorandom generators
    } = options;
    const t = Math.min(1, Math.max(0, _t));
    const rng1 = createSeededRandom(seed);
    const rng2 = createSeededRandom(seed + 1e3);
    const cycleNumber = Math.floor(t * 100);
    const breathDepthVariation = rng1(cycleNumber) * 2 - 1;
    const phaseVariation = rng2(cycleNumber) * 2 - 1;
    const variableInhaleRatio = inhaleRatio * (1 + phaseVariation * 0.1 * variationAmount);
    const variableExhaleRatio = exhaleRatio * (1 - phaseVariation * 0.1 * variationAmount);
    const total = variableInhaleRatio + variableExhaleRatio;
    const normalizedInhaleRatio = variableInhaleRatio / total;
    const normalizedExhaleRatio = variableExhaleRatio / total;
    const inhaleEnd = normalizedInhaleRatio;
    const addMicroFluctuations = (value, progress, magnitude) => {
      const fluctuation = Math.sin(progress * Math.PI * 2 * 3) * 0.3 + Math.sin(progress * Math.PI * 2 * 7) * 0.2 + Math.sin(progress * Math.PI * 2 * 11) * 0.1;
      return value + fluctuation * magnitude * variationAmount;
    };
    let breathValue;
    if (t < inhaleEnd) {
      const inhaleProgress = t / normalizedInhaleRatio;
      breathValue = smoothInhaleEasing(inhaleProgress);
      breathValue = addMicroFluctuations(breathValue, inhaleProgress, 0.03);
    } else {
      const exhaleProgress = (t - inhaleEnd) / normalizedExhaleRatio;
      breathValue = smoothExhaleEasing(exhaleProgress);
      breathValue = addMicroFluctuations(breathValue, exhaleProgress, 0.04);
    }
    const depthAdjustment = 0.92 + breathDepthVariation * 0.08 * variationAmount;
    if (breathValue > 0.5) {
      breathValue = 0.5 + (breathValue - 0.5) * depthAdjustment;
    }
    return Math.min(1, Math.max(0, breathValue));
  }

  // scripts/vendor/voroforce/simulation/steps/forces-step/forces/omni-force.js
  var LERP_FACTOR_DEFAULT = 0.025;
  var { abs, max: max2, min, sqrt: sqrt2, pow: pow2 } = Math;
  var squaredDist = (x1, y1, x2, y2) => pow2(x2 - x1, 2) + pow2(y2 - y1, 2);
  var getPushRadius = (dimensions) => {
    return dimensions.get("diagonal");
  };
  var omniForce = () => {
    let pointerX, pointerY, pointerSpeedScale = 0, complementPointerSpeedScale = 1, verySlowPointerMod = 0, nextVerySlowPointerMod = 0, lastVerySlowPointerMod = 0, slowPointerMod = 0, easedIdlePointerMod = 1, easedActivePointerMod = 0, pointerZoomScale = 1, prevCenterX, prevCenterY, centerX, centerY, targetCenterX, targetCenterY, latticeCenterX, latticeCenterY, latticeScale = 1, centerLerp = 1, primaryCell, primaryCellIndex, primaryCellCol, primaryCellRow, nextPrimaryCell, nextPrimaryCellIndex, prevPrimaryCell, slowIdlePrimaryCellMod = 1, easedSlowIdlePrimaryCellModComplement = 0, idlePrimaryCellMod = 1, primaryCellX, primaryCellY, prevPrimaryCellX, prevPrimaryCellY, secondaryCell, secondaryCellX, secondaryCellY, basePushDistMod = 1, commonPushDistMod = 1, commonPushXMod = 1, commonPushYMod = 1, commonOriginMod = 1, primaryCellPushFactor = 0, primaryCellPushFactorX = 0, primaryCellPushFactorY = 0, primaryDist, secondaryDist, centerDistRatio = 0, alignmentPushYModMod = 0, breathingStartTime, breathingTimestamp, breathingPushMod = 1, minLatticeRow, maxLatticeRow, minLatticeCol, maxLatticeCol, latticeRow, latticeCol, isPrimaryCell = false, primaryCellWeight = 0, primaryCellWeightPushFactor = 1, pushSpeedFactor = 1, cell, i, x, y, vx, vy, l;
    function init({
      cells,
      dimensions,
      pointer,
      sharedData,
      globalConfig,
      config: {
        cellsLen = cells.length,
        primarySelector = "focused",
        defaultLerpFactor = LERP_FACTOR_DEFAULT,
        manageWeights = false,
        primaryCellWeightPushFactorEnabled = false,
        smoothPrimaryCell = false,
        handlePointerSpeedScale = true,
        handlePointerZoomScale = true,
        breathing: {
          enabled: breathing = false,
          cycleDuration: breathingCycleDuration = 6e3,
          variability: breathingVariability = 0.1
        } = {},
        requestMediaVersions: {
          enabled: _requestMediaVersions = true,
          handleMediaSpeedLimits = handlePointerSpeedScale,
          requestMediaVersions = globalConfig.media?.enabled && _requestMediaVersions,
          versionCount: mediaVersionCount = globalConfig.media?.versions?.length ?? 0,
          v3ColLevelAdjacencyThreshold: mediaV3ColLevelAdjacencyThreshold = 0,
          v3RowLevelAdjacencyThreshold: mediaV3RowLevelAdjacencyThreshold = 0,
          v2ColLevelAdjacencyThreshold: mediaV2ColLevelAdjacencyThreshold = 6,
          v2RowLevelAdjacencyThreshold: mediaV2RowLevelAdjacencyThreshold = 3,
          v1ColLevelAdjacencyThreshold: mediaV1ColLevelAdjacencyThreshold = mediaV2ColLevelAdjacencyThreshold * 4,
          v1RowLevelAdjacencyThreshold: mediaV1RowLevelAdjacencyThreshold = mediaV2RowLevelAdjacencyThreshold * 4,
          v1SpeedLimit: mediaV1SpeedLimit = 0.5,
          v2SpeedLimit: mediaV2SpeedLimit = 0.25,
          v3SpeedLimit: mediaV3SpeedLimit = 0.25,
          versions: mediaVersions = [
            ...mediaVersionCount > 3 && mediaV3ColLevelAdjacencyThreshold > 0 && mediaV3RowLevelAdjacencyThreshold > 0 ? [
              {
                index: 3,
                adjacencyThreshold: {
                  col: mediaV3ColLevelAdjacencyThreshold,
                  row: mediaV3RowLevelAdjacencyThreshold
                },
                speedLimit: mediaV3SpeedLimit
              }
            ] : [],
            {
              index: 2,
              adjacencyThreshold: {
                col: mediaV2ColLevelAdjacencyThreshold,
                row: mediaV2RowLevelAdjacencyThreshold
              },
              speedLimit: mediaV2SpeedLimit
            },
            {
              index: 1,
              adjacencyThreshold: {
                col: mediaV1ColLevelAdjacencyThreshold,
                row: mediaV1RowLevelAdjacencyThreshold
              },
              speedLimit: mediaV1SpeedLimit
            }
          ],
          validVersions: validMediaVersions = mediaVersions.filter(
            (v) => v.adjacencyThreshold.col > 0 && v.adjacencyThreshold.row > 0
          ),
          version: mediaVersion = mediaVersions[0],
          maxTargetVersion: maxTargetMediaVersion = mediaVersionCount - 1,
          highestSpeedLimit: mediaHighestSpeedLimit = validMediaVersions[validMediaVersions.length - 1].speedLimit,
          vMaxSpeedLimit: mediaVMaxSpeedLimit = maxTargetMediaVersion === 3 ? mediaV3SpeedLimit : mediaV2SpeedLimit,
          // dynamic but less performant fn
          // handleDynamicCellMediaVersions = (
          //   cell,
          //   speedScale,
          //   colLevelAdjacency,
          //   rowLevelAdjacency,
          // ) => {
          //   if (speedScale > mediaHighestSpeedLimit) return
          //   for (let i = 0; i < validMediaVersions.length; ++i) {
          //     mediaVersion = validMediaVersions[i]
          //
          //     if (
          //       speedScale < mediaVersion.speedLimit &&
          //       colLevelAdjacency <= mediaVersion.adjacencyThreshold.col &&
          //       rowLevelAdjacency <= mediaVersion.adjacencyThreshold.row
          //     ) {
          //       cell.targetMediaVersion = max(
          //         cell.targetMediaVersion,
          //         mediaVersion.index,
          //       )
          //       return
          //     }
          //   }
          //
          //   cell.targetMediaVersion = min(cell.targetMediaVersion, 1) // reduce res if out of range (free mipmapping)
          // },
          // hardcoded but more performant fn
          handleCellMediaVersions = (cell2, speedScale, colLevelAdjacency, rowLevelAdjacency) => {
            if (handleMediaSpeedLimits && speedScale > mediaHighestSpeedLimit)
              return;
            if (maxTargetMediaVersion >= 3 && (!handleMediaSpeedLimits || speedScale < mediaV3SpeedLimit) && colLevelAdjacency <= mediaV3ColLevelAdjacencyThreshold && rowLevelAdjacency <= mediaV3RowLevelAdjacencyThreshold) {
              cell2.targetMediaVersion = 3;
            } else if ((!handleMediaSpeedLimits || speedScale < mediaV2SpeedLimit) && colLevelAdjacency <= mediaV2ColLevelAdjacencyThreshold && rowLevelAdjacency <= mediaV2RowLevelAdjacencyThreshold) {
              cell2.targetMediaVersion = max2(cell2.targetMediaVersion, 2);
            } else if ((!handleMediaSpeedLimits || speedScale < mediaV1SpeedLimit) && colLevelAdjacency <= mediaV1ColLevelAdjacencyThreshold && rowLevelAdjacency <= mediaV1RowLevelAdjacencyThreshold) {
              cell2.targetMediaVersion = max2(cell2.targetMediaVersion, 1);
            } else {
              cell2.targetMediaVersion = min(cell2.targetMediaVersion, 1);
            }
          }
        } = {},
        push: {
          strength: _pushStrength = 1,
          // pushStrength = _pushStrength,
          pushStrength = _pushStrength * 0.5,
          radius: pushRadius = getPushRadius(dimensions),
          pushRadiusSquared = pushRadius * pushRadius,
          radiusLimit: pushRadiusLimit = true,
          xFactor: configPushXMod = 1,
          yFactor: configPushYMod = 1,
          speedFactor: configPushSpeedFactor = 0,
          alignmentMaxLevelsX: pushAlignmentMaxLevelsX = 0,
          alignmentMaxLevelsY: pushAlignmentMaxLevelsY = 0,
          centerXStretchMod: pushCenterXStretchMod = 0,
          // centerXStretchMaxLevelsX: pushCenterXStretchMaxLevelsX = globalConfig
          //   .lattice.cols * 0.4,
          // centerXStretchMaxLevelsY: pushCenterXStretchMaxLevelsY = 12,
          centerXStretchMaxLevelsX: pushCenterXStretchMaxLevelsX = globalConfig.lattice.cols,
          centerXStretchMaxLevelsY: pushCenterXStretchMaxLevelsY = globalConfig.lattice.rows
        } = {},
        lattice: {
          strength: _latticeStrength = 0.8,
          latticeStrength = _latticeStrength * 0.5,
          xFactor: latticeXFactor = 1,
          yFactor: latticeYFactor = 1,
          maxLevelsFromPrimary: latticeMaxLevelsFromPrimary = 30,
          cellWidth: latticeCellWidth = globalConfig.lattice.cellWidth,
          cellHeight: latticeCellHeight = globalConfig.lattice.cellHeight,
          cellSizeMod: latticeCellSizeMod = 1,
          cellWidthMod: latticeCellWidthMod = latticeCellSizeMod,
          cellHeightMod: latticeCellHeightMod = latticeCellSizeMod,
          latticeCellSizeX = latticeCellWidth * latticeCellSizeMod,
          latticeCellSizeY = latticeCellHeight * latticeCellSizeMod,
          cols: latticeCols = globalConfig.lattice.cols,
          rows: latticeRows = globalConfig.lattice.rows
        } = {},
        origin: {
          strength: originStrength = 0.8,
          xFactor: originXFactor = 1,
          yFactor: originYFactor = 1,
          latticeScale: originLatticeScale = 1,
          originX: originLatticeX = globalConfig.lattice.latticeWidth / 2,
          originY: originLatticeY = globalConfig.lattice.latticeHeight / 2
        } = {}
      } = {},
      handleEnd = () => {
      }
    }) {
      const selectPrimary = (cells2) => cells2[primarySelector];
      pointerX = void 0;
      pointerY = void 0;
      centerX = void 0;
      centerY = void 0;
      targetCenterX = void 0;
      targetCenterY = void 0;
      primaryCell = void 0;
      primaryCellIndex = void 0;
      latticeScale = originLatticeScale;
      if (typeof latticeCenterX === "undefined") {
        latticeCenterX = originLatticeX;
        latticeCenterY = originLatticeY;
      }
      function initLocalCellProperties(cell2) {
        cell2.localWeight = cell2.weight;
        cell2.localCol = cell2.col;
        cell2.localRow = cell2.row;
        cell2.localX = cell2.x;
        cell2.localY = cell2.y;
        cell2.localIx = cell2.ix;
        cell2.localIy = cell2.iy;
      }
      function resetPrimaryCellDependentTransientCellProperties(cell2) {
        cell2.primaryCellIndex = void 0;
        cell2.colLevelAdjacency = void 0;
        cell2.rowLevelAdjacency = void 0;
        cell2.latticeStrengthMod = void 0;
        cell2.centerXStretchMod = void 0;
        cell2.alignmentPushYMod = void 0;
      }
      for (i = 0; i < cells.length; ++i) {
        cell = cells[i];
        initLocalCellProperties(cell);
        resetPrimaryCellDependentTransientCellProperties(cell);
      }
      function force(alpha) {
        handlePrimaryCellChange(alpha);
        forceSetup(alpha);
        latticeForcePass(alpha);
        mainForcePass(alpha);
        updateSharedData();
      }
      function updateSharedData() {
        sharedData.centerForceX = centerX;
        sharedData.centerForceY = centerY;
        sharedData.centerForceStrengthMod = basePushDistMod / 1.125;
      }
      function handlePrimaryCellChange(alpha) {
        nextPrimaryCell = selectPrimary(cells);
        nextPrimaryCellIndex = nextPrimaryCell?.index;
        if (nextPrimaryCellIndex !== primaryCellIndex) {
          prevPrimaryCell = primaryCell ?? nextPrimaryCell;
          prevPrimaryCellX = prevPrimaryCell.localX + prevPrimaryCell.vx;
          prevPrimaryCellY = prevPrimaryCell.localY + prevPrimaryCell.vy;
          primaryCell = nextPrimaryCell;
          primaryCellIndex = nextPrimaryCellIndex;
          if (!primaryCell) return;
          primaryCellCol = primaryCell.localCol;
          primaryCellRow = primaryCell.localRow;
          minLatticeRow = max2(primaryCellRow - latticeMaxLevelsFromPrimary, 1);
          maxLatticeRow = min(
            primaryCellRow + latticeMaxLevelsFromPrimary,
            latticeRows
          );
          minLatticeCol = max2(primaryCellCol - latticeMaxLevelsFromPrimary, 1);
          maxLatticeCol = min(
            primaryCellCol + latticeMaxLevelsFromPrimary,
            latticeCols
          );
          slowIdlePrimaryCellMod = 0;
          idlePrimaryCellMod = 0;
        }
      }
      function updatePrimaryCellDependentTransientCellProperties(cell2) {
        cell2.primaryCellIndex = primaryCellIndex;
        cell2.colLevelAdjacency = abs(cell2.localCol - primaryCellCol);
        cell2.rowLevelAdjacency = abs(cell2.localRow - primaryCellRow);
        cell2.latticeStrengthMod = latticeStrength * (1 - (1 - breathingPushMod) * 5) * ((latticeMaxLevelsFromPrimary - max2(cell2.colLevelAdjacency, cell2.rowLevelAdjacency)) / latticeMaxLevelsFromPrimary);
        if (
          // !isPrimaryCell &&
          pushCenterXStretchMod > 0 && cell2.rowLevelAdjacency < pushCenterXStretchMaxLevelsY && cell2.colLevelAdjacency > 0 && cell2.colLevelAdjacency < pushCenterXStretchMaxLevelsX
        ) {
          cell2.centerXStretchMod = pushCenterXStretchMod * (cell2.colLevelAdjacency / pushCenterXStretchMaxLevelsX * (1 - cell2.rowLevelAdjacency / pushCenterXStretchMaxLevelsY));
        } else {
          cell2.centerXStretchMod = void 0;
        }
        if (pushAlignmentMaxLevelsX > 0 && secondaryCell && prevPrimaryCell && cell2.rowLevelAdjacency === 0 && cell2.colLevelAdjacency < pushAlignmentMaxLevelsX) {
          cell2.alignmentPushYMod = (pushAlignmentMaxLevelsX - max2(cell2.colLevelAdjacency, 1)) / pushAlignmentMaxLevelsX;
        } else {
          cell2.alignmentPushYMod = void 0;
        }
      }
      function forceSetup(alpha) {
        if (!primaryCell) return;
        if (handlePointerSpeedScale) {
          pointerSpeedScale = minLerp(
            pointerSpeedScale,
            pointer.speedScale,
            defaultLerpFactor * 4
          );
          complementPointerSpeedScale = 1 - pointerSpeedScale;
        }
        if (handlePointerZoomScale) {
          pointerZoomScale = minLerp(
            pointerZoomScale,
            pointer.zoom ?? 1,
            defaultLerpFactor * 4
          );
          latticeScale = originLatticeScale * pointerZoomScale;
        }
        if (requestMediaVersions) {
          if (pointerSpeedScale < mediaVMaxSpeedLimit) {
            primaryCell.targetMediaVersion = max2(
              primaryCell.targetMediaVersion,
              maxTargetMediaVersion
            );
          }
        }
        slowIdlePrimaryCellMod = minLerp(
          slowIdlePrimaryCellMod,
          1,
          max2(defaultLerpFactor, slowIdlePrimaryCellMod) * 0.05 * complementPointerSpeedScale
        );
        easedSlowIdlePrimaryCellModComplement = minLerp(
          easedSlowIdlePrimaryCellModComplement,
          1 - slowIdlePrimaryCellMod,
          defaultLerpFactor
        );
        idlePrimaryCellMod = minLerp(idlePrimaryCellMod, 1, defaultLerpFactor * 4);
        primaryCellX = primaryCell.localX + primaryCell.vx;
        primaryCellY = primaryCell.localY + primaryCell.vy;
        if (smoothPrimaryCell && idlePrimaryCellMod < 1) {
          primaryCellX = lerp(prevPrimaryCellX, primaryCellX, idlePrimaryCellMod);
          primaryCellY = lerp(prevPrimaryCellY, primaryCellY, idlePrimaryCellMod);
        }
        centerX ?? (centerX = primaryCellX);
        centerY ?? (centerY = primaryCellY);
        pointerX = pointer?.x ?? primaryCellX;
        pointerY = pointer?.y ?? primaryCellX;
        if (handlePointerSpeedScale) {
          easedIdlePointerMod = minLerp(
            easedIdlePointerMod,
            pointerSpeedScale > 0 ? 0 : 1,
            defaultLerpFactor * (pointerSpeedScale > 0 ? 1 : 0.25)
          );
          easedActivePointerMod = 1 - easedIdlePointerMod;
          nextVerySlowPointerMod = pointerSpeedScale <= 5e-3 ? pointerSpeedScale / 5e-3 : 1;
          lastVerySlowPointerMod = verySlowPointerMod;
          verySlowPointerMod = minLerp(
            verySlowPointerMod,
            nextVerySlowPointerMod,
            nextVerySlowPointerMod > verySlowPointerMod ? defaultLerpFactor * 2 : defaultLerpFactor
          );
          slowPointerMod = minLerp(
            slowPointerMod,
            pointerSpeedScale <= 0.05 ? pointerSpeedScale / 0.05 : 1,
            defaultLerpFactor
          );
          centerLerp = easedMinLerp(
            defaultLerpFactor * 0.1,
            1,
            verySlowPointerMod,
            MIN_LERP_EASING_TYPES.easeInExpo,
            1e-3
          );
        }
        targetCenterX = lerp(
          primaryCellX,
          pointerX,
          verySlowPointerMod * easedActivePointerMod
        );
        targetCenterY = lerp(
          primaryCellY,
          pointerY,
          verySlowPointerMod * easedActivePointerMod
        );
        prevCenterX = centerX;
        prevCenterY = centerY;
        const targetCenterDistScale = squaredDist(centerX, centerY, targetCenterX, targetCenterY) / (pushRadiusSquared * 25e-5);
        if (targetCenterDistScale > 1) {
          centerLerp = min(centerLerp * targetCenterDistScale, 1);
        }
        centerX = minLerp(centerX, targetCenterX, centerLerp);
        centerY = minLerp(centerY, targetCenterY, centerLerp);
        latticeCenterX = centerX;
        latticeCenterY = centerY;
        secondaryCell = primaryCellIndex === pointer.indices?.[0] ? cells[pointer.indices[1]] : void 0;
        if (secondaryCell) {
          secondaryCellX = secondaryCell.localX + secondaryCell.vx;
          secondaryCellY = secondaryCell.localY + secondaryCell.vy;
          primaryDist = squaredDist(centerX, centerY, primaryCellX, primaryCellY);
          secondaryDist = squaredDist(
            centerX,
            centerY,
            secondaryCellX,
            secondaryCellY
          );
          centerDistRatio = secondaryDist === 0 ? 0 : primaryDist / secondaryDist;
        }
        primaryCellPushFactorX = primaryCellPushFactorY = primaryCellPushFactor = // min(centerDistRatio, 1) * (1 - slowIdlePrimaryCellMod)
        min(centerDistRatio, 1) * easedSlowIdlePrimaryCellModComplement;
        if (breathing) {
          breathingTimestamp = performance.now();
          if (!breathingStartTime) breathingStartTime = breathingTimestamp;
          breathingPushMod = 1 - breathingVariability + diaphragmaticBreathing(
            (breathingTimestamp - breathingStartTime) % breathingCycleDuration / breathingCycleDuration
          ) * breathingVariability * complementPointerSpeedScale;
        }
        if (configPushSpeedFactor > 0) {
          pushSpeedFactor = minLerp(
            pushSpeedFactor,
            lerp(
              max2(complementPointerSpeedScale, 0.2),
              1,
              slowIdlePrimaryCellMod
            ),
            defaultLerpFactor
          );
        }
        if (manageWeights) {
          primaryCellWeight = clamp(0, 1, (1 - centerDistRatio) ** 2) * // breathingPushMod ** 2 *
          breathingPushMod * // (1 - breathingPushMod) *
          complementPointerSpeedScale * pushSpeedFactor;
          primaryCellWeight = primaryCell.weight = primaryCell.localWeight = minLerp(
            primaryCell.localWeight,
            primaryCellWeight,
            primaryCellWeight > primaryCell.localWeight ? defaultLerpFactor * sqrt2(complementPointerSpeedScale) : defaultLerpFactor * 3
          );
          if (primaryCellWeightPushFactorEnabled) {
            primaryCellWeightPushFactor = minLerp(
              primaryCellWeightPushFactor,
              1 + clamp(0, 0.125, mapRange(0.25, 1, 0, 0.25, primaryCellWeight)),
              defaultLerpFactor
            );
          }
        }
        if (primaryCellRow === secondaryCell?.localRow && primaryCellRow === prevPrimaryCell?.localRow) {
          alignmentPushYModMod = lerp(alignmentPushYModMod, 1, defaultLerpFactor);
        } else {
          alignmentPushYModMod = 0;
        }
        commonOriginMod = originStrength * alpha * (1 - (1 - breathingPushMod) * 3);
        basePushDistMod = breathingPushMod * pushSpeedFactor * primaryCellWeightPushFactor * pointerZoomScale;
        commonPushDistMod = basePushDistMod * pushStrength * alpha;
        commonPushXMod = configPushXMod * breathingPushMod;
        commonPushYMod = configPushYMod * (1 - (1 - sqrt2(breathingPushMod)));
      }
      function mainForcePass(alpha) {
        for (i = 0; i < cellsLen; ++i) {
          cell = cells[i];
          cell.vx += ((latticeScale === 1 ? cell.localIx : (cell.localIx - latticeCenterX) * latticeScale + latticeCenterX) - cell.localX) * originXFactor * commonOriginMod;
          cell.vy += ((latticeScale === 1 ? cell.localIy : (cell.localIy - latticeCenterY) * latticeScale + latticeCenterY) - cell.localY) * originYFactor * commonOriginMod;
          isPrimaryCell = i === primaryCellIndex;
          if (primaryCell) {
            x = cell.localX + cell.vx - centerX;
            y = cell.localY + cell.vy - centerY;
            l = x * x + y * y;
            if (0 < l && l < pushRadiusSquared) {
              l = sqrt2(l);
              l = (pushRadius - l) / l;
              l *= commonPushDistMod;
              x *= l;
              y *= l;
              if (cell.primaryCellIndex !== primaryCellIndex) {
                updatePrimaryCellDependentTransientCellProperties(cell);
              }
              if (requestMediaVersions) {
                if (!isPrimaryCell) {
                  handleCellMediaVersions(
                    cell,
                    pointerSpeedScale,
                    cell.colLevelAdjacency,
                    cell.rowLevelAdjacency
                  );
                }
              }
              vx = x * commonPushXMod;
              vy = y * commonPushYMod;
              if (cell.centerXStretchMod) {
                vx *= 1 + cell.centerXStretchMod * abs(x);
              }
              if (cell.alignmentPushYMod) {
                vy *= 1 - cell.alignmentPushYMod * alignmentPushYModMod;
              }
              if (isPrimaryCell) {
                vx *= primaryCellPushFactorX;
                vy *= primaryCellPushFactorY;
              }
              cell.vx += vx;
              cell.vy += vy;
            }
          }
          if (cell.localWeight !== 0 && !isPrimaryCell) {
            cell.weight = cell.localWeight = minLerp(
              cell.localWeight,
              0,
              defaultLerpFactor * 4
            );
          }
          handleEnd(cell);
        }
      }
      function latticeForcePass(alpha) {
        if (!primaryCell) return;
        for (latticeCol = minLatticeCol; latticeCol < maxLatticeCol; latticeCol++) {
          for (latticeRow = minLatticeRow; latticeRow < maxLatticeRow; latticeRow++) {
            i = latticeRow * latticeCols + latticeCol;
            if (i < cellsLen) {
              cell = cells[i];
              if (cell.primaryCellIndex !== primaryCellIndex) {
                updatePrimaryCellDependentTransientCellProperties(cell);
              }
              latticeLinkForce(cell, cells[i - 1], alpha, latticeCellSizeX);
              latticeLinkForce(
                cell,
                cells[i - latticeCols],
                alpha,
                latticeCellSizeY
              );
            }
          }
        }
      }
      function latticeLinkForce(cell2, target, alpha, size) {
        x = target.localX + target.initialVx - cell2.localX - cell2.initialVx;
        y = target.localY + target.initialVy - cell2.localY - cell2.initialVy;
        l = sqrt2(x * x + y * y);
        l = (l - size) / l * alpha * cell2.latticeStrengthMod;
        x *= l * latticeXFactor;
        y *= l * latticeYFactor;
        target.vx -= x;
        target.vy -= y;
        cell2.vx += x;
        cell2.vy += y;
      }
      return force;
    }
    return {
      init
    };
  };

  // scripts/vendor/voroforce/simulation/steps/forces-step/index.js
  var ForcesSimulationStep = class extends BaseSimulationStep {
    constructor(store, options) {
      super(store, options);
      __publicField(this, "forces", []);
      this.initMediaProperties();
      this.handleLattice();
      this.initializeCells();
      this.handleForcesConfig();
      this.start();
    }
    updateConfig(config) {
      super.updateConfig(config);
      this.config = config.simulation.steps.force ?? {};
      this.updateParameters(this.config.parameters);
    }
    updateParameters(parameters, config = { forceTransition: false }) {
      if (!parameters) return;
      if (this.parameters && (config?.forceTransition || parameters.transition)) {
        this.targetParameters = {
          alpha: parameters.alpha,
          velocityDecay: parameters.velocityDecay
        };
      } else {
        this.parameters = parameters;
      }
    }
    initMediaProperties() {
      this.mediaConfig = this.globalConfig.media;
      if (!this.mediaConfig.enabled) return;
      this.sharedLoadedMediaVersionLayersData = this.store.get(
        "sharedLoadedMediaVersionLayersData"
      );
      this.mediaVersionLayerLoadRequests = this.mediaConfig.versions.map(
        () => /* @__PURE__ */ new Set([])
      );
    }
    handleForcesConfig() {
      const forcesConfig = this.config.forces;
      this.isReusableSingleForceConfig = !Array.isArray(forcesConfig);
      if (this.isReusableSingleForceConfig) {
        if ("enabled" in forcesConfig && !forcesConfig.enabled) return;
        const props = {
          cells: this.cells,
          links: this.links,
          dimensions: this.dimensions,
          pointer: this.pointer,
          sharedData: this.sharedData,
          config: forcesConfig,
          simulationStepConfig: this.config,
          simulationConfig: this.simulationConfig,
          globalConfig: this.globalConfig,
          handleEnd: this.handleEnd.bind(this)
        };
        if (!this.reusableSingleForceBlueprint || !this.reusableSingleForceBlueprint.init) {
          this.reusableSingleForceBlueprint = forces_exports[forcesConfig.type ?? "omni"]?.(props);
        }
        let force = this.reusableSingleForceBlueprint;
        if (force.init) force = force.init(props);
        this.forces = [force];
      } else {
        this.reusableSingleForceBlueprint = void 0;
        this.forces = [];
        forcesConfig.forEach((forceConfig, index) => {
          if ("enabled" in forceConfig && !forceConfig.enabled) return;
          const props = {
            cells: this.cells,
            links: this.links,
            dimensions: this.dimensions,
            pointer: this.pointer,
            sharedData: this.sharedData,
            config: forceConfig,
            simulationStepConfig: this.config,
            simulationConfig: this.simulationConfig,
            globalConfig: this.globalConfig,
            handleEnd: index === forcesConfig.length - 1 ? this.handleEnd.bind(this) : void 0
          };
          let force = forces_exports[forceConfig.type ?? "omni"]?.(props);
          if (!force) return;
          if (force.init) force = force.init(props);
          this.forces.push(force);
        });
      }
    }
    refresh() {
      this.handleLattice();
      this.handleForcesConfig();
    }
    setConfig(config) {
      super.setConfig(config);
    }
    tick() {
      if (this.mediaConfig.enabled) {
        this.mediaVersionLayerLoadRequests.forEach((set6) => set6.clear());
      }
      if (this.targetParameters) {
        this.parameters.alpha = minLerp(
          this.parameters.alpha,
          this.targetParameters.alpha,
          0.025
        );
        this.parameters.velocityDecay = minLerp(
          this.parameters.velocityDecay,
          this.targetParameters.velocityDecay,
          0.025
        );
        if (this.parameters.alpha === this.targetParameters.alpha && this.parameters.velocityDecay === this.targetParameters.velocityDecay)
          this.targetParameters = null;
      }
      for (let i = 0; i < this.forces.length; i++) {
        this.forces[i](this.parameters.alpha);
      }
      this.handleMediaVersionLayerLoadRequests();
    }
    handleEnd(cell) {
      cell.localX = cell.x += cell.vx *= 1 - this.parameters.velocityDecay;
      cell.localY = cell.y += cell.vy *= 1 - this.parameters.velocityDecay;
      cell.initialVx = cell.vx;
      cell.initialVy = cell.vy;
      this.handleCellTargetMediaVersion(cell);
    }
    handleCellTargetMediaVersion(cell) {
      if (!this.mediaConfig.enabled) return;
      if (cell.targetMediaVersion !== cell.mediaVersion) {
        const mediaVersion = this.mediaConfig.versions[cell.targetMediaVersion];
        const layerIndex = Math.floor(
          cell.id / (mediaVersion.cols * mediaVersion.rows) % mediaVersion.layers
        );
        switch (this.sharedLoadedMediaVersionLayersData[cell.targetMediaVersion].data[layerIndex]) {
          case 0:
            this.mediaVersionLayerLoadRequests[cell.targetMediaVersion].add(
              layerIndex
            );
            break;
          case 2:
            cell.mediaVersion = cell.targetMediaVersion;
            break;
        }
      }
    }
    handleMediaVersionLayerLoadRequests() {
      if (!this.mediaConfig.enabled) return;
      this.mediaVersionLayerLoadRequests.forEach((set6, versionIndex) => {
        if (set6.size > 0) {
          const layers = Array.from(set6);
          if (this.isWorker) {
            postMessage({
              type: "mediaVersionLayerLoadRequests",
              data: {
                versionIndex,
                layers
              }
            });
          } else {
            this.store.get("loader").requestMediaLayerLoad(versionIndex, layers);
          }
        }
      });
    }
    initializeCells() {
      if (this.globalConfig.lattice.enabled) return;
      const INITIAL_RADIUS = 10;
      const INITIAL_ANGLE = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0, n = this.numCells, cell; i < n; ++i) {
        cell = this.cells[i];
        cell.index = i;
        if (cell.fx != null) cell.x = cell.fx;
        if (cell.fy != null) cell.y = cell.fy;
        if (!isNumber(cell.x) || !isNumber(cell.y)) {
          const radius = INITIAL_RADIUS * Math.sqrt(0.5 + i);
          const angle2 = i * INITIAL_ANGLE;
          cell.x = radius * Math.cos(angle2);
          cell.y = radius * Math.sin(angle2);
        }
        if (!isNumber(cell.vx) || !isNumber(cell.vy)) {
          cell.vx = cell.vy = 0;
        }
      }
    }
    update() {
      this.running && this.tick();
    }
    handleLattice() {
      this.links = [];
      const { rows, cols, enabled } = this.globalConfig.lattice;
      if (!enabled) return;
      let index = 0;
      let cell;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          cell = this.cells[index];
          if (!cell) break;
          if (row > 0)
            this.links.push({
              source: cell,
              target: this.cells[index - cols],
              type: "y"
            });
          if (col > 0)
            this.links.push({
              source: cell,
              target: this.cells[index - 1],
              type: "x"
            });
          index++;
        }
      }
    }
  };

  // scripts/vendor/voroforce/simulation/steps/neighbors-step/index.js
  var NeighborsSimulationStep = class extends BaseSimulationStep {
    constructor(store, options) {
      super(store, options);
      __publicField(this, "neighborsNeedUpdate", true);
      this.refresh();
      this.start();
    }
    updateConfig(config) {
      super.updateConfig(config);
      this.config = config.simulation.steps.neighbors ?? {};
    }
    initProperties() {
      super.initProperties();
      this.cellNeighbors = this.store.get("sharedCellNeighbors");
    }
    refresh() {
      super.refresh();
      this.neighborLevels = this.config.levels ?? 1;
      this.neighborsNeedUpdate = true;
    }
    update() {
      if (this.neighborsNeedUpdate) {
        this.updateNeighbors();
        this.neighborsNeedUpdate = false;
      }
      super.update();
    }
    updateNeighbors() {
      function getGridNeighbors(index, columns, rows2, level = 1) {
        if (index < 0 || index >= columns * rows2) {
          throw new Error("Invalid index");
        }
        const neighbors2 = [];
        const currentRow = Math.floor(index / columns);
        const currentCol = index % columns;
        for (let l = 1; l <= level; l++) {
          const currentLevelNeighbors = [];
          for (let row = -l; row <= l; row++) {
            for (let col = -l; col <= l; col++) {
              if (row === 0 && col === 0) continue;
              if (Math.max(Math.abs(row), Math.abs(col)) !== l) continue;
              const newRow = currentRow + row;
              const newCol = currentCol + col;
              if (newRow >= 0 && newRow < rows2 && newCol >= 0 && newCol < columns) {
                const neighborIndex = newRow * columns + newCol;
                currentLevelNeighbors.push(neighborIndex);
              }
            }
          }
          neighbors2.push(...currentLevelNeighbors.sort((a, b) => a - b));
        }
        return neighbors2;
      }
      let cell;
      let currentDataIndex;
      let neighbors;
      const { rows, cols, numCells } = this.globalConfig.lattice;
      currentDataIndex = numCells * 2;
      for (let i = 0; i < numCells; i++) {
        cell = this.cells[i];
        neighbors = getGridNeighbors(i, cols, rows, this.neighborLevels);
        this.cellNeighbors[i * 2] = currentDataIndex;
        this.cellNeighbors.set(neighbors, currentDataIndex);
        this.cellNeighbors[i * 2 + 1] = neighbors.length;
        currentDataIndex += neighbors.length;
      }
    }
  };

  // scripts/vendor/voroforce/simulation/simulation.js
  var Simulation = class extends BaseSimulation {
    constructor(store, options) {
      super(store, options);
      this.forceStep = new ForcesSimulationStep(this.store);
      this.neighborsStep = new NeighborsSimulationStep(this.store);
    }
    update() {
      this.forceStep.update();
      this.neighborsStep.update();
      this.onUpdated();
    }
    handleDevToolsChange() {
      this.forceStep.handleForcesConfig();
    }
    resize(dimensions, onResize) {
      this.forceStep.resize(dimensions);
      this.neighborsStep?.resize(dimensions);
      onResize?.();
    }
    handleForceStepConfigUpdated() {
      this.forceStep.setConfig(this.globalConfig);
    }
    handleForceStepConfigParametersUpdated() {
      this.forceStep.updateParameters(
        this.globalConfig.simulation?.steps?.force?.parameters ?? {},
        { forceTransition: true }
      );
    }
  };

  // scripts/vendor/voroforce/default-config.js
  var defaultConfig = {
    cells: 100,
    simulation: defaultSimulationConfig,
    display: defaultDisplayConfig,
    controls: defaultControlsConfig,
    devTools: {
      enabled: false,
      expanded: false,
      expandedFolders: {
        simulation: false,
        display: false
      }
    },
    multiThreading: {
      enabled: false,
      renderInParallel: false
    },
    media: {
      enabled: false,
      baseUrl: "/media",
      preload: "v0",
      // 'v0', 'first' or false
      compressionFormat: "dds",
      versions: []
    },
    lattice: {
      enabled: true,
      aspect: void 0,
      latticeAspect: void 0,
      latticeAspectConstraints: "min",
      // 'min' or 'max'
      autoTargetMediaVersion2SubgridCount: void 0,
      autoTargetMediaVersion1SubgridCount: void 0,
      targetCellSizeViewportPercentage: void 0
    },
    handleVisibilityChange: {
      enabled: false,
      hiddenDelay: 0
    },
    ticker: {
      mode: "manual"
      // 'auto' or 'manual'
    },
    benchmark: {
      enabled: false,
      simulation: {
        enabled: false,
        iterations: 1e4
      },
      display: {
        enabled: false,
        iterations: 1e3
      }
    }
  };

  // scripts/vendor/voroforce/utils/visibility.js
  var browserPrefixes = ["moz", "ms", "o", "webkit"];
  var isVisible = true;
  function getHiddenPropertyName(prefix) {
    return prefix ? `${prefix}Hidden` : "hidden";
  }
  function getVisibilityEvent(prefix) {
    return `${prefix ? prefix : ""}visibilitychange`;
  }
  function getBrowserPrefix() {
    for (let i = 0; i < browserPrefixes.length; i++) {
      if (getHiddenPropertyName(browserPrefixes[i]) in document) {
        return browserPrefixes[i];
      }
    }
    return null;
  }
  var browserPrefix = getBrowserPrefix();
  var hiddenPropertyName = getHiddenPropertyName(browserPrefix);
  var visibilityEventName = getVisibilityEvent(browserPrefix);
  function onVisible(handleOnVisible) {
    if (isVisible) {
      return;
    }
    isVisible = true;
    handleOnVisible();
  }
  function onHidden(handleOnHidden) {
    if (!isVisible) {
      return;
    }
    isVisible = false;
    handleOnHidden();
  }
  function handleVisibilityChange(forcedFlag, handleOnVisible, handleOnHidden) {
    if (typeof forcedFlag === "boolean") {
      if (forcedFlag) {
        return onVisible(handleOnVisible);
      }
      return onHidden(handleOnHidden);
    }
    if (document[hiddenPropertyName]) {
      return onHidden(handleOnHidden);
    }
    return onVisible(handleOnVisible);
  }
  var initVisibilityEventHandlers = (handleOnVisible = () => {
  }, handleOnHidden = () => {
  }) => {
    document.addEventListener(
      visibilityEventName,
      (flag) => {
        handleVisibilityChange(flag, handleOnVisible, handleOnHidden);
      },
      false
    );
    document.addEventListener(
      "focus",
      () => {
        handleVisibilityChange(true, handleOnVisible, handleOnHidden);
      },
      false
    );
    document.addEventListener(
      "blur",
      () => {
        handleVisibilityChange(false, handleOnVisible, handleOnHidden);
      },
      false
    );
    window.addEventListener(
      "focus",
      () => {
        handleVisibilityChange(true, handleOnVisible, handleOnHidden);
      },
      false
    );
    window.addEventListener(
      "blur",
      () => {
        handleVisibilityChange(false, handleOnVisible, handleOnHidden);
      },
      false
    );
  };

  // scripts/vendor/voroforce/voroforce.js
  var VisibilityChangeEvent = class extends Event {
    constructor(visible) {
      super("visibilityChange");
      this.visible = visible;
    }
  };
  var Voroforce = class extends CustomEventTarget {
    constructor(container, config = {}) {
      super();
      __publicField(this, "mediaEnabled", false);
      __publicField(this, "multiThreading", false);
      __publicField(this, "parallelDisplay", false);
      __publicField(this, "simulationWarmedUp", false);
      __publicField(this, "displayWarmedUp", false);
      __publicField(this, "updates", 0);
      this.config = mergeConfigs(defaultConfig, config);
      this.container = container;
      this.init();
    }
    init() {
      this.initDOM();
      this.handleConfig();
      this.initData();
      this.initHelpers();
      this.handleLattice();
      this.initStore();
      this.initComponents();
      this.initEventListeners();
    }
    handleConfig() {
      this.handleMultiThreadingConfig();
      this.handleMediaConfig();
      this.handleTickerConfig();
      this.handleBenchmarkConfig();
    }
    handleMultiThreadingConfig() {
      this.multiThreading = this.config.multiThreading?.enabled && typeof SharedArrayBuffer !== "undefined";
      this.parallelDisplay = this.multiThreading && this.config.multiThreading?.renderInParallel;
    }
    handleMediaConfig() {
      this.mediaEnabled = this.config.media?.enabled;
      if (this.mediaEnabled) {
        this.config.media.versions?.forEach((v) => {
          v.layers = Math.min(
            v.layers,
            Math.ceil(this.config.cells / (v.cols * v.rows))
          );
        });
      }
    }
    handleTickerConfig() {
      this.tickerMode = this.config.ticker?.mode;
    }
    handleBenchmarkConfig() {
      this.benchmarkEnabled = this.config.benchmark?.enabled;
      if (this.benchmarkEnabled) {
        const originalUpdate = this.update.bind(this);
        this.update = function update() {
          originalUpdate();
          this.benchmark();
        }.bind(this);
        if (this.config.benchmark?.simulation?.enabled) {
          this.multiThreading = false;
          this.parallelDisplay = false;
        }
      }
    }
    initComponents() {
      this.simulation = new (this.multiThreading ? MultiThreadedSimulation : Simulation)(this.store, {
        onUpdated: this.onSimulationUpdated.bind(this)
      });
      this.display = new Display(this.store);
      this.controls = new Controls(this.store, this.display);
    }
    initHelpers() {
      void this.initDevTools();
      this.dimensions = new Dimensions(this.container);
      this.ticker = new (this.tickerMode === "auto" ? AutoTicker : ManualTicker)(
        this.devTools?.fpsGraph
      );
      this.loader = new Loader(
        this.sharedLoadedMediaVersionLayersData,
        this.config
      );
    }
    initData() {
      this.sharedData = initSharedData(this.config);
      this.sharedCellData = initSharedCellData(
        this.config.cells ?? 512,
        this.config
      );
      this.cells = this.sharedCellData.cells;
      if (this.mediaEnabled) {
        this.sharedLoadedMediaVersionLayersData = initSharedLoadedMediaVersionLayersData(this.config);
      }
    }
    initDOM() {
      this.canvas = this.container.getElementsByTagName("canvas")[0];
      if (!this.canvas) {
        this.canvas = document.createElement("canvas");
        setStyles(this.canvas, {
          width: "100%",
          height: "100%",
          pointerEvents: "none"
        });
        this.container.appendChild(this.canvas);
      }
    }
    handleLattice() {
      handleLattice(
        this.config,
        this.cells,
        this.dimensions.width,
        this.dimensions.height
      );
    }
    initStore() {
      this.store = new Store({
        container: this.container,
        canvas: this.canvas,
        config: this.config,
        dimensions: this.dimensions,
        ticker: this.ticker,
        loader: this.loader,
        controls: this.controls,
        ...this.sharedData,
        ...this.sharedCellData,
        ...this.sharedLoadedMediaVersionLayersData
      });
      this.loader.store = this.store;
    }
    start() {
      this.simulationWarmedUp = false;
      this.displayWarmedUp = false;
      this.ticker.start();
      return this;
    }
    initEventListeners() {
      this.resize = this.resize.bind(this);
      this.update = this.update.bind(this);
      this.dimensions.addEventListener("resize", this.resize);
      this.ticker.addEventListener("tick", this.update);
      if (this.config.handleVisibilityChange?.enabled && !isTouchDevice) {
        initVisibilityEventHandlers(
          () => {
            this.visible = true;
            clearTimeout(this.tickerFreezeTimeout);
            this.ticker.start();
            this.dispatchEvent(
              new VisibilityChangeEvent({
                visible: true
              })
            );
          },
          () => {
            this.visible = false;
            this.dispatchEvent(
              new VisibilityChangeEvent({
                visible: false
              })
            );
            clearTimeout(this.tickerFreezeTimeout);
            this.tickerFreezeTimeout = setTimeout(() => {
              if (this.visible) return;
              this.ticker.stop();
            }, this.config.handleVisibilityChange.hiddenDelay);
          }
        );
      }
      let last = performance.now();
      setInterval(() => {
        const now = performance.now();
        const diff = now - last;
        last = now;
        if (this.config.handleVisibilityChange?.enabled && !this.visible) return;
        if (diff > 2e3) {
          if (this.ticker.running) {
            console.log("Throttling or sleep detected");
            this.ticker.stop();
          }
        } else {
          if (!this.ticker.running) {
            console.log("Resuming from sleep or throttling");
            this.ticker.start();
          }
        }
      }, 1e3);
    }
    async initDevTools(force = false) {
      if (this.devTools) return;
      this.config.devTools.enabled = this.config.devTools.enabled || window.location.hash === "#dev";
      if (force) {
        this.config.devTools.enabled = true;
        this.config.devTools.expanded = true;
      }
      if (!this.config.devTools.enabled) return;
      this.devTools = new (await Promise.resolve().then(() => (init_voroforce_devtools_stub(), voroforce_devtools_stub_exports))).default(
        this.config.devTools
      );
      this.ticker.fpsGraph = this.devTools.fpsGraph;
      this.store.set("devTools", this.devTools);
    }
    // multithreaded simulation step workers must complete before triggering resize
    deferredResize() {
      this.ticker.stop();
      this.controls.startResize();
      this.handleLattice();
      const dimensions = this.store.get("dimensions").get();
      this.simulation.resize(dimensions, () => {
        this.simulationWarmedUp = false;
        this.pendingResize = false;
        this.display.resize(dimensions);
        this.displayUpdates = 0;
        this.displayWarmedUp = false;
        this.controls.endResize(dimensions);
        this.start();
      });
    }
    resize() {
      this.pendingResize = true;
    }
    update() {
      this.updateControls();
      this.updateSimulation();
      if (this.parallelDisplay) this.updateDisplay();
    }
    updateSimulation() {
      this.simulation.update();
    }
    onSimulationUpdated() {
      this.simulationWarmedUp = true;
      if (!this.parallelDisplay) this.updateDisplay();
      if (this.pendingResize) {
        this.deferredResize();
        return;
      }
      if (this.tickerMode === "manual") this.ticker.next();
    }
    updateDisplay() {
      if (this.simulationWarmedUp) {
        this.display.update();
        this.displayWarmedUp = true;
      }
      if (this.tickerMode === "manual") this.ticker.next();
    }
    updateControls() {
      if (this.displayWarmedUp) this.controls.update();
    }
    benchmark() {
      this.updates++;
      if (!this.displayWarmedUp || this.updates < 10) {
        return;
      }
      this.ticker.kill();
      this.simulation.onUpdated = () => {
      };
      if (this.config.benchmark?.simulation?.enabled) {
        this.benchmarkSimulation();
      }
      if (this.config.benchmark?.display?.enabled) {
        this.benchmarkDisplay();
      }
    }
    benchmarkSimulation() {
      let sTotal = 0;
      for (let i = 0; i < (this.config.benchmark?.simulation?.iterations || 100); i++) {
        const s = Date.now();
        this.simulation.update();
        sTotal += Date.now() - s;
      }
      console.log("Simulation total: ", sTotal);
    }
    benchmarkDisplay() {
      let sTotal = 0;
      for (let i = 0; i < (this.config.benchmark?.display?.iterations || 100); i++) {
        const s = Date.now();
        this.display.update();
        sTotal += Date.now() - s;
      }
      console.log("Display total: ", sTotal);
    }
    removeEventListeners() {
      this.ticker.removeEventListener("tick", this.update);
      this.dimensions.removeEventListener("resize", this.resize);
    }
    disposeDevTools() {
      this.config.devTools.enabled = false;
      this.ticker.fpsGraph = void 0;
      this.devTools?.dispose();
      this.devTools = void 0;
      this.store.set("devTools", void 0);
    }
    // TODO
    dispose() {
      this.removeEventListeners();
      this.disposeDevTools();
      this.simulation.dispose();
      this.display.dispose();
      this.controls.dispose();
      this.dimensions.dispose();
      this.ticker.dispose();
      this.loader.dispose();
      this.store.dispose();
    }
  };
  function voroforce(container, config) {
    return new Voroforce(container, config).start();
  }

  // scripts/vendor/voroforce/display/scene/shaders/main.frag
  var main_default = "#version 300 es\n\nprecision highp float;\n\n#define PI 3.14159265359\n#define TAU 2.0 * PI\n#define FLOAT_INF uintBitsToFloat(0x7f800000u)\n#define EPSILON .0001\n\n#define NUM_CELLS_SCALE_BASELINE 50000.\n#define TRANSPARENCY 0\n#define Y_SCALE 1.\n#define X_SCALE 1.\n\n#define DYNAMIC_MAX_NEIGHBORS 0\n#define MAX_NEIGHBORS_LEVEL_1 8u\n#define MAX_NEIGHBORS_LEVEL_2 24u\n#define MAX_NEIGHBORS_LEVEL_3 48u\n\n#define DOUBLE_INDEX_POOL 1\n#define DOUBLE_INDEX_POOL_EDGES 1\n#define DOUBLE_INDEX_POOL_BUFFER 0\n#define PIXEL_SEARCH 1\n#define PIXEL_SEARCH_RADIUS 16.\n#define PIXEL_SEARCH_RANDOM_DIR 0\n#define PIXEL_SEARCH_FULL_RANDOM 0\n\n#define BULGE 1\n#define BULGE_BLENDING 1\n#define BULGE_BLEND_MODE 0\n#define BULGE_BASE_STRENGTH .5\n#define BULGE_BASE_RADIUS 1.\n\n#define NOISE 1\n#define NOISE_OCTAVE 1\n#define NOISE_OCTAVE_LARGE_SCALE 1.\n#define NOISE_OCTAVE_LARGE_AMPLITUDE_MOD 0.05\n#define NOISE_OCTAVE_MEDIUM_SCALE 0.\n#define NOISE_OCTAVE_MEDIUM_AMPLITUDE_MOD 0.\n#define NOISE_OCTAVE_SMALL_SCALE 0.\n#define NOISE_OCTAVE_SMALL_AMPLITUDE_MOD 0.\n#define NOISE_CENTER_OFFSET 1\n\n#define RIPPLE 1\n#define RIPPLE_RADIUS 2.0\n#define RIPPLE_STRENGTH 0.02\n#define RIPPLE_FREQUENCY 30.0\n#define RIPPLE_SPEED 2.\n#define RIPPLE_DECAY .75\n\n#define WEIGHTED_DIST 1\n#define WEIGHT_OFFSET_SCALE 0.25\n#define WEIGHT_OFFSET_SCALE_MEDIA_MOD 9.25\n#define X_DIST_SCALING 1\n#define DEFAULT_BASE_X_DIST_SCALE 1.5\n#define DEFAULT_WEIGHTED_X_DIST_SCALE 1.5\n#define X_DIST_SCALING_EDGE_ASPECT_CORRECTION 1 // sometimes looks better without it due to extreme vertical elongation and small sizes\n\n#define MEDIA_ENABLED 1\n#define MEDIA_HIDDEN 0\n#define MEDIA_GAMMA_CONVERSION_FACTOR 2\n#define MEDIA_GRAYSCALE 0\n#define MEDIA_BICUBIC_FILTER 0\n#define MEDIA_BBOX_ADJUSTMENT_SCALE 1.\n#define MEDIA_BBOX_EDGE_BORDER_COMPENSATION 1\n#define MEDIA_LOCKED_ASPECT 1\n#define MEDIA_ASPECT 1.5\n#define MEDIA_ROTATE 0\n#define MEDIA_ROTATE_FACTOR 1.\n#define MEDIA_BULGE_MODE 0 // todo other media bulge modes\n#define MEDIA_BBOX_OVERFLOW_MODE 3 // 0 = debug (red), 1 = clamp edges, 2 = tiles, 3 = flipped tiles\n\n#define EDGES_VISIBLE 1\n#define EDGE_SMIN_SCALING 1\n#define EDGE_SMIN_SCALING_COMPENSATION 0 // switch this on when doing heavy rounding in 3d?\n#define EDGE_CELL_SCALING 1\n#define EDGE_CELL_SCALING_MODE 0 // mode 1 = media boxes if media enabled\n#define EDGE_BORDER_THICKNESS_BASE 0.075\n#define EDGE_CELL_SCALING_BORDER_THICKNESS 0\n//#define EDGE_BORDER_THICKNESS_MIN 0.\n//#define EDGE_BORDER_THICKNESS_MAX 1.\n#define EDGE_BORDER_SMOOTHNESS_BASE 0.95 // defined as a percentage of border thickness\n#define EDGE_CELL_SCALING_BORDER_SMOOTHNESS 0\n//#define EDGE_BORDER_SMOOTHNESS_MIN 0.\n//#define EDGE_BORDER_SMOOTHNESS_MAX 1.\n//#define EDGE_BORDER_ROUNDNESS_BASE 0.055\n#define EDGE_BORDER_ROUNDNESS_BASE 0.155\n#define EDGE_CELL_SCALING_BORDER_ROUNDNESS 1\n//#define EDGE_BORDER_ROUNDNESS_MIN 0.\n//#define EDGE_BORDER_ROUNDNESS_MAX 1.\n\n#define POST_UNWEIGHTED_EFFECT 1\n#define POST_UNWEIGHTED_MOD_OPACITY 1.\n#define POST_UNWEIGHTED_MOD_GRAYSCALE 0.75\n\nuniform highp sampler2D uCellCoordsTexture;\nuniform highp sampler2D uVoroIndexBufferTexture;\nuniform highp sampler2D uVoroIndexBuffer2Texture;\nuniform highp usampler2D uCellNeighborsTexture;\nuniform highp usampler2D uCellNeighborsAltTexture;\nuniform highp sampler2D uCellWeightsTexture;\nuniform highp usampler2D uCellMediaVersionsTexture;\nuniform highp usampler2D uCellIdMapTexture;\n\nuniform mediump sampler2DArray uMediaV0Texture;\nuniform mediump sampler2DArray uMediaV1Texture;\nuniform mediump sampler2DArray uMediaV2Texture;\nuniform mediump sampler2DArray uMediaV3Texture;\nuniform ivec3 iStdMediaVersionNumCols;\nuniform ivec3 iStdMediaVersionNumRows;\nuniform ivec3 iStdMediaVersionNumLayers;\nuniform int iVirtMediaVersionNumCols;\nuniform int iVirtMediaVersionNumRows;\nuniform int iVirtMediaVersionNumLayers;\n\nuniform vec3 iResolution;\nuniform int iNumCells;\nuniform int iLatticeRows;\nuniform int iLatticeCols;\nuniform float fLatticeCellWidth;\nuniform float fLatticeCellHeight;\nuniform int iFocusedIndex;\nuniform float iTime;\nuniform int iForcedMaxNeighborLevel;\nuniform float fBorderRoundnessMod;\nuniform float fBorderSmoothnessMod;\nuniform float fBorderThicknessMod;\nuniform float fCenterForceBulgeStrength;\nuniform float fCenterForceBulgeRadius;\nuniform float fWeightOffsetScaleMod;\nuniform float fWeightOffsetScaleMediaMod;\nuniform vec3 fBaseColor;\nuniform vec2 fPointer;\nuniform vec2 fCenterForce;\nuniform float fCenterForceStrengthMod;\nuniform vec2 fCenterForce2;\nuniform float fCenterForceStrengthMod2;\nuniform vec2 fCenterForce3;\nuniform float fCenterForceStrengthMod3;\nuniform bool bDrawEdges;\nuniform bool bVoroEdgeBufferOutput;\nuniform float fPixelSearchRadiusMod;\nuniform float fUnweightedEffectMod;\nuniform float fBaseXDistScale;\nuniform float fWeightedXDistScale;\nuniform bool bMediaDistortion;\nuniform float fMediaBboxScale;\nuniform float fRippleMod;\nuniform float fNoiseOctaveMod;\nuniform float fNoiseCenterOffsetMod;\n\nin vec2 vUv;\n\nlayout(location = 0) out vec4 voroIndexBufferColor;\nlayout(location = 1) out vec4 outputColor;\nlayout(location = 2) out vec4 voroEdgeBufferColor;\n#if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1\n    layout(location = 3) out vec4 voroIndexBuffer2Color;\n#endif\n\nstruct Plot {\n    uvec4 indices;\n    uvec4 indices2;\n    vec2 edge;\n    float edgeStep;\n    vec2 mediaUv;\n    float cellScale;\n    float weight;\n    float bulgeFactor;\n    float mediaBulgeFactor;\n    bool debugFlag;\n};\n\nconst vec3 GRAYSCALE_LUMCOEFF = vec3(0.2125, 0.7154, 0.0721);\nconst vec4 GRAYSCALE_DUOTONE_DARK = vec4(0.125, 0.125, 0.133, 1);\nconst vec4 GRAYSCALE_DUOTONE_LIGHT = vec4(0.769, 0.729, 0.69, 1);\n\nvec3 linearToGamma(in vec3 value, in float factor) {\n    return vec3(pow(value.xyz, vec3(1.0 / factor)));\n}\n\nvec3 gammaToLinear(in vec3 value, in float factor) {\n    return vec3(pow(value.xyz, vec3(factor)));\n}\n\nvec3 toGrayscale(vec3 c, float factor) {\n    c = linearToGamma(c, float(MEDIA_GAMMA_CONVERSION_FACTOR));\n    vec3 gray = vec3(dot(GRAYSCALE_LUMCOEFF, c));\n    vec3 duotone = mix(GRAYSCALE_DUOTONE_DARK.rgb, GRAYSCALE_DUOTONE_LIGHT.rgb, gray);\n    c = mix(c, duotone, factor);\n    c = gammaToLinear(c, float(MEDIA_GAMMA_CONVERSION_FACTOR));\n    return c;\n}\n\n#if MEDIA_BICUBIC_FILTER == 1\n    // Cubic function for interpolation\n    vec4 cubic(float v) {\n        vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;\n        vec4 s = n * n * n;\n        float x = s.x;\n        float y = s.y - 4.0 * s.x;\n        float z = s.z - 4.0 * s.y + 6.0 * s.x;\n        float w = 6.0 - x - y - z;\n        return vec4(x, y, z, w) * (1.0/6.0);\n    }\n\n    vec4 bicubicFilter(mediump sampler2DArray tex, vec3 texCoord, vec2 texSize) {\n        vec2 invTexSize = 1.0 / texSize;\n        texCoord.xy = texCoord.xy * texSize - 0.5;\n\n        vec2 fxy = fract(texCoord.xy);\n        texCoord.xy -= fxy;\n\n        vec4 xcubic = cubic(fxy.x);\n        vec4 ycubic = cubic(fxy.y);\n\n        vec4 c = texCoord.xxyy + vec2(-0.5, 1.5).xyxy;\n\n        vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);\n        vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;\n\n        offset *= invTexSize.xxyy;\n\n        vec4 sample0 = texture(tex, vec3(offset.xz, float(texCoord.z)));\n        vec4 sample1 = texture(tex, vec3(offset.yz, float(texCoord.z)));\n        vec4 sample2 = texture(tex, vec3(offset.xw, float(texCoord.z)));\n        vec4 sample3 = texture(tex, vec3(offset.yw, float(texCoord.z)));\n\n        float sx = s.x / (s.x + s.y);\n        float sy = s.z / (s.z + s.w);\n\n        return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);\n    }\n#endif\n\n#if NOISE == 1\n\n// Improved noise function (simplified Perlin-like noise)\nvec3 permute(vec3 x) {\n    return mod(((x * 34.0) + 1.0) * x, 289.0);\n}\n\nfloat snoise(vec2 v) {\n    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);\n    vec2 i = floor(v + dot(v, C.yy));\n    vec2 x0 = v - i + dot(i, C.xx);\n    vec2 i1;\n    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n    vec4 x12 = x0.xyxy + C.xxzz;\n    x12.xy -= i1;\n\n    i = mod(i, 289.0);\n    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n\n    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);\n    m = m * m;\n    m = m * m;\n\n    vec3 x = 2.0 * fract(p * C.www) - 1.0;\n    vec3 h = abs(x) - 0.5;\n    vec3 ox = floor(x + 0.5);\n    vec3 a0 = x - ox;\n\n    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);\n\n    vec3 g;\n    g.x = a0.x * x0.x + h.x * x0.y;\n    g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n    return 130.0 * dot(m, g);\n}\n\n#if NOISE_OCTAVE == 1\n// Multi-octave noise\nfloat fbm(vec2 p, float time) {\n    float value = 0.0;\n    float amplitude = 0.5;\n    float frequency = 1.0;\n\n    float largeOctaveScale = NOISE_OCTAVE_LARGE_SCALE;\n    float mediumOctaveScale = NOISE_OCTAVE_MEDIUM_SCALE;\n    float smallOctaveScale = NOISE_OCTAVE_SMALL_SCALE;\n    if (largeOctaveScale > 0.) {\n        // First octave - large scale features\n        value += amplitude * NOISE_OCTAVE_LARGE_AMPLITUDE_MOD * snoise(p * frequency * largeOctaveScale + vec2(time * 0.3, time * 0.2));\n    }\n\n    amplitude *= 0.5;\n    frequency *= 2.0;\n\n    if (mediumOctaveScale > 0.) {\n        // First octave - large scale features\n        value += amplitude * NOISE_OCTAVE_MEDIUM_AMPLITUDE_MOD * snoise(p * frequency * mediumOctaveScale + vec2(time * 0.5, -time * 0.3));\n    }\n\n    amplitude *= 0.5;\n    frequency *= 2.0;\n\n    if (smallOctaveScale > 0.) {\n        // First octave - large scale features\n        value += amplitude * NOISE_OCTAVE_SMALL_AMPLITUDE_MOD * snoise(p * frequency * smallOctaveScale + vec2(-time * 0.7, time * 0.6));\n    }\n\n    return value;\n}\n#endif\n\n#if NOISE_CENTER_OFFSET == 1\nvec2 getNoisyCenterOffset(vec2 p, float scale, float intensity, float time) {\n    // Use different noise samples for x and y components\n    float noiseX = snoise(p * scale + vec2(time * 0.4, 100.0));\n    float noiseY = snoise(p * scale + vec2(100.0, time * 0.3));\n    return vec2(noiseX, noiseY) * intensity;\n}\n#endif\n#endif\n\n#if PIXEL_SEARCH\n#if PIXEL_SEARCH_RANDOM_DIR == 1\nuint hash(inout uint x) {\n    x ^= x >> 16;\n    x *= 0x7feb352dU;\n    x ^= x >> 15;\n    x *= 0x846ca68bU;\n    x ^= x >> 16;\n\n    return x;\n}\n\nfloat randomFloat(inout uint state) {\n    return float(hash(state)) / 4294967296.0;\n}\n\nvec2 randomDir(inout uint state) {\n    float z = randomFloat(state) * 2.0 - 1.0;\n    float a = randomFloat(state) * TAU;\n    float r = sqrt(1.0f - z * z);\n    float x = r * cos(a);\n    float y = r * sin(a);\n    return vec2(x, y);\n}\n#endif\n#if PIXEL_SEARCH_FULL_RANDOM == 1\nuint wrap1d(uint flatId) {\n    return flatId % uint(iNumCells);\n}\n\nvec2 wrap2d(vec2 id, vec2 resolution) {\n    return fract(id / resolution) * resolution;\n}\n\nuint to1d(vec2 id, vec2 resolution) {\n    return uint(id.x + id.y * resolution.x);\n}\n\nivec2 to2d(uint flatId, ivec2 resolution) {\n    return ivec2(flatId, flatId / uint(resolution.x)) % resolution;\n}\n\nuint murmur3( in uint u )\n{\n    u ^= ( u >> 16 ); u *= 0x85EBCA6Bu;\n    u ^= ( u >> 13 ); u *= 0xC2B2AE35u;\n    u ^= ( u >> 16 );\n\n    return u;\n}\n\nuint rngSeed = 314159265u;\n\nuint xorshift(in uint value) {\n    value ^= value << 13;\n    value ^= value >> 17;\n    value ^= value << 5;\n    return value;\n}\n\nfloat xorshiftFloat(uint state) {\n    return float(xorshift(state)) / float(0xffffffffU);\n}\n\nuint nextUint() {\n    rngSeed = xorshift(rngSeed);\n    return rngSeed;\n}\n\nfloat nextFloat() {\n    return float(nextUint()) / float(uint(-1));\n}\n#endif\n#endif\n\nfloat cheapSqrt(float a) {\n    return 1./inversesqrt(a);\n}\n\n// commutative smoothmin\nfloat cSmin(float a, float b, float r)\n{\n    float f = max(0., 1. - abs(b - a)/r);\n    return min(a, b) - r*.25*f*f;\n}\n\n// polynomial-based smoothmin\nfloat smin( float a, float b, float k )\n{\n    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );\n    return mix( b, a, h ) - k*h*(1.0-h);\n}\n\n// exponential-based smooth minimum function, associative and commutative\nfloat sminExp(float a, float b, float k)\n{\n    float res = exp(-k*a) + exp(-k*b);\n    return -log(res)/k;\n}\n\n// smooth abs, equivalent to -smin(x, -x, r) - r*.25\nfloat sabs(float x, float r)\n{\n    float f = max(0.,1.-abs(x + x)/r);\n    return abs(x) + r*.25*(f*f - 1.);\n}\n\nfloat smax( float a, float b, float k ) {\n    return -smin(-a, -b, k);\n}\n\nfloat dot2(vec2 p) {\n    return dot(p,p);\n}\n\n#ifdef DIST_METRIC\nfloat minkowskiDist(vec2 a) {\n    float p = 1.5;\n    vec2 diff = abs(a);\n    return pow(pow(diff.x, p) + pow(diff.y, p), 1.0 / p);\n}\n\nfloat chebyshevDist(vec2 a) {\n    vec2 diff = abs(a);\n    return max(diff.x, diff.y);\n}\n\nfloat manhattanDist(in vec2 a) {\n    a = abs(a);\n    return a.x+a.y;\n//    return (a.x+a.y)*.7071;\n}\n\nfloat expManhattanDist(in vec2 a) {\n    float exponent = 1.5; // Change this to control the degree of rounding\n    return pow(manhattanDist(a), exponent);\n}\n\nfloat euclideanDist(vec2 a) {\n    return dot2(a);\n}\n\nfloat expEuclideanDist(vec2 a) {\n    return  pow(dot2(a),1.5);\n}\n\nfloat customMinkowskiDistTest(vec2 a) {\n    float p = 2.5;\n    vec2 diff = abs(a);\n    return pow((pow(diff.x, p) + pow(diff.y, p)), 1.0 / p*p+.25);\n}\n\nfloat customHybridDistTest(vec2 a) {\n    return mix(manhattanDist(a), customMinkowskiDistTest(a), 0.75);\n}\n\nfloat chaosMinkowskiDist(vec2 a) {\n    float p = 1.75;\n    vec2 diff = abs(a);\n    return pow((pow(diff.x, p) + pow(diff.y, p)), 1.3);\n}\n\n#endif\n\nfloat dist(vec2 a, vec2 b) {\n    #ifdef DIST_METRIC\n    return DIST_METRIC(a - b);\n    #else\n    return dot2(a - b);\n    #endif\n}\n\nfloat edgeLen(in vec2 x, in vec2 p1, in vec2 p2) {\n    return (dist(x, p1)-dist(x, p2))/pow(dist(p2, p1),.5);\n}\n\n// Converts an integer into a pseudo-random float between 0.0 and 1.0\nfloat randomColorChannel(uint seed) {\n    return fract(sin(float(seed) * 78.233) * 43758.5453123);\n}\n\nfloat getBaseXDistScale() {\n    return fBaseXDistScale > 0. ? fBaseXDistScale : DEFAULT_BASE_X_DIST_SCALE;\n}\n\nfloat getWeightedXDistScale() {\n    return fWeightedXDistScale > 0. ? fWeightedXDistScale : DEFAULT_WEIGHTED_X_DIST_SCALE;;\n}\n\nfloat getXDistScale(float weight) {\n    float baseXDistScale = getBaseXDistScale();\n    float weightedXDistScale = getWeightedXDistScale();\n    return baseXDistScale + weight * (weightedXDistScale-baseXDistScale);\n}\n\nfloat dist(vec2 p1, vec2 p2, float weight, float weightOffset) {\n    vec2 v = p1 - p2;\n\n    #if X_DIST_SCALING == 1\n        float scaleX = getXDistScale(weight);\n        v.x *= scaleX; // Apply less x weight for vertical elongation\n    #endif\n\n    #ifdef DIST_METRIC\n        float dist = DIST_METRIC(v);\n    #else\n        float dist = dot2(v);\n    #endif\n\n    #if WEIGHTED_DIST == 1\n        dist -= weightOffset;\n    #endif\n    return dist;\n}\n\nbool indexIsUndefined(uint id) {\n    return id == uint(-1);\n}\n\nuint cellIdMapTexData(uint index) {\n    int iIndex = int(index);\n    int textureWidth = textureSize(uCellIdMapTexture, 0).x;\n    return texelFetch(uCellIdMapTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).r;\n}\n\nuvec2 mediaVersionTexData(uint index) {\n    int iIndex = int(index);\n    int textureWidth = textureSize(uCellMediaVersionsTexture, 0).x;\n    return texelFetch(uCellMediaVersionsTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).rg;\n}\n\nfloat weightTexData(uint index) {\n    int iIndex = int(index);\n    int textureWidth = textureSize(uCellWeightsTexture, 0).x;\n    return texelFetch(uCellWeightsTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).r;\n}\n\nuint neighborsTexData(uint index) {\n    int iIndex = int(index);\n    int textureWidth = textureSize(uCellNeighborsTexture, 0).x;\n    return texelFetch(uCellNeighborsTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).r;\n}\n\nvec2 coordsTexData(int index) {\n    int textureWidth = textureSize(uCellCoordsTexture, 0).x;\n    return texelFetch(uCellCoordsTexture, ivec2(index % textureWidth, index / textureWidth), 0).rg ;\n}\n\nvec2 rawCoords(in vec2 screenCoords) {\n    return vec2(screenCoords.x, iResolution.y - screenCoords.y);\n}\n\nvec2 normalizeCoords(in vec2 screenCoords) {\n    return (screenCoords / iResolution.xy) * 2.0 - 1.0;\n}\n\nfloat aspectCoordsDenominator;\nvoid initAspectCoordsDenominator() {\n    aspectCoordsDenominator = max(min(iResolution.x, iResolution.y), max(iResolution.x, iResolution.y) * 0.5);\n}\n\nvec2 aspectCoords(in vec2 screenCoords) {\n    return (screenCoords*2.0-iResolution.xy) / aspectCoordsDenominator;\n}\n\nvec2 fetchRawCellCoords(uint i) {\n    return rawCoords(coordsTexData(int(i)));\n}\n\nvec2 fetchAspectCellCoords(uint i) {\n    return aspectCoords(fetchRawCellCoords(i));\n}\n\nvec2 fetchNormalizedCellCoords(uint i) {\n    return normalizeCoords(fetchRawCellCoords(i));\n}\n\nvec4 fetchCellCoords(uint i) {\n    vec2 rawCoords = fetchRawCellCoords(i);\n    return vec4(aspectCoords(rawCoords), normalizeCoords(rawCoords));\n}\n\nvec2 fragCoords() {\n    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;\n    fragCoord.y /= Y_SCALE;\n    fragCoord.x /= X_SCALE;\n    return fragCoord;\n}\n\nvec2 pCoords() {\n    return aspectCoords(fragCoords());\n}\n\nvec2 normalizedPCoords() {\n    return normalizeCoords(fragCoords());\n}\n\n/* GLOBALS */\nfloat resolutionScale;\nvoid initResolutionScale() {\n//    resolutionScale = length(iResolution.xy) / 1000.0;\n    resolutionScale = length(iResolution.xy*iResolution.z) / 1500.0;\n\n    // resolutionScale = max(iResolution.x, iResolution.y) / 800.0; // based on largest dimension\n    // resolutionScale = sqrt(iResolution.x * iResolution.y) / 600.0; // based on area (gives more weight to resolution changes)\n\n    // resolutionScale = clamp(resolutionScale, 0.5, 1.5);\n    resolutionScale = cheapSqrt(resolutionScale);\n}\n\nfloat numCellsScale;\nvoid initNumCellsScale() {\n    numCellsScale = NUM_CELLS_SCALE_BASELINE / float(iNumCells);\n    numCellsScale = cheapSqrt(numCellsScale);\n}\n\nvec2 centerForce;\nvec2 centerForceCoords;\nvec2 centerForceNCoords;\n#if BULGE_BLENDING == 1\nvec2 centerForce2;\nvec2 centerForceCoords2;\nvec2 centerForce3;\nvec2 centerForceCoords3;\n#endif\nvoid initCenterForce() {\n    centerForce = rawCoords(fCenterForce);\n    centerForceCoords = aspectCoords(centerForce);\n    centerForceNCoords = normalizeCoords(centerForce);\n\n    #if NOISE == 1 && NOISE_CENTER_OFFSET == 1\n        if (fNoiseCenterOffsetMod > 0.) {\n            centerForceCoords += getNoisyCenterOffset(centerForceCoords, 1., 0.125, iTime * 0.5) * 0.1 * fNoiseCenterOffsetMod;\n        }\n    #endif\n\n    #if BULGE_BLENDING == 1\n        centerForce2 = rawCoords(fCenterForce2);\n        centerForceCoords2 = aspectCoords(centerForce2);\n        centerForce3 = rawCoords(fCenterForce3);\n        centerForceCoords3 = aspectCoords(centerForce3);\n\n        #if NOISE == 1 && NOISE_CENTER_OFFSET == 1\n            if (fNoiseCenterOffsetMod > 0.) {\n                centerForceCoords2 += getNoisyCenterOffset(centerForceCoords, 1., 0.5, iTime * 0.5) * 0.1 * fNoiseCenterOffsetMod;\n                centerForceCoords3 += getNoisyCenterOffset(centerForceCoords, 1., 1., iTime * 0.5) * 0.1 * fNoiseCenterOffsetMod;\n            }\n        #endif\n    #endif\n}\n\n#if BULGE == 1\nfloat bulgeRadius;\nfloat bulgeStrength;\n#if BULGE_BLENDING == 1\nfloat bulgeRadius2;\nfloat bulgeStrength2;\nfloat bulgeRadius3;\nfloat bulgeStrength3;\n#endif\nvoid initBulge() {\n    bulgeRadius = BULGE_BASE_RADIUS * fCenterForceBulgeRadius * fCenterForceStrengthMod;\n    bulgeStrength = BULGE_BASE_STRENGTH * fCenterForceBulgeStrength * fCenterForceStrengthMod;\n\n    #if BULGE_BLENDING == 1\n        bulgeRadius2 = BULGE_BASE_RADIUS * fCenterForceBulgeRadius * fCenterForceStrengthMod2;\n        bulgeStrength2 = BULGE_BASE_STRENGTH * fCenterForceBulgeStrength * fCenterForceStrengthMod2;\n        bulgeRadius3 = BULGE_BASE_RADIUS * fCenterForceBulgeRadius * fCenterForceStrengthMod3;\n        bulgeStrength3 = BULGE_BASE_STRENGTH * fCenterForceBulgeStrength * fCenterForceStrengthMod3;\n    #endif\n}\n#endif\n\nvoid initGlobals() {\n    initAspectCoordsDenominator();\n    initResolutionScale();\n    initNumCellsScale();\n    initCenterForce();\n    #if BULGE == 1\n        initBulge();\n    #endif\n}\n/* GLOBALS END */\n\nfloat calculateOrientation(vec2 left, vec2 right) {\n    vec2 localX = normalize(right - left);\n    return atan(localX.y, localX.x);\n}\n\nvoid rotateMediaUv(inout vec2 mediaUv, in uint index) {\n    uint neighborsIndexStart = neighborsTexData(index*2u);\n    float angle = calculateOrientation(fetchNormalizedCellCoords(neighborsTexData(neighborsIndexStart+3u)),fetchNormalizedCellCoords(neighborsTexData(neighborsIndexStart+4u)));\n\n    // center origin\n    vec2 centerUv = vec2(0.5);\n    vec2 pos = mediaUv - centerUv;\n\n    // rotate\n    angle *= MEDIA_ROTATE_FACTOR;\n    float cosAngle = cos(angle);\n    float sinAngle = sin(angle);\n    vec2 rotatedUv = vec2(\n        pos.x * cosAngle - pos.y * sinAngle,\n        pos.x * sinAngle + pos.y * cosAngle\n    );\n\n    // revert centered origin\n    mediaUv = rotatedUv + centerUv;\n}\n\n// Assigns a random vec3 color based on the primary cell index\nvoid randomCellColor(inout vec3 c, inout float a, in Plot plot) {\n    float r = randomColorChannel(plot.indices.x);\n    float g = randomColorChannel(plot.indices.x + 1u);\n    float b = randomColorChannel(plot.indices.x + 2u);\n    c = vec3(r, g, b);\n}\n\nvec2 getMirroredTileUV(vec2 uv, float shrinkAmount) {\n    vec2 tiled = fract(uv);\n\n    float halfShrink = shrinkAmount * 0.5;\n    vec2 shrunk = tiled * (1.0 - shrinkAmount) + halfShrink;\n\n    vec2 flipped = 1.0 - shrunk;\n    vec2 shouldFlip = mod(floor(uv), 2.0);\n\n    return mix(shrunk, flipped, shouldFlip);\n}\n\nvec2 calcMediaUv(in vec4 mediaBbox, in uint index, in float mediaBulgeFactor) {\n    vec2 p = normalizedPCoords();\n\n    #if BULGE == 1 && (MEDIA_BULGE_MODE == 0 || MEDIA_BULGE_MODE == 1)\n        p = (p - centerForceNCoords) * mediaBulgeFactor + centerForceNCoords;\n    #endif\n\n    vec2 mediaUv = (p - mediaBbox.xy) / (mediaBbox.zw - mediaBbox.xy);\n    mediaUv.y = 1. - mediaUv.y;\n\n    bool rotateMedia = MEDIA_ROTATE != 0 || bMediaDistortion;\n    if (rotateMedia) {\n        rotateMediaUv(mediaUv, index);\n    }\n\n    #if MEDIA_BBOX_OVERFLOW_MODE == 1\n        mediaUv = vec2(clamp(mediaUv.x, 0.01, 0.99), clamp(mediaUv.y, 0.01, 0.99));\n    #elif MEDIA_BBOX_OVERFLOW_MODE == 2\n        mediaUv = fract(mediaUv);\n    #elif MEDIA_BBOX_OVERFLOW_MODE == 3\n        mediaUv = getMirroredTileUV(mediaUv, 0.01);\n    #endif\n\n    return mediaUv;\n}\n\nvoid mediaColor(inout vec3 c, inout float a, in Plot plot) {\n    vec2 mediaUv = plot.mediaUv;\n    uint index = plot.indices.x;\n\n    #if MEDIA_BBOX_OVERFLOW_MODE == 0  // highlight bbox overflow (debug)\n        if (mediaUv.x < 0.01 || mediaUv.x > 0.99 || mediaUv.y < 0.01 || mediaUv.y > 0.99) {\n            c = vec3(1.,0.,0.);\n            return;\n        }\n    #endif\n\n    int iMediaVersion = int(mediaVersionTexData(index).x);\n    int numLayers;\n    int mediaCols;\n    int mediaRows;\n    // msedge warns that dynamic indexing [] of vectors and matrices is emulated and can be slow so we unfold\n    if (iMediaVersion == 0) {\n        numLayers = iStdMediaVersionNumLayers.x;\n        mediaCols = iStdMediaVersionNumCols.x;\n        mediaRows = iStdMediaVersionNumRows.x;\n    } else if (iMediaVersion == 1) {\n        numLayers = iStdMediaVersionNumLayers.y;\n        mediaCols = iStdMediaVersionNumCols.y;\n        mediaRows = iStdMediaVersionNumRows.y;\n    } else if (iMediaVersion == 2) {\n        numLayers = iStdMediaVersionNumLayers.z;\n        mediaCols = iStdMediaVersionNumCols.z;\n        mediaRows = iStdMediaVersionNumRows.z;\n    } else if (iMediaVersion == 3) {\n        numLayers = iVirtMediaVersionNumLayers;\n        mediaCols = iVirtMediaVersionNumCols;\n        mediaRows = iVirtMediaVersionNumRows;\n    }\n\n    int id = int(cellIdMapTexData(index));\n    int mediaCapacity = mediaCols * mediaRows;\n    int layer = id / mediaCapacity % numLayers;\n    int tileIndex = id % mediaCapacity;\n    float tileRow = float(tileIndex / mediaCols);\n    float tileCol = float(tileIndex % mediaCols);\n    float tileWidth = 1.0 / float(mediaCols);\n    float tileHeight = 1.0 / float(mediaRows);\n    vec2 tileOffset = vec2(tileCol * tileWidth, tileRow * tileHeight);\n\n    vec2 tileSize = vec2(tileWidth, tileHeight);\n    vec2 mediaTexcoord = tileOffset + mediaUv * tileSize;\n\n    if (iMediaVersion == 0) {\n        #if MEDIA_BICUBIC_FILTER == 1\n            vec2 texSize = vec2(textureSize(uMediaV0Texture, 0).xy);\n            vec2 tileTexSize = texSize*tileSize;\n            c = bicubicFilter(uMediaV0Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;\n        #else\n            c = texture(uMediaV0Texture, vec3(mediaTexcoord, float(layer))).rgb;\n        #endif\n    } else if (iMediaVersion == 1) {\n        #if MEDIA_BICUBIC_FILTER == 1\n            vec2 texSize = vec2(textureSize(uMediaV1Texture, 0).xy);\n            vec2 tileTexSize = texSize*tileSize;\n            c = bicubicFilter(uMediaV1Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;\n        #else\n            c = texture(uMediaV1Texture, vec3(mediaTexcoord, float(layer))).rgb;\n        #endif\n    } else if (iMediaVersion == 2) {\n        #if MEDIA_BICUBIC_FILTER == 1\n            vec2 texSize = vec2(textureSize(uMediaV2Texture, 0).xy);\n            vec2 tileTexSize = texSize*tileSize;\n            c = bicubicFilter(uMediaV2Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;\n        #else\n            c = texture(uMediaV2Texture, vec3(mediaTexcoord, float(layer))).rgb;\n        #endif\n    } else if (iMediaVersion == 3) {\n        #if MEDIA_BICUBIC_FILTER == 1\n            vec2 texSize = vec2(textureSize(uMediaV2Texture, 0).xy);\n            vec2 tileTexSize = texSize*tileSize;\n            c = bicubicFilter(uMediaV3Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;\n        #else\n            c = texture(uMediaV3Texture, vec3(mediaTexcoord, float(layer))).rgb;\n        #endif\n    }\n\n}\n\n#if BULGE == 1\nfloat bulgeSmoothstep(float a) {\n    float x = clamp(a * a, 0., 1.);\n\n    if (x > .5) {\n        return x * x * x/(3.0*x*x-3.0*x+1.0); // IQ: cubic rational\n    } else {\n        return x * x * x * (x * (6. * x - 15.) + 10.); // smootherstep (wiki), also (IQ: Quintic Polynomial)\n    }\n\n//    return x * x * (3.0 - 2.0 * x); // equivalent to: return smoothstep(0.0, 1. / percent, percent);\n//    return x * x * x * (x * (6. * x - 15.) + 10.); // smootherstep (wiki), also (IQ: Quintic Polynomial)\n//    return x * x * x/(3.0*x*x-3.0*x+1.0); // IQ: cubic rational\n//    return pow(x, 1.5) * (2.0 - x); // Custom easing with more gradual falloff\n//    return 1.0 - exp(-3.0 * (1.0 - x)); // Exponential falloff for very gradual transition\n//    return pow(x, 2.5); // Adjustable falloff curve - increase falloffPower for more gradual transition\n}\n\n#if BULGE_BLENDING == 1\n// blend modes for combining bulges\nfloat blendBulges(float a, float b) {\n//    #if BULGE_BLEND_MODE == 0\n        return smin(a, b, 0.1); // Smin\n//    #elif BULGE_BLEND_MODE == 1\n//        return a * b; // Multiply\n//    #elif BULGE_BLEND_MODE == 2\n//        return a + b - a * b; // Screen\n//    #else\n//        return a + b; // Additive\n//    #endif\n}\n#endif\n\nvoid applyBulge(inout vec2 p, inout float bulgeFactor) {\n    if (bulgeRadius == 0. ||  bulgeStrength == 0.) return;\n\n    vec2 d = p - centerForceCoords;\n    float l = length(d);\n    float edge = l / bulgeRadius;\n    bulgeFactor = mix(1.0, bulgeSmoothstep(edge), bulgeStrength);\n\n    #if BULGE_BLENDING == 1\n        edge = length(p - centerForceCoords2) / bulgeRadius2;\n        bulgeFactor = blendBulges(bulgeFactor, mix(1.0, bulgeSmoothstep(edge), bulgeStrength2));\n        edge = length(p - centerForceCoords3) / bulgeRadius3;\n        bulgeFactor = blendBulges(bulgeFactor, mix(1.0, bulgeSmoothstep(edge), bulgeStrength3));\n    #endif\n\n    #if NOISE == 1\n        #if NOISE_OCTAVE == 1\n            if (fNoiseOctaveMod > 0.) {\n                float noise = fbm(p, iTime);\n                bulgeFactor *= (1.0 + noise * 0.47 * fNoiseOctaveMod);\n            }\n        #endif\n    #endif\n\n    #if RIPPLE == 1\n        if (fRippleMod > 0.) {\n            float rippleCenterMod = l < RIPPLE_RADIUS ? (l - RIPPLE_RADIUS) * (l - RIPPLE_RADIUS) : 0.;\n            float ripple = sin(RIPPLE_FREQUENCY * l - (iTime * RIPPLE_SPEED)) * RIPPLE_STRENGTH * rippleCenterMod;\n            bulgeFactor *= (1.0 + ripple * (1.-RIPPLE_DECAY) * fCenterForceBulgeStrength * fCenterForceStrengthMod * fCenterForceStrengthMod * fRippleMod);\n        }\n    #endif\n\n    p = (p - centerForceCoords) * bulgeFactor + centerForceCoords;\n}\n\nvoid applyMediaBboxBulge(inout vec4 cellCoords, inout float mediaBulgeFactor, in float bulgeFactor) {\n    if (bulgeRadius == 0.) return;\n\n    #if MEDIA_BULGE_MODE == 0\n        mediaBulgeFactor = bulgeFactor;\n    # else\n        float edge = length(cellCoords.xy - centerForceCoords) / bulgeRadius;\n        mediaBulgeFactor = mix(1.0, bulgeSmoothstep(edge), bulgeStrength);\n\n        #if BULGE_BLENDING == 1\n            edge = length(cellCoords.xy - centerForceCoords2) / bulgeRadius2;\n            mediaBulgeFactor = blendBulges(mediaBulgeFactor,  mix(1.0, bulgeSmoothstep(edge), bulgeStrength2));\n            edge = length(cellCoords.xy - centerForceCoords3) / bulgeRadius3;\n            mediaBulgeFactor = blendBulges(mediaBulgeFactor,  mix(1.0, bulgeSmoothstep(edge), bulgeStrength3));\n        #endif\n\n        #if MEDIA_BULGE_MODE == 2\n//                mediaBulgeFactor = mix(mediaBulgeFactor, bulgeFactor, 0.5);\n            cellCoords.zw = (cellCoords.zw - centerForceNCoords) / mediaBulgeFactor + centerForceNCoords;\n        #endif\n    #endif\n}\n#endif\n\nvec4 calcMediaBbox(in uint index, in vec4 cellCoords, in float bulgeFactor, inout float mediaBulgeFactor, in float edgeBorder, in float mediaWeightOffsetScale) {\n    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));\n    vec2 midSum = vec2(0.0);\n\n    #if BULGE == 1\n        applyMediaBboxBulge(cellCoords, mediaBulgeFactor, bulgeFactor);\n    #endif\n\n    uint neighborsPosition = neighborsTexData(index*2u);\n    uint neighborsLength = min(neighborsTexData(index*2u+1u), MAX_NEIGHBORS_LEVEL_1);\n\n    for (uint i = 0u; i < neighborsLength; i++) {\n        uint neighborIndex = neighborsTexData(neighborsPosition+i);\n        vec4 neighborCoords = fetchCellCoords(neighborIndex);\n\n        float neighborMediaBulgeFactor;\n\n        #if BULGE == 1 && MEDIA_BULGE_MODE == 2\n            neighborMediaBulgeFactor = 1.;\n            applyMediaBboxBulge(neighborCoords, neighborMediaBulgeFactor, bulgeFactor);\n//            neighborNCoords = (neighborNCoords - centerForceNCoords) / mediaBulgeFactor + centerForceNCoords;\n        #endif\n\n        float midFactor = 0.5;\n        #if WEIGHTED_DIST == 1\n            float mediaWeight = mediaWeightOffsetScale * weightTexData(index);\n            float neighborMediaWeight = mediaWeightOffsetScale * weightTexData(neighborIndex);\n            midFactor += (mediaWeight - neighborMediaWeight);\n        #endif\n\n//        #if BULGE == 1 && MEDIA_BULGE_MODE == 2\n//            midFactor *= (mediaBulgeFactor/neighborMediaBulgeFactor);\n//            midFactor = min(midFactor, 1.);\n//        #endif\n\n\n        vec2 mid = mix(cellCoords.zw, neighborCoords.zw, midFactor);\n        midSum += mid;\n\n        mediaBbox.xy = min(mediaBbox.xy, mid);\n        mediaBbox.zw = max(mediaBbox.zw, mid);\n    }\n\n    vec2 avgCenter = midSum / float(neighborsLength);\n//    avgCenter = (avgCenter - centerForceNCoords) * mediaBulgeFactor + centerForceNCoords;\n//    vec2 avgCenterDiff = (avgCenter - cellCoords.zw);\n//    mediaBbox.xy = min(mediaBbox.xy, mediaBbox.xy + avgCenterDiff);\n//    mediaBbox.zw = max(mediaBbox.zw, mediaBbox.zw + avgCenterDiff);\n\n    float bbX = mediaBbox.z - mediaBbox.x;\n    float bbY = mediaBbox.w - mediaBbox.y;\n\n\n    // TODO\n    //    #if EDGE_CELL_SCALING == 1\n    //    #if EDGE_CELL_SCALING_MODE == 1\n    //    // cellScale = min(bbX, bbY) / 2.;\n    //    // cellScale = (bbX + bbY) * 0.5 / 2.;\n    //    #endif\n    //    #endif\n\n    #if MEDIA_BBOX_EDGE_BORDER_COMPENSATION == 1\n    bbX -= edgeBorder;\n    bbY -= edgeBorder;\n    #endif\n\n    vec2 offset = vec2(0.5 * fMediaBboxScale);\n    bool lockedAspect = MEDIA_LOCKED_ASPECT == 1 && !bMediaDistortion;\n    if (lockedAspect) {\n        float bbMax = max(bbX, bbY / MEDIA_ASPECT);\n        float aspect = iResolution.x / iResolution.y;\n        if (aspect > 1.) {\n            offset *= vec2(bbMax / aspect, bbMax * MEDIA_ASPECT);\n        } else {\n            offset *= vec2(bbMax, (bbMax * MEDIA_ASPECT) * aspect);\n        }\n    } else {\n        offset *= vec2(bbX, bbY);\n    }\n\n    //    offset *= mediaBulgeFactor;\n\n    mediaBbox.xy = avgCenter - offset;\n    mediaBbox.zw = avgCenter + offset;\n\n    return mediaBbox;\n}\n\n\nvoid processNeighborEdge(in uint neighborIndex, in vec2 cellCoords, in vec2 p, inout vec2 edge, in float weight, in float weightOffset, in float weightOffsetScale, in float borderRoundness, in float bulgeFactor) {\n    vec2 neighborCellCoords = fetchAspectCellCoords(neighborIndex);\n\n    #if WEIGHTED_DIST == 1 || X_DIST_SCALING == 1\n\n        float closeWeight = 0.;\n        float closeWeightOffset;\n        #if WEIGHTED_DIST == 1\n            closeWeight = weightTexData(neighborIndex);\n            closeWeightOffset = weightOffsetScale * closeWeight;\n        #endif\n\n        vec2 cellOffset = cellCoords - p;\n        vec2 neighborCellOffset = neighborCellCoords - p;\n        vec2 cellOffsetsDifference = neighborCellOffset - cellOffset;\n\n        #if X_DIST_SCALING == 1\n            float scaleX = getXDistScale(max(closeWeight, weight));\n            cellOffset.x *= scaleX;\n            neighborCellOffset.x *= scaleX;\n            cellOffsetsDifference.x *= scaleX;\n        #endif\n\n        float baseDist = dot2(cellOffsetsDifference);\n        float distFactor = 0.5;\n\n        #if WEIGHTED_DIST == 1\n            float d = baseDist;\n            d -= (closeWeightOffset - weightOffset);\n            distFactor = d / (2. * baseDist);\n        #endif\n\n        // essentially the same as simplified variant below, just deconstructed to allow for dist metric tweaking\n        #ifdef DIST_METRIC\n            // todo\n            float len = (dist(p, neighborCellCoords, closeWeight, closeWeightOffset)-dist(p, cellCoords, weight, weightOffset))/pow(dist(cellCoords, neighborCellCoords, weight, weightOffset),distFactor);\n            #if X_DIST_SCALING == 1 && X_DIST_SCALING_EDGE_ASPECT_CORRECTION == 1\n                vec2 direction = cellOffsetsDifference * inversesqrt(baseDist);\n                len *= mix(1.0, 1.0 / scaleX, abs(direction.x)); // post-process the len based on direction angle\n            #endif\n        #else\n            vec2 offset = mix(cellOffset, neighborCellOffset, distFactor);\n            vec2 direction = cellOffsetsDifference * inversesqrt(baseDist);\n            float len = dot(direction, offset);\n\n            #if X_DIST_SCALING == 1 && X_DIST_SCALING_EDGE_ASPECT_CORRECTION == 1\n                //len *= length(direction * vec2(1.0 / scaleX, 1.0)) / length(direction); // scale based on direction components - more accurate, more expensive\n                len *= mix(1.0, 1.0 / scaleX, abs(direction.x)); // post-process the len based on direction angle\n            #endif\n        #endif\n    #else\n        // simplified variant without weights and x-component dist scaling\n        #ifdef DIST_METRIC\n            float len = edgeLen(p, neighborCellCoords, cellCoords);\n        #else\n            vec2 offset = p - (neighborCellCoords + cellCoords) * 0.5;\n            vec2 direction = normalize(cellCoords - neighborCellCoords);\n            float len = dot(direction, offset);\n        #endif\n    #endif\n\n    #if EDGE_SMIN_SCALING == 1\n        borderRoundness *= len *.5 + .5;\n    #endif\n\n    edge.x = cSmin(edge.x, len, borderRoundness);\n    edge.y = min(edge.y, len);\n}\n\nvoid calcEdge(in uvec4 indices, in uvec4 indices2, in vec2 cellCoords, in vec2 p, inout vec2 edge, in float weight, in float weightOffset, in float weightOffsetScale, in float borderRoundness, in float bulgeFactor) {\n\n    processNeighborEdge(indices.y, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n    processNeighborEdge(indices.z, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n    processNeighborEdge(indices.w, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n\n    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_EDGES == 1\n        processNeighborEdge(indices2.x, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n        processNeighborEdge(indices2.y, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n        processNeighborEdge(indices2.z, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n        processNeighborEdge(indices2.w, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n    #endif\n\n    #if EDGE_SMIN_SCALING == 1 && EDGE_SMIN_SCALING_COMPENSATION == 1\n        // compensation for smoothing scaling side-effect?\n        edge.x *= .5 + borderRoundness;\n    #endif\n\n    // edge.x = sabs(edge.x, .0001); // smooth abs for extra smoothness?\n    edge = max(vec2(edge.x, edge.y), 0.);\n}\n\nvoid sortClosest(\n    inout vec4 distances,\n    inout vec4 distances2,\n    inout uvec4 indices,\n    inout uvec4 indices2,\n    uint index,\n    vec2 p,\n    float weightOffsetScale,\n    float prevMaxWeight\n) {\n    if (indexIsUndefined(index) || any(equal(indices, uvec4(index)))) return;\n\n    #if DOUBLE_INDEX_POOL == 1\n        if (any(equal(indices2, uvec4(index)))) return;\n    #endif\n\n    float weight;\n    float weightOffset;\n\n    #if WEIGHTED_DIST == 1\n        weight = weightTexData(index);\n        weightOffset = weightOffsetScale * weight;\n        weight = weight > 0. ? weight : prevMaxWeight;\n    #endif\n\n    float d = dist(p, fetchAspectCellCoords(index), weight, weightOffset);\n\n    if (d < distances.x) {\n        distances = vec4(d, distances.xyz);\n        indices = uvec4(index, indices.xyz);\n    } else if (d < distances.y) {\n        distances = vec4(distances.x, d, distances.yz);\n        indices = uvec4(indices.x, index, indices.yz);\n    } else if (d < distances.z) {\n        distances = vec4(distances.xy, d, distances.z);\n        indices = uvec4(indices.xy, index, indices.z);\n    } else if (d < distances.w) {\n        distances = vec4(distances.xyz, d);\n        indices = uvec4(indices.xyz, index);\n    }\n    #if DOUBLE_INDEX_POOL == 1\n    else if (d < distances2.x) {\n        distances2 = vec4(d, distances2.xyz);\n        indices2 = uvec4(index, indices2.xyz);\n    } else if (d < distances2.y) {\n        distances2 = vec4(distances2.x, d, distances2.yz);\n        indices2 = uvec4(indices2.x, index, indices2.yz);\n    } else if (d < distances2.z) {\n        distances2 = vec4(distances2.xy, d, distances2.z);\n        indices2 = uvec4(indices2.xy, index, indices2.z);\n    } else if (d < distances2.w) {\n        distances2 = vec4(distances2.xyz, d);\n        indices2 = uvec4(indices2.xyz, index);\n    }\n    #endif\n}\n\nuvec4 fetchIndices(vec2 position) {\n    return floatBitsToUint(texelFetch(uVoroIndexBufferTexture, ivec2(position), 0)) - 1u;\n}\n\nuvec4 fetchIndices2(vec2 position) {\n    return floatBitsToUint(texelFetch(uVoroIndexBuffer2Texture, ivec2(position), 0)) - 1u;\n}\n\nvoid fetchAndSortIndices( inout vec4 distances, inout vec4 distances2, inout uvec4 prevIndices, inout uvec4 prevIndices2, in vec2 samplePoint, in vec2 p, in float weightOffsetScale, in float prevMaxWeight ) {\n    uvec4 indices = fetchIndices(samplePoint);\n    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.x, p, weightOffsetScale, prevMaxWeight);\n    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.y, p, weightOffsetScale, prevMaxWeight);\n    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.z, p, weightOffsetScale, prevMaxWeight);\n    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.w, p, weightOffsetScale, prevMaxWeight);\n\n    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1\n        uvec4 indices2 = fetchIndices2(samplePoint);\n        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.x, p, weightOffsetScale, prevMaxWeight);\n        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.y, p, weightOffsetScale, prevMaxWeight);\n        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.z, p, weightOffsetScale, prevMaxWeight);\n        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.w, p, weightOffsetScale, prevMaxWeight);\n    #endif\n}\n\nPlot init(vec2 p) {\n    uvec4 indices = uvec4(uint(-1));\n\n    uint row = uint(round((1.-vUv.y) * float(iLatticeRows)));\n    uint col = uint(round(vUv.x * float(iLatticeCols)));\n\n    indices.x = row * uint(iLatticeCols) + col;\n    if (int(indices.x) > iNumCells) {\n        indices.x = (row-1u) * uint(iLatticeCols) + col;\n    }\n\n    return Plot(indices, uvec4(uint(-1)), vec2(0.), 0., vec2(0.), 0., 0., 1., 1., false);\n}\n\nvoid calcIndices(inout uvec4 indices, inout uvec4 indices2, inout uint neighborsPosition, in vec2 p, in uint index, in float weightOffsetScale, in float prevMaxWeight, in float bulgeFactor) {\n\n    vec4 distances = vec4(FLOAT_INF);\n    vec4 distances2 = vec4(FLOAT_INF);\n\n    // pixel search\n    if (PIXEL_SEARCH == 1 && fPixelSearchRadiusMod > 0.) {\n        vec2 fragCoord = gl_FragCoord.xy;\n        vec2 rad = vec2(PIXEL_SEARCH_RADIUS * numCellsScale * (resolutionScale/1.208) * fPixelSearchRadiusMod);\n        #if BULGE == 1\n            if (bulgeFactor < 1.) {\n                rad *= max((1.-bulgeFactor), 0.45); // todo it helps? but needs further tweaking\n            }\n        #endif\n        #if PIXEL_SEARCH_RANDOM_DIR == 1\n            uint seed = uint(fragCoord.x) + uint(fragCoord.y);\n            rad *= randomDir(seed);\n        #endif\n\n        fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord, p, weightOffsetScale, prevMaxWeight);\n        fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2( 1., 0.) * rad, p, weightOffsetScale, prevMaxWeight);\n        fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2( 0., 1.) * rad, p, weightOffsetScale, prevMaxWeight);\n        fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2(-1., 0.) * rad, p, weightOffsetScale, prevMaxWeight);\n        fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2( 0.,-1.) * rad, p, weightOffsetScale, prevMaxWeight);\n\n        #if PIXEL_SEARCH_FULL_RANDOM == 1\n            rngSeed = murmur3(uint(fragCoord.x)) ^ murmur3(floatBitsToUint(fragCoord.y)) ^ murmur3(floatBitsToUint(iTime));\n            for (int i = 0; i < 16; i++) {\n                sortClosest(distances, distances2, indices, indices2, wrap1d(nextUint()), p, weightOffsetScale, prevMaxWeight);\n            }\n        #endif\n    } else {\n        sortClosest(distances, distances2, indices, indices2, index, p, weightOffsetScale, prevMaxWeight);\n    }\n\n    // neighbors search\n    uint maxNeighborIterations = MAX_NEIGHBORS_LEVEL_1;\n    #if DYNAMIC_MAX_NEIGHBORS == 1\n        if (iForcedMaxNeighborLevel == 2) {\n            maxNeighborIterations = MAX_NEIGHBORS_LEVEL_2;\n        } else if (iForcedMaxNeighborLevel == 3) {\n            maxNeighborIterations = MAX_NEIGHBORS_LEVEL_3;\n        }\n    #endif\n    neighborsPosition = neighborsTexData(indices.x * 2u);\n    uint neighborsLength = neighborsTexData(indices.x * 2u + 1u);\n    for (uint i = 0u; i < min(neighborsLength, maxNeighborIterations); i++) {\n        sortClosest(distances, distances2, indices, indices2, neighborsTexData(neighborsPosition+i), p, weightOffsetScale, prevMaxWeight);\n    }\n}\n\nPlot plot() {\n\n    vec2 p = pCoords();\n\n    vec2 fragCoord = gl_FragCoord.xy;\n    uvec4 prevIndices = fetchIndices(fragCoord);\n    if (indexIsUndefined(prevIndices.x)) return init(p);\n\n    bool debugFlag = false;\n\n    float bulgeFactor = 1.;\n    float mediaBulgeFactor = 1.;\n    #if BULGE == 1\n        applyBulge(p, bulgeFactor);\n    #endif\n\n    float prevMaxWeight;\n    float weightOffsetScale = 1.;\n    float mediaWeightOffsetScale = 1.;\n\n    #if WEIGHTED_DIST == 1\n        weightOffsetScale = WEIGHT_OFFSET_SCALE * fWeightOffsetScaleMod * min(resolutionScale, 0.1)/* * 1./float(iNumCells)*/;\n        mediaWeightOffsetScale = weightOffsetScale * WEIGHT_OFFSET_SCALE_MEDIA_MOD * fWeightOffsetScaleMediaMod;\n        prevMaxWeight = max(weightTexData(prevIndices.x), weightTexData(prevIndices.y));\n    #endif\n\n    // closest cell index\n    uint index = prevIndices.x;\n    uvec4 indices = uvec4(-1);\n    uvec4 indices2 = uvec4(-1);\n    uint neighborsPosition;\n    calcIndices(indices, indices2, neighborsPosition, p, index, weightOffsetScale, prevMaxWeight, bulgeFactor);\n\n    // update closest\n    index = indices.x;\n    vec4 cellCoords = fetchCellCoords(index);\n\n    float cellScale = 0.1;\n    float borderThicknessScale = 0.1;\n    float borderSmoothnessScale = 1.;\n    float borderRoundnessScale = 0.1;\n    #if EDGE_CELL_SCALING == 1 && (MEDIA_ENABLED == 0 || EDGE_CELL_SCALING_MODE != 1)\n        // this only works well for vertically elongated cells\n        float neighborXAvgOffset = (abs(cellCoords.x - fetchAspectCellCoords(neighborsTexData(neighborsPosition + 3u)).x) + abs(cellCoords.x - fetchAspectCellCoords(neighborsTexData(neighborsPosition + 4u)).x)) * 0.5;\n        cellScale = neighborXAvgOffset / 2.;\n        #if EDGE_CELL_SCALING_BORDER_THICKNESS == 1\n            borderThicknessScale = cellScale;\n        #endif\n        #if EDGE_CELL_SCALING_BORDER_SMOOTHNESS == 1\n            borderSmoothnessScale = cellScale * 10.;\n        #endif\n        #if EDGE_CELL_SCALING_BORDER_ROUNDNESS == 1\n            borderRoundnessScale = cellScale;\n        #endif\n    #endif\n\n    float borderThickness = fBorderThicknessMod * EDGE_BORDER_THICKNESS_BASE * borderThicknessScale * resolutionScale * (numCellsScale * 0.5 + 0.5);\n//    #if defined(EDGE_BORDER_THICKNESS_MIN) && defined(EDGE_BORDER_THICKNESS_MAX)\n//        borderThickness = clamp(borderThickness, EDGE_BORDER_THICKNESS_MIN * resolutionScale * numCellsScale, EDGE_BORDER_THICKNESS_MAX * resolutionScale * numCellsScale);\n//    #endif\n\n    float borderSmoothness = fBorderSmoothnessMod * EDGE_BORDER_SMOOTHNESS_BASE * borderSmoothnessScale / (numCellsScale * 0.125 + 0.875);\n//    #if defined(EDGE_BORDER_SMOOTHNESS_MIN) && defined(EDGE_BORDER_SMOOTHNESS_MAX)\n//        borderSmoothness = clamp(borderSmoothness, EDGE_BORDER_SMOOTHNESS_MIN * resolutionScale * numCellsScale, EDGE_BORDER_SMOOTHNESS_MAX * resolutionScale * numCellsScale);\n//    #endif\n\n    float edgeStepStart = (1. - borderSmoothness) * borderThickness;\n    float edgeStepEnd = borderThickness;\n\n    float borderRoundness = EDGE_BORDER_ROUNDNESS_BASE * cheapSqrt(borderRoundnessScale) * fBorderRoundnessMod * resolutionScale;\n//    #if defined(EDGE_BORDER_ROUNDNESS_MIN) && defined(EDGE_BORDER_ROUNDNESS_MAX)\n//        borderRoundness = clamp(borderRoundness, EDGE_BORDER_ROUNDNESS_MIN * fBorderRoundnessMod * resolutionScale, EDGE_BORDER_ROUNDNESS_MAX * fBorderRoundnessMod * resolutionScale);\n//    #endif\n\n    vec2 mediaUv;\n    #if MEDIA_ENABLED == 1\n        vec4 mediaBbox = calcMediaBbox(index, cellCoords, bulgeFactor, mediaBulgeFactor, edgeStepStart*2., mediaWeightOffsetScale);\n        mediaUv = calcMediaUv(mediaBbox, index, mediaBulgeFactor);\n    #endif\n\n    float weight;\n    float weightOffset;\n    #if WEIGHTED_DIST == 1 || POST_UNWEIGHTED_EFFECT == 1\n        weight = weightTexData(index);\n        weightOffset = weightOffsetScale * weight;\n    #endif\n\n    vec2 edge = vec2(0.1);\n    calcEdge(indices, indices2, cellCoords.xy, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, bulgeFactor);\n    float edgeStep = smoothstep(edgeStepStart, edgeStepEnd, edge.x);\n\n    return Plot(indices, indices2, edge, edgeStep, mediaUv, cellScale, weight, bulgeFactor, mediaBulgeFactor, debugFlag);\n}\n\n#if EDGES_VISIBLE == 1\nvoid edgesColor(inout vec3 c, inout float a, in Plot plot) {\n    if (!bDrawEdges) return;\n\n    #if TRANSPARENCY == 1\n        a = mix(1., 0., plot.edgeStep);\n    #else\n        c = mix(fBaseColor, c, plot.edgeStep);\n    #endif\n}\n#endif\n\nvoid postEffectsColor(inout vec3 c, inout float a, in Plot plot) {\n    #if MEDIA_GRAYSCALE != 0\n        c = toGrayscale(c, float(MEDIA_GRAYSCALE) / 100.);\n    #endif\n\n    #if POST_UNWEIGHTED_EFFECT == 1\n        if (fUnweightedEffectMod > 0.) {\n            float mod = fUnweightedEffectMod * (1. - plot.weight);\n            c = mix(c, fBaseColor, (1. - POST_UNWEIGHTED_MOD_OPACITY) * mod);\n            c = toGrayscale(c, POST_UNWEIGHTED_MOD_GRAYSCALE * mod);\n        }\n    #endif\n}\n\nvoid colorOutput(in vec3 c, in float a, in Plot plot) {\n    voroIndexBufferColor = uintBitsToFloat(plot.indices + 1u);\n    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1\n        voroIndexBuffer2Color = uintBitsToFloat(plot.indices2 + 1u);\n    #endif\n    outputColor = vec4(c, a);\n    if (bVoroEdgeBufferOutput) {\n        #ifdef VORO_EDGE_BUFFER_COLOR\n            VORO_EDGE_BUFFER_COLOR;\n        #else\n            voroEdgeBufferColor.rgb = vec3(plot.edge, plot.cellScale);\n        #endif\n    }\n}\n\nvoid main() {\n    initGlobals();\n    Plot plot = plot();\n\n    vec3 c;\n    float a = 1.;\n    #if MEDIA_ENABLED == 1 && MEDIA_HIDDEN == 0\n        mediaColor(c, a, plot);\n        postEffectsColor(c, a, plot);\n    #else\n        randomCellColor(c, a, plot);\n    #endif\n    #if EDGES_VISIBLE == 1\n        edgesColor(c, a, plot);\n    #endif\n    colorOutput(c, a, plot);\n}\n";

  // scripts/wave-voroforce.js
  var DEFAULT_CELL_COUNT = 5e4;
  var MAX_MEDIA_ITEMS = 512;
  var TILE_WIDTH = 96;
  var TILE_HEIGHT = 144;
  var VIRTUAL_COLS = 9;
  var VIRTUAL_ROWS = 6;
  var VIRTUAL_LAYERS = 50;
  var VIRTUAL_MEDIA_LAYER_CAPACITY = VIRTUAL_COLS * VIRTUAL_ROWS;
  var REAL_MEDIA_LAYERS = Math.ceil(DEFAULT_CELL_COUNT / VIRTUAL_MEDIA_LAYER_CAPACITY);
  var WAVE_MODE_PREVIEW = "preview";
  var WAVE_MODE_SELECT = "select";
  var posterImageCache = /* @__PURE__ */ new Map();
  var waveVisualModes = {
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
      fNoiseCenterOffsetMod: 1
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
      fNoiseCenterOffsetMod: 0
    }
  };
  var previewForceConfig = {
    parameters: {
      alpha: 0.15,
      velocityDecay: 0.7,
      velocityDecayBase: 0.7,
      velocityDecayTransitionEnterMode: 0.9
    },
    forces: {
      type: "omni",
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
        v1RowLevelAdjacencyThreshold: 6
      },
      breathing: {
        enabled: true
      },
      push: {
        strength: 0.1,
        yFactor: 2.5,
        alignmentMaxLevelsX: 40,
        centerXStretchMod: 0.4,
        speedFactor: 1
      },
      lattice: {
        strength: 0.8,
        yFactor: 3.75,
        xFactor: 1,
        maxLevelsFromPrimary: 30
      },
      origin: {
        strength: 0.8,
        yFactor: 1.5
      }
    }
  };
  var selectForceConfig = {
    parameters: {
      alpha: 0.15,
      velocityDecay: 0.8,
      velocityDecayBase: 0.8,
      velocityDecayTransitionEnterMode: 0.8
    },
    forces: {
      type: "omni",
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
        v2RowLevelAdjacencyThreshold: 18
      },
      breathing: {
        enabled: false
      },
      push: {
        strength: 0.05,
        selector: "focused",
        yFactor: 1.5
      },
      lattice: {
        strength: 1,
        yFactor: 1.5,
        xFactor: 1,
        maxLevelsFromPrimary: 50
      },
      origin: {
        strength: 0.1,
        latticeScale: 3
      }
    }
  };
  function collectReleaseItems(releaseNodes) {
    return Array.from(releaseNodes || []).map((node, index) => {
      const img = node.querySelector("img");
      const src = img?.currentSrc || img?.src || "";
      return {
        index: node.getAttribute("data-index") || String(index),
        href: node.getAttribute("href") || "#",
        src,
        label: img?.alt || ""
      };
    }).filter((item) => item.src);
  }
  function cellToMediaIndex(cellIndex, count) {
    if (count <= 1) return 0;
    let hash = cellIndex + 1;
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 2146121005);
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 2221713035);
    hash ^= hash >>> 16;
    return Math.abs(hash) % count;
  }
  function drawCoverToPoster(ctx, image, dx = 0, dy = 0) {
    const sourceRatio = image.naturalWidth / Math.max(1, image.naturalHeight);
    const targetRatio = TILE_WIDTH / TILE_HEIGHT;
    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    if (sourceRatio > targetRatio) {
      sw = image.naturalHeight * targetRatio;
      sx = (image.naturalWidth - sw) * 0.5;
    } else {
      sh = image.naturalWidth / targetRatio;
      sy = (image.naturalHeight - sh) * 0.5;
    }
    ctx.fillStyle = "#050505";
    ctx.fillRect(dx, dy, TILE_WIDTH, TILE_HEIGHT);
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, TILE_WIDTH, TILE_HEIGHT);
    const gradient = ctx.createLinearGradient(0, dy, 0, dy + TILE_HEIGHT);
    gradient.addColorStop(0, "rgba(255,255,255,0.08)");
    gradient.addColorStop(0.46, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.24)");
    ctx.fillStyle = gradient;
    ctx.fillRect(dx, dy, TILE_WIDTH, TILE_HEIGHT);
  }
  function cellToReleaseItem(cellIndex, items) {
    return items[cellToMediaIndex(cellIndex, items.length)];
  }
  async function loadPosterImage(src) {
    if (posterImageCache.has(src)) return posterImageCache.get(src);
    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    const result = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => {
        posterImageCache.delete(src);
        reject(new Error(`Failed to load cover: ${src}`));
      };
      image.src = src;
      if (image.complete) {
        if (image.naturalWidth) resolve(image);
        else image.onerror();
      }
    });
    posterImageCache.set(src, result);
    return result;
  }
  async function createPosterAtlas(layerIndex, items) {
    const canvas = document.createElement("canvas");
    canvas.width = VIRTUAL_COLS * TILE_WIDTH;
    canvas.height = VIRTUAL_ROWS * TILE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const firstCellId = layerIndex * VIRTUAL_MEDIA_LAYER_CAPACITY;
    const images = await Promise.all(
      Array.from({ length: VIRTUAL_MEDIA_LAYER_CAPACITY }, async (_, tileIndex) => {
        const item = cellToReleaseItem(firstCellId + tileIndex, items);
        return item?.src ? loadPosterImage(item.src) : null;
      })
    );
    images.forEach((image, tileIndex) => {
      if (!image) return;
      const col = tileIndex % VIRTUAL_COLS;
      const row = Math.floor(tileIndex / VIRTUAL_COLS);
      drawCoverToPoster(ctx, image, col * TILE_WIDTH, row * TILE_HEIGHT);
    });
    return canvas;
  }
  function createConfig(items, resolvePosterAtlas) {
    const mediaItems = items.slice(0, MAX_MEDIA_ITEMS);
    const cellCount = DEFAULT_CELL_COUNT;
    return {
      cells: cellCount,
      multiThreading: {
        enabled: false,
        renderInParallel: false
      },
      ticker: {
        mode: "auto"
      },
      controls: {
        autoFocusCenter: {
          enabled: true,
          random: false
        },
        maxSpeed: 10,
        ease: 0.15,
        easePinned: 0.15,
        zoom: {
          enabled: true,
          min: 1,
          max: 1.5
        },
        freezeOnShake: {
          enabled: false
        },
        freezeOnJolt: {
          enabled: false
        }
      },
      lattice: {
        enabled: true,
        aspect: TILE_WIDTH / TILE_HEIGHT,
        targetCellSizeViewportPercentage: 0.075
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
            layerSrcFormat: "",
            type: "compressed-grid"
          },
          {
            cols: 90,
            rows: 60,
            width: 4,
            height: 4,
            layers: 10,
            layerSrcFormat: "",
            type: "compressed-grid"
          },
          {
            cols: 18,
            rows: 12,
            width: 4,
            height: 4,
            layers: 241,
            layerSrcFormat: "",
            type: "compressed-grid"
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
            type: "uncompressed-single"
          }
        ]
      },
      simulation: {
        steps: {
          neighbors: {
            levels: 1
          },
          force: {
            ...previewForceConfig
          }
        },
        forceStepModeConfigs: {
          [WAVE_MODE_PREVIEW]: previewForceConfig,
          [WAVE_MODE_SELECT]: selectForceConfig
        }
      },
      display: {
        renderer: {
          alpha: true,
          premultipliedAlpha: false,
          antialias: false,
          backgroundColor: "#000000ff"
        },
        scene: {
          post: {
            // The reference does not use the depth post-process. It bends the
            // whole viewport and was the source of the oversized, warped tiles.
            enabled: false,
            fragmentShader: void 0,
            uniforms: {}
          },
          main: {
            fragmentShader: main_default,
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
              fNoiseCenterOffsetMod: { value: 1 }
            }
          }
        }
      }
    };
  }
  function applyWaveMode(instance, mode) {
    if (!instance) return;
    const isSelect = mode === WAVE_MODE_SELECT;
    const forceConfig = isSelect ? selectForceConfig : previewForceConfig;
    const controlsConfig = isSelect ? {
      maxSpeed: 4,
      ease: 0.1,
      easePinned: 0.25,
      freezeOnShake: { enabled: false },
      freezeOnJolt: { enabled: false },
      zoom: { enabled: true, min: 1, max: 1.01 }
    } : {
      autoFocusCenter: {
        enabled: true,
        random: false
      },
      maxSpeed: 10,
      ease: 0.15,
      easePinned: 0.15,
      zoom: { enabled: true, min: 1, max: 1.5 },
      freezeOnShake: { enabled: false },
      freezeOnJolt: { enabled: false }
    };
    instance.controls?.updateConfig?.(controlsConfig);
    instance.simulation?.updateForceStepConfig?.(forceConfig);
    const uniforms = instance.display?.scene?.mainProgram?.uniforms;
    const visualConfig = waveVisualModes[mode] || waveVisualModes[WAVE_MODE_PREVIEW];
    if (uniforms) {
      Object.entries(visualConfig).forEach(([name, value]) => {
        if (uniforms[name]) uniforms[name].value = value;
      });
    }
  }
  function createWaveVoroforceScene(options) {
    const { container, releaseNodes } = options || {};
    if (!container) return null;
    const items = collectReleaseItems(releaseNodes);
    if (!items.length) return null;
    const prepared = items.slice(0, MAX_MEDIA_ITEMS);
    const posterAtlasCache = /* @__PURE__ */ new Map();
    const resolvePosterAtlas = (layerIndex) => {
      if (!posterAtlasCache.has(layerIndex)) {
        while (posterAtlasCache.size >= VIRTUAL_LAYERS) {
          posterAtlasCache.delete(posterAtlasCache.keys().next().value);
        }
        posterAtlasCache.set(layerIndex, createPosterAtlas(layerIndex, prepared));
      }
      return posterAtlasCache.get(layerIndex);
    };
    const host = document.createElement("div");
    host.className = "canvas-space canvas-space--cards canvas-space--voroforce";
    host.setAttribute("aria-hidden", "true");
    host.dataset.waveEngine = "mounting";
    container.prepend(host);
    const caption = document.createElement("section");
    caption.className = "wave-caption";
    caption.setAttribute("aria-live", "polite");
    caption.hidden = true;
    const captionArtist = document.createElement("p");
    const captionTitle = document.createElement("h2");
    caption.append(captionArtist, captionTitle);
    container.append(caption);
    const instance = voroforce(host, createConfig(prepared, resolvePosterAtlas));
    host.dataset.waveEngine = "ready";
    host.dataset.waveMode = WAVE_MODE_PREVIEW;
    host.dataset.waveCells = String(instance.cells?.length || 0);
    applyWaveMode(instance, WAVE_MODE_PREVIEW);
    instance.loader?.addEventListener?.("mediaLayerLoaded", () => {
      host.dataset.waveLoaded = String(instance.loader?.loadedIndex || 0);
    });
    instance.loader?.addEventListener?.("idle", () => {
      host.dataset.waveIdle = "true";
    });
    if (typeof window !== "undefined") {
      window.__bassfunkWaveVoroforceInstance = instance;
    }
    const controls = instance.controls;
    const selectHandler = (event) => {
      const cell = event?.cell;
      if (!cell) {
        host.dataset.waveMode = WAVE_MODE_PREVIEW;
        applyWaveMode(instance, WAVE_MODE_PREVIEW);
        return;
      }
      host.dataset.waveMode = WAVE_MODE_SELECT;
      applyWaveMode(instance, WAVE_MODE_SELECT);
      const item = cellToReleaseItem(cell.id, prepared) || prepared[cell.index % prepared.length];
      if (item) {
        const [artist, ...title] = item.label.split(" - ");
        captionArtist.textContent = artist || "Now selected";
        captionTitle.textContent = title.join(" - ") || item.label || "Untitled release";
        caption.hidden = false;
      }
    };
    controls?.listen?.("selected", selectHandler);
    const clickHandler = (event) => {
      if (!controls?.getCellIndices || controls.pointer?.dragging) return;
      const position = { x: event.clientX, y: event.clientY };
      controls.getCellIndices(position, (cellIndex) => {
        if (cellIndex === void 0) return;
        controls.assignPointer?.({ ...position, index: cellIndex });
        controls.focusCell?.(cellIndex);
        controls.selectCell?.(cellIndex);
      });
    };
    host.addEventListener("click", clickHandler);
    return {
      resize() {
        instance.resize?.();
      },
      destroy() {
        controls?.unlisten?.("selected", selectHandler);
        host.removeEventListener("click", clickHandler);
        instance.dispose?.();
        host.remove();
        caption.remove();
      },
      get instance() {
        return instance;
      }
    };
  }
  if (typeof window !== "undefined") {
    window.BassfunkWaveVoroforce = {
      createWaveVoroforceScene
    };
    window.createWaveVoroforceScene = createWaveVoroforceScene;
  }
  return __toCommonJS(wave_voroforce_exports);
})();
