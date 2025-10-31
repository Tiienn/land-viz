---
name: "3D Scene Specialist"
description: "Manage Three.js scene rendering, camera controls, lighting systems, material creation, mesh optimization, and 3D visualization for the Land Visualizer project. Expert in React Three Fiber, Drei helpers, WebGL performance, and interactive 3D experiences"
version: "1.0.0"
dependencies:
  - "three@>=0.157.0"
  - "@react-three/fiber@>=8.0.0"
  - "@react-three/drei@>=9.0.0"
  - "react@>=18.0.0"
---

# 3D Scene Specialist for Land Visualizer

## Overview

This skill provides expert knowledge in Three.js 3D rendering, React Three Fiber integration, WebGL optimization, and interactive 3D scene management specifically for the Land Visualizer project.

## When to Use This Skill

- Optimizing Three.js scene performance
- Implementing camera controls (orbit, pan, zoom)
- Creating and managing materials and lighting
- Rendering property boundaries in 3D space
- Managing mesh geometry and transformations
- Debugging rendering issues
- Implementing instanced rendering for repeated objects
- Handling 2D/3D camera switching

## React Three Fiber Fundamentals

### Canvas Setup

```tsx
import { Canvas } from '@react-three/fiber';

function SceneManager() {
  return (
    <Canvas
      camera={{
        position: [0, 50, 50],
        fov: 50,
        near: 0.1,
        far: 10000
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      }}
      shadows
      dpr={[1, 2]} // Adaptive pixel ratio
    >
      <Scene />
    </Canvas>
  );
}
```

### Component Pattern

```tsx
// Declarative Three.js components
function ShapeRenderer({ shape }: { shape: Shape }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    // Animation loop
    if (meshRef.current) {
      // Update transformations
    }
  });

  return (
    <mesh ref={meshRef} position={[shape.x, 0, shape.y]}>
      <planeGeometry args={[shape.width, shape.height]} />
      <meshStandardMaterial color={shape.color} />
    </mesh>
  );
}
```

## Camera Management

### Orthographic Camera (2D Mode)

```tsx
import { OrthographicCamera } from '@react-three/drei';

function Camera2D() {
  const camera = useRef<THREE.OrthographicCamera>(null);

  useEffect(() => {
    if (camera.current) {
      const aspect = window.innerWidth / window.innerHeight;
      const frustumSize = 100;

      camera.current.left = -frustumSize * aspect / 2;
      camera.current.right = frustumSize * aspect / 2;
      camera.current.top = frustumSize / 2;
      camera.current.bottom = -frustumSize / 2;
      camera.current.updateProjectionMatrix();
    }
  }, []);

  return (
    <OrthographicCamera
      ref={camera}
      makeDefault
      position={[0, 100, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}
```

### Perspective Camera (3D Mode)

```tsx
import { PerspectiveCamera } from '@react-three/drei';

function Camera3D() {
  return (
    <PerspectiveCamera
      makeDefault
      position={[50, 50, 50]}
      fov={50}
    />
  );
}
```

### Camera Controls

```tsx
import { OrbitControls } from '@react-three/drei';

function CameraController() {
  const controlsRef = useRef();

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
      mouseButtons={{
        LEFT: null, // Disable left-click rotation
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.ROTATE
      }}
      minDistance={10}
      maxDistance={500}
      maxPolarAngle={Math.PI / 2.1} // Prevent going under ground
    />
  );
}
```

## Lighting Systems

### Basic Three-Point Lighting

```tsx
function Lighting() {
  return (
    <>
      {/* Key light */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Fill light */}
      <directionalLight
        position={[-50, 50, -50]}
        intensity={0.5}
      />

      {/* Ambient light */}
      <ambientLight intensity={0.4} />

      {/* Hemisphere light for natural outdoor feel */}
      <hemisphereLight
        args={['#87CEEB', '#228B22', 0.6]} // sky color, ground color, intensity
      />
    </>
  );
}
```

### Shadow Configuration

```tsx
<directionalLight
  castShadow
  shadow-camera-left={-100}
  shadow-camera-right={100}
  shadow-camera-top={100}
  shadow-camera-bottom={-100}
  shadow-camera-near={0.1}
  shadow-camera-far={500}
  shadow-mapSize={[2048, 2048]} // Higher = better quality, lower performance
  shadow-bias={-0.0001} // Prevent shadow acne
/>
```

## Materials and Shaders

### Standard Materials

```tsx
// For property boundaries
<meshStandardMaterial
  color="#00C4CC"
  metalness={0.1}
  roughness={0.7}
  transparent={true}
  opacity={0.8}
  side={THREE.DoubleSide}
/>

// For selected shapes
<meshStandardMaterial
  color="#7C3AED"
  emissive="#7C3AED"
  emissiveIntensity={0.2}
  metalness={0.2}
  roughness={0.6}
/>

// For grass/ground
<meshStandardMaterial
  color="#228B22"
  roughness={0.9}
  metalness={0.0}
/>
```

### Custom Shader Material

```tsx
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const GridMaterial = shaderMaterial(
  { gridSize: 1, color: new THREE.Color('#00C4CC') },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float gridSize;
    uniform vec3 color;
    varying vec2 vUv;

    void main() {
      vec2 grid = abs(fract(vUv * gridSize - 0.5) - 0.5) / fwidth(vUv * gridSize);
      float line = min(grid.x, grid.y);
      float alpha = 1.0 - min(line, 1.0);

      gl_FragColor = vec4(color, alpha * 0.3);
    }
  `
);

extend({ GridMaterial });

// Usage
<mesh>
  <planeGeometry args={[1000, 1000]} />
  <gridMaterial gridSize={10} color="#00C4CC" />
</mesh>
```

## Geometry and Mesh Optimization

### Instanced Rendering (for repeated objects)

```tsx
import { useRef, useMemo } from 'react';
import { InstancedMesh, Matrix4 } from 'three';

function ComparisonObjects({ objects }: { objects: RefObject[] }) {
  const instancedRef = useRef<InstancedMesh>(null);

  const positions = useMemo(() => {
    return objects.map(obj => ({
      position: [obj.x, 0, obj.y],
      scale: [obj.width, obj.height, obj.depth]
    }));
  }, [objects]);

  useEffect(() => {
    if (instancedRef.current) {
      const matrix = new Matrix4();

      positions.forEach((pos, i) => {
        matrix.identity();
        matrix.setPosition(pos.position[0], pos.position[1], pos.position[2]);
        matrix.scale(new Vector3(...pos.scale));
        instancedRef.current.setMatrixAt(i, matrix);
      });

      instancedRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [positions]);

  return (
    <instancedMesh
      ref={instancedRef}
      args={[null, null, objects.length]}
      castShadow
    >
      <boxGeometry />
      <meshStandardMaterial color="#EC4899" />
    </instancedMesh>
  );
}
```

### Level of Detail (LOD)

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';

function OptimizedMesh({ distance }: { distance: number }) {
  const lod = useMemo(() => {
    const lod = new THREE.LOD();

    // High detail (close)
    const highDetail = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial()
    );
    lod.addLevel(highDetail, 0);

    // Medium detail
    const mediumDetail = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshStandardMaterial()
    );
    lod.addLevel(mediumDetail, 50);

    // Low detail (far)
    const lowDetail = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshStandardMaterial()
    );
    lod.addLevel(lowDetail, 100);

    return lod;
  }, []);

  return <primitive object={lod} />;
}
```

### Geometry Merging

```tsx
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

function MergedShapes({ shapes }: { shapes: Shape[] }) {
  const mergedGeometry = useMemo(() => {
    const geometries = shapes.map(shape => {
      const geometry = new THREE.PlaneGeometry(shape.width, shape.height);
      geometry.translate(shape.x, 0, shape.y);
      return geometry;
    });

    return mergeBufferGeometries(geometries);
  }, [shapes]);

  return (
    <mesh geometry={mergedGeometry}>
      <meshStandardMaterial color="#00C4CC" />
    </mesh>
  );
}
```

## Interactive Elements

### Raycasting and Selection

```tsx
import { useThree } from '@react-three/fiber';

function useShapeSelection() {
  const { raycaster, camera, scene } = useThree();
  const [selected, setSelected] = useState<Shape | null>(null);

  const handleClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const shape = intersects[0].object.userData.shape;
      setSelected(shape);
    }
  };

  return { selected, handleClick };
}
```

### Hover Effects

```tsx
function InteractiveShape({ shape }: { shape: Shape }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Animate hover
      meshRef.current.position.y = hovered ? 0.5 : 0;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      userData={{ shape }}
    >
      <planeGeometry args={[shape.width, shape.height]} />
      <meshStandardMaterial
        color={hovered ? '#7C3AED' : '#00C4CC'}
        emissive={hovered ? '#7C3AED' : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  );
}
```

## Performance Optimization

### Frame Rate Management

```tsx
import { useFrame } from '@react-three/fiber';

function OptimizedAnimation() {
  const lastUpdate = useRef(0);
  const FPS_LIMIT = 60;
  const frameInterval = 1000 / FPS_LIMIT;

  useFrame((state, delta) => {
    const now = performance.now();

    if (now - lastUpdate.current >= frameInterval) {
      // Update logic here
      lastUpdate.current = now;
    }
  });

  return null;
}
```

### Conditional Rendering

```tsx
function ConditionalRenderer({ visible }: { visible: boolean }) {
  if (!visible) return null; // Don't render at all

  return <ExpensiveComponent />;
}
```

### Frustum Culling

```tsx
// Automatically handled by Three.js, but can be optimized
function OptimizedScene() {
  return (
    <group frustumCulled={true}>
      {/* Objects outside camera view won't be rendered */}
      <ShapeRenderer />
    </group>
  );
}
```

### Dispose Pattern

```tsx
function CleanupComponent() {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.Material>(null);

  useEffect(() => {
    return () => {
      // Cleanup to prevent memory leaks
      if (geometryRef.current) geometryRef.current.dispose();
      if (materialRef.current) materialRef.current.dispose();
    };
  }, []);

  return (
    <mesh>
      <planeGeometry ref={geometryRef} args={[10, 10]} />
      <meshStandardMaterial ref={materialRef} />
    </mesh>
  );
}
```

## Land Visualizer Specific Patterns

### Grid Background

```tsx
function GridBackground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial
        color="#228B22"
        roughness={0.9}
        map={grassTexture}
      />
    </mesh>
  );
}
```

### Shape Dimensions Display

```tsx
import { Html } from '@react-three/drei';

function ShapeDimensions({ shape }: { shape: Shape }) {
  const position = useMemo(() => [
    shape.x + shape.width / 2,
    0.5,
    shape.y + shape.height / 2
  ], [shape]);

  return (
    <Html position={position} center>
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '14px',
        whiteSpace: 'nowrap'
      }}>
        {shape.width.toFixed(1)}m × {shape.height.toFixed(1)}m
        <br />
        Area: {(shape.width * shape.height).toFixed(2)}m²
      </div>
    </Html>
  );
}
```

### Rotation Controls

```tsx
function RotationHandle({ shape, onRotate }: Props) {
  const [dragging, setDragging] = useState(false);
  const angleRef = useRef(0);

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;

    const angle = Math.atan2(
      event.point.z - shape.y,
      event.point.x - shape.x
    );

    // Snap to 45° if Shift is held
    const snappedAngle = event.shiftKey
      ? Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
      : angle;

    angleRef.current = snappedAngle;
    onRotate(snappedAngle);
  };

  return (
    <mesh
      position={[shape.x, 0, shape.y + shape.height / 2 + 2]}
      onPointerDown={() => setDragging(true)}
      onPointerUp={() => setDragging(false)}
      onPointerMove={handlePointerMove}
    >
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial
        color="#22C55E"
        emissive="#22C55E"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}
```

## Debugging Tools

### Stats Monitor

```tsx
import { Stats } from '@react-three/drei';

function DebugStats() {
  return process.env.NODE_ENV === 'development' ? <Stats /> : null;
}
```

### Performance Monitor

```tsx
import { Perf } from 'r3f-perf';

function PerformanceMonitor() {
  return (
    <Perf
      position="top-left"
      minimal={false}
      showGraph={true}
    />
  );
}
```

### Helper Objects

```tsx
function DebugHelpers() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      <axesHelper args={[100]} />
      <gridHelper args={[1000, 100]} />
      <cameraHelper args={[camera]} />
    </>
  );
}
```

## Common Issues and Solutions

### Issue: Low FPS

**Solutions:**
1. Use instanced rendering for repeated objects
2. Implement LOD for distant objects
3. Reduce shadow map size
4. Limit draw calls (merge geometries)
5. Use `frustumCulled={true}`

### Issue: Memory Leaks

**Solutions:**
1. Always dispose geometries and materials
2. Remove event listeners in cleanup
3. Clear textures when components unmount
4. Use `useMemo` for expensive computations

### Issue: Camera Bounds in Orthographic Mode

```tsx
// Save and restore bounds after re-render
const boundsRef = useRef({ left: 0, right: 0, top: 0, bottom: 0 });

useFrame(() => {
  if (camera.current) {
    // Restore bounds every frame
    Object.assign(camera.current, boundsRef.current);
    camera.current.updateProjectionMatrix();
  }
});
```

## Best Practices

1. **Use Refs for Animations**: Don't trigger re-renders in `useFrame`
2. **Memoize Expensive Calculations**: Use `useMemo` for geometry creation
3. **Dispose Resources**: Always clean up in `useEffect` return
4. **Limit Draw Calls**: Merge geometries, use instancing
5. **Optimize Materials**: Reuse materials when possible
6. **Monitor Performance**: Use Stats in development
7. **Frustum Culling**: Enable for all non-essential objects
8. **Adaptive DPR**: Use `dpr={[1, 2]}` for mobile performance

## Testing 3D Scenes

```tsx
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';

describe('3D Scene', () => {
  test('renders without crashing', () => {
    render(
      <Canvas>
        <ShapeRenderer shape={testShape} />
      </Canvas>
    );
  });

  test('handles camera transformation', () => {
    const { rerender } = render(<Camera2D />);
    expect(camera.position.y).toBe(100);

    rerender(<Camera3D />);
    expect(camera.position.y).toBe(50);
  });
});
```

## Summary

This skill provides comprehensive Three.js and React Three Fiber expertise for building high-performance 3D visualization in the Land Visualizer project. Use it for scene optimization, camera management, material creation, and interactive 3D element implementation. Always prioritize 60 FPS performance and proper resource cleanup.
