import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface GridBackgroundProps {
  cellSize?: number;
  gridColor?: string;
  sectionColor?: string;
  backgroundColor?: string;
}

const GridBackground: React.FC<GridBackgroundProps> = ({
  cellSize = 5,
  gridColor = '#a3a3a3',
  sectionColor = '#525252',
  backgroundColor = '#16a34a'
}) => {
  const { scene } = useThree();

  const backgroundTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d')!;
    
    // Create natural grass gradient
    const gradient = context.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, '#22c55e'); // Lighter green
    gradient.addColorStop(0.5, backgroundColor); // Main green
    gradient.addColorStop(1, '#15803d'); // Darker green
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 1024);
    
    const cellPixelSize = 32; // Fixed pixel size for consistent appearance
    
    // Draw fine grid lines
    context.strokeStyle = gridColor;
    context.lineWidth = 0.8;
    context.globalAlpha = 0.6;
    
    // Vertical lines
    for (let x = 0; x <= 1024; x += cellPixelSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 1024);
      context.stroke();
    }
    
    // Horizontal lines  
    for (let y = 0; y <= 1024; y += cellPixelSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(1024, y);
      context.stroke();
    }
    
    // Draw section lines (every 10th line thicker)
    context.strokeStyle = sectionColor;
    context.lineWidth = 2;
    context.globalAlpha = 0.8;
    
    const sectionPixelSize = cellPixelSize * 10;
    
    // Vertical section lines
    for (let x = 0; x <= 1024; x += sectionPixelSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 1024);
      context.stroke();
    }
    
    // Horizontal section lines
    for (let y = 0; y <= 1024; y += sectionPixelSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(1024, y);
      context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, [cellSize, gridColor, sectionColor, backgroundColor]);

  React.useEffect(() => {
    // Set as scene background - this fills the entire viewport
    scene.background = backgroundTexture;
    
    return () => {
      scene.background = null;
    };
  }, [scene, backgroundTexture]);

  // Also add the ground plane for interaction
  return (
    <mesh
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={-1}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial 
        map={backgroundTexture}
        transparent={false}
      />
    </mesh>
  );
};

export default GridBackground;