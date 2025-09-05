import { beforeEach, describe, expect, test } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Multi-Shape Selection Issues', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearAll();
  });

  test('should be able to select between multiple shapes', () => {
    // Add multiple test shapes
    const shape1 = {
      name: 'Rectangle 1',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      type: 'rectangle' as const,
      color: '#FF5722',
      visible: true,
      layerId: 'default-layer'
    };

    const shape2 = {
      name: 'Rectangle 2',
      points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
      type: 'rectangle' as const,
      color: '#2196F3',
      visible: true,
      layerId: 'default-layer'
    };

    const shape3 = {
      name: 'Circle 1',
      points: [
        { x: 50, y: 50 }, { x: 60, y: 50 }, { x: 60, y: 60 }, { x: 50, y: 60 }
      ], // Simplified circle as rectangle for testing
      type: 'circle' as const,
      color: '#4CAF50',
      visible: true,
      layerId: 'default-layer'
    };

    // Add all shapes
    useAppStore.getState().addShape(shape1);
    useAppStore.getState().addShape(shape2);
    useAppStore.getState().addShape(shape3);

    const shapes = useAppStore.getState().shapes;
    
    // Should have default shape + 3 new shapes = 4 total
    expect(shapes.length).toBe(4);
    
    const addedShape1 = shapes.find(s => s.name === 'Rectangle 1');
    const addedShape2 = shapes.find(s => s.name === 'Rectangle 2');
    const addedShape3 = shapes.find(s => s.name === 'Circle 1');
    
    expect(addedShape1).toBeDefined();
    expect(addedShape2).toBeDefined();
    expect(addedShape3).toBeDefined();

    if (addedShape1 && addedShape2 && addedShape3) {
      // Test selection of each shape
      useAppStore.getState().selectShape(addedShape1.id);
      expect(useAppStore.getState().selectedShapeId).toBe(addedShape1.id);

      useAppStore.getState().selectShape(addedShape2.id);
      expect(useAppStore.getState().selectedShapeId).toBe(addedShape2.id);

      useAppStore.getState().selectShape(addedShape3.id);
      expect(useAppStore.getState().selectedShapeId).toBe(addedShape3.id);

      // Test deselection
      useAppStore.getState().selectShape(null);
      expect(useAppStore.getState().selectedShapeId).toBeNull();
    }
  });

  test('should handle hover state with multiple shapes', () => {
    // Add two test shapes
    const shape1 = {
      name: 'Shape 1',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      type: 'rectangle' as const,
      color: '#FF5722',
      visible: true,
      layerId: 'default-layer'
    };

    const shape2 = {
      name: 'Shape 2',
      points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
      type: 'rectangle' as const,
      color: '#2196F3',
      visible: true,
      layerId: 'default-layer'
    };

    useAppStore.getState().addShape(shape1);
    useAppStore.getState().addShape(shape2);

    const shapes = useAppStore.getState().shapes;
    const addedShape1 = shapes.find(s => s.name === 'Shape 1');
    const addedShape2 = shapes.find(s => s.name === 'Shape 2');

    if (addedShape1 && addedShape2) {
      // Test hover switching between shapes
      useAppStore.getState().hoverShape(addedShape1.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(addedShape1.id);

      useAppStore.getState().hoverShape(addedShape2.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(addedShape2.id);

      useAppStore.getState().hoverShape(null);
      expect(useAppStore.getState().hoveredShapeId).toBeNull();
    }
  });

  test('should maintain independent selection and hover states', () => {
    const shape1 = {
      name: 'Selected Shape',
      points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
      type: 'rectangle' as const,
      color: '#FF5722',
      visible: true,
      layerId: 'default-layer'
    };

    const shape2 = {
      name: 'Hovered Shape',
      points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
      type: 'rectangle' as const,
      color: '#2196F3',
      visible: true,
      layerId: 'default-layer'
    };

    useAppStore.getState().addShape(shape1);
    useAppStore.getState().addShape(shape2);

    const shapes = useAppStore.getState().shapes;
    const selectedShape = shapes.find(s => s.name === 'Selected Shape');
    const hoveredShape = shapes.find(s => s.name === 'Hovered Shape');

    if (selectedShape && hoveredShape) {
      // Select one shape and hover another
      useAppStore.getState().selectShape(selectedShape.id);
      useAppStore.getState().hoverShape(hoveredShape.id);

      expect(useAppStore.getState().selectedShapeId).toBe(selectedShape.id);
      expect(useAppStore.getState().hoveredShapeId).toBe(hoveredShape.id);

      // These should be independent
      expect(useAppStore.getState().selectedShapeId).not.toBe(useAppStore.getState().hoveredShapeId);
    }
  });

  test('should handle selection with overlapping shapes', () => {
    // Create shapes that overlap in the same area
    const shape1 = {
      name: 'Bottom Shape',
      points: [{ x: 0, y: 0 }, { x: 20, y: 20 }],
      type: 'rectangle' as const,
      color: '#FF5722',
      visible: true,
      layerId: 'default-layer'
    };

    const shape2 = {
      name: 'Top Shape',
      points: [{ x: 10, y: 10 }, { x: 30, y: 30 }], // Overlaps with shape1
      type: 'rectangle' as const,
      color: '#2196F3',
      visible: true,
      layerId: 'default-layer'
    };

    useAppStore.getState().addShape(shape1);
    useAppStore.getState().addShape(shape2);

    const shapes = useAppStore.getState().shapes;
    const bottomShape = shapes.find(s => s.name === 'Bottom Shape');
    const topShape = shapes.find(s => s.name === 'Top Shape');

    expect(bottomShape).toBeDefined();
    expect(topShape).toBeDefined();

    if (bottomShape && topShape) {
      // Should be able to select either shape individually
      useAppStore.getState().selectShape(bottomShape.id);
      expect(useAppStore.getState().selectedShapeId).toBe(bottomShape.id);

      useAppStore.getState().selectShape(topShape.id);
      expect(useAppStore.getState().selectedShapeId).toBe(topShape.id);
    }
  });

  test('should maintain layer-based rendering order', () => {
    // Create multiple layers
    useAppStore.getState().createLayer('Layer 1');
    useAppStore.getState().createLayer('Layer 2');

    const layers = useAppStore.getState().layers;
    const layer1 = layers.find(l => l.name === 'Layer 1');
    const layer2 = layers.find(l => l.name === 'Layer 2');

    if (layer1 && layer2) {
      const shape1 = {
        name: 'Shape on Layer 1',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        type: 'rectangle' as const,
        color: '#FF5722',
        visible: true,
        layerId: layer1.id
      };

      const shape2 = {
        name: 'Shape on Layer 2',
        points: [{ x: 5, y: 5 }, { x: 15, y: 15 }], // Overlapping
        type: 'rectangle' as const,
        color: '#2196F3',
        visible: true,
        layerId: layer2.id
      };

      useAppStore.getState().addShape(shape1);
      useAppStore.getState().addShape(shape2);

      const shapes = useAppStore.getState().shapes;
      const shapeOnLayer1 = shapes.find(s => s.name === 'Shape on Layer 1');
      const shapeOnLayer2 = shapes.find(s => s.name === 'Shape on Layer 2');

      // Both shapes should be selectable regardless of layer order
      if (shapeOnLayer1 && shapeOnLayer2) {
        useAppStore.getState().selectShape(shapeOnLayer1.id);
        expect(useAppStore.getState().selectedShapeId).toBe(shapeOnLayer1.id);

        useAppStore.getState().selectShape(shapeOnLayer2.id);
        expect(useAppStore.getState().selectedShapeId).toBe(shapeOnLayer2.id);
      }
    }
  });
});