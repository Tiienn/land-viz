"""
Test the 25% adaptive threshold fix for closed polylines.

Reproduces user's exact test case:
1. 2D mode
2. Polyline > point 1 (top) > point 2 (left down) > point 3 (down right) > point 4 closing (join top)
3. A triangle will create. Select triangle
4. Check midpoint indicator on last line drawn (from point 3 to point 4/1)
"""

from playwright.sync_api import sync_playwright
import time

def test_user_scenario():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        try:
            print("="*80)
            print("Testing User's Exact Scenario")
            print("="*80)

            # Step 1: 2D mode
            print("\n1. Navigating and switching to 2D mode...")
            page.goto('http://localhost:5173')
            time.sleep(2)
            page.keyboard.press('v')  # 2D mode
            time.sleep(1)

            # Step 2: Draw polyline with 3 points + close
            print("2. Drawing polyline:")
            page.keyboard.press('p')  # Polyline tool
            time.sleep(0.5)

            canvas = page.locator('canvas').first

            print("   Point 1 (top): (500, 200)")
            canvas.click(position={'x': 500, 'y': 200})
            time.sleep(0.5)

            print("   Point 2 (left down): (350, 400)")
            canvas.click(position={'x': 350, 'y': 400})
            time.sleep(0.5)

            print("   Point 3 (down right): (650, 400)")
            canvas.click(position={'x': 650, 'y': 400})
            time.sleep(0.5)

            print("   Point 4 (closing - join top): clicking near (500, 200)")
            # Click near the first point to close (within gridSize * 2.0 threshold)
            canvas.click(position={'x': 503, 'y': 203})
            time.sleep(1)

            # Step 3: Select triangle
            print("3. Selecting triangle...")
            page.keyboard.press('s')  # Select tool
            time.sleep(0.5)
            canvas.click(position={'x': 500, 'y': 300})  # Click on triangle
            time.sleep(1)

            page.screenshot(path='test_25pct_1_triangle_selected.png')
            print("   Screenshot: test_25pct_1_triangle_selected.png")

            # Step 4: Check midpoint on last line drawn (point 3 to point 1)
            print("4. Checking midpoint on LAST LINE DRAWN (point 3 to point 1)...")
            print("   This is the RIGHT EDGE of the triangle (closing segment)")

            # The last line drawn is from (650, 400) to (500, 200)
            # Midpoint is approximately (575, 300)
            print("   Hovering at (575, 300) - midpoint of closing edge")
            canvas.hover(position={'x': 575, 'y': 300})
            time.sleep(2)

            page.screenshot(path='test_25pct_2_CLOSING_EDGE_MIDPOINT.png')
            print("   Screenshot: test_25pct_2_CLOSING_EDGE_MIDPOINT.png")
            print("   ** This should show orange midpoint indicator! **")

            # Also test other edges for completeness
            print("\n5. Testing other edges for completeness...")

            print("   Bottom edge (left to right): (500, 400)")
            canvas.hover(position={'x': 500, 'y': 400})
            time.sleep(1.5)
            page.screenshot(path='test_25pct_3_bottom_edge.png')

            print("   Left edge (top to left): (425, 300)")
            canvas.hover(position={'x': 425, 'y': 300})
            time.sleep(1.5)
            page.screenshot(path='test_25pct_4_left_edge.png')

            print("\n" + "="*80)
            print("TEST COMPLETE")
            print("="*80)
            print("Check screenshot #2 for orange midpoint on closing edge!")
            print("With 25% threshold, this should now work reliably.")
            print("\nPress Enter to close...")
            input()

        finally:
            browser.close()

if __name__ == '__main__':
    test_user_scenario()
