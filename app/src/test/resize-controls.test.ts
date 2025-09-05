import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('ResizableShapeControls Integration Tests', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.getState().clearAll();
  });

  describe('Resize Mode State Management', () => {
    it('should enter resize mode for a shape', () => {
      const store = useAppStore.getState();
      
      // Set to select mode first (required for resize mode)
      store.setActiveTool('select');
      
      // Create a test shape
      const testShape = {
        id: 'test-shape-1',
        name: 'Test Rectangle',
        type: 'rectangle' as const,
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      store.addShape(testShape);
      store.enterResizeMode('test-shape-1');

      // Get fresh state after mutations
      const freshStore = useAppStore.getState();
      const drawingState = freshStore.drawing;
      expect(drawingState.isResizeMode).toBe(true);
      expect(drawingState.resizingShapeId).toBe('test-shape-1');
      expect(drawingState.resizeHandleType).toBe(null);
      expect(drawingState.resizeHandleIndex).toBe(null);
      expect(drawingState.maintainAspectRatio).toBe(false);
    });

    it('should exit resize mode', () => {
      const store = useAppStore.getState();
      
      // Set to select mode first (required for resize mode)
      store.setActiveTool('select');
      
      // Enter resize mode first
      store.enterResizeMode('test-shape-1');
      expect(useAppStore.getState().drawing.isResizeMode).toBe(true);
      
      // Exit resize mode
      store.exitResizeMode();
      
      // Get fresh state after mutations
      const freshStore = useAppStore.getState();
      const drawingState = freshStore.drawing;
      expect(drawingState.isResizeMode).toBe(false);
      expect(drawingState.resizingShapeId).toBe(null);
      expect(drawingState.resizeHandleType).toBe(null);
      expect(drawingState.resizeHandleIndex).toBe(null);
      expect(drawingState.maintainAspectRatio).toBe(false);
    });

    it('should set resize handle selection', () => {
      const store = useAppStore.getState();
      
      // Set to select mode first (required for resize mode)
      store.setActiveTool('select');
      
      store.enterResizeMode('test-shape-1');
      store.setResizeHandle('corner', 2);
      
      // Get fresh state after mutations
      const freshStore = useAppStore.getState();
      const drawingState = freshStore.drawing;
      expect(drawingState.resizeHandleType).toBe('corner');
      expect(drawingState.resizeHandleIndex).toBe(2);
    });

    it('should toggle aspect ratio maintenance', () => {
      const store = useAppStore.getState();
      
      expect(store.drawing.maintainAspectRatio).toBe(false);
      
      store.setMaintainAspectRatio(true);
      expect(useAppStore.getState().drawing.maintainAspectRatio).toBe(true);
      
      store.setMaintainAspectRatio(false);
      expect(useAppStore.getState().drawing.maintainAspectRatio).toBe(false);
    });
  });

  describe('Shape Resizing', () => {
    it('should resize a rectangle shape', () => {
      const store = useAppStore.getState();
      
      // Create a test rectangle
      const testRect = {
        id: 'test-rect',
        name: 'Test Rectangle',
        type: 'rectangle' as const,
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      store.addShape(testRect);
      
      // Resize the rectangle
      const newPoints = [
        { x: 0, y: 0 },
        { x: 15, y: 0 },
        { x: 15, y: 15 },
        { x: 0, y: 15 }
      ];
      
      store.resizeShape('test-rect', newPoints);
      
      // Get fresh state after mutations
      const freshStore = useAppStore.getState();
      const resizedShape = freshStore.shapes.find(s => s.id === 'test-rect');
      expect(resizedShape?.points).toEqual(newPoints);
    });

    it('should resize a polyline shape', () => {
      const store = useAppStore.getState();
      
      // Create a test polyline
      const testPolyline = {
        id: 'test-polyline',
        name: 'Test Polyline',
        type: 'line' as const, // Use 'line' as per the actual type definition
        points: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }],
        color: '#3B82F6',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };

      store.addShape(testPolyline);
      
      // Resize by moving one corner
      const newPoints = [{ x: 0, y: 0 }, { x: 7, y: 8 }, { x: 10, y: 0 }];
      
      store.resizeShape('test-polyline', newPoints);
      
      // Get fresh state after mutations
      const freshStore = useAppStore.getState();
      const resizedShape = freshStore.shapes.find(s => s.id === 'test-polyline');
      expect(resizedShape?.points).toEqual(newPoints);
    });
  });

  describe('Mode Interactions', () => {
    it('should exit resize mode when entering edit mode', () => {
      const store = useAppStore.getState();
      
      // Set to select mode first (required for resize mode)
      store.setActiveTool('select');
      
      // Enter resize mode
      store.enterResizeMode('test-shape-1');
      expect(useAppStore.getState().drawing.isResizeMode).toBe(true);
      
      // Enter edit mode should exit resize mode
      store.enterEditMode('test-shape-1');
      
      // Get fresh state after mutations
      const freshStore = useAppStore.getState();
      expect(freshStore.drawing.isResizeMode).toBe(false);
      expect(freshStore.drawing.isEditMode).toBe(true);
    });

    it('should exit resize mode when changing active tool', () => {
      const store = useAppStore.getState();
      
      // Set to select tool and enter resize mode
      store.setActiveTool('select');
      store.enterResizeMode('test-shape-1');
      expect(useAppStore.getState().drawing.isResizeMode).toBe(true);
      
      // Change tool should exit resize mode
      store.setActiveTool('rectangle');
      
      // Get fresh state after mutations
      const freshStore = useAppStore.getState();
      expect(freshStore.drawing.isResizeMode).toBe(false);
      expect(freshStore.drawing.activeTool).toBe('rectangle');
    });

    it('should only allow resize mode in select tool', () => {
      const store = useAppStore.getState();
      
      // Set to non-select tool
      store.setActiveTool('rectangle');
      
      // Try to enter resize mode - should not work
      store.enterResizeMode('test-shape-1');
      
      expect(store.drawing.isResizeMode).toBe(false);
    });
  });
});