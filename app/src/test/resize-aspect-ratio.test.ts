import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('Resize Aspect Ratio Functionality', () => {
  beforeEach(() => {
    useAppStore.getState().clearAll();
  });

  it('should maintain aspect ratio state when set', () => {
    const store = useAppStore.getState();
    
    // Initially aspect ratio should be false
    expect(store.drawing.maintainAspectRatio).toBe(false);
    
    // Set aspect ratio to true
    store.setMaintainAspectRatio(true);
    let freshStore = useAppStore.getState();
    expect(freshStore.drawing.maintainAspectRatio).toBe(true);
    
    // Set aspect ratio back to false
    store.setMaintainAspectRatio(false);
    freshStore = useAppStore.getState();
    expect(freshStore.drawing.maintainAspectRatio).toBe(false);
  });

  it('should reset aspect ratio when exiting resize mode', () => {
    const store = useAppStore.getState();
    
    // Set up a test scenario
    store.setActiveTool('select');
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
    store.selectShape('test-rect');
    store.enterResizeMode('test-rect');
    
    // Set aspect ratio during resize
    store.setMaintainAspectRatio(true);
    let freshStore = useAppStore.getState();
    expect(freshStore.drawing.maintainAspectRatio).toBe(true);
    
    // Exit resize mode should reset aspect ratio
    store.exitResizeMode();
    freshStore = useAppStore.getState();
    expect(freshStore.drawing.maintainAspectRatio).toBe(false);
  });

  it('should reset aspect ratio when selecting different shape', () => {
    const store = useAppStore.getState();
    
    // Set up test scenario with two shapes
    store.setActiveTool('select');
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
    
    // Enter resize mode for first shape and set aspect ratio
    store.selectShape('shape-1');
    store.enterResizeMode('shape-1');
    store.setMaintainAspectRatio(true);
    
    let freshStore = useAppStore.getState();
    expect(freshStore.drawing.maintainAspectRatio).toBe(true);
    
    // Select different shape should reset aspect ratio and exit resize mode
    store.selectShape('shape-2');
    freshStore = useAppStore.getState();
    expect(freshStore.drawing.maintainAspectRatio).toBe(false);
    expect(freshStore.drawing.isResizeMode).toBe(false);
  });

  it('should only work in select tool mode', () => {
    const store = useAppStore.getState();
    
    // Test in non-select mode
    store.setActiveTool('rectangle');
    store.setMaintainAspectRatio(true);
    
    // Aspect ratio can still be set, but resize mode won't work
    let freshStore = useAppStore.getState();
    expect(freshStore.drawing.maintainAspectRatio).toBe(true);
    
    // Create and try to resize a shape - should not work
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
    store.enterResizeMode('test-rect');
    
    freshStore = useAppStore.getState();
    expect(freshStore.drawing.isResizeMode).toBe(false);
    expect(freshStore.drawing.resizingShapeId).toBe(null);
  });
});