"""
Check console logs during resize to see snap detection
"""
from playwright.sync_api import sync_playwright
import time

def test_console():
    console_messages = []

    def handle_console(msg):
        console_messages.append(msg.text)
        print(f"[CONSOLE] {msg.text}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Listen to console
        page.on('console', handle_console)

        # Navigate
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        # Switch to 2D
        page.keyboard.press('v')
        page.wait_for_timeout(500)

        # Draw rectangle 1
        page.keyboard.press('r')
        page.wait_for_timeout(300)
        canvas = page.locator('canvas').first
        bbox = canvas.bounding_box()
        x1 = bbox['x'] + 200
        y1 = bbox['y'] + 200
        page.mouse.click(x1, y1)
        page.wait_for_timeout(100)
        x2 = bbox['x'] + 350
        y2 = bbox['y'] + 350
        page.mouse.click(x2, y2)
        page.wait_for_timeout(500)

        # Draw rectangle 2
        page.keyboard.press('r')
        page.wait_for_timeout(300)
        x3 = bbox['x'] + 500
        y3 = bbox['y'] + 200
        page.mouse.click(x3, y3)
        page.wait_for_timeout(100)
        x4 = bbox['x'] + 650
        y4 = bbox['y'] + 350
        page.mouse.click(x4, y4)
        page.wait_for_timeout(500)

        # Select rectangle 1
        page.keyboard.press('s')
        page.wait_for_timeout(300)
        page.mouse.click(x1 + 75, y1 + 75)
        page.wait_for_timeout(500)

        print("\n=== STARTING DRAG ===")

        # Start drag from right edge handle
        handle_x = x2
        handle_y = (y1 + y2) / 2
        page.mouse.move(handle_x, handle_y)
        page.wait_for_timeout(300)
        page.mouse.down()
        page.wait_for_timeout(500)

        print("\n=== DRAGGING (looking for snap logs) ===")

        # Move just a little bit
        page.mouse.move(handle_x + 10, handle_y)
        page.wait_for_timeout(500)

        page.mouse.up()

        print("\n=== RELEASED ===")
        page.wait_for_timeout(1000)

        # Print relevant logs
        print("\n=== SNAP-RELATED LOGS ===")
        for msg in console_messages:
            if 'SNAP' in msg or 'snap' in msg or 'available' in msg:
                print(msg)

        browser.close()

if __name__ == '__main__':
    test_console()
