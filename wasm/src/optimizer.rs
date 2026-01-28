use wasm_bindgen::prelude::*;

/// Represents the state needed for gradient descent optimization in UMAP.
/// This struct holds all the necessary data for performing iterative layout optimization.
#[wasm_bindgen]
pub struct OptimizerState {
    // Edge data
    head: Vec<usize>,
    tail: Vec<usize>,
    
    // Embedding data (flattened 2D arrays)
    head_embedding: Vec<f32>,
    tail_embedding: Vec<f32>,
    
    // Sampling data
    epochs_per_sample: Vec<f32>,
    epoch_of_next_sample: Vec<f32>,
    epoch_of_next_negative_sample: Vec<f32>,
    epochs_per_negative_sample: Vec<f32>,
    
    // Optimization parameters
    move_other: bool,
    initial_alpha: f32,
    alpha: f32,
    gamma: f32,
    a: f32,
    b: f32,
    dim: usize,
    n_epochs: usize,
    n_vertices: usize,
    current_epoch: usize,
    rng_state: u64,
}

#[wasm_bindgen]
impl OptimizerState {
    /// Create a new optimizer state with the given parameters.
    #[wasm_bindgen(constructor)]
    pub fn new(
        head: Vec<usize>,
        tail: Vec<usize>,
        head_embedding: Vec<f32>,
        tail_embedding: Vec<f32>,
        epochs_per_sample: Vec<f32>,
        epochs_per_negative_sample: Vec<f32>,
        move_other: bool,
        initial_alpha: f32,
        gamma: f32,
        a: f32,
        b: f32,
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
            rng_state: 0,
        }
    }
    
    /// Get the current embedding as a flat array.
    #[wasm_bindgen(getter)]
    pub fn head_embedding(&self) -> Vec<f32> {
        self.head_embedding.clone()
    }

    /// Get a pointer to the embedding buffer (for zero-copy views).
    pub fn head_embedding_ptr(&self) -> *const f32 {
        self.head_embedding.as_ptr()
    }

    /// Get the length of the embedding buffer.
    pub fn head_embedding_len(&self) -> usize {
        self.head_embedding.len()
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

    /// Seed the internal RNG used by the optimizer.
    pub fn set_rng_seed(&mut self, seed: u64) {
        self.rng_state = seed;
    }

    /// Get the current RNG seed/state.
    pub fn rng_seed(&self) -> u64 {
        self.rng_state
    }
}

/// Clip a value to be within [-clip_value, clip_value].
#[inline]
fn clip(x: f32, clip_value: f32) -> f32 {
    x.max(-clip_value).min(clip_value)
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

/// Perform a single optimization step for UMAP layout, in-place.
///
/// This function executes one epoch of the stochastic gradient descent algorithm
/// used to optimize the low-dimensional embedding. It processes attractive forces
/// between known neighbors and repulsive forces from negative samples.
#[inline]
fn optimize_layout_step_in_place_inner(state: &mut OptimizerState) {
    let clip_value: f32 = 4.0;
    let n = state.current_epoch;
    let mut rng_state = state.rng_state;
    
    // Process each edge
    let dim = state.dim;
    let alpha = state.alpha;
    let a = state.a;
    let b = state.b;
    let gamma = state.gamma;
    let n_vertices = state.n_vertices;
    let move_other = state.move_other;

    for i in 0..state.epochs_per_sample.len() {
        if state.epoch_of_next_sample[i] > n as f32 {
            continue;
        }
        
        let j = state.head[i];
        let k = state.tail[i];
        
        // Get current and other embedding vectors
        let current_start = j * dim;
        let other_start = k * dim;
        let dist_squared = {
            let mut result: f32 = 0.0;
            for d in 0..dim {
                let diff = state.head_embedding[current_start + d]
                    - state.tail_embedding[other_start + d];
                result += diff * diff;
            }
            result
        };
        
        // Compute attractive gradient
        let mut grad_coeff: f32 = 0.0;
        if dist_squared > 0.0 {
            grad_coeff = -2.0 * a * b * dist_squared.powf(b - 1.0);
            grad_coeff /= a * dist_squared.powf(b) + 1.0;
        }
        
        // Apply attractive force gradient
        for d in 0..dim {
            let current = state.head_embedding[current_start + d];
            let other = state.tail_embedding[other_start + d];
            let grad_d = clip(
                grad_coeff * (current - other),
                clip_value
            );
            state.head_embedding[current_start + d] += grad_d * alpha;
            if move_other {
                state.tail_embedding[other_start + d] -= grad_d * alpha;
            }
        }
        
        state.epoch_of_next_sample[i] += state.epochs_per_sample[i];
        
        // Process negative samples
        let n_neg_samples = ((n as f32 - state.epoch_of_next_negative_sample[i])
            / state.epochs_per_negative_sample[i])
            .floor() as usize;
        
        for _ in 0..n_neg_samples {
            let k_neg = tau_rand_int(n_vertices, &mut rng_state);
            let other_start_neg = k_neg * dim;
            
            let dist_squared = {
                let mut result: f32 = 0.0;
                for d in 0..dim {
                    let diff = state.head_embedding[current_start + d]
                        - state.tail_embedding[other_start_neg + d];
                    result += diff * diff;
                }
                result
            };
            
            // Compute repulsive gradient
            let mut grad_coeff: f32 = 0.0;
            if dist_squared > 0.0 {
                grad_coeff = 2.0 * gamma * b;
                grad_coeff /= (0.001 + dist_squared)
                    * (a * dist_squared.powf(b) + 1.0);
            } else if j == k_neg {
                continue;
            }
            
            // Apply repulsive force gradient
            for d in 0..dim {
                let current = state.head_embedding[current_start + d];
                let other = state.tail_embedding[other_start_neg + d];
                let grad_d = if grad_coeff > 0.0 {
                    clip(grad_coeff * (current - other), clip_value)
                } else {
                    4.0
                };
                state.head_embedding[current_start + d] += grad_d * alpha;
            }
        }
        
        state.epoch_of_next_negative_sample[i] += 
            n_neg_samples as f32 * state.epochs_per_negative_sample[i];
    }
    
    // Update learning rate
    state.alpha = state.initial_alpha * (1.0 - n as f32 / state.n_epochs as f32);
    state.current_epoch += 1;
    state.rng_state = rng_state;
}

/// Perform a single optimization step for UMAP layout.
///
/// # Arguments
/// * `state` - Mutable reference to the optimizer state
/// # Returns
/// The updated embedding as a flat vector
#[wasm_bindgen]
pub fn optimize_layout_step(state: &mut OptimizerState) -> Vec<f32> {
    optimize_layout_step_in_place_inner(state);
    state.head_embedding.clone()
}

/// Perform a single optimization step in place without cloning the embedding.
#[wasm_bindgen]
pub fn optimize_layout_step_in_place(state: &mut OptimizerState) {
    optimize_layout_step_in_place_inner(state);
}

/// Perform multiple optimization steps in a batch.
/// 
/// This function runs multiple epochs of optimization, which can be more
/// efficient than calling optimize_layout_step repeatedly due to reduced
/// JavaScript/WASM boundary crossings.
/// 
/// # Arguments
/// * `state` - Mutable reference to the optimizer state
/// * `n_steps` - Number of steps to perform
/// 
/// # Returns
/// The final embedding as a flat vector
#[wasm_bindgen]
pub fn optimize_layout_batch(
    state: &mut OptimizerState,
    n_steps: usize,
) -> Vec<f32> {
    for _ in 0..n_steps {
        if state.current_epoch >= state.n_epochs {
            break;
        }
        optimize_layout_step_in_place_inner(state);
    }
    state.head_embedding.clone()
}

/// Perform multiple optimization steps in place without cloning the embedding.
#[wasm_bindgen]
pub fn optimize_layout_batch_in_place(
    state: &mut OptimizerState,
    n_steps: usize,
) {
    for _ in 0..n_steps {
        if state.current_epoch >= state.n_epochs {
            break;
        }
        optimize_layout_step_in_place_inner(state);
    }
}
