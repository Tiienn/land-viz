import { beforeEach, describe, expect, test } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import type { Shape } from '../types';

describe('Shape Selection Functionality (Double Click)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearAll();
  });

  test('should initially have no hovered shape', () => {
    expect(useAppStore.getState().hoveredShapeId).toBeNull();
  });

  test('should be able to set and clear hover state', () => {
    // Use the default shape that should already exist
    const shapes = useAppStore.getState().shapes;
    const defaultShape = shapes.find(s => s.id === 'default-land-area');
    
    expect(defaultShape).toBeDefined();
    
    if (defaultShape) {
      // Test hovering
      useAppStore.getState().hoverShape(defaultShape.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(defaultShape.id);
      
      // Test clearing hover
      useAppStore.getState().hoverShape(null);
      expect(useAppStore.getState().hoveredShapeId).toBeNull();
    }
  });

  test('should be able to select and deselect shapes', () => {
    // The default shape should be selected initially
    const currentState = useAppStore.getState();
    const defaultShape = currentState.shapes.find(s => s.id === 'default-land-area');
    expect(defaultShape).toBeDefined();
    expect(currentState.selectedShapeId).toBe('default-land-area');
    
    // Test deselection
    useAppStore.getState().selectShape(null);
    expect(useAppStore.getState().selectedShapeId).toBeNull();
    
    // Test re-selection
    if (defaultShape) {
      useAppStore.getState().selectShape(defaultShape.id);
      expect(useAppStore.getState().selectedShapeId).toBe(defaultShape.id);
    }
  });

  test('should maintain separate hover and selection states', () => {
    const currentState = useAppStore.getState();
    const defaultShape = currentState.shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Set different hover and selection states
      useAppStore.getState().selectShape(defaultShape.id);
      useAppStore.getState().hoverShape(null);
      
      const state1 = useAppStore.getState();
      expect(state1.selectedShapeId).toBe(defaultShape.id);
      expect(state1.hoveredShapeId).toBeNull();
      
      // Hover should not affect selection
      useAppStore.getState().hoverShape(defaultShape.id);
      const state2 = useAppStore.getState();
      expect(state2.selectedShapeId).toBe(defaultShape.id);
      expect(state2.hoveredShapeId).toBe(defaultShape.id);
    }
  });

  test('should not persist hover state in history', () => {
    const currentState = useAppStore.getState();
    const defaultShape = currentState.shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Set hover state and save to history
      useAppStore.getState().hoverShape(defaultShape.id);
      useAppStore.getState().saveToHistory();
      
      // The hover state should not be persisted in history
      const finalState = useAppStore.getState();
      const historyState = JSON.parse(finalState.history.present);
      expect(historyState.hoveredShapeId).toBeNull();
    }
  });
});