# UMAP-WASM: WebAssembly-Accelerated UMAP for JavaScript

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A high-performance implementation of Uniform Manifold Approximation and Projection (UMAP) for JavaScript environments, featuring selective WebAssembly acceleration for compute-intensive operations.

## 📚 Academic Context

This project is part of a master's thesis:

**Title:** *WebAssembly-Accelerated UMAP for Browser Environments*  
**Author:** Elar Saks  
**Institution:** Tampere University of Applied Sciences (TAMK)  
**Year:** 2026

### Research Objectives

The thesis investigates hybrid JavaScript/WebAssembly architectures for scientific computing in browsers, specifically:

- **Performance Analysis**: Quantifying speedup gains from selective Rust/WASM compilation of hot-path computational kernels
- **Interoperability Patterns**: Evaluating efficient data marshalling between JavaScript and WebAssembly memory spaces
- **Practical Implementation**: Maintaining API compatibility while optimizing performance-critical components
- **Trade-off Analysis**: Assessing development complexity, bundle size, and runtime performance improvements

## 🎯 Overview

Uniform Manifold Approximation and Projection (UMAP) is a dimension reduction technique used for visualization and general non-linear dimension reduction, offering advantages over t-SNE in speed and preservation of global structure.

This implementation builds upon the PAIR-code `umap-js` library with strategic WebAssembly optimizations for:
- Distance computations (implemented in Rust: `distances.rs`)
- Nearest neighbour search (random projection trees) (implemented in Rust: `tree.rs`)
- Matrix operations in optimization loops (implemented in Rust: `matrix.rs`)
- Nearest‑neighbour graph refinement (NN‑Descent) *(TODO — JS implementation currently used)*
- Gradient‑descent layout optimisation *(TODO — optimizer currently runs in JS)*

### Key Features

- **Hybrid Architecture**: JavaScript implementation with optional WASM acceleration for hot paths
- **API Compatibility**: Drop-in replacement for standard `umap-js` usage patterns
- **Flexible Execution**: Synchronous, asynchronous, and step-by-step fitting modes
- **Supervised Learning**: Support for label-based projection
- **Transform Capability**: Project new points into existing embeddings

## 🏆 Attribution & Lineage

This project is a research fork that extends the original UMAP implementations:

### Upstream JavaScript Implementation
- **Project**: [umap-js](https://github.com/PAIR-code/umap-js)
- **Maintainer**: PAIR (People + AI Research) at Google
- **License**: Apache 2.0

### Original UMAP Algorithm
- **Project**: [umap](https://github.com/lmcinnes/umap)  
- **Authors**: Leland McInnes, John Healy, James Melville
- **Reference**: McInnes, L., Healy, J., & Melville, J. (2018). UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction. *arXiv preprint arXiv:1802.03426*.

**Credit**: The core UMAP algorithm implementation and JavaScript port are the work of the original and upstream authors. This thesis project focuses exclusively on performance optimization through selective WebAssembly compilation.

## ⚡ Implementation Notes

### Differences from Python UMAP

- **Initialization**: Uses random embedding initialization instead of spectral embedding (eigenvalue computations are computationally prohibitive in JavaScript)
- **Sparse Data**: No specialized sparse data structures (may be addressed in future work)
- **Angular Distances**: Not currently implemented

These differences result in comparable quality for most use cases, with the random initialization performing well on small to medium datasets.

## 📦 Installation

```bash
npm install umap-wasm
# or
yarn add umap-wasm
```

## 🚀 Usage

### Basic Usage (Synchronous)

```javascript
import { UMAP } from 'umap-wasm';

const umap = new UMAP({
  nComponents: 2,
  nNeighbors: 15,
  minDist: 0.1
});

const embedding = umap.fit(data);
```

### Asynchronous Fitting with Progress Tracking

```javascript
import { UMAP } from 'umap-wasm';

const umap = new UMAP();
const embedding = await umap.fitAsync(data, epochNumber => {
  console.log(`Epoch ${epochNumber} complete`);
  // Return false to stop early if needed
  return true;
});
```

### Step-by-Step Fitting

For fine-grained control over the optimization process:

```javascript
import { UMAP } from 'umap-wasm';

const umap = new UMAP();
const nEpochs = umap.initializeFit(data);

for (let i = 0; i < nEpochs; i++) {
  umap.step();
  // Update UI, check convergence, etc.
}

const embedding = umap.getEmbedding();
```

### Supervised Projection

Use label information to guide the embedding:

```javascript
import { UMAP } from 'umap-wasm';

const labels = [0, 0, 1, 1, 2, 2]; // Category labels for each data point
const umap = new UMAP();
umap.setSupervisedProjection(labels);
const embedding = umap.fit(data);
```

### Transforming New Points

Project additional data points into an existing embedding space:

```javascript
import { UMAP } from 'umap-wasm';

const umap = new UMAP();
const embedding = umap.fit(trainingData);

// Transform new points into the same embedding space
const newEmbedding = umap.transform(newData);
```

## 🔧 Configuration Parameters

The UMAP constructor accepts a `UMAPParameters` object with the following options:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `nComponents` | `number` | `2` | Target dimensionality of the embedding |
| `nNeighbors` | `number` | `15` | Number of nearest neighbors for manifold approximation |
| `nEpochs` | `number` | *auto* | Number of optimization iterations (computed if not specified) |
| `minDist` | `number` | `0.1` | Minimum distance between embedded points |
| `spread` | `number` | `1.0` | Effective scale of embedded points |
| `random` | `() => number` | `Math.random` | PRNG for reproducibility |
| `distanceFn` | `DistanceFn` | `euclidean` | Distance metric for input space |
| `useWasmDistance` | `boolean` | `false` | Whether to use Rust/WASM distance functions when available |
| `useWasmTree` | `boolean` | `false` | Whether to use Rust/WASM random projection tree construction when available |
| `useWasmMatrix` | `boolean` | `false` | Whether to use Rust/WASM sparse matrix operations when available |

### WASM Components & Status

The project exposes configuration flags to selectively enable WASM-accelerated components. The table below maps the high-level operations to the available configuration flags and current implementation status.

| Component | Config Flag | Status | Notes |
|-----------|-------------|--------|-------|
| Distance computations | `useWasmDistance` | Implemented | WASM provides `euclidean` and `cosine` implementations (via `wasmBridge`). These are implemented in `distances.rs`.
| Nearest neighbour search (random projection trees) | `useWasmTree` | Implemented | WASM-accelerated random projection tree construction is available and can be enabled with `useWasmTree` (see `tree.rs`).
| Matrix operations in optimization loops | `useWasmMatrix` | Implemented | Sparse-matrix operations (transpose, element-wise ops, CSR conversion, normalization) are implemented in WASM (see `matrix.rs`).
| Nearest‑neighbour graph refinement (NN‑Descent) | — | TODO | NN‑Descent (graph refinement / approximate nearest neighbours) currently uses the JS implementation; WASM integration is planned.
| Gradient‑descent layout optimisation | — | TODO | The optimization loop runs in JS; a WASM-accelerated optimizer is under investigation.


### Example with Custom Parameters

```typescript
import { UMAP } from 'umap-wasm';

const umap = new UMAP({
  nComponents: 3,          // 3D embedding
  nNeighbors: 30,          // Larger neighborhood
  minDist: 0.3,            // More spread out
  spread: 2.0,             // Wider scale
  nEpochs: 500,            // More optimization steps
  random: seedrandom('42') // Reproducible results
});
```

## 🛠️ Development

### Prerequisites

- **Node.js** 18+ and **Yarn** 4.12.0
- **Rust** toolchain with `wasm32-unknown-unknown` target
- **wasm-pack** for WebAssembly builds

### Setup

```bash
# Install dependencies
yarn install

# Install Rust target (if not already installed)
rustup target add wasm32-unknown-unknown

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### Build Commands

```bash
# Build TypeScript and bundle
yarn build

# Build WebAssembly module
yarn build:wasm

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage
```

### Project Structure

```
umap-wasm/
├── src/               # TypeScript implementation
│   ├── umap.ts       # Main UMAP class
│   ├── matrix.ts     # Matrix operations
│   ├── tree.ts       # KD-tree for nearest neighbors
│   └── wasmBridge.ts # WASM interop layer
├── wasm/             # Rust/WASM implementation
│   ├── src/          # Rust source code
│   └── pkg/          # Built WASM artifacts
├── test/             # Test suites
└── lib/              # Output bundles
```

### WebAssembly Development

The Rust core is located in the `wasm/` directory. To modify WASM components:

```bash
cd wasm
cargo build --target wasm32-unknown-unknown
wasm-pack build --target web
```

The build artifacts are generated in `wasm/pkg/` and consumed by the TypeScript bridge.

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run specific test suite
yarn test matrix.test.ts

# Watch mode for development
yarn test --watch
```

## 📊 Benchmarking

Performance benchmarks are available in the companion `umap-bench` repository, which includes:

- Comparative analysis (pure JS vs WASM-accelerated)
- Dataset size scaling tests
- Browser compatibility tests
- Memory profiling

See [../umap-bench/README.md](../umap-bench/README.md) for details.

## 🤝 Contributing

This is a thesis research project with specific academic goals. While external contributions are not actively solicited during the research phase, feedback and bug reports are welcome.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

This project inherits the Apache 2.0 license from the upstream `umap-js` project.

## 📚 References

### Academic Publications

1. **McInnes, L., Healy, J., & Melville, J.** (2018). UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction. *arXiv preprint arXiv:1802.03426*. [https://arxiv.org/abs/1802.03426](https://arxiv.org/abs/1802.03426)

2. **McInnes, L., & Healy, J.** (2017). Accelerated Hierarchical Density Based Clustering. *IEEE International Conference on Data Mining Workshops (ICDMW)*, 33-42.

### Related Projects

- **umap-js**: [https://github.com/PAIR-code/umap-js](https://github.com/PAIR-code/umap-js)
- **umap (Python)**: [https://github.com/lmcinnes/umap](https://github.com/lmcinnes/umap)
- **UMAP Documentation**: [https://umap-learn.readthedocs.io/](https://umap-learn.readthedocs.io/)

## 🙏 Acknowledgments

- **PAIR team at Google** for the original JavaScript implementation
- **Leland McInnes** and collaborators for the UMAP algorithm
- **TAMK** thesis advisors and reviewers

## 📧 Contact

For thesis-related inquiries or research collaboration:

**Elar Saks**  
Master's Thesis Project  
Tampere University of Applied Sciences

---

*This README is maintained as part of academic research. Last updated: January 2026*
