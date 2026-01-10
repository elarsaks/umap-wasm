let wasmReady: Promise<any> | null = null;
let wasmModule: any = null;

export async function initWasm() {
  if (wasmReady) return wasmReady;
  
  wasmReady = (async () => {
    try {
      // TODO: Use only one way, lets get rid of the others later
      // Try multiple strategies to load the WASM module to handle different runtime contexts
      let mod: any;
      let lastError: any = null;
      
      // Strategy 1: Try CommonJS require with absolute paths (works in Node/Jest)
      // Use an evaluated require to avoid webpack statically bundling `path`/`fs`.
      try {
        // eslint-disable-next-line no-eval
        const maybeRequire = eval("typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : (typeof require !== 'undefined' ? require : undefined)");
        if (maybeRequire) {
          try {
            const pathModule = maybeRequire('path');
            const fsModule = maybeRequire('fs');
            const candidates = [
              pathModule.resolve(process.cwd(), 'wasm/pkg/umap_wasm_core.js'),
              pathModule.resolve(__dirname, '../wasm/pkg/umap_wasm_core.js'),
              pathModule.resolve(__dirname, '../../wasm/pkg/umap_wasm_core.js'),
              // When running from dist/src/, need to go up more levels
              pathModule.resolve(__dirname, '../../../wasm/pkg/umap_wasm_core.js'),
            ];

            for (const candidate of candidates) {
              try {
                if (fsModule.existsSync(candidate)) {
                  mod = maybeRequire(candidate);
                  wasmModule = mod;
                  return mod;
                }
              } catch (e) {
                // Try next candidate
              }
            }
          } catch (e) {
            // ignore and fall through to dynamic import
            lastError = e;
          }
        }
      } catch (e) {
        lastError = e;
      }
      
      throw new Error('Could not load WASM module via CommonJS require');
    } catch (err) {
      wasmReady = null;
      wasmModule = null;
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
  const flat = Array.from(matrix.to_array());
  const nRows = matrix.n_rows;
  const nCols = matrix.n_cols;
  
  const result: number[][] = [];
  for (let i = 0; i < nRows; i++) {
    result.push(flat.slice(i * nCols, (i + 1) * nCols));
  }
  return result;
}

/**
 * Get all entries from a WASM sparse matrix in ordered format.
 * @returns Array of {value, row, col} entries, ordered by row then col
 */
export function wasmSparseMatrixGetAll(matrix: WasmSparseMatrix): { value: number; row: number; col: number }[] {
  const flat = Array.from(matrix.get_all_ordered());
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
