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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var umap_1 = require("../src/umap");
var utils = __importStar(require("../src/utils"));
var test_data_1 = require("./test_data");
var prando_1 = __importDefault(require("prando"));
describe('UMAP', function () {
    var random;
    var UNSUPERVISED_CLUSTER_RATIO = 0.15;
    var SUPERVISED_CLUSTER_RATIO = 0.042;
    beforeEach(function () {
        var prng = new prando_1.default(42);
        random = function () { return prng.next(); };
    });
    test('UMAP fit 2d synchronous method', function () {
        var umap = new umap_1.UMAP({ random: random, nComponents: 2 });
        var embedding = umap.fit(test_data_1.testData);
        expect(embedding).toEqual(test_data_1.testResults2D);
        checkClusters(embedding, test_data_1.testLabels, UNSUPERVISED_CLUSTER_RATIO);
    });
    test('UMAP fit 3d synchronous method', function () {
        var umap = new umap_1.UMAP({ random: random, nComponents: 3 });
        var embedding = umap.fit(test_data_1.testData);
        expect(embedding).toEqual(test_data_1.testResults3D);
        checkClusters(embedding, test_data_1.testLabels, UNSUPERVISED_CLUSTER_RATIO);
    });
    test('UMAP fitAsync method', function () { return __awaiter(void 0, void 0, void 0, function () {
        var umap, nEpochs, embedding;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    umap = new umap_1.UMAP({ random: random });
                    nEpochs = 0;
                    return [4, umap.fitAsync(test_data_1.testData, function () {
                            nEpochs += 1;
                        })];
                case 1:
                    embedding = _a.sent();
                    expect(embedding).toEqual(test_data_1.testResults2D);
                    expect(nEpochs).toEqual(500);
                    return [2];
            }
        });
    }); });
    test('UMAP step method', function () {
        var umap = new umap_1.UMAP({ random: random });
        var nEpochs = umap.initializeFit(test_data_1.testData);
        for (var i = 0; i < nEpochs; i++) {
            umap.step();
        }
        var embedding = umap.getEmbedding();
        expect(embedding).toEqual(test_data_1.testResults2D);
        expect(nEpochs).toEqual(500);
    });
    test('specifies a number of epochs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var nEpochs, umap, nEpochsComputed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    nEpochs = 200;
                    umap = new umap_1.UMAP({ random: random, nEpochs: nEpochs });
                    nEpochsComputed = 0;
                    return [4, umap.fitAsync(test_data_1.testData, function () {
                            nEpochsComputed += 1;
                        })];
                case 1:
                    _a.sent();
                    expect(nEpochsComputed).toEqual(nEpochs);
                    return [2];
            }
        });
    }); });
    test('finds n nearest neighbors', function () {
        var nNeighbors = 10;
        var umap = new umap_1.UMAP({ random: random, nNeighbors: nNeighbors });
        var knn = umap['nearestNeighbors'](test_data_1.testData);
        expect(knn.knnDistances.length).toBe(test_data_1.testData.length);
        expect(knn.knnIndices.length).toBe(test_data_1.testData.length);
        expect(knn.knnDistances[0].length).toBe(nNeighbors);
        expect(knn.knnIndices[0].length).toBe(nNeighbors);
    });
    test('can be initialized with precomputed nearest neighbors', function () {
        var knnUMAP = new umap_1.UMAP({ random: random });
        var _a = knnUMAP['nearestNeighbors'](test_data_1.testData), knnIndices = _a.knnIndices, knnDistances = _a.knnDistances;
        var umap = new umap_1.UMAP({ random: random });
        umap.setPrecomputedKNN(knnIndices, knnDistances);
        jest.spyOn(umap, 'nearestNeighbors');
        umap.fit(test_data_1.testData);
        expect(umap['nearestNeighbors']).toHaveBeenCalledTimes(0);
    });
    test('supervised projection', function () {
        var umap = new umap_1.UMAP({ random: random, nComponents: 2 });
        umap.setSupervisedProjection(test_data_1.testLabels);
        var embedding = umap.fit(test_data_1.testData);
        expect(embedding.length).toEqual(test_data_1.testResults2D.length);
        checkClusters(embedding, test_data_1.testLabels, SUPERVISED_CLUSTER_RATIO);
    });
    test('non-categorical supervised projection is not implemented', function () {
        var umap = new umap_1.UMAP({ random: random, nComponents: 2 });
        var targetMetric = "l1";
        umap.setSupervisedProjection(test_data_1.testLabels, { targetMetric: targetMetric });
        var embedding = umap.fit(test_data_1.testData);
        expect(embedding).toEqual(test_data_1.testResults2D);
    });
    test('finds AB params using levenberg-marquardt', function () {
        var minDist = 0.1;
        var spread = 1.0;
        var a = 1.5769434603113077;
        var b = 0.8950608779109733;
        var epsilon = 0.01;
        var params = (0, umap_1.findABParams)(spread, minDist);
        var diff = function (x, y) { return Math.abs(x - y); };
        expect(diff(params.a, a)).toBeLessThanOrEqual(epsilon);
        expect(diff(params.b, b)).toBeLessThanOrEqual(epsilon);
    });
    test('transforms an additional point after fitting', function () {
        var umap = new umap_1.UMAP({ random: random, nComponents: 2 });
        var embedding = umap.fit(test_data_1.testData);
        var additional = test_data_1.additionalData[0];
        var transformed = umap.transform([additional]);
        var nearestIndex = getNearestNeighborIndex(embedding, transformed[0]);
        var nearestLabel = test_data_1.testLabels[nearestIndex];
        expect(nearestLabel).toEqual(test_data_1.additionalLabels[3]);
    });
    test('transforms additional points after fitting', function () {
        var umap = new umap_1.UMAP({ random: random, nComponents: 2 });
        var embedding = umap.fit(test_data_1.testData);
        var transformed = umap.transform(test_data_1.additionalData);
        for (var i = 0; i < transformed.length; i++) {
            var nearestIndex = getNearestNeighborIndex(embedding, transformed[i]);
            var nearestLabel = test_data_1.testLabels[nearestIndex];
            expect(nearestLabel).toEqual(test_data_1.additionalLabels[i]);
        }
    });
    test('Allows a custom distance function to be used', function () {
        var nInvocations = 0;
        var manhattanDistance = function (a, b) {
            nInvocations += 1;
            var distance = 0;
            for (var i = 0; i < a.length; i++) {
                distance += Math.abs(a[i] - b[i]);
            }
            return distance;
        };
        var umap = new umap_1.UMAP({
            random: random,
            nComponents: 2,
            distanceFn: manhattanDistance,
        });
        umap.fit(test_data_1.testData);
        expect(nInvocations).toBeGreaterThan(0);
    });
    test('initializeFit throws helpful error if not enough data', function () {
        var umap = new umap_1.UMAP({ random: random });
        var smallData = test_data_1.testData.slice(0, 15);
        expect(function () { return umap.initializeFit(smallData); }).toThrow(/Not enough data points/);
    });
});
function computeMeanDistances(vectors) {
    return vectors.map(function (vector) {
        return utils.mean(vectors.map(function (other) {
            return (0, umap_1.euclidean)(vector, other);
        }));
    });
}
function checkClusters(embeddings, labels, expectedClusterRatio) {
    var e_1, _a;
    var distances = computeMeanDistances(embeddings);
    var overallMeanDistance = utils.mean(distances);
    var embeddingsByLabel = new Map();
    for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        var embedding = embeddings[i];
        var group = embeddingsByLabel.get(label) || [];
        group.push(embedding);
        embeddingsByLabel.set(label, group);
    }
    var totalIntraclusterDistance = 0;
    try {
        for (var _b = __values(embeddingsByLabel.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var label = _c.value;
            var group = embeddingsByLabel.get(label);
            var distances_1 = computeMeanDistances(group);
            var meanDistance = utils.mean(distances_1);
            totalIntraclusterDistance += meanDistance * group.length;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var meanInterclusterDistance = totalIntraclusterDistance / embeddings.length;
    var clusterRatio = meanInterclusterDistance / overallMeanDistance;
    expect(clusterRatio).toBeLessThan(expectedClusterRatio);
}
function getNearestNeighborIndex(items, otherPoint, distanceFn) {
    if (distanceFn === void 0) { distanceFn = umap_1.euclidean; }
    var nearest = items.reduce(function (result, point, pointIndex) {
        var pointDistance = distanceFn(point, otherPoint);
        if (pointDistance < result.distance) {
            return { index: pointIndex, distance: pointDistance };
        }
        return result;
    }, { index: 0, distance: Infinity });
    return nearest.index;
}
