/**
 * Unit Tests for Canva-Style Grouping System
 * Tests groupShapes, ungroupShapes, and group-related operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Unmock the store to use the real implementation
vi.unmock('../useAppStore');

import { useAppStore } from '../useAppStore';

describe('Canva-Style Grouping System', () => {
  beforeEach(() => {
    // Reset store before each test by deleting all shapes
    const { shapes, deleteShape, clearSelection } = useAppStore.getState();
    shapes.forEach(shape => deleteShape(shape.id));
    clearSelection();
  });

  describe('groupShapes', () => {
    it('assigns shared groupId to selected shapes', () => {
      const { addShape, selectMultipleShapes, groupShapes } = useAppStore.getState();

      // Add test shapes using addShape
      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        layerId: 'main',
        color: '#FF0000',
        visible: true,
      });

      addShape({
        type: 'rectangle',
        points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
        layerId: 'main',
        color: '#00FF00',
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      const shapeIds = shapes.map(s => s.id);

      // Select both shapes
      selectMultipleShapes(shapeIds);

      // Group shapes
      groupShapes();

      // Verify groupId assigned
      const groupedShapes = useAppStore.getState().shapes;
      expect(groupedShapes[0].groupId).toBe(groupedShapes[1].groupId);
      expect(groupedShapes[0].groupId).toMatch(/^group_\d+$/);
    });

    it('preserves individual shape properties', () => {
      const { addShape, selectMultipleShapes, groupShapes } = useAppStore.getState();

      // Add shapes with different properties
      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#FF0000',
        layerId: 'layer1',
        visible: true,
      });

      addShape({
        type: 'circle',
        points: [{ x: 20, y: 20 }, { x: 25, y: 25 }],
        color: '#00FF00',
        layerId: 'layer2',
        rotation: { angle: 45, center: { x: 22.5, y: 22.5 } },
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      selectMultipleShapes(shapes.map(s => s.id));

      groupShapes();

      const groupedShapes = useAppStore.getState().shapes;

      // Colors preserved
      expect(groupedShapes[0].color).toBe('#FF0000');
      expect(groupedShapes[1].color).toBe('#00FF00');

      // Layers preserved (cross-layer grouping)
      expect(groupedShapes[0].layerId).toBe('layer1');
      expect(groupedShapes[1].layerId).toBe('layer2');

      // Types preserved
      expect(groupedShapes[0].type).toBe('rectangle');
      expect(groupedShapes[1].type).toBe('circle');

      // Rotation preserved
      expect(groupedShapes[1].rotation?.angle).toBe(45);
    });

    it('requires at least 2 shapes', () => {
      const { addShape, selectShape, groupShapes } = useAppStore.getState();

      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        layerId: 'main',
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      selectShape(shapes[0].id);

      groupShapes();

      // Should not create group with 1 shape
      const finalShapes = useAppStore.getState().shapes;
      expect(finalShapes[0].groupId).toBeUndefined();
    });

    it('keeps shapes selected after grouping', () => {
      const { addShape, selectMultipleShapes, groupShapes } = useAppStore.getState();

      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        layerId: 'main',
        visible: true,
      });

      addShape({
        type: 'rectangle',
        points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
        layerId: 'main',
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      const shapeIds = shapes.map(s => s.id);
      selectMultipleShapes(shapeIds);

      groupShapes();

      // Verify still selected
      const selectedIds = useAppStore.getState().selectedShapeIds;
      expect(selectedIds).toEqual(shapeIds);
    });
  });

  describe('ungroupShapes', () => {
    it('removes groupId from all selected shapes', () => {
      const { addShape, selectMultipleShapes, groupShapes, ungroupShapes } = useAppStore.getState();

      // Create and group shapes
      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        layerId: 'main',
        visible: true,
      });

      addShape({
        type: 'rectangle',
        points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
        layerId: 'main',
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      const shapeIds = shapes.map(s => s.id);
      selectMultipleShapes(shapeIds);
      groupShapes();

      // Verify grouped
      let groupedShapes = useAppStore.getState().shapes;
      expect(groupedShapes[0].groupId).toBeDefined();

      // Ungroup
      ungroupShapes();

      // Verify ungrouped
      const ungroupedShapes = useAppStore.getState().shapes;
      expect(ungroupedShapes[0].groupId).toBeUndefined();
      expect(ungroupedShapes[1].groupId).toBeUndefined();
    });

    it('keeps shapes selected after ungrouping', () => {
      const { addShape, selectMultipleShapes, groupShapes, ungroupShapes } = useAppStore.getState();

      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        layerId: 'main',
        visible: true,
      });

      addShape({
        type: 'rectangle',
        points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
        layerId: 'main',
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      const shapeIds = shapes.map(s => s.id);
      selectMultipleShapes(shapeIds);
      groupShapes();
      ungroupShapes();

      // Verify still selected
      const selectedIds = useAppStore.getState().selectedShapeIds;
      expect(selectedIds).toEqual(shapeIds);
    });

    it('does nothing when no grouped shapes selected', () => {
      const { addShape, selectShape, ungroupShapes } = useAppStore.getState();

      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        layerId: 'main',
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      selectShape(shapes[0].id);

      // Try to ungroup (should do nothing)
      ungroupShapes();

      const finalShapes = useAppStore.getState().shapes;
      expect(finalShapes).toHaveLength(1);
      expect(finalShapes[0].id).toBe(shapes[0].id);
    });
  });

  describe('Cross-Layer Grouping', () => {
    it('allows grouping shapes from different layers', () => {
      const { addShape, selectMultipleShapes, groupShapes } = useAppStore.getState();

      addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        layerId: 'layer1',
        visible: true,
      });

      addShape({
        type: 'rectangle',
        points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
        layerId: 'layer2',
        visible: true,
      });

      const shapes = useAppStore.getState().shapes;
      selectMultipleShapes(shapes.map(s => s.id));
      groupShapes();

      const groupedShapes = useAppStore.getState().shapes;

      // Both have groupId
      expect(groupedShapes[0].groupId).toBe(groupedShapes[1].groupId);

      // But maintain original layers
      expect(groupedShapes[0].layerId).toBe('layer1');
      expect(groupedShapes[1].layerId).toBe('layer2');
    });
  });
});
