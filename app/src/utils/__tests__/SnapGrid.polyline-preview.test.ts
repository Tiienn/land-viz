/**
 * Tests for polyline preview segment snap detection fix
 */

import { SnapGrid } from '../SnapGrid';
import type { Shape, Point2D } from '../../types';

describe('SnapGrid Polyline Preview Segment Fix', () => {
  let snapGrid: SnapGrid;

  beforeEach(() => {
    snapGrid = new SnapGrid(10, 1.5);
  });

  afterEach(() => {
    snapGrid.dispose();
  });

  describe('Polyline with Preview Segment', () => {
    it('should include midpoint snap for preview segment in polyline', () => {
      // Simulate a polyline with preview point (as would happen during drawing)
      const polylineWithPreview: Shape = {
        id: 'drawing-polyline',
        name: 'Drawing Polyline',
        type: 'line', // Polyline type
        color: '#3b82f6',
        visible: true,
        layerId: 'main',
        created: new Date(),
        modified: new Date(),
        points: [
          { x: 0, y: 0 },    // Point 1 (placed)
          { x: 10, y: 0 },   // Point 2 (placed)
          { x: 10, y: 10 },  // Point 3 (placed)
          { x: 5, y: 15 }    // Point 4 (preview cursor position)
        ]
      };

      snapGrid.updateSnapPoints([polylineWithPreview]);

      // Find all midpoint snap points (use larger radius to catch all segments)
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 7.5, y: 7.5 }, 15);
      const midpoints = snapPoints.filter(snap => snap.type === 'midpoint');

      // Should have 3 midpoints for the 3 segments (including preview segment)
      expect(midpoints).toHaveLength(3);

      // Check for the preview segment midpoint (from (10,10) to (5,15))
      const previewSegmentMidpoint = { x: 7.5, y: 12.5 };
      const foundPreviewMidpoint = midpoints.find(mp =>
        Math.abs(mp.position.x - previewSegmentMidpoint.x) < 0.01 &&
        Math.abs(mp.position.y - previewSegmentMidpoint.y) < 0.01
      );

      expect(foundPreviewMidpoint).toBeDefined();
      expect(foundPreviewMidpoint?.metadata?.description).toContain('Segment 3 midpoint');
      expect(foundPreviewMidpoint?.metadata?.edgeIndex).toBe(2); // Third segment (index 2)
    });

    it('should provide snap points for all segments in active polyline drawing', () => {
      // Polyline being drawn with cursor at preview position
      const activePolyline: Shape = {
        id: 'active-polyline',
        name: 'Active Polyline',
        type: 'line',
        color: '#3b82f6',
        visible: true,
        layerId: 'main',
        created: new Date(),
        modified: new Date(),
        points: [
          { x: 0, y: 0 },    // Placed point 1
          { x: 20, y: 0 },   // Placed point 2
          { x: 20, y: 20 },  // Placed point 3
          { x: 0, y: 20 },   // Placed point 4
          { x: 0, y: 10 }    // Preview point (cursor position)
        ]
      };

      snapGrid.updateSnapPoints([activePolyline]);

      // Get all snap points within reasonable radius
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 10, y: 10 }, 25);
      const midpoints = snapPoints.filter(snap => snap.type === 'midpoint');

      // Should have 4 midpoints:
      // Segment 0: (0,0) → (20,0) midpoint at (10,0)
      // Segment 1: (20,0) → (20,20) midpoint at (20,10)
      // Segment 2: (20,20) → (0,20) midpoint at (10,20)
      // Segment 3: (0,20) → (0,10) midpoint at (0,15) - THE PREVIEW SEGMENT!
      expect(midpoints).toHaveLength(4);

      const expectedMidpoints = [
        { x: 10, y: 0 },   // Segment 0 midpoint
        { x: 20, y: 10 },  // Segment 1 midpoint
        { x: 10, y: 20 },  // Segment 2 midpoint
        { x: 0, y: 15 }    // Segment 3 midpoint (preview)
      ];

      expectedMidpoints.forEach((expectedPos, index) => {
        const foundMidpoint = midpoints.find(mp =>
          Math.abs(mp.position.x - expectedPos.x) < 0.01 &&
          Math.abs(mp.position.y - expectedPos.y) < 0.01
        );

        expect(foundMidpoint).toBeDefined();
        expect(foundMidpoint?.metadata?.edgeIndex).toBe(index);
      });
    });

    it('should find nearest snap point on preview segment', () => {
      const polylineWithPreview: Shape = {
        id: 'test-polyline',
        name: 'Test Polyline',
        type: 'line',
        color: '#3b82f6',
        visible: true,
        layerId: 'main',
        created: new Date(),
        modified: new Date(),
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 50, y: 150 }  // Preview cursor position
        ]
      };

      snapGrid.updateSnapPoints([polylineWithPreview]);

      // Look for snap point near the midpoint of the preview segment
      const previewMidpoint = { x: 75, y: 125 }; // Midpoint of (100,100) → (50,150)
      const nearestSnap = snapGrid.findNearestSnapPoint(previewMidpoint, 5.0);

      expect(nearestSnap).toBeDefined();
      expect(nearestSnap?.type).toBe('midpoint');
      expect(nearestSnap?.position.x).toBeCloseTo(75, 1);
      expect(nearestSnap?.position.y).toBeCloseTo(125, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single point polyline (no segments)', () => {
      const singlePointPolyline: Shape = {
        id: 'single-point',
        name: 'Single Point',
        type: 'line',
        color: '#3b82f6',
        visible: true,
        layerId: 'main',
        created: new Date(),
        modified: new Date(),
        points: [{ x: 10, y: 10 }]
      };

      snapGrid.updateSnapPoints([singlePointPolyline]);
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 10, y: 10 }, 5);
      const midpoints = snapPoints.filter(snap => snap.type === 'midpoint');

      // Should have no midpoints (can't have segment with only one point)
      expect(midpoints).toHaveLength(0);
    });

    it('should handle two point polyline (one segment)', () => {
      const twoPointPolyline: Shape = {
        id: 'two-point',
        name: 'Two Point Line',
        type: 'line',
        color: '#3b82f6',
        visible: true,
        layerId: 'main',
        created: new Date(),
        modified: new Date(),
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ]
      };

      snapGrid.updateSnapPoints([twoPointPolyline]);
      const snapPoints = snapGrid.findSnapPointsInRadius({ x: 5, y: 5 }, 5);
      const midpoints = snapPoints.filter(snap => snap.type === 'midpoint');

      // Should have exactly one midpoint
      expect(midpoints).toHaveLength(1);
      expect(midpoints[0].position.x).toBeCloseTo(5, 1);
      expect(midpoints[0].position.y).toBeCloseTo(5, 1);
    });
  });
});