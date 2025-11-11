"""
Test resize snap badge behavior
- Draw 2 rectangles in 2D mode
- Select rectangle 1
- Drag right edge handle toward rectangle 2
- Check for blue circle indicators and SNAPPED badge
"""
from playwright.sync_api import sync_playwright
import time

def test_resize_snap_badge():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navigate to app
        print("Opening app...")
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        # Switch to 2D mode
        print("Switching to 2D mode...")
        page.keyboard.press('v')
        page.wait_for_timeout(500)

        # Draw first rectangle
        print("Drawing rectangle 1...")
        page.keyboard.press('r')
        page.wait_for_timeout(300)

        # Click to start rectangle at (200, 200)
        canvas = page.locator('canvas').first
        bbox = canvas.bounding_box()
        x1 = bbox['x'] + 200
        y1 = bbox['y'] + 200
        page.mouse.click(x1, y1)
        page.wait_for_timeout(100)

        # Click to finish rectangle at (350, 350)
        x2 = bbox['x'] + 350
        y2 = bbox['y'] + 350
        page.mouse.click(x2, y2)
        page.wait_for_timeout(500)

        # Draw second rectangle (far away)
        print("Drawing rectangle 2...")
        page.keyboard.press('r')
        page.wait_for_timeout(300)

        # Click to start rectangle at (500, 200)
        x3 = bbox['x'] + 500
        y3 = bbox['y'] + 200
        page.mouse.click(x3, y3)
        page.wait_for_timeout(100)

        # Click to finish rectangle at (650, 350)
        x4 = bbox['x'] + 650
        y4 = bbox['y'] + 350
        page.mouse.click(x4, y4)
        page.wait_for_timeout(500)

        # Take screenshot after drawing
        print("Taking screenshot: after drawing both rectangles...")
        page.screenshot(path='test_badge_1_drawn.png')

        # Select rectangle 1
        print("Selecting rectangle 1...")
        page.keyboard.press('s')  # Select tool
        page.wait_for_timeout(300)
        page.mouse.click(x1 + 75, y1 + 75)  # Click center of rect 1
        page.wait_for_timeout(500)

        # Take screenshot showing handles
        print("Taking screenshot: rectangle 1 selected with handles...")
        page.screenshot(path='test_badge_2_selected.png')

        # Find the right edge handle (middle of right edge)
        # Right edge is at x2, middle y is (y1 + y2) / 2
        handle_x = x2
        handle_y = (y1 + y2) / 2

        print(f"Starting drag from right edge handle at ({handle_x}, {handle_y})...")

        # Start dragging the right edge handle
        page.mouse.move(handle_x, handle_y)
        page.wait_for_timeout(300)

        # Take screenshot: hovering over handle
        print("Taking screenshot: hovering over right edge handle...")
        page.screenshot(path='test_badge_3_hover_handle.png')

        # Press down to start drag
        page.mouse.down()
        page.wait_for_timeout(200)

        # Take screenshot: just started dragging (far from rect 2)
        print("Taking screenshot: just started dragging (should see NO badge if far)...")
        page.screenshot(path='test_badge_4_drag_start.png')

        # Console logs are collected via listener (removed this section)

        # Drag slowly toward rectangle 2
        print("Dragging toward rectangle 2...")
        steps = 10
        for i in range(1, steps + 1):
            progress = i / steps
            current_x = handle_x + (x3 - handle_x) * progress
            page.mouse.move(current_x, handle_y)
            page.wait_for_timeout(100)

            # Take screenshot at 50% progress
            if i == 5:
                print("Taking screenshot: 50% of the way (should see blue circles if working)...")
                page.screenshot(path='test_badge_5_halfway.png')

            # Take screenshot when very close
            if i == 9:
                print("Taking screenshot: very close to rectangle 2 (should see badge if < 1 unit)...")
                page.screenshot(path='test_badge_6_very_close.png')

        # Release
        page.mouse.up()
        page.wait_for_timeout(500)

        # Take final screenshot
        print("Taking screenshot: after release...")
        page.screenshot(path='test_badge_7_released.png')

        print("\nTest complete! Check screenshots:")
        print("  - test_badge_1_drawn.png")
        print("  - test_badge_2_selected.png")
        print("  - test_badge_3_hover_handle.png")
        print("  - test_badge_4_drag_start.png (should show NO badge)")
        print("  - test_badge_5_halfway.png (should show blue circles)")
        print("  - test_badge_6_very_close.png (should show badge if close)")
        print("  - test_badge_7_released.png")

        # Keep browser open for inspection
        print("\nBrowser will stay open for 30 seconds for inspection...")
        page.wait_for_timeout(30000)

        browser.close()

if __name__ == '__main__':
    test_resize_snap_badge()
