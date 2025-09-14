import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SceneManager } from '../components/Scene/SceneManager';

// Global mocks are now in setup.ts - no need for local mocks

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