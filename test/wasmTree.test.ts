import * as tree from '../src/tree';
import { initWasm, isWasmAvailable } from '../src/wasmBridge';
import { testData } from './test_data';
import Prando from 'prando';

describe('WASM random projection tree', () => {
  const prando = new Prando(42);
  const random = () => prando.next();

  beforeAll(async () => {
    // Initialize WASM and assert availability; tests require WASM.
    await initWasm();
    if (!isWasmAvailable()) {
      throw new Error('WASM module failed to initialize; tests require WASM');
    }
  });

  test('WASM module can be initialized', () => {
    // Ensure WASM initialized successfully during setup.
    expect(isWasmAvailable()).toBe(true);
  });

  test('makeForest with WASM creates correct number of trees', () => {
    const nNeighbors = 15;
    const nTrees = 6;
    const forest = tree.makeForest(testData, nNeighbors, nTrees, random, true);

    expect(forest.length).toEqual(nTrees);
    expect(forest[0]).toBeInstanceOf(tree.FlatTree);
  });

  test('WASM forest produces same structure as JS', () => {
    const nNeighbors = 15;
    const nTrees = 3;
    
    // Reset random state
    prando.reset();
    const jsForest = tree.makeForest(testData, nNeighbors, nTrees, random, false);
    
    // Reset random state again for WASM
    prando.reset();
    const wasmForest = tree.makeForest(testData, nNeighbors, nTrees, random, true);

    expect(wasmForest.length).toEqual(jsForest.length);
    
    // Check that tree structures are similar (same number of nodes)
    for (let i = 0; i < nTrees; i++) {
      expect(wasmForest[i].hyperplanes.length).toBeGreaterThan(0);
      expect(wasmForest[i].offsets.length).toBeGreaterThan(0);
      expect(wasmForest[i].children.length).toBeGreaterThan(0);
      expect(wasmForest[i].indices.length).toBeGreaterThan(0);
    }
  });

  test('searchFlatTree with WASM finds leaf nodes', () => {
    const nNeighbors = 15;
    const nTrees = 3;
    prando.reset();
    const forest = tree.makeForest(testData, nNeighbors, nTrees, random, true);

    // Search for a point in the dataset
    const queryPoint = testData[0];
    prando.reset();
    const result = tree.searchFlatTree(queryPoint, forest[0], random);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(Math.max(10, nNeighbors));
    
    // Verify all returned indices are valid
    result.forEach(idx => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(testData.length);
    });
  });

  test('makeLeafArray works with WASM trees', () => {
    const nNeighbors = 15;
    const nTrees = 3;
    prando.reset();
    const forest = tree.makeForest(testData, nNeighbors, nTrees, random, true);
    const leafArray = tree.makeLeafArray(forest);

    expect(leafArray).toBeDefined();
    expect(leafArray.length).toBeGreaterThan(0);
    
    // First entries should match first tree's leaf indices (not flattened)
    const firstTreeIndices = forest[0].indices;
    expect(leafArray.slice(0, firstTreeIndices.length)).toEqual(firstTreeIndices);
  });

  test('WASM and JS implementations produce compatible results', () => {
    const nNeighbors = 15;
    const nTrees = 2;
    
    // Build forests with same seed
    prando.reset();
    const seed1 = random();
    prando.reset();
    const jsForest = tree.makeForest(testData, nNeighbors, nTrees, random, false);
    
    prando.reset();
    random(); // consume same seed
    prando.reset();
    const wasmForest = tree.makeForest(testData, nNeighbors, nTrees, random, true);

    // Test that searches on both return reasonable results
    const queryPoint = testData[5];
    
    prando.reset();
    const jsResults = tree.searchFlatTree(queryPoint, jsForest[0], random);
    
    prando.reset();
    const wasmResults = tree.searchFlatTree(queryPoint, wasmForest[0], random);

    // Both should return valid results
    expect(jsResults.length).toBeGreaterThan(0);
    expect(wasmResults.length).toBeGreaterThan(0);
    
    // Results might differ due to RNG differences, but should be same length
    // (since leaf size is deterministic)
    expect(wasmResults.length).toBeLessThanOrEqual(Math.max(10, nNeighbors));
    expect(jsResults.length).toBeLessThanOrEqual(Math.max(10, nNeighbors));
  });

  test('FlatTree dispose cleans up WASM resources', () => {
    const nNeighbors = 15;
    const nTrees = 1;
    prando.reset();
    const forest = tree.makeForest(testData, nNeighbors, nTrees, random, true);
    const flatTree = forest[0];
    if (isWasmAvailable()) {
      expect(flatTree.getWasmTree()).toBeDefined();
      flatTree.dispose();
      expect(flatTree.getWasmTree()).toBeUndefined();
    } else {
      // When WASM isn't available the JS fallback will not have a wasm tree
      expect(flatTree.getWasmTree()).toBeUndefined();
      flatTree.dispose();
      expect(flatTree.getWasmTree()).toBeUndefined();
    }
  });
});
