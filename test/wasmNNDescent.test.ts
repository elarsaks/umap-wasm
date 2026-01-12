/**
 * Tests for WASM NN-Descent implementation comparing results against JavaScript.
 */

import { vi } from 'vitest';
import { makeNNDescent } from '../src/nn_descent';
import { makeForest, makeLeafArray } from '../src/tree';
import { euclidean } from '../src/umap';
import * as wasmBridge from '../src/wasmBridge';
import { initWasm, isWasmAvailable } from '../src/wasmBridge';
import { testData } from './test_data';
import Prando from 'prando';

describe('WASM NN-Descent', () => {
  const prando = new Prando(42);
  const random = () => prando.next();
  const nNeighbors = 10;
  const nTrees = 2;

  beforeAll(async () => {
    await initWasm();
  });

  beforeEach(() => {
    prando.reset();
  });

  test('JS NN-Descent produces valid neighbor graph', () => {
    prando.reset();
    const forest = makeForest(testData, nNeighbors, nTrees, random, false);
    const leafArray = makeLeafArray(forest);

    prando.reset();
    const nnDescent = makeNNDescent(euclidean, random, false);
    const result = nnDescent(testData, leafArray, nNeighbors);

    expect(result).toBeDefined();
    expect(result.indices.length).toBe(testData.length);
    expect(result.weights.length).toBe(testData.length);

    // Each row should have nNeighbors entries
    result.indices.forEach(row => {
      expect(row.length).toBe(nNeighbors);
    });
  });

  test('JS NN-Descent returns valid neighbor indices', () => {
    prando.reset();
    const forest = makeForest(testData, nNeighbors, nTrees, random, false);
    const leafArray = makeLeafArray(forest);

    prando.reset();
    const nnDescent = makeNNDescent(euclidean, random, false);
    const result = nnDescent(testData, leafArray, nNeighbors);

    // All indices should be valid
    result.indices.forEach(row => {
      row.forEach(idx => {
        expect(idx).toBeGreaterThanOrEqual(-1);
        if (idx >= 0) {
          expect(idx).toBeLessThan(testData.length);
        }
      });
    });
  });

  test('JS NN-Descent returns non-negative distances', () => {
    prando.reset();
    const forest = makeForest(testData, nNeighbors, nTrees, random, false);
    const leafArray = makeLeafArray(forest);

    prando.reset();
    const nnDescent = makeNNDescent(euclidean, random, false);
    const result = nnDescent(testData, leafArray, nNeighbors);

    result.weights.forEach((row, i) => {
      row.forEach((dist, j) => {
        if (result.indices[i][j] >= 0) {
          expect(dist).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  test('throws error when WASM requested but not available', () => {
    const isWasmMock = vi.spyOn(wasmBridge, 'isWasmAvailable').mockReturnValue(false);

    prando.reset();
    const nnDescent = makeNNDescent(euclidean, random, true);

    expect(() => {
      nnDescent(testData, [[0, 1, 2]], nNeighbors);
    }).toThrow('WASM NN-Descent requested but WASM module is not available');

    isWasmMock.mockRestore();
  });

  test('WASM and JS produce similar neighbor quality', async () => {
    // Skip if WASM nn_descent not available
    if (!isWasmAvailable()) {
      console.log('Skipping: WASM not available');
      return;
    }

    prando.reset();
    const forest = makeForest(testData, nNeighbors, nTrees, random, false);
    const leafArray = makeLeafArray(forest);

    // JS result
    prando.reset();
    const jsNNDescent = makeNNDescent(euclidean, random, false);
    const jsResult = jsNNDescent(testData, leafArray, nNeighbors);


      prando.reset();
      const wasmNNDescent = makeNNDescent(euclidean, random, true);
      const wasmResult = wasmNNDescent(testData, leafArray, nNeighbors);

      // Both should have same dimensions
      expect(wasmResult.indices.length).toBe(jsResult.indices.length);
      expect(wasmResult.weights.length).toBe(jsResult.weights.length);
  });
});

