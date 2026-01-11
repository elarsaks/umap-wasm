#[cfg(feature = "allocator")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

mod distances;
mod matrix;
mod tree;

pub use distances::{cosine, euclidean, version};
pub use matrix::{
    sparse_add, sparse_eliminate_zeros, sparse_get_csr, sparse_identity, sparse_maximum,
    sparse_multiply_scalar, sparse_normalize, sparse_pairwise_multiply, sparse_subtract,
    sparse_transpose, WasmSparseMatrix,
};
pub use tree::{build_rp_tree, search_flat_tree, FlatTree};
