# Technical Implementation Plan: Add Area Feature

**Spec ID**: 003
**Feature Name**: Add Area Feature
**Plan Version**: 1.0
**Created**: 2025-09-17

## Architecture Overview

### High-Level Design
The Add Area feature will be implemented as a modal-driven workflow that:
1. Opens a configuration modal from the toolbar
2. Processes user input for area, units, and shape type
3. Calculates appropriate shape dimensions
4. Creates a new layer and shape in the 3D scene
5. Integrates with existing editing capabilities

### Component Architecture
```
App.tsx
├── Toolbar (enhanced)
│   └── AddAreaButton (new)
├── AddAreaModal (new)
│   ├── AreaInput
│   ├── UnitSelector
│   ├── ShapeTypeSelector
│   └── ActionButtons
└── Scene
    ├── Layers (enhanced)
    └── Shapes (existing)
```

## Technical Approach

### State Management (Zustand)
```typescript
// Add to AppState interface
interface AppState {
  // ... existing state
  ui: {
    addAreaModalOpen: boolean;
    addAreaConfig: AddAreaConfig | null;
  };
  // ... existing actions
  openAddAreaModal: () => void;
  closeAddAreaModal: () => void;
  createAreaShape: (config: AddAreaConfig) => void;
}

interface AddAreaConfig {
  area: number;
  unit: AreaUnit;
  shapeType: 'square' | 'rectangle' | 'circle';
  aspectRatio?: number; // for rectangles
}
```

### Area Calculation Logic
```typescript
// New utility: areaShapeGenerator.ts
export const generateShapeFromArea = (
  area: number,
  unit: AreaUnit,
  shapeType: string,
  options?: { aspectRatio?: number }
): Point2D[] => {
  const areaInSquareMeters = convertToSquareMeters(area, unit);

  switch (shapeType) {
    case 'square':
      return generateSquareFromArea(areaInSquareMeters);
    case 'rectangle':
      return generateRectangleFromArea(areaInSquareMeters, options?.aspectRatio || 1.5);
    case 'circle':
      return generateCircleFromArea(areaInSquareMeters);
    default:
      throw new Error(`Unsupported shape type: ${shapeType}`);
  }
};
```

### Mathematical Formulas
```typescript
// Square: side = √area
const generateSquareFromArea = (area: number): Point2D[] => {
  const side = Math.sqrt(area);
  const half = side / 2;
  return [
    { x: -half, y: -half },
    { x: half, y: -half },
    { x: half, y: half },
    { x: -half, y: half }
  ];
};

// Rectangle: width = √(area × aspectRatio), height = area / width
const generateRectangleFromArea = (area: number, aspectRatio: number): Point2D[] => {
  const width = Math.sqrt(area * aspectRatio);
  const height = area / width;
  const halfW = width / 2;
  const halfH = height / 2;
  return [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH }
  ];
};

// Circle: radius = √(area / π), approximate with polygon
const generateCircleFromArea = (area: number): Point2D[] => {
  const radius = Math.sqrt(area / Math.PI);
  const segments = 32; // Smooth circle approximation
  const points: Point2D[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    points.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle)
    });
  }
  return points;
};
```

## File Structure

### New Files
```
app/src/
├── components/
│   ├── AddArea/
│   │   ├── AddAreaModal.tsx         # Main modal component
│   │   ├── AreaInput.tsx           # Area value input
│   │   ├── UnitSelector.tsx        # Unit dropdown
│   │   └── ShapeTypeSelector.tsx   # Shape type selection
│   └── Toolbar/
│       └── AddAreaButton.tsx       # Toolbar button
├── utils/
│   ├── areaShapeGenerator.ts       # Area-to-shape calculations
│   └── unitConversions.ts          # Unit conversion utilities
└── types/
    └── addArea.ts                  # TypeScript definitions
```

### Modified Files
```
app/src/
├── App.tsx                         # Add modal to render tree
├── store/useAppStore.ts           # Add modal state and actions
├── types/index.ts                 # Extend existing types
└── components/
    └── Ribbon.tsx                 # Add "Add Area" button
```

## Component Specifications

### AddAreaModal.tsx
```typescript
interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: AddAreaConfig) => void;
}

const AddAreaModal: React.FC<AddAreaModalProps> = ({ isOpen, onClose, onSubmit }) => {
  // Form state management
  // Validation logic
  // Unit conversion display
  // Keyboard shortcuts (Enter/Esc)
  // Error handling and display
};
```

### Modal Features
- **Responsive Design**: Works on mobile and desktop
- **Validation**: Real-time input validation with error messages
- **Preview**: Show calculated dimensions before creation
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Integration Points

### Toolbar Integration
```typescript
// In Ribbon.tsx, add to Area Configuration section
<button
  onClick={() => useAppStore.getState().openAddAreaModal()}
  style={{
    // Canva-inspired button styling
    background: 'linear-gradient(135deg, #10B981, #059669)',
    // ... other styles
  }}
  title="Add Area"
>
  <AddIcon />
  Add Area
</button>
```

### Layer Management
```typescript
// Auto-create layer with descriptive name
const createAreaShape = (config: AddAreaConfig) => {
  const layerName = `Area: ${config.area} ${config.unit}`;
  const newLayer = createLayer(layerName);

  const shape = generateShapeFromConfig(config);
  addShapeToLayer(shape, newLayer.id);
};
```

### Scene Positioning
```typescript
// Position shape at scene center or last interaction point
const getShapePosition = (): Point2D => {
  const lastInteraction = getLastInteractionPoint();
  return lastInteraction || { x: 0, y: 0 }; // Scene center
};
```

## Data Flow

### User Interaction Flow
1. **User clicks "Add Area"** → `openAddAreaModal()` called
2. **User fills form** → Local state updates with validation
3. **User clicks "Create"** → `createAreaShape(config)` called
4. **System generates shape** → Calculate dimensions and points
5. **Shape added to scene** → New layer and shape created
6. **Modal closes** → Return to normal mode

### State Updates
```typescript
// Modal opening
set(state => ({
  ui: { ...state.ui, addAreaModalOpen: true }
}));

// Shape creation
set(state => ({
  layers: [...state.layers, newLayer],
  shapes: [...state.shapes, newShape],
  activeLayerId: newLayer.id,
  ui: { ...state.ui, addAreaModalOpen: false }
}));
```

## Error Handling

### Input Validation
- **Area Value**: Must be positive number, reasonable range (0.1 - 1,000,000)
- **Unit Selection**: Must be valid area unit
- **Shape Type**: Must be supported shape type

### Runtime Errors
- **Calculation Errors**: Handle edge cases in area calculations
- **Rendering Errors**: Ensure generated shapes don't break 3D scene
- **Memory Errors**: Prevent creation of overly complex shapes

### User Feedback
```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

const validateAreaInput = (area: number): ValidationError | null => {
  if (area <= 0) return { field: 'area', message: 'Area must be positive', code: 'NEGATIVE_AREA' };
  if (area > 1000000) return { field: 'area', message: 'Area too large', code: 'AREA_TOO_LARGE' };
  return null;
};
```

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load modal components only when needed
- **Memoization**: Cache complex calculations and rendering
- **Debouncing**: Debounce real-time validation and preview updates
- **Shape Complexity**: Limit circle polygon segments based on area size

### Memory Management
- **Modal Cleanup**: Properly unmount modal when closed
- **Shape Optimization**: Use appropriate detail levels for generated shapes
- **State Efficiency**: Minimize unnecessary re-renders

## Testing Strategy

### Unit Tests
```typescript
// Test area calculations
describe('areaShapeGenerator', () => {
  test('generates correct square from area', () => {
    const points = generateSquareFromArea(100); // 10x10 square
    expect(calculateArea(points)).toBeCloseTo(100, 2);
  });

  test('handles unit conversions correctly', () => {
    const sqft = convertToSquareMeters(1000, 'sqft');
    expect(sqft).toBeCloseTo(92.903, 2);
  });
});
```

### Integration Tests
```typescript
// Test modal workflow
describe('AddAreaModal', () => {
  test('creates shape with correct area', async () => {
    render(<AddAreaModal isOpen={true} onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText('Area'), { target: { value: '3000' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'm²' } });
    fireEvent.click(screen.getByText('Create'));

    expect(mockSubmit).toHaveBeenCalledWith({
      area: 3000,
      unit: 'm²',
      shapeType: 'square'
    });
  });
});
```

### End-to-End Tests
- Complete workflow from button click to shape creation
- Cross-browser compatibility testing
- Mobile responsiveness validation

## Security Considerations

### Input Sanitization
```typescript
const sanitizeAreaInput = (input: string): number => {
  const num = parseFloat(input.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : Math.max(0, Math.min(num, MAX_AREA));
};
```

### Validation
- Server-side validation (if applicable in future)
- XSS prevention in input handling
- DoS prevention through input limits

## Constitution Compliance

### Article 1: Inline Styles Only ✓
All styling will use inline styles following existing patterns

### Article 2: TypeScript Strict Mode ✓
Full TypeScript implementation with strict type checking

### Article 3: Zustand State Management ✓
Integration with existing Zustand store

### Article 4: React Best Practices ✓
Proper hooks usage, memoization, and component structure

### Article 5: 3D Rendering Standards ✓
Integration with existing Three.js/React Three Fiber setup

### Article 6: Testing Requirements ✓
70% test coverage target with comprehensive test suite

### Article 7: Security First ✓
Input validation and sanitization throughout

### Article 8: Edit Existing Files ✓
Preference for enhancing existing components over new files

### Article 9: Professional UX ✓
Canva-inspired design system adherence

## Deployment Considerations

### Feature Flags
```typescript
const FEATURES = {
  ADD_AREA_ENABLED: process.env.NODE_ENV === 'development' || process.env.ADD_AREA_FEATURE === 'true'
};
```

### Progressive Rollout
1. **Development**: Full feature available
2. **Testing**: Feature flag controlled rollout
3. **Production**: Gradual user base exposure

### Monitoring
- Track feature usage metrics
- Monitor error rates and user feedback
- Performance impact assessment

---

**Next Steps**: Proceed to detailed task breakdown and implementation timeline.