# Implementation Plan: Shape Flip Operation

**Spec ID**: 014
**Feature Name**: Shape Flip (Horizontal & Vertical)
**Plan Version**: 1.0
**Created**: 2025-01-12

---

## Technical Overview

This plan outlines the implementation of horizontal and vertical flip operations for shapes in the Land Visualizer. The feature uses geometric transformation algorithms to mirror shape points across vertical/horizontal axes passing through each shape's center.

---

## Architecture Design

### High-Level Data Flow

```
User Input (Button/Menu/Keyboard)
    ↓
Action Dispatch: flipShapes(shapeIds[], direction)
    ↓
For each shape:
  ┌─────────────────────────────────────┐
  │ 1. Calculate bounding box center    │
  │ 2. Mirror points across axis        │
  │ 3. Create updated shape object      │
  │ 4. Preserve rotation metadata       │
  └─────────────────────────────────────┘
    ↓
Update state.shapes array
    ↓
Add action to undo history
    ↓
Trigger render (renderTrigger++)
    ↓
UI updates (ShapeRenderer re-renders)
```

### State Management Architecture

**Store**: `useAppStore.ts` (existing)

**New State**: None (operates on existing `shapes` array)

**New Actions**:
- `flipShapes(shapeIds: string[], direction: 'horizontal' | 'vertical')`
- `flipSelectedShapes(direction: 'horizontal' | 'vertical')` (convenience wrapper)

**State Updates**:
```typescript
// Before flip
state.shapes = [
  { id: 'A', points: [{x:0,y:0}, {x:10,y:0}, {x:10,y:10}, {x:0,y:10}], ... }
]

// After horizontal flip (assuming center at x=5)
state.shapes = [
  { id: 'A', points: [{x:10,y:0}, {x:0,y:0}, {x:0,y:10}, {x:10,y:10}], modified: new Date(), ... }
]
```

---

## Component Breakdown

### 1. Utility Module: `flipUtils.ts`

**Location**: `app/src/utils/flipUtils.ts`

**Purpose**: Pure functions for geometric calculations

**Functions**:

```typescript
// Calculate bounding box and center
export const calculateBoundingBox = (
  points: Point2D[]
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
} => { ... }

// Horizontal flip: mirror across vertical axis
export const flipPointsHorizontally = (
  points: Point2D[]
): Point2D[] => {
  const { centerX } = calculateBoundingBox(points);
  return points.map(p => ({
    x: 2 * centerX - p.x,  // Mirror formula
    y: p.y                  // Y unchanged
  }));
}

// Vertical flip: mirror across horizontal axis
export const flipPointsVertically = (
  points: Point2D[]
): Point2D[] => {
  const { centerY } = calculateBoundingBox(points);
  return points.map(p => ({
    x: p.x,                 // X unchanged
    y: 2 * centerY - p.y    // Mirror formula
  }));
}
```

**Algorithm Details**:

**Horizontal Flip** (Mirror across vertical axis):
```
Given point P(x, y) and center C(cx, cy):
- New X = 2 * cx - x  (reflect across vertical line x = cx)
- New Y = y           (unchanged)
```

**Vertical Flip** (Mirror across horizontal axis):
```
Given point P(x, y) and center C(cx, cy):
- New X = x           (unchanged)
- New Y = 2 * cy - y  (reflect across horizontal line y = cy)
```

**Edge Cases**:
- Empty array → return as-is
- Single point → stays at same position (flip has no effect)
- Two points → both flip correctly

**Time Complexity**: O(n) where n = number of points
**Space Complexity**: O(n) for new array

---

### 2. Store Actions: `useAppStore.ts`

**Location**: `app/src/store/useAppStore.ts`

**New Actions**:

```typescript
// Main flip action
flipShapes: (shapeIds: string[], direction: 'horizontal' | 'vertical') => {
  set((state) => {
    const updatedShapes = state.shapes.map(shape => {
      if (!shapeIds.includes(shape.id)) return shape;
      if (shape.locked) return shape; // Skip locked shapes

      // Calculate flipped points
      const flippedPoints = direction === 'horizontal'
        ? flipPointsHorizontally(shape.points)
        : flipPointsVertically(shape.points);

      return {
        ...shape,
        points: flippedPoints,
        modified: new Date()
      };
    });

    // Add to undo history
    const historyEntry: HistoryEntry = {
      type: 'flip',
      action: direction === 'horizontal' ? 'Flip Horizontal' : 'Flip Vertical',
      shapeIds,
      before: state.shapes.filter(s => shapeIds.includes(s.id)),
      after: updatedShapes.filter(s => shapeIds.includes(s.id)),
      timestamp: new Date()
    };

    return {
      shapes: updatedShapes,
      history: [...state.history, historyEntry],
      historyIndex: state.historyIndex + 1,
      renderTrigger: state.renderTrigger + 1
    };
  });
}

// Convenience wrapper for selected shapes
flipSelectedShapes: (direction: 'horizontal' | 'vertical') => {
  const { selectedShapeIds, flipShapes } = get();
  if (selectedShapeIds.length > 0) {
    flipShapes(selectedShapeIds, direction);
  }
}
```

**Undo/Redo Integration**:
- Each flip creates a history entry
- Undo: Restore `before` state
- Redo: Apply `after` state
- History shows: "Flip Horizontal" or "Flip Vertical"

---

### 3. UI Component: `FlipButton.tsx`

**Location**: `app/src/components/UI/FlipButton.tsx`

**Component Structure**:

```typescript
interface FlipButtonProps {
  disabled: boolean;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
}

export const FlipButton: React.FC<FlipButtonProps> = ({ disabled, onFlip }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Main button */}
      <button
        disabled={disabled}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          padding: '8px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          backgroundColor: disabled ? '#F3F4F6' : '#FFFFFF',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: disabled ? 0.5 : 1
        }}
        title="Flip shapes"
      >
        <FlipHorizontalIcon size={20} />
        <span>Flip</span>
        <ChevronDownIcon size={16} />
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '200px'
        }}>
          {/* Horizontal option */}
          <button
            onClick={() => {
              onFlip('horizontal');
              setDropdownOpen(false);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlipHorizontalIcon size={18} />
              <span>Flip Horizontally</span>
            </div>
            <span style={{ color: '#6B7280', fontSize: '12px' }}>Shift+H</span>
          </button>

          {/* Vertical option */}
          <button
            onClick={() => {
              onFlip('vertical');
              setDropdownOpen(false);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlipVerticalIcon size={18} />
              <span>Flip Vertically</span>
            </div>
            <span style={{ color: '#6B7280', fontSize: '12px' }}>Shift+V</span>
          </button>
        </div>
      )}
    </div>
  );
};
```

**Icon Components**:

```typescript
// FlipHorizontalIcon.tsx
export const FlipHorizontalIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
    <path d="M12 20v2" />
    <path d="M12 14v2" />
    <path d="M12 8v2" />
    <path d="M12 2v2" />
  </svg>
);

// FlipVerticalIcon.tsx
export const FlipVerticalIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
    <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
    <path d="M4 12H2" />
    <path d="M10 12H8" />
    <path d="M16 12h-2" />
    <path d="M22 12h-2" />
  </svg>
);
```

**Dropdown Behavior**:
- Click outside → close
- ESC key → close
- Select option → execute and close
- 200ms fade-in animation

---

### 4. Keyboard Shortcuts Integration

**Location**: `app/src/hooks/useKeyboardShortcuts.ts`

**Add to shortcuts array**:

```typescript
{
  key: 'Shift+H',
  description: 'Flip Horizontally',
  category: 'Edit',
  handler: () => {
    const { selectedShapeIds, flipSelectedShapes } = useAppStore.getState();
    if (selectedShapeIds.length > 0) {
      flipSelectedShapes('horizontal');
    }
  }
},
{
  key: 'Shift+V',
  description: 'Flip Vertically',
  category: 'Edit',
  handler: () => {
    const { selectedShapeIds, flipSelectedShapes } = useAppStore.getState();
    if (selectedShapeIds.length > 0) {
      flipSelectedShapes('vertical');
    }
  }
}
```

**Event Handler**:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.shiftKey && e.key === 'H') {
      e.preventDefault();
      flipSelectedShapes('horizontal');
    }
    if (e.shiftKey && e.key === 'V') {
      e.preventDefault();
      flipSelectedShapes('vertical');
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

### 5. Context Menu Integration

**Location**: `app/src/components/ContextMenu/ContextMenu.tsx`

**Add to menu items**:

```typescript
// In shape menu and multi-selection menu
{
  label: 'Flip Horizontally',
  icon: <FlipHorizontalIcon size={16} />,
  shortcut: 'Shift+H',
  action: () => flipSelectedShapes('horizontal'),
  separator: false
},
{
  label: 'Flip Vertically',
  icon: <FlipVerticalIcon size={16} />,
  shortcut: 'Shift+V',
  action: () => flipSelectedShapes('vertical'),
  separator: true  // Add separator after flip options
}
```

**Menu Structure**:
```
Cut                 Ctrl+X
Copy                Ctrl+C
Paste               Ctrl+V
─────────────────────────
Flip Horizontally   Shift+H  ← NEW
Flip Vertically     Shift+V  ← NEW
─────────────────────────
Duplicate           Ctrl+D
Delete              Delete
```

---

### 6. Toolbar Integration

**Location**: `app/src/App.tsx`

**Add button to toolbar**:

```typescript
// In the Edit section, after Rotate button
<FlipButton
  disabled={selectedShapeIds.length === 0}
  onFlip={(direction) => flipSelectedShapes(direction)}
/>
```

**Toolbar Order**:
```
[Select] [Rectangle] [Circle] [Polyline] [Line] | [Edit] [Resize] [Rotate] [Flip] | [Measure]
```

---

## Testing Strategy

### Unit Tests: `flipUtils.test.ts`

```typescript
describe('flipUtils', () => {
  describe('calculateBoundingBox', () => {
    it('should calculate center correctly', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      const bbox = calculateBoundingBox(points);
      expect(bbox.centerX).toBe(5);
      expect(bbox.centerY).toBe(5);
    });

    it('should handle single point', () => {
      const points = [{ x: 5, y: 7 }];
      const bbox = calculateBoundingBox(points);
      expect(bbox.centerX).toBe(5);
      expect(bbox.centerY).toBe(7);
    });
  });

  describe('flipPointsHorizontally', () => {
    it('should mirror points across vertical axis', () => {
      const points = [
        { x: 0, y: 5 },
        { x: 10, y: 5 }
      ];
      const flipped = flipPointsHorizontally(points);
      expect(flipped).toEqual([
        { x: 10, y: 5 },  // 2*5 - 0 = 10
        { x: 0, y: 5 }    // 2*5 - 10 = 0
      ]);
    });
  });

  describe('flipPointsVertically', () => {
    it('should mirror points across horizontal axis', () => {
      const points = [
        { x: 5, y: 0 },
        { x: 5, y: 10 }
      ];
      const flipped = flipPointsVertically(points);
      expect(flipped).toEqual([
        { x: 5, y: 10 },  // 2*5 - 0 = 10
        { x: 5, y: 0 }    // 2*5 - 10 = 0
      ]);
    });
  });
});
```

### Integration Tests: `flipFeature.test.tsx`

```typescript
describe('Flip Feature Integration', () => {
  it('should flip shape via toolbar button', () => {
    render(<App />);

    // Create rectangle
    // Select rectangle
    // Click Flip button
    // Click "Flip Horizontally"
    // Assert points flipped
  });

  it('should flip via keyboard shortcut', () => {
    render(<App />);

    // Create and select shape
    fireEvent.keyDown(window, { key: 'H', shiftKey: true });
    // Assert points flipped
  });

  it('should support undo/redo', () => {
    const { result } = renderHook(() => useAppStore());

    // Create shape
    // Flip shape
    // Undo
    // Assert original points restored
    // Redo
    // Assert flipped points reapplied
  });
});
```

---

## Performance Considerations

### Optimization Strategies

1. **Batch Updates**: Single state update for multiple shapes
2. **Pure Functions**: No side effects in flip calculations
3. **Memoization**: Not needed (operations are fast)
4. **Render Optimization**: Existing `renderTrigger` system

### Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Single shape flip | < 50ms | Imperceptible to user |
| 10 shapes flip | < 100ms | Smooth interaction |
| 50 shapes flip | < 200ms | Acceptable latency |
| 100 shapes flip | < 500ms | Edge case |

### Benchmarking

```typescript
// Performance test
console.time('flip-100-shapes');
flipShapes(shapeIds, 'horizontal');
console.timeEnd('flip-100-shapes');
// Expected: < 500ms
```

---

## Security Considerations

### Input Validation

```typescript
// Validate shape IDs
const validShapeIds = shapeIds.filter(id =>
  typeof id === 'string' && shapes.some(s => s.id === id)
);

// Validate direction
if (direction !== 'horizontal' && direction !== 'vertical') {
  logger.error('[Flip] Invalid direction:', direction);
  return;
}

// Validate points
if (!Array.isArray(shape.points)) {
  logger.error('[Flip] Invalid points array:', shape.points);
  return;
}
```

### Safe Transformations

- Preserve shape type
- Preserve rotation metadata
- Preserve layer assignment
- Preserve locked status

---

## Constitution Compliance Checklist

- [x] **Article 1**: Inline styles only (FlipButton uses inline styles)
- [x] **Article 2**: TypeScript strict mode (all new code typed)
- [x] **Article 3**: Zustand state management (actions in useAppStore)
- [x] **Article 4**: React best practices (functional components, hooks)
- [x] **Article 5**: 3D rendering (ShapeRenderer handles updates)
- [x] **Article 6**: 70% test coverage (unit + integration tests)
- [x] **Article 7**: Security first (input validation, safe transforms)
- [x] **Article 8**: Edit existing files (modify useAppStore, not create new store)
- [x] **Article 9**: Professional UX (Canva-inspired dropdown design)

---

## Rollout Plan

### Phase 1: Core Implementation (2 hours)
- Create `flipUtils.ts`
- Add store actions
- Unit tests

### Phase 2: UI Components (2 hours)
- Create `FlipButton.tsx`
- Create icon components
- Toolbar integration

### Phase 3: Integration (1.5 hours)
- Keyboard shortcuts
- Context menu
- Integration tests

### Phase 4: Polish & Testing (1.5 hours)
- Edge case testing
- Performance testing
- Documentation

**Total**: 7 hours

---

## Rollback Plan

If critical issues arise:

1. **Remove toolbar button** from `App.tsx`
2. **Comment out keyboard shortcuts** in `useKeyboardShortcuts.ts`
3. **Remove context menu items** from `ContextMenu.tsx`
4. **Keep flip utilities** (harmless if unused)
5. **Revert store changes** if undo/redo issues

Feature can be completely removed in < 15 minutes.

---

## Future Enhancements (Out of Scope)

1. **Flip Preview Mode**: Show dotted outline before applying
2. **Flip Around Custom Point**: User-selectable pivot point
3. **Flip Group as Unit**: Flip entire group around group center
4. **Flip Animation**: 200ms flip transition effect
5. **Flip Constraints**: Snap to grid after flip
6. **3D Flip**: Flip in Z-axis for 3D shapes

---

## Related Documents

- `/specs/014-flip-feature/spec.md` - Feature specification
- `/specs/014-flip-feature/tasks.md` - Detailed task breakdown
- `/docs/project/CLAUDE.md` - Project constitution
