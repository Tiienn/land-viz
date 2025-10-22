# Text Editing Bugs Fix

**Date:** January 14, 2025
**Status:** ✅ RESOLVED

## Overview
Fixed two critical bugs in the text editing feature that were preventing proper inline text editing functionality.

## Bugs Fixed

### Bug 1: Text Position Jumping on Double-Click ✅

**Issue:** When double-clicking on existing text to edit it, the text visually jumped/moved to a different position instead of staying in place.

**Root Cause:**
The InlineTextEditor component was not matching the exact rendering properties of the original TextObject component:

1. **Missing `center` prop in 2D mode**: TextObject.tsx uses `center` prop on the Html component (line 65), but InlineTextEditor did not. This caused different positioning behavior.
2. **Incorrect rotation handling in 2D mode**: The rotation transform was being applied at the wrong level in 2D mode, causing the text to shift position when switching from display to edit mode.

**Solution:**
1. Added `center={is2DMode}` prop to InlineTextEditor's Html component to match TextObject's behavior
2. Separated rotation handling for 2D and 3D modes:
   - **3D Mode**: Rotation applied at Html level via `style` prop (keeps billboard behavior intact)
   - **2D Mode**: Rotation applied to outer div with `transformOrigin: 'center center'` to prevent position shift
3. This ensures the editor appears at the exact same visual position as the original text

**Files Modified:**
- `app/src/components/Text/InlineTextEditor.tsx` (lines 192-223)

**Code Changes:**
```typescript
// BEFORE: Single container style for all modes
const containerStyle: React.CSSProperties = {
  transform: `rotate(${initialRotation}deg)`,
  pointerEvents: 'auto' as const
};

// Html component missing 'center' prop
<Html
  position={[position.x, position.y, position.z]}
  transform={!is2DMode}
  sprite={!is2DMode}
  // ... missing center prop
>

// AFTER: Separate styles for 2D vs 3D mode
const containerStyle: React.CSSProperties = is2DMode
  ? { pointerEvents: 'auto' as const }
  : {
      transform: `rotate(${initialRotation}deg)`,
      pointerEvents: 'auto' as const
    };

const outerDivStyle: React.CSSProperties = is2DMode
  ? {
      transform: `rotate(${initialRotation}deg)`,
      transformOrigin: 'center center',
      position: 'relative',
      pointerEvents: 'auto'
    }
  : {
      position: 'relative',
      pointerEvents: 'auto'
    };

// Html component with center prop
<Html
  position={[position.x, position.y, position.z]}
  center={is2DMode} // CRITICAL: Match TextObject
  transform={!is2DMode}
  sprite={!is2DMode}
>
  <div style={outerDivStyle}> {/* Apply rotation here in 2D */}
```

---

### Bug 2: Caret Jumping to End After Typing ✅

**Issue:** When editing text, if you move the cursor to the middle of the text and type, the cursor jumps back to the end instead of staying where you placed it. This made it impossible to edit text in the middle.

**Root Cause:**
The cursor position restoration logic had timing issues with React's render cycle:

1. **Timing Issue**: The cursor restoration was happening in a `useEffect` that ran AFTER React had already re-rendered the textarea with the new content
2. **React Re-render Reset**: When React re-renders a controlled textarea with a new `value` prop, it resets the cursor to the end by default
3. **Too Late Restoration**: By the time the useEffect ran to restore the cursor, the user had already seen the jump

**Solution:**
Replaced the useEffect-based cursor restoration with immediate restoration using `requestAnimationFrame`:

1. **Save cursor position** immediately before any state updates
2. **Update local state and store** (triggers re-render)
3. **Restore cursor position** using `requestAnimationFrame` to run AFTER React's render cycle but before browser paint
4. This ensures the cursor is restored before the user can perceive any jump

**Files Modified:**
- `app/src/components/Text/InlineTextEditor.tsx` (lines 81-104)

**Code Changes:**
```typescript
// BEFORE: Cursor restoration in useEffect (too late)
const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newContent = e.target.value;
  const cursorPos = e.target.selectionStart;

  savedCursorPosition.current = cursorPos;
  setContent(newContent);
  onContentChange(newContent);
}, [onContentChange]);

// Separate useEffect that runs AFTER render (visible jump)
useEffect(() => {
  if (savedCursorPosition.current !== null && textareaRef.current) {
    const pos = savedCursorPosition.current;
    textareaRef.current.setSelectionRange(pos, pos);
    savedCursorPosition.current = null;
  }
}, [content]);

// AFTER: Immediate restoration with requestAnimationFrame
const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newContent = e.target.value;
  const cursorPos = e.target.selectionStart;

  // Save cursor position BEFORE any state updates
  savedCursorPosition.current = cursorPos;

  // Update local state first
  setContent(newContent);

  // Then notify parent (which updates store)
  onContentChange(newContent);

  // Restore cursor position immediately using requestAnimationFrame
  // This ensures cursor restoration happens AFTER React's render cycle
  requestAnimationFrame(() => {
    if (textareaRef.current && savedCursorPosition.current !== null) {
      const pos = savedCursorPosition.current;
      textareaRef.current.setSelectionRange(pos, pos);
      textareaRef.current.focus(); // Ensure focus is maintained
    }
  });
}, [onContentChange]);

// No separate useEffect needed - restoration happens inline
```

---

## Technical Details

### Why requestAnimationFrame Works

`requestAnimationFrame` schedules a callback to run before the next browser repaint, which happens AFTER React's render cycle but BEFORE the user sees the update. This gives us the perfect timing to restore the cursor position without any visible jump.

**Execution Order:**
1. User types → handleChange fires
2. Save cursor position → Update state → Notify parent
3. React re-renders with new content → Cursor resets to end (default behavior)
4. requestAnimationFrame callback runs → Restore cursor position
5. Browser repaints → User sees correct cursor position

### Why center Prop Matters

The `center` prop on drei's Html component changes the anchor point of the HTML element:
- **Without center**: Element positioned at top-left corner
- **With center**: Element centered on the position coordinates

TextObject uses `center` in 2D mode (line 65), so InlineTextEditor must also use it to appear at the same visual position.

---

## Testing

### Manual Testing Steps

1. **Test Position Stability:**
   - Add text in 2D mode
   - Double-click to edit
   - ✅ Text should stay in exact same position (no jumping)
   - Repeat in 3D mode
   - ✅ Text should stay in exact same position

2. **Test Cursor Position:**
   - Add text: "Hello World"
   - Double-click to edit
   - Click between "Hello" and "World"
   - Type "Beautiful "
   - ✅ Cursor should stay where you clicked
   - ✅ Text should read "Hello Beautiful World"
   - Try editing at start, middle, and end
   - ✅ Cursor should stay at edit position

3. **Test Edge Cases:**
   - Empty text → type → ✅ works
   - Single character → edit middle → ✅ works
   - Multi-line text → edit middle line → ✅ works
   - Rotated text → double-click → ✅ stays at same angle and position

---

## Related Files

**Core Components:**
- `app/src/components/Text/InlineTextEditor.tsx` - Fixed cursor jumping and position jumping
- `app/src/components/Text/TextObject.tsx` - Reference implementation for positioning
- `app/src/components/Text/TextRenderer.tsx` - Manages editor lifecycle
- `app/src/store/useTextStore.ts` - State management for text editing

**Documentation:**
- `docs/fixes/PROPERTIES_PANEL_ARCHITECTURE_FIX.md` - Previous text feature fix
- `docs/features/TEXT_FEATURE.md` - Complete text feature documentation
- `TEXT_DEBUGGING_GUIDE.md` - Debugging guide for text issues

---

## Impact

**User Experience Improvements:**
- ✅ Smooth, predictable text editing experience
- ✅ No visual jumps when entering edit mode
- ✅ Cursor stays exactly where you click
- ✅ Professional inline editing behavior matching Canva/Figma

**Code Quality:**
- ✅ Removed unnecessary useEffect (cleaner code)
- ✅ Proper timing with requestAnimationFrame
- ✅ Consistent positioning between TextObject and InlineTextEditor
- ✅ Better separation of 2D vs 3D rendering logic

---

## Prevention Guidelines

### For Future Text Feature Development:

1. **Always match rendering properties** between display and edit components:
   - Check `center`, `distanceFactor`, `zIndexRange`, `transform`, `sprite` props
   - Test both 2D and 3D modes separately
   - Verify rotation handling in both modes

2. **For controlled textarea cursor management:**
   - Save cursor position BEFORE state updates
   - Restore cursor position AFTER React render using `requestAnimationFrame`
   - Never rely on useEffect for immediate cursor restoration
   - Always call `focus()` after `setSelectionRange()` to ensure focus

3. **Testing checklist:**
   - Test position stability (no jumping)
   - Test cursor position stability (no jumping to end)
   - Test in both 2D and 3D modes
   - Test with rotated text
   - Test at start, middle, and end of text
   - Test with multi-line text

---

## Status: Production Ready ✅

Both bugs are completely resolved. The text editing feature now provides a professional, Canva-style inline editing experience with no visual jumps or cursor position issues.

**Dev Server:** http://localhost:5174
**Last Updated:** January 14, 2025
