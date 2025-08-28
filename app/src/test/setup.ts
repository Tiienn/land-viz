import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Three.js for testing
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock WebGL context
const mockCanvas = {
  getContext: vi.fn(() => ({
    drawArrays: vi.fn(),
    drawElements: vi.fn(),
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  style: {},
  width: 800,
  height: 600,
};

const originalCreateElement = document.createElement.bind(document);
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn((tagName: string) => {
    if (tagName === 'canvas') return mockCanvas;
    return originalCreateElement(tagName);
  }),
});