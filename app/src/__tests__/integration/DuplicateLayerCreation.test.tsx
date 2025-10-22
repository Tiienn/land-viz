/**
 * Integration Test: Duplicate Feature - Layer Creation
 *
 * This test verifies that the duplicate feature (Ctrl+D) correctly creates new layers
 * with the " copy" suffix as specified in the implementation.
 *
 * Test Objectives:
 * 1. Verify duplicate feature creates a new layer for the duplicated shape
 * 2. Verify the new layer has " copy" suffix in its name
 * 3. Verify the original layer remains unchanged
 * 4. Verify the duplicated shape is assigned to the new layer
 * 5. Verify the duplicated shape is offset from the original
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Unmock the store to use real implementation
vi.unmock('../../store/useAppStore');

import { useAppStore } from '../../store/useAppStore';

describe('Duplicate Feature - Layer Creation', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useAppStore.getState();
    store.shapes.forEach(shape => store.deleteShape(shape.id));
    store.clearSelection();
  });

  it('should create a new layer with " copy" suffix when duplicating a rectangle', () => {
    const store = useAppStore.getState();

    // Step 1: Create a rectangle shape
    const rectangleShape = {
      type: 'rectangle' as const,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ],
      color: '#FF0000',
      name: 'Test Rectangle',
      layerId: 'default-layer', // Initially on default layer
    };

    store.addShape(rectangleShape);

    // Verify initial state
    const initialState = useAppStore.getState();
    expect(initialState.shapes.length).toBe(1);
    const originalShape = initialState.shapes[0];
    const originalLayerId = originalShape.layerId;
    const originalLayer = initialState.layers.find(l => l.id === originalLayerId);

    expect(originalLayer).toBeDefined();
    expect(originalLayer?.name).toBeTruthy();

    console.log('\n=== BEFORE DUPLICATE ===');
    console.log('Original Shape ID:', originalShape.id);
    console.log('Original Shape Name:', originalShape.name);
    console.log('Original Layer ID:', originalLayerId);
    console.log('Original Layer Name:', originalLayer?.name);
    console.log('Total Shapes:', initialState.shapes.length);
    console.log('Total Layers:', initialState.layers.length);

    // Step 2: Duplicate the shape using Ctrl+D functionality
    store.duplicateShape(originalShape.id);

    // Step 3: Verify the results
    const finalState = useAppStore.getState();

    console.log('\n=== AFTER DUPLICATE ===');
    console.log('Total Shapes:', finalState.shapes.length);
    console.log('Total Layers:', finalState.layers.length);

    // Verify we have 2 shapes now
    expect(finalState.shapes.length).toBe(2);

    // Find the duplicated shape (it should be the new one)
    const duplicatedShape = finalState.shapes.find(s => s.id !== originalShape.id);
    expect(duplicatedShape).toBeDefined();

    console.log('\nDuplicated Shape ID:', duplicatedShape?.id);
    console.log('Duplicated Shape Name:', duplicatedShape?.name);
    console.log('Duplicated Shape Layer ID:', duplicatedShape?.layerId);

    // Verify the duplicated shape has a different layer ID
    expect(duplicatedShape?.layerId).not.toBe(originalLayerId);

    // Find the new layer
    const newLayer = finalState.layers.find(l => l.id === duplicatedShape?.layerId);
    expect(newLayer).toBeDefined();

    console.log('New Layer ID:', newLayer?.id);
    console.log('New Layer Name:', newLayer?.name);

    // **Critical Verification**: The new layer should have " copy" suffix
    expect(newLayer?.name).toContain(' copy');

    // Verify the original layer name is preserved in the new layer name
    expect(newLayer?.name).toBe(`${originalLayer?.name} copy`);

    // Verify the duplicated shape is offset from the original
    expect(duplicatedShape?.points[0].x).toBe(originalShape.points[0].x + 20);
    expect(duplicatedShape?.points[0].y).toBe(originalShape.points[0].y + 20);

    // Verify the original shape and layer are unchanged
    const updatedOriginalShape = finalState.shapes.find(s => s.id === originalShape.id);
    expect(updatedOriginalShape?.layerId).toBe(originalLayerId);

    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ Original layer name:', originalLayer?.name);
    console.log('✓ New layer name:', newLayer?.name);
    console.log('✓ New layer has " copy" suffix:', newLayer?.name.endsWith(' copy'));
    console.log('✓ Duplicated shape assigned to new layer');
    console.log('✓ Duplicated shape offset by (20, 20)');
    console.log('✓ Original shape and layer unchanged');
  });

  it('should create a new layer for each duplicated shape in a multi-selection', () => {
    const store = useAppStore.getState();

    // Create two shapes
    store.addShape({
      type: 'rectangle' as const,
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 }
      ],
      color: '#FF0000',
      name: 'Rectangle 1',
      layerId: 'default-layer',
    });

    store.addShape({
      type: 'rectangle' as const,
      points: [
        { x: 100, y: 0 },
        { x: 150, y: 0 },
        { x: 150, y: 50 },
        { x: 100, y: 50 }
      ],
      color: '#00FF00',
      name: 'Rectangle 2',
      layerId: 'default-layer',
    });

    const initialState = useAppStore.getState();
    expect(initialState.shapes.length).toBe(2);

    const shape1Id = initialState.shapes[0].id;
    const shape2Id = initialState.shapes[1].id;

    // Group the shapes
    store.selectMultipleShapes([shape1Id, shape2Id]);
    store.groupShapes();

    const groupedState = useAppStore.getState();
    const initialLayerCount = groupedState.layers.length;

    console.log('\n=== MULTI-SELECTION DUPLICATE TEST ===');
    console.log('Initial shapes:', groupedState.shapes.length);
    console.log('Initial layers:', initialLayerCount);

    // Duplicate the first shape (should duplicate all selected grouped shapes)
    store.duplicateShape(shape1Id);

    const finalState = useAppStore.getState();

    console.log('Final shapes:', finalState.shapes.length);
    console.log('Final layers:', finalState.layers.length);

    // Verify: Should have more shapes
    expect(finalState.shapes.length).toBeGreaterThan(2);

    // Verify: Should have more layers (at least one new layer for duplicates)
    expect(finalState.layers.length).toBeGreaterThan(initialLayerCount);

    // Find duplicated shapes
    const duplicatedShapes = finalState.shapes.filter(
      s => s.id !== shape1Id && s.id !== shape2Id
    );

    console.log('Duplicated shapes count:', duplicatedShapes.length);

    // Each duplicated shape should have a new layer with " copy" suffix
    duplicatedShapes.forEach((shape, index) => {
      const layer = finalState.layers.find(l => l.id === shape.layerId);
      console.log(`Duplicated shape ${index + 1} layer:`, layer?.name);
      expect(layer).toBeDefined();
      expect(layer?.name).toContain(' copy');
    });

    console.log('✓ All duplicated shapes have new layers with " copy" suffix');
  });

  it('should preserve layer properties when creating duplicate layer', () => {
    const store = useAppStore.getState();

    // Create a custom layer with specific properties
    store.createLayer('Custom Layer');
    const customLayer = useAppStore.getState().layers.find(l => l.name === 'Custom Layer');

    // Update layer properties
    if (customLayer) {
      store.updateLayer(customLayer.id, {
        color: '#FF5733',
        opacity: 0.7
      });
    }

    // Create a shape on the custom layer
    store.addShape({
      type: 'rectangle' as const,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ],
      color: '#FF5733',
      name: 'Custom Shape',
      layerId: customLayer!.id,
    });

    const initialState = useAppStore.getState();
    const originalShape = initialState.shapes[0];

    console.log('\n=== LAYER PROPERTIES PRESERVATION TEST ===');
    console.log('Original layer color:', customLayer?.color);
    console.log('Original layer opacity:', customLayer?.opacity);

    // Duplicate the shape
    store.duplicateShape(originalShape.id);

    const finalState = useAppStore.getState();
    const duplicatedShape = finalState.shapes.find(s => s.id !== originalShape.id);
    const newLayer = finalState.layers.find(l => l.id === duplicatedShape?.layerId);

    console.log('New layer name:', newLayer?.name);
    console.log('New layer color:', newLayer?.color);
    console.log('New layer opacity:', newLayer?.opacity);

    // Verify layer name has " copy" suffix
    expect(newLayer?.name).toBe('Custom Layer copy');

    // Verify layer properties are preserved
    expect(newLayer?.color).toBe('#FF5733');
    expect(newLayer?.opacity).toBe(0.7);

    console.log('✓ Layer properties preserved in duplicate layer');
  });
});
