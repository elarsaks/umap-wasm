#[cfg(feature = "allocator")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

mod distances;
mod matrix;
mod nn_descent;
mod optimizer;
mod tree;

pub use distances::{cosine, euclidean, version};
pub use matrix::{
    sparse_add, sparse_eliminate_zeros, sparse_get_csr, sparse_identity, sparse_maximum,
    sparse_multiply_scalar, sparse_normalize, sparse_pairwise_multiply, sparse_subtract,
    sparse_transpose, WasmSparseMatrix,
};
pub use nn_descent::nn_descent;
pub use optimizer::{optimize_layout_batch, optimize_layout_step, OptimizerState};
pub use tree::{build_rp_tree, search_flat_tree, FlatTree};

use js_sys::Promise;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init_threads(n_threads: usize) -> Promise {
    wasm_bindgen_rayon::init_thread_pool(n_threads)
}
