import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { Shape } from '@/types';

/**
 * BillboardDimensionLabel - 3D dimension labels for walkthrough mode
 *
 * Features:
 * - Always faces camera (billboard behavior)
 * - Positioned above 3D shapes at eye level
 * - Larger, more readable text for first-person view
 * - Shows area and perimeter prominently
 * - Distance-based scaling for readability
 */

interface BillboardDimensionLabelProps {
  shape: Shape;
  /**
   * Height offset above ground in meters (default: 3.0m - above buildings)
   */
  heightOffset?: number;
}

/**
 * Calculate area of shape using shoelace formula
 */
function calculateShapeArea(shape: Shape): number {
  // Use point.z || point.y to support shapes drawn in 2D mode
  if (shape.type === 'circle' && shape.points.length >= 2) {
    const radius = Math.sqrt(
      Math.pow(shape.points[1].x - shape.points[0].x, 2) +
      Math.pow((shape.points[1].z || shape.points[1].y) - (shape.points[0].z || shape.points[0].y), 2)
    );
    return Math.PI * radius * radius;
  }

  if (shape.points.length >= 3) {
    // Use shoelace formula for polygon area
    let sum = 0;
    for (let i = 0; i < shape.points.length; i++) {
      const j = (i + 1) % shape.points.length;
      const zi = shape.points[i].z || shape.points[i].y;
      const zj = shape.points[j].z || shape.points[j].y;
      sum += shape.points[i].x * zj;
      sum -= shape.points[j].x * zi;
    }
    return Math.abs(sum) / 2;
  }

  if (shape.points.length === 2) {
    // Rectangle defined by two corner points
    const width = Math.abs(shape.points[1].x - shape.points[0].x);
    const height = Math.abs((shape.points[1].z || shape.points[1].y) - (shape.points[0].z || shape.points[0].y));
    return width * height;
  }

  return 0;
}

/**
 * Calculate perimeter of shape
 */
function calculateShapePerimeter(shape: Shape): number {
  // Use point.z || point.y to support shapes drawn in 2D mode
  if (shape.type === 'circle' && shape.points.length >= 2) {
    const radius = Math.sqrt(
      Math.pow(shape.points[1].x - shape.points[0].x, 2) +
      Math.pow((shape.points[1].z || shape.points[1].y) - (shape.points[0].z || shape.points[0].y), 2)
    );
    return 2 * Math.PI * radius;
  }

  if (shape.type === 'line' && shape.points.length === 2) {
    // Simple line length
    return Math.sqrt(
      Math.pow(shape.points[1].x - shape.points[0].x, 2) +
      Math.pow((shape.points[1].z || shape.points[1].y) - (shape.points[0].z || shape.points[0].y), 2)
    );
  }

  // For polygons and polylines
  let perimeter = 0;
  for (let i = 0; i < shape.points.length; i++) {
    const j = (i + 1) % shape.points.length;

    // Skip last segment for open polylines
    if (shape.type === 'polyline' && i === shape.points.length - 1) break;

    const dx = shape.points[j].x - shape.points[i].x;
    const dz = (shape.points[j].z || shape.points[j].y) - (shape.points[i].z || shape.points[i].y);
    perimeter += Math.sqrt(dx * dx + dz * dz);
  }

  return perimeter;
}

/**
 * Calculate center position of shape
 * Use point.z || point.y to support shapes drawn in 2D mode
 */
function getShapeCenter(shape: Shape): [number, number, number] {
  if (shape.type === 'circle' && shape.points.length >= 2) {
    return [shape.points[0].x, 0, shape.points[0].z || shape.points[0].y];
  }

  if (shape.points.length === 0) return [0, 0, 0];

  const sumX = shape.points.reduce((acc, p) => acc + p.x, 0);
  const sumZ = shape.points.reduce((acc, p) => acc + (p.z || p.y), 0);

  return [
    sumX / shape.points.length,
    0,
    sumZ / shape.points.length
  ];
}

export default function BillboardDimensionLabel({
  shape,
  heightOffset = 3.0, // 3 meters above ground (above 2.5m buildings)
}: BillboardDimensionLabelProps) {
  const { camera } = useThree();

  // Calculate shape dimensions
  const dimensions = useMemo(() => {
    const area = calculateShapeArea(shape);
    const perimeter = calculateShapePerimeter(shape);
    const center = getShapeCenter(shape);

    return { area, perimeter, center };
  }, [shape, shape.points]);

  // Calculate distance-based scaling for readability
  const scaleInfo = useMemo(() => {
    const labelPosition = [
      dimensions.center[0],
      heightOffset,
      dimensions.center[2]
    ];

    // Distance from camera to label
    const distance = Math.sqrt(
      Math.pow(camera.position.x - labelPosition[0], 2) +
      Math.pow(camera.position.y - labelPosition[1], 2) +
      Math.pow(camera.position.z - labelPosition[2], 2)
    );

    // Scale text based on distance (closer = larger)
    // Base size at 10m distance
    const referenceDistance = 10;
    const scale = Math.max(0.5, Math.min(2.0, distance / referenceDistance));

    return {
      fontSize: Math.round(20 * scale),
      padding: Math.round(8 * scale),
      distance
    };
  }, [camera.position, dimensions.center, heightOffset]);

  // Don't render if area is too small or distance is too far
  if (dimensions.area < 0.1) return null;
  if (scaleInfo.distance > 100) return null; // Don't render labels beyond 100m

  // Determine label content based on shape type
  const labelContent = useMemo(() => {
    if (shape.type === 'line') {
      // Lines only show length
      return {
        primary: `${dimensions.perimeter.toFixed(1)}m`,
        secondary: 'Length',
        color: '#3b82f6' // Blue
      };
    }

    if (shape.type === 'circle') {
      const radius = Math.sqrt(
        Math.pow(shape.points[1].x - shape.points[0].x, 2) +
        Math.pow(shape.points[1].z - shape.points[0].z, 2)
      );
      return {
        primary: `${dimensions.area.toFixed(0)} m²`,
        secondary: `r = ${radius.toFixed(1)}m`,
        color: '#22c55e' // Green
      };
    }

    // Polygons and rectangles show area + perimeter
    return {
      primary: `${dimensions.area.toFixed(0)} m²`,
      secondary: `${dimensions.perimeter.toFixed(1)}m perimeter`,
      color: '#22c55e' // Green
    };
  }, [shape.type, shape.points, dimensions.area, dimensions.perimeter]);

  return (
    <Html
      position={[
        dimensions.center[0],
        heightOffset,
        dimensions.center[2]
      ]}
      center
      sprite // Billboard behavior - always faces camera
      occlude={false}
      zIndexRange={[1, 0]}
      distanceFactor={8} // Control size scaling with distance
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        transform: 'translateZ(0)', // Force GPU acceleration
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {/* Primary dimension (area or length) */}
        <div
          style={{
            background: `linear-gradient(135deg, ${labelContent.color} 0%, ${labelContent.color}dd 100%)`,
            color: 'white',
            padding: `${scaleInfo.padding}px ${scaleInfo.padding * 2}px`,
            borderRadius: '8px',
            fontSize: `${scaleInfo.fontSize}px`,
            fontWeight: '800',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '3px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {labelContent.primary}
        </div>

        {/* Secondary dimension (perimeter or radius) */}
        <div
          style={{
            background: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
            padding: `${scaleInfo.padding * 0.6}px ${scaleInfo.padding * 1.2}px`,
            borderRadius: '6px',
            fontSize: `${scaleInfo.fontSize * 0.7}px`,
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          {labelContent.secondary}
        </div>

        {/* Optional: Shape name/type */}
        {shape.name && (
          <div
            style={{
              background: 'rgba(50, 50, 50, 0.8)',
              color: '#aaa',
              padding: `${scaleInfo.padding * 0.5}px ${scaleInfo.padding}px`,
              borderRadius: '4px',
              fontSize: `${scaleInfo.fontSize * 0.6}px`,
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
          >
            {shape.name}
          </div>
        )}
      </div>
    </Html>
  );
}
