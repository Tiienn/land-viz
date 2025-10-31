---
name: "Geospatial Processor"
description: "Process, analyze, and manipulate geospatial data for land parcels, property boundaries, cadastral information, and geographic coordinate systems. Handle coordinate transformations, boundary calculations, area computations, parcel validation, spatial relationships, and GIS format conversions"
version: "1.0.0"
dependencies:
  - "@turf/turf"
  - "proj4"
  - "decimal.js"
---

# Geospatial Data Processing for Land Visualizer

## Overview

This skill provides expert knowledge in geospatial data processing, coordinate system transformations, property boundary calculations, and GIS data format handling specifically for the Land Visualizer project.

## When to Use This Skill

- Converting between coordinate systems (WGS84, UTM, State Plane)
- Calculating precise property areas and perimeters
- Validating parcel boundaries and topology
- Processing GeoJSON, Shapefile, KML, DXF formats
- Handling metes and bounds legal descriptions
- Implementing survey-grade precision (±0.01%)

## Coordinate System Expertise

### Common Systems in Land Visualization

**Geographic (Lat/Lon)**
- WGS84 (EPSG:4326) - GPS standard
- NAD83 (EPSG:4269) - North American Datum

**Projected (Meters/Feet)**
- UTM Zones (EPSG:326XX for North)
- State Plane Coordinate Systems
- Lambert Conformal Conic

### Transformation Pattern

```javascript
import proj4 from 'proj4';

// Define projections
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:32633", "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");

// Transform coordinates
const [lon, lat] = [-122.4194, 37.7749]; // San Francisco
const [x, y] = proj4('EPSG:4326', 'EPSG:32633', [lon, lat]);
```

## Area Calculation Methods

### Planar Area (for small parcels < 10km²)

```javascript
// Shoelace algorithm (Surveyor's formula)
function calculatePlanarArea(coordinates) {
  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].x * coordinates[j].y;
    area -= coordinates[j].x * coordinates[i].y;
  }

  return Math.abs(area / 2);
}
```

### Geodetic Area (for large parcels)

```javascript
import * as turf from '@turf/turf';

// Use Turf.js for geodesic calculations
const polygon = turf.polygon([coordinates]);
const area = turf.area(polygon); // Returns square meters on curved earth
```

### High-Precision Area

```javascript
import Decimal from 'decimal.js';

function preciseArea(coordinates) {
  let sum = new Decimal(0);

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const x1 = new Decimal(coordinates[i].x);
    const y1 = new Decimal(coordinates[i].y);
    const x2 = new Decimal(coordinates[j].x);
    const y2 = new Decimal(coordinates[j].y);

    sum = sum.plus(x1.times(y2)).minus(x2.times(y1));
  }

  return sum.div(2).abs();
}
```

## Boundary Validation

### Topology Checks

```javascript
const validateBoundary = (points) => {
  const validation = {
    isClosed: checkClosure(points, tolerance = 0.01),
    isSimple: !hasSelfIntersection(points),
    isClockwise: isClockwiseWinding(points),
    hasValidArea: calculateArea(points) > 0,
    minimumPoints: points.length >= 3
  };

  return {
    valid: Object.values(validation).every(v => v),
    checks: validation,
    errors: getValidationErrors(validation)
  };
};

function checkClosure(points, tolerance) {
  const first = points[0];
  const last = points[points.length - 1];
  const distance = Math.sqrt(
    Math.pow(last.x - first.x, 2) +
    Math.pow(last.y - first.y, 2)
  );
  return distance < tolerance;
}
```

## Unit Conversions

### Area Units

```javascript
const AREA_CONVERSIONS = {
  sqm_to_sqft: 10.7639,
  sqm_to_acres: 0.000247105,
  sqm_to_hectares: 0.0001,
  acres_to_sqm: 4046.86,
  hectares_to_sqm: 10000,

  // Historical units
  sqm_to_arpent: 0.000293, // French colonial
  sqm_to_perch: 0.03954   // British
};

function convertArea(value, fromUnit, toUnit) {
  // Convert to square meters first
  const sqMeters = fromUnit === 'sqm'
    ? value
    : value / AREA_CONVERSIONS[`sqm_to_${fromUnit}`];

  // Convert to target unit
  return toUnit === 'sqm'
    ? sqMeters
    : sqMeters * AREA_CONVERSIONS[`sqm_to_${toUnit}`];
}
```

## GeoJSON Handling

### Structure for Land Visualizer

```javascript
const propertyGeoJSON = {
  type: "Feature",
  properties: {
    id: "parcel-001",
    address: "123 Main St",
    area: 2000.5, // square meters
    perimeter: 180.2,
    owner: "John Doe",
    zoning: "R1",
    calculationMethod: "geodetic",
    accuracy: "±0.01m"
  },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-122.4194, 37.7749],
      [-122.4184, 37.7749],
      [-122.4184, 37.7739],
      [-122.4194, 37.7739],
      [-122.4194, 37.7749] // Closed polygon
    ]]
  },
  crs: {
    type: "name",
    properties: { name: "EPSG:4326" }
  }
};
```

### Validation

```javascript
function validateGeoJSON(geojson) {
  const errors = [];

  if (!geojson.type) errors.push("Missing type");
  if (!geojson.geometry) errors.push("Missing geometry");
  if (!geojson.properties) errors.push("Missing properties");

  if (geojson.geometry?.type === "Polygon") {
    const coords = geojson.geometry.coordinates[0];

    // Check closure
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      errors.push("Polygon not closed");
    }

    // Check minimum points
    if (coords.length < 4) { // 3 unique + closing point
      errors.push("Polygon needs at least 3 unique points");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Precision Standards

### Survey-Grade Accuracy

For Land Visualizer's professional mode:

- **Coordinates**: ±0.01 meters
- **Areas**: ±0.01% for parcels under 10 hectares
- **Angles**: ±1 second of arc
- **Distances**: ±0.001 meters

### Implementation

```javascript
// Use Decimal.js for financial/legal calculations
import Decimal from 'decimal.js';

Decimal.set({ precision: 20 }); // High precision

const calculatePropertyValue = (area, pricePerSqM) => {
  const a = new Decimal(area);
  const p = new Decimal(pricePerSqM);
  return a.times(p).toFixed(2); // Round only at display
};
```

## Common Workflows

### Import Property Boundary

1. **Parse Input**: Extract coordinates from file/input
2. **Validate Format**: Check coordinate pairs, order
3. **Transform CRS**: Convert to working coordinate system (meters)
4. **Validate Topology**: Check closure, self-intersection
5. **Calculate Metrics**: Area, perimeter, centroid
6. **Store with Metadata**: Include CRS, accuracy, method

### Calculate Setbacks

```javascript
function applySetback(polygon, setbackDistance) {
  // Use Turf.js buffer with negative distance
  const buffered = turf.buffer(polygon, -setbackDistance, {
    units: 'meters'
  });

  return {
    original: polygon,
    setback: buffered,
    reducedArea: turf.area(buffered),
    areaLost: turf.area(polygon) - turf.area(buffered)
  };
}
```

### Export to CAD Format

```javascript
function exportToDXF(shapes) {
  // DXF structure for AutoCAD
  return {
    header: {
      $INSUNITS: 6, // Meters
      $MEASUREMENT: 1, // Metric
    },
    entities: shapes.map(shape => ({
      type: 'LWPOLYLINE',
      layer: shape.layer || 'BOUNDARY',
      closed: true,
      vertices: shape.coordinates.map(([x, y]) => ({x, y})),
      color: shape.color || 1
    }))
  };
}
```

## Performance Optimization

### For Large Datasets

```javascript
// Simplify geometry for display
import { simplify } from '@turf/turf';

const simplified = turf.simplify(complexPolygon, {
  tolerance: 0.01,
  highQuality: true
});

// Use spatial indexing
import RBush from 'rbush';

const spatialIndex = new RBush();
parcels.forEach(parcel => {
  spatialIndex.insert({
    minX: parcel.bounds.minX,
    minY: parcel.bounds.minY,
    maxX: parcel.bounds.maxX,
    maxY: parcel.bounds.maxY,
    parcel
  });
});

// Query visible parcels only
const visible = spatialIndex.search(viewport);
```

## Integration with Land Visualizer Components

### DrawingCanvas Integration

```javascript
// Snap to grid based on coordinate system
const snapToGrid = (point, gridSize = 1) => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize
});

// Real-time area display
useEffect(() => {
  if (drawingPoints.length >= 3) {
    const area = calculatePlanarArea(drawingPoints);
    updateFeedback({ area, unit: 'sqm' });
  }
}, [drawingPoints]);
```

### Export Service Integration

```javascript
// Generate professional survey report
const generateReport = (property) => ({
  parcel_id: property.id,
  area_sqm: property.area.toFixed(2),
  area_acres: (property.area * 0.000247105).toFixed(4),
  perimeter_m: property.perimeter.toFixed(2),
  coordinates: property.coordinates,
  coordinate_system: "EPSG:4326",
  calculation_method: "Geodetic",
  accuracy: "±0.01%",
  date: new Date().toISOString()
});
```

## Error Handling

### Common Issues

```javascript
const handleGeospatialError = (error, context) => {
  const errorHandlers = {
    'UNCLOSED_POLYGON': () => ({
      fix: 'auto_close',
      message: 'Polygon automatically closed',
      data: autoClose(context.points)
    }),
    'SELF_INTERSECTION': () => ({
      fix: 'buffer_technique',
      message: 'Applied buffer(0) to fix self-intersection',
      data: turf.buffer(context.polygon, 0)
    }),
    'INVALID_CRS': () => ({
      fix: 'assume_wgs84',
      message: 'Assuming WGS84 coordinate system',
      warning: 'Please verify coordinate system'
    }),
    'OUT_OF_BOUNDS': () => ({
      fix: 'none',
      message: 'Coordinates outside valid range',
      error: 'Manual correction required'
    })
  };

  return errorHandlers[error.type]?.() || {
    fix: 'none',
    error: error.message
  };
};
```

## Testing Approach

### Test Cases

```javascript
describe('Geospatial Processing', () => {
  test('calculates area with survey-grade precision', () => {
    const square = [[0,0], [100,0], [100,100], [0,100], [0,0]];
    const area = calculatePlanarArea(square);
    expect(area).toBeCloseTo(10000, 2); // ±0.01m²
  });

  test('handles coordinate transformation', () => {
    const wgs84 = [-122.4194, 37.7749];
    const utm = transformCoordinates(wgs84, 'EPSG:4326', 'EPSG:32610');
    expect(utm[0]).toBeCloseTo(551483, 0.01);
  });

  test('validates boundary topology', () => {
    const valid = validateBoundary(validPolygon);
    expect(valid.valid).toBe(true);

    const invalid = validateBoundary(selfIntersectingPolygon);
    expect(invalid.errors).toContain('Self-intersection detected');
  });
});
```

## Best Practices

1. **Always specify coordinate system** - Never assume CRS
2. **Validate before calculating** - Check topology first
3. **Use appropriate precision** - Decimal.js for legal/financial
4. **Provide multiple units** - Display conversions
5. **Include metadata** - CRS, method, accuracy in outputs
6. **Handle edge cases** - Zone boundaries, datums, large areas
7. **Test against known values** - Use survey data when available

## Reference Resources

- **Turf.js**: Advanced geospatial operations
- **Proj4js**: Coordinate transformations
- **Decimal.js**: High-precision calculations
- **EPSG.io**: Coordinate system reference
- **GeoJSON Spec**: RFC 7946

## Land Visualizer Specific

### Grid Snapping

```javascript
// Align to 1-meter grid in projected coordinates
const GRID_SIZE = 1; // meters

export const snapToProjectedGrid = (point) => ({
  x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
  y: Math.round(point.y / GRID_SIZE) * GRID_SIZE
});
```

### Unit Display

```javascript
// Display all supported units simultaneously
export const formatArea = (sqMeters) => ({
  sqm: sqMeters.toFixed(2),
  sqft: (sqMeters * 10.7639).toFixed(2),
  acres: (sqMeters * 0.000247105).toFixed(4),
  hectares: (sqMeters * 0.0001).toFixed(4),
  arpent: (sqMeters * 0.000293).toFixed(6), // Historical
  perch: (sqMeters * 0.03954).toFixed(4)    // Historical
});
```

## Summary

This skill enables precise geospatial processing with survey-grade accuracy for the Land Visualizer project. Use it whenever working with coordinates, areas, boundaries, or GIS data formats. Always prioritize accuracy, validation, and proper metadata handling.
