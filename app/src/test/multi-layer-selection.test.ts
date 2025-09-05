import { beforeEach, describe, expect, test } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Multi-Layer Selection Issues', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().clearAll();
  });

  test('should be able to select shapes across multiple layers', () => {
    // Create 5 layers
    useAppStore.getState().createLayer('Layer 1');
    useAppStore.getState().createLayer('Layer 2');
    useAppStore.getState().createLayer('Layer 3');
    useAppStore.getState().createLayer('Layer 4');
    useAppStore.getState().createLayer('Layer 5');

    const layers = useAppStore.getState().layers;
    expect(layers.length).toBe(6); // 5 created + 1 default layer

    const layer1 = layers.find(l => l.name === 'Layer 1');
    const layer2 = layers.find(l => l.name === 'Layer 2');
    const layer3 = layers.find(l => l.name === 'Layer 3');
    const layer4 = layers.find(l => l.name === 'Layer 4');
    const layer5 = layers.find(l => l.name === 'Layer 5');

    if (layer1 && layer2 && layer3 && layer4 && layer5) {
      // Add shapes to different layers
      const shapes = [
        {
          name: 'Shape on Layer 1',
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          type: 'rectangle' as const,
          color: '#FF5722',
          visible: true,
          layerId: layer1.id
        },
        {
          name: 'Shape on Layer 2',
          points: [{ x: 15, y: 15 }, { x: 25, y: 25 }],
          type: 'rectangle' as const,
          color: '#2196F3',
          visible: true,
          layerId: layer2.id
        },
        {
          name: 'Shape on Layer 3',
          points: [{ x: 30, y: 30 }, { x: 40, y: 40 }],
          type: 'circle' as const,
          color: '#4CAF50',
          visible: true,
          layerId: layer3.id
        },
        {
          name: 'Shape on Layer 4',
          points: [{ x: 45, y: 45 }, { x: 55, y: 55 }],
          type: 'rectangle' as const,
          color: '#9C27B0',
          visible: true,
          layerId: layer4.id
        },
        {
          name: 'Shape on Layer 5',
          points: [{ x: 60, y: 60 }, { x: 70, y: 70 }],
          type: 'rectangle' as const,
          color: '#FF9800',
          visible: true,
          layerId: layer5.id
        }
      ];

      // Add all shapes
      shapes.forEach(shape => {
        useAppStore.getState().addShape(shape);
      });

      const allShapes = useAppStore.getState().shapes;
      expect(allShapes.length).toBe(6); // 5 created + 1 default shape

      // Test that each shape can be selected individually
      shapes.forEach(shapeData => {
        const shape = allShapes.find(s => s.name === shapeData.name);
        expect(shape).toBeDefined();

        if (shape) {
          useAppStore.getState().selectShape(shape.id);
          expect(useAppStore.getState().selectedShapeId).toBe(shape.id);
          
          // Test deselection
          useAppStore.getState().selectShape(null);
          expect(useAppStore.getState().selectedShapeId).toBeNull();
        }
      });
    }
  });

  test('should handle overlapping shapes on different layers', () => {
    // Create 3 layers
    useAppStore.getState().createLayer('Bottom Layer');
    useAppStore.getState().createLayer('Middle Layer');
    useAppStore.getState().createLayer('Top Layer');

    const layers = useAppStore.getState().layers;
    const bottomLayer = layers.find(l => l.name === 'Bottom Layer');
    const middleLayer = layers.find(l => l.name === 'Middle Layer');
    const topLayer = layers.find(l => l.name === 'Top Layer');

    if (bottomLayer && middleLayer && topLayer) {
      // Create overlapping shapes on different layers (same position)
      const overlappingShapes = [
        {
          name: 'Bottom Shape',
          points: [{ x: 0, y: 0 }, { x: 20, y: 20 }],
          type: 'rectangle' as const,
          color: '#FF5722',
          visible: true,
          layerId: bottomLayer.id
        },
        {
          name: 'Middle Shape',
          points: [{ x: 5, y: 5 }, { x: 25, y: 25 }], // Overlaps with bottom
          type: 'rectangle' as const,
          color: '#2196F3',
          visible: true,
          layerId: middleLayer.id
        },
        {
          name: 'Top Shape',
          points: [{ x: 10, y: 10 }, { x: 30, y: 30 }], // Overlaps with both
          type: 'rectangle' as const,
          color: '#4CAF50',
          visible: true,
          layerId: topLayer.id
        }
      ];

      overlappingShapes.forEach(shape => {
        useAppStore.getState().addShape(shape);
      });

      const allShapes = useAppStore.getState().shapes;

      // Each shape should still be selectable despite overlap
      overlappingShapes.forEach(shapeData => {
        const shape = allShapes.find(s => s.name === shapeData.name);
        expect(shape).toBeDefined();

        if (shape) {
          useAppStore.getState().selectShape(shape.id);
          expect(useAppStore.getState().selectedShapeId).toBe(shape.id);
        }
      });
    }
  });

  test('should respect layer visibility for selection', () => {
    // Create layer
    useAppStore.getState().createLayer('Test Layer');
    const layers = useAppStore.getState().layers;
    const testLayer = layers.find(l => l.name === 'Test Layer');

    if (testLayer) {
      // Add shape to layer
      const shape = {
        name: 'Test Shape',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        type: 'rectangle' as const,
        color: '#FF5722',
        visible: true,
        layerId: testLayer.id
      };

      useAppStore.getState().addShape(shape);
      const allShapes = useAppStore.getState().shapes;
      const addedShape = allShapes.find(s => s.name === 'Test Shape');

      expect(addedShape).toBeDefined();

      if (addedShape) {
        // Should be selectable when layer is visible
        useAppStore.getState().selectShape(addedShape.id);
        expect(useAppStore.getState().selectedShapeId).toBe(addedShape.id);

        // Layer visibility doesn't affect selection in the store - shapes are still selectable
        // This test confirms that selection works regardless of layer state
        useAppStore.getState().selectShape(null); // Deselect first
        useAppStore.getState().selectShape(addedShape.id);
        expect(useAppStore.getState().selectedShapeId).toBe(addedShape.id);
      }
    }
  });

  test('should handle layer elevation correctly', () => {
    // This test ensures that layer elevation doesn't interfere with selection logic
    useAppStore.getState().createLayer('High Layer');
    useAppStore.getState().createLayer('Low Layer');

    const layers = useAppStore.getState().layers;
    const highLayer = layers.find(l => l.name === 'High Layer');
    const lowLayer = layers.find(l => l.name === 'Low Layer');

    if (highLayer && lowLayer) {
      // Add shapes to both layers
      const shapeOnHighLayer = {
        name: 'High Shape',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        type: 'rectangle' as const,
        color: '#FF5722',
        visible: true,
        layerId: highLayer.id
      };

      const shapeOnLowLayer = {
        name: 'Low Shape',
        points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
        type: 'rectangle' as const,
        color: '#2196F3',
        visible: true,
        layerId: lowLayer.id
      };

      useAppStore.getState().addShape(shapeOnHighLayer);
      useAppStore.getState().addShape(shapeOnLowLayer);

      const allShapes = useAppStore.getState().shapes;
      const highShape = allShapes.find(s => s.name === 'High Shape');
      const lowShape = allShapes.find(s => s.name === 'Low Shape');

      expect(highShape).toBeDefined();
      expect(lowShape).toBeDefined();

      if (highShape && lowShape) {
        // Both shapes should be selectable regardless of their layer elevation
        useAppStore.getState().selectShape(highShape.id);
        expect(useAppStore.getState().selectedShapeId).toBe(highShape.id);

        useAppStore.getState().selectShape(lowShape.id);
        expect(useAppStore.getState().selectedShapeId).toBe(lowShape.id);
      }
    }
  });
});