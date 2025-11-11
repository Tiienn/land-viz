from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to the app
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    print("App loaded")
    time.sleep(2)

    # Draw a rectangle
    print("\n1. Drawing a rectangle...")
    page.keyboard.press('r')
    time.sleep(0.5)

    canvas_center_x = 640
    canvas_center_y = 400

    page.mouse.move(canvas_center_x - 100, canvas_center_y - 50)
    page.mouse.down()
    page.mouse.move(canvas_center_x + 100, canvas_center_y + 50, steps=10)
    page.mouse.up()
    time.sleep(1)

    # Click to select
    page.mouse.click(canvas_center_x, canvas_center_y)
    time.sleep(1)
    print("   Rectangle selected")

    # Find Flip button
    flip_button = page.locator('button:has-text("Flip")')

    print("\n2. Clicking Flip button...")
    flip_button.click()
    time.sleep(2)  # Wait longer for dropdown to render

    # Take a focused screenshot of just the toolbar area
    toolbar = page.locator('div').filter(has_text='Display').first
    toolbar.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_toolbar_area.png')

    # Full page screenshot
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_full_page.png', full_page=True)

    print("   Screenshots taken")

    # Check what's in the DOM
    dropdown = page.locator('div:has-text("Flip Horizontally")')
    count = dropdown.count()
    print(f"\n   Dropdown elements found: {count}")

    if count > 0:
        visible = dropdown.first.is_visible()
        print(f"   First dropdown visible: {visible}")

        # Get bounding box
        if visible:
            box = dropdown.first.bounding_box()
            print(f"   Dropdown position: {box}")

    print("\n   Keeping browser open for manual inspection...")
    print("   Browser will close in 10 seconds...")
    time.sleep(10)
    browser.close()
