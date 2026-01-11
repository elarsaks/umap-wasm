use wasm_bindgen::prelude::*;
use js_sys::Float64Array;

/// A flattened random projection tree structure for efficient nearest neighbor search.
/// The tree is represented in flat arrays for efficient memory layout and cache performance.
#[wasm_bindgen]
pub struct FlatTree {
    hyperplanes: Vec<f64>,
    offsets: Vec<f64>,
    children: Vec<i32>,
    indices: Vec<i32>,
    dim: usize,
    n_nodes: usize,
    leaf_size: usize,
}

#[wasm_bindgen]
impl FlatTree {
    /// Get the hyperplanes as a flat Float64Array
    pub fn hyperplanes(&self) -> Float64Array {
        Float64Array::from(&self.hyperplanes[..])
    }
    
    /// Get the offsets as a Float64Array
    pub fn offsets(&self) -> Float64Array {
        Float64Array::from(&self.offsets[..])
    }
    
    /// Get the children array (pairs of child indices)
    pub fn children(&self) -> Vec<i32> {
        self.children.clone()
    }
    
    /// Get the leaf indices array
    pub fn indices(&self) -> Vec<i32> {
        self.indices.clone()
    }
    
    /// Get the dimensionality
    pub fn dim(&self) -> usize {
        self.dim
    }
    
    /// Get number of nodes
    pub fn n_nodes(&self) -> usize {
        self.n_nodes
    }
}

/// Internal tree node structure used during construction
struct TreeNode {
    is_leaf: bool,
    indices: Vec<usize>,
    left_child: Option<Box<TreeNode>>,
    right_child: Option<Box<TreeNode>>,
    hyperplane: Vec<f64>,
    offset: f64,
}

/// Build a random projection tree for the given data.
/// 
/// # Arguments
/// * `data` - Flattened data matrix (row-major, n_samples * dim)
/// * `n_samples` - Number of data points
/// * `dim` - Dimensionality of each point
/// * `leaf_size` - Maximum number of points in a leaf node
/// * `seed` - Random seed for reproducibility
/// 
/// # Returns
/// A FlatTree structure ready for efficient search
#[wasm_bindgen]
pub fn build_rp_tree(
    data: &[f64],
    n_samples: usize,
    dim: usize,
    leaf_size: usize,
    seed: u64,
) -> FlatTree {
    let indices: Vec<usize> = (0..n_samples).collect();
    let mut rng = Rng::new(seed);
    
    // Build the tree recursively
    let tree = build_tree_recursive(data, &indices, dim, leaf_size, &mut rng);
    
    // Flatten the tree into arrays
    flatten_tree(&tree, dim, leaf_size)
}

/// Search a flattened tree to find the leaf containing the query point.
/// 
/// # Arguments
/// * `tree` - The FlatTree to search
/// * `point` - Query point to search for
/// * `seed` - Random seed for tie-breaking
/// 
/// # Returns
/// Array of indices in the leaf node containing the query point
#[wasm_bindgen]
pub fn search_flat_tree(tree: &FlatTree, point: &[f64], seed: u64) -> Vec<i32> {
    assert_eq!(point.len(), tree.dim, "Point dimension must match tree dimension");
    
    let mut rng = Rng::new(seed);
    let mut node = 0;
    
    // Traverse the tree until we hit a leaf
    while node < tree.n_nodes {
        let left_child = tree.children[node * 2];
        let right_child = tree.children[node * 2 + 1];
        
        // Negative left child means this is a leaf
        if left_child < 0 {
            let leaf_idx = (-left_child) as usize;
            let start = leaf_idx * tree.leaf_size;
            let end = start + tree.leaf_size;
            
            // Return non-negative indices from the leaf
            return tree.indices[start..end]
                .iter()
                .filter(|&&idx| idx >= 0)
                .copied()
                .collect();
        }
        
        // Select which child to follow
        let side = select_side(
            &tree.hyperplanes[node * tree.dim..(node + 1) * tree.dim],
            tree.offsets[node],
            point,
            &mut rng,
        );
        
        node = if side == 0 { left_child as usize } else { right_child as usize };
    }
    
    vec![] // Should never reach here
}

/// Recursively build a random projection tree.
fn build_tree_recursive(
    data: &[f64],
    indices: &[usize],
    dim: usize,
    leaf_size: usize,
    rng: &mut Rng,
) -> TreeNode {
    if indices.len() <= leaf_size {
        // Create a leaf node
        return TreeNode {
            is_leaf: true,
            indices: indices.to_vec(),
            left_child: None,
            right_child: None,
            hyperplane: vec![],
            offset: 0.0,
        };
    }
    
    // Split the data using a random hyperplane
    let (indices_left, indices_right, hyperplane, offset) =
        random_projection_split(data, indices, dim, rng);
    
    // Recursively build left and right subtrees
    let left_child = Box::new(build_tree_recursive(data, &indices_left, dim, leaf_size, rng));
    let right_child = Box::new(build_tree_recursive(data, &indices_right, dim, leaf_size, rng));
    
    TreeNode {
        is_leaf: false,
        indices: vec![],
        left_child: Some(left_child),
        right_child: Some(right_child),
        hyperplane,
        offset,
    }
}

/// Split data using a random hyperplane based on two random points.
fn random_projection_split(
    data: &[f64],
    indices: &[usize],
    dim: usize,
    rng: &mut Rng,
) -> (Vec<usize>, Vec<usize>, Vec<f64>, f64) {
    let n = indices.len();
    
    // Select two random points
    let left_idx = rng.next_int(n);
    let mut right_idx = rng.next_int(n);
    if right_idx == left_idx {
        right_idx = (right_idx + 1) % n;
    }
    
    let left_point_idx = indices[left_idx];
    let right_point_idx = indices[right_idx];
    
    // Compute hyperplane normal (vector between the two points) and offset
    let mut hyperplane = vec![0.0; dim];
    let mut offset = 0.0;
    
    for i in 0..dim {
        let left_val = data[left_point_idx * dim + i];
        let right_val = data[right_point_idx * dim + i];
        hyperplane[i] = left_val - right_val;
        offset -= hyperplane[i] * (left_val + right_val) / 2.0;
    }
    
    // Classify each point to left or right of hyperplane
    let mut indices_left = Vec::new();
    let mut indices_right = Vec::new();
    
    for &idx in indices {
        let mut margin = offset;
        for d in 0..dim {
            margin += hyperplane[d] * data[idx * dim + d];
        }
        
        if margin == 0.0 {
            // Tie-breaking with random choice
            if rng.next_int(2) == 0 {
                indices_left.push(idx);
            } else {
                indices_right.push(idx);
            }
        } else if margin > 0.0 {
            indices_left.push(idx);
        } else {
            indices_right.push(idx);
        }
    }
    
    // Handle edge case where all points go to one side
    if indices_left.is_empty() {
        indices_left.push(indices_right.pop().unwrap());
    } else if indices_right.is_empty() {
        indices_right.push(indices_left.pop().unwrap());
    }
    
    (indices_left, indices_right, hyperplane, offset)
}

/// Flatten a tree into flat arrays for efficient access.
fn flatten_tree(tree: &TreeNode, dim: usize, leaf_size: usize) -> FlatTree {
    let n_nodes = count_nodes(tree);
    let n_leaves = count_leaves(tree);
    
    let mut hyperplanes = vec![0.0; n_nodes * dim];
    let mut offsets = vec![0.0; n_nodes];
    let mut children = vec![-1; n_nodes * 2]; // pairs of (left, right)
    let mut indices = vec![-1; n_leaves * leaf_size];
    
    flatten_recursive(
        tree,
        &mut hyperplanes,
        &mut offsets,
        &mut children,
        &mut indices,
        dim,
        leaf_size,
        0,
        0,
    );
    
    FlatTree {
        hyperplanes,
        offsets,
        children,
        indices,
        dim,
        n_nodes,
        leaf_size,
    }
}

/// Recursively flatten a tree into arrays.
fn flatten_recursive(
    tree: &TreeNode,
    hyperplanes: &mut [f64],
    offsets: &mut [f64],
    children: &mut [i32],
    indices: &mut [i32],
    dim: usize,
    leaf_size: usize,
    node_num: usize,
    leaf_num: usize,
) -> (usize, usize) {
    if tree.is_leaf {
        // Mark this as a leaf node (negative index points to leaf)
        children[node_num * 2] = -(leaf_num as i32);
        
        // Copy indices into the leaf array
        for (i, &idx) in tree.indices.iter().enumerate() {
            indices[leaf_num * leaf_size + i] = idx as i32;
        }
        
        return (node_num, leaf_num + 1);
    }
    
    // Copy hyperplane and offset for internal node
    for i in 0..dim {
        hyperplanes[node_num * dim + i] = tree.hyperplane[i];
    }
    offsets[node_num] = tree.offset;
    
    // Reserve space for children pointers
    children[node_num * 2] = (node_num + 1) as i32; // left child is next
    let old_node_num = node_num;
    
    // Flatten left subtree
    let (current_node, current_leaf) = flatten_recursive(
        tree.left_child.as_ref().unwrap(),
        hyperplanes,
        offsets,
        children,
        indices,
        dim,
        leaf_size,
        node_num + 1,
        leaf_num,
    );
    
    // Right child comes after all left subtree nodes
    children[old_node_num * 2 + 1] = (current_node + 1) as i32;
    
    // Flatten right subtree
    flatten_recursive(
        tree.right_child.as_ref().unwrap(),
        hyperplanes,
        offsets,
        children,
        indices,
        dim,
        leaf_size,
        current_node + 1,
        current_leaf,
    )
}

/// Count total nodes in a tree.
fn count_nodes(tree: &TreeNode) -> usize {
    if tree.is_leaf {
        1
    } else {
        1 + count_nodes(tree.left_child.as_ref().unwrap())
            + count_nodes(tree.right_child.as_ref().unwrap())
    }
}

/// Count total leaves in a tree.
fn count_leaves(tree: &TreeNode) -> usize {
    if tree.is_leaf {
        1
    } else {
        count_leaves(tree.left_child.as_ref().unwrap())
            + count_leaves(tree.right_child.as_ref().unwrap())
    }
}

/// Select which side of a hyperplane a point falls on.
fn select_side(hyperplane: &[f64], offset: f64, point: &[f64], rng: &mut Rng) -> i32 {
    let mut margin = offset;
    for i in 0..point.len() {
        margin += hyperplane[i] * point[i];
    }
    
    if margin == 0.0 {
        rng.next_int(2) as i32
    } else if margin > 0.0 {
        0
    } else {
        1
    }
}

// Simple pseudo-random number generator (LCG)
struct Rng {
    state: u64,
}

impl Rng {
    fn new(seed: u64) -> Self {
        Rng { state: seed }
    }
    
    fn next(&mut self) -> u64 {
        self.state = self.state.wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        self.state
    }
    
    fn next_int(&mut self, max: usize) -> usize {
        (self.next() % max as u64) as usize
    }
}
