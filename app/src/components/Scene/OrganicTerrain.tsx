import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * OrganicTerrain - Rolling hills and valleys for Genshin Impact-style world
 *
 * Features:
 * - Procedural height-mapped terrain (not flat!)
 * - Natural rolling hills using Perlin-like noise
 * - Varied grass colors based on elevation
 * - Organic, curved landscape (no square geometry)
 */

export interface OrganicTerrainProps {
  /**
   * Terrain size (default: 200m x 200m)
   */
  size?: number;

  /**
   * Number of segments for detail (default: 128)
   */
  segments?: number;

  /**
   * Maximum height of hills (default: 8m)
   */
  maxHeight?: number;
}

/**
 * Simple 2D Perlin-like noise function
 * Creates smooth, organic elevation patterns
 */
function noise2D(x: number, y: number): number {
  // Simple pseudo-random hash function
  const hash = (x: number, y: number) => {
    const h = (x * 374761393 + y * 668265263) % 2147483647;
    return ((h ^ (h >> 13)) % 1000) / 1000;
  };

  // Get integer and fractional parts
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  // Smooth interpolation (smoothstep)
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  // Get corner values
  const aa = hash(xi, yi);
  const ab = hash(xi, yi + 1);
  const ba = hash(xi + 1, yi);
  const bb = hash(xi + 1, yi + 1);

  // Bilinear interpolation
  const x1 = aa * (1 - u) + ba * u;
  const x2 = ab * (1 - u) + bb * u;

  return x1 * (1 - v) + x2 * v;
}

/**
 * Fractional Brownian Motion - layered noise for natural terrain
 */
function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value;
}

export default function OrganicTerrain({
  size = 200,
  segments = 128,
  maxHeight = 8
}: OrganicTerrainProps) {
  // Generate organic terrain geometry with height displacement
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

    // Apply height displacement based on noise
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i); // PlaneGeometry uses Y for the second dimension

      // Generate height using fractional Brownian motion
      // Scale coordinates for appropriate frequency
      const nx = x / size * 4; // Adjust frequency
      const nz = z / size * 4;

      // Get height value (0 to 1)
      const height = fbm(nx, nz, 4);

      // Apply height with some bias toward valleys
      const elevationBias = Math.pow(height, 1.2); // Slight valley bias
      const finalHeight = elevationBias * maxHeight;

      // Set Z coordinate (height)
      positions.setZ(i, finalHeight);

      // Vary grass color based on elevation
      // Higher = lighter/yellower, lower = darker/greener
      const t = elevationBias; // 0 to 1

      // Base lime green
      const baseLime = new THREE.Color('#8FD14F');
      // Darker green for valleys
      const darkGreen = new THREE.Color('#6BB04A');
      // Lighter yellow-green for hills
      const lightLime = new THREE.Color('#B0E57C');

      let finalColor: THREE.Color;
      if (t < 0.5) {
        // Valley to mid (dark green to base lime)
        finalColor = darkGreen.clone().lerp(baseLime, t * 2);
      } else {
        // Mid to peak (base lime to light lime)
        finalColor = baseLime.clone().lerp(lightLime, (t - 0.5) * 2);
      }

      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }

    positions.needsUpdate = true;

    // Add vertex colors
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Recalculate normals for proper lighting
    geometry.computeVertexNormals();

    return geometry;
  }, [size, segments, maxHeight]);

  // Terrain material with vertex colors
  const terrainMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
      flatShading: false // Smooth shading for organic look
    });
  }, []);

  return (
    <mesh
      geometry={terrainGeometry}
      material={terrainMaterial}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to horizontal
      position={[0, 0, 0]}
      receiveShadow
    />
  );
}
