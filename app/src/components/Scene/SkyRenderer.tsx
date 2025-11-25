import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * SkyRenderer - Realistic gradient sky for walkthrough mode
 *
 * Features:
 * - Procedural gradient sky (horizon to zenith)
 * - Realistic colors (blue sky, lighter horizon)
 * - Large sky sphere (5000m radius)
 * - No CSP issues (canvas-based)
 * - Optional sun glow effect
 * - Animated 3D clouds
 * - Stars for night/sunset modes
 */

export interface SkyRendererProps {
  /**
   * Sky type: 'day' | 'sunset' | 'night' | 'overcast'
   */
  skyType?: 'day' | 'sunset' | 'night' | 'overcast';

  /**
   * Enable sun glow effect (default: true)
   */
  showSun?: boolean;

  /**
   * Sun position in sky (azimuth angle in degrees, default: 120)
   */
  sunAzimuth?: number;

  /**
   * Sun elevation angle (default: 45 degrees above horizon)
   */
  sunElevation?: number;

  /**
   * Enable animated 3D clouds (default: true)
   */
  enableClouds?: boolean;

  /**
   * Cloud density 0-1 (default: 0.5)
   */
  cloudDensity?: number;

  /**
   * Enable stars for night/sunset (default: true)
   */
  enableStars?: boolean;

  /**
   * Enable automatic day/night cycle (default: false)
   */
  enableAutoCycle?: boolean;

  /**
   * Cycle speed multiplier (1 = 24 min cycle, 10 = 2.4 min cycle)
   */
  cycleSpeed?: number;
}

/**
 * Color configurations for different sky types
 */
const SKY_COLORS = {
  day: {
    zenith: '#4A9EFF',    // Deep vibrant blue (Genshin sky)
    horizon: '#87CEEB',   // Sky blue at horizon
    ground: '#B8E0FF',    // Light blue near ground (not white!)
    sunColor: '#FFFFCC',  // Bright warm sun
    fogColor: '#A8D5FF',  // Medium blue fog
  },
  sunset: {
    zenith: '#1A2B4A',    // Dark blue-purple at top
    horizon: '#FF6B35',   // Orange-red at horizon
    ground: '#FFA07A',    // Light salmon near ground
    sunColor: '#FF4500',  // Orange-red sun
    fogColor: '#FF8C69',  // Salmon fog
  },
  night: {
    zenith: '#0A0E27',    // Very dark blue at top
    horizon: '#1A1F3A',   // Slightly lighter at horizon
    ground: '#2A2F4A',    // Dark purple-blue near ground
    sunColor: '#FFFFFF',  // Moon color
    fogColor: '#1A2332',  // Dark blue fog
  },
  overcast: {
    zenith: '#8C92AC',    // Gray-blue at top
    horizon: '#B0B5C4',   // Lighter gray at horizon
    ground: '#D0D3DC',    // Very light gray near ground
    sunColor: '#E8E8E8',  // Diffused sun
    fogColor: '#C0C5D0',  // Gray fog
  },
};

/**
 * Create procedural gradient sky texture using canvas
 */
function createSkyTexture(skyType: 'day' | 'sunset' | 'night' | 'overcast'): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const colors = SKY_COLORS[skyType];

  // Create vertical gradient from ground (bottom) to zenith (top)
  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0, colors.ground);    // Bottom (near horizon in sphere)
  gradient.addColorStop(0.3, colors.horizon); // Lower third (horizon)
  gradient.addColorStop(1, colors.zenith);    // Top (zenith)

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add fluffy clouds (Genshin Impact style)
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height * 0.6); // Upper 60% of sky
    const cloudWidth = 60 + Math.random() * 100;
    const cloudHeight = 30 + Math.random() * 50;

    // Create cloud with multiple overlapping circles
    for (let j = 0; j < 8; j++) {
      const offsetX = (Math.random() - 0.5) * cloudWidth;
      const offsetY = (Math.random() - 0.5) * cloudHeight * 0.5;
      const radius = 15 + Math.random() * 25;

      const cloudGradient = ctx.createRadialGradient(
        x + offsetX, y + offsetY, 0,
        x + offsetX, y + offsetY, radius
      );
      cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      cloudGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = cloudGradient;
      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

/**
 * Create sun/moon glow sprite
 */
function createSunGlow(skyType: 'day' | 'sunset' | 'night' | 'overcast'): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const colors = SKY_COLORS[skyType];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;

  // Create radial gradient for sun glow
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, colors.sunColor);
  gradient.addColorStop(0.3, colors.sunColor + 'CC'); // 80% opacity
  gradient.addColorStop(0.6, colors.sunColor + '44'); // 27% opacity
  gradient.addColorStop(1, colors.sunColor + '00');   // Transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Animated 3D Clouds - Volumetric cloud puffs that drift across the sky
 */
function AnimatedClouds({
  skyType,
  density = 0.5
}: {
  skyType: 'day' | 'sunset' | 'night' | 'overcast';
  density: number;
}) {
  const cloudsRef = useRef<THREE.Group>(null);

  // Generate cloud cluster data
  const cloudClusters = useMemo(() => {
    const clusters: Array<{
      position: THREE.Vector3;
      puffs: Array<{
        offset: THREE.Vector3;
        scale: number;
      }>;
    }> = [];

    const count = Math.floor(12 * density);

    for (let i = 0; i < count; i++) {
      // Position clouds in a ring around the scene
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 300 + Math.random() * 400;
      const height = 150 + Math.random() * 100;

      // Each cluster has multiple puffs for volume
      const puffs: Array<{ offset: THREE.Vector3; scale: number }> = [];
      const puffCount = 5 + Math.floor(Math.random() * 8);

      for (let j = 0; j < puffCount; j++) {
        puffs.push({
          offset: new THREE.Vector3(
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 40
          ),
          scale: 15 + Math.random() * 25,
        });
      }

      clusters.push({
        position: new THREE.Vector3(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        ),
        puffs,
      });
    }

    return clusters;
  }, [density]);

  // Animate clouds drifting slowly
  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.003;
    }
  });

  // Cloud color based on sky type
  const cloudColor = skyType === 'sunset' ? '#FFB6C1' :
                     skyType === 'night' ? '#3A4A5A' :
                     skyType === 'overcast' ? '#D0D3DC' : '#FFFFFF';

  const cloudOpacity = skyType === 'night' ? 0.4 :
                       skyType === 'overcast' ? 0.9 : 0.85;

  return (
    <group ref={cloudsRef}>
      {cloudClusters.map((cluster, clusterIndex) => (
        <group key={clusterIndex} position={cluster.position}>
          {cluster.puffs.map((puff, puffIndex) => (
            <mesh
              key={puffIndex}
              position={puff.offset}
            >
              <sphereGeometry args={[puff.scale, 8, 6]} />
              <meshBasicMaterial
                color={cloudColor}
                transparent
                opacity={cloudOpacity}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * Stars - Twinkling stars for night and sunset skies
 */
function Stars({ skyType }: { skyType: 'day' | 'sunset' | 'night' | 'overcast' }) {
  const starsRef = useRef<THREE.Points>(null);

  // Generate star positions on upper hemisphere
  const [positions, colors] = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random position on upper hemisphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45; // Upper hemisphere only
      const radius = 4500; // Just inside sky sphere

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) + 200; // Offset up
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Slight color variation (warm to cool white)
      const warmth = Math.random();
      colors[i * 3] = 0.9 + warmth * 0.1;     // R
      colors[i * 3 + 1] = 0.9 + warmth * 0.05; // G
      colors[i * 3 + 2] = 1.0;                  // B
    }

    return [positions, colors];
  }, []);

  // Twinkle animation
  useFrame((state) => {
    if (starsRef.current) {
      const material = starsRef.current.material as THREE.PointsMaterial;
      const baseOpacity = skyType === 'night' ? 0.9 : 0.4;
      material.opacity = baseOpacity + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  // Only show stars at night or sunset
  if (skyType !== 'night' && skyType !== 'sunset') {
    return null;
  }

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={3}
        vertexColors
        transparent
        opacity={skyType === 'night' ? 0.9 : 0.4}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Lens Flare Effect - Creates sun glare streaks
 */
function LensFlare({
  sunPosition,
  skyType,
}: {
  sunPosition: THREE.Vector3;
  skyType: 'day' | 'sunset' | 'night' | 'overcast';
}) {
  const flareGroupRef = useRef<THREE.Group>(null);

  // Only show lens flare for day and sunset
  if (skyType === 'night' || skyType === 'overcast') {
    return null;
  }

  const flareColor = skyType === 'sunset' ? '#FF6B35' : '#FFFACD';
  const flareOpacity = skyType === 'sunset' ? 0.4 : 0.25;

  // Create radial flare pattern
  const flareCount = 6;
  const flares = [];

  for (let i = 0; i < flareCount; i++) {
    const angle = (i / flareCount) * Math.PI * 2;
    const length = 200 + Math.random() * 100;
    const width = 8 + Math.random() * 12;

    flares.push(
      <mesh
        key={i}
        position={sunPosition}
        rotation={[0, 0, angle]}
      >
        <planeGeometry args={[length, width]} />
        <meshBasicMaterial
          color={flareColor}
          transparent
          opacity={flareOpacity * (0.5 + Math.random() * 0.5)}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    );
  }

  return <group ref={flareGroupRef}>{flares}</group>;
}

/**
 * Auto-cycle controller - Dispatches sky changes over time
 */
function AutoCycleController({
  enabled,
  speed,
}: {
  enabled: boolean;
  speed: number;
}) {
  const timeRef = useRef(0);
  const lastDispatchRef = useRef(0);

  useFrame((state, delta) => {
    if (!enabled) return;

    // Accumulate time (scaled by speed)
    // At speed 1: full cycle = 24 minutes (1440 seconds)
    // At speed 10: full cycle = 2.4 minutes (144 seconds)
    timeRef.current += delta * speed;

    // Convert to time of day (0-24 hours mapped to 0-1440 seconds at speed 1)
    const cycleLength = 1440 / speed; // seconds for full cycle
    const normalizedTime = (timeRef.current % cycleLength) / cycleLength; // 0-1
    const hourOfDay = normalizedTime * 24; // 0-24 hours

    // Only dispatch every 0.5 seconds to avoid flooding
    if (state.clock.elapsedTime - lastDispatchRef.current < 0.5) return;
    lastDispatchRef.current = state.clock.elapsedTime;

    // Determine sky type based on hour
    let newSkyType: 'day' | 'sunset' | 'night' | 'overcast';
    let newElevation: number;

    if (hourOfDay >= 5 && hourOfDay < 7) {
      // Dawn (5am - 7am)
      newSkyType = 'sunset';
      newElevation = 10 + (hourOfDay - 5) * 15; // 10° to 40°
    } else if (hourOfDay >= 7 && hourOfDay < 17) {
      // Day (7am - 5pm)
      newSkyType = 'day';
      // Sun rises from 40° at 7am, peaks at noon (80°), descends to 40° at 5pm
      const dayProgress = (hourOfDay - 7) / 10; // 0-1
      newElevation = 40 + Math.sin(dayProgress * Math.PI) * 45;
    } else if (hourOfDay >= 17 && hourOfDay < 19) {
      // Dusk (5pm - 7pm)
      newSkyType = 'sunset';
      newElevation = 40 - (hourOfDay - 17) * 15; // 40° to 10°
    } else {
      // Night (7pm - 5am)
      newSkyType = 'night';
      newElevation = 30; // Moon position
    }

    // Calculate sun azimuth (moves from East to West during day)
    // 6am = 90° (East), 12pm = 180° (South), 6pm = 270° (West)
    const newAzimuth = 90 + (hourOfDay / 24) * 360;

    // Dispatch sky settings change
    window.dispatchEvent(new CustomEvent('sky-auto-cycle-update', {
      detail: {
        skyType: newSkyType,
        sunElevation: Math.round(newElevation),
        sunAzimuth: Math.round(newAzimuth % 360),
      }
    }));
  });

  return null;
}

export default function SkyRenderer({
  skyType = 'day',
  showSun = true,
  sunAzimuth = 120, // degrees (0 = north, 90 = east, 180 = south, 270 = west)
  sunElevation = 45, // degrees above horizon
  enableClouds = true,
  cloudDensity = 0.5,
  enableStars = true,
  enableAutoCycle = false,
  cycleSpeed = 1,
}: SkyRendererProps) {
  const colors = SKY_COLORS[skyType];

  // Generate sky texture
  const skyTexture = useMemo(() => {
    return createSkyTexture(skyType);
  }, [skyType]);

  // Generate sun glow texture
  const sunTexture = useMemo(() => {
    return createSunGlow(skyType);
  }, [skyType]);

  // Calculate sun position in 3D space (large sky sphere)
  const sunPosition = useMemo(() => {
    const azimuthRad = (sunAzimuth * Math.PI) / 180;
    const elevationRad = (sunElevation * Math.PI) / 180;
    const radius = 2000; // Distance from origin

    const x = radius * Math.cos(elevationRad) * Math.sin(azimuthRad);
    const y = radius * Math.sin(elevationRad);
    const z = radius * Math.cos(elevationRad) * Math.cos(azimuthRad);

    return new THREE.Vector3(x, y, z);
  }, [sunAzimuth, sunElevation]);

  // Sky sphere geometry (inverted normals to render inside)
  const skyGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(5000, 64, 64);
    geometry.scale(-1, 1, 1); // Invert to render inside
    return geometry;
  }, []);

  return (
    <group>
      {/* Auto-cycle controller */}
      <AutoCycleController enabled={enableAutoCycle} speed={cycleSpeed} />

      {/* Sky sphere with gradient */}
      <mesh geometry={skyGeometry}>
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Sun/Moon glow sprite (bigger and brighter for Genshin style) */}
      {showSun && (
        <sprite position={sunPosition} scale={[600, 600, 1]}>
          <spriteMaterial
            map={sunTexture}
            transparent={true}
            opacity={skyType === 'overcast' ? 0.3 : 1.0}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      )}

      {/* Lens flare effect */}
      {showSun && sunElevation > 15 && (
        <LensFlare sunPosition={sunPosition} skyType={skyType} />
      )}

      {/* Animated 3D clouds */}
      {enableClouds && (
        <AnimatedClouds skyType={skyType} density={cloudDensity} />
      )}

      {/* Twinkling stars (night/sunset only) */}
      {enableStars && (
        <Stars skyType={skyType} />
      )}
    </group>
  );
}
