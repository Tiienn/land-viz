/**
 * Test for rotation handle persistence fix
 * 
 * Issue: Rotation handles were persisting on shapes after clicking elsewhere 
 * or selecting other shapes.
 * 
 * Fix: Added exitRotateMode() calls in selectShape() and handleClick()
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Rotation Handle Persistence Fix', () => {

  beforeEach(() => {
    // Reset store state
    useAppStore.getState().clearAll();
    
    // Add test shapes
    useAppStore.getState().addShape({
      name: 'Test Rectangle',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      type: 'rectangle',
      color: '#3B82F6',
      visible: true,
      layerId: useAppStore.getState().layers[0]?.id || 'default',
    });
    
    useAppStore.getState().addShape({
      name: 'Test Circle', 
      points: [
        { x: 20, y: 20 }, { x: 25, y: 20 }, { x: 25, y: 25 }, { x: 20, y: 25 }
      ],
      type: 'circle',
      color: '#10B981',
      visible: true,
      layerId: useAppStore.getState().layers[0]?.id || 'default',
    });
  });

  it('should clear rotation mode when selecting null (empty space click)', () => {
    const shapes = useAppStore.getState().shapes;
    const firstShape = shapes[0];
    
    // Setup: Select a shape and enter rotation mode
    useAppStore.getState().selectShape(firstShape.id);
    useAppStore.getState().enterRotateMode(firstShape.id);
    
    // Verify rotation mode is active
    expect(useAppStore.getState().drawing.isRotateMode).toBe(true);
    expect(useAppStore.getState().drawing.rotatingShapeId).toBe(firstShape.id);
    
    // Action: Click empty space (select null)
    useAppStore.getState().selectShape(null);
    
    // Verify: Rotation mode should be cleared
    expect(useAppStore.getState().drawing.isRotateMode).toBe(false);
    expect(useAppStore.getState().drawing.rotatingShapeId).toBe(null);
    expect(useAppStore.getState().drawing.rotationStartAngle).toBe(0);
    expect(useAppStore.getState().drawing.rotationCenter).toBe(null);
  });

  it('should clear rotation mode when switching to different shape', () => {
    const shapes = useAppStore.getState().shapes;
    const firstShape = shapes[0];
    const secondShape = shapes[1];
    
    // Setup: Select first shape and enter rotation mode
    useAppStore.getState().selectShape(firstShape.id);
    useAppStore.getState().enterRotateMode(firstShape.id);
    
    // Verify rotation mode is active for first shape
    expect(useAppStore.getState().drawing.isRotateMode).toBe(true);
    expect(useAppStore.getState().drawing.rotatingShapeId).toBe(firstShape.id);
    
    // Action: Select different shape
    useAppStore.getState().selectShape(secondShape.id);
    
    // Verify: Rotation mode should be cleared
    expect(useAppStore.getState().drawing.isRotateMode).toBe(false);
    expect(useAppStore.getState().drawing.rotatingShapeId).toBe(null);
    expect(useAppStore.getState().drawing.rotationStartAngle).toBe(0);
    expect(useAppStore.getState().drawing.rotationCenter).toBe(null);
    expect(useAppStore.getState().selectedShapeId).toBe(secondShape.id);
  });

  it('should clear rotation mode when re-selecting same shape', () => {
    const shapes = useAppStore.getState().shapes;
    const firstShape = shapes[0];
    
    // Setup: Select shape and enter rotation mode
    useAppStore.getState().selectShape(firstShape.id);
    useAppStore.getState().enterRotateMode(firstShape.id);
    
    // Verify rotation mode is active
    expect(useAppStore.getState().drawing.isRotateMode).toBe(true);
    expect(useAppStore.getState().drawing.rotatingShapeId).toBe(firstShape.id);
    
    // Action: Select same shape again (should clear rotation mode due to fix)
    useAppStore.getState().selectShape(firstShape.id);
    
    // Verify: Rotation mode should be cleared due to our fix
    expect(useAppStore.getState().drawing.isRotateMode).toBe(false);
    expect(useAppStore.getState().drawing.rotatingShapeId).toBe(null);
    expect(useAppStore.getState().selectedShapeId).toBe(firstShape.id);
  });
});