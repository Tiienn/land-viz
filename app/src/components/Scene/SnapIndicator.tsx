import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import type { SnapPoint } from '../../types';

interface SnapIndicatorProps {
  maxDistance?: number;
}

export const SnapIndicator: React.FC<SnapIndicatorProps> = ({ 
  maxDistance = 100 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { drawing, shapes } = useAppStore();
  const snapping = drawing.snapping;
  const currentShape = drawing.currentShape;
  const isDrawing = drawing.isDrawing;
  const activeTool = drawing.activeTool;

  // Performance optimization: limit visible indicators
  const maxVisibleIndicators = 25; // Limit to 25 indicators for performance
  const limitedSnapPoints = useMemo(() => {
    let allSnapPoints = [...(snapping?.availableSnapPoints || [])];
    
    // Add snap points from current drawing shape (for polyline midpoints during drawing)
    if (currentShape && isDrawing && currentShape.points && currentShape.points.length >= 1) {
      const currentShapeSnapPoints: SnapPoint[] = [];
      
      // Generate midpoint snap points for current drawing shape segments (between placed points)
      for (let i = 0; i < currentShape.points.length - 1; i++) {
        const p1 = currentShape.points[i];
        const p2 = currentShape.points[i + 1];
        const midpoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2
        };
        
        currentShapeSnapPoints.push({
          position: midpoint,
          type: 'midpoint',
          shapeId: 'current_drawing_shape',
          priority: 8,
          metadata: { segmentIndex: i, isCurrentShape: true }
        });
      }
      
      // Generate midpoint for the imaginary line segment (from last point to cursor)
      if (activeTool === 'polyline' && snapping.snapPreviewPosition && currentShape.points.length >= 1) {
        const lastPoint = currentShape.points[currentShape.points.length - 1];
        const cursorPosition = snapping.snapPreviewPosition;
        const imaginaryMidpoint = {
          x: (lastPoint.x + cursorPosition.x) / 2,
          y: (lastPoint.y + cursorPosition.y) / 2
        };
        
        currentShapeSnapPoints.push({
          position: imaginaryMidpoint,
          type: 'midpoint',
          shapeId: 'current_drawing_shape',
          priority: 8,
          metadata: { segmentIndex: currentShape.points.length - 1, isCurrentShape: true, isImaginaryLine: true }
        });
      }
      
      // Add endpoint snap points for current drawing shape
      currentShape.points.forEach((point, index) => {
        currentShapeSnapPoints.push({
          position: { x: point.x, y: point.y },
          type: 'endpoint',
          shapeId: 'current_drawing_shape',
          priority: 10,
          metadata: { pointIndex: index, isCurrentShape: true }
        });
      });
      
      allSnapPoints = [...allSnapPoints, ...currentShapeSnapPoints];
    }
    
    // Filter snap points by active types
    const filteredPoints = allSnapPoints.filter(snapPoint => 
      snapping.config?.activeTypes?.has?.(snapPoint.type)
    );
    
    return filteredPoints.slice(0, maxVisibleIndicators);
  }, [snapping?.availableSnapPoints, snapping?.config?.activeTypes, snapping?.snapPreviewPosition, currentShape, isDrawing, activeTool, maxVisibleIndicators]);
  
  // Geometry cache for different snap types (made larger and more visible)
  const geometries = useMemo(() => ({
    grid: new THREE.PlaneGeometry(0.8, 0.8), // Doubled size
    endpoint: new THREE.CircleGeometry(0.5, 16), // Increased size
    midpoint: new THREE.RingGeometry(0.3, 0.5, 4, 1, Math.PI / 4), // Increased size
    center: (() => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        -0.6, 0, 0,  0.6, 0, 0,  // Horizontal line (increased)
        0, -0.6, 0,  0, 0.6, 0   // Vertical line (increased)
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      return geometry;
    })(),
    quadrant: new THREE.CircleGeometry(0.4, 12), // Increased size
    intersection: new THREE.RingGeometry(0.2, 0.5, 8), // Increased size
    perpendicular: new THREE.PlaneGeometry(0.8, 0.15), // Increased size
    extension: new THREE.PlaneGeometry(0.9, 0.1), // Increased size
    tangent: new THREE.CircleGeometry(0.35, 8), // Increased size
    edge: new THREE.PlaneGeometry(0.5, 0.1) // Increased size
  }), []);

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
      mesh.renderOrder = 1; // Render above ground but below UI
      
      meshes.push(mesh);
    });

    return meshes;
  }, [limitedSnapPoints, snapping.config.enabled, geometries, materials]);

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