/**
 * Test for polyline fill geometry fix
 * Ensures that polylines with 4+ points have proper triangulated fill geometry
 */

import { GeometryCache } from '../utils/GeometryCache';
import type { Shape } from '../types';

describe('Polyline Fill Geometry Fix', () => {
  beforeEach(() => {
    // Clear cache before each test
    GeometryCache.dispose();
  });

  afterEach(() => {
    // Clean up after each test
    GeometryCache.dispose();
  });

  it('should create fill geometry for polyline with 4 points', () => {
    const polylineShape: Shape = {
      id: 'test-polyline-4pts',
      name: 'Test Polyline',
      type: 'line', // polylines are stored as 'line' type
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ],
      color: '#F59E0B',
      visible: true,
      layerId: 'default',
      created: new Date(),
      modified: new Date()
    };

    const geometry = GeometryCache.getGeometry(polylineShape, 0.01);

    // Should have vertices for all 4 points
    expect(geometry.attributes.position).toBeDefined();
    expect(geometry.attributes.position.count).toBe(4);

    // Should have indices for triangulation (2 triangles = 6 indices)
    expect(geometry.index).toBeDefined();
    expect(geometry.index!.count).toBe(6);

    // Should have proper triangulation: [0,1,2, 0,2,3] or [0,1,3, 1,2,3]
    const indices = Array.from(geometry.index!.array);
    expect(indices.length).toBe(6);
    
    // All indices should be valid (0-3 for 4 vertices)
    indices.forEach(index => {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(4);
    });
  });

  it('should create fill geometry for polyline with 5+ points', () => {
    const polylineShape: Shape = {
      id: 'test-polyline-5pts',
      name: 'Test Pentagon Polyline',
      type: 'line',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 120, y: 80 },
        { x: 50, y: 120 },
        { x: -20, y: 80 }
      ],
      color: '#F59E0B',
      visible: true,
      layerId: 'default',
      created: new Date(),
      modified: new Date()
    };

    const geometry = GeometryCache.getGeometry(polylineShape, 0.01);

    // Should have vertices for all 5 points
    expect(geometry.attributes.position).toBeDefined();
    expect(geometry.attributes.position.count).toBe(5);

    // Should have indices for triangulation (3 triangles = 9 indices for pentagon)
    expect(geometry.index).toBeDefined();
    expect(geometry.index!.count).toBe(9);

    // All indices should be valid (0-4 for 5 vertices)
    const indices = Array.from(geometry.index!.array);
    indices.forEach(index => {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(5);
    });
  });

  it('should not create fill geometry for 2-point line', () => {
    const lineShape: Shape = {
      id: 'test-line-2pts',
      name: 'Test Line',
      type: 'line',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ],
      color: '#F59E0B',
      visible: true,
      layerId: 'default',
      created: new Date(),
      modified: new Date()
    };

    const geometry = GeometryCache.getGeometry(lineShape, 0.01);

    // Should have vertices for both points
    expect(geometry.attributes.position).toBeDefined();
    expect(geometry.attributes.position.count).toBe(2);

    // Should NOT have indices for fill (2-point lines don't get fill)
    if (geometry.index) {
      expect(geometry.index.count).toBe(0);
    }
  });

  it('should create triangle fill geometry for 3-point polyline', () => {
    const trianglePolyline: Shape = {
      id: 'test-polyline-3pts',
      name: 'Test Triangle Polyline',
      type: 'line',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ],
      color: '#F59E0B',
      visible: true,
      layerId: 'default',
      created: new Date(),
      modified: new Date()
    };

    const geometry = GeometryCache.getGeometry(trianglePolyline, 0.01);

    // Should have vertices for all 3 points
    expect(geometry.attributes.position).toBeDefined();
    expect(geometry.attributes.position.count).toBe(3);

    // Should have indices for single triangle (3 indices)
    expect(geometry.index).toBeDefined();
    expect(geometry.index!.count).toBe(3);

    // Should be triangle indices: [0, 1, 2]
    const indices = Array.from(geometry.index!.array);
    expect(indices).toEqual([0, 1, 2]);
  });

  it('should have proper bounding box and sphere for fill geometry', () => {
    const polylineShape: Shape = {
      id: 'test-polyline-bounds',
      name: 'Test Polyline Bounds',
      type: 'line',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ],
      color: '#F59E0B',
      visible: true,
      layerId: 'default',
      created: new Date(),
      modified: new Date()
    };

    const geometry = GeometryCache.getGeometry(polylineShape, 0.01);

    // Should have computed bounding box for click detection
    expect(geometry.boundingBox).toBeDefined();
    expect(geometry.boundingBox!.min).toBeDefined();
    expect(geometry.boundingBox!.max).toBeDefined();

    // Should have computed bounding sphere
    expect(geometry.boundingSphere).toBeDefined();
    expect(geometry.boundingSphere!.center).toBeDefined();
    expect(geometry.boundingSphere!.radius).toBeGreaterThan(0);
  });
});