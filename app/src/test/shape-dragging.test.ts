import { beforeEach, describe, expect, test } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Shape Dragging Functionality', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearAll();
  });

  test('should have initial drag state as not dragging', () => {
    const dragState = useAppStore.getState().dragState;
    expect(dragState.isDragging).toBe(false);
    expect(dragState.draggedShapeId).toBeNull();
    expect(dragState.startPosition).toBeNull();
    expect(dragState.currentPosition).toBeNull();
    expect(dragState.originalShapePoints).toBeNull();
  });

  test('should start dragging when startDragging is called', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const startPosition = { x: 10, y: 20 };
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      
      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(true);
      expect(dragState.draggedShapeId).toBe(defaultShape.id);
      expect(dragState.startPosition).toEqual(startPosition);
      expect(dragState.currentPosition).toEqual(startPosition);
      expect(dragState.originalShapePoints).toEqual(defaultShape.points);
    }
  });

  test('should update shape position during drag', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const originalPoints = [...defaultShape.points];
      const startPosition = { x: 0, y: 0 };
      const newPosition = { x: 10, y: 15 };
      
      // Start dragging
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      
      // Update drag position
      useAppStore.getState().updateDragPosition(newPosition);
      
      // Check that shape position has been updated
      const updatedShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
      expect(updatedShape).toBeDefined();
      
      if (updatedShape) {
        // All points should be offset by the drag amount
        const expectedPoints = originalPoints.map(point => ({
          x: point.x + newPosition.x - startPosition.x,
          y: point.y + newPosition.y - startPosition.y
        }));
        
        expect(updatedShape.points).toEqual(expectedPoints);
      }
    }
  });

  test('should finish dragging and save to history', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const startPosition = { x: 0, y: 0 };
      const newPosition = { x: 5, y: 10 };
      
      // Start and update drag
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      useAppStore.getState().updateDragPosition(newPosition);
      
      // Finish dragging
      useAppStore.getState().finishDragging();
      
      // Check drag state is reset
      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedShapeId).toBeNull();
      expect(dragState.startPosition).toBeNull();
      expect(dragState.currentPosition).toBeNull();
      expect(dragState.originalShapePoints).toBeNull();
      
      // Shape position should be preserved
      const finalShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
      expect(finalShape?.points[0].x).not.toBe(defaultShape.points[0].x);
    }
  });

  test('should cancel dragging', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      const startPosition = { x: 0, y: 0 };
      
      // Start dragging
      useAppStore.getState().startDragging(defaultShape.id, startPosition);
      expect(useAppStore.getState().dragState.isDragging).toBe(true);
      
      // Cancel dragging
      useAppStore.getState().cancelDragging();
      
      // Check drag state is reset
      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedShapeId).toBeNull();
      expect(dragState.startPosition).toBeNull();
      expect(dragState.currentPosition).toBeNull();
      expect(dragState.originalShapePoints).toBeNull();
    }
  });

  test('should handle multiple drag operations correctly', () => {
    const shapes = useAppStore.getState().shapes;
    const defaultShape = shapes.find(s => s.id === 'default-land-area');
    
    // Add another shape for testing
    const testShape = {
      name: 'Test Shape',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      type: 'rectangle' as const,
      color: '#FF5722',
      visible: true,
      layerId: 'default-layer'
    };
    useAppStore.getState().addShape(testShape);
    
    const updatedShapes = useAppStore.getState().shapes;
    const addedShape = updatedShapes.find(s => s.name === 'Test Shape');
    
    if (defaultShape && addedShape) {
      // Drag first shape
      useAppStore.getState().startDragging(defaultShape.id, { x: 0, y: 0 });
      useAppStore.getState().updateDragPosition({ x: 5, y: 5 });
      useAppStore.getState().finishDragging();
      
      // Drag second shape
      useAppStore.getState().startDragging(addedShape.id, { x: 0, y: 0 });
      useAppStore.getState().updateDragPosition({ x: -10, y: -10 });
      useAppStore.getState().finishDragging();
      
      // Both shapes should have moved
      const finalShapes = useAppStore.getState().shapes;
      const finalDefaultShape = finalShapes.find(s => s.id === defaultShape.id);
      const finalAddedShape = finalShapes.find(s => s.id === addedShape.id);
      
      expect(finalDefaultShape?.points[0].x).not.toBe(defaultShape.points[0].x);
      expect(finalAddedShape?.points[0].x).not.toBe(addedShape.points[0].x);
    }
  });

  test('should not persist drag state in history', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Start dragging
      useAppStore.getState().startDragging(defaultShape.id, { x: 0, y: 0 });
      
      // Save to history manually
      useAppStore.getState().saveToHistory();
      
      // Check that drag state is not persisted in history
      const historyState = JSON.parse(useAppStore.getState().history.present);
      expect(historyState.dragState.isDragging).toBe(false);
      expect(historyState.dragState.draggedShapeId).toBeNull();
    }
  });
});