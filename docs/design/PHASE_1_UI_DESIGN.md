# Phase 1 Layer Panel - Complete UI/UX Design

**Features:** Thumbnails + Multi-Selection + Groups
**Design System:** Photoshop-inspired, compact, professional
**Target:** Land visualization workflow

---

## 🎨 Visual Design Overview

### Design Principles

1. **Visual Hierarchy** - Thumbnails for instant recognition
2. **Compact Layout** - More layers visible (28px rows vs 60px)
3. **Clear Selection** - Checkboxes + blue highlight
4. **Nested Groups** - Collapsible folders with indentation
5. **Consistent Spacing** - 8px padding throughout

---

## 📐 Complete Layout Design

### Full Panel Mockup (400px width × viewport height)

```
┌────────────────────────────────────────────────────────────┐
│ [38;5;245m◀[0m  [1mLayers[0m                                          │ ← Header
├────────────────────────────────────────────────────────────┤
│ 🔍 [2mSearch layers...[0m                           [38;5;240m✕[0m │ ← Search
├────────────────────────────────────────────────────────────┤
│ [38;5;33m[📁] [🗑] [🔗][0m           [2m3 layers selected[0m       │ ← Toolbar
├────────────────────────────────────────────────────────────┤
│ [38;5;240m▼[0m 📁 [1mBuilding[0m (3)                    👁  🔒     │ ← Group (expanded)
│   ☑ [38;5;33m┃[0m 🖼️ Foundation               👁  🔒     │ ← Selected layer
│   ☑ [38;5;33m┃[0m 🖼️ Walls                    👁  ⚪     │ ← Selected layer
│   ☐   🖼️ Roof                     👁  ⚪     │ ← Unselected
│                                                            │
│ [38;5;240m▶[0m 📁 [1mLandscape[0m (2)                  👁  ⚪     │ ← Group (collapsed)
│                                                            │
│ ☐   🖼️ Driveway                  👁  ⚪     │ ← Root layer
│                                                            │
│ ☐   ✏️ Site Label                 👁  ⚪     │ ← Text layer
├────────────────────────────────────────────────────────────┤
│ [1mSelected:[0m Foundation                                 │ ← Properties
│ Opacity: [38;5;33m▬▬▬▬▬▬▬▬[0m[38;5;240m○[0m[2m▬▬[0m 80%                      │
│ [2mLocked: Position[0m                                    │
└────────────────────────────────────────────────────────────┘
```

### Color Palette

```typescript
const colors = {
  // Structure
  border: '#e5e7eb',
  background: '#ffffff',
  hover: '#f9fafb',

  // Selection
  selected: '#eff6ff',
  selectedBorder: '#3b82f6',
  selectedAccent: '#2563eb',

  // Groups
  groupExpanded: '#f9fafb',
  groupCollapsed: '#ffffff',

  // Icons
  iconDefault: '#6b7280',
  iconActive: '#3b82f6',
  iconDanger: '#ef4444',

  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
};
```

---

## 🔍 Feature Breakdown

### 1. Layer Thumbnails (40×40px)

#### Thumbnail Design Specifications

```
┌─────────────────────┐
│ Layer Row           │
├─────────────────────┤
│ ☑ ┃ 🖼️ Foundation  │
│   ┃  ↑             │
│   ┃  └─ 40×40px    │
│   ┃     thumbnail  │
└─────────────────────┘
```

**Thumbnail Rendering:**
```typescript
interface LayerThumbnail {
  // Visual specs
  size: { width: 40, height: 40 };
  retina: { width: 80, height: 80 };

  // Style
  border: '1px solid #e5e7eb';
  borderRadius: '4px';
  background: 'checkerboard'; // For transparency

  // Content
  dataUrl: string; // base64 PNG

  // Performance
  updateDebounce: 500; // ms
  cacheInMemory: true;
}
```

**Thumbnail Content by Layer Type:**

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ ▭       │  │   ●     │  │  ╱╲     │  │   ABC   │
│         │  │         │  │ ╱  ╲    │  │         │
│      ▭  │  │         │  │╱____╲   │  │         │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
Rectangle    Circle       Polyline     Text

┌─────────┐  ┌─────────┐
│ 📁      │  │ [empty] │
│ (3)     │  │         │
│         │  │         │
└─────────┘  └─────────┘
Group        Empty Layer
```

**Generation Logic:**
```typescript
const generateThumbnail = (layer: Layer): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 80;  // Retina
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw checkerboard background
  drawCheckerboard(ctx, 80, 80, 8); // 8px squares

  // 2. Get layer elements
  const elements = getLayerElements(layer.id);

  // 3. Calculate bounds
  const bounds = calculateBounds(elements);

  // 4. Scale to fit 80×80
  const scale = Math.min(
    80 / bounds.width,
    80 / bounds.height
  ) * 0.8; // 80% to add padding

  // 5. Center in canvas
  ctx.translate(40, 40);
  ctx.scale(scale, scale);
  ctx.translate(-bounds.centerX, -bounds.centerY);

  // 6. Render elements
  elements.forEach(el => {
    if (isShapeElement(el)) {
      renderShapeToCanvas(ctx, el);
    } else if (isTextElement(el)) {
      renderTextToCanvas(ctx, el);
    }
  });

  return canvas.toDataURL('image/png');
};

const drawCheckerboard = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  squareSize: number
) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f3f4f6';
  for (let y = 0; y < height; y += squareSize) {
    for (let x = 0; x < width; x += squareSize) {
      if ((x / squareSize + y / squareSize) % 2 === 0) {
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  }
};
```

---

### 2. Multi-Layer Selection

#### Selection States

**Single Selection (Current Behavior):**
```
┌────────────────────────────────────┐
│ ☐   🖼️ Foundation    👁  🔒     │ ← Unselected
│ ☐ ┃ 🖼️ Walls         👁  ⚪     │ ← Selected (blue border)
│ ☐   🖼️ Roof          👁  ⚪     │ ← Unselected
└────────────────────────────────────┘
```

**Multi-Selection (New):**
```
┌────────────────────────────────────┐
│ ☑ ┃ 🖼️ Foundation    👁  🔒     │ ← Selected (checkbox + border)
│ ☑ ┃ 🖼️ Walls         👁  ⚪     │ ← Selected
│ ☐   🖼️ Roof          👁  ⚪     │ ← Unselected
└────────────────────────────────────┘
Status: "2 layers selected"
```

#### Selection Interactions

**Keyboard Shortcuts:**
```
Click             → Single selection (clear others)
Shift + Click     → Range selection (from last to current)
Ctrl/Cmd + Click  → Toggle selection (add/remove)
Ctrl/Cmd + A      → Select all visible layers
Escape            → Clear selection
```

**Visual Feedback:**
```typescript
interface SelectionStyle {
  single: {
    background: '#eff6ff',
    borderLeft: '3px solid #3b82f6',
    checkbox: false,
  },
  multi: {
    background: '#eff6ff',
    borderLeft: '3px solid #3b82f6',
    checkbox: true,
    checkboxColor: '#3b82f6',
  },
  hover: {
    background: '#f9fafb',
    cursor: 'pointer',
  },
}
```

#### Bulk Operations Toolbar

**Toolbar Appears When Multiple Selected:**
```
┌────────────────────────────────────────┐
│ [🗑 Delete] [👁 Hide] [🔒 Lock]       │ ← Bulk actions
│ [⬆ Move Up] [⬇ Move Down]             │
│ Opacity: [▬▬▬▬○▬▬▬▬] 50%              │ ← Batch property
└────────────────────────────────────────┘
```

**Implementation:**
```typescript
const BulkOperationsToolbar: React.FC<{
  selectedLayerIds: string[];
}> = ({ selectedLayerIds }) => {
  if (selectedLayerIds.length < 2) return null;

  return (
    <div style={styles.bulkToolbar}>
      <div style={styles.actionRow}>
        <button onClick={() => deleteLayers(selectedLayerIds)}>
          🗑 Delete ({selectedLayerIds.length})
        </button>
        <button onClick={() => toggleVisibility(selectedLayerIds)}>
          👁 Toggle Visibility
        </button>
        <button onClick={() => toggleLock(selectedLayerIds)}>
          🔒 Toggle Lock
        </button>
      </div>

      <div style={styles.propertyRow}>
        <label>Opacity:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => setBatchOpacity(
            selectedLayerIds,
            parseFloat(e.target.value)
          )}
        />
      </div>
    </div>
  );
};
```

---

### 3. Layer Groups/Folders

#### Group Visual Hierarchy

**Collapsed Group:**
```
┌────────────────────────────────────┐
│ ☐ [38;5;240m▶[0m 📁 [1mBuilding[0m (3)      👁  🔒  │
└────────────────────────────────────┘
     ↑   ↑     ↑
     │   │     └─ Layer count
     │   └─────── Folder icon
     └─────────── Collapse indicator
```

**Expanded Group (1 level):**
```
┌────────────────────────────────────┐
│ ☐ [38;5;240m▼[0m 📁 [1mBuilding[0m (3)      👁  🔒  │ ← Group row
│   ☐   🖼️ Foundation    👁  🔒  │ ← Child (20px indent)
│   ☐   🖼️ Walls         👁  ⚪  │
│   ☐   🖼️ Roof          👁  ⚪  │
└────────────────────────────────────┘
```

**Nested Groups (2 levels):**
```
┌────────────────────────────────────────┐
│ ☐ ▼ 📁 Site (5)             👁  🔒  │ ← Level 0
│   ☐ ▼ 📁 Building (3)       👁  🔒  │ ← Level 1 (+20px)
│     ☐   🖼️ Foundation      👁  🔒  │ ← Level 2 (+40px)
│     ☐   🖼️ Walls           👁  ⚪  │
│     ☐   🖼️ Roof            👁  ⚪  │
│   ☐ ▶ 📁 Landscape (2)      👁  ⚪  │ ← Level 1 (+20px)
└────────────────────────────────────────┘
```

#### Group Data Structure

```typescript
interface LayerGroup {
  id: string;
  name: string;
  type: 'group';
  children: Array<Layer | LayerGroup>;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  opacity: number;
  color?: string;
  created: Date;
  modified: Date;
  thumbnail?: string;
}

type LayerTreeNode = Layer | LayerGroup;

// Type guards
function isGroup(node: LayerTreeNode): node is LayerGroup {
  return (node as LayerGroup).type === 'group';
}

function isLayer(node: LayerTreeNode): node is Layer {
  return !isGroup(node);
}
```

#### Group Operations

**Create Group:**
```typescript
const createGroup = (
  name: string,
  selectedLayerIds: string[]
): LayerGroup => {
  const group: LayerGroup = {
    id: `group-${Date.now()}`,
    name,
    type: 'group',
    children: [],
    expanded: true,
    visible: true,
    locked: false,
    opacity: 1,
    created: new Date(),
    modified: new Date(),
  };

  // Move selected layers into group
  selectedLayerIds.forEach(id => {
    const layer = findLayer(id);
    if (layer) {
      group.children.push(layer);
      removeLayerFromParent(id);
    }
  });

  return group;
};
```

**Group Properties Cascade:**
```typescript
// Visibility: Hide group = hide all children
const toggleGroupVisibility = (groupId: string) => {
  const group = findGroup(groupId);
  group.visible = !group.visible;

  // Cascade to children
  group.children.forEach(child => {
    if (isGroup(child)) {
      toggleGroupVisibility(child.id);
    } else {
      child.visible = group.visible;
    }
  });
};

// Opacity: Group opacity multiplies with child opacity
const getEffectiveOpacity = (node: LayerTreeNode): number => {
  let opacity = node.opacity;
  let parent = findParent(node.id);

  while (parent) {
    opacity *= parent.opacity;
    parent = findParent(parent.id);
  }

  return opacity;
};
```

**Drag & Drop into Groups:**
```typescript
const handleLayerDrop = (
  draggedId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside'
) => {
  const dragged = findNode(draggedId);
  const target = findNode(targetId);

  // Remove from current parent
  removeFromParent(draggedId);

  if (position === 'inside' && isGroup(target)) {
    // Add to group
    target.children.push(dragged);
  } else {
    // Insert before/after
    const parent = findParent(targetId);
    const index = parent.children.indexOf(target);
    const insertIndex = position === 'before' ? index : index + 1;
    parent.children.splice(insertIndex, 0, dragged);
  }
};
```

---

## 🎯 Component Architecture

### Component Tree

```
LayerPanel
├── LayerPanelHeader
│   └── CollapseButton
├── LayerSearchBox
│   └── ClearButton
├── BulkOperationsToolbar (if multi-select)
│   ├── BulkActionButtons
│   └── BatchPropertyControls
├── LayerTree (recursive)
│   └── LayerTreeNode (recursive)
│       ├── LayerRow (if layer)
│       │   ├── Checkbox
│       │   ├── Thumbnail
│       │   ├── LayerName
│       │   ├── VisibilityToggle
│       │   └── LockToggle
│       └── GroupRow (if group)
│           ├── Checkbox
│           ├── CollapseIcon
│           ├── GroupIcon
│           ├── GroupName
│           ├── ChildCount
│           ├── VisibilityToggle
│           ├── LockToggle
│           └── LayerTree (recursive children)
└── LayerPropertiesFooter
    ├── SelectedLayerName
    ├── OpacitySlider
    └── LockStatus
```

### Key Components

#### 1. LayerTreeNode Component

```typescript
interface LayerTreeNodeProps {
  node: LayerTreeNode;
  depth: number;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onToggleExpand?: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (draggedId: string, targetId: string, position: string) => void;
}

const LayerTreeNode: React.FC<LayerTreeNodeProps> = ({
  node,
  depth,
  isSelected,
  onSelect,
  onToggleExpand,
  onDragStart,
  onDrop,
}) => {
  const indent = depth * 20; // 20px per level

  if (isGroup(node)) {
    return (
      <div>
        <GroupRow
          group={node}
          indent={indent}
          isSelected={isSelected}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
        />

        {node.expanded && (
          <div>
            {node.children.map(child => (
              <LayerTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                isSelected={selectedIds.includes(child.id)}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onDragStart={onDragStart}
                onDrop={onDrop}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <LayerRow
      layer={node}
      indent={indent}
      isSelected={isSelected}
      onSelect={onSelect}
      onDragStart={onDragStart}
      onDrop={onDrop}
    />
  );
};
```

#### 2. LayerRow Component

```typescript
interface LayerRowProps {
  layer: Layer;
  indent: number;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragStart: (id: string) => void;
  onDrop: (draggedId: string, targetId: string, position: string) => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  indent,
  isSelected,
  onSelect,
  onDragStart,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect(layer.id, isMulti);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDropPosition(y < rect.height / 2 ? 'before' : 'after');
    setIsDragOver(true);
  };

  return (
    <div
      draggable
      onClick={handleClick}
      onDragStart={() => onDragStart(layer.id)}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('layerId');
        onDrop(draggedId, layer.id, dropPosition || 'after');
        setIsDragOver(false);
      }}
      style={{
        paddingLeft: indent,
        background: isSelected ? '#eff6ff' : 'white',
        borderLeft: isSelected ? '3px solid #3b82f6' : 'none',
        borderTop: isDragOver && dropPosition === 'before' ? '2px solid #3b82f6' : 'none',
        borderBottom: isDragOver && dropPosition === 'after' ? '2px solid #3b82f6' : 'none',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '48px', // Fixed height for consistency
        cursor: 'pointer',
      }}
    >
      {/* Checkbox (shown when multi-selecting) */}
      <Checkbox checked={isSelected} />

      {/* Thumbnail */}
      <LayerThumbnail layer={layer} size={40} />

      {/* Layer name */}
      <span style={{ flex: 1, fontSize: '14px' }}>
        {layer.name}
      </span>

      {/* Visibility toggle */}
      <VisibilityToggle
        visible={layer.visible}
        onClick={(e) => {
          e.stopPropagation();
          toggleLayerVisibility(layer.id);
        }}
      />

      {/* Lock toggle */}
      <LockToggle
        locked={layer.locked}
        onClick={(e) => {
          e.stopPropagation();
          toggleLayerLock(layer.id);
        }}
      />
    </div>
  );
};
```

#### 3. GroupRow Component

```typescript
interface GroupRowProps {
  group: LayerGroup;
  indent: number;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onToggleExpand: (id: string) => void;
}

const GroupRow: React.FC<GroupRowProps> = ({
  group,
  indent,
  isSelected,
  onSelect,
  onToggleExpand,
}) => {
  return (
    <div
      style={{
        paddingLeft: indent,
        background: isSelected ? '#eff6ff' : '#f9fafb',
        borderLeft: isSelected ? '3px solid #3b82f6' : 'none',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '48px',
        cursor: 'pointer',
        fontWeight: 500,
      }}
      onClick={(e) => {
        const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
        onSelect(group.id, isMulti);
      }}
    >
      {/* Checkbox */}
      <Checkbox checked={isSelected} />

      {/* Collapse/expand triangle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(group.id);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        {group.expanded ? '▼' : '▶'}
      </button>

      {/* Folder icon */}
      <span style={{ fontSize: '16px' }}>📁</span>

      {/* Group name */}
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
        {group.name}
      </span>

      {/* Child count */}
      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
        ({group.children.length})
      </span>

      {/* Visibility toggle */}
      <VisibilityToggle
        visible={group.visible}
        onClick={(e) => {
          e.stopPropagation();
          toggleGroupVisibility(group.id);
        }}
      />

      {/* Lock toggle */}
      <LockToggle
        locked={group.locked}
        onClick={(e) => {
          e.stopPropagation();
          toggleGroupLock(group.id);
        }}
      />
    </div>
  );
};
```

---

## 📊 State Management Design

### Zustand Store Updates

```typescript
interface LayerState {
  // NEW: Tree structure instead of flat array
  layerTree: LayerTreeNode[];

  // NEW: Multi-selection support
  selectedLayerIds: string[];

  // Existing
  activeLayerId: string; // Keep for backward compatibility

  // NEW: Group expansion state
  expandedGroupIds: Set<string>;

  // Actions
  selectLayer: (id: string, multi?: boolean) => void;
  selectLayerRange: (fromId: string, toId: string) => void;
  toggleLayerSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  createGroup: (name: string, layerIds: string[]) => void;
  ungroupLayers: (groupId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  moveNodeToGroup: (nodeId: string, groupId: string) => void;

  generateThumbnail: (layerId: string) => void;
  regenerateThumbnails: (layerIds: string[]) => void;

  // Bulk operations
  deleteSelectedLayers: () => void;
  toggleSelectedVisibility: () => void;
  toggleSelectedLock: () => void;
  setSelectedOpacity: (opacity: number) => void;
}
```

### Store Implementation

```typescript
const useLayerStore = create<LayerState>((set, get) => ({
  layerTree: [],
  selectedLayerIds: [],
  activeLayerId: '',
  expandedGroupIds: new Set(),

  // Selection
  selectLayer: (id, multi = false) => {
    if (!multi) {
      set({ selectedLayerIds: [id], activeLayerId: id });
    } else {
      const current = get().selectedLayerIds;
      if (current.includes(id)) {
        // Deselect
        set({
          selectedLayerIds: current.filter(lid => lid !== id),
          activeLayerId: current[0] || '',
        });
      } else {
        // Add to selection
        set({
          selectedLayerIds: [...current, id],
          activeLayerId: id,
        });
      }
    }
  },

  selectLayerRange: (fromId, toId) => {
    const allIds = flattenTree(get().layerTree).map(n => n.id);
    const fromIndex = allIds.indexOf(fromId);
    const toIndex = allIds.indexOf(toId);

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    const rangeIds = allIds.slice(start, end + 1);
    set({ selectedLayerIds: rangeIds });
  },

  // Groups
  createGroup: (name, layerIds) => {
    const group: LayerGroup = {
      id: `group-${Date.now()}`,
      name,
      type: 'group',
      children: [],
      expanded: true,
      visible: true,
      locked: false,
      opacity: 1,
      created: new Date(),
      modified: new Date(),
    };

    // Move layers into group
    const tree = get().layerTree;
    layerIds.forEach(id => {
      const node = findNode(tree, id);
      if (node) {
        group.children.push(node);
        removeNodeFromTree(tree, id);
      }
    });

    // Add group to tree
    set({ layerTree: [...tree, group] });

    // Expand group
    const expanded = get().expandedGroupIds;
    expanded.add(group.id);
    set({ expandedGroupIds: new Set(expanded) });
  },

  toggleGroupExpanded: (groupId) => {
    const expanded = get().expandedGroupIds;
    if (expanded.has(groupId)) {
      expanded.delete(groupId);
    } else {
      expanded.add(groupId);
    }
    set({ expandedGroupIds: new Set(expanded) });
  },

  // Bulk operations
  deleteSelectedLayers: () => {
    const tree = get().layerTree;
    const selected = get().selectedLayerIds;

    selected.forEach(id => removeNodeFromTree(tree, id));

    set({
      layerTree: [...tree],
      selectedLayerIds: [],
      activeLayerId: '',
    });
  },

  toggleSelectedVisibility: () => {
    const selected = get().selectedLayerIds;
    const tree = get().layerTree;

    selected.forEach(id => {
      const node = findNode(tree, id);
      if (node) {
        node.visible = !node.visible;
      }
    });

    set({ layerTree: [...tree] });
  },
}));
```

---

## 🎬 Interaction Flows

### Flow 1: Select Multiple Layers

```
1. User clicks Layer A
   └─> Layer A selected (blue highlight)

2. User Shift+Clicks Layer D
   └─> Layers A, B, C, D selected (range)
   └─> Checkboxes appear
   └─> Status: "4 layers selected"
   └─> Bulk toolbar appears

3. User Ctrl+Clicks Layer B
   └─> Layer B deselected
   └─> Status: "3 layers selected"
```

### Flow 2: Create Group from Selection

```
1. User selects Layers A, B, C (multi-select)

2. User clicks "Create Group" button (📁)
   └─> Modal appears: "Group name?"
   └─> User enters "Building"
   └─> Clicks "Create"

3. System creates group:
   ├─ New group "Building (3)" appears
   ├─ Layers A, B, C move inside
   ├─ Group is expanded by default
   └─ Group is selected

4. Result:
   📁 Building (3) ▼
     🖼️ Layer A
     🖼️ Layer B
     🖼️ Layer C
```

### Flow 3: Drag Layer into Group

```
1. User drags Layer D (not in group)

2. User hovers over Group "Building"
   └─> Drop zone highlights
   └─> Indicator: "Drop inside Building"

3. User releases
   └─> Layer D moves into Building group
   └─> Group count updates: "Building (4)"
   └─> Group auto-expands if collapsed

4. Result:
   📁 Building (4) ▼
     🖼️ Layer A
     🖼️ Layer B
     🖼️ Layer C
     🖼️ Layer D [NEW]
```

### Flow 4: Bulk Operations

```
1. User selects 5 layers (multi-select)

2. Bulk toolbar shows:
   [🗑 Delete] [👁 Hide] [🔒 Lock]
   Opacity: [slider]

3. User clicks "Hide"
   └─> All 5 layers visibility = false
   └─> Eye icons turn gray
   └─> Shapes disappear from canvas

4. User adjusts opacity slider to 50%
   └─> All 5 layers opacity = 0.5
   └─> Shapes become semi-transparent
```

---

## 🔧 Performance Optimizations

### 1. Thumbnail Caching Strategy

```typescript
class ThumbnailCache {
  private cache = new Map<string, string>();
  private queue: string[] = [];
  private generating = false;

  get(layerId: string): string | null {
    return this.cache.get(layerId) || null;
  }

  async generate(layerId: string): Promise<string> {
    // Check cache first
    if (this.cache.has(layerId)) {
      return this.cache.get(layerId)!;
    }

    // Add to queue
    this.queue.push(layerId);

    // Start generator if not running
    if (!this.generating) {
      this.processQueue();
    }

    // Wait for result
    return new Promise(resolve => {
      const check = () => {
        if (this.cache.has(layerId)) {
          resolve(this.cache.get(layerId)!);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private async processQueue() {
    this.generating = true;

    while (this.queue.length > 0) {
      const layerId = this.queue.shift()!;

      // Generate thumbnail
      const dataUrl = await generateThumbnail(layerId);

      // Cache it
      this.cache.set(layerId, dataUrl);

      // Small delay to avoid blocking UI
      await new Promise(resolve => setTimeout(resolve, 16)); // 60 FPS
    }

    this.generating = false;
  }

  invalidate(layerId: string) {
    this.cache.delete(layerId);
  }

  clear() {
    this.cache.clear();
  }
}

const thumbnailCache = new ThumbnailCache();
```

### 2. Virtual Scrolling (If 100+ Layers)

```typescript
import { FixedSizeList } from 'react-window';

const LayerList: React.FC = () => {
  const flattenedLayers = useMemo(
    () => flattenTreeWithDepth(layerTree),
    [layerTree]
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={flattenedLayers.length}
      itemSize={48} // Fixed 48px row height
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <LayerTreeNode
            node={flattenedLayers[index].node}
            depth={flattenedLayers[index].depth}
            isSelected={selectedIds.includes(flattenedLayers[index].node.id)}
            {...handlers}
          />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 3. Debounced Thumbnail Updates

```typescript
const useDebouncedThumbnailUpdate = (layerId: string, dependencies: any[]) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      thumbnailCache.invalidate(layerId);
      thumbnailCache.generate(layerId);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, dependencies);
};
```

---

## ✅ Implementation Checklist

### Week 1: Thumbnails

- [ ] Update Layer type with thumbnail field
- [ ] Create ThumbnailCache class
- [ ] Implement generateThumbnail() function
- [ ] Add checkerboard background renderer
- [ ] Add shape-to-canvas renderer
- [ ] Add text-to-canvas renderer
- [ ] Update LayerRow to show thumbnails
- [ ] Add debounced update on layer change
- [ ] Test with 50+ layers

### Week 2: Multi-Selection

- [ ] Change selectedLayerId → selectedLayerIds[]
- [ ] Add Checkbox component
- [ ] Implement click handlers (single/shift/ctrl)
- [ ] Add selectLayerRange() function
- [ ] Add toggleLayerSelection() function
- [ ] Update LayerRow selection styles
- [ ] Create BulkOperationsToolbar component
- [ ] Implement bulk delete
- [ ] Implement bulk visibility toggle
- [ ] Implement bulk lock toggle
- [ ] Implement batch opacity slider
- [ ] Add "X layers selected" status
- [ ] Test edge cases (empty selection, single, range, scattered)

### Week 3-4: Groups

- [ ] Create LayerGroup type
- [ ] Update state to layerTree structure
- [ ] Create GroupRow component
- [ ] Add collapse/expand icon
- [ ] Implement toggleGroupExpanded()
- [ ] Add createGroup() function
- [ ] Add ungroupLayers() function
- [ ] Implement drag-into-group
- [ ] Add group property cascading (visibility, opacity)
- [ ] Support nested groups (3+ levels)
- [ ] Add group count display
- [ ] Generate group thumbnails (composite)
- [ ] Test with complex hierarchies

---

## 📱 Responsive Behavior

### Mobile/Tablet Adaptations (< 768px)

```typescript
// Compact mode for small screens
const isMobile = window.innerWidth < 768;

const styles = {
  layerRow: {
    height: isMobile ? '56px' : '48px', // Taller for touch
    fontSize: isMobile ? '16px' : '14px', // Larger text
  },
  thumbnail: {
    size: isMobile ? 48 : 40, // Larger thumbnails
  },
  indent: {
    perLevel: isMobile ? 16 : 20, // Less indent
  },
  toolbar: {
    flexDirection: isMobile ? 'column' : 'row', // Stack buttons
  },
};
```

---

## 🎨 Design Tokens

```typescript
export const layerPanelTheme = {
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },

  // Row heights
  heights: {
    row: '48px',
    rowMobile: '56px',
    thumbnail: '40px',
    thumbnailRetina: '80px',
  },

  // Indentation
  indent: {
    perLevel: '20px',
    maxLevels: 10,
  },

  // Colors
  colors: {
    background: '#ffffff',
    hover: '#f9fafb',
    selected: '#eff6ff',
    selectedBorder: '#3b82f6',
    border: '#e5e7eb',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
    icon: {
      default: '#6b7280',
      active: '#3b82f6',
      danger: '#ef4444',
    },
  },

  // Typography
  typography: {
    fontFamily: 'Nunito Sans, sans-serif',
    fontSize: {
      sm: '12px',
      md: '14px',
      lg: '16px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },

  // Transitions
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
};
```

---

**Design Complete!** ✅

Ready to start implementation with Week 1: Thumbnails.

**Next Steps:**
1. Review this design document
2. Ask questions / request changes
3. Begin implementation starting with ThumbnailCache class

---

**Document Version:** 1.0
**Last Updated:** January 17, 2025
**Status:** ✅ Ready for Development
