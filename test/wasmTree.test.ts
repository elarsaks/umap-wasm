import * as tree from '../src/tree';
import { initWasm, isWasmAvailable } from '../src/wasmBridge';
import { testData } from './test_data';
import Prando from 'prando';

describe('WASM random projection tree', () => {
  // Common test parameters
  const STANDARD_NEIGHBORS = 15;
  const STANDARD_TREES = 3;
  
  const prando = new Prando(42);
  const random = () => prando.next();

  beforeAll(async () => {
    await initWasm();
    if (!isWasmAvailable()) {
      throw new Error('WASM module failed to initialize; tests require WASM');
    }
  });

  test('WASM module can be initialized', () => {
    expect(isWasmAvailable()).toBe(true);
  });

  test('makeForest with WASM creates correct number of trees', () => {
    const nTrees = 6;
    const forest = tree.makeForest(testData, STANDARD_NEIGHBORS, nTrees, random, true);

    expect(forest.length).toEqual(nTrees);
    expect(forest[0]).toBeInstanceOf(tree.FlatTree);
  });

  test('WASM forest has valid tree structure', () => {
    prando.reset();
    const jsForest = tree.makeForest(testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, false);
    
    prando.reset();
    const wasmForest = tree.makeForest(testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, true);

    expect(wasmForest.length).toEqual(jsForest.length);
    
    // Verify all trees have required components
    wasmForest.forEach(tree => {
      expect(tree.hyperplanes.length).toBeGreaterThan(0);
      expect(tree.offsets.length).toBeGreaterThan(0);
      expect(tree.children.length).toBeGreaterThan(0);
      expect(tree.indices.length).toBeGreaterThan(0);
    });
  });

  test('searchFlatTree returns valid indices within bounds', () => {
    prando.reset();
    const forest = tree.makeForest(testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, true);
    const queryPoint = testData[0];
    
    prando.reset();
    const result = tree.searchFlatTree(queryPoint, forest[0], random);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(Math.max(10, STANDARD_NEIGHBORS));
    
    // All indices must be valid
    result.forEach(idx => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(testData.length);
    });
  });

  test('makeLeafArray concatenates tree indices correctly', () => {
    prando.reset();
    const forest = tree.makeForest(testData, STANDARD_NEIGHBORS, STANDARD_TREES, random, true);
    const leafArray = tree.makeLeafArray(forest);

    expect(leafArray).toBeDefined();
    expect(leafArray.length).toBeGreaterThan(0);
    
    // First entries should match first tree's leaf indices
    const firstTreeIndices = forest[0].indices;
    expect(leafArray.slice(0, firstTreeIndices.length)).toEqual(firstTreeIndices);
  });

  test('WASM and JS implementations both produce valid search results', () => {
    const nTrees = 2;
    const queryPoint = testData[5];
    
    // Build JS forest
    prando.reset();
    const jsForest = tree.makeForest(testData, STANDARD_NEIGHBORS, nTrees, random, false);
    
    // Build WASM forest with same seed
    prando.reset();
    const wasmForest = tree.makeForest(testData, STANDARD_NEIGHBORS, nTrees, random, true);

    // Search with both implementations
    prando.reset();
    const jsResults = tree.searchFlatTree(queryPoint, jsForest[0], random);
    
    prando.reset();
    const wasmResults = tree.searchFlatTree(queryPoint, wasmForest[0], random);

    // Both should return valid results with reasonable lengths
    expect(jsResults.length).toBeGreaterThan(0);
    expect(wasmResults.length).toBeGreaterThan(0);
    expect(wasmResults.length).toBeLessThanOrEqual(Math.max(10, STANDARD_NEIGHBORS));
    expect(jsResults.length).toBeLessThanOrEqual(Math.max(10, STANDARD_NEIGHBORS));
  });

  test('FlatTree dispose cleans up WASM resources', () => {
    prando.reset();
    const forest = tree.makeForest(testData, STANDARD_NEIGHBORS, 1, random, true);
    const flatTree = forest[0];
    
    expect(flatTree.getWasmTree()).toBeDefined();
    flatTree.dispose();
    expect(flatTree.getWasmTree()).toBeUndefined();
  });
});

describe('useWasmTree toggle', () => {
  const { UMAP } = require('../src/umap');
  const testData = [[1, 2], [3, 4], [5, 6]];

  test('uses JS tree when useWasmTree is false', () => {
    const umap = new UMAP({ useWasmTree: false, nNeighbors: 2, nEpochs: 5 });

    const embedding = umap.fit(testData);
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(testData.length);

    // Verify JS implementation was used
    const rpForest = (umap as any).rpForest;
    expect(rpForest.length).toBeGreaterThan(0);
    expect(rpForest[0].getWasmTree()).toBeUndefined();
  });

  test('delegates to wasm when useWasmTree is true', async () => {
    await initWasm();
    if (!isWasmAvailable()) {
      throw new Error('WASM module failed to initialize; tests require WASM');
    }

    const umap = new UMAP({ useWasmTree: true, nNeighbors: 2, nEpochs: 5 });
    const embedding = umap.fit(testData);

    // Verify WASM implementation was used
    const rpForest = (umap as any).rpForest;
    expect(rpForest.length).toBeGreaterThan(0);
    expect(rpForest[0].getWasmTree()).toBeDefined();
    expect(embedding).toBeDefined();
  });
});
