"""
Test polyline midpoint indicators during active drawing
"""
from playwright.sync_api import sync_playwright
import time

def test_polyline_midpoint_indicators():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # Store console messages
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))

        print("Step 1: Navigate to localhost:5173")
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        print("Step 2: Switch to 2D mode")
        # Click the 2D/3D toggle button (V key or click button)
        page.keyboard.press('v')
        time.sleep(1)

        print("Step 3: Select polyline tool")
        # Press 'P' for polyline tool
        page.keyboard.press('p')
        time.sleep(0.5)

        print("Step 4: Draw polyline - click first point")
        # Click somewhere on the canvas to start polyline
        canvas = page.locator('canvas').first
        canvas.click(position={'x': 400, 'y': 300})
        time.sleep(0.3)

        print("Step 5: Click second point")
        # Click second point
        canvas.click(position={'x': 600, 'y': 300})
        time.sleep(0.3)

        print("Step 6: Move cursor to create preview segment (WITHOUT clicking)")
        # Move cursor to create preview segment - this should show the third midpoint
        canvas.hover(position={'x': 500, 'y': 500})
        time.sleep(1)

        # Continue moving to different positions
        print("Step 7: Move cursor to different positions to observe midpoint indicators")
        for i, (x, y) in enumerate([(450, 450), (550, 550), (500, 600)]):
            print(f"  Position {i+1}: ({x}, {y})")
            canvas.hover(position={'x': x, 'y': y})
            time.sleep(0.5)

        print("\n" + "="*80)
        print("CONSOLE OUTPUT - Looking for debug logs:")
        print("="*80)

        # Filter for our debug logs
        enhanced_logs = [msg for msg in console_messages if 'ENHANCED POLYLINE' in msg]
        snap_debug_logs = [msg for msg in console_messages if 'POLYLINE SNAP DEBUG' in msg]
        filtering_logs = [msg for msg in console_messages if 'SNAP FILTERING' in msg]

        print(f"\nENHANCED POLYLINE logs: {len(enhanced_logs)}")
        for log in enhanced_logs[:5]:  # Show first 5
            print(f"  {log}")

        print(f"\nPOLYLINE SNAP DEBUG logs: {len(snap_debug_logs)}")
        for log in snap_debug_logs[:10]:  # Show first 10
            print(f"  {log}")

        print(f"\nSNAP FILTERING logs: {len(filtering_logs)}")
        for log in filtering_logs[:5]:  # Show first 5
            print(f"  {log}")

        # Save ALL console messages to file to avoid encoding issues
        with open('polyline_console_output.txt', 'w', encoding='utf-8') as f:
            f.write(f"TOTAL CONSOLE MESSAGES: {len(console_messages)}\n")
            f.write("="*80 + "\n\n")
            for i, msg in enumerate(console_messages):
                f.write(f"{i+1}. {msg}\n")

        print(f"\n\nALL CONSOLE MESSAGES saved to: polyline_console_output.txt")
        print(f"Total messages: {len(console_messages)}")

        # Look for specific patterns
        print("\n" + "="*80)
        print("ANALYSIS:")
        print("="*80)

        if enhanced_logs:
            print("[OK] Enhanced polyline creation is working")
        else:
            print("[FAIL] Enhanced polyline NOT being created (preview segment missing)")

        if snap_debug_logs:
            # Check if any log shows 3 points (with preview segment)
            three_point_logs = [log for log in snap_debug_logs if 'pointCount: 3' in log or 'points: 3' in log]
            if three_point_logs:
                print(f"[OK] Found {len(three_point_logs)} logs with 3 points (includes preview segment)")
                print(f"   Example: {three_point_logs[0]}")
            else:
                print("[FAIL] No logs showing 3 points - preview segment NOT being added to snap generation")

        if filtering_logs:
            print("[OK] Snap filtering is active")
        else:
            print("[WARN] No filtering logs (might not be triggering)")

        print("\n" + "="*80)
        print("Taking screenshot...")
        page.screenshot(path='polyline_midpoint_test.png')
        print("Screenshot saved to: polyline_midpoint_test.png")

        time.sleep(2)
        browser.close()

        return console_messages

if __name__ == '__main__':
    messages = test_polyline_midpoint_indicators()
    print(f"\n[DONE] Test completed. Total console messages: {len(messages)}")
