"""
Test resize snap with console logging
"""
from playwright.sync_api import sync_playwright
import time

def test_snap_console():
    console_messages = []

    def handle_console(msg):
        try:
            text = msg.text
            # Only capture snap-related logs
            if any(keyword in text for keyword in ['BADGE', 'SNAP', 'snap', 'RESIZE']):
                console_messages.append(text)
                # Print safely without emojis
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

        print("\n=== Drawing rectangle 2 (far away) ===")
        page.keyboard.press('r')
        page.wait_for_timeout(300)

        # Rectangle 2: (500, 300) to (650, 450) - 150 units away
        x3 = bbox['x'] + 500
        y3 = bbox['y'] + 300
        page.mouse.click(x3, y3)
        page.wait_for_timeout(100)

        x4 = bbox['x'] + 650
        y4 = bbox['y'] + 450
        page.mouse.click(x4, y4)
        page.wait_for_timeout(500)

        print("\n=== Selecting rectangle 1 ===")
        page.keyboard.press('s')
        page.wait_for_timeout(300)

        # Click center of rectangle 1
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2
        page.mouse.click(center_x, center_y)
        page.wait_for_timeout(500)

        # Take screenshot
        page.screenshot(path='console_test_1_selected.png')

        print("\n=== Starting drag from RIGHT EDGE handle ===")
        # Right edge handle is at (x2, center_y)
        handle_x = x2
        handle_y = center_y

        page.mouse.move(handle_x, handle_y)
        page.wait_for_timeout(300)

        # Clear console messages
        console_messages.clear()

        print("\n=== Mouse DOWN (starting drag) ===")
        page.mouse.down()
        page.wait_for_timeout(1000)

        # Take screenshot at start
        page.screenshot(path='console_test_2_drag_start.png')

        print("\n=== Moving handle 10 pixels right ===")
        page.mouse.move(handle_x + 10, handle_y)
        page.wait_for_timeout(1000)

        print("\n=== Moving handle 50 pixels right (closer to rect 2) ===")
        page.mouse.move(handle_x + 50, handle_y)
        page.wait_for_timeout(1000)

        # Take screenshot halfway
        page.screenshot(path='console_test_3_halfway.png')

        print("\n=== Moving very close to rectangle 2 ===")
        page.mouse.move(x3 - 5, handle_y)
        page.wait_for_timeout(1000)

        # Take screenshot close
        page.screenshot(path='console_test_4_close.png')

        print("\n=== Releasing mouse ===")
        page.mouse.up()
        page.wait_for_timeout(1000)

        # Take screenshot final
        page.screenshot(path='console_test_5_released.png')

        print("\n" + "="*60)
        print("CAPTURED CONSOLE LOGS:")
        print("="*60)
        for i, msg in enumerate(console_messages, 1):
            safe_msg = msg.encode('ascii', 'ignore').decode('ascii')
            print(f"{i}. {safe_msg}")

        print("\n" + "="*60)
        print("SCREENSHOTS SAVED:")
        print("="*60)
        print("1. console_test_1_selected.png - Rectangle selected")
        print("2. console_test_2_drag_start.png - Just started dragging")
        print("3. console_test_3_halfway.png - Halfway to rect 2")
        print("4. console_test_4_close.png - Very close to rect 2")
        print("5. console_test_5_released.png - After release")

        print("\nBrowser will stay open for 30 seconds...")
        page.wait_for_timeout(30000)

        browser.close()

if __name__ == '__main__':
    test_snap_console()
