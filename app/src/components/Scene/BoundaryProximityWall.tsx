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
 * - Pulsing animation when very close
 * - No rendering overhead when far from boundaries
 */

import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

export interface BoundaryProximityWallProps {
  /** Boundary points in world coordinates (meters) */
  points: Array<{ x: number; y: number }>;
  /** Wall height in meters (default: 50m - tall enough to block view) */
  height?: number;
  /** Distance at which wall starts to become visible (default: 15m) */
  fadeStartDistance?: number;
  /** Distance at which wall is fully visible (default: 3m) */
  fadeEndDistance?: number;
  /** Maximum opacity when fully visible (default: 0.6) */
  maxOpacity?: number;
  /** Wall color (default: cyan/teal for visibility) */
  color?: string;
  /** Whether boundary is closed (default: true) */
  closed?: boolean;
}

interface WallSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  center: THREE.Vector3;
  length: number;
  angle: number;
  normal: THREE.Vector3;
}

/**
 * Calculate wall segments from boundary points
 */
function calculateWallSegments(
  points: Array<{ x: number; y: number }>,
  closed: boolean
): WallSegment[] {
  const segments: WallSegment[] = [];
  const numEdges = closed ? points.length : points.length - 1;

  for (let i = 0; i < numEdges; i++) {
    const start = points[i];
    const end = points[(i + 1) % points.length];

    const startVec = new THREE.Vector3(start.x, 0, start.y);
    const endVec = new THREE.Vector3(end.x, 0, end.y);

    const dx = end.x - start.x;
    const dz = end.y - start.y;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    // Calculate center point of segment
    const center = new THREE.Vector3(
      (start.x + end.x) / 2,
      0,
      (start.y + end.y) / 2
    );

    // Calculate outward-facing normal (perpendicular to wall, pointing outward)
    // For a closed boundary, outward is typically to the right of the edge direction
    const normal = new THREE.Vector3(-dz / length, 0, dx / length);

    segments.push({
      start: startVec,
      end: endVec,
      center,
      length,
      angle,
      normal,
    });
  }

  return segments;
}

/**
 * Calculate minimum distance from a point to any wall segment
 */
function getDistanceToWalls(
  position: THREE.Vector3,
  segments: WallSegment[]
): { distance: number; nearestSegment: WallSegment | null } {
  let minDistance = Infinity;
  let nearestSegment: WallSegment | null = null;

  for (const segment of segments) {
    // Calculate perpendicular distance to line segment
    const lineVec = segment.end.clone().sub(segment.start);
    const pointVec = position.clone().sub(segment.start);

    // Project point onto line
    const lineLengthSq = lineVec.lengthSq();
    let t = 0;
    if (lineLengthSq > 0) {
      t = Math.max(0, Math.min(1, pointVec.dot(lineVec) / lineLengthSq));
    }

    // Closest point on line segment
    const closestPoint = segment.start.clone().add(lineVec.multiplyScalar(t));

    // Distance in XZ plane only (ignore Y)
    const dx = position.x - closestPoint.x;
    const dz = position.z - closestPoint.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      nearestSegment = segment;
    }
  }

  return { distance: minDistance, nearestSegment };
}

/**
 * Individual wall segment renderer with distance-based opacity
 */
function WallSegmentMesh({
  segment,
  height,
  playerPosition,
  fadeStartDistance,
  fadeEndDistance,
  maxOpacity,
  color,
  time,
}: {
  segment: WallSegment;
  height: number;
  playerPosition: THREE.Vector3;
  fadeStartDistance: number;
  fadeEndDistance: number;
  maxOpacity: number;
  color: string;
  time: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Calculate distance from player to this segment
  const lineVec = segment.end.clone().sub(segment.start);
  const pointVec = playerPosition.clone().sub(segment.start);
  const lineLengthSq = lineVec.lengthSq();
  let t = 0;
  if (lineLengthSq > 0) {
    t = Math.max(0, Math.min(1, pointVec.dot(lineVec) / lineLengthSq));
  }
  const closestPoint = segment.start.clone().add(lineVec.clone().multiplyScalar(t));
  const dx = playerPosition.x - closestPoint.x;
  const dz = playerPosition.z - closestPoint.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Calculate opacity based on distance
  let opacity = 0;
  if (distance <= fadeEndDistance) {
    opacity = maxOpacity;
  } else if (distance <= fadeStartDistance) {
    // Smooth fade based on distance
    const fadeRange = fadeStartDistance - fadeEndDistance;
    const fadeProgress = (distance - fadeEndDistance) / fadeRange;
    opacity = maxOpacity * (1 - fadeProgress);
  }

  // Add pulsing effect when very close
  if (distance < fadeEndDistance + 2) {
    const pulse = Math.sin(time * 3) * 0.1 + 0.1;
    opacity = Math.min(maxOpacity, opacity + pulse);
  }

  // Don't render if completely invisible
  if (opacity < 0.01) {
    return null;
  }

  // Wall geometry - create a vertical plane
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(segment.length, height);
  }, [segment.length, height]);

  // Shader material for gradient effect
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uTime: { value: time },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          // Gradient from bottom (more transparent) to top (more opaque)
          float gradientOpacity = mix(0.3, 1.0, vUv.y);

          // Add subtle horizontal stripe pattern
          float stripe = sin(vUv.y * 20.0 + uTime) * 0.1 + 0.9;

          // Final opacity
          float finalOpacity = uOpacity * gradientOpacity * stripe;

          // Slight color shift based on height
          vec3 finalColor = mix(uColor, uColor * 1.3, vUv.y);

          gl_FragColor = vec4(finalColor, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [color]);

  // Update uniforms
  if (materialRef.current) {
    materialRef.current.uniforms.uOpacity.value = opacity;
    materialRef.current.uniforms.uTime.value = time;
  }

  return (
    <mesh
      position={[segment.center.x, height / 2, segment.center.z]}
      rotation={[0, segment.angle + Math.PI / 2, 0]}
      geometry={geometry}
      ref={(mesh) => {
        if (mesh) {
          materialRef.current = mesh.material as THREE.ShaderMaterial;
        }
      }}
    >
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
}

/**
 * Main BoundaryProximityWall component
 */
export default function BoundaryProximityWall({
  points,
  height = 50,
  fadeStartDistance = 15,
  fadeEndDistance = 3,
  maxOpacity = 0.5,
  color = '#00FFFF',
  closed = true,
}: BoundaryProximityWallProps) {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const playerPositionRef = useRef(new THREE.Vector3());

  // Calculate wall segments once
  const wallSegments = useMemo(
    () => calculateWallSegments(points, closed),
    [points, closed]
  );

  // Update time and player position each frame
  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime;
    playerPositionRef.current.copy(camera.position);
  });

  // Get player position from camera (in walkthrough mode, camera = player position)
  const playerPosition = playerPositionRef.current;

  return (
    <group name="boundary-proximity-walls">
      {wallSegments.map((segment, index) => (
        <WallSegmentMesh
          key={`boundary-wall-${index}`}
          segment={segment}
          height={height}
          playerPosition={playerPosition}
          fadeStartDistance={fadeStartDistance}
          fadeEndDistance={fadeEndDistance}
          maxOpacity={maxOpacity}
          color={color}
          time={timeRef.current}
        />
      ))}
    </group>
  );
}
