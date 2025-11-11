from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to the app
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')

    print("App loaded successfully")
    time.sleep(2)

    # Switch to 2D mode
    page.keyboard.press('v')
    print("Switched to 2D mode")
    time.sleep(1)

    # Take baseline screenshot
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/test_1_initial_2d.png', full_page=True)
    print("1. Baseline screenshot (2D mode, default zoom)")

    # Zoom in significantly
    print("\n2. Zooming in...")
    page.mouse.move(640, 400)
    for i in range(5):
        page.mouse.wheel(0, -200)  # Zoom in 5 times
        time.sleep(0.2)

    time.sleep(1)
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/test_2_zoomed_in.png', full_page=True)
    print("   Screenshot after zooming in")

    # Pan the view
    print("\n3. Panning the view...")
    page.mouse.move(640, 400)
    page.mouse.down(button="middle")
    page.mouse.move(400, 300, steps=10)
    page.mouse.up(button="middle")

    time.sleep(1)
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/test_3_zoomed_and_panned.png', full_page=True)
    print("   Screenshot after zooming and panning")

    # Click Reset View button
    print("\n4. Clicking Reset View button...")
    reset_button = page.get_by_text("Reset View")
    if reset_button.count() > 0 and reset_button.is_visible():
        reset_button.click()
        print("   Reset View clicked")
        time.sleep(2)  # Wait for animation (1000ms duration + buffer)

        page.screenshot(path='C:/Users/Admin/Desktop/land-viz/test_4_after_reset.png', full_page=True)
        print("   Screenshot after reset")

        print("\n✓ Test complete!")
        print("\nCompare screenshots:")
        print("  - test_1_initial_2d.png (initial state)")
        print("  - test_4_after_reset.png (after reset)")
        print("\nThey should look identical if reset works correctly.")
    else:
        print("   ERROR: Reset View button not found or not visible")

    # Test in 3D mode too
    print("\n5. Testing in 3D mode...")
    page.keyboard.press('v')
    print("   Switched to 3D mode")
    time.sleep(1)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/test_5_3d_initial.png', full_page=True)

    # Zoom and rotate in 3D
    page.mouse.move(640, 400)
    page.mouse.wheel(0, -500)
    time.sleep(1)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/test_6_3d_zoomed.png', full_page=True)

    # Reset in 3D
    reset_button.click()
    time.sleep(2)

    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/test_7_3d_after_reset.png', full_page=True)
    print("   3D mode reset test complete")

    print("\n✓ All tests complete! Browser will close in 3 seconds...")
    time.sleep(3)
    browser.close()
