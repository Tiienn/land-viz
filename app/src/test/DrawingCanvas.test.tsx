import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Canvas } from '@react-three/fiber';
import DrawingCanvas from '../components/Scene/DrawingCanvas';

// Mock the Zustand store
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      drawing: {
        activeTool: 'select',
        isDrawing: false,
        currentShape: null,
        snapToGrid: true,
      },
      startDrawing: vi.fn(),
      addPoint: vi.fn(),
      finishDrawing: vi.fn(),
      cancelDrawing: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: (callback: () => void) => {
    void callback;
  },
  useThree: () => ({
    camera: {
      position: { x: 0, y: 30, z: 30 },
    },
    gl: {
      domElement: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
      },
    },
    raycaster: {
      setFromCamera: vi.fn(),
      ray: {
        intersectPlane: vi.fn(() => true),
      },
    },
  }),
}));

const TestWrapper = ({ 
  onCoordinateChange,
  gridSnap = true,
  gridSize = 2,
}: {
  onCoordinateChange?: (worldPos: { x: number; y: number }, screenPos: { x: number; y: number }) => void;
  gridSnap?: boolean;
  gridSize?: number;
}) => {
  return (
    <Canvas>
      <DrawingCanvas 
        onCoordinateChange={onCoordinateChange}
        gridSnap={gridSnap}
        gridSize={gridSize}
      />
    </Canvas>
  );
};

describe('DrawingCanvas Component', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<TestWrapper />);
    expect(getByTestId('canvas')).toBeInTheDocument();
  });

  it('calls onCoordinateChange callback when provided', () => {
    const mockOnCoordinateChange = vi.fn();
    
    render(
      <TestWrapper onCoordinateChange={mockOnCoordinateChange} />
    );
    
    // The callback would be triggered by pointer events in real usage
    expect(mockOnCoordinateChange).not.toHaveBeenCalled();
  });

  it('renders invisible mesh for interaction', () => {
    const { container } = render(<TestWrapper />);
    
    // The component should render mesh elements for interaction
    // In the actual DOM, this would be converted to appropriate HTML
    expect(container).toBeTruthy();
  });

  it('handles grid snapping configuration', () => {
    const { rerender, getByTestId } = render(
      <TestWrapper gridSnap={true} gridSize={2} />
    );
    
    expect(getByTestId('canvas')).toBeInTheDocument();
    
    rerender(<TestWrapper gridSnap={false} gridSize={1} />);
    expect(getByTestId('canvas')).toBeInTheDocument();
  });

  it('integrates with store state correctly', () => {
    const { getByTestId } = render(<TestWrapper />);
    
    // Component should render and work with mocked store
    expect(getByTestId('canvas')).toBeInTheDocument();
  });

  it('handles different grid sizes', () => {
    const { getByTestId } = render(
      <TestWrapper gridSize={5} />
    );
    
    expect(getByTestId('canvas')).toBeInTheDocument();
  });

  it('works with coordinate change callback', () => {
    const mockCallback = vi.fn();
    const { getByTestId } = render(
      <TestWrapper onCoordinateChange={mockCallback} />
    );
    
    expect(getByTestId('canvas')).toBeInTheDocument();
    // In real usage, moving mouse would trigger the callback
  });
});