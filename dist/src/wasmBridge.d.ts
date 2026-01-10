export declare function initWasm(): Promise<any>;
export declare function isWasmAvailable(): boolean;
export declare function euclideanWasm(x: number[], y: number[]): any;
export declare function cosineWasm(x: number[], y: number[]): any;
export interface WasmFlatTree {
    hyperplanes(): Float64Array;
    offsets(): Float64Array;
    children(): Int32Array;
    indices(): Int32Array;
    dim(): number;
    n_nodes(): number;
    free(): void;
}
export declare function buildRpTreeWasm(data: number[][], nSamples: number, dim: number, leafSize: number, seed: number): WasmFlatTree;
export declare function searchFlatTreeWasm(tree: WasmFlatTree, point: number[], seed: number): number[];
export declare function wasmTreeToJs(wasmTree: WasmFlatTree): {
    hyperplanes: number[][];
    offsets: number[];
    children: number[][];
    indices: number[][];
};
export interface WasmSparseMatrix {
    n_rows: number;
    n_cols: number;
    set(row: number, col: number, value: number): void;
    get(row: number, col: number, defaultValue: number): number;
    get_dims(): number[];
    get_rows(): Int32Array;
    get_cols(): Int32Array;
    get_values(): Float64Array;
    get_all_ordered(): Float64Array;
    nnz(): number;
    to_array(): Float64Array;
    map_scalar(operation: string, scalar: number): WasmSparseMatrix;
    free(): void;
}
export declare function createSparseMatrixWasm(rows: number[], cols: number[], values: number[], nRows: number, nCols: number): WasmSparseMatrix;
export declare function sparseTransposeWasm(matrix: WasmSparseMatrix): WasmSparseMatrix;
export declare function sparseIdentityWasm(size: number): WasmSparseMatrix;
export declare function sparseAddWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix;
export declare function sparseSubtractWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix;
export declare function sparsePairwiseMultiplyWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix;
export declare function sparseMaximumWasm(a: WasmSparseMatrix, b: WasmSparseMatrix): WasmSparseMatrix;
export declare function sparseMultiplyScalarWasm(matrix: WasmSparseMatrix, scalar: number): WasmSparseMatrix;
export declare function sparseEliminateZerosWasm(matrix: WasmSparseMatrix): WasmSparseMatrix;
export declare function sparseNormalizeWasm(matrix: WasmSparseMatrix, normType?: string): WasmSparseMatrix;
export declare function sparseGetCSRWasm(matrix: WasmSparseMatrix): {
    indices: number[];
    values: number[];
    indptr: number[];
};
export declare function wasmSparseMatrixToArray(matrix: WasmSparseMatrix): number[][];
export declare function wasmSparseMatrixGetAll(matrix: WasmSparseMatrix): {
    value: number;
    row: number;
    col: number;
}[];
