# Line Shape Midpoint Indicators - SELECT Mode Issue

**Date**: January 2025
**Status**: 🔴 Unresolved (Partial Fix Applied)
**Severity**: ⭐⭐ Medium (User Experience)

## Problem Statement

Orange midpoint snap indicators do not appear when:
1. ✅ **DRAWING mode** - Drawing a new shape (rectangle, polyline, etc.) and hovering near an existing Line shape's midpoint - **WORKS**
2. ❌ **SELECT mode** - Selecting a Line shape and hovering over its midpoint - **DOES NOT WORK**

The same indicators work correctly for polyline, rectangle, circle, and polygon shapes in both scenarios.

## Investigation Summary

### Root Cause Analysis

We identified and fixed ONE issue, but the SELECT mode problem persists:

**Fixed Issue**: Migration code in `App.tsx` was incomplete
- **Location**: `app/src/App.tsx:207-233`
- **Problem**: Migration only checked for missing 'perpendicular' and 'edge' types, not 'midpoint'
- **Fix Applied**: Added `hasMidpoint` check to migration (line 216)
- **Result**: This fixed DRAWING mode, but SELECT mode still broken

### What We Discovered

1. **Snap Point Generation**: ✅ CORRECT
   - `SnapGrid.extractSnapPoints()` correctly generates midpoint snap points for Line shapes
   - Console logs confirmed: `Created 4 midpoints for shape ... (type: line)`

2. **activeTypes Set**: ✅ FIXED IN DRAWING MODE
   - Migration now ensures 'midpoint' is in the Set
   - Default state includes: `['grid', 'endpoint', 'midpoint', 'center', 'edge', 'perpendicular']`

3. **Snap Point Filtering**: ⚠️ POTENTIAL ISSUE
   - `DrawingCanvas.performSnapDetection()` filters snap points by `snapConfig.activeTypes`
   - During SELECT mode, something is still filtering out midpoint snap points
   - Location: `app/src/components/Scene/DrawingCanvas.tsx:220-222`

4. **History Persistence**: ⚠️ POTENTIAL ISSUE
   - Undo/redo operations PRESERVE current snapping config (line 2833, 2842)
   - If activeTypes gets corrupted, it stays corrupted across undo/redo
   - Location: `app/src/store/useAppStore.ts:2833, 2842`

### Console Log Evidence

**During SELECT mode hover (from previous debugging session):**
```
[DrawingCanvas] nearbySnapPoints types: (3) ['perpendicular', 'midpoint', 'edge']
[DrawingCanvas] filteredSnapPoints: 0, activeTypes: (3) ['grid', 'endpoint', 'center']
```

**Analysis**:
- Midpoint snap points ARE being generated
- But `activeTypes` is missing 'midpoint' during SELECT mode
- This suggests there's ANOTHER place where activeTypes is being modified based on tool/mode

## Files Investigated

### Modified Files
1. ✅ **app/src/App.tsx** - Added midpoint to migration check (line 216)
2. ✅ **app/src/components/Scene/DrawingCanvas.tsx** - Removed debug logging
3. ✅ **app/src/components/Scene/SnapIndicator.tsx** - Removed debug logging
4. ✅ **app/src/utils/SnapGrid.ts** - Removed debug logging

### Key Files for Future Investigation
1. **app/src/store/useAppStore.ts**
   - Lines 323-440: `getDefaultDrawingState()` - Default snap config
   - Lines 2833, 2842: Undo/redo preserves snapping config (may preserve corrupted state)
   - Lines 3003-3012: `saveToHistory()` - Converts Set to Array for serialization

2. **app/src/components/Scene/DrawingCanvas.tsx**
   - Lines 168-170: `performSnapDetection()` - Reads snap config from store
   - Lines 220-222: Filters snap points by activeTypes

3. **app/src/utils/SnapGrid.ts**
   - Lines 33-34: `extractSnapPoints()` - Generates snap points for all shapes
   - Lines 72-131: Midpoint generation logic (correctly handles 'line' type)

4. **app/src/App.tsx**
   - Lines 207-233: Migration logic (now checks for midpoint)

## Potential Next Steps

### Hypothesis 1: Tool-Specific Snap Configuration
**Theory**: There may be tool-specific or mode-specific snap configurations that override the default activeTypes.

**Investigation Steps**:
1. Search for code that modifies activeTypes based on `activeTool === 'select'`
2. Check if there's a different snap config for SELECT mode vs DRAWING mode
3. Look for any `setState` calls that modify `drawing.snapping.config.activeTypes`

**Search Patterns**:
```bash
grep -r "activeTool.*select.*snap" app/src/
grep -r "select.*activeTypes" app/src/
grep -r "snapping.*config.*activeTypes.*=" app/src/
```

### Hypothesis 2: Corrupted localStorage State
**Theory**: The user's localStorage has corrupted activeTypes that the migration isn't catching.

**Investigation Steps**:
1. Clear localStorage completely: `localStorage.clear()`
2. Refresh the page to get fresh default state
3. Test if SELECT mode now works with Line shapes

### Hypothesis 3: Conditional Snap Point Filtering
**Theory**: There's additional filtering logic that excludes midpoints for certain shape types in SELECT mode.

**Investigation Steps**:
1. Add debug logging back to `DrawingCanvas.performSnapDetection()`
2. Log `activeTool`, `isShapeSelected`, `selectedShapeId`, and the shape's type
3. Check if there's conditional logic that changes activeTypes based on selected shape type

**Search Patterns**:
```bash
grep -r "type === 'line'" app/src/components/Scene/
grep -r "shape.type.*midpoint" app/src/
```

### Hypothesis 4: SnapIndicator Visibility Logic
**Theory**: The indicators are generated but not displayed due to visibility conditions.

**Investigation Steps**:
1. Check `SnapIndicator.tsx` visibility conditions (lines 383-390)
2. Verify `shouldShowIndicators` includes SELECT mode with shape selected
3. Check if `limitedSnapPoints` is limiting midpoint indicators in SELECT mode

## Workaround

**For users**:
- Midpoint indicators work correctly when DRAWING new shapes
- To snap to a Line shape's midpoint, start drawing a new shape (rectangle, polyline, etc.) and hover near the Line's midpoint
- The orange indicator will appear and you can click to snap to that point

## Related Issues

- None currently

## References

- Previous fix: `app/src/store/useAppStore.ts:4698` - Changed Line tool to create `type: 'line'` instead of `type: 'polyline'`
- Snap indicator fixes: `docs/fixes/SELECTED_SHAPE_INDICATORS_FIX.md`
- Z-fighting fixes: `docs/fixes/Z_FIGHTING_FLICKERING_FIX.md`
