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

    # Switch to 2D mode
    page.keyboard.press('v')
    print("Switched to 2D mode")
    time.sleep(1)

    # Take initial screenshot
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/draw_test_1_initial.png', full_page=True)
    print("1. Initial 2D view screenshot")

    # Draw a rectangle
    print("\n2. Drawing a rectangle...")
    page.keyboard.press('r')  # Rectangle tool
    time.sleep(0.5)

    # Draw rectangle by clicking and dragging
    page.mouse.move(640, 400)
    page.mouse.down()
    page.mouse.move(740, 500, steps=5)
    page.mouse.up()
    time.sleep(1)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/draw_test_2_with_rectangle.png', full_page=True)
    print("   Rectangle drawn")

    # Zoom out significantly
    print("\n3. Zooming out significantly...")
    page.mouse.move(640, 400)
    for i in range(10):
        page.mouse.wheel(0, 300)  # Zoom OUT (positive delta)
        time.sleep(0.1)

    time.sleep(1)
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/draw_test_3_zoomed_out.png', full_page=True)
    print("   Zoomed out - rectangle should be tiny now")

    # Pan the view by middle-click dragging
    print("\n4. Panning the view...")
    page.mouse.move(640, 400)
    page.mouse.down(button="middle")
    page.mouse.move(800, 300, steps=10)
    page.mouse.up(button="middle")
    time.sleep(1)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/draw_test_4_zoomed_and_panned.png', full_page=True)
    print("   Panned view")

    # Click Reset View button
    print("\n5. Clicking Reset View button...")
    reset_button = page.get_by_text("Reset View")
    if reset_button.count() > 0 and reset_button.is_visible():
        reset_button.click()
        print("   Reset View clicked - waiting for animation...")
        time.sleep(2.5)  # Wait for 1000ms animation + buffer

        page.screenshot(path='C:/Users/Admin/Desktop/land-viz/draw_test_5_after_reset.png', full_page=True)
        print("   After reset screenshot taken")

        print("\nCOMPARE:")
        print("  draw_test_2_with_rectangle.png - Original view with rectangle")
        print("  draw_test_5_after_reset.png    - After reset (should match #2)")
    else:
        print("   ERROR: Reset View button not found")

    # Test zoom in as well
    print("\n6. Testing zoom IN scenario...")
    page.mouse.move(640, 400)
    for i in range(15):
        page.mouse.wheel(0, -200)  # Zoom IN (negative delta)
        time.sleep(0.1)
    time.sleep(1)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/draw_test_6_zoomed_in.png', full_page=True)
    print("   Zoomed in very close")

    # Reset again
    reset_button.click()
    print("   Reset View clicked again...")
    time.sleep(2.5)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/draw_test_7_after_second_reset.png', full_page=True)
    print("   After second reset")

    print("\nTest complete! Browser will stay open for 5 seconds...")
    time.sleep(5)
    browser.close()
