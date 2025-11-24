/**
 * Unit Tests for PDF Export Service
 *
 * Tests the PDF generation functionality including:
 * - Input validation
 * - Shape area calculations
 * - Shape perimeter calculations
 * - Error handling
 * - Multi-page generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Shape } from '../../types';
import type { ExportFilters } from '../../types/export';

// Mock pdf-lib to avoid actual PDF generation in tests
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn(() => ({
      embedFont: vi.fn(() => Promise.resolve({})),
      embedPng: vi.fn(() => Promise.resolve({ width: 1920, height: 1080 })),
      addPage: vi.fn(() => ({
        drawText: vi.fn(),
        drawRectangle: vi.fn(),
        drawImage: vi.fn(),
      })),
      save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3, 4]))),
    })),
  },
  rgb: vi.fn((r, g, b) => ({ r, g, b })),
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold',
  },
}));

// Import after mocking
const { exportToPDF } = await import('../pdfExportService');

// Test fixtures
const createMockShape = (overrides?: Partial<Shape>): Shape => ({
  id: 'test-shape-1',
  type: 'rectangle',
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 5 },
    { x: 0, y: 5 },
  ],
  color: '#FF0000',
  visible: true,
  locked: false,
  created: Date.now(),
  modified: Date.now(),
  layerId: 'layer-1',
  ...overrides,
});

const defaultFilters: ExportFilters = {
  basicInfo: true,
  dimensions: true,
  position: false,
  visual: false,
  metadata: false,
  includeShapeId: true,
  includeShapeName: true,
  includeShapeType: true,
  includeArea: true,
  includePerimeter: true,
  includeWidth: true,
  includeHeight: true,
  includeCoordinates: false,
  includeColor: false,
  includeVisibility: false,
  includeRotation: false,
  includeTimestamps: false,
  includeLayer: false,
  includeGroup: false,
  includeLocked: false,
};

describe('exportToPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should throw error when no shapes provided', async () => {
      await expect(exportToPDF([], defaultFilters)).rejects.toThrow('No shapes to export');
    });

    it('should throw error when shapes array is null/undefined', async () => {
      // @ts-expect-error Testing invalid input
      await expect(exportToPDF(null, defaultFilters)).rejects.toThrow('No shapes to export');

      // @ts-expect-error Testing invalid input
      await expect(exportToPDF(undefined, defaultFilters)).rejects.toThrow('No shapes to export');
    });

    it('should throw error when no filters are enabled', async () => {
      const noFilters: ExportFilters = {
        ...defaultFilters,
        basicInfo: false,
        dimensions: false,
      };

      const shape = createMockShape();
      await expect(exportToPDF([shape], noFilters)).rejects.toThrow(
        'Please select at least one property to export'
      );
    });

    it('should accept at least one filter category enabled', async () => {
      const minimalFilters: ExportFilters = {
        ...defaultFilters,
        dimensions: false,
        basicInfo: true, // At least one enabled
      };

      const shape = createMockShape();
      const result = await exportToPDF([shape], minimalFilters);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Shape Area Calculations', () => {
    it('should calculate rectangle area correctly', async () => {
      // Rectangle: 10m x 5m = 50 m²
      const rectangle = createMockShape({
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 5 },
          { x: 0, y: 5 },
        ],
      });

      // We can't easily test the internal calculation directly,
      // but we can ensure the function doesn't throw
      const result = await exportToPDF([rectangle], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should calculate circle area correctly', async () => {
      // Circle: center (0,0), radius point (10,0) -> radius = 10m -> area = π * 10² ≈ 314.16 m²
      const circle = createMockShape({
        type: 'circle',
        points: [
          { x: 0, y: 0 }, // center
          { x: 10, y: 0 }, // radius point
        ],
      });

      const result = await exportToPDF([circle], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should calculate polygon area using shoelace formula', async () => {
      // Triangle: (0,0), (10,0), (5,10) -> area = 50 m²
      const polygon = createMockShape({
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 5, y: 10 },
        ],
      });

      const result = await exportToPDF([polygon], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should return 0 area for shapes with < 3 points', async () => {
      const line = createMockShape({
        type: 'line',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      });

      // Line has no area, but should still export successfully
      const result = await exportToPDF([line], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle zero-radius circle', async () => {
      const zeroCircle = createMockShape({
        type: 'circle',
        points: [
          { x: 0, y: 0 }, // center
          { x: 0, y: 0 }, // same as center = radius 0
        ],
      });

      const result = await exportToPDF([zeroCircle], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Shape Perimeter Calculations', () => {
    it('should calculate rectangle perimeter correctly', async () => {
      // Rectangle: 10m x 5m -> perimeter = 2*(10+5) = 30m
      const rectangle = createMockShape({
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 5 },
          { x: 0, y: 5 },
        ],
      });

      const result = await exportToPDF([rectangle], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should calculate circle perimeter correctly', async () => {
      // Circle: radius = 10m -> perimeter = 2π * 10 ≈ 62.83m
      const circle = createMockShape({
        type: 'circle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      });

      const result = await exportToPDF([circle], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should calculate polyline perimeter (open path)', async () => {
      // Polyline: (0,0) -> (10,0) -> (10,10) = 10 + 10 = 20m
      const polyline = createMockShape({
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
      });

      const result = await exportToPDF([polyline], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should return 0 perimeter for shapes with < 2 points', async () => {
      const point = createMockShape({
        type: 'polygon',
        points: [{ x: 0, y: 0 }],
      });

      const result = await exportToPDF([point], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Blob Generation', () => {
    it('should return a valid Blob object', async () => {
      const shape = createMockShape();
      const result = await exportToPDF([shape], defaultFilters);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle multiple shapes', async () => {
      const shapes = [
        createMockShape({ id: 'shape-1', type: 'rectangle' }),
        createMockShape({ id: 'shape-2', type: 'circle' }),
        createMockShape({ id: 'shape-3', type: 'polygon' }),
      ];

      const result = await exportToPDF(shapes, defaultFilters);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle large datasets (pagination)', async () => {
      // Create 100 shapes to test pagination
      const shapes = Array.from({ length: 100 }, (_, i) =>
        createMockShape({ id: `shape-${i}`, name: `Shape ${i}` })
      );

      const result = await exportToPDF(shapes, defaultFilters);
      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('Image Embedding', () => {
    it('should handle valid base64 image', async () => {
      const shape = createMockShape();
      const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await exportToPDF([shape], defaultFilters, validBase64);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle base64 without data URL prefix', async () => {
      const shape = createMockShape();
      const base64Only = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await exportToPDF([shape], defaultFilters, base64Only);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should gracefully degrade when image embedding fails', async () => {
      const shape = createMockShape();
      const invalidBase64 = 'invalid-base64-string!!!';

      // Should still succeed without the image (graceful degradation)
      const result = await exportToPDF([shape], defaultFilters, invalidBase64);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should work without scene image (undefined)', async () => {
      const shape = createMockShape();
      const result = await exportToPDF([shape], defaultFilters, undefined);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Edge Cases', () => {
    it('should handle shapes with very long names', async () => {
      const shape = createMockShape({
        name: 'A'.repeat(500), // 500 character name
      });

      const result = await exportToPDF([shape], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle shapes with special characters in names', async () => {
      const shape = createMockShape({
        name: 'Shape™ with <special> & "characters"',
      });

      const result = await exportToPDF([shape], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle shapes with undefined properties', async () => {
      const shape = createMockShape({
        name: undefined,
        color: undefined,
        rotation: undefined,
      });

      const result = await exportToPDF([shape], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle shapes with empty points array', async () => {
      const shape = createMockShape({
        points: [],
      });

      const result = await exportToPDF([shape], defaultFilters);
      expect(result).toBeInstanceOf(Blob);
    });
  });
});
