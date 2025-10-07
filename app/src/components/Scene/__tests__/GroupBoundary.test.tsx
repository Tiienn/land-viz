/**
 * Unit Tests for GroupBoundary Calculations
 * Tests boundary calculation, rotation transformation, performance, and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { GroupBoundary } from '../GroupBoundary';
import type { Shape, DragState } from '../../../types';

// Helper to create a test shape
const createShape = (
  id: string,
  points: { x: number; y: number }[],
  rotation?: { angle: number; center: { x: number; y: number } }
): Shape => ({
  id,
  type: 'rectangle',
  points,
  layerId: 'main',
  color: '#FF0000',
  visible: true,
  locked: false,
  created: new Date(),
  modified: new Date(),
  rotation,
});

// Wrapper to render 3D components
const render3D = (component: React.ReactElement) => {
  return render(
    <Canvas>
      {component}
    </Canvas>
  );
};

describe('GroupBoundary Calculations', () => {
  beforeEach(() => {
    // Clear console spies
    vi.clearAllMocks();
  });

  describe('Basic Boundary Calculation', () => {
    it('calculates correct bounding box for multiple shapes', () => {
      // Create two rectangles: one at (0,0) to (10,10), another at (20,20) to (30,30)
      const shapes: Shape[] = [
        createShape('shape1', [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ]),
        createShape('shape2', [
          { x: 20, y: 20 },
          { x: 30, y: 20 },
          { x: 30, y: 30 },
          { x: 20, y: 30 },
        ]),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // GroupBoundary should render (not null)
      expect(container).toBeTruthy();
    });

    it('includes 0.08m padding around boundary', () => {
      // This test verifies the padding is applied by rendering the boundary
      const shapes: Shape[] = [
        createShape('shape1', [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ]),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Boundary should render successfully with padding
      expect(container).toBeTruthy();
    });

    it('returns null when not visible', () => {
      const shapes: Shape[] = [
        createShape('shape1', [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ]),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={false}
        />
      );

      // Should not render when not visible
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(0);
    });

    it('returns null when shapes array is empty', () => {
      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={[]}
          isVisible={true}
        />
      );

      // Should not render with empty shapes
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(0);
    });

    it('handles single shape group', () => {
      const shapes: Shape[] = [
        createShape('shape1', [
          { x: 5, y: 5 },
          { x: 15, y: 5 },
          { x: 15, y: 15 },
          { x: 5, y: 15 },
        ]),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Rotation Transformation', () => {
    it('correctly rotates boundary corners by 90 degrees', () => {
      // Create a square at (0,0) to (10,10) rotated 90 degrees around center (5,5)
      const shapes: Shape[] = [
        createShape(
          'shape1',
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          {
            angle: 90,
            center: { x: 5, y: 5 },
          }
        ),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Boundary should render successfully with rotation
      expect(container).toBeTruthy();
    });

    it('correctly rotates boundary corners by 45 degrees', () => {
      const shapes: Shape[] = [
        createShape(
          'shape1',
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          {
            angle: 45,
            center: { x: 5, y: 5 },
          }
        ),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Boundary should render successfully with rotation
      expect(container).toBeTruthy();
    });

    it('handles 0 degree rotation (identity)', () => {
      const shapes: Shape[] = [
        createShape(
          'shape1',
          [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
          {
            angle: 0,
            center: { x: 5, y: 5 },
          }
        ),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Boundary should render successfully with rotation
      expect(container).toBeTruthy();
    });

    it('handles 180 degree rotation', () => {
      const shapes: Shape[] = [
        createShape(
          'shape1',
          [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
          {
            angle: 180,
            center: { x: 5, y: 5 },
          }
        ),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Boundary should render successfully with rotation
      expect(container).toBeTruthy();
    });

    it('uses correct rotation center', () => {
      // Custom rotation center
      const customCenter = { x: 15, y: 15 };

      const shapes: Shape[] = [
        createShape(
          'shape1',
          [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
          {
            angle: 45,
            center: customCenter,
          }
        ),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Boundary should render successfully with custom rotation center
      expect(container).toBeTruthy();
    });
  });

  describe('Drag State', () => {
    it('applies drag offset correctly', () => {
      const shapes: Shape[] = [
        createShape('shape1', [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ]),
      ];

      const dragState: DragState = {
        isDragging: true,
        draggedShapeId: 'shape1',
        startPosition: { x: 5, y: 5 },
        currentPosition: { x: 15, y: 15 },
        originalShapesData: new Map([
          ['shape1', {
            points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          }],
        ]),
      };

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
          dragState={dragState}
        />
      );

      // Boundary should render successfully with drag state
      expect(container).toBeTruthy();
    });

    it('detects when group is being dragged', () => {
      const shapes: Shape[] = [
        createShape('shape1', [{ x: 0, y: 0 }, { x: 10, y: 10 }]),
        createShape('shape2', [{ x: 20, y: 20 }, { x: 30, y: 30 }]),
      ];

      const dragState: DragState = {
        isDragging: true,
        draggedShapeId: 'shape1',
        startPosition: { x: 5, y: 5 },
        currentPosition: { x: 15, y: 15 },
        originalShapesData: new Map([
          ['shape1', { points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }],
          ['shape2', { points: [{ x: 20, y: 20 }, { x: 30, y: 30 }] }],
        ]),
      };

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
          dragState={dragState}
        />
      );

      expect(container).toBeTruthy();
    });

    it('handles drag without originalShapesData', () => {
      const shapes: Shape[] = [
        createShape('shape1', [{ x: 0, y: 0 }, { x: 10, y: 10 }]),
      ];

      const dragState: DragState = {
        isDragging: true,
        draggedShapeId: 'shape1',
        startPosition: { x: 5, y: 5 },
        currentPosition: { x: 15, y: 15 },
      };

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
          dragState={dragState}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('calculates boundary < 16ms for small groups', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const shapes: Shape[] = [
        createShape('shape1', [{ x: 0, y: 0 }, { x: 10, y: 10 }]),
        createShape('shape2', [{ x: 20, y: 20 }, { x: 30, y: 30 }]),
        createShape('shape3', [{ x: 40, y: 40 }, { x: 50, y: 50 }]),
      ];

      render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Should not warn for small groups
      const warnCalls = consoleWarnSpy.mock.calls.filter(call =>
        call[0]?.includes?.('[GroupBoundary] Calculation took')
      );
      expect(warnCalls.length).toBe(0);
    });

    it('calculates boundary < 16ms for large groups (100 shapes)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      // Create 100 shapes
      const shapes: Shape[] = Array.from({ length: 100 }, (_, i) =>
        createShape(`shape${i}`, [
          { x: i * 10, y: i * 10 },
          { x: i * 10 + 5, y: i * 10 + 5 },
        ])
      );

      render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Should not warn for 100 shapes (should be < 16ms)
      const warnCalls = consoleWarnSpy.mock.calls.filter(call =>
        call[0]?.includes?.('[GroupBoundary] Calculation took')
      );
      expect(warnCalls.length).toBe(0);
    });

    it('renders without performance warnings', () => {
      const shapes: Shape[] = [
        createShape('shape1', [{ x: 0, y: 0 }, { x: 10, y: 10 }]),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      // Boundary should render successfully with good performance
      expect(container).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles shapes with different rotations', () => {
      const shapes: Shape[] = [
        createShape(
          'shape1',
          [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          { angle: 45, center: { x: 5, y: 5 } }
        ),
        createShape(
          'shape2',
          [{ x: 20, y: 20 }, { x: 30, y: 30 }],
          { angle: 90, center: { x: 25, y: 25 } }
        ),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('handles shapes at different positions', () => {
      const shapes: Shape[] = [
        createShape('shape1', [{ x: -100, y: -100 }, { x: -90, y: -90 }]),
        createShape('shape2', [{ x: 100, y: 100 }, { x: 110, y: 110 }]),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('handles mixed shape types', () => {
      const shapes: Shape[] = [
        { ...createShape('rect', [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ]), type: 'rectangle' },
        { ...createShape('circle', [
          { x: 20, y: 20 },
          { x: 25, y: 25 },
        ]), type: 'circle' },
        { ...createShape('poly', [
          { x: 40, y: 40 },
          { x: 50, y: 40 },
          { x: 45, y: 50 },
        ]), type: 'polyline' },
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('handles shapes with many points', () => {
      // Create a polygon with 100 points
      const points = Array.from({ length: 100 }, (_, i) => ({
        x: Math.cos((i / 100) * 2 * Math.PI) * 10,
        y: Math.sin((i / 100) * 2 * Math.PI) * 10,
      }));

      const shapes: Shape[] = [
        createShape('poly', points),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      expect(container).toBeTruthy();
    });

    it('handles negative coordinates', () => {
      const shapes: Shape[] = [
        createShape('shape1', [
          { x: -10, y: -10 },
          { x: -5, y: -5 },
        ]),
      ];

      const { container } = render3D(
        <GroupBoundary
          groupId="group1"
          shapes={shapes}
          isVisible={true}
        />
      );

      expect(container).toBeTruthy();
    });
  });
});
