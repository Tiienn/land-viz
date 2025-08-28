import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
  it('renders Land Visualizer heading', () => {
    render(<App />);
    expect(screen.getByText('Land Visualizer')).toBeInTheDocument();
  });

  it('renders drawing tools sidebar', () => {
    render(<App />);
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Shapes')).toBeInTheDocument();
  });

  it('shows default active tool as select', () => {
    render(<App />);
    expect(screen.getByText('Active Tool:')).toBeInTheDocument();
    expect(screen.getByText('select')).toBeInTheDocument();
  });

  it('shows snap to grid is enabled by default', () => {
    render(<App />);
    expect(screen.getByText('Snap to Grid:')).toBeInTheDocument();
    expect(screen.getByText('On')).toBeInTheDocument();
  });
});