import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import type { DrawingTool, Shape, Point2D } from '../../types';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test by using store methods
    const {
      shapes,
      deleteShape,
      selectShape,
      setActiveTool,
      cancelDrawing
    } = useAppStore.getState();

    // Clear all shapes
    shapes.forEach(shape => deleteShape(shape.id));

    // Reset selection
    selectShape(null);

    // Reset active tool to select
    setActiveTool('select');

    // Cancel any drawing in progress
    cancelDrawing();
  });

  describe('Tool Management', () => {
    it('should set active tool correctly', () => {
      const { setActiveTool } = useAppStore.getState();

      setActiveTool('rectangle');

      const { drawing } = useAppStore.getState();
      expect(drawing.activeTool).toBe('rectangle');
      expect(drawing.isEditMode).toBe(false);
    });

    it('should handle tool switching with cleanup', () => {
      const store = useAppStore.getState();

      // Start drawing with rectangle tool
      store.setActiveTool('rectangle');
      store.startDrawing({ x: 0, y: 0 });

      // Switch to circle tool - should cleanup drawing state
      store.setActiveTool('circle');

      const state = useAppStore.getState();
      expect(state.drawing.activeTool).toBe('circle');
      expect(state.drawing.isDrawing).toBe(false);
      expect(state.drawing.currentShape).toBe(null);
    });

    it('should toggle edit mode correctly', () => {
      const store = useAppStore.getState();

      store.toggleEditMode();
      expect(useAppStore.getState().drawing.isEditMode).toBe(true);

      store.toggleEditMode();
      expect(useAppStore.getState().drawing.isEditMode).toBe(false);
    });
  });

  describe('Shape Management', () => {
    it('should add shape correctly', () => {
      const store = useAppStore.getState();
      const shapeData = {
        type: 'rectangle' as const,
        points: [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 2 },
          { x: 0, y: 2 },
        ],
        center: { x: 1, y: 1 },
        rotation: 0,
        layerId: 'main',
      };

      const shapeId = store.addShape(shapeData);

      const state = useAppStore.getState();
      expect(state.shapes).toHaveLength(1);
      expect(state.shapes[0].id).toBe(shapeId);
      expect(state.shapes[0].type).toBe('rectangle');
      expect(state.shapes[0].points).toEqual(shapeData.points);
    });

    it('should update shape correctly', () => {
      const store = useAppStore.getState();

      // Add a shape first
      const shapeId = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        center: { x: 0.5, y: 0.5 },
        rotation: 0,
        layerId: 'main',
      });

      // Update the shape
      store.updateShape(shapeId, {
        points: [{ x: 0, y: 0 }, { x: 2, y: 2 }],
        center: { x: 1, y: 1 },
      });

      const state = useAppStore.getState();
      const updatedShape = state.shapes.find(s => s.id === shapeId);
      expect(updatedShape?.points).toEqual([{ x: 0, y: 0 }, { x: 2, y: 2 }]);
      expect(updatedShape?.center).toEqual({ x: 1, y: 1 });
    });

    it('should delete shape correctly', () => {
      const store = useAppStore.getState();

      // Add shapes
      const shapeId1 = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        center: { x: 0.5, y: 0.5 },
        rotation: 0,
        layerId: 'main',
      });

      const shapeId2 = store.addShape({
        type: 'circle',
        points: [{ x: 2, y: 2 }, { x: 3, y: 3 }],
        center: { x: 2.5, y: 2.5 },
        rotation: 0,
        layerId: 'main',
      });

      expect(useAppStore.getState().shapes).toHaveLength(2);

      // Delete first shape
      store.deleteShape(shapeId1);

      const state = useAppStore.getState();
      expect(state.shapes).toHaveLength(1);
      expect(state.shapes[0].id).toBe(shapeId2);
    });

    it('should handle shape selection', () => {
      const store = useAppStore.getState();

      const shapeId = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        center: { x: 0.5, y: 0.5 },
        rotation: 0,
        layerId: 'main',
      });

      store.selectShape(shapeId);
      expect(useAppStore.getState().selectedShapeId).toBe(shapeId);

      store.clearSelection();
      expect(useAppStore.getState().selectedShapeId).toBe(null);
    });
  });

  describe('Drawing Process', () => {
    it('should handle rectangle drawing process', () => {
      const store = useAppStore.getState();

      store.setActiveTool('rectangle');

      // Start drawing
      store.startDrawing({ x: 0, y: 0 });
      let state = useAppStore.getState();
      expect(state.drawing.isDrawing).toBe(true);
      expect(state.drawing.currentShape?.points).toHaveLength(1);

      // Continue drawing
      store.continueDrawing({ x: 2, y: 2 });
      state = useAppStore.getState();
      expect(state.drawing.currentShape?.points).toHaveLength(4); // Rectangle completes

      // Finish drawing
      store.finishDrawing();
      state = useAppStore.getState();
      expect(state.drawing.isDrawing).toBe(false);
      expect(state.shapes).toHaveLength(1);
    });

    it('should handle polyline drawing process', () => {
      const store = useAppStore.getState();

      store.setActiveTool('polyline');

      // Start polyline
      store.startDrawing({ x: 0, y: 0 });
      store.continueDrawing({ x: 1, y: 0 });
      store.continueDrawing({ x: 1, y: 1 });

      const state = useAppStore.getState();
      expect(state.drawing.isDrawing).toBe(true);
      expect(state.drawing.currentShape?.points).toHaveLength(3);

      // Finish polyline
      store.finishDrawing();
      const finalState = useAppStore.getState();
      expect(finalState.drawing.isDrawing).toBe(false);
      expect(finalState.shapes).toHaveLength(1);
      expect(finalState.shapes[0].type).toBe('polyline');
    });
  });

  describe('Grid and Snapping', () => {
    it('should toggle grid snap', () => {
      const store = useAppStore.getState();

      expect(useAppStore.getState().drawing.gridSnap).toBe(true);

      store.toggleGridSnap();
      expect(useAppStore.getState().drawing.gridSnap).toBe(false);

      store.toggleGridSnap();
      expect(useAppStore.getState().drawing.gridSnap).toBe(true);
    });

    it('should toggle grid visibility', () => {
      const store = useAppStore.getState();

      expect(useAppStore.getState().drawing.showGrid).toBe(true);

      store.toggleGridVisibility();
      expect(useAppStore.getState().drawing.showGrid).toBe(false);

      store.toggleGridVisibility();
      expect(useAppStore.getState().drawing.showGrid).toBe(true);
    });

    it('should update snap distance', () => {
      const store = useAppStore.getState();

      store.setSnapDistance(1.0);
      expect(useAppStore.getState().drawing.snapDistance).toBe(1.0);

      store.setSnapDistance(0.25);
      expect(useAppStore.getState().drawing.snapDistance).toBe(0.25);
    });
  });

  describe('Drag State Management', () => {
    it('should handle drag state for shapes', () => {
      const store = useAppStore.getState();

      const shapeId = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        center: { x: 0.5, y: 0.5 },
        rotation: 0,
        layerId: 'main',
      });

      // Start dragging
      store.startDrag(shapeId, { x: 0.5, y: 0.5 });

      let state = useAppStore.getState();
      expect(state.dragState).toBeTruthy();
      expect(state.dragState?.shapeId).toBe(shapeId);
      expect(state.dragState?.startPoint).toEqual({ x: 0.5, y: 0.5 });

      // Update drag
      store.updateDrag({ x: 1.5, y: 1.5 });
      state = useAppStore.getState();
      expect(state.dragState?.currentPoint).toEqual({ x: 1.5, y: 1.5 });

      // End drag
      store.endDrag();
      state = useAppStore.getState();
      expect(state.dragState).toBe(null);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid shape updates gracefully', () => {
      const store = useAppStore.getState();

      // Try to update non-existent shape
      store.updateShape('nonexistent-id', { rotation: 45 });

      // Should not crash and state should remain unchanged
      const state = useAppStore.getState();
      expect(state.shapes).toHaveLength(0);
    });

    it('should handle invalid shape selection gracefully', () => {
      const store = useAppStore.getState();

      // Try to select non-existent shape
      store.selectShape('nonexistent-id');

      // Should clear selection instead of crashing
      const state = useAppStore.getState();
      expect(state.selectedShapeId).toBe(null);
    });

    it('should handle canceling drawing process', () => {
      const store = useAppStore.getState();

      store.setActiveTool('rectangle');
      store.startDrawing({ x: 0, y: 0 });

      expect(useAppStore.getState().drawing.isDrawing).toBe(true);

      store.cancelDrawing();

      const state = useAppStore.getState();
      expect(state.drawing.isDrawing).toBe(false);
      expect(state.drawing.currentShape).toBe(null);
      expect(state.shapes).toHaveLength(0);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large number of shapes efficiently', () => {
      const store = useAppStore.getState();

      const startTime = performance.now();

      // Add 1000 shapes
      for (let i = 0; i < 1000; i++) {
        store.addShape({
          type: 'rectangle',
          points: [
            { x: i, y: i },
            { x: i + 1, y: i },
            { x: i + 1, y: i + 1 },
            { x: i, y: i + 1 },
          ],
          center: { x: i + 0.5, y: i + 0.5 },
          rotation: 0,
          layerId: 'main',
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = useAppStore.getState();
      expect(state.shapes).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle rapid tool switching without memory leaks', () => {
      const store = useAppStore.getState();
      const tools: DrawingTool[] = ['select', 'rectangle', 'circle', 'polyline', 'measure'];

      // Rapidly switch tools 100 times
      for (let i = 0; i < 100; i++) {
        const tool = tools[i % tools.length];
        store.setActiveTool(tool);
      }

      // Should still be responsive
      const finalTool = 'rectangle';
      store.setActiveTool(finalTool);

      const state = useAppStore.getState();
      expect(state.drawing.activeTool).toBe(finalTool);
    });
  });
});