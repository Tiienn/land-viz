from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to the app
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

    # Get Flip button position
    flip_button = page.locator('button:has-text("Flip")')
    button_box = flip_button.bounding_box()
    print(f"\nFlip button position: {button_box}")

    # Click Flip
    flip_button.click()
    time.sleep(1)

    # Get dropdown position
    dropdown = page.locator('div:has-text("Flip Horizontally")').first
    if dropdown.count() > 0:
        dropdown_box = dropdown.bounding_box()
        print(f"Dropdown position: {dropdown_box}")

        print(f"\nDropdown is visible: {dropdown.is_visible()}")

        # Check if dropdown is below viewport
        viewport = page.viewport_size
        print(f"Viewport height: {viewport['height']}")

        if dropdown_box:
            if dropdown_box['y'] + dropdown_box['height'] > viewport['height']:
                print("WARNING: Dropdown extends below viewport!")
            if dropdown_box['y'] < 0:
                print("WARNING: Dropdown is above viewport!")

    print("\nBrowser will stay open for manual inspection...")
    time.sleep(10)
    browser.close()
