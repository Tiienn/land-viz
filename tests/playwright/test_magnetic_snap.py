"""
Test magnetic snap functionality by drawing shapes and dragging them
Captures console logs to debug snap detection
"""
from playwright.sync_api import sync_playwright
import time

def test_magnetic_snap():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visible to see what's happening
        page = browser.new_page()

        # Collect console logs
        console_logs = []
        def handle_console(msg):
            console_logs.append(f"[{msg.type}] {msg.text}")
            print(f"[CONSOLE {msg.type}] {msg.text}")

        page.on("console", handle_console)

        # Navigate to app
        print("Navigating to app...")
        page.goto('http://localhost:5174')
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # Wait for app to fully initialize

        # Take initial screenshot
        page.screenshot(path='snap_test_1_initial.png')
        print("Screenshot 1: Initial state")

        # Press 'R' to activate rectangle tool
        print("Activating rectangle tool (press R)...")
        page.keyboard.press('r')
        time.sleep(0.5)

        # Get canvas element
        canvas = page.locator('canvas').first
        canvas_box = canvas.bounding_box()

        if not canvas_box:
            print("ERROR: Canvas not found!")
            browser.close()
            return

        print(f"Canvas found at: {canvas_box}")

        # Draw first rectangle (top-left area)
        print("Drawing first rectangle...")
        x1_start = canvas_box['x'] + 200
        y1_start = canvas_box['y'] + 200

        # Click and drag to create rectangle
        page.mouse.move(x1_start, y1_start)
        page.mouse.down()
        page.mouse.move(x1_start + 100, y1_start + 80, steps=10)
        page.mouse.up()
        time.sleep(0.5)

        page.screenshot(path='snap_test_2_first_rectangle.png')
        print("Screenshot 2: First rectangle drawn")

        # Draw second rectangle (nearby, to the right)
        print("Drawing second rectangle...")
        x2_start = canvas_box['x'] + 400
        y2_start = canvas_box['y'] + 200

        page.mouse.move(x2_start, y2_start)
        page.mouse.down()
        page.mouse.move(x2_start + 100, y2_start + 80, steps=10)
        page.mouse.up()
        time.sleep(0.5)

        page.screenshot(path='snap_test_3_second_rectangle.png')
        print("Screenshot 3: Second rectangle drawn")

        # Switch to select tool
        print("Switching to select tool (press S)...")
        page.keyboard.press('s')
        time.sleep(0.5)

        # Click on second rectangle to select it
        print("Selecting second rectangle...")
        page.mouse.click(x2_start + 50, y2_start + 40)
        time.sleep(0.5)

        page.screenshot(path='snap_test_4_rectangle_selected.png')
        print("Screenshot 4: Rectangle selected")

        # Clear console logs before drag
        print("\n" + "="*60)
        print("STARTING DRAG - Watch for snap detection logs...")
        print("="*60 + "\n")
        console_logs.clear()

        # Drag second rectangle toward first rectangle (should trigger snap)
        print("Dragging second rectangle toward first (triggering snap)...")
        drag_start_x = x2_start + 50
        drag_start_y = y2_start + 40
        drag_end_x = x1_start + 150  # Move it close to first rectangle
        drag_end_y = y1_start + 40

        page.mouse.move(drag_start_x, drag_start_y)
        page.mouse.down()

        # Slow drag with many steps to trigger snap detection
        steps = 30
        for i in range(steps):
            progress = i / steps
            current_x = drag_start_x + (drag_end_x - drag_start_x) * progress
            current_y = drag_start_y + (drag_end_y - drag_start_y) * progress
            page.mouse.move(current_x, current_y)
            time.sleep(0.05)  # Slow enough to see snap happen

        time.sleep(0.5)  # Pause before releasing
        page.screenshot(path='snap_test_5_during_drag.png')
        print("Screenshot 5: During drag")

        page.mouse.up()
        time.sleep(0.5)

        page.screenshot(path='snap_test_6_after_release.png')
        print("Screenshot 6: After release")

        # Print summary of console logs
        print("\n" + "="*60)
        print("CONSOLE LOG SUMMARY")
        print("="*60)

        snap_logs = [log for log in console_logs if 'SNAP' in log or 'DEBUG' in log or 'SnapGrid' in log]

        if snap_logs:
            print(f"\nFound {len(snap_logs)} snap-related logs:")
            for log in snap_logs:
                print(log)
        else:
            print("\n⚠️  NO SNAP LOGS FOUND!")
            print("This means snap detection is not being triggered.")

        # Check for specific log patterns
        print("\n" + "="*60)
        print("DIAGNOSTIC CHECKS")
        print("="*60)

        has_debug_updating = any('DEBUG' in log and 'Updating snap grid' in log for log in console_logs)
        has_snapgrid_processing = any('SnapGrid' in log and 'Processing' in log for log in console_logs)
        has_snap_detected = any('Snap point detected' in log and 'endpoint' in log for log in console_logs)

        print(f"✓ Debug: 'Updating snap grid' messages: {'YES' if has_debug_updating else 'NO'}")
        print(f"✓ SnapGrid: 'Processing shapes' messages: {'YES' if has_snapgrid_processing else 'NO'}")
        print(f"✓ Magnetic snap: 'endpoint/midpoint/center' detected: {'YES' if has_snap_detected else 'NO'}")

        if not has_snap_detected:
            print("\n⚠️  ISSUE DETECTED: Shape snap points are not being generated!")
            print("Only grid snaps are working. Shape-to-shape snapping is broken.")
        else:
            print("\n✅ Magnetic snap is working correctly!")

        print("\nTest complete. Screenshots saved to current directory.")
        print("Keeping browser open for 5 seconds...")
        time.sleep(5)

        browser.close()

        return snap_logs

if __name__ == "__main__":
    test_magnetic_snap()
