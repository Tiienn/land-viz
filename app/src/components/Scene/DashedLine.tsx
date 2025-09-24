import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

// Extend Three.js with Line2 components
extend({ Line2, LineMaterial, LineGeometry });

interface DashedLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color?: string;
  opacity?: number;
  linewidth?: number;
  dashSize?: number;
  gapSize?: number;
}

export const DashedLine: React.FC<DashedLineProps> = ({
  start,
  end,
  color = '#8B5CF6',
  opacity = 0.8,
  linewidth = 2,
  dashSize = 0.5,
  gapSize = 0.5
}) => {
  const lineRef = useRef<Line2>(null);

  // Create geometry from start and end points
  const geometry = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ]);
    return geometry;
  }, [start.x, start.y, start.z, end.x, end.y, end.z]);

  // Create dashed material
  const material = useMemo(() => {
    return new LineMaterial({
      color: new THREE.Color(color),
      linewidth: linewidth / 1000, // Convert to normalized units
      opacity,
      transparent: true,
      dashed: true,
      dashSize,
      gapSize,
      dashScale: 1,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      worldUnits: true
    });
  }, [color, opacity, linewidth, dashSize, gapSize]);

  // Update resolution on window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (material) {
        material.resolution.set(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [material]);

  return (
    <primitive
      ref={lineRef}
      object={new Line2(geometry, material)}
      renderOrder={-1} // Render behind shapes
    />
  );
};