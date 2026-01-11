import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  module: {
    rules: [
      {
        test: /(\.ts$|\.js$)/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js'],  // Allow .js imports to resolve to .ts files
    },
  },
  entry: {
    lib: path.resolve(__dirname, '../src/lib.ts'),
  },
  output: {
    library: 'UMAP',
    filename: 'umap-js.js',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, '../lib'),
    globalObject: 'this'
  },
  optimization: { minimize: false },
  externals: {
    // Exclude WASM module from bundling - loaded at runtime
    '../wasm/pkg/umap_wasm_core.js': 'commonjs ../wasm/pkg/umap_wasm_core.js',
  },
};
