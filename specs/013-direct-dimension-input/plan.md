# Implementation Plan: Direct Dimension Input System

**Spec**: 013-direct-dimension-input
**Estimated Total Effort**: 8-12 hours
**Priority**: High (Phase 1)

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
├─────────────────────────────────────────────────────────┤
│  DimensionInputToolbar  │  InlineDimensionLabel         │
│  LiveDistanceLabel      │  PrecisionSettingsPanel       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    State Management                      │
├─────────────────────────────────────────────────────────┤
│              useDimensionStore (Zustand)                 │
│  - Dimension input state                                 │
│  - Inline edit state                                     │
│  - Live distance state                                   │
│  - Precision settings                                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
├─────────────────────────────────────────────────────────┤
│  dimensionParser     │  dimensionFormatter              │
│  dimensionValidator  │  unitConverter                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Integration Points                      │
├─────────────────────────────────────────────────────────┤
│  DrawingCanvas.tsx   │  ShapeRenderer.tsx               │
│  App.tsx             │  useAppStore.ts                  │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App.tsx
├── Ribbon Toolbar
│   └── DimensionInputToolbar (NEW)
│       ├── Width Input
│       ├── Height Input
│       └── Unit Selector
│
├── 3D Scene (SceneManager)
│   ├── DrawingCanvas (MODIFIED)
│   │   └── Uses dimension input for shape creation
│   │
│   └── ShapeRenderer (MODIFIED)
│       └── InlineDimensionLabel (NEW)
│           └── Editable dimension labels
│
├── LiveDistanceLabel (NEW)
│   └── HTML overlay during drag
│
└── Properties Panel
    └── PrecisionSettingsPanel (NEW)
        ├── Snap Precision
        ├── Display Precision
        ├── Unit Preference
        └── Angle Snap
```

## Phase 1: Foundation (2-3 hours)

### 1.1 Create Type Definitions
**File**: `app/src/types/dimension.ts`

```typescript
export interface ParsedDimension {
  width: number;
  height: number;
  unit: string;
  valid: boolean;
  error?: string;
}

export interface PrecisionSettings {
  snapPrecision: number; // 0.1, 0.5, 1, 5
  displayPrecision: number; // decimal places
  preferredUnit: string; // 'm', 'ft', 'yd'
  angleSnap: number; // 15, 30, 45, 90
}

export interface DimensionInputState {
  isDimensionInputActive: boolean;
  inputWidth: string;
  inputHeight: string;
  inputRadius: string;
  inputUnit: string;
  inputError: string | null;
}

export interface InlineEditState {
  isEditingDimension: boolean;
  editingShapeId: string | null;
  editingDimensionType: 'width' | 'height' | 'radius' | null;
  editingValue: string;
}

export interface LiveDistanceState {
  isShowingDistance: boolean;
  distanceFromStart: number;
  distanceUnit: string;
}
```

**Time**: 30 minutes

### 1.2 Create Dimension Parser Service
**File**: `app/src/services/dimensionParser.ts`

**Key Functions**:
```typescript
export const parseDimension = (input: string): ParsedDimension
export const parseRadius = (input: string): ParsedDimension
export const parsePolarCoordinate = (input: string): { distance: number; angle: number; valid: boolean }
```

**Patterns to Support**:
- "10x15", "10 x 15", "10m x 15m"
- "10.5 x 20.75m"
- "33ft x 50ft"
- "5", "r5", "d10" (for circles)

**Time**: 1 hour

### 1.3 Create Dimension Formatter Service
**File**: `app/src/services/dimensionFormatter.ts`

**Key Functions**:
```typescript
export const formatDimension = (value: number, precision: number, unit: string): string
export const formatDimensionPair = (width: number, height: number, precision: number, unit: string): string
export const formatDistance = (distance: number, precision: number, unit: string): string
```

**Time**: 30 minutes

### 1.4 Create Dimension Validator Service
**File**: `app/src/services/dimensionValidator.ts`

**Key Functions**:
```typescript
export const validateDimension = (value: number): { valid: boolean; error?: string }
export const validateDimensionRange = (value: number, min: number, max: number): { valid: boolean; error?: string }
export const isValidUnit = (unit: string): boolean
```

**Validation Rules**:
- Min dimension: 0.1m
- Max dimension: 1000m
- Positive values only
- No NaN or Infinity

**Time**: 30 minutes

**Total Phase 1**: 2.5 hours

## Phase 2: State Management (1-2 hours)

### 2.1 Create Dimension Store
**File**: `app/src/store/useDimensionStore.ts`

**Store Structure**:
```typescript
interface DimensionStore {
  // State
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
  loadPrecisionSettings: () => void; // From localStorage
  savePrecisionSettings: () => void; // To localStorage
}
```

**Default State**:
```typescript
const defaultState = {
  dimensionInput: {
    isDimensionInputActive: false,
    inputWidth: '',
    inputHeight: '',
    inputRadius: '',
    inputUnit: 'm',
    inputError: null
  },
  inlineEdit: {
    isEditingDimension: false,
    editingShapeId: null,
    editingDimensionType: null,
    editingValue: ''
  },
  liveDistance: {
    isShowingDistance: false,
    distanceFromStart: 0,
    distanceUnit: 'm'
  },
  precision: {
    snapPrecision: 1, // 1m default
    displayPrecision: 2, // 2 decimal places
    preferredUnit: 'm',
    angleSnap: 45 // 45° default
  }
};
```

**Time**: 1.5 hours

### 2.2 Add Persist Middleware
**Enhancement**: Save precision settings to localStorage

```typescript
import { persist } from 'zustand/middleware';

export const useDimensionStore = create(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'dimension-settings',
      partialize: (state) => ({ precision: state.precision }) // Only persist precision
    }
  )
);
```

**Time**: 30 minutes

**Total Phase 2**: 2 hours

## Phase 3: UI Components (3-4 hours)

### 3.1 DimensionInputToolbar Component
**File**: `app/src/components/DimensionInput/DimensionInputToolbar.tsx`

**Features**:
- Width and height input fields
- Unit selector dropdown
- Error message display
- Auto-focus on first input when activated
- Clear button
- Visual feedback (active/inactive states)

**Layout**:
```tsx
<div style={toolbarContainerStyle}>
  <div style={inputGroupStyle}>
    <label>📏 Dimensions:</label>
    <input
      type="text"
      placeholder="Width"
      value={inputWidth}
      onChange={handleWidthChange}
      style={inputFieldStyle}
    />
    <span>×</span>
    <input
      type="text"
      placeholder="Height"
      value={inputHeight}
      onChange={handleHeightChange}
      style={inputFieldStyle}
    />
    <select value={inputUnit} onChange={handleUnitChange}>
      <option value="m">Meters</option>
      <option value="ft">Feet</option>
      <option value="yd">Yards</option>
    </select>
  </div>
  {inputError && <div style={errorStyle}>{inputError}</div>}
</div>
```

**Logic**:
- Parse input on change with 200ms debounce
- Validate and show errors immediately
- Clear input when shape is created
- Disable when no dimension-compatible tool active

**Time**: 1.5 hours

### 3.2 InlineDimensionLabel Component
**File**: `app/src/components/DimensionInput/InlineDimensionLabel.tsx`

**Props**:
```typescript
interface InlineDimensionLabelProps {
  shapeId: string;
  dimension: 'width' | 'height' | 'radius';
  value: number;
  position: { x: number; y: number; z: number }; // 3D position
  onEdit: (shapeId: string, dimension: string, newValue: number) => void;
}
```

**Features**:
- Displays formatted dimension (e.g., "10.50m")
- Clickable to enter edit mode
- Becomes input field when editing
- Real-time validation
- Enter to confirm, ESC to cancel
- Uses HTML overlay (not Three.js mesh)

**Positioning**:
- Use 3D-to-2D projection (like MeasurementOverlay)
- Position near shape edge
- Adjust to avoid canvas boundaries

**Time**: 1.5 hours

### 3.3 LiveDistanceLabel Component
**File**: `app/src/components/DimensionInput/LiveDistanceLabel.tsx`

**Features**:
- Shows distance from drag start position
- Follows cursor with offset
- Smooth fade in/out animations
- Updates at 60 FPS
- Formatted with unit and precision

**Positioning**:
- Offset from cursor (20px right, 20px down)
- Always visible (clamp to canvas bounds)
- Z-index above other overlays

**Time**: 1 hour

### 3.4 PrecisionSettingsPanel Component
**File**: `app/src/components/DimensionInput/PrecisionSettingsPanel.tsx`

**Features**:
- Dropdown for snap precision (0.1m, 0.5m, 1m, 5m, Custom)
- Number input for display precision (0-4 decimals)
- Dropdown for preferred unit
- Dropdown for angle snap (15°, 30°, 45°, 90°)
- Save settings to localStorage automatically

**Integration**: Add to Properties sidebar in `App.tsx`

**Time**: 1 hour

**Total Phase 3**: 5 hours

## Phase 4: Integration (2-3 hours)

### 4.1 Integrate with DrawingCanvas.tsx

**Changes**:
1. Check if dimension input is active before creating shapes
2. If active, use exact dimensions from store
3. Clear dimension input after shape creation

```typescript
// In handleCanvasClick (for rectangle tool):
const { dimensionInput } = useDimensionStore.getState();

if (dimensionInput.isDimensionInputActive && dimensionInput.inputWidth && dimensionInput.inputHeight) {
  const parsed = parseDimension(`${dimensionInput.inputWidth}x${dimensionInput.inputHeight}`);

  if (parsed.valid) {
    // Create rectangle with exact dimensions centered at click position
    const halfWidth = parsed.width / 2;
    const halfHeight = parsed.height / 2;

    const newShape: Shape = {
      id: generateId(),
      type: 'rectangle',
      points: [
        { x: worldPos.x - halfWidth, y: worldPos.z - halfHeight },
        { x: worldPos.x + halfWidth, y: worldPos.z + halfHeight }
      ],
      elevation: 0
    };

    addShape(newShape);
    useDimensionStore.getState().clearDimensionInput();
    return;
  }
}

// Otherwise, continue with normal drawing flow
```

**Similar changes for**:
- Circle tool (use `inputRadius`)
- Line tool (use `inputLength` for constrained length)

**Time**: 1.5 hours

### 4.2 Integrate with ShapeRenderer.tsx

**Changes**:
1. Render InlineDimensionLabel for selected shapes
2. Calculate label positions based on shape type
3. Handle dimension edit callbacks

```typescript
// Add to shape rendering:
{isSelected && !shape.locked && (
  <>
    {/* Width label */}
    <InlineDimensionLabel
      shapeId={shape.id}
      dimension="width"
      value={calculateWidth(shape)}
      position={getWidthLabelPosition(shape)}
      onEdit={handleDimensionEdit}
    />

    {/* Height label */}
    <InlineDimensionLabel
      shapeId={shape.id}
      dimension="height"
      value={calculateHeight(shape)}
      position={getHeightLabelPosition(shape)}
      onEdit={handleDimensionEdit}
    />
  </>
)}
```

**Helper Functions**:
```typescript
const calculateWidth = (shape: Shape): number => {
  if (shape.type === 'rectangle') {
    return Math.abs(shape.points[1].x - shape.points[0].x);
  }
  // ... other shape types
};

const getWidthLabelPosition = (shape: Shape): Vector3 => {
  // Calculate position below shape
  const center = getShapeCenter(shape);
  const width = calculateWidth(shape);
  return new Vector3(center.x, 0.1, center.y + width/2 + 1);
};
```

**Time**: 1.5 hours

### 4.3 Integrate with Drag System (useAppStore.ts)

**Changes**:
1. Track drag start position
2. Calculate distance during drag
3. Update live distance in dimension store

```typescript
// In startDragging action:
startDragging: (shapeId: string, startPosition: Point2D) => {
  const shape = get().shapes.find(s => s.id === shapeId);
  if (shape?.locked) return;

  set({
    isDragging: true,
    draggedShapeId: shapeId,
    dragStartPosition: startPosition
  });

  useDimensionStore.getState().showDistance(0);
},

// In updateDragging action:
updateDragging: (currentPosition: Point2D) => {
  const { dragStartPosition } = get();
  if (!dragStartPosition) return;

  const distance = Math.sqrt(
    Math.pow(currentPosition.x - dragStartPosition.x, 2) +
    Math.pow(currentPosition.y - dragStartPosition.y, 2)
  );

  useDimensionStore.getState().updateDistance(distance);
},

// In endDragging action:
endDragging: () => {
  set({
    isDragging: false,
    draggedShapeId: null,
    dragStartPosition: null
  });

  useDimensionStore.getState().hideDistance();
  get().saveToHistory(); // Save drag to undo/redo
}
```

**Time**: 1 hour

### 4.4 Integrate with App.tsx

**Changes**:
1. Add DimensionInputToolbar to ribbon
2. Add PrecisionSettingsPanel to Properties panel
3. Add LiveDistanceLabel to root
4. Add keyboard listener for activating dimension input

```typescript
// In ribbon toolbar (after drawing tools):
<DimensionInputToolbar />

// In Properties panel:
<PrecisionSettingsPanel />

// At root level (for overlay):
<LiveDistanceLabel />

// Keyboard handler:
React.useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const { activeTool } = useAppStore.getState();
    const { isDimensionInputActive } = useDimensionStore.getState();

    // If tool is rectangle/circle and user types number, activate dimension input
    if ((activeTool === 'rectangle' || activeTool === 'circle') &&
        /^\d$/.test(e.key) &&
        !isDimensionInputActive &&
        document.activeElement?.tagName !== 'INPUT') {
      // Focus dimension input and pre-fill with typed number
      useDimensionStore.getState().setDimensionInput(e.key, '');
      // Focus first input field
      const inputField = document.querySelector('[data-dimension-input="width"]') as HTMLInputElement;
      inputField?.focus();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Time**: 1 hour

**Total Phase 4**: 5 hours

## Phase 5: Testing & Polish (1-2 hours)

### 5.1 Unit Tests

**Files to Create**:
- `app/src/services/__tests__/dimensionParser.test.ts`
- `app/src/services/__tests__/dimensionFormatter.test.ts`
- `app/src/services/__tests__/dimensionValidator.test.ts`
- `app/src/store/__tests__/useDimensionStore.test.ts`

**Test Coverage Goals**:
- Parser: All input formats, edge cases, invalid inputs
- Formatter: All precisions, units, edge cases
- Validator: Min/max ranges, invalid values
- Store: All actions, state transitions

**Time**: 1 hour

### 5.2 Integration Tests

**File**: `app/src/__tests__/integration/dimensionInput.integration.test.tsx`

**Test Cases**:
1. Type dimension → Create shape with exact size
2. Select shape → Edit dimension → Shape updates
3. Drag shape → See live distance → Release → Distance hides
4. Change precision settings → Dimensions update
5. Invalid input → See error message
6. ESC during input → Input cleared

**Time**: 1 hour

### 5.3 Manual Testing & Polish

**Test Checklist**:
- [ ] All input formats parse correctly
- [ ] Dimension labels positioned correctly
- [ ] Live distance updates smoothly
- [ ] Precision settings persist across sessions
- [ ] Works in 2D and 3D modes
- [ ] Undo/redo works with dimension edits
- [ ] Locked shapes cannot be edited
- [ ] Multi-selection disables dimension editing
- [ ] Error messages are clear and helpful
- [ ] Keyboard shortcuts don't conflict
- [ ] Smooth animations and transitions
- [ ] Mobile responsive (if applicable)

**Time**: 1 hour

**Total Phase 5**: 3 hours

## Total Implementation Time

| Phase | Description | Time |
|-------|-------------|------|
| Phase 1 | Foundation (types, services) | 2.5 hours |
| Phase 2 | State Management | 2 hours |
| Phase 3 | UI Components | 5 hours |
| Phase 4 | Integration | 5 hours |
| Phase 5 | Testing & Polish | 3 hours |
| **Total** | | **17.5 hours** |

**Adjusted Estimate**: 12-18 hours (accounting for debugging, iterations)

## Risk Assessment

### High Risk
1. **3D-to-2D Projection for Labels**
   - Risk: Label positioning might be complex
   - Mitigation: Reuse existing MeasurementOverlay logic

2. **Performance of Live Distance Updates**
   - Risk: 60 FPS updates might impact performance
   - Mitigation: Throttle updates to 16ms, use requestAnimationFrame

### Medium Risk
1. **Input Format Parsing**
   - Risk: Users might enter unexpected formats
   - Mitigation: Comprehensive regex patterns, good error messages

2. **Undo/Redo Integration**
   - Risk: Dimension edits might not save to history correctly
   - Mitigation: Use existing `saveToHistory()` pattern, add tests

### Low Risk
1. **UI Styling**
   - Risk: Inline styles might be verbose
   - Mitigation: Use style constants, follow existing patterns

2. **localStorage for Settings**
   - Risk: Settings might not persist
   - Mitigation: Use Zustand persist middleware (proven solution)

## Performance Considerations

### Optimization Strategies

1. **Debounce Input Parsing**
   - Debounce dimension input parsing by 200ms
   - Prevents excessive validation on every keystroke

2. **Throttle Distance Updates**
   - Update live distance label at most 60 times per second (16ms)
   - Use `requestAnimationFrame` for smooth updates

3. **Memoize Calculations**
   - Memoize dimension calculations (width, height, radius)
   - Only recalculate when shape changes

4. **Conditional Rendering**
   - Only render dimension labels for selected shapes
   - Hide labels when zoomed out significantly

### Performance Budget
- Dimension parsing: < 10ms
- Label rendering: < 16ms (60 FPS)
- Distance update: < 5ms
- Total overhead: < 2% frame time

## Accessibility

### ARIA Labels
- All input fields have proper `aria-label`
- Error messages linked with `aria-describedby`
- Dimension labels have `role="button"` and `aria-label="Edit dimension"`

### Keyboard Navigation
- Tab through dimension inputs
- Enter to confirm edit
- ESC to cancel edit
- Arrow keys to nudge values (future enhancement)

### Screen Reader Support
- Announce dimension changes: "Width changed to 10 meters"
- Announce distance updates: "Moved 5.5 meters"
- Error messages read immediately

## Constitution Compliance

✅ **Article 1**: All styling is inline
✅ **Article 2**: TypeScript strict mode enabled
✅ **Article 3**: Zustand for state management
✅ **Article 4**: React functional components with hooks
✅ **Article 5**: Integrates with existing 3D rendering
✅ **Article 6**: Unit tests for 70%+ coverage
✅ **Article 7**: Input validation prevents security issues
✅ **Article 8**: Edits existing files where possible
✅ **Article 9**: Canva-inspired styling (rounded, smooth)

## Dependencies

### Existing Systems
- `useAppStore.ts` - Shape creation, dragging
- `DrawingCanvas.tsx` - Shape drawing logic
- `ShapeRenderer.tsx` - Shape visualization
- `MeasurementOverlay.tsx` - 3D-to-2D projection pattern
- Conversion system - Unit conversion utilities

### New Dependencies
- None (all functionality using existing libraries)

## Migration Strategy

### No Breaking Changes
- All new features are additive
- Existing drawing workflows unchanged
- Dimension input is optional enhancement
- Can be disabled if issues arise

### Feature Flags (Optional)
```typescript
const ENABLE_DIMENSION_INPUT = true;
const ENABLE_INLINE_EDIT = true;
const ENABLE_LIVE_DISTANCE = true;
```

## Rollout Plan

### Phase 1: Internal Testing
1. Implement all features
2. Test with development team
3. Fix critical bugs

### Phase 2: Beta Release
1. Enable for power users
2. Gather feedback
3. Iterate on UI/UX

### Phase 3: General Release
1. Enable for all users
2. Add to onboarding tutorial
3. Create documentation

## Documentation

### User Documentation Needed
1. **Tutorial**: "Using Direct Dimension Input"
2. **Video**: "Create Precise Shapes with Dimension Input"
3. **Tooltip Help**: Explain input formats
4. **Keyboard Shortcut Reference**: Update with dimension shortcuts

### Developer Documentation Needed
1. **Architecture Doc**: Store structure and flow
2. **API Reference**: Dimension services
3. **Testing Guide**: How to test dimension features
4. **Troubleshooting**: Common issues and solutions

## Success Criteria

### Technical Success
- [ ] All tests passing (70%+ coverage)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance budget met
- [ ] Accessibility standards met (WCAG 2.1 AA)

### User Success
- [ ] Can type "10x15" and create exact rectangle
- [ ] Can click dimension label and edit inline
- [ ] Can see live distance while dragging
- [ ] Settings persist across sessions
- [ ] Error messages are helpful

### Product Success
- [ ] Feature used by 60%+ of users within 1 month
- [ ] Positive user feedback (4+ star rating)
- [ ] Reduces support tickets about precision
- [ ] Mentioned in user testimonials

---

**Next Step**: Break down into detailed tasks (`tasks.md`)
