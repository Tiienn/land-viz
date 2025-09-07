# Architecture Overview
**Land Visualizer Technical Architecture**  
*Version 1.1 | September 2025*

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                    │
├─────────────────────────────────────────────────────────┤
│                    React 18 + TypeScript                 │
├──────────────┬──────────────────┬──────────────────────┤
│   UI Layer   │  Business Logic  │   3D Rendering       │
│   (React)    │   (Services)     │   (Three.js)        │
├──────────────┴──────────────────┴──────────────────────┤
│                  Integration Layer                       │
├──────────────┬──────────────────┬──────────────────────┤
│  Standard    │   Chili3D        │     WebAssembly      │
│  JavaScript  │   Precision      │     Performance      │
└──────────────┴──────────────────┴──────────────────────┘
```

## 📁 Current Implementation Structure

```
app/src/
├── App.tsx                    # Main application with ribbon toolbar
├── components/               # React Components
│   ├── Scene/               # 3D Scene Components
│   │   ├── SceneManager.tsx        # Main 3D canvas wrapper
│   │   ├── CameraController.tsx    # Professional orbital controls  
│   │   ├── BackgroundManager.tsx   # Dynamic scene background management
│   │   ├── GridBackground.tsx      # Infinite grass grid texture
│   │   ├── DrawingCanvas.tsx       # Interactive 3D drawing with unified grid snapping
│   │   ├── DrawingFeedback.tsx     # Real-time drawing preview
│   │   ├── ShapeRenderer.tsx       # Shape visualization & rendering with rotation transforms
│   │   ├── EditableShapeControls.tsx # Sphere corners for editing
│   │   ├── ResizableShapeControls.tsx # Professional resize handles
│   │   ├── RotationControls.tsx    # Professional rotation with dynamic snapping
│   │   └── ShapeDimensions.tsx     # Dimension overlays
│   ├── ExportSettingsDialog.tsx    # Export configuration dialog
│   ├── LayerPanel.tsx             # Layer management modal
│   └── PropertiesPanel.tsx        # Tool properties & settings
│
├── store/                   # State Management (Zustand)
│   └── useAppStore.ts      # Complete application state
│       ├── Drawing state   # Active tool, current shape, edit mode
│       ├── Shape storage   # All drawn shapes with coordinates
│       ├── Layer system    # Layer visibility & organization  
│       ├── Undo/Redo      # History management
│       └── Export services # Excel, DXF, PDF, GeoJSON
│
├── types/                   # TypeScript Definitions
│   └── index.ts            # Shape, Point2D, Layer interfaces
│
└── services/ (planned)      # Future Business Logic
    ├── precision/          # Chili3D integration (future)
    ├── calculations/       # Advanced geometry operations  
    └── comparison/         # Size comparison objects
```

## 🔧 Key Architectural Features

### State Management (Zustand)
- **Single Store Pattern**: useAppStore.ts handles all application state
- **Reactive Updates**: Automatic UI re-rendering on state changes
- **Unified Grid State**: Single source of truth for grid functionality across all systems
- **Persist Layer**: Local storage for user preferences
- **Undo/Redo**: Built-in history management with keyboard shortcuts

### 3D Scene Architecture  
- **React Three Fiber**: Declarative 3D scene management
- **Component-Based**: Each 3D element is a React component
- **Real-time Rendering**: 60 FPS performance with Three.js
- **Interactive Controls**: Professional camera controls (right-orbit, middle-pan)

### Shape Management System
- **Edit Mode**: Toggle between view and edit modes
- **Corner Controls**: Draggable sphere corners for shape modification
- **Professional Rotation**: CAD-style rotation with contextual handles and dynamic snapping
- **Professional Resize**: Windows-style resize handles with aspect ratio control
- **Layer Support**: Organize shapes by layers with visibility controls
- **Type System**: Rectangle, Circle, Polyline with proper typing
- **Transform System**: Rotation metadata storage with separate drag and rotation transforms

### Drawing Tools Architecture
- **Tool Strategy Pattern**: Pluggable drawing tools (select, rectangle, circle, polyline)  
- **Real-time Feedback**: Live preview during drawing operations
- **Unified Grid System**: Synchronized visual grid, snapping, and status bar
- **Grid State Management**: Single source of truth for grid functionality
- **Dynamic Background**: Automatic scene background switching based on grid state
- **Visual Feedback**: Crosshair cursors and dimension displays

### Export System
- **Multi-format Support**: Excel (.xlsx), DXF, PDF, GeoJSON
- **Configurable Options**: User-defined export settings  
- **Shape Data**: Coordinates, areas, perimeters included
- **File Download**: Browser-based file generation

## 🔄 Current Implementation Patterns

```typescript
// Zustand Store Pattern
interface AppState {
  drawing: {
    activeTool: 'select' | 'rectangle' | 'circle' | 'polyline';
    isDrawing: boolean;
    isEditMode: boolean;
    isRotateMode: boolean;
    isResizeMode: boolean;
    currentShape: Shape | null;
    rotatingShapeId: string | null;
    snapping: {
      config: {
        activeTypes: Set<'grid' | 'shape'>;
        gridSize: number;
      };
    };
  };
  shapes: Shape[];
  layers: Layer[];
  selectedShapeId: string | null;
  dragState: {
    isDragging: boolean;
    draggedShapeId: string | null;
    startPosition: Point2D | null;
    currentPosition: Point2D | null;
  };
}

// Component Pattern
const EditableShapeControls: React.FC = () => {
  const { drawing, shapes, selectCorner } = useAppStore();
  // Render sphere corners only in edit mode
};
```

├── utils/                 # Utility Functions
│   ├── geometry.ts        # Geometry helpers
│   ├── math.ts           # Math utilities
│   ├── validation.ts     # Input validation
│   └── performance.ts    # Performance monitoring
│
└── types/                 # TypeScript Definitions
    ├── geometry.d.ts      # Shape types
    ├── calculations.d.ts  # Calculation types
    └── chili3d.d.ts      # Chili3D types
```

## 🔄 Data Flow Architecture

### State Management Pattern

```typescript
// Unidirectional data flow with Context API
interface AppState {
  drawing: DrawingState;
  calculations: CalculationState;
  visualization: VisualizationState;
  settings: SettingsState;
}

// State flow
User Action → Dispatch → Reducer → State Update → UI Re-render
                            ↓
                    Side Effects (calculations, 3D updates)
```

### Component Communication

```
┌─────────────────┐
│   App.tsx       │
│  (State Root)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Canvas │ │Toolbar│
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
   ┌─────▼─────┐
   │  Services │
   └───────────┘
```

## 🎯 Core Design Patterns

### 1. **Facade Pattern for Chili3D**
```typescript
// Simplified interface for complex Chili3D operations
class Chili3DFacade {
  private geometryEngine: ChiliGeometry;
  private wasmModule: WasmModule;
  
  async calculatePreciseArea(points: Point[]): Promise<number> {
    // Hide complexity behind simple interface
    const shape = this.convertToChiliFormat(points);
    return this.wasmModule.calculateArea(shape);
  }
}
```

### 2. **Strategy Pattern for Calculations**
```typescript
interface CalculationStrategy {
  calculateArea(points: Point[]): number;
  calculatePerimeter(points: Point[]): number;
}

class StandardCalculation implements CalculationStrategy { }
class PrecisionCalculation implements CalculationStrategy { }

// Runtime strategy selection
const calculator = usePrecisionMode 
  ? new PrecisionCalculation() 
  : new StandardCalculation();
```

### 3. **Observer Pattern for Real-time Updates**
```typescript
class DrawingObservable {
  private observers: Observer[] = [];
  
  subscribe(observer: Observer) {
    this.observers.push(observer);
  }
  
  notify(change: DrawingChange) {
    this.observers.forEach(o => o.update(change));
  }
}
```

### 4. **Composite Pattern for 3D Objects**
```typescript
abstract class SceneObject {
  abstract render(): void;
  abstract update(): void;
}

class LandShape extends SceneObject { }
class ComparisonObject extends SceneObject { }
class CompositeObject extends SceneObject {
  children: SceneObject[] = [];
}
```

## 🚀 Performance Architecture

### Rendering Pipeline

```
User Input → Request Animation Frame → Update Loop
                                           │
                                    ┌──────┴──────┐
                                    │             │
                              Calculate      Update 3D
                              (Web Worker)   (Main Thread)
                                    │             │
                                    └──────┬──────┘
                                           │
                                       Render Frame
```

### Optimization Strategies

#### 1. **Code Splitting**
```javascript
// Lazy load heavy modules
const Chili3DModule = lazy(() => import('./integrations/chili3d'));
const ExportModule = lazy(() => import('./services/export'));
```

#### 2. **Web Workers for Calculations**
```javascript
// offload-calculations.worker.js
self.onmessage = (e) => {
  const { points } = e.data;
  const area = calculateArea(points);
  self.postMessage({ area });
};
```

#### 3. **WebAssembly for Performance**
```javascript
// Load WASM module asynchronously
async function loadWasmModule() {
  const module = await WebAssembly.instantiateStreaming(
    fetch('/wasm/geometry.wasm')
  );
  return module.instance.exports;
}
```

#### 4. **Three.js Optimizations**
```javascript
// Level of Detail (LOD)
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);

// Instanced rendering for repeated objects
const instancedMesh = new THREE.InstancedMesh(
  geometry, material, count
);
```

## 🔒 Security Architecture

### Client-Side Security
```typescript
// Input validation
class InputValidator {
  validatePoints(points: Point[]): ValidationResult {
    // Prevent XSS, injection attacks
    return this.sanitize(points);
  }
}

// Content Security Policy
const CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "blob:"]
};
```

## 🔌 Integration Architecture

### Chili3D Integration Layers

```
Application Layer
       ↓
┌──────────────┐
│   Adapter    │ ← Converts between formats
└──────┬───────┘
       ↓
┌──────────────┐
│  Chili3D API │ ← Professional CAD operations
└──────┬───────┘
       ↓
┌──────────────┐
│     WASM     │ ← High-performance calculations
└──────────────┘
```

### Progressive Enhancement Strategy

```typescript
class FeatureDetector {
  async getAvailableFeatures(): Features {
    return {
      basic: true, // Always available
      webgl: 'WebGLRenderingContext' in window,
      wasm: 'WebAssembly' in window,
      precision: await this.checkChili3DAvailable(),
      workers: 'Worker' in window
    };
  }
}

// Graceful degradation
if (features.wasm && features.precision) {
  // Use Chili3D precision
} else if (features.workers) {
  // Use web workers
} else {
  // Fallback to main thread
}
```

## 📊 Data Models

### Core Data Structures

```typescript
// Geometry types
interface Point {
  x: number;
  y: number;
  z?: number;
}

interface Shape {
  id: string;
  points: Point[];
  closed: boolean;
  area?: number;
  perimeter?: number;
}

// Calculation results
interface CalculationResult {
  area: number;
  perimeter: number;
  dimensions: {
    width: number;
    height: number;
  };
  unit: UnitType;
  precision: 'standard' | 'professional';
}

// Comparison data
interface ComparisonObject {
  id: string;
  name: string;
  area: number;
  icon: string;
  category: 'sports' | 'building' | 'vehicle' | 'nature';
}
```

## 🔄 Build Architecture

### Build Pipeline

```
Source Files → TypeScript Compilation → Bundle
                                           ↓
                                    Code Splitting
                                           ↓
                                 ┌─────────┴─────────┐
                                 │                   │
                            Main Bundle         Lazy Chunks
                                 │                   │
                                 └─────────┬─────────┘
                                           ↓
                                    Optimization
                                    (Minify, Tree-shake)
                                           ↓
                                    Production Build
```

### Module Federation

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'three': ['three', '@react-three/fiber'],
          'chili3d': ['@chili3d/geo', '@chili3d/io'],
        }
      }
    }
  }
}
```

## 🧪 Testing Architecture

### Test Pyramid

```
         E2E Tests
        /    5%    \
       /            \
      Integration Tests
     /      15%        \
    /                   \
   Unit Tests & Component Tests
  /          80%                \
 /______________________________\
```

### Testing Strategy

```typescript
// Unit tests for services
describe('CalculationService', () => {
  test('calculates area correctly', () => {
    const area = calculateArea(testPoints);
    expect(area).toBeCloseTo(expectedArea, 2);
  });
});

// Component tests
describe('ShapeDrawer', () => {
  test('completes shape after 3 points', () => {
    render(<ShapeDrawer />);
    // Add 3 points
    expect(shape.closed).toBe(true);
  });
});

// E2E tests
describe('User Journey', () => {
  test('draw and compare land', () => {
    cy.visit('/');
    cy.drawShape(points);
    cy.selectComparison('soccer-field');
    cy.contains('2.5 soccer fields');
  });
});
```

## 📈 Monitoring & Analytics

### Performance Monitoring

```typescript
class PerformanceMonitor {
  trackMetric(name: string, value: number) {
    // Send to analytics
    analytics.track('performance', { name, value });
    
    // Log if exceeds threshold
    if (value > thresholds[name]) {
      console.warn(`Performance degradation: ${name}`);
    }
  }
}

// Key metrics to track
const metrics = {
  fps: 60,
  loadTime: 3000,
  calculationTime: 100,
  renderTime: 16.67
};
```

## 🚦 Error Handling

### Error Boundary Strategy

```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to error tracking service
    errorTracker.log(error, info);
    
    // Fallback UI
    this.setState({ hasError: true });
  }
}

// Graceful degradation
try {
  // Try precision calculation
  result = await precisionCalculator.calculate(shape);
} catch (error) {
  // Fallback to standard
  result = standardCalculator.calculate(shape);
  console.warn('Falling back to standard calculation');
}
```

## 🔮 Future Architecture Considerations

### Planned Enhancements

1. **Microservices Architecture** (2026)
   - Separate calculation service
   - Independent rendering service
   - API gateway

2. **Real-time Collaboration** (2026)
   - WebSocket connections
   - Operational Transforms
   - Conflict resolution

3. **AI Integration** (2026)
   - Shape recognition
   - Intelligent suggestions
   - Predictive drawing

4. **Native Mobile Architecture**
   - React Native shared components
   - Platform-specific optimizations
   - Offline capabilities

---

*This architecture provides a scalable foundation for Land Visualizer while maintaining simplicity and performance. The modular design allows for easy integration of Chili3D's professional features without compromising the core user experience.*