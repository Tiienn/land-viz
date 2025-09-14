import React from 'react';
import { vi } from 'vitest';
import { Canvas } from '@react-three/fiber';

/**
 * Test utility to wrap components that need Three.js Canvas context
 */
export const ThreeJSWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Canvas>
    {children}
  </Canvas>
);

/**
 * Mock implementations for commonly used Three.js objects
 */
export const createMockVector3 = (x = 0, y = 0, z = 0) => ({
  x, y, z,
  set: vi.fn(),
  copy: vi.fn(),
  clone: vi.fn(() => ({ x, y, z })),
  distanceTo: vi.fn(() => 50),
  normalize: vi.fn(),
  multiplyScalar: vi.fn(),
});

export const createMockCamera = () => ({
  position: createMockVector3(0, 30, 30),
  lookAt: vi.fn(),
  updateProjectionMatrix: vi.fn(),
  aspect: 1.33,
});

export const createMockRenderer = () => ({
  domElement: document.createElement('canvas'),
  setSize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
});

/**
 * Wait for React to finish rendering updates
 */
export const waitForReactUpdates = () => new Promise(resolve => setTimeout(resolve, 0));