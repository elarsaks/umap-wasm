"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWasm = initWasm;
exports.isWasmAvailable = isWasmAvailable;
exports.euclideanWasm = euclideanWasm;
exports.cosineWasm = cosineWasm;
exports.buildRpTreeWasm = buildRpTreeWasm;
exports.searchFlatTreeWasm = searchFlatTreeWasm;
exports.wasmTreeToJs = wasmTreeToJs;
exports.createSparseMatrixWasm = createSparseMatrixWasm;
exports.sparseTransposeWasm = sparseTransposeWasm;
exports.sparseIdentityWasm = sparseIdentityWasm;
exports.sparseAddWasm = sparseAddWasm;
exports.sparseSubtractWasm = sparseSubtractWasm;
exports.sparsePairwiseMultiplyWasm = sparsePairwiseMultiplyWasm;
exports.sparseMaximumWasm = sparseMaximumWasm;
exports.sparseMultiplyScalarWasm = sparseMultiplyScalarWasm;
exports.sparseEliminateZerosWasm = sparseEliminateZerosWasm;
exports.sparseNormalizeWasm = sparseNormalizeWasm;
exports.sparseGetCSRWasm = sparseGetCSRWasm;
exports.wasmSparseMatrixToArray = wasmSparseMatrixToArray;
exports.wasmSparseMatrixGetAll = wasmSparseMatrixGetAll;
var wasmReady = null;
var wasmModule = null;
function initWasm() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (wasmReady)
                return [2, wasmReady];
            wasmReady = (function () { return __awaiter(_this, void 0, void 0, function () {
                var mod;
                return __generator(this, function (_a) {
                    try {
                        mod = require('../wasm/pkg/umap_wasm_core.js');
                        wasmModule = mod;
                        return [2, mod];
                    }
                    catch (err) {
                        wasmReady = null;
                        wasmModule = null;
                        throw new Error("Failed to load WASM module: ".concat(err));
                    }
                    return [2];
                });
            }); })();
            return [2, wasmReady];
        });
    });
}
function isWasmAvailable() {
    return wasmModule !== null;
}
function euclideanWasm(x, y) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    var xa = new Float64Array(x);
    var ya = new Float64Array(y);
    return wasmModule.euclidean(xa, ya);
}
function cosineWasm(x, y) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    var xa = new Float64Array(x);
    var ya = new Float64Array(y);
    return wasmModule.cosine(xa, ya);
}
function buildRpTreeWasm(data, nSamples, dim, leafSize, seed) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    var flatData = new Float64Array(nSamples * dim);
    for (var i = 0; i < nSamples; i++) {
        for (var j = 0; j < dim; j++) {
            flatData[i * dim + j] = data[i][j];
        }
    }
    return wasmModule.build_rp_tree(flatData, nSamples, dim, leafSize, BigInt(seed));
}
function searchFlatTreeWasm(tree, point, seed) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    var pointArray = new Float64Array(point);
    var result = wasmModule.search_flat_tree(tree, pointArray, BigInt(seed));
    return Array.from(result);
}
function wasmTreeToJs(wasmTree) {
    var hyperplanesFlat = Array.from(wasmTree.hyperplanes());
    var offsetsArray = Array.from(wasmTree.offsets());
    var childrenFlat = Array.from(wasmTree.children());
    var indicesFlat = Array.from(wasmTree.indices());
    var dim = wasmTree.dim();
    var nNodes = wasmTree.n_nodes();
    var hyperplanes = [];
    for (var i = 0; i < nNodes; i++) {
        hyperplanes.push(hyperplanesFlat.slice(i * dim, (i + 1) * dim));
    }
    var children = [];
    for (var i = 0; i < nNodes; i++) {
        children.push([childrenFlat[i * 2], childrenFlat[i * 2 + 1]]);
    }
    var maxLeafIdx = 0;
    for (var i = 0; i < childrenFlat.length; i++) {
        var v = childrenFlat[i];
        if (v <= 0) {
            var leafIdx = -v;
            if (leafIdx > maxLeafIdx)
                maxLeafIdx = leafIdx;
        }
    }
    var nLeaves = maxLeafIdx + 1;
    var leafSize = nLeaves > 0 ? Math.floor(indicesFlat.length / nLeaves) : 0;
    var indices = [];
    for (var i = 0; i < nLeaves; i++) {
        var slice = indicesFlat.slice(i * leafSize, (i + 1) * leafSize);
        while (slice.length < leafSize)
            slice.push(-1);
        indices.push(slice);
    }
    return {
        hyperplanes: hyperplanes,
        offsets: offsetsArray,
        children: children,
        indices: indices,
    };
}
function createSparseMatrixWasm(rows, cols, values, nRows, nCols) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    var rowsArray = new Int32Array(rows);
    var colsArray = new Int32Array(cols);
    var valuesArray = new Float64Array(values);
    return new wasmModule.WasmSparseMatrix(rowsArray, colsArray, valuesArray, nRows, nCols);
}
function sparseTransposeWasm(matrix) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_transpose(matrix);
}
function sparseIdentityWasm(size) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_identity(size);
}
function sparseAddWasm(a, b) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_add(a, b);
}
function sparseSubtractWasm(a, b) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_subtract(a, b);
}
function sparsePairwiseMultiplyWasm(a, b) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_pairwise_multiply(a, b);
}
function sparseMaximumWasm(a, b) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_maximum(a, b);
}
function sparseMultiplyScalarWasm(matrix, scalar) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_multiply_scalar(matrix, scalar);
}
function sparseEliminateZerosWasm(matrix) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_eliminate_zeros(matrix);
}
function sparseNormalizeWasm(matrix, normType) {
    if (normType === void 0) { normType = 'l2'; }
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    return wasmModule.sparse_normalize(matrix, normType);
}
function sparseGetCSRWasm(matrix) {
    if (!wasmModule)
        throw new Error('WASM module not initialized');
    var result = Array.from(wasmModule.sparse_get_csr(matrix));
    var nIndices = result[0];
    var nValues = result[1];
    var nIndptr = result[2];
    var indices = result.slice(3, 3 + nIndices);
    var values = result.slice(3 + nIndices, 3 + nIndices + nValues);
    var indptr = result.slice(3 + nIndices + nValues, 3 + nIndices + nValues + nIndptr);
    return { indices: indices, values: values, indptr: indptr };
}
function wasmSparseMatrixToArray(matrix) {
    var flat = Array.from(matrix.to_array());
    var nRows = matrix.n_rows;
    var nCols = matrix.n_cols;
    var result = [];
    for (var i = 0; i < nRows; i++) {
        result.push(flat.slice(i * nCols, (i + 1) * nCols));
    }
    return result;
}
function wasmSparseMatrixGetAll(matrix) {
    var flat = Array.from(matrix.get_all_ordered());
    var entries = [];
    for (var i = 0; i < flat.length; i += 3) {
        entries.push({
            row: flat[i],
            col: flat[i + 1],
            value: flat[i + 2],
        });
    }
    return entries;
}
