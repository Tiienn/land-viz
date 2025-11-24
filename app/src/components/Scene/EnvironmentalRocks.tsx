import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * EnvironmentalRocks - Scattered rocks for natural environment detail
 *
 * Features:
 * - Various sizes (small to medium)
 * - Gray/brown colors with variation
 * - Random distribution
 * - Irregular shapes
 */

export interface EnvironmentalRocksProps {
  /**
   * Number of rocks (default: 50)
   */
  count?: number;

  /**
   * Area size for distribution (default: 80m x 80m)
   */
  areaSize?: number;
}

export default function EnvironmentalRocks({
  count = 50,
  areaSize = 80
}: EnvironmentalRocksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Rock geometry (irregular dodecahedron for natural look)
  const rockGeometry = useMemo(() => {
    const geometry = new THREE.DodecahedronGeometry(0.4, 0);

    // Randomize vertices for irregular shape
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Add random variation to each vertex
      const variation = 0.3;
      positions.setX(i, x * (1 + (Math.random() - 0.5) * variation));
      positions.setY(i, y * (1 + (Math.random() - 0.5) * variation));
      positions.setZ(i, z * (1 + (Math.random() - 0.5) * variation));
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }, []);

  // Rock material (gray-brown)
  const rockMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#8B8680',
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true // Angular, low-poly look
    });
  }, []);

  // Generate random rock positions and transformations
  useMemo(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Random position
      const x = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;
      const y = 0.2; // Partially embedded in ground

      dummy.position.set(x, y, z);

      // Random rotation
      dummy.rotation.set(
        Math.random() * 0.5, // Slight tilt
        Math.random() * Math.PI * 2, // Random Y rotation
        Math.random() * 0.5 // Slight tilt
      );

      // Random scale (0.5x to 2.5x)
      const scale = 0.5 + Math.random() * 2.0;
      dummy.scale.set(
        scale * (0.8 + Math.random() * 0.4), // Width variation
        scale * (0.6 + Math.random() * 0.4), // Height variation
        scale * (0.8 + Math.random() * 0.4)  // Depth variation
      );

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [count, areaSize]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[rockGeometry, rockMaterial, count]}
      castShadow
      receiveShadow
    />
  );
}
