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
var utils = __importStar(require("../src/utils"));
var prando_1 = __importDefault(require("prando"));
describe('umap utils', function () {
    var prando = new prando_1.default(42);
    var random = function () { return prando.next(); };
    test('norm function', function () {
        var results = utils.norm([1, 2, 3, 4]);
        expect(results).toEqual(Math.sqrt(30));
    });
    test('empty function', function () {
        var results = utils.empty(3);
        expect(results).toEqual([undefined, undefined, undefined]);
    });
    test('empty function', function () {
        var results = utils.empty(3);
        expect(results).toEqual([undefined, undefined, undefined]);
    });
    test('range function', function () {
        var results = utils.range(3);
        expect(results).toEqual([0, 1, 2]);
    });
    test('filled function', function () {
        var results = utils.filled(3, 5);
        expect(results).toEqual([5, 5, 5]);
    });
    test('zeros function', function () {
        var results = utils.zeros(3);
        expect(results).toEqual([0, 0, 0]);
    });
    test('ones function', function () {
        var results = utils.ones(3);
        expect(results).toEqual([1, 1, 1]);
    });
    test('linear function', function () {
        var results = utils.linear(0, 5, 5);
        expect(results).toEqual([0, 1.25, 2.5, 3.75, 5]);
    });
    test('sum function', function () {
        var results = utils.sum([1, 2, 3]);
        expect(results).toEqual(6);
    });
    test('mean function', function () {
        var results = utils.mean([1, 2, 3]);
        expect(results).toEqual(2);
    });
    test('max function', function () {
        var results = utils.max([1, 3, 2]);
        expect(results).toEqual(3);
    });
    test('max2d function', function () {
        var results = utils.max2d([[1, 2, 3], [4, 5, 6]]);
        expect(results).toEqual(6);
    });
    test('rejection sample', function () {
        var e_1, _a;
        var results = utils.rejectionSample(5, 10, random);
        var entries = new Set();
        try {
            for (var results_1 = __values(results), results_1_1 = results_1.next(); !results_1_1.done; results_1_1 = results_1.next()) {
                var r = results_1_1.value;
                expect(entries.has(r)).toBe(false);
                entries.add(r);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (results_1_1 && !results_1_1.done && (_a = results_1.return)) _a.call(results_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
    test('reshape2d function', function () {
        var input = [1, 2, 3, 4, 5, 6];
        expect(utils.reshape2d(input, 2, 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
        expect(utils.reshape2d(input, 3, 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
        expect(function () { return utils.reshape2d(input, 3, 3); }).toThrow();
    });
});
