/**
 * Test: Undo/Redo after Delete
 *
 * Verifies that the undo/redo functionality works correctly
 * after deleting a shape.
 *
 * Bug: After deleting a shape and pressing undo (shape comes back),
 * pressing redo would do nothing instead of deleting the shape again.
 *
 * Root cause: saveToHistory() was only called before the delete,
 * not after, so the state after delete was never saved to history.
 *
 * Fix: Call saveToHistory() both before AND after the delete action.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Unmock useAppStore to use the real implementation
vi.unmock('../store/useAppStore');

import { useAppStore } from '../store/useAppStore';
import type { Shape } from '../types';

describe('Undo/Redo after Delete', () => {
  beforeEach(() => {
    const store = useAppStore.getState();

    // Clear all shapes
    store.shapes.forEach(shape => store.deleteShape(shape.id));
  });

  it('should correctly redo a delete operation after undo', () => {
    const store = useAppStore.getState();

    // Step 1: Add a shape
    const testShape: Shape = {
      id: 'test-shape-1',
      type: 'rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      color: '#FF0000',
      layerId: 'default',
      created: new Date(),
      modified: new Date(),
    };

    store.addShape(testShape);

    // Verify shape was added
    expect(useAppStore.getState().shapes.length).toBe(1);
    expect(useAppStore.getState().shapes[0].id).toBe('test-shape-1');

    // Step 2: Delete the shape
    store.deleteShape('test-shape-1');

    // Verify shape was deleted
    expect(useAppStore.getState().shapes.length).toBe(0);

    // Step 3: Undo the delete
    store.undo();

    // Verify shape is back
    expect(useAppStore.getState().shapes.length).toBe(1);
    expect(useAppStore.getState().shapes[0].id).toBe('test-shape-1');

    // Step 4: Redo the delete
    store.redo();

    // Verify shape is deleted again (THIS WAS THE BUG - redo did nothing)
    expect(useAppStore.getState().shapes.length).toBe(0);
  });

  it('should correctly redo an add operation after undo', () => {
    const store = useAppStore.getState();

    // Initial state: no shapes
    expect(useAppStore.getState().shapes.length).toBe(0);

    // Step 1: Add a shape
    const testShape: Shape = {
      id: 'test-shape-2',
      type: 'circle',
      points: [
        { x: 5, y: 5 },
        { x: 10, y: 10 },
      ],
      color: '#00FF00',
      layerId: 'default',
      created: new Date(),
      modified: new Date(),
    };

    store.addShape(testShape);

    // Verify shape was added
    expect(useAppStore.getState().shapes.length).toBe(1);

    // Step 2: Undo the add
    store.undo();

    // Verify shape is gone
    expect(useAppStore.getState().shapes.length).toBe(0);

    // Step 3: Redo the add
    store.redo();

    // Verify shape is back
    expect(useAppStore.getState().shapes.length).toBe(1);
    expect(useAppStore.getState().shapes[0].id).toBe('test-shape-2');
  });

  it('should handle multiple undo/redo operations', () => {
    const store = useAppStore.getState();

    // Add first shape
    const shape1: Shape = {
      id: 'shape-1',
      type: 'rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
      color: '#FF0000',
      layerId: 'default',
      created: new Date(),
      modified: new Date(),
    };

    store.addShape(shape1);
    expect(useAppStore.getState().shapes.length).toBe(1);

    // Add second shape
    const shape2: Shape = {
      id: 'shape-2',
      type: 'circle',
      points: [
        { x: 10, y: 10 },
        { x: 15, y: 15 },
      ],
      color: '#00FF00',
      layerId: 'default',
      created: new Date(),
      modified: new Date(),
    };

    store.addShape(shape2);
    expect(useAppStore.getState().shapes.length).toBe(2);

    // Delete first shape
    store.deleteShape('shape-1');
    expect(useAppStore.getState().shapes.length).toBe(1);
    expect(useAppStore.getState().shapes[0].id).toBe('shape-2');

    // Undo delete (shape-1 comes back)
    store.undo();
    expect(useAppStore.getState().shapes.length).toBe(2);

    // Undo add (shape-2 is removed)
    store.undo();
    expect(useAppStore.getState().shapes.length).toBe(1);
    expect(useAppStore.getState().shapes[0].id).toBe('shape-1');

    // Redo add (shape-2 comes back)
    store.redo();
    expect(useAppStore.getState().shapes.length).toBe(2);

    // Redo delete (shape-1 is removed)
    store.redo();
    expect(useAppStore.getState().shapes.length).toBe(1);
    expect(useAppStore.getState().shapes[0].id).toBe('shape-2');
  });
});
