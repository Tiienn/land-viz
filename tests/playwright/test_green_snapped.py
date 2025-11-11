"""
Test that green SNAPPED badge appears when actually snapped
"""
from playwright.sync_api import sync_playwright

def test_green_snapped():
    console_messages = []

    def handle_console(msg):
        try:
            text = msg.text
            if any(keyword in text for keyword in ['BADGE', 'SNAP', 'snap']):
                console_messages.append(text)
                safe_text = text.encode('ascii', 'ignore').decode('ascii')
                print(f"[LOG] {safe_text}")
        except:
            pass

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.on('console', handle_console)

        print("=== Opening app ===")
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        print("\n=== Switching to 2D mode ===")
        page.keyboard.press('v')
        page.wait_for_timeout(500)

        print("\n=== Drawing rectangle 1 ===")
        page.keyboard.press('r')
        page.wait_for_timeout(300)

        canvas = page.locator('canvas').first
        bbox = canvas.bounding_box()

        # Rectangle 1: (200, 300) to (350, 450)
        x1 = bbox['x'] + 200
        y1 = bbox['y'] + 300
        page.mouse.click(x1, y1)
        page.wait_for_timeout(100)

        x2 = bbox['x'] + 350
        y2 = bbox['y'] + 450
        page.mouse.click(x2, y2)
        page.wait_for_timeout(500)

        print("\n=== Drawing rectangle 2 CLOSE (only 60 pixels away) ===")
        page.keyboard.press('r')
        page.wait_for_timeout(300)

        # Rectangle 2: CLOSE - (410, 300) to (560, 450) - only 60 pixels gap
        x3 = bbox['x'] + 410
        y3 = bbox['y'] + 300
        page.mouse.click(x3, y3)
        page.wait_for_timeout(100)

        x4 = bbox['x'] + 560
        y4 = bbox['y'] + 450
        page.mouse.click(x4, y4)
        page.wait_for_timeout(500)

        page.screenshot(path='green_test_1_both_rects.png')

        print("\n=== Selecting rectangle 1 ===")
        page.keyboard.press('s')
        page.wait_for_timeout(300)

        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2
        page.mouse.click(center_x, center_y)
        page.wait_for_timeout(500)

        page.screenshot(path='green_test_2_selected.png')

        print("\n=== Dragging RIGHT EDGE handle toward rectangle 2 ===")
        handle_x = x2
        handle_y = center_y

        page.mouse.move(handle_x, handle_y)
        page.wait_for_timeout(300)

        console_messages.clear()

        print("\n=== Mouse DOWN ===")
        page.mouse.down()
        page.wait_for_timeout(500)

        print("\n=== Moving toward rect 2 (should see blue circles) ===")
        page.mouse.move(handle_x + 20, handle_y)
        page.wait_for_timeout(1000)

        page.screenshot(path='green_test_3_moving.png')

        print("\n=== Moving VERY close to snap (within 5 pixels of rect 2 left edge) ===")
        # Move to within 5 pixels of rectangle 2's left edge
        snap_target_x = x3 - 5
        page.mouse.move(snap_target_x, handle_y)
        page.wait_for_timeout(1000)

        page.screenshot(path='green_test_4_almost_snapped.png')

        print("\n=== Moving to EXACT snap position (rect 2 left edge) ===")
        # Move to exactly the left edge of rectangle 2
        # This should trigger magnetic snap and show green SNAPPED
        page.mouse.move(x3, handle_y)
        page.wait_for_timeout(1500)

        page.screenshot(path='green_test_5_snapped.png')

        print("\n=== Releasing ===")
        page.mouse.up()
        page.wait_for_timeout(1000)

        page.screenshot(path='green_test_6_released.png')

        print("\n" + "="*60)
        print("RELEVANT CONSOLE LOGS:")
        print("="*60)

        # Filter for the most relevant logs
        for msg in console_messages:
            if 'BADGE DECISION' in msg or 'BADGE SHOWING' in msg:
                safe_msg = msg.encode('ascii', 'ignore').decode('ascii')
                print(safe_msg)

        print("\n" + "="*60)
        print("Check screenshots:")
        print("  green_test_4_almost_snapped.png - Should show teal badge with distance")
        print("  green_test_5_snapped.png - Should show GREEN SNAPPED badge")
        print("="*60)

        print("\nBrowser will stay open for 30 seconds for inspection...")
        page.wait_for_timeout(30000)

        browser.close()

if __name__ == '__main__':
    test_green_snapped()
