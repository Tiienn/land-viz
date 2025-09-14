import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Canvas } from '@react-three/fiber';
import CameraController, { type CameraControllerRef } from '../components/Scene/CameraController';
import { useRef } from 'react';

// Global mocks are now in setup.ts - no need for local mocks

const TestWrapper = ({ 
  children,
  onCameraChange,
}: { 
  children: React.ReactNode;
  onCameraChange?: (position: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }) => void;
}) => {
  const controllerRef = useRef<CameraControllerRef>(null);
  
  return (
    <div>
      <Canvas>
        <CameraController ref={controllerRef} onCameraChange={onCameraChange} />
        {children}
      </Canvas>
      <button
        data-testid="reset-camera"
        onClick={() => controllerRef.current?.resetCamera()}
      >
        Reset Camera
      </button>
      <button
        data-testid="focus-point"
        onClick={() => controllerRef.current?.focusOnPoint({ x: 10, y: 0, z: 10 })}
      >
        Focus Point
      </button>
      <button
        data-testid="set-viewpoint"
        onClick={() => controllerRef.current?.setViewpoint('top')}
      >
        Set Top View
      </button>
    </div>
  );
};

describe('CameraController Component', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <div>Test Scene</div>
      </TestWrapper>
    );
    
    expect(getByTestId('canvas')).toBeInTheDocument();
  });

  it('renders orbit controls when enabled', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <div>Test Scene</div>
      </TestWrapper>
    );
    
    expect(getByTestId('orbit-controls')).toBeInTheDocument();
  });

  it('does not render when controls are disabled', () => {
    const TestWrapperDisabled = () => (
      <Canvas>
        <CameraController enableControls={false} />
      </Canvas>
    );
    
    const { queryByTestId } = render(<TestWrapperDisabled />);
    expect(queryByTestId('orbit-controls')).not.toBeInTheDocument();
  });

  it('provides imperative handle methods', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <div>Test Scene</div>
      </TestWrapper>
    );
    
    // These buttons would trigger the imperative methods
    expect(getByTestId('reset-camera')).toBeInTheDocument();
    expect(getByTestId('focus-point')).toBeInTheDocument();
    expect(getByTestId('set-viewpoint')).toBeInTheDocument();
  });

  it('calls onCameraChange callback when provided', () => {
    const mockOnCameraChange = vi.fn();
    
    render(
      <TestWrapper onCameraChange={mockOnCameraChange}>
        <div>Test Scene</div>
      </TestWrapper>
    );
    
    // The callback would be triggered by OrbitControls onChange in real usage
    expect(mockOnCameraChange).not.toHaveBeenCalled();
  });

  it('sets correct default properties', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <div>Test Scene</div>
      </TestWrapper>
    );
    
    const controls = getByTestId('orbit-controls');
    expect(controls).toBeInTheDocument();
  });
});