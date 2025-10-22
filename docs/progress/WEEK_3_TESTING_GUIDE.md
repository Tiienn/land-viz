# Week 3 Folder System - Visual Testing Guide

## Quick Start

1. **Server is running** at: http://localhost:5173
2. Open the app in your browser
3. Open Layer Panel (sidebar on right)

---

## Visual Test Scenarios

### Test 1: Create Folders (30 seconds)

**Steps**:
1. Click "📁 New Folder" button
2. Repeat 2-3 times

**Expected Results**:
- Folders appear with names "Folder 1", "Folder 2", "Folder 3"
- Each shows "📁 Folder (0 items)" header
- Folder icon (📁) appears instead of thumbnail
- Collapse/expand button (▼) visible

**Visual Check**:
```
┌─────────────────────────────────┐
│ 📁 New Folder  [Multi-Select]   │  ← Button works
├─────────────────────────────────┤
│ 📁 Folder (0 items)             │  ← Auto-named
│ ▼ 📁 [Name Input]               │  ← Expandable
├─────────────────────────────────┤
│ 📁 Folder (0 items)             │
│ ▼ 📁 Folder 2                   │
└─────────────────────────────────┘
```

---

### Test 2: Drag-and-Drop Zones (1 minute)

**Steps**:
1. Draw a rectangle to create "Main Layer"
2. Create a folder ("Projects")
3. Drag "Main Layer" over "Projects" folder

**Hover Positions**:

```
┌─────────────────────────────────┐
│ TOP 30%    → Blue line above    │ ← "Drop above" zone
├─────────────────────────────────┤
│ MIDDLE 40% → Blue background    │ ← "Drop inside" zone
│             + "↓ Drop into"     │    Shows badge
├─────────────────────────────────┤
│ BOTTOM 30% → Blue line below    │ ← "Drop below" zone
└─────────────────────────────────┘
```

**Expected Visual Feedback**:
- **Top hover**: 2px blue line at top of folder
- **Middle hover**: Entire folder gets blue background (#dbeafe) + badge "↓ Drop into folder"
- **Bottom hover**: 2px blue line at bottom of folder

---

### Test 3: Drop Into Folder (30 seconds)

**Steps**:
1. Drag "Main Layer" to middle of "Projects" folder
2. See blue background appear
3. Release mouse (drop)

**Expected Results**:
- "Main Layer" moves inside "Projects"
- "Main Layer" indents by 20px
- Folder header updates: "📁 Folder (1 items)"

**Visual Result**:
```
BEFORE:
┌─────────────────────────────────┐
│ 📁 Folder (0 items)             │
│ ▼ 📁 Projects                   │
├─────────────────────────────────┤
│ Rectangle                        │
│ Main Layer                       │
└─────────────────────────────────┘

AFTER:
┌─────────────────────────────────┐
│ 📁 Folder (1 items)             │ ← Count updated
│ ▼ 📁 Projects                   │
│   │ Rectangle                   │ ← Indented 20px
│   │ Main Layer                  │
└─────────────────────────────────┘
```

---

### Test 4: Collapse/Expand (15 seconds)

**Steps**:
1. Click ▼ button on "Projects" folder
2. Observe children hide
3. Click ▶ button to expand
4. Observe children reappear

**Expected Results**:
- ▼ changes to ▶ when collapsed
- Children layers disappear instantly
- Folder still shows count: "📁 Folder (1 items)"
- Expand reverses the process

---

### Test 5: Circular Nesting Prevention (30 seconds)

**Steps**:
1. Create two folders: "Parent" and "Child"
2. Drag "Child" into "Parent" (works - Child is now inside Parent)
3. Try to drag "Parent" over "Child" folder

**Expected Results**:
- When hovering over "Child" in middle zone:
  - Background turns **RED** (#fee2e2)
  - Badge shows "✕ Cannot drop here"
  - Cursor changes to "not-allowed"
- Drop is prevented (nothing happens on release)

**Visual Feedback**:
```
✅ VALID:   Child → Parent (Blue background)
❌ INVALID: Parent → Child (Red background)
```

---

### Test 6: Multi-Level Nesting (1 minute)

**Steps**:
1. Create folders: "Level 1", "Level 2", "Level 3"
2. Drag "Level 2" into "Level 1"
3. Drag "Level 3" into "Level 2"
4. Draw a shape and drag into "Level 3"

**Expected Results**:
- Level 1: 0px indent (root level)
- Level 2: 20px indent (inside Level 1)
- Level 3: 40px indent (inside Level 2)
- Shape: 60px indent (inside Level 3)

**Visual Structure**:
```
📁 Level 1 (1 items)
▼ 📁
  📁 Level 2 (1 items)      ← 20px indent
  ▼ 📁
    📁 Level 3 (1 items)    ← 40px indent
    ▼ 📁
      Rectangle             ← 60px indent
      My Shape
```

---

### Test 7: Rename Folder (30 seconds)

**Steps**:
1. Click on folder name
2. Type new name
3. Press Enter

**Expected Results**:
- Name changes immediately
- Folder maintains all children
- No visual glitches

---

## Console Commands (Advanced Testing)

Open browser console (F12) for direct store access:

### Get Store Reference
```javascript
const store = window.__useAppStore.getState();
const layers = store.layers;
```

### Create Folders Programmatically
```javascript
store.createFolder('Design Files');
store.createFolder('Archive');
store.createFolder('Work In Progress');
```

### Move Layers by ID
```javascript
// Get folder and layer IDs
const designId = layers.find(l => l.name === 'Design Files').id;
const mainId = layers.find(l => l.name === 'Main Layer').id;

// Move layer into folder
store.moveToFolder(mainId, designId);
```

### Test Collapse/Expand
```javascript
const folderId = layers.find(l => l.name === 'Design Files').id;
store.toggleFolderCollapse(folderId);  // Collapse
store.toggleFolderCollapse(folderId);  // Expand
```

### Get Folder Children
```javascript
const folderId = layers.find(l => l.name === 'Design Files').id;
const children = store.getFolderChildren(folderId, false);  // Direct children
const allChildren = store.getFolderChildren(folderId, true); // Recursive
console.log('Children:', children.map(c => c.name));
```

### Check Folder Depth
```javascript
const layerId = layers.find(l => l.name === 'Main Layer').id;
const depth = store.getFolderDepth(layerId);
console.log('Depth:', depth);  // 0 = root, 1 = one level deep, etc.
```

### Test Circular Prevention
```javascript
const parentId = layers.find(l => l.name === 'Parent').id;
const childId = layers.find(l => l.name === 'Child').id;
const contains = store.folderContains(parentId, childId);
console.log('Parent contains child:', contains);  // true/false
```

---

## Issue Checklist

If something doesn't work, check:

- [ ] Dev server is running (http://localhost:5173)
- [ ] Browser console shows no errors (F12 → Console tab)
- [ ] Layer Panel is open (sidebar visible)
- [ ] At least one folder exists (click "📁 New Folder")
- [ ] Layers exist to drag (draw shapes or use Main Layer)

---

## Visual Reference: Drop Zones

### For Folders (3 zones):
```
┌───────────────────────────────┐
│ ← TOP 30% (Above)             │ Blue border top
├───────────────────────────────┤
│ ← MIDDLE 40% (Inside)         │ Blue background
│   Shows: "↓ Drop into folder" │ + Badge
├───────────────────────────────┤
│ ← BOTTOM 30% (Below)          │ Blue border bottom
└───────────────────────────────┘
```

### For Regular Layers (2 zones):
```
┌───────────────────────────────┐
│ ← TOP 50% (Above)             │ Blue border top
├───────────────────────────────┤
│ ← BOTTOM 50% (Below)          │ Blue border bottom
└───────────────────────────────┘
```

---

## Color Reference

| State | Color | Hex Code | Meaning |
|-------|-------|----------|---------|
| Valid drop (inside) | Light blue | #dbeafe | Ready to nest |
| Invalid drop | Light red | #fee2e2 | Circular nesting |
| Hover (above/below) | Light gray | #f3f4f6 | Reordering |
| Drop indicator | Blue | #3b82f6 | Active drop zone |
| Selected layer | Sky blue | #f0f9ff | Currently selected |

---

## Expected Test Duration

- **Quick smoke test**: 2 minutes (Tests 1-4)
- **Comprehensive test**: 5 minutes (All tests)
- **Console exploration**: 3-5 minutes (Advanced testing)

**Total**: ~10 minutes for complete validation

---

## Success Criteria

After testing, you should observe:

✅ Folders created with auto-naming
✅ Three distinct drop zones with visual feedback
✅ Layers move into folders with 20px indent
✅ Circular nesting prevented with red feedback
✅ Collapse/expand working smoothly
✅ Multi-level nesting with increasing indents
✅ No console errors
✅ Smooth 200ms transitions
✅ Professional UI polish

**If all checkboxes pass**: Week 3 is production-ready! 🎉

---

**Testing URL**: http://localhost:5173
**Documentation**: See WEEK_3_STATUS.md for complete feature list
**API Reference**: See WEEK_3_DRAG_DROP_IMPLEMENTATION.md for technical details
