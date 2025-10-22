/**
 * ShapeElementRenderer Component
 *
 * Phase 3: Text as Layers - Shape Element Rendering
 *
 * Renders a single ShapeElement from the unified elements array.
 * Simplified version of ShapeRenderer logic for individual element rendering.
 */

import React, { useMemo, useCallback } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { GeometryCache } from '../../utils/GeometryCache';
import { logger } from '../../utils/logger';
import { useAppStore } from '../../store/useAppStore';
import ShapeDimensions from './ShapeDimensions';
import type { ShapeElement, Point2D } from '../../types';

interface ShapeElementRendererProps {
  element: ShapeElement;
  elevation?: number;
  hideDimensions?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  isHighlighted?: boolean;
  isDragging?: boolean;
  layerElevation?: number;
  layerOpacity?: number;
  showDimensions?: boolean;
  onClick?: (event: any) => void;
  onDoubleClick?: (event: any) => void;
  onPointerDown?: (event: any) => void;
  onPointerEnter?: (event: any) => void;
  onPointerLeave?: (event: any) => void;
  onContextMenu?: (event: any) => void;
}

// Utility function to apply rotation transform to points
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

export const ShapeElementRenderer: React.FC<ShapeElementRendererProps> = ({
  element,
  elevation = 0.01,
  hideDimensions = false,
  isSelected = false,
  isHovered = false,
  isHighlighted = false,
  isDragging = false,
  layerElevation,
  layerOpacity = 1,
  showDimensions = true,
  onClick,
  onDoubleClick,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onContextMenu,
}) => {
  // Get drawing state for live resize support
  const drawing = useAppStore(state => state.drawing);
  // Get drag state for multi-selection drag support
  const dragState = useAppStore(state => state.dragState);

  // Calculate final elevation
  const finalElevation = layerElevation ?? elevation;

  // Apply rotation transform and drag offset to points
  const transformedPoints = useMemo(() => {
    // Check if this element is being resized and use live points
    const isBeingResized = drawing.isResizeMode && drawing.resizingShapeId === element.id;

    // Use live points during resize, otherwise use element's stored points
    let pointsToUse = isBeingResized && drawing.liveResizePoints
      ? drawing.liveResizePoints
      : element.points;

    // MULTI-SELECTION FIX: Apply drag offset if element is being dragged
    if (isDragging && dragState.startPosition && dragState.currentPosition) {
      const offsetX = dragState.currentPosition.x - dragState.startPosition.x;
      const offsetY = dragState.currentPosition.y - dragState.startPosition.y;

      pointsToUse = pointsToUse.map(p => ({
        x: p.x + offsetX,
        y: p.y + offsetY
      }));

    }

    return applyRotationTransform(pointsToUse, element.rotation);
  }, [element.id, element.points, element.rotation, drawing.isResizeMode, drawing.resizingShapeId, drawing.liveResizePoints, isDragging, dragState.startPosition, dragState.currentPosition, dragState.draggedElementIds]);

  // Create geometry from points
  const geometry = useMemo(() => {
    if (!transformedPoints || transformedPoints.length < 2) {
      return null;
    }

    try {
      return GeometryCache.getGeometry(
        {
          id: element.id,
          type: element.shapeType,
          points: transformedPoints,
          color: element.color || '#3B82F6',
          visible: element.visible,
          layerId: element.layerId,
          modified: element.modified,
        },
        finalElevation
      );
    } catch (error) {
      logger.error(`[ShapeElementRenderer] Failed to create geometry for ${element.id}:`, error);
      return null;
    }
  }, [element.id, element.shapeType, element.color, element.visible, element.layerId, element.modified, transformedPoints, finalElevation]);

  // Calculate material properties based on state
  const material = useMemo(() => {
    let fillColor, lineColor, opacity, lineOpacity, lineWidth;

    if (isDragging) {
      fillColor = "#16A34A";
      lineColor = "#16A34A";
      opacity = 0.8 * layerOpacity;
      lineOpacity = 1 * layerOpacity;
      lineWidth = 5;
    } else if (isHighlighted) {
      fillColor = "#9333EA"; // Purple for highlighted
      lineColor = "#9333EA";
      opacity = 0.8 * layerOpacity;
      lineOpacity = 1 * layerOpacity;
      lineWidth = 5;
    } else if (isSelected) {
      fillColor = "#1D4ED8"; // Blue for selected
      lineColor = "#1D4ED8";
      opacity = 0.7 * layerOpacity;
      lineOpacity = 1 * layerOpacity;
      lineWidth = 4;
    } else if (isHovered) {
      fillColor = "#3B82F6";
      lineColor = "#3B82F6";
      opacity = 0.6 * layerOpacity;
      lineOpacity = 0.9 * layerOpacity;
      lineWidth = 3;
    } else {
      fillColor = element.color || '#3B82F6';
      lineColor = element.color || '#3B82F6';
      opacity = 0.4 * layerOpacity;
      lineOpacity = element.visible ? 0.8 * layerOpacity : 0.3 * layerOpacity;
      lineWidth = 2;
    }

    return {
      fillColor,
      lineColor,
      opacity: Math.max(opacity, 0.1),
      lineOpacity,
      lineWidth,
    };
  }, [isDragging, isHighlighted, isSelected, isHovered, element.color, element.visible, layerOpacity]);

  // Convert points to 3D with elevation
  const points3D = useMemo(() => {
    let renderPoints = transformedPoints;

    // Convert 2-point rectangles to 4-point format for outline rendering
    if (element.shapeType === 'rectangle' && transformedPoints.length === 2) {
      const [topLeft, bottomRight] = transformedPoints;
      renderPoints = [
        { x: topLeft.x, y: topLeft.y },
        { x: bottomRight.x, y: topLeft.y },
        { x: bottomRight.x, y: bottomRight.y },
        { x: topLeft.x, y: bottomRight.y },
      ];
    }

    // Convert 2-point circles to perimeter points for outline rendering
    if (element.shapeType === 'circle' && transformedPoints.length === 2) {
      const center = transformedPoints[0];
      const edgePoint = transformedPoints[1];
      const radius = Math.sqrt(
        Math.pow(edgePoint.x - center.x, 2) + Math.pow(edgePoint.y - center.y, 2)
      );

      const circlePoints: Point2D[] = [];
      const segments = Math.max(32, Math.min(64, Math.floor(radius * 4)));

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        circlePoints.push({
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        });
      }

      renderPoints = circlePoints;
    }

    let points = renderPoints.map(point => new Vector3(point.x, finalElevation, point.y));

    // Close the shape for certain types
    const shouldCloseShape =
      element.shapeType === 'rectangle' ||
      element.shapeType === 'polygon' ||
      element.shapeType === 'circle' ||
      (element.shapeType === 'polyline' && renderPoints.length > 2);

    if (shouldCloseShape && points.length > 2) {
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];

      if (firstPoint.distanceTo(lastPoint) > 0.001) {
        points = [...points, points[0]];
      }
    }

    return points;
  }, [transformedPoints, element.shapeType, finalElevation]);

  // Don't render if no valid geometry or points
  if (!geometry || !transformedPoints || transformedPoints.length < 2) {
    return null;
  }

  return (
    <group key={element.id}>
      {/* Shape fill mesh - only for shapes with 3+ points, rectangles with 2+ points, or circles */}
      {(transformedPoints.length >= 3 || element.shapeType === 'circle' || (element.shapeType === 'rectangle' && transformedPoints.length >= 2)) &&
       !(element.shapeType === 'polyline' && transformedPoints.length <= 2) && (
        <mesh
          geometry={geometry}
          position={[0, finalElevation + 0.001, 0]}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onContextMenu={onContextMenu}
        >
          <meshBasicMaterial
            color={material.fillColor}
            transparent={true}
            opacity={material.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
            alphaTest={0.01}
          />
        </mesh>
      )}

      {/* Shape outline */}
      <Line
        points={points3D}
        color={material.lineColor}
        lineWidth={material.lineWidth}
        transparent
        opacity={material.lineOpacity}
      />

      {/* Invisible interaction line for 2-point polylines */}
      {element.shapeType === 'polyline' && transformedPoints.length === 2 && (
        <Line
          points={points3D}
          lineWidth={6}
          transparent
          opacity={0}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        />
      )}

      {/* Dimensions */}
      {element.visible && showDimensions && !hideDimensions && (
        <ShapeDimensions
          shape={{
            id: element.id,
            type: element.shapeType,
            points: element.points, // Use original points for dimensions
            color: element.color,
            visible: element.visible,
            layerId: element.layerId,
            rotation: element.rotation,
            modified: element.modified,
          }}
          elevation={elevation}
          isSelected={isSelected}
          isResizeMode={false}
        />
      )}
    </group>
  );
};

export default ShapeElementRenderer;
