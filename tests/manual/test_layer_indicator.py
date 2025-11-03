from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to http://localhost:5174...")
    page.goto('http://localhost:5174')

    # Wait for the page to load and JavaScript to execute
    print("Waiting for page to load...")
    page.wait_for_load_state('networkidle')

    # Give it a bit more time for React to render
    page.wait_for_timeout(2000)

    # Take an initial screenshot
    print("Taking initial screenshot...")
    page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_initial.png', full_page=True)

    # Look for the Layer Panel
    print("\nSearching for Layer Panel...")
    layer_panel = page.locator('[class*="LayerPanel"]').first
    if layer_panel.count() > 0:
        print("Layer Panel found")
    else:
        print("Layer Panel not found by class. Trying alternative selectors...")
        # Try to find by text content
        layer_panel = page.locator('text=Layers').locator('..').locator('..')

    # Check for layers in the panel
    print("\nSearching for layers...")
    layers = page.locator('[class*="layer"]').all()
    print(f"Found {len(layers)} elements with 'layer' in class name")

    # Look for selection indicators (blue lines)
    print("\nSearching for selection indicators...")
    indicators = page.locator('[style*="background"]').all()

    # Get the page content for analysis
    content = page.content()

    # Take a focused screenshot of the left side where Layer Panel should be
    print("\nTaking focused screenshot of left panel area...")
    page.set_viewport_size({"width": 1920, "height": 1080})
    page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_focused.png')

    # Try to create some shapes to populate layers
    print("\nAttempting to create shapes to populate layers...")

    # Look for the Rectangle tool button
    rect_button = page.locator('button:has-text("Rectangle")').first
    if rect_button.count() == 0:
        # Try alternative selector - look for buttons with R or rectangle icon
        rect_button = page.locator('button').filter(has_text='R').first

    if rect_button.count() > 0:
        print("Found Rectangle tool button")
        rect_button.click()
        page.wait_for_timeout(500)

        # Try to draw a rectangle in the canvas
        canvas_area = page.locator('canvas').first
        if canvas_area.count() > 0:
            print("Found canvas")
            box = canvas_area.bounding_box()
            if box:
                # Click to start drawing
                page.mouse.click(box['x'] + 200, box['y'] + 200)
                page.wait_for_timeout(100)
                # Click to end drawing
                page.mouse.click(box['x'] + 400, box['y'] + 300)
                page.wait_for_timeout(500)

                print("Drew first rectangle")

                # Take screenshot after drawing
                page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_after_rect1.png', full_page=True)

                # Draw another rectangle
                page.mouse.click(box['x'] + 500, box['y'] + 200)
                page.wait_for_timeout(100)
                page.mouse.click(box['x'] + 700, box['y'] + 300)
                page.wait_for_timeout(500)

                print("Drew second rectangle")

                # Take screenshot after second shape
                page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_after_rect2.png', full_page=True)

    # Now check the Layer Panel again
    print("\nChecking Layer Panel after creating shapes...")
    page.wait_for_timeout(1000)

    # Look for layer items
    layer_items = page.locator('[style*="cursor: pointer"]').all()
    print(f"Found {len(layer_items)} clickable layer items")

    # Take final screenshot
    print("\nTaking final screenshot...")
    page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_final.png', full_page=True)

    # Get any console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))

    print("\n=== Test Complete ===")
    print("Screenshots saved:")
    print("  - screenshot_initial.png")
    print("  - screenshot_focused.png")
    print("  - screenshot_after_rect1.png (if rectangles were created)")
    print("  - screenshot_after_rect2.png (if rectangles were created)")
    print("  - screenshot_final.png")

    browser.close()
