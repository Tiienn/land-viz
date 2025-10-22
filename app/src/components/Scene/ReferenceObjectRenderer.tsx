import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { REFERENCE_OBJECTS } from '../../data/referenceObjects';
import { ObjectPositioner } from '../../utils/objectPositioning';
import { getFieldMarkingsService, FieldMarkingsService } from '../../services/FieldMarkingsService';
import { logger } from '../../utils/logger';
import type { ReferenceObject, BoundingBox } from '../../types/referenceObjects';
import type { SportType } from '../../types/fieldMarkings';

interface ReferenceObjectRendererProps {
  visibleObjectIds: string[];
  userLandBounds: BoundingBox;
  opacity?: number;
}

export function ReferenceObjectRenderer({
  visibleObjectIds,
  userLandBounds,
  opacity = 0.6
}: ReferenceObjectRendererProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Get visible objects
  const visibleObjects = useMemo(() => {
    return visibleObjectIds
      .map(id => REFERENCE_OBJECTS.find(obj => obj.id === id))
      .filter(Boolean) as ReferenceObject[];
  }, [visibleObjectIds]);

  // Calculate positions for objects
  const objectPositions = useMemo(() => {
    return ObjectPositioner.positionObjects(visibleObjects, userLandBounds);
  }, [visibleObjects, userLandBounds]);

  if (visibleObjects.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef} name="reference-objects">
      {visibleObjects.map((object, index) => {
        const position = objectPositions[index];

        return (
          <ReferenceObjectMesh
            key={object.id}
            object={object}
            position={position}
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}

interface ReferenceObjectMeshProps {
  object: ReferenceObject;
  position: { x: number; y: number; z: number };
  opacity: number;
}

function ReferenceObjectMesh({
  object,
  position,
  opacity
}: ReferenceObjectMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const materialRef = useRef<THREE.MeshLambertMaterial | null>(null);

  // Create geometry based on object type
  const [geometryOrGroup, setGeometryOrGroup] = useState<THREE.BufferGeometry | THREE.Group | null>(null);

  // Helper function to detect sports field type
  const getSportType = (objectId: string): SportType | null => {
    if (objectId.includes('soccer')) return 'soccer';
    if (objectId.includes('basketball')) return 'basketball';
    if (objectId.includes('tennis')) return 'tennis';
    if (objectId.includes('football') && !objectId.includes('soccer')) return 'football';
    return null;
  };

  // Create material with object-specific styling and field markings if applicable
  const material = useMemo(() => {
    const sportType = getSportType(object.id);

    // Check if this is a sports field with available markings
    if (object.category === 'sports' && sportType && FieldMarkingsService.hasFieldMarkings(sportType)) {
      const markingsService = getFieldMarkingsService();
      const fieldTexture = markingsService.generateFieldTexture(
        sportType,
        object.dimensions
      );

      if (fieldTexture) {
        return new THREE.MeshLambertMaterial({
          color: '#ffffff', // Use white to not tint the texture
          map: fieldTexture,
          transparent: true,
          opacity: opacity,
          wireframe: false,
          side: THREE.DoubleSide
        });
      }
    }

    // Default material without markings
    return new THREE.MeshLambertMaterial({
      color: object.material.color,
      transparent: true,
      opacity: opacity,
      wireframe: false,
      side: THREE.DoubleSide
    });
  }, [object.id, object.category, object.dimensions, object.material.color, opacity]);

  // Load geometry asynchronously
  useEffect(() => {
    let cancelled = false;

    GeometryFactory.createObjectGeometry(object).then((geometry) => {
      if (!cancelled) {
        setGeometryOrGroup(geometry);
      }
    }).catch((error) => {
      logger.error('[ReferenceObjectRenderer]', 'Failed to create geometry for object:', object.id, error);
    });

    return () => {
      cancelled = true;
    };
  }, [object]);

  // Store material ref for cleanup
  useEffect(() => {
    materialRef.current = material;
    return () => {
      // Cleanup is handled by the cache, but we ensure the material is properly disposed
      if (materialRef.current && materialRef.current.map) {
        // The texture will be managed by the cache, don't dispose it here
      }
    };
  }, [material]);

  // Hover effect
  useFrame(() => {
    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshLambertMaterial;
      const targetOpacity = hovered ? Math.min(opacity * 1.3, 1) : opacity;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
    }
  });

  // Don't render until geometry is loaded
  if (!geometryOrGroup) {
    return null;
  }

  // Check if we have a Group (Eiffel Tower) or regular geometry
  if (geometryOrGroup instanceof THREE.Group) {
    // For Eiffel Tower and other complex geometries
    return (
      <group position={[position.x, position.y, position.z]}>
        {/* Add the entire tower group */}
        <primitive
          object={geometryOrGroup}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        />

        {/* Object label */}
        {hovered && (
          <ObjectLabel object={object} />
        )}
      </group>
    );
  }

  // For regular geometries (box, cylinder, etc.)
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Main object mesh */}
      <mesh
        ref={meshRef}
        geometry={geometryOrGroup as THREE.BufferGeometry}
        material={material}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        userData={{ objectId: object.id, type: 'reference-object' }}
        castShadow
        receiveShadow
      />

      {/* Outline for better visibility */}
      <lineSegments>
        <edgesGeometry args={[geometryOrGroup as THREE.BufferGeometry]} />
        <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
      </lineSegments>

      {/* Object label */}
      {hovered && (
        <ObjectLabel object={object} />
      )}
    </group>
  );
}

function ObjectLabel({ object }: { object: ReferenceObject }) {
  const labelHeight = (object.dimensions.height || 1) + 2;

  return (
    <Html
      position={[0, labelHeight, 0]}
      center
      style={{
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      <div style={labelStyles.container}>
        <div style={labelStyles.name}>{object.name}</div>
        <div style={labelStyles.details}>
          {object.area.toLocaleString()} m²
        </div>
        <div style={labelStyles.dimensions}>
          {object.dimensions.length}m × {object.dimensions.width}m
        </div>
      </div>
    </Html>
  );
}

// Geometry factory for different object types
class GeometryFactory {
  private static geometryCache = new Map<string, THREE.BufferGeometry | THREE.Group>();
  private static eiffelTowerInstances = new Map<string, any>();
  private static statueOfLibertyInstances = new Map<string, any>();

  static async createObjectGeometry(object: ReferenceObject): Promise<THREE.BufferGeometry | THREE.Group> {
    const cacheKey = `${object.id}-${object.geometry.type}`;

    // Special handling for Eiffel Tower to return Group instead of BufferGeometry
    if (object.geometry.type === 'eiffel-tower') {
      if (this.geometryCache.has(cacheKey)) {
        const cached = this.geometryCache.get(cacheKey)!;
        return cached as THREE.Group;
      }
      const towerGeometry = await this.createEiffelTower(object, cacheKey);
      this.geometryCache.set(cacheKey, towerGeometry);
      return towerGeometry;
    }

    // Special handling for Statue of Liberty to return Group instead of BufferGeometry
    if (object.geometry.type === 'statue-of-liberty') {
      if (this.geometryCache.has(cacheKey)) {
        const cached = this.geometryCache.get(cacheKey)!;
        return cached as THREE.Group;
      }
      const statueGeometry = await this.createStatueOfLiberty(object, cacheKey);
      this.geometryCache.set(cacheKey, statueGeometry);
      return statueGeometry;
    }

    if (this.geometryCache.has(cacheKey)) {
      const cached = this.geometryCache.get(cacheKey)!;
      if (cached instanceof THREE.BufferGeometry) {
        return cached.clone();
      }
      return cached;
    }

    let geometry: THREE.BufferGeometry;

    switch (object.geometry.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          object.dimensions.length,
          object.dimensions.height || 0.5,
          object.dimensions.width
        );
        break;

      case 'cylinder':
        const radius = Math.min(object.dimensions.length, object.dimensions.width) / 2;
        geometry = new THREE.CylinderGeometry(
          radius,
          radius,
          object.dimensions.height || 1,
          16
        );
        break;

      default:
        // Default to box
        geometry = new THREE.BoxGeometry(
          object.dimensions.length,
          object.dimensions.height || 0.5,
          object.dimensions.width
        );
    }

    // Center the geometry
    geometry.center();

    this.geometryCache.set(cacheKey, geometry);
    return geometry.clone();
  }

  private static async createEiffelTower(object: ReferenceObject, cacheKey: string): Promise<THREE.Group> {
    // Dynamically import to avoid loading if not needed
    const { EiffelTowerGeometry } = await import('../../geometries/EiffelTowerGeometry');

    // Create new instance for this object
    const towerOptions = {
      height: object.dimensions.height || 50,
      baseWidth: Math.max(object.dimensions.length, object.dimensions.width),
      detailLevel: (object.geometry.parameters?.detailLevel || 'medium') as 'low' | 'medium' | 'high',
      color: parseInt(object.material.color.replace('#', '0x'))
    };

    const tower = new EiffelTowerGeometry(towerOptions);
    const geometry = tower.getGeometry();

    // Store instance for disposal later
    this.eiffelTowerInstances.set(cacheKey, tower);

    return geometry.clone();
  }

  private static async createStatueOfLiberty(object: ReferenceObject, cacheKey: string): Promise<THREE.Group> {
    // Dynamically import to avoid loading if not needed
    const { StatueOfLibertyGeometry } = await import('../../geometries/StatueOfLibertyGeometry');

    // Create new instance for this object
    const statueOptions = {
      height: object.dimensions.height || 47,
      baseWidth: Math.max(object.dimensions.length, object.dimensions.width),
      detailLevel: (object.geometry.parameters?.detailLevel || 'medium') as 'low' | 'medium' | 'high',
      color: parseInt(object.material.color.replace('#', '0x'))
    };

    const statue = new StatueOfLibertyGeometry(statueOptions);
    const geometry = statue.getGeometry();

    // Store instance for disposal later
    this.statueOfLibertyInstances.set(cacheKey, statue);

    return geometry.clone();
  }

  static clearCache() {
    this.geometryCache.forEach(geometry => {
      if (geometry instanceof THREE.BufferGeometry) {
        geometry.dispose();
      }
    });
    this.geometryCache.clear();

    // Dispose Eiffel Tower instances
    this.eiffelTowerInstances.forEach(tower => {
      if (tower && tower.dispose) {
        tower.dispose();
      }
    });
    this.eiffelTowerInstances.clear();

    // Dispose Statue of Liberty instances
    this.statueOfLibertyInstances.forEach(statue => {
      if (statue && statue.dispose) {
        statue.dispose();
      }
    });
    this.statueOfLibertyInstances.clear();
  }
}

const labelStyles = {
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '8px 12px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    fontSize: '12px',
    fontFamily: '"Nunito Sans", sans-serif',
    textAlign: 'center' as const,
    minWidth: '120px',
    border: '1px solid rgba(0, 0, 0, 0.1)'
  },

  name: {
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '4px',
    fontSize: '13px'
  },

  details: {
    color: '#3b82f6',
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '2px'
  },

  dimensions: {
    color: '#6b7280',
    fontSize: '10px'
  }
};

export default ReferenceObjectRenderer;