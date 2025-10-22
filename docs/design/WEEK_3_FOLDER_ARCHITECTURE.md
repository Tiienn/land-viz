# Week 3: Layer Groups/Folders Architecture

## Overview

Week 3 adds nested folder support to the layer system, enabling professional layer organization matching industry standards (Photoshop, Figma, etc.).

---

## Design Goals

1. **Hierarchical Structure**: Support unlimited nesting depth for folders
2. **Backward Compatibility**: Existing layers work without migration
3. **Intuitive UX**: Collapse/expand, drag-and-drop, visual hierarchy
4. **Multi-Selection Support**: Bulk operations work with folders
5. **Performance**: Efficient rendering with thousands of layers

---

## Data Model

### Updated Layer Type

```typescript
export interface Layer {
  id: string;
  name: string;
  type: 'layer' | 'folder';  // NEW: Distinguish layers from folders
  visible: boolean;
  locked: boolean;
  color: string;
  opacity: number;
  created: Date;
  modified: Date;

  // Phase 1: Layer thumbnails
  thumbnail?: string;
  thumbnailUpdated?: Date;

  // Phase 3: Folder support
  parentId?: string;  // NEW: Parent folder ID (null/undefined = root)
  collapsed?: boolean;  // NEW: Folder collapsed state (only for type: 'folder')
}
```

### Key Design Decisions

**Option 1: Parent Reference (CHOSEN)**
- Each layer has `parentId?: string` pointing to parent folder
- Children are computed by filtering layers with matching parentId
- Pros: Simple, efficient updates, easy deletion
- Cons: Requires filtering to get children

**Option 2: Children Array (REJECTED)**
- Each folder has `children: string[]` array
- Pros: Fast child access
- Cons: Complex updates, sync issues, harder deletion

**Decision**: Parent reference is cleaner and less error-prone.

---

## Store Methods (useAppStore)

### Folder Management

```typescript
// Create a new folder
createFolder: (name: string, parentId?: string) => void

// Move layer/folder to a new parent
moveToFolder: (itemId: string, newParentId: string | null) => void

// Delete a folder (move children to parent or root)
deleteFolder: (folderId: string, deleteChildren?: boolean) => void

// Toggle folder collapse/expand
toggleFolderCollapse: (folderId: string) => void

// Rename folder
renameFolder: (folderId: string, newName: string) => void

// Get all children of a folder (recursive)
getFolderChildren: (folderId: string, recursive?: boolean) => Layer[]

// Get folder depth (for indentation)
getFolderDepth: (itemId: string) => number

// Check if folder contains item (recursive)
folderContains: (folderId: string, itemId: string) => boolean
```

### Updated Existing Methods

```typescript
// deleteLayer: Now checks if layer is a folder and handles children
deleteLayer: (id: string) => void

// updateLayer: Now validates folder-specific fields
updateLayer: (id: string, updates: Partial<Layer>) => void

// duplicateLayer: Now duplicates folder structure recursively
duplicateLayer: (id: string) => void
```

---

## UI Components

### LayerPanel Updates

**Recursive Rendering Pattern:**

```typescript
const renderLayerItem = (layer: Layer, depth: number = 0) => {
  const children = layers.filter(l => l.parentId === layer.id);
  const isFolder = layer.type === 'folder';
  const isCollapsed = layer.collapsed;

  return (
    <>
      {/* Layer/Folder Row */}
      <div style={{ paddingLeft: `${depth * 20}px` }}>
        {isFolder && (
          <button onClick={() => toggleFolderCollapse(layer.id)}>
            {isCollapsed ? '▶' : '▼'}
          </button>
        )}
        {/* ... rest of layer UI ... */}
      </div>

      {/* Children (if folder and not collapsed) */}
      {isFolder && !isCollapsed && children.map(child => (
        renderLayerItem(child, depth + 1)
      ))}
    </>
  );
};

// Root layers (no parent)
const rootLayers = layers.filter(l => !l.parentId);
rootLayers.map(layer => renderLayerItem(layer, 0));
```

**New UI Elements:**

1. **Create Folder Button**: In layer panel header
2. **Collapse/Expand Icon**: Triangle icon next to folder name
3. **Folder Icon**: 📁 or 📂 to distinguish from layers
4. **Indentation**: 20px per nesting level
5. **Drop Zone Indicator**: Visual feedback when dragging over folder

---

## Drag-and-Drop Enhancement

### Current Drag-and-Drop
Currently supports reordering layers in flat list.

### Enhanced Drag-and-Drop
1. **Dragging Over Folder**: Highlight folder as drop target
2. **Dropping Into Folder**: Move layer to folder (set parentId)
3. **Dropping Between Items**: Reorder within same parent
4. **Dragging Folder**: Move entire folder structure
5. **Visual Feedback**:
   - Blue highlight on valid drop target
   - Red highlight on invalid drop (e.g., folder into itself)
   - Horizontal line for reordering
   - Folder icon highlight for nesting

### Implementation Strategy

```typescript
const handleLayerDrop = (
  draggedId: string,
  targetId: string,
  dropPosition: 'above' | 'below' | 'inside'
) => {
  // Prevent folder from being moved into itself
  if (folderContains(draggedId, targetId)) {
    return; // Invalid drop
  }

  if (dropPosition === 'inside') {
    // Move into folder
    moveToFolder(draggedId, targetId);
  } else {
    // Reorder within same parent
    const targetParent = layers.find(l => l.id === targetId)?.parentId;
    moveToFolder(draggedId, targetParent || null);
    // Then reorder...
  }
};
```

---

## Multi-Selection with Folders

### Behavior Rules

1. **Selecting Folder**: Selects folder only (not children by default)
2. **Bulk Operations on Folder**:
   - Delete: Prompt "Delete folder and all contents?"
   - Visibility: Toggle folder + all children recursively
   - Lock: Toggle folder + all children recursively
3. **Expanding Selection**: Optional Shift+Alt+Click to select folder + children
4. **Moving Multiple Items**: Maintains relative structure

### Implementation

```typescript
// Get all items affected by bulk operation
const getAffectedItems = (selectedIds: string[]): string[] => {
  const affected = new Set(selectedIds);

  selectedIds.forEach(id => {
    const layer = layers.find(l => l.id === id);
    if (layer?.type === 'folder') {
      // Add all children recursively
      const children = getFolderChildren(id, true);
      children.forEach(child => affected.add(child.id));
    }
  });

  return Array.from(affected);
};
```

---

## Rendering Performance

### Optimization Strategies

1. **Virtualization**: Only render visible layers (use react-window if needed)
2. **Collapsed Folders**: Skip rendering children of collapsed folders
3. **Memoization**: Memo layer items to prevent unnecessary re-renders
4. **Depth Caching**: Cache folder depth calculations

### Performance Targets

- **1,000 layers**: < 100ms render time
- **10,000 layers**: < 500ms render time (with virtualization)
- **Collapse/Expand**: < 16ms (60fps animation)

---

## Migration Strategy

### Existing Layers
All existing layers have no `parentId`, so they appear at root level. No migration needed.

### Default State
```typescript
{
  layers: [
    { id: '1', name: 'Main Layer', type: 'layer', parentId: undefined, ... }
  ]
}
```

**Note**: `type: 'layer'` is the default. Existing code treats missing type as 'layer'.

---

## User Experience Flow

### Creating a Folder

1. Click "New Folder" button in layer panel header
2. Folder appears with default name "Folder 1"
3. Name is auto-selected for immediate renaming
4. Folder is created at root level by default

### Moving Layers into Folder

**Method 1: Drag-and-Drop**
1. Click and drag layer
2. Hover over folder (folder highlights)
3. Drop layer (layer moves into folder with indentation)

**Method 2: Context Menu**
1. Right-click layer
2. Select "Move to Folder" → submenu with folder list
3. Click target folder

### Organizing with Folders

**Example Structure:**
```
📁 Building 1 (collapsed)
📁 Building 2 (expanded)
  └─ 📄 Ground Floor
  └─ 📄 First Floor
  └─ 📁 Utilities (expanded)
       └─ 📄 Electrical
       └─ 📄 Plumbing
📄 Site Boundary
📄 Roads
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Folder Management', () => {
  test('createFolder creates folder at root')
  test('createFolder creates folder with parent')
  test('moveToFolder updates parentId')
  test('moveToFolder rejects circular nesting')
  test('deleteFolder moves children to parent')
  test('toggleFolderCollapse toggles collapsed state')
  test('getFolderChildren returns direct children')
  test('getFolderChildren returns recursive children')
  test('getFolderDepth calculates correct depth')
  test('folderContains detects nested items')
});
```

### Integration Tests

```typescript
describe('Folder UI', () => {
  test('renders nested folder structure')
  test('collapse icon hides children')
  test('expand icon shows children')
  test('drag layer into folder moves it')
  test('drag folder into itself is rejected')
  test('indentation increases with depth')
  test('folder icon appears for folders')
});
```

### Manual Testing Checklist

- [ ] Create folder at root level
- [ ] Create folder inside another folder
- [ ] Rename folder
- [ ] Move layer into folder via drag-and-drop
- [ ] Move folder into another folder
- [ ] Collapse/expand folder
- [ ] Delete folder (children move to parent)
- [ ] Multi-select layers in different folders
- [ ] Bulk operations on folder (visibility, lock)
- [ ] Drag folder with nested structure
- [ ] Test with 1000+ layers for performance

---

## Implementation Phases

### Phase A: Data Model (30 min)
1. Update Layer type in `types/index.ts`
2. Update default layer state
3. Add folder helper functions

### Phase B: Store Methods (60 min)
1. Add `createFolder` method
2. Add `moveToFolder` method
3. Add `deleteFolder` method
4. Add `toggleFolderCollapse` method
5. Add `getFolderChildren` helper
6. Add `getFolderDepth` helper
7. Add `folderContains` validation helper
8. Update `deleteLayer` to handle folders

### Phase C: UI - Folder Creation (30 min)
1. Add "New Folder" button to layer panel header
2. Create inline folder name input
3. Wire up folder creation

### Phase D: UI - Recursive Rendering (60 min)
1. Refactor LayerPanel to use recursive rendering
2. Add folder collapse/expand icon
3. Add indentation based on depth
4. Add folder icon visual distinction

### Phase E: Drag-and-Drop (90 min)
1. Add drop zone detection for folders
2. Add visual feedback for valid/invalid drops
3. Implement drop-into-folder logic
4. Prevent circular nesting
5. Add drop position indicators

### Phase F: Multi-Selection (30 min)
1. Update bulk operations to handle folders recursively
2. Add folder + children selection option
3. Update delete confirmation for folders

### Phase G: Testing & Polish (60 min)
1. Write unit tests for store methods
2. Write integration tests for UI
3. Manual testing with edge cases
4. Performance testing with large datasets
5. Documentation updates

**Total Estimated Time: 6 hours**

---

## Future Enhancements (Week 4+)

1. **Folder Colors**: Custom color per folder
2. **Smart Folders**: Auto-filter by criteria (e.g., "All Visible Layers")
3. **Folder Templates**: Save/load folder structures
4. **Folder Search**: Quick filter to find folders
5. **Keyboard Shortcuts**:
   - Ctrl+Shift+G: Create folder
   - Space: Collapse/expand selected folder
   - Ctrl+]: Indent layer (move into parent's next sibling folder)
   - Ctrl+[: Outdent layer (move to parent's parent)

---

## Success Criteria

Week 3 is complete when:

- ✅ Layers can be organized into folders
- ✅ Folders support unlimited nesting depth
- ✅ Collapse/expand works smoothly
- ✅ Drag-and-drop into folders works
- ✅ Multi-selection and bulk operations work with folders
- ✅ Performance is acceptable with 1000+ layers
- ✅ No breaking changes to existing functionality
- ✅ All tests pass
- ✅ Documentation is updated

---

## Notes for Implementation

- Use `type: 'layer'` as default to maintain backward compatibility
- Always validate against circular nesting (folder into itself or descendant)
- Cache folder depth calculations for performance
- Use recursive algorithms carefully (add depth limit of 50 for safety)
- Maintain sort order within each parent level
- Consider adding `orderIndex` field in Week 4 for explicit ordering
