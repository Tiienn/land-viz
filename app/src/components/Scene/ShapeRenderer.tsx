import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3, Color, BufferGeometry, BufferAttribute, Vector2, Plane } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { GeometryCache } from '../../utils/GeometryCache';
import { logger } from '../../utils/logger';
import ShapeDimensions from './ShapeDimensions';
import EditableShapeControls from './EditableShapeControls';
// ResizableShapeControls moved to SceneManager.tsx to avoid duplicate instances
import RotationControls from './RotationControls';
import type { Shape, Point2D } from '@/types';

interface ShapeRendererProps {
  elevation?: number;
  hideDimensions?: boolean;
}

// Removed createFreshRectangleGeometry - now using consistent GeometryCache for all shapes

// Component to handle dynamic geometry updates with atomic synchronization
const MeshWithDynamicGeometry: React.FC<{
  shapeId: string;
  geometry: BufferGeometry;
  position: [number, number, number];
  onClick?: (event: any) => void;
  onDoubleClick?: (event: any) => void;
  onPointerDown?: (event: any) => void;
  onPointerEnter?: (event: any) => void;
  onPointerLeave?: (event: any) => void;
  onContextMenu?: (event: any) => void;
  cursor: string;
  material: any;
}> = ({ shapeId, geometry, position, onClick, onDoubleClick, onPointerDown, onPointerEnter, onPointerLeave, onContextMenu, cursor, material }) => {
  const meshRef = useRef<any>();
  const lastGeometryRef = useRef<BufferGeometry | null>(null);
  const materialRef = useRef<any>();

  // CRITICAL FIX: Atomic geometry update with proper validation
  useEffect(() => {
    if (!meshRef.current || !geometry) return;
    
    // Validate geometry before applying
    if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
      logger.warn(`Invalid geometry for shape ${shapeId}, skipping update`);
      return;
    }
    
    // ATOMIC UPDATE: Only update if geometry actually changed
    if (lastGeometryRef.current !== geometry) {
      logger.log(`🌍 Updating mesh geometry for shape ${shapeId}`);
      
      // Dispose old geometry to prevent memory leaks - but only if it's different
      if (meshRef.current.geometry && meshRef.current.geometry !== geometry) {
        const oldGeometry = meshRef.current.geometry;
        // Schedule disposal after render to avoid race conditions
        setTimeout(() => {
          if (oldGeometry && oldGeometry !== geometry) {
            oldGeometry.dispose();
          }
        }, 0);
      }
      
      // Apply new geometry atomically
      try {
        meshRef.current.geometry = geometry;
        
        // ENHANCED: Force attribute updates only if needed
        if (geometry.attributes.position) {
          geometry.attributes.position.needsUpdate = true;
        }
        if (geometry.index) {
          geometry.index.needsUpdate = true;
        }
        
        // Ensure bounds are computed for raycasting
        if (!geometry.boundingBox || !geometry.boundingSphere) {
          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();
        }
        
        // Update vertex normals for proper lighting
        geometry.computeVertexNormals();
        
        // Track this geometry as current
        lastGeometryRef.current = geometry;
        
        logger.log(`✅ Successfully updated geometry for shape ${shapeId}`);
      } catch (error) {
        logger.error(`❌ Failed to update geometry for shape ${shapeId}:`, error);
      }
    }
  }, [geometry, shapeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lastGeometryRef.current && meshRef.current?.geometry !== lastGeometryRef.current) {
        // Only dispose if it's not being used elsewhere
        lastGeometryRef.current.dispose();
      }
    };
  }, []);

  // Removed pulsing animation - was causing flickering by updating material every frame

  // Calculate renderOrder based on selection state to prevent z-fighting
  const renderOrder = material.isPrimarySelected ? 3 : material.isMultiSelected ? 2 : 1;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      renderOrder={renderOrder}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onContextMenu={onContextMenu}
      cursor={cursor}
    >
      <meshStandardMaterial
        ref={materialRef}
        color={material.baseColor} // Use original shape color
        emissive={material.emissiveColor} // Add glow for selection
        emissiveIntensity={material.emissiveIntensity}
        transparent={true}
        opacity={material.opacity}
        depthWrite={true}
        depthTest={true}
        side={THREE.DoubleSide}
        polygonOffset={true}
        polygonOffsetFactor={-renderOrder * 10} // Negative to pull towards camera, *10 for stronger effect
        polygonOffsetUnits={-1}
        roughness={0.8}
        metalness={0.2}
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

const ShapeRenderer: React.FC<ShapeRendererProps> = React.memo(({ elevation = 0.01, hideDimensions = false }) => {
  const { camera, gl, raycaster } = useThree();
  const groundPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));
  
  const shapes = useAppStore(state => state.shapes);
  const layers = useAppStore(state => state.layers);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const selectedShapeId = useAppStore(state => state.selectedShapeId);
  const selectedShapeIds = useAppStore(state => state.selectedShapeIds);
  const hoveredShapeId = useAppStore(state => state.hoveredShapeId);
  const highlightedShapeId = useAppStore(state => state.highlightedShapeId);
  const dragState = useAppStore(state => state.dragState);
  const showDimensions = useAppStore(state => state.drawing.showDimensions);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const renderTrigger = useAppStore(state => state.renderTrigger);
  const selectShape = useAppStore(state => state.selectShape);
  const selectMultipleShapes = useAppStore(state => state.selectMultipleShapes);
  const toggleShapeSelection = useAppStore(state => state.toggleShapeSelection);
  const hoverShape = useAppStore(state => state.hoverShape);
  const setHighlightedShapeId = useAppStore(state => state.setHighlightedShapeId);
  const setHoveredGroupId = useAppStore(state => state.setHoveredGroupId);
  const startDragging = useAppStore(state => state.startDragging);
  const updateDragPosition = useAppStore(state => state.updateDragPosition);
  const finishDragging = useAppStore(state => state.finishDragging);
  const cancelDragging = useAppStore(state => state.cancelDragging);
  
  // Shapes monitoring removed for production

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
    logger.log('🎨 ==> SHAPE TRANSFORMS CALCULATION <==');
    logger.log('🎨 Drawing state:', {
      isResizeMode: drawing.isResizeMode,
      resizingShapeId: drawing.resizingShapeId,
      liveResizePoints: drawing.liveResizePoints ? `${drawing.liveResizePoints.length} points` : 'null'
    });
    logger.log('🎨 Visible shapes count:', visibleShapes.length);
    
    const transforms = visibleShapes.map(shape => {
      // Canva-style grouping: Check if shape is being dragged (single shape OR part of group drag)
      const isDragging = dragState.isDragging && (
        dragState.draggedShapeId === shape.id || // Primary dragged shape
        dragState.originalShapesData?.has(shape.id) // Part of group being dragged
      );
      const isBeingResized = drawing.isResizeMode && drawing.resizingShapeId === shape.id;
      
      logger.log(`🎨 Processing shape ${shape.id}:`, {
        type: shape.type,
        originalPoints: shape.points?.length || 0,
        isDragging,
        isBeingResized
      });
      
      // Use liveResizePoints when available during resize operations
      let transformedPoints = shape.points || [];
      if (isBeingResized && drawing.liveResizePoints) {
        logger.log(`🎨 🔥 USING LIVE POINTS for ${shape.id}:`, {
          originalPoints: JSON.stringify(shape.points),
          livePoints: JSON.stringify(drawing.liveResizePoints)
        });
        transformedPoints = drawing.liveResizePoints;
      } else if (isBeingResized && !drawing.liveResizePoints) {
        logger.log(`🎨 ⚠️ Shape ${shape.id} is being resized but NO LIVE POINTS available`);
      } else if (!isBeingResized && drawing.liveResizePoints) {
        logger.log(`🎨 ⚠️ Live points exist but ${shape.id} is NOT being resized. Current resizingShapeId:`, drawing.resizingShapeId);
      }

      // CRITICAL FIX: Convert 2-point rectangles to 4-point BEFORE applying rotation
      // This ensures the rotation transform is applied to the complete rectangle, not just 2 corners
      if (shape.type === 'rectangle' && transformedPoints.length === 2) {
        const [topLeft, bottomRight] = transformedPoints;
        transformedPoints = [
          { x: topLeft.x, y: topLeft.y },           // Top left (0)
          { x: bottomRight.x, y: topLeft.y },       // Top right (1)
          { x: bottomRight.x, y: bottomRight.y },   // Bottom right (2)
          { x: topLeft.x, y: bottomRight.y }        // Bottom left (3)
        ];
      }

      // CRITICAL FIX: During live resize, recalculate rotation center based on new dimensions
      let effectiveRotation = shape.rotation;
      if (isBeingResized && drawing.liveResizePoints && shape.rotation && transformedPoints.length >= 2) {
        // Recalculate center from the resized points (in LOCAL space)
        if (shape.type === 'rectangle' && transformedPoints.length === 4) {
          const centerX = transformedPoints.reduce((sum, p) => sum + p.x, 0) / transformedPoints.length;
          const centerY = transformedPoints.reduce((sum, p) => sum + p.y, 0) / transformedPoints.length;
          effectiveRotation = {
            angle: shape.rotation.angle,
            center: { x: centerX, y: centerY }
          };
        }
      }

      // Handle dragging transform
      if (isDragging && dragState.startPosition && dragState.currentPosition) {
        const offsetX = dragState.currentPosition.x - dragState.startPosition.x;
        const offsetY = dragState.currentPosition.y - dragState.startPosition.y;

        const rotatedPoints = applyRotationTransform(transformedPoints, effectiveRotation);
        transformedPoints = rotatedPoints.map(point => ({
          x: point.x + offsetX,
          y: point.y + offsetY
        }));
      } else {
        transformedPoints = applyRotationTransform(transformedPoints, effectiveRotation);
      }
      
      logger.log(`🎨 Final points for ${shape.id}:`, {
        finalPointsCount: transformedPoints.length,
        firstPoint: transformedPoints[0],
        lastPoint: transformedPoints[transformedPoints.length - 1]
      });
      
      return {
        id: shape.id,
        points: transformedPoints,
        isDragging,
        isBeingResized
      };
    });
    
    logger.log('🎨 ==> SHAPE TRANSFORMS COMPLETE <==');
    logger.log('');
    
    return transforms;
  }, [
    visibleShapes.map(s => `${s.id}_${JSON.stringify(s.points)}`).join('|'),
    dragState.isDragging,
    dragState.draggedShapeId,
    dragState.startPosition?.x,
    dragState.startPosition?.y,
    dragState.currentPosition?.x,
    dragState.currentPosition?.y,
    Array.from(dragState.originalShapesData?.keys() || []).join('|'), // Group drag shape IDs
    visibleShapes.map(s => s.rotation?.angle || 0).join('|'),
    drawing.isResizeMode,
    drawing.resizingShapeId,
    drawing.liveResizePoints
  ]);

  // Helper function for fallback geometry creation (MUST BE BEFORE shapeGeometries)
  const createFallbackGeometry = useCallback((shape: Shape, elevation: number): BufferGeometry => {
    const geometry = new THREE.BufferGeometry();

    // Create minimal geometry based on shape type
    if (shape.type === 'rectangle') {
      const center = shape.points?.[0] || { x: 0, y: 0 };
      const size = 1;
      const vertices = new Float32Array([
        center.x - size, elevation, center.y - size,
        center.x + size, elevation, center.y - size,
        center.x + size, elevation, center.y + size,
        center.x - size, elevation, center.y + size
      ]);
      const indices = [0, 1, 2, 0, 2, 3];

      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
    } else {
      // For other shapes, create a simple triangle
      const center = shape.points?.[0] || { x: 0, y: 0 };
      const vertices = new Float32Array([
        center.x, elevation, center.y,
        center.x + 1, elevation, center.y,
        center.x + 0.5, elevation, center.y + 1
      ]);
      const indices = [0, 1, 2];

      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
    }

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  }, []);

  // Helper function for fresh rectangle geometry creation
  const createFreshRectangleGeometry = useCallback((points: Point2D[], elevation: number): BufferGeometry => {
    const geometry = new THREE.BufferGeometry();

    // Enhanced validation for input points
    if (!points || !Array.isArray(points) || points.length < 2) {
      logger.error('❌ Invalid points for fresh rectangle geometry:', points);
      return geometry; // Return empty geometry as fallback
    }

    // Validate point coordinates
    const validPoints = points.filter(point =>
      point &&
      typeof point.x === 'number' && typeof point.y === 'number' &&
      !isNaN(point.x) && !isNaN(point.y) &&
      isFinite(point.x) && isFinite(point.y)
    );

    if (validPoints.length < 2) {
      logger.error('❌ Insufficient valid points for rectangle geometry:', validPoints.length);
      return geometry;
    }

    // Convert to normalized 4-point format with enhanced validation
    let rectPoints = validPoints;
    if (validPoints.length === 2) {
      const [p1, p2] = validPoints;
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      // Prevent degenerate rectangles
      const deltaX = maxX - minX;
      const deltaY = maxY - minY;

      if (deltaX < 0.001 || deltaY < 0.001) {
        logger.warn('⚠️ Degenerate rectangle detected in fresh geometry:', { deltaX, deltaY });
        // Create minimal valid rectangle
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const size = 0.1;
        rectPoints = [
          { x: centerX - size, y: centerY - size },
          { x: centerX + size, y: centerY - size },
          { x: centerX + size, y: centerY + size },
          { x: centerX - size, y: centerY + size }
        ];
      } else {
        rectPoints = [
          { x: minX, y: minY }, // bottom-left
          { x: maxX, y: minY }, // bottom-right
          { x: maxX, y: maxY }, // top-right
          { x: minX, y: maxY }  // top-left
        ];
      }
    } else if (validPoints.length >= 4) {
      rectPoints = validPoints.slice(0, 4);
    }

    // Create vertices with validated points
    const vertices: number[] = [];
    rectPoints.forEach(point => {
      vertices.push(point.x, elevation, point.y);
    });

    // Ensure we have exactly 12 vertices (4 points * 3 components)
    if (vertices.length !== 12) {
      logger.error('❌ Invalid vertex count for rectangle:', vertices.length);
      return geometry;
    }

    // Create indices for triangulation with consistent winding
    const indices = [0, 1, 2, 0, 2, 3];

    // Apply attributes atomically with error handling
    try {
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      logger.log('✅ Fresh rectangle geometry created successfully');
    } catch (error) {
      logger.error('❌ Failed to create fresh rectangle geometry:', error);
      return new THREE.BufferGeometry(); // Return empty geometry on error
    }

    return geometry;
  }, []);

  // Separate shape data calculations
  // Add a force refresh trigger for geometry cache
  const forceRefresh = useAppStore(state => state.shapes.reduce((acc, s) => acc + (s.modified?.getTime?.() || 0), 0));
  
  const shapeGeometries = useMemo(() => {
    logger.log('🌍 ==> GEOMETRY CREATION START <==');
    logger.log('🌍 Visible shapes:', visibleShapes.length);
    logger.log('🌍 Drawing state:', {
      isResizeMode: drawing.isResizeMode,
      resizingShapeId: drawing.resizingShapeId,
      liveResizePoints: drawing.liveResizePoints ? drawing.liveResizePoints.length : 0
    });
    
    return visibleShapes.map((shape, index) => {
      // Get the transformed points for this shape (includes rotation and dragging)
      const transform = shapeTransforms.find(t => t.id === shape.id);
      const pointsForGeometry = transform ? transform.points : shape.points;

      // Check if shape is being resized
      const isBeingResized = drawing.isResizeMode && drawing.resizingShapeId === shape.id;
      const hasLiveResizePoints = drawing.liveResizePoints && drawing.liveResizePoints.length >= 2;

      // CRITICAL FIX: Enhanced geometry creation with validation
      let geometry = null;
      if (pointsForGeometry && pointsForGeometry.length >= 2) {
        const isBeingEdited = drawing.isEditMode && drawing.editingShapeId === shape.id;
        // Use fresh geometry when actually have live resize points or in edit mode
        const needsFreshGeometry = (isBeingResized && hasLiveResizePoints) || isBeingEdited;

        logger.log(`🌍 Shape ${shape.id} status:`, {
          isBeingResized,
          hasLiveResizePoints,
          isBeingEdited,
          needsFreshGeometry,
          pointsLength: pointsForGeometry.length
        });

        if (needsFreshGeometry) {
          // ENHANCED: Use specialized live resize geometry for better rendering
          logger.log('🔥 LIVE MODE:', hasLiveResizePoints ? 'RESIZE' : 'EDIT', '- Creating geometry for', shape.id);

          try {
            // CRITICAL FIX: Always use pointsForGeometry which already has rotation applied
            // Do NOT use drawing.liveResizePoints directly as those are in LOCAL space
            if (shape.type === 'rectangle') {
              logger.log('🎯 Creating fresh geometry for', shape.id, 'with', pointsForGeometry.length, 'transformed points');
              geometry = createFreshRectangleGeometry(pointsForGeometry, elevation);
            } else {
              // For other shapes, use cache but force fresh creation
              geometry = GeometryCache.getGeometry({
                ...shape,
                points: pointsForGeometry,
                modified: new Date()  // Force fresh timestamp
              }, elevation);
            }

            logger.log(`✅ Fresh geometry created for ${shape.id} (${geometry.attributes.position?.count || 0} vertices)`);
          } catch (error) {
            logger.error(`❌ Failed to create fresh geometry for ${shape.id}:`, error);
            // Fallback to cached geometry
            geometry = GeometryCache.getGeometry({
              ...shape,
              points: shape.points, // Use original points as fallback
              modified: shape.modified
            }, elevation);
          }
        } else {
          // CACHED GEOMETRY: Normal case - use cache with preserved timestamp

          // CRITICAL FIX: Ensure rectangles are in 4-point format for cache
          // Let GeometryCache handle 2-point to 4-point conversion consistently
          geometry = GeometryCache.getGeometry({
            ...shape,
            points: pointsForGeometry,
            modified: shape.modified  // Preserve original timestamp for cache logic
          }, elevation);
        }
      }

      // VALIDATION: Ensure geometry is valid before returning
      if (geometry && (!geometry.attributes.position || geometry.attributes.position.count === 0)) {
        logger.warn(`⚠️ Invalid geometry detected for ${shape.id}, creating fallback`);
        geometry = createFallbackGeometry(shape, elevation);
      }

      const isValid = !!geometry && geometry.attributes.position && geometry.attributes.position.count > 0;

      return {
        id: shape.id,
        geometry,
        valid: isValid
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
    drawing.resizingShapeId,
    drawing.liveResizePoints, // Add this to dependencies for proper updates
    renderTrigger // Force re-render when explicitly triggered
  ]);

  // Separate material calculations using emissive glow instead of color changes
  const shapeMaterials = useMemo(() => {

    const materials = visibleShapes.map((shape, index) => {
      const isPrimarySelected = shape.id === selectedShapeId;
      const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
      const isSelected = isPrimarySelected || isMultiSelected;
      const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
      const isHighlighted = shape.id === highlightedShapeId;
      const isDragging = shapeTransforms[index]?.isDragging;
      const layer = layers.find(l => l.id === shape.layerId);
      const layerOpacity = layer?.opacity ?? 1;

      // Keep original shape color, use emissive glow for selection states
      const baseColor = shape.color || '#3B82F6';
      let emissiveColor, emissiveIntensity, lineColor, opacity, lineOpacity, lineWidth;

      if (isDragging) {
        emissiveColor = "#16A34A"; // Green glow
        emissiveIntensity = 0.5;
        lineColor = "#16A34A";
        opacity = 0.6 * layerOpacity;
        lineOpacity = 1 * layerOpacity;
        lineWidth = 5;
      } else if (isHighlighted) {
        emissiveColor = "#9333EA"; // Purple glow
        emissiveIntensity = 0.6;
        lineColor = "#9333EA";
        opacity = 0.6 * layerOpacity;
        lineOpacity = 1 * layerOpacity;
        lineWidth = 5;
      } else if (isPrimarySelected) {
        emissiveColor = "#1D4ED8"; // Blue glow
        emissiveIntensity = 0.4;
        lineColor = "#1D4ED8";
        opacity = 0.6 * layerOpacity;
        lineOpacity = 1 * layerOpacity;
        lineWidth = 4;
      } else if (isMultiSelected) {
        emissiveColor = "#7C3AED"; // Violet glow
        emissiveIntensity = 0.3;
        lineColor = "#7C3AED";
        opacity = 0.6 * layerOpacity;
        lineOpacity = 0.95 * layerOpacity;
        lineWidth = 3;
      } else if (isHovered) {
        emissiveColor = "#3B82F6"; // Light blue glow
        emissiveIntensity = 0.2;
        lineColor = "#3B82F6";
        opacity = 0.5 * layerOpacity;
        lineOpacity = 0.9 * layerOpacity;
        lineWidth = 3;
      } else {
        emissiveColor = "#000000"; // No glow
        emissiveIntensity = 0;
        lineColor = baseColor;
        opacity = 0.4 * layerOpacity;
        lineOpacity = shape.visible ? 0.8 * layerOpacity : 0.3 * layerOpacity;
        lineWidth = 2;
      }

      return {
        id: shape.id,
        baseColor, // Original shape color
        emissiveColor, // Glow color for selection
        emissiveIntensity, // Glow strength
        lineColor,
        opacity,
        lineOpacity,
        lineWidth,
        isPrimarySelected,
        isMultiSelected
      };
    });

    return materials;
  }, [
    visibleShapes.map(s => `${s.id}_${s.color}_${s.visible}`).join('|'),
    selectedShapeId,
    selectedShapeIds?.join(',') || '',
    hoveredShapeId,
    highlightedShapeId,
    activeTool,
    layers.map(l => `${l.id}_${l.opacity}`).join('|'),
    shapeTransforms.map(t => t.isDragging).join('|')
  ]);

  // Pre-calculate layer elevations for performance
  // Use larger layer separation (0.05 per layer) to prevent z-fighting
  // IMPORTANT: Layer Panel displays layers in REVERSED order (last item at top)
  // So we use index directly: higher index = top of panel = higher elevation
  const layerElevations = useMemo(() => {
    const elevations = new Map<string, number>();
    layers.forEach((layer, index) => {
      const elevationOffset = index * 0.05; // Higher index = higher elevation = top of panel
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
      // Get the clicked shape to check for groupId
      const clickedShape = shapes.find(s => s.id === shapeId);

      // Check if Shift key is pressed for multi-selection
      if (event.shiftKey) {
        // Multi-selection mode: toggle shape selection
        toggleShapeSelection(shapeId);
      } else {
        // Check if shape is part of a group (Canva-style grouping)
        if (clickedShape?.groupId) {
          // Find all shapes in this group
          const groupMembers = shapes.filter(s => s.groupId === clickedShape.groupId);
          const groupMemberIds = groupMembers.map(s => s.id);

          // CRITICAL FIX: Set both selectedShapeIds (for group operations) AND selectedShapeId (for rotation/drag handles)
          // Don't use selectShape() as it overwrites selectedShapeIds with only 1 shape!
          useAppStore.setState({
            selectedShapeIds: groupMemberIds,
            selectedShapeId: shapeId, // Primary shape for rotation/drag handles
          });

          // Highlight the clicked shape within the group
          setHighlightedShapeId(shapeId);

          logger.info(`Selected group: ${clickedShape.groupId} (${groupMemberIds.length} shapes)`);
        } else {
          // Non-grouped shape - use existing single selection logic
          // Clear highlighted shape since this is not a group selection
          setHighlightedShapeId(null);

          // ISSUE 1 FIX: Check if clicking on an already-selected shape in multi-selection
          const currentSelectedIds = selectedShapeIds || [];
          const isAlreadySelected = currentSelectedIds.includes(shapeId);
          const isMultiSelection = currentSelectedIds.length > 1;

          if (isAlreadySelected && isMultiSelection) {
            // Preserve multi-selection, just change the primary shape
            useAppStore.setState({
              selectedShapeId: shapeId, // Make this the primary selection
              // Keep selectedShapeIds unchanged to preserve multi-selection
            });
          } else if (selectedShapeId === shapeId) {
            // Shape already selected - enter resize mode for quick interaction
            // CRITICAL: Only enter resize mode for single-shape selection
            const currentSelectedIds = useAppStore.getState().selectedShapeIds;
            const isSingleSelection = !currentSelectedIds || currentSelectedIds.length <= 1;
            if (!drawing.isEditMode && !drawing.isResizeMode && isSingleSelection) {
              enterResizeMode(shapeId);
            }
          } else {
            // Select the shape first
            selectShape(shapeId);
          // Enter resize mode after selection for immediate productivity - force resize mode for all shapes
          setTimeout(() => {
            const currentDrawing = useAppStore.getState().drawing;
            const currentSelectedIds = useAppStore.getState().selectedShapeIds;
            const isSingleSelection = !currentSelectedIds || currentSelectedIds.length <= 1;
            // CRITICAL: Only enter resize mode if not transitioning to rotation mode AND single-shape selection
            if (!currentDrawing.isEditMode &&
                !currentDrawing.isRotateMode &&
                !currentDrawing.isResizeMode &&
                currentDrawing.activeTool === 'select' &&
                isSingleSelection) {
              enterResizeMode(shapeId);
            }
          }, 50); // Longer timeout to ensure state updates properly
          }
        }
      }
    }
  }, [activeTool, selectShape, selectMultipleShapes, setHighlightedShapeId, selectedShapeId, drawing.isEditMode, drawing.isResizeMode, drawing.isRotateMode, enterResizeMode, shapes, toggleShapeSelection]);

  const handleShapeDoubleClick = useCallback((shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    event.stopPropagation();
    if (activeTool === 'select') {
      // Double click enters resize mode (only for single-shape selection)
      selectShape(shapeId);
      setTimeout(() => {
        const currentSelectedIds = useAppStore.getState().selectedShapeIds;
        const isSingleSelection = !currentSelectedIds || currentSelectedIds.length <= 1;
        if (isSingleSelection) {
          enterResizeMode(shapeId);
        }
      }, 0);
    }
  }, [activeTool, selectShape, enterResizeMode]);

  const handleShapeHover = useCallback((shapeId: string) => (event: any) => {
    event.stopPropagation();
    if (activeTool === 'select') {
      hoverShape(shapeId);

      // Canva-style grouping: Set hoveredGroupId when hovering over grouped shape
      const hoveredShape = shapes.find(s => s.id === shapeId);
      if (hoveredShape?.groupId) {
        setHoveredGroupId(hoveredShape.groupId);
      } else {
        setHoveredGroupId(null);
      }
    }
  }, [activeTool, hoverShape, setHoveredGroupId, shapes]);

  const handleShapeLeave = useCallback((event: any) => {
    event.stopPropagation();
    if (activeTool === 'select') {
      hoverShape(null);

      // Canva-style grouping: Clear hoveredGroupId when mouse leaves
      // (unless the group is selected - boundary will still show)
      setHoveredGroupId(null);
    }
  }, [activeTool, hoverShape, setHoveredGroupId]);

  // Context menu handler
  const handleShapeContextMenu = useCallback((shapeId: string) => (event: any) => {
    // Stop both Three.js event and native DOM event propagation
    event.stopPropagation();
    if (event.nativeEvent) {
      event.nativeEvent.preventDefault();
      event.nativeEvent.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
    }

    const { selectedShapeIds, openContextMenu } = useAppStore.getState();

    // Determine menu type based on selection
    const menuType =
      selectedShapeIds.length > 1 && selectedShapeIds.includes(shapeId)
        ? 'multi-selection'
        : 'shape';

    openContextMenu(menuType, {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    }, shapeId);
  }, []);

  // Drag handlers
  const handlePointerDown = useCallback((shapeId: string) => (event: any) => {
    // Only respond to left mouse button (button 0)
    if (event.button !== 0) {
      return; // Allow right-click and middle-click to pass through for camera controls
    }

    // ISSUE 2 FIX: Allow dragging if shape is the primary selection OR part of multi-selection
    const selectedIds = useAppStore.getState().selectedShapeIds || [];
    const isSelectedShape = selectedShapeId === shapeId || selectedIds.includes(shapeId);

    if (activeTool !== 'select' || !isSelectedShape) {
      return; // Only allow dragging selected shapes in select mode
    }

    // CRITICAL: Prevent shape dragging if shape is locked
    const shape = shapes.find(s => s.id === shapeId);
    if (shape?.locked) {
      return; // Don't allow movement of locked shapes
    }

    // CRITICAL: Prevent shape dragging during rotation mode
    if (drawing.isRotateMode) {
      return; // Don't allow shape movement when rotation handle is being used
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
  }, [activeTool, selectedShapeId, getWorldPosition, startDragging, updateDragPosition, finishDragging, drawing.isResizeMode, drawing.resizingShapeId, drawing.isRotateMode]);



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
        logger.warn(`Invalid geometry for shape ${shape.id}, type: ${shape.type}`);
        return null;
      }

      // Get transformed points - already converted to 4-point format in transform calculation
      let transformedPoints = transform.points;

      // CRITICAL FIX: Convert 2-point circles to perimeter points for proper outline rendering
      if (shape.type === 'circle' && transformedPoints.length === 2) {
        const center = transformedPoints[0];
        const edgePoint = transformedPoints[1];
        const radius = Math.sqrt(
          Math.pow(edgePoint.x - center.x, 2) + Math.pow(edgePoint.y - center.y, 2)
        );

        // Generate circle perimeter points for outline
        const circlePoints: Point2D[] = [];
        const segments = Math.max(32, Math.min(64, Math.floor(radius * 4))); // Adaptive segments

        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          circlePoints.push({
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
          });
        }

        transformedPoints = circlePoints;
        logger.log(`🔧 Converted 2-point circle to ${segments} perimeter points for outline rendering:`, {
          shapeId: shape.id,
          radius,
          segments
        });
      }

      // MULTI-SELECTION FIX: Check if shape is primary OR in multi-selection array
      const isPrimarySelected = shape.id === selectedShapeId;
      const isMultiSelected = selectedShapeIds && selectedShapeIds.includes(shape.id) && !isPrimarySelected;
      const isSelected = isPrimarySelected || isMultiSelected;
      const isHovered = shape.id === hoveredShapeId && activeTool === 'select';
      const isHighlighted = shape.id === highlightedShapeId; // Canva-style grouping: highlighted shape
      const shapeElevation = layerElevations.get(shape.layerId) || elevation;

      // CRITICAL: Use LARGE elevation offsets to prevent z-fighting at oblique angles
      // Depth buffer precision requires 0.10+ unit separation for reliable rendering
      // Previous values (0.01-0.05) were within floating-point precision limits
      const elevationOffset = isHighlighted ? 0.30 : (isSelected || isHovered) ? 0.20 : 0.10;

      // Create points at the elevated position to match the mesh elevation
      let points3D = transformedPoints.map(point => new Vector3(
        point.x,
        shapeElevation + elevationOffset,  // Use elevated position for outlines too
        point.y
      ));

      // Close the shape for certain types
      const shouldCloseShape =
        shape.type === 'rectangle' ||
        shape.type === 'polygon' ||
        shape.type === 'circle' ||
        (shape.type === 'polyline' && transformedPoints.length > 2);

      if (shouldCloseShape && points3D.length > 2) {
        const firstPoint = points3D[0];
        const lastPoint = points3D[points3D.length - 1];

        if (firstPoint.distanceTo(lastPoint) > 0.001) {
          points3D = [...points3D, points3D[0]];
        }
      }


      return (
        <group key={`${shape.id}_${shape.modified?.getTime?.() || 0}`}>
          {/* Optimized Shape fill using cached geometry - allow circles and polylines with 3+ points to have fill */}
          {(transformedPoints.length >= 3 || shape.type === 'circle') && !(shape.type === 'polyline' && shape.points.length <= 2) && geometry && (
            <MeshWithDynamicGeometry
              key={`fill_${shape.id}_${shape.modified?.getTime?.() || 0}_${JSON.stringify(shape.points)}`}
              shapeId={shape.id}
              geometry={geometry}
              position={[0, shapeElevation + elevationOffset, 0]}
              onClick={activeTool === 'select' ? (event: any) => {
                logger.log('🚀 MESH CLICKED DIRECTLY!', shape.id, 'activeTool:', activeTool);
                return handleShapeClick(shape.id)(event);
              } : undefined}
              onDoubleClick={activeTool === 'select' ? handleShapeDoubleClick(shape.id) : undefined}
              onPointerDown={activeTool === 'select' && isSelected ? handlePointerDown(shape.id) : undefined}
              onPointerEnter={activeTool === 'select' ? handleShapeHover(shape.id) : undefined}
              onPointerLeave={activeTool === 'select' ? handleShapeLeave : undefined}
              onContextMenu={handleShapeContextMenu(shape.id)}
              cursor={
                activeTool === 'select' && isSelected
                  ? (shape.locked ? 'not-allowed' : 'move')
                  : activeTool === 'select'
                    ? 'pointer'
                    : 'default'
              }
              material={{
                baseColor: material.baseColor,
                emissiveColor: material.emissiveColor,
                emissiveIntensity: material.emissiveIntensity,
                opacity: material.opacity,
                isMultiSelected: material.isMultiSelected,
                isPrimarySelected: material.isPrimarySelected
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
          {shape.type === 'polyline' && transformedPoints.length === 2 && (
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
          
          {/* Dimensions - ALWAYS use original points, not transformed/rotated points */}
          {shape.visible && showDimensions && !hideDimensions && (
            <ShapeDimensions
              key={`${shape.id}-${JSON.stringify(shape.points)}-${shape.modified?.getTime() || 0}-${renderTrigger}`}
              shape={shape}
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
    hideDimensions,
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
      {/* ResizableShapeControls moved to SceneManager.tsx to avoid duplicate instances */}
      <RotationControls elevation={elevation} />
    </group>
  );
});

ShapeRenderer.displayName = 'ShapeRenderer';

export default ShapeRenderer;