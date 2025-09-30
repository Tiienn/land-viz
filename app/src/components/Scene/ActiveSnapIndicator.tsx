import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

// Centralized size constants for different view modes
const INDICATOR_SIZES = {
  GRID_3D: 0.03,
  GRID_2D: 0.003
} as const;

export const ActiveSnapIndicator: React.FC = () => {
  const meshRef = useRef<THREE.Mesh | THREE.Line>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const { drawing, viewState } = useAppStore();
  const snapping = drawing.snapping;

  // Get 2D mode state with safe default
  const is2DMode = viewState?.is2DMode || false;
  
  // Enhanced geometries for active indicator with 2D mode sizing
  const geometries = useMemo(() => {
    // Dynamic grid size based on view mode
    const gridSize = is2DMode ? INDICATOR_SIZES.GRID_2D : INDICATOR_SIZES.GRID_3D;

    return {
    grid: new THREE.PlaneGeometry(gridSize, gridSize), // Smaller in 2D mode
    endpoint: new THREE.CircleGeometry(0.3, 12), // Much smaller
    midpoint: new THREE.RingGeometry(0.2, 0.3, 4, 1, Math.PI / 4), // Much smaller
    center: (() => {
      const geometry = new THREE.BufferGeometry();
      const centerSize = is2DMode ? 0.015 : 0.3; // Much smaller in 2D mode
      const vertices = new Float32Array([
        -centerSize, 0, 0,  centerSize, 0, 0,  // Horizontal line (scaled for 2D)
        0, -centerSize, 0,  0, centerSize, 0   // Vertical line (scaled for 2D)
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      return geometry;
    })(),
    quadrant: new THREE.CircleGeometry(0.25, 12), // Much smaller
    intersection: new THREE.RingGeometry(0.15, 0.3, 6), // Much smaller
    perpendicular: new THREE.PlaneGeometry(0.4, 0.08), // Much smaller
    extension: new THREE.PlaneGeometry(0.5, 0.05), // Much smaller
    tangent: new THREE.CircleGeometry(0.2, 8), // Much smaller
    edge: new THREE.PlaneGeometry(0.3, 0.05), // Much smaller
    outerRing: new THREE.RingGeometry(0.35, 0.5, 16) // Much smaller
  };
  }, [is2DMode]); // Include is2DMode in memoization dependencies

  // Enhanced materials with animation properties
  const materials = useMemo(() => ({
    grid: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9,
      side: THREE.DoubleSide
    }),
    endpoint: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    midpoint: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    center: new THREE.LineBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9,
      linewidth: 3
    }),
    quadrant: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    intersection: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    perpendicular: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    extension: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    tangent: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    edge: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.9 
    }),
    outerRing: new THREE.MeshBasicMaterial({ 
      color: '#00C4CC', 
      transparent: true, 
      opacity: 0.3
    })
  }), []);

  // Get active snap point - only show if the snap type is active
  const activeSnapPoint = snapping.config.enabled && 
                          snapping.activeSnapPoint &&
                          snapping.config.activeTypes?.has?.(snapping.activeSnapPoint.type)
    ? snapping.activeSnapPoint 
    : null;

  // Pulsing animation
  useFrame(({ clock }) => {
    if (!meshRef.current || !outerRingRef.current || !activeSnapPoint) return;

    const time = clock.getElapsedTime();
    
    // Pulsing effect (0.7 to 1.0 scale)
    const pulseScale = 0.85 + Math.sin(time * 4) * 0.15;
    meshRef.current.scale.setScalar(pulseScale);
    
    // Outer ring breathing effect
    const ringPulse = 0.6 + Math.sin(time * 3) * 0.4;
    outerRingRef.current.scale.setScalar(ringPulse);
    if (outerRingRef.current.material && 'opacity' in outerRingRef.current.material) {
      (outerRingRef.current.material as THREE.Material & { opacity: number }).opacity = 0.1 + Math.sin(time * 3) * 0.2;
    }
  });

  if (!activeSnapPoint) return null;

  // Select appropriate geometry and material
  let geometry: THREE.BufferGeometry;
  let material: THREE.Material;
  let isLine = false;

  switch (activeSnapPoint.type) {
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
      isLine = true;
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
      return null;
  }

  return (
    <group 
      position={[activeSnapPoint.position.x, 0.03, activeSnapPoint.position.y]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      {/* Outer breathing ring */}
      <mesh
        ref={outerRingRef}
        geometry={geometries.outerRing}
        material={materials.outerRing}
        renderOrder={2}
      />
      
      {/* Main active indicator */}
      {isLine ? (
        <primitive
          ref={meshRef}
          object={new THREE.Line(geometry, material)}
          renderOrder={3}
        />
      ) : (
        <mesh
          ref={meshRef as React.RefObject<THREE.Mesh>}
          geometry={geometry}
          material={material}
          renderOrder={3}
          rotation={activeSnapPoint.type === 'grid' ? [0, 0, Math.PI / 4] : [0, 0, 0]}
        />
      )}
    </group>
  );
};