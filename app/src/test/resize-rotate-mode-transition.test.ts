import { beforeEach, describe, expect, test } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import type { Point2D } from '../types';

describe('Resize → Rotate Mode Transition Fix', () => {
  beforeEach(() => {
    // Reset the store to initial state
    const store = useAppStore.getState();
    store.clearAll();
  });

  test('should exit resize mode when entering rotate mode', () => {
    const store = useAppStore.getState();

    // Create a test rectangle
    const testRectangle = {
      type: 'rectangle' as const,
      name: 'Test Rectangle',
      points: [
        { x: -5, y: -5 },
        { x: 5, y: 5 }
      ] as Point2D[],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer'
    };

    // Add the shape to store
    store.addShape(testRectangle);
    const shapes = store.shapes;
    const rectangleId = shapes[shapes.length - 1].id; // Get the ID of the added shape

    // Step 1: Enter resize mode
    store.enterResizeMode(rectangleId);

    // Verify resize mode is active
    expect(store.drawing.isResizeMode).toBe(true);
    expect(store.drawing.resizingShapeId).toBe(rectangleId);
    expect(store.drawing.isRotateMode).toBe(false);
    expect(store.drawing.rotatingShapeId).toBeNull();

    // Step 2: Enter rotate mode (this should exit resize mode)
    store.enterRotateMode(rectangleId);

    // Verify that resize mode was properly exited
    expect(store.drawing.isResizeMode).toBe(false);
    expect(store.drawing.resizingShapeId).toBeNull();

    // Verify that rotate mode is now active
    expect(store.drawing.isRotateMode).toBe(true);
    expect(store.drawing.rotatingShapeId).toBe(rectangleId);
  });

  test('should handle exitResizeMode being called directly', () => {
    const store = useAppStore.getState();

    // Create a test rectangle
    const testRectangle = {
      type: 'rectangle' as const,
      name: 'Test Rectangle',
      points: [
        { x: -5, y: -5 },
        { x: 5, y: 5 }
      ] as Point2D[],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer'
    };

    store.addShape(testRectangle);
    const shapes = store.shapes;
    const rectangleId = shapes[shapes.length - 1].id;

    // Enter resize mode
    store.enterResizeMode(rectangleId);
    expect(store.drawing.isResizeMode).toBe(true);

    // Call exitResizeMode directly
    store.exitResizeMode();

    // Verify resize mode is properly exited
    expect(store.drawing.isResizeMode).toBe(false);
    expect(store.drawing.resizingShapeId).toBeNull();
    expect(store.drawing.resizeHandleType).toBeNull();
    expect(store.drawing.resizeHandleIndex).toBeNull();
    expect(store.drawing.maintainAspectRatio).toBe(false);
  });

  test('should allow immediate rotation after resize completion', () => {
    const store = useAppStore.getState();

    // Create a test rectangle
    const testRectangle = {
      type: 'rectangle' as const,
      name: 'Test Rectangle',
      points: [
        { x: -5, y: -5 },
        { x: 5, y: 5 }
      ] as Point2D[],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer'
    };

    store.addShape(testRectangle);
    const shapes = store.shapes;
    const rectangleId = shapes[shapes.length - 1].id;

    // Simulate the problematic workflow:
    // 1. Enter resize mode
    store.enterResizeMode(rectangleId);
    expect(store.drawing.isResizeMode).toBe(true);

    // 2. Simulate resize completion (this should call exitResizeMode)
    const newPoints: Point2D[] = [{ x: -10, y: -5 }, { x: 10, y: 5 }];
    store.resizeShape(rectangleId, newPoints);

    // At this point, the ResizableShapeControls should have called exitResizeMode
    // Since we can't easily simulate the component behavior in a unit test,
    // we'll call it manually to simulate what the component should do
    store.exitResizeMode();

    // 3. Verify that resize mode is properly exited
    expect(store.drawing.isResizeMode).toBe(false);
    expect(store.drawing.resizingShapeId).toBeNull();

    // 4. Now entering rotate mode should work
    store.enterRotateMode(rectangleId);
    expect(store.drawing.isRotateMode).toBe(true);
    expect(store.drawing.rotatingShapeId).toBe(rectangleId);
  });

  test('should not break when enterRotateMode is called without active resize mode', () => {
    const store = useAppStore.getState();

    // Create a test rectangle
    const testRectangle = {
      type: 'rectangle' as const,
      name: 'Test Rectangle',
      points: [
        { x: -5, y: -5 },
        { x: 5, y: 5 }
      ] as Point2D[],
      color: '#3B82F6',
      visible: true,
      layerId: 'default-layer'
    };

    store.addShape(testRectangle);
    const shapes = store.shapes;
    const rectangleId = shapes[shapes.length - 1].id;

    // Ensure no resize mode is active
    expect(store.drawing.isResizeMode).toBe(false);

    // Entering rotate mode should work normally
    store.enterRotateMode(rectangleId);
    expect(store.drawing.isRotateMode).toBe(true);
    expect(store.drawing.rotatingShapeId).toBe(rectangleId);
  });
});