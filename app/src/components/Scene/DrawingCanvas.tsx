import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { useThree, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Vector2, Vector3, type Mesh } from 'three';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';
import { RaycastManager } from '../../utils/RaycastManager';
import { SnapGrid } from '../../utils/SnapGrid';
import { alignmentService } from '../../services/alignmentService';

interface DrawingCanvasProps {
  onCoordinateChange?: (worldPos: Point2D, screenPos: Point2D) => void;
  gridSnap?: boolean;
  gridSize?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onCoordinateChange,
  gridSnap = true,
  gridSize = 2,
}) => {
  const { camera, gl } = useThree();
  const planeRef = useRef<Mesh>(null);
  
  // Performance-optimized managers
  const raycastManager = useRef(new RaycastManager());
  const snapGrid = useRef(new SnapGrid(gridSize * 5, gridSize * 1.5));
  
  // Cached vectors for performance
  const mousePosition = useRef(new Vector2());
  const worldPosition = useRef(new Vector3());
  const lastValidPosition = useRef<Point2D>({ x: 0, y: 0 });
  
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const shapes = useAppStore(state => state.shapes);
  const snapConfig = useAppStore(state => state.drawing.snapping?.config);

  // Measurement state selectors
  const isMeasuring = useAppStore(state => state.drawing.measurement.isMeasuring);

  const startDrawing = useAppStore(state => state.startDrawing);
  const addPoint = useAppStore(state => state.addPoint);
  const finishDrawing = useAppStore(state => state.finishDrawing);
  const cancelDrawing = useAppStore(state => state.cancelDrawing);
  const selectShape = useAppStore(state => state.selectShape);
  const clearSelection = useAppStore(state => state.clearSelection);
  const hoverShape = useAppStore(state => state.hoverShape);
  const exitRotateMode = useAppStore(state => state.exitRotateMode);

  // Measurement actions
  const startMeasurement = useAppStore(state => state.startMeasurement);
  const updateMeasurementPreview = useAppStore(state => state.updateMeasurementPreview);
  const completeMeasurement = useAppStore(state => state.completeMeasurement);
  const cancelMeasurement = useAppStore(state => state.cancelMeasurement);
  
  // Get the entire store for updating state
  const store = useAppStore;

  // This old function has been removed - using the optimized version below

  // Optimized alignment detection function
  const performAlignmentDetection = useCallback((worldPos2D: Point2D) => {
    const alignmentConfig = useAppStore.getState().drawing.alignment?.config;

    if (!alignmentConfig?.enabled) return;

    // Create a temporary shape at the current cursor position for alignment detection
    let tempShape;
    if (currentShape) {
      // During drawing mode
      tempShape = {
        ...currentShape,
        points: currentShape.points ? [...currentShape.points, worldPos2D] : [worldPos2D],
        id: 'temp_drawing_shape'
      };
    } else {
      // When no shape is being drawn, create a small cursor shape for alignment detection
      tempShape = {
        id: 'temp_cursor_shape',
        name: 'Cursor',
        type: 'circle' as const,
        color: '#3b82f6',
        visible: true,
        layerId: 'main',
        created: new Date(),
        modified: new Date(),
        points: [
          worldPos2D, // Center point
          { x: worldPos2D.x + 2, y: worldPos2D.y } // Small radius for detection
        ]
      };
    }

    // Get other shapes for alignment detection (limit for performance)
    const otherShapes = shapes.slice(0, 8); // Limit to 8 shapes for performance
    
    // Detect alignment guides with performance limits
    const guides = alignmentService.detectAlignmentGuides(
      tempShape,
      otherShapes,
      alignmentConfig
    ).slice(0, 4); // Limit to 4 guides max for performance


    // Update the store with alignment guides
    store.setState((state) => ({
      ...state,
      drawing: {
        ...state.drawing,
        alignment: {
          ...state.drawing.alignment,
          activeGuides: guides,
          draggingShapeId: tempShape.id
        }
      }
    }));
  }, [shapes, store, currentShape]);

  // Optimized snap detection function
  const performSnapDetection = useCallback((worldPos2D: Point2D) => {
    const snapConfig = useAppStore.getState().drawing.snapping?.config;
    
    if (!snapConfig?.enabled) return worldPos2D;
    
    // Update snap grid with current shapes, including active drawing shape with preview
    let allShapes = shapes;

    if (isDrawing && currentShape) {
      // For polyline, include the preview segment from last point to current cursor
      if (activeTool === 'polyline' && currentShape.points && currentShape.points.length > 0) {
        const enhancedPolyline = {
          ...currentShape,
          points: [...currentShape.points, worldPos2D] // Add cursor position as preview point
        };
        allShapes = [...shapes, enhancedPolyline];
      } else {
        allShapes = [...shapes, currentShape];
      }
    }

    snapGrid.current.updateSnapPoints(allShapes);
    
    // Find nearest snap point
    const nearestSnapPoint = snapGrid.current.findNearestSnapPoint(
      worldPos2D, 
      snapConfig.distance || 5
    );
    
    if (nearestSnapPoint) {
      // Update store with active snap point
      store.setState((state) => ({
        ...state,
        drawing: {
          ...state.drawing,
          snapping: {
            ...state.drawing.snapping,
            activeSnapPoint: nearestSnapPoint,
            snapPreviewPosition: nearestSnapPoint.position
          }
        }
      }));
      
      return nearestSnapPoint.position;
    } else {
      // Clear active snap point
      store.setState((state) => ({
        ...state,
        drawing: {
          ...state.drawing,
          snapping: {
            ...state.drawing.snapping,
            activeSnapPoint: null,
            snapPreviewPosition: null
          }
        }
      }));
    }
    
    return worldPos2D;
  }, [shapes, store]);

  // Old throttled functions removed - now using adaptive frequency in RaycastManager

  const snapToGridPoint = useCallback((point: Vector3): Vector3 => {
    if (!gridSnap) return point;
    
    const snappedX = Math.round(point.x / gridSize) * gridSize;
    const snappedZ = Math.round(point.z / gridSize) * gridSize;
    
    return new Vector3(snappedX, 0, snappedZ);
  }, [gridSnap, gridSize]);

  const getWorldPosition = useCallback((event: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>): Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new Vector2();
    
    // Calculate normalized device coordinates
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Use RaycastManager for optimized ground plane intersection
    const intersection = raycastManager.current.intersectGroundPlane(camera, mouse, 0);
    
    if (intersection) {
      return snapToGridPoint(intersection);
    }
    
    return null;
  }, [camera, gl.domElement, snapToGridPoint]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const worldPos = getWorldPosition(event);

    if (worldPos) {
      const rect = gl.domElement.getBoundingClientRect();
      const screenPos: Point2D = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const worldPos2D: Point2D = {
        x: worldPos.x,
        y: worldPos.z, // Using Z as Y for 2D mapping
      };

      // Use optimized snap detection and alignment detection for better performance
      const snappedPos = performSnapDetection(worldPos2D);
      performAlignmentDetection(snappedPos);

      // Handle measurement preview when measuring
      if (activeTool === 'measure' && isMeasuring) {
        updateMeasurementPreview(snappedPos);
      }

      if (onCoordinateChange) {
        onCoordinateChange(worldPos2D, screenPos);
      }
    }
  }, [getWorldPosition, onCoordinateChange, gl.domElement, performSnapDetection, performAlignmentDetection, activeTool, isMeasuring, updateMeasurementPreview]);

  const handlePointerLeave = useCallback(() => {
    // Clear hover state when mouse leaves the drawing area
    if (activeTool === 'select') {
      hoverShape(null);
    }
    
    // Clear snap points and alignment guides when leaving the drawing area
    store.setState((state) => ({
      ...state,
      drawing: {
        ...state.drawing,
        snapping: {
          ...state.drawing.snapping,
          availableSnapPoints: [],
          activeSnapPoint: null,
          snapPreviewPosition: null
        },
        alignment: {
          ...state.drawing.alignment,
          activeGuides: [],
          activeSpacings: [],
          draggingShapeId: null,
          snapPosition: null
        }
      }
    }));
  }, [activeTool, hoverShape, store]);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    // Handle deselection when select tool is active and clicking empty space
    if (activeTool === 'select') {
      // Clear all selections when clicking empty space
      if (!event.shiftKey) {
        clearSelection();
        exitRotateMode(); // Clear rotation handles when clicking empty space
      }
      return;
    }
    
    const worldPos = getWorldPosition(event);
    if (!worldPos) return;

    const point2D: Point2D = {
      x: worldPos.x,
      y: worldPos.z, // Using Z as Y for 2D mapping
    };

    // Apply snapping for precise measurements
    const snappedPos = performSnapDetection(point2D);

    switch (activeTool) {
      case 'measure':
        // Get fresh state from store directly to avoid stale selector issues
        const currentState = useAppStore.getState();
        const currentlyMeasuring = currentState.drawing.measurement.isMeasuring;

        if (!currentlyMeasuring) {
          // Start measurement - use snapped position for precision
          const snapPoint = snapGrid.current.findNearestSnapPoint(snappedPos, snapConfig?.distance || 5);
          startMeasurement(snappedPos, snapPoint || undefined);
        } else {
          // Complete measurement - use snapped position for precision
          const snapPoint = snapGrid.current.findNearestSnapPoint(snappedPos, snapConfig?.distance || 5);
          completeMeasurement(snappedPos, snapPoint || undefined);
        }
        break;

      case 'polyline': // Multi-point line drawing
        if (!isDrawing) {
          startDrawing();
          addPoint(point2D);
        } else {
          // Check if clicking close to the first point to close polyline (3+ points required)
          if (currentShape?.points && currentShape.points.length >= 3) {
            const firstPoint = currentShape.points[0];
            const distance = Math.sqrt(
              Math.pow(point2D.x - firstPoint.x, 2) + Math.pow(point2D.y - firstPoint.y, 2)
            );

            const closeThreshold = gridSize * 2.0; // Same threshold as cursor change
            if (distance < closeThreshold) {
              finishDrawing();
              return;
            }
          }

          addPoint(point2D);
        }
        break;

      case 'rectangle':
        if (!isDrawing) {
          startDrawing();
          addPoint(point2D); // First corner
        } else if (currentShape?.points && currentShape.points.length === 1) {
          const firstPoint = currentShape.points[0];
          // Add the remaining 3 points to complete rectangle
          addPoint({ x: point2D.x, y: firstPoint.y });     // Top-right
          addPoint({ x: point2D.x, y: point2D.y });        // Bottom-right
          addPoint({ x: firstPoint.x, y: point2D.y });     // Bottom-left
          finishDrawing();
        }
        break;

      case 'circle':
        if (!isDrawing) {
          startDrawing();
          addPoint(point2D); // Center point
        } else if (currentShape?.points && currentShape.points.length === 1) {
          const center = currentShape.points[0];
          const radius = Math.sqrt(
            Math.pow(point2D.x - center.x, 2) + Math.pow(point2D.y - center.y, 2)
          );

          // Generate circle points with adaptive segment count for performance
          const circlePoints: Point2D[] = [];
          const segments = Math.max(16, Math.min(64, Math.floor(radius * 2))); // Adaptive segments

          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            circlePoints.push({
              x: center.x + Math.cos(angle) * radius,
              y: center.y + Math.sin(angle) * radius,
            });
          }

          // Replace center with circle points
          currentShape.points = circlePoints;
          finishDrawing();
        }
        break;
    }
  }, [
    activeTool,
    isDrawing,
    currentShape,
    gridSize,
    getWorldPosition,
    startDrawing,
    addPoint,
    finishDrawing,
    clearSelection,
    exitRotateMode,
  ]);

  const handleDoubleClick = useCallback(() => {
    // Double-click handler removed for polylines - now use single-click near start point
    // Keep this function in case other tools need double-click in the future
  }, []);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.nativeEvent.preventDefault();
    if (isDrawing) {
      cancelDrawing();
    } else if (isMeasuring) {
      cancelMeasurement();
    }
  }, [isDrawing, cancelDrawing, isMeasuring, cancelMeasurement]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      raycastManager.current.dispose();
      snapGrid.current.dispose();
    };
  }, []);

  return (
    <mesh
      ref={planeRef}
      position={[0, -0.001, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      visible={false}
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default DrawingCanvas;