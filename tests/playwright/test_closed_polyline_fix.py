"""
Test that closed polylines show midpoint indicators on ALL segments including the closing segment.

This test:
1. Switches to 2D mode
2. Draws a closed triangle using polyline tool
3. Hovers over each edge to verify midpoint indicators appear
4. Takes screenshots for visual verification
"""

from playwright.sync_api import sync_playwright, Page
import time

def test_closed_polyline_midpoints():
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

            # Draw a triangle
            print("Drawing triangle: Point 1 (400, 300)...")
            canvas.click(position={'x': 400, 'y': 300})
            time.sleep(0.5)

            print("Point 2 (600, 300)...")
            canvas.click(position={'x': 600, 'y': 300})
            time.sleep(0.5)

            print("Point 3 (500, 450)...")
            canvas.click(position={'x': 500, 'y': 450})
            time.sleep(0.5)

            # Close the polyline by clicking near the first point
            print("Closing polyline by clicking near first point (405, 305)...")
            canvas.click(position={'x': 405, 'y': 305})
            time.sleep(1)

            page.screenshot(path='test_closed_1_triangle_complete.png')
            print("[OK] Triangle drawn and closed")

            # Test midpoint indicators on each edge
            print("\nTesting midpoint indicators:")

            # Edge 1: Bottom edge (400,300 to 600,300) - midpoint at (500, 300)
            print("  1. Hovering over bottom edge midpoint (500, 300)...")
            canvas.hover(position={'x': 500, 'y': 300})
            time.sleep(1)
            page.screenshot(path='test_closed_2_bottom_edge.png')
            print("     Screenshot: test_closed_2_bottom_edge.png")

            # Edge 2: Right edge (600,300 to 500,450) - midpoint at (550, 375)
            print("  2. Hovering over right edge midpoint (550, 375)...")
            canvas.hover(position={'x': 550, 'y': 375})
            time.sleep(1)
            page.screenshot(path='test_closed_3_right_edge.png')
            print("     Screenshot: test_closed_3_right_edge.png")

            # Edge 3: Left edge (CLOSING SEGMENT) (500,450 to 400,300) - midpoint at (450, 375)
            print("  3. Hovering over LEFT CLOSING EDGE midpoint (450, 375)...")
            canvas.hover(position={'x': 450, 'y': 375})
            time.sleep(1)
            page.screenshot(path='test_closed_4_LEFT_CLOSING_EDGE.png')
            print("     Screenshot: test_closed_4_LEFT_CLOSING_EDGE.png [CRITICAL - This is the bug fix!]")

            print("\n" + "="*80)
            print("TEST COMPLETE")
            print("="*80)
            print("Check screenshots to verify orange midpoint indicators appear on ALL edges.")
            print("The critical test is screenshot 4 (left closing edge) - this was broken before.")
            print("\nPress Enter to close browser...")
            input()

        finally:
            browser.close()

if __name__ == '__main__':
    test_closed_polyline_midpoints()
