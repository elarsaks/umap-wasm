# WASM Distance Functions

This document describes the distance functions implemented in Rust/WASM for performance optimization.

## Overview

The following distance functions have been ported to Rust and compiled to WebAssembly:

1. **Euclidean Distance** - Standard L2 distance metric
2. **Cosine Distance** - Angular distance between vectors

These are the simplest components of the UMAP algorithm to port and provide the foundation for further WASM optimization.

## Implementation Details

### Euclidean Distance

```rust
pub fn euclidean(x: &[f64], y: &[f64]) -> f64
```

Computes the Euclidean distance between two vectors by:
1. Summing the squared differences of corresponding elements
2. Returning the square root of the sum

Formula: `sqrt(Σ(xi - yi)²)`

### Cosine Distance

```rust
pub fn cosine(x: &[f64], y: &[f64]) -> f64
```

Computes the cosine distance as `1 - (dot product / (norm_x * norm_y))`.

Special cases handled:
- Both vectors zero: returns 0.0
- Either vector zero: returns 1.0

## Usage in TypeScript

```typescript
import { euclidean, cosine } from './wasm/pkg/umap_wasm_core.js';

// Create Float64Array vectors
const x = new Float64Array([1, 2, 3]);
const y = new Float64Array([4, 5, 6]);

// Calculate distances
const euclideanDist = euclidean(x, y);
const cosineDist = cosine(x, y);
```

## Performance Benefits

Distance calculations are among the most frequently called operations in UMAP:
- Called repeatedly during nearest neighbor search
- Called during graph optimization
- Simple enough to avoid significant WASM/JS boundary overhead

Even though these functions are simple, they represent:
- The foundational building blocks for UMAP
- A proof of concept for Rust/WASM integration
- The easiest components to port and verify

## Building

To rebuild the WASM module:

```bash
cd wasm
wasm-pack build --target bundler --out-dir pkg
```

## Testing

The distance functions match the behavior of their TypeScript counterparts:
- Same input/output values
- Same edge case handling
- Compatible with existing UMAP code

## Next Steps

After verifying these distance functions work correctly in the application:
1. Profile performance improvements
2. Identify next components to port (e.g., nearest neighbor search)
3. Gradually migrate more compute-intensive operations to WASM
