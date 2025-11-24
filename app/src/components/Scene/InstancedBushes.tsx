import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * InstancedBushes - Small round bushes for Genshin Impact-style vegetation
 *
 * Features:
 * - Small, round bushes scattered naturally
 * - Bright green color matching grass
 * - Various sizes for variety
 * - Low-poly spheres for performance
 */

export interface InstancedBushesProps {
  /**
   * Number of bushes (default: 100)
   */
  count?: number;

  /**
   * Area size for distribution (default: 80m x 80m)
   */
  areaSize?: number;
}

export default function InstancedBushes({
  count = 100,
  areaSize = 80
}: InstancedBushesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Bush geometry (low-poly sphere, slightly squashed)
  const bushGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.5, 6, 5);
    // Squash vertically for bush shape
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      positions.setY(i, y * 0.7); // 70% height
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  // Bush material (bright green)
  const bushMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#7BC14E', // Medium lime green
      roughness: 0.85,
      metalness: 0.0,
      flatShading: false
    });
  }, []);

  // Generate random bush positions and transformations
  useMemo(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Random position
      const x = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;
      const y = 0.3; // Partially in ground

      dummy.position.set(x, y, z);

      // Random rotation (only Y axis)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);

      // Random scale (0.6x to 1.4x)
      const scale = 0.6 + Math.random() * 0.8;
      dummy.scale.set(
        scale * (0.9 + Math.random() * 0.2), // Width variation
        scale, // Height
        scale * (0.9 + Math.random() * 0.2)  // Depth variation
      );

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [count, areaSize]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[bushGeometry, bushMaterial, count]}
      castShadow
      receiveShadow
    />
  );
}
