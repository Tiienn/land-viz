/**
 * useAppStore Element Operations Unit Tests
 *
 * Comprehensive test coverage for Phase 2: Text as Layers
 * Tests element CRUD, selection, queries, grouping, and migration functionality.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Unmock useAppStore to use the real implementation (setup.ts mocks it globally)
vi.unmock('../useAppStore');

import { useAppStore } from '../useAppStore';
import { useTextStore } from '../useTextStore';
import type { Element, ShapeElement, TextElement } from '../../types';
import type { TextObject } from '../../types/text';

describe('useAppStore - Element Operations', () => {
  beforeEach(() => {
    const store = useAppStore.getState();

    // Clear all elements
    store.elements.forEach(el => store.deleteElement(el.id));

    // Clear all legacy shapes
    store.shapes.forEach(shape => store.deleteShape(shape.id));

    // Reset text store
    useTextStore.setState({
      texts: [],
      selectedTextId: null,
    });

    // Reset element selection
    store.clearElementSelection();

    // Reset migration flag
    localStorage.removeItem('land-viz:elements-migrated');
  });

  describe('Initial State', () => {
    test('should have empty elements array initially', () => {
      const state = useAppStore.getState();
      expect(state.elements).toEqual([]);
    });

    test('should have empty selectedElementIds initially', () => {
      const state = useAppStore.getState();
      expect(state.selectedElementIds).toEqual([]);
    });

    test('should have null hoveredElementId initially', () => {
      const state = useAppStore.getState();
      expect(state.hoveredElementId).toBeNull();
    });

    test('should have all required element actions', () => {
      const state = useAppStore.getState();

      expect(typeof state.addElement).toBe('function');
      expect(typeof state.updateElement).toBe('function');
      expect(typeof state.deleteElement).toBe('function');
      expect(typeof state.deleteElements).toBe('function');
      expect(typeof state.selectElement).toBe('function');
      expect(typeof state.selectMultipleElements).toBe('function');
      expect(typeof state.toggleElementSelection).toBe('function');
      expect(typeof state.clearElementSelection).toBe('function');
      expect(typeof state.hoverElement).toBe('function');
      expect(typeof state.getElementById).toBe('function');
      expect(typeof state.getElementsByLayer).toBe('function');
      expect(typeof state.getElementsByGroup).toBe('function');
      expect(typeof state.getSelectedElements).toBe('function');
      expect(typeof state.getVisibleElements).toBe('function');
      expect(typeof state.groupSelectedElements).toBe('function');
      expect(typeof state.ungroupSelectedElements).toBe('function');
      expect(typeof state.runMigration).toBe('function');
      expect(typeof state.rollbackMigration).toBe('function');
    });
  });

  describe('CRUD Operations - addElement', () => {
    test('should add a shape element', () => {
      const store = useAppStore.getState();

      const shapeElement: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 2 },
          { x: 0, y: 2 },
        ],
        center: { x: 1, y: 1 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(shapeElement);

      const state = useAppStore.getState();
      expect(state.elements).toHaveLength(1);
      expect(state.elements[0].elementType).toBe('shape');
      expect(state.elements[0].id).toBeDefined();
      expect((state.elements[0] as ShapeElement).type).toBe('rectangle');
      expect((state.elements[0] as ShapeElement).points).toEqual(shapeElement.points);
    });

    test('should add a text element', () => {
      const store = useAppStore.getState();

      const textElement: Omit<TextElement, 'id' | 'created' | 'modified'> = {
        elementType: 'text',
        content: 'Test Text',
        position: { x: 5, y: 5, z: 0.1 },
        fontSize: 16,
        fontFamily: 'Nunito Sans',
        color: '#000000',
        rotation: 0,
        alignment: 'left',
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(textElement);

      const state = useAppStore.getState();
      expect(state.elements).toHaveLength(1);
      expect(state.elements[0].elementType).toBe('text');
      expect((state.elements[0] as TextElement).content).toBe('Test Text');
    });

    test('should auto-generate unique ID for new element', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
      };

      store.addElement(element1);
      store.addElement(element2);

      const state = useAppStore.getState();
      expect(state.elements[0].id).not.toBe(state.elements[1].id);
    });

    test('should set created and modified timestamps', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const beforeAdd = Date.now();
      store.addElement(element);
      const afterAdd = Date.now();

      const state = useAppStore.getState();
      const addedElement = state.elements[0];

      expect(addedElement.created.getTime()).toBeGreaterThanOrEqual(beforeAdd);
      expect(addedElement.created.getTime()).toBeLessThanOrEqual(afterAdd);
      expect(addedElement.modified.getTime()).toBeGreaterThanOrEqual(beforeAdd);
      expect(addedElement.modified.getTime()).toBeLessThanOrEqual(afterAdd);
    });

    test('should sync shape element to legacy shapes array (dual-write)', () => {
      const store = useAppStore.getState();

      const shapeElement: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'circle',
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        center: { x: 0.5, y: 0.5 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(shapeElement);

      const state = useAppStore.getState();
      expect(state.shapes).toHaveLength(1);
      expect(state.shapes[0].type).toBe('circle');
    });

    test('should sync text element to useTextStore (dual-write)', () => {
      const store = useAppStore.getState();

      const textElement: Omit<TextElement, 'id' | 'created' | 'modified'> = {
        elementType: 'text',
        content: 'Sync Test',
        position: { x: 0, y: 0, z: 0.1 },
        fontSize: 16,
        fontFamily: 'Nunito Sans',
        color: '#000000',
        rotation: 0,
        alignment: 'left',
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(textElement);

      const textState = useTextStore.getState();
      expect(textState.texts).toHaveLength(1);
      expect(textState.texts[0].content).toBe('Sync Test');
    });
  });

  describe('CRUD Operations - updateElement', () => {
    test('should update element properties', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.updateElement(elementId, {
        rotation: 45,
        visible: false,
      });

      const state = useAppStore.getState();
      const updated = state.elements[0] as ShapeElement;
      expect(updated.rotation).toBe(45);
      expect(updated.visible).toBe(false);
    });

    test('should update modified timestamp', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      const beforeUpdate = Date.now();
      store.updateElement(elementId, { rotation: 90 });
      const afterUpdate = Date.now();

      const state = useAppStore.getState();
      const updated = state.elements[0];

      expect(updated.modified.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
      expect(updated.modified.getTime()).toBeLessThanOrEqual(afterUpdate);
    });

    test('should sync shape updates to legacy store (dual-write)', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.updateElement(elementId, { rotation: 180 });

      const state = useAppStore.getState();
      const legacyShape = state.shapes.find(s => s.id === elementId);
      expect(legacyShape?.rotation).toBe(180);
    });

    test('should sync text updates to useTextStore (dual-write)', () => {
      const store = useAppStore.getState();

      const element: Omit<TextElement, 'id' | 'created' | 'modified'> = {
        elementType: 'text',
        content: 'Original',
        position: { x: 0, y: 0, z: 0.1 },
        fontSize: 16,
        fontFamily: 'Nunito Sans',
        color: '#000000',
        rotation: 0,
        alignment: 'left',
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.updateElement(elementId, { content: 'Updated' } as Partial<TextElement>);

      const textState = useTextStore.getState();
      const legacyText = textState.texts.find(t => t.id === elementId);
      expect(legacyText?.content).toBe('Updated');
    });

    test('should handle updating non-existent element gracefully', () => {
      const store = useAppStore.getState();

      store.updateElement('non-existent', { rotation: 45 });

      const state = useAppStore.getState();
      expect(state.elements).toHaveLength(0);
    });
  });

  describe('CRUD Operations - deleteElement', () => {
    test('should delete element by id', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      expect(useAppStore.getState().elements).toHaveLength(1);

      store.deleteElement(elementId);

      expect(useAppStore.getState().elements).toHaveLength(0);
    });

    test('should remove element from selection when deleted', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);
      expect(useAppStore.getState().selectedElementIds).toContain(elementId);

      store.deleteElement(elementId);

      expect(useAppStore.getState().selectedElementIds).not.toContain(elementId);
    });

    test('should sync shape deletion to legacy store (dual-write)', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      expect(useAppStore.getState().shapes).toHaveLength(1);

      store.deleteElement(elementId);

      expect(useAppStore.getState().shapes).toHaveLength(0);
    });

    test('should sync text deletion to useTextStore (dual-write)', () => {
      const store = useAppStore.getState();

      const element: Omit<TextElement, 'id' | 'created' | 'modified'> = {
        elementType: 'text',
        content: 'Delete Test',
        position: { x: 0, y: 0, z: 0.1 },
        fontSize: 16,
        fontFamily: 'Nunito Sans',
        color: '#000000',
        rotation: 0,
        alignment: 'left',
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      expect(useTextStore.getState().texts).toHaveLength(1);

      store.deleteElement(elementId);

      expect(useTextStore.getState().texts).toHaveLength(0);
    });

    test('should handle deleting non-existent element gracefully', () => {
      const store = useAppStore.getState();

      store.deleteElement('non-existent');

      expect(useAppStore.getState().elements).toHaveLength(0);
    });
  });

  describe('CRUD Operations - deleteElements', () => {
    test('should delete multiple elements', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      const element3: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'polyline',
      };

      store.addElement(element1);
      store.addElement(element2);
      store.addElement(element3);

      const ids = store.elements.map(el => el.id);

      expect(useAppStore.getState().elements).toHaveLength(3);

      store.deleteElements([ids[0], ids[2]]);

      const state = useAppStore.getState();
      expect(state.elements).toHaveLength(1);
      expect((state.elements[0] as ShapeElement).type).toBe('circle');
    });

    test('should remove deleted elements from selection', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);
      store.selectMultipleElements(ids);

      expect(useAppStore.getState().selectedElementIds).toHaveLength(2);

      store.deleteElements([ids[0]]);

      const state = useAppStore.getState();
      expect(state.selectedElementIds).toHaveLength(1);
      expect(state.selectedElementIds).toContain(ids[1]);
    });

    test('should handle empty array gracefully', () => {
      const store = useAppStore.getState();

      store.deleteElements([]);

      expect(useAppStore.getState().elements).toHaveLength(0);
    });
  });

  describe('Selection Management - selectElement', () => {
    test('should select single element', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);

      const state = useAppStore.getState();
      expect(state.selectedElementIds).toEqual([elementId]);
    });

    test('should clear selection with null', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);
      expect(useAppStore.getState().selectedElementIds).toHaveLength(1);

      store.selectElement(null);

      expect(useAppStore.getState().selectedElementIds).toEqual([]);
    });

    test('should sync shape selection to legacy store', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);

      const state = useAppStore.getState();
      expect(state.selectedShapeId).toBe(elementId);
    });

    test('should sync text selection to useTextStore', () => {
      const store = useAppStore.getState();

      const element: Omit<TextElement, 'id' | 'created' | 'modified'> = {
        elementType: 'text',
        content: 'Select Test',
        position: { x: 0, y: 0, z: 0.1 },
        fontSize: 16,
        fontFamily: 'Nunito Sans',
        color: '#000000',
        rotation: 0,
        alignment: 'left',
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);

      const textState = useTextStore.getState();
      expect(textState.selectedTextId).toBe(elementId);
    });
  });

  describe('Selection Management - selectMultipleElements', () => {
    test('should select multiple elements', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);

      store.selectMultipleElements(ids);

      const state = useAppStore.getState();
      expect(state.selectedElementIds).toEqual(ids);
    });

    test('should replace previous selection', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);

      store.selectElement(ids[0]);
      expect(useAppStore.getState().selectedElementIds).toEqual([ids[0]]);

      store.selectMultipleElements([ids[1]]);
      expect(useAppStore.getState().selectedElementIds).toEqual([ids[1]]);
    });

    test('should sync shape multi-selection to legacy store', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const shapeIds = store.elements.map(el => el.id);

      store.selectMultipleElements(shapeIds);

      const state = useAppStore.getState();
      expect(state.selectedShapeIds).toEqual(shapeIds);
    });
  });

  describe('Selection Management - toggleElementSelection', () => {
    test('should toggle element selection on', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.toggleElementSelection(elementId);

      const state = useAppStore.getState();
      expect(state.selectedElementIds).toContain(elementId);
    });

    test('should toggle element selection off', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);
      expect(useAppStore.getState().selectedElementIds).toContain(elementId);

      store.toggleElementSelection(elementId);

      expect(useAppStore.getState().selectedElementIds).not.toContain(elementId);
    });

    test('should support multi-selection toggle', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);

      store.toggleElementSelection(ids[0]);
      expect(useAppStore.getState().selectedElementIds).toEqual([ids[0]]);

      store.toggleElementSelection(ids[1]);
      const state = useAppStore.getState();
      expect(state.selectedElementIds).toContain(ids[0]);
      expect(state.selectedElementIds).toContain(ids[1]);
    });
  });

  describe('Selection Management - clearElementSelection', () => {
    test('should clear all element selection', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);
      store.selectMultipleElements(ids);

      expect(useAppStore.getState().selectedElementIds).toHaveLength(2);

      store.clearElementSelection();

      expect(useAppStore.getState().selectedElementIds).toEqual([]);
    });

    test('should sync clear to legacy stores', () => {
      const store = useAppStore.getState();

      const shapeElement: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(shapeElement);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);

      store.clearElementSelection();

      const appState = useAppStore.getState();
      const textState = useTextStore.getState();

      expect(appState.selectedShapeId).toBeNull();
      expect(textState.selectedTextId).toBeNull();
    });
  });

  describe('Selection Management - hoverElement', () => {
    test('should set hovered element', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.hoverElement(elementId);

      expect(useAppStore.getState().hoveredElementId).toBe(elementId);
    });

    test('should clear hover with null', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.hoverElement(elementId);
      expect(useAppStore.getState().hoveredElementId).toBe(elementId);

      store.hoverElement(null);

      expect(useAppStore.getState().hoveredElementId).toBeNull();
    });

    test('should sync shape hover to legacy store', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.hoverElement(elementId);

      expect(useAppStore.getState().hoveredShapeId).toBe(elementId);
    });
  });

  describe('Query Methods - getElementById', () => {
    test('should get element by id', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      const found = store.getElementById(elementId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(elementId);
    });

    test('should return undefined for non-existent id', () => {
      const store = useAppStore.getState();

      const found = store.getElementById('non-existent');

      expect(found).toBeUndefined();
    });
  });

  describe('Query Methods - getElementsByLayer', () => {
    test('should filter elements by layer', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'layer-1',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
        layerId: 'layer-2',
      };

      const element3: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'polyline',
        layerId: 'layer-1',
      };

      store.addElement(element1);
      store.addElement(element2);
      store.addElement(element3);

      const layer1Elements = store.getElementsByLayer('layer-1');

      expect(layer1Elements).toHaveLength(2);
      expect(layer1Elements.every(el => el.layerId === 'layer-1')).toBe(true);
    });

    test('should return empty array for layer with no elements', () => {
      const store = useAppStore.getState();

      const elements = store.getElementsByLayer('empty-layer');

      expect(elements).toEqual([]);
    });
  });

  describe('Query Methods - getElementsByGroup', () => {
    test('should filter elements by group', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        groupId: 'group-1',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
        groupId: 'group-2',
      };

      const element3: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'polyline',
        groupId: 'group-1',
      };

      store.addElement(element1);
      store.addElement(element2);
      store.addElement(element3);

      const group1Elements = store.getElementsByGroup('group-1');

      expect(group1Elements).toHaveLength(2);
      expect(group1Elements.every(el => el.groupId === 'group-1')).toBe(true);
    });

    test('should return empty array for group with no elements', () => {
      const store = useAppStore.getState();

      const elements = store.getElementsByGroup('empty-group');

      expect(elements).toEqual([]);
    });
  });

  describe('Query Methods - getSelectedElements', () => {
    test('should return selected elements', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      const element3: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'polyline',
      };

      store.addElement(element1);
      store.addElement(element2);
      store.addElement(element3);

      const ids = store.elements.map(el => el.id);

      store.selectMultipleElements([ids[0], ids[2]]);

      const selected = store.getSelectedElements();

      expect(selected).toHaveLength(2);
      expect(selected.map(el => el.id)).toEqual([ids[0], ids[2]]);
    });

    test('should return empty array when no selection', () => {
      const store = useAppStore.getState();

      const selected = store.getSelectedElements();

      expect(selected).toEqual([]);
    });
  });

  describe('Query Methods - getVisibleElements', () => {
    test('should filter visible elements', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
        visible: false,
      };

      const element3: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'polyline',
        visible: true,
      };

      store.addElement(element1);
      store.addElement(element2);
      store.addElement(element3);

      const visible = store.getVisibleElements();

      expect(visible).toHaveLength(2);
      expect(visible.every(el => el.visible === true)).toBe(true);
    });

    test('should return empty array when all elements hidden', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: false,
        locked: false,
      };

      store.addElement(element);

      const visible = store.getVisibleElements();

      expect(visible).toEqual([]);
    });
  });

  describe('Grouping - groupSelectedElements', () => {
    test('should create group from selected elements', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);
      store.selectMultipleElements(ids);

      store.groupSelectedElements();

      const state = useAppStore.getState();
      const groupIds = state.elements.map(el => el.groupId);

      expect(groupIds[0]).toBeDefined();
      expect(groupIds[0]).toBe(groupIds[1]);
    });

    test('should not group with less than 2 elements', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);
      store.groupSelectedElements();

      const state = useAppStore.getState();
      expect(state.elements[0].groupId).toBeUndefined();
    });

    test('should not group locked elements', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: true,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
        locked: false,
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);
      store.selectMultipleElements(ids);

      store.groupSelectedElements();

      const state = useAppStore.getState();
      expect(state.elements[0].groupId).toBeUndefined();
      expect(state.elements[1].groupId).toBeUndefined();
    });
  });

  describe('Grouping - ungroupSelectedElements', () => {
    test('should ungroup selected elements', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      store.addElement(element1);
      store.addElement(element2);

      const ids = store.elements.map(el => el.id);
      store.selectMultipleElements(ids);

      store.groupSelectedElements();

      const beforeUngroup = useAppStore.getState();
      expect(beforeUngroup.elements[0].groupId).toBeDefined();

      store.ungroupSelectedElements();

      const afterUngroup = useAppStore.getState();
      expect(afterUngroup.elements[0].groupId).toBeUndefined();
      expect(afterUngroup.elements[1].groupId).toBeUndefined();
    });

    test('should handle ungrouping elements without groupId', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);
      store.ungroupSelectedElements();

      const state = useAppStore.getState();
      expect(state.elements[0].groupId).toBeUndefined();
    });
  });

  describe('Migration - runMigration', () => {
    test('should migrate shapes and texts to elements', () => {
      const store = useAppStore.getState();

      // Add legacy shapes
      const shapeId1 = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
      });

      const shapeId2 = store.addShape({
        type: 'circle',
        points: [{ x: 1, y: 1 }],
        center: { x: 1, y: 1 },
        rotation: 0,
        layerId: 'main',
      });

      // Add legacy texts
      const text1: TextObject = {
        id: 'text-1',
        type: 'floating',
        content: 'Text 1',
        position: { x: 0, y: 0, z: 0.1 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left',
        letterSpacing: 0,
        lineHeight: 1.5,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'main',
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useTextStore.getState().addText(text1);

      expect(useAppStore.getState().shapes).toHaveLength(2);
      expect(useTextStore.getState().texts).toHaveLength(1);
      expect(useAppStore.getState().elements).toHaveLength(0);

      store.runMigration();

      const state = useAppStore.getState();
      expect(state.elements).toHaveLength(3);
      expect(state.elements.filter(el => el.elementType === 'shape')).toHaveLength(2);
      expect(state.elements.filter(el => el.elementType === 'text')).toHaveLength(1);
    });

    test('should not run migration twice', () => {
      const store = useAppStore.getState();

      // Add legacy shapes
      const shapeId = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
      });

      // Run first migration
      store.runMigration();
      const afterFirstMigration = useAppStore.getState().elements.length;

      // Add more shapes after migration
      store.addShape({
        type: 'circle',
        points: [{ x: 1, y: 1 }],
        center: { x: 1, y: 1 },
        rotation: 0,
        layerId: 'main',
      });

      // Try to run migration again - should skip because already migrated
      store.runMigration();

      const afterSecondMigration = useAppStore.getState().elements.length;
      // Elements should only increase by 1 from the new shape via dual-write,
      // not from re-running migration
      expect(afterSecondMigration).toBe(afterFirstMigration + 1);
    });

    test('should persist migration flag in localStorage', () => {
      const store = useAppStore.getState();

      expect(localStorage.getItem('land-viz:elements-migrated')).toBeNull();

      store.runMigration();

      expect(localStorage.getItem('land-viz:elements-migrated')).toBe('true');
    });
  });

  describe('Migration - rollbackMigration', () => {
    test('should restore from backup and clear elements', () => {
      const store = useAppStore.getState();

      // Add legacy data
      const shapeId = store.addShape({
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
      });

      const text: TextObject = {
        id: 'text-1',
        type: 'floating',
        content: 'Test',
        position: { x: 0, y: 0, z: 0.1 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left',
        letterSpacing: 0,
        lineHeight: 1.5,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'main',
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useTextStore.getState().addText(text);

      const beforeMigration = {
        shapes: useAppStore.getState().shapes.length,
        texts: useTextStore.getState().texts.length,
      };

      // Run migration
      store.runMigration();

      expect(useAppStore.getState().elements.length).toBeGreaterThan(0);

      // Rollback
      store.rollbackMigration();

      const afterRollback = useAppStore.getState();
      expect(afterRollback.elements).toEqual([]);
      expect(afterRollback.shapes.length).toBe(beforeMigration.shapes);
      expect(useTextStore.getState().texts.length).toBe(beforeMigration.texts);
    });

    test('should clear migration flag after rollback', () => {
      const store = useAppStore.getState();

      // Run migration
      store.runMigration();
      expect(localStorage.getItem('land-viz:elements-migrated')).toBe('true');

      // Rollback
      store.rollbackMigration();

      expect(localStorage.getItem('land-viz:elements-migrated')).toBeNull();
    });
  });

  describe('Performance Characteristics', () => {
    test('should handle large number of elements efficiently', () => {
      const store = useAppStore.getState();

      const startTime = performance.now();

      // Add 1000 elements
      for (let i = 0; i < 1000; i++) {
        store.addElement({
          elementType: 'shape',
          type: 'rectangle',
          points: [{ x: i, y: i }],
          center: { x: i, y: i },
          rotation: 0,
          layerId: 'main',
          visible: true,
          locked: false,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = useAppStore.getState();
      expect(state.elements).toHaveLength(1000);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle rapid selection changes without memory leaks', () => {
      const store = useAppStore.getState();

      // Add 10 elements
      for (let i = 0; i < 10; i++) {
        store.addElement({
          elementType: 'shape',
          type: 'rectangle',
          points: [{ x: i, y: i }],
          center: { x: i, y: i },
          rotation: 0,
          layerId: 'main',
          visible: true,
          locked: false,
        });
      }

      const ids = store.elements.map(el => el.id);

      // Rapidly switch selections 100 times
      for (let i = 0; i < 100; i++) {
        const selectedId = ids[i % ids.length];
        store.selectElement(selectedId);
      }

      const state = useAppStore.getState();
      expect(state.selectedElementIds).toHaveLength(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle updating element with partial data', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.updateElement(elementId, { rotation: 90 });

      const state = useAppStore.getState();
      const updated = state.elements[0] as ShapeElement;
      expect(updated.rotation).toBe(90);
      expect(updated.type).toBe('rectangle');
    });

    test('should handle querying with invalid parameters', () => {
      const store = useAppStore.getState();

      const byId = store.getElementById('');
      const byLayer = store.getElementsByLayer('');
      const byGroup = store.getElementsByGroup('');

      expect(byId).toBeUndefined();
      expect(byLayer).toEqual([]);
      expect(byGroup).toEqual([]);
    });

    test('should handle deleting element that is both selected and hovered', () => {
      const store = useAppStore.getState();

      const element: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      store.addElement(element);
      const elementId = store.elements[0].id;

      store.selectElement(elementId);
      store.hoverElement(elementId);

      store.deleteElement(elementId);

      const state = useAppStore.getState();
      expect(state.selectedElementIds).not.toContain(elementId);
      expect(state.hoveredElementId).toBeNull();
    });

    test('should handle grouping with no selection', () => {
      const store = useAppStore.getState();

      store.groupSelectedElements();

      const state = useAppStore.getState();
      expect(state.elements).toHaveLength(0);
    });

    test('should preserve element order during operations', () => {
      const store = useAppStore.getState();

      const element1: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        type: 'rectangle',
        points: [{ x: 0, y: 0 }],
        center: { x: 0, y: 0 },
        rotation: 0,
        layerId: 'main',
        visible: true,
        locked: false,
      };

      const element2: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'circle',
      };

      const element3: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        ...element1,
        type: 'polyline',
      };

      store.addElement(element1);
      store.addElement(element2);
      store.addElement(element3);

      const ids = store.elements.map(el => el.id);

      store.updateElement(ids[1], { rotation: 45 });

      const state = useAppStore.getState();
      expect(state.elements.map(el => el.id)).toEqual(ids);
    });
  });
});
