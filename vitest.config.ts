import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      'test/archived',
      'test/**/*.playwright.test.ts', // Exclude Playwright tests from Vitest
      'e2e',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'test',
        'dist',
        'lib',
        'wasm',
        '*.config.ts',
        '*.config.js',
      ],
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  esbuild: {
    target: 'node14',
  },
});
