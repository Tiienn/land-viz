import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import type { Shape } from '../types';

// Helper to get a fresh store instance
const getStore = () => {
  const store = useAppStore.getState();
  store.clearAll(); // Reset store
  return store;
};

describe('App Store', () => {
  beforeEach(() => {
    useAppStore.getState().clearAll();
  });

  describe('Drawing Tools', () => {
    it('has default tool as select', () => {
      const store = getStore();
      expect(store.drawing.activeTool).toBe('select');
    });

    it('can change active tool', () => {
      const store = getStore();
      store.setActiveTool('polygon');
      expect(store.drawing.activeTool).toBe('polygon');
    });

    it('has snap to grid enabled by default', () => {
      const store = getStore();
      expect(store.drawing.snapToGrid).toBe(true);
    });

    it('can toggle snap to grid', () => {
      const store = getStore();
      expect(store.drawing.snapToGrid).toBe(true);
      store.toggleSnapToGrid();
      expect(store.drawing.snapToGrid).toBe(false);
    });
  });

  describe('Shape Management', () => {
    it('starts with empty shapes array', () => {
      const store = getStore();
      expect(store.shapes).toEqual([]);
    });

    it('can add a shape', () => {
      const store = getStore();
      const shape: Omit<Shape, 'id' | 'created' | 'modified'> = {
        name: 'Test Shape',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
        type: 'polygon',
        color: '#3B82F6',
        visible: true,
      };

      store.addShape(shape);
      expect(store.shapes).toHaveLength(1);
      expect(store.shapes[0].name).toBe('Test Shape');
      expect(store.shapes[0].type).toBe('polygon');
    });

    it('generates unique IDs for shapes', () => {
      const store = getStore();
      const shape: Omit<Shape, 'id' | 'created' | 'modified'> = {
        name: 'Test Shape',
        points: [{ x: 0, y: 0 }],
        type: 'polygon',
        color: '#3B82F6',
        visible: true,
      };

      store.addShape(shape);
      store.addShape(shape);

      expect(store.shapes).toHaveLength(2);
      expect(store.shapes[0].id).not.toBe(store.shapes[1].id);
    });

    it('can select shapes', () => {
      const store = getStore();
      const shape: Omit<Shape, 'id' | 'created' | 'modified'> = {
        name: 'Test Shape',
        points: [{ x: 0, y: 0 }],
        type: 'polygon',
        color: '#3B82F6',
        visible: true,
      };

      store.addShape(shape);
      const shapeId = store.shapes[0].id;

      store.selectShape(shapeId);
      expect(store.selectedShapeId).toBe(shapeId);
    });
  });

  describe('Drawing State', () => {
    it('can start drawing', () => {
      const store = getStore();
      store.setActiveTool('polygon');
      store.startDrawing();

      expect(store.drawing.isDrawing).toBe(true);
      expect(store.drawing.currentShape).not.toBeNull();
      expect(store.drawing.currentShape?.type).toBe('polygon');
    });

    it('can add points while drawing', () => {
      const store = getStore();
      store.setActiveTool('polygon');
      store.startDrawing();

      store.addPoint({ x: 10, y: 20 });
      store.addPoint({ x: 30, y: 40 });

      expect(store.drawing.currentShape?.points).toHaveLength(2);
      expect(store.drawing.currentShape?.points?.[0]).toEqual({ x: 10, y: 20 });
      expect(store.drawing.currentShape?.points?.[1]).toEqual({ x: 30, y: 40 });
    });

    it('can finish drawing and create shape', () => {
      const store = getStore();
      store.setActiveTool('polygon');
      store.startDrawing();
      store.addPoint({ x: 0, y: 0 });
      store.addPoint({ x: 100, y: 0 });
      store.addPoint({ x: 50, y: 100 });

      expect(store.shapes).toHaveLength(0);

      store.finishDrawing();

      expect(store.shapes).toHaveLength(1);
      expect(store.drawing.isDrawing).toBe(false);
      expect(store.drawing.currentShape).toBeNull();
      expect(store.selectedShapeId).toBe(store.shapes[0].id);
    });
  });
});