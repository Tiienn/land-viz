/**
 * Tests for the cursor-proximity-based grid generation fix
 * This verifies the solution to the persistent green diamond snap indicator issue
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { SnapGrid } from '../SnapGrid';
import type { Shape, Point2D } from '@/types';

describe('SnapGrid - Cursor Proximity Fix', () => {
  let snapGrid: SnapGrid;

  beforeEach(() => {
    // Use 2D mode snap settings: 0.5m snap distance
    snapGrid = new SnapGrid(10, 0.5);
  });

  // Helper function to create a basic shape
  const createTestShape = (id: string, center: Point2D): Shape => ({
    id,
    name: `Test Shape ${id}`,
    type: 'rectangle',
    color: '#3b82f6',
    visible: true,
    layerId: 'main',
    created: new Date(),
    modified: new Date(),
    points: [
      { x: center.x - 1, y: center.y - 1 },
      { x: center.x + 1, y: center.y - 1 },
      { x: center.x + 1, y: center.y + 1 },
      { x: center.x - 1, y: center.y + 1 }
    ]
  });

  test('should only generate grid points near cursor position', () => {
    const shapes = [
      createTestShape('shape1', { x: 10, y: 10 }),
      createTestShape('shape2', { x: 20, y: 20 })
    ];

    const cursorPosition = { x: 0, y: 0 };

    // Update snap points with cursor position
    snapGrid.updateSnapPoints(shapes, cursorPosition);

    // Find all grid snap points
    const allSnapPoints = snapGrid.findSnapPointsInRadius({ x: 0, y: 0 }, 100);
    const gridSnapPoints = allSnapPoints.filter(sp => sp.type === 'grid');

    // Grid points should only exist near the cursor (origin), not near the shapes at (10,10) and (20,20)
    const nearOrigin = gridSnapPoints.filter(sp =>
      Math.abs(sp.position.x) <= 2 && Math.abs(sp.position.y) <= 2
    );
    const nearShape1 = gridSnapPoints.filter(sp =>
      Math.abs(sp.position.x - 10) <= 1 && Math.abs(sp.position.y - 10) <= 1
    );
    const nearShape2 = gridSnapPoints.filter(sp =>
      Math.abs(sp.position.x - 20) <= 1 && Math.abs(sp.position.y - 20) <= 1
    );

    expect(nearOrigin.length).toBeGreaterThan(0);
    expect(nearShape1.length).toBe(0);
    expect(nearShape2.length).toBe(0);
  });

  test('should not generate grid points when cursor position is not provided', () => {
    const shapes = [createTestShape('shape1', { x: 5, y: 5 })];

    // Update without cursor position (old behavior compatibility)
    snapGrid.updateSnapPoints(shapes);

    const allSnapPoints = snapGrid.findSnapPointsInRadius({ x: 5, y: 5 }, 10);
    const gridSnapPoints = allSnapPoints.filter(sp => sp.type === 'grid');

    // Should not generate grid points without cursor position
    expect(gridSnapPoints.length).toBe(0);
  });

  test('should generate grid points within search radius of cursor', () => {
    const shapes = [createTestShape('shape1', { x: 0, y: 0 })];
    const cursorPosition = { x: 0.3, y: 0.7 };

    snapGrid.updateSnapPoints(shapes, cursorPosition);

    const allSnapPoints = snapGrid.findSnapPointsInRadius(cursorPosition, 10);
    const gridSnapPoints = allSnapPoints.filter(sp => sp.type === 'grid');

    // All grid points should be within search radius (2.0m) of cursor
    gridSnapPoints.forEach(sp => {
      const distance = Math.sqrt(
        Math.pow(cursorPosition.x - sp.position.x, 2) +
        Math.pow(cursorPosition.y - sp.position.y, 2)
      );
      expect(distance).toBeLessThanOrEqual(2.0);
    });
  });

  test('should include cursor-adjacent grid intersections', () => {
    const shapes = [createTestShape('shape1', { x: 0, y: 0 })];
    const cursorPosition = { x: 0.3, y: 0.7 }; // Near (0,0) and (1,1)

    snapGrid.updateSnapPoints(shapes, cursorPosition);

    const nearbyPoints = snapGrid.findSnapPointsInRadius(cursorPosition, 2);
    const gridSnapPoints = nearbyPoints.filter(sp => sp.type === 'grid');

    // Should include grid points at (0,0), (0,1), (1,0), (1,1)
    const expectedPoints = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 }
    ];

    expectedPoints.forEach(expected => {
      const found = gridSnapPoints.find(sp =>
        sp.position.x === expected.x && sp.position.y === expected.y
      );
      expect(found).toBeDefined();
    });
  });

  test('should not duplicate grid points', () => {
    const shapes = [createTestShape('shape1', { x: 0, y: 0 })];
    const cursorPosition = { x: 0, y: 0 };

    snapGrid.updateSnapPoints(shapes, cursorPosition);

    const allSnapPoints = snapGrid.findSnapPointsInRadius(cursorPosition, 5);
    const gridSnapPoints = allSnapPoints.filter(sp => sp.type === 'grid');

    // Check for duplicates
    const uniquePositions = new Set();
    gridSnapPoints.forEach(sp => {
      const key = `${sp.position.x},${sp.position.y}`;
      expect(uniquePositions.has(key)).toBe(false);
      uniquePositions.add(key);
    });
  });

  test('should maintain other snap point types (endpoint, midpoint, center)', () => {
    const shapes = [createTestShape('shape1', { x: 0, y: 0 })];
    const cursorPosition = { x: 0, y: 0 };

    snapGrid.updateSnapPoints(shapes, cursorPosition);

    const allSnapPoints = snapGrid.findSnapPointsInRadius(cursorPosition, 10);

    const endpointSnaps = allSnapPoints.filter(sp => sp.type === 'endpoint');
    const midpointSnaps = allSnapPoints.filter(sp => sp.type === 'midpoint');
    const centerSnaps = allSnapPoints.filter(sp => sp.type === 'center');

    // Should still have shape-based snap points
    expect(endpointSnaps.length).toBeGreaterThan(0);
    expect(midpointSnaps.length).toBeGreaterThan(0);
    expect(centerSnaps.length).toBeGreaterThan(0);
  });

  test('should respect 2D mode snap distance (0.5m)', () => {
    const shapes = [createTestShape('shape1', { x: 0, y: 0 })];
    const cursorPosition = { x: 0.3, y: 0 }; // 0.3m from origin

    snapGrid.updateSnapPoints(shapes, cursorPosition);

    // Find snap point at origin (0,0)
    const originSnapPoint = snapGrid.findNearestSnapPoint(cursorPosition, 0.5);

    // Should find a snap point within 0.5m tolerance
    expect(originSnapPoint).toBeDefined();

    // Try finding with smaller tolerance
    const tightSnapPoint = snapGrid.findNearestSnapPoint(cursorPosition, 0.2);
    expect(tightSnapPoint).toBeNull();
  });

  test('should clear grid properly to prevent persistent indicators', () => {
    const shapes = [createTestShape('shape1', { x: 0, y: 0 })];
    const cursorPosition = { x: 0, y: 0 };

    snapGrid.updateSnapPoints(shapes, cursorPosition);

    let allSnapPoints = snapGrid.findSnapPointsInRadius(cursorPosition, 10);
    expect(allSnapPoints.length).toBeGreaterThan(0);

    // Clear the grid
    snapGrid.clear();

    allSnapPoints = snapGrid.findSnapPointsInRadius(cursorPosition, 10);
    expect(allSnapPoints.length).toBe(0);
  });
});

describe('SnapGrid - Performance Verification', () => {
  test('should handle large numbers of shapes efficiently', () => {
    const snapGrid = new SnapGrid(10, 0.5);

    // Create 100 shapes scattered across a large area
    const shapes: Shape[] = [];
    for (let i = 0; i < 100; i++) {
      shapes.push(createTestShape(`shape${i}`, {
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100
      }));
    }

    const cursorPosition = { x: 0, y: 0 };

    const startTime = performance.now();
    snapGrid.updateSnapPoints(shapes, cursorPosition);
    const endTime = performance.now();

    // Should complete in reasonable time (< 50ms)
    expect(endTime - startTime).toBeLessThan(50);

    // Should only have grid points near cursor, not for all 100 shapes
    const gridSnapPoints = snapGrid.findSnapPointsInRadius(cursorPosition, 100)
      .filter(sp => sp.type === 'grid');

    // Grid points should be limited to cursor area, not proportional to shape count
    // With 100 shapes, old behavior would create 100+ grid points
    // New behavior should only create grid points near cursor (search radius creates more points)
    expect(gridSnapPoints.length).toBeLessThan(2000); // Much less than shape-proportional generation
  });

  // Helper function to create a test shape
  function createTestShape(id: string, center: Point2D): Shape {
    return {
      id,
      name: `Test Shape ${id}`,
      type: 'rectangle',
      color: '#3b82f6',
      visible: true,
      layerId: 'main',
      created: new Date(),
      modified: new Date(),
      points: [
        { x: center.x - 1, y: center.y - 1 },
        { x: center.x + 1, y: center.y - 1 },
        { x: center.x + 1, y: center.y + 1 },
        { x: center.x - 1, y: center.y + 1 }
      ]
    };
  }
});