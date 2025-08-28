import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../components/Scene/SceneManager';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="canvas" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Grid: () => <div data-testid="grid" />,
  Environment: () => <div data-testid="environment" />,
}));

describe('SceneManager Component', () => {
  it('renders canvas container', () => {
    const { getByTestId } = render(<SceneManager />);
    expect(getByTestId('canvas')).toBeInTheDocument();
  });

  it('renders with default settings', () => {
    const { getByTestId } = render(<SceneManager />);
    expect(getByTestId('orbit-controls')).toBeInTheDocument();
    expect(getByTestId('grid')).toBeInTheDocument();
    expect(getByTestId('environment')).toBeInTheDocument();
  });

  it('can disable grid with settings', () => {
    const { queryByTestId } = render(
      <SceneManager settings={{ showGrid: false }} />
    );
    expect(queryByTestId('grid')).not.toBeInTheDocument();
  });

  it('can disable orbit controls with settings', () => {
    const { queryByTestId } = render(
      <SceneManager settings={{ enableOrbitControls: false }} />
    );
    expect(queryByTestId('orbit-controls')).not.toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnClick = vi.fn();
    render(<SceneManager onClick={mockOnClick} />);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('handles pointer move events', () => {
    const mockOnPointerMove = vi.fn();
    render(<SceneManager onPointerMove={mockOnPointerMove} />);
    expect(mockOnPointerMove).not.toHaveBeenCalled();
  });

  it('renders children when provided', () => {
    const { getByText } = render(
      <SceneManager>
        <div>Test Child</div>
      </SceneManager>
    );
    expect(getByText('Test Child')).toBeInTheDocument();
  });
});