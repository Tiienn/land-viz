"""
Automated test for Line shape midpoint indicators
Tests the full workflow: 2D mode -> Line tool -> draw lines -> hover for orange indicators
"""
import asyncio
import time
import sys
from playwright.async_api import async_playwright

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def test_line_midpoint_indicators():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        # Enable console logging
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

        print("🌐 Navigating to Land Visualizer...")
        await page.goto('http://localhost:5177')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(2)

        print("📸 Taking initial screenshot...")
        await page.screenshot(path='test_line_1_initial.png')

        # Step 1: Switch to 2D mode
        print("🔄 Switching to 2D mode...")
        await page.click('button:has-text("2D View")')
        await asyncio.sleep(1)
        await page.screenshot(path='test_line_2_2d_mode.png')

        # Step 2: Click Line tool
        print("✏️ Selecting Line tool...")
        line_button = page.locator('button[aria-label="Line tool"]')
        if not await line_button.count():
            # Try alternative selector
            line_button = page.locator('button:has-text("Line")')
        await line_button.click()
        await asyncio.sleep(1)
        await page.screenshot(path='test_line_3_line_tool_selected.png')

        # Step 3: Press TAB to enable multi-segment mode
        print("⌨️ Pressing TAB to enable multi-segment mode...")
        await page.keyboard.press('Tab')
        await asyncio.sleep(0.5)

        # Step 4: Draw multiple 50m lines
        print("📏 Drawing multiple 50m lines...")
        canvas = page.locator('canvas').first
        canvas_box = await canvas.bounding_box()

        if canvas_box:
            # Calculate center
            center_x = canvas_box['x'] + canvas_box['width'] / 2
            center_y = canvas_box['y'] + canvas_box['height'] / 2

            # Draw 4 line segments forming a square-ish pattern
            points = [
                (center_x - 100, center_y - 100),  # Start point
                (center_x + 100, center_y - 100),  # Point 2
                (center_x + 100, center_y + 100),  # Point 3
                (center_x - 100, center_y + 100),  # Point 4
                (center_x - 100, center_y - 100),  # Close back to start
            ]

            for i, (x, y) in enumerate(points):
                print(f"  Clicking point {i+1} at ({x:.0f}, {y:.0f})")
                await page.mouse.click(x, y)
                await asyncio.sleep(0.5)

            # Press ESC to finish line
            await page.keyboard.press('Escape')
            await asyncio.sleep(1)
            await page.screenshot(path='test_line_4_lines_drawn.png')

        # Step 5: Draw a rectangle
        print("🔲 Drawing a rectangle...")
        await page.click('button[aria-label="Rectangle tool"]')
        await asyncio.sleep(0.5)

        if canvas_box:
            # Draw rectangle in a different area
            rect_x1 = center_x + 150
            rect_y1 = center_y - 50
            rect_x2 = center_x + 250
            rect_y2 = center_y + 50

            await page.mouse.click(rect_x1, rect_y1)
            await asyncio.sleep(0.2)
            await page.mouse.click(rect_x2, rect_y2)
            await asyncio.sleep(1)
            await page.screenshot(path='test_line_5_rectangle_drawn.png')

        # Step 6: Switch to SELECT mode
        print("👆 Switching to SELECT mode...")
        await page.click('button:has-text("Select")')
        await asyncio.sleep(1)
        await page.screenshot(path='test_line_6_select_mode.png')

        # Step 7: Click on the Line shape to select it
        print("🎯 Selecting the Line shape...")
        if canvas_box:
            # Click on one of the line segments
            line_click_x = center_x
            line_click_y = center_y - 100
            await page.mouse.click(line_click_x, line_click_y)
            await asyncio.sleep(1)
            await page.screenshot(path='test_line_7_line_selected.png')

        # Step 8: Hover over Line shape midpoint
        print("🖱️ Hovering over Line shape midpoint...")
        if canvas_box:
            # Hover over the midpoint of the top edge
            midpoint_x = center_x
            midpoint_y = center_y - 100
            await page.mouse.move(midpoint_x, midpoint_y)
            await asyncio.sleep(2)
            await page.screenshot(path='test_line_8_hover_midpoint.png')

        # Step 9: Print console logs
        print("\n📋 Console logs:")
        print("=" * 80)

        # Filter relevant logs
        snap_logs = [msg for msg in console_messages if '[SnapGrid]' in msg or '[SnapIndicator]' in msg]

        if snap_logs:
            for msg in snap_logs[-50:]:  # Show last 50 relevant logs
                print(msg)
        else:
            print("No SnapGrid/SnapIndicator logs found!")
            print("\nAll console logs:")
            for msg in console_messages[-20:]:
                print(msg)

        print("=" * 80)

        # Wait before closing
        print("\n✅ Test complete! Keeping browser open for 5 seconds...")
        await asyncio.sleep(5)

        await browser.close()

        print(f"\n📸 Screenshots saved:")
        print("  - test_line_1_initial.png")
        print("  - test_line_2_2d_mode.png")
        print("  - test_line_3_line_tool_selected.png")
        print("  - test_line_4_lines_drawn.png")
        print("  - test_line_5_rectangle_drawn.png")
        print("  - test_line_6_select_mode.png")
        print("  - test_line_7_line_selected.png")
        print("  - test_line_8_hover_midpoint.png")

if __name__ == "__main__":
    asyncio.run(test_line_midpoint_indicators())
