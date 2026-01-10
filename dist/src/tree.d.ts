import { RandomFn, Vector, Vectors } from './umap';
import { WasmFlatTree } from './wasmBridge';
export declare class FlatTree {
    hyperplanes: number[][];
    offsets: number[];
    children: number[][];
    indices: number[][];
    private wasmTree?;
    constructor(hyperplanes: number[][], offsets: number[], children: number[][], indices: number[][]);
    static fromWasm(wasmTree: WasmFlatTree): FlatTree;
    getWasmTree(): WasmFlatTree | undefined;
    dispose(): void;
}
export declare function makeForest(data: Vectors, nNeighbors: number, nTrees: number, random: RandomFn, useWasm?: boolean): FlatTree[];
export declare function makeLeafArray(rpForest: FlatTree[]): number[][];
export declare function searchFlatTree(point: Vector, tree: FlatTree, random: RandomFn): number[];
