import { beforeEach, describe, expect, test } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Smooth Dragging Implementation', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearAll();
  });

  test('should maintain original shape points during drag operations', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const originalPoints = [...defaultShape.points];
      const startPosition = { x: 0, y: 0 };
      
      // Start dragging - should store original points
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      
      const dragState = useAppStore.getState().dragState;
      expect(dragState.originalShapePoints).toEqual(originalPoints);
      expect(dragState.startPosition).toEqual(startPosition);
    }
  });

  test('should calculate offset from fixed start position, not moving baseline', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const originalPoints = [...defaultShape.points];
      const startPosition = { x: 0, y: 0 };
      
      // Start dragging
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      
      // Multiple drag updates
      const positions = [
        { x: 5, y: 3 },
        { x: 10, y: 6 },
        { x: 7, y: 4 },
      ];
      
      let expectedPoints = originalPoints;
      
      positions.forEach(position => {
        useAppStore.getState().updateDragPosition(position);
        
        // Calculate expected position from ORIGINAL points + total offset
        expectedPoints = originalPoints.map(point => ({
          x: point.x + (position.x - startPosition.x),
          y: point.y + (position.y - startPosition.y),
        }));
        
        const updatedShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
        expect(updatedShape?.points).toEqual(expectedPoints);
        
        // Start position should remain fixed
        expect(useAppStore.getState().dragState.startPosition).toEqual(startPosition);
      });
    }
  });

  test('should provide smooth movement without accumulated errors', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const originalPoints = [...defaultShape.points];
      const startPosition = { x: 0, y: 0 };
      
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      
      // Simulate many small movements (like real mouse movement)
      const movements = [];
      for (let i = 1; i <= 50; i++) {
        movements.push({ x: i * 0.1, y: i * 0.1 }); // Small increments
      }
      
      // Apply all movements
      movements.forEach(position => {
        useAppStore.getState().updateDragPosition(position);
      });
      
      const finalPosition = movements[movements.length - 1];
      const expectedFinalPoints = originalPoints.map(point => ({
        x: point.x + finalPosition.x,
        y: point.y + finalPosition.y,
      }));
      
      const finalShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
      
      // Should match exactly - no accumulated floating point errors
      expect(finalShape?.points).toEqual(expectedFinalPoints);
      
      // Move back to start - should return to original position
      useAppStore.getState().updateDragPosition(startPosition);
      const backToStartShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
      expect(backToStartShape?.points).toEqual(originalPoints);
    }
  });

  test('should handle precision floating point calculations correctly', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const originalPoints = [...defaultShape.points];
      const startPosition = { x: 0, y: 0 };
      
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      
      // Test with floating point numbers that could cause precision issues
      const precisionTestPosition = { x: 0.1 + 0.2, y: 0.1 + 0.2 }; // = 0.30000000000000004
      
      useAppStore.getState().updateDragPosition(precisionTestPosition);
      
      const updatedShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
      const expectedPoints = originalPoints.map(point => ({
        x: point.x + precisionTestPosition.x,
        y: point.y + precisionTestPosition.y,
      }));
      
      expect(updatedShape?.points).toEqual(expectedPoints);
    }
  });

  test('should reset correctly after drag completion', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const startPosition = { x: 0, y: 0 };
      const endPosition = { x: 10, y: 15 };
      
      // Complete drag operation
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      useAppStore.getState().updateDragPosition(endPosition);
      useAppStore.getState().finishDragging();
      
      // Drag state should be completely reset
      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedShapeId).toBeNull();
      expect(dragState.startPosition).toBeNull();
      expect(dragState.currentPosition).toBeNull();
      expect(dragState.originalShapePoints).toBeNull();
      
      // But shape should retain final position
      const finalShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
      expect(finalShape?.points[0].x).not.toBe(defaultShape.points[0].x);
    }
  });
});