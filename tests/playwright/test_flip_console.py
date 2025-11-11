from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Collect console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

    # Navigate to the app
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    print("App loaded")
    time.sleep(2)

    # Draw rectangle
    print("\n1. Drawing rectangle...")
    page.keyboard.press('r')
    time.sleep(0.5)
    page.mouse.move(540, 350)
    page.mouse.down()
    page.mouse.move(740, 450, steps=10)
    page.mouse.up()
    time.sleep(1)

    # Select
    page.mouse.click(640, 400)
    time.sleep(1)
    print("   Rectangle selected")

    # Clear console messages before clicking
    console_messages.clear()

    # Click Flip button
    print("\n2. Clicking Flip button...")
    flip_button = page.locator('button:has-text("Flip")')
    flip_button.click()
    time.sleep(2)  # Wait for dropdown to render and logs to appear

    # Print all console messages
    print("\n=== CONSOLE LOGS ===")
    for msg in console_messages:
        print(msg)
    print("=== END CONSOLE LOGS ===\n")

    # Check dropdown
    dropdown = page.locator('div:has-text("Flip Horizontally")').first
    print(f"Dropdown elements found: {dropdown.count()}")
    if dropdown.count() > 0:
        print(f"Dropdown visible: {dropdown.is_visible()}")
        box = dropdown.bounding_box()
        print(f"Dropdown bounding box: {box}")

    print("\nBrowser will stay open for 10 seconds...")
    time.sleep(10)
    browser.close()
