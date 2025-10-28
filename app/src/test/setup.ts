import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React, { type ReactNode } from 'react';

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock canvas with proper domElement support (declare first)
const mockCanvas = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
  })),
  style: {},
  width: 800,
  height: 600,
  clientWidth: 800,
  clientHeight: 600,
  offsetWidth: 800,
  offsetHeight: 600,
};

// Mock WebGL context with comprehensive GL properties
const createMockWebGLRenderingContext = () => ({
  canvas: mockCanvas,
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  clearDepth: vi.fn(),
  viewport: vi.fn(),
  createShader: vi.fn(() => ({})),
  createProgram: vi.fn(() => ({})),
  createBuffer: vi.fn(() => ({})),
  createTexture: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  generateMipmap: vi.fn(),
  getExtension: vi.fn(() => ({})),
  getParameter: vi.fn(() => 'Mock WebGL'),
  TRIANGLES: 4,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
});

// Add getContext method after WebGL context is defined
mockCanvas.getContext = vi.fn(() => createMockWebGLRenderingContext());

// Override document.createElement to return our mock canvas
const originalCreateElement = document.createElement.bind(document);
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn((tagName: string) => {
    if (tagName === 'canvas') return mockCanvas;
    return originalCreateElement(tagName);
  }),
});

// Factory function for creating Vector3 mocks with all methods
const createVector3Mock = (x = 0, y = 0, z = 0): any => {
  const vec = {
    x, y, z,
    set: vi.fn(function(this: any, newX: number, newY: number, newZ: number) {
      this.x = newX;
      this.y = newY;
      this.z = newZ;
      return this;
    }),
    copy: vi.fn(function(this: any, v: any) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }),
    clone: vi.fn(function(this: any) {
      // Return a new Vector3 mock with the same values
      return createVector3Mock(this.x, this.y, this.z);
    }),
    distanceTo: vi.fn(() => 50),
    normalize: vi.fn(function(this: any) {
      const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      if (length > 0) {
        this.x /= length;
        this.y /= length;
        this.z /= length;
      }
      return this;
    }),
    multiplyScalar: vi.fn(function(this: any, scalar: number) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return this;
    }),
    add: vi.fn(function(this: any, v: any) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    }),
    sub: vi.fn(function(this: any, v: any) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      return this;
    }),
    subVectors: vi.fn(function(this: any, a: any, b: any) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    }),
    addVectors: vi.fn(function(this: any, a: any, b: any) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;
      return this;
    }),
    length: vi.fn(function(this: any) {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }),
    lengthSq: vi.fn(function(this: any) {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }),
  };
  return vec;
};

// Mock Three.js Vector3 and other essential classes
vi.mock('three', async () => {
  const originalThree = await vi.importActual('three');
  return {
    ...originalThree,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: mockCanvas,
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      shadowMap: { enabled: false },
      toneMapping: 0,
      toneMappingExposure: 1,
    })),
    PerspectiveCamera: vi.fn().mockImplementation(() => ({
      position: { x: 0, y: 30, z: 30, set: vi.fn(), distanceTo: vi.fn(() => 50) },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
      aspect: 1.33,
    })),
    Scene: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
    })),
    Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => createVector3Mock(x, y, z)),
    Vector2: vi.fn().mockImplementation((x = 0, y = 0) => ({
      x, y,
      set: vi.fn(function(this: any, newX: number, newY: number) {
        this.x = newX;
        this.y = newY;
        return this;
      }),
    })),
    Plane: vi.fn().mockImplementation((normal: any, constant = 0) => ({
      normal: normal || { x: 0, y: 1, z: 0 },
      constant,
    })),
    Quaternion: vi.fn().mockImplementation((x = 0, y = 0, z = 0, w = 1) => ({
      x, y, z, w,
      setFromUnitVectors: vi.fn(function(this: any) {
        return this;
      }),
    })),
    Raycaster: vi.fn().mockImplementation(() => ({
      ray: {
        intersectPlane: vi.fn((plane: any, target: any) => {
          if (target) {
            target.x = 0;
            target.y = 0;
            target.z = 0;
          }
          return target;
        }),
      },
      setFromCamera: vi.fn(),
    })),
  };
});

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: vi.fn((props: { children?: ReactNode } & Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'canvas', ...props }, props.children);
  }),
  useThree: vi.fn(() => ({
    camera: {
      position: { x: 0, y: 30, z: 30, set: vi.fn(), distanceTo: vi.fn(() => 50) },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
      zoom: 1,
    },
    gl: {
      domElement: mockCanvas,
      setSize: vi.fn(),
      render: vi.fn(),
    },
    scene: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    raycaster: {
      ray: {
        intersectPlane: vi.fn((plane: any, target: any) => {
          if (target) {
            target.x = 0;
            target.y = 0;
            target.z = 0;
          }
          return target;
        }),
      },
      setFromCamera: vi.fn(),
    },
    size: { width: 800, height: 600 },
    viewport: { width: 800, height: 600 },
  })),
  useFrame: vi.fn((callback: () => void) => {
    // Mock useFrame - don't actually call the callback in tests
    void callback;
  }),
  extend: vi.fn(),
  createPortal: vi.fn(),
}));

// Mock React Three Drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: vi.fn((props: Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'orbit-controls', ...props });
  }),
  Grid: vi.fn((props: Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'grid', ...props });
  }),
  Environment: vi.fn((props: Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'environment', ...props });
  }),
  Text: vi.fn((props: { children?: ReactNode } & Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'text', ...props }, props.children);
  }),
  Html: vi.fn((props: { children?: ReactNode } & Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'html', ...props }, props.children);
  }),
  Sphere: vi.fn((props: Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'sphere', ...props });
  }),
  Box: vi.fn((props: Record<string, unknown>) => {
    return React.createElement('div', { 'data-testid': 'box', ...props });
  }),
  Line: vi.fn((props: Record<string, unknown>) => {
    // React is available globally
    return React.createElement('div', { 'data-testid': 'line', ...props });
  }),
}));

// Mock Zustand store
vi.mock('../store/useAppStore', () => {
  const mockState = {
    drawing: {
      activeTool: 'select',
      isDrawing: false,
      isEditMode: false,
      isResizeMode: false,
      resizingShapeId: null,
      gridEnabled: true,
      snapToGrid: true,
      showDimensions: true,
      showGrid: true,
      currentShape: null,
      liveResizePoints: null,
    },
    shapes: [],
    layers: [{ id: 'default', name: 'Default Layer', visible: true, locked: false }],
    activeLayerId: 'default',
    selectedShapeId: null,
    hoveredShapeId: null,
    dragState: { 
      isDragging: false, 
      draggedShapeId: null, 
      startPosition: null, 
      currentPosition: null 
    },
    snapping: {
      config: {
        enabled: true,
        snapToGrid: true,
        snapToShapes: false,
        tolerance: 10
      }
    },
    setActiveTool: vi.fn(),
    addShape: vi.fn(),
    updateShape: vi.fn(),
    deleteShape: vi.fn(),
    selectShape: vi.fn(),
    hoverShape: vi.fn(),
    clearSelection: vi.fn(),
    toggleShowDimensions: vi.fn(),
    toggleShowGrid: vi.fn(),
    toggleSnapToGrid: vi.fn(),
    enterEditMode: vi.fn(),
    exitEditMode: vi.fn(),
    enterRotateMode: vi.fn(),
    exitRotateMode: vi.fn(),
    enterResizeMode: vi.fn(),
    exitResizeMode: vi.fn(),
    startDragging: vi.fn(),
    updateDragPosition: vi.fn(),
    finishDragging: vi.fn(),
    cancelDragging: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    clearAll: vi.fn(),
    getTotalArea: vi.fn(() => 0),
    getShapeCount: vi.fn(() => 0),
    getAverageArea: vi.fn(() => 0),
  };

  return {
    useAppStore: vi.fn((selector) => {
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      return mockState;
    }),
  };
});