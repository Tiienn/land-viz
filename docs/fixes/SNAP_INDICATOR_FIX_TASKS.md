# Snap Indicator Fix - Task Breakdown

## Prerequisites Checklist

### Environment Setup
- [ ] Development server running: `cd app && npm run dev`
- [ ] Browser at http://localhost:5173
- [ ] Git status clean (current changes committed/stashed)
- [ ] TypeScript compiler running without errors

### Current State Validation
- [ ] Rectangle tool activates in 2D mode
- [ ] Green diamond indicators appear everywhere (confirming issue)
- [ ] No console errors in browser developer tools
- [ ] Performance baseline: Check FPS counter in development

---

## Phase 1: Critical Radius Fix

### Task 1.1: Fix SnapGrid Radius Mismatch
**File:** `app/src/utils/SnapGrid.ts`
**Estimated Time:** 15 minutes
**Priority:** CRITICAL

**Subtasks:**
- [ ] Read current SnapGrid.ts implementation
- [ ] Locate `addNearbyGridPoints` method (line ~106)
- [ ] Change radius calculation
- [ ] Verify no TypeScript errors

**Code Change:**
```typescript
// In addNearbyGridPoints method around line 106
// BEFORE:
const searchRadius = Math.max(this.snapDistance, 2.0);

// AFTER:
const searchRadius = this.snapDistance;
```

**Validation:**
- [ ] TypeScript compiles without errors
- [ ] No runtime console errors
- [ ] Development server hot-reloads successfully

### Task 1.2: Test Critical Fix
**Estimated Time:** 15 minutes

**Test Steps:**
- [ ] Open Rectangle drawing tool in 2D mode
- [ ] Move cursor around grid area
- [ ] Verify green diamonds only appear very close to grid intersections
- [ ] Test with different zoom levels
- [ ] Check performance (should maintain 60fps)

**Expected Results:**
- [ ] 80% reduction in false positive indicators
- [ ] Indicators only show when cursor is within 0.5m of grid points
- [ ] No performance degradation
- [ ] Other snap types still functional

**Rollback Plan:**
```typescript
// If issues occur, revert to:
const searchRadius = Math.max(this.snapDistance, 2.0);
```

---

## Phase 2: Render-Time Proximity Validation

### Task 2.1: Add Cursor Position Tracking
**File:** `app/src/store/useAppStore.ts`
**Estimated Time:** 20 minutes

**Subtasks:**
- [ ] Read current store structure
- [ ] Add cursorPosition to drawing state
- [ ] Create cursor position setter action
- [ ] Verify TypeScript types

**Code Addition:**
```typescript
// In drawing state interface (around line 50)
interface DrawingState {
  // ... existing properties
  cursorPosition: Point2D | null;
}

// In store actions (around line 200)
setCursorPosition: (position: Point2D | null) => void;

// In store implementation
setCursorPosition: (position) => {
  set((state) => ({
    drawing: {
      ...state.drawing,
      cursorPosition: position
    }
  }));
},
```

**Validation:**
- [ ] TypeScript compiles
- [ ] Store exports new action
- [ ] No runtime errors

### Task 2.2: Update DrawingCanvas to Track Cursor
**File:** `app/src/components/Scene/DrawingCanvas.tsx`
**Estimated Time:** 25 minutes

**Subtasks:**
- [ ] Import setCursorPosition from store
- [ ] Update handlePointerMove to track cursor
- [ ] Add cursor clearing on pointer leave
- [ ] Test cursor position updates

**Code Changes:**
```typescript
// Import the new action
const { setCursorPosition } = useAppStore();

// In handlePointerMove method (around line 120)
const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
  // ... existing code ...

  // Update cursor position in store
  setCursorPosition(worldPos2D);

  // ... rest of existing logic
}, [setCursorPosition, /* other dependencies */]);

// In handlePointerLeave method
const handlePointerLeave = useCallback(() => {
  setCursorPosition(null);
  // ... existing cleanup
}, [setCursorPosition]);
```

**Validation:**
- [ ] Cursor position updates in React DevTools
- [ ] Position clears when leaving canvas
- [ ] No performance impact on mouse movement

### Task 2.3: Implement Render-Time Filtering
**File:** `app/src/components/Scene/SnapIndicator.tsx`
**Estimated Time:** 30 minutes

**Subtasks:**
- [ ] Import cursor position from store
- [ ] Create proximity validation function
- [ ] Apply filtering to snap points
- [ ] Test with various cursor positions

**Code Implementation:**
```typescript
// Import from store
const { drawing } = useAppStore();
const cursorPosition = drawing.cursorPosition;

// Create validation function
const validateSnapPointProximity = useCallback((snapPoint: SnapPoint, cursor: Point2D, radius: number): boolean => {
  const distance = Math.sqrt(
    Math.pow(cursor.x - snapPoint.position.x, 2) +
    Math.pow(cursor.y - snapPoint.position.y, 2)
  );
  return distance <= radius;
}, []);

// Filter snap points
const validSnapPoints = useMemo(() => {
  if (!snapping.availableSnapPoints || !cursorPosition) {
    return [];
  }

  const snapRadius = is2DMode ? 0.5 : 1.5;

  return snapping.availableSnapPoints.filter(point =>
    validateSnapPointProximity(point, cursorPosition, snapRadius)
  );
}, [snapping.availableSnapPoints, cursorPosition, is2DMode, validateSnapPointProximity]);

// Use validSnapPoints instead of limitedSnapPoints
const limitedSnapPoints = useMemo(() => {
  return validSnapPoints.slice(0, maxVisibleIndicators);
}, [validSnapPoints, maxVisibleIndicators]);
```

**Validation:**
- [ ] Indicators only render when cursor is actually close
- [ ] Different behavior in 2D vs 3D mode
- [ ] Smooth filtering as cursor moves
- [ ] No performance issues

### Task 2.4: Create Snap Validation Hook
**File:** `app/src/hooks/useSnapValidation.ts`
**Estimated Time:** 20 minutes

**Subtasks:**
- [ ] Create new hook file
- [ ] Extract validation logic
- [ ] Add comprehensive distance calculations
- [ ] Export for reuse

**Hook Implementation:**
```typescript
import { useMemo, useCallback } from 'react';
import type { SnapPoint, Point2D } from '../types';

interface UseSnapValidationProps {
  snapPoints: SnapPoint[];
  cursorPosition: Point2D | null;
  snapRadius: number;
  maxPoints?: number;
}

export const useSnapValidation = ({
  snapPoints,
  cursorPosition,
  snapRadius,
  maxPoints = 25
}: UseSnapValidationProps) => {

  const validateProximity = useCallback((point: SnapPoint, cursor: Point2D): boolean => {
    const distance = Math.sqrt(
      Math.pow(cursor.x - point.position.x, 2) +
      Math.pow(cursor.y - point.position.y, 2)
    );
    return distance <= snapRadius;
  }, [snapRadius]);

  const validSnapPoints = useMemo(() => {
    if (!snapPoints || !cursorPosition) return [];

    return snapPoints
      .filter(point => validateProximity(point, cursorPosition))
      .slice(0, maxPoints);
  }, [snapPoints, cursorPosition, validateProximity, maxPoints]);

  return {
    validSnapPoints,
    validateProximity,
    hasValidPoints: validSnapPoints.length > 0
  };
};
```

**Validation:**
- [ ] Hook compiles without errors
- [ ] Reusable across components
- [ ] Proper memoization for performance

---

## Phase 3: Smart Grid Generation

### Task 3.1: Enhance Grid Intersection Logic
**File:** `app/src/utils/SnapGrid.ts`
**Estimated Time:** 25 minutes

**Subtasks:**
- [ ] Add strict proximity check in addNearbyGridPoints
- [ ] Implement shouldGenerateGridPoint function
- [ ] Optimize grid generation loop
- [ ] Add performance throttling

**Code Enhancement:**
```typescript
// Add helper function before addNearbyGridPoints
private shouldGenerateGridPoint(gridX: number, gridY: number, cursorPos: Point2D, snapRadius: number): boolean {
  const distance = Math.sqrt(
    Math.pow(cursorPos.x - gridX, 2) +
    Math.pow(cursorPos.y - gridY, 2)
  );
  return distance <= snapRadius;
}

// Enhanced addNearbyGridPoints method
private addNearbyGridPoints(snapPoints: SnapPoint[], cursorPosition: Point2D): void {
  // Use actual snap distance instead of fixed radius
  const searchRadius = this.snapDistance;

  const minX = Math.floor(cursorPosition.x - searchRadius);
  const maxX = Math.ceil(cursorPosition.x + searchRadius);
  const minY = Math.floor(cursorPosition.y - searchRadius);
  const maxY = Math.ceil(cursorPosition.y + searchRadius);

  for (let gridX = minX; gridX <= maxX; gridX++) {
    for (let gridY = minY; gridY <= maxY; gridY++) {
      // Only generate if actually close enough
      if (!this.shouldGenerateGridPoint(gridX, gridY, cursorPosition, searchRadius)) {
        continue;
      }

      // Check for existing grid point to avoid duplicates
      const existingGridPoint = snapPoints.find(
        sp => sp.type === 'grid' &&
        Math.abs(sp.position.x - gridX) < 0.001 &&
        Math.abs(sp.position.y - gridY) < 0.001
      );

      if (!existingGridPoint) {
        snapPoints.push({
          id: `grid_${gridX}_${gridY}`,
          position: { x: gridX, y: gridY },
          type: 'grid',
          strength: 0.4,
          shapeId: 'grid',
          metadata: { description: `Grid point (${gridX}, ${gridY})` }
        });
      }
    }
  }
}
```

**Validation:**
- [ ] Fewer grid points generated
- [ ] Only points within actual snap distance
- [ ] No duplicate grid points
- [ ] Performance improvement

### Task 3.2: Add Performance Throttling
**File:** `app/src/utils/SnapGrid.ts`
**Estimated Time:** 15 minutes

**Subtasks:**
- [ ] Add throttling to updateSnapPoints
- [ ] Implement 60fps limit
- [ ] Add performance monitoring
- [ ] Test with rapid mouse movement

**Code Addition:**
```typescript
// Add at class level
private lastUpdateTime = 0;
private readonly UPDATE_INTERVAL = 16; // ~60fps

// Modify updateSnapPoints method
updateSnapPoints(shapes: Shape[], cursorPosition?: Point2D): void {
  // Throttle updates to 60fps
  const now = performance.now();
  if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
    return;
  }
  this.lastUpdateTime = now;

  // ... existing implementation
}
```

**Validation:**
- [ ] Smooth performance during rapid mouse movement
- [ ] 60fps maintained
- [ ] No visual lag in indicators

### Task 3.3: Implement Grid Caching
**File:** `app/src/utils/SnapGrid.ts`
**Estimated Time:** 20 minutes

**Subtasks:**
- [ ] Add grid region caching
- [ ] Implement cache invalidation
- [ ] Add memory management
- [ ] Test cache effectiveness

**Caching Implementation:**
```typescript
// Add at class level
private gridCache = new Map<string, SnapPoint[]>();
private readonly CACHE_SIZE_LIMIT = 100;

// Add cache key generation
private getGridCacheKey(cursorPosition: Point2D, radius: number): string {
  const cellX = Math.floor(cursorPosition.x / radius);
  const cellY = Math.floor(cursorPosition.y / radius);
  return `${cellX}_${cellY}_${radius}`;
}

// Modify addNearbyGridPoints to use cache
private addNearbyGridPoints(snapPoints: SnapPoint[], cursorPosition: Point2D): void {
  const cacheKey = this.getGridCacheKey(cursorPosition, this.snapDistance);

  // Check cache first
  if (this.gridCache.has(cacheKey)) {
    const cachedPoints = this.gridCache.get(cacheKey)!;
    snapPoints.push(...cachedPoints);
    return;
  }

  // Generate new points
  const gridPoints: SnapPoint[] = [];
  // ... existing generation logic, but push to gridPoints array

  // Cache the results
  this.gridCache.set(cacheKey, gridPoints);

  // Limit cache size
  if (this.gridCache.size > this.CACHE_SIZE_LIMIT) {
    const firstKey = this.gridCache.keys().next().value;
    this.gridCache.delete(firstKey);
  }

  snapPoints.push(...gridPoints);
}
```

**Validation:**
- [ ] Cache hits improve performance
- [ ] Memory usage stays reasonable
- [ ] Cache invalidation works correctly

---

## Phase 4: State Management Enhancement

### Task 4.1: Enhanced State Cleanup
**File:** `app/src/components/Scene/DrawingCanvas.tsx`
**Estimated Time:** 20 minutes

**Subtasks:**
- [ ] Improve handlePointerLeave cleanup
- [ ] Add tool switching cleanup
- [ ] Clear snap state on tool change
- [ ] Test state consistency

**Cleanup Enhancement:**
```typescript
// Enhanced handlePointerLeave
const handlePointerLeave = useCallback(() => {
  setCursorPosition(null);

  // Clear all snap state
  setSnapping(prev => ({
    ...prev,
    availableSnapPoints: [],
    activeSnapPoint: null,
    isSnapping: false
  }));

  // Clear any preview state
  if (drawing.isDrawing && drawing.currentShape) {
    // Keep current shape but clear preview
    updateDrawing({ previewPoints: [] });
  }
}, [setCursorPosition, setSnapping, updateDrawing, drawing.isDrawing, drawing.currentShape]);

// Add cleanup on tool change
useEffect(() => {
  // Clean up snap state when tool changes
  setSnapping(prev => ({
    ...prev,
    availableSnapPoints: [],
    activeSnapPoint: null,
    isSnapping: false
  }));
  setCursorPosition(null);
}, [drawing.activeTool, setSnapping, setCursorPosition]);
```

**Validation:**
- [ ] Clean state transitions between tools
- [ ] No orphaned snap indicators
- [ ] Consistent behavior on canvas leave

### Task 4.2: Debug Mode Implementation
**File:** `app/src/utils/snapDebug.ts`
**Estimated Time:** 25 minutes

**Subtasks:**
- [ ] Create debug utility module
- [ ] Add snap detection logging
- [ ] Create visual debug overlay
- [ ] Add performance metrics

**Debug Utilities:**
```typescript
interface SnapDebugInfo {
  snapPointsGenerated: number;
  snapPointsFiltered: number;
  cursorPosition: Point2D | null;
  activeSnapPoint: SnapPoint | null;
  performanceMetrics: {
    updateTime: number;
    renderTime: number;
    cacheHits: number;
  };
}

export class SnapDebugger {
  private static instance: SnapDebugger;
  private debugMode = false;
  private metrics: SnapDebugInfo = {
    snapPointsGenerated: 0,
    snapPointsFiltered: 0,
    cursorPosition: null,
    activeSnapPoint: null,
    performanceMetrics: {
      updateTime: 0,
      renderTime: 0,
      cacheHits: 0
    }
  };

  static getInstance(): SnapDebugger {
    if (!SnapDebugger.instance) {
      SnapDebugger.instance = new SnapDebugger();
    }
    return SnapDebugger.instance;
  }

  enable(): void {
    this.debugMode = true;
    console.log('Snap Debug Mode: ENABLED');
  }

  disable(): void {
    this.debugMode = false;
    console.log('Snap Debug Mode: DISABLED');
  }

  logSnapDetection(info: Partial<SnapDebugInfo>): void {
    if (!this.debugMode) return;

    this.metrics = { ...this.metrics, ...info };
    console.log('Snap Detection:', this.metrics);
  }

  getMetrics(): SnapDebugInfo {
    return { ...this.metrics };
  }
}

// Global debug access
(window as any).snapDebug = SnapDebugger.getInstance();
```

**Validation:**
- [ ] Debug mode toggleable from console
- [ ] Useful logging information
- [ ] Performance metrics tracking

### Task 4.3: Enhanced Tool Switching Logic
**File:** `app/src/store/useAppStore.ts`
**Estimated Time:** 15 minutes

**Subtasks:**
- [ ] Add proper cleanup in setActiveTool
- [ ] Clear drawing state on tool change
- [ ] Reset snap configuration
- [ ] Test tool switching

**Enhanced Tool Switching:**
```typescript
// In setActiveTool action
setActiveTool: (tool: DrawingTool) => {
  set((state) => {
    // Clear drawing state when switching tools
    const newDrawingState = {
      ...state.drawing,
      activeTool: tool,
      isDrawing: false,
      currentShape: null,
      previewPoints: [],
      cursorPosition: null,
      snapping: {
        ...state.drawing.snapping,
        availableSnapPoints: [],
        activeSnapPoint: null,
        isSnapping: false,
        // Auto-configure snap types based on tool
        config: {
          ...state.drawing.snapping.config,
          activeTypes: new Set(getDefaultSnapTypesForTool(tool))
        }
      }
    };

    return {
      ...state,
      drawing: newDrawingState
    };
  });
},

// Helper function
const getDefaultSnapTypesForTool = (tool: DrawingTool): SnapType[] => {
  switch (tool) {
    case 'rectangle':
      return ['grid', 'endpoint', 'midpoint', 'center'];
    case 'circle':
      return ['grid', 'endpoint', 'center'];
    case 'polyline':
      return ['grid', 'endpoint', 'midpoint'];
    default:
      return ['grid'];
  }
};
```

**Validation:**
- [ ] Clean tool switching
- [ ] Appropriate snap types auto-configured
- [ ] No state corruption

---

## Integration Testing

### Test Scenario 1: Rectangle Drawing in 2D Mode
**Estimated Time:** 15 minutes

**Steps:**
- [ ] Switch to 2D mode
- [ ] Select Rectangle tool
- [ ] Move cursor around empty space
- [ ] Move cursor near grid intersections
- [ ] Draw a rectangle
- [ ] Move cursor near rectangle corners/center

**Expected Behavior:**
- [ ] No indicators in empty space
- [ ] Green diamonds only near grid intersections (within 0.5m)
- [ ] Blue circles at rectangle endpoints
- [ ] Orange indicators at midpoints
- [ ] Green cross at rectangle center

### Test Scenario 2: Tool Switching
**Estimated Time:** 10 minutes

**Steps:**
- [ ] Start with Rectangle tool
- [ ] Switch to Circle tool
- [ ] Switch to Polyline tool
- [ ] Switch back to Rectangle tool

**Expected Behavior:**
- [ ] Clean transitions between tools
- [ ] No orphaned indicators
- [ ] Appropriate snap types for each tool
- [ ] No console errors

### Test Scenario 3: Performance Validation
**Estimated Time:** 10 minutes

**Steps:**
- [ ] Enable FPS counter
- [ ] Rapid mouse movement in drawing mode
- [ ] Draw multiple shapes
- [ ] Switch between 2D/3D modes

**Expected Behavior:**
- [ ] Maintain 60fps during all operations
- [ ] Smooth indicator updates
- [ ] No memory leaks
- [ ] Responsive interaction

---

## Final Validation Checklist

### Functional Requirements
- [ ] Green diamonds only appear when cursor is actually near snap points
- [ ] Consistent behavior between 2D and 3D modes
- [ ] All snap types work correctly (grid, endpoint, midpoint, center)
- [ ] Professional CAD-like snap behavior
- [ ] Clean tool switching with proper state cleanup

### Performance Requirements
- [ ] Maintain 60fps during drawing operations
- [ ] No memory leaks in snap detection system
- [ ] Smooth cursor interaction without lag
- [ ] Efficient grid point generation and caching

### Code Quality Requirements
- [ ] TypeScript compiles without errors
- [ ] No runtime console errors
- [ ] Clean, readable code with proper types
- [ ] Comprehensive error handling
- [ ] Proper component lifecycle management

### User Experience Requirements
- [ ] Predictable snap behavior matching CAD software
- [ ] Clear visual feedback only when snapping available
- [ ] Reduced visual noise during drawing operations
- [ ] Responsive and intuitive interaction

---

## Quick Test Commands

```bash
# Development
cd app && npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test:all

# Performance testing
npm run test:performance
```

## Debug Commands

```javascript
// In browser console

// Enable snap debugging
snapDebug.enable()

// Disable snap debugging
snapDebug.disable()

// Get performance metrics
snapDebug.getMetrics()

// Check store state
window.__ZUSTAND_STORE__?.getState()
```

---

**Total Estimated Time**: ~4 hours
**Ready for Implementation**: ✅
**Next Step**: Start with Task 1.1 (Critical Radius Fix)