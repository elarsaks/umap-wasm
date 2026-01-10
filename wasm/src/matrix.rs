use wasm_bindgen::prelude::*;
use js_sys::{Float64Array, Int32Array};
use std::collections::HashMap;

/// Internal 2-dimensional sparse matrix class implemented in Rust/WASM.
/// 
/// This mirrors the JavaScript SparseMatrix class for efficient sparse matrix
/// operations in WebAssembly.
#[wasm_bindgen]
pub struct WasmSparseMatrix {
    entries: HashMap<String, (f64, i32, i32)>, // (value, row, col)
    n_rows: usize,
    n_cols: usize,
}

#[wasm_bindgen]
impl WasmSparseMatrix {
    /// Create a new sparse matrix from rows, cols, values, and dimensions.
    /// 
    /// # Arguments
    /// * `rows` - Row indices for each value
    /// * `cols` - Column indices for each value
    /// * `values` - The values to store
    /// * `n_rows` - Number of rows in the matrix
    /// * `n_cols` - Number of columns in the matrix
    #[wasm_bindgen(constructor)]
    pub fn new(
        rows: &[i32],
        cols: &[i32],
        values: &[f64],
        n_rows: usize,
        n_cols: usize,
    ) -> Result<WasmSparseMatrix, JsValue> {
        if rows.len() != cols.len() || rows.len() != values.len() {
            return Err(JsValue::from_str(
                "rows, cols and values arrays must all have the same length",
            ));
        }

        let mut entries = HashMap::new();

        for i in 0..values.len() {
            let row = rows[i];
            let col = cols[i];

            if row as usize >= n_rows || col as usize >= n_cols {
                return Err(JsValue::from_str(
                    "row and/or col specified outside of matrix dimensions",
                ));
            }

            let key = make_key(row, col);
            entries.insert(key, (values[i], row, col));
        }

        Ok(WasmSparseMatrix {
            entries,
            n_rows,
            n_cols,
        })
    }

    /// Get the number of rows
    #[wasm_bindgen(getter)]
    pub fn n_rows(&self) -> usize {
        self.n_rows
    }

    /// Get the number of columns
    #[wasm_bindgen(getter)]
    pub fn n_cols(&self) -> usize {
        self.n_cols
    }

    /// Set a value at the given row and column
    pub fn set(&mut self, row: i32, col: i32, value: f64) -> Result<(), JsValue> {
        if row as usize >= self.n_rows || col as usize >= self.n_cols {
            return Err(JsValue::from_str(
                "row and/or col specified outside of matrix dimensions",
            ));
        }

        let key = make_key(row, col);
        self.entries.insert(key, (value, row, col));
        Ok(())
    }

    /// Get a value at the given row and column, with a default value if not present
    pub fn get(&self, row: i32, col: i32, default_value: f64) -> Result<f64, JsValue> {
        if row as usize >= self.n_rows || col as usize >= self.n_cols {
            return Err(JsValue::from_str(
                "row and/or col specified outside of matrix dimensions",
            ));
        }

        let key = make_key(row, col);
        Ok(self.entries.get(&key).map(|(v, _, _)| *v).unwrap_or(default_value))
    }

    /// Get the dimensions as [nRows, nCols]
    pub fn get_dims(&self) -> Vec<usize> {
        vec![self.n_rows, self.n_cols]
    }

    /// Get all row indices
    pub fn get_rows(&self) -> Int32Array {
        let rows: Vec<i32> = self.entries.values().map(|(_, r, _)| *r).collect();
        Int32Array::from(&rows[..])
    }

    /// Get all column indices
    pub fn get_cols(&self) -> Int32Array {
        let cols: Vec<i32> = self.entries.values().map(|(_, _, c)| *c).collect();
        Int32Array::from(&cols[..])
    }

    /// Get all values
    pub fn get_values(&self) -> Float64Array {
        let values: Vec<f64> = self.entries.values().map(|(v, _, _)| *v).collect();
        Float64Array::from(&values[..])
    }

    /// Get all entries as flat arrays [rows, cols, values] - ordered by row then col
    pub fn get_all_ordered(&self) -> Vec<f64> {
        let mut entries: Vec<(i32, i32, f64)> = self
            .entries
            .values()
            .map(|(v, r, c)| (*r, *c, *v))
            .collect();

        // Sort by row, then by col
        entries.sort_by(|a, b| {
            if a.0 == b.0 {
                a.1.cmp(&b.1)
            } else {
                a.0.cmp(&b.0)
            }
        });

        // Return as flat array: [row0, col0, val0, row1, col1, val1, ...]
        let mut result = Vec::with_capacity(entries.len() * 3);
        for (r, c, v) in entries {
            result.push(r as f64);
            result.push(c as f64);
            result.push(v);
        }
        result
    }

    /// Get number of non-zero entries
    pub fn nnz(&self) -> usize {
        self.entries.len()
    }

    /// Convert to dense 2D array (row-major, flattened)
    pub fn to_array(&self) -> Float64Array {
        let mut output = vec![0.0; self.n_rows * self.n_cols];

        for (value, row, col) in self.entries.values() {
            output[*row as usize * self.n_cols + *col as usize] = *value;
        }

        Float64Array::from(&output[..])
    }

    /// Apply a scalar operation to all values (map with scalar)
    pub fn map_scalar(&self, operation: &str, scalar: f64) -> Result<WasmSparseMatrix, JsValue> {
        let mut new_entries = HashMap::new();

        for (key, (value, row, col)) in &self.entries {
            let new_value = match operation {
                "add" => value + scalar,
                "subtract" => value - scalar,
                "multiply" => value * scalar,
                "divide" => value / scalar,
                _ => return Err(JsValue::from_str("Unknown operation")),
            };
            new_entries.insert(key.clone(), (new_value, *row, *col));
        }

        Ok(WasmSparseMatrix {
            entries: new_entries,
            n_rows: self.n_rows,
            n_cols: self.n_cols,
        })
    }
}

/// Helper function to create a key from row and column
fn make_key(row: i32, col: i32) -> String {
    format!("{}:{}", row, col)
}

// ============================================================================
// Standalone matrix operations (functions that operate on matrices)
// ============================================================================

/// Transpose a sparse matrix
#[wasm_bindgen]
pub fn sparse_transpose(matrix: &WasmSparseMatrix) -> WasmSparseMatrix {
    let mut new_entries = HashMap::new();

    for (_, (value, row, col)) in &matrix.entries {
        let key = make_key(*col, *row); // Swap row and col
        new_entries.insert(key, (*value, *col, *row));
    }

    WasmSparseMatrix {
        entries: new_entries,
        n_rows: matrix.n_cols,
        n_cols: matrix.n_rows,
    }
}

/// Create a sparse identity matrix
#[wasm_bindgen]
pub fn sparse_identity(size: usize) -> WasmSparseMatrix {
    let mut entries = HashMap::new();

    for i in 0..size {
        let key = make_key(i as i32, i as i32);
        entries.insert(key, (1.0, i as i32, i as i32));
    }

    WasmSparseMatrix {
        entries,
        n_rows: size,
        n_cols: size,
    }
}

/// Element-wise addition of two sparse matrices
#[wasm_bindgen]
pub fn sparse_add(a: &WasmSparseMatrix, b: &WasmSparseMatrix) -> WasmSparseMatrix {
    element_wise(a, b, |x, y| x + y)
}

/// Element-wise subtraction of two sparse matrices
#[wasm_bindgen]
pub fn sparse_subtract(a: &WasmSparseMatrix, b: &WasmSparseMatrix) -> WasmSparseMatrix {
    element_wise(a, b, |x, y| x - y)
}

/// Element-wise multiplication of two sparse matrices
#[wasm_bindgen]
pub fn sparse_pairwise_multiply(a: &WasmSparseMatrix, b: &WasmSparseMatrix) -> WasmSparseMatrix {
    element_wise(a, b, |x, y| x * y)
}

/// Element-wise maximum of two sparse matrices
#[wasm_bindgen]
pub fn sparse_maximum(a: &WasmSparseMatrix, b: &WasmSparseMatrix) -> WasmSparseMatrix {
    element_wise(a, b, |x, y| if x > y { x } else { y })
}

/// Scalar multiplication of a sparse matrix
#[wasm_bindgen]
pub fn sparse_multiply_scalar(a: &WasmSparseMatrix, scalar: f64) -> WasmSparseMatrix {
    let mut new_entries = HashMap::new();

    for (key, (value, row, col)) in &a.entries {
        new_entries.insert(key.clone(), (value * scalar, *row, *col));
    }

    WasmSparseMatrix {
        entries: new_entries,
        n_rows: a.n_rows,
        n_cols: a.n_cols,
    }
}

/// Remove zero entries from a sparse matrix
#[wasm_bindgen]
pub fn sparse_eliminate_zeros(m: &WasmSparseMatrix) -> WasmSparseMatrix {
    let mut new_entries = HashMap::new();

    for (key, (value, row, col)) in &m.entries {
        if *value != 0.0 {
            new_entries.insert(key.clone(), (*value, *row, *col));
        }
    }

    WasmSparseMatrix {
        entries: new_entries,
        n_rows: m.n_rows,
        n_cols: m.n_cols,
    }
}

/// Normalize a sparse matrix (l2 normalization by row)
#[wasm_bindgen]
pub fn sparse_normalize(m: &WasmSparseMatrix, norm_type: &str) -> WasmSparseMatrix {
    // Group entries by row
    let mut cols_by_row: HashMap<i32, Vec<(i32, f64)>> = HashMap::new();

    for (_, (value, row, col)) in &m.entries {
        cols_by_row.entry(*row).or_default().push((*col, *value));
    }

    let mut new_entries = HashMap::new();

    for (row, cols) in cols_by_row {
        let vals: Vec<f64> = cols.iter().map(|(_, v)| *v).collect();
        let normalized = match norm_type {
            "max" => norm_max(&vals),
            "l1" => norm_l1(&vals),
            "l2" => norm_l2(&vals),
            _ => norm_l2(&vals), // Default to l2
        };

        for (i, (col, _)) in cols.iter().enumerate() {
            let key = make_key(row, *col);
            new_entries.insert(key, (normalized[i], row, *col));
        }
    }

    WasmSparseMatrix {
        entries: new_entries,
        n_rows: m.n_rows,
        n_cols: m.n_cols,
    }
}

/// Get CSR representation of a sparse matrix
/// Returns flat array: [indices..., values..., indptr...]
/// With counts at the start: [n_indices, n_values, n_indptr, indices..., values..., indptr...]
#[wasm_bindgen]
pub fn sparse_get_csr(m: &WasmSparseMatrix) -> Float64Array {
    let mut entries: Vec<(i32, i32, f64)> = m
        .entries
        .values()
        .map(|(v, r, c)| (*r, *c, *v))
        .collect();

    // Sort by row, then by col
    entries.sort_by(|a, b| {
        if a.0 == b.0 {
            a.1.cmp(&b.1)
        } else {
            a.0.cmp(&b.0)
        }
    });

    let mut indices: Vec<i32> = Vec::new();
    let mut values: Vec<f64> = Vec::new();
    let mut indptr: Vec<i32> = Vec::new();

    let mut current_row: i32 = -1;

    for (i, (row, col, value)) in entries.iter().enumerate() {
        if *row != current_row {
            current_row = *row;
            indptr.push(i as i32);
        }
        indices.push(*col);
        values.push(*value);
    }

    // Encode as: [n_indices, n_values, n_indptr, indices..., values..., indptr...]
    let mut result = Vec::with_capacity(3 + indices.len() + values.len() + indptr.len());
    result.push(indices.len() as f64);
    result.push(values.len() as f64);
    result.push(indptr.len() as f64);

    for idx in &indices {
        result.push(*idx as f64);
    }
    for val in &values {
        result.push(*val);
    }
    for ptr in &indptr {
        result.push(*ptr as f64);
    }

    Float64Array::from(&result[..])
}

// ============================================================================
// Internal helper functions
// ============================================================================

/// Element-wise operation helper
fn element_wise<F>(a: &WasmSparseMatrix, b: &WasmSparseMatrix, op: F) -> WasmSparseMatrix
where
    F: Fn(f64, f64) -> f64,
{
    let mut visited = std::collections::HashSet::new();
    let mut new_entries = HashMap::new();

    // Process entries from matrix A
    for (key, (value_a, row, col)) in &a.entries {
        visited.insert(key.clone());
        let value_b = b
            .entries
            .get(key)
            .map(|(v, _, _)| *v)
            .unwrap_or(0.0);
        let new_value = op(*value_a, value_b);
        new_entries.insert(key.clone(), (new_value, *row, *col));
    }

    // Process remaining entries from matrix B
    for (key, (value_b, row, col)) in &b.entries {
        if visited.contains(key) {
            continue;
        }
        let value_a = 0.0;
        let new_value = op(value_a, *value_b);
        new_entries.insert(key.clone(), (new_value, *row, *col));
    }

    WasmSparseMatrix {
        entries: new_entries,
        n_rows: a.n_rows,
        n_cols: a.n_cols,
    }
}

/// Max normalization
fn norm_max(vals: &[f64]) -> Vec<f64> {
    let max = vals.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    if max == 0.0 {
        return vals.to_vec();
    }
    vals.iter().map(|x| x / max).collect()
}

/// L1 normalization
fn norm_l1(vals: &[f64]) -> Vec<f64> {
    let sum: f64 = vals.iter().sum();
    if sum == 0.0 {
        return vals.to_vec();
    }
    vals.iter().map(|x| x / sum).collect()
}

/// L2 normalization
fn norm_l2(vals: &[f64]) -> Vec<f64> {
    let sum_sq: f64 = vals.iter().map(|x| x * x).sum();
    if sum_sq == 0.0 {
        return vals.to_vec();
    }
    vals.iter().map(|x| (x * x / sum_sq).sqrt()).collect()
}
