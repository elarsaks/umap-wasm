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
            
            // Create a simple UMAP instance
            const umap = new UMAP.UMAP({
                nNeighbors: 5,
                minDist: 0.1,
                nComponents: 2
            });
            
            if (typeof umap.fit !== 'function') {
                throw new Error('UMAP instance missing fit method');
            }
            
            document.getElementById('result').textContent = 'SUCCESS: UMAP loaded and instance created';
                
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