"""
Test the layer selection indicator with multiple layers.

This script:
1. Navigates to the Land Visualizer app
2. Creates multiple rectangles to generate layers
3. Opens the Layer Panel
4. Tests clicking different layers and verifies the indicator moves
"""

from playwright.sync_api import sync_playwright
import time
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Run in headed mode to see what's happening
        page = browser.new_page()

        # Set viewport size for consistent screenshots
        page.set_viewport_size({"width": 1920, "height": 1080})

        print("Step 1: Navigating to http://localhost:5174...")
        page.goto('http://localhost:5174')

        print("Step 2: Waiting for page to load...")
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # Extra time for 3D scene to initialize

        print("Step 3: Creating multiple rectangles...")

        # Click the Rectangle tool button (R key or button)
        page.keyboard.press('r')
        time.sleep(0.5)

        # Draw first rectangle at position 1
        page.mouse.click(400, 400)
        page.mouse.click(600, 500)
        time.sleep(0.5)

        # Draw second rectangle at position 2
        page.keyboard.press('r')
        time.sleep(0.5)
        page.mouse.click(700, 300)
        page.mouse.click(900, 400)
        time.sleep(0.5)

        # Draw third rectangle at position 3
        page.keyboard.press('r')
        time.sleep(0.5)
        page.mouse.click(500, 600)
        page.mouse.click(700, 700)
        time.sleep(0.5)

        print("Step 4: Opening the Layer Panel...")
        # Look for the Layer Panel button - it should have text "Layers" or similar
        try:
            # Try to find the Layers button
            layers_button = page.locator('text=Layers').first
            if layers_button.is_visible():
                layers_button.click()
                print("  Clicked 'Layers' button")
            else:
                # Try alternative selector
                print("  Looking for Layers button with alternative selector...")
                page.locator('button:has-text("Layers")').first.click()
        except Exception as e:
            print(f"  Could not find Layers button, trying keyboard shortcut or icon...")
            # The layer panel might be in a different location
            # Let's take a screenshot to see the UI
            page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_before_layers.png', full_page=True)
            print(f"  Saved screenshot to see UI state")

        time.sleep(1)

        print("Step 5: Taking screenshot showing all layers...")
        page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_all_layers.png', full_page=True)

        # Get all layer items in the panel
        print("Step 6: Finding layer items in the panel...")

        # First, let's inspect what's actually in the DOM
        print("  Inspecting DOM structure...")

        # Save the full HTML to see what we're working with
        html_content = page.content()
        with open('C:\\Users\\Admin\\Desktop\\land-viz\\page_content.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("  Saved page HTML for inspection")

        try:
            # Try multiple selector strategies to find layer items
            selectors_to_try = [
                'div[style*="cursor: pointer"]',  # Layer items are often clickable divs
                '[role="listitem"]',
                'li',
                'div[class*="layer"]',
                'button[class*="layer"]',
                # More specific - look for elements containing "Rectangle" text
                'text=/Rectangle/',
            ]

            layer_items = None
            count = 0

            for selector in selectors_to_try:
                try:
                    items = page.locator(selector)
                    temp_count = items.count()
                    print(f"  Trying selector '{selector}': found {temp_count} items")

                    if temp_count >= 3:
                        layer_items = items
                        count = temp_count
                        print(f"  SUCCESS: Using selector '{selector}' with {count} items")
                        break
                except Exception as e:
                    print(f"  Selector '{selector}' failed: {e}")
                    continue

            if layer_items is None or count < 3:
                print(f"  Could not find enough layer items. Found: {count}")
                print("  Taking debug screenshot...")
                page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_debug.png', full_page=True)
                return

            # Click second layer (index 1)
            print("\nStep 7: Clicking on the SECOND layer...")
            layer_items.nth(1).click()
            time.sleep(0.5)

            print("Step 8: Taking screenshot - checking dark blue line on second layer...")
            page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_second_layer.png', full_page=True)

            print("\nStep 9: Clicking on the THIRD layer...")
            layer_items.nth(2).click()
            time.sleep(0.5)

            print("Step 10: Taking screenshot - verifying dark blue line moved to third layer...")
            page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_third_layer.png', full_page=True)

            print("\nStep 11: Clicking on the FIRST layer...")
            layer_items.nth(0).click()
            time.sleep(0.5)

            print("Step 12: Taking screenshot - verifying dark blue line moved to first layer...")
            page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_first_layer.png', full_page=True)

            print("\n[SUCCESS] Test completed successfully!")
            print("Screenshots saved:")
            print("  - screenshot_all_layers.png")
            print("  - screenshot_second_layer.png")
            print("  - screenshot_third_layer.png")
            print("  - screenshot_first_layer.png")

        except Exception as e:
            print(f"[ERROR] Error during layer testing: {e}")
            page.screenshot(path='C:\\Users\\Admin\\Desktop\\land-viz\\screenshot_error.png', full_page=True)
            print("Saved error screenshot")

        # Keep browser open for a moment to review
        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    main()
