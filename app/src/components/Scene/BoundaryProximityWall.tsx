/**
 * BoundaryProximityWall.tsx
 *
 * Renders semi-transparent boundary walls that only become visible
 * when the player approaches the edge of the walkable area.
 *
 * Features:
 * - Distance-based opacity (invisible far away, visible when close)
 * - Smooth fade effect based on player proximity
 * - Gradient coloring (more intense at top)
 * - Real-time updates each frame
 */

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface BoundaryProximityWallProps {
  /** Boundary points in world coordinates (meters) */
  points: Array<{ x: number; y: number }>;
  /** Wall height in meters (default: 30m) */
  height?: number;
  /** Distance at which wall starts to become visible (default: 15m) */
  fadeStartDistance?: number;
  /** Distance at which wall is fully visible (default: 3m) */
  fadeEndDistance?: number;
  /** Maximum opacity when fully visible (default: 0.5) */
  maxOpacity?: number;
  /** Wall color (default: cyan/teal for visibility) */
  color?: string;
  /** Whether boundary is closed (default: true) */
  closed?: boolean;
}

interface WallSegmentData {
  center: THREE.Vector3;
  length: number;
  angle: number;
  start: THREE.Vector3;
  end: THREE.Vector3;
}

/**
 * Calculate wall segments from boundary points
 */
function calculateWallSegments(
  points: Array<{ x: number; y: number }>,
  closed: boolean
): WallSegmentData[] {
  const segments: WallSegmentData[] = [];
  const numEdges = closed ? points.length : points.length - 1;

  for (let i = 0; i < numEdges; i++) {
    const start = points[i];
    const end = points[(i + 1) % points.length];

    const dx = end.x - start.x;
    const dz = end.y - start.y;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    segments.push({
      center: new THREE.Vector3((start.x + end.x) / 2, 0, (start.y + end.y) / 2),
      length,
      angle,
      start: new THREE.Vector3(start.x, 0, start.y),
      end: new THREE.Vector3(end.x, 0, end.y),
    });
  }

  return segments;
}

/**
 * Calculate distance from player to a line segment
 */
function distanceToSegment(
  playerX: number,
  playerZ: number,
  segment: WallSegmentData
): number {
  const dx = segment.end.x - segment.start.x;
  const dz = segment.end.z - segment.start.z;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq === 0) {
    // Segment is a point
    const px = playerX - segment.start.x;
    const pz = playerZ - segment.start.z;
    return Math.sqrt(px * px + pz * pz);
  }

  // Project player onto line
  const t = Math.max(0, Math.min(1,
    ((playerX - segment.start.x) * dx + (playerZ - segment.start.z) * dz) / lengthSq
  ));

  const closestX = segment.start.x + t * dx;
  const closestZ = segment.start.z + t * dz;

  const distX = playerX - closestX;
  const distZ = playerZ - closestZ;

  return Math.sqrt(distX * distX + distZ * distZ);
}

/**
 * Single wall segment with animated opacity
 */
function AnimatedWallSegment({
  segment,
  height,
  fadeStartDistance,
  fadeEndDistance,
  maxOpacity,
  color,
}: {
  segment: WallSegmentData;
  height: number;
  fadeStartDistance: number;
  fadeEndDistance: number;
  maxOpacity: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();

  // Create geometry once
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(segment.length, height, 1, 10);
  }, [segment.length, height]);

  // Update opacity every frame based on player distance
  useFrame(() => {
    if (!materialRef.current) return;

    const playerX = camera.position.x;
    const playerZ = camera.position.z;
    const distance = distanceToSegment(playerX, playerZ, segment);

    // Calculate opacity based on distance
    let opacity = 0;
    if (distance <= fadeEndDistance) {
      opacity = maxOpacity;
    } else if (distance < fadeStartDistance) {
      const fadeRange = fadeStartDistance - fadeEndDistance;
      const fadeProgress = (distance - fadeEndDistance) / fadeRange;
      opacity = maxOpacity * (1 - fadeProgress);
    }

    // Update material opacity
    materialRef.current.opacity = opacity;
    materialRef.current.visible = opacity > 0.01;
  });

  return (
    <mesh
      ref={meshRef}
      position={[segment.center.x, height / 2, segment.center.z]}
      rotation={[0, segment.angle + Math.PI / 2, 0]}
      geometry={geometry}
    >
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent={true}
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Main BoundaryProximityWall component
 */
export default function BoundaryProximityWall({
  points,
  height = 30,
  fadeStartDistance = 15,
  fadeEndDistance = 3,
  maxOpacity = 0.5,
  color = '#00FFFF',
  closed = true,
}: BoundaryProximityWallProps) {
  // Calculate wall segments once
  const wallSegments = useMemo(
    () => calculateWallSegments(points, closed),
    [points, closed]
  );

  // Don't render if no valid segments
  if (wallSegments.length === 0) {
    return null;
  }

  return (
    <group name="boundary-proximity-walls">
      {wallSegments.map((segment, index) => (
        <AnimatedWallSegment
          key={`wall-${index}`}
          segment={segment}
          height={height}
          fadeStartDistance={fadeStartDistance}
          fadeEndDistance={fadeEndDistance}
          maxOpacity={maxOpacity}
          color={color}
        />
      ))}
    </group>
  );
}
