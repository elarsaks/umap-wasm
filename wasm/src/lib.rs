#[cfg(feature = "allocator")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

mod distances;
mod tree;

pub use distances::{cosine, euclidean, version};
pub use tree::{build_rp_tree, search_flat_tree, FlatTree};
