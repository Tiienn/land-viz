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

    # First, create a rectangle so we have layers to view
    print("\nCreating a rectangle...")
    rect_button = page.locator('button:has-text("Rectangle")').first
    if rect_button.count() > 0:
        rect_button.click()
        page.wait_for_timeout(500)

        # Draw rectangle
        canvas = page.locator('canvas').first
        box = canvas.bounding_box()
        if box:
            page.mouse.click(box['x'] + 200, box['y'] + 200)
            page.wait_for_timeout(100)
            page.mouse.click(box['x'] + 400, box['y'] + 300)
            page.wait_for_timeout(500)
            print("Rectangle created")

    # Now look for the Layers icon on the left sidebar
    print("\nSearching for Layers button in left sidebar...")

    # The layers icon is typically in the left sidebar
    # Let's look for all buttons in the left area and try to find one related to layers
    left_buttons = page.locator('button').all()

    for i, btn in enumerate(left_buttons):
        aria_label = btn.get_attribute('aria-label')
        title = btn.get_attribute('title')
        if aria_label:
            print(f"Button {i}: aria-label = {aria_label}")
        if title:
            print(f"Button {i}: title = {title}")

    # Try to find the layers button by aria-label or title
    layers_btn = page.locator('button[aria-label*="ayer"], button[title*="ayer"]').first

    if layers_btn.count() > 0:
        print("\nFound Layers button, clicking it...")
        layers_btn.click()
        page.wait_for_timeout(1000)

        # Take screenshot after opening layers
        print("Taking screenshot with Layers panel open...")
        page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\layers_panel_open.png')

        # Look for layer items
        print("\nLooking for layer items...")
        # Layers typically show as a list with shape names
        layer_items = page.locator('[class*="layer"]').all()
        print(f"Found {len(layer_items)} potential layer items")

        # Take a close-up of the layers area
        print("Taking close-up screenshot...")
        page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\layers_closeup.png')

    else:
        print("Layers button not found. Taking screenshot anyway...")
        page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\no_layers_button.png')

    print("\n=== Test Complete ===")
    browser.close()
