# Text-as-Layers: Current State Analysis & Backup

**Date:** January 25, 2025
**Status:** Partial Implementation (Types defined, ElementRenderer exists, but not fully integrated)
**Goal:** Re-implement Text-as-Layers WITHOUT breaking shapes or text functionality

---

## Executive Summary

The Text-as-Layers feature (Spec 016) was **partially implemented** then **partially rolled back** due to issues with shapes functionality. Here's what exists vs what needs to be completed.

### Current State: ✅ What's Working

1. **Text Feature** - WORKING PERFECTLY
   - Canva-style inline editing
   - Properties Panel integration
   - Multi-line text with Shift+Enter
   - All formatting controls (font, size, color, alignment, etc.)
   - Auto-switch to Select tool after text creation
   - Stored in `useTextStore`

2. **Shapes Feature** - WORKING PERFECTLY
   - All drawing tools (rectangle, circle, polyline, line)
   - Transform operations (move, resize, rotate)
   - Multi-selection and grouping
   - Layer management
   - Stored in `useAppStore.shapes[]`

### Current State: ⚠️ Partially Implemented

1. **Element Types** - ✅ DEFINED (lines 38-117 in `types/index.ts`)
   ```typescript
   export type ElementType = 'shape' | 'text';
   export interface BaseElement { ... }
   export interface ShapeElement extends BaseElement { ... }
   export interface TextElement extends BaseElement { ... }
   export type Element = ShapeElement | TextElement;
   export function isShapeElement(element: Element): element is ShapeElement { ... }
   export function isTextElement(element: Element): element is TextElement { ... }
   ```

2. **Elements Array** - ✅ EXISTS in `useAppStore.ts`
   - Line 513: `elements: []` (initialized but NOT being used)
   - Shapes still using legacy `shapes[]` array
   - Text still using separate `useTextStore`

3. **ElementRenderer Component** - ✅ EXISTS
   - File: `app/src/components/Scene/ElementRenderer.tsx`
   - Reads from `state.elements` array
   - Has ShapeElementRenderer and TextElementRenderer sub-components
   - Handles unified element rendering with drag/click/context menu
   - **BUT**: Not currently being used in SceneManager

4. **Sub-Renderers** - ✅ EXIST
   - `ShapeElementRenderer.tsx` - Renders ShapeElement objects
   - `TextElementRenderer.tsx` - Renders TextElement objects
   - Both handle visibility, selection, transforms

### Current State: ❌ NOT Implemented

1. **Migration System** - NOT IMPLEMENTED
   - No migration from `shapes[]` → `elements[]`
   - No migration from `useTextStore.texts[]` → `elements[]`
   - Migration utilities NOT created yet

2. **Store Integration** - NOT IMPLEMENTED
   - `elements[]` array exists but is empty
   - No actions to add/update/delete elements
   - No sync between legacy arrays and elements array

3. **SceneManager Integration** - NOT IMPLEMENTED
   - Still using separate ShapeRenderer and TextRenderer
   - ElementRenderer not imported/used in SceneManager

---

## Why Was It Rolled Back?

Based on the documentation:

1. **TEXT_LAYER_BUG_FIX.md** - Text wasn't appearing due to invalid layer ID
   - Text created with `layerId: 'default-layer'` (doesn't exist)
   - TextRenderer filtered out text when layer wasn't found
   - Fixed by hardcoding `layerId: 'main'` in DrawingCanvas.tsx:676

2. **LAYER_SYSTEM_ANALYSIS.md** - Layer system architectural issues
   - Auto-creating one layer per shape causes clutter
   - No layer groups/folders for organization
   - No multi-layer selection
   - Element structure felt disconnected from layers

**Root Cause:** The unified Element system was implemented, but the **layer integration** and **migration strategy** caused issues with shapes. Instead of fixing the integration, parts of the feature were rolled back to restore functionality.

---

## Current Architecture Map

### File Structure

```
app/src/
├── types/
│   └── index.ts                 ✅ Element types defined (lines 38-117)
│
├── store/
│   ├── useAppStore.ts           ⚠️ elements[] exists but empty (line 513)
│   └── useTextStore.ts          ✅ Working perfectly (text management)
│
├── components/Scene/
│   ├── ElementRenderer.tsx      ✅ Exists but NOT used in SceneManager
│   ├── ShapeElementRenderer.tsx ✅ Exists, ready to use
│   ├── TextElementRenderer.tsx  ✅ Exists, ready to use
│   ├── ShapeRenderer.tsx        ✅ Currently used (renders shapes[])
│   └── TextRenderer.tsx         ✅ Currently used (renders texts[])
│
└── utils/
    └── elementMigration.ts      ❌ NOT CREATED (need to create)
```

### Data Flow (Current)

```
┌─────────────────────────────────────────────┐
│           useAppStore                       │
│                                             │
│  shapes: Shape[]          ✅ USED           │
│  elements: Element[]      ❌ NOT USED       │
│                                             │
└─────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│          SceneManager                       │
│                                             │
│  <ShapeRenderer />        ✅ RENDERS        │
│  <ElementRenderer />      ❌ NOT RENDERED   │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          useTextStore                       │
│                                             │
│  texts: TextObject[]      ✅ USED           │
│                                             │
└─────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│          TextRenderer                       │
│                                             │
│  Renders text objects     ✅ WORKING        │
│                                             │
└─────────────────────────────────────────────┘
```

### Data Flow (Target - After Re-Implementation)

```
┌─────────────────────────────────────────────┐
│           useAppStore                       │
│                                             │
│  elements: Element[]      ✅ PRIMARY        │
│    ├─ ShapeElement[]                        │
│    └─ TextElement[]                         │
│                                             │
│  shapes: Shape[]          ⚠️ LEGACY (sync)  │
│                                             │
└─────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│          SceneManager                       │
│                                             │
│  <ElementRenderer />      ✅ RENDERS ALL    │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          useTextStore                       │
│                                             │
│  texts: TextObject[]      ⚠️ LEGACY (sync)  │
│                                             │
└─────────────────────────────────────────────┘
                  ↓
                (synced to elements array)
```

---

## What Needs to Be Done

### Phase 1: Migration Utilities (Safe Foundation)
**Risk:** LOW
**Impact:** None (just utility functions)

1. Create `app/src/utils/elementMigration.ts`
   - `shapeToElement(shape: Shape): ShapeElement`
   - `textToElement(text: TextObject): TextElement`
   - `elementToShape(element: ShapeElement): Shape`
   - `elementToText(element: TextElement): TextObject`
   - `migrateToElements(shapes, texts): Element[]`
   - Backup/restore functions

2. Write comprehensive unit tests
   - Test bidirectional conversion (no data loss)
   - Test edge cases (empty arrays, missing fields)
   - Test round-trip conversion

**Deliverable:** Migration utilities with 100% test coverage

---

### Phase 2: Store Integration (Dual-Write Pattern)
**Risk:** MEDIUM
**Impact:** None if done correctly (dual-write maintains backward compatibility)

1. Add element actions to `useAppStore.ts`
   - `addElement(element)` → also writes to shapes[] or useTextStore
   - `updateElement(id, updates)` → also updates shapes[] or useTextStore
   - `deleteElement(id)` → also deletes from shapes[] or useTextStore
   - `selectElement(id)` → syncs selection state
   - Getter functions (getElementById, getSelectedElements, etc.)

2. Add migration function
   - `runMigration()` - one-time migration on app load
   - Converts existing shapes[] and texts[] to elements[]
   - Stores backup in localStorage
   - Sets migration flag

**Deliverable:** Store with dual-write pattern (writes to BOTH old and new)

---

### Phase 3: SceneManager Integration (Feature Toggle)
**Risk:** MEDIUM
**Impact:** Controlled via feature flag

1. Add feature flag
   ```typescript
   const USE_UNIFIED_ELEMENTS = false; // Start disabled
   ```

2. Update SceneManager.tsx
   ```typescript
   {USE_UNIFIED_ELEMENTS ? (
     <ElementRenderer />
   ) : (
     <>
       <ShapeRenderer />
       <TextRenderer />
     </>
   )}
   ```

3. Test with flag enabled (local testing only)
   - Verify shapes render correctly
   - Verify text renders correctly
   - Verify all interactions work
   - Compare performance

**Deliverable:** Working ElementRenderer behind feature flag

---

### Phase 4: Layer Panel Integration
**Risk:** HIGH
**Impact:** Visible UI changes

1. Update LayerPanel to show elements
   - Read from elements[] instead of shapes[]
   - Show ShapeElement and TextElement mixed by layer
   - Use element icons (shape icons + text icon)
   - Support element selection/visibility/locking

2. Handle element operations
   - Click to select element
   - Visibility toggle for elements
   - Lock toggle for elements
   - Delete elements
   - Reorder elements

**Deliverable:** Layer Panel showing unified elements

---

### Phase 5: Transform Operations
**Risk:** HIGH
**Impact:** Core functionality

1. Extend drag system for TextElement
   - Text can be dragged to move position
   - Updates TextElement.position
   - Syncs back to useTextStore

2. Add resize controls for TextElement
   - 8 handles like shapes
   - Corner handles: Scale fontSize proportionally
   - Edge handles: Scale fontSize in one dimension
   - Min fontSize: 8px, Max fontSize: 200px

3. Add rotation controls for TextElement
   - Same rotation handle as shapes
   - Updates TextElement.rotation
   - Visual rotation feedback

**Deliverable:** Full transform capabilities for text

---

### Phase 6: Grouping & Alignment
**Risk:** HIGH
**Impact:** Advanced features

1. Mixed groups (shapes + text)
   - Assign groupId to both ShapeElement and TextElement
   - Group boundary calculation includes text
   - Group transform affects all elements

2. Smart alignment with text
   - Text bounding box in spacing calculations
   - Snap to text edges/center
   - Purple badges show spacing

**Deliverable:** Mixed groups and alignment working

---

## Risk Mitigation Strategy

### Strategy 1: Feature Flags
**Use feature flags at every integration point**

```typescript
const FEATURE_FLAGS = {
  MIGRATE_TO_ELEMENTS: false,        // Enable migration
  USE_ELEMENT_RENDERER: false,       // Use ElementRenderer
  ELEMENT_LAYER_PANEL: false,        // Show elements in LayerPanel
  TEXT_TRANSFORM_CONTROLS: false,    // Enable text resize/rotate
  MIXED_GROUPS: false,               // Enable shape+text groups
};
```

Start with all flags OFF. Enable one at a time, test thoroughly, then move to next.

---

### Strategy 2: Dual-Write Pattern
**Write to BOTH old and new systems**

Every operation writes to:
1. elements[] array (new system)
2. shapes[] array OR useTextStore (old system)

This ensures:
- ✅ Backward compatibility maintained
- ✅ Can switch between renderers seamlessly
- ✅ Easy rollback if issues found
- ✅ Gradual migration, no big-bang switchover

---

### Strategy 3: Backup System
**Automatic backups before migration**

```typescript
runMigration: () => {
  // 1. Backup current state
  backupBeforeMigration(shapes, texts);

  // 2. Migrate
  try {
    const elements = migrateToElements(shapes, texts);
    set({ elements });
    setMigrated();
  } catch (error) {
    // 3. Rollback on error
    const backup = restoreFromBackup();
    if (backup) {
      set({ shapes: backup.shapes });
      useTextStore.setState({ texts: backup.texts });
    }
    showError('Migration failed. Data restored.');
  }
}
```

---

### Strategy 4: Comprehensive Testing
**Test at every phase**

1. **Unit Tests**
   - Migration utilities (bidirectional conversion)
   - Store actions (element CRUD)
   - Type guards (isShapeElement, isTextElement)

2. **Integration Tests**
   - Create/update/delete elements
   - Sync between old and new systems
   - Transform operations
   - Grouping operations

3. **E2E Tests**
   - User creates text → appears in layer panel
   - User drags text → position updates
   - User resizes text → font size scales
   - User groups shape+text → unified boundary

---

## Implementation Timeline

### Week 1: Foundation (Safe, No UI Changes)
- ✅ Create migration utilities
- ✅ Write unit tests
- ✅ Add store actions (dual-write)
- ✅ Add migration function
- **Deliverable:** Migration system ready, nothing visible to user

### Week 2: Rendering (Behind Feature Flag)
- ✅ Integrate ElementRenderer in SceneManager (flag OFF)
- ✅ Test with flag ON locally
- ✅ Verify all shapes render correctly
- ✅ Verify all text renders correctly
- **Deliverable:** ElementRenderer working locally, not deployed

### Week 3: Layer Panel (Visible Changes)
- ✅ Update LayerPanel to show elements
- ✅ Element selection/visibility/locking
- ✅ Test with real data
- ✅ Enable feature flag in dev environment
- **Deliverable:** Layer Panel showing elements (dev only)

### Week 4: Transforms (Complex Operations)
- ✅ Text drag system
- ✅ Text resize controls
- ✅ Text rotation controls
- ✅ Test all transform operations
- **Deliverable:** Full text transform capabilities

### Week 5: Grouping (Final Integration)
- ✅ Mixed group support
- ✅ Smart alignment with text
- ✅ Full production testing
- ✅ Enable all feature flags
- **Deliverable:** Complete Text-as-Layers feature

---

## Rollback Plan

### If Migration Fails

1. **Detect Failure:**
   - Migration throws error
   - Elements array is empty or corrupted
   - User reports missing data

2. **Automatic Rollback:**
   ```typescript
   const backup = localStorage.getItem('land-viz:pre-migration-backup');
   if (backup) {
     const { shapes, texts } = JSON.parse(backup);
     set({ shapes });
     useTextStore.setState({ texts });
     localStorage.removeItem('land-viz:elements-migrated');
   }
   ```

3. **User Notification:**
   - Toast message: "Migration failed. Your data has been restored."
   - Provide support link
   - Log error for debugging

### If ElementRenderer Breaks

1. **Disable Feature Flag:**
   ```typescript
   USE_ELEMENT_RENDERER = false;
   ```

2. **Falls Back to Old Renderers:**
   - ShapeRenderer renders shapes[]
   - TextRenderer renders texts[]
   - All functionality preserved

---

## Success Criteria

### Must Have (P0)
- ✅ All existing shape functionality works (move, resize, rotate, group)
- ✅ All existing text functionality works (create, edit, format, inline editing)
- ✅ Migration completes without data loss
- ✅ Layer Panel shows both shapes and text
- ✅ No performance degradation

### Should Have (P1)
- ✅ Text can be moved by dragging
- ✅ Text can be resized (8 handles)
- ✅ Text can be rotated (rotation handle)
- ✅ Mixed groups (shapes + text together)
- ✅ Smart alignment includes text

### Nice to Have (P2)
- ⚠️ Layer thumbnails
- ⚠️ Layer groups/folders
- ⚠️ Multi-layer selection

---

## Open Questions

### Q1: Should we keep dual-write forever or deprecate old system?
**Options:**
- A) Keep dual-write indefinitely (safest, but adds complexity)
- B) Deprecate after 2 releases (planned approach per spec)
- C) Remove old system immediately after migration (risky)

**Recommendation:** Option B - Deprecate after 2 stable releases

### Q2: How to handle migration on app load?
**Options:**
- A) Automatic silent migration on first load
- B) Show migration prompt asking user confirmation
- C) Run migration in background with progress bar

**Recommendation:** Option A - Silent migration with backup (fast, non-intrusive)

### Q3: Should ElementRenderer replace old renderers immediately?
**Options:**
- A) Replace immediately after migration
- B) Keep both, use feature flag to switch
- C) Gradual rollout (20% → 50% → 100%)

**Recommendation:** Option B - Feature flag for controlled testing

---

## Next Steps

### Immediate Actions (Today)

1. **Review this document with team**
   - Confirm approach is sound
   - Agree on risk mitigation strategy
   - Set timeline expectations

2. **Answer open questions**
   - Decide on deprecation timeline
   - Decide on migration UX
   - Decide on rollout strategy

### Short-Term (This Week)

3. **Create task branch**
   ```bash
   git checkout -b feature/016-text-as-layers-v2
   ```

4. **Implement Phase 1 (Migration Utilities)**
   - Create elementMigration.ts
   - Write unit tests
   - PR review and merge

### Medium-Term (Next 2-4 Weeks)

5. **Implement Phases 2-3**
   - Store integration (dual-write)
   - SceneManager integration (feature flag)
   - Test extensively

6. **Deploy to staging**
   - Enable feature flags in staging environment
   - Collect feedback
   - Fix any issues

### Long-Term (1-2 Months)

7. **Implement Phases 4-6**
   - Layer Panel integration
   - Transform operations
   - Grouping & alignment

8. **Production rollout**
   - Gradual rollout with feature flags
   - Monitor error rates
   - User feedback surveys

---

## Conclusion

The Text-as-Layers feature is **80% implemented** but **0% integrated**. The foundation (types, ElementRenderer, sub-renderers) exists and is ready to use. What's missing is:

1. **Migration system** to populate elements[]
2. **Store integration** to use elements[] instead of shapes[]
3. **SceneManager switch** to use ElementRenderer
4. **Layer Panel updates** to show elements
5. **Transform controls** for text

With the **dual-write pattern** and **feature flags**, we can implement this safely without breaking existing functionality. Each phase can be tested independently before moving to the next.

**Estimated Timeline:** 4-5 weeks with proper testing
**Risk Level:** Medium (mitigated by feature flags and dual-write)
**Reward:** Professional text integration, mixed groups, unified layer management

**Ready to proceed?** 🚀

---

**Document Version:** 1.0
**Last Updated:** January 25, 2025
**Status:** ✅ Complete - Ready for Review
