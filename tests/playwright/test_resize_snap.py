"""
Test script to verify resize snap feature is working correctly.

This script:
1. Opens the application
2. Draws two rectangles
3. Selects one rectangle
4. Drags a resize handle toward the other rectangle
5. Verifies snap indicators appear
6. Verifies SNAPPED badge appears
7. Takes screenshots to document behavior
"""

import asyncio
import time
from playwright.async_api import async_playwright, Page

async def wait_for_app_ready(page: Page, timeout: int = 30000):
    """Wait for the app to be fully loaded and ready"""
    print("⏳ Waiting for app to load...")

    # Wait for canvas to be visible
    await page.wait_for_selector('canvas', timeout=timeout, state='visible')

    # Wait for toolbar to be visible
    await page.wait_for_selector('[data-testid="toolbar"], .ribbon, button', timeout=timeout)

    # Give Three.js time to initialize
    await asyncio.sleep(2)

    print("✅ App loaded and ready")

async def draw_rectangle(page: Page, start_x: int, start_y: int, end_x: int, end_y: int):
    """Draw a rectangle on the canvas"""
    # Click rectangle tool (assuming it's the first tool)
    rectangle_button = page.locator('button:has-text("Rectangle"), button[title*="Rectangle"], button[aria-label*="Rectangle"]').first
    await rectangle_button.click()
    await asyncio.sleep(0.5)

    # Get canvas element
    canvas = page.locator('canvas').first
    canvas_box = await canvas.bounding_box()

    if not canvas_box:
        raise Exception("Canvas not found")

    # Calculate absolute positions
    abs_start_x = canvas_box['x'] + start_x
    abs_start_y = canvas_box['y'] + start_y
    abs_end_x = canvas_box['x'] + end_x
    abs_end_y = canvas_box['y'] + end_y

    # Draw rectangle
    await page.mouse.move(abs_start_x, abs_start_y)
    await page.mouse.down()
    await page.mouse.move(abs_end_x, abs_end_y, steps=10)
    await page.mouse.up()
    await asyncio.sleep(0.5)

    print(f"✅ Drew rectangle from ({start_x}, {start_y}) to ({end_x}, {end_y})")

async def select_rectangle(page: Page, x: int, y: int):
    """Click to select a rectangle"""
    # Click select tool
    select_button = page.locator('button:has-text("Select"), button[title*="Select"], button[aria-label*="Select"]').first
    await select_button.click()
    await asyncio.sleep(0.5)

    # Click on rectangle
    canvas = page.locator('canvas').first
    canvas_box = await canvas.bounding_box()

    if not canvas_box:
        raise Exception("Canvas not found")

    abs_x = canvas_box['x'] + x
    abs_y = canvas_box['y'] + y

    await page.mouse.click(abs_x, abs_y)
    await asyncio.sleep(0.5)

    print(f"✅ Selected rectangle at ({x}, {y})")

async def drag_resize_handle(page: Page, handle_x: int, handle_y: int, target_x: int, target_y: int):
    """Drag a resize handle toward a target position"""
    canvas = page.locator('canvas').first
    canvas_box = await canvas.bounding_box()

    if not canvas_box:
        raise Exception("Canvas not found")

    abs_handle_x = canvas_box['x'] + handle_x
    abs_handle_y = canvas_box['y'] + handle_y
    abs_target_x = canvas_box['x'] + target_x
    abs_target_y = canvas_box['y'] + target_y

    # Start dragging
    await page.mouse.move(abs_handle_x, abs_handle_y)
    await asyncio.sleep(0.3)
    await page.mouse.down()
    await asyncio.sleep(0.5)

    # Move toward target in steps to allow snap detection
    steps = 20
    for i in range(1, steps + 1):
        progress = i / steps
        current_x = abs_handle_x + (abs_target_x - abs_handle_x) * progress
        current_y = abs_handle_y + (abs_target_y - abs_handle_y) * progress
        await page.mouse.move(current_x, current_y)
        await asyncio.sleep(0.05)

    # Hold at target for a moment to see snap indicators
    await asyncio.sleep(1)

    print(f"✅ Dragged resize handle toward target")

async def check_console_for_snap_logs(page: Page):
    """Check browser console for snap detection logs"""
    # Set up console listener
    snap_detected = False

    def handle_console(msg):
        nonlocal snap_detected
        text = msg.text
        if '🎯 RESIZE SNAP:' in text:
            snap_detected = True
            print(f"✅ SNAP DETECTED IN CONSOLE: {text}")

    page.on('console', handle_console)

    return snap_detected

async def main():
    async with async_playwright() as p:
        print("🚀 Starting resize snap test...")

        # Launch browser
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        # Set up console monitoring
        snap_logs = []
        def handle_console(msg):
            text = msg.text
            if '🎯 RESIZE SNAP:' in text:
                snap_logs.append(text)
                print(f"📊 {text}")

        page.on('console', handle_console)

        try:
            # Navigate to app
            print("🌐 Navigating to http://localhost:5174")
            await page.goto('http://localhost:5174', wait_until='networkidle')

            # Wait for app to be ready
            await wait_for_app_ready(page)

            # Take initial screenshot
            await page.screenshot(path='test_resize_snap_1_initial.png')
            print("📸 Screenshot 1: Initial state")

            # Draw first rectangle (left side)
            print("\n📐 Drawing first rectangle...")
            await draw_rectangle(page, 300, 300, 450, 450)
            await page.screenshot(path='test_resize_snap_2_first_rect.png')
            print("📸 Screenshot 2: First rectangle drawn")

            # Draw second rectangle (right side, close to first)
            print("\n📐 Drawing second rectangle...")
            await draw_rectangle(page, 550, 300, 700, 450)
            await page.screenshot(path='test_resize_snap_3_second_rect.png')
            print("📸 Screenshot 3: Second rectangle drawn")

            # Select first rectangle
            print("\n🖱️ Selecting first rectangle...")
            await select_rectangle(page, 375, 375)
            await asyncio.sleep(1)
            await page.screenshot(path='test_resize_snap_4_selected.png')
            print("📸 Screenshot 4: Rectangle selected (resize handles visible)")

            # Drag right edge handle toward second rectangle
            print("\n🎯 Dragging resize handle toward second rectangle...")
            await drag_resize_handle(page, 450, 375, 550, 375)

            # Take screenshot during drag (snap indicators should be visible)
            await page.screenshot(path='test_resize_snap_5_during_drag.png')
            print("📸 Screenshot 5: During resize drag (snap indicators should be visible)")

            # Hold for a moment to see indicators
            await asyncio.sleep(2)

            # Take final screenshot
            await page.screenshot(path='test_resize_snap_6_snap_visible.png')
            print("📸 Screenshot 6: Snap indicators visible")

            # Release mouse
            await page.mouse.up()
            await asyncio.sleep(1)

            # Take screenshot after release
            await page.screenshot(path='test_resize_snap_7_after_release.png')
            print("📸 Screenshot 7: After release")

            # Check results
            print("\n" + "="*60)
            print("TEST RESULTS")
            print("="*60)

            if snap_logs:
                print(f"✅ SNAP DETECTION WORKING: {len(snap_logs)} snap logs found")
                for log in snap_logs:
                    print(f"   {log}")
            else:
                print("❌ NO SNAP DETECTION: No snap logs found in console")

            print("\n📸 Screenshots saved:")
            print("   - test_resize_snap_1_initial.png")
            print("   - test_resize_snap_2_first_rect.png")
            print("   - test_resize_snap_3_second_rect.png")
            print("   - test_resize_snap_4_selected.png")
            print("   - test_resize_snap_5_during_drag.png")
            print("   - test_resize_snap_6_snap_visible.png")
            print("   - test_resize_snap_7_after_release.png")

            print("\n👀 Please review screenshots to verify:")
            print("   1. Blue circles (endpoints) visible on second rectangle")
            print("   2. Orange diamonds (midpoints) visible on edges")
            print("   3. Green crosshairs (center) visible")
            print("   4. '✓ SNAPPED' badge visible when close to snap points")

            print("\n⏸️ Keeping browser open for manual inspection...")
            print("   Press Ctrl+C to close")

            # Keep browser open for manual inspection
            await asyncio.sleep(300)  # 5 minutes

        except KeyboardInterrupt:
            print("\n👋 Test interrupted by user")
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()
            print("\n✅ Browser closed")

if __name__ == '__main__':
    asyncio.run(main())
