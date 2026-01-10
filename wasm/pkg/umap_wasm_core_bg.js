let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

/**
 * Compute the cosine distance between two vectors.
 *
 * This function computes the cosine distance as 1 - (dot product / (norm_x * norm_y)).
 * Cosine distance measures the angle between vectors and ranges from 0 (identical direction)
 * to 2 (opposite directions).
 *
 * # Arguments
 * * `x` - First vector as a slice of f64
 * * `y` - Second vector as a slice of f64
 *
 * # Returns
 * The cosine distance as f64
 *
 * # Special Cases
 * * If both vectors have zero norm, returns 0.0
 * * If either vector has zero norm, returns 1.0
 *
 * # Panics
 * Panics if vectors have different lengths
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @returns {number}
 */
export function cosine(x, y) {
    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.cosine(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * Compute the Euclidean distance between two vectors.
 *
 * This function computes the standard L2 distance by summing the squared
 * differences of corresponding elements and returning the square root.
 *
 * # Arguments
 * * `x` - First vector as a slice of f64
 * * `y` - Second vector as a slice of f64
 *
 * # Returns
 * The Euclidean distance as f64
 *
 * # Panics
 * Panics if vectors have different lengths
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @returns {number}
 */
export function euclidean(x, y) {
    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.euclidean(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * Simple helper to ensure the wasm is loaded and working.
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
};
