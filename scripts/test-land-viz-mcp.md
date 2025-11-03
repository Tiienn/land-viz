# Land Visualizer - Playwright MCP Test Guide

This guide shows how to test the Land Visualizer using Playwright MCP tools in Claude Code.

## Prerequisites

1. Start Playwright MCP server:
   ```bash
   npm run mcp:start
   # Or: npx @playwright/mcp@latest --port 8931
   ```

2. Start Land Visualizer dev server:
   ```bash
   cd app
   npm run dev
   ```

3. Verify both are running:
   - MCP Server: http://localhost:8931/mcp
   - Land Visualizer: http://localhost:5173

## Test Scenarios

### Test 1: Basic Page Load

**Objective**: Verify the app loads correctly

**Steps**:
1. Navigate to the app
2. Take screenshot
3. Check console for errors

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
Use browser_take_screenshot to capture the page
Use browser_console_messages to check for errors
```

**Expected Results**:
- Page loads without errors
- Header shows "Land Visualizer" with gradient logo
- Tools panel is visible on the left
- 3D scene canvas is visible in the center

---

### Test 2: Drawing a Rectangle

**Objective**: Test basic rectangle drawing functionality

**Steps**:
1. Navigate to app
2. Click Rectangle tool button
3. Click canvas to draw rectangle
4. Verify shape appears in layer panel

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
Use browser_click to click the Rectangle tool button (look for "Rectangle" or rect icon)
Use browser_click on the canvas to start drawing (coordinates around x:800, y:400)
Use browser_click on the canvas again to finish rectangle (coordinates around x:1000, y:600)
Use browser_snapshot to get page state
Use browser_take_screenshot to verify the rectangle was drawn
```

**Expected Results**:
- Rectangle appears on canvas
- Layer panel shows "Rectangle 1"
- Properties panel shows rectangle dimensions

---

### Test 3: Text Tool

**Objective**: Test text creation and editing

**Steps**:
1. Click Text tool
2. Click canvas to place text
3. Type "Test Area"
4. Verify text appears

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
Use browser_click to click the Text tool button
Use browser_click on canvas at coordinates x:800, y:400
Use browser_type to enter text "Test Area"
Use browser_press_key to press "Escape" to finish editing
Use browser_take_screenshot to verify
```

**Expected Results**:
- Text "Test Area" appears on canvas
- Text is selectable
- Layer panel shows "Text 1"

---

### Test 4: Shape Resize

**Objective**: Test shape resizing with handles

**Steps**:
1. Draw a rectangle
2. Click to select it
3. Drag resize handle
4. Verify dimensions update

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
# Draw rectangle (see Test 2)
Use browser_click on the rectangle to select it
Use browser_snapshot to see resize handles
Use browser_drag to drag a resize handle (look for corner handles in snapshot)
Use browser_take_screenshot to verify new size
```

**Expected Results**:
- Resize handles appear (white spheres)
- Dragging handle changes rectangle size
- Dimensions update in properties panel

---

### Test 5: Unit Conversion Panel

**Objective**: Test the conversion functionality

**Steps**:
1. Click "Convert" in ribbon
2. Enter value in square meters
3. Verify conversions appear

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
Use browser_click to click "Convert" button in ribbon
Use browser_type to enter "100" in the square meters input
Use browser_snapshot to see all conversions
Use browser_take_screenshot to capture results
```

**Expected Results**:
- Conversion panel expands
- Shows conversions to all 12 units
- Values are accurate (100 m² = 1076.39 ft²)

---

### Test 6: Visual Comparison

**Objective**: Test reference object comparison

**Steps**:
1. Click "Compare" in ribbon
2. Select a reference object
3. Verify it appears on canvas

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
Use browser_click to click "Compare" button in ribbon
Use browser_click to select "Basketball Court" from the list
Use browser_wait_for to wait for 3D model to load (2000ms)
Use browser_take_screenshot to verify it appears
```

**Expected Results**:
- Comparison panel expands
- Basketball court 3D model appears
- Dimensions are labeled

---

### Test 7: Responsive Design

**Objective**: Test app at different viewport sizes

**Steps**:
1. Test at mobile size (375x667)
2. Test at tablet size (768x1024)
3. Test at desktop size (1920x1080)

**Claude Code Commands**:
```
Use browser_resize to set viewport to 375x667
Use browser_navigate to go to http://localhost:5173
Use browser_take_screenshot with name "mobile-view.png"

Use browser_resize to set viewport to 768x1024
Use browser_navigate to go to http://localhost:5173
Use browser_take_screenshot with name "tablet-view.png"

Use browser_resize to set viewport to 1920x1080
Use browser_navigate to go to http://localhost:5173
Use browser_take_screenshot with name "desktop-view.png"
```

**Expected Results**:
- All breakpoints render correctly
- No horizontal scrollbars
- Touch targets are 44x44px minimum on mobile
- UI is usable at all sizes

---

### Test 8: Keyboard Shortcuts

**Objective**: Verify keyboard shortcuts work

**Steps**:
1. Test S for Select tool
2. Test R for Rectangle
3. Test Ctrl+Z for undo

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
# Draw a rectangle first
Use browser_press_key to press "r" (should activate Rectangle tool)
# Draw rectangle
Use browser_press_key to press "Delete" (should delete selected shape)
Use browser_press_key to press "Control+z" (should undo delete)
Use browser_take_screenshot to verify undo worked
```

**Expected Results**:
- Shortcuts activate correct tools
- Undo/redo works correctly
- No JavaScript errors in console

---

### Test 9: Accessibility

**Objective**: Verify WCAG 2.1 AA compliance

**Steps**:
1. Check for ARIA labels
2. Verify keyboard navigation
3. Check focus indicators

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
Use browser_snapshot to get accessibility tree
# Check for:
# - ARIA labels on buttons
# - Role attributes
# - Alt text on images
Use browser_press_key to press "Tab" multiple times
Use browser_take_screenshot to verify focus indicators (2px teal outline)
```

**Expected Results**:
- All interactive elements have ARIA labels
- Tab navigation works
- Focus indicators are visible (2px teal outline)
- Meets WCAG 2.1 AA standards

---

### Test 10: Performance

**Objective**: Check rendering performance

**Steps**:
1. Navigate to app
2. Execute performance measurement script
3. Verify frame rate

**Claude Code Commands**:
```
Use browser_navigate to go to http://localhost:5173
Use browser_evaluate with JavaScript:
  const start = performance.now();
  // Measure frame time
  requestAnimationFrame(() => {
    const frameTime = performance.now() - start;
    return { frameTime, fps: 1000 / frameTime };
  });
Use browser_console_messages to check for performance warnings
```

**Expected Results**:
- Frame rate: 60 FPS (16.67ms frame time)
- No performance warnings in console
- Smooth interactions (no lag)

---

## Automated Test Suite

To run all tests automatically, use the Claude Code agent:

```
Run the comprehensive test suite for Land Visualizer using Playwright MCP tools. Test all 10 scenarios in the test guide and report results.
```

## Troubleshooting

### Browser doesn't navigate
- Check if dev server is running: `npm run dev`
- Verify URL: http://localhost:5173

### Screenshots are blank
- Increase wait time: `browser_wait_for` with 2000ms
- Check if 3D scene is loading

### Elements not found
- Use `browser_snapshot` first to see accessibility tree
- Check element labels/roles
- Try different selectors

### Network requests fail
- Check browser console: `browser_console_messages`
- Verify no CORS errors
- Check network tab: `browser_network_requests`

## Best Practices

1. **Always use browser_snapshot first** to see what's on the page
2. **Take screenshots** to verify visual state
3. **Check console messages** for errors
4. **Wait for animations** using browser_wait_for
5. **Use accessibility tree** for reliable element selection
6. **Test at multiple viewports** for responsive design
7. **Verify keyboard navigation** for accessibility

## Resources

- Playwright MCP Docs: https://github.com/microsoft/playwright-mcp
- Land Visualizer Docs: `docs/project/CLAUDE.md`
- Keyboard Shortcuts: Press `?` in the app
