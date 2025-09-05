import { describe, test, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('Undo/Redo Functionality', () => {
  let store: ReturnType<typeof useAppStore.getState>;

  beforeEach(() => {
    // Get fresh store state before each test
    store = useAppStore.getState();
  });

  test('should have undo/redo methods available', () => {
    expect(typeof store.undo).toBe('function');
    expect(typeof store.redo).toBe('function');
    expect(typeof store.canUndo).toBe('function');
    expect(typeof store.canRedo).toBe('function');
    expect(typeof store.saveToHistory).toBe('function');
  });

  test('should not allow undo/redo when no history exists', () => {
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
  });

  test('should save state when adding a shape using addShape', () => {
    const initialShapeCount = store.shapes.length;
    const firstLayerId = store.layers[0].id;
    
    // Add a shape directly using addShape
    store.addShape({
      name: 'Test Rectangle',
      type: 'rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      color: '#3B82F6',
      visible: true,
      layerId: firstLayerId
    });

    // Should be able to undo after adding shape
    expect(store.shapes.length).toBe(initialShapeCount + 1);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);
  });

  test('should undo shape addition', () => {
    const initialState = store.shapes.slice();
    const firstLayerId = store.layers[0].id;
    
    // Add a shape
    store.addShape({
      name: 'Test Rectangle',
      type: 'rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      color: '#3B82F6',
      visible: true,
      layerId: firstLayerId
    });

    expect(store.shapes.length).toBe(initialState.length + 1);
    expect(store.canUndo()).toBe(true);

    // Undo the addition
    store.undo();

    expect(store.shapes.length).toBe(initialState.length);
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(true);
  });

  test('should redo after undo', () => {
    const initialShapeCount = store.shapes.length;
    const firstLayerId = store.layers[0].id;
    
    // Add a shape
    store.addShape({
      name: 'Test Circle',
      type: 'circle',
      points: [
        { x: 5, y: 5 },
        { x: 10, y: 5 }
      ],
      color: '#10B981',
      visible: true,
      layerId: firstLayerId
    });

    expect(store.shapes.length).toBe(initialShapeCount + 1);

    // Undo
    store.undo();
    expect(store.shapes.length).toBe(initialShapeCount);
    expect(store.canRedo()).toBe(true);

    // Redo
    store.redo();
    expect(store.shapes.length).toBe(initialShapeCount + 1);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);
  });

  test('should handle multiple undos and redos', () => {
    const initialShapeCount = store.shapes.length;
    
    // Add multiple shapes
    store.addShape({
      name: 'Shape 1',
      type: 'rectangle',
      points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer'
    });

    store.addShape({
      name: 'Shape 2',
      type: 'circle',
      points: [{ x: 10, y: 10 }, { x: 15, y: 10 }],
      color: '#10B981',
      visible: true,
      layerId: 'default-layer'
    });

    expect(store.shapes.length).toBe(initialShapeCount + 2);

    // Undo twice
    store.undo(); // Remove Shape 2
    expect(store.shapes.length).toBe(initialShapeCount + 1);
    
    store.undo(); // Remove Shape 1
    expect(store.shapes.length).toBe(initialShapeCount);
    expect(store.canUndo()).toBe(false);

    // Redo twice
    store.redo(); // Add back Shape 1
    expect(store.shapes.length).toBe(initialShapeCount + 1);
    
    store.redo(); // Add back Shape 2
    expect(store.shapes.length).toBe(initialShapeCount + 2);
    expect(store.canRedo()).toBe(false);
  });

  test('should clear redo history when new action is performed', () => {
    const initialShapeCount = store.shapes.length;
    
    // Add first shape
    store.addShape({
      name: 'Shape 1',
      type: 'rectangle',
      points: [{ x: 0, y: 0 }, { x: 5, y: 5 }],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer'
    });

    // Add second shape
    store.addShape({
      name: 'Shape 2',
      type: 'circle',
      points: [{ x: 10, y: 10 }, { x: 15, y: 10 }],
      color: '#10B981',
      visible: true,
      layerId: 'default-layer'
    });

    // Undo once
    store.undo();
    expect(store.shapes.length).toBe(initialShapeCount + 1);
    expect(store.canRedo()).toBe(true);

    // Add new shape (should clear redo history)
    store.addShape({
      name: 'Shape 3',
      type: 'rectangle',
      points: [{ x: 20, y: 20 }, { x: 25, y: 25 }],
      color: '#F59E0B',
      visible: true,
      layerId: 'default-layer'
    });

    expect(store.shapes.length).toBe(initialShapeCount + 2);
    expect(store.canRedo()).toBe(false); // Redo history should be cleared
    expect(store.canUndo()).toBe(true);
  });

  test('should handle shape deletion undo/redo', () => {
    // Add a shape first
    store.addShape({
      name: 'Test Shape',
      type: 'rectangle',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer'
    });

    const shapeId = store.shapes[store.shapes.length - 1].id;
    const shapeCount = store.shapes.length;

    // Delete the shape
    store.deleteShape(shapeId);
    expect(store.shapes.length).toBe(shapeCount - 1);
    expect(store.canUndo()).toBe(true);

    // Undo deletion
    store.undo();
    expect(store.shapes.length).toBe(shapeCount);
    
    // Find the restored shape
    const restoredShape = store.shapes.find(s => s.name === 'Test Shape');
    expect(restoredShape).toBeDefined();
    expect(restoredShape?.type).toBe('rectangle');
  });
});