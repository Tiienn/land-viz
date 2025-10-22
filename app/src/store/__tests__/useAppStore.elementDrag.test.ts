/**
 * Unit Tests: Element Drag Operations
 *
 * Phase 4A: Element Drag Support
 *
 * Tests the element-aware drag functionality including:
 * - startElementDrag
 * - updateElementDragPosition
 * - finishElementDrag
 * - cancelElementDrag
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import type { Point2D, ShapeElement, TextElement } from '../../types';

describe('Element Drag Operations', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      elements: [],
      shapes: [],
      selectedShapeIds: [],
      selectedElementIds: [],
      dragState: {
        isDragging: false,
        draggedShapeId: null,
        draggedElementId: null,
        startPosition: null,
        currentPosition: null,
        originalShapePoints: null,
        originalShapesData: undefined,
        originalElementData: undefined,
      },
      history: [],
      historyIndex: -1,
    }, true);
  });

  describe('startElementDrag', () => {
    it('should initialize drag state for shape element', () => {
      const shapeElement: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        name: 'Test Rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      useAppStore.setState({ elements: [shapeElement] });

      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(true);
      expect(dragState.draggedElementId).toBe('shape-1');
      expect(dragState.elementType).toBe('shape');
      expect(dragState.startPosition).toEqual(startPos);
      expect(dragState.currentPosition).toEqual(startPos);
      expect(dragState.originalElementData?.points).toEqual(shapeElement.points);
    });

    it('should initialize drag state for text element', () => {
      const textElement: TextElement = {
        id: 'text-1',
        type: 'text',
        content: 'Test Text',
        position: { x: 10, y: 20, z: 0 },
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        alignment: 'left',
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1.2,
        rotation: 0,
        opacity: 1,
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
        name: 'Test Text',
      };

      useAppStore.setState({ elements: [textElement] });

      const startPos: Point2D = { x: 15, y: 25 };
      useAppStore.getState().startElementDrag('text-1', 'text', startPos);

      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(true);
      expect(dragState.draggedElementId).toBe('text-1');
      expect(dragState.elementType).toBe('text');
      expect(dragState.startPosition).toEqual(startPos);
      expect(dragState.currentPosition).toEqual(startPos);
      expect(dragState.originalElementData?.position).toEqual({ x: 10, y: 20, z: 0 });
    });

    it('should not start drag for locked element', () => {
      const lockedElement: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        name: 'Locked Shape',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: true, // Element is locked
        z: 0,
      };

      useAppStore.setState({ elements: [lockedElement] });

      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedElementId).toBeUndefined();
    });

    it('should preserve rotation data for shapes', () => {
      const shapeWithRotation: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        rotation: { angle: 45, center: { x: 5, y: 5 } },
        name: 'Rotated Shape',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      useAppStore.setState({ elements: [shapeWithRotation] });

      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      const dragState = useAppStore.getState().dragState;
      expect(dragState.originalElementData?.rotation).toEqual({ angle: 45, center: { x: 5, y: 5 } });
    });
  });

  describe('updateElementDragPosition', () => {
    it('should update current drag position', () => {
      const shapeElement: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        name: 'Test Rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      useAppStore.setState({ elements: [shapeElement] });

      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      const newPos: Point2D = { x: 8, y: 7 };
      useAppStore.getState().updateElementDragPosition(newPos);

      const dragState = useAppStore.getState().dragState;
      expect(dragState.currentPosition).toEqual(newPos);
      expect(dragState.startPosition).toEqual(startPos); // Start position should not change
    });

    it('should not update if not dragging', () => {
      const newPos: Point2D = { x: 8, y: 7 };
      useAppStore.getState().updateElementDragPosition(newPos);

      const dragState = useAppStore.getState().dragState;
      expect(dragState.currentPosition).toBeNull();
    });
  });

  describe('finishElementDrag', () => {
    it('should update shape element points and clear drag state', () => {
      const shapeElement: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        name: 'Test Rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      useAppStore.setState({ elements: [shapeElement] });

      // Start drag
      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      // Update position (move 3 units right, 2 units up)
      const endPos: Point2D = { x: 8, y: 7 };
      useAppStore.getState().updateElementDragPosition(endPos);

      // Finish drag
      useAppStore.getState().finishElementDrag();

      // Check updated element
      const updatedElement = useAppStore.getState().elements.find(e => e.id === 'shape-1') as ShapeElement;
      expect(updatedElement.points).toEqual([
        { x: 3, y: 2 }, // 0 + 3, 0 + 2
        { x: 13, y: 2 }, // 10 + 3, 0 + 2
        { x: 13, y: 12 }, // 10 + 3, 10 + 2
        { x: 3, y: 12 }, // 0 + 3, 10 + 2
      ]);

      // Check drag state cleared
      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedElementId).toBeNull();
      expect(dragState.elementType).toBeUndefined();
    });

    it('should update text element position and clear drag state', () => {
      const textElement: TextElement = {
        id: 'text-1',
        type: 'text',
        content: 'Test Text',
        position: { x: 10, y: 20, z: 0 },
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        alignment: 'left',
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1.2,
        rotation: 0,
        opacity: 1,
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
        name: 'Test Text',
      };

      useAppStore.setState({ elements: [textElement] });

      // Start drag
      const startPos: Point2D = { x: 15, y: 25 };
      useAppStore.getState().startElementDrag('text-1', 'text', startPos);

      // Update position (move 5 units right, 3 units down)
      const endPos: Point2D = { x: 20, y: 28 };
      useAppStore.getState().updateElementDragPosition(endPos);

      // Finish drag
      useAppStore.getState().finishElementDrag();

      // Check updated element
      const updatedElement = useAppStore.getState().elements.find(e => e.id === 'text-1') as TextElement;
      expect(updatedElement.position).toEqual({ x: 15, y: 23 }); // 10 + 5, 20 + 3

      // Check drag state cleared
      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(false);
    });

    it('should preserve and update rotation center for shapes', () => {
      const shapeWithRotation: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        rotation: { angle: 45, center: { x: 5, y: 5 } },
        name: 'Rotated Shape',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      useAppStore.setState({ elements: [shapeWithRotation] });

      // Start drag
      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      // Update position (move 2 units right, 3 units up)
      const endPos: Point2D = { x: 7, y: 8 };
      useAppStore.getState().updateElementDragPosition(endPos);

      // Finish drag
      useAppStore.getState().finishElementDrag();

      // Check rotation center updated
      const updatedElement = useAppStore.getState().elements.find(e => e.id === 'shape-1') as ShapeElement;
      expect(updatedElement.rotation?.center).toEqual({ x: 7, y: 8 }); // 5 + 2, 5 + 3
      expect(updatedElement.rotation?.angle).toBe(45); // Angle unchanged
    });

    it('should do nothing if not dragging', () => {
      const initialState = useAppStore.getState();
      useAppStore.getState().finishElementDrag();

      const finalState = useAppStore.getState();
      expect(finalState.dragState).toEqual(initialState.dragState);
    });
  });

  describe('cancelElementDrag', () => {
    it('should clear drag state without updating element', () => {
      const shapeElement: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        name: 'Test Rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      useAppStore.setState({ elements: [shapeElement] });

      // Start drag
      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      // Update position
      const endPos: Point2D = { x: 8, y: 7 };
      useAppStore.getState().updateElementDragPosition(endPos);

      // Cancel drag
      useAppStore.getState().cancelElementDrag();

      // Check element unchanged
      const element = useAppStore.getState().elements.find(e => e.id === 'shape-1') as ShapeElement;
      expect(element.points).toEqual(shapeElement.points); // Original points

      // Check drag state cleared
      const dragState = useAppStore.getState().dragState;
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedElementId).toBeNull();
      expect(dragState.elementType).toBeUndefined();
      expect(dragState.originalElementData).toBeUndefined();
    });
  });

  describe('Dual-write synchronization', () => {
    it('should update both elements array and legacy shapes array', () => {
      const shapeElement: ShapeElement = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rectangle',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        name: 'Test Rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      // Also add to legacy shapes array
      const legacyShape = {
        id: 'shape-1',
        type: 'rectangle' as const,
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
        name: 'Test Rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'main',
        locked: false,
        z: 0,
      };

      useAppStore.setState({
        elements: [shapeElement],
        shapes: [legacyShape]
      });

      // Drag operation
      const startPos: Point2D = { x: 5, y: 5 };
      useAppStore.getState().startElementDrag('shape-1', 'shape', startPos);

      const endPos: Point2D = { x: 8, y: 7 };
      useAppStore.getState().updateElementDragPosition(endPos);

      useAppStore.getState().finishElementDrag();

      // Check both arrays updated
      const updatedElement = useAppStore.getState().elements.find(e => e.id === 'shape-1') as ShapeElement;
      const updatedLegacyShape = useAppStore.getState().shapes.find(s => s.id === 'shape-1');

      const expectedPoints = [
        { x: 3, y: 2 },
        { x: 13, y: 2 },
        { x: 13, y: 12 },
        { x: 3, y: 12 },
      ];

      expect(updatedElement.points).toEqual(expectedPoints);
      expect(updatedLegacyShape?.points).toEqual(expectedPoints);
    });
  });
});
