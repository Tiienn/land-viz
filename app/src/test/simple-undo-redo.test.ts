import { describe, test, expect } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('Simple Undo/Redo Test', () => {
  test('undo/redo functionality works with shape deletion', () => {
    const store = useAppStore.getState();
    
    // Find a shape to delete (there should be at least a default shape)
    const initialShapeCount = store.shapes.length;
    expect(initialShapeCount).toBeGreaterThan(0);
    
    const shapeToDelete = store.shapes[0];
    const shapeId = shapeToDelete.id;
    
    // Delete the shape
    store.deleteShape(shapeId);
    expect(store.shapes.length).toBe(initialShapeCount - 1);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);
    
    // Undo the deletion
    store.undo();
    expect(store.shapes.length).toBe(initialShapeCount);
    expect(store.canUndo()).toBe(false);  // Should be false since we're back to initial state
    expect(store.canRedo()).toBe(true);
    
    // Redo the deletion
    store.redo();
    expect(store.shapes.length).toBe(initialShapeCount - 1);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);
  });
  
  test('basic undo/redo state methods exist', () => {
    const store = useAppStore.getState();
    
    expect(typeof store.undo).toBe('function');
    expect(typeof store.redo).toBe('function');
    expect(typeof store.canUndo).toBe('function');
    expect(typeof store.canRedo).toBe('function');
    expect(typeof store.saveToHistory).toBe('function');
  });
});