"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var matrix_1 = require("../src/matrix");
describe('sparse matrix', function () {
    test('constructs a sparse matrix from rows/cols/vals ', function () {
        var rows = [0, 0, 1, 1];
        var cols = [0, 1, 0, 1];
        var vals = [1, 2, 3, 4];
        var dims = [2, 2];
        var matrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        expect(matrix.getRows()).toEqual(rows);
        expect(matrix.getCols()).toEqual(cols);
        expect(matrix.getValues()).toEqual(vals);
        expect(matrix.nRows).toEqual(2);
        expect(matrix.nCols).toEqual(2);
    });
    test('sparse matrix has get / set methods', function () {
        var rows = [0, 0, 1, 1];
        var cols = [0, 1, 0, 1];
        var vals = [1, 2, 3, 4];
        var dims = [2, 2];
        var matrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        expect(matrix.get(0, 1)).toEqual(2);
        matrix.set(0, 1, 9);
        expect(matrix.get(0, 1)).toEqual(9);
    });
    test('sparse matrix has getAll method', function () {
        var rows = [0, 0, 1, 1];
        var cols = [0, 1, 0, 1];
        var vals = [1, 2, 3, 4];
        var dims = [2, 2];
        var matrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        expect(matrix.getAll()).toEqual([
            { row: 0, col: 0, value: 1 },
            { row: 0, col: 1, value: 2 },
            { row: 1, col: 0, value: 3 },
            { row: 1, col: 1, value: 4 },
        ]);
    });
    test('sparse matrix has toArray method', function () {
        var rows = [0, 0, 1, 1];
        var cols = [0, 1, 0, 1];
        var vals = [1, 2, 3, 4];
        var dims = [2, 2];
        var matrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        expect(matrix.toArray()).toEqual([[1, 2], [3, 4]]);
    });
    test('sparse matrix has map method', function () {
        var rows = [0, 0, 1, 1];
        var cols = [0, 1, 0, 1];
        var vals = [1, 2, 3, 4];
        var dims = [2, 2];
        var matrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        var newMatrix = matrix.map(function (value) {
            return value + 1;
        });
        expect(newMatrix.toArray()).toEqual([[2, 3], [4, 5]]);
    });
    test('sparse matrix has forEach', function () {
        var rows = [0, 1];
        var cols = [0, 0];
        var vals = [1, 3];
        var dims = [2, 2];
        var matrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        var entries = [];
        matrix.forEach(function (value, row, col) {
            entries.push([value, row, col]);
        });
        expect(entries).toEqual([[1, 0, 0], [3, 1, 0]]);
    });
});
describe('helper methods', function () {
    var A;
    var B;
    beforeEach(function () {
        var rows = [0, 0, 1, 1];
        var cols = [0, 1, 0, 1];
        var vals = [1, 2, 3, 4];
        var dims = [2, 2];
        A = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        B = new matrix_1.SparseMatrix(rows, cols, vals, dims);
    });
    test('transpose method', function () {
        var T = (0, matrix_1.transpose)(A);
        expect(T.toArray()).toEqual([[1, 3], [2, 4]]);
    });
    test('identity method', function () {
        var I = (0, matrix_1.identity)([2, 2]);
        expect(I.toArray()).toEqual([[1, 0], [0, 1]]);
    });
    test('pairwise multiply method', function () {
        var X = (0, matrix_1.pairwiseMultiply)(A, B);
        expect(X.toArray()).toEqual([[1, 4], [9, 16]]);
    });
    test('add method', function () {
        var X = (0, matrix_1.add)(A, B);
        expect(X.toArray()).toEqual([[2, 4], [6, 8]]);
    });
    test('subtract method', function () {
        var X = (0, matrix_1.subtract)(A, B);
        expect(X.toArray()).toEqual([[0, 0], [0, 0]]);
    });
    test('element-wise maximum method', function () {
        var I = (0, matrix_1.multiplyScalar)((0, matrix_1.identity)([2, 2]), 8);
        var X = (0, matrix_1.maximum)(A, I);
        expect(X.toArray()).toEqual([[8, 2], [3, 8]]);
    });
    test('scalar multiply method', function () {
        var X = (0, matrix_1.multiplyScalar)(A, 3);
        expect(X.toArray()).toEqual([[3, 6], [9, 12]]);
    });
    test('eliminateZeros method', function () {
        var defaultValue = 11;
        var rows = [0, 1, 1];
        var cols = [0, 0, 1];
        var vals = [0, 1, 3];
        var dims = [2, 2];
        var matrix = new matrix_1.SparseMatrix(rows, cols, vals, dims);
        expect(matrix.get(0, 0, defaultValue)).toEqual(0);
        var eliminated = (0, matrix_1.eliminateZeros)(matrix);
        expect(eliminated.getValues()).toEqual([1, 3]);
        expect(eliminated.getRows()).toEqual([1, 1]);
        expect(eliminated.getCols()).toEqual([0, 1]);
        expect(eliminated.get(0, 0, defaultValue)).toEqual(defaultValue);
    });
});
describe('normalize method', function () {
    var A;
    beforeEach(function () {
        var rows = [0, 0, 0, 1, 1, 1, 2, 2, 2];
        var cols = [0, 1, 2, 0, 1, 2, 0, 1, 2];
        var vals = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        var dims = [3, 3];
        A = new matrix_1.SparseMatrix(rows, cols, vals, dims);
    });
    test('max normalization method', function () {
        var expected = [
            [0.3333333333333333, 0.6666666666666666, 1.0],
            [0.6666666666666666, 0.8333333333333334, 1.0],
            [0.7777777777777778, 0.8888888888888888, 1.0],
        ];
        var n = (0, matrix_1.normalize)(A, "max");
        expect(n.toArray()).toEqual(expected);
    });
    test('l1 normalization method', function () {
        var expected = [
            [0.16666666666666666, 0.3333333333333333, 0.5],
            [0.26666666666666666, 0.3333333333333333, 0.4],
            [0.2916666666666667, 0.3333333333333333, 0.375],
        ];
        var n = (0, matrix_1.normalize)(A, "l1");
        expect(n.toArray()).toEqual(expected);
    });
    test('l2 normalization method (default)', function () {
        var expected = [
            [0.2672612419124244, 0.5345224838248488, 0.8017837257372732],
            [0.4558423058385518, 0.5698028822981898, 0.6837634587578277],
            [0.5025707110324167, 0.5743665268941904, 0.6461623427559643],
        ];
        var n = (0, matrix_1.normalize)(A);
        expect(n.toArray()).toEqual(expected);
    });
    test('getCSR function', function () {
        var _a = (0, matrix_1.getCSR)(A), indices = _a.indices, values = _a.values, indptr = _a.indptr;
        expect(indices).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2]);
        expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(indptr).toEqual([0, 3, 6]);
    });
});
