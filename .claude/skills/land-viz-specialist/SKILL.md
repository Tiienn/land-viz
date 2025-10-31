---
name: "Land Visualizer Specialist"
description: "Handle land visualization tasks including data processing, map rendering, and geospatial analysis. Expert in property measurements, visual comparisons, unit conversions, CAD-style drawing tools, and transforming abstract land measurements into instant visual understanding"
version: "1.0.0"
dependencies:
  - "react@>=18.0.0"
  - "zustand@>=4.0.0"
  - "@turf/turf"
  - "decimal.js"
---

# Land Visualizer Domain Specialist

## Overview

This skill provides domain-specific expertise for the Land Visualizer project - a web application that transforms abstract land measurements into instant visual understanding. Focus on property visualization, measurement accuracy, visual comparison systems, and CAD-style precision tools.

## When to Use This Skill

- Implementing drawing tools (rectangle, circle, polyline, measurement)
- Calculating property areas and perimeters
- Creating visual comparison systems (soccer fields, houses, etc.)
- Unit conversion between measurement systems
- CAD-style precision features (direct dimension input, snapping, alignment)
- Property boundary validation and editing
- Export functionality (Excel, DXF, PDF, GeoJSON)

## Core Value Proposition

**"Transform abstract measurements into instant visual understanding"**

When someone says a property is "2000m²", what does that actually mean? Land Visualizer makes this instantly clear through:
- Visual comparisons to familiar objects
- Interactive 3D/2D visualization
- Real-time calculations
- Multiple unit displays

## Drawing Tools Architecture

### Tool State Management (Zustand)

```typescript
interface DrawingState {
  activeTool: 'select' | 'rectangle' | 'circle' | 'polyline' | 'line' | 'measure' | 'edit';
  isDrawing: boolean;
  isEditMode: boolean;
  currentShape: Shape | null;
  shapes: Shape[];
  selectedShapeId: string | null;
}

// Example usage
const useDrawingStore = create<DrawingState>((set) => ({
  activeTool: 'select',
  isDrawing: false,
  shapes: [],

  setActiveTool: (tool) => set({ activeTool: tool }),
  addShape: (shape) => set((state) => ({
    shapes: [...state.shapes, shape]
  })),
  updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map(s => s.id === id ? {...s, ...updates} : s)
  }))
}));
```

### Rectangle Tool

```typescript
const handleRectangleDrawing = (points: Point2D[]) => {
  if (points.length < 2) return null;

  const [start, end] = points;
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  return {
    id: generateId(),
    type: 'rectangle',
    x,
    y,
    width,
    height,
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ],
    area: width * height,
    perimeter: 2 * (width + height),
    rotation: 0
  };
};
```

### Circle Tool

```typescript
const handleCircleDrawing = (center: Point2D, radiusPoint: Point2D) => {
  const radius = Math.sqrt(
    Math.pow(radiusPoint.x - center.x, 2) +
    Math.pow(radiusPoint.y - center.y, 2)
  );

  return {
    id: generateId(),
    type: 'circle',
    center,
    radius,
    area: Math.PI * radius * radius,
    perimeter: 2 * Math.PI * radius,
    // Convert to polygon for rendering
    points: generateCirclePoints(center, radius, 64)
  };
};

const generateCirclePoints = (center: Point2D, radius: number, segments: number = 64): Point2D[] => {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return points;
};
```

### Polyline Tool

```typescript
const handlePolylineDrawing = (points: Point2D[]) => {
  if (points.length < 3) return null;

  // Auto-close when clicking near start
  const first = points[0];
  const last = points[points.length - 1];
  const distance = Math.sqrt(
    Math.pow(last.x - first.x, 2) +
    Math.pow(last.y - first.y, 2)
  );

  const closed = distance < CLOSE_THRESHOLD; // e.g., 2 meters

  if (closed) {
    // Calculate area using shoelace formula
    const area = calculatePolygonArea(points);
    const perimeter = calculatePerimeter(points);

    return {
      id: generateId(),
      type: 'polyline',
      points: [...points, first], // Ensure closed
      area,
      perimeter,
      closed: true
    };
  }

  return {
    id: generateId(),
    type: 'polyline',
    points,
    perimeter: calculatePerimeter(points),
    closed: false
  };
};
```

## Direct Dimension Input

### Pre-sized Shape Creation

```typescript
interface DimensionInput {
  width?: number;
  height?: number;
  radius?: number;
  diameter?: number;
  unit: 'meters' | 'feet';
  mode?: 'radius' | 'diameter'; // For circles
}

const parseDimensionInput = (input: string): DimensionInput | null => {
  // Rectangle: "10x15", "33ft x 50ft", "10m x 15m"
  const rectMatch = input.match(/^(\d+(?:\.\d+)?)\s*(?:ft|m)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ft|m)?$/i);
  if (rectMatch) {
    return {
      width: parseFloat(rectMatch[1]),
      height: parseFloat(rectMatch[2]),
      unit: rectMatch[3]?.toLowerCase() === 'ft' ? 'feet' : 'meters'
    };
  }

  // Circle: "r10", "d20", "r15m", "d30ft"
  const circleMatch = input.match(/^([rd])(\d+(?:\.\d+)?)\s*(ft|m)?$/i);
  if (circleMatch) {
    const value = parseFloat(circleMatch[2]);
    return {
      [circleMatch[1].toLowerCase() === 'r' ? 'radius' : 'diameter']: value,
      mode: circleMatch[1].toLowerCase() === 'r' ? 'radius' : 'diameter',
      unit: circleMatch[3]?.toLowerCase() === 'ft' ? 'feet' : 'meters'
    };
  }

  return null;
};

// Usage
const createPreSizedRectangle = (input: DimensionInput, position: Point2D) => {
  const width = input.unit === 'feet' ? input.width * 0.3048 : input.width;
  const height = input.unit === 'feet' ? input.height * 0.3048 : input.height;

  return {
    id: generateId(),
    type: 'rectangle',
    x: position.x,
    y: position.y,
    width,
    height,
    points: [
      { x: position.x, y: position.y },
      { x: position.x + width, y: position.y },
      { x: position.x + width, y: position.y + height },
      { x: position.x, y: position.y + height }
    ],
    area: width * height,
    perimeter: 2 * (width + height)
  };
};
```

## Visual Comparison System

### Reference Objects

```typescript
const COMPARISON_OBJECTS = {
  soccerField: {
    id: 'soccer-field',
    name: 'Soccer Field',
    area: 7140, // m²
    dimensions: { width: 105, height: 68 },
    icon: '⚽',
    category: 'sports'
  },
  basketballCourt: {
    id: 'basketball-court',
    name: 'Basketball Court',
    area: 420, // m²
    dimensions: { width: 28, height: 15 },
    icon: '🏀',
    category: 'sports'
  },
  tennisCourt: {
    id: 'tennis-court',
    name: 'Tennis Court',
    area: 261, // m²
    dimensions: { width: 23.77, height: 10.97 },
    icon: '🎾',
    category: 'sports'
  },
  averageHouse: {
    id: 'average-house',
    name: 'Average House',
    area: 200, // m²
    dimensions: { width: 14.14, height: 14.14 },
    icon: '🏠',
    category: 'building'
  },
  parkingSpace: {
    id: 'parking-space',
    name: 'Parking Space',
    area: 12.5, // m²
    dimensions: { width: 5, height: 2.5 },
    icon: '🚗',
    category: 'vehicle'
  },
  olympicPool: {
    id: 'olympic-pool',
    name: 'Olympic Pool',
    area: 1250, // m²
    dimensions: { width: 50, height: 25 },
    icon: '🏊',
    category: 'sports'
  }
};

const calculateComparison = (propertyArea: number, referenceObject: typeof COMPARISON_OBJECTS.soccerField) => {
  const quantity = propertyArea / referenceObject.area;

  return {
    object: referenceObject,
    quantity: quantity.toFixed(2),
    percentFit: ((quantity % 1) * 100).toFixed(0),
    message: `${quantity.toFixed(1)} ${referenceObject.name}${quantity > 1 ? 's' : ''} fit in your property`
  };
};
```

### Visual Comparison Rendering

```tsx
function ComparisonVisualization({ propertyArea }: { propertyArea: number }) {
  const comparisons = Object.values(COMPARISON_OBJECTS).map(obj =>
    calculateComparison(propertyArea, obj)
  );

  return (
    <div className="comparisons">
      {comparisons.map(comp => (
        <div key={comp.object.id} className="comparison-item">
          <span className="icon">{comp.object.icon}</span>
          <div className="details">
            <strong>{comp.quantity}</strong>
            <span>{comp.object.name}s</span>
          </div>
          <div className="progress-bar">
            <div
              className="fill"
              style={{ width: `${Math.min(comp.quantity * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Unit Conversion System

### Supported Units

```typescript
const AREA_UNITS = {
  // Metric
  sqm: { name: 'Square Meters', symbol: 'm²', toSqM: 1 },
  hectares: { name: 'Hectares', symbol: 'ha', toSqM: 10000 },

  // Imperial
  sqft: { name: 'Square Feet', symbol: 'ft²', toSqM: 0.092903 },
  acres: { name: 'Acres', symbol: 'ac', toSqM: 4046.86 },

  // Historical
  arpent: { name: 'Arpent (French)', symbol: 'arp', toSqM: 3418.89 },
  perch: { name: 'Perch (British)', symbol: 'per', toSqM: 25.29 }
};

const convertArea = (value: number, fromUnit: string, toUnit: string): number => {
  const sqMeters = value * AREA_UNITS[fromUnit].toSqM;
  return sqMeters / AREA_UNITS[toUnit].toSqM;
};

// Display all units simultaneously
const displayAllUnits = (sqMeters: number) => ({
  sqm: sqMeters.toFixed(2),
  sqft: convertArea(sqMeters, 'sqm', 'sqft').toFixed(2),
  acres: convertArea(sqMeters, 'sqm', 'acres').toFixed(4),
  hectares: convertArea(sqMeters, 'sqm', 'hectares').toFixed(4),
  arpent: convertArea(sqMeters, 'sqm', 'arpent').toFixed(6),
  perch: convertArea(sqMeters, 'sqm', 'perch').toFixed(4)
});
```

## Measurement Tool

### Point-to-Point Distance

```typescript
const measureDistance = (point1: Point2D, point2: Point2D): MeasurementResult => {
  const distance = Math.sqrt(
    Math.pow(point2.x - point1.x, 2) +
    Math.pow(point2.y - point1.y, 2)
  );

  return {
    id: generateId(),
    type: 'distance',
    points: [point1, point2],
    distance,
    distanceMeters: distance,
    distanceFeet: distance * 3.28084,
    angle: Math.atan2(point2.y - point1.y, point2.x - point1.x) * (180 / Math.PI)
  };
};
```

### Measurement Rendering

```tsx
function MeasurementRenderer({ measurement }: { measurement: MeasurementResult }) {
  const midpoint = {
    x: (measurement.points[0].x + measurement.points[1].x) / 2,
    y: (measurement.points[0].y + measurement.points[1].y) / 2
  };

  return (
    <group>
      {/* Line */}
      <Line
        points={[
          [measurement.points[0].x, 0, measurement.points[0].y],
          [measurement.points[1].x, 0, measurement.points[1].y]
        ]}
        color="#F59E0B"
        lineWidth={2}
        dashed
        dashScale={0.5}
      />

      {/* Distance label */}
      <Html position={[midpoint.x, 1, midpoint.y]} center>
        <div className="measurement-label">
          {measurement.distanceMeters.toFixed(2)}m
          <br />
          ({measurement.distanceFeet.toFixed(2)}ft)
        </div>
      </Html>

      {/* Endpoint markers */}
      {measurement.points.map((point, i) => (
        <mesh key={i} position={[point.x, 0, point.y]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#F59E0B" />
        </mesh>
      ))}
    </group>
  );
}
```

## CAD-Style Precision Features

### Grid Snapping

```typescript
interface SnapConfig {
  enabled: boolean;
  gridSize: number; // meters
  snapDistance: number; // screen pixels for snap radius
}

const snapToGrid = (point: Point2D, config: SnapConfig): Point2D => {
  if (!config.enabled) return point;

  return {
    x: Math.round(point.x / config.gridSize) * config.gridSize,
    y: Math.round(point.y / config.gridSize) * config.gridSize
  };
};

// Shape-to-shape snapping
const snapToShapes = (point: Point2D, existingShapes: Shape[], snapDistance: number): Point2D => {
  let closestPoint = point;
  let minDistance = snapDistance;

  existingShapes.forEach(shape => {
    shape.points.forEach(shapePoint => {
      const distance = Math.sqrt(
        Math.pow(point.x - shapePoint.x, 2) +
        Math.pow(point.y - shapePoint.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = shapePoint;
      }
    });
  });

  return closestPoint;
};
```

### Alignment Guides

```typescript
const SNAP_THRESHOLD = 0.5; // meters

const findAlignmentGuides = (movingShape: Shape, otherShapes: Shape[]) => {
  const guides = {
    vertical: [] as number[],
    horizontal: [] as number[]
  };

  otherShapes.forEach(shape => {
    // Check vertical alignment
    if (Math.abs(shape.x - movingShape.x) < SNAP_THRESHOLD) {
      guides.vertical.push(shape.x);
    }
    if (Math.abs((shape.x + shape.width) - (movingShape.x + movingShape.width)) < SNAP_THRESHOLD) {
      guides.vertical.push(shape.x + shape.width);
    }

    // Check horizontal alignment
    if (Math.abs(shape.y - movingShape.y) < SNAP_THRESHOLD) {
      guides.horizontal.push(shape.y);
    }
    if (Math.abs((shape.y + shape.height) - (movingShape.y + movingShape.height)) < SNAP_THRESHOLD) {
      guides.horizontal.push(shape.y + shape.height);
    }
  });

  return guides;
};
```

## Export Functionality

### Excel Export

```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (shapes: Shape[]) => {
  const data = shapes.map(shape => ({
    'Shape ID': shape.id,
    'Type': shape.type,
    'Area (m²)': shape.area?.toFixed(2),
    'Area (acres)': (shape.area * 0.000247105).toFixed(4),
    'Perimeter (m)': shape.perimeter?.toFixed(2),
    'X': shape.x?.toFixed(2),
    'Y': shape.y?.toFixed(2),
    'Width (m)': shape.width?.toFixed(2),
    'Height (m)': shape.height?.toFixed(2),
    'Rotation': shape.rotation ? `${shape.rotation}°` : '0°'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Property Data');

  XLSX.writeFile(workbook, 'land-visualizer-export.xlsx');
};
```

### DXF Export (CAD format)

```typescript
const exportToDXF = (shapes: Shape[]) => {
  const entities = shapes.map(shape => {
    if (shape.type === 'rectangle') {
      return {
        type: 'LWPOLYLINE',
        layer: 'BOUNDARY',
        closed: true,
        vertices: shape.points.map(p => ({ x: p.x, y: p.y })),
        color: 1
      };
    }
    if (shape.type === 'circle') {
      return {
        type: 'CIRCLE',
        layer: 'BOUNDARY',
        center: { x: shape.center.x, y: shape.center.y },
        radius: shape.radius,
        color: 1
      };
    }
    return null;
  }).filter(Boolean);

  const dxf = {
    header: {
      $INSUNITS: 6, // Meters
      $MEASUREMENT: 1 // Metric
    },
    tables: {},
    blocks: {},
    entities
  };

  return generateDXFString(dxf);
};
```

## Keyboard Shortcuts

### Shortcut System

```typescript
const KEYBOARD_SHORTCUTS = {
  // Tools
  's': { tool: 'select', description: 'Select tool' },
  'r': { tool: 'rectangle', description: 'Rectangle tool' },
  'c': { tool: 'circle', description: 'Circle tool' },
  'p': { tool: 'polyline', description: 'Polyline tool' },
  'l': { tool: 'line', description: 'Line tool' },
  'm': { tool: 'measure', description: 'Measure tool' },
  'e': { tool: 'edit', description: 'Edit mode' },

  // Editing
  'ctrl+z': { action: 'undo', description: 'Undo' },
  'ctrl+y': { action: 'redo', description: 'Redo' },
  'ctrl+d': { action: 'duplicate', description: 'Duplicate' },
  'delete': { action: 'delete', description: 'Delete selected' },
  'backspace': { action: 'delete', description: 'Delete selected' },
  'shift+h': { action: 'flip-horizontal', description: 'Flip horizontally' },
  'shift+v': { action: 'flip-vertical', description: 'Flip vertically' },

  // View
  'v': { action: 'toggle-2d-3d', description: 'Toggle 2D/3D view' },
  '?': { action: 'show-shortcuts', description: 'Show shortcuts' },
  'escape': { action: 'cancel', description: 'Cancel/Deselect' }
};

const handleKeyPress = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  const withCtrl = event.ctrlKey;
  const withShift = event.shiftKey;

  let shortcutKey = key;
  if (withCtrl) shortcutKey = `ctrl+${key}`;
  if (withShift && !withCtrl) shortcutKey = `shift+${key}`;

  const shortcut = KEYBOARD_SHORTCUTS[shortcutKey];
  if (shortcut) {
    event.preventDefault();
    executeShortcut(shortcut);
  }
};
```

## Undo/Redo System

```typescript
interface HistoryState {
  past: Shape[][];
  present: Shape[];
  future: Shape[][];
}

const useHistory = create<HistoryState>((set) => ({
  past: [],
  present: [],
  future: [],

  pushHistory: (shapes: Shape[]) => set((state) => ({
    past: [...state.past, state.present],
    present: shapes,
    future: [] // Clear future on new action
  })),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;

    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);

    return {
      past: newPast,
      present: previous,
      future: [state.present, ...state.future]
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;

    const next = state.future[0];
    const newFuture = state.future.slice(1);

    return {
      past: [...state.past, state.present],
      present: next,
      future: newFuture
    };
  })
}));
```

## Design Philosophy

### Core Principles

1. **Immediate Understanding**: Users grasp land size within 10 seconds
2. **Visual First**: Every number has a visual representation
3. **Zero to Hero**: First success within 30 seconds
4. **CAD Precision**: Professional accuracy with consumer simplicity
5. **Mobile-First**: Every feature works on phones

### User Flow

```
1. Land (0s) → See default example
2. Click Draw (5s) → Select tool
3. Draw shape (15s) → Click points
4. Auto-calculate (20s) → See area/perimeter
5. Compare (25s) → "2.5 soccer fields"
6. Success (30s) → Understand their land
```

## Performance Standards

- **Load Time**: <3 seconds on 3G
- **FPS**: 60 on desktop, 30+ on mobile
- **Calculation Time**: <100ms for 20 vertices
- **Accuracy**: ±0.01% for precision mode

## Best Practices

1. **Always validate boundaries** before calculations
2. **Display multiple units** simultaneously
3. **Provide visual comparisons** alongside numbers
4. **Enable undo/redo** for every action
5. **Use grid snapping** by default
6. **Show real-time feedback** during drawing
7. **Maintain precision** until final display
8. **Test on mobile devices** regularly

## Summary

This skill provides comprehensive domain expertise for the Land Visualizer project. Use it when working with property visualization, measurement tools, visual comparisons, unit conversions, and CAD-style precision features. Always prioritize instant visual understanding and professional-grade accuracy.
