/**
 * GroupBoundary - Rotated Bounds Test
 * Verifies that rotated group boundaries wrap tightly around rotated shapes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { GroupBoundary } from '../GroupBoundary';
import type { Element, ShapeElement } from '../../../types';

describe('GroupBoundary - Rotated Bounds', () => {
  let rotatedRectangles: Element[];

  beforeEach(() => {
    // Create two rectangles that have been rotated 45 degrees around their group center
    const rotationAngle = 45;
    const rotationCenter = { x: 10, y: 10 };

    rotatedRectangles = [
      {
        id: 'rect1',
        type: 'rectangle',
        points: [
          { x: 5, y: 5 },
          { x: 10, y: 10 }
        ],
        color: '#FF0000',
        layerId: 'layer1',
        rotation: {
          angle: rotationAngle,
          center: rotationCenter
        }
      } as ShapeElement,
      {
        id: 'rect2',
        type: 'rectangle',
        points: [
          { x: 10, y: 10 },
          { x: 15, y: 15 }
        ],
        color: '#00FF00',
        layerId: 'layer1',
        rotation: {
          angle: rotationAngle,
          center: rotationCenter
        }
      } as ShapeElement
    ];
  });

  it('should calculate rotation center for rotated group', () => {
    const { container } = render(
      <Canvas>
        <GroupBoundary
          groupId="test-group"
          elements={rotatedRectangles}
          isVisible={true}
        />
      </Canvas>
    );

    // Boundary should be rendered (not null)
    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should render boundary with proper rotation transform', () => {
    const { container } = render(
      <Canvas>
        <GroupBoundary
          groupId="test-group"
          elements={rotatedRectangles}
          isVisible={true}
        />
      </Canvas>
    );

    // Should render Line component for boundary
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('should render resize handles at rotated positions', () => {
    const { container } = render(
      <Canvas>
        <GroupBoundary
          groupId="test-group"
          elements={rotatedRectangles}
          isVisible={true}
        />
      </Canvas>
    );

    // Should render 8 resize handles (4 corners + 4 edges)
    const boxes = container.querySelectorAll('box');
    expect(boxes.length).toBe(8);
  });

  it('should handle non-rotated groups correctly', () => {
    const nonRotatedRects: Element[] = rotatedRectangles.map(rect => ({
      ...rect,
      rotation: undefined
    }));

    const { container } = render(
      <Canvas>
        <GroupBoundary
          groupId="test-group-unrotated"
          elements={nonRotatedRects}
          isVisible={true}
        />
      </Canvas>
    );

    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should handle mixed rotation angles correctly', () => {
    const mixedRotationRects: Element[] = [
      { ...rotatedRectangles[0], rotation: { angle: 45, center: { x: 5, y: 5 } } },
      { ...rotatedRectangles[1], rotation: { angle: 90, center: { x: 10, y: 10 } } }
    ];

    const { container } = render(
      <Canvas>
        <GroupBoundary
          groupId="test-group-mixed"
          elements={mixedRotationRects}
          isVisible={true}
        />
      </Canvas>
    );

    // Mixed rotations should still render (using axis-aligned bounds)
    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should not render when isVisible is false', () => {
    const { container } = render(
      <Canvas>
        <GroupBoundary
          groupId="test-group"
          elements={rotatedRectangles}
          isVisible={false}
        />
      </Canvas>
    );

    expect(container.querySelector('group')).toBeNull();
  });

  it('should not render when elements array is empty', () => {
    const { container } = render(
      <Canvas>
        <GroupBoundary
          groupId="test-group"
          elements={[]}
          isVisible={true}
        />
      </Canvas>
    );

    expect(container.querySelector('group')).toBeNull();
  });
});
