/**
 * BoundaryFenceRenderer.tsx
 *
 * Renders 3D fences/walls along walkable boundary edges in walkthrough mode.
 * Supports multiple fence styles: wooden, metal, stone, hedge.
 *
 * Uses instanced meshes for performance when rendering many posts/rails.
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export type FenceStyle = 'wooden' | 'metal' | 'stone' | 'hedge';

export interface BoundaryFenceRendererProps {
  /** Boundary points in world coordinates (meters) - [{x, y}] where y maps to z in 3D */
  points: Array<{ x: number; y: number }>;
  /** Fence style */
  style: FenceStyle;
  /** Fence height in meters */
  height?: number;
  /** Post spacing in meters */
  postSpacing?: number;
  /** Whether the boundary is closed (connect last point to first) */
  closed?: boolean;
}

// Fence style configurations
const FENCE_STYLES = {
  wooden: {
    postColor: '#8B4513',      // Saddle brown
    railColor: '#A0522D',      // Sienna
    postWidth: 0.1,            // 10cm posts
    postDepth: 0.1,            // 10cm deep
    railHeight: 0.08,          // 8cm tall rails
    railDepth: 0.05,           // 5cm deep rails
    railCount: 3,              // 3 horizontal rails
    railPositions: [0.25, 0.5, 0.75], // Positions as fraction of height
  },
  metal: {
    postColor: '#2F4F4F',      // Dark slate gray
    railColor: '#696969',      // Dim gray
    postWidth: 0.05,           // 5cm posts
    postDepth: 0.05,           // 5cm deep
    railHeight: 0.03,          // 3cm tall rails
    railDepth: 0.03,           // 3cm deep rails
    railCount: 4,              // 4 horizontal rails
    railPositions: [0.2, 0.4, 0.6, 0.8],
  },
  stone: {
    wallColor: '#808080',      // Gray
    wallThickness: 0.4,        // 40cm thick wall
    capColor: '#696969',       // Darker cap
    capHeight: 0.1,            // 10cm cap
  },
  hedge: {
    baseColor: '#228B22',      // Forest green
    highlightColor: '#32CD32', // Lime green
    width: 0.6,                // 60cm wide hedge
    leafScale: 0.15,           // Size of leaf clusters
  },
};

interface PostData {
  position: THREE.Vector3;
  rotation: number; // Y-axis rotation
}

interface RailData {
  position: THREE.Vector3;
  rotation: number;
  length: number;
}

interface WallSegmentData {
  position: THREE.Vector3;
  rotation: number;
  length: number;
}

/**
 * Calculate fence geometry along boundary edges
 */
function generateFenceData(
  points: Array<{ x: number; y: number }>,
  postSpacing: number,
  height: number,
  closed: boolean
): { posts: PostData[]; rails: RailData[]; wallSegments: WallSegmentData[] } {
  const posts: PostData[] = [];
  const rails: RailData[] = [];
  const wallSegments: WallSegmentData[] = [];

  const numEdges = closed ? points.length : points.length - 1;

  for (let i = 0; i < numEdges; i++) {
    const start = points[i];
    const end = points[(i + 1) % points.length];

    const dx = end.x - start.x;
    const dz = end.y - start.y; // y in 2D maps to z in 3D
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    // Calculate number of posts for this edge
    const postCount = Math.max(2, Math.ceil(length / postSpacing) + 1);
    const actualSpacing = length / (postCount - 1);

    // Generate posts along edge
    for (let j = 0; j < postCount; j++) {
      // Skip first post of subsequent edges (already placed by previous edge)
      if (i > 0 && j === 0) continue;

      const t = j / (postCount - 1);
      const x = start.x + dx * t;
      const z = start.y + dz * t;

      posts.push({
        position: new THREE.Vector3(x, height / 2, z),
        rotation: angle,
      });
    }

    // Generate rail data for this edge segment
    rails.push({
      position: new THREE.Vector3(
        start.x + dx * 0.5,
        height / 2,
        start.y + dz * 0.5
      ),
      rotation: angle,
      length: length,
    });

    // Generate wall segment data (for stone style)
    wallSegments.push({
      position: new THREE.Vector3(
        start.x + dx * 0.5,
        height / 2,
        start.y + dz * 0.5
      ),
      rotation: angle,
      length: length,
    });
  }

  return { posts, rails, wallSegments };
}

/**
 * Wooden/Metal Fence with Posts and Rails
 */
function PostAndRailFence({
  posts,
  rails,
  style,
  height,
}: {
  posts: PostData[];
  rails: RailData[];
  style: 'wooden' | 'metal';
  height: number;
}) {
  const config = FENCE_STYLES[style];
  const postGeometry = useMemo(
    () => new THREE.BoxGeometry(config.postWidth, height, config.postDepth),
    [height, config.postWidth, config.postDepth]
  );
  const postMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: config.postColor,
      roughness: style === 'wooden' ? 0.9 : 0.4,
      metalness: style === 'wooden' ? 0.0 : 0.6,
    }),
    [config.postColor, style]
  );

  const railMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: config.railColor,
      roughness: style === 'wooden' ? 0.85 : 0.3,
      metalness: style === 'wooden' ? 0.0 : 0.7,
    }),
    [config.railColor, style]
  );

  return (
    <group name="post-and-rail-fence">
      {/* Posts */}
      {posts.map((post, index) => (
        <mesh
          key={`post-${index}`}
          geometry={postGeometry}
          material={postMaterial}
          position={post.position}
          rotation={[0, post.rotation, 0]}
          castShadow
          receiveShadow
        />
      ))}

      {/* Rails for each edge segment */}
      {rails.map((rail, railIndex) => (
        <group key={`rail-group-${railIndex}`}>
          {config.railPositions.map((positionFraction, i) => {
            const railGeometry = new THREE.BoxGeometry(
              rail.length,
              config.railHeight,
              config.railDepth
            );
            const y = positionFraction * height;

            return (
              <mesh
                key={`rail-${railIndex}-${i}`}
                geometry={railGeometry}
                material={railMaterial}
                position={[rail.position.x, y, rail.position.z]}
                rotation={[0, rail.rotation, 0]}
                castShadow
                receiveShadow
              />
            );
          })}
        </group>
      ))}
    </group>
  );
}

/**
 * Stone Wall Fence
 */
function StoneWallFence({
  wallSegments,
  height,
}: {
  wallSegments: WallSegmentData[];
  height: number;
}) {
  const config = FENCE_STYLES.stone;

  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: config.wallColor,
      roughness: 0.95,
      metalness: 0.0,
    }),
    [config.wallColor]
  );

  const capMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: config.capColor,
      roughness: 0.9,
      metalness: 0.0,
    }),
    [config.capColor]
  );

  return (
    <group name="stone-wall-fence">
      {wallSegments.map((segment, index) => {
        const wallGeometry = new THREE.BoxGeometry(
          segment.length,
          height - config.capHeight,
          config.wallThickness
        );
        const capGeometry = new THREE.BoxGeometry(
          segment.length + 0.1,
          config.capHeight,
          config.wallThickness + 0.1
        );

        return (
          <group key={`wall-segment-${index}`}>
            {/* Main wall */}
            <mesh
              geometry={wallGeometry}
              material={wallMaterial}
              position={[
                segment.position.x,
                (height - config.capHeight) / 2,
                segment.position.z,
              ]}
              rotation={[0, segment.rotation, 0]}
              castShadow
              receiveShadow
            />
            {/* Wall cap */}
            <mesh
              geometry={capGeometry}
              material={capMaterial}
              position={[
                segment.position.x,
                height - config.capHeight / 2,
                segment.position.z,
              ]}
              rotation={[0, segment.rotation, 0]}
              castShadow
              receiveShadow
            />
          </group>
        );
      })}
    </group>
  );
}

/**
 * Hedge Fence (organic looking)
 */
function HedgeFence({
  wallSegments,
  height,
}: {
  wallSegments: WallSegmentData[];
  height: number;
}) {
  const config = FENCE_STYLES.hedge;
  const hedgeRef = useRef<THREE.Group>(null);

  // Subtle sway animation
  useFrame((state) => {
    if (hedgeRef.current) {
      const time = state.clock.elapsedTime;
      hedgeRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.z = Math.sin(time * 0.5 + index * 0.1) * 0.02;
        }
      });
    }
  });

  const hedgeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: config.baseColor,
      roughness: 0.9,
      metalness: 0.0,
    }),
    [config.baseColor]
  );

  return (
    <group name="hedge-fence" ref={hedgeRef}>
      {wallSegments.map((segment, index) => {
        // Main hedge body
        const hedgeGeometry = new THREE.BoxGeometry(
          segment.length,
          height,
          config.width
        );

        // Create leaf clusters along the hedge
        const leafClusters: JSX.Element[] = [];
        const clusterCount = Math.floor(segment.length / 0.5);

        for (let i = 0; i < clusterCount; i++) {
          const t = (i + 0.5) / clusterCount;
          const offsetX = (t - 0.5) * segment.length;

          // Multiple spheres for organic look
          for (let j = 0; j < 3; j++) {
            const yOffset = (Math.random() - 0.5) * height * 0.3;
            const zOffset = (Math.random() - 0.5) * config.width * 0.3;
            const scale = 0.1 + Math.random() * 0.1;

            leafClusters.push(
              <mesh
                key={`leaf-${index}-${i}-${j}`}
                position={[offsetX, height / 2 + yOffset, zOffset]}
                scale={[scale, scale, scale]}
              >
                <sphereGeometry args={[1, 6, 4]} />
                <meshStandardMaterial
                  color={j % 2 === 0 ? config.baseColor : config.highlightColor}
                  roughness={0.9}
                />
              </mesh>
            );
          }
        }

        return (
          <group
            key={`hedge-segment-${index}`}
            position={[segment.position.x, 0, segment.position.z]}
            rotation={[0, segment.rotation, 0]}
          >
            {/* Main hedge body */}
            <mesh
              geometry={hedgeGeometry}
              material={hedgeMaterial}
              position={[0, height / 2, 0]}
              castShadow
              receiveShadow
            />
            {/* Leaf clusters */}
            {leafClusters}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Main BoundaryFenceRenderer component
 */
export default function BoundaryFenceRenderer({
  points,
  style,
  height = 1.5,
  postSpacing = 2.0,
  closed = true,
}: BoundaryFenceRendererProps) {
  // Generate fence geometry data
  const { posts, rails, wallSegments } = useMemo(
    () => generateFenceData(points, postSpacing, height, closed),
    [points, postSpacing, height, closed]
  );

  // Render based on style
  if (style === 'wooden' || style === 'metal') {
    return (
      <PostAndRailFence
        posts={posts}
        rails={rails}
        style={style}
        height={height}
      />
    );
  }

  if (style === 'stone') {
    return <StoneWallFence wallSegments={wallSegments} height={height} />;
  }

  if (style === 'hedge') {
    return <HedgeFence wallSegments={wallSegments} height={height} />;
  }

  return null;
}
