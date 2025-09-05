import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('ShapeRenderer Resize Integration', () => {
  beforeEach(() => {
    useAppStore.getState().clearAll();
  });

  it('should handle single-click resize toggle workflow', () => {
    const store = useAppStore.getState();
    
    // Set up select tool
    store.setActiveTool('select');
    
    // Create a test shape
    const testShape = {
      id: 'test-rect',
      name: 'Test Rectangle',
      type: 'rectangle' as const,
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer',
      created: new Date(),
      modified: new Date()
    };

    store.addShape(testShape);
    
    // First click should select the shape
    store.selectShape('test-rect');
    let freshStore = useAppStore.getState();
    expect(freshStore.selectedShapeId).toBe('test-rect');
    expect(freshStore.drawing.isResizeMode).toBe(false);

    // Second click on selected shape should enter resize mode
    store.enterResizeMode('test-rect');
    freshStore = useAppStore.getState();
    expect(freshStore.drawing.isResizeMode).toBe(true);
    expect(freshStore.drawing.resizingShapeId).toBe('test-rect');

    // Third click should exit resize mode
    store.exitResizeMode();
    freshStore = useAppStore.getState();
    expect(freshStore.drawing.isResizeMode).toBe(false);
    expect(freshStore.drawing.resizingShapeId).toBe(null);
    expect(freshStore.selectedShapeId).toBe('test-rect'); // Should remain selected
  });

  it('should handle shape selection and resize mode correctly', () => {
    const store = useAppStore.getState();
    
    // Set up select tool
    store.setActiveTool('select');
    
    // Create two test shapes
    const shape1 = {
      id: 'shape-1',
      name: 'Rectangle 1',
      type: 'rectangle' as const,
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer',
      created: new Date(),
      modified: new Date()
    };

    const shape2 = {
      id: 'shape-2',
      name: 'Rectangle 2',
      type: 'rectangle' as const,
      points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
      color: '#22C55E',
      visible: true,
      layerId: 'default-layer',
      created: new Date(),
      modified: new Date()
    };

    store.addShape(shape1);
    store.addShape(shape2);
    
    // Select first shape and enter resize mode
    store.selectShape('shape-1');
    store.enterResizeMode('shape-1');
    let freshStore = useAppStore.getState();
    expect(freshStore.selectedShapeId).toBe('shape-1');
    expect(freshStore.drawing.isResizeMode).toBe(true);
    expect(freshStore.drawing.resizingShapeId).toBe('shape-1');

    // Clicking on another shape should select it and exit resize mode
    store.selectShape('shape-2');
    freshStore = useAppStore.getState();
    expect(freshStore.selectedShapeId).toBe('shape-2');
    expect(freshStore.drawing.isResizeMode).toBe(false);
    expect(freshStore.drawing.resizingShapeId).toBe(null);
  });

  it('should only work in select tool mode', () => {
    const store = useAppStore.getState();
    
    // Create a test shape
    const testShape = {
      id: 'test-rect',
      name: 'Test Rectangle',
      type: 'rectangle' as const,
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer',
      created: new Date(),
      modified: new Date()
    };

    store.addShape(testShape);
    
    // Set to non-select tool
    store.setActiveTool('rectangle');
    
    // Try to enter resize mode - should not work
    store.enterResizeMode('test-rect');
    const freshStore = useAppStore.getState();
    expect(freshStore.drawing.isResizeMode).toBe(false);
    expect(freshStore.drawing.resizingShapeId).toBe(null);
  });
});