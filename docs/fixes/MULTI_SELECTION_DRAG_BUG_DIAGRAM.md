# Multi-Selection Drag Bug - Visual Diagram

## Bug Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTIONS                                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ 1. Create Rectangle A              │
        │ 2. Create Rectangle B              │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ 3. Shift+Click Rectangle A         │
        │    → Rectangle A selected          │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ 4. Shift+Click Rectangle B         │
        │    → Both rectangles selected      │
        └───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STATE AT THIS POINT                                              │
├─────────────────────────────────────────────────────────────────┤
│ selectedShapeId: "rect-B"          (primary selection)           │
│ selectedShapeIds: ["rect-A", "rect-B"]  (multi-selection array) │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ 5. Click Rectangle B (no Shift)   │
        │    → handleShapeClick()           │
        └───────────────────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────┐
    │ handleShapeClick (Lines 758-763)              │
    │ ✅ WORKS: Preserves multi-selection           │
    ├───────────────────────────────────────────────┤
    │ if (isAlreadySelected && isMultiSelection) {  │
    │   setState({                                  │
    │     selectedShapeId: "rect-B",                │
    │     // selectedShapeIds unchanged!            │
    │   });                                         │
    │ }                                             │
    └───────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ 6. Try to DRAG Rectangle B        │
        │    → Expect: Both rects move      │
        └───────────────────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────┐
    │ RENDER CHECK (Line 1003) ❌ BUG HERE          │
    ├───────────────────────────────────────────────┤
    │ const isSelected = shape.id === selectedShapeId│
    │                                               │
    │ For Rectangle A:                              │
    │   "rect-A" === "rect-B" → FALSE ❌            │
    │   → onPointerDown = undefined                 │
    │   → NO DRAG HANDLER ATTACHED!                 │
    │                                               │
    │ For Rectangle B:                              │
    │   "rect-B" === "rect-B" → TRUE ✅             │
    │   → onPointerDown = handlePointerDown()       │
    │   → DRAG HANDLER ATTACHED                     │
    └───────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESULT                                                           │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Rectangle B: Can be dragged (has handler)                     │
│ ❌ Rectangle A: CANNOT be dragged (no handler)                   │
│                                                                  │
│ User Experience: Appears broken - can't drag all selected shapes│
└─────────────────────────────────────────────────────────────────┘
```

## Correct Flow (After Fix)

```
    ┌───────────────────────────────────────────────┐
    │ RENDER CHECK (Line 1003) ✅ FIXED             │
    ├───────────────────────────────────────────────┤
    │ const isPrimarySelected = shape.id === selectedShapeId │
    │ const isMultiSelected = selectedShapeIds &&   │
    │     selectedShapeIds.includes(shape.id) &&    │
    │     !isPrimarySelected                        │
    │ const isSelected = isPrimarySelected || isMultiSelected │
    │                                               │
    │ For Rectangle A:                              │
    │   isPrimarySelected: FALSE                    │
    │   isMultiSelected: TRUE ✅                    │
    │   isSelected: TRUE ✅                         │
    │   → onPointerDown = handlePointerDown()       │
    │   → DRAG HANDLER ATTACHED ✅                  │
    │                                               │
    │ For Rectangle B:                              │
    │   isPrimarySelected: TRUE ✅                  │
    │   isMultiSelected: FALSE                      │
    │   isSelected: TRUE ✅                         │
    │   → onPointerDown = handlePointerDown()       │
    │   → DRAG HANDLER ATTACHED ✅                  │
    └───────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESULT (AFTER FIX)                                               │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Rectangle A: Can be dragged (has handler)                     │
│ ✅ Rectangle B: Can be dragged (has handler)                     │
│                                                                  │
│ User Experience: Works perfectly - all selected shapes draggable│
└─────────────────────────────────────────────────────────────────┘
```

## Code Comparison

### BEFORE (Buggy) ❌
```typescript
// Line 1003 - completedShapes useMemo
const isSelected = shape.id === selectedShapeId;
//                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                 Only checks primary selection!
```

### AFTER (Fixed) ✅
```typescript
// Line 1003 - completedShapes useMemo
const isPrimarySelected = shape.id === selectedShapeId;
const isMultiSelected = selectedShapeIds &&
                        selectedShapeIds.includes(shape.id) &&
                        !isPrimarySelected;
const isSelected = isPrimarySelected || isMultiSelected;
//                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                 Checks BOTH primary AND multi-selection!
```

## Why This Bug Exists

The `isSelected` calculation appears in two locations:

### Location 1: shapeMaterials useMemo (Line 620) ✅
**Purpose:** Determine visual appearance (highlight color, opacity)
**Implementation:** Correctly checks both primary and multi-selection
**Result:** Multi-selected shapes are visually highlighted ✅

### Location 2: completedShapes useMemo (Line 1003) ❌
**Purpose:** Determine event handler attachment (onClick, onPointerDown, etc.)
**Implementation:** Only checks primary selection
**Result:** Multi-selected shapes don't get drag handlers ❌

**Root Cause:** These two calculations were implemented at different times and the second one (Line 1003) was likely copy-pasted from older code that didn't support multi-selection yet.

## Impact Analysis

### What Works ✅
- Visual highlighting of multi-selected shapes
- State management (selectedShapeIds array)
- Click handling (preserves multi-selection)
- Drag logic for multiple shapes
- Final movement application to all shapes

### What's Broken ❌
- Event handler attachment to multi-selected (non-primary) shapes
- Specifically: `onPointerDown` handler only attached to primary selection
- **Result:** Can only drag the primary selected shape, not the others

### Risk Assessment
**Fix Risk: VERY LOW**
- Changes only affect the calculation of `isSelected` variable
- Makes it consistent with the existing working calculation at Line 620
- No changes to actual drag logic or state management
- Simple 3-line addition

**Impact of NOT Fixing: HIGH**
- Core feature (multi-selection drag) completely broken
- Poor user experience - confusing behavior
- Users will think the app is buggy

## Testing Matrix

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Select single shape → Drag | ✅ Works | ✅ Works |
| Shift+Click 2 shapes → Drag primary | ✅ Works | ✅ Works |
| Shift+Click 2 shapes → Drag secondary | ❌ BROKEN | ✅ Works |
| Shift+Click 3+ shapes → Drag any | ❌ BROKEN | ✅ Works |
| Group select → Drag | ✅ Works | ✅ Works |

## Summary

**The bug is a simple inconsistency:** The `isSelected` calculation was correctly implemented for visual styling (Line 620) but incorrectly implemented for event handlers (Line 1003). The fix is to align both calculations so they use the same logic.
