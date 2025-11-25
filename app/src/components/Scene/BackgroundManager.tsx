import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

interface BackgroundManagerProps {
  showGrid: boolean;
  gridOffColor?: string;
}

const BackgroundManager: React.FC<BackgroundManagerProps> = ({
  showGrid,
  gridOffColor = '#f5f5f5'
}) => {
  const { scene } = useThree();
  const viewMode = useAppStore(state => state.viewState?.viewMode || '3d-orbit');

  React.useEffect(() => {
    // In walkthrough mode, always use null background so sky sphere is visible
    if (viewMode === '3d-walkthrough') {
      scene.background = null;
      return;
    }

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
  }, [scene, showGrid, gridOffColor, viewMode]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundManager;