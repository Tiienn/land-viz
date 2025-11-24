/**
 * Unit Tests for Scene Export Utilities
 *
 * Tests the scene capture functionality including:
 * - Scene container validation
 * - Canvas detection
 * - Dimension checks
 * - Error handling
 *
 * Note: Canvas capture tests are limited due to JSDOM limitations.
 * Full canvas rendering should be tested with E2E tests (Playwright).
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getSceneContainerElement,
  validateSceneContainer,
} from '../sceneExport';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('getSceneContainerElement', () => {
  it('should find scene container by id', () => {
    document.body.innerHTML = '<div id="scene-container"></div>';

    const result = getSceneContainerElement();
    expect(result).not.toBeNull();
    expect(result?.id).toBe('scene-container');
  });

  it('should return null if container not found', () => {
    document.body.innerHTML = '';
    const result = getSceneContainerElement();
    expect(result).toBeNull();
  });

  it('should return null for wrong id', () => {
    document.body.innerHTML = '<div id="wrong-id"></div>';
    const result = getSceneContainerElement();
    expect(result).toBeNull();
  });

  it('should find container among multiple elements', () => {
    document.body.innerHTML = `
      <div id="other-element"></div>
      <div id="scene-container"></div>
      <div id="another-element"></div>
    `;

    const result = getSceneContainerElement();
    expect(result).not.toBeNull();
    expect(result?.id).toBe('scene-container');
  });
});

describe('validateSceneContainer', () => {
  it('should return true for valid container with canvas', () => {
    const container = document.createElement('div');
    container.innerHTML = '<canvas></canvas>';

    // Mock dimensions
    Object.defineProperty(container, 'offsetWidth', { value: 800, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 600, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(true);
  });

  it('should return false if no canvas found', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'offsetWidth', { value: 800, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 600, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(false);
  });

  it('should return false if container width too small', () => {
    const container = document.createElement('div');
    container.innerHTML = '<canvas></canvas>';
    Object.defineProperty(container, 'offsetWidth', { value: 50, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 600, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(false);
  });

  it('should return false if container height too small', () => {
    const container = document.createElement('div');
    container.innerHTML = '<canvas></canvas>';
    Object.defineProperty(container, 'offsetWidth', { value: 800, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 50, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(false);
  });

  it('should accept minimum dimensions (100x100)', () => {
    const container = document.createElement('div');
    container.innerHTML = '<canvas></canvas>';
    Object.defineProperty(container, 'offsetWidth', { value: 100, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 100, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(true);
  });

  it('should reject dimensions below minimum (99x99)', () => {
    const container = document.createElement('div');
    container.innerHTML = '<canvas></canvas>';
    Object.defineProperty(container, 'offsetWidth', { value: 99, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 99, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(false);
  });

  it('should handle large dimensions', () => {
    const container = document.createElement('div');
    container.innerHTML = '<canvas></canvas>';
    Object.defineProperty(container, 'offsetWidth', { value: 4096, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 4096, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(true);
  });

  it('should return false for zero dimensions', () => {
    const container = document.createElement('div');
    const canvas = document.createElement('canvas');
    // Use innerHTML instead of appendChild for JSDOM compatibility
    container.innerHTML = '<canvas></canvas>';
    Object.defineProperty(container, 'offsetWidth', { value: 0, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 0, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(false);
  });

  it('should detect canvas even with multiple children', () => {
    const container = document.createElement('div');
    // Use innerHTML instead of appendChild for JSDOM compatibility
    container.innerHTML = '<div></div><canvas></canvas><div></div>';

    Object.defineProperty(container, 'offsetWidth', { value: 800, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetHeight', { value: 600, configurable: true, writable: true });

    const result = validateSceneContainer(container);
    expect(result).toBe(true);
  });
});

/*
 * Note: captureSceneSnapshot tests are omitted because:
 * 1. JSDOM doesn't fully support canvas rendering and toDataURL
 * 2. Complex canvas mocking is fragile and doesn't test real behavior
 * 3. This functionality should be tested with E2E tests (Playwright)
 * 4. The validation logic above is the critical path for error handling
 *
 * For integration testing, use:
 * - Playwright tests with real browser canvas
 * - Visual regression tests for the rendered output
 * - Manual QA for PDF generation
 */
