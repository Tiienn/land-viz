import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface BackgroundManagerProps {
  showGrid: boolean;
  gridOffColor?: string;
}

const BackgroundManager: React.FC<BackgroundManagerProps> = ({ 
  showGrid, 
  gridOffColor = '#f5f5f5' 
}) => {
  const { scene } = useThree();

  React.useEffect(() => {
    if (!showGrid) {
      // When Grid is OFF, set the neutral background
      scene.background = new THREE.Color(gridOffColor);
    }
    // Note: When Grid is ON, GridBackground component will handle the background
    
    return () => {
      // Cleanup only if we set the background
      if (!showGrid) {
        scene.background = null;
      }
    };
  }, [scene, showGrid, gridOffColor]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundManager;