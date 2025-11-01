# Comparison Objects Z-Fighting Flickering Fix

**Date:** January 2025
**Status:** ✅ RESOLVED
**Severity:** ⭐⭐⭐ (High - Visual Quality Issue)
**Files Modified:** `app/src/components/Scene/ReferenceObjectRenderer.tsx`

## Problem Description

Comparison objects (reference objects like soccer fields, basketball courts, buildings, etc.) were flickering when viewed from oblique angles. This was a z-fighting issue caused by objects rendering at the exact same elevation as the ground plane (y=0).

### User Impact
- Visual flickering made comparison objects difficult to see
- Unprofessional appearance
- Reduced trust in the visualization
- Similar to the shapes z-fighting issue that was previously fixed

## Root Cause

Reference objects were positioned directly on the ground plane (y = position.y, typically 0) without any elevation offset. This caused:

1. **Z-fighting with grid:** Objects at the same elevation as the grid (y=0) compete for the same depth buffer values
2. **Insufficient depth separation:** Floating-point precision issues in the depth buffer require 0.10+ unit separation
3. **No renderOrder:** Without explicit render ordering, overlapping objects flicker

## Technical Analysis

### Previous State
```typescript
// Objects rendered directly at ground level
<group position={[position.x, position.y, position.z]}>
  <mesh
    geometry={geometry}
    material={material}
    // No renderOrder
  />
</group>
```

### Issues
- Objects at y=0 compete with grid at y=0
- No elevation hierarchy
- No render ordering between overlapping objects

## Solution

Applied the **complete** z-fighting fix pattern from `ShapeRenderer.tsx` with five critical components:

### 1. Added Large Elevation Offsets
```typescript
// CRITICAL: Use LARGE elevation offsets to prevent z-fighting at oblique angles
// Depth buffer precision requires 0.10+ unit separation for reliable rendering
// Reference objects should be elevated above shapes (0.10) and grid (0.00)
const baseElevation = 0.15; // Higher than shapes to render on top
const elevationOffset = hovered ? 0.25 : baseElevation;
```

### 2. Added Render Order
```typescript
// Calculate renderOrder based on hover state to prevent z-fighting
const renderOrder = hovered ? 5 : 4; // Higher than shapes (1-3)
```

### 3. Eliminated Transparency (Critical!)
```typescript
// BEFORE (caused z-fighting):
transparent: true,
opacity: opacity,  // Variable opacity
depthWrite: false, // Transparency disables depth writing

// AFTER (fixed):
transparent: false,
opacity: 1.0,      // Always opaque
depthWrite: true,  // Depth buffer works correctly
depthTest: true,
```

### 4. Added Emissive Glow for Hover
```typescript
// Replace opacity changes with emissive glow
const emissiveColor = hovered ? baseColor : new THREE.Color('#000000');
const emissiveIntensity = hovered ? 0.3 : 0;

// In material:
emissive: emissiveColor,
emissiveIntensity: emissiveIntensity,
```

### 5. Added Strong Polygon Offset
```typescript
polygonOffset: true,
polygonOffsetFactor: -40,  // Strong negative offset pulls towards camera
polygonOffsetUnits: -1,
```

### 6. Switched to MeshStandardMaterial
```typescript
// BEFORE: MeshLambertMaterial (no emissive support)
// AFTER: MeshStandardMaterial (supports emissive + proper lighting)
new THREE.MeshStandardMaterial({
  color: baseColor,
  emissive: emissiveColor,
  emissiveIntensity: emissiveIntensity,
  roughness: 0.8,
  metalness: 0.2,
  // ... depth settings
})
```

### 7. Removed Per-Frame Material Updates
```typescript
// REMOVED (caused flickering):
useFrame(() => {
  mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
});

// REPLACED WITH: Static material with hover-based emissive (no animation)
```

## Implementation Details

### Elevation Hierarchy
1. **Grid:** y = 0.00
2. **Shapes (default):** y = 0.10
3. **Shapes (selected/hovered):** y = 0.20
4. **Shapes (highlighted):** y = 0.30
5. **Reference objects (default):** y = 0.15 ✨ NEW
6. **Reference objects (hovered):** y = 0.25 ✨ NEW

### RenderOrder Hierarchy
1. **Shapes (default):** renderOrder = 1
2. **Shapes (multi-selected):** renderOrder = 2
3. **Shapes (primary selected):** renderOrder = 3
4. **Reference objects (default):** renderOrder = 4 ✨ NEW
5. **Reference objects (hovered):** renderOrder = 5 ✨ NEW

## Code Changes

### `ReferenceObjectRenderer.tsx`

#### Material Configuration (BEFORE)
```typescript
// MeshLambertMaterial with transparency
const material = useMemo(() => {
  return new THREE.MeshLambertMaterial({
    color: object.material.color,
    transparent: true,
    opacity: opacity,  // 0.6 by default
    wireframe: false,
    side: THREE.DoubleSide
  });
}, [object.material.color, opacity]);

// Per-frame hover animation
useFrame(() => {
  if (meshRef.current && meshRef.current.material) {
    const mat = meshRef.current.material as THREE.MeshLambertMaterial;
    const targetOpacity = hovered ? Math.min(opacity * 1.3, 1) : opacity;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
  }
});
```

#### Material Configuration (AFTER)
```typescript
// MeshStandardMaterial with emissive glow and NO transparency
const material = useMemo(() => {
  const baseColor = new THREE.Color(object.material.color);
  const emissiveColor = hovered ? baseColor : new THREE.Color('#000000');
  const emissiveIntensity = hovered ? 0.3 : 0;

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity: emissiveIntensity,
    // CRITICAL: Disable transparency
    opacity: 1.0,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    wireframe: false,
    side: THREE.DoubleSide,
    // Strong polygon offset
    polygonOffset: true,
    polygonOffsetFactor: -40,
    polygonOffsetUnits: -1,
    roughness: 0.8,
    metalness: 0.2
  });
}, [object.material.color, hovered]);

// Removed useFrame - no per-frame updates
// Hover effect now handled by material useMemo dependency on 'hovered'
```

#### Rendering (BEFORE)
```typescript
<group position={[position.x, position.y, position.z]}>
  <mesh
    geometry={geometryOrGroup}
    material={material}
    // No renderOrder
  />
</group>
```

#### Rendering (AFTER)
```typescript
// Calculate elevation and renderOrder
const baseElevation = 0.15;
const elevationOffset = hovered ? 0.25 : baseElevation;
const renderOrder = hovered ? 5 : 4;

// Elevated position with renderOrder
<group position={[position.x, position.y + elevationOffset, position.z]}>
  <mesh
    geometry={geometryOrGroup}
    material={material}
    renderOrder={renderOrder}
    // ... other props
  />
</group>
```

## Testing

### Verification Steps
1. ✅ Open Compare panel
2. ✅ Toggle visibility of multiple objects (soccer field, basketball court, etc.)
3. ✅ Rotate camera to oblique angles
4. ✅ Verify no flickering occurs
5. ✅ Hover over objects and verify smooth elevation change
6. ✅ Verify objects render above shapes

### Edge Cases Tested
- Multiple overlapping objects
- Objects overlapping with shapes
- Camera at various angles (top-down, oblique, side)
- Rapid toggling of object visibility

## Performance Impact

- **Minimal:** Simple arithmetic operations (position.y + offset)
- **No frame rate impact:** Elevation calculated once per render
- **Memory:** No additional memory usage

## Related Issues

This fix follows the same pattern as:
- **Shapes Z-Fighting Fix** (ShapeRenderer.tsx) - See `2D_CAMERA_COMPRESSION_FIX.md` notes
- **Layer Elevation System** (0.05 per layer separation)

## Prevention

To prevent similar issues in the future:

1. **Always use elevation offsets ≥ 0.10** for objects that could overlap
2. **Use renderOrder** for explicit rendering hierarchy
3. **Test at oblique camera angles** where z-fighting is most visible
4. **Follow elevation hierarchy** documented above

## Success Metrics

- ✅ Zero flickering at all camera angles
- ✅ Smooth hover effects with elevation changes
- ✅ Consistent with shapes rendering system
- ✅ Professional visual quality maintained

## Key Learnings

### Why the First Fix Attempt Was Incomplete

**First Attempt (Incomplete):**
- ✅ Added elevation offset (0.15-0.25)
- ✅ Added renderOrder (4-5)
- ❌ Still used transparency (transparent: true, opacity: 0.6)
- ❌ Kept useFrame per-frame material updates
- ❌ No polygonOffset
- ❌ Used MeshLambertMaterial (no emissive support)

**Result:** Reduced flickering but didn't eliminate it completely

**Complete Fix (This Implementation):**
- ✅ Elevation offset (0.15-0.25)
- ✅ RenderOrder (4-5)
- ✅ **Eliminated transparency** (transparent: false, opacity: 1.0)
- ✅ **Removed per-frame updates** (static material)
- ✅ **Added strong polygonOffset** (-40 factor)
- ✅ **Switched to MeshStandardMaterial** (emissive glow support)
- ✅ **Enabled depthWrite** (depth buffer works correctly)

**Result:** Zero flickering at all angles

### Critical Insight

**Transparency is the enemy of z-fighting fixes.** Even with correct elevation:
- `transparent: true` forces GPU to disable depthWrite
- Without depth writing, overlapping surfaces can't be properly sorted
- Small elevation differences become unreliable
- Result: Persistent flickering

**Solution:** Always use opacity: 1.0 with transparent: false, and use emissive glow for visual effects instead of opacity changes.

## References

- Three.js Depth Buffer: https://threejs.org/docs/#api/en/constants/Materials
- Z-Fighting Solutions: Standard practice is 0.10+ unit separation
- Related Fixes:
  - `ShapeRenderer.tsx` lines 125-146 (complete material configuration)
  - `docs/fixes/Z_FIGHTING_FLICKERING_FIX.md` (detailed shape fix)
  - `docs/fixes/Z_FIGHTING_TECHNICAL_DETAILS.md` (depth buffer precision)
