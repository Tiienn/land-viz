import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, test, expect } from 'vitest';
import { ReferenceObjectRenderer } from '../ReferenceObjectRenderer';
import { REFERENCE_OBJECTS } from '../../../data/referenceObjects';

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the EiffelTowerGeometry module
vi.mock('../../../geometries/EiffelTowerGeometry', () => ({
  EiffelTowerGeometry: vi.fn().mockImplementation(() => ({
    getGeometry: vi.fn().mockReturnValue({
      name: 'eiffel-tower',
      children: [],
      clone: vi.fn().mockReturnValue({
        name: 'eiffel-tower-clone',
        children: []
      })
    }),
    dispose: vi.fn()
  }))
}));

describe('Eiffel Tower Integration', () => {
  test('Eiffel Tower 3D object exists in reference objects', () => {
    const eiffelTower = REFERENCE_OBJECTS.find(obj => obj.id === 'eiffel-tower-3d');

    expect(eiffelTower).toBeDefined();
    expect(eiffelTower?.name).toBe('Eiffel Tower (3D)');
    expect(eiffelTower?.category).toBe('landmarks');
    expect(eiffelTower?.geometry.type).toBe('eiffel-tower');
  });

  test('Eiffel Tower has correct dimensions', () => {
    const eiffelTower = REFERENCE_OBJECTS.find(obj => obj.id === 'eiffel-tower-3d');

    expect(eiffelTower?.dimensions.length).toBe(125);
    expect(eiffelTower?.dimensions.width).toBe(125);
    expect(eiffelTower?.dimensions.height).toBe(50);
    expect(eiffelTower?.area).toBe(15625); // 125 × 125
  });

  test('Eiffel Tower has correct metadata', () => {
    const eiffelTower = REFERENCE_OBJECTS.find(obj => obj.id === 'eiffel-tower-3d');

    expect(eiffelTower?.metadata.accuracy).toBe('exact');
    expect(eiffelTower?.metadata.popularity).toBe(10);
    expect(eiffelTower?.metadata.description).toContain('3D model');
    expect(eiffelTower?.metadata.description).toContain('lattice structure');
  });

  test('Eiffel Tower material settings are correct', () => {
    const eiffelTower = REFERENCE_OBJECTS.find(obj => obj.id === 'eiffel-tower-3d');

    expect(eiffelTower?.material.color).toBe('#8b4513');
    expect(eiffelTower?.material.opacity).toBe(0.8);
    expect(eiffelTower?.material.wireframe).toBe(false);
  });

  test('ReferenceObjectRenderer handles Eiffel Tower geometry type', () => {
    const visibleObjectIds = ['eiffel-tower-3d'];
    const userLandBounds = {
      min: { x: -100, y: -100 },
      max: { x: 100, y: 100 }
    };

    const { container } = render(
      <ReferenceObjectRenderer
        visibleObjectIds={visibleObjectIds}
        userLandBounds={userLandBounds}
      />
    );

    // The component should render without errors
    expect(container).toBeInTheDocument();
  });

  test('Both Eiffel Tower versions exist (base and 3D)', () => {
    const eiffelBase = REFERENCE_OBJECTS.find(obj => obj.id === 'eiffel-tower-base');
    const eiffel3D = REFERENCE_OBJECTS.find(obj => obj.id === 'eiffel-tower-3d');

    expect(eiffelBase).toBeDefined();
    expect(eiffel3D).toBeDefined();

    // Base version is a simple box
    expect(eiffelBase?.geometry.type).toBe('box');

    // 3D version uses custom geometry
    expect(eiffel3D?.geometry.type).toBe('eiffel-tower');

    // Both have same base area
    expect(eiffelBase?.area).toBe(eiffel3D?.area);
  });

  test('Eiffel Tower geometry parameters are set correctly', () => {
    const eiffelTower = REFERENCE_OBJECTS.find(obj => obj.id === 'eiffel-tower-3d');

    expect(eiffelTower?.geometry.parameters?.detailLevel).toBe('medium');
    expect(eiffelTower?.geometry.parameters?.segments).toBe(20);
  });
});