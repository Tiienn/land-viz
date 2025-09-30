# Implementation Plan: Cursor-Based Rotation Mode

**Spec**: 003-cursor-rotation-mode
**Created**: 2025-10-01
**Estimated Effort**: 6-8 hours

## Technical Approach

### Architecture Decision

**Decision**: Extend existing RotationControls.tsx with cursor-based mode logic, reusing rotation infrastructure.

**Rationale**:
- Existing rotation handle, angle calculation, and history management can be reused
- Keeps rotation logic centralized in one component
- Avoids duplication of raycasting and pointer event handling
- Maintains compatibility with drag-to-rotate feature

**Alternatives Considered**:
1. **Create separate CursorRotationMode component**: Would duplicate logic, harder to maintain
2. **Implement in DrawingCanvas.tsx**: Wrong separation of concerns, rotation is a shape operation

### State Management

#### New Store State (useAppStore.ts)

```typescript
// Add to store state
interface AppStore {
  // ... existing state ...

  // New cursor rotation mode state
  cursorRotationMode: boolean;
  cursorRotationShapeId: string | null;

  // New actions
  enterCursorRotationMode: (shapeId: string) => void;
  exitCursorRotationMode: () => void;
  applyCursorRotation: (shapeId: string, angle: number, center: Point2D) => void;
}
```

**Why**:
- `cursorRotationMode`: Global flag to track if mode is active
- `cursorRotationShapeId`: Which shape is being rotated in cursor mode
- Separate from existing drag-based rotation state to avoid conflicts

#### Component State (RotationControls.tsx)

```typescript
// New local state
const [cursorAngle, setCursorAngle] = useState(0);
const [showGuides, setShowGuides] = useState(false);
const cursorPositionRef = useRef<THREE.Vector2 | null>(null);
```

### Component Architecture

#### Modified Files

1. **`useAppStore.ts`** (Lines ~200-300, ~2800-2900)
   - Add cursor rotation mode state
   - Add enter/exit mode actions
   - Add apply cursor rotation action with history save

2. **`RotationControls.tsx`** (Lines ~50-400)
   - Add cursor rotation mode detection
   - Add pointermove handler for cursor tracking
   - Add click handler for rotation confirmation
   - Add visual guide rendering (line + angle display)
   - Preserve existing drag-to-rotate logic

3. **`App.tsx`** (Lines ~400-450, ribbon buttons)
   - Modify Rotate button onClick handler
   - Toggle cursor rotation mode on/off
   - Add visual active state for button

#### New Components

None - all functionality fits within existing components.

### Implementation Flow

#### 1. Mode Activation (Rotate Button Click)

```typescript
// In App.tsx - Rotate button handler
const handleRotateButtonClick = () => {
  const { selectedShapeIds, cursorRotationMode, enterCursorRotationMode, exitCursorRotationMode } = useAppStore.getState();

  if (cursorRotationMode) {
    // Exit cursor rotation mode
    exitCursorRotationMode();
  } else if (selectedShapeIds.length === 1) {
    // Enter cursor rotation mode
    enterCursorRotationMode(selectedShapeIds[0]);
  } else {
    // Show error tooltip
    console.warn('Select a single shape to use cursor rotation mode');
  }
};
```

#### 2. Cursor Tracking (RotationControls.tsx)

```typescript
// New effect to listen for cursor movement
useEffect(() => {
  if (!cursorRotationMode || !targetShape || !canvasRef.current) return;

  const handlePointerMove = (event: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert screen coords to normalized device coordinates
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find cursor position in world space
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const cursorPos = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, cursorPos);

    // Calculate rotation angle from shape center to cursor
    const shapeCenter = calculateRotationCenter(targetShape);
    const angle = Math.atan2(
      cursorPos.z - shapeCenter.y,
      cursorPos.x - shapeCenter.x
    );

    // Apply angle snapping if Shift is pressed
    let finalAngle = angle;
    if (shiftPressedRef.current) {
      const snapAngle = Math.PI / 4; // 45 degrees
      finalAngle = Math.round(angle / snapAngle) * snapAngle;
    }

    // Update angle and apply live rotation
    setCursorAngle(finalAngle);
    rotateShapeLive(targetShape.id, finalAngle, shapeCenter);

    // Store cursor position for guide line
    cursorPositionRef.current = new THREE.Vector2(cursorPos.x, cursorPos.z);
  };

  canvas.addEventListener('pointermove', handlePointerMove);
  return () => canvas.removeEventListener('pointermove', handlePointerMove);
}, [cursorRotationMode, targetShape, camera, canvasRef]);
```

#### 3. Click to Confirm (RotationControls.tsx)

```typescript
// New click handler for cursor rotation mode
useEffect(() => {
  if (!cursorRotationMode || !targetShape) return;

  const handleClick = (event: PointerEvent) => {
    // Ignore clicks on rotation handle itself
    if (dragState.current.isDragging) return;

    // Apply rotation with history save
    const shapeCenter = calculateRotationCenter(targetShape);
    applyCursorRotation(targetShape.id, cursorAngle, shapeCenter);
  };

  window.addEventListener('click', handleClick);
  return () => window.removeEventListener('click', handleClick);
}, [cursorRotationMode, targetShape, cursorAngle]);
```

#### 4. Mode Exit Handling

```typescript
// In useAppStore.ts
exitCursorRotationMode: () => {
  const state = get();

  // Commit final rotation to history if shape exists
  if (state.cursorRotationShapeId) {
    state.saveToHistory();
  }

  set({
    cursorRotationMode: false,
    cursorRotationShapeId: null,
  });
},

// In RotationControls.tsx - Listen for ESC key
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && cursorRotationMode) {
      exitCursorRotationMode();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [cursorRotationMode]);

// In App.tsx - Exit on tool/shape change
useEffect(() => {
  const { cursorRotationMode, exitCursorRotationMode } = useAppStore.getState();

  if (cursorRotationMode && (currentTool !== 'rotate' || selectedShapeIds.length !== 1)) {
    exitCursorRotationMode();
  }
}, [currentTool, selectedShapeIds]);
```

#### 5. Visual Guides (RotationControls.tsx JSX)

```tsx
{/* Cursor rotation mode guides */}
{cursorRotationMode && targetShape && cursorPositionRef.current && (
  <group>
    {/* Guide line from center to cursor */}
    <Line
      points={[
        [rotationHandlePosition.center.x, 0.1, rotationHandlePosition.center.y],
        [cursorPositionRef.current.x, 0.1, cursorPositionRef.current.y]
      ]}
      color="#9333EA"
      lineWidth={2}
      dashed
      dashSize={0.2}
      gapSize={0.1}
    />

    {/* Angle display at cursor */}
    <Html
      position={[cursorPositionRef.current.x, 0.5, cursorPositionRef.current.y]}
      center
    >
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none'
      }}>
        {Math.round((cursorAngle * 180 / Math.PI) % 360)}°
        {shiftPressedRef.current && ' (snapped)'}
      </div>
    </Html>

    {/* Snap indicator */}
    {shiftPressedRef.current && (
      <mesh position={[cursorPositionRef.current.x, 0.05, cursorPositionRef.current.y]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.5} />
      </mesh>
    )}
  </group>
)}
```

### Data Flow Diagram

```
User clicks Rotate button
  ↓
App.tsx: handleRotateButtonClick()
  ↓
useAppStore: enterCursorRotationMode(shapeId)
  ↓
RotationControls.tsx: Detects cursorRotationMode = true
  ↓
Adds pointermove listener
  ↓
User moves cursor
  ↓
handlePointerMove: Calculate angle from shape center
  ↓
Apply Shift snapping if needed
  ↓
rotateShapeLive: Update shape rotation (no history)
  ↓
Update visual guides (line + angle display)
  ↓
User clicks
  ↓
handleClick: applyCursorRotation()
  ↓
useAppStore: saveToHistory()
  ↓
User presses ESC or clicks Rotate button
  ↓
useAppStore: exitCursorRotationMode()
  ↓
Clean up listeners and guides
```

### Testing Strategy

#### Unit Tests

1. **Store Actions** (`useAppStore.test.ts`)
   ```typescript
   describe('Cursor Rotation Mode', () => {
     it('should enter cursor rotation mode', () => {
       const store = useAppStore.getState();
       store.enterCursorRotationMode('shape-1');
       expect(store.cursorRotationMode).toBe(true);
       expect(store.cursorRotationShapeId).toBe('shape-1');
     });

     it('should exit cursor rotation mode', () => {
       const store = useAppStore.getState();
       store.enterCursorRotationMode('shape-1');
       store.exitCursorRotationMode();
       expect(store.cursorRotationMode).toBe(false);
       expect(store.cursorRotationShapeId).toBe(null);
     });

     it('should save to history on apply cursor rotation', () => {
       const store = useAppStore.getState();
       const saveHistorySpy = vi.spyOn(store, 'saveToHistory');
       store.applyCursorRotation('shape-1', Math.PI / 4, { x: 5, y: 5 });
       expect(saveHistorySpy).toHaveBeenCalled();
     });
   });
   ```

2. **Angle Calculation** (`rotationUtils.test.ts`)
   ```typescript
   describe('Cursor Rotation Angle Calculation', () => {
     it('should calculate correct angle from center to cursor', () => {
       const center = { x: 0, y: 0 };
       const cursor = { x: 1, y: 1 };
       const angle = calculateAngle(center, cursor);
       expect(angle).toBeCloseTo(Math.PI / 4, 2); // 45 degrees
     });

     it('should snap angle to nearest 45 degrees', () => {
       const angle = Math.PI / 4 + 0.1; // 45° + small offset
       const snapped = snapAngle(angle, true);
       expect(snapped).toBe(Math.PI / 4);
     });
   });
   ```

#### Integration Tests

1. **Mode Activation** (`RotationControls.integration.test.tsx`)
   ```typescript
   it('should enter cursor rotation mode on button click', async () => {
     render(<TestScene />);
     const shape = await screen.findByTestId('shape-rectangle-1');
     fireEvent.click(shape); // Select shape

     const rotateButton = screen.getByRole('button', { name: /rotate/i });
     fireEvent.click(rotateButton);

     expect(useAppStore.getState().cursorRotationMode).toBe(true);
   });
   ```

2. **Rotation Application** (`RotationControls.integration.test.tsx`)
   ```typescript
   it('should rotate shape on cursor movement and click', async () => {
     render(<TestScene />);
     const canvas = screen.getByRole('canvas');

     // Enter cursor rotation mode
     useAppStore.getState().enterCursorRotationMode('shape-1');

     // Simulate cursor movement
     fireEvent.pointerMove(canvas, { clientX: 300, clientY: 200 });
     await waitFor(() => {
       const shape = useAppStore.getState().shapes[0];
       expect(shape.rotation?.angle).not.toBe(0);
     });

     // Click to confirm
     fireEvent.click(canvas);

     // Verify history saved
     expect(useAppStore.getState().history.length).toBeGreaterThan(1);
   });
   ```

3. **Mode Exit** (`RotationControls.integration.test.tsx`)
   ```typescript
   it('should exit cursor rotation mode on ESC', () => {
     useAppStore.getState().enterCursorRotationMode('shape-1');
     fireEvent.keyDown(window, { key: 'Escape' });
     expect(useAppStore.getState().cursorRotationMode).toBe(false);
   });
   ```

#### Performance Tests

1. **Rotation Performance** (`RotationControls.performance.test.ts`)
   ```typescript
   it('should maintain 60 FPS during cursor rotation', async () => {
     const store = useAppStore.getState();
     store.enterCursorRotationMode('shape-1');

     const startTime = performance.now();
     for (let i = 0; i < 100; i++) {
       store.rotateShapeLive('shape-1', i * 0.01, { x: 5, y: 5 });
     }
     const endTime = performance.now();

     const avgTime = (endTime - startTime) / 100;
     expect(avgTime).toBeLessThan(16); // 60 FPS = 16ms per frame
   });
   ```

### Performance Considerations

#### Throttling
```typescript
// Throttle cursor move events to 16ms (60 FPS)
const throttledHandlePointerMove = useCallback(
  throttle((event: PointerEvent) => {
    // ... rotation logic ...
  }, 16),
  [targetShape, cursorRotationMode]
);
```

#### Optimization Strategies
1. **Use refs for immediate access**: Avoid stale closures (learned from previous rotation fix)
2. **Debounce angle display updates**: Only update text when angle changes significantly
3. **Limit raycasting**: Only raycast when cursor moves, not on every frame
4. **Reuse rotation calculations**: Share logic with drag-to-rotate feature

### Security Considerations

- **Input Validation**: Validate angle values are within -2π to 2π
- **Pointer Lock**: Prevent pointer events from triggering outside canvas
- **State Consistency**: Ensure mode always exits cleanly to prevent lock-up

### Compatibility

#### Browser Support
- **Pointer Events**: Supported in all modern browsers
- **Three.js Raycasting**: No compatibility issues
- **Performance**: 60 FPS on devices with GPU acceleration

#### Existing Features
- **No Breaking Changes**: Drag-to-rotate works exactly as before
- **Tool Switching**: Clean exit when switching tools
- **Undo/Redo**: Full compatibility with history system

### Risk Assessment

#### High Risk
- **State Corruption**: Mode might not exit cleanly on edge cases
  - **Mitigation**: Comprehensive exit handlers (ESC, tool change, shape change)

#### Medium Risk
- **Performance**: Cursor movement might cause FPS drops
  - **Mitigation**: Throttle to 16ms, optimize raycasting

#### Low Risk
- **User Confusion**: Users might not understand cursor mode vs drag mode
  - **Mitigation**: Clear visual indicators, tooltip on Rotate button

### Rollback Plan

If issues arise:
1. **Feature Flag**: Add `enableCursorRotation` flag in config
2. **Graceful Degradation**: Fall back to drag-only rotation
3. **Quick Disable**: Comment out cursor mode listeners in RotationControls.tsx

## Constitution Compliance

- ✅ **Article 1**: All styling inline (guides, angle display)
- ✅ **Article 2**: TypeScript strict mode, full type safety
- ✅ **Article 3**: Zustand for cursor rotation state
- ✅ **Article 4**: React hooks, proper cleanup in useEffect
- ✅ **Article 5**: Three.js raycasting, no custom 3D math
- ✅ **Article 6**: 70%+ test coverage planned
- ✅ **Article 7**: Input validation, no external calls
- ✅ **Article 8**: Editing existing files (RotationControls, useAppStore)
- ✅ **Article 9**: Visual guides follow Canva design (purple, smooth)

## Dependencies

### Existing Code
- `RotationControls.tsx`: Rotation handle and drag logic
- `useAppStore.ts`: Shape state and history management
- `App.tsx`: Ribbon toolbar and button handlers

### External Libraries
- **Three.js**: Raycasting for cursor position
- **@react-three/drei**: Line and Html components for guides
- **React**: Hooks (useState, useEffect, useCallback, useRef)
- **Zustand**: State management

### New Dependencies
None - all functionality uses existing libraries.

## Timeline Estimate

| Task | Estimated Time |
|------|----------------|
| Store state + actions | 1 hour |
| Cursor tracking logic | 2 hours |
| Visual guides rendering | 1.5 hours |
| Mode exit handlers | 1 hour |
| Testing (unit + integration) | 2 hours |
| Performance optimization | 0.5 hours |
| **Total** | **8 hours** |

## Success Criteria

- [ ] Cursor rotation mode works as specified
- [ ] All acceptance criteria met
- [ ] 70%+ test coverage
- [ ] No performance regression
- [ ] No breaking changes to drag-to-rotate
- [ ] Zero state corruption bugs
- [ ] User can rotate shapes 2x faster than before

---

**Next Steps**: Review this plan, then proceed to task breakdown.
