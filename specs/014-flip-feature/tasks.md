# Task Breakdown: Shape Flip Operation

**Spec ID**: 014
**Feature Name**: Shape Flip (Horizontal & Vertical)
**Tasks Version**: 1.0
**Created**: 2025-01-12

---

## Overview

This document breaks down the flip feature implementation into concrete, actionable tasks with time estimates, code examples, and validation criteria.

**Total Estimated Time**: 7 hours
**Recommended Team Size**: 1 developer
**Prerequisites**: Familiarity with Zustand, React, TypeScript

---

## Phase 1: Core Logic Implementation

**Phase Duration**: 2 hours
**Objective**: Create pure flip utility functions with comprehensive tests

---

### Task 1.1: Create Flip Utilities Module
**Duration**: 45 minutes
**Priority**: High
**Depends On**: None

**Acceptance Criteria**:
- [ ] File `app/src/utils/flipUtils.ts` created
- [ ] `calculateBoundingBox()` function implemented
- [ ] `flipPointsHorizontally()` function implemented
- [ ] `flipPointsVertically()` function implemented
- [ ] All functions have TypeScript type signatures
- [ ] Logger statements added for debugging

**Code Template**:

```typescript
import type { Point2D } from '../types';
import { logger } from './logger';

/**
 * Calculate the bounding box and center of a set of points
 */
export const calculateBoundingBox = (
  points: Point2D[]
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
} => {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, centerX: 0, centerY: 0 };
  }

  // TODO: Implement bounding box calculation
  // 1. Find min/max X and Y coordinates
  // 2. Calculate center: (min + max) / 2
  // 3. Return object with all values

  logger.info('[FlipUtils] Bounding box calculated', { centerX, centerY });
  return { minX, maxX, minY, maxY, centerX, centerY };
};

/**
 * Flip points horizontally (mirror across vertical axis)
 */
export const flipPointsHorizontally = (points: Point2D[]): Point2D[] => {
  if (points.length === 0) return points;

  const { centerX } = calculateBoundingBox(points);

  // TODO: Mirror each point across vertical axis at centerX
  // Formula: newX = 2 * centerX - oldX

  logger.info('[FlipUtils] Flipped points horizontally', { count: points.length });
  return flippedPoints;
};

/**
 * Flip points vertically (mirror across horizontal axis)
 */
export const flipPointsVertically = (points: Point2D[]): Point2D[] => {
  if (points.length === 0) return points;

  const { centerY } = calculateBoundingBox(points);

  // TODO: Mirror each point across horizontal axis at centerY
  // Formula: newY = 2 * centerY - oldY

  logger.info('[FlipUtils] Flipped points vertically', { count: points.length });
  return flippedPoints;
};
```

**Validation**:
```bash
# Compile TypeScript
npm run type-check

# No errors should appear
```

---

### Task 1.2: Create Unit Tests for Flip Utilities
**Duration**: 45 minutes
**Priority**: High
**Depends On**: Task 1.1

**Acceptance Criteria**:
- [ ] File `app/src/utils/__tests__/flipUtils.test.ts` created
- [ ] Tests for `calculateBoundingBox()` (5 test cases)
- [ ] Tests for `flipPointsHorizontally()` (4 test cases)
- [ ] Tests for `flipPointsVertically()` (4 test cases)
- [ ] All tests pass
- [ ] Test coverage ≥ 90% for flipUtils.ts

**Test Template**:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateBoundingBox,
  flipPointsHorizontally,
  flipPointsVertically
} from '../flipUtils';

describe('flipUtils', () => {
  describe('calculateBoundingBox', () => {
    it('should calculate center for rectangle', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const result = calculateBoundingBox(points);

      expect(result.centerX).toBe(5);
      expect(result.centerY).toBe(5);
      expect(result.minX).toBe(0);
      expect(result.maxX).toBe(10);
      expect(result.minY).toBe(0);
      expect(result.maxY).toBe(10);
    });

    it('should handle empty array', () => {
      const result = calculateBoundingBox([]);
      expect(result.centerX).toBe(0);
      expect(result.centerY).toBe(0);
    });

    it('should handle single point', () => {
      const points = [{ x: 5, y: 7 }];
      const result = calculateBoundingBox(points);
      expect(result.centerX).toBe(5);
      expect(result.centerY).toBe(7);
    });

    it('should handle negative coordinates', () => {
      const points = [
        { x: -5, y: -3 },
        { x: 5, y: 3 }
      ];
      const result = calculateBoundingBox(points);
      expect(result.centerX).toBe(0);
      expect(result.centerY).toBe(0);
    });

    it('should handle non-rectangular shapes', () => {
      // TODO: Test with triangle, pentagon, etc.
    });
  });

  describe('flipPointsHorizontally', () => {
    it('should mirror rectangle horizontally', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const result = flipPointsHorizontally(points);

      // Center is at x=5, so:
      // 0 → 10, 10 → 0
      expect(result).toEqual([
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 10, y: 10 }
      ]);
    });

    it('should handle empty array', () => {
      const result = flipPointsHorizontally([]);
      expect(result).toEqual([]);
    });

    it('should handle single point (no change)', () => {
      const points = [{ x: 5, y: 7 }];
      const result = flipPointsHorizontally(points);
      expect(result).toEqual([{ x: 5, y: 7 }]);
    });

    it('should preserve Y coordinates', () => {
      const points = [
        { x: 0, y: 5 },
        { x: 10, y: 15 }
      ];
      const result = flipPointsHorizontally(points);
      expect(result[0].y).toBe(5);
      expect(result[1].y).toBe(15);
    });
  });

  describe('flipPointsVertically', () => {
    it('should mirror rectangle vertically', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];

      const result = flipPointsVertically(points);

      // Center is at y=5, so:
      // 0 → 10, 10 → 0
      expect(result).toEqual([
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: 0 }
      ]);
    });

    it('should handle empty array', () => {
      const result = flipPointsVertically([]);
      expect(result).toEqual([]);
    });

    it('should handle single point (no change)', () => {
      const points = [{ x: 5, y: 7 }];
      const result = flipPointsVertically(points);
      expect(result).toEqual([{ x: 5, y: 7 }]);
    });

    it('should preserve X coordinates', () => {
      const points = [
        { x: 5, y: 0 },
        { x: 15, y: 10 }
      ];
      const result = flipPointsVertically(points);
      expect(result[0].x).toBe(5);
      expect(result[1].x).toBe(15);
    });
  });
});
```

**Validation**:
```bash
# Run tests
npm run test:unit

# Check coverage
npm run test:coverage
# Coverage should be ≥ 90% for flipUtils.ts
```

---

### Task 1.3: Add Store Actions for Flip
**Duration**: 30 minutes
**Priority**: High
**Depends On**: Task 1.1

**Acceptance Criteria**:
- [ ] `flipShapes()` action added to `useAppStore.ts`
- [ ] `flipSelectedShapes()` convenience wrapper added
- [ ] Undo/redo support implemented
- [ ] Logger statements added
- [ ] TypeScript types correct

**Code Location**: `app/src/store/useAppStore.ts`

**Implementation**:

```typescript
// Add to store interface
interface AppStore {
  // ... existing properties
  flipShapes: (shapeIds: string[], direction: 'horizontal' | 'vertical') => void;
  flipSelectedShapes: (direction: 'horizontal' | 'vertical') => void;
}

// Add to store implementation
flipShapes: (shapeIds: string[], direction: 'horizontal' | 'vertical') => {
  set((state) => {
    logger.info(`[Store] Flipping ${shapeIds.length} shapes ${direction}ly`);

    // Validate inputs
    if (shapeIds.length === 0) {
      logger.warn('[Store] No shapes to flip');
      return state;
    }

    // Store original shapes for undo
    const originalShapes = state.shapes.filter(s => shapeIds.includes(s.id));

    // Flip each shape
    const updatedShapes = state.shapes.map(shape => {
      if (!shapeIds.includes(shape.id)) return shape;

      // Skip locked shapes
      if (shape.locked) {
        logger.info(`[Store] Skipping locked shape ${shape.id}`);
        return shape;
      }

      // Calculate flipped points
      const flippedPoints = direction === 'horizontal'
        ? flipPointsHorizontally(shape.points)
        : flipPointsVertically(shape.points);

      logger.info(`[Store] Flipped shape ${shape.id}:`, {
        originalPoints: shape.points.length,
        flippedPoints: flippedPoints.length
      });

      return {
        ...shape,
        points: flippedPoints,
        modified: new Date()
      };
    });

    // Create history entry
    const historyEntry: HistoryEntry = {
      type: 'flip',
      action: direction === 'horizontal' ? 'Flip Horizontal' : 'Flip Vertical',
      shapeIds,
      before: originalShapes,
      after: updatedShapes.filter(s => shapeIds.includes(s.id)),
      timestamp: new Date()
    };

    return {
      shapes: updatedShapes,
      history: [...state.history.slice(0, state.historyIndex + 1), historyEntry],
      historyIndex: state.historyIndex + 1,
      renderTrigger: state.renderTrigger + 1
    };
  });
},

flipSelectedShapes: (direction: 'horizontal' | 'vertical') => {
  const { selectedShapeIds, flipShapes } = get();
  if (selectedShapeIds.length === 0) {
    logger.warn('[Store] No shapes selected for flip');
    return;
  }
  flipShapes(selectedShapeIds, direction);
}
```

**Validation**:
```bash
# Type check
npm run type-check

# Manual test in browser console
useAppStore.getState().flipSelectedShapes('horizontal')
```

---

## Phase 2: UI Components

**Phase Duration**: 2 hours
**Objective**: Create toolbar button with dropdown and icon components

---

### Task 2.1: Create Flip Icon Components
**Duration**: 30 minutes
**Priority**: High
**Depends On**: None

**Acceptance Criteria**:
- [ ] File `app/src/components/Icon/FlipHorizontalIcon.tsx` created
- [ ] File `app/src/components/Icon/FlipVerticalIcon.tsx` created
- [ ] Icons match existing icon style (outlined SVG)
- [ ] Icons scale properly (size prop)
- [ ] Icons use currentColor for theming

**Code Template**:

```typescript
// FlipHorizontalIcon.tsx
import React from 'react';

interface FlipHorizontalIconProps {
  size?: number;
  color?: string;
}

export const FlipHorizontalIcon: React.FC<FlipHorizontalIconProps> = ({
  size = 20,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Left side */}
    <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />
    {/* Right side */}
    <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
    {/* Center line (vertical) */}
    <path d="M12 20v2" />
    <path d="M12 14v2" />
    <path d="M12 8v2" />
    <path d="M12 2v2" />
  </svg>
);
```

```typescript
// FlipVerticalIcon.tsx
import React from 'react';

interface FlipVerticalIconProps {
  size?: number;
  color?: string;
}

export const FlipVerticalIcon: React.FC<FlipVerticalIconProps> = ({
  size = 20,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Top side */}
    <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
    {/* Bottom side */}
    <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
    {/* Center line (horizontal) */}
    <path d="M4 12H2" />
    <path d="M10 12H8" />
    <path d="M16 12h-2" />
    <path d="M22 12h-2" />
  </svg>
);
```

**Validation**:
- View icons in Storybook or test component
- Check various sizes (16, 20, 24, 32)
- Verify color inheritance

---

### Task 2.2: Create FlipButton Component
**Duration**: 60 minutes
**Priority**: High
**Depends On**: Task 2.1

**Acceptance Criteria**:
- [ ] File `app/src/components/UI/FlipButton.tsx` created
- [ ] Dropdown menu implemented
- [ ] Disabled state works correctly
- [ ] Click outside closes dropdown
- [ ] ESC key closes dropdown
- [ ] Keyboard shortcuts shown in dropdown
- [ ] Hover effects work
- [ ] Inline styles only (no CSS)

**Code Template**:

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { FlipHorizontalIcon } from '../Icon/FlipHorizontalIcon';
import { FlipVerticalIcon } from '../Icon/FlipVerticalIcon';

interface FlipButtonProps {
  disabled: boolean;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
}

export const FlipButton: React.FC<FlipButtonProps> = ({ disabled, onFlip }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close on ESC
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen]);

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    onFlip(direction);
    setDropdownOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Main button */}
      <button
        disabled={disabled}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          padding: '8px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          backgroundColor: disabled ? '#F3F4F6' : '#FFFFFF',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 200ms ease'
        }}
        title="Flip shapes"
      >
        <FlipHorizontalIcon size={20} />
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
          Flip
        </span>
        {/* Chevron down */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '220px',
          overflow: 'hidden'
        }}>
          {/* Horizontal option */}
          <DropdownItem
            icon={<FlipHorizontalIcon size={18} />}
            label="Flip Horizontally"
            shortcut="Shift+H"
            onClick={() => handleFlip('horizontal')}
          />

          {/* Vertical option */}
          <DropdownItem
            icon={<FlipVerticalIcon size={18} />}
            label="Flip Vertically"
            shortcut="Shift+V"
            onClick={() => handleFlip('vertical')}
          />
        </div>
      )}
    </div>
  );
};

// Dropdown item component
const DropdownItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
}> = ({ icon, label, shortcut, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        backgroundColor: hovered ? '#F3F4F6' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left',
        transition: 'background-color 200ms ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span style={{ fontSize: '14px', color: '#1F2937' }}>{label}</span>
      </div>
      <span style={{ color: '#6B7280', fontSize: '12px' }}>{shortcut}</span>
    </button>
  );
};
```

**Validation**:
- Test disabled state
- Test dropdown open/close
- Test click outside
- Test ESC key
- Test hover effects

---

### Task 2.3: Integrate FlipButton into Toolbar
**Duration**: 30 minutes
**Priority**: High
**Depends On**: Task 2.2

**Acceptance Criteria**:
- [ ] FlipButton added to `App.tsx` toolbar
- [ ] Button positioned after Rotate button
- [ ] Button disabled when no shapes selected
- [ ] onFlip callback wired to store action
- [ ] No layout issues or overlap

**Code Location**: `app/src/App.tsx`

**Implementation**:

```typescript
import { FlipButton } from './components/UI/FlipButton';

// In the toolbar section, after Rotate button
<FlipButton
  disabled={selectedShapeIds.length === 0}
  onFlip={(direction) => flipSelectedShapes(direction)}
/>
```

**Validation**:
- Check toolbar layout in browser
- Test button enable/disable
- Test flip operations via button

---

## Phase 3: Integration

**Phase Duration**: 1.5 hours
**Objective**: Add keyboard shortcuts and context menu integration

---

### Task 3.1: Add Keyboard Shortcuts
**Duration**: 45 minutes
**Priority**: High
**Depends On**: Task 1.3

**Acceptance Criteria**:
- [ ] Shift+H flips horizontally
- [ ] Shift+V flips vertically
- [ ] Shortcuts shown in help dialog
- [ ] Shortcuts work when shapes selected
- [ ] No conflicts with existing shortcuts

**Code Location**: `app/src/hooks/useKeyboardShortcuts.ts`

**Implementation**:

```typescript
// Add to shortcuts array
{
  key: 'Shift+H',
  description: 'Flip Horizontally',
  category: 'Edit',
  handler: () => {
    const { selectedShapeIds, flipSelectedShapes } = useAppStore.getState();
    if (selectedShapeIds.length > 0) {
      flipSelectedShapes('horizontal');
    }
  }
},
{
  key: 'Shift+V',
  description: 'Flip Vertically',
  category: 'Edit',
  handler: () => {
    const { selectedShapeIds, flipSelectedShapes } = useAppStore.getState();
    if (selectedShapeIds.length > 0) {
      flipSelectedShapes('vertical');
    }
  }
}

// Add event listener
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.shiftKey && e.key.toUpperCase() === 'H' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const { selectedShapeIds, flipSelectedShapes } = useAppStore.getState();
      if (selectedShapeIds.length > 0) {
        flipSelectedShapes('horizontal');
      }
    }
    if (e.shiftKey && e.key.toUpperCase() === 'V' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const { selectedShapeIds, flipSelectedShapes } = useAppStore.getState();
      if (selectedShapeIds.length > 0) {
        flipSelectedShapes('vertical');
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Validation**:
- Test Shift+H shortcut
- Test Shift+V shortcut
- Check keyboard help modal (?)
- Verify no conflicts

---

### Task 3.2: Add Context Menu Items
**Duration**: 45 minutes
**Priority**: Medium
**Depends On**: Task 1.3, Task 2.1

**Acceptance Criteria**:
- [ ] "Flip Horizontally" added to context menu
- [ ] "Flip Vertically" added to context menu
- [ ] Items shown for shape and multi-selection menus
- [ ] Icons displayed in menu
- [ ] Shortcuts shown in menu
- [ ] Separator added before/after flip items

**Code Location**: `app/src/components/ContextMenu/ContextMenu.tsx`

**Implementation**:

```typescript
// Add after Copy/Paste section, before Duplicate/Delete
{
  type: 'separator'
},
{
  type: 'item',
  label: 'Flip Horizontally',
  icon: <FlipHorizontalIcon size={16} />,
  shortcut: 'Shift+H',
  action: () => {
    flipSelectedShapes('horizontal');
    closeMenu();
  },
  visible: menuType === 'shape' || menuType === 'multi-selection'
},
{
  type: 'item',
  label: 'Flip Vertically',
  icon: <FlipVerticalIcon size={16} />,
  shortcut: 'Shift+V',
  action: () => {
    flipSelectedShapes('vertical');
    closeMenu();
  },
  visible: menuType === 'shape' || menuType === 'multi-selection'
},
{
  type: 'separator'
}
```

**Validation**:
- Right-click on shape → see flip options
- Select multiple shapes → right-click → see flip options
- Click flip option → shape flips
- Menu closes after flip

---

## Phase 4: Testing & Documentation

**Phase Duration**: 1.5 hours
**Objective**: Comprehensive testing and documentation updates

---

### Task 4.1: Integration Tests
**Duration**: 45 minutes
**Priority**: High
**Depends On**: All previous tasks

**Acceptance Criteria**:
- [ ] File `app/src/__tests__/integration/FlipFeature.test.tsx` created
- [ ] Test flip via toolbar button
- [ ] Test flip via keyboard shortcuts
- [ ] Test flip via context menu
- [ ] Test undo/redo
- [ ] Test multi-selection
- [ ] All tests pass

**Test Template**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAppStore } from '../../store/useAppStore';
import App from '../../App';

describe('Flip Feature Integration', () => {
  beforeEach(() => {
    // Reset store
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.clearAll();
    });
  });

  it('should flip shape via toolbar button', async () => {
    // TODO: Implement test
    // 1. Create rectangle
    // 2. Select rectangle
    // 3. Click Flip button
    // 4. Click "Flip Horizontally"
    // 5. Assert points flipped correctly
  });

  it('should flip via Shift+H keyboard shortcut', () => {
    // TODO: Implement test
    // 1. Create and select shape
    // 2. Fire Shift+H keydown event
    // 3. Assert points flipped
  });

  it('should flip via context menu', () => {
    // TODO: Implement test
    // 1. Create and select shape
    // 2. Right-click shape
    // 3. Click "Flip Horizontally"
    // 4. Assert points flipped
  });

  it('should support undo/redo', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      // Create rectangle
      result.current.addShape({
        name: 'Test Rectangle',
        type: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        color: '#3B82F6',
        visible: true,
        layerId: 'main'
      });
    });

    const shapeId = result.current.shapes[0].id;
    const originalPoints = result.current.shapes[0].points;

    act(() => {
      // Flip horizontally
      result.current.flipShapes([shapeId], 'horizontal');
    });

    const flippedPoints = result.current.shapes[0].points;
    expect(flippedPoints).not.toEqual(originalPoints);

    act(() => {
      // Undo
      result.current.undo();
    });

    expect(result.current.shapes[0].points).toEqual(originalPoints);

    act(() => {
      // Redo
      result.current.redo();
    });

    expect(result.current.shapes[0].points).toEqual(flippedPoints);
  });

  it('should flip multiple shapes individually', () => {
    // TODO: Implement test
    // 1. Create 3 shapes at different positions
    // 2. Select all 3
    // 3. Flip horizontally
    // 4. Assert each flipped around its own center
  });
});
```

**Validation**:
```bash
npm run test:integration
# All tests should pass
```

---

### Task 4.2: Manual Testing Checklist
**Duration**: 30 minutes
**Priority**: High
**Depends On**: All previous tasks

**Test Checklist**:

**Basic Operations**:
- [ ] Flip rectangle horizontally (toolbar button)
- [ ] Flip rectangle vertically (toolbar button)
- [ ] Flip circle horizontally
- [ ] Flip polyline horizontally
- [ ] Flip polygon vertically

**Multi-Selection**:
- [ ] Select 3 shapes, flip horizontally
- [ ] Verify each flipped around own center
- [ ] Verify relative positions maintained

**Grouped Shapes**:
- [ ] Create group of 2 shapes
- [ ] Flip group horizontally
- [ ] Verify both shapes flipped individually

**Rotated Shapes**:
- [ ] Rotate rectangle 45°
- [ ] Flip horizontally
- [ ] Verify rotation preserved

**Keyboard Shortcuts**:
- [ ] Shift+H flips horizontally
- [ ] Shift+V flips vertically
- [ ] Shortcuts shown in help (?)

**Context Menu**:
- [ ] Right-click → Flip Horizontally works
- [ ] Right-click → Flip Vertically works
- [ ] Menu items show shortcuts

**Edge Cases**:
- [ ] Button disabled when no selection
- [ ] Shortcut does nothing when no selection
- [ ] Locked shape skipped (no flip)
- [ ] Mixed selection (locked + unlocked)

**Undo/Redo**:
- [ ] Undo flip (Ctrl+Z)
- [ ] Redo flip (Ctrl+Y)
- [ ] Multiple flips undone individually

**Performance**:
- [ ] Flip 50 shapes (< 200ms)
- [ ] No lag or visual glitches

---

### Task 4.3: Update Documentation
**Duration**: 15 minutes
**Priority**: Medium
**Depends On**: All previous tasks

**Acceptance Criteria**:
- [ ] CLAUDE.md updated with flip feature
- [ ] Keyboard shortcuts documented
- [ ] Feature status marked as complete

**Code Location**: `CLAUDE.md`

**Content to Add**:

```markdown
## Recent Updates

### January 2025

**FLIP Feature (January 12, 2025)**
- **Shape Flip Operations**: Added horizontal and vertical flip functionality
- **Toolbar Integration**: Dropdown button with "Flip Horizontally" and "Flip Vertically" options
- **Keyboard Shortcuts**: Shift+H (horizontal), Shift+V (vertical)
- **Context Menu**: Flip options in right-click menu
- **Multi-Selection**: Each shape flips around its own center
- **Undo/Redo**: Full history support for flip operations
- **Files Modified**:
  - `app/src/utils/flipUtils.ts` - Core flip calculations
  - `app/src/store/useAppStore.ts` - Store actions
  - `app/src/components/UI/FlipButton.tsx` - Toolbar button
  - `app/src/components/Icon/FlipHorizontalIcon.tsx` - Icon component
  - `app/src/components/Icon/FlipVerticalIcon.tsx` - Icon component
  - `app/src/hooks/useKeyboardShortcuts.ts` - Keyboard integration
  - `app/src/components/ContextMenu/ContextMenu.tsx` - Menu integration

## Controls Reference

**Keyboard Shortcuts:**
- Shift+H: Flip selected shape(s) horizontally
- Shift+V: Flip selected shape(s) vertically
```

**Validation**:
- Read updated CLAUDE.md
- Verify accuracy and completeness

---

## Summary

### Time Breakdown

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Core Logic | 2 hours | 3 tasks |
| Phase 2: UI Components | 2 hours | 3 tasks |
| Phase 3: Integration | 1.5 hours | 2 tasks |
| Phase 4: Testing & Docs | 1.5 hours | 3 tasks |
| **Total** | **7 hours** | **11 tasks** |

### Dependencies Graph

```
Task 1.1 (Flip Utils)
  ├─→ Task 1.2 (Unit Tests)
  └─→ Task 1.3 (Store Actions)
       └─→ Task 3.1 (Keyboard Shortcuts)
       └─→ Task 3.2 (Context Menu)

Task 2.1 (Icons)
  └─→ Task 2.2 (FlipButton)
       └─→ Task 2.3 (Toolbar Integration)

All tasks → Task 4.1 (Integration Tests)
All tasks → Task 4.2 (Manual Testing)
All tasks → Task 4.3 (Documentation)
```

### Critical Path

The critical path (longest sequential path) is:
1. Task 1.1 → 1.3 → 3.1 (2.25 hours)
2. Task 2.1 → 2.2 → 2.3 (2 hours)
3. Task 4.1 → 4.2 → 4.3 (1.5 hours)

**Total Critical Path**: 5.75 hours

**Parallelization Opportunity**: Tasks 1.x and 2.x can be done in parallel if multiple developers available.

---

## Risk Mitigation

### Potential Blockers

1. **Store TypeScript Errors**: If store types don't match
   - Mitigation: Run `npm run type-check` frequently

2. **Dropdown Positioning Issues**: CSS/layout conflicts
   - Mitigation: Use absolute positioning, test in different viewports

3. **Performance Issues**: Flipping large selections
   - Mitigation: Benchmark early, optimize if needed

4. **Keyboard Shortcut Conflicts**: Existing shortcuts interfere
   - Mitigation: Verified Shift+H/V unused, test thoroughly

---

## Completion Criteria

Feature is complete when:
- [ ] All 11 tasks completed
- [ ] All unit tests pass (≥ 90% coverage)
- [ ] All integration tests pass
- [ ] Manual testing checklist complete
- [ ] Documentation updated
- [ ] Code reviewed and merged
- [ ] Feature tested in production build

---

## Related Documents

- `/specs/014-flip-feature/spec.md` - Feature specification
- `/specs/014-flip-feature/plan.md` - Technical implementation plan
- `/docs/project/CLAUDE.md` - Project documentation
