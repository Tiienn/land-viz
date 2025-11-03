# Playwright MCP Setup for Windows

## Issue: MCP Connection Failed

When running `claude mcp list`, you see:
```
playwright: npx @playwright/mcp@latest  - ✗ Failed to connect
```

## Root Cause

On Windows, MCP servers using `npx` with stdio transport require the `cmd /c` wrapper to execute properly. This is a Claude Code + Windows-specific requirement.

## Solution 1: Fix stdio Configuration (Recommended)

### Find Your MCP Config File

Claude Code stores MCP configuration in one of these locations:
- `%USERPROFILE%\.claude\mcp.json`
- `%APPDATA%\claude-code\mcp.json`
- `%LOCALAPPDATA%\claude-code\mcp.json`

### Edit the Configuration

Open the MCP config file and change the playwright entry from:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

To:

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

### Restart Claude Code

After saving the file, fully restart Claude Code for the changes to take effect.

### Verify the Fix

Run:
```bash
claude mcp list
```

You should see:
```
playwright: cmd /c npx @playwright/mcp@latest - ✓ Connected
```

## Solution 2: Use HTTP Transport (Alternative)

If you can't find the config file or prefer a different approach, run Playwright MCP as a standalone HTTP server.

### Start the HTTP Server

```bash
npx @playwright/mcp@latest --port 8931
```

Keep this terminal running while using Claude Code.

### Configure Claude Code for HTTP

Update your MCP configuration to:

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

### Verify the Connection

Run:
```bash
claude mcp list
```

You should see the playwright server connected via HTTP.

## Solution 3: Use WSL (Windows Subsystem for Linux)

If you have WSL installed, run Claude Code from WSL where `npx` works directly without the `cmd /c` wrapper:

```bash
# In WSL terminal
claude mcp add playwright npx @playwright/mcp@latest
```

## Configuration Options

### Common Command-Line Arguments

Add these to the `args` array in your config:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--viewport-size", "1920x1080",
        "--timeout-action", "10000"
      ]
    }
  }
}
```

**Useful options:**
- `--browser <type>` - Browser: chrome, firefox, webkit, msedge
- `--viewport-size <size>` - Viewport: "1920x1080", "1280x720"
- `--timeout-action <ms>` - Action timeout in milliseconds
- `--timeout-navigation <ms>` - Navigation timeout in milliseconds
- `--headless` - Run in headless mode (default is headed)
- `--user-data-dir <path>` - Persistent profile directory
- `--isolated` - Use isolated sessions (no state)
- `--save-screenshot` - Auto-save screenshots
- `--save-trace` - Save Playwright traces

### Windows Profile Location

Default persistent profile path:
```
%USERPROFILE%\AppData\Local\ms-playwright\mcp-chrome-profile
```

Override with:
```json
{
  "args": ["/c", "npx", "@playwright/mcp@latest", "--user-data-dir", "C:\\path\\to\\profile"]
}
```

## Troubleshooting

### 1. "Failed to connect" error

- Verify Playwright browsers are installed: `npx playwright install chromium`
- Check Node.js version: Must be 18 or newer
- Try HTTP transport mode instead

### 2. Browser doesn't launch

- Install browsers: `npx playwright install`
- Try `--browser chrome` explicitly
- Check firewall/antivirus settings

### 3. Permission errors

- Run as Administrator (if needed)
- Check folder permissions for profile directory

### 4. Port conflicts (HTTP mode)

- Change port: `--port 8932`
- Check what's using 8931: `netstat -ano | findstr 8931`

## Available Playwright MCP Tools

Once connected, you can use these tools:

**Navigation:**
- `browser_navigate` - Navigate to URL
- `browser_navigate_back` - Go back
- `browser_navigate_forward` - Go forward

**Interaction:**
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_drag` - Drag and drop
- `browser_hover` - Hover over elements

**Analysis:**
- `browser_snapshot` - Get page accessibility snapshot
- `browser_take_screenshot` - Capture screenshot
- `browser_console_messages` - Get console logs
- `browser_network_requests` - Get network activity

**Advanced:**
- `browser_evaluate` - Execute JavaScript
- `browser_file_upload` - Upload files
- `browser_wait_for` - Wait for conditions

## Resources

- **Playwright MCP Repo**: https://github.com/microsoft/playwright-mcp
- **Claude Code MCP Docs**: https://docs.claude.com/en/docs/claude-code/mcp
- **Report Issues**: https://github.com/anthropics/claude-code/issues
