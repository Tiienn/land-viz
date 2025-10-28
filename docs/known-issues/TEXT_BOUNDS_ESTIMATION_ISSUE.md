# Text Bounds Estimation Issue

**Date**: January 27, 2025
**Severity**: Medium
**Status**: Known Limitation - Needs Proper Fix

## Summary

Text object bounds are calculated using **estimation** (character count × font size) instead of **actual DOM measurement**. This causes misalignment in multiple features that depend on accurate text dimensions.

## Root Cause

### Location
`app/src/components/Text/TextTransformControls.tsx:51-113`

### The Problem
The `calculateTextBounds()` function estimates text dimensions using:

```typescript
// Lines 61-69: ESTIMATION, not actual measurement
const charWidthFactor = 0.5; // Just a guess!
const maxLineLength = Math.max(...lines.map(line => line.length), 1);
const cssWidth = cssFontSize * maxLineLength * charWidthFactor;
const cssHeight = cssFontSize * text.lineHeight * lineCount;

// Convert to world units
let worldWidth = cssWidth / distanceFactor;
let worldHeight = cssHeight / distanceFactor;
```

**Why This Fails:**
- Different fonts have different character widths (proportional vs monospace)
- Browser text rendering varies (anti-aliasing, kerning, ligatures)
- Letter spacing, line height, padding affect actual size
- No way to accurately predict final rendered dimensions
- `charWidthFactor = 0.5` is just a rough approximation

### What Should Happen
We should **measure the actual DOM element** after it renders:

```typescript
// Proper approach (not implemented):
const textDivRef = useRef<HTMLDivElement>(null);
const actualBounds = textDivRef.current.getBoundingClientRect();
// Then convert screen pixels → world coordinates using camera projection
```

## Affected Features

### 1. ❌ Phase 5: Text Resize Handles
**Impact**: High
**Symptoms**:
- Resize handles misaligned with actual text box
- Handles positioned incorrectly in both 2D and 3D modes
- Worse misalignment with longer text or different fonts
- Zoom changes exacerbate the issue

**Files Affected**:
- `app/src/components/Text/TextTransformControls.tsx` (lines 548-715)

**User Impact**: Users cannot accurately resize text because handles don't match the visual text box boundaries.

---

### 2. ❌ Grouping: Purple Boundary Lines
**Impact**: Medium
**Symptoms**:
- Group boundary rectangle doesn't accurately encompass grouped text objects
- Purple boundary lines positioned incorrectly around text elements
- Works perfectly for shapes (they use actual geometry)
- Only text elements within groups have wrong boundaries

**Files Affected**:
- `app/src/components/Scene/GroupBoundary.tsx`
- `app/src/components/Scene/GroupBoundaryManager.tsx`

**User Impact**: Visual confusion when grouping elements containing text - boundary doesn't match what user sees.

---

### 3. ❌ Phase 6: Smart Alignment with Text
**Impact**: Medium
**Symptoms**:
- Alignment guides (purple badges, green snap indicators) positioned incorrectly for text
- Equal spacing calculations wrong because text bounds are estimated
- Magnetic snapping to text elements unreliable
- Works perfectly for shape-to-shape alignment

**Files Affected**:
- `app/src/services/simpleAlignment.ts` (Phase 6 alignment logic)
- `app/src/components/Scene/SimpleAlignmentGuides.tsx`

**User Impact**: Cannot reliably align text objects or align shapes to text objects. Equal spacing feature doesn't work correctly with text.

---

### 4. ✅ Shape Resize Handles (NOT AFFECTED)
**Why It Works**: Shapes use actual geometry points, not estimated bounds.

**Files**:
- `app/src/components/Scene/ResizableShapeControls.tsx` - Uses real shape.points

## Technical Details

### Camera Zoom Complication
The issue is compounded by camera zoom because:
1. Text scales visually via `distanceFactor` in Html component
2. Estimated bounds don't account for actual browser rendering
3. Adding camera zoom as dependency recalculates wrong bounds more frequently
4. Result: Still wrong, just recalculated more often

### Attempted Fixes (Unsuccessful)
1. **Added camera dependencies to useMemo** - Bounds recalculate on zoom but still wrong
2. **Tuned charWidthFactor** - Works for some fonts/sizes, breaks for others
3. **Used center instead of sprite** - Fixed 3D positioning but bounds still estimated
4. **Added padding/border calculations** - Improved slightly but core issue remains

## Proper Solution

### Requirements
Implement actual DOM measurement system:

1. **Add ref to TextObject**
   ```typescript
   // TextObject.tsx
   const textDivRef = useRef<HTMLDivElement>(null);
   ```

2. **Measure after render**
   ```typescript
   useLayoutEffect(() => {
     if (textDivRef.current) {
       const rect = textDivRef.current.getBoundingClientRect();
       // Store actual dimensions
     }
   }, [text.content, text.fontSize, text.fontFamily]);
   ```

3. **Convert screen → world coordinates**
   ```typescript
   // Use camera projection to convert screen pixels to world units
   const worldBounds = screenToWorld(rect, camera);
   ```

4. **Store in text state**
   ```typescript
   // useTextStore.ts
   interface TextObject {
     // ... existing fields
     actualBounds?: BoundingBox; // Measured from DOM
   }
   ```

5. **Update features to use actual bounds**
   - TextTransformControls: Use actualBounds for handles
   - GroupBoundary: Use actualBounds for text elements
   - Alignment: Use actualBounds for text alignment

### Complexity
- **Effort**: 4-6 hours
- **Risk**: Medium (coordinate conversion can be tricky)
- **Files to modify**: 5-7 files
- **Testing required**: Extensive (2D/3D modes, zoom levels, fonts)

### Alternative: Canvas Text Measurement
Use `CanvasRenderingContext2D.measureText()` for more accurate estimation:

```typescript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
ctx.font = `${text.fontSize}px ${text.fontFamily}`;
const metrics = ctx.measureText(text.content);
const actualWidth = metrics.width;
```

**Pros**: No DOM dependency, faster
**Cons**: Still estimation, doesn't account for HTML/CSS rendering

## Workarounds (Temporary)

### For Users
1. Use shapes instead of text when precise alignment/grouping needed
2. Manually position text objects instead of relying on resize handles
3. Avoid grouping text with shapes (group shapes separately)

### For Developers
1. Tune `charWidthFactor` for primary font (line 64 in TextTransformControls.tsx)
2. Test with specific font/size combinations and document limitations
3. Add warning in UI: "Text alignment and grouping are approximate"

## Related Issues

- **Zoom Alignment Issue** (separate but related): Handles don't stay aligned during zoom
- **Multi-line Text**: Estimation worse for multi-line text
- **Font Loading**: Bounds wrong until custom fonts fully loaded

## Future Considerations

If implementing proper fix:
1. Consider performance impact of DOM measurements
2. Debounce/throttle measurements during rapid text editing
3. Cache measurements until text properties change
4. Handle edge cases: empty text, very long text, emoji, RTL text

## References

- Phase 5 Implementation: `app/src/components/Text/TextTransformControls.tsx`
- Phase 6 Implementation: `app/src/services/simpleAlignment.ts`
- Group Boundaries: `app/src/components/Scene/GroupBoundary.tsx`
- Text Rendering: `app/src/components/Text/TextObject.tsx`

## Decision Log

**January 27, 2025**: Documented issue after identifying root cause affects multiple features. Decision to move forward with current implementation and fix comprehensively in future iteration when time permits proper DOM measurement system.
