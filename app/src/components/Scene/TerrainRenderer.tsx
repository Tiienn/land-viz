import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { getAITextureService } from '@/services/aiTextureService';

/**
 * TerrainRenderer - Realistic textured ground plane for walkthrough mode
 *
 * Features:
 * - Procedural grass texture (avoids CSP issues)
 * - AI-generated textures (Phase 3)
 * - Seamless tiling with UV repeat
 * - PBR materials for realistic appearance
 * - Large ground plane (500x500 meters)
 * - Receives shadows from 3D shapes
 */

export interface TerrainRendererProps {
  /**
   * Size of the ground plane in meters (default: 500m x 500m)
   */
  size?: number;

  /**
   * Terrain type: 'grass' | 'concrete' | 'dirt' | 'gravel'
   */
  terrainType?: 'grass' | 'concrete' | 'dirt' | 'gravel';

  /**
   * Texture repeat/tiling factor (default: 50 - one tile per 10m)
   */
  textureRepeat?: number;

  /**
   * AI-generated texture URL (overrides procedural texture)
   */
  aiTextureUrl?: string;
}

/**
 * Generate procedural grass texture using canvas
 * Creates a realistic grass appearance with color variation
 */
function createGrassTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base grass color (ULTRA vibrant lime green - Genshin Impact style)
  // Genshin's grass is almost yellow-green, super bright!
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#8FD14F');   // Bright lime green
  gradient.addColorStop(0.5, '#7BC14E'); // Medium lime green
  gradient.addColorStop(1, '#6BB04A');   // Slightly darker lime green
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Add grass blade variation
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const length = 2 + Math.random() * 5;

    // Vary grass blade colors with lime green (Genshin style)
    const brightness = 0.9 + Math.random() * 0.2;
    const greenValue = Math.floor(brightness * 220); // Very bright green channel
    const blueValue = Math.floor(brightness * 90); // Less blue for yellow-green
    const alpha = 0.7 + Math.random() * 0.3;
    ctx.strokeStyle = `rgba(${greenValue * 0.6}, ${greenValue}, ${blueValue}, ${alpha})`; // Lime green blades
    ctx.lineWidth = 0.6 + Math.random() * 0.6;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y - length);
    ctx.stroke();
  }

  // Add darker spots (dirt/shadows) with more variation
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const radius = 2 + Math.random() * 6;

    ctx.fillStyle = `rgba(42, 55, 35, ${0.2 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Add highlights (bright sunlit patches - Genshin style)
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const radius = 4 + Math.random() * 6;

    // Very bright yellow-green highlights (sun-kissed grass like Genshin)
    ctx.fillStyle = 'rgba(180, 230, 120, 0.4)'; // Bright lime-yellow
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

/**
 * Generate procedural concrete texture
 */
function createConcreteTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base concrete color (light gray)
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(0, 0, 256, 256);

  // Add concrete grain/noise
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const brightness = 0.9 + Math.random() * 0.2;
    const gray = Math.floor(brightness * 160);
    ctx.fillStyle = `rgb(${gray}, ${gray + 3}, ${gray + 5})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Add cracks
  for (let i = 0; i < 10; i++) {
    const startX = Math.random() * 256;
    const startY = Math.random() * 256;

    ctx.strokeStyle = 'rgba(60, 60, 60, 0.3)';
    ctx.lineWidth = 0.5 + Math.random() * 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    for (let j = 0; j < 5 + Math.random() * 10; j++) {
      x += (Math.random() - 0.5) * 30;
      y += (Math.random() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

/**
 * Generate procedural dirt texture
 */
function createDirtTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base dirt color (brown)
  ctx.fillStyle = '#6b5541';
  ctx.fillRect(0, 0, 256, 256);

  // Add dirt particles
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = Math.random() * 2;
    const brightness = 0.7 + Math.random() * 0.6;
    const brown = Math.floor(brightness * 107);
    ctx.fillStyle = `rgb(${brown}, ${Math.floor(brown * 0.7)}, ${Math.floor(brown * 0.5)})`;
    ctx.fillRect(x, y, size, size);
  }

  // Add pebbles
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const radius = 1 + Math.random() * 3;

    ctx.fillStyle = 'rgba(90, 80, 70, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

/**
 * Generate procedural gravel texture
 */
function createGravelTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base gravel color (gray-brown)
  ctx.fillStyle = '#8b8680';
  ctx.fillRect(0, 0, 256, 256);

  // Add gravel stones
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const radius = 2 + Math.random() * 5;

    // Random stone colors
    const gray = 100 + Math.random() * 80;
    ctx.fillStyle = `rgb(${gray}, ${gray - 5}, ${gray - 10})`;

    // Irregular shape
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Stone highlights
    ctx.fillStyle = `rgba(${gray + 30}, ${gray + 25}, ${gray + 20}, 0.5)`;
    ctx.beginPath();
    ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

/**
 * Get terrain material properties based on terrain type
 */
function getTerrainMaterial(
  terrainType: 'grass' | 'concrete' | 'dirt' | 'gravel',
  textureRepeat: number
): THREE.MeshStandardMaterial {
  let texture: THREE.Texture;
  let roughness: number;
  let metalness: number;

  switch (terrainType) {
    case 'grass':
      texture = createGrassTexture();
      roughness = 0.95; // Very rough, natural surface
      metalness = 0.0;  // Non-metallic
      break;
    case 'concrete':
      texture = createConcreteTexture();
      roughness = 0.8;
      metalness = 0.1;
      break;
    case 'dirt':
      texture = createDirtTexture();
      roughness = 0.95;
      metalness = 0.0;
      break;
    case 'gravel':
      texture = createGravelTexture();
      roughness = 0.85;
      metalness = 0.05;
      break;
  }

  // Set texture repeat for seamless tiling
  texture.repeat.set(textureRepeat, textureRepeat);

  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness,
    metalness,
    side: THREE.DoubleSide,
    // Enhanced visual properties for better realism
    envMapIntensity: 0.2, // Subtle environment reflections
    flatShading: false,    // Smooth shading for natural look
  });
}

export default function TerrainRenderer({
  size = 500, // 500m x 500m ground plane
  terrainType = 'grass',
  textureRepeat = 50, // One texture tile every 10 meters
  aiTextureUrl,
}: TerrainRendererProps) {
  // Get walkable boundaries to check for AI texture settings
  const walkableBoundaries = useAppStore(state => state.walkableBoundaries);
  const [aiTexture, setAITexture] = useState<THREE.Texture | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Check if any boundary has AI texture enabled
  const aiEnabledBoundary = walkableBoundaries?.find(b => b.enableAITexture);

  // Load AI texture when enabled
  useEffect(() => {
    if (!aiEnabledBoundary?.enableAITexture) {
      setAITexture(null);
      return;
    }

    const loadAITexture = async () => {
      setIsLoadingAI(true);
      try {
        const service = getAITextureService();
        const result = await service.generateTexture({
          prompt: aiEnabledBoundary.aiTexturePrompt || 'grass meadow',
          terrainType: aiEnabledBoundary.terrainType,
          size: 512,
        });

        // Create Three.js texture from URL
        const loader = new THREE.TextureLoader();
        loader.load(
          result.imageUrl,
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(textureRepeat, textureRepeat);
            setAITexture(texture);
            setIsLoadingAI(false);
            console.log('[TerrainRenderer] AI texture loaded:', result.provider);
          },
          undefined,
          (error) => {
            console.error('[TerrainRenderer] Failed to load AI texture:', error);
            setAITexture(null);
            setIsLoadingAI(false);
          }
        );
      } catch (error) {
        console.error('[TerrainRenderer] AI texture generation failed:', error);
        setAITexture(null);
        setIsLoadingAI(false);
      }
    };

    loadAITexture();
  }, [aiEnabledBoundary?.enableAITexture, aiEnabledBoundary?.aiTexturePrompt, aiEnabledBoundary?.terrainType, textureRepeat]);

  // Generate terrain material (use AI texture if available)
  const material = useMemo(() => {
    if (aiTexture) {
      return new THREE.MeshStandardMaterial({
        map: aiTexture,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.2,
        flatShading: false,
      });
    }
    return getTerrainMaterial(terrainType, textureRepeat);
  }, [terrainType, textureRepeat, aiTexture]);

  // Create ground plane geometry
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(size, size);
  }, [size]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to horizontal (XZ plane)
      position={[0, 0.01, 0]} // Ground level - slightly above grid (0.01m) to prevent z-fighting
      receiveShadow
    >
    </mesh>
  );
}
