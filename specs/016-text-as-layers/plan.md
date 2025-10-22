# Implementation Plan: Text as Layers

**Spec ID:** 016
**Feature:** Text as Layers
**Plan Version:** 1.0
**Date:** 2025-01-17

---

## Overview

This document provides a detailed technical implementation plan for integrating text objects into the unified layer system. The implementation follows a **phased migration approach** to minimize risk and ensure backward compatibility.

---

## Architecture Overview

### Current State

```
┌─────────────────┐        ┌──────────────┐
│   useAppStore   │        │ useTextStore │
│                 │        │              │
│ shapes: Shape[] │        │ texts: Text[]│
│                 │        │              │
└─────────────────┘        └──────────────┘
        ↓                           ↓
┌─────────────────┐        ┌──────────────┐
│  ShapeRenderer  │        │ TextRenderer │
│                 │        │              │
└─────────────────┘        └──────────────┘
```

**Issues:**
- Shapes and text managed separately
- Duplicate selection logic
- No unified transform operations
- Text excluded from grouping/alignment

### Target State

```
┌──────────────────────────────┐
│        useAppStore           │
│                              │
│ elements: Element[]          │
│   ├─ ShapeElement[]         │
│   └─ TextElement[]          │
│                              │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│      ElementRenderer         │
│  ├─ ShapeRenderer (shapes)  │
│  └─ TextRenderer (text)     │
└──────────────────────────────┘
```

**Benefits:**
- Unified element management
- Single selection system
- Shared transform operations
- Mixed groups supported

---

## Implementation Phases

### Phase 1: Type System & Foundation
**Duration:** 2-3 days
**Risk:** Low

#### 1.1 Create Element Types

**File:** `app/src/types/index.ts`

**Add new types:**
```typescript
// Element type discriminator
export type ElementType = 'shape' | 'text';

// Base properties shared by all elements
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

// Shape element
export interface ShapeElement extends BaseElement {
  elementType: 'shape';
  shapeType: ShapeType;
  points: Point2D[];
  color: string;
  rotation?: ShapeRotation;
  label?: import('./text').TextObject;
}

// Text element
export interface TextElement extends BaseElement {
  elementType: 'text';
  position: Point2D;  // Converted from TextPosition { x, y, z }
  z: number;          // Separate Z coordinate
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: TextAlignment;
  opacity: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  backgroundOpacity: number;
  rotation: number;   // 0-360 degrees
  attachedToShapeId?: string;
  offset?: { x: number; y: number };
}

// Unified element type
export type Element = ShapeElement | TextElement;

// Type guards
export function isShapeElement(element: Element): element is ShapeElement {
  return element.elementType === 'shape';
}

export function isTextElement(element: Element): element is TextElement {
  return element.elementType === 'text';
}
```

**Keep legacy types:**
```typescript
/**
 * @deprecated Use ShapeElement instead
 */
export interface Shape {
  // ... existing Shape definition
}
```

#### 1.2 Update AppState

**File:** `app/src/types/index.ts`

```typescript
export interface AppState {
  // NEW: Unified elements array
  elements: Element[];

  // LEGACY: Keep for backward compatibility (phase out in Phase 4)
  shapes: Shape[];

  // Update selection to support elements
  selectedElementIds: string[];  // NEW
  selectedShapeId: string | null;  // LEGACY
  selectedShapeIds: string[];      // LEGACY

  hoveredElementId: string | null;  // NEW
  hoveredShapeId: string | null;    // LEGACY

  // ... rest of AppState
}
```

**Migration strategy:** Run both systems in parallel for 2 releases.

#### 1.3 Create Migration Utilities

**New file:** `app/src/utils/elementMigration.ts`

```typescript
import type { Shape, ShapeElement, TextElement, Element } from '../types';
import type { TextObject } from '../types/text';

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
    name: `Text: ${text.content.substring(0, 20)}...`,
    visible: text.visible,
    locked: text.locked,
    layerId: text.layerId,
    groupId: undefined,  // Text doesn't have groupId yet
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
 * Convert ShapeElement back to Shape (for backward compatibility)
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
    position: { x: element.position.x, y: element.position.y, z: element.z },
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
 * Runs on app load to convert existing data
 */
export function migrateToElements(
  shapes: Shape[],
  texts: TextObject[]
): Element[] {
  const shapeElements = shapes.map(shapeToElement);
  const textElements = texts.map(textToElement);

  // Merge and sort by creation date
  return [...shapeElements, ...textElements].sort(
    (a, b) => a.created.getTime() - b.created.getTime()
  );
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
    shapes,
    texts,
  };
  localStorage.setItem('land-viz:pre-migration-backup', JSON.stringify(backup));
}
```

**Tests:** `app/src/utils/__tests__/elementMigration.test.ts`
- Test shape → element conversion
- Test text → element conversion
- Test round-trip conversions (no data loss)
- Test migration function with mixed data

---

### Phase 2: Store Integration
**Duration:** 3-4 days
**Risk:** Medium

#### 2.1 Update useAppStore

**File:** `app/src/store/useAppStore.ts`

**Add elements state:**
```typescript
interface AppStore extends AppState {
  // ... existing actions

  // NEW: Element actions
  addElement: (element: Omit<Element, 'id' | 'created' | 'modified'>) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  selectMultipleElements: (ids: string[]) => void;
  toggleElementSelection: (id: string) => void;
  clearElementSelection: () => void;

  // NEW: Element queries
  getElementById: (id: string) => Element | undefined;
  getElementsByLayer: (layerId: string) => Element[];
  getSelectedElements: () => Element[];
  getVisibleElements: () => Element[];

  // NEW: Migration
  runMigration: () => void;
}
```

**Implementation:**
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
        const id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

        // Also add to legacy arrays for backward compatibility
        if (isShapeElement(newElement)) {
          get().addShape(elementToShape(newElement));
        } else if (isTextElement(newElement)) {
          useTextStore.getState().addText(elementToText(newElement));
        }

        get().saveToHistory();
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

        // Sync to legacy stores
        const element = get().getElementById(id);
        if (element) {
          if (isShapeElement(element)) {
            get().updateShape(id, updates);
          } else if (isTextElement(element)) {
            useTextStore.getState().updateText(id, updates);
          }
        }

        get().saveToHistory();
      },

      // Delete element
      deleteElement: (id) => {
        const element = get().getElementById(id);

        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementIds: state.selectedElementIds.filter((sid) => sid !== id),
        }));

        // Sync to legacy stores
        if (element) {
          if (isShapeElement(element)) {
            get().deleteShape(id);
          } else if (isTextElement(element)) {
            useTextStore.getState().deleteText(id);
          }
        }

        get().saveToHistory();
      },

      // Select element
      selectElement: (id) => {
        set({ selectedElementIds: id ? [id] : [] });

        // Sync to legacy selection
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

      // Multi-select elements
      selectMultipleElements: (ids) => {
        set({ selectedElementIds: ids });

        // Sync shapes to legacy
        const shapeIds = ids.filter(id => {
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

      // Get element by ID
      getElementById: (id) => {
        return get().elements.find((el) => el.id === id);
      },

      // Get elements by layer
      getElementsByLayer: (layerId) => {
        return get().elements.filter((el) => el.layerId === layerId);
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

      // Run migration
      runMigration: () => {
        // Check if already migrated
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

        // Create backup
        backupBeforeMigration(shapes, texts);

        // Migrate
        const elements = migrateToElements(shapes, texts);

        set({ elements });

        // Mark as migrated
        setMigrated();

        logger.info('[Migration] Migration complete', {
          elementCount: elements.length,
        });
      },
    })
  )
);
```

#### 2.2 Auto-Migration on App Load

**File:** `app/src/App.tsx`

```typescript
function App() {
  const runMigration = useAppStore((state) => state.runMigration);

  useEffect(() => {
    // Run migration once on app load
    runMigration();
  }, [runMigration]);

  // ... rest of App component
}
```

---

### Phase 3: Element Rendering
**Duration:** 2-3 days
**Risk:** Medium

#### 3.1 Create ElementRenderer Component

**New file:** `app/src/components/Scene/ElementRenderer.tsx`

```typescript
import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLayerStore } from '../../store/useLayerStore';
import { isShapeElement, isTextElement } from '../../types';
import { ShapeRenderer } from './ShapeRenderer';
import { TextObject } from '../Text/TextObject';
import { elementToText } from '../../utils/elementMigration';

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

  // Separate shapes and text
  const shapeElements = useMemo(() => {
    return visibleElements.filter(isShapeElement);
  }, [visibleElements]);

  const textElements = useMemo(() => {
    return visibleElements.filter(isTextElement);
  }, [visibleElements]);

  return (
    <group name="elements">
      {/* Render shapes */}
      {shapeElements.map((shapeEl) => {
        // Convert to legacy Shape for ShapeRenderer (temporary)
        const shape = elementToShape(shapeEl);
        return <ShapeRenderer key={shapeEl.id} shape={shape} />;
      })}

      {/* Render text */}
      {textElements.map((textEl) => {
        // Convert to TextObject for TextObject component (temporary)
        const text = elementToText(textEl);
        return <TextObject key={textEl.id} text={text} />;
      })}
    </group>
  );
};
```

#### 3.2 Update SceneManager

**File:** `app/src/components/Scene/SceneManager.tsx`

Replace individual renderers with unified `ElementRenderer`:

```typescript
{/* OLD: Separate renderers */}
{/* <ShapeRenderer /> */}
{/* <TextRenderer /> */}

{/* NEW: Unified renderer */}
<ElementRenderer />
```

---

### Phase 4: Transform Operations
**Duration:** 4-5 days
**Risk:** High

#### 4.1 Extend ResizableShapeControls for Text

**File:** `app/src/components/Scene/ResizableShapeControls.tsx`

**Update to support TextElement:**

```typescript
interface Props {
  element: Element;  // Changed from shape: Shape
  onResize: (elementId: string, updates: Partial<Element>) => void;
}

export const ResizableShapeControls: React.FC<Props> = ({ element, onResize }) => {
  // Handle text resize differently
  if (isTextElement(element)) {
    return <TextResizeControls element={element} onResize={onResize} />;
  }

  // Existing shape resize logic
  // ...
};
```

**New component:** `TextResizeControls.tsx`

```typescript
export const TextResizeControls: React.FC<Props> = ({ element, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [originalBounds, setOriginalBounds] = useState<BoundingBox | null>(null);
  const [originalFontSize, setOriginalFontSize] = useState(element.fontSize);

  const handleResizeStart = (handleType: 'corner' | 'edge', handleIndex: number) => {
    setIsResizing(true);
    setOriginalBounds(calculateTextBounds(element));
    setOriginalFontSize(element.fontSize);
  };

  const handleResizeDrag = (position: Point2D, handleType: string, handleIndex: number) => {
    if (!originalBounds) return;

    // Calculate scale factor based on drag distance
    const scaleFactor = calculateScaleFactor(position, originalBounds, handleType, handleIndex);

    // Scale fontSize proportionally
    const newFontSize = Math.max(8, Math.min(200, originalFontSize * scaleFactor));

    // Update element
    onResize(element.id, {
      fontSize: newFontSize,
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setOriginalBounds(null);
  };

  // Render 8 resize handles (same visual as shapes)
  return (
    <group>
      {/* Corner handles */}
      {renderCornerHandles()}

      {/* Edge handles */}
      {renderEdgeHandles()}
    </group>
  );
};
```

#### 4.2 Extend RotationControls for Text

**File:** `app/src/components/Scene/RotationControls.tsx`

**Already supports rotation property, just needs element type support:**

```typescript
interface Props {
  element: Element;  // Changed from shape: Shape
  onRotate: (elementId: string, rotation: number) => void;
}

export const RotationControls: React.FC<Props> = ({ element, onRotate }) => {
  // Text rotation works same as shapes
  // Just apply to element.rotation instead of shape.rotation

  // ... existing rotation logic
};
```

#### 4.3 Update Drag System

**File:** `app/src/store/useAppStore.ts`

**Extend drag actions to support elements:**

```typescript
startDraggingElement: (elementId: string, startPosition: Point2D) => {
  const element = get().getElementById(elementId);
  if (!element) return;

  if (isShapeElement(element)) {
    // Use existing shape drag logic
    get().startDragging(elementId, startPosition);
  } else if (isTextElement(element)) {
    // Store original text position
    set({
      dragState: {
        isDragging: true,
        draggedShapeId: elementId,  // Reuse field
        startPosition,
        currentPosition: startPosition,
        originalShapePoints: [element.position],  // Reuse field
      },
    });
  }
},

updateDragPositionElement: (currentPosition: Point2D) => {
  const { dragState } = get();
  if (!dragState.isDragging || !dragState.draggedShapeId) return;

  const element = get().getElementById(dragState.draggedShapeId);
  if (!element) return;

  const offset = {
    x: currentPosition.x - (dragState.startPosition?.x ?? 0),
    y: currentPosition.y - (dragState.startPosition?.y ?? 0),
  };

  if (isShapeElement(element)) {
    // Existing shape drag
    get().updateDragPosition(currentPosition);
  } else if (isTextElement(element)) {
    // Update text position
    const originalPos = dragState.originalShapePoints![0];
    const newPosition = {
      x: originalPos.x + offset.x,
      y: originalPos.y + offset.y,
    };

    get().updateElement(element.id, { position: newPosition });
  }

  set((state) => ({
    dragState: {
      ...state.dragState,
      currentPosition,
    },
  }));
},
```

---

### Phase 5: Grouping Integration
**Duration:** 3-4 days
**Risk:** High

#### 5.1 Update Grouping Functions

**File:** `app/src/store/useAppStore.ts`

**Extend to support mixed groups:**

```typescript
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
    // Show error toast
    return;
  }

  // Generate unique group ID
  const groupId = `group-${Date.now()}`;

  // Assign groupId to all selected elements
  selectedElements.forEach((el) => {
    get().updateElement(el.id, { groupId });
  });

  logger.info('[Group] Created group', { groupId, count: selectedElements.length });

  get().saveToHistory();
},

ungroupSelectedElements: () => {
  const selectedElements = get().getSelectedElements();

  selectedElements.forEach((el) => {
    if (el.groupId) {
      get().updateElement(el.id, { groupId: undefined });
    }
  });

  get().saveToHistory();
},
```

#### 5.2 Update GroupBoundary Component

**File:** `app/src/components/Scene/GroupBoundary.tsx`

**Calculate bounds including text elements:**

```typescript
function calculateGroupBounds(elements: Element[]): BoundingBox {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  elements.forEach((element) => {
    if (isShapeElement(element)) {
      // Use shape points
      element.points.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    } else if (isTextElement(element)) {
      // Estimate text bounding box
      const textBounds = estimateTextBounds(element);
      minX = Math.min(minX, textBounds.minX);
      minY = Math.min(minY, textBounds.minY);
      maxX = Math.max(maxX, textBounds.maxX);
      maxY = Math.max(maxY, textBounds.maxY);
    }
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
```

#### 5.3 Group Transform Operations

**Update drag system to transform groups:**

```typescript
updateDragPositionGroup: (currentPosition: Point2D) => {
  const { dragState } = get();
  const draggedElement = get().getElementById(dragState.draggedShapeId!);

  if (draggedElement?.groupId) {
    // Get all elements in group
    const groupElements = get().elements.filter((el) => el.groupId === draggedElement.groupId);

    const offset = {
      x: currentPosition.x - (dragState.startPosition?.x ?? 0),
      y: currentPosition.y - (dragState.startPosition?.y ?? 0),
    };

    // Transform all group members
    groupElements.forEach((el) => {
      if (isShapeElement(el)) {
        // Transform shape points
        const newPoints = el.points.map((pt) => ({
          x: pt.x + offset.x,
          y: pt.y + offset.y,
        }));
        get().updateElement(el.id, { points: newPoints });
      } else if (isTextElement(el)) {
        // Transform text position
        const newPosition = {
          x: el.position.x + offset.x,
          y: el.position.y + offset.y,
        };
        get().updateElement(el.id, { position: newPosition });
      }
    });
  }
},
```

---

### Phase 6: Layer Panel Integration
**Duration:** 3-4 days
**Risk:** Medium

#### 6.1 Create Text Icon SVG

**New file:** `app/src/components/Icon.tsx`

**Add text icon:**

```typescript
case 'text':
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3 h10 M8 3 v10 M6 13 h4" />
    </svg>
  );
```

#### 6.2 Update LayerPanel

**File:** `app/src/components/LayerPanel.tsx`

**Show elements instead of shapes:**

```typescript
export const LayerPanel: React.FC = () => {
  const elements = useAppStore((state) => state.elements);
  const layers = useLayerStore((state) => state.layers);
  const activeLayerId = useAppStore((state) => state.activeLayerId);
  const selectedElementIds = useAppStore((state) => state.selectedElementIds);

  // Get elements in active layer
  const layerElements = useMemo(() => {
    return elements.filter((el) => el.layerId === activeLayerId);
  }, [elements, activeLayerId]);

  // Group elements by groupId
  const { groupedElements, ungroupedElements } = useMemo(() => {
    const grouped = new Map<string, Element[]>();
    const ungrouped: Element[] = [];

    layerElements.forEach((el) => {
      if (el.groupId) {
        if (!grouped.has(el.groupId)) {
          grouped.set(el.groupId, []);
        }
        grouped.get(el.groupId)!.push(el);
      } else {
        ungrouped.push(el);
      }
    });

    return {
      groupedElements: Array.from(grouped.entries()),
      ungroupedElements: ungrouped,
    };
  }, [layerElements]);

  return (
    <div>
      {/* Render ungrouped elements */}
      {ungroupedElements.map((element) => (
        <ElementRow key={element.id} element={element} />
      ))}

      {/* Render groups */}
      {groupedElements.map(([groupId, members]) => (
        <GroupRow key={groupId} groupId={groupId} members={members} />
      ))}
    </div>
  );
};

const ElementRow: React.FC<{ element: Element }> = ({ element }) => {
  const selectElement = useAppStore((state) => state.selectElement);
  const updateElement = useAppStore((state) => state.updateElement);
  const deleteElement = useAppStore((state) => state.deleteElement);
  const isSelected = useAppStore((state) => state.selectedElementIds.includes(element.id));

  return (
    <div
      onClick={() => selectElement(element.id)}
      style={{
        background: isSelected ? '#EEF2FF' : 'transparent',
        padding: '8px',
        cursor: 'pointer',
      }}
    >
      {/* Icon */}
      <Icon
        name={isShapeElement(element) ? element.shapeType : 'text'}
        size={16}
        color={isShapeElement(element) ? element.color : element.color}
      />

      {/* Name */}
      <span>{element.name}</span>

      {/* Visibility toggle */}
      <button onClick={() => updateElement(element.id, { visible: !element.visible })}>
        <Icon name={element.visible ? 'eye' : 'eyeClosed'} size={16} />
      </button>

      {/* Lock toggle */}
      <button onClick={() => updateElement(element.id, { locked: !element.locked })}>
        <Icon name={element.locked ? 'lock' : 'unlock'} size={16} />
      </button>

      {/* Delete */}
      <button onClick={() => deleteElement(element.id)}>
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
};
```

---

### Phase 7: Smart Alignment Integration
**Duration:** 2-3 days
**Risk:** Low

#### 7.1 Update SimpleAlignment Service

**File:** `app/src/services/simpleAlignment.ts`

**Include text in alignment calculations:**

```typescript
export function detectEqualSpacing(elements: Element[]): SpacingMeasurement[] {
  // Sort elements by x position
  const sorted = elements.sort((a, b) => {
    const aCenter = getElementCenter(a);
    const bCenter = getElementCenter(b);
    return aCenter.x - bCenter.x;
  });

  // Calculate spacing between consecutive elements
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
      // ... rest of spacing data
    });
  }

  return spacings;
}

function getElementCenter(element: Element): Point2D {
  if (isShapeElement(element)) {
    const bounds = calculateBoundingBox(element.points);
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  } else if (isTextElement(element)) {
    return element.position;
  }
}

function getElementBounds(element: Element): BoundingBox {
  if (isShapeElement(element)) {
    return calculateBoundingBox(element.points);
  } else if (isTextElement(element)) {
    return estimateTextBounds(element);
  }
}
```

---

### Phase 8: Undo/Redo Integration
**Duration:** 1-2 days
**Risk:** Low

#### 8.1 Update History Serialization

**File:** `app/src/store/useAppStore.ts`

**Include elements in history:**

```typescript
saveToHistory: () => {
  const {
    elements,
    selectedElementIds,
    // ... other state
  } = get();

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
```

**Restore from history:**

```typescript
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

  // Sync to legacy stores
  syncToLegacyStores(state.elements);
},
```

---

## Testing Strategy

### Unit Tests

**Test Coverage Target:** 80%

**Files to test:**
- `elementMigration.ts` - All conversion functions
- `useAppStore.ts` - Element CRUD operations
- `simpleAlignment.ts` - Text bounds calculations
- Type guards (`isShapeElement`, `isTextElement`)

**Example test:**
```typescript
describe('elementMigration', () => {
  it('should convert TextObject to TextElement without data loss', () => {
    const textObject: TextObject = {
      id: 'text-1',
      content: 'Hello World',
      fontSize: 24,
      // ... full TextObject
    };

    const textElement = textToElement(textObject);
    const roundTrip = elementToText(textElement);

    expect(roundTrip).toEqual(textObject);
  });
});
```

### Integration Tests

**Scenarios:**
1. Create mixed group (2 shapes + 1 text)
2. Transform mixed group (move, rotate, resize)
3. Ungroup and verify elements unchanged
4. Undo/redo with text elements
5. Layer visibility toggle affects text

### E2E Tests (Playwright)

**User Flows:**
1. Create text → Appears in layer panel
2. Drag text → Position updates
3. Resize text → Font size scales
4. Rotate text → Rotation applies
5. Group shape + text → Unified boundary shows
6. Smart align 3 shapes + 1 text → Equal spacing works

---

## Performance Considerations

### Optimization Strategies

1. **Memoization:**
   - Memoize element filtering (visible, selected)
   - Memoize bounding box calculations
   - Memoize group boundary calculations

2. **Virtualization:**
   - Layer panel virtualizes if >100 elements
   - Only render visible elements in viewport

3. **Throttling:**
   - Throttle transform updates to 60 FPS (16ms)
   - Debounce layer panel search (300ms)

4. **Lazy Loading:**
   - Load text fonts on demand
   - Defer non-visible element rendering

### Performance Budget

| Operation | Target | Maximum |
|-----------|--------|---------|
| Element rendering (100 items) | 60 FPS | 50 FPS |
| Group transform (10 elements) | < 30ms | < 50ms |
| Layer panel update | < 50ms | < 100ms |
| Migration (500 items) | < 500ms | < 1s |
| Undo/redo | < 100ms | < 200ms |

---

## Security Considerations

1. **XSS Prevention:**
   - Sanitize text content before rendering
   - Use `textContent` instead of `innerHTML`

2. **Input Validation:**
   - Validate fontSize range (8-200)
   - Validate rotation range (0-360)
   - Validate element IDs (prevent injection)

3. **Data Integrity:**
   - Validate element type before operations
   - Check for circular group references
   - Prevent deletion of elements in use

---

## Rollback Plan

### If Migration Fails

1. **Detect failure:**
   - Check for corrupted elements array
   - Validate element count matches pre-migration

2. **Restore from backup:**
   ```typescript
   function rollbackMigration() {
     const backup = localStorage.getItem('land-viz:pre-migration-backup');
     if (!backup) {
       logger.error('[Rollback] No backup found');
       return;
     }

     const { shapes, texts } = JSON.parse(backup);

     // Restore legacy stores
     set({ shapes });
     useTextStore.setState({ texts });

     // Clear migration flag
     localStorage.removeItem('land-viz:elements-migrated');

     logger.info('[Rollback] Migration rolled back successfully');
   }
   ```

3. **User notification:**
   - Show toast: "Migration failed. Data restored from backup."
   - Provide support link

---

## Deployment Plan

### Release Strategy

**Phase 1 (Week 1):** Types + Migration (no UI changes)
- Release to beta users
- Monitor for migration errors
- Collect performance metrics

**Phase 2 (Week 2):** Layer Panel Integration
- Enable layer panel for text
- Soft launch to 20% of users
- A/B test: Old vs New layer panel

**Phase 3 (Week 3):** Transform Controls
- Enable resize/rotate for text
- Monitor performance
- User feedback surveys

**Phase 4 (Week 4):** Grouping + Alignment
- Enable mixed groups
- Full rollout to 100% of users
- Monitor error rates

**Phase 5 (Week 5):** Deprecation
- Announce `useTextStore` deprecation
- Provide migration guide
- Remove dual-write in next release

### Feature Flags

```typescript
const FEATURE_FLAGS = {
  TEXT_AS_LAYERS_MIGRATION: true,       // Enable migration
  TEXT_LAYER_PANEL: true,                // Show text in layer panel
  TEXT_TRANSFORM_CONTROLS: true,         // Enable resize/rotate
  TEXT_GROUPING: true,                   // Enable mixed groups
  TEXT_SMART_ALIGNMENT: true,            // Include text in alignment
};
```

---

## Success Criteria

### Functional Requirements
- ✅ All 5 user stories pass acceptance criteria
- ✅ All unit tests pass (>80% coverage)
- ✅ All integration tests pass
- ✅ All E2E tests pass

### Performance Requirements
- ✅ Rendering 100 text elements: 60 FPS
- ✅ Group transform (10 elements): < 50ms
- ✅ Migration (500 items): < 1s
- ✅ No memory leaks detected

### User Acceptance
- ✅ >90% of users successfully migrate
- ✅ <5 bug reports per 1000 users
- ✅ >4/5 user satisfaction rating

---

## Next Steps

1. **Review this plan** with team
2. **Create tasks** in project management tool
3. **Set up feature branch:** `feature/016-text-as-layers`
4. **Begin Phase 1** implementation
5. **Daily standups** to track progress

---

## Appendix A: Edge Handle Scaling Formulas (C1 Clarification)

### Overview

Based on C1 clarification, text resize handles work as follows:
- **Corner handles (NW, NE, SW, SE):** Scale both fontSize AND text box dimensions proportionally
- **Edge handles (N, S, E, W):** Scale text box in one dimension only, fontSize adjusts to fit

### Mathematical Formulas

#### Corner Handle Scaling (Proportional)

**Formula:**
```typescript
// Calculate diagonal distance from center to drag position
const dragDiagonal = Math.sqrt(
  Math.pow(dragPosition.x - textBounds.center.x, 2) +
  Math.pow(dragPosition.y - textBounds.center.y, 2)
);

// Calculate original diagonal
const originalDiagonal = Math.sqrt(
  Math.pow(textBounds.width / 2, 2) +
  Math.pow(textBounds.height / 2, 2)
);

// Scale factor
const scaleFactor = dragDiagonal / originalDiagonal;

// Apply to fontSize
const newFontSize = Math.max(8, Math.min(200, originalFontSize * scaleFactor));
```

**Example:**
- Original fontSize: 24px
- Original diagonal: 50px
- Drag diagonal: 75px
- Scale factor: 75/50 = 1.5
- New fontSize: 24 * 1.5 = 36px ✅

#### North/South Edge Handle Scaling (Vertical)

**Formula:**
```typescript
// Calculate new height based on drag position
const newHeight = edge === 'N'
  ? textBounds.height + (textBounds.top - dragPosition.y)  // Dragging upward increases height
  : dragPosition.y - textBounds.top;                        // Dragging downward increases height

// Scale factor based on height change
const scaleFactor = newHeight / textBounds.height;

// Apply to fontSize (height dimension only)
const newFontSize = Math.max(8, Math.min(200, originalFontSize * scaleFactor));
```

**Example (North handle):**
- Original height: 30px
- Original fontSize: 20px
- Drag 15px upward (new height: 45px)
- Scale factor: 45/30 = 1.5
- New fontSize: 20 * 1.5 = 30px ✅

#### East/West Edge Handle Scaling (Horizontal)

**Formula:**
```typescript
// Calculate new width based on drag position
const newWidth = edge === 'E'
  ? dragPosition.x - textBounds.left                        // Dragging rightward increases width
  : textBounds.width + (textBounds.left - dragPosition.x); // Dragging leftward increases width

// Scale factor based on width change
const scaleFactor = newWidth / textBounds.width;

// Apply to fontSize (width dimension only)
const newFontSize = Math.max(8, Math.min(200, originalFontSize * scaleFactor));
```

**Example (East handle):**
- Original width: 100px
- Original fontSize: 16px
- Drag 50px to the right (new width: 150px)
- Scale factor: 150/100 = 1.5
- New fontSize: 16 * 1.5 = 24px ✅

### Constraints

All formulas enforce:
- **Minimum fontSize:** 8px
- **Maximum fontSize:** 200px
- **Clamping:** `Math.max(8, Math.min(200, calculatedFontSize))`

### Text Bounds Calculation

```typescript
interface TextBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  center: { x: number; y: number };
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function calculateTextBounds(element: TextElement): TextBounds {
  // Estimate based on fontSize and content length
  const estimatedWidth = element.fontSize * element.content.length * 0.6;
  const estimatedHeight = element.fontSize * element.lineHeight;

  const left = element.position.x - estimatedWidth / 2;
  const top = element.position.y - estimatedHeight / 2;

  return {
    left,
    top,
    width: estimatedWidth,
    height: estimatedHeight,
    center: {
      x: element.position.x,
      y: element.position.y,
    },
    minX: left,
    minY: top,
    maxX: left + estimatedWidth,
    maxY: top + estimatedHeight,
  };
}
```

### Visual Representation

```
      N (North handle - adjusts height)
      ↑
      │
W ←───┼───→ E   (West/East handles - adjust width)
      │
      ↓
      S (South handle - adjusts height)

NW ────── NE    (Corner handles - proportional scaling)
│   TEXT  │
SW ────── SE
```

### Implementation Reference

See `Task 4.1` in `tasks.md` for complete implementation code with all formulas applied.

---

**Plan Status:** Ready for Implementation
**Estimated Duration:** 4-5 weeks
**Assigned Team:** TBD
**Start Date:** TBD
