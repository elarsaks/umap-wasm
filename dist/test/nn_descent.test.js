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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var nnDescent = __importStar(require("../src/nn_descent"));
var umap_1 = require("../src/umap");
var prando_1 = __importDefault(require("prando"));
describe('umap nnDescent methods', function () {
    var prando = new prando_1.default(42);
    var random = function () { return prando.next(); };
    test('returns a nearest neighbors function', function () {
        var nnDescentFn = nnDescent.makeNNDescent(umap_1.euclidean, random);
        expect(nnDescentFn instanceof Function).toBe(true);
    });
    test('returns an initialized nearest neighbors search function', function () {
        var nnSearchFn = nnDescent.makeInitializedNNSearch(umap_1.euclidean);
        expect(nnSearchFn instanceof Function).toBe(true);
    });
    test('returns initialization functions', function () {
        var _a = nnDescent.makeInitializations(umap_1.euclidean), initFromRandom = _a.initFromRandom, initFromTree = _a.initFromTree;
        expect(initFromRandom instanceof Function).toBe(true);
        expect(initFromTree instanceof Function).toBe(true);
    });
});
