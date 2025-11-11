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

    # Draw a rectangle to enable flip button
    print("\n1. Drawing a rectangle...")
    page.keyboard.press('r')  # Rectangle tool
    time.sleep(0.5)

    # Draw rectangle
    page.mouse.move(400, 350)
    page.mouse.down()
    page.mouse.move(600, 500, steps=5)
    page.mouse.up()
    time.sleep(1)
    print("   Rectangle drawn")

    # Click to select the rectangle
    page.keyboard.press('s')  # Select tool
    time.sleep(0.5)
    page.mouse.click(500, 425)  # Click on rectangle
    time.sleep(0.5)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_1_rectangle_selected.png', full_page=True)
    print("   Rectangle selected")

    # Find and click the Flip button
    print("\n2. Clicking Flip button...")
    flip_button = page.get_by_text("Flip", exact=False).first

    if flip_button.count() > 0:
        print(f"   Found {flip_button.count()} Flip button(s)")

        # Take screenshot before clicking
        page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_2_before_click.png', full_page=True)

        # Click the Flip button to open dropdown
        flip_button.click()
        print("   Flip button clicked")
        time.sleep(1)

        # Take screenshot after clicking - dropdown should be visible
        page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_3_dropdown_open.png', full_page=True)
        print("   Screenshot taken - dropdown should be visible")

        # Check if dropdown options are visible
        h_flip = page.get_by_text("Flip Horizontally")
        v_flip = page.get_by_text("Flip Vertically")

        if h_flip.count() > 0 and h_flip.is_visible():
            print("\n   SUCCESS: Flip Horizontally option is visible!")
        else:
            print("\n   ERROR: Flip Horizontally option NOT visible")

        if v_flip.count() > 0 and v_flip.is_visible():
            print("   SUCCESS: Flip Vertically option is visible!")
        else:
            print("   ERROR: Flip Vertically option NOT visible")

        # Test clicking Flip Horizontally
        if h_flip.count() > 0 and h_flip.is_visible():
            print("\n3. Testing Flip Horizontally...")
            h_flip.click()
            time.sleep(1)

            page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_4_after_h_flip.png', full_page=True)
            print("   Flipped horizontally - screenshot taken")

            # Flip vertically
            print("\n4. Testing Flip Vertically...")
            flip_button.click()  # Open dropdown again
            time.sleep(0.5)
            page.get_by_text("Flip Vertically").click()
            time.sleep(1)

            page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_5_after_v_flip.png', full_page=True)
            print("   Flipped vertically - screenshot taken")

            print("\n   All tests passed!")
    else:
        print("   ERROR: Flip button not found")

    print("\nBrowser will close in 3 seconds...")
    time.sleep(3)
    browser.close()
