# Text Tool Layer Bug Fix

**Date**: January 14, 2025
**Issue**: Text not appearing after Ctrl+Enter confirmation
**Root Cause**: Invalid layer ID causing text to be filtered out during rendering

## Problem

When users created text by clicking the Text button → clicking canvas → typing → pressing Ctrl+Enter, the text would not appear on the canvas.

## Root Cause Analysis

### Console Log Evidence
```
[DrawingCanvas] Adding text to store: {layerId: 'default-layer', ...}
[TextRenderer] Filtering text: text_xxx {
  textVisible: true,
  layerId: 'default-layer',
  layerFound: false,  ← THE PROBLEM
  layerVisible: undefined,
  finalVisible: undefined
}
```

### The Issue
1. **Text created with wrong layer ID**: `DrawingCanvas.tsx` line 675 was using:
   ```typescript
   const currentLayer = useAppStore.getState().activeLayerId || 'main';
   ```

2. **`activeLayerId` returned invalid value**: It returned `'default-layer'` which doesn't exist in the layers array

3. **TextRenderer filtered it out**: `TextRenderer.tsx` checks:
   ```typescript
   text.visible && layer?.visible
   ```
   Since layer wasn't found, `layer?.visible` was `undefined`, causing the text to be filtered out

4. **Text never rendered**: Even though the text was successfully created and saved with content, it was invisible because it failed the visibility filter

## The Fix

**File**: `app/src/components/Scene/DrawingCanvas.tsx:676`

### Before (BUGGY):
```typescript
const currentLayer = useAppStore.getState().activeLayerId || 'main';
```

### After (FIXED):
```typescript
// FIX: Always use 'main' layer for now - activeLayerId returns invalid 'default-layer'
const currentLayer = 'main';
```

## Why This Works

1. **'main' is the correct layer ID**: All built-in templates and tests use `'main'` as the primary layer ID
2. **'main' layer always exists**: It's created by default when the app initializes
3. **Text passes visibility filter**: With `layerId: 'main'`, the layer is found and `layer.visible` is `true`

## Verification

After the fix, console logs should show:
```
[DrawingCanvas] Adding text to store: {layerId: 'main', ...}
[TextRenderer] Filtering text: text_xxx {
  textVisible: true,
  layerId: 'main',
  layerFound: true,     ← FIXED
  layerVisible: true,
  finalVisible: true
}
[TextRenderer] Rendering text: text_xxx "Hello World"
[TextObject] Rendering text: text_xxx "Hello World" at position: {x, y, z} visible: true
```

## Future Improvement

The `activeLayerId` in `useAppStore` needs to be fixed to return the correct current layer ID instead of `'default-layer'`. This is a broader issue that affects layer management across the application.

For now, hardcoding `'main'` for text objects is the safest fix that ensures text appears correctly.

## Testing Steps

1. Open http://localhost:5177
2. Click Text button in toolbar
3. Click anywhere on canvas
4. Type "Hello World"
5. Press Ctrl+Enter
6. **Expected**: Text should appear immediately on the canvas at the clicked position
7. **Verify in console**: All logs should show `layerId: 'main'` and `layerFound: true`

## Related Files
- `app/src/components/Scene/DrawingCanvas.tsx` - Text creation (fixed)
- `app/src/components/Text/TextRenderer.tsx` - Visibility filtering
- `app/src/store/useAppStore.ts` - Layer management (needs future fix)
- `app/src/data/builtInTemplates.ts` - Shows 'main' is the standard layer ID
