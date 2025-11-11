from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to the app
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')

    print("App loaded, waiting for 2D mode toggle...")
    time.sleep(2)

    # Take initial screenshot
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/screenshot_initial.png', full_page=True)
    print("Initial screenshot taken")

    # Find and click the 2D/3D toggle button (V key or button)
    # Look for the toggle button
    try:
        # Press V key to toggle to 2D mode
        page.keyboard.press('v')
        print("Pressed V key to toggle 2D mode")
        time.sleep(1)

        # Take screenshot in 2D mode
        page.screenshot(path='C:/Users/Admin/Desktop/land-viz/screenshot_2d_mode.png', full_page=True)
        print("2D mode screenshot taken")

        # Try to zoom in/out using mouse wheel
        print("Zooming in 2D mode...")
        page.mouse.move(640, 400)  # Center of screen
        page.mouse.wheel(0, -500)  # Zoom in
        time.sleep(1)

        # Take screenshot after zoom
        page.screenshot(path='C:/Users/Admin/Desktop/land-viz/screenshot_2d_zoomed.png', full_page=True)
        print("Zoomed screenshot taken")

        # Find Reset View button - it should be in the left panel
        # Look for button with text "Reset View"
        reset_button = page.get_by_text("Reset View")

        if reset_button.count() > 0:
            print(f"Found {reset_button.count()} Reset View button(s)")

            # Check if button is visible
            if reset_button.is_visible():
                print("Reset View button is visible, clicking...")
                reset_button.click()
                time.sleep(2)  # Wait for animation

                # Take screenshot after reset
                page.screenshot(path='C:/Users/Admin/Desktop/land-viz/screenshot_after_reset.png', full_page=True)
                print("After reset screenshot taken")
            else:
                print("Reset View button exists but is not visible")
        else:
            print("Reset View button not found")
            # Print all buttons to debug
            buttons = page.locator('button').all()
            print(f"\nFound {len(buttons)} buttons:")
            for i, btn in enumerate(buttons[:10]):  # First 10 buttons
                text = btn.inner_text()
                if text:
                    print(f"  Button {i}: '{text}'")

        # Get console logs
        print("\nConsole logs:")
        page.on("console", lambda msg: print(f"  {msg.type}: {msg.text}"))

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path='C:/Users/Admin/Desktop/land-viz/screenshot_error.png', full_page=True)

    # Keep browser open for manual inspection
    print("\nBrowser will close in 5 seconds...")
    time.sleep(5)
    browser.close()
