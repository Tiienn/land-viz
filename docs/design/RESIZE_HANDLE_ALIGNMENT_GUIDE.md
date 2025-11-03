# Rectangle Resize Handle Alignment Issue - Developer Guide

## Problem Summary

When a rectangle is rotated (e.g., to 45-56 degrees), the 4 edge resize handles are not visually aligned with the rotated rectangle's edge lines. The handles appear to maintain their original horizontal/vertical orientation instead of following the rectangle's rotation.

![Issue Screenshot](chrome_cT9ShTySgf.png)
*Screenshot showing misaligned handles on a 56° rotated rectangle*

## Current Behavior vs Expected Behavior

**Current (Broken):** 
- Rectangle rotated to 56°
- Edge handles remain horizontal/vertical
- Handles appear disconnected from actual edges

**Expected (Fixed):**
- Rectangle rotated to 56° 
- Edge handles rotate with rectangle edges
- Handles visually align with rotated edge lines

## Root Cause Analysis

The issue is in `app/src/components/Scene/ResizableShapeControls.tsx`, specifically in the edge handle rendering logic around **lines 832-843**:

```typescript
// Current problematic code:
let handleArgs: [number, number, number] = [1.5, 0.3, 0.4]; // Horizontal handles
let edgeCursor = 'ns-resize';

if (index === 1 || index === 3) { // Right and left edges
  handleArgs = [0.4, 0.3, 1.5]; // Vertical handles  
  edgeCursor = 'ew-resize';
}
```

**The Problem:** The handles are sized based on their *original* orientation (horizontal/vertical) but they need to be rotated to match the rectangle's rotation angle.

## Technical Context

- **Coordinate System:** Three.js with Y-up, Z-axis rotation for 2D shapes
- **Handle Rendering:** Uses `<Box>` components with `args={[width, height, depth]}`
- **Rotation Data:** Stored in `shape.rotation: { angle: number, center: Point2D }`
- **Current Handle Types:** 4 corner spheres + 4 edge boxes

## Attempted Solutions (What Didn't Work)

### ❌ Strategy-Consensus-Implementer Approach
**What was tried:** Complete rewrite with mathematical base orientations `[0°, 90°, 180°, 270°]`
**Why it failed:** Made the handles completely disappear or worse alignment
**Lesson:** The mathematical approach was correct but the implementation was too aggressive

### ❌ Previous Handle Thickness Increases  
**What was tried:** Increased handle thickness from `[1.5, 0.3, 0.4]` to `[1.5, 0.8, 0.8]`
**Why it failed:** Addresses visibility but not the core alignment issue
**Lesson:** Thickness changes are cosmetic, not functional

### ❌ Rotation Axis Changes
**What was tried:** Changed from Y-axis `[0, angle, 0]` to Z-axis `[0, 0, angle]` rotation
**Why it failed:** Rectangle shapes already use correct Z-axis rotation
**Lesson:** The rotation axis was already correct

## Recommended Fix Strategy

### Approach 1: Add Rotation to Edge Handles (Recommended)
**Core Idea:** Apply the rectangle's rotation angle to each edge handle's `rotation` prop.

```typescript
// In the edge handle rendering (around line 845):
<Box
  key={`resize-edge-${index}`}
  position={[point.x, elevation + 0.15, point.y]}
  args={handleArgs}
  rotation={[0, 0, (resizingShape.rotation?.angle || 0) * Math.PI / 180]} // ADD THIS LINE
  onClick={(event) => {
    // ... existing code
  }}
  // ... rest of props
/>
```

**Why this should work:**
- Simple addition to existing code
- Uses the rectangle's actual rotation data
- Maintains all existing handle sizing logic
- Converts degrees to radians for Three.js

### Approach 2: Calculate Handle Orientations Per Edge
**Core Idea:** Calculate individual orientation for each edge based on rectangle rotation.

```typescript
// Before the edge handles map, calculate orientations:
const getEdgeRotation = (edgeIndex: number, shapeRotation: number = 0) => {
  const baseRotations = [0, 90, 180, 270]; // Top, Right, Bottom, Left
  const totalRotation = baseRotations[edgeIndex] + shapeRotation;
  return totalRotation * Math.PI / 180; // Convert to radians
};

// Then in the Box component:
rotation={[0, 0, getEdgeRotation(index, resizingShape.rotation?.angle)]}
```

### Approach 3: Dynamic Handle Geometry (Advanced)
**Core Idea:** Rotate the handle geometry dimensions instead of the handle itself.

This approach would calculate rotated handle dimensions but is more complex and not recommended as a first attempt.

## Implementation Steps

### Step 1: Try Approach 1 (Simplest)
1. Open `app/src/components/Scene/ResizableShapeControls.tsx`
2. Find the edge handle `<Box>` component around line 845
3. Add the `rotation` prop as shown above
4. Test with rectangles at various angles (0°, 45°, 90°, 180°)

### Step 2: If Step 1 Doesn't Work, Try Approach 2
1. Implement the `getEdgeRotation` helper function
2. Apply individual rotations per edge
3. Test and adjust base rotations if needed

### Step 3: Handle Cursors (Important!)
Don't forget to update the cursor calculations to match the rotated handles:

```typescript
// Calculate rotated cursor direction
const getRotatedCursor = (baseDirection: string, rotationAngle: number) => {
  // Implementation needed - cursors should match handle orientations
};
```

## Testing Strategy

### Visual Tests
1. **Draw rectangle** - any size
2. **Rotate to 45°** - handles should be diagonal  
3. **Rotate to 90°** - handles should swap orientation
4. **Rotate to 180°** - handles should match original but rotated
5. **Test negative angles** - ensure proper handling

### Functional Tests  
1. **Drag handles** - should resize in expected direction
2. **Cursor feedback** - should match handle orientation
3. **Aspect ratio** - should maintain with Shift key
4. **Multiple rotations** - rotate, resize, rotate again

## Common Pitfalls to Avoid

### 🚫 Don't Change Core Logic
- Don't modify the handle position calculations
- Don't change the drag event handlers
- Don't alter the coordinate system

### 🚫 Don't Overcomplicate  
- Start with simple rotation addition
- Don't rewrite the entire system
- Don't change handle sizing unnecessarily

### 🚫 Don't Ignore Existing Patterns
- Follow the same pattern used for corner handles
- Maintain consistency with other shape types
- Keep the Windows-style resize behavior

## Success Criteria

✅ **Visual Alignment:** Edge handles appear parallel to rectangle edges at any rotation angle
✅ **Functional Dragging:** Handles resize the rectangle in the expected direction
✅ **Cursor Feedback:** Mouse cursors match the visual handle orientation  
✅ **No Regressions:** Unrotated rectangles and other shapes work as before

## Debugging Tips

### Console Logging
Add temporary logging to understand the values:
```typescript
console.log('Handle rotation for edge', index, ':', 
  (resizingShape.rotation?.angle || 0), 'degrees');
```

### Visual Debugging
- Make handles larger temporarily to see their orientation clearly
- Use different colors for different edge indices
- Test with extreme rotations (e.g., 45°, 135°) where misalignment is obvious

## File Locations

- **Main file:** `app/src/components/Scene/ResizableShapeControls.tsx`
- **Lines of interest:** 832-843 (edge handle rendering)
- **Shape data:** `resizingShape.rotation.angle` (in degrees)
- **Dev server:** `cd app && npm run dev` (port 5173)

## Final Notes

This issue has been persistent across multiple attempts. The key is to **start small** with just adding rotation to the existing handles rather than rewriting the entire system. The mathematical approach is sound, but the implementation needs to be incremental and well-tested.

Good luck! 🚀

---
*Generated for the next developer working on the Land Visualizer resize handle alignment issue.*