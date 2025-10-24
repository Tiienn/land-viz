# Multi-Line Text Inline Editing Fix

**Date**: January 25, 2025
**Status**: ✅ Fixed
**Severity**: High - Core text editing functionality broken

## Table of Contents
- [Issues Fixed](#issues-fixed)
- [Root Causes](#root-causes)
- [Solutions](#solutions)
- [Technical Implementation](#technical-implementation)
- [Files Modified](#files-modified)
- [How It Works](#how-it-works)
- [Testing](#testing)
- [Future Prevention](#future-prevention)

---

## Issues Fixed

### Issue #1: Multi-line text collapses to single line in inline editor
**User Report**: "I create a text with 2 lines, when I double click on the text to modify, the 2 lines text become only 1 line text"

**Symptoms**:
- Create text with 2 lines using Shift+Enter in Properties Panel ✓
- Text displays correctly on canvas with 2 lines ✓
- Double-click text to edit inline
- **BUG**: Text shows as single line in inline editor (newlines disappeared)

### Issue #2: Text renders vertically in 2D mode (first attempted fix)
**Symptoms**:
- After fixing whiteSpace from `nowrap` to `pre-wrap`
- Each letter rendered on its own line (vertical text)
- Caused by narrow div width with `pre-wrap` + `maxWidth: none`

### Issue #3: Cursor doesn't move down when pressing Shift+Enter
**User Report**: "When I shift+enter in the text on the canva. Its adding a new line but the caret cursor is not going down. It stay at last text insert."

**Symptoms**:
- Press Shift+Enter in inline editor
- Browser correctly inserts `<br>` tag
- Cursor position restored to previous location (doesn't move down)
- New line created but cursor stays on old line

---

## Root Causes

### Root Cause #1: Wrong whiteSpace CSS property
**Location**: `RichTextEditor.tsx:237`

```typescript
// BEFORE (BROKEN):
whiteSpace: is2DMode ? 'nowrap' as const : 'pre-wrap' as const,
```

**Problem**: Using `whiteSpace: nowrap` in 2D mode collapses all newline characters (`\n`) into spaces, treating them as whitespace to be collapsed.

**Why this happened**: The code was trying to prevent text wrapping in 2D mode, but `nowrap` has the side effect of collapsing newlines.

### Root Cause #2: Missing newline-to-BR conversion
**Location**: `RichTextEditor.tsx:268`

```typescript
// BEFORE (BROKEN):
dangerouslySetInnerHTML: { __html: initialContent }
```

**Problem**: In 2D mode with `nowrap`, plain `\n` characters are ignored by the browser. HTML requires `<br>` tags for line breaks when using `nowrap`.

**Data Format Issue**: Text is stored with `\n` characters but displayed in HTML which needs `<br>` tags in 2D mode.

### Root Cause #3: Unnecessary cursor save/restore on input
**Location**: `RichTextEditor.tsx:159-178`

```typescript
// BEFORE (BROKEN):
const handleInput = useCallback((e) => {
  const cursorPos = saveCursorPosition();  // Save cursor

  // Update content
  updateText(textId, { content: newContent });

  // Restore cursor (WRONG - interferes with natural cursor movement)
  requestAnimationFrame(() => {
    restoreCursorPosition(cursorPos);
  });
}, [/* deps */]);
```

**Problem**:
1. User presses Shift+Enter
2. Browser inserts `<br>` and moves cursor to new line (correct behavior)
3. `handleInput` fires
4. Cursor position is saved (captures OLD position before Shift+Enter)
5. Content is updated in store
6. Cursor is restored to OLD position (moves cursor back up)
7. Result: New line created but cursor doesn't move

**Why this logic existed**: It was copied from TextPropertiesPanel where cursor save/restore IS needed for external formatting changes (bold, italic, font size). But it's NOT needed for user typing.

---

## Solutions

### Solution #1: Bidirectional newline ↔ BR conversion

**Strategy**: Match the existing pattern from `TextObject.tsx`
- **Storage Format**: Always store text with `\n` newlines (consistent data format)
- **Display Format (2D mode)**: Convert `\n` → `<br>` for HTML rendering
- **Input Format (2D mode)**: Convert `<br>` → `\n` when saving user input

**Benefits**:
- Keeps data format consistent across entire app
- Works with existing TextObject rendering
- Allows `whiteSpace: nowrap` in 2D mode (prevents vertical wrapping)
- Properly displays line breaks using `<br>` tags

### Solution #2: Remove cursor save/restore during typing

**Strategy**: Let the browser handle cursor positioning naturally
- Browser's contentEditable maintains cursor position correctly during typing
- Only save/restore cursor for external formatting changes (handled separately in TextPropertiesPanel)
- Don't interfere with browser's natural behavior

**Benefits**:
- Shift+Enter works correctly (cursor moves down)
- All keyboard input works naturally
- Simpler code, fewer bugs

---

## Technical Implementation

### Fix #1: Content Conversion for Display

**File**: `app/src/components/Text/RichTextEditor.tsx:214-217`

```typescript
// Convert newlines to <br> tags for 2D mode (matches TextObject behavior)
const contentForDisplay = is2DMode
  ? initialContent.replace(/\n/g, '<br>')
  : initialContent;
```

**Why**: In 2D mode, HTML needs `<br>` tags for line breaks when using `whiteSpace: nowrap`.

### Fix #2: Use Converted Content in dangerouslySetInnerHTML

**File**: `app/src/components/Text/RichTextEditor.tsx:268`

```typescript
// BEFORE:
dangerouslySetInnerHTML: { __html: initialContent }

// AFTER:
dangerouslySetInnerHTML: { __html: contentForDisplay }
```

**Why**: Display the converted content (with `<br>` tags in 2D mode).

### Fix #3: Sync External Content Changes

**File**: `app/src/components/Text/RichTextEditor.tsx:148-153`

```typescript
// Only update if content actually changed and is different from current DOM
const contentToSet = is2DMode ? initialContent.replace(/\n/g, '<br>') : initialContent;
if (editorRef.current.innerHTML !== contentToSet) {
  editorRef.current.innerHTML = contentToSet;
}
}, [initialContent, hasInitialized, is2DMode]); // Added is2DMode dependency
```

**Why**:
- Convert content when syncing from external changes (Properties Panel formatting)
- Added `is2DMode` to dependencies to react to view mode changes

### Fix #4: Convert BR back to Newlines on Input

**File**: `app/src/components/Text/RichTextEditor.tsx:159-176`

```typescript
const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
  if (!textId) return;

  // Get content from editor
  let newContent = e.currentTarget.innerHTML;

  // In 2D mode, convert <br> tags back to \n for storage
  // This keeps data format consistent (stored as \n, displayed as <br> in 2D)
  if (is2DMode) {
    newContent = newContent.replace(/<br>/gi, '\n');
  }

  // Update content directly in store (no debounce)
  updateText(textId, { content: newContent });
  onContentChange(newContent);

  // NOTE: No cursor save/restore needed during typing!
  // The browser naturally maintains cursor position in contentEditable.
  // Cursor save/restore is only needed for external formatting changes
  // (handled by TextPropertiesPanel's applyFormatting function).
}, [textId, updateText, onContentChange, is2DMode]);
```

**Key Changes**:
1. Convert `<br>` → `\n` when saving (keeps storage format consistent)
2. Removed `saveCursorPosition()` call
3. Removed `restoreCursorPosition()` call
4. Added explanatory comment about cursor management

**Why**:
- Bidirectional conversion maintains data consistency
- Let browser handle cursor naturally during typing
- Cursor save/restore only needed for external formatting (TextPropertiesPanel)

---

## Files Modified

### 1. `app/src/components/Text/RichTextEditor.tsx`

**Lines Modified**: 110-114 (removed debug logs), 148-176 (content conversion + cursor fix), 214-217 (display conversion), 268 (use converted content)

**Changes**:
- Added `contentForDisplay` conversion (lines 214-217)
- Updated `dangerouslySetInnerHTML` to use converted content (line 268)
- Updated useEffect to convert content for external sync (lines 148-153)
- Removed cursor save/restore from `handleInput` (lines 159-176)
- Added BR → newline conversion in `handleInput` (line 165)
- Removed debug console logs (lines 110-114)

### 2. `app/src/components/Text/TextRenderer.tsx`

**Lines Modified**: 119-121 (removed debug logs)

**Changes**:
- Removed debug console logs that tracked content format

### 3. `app/src/store/useTextStore.ts`

**Lines Modified**: 143-145 (removed debug logs)

**Changes**:
- Removed debug console logs from `startInlineEdit` function

### 4. `app/src/components/Text/InlineTextEditor.tsx`

**Lines Modified**: 230 (whiteSpace change)

**Changes**:
- Changed `whiteSpace` from conditional to always `pre-wrap`
- **NOTE**: This file is NOT currently used (TextRenderer uses RichTextEditor)
- Changed for consistency but doesn't affect current functionality

---

## How It Works

### Data Flow: Creating Multi-line Text

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User types in Properties Panel textarea                  │
│    - Press Shift+Enter to create line break                 │
│    - Textarea stores: "line1\nline2"                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Saved to useTextStore                                    │
│    - Storage format: "line1\nline2" (plain newlines)        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TextObject renders on canvas                             │
│    - 2D Mode: Convert \n → <br> for display                 │
│    - innerHTML: "line1<br>line2"                            │
│    - whiteSpace: nowrap (horizontal text)                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Inline Editing Multi-line Text

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User double-clicks text on canvas                        │
│    - TextRenderer.handleDoubleClick fires                   │
│    - startInlineEdit(textId, position, "line1\nline2")      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. RichTextEditor receives initialContent                   │
│    - Prop: initialContent = "line1\nline2"                  │
│    - 2D Mode: Convert for display                           │
│    - contentForDisplay = "line1<br>line2"                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Render contentEditable div                               │
│    - dangerouslySetInnerHTML: "line1<br>line2"              │
│    - whiteSpace: nowrap (prevents vertical wrapping)        │
│    - Display: Two horizontal lines ✓                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. User types / presses Shift+Enter                         │
│    - Browser maintains cursor position naturally            │
│    - Shift+Enter inserts <br> and moves cursor down ✓       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. handleInput fires                                        │
│    - Read: innerHTML = "line1<br>line2<br>line3"            │
│    - 2D Mode: Convert <br> → \n                             │
│    - Save: "line1\nline2\nline3"                            │
│    - NO cursor save/restore (browser maintains position) ✓  │
└─────────────────────────────────────────────────────────────┘
```

### Why This Pattern Works

**Principle**: Separate storage format from display format

| Context | Format | Why |
|---------|--------|-----|
| **Storage** (useTextStore) | `\n` | Consistent data format, works everywhere |
| **Properties Panel** | `\n` | Native textarea behavior |
| **Canvas Display (2D)** | `<br>` | HTML line breaks with `nowrap` |
| **Canvas Display (3D)** | `\n` | `pre-wrap` preserves newlines naturally |
| **Inline Editor (2D)** | `<br>` | Matches display format, converts on save |
| **Inline Editor (3D)** | `\n` | `pre-wrap` preserves newlines naturally |

**Benefits**:
- Single source of truth (`\n` in storage)
- Each rendering context uses appropriate format
- Bidirectional conversion maintains consistency
- Browser behavior not interfered with

---

## Testing

### Test Scenario #1: Create Multi-line Text
1. ✅ Create text in Properties Panel
2. ✅ Press Shift+Enter to add line break
3. ✅ Text displays with 2 lines on canvas
4. ✅ Double-click to edit inline
5. ✅ **VERIFY**: Text shows 2 lines in editor (not collapsed to 1)

### Test Scenario #2: Edit Multi-line Text with Shift+Enter
1. ✅ Double-click existing 2-line text
2. ✅ Press Shift+Enter to add another line
3. ✅ **VERIFY**: Cursor moves down to new line (doesn't stay on old line)
4. ✅ Type text on new line
5. ✅ Press Enter to finish editing
6. ✅ **VERIFY**: Text displays 3 lines correctly

### Test Scenario #3: Switch Between 2D and 3D Modes
1. ✅ Create multi-line text in 2D mode
2. ✅ Switch to 3D mode
3. ✅ **VERIFY**: Text still shows multiple lines
4. ✅ Double-click to edit in 3D mode
5. ✅ **VERIFY**: Editor shows multiple lines
6. ✅ Switch back to 2D mode
7. ✅ **VERIFY**: Text still shows multiple lines

### Test Scenario #4: Properties Panel Integration
1. ✅ Create multi-line text
2. ✅ Double-click to edit inline
3. ✅ Open Properties Panel
4. ✅ Change font size/color/bold
5. ✅ **VERIFY**: Formatting applies, lines preserved
6. ✅ **VERIFY**: Cursor position maintained

---

## Future Prevention

### ⚠️ Important Rules for Text Editing

1. **NEVER interfere with browser cursor during typing**
   - `saveCursorPosition()` / `restoreCursorPosition()` only for external changes
   - Let contentEditable maintain cursor naturally during user input
   - Only override when you're changing content from outside (formatting buttons)

2. **Always use bidirectional conversion in 2D mode**
   - Display: `\n` → `<br>` (for HTML rendering)
   - Save: `<br>` → `\n` (for storage)
   - This maintains data format consistency

3. **Match TextObject's rendering pattern**
   - TextObject already has correct 2D/3D handling
   - RichTextEditor should match its behavior
   - Same `whiteSpace` rules, same conversion logic

4. **Test both 2D and 3D modes**
   - Text rendering differs between modes
   - `nowrap` in 2D, `pre-wrap` in 3D
   - Always test mode switching

5. **Keep storage format simple**
   - Always use `\n` for newlines in storage
   - Never store `<br>` tags in the data model
   - Convert only for display purposes

### Debug Checklist (If Issues Recur)

If multi-line text breaks again, check these areas:

**1. Data Format**
```typescript
// ✓ CORRECT: Storage uses \n
{ content: "line1\nline2" }

// ✗ WRONG: Storage uses <br>
{ content: "line1<br>line2" }
```

**2. Display Conversion**
```typescript
// ✓ CORRECT: Convert for display in 2D
const display = is2DMode ? content.replace(/\n/g, '<br>') : content;

// ✗ WRONG: No conversion
const display = content; // Newlines won't show in 2D with nowrap
```

**3. Input Handling**
```typescript
// ✓ CORRECT: No cursor interference
const handleInput = (e) => {
  const newContent = e.currentTarget.innerHTML;
  updateStore(newContent);
  // Browser maintains cursor naturally
};

// ✗ WRONG: Saving and restoring cursor during typing
const handleInput = (e) => {
  const pos = saveCursor(); // DON'T DO THIS
  updateStore(newContent);
  restoreCursor(pos); // BREAKS Shift+Enter
};
```

**4. CSS whiteSpace**
```typescript
// ✓ CORRECT: nowrap in 2D (with BR conversion)
whiteSpace: is2DMode ? 'nowrap' : 'pre-wrap'

// ✗ WRONG: nowrap without BR conversion
whiteSpace: 'nowrap' // Collapses newlines without <br> tags
```

---

## Related Documentation

- **Text Properties Panel Sync Fix**: `docs/fixes/TEXT_PROPERTIES_PANEL_SYNC_FIX.md`
- **Text Object Component**: `app/src/components/Text/TextObject.tsx`
- **Rich Text Editor Component**: `app/src/components/Text/RichTextEditor.tsx`
- **Text Store**: `app/src/store/useTextStore.ts`

---

## Summary

**Problem**: Multi-line text collapsed to single line in inline editor, cursor didn't move on Shift+Enter

**Root Causes**:
1. Wrong CSS `whiteSpace` property (nowrap collapses newlines)
2. Missing newline → `<br>` conversion for HTML display
3. Unnecessary cursor save/restore during typing

**Solution**:
1. Bidirectional conversion: `\n` ↔ `<br>` in 2D mode
2. Remove cursor interference during typing
3. Match TextObject's proven rendering pattern

**Result**: ✅ Multi-line text works perfectly in inline editor, cursor moves naturally

**Key Principle**: Separate storage format (`\n`) from display format (`<br>` in 2D), let browser handle cursor during typing.
