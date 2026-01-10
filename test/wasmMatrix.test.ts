/** 
 * Tests for WASM SparseMatrix implementation comparing results against JavaScript.
 */

import {
  SparseMatrix,
  transpose,
  identity,
  pairwiseMultiply,
  add,
  subtract,
  maximum,
  multiplyScalar,
  eliminateZeros,
  normalize,
  NormType,
  getCSR,
} from '../src/matrix';

import * as wasmBridge from '../src/wasmBridge';
import {
  initWasm,
  isWasmAvailable,
  createSparseMatrixWasm,
  sparseTransposeWasm,
  sparseIdentityWasm,
  sparseAddWasm,
  sparseSubtractWasm,
  sparsePairwiseMultiplyWasm,
  sparseMaximumWasm,
  sparseMultiplyScalarWasm,
  sparseEliminateZerosWasm,
  sparseNormalizeWasm,
  sparseGetCSRWasm,
  wasmSparseMatrixToArray,
  wasmSparseMatrixGetAll,
  WasmSparseMatrix,
} from '../src/wasmBridge';

// Helper to compare 2D arrays with floating point tolerance
function expectArraysClose(actual: number[][], expected: number[][], precision = 10) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    expect(actual[i].length).toBe(expected[i].length);
    for (let j = 0; j < actual[i].length; j++) {
      expect(actual[i][j]).toBeCloseTo(expected[i][j], precision);
    }
  }
}

describe('WASM SparseMatrix vs JS SparseMatrix', () => {
  // Common test data
  const testMatrix2x2 = {
    rows: [0, 0, 1, 1],
    cols: [0, 1, 0, 1],
    vals: [1, 2, 3, 4],
    dims: [2, 2] as [number, number],
  };

  beforeAll(async () => {
    await initWasm();
    expect(isWasmAvailable()).toBe(true);
  });

  describe('basic operations', () => {
    test('constructs identical sparse matrix and compares dimensions/values', () => {
      const { rows, cols, vals, dims } = testMatrix2x2;

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      // Compare dimensions
      expect(wasmMatrix.n_rows).toEqual(jsMatrix.nRows);
      expect(wasmMatrix.n_cols).toEqual(jsMatrix.nCols);

      // Compare dense array representation
      expect(wasmSparseMatrixToArray(wasmMatrix)).toEqual(jsMatrix.toArray());

      wasmMatrix.free();
    });

    test('get/set methods produce identical results', () => {
      const { rows, cols, vals, dims } = testMatrix2x2;

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      // Test get
      expect(wasmMatrix.get(0, 1, 0)).toEqual(jsMatrix.get(0, 1));
      expect(wasmMatrix.get(1, 0, 0)).toEqual(jsMatrix.get(1, 0));

      // Test set
      jsMatrix.set(0, 1, 9);
      wasmMatrix.set(0, 1, 9);

      expect(wasmMatrix.get(0, 1, 0)).toEqual(jsMatrix.get(0, 1));
      expect(wasmSparseMatrixToArray(wasmMatrix)).toEqual(jsMatrix.toArray());

      wasmMatrix.free();
    });

    test('getAll returns identical ordered entries', () => {
      const { rows, cols, vals, dims } = testMatrix2x2;

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      const jsEntries = jsMatrix.getAll();
      const wasmEntries = wasmSparseMatrixGetAll(wasmMatrix);

      expect(wasmEntries).toEqual(jsEntries);

      wasmMatrix.free();
    });
  });

  describe('matrix operations', () => {
    let jsA: SparseMatrix;
    let jsB: SparseMatrix;
    let wasmA: WasmSparseMatrix;
    let wasmB: WasmSparseMatrix;

    beforeEach(() => {
      const { rows, cols, vals, dims } = testMatrix2x2;
      jsA = new SparseMatrix(rows, cols, vals, dims);
      jsB = new SparseMatrix(rows, cols, vals, dims);
      wasmA = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);
      wasmB = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);
    });

    afterEach(() => {
      wasmA.free();
      wasmB.free();
    });

    test('transpose produces identical results', () => {
      const jsT = transpose(jsA);
      const wasmT = sparseTransposeWasm(wasmA);

      expect(wasmSparseMatrixToArray(wasmT)).toEqual(jsT.toArray());

      wasmT.free();
    });

    test('identity produces identical results', () => {
      const jsI = identity([3, 3]);
      const wasmI = sparseIdentityWasm(3);

      expect(wasmSparseMatrixToArray(wasmI)).toEqual(jsI.toArray());

      wasmI.free();
    });

    test('pairwise multiply produces identical results', () => {
      const jsResult = pairwiseMultiply(jsA, jsB);
      const wasmResult = sparsePairwiseMultiplyWasm(wasmA, wasmB);

      expect(wasmSparseMatrixToArray(wasmResult)).toEqual(jsResult.toArray());

      wasmResult.free();
    });

    test('add produces identical results', () => {
      const jsResult = add(jsA, jsB);
      const wasmResult = sparseAddWasm(wasmA, wasmB);

      expect(wasmSparseMatrixToArray(wasmResult)).toEqual(jsResult.toArray());

      wasmResult.free();
    });

    test('subtract produces identical results', () => {
      const jsResult = subtract(jsA, jsB);
      const wasmResult = sparseSubtractWasm(wasmA, wasmB);

      expect(wasmSparseMatrixToArray(wasmResult)).toEqual(jsResult.toArray());

      wasmResult.free();
    });

    test('element-wise maximum produces identical results', () => {
      const jsI = multiplyScalar(identity([2, 2]), 8);
      const wasmI = sparseMultiplyScalarWasm(sparseIdentityWasm(2), 8);

      const jsResult = maximum(jsA, jsI);
      const wasmResult = sparseMaximumWasm(wasmA, wasmI);

      expect(wasmSparseMatrixToArray(wasmResult)).toEqual(jsResult.toArray());

      wasmI.free();
      wasmResult.free();
    });

    test('scalar multiply produces identical results', () => {
      const jsResult = multiplyScalar(jsA, 3);
      const wasmResult = sparseMultiplyScalarWasm(wasmA, 3);

      expect(wasmSparseMatrixToArray(wasmResult)).toEqual(jsResult.toArray());

      wasmResult.free();
    });

    test('eliminateZeros produces identical results', () => {
      const rows = [0, 1, 1];
      const cols = [0, 0, 1];
      const vals = [0, 1, 3];
      const dims: [number, number] = [2, 2];

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      const jsResult = eliminateZeros(jsMatrix);
      const wasmResult = sparseEliminateZerosWasm(wasmMatrix);

      expect(wasmSparseMatrixToArray(wasmResult)).toEqual(jsResult.toArray());

      wasmMatrix.free();
      wasmResult.free();
    });
  });

  describe('normalization', () => {
    let jsA: SparseMatrix;
    let wasmA: WasmSparseMatrix;

    beforeEach(() => {
      const rows = [0, 0, 0, 1, 1, 1, 2, 2, 2];
      const cols = [0, 1, 2, 0, 1, 2, 0, 1, 2];
      const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const dims: [number, number] = [3, 3];

      jsA = new SparseMatrix(rows, cols, vals, dims);
      wasmA = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);
    });

    afterEach(() => {
      wasmA.free();
    });

    test.each([
      ['max', NormType.max],
      ['l1', NormType.l1],
      ['l2', NormType.l2],
    ])('%s normalization produces identical results', (normName, normType) => {
      const jsResult = normalize(jsA, normType);
      const wasmResult = sparseNormalizeWasm(wasmA, normName);

      expectArraysClose(wasmSparseMatrixToArray(wasmResult), jsResult.toArray());

      wasmResult.free();
    });
  });

  describe('CSR conversion', () => {
    test('getCSR produces identical results', () => {
      const rows = [0, 0, 0, 1, 1, 1, 2, 2, 2];
      const cols = [0, 1, 2, 0, 1, 2, 0, 1, 2];
      const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const dims: [number, number] = [3, 3];

      const jsA = new SparseMatrix(rows, cols, vals, dims);
      const wasmA = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      const jsCSR = getCSR(jsA);
      const wasmCSR = sparseGetCSRWasm(wasmA);

      expect(wasmCSR.indices).toEqual(jsCSR.indices);
      expect(wasmCSR.values).toEqual(jsCSR.values);
      expect(wasmCSR.indptr).toEqual(jsCSR.indptr);

      wasmA.free();
    });
  });

  describe('edge cases', () => {
    test('handles empty matrix', () => {
      const rows: number[] = [];
      const cols: number[] = [];
      const vals: number[] = [];
      const dims: [number, number] = [3, 3];

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      expect(wasmMatrix.nnz()).toEqual(0);
      expect(wasmSparseMatrixToArray(wasmMatrix)).toEqual(jsMatrix.toArray());

      wasmMatrix.free();
    });

    test('handles single element matrix', () => {
      const rows = [0];
      const cols = [0];
      const vals = [42];
      const dims: [number, number] = [1, 1];

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      expect(wasmMatrix.get(0, 0, 0)).toEqual(jsMatrix.get(0, 0));
      expect(wasmSparseMatrixToArray(wasmMatrix)).toEqual(jsMatrix.toArray());

      wasmMatrix.free();
    });

    test('handles sparse matrix with gaps', () => {
      const rows = [0, 2];
      const cols = [0, 2];
      const vals = [1, 9];
      const dims: [number, number] = [3, 3];

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      expect(wasmSparseMatrixToArray(wasmMatrix)).toEqual(jsMatrix.toArray());
      expect(wasmMatrix.get(1, 1, -1)).toEqual(jsMatrix.get(1, 1, -1));

      wasmMatrix.free();
    });

    test('handles non-square matrices and transpose', () => {
      const rows = [0, 0, 0, 1, 1, 1];
      const cols = [0, 1, 2, 0, 1, 2];
      const vals = [1, 2, 3, 4, 5, 6];
      const dims: [number, number] = [2, 3];

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      // Check original dimensions
      expect(wasmMatrix.n_rows).toEqual(jsMatrix.nRows);
      expect(wasmMatrix.n_cols).toEqual(jsMatrix.nCols);
      expect(wasmSparseMatrixToArray(wasmMatrix)).toEqual(jsMatrix.toArray());

      // Transpose should swap dimensions
      const jsT = transpose(jsMatrix);
      const wasmT = sparseTransposeWasm(wasmMatrix);

      expect(wasmT.n_rows).toEqual(jsT.nRows);
      expect(wasmT.n_cols).toEqual(jsT.nCols);
      expect(wasmSparseMatrixToArray(wasmT)).toEqual(jsT.toArray());

      wasmMatrix.free();
      wasmT.free();
    });

    test('handles large sparse matrix', () => {
      const size = 100;
      const nnz = 500;
      const rows: number[] = [];
      const cols: number[] = [];
      const vals: number[] = [];

      // Simple deterministic RNG for reproducibility
      const rng = (seed: number) => {
        let x = seed;
        return () => {
          x = (x * 1103515245 + 12345) & 0x7fffffff;
          return x;
        };
      };
      const random = rng(12345);

      for (let i = 0; i < nnz; i++) {
        rows.push(random() % size);
        cols.push(random() % size);
        vals.push(random() % 100);
      }

      const dims: [number, number] = [size, size];

      const jsMatrix = new SparseMatrix(rows, cols, vals, dims);
      const wasmMatrix = createSparseMatrixWasm(rows, cols, vals, dims[0], dims[1]);

      expect(wasmSparseMatrixToArray(wasmMatrix)).toEqual(jsMatrix.toArray());

      wasmMatrix.free();
    });
  });
});

describe('useWasmMatrix toggle', () => {
  const { UMAP } = require('../src/umap');
  const testData = [[1, 2], [3, 4], [5, 6]];

  test('uses JS matrix operations when useWasmMatrix is false', () => {
    const umap = new UMAP({ useWasmMatrix: false, nNeighbors: 2, nEpochs: 5 });

    // Run a small fit to ensure nothing throws when wasm disabled
    const embedding = umap.fit(testData);
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(testData.length);
    expect(embedding[0].length).toBe(2); // default nComponents
  });

  test('delegates to wasm when useWasmMatrix is true', async () => {
    // Mock the wasm bridge to assert it is invoked
    const createMatrixMock = jest.spyOn(wasmBridge, 'createSparseMatrixWasm').mockImplementation(() => {
      return {
        free: () => {},
        n_rows: 3,
        n_cols: 3,
        nnz: () => 4,
        get: () => 0,
        set: () => {},
      } as any;
    });
    const isWasmAvailableMock = jest.spyOn(wasmBridge, 'isWasmAvailable').mockImplementation(() => true);
    const sparseAddMock = jest.spyOn(wasmBridge, 'sparseAddWasm').mockImplementation((a, b) => a);
    const sparseSubtractMock = jest.spyOn(wasmBridge, 'sparseSubtractWasm').mockImplementation((a, b) => a);
    const sparseTransposeMock = jest.spyOn(wasmBridge, 'sparseTransposeWasm').mockImplementation((a) => a);
    const sparsePairwiseMultiplyMock = jest.spyOn(wasmBridge, 'sparsePairwiseMultiplyWasm').mockImplementation((a, b) => a);
    const sparseMultiplyScalarMock = jest.spyOn(wasmBridge, 'sparseMultiplyScalarWasm').mockImplementation((a, s) => a);
    const wasmSparseMatrixGetAllMock = jest.spyOn(wasmBridge, 'wasmSparseMatrixGetAll').mockImplementation(() => []);

    const umap = new UMAP({ useWasmMatrix: true, nNeighbors: 2, nEpochs: 5 });

    // Run fit to trigger fuzzySimplicialSet which uses matrix operations
    const embedding = umap.fit(testData);

    // Assert WASM matrix operations were called
    expect(createMatrixMock).toHaveBeenCalled();
    expect(sparseTransposeMock).toHaveBeenCalled();
    expect(embedding).toBeDefined();

    // cleanup mocks
    createMatrixMock.mockRestore();
    isWasmAvailableMock.mockRestore();
    sparseAddMock.mockRestore();
    sparseSubtractMock.mockRestore();
    sparseTransposeMock.mockRestore();
    sparsePairwiseMultiplyMock.mockRestore();
    sparseMultiplyScalarMock.mockRestore();
    wasmSparseMatrixGetAllMock.mockRestore();
  });
});
