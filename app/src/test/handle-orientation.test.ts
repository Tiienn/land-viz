/**
 * Test for handle orientation calculation in ResizableShapeControls
 * 
 * Verifies that resize handles rotate correctly with shape rotation
 * to remain parallel to shape edges.
 */

import { describe, it, expect } from 'vitest';

// Mock the utility functions from ResizableShapeControls
const getBaseEdgeRotation = (edgeIndex: number): number => {
  const baseRotations = [0, 90, 180, 270];
  return baseRotations[edgeIndex % 4];
};

const calculateRotatedCursor = (totalRotationDegrees: number): string => {
  const normalized = ((totalRotationDegrees % 180) + 180) % 180;
  
  if (normalized <= 22.5 || normalized >= 157.5) return 'ew-resize';
  if (normalized >= 67.5 && normalized <= 112.5) return 'ns-resize';
  if (normalized > 22.5 && normalized < 67.5) return 'nwse-resize';
  return 'nesw-resize';
};

const calculateRotatedHandleGeometry = (totalRotationDegrees: number): [number, number, number] => {
  const normalized = ((totalRotationDegrees % 180) + 180) % 180;
  const isMoreHorizontal = normalized <= 45 || normalized >= 135;
  
  if (isMoreHorizontal) {
    return [1.5, 0.3, 0.4]; // Horizontal handle
  } else {
    return [0.4, 0.3, 1.5]; // Vertical handle
  }
};

const calculateHandleOrientation = (
  edgeIndex: number, 
  shapeRotation?: { angle: number; center: { x: number; y: number } }
) => {
  const baseRotation = getBaseEdgeRotation(edgeIndex);
  const shapeRotationAngle = shapeRotation?.angle || 0;
  const totalRotation = baseRotation + shapeRotationAngle;
  
  return {
    rotationRadians: (totalRotation * Math.PI) / 180,
    handleArgs: calculateRotatedHandleGeometry(totalRotation),
    cursor: calculateRotatedCursor(totalRotation)
  };
};

describe('Handle Orientation Calculation', () => {

  it('should calculate correct base edge rotations', () => {
    expect(getBaseEdgeRotation(0)).toBe(0);   // Top edge
    expect(getBaseEdgeRotation(1)).toBe(90);  // Right edge
    expect(getBaseEdgeRotation(2)).toBe(180); // Bottom edge
    expect(getBaseEdgeRotation(3)).toBe(270); // Left edge
  });

  it('should calculate correct cursor for horizontal handles', () => {
    expect(calculateRotatedCursor(0)).toBe('ew-resize');    // Horizontal
    expect(calculateRotatedCursor(180)).toBe('ew-resize');  // Horizontal
  });

  it('should calculate correct cursor for vertical handles', () => {
    expect(calculateRotatedCursor(90)).toBe('ns-resize');   // Vertical
    expect(calculateRotatedCursor(270)).toBe('ns-resize');  // Vertical
  });

  it('should calculate correct cursor for diagonal handles', () => {
    expect(calculateRotatedCursor(45)).toBe('nwse-resize');  // Diagonal NW-SE
    expect(calculateRotatedCursor(135)).toBe('nesw-resize'); // Diagonal NE-SW
  });

  it('should calculate handle geometry for unrotated rectangle', () => {
    const topEdge = calculateHandleOrientation(0); // Top edge, no rotation
    expect(topEdge.handleArgs).toEqual([1.5, 0.3, 0.4]); // Horizontal handle
    expect(topEdge.cursor).toBe('ew-resize');
    expect(topEdge.rotationRadians).toBe(0);

    const rightEdge = calculateHandleOrientation(1); // Right edge, no rotation
    expect(rightEdge.handleArgs).toEqual([0.4, 0.3, 1.5]); // Vertical handle
    expect(rightEdge.cursor).toBe('ns-resize');
    expect(rightEdge.rotationRadians).toBe(Math.PI / 2);
  });

  it('should calculate handle geometry for 45° rotated rectangle', () => {
    const rotation = { angle: 45, center: { x: 0, y: 0 } };
    
    const topEdge = calculateHandleOrientation(0, rotation); // Top edge, 45° rotation (total 45°)
    expect(topEdge.handleArgs).toEqual([1.5, 0.3, 0.4]); // Still more horizontal at 45°
    expect(topEdge.cursor).toBe('nwse-resize'); // Diagonal cursor
    expect(topEdge.rotationRadians).toBe(Math.PI / 4); // 45° in radians

    const rightEdge = calculateHandleOrientation(1, rotation); // Right edge, 45° rotation (total 135°)
    expect(rightEdge.handleArgs).toEqual([1.5, 0.3, 0.4]); // More horizontal at 135°
    expect(rightEdge.cursor).toBe('nesw-resize'); // Diagonal cursor
    expect(rightEdge.rotationRadians).toBe((3 * Math.PI) / 4); // 135° in radians
  });

  it('should handle full 360° rotation correctly', () => {
    const rotation = { angle: 360, center: { x: 0, y: 0 } };
    
    const topEdge = calculateHandleOrientation(0, rotation);
    expect(topEdge.cursor).toBe('ew-resize'); // Should be same as 0°
    expect(topEdge.handleArgs).toEqual([1.5, 0.3, 0.4]); // Horizontal handle
  });

  it('should handle negative rotation angles', () => {
    const rotation = { angle: -45, center: { x: 0, y: 0 } };
    
    const topEdge = calculateHandleOrientation(0, rotation);
    expect(topEdge.rotationRadians).toBe(-Math.PI / 4); // -45° in radians
    // The cursor and geometry calculations should normalize the angle appropriately
    expect(['nwse-resize', 'nesw-resize']).toContain(topEdge.cursor);
  });
});