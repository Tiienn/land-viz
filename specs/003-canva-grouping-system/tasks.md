# Task Breakdown: Canva-Style Grouping System

**Feature ID**: 003
**Created**: 2025-01-07
**Status**: Ready to Start

## Quick Reference

**Total Estimated Time**: 14-20 hours
**Number of Tasks**: 24 tasks across 6 phases
**Prerequisites**: ✅ Type definitions already updated

---

## Prerequisites Checklist

Before starting implementation:

- [x] Specification reviewed and approved (`spec.md`)
- [x] Implementation plan reviewed (`plan.md`)
- [x] Type definitions updated in `types/index.ts`
- [ ] Development server running (`cd app && npm run dev`)
- [ ] Test environment configured (`npm run test:all`)
- [ ] Git branch created (e.g., `feature/canva-grouping`)

---

## Phase 1: Foundation & Data Model (2-3 hours)

### Task 1.1: Initialize Group State in Store ✅ (PARTIALLY DONE)

**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 15 minutes
**Status**: Type definitions done, need to initialize state values

**Sub-tasks**:
- [x] Add `groupId?: string` to Shape type (already done)
- [x] Add `hoveredGroupId: string | null` to AppState (already done)
- [x] Add `highlightedShapeId: string | null` to AppState (already done)
- [ ] Initialize `hoveredGroupId: null` in initial state
- [ ] Initialize `highlightedShapeId: null` in initial state

**Code Example**:
```typescript
// Find the initial state object (around line 200-300)
const initialState: AppState = {
  // ... existing fields
  hoveredGroupId: null,
  highlightedShapeId: null,
  // ... rest of state
};
```

**Validation**:
- [ ] `npm run type-check` passes
- [ ] Store compiles without errors
- [ ] Dev server runs without warnings

---

### Task 1.2: Add Group State Actions

**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 30 minutes

**Sub-tasks**:
- [ ] Add `setHoveredGroupId` to AppStore interface
- [ ] Add `setHighlightedShapeId` to AppStore interface
- [ ] Implement `setHoveredGroupId` action
- [ ] Implement `setHighlightedShapeId` action

**Code Example**:
```typescript
// In AppStore interface (around line 25-150)
interface AppStore extends AppState {
  // ... existing actions
  setHoveredGroupId: (groupId: string | null) => void;
  setHighlightedShapeId: (shapeId: string | null) => void;
}

// In store implementation (around line 5000+)
setHoveredGroupId: (groupId) => {
  set({ hoveredGroupId: groupId });
},

setHighlightedShapeId: (shapeId) => {
  set({ highlightedShapeId: shapeId });
},
```

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] Actions are exported from store
- [ ] Can call actions from components (test manually)

---

### Task 1.3: Update groupShapes Function

**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 45 minutes

**Current Behavior**: Creates a separate group shape entity
**New Behavior**: Assigns shared `groupId` to selected shapes

**Sub-tasks**:
- [ ] Find existing `groupShapes` function (search for "groupShapes")
- [ ] Remove code that creates new group shape
- [ ] Add code to assign shared `groupId` to selected shapes
- [ ] Use `group_${Date.now()}` pattern for unique IDs
- [ ] Ensure shapes remain in their original layers
- [ ] Keep shapes selected after grouping
- [ ] Add to undo/redo history

**Code Example**:
```typescript
groupShapes: () => {
  set((state) => {
    const shapesToGroup = state.shapes.filter((s) =>
      state.selectedShapeIds.includes(s.id)
    );

    // Need at least 2 shapes to group
    if (shapesToGroup.length < 2) {
      logger.warn('Cannot group: need at least 2 shapes');
      return state;
    }

    // Generate unique group ID
    const groupId = `group_${Date.now()}`;

    // Assign groupId to all selected shapes
    const updatedShapes = state.shapes.map((s) =>
      shapesToGroup.some((sg) => sg.id === s.id)
        ? { ...s, groupId, modified: new Date() }
        : s
    );

    logger.info(`Grouped ${shapesToGroup.length} shapes with ID: ${groupId}`);

    return {
      shapes: updatedShapes,
      // Keep shapes selected
      selectedShapeIds: state.selectedShapeIds,
    };
  });

  // Add to history
  useToolHistoryStore.getState().addToHistory('Group shapes');
},
```

**Validation**:
- [ ] Select 2+ shapes and press `Ctrl+G`
- [ ] All shapes receive same `groupId`
- [ ] Shapes remain selected
- [ ] Shapes stay in their original layers
- [ ] Undo/redo works correctly

---

### Task 1.4: Create ungroupShapes Function

**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 30 minutes

**Sub-tasks**:
- [ ] Add `ungroupShapes` to AppStore interface
- [ ] Implement `ungroupShapes` function
- [ ] Remove `groupId` from all selected shapes
- [ ] Keep shapes selected after ungrouping
- [ ] Add to undo/redo history

**Code Example**:
```typescript
// In AppStore interface
interface AppStore extends AppState {
  // ... existing actions
  ungroupShapes: () => void;
}

// In store implementation
ungroupShapes: () => {
  set((state) => {
    const shapesToUngroup = state.shapes.filter((s) =>
      state.selectedShapeIds.includes(s.id) && s.groupId
    );

    if (shapesToUngroup.length === 0) {
      logger.warn('Cannot ungroup: no grouped shapes selected');
      return state;
    }

    const groupIds = new Set(shapesToUngroup.map((s) => s.groupId));

    // Remove groupId from all selected shapes
    const updatedShapes = state.shapes.map((s) =>
      shapesToUngroup.some((su) => su.id === s.id)
        ? { ...s, groupId: undefined, modified: new Date() }
        : s
    );

    logger.info(`Ungrouped ${groupIds.size} group(s)`);

    return {
      shapes: updatedShapes,
      // Keep shapes selected
      selectedShapeIds: state.selectedShapeIds,
    };
  });

  // Add to history
  useToolHistoryStore.getState().addToHistory('Ungroup shapes');
},
```

**Validation**:
- [ ] Group shapes with `Ctrl+G`
- [ ] Press `Ctrl+Shift+G` to ungroup
- [ ] `groupId` removed from all shapes
- [ ] Shapes remain selected
- [ ] Undo/redo works correctly

---

### Task 1.5: Add Ungroup Keyboard Shortcut

**File**: `app/src/App.tsx`
**Estimated Time**: 15 minutes

**Sub-tasks**:
- [ ] Find keyboard shortcuts array (search for "shortcuts")
- [ ] Add `Ctrl+Shift+G` shortcut
- [ ] Update `Ctrl+G` description if needed

**Code Example**:
```typescript
// In shortcuts array (around line 300-600)
{
  id: 'ungroup-shapes',
  key: 'Ctrl+Shift+G',
  description: 'Ungroup selected shapes',
  category: 'editing',
  action: ungroupShapes,
},
```

**Validation**:
- [ ] Press `Ctrl+Shift+G` with grouped shapes selected
- [ ] Shapes are ungrouped
- [ ] Keyboard shortcut help shows new shortcut (press `?`)

---

## Phase 2: Group Selection Logic (2-3 hours)

### Task 2.1: Implement Group Selection in DrawingCanvas

**File**: `app/src/components/Scene/DrawingCanvas.tsx`
**Estimated Time**: 60 minutes

**Goal**: When clicking a shape with `groupId`, select ALL shapes in that group

**Sub-tasks**:
- [ ] Find shape click handler (search for "handlePointerDown" or "onClick")
- [ ] Add logic to detect if clicked shape has `groupId`
- [ ] If grouped, find all shapes with same `groupId`
- [ ] Set `highlightedShapeId` to clicked shape
- [ ] Set `selectedShapeIds` to all group members

**Code Example**:
```typescript
// In handleShapeClick or similar function
const handleShapeClick = (shapeId: string) => {
  const clickedShape = shapes.find((s) => s.id === shapeId);

  if (!clickedShape) return;

  // Check if shape is part of a group
  if (clickedShape.groupId) {
    // Find all shapes in this group
    const groupMembers = shapes.filter((s) => s.groupId === clickedShape.groupId);
    const groupMemberIds = groupMembers.map((s) => s.id);

    // Select all shapes in group
    selectMultipleShapes(groupMemberIds);

    // Highlight the clicked shape
    setHighlightedShapeId(shapeId);

    logger.info(`Selected group: ${clickedShape.groupId} (${groupMemberIds.length} shapes)`);
  } else {
    // Normal selection for non-grouped shapes
    selectShape(shapeId);
    setHighlightedShapeId(null);
  }
};
```

**Validation**:
- [ ] Click one grouped shape → all shapes in group selected
- [ ] Clicked shape stored in `highlightedShapeId`
- [ ] Non-grouped shapes behave normally
- [ ] Multi-select with Ctrl+Click still works

---

### Task 2.2: Add Group Hover Detection

**File**: `app/src/components/Scene/DrawingCanvas.tsx` or `ShapeRenderer.tsx`
**Estimated Time**: 30 minutes

**Goal**: Set `hoveredGroupId` when mouse hovers over grouped shape

**Sub-tasks**:
- [ ] Find shape hover handler (search for "onPointerEnter" or "onHover")
- [ ] Add logic to detect if hovered shape has `groupId`
- [ ] Set `hoveredGroupId` when hovering grouped shape
- [ ] Clear `hoveredGroupId` when mouse leaves (unless group is selected)

**Code Example**:
```typescript
// In hover handler
const handleShapeHover = (shapeId: string | null) => {
  if (!shapeId) {
    // Mouse left shape
    setHoveredGroupId(null);
    return;
  }

  const hoveredShape = shapes.find((s) => s.id === shapeId);

  if (hoveredShape?.groupId) {
    setHoveredGroupId(hoveredShape.groupId);
  } else {
    setHoveredGroupId(null);
  }
};
```

**Validation**:
- [ ] Hover over grouped shape → `hoveredGroupId` set
- [ ] Move mouse away → `hoveredGroupId` cleared
- [ ] Hover over non-grouped shape → `hoveredGroupId` is null

---

### Task 2.3: Add Highlighted Shape Visual in ShapeRenderer

**File**: `app/src/components/Scene/ShapeRenderer.tsx`
**Estimated Time**: 30 minutes

**Goal**: Show stronger visual feedback for `highlightedShapeId`

**Sub-tasks**:
- [ ] Read `highlightedShapeId` from store
- [ ] Check if current shape is highlighted
- [ ] Apply stronger outline/color for highlighted shape

**Code Example**:
```typescript
// In ShapeRenderer component
const highlightedShapeId = useAppStore((state) => state.highlightedShapeId);
const isHighlighted = shape.id === highlightedShapeId;

// In mesh or line component
<mesh>
  <meshStandardMaterial
    color={shape.color}
    transparent
    opacity={0.7}
    emissive={isHighlighted ? '#9333EA' : undefined} // Purple glow for highlighted
    emissiveIntensity={isHighlighted ? 0.3 : 0}
  />
</mesh>

// Or for outline
<Line
  points={points}
  color={isHighlighted ? '#9333EA' : '#3B82F6'}
  lineWidth={isHighlighted ? 3 : 2} // Thicker line
/>
```

**Validation**:
- [ ] Click one shape in group
- [ ] Clicked shape has stronger visual (thicker line or glow)
- [ ] Other shapes in group have normal selection visual
- [ ] Visual disappears when deselecting

---

## Phase 3: Group Boundary Visualization (3-4 hours)

### Task 3.1: Create GroupBoundary Component

**File**: `app/src/components/Scene/GroupBoundary.tsx` (NEW FILE)
**Estimated Time**: 60 minutes

**Goal**: Render purple dashed boundary around grouped shapes

**Sub-tasks**:
- [ ] Create new file `GroupBoundary.tsx`
- [ ] Import necessary dependencies (Line from drei, store, utils)
- [ ] Calculate bounding box from group shapes
- [ ] Add 8px padding to bounding box
- [ ] Render purple dashed line
- [ ] Use `useMemo` for performance

**Full Code**:
```typescript
import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { getWorldPoints, calculateBoundingBox } from '../../utils/geometryTransforms';

interface GroupBoundaryProps {
  groupId: string;
  opacity?: number;
}

export const GroupBoundary = ({ groupId, opacity = 1 }: GroupBoundaryProps) => {
  const shapes = useAppStore((state) =>
    state.shapes.filter((s) => s.groupId === groupId)
  );

  const boundingBox = useMemo(() => {
    if (shapes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    // Calculate bounding box from world-space points (handles rotated shapes)
    const allPoints = shapes.flatMap((s) => getWorldPoints(s));
    return calculateBoundingBox(allPoints);
  }, [shapes]);

  // 8px padding = 0.08 world units (assuming 1 unit = 1 meter)
  const padding = 0.08;
  const { minX, minY, maxX, maxY } = boundingBox;

  // Create rectangle points (close the loop)
  const points: [number, number, number][] = [
    [minX - padding, minY - padding, 0.01], // Bottom-left
    [maxX + padding, minY - padding, 0.01], // Bottom-right
    [maxX + padding, maxY + padding, 0.01], // Top-right
    [minX - padding, maxY + padding, 0.01], // Top-left
    [minX - padding, minY - padding, 0.01], // Close loop
  ];

  return (
    <Line
      points={points}
      color="#9333EA" // Purple
      lineWidth={2}
      dashed
      dashScale={0.5}
      dashSize={0.05}
      gapSize={0.03}
      transparent
      opacity={opacity}
    />
  );
};
```

**Validation**:
- [ ] Component compiles without errors
- [ ] Can import in other files
- [ ] Ready for integration

---

### Task 3.2: Create GroupBoundaryManager Component

**File**: `app/src/components/Scene/GroupBoundaryManager.tsx` (NEW FILE)
**Estimated Time**: 45 minutes

**Goal**: Manage rendering of all visible group boundaries

**Sub-tasks**:
- [ ] Create new file `GroupBoundaryManager.tsx`
- [ ] Get `hoveredGroupId` and `selectedShapeIds` from store
- [ ] Calculate which groups should show boundaries
- [ ] Render GroupBoundary for each visible group
- [ ] Handle deduplication (don't render same boundary twice)

**Full Code**:
```typescript
import { useAppStore } from '../../store/useAppStore';
import { GroupBoundary } from './GroupBoundary';

export const GroupBoundaryManager = () => {
  const { hoveredGroupId, selectedShapeIds, shapes } = useAppStore((state) => ({
    hoveredGroupId: state.hoveredGroupId,
    selectedShapeIds: state.selectedShapeIds,
    shapes: state.shapes,
  }));

  // Get groupIds from selected shapes
  const selectedGroupIds = new Set(
    selectedShapeIds
      .map((id) => shapes.find((s) => s.id === id)?.groupId)
      .filter((groupId): groupId is string => groupId !== undefined)
  );

  // Combine hovered and selected groups (Set automatically deduplicates)
  const visibleGroupIds = new Set([
    ...(hoveredGroupId ? [hoveredGroupId] : []),
    ...selectedGroupIds,
  ]);

  // Don't render if no groups visible
  if (visibleGroupIds.size === 0) {
    return null;
  }

  return (
    <>
      {Array.from(visibleGroupIds).map((groupId) => (
        <GroupBoundary key={groupId} groupId={groupId} />
      ))}
    </>
  );
};
```

**Validation**:
- [ ] Component compiles without errors
- [ ] Handles empty states gracefully
- [ ] No duplicate boundaries rendered

---

### Task 3.3: Integrate GroupBoundaryManager into Scene

**File**: `app/src/components/Scene/SceneManager.tsx`
**Estimated Time**: 15 minutes

**Goal**: Add GroupBoundaryManager to 3D scene rendering

**Sub-tasks**:
- [ ] Import GroupBoundaryManager
- [ ] Add component to scene (inside <Canvas> or similar)
- [ ] Test rendering

**Code Example**:
```typescript
import { GroupBoundaryManager } from './GroupBoundaryManager';

// Inside your scene (within <Canvas> tag)
export const SceneManager = () => {
  return (
    <Canvas>
      {/* Existing scene components */}
      <CameraController />
      <GridBackground />
      <DrawingCanvas />
      <ShapeRenderer />

      {/* Add group boundaries */}
      <GroupBoundaryManager />

      {/* Other components */}
    </Canvas>
  );
};
```

**Validation**:
- [ ] Dev server compiles without errors
- [ ] No visual errors in browser console
- [ ] Boundaries don't render yet (need hover/selection logic from Phase 2)

---

### Task 3.4: Test Group Boundary Rendering

**File**: Manual testing
**Estimated Time**: 30 minutes

**Sub-tasks**:
- [ ] Group 2 shapes with `Ctrl+G`
- [ ] Hover over one shape → boundary appears
- [ ] Move mouse away → boundary disappears
- [ ] Click one shape → boundary appears and persists
- [ ] Test with rotated shapes → boundary is correct
- [ ] Test with shapes on different layers

**Validation Checklist**:
- [ ] Boundary is purple (#9333EA)
- [ ] Boundary is dashed
- [ ] Boundary has 8px padding from shapes
- [ ] Boundary appears on hover
- [ ] Boundary persists on selection
- [ ] Boundary disappears when not hovered/selected
- [ ] Boundary correctly encompasses rotated shapes

---

### Task 3.5: Add Fade In/Out Animations (OPTIONAL POLISH)

**File**: `app/src/components/Scene/GroupBoundary.tsx`
**Estimated Time**: 45 minutes (optional)

**Goal**: Smooth 200ms fade in/out for boundary

**Sub-tasks**:
- [ ] Install/import animation library (or use CSS transitions)
- [ ] Track previous visibility state
- [ ] Animate opacity from 0 → 1 (show) or 1 → 0 (hide)
- [ ] Set duration to 200ms

**Code Example** (using react-spring):
```typescript
import { useSpring, animated } from '@react-spring/three';

export const GroupBoundary = ({ groupId }: GroupBoundaryProps) => {
  // ... existing code

  const [spring, api] = useSpring(() => ({
    opacity: 1,
    config: { duration: 200 },
  }));

  // Trigger fade in/out based on visibility
  // (implementation depends on how you track visibility)

  return (
    <animated.group opacity={spring.opacity}>
      <Line
        points={points}
        color="#9333EA"
        lineWidth={2}
        dashed
        transparent
        // opacity controlled by spring
      />
    </animated.group>
  );
};
```

**Validation**:
- [ ] Boundary fades in smoothly (200ms)
- [ ] Boundary fades out smoothly (200ms)
- [ ] No flicker or visual glitches

---

## Phase 4: Group Operations Integration (2-3 hours)

### Task 4.1: Verify Move Operations Work with Groups

**File**: Manual testing
**Estimated Time**: 15 minutes

**Sub-tasks**:
- [ ] Group 2+ shapes
- [ ] Drag one shape → all shapes move
- [ ] Verify relative positions maintained
- [ ] Test undo/redo

**Validation**:
- [ ] All grouped shapes move together
- [ ] Relative positions preserved
- [ ] Boundary updates in real-time during drag
- [ ] Undo/redo works

---

### Task 4.2: Verify Rotation Operations Work with Groups

**File**: Manual testing (may need store updates)
**Estimated Time**: 30 minutes

**Sub-tasks**:
- [ ] Group 2+ shapes
- [ ] Enter rotation mode
- [ ] Rotate one shape → all shapes rotate around group center
- [ ] Test undo/redo

**Potential Code Update** (if rotation doesn't work):
```typescript
// In rotation handler (useAppStore.ts or RotationControls.tsx)
const rotateGroupedShapes = (angle: number) => {
  const selectedShapes = shapes.filter((s) => selectedShapeIds.includes(s.id));

  // Calculate group center
  const allPoints = selectedShapes.flatMap((s) => getWorldPoints(s));
  const { minX, minY, maxX, maxY } = calculateBoundingBox(allPoints);
  const groupCenter = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };

  // Rotate all shapes around group center
  // (implementation depends on existing rotation system)
};
```

**Validation**:
- [ ] All grouped shapes rotate together
- [ ] Rotation center is group center (not individual shape centers)
- [ ] Angle snapping works (Shift key)
- [ ] Undo/redo works

---

### Task 4.3: Verify Resize Operations Work with Groups

**File**: Manual testing (may need store updates)
**Estimated Time**: 30 minutes

**Sub-tasks**:
- [ ] Group 2+ shapes
- [ ] Enter resize mode (click shape to show handles)
- [ ] Drag resize handle → all shapes scale proportionally
- [ ] Test undo/redo

**Potential Code Update** (if resize doesn't work):
```typescript
// In resize handler (ResizableShapeControls.tsx or useAppStore.ts)
const resizeGroupedShapes = (scale: number) => {
  const selectedShapes = shapes.filter((s) => selectedShapeIds.includes(s.id));

  // Calculate group center
  const allPoints = selectedShapes.flatMap((s) => getWorldPoints(s));
  const { minX, minY, maxX, maxY } = calculateBoundingBox(allPoints);
  const groupCenter = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };

  // Scale all shapes from group center
  const updatedShapes = selectedShapes.map((shape) => {
    const scaledPoints = shape.points.map((point) => {
      const dx = point.x - groupCenter.x;
      const dy = point.y - groupCenter.y;
      return {
        x: groupCenter.x + dx * scale,
        y: groupCenter.y + dy * scale,
      };
    });

    return { ...shape, points: scaledPoints, modified: new Date() };
  });

  // Update shapes in store
  // ...
};
```

**Validation**:
- [ ] All grouped shapes resize together
- [ ] Scaling is proportional
- [ ] Scale center is group center
- [ ] Undo/redo works

---

### Task 4.4: Update Duplicate Operation for Groups

**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 45 minutes

**Goal**: When duplicating grouped shape, duplicate entire group with new groupId

**Sub-tasks**:
- [ ] Find `duplicateShape` function
- [ ] Check if shape has `groupId`
- [ ] If grouped, find all shapes in group
- [ ] Duplicate all shapes with new `groupId`
- [ ] Maintain relative positions
- [ ] Add to undo/redo

**Code Example**:
```typescript
duplicateShape: (shapeId) => {
  set((state) => {
    const originalShape = state.shapes.find((s) => s.id === shapeId);

    if (!originalShape) return state;

    let shapesToDuplicate: Shape[];
    let newGroupId: string | undefined;

    // Check if shape is in a group
    if (originalShape.groupId) {
      // Duplicate entire group
      shapesToDuplicate = state.shapes.filter(
        (s) => s.groupId === originalShape.groupId
      );
      newGroupId = `group_${Date.now()}`;
      logger.info(`Duplicating group: ${originalShape.groupId} (${shapesToDuplicate.length} shapes)`);
    } else {
      // Duplicate single shape
      shapesToDuplicate = [originalShape];
    }

    // Create duplicates with offset
    const offset = 0.5; // 0.5m offset
    const duplicates = shapesToDuplicate.map((shape) => ({
      ...shape,
      id: `shape_${Date.now()}_${Math.random()}`,
      groupId: newGroupId || undefined,
      points: shape.points.map((p) => ({
        x: p.x + offset,
        y: p.y + offset,
      })),
      created: new Date(),
      modified: new Date(),
    }));

    const newShapes = [...state.shapes, ...duplicates];
    const newSelectedIds = duplicates.map((d) => d.id);

    return {
      shapes: newShapes,
      selectedShapeIds: newSelectedIds,
    };
  });

  useToolHistoryStore.getState().addToHistory('Duplicate shapes');
},
```

**Validation**:
- [ ] Duplicate single shape (Ctrl+D) → single duplicate
- [ ] Duplicate grouped shape (Ctrl+D) → entire group duplicated
- [ ] New group has different `groupId`
- [ ] Relative positions maintained
- [ ] Undo/redo works

---

### Task 4.5: Update Delete Operation for Groups

**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 30 minutes

**Goal**: When deleting grouped shape, delete entire group

**Sub-tasks**:
- [ ] Find `deleteShape` function
- [ ] Check if shape has `groupId`
- [ ] If grouped, find all shapes in group
- [ ] Delete all shapes in group
- [ ] Add to undo/redo

**Code Example**:
```typescript
deleteShape: (shapeId) => {
  set((state) => {
    const shapeToDelete = state.shapes.find((s) => s.id === shapeId);

    if (!shapeToDelete) return state;

    let idsToDelete: string[];

    // Check if shape is in a group
    if (shapeToDelete.groupId) {
      // Delete entire group
      const groupShapes = state.shapes.filter(
        (s) => s.groupId === shapeToDelete.groupId
      );
      idsToDelete = groupShapes.map((s) => s.id);
      logger.info(`Deleting group: ${shapeToDelete.groupId} (${idsToDelete.length} shapes)`);
    } else {
      // Delete single shape
      idsToDelete = [shapeId];
    }

    const newShapes = state.shapes.filter((s) => !idsToDelete.includes(s.id));
    const newSelectedIds = state.selectedShapeIds.filter(
      (id) => !idsToDelete.includes(id)
    );

    return {
      shapes: newShapes,
      selectedShapeIds: newSelectedIds,
    };
  });

  useToolHistoryStore.getState().addToHistory('Delete shapes');
},
```

**Validation**:
- [ ] Delete single shape (Delete key) → single shape deleted
- [ ] Delete grouped shape (Delete key) → entire group deleted
- [ ] Undo/redo works

---

### Task 4.6: Implement Empty Group Cleanup (EC-004)

**File**: `app/src/store/useAppStore.ts`
**Estimated Time**: 30 minutes

**Goal**: Automatically remove `groupId` from last remaining shape in group

**Sub-tasks**:
- [ ] Create `cleanupEmptyGroups` utility function
- [ ] Call after delete operations
- [ ] Call after ungrouping
- [ ] Find groups with only 1 shape
- [ ] Remove `groupId` from those shapes

**Code Example**:
```typescript
// Utility function (can be in store or separate utils file)
const cleanupEmptyGroups = (shapes: Shape[]): Shape[] => {
  // Count shapes per group
  const groupCounts = new Map<string, number>();
  shapes.forEach((shape) => {
    if (shape.groupId) {
      groupCounts.set(shape.groupId, (groupCounts.get(shape.groupId) || 0) + 1);
    }
  });

  // Remove groupId from groups with only 1 shape
  return shapes.map((shape) => {
    if (shape.groupId && groupCounts.get(shape.groupId) === 1) {
      logger.info(`Removing groupId from last shape in group: ${shape.groupId}`);
      return { ...shape, groupId: undefined, modified: new Date() };
    }
    return shape;
  });
};

// Call after delete
deleteShape: (shapeId) => {
  set((state) => {
    // ... existing delete logic

    // Cleanup empty groups
    const cleanedShapes = cleanupEmptyGroups(newShapes);

    return {
      shapes: cleanedShapes,
      selectedShapeIds: newSelectedIds,
    };
  });

  useToolHistoryStore.getState().addToHistory('Delete shapes');
},
```

**Validation**:
- [ ] Group 2 shapes
- [ ] Delete 1 shape
- [ ] Remaining shape automatically loses `groupId`
- [ ] No error or warning messages

---

### Task 4.7: Verify Arrow Key Nudging Works with Groups

**File**: Manual testing
**Estimated Time**: 15 minutes

**Sub-tasks**:
- [ ] Group 2+ shapes
- [ ] Press arrow keys → all shapes nudge
- [ ] Press Shift+arrow keys → all shapes nudge 5m
- [ ] Test undo/redo

**Validation**:
- [ ] All grouped shapes nudge together
- [ ] Relative positions maintained
- [ ] Boundary updates during nudge
- [ ] Undo/redo works

---

## Phase 5: Edge Cases & Polish (2-3 hours)

### Task 5.1: Test Cross-Layer Grouping (EC-001)

**File**: Manual testing
**Estimated Time**: 20 minutes

**Sub-tasks**:
- [ ] Create 2 layers
- [ ] Add shapes to each layer
- [ ] Select shapes from both layers
- [ ] Group with `Ctrl+G`
- [ ] Verify shapes maintain their layer assignments

**Validation**:
- [ ] Shapes can be grouped across layers
- [ ] Each shape stays in its original layer
- [ ] Layer panel shows shapes in correct layers
- [ ] Operations work normally

---

### Task 5.2: Test Locked Shapes in Groups (EC-002)

**File**: Manual testing (may need logic updates)
**Estimated Time**: 30 minutes

**Sub-tasks**:
- [ ] Create 2 shapes
- [ ] Lock one shape
- [ ] Group both shapes
- [ ] Try to move group → locked shape stays, unlocked moves
- [ ] Test rotation and resize

**Potential Code Update**:
```typescript
// In move/drag handler
const handleDrag = (offset: Point2D) => {
  const shapesToMove = shapes.filter(
    (s) => selectedShapeIds.includes(s.id) && !s.isLocked // Respect lock state
  );

  // Move only unlocked shapes
  // ...
};
```

**Validation**:
- [ ] Locked shapes can be grouped
- [ ] Moving group respects lock state
- [ ] Rotating group respects lock state
- [ ] Resizing group respects lock state

---

### Task 5.3: Test Rotated Shapes in Groups (EC-003)

**File**: Manual testing
**Estimated Time**: 20 minutes

**Sub-tasks**:
- [ ] Create 2 shapes
- [ ] Rotate one shape 45°
- [ ] Group both shapes
- [ ] Verify boundary correctly encompasses rotated shape
- [ ] Test all operations (move, rotate, resize, duplicate)

**Validation**:
- [ ] Boundary uses world-space coordinates (via `getWorldPoints`)
- [ ] Boundary correctly encompasses rotated shapes
- [ ] No visual glitches or incorrect bounds
- [ ] Operations work normally

---

### Task 5.4: Performance Test with Large Groups

**File**: Manual testing + performance monitoring
**Estimated Time**: 45 minutes

**Sub-tasks**:
- [ ] Create 100 shapes
- [ ] Group all shapes with `Ctrl+G`
- [ ] Measure boundary calculation time
- [ ] Test drag performance
- [ ] Test hover/selection performance
- [ ] Optimize if needed

**Performance Measurement**:
```typescript
// Add to GroupBoundary.tsx for testing
const boundingBox = useMemo(() => {
  const start = performance.now();

  const allPoints = shapes.flatMap((s) => getWorldPoints(s));
  const box = calculateBoundingBox(allPoints);

  const end = performance.now();
  const duration = end - start;

  if (duration > 16) {
    console.warn(`Boundary calculation took ${duration.toFixed(2)}ms (> 16ms target)`);
  }

  return box;
}, [shapes]);
```

**Validation**:
- [ ] Boundary calculation < 16ms (60 FPS)
- [ ] No lag when dragging large groups
- [ ] No lag when hovering/selecting
- [ ] Browser console shows no performance warnings

---

### Task 5.5: Add Visual Polish and Animations

**File**: `app/src/components/Scene/GroupBoundary.tsx` and others
**Estimated Time**: 45 minutes

**Sub-tasks**:
- [ ] Smooth 200ms transitions for boundary
- [ ] No flicker during drag operations
- [ ] Real-time boundary updates during drag
- [ ] Test on different screen sizes
- [ ] Add subtle animations (optional)

**Code Example** (smooth opacity transitions):
```typescript
// In GroupBoundary.tsx
<Line
  points={points}
  color="#9333EA"
  lineWidth={2}
  dashed
  transparent
  opacity={opacity}
  // Could add custom shader material for smooth dashing animation
/>
```

**Validation**:
- [ ] Smooth visual transitions
- [ ] No flicker or visual glitches
- [ ] Boundary updates in real-time during drag
- [ ] Works on desktop and mobile

---

### Task 5.6: Update Keyboard Shortcut Help

**File**: `app/src/App.tsx` or keyboard shortcuts UI
**Estimated Time**: 15 minutes

**Sub-tasks**:
- [ ] Update `Ctrl+G` description to "Group selected shapes"
- [ ] Ensure `Ctrl+Shift+G` description is "Ungroup shapes"
- [ ] Test keyboard shortcut help panel (press `?`)

**Validation**:
- [ ] Press `?` to open keyboard shortcuts
- [ ] `Ctrl+G` shows correct description
- [ ] `Ctrl+Shift+G` shows correct description
- [ ] Help panel displays properly

---

## Phase 6: Testing & Validation (3-4 hours)

### Task 6.1: Write Unit Tests for Group Actions

**File**: `app/src/__tests__/grouping.test.ts` (NEW FILE)
**Estimated Time**: 90 minutes

**Sub-tasks**:
- [ ] Create test file
- [ ] Test `groupShapes()` function
- [ ] Test `ungroupShapes()` function
- [ ] Test group selection logic
- [ ] Test `cleanupEmptyGroups()` utility

**Test Examples**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Group Operations', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      shapes: [],
      selectedShapeIds: [],
      hoveredGroupId: null,
      highlightedShapeId: null,
    });
  });

  describe('groupShapes', () => {
    it('assigns shared groupId to selected shapes', () => {
      const store = useAppStore.getState();

      // Add test shapes
      store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
      store.addShape({ type: 'rectangle', points: [...], layer: 'main' });

      const shapeIds = store.shapes.map(s => s.id);
      store.selectMultipleShapes(shapeIds);

      // Group shapes
      store.groupShapes();

      // Verify groupId assigned
      const shapes = store.shapes.filter(s => shapeIds.includes(s.id));
      expect(shapes[0].groupId).toBe(shapes[1].groupId);
      expect(shapes[0].groupId).toMatch(/^group_\d+$/);
    });

    it('preserves individual shape properties', () => {
      const store = useAppStore.getState();

      store.addShape({
        type: 'rectangle',
        points: [...],
        color: '#FF0000',
        layer: 'layer1',
      });
      store.addShape({
        type: 'circle',
        points: [...],
        color: '#00FF00',
        layer: 'layer2',
      });

      const shapeIds = store.shapes.map(s => s.id);
      store.selectMultipleShapes(shapeIds);
      store.groupShapes();

      const [shape1, shape2] = store.shapes;
      expect(shape1.color).toBe('#FF0000');
      expect(shape2.color).toBe('#00FF00');
      expect(shape1.layer).toBe('layer1');
      expect(shape2.layer).toBe('layer2');
    });

    it('requires at least 2 shapes', () => {
      const store = useAppStore.getState();

      store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
      store.selectShape(store.shapes[0].id);

      const beforeCount = store.shapes.length;
      store.groupShapes();

      // Should not create group with 1 shape
      expect(store.shapes.length).toBe(beforeCount);
      expect(store.shapes[0].groupId).toBeUndefined();
    });
  });

  describe('ungroupShapes', () => {
    it('removes groupId from all selected shapes', () => {
      const store = useAppStore.getState();

      // Create and group shapes
      store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
      store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
      const shapeIds = store.shapes.map(s => s.id);
      store.selectMultipleShapes(shapeIds);
      store.groupShapes();

      // Verify grouped
      expect(store.shapes[0].groupId).toBeDefined();

      // Ungroup
      store.ungroupShapes();

      // Verify ungrouped
      expect(store.shapes[0].groupId).toBeUndefined();
      expect(store.shapes[1].groupId).toBeUndefined();
    });

    it('keeps shapes selected after ungrouping', () => {
      const store = useAppStore.getState();

      // Create and group shapes
      store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
      store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
      const shapeIds = store.shapes.map(s => s.id);
      store.selectMultipleShapes(shapeIds);
      store.groupShapes();

      // Ungroup
      store.ungroupShapes();

      // Verify still selected
      expect(store.selectedShapeIds).toEqual(shapeIds);
    });
  });

  describe('cleanupEmptyGroups', () => {
    it('removes groupId from last remaining shape', () => {
      // Test implementation
    });
  });
});
```

**Validation**:
- [ ] All tests pass (`npm run test:unit`)
- [ ] 70%+ code coverage for grouping logic
- [ ] No flaky tests

---

### Task 6.2: Write Unit Tests for Boundary Calculations

**File**: `app/src/__tests__/groupBoundary.test.ts` (NEW FILE)
**Estimated Time**: 60 minutes

**Sub-tasks**:
- [ ] Create test file
- [ ] Test `calculateBoundingBox` with rotated shapes
- [ ] Test boundary padding calculation
- [ ] Test performance (< 16ms)

**Test Examples**:
```typescript
import { describe, it, expect } from 'vitest';
import { getWorldPoints, calculateBoundingBox } from '../utils/geometryTransforms';

describe('Group Boundary Calculations', () => {
  it('calculates correct bounds for rotated shapes', () => {
    const shape = {
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      rotation: { angle: 45, center: { x: 0.5, y: 0.5 } },
    };

    const worldPoints = getWorldPoints(shape);
    const bbox = calculateBoundingBox(worldPoints);

    // Rotated square should have larger bounding box
    expect(bbox.maxX - bbox.minX).toBeGreaterThan(1);
    expect(bbox.maxY - bbox.minY).toBeGreaterThan(1);
  });

  it('includes correct padding', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];

    const bbox = calculateBoundingBox(points);
    const padding = 0.08;

    expect(bbox.minX).toBe(0);
    expect(bbox.minY).toBe(0);
    expect(bbox.maxX).toBe(1);
    expect(bbox.maxY).toBe(1);

    // Boundary should add padding
    const paddedMinX = bbox.minX - padding;
    const paddedMaxX = bbox.maxX + padding;
    expect(paddedMaxX - paddedMinX).toBeCloseTo(1 + 2 * padding);
  });

  it('performs calculation in < 16ms', () => {
    // Create 100 test shapes
    const shapes = Array.from({ length: 100 }, (_, i) => ({
      points: [
        { x: i, y: i },
        { x: i + 1, y: i },
        { x: i + 1, y: i + 1 },
        { x: i, y: i + 1 },
      ],
      rotation: { angle: i * 3.6, center: { x: i + 0.5, y: i + 0.5 } },
    }));

    const start = performance.now();

    const allPoints = shapes.flatMap((s) => getWorldPoints(s));
    calculateBoundingBox(allPoints);

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(16); // 60 FPS target
  });
});
```

**Validation**:
- [ ] All tests pass
- [ ] Performance test passes (< 16ms)
- [ ] Tests cover rotated shapes

---

### Task 6.3: Write Integration Tests for Group Operations

**File**: `app/src/__tests__/groupOperations.test.ts` (NEW FILE)
**Estimated Time**: 90 minutes

**Sub-tasks**:
- [ ] Create test file
- [ ] Test grouping + moving
- [ ] Test grouping + rotating
- [ ] Test grouping + resizing
- [ ] Test grouping + duplicating
- [ ] Test grouping + deleting
- [ ] Test undo/redo for all operations

**Test Examples**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { useToolHistoryStore } from '../store/useToolHistoryStore';

describe('Group Operations Integration', () => {
  beforeEach(() => {
    // Reset stores
    useAppStore.setState({ shapes: [], selectedShapeIds: [] });
    useToolHistoryStore.setState({ history: [], currentIndex: -1 });
  });

  it('moves all shapes in group together', () => {
    const store = useAppStore.getState();

    // Create and group shapes
    store.addShape({ type: 'rectangle', points: [{ x: 0, y: 0 }, ...], layer: 'main' });
    store.addShape({ type: 'rectangle', points: [{ x: 5, y: 5 }, ...], layer: 'main' });
    const shapeIds = store.shapes.map(s => s.id);
    store.selectMultipleShapes(shapeIds);
    store.groupShapes();

    const beforePoints = store.shapes.map(s => s.points[0]);

    // Move group
    store.startDragging(shapeIds[0], { x: 0, y: 0 });
    store.updateDragPosition({ x: 1, y: 1 });
    store.finishDragging();

    const afterPoints = store.shapes.map(s => s.points[0]);

    // Verify all shapes moved by same offset
    expect(afterPoints[0].x - beforePoints[0].x).toBe(1);
    expect(afterPoints[1].x - beforePoints[1].x).toBe(1);
  });

  it('duplicates entire group with new groupId', () => {
    const store = useAppStore.getState();

    // Create and group shapes
    store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
    store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
    const shapeIds = store.shapes.map(s => s.id);
    store.selectMultipleShapes(shapeIds);
    store.groupShapes();

    const originalGroupId = store.shapes[0].groupId;

    // Duplicate
    store.duplicateShape(shapeIds[0]);

    // Verify 4 shapes total (2 original + 2 duplicates)
    expect(store.shapes.length).toBe(4);

    // Verify duplicates have different groupId
    const duplicates = store.shapes.filter(s => !shapeIds.includes(s.id));
    expect(duplicates[0].groupId).toBeDefined();
    expect(duplicates[0].groupId).not.toBe(originalGroupId);
    expect(duplicates[0].groupId).toBe(duplicates[1].groupId);
  });

  it('deletes entire group', () => {
    const store = useAppStore.getState();

    // Create and group shapes
    store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
    store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
    const shapeIds = store.shapes.map(s => s.id);
    store.selectMultipleShapes(shapeIds);
    store.groupShapes();

    // Delete one shape in group
    store.deleteShape(shapeIds[0]);

    // Verify entire group deleted
    expect(store.shapes.length).toBe(0);
  });

  it('supports undo/redo for grouping', () => {
    const store = useAppStore.getState();
    const historyStore = useToolHistoryStore.getState();

    // Create shapes
    store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
    store.addShape({ type: 'rectangle', points: [...], layer: 'main' });
    const shapeIds = store.shapes.map(s => s.id);
    store.selectMultipleShapes(shapeIds);

    // Group
    store.groupShapes();
    expect(store.shapes[0].groupId).toBeDefined();

    // Undo
    historyStore.undo();
    expect(store.shapes[0].groupId).toBeUndefined();

    // Redo
    historyStore.redo();
    expect(store.shapes[0].groupId).toBeDefined();
  });
});
```

**Validation**:
- [ ] All integration tests pass
- [ ] Undo/redo works for all operations
- [ ] No regressions in existing features

---

### Task 6.4: Manual Testing of All User Stories

**File**: Manual testing
**Estimated Time**: 60 minutes

**Test all user stories systematically**:

**US-001: Group Shapes**
- [ ] Select 2+ shapes with Ctrl+Click
- [ ] Press `Ctrl+G` to group
- [ ] Verify purple dashed boundary appears
- [ ] Verify shapes have same `groupId`
- [ ] Verify individual properties preserved (color, rotation, layer)

**US-002: Group Selection**
- [ ] Click one grouped shape
- [ ] Verify all shapes in group selected
- [ ] Verify clicked shape highlighted (stronger visual)
- [ ] Verify group boundary displays

**US-003: Group Hover State**
- [ ] Hover over grouped shape
- [ ] Verify boundary appears
- [ ] Move mouse away
- [ ] Verify boundary disappears (unless group is selected)

**US-004: Group Operations**
- [ ] Move: Drag one shape → all move together
- [ ] Rotate: Enter rotation mode → all rotate around group center
- [ ] Resize: Resize one shape → all scale proportionally
- [ ] Duplicate (`Ctrl+D`): Creates new group with new groupId
- [ ] Delete: Removes all shapes in group
- [ ] Arrow keys: Nudges entire group

**US-005: Ungroup Shapes**
- [ ] Select grouped shape
- [ ] Press `Ctrl+Shift+G`
- [ ] Verify `groupId` removed from all shapes
- [ ] Verify shapes remain selected
- [ ] Verify boundary disappears

**Validation**:
- [ ] All user stories pass acceptance criteria
- [ ] No bugs or unexpected behavior
- [ ] Smooth, polished experience

---

### Task 6.5: Manual Testing of Edge Cases

**File**: Manual testing
**Estimated Time**: 45 minutes

**EC-001: Cross-Layer Grouping**
- [ ] Create 2 layers with shapes on each
- [ ] Group shapes from both layers
- [ ] Verify shapes maintain their layer assignments
- [ ] Verify operations work normally

**EC-002: Locked Shapes**
- [ ] Lock one shape
- [ ] Group with unlocked shape
- [ ] Try to move group
- [ ] Verify locked shape stays, unlocked moves
- [ ] Test rotation and resize

**EC-003: Rotated Shapes**
- [ ] Rotate one shape 45°
- [ ] Group with another shape
- [ ] Verify boundary correctly encompasses rotated shape
- [ ] Test all operations

**EC-004: Empty Group**
- [ ] Group 2 shapes
- [ ] Delete 1 shape
- [ ] Verify remaining shape loses `groupId` automatically

**Validation**:
- [ ] All edge cases handled correctly
- [ ] No errors or warnings
- [ ] Intuitive behavior

---

### Task 6.6: Cross-Browser and Mobile Testing

**File**: Manual testing
**Estimated Time**: 30 minutes

**Browsers**:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

**Mobile** (if applicable):
- [ ] Touch interactions
- [ ] Responsive layout
- [ ] Performance

**Validation**:
- [ ] Works in all browsers
- [ ] No visual glitches
- [ ] Acceptable performance on mobile

---

### Task 6.7: Final Bug Fixes and Regression Tests

**File**: Various
**Estimated Time**: 60-90 minutes

**Sub-tasks**:
- [ ] Review all test results
- [ ] Fix any bugs discovered during testing
- [ ] Write regression tests for bug fixes
- [ ] Re-run all tests to verify fixes
- [ ] Final manual testing pass

**Validation**:
- [ ] All tests pass
- [ ] No known bugs
- [ ] 70%+ test coverage achieved
- [ ] No regressions in existing features

---

## Final Checklist

### Before Completion

- [ ] All 24 tasks completed
- [ ] All user stories pass acceptance criteria
- [ ] All edge cases handled correctly
- [ ] 70%+ test coverage achieved
- [ ] Performance target met (< 16ms boundary calculation)
- [ ] No visual bugs or flicker
- [ ] Undo/redo works for all operations
- [ ] Keyboard shortcuts updated and working
- [ ] Code follows constitution (inline styles, TypeScript, Zustand)
- [ ] Documentation updated (if needed)

### Quick Test Commands

```bash
# Type checking
npm run type-check

# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Development server
cd app && npm run dev

# Production build (final validation)
npm run build
```

---

## Success Criteria Summary

**Functional**:
- ✅ Users can group 2+ shapes with `Ctrl+G`
- ✅ Purple dashed boundary appears on hover/selection
- ✅ Clicking one grouped shape selects all in group
- ✅ All operations work on grouped shapes
- ✅ Users can ungroup with `Ctrl+Shift+G`
- ✅ Undo/redo works for all group operations

**Non-Functional**:
- ✅ Group boundary calculation < 16ms (60 FPS)
- ✅ Smooth 200ms animations
- ✅ No visual flicker
- ✅ Works with rotated shapes
- ✅ Supports 100+ shapes without lag

**Quality**:
- ✅ 70%+ test coverage
- ✅ No regressions
- ✅ All edge cases handled
- ✅ Constitution compliance

---

## Estimated Timeline

| Phase | Duration | Completion Date |
|-------|----------|----------------|
| **Phase 1**: Foundation | 2-3 hours | Day 1 |
| **Phase 2**: Selection | 2-3 hours | Day 1 |
| **Phase 3**: Visualization | 3-4 hours | Day 2 |
| **Phase 4**: Operations | 2-3 hours | Day 2 |
| **Phase 5**: Polish | 2-3 hours | Day 3 |
| **Phase 6**: Testing | 3-4 hours | Day 3 |
| **Total** | **14-20 hours** | **3 days** |

---

**End of Task Breakdown**

Ready to start implementation! Begin with **Task 1.1: Initialize Group State in Store**.
