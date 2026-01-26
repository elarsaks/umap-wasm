#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '..', 'wasm', 'pkg', 'web', 'umap_wasm_core.js');

const source = fs.readFileSync(target, 'utf-8');
const pattern = /imports\.wbg\.(__wbg_new_no_args_[^=\s]+)\s*=\s*function\(arg0, arg1\) \{[\s\S]*?\n\s*\};/g;

const matches = source.match(pattern) || [];
if (matches.length === 0) {
  console.error('CSP patch failed: expected __wbg_new_no_args import not found.');
  process.exit(1);
}

const patched = source.replace(pattern, (_, name) => {
  return `imports.wbg.${name} = function(arg0, arg1) {
        const body = getStringFromWasm0(arg0, arg1);
        if (body === "return this" || body === "return globalThis") {
            return function() { return globalThis; };
        }
        throw new Error("CSP blocked Function constructor for: " + body);
    };`;
});
fs.writeFileSync(target, patched);
console.log('Patched wasm JS glue for CSP-safe global access.');
