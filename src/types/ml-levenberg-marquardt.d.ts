/**
 * Minimal TypeScript declaration for the `ml-levenberg-marquardt` package.
 *
 * The upstream package ships modern ESM builds in recent major versions which
 * Jest (and this project's test runtime) may not transform by default. Tests
 * in this repository expect a simple CommonJS-compatible API. To avoid a
 * runtime parse error and to satisfy the TypeScript compiler we provide a
 * focused declaration matching the usage in `src/umap.ts`:
 *
 *   - `lm(data, model, options)` where `model` is a function that accepts a
 *     parameter vector and returns a function which maps an `x` value to a
 *     numeric prediction: `(params) => (x) => number`.
 *
 * This file intentionally keeps the types loose (`any`) for the parameter
 * vector because the upstream library accepts arrays of varying shapes and
 * this project only reads the numeric `parameterValues` result.
 */
declare module 'ml-levenberg-marquardt' {
  type ModelFunction = (params: any) => (x: number) => number;
  export default function lm(
    data: { x: number[]; y: number[] },
    model: ModelFunction,
    options?: any
  ): { parameterValues: number[] };
}
