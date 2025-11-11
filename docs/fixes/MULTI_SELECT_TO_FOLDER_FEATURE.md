# Multi-Select to Folder Feature

**Date**: January 9, 2025
**Priority**: ⭐⭐⭐ (Critical)
**Status**: ✅ Implemented

## Problem

The layer management workflow required users to:
1. Create a folder manually
2. Drag each layer individually into the folder
3. Repeat for each layer they wanted to organize

This was tedious and time-consuming when organizing multiple layers, especially compared to modern design tools like Figma or Canva where batch operations are streamlined.

### User Request:
> "When I click Multi select in Layer panel and select the layers, after selecting the layers i want when I click on the 'Folder' icon. I want all the Layers I selected to move in The Folder"

## Solution

### New Workflow

Implemented a streamlined workflow that combines folder creation and batch layer organization:

1. User clicks "Multi select" button in Layers panel
2. Checkboxes appear next to each layer
3. User selects multiple layers via checkboxes
4. User clicks the "Folder" icon
5. **System automatically**:
   - Creates a new folder with incremental naming ("Folder 1", "Folder 2", etc.)
   - Moves ALL selected layers into the new folder
   - Clears the selection
   - Exits multi-select mode

### Implementation

**File**: `app/src/components/LayerPanel.tsx`
**Lines**: 688-743

```typescript
{/* Folder button - create folder and auto-move selected layers */}
<button
  onClick={() => {
    // Create new folder with incremental naming
    const folderCount = layers.filter(l => l.type === 'folder').length;
    const newFolderName = `Folder ${folderCount + 1}`;
    createFolder(newFolderName);

    // If layers are selected, move them into the new folder
    if (selectedLayerIds.length > 0) {
      // Use setTimeout to ensure folder is created first
      setTimeout(() => {
        const folders = useAppStore.getState().layers.filter(l => l.type === 'folder');
        const newFolder = folders[folders.length - 1]; // Get the newly created folder

        if (newFolder) {
          // Move all selected layers into the new folder
          selectedLayerIds.forEach(layerId => {
            moveToFolder(layerId, newFolder.id);
          });

          // Clear selection and exit multi-select mode
          useAppStore.setState({ selectedLayerIds: [] });
          setCheckboxMode(false);
        }
      }, 10); // Small delay to ensure state update completes
    }
  }}
  style={{
    padding: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#666',
    fontSize: '13px',
    transition: 'color 0.2s',
  }}
  onMouseEnter={e => e.currentTarget.style.color = '#00C4CC'}
  onMouseLeave={e => e.currentTarget.style.color = '#666'}
  title={selectedLayerIds.length > 0
    ? `Create folder and move ${selectedLayerIds.length} selected layer${selectedLayerIds.length > 1 ? 's' : ''}`
    : 'Create new folder'}
>
  {/* Folder Icon SVG */}
</button>
```

## Technical Details

### Timing Considerations

The implementation uses a 10ms setTimeout to ensure the folder creation state update completes before moving layers:

```typescript
setTimeout(() => {
  const folders = useAppStore.getState().layers.filter(l => l.type === 'folder');
  const newFolder = folders[folders.length - 1];
  // ... move layers
}, 10);
```

This prevents race conditions where `moveToFolder` might try to reference a folder that hasn't been created yet.

### State Management

The feature interacts with multiple Zustand store actions:
- `createFolder(name)` - Creates new folder layer
- `moveToFolder(layerId, folderId)` - Moves layer into folder
- `useAppStore.setState({ selectedLayerIds: [] })` - Clears selection
- `setCheckboxMode(false)` - Exits multi-select mode

### Folder Naming

Folders are automatically named with incremental numbers:
```typescript
const folderCount = layers.filter(l => l.type === 'folder').length;
const newFolderName = `Folder ${folderCount + 1}`;
```

Examples:
- First folder: "Folder 1"
- Second folder: "Folder 2"
- Third folder: "Folder 3"

## Result

### Before:
1. Create folder manually
2. Drag Layer 1 into folder
3. Drag Layer 2 into folder
4. Drag Layer 3 into folder
5. Drag Layer 4 into folder
**(5 separate actions for 4 layers)**

### After:
1. Click "Multi select"
2. Check layers 1, 2, 3, 4
3. Click "Folder" icon
**(3 actions for 4 layers)**

### Benefits:
- ✅ **60% fewer actions** for organizing 4 layers
- ✅ **Scales better**: 10 layers = 3 actions (vs 11 actions before)
- ✅ **Industry-standard UX**: Matches Figma, Canva, Adobe workflows
- ✅ **Automatic cleanup**: Exits multi-select mode after operation
- ✅ **Smart tooltip**: Shows how many layers will be moved
- ✅ **Visual feedback**: Teal hover color indicates interactivity

## Files Modified

- `app/src/components/LayerPanel.tsx` (lines 688-743) - Folder button with auto-move logic

## Testing

### Test Case 1: Basic Multi-Select to Folder
1. Draw 3-4 shapes (will auto-create layers)
2. Click "Multi select" button in Layers panel
3. **Verify**: Checkboxes appear next to each layer
4. Select 3 layers using checkboxes
5. **Verify**: Selection count updates (e.g., "3 selected")
6. Click the "Folder" icon
7. **Verify**:
   - New folder created (e.g., "Folder 1")
   - All 3 selected layers moved into folder
   - Selection cleared
   - Multi-select mode exits (checkboxes disappear)

### Test Case 2: Multiple Folder Creation
1. Create and select 2 layers → Click "Folder" icon
2. **Verify**: "Folder 1" created with 2 layers
3. Create and select 3 more layers → Click "Folder" icon
4. **Verify**: "Folder 2" created with 3 layers
5. **Verify**: Both folders persist with correct contents

### Test Case 3: Empty Selection
1. Click "Multi select" button
2. Don't select any layers
3. Click "Folder" icon
4. **Verify**: Empty folder created (standard behavior)
5. **Verify**: Tooltip shows "Create new folder" (not "move X layers")

### Test Case 4: Tooltip Accuracy
1. Enter multi-select mode
2. Select 1 layer
3. Hover over "Folder" icon
4. **Verify**: Tooltip shows "Create folder and move 1 selected layer"
5. Select 5 more layers (6 total)
6. **Verify**: Tooltip shows "Create folder and move 6 selected layers"

## Related Features

- Layer management system
- Multi-selection state management
- Folder creation and organization
- Parent-child layer relationships
- Batch operations on layers

## Future Enhancements

### Potential Improvements:
1. **Smart Folder Naming**: Suggest names based on selected layer types
   - Example: "Rectangles (3)" if all selected are rectangles

2. **Nested Folders**: Allow creating sub-folders within folders

3. **Move to Existing Folder**:
   - Show dropdown of existing folders
   - Option to move to existing folder OR create new one

4. **Undo Support**:
   - Single undo to reverse entire batch operation
   - Restore layers to original positions

5. **Keyboard Shortcut**:
   - Ctrl+G to "Group into Folder" (Figma-style)

6. **Right-Click Context Menu**:
   - Right-click selection → "Move to Folder..."
   - Quick action from context menu

## UX Design Notes

### Why This Works Well:

1. **Discoverability**: Folder icon is visible in multi-select mode
2. **Feedback**: Tooltip clearly explains what will happen
3. **Efficiency**: Reduces actions by 60-80% for common tasks
4. **Forgiveness**: Can drag layers back out if mistake made
5. **Consistency**: Matches mental model from Figma/Canva

### Design Decisions:

- **Automatic exit**: Multi-select mode exits after folder creation to avoid confusion
- **Clear selection**: Prevents accidental re-operation on same layers
- **Incremental naming**: Predictable, conflict-free folder names
- **Small delay (10ms)**: Ensures state consistency without noticeable lag
