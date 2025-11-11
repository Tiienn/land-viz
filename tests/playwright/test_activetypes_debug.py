"""
Debug test to capture activeTypes from store during Line shape selection
"""
import asyncio
import sys
from playwright.async_api import async_playwright

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def test_activetypes():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        # Capture console logs
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

        print("🌐 Navigating to Land Visualizer...")
        await page.goto('http://localhost:5177')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(2)

        # Switch to 2D mode
        print("\n📐 Switching to 2D mode...")
        await page.click('button:has-text("2D View")')
        await asyncio.sleep(1)

        # Draw a Line shape
        print("\n✏️ Drawing a Line shape...")
        await page.click('button[aria-label="Line tool"]')
        await asyncio.sleep(0.5)

        # Click two points to create a line
        canvas = page.locator('canvas').first
        canvas_box = await canvas.bounding_box()

        if canvas_box:
            center_x = canvas_box['x'] + canvas_box['width'] / 2
            center_y = canvas_box['y'] + canvas_box['height'] / 2

            # Draw a simple line
            await page.mouse.click(center_x - 50, center_y)
            await asyncio.sleep(0.3)
            await page.mouse.click(center_x + 50, center_y)
            await asyncio.sleep(1)

        # Switch to SELECT mode
        print("\n👆 Switching to SELECT mode...")
        await page.click('button:has-text("Select")')
        await asyncio.sleep(1)

        # Click on the Line shape to select it
        print("\n🎯 Selecting the Line shape...")
        if canvas_box:
            await page.mouse.click(center_x, center_y)
            await asyncio.sleep(1)

        # Hover over the midpoint
        print("\n🖱️  Hovering over the midpoint...")
        if canvas_box:
            await page.mouse.move(center_x, center_y)
            await asyncio.sleep(2)

        # Print console logs
        print("\n" + "=" * 100)
        print("📋 CONSOLE LOGS - activeTypes Debug:")
        print("=" * 100)

        # Filter for relevant logs
        debug_logs = [msg for msg in console_messages if 'DrawingCanvas' in msg and 'activeTypes' in msg]

        if debug_logs:
            for msg in debug_logs[-20:]:  # Show last 20 relevant logs
                print(msg)
        else:
            print("❌ No activeTypes debug logs found!")
            print("\nShowing all DrawingCanvas logs:")
            canvas_logs = [msg for msg in console_messages if 'DrawingCanvas' in msg]
            for msg in canvas_logs[-20:]:
                print(msg)

        print("=" * 100)

        # Also check SnapIndicator logs
        print("\n" + "=" * 100)
        print("📋 SNAP INDICATOR LOGS:")
        print("=" * 100)

        snap_logs = [msg for msg in console_messages if 'SnapIndicator' in msg]
        if snap_logs:
            for msg in snap_logs[-10:]:
                print(msg)
        else:
            print("❌ No SnapIndicator logs found!")

        print("=" * 100)

        # Keep browser open for manual inspection
        print("\n✅ Test complete! Keeping browser open for 10 seconds...")
        await asyncio.sleep(10)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_activetypes())
