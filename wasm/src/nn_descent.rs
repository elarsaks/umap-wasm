use wasm_bindgen::prelude::*;
use std::collections::HashSet;

/// A simple random number generator using the linear congruential method.
/// This provides deterministic PRNG behavior for reproducibility.
struct Rng {
    state: u64,
}

impl Rng {
    fn new(seed: u64) -> Self {
        Rng { state: seed }
    }

    fn next(&mut self) -> f64 {
        // Linear congruential generator constants
        const A: u64 = 1664525;
        const C: u64 = 1013904223;
        const M: u64 = 4294967296; // 2^32

        self.state = (A.wrapping_mul(self.state).wrapping_add(C)) % M;
        (self.state as f64) / (M as f64)
    }

    fn next_int(&mut self, max: usize) -> usize {
        (self.next() * (max as f64)) as usize
    }
}

/// Helper structure for managing a max-heap of nearest neighbors.
/// The heap stores (distance, index, flag) tuples for each point.
struct Heap {
    distances: Vec<Vec<f64>>,
    indices: Vec<Vec<i32>>,
    flags: Vec<Vec<u8>>,
    size: usize,
}

impl Heap {
    fn new(n_points: usize, size: usize) -> Self {
        Heap {
            distances: vec![vec![f64::INFINITY; size]; n_points],
            indices: vec![vec![-1; size]; n_points],
            flags: vec![vec![0; size]; n_points],
            size,
        }
    }

    /// Push an item onto the heap for a specific point.
    /// Returns 1 if the item was added, 0 otherwise.
    fn push(&mut self, row: usize, distance: f64, index: i32, flag: u8) -> u8 {
        if distance >= self.distances[row][0] {
            return 0;
        }

        // Check if item already exists
        for i in 0..self.size {
            if self.indices[row][i] == index {
                return 0;
            }
        }

        // Replace the root (largest distance) with the new item
        self.distances[row][0] = distance;
        self.indices[row][0] = index;
        self.flags[row][0] = flag;

        // Sift down to maintain max-heap property
        self.sift_down(row, 0);
        1
    }

    fn sift_down(&mut self, row: usize, mut pos: usize) {
        loop {
            let left = 2 * pos + 1;
            let right = 2 * pos + 2;
            let mut largest = pos;

            if left < self.size && self.distances[row][left] > self.distances[row][largest] {
                largest = left;
            }
            if right < self.size && self.distances[row][right] > self.distances[row][largest] {
                largest = right;
            }

            if largest == pos {
                break;
            }

            // Swap
            self.distances[row].swap(pos, largest);
            self.indices[row].swap(pos, largest);
            self.flags[row].swap(pos, largest);
            pos = largest;
        }
    }

    /// Sort each row in ascending order (deheap-sort).
    fn sort(&mut self) {
        for row in 0..self.distances.len() {
            // Convert max-heap to sorted array
            for end in (1..self.size).rev() {
                // Swap root with end
                self.distances[row].swap(0, end);
                self.indices[row].swap(0, end);
                self.flags[row].swap(0, end);

                // Sift down the new root in the reduced heap
                self.sift_down_limited(row, 0, end);
            }
        }
    }

    fn sift_down_limited(&mut self, row: usize, mut pos: usize, limit: usize) {
        loop {
            let left = 2 * pos + 1;
            let right = 2 * pos + 2;
            let mut largest = pos;

            if left < limit && self.distances[row][left] > self.distances[row][largest] {
                largest = left;
            }
            if right < limit && self.distances[row][right] > self.distances[row][largest] {
                largest = right;
            }

            if largest == pos {
                break;
            }

            self.distances[row].swap(pos, largest);
            self.indices[row].swap(pos, largest);
            self.flags[row].swap(pos, largest);
            pos = largest;
        }
    }
}

/// Rejection sampling: generate n_samples unique integers from [0, pool_size).
fn rejection_sample(n_samples: usize, pool_size: usize, rng: &mut Rng) -> Vec<usize> {
    let mut result = Vec::with_capacity(n_samples);
    let mut seen = HashSet::new();

    while result.len() < n_samples {
        let idx = rng.next_int(pool_size);
        if seen.insert(idx) {
            result.push(idx);
        }
    }

    result
}

/// Compute Euclidean distance between two vectors.
fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}

/// Compute Cosine distance between two vectors.
fn cosine_distance(a: &[f64], b: &[f64]) -> f64 {
    let dot: f64 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f64 = a.iter().map(|x| x * x).sum::<f64>().sqrt();
    let norm_b: f64 = b.iter().map(|x| x * x).sum::<f64>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        return 1.0;
    }
    
    1.0 - (dot / (norm_a * norm_b))
}

/// Build candidate neighbors from the current graph.
fn build_candidates(
    heap: &Heap,
    max_candidates: usize,
    rng: &mut Rng,
) -> (Vec<Vec<i32>>, Vec<Vec<u8>>) {
    let n_vertices = heap.distances.len();
    let mut new_candidate_neighbors = vec![Vec::new(); n_vertices];
    let mut old_candidate_neighbors = vec![Vec::new(); n_vertices];

    for i in 0..n_vertices {
        for j in 0..heap.size {
            if heap.indices[i][j] < 0 {
                break;
            }
            if heap.flags[i][j] == 1 {
                new_candidate_neighbors[i].push(heap.indices[i][j]);
            } else {
                old_candidate_neighbors[i].push(heap.indices[i][j]);
            }
        }
    }

    // Combine and sample candidates
    let mut candidate_indices = vec![Vec::new(); n_vertices];
    let mut candidate_flags = vec![Vec::new(); n_vertices];

    for i in 0..n_vertices {
        let n_new = new_candidate_neighbors[i].len();
        let n_old = old_candidate_neighbors[i].len();

        // Sample new candidates
        let new_sample_size = max_candidates.min(n_new);
        let new_sampled = if n_new <= max_candidates {
            new_candidate_neighbors[i].clone()
        } else {
            rejection_sample(new_sample_size, n_new, rng)
                .iter()
                .map(|&idx| new_candidate_neighbors[i][idx])
                .collect()
        };

        // Sample old candidates
        let old_sample_size = (max_candidates - new_sampled.len()).min(n_old);
        let old_sampled = if n_old <= old_sample_size {
            old_candidate_neighbors[i].clone()
        } else {
            rejection_sample(old_sample_size, n_old, rng)
                .iter()
                .map(|&idx| old_candidate_neighbors[i][idx])
                .collect()
        };

        // Combine candidates
        candidate_indices[i].extend_from_slice(&new_sampled);
        candidate_flags[i].resize(new_sampled.len(), 1);
        candidate_indices[i].extend_from_slice(&old_sampled);
        candidate_flags[i].resize(candidate_indices[i].len(), 0);

        // Pad with -1 to max_candidates size
        while candidate_indices[i].len() < max_candidates {
            candidate_indices[i].push(-1);
            candidate_flags[i].push(0);
        }
    }

    (candidate_indices, candidate_flags)
}

/// Nearest Neighbor Descent implementation in Rust/WASM.
/// 
/// This function performs approximate nearest neighbor graph construction
/// using the NN-Descent algorithm.
/// 
/// # Arguments
/// * `data_flat` - Flattened data matrix (row-major)
/// * `n_samples` - Number of data points
/// * `dim` - Dimensionality of each point
/// * `leaf_array_flat` - Flattened leaf array from RP-trees (for initialization)
/// * `n_leaves` - Number of leaves in the RP-tree forest
/// * `leaf_size` - Size of each leaf
/// * `n_neighbors` - Number of neighbors to find
/// * `n_iters` - Number of NN-Descent iterations
/// * `max_candidates` - Maximum number of candidates to consider
/// * `delta` - Early stopping threshold
/// * `rho` - Sampling rate for candidates
/// * `rp_tree_init` - Whether to use RP-tree initialization
/// * `distance_metric` - Distance metric to use ("euclidean" or "cosine")
/// * `seed` - Random seed
/// 
/// # Returns
/// A flattened array containing [distances, indices, flags] for the k-NN graph
#[wasm_bindgen]
pub fn nn_descent(
    data_flat: &[f64],
    n_samples: usize,
    dim: usize,
    leaf_array_flat: &[i32],
    n_leaves: usize,
    leaf_size: usize,
    n_neighbors: usize,
    n_iters: usize,
    max_candidates: usize,
    delta: f64,
    rho: f64,
    rp_tree_init: bool,
    distance_metric: &str,
    seed: u64,
) -> Result<Vec<f64>, JsValue> {
    let mut rng = Rng::new(seed);

    // Convert flat data to 2D structure
    let data: Vec<&[f64]> = (0..n_samples)
        .map(|i| &data_flat[i * dim..(i + 1) * dim])
        .collect();

    // Choose distance function
    let distance_fn: fn(&[f64], &[f64]) -> f64 = match distance_metric {
        "cosine" => cosine_distance,
        _ => euclidean_distance,
    };

    // Initialize heap
    let mut current_graph = Heap::new(n_samples, n_neighbors);

    // Random initialization
    for i in 0..n_samples {
        let indices = rejection_sample(n_neighbors, n_samples, &mut rng);
        for &j in &indices {
            let d = distance_fn(data[i], data[j]);
            current_graph.push(i, d, j as i32, 1);
            current_graph.push(j, d, i as i32, 1);
        }
    }

    // RP-tree initialization
    if rp_tree_init && n_leaves > 0 {
        for leaf_idx in 0..n_leaves {
            let leaf_start = leaf_idx * leaf_size;
            let leaf_end = leaf_start + leaf_size;
            let leaf = &leaf_array_flat[leaf_start..leaf_end];

            // Find valid indices in this leaf
            let mut valid_indices = Vec::new();
            for &idx in leaf {
                if idx < 0 {
                    break;
                }
                valid_indices.push(idx as usize);
            }

            // Add edges between all points in the leaf
            for i in 0..valid_indices.len() {
                for j in (i + 1)..valid_indices.len() {
                    let idx_i = valid_indices[i];
                    let idx_j = valid_indices[j];
                    let d = distance_fn(data[idx_i], data[idx_j]);
                    current_graph.push(idx_i, d, idx_j as i32, 1);
                    current_graph.push(idx_j, d, idx_i as i32, 1);
                }
            }
        }
    }

    // NN-Descent iterations
    for _ in 0..n_iters {
        let (candidate_indices, candidate_flags) =
            build_candidates(&current_graph, max_candidates, &mut rng);

        let mut c = 0;
        for i in 0..n_samples {
            for j in 0..max_candidates {
                let p = candidate_indices[i][j];
                if p < 0 || (rng.next() >= rho) {
                    continue;
                }
                let p = p as usize;

                for k in 0..max_candidates {
                    let q = candidate_indices[i][k];
                    if q < 0 {
                        continue;
                    }
                    let q = q as usize;

                    let cj = candidate_flags[i][j];
                    let ck = candidate_flags[i][k];
                    if cj == 0 && ck == 0 {
                        continue;
                    }

                    let d = distance_fn(data[p], data[q]);
                    c += current_graph.push(p, d, q as i32, 1) as usize;
                    c += current_graph.push(q, d, p as i32, 1) as usize;
                }
            }
        }

        // Early stopping
        if (c as f64) <= delta * (n_neighbors as f64) * (n_samples as f64) {
            break;
        }
    }

    // Sort the heap
    current_graph.sort();

    // Flatten and return the result
    let mut result = Vec::with_capacity(n_samples * n_neighbors * 3);
    for i in 0..n_samples {
        for j in 0..n_neighbors {
            result.push(current_graph.indices[i][j] as f64);
        }
    }
    for i in 0..n_samples {
        for j in 0..n_neighbors {
            result.push(current_graph.distances[i][j]);
        }
    }
    for i in 0..n_samples {
        for j in 0..n_neighbors {
            result.push(current_graph.flags[i][j] as f64);
        }
    }

    Ok(result)
}
