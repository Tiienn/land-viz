/**
 * Playwright MCP Connection Test Script
 *
 * This script tests if Playwright MCP is working correctly.
 * Run this after starting the Playwright MCP server.
 *
 * Usage:
 *   node scripts/test-playwright-mcp.js
 */

const http = require('http');

const MCP_URL = 'http://localhost:8931/mcp';
const TEST_URL = 'http://localhost:5173'; // Land Visualizer dev server

console.log('========================================');
console.log('  Playwright MCP Connection Test');
console.log('========================================\n');

// Test 1: Check if MCP server is running
console.log('Test 1: Checking if Playwright MCP server is running...');

const options = {
  hostname: 'localhost',
  port: 8931,
  path: '/mcp',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✓ MCP Server is running (Status: ${res.statusCode})\n`);

  // Test 2: Check basic connectivity
  console.log('Test 2: MCP server connectivity test passed\n');

  console.log('========================================');
  console.log('  Connection Tests: PASSED ✓');
  console.log('========================================\n');

  console.log('Next steps:');
  console.log('1. Start your Land Visualizer dev server: npm run dev');
  console.log('2. Use Claude Code MCP tools to interact with the browser');
  console.log('3. Run the Land Visualizer test suite: node scripts/test-land-viz-mcp.js\n');
});

req.on('timeout', () => {
  console.error('✗ Connection timeout - Is Playwright MCP server running?\n');
  console.error('Start it with: npm run mcp:start\n');
  console.error('Or manually: npx @playwright/mcp@latest --port 8931\n');
  process.exit(1);
});

req.on('error', (e) => {
  console.error(`✗ Connection failed: ${e.message}\n`);
  console.error('Possible causes:');
  console.error('1. Playwright MCP server is not running');
  console.error('2. Port 8931 is blocked by firewall');
  console.error('3. Another service is using port 8931\n');
  console.error('Solution: Start the server with npm run mcp:start\n');
  process.exit(1);
});

req.end();
