use wasm_bindgen::prelude::*;

#[cfg(feature = "allocator")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Simple helper to ensure the wasm is loaded and working.
#[wasm_bindgen]
pub fn version() -> String {
    "umap-wasm core 0.1.0".to_string()
}
