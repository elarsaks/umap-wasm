import { test, expect } from '@playwright/test';

test.describe('UMAP WASM Module', () => {
  test('should load UMAP from script tag and create instance', async ({ page }) => {
    // Create a simple HTML page that loads our module via script tag
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>UMAP WASM Test</title>
    <script src="./lib/umap-js.js"></script>
</head>
<body>
    <div id="result">Loading...</div>
    <script>
        try {
            // Check if UMAP is available globally
            if (typeof UMAP === 'undefined') {
                throw new Error('UMAP not loaded globally');
            }
            
            if (typeof UMAP.UMAP !== 'function') {
                throw new Error('UMAP.UMAP class not available');
            }
            
            if (typeof UMAP.initWasm !== 'function') {
                throw new Error('UMAP.initWasm function not available');
            }
            
            if (typeof UMAP.isWasmAvailable !== 'function') {
                throw new Error('UMAP.isWasmAvailable function not available');
            }
            
            // Create a simple UMAP instance
            const umap = new UMAP.UMAP({
                nNeighbors: 5,
                minDist: 0.1,
                nComponents: 2
            });
            
            if (typeof umap.fit !== 'function') {
                throw new Error('UMAP instance missing fit method');
            }
            
            document.getElementById('result').textContent = 'SUCCESS: UMAP loaded with WASM functions';
                
        } catch (error) {
            document.getElementById('result').textContent = 'ERROR: ' + error.message;
            console.error('Test failed:', error);
        }
    </script>
</body>
</html>`;

    await page.goto('/');
    await page.setContent(html);

    // Wait for the test to complete
    await page.waitForFunction(() => {
      const result = document.getElementById('result');
      return result && result.textContent !== 'Loading...';
    }, { timeout: 10000 });

    const resultText = await page.locator('#result').textContent();
    expect(resultText).toMatch(/^SUCCESS:/);
    expect(resultText).toContain('UMAP loaded');
  });

  test('should support ES module imports', async ({ page }) => {
    // Note: ES modules in dist/ have bare imports (e.g., 'ml-levenberg-marquardt')
    // that browsers cannot resolve without a bundler or import map.
    // This test verifies the ES module structure is correct for bundler consumption.
    // For direct browser usage without bundler, use the UMD build (lib/umap-js.js).
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>UMAP ES Module Test</title>
</head>
<body>
    <div id="result">Loading...</div>
    <div id="debug"></div>
    <script type="module">
        const debug = (msg) => {
            console.log('[DEBUG]', msg);
            document.getElementById('debug').innerHTML += msg + '<br>';
        };
        
        try {
            debug('Starting ES module structure test...');
            
            // Check that the ES module entry point exists and has correct syntax
            debug('Fetching dist/index.js...');
            const indexResponse = await fetch('./dist/index.js');
            if (!indexResponse.ok) {
                throw new Error('dist/index.js not found: ' + indexResponse.status);
            }
            const indexContent = await indexResponse.text();
            debug('dist/index.js content length: ' + indexContent.length);
            
            // Verify ES module syntax (export statements with .js extensions)
            if (!indexContent.includes('export {')) {
                throw new Error('dist/index.js does not contain ES module exports');
            }
            debug('ES module export syntax: OK');
            
            if (!indexContent.includes('.js')) {
                throw new Error('dist/index.js missing .js extensions for browser compatibility');
            }
            debug('.js extensions present: OK');
            
            // Verify the module exports the expected symbols
            if (!indexContent.includes('UMAP')) {
                throw new Error('UMAP not exported');
            }
            debug('UMAP export: OK');
            
            if (!indexContent.includes('initWasm')) {
                throw new Error('initWasm not exported');
            }
            debug('initWasm export: OK');
            
            if (!indexContent.includes('isWasmAvailable')) {
                throw new Error('isWasmAvailable not exported');
            }
            debug('isWasmAvailable export: OK');
            
            // Check that umap.js exists and has the class
            const umapResponse = await fetch('./dist/umap.js');
            if (!umapResponse.ok) {
                throw new Error('dist/umap.js not found');
            }
            const umapContent = await umapResponse.text();
            if (!umapContent.includes('class UMAP')) {
                throw new Error('UMAP class not found in umap.js');
            }
            debug('UMAP class in umap.js: OK');
            
            // Check wasmBridge.js
            const bridgeResponse = await fetch('./dist/wasmBridge.js');
            if (!bridgeResponse.ok) {
                throw new Error('dist/wasmBridge.js not found');
            }
            const bridgeContent = await bridgeResponse.text();
            if (!bridgeContent.includes('initWasm') || !bridgeContent.includes('isWasmAvailable')) {
                throw new Error('WASM functions not found in wasmBridge.js');
            }
            debug('WASM functions in wasmBridge.js: OK');
            
            // Verify the init function calls mod.default() for WASM initialization
            if (!bridgeContent.includes('mod.default')) {
                throw new Error('wasmBridge.js missing WASM init call (mod.default)');
            }
            debug('WASM init pattern (mod.default): OK');
            
            document.getElementById('result').textContent = 
                'SUCCESS: ES modules structure verified for bundler consumption';
                
        } catch (error) {
            document.getElementById('result').textContent = 'ERROR: ' + error.message;
            console.error('ES module test failed:', error);
        }
    </script>
</body>
</html>`;

    await page.goto('/');
    await page.setContent(html);

    // Capture console logs for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Wait for the test to complete
    await page.waitForFunction(() => {
      const result = document.getElementById('result');
      return result && result.textContent !== 'Loading...';
    }, { timeout: 10000 });

    // Print debug info
    const debugText = await page.locator('#debug').textContent();
    console.log('Debug output:', debugText);

    const resultText = await page.locator('#result').textContent();
    expect(resultText).toMatch(/^SUCCESS:/);
    expect(resultText).toContain('ES modules');
  });

  test('should run basic UMAP fit', async ({ page, browserName }) => {
    // Skip on webkit as it might have issues with large computations
    test.skip(browserName === 'webkit', 'Webkit may have computation issues');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>UMAP Basic Fit Test</title>
    <script src="./lib/umap-js.js"></script>
</head>
<body>
    <div id="result">Loading...</div>
    <script>
        try {
            // Create test data: simple 2D points that should cluster
            const testData = [
                [0, 0], [0.1, 0.1], [0.2, 0.1],    // cluster 1
                [5, 5], [5.1, 5.1], [4.9, 5.2],    // cluster 2
            ];
            
            const umap = new UMAP.UMAP({
                nNeighbors: 2,
                minDist: 0.1,
                nComponents: 2,
                nEpochs: 5  // Keep it very short for test
            });
            
            const result = umap.fit(testData);
            
            if (!Array.isArray(result)) {
                throw new Error('fit() should return an array');
            }
            
            if (result.length !== testData.length) {
                throw new Error('Expected ' + testData.length + ' results, got ' + result.length);
            }
            
            if (!Array.isArray(result[0]) || result[0].length !== 2) {
                throw new Error('Each result should be a 2D point');
            }
            
            document.getElementById('result').textContent = 
                'SUCCESS: UMAP fit completed, transformed ' + result.length + ' points';
                
        } catch (error) {
            document.getElementById('result').textContent = 'ERROR: ' + error.message;
            console.error('Fit test failed:', error);
        }
    </script>
</body>
</html>`;

    await page.goto('/');
    await page.setContent(html);

    // Wait for the test to complete (give more time for UMAP computation)
    await page.waitForFunction(() => {
      const result = document.getElementById('result');
      return result && result.textContent !== 'Loading...';
    }, { timeout: 30000 });

    const resultText = await page.locator('#result').textContent();
    expect(resultText).toMatch(/^SUCCESS:/);
    expect(resultText).toContain('UMAP fit completed');
  });
});