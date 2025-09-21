# Visual Comparison Tool

The Visual Comparison Tool allows users to understand their land size by comparing it to familiar reference objects like sports fields, buildings, landmarks, and natural references.

## Features

### Reference Object Categories

#### Sports Venues (5 objects)
- Soccer Field (FIFA) - 7,140 m²
- American Football Field - 5,351 m²
- Basketball Court (FIBA) - 420 m²
- Tennis Court (Singles) - 195.65 m²
- Olympic Swimming Pool - 1,250 m²

#### Buildings (4 objects)
- Average House (US) - 200 m²
- Parking Space (Standard) - 12.5 m²
- City Block (Manhattan) - 82,000 m²
- Walmart Supercenter - 18,000 m²

#### Landmarks (3 objects)
- Eiffel Tower Base - 15,625 m²
- Statue of Liberty Base - 4,047 m²
- Big Ben Tower Base - 144 m²

#### Nature (4 objects)
- Central Park - 3,410,000 m²
- Acre (Traditional) - 4,047 m²
- Garden Plot (Typical) - 100 m²
- Football Field - 5,351 m²

### User Interface

#### Desktop Panel
- **Location**: Fixed panel on the right side of the screen
- **Expandable sections**: Categorized object lists with expand/collapse functionality
- **Search**: Real-time debounced search functionality
- **Category tabs**: Filter objects by category (All, Sports, Buildings, Landmarks, Nature)
- **Toggle switches**: Individual object visibility controls
- **Calculations section**: Live comparison results with visual progress bars

#### Mobile Panel
- **Layout**: Bottom sheet modal overlay
- **Tabs**: Split interface between "Reference Objects" and "Comparisons"
- **Touch-optimized**: Large touch targets and swipe gestures
- **Responsive detection**: Automatically switches at 768px breakpoint

### 3D Visualization

#### Object Rendering
- **Smart positioning**: Spiral pattern algorithm avoids overlaps
- **Collision detection**: Ensures objects don't intersect with user's land
- **Hover effects**: Interactive labels with object details
- **Visual styling**: Semi-transparent objects with colored outlines

#### Positioning Algorithm
- **Safe distance**: Maintains minimum 20m or 20% of land size buffer
- **Grid spacing**: Organizes objects with consistent spacing
- **Size sorting**: Places larger objects first for better organization
- **Fallback positioning**: Handles edge cases gracefully

### Calculation Engine

#### Real-time Calculations
- **Quantity comparisons**: "25 houses fit in your land"
- **Percentage calculations**: "4.0% of your land"
- **Size ratios**: Handles objects larger than user's land
- **Human-readable descriptions**: Contextual explanations

#### Precision
- **Shoelace formula**: Accurate polygon area calculations
- **Shape support**: Works with rectangles, circles, polygons, and polylines
- **Unit consistency**: All calculations in square meters
- **Formatted output**: Locale-aware number formatting

## Technical Implementation

### Architecture
```
ComparisonPanel/
├── ComparisonPanel.tsx        # Main desktop panel component
├── MobileComparisonPanel.tsx  # Mobile-optimized version
├── ObjectList.tsx             # Categorized object display
├── SearchSection.tsx          # Search input with debouncing
├── CategoryTabs.tsx           # Category filter buttons
├── CalculationsSection.tsx    # Results display
└── index.ts                   # Component exports

Scene/
└── ReferenceObjectRenderer.tsx # 3D object visualization

utils/
├── objectPositioning.ts       # Smart positioning algorithm
└── comparisonCalculations.ts  # Calculation engine

data/
└── referenceObjects.ts        # Object database

types/
└── referenceObjects.ts        # TypeScript interfaces
```

### State Management
- **Zustand store**: Integrated with existing app state
- **Comparison state**: Tracks visible objects, search, categories
- **Calculations cache**: Automatic recalculation on changes
- **History support**: State included in undo/redo system

### Performance Optimizations
- **Memoization**: Expensive calculations cached
- **Debounced search**: 300ms delay prevents excessive re-renders
- **Conditional rendering**: Mobile/desktop components loaded as needed
- **Geometry caching**: 3D objects cached for reuse

## Usage

### Opening the Tool
1. Click the "Compare" button in the ribbon toolbar
2. The comparison panel opens on the right side (desktop) or as bottom sheet (mobile)

### Selecting Objects
1. Browse objects by category or use search
2. Click toggle switches to add/remove objects
3. Objects appear immediately in the 3D scene

### Viewing Comparisons
1. Switch to "Comparisons" tab (mobile) or scroll down (desktop)
2. View quantity calculations and percentages
3. See visual progress bars and detailed descriptions

### 3D Interaction
1. Hover over objects in the scene to see labels
2. Objects are positioned automatically around your land
3. Semi-transparent appearance maintains land visibility

## Integration Points

### With Drawing System
- **Land bounds calculation**: Uses existing shape data
- **Real-time updates**: Recalculates when shapes change
- **Coordinate system**: Integrates with 3D scene coordinates

### With Scene Manager
- **Child component**: Rendered within existing scene
- **Camera integration**: Uses existing camera and canvas refs
- **Lighting system**: Objects use scene lighting

### With Mobile System
- **Responsive design**: Automatic mobile detection
- **Touch optimization**: Mobile-specific interactions
- **Viewport handling**: Adapts to different screen sizes

## Configuration

### Object Database
```typescript
export const REFERENCE_OBJECTS: ReferenceObject[] = [
  {
    id: 'soccer-field-fifa',
    name: 'Soccer Field (FIFA)',
    category: 'sports',
    area: 7140,
    dimensions: { length: 105, width: 68, height: 0.1 },
    geometry: { type: 'box' },
    material: { color: '#10b981', opacity: 0.7 },
    metadata: {
      description: 'Official FIFA regulation soccer field',
      source: 'FIFA Laws of the Game',
      accuracy: 'exact',
      popularity: 10
    }
  }
  // ... more objects
];
```

### Customization Options
- **Opacity**: Adjustable object transparency
- **Colors**: Category-based color schemes
- **Categories**: Extensible category system
- **Search**: Configurable search fields

## Future Enhancements

### Planned Features
- **Custom objects**: User-defined reference objects
- **Object scaling**: Adjust object sizes for better visualization
- **Measurement integration**: Link with measurement tool
- **Export functionality**: Include comparisons in exports

### Performance Improvements
- **Virtual scrolling**: For large object lists
- **Level of detail**: Simplified objects at distance
- **Texture caching**: Optimized material system
- **Web workers**: Background calculations

## Testing

### Test Coverage
- Unit tests for calculation engine
- Component tests for UI interactions
- Integration tests for 3D rendering
- Mobile responsiveness tests

### Manual Testing Checklist
- [ ] Panel opens/closes correctly
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Object toggles update 3D scene
- [ ] Calculations are accurate
- [ ] Mobile layout functions properly
- [ ] No console errors
- [ ] Performance is acceptable