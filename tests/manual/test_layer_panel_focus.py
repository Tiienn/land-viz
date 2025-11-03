from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to http://localhost:5174...")
    page.goto('http://localhost:5174')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Set viewport to a good size
    page.set_viewport_size({"width": 1920, "height": 1080})

    # Take initial screenshot
    print("Taking initial screenshot...")
    page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\layer_panel_initial.png')

    # Look for the layer panel button/icon on the left sidebar
    print("\nLooking for layer panel button...")
    # Try to find layer-related icons or buttons
    layer_buttons = page.locator('button, [role="button"]').all()

    print(f"Found {len(layer_buttons)} buttons total")

    # Click on what might be the layers icon (typically has stacked squares or similar icon)
    # Let's try clicking on the left sidebar area
    print("\nClicking on left sidebar to open layer panel...")

    # Try to find a layers icon - usually represented by stacked squares/layers
    page.wait_for_timeout(1000)

    # Take a screenshot focusing on the left side
    print("Taking screenshot of left sidebar...")
    page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\layer_panel_sidebar.png')

    # Look for any panel that might be the layer panel
    # The layer panel should show shapes/layers
    print("\nSearching for layer items...")

    # Get the page HTML to see what's available
    print("\nSearching for elements with 'layer' in text...")
    layer_text = page.locator('text=/layer/i').all()
    print(f"Found {len(layer_text)} elements with 'layer' in text")

    # Try to find rectangle items in the layers
    print("\nSearching for 'Rectangle' in page...")
    rect_items = page.locator('text=/rectangle/i').all()
    print(f"Found {len(rect_items)} elements with 'rectangle' text")

    if len(rect_items) > 0:
        print("\nRectangle items found - taking screenshot...")
        page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\layer_panel_with_items.png')

        # Try to click on the first rectangle item
        print("Clicking on first rectangle item...")
        rect_items[0].click()
        page.wait_for_timeout(500)

        print("Taking screenshot after selection...")
        page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\layer_panel_selected.png')

    # Take a final full page screenshot
    print("\nTaking final full page screenshot...")
    page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\layer_panel_final.png', full_page=True)

    print("\n=== Test Complete ===")
    print("Screenshots saved to land-viz folder")

    browser.close()
