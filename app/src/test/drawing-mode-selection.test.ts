import { beforeEach, describe, expect, test } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Drawing Mode vs Selection Mode', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearAll();
  });

  test('should clear hover state when switching to drawing tools', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Start in select mode and hover a shape
      useAppStore.getState().setActiveTool('select');
      useAppStore.getState().hoverShape(defaultShape.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(defaultShape.id);
      
      // Switch to rectangle tool
      useAppStore.getState().setActiveTool('rectangle');
      expect(useAppStore.getState().hoveredShapeId).toBeNull();
      expect(useAppStore.getState().drawing.activeTool).toBe('rectangle');
    }
  });

  test('should clear hover state when switching to polyline tool', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Start in select mode and hover a shape
      useAppStore.getState().setActiveTool('select');
      useAppStore.getState().hoverShape(defaultShape.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(defaultShape.id);
      
      // Switch to polyline tool
      useAppStore.getState().setActiveTool('polyline');
      expect(useAppStore.getState().hoveredShapeId).toBeNull();
      expect(useAppStore.getState().drawing.activeTool).toBe('polyline');
    }
  });

  test('should clear hover state when switching to circle tool', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Start in select mode and hover a shape
      useAppStore.getState().setActiveTool('select');
      useAppStore.getState().hoverShape(defaultShape.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(defaultShape.id);
      
      // Switch to circle tool
      useAppStore.getState().setActiveTool('circle');
      expect(useAppStore.getState().hoveredShapeId).toBeNull();
      expect(useAppStore.getState().drawing.activeTool).toBe('circle');
    }
  });

  test('should preserve hover state when staying in select mode', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Start in select mode and hover a shape
      useAppStore.getState().setActiveTool('select');
      useAppStore.getState().hoverShape(defaultShape.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(defaultShape.id);
      
      // Switch back to select tool (should preserve hover)
      useAppStore.getState().setActiveTool('select');
      expect(useAppStore.getState().hoveredShapeId).toBe(defaultShape.id);
      expect(useAppStore.getState().drawing.activeTool).toBe('select');
    }
  });

  test('should preserve selection when switching between tools', () => {
    const defaultShape = useAppStore.getState().shapes.find(s => s.id === 'default-land-area');
    
    if (defaultShape) {
      // Select a shape
      useAppStore.getState().selectShape(defaultShape.id);
      expect(useAppStore.getState().selectedShapeId).toBe(defaultShape.id);
      
      // Switch to drawing tools - selection should be preserved
      useAppStore.getState().setActiveTool('rectangle');
      expect(useAppStore.getState().selectedShapeId).toBe(defaultShape.id);
      
      useAppStore.getState().setActiveTool('polyline');
      expect(useAppStore.getState().selectedShapeId).toBe(defaultShape.id);
      
      useAppStore.getState().setActiveTool('circle');
      expect(useAppStore.getState().selectedShapeId).toBe(defaultShape.id);
      
      // Switch back to select mode - selection still preserved
      useAppStore.getState().setActiveTool('select');
      expect(useAppStore.getState().selectedShapeId).toBe(defaultShape.id);
    }
  });

  test('should reset drawing state when switching tools', () => {
    // Start drawing with rectangle tool
    useAppStore.getState().setActiveTool('rectangle');
    useAppStore.getState().startDrawing();
    expect(useAppStore.getState().drawing.isDrawing).toBe(true);
    expect(useAppStore.getState().drawing.activeTool).toBe('rectangle');
    
    // Switch to another tool - should reset drawing state
    useAppStore.getState().setActiveTool('polyline');
    expect(useAppStore.getState().drawing.isDrawing).toBe(false);
    expect(useAppStore.getState().drawing.currentShape).toBeNull();
    expect(useAppStore.getState().drawing.activeTool).toBe('polyline');
  });
});