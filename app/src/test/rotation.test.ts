import { useAppStore } from '../store/useAppStore';
import type { Shape, Point2D } from '../types';

describe('Rotation Store Actions', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useAppStore.getState();
    store.clearAll();
  });

  test('enterRotateMode should set rotation state correctly', () => {
    const store = useAppStore.getState();
    
    // Create a test shape
    const testShape: Partial<Shape> = {
      points: [{x: 0, y: 0}, {x: 10, y: 10}],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      name: 'Test Rectangle'
    };
    
    store.addShape(testShape as any);
    const shapes = store.shapes;
    const shapeId = shapes[shapes.length - 1].id;
    
    // Enter rotate mode
    store.enterRotateMode(shapeId);
    
    const state = useAppStore.getState();
    expect(state.drawing.isRotateMode).toBe(true);
    expect(state.drawing.rotatingShapeId).toBe(shapeId);
    expect(state.drawing.rotationStartAngle).toBe(0);
    expect(state.drawing.rotationCenter).toBe(null);
    expect(state.selectedShapeId).toBe(shapeId);
    
    // Should exit other modes
    expect(state.drawing.isEditMode).toBe(false);
    expect(state.drawing.isResizeMode).toBe(false);
  });

  test('exitRotateMode should clear rotation state', () => {
    const store = useAppStore.getState();
    
    // First enter rotate mode
    store.addShape({
      points: [{x: 0, y: 0}, {x: 10, y: 10}],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      name: 'Test Rectangle'
    } as any);
    
    const shapes = store.shapes;
    const shapeId = shapes[shapes.length - 1].id;
    store.enterRotateMode(shapeId);
    
    // Then exit
    store.exitRotateMode();
    
    const state = useAppStore.getState();
    expect(state.drawing.isRotateMode).toBe(false);
    expect(state.drawing.rotatingShapeId).toBe(null);
    expect(state.drawing.rotationStartAngle).toBe(0);
    expect(state.drawing.rotationCenter).toBe(null);
  });

  test('rotateShape should add rotation metadata to shape', () => {
    const store = useAppStore.getState();
    
    // Create a test shape
    store.addShape({
      points: [{x: 0, y: 0}, {x: 10, y: 10}],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      name: 'Test Rectangle'
    } as any);
    
    const shapes = store.shapes;
    const shapeId = shapes[shapes.length - 1].id;
    const rotationCenter: Point2D = {x: 5, y: 5};
    const angle = 45;
    
    // Rotate the shape
    store.rotateShape(shapeId, angle, rotationCenter);
    
    const state = useAppStore.getState();
    const rotatedShape = state.shapes.find(s => s.id === shapeId);
    
    expect(rotatedShape).toBeDefined();
    expect(rotatedShape?.rotation).toBeDefined();
    expect(rotatedShape?.rotation?.angle).toBe(45);
    expect(rotatedShape?.rotation?.center).toEqual(rotationCenter);
  });

  test('cancelAll should reset rotation state', () => {
    const store = useAppStore.getState();
    
    // Set up rotation mode
    store.addShape({
      points: [{x: 0, y: 0}, {x: 10, y: 10}],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      name: 'Test Rectangle'
    } as any);
    
    const shapes = store.shapes;
    const shapeId = shapes[shapes.length - 1].id;
    store.enterRotateMode(shapeId);
    
    // Cancel all
    store.cancelAll();
    
    const state = useAppStore.getState();
    expect(state.drawing.isRotateMode).toBe(false);
    expect(state.drawing.rotatingShapeId).toBe(null);
    expect(state.drawing.rotationStartAngle).toBe(0);
    expect(state.drawing.rotationCenter).toBe(null);
    expect(state.drawing.activeTool).toBe('select');
  });
});