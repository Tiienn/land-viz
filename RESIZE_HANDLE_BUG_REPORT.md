# Resize Handle Click Detection Bug - Investigation Report

## 🚨 Critical Issue Summary
Resize handles are rendered correctly but cannot be clicked. Shape meshes in the 3D scene are not receiving click events, preventing users from entering resize mode.

## 🔍 Problem Description
**User Experience**: After selecting a shape, resize handles appear around it, but clicking on the shape or handles does nothing. The resize functionality is completely non-functional.

**Technical Issue**: Click events attached to shape meshes are never triggered, preventing `enterResizeMode()` from being called.

## ✅ What Works
- Shape selection works (shapes highlight when selected)
- Resize handles render correctly when `drawing.isResizeMode=true`
- ResizableShapeControls component logic is sound
- 3D click detection system works (test mesh at different position responds to clicks)
- All state management for resize mode functions properly

## ❌ What Doesn't Work
- Clicking on shape meshes (rectangles, circles, polygons)
- `handleShapeClick()` function never gets called
- `enterResizeMode()` never gets triggered
- Resize handles are visible but non-interactive

## 🕵️ Investigation Findings

### Root Cause Analysis
The issue lies in the **BufferGeometry-based mesh interaction**. Shapes are rendered using cached `BufferGeometry` objects through the `MeshWithDynamicGeometry` component, but these meshes are not properly interactive for raycasting.

### Technical Details

**File**: `app/src/components/Scene/ShapeRenderer.tsx`
- Line 564-577: `MeshWithDynamicGeometry` component receives correct onClick handlers
- Line 89-110: Mesh has proper event handlers attached
- **Problem**: Click events never reach the handlers

**File**: `app/src/components/Scene/ResizableShapeControls.tsx` 
- Line 22-27: Correct logic for rendering handles when `drawing.isResizeMode=true`
- **Problem**: `drawing.isResizeMode` never becomes true because shape clicks don't work

### Debugging Evidence
```typescript
// Test Results:
// ✅ Red test mesh at [5,1,5]: Click events work perfectly
// ❌ Blue rectangle mesh: No click events detected at all
// ❌ Shape.onClick handlers: Never called
// ❌ handleShapeClick(): Never reached
```

## 🛠️ Recommended Solutions

### Solution 1: Geometry Bounds Fix (Most Likely)
```typescript
// In GeometryCache.ts or ShapeRenderer.tsx
geometry.computeBoundingSphere();
geometry.computeBoundingBox();
```
**Why**: BufferGeometry may not have proper bounds for raycasting collision detection.

### Solution 2: Replace with PlaneGeometry (Quick Fix)
```typescript
// Replace cached geometry with standard PlaneGeometry for rectangles
const geometry = new PlaneGeometry(width, height);
geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane
```
**Why**: Standard Three.js geometries are guaranteed to work with raycasting.

### Solution 3: Hybrid Approach (Recommended)
- Keep visual geometry for rendering (performance)
- Add invisible PlaneGeometry mesh for click detection
- Similar to the existing "Invisible interaction line" pattern (line 596-610)

### Solution 4: Debug Raycasting
```typescript
// Add to ShapeRenderer.tsx to debug raycasting
const raycaster = new Raycaster();
const hits = raycaster.intersectObjects(scene.children, true);
console.log('All raycast hits:', hits);
```

## 📁 Key Files to Investigate

1. **`app/src/utils/GeometryCache.ts`**: Check geometry creation and bounds
2. **`app/src/components/Scene/ShapeRenderer.tsx`**: Mesh interaction setup
3. **`app/src/components/Scene/ResizableShapeControls.tsx`**: Handle rendering logic

## 🧪 Testing Protocol

### Step-by-Step Test
1. Load app, create rectangle, select it
2. Verify handles appear ✅
3. Click on rectangle shape
4. **Expected**: `enterResizeMode()` called, handles become interactive
5. **Actual**: No response, handles remain static

### Quick Test
Add this to `MeshWithDynamicGeometry` component:
```typescript
onClick={(e) => {
  console.log('MESH CLICKED!', shapeId);
  if (onClick) onClick(e);
}}
```

## 🚀 Next Developer Actions

1. **Immediate**: Test Solution 1 (add geometry bounds)
2. **If #1 fails**: Implement Solution 3 (hybrid approach)
3. **Debug**: Add raycasting debug logging
4. **Verify**: Test with different shape types (circle, polygon)
5. **Clean up**: Remove any debugging code before merge

## 📊 Impact Assessment
- **Severity**: Critical - Core functionality broken
- **User Impact**: Cannot resize any shapes
- **Files Affected**: 2-3 files need changes
- **Estimated Fix Time**: 2-4 hours

---

## 🤖 Development Notes
This investigation was conducted using systematic debugging with document.title tracking (since console.log was not working). The issue has been isolated to the mesh interaction layer, not the UI or state management layers.

**Previous Debugging Session**: Successfully identified that resize handles render correctly and the entire state management chain works properly. The bug is specifically in the geometry-to-click-event pipeline.