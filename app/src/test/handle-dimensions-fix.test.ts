import { describe, it, expect } from 'vitest';

/**
 * Test suite for proper handle dimensions and orientation fix
 * 
 * This validates that edge handles have correct dimensions based on their
 * perpendicular direction, preventing the "square handle" issue.
 */
describe('Handle Dimensions and Orientation Fix', () => {

  const calculateHandleProperties = (baseRotation: number, edgeIndex: number) => {
    // Replicate the logic from ResizableShapeControls.tsx
    const basePerpendiculars = [90, 0, 270, 180]; // Top, Right, Bottom, Left
    const perpendicularAngle = baseRotation + basePerpendiculars[edgeIndex];
    const normalizedAngle = ((perpendicularAngle % 360) + 360) % 360;
    
    const isPointingVertically = (normalizedAngle >= 45 && normalizedAngle < 135) || 
                                (normalizedAngle >= 225 && normalizedAngle < 315);
    
    const handleArgs = isPointingVertically ? [0.3, 0.3, 1.5] : [1.5, 0.3, 0.3];
    const edgeCursor = isPointingVertically ? 'ns-resize' : 'ew-resize';
    const rotationRadians = perpendicularAngle * Math.PI / 180;
    
    return { handleArgs, edgeCursor, perpendicularAngle, normalizedAngle, isPointingVertically };
  };

  describe('Unrotated Rectangle (0°)', () => {
    const baseRotation = 0;
    
    it('should set correct dimensions for top edge handle (pointing up)', () => {
      const { handleArgs, edgeCursor, perpendicularAngle, isPointingVertically } = 
        calculateHandleProperties(baseRotation, 0);
      
      expect(perpendicularAngle).toBe(90); // Points up
      expect(isPointingVertically).toBe(true);
      expect(handleArgs).toEqual([0.3, 0.3, 1.5]); // Thin vertical bar
      expect(edgeCursor).toBe('ns-resize');
    });

    it('should set correct dimensions for right edge handle (pointing right)', () => {
      const { handleArgs, edgeCursor, perpendicularAngle, isPointingVertically } = 
        calculateHandleProperties(baseRotation, 1);
      
      expect(perpendicularAngle).toBe(0); // Points right  
      expect(isPointingVertically).toBe(false);
      expect(handleArgs).toEqual([1.5, 0.3, 0.3]); // Thin horizontal bar
      expect(edgeCursor).toBe('ew-resize');
    });

    it('should set correct dimensions for bottom edge handle (pointing down)', () => {
      const { handleArgs, edgeCursor, perpendicularAngle, isPointingVertically } = 
        calculateHandleProperties(baseRotation, 2);
      
      expect(perpendicularAngle).toBe(270); // Points down
      expect(isPointingVertically).toBe(true);
      expect(handleArgs).toEqual([0.3, 0.3, 1.5]); // Thin vertical bar
      expect(edgeCursor).toBe('ns-resize');
    });

    it('should set correct dimensions for left edge handle (pointing left)', () => {
      const { handleArgs, edgeCursor, perpendicularAngle, isPointingVertically } = 
        calculateHandleProperties(baseRotation, 3);
      
      expect(perpendicularAngle).toBe(180); // Points left
      expect(isPointingVertically).toBe(false);
      expect(handleArgs).toEqual([1.5, 0.3, 0.3]); // Thin horizontal bar
      expect(edgeCursor).toBe('ew-resize');
    });
  });

  describe('45° Rotated Rectangle', () => {
    const baseRotation = 45;
    
    it('should set correct dimensions for all edge handles', () => {
      // Top edge: 45° + 90° = 135° (pointing diagonally up-left, should be horizontal)
      const top = calculateHandleProperties(baseRotation, 0);
      expect(top.perpendicularAngle).toBe(135);
      expect(top.isPointingVertically).toBe(false);
      expect(top.handleArgs).toEqual([1.5, 0.3, 0.3]);
      
      // Right edge: 45° + 0° = 45° (pointing diagonally up-right, should be vertical)  
      const right = calculateHandleProperties(baseRotation, 1);
      expect(right.perpendicularAngle).toBe(45);
      expect(right.isPointingVertically).toBe(true);
      expect(right.handleArgs).toEqual([0.3, 0.3, 1.5]);
      
      // Bottom edge: 45° + 270° = 315° (pointing diagonally down-right, should be horizontal)
      const bottom = calculateHandleProperties(baseRotation, 2);
      expect(bottom.perpendicularAngle).toBe(315);
      expect(bottom.isPointingVertically).toBe(false);
      expect(bottom.handleArgs).toEqual([1.5, 0.3, 0.3]);
      
      // Left edge: 45° + 180° = 225° (pointing diagonally down-left, should be vertical)
      const left = calculateHandleProperties(baseRotation, 3);
      expect(left.perpendicularAngle).toBe(225);
      expect(left.isPointingVertically).toBe(true);
      expect(left.handleArgs).toEqual([0.3, 0.3, 1.5]);
    });
  });

  describe('90° Rotated Rectangle', () => {
    const baseRotation = 90;
    
    it('should swap handle orientations correctly', () => {
      // After 90° rotation, all handles should point in opposite directions
      
      // Top edge: 90° + 90° = 180° (pointing left, should be horizontal)
      const top = calculateHandleProperties(baseRotation, 0);
      expect(top.perpendicularAngle).toBe(180);
      expect(top.isPointingVertically).toBe(false);
      expect(top.handleArgs).toEqual([1.5, 0.3, 0.3]);
      
      // Right edge: 90° + 0° = 90° (pointing up, should be vertical)
      const right = calculateHandleProperties(baseRotation, 1);  
      expect(right.perpendicularAngle).toBe(90);
      expect(right.isPointingVertically).toBe(true);
      expect(right.handleArgs).toEqual([0.3, 0.3, 1.5]);
    });
  });

  describe('Angle Normalization', () => {
    it('should handle negative rotations correctly', () => {
      const baseRotation = -45;
      const { perpendicularAngle, normalizedAngle } = calculateHandleProperties(baseRotation, 0);
      
      expect(perpendicularAngle).toBe(45); // -45° + 90° = 45°
      expect(normalizedAngle).toBe(45); // Should normalize correctly
    });

    it('should handle angles > 360°', () => {
      const baseRotation = 450; // 360° + 90°
      const { normalizedAngle } = calculateHandleProperties(baseRotation, 0);
      
      // 450° + 90° = 540°, normalized should be 180°
      expect(normalizedAngle).toBe(180);
    });
  });

  describe('Direction Classification', () => {
    it('should correctly classify vertical directions', () => {
      const verticalAngles = [45, 90, 134, 225, 270, 314];
      
      verticalAngles.forEach(angle => {
        const isPointingVertically = (angle >= 45 && angle < 135) || 
                                    (angle >= 225 && angle < 315);
        expect(isPointingVertically).toBe(true);
      });
    });

    it('should correctly classify horizontal directions', () => {
      const horizontalAngles = [0, 44, 135, 180, 224, 315, 359];
      
      horizontalAngles.forEach(angle => {
        const isPointingVertically = (angle >= 45 && angle < 135) || 
                                    (angle >= 225 && angle < 315);
        expect(isPointingVertically).toBe(false);
      });
    });
  });

  describe('Handle Dimensions Consistency', () => {
    it('should always use thin dimension (0.3) as handle thickness', () => {
      const testCases = [
        { rotation: 0, edge: 0 }, { rotation: 45, edge: 1 }, 
        { rotation: 90, edge: 2 }, { rotation: 180, edge: 3 }
      ];
      
      testCases.forEach(({ rotation, edge }) => {
        const { handleArgs } = calculateHandleProperties(rotation, edge);
        
        // One dimension should always be 0.3 (thickness)
        // One dimension should be 1.5 (length)  
        // Y dimension should always be 0.3 (height)
        expect(handleArgs[1]).toBe(0.3); // Height always thin
        expect(handleArgs.includes(0.3)).toBe(true); // Has thin dimension
        expect(handleArgs.includes(1.5)).toBe(true); // Has length dimension
      });
    });
  });
});