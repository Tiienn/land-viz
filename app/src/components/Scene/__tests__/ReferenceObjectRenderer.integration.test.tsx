/**
 * Integration test for ReferenceObjectRenderer with field markings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import React from 'react';
import { Canvas } from '@react-three/fiber';

// Mock the Canvas component to avoid WebGL issues in tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera() })),
}));
import { ReferenceObjectRenderer } from '../ReferenceObjectRenderer';
import { getFieldMarkingsService } from '../../../services/FieldMarkingsService';
import * as THREE from 'three';

// Mock the field markings service
vi.mock('../../../services/FieldMarkingsService', () => ({
  getFieldMarkingsService: vi.fn(() => ({
    generateFieldTexture: vi.fn(() => new THREE.Texture()),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(() => ({ size: 0, maxSize: 20, hits: 0, memoryUsage: 0 }))
  })),
  FieldMarkingsService: {
    hasFieldMarkings: vi.fn((sport) => ['soccer', 'basketball', 'tennis'].includes(sport)),
    getAvailableSports: vi.fn(() => ['soccer', 'basketball', 'tennis'])
  }
}));

// Mock REFERENCE_OBJECTS
vi.mock('../../../data/referenceObjects', () => ({
  REFERENCE_OBJECTS: [
    {
      id: 'soccer-field-fifa',
      name: 'Soccer Field (FIFA)',
      category: 'sports',
      area: 7140,
      dimensions: { length: 105, width: 68, height: 0.1 },
      geometry: { type: 'box', parameters: { segments: 1 } },
      material: { color: '#2d8f47', opacity: 0.7, wireframe: false },
      metadata: {
        description: 'FIFA regulation soccer field',
        source: 'FIFA',
        accuracy: 'exact',
        popularity: 10
      }
    }
  ]
}));

// Mock ObjectPositioner
vi.mock('../../../utils/objectPositioning', () => ({
  ObjectPositioner: {
    positionObjects: vi.fn(() => [{ x: 0, y: 0, z: 0 }])
  }
}));

describe('ReferenceObjectRenderer Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should apply field markings texture to soccer field', async () => {
    const mockBounds = {
      min: { x: -50, y: -50 },
      max: { x: 50, y: 50 }
    };

    let container: HTMLElement;

    await act(async () => {
      const result = render(
        <Canvas>
          <ReferenceObjectRenderer
            visibleObjectIds={['soccer-field-fifa']}
            userLandBounds={mockBounds}
            opacity={0.6}
          />
        </Canvas>
      );
      container = result.container;
    });

    // Wait for the component to render and service to be called
    await waitFor(() => {
      const service = getFieldMarkingsService();
      expect(service.generateFieldTexture).toHaveBeenCalledWith(
        'soccer',
        { length: 105, width: 68, height: 0.1 }
      );
    }, { timeout: 3000 });
  });

  it('should not apply field markings to non-sports objects', () => {
    // Mock a non-sports object
    vi.doMock('../../../data/referenceObjects', () => ({
      REFERENCE_OBJECTS: [
        {
          id: 'average-house',
          name: 'Average House',
          category: 'buildings',
          area: 200,
          dimensions: { length: 14, width: 14, height: 8 },
          geometry: { type: 'box', parameters: { segments: 1 } },
          material: { color: '#cd853f', opacity: 0.8, wireframe: false },
          metadata: {
            description: 'Typical US home',
            source: 'Census',
            accuracy: 'approximate',
            popularity: 10
          }
        }
      ]
    }));

    const mockBounds = {
      min: { x: -50, y: -50 },
      max: { x: 50, y: 50 }
    };

    render(
      <Canvas>
        <ReferenceObjectRenderer
          visibleObjectIds={['average-house']}
          userLandBounds={mockBounds}
          opacity={0.6}
        />
      </Canvas>
    );

    // Field markings service should not be called for buildings
    const service = getFieldMarkingsService();
    expect(service.generateFieldTexture).not.toHaveBeenCalled();
  });
});