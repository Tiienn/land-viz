# Element Transform Operations - Design Document

**Phase 4: Text as Layers - Transform Operations**

## Overview

Extend the existing shape-centric transform system to support unified element operations for both ShapeElements and TextElements.

## Current Architecture

### Existing Transform Systems

1. **Drag System** (`useAppStore.ts`)
   - `dragState`: Tracks dragging state with shape ID
   - `startDragging()`, `updateDragPosition()`, `finishDragging()`
   - Currently only supports shapes

2. **Resize System** (`ResizableShapeControls.tsx`)
   - Renders resize handles for shapes
   - Supports rectangles, circles, polylines
   - Operates on shape points

3. **Rotation System** (`RotationControls.tsx`)
   - Renders rotation handles for shapes
   - Supports angle snapping
   - Operates on shape rotation metadata

### Current Limitations

- All systems use shape-specific IDs and data structures
- No support for text element transforms
- No unified element transform interface

## Design Goals

1. **Backward Compatibility**: Existing shape transforms continue to work
2. **Element-Aware**: Support both ShapeElements and TextElements
3. **Type-Specific Behavior**:
   - **Shapes**: Geometric transforms (drag points, resize, rotate)
   - **Text**: Position & style transforms (drag position, rotate, font size)
4. **Dual-Write Pattern**: Synchronize with legacy stores during transition

## Phase 4A: Element Drag Support

### Type System Updates

```typescript
// Update DragState to support elements
export interface DragState {
  isDragging: boolean;
  draggedShapeId: string | null; // Legacy: for backward compat
  draggedElementId?: string | null; // NEW: unified element ID
  elementType?: 'shape' | 'text'; // NEW: element type for type-specific logic
  startPosition: Point2D | null;
  currentPosition: Point2D | null;
  originalShapePoints: Point2D[] | null; // Legacy
  originalShapesData?: Map<string, { points: Point2D[]; rotation?: { angle: number; center: Point2D } }>;
  // NEW: For text elements
  originalElementData?: {
    position?: Point3D; // For text elements
    points?: Point2D[]; // For shape elements
  };
}
```

### Store Actions

```typescript
// NEW: Element-aware drag actions
startElementDrag: (elementId: string, elementType: 'shape' | 'text', startPosition: Point2D) => void;
updateElementDragPosition: (currentPosition: Point2D) => void;
finishElementDrag: () => void;
cancelElementDrag: () => void;
```

### Implementation Strategy

1. **Add element drag actions to useAppStore**
   - `startElementDrag()`: Initialize drag state with element ID and type
   - `updateElementDragPosition()`: Update position based on element type
   - `finishElementDrag()`: Commit changes and dual-write to legacy stores

2. **Update ElementRenderer components**
   - Add drag event handlers to ShapeElementRenderer
   - Add drag event handlers to TextElementRenderer
   - Use element-aware drag actions

3. **Type-Specific Drag Logic**
   - **Shapes**: Update points with offset (existing logic)
   - **Text**: Update position (x, y, z coordinates)

4. **Dual-Write Pattern**
   - When dragging shape elements: sync to `shapes` array
   - When dragging text elements: sync to `useTextStore`
   - Ensures backward compatibility

## Phase 4B: Element Rotation Support

### Type System

```typescript
// TextElement already has rotation: number
// ShapeElement has rotation: { angle: number; center: Point2D }
// Need unified rotation interface

interface ElementRotationState {
  isRotating: boolean;
  rotatingElementId: string | null;
  elementType: 'shape' | 'text';
  rotationAngle: number;
  rotationCenter?: Point2D; // Only for shapes
}
```

### Store Actions

```typescript
// NEW: Element-aware rotation actions
startElementRotation: (elementId: string, elementType: 'shape' | 'text') => void;
updateElementRotation: (angle: number) => void;
finishElementRotation: () => void;
```

### Implementation Strategy

1. **Extend RotationControls for elements**
   - Support both shape and text rotation
   - Different rotation behavior based on element type

2. **Type-Specific Rotation**
   - **Shapes**: Rotate points around center (existing logic)
   - **Text**: Rotate CSS transform (rotation deg)

## Phase 4C: Text-Specific Transforms

### Font Size Adjustment

```typescript
// NEW: Text transform actions
updateTextFontSize: (elementId: string, fontSize: number) => void;
updateTextAlignment: (elementId: string, alignment: 'left' | 'center' | 'right') => void;
```

### Implementation Strategy

1. **Font Size Controls**
   - Create resize-like handles for text elements
   - Drag to increase/decrease font size
   - Min/max constraints (12px - 144px)

2. **Quick Text Formatting**
   - Keyboard shortcuts for font size (Ctrl+] / Ctrl+[)
   - Integration with Properties Panel
   - Real-time preview during adjustment

## Implementation Phases

### Phase 4A: Element Drag Support (4 hours)
- [x] Task 4.1: Analyze existing systems
- [ ] Task 4.2: Design architecture (this document)
- [ ] Task 4.3: Update type system (DragState)
- [ ] Task 4.4: Implement element drag actions
- [ ] Task 4.5: Update ElementRenderer with drag handlers
- [ ] Task 4.6: Test drag for shapes and text
- [ ] Task 4.7: Verify dual-write synchronization

### Phase 4B: Element Rotation (4 hours)
- [ ] Task 4.8: Update rotation state types
- [ ] Task 4.9: Implement element rotation actions
- [ ] Task 4.10: Extend RotationControls for elements
- [ ] Task 4.11: Test rotation for shapes and text

### Phase 4C: Text Transforms (4 hours)
- [ ] Task 4.12: Design font size adjustment UI
- [ ] Task 4.13: Implement font size controls
- [ ] Task 4.14: Add keyboard shortcuts
- [ ] Task 4.15: Integration testing

## Success Criteria

- [ ] Text elements can be dragged in 3D space
- [ ] Text elements can be rotated
- [ ] Font size can be adjusted interactively
- [ ] All transforms maintain backward compatibility
- [ ] Undo/redo works for all element transforms
- [ ] Dual-write keeps legacy stores synchronized
- [ ] Zero TypeScript errors
- [ ] No performance degradation

## Migration Path

1. **Phase 4A**: Add element drag alongside shape drag
2. **Phase 4B**: Add element rotation alongside shape rotation
3. **Phase 4C**: Add text-specific transforms
4. **Future**: Gradually migrate to element-only APIs

## Notes

- Maintain backward compatibility throughout
- Use dual-write pattern for gradual migration
- Test each phase independently
- Document all new APIs
- Update CLAUDE.md with new capabilities

---

**Created**: 2025-01-17 (Phase 3 Complete)
**Author**: Claude Code
**Status**: Design Phase
