let wasmReady: Promise<any> | null = null;
let wasmModule: any = null;

export async function initWasm() {
  if (wasmReady) return wasmReady;
  
  wasmReady = (async () => {
    try {
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
