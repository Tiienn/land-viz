import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import type { SnapPoint } from '../../types';

// Centralized size constants for different view modes
const INDICATOR_SIZES = {
  GRID_3D: 0.03,
  GRID_2D: 0.003
} as const;

interface SnapIndicatorProps {
  maxDistance?: number;
}

export const SnapIndicator: React.FC<SnapIndicatorProps> = ({
  maxDistance = 100
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { drawing, shapes, viewState } = useAppStore();
  const snapping = drawing.snapping;
  const currentShape = drawing.currentShape;
  const isDrawing = drawing.isDrawing;
  const activeTool = drawing.activeTool;
  const cursorPosition = drawing.cursorPosition;

  // Get 2D mode state with safe default
  const is2DMode = viewState?.is2DMode || false;

  // Debug logging removed for performance

  // Proximity validation function
  const validateSnapPointProximity = useCallback((snapPoint: SnapPoint, cursor: Point2D, radius: number): boolean => {
    const distance = Math.sqrt(
      Math.pow(cursor.x - snapPoint.position.x, 2) +
      Math.pow(cursor.y - snapPoint.position.y, 2)
    );
    return distance <= radius;
  }, []);

  // Performance optimization: limit visible indicators with render-time proximity filtering
  const maxVisibleIndicators = 25; // Limit to 25 indicators for performance
  const limitedSnapPoints = useMemo(() => {
    // Return empty array if no cursor position (cursor not on canvas)
    if (!cursorPosition) {
      return [];
    }

    // Get snap radius based on view mode (same as DrawingCanvas)
    const snapRadius = is2DMode ? 0.05 : 1.5; // 5cm in 2D mode, 1.5m in 3D mode

    // Filter snap points by actual proximity to cursor
    const proximityFilteredPoints = (snapping?.availableSnapPoints || []).filter(point =>
      validateSnapPointProximity(point, cursorPosition, snapRadius)
    );

    return proximityFilteredPoints.slice(0, maxVisibleIndicators);
  }, [snapping?.availableSnapPoints, cursorPosition, is2DMode, validateSnapPointProximity, maxVisibleIndicators]);
  
  // Create fresh geometries each time to ensure proper size updates
  const getGeometries = () => {
    // Dynamic grid size based on view mode
    const gridSize = is2DMode ? INDICATOR_SIZES.GRID_2D : INDICATOR_SIZES.GRID_3D;
    // Grid size optimization for view mode

    return {
      grid: new THREE.PlaneGeometry(gridSize, gridSize), // Smaller in 2D mode
      endpoint: new THREE.CircleGeometry(0.2, 12), // Much smaller
      midpoint: new THREE.RingGeometry(0.15, 0.25, 4, 1, Math.PI / 4), // Much smaller
      center: (() => {
        const geometry = new THREE.BufferGeometry();
        const centerSize = is2DMode ? 0.01 : 0.25; // Much smaller in 2D mode
        const vertices = new Float32Array([
          -centerSize, 0, 0,  centerSize, 0, 0,  // Horizontal line (scaled for 2D)
          0, -centerSize, 0,  0, centerSize, 0   // Vertical line (scaled for 2D)
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        return geometry;
      })(),
      quadrant: new THREE.CircleGeometry(0.2, 8), // Much smaller
      intersection: new THREE.RingGeometry(0.1, 0.2, 6), // Much smaller
      perpendicular: new THREE.PlaneGeometry(0.3, 0.05), // Much smaller
      extension: new THREE.PlaneGeometry(0.35, 0.04), // Much smaller
      tangent: new THREE.CircleGeometry(0.15, 6), // Much smaller
      edge: new THREE.PlaneGeometry(0.2, 0.04) // Much smaller
    };
  };

  // Materials for different snap types
  const materials = useMemo(() => ({
    grid: new THREE.MeshBasicMaterial({ 
      color: '#9CA3AF', 
      transparent: true, 
      opacity: 0.6,
      side: THREE.DoubleSide
    }),
    endpoint: new THREE.MeshBasicMaterial({ 
      color: '#3B82F6', 
      transparent: true, 
      opacity: 0.8 
    }),
    midpoint: new THREE.MeshBasicMaterial({ 
      color: '#F59E0B', 
      transparent: true, 
      opacity: 0.8 
    }),
    center: new THREE.LineBasicMaterial({ 
      color: '#22C55E', 
      transparent: true, 
      opacity: 0.9,
      linewidth: 2
    }),
    quadrant: new THREE.MeshBasicMaterial({ 
      color: '#8B5CF6', 
      transparent: true, 
      opacity: 0.7 
    }),
    intersection: new THREE.MeshBasicMaterial({ 
      color: '#EF4444', 
      transparent: true, 
      opacity: 0.8 
    }),
    perpendicular: new THREE.MeshBasicMaterial({ 
      color: '#06B6D4', 
      transparent: true, 
      opacity: 0.7 
    }),
    extension: new THREE.MeshBasicMaterial({ 
      color: '#84CC16', 
      transparent: true, 
      opacity: 0.6 
    }),
    tangent: new THREE.MeshBasicMaterial({ 
      color: '#F97316', 
      transparent: true, 
      opacity: 0.7 
    }),
    edge: new THREE.MeshBasicMaterial({ 
      color: '#6366F1', 
      transparent: true, 
      opacity: 0.6 
    })
  }), []);

  // Create mesh instances based on snap points
  const snapMeshes = useMemo(() => {
    if (!snapping.config.enabled || !limitedSnapPoints.length) return [];

    const geometries = getGeometries(); // Get fresh geometries
    const meshes: THREE.Object3D[] = [];

    limitedSnapPoints.forEach((snapPoint) => {
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      switch (snapPoint.type) {
        case 'grid':
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

      mesh.position.set(snapPoint.position.x, 0.02, snapPoint.position.y);
      mesh.rotation.x = -Math.PI / 2; // Lay flat on ground
      if (snapPoint.type === 'grid') {
        mesh.rotation.z = Math.PI / 4; // Rotate grid indicators 45° to make diamond
      }
      mesh.renderOrder = 1; // Render above ground but below UI

      meshes.push(mesh);
    });

    return meshes;
  }, [limitedSnapPoints, snapping.config.enabled, materials, is2DMode]); // Add is2DMode dependency

  // Update group children when snap points change
  useEffect(() => {
    if (!groupRef.current) return;

    // Clear existing children
    groupRef.current.clear();

    // Add new meshes
    snapMeshes.forEach(mesh => {
      groupRef.current!.add(mesh);
    });

    return () => {
      // Cleanup on unmount
      snapMeshes.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat: THREE.Material) => mat.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      });
    };
  }, [snapMeshes]);

  // Distance-based culling and fade effect
  useFrame(({ camera: frameCamera }) => {
    if (!groupRef.current || !snapping.config.enabled) return;

    const cameraPosition = frameCamera.position;
    
    groupRef.current.children.forEach((child, index) => {
      const snapPoint = snapping.availableSnapPoints[index];
      if (!snapPoint) return;

      const distance = cameraPosition.distanceTo(
        new THREE.Vector3(snapPoint.position.x, 0, snapPoint.position.y)
      );

      // Cull distant points
      if (distance > maxDistance) {
        child.visible = false;
        return;
      }

      child.visible = true;

      // Fade based on distance
      const fadeStart = maxDistance * 0.7;
      if (distance > fadeStart) {
        const fadeOpacity = 1 - (distance - fadeStart) / (maxDistance - fadeStart);
        if (child.material && 'opacity' in child.material) {
          (child.material as THREE.Material & { opacity: number }).opacity = fadeOpacity * (
            snapPoint.type === 'grid' ? 0.6 : 0.8
          );
        }
      } else {
        if (child.material && 'opacity' in child.material) {
          (child.material as THREE.Material & { opacity: number }).opacity = snapPoint.type === 'grid' ? 0.6 : 0.8;
        }
      }
    });
  });

  if (!snapping.config.enabled) return null;

  return <group ref={groupRef} />;
};