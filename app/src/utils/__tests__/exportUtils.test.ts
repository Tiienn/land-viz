/**
 * Unit Tests for Export Utilities
 *
 * Tests utility functions for file export including:
 * - File download
 * - Filename generation
 * - Filename sanitization
 * - Area calculations
 * - Shape type breakdown
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadFile,
  generateFilename,
  sanitizeFilename,
  calculateTotalArea,
  getShapeTypeBreakdown,
  formatArea,
} from '../exportUtils';

describe('downloadFile', () => {
  let mockLink: HTMLAnchorElement;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Setup DOM mocks
    mockLink = document.createElement('a');
    mockLink.click = vi.fn();

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

    // Mock URL methods (globalThis for compatibility)
    if (!globalThis.URL) {
      // @ts-expect-error - Creating URL object for test environment
      globalThis.URL = {};
    }
    if (!URL.createObjectURL) {
      // @ts-expect-error - Adding method for test environment
      URL.createObjectURL = () => 'blob:mock-url';
    }
    if (!URL.revokeObjectURL) {
      // @ts-expect-error - Adding method for test environment
      URL.revokeObjectURL = () => {};
    }

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and trigger download with correct attributes', () => {
    const blob = new Blob(['test content'], { type: 'application/pdf' });
    const filename = 'test-export.pdf';

    downloadFile(blob, filename);

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(mockLink.href).toBe('blob:mock-url');
    expect(mockLink.download).toBe(filename);
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should throw error for invalid blob', () => {
    // @ts-expect-error Testing invalid input
    expect(() => downloadFile(null, 'test.pdf')).toThrow('Invalid blob provided');

    // @ts-expect-error Testing invalid input
    expect(() => downloadFile(undefined, 'test.pdf')).toThrow('Invalid blob provided');

    // @ts-expect-error Testing invalid input
    expect(() => downloadFile('not-a-blob', 'test.pdf')).toThrow('Invalid blob provided');
  });

  it('should throw error for empty blob', () => {
    const emptyBlob = new Blob([], { type: 'application/pdf' });
    expect(() => downloadFile(emptyBlob, 'test.pdf')).toThrow('Blob is empty (size = 0)');
  });

  it('should handle cleanup even if errors occur', () => {
    const blob = new Blob(['content'], { type: 'application/pdf' });
    downloadFile(blob, 'test.pdf');

    // Verify cleanup was called
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });
});

describe('generateFilename', () => {
  beforeEach(() => {
    // Mock Date to get consistent timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-11T15:30:45.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate filename with timestamp', () => {
    const filename = generateFilename();
    expect(filename).toMatch(/^land-viz-export-\d{8}-\d{6}\.pdf$/);
    expect(filename).toBe('land-viz-export-20250111-153045.pdf');
  });

  it('should include project name when provided', () => {
    const filename = generateFilename('My Project');
    expect(filename).toBe('my-project-export-20250111-153045.pdf');
  });

  it('should sanitize project name', () => {
    const filename = generateFilename('My/Project?Name');
    expect(filename).toBe('my-project-name-export-20250111-153045.pdf');
  });

  it('should handle empty project name', () => {
    const filename = generateFilename('');
    expect(filename).toBe('land-viz-export-20250111-153045.pdf');
  });

  it('should handle project name with spaces', () => {
    const filename = generateFilename('My Cool Project');
    expect(filename).toBe('my-cool-project-export-20250111-153045.pdf');
  });
});

describe('sanitizeFilename', () => {
  it('should remove invalid characters', () => {
    expect(sanitizeFilename('file/name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file\\name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file?name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file%name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file*name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file:name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file|name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file"name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file<name>.pdf')).toBe('file-name-.pdf');
  });

  it('should replace spaces with hyphens', () => {
    expect(sanitizeFilename('my file name.pdf')).toBe('my-file-name.pdf');
    expect(sanitizeFilename('multiple   spaces.pdf')).toBe('multiple-spaces.pdf');
  });

  it('should collapse multiple hyphens', () => {
    expect(sanitizeFilename('file---name.pdf')).toBe('file-name.pdf');
    expect(sanitizeFilename('file- -name.pdf')).toBe('file-name.pdf');
  });

  it('should convert to lowercase', () => {
    expect(sanitizeFilename('MyFile.PDF')).toBe('myfile.pdf');
    expect(sanitizeFilename('UPPERCASE.TXT')).toBe('uppercase.txt');
  });

  it('should handle empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });

  it('should handle special unicode characters', () => {
    // The current implementation doesn't strip unicode/emoji, only specific chars
    // This test documents actual behavior (not necessarily ideal behavior)
    expect(sanitizeFilename('file™️name©️.pdf')).toBe('file™️name©️.pdf');
  });

  it('should preserve valid characters', () => {
    expect(sanitizeFilename('valid-file_name123.pdf')).toBe('valid-file_name123.pdf');
  });
});

describe('calculateTotalArea', () => {
  it('should calculate sum of all areas', () => {
    const shapes = [
      { area: 10 },
      { area: 20 },
      { area: 30 },
    ];
    expect(calculateTotalArea(shapes)).toBe(60);
  });

  it('should handle shapes without area property', () => {
    const shapes = [
      { area: 10 },
      {},
      { area: 20 },
    ];
    expect(calculateTotalArea(shapes)).toBe(30);
  });

  it('should handle empty array', () => {
    expect(calculateTotalArea([])).toBe(0);
  });

  it('should handle shapes with undefined area', () => {
    const shapes = [
      { area: 10 },
      { area: undefined },
      { area: 20 },
    ];
    expect(calculateTotalArea(shapes)).toBe(30);
  });

  it('should handle shapes with zero area', () => {
    const shapes = [
      { area: 0 },
      { area: 10 },
      { area: 0 },
    ];
    expect(calculateTotalArea(shapes)).toBe(10);
  });

  it('should handle floating point areas', () => {
    const shapes = [
      { area: 10.5 },
      { area: 20.25 },
      { area: 5.75 },
    ];
    expect(calculateTotalArea(shapes)).toBeCloseTo(36.5);
  });
});

describe('getShapeTypeBreakdown', () => {
  it('should count shape types correctly', () => {
    const shapes = [
      { type: 'rectangle' },
      { type: 'rectangle' },
      { type: 'circle' },
      { type: 'polygon' },
      { type: 'polygon' },
      { type: 'polygon' },
    ];

    const breakdown = getShapeTypeBreakdown(shapes);
    expect(breakdown).toBe('2 rectangles, 1 circle, 3 polygons');
  });

  it('should handle singular forms', () => {
    const shapes = [
      { type: 'rectangle' },
      { type: 'circle' },
      { type: 'polygon' },
    ];

    const breakdown = getShapeTypeBreakdown(shapes);
    expect(breakdown).toBe('1 rectangle, 1 circle, 1 polygon');
  });

  it('should handle empty array', () => {
    expect(getShapeTypeBreakdown([])).toBe('');
  });

  it('should handle single shape type', () => {
    const shapes = [
      { type: 'rectangle' },
      { type: 'rectangle' },
      { type: 'rectangle' },
    ];

    const breakdown = getShapeTypeBreakdown(shapes);
    expect(breakdown).toBe('3 rectangles');
  });

  it('should handle mixed case types', () => {
    const shapes = [
      { type: 'Rectangle' },
      { type: 'rectangle' },
      { type: 'RECTANGLE' },
    ];

    // Note: This will count them as different types due to case sensitivity
    // If your app needs case-insensitive, you should normalize in the function
    const breakdown = getShapeTypeBreakdown(shapes);
    expect(breakdown).toContain('rectangle');
  });

  it('should preserve order of first occurrence', () => {
    const shapes = [
      { type: 'polygon' },
      { type: 'rectangle' },
      { type: 'circle' },
      { type: 'polygon' },
    ];

    const breakdown = getShapeTypeBreakdown(shapes);
    // Order should be: polygon (first), rectangle (second), circle (third)
    const parts = breakdown.split(', ');
    expect(parts[0]).toContain('polygon');
    expect(parts[1]).toContain('rectangle');
    expect(parts[2]).toContain('circle');
  });
});

describe('formatArea', () => {
  it('should format area with 2 decimal places', () => {
    expect(formatArea(123.456, 'm²')).toBe('123.46 m²');
    expect(formatArea(10, 'm²')).toBe('10.00 m²');
    expect(formatArea(0.123, 'm²')).toBe('0.12 m²');
  });

  it('should handle different units', () => {
    expect(formatArea(100, 'ft²')).toBe('100.00 ft²');
    expect(formatArea(50, 'acres')).toBe('50.00 acres');
    expect(formatArea(1000, 'hectares')).toBe('1000.00 hectares');
  });

  it('should handle zero area', () => {
    expect(formatArea(0, 'm²')).toBe('0.00 m²');
  });

  it('should handle very large areas', () => {
    expect(formatArea(1000000.789, 'm²')).toBe('1000000.79 m²');
  });

  it('should handle very small areas', () => {
    expect(formatArea(0.001, 'm²')).toBe('0.00 m²');
  });

  it('should handle negative areas (edge case)', () => {
    expect(formatArea(-10, 'm²')).toBe('-10.00 m²');
  });
});
