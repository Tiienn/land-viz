import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3, Color, BufferGeometry, BufferAttribute, Vector2, Plane } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { GeometryCache } from '../../utils/GeometryCache';
import ShapeDimensions from './ShapeDimensions';
import EditableShapeControls from './EditableShapeControls';
import ResizableShapeControls from './ResizableShapeControls';
import RotationControls from './RotationControls';
import type { Shape, Point2D } from '@/types';

interface ShapeRendererProps {
  elevation?: number;
}

// Removed createFreshRectangleGeometry - now using consistent GeometryCache for all shapes

// Component to handle dynamic geometry updates properly
const MeshWithDynamicGeometry: React.FC<{
  shapeId: string;
  geometry: BufferGeometry;
  position: [number, number, number];
  onClick?: (event: any) => void;
  onDoubleClick?: (event: any) => void;
  onPointerDown?: (event: any) => void;
  onPointerEnter?: (event: any) => void;
  onPointerLeave?: (event: any) => void;
  cursor: string;
  material: any;
}> = ({ shapeId, geometry, position, onClick, onDoubleClick, onPointerDown, onPointerEnter, onPointerLeave, cursor, material }) => {
  const meshRef = useRef<any>();

  // Force geometry update when geometry prop changes
  useEffect(() => {
    if (meshRef.current && geometry) {
      console.log(`🔧 MeshWithDynamicGeometry: Updating geometry for shape ${shapeId}`, 'at', Date.now());
      document.title = `GEOMETRY UPDATED ${shapeId} ${Date.now()}`;
      // Dispose old geometry to prevent memory leaks
      if (meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }
      // Apply new geometry
      meshRef.current.geometry = geometry;
      // Force update of geometry attributes
      if (geometry.attributes.position) {
        geometry.attributes.position.needsUpdate = true;
      }
      if (geometry.index) {
        geometry.index.needsUpdate = true;
      }
      geometry.computeVertexNormals();
    }
  }, [geometry, shapeId]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      cursor={cursor}
    >
      <meshBasicMaterial
        color={material.fillColor}
        transparent
        opacity={Math.max(material.opacity, 0.1)} // Ensure minimum visibility
        depthWrite={false}
        side={2}
      />
    </mesh>
  );
};

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
  
  // Rotation mode actions
  const enterRotateMode = useAppStore(state => state.enterRotateMode);
  const exitRotateMode = useAppStore(state => state.exitRotateMode);
  
  const drawing = useAppStore(state => state.drawing);

  // Store current drag handlers for cleanup on unmount
  const currentDragHandlers = useRef<{
    moveHandler: ((e: PointerEvent) => void) | null;
    upHandler: (() => void) | null;
  }>({ moveHandler: null, upHandler: null });

  // Performance monitoring
  let frameCount = 0;
  let lastPerfCheck = 0;
  
  useFrame(() => {
    frameCount++;
    const now = performance.now();
    
    if (now - lastPerfCheck >= 2000) { // Check every 2 seconds
      const fps = (frameCount / 2);
      frameCount = 0;
      lastPerfCheck = now;
      
      // Adjust geometry cache size based on performance
      if (fps < 30) {
        GeometryCache.setMaxCacheSize(50); // Reduce cache size for low performance
      } else if (fps > 55) {
        GeometryCache.setMaxCacheSize(150); // Increase cache size for high performance
      }
    }
  });

  // Cleanup any lingering event listeners on unmount
  useEffect(() => {
    return () => {
      // Emergency cleanup on unmount
      if (currentDragHandlers.current.moveHandler) {
        document.removeEventListener('pointermove', currentDragHandlers.current.moveHandler);
      }
      if (currentDragHandlers.current.upHandler) {
        document.removeEventListener('pointerup', currentDragHandlers.current.upHandler);
      }
      
      // Cleanup geometry cache
      GeometryCache.dispose();
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

  // Optimized shape filtering with layer visibility cache
  const layerVisibilityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    layers.forEach(layer => {
      map.set(layer.id, layer.visible !== false);
    });
    return map;
  }, [layers]);

  // Filter shapes by layer visibility with cached lookups
  const visibleShapes = useMemo(() => {
    const filteredShapes = shapes.filter(shape => 
      layerVisibilityMap.get(shape.layerId) !== false
    );
    

    // Sort shapes by their layer order
    return filteredShapes.sort((shapeA, shapeB) => {
      const layerAIndex = layers.findIndex(l => l.id === shapeA.layerId);
      const layerBIndex = layers.findIndex(l => l.id === shapeB.layerId);
      return layerBIndex - layerAIndex;
    });
  }, [shapes, layerVisibilityMap, layers]);

  // Separate transform calculations
  const shapeTransforms = useMemo(() => {
    return visibleShapes.map(shape => {
      const isDragging = dragState.isDragging && dragState.draggedShapeId === shape.id;
      let transformedPoints = shape.points || [];
      
      // Handle dragging transform
      if (isDragging && dragState.startPosition && dragState.currentPosition) {
        const offsetX = dragState.currentPosition.x - dragState.startPosition.x;
        const offsetY = dragState.currentPosition.y - dragState.startPosition.y;
        
        const rotatedPoints = applyRotationTransform(transformedPoints, shape.rotation);
        transformedPoints = rotatedPoints.map(point => ({
          x: point.x + offsetX,
          y: point.y + offsetY
        }));
      } else {
        transformedPoints = applyRotationTransform(transformedPoints, shape.rotation);
      }
      
      return {
        id: shape.id,
        points: transformedPoints,
        isDragging
      };
    });
  }, [
    visibleShapes.map(s => s.id).join('|'),
    dragState.isDragging,
    dragState.draggedShapeId,
    dragState.startPosition?.x,
    dragState.startPosition?.y, 
    dragState.currentPosition?.x,
    dragState.currentPosition?.y,
    visibleShapes.map(s => s.rotation?.angle || 0).join('|')
  ]);

  // Separate shape data calculations
  // Add a force refresh trigger for geometry cache
  const forceRefresh = useAppStore(state => state.shapes.reduce((acc, s) => acc + (s.modified?.getTime?.() || 0), 0));
  
  const shapeGeometries = useMemo(() => {
    
    return visibleShapes.map((shape, index) => {
      // Get the transformed points for this shape (includes rotation and dragging)
      const transform = shapeTransforms.find(t => t.id === shape.id);
      const pointsForGeometry = transform ? transform.points : shape.points;
      
      // Use consistent geometry cache for all shapes (now with proper bounds)
      // CRITICAL FIX: For shapes being resized, bypass cache completely and create fresh geometry
      let geometry = null;
      if (pointsForGeometry && pointsForGeometry.length >= 2) {
        const isBeingResized = drawing.isResizeMode && drawing.resizingShapeId === shape.id;
        const isBeingEdited = drawing.isEditMode && drawing.editingShapeId === shape.id;
        
        if (isBeingResized || isBeingEdited) {
          // Force fresh geometry creation for shapes being resized/edited - completely bypass cache
          console.log('🔥 LIVE MODE:', isBeingResized ? 'RESIZE' : 'EDIT', '- Creating fresh geometry for', shape.id);
          document.title = `FRESH GEOMETRY ${shape.id} ${Date.now()}`;
          
          // Import GeometryCache here to access createGeometry method
          if (shape.type === 'rectangle') {
            geometry = new THREE.BufferGeometry();
            
            // Recreate rectangle geometry manually without cache
            let rectPoints = pointsForGeometry;
            if (pointsForGeometry.length === 2) {
              const [p1, p2] = pointsForGeometry;
              const minX = Math.min(p1.x, p2.x);
              const maxX = Math.max(p1.x, p2.x);
              const minY = Math.min(p1.y, p2.y);
              const maxY = Math.max(p1.y, p2.y);
              
              rectPoints = [
                { x: minX, y: minY }, // bottom-left
                { x: maxX, y: minY }, // bottom-right
                { x: maxX, y: maxY }, // top-right
                { x: minX, y: maxY }  // top-left
              ];
            }
            
            const vertices: number[] = [];
            rectPoints.slice(0, 4).forEach(point => {
              vertices.push(point.x, elevation, point.y);
            });
            
            const indices = [0, 1, 2, 0, 2, 3];
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
          } else {
            // For other shapes, still use cache but with fresh timestamp
            geometry = GeometryCache.getGeometry({
              ...shape, 
              points: pointsForGeometry,
              modified: new Date()  // Force fresh timestamp to bypass cache
            }, elevation);
          }
        } else {
          // Normal case - use cache with preserved timestamp
          geometry = GeometryCache.getGeometry({
            ...shape, 
            points: pointsForGeometry,
            modified: shape.modified  // Preserve original timestamp for cache logic
          }, elevation);
        }
      }
      
      return {
        id: shape.id,
        geometry
      };
    });
  }, [
    visibleShapes.map(s => `${s.id}_${s.type}_${JSON.stringify(s.points)}_${s.rotation?.angle || 0}_${s.modified?.getTime?.() || 0}`).join('|'), 
    shapeTransforms.map(t => `${t.id}_${JSON.stringify(t.points)}`).join('|'),
    elevation,
    forceRefresh,
    drawing.isEditMode,
    drawing.editingShapeId,
    drawing.isResizeMode,
    drawing.resizingShapeId
  ]);

  // Separate material calculations
  const shapeMaterials = useMemo(() => {
    return visibleShapes.map((shape, index) => {
      const isSelected = shape.id === selectedShapeId;
      const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
      const isDragging = shapeTransforms[index]?.isDragging;
      const layer = layers.find(l => l.id === shape.layerId);
      const layerOpacity = layer?.opacity ?? 1;
      
      return {
        id: shape.id,
        color: new Color(shape.color || '#3B82F6'),
        fillColor: isDragging ? "#16A34A" : isSelected ? "#1D4ED8" : isHovered ? "#3B82F6" : shape.color,
        lineColor: isDragging ? "#16A34A" : isSelected ? "#1D4ED8" : isHovered ? "#3B82F6" : shape.color,
        opacity: isDragging ? 0.8 * layerOpacity : isSelected ? 0.7 * layerOpacity : isHovered ? 0.6 * layerOpacity : 0.4 * layerOpacity,
        lineOpacity: shape.visible ? (isDragging ? 1 : isSelected ? 1 : isHovered ? 0.9 : 0.8) * layerOpacity : 0.3 * layerOpacity,
        lineWidth: isDragging ? 5 : isSelected ? 4 : isHovered ? 3 : 2
      };
    });
  }, [
    visibleShapes.map(s => `${s.id}_${s.color}_${s.visible}`).join('|'),
    selectedShapeId,
    hoveredShapeId,
    activeTool,
    layers.map(l => `${l.id}_${l.opacity}`).join('|'),
    shapeTransforms.map(t => t.isDragging).join('|')
  ]);

  // Pre-calculate layer elevations for performance
  const layerElevations = useMemo(() => {
    const elevations = new Map<string, number>();
    layers.forEach((layer, index) => {
      const elevationOffset = (layers.length - 1 - index) * 0.001;
      elevations.set(layer.id, elevation + elevationOffset);
    });
    return elevations;
  }, [elevation, layers]);

  // Optimized 3D point conversion
  const convertPointsWithElevation = useCallback((points: Point2D[], layerId: string): Vector3[] => {
    const shapeElevation = layerElevations.get(layerId) || elevation;
    return points.map(point => new Vector3(point.x, shapeElevation, point.y));
  }, [layerElevations, elevation]);

  // Event handlers for shape interaction - Use useCallback to prevent recreation
  const handleShapeClick = useCallback((shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    event.stopPropagation();
    
    if (activeTool === 'select') {
      if (selectedShapeId === shapeId) {
        // Shape already selected - enter resize mode for quick interaction
        if (!drawing.isEditMode && !drawing.isResizeMode) {
          enterResizeMode(shapeId);
        }
      } else {
        // Select the shape first
        selectShape(shapeId);
        // Enter resize mode after selection for immediate productivity
        setTimeout(() => {
          if (!drawing.isEditMode) {
            enterResizeMode(shapeId);
          }
        }, 0);
      }
    }
  }, [activeTool, selectShape, selectedShapeId, drawing.isEditMode, drawing.isResizeMode, enterResizeMode]);

  const handleShapeDoubleClick = useCallback((shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    event.stopPropagation();
    if (activeTool === 'select') {
      // Double click enters resize mode
      selectShape(shapeId);
      setTimeout(() => {
        enterResizeMode(shapeId);
      }, 0);
    }
  }, [activeTool, selectShape, enterResizeMode]);

  const handleShapeHover = useCallback((shapeId: string) => (event: any) => {
    event.stopPropagation();
    if (activeTool === 'select') {
      hoverShape(shapeId);
    }
  }, [activeTool, hoverShape]);

  const handleShapeLeave = useCallback((event: any) => {
    event.stopPropagation();
    if (activeTool === 'select') {
      hoverShape(null);
    }
  }, [activeTool, hoverShape]);

  // Drag handlers
  const handlePointerDown = useCallback((shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    if (activeTool !== 'select' || selectedShapeId !== shapeId) {
      return; // Only allow dragging selected shapes in select mode
    }
    
    // Allow shape dragging even in resize mode - resize handles will handle their own events
    // The shape mesh itself should be draggable while resize handles take priority when clicked directly
    
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
  }, [activeTool, selectedShapeId, getWorldPosition, startDragging, updateDragPosition, finishDragging, drawing.isResizeMode, drawing.resizingShapeId]);



  // Optimized render of completed shapes using pre-calculated data
  const completedShapes = useMemo(() => {
    return visibleShapes.map((shape: Shape, index) => {
      if (!shape.points || shape.points.length < 2) return null;

      const geometry = shapeGeometries[index]?.geometry;
      const transform = shapeTransforms[index];
      const material = shapeMaterials[index];
      
      if (!geometry || !transform || !material) return null;
      
      // Ensure we have a valid geometry - create a simple one if cache failed
      if (!geometry || geometry.attributes.position?.count === 0) {
        console.warn(`Invalid geometry for shape ${shape.id}, type: ${shape.type}`);
        return null;
      }

      // Ensure rectangle points are in the correct format for rendering
      let renderPoints = shape.points;
      if (shape.type === 'rectangle' && shape.points.length === 2) {
        const [topLeft, bottomRight] = shape.points;
        console.log('🔧 Converting 2-point rectangle:', { topLeft, bottomRight, shapeId: shape.id });
        renderPoints = [
          { x: topLeft.x, y: topLeft.y },
          { x: bottomRight.x, y: topLeft.y },
          { x: bottomRight.x, y: bottomRight.y },
          { x: topLeft.x, y: bottomRight.y }
        ];
        console.log('🔧 Converted to 4 corners:', JSON.stringify(renderPoints));
      }

      const transformedPoints = transform.points;
      let points3D = convertPointsWithElevation(transformedPoints, shape.layerId);

      // Close the shape for certain types
      const shouldCloseShape = 
        shape.type === 'rectangle' || 
        shape.type === 'polygon' || 
        shape.type === 'circle' ||
        (shape.type === 'line' && renderPoints.length > 2);
        
      if (shouldCloseShape && points3D.length > 2) {
        const firstPoint = points3D[0];
        const lastPoint = points3D[points3D.length - 1];
        
        if (firstPoint.distanceTo(lastPoint) > 0.001) {
          points3D = [...points3D, points3D[0]]; 
        }
      }

      const isSelected = shape.id === selectedShapeId;
      const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
      const shapeElevation = layerElevations.get(shape.layerId) || elevation;


      return (
        <group key={`${shape.id}_${shape.modified?.getTime?.() || 0}`}>
          {/* Optimized Shape fill using cached geometry - allow polylines with 3+ points to have fill */}
          {transformedPoints.length >= 3 && !(shape.type === 'line' && shape.points.length <= 2) && geometry && (
            <MeshWithDynamicGeometry
              key={`fill_${shape.id}_${shape.modified?.getTime?.() || 0}_${JSON.stringify(shape.points)}`}
              shapeId={shape.id}
              geometry={geometry}
              position={[0, shapeElevation + 0.001, 0]}
              onClick={activeTool === 'select' ? handleShapeClick(shape.id) : undefined}
              onDoubleClick={activeTool === 'select' ? handleShapeDoubleClick(shape.id) : undefined}
              onPointerDown={activeTool === 'select' && isSelected ? handlePointerDown(shape.id) : undefined}
              onPointerEnter={activeTool === 'select' ? handleShapeHover(shape.id) : undefined}
              onPointerLeave={activeTool === 'select' ? handleShapeLeave : undefined}
              cursor={activeTool === 'select' && isSelected ? 'move' : activeTool === 'select' ? 'pointer' : 'default'}
              material={{
                fillColor: material.fillColor,
                opacity: Math.max(material.opacity, 0.1)
              }}
            />
          )}
          
          {/* Shape outline */}
          <Line
            key={`outline_${shape.id}_${shape.modified?.getTime?.() || 0}`}
            points={points3D}
            color={material.lineColor}
            lineWidth={material.lineWidth}
            transparent
            opacity={material.lineOpacity}
          />

          {/* Invisible interaction line for 2-point lines */}
          {shape.type === 'line' && transformedPoints.length === 2 && (
            <Line
              points={points3D}
              lineWidth={6}
              transparent
              opacity={0}
              onClick={activeTool === 'select' ? handleShapeClick(shape.id) : undefined}
              onDoubleClick={activeTool === 'select' ? handleShapeDoubleClick(shape.id) : undefined}
              onPointerDown={activeTool === 'select' && isSelected ? handlePointerDown(shape.id) : undefined}
              onPointerEnter={activeTool === 'select' ? handleShapeHover(shape.id) : undefined}
              onPointerLeave={activeTool === 'select' ? handleShapeLeave : undefined}
            />
          )}
          
          {/* Dimensions */}
          {shape.visible && showDimensions && (
            <ShapeDimensions
              shape={{...shape, points: transformedPoints}}
              elevation={elevation}
              isSelected={isSelected}
              isResizeMode={drawing.isResizeMode && drawing.resizingShapeId === shape.id}
            />
          )}
        </group>
      );
    }).filter(Boolean);
  }, [
    visibleShapes,
    shapeGeometries,
    shapeTransforms, 
    shapeMaterials,
    selectedShapeId,
    hoveredShapeId,
    activeTool,
    showDimensions,
    layerElevations,
    elevation,
    drawing.isResizeMode,
    drawing.resizingShapeId,
    convertPointsWithElevation,
    handleShapeClick,
    handleShapeDoubleClick,
    handlePointerDown,
    handleShapeHover,
    handleShapeLeave
  ]);

  // Optimized current shape rendering 
  const currentShapeRender = useMemo(() => {
    if (!isDrawing || !currentShape?.points || currentShape.points.length < 2) {
      return null;
    }

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
  }, [isDrawing, currentShape?.points, currentShape?.color, elevation]);

  return (
    <group>
      {completedShapes}
      {currentShapeRender}
      <EditableShapeControls elevation={elevation} />
      <ResizableShapeControls elevation={elevation} />
      <RotationControls elevation={elevation} />
    </group>
  );
};

export default ShapeRenderer;