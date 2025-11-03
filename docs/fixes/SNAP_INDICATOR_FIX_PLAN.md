# Snap Indicator Fix - Implementation Plan

## Problem Summary

The green diamond snap indicator appears everywhere in 2D mode during Rectangle drawing, instead of only appearing when the cursor is actually near snap points. This violates expected CAD behavior where indicators should only show when genuinely close to snappable points.

## Root Cause Analysis

**Primary Issue**: Radius mismatch between grid generation and snap detection
- **Grid Generation**: Uses minimum 2m radius (`Math.max(this.snapDistance, 2.0)`)
- **Snap Detection**: Uses 0.5m radius in 2D mode
- **Result**: Grid points generated in 2m radius but filtered at 0.5m, causing indicators everywhere

**Secondary Issue**: Preemptive grid generation design flaw
- Grid points generated "near cursor" rather than reactively
- No render-time proximity validation
- Disconnect between generation logic and display requirements

## Technical Context

### Current Architecture
- **React Three Fiber** + Three.js for 3D rendering
- **Zustand** for state management
- **Dual indicator system**: SnapIndicator.tsx (multiple) + ActiveSnapIndicator.tsx (single)
- **SnapGrid.ts**: Spatial grid system for snap detection
- **DrawingCanvas.tsx**: Mouse event orchestration

### Data Flow
```
Mouse Move → DrawingCanvas.handlePointerMove()
          → performSnapDetection()
          → SnapGrid.updateSnapPoints()
          → SnapGrid.findSnapPointsInRadius()
          → Store.availableSnapPoints
          → SnapIndicator renders diamonds
```

## 4-Phase Implementation Plan

### Phase 1: Critical Radius Fix ⏱️ 30 minutes
**Goal**: Fix fundamental radius mismatch causing false positives

**File**: `app/src/utils/SnapGrid.ts`
**Line**: 106
**Change**:
```typescript
// BEFORE
const searchRadius = Math.max(this.snapDistance, 2.0);

// AFTER
const searchRadius = this.snapDistance;
```

**Expected Result**: 80% reduction in false positive indicators

### Phase 2: Render-Time Proximity Validation ⏱️ 1 hour
**Goal**: Add defensive filtering at render time

**Tasks**:
1. Add cursor position tracking to `useAppStore.ts`
2. Implement render-time filtering in `SnapIndicator.tsx`
3. Create proximity validation logic

**Code Example**:
```typescript
// In SnapIndicator.tsx
const validSnapPoints = useMemo(() => {
  if (!snapping.availableSnapPoints || !cursorPosition) return [];

  return snapping.availableSnapPoints.filter(point => {
    const distance = Math.sqrt(
      Math.pow(cursorPosition.x - point.position.x, 2) +
      Math.pow(cursorPosition.y - point.position.y, 2)
    );
    return distance <= snapRadius;
  });
}, [snapping.availableSnapPoints, cursorPosition, snapRadius]);
```

### Phase 3: Smart Grid Generation ⏱️ 45 minutes
**Goal**: Generate grid points only when actually needed

**Tasks**:
1. Enhanced grid intersection logic in `SnapGrid.ts`
2. Performance optimization with throttling
3. Cache grid intersections by region

**Code Example**:
```typescript
// In SnapGrid.ts
const shouldGenerateGridPoint = (gridX: number, gridY: number, cursorPos: Point2D, snapRadius: number): boolean => {
  const distance = Math.sqrt(
    Math.pow(cursorPos.x - gridX, 2) +
    Math.pow(cursorPos.y - gridY, 2)
  );
  return distance <= snapRadius;
};
```

### Phase 4: State Management Enhancement ⏱️ 30 minutes
**Goal**: Clean state transitions and debug capabilities

**Tasks**:
1. Enhanced state cleanup in `DrawingCanvas.tsx`
2. Debug mode implementation
3. Improved tool switching logic

## File Modifications

### Primary Files
- `app/src/utils/SnapGrid.ts` - Radius fix & smart generation
- `app/src/components/Scene/SnapIndicator.tsx` - Render-time filtering
- `app/src/components/Scene/DrawingCanvas.tsx` - State cleanup
- `app/src/store/useAppStore.ts` - Cursor position tracking

### New Files (Optional)
- `app/src/utils/snapDebug.ts` - Debug utilities
- `app/src/hooks/useSnapValidation.ts` - Validation logic

## Testing Strategy

### Phase 1 Testing
1. Start Rectangle drawing in 2D mode
2. Move cursor around grid - verify diamonds only appear near intersections
3. Check performance with FPS counter
4. Test with different snap distances

### Integration Testing
- All snap types work (grid, endpoint, midpoint, center)
- Tool switching maintains clean state
- 2D/3D mode switching consistency
- Performance maintains 60fps

### Visual Testing
- Capture screenshots of indicator behavior
- Test various cursor movement patterns
- Multi-shape interaction scenarios

## Performance Considerations

### Targets
- **Snap detection cycle**: <16ms
- **Memory overhead**: <1MB for snap points
- **Frame rate**: Maintain 60fps during drawing

### Optimizations
- Throttled updates (60fps limit)
- Spatial indexing for efficient lookup
- Lazy grid point generation
- Memory pooling for snap point objects

## Risk Mitigation

### Technical Risks
- **Breaking existing snap types**: Incremental testing after each phase
- **Performance degradation**: Profile at each phase
- **Coordinate system conflicts**: Comprehensive unit tests

### Implementation Strategy
- **Feature flags**: Toggle old/new behavior during development
- **Git commits**: Clean checkpoint at each phase for rollback
- **Performance monitoring**: Real-time metrics during implementation

## Success Criteria

### Functional Requirements
- ✅ Green diamonds only appear when cursor is actually near snap points
- ✅ Consistent behavior between 2D and 3D modes
- ✅ All snap types remain functional (grid, endpoint, midpoint, center)
- ✅ Professional CAD-like snap behavior

### Performance Requirements
- ✅ Maintain 60fps during drawing operations
- ✅ No memory leaks in snap detection system
- ✅ Smooth cursor interaction without lag

### User Experience Requirements
- ✅ Predictable snap behavior matching CAD software
- ✅ Clear visual feedback only when snapping available
- ✅ Reduced visual noise during drawing operations

## Implementation Timeline

**Total Time**: ~4 hours

- **Phase 1**: 30 minutes (Critical fix)
- **Phase 2**: 1 hour (Strategic enhancement)
- **Phase 3**: 45 minutes (Performance optimization)
- **Phase 4**: 30 minutes (Polish and debug)
- **Testing**: 1 hour (Comprehensive validation)
- **Documentation**: 15 minutes (Update comments)

## Next Steps

1. **Start with Phase 1** - Fix the critical radius mismatch
2. **Test immediately** - Verify 80% improvement
3. **Proceed incrementally** - Implement remaining phases with testing
4. **Final validation** - Comprehensive testing across all scenarios

---

**Status**: Ready for implementation
**Priority**: High (User-blocking issue)
**Complexity**: Medium (Well-defined solution path)
**Risk**: Low (Incremental approach with rollback points)