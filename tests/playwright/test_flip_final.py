from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to the app
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    print("App loaded - testing Flip dropdown visibility")
    time.sleep(2)

    # Draw a rectangle
    print("\n1. Drawing and selecting rectangle...")
    page.keyboard.press('r')
    time.sleep(0.5)

    page.mouse.move(540, 350)
    page.mouse.down()
    page.mouse.move(740, 450, steps=10)
    page.mouse.up()
    time.sleep(1)

    # Click to select
    page.mouse.click(640, 400)
    time.sleep(1)

    # Click Flip button
    print("\n2. Opening Flip dropdown...")
    flip_button = page.locator('button:has-text("Flip")')
    flip_button.click()
    time.sleep(1)

    # Take screenshot
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_dropdown_visible.png', full_page=True)
    print("   Screenshot saved: flip_dropdown_visible.png")

    # Check visibility
    h_flip = page.locator('text=Flip Horizontally')
    v_flip = page.locator('text=Flip Vertically')

    h_visible = h_flip.is_visible() if h_flip.count() > 0 else False
    v_visible = v_flip.is_visible() if v_flip.count() > 0 else False

    print(f"\n   Flip Horizontally visible: {h_visible}")
    print(f"   Flip Vertically visible: {v_visible}")

    if h_visible and v_flip:
        print("\n   SUCCESS! Dropdown is now visible!")
    else:
        print("\n   WARNING: Dropdown may still have visibility issues")

    print("\n   Check flip_dropdown_visible.png to see if dropdown appears below the Flip button")
    print("   Browser will close in 5 seconds...")
    time.sleep(5)
    browser.close()
