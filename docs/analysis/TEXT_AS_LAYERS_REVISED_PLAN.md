# Text-as-Layers: REVISED Implementation Plan

**Date:** January 25, 2025
**Version:** 2.0 (Simplified Architecture)
**Status:** Ready to Implement
**Goal:** Text objects appear as individual layers (like shapes), NOT nested in "Elements Section"

---

## 🎯 Architecture Decision: Simplified Model

### ❌ Original Spec (REJECTED by user)
```
Layer → Contains multiple elements (shapes + text)
  └─ Elements Section
      - Shape 1
      - Shape 2
      - Text 1
```

**Problem:** "Elements Section" feels disconnected, buried at bottom of layer row.

### ✅ Revised Model (USER REQUESTED)
```
Layer = Element (1:1 relationship)
  - Layer = Shape (current, keep working)
  - Layer = Text (new, to be added)
  - Groups organize both
```

**Benefits:**
- ✅ Simpler architecture (no nested elements section)
- ✅ Follows Photoshop pattern (flat layer list)
- ✅ Matches how shapes currently work
- ✅ Cleaner Layer Panel UI
- ✅ Less confusing for users

---

## 📊 Current vs Target Architecture

### Current (Shapes Only)

**Data Structure:**
```typescript
// Shape has its own layer
interface Shape {
  id: string;
  layerId: string;  // Points to Layer
  // ... shape properties
}

// Layer represents ONE shape
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  // ... layer properties
}

// 1:1 relationship
// Shape ←→ Layer
```

**Layer Panel Display:**
```
🟦 Rectangle (10m × 15m)
🟦 Circle (r: 5m)
🟦 Polyline (45.2 m²)
📁 Building Group
  🟦 Foundation
  🟦 Walls
```

---

### Target (Shapes + Text)

**Data Structure:**
```typescript
// KEEP: Shape has its own layer (no changes)
interface Shape {
  id: string;
  layerId: string;
  // ... shape properties
}

// ADD: Text also gets its own layer
interface TextObject {
  id: string;
  layerId: string;  // NEW: Add this field
  // ... text properties (already exist)
}

// Layer represents ONE element (shape OR text)
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  elementType: 'shape' | 'text';  // NEW: Distinguish type
  elementId: string;               // NEW: Reference to shape or text
  // ... layer properties
}

// 1:1 relationships
// Shape ←→ Layer
// Text  ←→ Layer
```

**Layer Panel Display:**
```
🟦 Rectangle (10m × 15m)     ← Shape layer
✏️ "Building A" Text         ← Text layer ⭐ NEW
🟦 Circle (r: 5m)            ← Shape layer
✏️ "Main Entrance" Text      ← Text layer ⭐ NEW
📁 Building Group            ← Group contains both
  🟦 Foundation
  ✏️ Foundation Label
  🟦 Walls
```

---

## 🚀 Implementation Strategy

### Key Insight: Keep It Simple!

**NO need for:**
- ❌ Element types (ShapeElement, TextElement) - already defined but won't use
- ❌ ElementRenderer - already exists but won't use
- ❌ Unified elements[] array - exists but won't populate
- ❌ Migration system - not needed for 1:1 model

**What we WILL do:**
- ✅ Add `layerId` field to TextObject (simple field addition)
- ✅ Auto-create layer when text is created (like shapes do)
- ✅ Show text layers in LayerPanel (read from useTextStore)
- ✅ Text layer controls (visibility, lock, delete)
- ✅ Group text with shapes (use existing grouping system)

---

## 📋 Phase-by-Phase Plan

### Phase 1: Add layerId to Text (2 hours)
**Risk:** LOW
**Files:** `types/text.ts`, `useTextStore.ts`, `DrawingCanvas.tsx`

**Changes:**

1. **Update TextObject interface** (`types/text.ts`)
```typescript
export interface TextObject {
  // ... existing fields
  layerId: string;  // NEW: Reference to layer (like shapes have)
  // ... rest of fields
}
```

2. **Auto-create layer when text is created** (`DrawingCanvas.tsx:~675`)
```typescript
// After creating text object
const newLayer: Layer = {
  id: `layer-${Date.now()}`,
  name: `Text: ${content.substring(0, 20)}...`,
  type: 'layer',
  visible: true,
  locked: false,
  color: '#3b82f6',  // Default blue
  opacity: 100,
  created: new Date(),
  modified: new Date()
};

// Add layer to store
useAppStore.getState().addLayer(newLayer);

// Create text with layerId
const newText: TextObject = {
  // ... existing fields
  layerId: newLayer.id,  // Link to layer
  // ... rest
};

useTextStore.getState().addText(newText);
```

3. **Update existing text objects** (migration in useTextStore)
```typescript
// In useTextStore initialization
const texts = get().texts.map(text => ({
  ...text,
  layerId: text.layerId || 'main'  // Default to main layer if missing
}));
```

**Testing:**
- ✅ Create new text → layer auto-created
- ✅ Text object has layerId field
- ✅ Layer appears in store

**Deliverable:** Text objects have layerId, layers auto-created

---

### Phase 2: Show Text Layers in Panel (4 hours)
**Risk:** MEDIUM
**Files:** `LayerPanel.tsx`

**Changes:**

1. **Read text layers from useTextStore**
```typescript
const texts = useTextStore(state => state.texts);

// Combine shape layers and text layers
const allLayers = useMemo(() => {
  const shapeLayers = layers.filter(layer =>
    shapes.some(shape => shape.layerId === layer.id)
  );

  const textLayers = layers.filter(layer =>
    texts.some(text => text.layerId === layer.id)
  );

  // Merge and sort by creation time
  return [...shapeLayers, ...textLayers].sort(
    (a, b) => a.created.getTime() - b.created.getTime()
  );
}, [layers, shapes, texts]);
```

2. **Display text icon for text layers**
```typescript
const getLayerIcon = (layerId: string) => {
  const isTextLayer = texts.some(text => text.layerId === layerId);

  if (isTextLayer) {
    return '✏️';  // Text icon
  }

  // Existing shape icon logic
  const shape = shapes.find(s => s.layerId === layerId);
  if (shape?.type === 'rectangle') return '🟦';
  if (shape?.type === 'circle') return '🔵';
  // ... etc
};
```

3. **Show text content as layer name**
```typescript
const getLayerName = (layerId: string) => {
  // Check if it's a text layer
  const text = texts.find(t => t.layerId === layerId);
  if (text) {
    return `"${text.content.substring(0, 30)}..."`;
  }

  // Existing shape name logic
  const layer = layers.find(l => l.id === layerId);
  return layer?.name || 'Unnamed';
};
```

**UI Changes:**
```
Before:
  🟦 Rectangle (10m × 15m)
  🟦 Circle (r: 5m)

After:
  🟦 Rectangle (10m × 15m)
  ✏️ "Building A label"        ← NEW: Text layer
  🟦 Circle (r: 5m)
  ✏️ "Main entrance sign"      ← NEW: Text layer
```

**Testing:**
- ✅ Text layers appear in Layer Panel
- ✅ Text icon (✏️) shows correctly
- ✅ Text content shows as layer name
- ✅ Layers sorted by creation time
- ✅ No duplicate layers

**Deliverable:** Text layers visible in Layer Panel

---

### Phase 3: Text Layer Controls (4 hours)
**Risk:** MEDIUM
**Files:** `LayerPanel.tsx`, `useTextStore.ts`, `TextRenderer.tsx`

**Changes:**

1. **Visibility Toggle**
```typescript
const handleVisibilityToggle = (layerId: string) => {
  const text = texts.find(t => t.layerId === layerId);

  if (text) {
    // Toggle text visibility
    useTextStore.getState().updateText(text.id, {
      visible: !text.visible
    });

    // Also toggle layer visibility (keep in sync)
    toggleLayerVisibility(layerId);
  } else {
    // Existing shape visibility logic
    toggleLayerVisibility(layerId);
  }
};
```

2. **Lock Toggle**
```typescript
const handleLockToggle = (layerId: string) => {
  const text = texts.find(t => t.layerId === layerId);

  if (text) {
    // Toggle text lock
    useTextStore.getState().updateText(text.id, {
      locked: !text.locked
    });
  }

  // Toggle layer lock
  toggleLayerLock(layerId);
};
```

3. **Delete Text Layer**
```typescript
const handleDeleteLayer = (layerId: string) => {
  const text = texts.find(t => t.layerId === layerId);

  if (text) {
    // Delete text
    useTextStore.getState().deleteText(text.id);

    // Delete layer
    deleteLayer(layerId);
  } else {
    // Existing shape delete logic
    // ...
  }
};
```

4. **Select Text on Layer Click**
```typescript
const handleLayerClick = (layerId: string) => {
  const text = texts.find(t => t.layerId === layerId);

  if (text) {
    // Select text
    useTextStore.getState().selectText(text.id);

    // Highlight in scene (handled by TextRenderer)
  } else {
    // Existing shape selection logic
    selectShape(layerId);
  }
};
```

**Testing:**
- ✅ Click eye icon → text disappears/appears
- ✅ Click lock icon → text can't be edited/moved
- ✅ Click delete → text and layer removed
- ✅ Click layer → text selected in scene
- ✅ All controls work like shapes

**Deliverable:** Full text layer controls working

---

### Phase 4: Text in Groups (4 hours)
**Risk:** MEDIUM-HIGH
**Files:** `useAppStore.ts`, `LayerPanel.tsx`, `GroupBoundary.tsx`

**Changes:**

1. **Add groupId to TextObject** (`types/text.ts`)
```typescript
export interface TextObject {
  // ... existing fields
  layerId: string;
  groupId?: string;  // NEW: Group membership (like shapes)
  // ... rest
}
```

2. **Include text in grouping operations** (`useAppStore.ts`)
```typescript
groupSelectedElements: () => {
  const selectedShapes = get().shapes.filter(/* ... */);
  const selectedTexts = useTextStore.getState().texts.filter(
    text => useTextStore.getState().selectedTextId === text.id
  );

  if (selectedShapes.length + selectedTexts.length < 2) {
    // Need at least 2 elements to group
    return;
  }

  const groupId = `group-${Date.now()}`;

  // Assign groupId to shapes
  selectedShapes.forEach(shape => {
    get().updateShape(shape.id, { groupId });
  });

  // Assign groupId to text
  selectedTexts.forEach(text => {
    useTextStore.getState().updateText(text.id, { groupId });
  });
},
```

3. **Calculate group bounds including text** (`GroupBoundary.tsx`)
```typescript
function calculateGroupBounds(groupId: string): BoundingBox {
  const shapes = useAppStore.getState().shapes.filter(s => s.groupId === groupId);
  const texts = useTextStore.getState().texts.filter(t => t.groupId === groupId);

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  // Process shapes (existing logic)
  shapes.forEach(shape => {
    shape.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  // Process text (NEW)
  texts.forEach(text => {
    const textBounds = estimateTextBounds(text);
    minX = Math.min(minX, textBounds.minX);
    minY = Math.min(minY, textBounds.minY);
    maxX = Math.max(maxX, textBounds.maxX);
    maxY = Math.max(maxY, textBounds.maxY);
  });

  return { minX, minY, maxX, maxY };
}

function estimateTextBounds(text: TextObject): BoundingBox {
  const estimatedWidth = text.fontSize * text.content.length * 0.6;
  const estimatedHeight = text.fontSize * text.lineHeight;

  return {
    minX: text.position.x - estimatedWidth / 2,
    minY: text.position.y - estimatedHeight / 2,
    maxX: text.position.x + estimatedWidth / 2,
    maxY: text.position.y + estimatedHeight / 2
  };
}
```

4. **Show grouped text in Layer Panel**
```typescript
// In LayerPanel, render grouped elements
{group.members.map(layerId => {
  const text = texts.find(t => t.layerId === layerId);
  const isTextLayer = !!text;

  return (
    <div key={layerId} style={{ paddingLeft: '20px' }}>
      {isTextLayer ? '✏️' : '🟦'} {getLayerName(layerId)}
    </div>
  );
})}
```

**Testing:**
- ✅ Select 1 shape + 1 text → Group button works
- ✅ Group appears in Layer Panel
- ✅ Purple group boundary includes text
- ✅ Move group → text moves with shapes
- ✅ Ungroup → text becomes independent

**Deliverable:** Mixed groups (shapes + text) working

---

### Phase 5: Text Transform Controls (8 hours)
**Risk:** HIGH
**Files:** `TextResizeControls.tsx`, `TextRotationControls.tsx`, `DrawingCanvas.tsx`

**Changes:**

1. **Enable drag-to-move for text**
```typescript
// In DrawingCanvas.tsx or TextRenderer.tsx
const handleTextPointerDown = (textId: string, event: any) => {
  if (activeTool !== 'select') return;

  const text = useTextStore.getState().texts.find(t => t.id === textId);
  if (!text || text.locked) return;

  // Start dragging
  setDraggingTextId(textId);
  setDragStartPosition(text.position);
};

const handleTextPointerMove = (event: any) => {
  if (!draggingTextId) return;

  const worldPosition = getWorldPosition(event);
  if (!worldPosition) return;

  // Update text position
  useTextStore.getState().updateText(draggingTextId, {
    position: worldPosition
  });
};
```

2. **Add resize controls for selected text** (Use existing `TextResizeControls.tsx`)
```typescript
// In SceneManager or TextRenderer
{selectedTextId && (
  <TextResizeControls
    textId={selectedTextId}
    onResize={(textId, newFontSize) => {
      useTextStore.getState().updateText(textId, {
        fontSize: newFontSize
      });
    }}
  />
)}
```

3. **Add rotation controls for selected text** (Use existing `TextRotationControls.tsx`)
```typescript
{selectedTextId && (
  <TextRotationControls
    textId={selectedTextId}
    onRotate={(textId, newRotation) => {
      useTextStore.getState().updateText(textId, {
        rotation: newRotation
      });
    }}
  />
)}
```

**Note:** `TextResizeControls.tsx` and `TextRotationControls.tsx` already exist in the codebase! We just need to integrate them.

**Testing:**
- ✅ Click-drag text → moves position
- ✅ Select text → resize handles appear
- ✅ Drag corner handle → font size scales
- ✅ Select text → rotation handle appears
- ✅ Drag rotation handle → text rotates
- ✅ Shift+Drag → 45° snap

**Deliverable:** Full text transform controls

---

### Phase 6: Smart Alignment with Text (4 hours)
**Risk:** MEDIUM
**Files:** `services/simpleAlignment.ts`, `SimpleAlignmentGuides.tsx`

**Changes:**

1. **Include text in alignment calculations**
```typescript
// In simpleAlignment.ts
export function detectEqualSpacing(
  shapes: Shape[],
  texts: TextObject[]  // NEW parameter
): SpacingMeasurement[] {

  // Create unified array of bounding boxes
  const allBounds = [
    ...shapes.map(s => ({
      id: s.id,
      type: 'shape' as const,
      bounds: calculateBoundingBox(s.points),
      center: getShapeCenter(s)
    })),
    ...texts.map(t => ({
      id: t.id,
      type: 'text' as const,
      bounds: estimateTextBounds(t),
      center: t.position
    }))
  ];

  // Sort by x position
  allBounds.sort((a, b) => a.center.x - b.center.x);

  // Calculate spacing between consecutive items
  // ... existing spacing logic
}
```

2. **Add text snap points**
```typescript
export function getTextSnapPoints(text: TextObject): Point2D[] {
  const bounds = estimateTextBounds(text);

  return [
    { x: bounds.minX, y: bounds.minY },  // Top-left
    { x: bounds.maxX, y: bounds.minY },  // Top-right
    { x: bounds.minX, y: bounds.maxY },  // Bottom-left
    { x: bounds.maxX, y: bounds.maxY },  // Bottom-right
    { x: text.position.x, y: text.position.y }  // Center
  ];
}
```

3. **Show purple spacing badges for text**
```typescript
// In SimpleAlignmentGuides.tsx
const texts = useTextStore(state => state.texts);
const allElements = [...shapes, ...texts];

const spacings = detectEqualSpacing(shapes, texts);
```

**Testing:**
- ✅ Select 2 shapes + 1 text → spacing detected
- ✅ Purple badges show distances
- ✅ Drag text near shape → green snap indicators
- ✅ "SNAP" confirmation when aligned

**Deliverable:** Smart alignment includes text

---

## ⏱️ Implementation Timeline

### Week 1: Foundation
**Total:** 10 hours (2-3 days)
- Phase 1: Add layerId to Text (2 hours)
- Phase 2: Show Text Layers (4 hours)
- Phase 3: Text Layer Controls (4 hours)

**Deliverable:** Text appears as individual layers in Layer Panel with full controls

---

### Week 2: Advanced Features
**Total:** 16 hours (3-4 days)
- Phase 4: Text in Groups (4 hours)
- Phase 5: Text Transform Controls (8 hours)
- Phase 6: Smart Alignment (4 hours)

**Deliverable:** Mixed groups, text transforms, alignment all working

---

### Week 3: Testing & Polish
**Total:** 8 hours (2 days)
- Comprehensive testing (4 hours)
- Bug fixes (2 hours)
- Documentation (2 hours)

**Deliverable:** Production-ready feature

---

## 🎯 Success Criteria

### Must Have (P0)
- ✅ Text objects appear as individual layers in Layer Panel
- ✅ Text layers have icon (✏️) and show content as name
- ✅ Text layer controls work (visibility, lock, delete, select)
- ✅ No "Elements Section" within layers (flat structure)
- ✅ All existing text functionality preserved
- ✅ All existing shape functionality preserved

### Should Have (P1)
- ✅ Text can be grouped with shapes
- ✅ Text can be dragged to move
- ✅ Text has resize handles (8 handles)
- ✅ Text has rotation handle
- ✅ Smart alignment includes text

### Nice to Have (P2)
- ⚠️ Text layer thumbnails (preview of text)
- ⚠️ Batch operations on text layers
- ⚠️ Text layer ordering in groups

---

## 🚫 What We're NOT Doing

### Removed from Original Spec (Too Complex)
- ❌ Unified Element system (ShapeElement, TextElement types)
- ❌ ElementRenderer component (already exists but won't use)
- ❌ elements[] array (exists but won't populate)
- ❌ Migration system (not needed for 1:1 model)
- ❌ Dual-write pattern (not needed, simple field addition)
- ❌ Feature flags (changes are additive, low risk)

**Rationale:** The 1:1 model (Layer = Element) is much simpler. We're just extending the existing pattern (Shape ← → Layer) to include text (Text ← → Layer).

---

## 🔍 Key Implementation Differences

### Original Spec vs Revised Plan

| Aspect | Original Spec 016 | Revised Plan (This Doc) |
|--------|------------------|-------------------------|
| **Architecture** | Layer → contains multiple elements | Layer = One element (1:1) |
| **Element Types** | ShapeElement, TextElement interfaces | Keep existing Shape, TextObject |
| **Unified Array** | elements[] array in useAppStore | NO unified array |
| **Migration** | Complex migration system | Simple field addition (layerId) |
| **Renderer** | ElementRenderer component | Keep separate ShapeRenderer, TextRenderer |
| **Complexity** | HIGH (new type system) | LOW (extend existing) |
| **Risk** | MEDIUM-HIGH | LOW-MEDIUM |
| **Timeline** | 5 weeks | 3 weeks |
| **Lines of Code** | ~2000 new | ~500 new |

---

## 📝 Code Changes Summary

### Files to Create
- None! (All components already exist)

### Files to Modify

1. **`app/src/types/text.ts`** (5 lines)
   - Add `layerId: string` to TextObject
   - Add `groupId?: string` to TextObject

2. **`app/src/store/useTextStore.ts`** (20 lines)
   - Default layerId to 'main' for existing texts
   - Update addText to require layerId

3. **`app/src/components/Scene/DrawingCanvas.tsx`** (30 lines)
   - Auto-create layer when text is created
   - Link text to layer

4. **`app/src/components/LayerPanel.tsx`** (150 lines)
   - Read texts from useTextStore
   - Combine shape layers and text layers
   - Display text icon (✏️)
   - Show text content as layer name
   - Text layer controls (visibility, lock, delete, select)
   - Show text in groups

5. **`app/src/store/useAppStore.ts`** (50 lines)
   - Include text in grouping operations
   - Update group transform to move text

6. **`app/src/components/Scene/GroupBoundary.tsx`** (40 lines)
   - Include text bounds in group boundary calculation

7. **`app/src/components/Scene/TextRenderer.tsx`** (100 lines)
   - Enable drag-to-move
   - Integrate TextResizeControls
   - Integrate TextRotationControls

8. **`app/src/services/simpleAlignment.ts`** (80 lines)
   - Include text in alignment calculations
   - Add text snap points

**Total Lines Modified:** ~475 lines
**Total New Logic:** ~300 lines (rest is integration)

---

## 🛡️ Risk Mitigation

### Risk 1: Breaking Existing Text Functionality
**Likelihood:** LOW
**Mitigation:**
- All changes are additive (adding layerId field)
- Existing text rendering unchanged
- Default layerId to 'main' for existing texts
- Comprehensive testing before each phase

### Risk 2: Layer Panel Performance
**Likelihood:** LOW
**Mitigation:**
- Use React.useMemo for layer filtering
- Only render visible layers
- Debounce layer reordering

### Risk 3: Group Boundary Calculation
**Likelihood:** MEDIUM
**Mitigation:**
- Use conservative text bounds estimation
- Test with various font sizes
- Handle edge cases (empty text, very long text)

---

## ✅ Testing Checklist

### Phase 1: Text Layers Appear
- [ ] Create new text → layer auto-created
- [ ] Text layer has correct icon (✏️)
- [ ] Text content shows as layer name
- [ ] Text layer in correct position (sorted by creation time)

### Phase 2: Text Layer Controls
- [ ] Click eye icon → text visibility toggles
- [ ] Click lock icon → text lock toggles
- [ ] Click delete → text and layer removed
- [ ] Click layer → text selected in scene

### Phase 3: Text in Groups
- [ ] Select 1 shape + 1 text → Group button enabled
- [ ] Click Group → purple boundary includes text
- [ ] Move group → text moves with shapes
- [ ] Rotate group → text rotates with shapes
- [ ] Ungroup → text becomes independent

### Phase 4: Text Transforms
- [ ] Click-drag text → moves position
- [ ] Select text → resize handles appear (8 handles)
- [ ] Drag corner → font size scales proportionally
- [ ] Select text → rotation handle appears
- [ ] Drag rotation → text rotates
- [ ] Shift+Drag → 45° snap works

### Phase 5: Smart Alignment
- [ ] Select 2 shapes + 1 text → spacing detected
- [ ] Purple badges show correct distances
- [ ] Drag text near shape → green snap indicators
- [ ] "SNAP" confirmation appears

### Phase 6: Edge Cases
- [ ] Empty text → layer name shows "(Empty)"
- [ ] Very long text → layer name truncated
- [ ] Delete text → layer also deleted
- [ ] Locked text → can't move/resize/rotate
- [ ] Hidden text → doesn't show in scene

---

## 🎉 Deliverables

### Week 1 End
- ✅ Text appears as individual layers
- ✅ Text layer controls working
- ✅ Layer Panel shows mixed shapes and text

### Week 2 End
- ✅ Mixed groups (shapes + text)
- ✅ Text transform controls
- ✅ Smart alignment with text

### Week 3 End
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Production-ready feature

---

## 📖 Next Steps

### Immediate (Today)
1. ✅ Review this revised plan
2. ✅ Confirm simplified architecture is what you want
3. ✅ Answer: Ready to start Phase 1?

### Short-Term (This Week)
4. Implement Phase 1 (Add layerId to text) - 2 hours
5. Implement Phase 2 (Show text layers) - 4 hours
6. Implement Phase 3 (Text layer controls) - 4 hours
7. Test Week 1 deliverables - 2 hours

### Medium-Term (Next Week)
8. Implement Phase 4 (Text in groups) - 4 hours
9. Implement Phase 5 (Text transforms) - 8 hours
10. Implement Phase 6 (Smart alignment) - 4 hours
11. Test Week 2 deliverables - 2 hours

### Long-Term (Week 3)
12. Comprehensive testing - 4 hours
13. Bug fixes - 2 hours
14. Documentation - 2 hours
15. Production deployment

---

## ❓ Confirmation Questions

1. **Does this simplified architecture match what you want?**
   - Layer = Shape (1:1) ✅ Keep as is
   - Layer = Text (1:1) ✅ Add this
   - No "Elements Section" ✅ Confirmed

2. **Are you comfortable with this timeline?**
   - Week 1: Basic text layers
   - Week 2: Advanced features (groups, transforms)
   - Week 3: Testing and polish

3. **Any specific concerns or requirements?**
   - Layer naming for text?
   - Text layer icon (✏️ or something else)?
   - Order of layers in panel (shapes first? text first? mixed by time)?

---

**Document Version:** 2.0 (Revised - Simplified Architecture)
**Last Updated:** January 25, 2025
**Status:** ✅ Ready for Implementation
**Estimated Effort:** 3 weeks (26 hours coding + 8 hours testing)
**Risk Level:** LOW-MEDIUM (additive changes, well-defined scope)
