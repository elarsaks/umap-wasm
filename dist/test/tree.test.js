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
var tree = __importStar(require("../src/tree"));
var test_data_1 = require("./test_data");
var prando_1 = __importDefault(require("prando"));
describe('umap knn tree methods', function () {
    var prando = new prando_1.default(42);
    var random = function () { return prando.next(); };
    test('makeForest method constructs an rpForest', function () {
        var nNeighbors = 15;
        var nTrees = 6;
        var forest = tree.makeForest(test_data_1.testData, nNeighbors, nTrees, random);
        expect(forest.length).toEqual(nTrees);
        expect(forest[0]).toEqual(test_data_1.treeData);
    });
    test('makeLeafArray method flattens indices', function () {
        var nNeighbors = 15;
        var nTrees = 6;
        var forest = tree.makeForest(test_data_1.testData, nNeighbors, nTrees, random);
        var leafArray = tree.makeLeafArray(forest);
        var firstIndices = forest[0].indices;
        expect(leafArray.slice(0, firstIndices.length)).toEqual(firstIndices);
    });
});
