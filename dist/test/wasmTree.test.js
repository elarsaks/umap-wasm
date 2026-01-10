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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var tree = __importStar(require("../src/tree"));
var wasmBridge_1 = require("../src/wasmBridge");
var test_data_1 = require("./test_data");
var prando_1 = __importDefault(require("prando"));
describe('WASM random projection tree', function () {
    var STANDARD_NEIGHBORS = 15;
    var STANDARD_TREES = 3;
    var prando = new prando_1.default(42);
    var random = function () { return prando.next(); };
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, (0, wasmBridge_1.initWasm)()];
                case 1:
                    _a.sent();
                    if (!(0, wasmBridge_1.isWasmAvailable)()) {
                        throw new Error('WASM module failed to initialize; tests require WASM');
                    }
                    return [2];
            }
        });
    }); });
    test('WASM module can be initialized', function () {
        expect((0, wasmBridge_1.isWasmAvailable)()).toBe(true);
    });
    test('makeForest with WASM creates correct number of trees', function () {
        var nTrees = 6;
        var forest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, nTrees, random, true);
        expect(forest.length).toEqual(nTrees);
        expect(forest[0]).toBeInstanceOf(tree.FlatTree);
    });
    test('WASM forest has valid tree structure', function () {
        prando.reset();
        var jsForest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, false);
        prando.reset();
        var wasmForest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, true);
        expect(wasmForest.length).toEqual(jsForest.length);
        wasmForest.forEach(function (tree) {
            expect(tree.hyperplanes.length).toBeGreaterThan(0);
            expect(tree.offsets.length).toBeGreaterThan(0);
            expect(tree.children.length).toBeGreaterThan(0);
            expect(tree.indices.length).toBeGreaterThan(0);
        });
    });
    test('searchFlatTree returns valid indices within bounds', function () {
        prando.reset();
        var forest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, true);
        var queryPoint = test_data_1.testData[0];
        prando.reset();
        var result = tree.searchFlatTree(queryPoint, forest[0], random);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(Math.max(10, STANDARD_NEIGHBORS));
        result.forEach(function (idx) {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(test_data_1.testData.length);
        });
    });
    test('makeLeafArray concatenates tree indices correctly', function () {
        prando.reset();
        var forest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, true);
        var leafArray = tree.makeLeafArray(forest);
        expect(leafArray).toBeDefined();
        expect(leafArray.length).toBeGreaterThan(0);
        var firstTreeIndices = forest[0].indices;
        expect(leafArray.slice(0, firstTreeIndices.length)).toEqual(firstTreeIndices);
    });
    test('WASM and JS implementations both produce valid search results', function () {
        var nTrees = 2;
        var queryPoint = test_data_1.testData[5];
        prando.reset();
        var jsForest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, nTrees, random, false);
        prando.reset();
        var wasmForest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, nTrees, random, true);
        prando.reset();
        var jsResults = tree.searchFlatTree(queryPoint, jsForest[0], random);
        prando.reset();
        var wasmResults = tree.searchFlatTree(queryPoint, wasmForest[0], random);
        expect(jsResults.length).toBeGreaterThan(0);
        expect(wasmResults.length).toBeGreaterThan(0);
        expect(wasmResults.length).toBeLessThanOrEqual(Math.max(10, STANDARD_NEIGHBORS));
        expect(jsResults.length).toBeLessThanOrEqual(Math.max(10, STANDARD_NEIGHBORS));
    });
    test('FlatTree dispose cleans up WASM resources', function () {
        prando.reset();
        var forest = tree.makeForest(test_data_1.testData, STANDARD_NEIGHBORS, 1, random, true);
        var flatTree = forest[0];
        expect(flatTree.getWasmTree()).toBeDefined();
        flatTree.dispose();
        expect(flatTree.getWasmTree()).toBeUndefined();
    });
});
describe('useWasmTree toggle', function () {
    var UMAP = require('../src/umap').UMAP;
    var testData = [[1, 2], [3, 4], [5, 6]];
    test('uses JS tree when useWasmTree is false', function () {
        var umap = new UMAP({ useWasmTree: false, nNeighbors: 2, nEpochs: 5 });
        var embedding = umap.fit(testData);
        expect(embedding).toBeDefined();
        expect(embedding.length).toBe(testData.length);
        var rpForest = umap.rpForest;
        expect(rpForest.length).toBeGreaterThan(0);
        expect(rpForest[0].getWasmTree()).toBeUndefined();
    });
    test('delegates to wasm when useWasmTree is true', function () { return __awaiter(void 0, void 0, void 0, function () {
        var umap, embedding, rpForest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, (0, wasmBridge_1.initWasm)()];
                case 1:
                    _a.sent();
                    if (!(0, wasmBridge_1.isWasmAvailable)()) {
                        throw new Error('WASM module failed to initialize; tests require WASM');
                    }
                    umap = new UMAP({ useWasmTree: true, nNeighbors: 2, nEpochs: 5 });
                    embedding = umap.fit(testData);
                    rpForest = umap.rpForest;
                    expect(rpForest.length).toBeGreaterThan(0);
                    expect(rpForest[0].getWasmTree()).toBeDefined();
                    expect(embedding).toBeDefined();
                    return [2];
            }
        });
    }); });
});
