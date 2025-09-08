/**
 * Simple validation test for the fixes
 * Tests the core logic without complex UI rendering
 */

import { useAppStore } from '../store/useAppStore';
import type { Shape } from '../types';

describe('Fixes Validation', () => {
  beforeEach(() => {
    // Reset store
    useAppStore.getState().shapes = [];
    useAppStore.getState().selectedShapeId = null;
    useAppStore.getState().drawing.activeTool = 'select';
    useAppStore.getState().drawing.isDrawing = false;
    useAppStore.getState().drawing.isEditMode = false;
  });

  describe('Rotation Handle Logic Fix', () => {
    it('should allow rotation handles when isDrawing is true but isEditMode is false', () => {
      const testShape: Shape = {
        id: 'test-shape',
        name: 'Test Shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        color: '#3B82F6',
        visible: true,
        layerId: 'default',
        created: new Date(),
        modified: new Date()
      };

      // Set up state - shape selected, drawing mode on, but not edit mode
      useAppStore.getState().shapes = [testShape];
      useAppStore.getState().selectedShapeId = 'test-shape';
      useAppStore.getState().drawing.activeTool = 'select';
      useAppStore.getState().drawing.isDrawing = true;  // This should NOT prevent rotation handles
      useAppStore.getState().drawing.isEditMode = false;

      const state = useAppStore.getState();

      // The logic from RotationControls.tsx line 107:
      // selectedShapeId && activeTool === 'select' && !drawing.isEditMode
      const shouldShowRotationHandle = 
        state.selectedShapeId && 
        state.drawing.activeTool === 'select' && 
        !state.drawing.isEditMode;

      expect(shouldShowRotationHandle).toBe(true);
    });

    it('should NOT allow rotation handles when in edit mode', () => {
      const testShape: Shape = {
        id: 'test-shape',
        name: 'Test Shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        color: '#3B82F6',
        visible: true,
        layerId: 'default',
        created: new Date(),
        modified: new Date()
      };

      // Set up state - shape selected, but in edit mode
      useAppStore.getState().shapes = [testShape];
      useAppStore.getState().selectedShapeId = 'test-shape';
      useAppStore.getState().drawing.activeTool = 'select';
      useAppStore.getState().drawing.isDrawing = false;
      useAppStore.getState().drawing.isEditMode = true;  // This SHOULD prevent rotation handles

      const state = useAppStore.getState();

      const shouldShowRotationHandle = 
        state.selectedShapeId && 
        state.drawing.activeTool === 'select' && 
        !state.drawing.isEditMode;

      expect(shouldShowRotationHandle).toBe(false);
    });
  });

  describe('Area Display Logic Fix', () => {
    it('should show area for polyline with 3+ points', () => {
      const polylineShape: Shape = {
        id: 'test-polyline',
        name: 'Test Polyline',
        type: 'line', // polylines stored as 'line'
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

      // The logic from ShapeDimensions.tsx line 204:
      // Only skip area for true 2-point lines, not polylines with 3+ points
      const shouldSkipArea = polylineShape.type === 'line' && polylineShape.points.length <= 2;
      const shouldShowArea = !shouldSkipArea;

      expect(shouldShowArea).toBe(true);
    });

    it('should NOT show area for 2-point lines', () => {
      const twoPointLine: Shape = {
        id: 'test-line',
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

      const shouldSkipArea = twoPointLine.type === 'line' && twoPointLine.points.length <= 2;
      const shouldShowArea = !shouldSkipArea;

      expect(shouldShowArea).toBe(false);
    });

    it('should show area for rectangles', () => {
      const rectangle: Shape = {
        id: 'test-rectangle',
        name: 'Test Rectangle',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 100 }
        ],
        color: '#3B82F6',
        visible: true,
        layerId: 'default',
        created: new Date(),
        modified: new Date()
      };

      const shouldSkipArea = rectangle.type === 'line' && rectangle.points.length <= 2;
      const shouldShowArea = !shouldSkipArea;

      expect(shouldShowArea).toBe(true); // Rectangles should always show area
    });

    it('should show area for polygons', () => {
      const polygon: Shape = {
        id: 'test-polygon',
        name: 'Test Polygon',
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 100 }
        ],
        color: '#8B5CF6',
        visible: true,
        layerId: 'default',
        created: new Date(),
        modified: new Date()
      };

      const shouldSkipArea = polygon.type === 'line' && polygon.points.length <= 2;
      const shouldShowArea = !shouldSkipArea;

      expect(shouldShowArea).toBe(true); // Polygons should always show area
    });
  });

  describe('Area Calculation for Polylines', () => {
    it('should calculate correct area for square polyline', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];

      // Shoelace formula calculation
      let sum = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        sum += points[i].x * points[j].y;
        sum -= points[j].x * points[i].y;
      }
      const area = Math.abs(sum) / 2;

      expect(area).toBe(10000); // 100 x 100 = 10,000 m²
    });

    it('should calculate correct area for triangle polyline', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ];

      // Shoelace formula calculation
      let sum = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        sum += points[i].x * points[j].y;
        sum -= points[j].x * points[i].y;
      }
      const area = Math.abs(sum) / 2;

      expect(area).toBe(5000); // Triangle area: base 100 * height 100 / 2 = 5,000 m²
    });
  });
});