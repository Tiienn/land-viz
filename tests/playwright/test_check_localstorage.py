"""
Check localStorage for snap configuration
"""
import asyncio
import json
import sys
from playwright.async_api import async_playwright

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_localstorage():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        print("🌐 Navigating to Land Visualizer...")
        await page.goto('http://localhost:5177')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(2)

        # Get all localStorage keys
        local_storage = await page.evaluate('''() => {
            const storage = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                storage[key] = value;
            }
            return storage;
        }''')

        print("\n📋 localStorage contents:")
        print("=" * 80)
        for key, value in local_storage.items():
            print(f"\nKey: {key}")
            print(f"Value: {value[:200]}..." if len(value) > 200 else f"Value: {value}")

            # Try to parse as JSON
            try:
                parsed = json.loads(value)
                if 'drawing' in parsed and 'snapping' in parsed['drawing']:
                    print("\n🎯 Found snap configuration!")
                    snap_config = parsed['drawing']['snapping']
                    print(json.dumps(snap_config, indent=2))
            except:
                pass

        print("=" * 80)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_localstorage())
