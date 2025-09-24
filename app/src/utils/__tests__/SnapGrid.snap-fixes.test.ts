/**
 * Tests for snap fixes: rectangle left edge midpoint and polyline current drawing snapping
 */

import { SnapGrid } from '../SnapGrid';
import type { Shape, Point2D } from '../../types';

describe('SnapGrid Snap Fixes', () => {
  let snapGrid: SnapGrid;

  beforeEach(() => {
    snapGrid = new SnapGrid(10, 1.5);
  });

  afterEach(() => {
    snapGrid.dispose();
  });

  describe('Rectangle Closed Shape Midpoint Generation', () => {
    it('should generate midpoints for all 4 edges including the left edge (closing segment)', () => {
      // Create a rectangle shape with 4 points
      const rectangleShape: Shape = {
        id: 'test-rectangle',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },    // Bottom-left
          { x: 10, y: 0 },   // Bottom-right
          { x: 10, y: 10 },  // Top-right
          { x: 0, y: 10 }    // Top-left
        ]
      };

      snapGrid.updateSnapPoints([rectangleShape]);

      // Find midpoint snap points
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 5, y: 5 }, 10);
      const midpoints = snapPoints.filter(snap => snap.type === 'midpoint');

      // Should have exactly 4 midpoints (one for each edge)
      expect(midpoints).toHaveLength(4);

      // Check each expected midpoint exists
      const expectedMidpoints = [
        { x: 5, y: 0 },   // Bottom edge (segment 0: 0,0 → 10,0)
        { x: 10, y: 5 },  // Right edge (segment 1: 10,0 → 10,10)
        { x: 5, y: 10 },  // Top edge (segment 2: 10,10 → 0,10)
        { x: 0, y: 5 }    // Left edge (segment 3: 0,10 → 0,0) - THE FIX!
      ];

      expectedMidpoints.forEach((expectedPos, index) => {
        const foundMidpoint = midpoints.find(mp =>
          Math.abs(mp.position.x - expectedPos.x) < 0.01 &&
          Math.abs(mp.position.y - expectedPos.y) < 0.01
        );

        expect(foundMidpoint).toBeDefined();
        expect(foundMidpoint?.metadata?.description).toContain(`Segment ${index + 1} midpoint`);
        expect(foundMidpoint?.metadata?.edgeIndex).toBe(index);
      });
    });

    it('should specifically include left edge midpoint for rectangles', () => {
      const rectangleShape: Shape = {
        id: 'test-rectangle',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },    // Bottom-left
          { x: 20, y: 0 },   // Bottom-right
          { x: 20, y: 15 },  // Top-right
          { x: 0, y: 15 }    // Top-left
        ]
      };

      snapGrid.updateSnapPoints([rectangleShape]);

      // Specifically look for the left edge midpoint
      const leftEdgeMidpoint = { x: 0, y: 7.5 }; // Midpoint of left edge
      const snapPoint = snapGrid.findNearestSnapPoint(leftEdgeMidpoint, 1.0);

      expect(snapPoint).toBeDefined();
      expect(snapPoint?.type).toBe('midpoint');
      expect(snapPoint?.position.x).toBeCloseTo(0, 2);
      expect(snapPoint?.position.y).toBeCloseTo(7.5, 2);
      expect(snapPoint?.metadata?.description).toContain('Segment 4 midpoint'); // Closing segment
      expect(snapPoint?.metadata?.edgeIndex).toBe(3); // Fourth edge (index 3)
    });
  });

  describe('Polygon Closed Shape Midpoint Generation', () => {
    it('should generate midpoints for all edges including the closing segment', () => {
      // Create a triangle polygon
      const triangleShape: Shape = {
        id: 'test-triangle',
        type: 'polygon',
        points: [
          { x: 0, y: 0 },    // Bottom-left
          { x: 10, y: 0 },   // Bottom-right
          { x: 5, y: 10 }    // Top
        ]
      };

      snapGrid.updateSnapPoints([triangleShape]);

      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 5, y: 5 }, 15);
      const midpoints = snapPoints.filter(snap => snap.type === 'midpoint');

      // Should have exactly 3 midpoints (one for each edge including closing)
      expect(midpoints).toHaveLength(3);

      const expectedMidpoints = [
        { x: 5, y: 0 },    // Bottom edge (0,0 → 10,0)
        { x: 7.5, y: 5 },  // Right edge (10,0 → 5,10)
        { x: 2.5, y: 5 }   // Left edge (5,10 → 0,0) - closing segment
      ];

      expectedMidpoints.forEach(expectedPos => {
        const foundMidpoint = midpoints.find(mp =>
          Math.abs(mp.position.x - expectedPos.x) < 0.01 &&
          Math.abs(mp.position.y - expectedPos.y) < 0.01
        );

        expect(foundMidpoint).toBeDefined();
      });
    });
  });

  describe('Polyline Open Shape Midpoint Generation', () => {
    it('should NOT generate closing segment midpoint for polylines (open shapes)', () => {
      // Create a polyline (open shape)
      const polylineShape: Shape = {
        id: 'test-polyline',
        type: 'line',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 }
        ]
      };

      snapGrid.updateSnapPoints([polylineShape]);

      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 5, y: 5 }, 15);
      const midpoints = snapPoints.filter(snap => snap.type === 'midpoint');

      // Should have exactly 2 midpoints (NOT 3 - no closing segment for open shapes)
      expect(midpoints).toHaveLength(2);

      const expectedMidpoints = [
        { x: 5, y: 0 },   // First segment (0,0 → 10,0)
        { x: 10, y: 5 }   // Second segment (10,0 → 10,10)
        // NO closing segment (10,10 → 0,0) for polylines
      ];

      expectedMidpoints.forEach(expectedPos => {
        const foundMidpoint = midpoints.find(mp =>
          Math.abs(mp.position.x - expectedPos.x) < 0.01 &&
          Math.abs(mp.position.y - expectedPos.y) < 0.01
        );

        expect(foundMidpoint).toBeDefined();
      });

      // Ensure NO midpoint exists for the closing segment
      const closingSegmentMidpoint = midpoints.find(mp =>
        Math.abs(mp.position.x - 5) < 0.01 &&
        Math.abs(mp.position.y - 5) < 0.01
      );
      expect(closingSegmentMidpoint).toBeUndefined();
    });
  });

  describe('SnapPoint Interface Compliance', () => {
    it('should generate snap points with correct interface structure', () => {
      const rectangleShape: Shape = {
        id: 'test-rectangle',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ]
      };

      snapGrid.updateSnapPoints([rectangleShape]);
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 5, y: 5 }, 15);

      snapPoints.forEach(snapPoint => {
        // Required properties
        expect(snapPoint.id).toBeDefined();
        expect(typeof snapPoint.id).toBe('string');

        expect(snapPoint.type).toBeDefined();
        expect(['endpoint', 'midpoint', 'center', 'grid']).toContain(snapPoint.type);

        expect(snapPoint.position).toBeDefined();
        expect(typeof snapPoint.position.x).toBe('number');
        expect(typeof snapPoint.position.y).toBe('number');

        expect(snapPoint.strength).toBeDefined();
        expect(typeof snapPoint.strength).toBe('number');
        expect(snapPoint.strength).toBeGreaterThan(0);
        expect(snapPoint.strength).toBeLessThanOrEqual(1);

        // Optional properties
        if (snapPoint.shapeId) {
          expect(typeof snapPoint.shapeId).toBe('string');
        }

        if (snapPoint.metadata) {
          // Only allowed metadata properties
          const allowedKeys = ['description', 'edgeIndex', 'angle'];
          Object.keys(snapPoint.metadata).forEach(key => {
            expect(allowedKeys).toContain(key);
          });
        }
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty shapes array', () => {
      snapGrid.updateSnapPoints([]);
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 0, y: 0 }, 10);
      expect(snapPoints).toHaveLength(0);
    });

    it('should handle shapes with insufficient points', () => {
      const invalidShapes: Shape[] = [
        { id: 'empty', type: 'rectangle', points: [] },
        { id: 'single', type: 'rectangle', points: [{ x: 0, y: 0 }] }
      ];

      snapGrid.updateSnapPoints(invalidShapes);
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 0, y: 0 }, 10);

      // Should not crash and should return empty or minimal results
      expect(Array.isArray(snapPoints)).toBe(true);
    });

    it('should handle large numbers of shapes efficiently', () => {
      const shapes: Shape[] = [];

      // Create 50 rectangles
      for (let i = 0; i < 50; i++) {
        shapes.push({
          id: `rect-${i}`,
          type: 'rectangle',
          points: [
            { x: i * 20, y: 0 },
            { x: i * 20 + 10, y: 0 },
            { x: i * 20 + 10, y: 10 },
            { x: i * 20, y: 10 }
          ]
        });
      }

      const startTime = performance.now();
      snapGrid.updateSnapPoints(shapes);
      const updateTime = performance.now() - startTime;

      const searchStart = performance.now();
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 100, y: 5 }, 10);
      const searchTime = performance.now() - searchStart;

      // Performance assertions - should be fast
      expect(updateTime).toBeLessThan(100); // Less than 100ms to update
      expect(searchTime).toBeLessThan(50);  // Less than 50ms to search
      expect(snapPoints.length).toBeGreaterThan(0); // Should find some snaps
    });
  });
});