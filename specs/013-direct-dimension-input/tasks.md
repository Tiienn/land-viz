# Task Breakdown: Direct Dimension Input System

**Spec**: 013-direct-dimension-input
**Total Estimated Time**: 12-18 hours

## Task List

### Phase 1: Foundation (2.5 hours)

#### Task 1.1: Create Type Definitions
**File**: `app/src/types/dimension.ts`
**Estimated Time**: 30 minutes
**Dependencies**: None

**Subtasks**:
- [ ] Create `ParsedDimension` interface
- [ ] Create `PrecisionSettings` interface
- [ ] Create `DimensionInputState` interface
- [ ] Create `InlineEditState` interface
- [ ] Create `LiveDistanceState` interface
- [ ] Export all types from index

**Acceptance Criteria**:
- All interfaces have proper TypeScript types
- No `any` types used
- Interfaces exported correctly
- Build succeeds with no errors

**Code Example**:
```typescript
export interface ParsedDimension {
  width: number;
  height: number;
  unit: string;
  valid: boolean;
  error?: string;
}

export interface PrecisionSettings {
  snapPrecision: number;
  displayPrecision: number;
  preferredUnit: string;
  angleSnap: number;
}
```

---

#### Task 1.2: Create Dimension Parser Service
**File**: `app/src/services/dimensionParser.ts`
**Estimated Time**: 1 hour
**Dependencies**: Task 1.1

**Subtasks**:
- [ ] Implement `parseDimension(input: string)` for rectangles
- [ ] Implement `parseRadius(input: string)` for circles
- [ ] Implement `parsePolarCoordinate(input: string)` for polar input
- [ ] Add support for multiple input formats
- [ ] Add unit extraction (m, ft, yd)
- [ ] Add comprehensive error messages

**Input Formats to Support**:
```typescript
// Rectangle formats
"10x15" → { width: 10, height: 15, unit: 'm', valid: true }
"10 x 15" → { width: 10, height: 15, unit: 'm', valid: true }
"10m x 15m" → { width: 10, height: 15, unit: 'm', valid: true }
"10.5 x 20.75" → { width: 10.5, height: 20.75, unit: 'm', valid: true }
"33ft x 50ft" → { width: 33, height: 50, unit: 'ft', valid: true }

// Circle formats
"5" → { width: 5, height: 5, unit: 'm', valid: true }
"r5" → { width: 5, height: 5, unit: 'm', valid: true }
"d10" → { width: 5, height: 5, unit: 'm', valid: true } // diameter
"5m" → { width: 5, height: 5, unit: 'm', valid: true }

// Invalid formats
"abc" → { width: 0, height: 0, unit: 'm', valid: false, error: '...' }
"10x" → { width: 0, height: 0, unit: 'm', valid: false, error: '...' }
```

**Acceptance Criteria**:
- All formats parse correctly
- Invalid inputs return `valid: false` with error message
- Unit extraction works for m, ft, yd
- Decimal values supported
- No runtime errors on any input

---

#### Task 1.3: Create Dimension Formatter Service
**File**: `app/src/services/dimensionFormatter.ts`
**Estimated Time**: 30 minutes
**Dependencies**: Task 1.1

**Subtasks**:
- [ ] Implement `formatDimension(value, precision, unit)`
- [ ] Implement `formatDimensionPair(width, height, precision, unit)`
- [ ] Implement `formatDistance(distance, precision, unit)`
- [ ] Handle precision (0-4 decimal places)
- [ ] Add unit suffix

**Code Example**:
```typescript
export const formatDimension = (
  value: number,
  precision: number,
  unit: string
): string => {
  return `${value.toFixed(precision)}${unit}`;
};

export const formatDimensionPair = (
  width: number,
  height: number,
  precision: number,
  unit: string
): string => {
  return `${width.toFixed(precision)}${unit} × ${height.toFixed(precision)}${unit}`;
};
```

**Acceptance Criteria**:
- Correct decimal precision
- Unit suffix added
- Handles edge cases (very small/large numbers)
- No rounding errors

---

#### Task 1.4: Create Dimension Validator Service
**File**: `app/src/services/dimensionValidator.ts`
**Estimated Time**: 30 minutes
**Dependencies**: Task 1.1

**Subtasks**:
- [ ] Implement `validateDimension(value)`
- [ ] Implement `validateDimensionRange(value, min, max)`
- [ ] Implement `isValidUnit(unit)`
- [ ] Add min/max constraints (0.1m - 1000m)
- [ ] Add positive value check
- [ ] Add NaN/Infinity check

**Code Example**:
```typescript
export const validateDimension = (value: number): { valid: boolean; error?: string } => {
  if (isNaN(value) || !isFinite(value)) {
    return { valid: false, error: 'Invalid number' };
  }
  if (value <= 0) {
    return { valid: false, error: 'Dimension must be positive' };
  }
  if (value < 0.1) {
    return { valid: false, error: 'Dimension too small (min 0.1m)' };
  }
  if (value > 1000) {
    return { valid: false, error: 'Dimension too large (max 1000m)' };
  }
  return { valid: true };
};
```

**Acceptance Criteria**:
- Min/max validation works
- Positive value check works
- NaN/Infinity rejected
- Clear error messages

---

### Phase 2: State Management (2 hours)

#### Task 2.1: Create Dimension Store
**File**: `app/src/store/useDimensionStore.ts`
**Estimated Time**: 1.5 hours
**Dependencies**: Task 1.1

**Subtasks**:
- [ ] Create Zustand store with all state slices
- [ ] Implement dimension input actions
- [ ] Implement inline edit actions
- [ ] Implement live distance actions
- [ ] Implement precision settings actions
- [ ] Add default state values

**Store Structure**:
```typescript
interface DimensionStore {
  // State slices
  dimensionInput: DimensionInputState;
  inlineEdit: InlineEditState;
  liveDistance: LiveDistanceState;
  precision: PrecisionSettings;

  // Actions - Dimension Input
  setDimensionInput: (width: string, height: string) => void;
  clearDimensionInput: () => void;
  setInputError: (error: string | null) => void;

  // Actions - Inline Edit
  startEditingDimension: (shapeId: string, type: 'width' | 'height' | 'radius') => void;
  updateEditingValue: (value: string) => void;
  confirmDimensionEdit: () => void;
  cancelDimensionEdit: () => void;

  // Actions - Live Distance
  showDistance: (distance: number) => void;
  hideDistance: () => void;
  updateDistance: (distance: number) => void;

  // Actions - Precision
  setPrecision: (settings: Partial<PrecisionSettings>) => void;
}
```

**Acceptance Criteria**:
- All actions implemented
- State updates correctly
- No mutation of state (immutability)
- TypeScript types correct
- Store can be used in components

---

#### Task 2.2: Add Persist Middleware for Settings
**File**: `app/src/store/useDimensionStore.ts` (enhancement)
**Estimated Time**: 30 minutes
**Dependencies**: Task 2.1

**Subtasks**:
- [ ] Import Zustand persist middleware
- [ ] Wrap store with persist
- [ ] Configure to only persist `precision` slice
- [ ] Test localStorage persistence

**Code Example**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDimensionStore = create(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'dimension-settings',
      partialize: (state) => ({ precision: state.precision })
    }
  )
);
```

**Acceptance Criteria**:
- Precision settings persist across page refreshes
- Only precision settings persisted (not input/edit state)
- localStorage key is `dimension-settings`
- No console errors

---

### Phase 3: UI Components (5 hours)

#### Task 3.1: Create DimensionInputToolbar Component
**File**: `app/src/components/DimensionInput/DimensionInputToolbar.tsx`
**Estimated Time**: 1.5 hours
**Dependencies**: Task 2.1, Task 1.2

**Subtasks**:
- [ ] Create component with width/height inputs
- [ ] Add unit selector dropdown
- [ ] Add error message display
- [ ] Implement input change handlers with debounce
- [ ] Implement validation on change
- [ ] Add clear button
- [ ] Style with Canva-inspired design
- [ ] Add active/inactive states

**Layout**:
```tsx
<div style={toolbarContainerStyle}>
  <label>📏 Dimensions:</label>
  <input
    data-dimension-input="width"
    type="text"
    placeholder="Width"
    value={inputWidth}
    onChange={handleWidthChange}
    style={inputFieldStyle}
  />
  <span>×</span>
  <input
    data-dimension-input="height"
    type="text"
    placeholder="Height"
    value={inputHeight}
    onChange={handleHeightChange}
    style={inputFieldStyle}
  />
  <select value={inputUnit} onChange={handleUnitChange}>
    <option value="m">m</option>
    <option value="ft">ft</option>
    <option value="yd">yd</option>
  </select>
  <button onClick={handleClear}>✕</button>
  {inputError && <div style={errorStyle}>{inputError}</div>}
</div>
```

**Styling** (Canva-inspired):
```typescript
const toolbarContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontFamily: 'Nunito Sans, sans-serif',
};

const inputFieldStyle = {
  width: '80px',
  padding: '6px 8px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '14px',
  textAlign: 'center' as const,
  transition: 'border-color 200ms',
};
```

**Acceptance Criteria**:
- Inputs work correctly
- Validation shows errors
- Clear button clears inputs
- Styling matches Canva design
- Disabled when no compatible tool active

---

#### Task 3.2: Create InlineDimensionLabel Component
**File**: `app/src/components/DimensionInput/InlineDimensionLabel.tsx`
**Estimated Time**: 1.5 hours
**Dependencies**: Task 2.1, Task 1.3

**Subtasks**:
- [ ] Create HTML overlay component (not Three.js)
- [ ] Implement 3D-to-2D projection for positioning
- [ ] Add click handler to enter edit mode
- [ ] Convert to input field when editing
- [ ] Implement Enter/ESC handling
- [ ] Add real-time validation
- [ ] Style with hover effects
- [ ] Handle canvas boundary constraints

**Component Structure**:
```tsx
interface InlineDimensionLabelProps {
  shapeId: string;
  dimension: 'width' | 'height' | 'radius';
  value: number;
  position: { x: number; y: number; z: number };
  camera: THREE.Camera;
  onEdit: (shapeId: string, dimension: string, newValue: number) => void;
}

const InlineDimensionLabel: React.FC<InlineDimensionLabelProps> = ({
  shapeId,
  dimension,
  value,
  position,
  camera,
  onEdit
}) => {
  const { precision, preferredUnit } = useDimensionStore(state => state.precision);
  const { isEditingDimension, editingShapeId, editingDimensionType } = useDimensionStore(
    state => state.inlineEdit
  );

  const isEditing = isEditingDimension &&
    editingShapeId === shapeId &&
    editingDimensionType === dimension;

  // Convert 3D position to screen coordinates
  const screenPos = useMemo(() => {
    const vector = new THREE.Vector3(position.x, position.y, position.z);
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

    return { x, y };
  }, [position, camera]);

  const handleClick = () => {
    useDimensionStore.getState().startEditingDimension(shapeId, dimension);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      useDimensionStore.getState().confirmDimensionEdit();
    } else if (e.key === 'Escape') {
      useDimensionStore.getState().cancelDimensionEdit();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenPos.x}px`,
        top: `${screenPos.y}px`,
        ...labelStyle
      }}
      onClick={!isEditing ? handleClick : undefined}
    >
      {isEditing ? (
        <input
          autoFocus
          type="text"
          defaultValue={value.toFixed(precision)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />
      ) : (
        <span>{formatDimension(value, precision, preferredUnit)}</span>
      )}
    </div>
  );
};
```

**Acceptance Criteria**:
- Labels positioned correctly using 3D-to-2D projection
- Click enters edit mode
- Enter confirms, ESC cancels
- Input validates in real-time
- Hover effect works
- Stays within canvas bounds

---

#### Task 3.3: Create LiveDistanceLabel Component
**File**: `app/src/components/DimensionInput/LiveDistanceLabel.tsx`
**Estimated Time**: 1 hour
**Dependencies**: Task 2.1, Task 1.3

**Subtasks**:
- [ ] Create overlay component
- [ ] Position near cursor with offset
- [ ] Implement smooth fade in/out
- [ ] Update distance from store
- [ ] Format with precision and unit
- [ ] Ensure always visible (clamp to canvas)

**Component Structure**:
```tsx
const LiveDistanceLabel: React.FC = () => {
  const { isShowingDistance, distanceFromStart } = useDimensionStore(
    state => state.liveDistance
  );
  const { displayPrecision, preferredUnit } = useDimensionStore(
    state => state.precision
  );

  const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isShowingDistance) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${cursorPos.x + 20}px`,
        top: `${cursorPos.y + 20}px`,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'Nunito Sans, sans-serif',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        pointerEvents: 'none',
        zIndex: 10000,
        animation: 'fadeIn 150ms ease-in-out',
      }}
    >
      {formatDistance(distanceFromStart, displayPrecision, preferredUnit)}
    </div>
  );
};
```

**Acceptance Criteria**:
- Label follows cursor with offset
- Smooth fade in/out
- Updates at 60 FPS
- Always visible (not clipped)
- Correct formatting

---

#### Task 3.4: Create PrecisionSettingsPanel Component
**File**: `app/src/components/DimensionInput/PrecisionSettingsPanel.tsx`
**Estimated Time**: 1 hour
**Dependencies**: Task 2.1

**Subtasks**:
- [ ] Create settings panel component
- [ ] Add snap precision dropdown
- [ ] Add display precision input
- [ ] Add preferred unit dropdown
- [ ] Add angle snap dropdown
- [ ] Wire up to dimension store
- [ ] Style consistently with Properties panel

**Component Structure**:
```tsx
const PrecisionSettingsPanel: React.FC = () => {
  const { precision, setPrecision } = useDimensionStore();

  return (
    <div style={panelStyle}>
      <h3>Precision Settings</h3>

      <div style={settingRowStyle}>
        <label>Snap Precision:</label>
        <select
          value={precision.snapPrecision}
          onChange={(e) => setPrecision({ snapPrecision: Number(e.target.value) })}
        >
          <option value={0.1}>0.1m</option>
          <option value={0.5}>0.5m</option>
          <option value={1}>1m</option>
          <option value={5}>5m</option>
        </select>
      </div>

      <div style={settingRowStyle}>
        <label>Display Precision:</label>
        <input
          type="number"
          min={0}
          max={4}
          value={precision.displayPrecision}
          onChange={(e) => setPrecision({ displayPrecision: Number(e.target.value) })}
          style={numberInputStyle}
        />
        <span>decimals</span>
      </div>

      <div style={settingRowStyle}>
        <label>Unit:</label>
        <select
          value={precision.preferredUnit}
          onChange={(e) => setPrecision({ preferredUnit: e.target.value })}
        >
          <option value="m">Meters</option>
          <option value="ft">Feet</option>
          <option value="yd">Yards</option>
        </select>
      </div>

      <div style={settingRowStyle}>
        <label>Angle Snap:</label>
        <select
          value={precision.angleSnap}
          onChange={(e) => setPrecision({ angleSnap: Number(e.target.value) })}
        >
          <option value={15}>15°</option>
          <option value={30}>30°</option>
          <option value={45}>45°</option>
          <option value={90}>90°</option>
        </select>
      </div>
    </div>
  );
};
```

**Acceptance Criteria**:
- All settings update store correctly
- Settings persist via localStorage
- UI matches Properties panel style
- Input validation works

---

### Phase 4: Integration (5 hours)

#### Task 4.1: Integrate with DrawingCanvas.tsx (Rectangle Tool)
**File**: `app/src/components/Scene/DrawingCanvas.tsx` (modify)
**Estimated Time**: 1 hour
**Dependencies**: Task 2.1, Task 1.2

**Subtasks**:
- [ ] Import dimension store
- [ ] Check if dimension input active on rectangle click
- [ ] Parse dimensions from input
- [ ] Create rectangle with exact dimensions
- [ ] Clear dimension input after creation
- [ ] Add validation and error handling

**Code Location**: In `handleCanvasClick` for rectangle tool

```typescript
// Add near top of component:
const { dimensionInput, clearDimensionInput } = useDimensionStore();

// In handleCanvasClick for rectangle tool:
if (activeTool === 'rectangle') {
  // Check if dimension input is active
  if (dimensionInput.isDimensionInputActive &&
      dimensionInput.inputWidth &&
      dimensionInput.inputHeight) {
    const inputStr = `${dimensionInput.inputWidth}x${dimensionInput.inputHeight}`;
    const parsed = parseDimension(inputStr);

    if (parsed.valid) {
      // Convert to meters if needed
      const width = convertToMeters(parsed.width, parsed.unit);
      const height = convertToMeters(parsed.height, parsed.unit);

      // Create rectangle centered at click position
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      const newShape: Shape = {
        id: generateId(),
        type: 'rectangle',
        points: [
          { x: worldPos.x - halfWidth, y: worldPos.z - halfHeight },
          { x: worldPos.x + halfWidth, y: worldPos.z + halfHeight }
        ],
        elevation: 0,
        layerId: currentLayer?.id || 'main'
      };

      addShape(newShape);
      clearDimensionInput();
      saveToHistory();
      return;
    } else {
      // Show error
      useDimensionStore.getState().setInputError(parsed.error || 'Invalid input');
      return;
    }
  }

  // Otherwise continue with normal rectangle drawing
  // ... existing rectangle code ...
}
```

**Acceptance Criteria**:
- Typing "10x15" → clicking creates exact 10m × 15m rectangle
- Rectangle centered at click position
- Input cleared after creation
- Saved to undo/redo history
- Works with unit conversion

---

#### Task 4.2: Integrate with DrawingCanvas.tsx (Circle Tool)
**File**: `app/src/components/Scene/DrawingCanvas.tsx` (modify)
**Estimated Time**: 30 minutes
**Dependencies**: Task 4.1

**Subtasks**:
- [ ] Similar to rectangle, check dimension input for circle
- [ ] Parse radius from input
- [ ] Create circle with exact radius
- [ ] Clear input after creation

**Code Example**:
```typescript
if (activeTool === 'circle') {
  if (dimensionInput.isDimensionInputActive && dimensionInput.inputRadius) {
    const parsed = parseRadius(dimensionInput.inputRadius);

    if (parsed.valid) {
      const radius = convertToMeters(parsed.width, parsed.unit);

      const newShape: Shape = {
        id: generateId(),
        type: 'circle',
        center: { x: worldPos.x, y: worldPos.z },
        radius: radius,
        elevation: 0,
        layerId: currentLayer?.id || 'main'
      };

      addShape(newShape);
      clearDimensionInput();
      saveToHistory();
      return;
    }
  }

  // Continue with normal circle drawing
}
```

**Acceptance Criteria**:
- Typing "5" → clicking creates circle with radius 5m
- Typing "d10" → creates circle with diameter 10m (radius 5m)
- Circle centered at click position
- Works with unit conversion

---

#### Task 4.3: Integrate with ShapeRenderer.tsx
**File**: `app/src/components/Scene/ShapeRenderer.tsx` (modify)
**Estimated Time**: 1.5 hours
**Dependencies**: Task 3.2

**Subtasks**:
- [ ] Import InlineDimensionLabel component
- [ ] Add helper functions to calculate dimensions
- [ ] Add helper functions to calculate label positions
- [ ] Render labels for selected shapes
- [ ] Handle dimension edit callback
- [ ] Pass camera ref to labels

**Helper Functions**:
```typescript
const calculateWidth = (shape: Shape): number => {
  if (shape.type === 'rectangle') {
    return Math.abs(shape.points[1].x - shape.points[0].x);
  }
  if (shape.type === 'polygon') {
    const xs = shape.points.map(p => p.x);
    return Math.max(...xs) - Math.min(...xs);
  }
  return 0;
};

const calculateHeight = (shape: Shape): number => {
  if (shape.type === 'rectangle') {
    return Math.abs(shape.points[1].y - shape.points[0].y);
  }
  if (shape.type === 'polygon') {
    const ys = shape.points.map(p => p.y);
    return Math.max(...ys) - Math.min(...ys);
  }
  return 0;
};

const getWidthLabelPosition = (shape: Shape): Vector3 => {
  const center = getShapeCenter(shape);
  const height = calculateHeight(shape);
  return new Vector3(center.x, 0.1, center.y + height/2 + 1);
};

const getHeightLabelPosition = (shape: Shape): Vector3 => {
  const center = getShapeCenter(shape);
  const width = calculateWidth(shape);
  return new Vector3(center.x + width/2 + 1, 0.1, center.y);
};
```

**Render Labels**:
```tsx
// In JSX for each shape:
{isSelected && !shape.locked && (
  <>
    <InlineDimensionLabel
      shapeId={shape.id}
      dimension="width"
      value={calculateWidth(shape)}
      position={getWidthLabelPosition(shape)}
      camera={camera}
      onEdit={handleDimensionEdit}
    />
    <InlineDimensionLabel
      shapeId={shape.id}
      dimension="height"
      value={calculateHeight(shape)}
      position={getHeightLabelPosition(shape)}
      camera={camera}
      onEdit={handleDimensionEdit}
    />
  </>
)}
```

**Edit Handler**:
```typescript
const handleDimensionEdit = useCallback((shapeId: string, dimension: string, newValue: number) => {
  const shape = shapes.find(s => s.id === shapeId);
  if (!shape) return;

  if (dimension === 'width') {
    const currentWidth = calculateWidth(shape);
    const scale = newValue / currentWidth;
    // Scale shape horizontally
    const newPoints = shape.points.map(p => ({
      x: p.x * scale,
      y: p.y
    }));
    updateShape(shapeId, { points: newPoints });
  } else if (dimension === 'height') {
    const currentHeight = calculateHeight(shape);
    const scale = newValue / currentHeight;
    // Scale shape vertically
    const newPoints = shape.points.map(p => ({
      x: p.x,
      y: p.y * scale
    }));
    updateShape(shapeId, { points: newPoints });
  }

  saveToHistory();
}, [shapes, updateShape, saveToHistory]);
```

**Acceptance Criteria**:
- Labels appear for selected rectangles
- Labels positioned correctly
- Clicking label enters edit mode
- Editing updates shape correctly
- Changes saved to history

---

#### Task 4.4: Integrate Drag Distance Tracking
**File**: `app/src/store/useAppStore.ts` (modify)
**Estimated Time**: 1 hour
**Dependencies**: Task 2.1, Task 3.3

**Subtasks**:
- [ ] Add `dragStartPosition` to drag state
- [ ] Calculate distance during drag
- [ ] Update dimension store with distance
- [ ] Clear distance on drag end

**Code Modifications**:

```typescript
// In state interface, add:
interface AppState {
  // ... existing state ...
  dragStartPosition: Point2D | null;
}

// In startDragging action:
startDragging: (shapeId: string, startPosition: Point2D) => {
  const state = get();
  const shape = state.shapes.find(s => s.id === shapeId);

  if (shape?.locked) return;

  set({
    isDragging: true,
    draggedShapeId: shapeId,
    dragStartPosition: startPosition, // Store start position
    liveResizePoints: null,
    liveRotationAngle: null
  });

  // Show distance label
  useDimensionStore.getState().showDistance(0);
},

// In updateDragging action:
updateDragging: (currentPosition: Point2D) => {
  const state = get();
  if (!state.isDragging || !state.draggedShapeId) return;

  const { dragStartPosition } = state;
  if (!dragStartPosition) return;

  // Calculate distance from start
  const distance = Math.sqrt(
    Math.pow(currentPosition.x - dragStartPosition.x, 2) +
    Math.pow(currentPosition.y - dragStartPosition.y, 2)
  );

  // Update dimension store
  useDimensionStore.getState().updateDistance(distance);

  // ... rest of existing drag update logic ...
},

// In endDragging action:
endDragging: () => {
  set({
    isDragging: false,
    draggedShapeId: null,
    dragStartPosition: null, // Clear start position
    dragOffset: null
  });

  // Hide distance label
  useDimensionStore.getState().hideDistance();

  // Save to history
  get().saveToHistory();
}
```

**Acceptance Criteria**:
- Distance label appears when dragging starts
- Distance updates smoothly during drag
- Distance label hides when drag ends
- Distance is accurate (Pythagorean theorem)

---

#### Task 4.5: Integrate with App.tsx
**File**: `app/src/App.tsx` (modify)
**Estimated Time**: 1 hour
**Dependencies**: Task 3.1, Task 3.3, Task 3.4

**Subtasks**:
- [ ] Add DimensionInputToolbar to ribbon
- [ ] Add PrecisionSettingsPanel to Properties panel
- [ ] Add LiveDistanceLabel to root
- [ ] Add keyboard listener for dimension input activation
- [ ] Position components correctly

**Code Additions**:

```tsx
// Import components
import DimensionInputToolbar from './components/DimensionInput/DimensionInputToolbar';
import LiveDistanceLabel from './components/DimensionInput/LiveDistanceLabel';
import PrecisionSettingsPanel from './components/DimensionInput/PrecisionSettingsPanel';

// In ribbon toolbar (after drawing tools, before view controls):
{/* Dimension Input */}
<DimensionInputToolbar />

// In Properties panel (new section):
{/* Precision Settings */}
<PrecisionSettingsPanel />

// At root level (for overlay):
<LiveDistanceLabel />

// Keyboard handler for dimension input activation:
React.useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const { activeTool } = useAppStore.getState();
    const { isDimensionInputActive } = useDimensionStore.getState();

    // Only activate if:
    // 1. Rectangle or circle tool is active
    // 2. User types a number
    // 3. Dimension input not already active
    // 4. Focus is not in an input field
    if (
      (activeTool === 'rectangle' || activeTool === 'circle') &&
      /^\d$/.test(e.key) &&
      !isDimensionInputActive &&
      document.activeElement?.tagName !== 'INPUT'
    ) {
      // Activate dimension input and pre-fill first character
      useDimensionStore.getState().setDimensionInput(e.key, '');

      // Focus the width input
      setTimeout(() => {
        const inputField = document.querySelector(
          '[data-dimension-input="width"]'
        ) as HTMLInputElement;
        inputField?.focus();
      }, 0);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Acceptance Criteria**:
- DimensionInputToolbar appears in ribbon
- PrecisionSettingsPanel appears in Properties
- LiveDistanceLabel works correctly
- Keyboard shortcut activates dimension input
- No layout issues or overlaps

---

### Phase 5: Testing & Polish (3 hours)

#### Task 5.1: Write Unit Tests
**Files**:
- `app/src/services/__tests__/dimensionParser.test.ts`
- `app/src/services/__tests__/dimensionFormatter.test.ts`
- `app/src/services/__tests__/dimensionValidator.test.ts`

**Estimated Time**: 1 hour
**Dependencies**: Phase 1 tasks

**Test Cases**:

```typescript
// dimensionParser.test.ts
describe('parseDimension', () => {
  it('should parse "10x15"', () => {
    expect(parseDimension('10x15')).toEqual({
      width: 10,
      height: 15,
      unit: 'm',
      valid: true
    });
  });

  it('should parse "10m x 15m"', () => {
    expect(parseDimension('10m x 15m')).toEqual({
      width: 10,
      height: 15,
      unit: 'm',
      valid: true
    });
  });

  it('should parse decimals', () => {
    expect(parseDimension('10.5 x 20.75')).toEqual({
      width: 10.5,
      height: 20.75,
      unit: 'm',
      valid: true
    });
  });

  it('should reject invalid format', () => {
    const result = parseDimension('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should reject too small dimensions', () => {
    const result = parseDimension('0.01x0.01');
    expect(result.valid).toBe(false);
  });
});

// dimensionFormatter.test.ts
describe('formatDimension', () => {
  it('should format with 2 decimals', () => {
    expect(formatDimension(10.5, 2, 'm')).toBe('10.50m');
  });

  it('should format with 0 decimals', () => {
    expect(formatDimension(10.5, 0, 'm')).toBe('11m');
  });
});

// dimensionValidator.test.ts
describe('validateDimension', () => {
  it('should accept valid dimension', () => {
    expect(validateDimension(10).valid).toBe(true);
  });

  it('should reject negative', () => {
    expect(validateDimension(-5).valid).toBe(false);
  });

  it('should reject NaN', () => {
    expect(validateDimension(NaN).valid).toBe(false);
  });
});
```

**Acceptance Criteria**:
- All service functions tested
- Edge cases covered
- 100% code coverage for services

---

#### Task 5.2: Write Integration Tests
**File**: `app/src/__tests__/integration/dimensionInput.integration.test.tsx`
**Estimated Time**: 1 hour
**Dependencies**: Phase 3, Phase 4 tasks

**Test Cases**:

```typescript
describe('Dimension Input Integration', () => {
  it('should create rectangle with typed dimensions', async () => {
    const { getByTestId, getByRole } = render(<App />);

    // Select rectangle tool
    fireEvent.click(getByTestId('rectangle-tool-button'));

    // Type dimensions
    const widthInput = getByTestId('dimension-width-input');
    const heightInput = getByTestId('dimension-height-input');

    fireEvent.change(widthInput, { target: { value: '10' } });
    fireEvent.change(heightInput, { target: { value: '15' } });

    // Click canvas
    const canvas = getByRole('region', { name: /3d scene/i });
    fireEvent.click(canvas, { clientX: 500, clientY: 500 });

    // Verify shape created
    await waitFor(() => {
      const shapes = useAppStore.getState().shapes;
      expect(shapes).toHaveLength(1);
      expect(calculateWidth(shapes[0])).toBeCloseTo(10, 1);
      expect(calculateHeight(shapes[0])).toBeCloseTo(15, 1);
    });
  });

  it('should show error for invalid input', async () => {
    const { getByTestId, getByText } = render(<App />);

    fireEvent.click(getByTestId('rectangle-tool-button'));

    const widthInput = getByTestId('dimension-width-input');
    fireEvent.change(widthInput, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(getByText(/invalid format/i)).toBeInTheDocument();
    });
  });
});
```

**Acceptance Criteria**:
- End-to-end workflows tested
- User interactions validated
- Error cases covered

---

#### Task 5.3: Manual Testing & Bug Fixes
**Estimated Time**: 1 hour
**Dependencies**: All previous tasks

**Test Checklist**:
- [ ] Rectangle with dimension input (10x15)
- [ ] Circle with radius input (5)
- [ ] Circle with diameter input (d10)
- [ ] Invalid input shows error
- [ ] Inline edit works for rectangle
- [ ] Inline edit works for circle
- [ ] Live distance shows during drag
- [ ] Precision settings persist
- [ ] Works in 2D mode
- [ ] Works in 3D mode
- [ ] Undo/redo works
- [ ] Locked shapes cannot be edited
- [ ] ESC cancels dimension input
- [ ] Unit conversion works (10ft → meters)
- [ ] Keyboard shortcut activates input
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance is good (60 FPS)

**Bug Fix Buffer**: 30 minutes for unexpected issues

---

## Summary

**Total Tasks**: 19
**Total Estimated Time**: 17.5 hours
**Recommended Buffer**: +20% → 21 hours

**Critical Path**:
1. Foundation (Phase 1) → State (Phase 2) → UI (Phase 3) → Integration (Phase 4) → Testing (Phase 5)

**Parallelization Opportunities**:
- Tasks 1.2, 1.3, 1.4 can be done in parallel
- Tasks 3.1, 3.2, 3.3, 3.4 can be done in parallel
- Tasks 4.1, 4.2 can be done in parallel

**Risk Mitigation**:
- Start with foundation and services (solid base)
- Test each component individually before integration
- Keep integration changes small and isolated
- Add feature flags for easy rollback if needed

---

## Next Steps

1. Review and approve this task breakdown
2. Create GitHub issues/cards for each task
3. Assign tasks to developers
4. Begin with Phase 1 (Foundation)
5. Daily standups to track progress
6. Weekly demos of completed features

**Ready to implement!** 🚀
