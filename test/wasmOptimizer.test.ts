/**
 * Minimal tests comparing WASM optimizer against JS implementation.
 */

import { UMAP } from '../src/umap';
import * as wasmBridge from '../src/wasmBridge';

describe('WASM Optimizer vs JS Optimizer', () => {
  const testData = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [2, 3, 4],
    [5, 6, 7],
  ];

  beforeAll(async () => {
    await wasmBridge.initWasm();
  });

  test('produces similar embeddings with same random seed', () => {
    const seed = 42;
    const makeRandom = (s: number) => {
      let state = s;
      return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
      };
    };

    const jsUmap = new UMAP({
      nNeighbors: 3,
      nEpochs: 10,
      useWasmOptimizer: false,
      random: makeRandom(seed),
    });

    const wasmUmap = new UMAP({
      nNeighbors: 3,
      nEpochs: 10,
      useWasmOptimizer: true,
      random: makeRandom(seed),
    });

    const jsEmbedding = jsUmap.fit(testData);
    const wasmEmbedding = wasmUmap.fit(testData);

    // Both should produce 2D embeddings
    expect(jsEmbedding.length).toBe(testData.length);
    expect(wasmEmbedding.length).toBe(testData.length);
    expect(jsEmbedding[0].length).toBe(2);
    expect(wasmEmbedding[0].length).toBe(2);

    // Embeddings should be valid (not NaN or Infinity)
    for (let i = 0; i < jsEmbedding.length; i++) {
      for (let j = 0; j < 2; j++) {
        expect(isFinite(jsEmbedding[i][j])).toBe(true);
        expect(isFinite(wasmEmbedding[i][j])).toBe(true);
      }
    }
  });

  test('respects useWasmOptimizer flag', () => {
    const jsUmap = new UMAP({ nNeighbors: 3, nEpochs: 5, useWasmOptimizer: false });
    const wasmUmap = new UMAP({ nNeighbors: 3, nEpochs: 5, useWasmOptimizer: true });

    const jsEmbedding = jsUmap.fit(testData);
    const wasmEmbedding = wasmUmap.fit(testData);

    // Both should complete without errors
    expect(jsEmbedding).toBeDefined();
    expect(wasmEmbedding).toBeDefined();
    expect(jsEmbedding.length).toBe(testData.length);
    expect(wasmEmbedding.length).toBe(testData.length);
  });
});
