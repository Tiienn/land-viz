"""
Test the adaptive threshold fix for closed polyline midpoint detection.

This test:
1. Draws a large triangle (similar to user's screenshots)
2. Closes it by clicking near the start
3. Hovers over the right edge (previously broken)
4. Verifies midpoint indicator appears
"""

from playwright.sync_api import sync_playwright
import time

def test_adaptive_threshold_fix():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto('http://localhost:5173')
            time.sleep(2)

            print("Switching to 2D mode (V key)...")
            page.keyboard.press('v')
            time.sleep(1)

            print("Selecting polyline tool (P key)...")
            page.keyboard.press('p')
            time.sleep(0.5)

            canvas = page.locator('canvas').first

            # Draw a large triangle (similar to user's screenshots)
            print("Drawing large triangle:")
            print("  Point 1 (300, 400) - bottom-left")
            canvas.click(position={'x': 300, 'y': 400})
            time.sleep(0.5)

            print("  Point 2 (500, 200) - top")
            canvas.click(position={'x': 500, 'y': 200})
            time.sleep(0.5)

            print("  Point 3 (700, 400) - bottom-right")
            canvas.click(position={'x': 700, 'y': 400})
            time.sleep(0.5)

            # Close by clicking near the first point
            print("  Closing polyline by clicking near first point (305, 405)")
            canvas.click(position={'x': 305, 'y': 405})
            time.sleep(1)

            page.screenshot(path='test_adaptive_1_triangle.png')

            # Test the RIGHT EDGE (this was broken before)
            print("\nTesting RIGHT EDGE midpoint (top to bottom-right)...")
            print("  Hovering at (600, 300) - midpoint of right edge")
            canvas.hover(position={'x': 600, 'y': 300})
            time.sleep(1.5)
            page.screenshot(path='test_adaptive_2_RIGHT_EDGE_FIX.png')
            print("  Screenshot: test_adaptive_2_RIGHT_EDGE_FIX.png")

            # Also test bottom edge to confirm it still works
            print("\nTesting BOTTOM EDGE midpoint...")
            print("  Hovering at (500, 400) - midpoint of bottom edge")
            canvas.hover(position={'x': 500, 'y': 400})
            time.sleep(1.5)
            page.screenshot(path='test_adaptive_3_bottom_edge.png')
            print("  Screenshot: test_adaptive_3_bottom_edge.png")

            # Test left edge (closing segment)
            print("\nTesting LEFT EDGE midpoint (closing segment)...")
            print("  Hovering at (400, 300) - midpoint of left edge")
            canvas.hover(position={'x': 400, 'y': 300})
            time.sleep(1.5)
            page.screenshot(path='test_adaptive_4_left_edge.png')
            print("  Screenshot: test_adaptive_4_left_edge.png")

            print("\n" + "="*80)
            print("TEST COMPLETE - Check screenshots for orange midpoint indicators")
            print("="*80)
            print("All 3 edges should now show midpoint indicators!")
            print("\nPress Enter to close browser...")
            input()

        finally:
            browser.close()

if __name__ == '__main__':
    test_adaptive_threshold_fix()
