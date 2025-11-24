import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * FloatingParticles - Atmospheric sparkles and floating particles (Genshin Impact style)
 *
 * Features:
 * - Small glowing particles floating in the air
 * - Gentle floating animation
 * - Various colors (white, light yellow, light blue)
 * - Creates magical atmosphere
 */

export interface FloatingParticlesProps {
  /**
   * Number of particles (default: 100)
   */
  count?: number;

  /**
   * Area size for distribution (default: 60m x 60m x 30m high)
   */
  areaSize?: number;
}

export default function FloatingParticles({
  count = 100,
  areaSize = 60
}: FloatingParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Particle geometry
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const halfSize = areaSize / 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random position (within area, above ground)
      positions[i3] = (Math.random() - 0.5) * areaSize; // X
      positions[i3 + 1] = Math.random() * 15 + 2; // Y (2-17m above ground)
      positions[i3 + 2] = (Math.random() - 0.5) * areaSize; // Z

      // Random color (warm white, light yellow, light blue)
      const colorType = Math.random();
      if (colorType < 0.5) {
        // Warm white
        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 0.95;
      } else if (colorType < 0.8) {
        // Light yellow (pollen-like)
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.95;
        colors[i3 + 2] = 0.7;
      } else {
        // Light blue (magical sparkle)
        colors[i3] = 0.7;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 1.0;
      }

      // Random size
      sizes[i] = 0.1 + Math.random() * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [count, areaSize]);

  // Particle material (additive blending for glow effect)
  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
  }, []);

  // Floating animation
  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.elapsedTime;
    const positions = particleGeometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];

      // Gentle floating up and down
      const offset = (x + z) * 0.1;
      positions[i3 + 1] += Math.sin(time * 0.5 + offset) * 0.003;

      // Gentle horizontal drift
      positions[i3] += Math.sin(time * 0.3 + offset) * 0.002;
      positions[i3 + 2] += Math.cos(time * 0.3 + offset) * 0.002;

      // Reset if too high or outside bounds
      const halfSize = areaSize / 2;
      if (positions[i3 + 1] > 18) {
        positions[i3 + 1] = 2;
      }
      if (Math.abs(positions[i3]) > halfSize) {
        positions[i3] = (Math.random() - 0.5) * areaSize;
      }
      if (Math.abs(positions[i3 + 2]) > halfSize) {
        positions[i3 + 2] = (Math.random() - 0.5) * areaSize;
      }
    }

    particleGeometry.attributes.position.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={particleGeometry}
      material={particleMaterial}
    />
  );
}
