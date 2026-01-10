"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var matrix_1 = require("../src/matrix");
var wasmBridge = __importStar(require("../src/wasmBridge"));
var wasmBridge_1 = require("../src/wasmBridge");
function expectArraysClose(actual, expected, precision) {
    if (precision === void 0) { precision = 10; }
    expect(actual.length).toBe(expected.length);
    for (var i = 0; i < actual.length; i++) {
        expect(actual[i].length).toBe(expected[i].length);
        for (var j = 0; j < actual[i].length; j++) {
            expect(actual[i][j]).toBeCloseTo(expected[i][j], precision);
        }
    }
}
describe('WASM SparseMatrix vs JS SparseMatrix', function () {
    var testMatrix2x2 = {
        rows: [0, 0, 1, 1],
        cols: [0, 1, 0, 1],
        vals: [1, 2, 3, 4],
        dims: [2, 2],
    };
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, (0, wasmBridge_1.initWasm)()];
                case 1:
                    _a.sent();
                    expect((0, wasmBridge_1.isWasmAvailable)()).toBe(true);
                    return [2];
            }
        });
    }); });
    describe('basic operations', function () {
        test('constructs identical sparse matrix and compares dimensions/values', function () {
            var rows = testMatrix2x2.rows, cols = testMatrix2x2.cols, vals = testMatrix2x2.vals, dims = testMatrix2x2.dims;
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            expect(wasmMatrix.n_rows).toEqual(jsMatrix.nRows);
            expect(wasmMatrix.n_cols).toEqual(jsMatrix.nCols);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmMatrix)).toEqual(jsMatrix.toArray());
            wasmMatrix.free();
        });
        test('get/set methods produce identical results', function () {
            var rows = testMatrix2x2.rows, cols = testMatrix2x2.cols, vals = testMatrix2x2.vals, dims = testMatrix2x2.dims;
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            expect(wasmMatrix.get(0, 1, 0)).toEqual(jsMatrix.get(0, 1));
            expect(wasmMatrix.get(1, 0, 0)).toEqual(jsMatrix.get(1, 0));
            jsMatrix.set(0, 1, 9);
            wasmMatrix.set(0, 1, 9);
            expect(wasmMatrix.get(0, 1, 0)).toEqual(jsMatrix.get(0, 1));
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmMatrix)).toEqual(jsMatrix.toArray());
            wasmMatrix.free();
        });
        test('getAll returns identical ordered entries', function () {
            var rows = testMatrix2x2.rows, cols = testMatrix2x2.cols, vals = testMatrix2x2.vals, dims = testMatrix2x2.dims;
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            var jsEntries = jsMatrix.getAll();
            var wasmEntries = (0, wasmBridge_1.wasmSparseMatrixGetAll)(wasmMatrix);
            expect(wasmEntries).toEqual(jsEntries);
            wasmMatrix.free();
        });
    });
    describe('matrix operations', function () {
        var jsA;
        var jsB;
        var wasmA;
        var wasmB;
        beforeEach(function () {
            var rows = testMatrix2x2.rows, cols = testMatrix2x2.cols, vals = testMatrix2x2.vals, dims = testMatrix2x2.dims;
            jsA = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            jsB = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            wasmA = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            wasmB = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
        });
        afterEach(function () {
            wasmA.free();
            wasmB.free();
        });
        test('transpose produces identical results', function () {
            var jsT = (0, matrix_1.transpose)(jsA);
            var wasmT = (0, wasmBridge_1.sparseTransposeWasm)(wasmA);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmT)).toEqual(jsT.toArray());
            wasmT.free();
        });
        test('identity produces identical results', function () {
            var jsI = (0, matrix_1.identity)([3, 3]);
            var wasmI = (0, wasmBridge_1.sparseIdentityWasm)(3);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmI)).toEqual(jsI.toArray());
            wasmI.free();
        });
        test('pairwise multiply produces identical results', function () {
            var jsResult = (0, matrix_1.pairwiseMultiply)(jsA, jsB);
            var wasmResult = (0, wasmBridge_1.sparsePairwiseMultiplyWasm)(wasmA, wasmB);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmResult)).toEqual(jsResult.toArray());
            wasmResult.free();
        });
        test('add produces identical results', function () {
            var jsResult = (0, matrix_1.add)(jsA, jsB);
            var wasmResult = (0, wasmBridge_1.sparseAddWasm)(wasmA, wasmB);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmResult)).toEqual(jsResult.toArray());
            wasmResult.free();
        });
        test('subtract produces identical results', function () {
            var jsResult = (0, matrix_1.subtract)(jsA, jsB);
            var wasmResult = (0, wasmBridge_1.sparseSubtractWasm)(wasmA, wasmB);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmResult)).toEqual(jsResult.toArray());
            wasmResult.free();
        });
        test('element-wise maximum produces identical results', function () {
            var jsI = (0, matrix_1.multiplyScalar)((0, matrix_1.identity)([2, 2]), 8);
            var wasmI = (0, wasmBridge_1.sparseMultiplyScalarWasm)((0, wasmBridge_1.sparseIdentityWasm)(2), 8);
            var jsResult = (0, matrix_1.maximum)(jsA, jsI);
            var wasmResult = (0, wasmBridge_1.sparseMaximumWasm)(wasmA, wasmI);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmResult)).toEqual(jsResult.toArray());
            wasmI.free();
            wasmResult.free();
        });
        test('scalar multiply produces identical results', function () {
            var jsResult = (0, matrix_1.multiplyScalar)(jsA, 3);
            var wasmResult = (0, wasmBridge_1.sparseMultiplyScalarWasm)(wasmA, 3);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmResult)).toEqual(jsResult.toArray());
            wasmResult.free();
        });
        test('eliminateZeros produces identical results', function () {
            var rows = [0, 1, 1];
            var cols = [0, 0, 1];
            var vals = [0, 1, 3];
            var dims = [2, 2];
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            var jsResult = (0, matrix_1.eliminateZeros)(jsMatrix);
            var wasmResult = (0, wasmBridge_1.sparseEliminateZerosWasm)(wasmMatrix);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmResult)).toEqual(jsResult.toArray());
            wasmMatrix.free();
            wasmResult.free();
        });
    });
    describe('normalization', function () {
        var jsA;
        var wasmA;
        beforeEach(function () {
            var rows = [0, 0, 0, 1, 1, 1, 2, 2, 2];
            var cols = [0, 1, 2, 0, 1, 2, 0, 1, 2];
            var vals = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            var dims = [3, 3];
            jsA = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            wasmA = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
        });
        afterEach(function () {
            wasmA.free();
        });
        test.each([
            ['max', "max"],
            ['l1', "l1"],
            ['l2', "l2"],
        ])('%s normalization produces identical results', function (normName, normType) {
            var jsResult = (0, matrix_1.normalize)(jsA, normType);
            var wasmResult = (0, wasmBridge_1.sparseNormalizeWasm)(wasmA, normName);
            expectArraysClose((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmResult), jsResult.toArray());
            wasmResult.free();
        });
    });
    describe('CSR conversion', function () {
        test('getCSR produces identical results', function () {
            var rows = [0, 0, 0, 1, 1, 1, 2, 2, 2];
            var cols = [0, 1, 2, 0, 1, 2, 0, 1, 2];
            var vals = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            var dims = [3, 3];
            var jsA = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmA = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            var jsCSR = (0, matrix_1.getCSR)(jsA);
            var wasmCSR = (0, wasmBridge_1.sparseGetCSRWasm)(wasmA);
            expect(wasmCSR.indices).toEqual(jsCSR.indices);
            expect(wasmCSR.values).toEqual(jsCSR.values);
            expect(wasmCSR.indptr).toEqual(jsCSR.indptr);
            wasmA.free();
        });
    });
    describe('edge cases', function () {
        test('handles empty matrix', function () {
            var rows = [];
            var cols = [];
            var vals = [];
            var dims = [3, 3];
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            expect(wasmMatrix.nnz()).toEqual(0);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmMatrix)).toEqual(jsMatrix.toArray());
            wasmMatrix.free();
        });
        test('handles single element matrix', function () {
            var rows = [0];
            var cols = [0];
            var vals = [42];
            var dims = [1, 1];
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            expect(wasmMatrix.get(0, 0, 0)).toEqual(jsMatrix.get(0, 0));
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmMatrix)).toEqual(jsMatrix.toArray());
            wasmMatrix.free();
        });
        test('handles sparse matrix with gaps', function () {
            var rows = [0, 2];
            var cols = [0, 2];
            var vals = [1, 9];
            var dims = [3, 3];
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmMatrix)).toEqual(jsMatrix.toArray());
            expect(wasmMatrix.get(1, 1, -1)).toEqual(jsMatrix.get(1, 1, -1));
            wasmMatrix.free();
        });
        test('handles non-square matrices and transpose', function () {
            var rows = [0, 0, 0, 1, 1, 1];
            var cols = [0, 1, 2, 0, 1, 2];
            var vals = [1, 2, 3, 4, 5, 6];
            var dims = [2, 3];
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            expect(wasmMatrix.n_rows).toEqual(jsMatrix.nRows);
            expect(wasmMatrix.n_cols).toEqual(jsMatrix.nCols);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmMatrix)).toEqual(jsMatrix.toArray());
            var jsT = (0, matrix_1.transpose)(jsMatrix);
            var wasmT = (0, wasmBridge_1.sparseTransposeWasm)(wasmMatrix);
            expect(wasmT.n_rows).toEqual(jsT.nRows);
            expect(wasmT.n_cols).toEqual(jsT.nCols);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmT)).toEqual(jsT.toArray());
            wasmMatrix.free();
            wasmT.free();
        });
        test('handles large sparse matrix', function () {
            var size = 100;
            var nnz = 500;
            var rows = [];
            var cols = [];
            var vals = [];
            var rng = function (seed) {
                var x = seed;
                return function () {
                    x = (x * 1103515245 + 12345) & 0x7fffffff;
                    return x;
                };
            };
            var random = rng(12345);
            for (var i = 0; i < nnz; i++) {
                rows.push(random() % size);
                cols.push(random() % size);
                vals.push(random() % 100);
            }
            var dims = [size, size];
            var jsMatrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
            var wasmMatrix = (0, wasmBridge_1.createSparseMatrixWasm)(rows, cols, vals, dims[0], dims[1]);
            expect((0, wasmBridge_1.wasmSparseMatrixToArray)(wasmMatrix)).toEqual(jsMatrix.toArray());
            wasmMatrix.free();
        });
    });
});
describe('useWasmMatrix toggle', function () {
    var UMAP = require('../src/umap').UMAP;
    var testData = [[1, 2], [3, 4], [5, 6]];
    test('uses JS matrix operations when useWasmMatrix is false', function () {
        var umap = new UMAP({ useWasmMatrix: false, nNeighbors: 2, nEpochs: 5 });
        var embedding = umap.fit(testData);
        expect(embedding).toBeDefined();
        expect(embedding.length).toBe(testData.length);
        expect(embedding[0].length).toBe(2);
    });
    test('delegates to wasm when useWasmMatrix is true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var createMatrixMock, isWasmAvailableMock, sparseAddMock, sparseSubtractMock, sparseTransposeMock, sparsePairwiseMultiplyMock, sparseMultiplyScalarMock, wasmSparseMatrixGetAllMock, umap, embedding;
        return __generator(this, function (_a) {
            createMatrixMock = jest.spyOn(wasmBridge, 'createSparseMatrixWasm').mockImplementation(function () {
                return {
                    free: function () { },
                    n_rows: 3,
                    n_cols: 3,
                    nnz: function () { return 4; },
                    get: function () { return 0; },
                    set: function () { },
                };
            });
            isWasmAvailableMock = jest.spyOn(wasmBridge, 'isWasmAvailable').mockImplementation(function () { return true; });
            sparseAddMock = jest.spyOn(wasmBridge, 'sparseAddWasm').mockImplementation(function (a, b) { return a; });
            sparseSubtractMock = jest.spyOn(wasmBridge, 'sparseSubtractWasm').mockImplementation(function (a, b) { return a; });
            sparseTransposeMock = jest.spyOn(wasmBridge, 'sparseTransposeWasm').mockImplementation(function (a) { return a; });
            sparsePairwiseMultiplyMock = jest.spyOn(wasmBridge, 'sparsePairwiseMultiplyWasm').mockImplementation(function (a, b) { return a; });
            sparseMultiplyScalarMock = jest.spyOn(wasmBridge, 'sparseMultiplyScalarWasm').mockImplementation(function (a, s) { return a; });
            wasmSparseMatrixGetAllMock = jest.spyOn(wasmBridge, 'wasmSparseMatrixGetAll').mockImplementation(function () { return []; });
            umap = new UMAP({ useWasmMatrix: true, nNeighbors: 2, nEpochs: 5 });
            embedding = umap.fit(testData);
            expect(createMatrixMock).toHaveBeenCalled();
            expect(sparseTransposeMock).toHaveBeenCalled();
            expect(embedding).toBeDefined();
            createMatrixMock.mockRestore();
            isWasmAvailableMock.mockRestore();
            sparseAddMock.mockRestore();
            sparseSubtractMock.mockRestore();
            sparseTransposeMock.mockRestore();
            sparsePairwiseMultiplyMock.mockRestore();
            sparseMultiplyScalarMock.mockRestore();
            wasmSparseMatrixGetAllMock.mockRestore();
            return [2];
        });
    }); });
});
