const { chromium } = require('playwright');

async function simpleDebug() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
  });

  console.log('Navigating to http://localhost:5175');
  await page.goto('http://localhost:5175');
  await page.waitForTimeout(3000);

  console.log('\n=== Creating 3 rectangles ===');
  const canvas = await page.locator('canvas').first();
  const box = await canvas.boundingBox();

  if (box) {
    // Rectangle 1
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + 200, box.y + 200);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + 300, box.y + 300);
    await page.waitForTimeout(800);

    // Rectangle 2
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + 400, box.y + 200);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + 500, box.y + 300);
    await page.waitForTimeout(800);

    // Rectangle 3
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + 600, box.y + 200);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + 700, box.y + 300);
    await page.waitForTimeout(800);
  }

  console.log('\n=== Opening Layer Panel ===');
  const layersButton = page.locator('button').filter({ hasText: 'Layers' }).first();
  await layersButton.click();
  await page.waitForTimeout(1000);

  console.log('\n=== Finding layer elements ===');
  const draggableItems = await page.locator('[draggable="true"]').all();
  console.log(`Found ${draggableItems.length} draggable items`);

  // Get text content of each layer
  for (let i = 0; i < draggableItems.length; i++) {
    const text = await draggableItems[i].textContent();
    console.log(`Layer ${i}: ${text?.substring(0, 100)}...`);
  }

  console.log('\n=== Testing first layer click ===');
  console.log('About to click layer 0...');
  await draggableItems[0].click();
  console.log('Clicked layer 0, waiting 2 seconds...');
  await page.waitForTimeout(2000);

  console.log('\n=== Testing second layer click ===');
  console.log('About to click layer 1...');
  await draggableItems[1].click();
  console.log('Clicked layer 1, waiting 2 seconds...');
  await page.waitForTimeout(2000);

  console.log('\n=== Taking screenshot ===');
  await page.screenshot({ path: 'simple-debug.png', fullPage: true });

  console.log('\n=== Checking page state ===');

  // Try to get layer info from the page
  const layerInfo = await page.evaluate(() => {
    // Try different ways to access the store
    const info = {
      hasWindow: typeof window !== 'undefined',
      hasUseAppStore: typeof window.useAppStore !== 'undefined',
      windowKeys: Object.keys(window).filter(k => k.includes('store') || k.includes('Store') || k.includes('zustand')),
    };

    // Try to find React dev tools
    const reactRoot = document.querySelector('#root');
    info.hasReactRoot = !!reactRoot;

    return info;
  });

  console.log('Page info:', JSON.stringify(layerInfo, null, 2));

  console.log('\n=== Browser will stay open for 60 seconds ===');
  await page.waitForTimeout(60000);

  await browser.close();
}

simpleDebug().catch(console.error);
