import React, { useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import * as THREE from 'three';
import type { Shape } from '@/types';
import BillboardDimensionLabel from './BillboardDimensionLabel';

/**
 * Shape3DRenderer - Renders shapes as 3D walkable objects in walkthrough mode
 *
 * Features:
 * - Rectangles → 3D Boxes (buildings/structures)
 * - Circles → 3D Cylinders
 * - Polygons → Extruded 3D shapes
 * - Lines → Thin vertical walls
 * - Proper lighting and materials
 * - Collision-ready geometry
 */

interface Shape3DRendererProps {
  /**
   * Default height for 3D shapes in meters (default: 2.5m ~ 1 story building)
   */
  defaultHeight?: number;
}

/**
 * Get color with slight variation for different shapes
 */
function getShapeColor(shape: Shape, index: number): string {
  if (shape.color) return shape.color;

  // Vibrant colors (Genshin-style palette)
  const colors = ['#5B9FED', '#4ECDC4', '#FFB84D', '#FF6B6B', '#A78BFA', '#FF6FCF'];
  return colors[index % colors.length];
}

/**
 * Create walls-only geometry for a rectangle shape (no roof/floor)
 * This allows the player to see the sky from inside the shape
 */
function createWallsGeometry(shape: Shape, height: number): THREE.BufferGeometry {
  const points = shape.points;

  // Get bounds
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minZ = Math.min(...points.map(p => p.z || p.y));
  const maxZ = Math.max(...points.map(p => p.z || p.y));

  const width = maxX - minX;
  const depth = maxZ - minZ;

  // Create 4 wall planes and merge them
  const walls: THREE.BufferGeometry[] = [];

  // Wall thickness for visibility
  const thickness = 0.15;

  // Front wall (positive Z)
  const frontWall = new THREE.BoxGeometry(width + thickness * 2, height, thickness);
  frontWall.translate(0, 0, depth / 2);
  walls.push(frontWall);

  // Back wall (negative Z)
  const backWall = new THREE.BoxGeometry(width + thickness * 2, height, thickness);
  backWall.translate(0, 0, -depth / 2);
  walls.push(backWall);

  // Right wall (positive X)
  const rightWall = new THREE.BoxGeometry(thickness, height, depth);
  rightWall.translate(width / 2, 0, 0);
  walls.push(rightWall);

  // Left wall (negative X)
  const leftWall = new THREE.BoxGeometry(thickness, height, depth);
  leftWall.translate(-width / 2, 0, 0);
  walls.push(leftWall);

  // Merge all walls into one geometry
  const mergedGeometry = mergeBufferGeometries(walls);

  // Dispose individual wall geometries
  walls.forEach(w => w.dispose());

  return mergedGeometry || new THREE.BufferGeometry();
}

/**
 * Helper to merge multiple buffer geometries into one
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null;

  let totalVertices = 0;
  let totalIndices = 0;

  // Calculate total sizes
  geometries.forEach(geo => {
    const pos = geo.getAttribute('position');
    if (pos) totalVertices += pos.count;
    const idx = geo.getIndex();
    if (idx) totalIndices += idx.count;
  });

  // Create merged arrays
  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const indices: number[] = [];

  let vertexOffset = 0;
  let indexOffset = 0;

  geometries.forEach(geo => {
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
    const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
    const idx = geo.getIndex();

    if (pos) {
      positions.set(pos.array as Float32Array, vertexOffset * 3);
    }
    if (norm) {
      normals.set(norm.array as Float32Array, vertexOffset * 3);
    }
    if (uv) {
      uvs.set(uv.array as Float32Array, vertexOffset * 2);
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.getX(i) + indexOffset);
      }
    }

    if (pos) {
      indexOffset = vertexOffset + pos.count;
      vertexOffset += pos.count;
    }
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(indices);

  return merged;
}

/**
 * Create open-top cylinder geometry (walls only, no top cap)
 */
function createOpenCylinderGeometry(shape: Shape, height: number): THREE.CylinderGeometry {
  const points = shape.points;

  let radius = 1;
  if (points.length >= 2) {
    const dx = points[1].x - points[0].x;
    const dz = (points[1].z || points[1].y) - (points[0].z || points[0].y);
    radius = Math.sqrt(dx * dx + dz * dz);
  }

  // Create cylinder with open ends (no top or bottom caps)
  return new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
}


/**
 * Create extruded 3D geometry for polygon shapes
 */
function createExtrudeGeometry(shape: Shape, height: number): THREE.ExtrudeGeometry {
  const points = shape.points;

  // Create 2D shape from points (X-Z plane)
  // Use point.z || point.y to support shapes drawn in 2D mode
  const shape2D = new THREE.Shape();

  if (points.length > 0) {
    shape2D.moveTo(points[0].x, points[0].z || points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape2D.lineTo(points[i].x, points[i].z || points[i].y);
    }
    shape2D.closePath();
  }

  // Extrude settings
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 2,
  };

  const geometry = new THREE.ExtrudeGeometry(shape2D, extrudeSettings);

  // Rotate geometry to stand upright (extrude goes in +Z, we want +Y)
  geometry.rotateX(Math.PI / 2);

  return geometry;
}

/**
 * Get center position of shape for placement
 * Use point.z || point.y to support shapes drawn in 2D mode
 */
function getShapeCenter(shape: Shape): [number, number, number] {
  const points = shape.points;

  if (points.length === 0) return [0, 0, 0];

  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumZ = points.reduce((acc, p) => acc + (p.z || p.y), 0);

  const centerX = sumX / points.length;
  const centerZ = sumZ / points.length;

  return [centerX, 0, centerZ];
}

/**
 * Shape3DMesh - Individual shape renderer with memoized geometry
 * Prevents geometry recreation every frame (massive performance improvement)
 */
interface Shape3DMeshProps {
  shape: Shape;
  color: string;
  defaultHeight: number;
}

const Shape3DMesh = React.memo(({ shape, color, defaultHeight }: Shape3DMeshProps) => {
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  // Memoize geometry creation - only recreates when shape data changes
  const { geometry, yOffset } = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    let offset = defaultHeight / 2; // Center the shape vertically

    try {
      console.log(`[Shape3DMesh] Creating geometry for ${shape.type} shape ${shape.id}`);
      console.log(`[Shape3DMesh] Points:`, shape.points);

      if (shape.type === 'rectangle') {
        // Use walls-only geometry (no roof) so player can see sky from inside
        geo = createWallsGeometry(shape, defaultHeight);
        console.log(`[Shape3DMesh] Created walls geometry:`, geo ? 'SUCCESS' : 'FAILED');
      } else if (shape.type === 'circle') {
        // Use open cylinder (no top cap) so player can see sky from inside
        geo = createOpenCylinderGeometry(shape, defaultHeight);
        console.log(`[Shape3DMesh] Created open cylinder geometry:`, geo ? 'SUCCESS' : 'FAILED');
      } else if (shape.type === 'polygon' || shape.type === 'polyline') {
        geo = createExtrudeGeometry(shape, defaultHeight);
        offset = 0; // Extrude geometry already positioned correctly
        console.log(`[Shape3DMesh] Created extrude geometry:`, geo ? 'SUCCESS' : 'FAILED');
      } else if (shape.type === 'line') {
        // Lines become thin vertical walls
        // Use point.z || point.y to support shapes drawn in 2D mode
        const points = shape.points;
        if (points.length >= 2) {
          const dx = points[1].x - points[0].x;
          const dz = (points[1].z || points[1].y) - (points[0].z || points[0].y);
          const length = Math.sqrt(dx * dx + dz * dz);

          geo = new THREE.BoxGeometry(length, defaultHeight, 0.1); // 10cm thick wall

          // Calculate rotation to align with line direction
          const angle = Math.atan2(dz, dx);
          geo.rotateY(angle);
          console.log(`[Shape3DMesh] Created line geometry:`, geo ? 'SUCCESS' : 'FAILED');
        }
      }

      if (geo) {
        const center = getShapeCenter(shape);
        console.log(`[Shape3DMesh] Shape center:`, center);
        console.log(`[Shape3DMesh] Y offset:`, offset);
      }

      return { geometry: geo, yOffset: offset };
    } catch (error) {
      console.error(`Error creating 3D geometry for shape ${shape.id}:`, error);
      return { geometry: null, yOffset: offset };
    }
  }, [shape.id, shape.type, shape.points, defaultHeight]);

  // Dispose of geometry on unmount to prevent memory leaks
  useEffect(() => {
    geometryRef.current = geometry;

    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
    };
  }, [geometry]);

  if (!geometry) {
    return null;
  }

  const center = getShapeCenter(shape);

  // Enhanced material properties based on shape type
  const materialProps = useMemo(() => {
    // Different materials for different shape types (more realistic)
    switch (shape.type) {
      case 'rectangle':
        // Buildings/structures - concrete-like (rougher, less reflective)
        return {
          roughness: 0.85,
          metalness: 0.05,
          envMapIntensity: 0.2,
        };
      case 'circle':
        // Cylindrical structures - slightly smoother (metal tanks, silos)
        return {
          roughness: 0.6,
          metalness: 0.3,
          envMapIntensity: 0.5,
        };
      case 'polygon':
      case 'polyline':
        // Complex shapes - varied surface
        return {
          roughness: 0.75,
          metalness: 0.15,
          envMapIntensity: 0.3,
        };
      case 'line':
        // Walls/fences - rough surface
        return {
          roughness: 0.9,
          metalness: 0.0,
          envMapIntensity: 0.1,
        };
      default:
        return {
          roughness: 0.7,
          metalness: 0.2,
          envMapIntensity: 0.3,
        };
    }
  }, [shape.type]);

  return (
    <group>
      {/* 3D shape mesh */}
      <mesh
        position={[center[0], yOffset, center[2]]}
        geometry={geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={materialProps.roughness}
          metalness={materialProps.metalness}
          envMapIntensity={materialProps.envMapIntensity}
          transparent={shape.opacity !== undefined}
          opacity={shape.opacity ?? 1.0}
          side={THREE.DoubleSide}
          flatShading={false} // Smooth shading for realistic look
        />
      </mesh>

      {/* Billboard dimension label (floating above shape) */}
      <BillboardDimensionLabel
        shape={shape}
        heightOffset={defaultHeight + 0.5} // Position above the building
      />
    </group>
  );
});

Shape3DMesh.displayName = 'Shape3DMesh';

export default function Shape3DRenderer({
  defaultHeight = 2.5, // 2.5 meters ~ 1 story building
}: Shape3DRendererProps) {
  const shapes = useAppStore(state => state.shapes);
  const layers = useAppStore(state => state.layers);

  // Filter visible shapes
  const visibleShapes = useMemo(() => {
    const layerVisibilityMap = new Map<string, boolean>();
    layers.forEach(layer => {
      layerVisibilityMap.set(layer.id, layer.visible !== false);
    });

    const filtered = shapes.filter(shape =>
      layerVisibilityMap.get(shape.layerId) !== false
    );

    console.log('[Shape3DRenderer] Rendering shapes:', filtered.length);
    if (filtered.length > 0) {
      console.log('[Shape3DRenderer] First shape:', {
        id: filtered[0].id,
        type: filtered[0].type,
        points: filtered[0].points,
        hasZ: filtered[0].points.map(p => ({ x: p.x, y: p.y, z: p.z }))
      });
    }

    return filtered;
  }, [shapes, layers]);

  // Render each shape as a 3D object
  return (
    <group>
      {visibleShapes.map((shape, index) => {
        const color = getShapeColor(shape, index);

        return (
          <Shape3DMesh
            key={shape.id}
            shape={shape}
            color={color}
            defaultHeight={defaultHeight}
          />
        );
      })}
    </group>
  );
}
