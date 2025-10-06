import React, { useMemo, useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';
import { Line, Html } from '@react-three/drei';
import { Vector3, Color, Plane } from 'three';
import { logger } from '../../utils/logger';
import type { Point2D } from '@/types';

interface DrawingFeedbackProps {
  elevation?: number;
  onDimensionChange?: (dimensions: {
    width?: number;
    height?: number;
    area?: number;
    radius?: number;
    length?: number;
  } | null) => void;
  onPolylineStartProximity?: (isNear: boolean) => void;
}

const DrawingFeedback: React.FC<DrawingFeedbackProps> = ({ elevation = 0.05, onDimensionChange, onPolylineStartProximity }) => {
  const { camera, raycaster, gl } = useThree();
  const [mousePosition, setMousePosition] = useState<Point2D>({ x: 0, y: 0 });
  const [isMouseOver3D, setIsMouseOver3D] = useState(false);
  const lastNearState = useRef<boolean>(false);
  const currentMousePosition = useRef<Point2D>({ x: 0, y: 0 });
  
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const snapToGrid = useAppStore(state => state.drawing.snapToGrid);
  const gridSize = useAppStore(state => state.drawing.gridSize);


  // Stable event-based mouse tracking
  React.useEffect(() => {
    if (activeTool === 'select') {
      setIsMouseOver3D(false);
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      try {
        const rect = gl.domElement.getBoundingClientRect();
        
        // Calculate normalized device coordinates (-1 to 1)
        const ndc = {
          x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
          y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
        
        // Validate NDC coordinates are within valid range
        if (Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) {
          return; // Skip if cursor is outside canvas
        }
        
        // Raycasting to ground plane
        const intersection = new Vector3();
        const plane = new Plane(new Vector3(0, 1, 0), 0);
        
        raycaster.setFromCamera(ndc, camera);
        const hasIntersection = raycaster.ray.intersectPlane(plane, intersection);
        
        if (hasIntersection) {
          // Apply grid snapping
          let worldX = intersection.x;
          let worldZ = intersection.z;
          
          if (snapToGrid && gridSize > 0) {
            worldX = Math.round(worldX / gridSize) * gridSize;
            worldZ = Math.round(worldZ / gridSize) * gridSize;
          }
          
          const newPos = { x: worldX, y: worldZ };
          
          // Validate coordinates are reasonable
          if (Math.abs(newPos.x) < 10000 && Math.abs(newPos.y) < 10000) {
            currentMousePosition.current = newPos;
            setMousePosition(newPos);
            setIsMouseOver3D(true);
          }
        } else {
          // Keep using last known good position instead of hiding
          if (currentMousePosition.current) {
            setMousePosition(currentMousePosition.current);
            setIsMouseOver3D(true);
          }
        }
      } catch (error) {
        logger.warn('Mouse tracking error:', error);
        // Keep using last known good position
        if (currentMousePosition.current) {
          setMousePosition(currentMousePosition.current);
          setIsMouseOver3D(true);
        }
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeTool, camera, raycaster, gl, snapToGrid, gridSize]);

  // Create snap indicator at mouse position - DISABLED (all cursor indicators removed)
  const snapIndicator = useMemo(() => {
    // All cursor indicators disabled for cleaner UI
    return null;
  }, [activeTool, isMouseOver3D, mousePosition.x, mousePosition.y, snapToGrid, elevation]);

  // Create preview lines for current drawing
  const drawingPreview = useMemo(() => {
    // Strict check: only show preview when actively drawing and shape is valid
    // Map drawing tools to shape types
    const getShapeTypeFromTool = (tool: string) => {
      switch (tool) {
        case 'polyline': return 'polyline';
        case 'rectangle': return 'rectangle';
        case 'circle': return 'circle';
        case 'polygon': return 'polygon';
        default: return tool;
      }
    };

    if (!isDrawing || 
        !currentShape?.points || 
        currentShape.points.length === 0 || 
        !isMouseOver3D || 
        activeTool === 'select' ||
        !currentShape.type ||
        currentShape.type !== getShapeTypeFromTool(activeTool)) {
      return null;
    }

    const points3D = currentShape.points.map(p => new Vector3(p.x, elevation, p.y));
    const previewColor = new Color(currentShape.color || '#3b82f6');

    switch (activeTool) {
      case 'polyline': {
        if (points3D.length === 0) {
          return null;
        }
        
        // Show line from last point to mouse cursor
        const lastPoint = points3D[points3D.length - 1];
        const mousePoint = new Vector3(mousePosition.x, elevation, mousePosition.y);
        
        // Check proximity to first point for cursor change (only if we have 3+ points)
        if (currentShape.points.length >= 3 && onPolylineStartProximity) {
          const firstPoint = points3D[0];
          const distanceToStart = mousePoint.distanceTo(firstPoint);
          const closeThreshold = Math.max(gridSize * 3.0, 4.0); // Larger, more stable threshold
          const isNearStart = distanceToStart < closeThreshold;
          
          // Add hysteresis to prevent flickering - once near, need to be farther to turn off
          const currentNear = lastNearState.current;
          const shouldUpdate = !currentNear ? isNearStart : distanceToStart > closeThreshold * 1.5;
          
          if (shouldUpdate && isNearStart !== lastNearState.current) {
            lastNearState.current = isNearStart;
            onPolylineStartProximity(isNearStart);
          }
          
          // Show closing preview when near start point
          if (isNearStart) {
            return (
              <group>
                {/* Drawn lines - solid blue */}
                {points3D.length > 1 && (
                  <Line
                    points={points3D}
                    color={previewColor}
                    lineWidth={3}
                    transparent
                    opacity={0.8}
                  />
                )}
                {/* Imaginary line to mouse - dotted */}
                <Line
                  points={[lastPoint, mousePoint]}
                  color={previewColor}
                  lineWidth={2}
                  transparent
                  opacity={0.6}
                  dashed
                  dashSize={0.3}
                  gapSize={0.2}
                />
                {/* Closing line preview - dotted */}
                <Line
                  points={[mousePoint, firstPoint]}
                  color={previewColor}
                  lineWidth={2}
                  transparent
                  opacity={0.6}
                  dashed
                  dashSize={0.3}
                  gapSize={0.2}
                />
              </group>
            );
          }
        } else if (onPolylineStartProximity) {
          onPolylineStartProximity(false);
        }
        
        return (
          <group>
            {/* Drawn lines - solid blue */}
            {points3D.length > 1 && (
              <Line
                points={points3D}
                color={previewColor}
                lineWidth={3}
                transparent
                opacity={0.8}
              />
            )}
            {/* Imaginary line following cursor - dotted */}
            <Line
              points={[lastPoint, mousePoint]}
              color={previewColor}
              lineWidth={2}
              transparent
              opacity={0.6}
              dashed
              dashSize={0.3}
              gapSize={0.2}
            />
          </group>
        );
      }

      case 'rectangle': {
        if (currentShape.points.length === 1 && isDrawing) {
          const firstPoint = points3D[0];
          const mousePoint = new Vector3(mousePosition.x, elevation, mousePosition.y);
          
          // Calculate rectangle dimensions
          const width = Math.abs(mousePoint.x - firstPoint.x);
          const height = Math.abs(mousePoint.z - firstPoint.z);
          const area = width * height;
          
          // Send dimensions to UI overlay only when actively drawing
          if (onDimensionChange && isDrawing) {
            onDimensionChange({ width, height, area });
          }
          
          // Rectangle preview
          const rectPoints = [
            firstPoint,
            new Vector3(mousePoint.x, elevation, firstPoint.z),
            mousePoint,
            new Vector3(firstPoint.x, elevation, mousePoint.z),
            firstPoint
          ];
          
          return (
            <group>
              <Line
                points={rectPoints}
                color={previewColor}
                lineWidth={2}
                transparent
                opacity={0.5}
                dashed
                dashSize={0.3}
                gapSize={0.2}
              />
            </group>
          );
        }
        break;
      }

      case 'circle': {
        if (currentShape.points.length === 1 && isDrawing) {
          const center = points3D[0];
          const mousePoint = new Vector3(mousePosition.x, elevation, mousePosition.y);
          const radius = center.distanceTo(mousePoint);
          const area = Math.PI * radius * radius;
          
          // Send dimensions to UI overlay only when actively drawing
          if (onDimensionChange && isDrawing) {
            onDimensionChange({ radius, area });
          }
          
          // Circle preview
          const circlePoints: Vector3[] = [];
          const segments = 32;
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            circlePoints.push(new Vector3(
              center.x + Math.cos(angle) * radius,
              elevation,
              center.z + Math.sin(angle) * radius
            ));
          }
          
          return (
            <group>
              {/* Circle preview */}
              <Line
                points={circlePoints}
                color={previewColor}
                lineWidth={2}
                transparent
                opacity={0.5}
                dashed
                dashSize={0.3}
                gapSize={0.2}
              />
              
              {/* Radius line */}
              <Line
                points={[center, mousePoint]}
                color={new Color('#f59e0b')}
                lineWidth={1}
                transparent
                opacity={0.7}
              />
            </group>
          );
        }
        break;
      }
    }

    return null;
  }, [isDrawing, currentShape?.points, currentShape?.color, currentShape?.type, activeTool, mousePosition.x, mousePosition.y, isMouseOver3D, elevation, gridSize, onDimensionChange, onPolylineStartProximity]);

  // Clear dimensions when tool changes
  React.useEffect(() => {
    if (activeTool === 'select') {
      if (onDimensionChange) {
        onDimensionChange(null);
      }
      if (onPolylineStartProximity) {
        onPolylineStartProximity(false);
        lastNearState.current = false;
      }
      // Reset mouse position when switching to select
      currentMousePosition.current = { x: 0, y: 0 };
    }
  }, [activeTool, onDimensionChange, onPolylineStartProximity]);

  // Force clear dimensions when component unmounts or tool changes
  React.useEffect(() => {
    return () => {
      if (onDimensionChange) {
        onDimensionChange(null);
      }
      if (onPolylineStartProximity) {
        onPolylineStartProximity(false);
        lastNearState.current = false;
      }
    };
  }, [activeTool, onDimensionChange, onPolylineStartProximity]);

  // Drawing instructions removed - now handled by Properties panel

  // Only render when actively drawing or showing feedback
  if (activeTool === 'select' || (!isDrawing && !isMouseOver3D)) {
    return null;
  }

  return (
    <group key={`feedback-${activeTool}-${isDrawing ? 'drawing' : 'idle'}`}>
      {snapIndicator}
      {drawingPreview}
    </group>
  );
};

export default DrawingFeedback;