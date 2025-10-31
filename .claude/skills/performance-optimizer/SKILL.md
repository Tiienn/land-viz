---
name: "Performance Optimizer"
description: "Optimize application performance including bundle size, rendering speed, memory usage, network requests, and runtime efficiency. Expert in React optimization, Three.js performance, WebAssembly, code splitting, lazy loading, and performance profiling"
version: "1.0.0"
dependencies:
  - "react@>=18.0.0"
  - "vite@>=5.0.0"
  - "three@>=0.157.0"
---

# Performance Optimization Specialist

## Overview

This skill provides expertise in application performance optimization, monitoring, and budget enforcement for the Land Visualizer project. Focus on achieving 60 FPS, fast load times, efficient memory usage, and maintaining performance budgets.

## When to Use This Skill

- Optimizing bundle size and load times
- Improving rendering performance (FPS)
- Reducing memory usage and preventing leaks
- Implementing code splitting and lazy loading
- Profiling and debugging performance issues
- Setting up performance monitoring
- Enforcing performance budgets

## Performance Budgets

### Defined Targets

```typescript
const PERFORMANCE_BUDGETS = {
  // Load time
  initialLoad: 3000, // ms (3G network)
  timeToInteractive: 5000, // ms

  // Runtime performance
  fps: {
    desktop: 60,
    mobile: 30
  },

  // Bundle size
  bundleSize: {
    total: 5000000, // 5MB
    main: 1000000, // 1MB
    chunks: 500000 // 500KB per chunk
  },

  // Operations
  storeOperations: {
    addShape: 5, // ms
    updateShape: 3, // ms
    deleteShape: 2, // ms
    selectShape: 1 // ms
  },

  calculations: {
    areaCalculation: 10, // ms
    distanceCalculation: 2, // ms
    conversionCalculation: 5, // ms
    validationCheck: 3 // ms
  },

  // Memory
  memoryUsage: {
    maxShapes: 1000,
    maxMeasurements: 500,
    maxConversions: 100
  }
};
```

### Budget Enforcement

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  measurePerformance<T>(
    name: string,
    fn: () => T,
    budget?: number
  ): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    // Record metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    // Check budget
    if (budget && duration > budget) {
      console.warn(
        `Performance budget exceeded for ${name}: ${duration.toFixed(2)}ms (budget: ${budget}ms)`
      );
    }

    return result;
  }

  getStats(name: string) {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return null;

    return {
      count: metrics.length,
      average: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      p95: this.percentile(metrics, 95),
      p99: this.percentile(metrics, 99)
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

## React Performance Optimization

### useMemo for Expensive Calculations

```tsx
function PropertyCalculations({ shape }: { shape: Shape }) {
  // Memoize expensive calculations
  const area = useMemo(() => {
    return performanceMonitor.measurePerformance(
      'area-calculation',
      () => calculatePolygonArea(shape.points),
      PERFORMANCE_BUDGETS.calculations.areaCalculation
    );
  }, [shape.points]);

  const perimeter = useMemo(() => {
    return performanceMonitor.measurePerformance(
      'perimeter-calculation',
      () => calculatePerimeter(shape.points),
      PERFORMANCE_BUDGETS.calculations.distanceCalculation
    );
  }, [shape.points]);

  return (
    <div>
      <p>Area: {area.toFixed(2)}m²</p>
      <p>Perimeter: {perimeter.toFixed(2)}m</p>
    </div>
  );
}
```

### useCallback for Event Handlers

```tsx
function DrawingCanvas() {
  const handleClick = useCallback((event: MouseEvent) => {
    performanceMonitor.measurePerformance(
      'click-handler',
      () => {
        const point = getCanvasPoint(event);
        addPoint(point);
      },
      10 // 10ms budget
    );
  }, [addPoint]);

  return <canvas onClick={handleClick} />;
}
```

### React.memo for Component Optimization

```tsx
const ShapeRenderer = React.memo(({ shape }: { shape: Shape }) => {
  return (
    <mesh position={[shape.x, 0, shape.y]}>
      <planeGeometry args={[shape.width, shape.height]} />
      <meshStandardMaterial color={shape.color} />
    </mesh>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.height === nextProps.shape.height
  );
});
```

### Virtualization for Long Lists

```tsx
import { FixedSizeList } from 'react-window';

function ShapeList({ shapes }: { shapes: Shape[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ShapeItem shape={shapes[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={shapes.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Code Splitting and Lazy Loading

### Route-Based Code Splitting

```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const ExportDialog = lazy(() => import('./components/ExportDialog'));
const LayerPanel = lazy(() => import('./components/LayerPanel'));
const PropertiesPanel = lazy(() => import('./components/PropertiesPanel'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showExport && <ExportDialog />}
      {showLayers && <LayerPanel />}
      {showProperties && <PropertiesPanel />}
    </Suspense>
  );
}
```

### Dynamic Imports

```typescript
// Load geometry only when needed
const loadGeometry = async (geometryName: string) => {
  const start = performance.now();

  const geometry = await import(`./geometries/${geometryName}.ts`);

  const loadTime = performance.now() - start;
  console.log(`Loaded ${geometryName} in ${loadTime.toFixed(2)}ms`);

  return geometry.default;
};
```

### Vite Code Splitting Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'utils': ['decimal.js', '@turf/turf'],
          'ui': ['zustand']
        }
      }
    },
    chunkSizeWarningLimit: 500 // 500KB warning
  }
});
```

## Three.js Performance Optimization

### Geometry Disposal

```tsx
function ShapeComponent({ shape }: { shape: Shape }) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.Material>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  return (
    <mesh>
      <planeGeometry ref={geometryRef} args={[shape.width, shape.height]} />
      <meshStandardMaterial ref={materialRef} color={shape.color} />
    </mesh>
  );
}
```

### Instanced Rendering

```tsx
function ComparisonObjects({ objects }: { objects: RefObject[] }) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const matrix = new THREE.Matrix4();

    objects.forEach((obj, i) => {
      matrix.setPosition(obj.x, 0, obj.y);
      instancedMeshRef.current!.setMatrixAt(i, matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [objects]);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[null, null, objects.length]}
    >
      <boxGeometry />
      <meshStandardMaterial />
    </instancedMesh>
  );
}
```

### Frustum Culling

```tsx
function OptimizedScene() {
  return (
    <group frustumCulled={true}>
      {/* Only visible objects will be rendered */}
      {shapes.map(shape => (
        <ShapeRenderer key={shape.id} shape={shape} />
      ))}
    </group>
  );
}
```

### Frame Rate Limiting

```tsx
import { useFrame } from '@react-three/fiber';

function AnimationController() {
  const lastUpdate = useRef(0);
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;

  useFrame((state, delta) => {
    const now = performance.now();

    if (now - lastUpdate.current >= frameInterval) {
      // Update logic
      updateAnimations();
      lastUpdate.current = now;
    }
  });

  return null;
}
```

## Memory Management

### Memory Leak Prevention

```tsx
function ComponentWithEventListener() {
  useEffect(() => {
    const handleResize = () => {
      // Handle resize
    };

    window.addEventListener('resize', handleResize);

    // Cleanup!
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div>Content</div>;
}
```

### WeakMap for Caching

```typescript
// Use WeakMap for object caching (auto garbage collection)
const geometryCache = new WeakMap<Shape, THREE.BufferGeometry>();

const getGeometry = (shape: Shape): THREE.BufferGeometry => {
  if (geometryCache.has(shape)) {
    return geometryCache.get(shape)!;
  }

  const geometry = createGeometry(shape);
  geometryCache.set(shape, geometry);
  return geometry;
};
```

### Memory Monitoring

```typescript
const checkMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  return null;
};

// Monitor memory every 10 seconds
setInterval(() => {
  const memory = checkMemoryUsage();
  if (memory && memory.percentage > 90) {
    console.warn('Memory usage high:', memory.percentage.toFixed(2) + '%');
  }
}, 10000);
```

## Bundle Size Optimization

### Tree Shaking

```typescript
// Import only what you need
import { calculateArea } from '@turf/turf'; // ❌ Imports entire library
import calculateArea from '@turf/area'; // ✅ Imports only area module
```

### Dynamic Imports for Heavy Libraries

```typescript
// Load Three.js helpers only when needed
const loadDreiHelpers = async () => {
  const { OrbitControls, Sky, Environment } = await import('@react-three/drei');
  return { OrbitControls, Sky, Environment };
};
```

### Externalize Large Dependencies

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['three'] // If using CDN
    }
  }
});
```

## Network Optimization

### Resource Hints

```html
<!-- In index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://api.example.com">
<link rel="preload" as="script" href="/main.js">
```

### Image Optimization

```typescript
// Use WebP with fallback
const optimizedImage = {
  webp: '/assets/image.webp',
  fallback: '/assets/image.jpg'
};

// Lazy load images
<img
  loading="lazy"
  src={optimizedImage.webp}
  onError={(e) => {
    e.currentTarget.src = optimizedImage.fallback;
  }}
/>
```

### Asset Compression

```typescript
// vite.config.ts
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip',
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false
    })
  ]
});
```

## Profiling and Debugging

### React Profiler

```tsx
import { Profiler } from 'react';

function App() {
  const onRenderCallback = (
    id: string,
    phase: "mount" | "update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    console.log({
      id,
      phase,
      actualDuration,
      baseDuration
    });
  };

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <AppContent />
    </Profiler>
  );
}
```

### Performance.mark and Performance.measure

```typescript
// Mark important points
performance.mark('shape-creation-start');

// Do expensive operation
createShape();

performance.mark('shape-creation-end');

// Measure duration
performance.measure(
  'shape-creation',
  'shape-creation-start',
  'shape-creation-end'
);

// Get measurements
const measures = performance.getEntriesByType('measure');
console.log(measures);
```

### Chrome DevTools Performance API

```typescript
const measureFunction = async <T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> => {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  performance.mark(startMark);

  const result = await fn();

  performance.mark(endMark);
  performance.measure(name, startMark, endMark);

  const [measure] = performance.getEntriesByName(name);
  console.log(`${name}: ${measure.duration.toFixed(2)}ms`);

  // Cleanup
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(name);

  return result;
};

// Usage
await measureFunction('load-geometry', async () => {
  return await loadGeometry('eiffel-tower');
});
```

## Real-time Performance Monitoring

### FPS Counter

```tsx
import { useFrame } from '@react-three/fiber';

function FPSCounter() {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;

    const now = performance.now();
    const elapsed = now - lastTime.current;

    if (elapsed >= 1000) {
      const currentFps = (frameCount.current * 1000) / elapsed;
      setFps(Math.round(currentFps));

      frameCount.current = 0;
      lastTime.current = now;

      // Warn if below budget
      if (currentFps < PERFORMANCE_BUDGETS.fps.desktop) {
        console.warn(`FPS below budget: ${currentFps}`);
      }
    }
  });

  return (
    <div style={{ position: 'fixed', top: 10, right: 10 }}>
      FPS: {fps}
    </div>
  );
}
```

### Performance Dashboard

```tsx
function PerformanceMonitor() {
  const [stats, setStats] = useState({
    fps: 60,
    memory: 0,
    shapes: 0,
    drawCalls: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const memory = checkMemoryUsage();

      setStats({
        fps: getCurrentFPS(),
        memory: memory?.percentage || 0,
        shapes: getShapeCount(),
        drawCalls: getDrawCalls()
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-dashboard">
      <div>FPS: {stats.fps}</div>
      <div>Memory: {stats.memory.toFixed(1)}%</div>
      <div>Shapes: {stats.shapes}</div>
      <div>Draw Calls: {stats.drawCalls}</div>
    </div>
  );
}
```

## Performance Testing

### Automated Performance Tests

```typescript
import { describe, test, expect } from 'vitest';

describe('Performance Tests', () => {
  test('shape creation should complete within budget', () => {
    const budget = PERFORMANCE_BUDGETS.storeOperations.addShape;

    const duration = measurePerformance(() => {
      addShape({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 10,
        height: 10
      });
    });

    expect(duration).toBeLessThan(budget);
  });

  test('area calculation should be fast', () => {
    const points = generateRandomPoints(100);
    const budget = PERFORMANCE_BUDGETS.calculations.areaCalculation;

    const duration = measurePerformance(() => {
      calculatePolygonArea(points);
    });

    expect(duration).toBeLessThan(budget);
  });

  test('handles large number of shapes', () => {
    const shapes = Array.from({ length: 1000 }, (_, i) =>
      createShape('rectangle', { x: i, y: i, width: 10, height: 10 })
    );

    const duration = measurePerformance(() => {
      renderShapes(shapes);
    });

    expect(duration).toBeLessThan(100); // 100ms budget
  });
});
```

## Best Practices

### 1. Measure First, Optimize Second

```typescript
// Always profile before optimizing
const profileComponent = (Component: React.FC) => {
  return (props: any) => {
    const startTime = performance.now();

    useEffect(() => {
      const renderTime = performance.now() - startTime;
      console.log(`${Component.name} rendered in ${renderTime.toFixed(2)}ms`);
    });

    return <Component {...props} />;
  };
};
```

### 2. Use Production Builds for Testing

```bash
# Always test performance with production build
npm run build
npm run preview
```

### 3. Monitor Bundle Size

```bash
# Analyze bundle
npx vite-bundle-visualizer
```

### 4. Set Performance Budgets in CI/CD

```yaml
# GitHub Actions example
- name: Check Bundle Size
  run: |
    npm run build
    BUNDLE_SIZE=$(du -sk dist | cut -f1)
    if [ $BUNDLE_SIZE -gt 5000 ]; then
      echo "Bundle size exceeds 5MB!"
      exit 1
    fi
```

### 5. Use Performance Monitoring in Production

```typescript
// Track real user metrics
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
      }
    }
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });
}
```

## Performance Checklist

- [ ] Bundle size < 5MB
- [ ] Initial load time < 3s on 3G
- [ ] FPS consistently at 60 (desktop) / 30+ (mobile)
- [ ] No memory leaks (tested with Chrome DevTools)
- [ ] Code splitting implemented for heavy components
- [ ] Images optimized (WebP with fallback)
- [ ] Tree shaking configured
- [ ] Production build tested
- [ ] Performance budgets enforced in tests
- [ ] Real user monitoring in place

## Summary

This skill provides comprehensive performance optimization expertise for the Land Visualizer project. Use it when optimizing bundle size, improving FPS, reducing memory usage, or implementing performance monitoring. Always measure first, set budgets, and enforce them through automated testing. Prioritize user-perceived performance: fast initial load, smooth interactions, and responsive UI.
