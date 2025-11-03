const { chromium } = require('playwright');

async function testLayerSelection() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const debugLogs = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: text
    };

    consoleLogs.push(logEntry);

    // Capture debug logs separately
    if (text.includes('🔵')) {
      debugLogs.push(logEntry);
      console.log(`\n[DEBUG] ${text}`);
    }
  });

  console.log('Step 1: Navigating to http://localhost:5175');
  await page.goto('http://localhost:5175');

  console.log('Step 2: Waiting for page to load');
  await page.waitForTimeout(3000);

  console.log('\nStep 3: Creating 3 rectangles');

  // Create Rectangle 1
  console.log('  - Creating Rectangle 1');
  await page.keyboard.press('r');
  await page.waitForTimeout(300);

  // Get the canvas element and click on it
  const canvas = await page.locator('canvas').first();
  const box = await canvas.boundingBox();

  if (box) {
    await page.mouse.click(box.x + 200, box.y + 200);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + 300, box.y + 300);
    await page.waitForTimeout(800);

    // Create Rectangle 2
    console.log('  - Creating Rectangle 2');
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + 400, box.y + 200);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + 500, box.y + 300);
    await page.waitForTimeout(800);

    // Create Rectangle 3
    console.log('  - Creating Rectangle 3');
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + 600, box.y + 200);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + 700, box.y + 300);
    await page.waitForTimeout(800);
  }

  console.log('\nStep 4: Opening Layer Panel');

  // Try to find and click the Layers button - look for SVG icon
  try {
    // Look for button containing "Layers" text
    const layersButton = page.locator('button').filter({ hasText: 'Layers' }).first();
    await layersButton.click();
    console.log('  - Layers button clicked');
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log('  - Could not find Layers button, trying alternative selector');
    await page.click('text=Layers');
    await page.waitForTimeout(1000);
  }

  console.log('\n--- LAYER SELECTION TEST ---\n');

  // Wait for layers to render
  await page.waitForTimeout(1000);

  // Find all layer items - they should be divs with the layer content
  // Looking at the LayerPanel code, layers are rendered as div elements with onClick handlers
  // Let's try to find them by looking for the layer name spans
  const layerItems = await page.locator('[draggable="true"]').all();
  console.log(`  - Found ${layerItems.length} draggable layer items`);

  if (layerItems.length === 0) {
    console.log('  - No layers found! Taking screenshot...');
    await page.screenshot({ path: 'debug-no-layers.png' });
  }

  if (layerItems.length >= 3) {
    // Get current activeLayerId from Zustand store
    const getActiveLayerId = async () => {
      return await page.evaluate(() => {
        // Access Zustand store from window
        return window.useAppStore?.getState?.()?.activeLayerId || 'N/A';
      });
    };

    console.log('\n--- BEFORE CLICKING ---');
    const initialActiveId = await getActiveLayerId();
    console.log(`Current activeLayerId: ${initialActiveId}\n`);

    console.log('Step 5: Clicking on second layer (Rectangle 2)');
    debugLogs.length = 0; // Clear debug logs
    await layerItems[1].click();
    await page.waitForTimeout(1000);
    const activeIdAfterFirst = await getActiveLayerId();
    console.log(`activeLayerId after click: ${activeIdAfterFirst}`);
    console.log('Debug logs from this click:');
    debugLogs.forEach(log => console.log(`  ${log.text}`));

    console.log('\n\nStep 6: Clicking on third layer (Rectangle 1)');
    debugLogs.length = 0;
    await layerItems[2].click();
    await page.waitForTimeout(1000);
    const activeIdAfterSecond = await getActiveLayerId();
    console.log(`activeLayerId after click: ${activeIdAfterSecond}`);
    console.log('Debug logs from this click:');
    debugLogs.forEach(log => console.log(`  ${log.text}`));

    console.log('\n\nStep 7: Clicking on first layer (Rectangle 3)');
    debugLogs.length = 0;
    await layerItems[0].click();
    await page.waitForTimeout(1000);
    const activeIdAfterThird = await getActiveLayerId();
    console.log(`activeLayerId after click: ${activeIdAfterThird}`);
    console.log('Debug logs from this click:');
    debugLogs.forEach(log => console.log(`  ${log.text}`));
  }

  console.log('\n\n--- FULL DEBUG LOG SUMMARY ---\n');
  const allDebugLogs = consoleLogs.filter(log => log.text.includes('🔵'));
  allDebugLogs.forEach(log => {
    console.log(`[${log.timestamp}] ${log.text}`);
  });

  console.log('\n--- TEST COMPLETE ---');
  console.log('\nBrowser will remain open for 60 seconds for inspection...');
  console.log('Taking final screenshot...');
  await page.screenshot({ path: 'final-state.png', fullPage: true });

  // Keep browser open for inspection
  await page.waitForTimeout(60000);

  await browser.close();
}

testLayerSelection().catch(console.error);
