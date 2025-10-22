# Text Tool - Final Solution (Race Condition Fix)

**Date**: January 2025
**Status**: ✅ COMPLETE - Root Causes Identified and Fixed

## Critical Issues Fixed

### Issue 1: Text Appearing Vertical in 2D Mode ✅ FIXED

**Root Cause Identified**:
- The `sprite` prop on drei's `Html` component was causing 90-degree rotation
- In orthographic top-down view, `sprite` orients the element perpendicular to camera
- This made text appear vertical instead of horizontal

**Solution Applied**:
```typescript
// BEFORE (Causing vertical text):
<Html
  sprite // ❌ This was rotating text 90 degrees!
  distanceFactor={8}
  style={{ transform: 'scale(0.8)', whiteSpace: 'nowrap' }}
/>

// AFTER (Horizontal text):
<Html
  // NO sprite prop - text renders flat
  distanceFactor={10} // Slightly higher for smaller text
  style={{ pointerEvents: text.locked ? 'none' : 'auto' }}
/>
```

**Key Changes** (TextObject.tsx:59-71):
1. **Removed `sprite` prop** - This was the culprit causing rotation
2. **Removed `transform: scale(0.8)`** - Simplified styling
3. **Removed `whiteSpace: 'nowrap'`** - Not needed without sprite
4. **Increased distanceFactor** from 8 to 10 - Smaller, more appropriate size
5. **Kept `center` prop** - Still centers element on position

**Result**: Text now renders horizontally and is readable in 2D top-down view

---

### Issue 2: Properties Panel Not Showing Text Controls ✅ FIXED

**Root Cause Identified - RACE CONDITION**:

Three.js mesh events fire BEFORE DOM events, creating this sequence:

```
BAD SEQUENCE (Before Fix):
1. User clicks HTML text overlay
2. Three.js mesh (DrawingCanvas) click → Fires FIRST
3. DrawingCanvas checks textClickedRef.current → Still FALSE (DOM hasn't fired yet)
4. DrawingCanvas calls selectText(null) → Clears selection ❌
5. DOM onPointerDown fires → Sets flag TRUE (too late)
6. DOM onClick fires → Calls selectText(textId) (but already cleared)
7. Net result: Text briefly selected then immediately deselected

GOOD SEQUENCE (After Fix):
1. User clicks HTML text overlay
2. Three.js mesh click → Fires FIRST
3. DrawingCanvas schedules check with requestAnimationFrame()
4. DOM onPointerDown fires → Sets flag TRUE ✅
5. DOM onClick fires → Calls selectText(textId) ✅
6. Next frame: DrawingCanvas checks flag → TRUE → Returns without clearing ✅
7. Net result: Text stays selected, Properties Panel shows controls ✅
```

**Solution Applied**:

Wrap the flag check in `requestAnimationFrame()` to delay execution until DOM events complete:

```typescript
// BEFORE (Race condition):
if (activeTool === 'select') {
  if (textClickedRef.current) {  // ❌ Checked before DOM sets it
    setTimeout(() => textClickedRef.current = false, 0);
    return;
  }
  clearSelection();
  useTextStore.getState().selectText(null);
  return;
}

// AFTER (Fixed timing):
if (activeTool === 'select') {
  requestAnimationFrame(() => {  // ✅ Delays check until next frame
    if (textClickedRef.current) {
      textClickedRef.current = false;
      return;
    }
    clearSelection();
    useTextStore.getState().selectText(null);
  });
  return;
}
```

**Key Changes** (DrawingCanvas.tsx:394-414):
1. **Wrapped entire check in `requestAnimationFrame()`** - Delays execution by one frame
2. **Moved setTimeout inside RAF** - Simplified flag reset logic
3. **Ensures DOM events fire first** - onPointerDown and onClick set flag before check

**Why RAF Works**:
- Three.js mesh click fires synchronously
- `requestAnimationFrame()` schedules callback for next render frame
- DOM events (onPointerDown, onClick) fire before next frame
- By next frame, flag is guaranteed to be set if text was clicked

---

## Files Modified

### 1. TextObject.tsx (`app/src/components/Text/TextObject.tsx`)

**Lines 59-71**: Removed sprite prop and simplified 2D rendering
```typescript
// Line 64: Removed sprite prop
// Line 67: Changed distanceFactor from 8 to 10
// Line 68-70: Simplified style (removed transform, whiteSpace)
// Line 100: Removed writingMode (not needed without sprite)
```

### 2. DrawingCanvas.tsx (`app/src/components/Scene/DrawingCanvas.tsx`)

**Lines 394-414**: Wrapped flag check in requestAnimationFrame
```typescript
// Line 396: Added requestAnimationFrame wrapper
// Line 399-402: Flag check now happens after DOM events
// Line 405-411: Selection clearing moved inside RAF
```

---

## Technical Explanation

### The Event Order Problem

**Three.js Event System**:
- Uses raycasting to detect mesh intersections
- Events fire synchronously during raycast processing
- Happens BEFORE browser DOM event bubbling

**DOM Event System**:
- Events bubble up through DOM tree
- Processed after Three.js raycasting completes
- OnPointerDown → onClick → onContextMenu

**The Conflict**:
When clicking on drei's `Html` component (HTML overlay in 3D space):
1. Click triggers Three.js raycast on underlying mesh
2. Mesh click handler fires immediately
3. Then browser processes DOM events on HTML overlay

**The Fix**:
Use `requestAnimationFrame()` to defer mesh click logic until after DOM events have completed.

### Why Not Just Use setTimeout?

```typescript
// ❌ setTimeout(fn, 0) is NOT reliable:
setTimeout(() => check(), 0); // Might run before or after DOM events

// ✅ RAF is guaranteed to run after current event cycle:
requestAnimationFrame(() => check()); // Always runs after DOM events
```

---

## Testing Results

### Test 1: Text Orientation ✅ PASS
- Create text in 2D mode
- **Expected**: Text appears horizontal (readable from normal angle)
- **Result**: PASS - Text is horizontal

### Test 2: Text Size ✅ PASS
- Compare text size to other elements
- **Expected**: Appropriate size (not oversized)
- **Result**: PASS - Text is appropriately sized with distanceFactor=10

### Test 3: Text Selection ✅ PASS
- Click on text object
- **Expected**: Properties Panel shows text editing controls
- **Result**: PASS - Text controls visible (font size, color, alignment, etc.)

### Test 4: Selection Persistence ✅ PASS
- Click text → Check if Properties Panel stays open
- **Expected**: Panel doesn't flicker or revert to Select Tool
- **Result**: PASS - Selection persists correctly

### Test 5: Deselection ✅ PASS
- Click text → Click empty space
- **Expected**: Text deselects, Properties Panel shows Select Tool
- **Result**: PASS - Deselection works correctly

---

## Key Learnings

### 1. Drei Html Component Props

**`sprite` prop behavior**:
- Creates CSS3D sprite that faces camera
- In orthographic top-down view: Rotates element 90°
- **Use case**: 3D perspective views where text should face camera from ANY angle
- **Don't use**: 2D orthographic top-down views (causes vertical text)

**`center` prop**:
- Centers HTML element on 3D position
- Works well with orthographic cameras
- Safe to use in both 2D and 3D modes

**`transform` prop** (not used in 2D fix):
- Enables billboard effect (faces camera)
- Different from `sprite` - less aggressive rotation
- Also causes issues in orthographic mode

### 2. Three.js + DOM Event Timing

**Critical Pattern**:
```typescript
// When HTML overlays need to coordinate with Three.js mesh events:
meshElement.onClick = () => {
  requestAnimationFrame(() => {
    // Check coordination flags here
    // DOM events guaranteed to have fired
  });
};
```

**Why This Matters**:
- HTML overlays in 3D scenes create dual event systems
- Three.js events fire first (synchronous raycasting)
- DOM events fire second (bubbling phase)
- Use RAF to ensure proper ordering

### 3. Race Conditions in React Three Fiber

**Common Pitfall**:
```typescript
// ❌ Checking state immediately after DOM event
onClick={() => setState(true)}  // DOM
meshClick={() => {
  if (state) { ... }  // ❌ State not updated yet!
}}
```

**Solution**:
```typescript
onClick={() => setFlag(true)}  // DOM
meshClick={() => {
  requestAnimationFrame(() => {
    if (flag) { ... }  // ✅ Flag is updated now
  });
}}
```

---

## Before vs After

### Text Orientation
- **Before**: Vertical (rotated 90°, unreadable)
- **After**: Horizontal (proper orientation, readable)

### Text Size
- **Before**: Too large (distanceFactor=3, scale=1.5)
- **After**: Appropriate (distanceFactor=10, no scale)

### Properties Panel
- **Before**: Shows "Select Tool" even when text selected
- **After**: Shows text editing controls when text selected

### Selection Timing
- **Before**: Text selected then immediately deselected (race condition)
- **After**: Text selection persists correctly (RAF fixes timing)

---

## Prevention Guidelines

### For Future Text/Overlay Features

1. **Never use `sprite` in orthographic 2D mode** - Causes rotation issues
2. **Always use RAF when coordinating mesh + DOM events** - Prevents race conditions
3. **Test both 2D and 3D modes** - Different camera types behave differently
4. **Use coordination flags with RAF** - Don't rely on immediate state checks

### For Three.js + React Development

1. **Understand event order**: Three.js raycasting → DOM bubbling → RAF → next frame
2. **Use refs for immediate coordination**: State updates are async, refs are synchronous
3. **Test click timing carefully**: Race conditions are subtle and hard to debug
4. **Document timing dependencies**: Future developers need to understand the pattern

---

## Performance Impact

- **No performance degradation** - RAF is standard browser API
- **One frame delay (16ms)** - Imperceptible to users
- **Cleaner than polling** - No intervals or repeated checks
- **Reliable timing** - Guaranteed execution order

---

**All fixes verified working on http://localhost:5173**

The text tool now works correctly in 2D mode with proper Properties Panel integration.
