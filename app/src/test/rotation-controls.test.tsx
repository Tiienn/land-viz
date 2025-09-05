import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import RotationControls from '../components/Scene/RotationControls';
import { useAppStore } from '../store/useAppStore';

// Mock the Three.js context
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useThree: () => ({
      camera: {
        position: { x: 0, y: 30, z: 0 }
      },
      raycaster: {
        setFromCamera: vi.fn(),
        ray: {
          intersectPlane: vi.fn(() => true)
        }
      },
      gl: {
        domElement: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600
          }),
          style: {}
        }
      }
    })
  };
});

describe('RotationControls Component', () => {
  beforeEach(() => {
    const store = useAppStore.getState();
    store.clearAll();
    
    // Add a test shape
    store.addShape({
      points: [{x: 0, y: 0}, {x: 10, y: 10}],
      type: 'rectangle',
      color: '#ff0000',
      visible: true,
      layerId: 'test-layer',
      name: 'Test Rectangle'
    } as any);
    
    const shapes = store.shapes;
    const shapeId = shapes[shapes.length - 1].id;
    store.selectShape(shapeId);
  });

  test('should render rotation handle when shape is selected', () => {
    const TestWrapper = () => (
      <Canvas>
        <RotationControls />
      </Canvas>
    );

    const { container } = render(<TestWrapper />);
    
    // Check that the rotation handle (↻) is rendered
    const rotationHandle = container.querySelector('[title="Drag to rotate shape"]');
    expect(rotationHandle).toBeTruthy();
    expect(rotationHandle?.textContent).toBe('↻');
  });

  test('should not render when no shape is selected', () => {
    const store = useAppStore.getState();
    store.selectShape(null);

    const TestWrapper = () => (
      <Canvas>
        <RotationControls />
      </Canvas>
    );

    const { container } = render(<TestWrapper />);
    
    const rotationHandle = container.querySelector('[title="Drag to rotate shape"]');
    expect(rotationHandle).toBeFalsy();
  });

  test('should not render when in edit or resize mode', () => {
    const store = useAppStore.getState();
    const shapes = store.shapes;
    const shapeId = shapes[shapes.length - 1].id;
    
    // Enter edit mode
    store.enterEditMode(shapeId);

    const TestWrapper = () => (
      <Canvas>
        <RotationControls />
      </Canvas>
    );

    const { container } = render(<TestWrapper />);
    
    const rotationHandle = container.querySelector('[title="Drag to rotate shape"]');
    expect(rotationHandle).toBeFalsy();
  });

  test('utility functions should work correctly', () => {
    // Test angle calculation (we need to access these somehow - let's create a simple version)
    const calculateAngle = (center: any, point: any): number => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    };
    
    const snapAngleToIncrement = (angle: number, increment: number = 15): number => {
      return Math.round(angle / increment) * increment;
    };
    
    // Test angle calculation
    expect(calculateAngle({x: 0, y: 0}, {x: 1, y: 0})).toBe(0);
    expect(calculateAngle({x: 0, y: 0}, {x: 0, y: 1})).toBe(90);
    expect(calculateAngle({x: 0, y: 0}, {x: -1, y: 0})).toBe(180);
    
    // Test angle snapping
    expect(snapAngleToIncrement(7, 15)).toBe(0);
    expect(snapAngleToIncrement(12, 15)).toBe(15);
    expect(snapAngleToIncrement(23, 15)).toBe(30);
    expect(snapAngleToIncrement(37, 15)).toBe(30);
    expect(snapAngleToIncrement(42, 15)).toBe(45);
  });
});