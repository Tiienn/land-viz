import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

/**
 * Visual confirmation flash when a snap occurs
 * Shows a brief expanding ring animation at snap location
 */
export const SnapConfirmationFlash: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);

  // Get snap confirmation data from store
  const snapConfirmation = useAppStore(state => state.drawing.snapConfirmation);

  // Animation duration in seconds
  const ANIMATION_DURATION = 0.4;

  // Trigger animation when new snap occurs
  useEffect(() => {
    if (snapConfirmation && snapConfirmation.timestamp) {
      startTime.current = performance.now() / 1000; // Convert to seconds
    }
  }, [snapConfirmation?.timestamp]);

  // Animate the flash
  useFrame(({ clock }) => {
    if (!meshRef.current || !startTime.current || !snapConfirmation) return;

    const currentTime = clock.getElapsedTime();
    const elapsed = currentTime - startTime.current;

    // Animation finished
    if (elapsed > ANIMATION_DURATION) {
      meshRef.current.visible = false;
      startTime.current = null;
      return;
    }

    meshRef.current.visible = true;

    // Progress from 0 to 1
    const progress = elapsed / ANIMATION_DURATION;

    // ENLARGED: Expand from 2.0 to 8.0 for better visibility
    const scale = 2.0 + progress * 6.0;
    meshRef.current.scale.setScalar(scale);

    // Fade out (1.0 to 0.0)
    const opacity = 1.0 - progress;
    if (meshRef.current.material && 'opacity' in meshRef.current.material) {
      (meshRef.current.material as THREE.Material & { opacity: number }).opacity = opacity * 0.9;
    }
  });

  // Don't render if no snap confirmation
  if (!snapConfirmation) return null;

  return (
    <mesh
      ref={meshRef}
      position={[snapConfirmation.position.x, 0.04, snapConfirmation.position.y]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={4}
      visible={false}
    >
      {/* ENLARGED: 3x bigger ring for better visibility */}
      <ringGeometry args={[2.4, 3.6, 32]} />
      <meshBasicMaterial
        color={snapConfirmation.color || '#00C4CC'}
        transparent={true}
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
