from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Collect console messages
    console_logs = []
    page.on("console", lambda msg: console_logs.append({
        "type": msg.type,
        "text": msg.text,
        "location": msg.location
    }))
    
    # Navigate to the app
    print("Navigating to http://localhost:5173...")
    page.goto('http://localhost:5173', wait_until='networkidle')
    print("Page loaded")
    
    # Wait for the canvas to be ready
    page.wait_for_timeout(2000)
    
    # Take initial screenshot
    page.screenshot(path='/tmp/initial.png')
    print("Initial screenshot taken")
    
    # Draw a rectangle first (click to start drawing)
    print("Drawing a rectangle...")
    page.click('canvas', button='left', position={'x': 200, 'y': 200})
    page.click('canvas', button='left', position={'x': 400, 'y': 400})
    page.wait_for_timeout(500)
    
    # Now select the shape by clicking on it
    print("Selecting the shape...")
    page.click('canvas', button='left', position={'x': 300, 'y': 300})
    page.wait_for_timeout(500)
    
    # Take screenshot before resize
    page.screenshot(path='/tmp/before_resize.png')
    
    # Now perform a resize operation - drag from a corner
    print("Starting resize operation...")
    page.mouse.move(400, 400)
    page.mouse.down()
    page.wait_for_timeout(200)
    page.mouse.move(500, 500)  # Drag to resize
    page.wait_for_timeout(300)
    
    # Capture console logs during resize
    current_logs = [log for log in console_logs]
    print("\n=== Console Logs During Resize ===")
    for log in current_logs:
        print(f"[{log['type'].upper()}] {log['text']}")
    
    page.mouse.up()
    page.wait_for_timeout(500)
    
    # Take screenshot after resize
    page.screenshot(path='/tmp/after_resize.png')
    
    # Get all console logs captured
    print("\n=== All Console Logs ===")
    for i, log in enumerate(console_logs, 1):
        print(f"{i}. [{log['type'].upper()}] {log['text']}")
    
    print("\nScreenshots saved to /tmp/")
    print("Console logs captured above")
    
    browser.close()
