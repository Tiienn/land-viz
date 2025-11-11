import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import type { SnapPoint, Point2D } from '../../types';
import { validateSnapPointProximity } from '../../utils/snapUtils';

/**
 * Indicator sizes for different view modes
 *
 * ENLARGED FOR BETTER VISIBILITY - Made 5x bigger
 * 2D mode uses larger grid indicators (10x) because camera is
 * farther away in top-down view. Other indicators (endpoint,
 * midpoint, center) use absolute world sizes (0.2m, 0.5m)
 * and don't need mode-specific adjustment.
 *
 * Values:
 * - GRID_3D: 0.3m (30cm) - 5x larger for visibility
 * - GRID_2D: 0.1m (10cm) - 5x larger for visibility
 */
const INDICATOR_SIZES = {
  GRID_3D: 0.3,
  GRID_2D: 0.1
} as const;

interface SnapIndicatorProps {
  maxDistance?: number;
}

export const SnapIndicator: React.FC<SnapIndicatorProps> = ({
  maxDistance = 100
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // PERFORMANCE OPTIMIZATION: Select individual values to avoid object creation
  // This prevents the "getSnapshot should be cached" warning and infinite loops
  const snapping = useAppStore(state => state.drawing.snapping);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const cursorPosition = useAppStore(state => state.drawing.cursorPosition);
  const shapes = useAppStore(state => state.shapes);
  const dragState = useAppStore(state => state.dragState);
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);

  const isDragging = dragState.isDragging;

  // Get resize state - MUST be before useMemo to avoid initialization errors
  const liveResizePoints = useAppStore(state => state.drawing.liveResizePoints);
  const isActivelyResizing = liveResizePoints !== null;
  const selectedShapeIds = useAppStore(state => state.selectedShapeIds);

  // Debug logging removed for performance

  // Performance optimization: limit visible indicators with render-time proximity filtering
  // CRITICAL: For selected shapes, show ALL indicators - no limit
  // For other cases (drawing, dragging), limit to 25 for performance
  const isShowingSelectedShape = selectedShapeIds && selectedShapeIds.length > 0;
  const maxVisibleIndicators = isShowingSelectedShape ? Infinity : 25;

  const limitedSnapPoints = useMemo(() => {
    // FIX: During resize, drag, or drawing - use cursor position as reference
    // Cursor position is updated to handle position during resize operations
    let referencePosition = cursorPosition;

    if (isDragging && !isActivelyResizing && dragState.draggedShapeId) {
      const draggedShape = shapes.find(s => s.id === dragState.draggedShapeId);

      if (draggedShape && dragState.currentPosition && dragState.startPosition && dragState.originalShapePoints) {
        // Calculate dragged shape's current center
        const offsetX = dragState.currentPosition.x - dragState.startPosition.x;
        const offsetY = dragState.currentPosition.y - dragState.startPosition.y;

        const currentPoints = dragState.originalShapePoints.map(p => ({
          x: p.x + offsetX,
          y: p.y + offsetY
        }));

        // Calculate center
        const sumX = currentPoints.reduce((sum, p) => sum + p.x, 0);
        const sumY = currentPoints.reduce((sum, p) => sum + p.y, 0);
        referencePosition = {
          x: sumX / currentPoints.length,
          y: sumY / currentPoints.length
        };
      }
    }

    // CRITICAL FIX: For selected shapes, show ALL snap points without distance filtering
    // For other cases (drawing, dragging), use very large radius for performance
    // This ensures all corners are always visible for rectangles, triangles, etc.
    // Note: isShowingSelectedShape is already calculated above

    // If showing selected shape, don't filter by distance - show all snap points
    // No reference position needed when showing all points for selected shapes
    // Otherwise use very large radius (10000 units = 10km) to handle any reasonable shape size
    // This fixes the issue where large rectangles/triangles lose corner indicators when zoomed out
    const proximityFilteredPoints = isShowingSelectedShape
      ? (snapping?.availableSnapPoints || [])
      : !referencePosition
        ? [] // No reference position and not showing selected shape = no indicators
        : (snapping?.availableSnapPoints || []).filter(point =>
            validateSnapPointProximity(point, referencePosition, 10000)
          );

    return proximityFilteredPoints.slice(0, maxVisibleIndicators);
  }, [snapping?.availableSnapPoints, snapping?.config?.snapRadius, cursorPosition, isDragging, dragState, shapes, is2DMode, maxVisibleIndicators, isActivelyResizing, selectedShapeIds, isShowingSelectedShape]);
  
  // Create fresh geometries each time to ensure proper size updates
  const getGeometries = () => {
    // Dynamic grid size based on view mode
    const gridSize = is2DMode ? INDICATOR_SIZES.GRID_2D : INDICATOR_SIZES.GRID_3D;
    // Grid size optimization for view mode

    return {
      grid: new THREE.PlaneGeometry(gridSize * 8, gridSize * 8), // 8x larger for visibility
      endpoint: new THREE.CircleGeometry(4.0, 24), // 4x larger blue circles at corners - VERY VISIBLE
      midpoint: new THREE.RingGeometry(2.8, 4.4, 4, 1, Math.PI / 4), // 4x larger orange squares at edges - VERY VISIBLE
      center: (() => {
        const geometry = new THREE.BufferGeometry();
        const centerSize = is2DMode ? 1.5 : 4.8; // 4x larger green crosshairs - VERY VISIBLE
        const vertices = new Float32Array([
          -centerSize, 0, 0,  centerSize, 0, 0,  // Horizontal line
          0, -centerSize, 0,  0, centerSize, 0   // Vertical line
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        return geometry;
      })(),
      quadrant: new THREE.CircleGeometry(4.0, 16), // 4x larger
      intersection: new THREE.RingGeometry(2.0, 3.6, 12), // 4x larger
      perpendicular: new THREE.PlaneGeometry(5.6, 1.0), // 4x larger - VERY VISIBLE
      extension: new THREE.PlaneGeometry(6.4, 0.8), // 4x larger - VERY VISIBLE
      tangent: new THREE.CircleGeometry(3.2, 12), // 4x larger - VERY VISIBLE
      edge: new THREE.PlaneGeometry(4.0, 0.8) // 4x larger - VERY VISIBLE
    };
  };

  // Materials for different snap types
  // CONSISTENCY FIX: All indicators use same opacity for uniform visibility
  const UNIFORM_OPACITY = 0.6;

  const materials = useMemo(() => ({
    grid: new THREE.MeshBasicMaterial({
      color: '#9CA3AF',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    }),
    endpoint: new THREE.MeshBasicMaterial({
      color: '#3B82F6',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    }),
    midpoint: new THREE.MeshBasicMaterial({
      color: '#F59E0B',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    }),
    center: new THREE.LineBasicMaterial({
      color: '#22C55E',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      linewidth: 3,
      depthTest: false,
      depthWrite: false
    }),
    quadrant: new THREE.MeshBasicMaterial({
      color: '#8B5CF6',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    }),
    intersection: new THREE.MeshBasicMaterial({
      color: '#EF4444',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    }),
    perpendicular: new THREE.MeshBasicMaterial({
      color: '#06B6D4',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    }),
    extension: new THREE.MeshBasicMaterial({
      color: '#84CC16',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    }),
    tangent: new THREE.MeshBasicMaterial({
      color: '#F97316',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    }),
    edge: new THREE.MeshBasicMaterial({
      color: '#6366F1',
      transparent: true,
      opacity: UNIFORM_OPACITY,
      depthTest: false,
      depthWrite: false
    })
  }), []);

  // Create mesh instances based on snap points
  const snapMeshes = useMemo(() => {
    if (!snapping.config.enabled || !limitedSnapPoints.length) return [];

    const geometries = getGeometries(); // Get fresh geometries
    const meshes: THREE.Object3D[] = [];

    limitedSnapPoints.forEach((snapPoint) => {
      // SKIP grid snap indicators - they interfere with shape snapping
      if (snapPoint.type === 'grid') {
        return;
      }

      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      switch (snapPoint.type) {
        case 'grid':
          // This case is now unreachable due to the filter above
          geometry = geometries.grid;
          material = materials.grid;
          break;
        case 'endpoint':
          geometry = geometries.endpoint;
          material = materials.endpoint;
          break;
        case 'midpoint':
          geometry = geometries.midpoint;
          material = materials.midpoint;
          break;
        case 'center':
          geometry = geometries.center;
          material = materials.center;
          break;
        case 'quadrant':
          geometry = geometries.quadrant;
          material = materials.quadrant;
          break;
        case 'intersection':
          geometry = geometries.intersection;
          material = materials.intersection;
          break;
        case 'perpendicular':
          geometry = geometries.perpendicular;
          material = materials.perpendicular;
          break;
        case 'extension':
          geometry = geometries.extension;
          material = materials.extension;
          break;
        case 'tangent':
          geometry = geometries.tangent;
          material = materials.tangent;
          break;
        case 'edge':
          geometry = geometries.edge;
          material = materials.edge;
          break;
        default:
          return;
      }

      const mesh = snapPoint.type === 'center'
        ? new THREE.Line(geometry, material)
        : new THREE.Mesh(geometry, material);

      mesh.position.set(snapPoint.position.x, 0.15, snapPoint.position.y);
      mesh.rotation.x = -Math.PI / 2; // Lay flat on ground
      if (snapPoint.type === 'grid') {
        mesh.rotation.z = Math.PI / 4; // Rotate grid indicators 45° to make diamond
      }
      mesh.renderOrder = 999; // Render on top of everything

      meshes.push(mesh);
    });

    return meshes;
  }, [limitedSnapPoints, snapping.config.enabled, materials, is2DMode]); // Add is2DMode dependency

  // Update group children when snap points change
  // MEMORY LEAK FIX: Dispose previous meshes immediately, not on next render
  useEffect(() => {
    if (!groupRef.current) return;

    // Store previous meshes for immediate cleanup to prevent memory leaks
    // This ensures geometries/materials are disposed synchronously when snap points change
    const previousMeshes = groupRef.current.children.slice();

    // Clear existing children
    groupRef.current.clear();

    // Dispose previous meshes immediately (fixes memory leak)
    previousMeshes.forEach(mesh => {
      if (mesh instanceof THREE.Mesh || mesh instanceof THREE.Line) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat: THREE.Material) => mat.dispose());
        } else if (mesh.material) {
          (mesh.material as THREE.Material).dispose();
        }
      }
    });

    // Add new meshes
    snapMeshes.forEach(mesh => {
      groupRef.current!.add(mesh);
    });

    return () => {
      // Final cleanup on component unmount
      snapMeshes.forEach(mesh => {
        if (mesh instanceof THREE.Mesh || mesh instanceof THREE.Line) {
          if (mesh.geometry) mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: THREE.Material) => mat.dispose());
          } else if (mesh.material) {
            (mesh.material as THREE.Material).dispose();
          }
        }
      });
    };
  }, [snapMeshes]);

  // Distance-based culling and fade effect
  useFrame(({ camera: frameCamera }) => {
    if (!groupRef.current || !snapping.config.enabled) return;

    const cameraPosition = frameCamera.position;

    // FIX: Use limitedSnapPoints instead of snapping.availableSnapPoints
    // The meshes are created from limitedSnapPoints, so indices must match
    groupRef.current.children.forEach((child, index) => {
      const snapPoint = limitedSnapPoints[index];
      if (!snapPoint) return;

      // CRITICAL FIX: For selected shapes, disable camera-distance culling
      // This ensures all indicators stay visible regardless of zoom level
      // For other cases (drawing, dragging), use normal distance culling for performance
      if (!isShowingSelectedShape) {
        const distance = cameraPosition.distanceTo(
          new THREE.Vector3(snapPoint.position.x, 0, snapPoint.position.y)
        );

        // Cull distant points when not showing selected shape
        if (distance > maxDistance) {
          child.visible = false;
          return;
        }
      }

      child.visible = true;

      // CONSISTENCY FIX: All indicators use same opacity - no distance-based fading
      if (child.material && 'opacity' in child.material) {
        (child.material as THREE.Material & { opacity: number }).opacity = UNIFORM_OPACITY;
      }
    });
  });

  // Get resize state
  const isResizeMode = useAppStore(state => state.drawing.isResizeMode);

  // Show indicators when:
  // 1. Actively drawing or dragging shapes
  // 2. Hovering with a drawing tool active (rectangle, circle, polyline, line, measure)
  // 3. In resize mode (showing resize handles) - so user can see snap points before dragging
  // 4. Actively resizing (dragging a resize handle) - CRITICAL for resize snap to work
  // 5. A shape is selected - CRITICAL so users can see all snap points on selected shapes
  const isDrawingTool = ['rectangle', 'circle', 'polyline', 'line', 'measure'].includes(activeTool);
  const isHoveringWithDrawingTool = isDrawingTool && cursorPosition !== null;
  const isShapeSelected = selectedShapeIds && selectedShapeIds.length > 0;
  const shouldShowIndicators = (isDrawing || isDragging || isResizeMode || isActivelyResizing || isHoveringWithDrawingTool || isShapeSelected) && snapping.config.enabled;

  if (!shouldShowIndicators) return null;

  return <group ref={groupRef} />;
};