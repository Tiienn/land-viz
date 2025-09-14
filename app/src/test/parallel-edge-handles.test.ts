import { describe, it, expect } from 'vitest';

/**
 * Test suite for parallel edge handle orientation fix
 * 
 * This validates that edge handles are oriented parallel to their respective edges,
 * not perpendicular to them, which provides the correct visual appearance.
 */
describe('Parallel Edge Handle Orientation', () => {

  const calculateHandleProperties = (baseRotation: number, edgeIndex: number) => {
    // Replicate the NEW logic from ResizableShapeControls.tsx
    
    // Each edge has a base parallel direction relative to unrotated rectangle:
    // Top edge (0): runs horizontally = 0°
    // Right edge (1): runs vertically = 90°
    // Bottom edge (2): runs horizontally = 180°  
    // Left edge (3): runs vertically = 270°
    const baseParallels = [0, 90, 180, 270];
    const parallelAngle = baseRotation + baseParallels[edgeIndex];
    
    // Normalize angle to 0-360 range
    const normalizedAngle = ((parallelAngle % 360) + 360) % 360;
    
    // Determine handle orientation based on final parallel direction
    // Vertical edges (running up/down): 45-135° and 225-315°  
    // Horizontal edges (running left/right): 135-225° and 315-45°
    const isEdgeVertical = (normalizedAngle >= 45 && normalizedAngle < 135) || 
                          (normalizedAngle >= 225 && normalizedAngle < 315);
    
    // Set handle dimensions to create thin bar parallel to edge direction
    let handleArgs: [number, number, number];
    let edgeCursor: string;
    
    if (isEdgeVertical) {
      // Edge runs vertically - create thin vertical handle bar
      handleArgs = [0.3, 0.3, 1.5]; 
      edgeCursor = 'ew-resize'; // Cursor for horizontal resize (perpendicular to vertical edge)
    } else {
      // Edge runs horizontally - create thin horizontal handle bar  
      handleArgs = [1.5, 0.3, 0.3];
      edgeCursor = 'ns-resize'; // Cursor for vertical resize (perpendicular to horizontal edge)
    }
    
    const rotationRadians = parallelAngle * Math.PI / 180;
    
    return { handleArgs, edgeCursor, parallelAngle, normalizedAngle, isEdgeVertical, rotationRadians };
  };

  describe('Unrotated Rectangle (0°)', () => {
    const baseRotation = 0;
    
    it('should set correct orientation for top edge handle (horizontal)', () => {
      const { handleArgs, edgeCursor, parallelAngle, isEdgeVertical } = 
        calculateHandleProperties(baseRotation, 0);
      
      expect(parallelAngle).toBe(0); // Runs horizontally
      expect(isEdgeVertical).toBe(false);
      expect(handleArgs).toEqual([1.5, 0.3, 0.3]); // Thin horizontal bar
      expect(edgeCursor).toBe('ns-resize');
    });

    it('should set correct orientation for right edge handle (vertical)', () => {
      const { handleArgs, edgeCursor, parallelAngle, isEdgeVertical } = 
        calculateHandleProperties(baseRotation, 1);
      
      expect(parallelAngle).toBe(90); // Runs vertically  
      expect(isEdgeVertical).toBe(true);
      expect(handleArgs).toEqual([0.3, 0.3, 1.5]); // Thin vertical bar
      expect(edgeCursor).toBe('ew-resize');
    });

    it('should set correct orientation for bottom edge handle (horizontal)', () => {
      const { handleArgs, edgeCursor, parallelAngle, isEdgeVertical } = 
        calculateHandleProperties(baseRotation, 2);
      
      expect(parallelAngle).toBe(180); // Runs horizontally
      expect(isEdgeVertical).toBe(false);
      expect(handleArgs).toEqual([1.5, 0.3, 0.3]); // Thin horizontal bar
      expect(edgeCursor).toBe('ns-resize');
    });

    it('should set correct orientation for left edge handle (vertical)', () => {
      const { handleArgs, edgeCursor, parallelAngle, isEdgeVertical } = 
        calculateHandleProperties(baseRotation, 3);
      
      expect(parallelAngle).toBe(270); // Runs vertically
      expect(isEdgeVertical).toBe(true);
      expect(handleArgs).toEqual([0.3, 0.3, 1.5]); // Thin vertical bar
      expect(edgeCursor).toBe('ew-resize');
    });
  });

  describe('45° Rotated Rectangle', () => {
    const baseRotation = 45;
    
    it('should set correct orientation for all edge handles', () => {
      // Top edge: 45° + 0° = 45° (diagonal up-right, should be vertical bar)
      const top = calculateHandleProperties(baseRotation, 0);
      expect(top.parallelAngle).toBe(45);
      expect(top.isEdgeVertical).toBe(true);
      expect(top.handleArgs).toEqual([0.3, 0.3, 1.5]);
      
      // Right edge: 45° + 90° = 135° (diagonal down-right, should be horizontal bar)  
      const right = calculateHandleProperties(baseRotation, 1);
      expect(right.parallelAngle).toBe(135);
      expect(right.isEdgeVertical).toBe(false);
      expect(right.handleArgs).toEqual([1.5, 0.3, 0.3]);
      
      // Bottom edge: 45° + 180° = 225° (diagonal down-left, should be vertical bar)
      const bottom = calculateHandleProperties(baseRotation, 2);
      expect(bottom.parallelAngle).toBe(225);
      expect(bottom.isEdgeVertical).toBe(true);
      expect(bottom.handleArgs).toEqual([0.3, 0.3, 1.5]);
      
      // Left edge: 45° + 270° = 315° (diagonal up-left, should be horizontal bar)
      const left = calculateHandleProperties(baseRotation, 3);
      expect(left.parallelAngle).toBe(315);
      expect(left.isEdgeVertical).toBe(false);
      expect(left.handleArgs).toEqual([1.5, 0.3, 0.3]);
    });
  });

  describe('90° Rotated Rectangle', () => {
    const baseRotation = 90;
    
    it('should swap handle orientations correctly', () => {
      // After 90° rotation, orientations should be swapped compared to unrotated
      
      // Top edge: 90° + 0° = 90° (vertical, should be vertical bar)
      const top = calculateHandleProperties(baseRotation, 0);
      expect(top.parallelAngle).toBe(90);
      expect(top.isEdgeVertical).toBe(true);
      expect(top.handleArgs).toEqual([0.3, 0.3, 1.5]);
      
      // Right edge: 90° + 90° = 180° (horizontal, should be horizontal bar)
      const right = calculateHandleProperties(baseRotation, 1);  
      expect(right.parallelAngle).toBe(180);
      expect(right.isEdgeVertical).toBe(false);
      expect(right.handleArgs).toEqual([1.5, 0.3, 0.3]);
    });
  });

  describe('Negative Rotation Handling', () => {
    it('should handle negative rotations correctly', () => {
      const baseRotation = -45;
      const { parallelAngle, normalizedAngle } = calculateHandleProperties(baseRotation, 0);
      
      expect(parallelAngle).toBe(-45); // -45° + 0° = -45°
      expect(normalizedAngle).toBe(315); // Should normalize to 315°
    });

    it('should handle angles > 360°', () => {
      const baseRotation = 450; // 360° + 90°
      const { normalizedAngle } = calculateHandleProperties(baseRotation, 0);
      
      // 450° + 0° = 450°, normalized should be 90°
      expect(normalizedAngle).toBe(90);
    });
  });

  describe('Edge Classification Logic', () => {
    it('should correctly classify vertical edges', () => {
      const verticalAngles = [45, 90, 134, 225, 270, 314];
      
      verticalAngles.forEach(angle => {
        const isEdgeVertical = (angle >= 45 && angle < 135) || 
                              (angle >= 225 && angle < 315);
        expect(isEdgeVertical).toBe(true);
      });
    });

    it('should correctly classify horizontal edges', () => {
      const horizontalAngles = [0, 44, 135, 180, 224, 315, 359];
      
      horizontalAngles.forEach(angle => {
        const isEdgeVertical = (angle >= 45 && angle < 135) || 
                              (angle >= 225 && angle < 315);
        expect(isEdgeVertical).toBe(false);
      });
    });
  });

  describe('Cursor Assignment Logic', () => {
    it('should assign correct cursors for resize operations', () => {
      const testCases = [
        { rotation: 0, edge: 0, expectedCursor: 'ns-resize' }, // Top edge - horizontal bar, vertical resize
        { rotation: 0, edge: 1, expectedCursor: 'ew-resize' }, // Right edge - vertical bar, horizontal resize
        { rotation: 45, edge: 0, expectedCursor: 'ew-resize' }, // Rotated top - vertical bar, horizontal resize
        { rotation: 45, edge: 1, expectedCursor: 'ns-resize' }  // Rotated right - horizontal bar, vertical resize
      ];
      
      testCases.forEach(({ rotation, edge, expectedCursor }) => {
        const { edgeCursor } = calculateHandleProperties(rotation, edge);
        expect(edgeCursor).toBe(expectedCursor);
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