import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * InstancedGrass - Thousands of individual 3D grass blades for Genshin Impact-style world
 *
 * Features:
 * - Instanced rendering for performance (10,000+ grass blades at 60 FPS)
 * - Each blade is individual geometry (not texture)
 * - Random position, rotation, scale for natural look
 * - Bright lime green color matching Genshin aesthetic
 * - Gentle sway animation
 */

export interface InstancedGrassProps {
  /**
   * Number of grass blades to render (default: 10000)
   */
  count?: number;

  /**
   * Area size for grass distribution (default: 80m x 80m around origin)
   */
  areaSize?: number;

  /**
   * Enable gentle sway animation (default: true)
   */
  enableSway?: boolean;
}

export default function InstancedGrass({
  count = 10000,
  areaSize = 80,
  enableSway = true
}: InstancedGrassProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Create grass blade geometry (simple plane)
  const grassGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(0.08, 0.4, 1, 3);

    // Bend the grass blade slightly by modifying vertices
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      // Bend grass blade forward slightly
      if (y > 0) {
        positions.setX(i, positions.getX(i) + y * 0.1);
      }
    }
    positions.needsUpdate = true;

    return geometry;
  }, []);

  // Create grass material (bright lime green)
  const grassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#8FD14F', // Bright lime green matching terrain
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: false,
      vertexColors: false
    });
  }, []);

  // Generate random positions and transformations for each grass blade
  const { positions, rotations, scales } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const rotations: THREE.Euler[] = [];
    const scales: THREE.Vector3[] = [];

    const halfSize = areaSize / 2;

    for (let i = 0; i < count; i++) {
      // Random position within area
      const x = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;
      const y = 0; // Ground level

      positions.push(new THREE.Vector3(x, y, z));

      // Random rotation (only Y axis - grass stands upright)
      const rotY = Math.random() * Math.PI * 2;
      rotations.push(new THREE.Euler(0, rotY, 0));

      // Random scale (height variation)
      const scaleVariation = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x
      scales.push(new THREE.Vector3(scaleVariation, scaleVariation, scaleVariation));
    }

    return { positions, rotations, scales };
  }, [count, areaSize]);

  // Apply transformations to instanced mesh
  useMemo(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      dummy.position.copy(positions[i]);
      dummy.rotation.copy(rotations[i]);
      dummy.scale.copy(scales[i]);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [count, positions, rotations, scales]);

  // Gentle sway animation
  useFrame((state) => {
    if (!enableSway || !meshRef.current) return;

    const time = state.clock.elapsedTime;
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    // Only animate a subset for performance (every 10th blade)
    for (let i = 0; i < count; i += 10) {
      mesh.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Gentle sway based on time + position offset
      const offset = (dummy.position.x + dummy.position.z) * 0.5;
      const sway = Math.sin(time * 2 + offset) * 0.02; // Very subtle sway

      dummy.rotation.z = sway;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[grassGeometry, grassMaterial, count]}
      castShadow
      receiveShadow
    />
  );
}
