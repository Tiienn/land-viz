# Playwright MCP Examples for Land Visualizer

This document shows real-world examples of testing the Land Visualizer using Playwright MCP tools in Claude Code.

## Setup

Before running these examples:

```bash
# Terminal 1: Start Playwright MCP server
npm run mcp:start

# Terminal 2: Start Land Visualizer dev server
cd app
npm run dev
```

---

## Example 1: Quick Visual Check

**Goal**: Verify the app loads and looks correct

**What to ask Claude Code**:
> Navigate to http://localhost:5173, take a screenshot, and check the console for errors.

**Behind the scenes (what Claude Code will do)**:
```javascript
// 1. Navigate to the app
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Wait for page to load
mcp__playwright__browser_wait_for({ timeout: 2000 })

// 3. Take screenshot
mcp__playwright__browser_take_screenshot({ name: "land-viz-initial-load.png" })

// 4. Check console for errors
mcp__playwright__browser_console_messages()
```

**Expected output**:
- Screenshot showing the app with header, tools panel, and 3D scene
- Console messages showing no errors (only info/debug logs)

**What Claude will tell you**:
> "The Land Visualizer loaded successfully. I can see the gradient header with 'Land Visualizer' text, the tools panel on the left with Rectangle, Circle, Polyline tools, and the 3D canvas in the center. No errors in the console."

---

## Example 2: Test Rectangle Drawing

**Goal**: Verify the rectangle tool creates shapes correctly

**What to ask Claude Code**:
> Test the rectangle tool by clicking it, drawing a rectangle on the canvas, and verify it appears in the layer panel.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Get page snapshot to find Rectangle button
mcp__playwright__browser_snapshot()

// 3. Click Rectangle tool button
mcp__playwright__browser_click({
  selector: 'button[aria-label="Rectangle (R)"]'
})

// 4. Click canvas to start rectangle (first corner)
mcp__playwright__browser_click({
  x: 800,
  y: 400
})

// 5. Click canvas to finish rectangle (opposite corner)
mcp__playwright__browser_click({
  x: 1000,
  y: 600
})

// 6. Take screenshot
mcp__playwright__browser_take_screenshot({ name: "rectangle-drawn.png" })

// 7. Get snapshot to verify layer panel shows the rectangle
mcp__playwright__browser_snapshot()
```

**Expected output**:
- Screenshot shows blue rectangle on canvas
- Snapshot shows "Rectangle 1" in accessibility tree under layer panel

**What Claude will tell you**:
> "Successfully created a rectangle! The tool activated when clicked, and I drew a rectangle by clicking two points on the canvas. The layer panel now shows 'Rectangle 1', and the properties panel displays the dimensions (200 x 200 units). The rectangle is rendered in blue on the canvas."

---

## Example 3: Test Unit Conversion

**Goal**: Verify conversion calculations are accurate

**What to ask Claude Code**:
> Open the Convert panel, enter 100 square meters, and verify all conversions are correct.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Click Convert button in ribbon
mcp__playwright__browser_click({
  selector: 'button[aria-label="Convert"]'
})

// 3. Find the square meters input
mcp__playwright__browser_snapshot()

// 4. Type 100 in the input
mcp__playwright__browser_type({
  selector: 'input[aria-label="Square Meters"]',
  text: "100"
})

// 5. Take screenshot
mcp__playwright__browser_take_screenshot({ name: "conversion-results.png" })

// 6. Get snapshot to read conversion values
mcp__playwright__browser_snapshot()
```

**Expected output**:
- Conversions display:
  - 1,076.39 sq ft
  - 119.60 sq yd
  - 0.0247 acres
  - 10,000 sq cm
  - And 8 more units

**What Claude will tell you**:
> "Conversion panel is working perfectly! I entered 100 m² and got accurate conversions:
> - Square Feet: 1,076.39
> - Square Yards: 119.60
> - Acres: 0.0247
> - Hectares: 0.01
> All mathematical conversions are correct. The UI uses Canva-style cards with proper spacing and the brand teal accent color."

---

## Example 4: Test Keyboard Shortcuts

**Goal**: Verify keyboard shortcuts activate tools

**What to ask Claude Code**:
> Test keyboard shortcuts R, C, S, and P to activate Rectangle, Circle, Select, and Polyline tools.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Press 'R' for Rectangle
mcp__playwright__browser_press_key({ key: "r" })
mcp__playwright__browser_take_screenshot({ name: "shortcut-r-rectangle.png" })

// 3. Press 'C' for Circle
mcp__playwright__browser_press_key({ key: "c" })
mcp__playwright__browser_take_screenshot({ name: "shortcut-c-circle.png" })

// 4. Press 'S' for Select
mcp__playwright__browser_press_key({ key: "s" })
mcp__playwright__browser_take_screenshot({ name: "shortcut-s-select.png" })

// 5. Press 'P' for Polyline
mcp__playwright__browser_press_key({ key: "p" })
mcp__playwright__browser_take_screenshot({ name: "shortcut-p-polyline.png" })

// 6. Get final state
mcp__playwright__browser_snapshot()
```

**Expected output**:
- Each key press activates the corresponding tool
- Active tool button shows teal background/border

**What Claude will tell you**:
> "All keyboard shortcuts work correctly!
> - R → Rectangle tool activated (button highlighted)
> - C → Circle tool activated
> - S → Select tool activated
> - P → Polyline tool activated
> Each shortcut properly updates the UI to show the active tool with the teal accent color."

---

## Example 5: Test Text Tool

**Goal**: Create and edit text on the canvas

**What to ask Claude Code**:
> Click the Text tool, place text on the canvas that says "100 Acres", and verify it appears with proper formatting.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Click Text tool
mcp__playwright__browser_click({
  selector: 'button[aria-label="Text (T)"]'
})

// 3. Click canvas to place text
mcp__playwright__browser_click({ x: 800, y: 400 })

// 4. Type the text
mcp__playwright__browser_type({ text: "100 Acres" })

// 5. Press Escape to finish editing
mcp__playwright__browser_press_key({ key: "Escape" })

// 6. Take screenshot
mcp__playwright__browser_take_screenshot({ name: "text-created.png" })

// 7. Verify in layer panel
mcp__playwright__browser_snapshot()
```

**Expected output**:
- Text "100 Acres" appears on canvas
- Layer panel shows "Text 1"
- Text is in Nunito Sans font (project standard)

**What Claude will tell you**:
> "Text tool works perfectly! I created a text element that says '100 Acres'. The inline editor appeared when I clicked the canvas, I typed the text, and pressing Escape finalized it. The text is rendered in the Nunito Sans font at 24px size. The layer panel now shows 'Text 1' and it's selectable."

---

## Example 6: Test Shape Resizing

**Goal**: Verify resize handles work correctly

**What to ask Claude Code**:
> Draw a rectangle, select it, and drag a corner handle to resize it. Verify the dimensions update in the properties panel.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Draw rectangle (see Example 2)
// ... rectangle drawing code ...

// 3. Click the rectangle to select it
mcp__playwright__browser_click({ x: 900, y: 500 })

// 4. Take screenshot to see handles
mcp__playwright__browser_take_screenshot({ name: "rectangle-selected.png" })

// 5. Get snapshot to find handle positions
mcp__playwright__browser_snapshot()

// 6. Drag corner handle to resize
mcp__playwright__browser_drag({
  fromX: 1000,  // Corner handle position
  fromY: 600,
  toX: 1200,    // New position
  toY: 700
})

// 7. Take screenshot of resized rectangle
mcp__playwright__browser_take_screenshot({ name: "rectangle-resized.png" })

// 8. Verify dimensions in properties panel
mcp__playwright__browser_snapshot()
```

**Expected output**:
- White sphere handles appear at corners
- Dragging changes rectangle size
- Properties panel shows updated dimensions

**What Claude will tell you**:
> "Resize functionality works great! When I selected the rectangle, white sphere handles appeared at all four corners. I dragged the bottom-right handle from (1000, 600) to (1200, 700), and the rectangle resized smoothly. The properties panel immediately updated to show the new dimensions: 400 x 300 units. The resize maintains the shape's position and color."

---

## Example 7: Test Visual Comparison

**Goal**: Add a reference object for size comparison

**What to ask Claude Code**:
> Open the Compare panel, select "Basketball Court", and verify it appears as a 3D model on the canvas.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Click Compare button
mcp__playwright__browser_click({
  selector: 'button[aria-label="Compare"]'
})

// 3. Get snapshot to see available objects
mcp__playwright__browser_snapshot()

// 4. Click Basketball Court
mcp__playwright__browser_click({
  selector: 'button:has-text("Basketball Court")'
})

// 5. Wait for 3D model to load
mcp__playwright__browser_wait_for({ timeout: 3000 })

// 6. Take screenshot
mcp__playwright__browser_take_screenshot({ name: "basketball-court-added.png" })

// 7. Verify in layer panel
mcp__playwright__browser_snapshot()
```

**Expected output**:
- 3D basketball court model appears on canvas
- Dimensions: 28m × 15m (standard court size)
- Orange/brown court texture visible

**What Claude will tell you**:
> "Visual comparison feature working perfectly! I opened the Compare panel which shows 16+ reference objects organized by category. I selected 'Basketball Court' from the Sports category. After a brief loading period, a detailed 3D model appeared on the canvas showing a regulation basketball court (28m × 15m). The court has proper textures and dimensions labels. The layer panel now shows 'Basketball Court' as a selectable object."

---

## Example 8: Test Responsive Design (Mobile)

**Goal**: Verify the app works on mobile devices

**What to ask Claude Code**:
> Resize the browser to iPhone 15 size (375x667), navigate to the app, and verify the mobile UI layout.

**Behind the scenes**:
```javascript
// 1. Resize to mobile viewport
mcp__playwright__browser_resize({
  width: 375,
  height: 667
})

// 2. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 3. Wait for responsive layout to apply
mcp__playwright__browser_wait_for({ timeout: 1000 })

// 4. Take screenshot
mcp__playwright__browser_take_screenshot({ name: "mobile-375x667.png" })

// 5. Get snapshot
mcp__playwright__browser_snapshot()

// 6. Check touch targets are 44x44px
mcp__playwright__browser_evaluate({
  code: `
    const buttons = document.querySelectorAll('button');
    const touchTargets = Array.from(buttons).map(btn => ({
      width: btn.offsetWidth,
      height: btn.offsetHeight,
      text: btn.textContent
    }));
    return touchTargets;
  `
})
```

**Expected output**:
- Header stacks vertically
- Tools panel becomes collapsible/bottom drawer
- Touch targets ≥ 44x44px (WCAG 2.1 AA)
- No horizontal scrollbar

**What Claude will tell you**:
> "Mobile responsive design looks excellent! At 375x667 (iPhone 15 size):
> - Header adapts to single column layout
> - Tools panel converts to a bottom drawer that can slide up
> - All buttons meet the 44x44px minimum touch target size (WCAG 2.1 AA compliance)
> - Font sizes scale appropriately (min 16px for body text)
> - No horizontal overflow or scrolling issues
> - Canvas takes full width with proper aspect ratio
> The Canva-inspired design system scales beautifully to mobile!"

---

## Example 9: Test Undo/Redo

**Goal**: Verify undo/redo functionality

**What to ask Claude Code**:
> Draw two rectangles, delete one, undo the delete, and redo the delete to verify the undo/redo system works.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Draw first rectangle
// ... (see Example 2)

// 3. Draw second rectangle
// ...

// 4. Take screenshot
mcp__playwright__browser_take_screenshot({ name: "two-rectangles.png" })

// 5. Select second rectangle and delete
mcp__playwright__browser_click({ x: 900, y: 500 })
mcp__playwright__browser_press_key({ key: "Delete" })

// 6. Take screenshot after delete
mcp__playwright__browser_take_screenshot({ name: "one-deleted.png" })

// 7. Undo (Ctrl+Z)
mcp__playwright__browser_press_key({ key: "Control+z" })

// 8. Take screenshot after undo
mcp__playwright__browser_take_screenshot({ name: "after-undo.png" })

// 9. Redo (Ctrl+Y)
mcp__playwright__browser_press_key({ key: "Control+y" })

// 10. Take screenshot after redo
mcp__playwright__browser_take_screenshot({ name: "after-redo.png" })

// 11. Verify final state
mcp__playwright__browser_snapshot()
```

**Expected output**:
- Initial: 2 rectangles
- After delete: 1 rectangle
- After undo: 2 rectangles (restored)
- After redo: 1 rectangle (deleted again)

**What Claude will tell you**:
> "Undo/Redo system works flawlessly!
> 1. Started with 2 rectangles
> 2. Deleted second rectangle → now 1 rectangle visible
> 3. Pressed Ctrl+Z (Undo) → second rectangle restored!
> 4. Pressed Ctrl+Y (Redo) → second rectangle deleted again
> The undo/redo stack maintains full state including shape properties, positions, and colors. Layer panel updates correctly with each action."

---

## Example 10: Accessibility Check

**Goal**: Verify WCAG 2.1 AA accessibility compliance

**What to ask Claude Code**:
> Check the Land Visualizer for accessibility compliance: ARIA labels, keyboard navigation, focus indicators, and color contrast.

**Behind the scenes**:
```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: "http://localhost:5173" })

// 2. Get accessibility snapshot
mcp__playwright__browser_snapshot()

// 3. Check ARIA labels
mcp__playwright__browser_evaluate({
  code: `
    const buttons = document.querySelectorAll('button');
    const missing = Array.from(buttons).filter(btn =>
      !btn.getAttribute('aria-label') &&
      !btn.textContent.trim()
    );
    return {
      total: buttons.length,
      withLabels: buttons.length - missing.length,
      missing: missing.length
    };
  `
})

// 4. Test keyboard navigation (Tab key)
mcp__playwright__browser_press_key({ key: "Tab" })
mcp__playwright__browser_take_screenshot({ name: "focus-1.png" })

mcp__playwright__browser_press_key({ key: "Tab" })
mcp__playwright__browser_take_screenshot({ name: "focus-2.png" })

mcp__playwright__browser_press_key({ key: "Tab" })
mcp__playwright__browser_take_screenshot({ name: "focus-3.png" })

// 5. Check focus indicator visibility
mcp__playwright__browser_evaluate({
  code: `
    const focused = document.activeElement;
    const styles = window.getComputedStyle(focused);
    return {
      element: focused.tagName,
      outline: styles.outline,
      outlineWidth: styles.outlineWidth,
      outlineColor: styles.outlineColor
    };
  `
})

// 6. Check color contrast
mcp__playwright__browser_evaluate({
  code: `
    // Get design tokens
    const root = getComputedStyle(document.documentElement);
    return {
      primaryBg: root.getPropertyValue('--color-primary'),
      textColor: root.getPropertyValue('--color-text-primary')
    };
  `
})
```

**Expected output**:
- All buttons have ARIA labels
- Tab navigation works through all interactive elements
- Focus indicators are 2px teal outline (visible)
- Color contrast ratio ≥ 4.5:1 for text

**What Claude will tell you**:
> "Accessibility check: PASSED ✓
>
> **ARIA Labels**: All 23 interactive elements have proper ARIA labels
> - ✓ Tool buttons: 'Rectangle (R)', 'Circle (C)', 'Polyline (P)', etc.
> - ✓ Panel buttons: 'Convert', 'Compare', 'Layers'
> - ✓ Action buttons: 'Undo', 'Redo', 'Delete'
>
> **Keyboard Navigation**: Full keyboard support
> - ✓ Tab key cycles through all interactive elements
> - ✓ Enter/Space activates buttons
> - ✓ Arrow keys work in lists
> - ✓ Escape cancels operations
>
> **Focus Indicators**: WCAG 2.1 AA compliant
> - ✓ 2px solid teal (#00C4CC) outline on all focused elements
> - ✓ Outline is clearly visible against all backgrounds
> - ✓ Offset: 2px for better visibility
>
> **Color Contrast**: Exceeds requirements
> - ✓ Primary text (#1f2937) on white: 12.5:1 ratio (exceeds 4.5:1)
> - ✓ Teal (#00C4CC) on white: 5.2:1 ratio (meets 3:1 for UI components)
> - ✓ All interactive elements meet AA standards
>
> **Overall**: S-Tier accessibility, matches Canva/Figma quality!"

---

## Running These Examples

### Method 1: Ask Claude Code directly

Just copy any of the "What to ask Claude Code" prompts above and paste them into Claude Code chat.

### Method 2: Run automated test suite

```bash
# In Claude Code, type:
Run the comprehensive test suite from docs/testing/PLAYWRIGHT_MCP_EXAMPLES.md
```

### Method 3: Step-by-step testing

1. Start servers:
   ```bash
   # Terminal 1
   npm run mcp:start

   # Terminal 2
   cd app && npm run dev
   ```

2. Ask Claude Code:
   > Let's test the Land Visualizer step-by-step using Playwright MCP. Start with Example 1 (Visual Check).

3. Continue through examples one by one

---

## Tips for Effective Testing

### 1. Always use browser_snapshot first
Before clicking or interacting, get the accessibility snapshot to see what elements are available:

> Get a snapshot of the page first, then click the Rectangle tool button.

### 2. Take screenshots at key moments
Screenshots help you verify visual state:

> Take a screenshot after each step so I can see what's happening.

### 3. Check console messages
Console errors can reveal issues:

> Also check the browser console for any errors or warnings.

### 4. Wait for animations
3D models and animations need time to load:

> Wait 2 seconds for the 3D model to load before taking a screenshot.

### 5. Test at multiple viewport sizes
Responsive design needs testing at different sizes:

> Test this at mobile (375px), tablet (768px), and desktop (1920px) sizes.

### 6. Combine multiple checks
Ask for comprehensive testing:

> Navigate to the app, draw a rectangle, resize it, change its color, and verify all changes appear correctly. Take screenshots at each step.

---

## Example Prompts for Common Tasks

### Quick smoke test
> Navigate to localhost:5173, verify the page loads without errors, take a screenshot, and check that the main UI elements (header, tools panel, canvas) are visible.

### Test a specific feature
> Test the circle tool: click it, draw a circle on the canvas, verify it appears in the layer panel with correct dimensions.

### Debug an issue
> The rectangle resize isn't working. Navigate to the app, draw a rectangle, select it, try to drag a resize handle, and show me what happens with screenshots and console messages.

### Accessibility audit
> Do a full accessibility check: verify all buttons have ARIA labels, test keyboard navigation with Tab key, check focus indicators are visible, and verify color contrast meets WCAG 2.1 AA.

### Performance check
> Navigate to the app, measure initial load time, check frame rate while rotating the camera, and report any performance issues from the console.

### Mobile testing
> Resize to iPhone 15 size (375x667), load the app, verify the mobile layout works, check touch targets are at least 44x44px, and take screenshots.

---

## Troubleshooting

### "Element not found"
**Solution**: Use `browser_snapshot` first to see available elements

> Get a page snapshot first, then try clicking the element.

### "Screenshot is blank"
**Solution**: Add a wait delay for 3D rendering

> Wait 2000ms after navigation before taking the screenshot.

### "Browser didn't navigate"
**Solution**: Check if dev server is running

```bash
# Make sure dev server is running
cd app
npm run dev
```

### "MCP connection failed"
**Solution**: Restart the MCP server

```bash
# Kill and restart
taskkill /f /im node.exe
npm run mcp:start
```

---

## Advanced Examples

### Test multi-selection
> Draw 3 rectangles, select all of them by clicking while holding Ctrl, verify all are selected (purple boundary), then rotate the group.

### Test import/export
> Draw several shapes, export the scene as JSON, clear the canvas, import the JSON, and verify all shapes are restored correctly.

### Stress test
> Create 50 rectangles in a grid pattern, measure the frame rate, and verify the app maintains 60 FPS.

### Cross-browser testing
> Test the app in Chrome, Firefox, and Edge using different --browser flags, compare screenshots, and report any visual differences.

---

## Resources

- **Playwright MCP Repo**: https://github.com/microsoft/playwright-mcp
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code/mcp
- **Land Visualizer Shortcuts**: Press `?` in the app
- **Setup Guide**: `docs/setup/PLAYWRIGHT_MCP_WINDOWS_SETUP.md`
