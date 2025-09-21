import { describe, it, expect, vi } from 'vitest';
import { GeometryCache } from '../utils/GeometryCache';

// Mock logger to suppress console output
vi.mock('../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Rectangle Resize Diagonal Line Fix', () => {
  it('should not create diagonal line artifacts when resize mode starts without live points', () => {
    // Test scenario: When resize mode starts but no live points exist yet
    const shape = {
      id: 'rect-1',
      type: 'rectangle' as const,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      color: '#3B82F6',
      layerId: 'layer-1',
      visible: true,
      modified: new Date(),
    };

    // Test that geometry is created correctly without live points
    const geometry = GeometryCache.getGeometry(shape, 0.01);

    // Check that geometry is valid
    expect(geometry).toBeDefined();
    expect(geometry.attributes).toBeDefined();
    expect(geometry.attributes.position).toBeDefined();

    // Check that geometry has correct number of vertices (4 corners for rectangle)
    expect(geometry.attributes.position.count).toBe(4);

    // Check that indices are correct for two triangles
    expect(geometry.index).toBeDefined();
    expect(geometry.index?.array).toEqual(new Uint16Array([0, 1, 2, 0, 2, 3]));
  });

  it('should create proper live resize geometry when live points are provided', () => {
    const shape = {
      id: 'rect-2',
      type: 'rectangle' as const,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ],
      color: '#3B82F6',
      layerId: 'layer-1',
      visible: true,
      modified: new Date(),
    };

    const liveResizePoints = [
      { x: 0, y: 0 },
      { x: 15, y: 15 } // Resized rectangle
    ];

    // Test live resize geometry creation
    const geometry = GeometryCache.getLiveResizeGeometry(shape, liveResizePoints, 0.01);

    // Check that geometry is valid
    expect(geometry).toBeDefined();
    expect(geometry.attributes).toBeDefined();
    expect(geometry.attributes.position).toBeDefined();

    // Check that geometry has correct number of vertices
    expect(geometry.attributes.position.count).toBe(4);

    // Verify the positions reflect the live resize points
    const positions = geometry.attributes.position.array;

    // Bottom-left corner
    expect(positions[0]).toBe(0);  // x
    expect(positions[2]).toBe(0);  // z (y in 2D)

    // Top-right corner
    expect(positions[6]).toBe(15);  // x
    expect(positions[8]).toBe(15);  // z (y in 2D)
  });

  it('should handle degenerate rectangles gracefully', () => {
    const shape = {
      id: 'rect-3',
      type: 'rectangle' as const,
      points: [
        { x: 5, y: 5 },
        { x: 5.0001, y: 5.0001 } // Nearly degenerate rectangle
      ],
      color: '#3B82F6',
      layerId: 'layer-1',
      visible: true,
      modified: new Date(),
    };

    // Test that even degenerate rectangles produce valid geometry
    const geometry = GeometryCache.getGeometry(shape, 0.01);

    // Should create fallback geometry for degenerate rectangles
    expect(geometry).toBeDefined();
    expect(geometry.attributes).toBeDefined();
    expect(geometry.attributes.position).toBeDefined();

    // Should have valid vertex data
    expect(geometry.attributes.position.count).toBeGreaterThanOrEqual(3);
  });
});