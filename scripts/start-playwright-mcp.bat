@echo off
REM Playwright MCP HTTP Server Startup Script
REM This runs Playwright MCP as a standalone HTTP server on port 8931
REM Keep this terminal running while using Claude Code

echo ========================================
echo  Playwright MCP HTTP Server
echo ========================================
echo.
echo Starting Playwright MCP on http://localhost:8931/mcp
echo.
echo Browser: Chrome (headed mode)
echo Viewport: 1920x1080
echo Action Timeout: 10000ms
echo.
echo Keep this terminal open while using Claude Code!
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

npx @playwright/mcp@latest --port 8931 --browser chrome --viewport-size 1920x1080 --timeout-action 10000

pause
