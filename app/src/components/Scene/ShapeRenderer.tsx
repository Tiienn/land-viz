import React, { useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Line } from '@react-three/drei';
import { Vector3, Color, BufferGeometry, BufferAttribute, Vector2, Plane } from 'three';
import { useThree } from '@react-three/fiber';
import ShapeDimensions from './ShapeDimensions';
import EditableShapeControls from './EditableShapeControls';
import ResizableShapeControls from './ResizableShapeControls';
import RotationControls from './RotationControls';
import type { Shape, Point2D } from '@/types';

interface ShapeRendererProps {
  elevation?: number;
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

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ elevation = 0.01 }) => {
  const { camera, gl, raycaster } = useThree();
  const groundPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));
  
  const shapes = useAppStore(state => state.shapes);
  const layers = useAppStore(state => state.layers);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const selectedShapeId = useAppStore(state => state.selectedShapeId);
  const hoveredShapeId = useAppStore(state => state.hoveredShapeId);
  const dragState = useAppStore(state => state.dragState);
  const showDimensions = useAppStore(state => state.drawing.showDimensions);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const selectShape = useAppStore(state => state.selectShape);
  const hoverShape = useAppStore(state => state.hoverShape);
  const startDragging = useAppStore(state => state.startDragging);
  const updateDragPosition = useAppStore(state => state.updateDragPosition);
  const finishDragging = useAppStore(state => state.finishDragging);
  const cancelDragging = useAppStore(state => state.cancelDragging);
  
  // Resize mode actions
  const enterResizeMode = useAppStore(state => state.enterResizeMode);
  const exitResizeMode = useAppStore(state => state.exitResizeMode);
  const drawing = useAppStore(state => state.drawing);

  // Store current drag handlers for cleanup on unmount
  const currentDragHandlers = useRef<{
    moveHandler: ((e: PointerEvent) => void) | null;
    upHandler: (() => void) | null;
  }>({ moveHandler: null, upHandler: null });

  // Cleanup any lingering event listeners on unmount
  useEffect(() => {
    return () => {
      // Emergency cleanup on unmount - try to remove any potentially lingering handlers
      if (currentDragHandlers.current.moveHandler) {
        document.removeEventListener('pointermove', currentDragHandlers.current.moveHandler);
      }
      if (currentDragHandlers.current.upHandler) {
        document.removeEventListener('pointerup', currentDragHandlers.current.upHandler);
      }
    };
  }, []);

  // Convert screen coordinates to world coordinates
  const getWorldPosition = useMemo(() => (clientX: number, clientY: number): Point2D | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new Vector2();
    
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersection = new Vector3();
    const hasIntersection = raycaster.ray.intersectPlane(groundPlane.current, intersection);
    
    if (hasIntersection) {
      return { x: intersection.x, y: intersection.z };
    }
    
    return null;
  }, [camera, raycaster, gl.domElement]);

  // Filter shapes by layer visibility and sort by layer order
  const visibleShapes = useMemo(() => {
    const filteredShapes = shapes.filter(shape => {
      const layer = layers.find(l => l.id === shape.layerId);
      return layer?.visible !== false; // Show shape if layer is visible or not found
    });

    // Sort shapes by their layer order (layers array index determines render order)
    return filteredShapes.sort((shapeA, shapeB) => {
      const layerAIndex = layers.findIndex(l => l.id === shapeA.layerId);
      const layerBIndex = layers.findIndex(l => l.id === shapeB.layerId);
      
      // CORRECTED: Higher index in layer panel = rendered last (appears on top)
      // But we want top of panel = on top in scene, so we reverse the sort
      return layerBIndex - layerAIndex;
    });
  }, [shapes, layers]);

  // Convert 2D points to 3D vectors for Three.js with layer-based elevation
  const convertPointsWithElevation = useMemo(() => (points: Point2D[], layerId: string): Vector3[] => {
    // Calculate elevation offset based on layer order
    const layerIndex = layers.findIndex(l => l.id === layerId);
    // CORRECTED: Layer at top of panel (index 0) should have highest elevation (on top)
    // Layer at bottom of panel (highest index) should have lowest elevation (behind)
    const elevationOffset = layerIndex >= 0 ? (layers.length - 1 - layerIndex) * 0.001 : 0;
    const shapeElevation = elevation + elevationOffset;
    
    return points.map(point => new Vector3(point.x, shapeElevation, point.y));
  }, [elevation, layers]);

  // Event handlers for shape interaction
  const handleShapeClick = useMemo(() => (shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    event.stopPropagation();
    
    if (activeTool === 'select') {
      // If shape is already selected, toggle resize mode
      if (selectedShapeId === shapeId) {
        if (drawing.isResizeMode && drawing.resizingShapeId === shapeId) {
          exitResizeMode();
        } else {
          enterResizeMode(shapeId);
        }
      } else {
        // Select the shape and immediately enter resize mode
        selectShape(shapeId);
        // Use setTimeout to ensure the selection state is updated before entering resize mode
        setTimeout(() => {
          enterResizeMode(shapeId);
        }, 0);
      }
    }
  }, [activeTool, selectShape, selectedShapeId, drawing.isResizeMode, drawing.resizingShapeId, enterResizeMode, exitResizeMode]);

  const handleShapeDoubleClick = useMemo(() => (shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    event.stopPropagation();
    if (activeTool === 'select') {
      selectShape(selectedShapeId === shapeId ? null : shapeId);
    }
  }, [activeTool, selectShape, selectedShapeId]);

  const handleShapeHover = useMemo(() => (shapeId: string) => (event: any) => {
    event.stopPropagation();
    if (activeTool === 'select') {
      hoverShape(shapeId);
    }
  }, [activeTool, hoverShape]);

  const handleShapeLeave = useMemo(() => (event: any) => {
    event.stopPropagation();
    if (activeTool === 'select') {
      hoverShape(null);
    }
  }, [activeTool, hoverShape]);

  // Drag handlers
  const handlePointerDown = useMemo(() => (shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    if (activeTool !== 'select' || selectedShapeId !== shapeId) {
      return; // Only allow dragging selected shapes in select mode
    }
    
    // Don't start shape dragging if we're in resize mode - resize handles should take priority
    if (drawing.isResizeMode && drawing.resizingShapeId === shapeId) {
      return;
    }
    
    event.stopPropagation();
    
    const worldPos = getWorldPosition(event.clientX, event.clientY);
    if (worldPos) {
      startDragging(shapeId, worldPos);
      
      // Create new handlers
      const handleGlobalPointerMove = (e: PointerEvent) => {
        const newWorldPos = getWorldPosition(e.clientX, e.clientY);
        if (newWorldPos) {
          updateDragPosition(newWorldPos);
        }
      };
      
      const handleGlobalPointerUp = () => {
        finishDragging();
        
        // Remove the current handlers
        document.removeEventListener('pointermove', handleGlobalPointerMove);
        document.removeEventListener('pointerup', handleGlobalPointerUp);
        
        // Clear the tracked references
        currentDragHandlers.current.moveHandler = null;
        currentDragHandlers.current.upHandler = null;
      };
      
      // Store handler references for cleanup and add listeners
      currentDragHandlers.current.moveHandler = handleGlobalPointerMove;
      currentDragHandlers.current.upHandler = handleGlobalPointerUp;
      
      document.addEventListener('pointermove', handleGlobalPointerMove);
      document.addEventListener('pointerup', handleGlobalPointerUp);
    }
  }, [activeTool, selectedShapeId, getWorldPosition, startDragging, updateDragPosition, finishDragging]);



  // Render completed shapes
  const completedShapes = useMemo(() => {
    return visibleShapes.map((shape: Shape) => {
      if (!shape.points || shape.points.length < 2) return null;

      // Ensure rectangle points are in the correct format for rendering
      let renderPoints = shape.points;
      if (shape.type === 'rectangle') {
        if (shape.points.length === 2) {
          // Convert 2-point format to 4-point format for rendering
          const [topLeft, bottomRight] = shape.points;
          renderPoints = [
            { x: topLeft.x, y: topLeft.y },      // Top left
            { x: bottomRight.x, y: topLeft.y },  // Top right
            { x: bottomRight.x, y: bottomRight.y }, // Bottom right
            { x: topLeft.x, y: bottomRight.y }   // Bottom left
          ];
        } else if (shape.points.length >= 4) {
          // Use the first 4 points for rectangles with 4+ points
          renderPoints = shape.points.slice(0, 4);
        }
      }

      // Get layer info for elevation and opacity
      const layer = layers.find(l => l.id === shape.layerId);
      const layerOpacity = layer?.opacity ?? 1;
      const layerIndex = layers.findIndex(l => l.id === shape.layerId);
      // CORRECTED: Layer at top of panel (index 0) should have highest elevation (on top)
      const elevationOffset = layerIndex >= 0 ? (layers.length - 1 - layerIndex) * 0.001 : 0;
      const shapeElevation = elevation + elevationOffset;

      // Apply rotation transform if shape has rotation data
      const rotatedPoints = applyRotationTransform(renderPoints, shape.rotation);
      let points3D = convertPointsWithElevation(rotatedPoints, shape.layerId);
      const color = new Color(shape.color || '#3B82F6');

      // Close the shape for rectangles, polygons, circles, and polylines (lines with multiple points)
      const shouldCloseShape = 
        shape.type === 'rectangle' || 
        shape.type === 'polygon' || 
        shape.type === 'circle' ||
        (shape.type === 'line' && renderPoints.length > 2); // Only close multi-point lines (polylines)
        
      if (shouldCloseShape && points3D.length > 2) {
        // Only close if the shape isn't already closed
        const firstPoint = points3D[0];
        const lastPoint = points3D[points3D.length - 1];
        
        const distance = firstPoint.distanceTo(lastPoint);
        if (distance > 0.001) { // Only add closing point if not already closed
          // Create a new array instead of mutating the existing one
          points3D = [...points3D, points3D[0]]; 
        }
      }

      const isSelected = shape.id === selectedShapeId;
      const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
      const isDragging = dragState.isDragging && dragState.draggedShapeId === shape.id;

      return (
        <group key={shape.id}>
          {/* Shape fill - for all completed shapes */}
          {renderPoints.length >= 3 && (() => {
            // Create a single mesh with proper triangulation
            const vertices: number[] = [];
            const indices: number[] = [];
            
            // Add all vertices with proper elevation
            renderPoints.forEach(point => {
              vertices.push(point.x, shapeElevation + 0.002, point.y);
            });
            
            // Only create fill for closed shapes (not simple 2-point lines)
            if (shape.type === 'line' && renderPoints.length === 2) {
              // Don't create fill for simple 2-point lines
              return null;
            }
            
            // Simple ear clipping for quadrilaterals (works for both convex and concave)
            if (renderPoints.length === 4) {
              // For a quadrilateral, create two triangles
              // Triangle 1: vertices 0, 1, 2
              indices.push(0, 1, 2);
              // Triangle 2: vertices 0, 2, 3  
              indices.push(0, 2, 3);
            } else {
              // For other polygons, use fan triangulation from first vertex
              for (let i = 1; i < renderPoints.length - 1; i++) {
                indices.push(0, i, i + 1);
              }
            }
            
            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            
            return (
              <mesh 
                geometry={geometry}
                onClick={activeTool === 'select' ? handleShapeClick(shape.id) : undefined}
                onDoubleClick={activeTool === 'select' ? handleShapeDoubleClick(shape.id) : undefined}
                onPointerDown={activeTool === 'select' && isSelected && !(drawing.isResizeMode && drawing.resizingShapeId === shape.id) ? handlePointerDown(shape.id) : undefined}
                onPointerEnter={activeTool === 'select' ? handleShapeHover(shape.id) : undefined}
                onPointerLeave={activeTool === 'select' ? handleShapeLeave : undefined}
                cursor={activeTool === 'select' && isSelected && !(drawing.isResizeMode && drawing.resizingShapeId === shape.id) ? 'move' : activeTool === 'select' ? 'pointer' : 'default'}
              >
                <meshBasicMaterial
                  color={isDragging ? "#22C55E" : isSelected ? "#3B82F6" : isHovered ? "#60A5FA" : color}
                  transparent
                  opacity={isDragging ? 0.7 * layerOpacity : isSelected ? 0.5 * layerOpacity : isHovered ? 0.4 * layerOpacity : 0.3 * layerOpacity}
                  depthWrite={false}
                  side={2}
                />
              </mesh>
            );
          })()}
          
          {/* Shape outline - no event handlers to avoid conflicts with mesh */}
          <Line
            points={points3D}
            color={isDragging ? "#16A34A" : isSelected ? "#1D4ED8" : isHovered ? "#3B82F6" : color}
            lineWidth={isDragging ? 5 : isSelected ? 4 : isHovered ? 3 : 2}
            transparent
            opacity={shape.visible ? (isDragging ? 1 : isSelected ? 1 : isHovered ? 0.9 : 0.8) * layerOpacity : 0.3 * layerOpacity}
          />

          {/* Invisible interaction line for shapes without fill (like 2-point lines) */}
          {shape.type === 'line' && renderPoints.length === 2 && (
            <Line
              points={points3D}
              lineWidth={6} // Slightly wider hit area, not too wide to block other layers
              transparent
              opacity={0} // Completely invisible
              onClick={activeTool === 'select' ? handleShapeClick(shape.id) : undefined}
              onDoubleClick={activeTool === 'select' ? handleShapeDoubleClick(shape.id) : undefined}
              onPointerDown={activeTool === 'select' && isSelected ? handlePointerDown(shape.id) : undefined}
              onPointerEnter={activeTool === 'select' ? handleShapeHover(shape.id) : undefined}
              onPointerLeave={activeTool === 'select' ? handleShapeLeave : undefined}
            />
          )}
          
          {/* Dimensions - only show when enabled */}
          {shape.visible && showDimensions && (
            <ShapeDimensions
              shape={shape}
              elevation={elevation}
              isSelected={isSelected}
              isResizeMode={drawing.isResizeMode && drawing.resizingShapeId === shape.id}
            />
          )}
        </group>
      );
    }).filter(Boolean);
  }, [visibleShapes, elevation, selectedShapeId, convertPointsWithElevation, showDimensions, layers, activeTool, hoveredShapeId, dragState, drawing, handleShapeClick, handleShapeDoubleClick, handlePointerDown, handleShapeHover, handleShapeLeave]);

  // Render current shape being drawn
  const currentShapeRender = useMemo(() => {
    if (!isDrawing || !currentShape?.points || currentShape.points.length < 2) {
      return null;
    }

    // Use standard elevation for shapes being drawn (they're temporary)
    const points3D = currentShape.points.map(point => new Vector3(point.x, elevation, point.y));
    const color = new Color(currentShape.color || '#3B82F6');

    return (
      <Line
        points={points3D}
        color={color}
        lineWidth={3}
        transparent
        opacity={0.7}
        dashed
        dashSize={0.5}
        gapSize={0.3}
      />
    );
  }, [isDrawing, currentShape, elevation]);

  return (
    <group>
      {completedShapes}
      {currentShapeRender}
      {/* Edit controls overlay - shown when in edit mode */}
      <EditableShapeControls elevation={elevation} />
      {/* Resize controls overlay - shown when in resize mode */}
      <ResizableShapeControls elevation={elevation} />
      {/* Rotation controls overlay - shown for selected shapes */}
      <RotationControls elevation={elevation} />
    </group>
  );
};

export default ShapeRenderer;