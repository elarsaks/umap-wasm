use wasm_bindgen::prelude::*;

#[cfg(feature = "allocator")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Simple helper to ensure the wasm is loaded and working.
#[wasm_bindgen]
pub fn version() -> String {
    "umap-wasm core 0.1.0".to_string()
}

/// Compute the Euclidean distance between two vectors.
/// 
/// This function computes the standard L2 distance by summing the squared 
/// differences of corresponding elements and returning the square root.
/// 
/// # Arguments
/// * `x` - First vector as a slice of f64
/// * `y` - Second vector as a slice of f64
/// 
/// # Returns
/// The Euclidean distance as f64
/// 
/// # Panics
/// Panics if vectors have different lengths
#[wasm_bindgen]
pub fn euclidean(x: &[f64], y: &[f64]) -> f64 {
    assert_eq!(x.len(), y.len(), "Vectors must have the same length");
    
    let mut result = 0.0;
    for i in 0..x.len() {
        let diff = x[i] - y[i];
        result += diff * diff;
    }
    result.sqrt()
}

/// Compute the cosine distance between two vectors.
/// 
/// This function computes the cosine distance as 1 - (dot product / (norm_x * norm_y)).
/// Cosine distance measures the angle between vectors and ranges from 0 (identical direction)
/// to 2 (opposite directions).
/// 
/// # Arguments
/// * `x` - First vector as a slice of f64
/// * `y` - Second vector as a slice of f64
/// 
/// # Returns
/// The cosine distance as f64
/// 
/// # Special Cases
/// * If both vectors have zero norm, returns 0.0
/// * If either vector has zero norm, returns 1.0
/// 
/// # Panics
/// Panics if vectors have different lengths
#[wasm_bindgen]
pub fn cosine(x: &[f64], y: &[f64]) -> f64 {
    assert_eq!(x.len(), y.len(), "Vectors must have the same length");
    
    let mut dot_product = 0.0;
    let mut norm_x = 0.0;
    let mut norm_y = 0.0;
    
    for i in 0..x.len() {
        dot_product += x[i] * y[i];
        norm_x += x[i] * x[i];
        norm_y += y[i] * y[i];
    }
    
    if norm_x == 0.0 && norm_y == 0.0 {
        return 0.0;
    } else if norm_x == 0.0 || norm_y == 0.0 {
        return 1.0;
    } else {
        1.0 - dot_product / (norm_x.sqrt() * norm_y.sqrt())
    }
}
