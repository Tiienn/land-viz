# Playwright MCP for Land Visualizer - Complete Guide

## What is Playwright MCP?

Playwright MCP is a browser automation server that lets Claude Code interact with web pages through structured accessibility snapshots (not screenshots). Perfect for testing your Land Visualizer!

## Quick Start

### 1. Fix the Connection Issue (Windows)

Your `Failed to reconnect to playwright` error is because Windows requires the `cmd /c` wrapper for npx-based MCP servers.

**Find your MCP config** in one of these locations:
- `%USERPROFILE%\.claude\mcp.json`
- `%APPDATA%\claude-code\mcp.json`
- `%LOCALAPPDATA%\claude-code\mcp.json`

**Edit it** to add the Windows wrapper:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "@playwright/mcp@latest"]
    }
  }
}
```

**Restart Claude Code** and verify:
```bash
claude mcp list
# Should show: playwright: ✓ Connected
```

### 2. Alternative: Use HTTP Transport (No config edit needed!)

If you can't find the config file, use HTTP mode instead:

```bash
# Terminal 1: Start Playwright MCP server
npm run mcp:start

# Terminal 2: Start Land Visualizer
cd app
npm run dev
```

Then configure Claude Code to use HTTP (if needed - usually auto-detected):
```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

### 3. Verify Everything Works

```bash
# Test the connection
npm run mcp:test

# You should see:
# ✓ MCP Server is running
# ✓ Connection Tests: PASSED
```

## Available npm Scripts

We've added these convenient commands to `package.json`:

```bash
npm run mcp:start          # Start Playwright MCP server (headed mode)
npm run mcp:start:headless # Start in headless mode (faster, no UI)
npm run mcp:test           # Test if MCP is connected
npm run mcp:install        # Install Playwright browsers
```

## Quick Test Examples

Once connected, try these in Claude Code:

### Example 1: Visual Check
> Navigate to http://localhost:5173, take a screenshot, and check the console for errors.

### Example 2: Test Rectangle Tool
> Click the Rectangle tool, draw a rectangle on the canvas, and verify it appears in the layer panel.

### Example 3: Test Conversions
> Open the Convert panel, enter 100 square meters, and verify all conversions are correct.

### Example 4: Test Keyboard Shortcuts
> Press R, C, S, P and verify they activate Rectangle, Circle, Select, and Polyline tools.

### Example 5: Accessibility Check
> Check for ARIA labels, test keyboard navigation with Tab, and verify focus indicators are visible.

## Documentation Files

All documentation is in the `docs/` directory:

### Setup & Configuration
- **`docs/setup/PLAYWRIGHT_MCP_WINDOWS_SETUP.md`** - Full Windows setup guide
  - Root cause of connection issue
  - 3 different solutions (stdio, HTTP, WSL)
  - Configuration options
  - Troubleshooting guide
  - Windows profile locations

### Testing & Examples
- **`docs/testing/PLAYWRIGHT_MCP_EXAMPLES.md`** - Comprehensive examples
  - 10 detailed test scenarios
  - Real Claude Code prompts you can copy/paste
  - Behind-the-scenes tool calls
  - Expected results for each test
  - Tips for effective testing
  - Troubleshooting common issues

### Test Scripts
- **`scripts/test-playwright-mcp.js`** - Connection verification script
- **`scripts/test-land-viz-mcp.md`** - Full test suite guide

### Startup Scripts
- **`scripts/start-playwright-mcp.bat`** - Start HTTP server (headed)
- **`scripts/start-playwright-mcp-headless.bat`** - Start HTTP server (headless)
- **`scripts/playwright-mcp-config.json`** - Example MCP configuration

## Available Playwright MCP Tools

Once connected, you can use these tools in Claude Code:

### Navigation
- `browser_navigate` - Go to URL
- `browser_navigate_back` - Go back
- `browser_navigate_forward` - Go forward

### Interaction
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_drag` - Drag and drop
- `browser_hover` - Hover elements
- `browser_press_key` - Press keyboard keys

### Analysis
- `browser_snapshot` - Get accessibility tree
- `browser_take_screenshot` - Capture screenshot
- `browser_console_messages` - Get console logs
- `browser_network_requests` - Get network activity

### Advanced
- `browser_evaluate` - Run JavaScript
- `browser_file_upload` - Upload files
- `browser_wait_for` - Wait for conditions
- `browser_resize` - Change viewport size

## Test Scenarios Covered

The examples document covers:

1. ✅ **Visual Check** - Page loads correctly
2. ✅ **Rectangle Drawing** - Drawing tools work
3. ✅ **Unit Conversion** - Math is accurate
4. ✅ **Keyboard Shortcuts** - All shortcuts functional
5. ✅ **Text Tool** - Text creation and editing
6. ✅ **Shape Resizing** - Resize handles work
7. ✅ **Visual Comparison** - 3D models load
8. ✅ **Responsive Design** - Mobile/tablet/desktop
9. ✅ **Undo/Redo** - State management works
10. ✅ **Accessibility** - WCAG 2.1 AA compliance

## Workflow

### For Quick Testing
1. Start MCP server: `npm run mcp:start`
2. Start dev server: `cd app && npm run dev`
3. Ask Claude Code: "Navigate to localhost:5173 and take a screenshot"

### For Comprehensive Testing
1. Start both servers
2. Ask Claude Code: "Run the full test suite from docs/testing/PLAYWRIGHT_MCP_EXAMPLES.md"
3. Review screenshots and results

### For Debugging Issues
1. Start servers
2. Ask Claude Code: "Navigate to the app, reproduce [the issue], and show me screenshots and console messages"

## Common Use Cases

### Before Pushing Code
> Navigate to localhost:5173, run through the main features (drawing, converting, comparing), and report any visual issues or console errors.

### After UI Changes
> Test the app at mobile (375px), tablet (768px), and desktop (1920px) sizes. Verify responsive design works correctly.

### Before Releases
> Run a full accessibility audit: check ARIA labels, test keyboard navigation, verify focus indicators, and confirm WCAG 2.1 AA compliance.

### Performance Testing
> Navigate to the app, create 20 shapes, measure frame rate, and report any performance issues.

## Troubleshooting

### "Failed to connect" Error
**You're here!** Follow the Quick Start above to fix it.

### Browser Doesn't Launch
```bash
# Install browsers
npm run mcp:install
# Or manually
npx playwright install chromium
```

### Screenshots Are Blank
Add wait time for 3D rendering:
> Wait 2 seconds after navigation before taking a screenshot.

### Elements Not Found
Use snapshot first to see what's available:
> Get a page snapshot first, then try clicking the element.

### Port Already in Use
Change the port:
```bash
npx @playwright/mcp@latest --port 8932
```

### Server Won't Start
Kill existing node processes:
```bash
taskkill /f /im node.exe
```

## Best Practices

1. **Always start with browser_snapshot** - See what's on the page
2. **Take screenshots frequently** - Verify visual state
3. **Check console messages** - Catch JavaScript errors
4. **Wait for animations** - Use browser_wait_for for 3D models
5. **Test at multiple viewport sizes** - Responsive design
6. **Use accessibility tree** - More reliable than visual selectors

## Resources

- **Playwright MCP Repo**: https://github.com/microsoft/playwright-mcp
- **Claude Code MCP Docs**: https://docs.claude.com/en/docs/claude-code/mcp
- **Setup Guide**: `docs/setup/PLAYWRIGHT_MCP_WINDOWS_SETUP.md`
- **Examples**: `docs/testing/PLAYWRIGHT_MCP_EXAMPLES.md`
- **Test Scripts**: `scripts/test-*.js`

## Next Steps

1. **Fix your connection** using the Quick Start guide
2. **Try Example 1** (Visual Check) to verify everything works
3. **Explore the examples** in `docs/testing/PLAYWRIGHT_MCP_EXAMPLES.md`
4. **Integrate into your workflow** for regular testing

## Questions?

- Check `docs/setup/PLAYWRIGHT_MCP_WINDOWS_SETUP.md` for detailed setup
- See `docs/testing/PLAYWRIGHT_MCP_EXAMPLES.md` for testing examples
- Ask Claude Code: "Help me test the Land Visualizer with Playwright MCP"

---

**Ready to test?** Start with:
```bash
npm run mcp:start
```

Then ask Claude Code:
> Navigate to http://localhost:5173 and take a screenshot!
