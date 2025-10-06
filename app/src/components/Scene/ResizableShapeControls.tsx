import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Box, Sphere } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { logger } from '@/utils/logger';

// Minimum rectangle constraints to prevent degenerate shapes
const MIN_RECTANGLE_AREA = 10; // 10 m² minimum area
const MIN_DIMENSION = 1.0; // 1m minimum width or height

// Utility function to validate rectangle dimensions and enforce minimums
const validateAndEnforceMinimumRectangle = (points: Point2D[], originalPoints: Point2D[]): Point2D[] => {
  if (points.length !== 2) return originalPoints;

  const [p1, p2] = points;
  let width = Math.abs(p2.x - p1.x);
  let height = Math.abs(p2.y - p1.y);
  const area = width * height;

  // Handle completely degenerate case (both points are the same)
  if (width === 0 && height === 0) {
    // Create a square with minimum area centered on the point
    const sideLength = Math.sqrt(MIN_RECTANGLE_AREA);
    const halfSide = sideLength / 2;
    const centerX = p1.x;
    const centerY = p1.y;

    return [
      { x: centerX - halfSide, y: centerY - halfSide },
      { x: centerX + halfSide, y: centerY + halfSide }
    ];
  }

  // Check if current dimensions meet minimums
  const needsEnforcement = width < MIN_DIMENSION || height < MIN_DIMENSION || area < MIN_RECTANGLE_AREA;

  if (!needsEnforcement) {
    return points; // Valid rectangle, return as-is
  }

  // Enforce minimum dimensions while preserving aspect ratio where possible
  if (area > 0 && area < MIN_RECTANGLE_AREA) {
    // Scale up to meet minimum area while preserving aspect ratio
    const scaleFactor = Math.sqrt(MIN_RECTANGLE_AREA / area);
    width *= scaleFactor;
    height *= scaleFactor;
  }

  // Ensure individual dimensions meet minimums
  width = Math.max(width, MIN_DIMENSION);
  height = Math.max(height, MIN_DIMENSION);

  // Calculate center point
  const centerX = (p1.x + p2.x) / 2;
  const centerY = (p1.y + p2.y) / 2;

  // Create new rectangle centered on the same point
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return [
    { x: centerX - halfWidth, y: centerY - halfHeight },
    { x: centerX + halfWidth, y: centerY + halfHeight }
  ];
};

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
  const exitResizeMode = useAppStore(state => state.exitResizeMode);
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
    const shape = shapes.find(shape => shape.id === drawing.resizingShapeId) || null;

    // Don't show resize handles for locked shapes
    if (shape?.locked) {
      return null;
    }

    return shape;
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
      
      // Debug logging removed - resize handles working correctly
      return { corners: cornerPoints, edges: [], allHandles };
    }
    
    // For circles, create 4 resize handles on cardinal directions
    if (resizingShape.type === 'circle') {
      if (resizingShape.points.length >= 2) {
        const circlePoints = resizingShape.points;

        // UPDATED: Handle 2-point circle format [center, edge]
        let originalCenter: Point2D;
        let radiusX: number, radiusY: number;

        if (circlePoints.length === 2) {
          // 2-point format: [center, edge point]
          originalCenter = circlePoints[0];
          const edgePoint = circlePoints[1];
          const radius = Math.sqrt(
            Math.pow(edgePoint.x - originalCenter.x, 2) +
            Math.pow(edgePoint.y - originalCenter.y, 2)
          );
          radiusX = radius;
          radiusY = radius;
        } else {
          // Legacy multi-point format (perimeter points)
          originalCenter = {
            x: circlePoints.reduce((sum, p) => sum + p.x, 0) / circlePoints.length,
            y: circlePoints.reduce((sum, p) => sum + p.y, 0) / circlePoints.length
          };

          const minX = Math.min(...circlePoints.map(p => p.x));
          const maxX = Math.max(...circlePoints.map(p => p.x));
          const minY = Math.min(...circlePoints.map(p => p.y));
          const maxY = Math.max(...circlePoints.map(p => p.y));

          radiusX = (maxX - minX) / 2;
          radiusY = (maxY - minY) / 2;
        }

        // Apply drag offset if shape is being dragged
        const isBeingDragged = globalDragState.isDragging && globalDragState.draggedShapeId === resizingShape.id;
        if (isBeingDragged && globalDragState.startPosition && globalDragState.currentPosition) {
          const offsetX = globalDragState.currentPosition.x - globalDragState.startPosition.x;
          const offsetY = globalDragState.currentPosition.y - globalDragState.startPosition.y;
          originalCenter = {
            x: originalCenter.x + offsetX,
            y: originalCenter.y + offsetY
          };
        }
        
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
    pointerId: null as number | null,
    lastValidResizePoints: null as Point2D[] | null // Store last valid points for reliable capture
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
    if (originalPoints.length < 2) return originalPoints;

    // Determine center based on format
    let center: Point2D;
    if (originalPoints.length === 2) {
      // 2-point format: [center, edge]
      center = originalPoints[0];
    } else {
      // Legacy multi-point format
      center = {
        x: originalPoints.reduce((sum, p) => sum + p.x, 0) / originalPoints.length,
        y: originalPoints.reduce((sum, p) => sum + p.y, 0) / originalPoints.length
      };
    }

    // Calculate new radius as distance from center to mouse position
    const newRadius = Math.sqrt(
      Math.pow(newPoint.x - center.x, 2) +
      Math.pow(newPoint.y - center.y, 2)
    );

    // Return in 2-point format: [center, edge point]
    return [
      center,
      { x: center.x + newRadius, y: center.y }
    ];
  }, []);

  // Calculate new ellipse points when resizing circle edge handles
  const calculateEllipseResize = useCallback((
    originalPoints: Point2D[],
    handleIndex: number,
    newPoint: Point2D
  ): Point2D[] => {
    if (originalPoints.length < 2) return originalPoints;

    // Determine center and current radius
    let center: Point2D;
    let currentRadiusX: number, currentRadiusY: number;

    if (originalPoints.length === 2) {
      // 2-point format: [center, edge]
      center = originalPoints[0];
      const edgePoint = originalPoints[1];
      const radius = Math.sqrt(
        Math.pow(edgePoint.x - center.x, 2) +
        Math.pow(edgePoint.y - center.y, 2)
      );
      currentRadiusX = radius;
      currentRadiusY = radius;
    } else {
      // Multi-point format (ellipse perimeter points)
      center = {
        x: originalPoints.reduce((sum, p) => sum + p.x, 0) / originalPoints.length,
        y: originalPoints.reduce((sum, p) => sum + p.y, 0) / originalPoints.length
      };

      const minX = Math.min(...originalPoints.map(p => p.x));
      const maxX = Math.max(...originalPoints.map(p => p.x));
      const minY = Math.min(...originalPoints.map(p => p.y));
      const maxY = Math.max(...originalPoints.map(p => p.y));

      currentRadiusX = (maxX - minX) / 2;
      currentRadiusY = (maxY - minY) / 2;
    }

    // Adjust radius based on which edge handle is being dragged
    let newRadiusX = currentRadiusX;
    let newRadiusY = currentRadiusY;

    if (handleIndex === 0) { // Top handle - adjust Y radius
      newRadiusY = Math.abs(newPoint.y - center.y);
    } else if (handleIndex === 1) { // Right handle - adjust X radius
      newRadiusX = Math.abs(newPoint.x - center.x);
    } else if (handleIndex === 2) { // Bottom handle - adjust Y radius
      newRadiusY = Math.abs(newPoint.y - center.y);
    } else if (handleIndex === 3) { // Left handle - adjust X radius
      newRadiusX = Math.abs(newPoint.x - center.x);
    }

    // Generate ellipse perimeter points (return multi-point format for ellipses)
    const segments = 48; // Smooth ellipse
    const ellipsePoints: Point2D[] = [];

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      ellipsePoints.push({
        x: center.x + Math.cos(angle) * newRadiusX,
        y: center.y + Math.sin(angle) * newRadiusY,
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
    // Enhanced validation for input parameters
    if (!originalPoints || !Array.isArray(originalPoints) || originalPoints.length < 2) {
      logger.error('❌ Invalid originalPoints for rectangle resize:', originalPoints);
      return originalPoints || [];
    }

    if (!newPoint || typeof newPoint.x !== 'number' || typeof newPoint.y !== 'number' ||
        !isFinite(newPoint.x) || !isFinite(newPoint.y)) {
      logger.error('❌ Invalid newPoint for rectangle resize:', newPoint);
      return originalPoints;
    }

    if (typeof handleIndex !== 'number' || handleIndex < 0) {
      logger.error('❌ Invalid handleIndex for rectangle resize:', handleIndex);
      return originalPoints;
    }

    // Convert to 4-corner format if needed with enhanced validation
    let corners: Point2D[] = [];
    if (originalPoints.length === 2) {
      const [topLeft, bottomRight] = originalPoints;

      // Validate 2-point format
      if (!topLeft || !bottomRight ||
          typeof topLeft.x !== 'number' || typeof topLeft.y !== 'number' ||
          typeof bottomRight.x !== 'number' || typeof bottomRight.y !== 'number') {
        logger.error('❌ Invalid 2-point format for rectangle resize');
        return originalPoints;
      }

      corners = [
        { x: topLeft.x, y: topLeft.y },      // Top left (0)
        { x: bottomRight.x, y: topLeft.y },  // Top right (1)
        { x: bottomRight.x, y: bottomRight.y }, // Bottom right (2)
        { x: topLeft.x, y: bottomRight.y }   // Bottom left (3)
      ];
    } else if (originalPoints.length >= 4) {
      // Validate 4-point format
      const validCorners = originalPoints.slice(0, 4).filter(point =>
        point && typeof point.x === 'number' && typeof point.y === 'number' &&
        isFinite(point.x) && isFinite(point.y)
      );

      if (validCorners.length !== 4) {
        logger.error('❌ Invalid 4-point format for rectangle resize');
        return originalPoints;
      }

      corners = validCorners;
    } else {
      logger.error('❌ Unsupported point count for rectangle resize:', originalPoints.length);
      return originalPoints;
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

        // Prevent division by zero
        if (originalWidth < 0.001 || originalHeight < 0.001) {
          logger.warn('⚠️ Original rectangle too small for aspect ratio, falling back to free resize');
          // Fall through to free resize logic below
        } else {
          const aspectRatio = originalWidth / originalHeight;

          // Calculate current dimensions relative to opposite corner
          const currentWidth = Math.abs(newPoint.x - oppositeCorner.x);
          const currentHeight = Math.abs(newPoint.y - oppositeCorner.y);

          // Determine which dimension should drive the resize based on user intention
          // Use the dimension that changed more from the original to determine intent
          let finalWidth, finalHeight;

          if (currentWidth / originalWidth > currentHeight / originalHeight) {
            // Width changed more, so width drives the resize
            finalWidth = Math.max(currentWidth, MIN_DIMENSION);
            finalHeight = Math.max(finalWidth / aspectRatio, MIN_DIMENSION);
          } else {
            // Height changed more, so height drives the resize
            finalHeight = Math.max(currentHeight, MIN_DIMENSION);
            finalWidth = Math.max(finalHeight * aspectRatio, MIN_DIMENSION);
          }

          // Determine the signs based on the drag direction
          const signX = newPoint.x >= oppositeCorner.x ? 1 : -1;
          const signY = newPoint.y >= oppositeCorner.y ? 1 : -1;

          // Calculate the new corner position
          const newCornerX = oppositeCorner.x + (finalWidth * signX);
          const newCornerY = oppositeCorner.y + (finalHeight * signY);

          // Create the final rectangle bounds
          const finalMinX = Math.min(oppositeCorner.x, newCornerX);
          const finalMaxX = Math.max(oppositeCorner.x, newCornerX);
          const finalMinY = Math.min(oppositeCorner.y, newCornerY);
          const finalMaxY = Math.max(oppositeCorner.y, newCornerY);

          const aspectRatioResult = [
            { x: finalMinX, y: finalMinY },
            { x: finalMaxX, y: finalMaxY }
          ];

          // Apply minimum area enforcement
          return validateAndEnforceMinimumRectangle(aspectRatioResult, originalPoints);
        }
      }
      
      // Free resize (no aspect ratio constraint)
      const freeResizeResult = [
        { x: minX, y: minY },  // Top left
        { x: maxX, y: maxY }   // Bottom right
      ];

      // Apply minimum area and dimension enforcement
      const validatedResult = validateAndEnforceMinimumRectangle(freeResizeResult, originalPoints);
      logger.log('✅ Rectangle resize returning validated 2-point format:', JSON.stringify(validatedResult));
      return validatedResult;
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
      
      // Convert back to 2-point format for rectangles with validation
      const minX = Math.min(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
      const maxX = Math.max(newCorners[0].x, newCorners[1].x, newCorners[2].x, newCorners[3].x);
      const minY = Math.min(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);
      const maxY = Math.max(newCorners[0].y, newCorners[1].y, newCorners[2].y, newCorners[3].y);

      // Edge resize result
      const edgeResult = [
        { x: minX, y: minY },  // Top left
        { x: maxX, y: maxY }   // Bottom right
      ];

      // Apply minimum area and dimension enforcement
      const validatedEdgeResult = validateAndEnforceMinimumRectangle(edgeResult, originalPoints);
      logger.log('✅ Edge resize returning validated 2-point format:', JSON.stringify(validatedEdgeResult));
      return validatedEdgeResult;
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

      // ENHANCED VALIDATION: Prevent geometry corruption from invalid points
      if (!newPoints || !Array.isArray(newPoints) || newPoints.length === 0) {
        logger.warn('⚠️ Invalid newPoints array, skipping live resize:', newPoints);
        return;
      }

      // Validate each point has proper numeric coordinates
      const validPoints = newPoints.filter(point =>
        point &&
        typeof point.x === 'number' && typeof point.y === 'number' &&
        !isNaN(point.x) && !isNaN(point.y) &&
        isFinite(point.x) && isFinite(point.y)
      );

      if (validPoints.length !== newPoints.length) {
        logger.warn('⚠️ Some points have invalid coordinates, skipping live resize');
        return;
      }

      // Additional validation for rectangles to prevent diagonal line artifacts
      if (resizingShape.type === 'rectangle' && validPoints.length >= 2) {
        if (validPoints.length === 2) {
          // 2-point format: check for minimum size
          const [p1, p2] = validPoints;
          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.y - p1.y);
          if (width < 0.01 || height < 0.01) {
            logger.warn('⚠️ Rectangle too small during live resize, skipping');
            return;
          }
        } else if (validPoints.length === 4) {
          // 4-point format: check for degenerate geometry
          const xCoords = validPoints.map(p => p.x);
          const yCoords = validPoints.map(p => p.y);
          const width = Math.max(...xCoords) - Math.min(...xCoords);
          const height = Math.max(...yCoords) - Math.min(...yCoords);
          if (width < 0.01 || height < 0.01) {
            logger.warn('⚠️ Rectangle geometry degenerate during live resize, skipping');
            return;
          }
        }
      }

      // Store last valid points for reliable capture in handlePointerUp
      dragState.current.lastValidResizePoints = [...validPoints];

      // Use validated points for live resize
      resizeShapeLive(resizingShape.id, validPoints);
    }
  }, [camera, gl.domElement, raycaster, resizingShape, setMaintainAspectRatio, resizeShapeLive, groundPlane, calculateRectangleResize, calculateCircleResize, calculateEllipseResize]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    // CRITICAL FIX: Prevent duplicate pointer up events
    if (!dragState.current.isDragging ||
        (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)) {
      return;
    }

    // CRITICAL FIX: Capture live resize points IMMEDIATELY before resizeShape() clears them
    const capturedLivePoints = drawing.liveResizePoints ? [...drawing.liveResizePoints] : null;

    // ENHANCED: Robust final resize commit with comprehensive fallback logic
    if (resizingShape) {
      let finalPoints = null;


      // Priority 1: Use stored drag state points (most reliable)
      if (dragState.current.lastValidResizePoints && dragState.current.lastValidResizePoints.length >= 2) {
        finalPoints = [...dragState.current.lastValidResizePoints];
      }
      // Priority 2: Fallback to captured live resize points if drag state fails
      else if (capturedLivePoints && Array.isArray(capturedLivePoints) && capturedLivePoints.length >= 2) {
        // Validate all points have proper coordinates
        const validLivePoints = capturedLivePoints.filter(point =>
          point && typeof point.x === 'number' && typeof point.y === 'number' &&
          !isNaN(point.x) && !isNaN(point.y) && isFinite(point.x) && isFinite(point.y)
        );

        if (validLivePoints.length >= 2) {
          finalPoints = validLivePoints;
        }
      }

      // Priority 3: Fall back to current intersection point calculation if live points invalid
      if (!finalPoints && dragState.current.originalPoints) {
        // Get current mouse position and calculate final points
        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
          const currentPoint: Point2D = { x: intersection.x, y: intersection.z };

          // Calculate final points using the same logic as handlePointerMove
          if (resizingShape.type === 'rectangle') {
            finalPoints = calculateRectangleResize(
              dragState.current.originalPoints,
              dragState.current.handleType || 'corner',
              dragState.current.handleIndex || 0,
              currentPoint,
              event.shiftKey
            );
          }
        }
      }

      // Priority 4: Last resort - maintain original points (no change)
      if (!finalPoints) {
        finalPoints = dragState.current.originalPoints || resizingShape.points;
        logger.warn('⚠️ Using fallback to original points - resize may be lost');
      }

      // Clean up drag state IMMEDIATELY to prevent duplicate calls
      dragState.current.isDragging = false;
      dragState.current.handleType = null;
      dragState.current.handleIndex = null;
      dragState.current.originalPoints = null;
      dragState.current.startMousePos = null;
      dragState.current.pointerId = null;
      dragState.current.lastValidResizePoints = null;

      // ATOMIC COMMIT: Ensure the resize is committed atomically
      if (finalPoints && finalPoints.length >= 2) {
        try {
          resizeShape(resizingShape.id, finalPoints);
        } catch (error) {
          logger.error('❌ Failed to commit final resize:', error);
        }
      }
    } else {
      logger.error('❌ No resizing shape available for final commit');
    }

    // Remove event listeners
    document.removeEventListener('pointermove', handlePointerMove, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointercancel', handlePointerUp, true);

    // Reset cursor and other states
    setCursorOverride(null);
    setMaintainAspectRatio(false);

    // CRITICAL FIX: Exit resize mode after successful completion
    // This allows user to immediately switch to rotation mode
    exitResizeMode();
  }, [handlePointerMove, setMaintainAspectRatio, resizingShape, resizeShape, exitResizeMode, gl.domElement, camera, raycaster, groundPlane, calculateRectangleResize]);


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
                position={[point.x, elevation + 0.3, point.y]}
                args={[0.6]} // Professional size for corner handles
                onClick={(event) => {
                  event.stopPropagation();
                  setResizeHandle('corner', index);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();

                  setResizeHandle('corner', index);

                  // Save initial state to history before starting resize
                  saveToHistory();

                  // Set up drag state
                  dragState.current.isDragging = true;
                  dragState.current.handleType = 'corner';
                  dragState.current.handleIndex = index;
                  dragState.current.originalPoints = [...resizingShape.points];
                  dragState.current.pointerId = event.nativeEvent.pointerId;

                  // Set cursor for the entire drag operation
                  setCursorOverride(cornerCursor);

                  // Capture pointer to ensure we get all events
                  try {
                    event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
                  } catch (error) {
                    console.warn('⚠️ Failed to capture pointer:', error);
                  }

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
            
            // Calculate parallel direction for this edge handle
            const baseRotation = resizingShape.rotation?.angle || 0;
            
            // Each edge has a base parallel direction relative to unrotated rectangle:
            // Top edge (0): runs horizontally = 0°
            // Right edge (1): runs vertically = 90°
            // Bottom edge (2): runs horizontally = 180°  
            // Left edge (3): runs vertically = 270°
            const baseParallels = [0, 90, 180, 270];
            const parallelAngle = baseRotation + baseParallels[index];
            
            // Normalize angle to 0-360 range
            const normalizedAngle = ((parallelAngle % 360) + 360) % 360;
            
            // Determine handle orientation based on final parallel direction
            // Vertical edges (running up/down): 45-135° and 225-315°  
            // Horizontal edges (running left/right): 135-225° and 315-45°
            const isEdgeVertical = (normalizedAngle >= 45 && normalizedAngle < 135) || 
                                  (normalizedAngle >= 225 && normalizedAngle < 315);
            
            // Set handle dimensions to create thin bar parallel to edge direction
            let handleArgs: [number, number, number];
            let edgeCursor: string;
            
            if (isEdgeVertical) {
              // Edge runs vertically - create thin vertical handle bar
              handleArgs = [0.3, 0.3, 1.5]; 
              edgeCursor = 'ew-resize'; // Cursor for horizontal resize (perpendicular to vertical edge)
            } else {
              // Edge runs horizontally - create thin horizontal handle bar  
              handleArgs = [1.5, 0.3, 0.3];
              edgeCursor = 'ns-resize'; // Cursor for vertical resize (perpendicular to horizontal edge)
            }
            
            const rotationRadians = parallelAngle * Math.PI / 180;
            
            return (
              <Box
                key={`resize-edge-${index}`}
                position={[point.x, elevation + 0.15, point.y]}
                args={handleArgs}
                rotation={[0, 0, rotationRadians]}
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