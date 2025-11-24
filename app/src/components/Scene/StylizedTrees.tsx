import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * StylizedTrees - Simple cartoon-style trees for Genshin Impact-like environment
 *
 * Features:
 * - Simple geometric trees (cone + cylinder)
 * - Vibrant colors (bright greens, browns)
 * - Randomly distributed across the terrain
 * - Low-poly aesthetic for performance
 */

export interface StylizedTreesProps {
  /**
   * Number of trees to generate (default: 20)
   */
  count?: number;

  /**
   * Area size for tree distribution (default: 100m x 100m)
   */
  areaSize?: number;

  /**
   * Minimum distance from center (default: 10m - keeps trees away from shapes)
   */
  minDistanceFromCenter?: number;
}

interface TreeData {
  position: [number, number, number];
  scale: number;
  rotation: number;
}

/**
 * Generate random tree positions
 */
function generateTreePositions(
  count: number,
  areaSize: number,
  minDistanceFromCenter: number
): TreeData[] {
  const trees: TreeData[] = [];
  const halfSize = areaSize / 2;

  for (let i = 0; i < count; i++) {
    let x, z;
    let attempts = 0;

    // Try to place tree away from center
    do {
      x = (Math.random() - 0.5) * areaSize;
      z = (Math.random() - 0.5) * areaSize;
      attempts++;
    } while (
      Math.sqrt(x * x + z * z) < minDistanceFromCenter &&
      attempts < 50
    );

    const scale = 0.8 + Math.random() * 0.4; // Random size variation
    const rotation = Math.random() * Math.PI * 2; // Random rotation

    trees.push({
      position: [x, 0, z],
      scale,
      rotation,
    });
  }

  return trees;
}

/**
 * Single stylized tree component
 */
interface TreeProps {
  position: [number, number, number];
  scale: number;
  rotation: number;
}

const StylizedTree = React.memo(({ position, scale, rotation }: TreeProps) => {
  // Tree dimensions
  const trunkHeight = 3 * scale;
  const trunkRadius = 0.3 * scale;
  const foliageHeight = 5 * scale;
  const foliageRadius = 2 * scale;

  // Vibrant colors (Genshin-style)
  const trunkColor = '#8B5A3C'; // Warm brown
  const foliageColor = '#6BC24A'; // Bright lime green (matches grass)

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Tree trunk (cylinder) */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius, trunkRadius * 1.2, trunkHeight, 8]} />
        <meshStandardMaterial
          color={trunkColor}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Main foliage - large rounded shape (spheres for Genshin's full, round trees) */}
      <mesh
        position={[0, trunkHeight + foliageRadius * 0.8, 0]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[foliageRadius, 8, 6]} />
        <meshStandardMaterial
          color={foliageColor}
          roughness={0.8}
          metalness={0.0}
          flatShading={false}
        />
      </mesh>

      {/* Second layer - offset sphere for volume */}
      <mesh
        position={[foliageRadius * 0.3, trunkHeight + foliageRadius * 0.6, 0]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[foliageRadius * 0.7, 8, 6]} />
        <meshStandardMaterial
          color={foliageColor}
          roughness={0.8}
          metalness={0.0}
          flatShading={false}
        />
      </mesh>

      {/* Third layer - another offset sphere */}
      <mesh
        position={[-foliageRadius * 0.3, trunkHeight + foliageRadius * 0.7, foliageRadius * 0.2]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[foliageRadius * 0.6, 8, 6]} />
        <meshStandardMaterial
          color={foliageColor}
          roughness={0.8}
          metalness={0.0}
          flatShading={false}
        />
      </mesh>

      {/* Top layer - smaller sphere on top */}
      <mesh
        position={[0, trunkHeight + foliageRadius * 1.3, 0]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[foliageRadius * 0.5, 8, 6]} />
        <meshStandardMaterial
          color={foliageColor}
          roughness={0.8}
          metalness={0.0}
          flatShading={false}
        />
      </mesh>

      {/* Bottom bulge - makes tree fuller at base */}
      <mesh
        position={[0, trunkHeight + foliageRadius * 0.3, 0]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[foliageRadius * 0.8, 8, 6]} />
        <meshStandardMaterial
          color={foliageColor}
          roughness={0.8}
          metalness={0.0}
          flatShading={false}
        />
      </mesh>
    </group>
  );
});

StylizedTree.displayName = 'StylizedTree';

export default function StylizedTrees({
  count = 20,
  areaSize = 100,
  minDistanceFromCenter = 15,
}: StylizedTreesProps) {
  // Generate tree positions (only once on mount)
  const trees = useMemo(() => {
    return generateTreePositions(count, areaSize, minDistanceFromCenter);
  }, [count, areaSize, minDistanceFromCenter]);

  return (
    <group>
      {trees.map((tree, index) => (
        <StylizedTree
          key={`tree-${index}`}
          position={tree.position}
          scale={tree.scale}
          rotation={tree.rotation}
        />
      ))}
    </group>
  );
}
