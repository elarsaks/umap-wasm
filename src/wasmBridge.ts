let wasmReady: Promise<any> | null = null;
let wasmModule: any = null;
let wasmExports: any = null;

export async function initWasm() {
  if (wasmReady) return wasmReady;
  
  wasmReady = (async () => {
    try {
      // Detect environment and load appropriate build
      const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
      
      let mod: any;
      if (isNode) {
        // Node.js: use native import
        // We construct the path as a variable to prevent webpack from analyzing it
        const nodePath = ['..', 'wasm', 'pkg', 'node', 'umap_wasm_core.js'].join('/');
        mod = await import(nodePath);
      } else {
        // Browser: try relative path first (for bundlers), fall back to absolute URL (for standalone)
        try {
          const webPath = ['..', 'wasm', 'pkg', 'web', 'umap_wasm_core.js'].join('/');
          mod = await import(webPath);
        } catch (e) {
          // Fall back to absolute URL for standalone usage
          const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
          const wasmPath = `${origin}/wasm/pkg/web/umap_wasm_core.js`;
          mod = await new Function('p', 'return import(p)')(wasmPath);
        }
      }
      
      // wasm-pack exports a default init function that must be called
      // to load and instantiate the actual .wasm binary
      if (typeof mod.default === 'function') {
        wasmExports = await mod.default();
      }
      
      wasmModule = mod;
      return mod;
    } catch (err) {
      wasmReady = null;
      wasmModule = null;
      wasmExports = null;
      throw new Error(`Failed to load WASM module: ${err}`);
    }
  })();
  
  return wasmReady;
}

export function isWasmAvailable() {
  return wasmModule !== null;
}

export function euclideanWasm(x: number[], y: number[]) {
  if (!wasmModule) throw new Error('WASM module not initialized');
  const xa = new Float64Array(x);
  const ya = new Float64Array(y);
  return wasmModule.euclidean(xa, ya);
}

export function cosineWasm(x: number[], y: number[]) {
  if (!wasmModule) throw new Error('WASM module not initialized');
  const xa = new Float64Array(x);
  const ya = new Float64Array(y);
  return wasmModule.cosine(xa, ya);
}

// ============================================================================
// Random Projection Tree WASM Functions
// ============================================================================

export interface WasmFlatTree {
  hyperplanes(): Float64Array;
  offsets(): Float64Array;
  children(): Int32Array;
  indices(): Int32Array;
  dim(): number;
  n_nodes(): number;
  free(): void;
}

/**
 * Build a random projection tree using WASM.
 * 
 * @param data - Flattened data matrix (row-major)
 * @param nSamples - Number of data points
 * @param dim - Dimensionality of each point
 * @param leafSize - Maximum points per leaf
 * @param seed - Random seed
 * @returns A WASM FlatTree object
 */
export function buildRpTreeWasm(
  data: number[][],
  nSamples: number,
  dim: number,
  leafSize: number,
  seed: number
): WasmFlatTree {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  // Flatten data to row-major format
  const flatData = new Float64Array(nSamples * dim);
  for (let i = 0; i < nSamples; i++) {
    for (let j = 0; j < dim; j++) {
      flatData[i * dim + j] = data[i][j];
    }
  }

  return buildRpTreeWasmFlat(flatData, nSamples, dim, leafSize, seed);
}

/**
 * Build a random projection tree using WASM with flat, row-major data.
 */
export function buildRpTreeWasmFlat(
  flatData: Float64Array,
  nSamples: number,
  dim: number,
  leafSize: number,
  seed: number
): WasmFlatTree {
  if (!wasmModule) throw new Error('WASM module not initialized');

  return wasmModule.build_rp_tree(flatData, nSamples, dim, leafSize, BigInt(seed));
}

/**
 * Search a WASM flat tree for a query point.
 * 
 * @param tree - The WASM FlatTree to search
 * @param point - Query point
 * @param seed - Random seed for tie-breaking
 * @returns Array of indices in the leaf containing the point
 */
export function searchFlatTreeWasm(
  tree: WasmFlatTree,
  point: number[],
  seed: number
): number[] {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  const pointArray = new Float64Array(point);
  const result = wasmModule.search_flat_tree(tree, pointArray, BigInt(seed));
  
  // Convert to regular array
  return Array.from(result);
}

/**
 * Convert a WASM FlatTree to a JavaScript FlatTree structure.
 * This is useful for interoperability with existing JS code.
 */
export function wasmTreeToJs(wasmTree: WasmFlatTree) {
  const hyperplanesFlat = Array.from(wasmTree.hyperplanes());
  const offsetsArray = Array.from(wasmTree.offsets());
  const childrenFlat = Array.from(wasmTree.children());
  const indicesFlat = Array.from(wasmTree.indices());
  
  const dim = wasmTree.dim();
  const nNodes = wasmTree.n_nodes();
  
  // Reshape hyperplanes into 2D array
  const hyperplanes: number[][] = [];
  for (let i = 0; i < nNodes; i++) {
    hyperplanes.push(hyperplanesFlat.slice(i * dim, (i + 1) * dim));
  }
  
  // Reshape children into pairs
  const children: number[][] = [];
  for (let i = 0; i < nNodes; i++) {
    children.push([childrenFlat[i * 2], childrenFlat[i * 2 + 1]]);
  }
  
  // Compute number of leaves by scanning children for leaf references
  let maxLeafIdx = 0;
  for (let i = 0; i < childrenFlat.length; i++) {
    const v = childrenFlat[i];
    if (v <= 0) {
      const leafIdx = -v;
      if (leafIdx > maxLeafIdx) maxLeafIdx = leafIdx;
    }
  }
  const nLeaves = maxLeafIdx + 1;

  // Determine leaf size from flattened indices length
  const leafSize = nLeaves > 0 ? Math.floor(indicesFlat.length / nLeaves) : 0;

  // Reshape indices into padded leaf arrays (pad with -1 to match JS shape)
  const indices: number[][] = [];
  for (let i = 0; i < nLeaves; i++) {
    const slice = indicesFlat.slice(i * leafSize, (i + 1) * leafSize);
    // pad if necessary
    while (slice.length < leafSize) slice.push(-1);
    indices.push(slice);
  }
  
  return {
    hyperplanes,
    offsets: offsetsArray,
    children,
    indices,
  };
}

// ============================================================================
// Sparse Matrix WASM Functions
// ============================================================================

export interface WasmSparseMatrix {
  n_rows: number;
  n_cols: number;
  set(row: number, col: number, value: number): void;
  get(row: number, col: number, defaultValue: number): number;
  get_dims(): number[];
  get_rows(): Int32Array;
  get_cols(): Int32Array;
  get_values(): Float64Array;
  get_all_ordered(): Float64Array;
  nnz(): number;
  to_array(): Float64Array;
  map_scalar(operation: string, scalar: number): WasmSparseMatrix;
  free(): void;
}

/**
 * Create a WASM sparse matrix.
 * 
 * @param rows - Row indices
 * @param cols - Column indices
 * @param values - Values at each (row, col)
 * @param nRows - Number of rows in the matrix
 * @param nCols - Number of columns in the matrix
 * @returns A WASM SparseMatrix object
 */
export function createSparseMatrixWasm(
  rows: number[],
  cols: number[],
  values: number[],
  nRows: number,
  nCols: number
): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  const rowsArray = new Int32Array(rows);
  const colsArray = new Int32Array(cols);
  const valuesArray = new Float64Array(values);
  
  return new wasmModule.WasmSparseMatrix(rowsArray, colsArray, valuesArray, nRows, nCols);
}

/**
 * Transpose a WASM sparse matrix.
 */
export function sparseTransposeWasm(matrix: WasmSparseMatrix): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_transpose(matrix);
}

/**
 * Create a sparse identity matrix.
 */
export function sparseIdentityWasm(size: number): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_identity(size);
}

/**
 * Element-wise addition of two sparse matrices.
 */
export function sparseAddWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_add(a, b);
}

/**
 * Element-wise subtraction of two sparse matrices.
 */
export function sparseSubtractWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_subtract(a, b);
}

/**
 * Element-wise multiplication of two sparse matrices.
 */
export function sparsePairwiseMultiplyWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_pairwise_multiply(a, b);
}

/**
 * Element-wise maximum of two sparse matrices.
 */
export function sparseMaximumWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_maximum(a, b);
}

/**
 * Scalar multiplication of a sparse matrix.
 */
export function sparseMultiplyScalarWasm(matrix: WasmSparseMatrix, scalar: number): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_multiply_scalar(matrix, scalar);
}

/**
 * Remove zero entries from a sparse matrix.
 */
export function sparseEliminateZerosWasm(matrix: WasmSparseMatrix): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_eliminate_zeros(matrix);
}

/**
 * Normalize a sparse matrix.
 * @param matrix - The sparse matrix to normalize
 * @param normType - 'max', 'l1', or 'l2'
 */
export function sparseNormalizeWasm(matrix: WasmSparseMatrix, normType: string = 'l2'): WasmSparseMatrix {
  if (!wasmModule) throw new Error('WASM module not initialized');
  return wasmModule.sparse_normalize(matrix, normType);
}

/**
 * Get CSR representation of a sparse matrix.
 * @returns Object with indices, values, and indptr arrays
 */
export function sparseGetCSRWasm(matrix: WasmSparseMatrix): { indices: number[]; values: number[]; indptr: number[] } {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  const result: number[] = Array.from(wasmModule.sparse_get_csr(matrix));
  
  const nIndices = result[0];
  const nValues = result[1];
  const nIndptr = result[2];
  
  const indices = result.slice(3, 3 + nIndices);
  const values = result.slice(3 + nIndices, 3 + nIndices + nValues);
  const indptr = result.slice(3 + nIndices + nValues, 3 + nIndices + nValues + nIndptr);
  
  return { indices, values, indptr };
}

/**
 * Convert a WASM sparse matrix to a 2D JavaScript array.
 */
export function wasmSparseMatrixToArray(matrix: WasmSparseMatrix): number[][] {
  const flat = matrix.to_array();
  const nRows = matrix.n_rows;
  const nCols = matrix.n_cols;
  
  const result: number[][] = [];
  for (let i = 0; i < nRows; i++) {
    const row: number[] = new Array(nCols);
    const start = i * nCols;
    for (let j = 0; j < nCols; j++) {
      row[j] = flat[start + j];
    }
    result.push(row);
  }
  return result;
}

/**
 * Get all entries from a WASM sparse matrix in ordered format.
 * @returns Array of {value, row, col} entries, ordered by row then col
 */
export function wasmSparseMatrixGetAll(matrix: WasmSparseMatrix): { value: number; row: number; col: number }[] {
  const flat = matrix.get_all_ordered();
  const entries: { value: number; row: number; col: number }[] = [];
  
  for (let i = 0; i < flat.length; i += 3) {
    entries.push({
      row: flat[i],
      col: flat[i + 1],
      value: flat[i + 2],
    });
  }
  
  return entries;
}

/**
 * Get all entries from a WASM sparse matrix as typed arrays.
 */
export function wasmSparseMatrixGetAllTyped(matrix: WasmSparseMatrix): {
  rows: Int32Array;
  cols: Int32Array;
  values: Float64Array;
} {
  const flat = matrix.get_all_ordered();
  const count = Math.floor(flat.length / 3);
  const rows = new Int32Array(count);
  const cols = new Int32Array(count);
  const values = new Float64Array(count);

  let out = 0;
  for (let i = 0; i < flat.length; i += 3) {
    rows[out] = flat[i];
    cols[out] = flat[i + 1];
    values[out] = flat[i + 2];
    out += 1;
  }

  return { rows, cols, values };
}

// ============================================================================
// NN-Descent WASM Functions
// ============================================================================

/**
 * Run nearest neighbor descent using WASM.
 * 
 * @param data - Input data matrix
 * @param leafArray - Leaf array from RP-trees (for initialization)
 * @param nNeighbors - Number of neighbors to find
 * @param nIters - Number of iterations
 * @param maxCandidates - Maximum number of candidates per iteration
 * @param delta - Early stopping threshold
 * @param rho - Sampling rate for candidates
 * @param rpTreeInit - Whether to use RP-tree initialization
 * @param distanceMetric - Distance metric ('euclidean' or 'cosine')
 * @param seed - Random seed
 * @returns The nearest neighbor graph as [indices, distances, flags]
 */
export function nnDescentWasm(
  data: number[][],
  leafArray: number[][],
  nNeighbors: number,
  nIters: number = 10,
  maxCandidates: number = 50,
  delta: number = 0.001,
  rho: number = 0.5,
  rpTreeInit: boolean = true,
  distanceMetric: string = 'euclidean',
  seed: number = 42
): number[][][] {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  const nSamples = data.length;
  const dim = data[0].length;
  
  // Flatten data to row-major format
  const flatData = new Float64Array(nSamples * dim);
  for (let i = 0; i < nSamples; i++) {
    for (let j = 0; j < dim; j++) {
      flatData[i * dim + j] = data[i][j];
    }
  }
  
  // Flatten leaf array
  const nLeaves = leafArray.length;
  const leafSize = nLeaves > 0 ? leafArray[0].length : 0;
  const flatLeafArray = new Int32Array(nLeaves * leafSize);
  for (let i = 0; i < nLeaves; i++) {
    for (let j = 0; j < leafSize; j++) {
      flatLeafArray[i * leafSize + j] = leafArray[i][j];
    }
  }
  
  const result = nnDescentWasmFlat(
    flatData,
    nSamples,
    dim,
    flatLeafArray,
    nLeaves,
    leafSize,
    nNeighbors,
    nIters,
    maxCandidates,
    delta,
    rho,
    rpTreeInit,
    distanceMetric,
    seed
  );
  
  // Unflatten result: [indices, distances, flags]
  const indices: number[][] = [];
  const distances: number[][] = [];
  const flags: number[][] = [];
  
  const offset1 = nSamples * nNeighbors;
  const offset2 = 2 * nSamples * nNeighbors;
  
  for (let i = 0; i < nSamples; i++) {
    const rowIndices: number[] = [];
    const rowDistances: number[] = [];
    const rowFlags: number[] = [];
    
    for (let j = 0; j < nNeighbors; j++) {
      rowIndices.push(result[i * nNeighbors + j]);
      rowDistances.push(result[offset1 + i * nNeighbors + j]);
      rowFlags.push(result[offset2 + i * nNeighbors + j]);
    }
    
    indices.push(rowIndices);
    distances.push(rowDistances);
    flags.push(rowFlags);
  }
  
  return [indices, distances, flags];
}

/**
 * Run nearest neighbor descent using WASM with flat data and leaf arrays.
 */
export function nnDescentWasmFlat(
  flatData: Float64Array,
  nSamples: number,
  dim: number,
  flatLeafArray: Int32Array,
  nLeaves: number,
  leafSize: number,
  nNeighbors: number,
  nIters: number = 10,
  maxCandidates: number = 50,
  delta: number = 0.001,
  rho: number = 0.5,
  rpTreeInit: boolean = true,
  distanceMetric: string = 'euclidean',
  seed: number = 42
): number[] {
  if (!wasmModule) throw new Error('WASM module not initialized');

  return wasmModule.nn_descent(
    flatData,
    nSamples,
    dim,
    flatLeafArray,
    nLeaves,
    leafSize,
    nNeighbors,
    nIters,
    maxCandidates,
    delta,
    rho,
    rpTreeInit,
    distanceMetric,
    BigInt(seed)
  );
}

// ============================================================================
// Optimizer WASM Functions
// ============================================================================

export interface WasmOptimizerState {
  head_embedding: Float64Array;
  current_epoch: number;
  n_epochs: number;
  head_embedding_ptr(): number;
  head_embedding_len(): number;
  free(): void;
}

/**
 * Create a WASM optimizer state for gradient descent optimization.
 * 
 * @param head - Head vertices of edges
 * @param tail - Tail vertices of edges
 * @param headEmbedding - Flattened head embedding (row-major)
 * @param tailEmbedding - Flattened tail embedding (row-major)
 * @param epochsPerSample - Epochs per sample for each edge
 * @param epochsPerNegativeSample - Epochs per negative sample for each edge
 * @param moveOther - Whether to move tail vertices
 * @param initialAlpha - Initial learning rate
 * @param gamma - Repulsion strength
 * @param a - Curve parameter a
 * @param b - Curve parameter b
 * @param dim - Embedding dimensionality
 * @param nEpochs - Total number of epochs
 * @param nVertices - Total number of vertices
 * @returns A WASM OptimizerState object
 */
export function createOptimizerState(
  head: number[],
  tail: number[],
  headEmbedding: number[][],
  tailEmbedding: number[][],
  epochsPerSample: number[],
  epochsPerNegativeSample: number[],
  moveOther: boolean,
  initialAlpha: number,
  gamma: number,
  a: number,
  b: number,
  dim: number,
  nEpochs: number,
  nVertices: number
): WasmOptimizerState {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  // Flatten embeddings to row-major format
  const flatHeadEmbedding = new Float64Array(headEmbedding.length * dim);
  const flatTailEmbedding = new Float64Array(tailEmbedding.length * dim);
  
  for (let i = 0; i < headEmbedding.length; i++) {
    for (let j = 0; j < dim; j++) {
      flatHeadEmbedding[i * dim + j] = headEmbedding[i][j];
    }
  }
  
  for (let i = 0; i < tailEmbedding.length; i++) {
    for (let j = 0; j < dim; j++) {
      flatTailEmbedding[i * dim + j] = tailEmbedding[i][j];
    }
  }
  
  // Create typed arrays for WASM
  const headArray = new Uint32Array(head);
  const tailArray = new Uint32Array(tail);
  const epochsPerSampleArray = new Float64Array(epochsPerSample);
  const epochsPerNegativeSampleArray = new Float64Array(epochsPerNegativeSample);
  
  return new wasmModule.OptimizerState(
    headArray,
    tailArray,
    flatHeadEmbedding,
    flatTailEmbedding,
    epochsPerSampleArray,
    epochsPerNegativeSampleArray,
    moveOther,
    initialAlpha,
    gamma,
    a,
    b,
    dim,
    nEpochs,
    nVertices
  );
}

/**
 * Perform a single optimization step using WASM.
 * 
 * @param state - The WASM optimizer state
 * @param rngSeed - Random number generator seed
 * @returns Updated embedding as a flat Float64Array
 */
export function optimizeLayoutStepWasm(
  state: WasmOptimizerState,
  rngSeed: bigint
): Float64Array {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  return wasmModule.optimize_layout_step(state, rngSeed);
}

/**
 * Perform a single optimization step in place using WASM.
 */
export function optimizeLayoutStepInPlaceWasm(
  state: WasmOptimizerState,
  rngSeed: bigint
): void {
  if (!wasmModule) throw new Error('WASM module not initialized');

  wasmModule.optimize_layout_step_in_place(state, rngSeed);
}

/**
 * Perform multiple optimization steps in a batch using WASM.
 * 
 * @param state - The WASM optimizer state
 * @param rngSeed - Random number generator seed
 * @param nSteps - Number of steps to perform
 * @returns Updated embedding as a flat Float64Array
 */
export function optimizeLayoutBatchWasm(
  state: WasmOptimizerState,
  rngSeed: bigint,
  nSteps: number
): Float64Array {
  if (!wasmModule) throw new Error('WASM module not initialized');
  
  return wasmModule.optimize_layout_batch(state, rngSeed, nSteps);
}

/**
 * Perform multiple optimization steps in place using WASM.
 */
export function optimizeLayoutBatchInPlaceWasm(
  state: WasmOptimizerState,
  rngSeed: bigint,
  nSteps: number
): void {
  if (!wasmModule) throw new Error('WASM module not initialized');

  wasmModule.optimize_layout_batch_in_place(state, rngSeed, nSteps);
}

/**
 * Get a zero-copy view of the optimizer embedding buffer.
 */
export function getOptimizerEmbeddingView(state: WasmOptimizerState): Float64Array {
  if (!wasmModule) throw new Error('WASM module not initialized');

  const ptr = state.head_embedding_ptr();
  const len = state.head_embedding_len();
  const memory =
    wasmExports?.memory ??
    wasmModule?.memory ??
    wasmModule?.__wasm?.memory;
  if (!memory?.buffer) {
    throw new Error('WASM memory is not available');
  }
  return new Float64Array(memory.buffer, ptr, len);
}
