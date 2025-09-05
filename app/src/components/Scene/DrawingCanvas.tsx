import React, { useRef, useCallback } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { Vector2, Vector3, Plane, type Mesh } from 'three';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';

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
  const { camera, gl, raycaster } = useThree();
  const planeRef = useRef<Mesh>(null);
  const worldPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));
  
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const snapToGrid = useAppStore(state => state.drawing.snapToGrid);
  
  const startDrawing = useAppStore(state => state.startDrawing);
  const addPoint = useAppStore(state => state.addPoint);
  const finishDrawing = useAppStore(state => state.finishDrawing);
  const cancelDrawing = useAppStore(state => state.cancelDrawing);
  const selectShape = useAppStore(state => state.selectShape);
  const hoverShape = useAppStore(state => state.hoverShape);

  const snapToGridPoint = useCallback((point: Vector3): Vector3 => {
    if (!snapToGrid || !gridSnap) return point;
    
    const snappedX = Math.round(point.x / gridSize) * gridSize;
    const snappedZ = Math.round(point.z / gridSize) * gridSize;
    
    return new Vector3(snappedX, 0, snappedZ);
  }, [snapToGrid, gridSnap, gridSize]);

  const getWorldPosition = useCallback((event: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>): Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new Vector2();
    
    // Calculate normalized device coordinates
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersection = new Vector3();
    const hasIntersection = raycaster.ray.intersectPlane(worldPlane.current, intersection);
    
    if (hasIntersection) {
      return snapToGridPoint(intersection);
    }
    
    return null;
  }, [camera, raycaster, gl.domElement, snapToGridPoint]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const worldPos = getWorldPosition(event);
    
    if (worldPos && onCoordinateChange) {
      const rect = gl.domElement.getBoundingClientRect();
      const screenPos: Point2D = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      
      const worldPos2D: Point2D = {
        x: worldPos.x,
        y: worldPos.z, // Using Z as Y for 2D mapping
      };
      
      onCoordinateChange(worldPos2D, screenPos);
    }
  }, [getWorldPosition, onCoordinateChange, gl.domElement]);

  const handlePointerLeave = useCallback(() => {
    // Clear hover state when mouse leaves the drawing area
    if (activeTool === 'select') {
      hoverShape(null);
    }
  }, [activeTool, hoverShape]);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    // Handle deselection when select tool is active and clicking empty space
    if (activeTool === 'select') {
      selectShape(null);
      return;
    }
    
    const worldPos = getWorldPosition(event);
    if (!worldPos) return;

    const point2D: Point2D = {
      x: worldPos.x,
      y: worldPos.z, // Using Z as Y for 2D mapping
    };

    switch (activeTool) {
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
          addPoint(point2D);
        } else if (currentShape?.points && currentShape.points.length === 1) {
          const firstPoint = currentShape.points[0];
          // Create rectangle points
          addPoint({ x: point2D.x, y: firstPoint.y });
          addPoint(point2D);
          addPoint({ x: firstPoint.x, y: point2D.y });
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
          
          // Generate circle points
          const circlePoints: Point2D[] = [];
          const segments = 32;
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
    selectShape,
  ]);

  const handleDoubleClick = useCallback(() => {
    // Double-click handler removed for polylines - now use single-click near start point
    // Keep this function in case other tools need double-click in the future
  }, []);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.nativeEvent.preventDefault();
    if (isDrawing) {
      cancelDrawing();
    }
  }, [isDrawing, cancelDrawing]);

  // Mouse position tracking is now handled by DrawingFeedback component

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