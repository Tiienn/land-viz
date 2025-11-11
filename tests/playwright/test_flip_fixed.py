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

    # Draw rectangle in the center of the canvas
    canvas_center_x = 640
    canvas_center_y = 400

    page.mouse.move(canvas_center_x - 100, canvas_center_y - 50)
    page.mouse.down()
    page.mouse.move(canvas_center_x + 100, canvas_center_y + 50, steps=10)
    page.mouse.up()
    time.sleep(1)
    print("   Rectangle drawn")

    # The rectangle should auto-select after drawing
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_1_rectangle_drawn.png', full_page=True)

    # Wait a bit for selection to register
    time.sleep(1)

    # Find the Flip button - should now be enabled
    print("\n2. Looking for Flip button...")

    # Find button element that contains "Flip" text
    flip_button = page.locator('button:has-text("Flip")')

    if flip_button.count() > 0:
        print(f"   Found Flip button")

        # Check if it's enabled
        is_disabled = flip_button.is_disabled()
        print(f"   Button disabled: {is_disabled}")

        if is_disabled:
            print("   ERROR: Button is still disabled - rectangle may not be selected")
            # Try clicking on the rectangle to select it
            print("   Trying to click on rectangle to select it...")
            page.mouse.click(canvas_center_x, canvas_center_y)
            time.sleep(1)

            is_disabled = flip_button.is_disabled()
            print(f"   Button disabled after click: {is_disabled}")

        if not is_disabled:
            # Take screenshot before clicking
            page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_2_before_dropdown.png', full_page=True)

            # Click the Flip button to open dropdown
            print("\n3. Clicking Flip button to open dropdown...")
            flip_button.click()
            time.sleep(0.5)

            # Take screenshot after clicking - dropdown should be visible
            page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_3_dropdown_open.png', full_page=True)
            print("   Screenshot taken - checking if dropdown is visible")

            # Check if dropdown options are visible
            h_flip = page.locator('text=Flip Horizontally')
            v_flip = page.locator('text=Flip Vertically')

            h_visible = h_flip.is_visible() if h_flip.count() > 0 else False
            v_visible = v_flip.is_visible() if v_flip.count() > 0 else False

            print(f"\n   Flip Horizontally visible: {h_visible}")
            print(f"   Flip Vertically visible: {v_visible}")

            if h_visible and v_visible:
                print("\n   SUCCESS! Dropdown is visible!")

                # Test flipping
                print("\n4. Testing Flip Horizontally...")
                h_flip.click()
                time.sleep(1)
                page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_4_after_h_flip.png', full_page=True)
                print("   Flipped horizontally")

                # Test vertical flip
                print("\n5. Testing Flip Vertically...")
                flip_button.click()  # Open dropdown again
                time.sleep(0.5)
                page.locator('text=Flip Vertically').click()
                time.sleep(1)
                page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_test_5_after_v_flip.png', full_page=True)
                print("   Flipped vertically")

                print("\n   All tests PASSED!")
            else:
                print("\n   ERROR: Dropdown options NOT visible - overflow fix may not have worked")
        else:
            print("   ERROR: Button is disabled - cannot test dropdown")
    else:
        print("   ERROR: Flip button not found")

    print("\nBrowser will close in 3 seconds...")
    time.sleep(3)
    browser.close()
