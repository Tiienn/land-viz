import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';

/**
 * PlayerCharacter - Visual representation of the player in third-person mode
 *
 * Features:
 * - Simple capsule geometry (body + head)
 * - Positioned at player's world position
 * - Rotates to face movement direction
 * - Only visible in third-person mode
 * - Smooth rotation interpolation
 */

export interface PlayerCharacterProps {
  /**
   * Player height in meters (default: 1.7m)
   */
  height?: number;

  /**
   * Body radius in meters (default: 0.3m)
   */
  radius?: number;
}

export default function PlayerCharacter({
  height = 1.7,
  radius = 0.3,
}: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotationRef = useRef<number>(0);

  // Get walkthrough state from store
  const walkthroughState = useAppStore(state => state.viewState.walkthroughState);

  // Update position and rotation every frame
  useFrame(() => {
    if (!groupRef.current || !walkthroughState) return;

    const { position, rotation } = walkthroughState;

    // Position character at player's position (but on the ground, not at eye level)
    groupRef.current.position.set(
      position.x,
      height / 2, // Half height to center the capsule on ground
      position.z
    );

    // Rotate character to face the camera's yaw direction
    targetRotationRef.current = rotation.y;

    // Smooth interpolation for rotation (10% per frame for smooth turning)
    groupRef.current.rotation.y += (targetRotationRef.current - groupRef.current.rotation.y) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {/* Body (cylinder) */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[radius, radius * 0.8, height * 0.7, 16]} />
        <meshStandardMaterial
          color="#4A90E2"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Head (sphere) */}
      <mesh position={[0, height * 0.45, 0]} castShadow>
        <sphereGeometry args={[radius * 0.7, 16, 16]} />
        <meshStandardMaterial
          color="#FFC0CB"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Simple face indicator (eyes) */}
      {/* Left eye */}
      <mesh position={[-radius * 0.25, height * 0.48, radius * 0.5]} castShadow>
        <sphereGeometry args={[radius * 0.1, 8, 8]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>

      {/* Right eye */}
      <mesh position={[radius * 0.25, height * 0.48, radius * 0.5]} castShadow>
        <sphereGeometry args={[radius * 0.1, 8, 8]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
    </group>
  );
}
