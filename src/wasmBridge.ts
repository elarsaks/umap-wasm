let wasmReady: Promise<any> | null = null;
let wasmModule: any = null;

export async function initWasm() {
  if (wasmReady) return wasmReady;
  // Lazy import the generated wasm pkg. This keeps it optional.
  wasmReady = import('../wasm/pkg/umap_wasm_core.js')
    .then((mod) => {
      wasmModule = mod;
      return mod;
    })
    .catch((err) => {
      wasmReady = null;
      wasmModule = null;
      throw err;
    });
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
