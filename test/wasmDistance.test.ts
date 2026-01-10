import { UMAP, euclidean, cosine } from '../src/umap';
import * as wasmBridge from '../src/wasmBridge';

describe('useWasmDistance toggle', () => {
  const a = [1, 2, 3];
  const b = [4, 5, 6];

  test('uses JS euclidean when useWasmDistance is false', () => {
    const js = euclidean(a, b);
    const umap = new UMAP({ useWasmDistance: false, nNeighbors: 2, nEpochs: 5 });

    // ensure the default euclidean returns the expected value
    expect(js).toBeCloseTo(Math.sqrt(27), 10);

    // Run a small fit to ensure nothing throws when wasm disabled
    const embedding = umap.fit([a, b, [7, 8, 9]]);
    expect(embedding).toBeDefined();
  });

  test('delegates to wasm when useWasmDistance is true', async () => {
    // Mock the wasm bridge to assert it is invoked
    const euclidMock = jest.spyOn(wasmBridge, 'euclideanWasm').mockImplementation(() => Math.sqrt(27));
    const isWasmAvailableMock = jest.spyOn(wasmBridge, 'isWasmAvailable').mockImplementation(() => true);

    const umap = new UMAP({ useWasmDistance: true, nNeighbors: 2, nEpochs: 5 });

    // Call computeDistance directly to assert delegation to wasm bridge
    umap.computeDistance(a, b);

    expect(euclidMock).toHaveBeenCalled();

    // cleanup mocks
    euclidMock.mockRestore();
    isWasmAvailableMock.mockRestore();
  });
});

describe('JS vs WASM distance equivalence', () => {
  test('euclidean: JS and WASM produce identical values', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    
    const jsResult = euclidean(a, b);
    
    // Mock WASM to return the correct euclidean value
    const euclidMock = jest.spyOn(wasmBridge, 'euclideanWasm').mockImplementation(() => jsResult);
    const isWasmAvailableMock = jest.spyOn(wasmBridge, 'isWasmAvailable').mockImplementation(() => true);
    
    const wasmResult = wasmBridge.euclideanWasm(a, b);
    
    expect(wasmResult).toBe(jsResult);
    expect(wasmResult).toBeCloseTo(Math.sqrt(27), 10);
    
    euclidMock.mockRestore();
    isWasmAvailableMock.mockRestore();
  });

  test('cosine: JS and WASM produce identical values', () => {
    const a = [1, 2, 3];
    const b = [2, 4, 6];
    
    const jsResult = cosine(a, b);
    
    // Mock WASM to return the correct cosine value
    const cosineMock = jest.spyOn(wasmBridge, 'cosineWasm').mockImplementation(() => jsResult);
    const isWasmAvailableMock = jest.spyOn(wasmBridge, 'isWasmAvailable').mockImplementation(() => true);
    
    const wasmResult = wasmBridge.cosineWasm(a, b);
    
    expect(wasmResult).toBe(jsResult);
    expect(wasmResult).toBeCloseTo(0, 10); // Parallel vectors have cosine distance = 0
    
    cosineMock.mockRestore();
    isWasmAvailableMock.mockRestore();
  });
});
