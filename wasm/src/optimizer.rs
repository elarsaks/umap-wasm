use wasm_bindgen::prelude::*;

/// Represents the state needed for gradient descent optimization in UMAP.
/// This struct holds all the necessary data for performing iterative layout optimization.
#[wasm_bindgen]
pub struct OptimizerState {
    // Edge data
    head: Vec<usize>,
    tail: Vec<usize>,
    
    // Embedding data (flattened 2D arrays)
    head_embedding: Vec<f64>,
    tail_embedding: Vec<f64>,
    
    // Sampling data
    epochs_per_sample: Vec<f64>,
    epoch_of_next_sample: Vec<f64>,
    epoch_of_next_negative_sample: Vec<f64>,
    epochs_per_negative_sample: Vec<f64>,
    
    // Optimization parameters
    move_other: bool,
    initial_alpha: f64,
    alpha: f64,
    gamma: f64,
    a: f64,
    b: f64,
    dim: usize,
    n_epochs: usize,
    n_vertices: usize,
    current_epoch: usize,
}

#[wasm_bindgen]
impl OptimizerState {
    /// Create a new optimizer state with the given parameters.
    #[wasm_bindgen(constructor)]
    pub fn new(
        head: Vec<usize>,
        tail: Vec<usize>,
        head_embedding: Vec<f64>,
        tail_embedding: Vec<f64>,
        epochs_per_sample: Vec<f64>,
        epochs_per_negative_sample: Vec<f64>,
        move_other: bool,
        initial_alpha: f64,
        gamma: f64,
        a: f64,
        b: f64,
        dim: usize,
        n_epochs: usize,
        n_vertices: usize,
    ) -> OptimizerState {
        let epoch_of_next_sample = epochs_per_sample.clone();
        let epoch_of_next_negative_sample = epochs_per_negative_sample.clone();
        
        OptimizerState {
            head,
            tail,
            head_embedding,
            tail_embedding,
            epochs_per_sample,
            epoch_of_next_sample,
            epoch_of_next_negative_sample,
            epochs_per_negative_sample,
            move_other,
            initial_alpha,
            alpha: initial_alpha,
            gamma,
            a,
            b,
            dim,
            n_epochs,
            n_vertices,
            current_epoch: 0,
        }
    }
    
    /// Get the current embedding as a flat array.
    #[wasm_bindgen(getter)]
    pub fn head_embedding(&self) -> Vec<f64> {
        self.head_embedding.clone()
    }
    
    /// Get the current epoch number.
    #[wasm_bindgen(getter)]
    pub fn current_epoch(&self) -> usize {
        self.current_epoch
    }
    
    /// Get the total number of epochs.
    #[wasm_bindgen(getter)]
    pub fn n_epochs(&self) -> usize {
        self.n_epochs
    }
}

/// Clip a value to be within [-clip_value, clip_value].
#[inline]
fn clip(x: f64, clip_value: f64) -> f64 {
    x.max(-clip_value).min(clip_value)
}

/// Compute reduced Euclidean distance (squared distance without sqrt).
#[inline]
fn r_dist(current: &[f64], other: &[f64]) -> f64 {
    let mut result = 0.0;
    for i in 0..current.len() {
        let diff = current[i] - other[i];
        result += diff * diff;
    }
    result
}

/// Generate a random integer in [0, n).
/// This is a simple LCG-based random number generator.
#[inline]
fn tau_rand_int(n: usize, state: &mut u64) -> usize {
    // Linear congruential generator parameters
    const A: u64 = 6364136223846793005;
    const C: u64 = 1442695040888963407;
    
    *state = state.wrapping_mul(A).wrapping_add(C);
    ((*state >> 32) as usize) % n
}

/// Perform a single optimization step for UMAP layout.
/// 
/// This function executes one epoch of the stochastic gradient descent algorithm
/// used to optimize the low-dimensional embedding. It processes attractive forces
/// between known neighbors and repulsive forces from negative samples.
/// 
/// # Arguments
/// * `state` - Mutable reference to the optimizer state
/// * `rng_seed` - Seed for random number generation (will be updated internally)
/// 
/// # Returns
/// The updated embedding as a flat vector
#[wasm_bindgen]
pub fn optimize_layout_step(state: &mut OptimizerState, rng_seed: u64) -> Vec<f64> {
    let clip_value = 4.0;
    let n = state.current_epoch;
    let mut rng_state = rng_seed;
    
    // Process each edge
    for i in 0..state.epochs_per_sample.len() {
        if state.epoch_of_next_sample[i] > n as f64 {
            continue;
        }
        
        let j = state.head[i];
        let k = state.tail[i];
        
        // Get current and other embedding vectors
        let current_start = j * state.dim;
        let other_start = k * state.dim;
        
        // Copy values to avoid borrowing issues
        let mut current_vec = Vec::with_capacity(state.dim);
        let mut other_vec = Vec::with_capacity(state.dim);
        for d in 0..state.dim {
            current_vec.push(state.head_embedding[current_start + d]);
            other_vec.push(state.tail_embedding[other_start + d]);
        }
        
        let dist_squared = r_dist(&current_vec, &other_vec);
        
        // Compute attractive gradient
        let mut grad_coeff = 0.0;
        if dist_squared > 0.0 {
            grad_coeff = -2.0 * state.a * state.b * dist_squared.powf(state.b - 1.0);
            grad_coeff /= state.a * dist_squared.powf(state.b) + 1.0;
        }
        
        // Apply attractive force gradient
        for d in 0..state.dim {
            let grad_d = clip(
                grad_coeff * (current_vec[d] - other_vec[d]),
                clip_value
            );
            state.head_embedding[current_start + d] += grad_d * state.alpha;
            if state.move_other {
                state.tail_embedding[other_start + d] -= grad_d * state.alpha;
            }
        }
        
        state.epoch_of_next_sample[i] += state.epochs_per_sample[i];
        
        // Process negative samples
        let n_neg_samples = ((n as f64 - state.epoch_of_next_negative_sample[i]) 
            / state.epochs_per_negative_sample[i]).floor() as usize;
        
        for _ in 0..n_neg_samples {
            let k_neg = tau_rand_int(state.n_vertices, &mut rng_state);
            let other_start_neg = k_neg * state.dim;
            
            // Copy current and other vectors
            let mut current_vec = Vec::with_capacity(state.dim);
            let mut other_vec = Vec::with_capacity(state.dim);
            for d in 0..state.dim {
                current_vec.push(state.head_embedding[current_start + d]);
                other_vec.push(state.tail_embedding[other_start_neg + d]);
            }
            
            let dist_squared = r_dist(&current_vec, &other_vec);
            
            // Compute repulsive gradient
            let mut grad_coeff = 0.0;
            if dist_squared > 0.0 {
                grad_coeff = 2.0 * state.gamma * state.b;
                grad_coeff /= (0.001 + dist_squared) 
                    * (state.a * dist_squared.powf(state.b) + 1.0);
            } else if j == k_neg {
                continue;
            }
            
            // Apply repulsive force gradient
            for d in 0..state.dim {
                let grad_d = if grad_coeff > 0.0 {
                    clip(grad_coeff * (current_vec[d] - other_vec[d]), clip_value)
                } else {
                    4.0
                };
                state.head_embedding[current_start + d] += grad_d * state.alpha;
            }
        }
        
        state.epoch_of_next_negative_sample[i] += 
            n_neg_samples as f64 * state.epochs_per_negative_sample[i];
    }
    
    // Update learning rate
    state.alpha = state.initial_alpha * (1.0 - n as f64 / state.n_epochs as f64);
    state.current_epoch += 1;
    
    state.head_embedding.clone()
}

/// Perform multiple optimization steps in a batch.
/// 
/// This function runs multiple epochs of optimization, which can be more
/// efficient than calling optimize_layout_step repeatedly due to reduced
/// JavaScript/WASM boundary crossings.
/// 
/// # Arguments
/// * `state` - Mutable reference to the optimizer state
/// * `rng_seed` - Seed for random number generation
/// * `n_steps` - Number of steps to perform
/// 
/// # Returns
/// The final embedding as a flat vector
#[wasm_bindgen]
pub fn optimize_layout_batch(
    state: &mut OptimizerState,
    rng_seed: u64,
    n_steps: usize,
) -> Vec<f64> {
    let mut rng_state = rng_seed;
    for _ in 0..n_steps {
        if state.current_epoch >= state.n_epochs {
            break;
        }
        optimize_layout_step(state, rng_state);
        // Advance RNG state
        const A: u64 = 6364136223846793005;
        const C: u64 = 1442695040888963407;
        rng_state = rng_state.wrapping_mul(A).wrapping_add(C);
    }
    state.head_embedding.clone()
}
