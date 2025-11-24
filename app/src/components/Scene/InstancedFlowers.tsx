import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * InstancedFlowers - Small colorful flowers scattered in grass (Genshin Impact style)
 *
 * Features:
 * - Three types: yellow, white, blue flowers
 * - Simple geometry (small spheres with petals)
 * - Random distribution across terrain
 * - Bright, saturated colors
 */

export interface InstancedFlowersProps {
  /**
   * Number of flowers per type (default: 200)
   */
  countPerType?: number;

  /**
   * Area size for distribution (default: 80m x 80m)
   */
  areaSize?: number;
}

/**
 * Single flower type component
 */
const FlowerType: React.FC<{
  count: number;
  color: string;
  areaSize: number;
}> = ({ count, color, areaSize }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Simple flower geometry (sphere for center + petals)
  const flowerGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.08, 6, 6);
    return geometry;
  }, []);

  const flowerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.0,
      emissive: color,
      emissiveIntensity: 0.2 // Slight glow
    });
  }, [color]);

  // Generate random positions
  useMemo(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Random position
      const x = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;
      const y = 0.15; // Slightly above ground

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [count, areaSize]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[flowerGeometry, flowerMaterial, count]}
      castShadow
      receiveShadow
    />
  );
};

export default function InstancedFlowers({
  countPerType = 200,
  areaSize = 80
}: InstancedFlowersProps) {
  return (
    <group>
      {/* Yellow flowers (dandelions) */}
      <FlowerType count={countPerType} color="#FFD700" areaSize={areaSize} />

      {/* White flowers */}
      <FlowerType count={countPerType} color="#FFFFFF" areaSize={areaSize} />

      {/* Blue flowers */}
      <FlowerType count={countPerType} color="#87CEEB" areaSize={areaSize} />

      {/* Pink/Purple flowers */}
      <FlowerType count={countPerType * 0.5} color="#FFB6C1" areaSize={areaSize} />
    </group>
  );
}
