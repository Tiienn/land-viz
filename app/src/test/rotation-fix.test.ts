/**
 * Test suite for rotation fix implementation
 * Verifies that rotation no longer double-applies and undo/redo work correctly
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import type { Shape } from '../types';

// Helper to get a fresh store instance
const getStore = () => {
  const store = useAppStore.getState();
  store.clearAll(); // Reset store
  return store;
};

describe('Rotation Fix Implementation', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearAll();
  });

  test('should capture original rotation when entering rotate mode', () => {
    const store = getStore();

    // Create a test shape with existing rotation
    const testShape: Shape = {
      id: 'test-shape',
      name: 'Test Rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      created: new Date(),
      modified: new Date(),
      rotation: { angle: 45, center: { x: 5, y: 5 } }
    };

    // Add shape to store
    store.addShape(testShape);

    // Enter rotate mode
    store.enterRotateMode(testShape.id);

    // Verify original rotation was captured
    const state = useAppStore.getState();
    expect(state.drawing.originalRotation).toEqual({ angle: 45, center: { x: 5, y: 5 } });
    expect(state.drawing.isRotateMode).toBe(true);
    expect(state.drawing.rotatingShapeId).toBe(testShape.id);
  });

  test('should not double-apply rotation during live rotation', () => {
    const store = getStore();

    // Create a test shape with no initial rotation
    const testShape: Shape = {
      id: 'test-shape',
      name: 'Test Rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      created: new Date(),
      modified: new Date(),
    };

    // Add shape to store
    store.addShape(testShape);

    // Enter rotate mode (this captures original rotation)
    store.enterRotateMode(testShape.id);

    // Apply live rotation
    const rotationCenter = { x: 5, y: 5 };
    store.rotateShapeLive(testShape.id, 30, rotationCenter);

    // Verify shape has the expected rotation
    const shape = useAppStore.getState().shapes.find(s => s.id === testShape.id);
    expect(shape?.rotation).toEqual({ angle: 30, center: rotationCenter });
  });

  test('should save original state to history when committing rotation', () => {
    const store = getStore();

    // Create a test shape with initial rotation
    const testShape: Shape = {
      id: 'test-shape',
      name: 'Test Rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      created: new Date(),
      modified: new Date(),
      rotation: { angle: 45, center: { x: 5, y: 5 } }
    };

    // Add shape to store and save initial state
    store.addShape(testShape);
    store.saveToHistory();

    // Enter rotate mode
    store.enterRotateMode(testShape.id);

    // Apply live rotation
    const rotationCenter = { x: 5, y: 5 };
    store.rotateShapeLive(testShape.id, 90, rotationCenter);

    // Commit rotation to history
    store.rotateShape(testShape.id, 90, rotationCenter);

    // Verify final rotation is correct
    const finalShape = useAppStore.getState().shapes.find(s => s.id === testShape.id);
    expect(finalShape?.rotation).toEqual({ angle: 90, center: rotationCenter });

    // Verify we can undo to original state
    store.undo();
    const undoShape = useAppStore.getState().shapes.find(s => s.id === testShape.id);
    expect(undoShape?.rotation).toEqual({ angle: 45, center: { x: 5, y: 5 } });

    // Verify we can redo to final state
    store.redo();
    const redoShape = useAppStore.getState().shapes.find(s => s.id === testShape.id);
    expect(redoShape?.rotation).toEqual({ angle: 90, center: rotationCenter });
  });

  test('should handle rotation of unrotated shapes', () => {
    const store = getStore();

    // Create a test shape with no initial rotation
    const testShape: Shape = {
      id: 'test-shape',
      name: 'Test Rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      created: new Date(),
      modified: new Date(),
    };

    // Add shape to store
    store.addShape(testShape);
    store.saveToHistory();

    // Enter rotate mode (should capture default rotation)
    store.enterRotateMode(testShape.id);

    // Verify original rotation was set to default values
    const state = useAppStore.getState();
    expect(state.drawing.originalRotation).toEqual({ angle: 0, center: { x: 0, y: 0 } });

    // Apply rotation
    const rotationCenter = { x: 5, y: 5 };
    store.rotateShapeLive(testShape.id, 45, rotationCenter);
    store.rotateShape(testShape.id, 45, rotationCenter);

    // Verify final rotation
    const finalShape = useAppStore.getState().shapes.find(s => s.id === testShape.id);
    expect(finalShape?.rotation).toEqual({ angle: 45, center: rotationCenter });

    // Verify undo works (shape should have no rotation)
    store.undo();
    const undoShape = useAppStore.getState().shapes.find(s => s.id === testShape.id);
    expect(undoShape?.rotation).toBeUndefined();
  });

  test('should clear original rotation when exiting rotate mode', () => {
    const store = getStore();

    // Create a test shape
    const testShape: Shape = {
      id: 'test-shape',
      name: 'Test Rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      created: new Date(),
      modified: new Date(),
    };

    // Add shape and enter rotate mode
    store.addShape(testShape);
    store.enterRotateMode(testShape.id);

    // Verify rotate mode is active
    expect(useAppStore.getState().drawing.isRotateMode).toBe(true);
    expect(useAppStore.getState().drawing.originalRotation).not.toBeNull();

    // Exit rotate mode
    store.exitRotateMode();

    // Verify rotate mode is cleared
    const state = useAppStore.getState();
    expect(state.drawing.isRotateMode).toBe(false);
    expect(state.drawing.rotatingShapeId).toBeNull();
    expect(state.drawing.originalRotation).toBeNull();
  });
});