# Dimension Text Overlay Fix Pattern

**Issue Date**: January 2025
**Status**: ✅ Resolved
**Severity**: P1 - High (UX issue affecting all modals and dropdowns)

---

## Problem Description

### The Issue
Dimension text labels (rendered via drei's `<Html>` component) were appearing **above** UI modals and dropdowns, creating visual conflicts and poor UX.

### Root Cause
The drei `<Html>` component (from `@react-three/drei`) renders content in a **separate WebGL overlay layer** that exists outside the normal DOM stacking context. This means:

- **Normal CSS z-index has NO EFFECT** on drei Html components
- Even with `zIndex: 999999` on modals, dimension text (at `zIndex: 1`) appears on top
- The WebGL overlay layer is independent of DOM z-index stacking

### Visual Example
```
User clicks Flip button
  ↓
Dropdown appears (z-index: 9999)
  ↓
Dimension text "61.0m" still visible ABOVE dropdown ❌
  ↓
Poor user experience - text blocks dropdown options
```

---

## Solution: Data Attribute Pattern

### Overview
Instead of fighting z-index, we **hide dimension text entirely** when modals/dropdowns are open using a data attribute detection system.

### Implementation Pattern

#### Step 1: Set Data Attribute When Overlay Opens

Add this to ANY component that should hide dimensions (modals, dropdowns, popovers):

```typescript
import { useEffect } from 'react';

export const YourModal = ({ isOpen, onClose }) => {
  // Set data attribute to hide ShapeDimensions when open
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-modal-open', 'true');
      // Or use 'data-dropdown-open' for dropdowns
    } else {
      document.body.removeAttribute('data-modal-open');
    }

    return () => {
      document.body.removeAttribute('data-modal-open');
    };
  }, [isOpen]);

  // ... rest of modal code
};
```

#### Step 2: ShapeDimensions Automatically Detects and Hides

The `ShapeDimensions.tsx` component already checks for these attributes:

```typescript
// app/src/components/Scene/ShapeDimensions.tsx:45-50
const checkModal = () => {
  const isOpen = document.body.hasAttribute('data-keyboard-help-open') ||
                 document.body.hasAttribute('data-modal-open') ||
                 document.body.hasAttribute('data-dropdown-open');
  setIsModalOpen(isOpen);
};
```

When any attribute is detected, ShapeDimensions returns `null` (line 318):
```typescript
if (isModalOpen) return null;
```

---

## Implemented Fixes

### Files Modified (January 2025)

| File | Attribute Used | Lines |
|------|---------------|-------|
| `ShapeDimensions.tsx` | Detection logic | 45-50, 318 |
| `InsertAreaModal.tsx` | `data-modal-open` | 24-35 |
| `AddAreaModal.tsx` | `data-modal-open` | 56-67 |
| `PresetsModal.tsx` | `data-modal-open` | 63-74 |
| `ImageImporterModal.tsx` | `data-modal-open` | 90-101 |
| `FlipButton.tsx` | `data-dropdown-open` | 14-25 |
| `KeyboardShortcutHelp.tsx` | `data-keyboard-help-open` | 40-46 (existing) |

---

## How to Apply to New Features

### For New Modals

```typescript
export const NewFeatureModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-modal-open');
    }
    return () => document.body.removeAttribute('data-modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ zIndex: 999999, /* ... */ }}>
      {/* Modal content */}
    </div>
  );
};
```

### For New Dropdowns

```typescript
export const NewDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-dropdown-open', 'true');
    } else {
      document.body.removeAttribute('data-dropdown-open');
    }
    return () => document.body.removeAttribute('data-dropdown-open');
  }, [isOpen]);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <div style={{ position: 'absolute', zIndex: 9999 }}>
          {/* Dropdown content */}
        </div>
      )}
    </div>
  );
};
```

### For New Context Menus

```typescript
export const NewContextMenu = ({ isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      document.body.setAttribute('data-dropdown-open', 'true');
    } else {
      document.body.removeAttribute('data-dropdown-open');
    }
    return () => document.body.removeAttribute('data-dropdown-open');
  }, [isVisible]);

  if (!isVisible) return null;
  // ... render menu
};
```

---

## Adding New Detection Attributes

If you need a **new type** of overlay (e.g., tooltips, popovers):

### 1. Choose an Attribute Name
```typescript
// For tooltips:
document.body.setAttribute('data-tooltip-open', 'true');

// For popovers:
document.body.setAttribute('data-popover-open', 'true');
```

### 2. Update ShapeDimensions Detection

Edit `app/src/components/Scene/ShapeDimensions.tsx:45-50`:

```typescript
const checkModal = () => {
  const isOpen = document.body.hasAttribute('data-keyboard-help-open') ||
                 document.body.hasAttribute('data-modal-open') ||
                 document.body.hasAttribute('data-dropdown-open') ||
                 document.body.hasAttribute('data-tooltip-open') ||      // NEW
                 document.body.hasAttribute('data-popover-open');        // NEW
  setIsModalOpen(isOpen);
};
```

---

## Testing Checklist

When implementing this pattern for a new component:

- [ ] Component sets data attribute when opening
- [ ] Component removes data attribute when closing
- [ ] Component cleans up attribute in useEffect return (cleanup function)
- [ ] Dimension text disappears when component opens
- [ ] Dimension text reappears when component closes
- [ ] Test with multiple shapes with dimensions visible
- [ ] Test rapid open/close cycles
- [ ] Test ESC key / click-outside-to-close behavior

---

## Why This Works

### The Flow

1. **User opens overlay** (modal/dropdown) → Component sets `data-*-open="true"` on `<body>`
2. **ShapeDimensions detects attribute** → Polling interval (50ms) checks for attributes
3. **ShapeDimensions hides** → Returns `null`, removing all dimension labels from scene
4. **User closes overlay** → Component removes attribute from `<body>`
5. **ShapeDimensions shows again** → No attributes detected, renders normally

### Why Not Z-Index?

```typescript
// ❌ THIS DOES NOT WORK - Drei Html ignores DOM z-index
<Html style={{ zIndex: 1 }}>
  <div>61.0m</div>
</Html>

// ❌ THIS ALSO DOESN'T WORK - Modal z-index can't compete
<div style={{ zIndex: 999999 }}>
  <Modal />
</div>

// ✅ THIS WORKS - Hide dimensions when overlay is open
if (isModalOpen) return null;
```

---

## Performance Considerations

### Polling Interval
- ShapeDimensions checks attributes every **50ms**
- This is acceptable because:
  - Only runs when component is mounted
  - Simple attribute check (very fast)
  - Only affects dimension rendering (not critical path)
  - 50ms = imperceptible to users (< 1 frame at 60fps = 16.67ms)

### Alternative Approaches Considered

1. **Event-based system** - More complex, requires global event bus
2. **Zustand store** - Overkill for simple boolean flag
3. **Context API** - Requires wrapping entire app, affects all renders
4. **Portal z-index hack** - Doesn't work with WebGL overlay

**Conclusion**: Data attribute + polling is the simplest and most reliable solution.

---

## Related Issues

- **Flip Button Dropdown Fix** (January 2025) - Dimension text above dropdown
- **Import Plan Modal Fix** (January 2025) - Dimension text above modal
- **Keyboard Shortcuts Modal** (Original implementation) - First use of this pattern

---

## Code References

### Primary Implementation
- `app/src/components/Scene/ShapeDimensions.tsx` - Detection logic
- `app/src/components/UI/FlipButton.tsx` - Dropdown example
- `app/src/components/InsertArea/InsertAreaModal.tsx` - Modal example

### Pattern Origin
- `app/src/components/KeyboardShortcutHelp.tsx:40-46` - Original pattern

---

## Future Improvements

### Potential Enhancements
1. **Single attribute**: Could consolidate to just `data-overlay-open` instead of multiple attributes
2. **Ref-based solution**: Use refs to directly communicate between components (more complex)
3. **Drei layer control**: Investigate if drei provides built-in overlay layer control (unlikely)

### When to Use This Pattern
✅ **Use for**:
- Modals (full-screen overlays)
- Dropdowns (small menus)
- Context menus
- Popovers
- Tooltips (if they block dimensions)
- Any UI overlay that should appear above 3D scene overlays

❌ **Don't use for**:
- Regular buttons
- Input fields
- Sidebars (they're positioned outside 3D scene)
- Panels (they're positioned outside 3D scene)

---

## Quick Reference

```typescript
// Copy-paste template for new overlays
useEffect(() => {
  if (isOpen) {
    document.body.setAttribute('data-modal-open', 'true'); // or data-dropdown-open
  } else {
    document.body.removeAttribute('data-modal-open');
  }
  return () => document.body.removeAttribute('data-modal-open');
}, [isOpen]);
```

---

**Document Version**: 1.0
**Last Updated**: January 12, 2025
**Author**: Development Team
**Review Status**: Approved ✅
