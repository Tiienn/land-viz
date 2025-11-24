import React, { useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InfiniteGridProps {
  size?: number;
  divisions?: number;
  colorCenterLine?: string;
  colorGrid?: string;
  distance?: number;
}

const InfiniteGrid: React.FC<InfiniteGridProps> = ({
  size = 100,
  divisions = 100,
  colorCenterLine = '#444444',
  colorGrid = '#888888',
  distance = 8000
}) => {
  const { camera, scene } = useThree();
  const gridRef = useRef<THREE.Mesh>(null);

  // Infinite grid shader material
  const gridMaterial = useMemo(() => {
    const vertexShader = `
      varying vec3 worldPosition;
      
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        worldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 worldPosition;
      uniform float uSize;
      uniform float uDivisions;
      uniform vec3 uColorGrid;
      uniform vec3 uColorCenterLine;
      uniform float uDistance;
      
      float getGrid(float size) {
        vec2 r = worldPosition.xz / size;
        vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
        float line = min(grid.x, grid.y);
        return 1.0 - min(line, 1.0);
      }
      
      void main() {
        float cameraDistance = distance(cameraPosition, worldPosition);
        
        // Fade out grid lines based on distance
        float fadeFactor = 1.0 - min(cameraDistance / uDistance, 1.0);
        
        // Main grid
        float grid1 = getGrid(uSize);
        float grid2 = getGrid(uSize * uDivisions);
        
        // Center lines (X and Z axes)
        float centerX = step(abs(worldPosition.x), 0.5);
        float centerZ = step(abs(worldPosition.z), 0.5);
        float centerLine = max(centerX, centerZ);
        
        // Mix colors
        vec3 color = mix(uColorGrid, uColorCenterLine, centerLine);
        float alpha = (grid1 + grid2) * fadeFactor;
        
        // Make center lines more prominent
        alpha = max(alpha, centerLine * fadeFactor * 0.8);
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSize: { value: size },
        uDivisions: { value: divisions },
        uColorGrid: { value: new THREE.Color(colorGrid) },
        uColorCenterLine: { value: new THREE.Color(colorCenterLine) },
        uDistance: { value: distance }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Prevent z-fighting with terrain
    });
  }, [size, divisions, colorGrid, colorCenterLine, distance]);

  // Set neutral background for infinite space feeling
  React.useEffect(() => {
    scene.background = new THREE.Color('#f5f5f5'); // Light neutral background
    
    return () => {
      scene.background = null;
    };
  }, [scene]);

  // Infinite grid plane that follows camera
  useFrame(() => {
    if (gridRef.current && camera) {
      // Keep grid centered on camera position but locked to Y=-0.01
      gridRef.current.position.x = camera.position.x;
      gridRef.current.position.y = -0.01; // Maintain offset below terrain
      gridRef.current.position.z = camera.position.z;
    }
  });

  return (
    <mesh
      ref={gridRef}
      position={[0, -0.01, 0]} // Slightly below terrain to prevent z-fighting
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={-1}
    >
      <planeGeometry args={[distance * 2, distance * 2]} />
      <primitive object={gridMaterial} />
    </mesh>
  );
};

export default InfiniteGrid;