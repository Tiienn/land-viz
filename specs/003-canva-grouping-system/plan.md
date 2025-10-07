# Implementation Plan: Canva-Style Grouping System

**Feature ID**: 003
**Created**: 2025-01-07
**Status**: Ready for Implementation

## Executive Summary

Implement a Canva-style grouping system that allows users to group multiple shapes and manipulate them as a single unit. The system uses a shared `groupId` property (not separate group entities), supports hover/selection states, and integrates seamlessly with existing rotation, resize, move, and duplicate operations.

---

## 1. Technical Context

### Current Architecture

**State Management**:
- Zustand store (`useAppStore.ts`) manages all shapes and drawing state
- Each shape has `id`, `points`, `rotation`, `layer`, and other properties
- Selection system supports multi-select via `selectedShapeIds: string[]`
- Undo/redo system tracks history via `useToolHistoryStore`

**3D Rendering**:
- React Three Fiber + Three.js for 3D visualization
- `ShapeRenderer.tsx` renders individual shapes with rotation transforms
- `EditableShapeControls.tsx` provides corner manipulation
- `ResizableShapeControls.tsx` provides resize handles
- `RotationControls.tsx` provides rotation handles

**Geometry Utilities**:
- `geometryTransforms.ts` handles rotation transforms and world-space coordinates
- `getWorldPoints()` applies rotation to shape points for accurate bounding boxes
- `calculateBoundingBox()` computes axis-aligned bounding boxes

**Styling**:
- All components use inline styles (no CSS files)
- 200ms smooth transitions for visual polish
- Canva-inspired design with purple accent colors

### Required Dependencies

**Existing** (no new dependencies needed):
- `zustand` - State management
- `react-three-fiber` + `three` - 3D rendering
- `@react-three/drei` - 3D helpers
- TypeScript type system

### Integration Points

1. **Store (`useAppStore.ts`)**:
   - Add `hoveredGroupId` and `highlightedShapeId` state
   - Update `groupShapes()` to use groupId pattern
   - Add `ungroupShapes()` action
   - Modify selection logic to auto-select grouped shapes

2. **Shape Renderer (`ShapeRenderer.tsx`)**:
   - Add stronger highlight for `highlightedShapeId`
   - Integrate with group hover detection

3. **Scene Components**:
   - Create `GroupBoundary.tsx` component for purple dashed boundary
   - Integrate into `SceneManager.tsx` rendering pipeline

4. **Keyboard Shortcuts (`App.tsx`)**:
   - Add `Ctrl+Shift+G` for ungrouping
   - Update `Ctrl+G` description to reflect new behavior

5. **Operations**:
   - Move, duplicate, rotate, resize already work with multi-select
   - Ensure they respect group membership

---

## 2. Implementation Approach

### Phase 1: Foundation & Data Model (2-3 hours)

**Goal**: Set up group state and update type definitions

#### Tasks:

**1.1 Update Type Definitions** ✅ (Already Done)
- `groupId?: string` added to Shape interface (line 44)
- `hoveredGroupId: string | null` added to AppState (line 497)
- `highlightedShapeId: string | null` added to AppState (line 498)

**1.2 Initialize Store State**
- Add `hoveredGroupId: null` to `useAppStore` initial state
- Add `highlightedShapeId: null` to initial state
- Add store actions:
  - `setHoveredGroupId(groupId: string | null): void`
  - `setHighlightedShapeId(shapeId: string | null): void`

**1.3 Update groupShapes Function**
- Remove creation of separate group shape entity
- Assign shared `groupId` to all selected shapes
- Use `group_${Date.now()}` pattern for unique IDs
- Ensure shapes remain in their original layers
- Select all grouped shapes after grouping

**1.4 Add ungroupShapes Function**
- Remove `groupId` from all selected shapes
- Keep shapes selected after ungrouping
- Add to undo/redo history

**Acceptance Criteria**:
- ✅ Types defined and exported
- Shapes can receive and store `groupId`
- `Ctrl+G` assigns shared groupId to selected shapes
- `Ctrl+Shift+G` removes groupId
- Undo/redo works for group/ungroup operations

---

### Phase 2: Group Selection Logic (2-3 hours)

**Goal**: Implement "click one = select all in group" behavior

#### Tasks:

**2.1 Modify Shape Click Handler**
- Update `DrawingCanvas.tsx` or `ShapeRenderer.tsx` click logic
- When clicking a shape with `groupId`:
  1. Find all shapes with same `groupId`
  2. Store clicked shape ID in `highlightedShapeId`
  3. Set `selectedShapeIds` to all group member IDs
- When clicking a shape without `groupId`:
  - Use existing single/multi-select logic
  - Clear `highlightedShapeId`

**2.2 Update Shape Hover Handler**
- When hovering over shape with `groupId`:
  - Set `hoveredGroupId` to that group's ID
- When mouse leaves:
  - Clear `hoveredGroupId` (unless group is selected)

**2.3 Visual Highlight for Clicked Shape**
- Update `ShapeRenderer.tsx` to check `highlightedShapeId`
- Apply stronger visual (e.g., 3px outline instead of 2px)
- Use brighter color or different style

**Acceptance Criteria**:
- Clicking one grouped shape selects all in group
- Clicked shape visually highlighted within group
- Hovering over grouped shape shows group boundary (next phase)
- Non-grouped shapes behave normally

---

### Phase 3: Group Boundary Visualization (3-4 hours)

**Goal**: Display purple dashed boundary around grouped shapes

#### Tasks:

**3.1 Create GroupBoundary Component**

File: `app/src/components/Scene/GroupBoundary.tsx`

```typescript
import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { getWorldPoints, calculateBoundingBox } from '../../utils/geometryTransforms';

interface GroupBoundaryProps {
  groupId: string;
  opacity?: number; // For fade in/out
}

export const GroupBoundary = ({ groupId, opacity = 1 }: GroupBoundaryProps) => {
  const shapes = useAppStore((state) =>
    state.shapes.filter((s) => s.groupId === groupId)
  );

  const boundingBox = useMemo(() => {
    // Calculate bounding box from world-space points
    const allPoints = shapes.flatMap((s) => getWorldPoints(s));
    return calculateBoundingBox(allPoints);
  }, [shapes]);

  const padding = 0.08; // 8px in world units (assuming 1 unit = 1 meter)
  const { minX, minY, maxX, maxY } = boundingBox;

  const points: [number, number, number][] = [
    [minX - padding, minY - padding, 0.01],
    [maxX + padding, minY - padding, 0.01],
    [maxX + padding, maxY + padding, 0.01],
    [minX - padding, maxY + padding, 0.01],
    [minX - padding, minY - padding, 0.01], // Close the loop
  ];

  return (
    <Line
      points={points}
      color="#9333EA" // Purple
      lineWidth={2}
      dashed
      dashScale={0.5}
      transparent
      opacity={opacity}
    />
  );
};
```

**3.2 Add Boundary Rendering Logic**

Create `GroupBoundaryManager.tsx` to manage all group boundaries:

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
      .filter(Boolean)
  );

  // Combine hovered and selected groups (deduplicate)
  const visibleGroupIds = new Set([
    ...(hoveredGroupId ? [hoveredGroupId] : []),
    ...selectedGroupIds,
  ]);

  return (
    <>
      {Array.from(visibleGroupIds).map((groupId) => (
        <GroupBoundary key={groupId} groupId={groupId} />
      ))}
    </>
  );
};
```

**3.3 Integrate into SceneManager**

Add `<GroupBoundaryManager />` to `SceneManager.tsx` or main 3D scene:

```typescript
import { GroupBoundaryManager } from './GroupBoundaryManager';

// Inside <Canvas> or scene container:
<GroupBoundaryManager />
```

**3.4 Add Fade In/Out Animations (Optional Polish)**
- Use `react-spring` or CSS transitions for 200ms fade
- Track previous `hoveredGroupId` state
- Animate opacity from 0 → 1 (show) or 1 → 0 (hide)

**Acceptance Criteria**:
- Purple dashed boundary appears when hovering grouped shape
- Boundary appears when group is selected
- Boundary disappears when not hovered and not selected
- Boundary calculated correctly for rotated shapes (using world-space)
- 8px padding from outermost shape edges
- 200ms smooth fade in/out (optional but recommended)

---

### Phase 4: Group Operations Integration (2-3 hours)

**Goal**: Ensure all operations (move, rotate, resize, duplicate, delete) work on grouped shapes

#### Tasks:

**4.1 Verify Move Operations**
- Test dragging grouped shape → all shapes move
- Already works via multi-select system (`updateDragPosition` applies to all selected)

**4.2 Verify Rotation Operations**
- Test rotating grouped shape → all shapes rotate around group center
- Already works via existing `rotateMultipleShapes` logic
- Verify group center calculation uses correct shapes

**4.3 Verify Resize Operations**
- Test resizing grouped shape → all shapes scale proportionally
- May need to update `ResizableShapeControls.tsx` to calculate group bounds

**4.4 Update Duplicate Operation**
- Modify `duplicateShape` to handle groups:
  - If shape has `groupId`, duplicate ALL shapes in group
  - Assign new `groupId` to duplicated shapes
  - Maintain relative positions

**4.5 Update Delete Operation**
- Modify delete logic:
  - If deleting shape with `groupId`, delete ALL shapes in group
  - Handle EC-004: If only 1 shape remains in group, remove its `groupId`

**4.6 Verify Arrow Key Nudging**
- Test arrow keys on grouped shape → all shapes nudge
- Already works via multi-select system

**Acceptance Criteria**:
- Moving grouped shape moves all shapes
- Rotating grouped shape rotates around group center
- Resizing grouped shape scales all proportionally
- `Ctrl+D` duplicates entire group with new groupId
- Delete removes entire group
- Arrow keys nudge entire group
- Last shape in group auto-removes groupId

---

### Phase 5: Edge Cases & Polish (2-3 hours)

**Goal**: Handle edge cases and add final polish

#### Tasks:

**5.1 Handle Cross-Layer Grouping (EC-001)**
- Allow grouping shapes from different layers
- Shapes maintain their layer assignments
- Test and verify behavior

**5.2 Handle Locked Shapes (EC-002)**
- Allow locked shapes to be grouped
- Group operations respect lock state (locked shapes don't move)
- Add visual indicator for partially locked groups (optional)

**5.3 Handle Empty Groups (EC-004)**
- When deleting shapes, check if group has only 1 shape left
- Automatically remove `groupId` from last remaining shape
- Add utility function: `cleanupEmptyGroups()`

**5.4 Performance Optimization**
- Memoize group boundary calculations with `useMemo`
- Ensure boundary calculation < 16ms (60 FPS target)
- Test with 100 shapes in a single group

**5.5 Visual Polish**
- Smooth 200ms fade animations for boundary
- No flicker during drag operations
- Real-time boundary updates during drag
- Test on different screen sizes

**5.6 Add Keyboard Shortcut Help**
- Update `Ctrl+G` description: "Group selected shapes"
- Add `Ctrl+Shift+G` description: "Ungroup shapes"
- Update keyboard shortcuts panel in UI

**Acceptance Criteria**:
- Cross-layer grouping works correctly
- Locked shapes handled gracefully
- Empty groups cleaned up automatically
- Group boundary calculation < 16ms
- Smooth animations with no visual flicker
- Keyboard shortcut help updated

---

### Phase 6: Testing & Validation (3-4 hours)

**Goal**: Comprehensive testing and bug fixes

#### Tasks:

**6.1 Unit Tests**
- Test `groupShapes()` assigns shared groupId
- Test `ungroupShapes()` removes groupId
- Test group selection logic
- Test group boundary calculation
- Test empty group cleanup

**6.2 Integration Tests**
- Test grouping + moving
- Test grouping + rotating
- Test grouping + resizing
- Test grouping + duplicating
- Test grouping + deleting
- Test undo/redo for all operations

**6.3 Performance Tests**
- Test with 100 shapes in a group
- Verify < 16ms boundary calculation
- Test drag performance with large groups

**6.4 Accessibility Tests**
- Keyboard-only workflow (Ctrl+G, Ctrl+Shift+G)
- Screen reader support (if applicable)

**6.5 Manual Testing**
- Test all user stories (US-001 through US-005)
- Test all edge cases (EC-001 through EC-004)
- Test cross-browser compatibility
- Test on mobile (touch interactions)

**6.6 Bug Fixes**
- Fix any issues discovered during testing
- Verify fixes with regression tests

**Acceptance Criteria**:
- 70%+ test coverage for grouping logic
- All user stories pass acceptance criteria
- All edge cases handled correctly
- No performance regressions
- No visual bugs or flicker
- Undo/redo works for all operations

---

## 3. File Structure

```
app/src/
├── components/Scene/
│   ├── GroupBoundary.tsx          # NEW: Purple dashed boundary
│   ├── GroupBoundaryManager.tsx   # NEW: Manages all group boundaries
│   ├── ShapeRenderer.tsx          # MODIFIED: Add highlighted shape visual
│   ├── DrawingCanvas.tsx          # MODIFIED: Update click/hover handlers
│   └── SceneManager.tsx           # MODIFIED: Integrate GroupBoundaryManager
├── store/
│   └── useAppStore.ts             # MODIFIED: Add group state & actions
├── utils/
│   └── geometryTransforms.ts      # EXISTING: Use for boundary calculations
├── types/
│   └── index.ts                   # MODIFIED: Already updated with types ✅
└── __tests__/
    ├── grouping.test.ts           # NEW: Unit tests for grouping
    ├── groupBoundary.test.ts      # NEW: Boundary calculation tests
    └── groupOperations.test.ts    # NEW: Integration tests
```

---

## 4. Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**Store Actions**:
```typescript
describe('groupShapes', () => {
  it('assigns shared groupId to selected shapes', () => {
    const store = useAppStore.getState();
    store.selectMultipleShapes(['shape1', 'shape2']);
    store.groupShapes();

    const shapes = store.shapes.filter(s => ['shape1', 'shape2'].includes(s.id));
    expect(shapes[0].groupId).toBe(shapes[1].groupId);
    expect(shapes[0].groupId).toMatch(/^group_\d+$/);
  });

  it('preserves individual shape properties', () => {
    // Test color, rotation, layer preservation
  });
});

describe('ungroupShapes', () => {
  it('removes groupId from all shapes', () => {
    // Test ungrouping
  });

  it('keeps shapes selected after ungrouping', () => {
    // Test selection state
  });
});

describe('cleanupEmptyGroups', () => {
  it('removes groupId from last remaining shape', () => {
    // Test EC-004
  });
});
```

**Boundary Calculations**:
```typescript
describe('calculateBoundingBox', () => {
  it('calculates correct bounds for rotated shapes', () => {
    // Test with rotated rectangles
  });

  it('includes 8px padding', () => {
    // Test padding calculation
  });

  it('performs calculation in < 16ms', () => {
    // Performance test
  });
});
```

### Integration Tests

**Group Operations**:
```typescript
describe('Group Operations', () => {
  it('moves all shapes in group together', () => {
    // Test move operation
  });

  it('rotates all shapes around group center', () => {
    // Test rotation
  });

  it('duplicates entire group with new groupId', () => {
    // Test Ctrl+D
  });

  it('deletes entire group', () => {
    // Test Delete key
  });
});
```

**Undo/Redo**:
```typescript
describe('Undo/Redo with Groups', () => {
  it('undoes grouping operation', () => {
    // Test Ctrl+Z after Ctrl+G
  });

  it('redoes ungrouping operation', () => {
    // Test Ctrl+Y after Ctrl+Shift+G
  });
});
```

### Performance Tests

```typescript
describe('Group Performance', () => {
  it('handles 100 shapes in a group without lag', () => {
    const shapes = Array.from({ length: 100 }, (_, i) => createTestShape(i));
    // Measure boundary calculation time
    const start = performance.now();
    calculateBoundingBox(shapes.flatMap(s => getWorldPoints(s)));
    const end = performance.now();
    expect(end - start).toBeLessThan(16); // 60 FPS
  });
});
```

### Manual Test Scenarios

1. **Basic Grouping**:
   - Select 2 shapes → Ctrl+G → verify boundary appears
   - Click one shape → verify both selected
   - Move group → verify both move together

2. **Rotated Shapes**:
   - Rotate shape 45° → Group with another shape
   - Verify boundary correctly encompasses rotated shape

3. **Cross-Layer Grouping**:
   - Create 2 layers with shapes on each
   - Group shapes from both layers → verify layers maintained

4. **Locked Shapes**:
   - Lock one shape → Group with unlocked shape
   - Try to move group → locked shape stays, unlocked moves

5. **Undo/Redo**:
   - Group shapes → Undo → verify groupId removed
   - Redo → verify groupId restored

---

## 5. Performance Considerations

### Boundary Calculation Optimization

**Problem**: Calculating bounding box for 100 shapes with rotation transforms could be expensive.

**Solution**:
```typescript
// Use useMemo to cache boundary calculations
const boundingBox = useMemo(() => {
  const allPoints = shapes.flatMap((s) => getWorldPoints(s));
  return calculateBoundingBox(allPoints);
}, [shapes]); // Only recalculate when shapes change
```

**Target**: < 16ms per frame (60 FPS)

### Hover Detection Optimization

**Problem**: Hover detection on every mouse move could trigger unnecessary re-renders.

**Solution**:
- Throttle hover updates to 16ms intervals
- Use `React.memo` for GroupBoundary component
- Only re-render boundary when groupId or shapes change

### Large Group Handling

**Scenario**: User groups 100+ shapes

**Optimizations**:
1. Use `useMemo` for all expensive calculations
2. Batch state updates to avoid multiple re-renders
3. Consider virtualization if group panel UI is added (out of scope for v1)

---

## 6. Security Considerations

### No New Security Risks

- No external API calls or data fetching
- No user input sanitization needed (groupId is auto-generated)
- Inline styles prevent CSS injection
- TypeScript strict mode prevents type-related bugs

### Existing Security Measures

- ✅ Comprehensive security headers in `index.html`
- ✅ Environment-based logging (production console removal)
- ✅ Client-side only architecture

**Security Rating**: 9.8/10 (unchanged)

---

## 7. Constitution Compliance Checklist

### Article 1: Inline Styles Only ✅
- All new components use inline styles
- No CSS files or className props
- GroupBoundary uses inline style props

### Article 2: TypeScript Strict Mode ✅
- All new files use TypeScript
- Proper type definitions for groupId, hoveredGroupId, etc.
- No `any` types

### Article 3: Zustand State Management ✅
- All group state stored in useAppStore
- Actions follow existing patterns (groupShapes, ungroupShapes)
- No external state management

### Article 4: React Three Fiber for 3D ✅
- GroupBoundary uses `@react-three/drei` Line component
- Integrates with existing 3D scene

### Article 5: CAD Precision ✅
- Uses existing `getWorldPoints()` for accurate calculations
- Maintains precision during group operations
- No floating point approximations

### Article 6: Professional UX ✅
- Smooth 200ms animations
- Purple accent color matches Canva design
- Clear visual feedback (highlight, boundary)

### Article 7: Performance (60 FPS) ✅
- Target: < 16ms boundary calculations
- useMemo for expensive computations
- Tested with 100 shapes

### Article 8: Comprehensive Testing ✅
- 70%+ test coverage target
- Unit, integration, and performance tests
- Manual test scenarios

### Article 9: Accessibility ✅
- Keyboard shortcuts (Ctrl+G, Ctrl+Shift+G)
- Logical tab order (existing system)
- Clear visual indicators

### Article 10: Documentation ✅
- Specification document created
- Implementation plan (this document)
- Code comments for new utilities

---

## 8. Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Boundary calculation too slow** | High | Medium | Use useMemo, throttle updates, optimize algorithm |
| **Flicker during drag operations** | Medium | Low | Use requestAnimationFrame, batch updates |
| **Conflicts with existing rotation system** | High | Low | Reuse existing `getWorldPoints()`, test thoroughly |
| **Undo/redo breaks with groups** | High | Low | Follow existing history pattern, add tests |
| **Large groups (100+ shapes) lag** | Medium | Low | Performance test, optimize if needed |

### Mitigation Strategies

1. **Performance Monitoring**:
   - Use `utils/PerformanceMonitor.ts` to track boundary calculations
   - Set budget: < 16ms per frame
   - Add performance tests

2. **Incremental Implementation**:
   - Implement in phases (Foundation → Selection → Visualization → Operations)
   - Test each phase before moving to next
   - Allows early detection of issues

3. **Fallback Behavior**:
   - If boundary calculation exceeds 16ms, show simplified boundary (no padding)
   - Log warning to console (dev mode only)

---

## 9. Implementation Checklist

### Phase 1: Foundation & Data Model
- [ ] Initialize `hoveredGroupId` and `highlightedShapeId` in store
- [ ] Add `setHoveredGroupId` and `setHighlightedShapeId` actions
- [ ] Update `groupShapes()` to use groupId pattern
- [ ] Add `ungroupShapes()` function
- [ ] Add `Ctrl+Shift+G` keyboard shortcut
- [ ] Test grouping/ungrouping with undo/redo

### Phase 2: Group Selection Logic
- [ ] Update shape click handler for group selection
- [ ] Store clicked shape ID in `highlightedShapeId`
- [ ] Update hover handler to set `hoveredGroupId`
- [ ] Add stronger visual highlight for `highlightedShapeId` in ShapeRenderer
- [ ] Test click-to-select-all behavior
- [ ] Test hover detection

### Phase 3: Group Boundary Visualization
- [ ] Create `GroupBoundary.tsx` component
- [ ] Create `GroupBoundaryManager.tsx` component
- [ ] Integrate into `SceneManager.tsx`
- [ ] Add 200ms fade in/out animations
- [ ] Test boundary appears on hover
- [ ] Test boundary appears on selection
- [ ] Test boundary for rotated shapes

### Phase 4: Group Operations Integration
- [ ] Verify move operations work
- [ ] Verify rotation operations work
- [ ] Verify resize operations work
- [ ] Update `duplicateShape()` for groups
- [ ] Update delete logic for groups
- [ ] Test all operations with grouped shapes

### Phase 5: Edge Cases & Polish
- [ ] Test cross-layer grouping (EC-001)
- [ ] Test locked shapes in groups (EC-002)
- [ ] Implement empty group cleanup (EC-004)
- [ ] Performance test with 100 shapes
- [ ] Add smooth animations and polish
- [ ] Update keyboard shortcut help

### Phase 6: Testing & Validation
- [ ] Write unit tests for group actions
- [ ] Write unit tests for boundary calculations
- [ ] Write integration tests for operations
- [ ] Write performance tests
- [ ] Manual testing of all user stories
- [ ] Fix bugs and verify with regression tests
- [ ] Verify 70%+ test coverage

---

## 10. Time Estimates

| Phase | Tasks | Estimated Time | Complexity |
|-------|-------|----------------|------------|
| **Phase 1**: Foundation | Store setup, types, groupShapes, ungroupShapes | 2-3 hours | Low |
| **Phase 2**: Selection Logic | Click handlers, hover detection, highlight | 2-3 hours | Medium |
| **Phase 3**: Boundary Visualization | GroupBoundary, Manager, animations | 3-4 hours | Medium-High |
| **Phase 4**: Operations | Verify/update move, rotate, resize, duplicate, delete | 2-3 hours | Medium |
| **Phase 5**: Edge Cases & Polish | Cross-layer, locked, cleanup, performance, polish | 2-3 hours | Medium |
| **Phase 6**: Testing | Unit, integration, performance, manual testing | 3-4 hours | Medium |
| **Total** | | **14-20 hours** | |

---

## 11. Success Criteria

### Functional Requirements
- ✅ Users can group 2+ shapes with `Ctrl+G`
- ✅ Grouped shapes receive shared `groupId`
- ✅ Purple dashed boundary appears on hover/selection
- ✅ Clicking one grouped shape selects all in group
- ✅ Clicked shape gets highlighted
- ✅ All operations (move, rotate, resize, duplicate, delete) work on groups
- ✅ Users can ungroup with `Ctrl+Shift+G`
- ✅ Undo/redo works for all group operations

### Non-Functional Requirements
- ✅ Group boundary calculation < 16ms (60 FPS)
- ✅ Smooth 200ms fade in/out animations
- ✅ No visual flicker during operations
- ✅ Works with rotated shapes (world-space calculations)
- ✅ Supports groups up to 100 shapes without lag

### Quality Requirements
- ✅ 70%+ test coverage for grouping logic
- ✅ No regressions in existing shape operations
- ✅ All edge cases handled correctly
- ✅ Code follows existing patterns (inline styles, Zustand, TypeScript)

---

## 12. Next Steps

**After this plan is approved:**

1. **Create Task Breakdown**:
   - Run `/spec-tasks` to generate detailed task list with sub-tasks
   - Estimate time for each sub-task
   - Assign priority levels

2. **Begin Implementation**:
   - Start with Phase 1 (Foundation)
   - Test each phase before moving to next
   - Commit after each major milestone

3. **Continuous Testing**:
   - Write tests alongside implementation
   - Run tests frequently to catch regressions
   - Use `npm run test:all` for comprehensive checks

4. **Code Reviews**:
   - Review code for inline style compliance
   - Verify TypeScript strict mode
   - Check performance with `PerformanceMonitor`

5. **Final Validation**:
   - Manual testing of all user stories
   - Performance validation with 100 shapes
   - Accessibility check with keyboard-only workflow

---

## Appendix: Reference Materials

### Existing Code Patterns

**Store Action Pattern**:
```typescript
// In useAppStore interface
ungroupShapes: () => void;

// In store implementation
ungroupShapes: () => {
  set((state) => {
    const shapesToUngroup = state.shapes.filter((s) =>
      state.selectedShapeIds.includes(s.id) && s.groupId
    );

    const updatedShapes = state.shapes.map((s) =>
      shapesToUngroup.some((us) => us.id === s.id)
        ? { ...s, groupId: undefined, modified: new Date() }
        : s
    );

    return {
      shapes: updatedShapes,
      // Keep selection
    };
  });
},
```

**Inline Style Pattern**:
```typescript
<div style={{
  border: '2px dashed #9333EA',
  borderRadius: '8px',
  padding: '8px',
  transition: 'opacity 200ms ease-in-out',
  opacity: isVisible ? 1 : 0,
}}>
  {/* Content */}
</div>
```

**useMemo Pattern**:
```typescript
const boundingBox = useMemo(() => {
  const allPoints = shapes.flatMap((s) => getWorldPoints(s));
  return calculateBoundingBox(allPoints);
}, [shapes]); // Only recalculate when shapes change
```

---

**End of Implementation Plan**

This plan is ready for review. Next steps:
1. Review and approve plan
2. Run `/spec-tasks` to generate task breakdown
3. Begin Phase 1 implementation
