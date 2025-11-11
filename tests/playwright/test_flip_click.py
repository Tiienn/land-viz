from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Collect console messages
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

    # Navigate
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Draw rectangle
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
    print("Rectangle selected")

    # Clear console
    console_messages.clear()

    # Click Flip button
    flip_button = page.locator('button:has-text("Flip")')
    flip_button.click()
    time.sleep(1)
    print("\nFlip button clicked, dropdown should be open")

    # Click Flip Horizontally
    print("\nAttempting to click 'Flip Horizontally'...")
    h_flip = page.locator('text=Flip Horizontally')
    if h_flip.count() > 0:
        print(f"Found Flip Horizontally button, visible: {h_flip.is_visible()}")
        h_flip.click()
        time.sleep(2)
        print("Clicked Flip Horizontally")
    else:
        print("ERROR: Flip Horizontally button not found!")

    # Print console logs
    print("\n=== CONSOLE LOGS ===")
    for msg in console_messages:
        print(msg)
    print("=== END CONSOLE LOGS ===\n")

    # Take screenshot
    page.screenshot(path='C:/Users/Admin/Desktop/land-viz/flip_after_h_click.png')
    print("Screenshot saved")

    print("\nBrowser will close in 5 seconds...")
    time.sleep(5)
    browser.close()
