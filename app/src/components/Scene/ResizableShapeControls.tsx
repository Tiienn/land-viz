import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Box, Sphere } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ResizableShapeControlsProps {
  elevation?: number;
}

// Utility function to apply rotation transform to points (same as in ShapeRenderer)
const applyRotationTransform = (points: Point2D[], rotation?: { angle: number; center: Point2D }): Point2D[] => {
  if (!rotation || rotation.angle === 0) return points;
  
  const { angle, center } = rotation;
  const angleRadians = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  return points.map(point => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    
    return {
      x: center.x + (dx * cos - dy * sin),
      y: center.y + (dx * sin + dy * cos)
    };
  });
};

const ResizableShapeControls: React.FC<ResizableShapeControlsProps> = ({ elevation = 0.01 }) => {
  const { camera, raycaster, gl } = useThree();
  
  // Get resize state from store
  const drawing = useAppStore(state => state.drawing);
  const shapes = useAppStore(state => state.shapes);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const setResizeHandle = useAppStore(state => state.setResizeHandle);
  const setMaintainAspectRatio = useAppStore(state => state.setMaintainAspectRatio);
  const resizeShape = useAppStore(state => state.resizeShape);
  const resizeShapeLive = useAppStore(state => state.resizeShapeLive);
  const saveToHistory = useAppStore(state => state.saveToHistory);
  
  // Get global drag state to handle shape dragging transforms
  const globalDragState = useAppStore(state => state.dragState);
  
  // Manage hover state for all handles
  const [hoveredHandle, setHoveredHandle] = React.useState<{type: 'corner' | 'edge', index: number} | null>(null);
  
  // Track if we're in a cursor override state
  const [cursorOverride, setCursorOverride] = React.useState<string | null>(null);
  
  // Apply cursor to the canvas element
  useEffect(() => {
    if (cursorOverride) {
      gl.domElement.style.cursor = cursorOverride;
    } else {
      gl.domElement.style.cursor = '';
    }
  }, [cursorOverride, gl.domElement]);

  // Find the shape being resized
  const resizingShape = useMemo(() => {
    if (!drawing.isResizeMode || !drawing.resizingShapeId || activeTool !== 'select') return null;
    return shapes.find(shape => shape.id === drawing.resizingShapeId) || null;
  }, [shapes, drawing.isResizeMode, drawing.resizingShapeId, activeTool]);

  // Generate resize handles based on shape type
  const resizeHandles = useMemo(() => {
    if (!resizingShape || !resizingShape.points) return { corners: [], edges: [] };
    
    // Start with original points and apply transforms (same logic as ShapeRenderer)
    let renderPoints = resizingShape.points;
    
    // For rectangles, create 8 resize handles like Windows
    if (resizingShape.type === 'rectangle') {
      let cornerPoints: Point2D[] = [];
      
      if (resizingShape.points.length === 2) {
        // Convert 2-point format to 4 corners
        const [topLeft, bottomRight] = resizingShape.points;
        renderPoints = [
          { x: topLeft.x, y: topLeft.y },      // Top left (0)
          { x: bottomRight.x, y: topLeft.y },  // Top right (1)
          { x: bottomRight.x, y: bottomRight.y }, // Bottom right (2)
          { x: topLeft.x, y: bottomRight.y }   // Bottom left (3)
        ];
      } else if (resizingShape.points.length >= 4) {
        renderPoints = resizingShape.points.slice(0, 4);
      }
      
      // SIMPLIFIED: Apply transforms in correct order: rotate first, then drag
      let transformedPoints = renderPoints;
      
      // Apply drag offset if shape is being dragged
      const isBeingDragged = globalDragState.isDragging && globalDragState.draggedShapeId === resizingShape.id;
      if (isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition) {
        const offsetX = globalDragState.currentPosition.x - globalDragState.startPosition.x;
        const offsetY = globalDragState.currentPosition.y - globalDragState.startPosition.y;
        
        // First apply rotation to original points (if any)
        const rotatedPoints = applyRotationTransform(renderPoints, resizingShape.rotation);
        
        // Then apply drag offset to rotated points
        transformedPoints = rotatedPoints.map(point => ({
          x: point.x + offsetX,
          y: point.y + offsetY
        }));
      } else {
        // Normal case: just apply rotation to original points
        transformedPoints = applyRotationTransform(renderPoints, resizingShape.rotation);
      }
      
      cornerPoints = transformedPoints;
      
      // Generate all 8 resize handles (4 corners + 4 edges) like Windows
      const allHandles: Point2D[] = [];
      if (cornerPoints.length === 4) {
        // Add corner handles
        allHandles.push(...cornerPoints);
        
        // Add edge handles (midpoints)
        allHandles.push(
          { x: (cornerPoints[0].x + cornerPoints[1].x) / 2, y: (cornerPoints[0].y + cornerPoints[1].y) / 2 }, // Top edge (4)
          { x: (cornerPoints[1].x + cornerPoints[2].x) / 2, y: (cornerPoints[1].y + cornerPoints[2].y) / 2 }, // Right edge (5)
          { x: (cornerPoints[2].x + cornerPoints[3].x) / 2, y: (cornerPoints[2].y + cornerPoints[3].y) / 2 }, // Bottom edge (6)
          { x: (cornerPoints[3].x + cornerPoints[0].x) / 2, y: (cornerPoints[3].y + cornerPoints[0].y) / 2 }  // Left edge (7)
        );
      }
      
      return { corners: cornerPoints, edges: [], allHandles };
    }
    
    // For circles, create 4 resize handles on cardinal directions
    if (resizingShape.type === 'circle') {
      if (resizingShape.points.length >= 3) {
        // SIMPLIFIED: Apply transforms in correct order: rotate first, then drag
        const circlePoints = resizingShape.points;
        let transformedCirclePoints = circlePoints;
        
        // Apply drag offset if shape is being dragged
        const isBeingDragged = globalDragState.isDragging && globalDragState.draggedShapeId === resizingShape.id;
        if (isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition) {
          const offsetX = globalDragState.currentPosition.x - globalDragState.startPosition.x;
          const offsetY = globalDragState.currentPosition.y - globalDragState.startPosition.y;
          
          // First apply rotation to original points (if any)
          const rotatedCirclePoints = applyRotationTransform(circlePoints, resizingShape.rotation);
          
          // Then apply drag offset to rotated points
          transformedCirclePoints = rotatedCirclePoints.map(point => ({
            x: point.x + offsetX,
            y: point.y + offsetY
          }));
        } else {
          // Normal case: just apply rotation to original points
          transformedCirclePoints = applyRotationTransform(circlePoints, resizingShape.rotation);
        }
        
        // For rotated ellipses, we need to work with the original (unrotated) shape first
        // and then apply transformations to the handle positions
        let originalCirclePoints = circlePoints;
        let originalCenter = { x: 0, y: 0 };
        
        // Apply drag offset to original points if needed
        if (isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition) {
          const offsetX = globalDragState.currentPosition.x - globalDragState.startPosition.x;
          const offsetY = globalDragState.currentPosition.y - globalDragState.startPosition.y;
          originalCirclePoints = circlePoints.map(point => ({
            x: point.x + offsetX,
            y: point.y + offsetY
          }));
        }
        
        // Calculate center and radii from original (unrotated but possibly dragged) points
        originalCenter = { 
          x: originalCirclePoints.reduce((sum, p) => sum + p.x, 0) / originalCirclePoints.length,
          y: originalCirclePoints.reduce((sum, p) => sum + p.y, 0) / originalCirclePoints.length
        };
        
        // Calculate bounding box of original ellipse shape
        const minX = Math.min(...originalCirclePoints.map(p => p.x));
        const maxX = Math.max(...originalCirclePoints.map(p => p.x));
        const minY = Math.min(...originalCirclePoints.map(p => p.y));
        const maxY = Math.max(...originalCirclePoints.map(p => p.y));
        
        // Calculate radii for ellipse (may be different for X and Y axes)
        const radiusX = (maxX - minX) / 2;
        const radiusY = (maxY - minY) / 2;
        
        // Generate handle positions relative to original center, then apply rotation
        let cornerHandles = [
          { x: originalCenter.x - radiusX * Math.cos(Math.PI / 4), y: originalCenter.y - radiusY * Math.sin(Math.PI / 4) }, // Top-left (0)
          { x: originalCenter.x + radiusX * Math.cos(Math.PI / 4), y: originalCenter.y - radiusY * Math.sin(Math.PI / 4) }, // Top-right (1)
          { x: originalCenter.x + radiusX * Math.cos(Math.PI / 4), y: originalCenter.y + radiusY * Math.sin(Math.PI / 4) }, // Bottom-right (2)
          { x: originalCenter.x - radiusX * Math.cos(Math.PI / 4), y: originalCenter.y + radiusY * Math.sin(Math.PI / 4) }  // Bottom-left (3)
        ];
        
        let edgeHandles = [
          { x: originalCenter.x, y: originalCenter.y - radiusY }, // Top (0)
          { x: originalCenter.x + radiusX, y: originalCenter.y }, // Right (1)
          { x: originalCenter.x, y: originalCenter.y + radiusY }, // Bottom (2)
          { x: originalCenter.x - radiusX, y: originalCenter.y }  // Left (3)
        ];
        
        // Apply rotation to handle positions if shape is rotated
        if (resizingShape.rotation && resizingShape.rotation.angle !== 0) {
          const { angle, center } = resizingShape.rotation;
          // If dragging, use dragged center for rotation
          const rotationCenter = isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition ? 
            {
              x: center.x + (globalDragState.currentPosition.x - globalDragState.startPosition.x),
              y: center.y + (globalDragState.currentPosition.y - globalDragState.startPosition.y)
            } : center;
          
          const angleRadians = (angle * Math.PI) / 180;
          const cos = Math.cos(angleRadians);
          const sin = Math.sin(angleRadians);
          
          // Rotate corner handles
          cornerHandles = cornerHandles.map(handle => {
            const dx = handle.x - rotationCenter.x;
            const dy = handle.y - rotationCenter.y;
            return {
              x: rotationCenter.x + (dx * cos - dy * sin),
              y: rotationCenter.y + (dx * sin + dy * cos)
            };
          });
          
          // Rotate edge handles
          edgeHandles = edgeHandles.map(handle => {
            const dx = handle.x - rotationCenter.x;
            const dy = handle.y - rotationCenter.y;
            return {
              x: rotationCenter.x + (dx * cos - dy * sin),
              y: rotationCenter.y + (dx * sin + dy * cos)
            };
          });
        }
        
        const allHandles = [...cornerHandles, ...edgeHandles];
        
        return { corners: cornerHandles, edges: edgeHandles, allHandles };
      }
    }
    
    // For polylines and other shapes, apply transform to corner handles
    // SIMPLIFIED: Apply transforms in correct order: rotate first, then drag
    let transformedPoints = renderPoints;
    
    // Apply drag offset if shape is being dragged
    const isBeingDragged = globalDragState.isDragging && globalDragState.draggedShapeId === resizingShape.id;
    if (isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition) {
      const offsetX = globalDragState.currentPosition.x - globalDragState.startPosition.x;
      const offsetY = globalDragState.currentPosition.y - globalDragState.startPosition.y;
      
      // First apply rotation to original points (if any)
      const rotatedPoints = applyRotationTransform(renderPoints, resizingShape.rotation);
      
      // Then apply drag offset to rotated points
      transformedPoints = rotatedPoints.map(point => ({
        x: point.x + offsetX,
        y: point.y + offsetY
      }));
    } else {
      // Normal case: just apply rotation to original points
      transformedPoints = applyRotationTransform(renderPoints, resizingShape.rotation);
    }
    
    return { corners: transformedPoints, edges: [], allHandles: transformedPoints };
  }, [resizingShape, globalDragState]);

  // Dragging state and handlers
  const dragState = useRef({ 
    isDragging: false, 
    handleType: null as 'corner' | 'edge' | null,
    handleIndex: null as number | null,
    originalPoints: null as Point2D[] | null,
    startMousePos: null as Point2D | null,
    pointerId: null as number | null
  });
  
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  // Maintain aspect ratio for rectangle corner resizing
  const maintainRectangleAspectRatio = useCallback((
    corners: Point2D[],
    cornerIndex: number,
    aspectRatio: number
  ): Point2D[] => {
    // Simple aspect ratio maintenance - this is a basic implementation
    // In a full implementation, you'd want more sophisticated logic
    const newCorners = [...corners];
    const movedCorner = newCorners[cornerIndex];
    
    // Find the opposite corner
    const oppositeIndex = (cornerIndex + 2) % 4;
    const oppositeCorner = newCorners[oppositeIndex];
    
    // Calculate new dimensions maintaining aspect ratio
    const deltaX = Math.abs(movedCorner.x - oppositeCorner.x);
    const deltaY = Math.abs(movedCorner.y - oppositeCorner.y);
    
    // Determine which dimension to constrain based on the larger change
    if (deltaX / aspectRatio > deltaY) {
      // Constrain height based on width
      const newHeight = deltaX / aspectRatio;
      if (movedCorner.y > oppositeCorner.y) {
        movedCorner.y = oppositeCorner.y + newHeight;
      } else {
        movedCorner.y = oppositeCorner.y - newHeight;
      }
    } else {
      // Constrain width based on height
      const newWidth = deltaY * aspectRatio;
      if (movedCorner.x > oppositeCorner.x) {
        movedCorner.x = oppositeCorner.x + newWidth;
      } else {
        movedCorner.x = oppositeCorner.x - newWidth;
      }
    }
    
    return newCorners;
  }, []);

  // Calculate new circle points when resizing
  const calculateCircleResize = useCallback((
    originalPoints: Point2D[],
    handleIndex: number,
    newPoint: Point2D
  ): Point2D[] => {
    if (originalPoints.length < 3) return originalPoints;
    
    // Circle is stored as array of points forming the circle perimeter
    // Calculate center as the average of all points
    const center = { 
      x: originalPoints.reduce((sum, p) => sum + p.x, 0) / originalPoints.length,
      y: originalPoints.reduce((sum, p) => sum + p.y, 0) / originalPoints.length
    };
    
    // Calculate new radius as distance from center to mouse position
    const newRadius = Math.sqrt(
      Math.pow(newPoint.x - center.x, 2) +
      Math.pow(newPoint.y - center.y, 2)
    );
    
    // Generate new circle points with the same number of segments
    const circlePoints: Point2D[] = [];
    const segments = originalPoints.length - 1; // Subtract 1 because last point equals first
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      circlePoints.push({
        x: center.x + Math.cos(angle) * newRadius,
        y: center.y + Math.sin(angle) * newRadius,
      });
    }
    
    return circlePoints;
  }, []);

  // Calculate new ellipse points when resizing circle edge handles
  const calculateEllipseResize = useCallback((
    originalPoints: Point2D[],
    handleIndex: number,
    newPoint: Point2D
  ): Point2D[] => {
    if (originalPoints.length < 3) return originalPoints;
    
    // Calculate center as the average of all points
    const center = { 
      x: originalPoints.reduce((sum, p) => sum + p.x, 0) / originalPoints.length,
      y: originalPoints.reduce((sum, p) => sum + p.y, 0) / originalPoints.length
    };
    
    // Calculate current radii from original circle
    const originalRadius = Math.sqrt(
      Math.pow(originalPoints[0].x - center.x, 2) +
      Math.pow(originalPoints[0].y - center.y, 2)
    );
    
    // Start with equal radii (circle)
    let radiusX = originalRadius;
    let radiusY = originalRadius;
    
    // Adjust radius based on which edge handle is being dragged
    if (handleIndex === 0) { // Top handle - adjust Y radius
      radiusY = Math.abs(newPoint.y - center.y);
    } else if (handleIndex === 1) { // Right handle - adjust X radius
      radiusX = Math.abs(newPoint.x - center.x);
    } else if (handleIndex === 2) { // Bottom handle - adjust Y radius
      radiusY = Math.abs(newPoint.y - center.y);
    } else if (handleIndex === 3) { // Left handle - adjust X radius
      radiusX = Math.abs(newPoint.x - center.x);
    }
    
    // Generate ellipse points
    const ellipsePoints: Point2D[] = [];
    const segments = originalPoints.length - 1;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      ellipsePoints.push({
        x: center.x + Math.cos(angle) * radiusX,
        y: center.y + Math.sin(angle) * radiusY,
      });
    }
    
    return ellipsePoints;
  }, []);

  // Calculate new rectangle points when resizing
  const calculateRectangleResize = useCallback((
    originalPoints: Point2D[],
    handleType: 'corner' | 'edge',
    handleIndex: number,
    newPoint: Point2D,
    maintainAspectRatio: boolean
  ): Point2D[] => {
    // Convert to 4-corner format if needed
    let corners: Point2D[] = [];
    if (originalPoints.length === 2) {
      const [topLeft, bottomRight] = originalPoints;
      corners = [
        { x: topLeft.x, y: topLeft.y },      // Top left (0)
        { x: bottomRight.x, y: topLeft.y },  // Top right (1)
        { x: bottomRight.x, y: bottomRight.y }, // Bottom right (2)
        { x: topLeft.x, y: bottomRight.y }   // Bottom left (3)
      ];
    } else {
      corners = [...originalPoints.slice(0, 4)];
    }
    
    if (handleType === 'corner') {
      // Corner resizing - maintain rectangle shape by resizing from opposite corner
      const oppositeIndex = (handleIndex + 2) % 4; // Get the opposite corner
      const oppositeCorner = corners[oppositeIndex];
      
      // Calculate new rectangle bounds using the dragged corner and its opposite
      const minX = Math.min(newPoint.x, oppositeCorner.x);
      const maxX = Math.max(newPoint.x, oppositeCorner.x);
      const minY = Math.min(newPoint.y, oppositeCorner.y);
      const maxY = Math.max(newPoint.y, oppositeCorner.y);
      
      if (maintainAspectRatio) {
        // Calculate aspect ratio from original rectangle
        const originalWidth = Math.abs(corners[1].x - corners[0].x);
        const originalHeight = Math.abs(corners[2].y - corners[1].y);
        const aspectRatio = originalWidth / originalHeight;
        
        // Calculate current dimensions relative to opposite corner
        const deltaX = newPoint.x - oppositeCorner.x;
        const deltaY = newPoint.y - oppositeCorner.y;
        
        // Use the larger dimension change to determine the constraining dimension
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        let finalWidth, finalHeight;
        
        // Choose the dimension that gives us the larger rectangle to avoid jumping
        if (absDeltaX / aspectRatio > absDeltaY) {
          // Width-driven resize
          finalWidth = absDeltaX;
          finalHeight = finalWidth / aspectRatio;
        } else {
          // Height-driven resize  
          finalHeight = absDeltaY;
          finalWidth = finalHeight * aspectRatio;
        }
        
        // Apply the signs from the original deltas
        const signX = Math.sign(deltaX);
        const signY = Math.sign(deltaY);
        
        const newCornerX = oppositeCorner.x + (finalWidth * signX);
        const newCornerY = oppositeCorner.y + (finalHeight * signY);
        
        // Return 2-point format with proper ordering
        const finalMinX = Math.min(oppositeCorner.x, newCornerX);
        const finalMaxX = Math.max(oppositeCorner.x, newCornerX);
        const finalMinY = Math.min(oppositeCorner.y, newCornerY);
        const finalMaxY = Math.max(oppositeCorner.y, newCornerY);
        
        return [
          { x: finalMinX, y: finalMinY },
          { x: finalMaxX, y: finalMaxY }
        ];
      }
      
      // Return new rectangle bounds in 2-point format (preserving rectangle shape)
      const result = [
        { x: minX, y: minY },  // Top left
        { x: maxX, y: maxY }   // Bottom right
      ];
      console.log('🔧 Rectangle resize returning 2-point format:', JSON.stringify(result));
      return result;
    } else {
      // Edge resizing - constrain to single dimension
      const newCorners = [...corners];
      
      if (handleIndex === 0) { // Top edge - only resize height
        newCorners[0].y = newPoint.y;
        newCorners[1].y = newPoint.y;
      } else if (handleIndex === 1) { // Right edge - only resize width
        newCorners[1].x = newPoint.x;
        newCorners[2].x = newPoint.x;
      } else if (handleIndex === 2) { // Bottom edge - only resize height
        newCorners[2].y = newPoint.y;
        newCorners[3].y = newPoint.y;
      } else if (handleIndex === 3) { // Left edge - only resize width
        newCorners[0].x = newPoint.x;
        newCorners[3].x = newPoint.x;
      }
      
      // Convert back to 2-point format for rectangles
      const minX = Math.min(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
      const maxX = Math.max(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
      const minY = Math.min(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);
      const maxY = Math.max(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);
      
      const edgeResult = [
        { x: minX, y: minY },  // Top left
        { x: maxX, y: maxY }   // Bottom right
      ];
      console.log('🔧 Edge resize returning 2-point format:', JSON.stringify(edgeResult));
      return edgeResult;
    }
  }, [maintainRectangleAspectRatio]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragState.current.isDragging || 
        !dragState.current.handleType || 
        dragState.current.handleIndex === null ||
        !resizingShape || 
        !dragState.current.originalPoints ||
        (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)) {
      return;
    }

    // Prevent default to avoid any browser interference
    event.preventDefault();
    event.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const newPoint: Point2D = { x: intersection.x, y: intersection.z };
      
      // Check if shift key is held for aspect ratio maintenance
      const maintainAspect = event.shiftKey;
      setMaintainAspectRatio(maintainAspect);
      
      // Calculate new points based on handle type and shape type
      let newPoints = [...dragState.current.originalPoints];
      
      if (resizingShape.type === 'rectangle') {
        newPoints = calculateRectangleResize(
          dragState.current.originalPoints,
          dragState.current.handleType,
          dragState.current.handleIndex,
          newPoint,
          maintainAspect
        );
      } else if (resizingShape.type === 'circle') {
        if (dragState.current.handleType === 'corner') {
          // Corner handles maintain circular shape - uniform resize
          newPoints = calculateCircleResize(
            dragState.current.originalPoints,
            dragState.current.handleIndex,
            newPoint
          );
        } else {
          // Edge handles allow oval/ellipse distortion
          newPoints = calculateEllipseResize(
            dragState.current.originalPoints,
            dragState.current.handleIndex,
            newPoint
          );
        }
      } else {
        // For polylines, only corner dragging is supported
        if (dragState.current.handleType === 'corner') {
          newPoints[dragState.current.handleIndex] = newPoint;
        }
      }
      
      console.log('🔧 About to call resizeShapeLive:', {
        shapeId: resizingShape.id,
        handleType: dragState.current.handleType,
        handleIndex: dragState.current.handleIndex,
        newPoints: JSON.stringify(newPoints),
        originalPoints: JSON.stringify(dragState.current.originalPoints)
      });
      document.title = 'LIVE RESIZE CALL ' + new Date().getSeconds();
      // Use live resize during dragging to avoid history pollution
      resizeShapeLive(resizingShape.id, newPoints);
    }
  }, [camera, gl.domElement, raycaster, resizingShape, setMaintainAspectRatio, resizeShapeLive, groundPlane, calculateRectangleResize, calculateCircleResize, calculateEllipseResize]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (dragState.current.isDragging && 
        (dragState.current.pointerId === null || event.pointerId === dragState.current.pointerId)) {
      
      console.log('🔄 Resize complete - state already saved at beginning');
      
      // Clean up drag state
      dragState.current.isDragging = false;
      dragState.current.handleType = null;
      dragState.current.handleIndex = null;
      dragState.current.originalPoints = null;
      dragState.current.startMousePos = null;
      dragState.current.pointerId = null;
      
      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('pointercancel', handlePointerUp, true);
      
      // Reset cursor and other states
      setCursorOverride(null);
      setMaintainAspectRatio(false);
    }
  }, [handlePointerMove, setMaintainAspectRatio]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  if (!drawing.isResizeMode || !resizingShape || activeTool !== 'select') {
    return null;
  }

  return (
    <group>
      {resizingShape.type === 'rectangle' && (
        <>
          {/* Corner Handles - White circles for free reshaping */}
          {resizeHandles.corners.map((point, index) => {
            const isSelected = drawing.resizeHandleType === 'corner' && drawing.resizeHandleIndex === index;
            const isHovered = hoveredHandle?.type === 'corner' && hoveredHandle?.index === index;
            
            // Get cursor for corner based on index
            let cornerCursor = 'nw-resize';
            if (index === 1) cornerCursor = 'ne-resize';
            else if (index === 2) cornerCursor = 'se-resize';
            else if (index === 3) cornerCursor = 'sw-resize';
            
            return (
              <Sphere
                key={`resize-corner-${index}`}
                position={[point.x, elevation + 0.2, point.y]}
                args={[0.5]}
                onClick={(event) => {
                  event.stopPropagation();
                  setResizeHandle('corner', index);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  
                  setResizeHandle('corner', index);
                  
                  // Save initial state to history before starting resize
                  console.log('🔄 Saving initial state before resize');
                  saveToHistory();
                  
                  // Set up drag state  
                  console.log('🎯 SPHERE CLICKED! Corner index:', index);
                  document.title = 'CORNER DRAG START ' + index;
                  dragState.current.isDragging = true;
                  dragState.current.handleType = 'corner';
                  dragState.current.handleIndex = index;
                  dragState.current.originalPoints = [...resizingShape.points];
                  dragState.current.pointerId = event.nativeEvent.pointerId;
                  
                  // Set cursor for the entire drag operation
                  setCursorOverride(cornerCursor);
                  
                  // Capture pointer to ensure we get all events
                  event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
                  
                  // Add global listeners with capture
                  document.addEventListener('pointermove', handlePointerMove, true);
                  document.addEventListener('pointerup', handlePointerUp, true);
                  document.addEventListener('pointercancel', handlePointerUp, true);
                }}
                onPointerEnter={() => {
                  setHoveredHandle({type: 'corner', index});
                  if (!dragState.current.isDragging) {
                    setCursorOverride(cornerCursor);
                  }
                }}
                onPointerLeave={() => {
                  setHoveredHandle(null);
                  if (!dragState.current.isDragging) {
                    setCursorOverride(null);
                  }
                }}
                cursor={cornerCursor}
              >
                <meshBasicMaterial
                  color={isSelected ? '#DDDDDD' : isHovered ? '#CCCCCC' : '#FFFFFF'}
                  transparent={false}
                  opacity={1.0}
                />
              </Sphere>
            );
          })}
          
          {/* Edge Handles - Larger rectangles on the lines for single-dimension resizing */}
          {resizeHandles.allHandles?.slice(4).map((point, index) => {
            const isSelected = drawing.resizeHandleType === 'edge' && drawing.resizeHandleIndex === index;
            const isHovered = hoveredHandle?.type === 'edge' && hoveredHandle?.index === index;
            
            // Make edge handles larger and oriented based on which edge
            let handleArgs: [number, number, number] = [1.5, 0.3, 0.4]; // Horizontal handles (top/bottom edges) - bigger
            let edgeCursor = 'ns-resize'; // Vertical resize for top/bottom edges
            
            if (index === 1 || index === 3) { // Right and left edges - vertical handles
              handleArgs = [0.4, 0.3, 1.5]; // Bigger vertical handles
              edgeCursor = 'ew-resize'; // Horizontal resize for left/right edges
            }
            
            return (
              <Box
                key={`resize-edge-${index}`}
                position={[point.x, elevation + 0.15, point.y]}
                args={handleArgs}
                onClick={(event) => {
                  event.stopPropagation();
                  setResizeHandle('edge', index);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  
                  setResizeHandle('edge', index);
                  
                  // Save initial state to history before starting resize
                  console.log('🔄 Saving initial state before resize');
                  saveToHistory();
                  
                  // Set up drag state
                  document.title = 'EDGE DRAG START ' + index;
                  dragState.current.isDragging = true;
                  dragState.current.handleType = 'edge';
                  dragState.current.handleIndex = index;
                  dragState.current.originalPoints = [...resizingShape.points];
                  dragState.current.pointerId = event.nativeEvent.pointerId;
                  
                  // Set cursor for the entire drag operation
                  setCursorOverride(edgeCursor);
                  
                  // Capture pointer to ensure we get all events
                  event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
                  
                  // Add global listeners with capture
                  document.addEventListener('pointermove', handlePointerMove, true);
                  document.addEventListener('pointerup', handlePointerUp, true);
                  document.addEventListener('pointercancel', handlePointerUp, true);
                }}
                onPointerEnter={() => {
                  setHoveredHandle({type: 'edge', index});
                  if (!dragState.current.isDragging) {
                    setCursorOverride(edgeCursor);
                  }
                }}
                onPointerLeave={() => {
                  setHoveredHandle(null);
                  if (!dragState.current.isDragging) {
                    setCursorOverride(null);
                  }
                }}
                cursor={edgeCursor}
              >
                <meshBasicMaterial
                  color={isSelected ? '#DDDDDD' : isHovered ? '#CCCCCC' : '#FFFFFF'}
                  transparent={false}
                  opacity={1.0}
                />
              </Box>
            );
          })}
        </>
      )}
      
      {/* For circles, show 8 resize handles like Windows */}
      {resizingShape.type === 'circle' && (
        <>
          {/* Corner Handles - Uniform resize (maintains circle shape) */}
          {resizeHandles.corners.map((point, index) => {
            const isSelected = drawing.resizeHandleType === 'corner' && drawing.resizeHandleIndex === index;
            const isHovered = hoveredHandle?.type === 'corner' && hoveredHandle?.index === index;
            
            // Corner handles maintain circular shape - uniform resize from center
            let cornerCursor = 'nw-resize';
            if (index === 1) cornerCursor = 'ne-resize';
            else if (index === 2) cornerCursor = 'se-resize';
            else if (index === 3) cornerCursor = 'sw-resize';
            
            return (
              <Sphere
                key={`resize-circle-corner-${index}`}
                position={[point.x, elevation + 0.2, point.y]}
                args={[0.4]}
                onClick={(event) => {
                  event.stopPropagation();
                  setResizeHandle('corner', index);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  
                  setResizeHandle('corner', index);
                  
                  // Save initial state to history before starting resize
                  console.log('🔄 Saving initial state before resize');
                  saveToHistory();
                  
                  // Set up drag state  
                  console.log('🎯 SPHERE CLICKED! Corner index:', index);
                  document.title = 'CORNER DRAG START ' + index;
                  dragState.current.isDragging = true;
                  dragState.current.handleType = 'corner';
                  dragState.current.handleIndex = index;
                  dragState.current.originalPoints = [...resizingShape.points];
                  dragState.current.pointerId = event.nativeEvent.pointerId;
                  
                  // Set cursor for the entire drag operation
                  setCursorOverride(cornerCursor);
                  
                  // Capture pointer to ensure we get all events
                  event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
                  
                  // Add global listeners with capture
                  document.addEventListener('pointermove', handlePointerMove, true);
                  document.addEventListener('pointerup', handlePointerUp, true);
                  document.addEventListener('pointercancel', handlePointerUp, true);
                }}
                onPointerEnter={() => {
                  setHoveredHandle({type: 'corner', index});
                  if (!dragState.current.isDragging) {
                    setCursorOverride(cornerCursor);
                  }
                }}
                onPointerLeave={() => {
                  setHoveredHandle(null);
                  if (!dragState.current.isDragging) {
                    setCursorOverride(null);
                  }
                }}
                cursor={cornerCursor}
              >
                <meshBasicMaterial
                  color={isSelected ? '#DDDDDD' : isHovered ? '#CCCCCC' : '#FFFFFF'}
                  transparent={false}
                  opacity={1.0}
                />
              </Sphere>
            );
          })}
          
          {/* Edge Handles - Allow oval/ellipse distortion */}
          {resizeHandles.edges.map((point, index) => {
            const isSelected = drawing.resizeHandleType === 'edge' && drawing.resizeHandleIndex === index;
            const isHovered = hoveredHandle?.type === 'edge' && hoveredHandle?.index === index;
            
            // Edge handles allow oval distortion by stretching in one direction
            let edgeCursor = 'ns-resize'; // Top/Bottom handles (0, 2) - vertical stretch
            if (index === 1 || index === 3) edgeCursor = 'ew-resize'; // Right/Left handles (1, 3) - horizontal stretch
            
            // Make edge handles directional - wider in the direction they stretch
            let handleArgs: [number, number, number] = [1.2, 0.3, 0.4]; // Horizontal handles for top/bottom (wider horizontally)
            if (index === 1 || index === 3) { // Right and left handles
              handleArgs = [0.4, 0.3, 1.2]; // Vertical handles (wider vertically)
            }
            
            return (
              <Box
                key={`resize-circle-edge-${index}`}
                position={[point.x, elevation + 0.15, point.y]}
                args={handleArgs}
                onClick={(event) => {
                  event.stopPropagation();
                  setResizeHandle('edge', index);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  
                  setResizeHandle('edge', index);
                  
                  // Save initial state to history before starting resize
                  console.log('🔄 Saving initial state before resize');
                  saveToHistory();
                  
                  // Set up drag state
                  document.title = 'EDGE DRAG START ' + index;
                  dragState.current.isDragging = true;
                  dragState.current.handleType = 'edge';
                  dragState.current.handleIndex = index;
                  dragState.current.originalPoints = [...resizingShape.points];
                  dragState.current.pointerId = event.nativeEvent.pointerId;
                  
                  // Set cursor for the entire drag operation
                  setCursorOverride(edgeCursor);
                  
                  // Capture pointer to ensure we get all events
                  event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
                  
                  // Add global listeners with capture
                  document.addEventListener('pointermove', handlePointerMove, true);
                  document.addEventListener('pointerup', handlePointerUp, true);
                  document.addEventListener('pointercancel', handlePointerUp, true);
                }}
                onPointerEnter={() => {
                  setHoveredHandle({type: 'edge', index});
                  if (!dragState.current.isDragging) {
                    setCursorOverride(edgeCursor);
                  }
                }}
                onPointerLeave={() => {
                  setHoveredHandle(null);
                  if (!dragState.current.isDragging) {
                    setCursorOverride(null);
                  }
                }}
                cursor={edgeCursor}
              >
                <meshBasicMaterial
                  color={isSelected ? '#DDDDDD' : isHovered ? '#CCCCCC' : '#FFFFFF'}
                  transparent={false}
                  opacity={1.0}
                />
              </Box>
            );
          })}
        </>
      )}
      
      {/* For polylines, show corner handles only */}
      {resizingShape.type === 'polyline' && resizeHandles.corners.map((point, index) => {
        const isSelected = drawing.resizeHandleType === 'corner' && drawing.resizeHandleIndex === index;
        const isHovered = hoveredHandle?.type === 'corner' && hoveredHandle?.index === index;
        
        return (
          <Sphere
            key={`resize-polyline-${index}`}
            position={[point.x, elevation + 0.2, point.y]}
            args={[0.5]}
            onClick={(event) => {
              event.stopPropagation();
              setResizeHandle('corner', index);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              
              setResizeHandle('corner', index);
              
              // Save initial state to history before starting resize
              console.log('🔄 Saving initial state before resize');
              saveToHistory();
              
              // Set up drag state
              dragState.current.isDragging = true;
              dragState.current.handleType = 'corner';
              dragState.current.handleIndex = index;
              dragState.current.originalPoints = [...resizingShape.points];
              dragState.current.pointerId = event.nativeEvent.pointerId;
              
              // Set cursor for the entire drag operation
              setCursorOverride('move');
              
              // Capture pointer to ensure we get all events
              event.currentTarget.setPointerCapture(event.pointerId);
              
              // Add global listeners with capture
              document.addEventListener('pointermove', handlePointerMove, true);
              document.addEventListener('pointerup', handlePointerUp, true);
              document.addEventListener('pointercancel', handlePointerUp, true);
            }}
            onPointerEnter={() => {
              setHoveredHandle({type: 'corner', index});
              if (!dragState.current.isDragging) {
                setCursorOverride('move');
              }
            }}
            onPointerLeave={() => {
              setHoveredHandle(null);
              if (!dragState.current.isDragging) {
                setCursorOverride(null);
              }
            }}
            cursor="move"
          >
            <meshBasicMaterial
              color={isSelected ? '#DDDDDD' : isHovered ? '#CCCCCC' : '#FFFFFF'}
              transparent={false}
              opacity={1.0}
            />
          </Sphere>
        );
      })}
    </group>
  );
};

export default ResizableShapeControls;