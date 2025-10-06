# Spec 013: Direct Dimension Input System

**Status**: Draft
**Created**: 2025-10-06
**Author**: SmartDraw Feature Analysis
**Priority**: High (Phase 1 - Must Have)
**Estimated Effort**: 8-12 hours

## Overview

Implement a comprehensive direct dimension input system that allows users to type exact dimensions for shapes instead of drawing them manually. This feature is critical for professional CAD/land planning workflows where precision is paramount. Users should be able to type dimensions like "10m x 15m" before drawing, edit dimensions inline after selection, and see live distance feedback during operations.

## Problem Statement

Currently, users must:
1. **Draw shapes manually** with mouse, making precise dimensions difficult
2. **Rely entirely on grid snapping** for accuracy
3. **Use external calculators** to verify dimensions
4. **Repeat drawing** if dimensions are slightly off

This workflow is:
- **Time-consuming** for users who know exact dimensions
- **Imprecise** compared to professional CAD tools
- **Frustrating** for users with survey data or blueprints
- **Not professional-grade** for real estate/architectural work

**Industry Standard**: AutoCAD, SmartDraw, SketchUp all allow typing dimensions directly.

## User Stories

### Primary User Story
**As a** land surveyor with exact property measurements
**I want to** type dimensions directly (e.g., "25.5m x 18.3m")
**So that** I can create accurate property boundaries without manual drawing

**Acceptance Criteria**:
- [ ] Can type dimensions before clicking to place shape
- [ ] System parses various formats: "10x15", "10m x 15m", "10 x 15 meters"
- [ ] Shape appears with exact dimensions specified
- [ ] Grid snapping still works for placement position
- [ ] Can press ESC to cancel dimension input and return to normal drawing

### Secondary User Story
**As a** property planner reviewing existing shapes
**I want to** click a shape and edit its dimensions inline
**So that** I can adjust dimensions without redrawing

**Acceptance Criteria**:
- [ ] Selecting a shape shows current dimensions
- [ ] Can click dimension to edit (inline input field)
- [ ] Typing new dimension updates shape in real-time
- [ ] Can edit width/height independently for rectangles
- [ ] Can edit radius for circles
- [ ] Changes are saved to undo/redo history

### Tertiary User Story
**As a** precision-focused user
**I want to** see live distance measurements while dragging shapes
**So that** I know exactly how far I'm moving objects

**Acceptance Criteria**:
- [ ] Dragging a shape shows distance from original position
- [ ] Distance appears as floating label near cursor
- [ ] Shows distance in current unit preference (meters, feet, etc.)
- [ ] Updates in real-time as mouse moves
- [ ] Disappears when drag completes

## Functional Requirements

### FR1: Pre-Draw Dimension Input (Type-Before-Draw)

**Trigger**: User selects Rectangle or Circle tool, then starts typing numbers

**Behavior**:
1. **Input Detection**: System detects number key press when tool is active
2. **Input UI Appears**: Small input box appears near cursor or in toolbar
3. **User Types Dimension**: e.g., "10x15", "10m x 15m", "25.5 x 18.3m"
4. **Parser Validates**: System parses and validates input
5. **Click to Place**: User clicks canvas to place shape at exact dimensions
6. **Shape Created**: Shape appears with precise dimensions specified

**Input Formats Supported**:
```
Rectangles:
- "10x15" → 10m × 15m rectangle
- "10 x 15" → 10m × 15m rectangle
- "10m x 15m" → 10m × 15m rectangle
- "33ft x 50ft" → 33ft × 50ft rectangle (converted to meters internally)
- "10.5 x 20.75" → 10.5m × 20.75m rectangle

Circles:
- "5" → radius 5m
- "5m" → radius 5m
- "r5" → radius 5m
- "d10" → diameter 10m (radius 5m)
- "diameter 10" → diameter 10m

Polylines/Lines:
- "15" → next segment length 15m
- "15@45" → 15m at 45° angle (polar input)
- "15m@45deg" → 15m at 45°
```

**Validation Rules**:
- Numbers must be positive
- Width/height must be > 0.1m (prevent too-small shapes)
- Max dimension: 1000m (prevent accidentally huge shapes)
- If invalid input, show error message: "Invalid format. Try: 10x15 or 10m x 15m"

**UI Location Options** (AMBIGUITY - Choose one):
- **Option A**: Floating input box near cursor
- **Option B**: Input field in ribbon toolbar
- **Option C**: Modal dialog that appears on first keystroke
- **Recommendation**: Option B (toolbar) - always visible, doesn't obscure canvas

### FR2: Post-Selection Dimension Editing (Inline Edit)

**Trigger**: User selects a shape → dimension labels appear

**Behavior**:
1. **Shape Selected**: User clicks shape in select tool mode
2. **Dimensions Display**: Labels show current dimensions (e.g., "10.0m × 15.0m")
3. **Click to Edit**: User clicks a dimension label
4. **Inline Input**: Label becomes editable input field
5. **Type New Value**: User types new dimension
6. **Shape Updates**: Shape resizes in real-time as user types
7. **Press Enter**: Confirms change, saves to history
8. **Press ESC**: Cancels edit, reverts to original

**Visual Design**:
```
┌─────────────────────┐
│                     │  ← 15.0m (click to edit)
│                     │
│      SHAPE          │
│                     │
│                     │
└─────────────────────┘
    10.0m (click to edit)
```

**Edit Modes by Shape Type**:
- **Rectangle**: Edit width and height independently
- **Circle**: Edit radius or diameter (toggle with 'r'/'d' key)
- **Polygon**: Edit overall scale or individual edge lengths (advanced)
- **Line**: Edit length (adjusts endpoint position)

**Constraints**:
- Editing maintains shape center position by default
- Hold Shift while editing to resize from corner instead
- Aspect ratio locked by default, press 'A' to unlock
- Changes respect grid snapping if enabled

### FR3: Live Distance Display During Drag

**Trigger**: User drags a shape with Select tool

**Behavior**:
1. **Start Drag**: User clicks and holds on shape
2. **Distance Label Appears**: Shows "0.0m" initially
3. **Drag Shape**: Label updates to show distance from start position
4. **Release Mouse**: Label fades out after 500ms

**Visual Design**:
```
      ┌──────────┐
      │  SHAPE   │ ← dragging
      └──────────┘
         ↓
    "3.5m moved"
```

**Display Format**:
- Show distance in current unit (meters/feet)
- Update at 60 FPS for smooth feedback
- 2 decimal places for precision
- Optional: Show X/Y components ("3.5m east, 2.1m north")

**Additional Context**:
- Show distance to nearest shape edge (if < 5m away)
- Show distance to nearest grid line (if snapping enabled)
- Color code: Blue (normal), Green (snap point nearby), Purple (equal spacing detected)

### FR4: Precision Settings Panel

**Location**: Properties panel → "Precision Settings" section

**Settings**:
1. **Snap Precision**
   - Dropdown: 0.1m, 0.5m, 1m, 5m, Custom
   - Custom allows typing any value (e.g., 0.25m)

2. **Display Precision**
   - Decimal places for measurements: 0, 1, 2, 3, 4
   - Affects all dimension displays

3. **Unit Preference**
   - Dropdown: Meters, Feet, Yards, etc. (use existing conversion system)
   - Remembered in localStorage

4. **Angle Snap**
   - Dropdown: 15°, 30°, 45°, 90°, Custom
   - For polar input and rotation

5. **Auto-Convert Units**
   - Toggle: If user types "50ft", auto-convert to meters (or keep as-is)

## Non-Functional Requirements

### NFR1: Performance
- Input parsing must complete in < 10ms
- Live dimension updates must maintain 60 FPS
- No perceptible lag when typing in input fields

### NFR2: Accessibility
- All input fields have proper ARIA labels
- Tab navigation works correctly
- Keyboard shortcuts don't conflict with dimension input
- Screen reader announces dimension changes

### NFR3: Compatibility
- Works in 2D and 3D view modes
- Works with all existing drawing tools
- Doesn't break undo/redo functionality
- Integrates with existing grid snapping system

### NFR4: Data Validation
- All numeric inputs validated before use
- Prevents division by zero, negative dimensions, NaN
- Graceful error handling with user-friendly messages

## Edge Cases

### EC1: Invalid Input Formats
**Scenario**: User types "abc" or "10x" or "x15"
**Expected**: Show error message, keep input field open for correction
**Example**: "Invalid format. Expected: 10x15 or 10m x 15m"

### EC2: Extremely Large/Small Dimensions
**Scenario**: User types "0.01x0.01" or "10000x10000"
**Expected**:
- < 0.1m: Show warning "Dimension too small, minimum 0.1m"
- > 1000m: Show warning "Dimension too large, maximum 1000m"

### EC3: Conflicting with Keyboard Shortcuts
**Scenario**: User has dimension input active, types "R" for rectangle tool
**Expected**:
- If input field has focus: "R" is typed as character
- If input field loses focus: "R" activates Rectangle tool
- Clear distinction between input mode and command mode

### EC4: Unit Mixing
**Scenario**: User types "10m x 50ft"
**Expected**: Convert all to base unit (meters), create 10m × 15.24m rectangle
**Alternative**: Show error "Cannot mix units, use one unit type"
**Decision**: Auto-convert to be user-friendly

### EC5: Dimension Input During Active Drawing
**Scenario**: User is halfway through drawing polyline, starts typing
**Expected**: Dimension input applies to next segment length
**Example**: Drawing polyline → type "15" → next click creates 15m segment

### EC6: Editing Locked Shapes
**Scenario**: User tries to edit dimensions of locked shape
**Expected**: Input field is disabled/read-only with tooltip "Shape is locked"

### EC7: Multi-Selection Dimension Edit
**Scenario**: User selects 3 shapes, tries to edit dimensions
**Expected**:
- **Option A**: Edit all shapes proportionally
- **Option B**: Disable dimension editing for multi-selection
- **Recommendation**: Option B - too ambiguous to edit multiple shapes at once

## UI/UX Requirements

### Dimension Input Toolbar Component

**Location**: Ribbon toolbar, right side (after drawing tools)

**Layout**:
```
┌─────────────────────────────────┐
│ 📏 Dimensions: [10  ] x [15  ] │ ← Input fields
│                                 │
│ Unit: [Meters ▼] Precision: 2  │ ← Settings
└─────────────────────────────────┘
```

**States**:
- **Inactive**: Grayed out when no dimension-compatible tool selected
- **Active**: Visible when Rectangle/Circle/Line tool active
- **Focused**: Blue border when typing
- **Error**: Red border + error message below

**Styling** (Canva-inspired):
```typescript
const dimensionInputStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'Nunito Sans, sans-serif',
};

const inputFieldStyle = {
  width: '80px',
  padding: '6px 8px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '14px',
  textAlign: 'center',
  transition: 'border-color 200ms',
};

const errorStyle = {
  color: '#EF4444',
  fontSize: '12px',
  marginTop: '4px',
};
```

### Inline Dimension Labels

**Appearance**:
- White background with subtle shadow
- Blue text (#3B82F6) to indicate clickable
- Rounded corners (4px)
- Small click target for easy editing

**Position**:
- Rectangles: Width below bottom edge, height to right of right edge
- Circles: Radius from center to edge with arrow
- Polygons: Edge lengths at midpoint of each edge (advanced)

**Interaction**:
- Hover: Background changes to light blue (#EFF6FF)
- Click: Becomes input field with current value selected
- Type: Updates in real-time with 200ms debounce
- Enter: Confirms and exits edit mode
- ESC: Cancels and reverts to original

### Live Distance Label

**Appearance**:
- Semi-transparent white background (rgba(255,255,255,0.9))
- Dark gray text (#1F2937)
- Drop shadow for readability
- Updates smoothly (no jitter)

**Position**:
- Offset 20px down and 20px right from cursor
- Avoids overlapping with shape being dragged
- Always visible (not clipped by canvas edges)

**Animation**:
- Fade in over 150ms when drag starts
- Fade out over 300ms when drag ends
- Smooth value transitions (no sudden jumps)

## Technical Design

### New Files to Create

```
app/src/components/DimensionInput/
├── DimensionInputToolbar.tsx       # Toolbar component for pre-draw input
├── InlineDimensionLabel.tsx        # Clickable dimension labels on shapes
├── LiveDistanceLabel.tsx           # Floating distance during drag
└── PrecisionSettingsPanel.tsx      # Settings in Properties panel

app/src/services/
├── dimensionParser.ts              # Parse "10x15" format strings
├── dimensionFormatter.ts           # Format numbers as "10.0m × 15.0m"
└── dimensionValidator.ts           # Validate input ranges

app/src/store/
└── useDimensionStore.ts            # Store for dimension input state

app/src/types/
└── dimension.ts                    # TypeScript types for dimensions

app/src/utils/
└── unitConverter.ts                # Unit conversion utilities (extend existing)
```

### Store Structure (useDimensionStore.ts)

```typescript
interface DimensionState {
  // Pre-draw input state
  isDimensionInputActive: boolean;
  inputWidth: string;
  inputHeight: string;
  inputRadius: string;
  inputUnit: string;
  inputError: string | null;

  // Inline edit state
  isEditingDimension: boolean;
  editingShapeId: string | null;
  editingDimensionType: 'width' | 'height' | 'radius' | null;
  editingValue: string;

  // Live distance state
  isShowingDistance: boolean;
  distanceFromStart: number;
  distanceUnit: string;

  // Precision settings
  snapPrecision: number; // 0.1, 0.5, 1, 5
  displayPrecision: number; // decimal places: 0-4
  preferredUnit: string; // 'm', 'ft', 'yd'
  angleSnap: number; // 15, 30, 45, 90

  // Actions
  setDimensionInput: (width: string, height: string) => void;
  clearDimensionInput: () => void;
  startEditingDimension: (shapeId: string, type: string) => void;
  updateEditingValue: (value: string) => void;
  confirmDimensionEdit: () => void;
  cancelDimensionEdit: () => void;
  showDistance: (distance: number) => void;
  hideDistance: () => void;
  setPrecisionSettings: (settings: Partial<PrecisionSettings>) => void;
}
```

### Dimension Parser Service

```typescript
// dimensionParser.ts
interface ParsedDimension {
  width: number;
  height: number;
  unit: string;
  valid: boolean;
  error?: string;
}

export const parseDimension = (input: string): ParsedDimension => {
  // Patterns to match:
  // "10x15", "10 x 15", "10m x 15m", "10.5 x 20.75m", etc.

  const patterns = [
    /^(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(m|ft|yd)?$/i,
    /^(\d+\.?\d*)(m|ft|yd)?\s*x\s*(\d+\.?\d*)(m|ft|yd)?$/i,
  ];

  for (const pattern of patterns) {
    const match = input.trim().match(pattern);
    if (match) {
      const width = parseFloat(match[1]);
      const height = parseFloat(match[2]);
      const unit = match[3] || 'm'; // default meters

      // Validation
      if (isNaN(width) || isNaN(height)) {
        return { width: 0, height: 0, unit: 'm', valid: false, error: 'Invalid numbers' };
      }
      if (width < 0.1 || height < 0.1) {
        return { width, height, unit, valid: false, error: 'Dimensions too small (min 0.1m)' };
      }
      if (width > 1000 || height > 1000) {
        return { width, height, unit, valid: false, error: 'Dimensions too large (max 1000m)' };
      }

      return { width, height, unit, valid: true };
    }
  }

  return { width: 0, height: 0, unit: 'm', valid: false, error: 'Invalid format. Try: 10x15 or 10m x 15m' };
};

export const parseRadius = (input: string): ParsedDimension => {
  // Patterns: "5", "5m", "r5", "d10" (diameter), "diameter 10"
  const radiusPattern = /^r?(\d+\.?\d*)(m|ft|yd)?$/i;
  const diameterPattern = /^d(?:iameter)?\s*(\d+\.?\d*)(m|ft|yd)?$/i;

  let match = input.trim().match(radiusPattern);
  if (match) {
    const radius = parseFloat(match[1]);
    const unit = match[2] || 'm';
    return { width: radius, height: radius, unit, valid: true };
  }

  match = input.trim().match(diameterPattern);
  if (match) {
    const diameter = parseFloat(match[1]);
    const radius = diameter / 2;
    const unit = match[2] || 'm';
    return { width: radius, height: radius, unit, valid: true };
  }

  return { width: 0, height: 0, unit: 'm', valid: false, error: 'Invalid format. Try: 5, r5, or d10' };
};
```

### Integration Points

#### 1. DrawingCanvas.tsx
- Detect when dimension input is active
- Use dimensions from store when creating shapes
- If `isDimensionInputActive === true`, create shape with exact dimensions

```typescript
// In handleClick for rectangle tool:
const { isDimensionInputActive, inputWidth, inputHeight, clearDimensionInput } = useDimensionStore();

if (isDimensionInputActive) {
  const width = parseFloat(inputWidth);
  const height = parseFloat(inputHeight);

  // Create rectangle with exact dimensions at click position
  const newShape = {
    type: 'rectangle',
    points: [
      { x: clickX - width/2, y: clickY - height/2 },
      { x: clickX + width/2, y: clickY + height/2 }
    ]
  };

  clearDimensionInput();
  return;
}

// Otherwise, proceed with normal drawing mode
```

#### 2. ShapeRenderer.tsx
- Render inline dimension labels for selected shapes
- Handle click events on labels to enter edit mode
- Update shape dimensions when editing

```typescript
// Add dimension labels for selected shapes
{isSelected && !shape.locked && (
  <>
    <InlineDimensionLabel
      shapeId={shape.id}
      dimension="width"
      value={calculateWidth(shape)}
      position={getLabelPosition(shape, 'width')}
    />
    <InlineDimensionLabel
      shapeId={shape.id}
      dimension="height"
      value={calculateHeight(shape)}
      position={getLabelPosition(shape, 'height')}
    />
  </>
)}
```

#### 3. App.tsx
- Add DimensionInputToolbar to ribbon
- Add PrecisionSettingsPanel to Properties sidebar
- Wire up keyboard detection for starting dimension input

```typescript
// In ribbon toolbar:
<DimensionInputToolbar />

// In Properties panel:
<PrecisionSettingsPanel />

// Global keyboard handler:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const { activeTool } = useAppStore.getState();
    const { isDimensionInputActive } = useDimensionStore.getState();

    // If rectangle/circle tool active and user types number, activate dimension input
    if ((activeTool === 'rectangle' || activeTool === 'circle') &&
        /^\d$/.test(e.key) &&
        !isDimensionInputActive) {
      useDimensionStore.getState().setDimensionInput(e.key, '');
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### 4. Drag System Enhancement
- Detect drag start position
- Calculate distance during drag
- Show live distance label
- Hide label on drag end

```typescript
// In startDragging action:
const startDragging = (shapeId: string, startPosition: Point2D) => {
  set({
    isDragging: true,
    draggedShapeId: shapeId,
    dragStartPosition: startPosition
  });
  useDimensionStore.getState().showDistance(0);
};

// In updateDragging action:
const updateDragging = (currentPosition: Point2D) => {
  const { dragStartPosition } = get();
  if (!dragStartPosition) return;

  const distance = Math.sqrt(
    Math.pow(currentPosition.x - dragStartPosition.x, 2) +
    Math.pow(currentPosition.y - dragStartPosition.y, 2)
  );

  useDimensionStore.getState().showDistance(distance);
};

// In endDragging action:
const endDragging = () => {
  set({ isDragging: false, draggedShapeId: null, dragStartPosition: null });
  useDimensionStore.getState().hideDistance();
};
```

## Testing Requirements

### Unit Tests

```typescript
// dimensionParser.test.ts
describe('parseDimension', () => {
  it('should parse "10x15" as 10m × 15m', () => {
    const result = parseDimension('10x15');
    expect(result).toEqual({ width: 10, height: 15, unit: 'm', valid: true });
  });

  it('should parse "10m x 15m"', () => {
    const result = parseDimension('10m x 15m');
    expect(result).toEqual({ width: 10, height: 15, unit: 'm', valid: true });
  });

  it('should parse "33ft x 50ft"', () => {
    const result = parseDimension('33ft x 50ft');
    expect(result).toEqual({ width: 33, height: 50, unit: 'ft', valid: true });
  });

  it('should handle decimal values', () => {
    const result = parseDimension('10.5 x 20.75');
    expect(result).toEqual({ width: 10.5, height: 20.75, unit: 'm', valid: true });
  });

  it('should reject invalid formats', () => {
    const result = parseDimension('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid format');
  });

  it('should reject too-small dimensions', () => {
    const result = parseDimension('0.01 x 0.01');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too small');
  });
});

// dimensionFormatter.test.ts
describe('formatDimension', () => {
  it('should format with correct precision', () => {
    expect(formatDimension(10.5, 2, 'm')).toBe('10.50m');
    expect(formatDimension(10.5, 1, 'm')).toBe('10.5m');
    expect(formatDimension(10.5, 0, 'm')).toBe('11m');
  });
});
```

### Integration Tests

```typescript
// DimensionInput.integration.test.tsx
describe('Dimension Input Integration', () => {
  it('should create rectangle with typed dimensions', async () => {
    const { getByTestId, getByRole } = render(<App />);

    // Select rectangle tool
    fireEvent.click(getByTestId('rectangle-tool'));

    // Type dimensions
    const widthInput = getByTestId('dimension-width-input');
    fireEvent.change(widthInput, { target: { value: '10' } });
    fireEvent.change(getByTestId('dimension-height-input'), { target: { value: '15' } });

    // Click canvas
    const canvas = getByRole('region', { name: /3d scene/i });
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    // Verify shape created with exact dimensions
    const shapes = useAppStore.getState().shapes;
    expect(shapes).toHaveLength(1);
    expect(calculateWidth(shapes[0])).toBeCloseTo(10, 2);
    expect(calculateHeight(shapes[0])).toBeCloseTo(15, 2);
  });

  it('should edit dimension inline', async () => {
    // Create a shape
    const { getByTestId } = render(<App />);
    // ... create shape ...

    // Select shape
    fireEvent.click(getByTestId(`shape-${shapeId}`));

    // Click dimension label
    const widthLabel = getByTestId(`dimension-label-width-${shapeId}`);
    fireEvent.click(widthLabel);

    // Edit value
    const input = getByTestId(`dimension-input-width-${shapeId}`);
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Verify shape updated
    const updatedShape = useAppStore.getState().shapes.find(s => s.id === shapeId);
    expect(calculateWidth(updatedShape)).toBeCloseTo(20, 2);
  });
});
```

### Manual Test Cases

1. **Pre-Draw Input**
   - [ ] Type "10x15" → Click canvas → Rectangle appears with exact dimensions
   - [ ] Type "5" in circle mode → Click → Circle with radius 5m appears
   - [ ] Type invalid input → See error message
   - [ ] Press ESC during input → Input cleared, normal drawing resumes

2. **Inline Edit**
   - [ ] Select rectangle → Click width label → Type "20" → Press Enter → Width changes to 20m
   - [ ] Select circle → Click radius → Type "8" → Radius updates to 8m
   - [ ] Try to edit locked shape → Input is disabled

3. **Live Distance**
   - [ ] Drag shape → See distance label appear
   - [ ] Drag 5m → Label shows "5.0m"
   - [ ] Release → Label fades out
   - [ ] Drag with grid snap → Label shows snapped distance

4. **Precision Settings**
   - [ ] Change snap precision to 0.5m → Grid snapping uses 0.5m increments
   - [ ] Change display precision to 3 decimals → All dimensions show 3 decimals
   - [ ] Change unit to feet → All dimensions display in feet

## Success Metrics

### Quantitative
- **Dimension input used in 60%+** of shape creations by power users
- **Average time to create precise shape** reduced from 15s to 5s
- **User errors** (wrong dimensions) reduced by 80%
- **Feature adoption rate** > 70% within first month

### Qualitative
- Users report feeling "more professional" using the tool
- Positive feedback on precision and control
- Feature mentioned in user reviews/testimonials
- Reduced support tickets about "how to make exact dimensions"

## Open Questions / Ambiguities

1. **AMBIGUITY**: Where should pre-draw dimension input UI be located?
   - **Option A**: Floating near cursor
   - **Option B**: Fixed in toolbar
   - **Option C**: Modal dialog
   - **Recommendation**: Option B (toolbar) for consistency

2. **AMBIGUITY**: Should unit mixing be allowed (e.g., "10m x 50ft")?
   - **Option A**: Auto-convert all to base unit
   - **Option B**: Show error, require single unit
   - **Recommendation**: Option A (auto-convert) for user-friendliness

3. **AMBIGUITY**: How to handle dimension editing for multi-selection?
   - **Option A**: Edit all proportionally
   - **Option B**: Disable for multi-selection
   - **Recommendation**: Option B (too complex for Phase 1)

4. **AMBIGUITY**: Should live distance show X/Y components or just total?
   - **Option A**: Total distance only
   - **Option B**: Total + X/Y components
   - **Recommendation**: Option A for Phase 1, Option B as enhancement

## Dependencies

- Existing unit conversion system (`utils/conversion.ts`)
- Existing grid snapping system (`DrawingCanvas.tsx`)
- Existing shape creation logic (`useAppStore.ts`)
- Existing undo/redo system (must integrate dimension edits)

## Future Enhancements (Out of Scope for Phase 1)

1. **Polar Input**: Type "15@45" for 15m at 45° angle
2. **Constraint System**: Type "w=h" to force square
3. **Expression Evaluation**: Type "10*1.5" or "15/2" for calculations
4. **Dimension Chains**: Show cumulative dimensions for polylines
5. **Auto-Dimensioning**: Automatically add dimension lines like CAD
6. **Dimension Styles**: Different arrow styles, text positions
7. **Import Dimensions from CSV**: Batch create shapes from spreadsheet
8. **Voice Input**: "Create rectangle ten by fifteen meters"

## References

- SmartDraw precision system
- AutoCAD dimension input
- SketchUp measurement tools
- Figma dimension display
- Land Visualizer existing measurement feature (FR4)

---

**Next Steps**:
1. Review and approve specification
2. Create implementation plan (`plan.md`)
3. Break down into tasks (`tasks.md`)
4. Implement Phase 1 features
5. User testing and iteration
