/* tslint:disable */
/* eslint-disable */

/**
 * Compute the cosine distance between two vectors.
 * 
 * This function computes the cosine distance as 1 - (dot product / (norm_x * norm_y)).
 * Cosine distance measures the angle between vectors and ranges from 0 (identical direction)
 * to 2 (opposite directions).
 * 
 * # Arguments
 * * `x` - First vector as a slice of f64
 * * `y` - Second vector as a slice of f64
 * 
 * # Returns
 * The cosine distance as f64
 * 
 * # Special Cases
 * * If both vectors have zero norm, returns 0.0
 * * If either vector has zero norm, returns 1.0
 * 
 * # Panics
 * Panics if vectors have different lengths
 */
export function cosine(x: Float64Array, y: Float64Array): number;

/**
 * Compute the Euclidean distance between two vectors.
 * 
 * This function computes the standard L2 distance by summing the squared 
 * differences of corresponding elements and returning the square root.
 * 
 * # Arguments
 * * `x` - First vector as a slice of f64
 * * `y` - Second vector as a slice of f64
 * 
 * # Returns
 * The Euclidean distance as f64
 * 
 * # Panics
 * Panics if vectors have different lengths
 */
export function euclidean(x: Float64Array, y: Float64Array): number;

/**
 * Simple helper to ensure the wasm is loaded and working.
 */
export function version(): string;
