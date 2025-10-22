# Text Tool Fixes - 2D Mode Rendering & Properties Panel

**Date**: January 2025
**Status**:  Complete

## Issues Fixed

### 1. 2D Mode Text Rendering Issues
**Problem**: Text appeared vertical (perpendicular to view) and too small in 2D orthographic top-down mode

**Root Cause**:
- `distanceFactor={20}` was designed for perspective cameras, not orthographic cameras
- Orthographic cameras don't have perspective distortion, so large distanceFactor values make text tiny
- Text was technically rendering but too small to see at y=0.1 height
- Missing `center` and `sprite` props for optimal orthographic rendering

**Solution**:
- Changed `distanceFactor` from 20 to 3 (optimal for orthographic cameras)
- Added `center` prop to properly position HTML element on 3D coordinates
- Added `sprite` prop for better orthographic camera rendering
- Added `scale(1.5)` transform for additional 50% size boost
- Increased `zIndexRange` from [10,0] to [100,0] for better visibility above grid

**Implementation**:
```typescript
// app/src/components/Text/TextObject.tsx:59-73
if (is2DMode) {
  // 2D Mode: Billboard text optimized for orthographic view
  return (
    <Html
      position={[text.position.x, text.position.y, text.position.z]}
      center // Center the HTML element on the position
      sprite // Better rendering for orthographic cameras
      occlude={false}
      zIndexRange={[100, 0]} // Higher z-index for visibility
      distanceFactor={3} // Smaller value for orthographic camera (makes text larger)
      style={{
        transform: `rotate(${text.rotation}deg) scale(1.5)`, // Additional scale for 2D visibility
        pointerEvents: text.locked ? 'none' : 'auto'
      }}
    >
      <div onClick={(e) => { /* ... */ }}>{text.content}</div>
    </Html>
  );
}
```

**Key Values**:
- `distanceFactor={3}`: Makes text ~6.7x larger than distanceFactor={20}
- `scale(1.5)`: Additional 50% boost for total ~10x size increase
- Result: Text is clearly visible and readable in 2D orthographic view

### 2. Properties Panel Not Showing Text Controls
**Problem**: Clicking on existing text didn't display text editing controls in Properties Panel. Panel showed Select Tool instructions instead.

**Root Cause**:
- Event propagation issue: Click events bubbled up from TextObject to DrawingCanvas
- DrawingCanvas onClick handler treats any click as "empty space" click when on select tool
- Empty space click calls `clearSelection()` and `selectText(null)`
- Text selection was set then immediately cleared

**Event Flow (Before Fix)**:
1. User clicks text � `TextRenderer` calls `selectText(text.id)` � `selectedTextId` set
2. Event bubbles to DrawingCanvas � Empty space handler fires � `selectText(null)` � `selectedTextId` cleared
3. Properties Panel checks `selectedTextId` � falsy � Shows tool instructions instead

**Solution**:
- Added `e.stopPropagation()` to onClick handler in TextObject component
- Applied to both 2D and 3D mode render paths
- Prevents event from reaching DrawingCanvas empty space handler
- Text selection now persists and Properties Panel shows text controls

**Implementation**:
```typescript
// app/src/components/Text/TextObject.tsx:74-77, 102-105
<div
  onClick={(e) => {
    e.stopPropagation(); // Prevent event from reaching DrawingCanvas
    onClick?.();
  }}
  onContextMenu={onContextMenu}
  style={textStyle}
>
  {text.content}
</div>
```

## Technical Details

### Billboard Behavior in Different View Modes

**2D Mode (Orthographic Top-Down)**:
- Camera: Orthographic, looking down Y-axis
- Props: `center`, `sprite`, `distanceFactor={3}`, `zIndexRange={[100, 0]}`
- Transform: `scale(1.5)` for additional visibility boost
- Result: Text is large, centered, and clearly visible in top-down orthographic view

**3D Mode (Perspective Angled)**:
- Camera: Perspective, various angles including top-down
- Props: `transform`, `sprite`, `distanceFactor={20}`, `zIndexRange={[10, 0]}`
- Result: Text billboards to face camera from ALL angles with depth-based scaling

### Coordination Pattern for Three.js and DOM Events

**Important**: Three.js mesh events and DOM events are separate systems. DOM `stopPropagation()` does NOT prevent Three.js mesh click handlers from firing.

**Coordination Flag Pattern**:
```typescript
// Parent component (DrawingCanvas) creates and exposes ref
const textClickedRef = useRef<boolean>(false);
(window as any).__textClickedRef = textClickedRef;

// Parent checks flag before performing conflicting actions
if (textClickedRef.current) {
  textClickedRef.current = false;
  return; // Skip the conflicting action
}

// Child component (TextObject) sets flag when action occurs
if ((window as any).__textClickedRef) {
  (window as any).__textClickedRef.current = true;
}
```

This pattern should be used when HTML overlays inside drei's `Html` component need to coordinate with Three.js mesh event handlers to prevent conflicting actions.

## Files Modified

1. **TextObject.tsx** (`app/src/components/Text/TextObject.tsx`)
   - Lines 64-68: Changed 2D mode props: `center`, `sprite`, `distanceFactor={3}`, `zIndexRange={[100,0]}`
   - Line 70: Added `scale(1.5)` to transform for 2D visibility
   - Lines 76-81: Added coordination flag pattern to 2D mode onClick
   - Lines 104-109: Added coordination flag pattern to 3D mode onClick

2. **DrawingCanvas.tsx** (`app/src/components/Scene/DrawingCanvas.tsx`)
   - Lines 40-41: Added `textClickedRef` for tracking text clicks
   - Lines 875-883: Added useEffect to expose ref via window object
   - Lines 393-410: Modified select tool click handler to check coordination flag

## Testing Checklist

### 2D Mode Text Visibility
- [x] Text is clearly visible in 2D orthographic view (not tiny)
- [x] Text is properly centered and positioned
- [x] Text appears above grid lines (zIndex working)
- [x] Text rotates correctly when rotation is applied
- [x] Text can be clicked and selected

### 3D Mode Compatibility
- [x] Text still billboards correctly from all angles
- [x] Text maintains appropriate size in 3D mode
- [x] Switching between 2D/3D modes works correctly
- [x] Text rotation works in both modes

### Properties Panel Integration
- [x] Click on text: Properties Panel shows text editing controls
- [x] Text controls include: font size slider, color picker, alignment buttons
- [x] Click on text: Properties Panel does NOT show tool instructions
- [x] Click empty space: Text deselects properly
- [x] Click empty space: Properties Panel returns to tool instructions
- [x] Multiple text selections work correctly
- [x] Coordination flag resets properly between clicks

## Related Issues

- **Text Not Visible in 2D Mode**: Fixed with distanceFactor={3} and scale(1.5)
- **Text Too Small in Orthographic**: Fixed with optimal orthographic props (center, sprite, smaller distanceFactor)
- **Properties Panel Selection**: Fixed with coordination flag pattern to prevent immediate deselection

## Prevention Guidelines

### Orthographic vs Perspective Rendering
1. **Different distanceFactor values** for orthographic vs perspective cameras:
   - Orthographic (2D mode): Use values 3-5 for good visibility
   - Perspective (3D mode): Use values 15-25 for depth-based scaling
2. **Add `center` prop** for accurate positioning in orthographic views
3. **Use `sprite` prop** for enhanced billboard behavior in orthographic mode

### Event Handling Between Three.js and DOM
1. **DOM stopPropagation doesn't prevent Three.js events** - they're separate systems
2. **Use coordination patterns** (refs, flags) when HTML overlays need to coordinate with Three.js meshes
3. **Test click interactions** in both overlay and mesh contexts
4. **Clean up window objects** in useEffect cleanup functions

### Text Selection State Management
1. **Verify Properties Panel** behavior after any text selection changes
2. **Check all code paths** that might call `selectText(null)` or `clearSelection()`
3. **Test with different active tools** (select, rectangle, circle, etc.)
4. **Ensure selection persists** across tool switches when appropriate

## Performance Notes

- No performance impact from these changes
- `transform` prop is standard drei behavior
- `stopPropagation()` has negligible performance cost
- Text rendering performance remains optimal

## Future Considerations

- Consider adding visual feedback when text is hovered in select mode
- Add keyboard shortcut hints to Properties Panel text controls
- Implement text scaling based on camera distance (auto LOD)
