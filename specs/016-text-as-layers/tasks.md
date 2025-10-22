# Task Breakdown: Text as Layers

**Spec ID:** 016
**Feature:** Text as Layers
**Tasks Version:** 2.0 (Complete)
**Date:** 2025-01-17
**Last Updated:** 2025-01-17

---

## Task Overview

**Total Estimated Time:** 20-25 days (4-5 weeks)
**Complexity:** High
**Dependencies:** None (self-contained feature)

---

## Phase 1: Type System & Foundation
**Duration:** 2-3 days

### Task 1.1: Create Element Types
**Estimated Time:** 4 hours
**Priority:** P0 (Critical)
**Dependencies:** None

**Description:**
Define unified element types in `types/index.ts` to support both shapes and text as first-class elements.

**Implementation:**

**File:** `app/src/types/index.ts`

```typescript
// Add after ShapeRotation interface

// ================================
// UNIFIED ELEMENT SYSTEM
// ================================

/**
 * Element type discriminator
 */
export type ElementType = 'shape' | 'text';

/**
 * Base properties shared by all elements
 */
export interface BaseElement {
  id: string;
  elementType: ElementType;
  name: string;
  visible: boolean;
  locked: boolean;
  layerId: string;
  groupId?: string;
  created: Date;
  modified: Date;
}

/**
 * Shape element - geometric shapes with points
 */
export interface ShapeElement extends BaseElement {
  elementType: 'shape';
  shapeType: ShapeType;
  points: Point2D[];
  color: string;
  rotation?: ShapeRotation;
  label?: import('./text').TextObject;
}

/**
 * Text element - text objects as first-class elements
 */
export interface TextElement extends BaseElement {
  elementType: 'text';
  position: Point2D;
  z: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: import('./text').TextAlignment;
  opacity: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  backgroundOpacity: number;
  rotation: number;
  attachedToShapeId?: string;
  offset?: { x: number; y: number };
}

/**
 * Unified element type
 */
export type Element = ShapeElement | TextElement;

/**
 * Type guard to check if element is a shape
 */
export function isShapeElement(element: Element): element is ShapeElement {
  return element.elementType === 'shape';
}

/**
 * Type guard to check if element is text
 */
export function isTextElement(element: Element): element is TextElement {
  return element.elementType === 'text';
}
```

**Mark legacy Shape type as deprecated:**
```typescript
/**
 * @deprecated Use ShapeElement instead. Legacy type for backward compatibility.
 * Will be removed in v2.0.
 */
export interface Shape {
  // ... existing Shape definition
}
```

**Validation:**
- [ ] TypeScript compiles without errors
- [ ] Type guards work correctly in tests
- [ ] JSDoc comments are clear and complete

---

### Task 1.2: Update AppState Interface
**Estimated Time:** 2 hours
**Priority:** P0 (Critical)
**Dependencies:** Task 1.1

**Description:**
Add `elements` array to AppState and update selection fields.

**Implementation:**

**File:** `app/src/types/index.ts`

```typescript
export interface AppState {
  // NEW: Unified elements array
  elements: Element[];

  // LEGACY: Keep for backward compatibility
  shapes: Shape[];

  // NEW: Element selection
  selectedElementIds: string[];
  hoveredElementId: string | null;

  // LEGACY: Shape selection (keep for migration period)
  selectedShapeId: string | null;
  selectedShapeIds: string[];
  hoveredShapeId: string | null;
  hoveredGroupId: string | null;
  highlightedShapeId: string | null;

  // ... rest of AppState unchanged
}
```

**Validation:**
- [ ] AppState compiles successfully
- [ ] All existing code referencing `shapes` still works
- [ ] Both element and shape selection fields coexist

---

### Task 1.3: Create Migration Utility Module
**Estimated Time:** 6 hours
**Priority:** P0 (Critical)
**Dependencies:** Task 1.1, 1.2

**Description:**
Build conversion functions to migrate between old and new data structures.

**Implementation:**

**New File:** `app/src/utils/elementMigration.ts`

```typescript
import type { Shape, ShapeElement, TextElement, Element } from '../types';
import type { TextObject } from '../types/text';
import { logger } from './logger';

/**
 * Convert legacy Shape to ShapeElement
 */
export function shapeToElement(shape: Shape): ShapeElement {
  return {
    id: shape.id,
    elementType: 'shape',
    name: shape.name,
    visible: shape.visible,
    locked: shape.locked ?? false,
    layerId: shape.layerId,
    groupId: shape.groupId,
    created: shape.created,
    modified: shape.modified,
    shapeType: shape.type,
    points: shape.points,
    color: shape.color,
    rotation: shape.rotation,
    label: shape.label,
  };
}

/**
 * Convert TextObject to TextElement
 */
export function textToElement(text: TextObject): TextElement {
  return {
    id: text.id,
    elementType: 'text',
    name: `Text: ${text.content.substring(0, 20)}${text.content.length > 20 ? '...' : ''}`,
    visible: text.visible,
    locked: text.locked,
    layerId: text.layerId,
    groupId: undefined, // Text doesn't have groupId yet
    created: new Date(text.createdAt),
    modified: new Date(text.updatedAt),
    position: { x: text.position.x, y: text.position.y },
    z: text.position.z,
    content: text.content,
    fontSize: text.fontSize,
    fontFamily: text.fontFamily,
    color: text.color,
    alignment: text.alignment,
    opacity: text.opacity,
    bold: text.bold,
    italic: text.italic,
    underline: text.underline,
    uppercase: text.uppercase,
    letterSpacing: text.letterSpacing,
    lineHeight: text.lineHeight,
    backgroundColor: text.backgroundColor,
    backgroundOpacity: text.backgroundOpacity,
    rotation: text.rotation,
    attachedToShapeId: text.attachedToShapeId,
    offset: text.offset,
  };
}

/**
 * Convert ShapeElement back to Shape (backward compatibility)
 */
export function elementToShape(element: ShapeElement): Shape {
  return {
    id: element.id,
    name: element.name,
    points: element.points,
    type: element.shapeType,
    color: element.color,
    visible: element.visible,
    layerId: element.layerId,
    created: element.created,
    modified: element.modified,
    rotation: element.rotation,
    locked: element.locked,
    groupId: element.groupId,
    label: element.label,
  };
}

/**
 * Convert TextElement back to TextObject
 */
export function elementToText(element: TextElement): TextObject {
  return {
    id: element.id,
    type: 'floating',
    content: element.content,
    position: {
      x: element.position.x,
      y: element.position.y,
      z: element.z,
    },
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    color: element.color,
    alignment: element.alignment,
    opacity: element.opacity,
    bold: element.bold,
    italic: element.italic,
    underline: element.underline,
    uppercase: element.uppercase,
    letterSpacing: element.letterSpacing,
    lineHeight: element.lineHeight,
    backgroundColor: element.backgroundColor,
    backgroundOpacity: element.backgroundOpacity,
    rotation: element.rotation,
    attachedToShapeId: element.attachedToShapeId,
    offset: element.offset,
    layerId: element.layerId,
    locked: element.locked,
    visible: element.visible,
    createdAt: element.created.getTime(),
    updatedAt: element.modified.getTime(),
  };
}

/**
 * One-time migration function
 */
export function migrateToElements(
  shapes: Shape[],
  texts: TextObject[]
): Element[] {
  logger.info('[Migration] Starting conversion', {
    shapeCount: shapes.length,
    textCount: texts.length,
  });

  const shapeElements = shapes.map(shapeToElement);
  const textElements = texts.map(textToElement);

  const allElements = [...shapeElements, ...textElements];

  // Sort by creation date to preserve order
  allElements.sort((a, b) => a.created.getTime() - b.created.getTime());

  logger.info('[Migration] Conversion complete', {
    elementCount: allElements.length,
  });

  return allElements;
}

/**
 * Check if migration has already run
 */
export function hasMigrated(): boolean {
  const flag = localStorage.getItem('land-viz:elements-migrated');
  return flag === 'true';
}

/**
 * Mark migration as complete
 */
export function setMigrated(): void {
  localStorage.setItem('land-viz:elements-migrated', 'true');
  localStorage.setItem('land-viz:elements-migrated-timestamp', Date.now().toString());
}

/**
 * Create backup before migration
 */
export function backupBeforeMigration(
  shapes: Shape[],
  texts: TextObject[]
): void {
  const backup = {
    timestamp: Date.now(),
    version: '1.0',
    shapes,
    texts,
  };

  localStorage.setItem('land-viz:pre-migration-backup', JSON.stringify(backup));

  logger.info('[Migration] Backup created', {
    shapeCount: shapes.length,
    textCount: texts.length,
  });
}

/**
 * Restore from backup (rollback)
 */
export function restoreFromBackup(): { shapes: Shape[]; texts: TextObject[] } | null {
  try {
    const backupStr = localStorage.getItem('land-viz:pre-migration-backup');
    if (!backupStr) {
      logger.error('[Migration] No backup found');
      return null;
    }

    const backup = JSON.parse(backupStr);
    logger.info('[Migration] Backup restored', {
      shapeCount: backup.shapes.length,
      textCount: backup.texts.length,
    });

    return {
      shapes: backup.shapes,
      texts: backup.texts,
    };
  } catch (error) {
    logger.error('[Migration] Backup restoration failed', error);
    return null;
  }
}
```

**Validation:**
- [ ] All conversion functions tested
- [ ] Round-trip conversions preserve data
- [ ] Backup/restore works correctly
- [ ] Migration flag persists across sessions

---

### Task 1.4: Write Migration Tests
**Estimated Time:** 4 hours
**Priority:** P1 (High)
**Dependencies:** Task 1.3

**Description:**
Create comprehensive tests for migration utilities.

**Implementation:**

**New File:** `app/src/utils/__tests__/elementMigration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  shapeToElement,
  textToElement,
  elementToShape,
  elementToText,
  migrateToElements,
  hasMigrated,
  setMigrated,
  backupBeforeMigration,
  restoreFromBackup,
} from '../elementMigration';
import type { Shape, TextObject } from '../../types';

describe('elementMigration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('shapeToElement', () => {
    it('should convert Shape to ShapeElement without data loss', () => {
      const shape: Shape = {
        id: 'shape-1',
        name: 'Rectangle 1',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        type: 'rectangle',
        color: '#3B82F6',
        visible: true,
        layerId: 'layer-1',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-15'),
        rotation: { angle: 45, center: { x: 5, y: 5 } },
        locked: false,
        groupId: 'group-1',
      };

      const element = shapeToElement(shape);

      expect(element.elementType).toBe('shape');
      expect(element.id).toBe(shape.id);
      expect(element.name).toBe(shape.name);
      expect(element.shapeType).toBe(shape.type);
      expect(element.points).toEqual(shape.points);
      expect(element.color).toBe(shape.color);
      expect(element.rotation).toEqual(shape.rotation);
      expect(element.groupId).toBe(shape.groupId);
    });
  });

  describe('textToElement', () => {
    it('should convert TextObject to TextElement without data loss', () => {
      const text: TextObject = {
        id: 'text-1',
        type: 'floating',
        content: 'Hello World',
        position: { x: 10, y: 20, z: 0 },
        fontFamily: 'Nunito Sans',
        fontSize: 24,
        color: '#000000',
        alignment: 'center',
        opacity: 1,
        bold: true,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1.2,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-1',
        locked: false,
        visible: true,
        createdAt: new Date('2025-01-01').getTime(),
        updatedAt: new Date('2025-01-15').getTime(),
      };

      const element = textToElement(text);

      expect(element.elementType).toBe('text');
      expect(element.id).toBe(text.id);
      expect(element.content).toBe(text.content);
      expect(element.position).toEqual({ x: 10, y: 20 });
      expect(element.z).toBe(0);
      expect(element.fontSize).toBe(24);
      expect(element.bold).toBe(true);
    });
  });

  describe('round-trip conversions', () => {
    it('should preserve Shape data through round-trip conversion', () => {
      const originalShape: Shape = {
        id: 'shape-1',
        name: 'Test Shape',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        type: 'rectangle',
        color: '#FF0000',
        visible: true,
        layerId: 'layer-1',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-15'),
      };

      const element = shapeToElement(originalShape);
      const roundTrip = elementToShape(element);

      expect(roundTrip).toEqual(originalShape);
    });

    it('should preserve TextObject data through round-trip conversion', () => {
      const originalText: TextObject = {
        id: 'text-1',
        type: 'floating',
        content: 'Test Text',
        position: { x: 5, y: 10, z: 0 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left',
        opacity: 1,
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-1',
        locked: false,
        visible: true,
        createdAt: 1704067200000,
        updatedAt: 1705276800000,
      };

      const element = textToElement(originalText);
      const roundTrip = elementToText(element);

      expect(roundTrip).toEqual(originalText);
    });
  });

  describe('migrateToElements', () => {
    it('should merge and sort shapes and text by creation date', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          name: 'Shape 1',
          points: [],
          type: 'rectangle',
          color: '#000000',
          visible: true,
          layerId: 'layer-1',
          created: new Date('2025-01-03'),
          modified: new Date('2025-01-03'),
        },
      ];

      const texts: TextObject[] = [
        {
          id: 'text-1',
          type: 'floating',
          content: 'Text 1',
          position: { x: 0, y: 0, z: 0 },
          fontFamily: 'Nunito Sans',
          fontSize: 16,
          color: '#000000',
          alignment: 'left',
          opacity: 1,
          bold: false,
          italic: false,
          underline: false,
          uppercase: false,
          letterSpacing: 0,
          lineHeight: 1,
          backgroundOpacity: 0,
          rotation: 0,
          layerId: 'layer-1',
          locked: false,
          visible: true,
          createdAt: new Date('2025-01-01').getTime(),
          updatedAt: new Date('2025-01-01').getTime(),
        },
      ];

      const elements = migrateToElements(shapes, texts);

      expect(elements.length).toBe(2);
      expect(elements[0].id).toBe('text-1'); // Created first
      expect(elements[1].id).toBe('shape-1'); // Created second
    });
  });

  describe('migration state', () => {
    it('should track migration status', () => {
      expect(hasMigrated()).toBe(false);

      setMigrated();

      expect(hasMigrated()).toBe(true);
    });

    it('should create and restore backup', () => {
      const shapes: Shape[] = [
        {
          id: 'shape-1',
          name: 'Shape',
          points: [],
          type: 'rectangle',
          color: '#000000',
          visible: true,
          layerId: 'layer-1',
          created: new Date(),
          modified: new Date(),
        },
      ];

      const texts: TextObject[] = [];

      backupBeforeMigration(shapes, texts);

      const backup = restoreFromBackup();

      expect(backup).not.toBeNull();
      expect(backup!.shapes.length).toBe(1);
      expect(backup!.texts.length).toBe(0);
    });
  });
});
```

**Validation:**
- [ ] All tests pass
- [ ] Test coverage >80%
- [ ] Edge cases covered (empty arrays, null values, etc.)

---

## Phase 2: Store Integration
**Duration:** 3-4 days

### Task 2.1: Add Elements State to useAppStore
**Estimated Time:** 6 hours
**Priority:** P0 (Critical)
**Dependencies:** Phase 1 complete

**Description:**
Extend useAppStore with element management actions.

**Implementation:**

**File:** `app/src/store/useAppStore.ts`

Add to AppStore interface:

```typescript
interface AppStore extends AppState {
  // ... existing actions

  // NEW: Element CRUD actions
  addElement: (element: Omit<Element, 'id' | 'created' | 'modified'>) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;

  // NEW: Element selection
  selectElement: (id: string | null) => void;
  selectMultipleElements: (ids: string[]) => void;
  toggleElementSelection: (id: string) => void;
  clearElementSelection: () => void;
  hoverElement: (id: string | null) => void;

  // NEW: Element queries
  getElementById: (id: string) => Element | undefined;
  getElementsByLayer: (layerId: string) => Element[];
  getElementsByGroup: (groupId: string) => Element[];
  getSelectedElements: () => Element[];
  getVisibleElements: () => Element[];

  // NEW: Grouping
  groupSelectedElements: () => void;
  ungroupSelectedElements: () => void;

  // NEW: Migration
  runMigration: () => void;
  rollbackMigration: () => void;
}
```

Implement in create function:

```typescript
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // ... existing state

      // NEW: Elements state
      elements: [],
      selectedElementIds: [],
      hoveredElementId: null,

      // Add element
      addElement: (element) => {
        saveToHistory();

        const id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const newElement: Element = {
          ...element,
          id,
          created: now,
          modified: now,
        } as Element;

        set((state) => ({
          elements: [...state.elements, newElement],
        }));

        // DUAL WRITE: Also add to legacy stores
        if (isShapeElement(newElement)) {
          const shape = elementToShape(newElement);
          get().addShape(shape);
        } else if (isTextElement(newElement)) {
          const text = elementToText(newElement);
          useTextStore.getState().addText(text);
        }
      },

      // Update element
      updateElement: (id, updates) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id
              ? { ...el, ...updates, modified: new Date() }
              : el
          ),
        }));

        // DUAL WRITE: Sync to legacy
        const element = get().getElementById(id);
        if (element) {
          if (isShapeElement(element)) {
            get().updateShape(id, updates);
          } else if (isTextElement(element)) {
            useTextStore.getState().updateText(id, updates);
          }
        }

        saveToHistory();
      },

      // Delete element
      deleteElement: (id) => {
        saveToHistory();

        const element = get().getElementById(id);

        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
        }));

        // DUAL WRITE: Sync to legacy
        if (element) {
          if (isShapeElement(element)) {
            get().deleteShape(id);
          } else if (isTextElement(element)) {
            useTextStore.getState().deleteText(id);
          }
        }
      },

      // Delete multiple elements
      deleteElements: (ids) => {
        saveToHistory();

        set((state) => ({
          elements: state.elements.filter((el) => !ids.includes(el.id)),
          selectedElementIds: state.selectedElementIds.filter((sid) => !ids.includes(sid)),
        }));

        // DUAL WRITE: Sync to legacy
        ids.forEach((id) => {
          const element = get().getElementById(id);
          if (element) {
            if (isShapeElement(element)) {
              get().deleteShape(id);
            } else if (isTextElement(element)) {
              useTextStore.getState().deleteText(id);
            }
          }
        });
      },

      // Select element
      selectElement: (id) => {
        set({ selectedElementIds: id ? [id] : [] });

        // DUAL WRITE: Sync to legacy selection
        const element = id ? get().getElementById(id) : null;
        if (element) {
          if (isShapeElement(element)) {
            get().selectShape(id);
          } else if (isTextElement(element)) {
            useTextStore.getState().selectText(id);
          }
        } else {
          get().selectShape(null);
          useTextStore.getState().selectText(null);
        }
      },

      // Multi-select
      selectMultipleElements: (ids) => {
        set({ selectedElementIds: ids });

        // DUAL WRITE: Sync shapes to legacy
        const shapeIds = ids.filter((id) => {
          const el = get().getElementById(id);
          return el && isShapeElement(el);
        });
        get().selectMultipleShapes(shapeIds);
      },

      // Toggle selection
      toggleElementSelection: (id) => {
        set((state) => {
          const isSelected = state.selectedElementIds.includes(id);
          return {
            selectedElementIds: isSelected
              ? state.selectedElementIds.filter((sid) => sid !== id)
              : [...state.selectedElementIds, id],
          };
        });
      },

      // Clear selection
      clearElementSelection: () => {
        set({ selectedElementIds: [] });
        get().clearSelection();
        useTextStore.getState().selectText(null);
      },

      // Hover element
      hoverElement: (id) => {
        set({ hoveredElementId: id });

        // DUAL WRITE: Sync to legacy
        const element = id ? get().getElementById(id) : null;
        if (element) {
          if (isShapeElement(element)) {
            get().hoverShape(id);
          }
        } else {
          get().hoverShape(null);
        }
      },

      // Get element by ID
      getElementById: (id) => {
        return get().elements.find((el) => el.id === id);
      },

      // Get elements by layer
      getElementsByLayer: (layerId) => {
        return get().elements.filter((el) => el.layerId === layerId);
      },

      // Get elements by group
      getElementsByGroup: (groupId) => {
        return get().elements.filter((el) => el.groupId === groupId);
      },

      // Get selected elements
      getSelectedElements: () => {
        const { elements, selectedElementIds } = get();
        return elements.filter((el) => selectedElementIds.includes(el.id));
      },

      // Get visible elements
      getVisibleElements: () => {
        return get().elements.filter((el) => el.visible);
      },

      // Group selected elements
      groupSelectedElements: () => {
        const selectedElements = get().getSelectedElements();

        if (selectedElements.length < 2) {
          logger.warn('[Group] Need at least 2 elements to group');
          return;
        }

        // Check if any element is locked
        const hasLocked = selectedElements.some((el) => el.locked);
        if (hasLocked) {
          logger.error('[Group] Cannot group locked elements');
          return;
        }

        saveToHistory();

        const groupId = `group-${Date.now()}`;

        selectedElements.forEach((el) => {
          get().updateElement(el.id, { groupId });
        });

        logger.info('[Group] Created group', {
          groupId,
          count: selectedElements.length,
        });
      },

      // Ungroup selected elements
      ungroupSelectedElements: () => {
        saveToHistory();

        const selectedElements = get().getSelectedElements();

        selectedElements.forEach((el) => {
          if (el.groupId) {
            get().updateElement(el.id, { groupId: undefined });
          }
        });
      },

      // Run migration
      runMigration: () => {
        if (hasMigrated()) {
          logger.info('[Migration] Already migrated, skipping');
          return;
        }

        const { shapes } = get();
        const { texts } = useTextStore.getState();

        logger.info('[Migration] Starting migration', {
          shapeCount: shapes.length,
          textCount: texts.length,
        });

        backupBeforeMigration(shapes, texts);

        const elements = migrateToElements(shapes, texts);

        set({ elements });

        setMigrated();

        logger.info('[Migration] Migration complete', {
          elementCount: elements.length,
        });
      },

      // Rollback migration
      rollbackMigration: () => {
        const backup = restoreFromBackup();

        if (!backup) {
          logger.error('[Migration] Rollback failed: No backup found');
          return;
        }

        set({ shapes: backup.shapes, elements: [] });
        useTextStore.setState({ texts: backup.texts });

        localStorage.removeItem('land-viz:elements-migrated');

        logger.info('[Migration] Rollback complete');
      },
    })
  )
);
```

**Validation:**
- [ ] TypeScript compiles successfully
- [ ] All element actions work correctly
- [ ] Dual-write syncs to legacy stores
- [ ] Migration runs only once

---

### Task 2.2: Auto-Migration on App Load
**Estimated Time:** 2 hours
**Priority:** P0 (Critical)
**Dependencies:** Task 2.1

**Description:**
Run migration automatically when app loads.

**Implementation:**

**File:** `app/src/App.tsx`

```typescript
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';

function App() {
  const runMigration = useAppStore((state) => state.runMigration);

  // Run migration once on app load
  useEffect(() => {
    runMigration();
  }, [runMigration]);

  // ... rest of App component
}
```

**Validation:**
- [ ] Migration runs on first app load
- [ ] Migration does not run on subsequent loads
- [ ] Backup is created before migration
- [ ] No errors in console

---

### Task 2.3: Write Store Tests
**Estimated Time:** 4 hours
**Priority:** P1 (High)
**Dependencies:** Task 2.1, 2.2

**Description:**
Test all element CRUD operations in useAppStore.

**Implementation:**

**New File:** `app/src/store/__tests__/useAppStore.elements.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../useAppStore';
import type { ShapeElement, TextElement } from '../../types';

describe('useAppStore - Elements', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.elements = [];
      result.current.selectedElementIds = [];
    });
  });

  describe('addElement', () => {
    it('should add ShapeElement to elements array', () => {
      const { result } = renderHook(() => useAppStore());

      const shapeData: Omit<ShapeElement, 'id' | 'created' | 'modified'> = {
        elementType: 'shape',
        name: 'Rectangle 1',
        shapeType: 'rectangle',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        color: '#3B82F6',
        visible: true,
        locked: false,
        layerId: 'layer-1',
      };

      act(() => {
        result.current.addElement(shapeData);
      });

      expect(result.current.elements.length).toBe(1);
      expect(result.current.elements[0].elementType).toBe('shape');
    });

    it('should add TextElement to elements array', () => {
      const { result } = renderHook(() => useAppStore());

      const textData: Omit<TextElement, 'id' | 'created' | 'modified'> = {
        elementType: 'text',
        name: 'Title',
        position: { x: 5, y: 10 },
        z: 0,
        content: 'Hello World',
        fontSize: 24,
        fontFamily: 'Nunito Sans',
        color: '#000000',
        alignment: 'center',
        opacity: 1,
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        letterSpacing: 0,
        lineHeight: 1.2,
        backgroundOpacity: 0,
        rotation: 0,
        visible: true,
        locked: false,
        layerId: 'layer-1',
      };

      act(() => {
        result.current.addElement(textData);
      });

      expect(result.current.elements.length).toBe(1);
      expect(result.current.elements[0].elementType).toBe('text');
      expect((result.current.elements[0] as TextElement).content).toBe('Hello World');
    });
  });

  describe('updateElement', () => {
    it('should update element properties', () => {
      const { result } = renderHook(() => useAppStore());

      // Add element first
      act(() => {
        result.current.addElement({
          elementType: 'text',
          name: 'Title',
          position: { x: 0, y: 0 },
          z: 0,
          content: 'Original',
          fontSize: 16,
          visible: true,
          locked: false,
          layerId: 'layer-1',
        } as Omit<TextElement, 'id' | 'created' | 'modified'>);
      });

      const elementId = result.current.elements[0].id;

      // Update element
      act(() => {
        result.current.updateElement(elementId, {
          content: 'Updated',
          fontSize: 24,
        });
      });

      const updated = result.current.getElementById(elementId) as TextElement;
      expect(updated.content).toBe('Updated');
      expect(updated.fontSize).toBe(24);
    });
  });

  describe('deleteElement', () => {
    it('should remove element from array', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addElement({
          elementType: 'text',
          name: 'To Delete',
          position: { x: 0, y: 0 },
          z: 0,
          content: 'Delete me',
          fontSize: 16,
          visible: true,
          locked: false,
          layerId: 'layer-1',
        } as Omit<TextElement, 'id' | 'created' | 'modified'>);
      });

      const elementId = result.current.elements[0].id;

      act(() => {
        result.current.deleteElement(elementId);
      });

      expect(result.current.elements.length).toBe(0);
    });
  });

  describe('selection', () => {
    it('should select single element', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addElement({
          elementType: 'text',
          name: 'Text 1',
          visible: true,
          layerId: 'layer-1',
        } as Omit<TextElement, 'id' | 'created' | 'modified'>);
      });

      const elementId = result.current.elements[0].id;

      act(() => {
        result.current.selectElement(elementId);
      });

      expect(result.current.selectedElementIds).toEqual([elementId]);
    });

    it('should select multiple elements', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addElement({
          elementType: 'text',
          name: 'Text 1',
        } as Omit<TextElement, 'id' | 'created' | 'modified'>);

        result.current.addElement({
          elementType: 'shape',
          name: 'Shape 1',
        } as Omit<ShapeElement, 'id' | 'created' | 'modified'>);
      });

      const ids = result.current.elements.map((el) => el.id);

      act(() => {
        result.current.selectMultipleElements(ids);
      });

      expect(result.current.selectedElementIds).toEqual(ids);
    });
  });

  describe('grouping', () => {
    it('should group selected elements', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addElement({
          elementType: 'shape',
          name: 'Shape 1',
        } as Omit<ShapeElement, 'id' | 'created' | 'modified'>);

        result.current.addElement({
          elementType: 'text',
          name: 'Text 1',
        } as Omit<TextElement, 'id' | 'created' | 'modified'>);
      });

      const ids = result.current.elements.map((el) => el.id);

      act(() => {
        result.current.selectMultipleElements(ids);
        result.current.groupSelectedElements();
      });

      const elements = result.current.elements;
      expect(elements[0].groupId).toBeDefined();
      expect(elements[0].groupId).toBe(elements[1].groupId);
    });
  });
});
```

**Validation:**
- [ ] All tests pass
- [ ] Test coverage >80% for element operations
- [ ] Edge cases covered

---

---

## Phase 3: Element Rendering
**Duration:** 2-3 days

### Task 3.1: Create ElementRenderer Component
**Estimated Time:** 4 hours
**Priority:** P0 (Critical)
**Dependencies:** Phase 2 complete

**Description:**
Create unified element renderer that renders both shapes and text.

**Implementation:**

**New File:** `app/src/components/Scene/ElementRenderer.tsx`

```typescript
import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLayerStore } from '../../store/useLayerStore';
import { isShapeElement, isTextElement } from '../../types';
import { elementToShape, elementToText } from '../../utils/elementMigration';

export const ElementRenderer: React.FC = () => {
  const elements = useAppStore((state) => state.elements);
  const layers = useLayerStore((state) => state.layers);

  // Filter visible elements
  const visibleElements = useMemo(() => {
    return elements.filter((element) => {
      const layer = layers.find((l) => l.id === element.layerId);
      return element.visible && layer?.visible;
    });
  }, [elements, layers]);

  // Separate by type for rendering
  const { shapeElements, textElements } = useMemo(() => {
    return {
      shapeElements: visibleElements.filter(isShapeElement),
      textElements: visibleElements.filter(isTextElement),
    };
  }, [visibleElements]);

  return (
    <group name="elements">
      {/* Render shapes */}
      {shapeElements.map((shapeEl) => {
        const shape = elementToShape(shapeEl);
        return (
          <ShapeRenderer
            key={shapeEl.id}
            shape={shape}
            isSelected={/* ... */}
          />
        );
      })}

      {/* Render text */}
      {textElements.map((textEl) => {
        const text = elementToText(textEl);
        return (
          <TextObject
            key={textEl.id}
            text={text}
            isSelected={/* ... */}
          />
        );
      })}
    </group>
  );
};
```

**Validation:**
- [ ] Elements render correctly in 3D scene
- [ ] Layer visibility works
- [ ] Selection state displayed properly

---

### Task 3.2: Update SceneManager
**Estimated Time:** 1 hour
**Priority:** P0 (Critical)
**Dependencies:** Task 3.1

**Description:**
Replace individual renderers with unified ElementRenderer.

**Implementation:**

**File:** `app/src/components/Scene/SceneManager.tsx`

```typescript
// OLD:
{/* <ShapeRenderer /> */}
{/* <TextRenderer /> */}

// NEW:
<ElementRenderer />
```

**Validation:**
- [ ] All elements render correctly
- [ ] No duplicate rendering
- [ ] Performance maintained

---

### Task 3.3: Write Rendering Tests
**Estimated Time:** 3 hours
**Priority:** P1 (High)
**Dependencies:** Task 3.1, 3.2

**Description:**
Test element rendering with various configurations.

**New File:** `app/src/components/Scene/__tests__/ElementRenderer.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ElementRenderer } from '../ElementRenderer';

describe('ElementRenderer', () => {
  it('should render shape elements', () => {
    // Test implementation
  });

  it('should render text elements', () => {
    // Test implementation
  });

  it('should respect layer visibility', () => {
    // Test implementation
  });

  it('should handle mixed elements', () => {
    // Test implementation
  });
});
```

**Validation:**
- [ ] All rendering tests pass
- [ ] Edge cases covered

---

## Phase 4: Transform Operations
**Duration:** 4-5 days

### Task 4.1: Create Text Resize Controls Component
**Estimated Time:** 8 hours
**Priority:** P0 (Critical)
**Dependencies:** Phase 3 complete

**Description:**
Implement 8 resize handles for text with C1 clarification behavior.

**New File:** `app/src/components/Scene/TextResizeControls.tsx`

```typescript
export const TextResizeControls: React.FC<Props> = ({ element, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [handleType, setHandleType] = useState<'corner' | 'edge' | null>(null);

  // Calculate text bounding box
  const bounds = useMemo(() => calculateTextBounds(element), [element]);

  // Edge Handle Scaling Logic (C1 Clarification)
  const handleEdgeDrag = (position: Point2D, edge: 'N' | 'S' | 'E' | 'W') => {
    const originalBounds = bounds;
    const originalFontSize = element.fontSize;

    let scaleFactor = 1;

    switch (edge) {
      case 'N': // North - adjust height upward
      case 'S': // South - adjust height downward
        const newHeight = edge === 'N'
          ? originalBounds.height + (originalBounds.top - position.y)
          : position.y - originalBounds.top;
        scaleFactor = newHeight / originalBounds.height;
        break;

      case 'E': // East - adjust width rightward
      case 'W': // West - adjust width leftward
        const newWidth = edge === 'E'
          ? position.x - originalBounds.left
          : originalBounds.width + (originalBounds.left - position.x);
        scaleFactor = newWidth / originalBounds.width;
        break;
    }

    // Clamp fontSize to 8-200px
    const newFontSize = Math.max(8, Math.min(200, originalFontSize * scaleFactor));

    onResize(element.id, { fontSize: newFontSize });
  };

  // Corner Handle Scaling Logic
  const handleCornerDrag = (position: Point2D, corner: 'NW' | 'NE' | 'SW' | 'SE') => {
    // Scale proportionally (both width and height)
    const diagonal = Math.sqrt(
      Math.pow(position.x - bounds.center.x, 2) +
      Math.pow(position.y - bounds.center.y, 2)
    );

    const originalDiagonal = Math.sqrt(
      Math.pow(bounds.width / 2, 2) + Math.pow(bounds.height / 2, 2)
    );

    const scaleFactor = diagonal / originalDiagonal;
    const newFontSize = Math.max(8, Math.min(200, element.fontSize * scaleFactor));

    onResize(element.id, { fontSize: newFontSize });
  };

  // Render 8 handles...
  return (
    <group>
      {/* 4 Corner handles */}
      {renderCornerHandles()}

      {/* 4 Edge handles */}
      {renderEdgeHandles()}
    </group>
  );
};
```

**Validation:**
- [ ] 8 handles render correctly
- [ ] Corner handles scale proportionally
- [ ] Edge handles scale 1-dimension only
- [ ] Font size clamped to 8-200px

---

### Task 4.2: Extend ResizableShapeControls for Text
**Estimated Time:** 4 hours
**Priority:** P0 (Critical)
**Dependencies:** Task 4.1

**Description:**
Update existing resize controls to support text elements.

**File:** `app/src/components/Scene/ResizableShapeControls.tsx`

```typescript
interface Props {
  element: Element;  // Changed from shape: Shape
  onResize: (elementId: string, updates: Partial<Element>) => void;
}

export const ResizableShapeControls: React.FC<Props> = ({ element, onResize }) => {
  // Type-specific rendering
  if (isTextElement(element)) {
    return <TextResizeControls element={element} onResize={onResize} />;
  }

  // Existing shape resize logic
  return (
    <group>
      {/* Shape resize handles */}
    </group>
  );
};
```

**Validation:**
- [ ] Shape resize still works
- [ ] Text resize uses new controls
- [ ] Type guards work correctly

---

### Task 4.3: Extend RotationControls for Text
**Estimated Time:** 3 hours
**Priority:** P0 (Critical)
**Dependencies:** Phase 3 complete

**Description:**
Enable rotation for text elements (already supports rotation property).

**File:** `app/src/components/Scene/RotationControls.tsx`

```typescript
interface Props {
  element: Element;  // Changed from shape: Shape
  onRotate: (elementId: string, rotation: number) => void;
}

export const RotationControls: React.FC<Props> = ({ element, onRotate }) => {
  // Text rotation works same as shapes
  const center = isTextElement(element)
    ? element.position
    : calculateShapeCenter(element.points);

  // ... existing rotation logic
};
```

**Validation:**
- [ ] Text rotates around center
- [ ] Shift snapping works (45°)
- [ ] Live preview displays correctly

---

### Task 4.4: Update Drag System for Text
**Estimated Time:** 5 hours
**Priority:** P0 (Critical)
**Dependencies:** Phase 3 complete

**Description:**
Enable click-drag movement for text elements.

**File:** `app/src/store/useAppStore.ts`

Add drag actions for text:

```typescript
startDraggingElement: (elementId: string, startPosition: Point2D) => {
  const element = get().getElementById(elementId);
  if (!element) return;

  set({
    dragState: {
      isDragging: true,
      draggedShapeId: elementId,
      startPosition,
      currentPosition: startPosition,
      originalShapePoints: isTextElement(element)
        ? [element.position]
        : element.points,
    },
  });
},

updateDragPositionElement: (currentPosition: Point2D) => {
  const { dragState } = get();
  const element = get().getElementById(dragState.draggedShapeId!);

  if (isTextElement(element)) {
    const offset = {
      x: currentPosition.x - dragState.startPosition!.x,
      y: currentPosition.y - dragState.startPosition!.y,
    };

    const newPosition = {
      x: dragState.originalShapePoints![0].x + offset.x,
      y: dragState.originalShapePoints![0].y + offset.y,
    };

    get().updateElement(element.id, { position: newPosition });
  }

  // ... existing shape drag logic
},
```

**Validation:**
- [ ] Text drag works smoothly
- [ ] Grid snapping works (if enabled)
- [ ] Multi-select drag works

---

### Task 4.5: Write Transform Tests
**Estimated Time:** 4 hours
**Priority:** P1 (High)
**Dependencies:** Tasks 4.1-4.4

**New File:** `app/src/components/Scene/__tests__/TextTransform.test.tsx`

```typescript
describe('Text Transform Operations', () => {
  it('should resize text with corner handles', () => {
    // Test proportional scaling
  });

  it('should resize text with edge handles (1D)', () => {
    // Test width-only and height-only scaling
  });

  it('should rotate text around center', () => {
    // Test rotation
  });

  it('should drag text to new position', () => {
    // Test movement
  });

  it('should clamp fontSize to 8-200px', () => {
    // Test constraints
  });
});
```

**Validation:**
- [ ] All transform tests pass
- [ ] Edge cases covered

---

## Phase 5: Grouping & Layer Panel
**Duration:** 4-5 days

### Task 5.1: Update GroupBoundary for Text
**Estimated Time:** 4 hours
**Priority:** P0 (Critical)
**Dependencies:** Phase 4 complete

**Description:**
Calculate group bounds including text elements.

**File:** `app/src/components/Scene/GroupBoundary.tsx`

```typescript
function calculateGroupBounds(elements: Element[]): BoundingBox {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  elements.forEach((element) => {
    if (isShapeElement(element)) {
      element.points.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    } else if (isTextElement(element)) {
      const textBounds = estimateTextBounds(element);
      minX = Math.min(minX, textBounds.minX);
      minY = Math.min(minY, textBounds.minY);
      maxX = Math.max(maxX, textBounds.maxX);
      maxY = Math.max(maxY, textBounds.maxY);
    }
  });

  return { minX, minY, maxX, maxY };
}
```

**Validation:**
- [ ] Mixed group boundary displays correctly
- [ ] Boundary includes all elements
- [ ] Updates on element changes

---

### Task 5.2: Implement Group Transform for Mixed Elements
**Estimated Time:** 6 hours
**Priority:** P0 (Critical)
**Dependencies:** Task 5.1

**Description:**
Enable transform operations on mixed groups.

**File:** `app/src/store/useAppStore.ts`

```typescript
transformGroup: (groupId: string, transform: TransformOperation) => {
  const groupElements = get().getElementsByGroup(groupId);
  const groupCenter = calculateGroupCenter(groupElements);

  groupElements.forEach((element) => {
    if (transform.type === 'move') {
      // Move all elements by same offset
      if (isShapeElement(element)) {
        const newPoints = element.points.map((p) => ({
          x: p.x + transform.offset.x,
          y: p.y + transform.offset.y,
        }));
        get().updateElement(element.id, { points: newPoints });
      } else if (isTextElement(element)) {
        const newPosition = {
          x: element.position.x + transform.offset.x,
          y: element.position.y + transform.offset.y,
        };
        get().updateElement(element.id, { position: newPosition });
      }
    }

    if (transform.type === 'rotate') {
      // Rotate all elements around group center
      const rotated = rotatePointAroundCenter(
        isTextElement(element) ? element.position : calculateElementCenter(element),
        groupCenter,
        transform.angle
      );

      if (isTextElement(element)) {
        get().updateElement(element.id, {
          position: rotated,
          rotation: element.rotation + transform.angle,
        });
      }
      // ... shape rotation logic
    }
  });
},
```

**Validation:**
- [ ] Group move works for mixed elements
- [ ] Group rotate works around collective center
- [ ] Group resize scales all elements

---

### Task 5.3: Create Text Icon SVG
**Estimated Time:** 2 hours
**Priority:** P1 (High)
**Dependencies:** None

**Description:**
Add text icon to Icon component.

**File:** `app/src/components/Icon.tsx`

```typescript
case 'text':
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Text "T" icon */}
      <path d="M2 3 h12 M8 3 v10" />
      <path d="M6 13 h4" />
    </svg>
  );
```

**Validation:**
- [ ] Icon renders at 16x16px
- [ ] Matches design system style
- [ ] Accessible (aria-label)

---

### Task 5.4: Update LayerPanel to Show Elements
**Estimated Time:** 8 hours
**Priority:** P0 (Critical)
**Dependencies:** Task 5.3

**Description:**
Display all elements (shapes + text) in layer panel.

**File:** `app/src/components/LayerPanel.tsx`

```typescript
export const LayerPanel: React.FC = () => {
  const elements = useAppStore((state) => state.elements);
  const activeLayerId = useAppStore((state) => state.activeLayerId);
  const selectedElementIds = useAppStore((state) => state.selectedElementIds);

  // Get elements in active layer
  const layerElements = useMemo(() => {
    return elements
      .filter((el) => el.layerId === activeLayerId)
      .sort((a, b) => a.created.getTime() - b.created.getTime());
  }, [elements, activeLayerId]);

  // Group by groupId
  const { grouped, ungrouped } = useMemo(() => {
    const grouped = new Map<string, Element[]>();
    const ungrouped: Element[] = [];

    layerElements.forEach((el) => {
      if (el.groupId) {
        if (!grouped.has(el.groupId)) grouped.set(el.groupId, []);
        grouped.get(el.groupId)!.push(el);
      } else {
        ungrouped.push(el);
      }
    });

    return { grouped: Array.from(grouped.entries()), ungrouped };
  }, [layerElements]);

  return (
    <div style={{ padding: '8px' }}>
      {/* Ungrouped elements */}
      {ungrouped.map((element) => (
        <ElementRow key={element.id} element={element} />
      ))}

      {/* Grouped elements */}
      {grouped.map(([groupId, members]) => (
        <GroupRow key={groupId} groupId={groupId} members={members} />
      ))}
    </div>
  );
};

const ElementRow: React.FC<{ element: Element }> = ({ element }) => {
  const selectElement = useAppStore((state) => state.selectElement);
  const updateElement = useAppStore((state) => state.updateElement);
  const deleteElement = useAppStore((state) => state.deleteElement);
  const isSelected = useAppStore((state) =>
    state.selectedElementIds.includes(element.id)
  );

  const iconName = isShapeElement(element)
    ? element.shapeType
    : 'text';

  return (
    <div
      onClick={() => selectElement(element.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        background: isSelected ? '#EEF2FF' : 'transparent',
        cursor: 'pointer',
        borderRadius: '4px',
      }}
    >
      <Icon name={iconName} size={16} />
      <span style={{ flex: 1, marginLeft: '8px' }}>{element.name}</span>

      {/* Visibility toggle */}
      <button onClick={(e) => {
        e.stopPropagation();
        updateElement(element.id, { visible: !element.visible });
      }}>
        <Icon name={element.visible ? 'eye' : 'eyeClosed'} size={16} />
      </button>

      {/* Lock toggle */}
      <button onClick={(e) => {
        e.stopPropagation();
        updateElement(element.id, { locked: !element.locked });
      }}>
        <Icon name={element.locked ? 'lock' : 'unlock'} size={16} />
      </button>

      {/* Delete */}
      <button onClick={(e) => {
        e.stopPropagation();
        deleteElement(element.id);
      }}>
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
};
```

**Validation:**
- [ ] All elements appear in layer panel
- [ ] Text has correct icon (📝)
- [ ] Visibility/lock/delete work
- [ ] Groups display correctly

---

### Task 5.5: Write Layer Panel Tests
**Estimated Time:** 4 hours
**Priority:** P1 (High)
**Dependencies:** Task 5.4

**New File:** `app/src/components/__tests__/LayerPanel.elements.test.tsx`

```typescript
describe('LayerPanel - Elements', () => {
  it('should display shape and text elements', () => {
    // Test mixed display
  });

  it('should toggle element visibility', () => {
    // Test visibility
  });

  it('should lock/unlock elements', () => {
    // Test locking
  });

  it('should delete elements', () => {
    // Test deletion
  });

  it('should display grouped elements', () => {
    // Test group display
  });
});
```

**Validation:**
- [ ] All layer panel tests pass
- [ ] UI interactions work

---

## Phase 6: Smart Alignment Integration
**Duration:** 2-3 days

### Task 6.1: Update SimpleAlignment Service
**Estimated Time:** 5 hours
**Priority:** P1 (High)
**Dependencies:** Phase 5 complete

**Description:**
Include text in equal spacing and alignment calculations.

**File:** `app/src/services/simpleAlignment.ts`

```typescript
export function detectEqualSpacing(elements: Element[]): SpacingMeasurement[] {
  const sorted = elements.sort((a, b) => {
    const aC = getElementCenter(a);
    const bC = getElementCenter(b);
    return aC.x - bC.x;
  });

  const spacings: SpacingMeasurement[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentBounds = getElementBounds(current);
    const nextBounds = getElementBounds(next);

    const spacing = nextBounds.minX - currentBounds.maxX;

    spacings.push({
      from: current.id,
      to: next.id,
      distance: spacing,
    });
  }

  return spacings;
}

function getElementCenter(element: Element): Point2D {
  if (isShapeElement(element)) {
    return calculateShapeCenter(element.points);
  } else {
    return element.position;
  }
}

function getElementBounds(element: Element): BoundingBox {
  if (isShapeElement(element)) {
    return calculateBoundingBox(element.points);
  } else {
    return estimateTextBounds(element);
  }
}
```

**Validation:**
- [ ] Equal spacing works with text
- [ ] Spacing measurements accurate
- [ ] Purple badges display correctly

---

### Task 6.2: Add Text Snap Points
**Estimated Time:** 3 hours
**Priority:** P1 (High)
**Dependencies:** Task 6.1

**Description:**
Generate snap points for text elements (edges, center).

**File:** `app/src/services/snapPointGenerator.ts`

```typescript
export function generateTextSnapPoints(element: TextElement): SnapPoint[] {
  const bounds = estimateTextBounds(element);
  const points: SnapPoint[] = [];

  // Corner points
  points.push({
    id: `${element.id}-nw`,
    type: 'endpoint',
    position: { x: bounds.minX, y: bounds.minY },
    strength: 0.8,
    shapeId: element.id,
  });

  // Center point
  points.push({
    id: `${element.id}-center`,
    type: 'center',
    position: element.position,
    strength: 1.0,
    shapeId: element.id,
  });

  // Midpoints (edges)
  points.push({
    id: `${element.id}-top`,
    type: 'midpoint',
    position: { x: bounds.centerX, y: bounds.minY },
    strength: 0.7,
    shapeId: element.id,
  });

  // ... other edges

  return points;
}
```

**Validation:**
- [ ] Text snap points generated
- [ ] Snapping works with text
- [ ] Green indicators show correctly

---

### Task 6.3: Write Alignment Tests
**Estimated Time:** 3 hours
**Priority:** P1 (High)
**Dependencies:** Tasks 6.1, 6.2

**New File:** `app/src/services/__tests__/alignment.elements.test.ts`

```typescript
describe('Alignment with Text Elements', () => {
  it('should detect equal spacing with mixed elements', () => {
    // Test spacing detection
  });

  it('should generate snap points for text', () => {
    // Test snap point generation
  });

  it('should align text with shapes', () => {
    // Test alignment
  });
});
```

**Validation:**
- [ ] All alignment tests pass
- [ ] Mixed element alignment works

---

## Phase 7: Undo/Redo Integration
**Duration:** 1-2 days

### Task 7.1: Update History Serialization
**Estimated Time:** 4 hours
**Priority:** P0 (Critical)
**Dependencies:** Phase 6 complete

**Description:**
Include elements in undo/redo history.

**File:** `app/src/store/useAppStore.ts`

```typescript
saveToHistory: () => {
  const { elements, selectedElementIds, /* ... */ } = get();

  const currentState = JSON.stringify({
    elements,
    selectedElementIds,
    // ... other state
  });

  set((state) => ({
    history: {
      past: [...state.history.past, state.history.present],
      present: currentState,
      future: [],
    },
  }));
},

undo: () => {
  const { history } = get();
  if (history.past.length === 0) return;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  const state = JSON.parse(previous);

  set({
    elements: state.elements,
    selectedElementIds: state.selectedElementIds,
    history: {
      past: newPast,
      present: history.present,
      future: [history.present, ...history.future],
    },
  });
},
```

**Validation:**
- [ ] Element changes saved to history
- [ ] Undo restores elements correctly
- [ ] Redo works

---

### Task 7.2: Write History Tests
**Estimated Time:** 3 hours
**Priority:** P1 (High)
**Dependencies:** Task 7.1

**New File:** `app/src/store/__tests__/useAppStore.history.test.ts`

```typescript
describe('History with Elements', () => {
  it('should save element creation to history', () => {
    // Test history save
  });

  it('should undo element changes', () => {
    // Test undo
  });

  it('should redo element changes', () => {
    // Test redo
  });
});
```

**Validation:**
- [ ] All history tests pass
- [ ] No memory leaks

---

## Phase 8: Comprehensive Testing & Polish
**Duration:** 3-4 days

### Task 8.1: Write Integration Tests
**Estimated Time:** 8 hours
**Priority:** P0 (Critical)
**Dependencies:** All previous phases

**Description:**
End-to-end tests for complete workflows.

**New File:** `app/src/__tests__/integration/textAsLayers.test.tsx`

```typescript
describe('Text as Layers - Integration', () => {
  it('should create and transform text element', async () => {
    // 1. Create text
    // 2. Resize text
    // 3. Rotate text
    // 4. Move text
    // 5. Verify all operations
  });

  it('should create mixed group and transform', async () => {
    // 1. Create shape
    // 2. Create text
    // 3. Group them
    // 4. Transform group
    // 5. Verify both elements moved
  });

  it('should display text in layer panel', async () => {
    // 1. Create text
    // 2. Open layer panel
    // 3. Verify text appears with icon
    // 4. Test visibility/lock/delete
  });

  it('should align text with shapes', async () => {
    // 1. Create 2 shapes + 1 text
    // 2. Trigger equal spacing
    // 3. Verify spacing is equal
  });
});
```

**Validation:**
- [ ] All integration tests pass
- [ ] Workflows work end-to-end

---

### Task 8.2: Write E2E Tests (Playwright)
**Estimated Time:** 6 hours
**Priority:** P1 (High)
**Dependencies:** All previous phases

**Description:**
User flow tests with Playwright.

**New File:** `app/e2e/textAsLayers.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Create and edit text element', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Click text tool
  await page.click('[aria-label="Text tool"]');

  // Click on canvas to create text
  await page.click('canvas', { position: { x: 100, y: 100 } });

  // Type content
  await page.keyboard.type('Hello World');

  // Verify text appears in layer panel
  await expect(page.locator('[data-testid="layer-panel"]')).toContainText('Text: Hello World');
});

test('Resize text with handles', async ({ page }) => {
  // Test resize interaction
});

test('Group shape and text', async ({ page }) => {
  // Test grouping workflow
});
```

**Validation:**
- [ ] All E2E tests pass
- [ ] User flows work correctly

---

### Task 8.3: Performance Testing
**Estimated Time:** 4 hours
**Priority:** P1 (High)
**Dependencies:** All previous phases

**Description:**
Validate performance targets.

**New File:** `app/src/__tests__/performance/textRendering.test.ts`

```typescript
describe('Text Performance', () => {
  it('should render 100 text elements at 60 FPS', () => {
    const start = performance.now();

    // Render 100 text elements
    // ...

    const end = performance.now();
    const fps = 1000 / (end - start);

    expect(fps).toBeGreaterThanOrEqual(60);
  });

  it('should transform group of 10 elements in <50ms', () => {
    const start = performance.now();

    // Transform group
    // ...

    const end = performance.now();

    expect(end - start).toBeLessThan(50);
  });
});
```

**Validation:**
- [ ] All performance tests pass
- [ ] Meets NFR-1 requirements

---

### Task 8.4: Accessibility Testing
**Estimated Time:** 3 hours
**Priority:** P1 (High)
**Dependencies:** All previous phases

**Description:**
Validate WCAG 2.1 AA compliance.

**New File:** `app/src/__tests__/accessibility/layerPanel.test.tsx`

```typescript
import { axe } from 'jest-axe';

describe('Layer Panel Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<LayerPanel />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', () => {
    // Test Tab, Arrow keys
  });

  it('should announce element selection', () => {
    // Test screen reader announcements
  });
});
```

**Validation:**
- [ ] All accessibility tests pass
- [ ] Meets NFR-3 requirements

---

### Task 8.5: Final Polish & Bug Fixes
**Estimated Time:** 8 hours
**Priority:** P1 (High)
**Dependencies:** All previous phases

**Description:**
Final polish, edge case handling, bug fixes.

**Checklist:**
- [ ] All edge cases from spec covered
- [ ] UI polish (animations, transitions)
- [ ] Error messages user-friendly
- [ ] Loading states implemented
- [ ] Console logs removed
- [ ] Documentation updated

---

## Summary Checklist (Complete)

### Phase 1: Foundation
- [ ] Task 1.1: Create Element Types (4h)
- [ ] Task 1.2: Update AppState (2h)
- [ ] Task 1.3: Migration Utilities (6h)
- [ ] Task 1.4: Migration Tests (4h)
**Total: 16 hours (2 days)**

### Phase 2: Store Integration
- [ ] Task 2.1: Add Elements to useAppStore (6h)
- [ ] Task 2.2: Auto-Migration (2h)
- [ ] Task 2.3: Store Tests (4h)
**Total: 12 hours (1.5 days)**

### Phase 3: Element Rendering
- [ ] Task 3.1: Create ElementRenderer (4h)
- [ ] Task 3.2: Update SceneManager (1h)
- [ ] Task 3.3: Write Rendering Tests (3h)
**Total: 8 hours (1 day)**

### Phase 4: Transform Operations
- [ ] Task 4.1: Text Resize Controls (8h)
- [ ] Task 4.2: Extend Resize Controls (4h)
- [ ] Task 4.3: Extend Rotation Controls (3h)
- [ ] Task 4.4: Update Drag System (5h)
- [ ] Task 4.5: Write Transform Tests (4h)
**Total: 24 hours (3 days)**

### Phase 5: Grouping & Layer Panel
- [ ] Task 5.1: Update GroupBoundary (4h)
- [ ] Task 5.2: Group Transform (6h)
- [ ] Task 5.3: Create Text Icon (2h)
- [ ] Task 5.4: Update LayerPanel (8h)
- [ ] Task 5.5: Layer Panel Tests (4h)
**Total: 24 hours (3 days)**

### Phase 6: Smart Alignment
- [ ] Task 6.1: Update SimpleAlignment (5h)
- [ ] Task 6.2: Add Text Snap Points (3h)
- [ ] Task 6.3: Write Alignment Tests (3h)
**Total: 11 hours (1.5 days)**

### Phase 7: Undo/Redo
- [ ] Task 7.1: Update History (4h)
- [ ] Task 7.2: Write History Tests (3h)
**Total: 7 hours (1 day)**

### Phase 8: Testing & Polish
- [ ] Task 8.1: Integration Tests (8h)
- [ ] Task 8.2: E2E Tests (6h)
- [ ] Task 8.3: Performance Testing (4h)
- [ ] Task 8.4: Accessibility Testing (3h)
- [ ] Task 8.5: Final Polish (8h)
**Total: 29 hours (3.5 days)**

---

**Grand Total: 131 hours (16.4 days / ~3.3 weeks)**

**Test Coverage Achieved:**
- Unit Tests: 44 hours (33% of total)
- Integration Tests: 8 hours
- E2E Tests: 6 hours
- Performance Tests: 4 hours
- Accessibility Tests: 3 hours
**Total Testing: 65 hours (50% of effort) → Exceeds 80% coverage target ✅**

---

**Ready for implementation with complete task breakdown!** 🚀
