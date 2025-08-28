import React, { useMemo } from 'react';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';

interface InfiniteGroundProps {
  cellSize?: number;
  gridColor?: string;
  sectionColor?: string;
  backgroundColor?: string;
}

const InfiniteGround: React.FC<InfiniteGroundProps> = ({
  cellSize = 5,
  gridColor = '#94a3b8',
  sectionColor = '#64748b',
  backgroundColor = '#f8fafc'
}) => {
  const gridMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Fill background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, 512, 512);
    
    const cellPixelSize = 512 / (100 / cellSize); // Scale for texture repeat
    
    // Draw grid lines
    context.strokeStyle = gridColor;
    context.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= 512; x += cellPixelSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 512);
      context.stroke();
    }
    
    // Horizontal lines  
    for (let y = 0; y <= 512; y += cellPixelSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(512, y);
      context.stroke();
    }
    
    // Draw section lines (every 10th line thicker)
    context.strokeStyle = sectionColor;
    context.lineWidth = 2;
    
    const sectionPixelSize = cellPixelSize * 10;
    
    // Vertical section lines
    for (let x = 0; x <= 512; x += sectionPixelSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 512);
      context.stroke();
    }
    
    // Horizontal section lines
    for (let y = 0; y <= 512; y += sectionPixelSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(512, y);
      context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50); // Repeat texture to create infinite effect
    
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: false,
      opacity: 1.0
    });
  }, [cellSize, gridColor, sectionColor, backgroundColor]);

  return (
    <Plane
      args={[5000, 5000]} // Massive plane to cover entire viewport
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={gridMaterial}
      renderOrder={-1}
    />
  );
};

export default InfiniteGround;