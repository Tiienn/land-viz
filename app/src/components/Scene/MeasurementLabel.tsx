import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Point2D } from '@/types';

interface MeasurementLabelProps {
  position: Vector3;
  text: string;
  color: string;
  opacity?: number;
}

export const MeasurementLabel: React.FC<MeasurementLabelProps> = ({
  position,
  text,
  color,
  opacity = 1
}) => {
  const { camera, gl } = useThree();
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateScreenPosition = () => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();

      // Convert 3D world position to screen coordinates
      const screenPos = position.clone().project(camera);

      // Convert normalized device coordinates to screen pixels
      const x = (screenPos.x * 0.5 + 0.5) * rect.width;
      const y = (screenPos.y * -0.5 + 0.5) * rect.height;

      // Check if position is behind camera
      const isInFront = screenPos.z < 1;

      setScreenPosition({ x, y });
      setIsVisible(isInFront);
    };

    // Update position on every frame
    const animate = () => {
      updateScreenPosition();
      requestAnimationFrame(animate);
    };

    animate();

    // Update on camera changes
    const handleResize = () => updateScreenPosition();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [position, camera, gl]);

  if (!isVisible) return null;

  const canvas = gl.domElement;
  const rect = canvas.getBoundingClientRect();

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.left + screenPosition.x,
        top: rect.top + screenPosition.y,
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: '"Nunito Sans", system-ui, sans-serif',
        border: `1px solid ${color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: opacity,
        whiteSpace: 'nowrap'
      }}
    >
      {text}
    </div>
  );
};