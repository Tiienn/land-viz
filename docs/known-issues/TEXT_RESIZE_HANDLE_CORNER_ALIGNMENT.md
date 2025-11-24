# Text Resize Handle Corner Alignment Issue

**Date:** January 12, 2025
**Status:** ⚠️ Unresolved
**Priority:** Medium
**Affected Component:** `TextTransformControls.tsx`

---

## Problem Description

The resize handle corners for text objects do not sit perfectly on the 45-degree corners of the text box border. The issue is more pronounced for:
- **10+ character text** (e.g., "Hello World 123")
- **2D mode** (top-down orthographic view)
- May affect **3D mode** as well

**Visual Issue:**
- Short text (2-4 characters): Corners align correctly ✅
- Long text (10+ characters): Corners are offset from the blue border corners ❌
- The bounding box appears wider than the actual rendered text box

**Screenshot Reference:**
See user-provided screenshot showing "Hello World 123" with corner handles not aligned on 45-degree corners.

---

## Root Cause Analysis

The issue stems from **inaccurate text dimension measurement**. The corner handles are positioned correctly based on calculated bounds, but the bounds calculation itself is incorrect.

### Technical Challenge

Text rendering in HTML is complex and involves multiple layers:

1. **Text content dimensions** (characters, letter spacing, font metrics)
2. **Padding** (8px vertical, 12px horizontal when background is present)
3. **Border** (2px solid blue when selected)
4. **Box-sizing model** (content-box vs border-box)
5. **Mode-specific wrapping** (2D: nowrap, 3D: pre-wrap with 400px max-width)
6. **Font rendering variations** (subpixel rendering, browser differences)

The measurement must account for ALL of these factors AND match the exact rendering behavior of `@react-three/drei`'s `Html` component.

---

## Approaches Tried

### ❌ Approach 1: Character-Based Estimation (Initial Implementation)
```typescript
const charWidthFactor = 0.5; // Average character width ratio
const estimatedChars = text.content.length;
const cssWidth = fontSize * charWidthFactor * estimatedChars;
```

**Why it failed:**
- Proportional fonts (Nunito Sans) have variable character widths
- Doesn't account for letter spacing, bold, italic, uppercase
- No consideration for padding or border
- Pure estimation with no basis in actual rendering

---

### ❌ Approach 2: Canvas API `measureText()`
```typescript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
const metrics = ctx.measureText(text.content);
const cssWidth = metrics.width;
```

**Why it failed:**
- Canvas API measures text in isolation (no box model)
- Doesn't account for CSS properties like `letter-spacing`
- No padding or border included
- Different rendering engine than HTML/CSS
- Worked for short text but increasingly inaccurate for longer text

---

### ❌ Approach 3: DOM Measurement with Separate Padding/Border Addition
```typescript
// Measure text content only
measureDiv.style.padding = '0';
measureDiv.style.border = 'none';
const measured = measureTextDimensions(text, is2DMode);

// Then add padding and border separately
if (text.backgroundColor) {
  worldWidth += (12 * 2) / distanceFactor; // horizontal padding
  worldHeight += (8 * 2) / distanceFactor;  // vertical padding
}
if (isSelected) {
  worldWidth += (2 * 2) / distanceFactor;  // border
  worldHeight += (2 * 2) / distanceFactor;
}
```

**Why it failed:**
- Measuring content separately then adding padding/border creates rounding errors
- Doesn't account for how padding/border affect text layout
- Box-sizing model matters: content-box includes padding/border in dimensions differently

---

### ❌ Approach 4: DOM Measurement with Integrated Padding/Border (Current)
```typescript
function measureTextDimensions(text: TextObject, is2DMode: boolean, isSelected: boolean) {
  const measureDiv = document.createElement('div');

  // Apply ALL text styles including padding and border
  measureDiv.style.padding = text.backgroundColor ? '8px 12px' : '0';
  measureDiv.style.border = isSelected ? '2px solid #3B82F6' : 'none';
  measureDiv.style.boxSizing = 'content-box';

  // Mode-specific wrapping
  if (is2DMode) {
    measureDiv.style.whiteSpace = 'nowrap';
    measureDiv.style.maxWidth = 'none';
    measureDiv.style.writingMode = 'horizontal-tb';
  } else {
    measureDiv.style.whiteSpace = 'pre-wrap';
    measureDiv.style.maxWidth = '400px';
    measureDiv.style.overflowWrap = 'break-word';
    measureDiv.style.wordBreak = 'break-word';
  }

  document.body.appendChild(measureDiv);
  const width = measureDiv.offsetWidth;
  const height = measureDiv.offsetHeight;
  document.body.removeChild(measureDiv);

  return { width, height };
}
```

**Why it still fails:**
- Unknown - this should theoretically work ⚠️
- Possible issues:
  - `@react-three/drei` Html component may have internal scaling/positioning quirks
  - `distanceFactor` conversion (CSS pixels → world units) may introduce errors
  - Browser subpixel rendering differences
  - Missing or incorrect CSS properties in measurement div
  - Timing issue (measuring before fonts fully load?)

---

## Current Implementation

**File:** `app/src/components/Text/TextTransformControls.tsx`

### Key Functions

#### `measureTextDimensions()` (Lines 52-101)
Creates temporary DOM element with exact same styles as rendered text, measures dimensions, then removes element.

#### `calculateTextBounds()` (Lines 103-140)
Converts CSS pixel dimensions to world units using distanceFactor, calculates bounding box in 3D space.

#### `calculateHandlePositions()` (Lines 142-190)
Positions corner handles at bounds corners with rotation applied.

### Critical Parameters

- **distanceFactor:** 2.5 (2D mode), 20 (3D mode) - CSS pixels to world units conversion
- **Padding:** 8px vertical, 12px horizontal (when background color present)
- **Border:** 2px solid blue (when selected)
- **Handle size:** 8px diameter circles

---

## Styling Properties Applied to Measurement Div

The measurement div includes these properties matching `TextObject.tsx`:

- ✅ `fontFamily` (default: 'Nunito Sans, sans-serif')
- ✅ `fontSize` (from text.fontSize)
- ✅ `fontWeight` (bold: 'bold', normal: 'normal')
- ✅ `fontStyle` (italic: 'italic', normal: 'normal')
- ✅ `textDecoration` (underline: 'underline', normal: 'none')
- ✅ `textTransform` (uppercase: 'uppercase', normal: 'none')
- ✅ `letterSpacing` (from text.letterSpacing / 100 + 'em')
- ✅ `lineHeight` (from text.lineHeight)
- ✅ `textAlign` (from text.alignment)
- ✅ `padding` (8px 12px if backgroundColor, else 0)
- ✅ `border` (2px solid #3B82F6 if selected, else none)
- ✅ `boxSizing` (content-box to match default)
- ✅ `whiteSpace` (2D: nowrap, 3D: pre-wrap)
- ✅ `maxWidth` (2D: none, 3D: 400px)
- ✅ `writingMode` (2D: horizontal-tb)
- ✅ `wordWrap` (3D: break-word)
- ✅ `overflowWrap` (3D: break-word)
- ✅ `wordBreak` (3D: break-word)

---

## Possibly Missing Properties

Properties from `TextObject.tsx` NOT applied to measurement div:

- ❓ `color` - Shouldn't affect dimensions
- ❓ `opacity` - Shouldn't affect dimensions
- ❓ `backgroundColor` (with alpha) - Applied via `padding` check
- ❓ `borderRadius` (6px) - Shouldn't affect bounding box dimensions
- ❓ `boxShadow` - Shouldn't affect layout dimensions
- ❓ `userSelect: 'none'`
- ❓ `cursor: 'pointer'`
- ❓ `transition: 'all 200ms ease-out'`

None of these should affect layout dimensions, but worth investigating.

---

## Potential Solutions to Investigate

### 1. **Direct DOM Query Approach**
Instead of creating a temporary div, query the actual rendered text element:

```typescript
// Find the actual rendered text div in the scene
const textElement = document.querySelector(`[data-text-id="${text.id}"]`);
if (textElement) {
  const rect = textElement.getBoundingClientRect();
  // Convert screen pixels to world units
}
```

**Pros:** Measures the ACTUAL rendered element
**Cons:** Need to add data-text-id, depends on element being in DOM, may have timing issues

---

### 2. **Three.js Bounding Box from HTML Overlay**
Use Three.js's built-in bounding box calculation:

```typescript
// Get the Html component's internal mesh/sprite
const htmlGroup = textObjectRef.current;
if (htmlGroup) {
  const box = new THREE.Box3().setFromObject(htmlGroup);
  const size = box.getSize(new THREE.Vector3());
}
```

**Pros:** Uses Three.js's understanding of the object
**Cons:** May not account for HTML content dimensions, Html component may not expose this

---

### 3. **FontMetrics API (Experimental)**
Use browser's FontMetrics API for more accurate text measurement:

```typescript
const fontMetrics = new FontMetrics({
  fontFamily: text.fontFamily,
  fontSize: text.fontSize,
  fontWeight: text.bold ? 'bold' : 'normal',
});
const width = fontMetrics.width(text.content);
```

**Pros:** More accurate than Canvas API
**Cons:** Experimental API, limited browser support, still doesn't include box model

---

### 4. **Delay Measurement Until After Render**
Wait for next frame after text is rendered:

```typescript
useEffect(() => {
  requestAnimationFrame(() => {
    // Measure after render completes
    const bounds = calculateTextBounds(text, is2DMode, isSelected);
  });
}, [text.content, text.fontSize, /* ... */]);
```

**Pros:** Ensures fonts are loaded and layout is complete
**Cons:** May cause flash/flicker, complex state management

---

### 5. **Compare Against Shape Resize Handles**
Shapes (rectangles) have perfect corner alignment. Compare implementation:

**Shapes:** Use explicit width/height from geometry
**Text:** Must calculate dimensions from content

Could we add explicit width/height to text objects and use CSS to enforce it?

---

### 6. **Screenshot-Based Bounds Detection**
Render text to canvas, detect non-transparent pixels:

```typescript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// Render text with all styles
// Scan pixels to find actual content bounds
```

**Pros:** Most accurate - measures exactly what's visible
**Cons:** Performance intensive, complex implementation

---

### 7. **Accept Estimated Bounds with Fallback**
Document limitation and use estimation for non-critical features:

```typescript
// Use estimation for resize handles (best effort)
// Use actual DOM measurement only for critical features (export, collision)
```

**Pros:** Simple, performant
**Cons:** UX inconsistency, not ideal solution

---

## Investigation Checklist

Before implementing a fix, investigate:

- [ ] Compare measurement div `offsetWidth` vs `getBoundingClientRect().width` vs `clientWidth` vs `scrollWidth`
- [ ] Check if `@react-three/drei` Html component applies any internal transforms or scaling
- [ ] Test if issue persists with monospace fonts (e.g., 'Courier New')
- [ ] Test if issue persists without letter spacing
- [ ] Test if issue persists without padding (no background color)
- [ ] Test if issue is consistent across browsers (Chrome, Firefox, Safari)
- [ ] Check if Three.js camera zoom affects the calculation
- [ ] Verify `distanceFactor` is correct for both 2D and 3D modes
- [ ] Console log all intermediate values (cssWidth, worldWidth, distanceFactor, bounds)
- [ ] Add visual debug overlay showing calculated bounds vs actual bounds

---

## Testing Scenarios

When implementing a fix, test all these cases:

### Text Content Variations
- ✅ Short text (2-4 characters): "Hi", "Test"
- ❌ Medium text (5-9 characters): "Hello123"
- ❌ Long text (10+ characters): "Hello World 123"
- [ ] Very long text (20+ characters): "This is a longer text string"
- [ ] Multi-line text with `\n` newlines
- [ ] Text with special characters: "Test@#$%"
- [ ] Text with emojis: "Hello 👋"

### Text Style Variations
- [ ] Normal text
- [ ] **Bold** text (`text.bold = true`)
- [ ] *Italic* text (`text.italic = true`)
- [ ] Underlined text (`text.underline = true`)
- [ ] UPPERCASE text (`text.uppercase = true`)
- [ ] Bold + Italic + Underline + Uppercase (all combined)
- [ ] Letter spacing variations (0, 50, 100, 200)
- [ ] Line height variations (1.0, 1.5, 2.0)

### Mode Variations
- ❌ 2D mode (orthographic top-down view) - **Primary issue**
- [ ] 3D mode (perspective view)
- [ ] Switching between 2D and 3D while text is selected

### Background & Border
- [ ] No background color (`text.backgroundColor = undefined`)
- [ ] With background color (padding applied)
- [ ] Selected (blue border)
- [ ] Not selected (no border)

---

## Related Files

- `app/src/components/Text/TextTransformControls.tsx` - Main file with issue
- `app/src/components/Text/TextObject.tsx` - Text rendering component (source of truth for styles)
- `app/src/components/Scene/ResizableShapeControls.tsx` - Shape resize handles (reference for working implementation)
- `app/src/types/text.ts` - Text object type definitions

---

## Workarounds

Until this is fixed, users can:

1. **Use shapes instead of text** for precise alignment needs
2. **Accept approximate positioning** - handles are close enough for most use cases
3. **Avoid very long text** - use multiple shorter text objects instead

---

## Notes

- The issue is **cosmetic only** - it doesn't affect functionality, only visual precision
- Text editing, dragging, rotation, and deletion all work correctly
- The issue is more noticeable in 2D mode due to tighter tolerances
- Short text (2-4 characters) works perfectly, suggesting the issue is related to cumulative error over longer strings

---

## Decision Log

**2025-01-12:** Decided to document issue and defer fix. Reasons:
1. Multiple approaches attempted without success (4+ iterations)
2. Issue is cosmetic and doesn't block core functionality
3. Requires deeper investigation into `@react-three/drei` internals
4. May require architectural changes to text rendering system

**Next Steps:** Revisit when we have more time for deep investigation, or when user feedback indicates this is a priority issue.

---

## References

- [MDN: HTMLElement.offsetWidth](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetWidth)
- [MDN: Element.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
- [MDN: CanvasRenderingContext2D.measureText()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)
- [@react-three/drei Html Component Docs](https://github.com/pmndrs/drei#html)
- [CSS Box Model](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model)
