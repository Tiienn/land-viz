from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Draw rectangle
    page.keyboard.press('r')
    time.sleep(0.5)
    page.mouse.move(540, 350)
    page.mouse.down()
    page.mouse.move(740, 450, steps=10)
    page.mouse.up()
    time.sleep(1)

    # Select
    page.mouse.click(640, 400)
    time.sleep(1)

    # Take screenshot BEFORE clicking Flip
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_before.png')
    print("Screenshot 1: Before clicking Flip")

    # Click Flip
    flip_button = page.locator('button:has-text("Flip")')
    flip_button.click()
    time.sleep(1)

    # Take screenshot AFTER clicking Flip
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_after.png')
    print("Screenshot 2: After clicking Flip - dropdown should be visible")

    # Take a zoomed-in screenshot of just the toolbar area
    toolbar_clip = {'x': 700, 'y': 100, 'width': 400, 'height': 200}
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_toolbar_closeup.png', clip=toolbar_clip)
    print("Screenshot 3: Close-up of toolbar area")

    print("\nCheck the screenshots to see if dropdown is visible!")
    print("Browser will close in 5 seconds...")
    time.sleep(5)
    browser.close()
