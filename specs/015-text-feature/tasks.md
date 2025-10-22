# Text Feature - Task Breakdown

**Spec ID:** 015
**Feature:** Text Annotations and Shape Labels
**Version:** 1.0
**Date:** January 12, 2025

## Prerequisites Checklist

Before starting implementation:

- [ ] Specification reviewed and approved (`spec.md`)
- [ ] Implementation plan reviewed (`plan.md`)
- [ ] Development environment running (`npm run dev`)
- [ ] All tests passing (`npm test`)
- [ ] Git branch created (`feature/text-annotations`)
- [ ] Constitution reviewed (`memory/constitution.md`)

## Quick Test Commands

```bash
# Development
npm run dev           # Start dev server (http://localhost:5173)

# Quality Checks
npm run lint          # Run ESLint
npm run type-check    # TypeScript validation
npm run build         # Production build

# Testing
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:coverage # Coverage report
```

---

## Phase 1: Foundation (4-6 hours)

### Task 1.1: Create Type Definitions
**File:** `app/src/types/text.ts`
**Estimated Time:** 45 minutes

- [ ] Create TextObject interface
- [ ] Define TextType enum ('floating' | 'label')
- [ ] Define TextAlignment type
- [ ] Create TextPosition interface
- [ ] Create TextStyle interface
- [ ] Add JSDoc comments
- [ ] Export all types

```typescript
// app/src/types/text.ts
export type TextType = 'floating' | 'label';
export type TextAlignment = 'left' | 'center' | 'right';

export interface TextPosition {
  x: number;
  y: number;
  z: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: TextAlignment;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  backgroundOpacity: number;
  rotation: number;
}

export interface TextObject {
  id: string;
  type: TextType;
  content: string;
  position: TextPosition;
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: TextAlignment;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  backgroundOpacity: number;
  rotation: number;
  attachedToShapeId?: string;
  offset?: { x: number; y: number };
  layerId: string;
  locked: boolean;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}
```

**Validation:**
- [ ] TypeScript compiles without errors
- [ ] All types exported correctly

---

### Task 1.2: Create Zustand Text Store
**File:** `app/src/store/useTextStore.ts`
**Estimated Time:** 90 minutes

- [ ] Create useTextStore with Zustand
- [ ] Add texts array state
- [ ] Add selectedTextId state
- [ ] Create addText action
- [ ] Create updateText action
- [ ] Create deleteText action
- [ ] Create selectText action
- [ ] Create updateTextPosition action
- [ ] Create updateTextRotation action
- [ ] Add getTextById selector
- [ ] Add getTextsByLayer selector
- [ ] Add JSDoc comments

```typescript
// app/src/store/useTextStore.ts
import { create } from 'zustand';
import { TextObject } from '../types/text';

interface TextStore {
  texts: TextObject[];
  selectedTextId: string | null;

  // Actions
  addText: (text: TextObject) => void;
  updateText: (id: string, updates: Partial<TextObject>) => void;
  deleteText: (id: string) => void;
  selectText: (id: string | null) => void;
  updateTextPosition: (id: string, position: { x: number; y: number; z: number }) => void;
  updateTextRotation: (id: string, rotation: number) => void;

  // Selectors
  getTextById: (id: string) => TextObject | undefined;
  getTextsByLayer: (layerId: string) => TextObject[];
}

export const useTextStore = create<TextStore>((set, get) => ({
  texts: [],
  selectedTextId: null,

  addText: (text) => set((state) => ({
    texts: [...state.texts, text]
  })),

  updateText: (id, updates) => set((state) => ({
    texts: state.texts.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
    )
  })),

  deleteText: (id) => set((state) => ({
    texts: state.texts.filter(t => t.id !== id),
    selectedTextId: state.selectedTextId === id ? null : state.selectedTextId
  })),

  selectText: (id) => set({ selectedTextId: id }),

  updateTextPosition: (id, position) => set((state) => ({
    texts: state.texts.map(t =>
      t.id === id ? { ...t, position, updatedAt: Date.now() } : t
    )
  })),

  updateTextRotation: (id, rotation) => set((state) => ({
    texts: state.texts.map(t =>
      t.id === id ? { ...t, rotation, updatedAt: Date.now() } : t
    )
  })),

  getTextById: (id) => get().texts.find(t => t.id === id),

  getTextsByLayer: (layerId) => get().texts.filter(t => t.layerId === layerId)
}));
```

**Validation:**
- [ ] Store creates without errors
- [ ] All actions work correctly
- [ ] Selectors return expected values
- [ ] TypeScript types are correct

---

### Task 1.3: Add Google Fonts to index.html
**File:** `app/index.html`
**Estimated Time:** 20 minutes

- [ ] Add preconnect to fonts.googleapis.com
- [ ] Add preconnect to fonts.gstatic.com
- [ ] Add link to Google Fonts stylesheet
- [ ] Include all 6 fonts (Nunito Sans, Roboto, Open Sans, Montserrat, Lato, Courier New)
- [ ] Use display=swap for performance

```html
<!-- app/index.html -->
<!-- Add in <head> section -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
```

**Validation:**
- [ ] Fonts load in browser
- [ ] No console errors
- [ ] Network tab shows font requests

---

### Task 1.4: Create Text Utilities
**File:** `app/src/utils/textUtils.ts`
**Estimated Time:** 60 minutes

- [ ] Create calculateLabelPosition function
- [ ] Create rotateVector function
- [ ] Create generateTextId function
- [ ] Create validateTextContent function
- [ ] Create createDefaultTextObject function
- [ ] Add unit tests

```typescript
// app/src/utils/textUtils.ts
import { TextObject, TextPosition } from '../types/text';

/**
 * Calculate label position based on shape position, rotation, and offset
 */
export function calculateLabelPosition(
  shapeCenter: { x: number; y: number },
  shapeRotation: number,
  offset: { x: number; y: number }
): TextPosition {
  const rotatedOffset = rotateVector(offset, shapeRotation);
  return {
    x: shapeCenter.x + rotatedOffset.x,
    y: shapeCenter.y + rotatedOffset.y,
    z: 0.1 // Above grid
  };
}

/**
 * Rotate a 2D vector by angle in degrees
 */
export function rotateVector(
  vector: { x: number; y: number },
  angleDegrees: number
): { x: number; y: number } {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos
  };
}

/**
 * Generate unique text ID
 */
export function generateTextId(): string {
  return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate text content
 */
export function validateTextContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (content.length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }
  if (content.length > 500) {
    return { valid: false, error: 'Text exceeds 500 character limit' };
  }
  return { valid: true };
}

/**
 * Create default text object
 */
export function createDefaultTextObject(
  position: TextPosition,
  layerId: string,
  type: 'floating' | 'label' = 'floating'
): Omit<TextObject, 'id' | 'content'> {
  return {
    type,
    position,
    fontFamily: 'Nunito Sans',
    fontSize: 18,
    color: '#000000',
    alignment: 'center',
    letterSpacing: 0,
    lineHeight: 1.5,
    backgroundOpacity: 100,
    rotation: 0,
    layerId,
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}
```

**Validation:**
- [ ] All functions work correctly
- [ ] Unit tests pass
- [ ] Edge cases handled

---

## Phase 2: Text Creation Modal (5-7 hours)

### Task 2.1: Create TextModal Component Structure
**File:** `app/src/components/Text/TextModal.tsx`
**Estimated Time:** 90 minutes

- [ ] Create TextModal functional component
- [ ] Add modal backdrop with semi-transparent black
- [ ] Add modal container with white background
- [ ] Add close button (X) in top-right
- [ ] Implement fade-in animation (200ms)
- [ ] Apply data-modal-open pattern for dimension overlay fix
- [ ] Add ESC key handler to close
- [ ] Use inline styles (no CSS files)

```typescript
// app/src/components/Text/TextModal.tsx
import React, { useEffect, useState } from 'react';
import { TextObject } from '../../types/text';

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (textData: Partial<TextObject>) => void;
  initialData?: TextObject;
  mode: 'create' | 'edit';
  isLabel?: boolean;
}

export const TextModal: React.FC<TextModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
  isLabel = false
}) => {
  const [content, setContent] = useState(initialData?.content || '');
  const [fontFamily, setFontFamily] = useState(initialData?.fontFamily || 'Nunito Sans');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 18);
  const [color, setColor] = useState(initialData?.color || '#000000');
  const [alignment, setAlignment] = useState(initialData?.alignment || 'center');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced options
  const [letterSpacing, setLetterSpacing] = useState(initialData?.letterSpacing || 0);
  const [lineHeight, setLineHeight] = useState(initialData?.lineHeight || 1.5);
  const [hasBackground, setHasBackground] = useState(!!initialData?.backgroundColor);
  const [backgroundColor, setBackgroundColor] = useState(initialData?.backgroundColor || '#FFFFFF');
  const [backgroundOpacity, setBackgroundOpacity] = useState(initialData?.backgroundOpacity || 100);
  const [rotation, setRotation] = useState(initialData?.rotation || 0);

  // Apply data-modal-open pattern
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-modal-open');
    }
    return () => document.body.removeAttribute('data-modal-open');
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Validation
    if (content.length === 0 || content.length > 500) return;

    const textData: Partial<TextObject> = {
      content,
      fontFamily,
      fontSize,
      color,
      alignment,
      letterSpacing,
      lineHeight,
      backgroundColor: hasBackground ? backgroundColor : undefined,
      backgroundOpacity,
      rotation
    };

    onSave(textData);
    onClose();
  };

  const title = mode === 'create'
    ? (isLabel ? 'Add Label to Shape' : 'Add Text')
    : 'Edit Text';
  const buttonText = mode === 'create' ? 'Add Text' : 'Update Text';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 200ms ease-out'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        width: '450px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              color: '#6B7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Form content will be added in next task */}
        <div>
          {/* TODO: Add form fields */}
        </div>
      </div>
    </div>
  );
};
```

**Validation:**
- [ ] Modal renders correctly
- [ ] Backdrop is semi-transparent
- [ ] Close button works
- [ ] ESC key closes modal
- [ ] data-modal-open attribute applied

---

### Task 2.2: Add Modal Form Fields
**File:** `app/src/components/Text/TextModal.tsx` (continued)
**Estimated Time:** 120 minutes

- [ ] Add text content textarea
- [ ] Add character counter (0 / 500)
- [ ] Add font family dropdown
- [ ] Add font size slider + manual input
- [ ] Add color picker
- [ ] Add alignment buttons (L/C/R)
- [ ] Add validation highlighting
- [ ] Style all inputs consistently

```typescript
// Add to TextModal component body (replace TODO comment):

{/* Text Content */}
<div style={{ marginBottom: '16px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
    Text Content
  </label>
  <textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="Enter text here..."
    maxLength={500}
    style={{
      width: '100%',
      minHeight: '80px',
      padding: '12px',
      borderRadius: '8px',
      border: `2px solid ${content.length === 0 ? '#EF4444' : '#E5E7EB'}`,
      fontSize: '14px',
      fontFamily: 'Nunito Sans',
      resize: 'vertical'
    }}
  />
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
    fontSize: '12px',
    color: content.length > 450 ? '#F59E0B' : '#6B7280'
  }}>
    <span>{content.length === 0 ? 'Text cannot be empty' : ''}</span>
    <span>{content.length} / 500</span>
  </div>
</div>

{/* Font Family */}
<div style={{ marginBottom: '16px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
    Font Family
  </label>
  <select
    value={fontFamily}
    onChange={(e) => setFontFamily(e.target.value)}
    style={{
      width: '100%',
      padding: '10px',
      borderRadius: '8px',
      border: '2px solid #E5E7EB',
      fontSize: '14px',
      fontFamily: fontFamily
    }}
  >
    <option value="Nunito Sans" style={{ fontFamily: 'Nunito Sans' }}>Nunito Sans</option>
    <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
    <option value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
    <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
    <option value="Lato" style={{ fontFamily: 'Lato' }}>Lato</option>
    <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
  </select>
</div>

{/* Font Size */}
<div style={{ marginBottom: '16px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
    Font Size
  </label>
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <input
      type="range"
      min="12"
      max="72"
      value={fontSize}
      onChange={(e) => setFontSize(Number(e.target.value))}
      style={{ flex: 1 }}
    />
    <input
      type="number"
      min="12"
      max="72"
      value={fontSize}
      onChange={(e) => setFontSize(Number(e.target.value))}
      style={{
        width: '70px',
        padding: '8px',
        borderRadius: '6px',
        border: '2px solid #E5E7EB',
        fontSize: '14px'
      }}
    />
    <span style={{ fontSize: '14px', color: '#6B7280' }}>px</span>
  </div>
</div>

{/* Text Color */}
<div style={{ marginBottom: '16px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
    Text Color
  </label>
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      style={{
        width: '50px',
        height: '40px',
        borderRadius: '6px',
        border: '2px solid #E5E7EB',
        cursor: 'pointer'
      }}
    />
    <input
      type="text"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      style={{
        flex: 1,
        padding: '10px',
        borderRadius: '6px',
        border: '2px solid #E5E7EB',
        fontSize: '14px',
        fontFamily: 'monospace'
      }}
    />
  </div>
</div>

{/* Alignment */}
<div style={{ marginBottom: '16px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
    Alignment
  </label>
  <div style={{ display: 'flex', gap: '8px' }}>
    {(['left', 'center', 'right'] as const).map((align) => (
      <button
        key={align}
        onClick={() => setAlignment(align)}
        style={{
          flex: 1,
          padding: '10px',
          borderRadius: '6px',
          border: `2px solid ${alignment === align ? '#3B82F6' : '#E5E7EB'}`,
          backgroundColor: alignment === align ? '#EFF6FF' : '#FFFFFF',
          color: alignment === align ? '#3B82F6' : '#6B7280',
          fontWeight: 500,
          cursor: 'pointer',
          textTransform: 'capitalize'
        }}
      >
        {align[0].toUpperCase()}
      </button>
    ))}
  </div>
</div>

{/* Buttons */}
<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
  <button
    onClick={onClose}
    style={{
      padding: '10px 20px',
      borderRadius: '8px',
      border: '2px solid #E5E7EB',
      backgroundColor: '#FFFFFF',
      color: '#374151',
      fontWeight: 500,
      cursor: 'pointer'
    }}
  >
    Cancel
  </button>
  <button
    onClick={handleSave}
    disabled={content.length === 0 || content.length > 500}
    style={{
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: content.length === 0 || content.length > 500
        ? '#E5E7EB'
        : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: '#FFFFFF',
      fontWeight: 500,
      cursor: content.length === 0 || content.length > 500 ? 'not-allowed' : 'pointer',
      opacity: content.length === 0 || content.length > 500 ? 0.5 : 1
    }}
  >
    {buttonText}
  </button>
</div>
```

**Validation:**
- [ ] All form fields render
- [ ] Character counter updates
- [ ] Validation works (empty, max chars)
- [ ] Save button disabled when invalid
- [ ] All styles applied inline

---

### Task 2.3: Add Advanced Section to Modal
**File:** `app/src/components/Text/TextModal.tsx` (continued)
**Estimated Time:** 90 minutes

- [ ] Add "Advanced" collapsible section
- [ ] Add letter spacing slider
- [ ] Add line height slider
- [ ] Add background color toggle + picker
- [ ] Add background opacity slider
- [ ] Add text rotation slider
- [ ] Implement collapse/expand animation

```typescript
// Add before alignment buttons in TextModal:

{/* Advanced Section */}
<div style={{ marginBottom: '16px' }}>
  <button
    onClick={() => setShowAdvanced(!showAdvanced)}
    style={{
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #E5E7EB',
      backgroundColor: '#F9FAFB',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '14px'
    }}
  >
    <span>{showAdvanced ? '▼' : '▶'} Advanced</span>
  </button>

  {showAdvanced && (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB'
    }}>
      {/* Letter Spacing */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
          Letter Spacing: {letterSpacing}
        </label>
        <input
          type="range"
          min="-50"
          max="200"
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Line Height */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
          Line Height: {lineHeight}
        </label>
        <input
          type="range"
          min="0.8"
          max="3.0"
          step="0.1"
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Background Color */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={hasBackground}
            onChange={(e) => setHasBackground(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label style={{ fontWeight: 500, fontSize: '14px' }}>Background Color</label>
        </div>
        {hasBackground && (
          <>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{
                  width: '50px',
                  height: '40px',
                  borderRadius: '6px',
                  border: '2px solid #E5E7EB',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: '2px solid #E5E7EB',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                Opacity: {backgroundOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={backgroundOpacity}
                onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Rotation */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
          Rotation: {rotation}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )}
</div>
```

**Validation:**
- [ ] Advanced section toggles
- [ ] All sliders work correctly
- [ ] Background toggle works
- [ ] Values update state correctly

---

## Phase 3: Text Rendering (6-8 hours)

### Task 3.1: Create TextObject Component
**File:** `app/src/components/Text/TextObject.tsx`
**Estimated Time:** 120 minutes

- [ ] Create TextObject component using drei Html
- [ ] Implement camera-facing billboard
- [ ] Apply text styling (font, size, color, alignment)
- [ ] Apply background styling if present
- [ ] Apply letter spacing and line height
- [ ] Apply rotation transform
- [ ] Handle multi-line text with wrapping
- [ ] Optimize with React.memo

```typescript
// app/src/components/Text/TextObject.tsx
import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { TextObject as TextObjectType } from '../../types/text';

interface TextObjectProps {
  text: TextObjectType;
  isSelected?: boolean;
  onClick?: () => void;
}

export const TextObject = React.memo<TextObjectProps>(({ text, isSelected, onClick }) => {
  const textStyle = useMemo(() => ({
    fontFamily: text.fontFamily,
    fontSize: `${text.fontSize}px`,
    color: text.color,
    textAlign: text.alignment,
    letterSpacing: `${text.letterSpacing / 100}em`,
    lineHeight: text.lineHeight,
    margin: 0,
    padding: text.backgroundColor ? '8px 12px' : 0,
    backgroundColor: text.backgroundColor
      ? `${text.backgroundColor}${Math.round((text.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
      : 'transparent',
    borderRadius: text.backgroundColor ? '6px' : 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word' as const,
    maxWidth: '400px',
    userSelect: 'none' as const,
    cursor: 'pointer',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    transition: 'all 200ms ease-out'
  }), [text, isSelected]);

  return (
    <Html
      position={[text.position.x, text.position.y, text.position.z]}
      transform
      occlude={false}
      zIndexRange={[10, 0]}
      style={{
        transform: `rotate(${text.rotation}deg)`,
        pointerEvents: text.locked ? 'none' : 'auto'
      }}
    >
      <div onClick={onClick} style={textStyle}>
        {text.content}
      </div>
    </Html>
  );
});

TextObject.displayName = 'TextObject';
```

**Validation:**
- [ ] Text renders in 3D scene
- [ ] Text faces camera
- [ ] All styling applied correctly
- [ ] Click handler works
- [ ] Performance is good (no lag)

---

### Task 3.2: Create TextRenderer Component
**File:** `app/src/components/Text/TextRenderer.tsx`
**Estimated Time:** 90 minutes

- [ ] Create TextRenderer component
- [ ] Fetch texts from useTextStore
- [ ] Filter by layer visibility
- [ ] Render floating texts
- [ ] Handle text selection
- [ ] Optimize with useMemo
- [ ] Add to SceneManager

```typescript
// app/src/components/Text/TextRenderer.tsx
import React, { useMemo } from 'react';
import { useTextStore } from '../../store/useTextStore';
import { useLayerStore } from '../../store/useLayerStore';
import { TextObject } from './TextObject';

export const TextRenderer: React.FC = () => {
  const texts = useTextStore(state => state.texts);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const selectText = useTextStore(state => state.selectText);
  const layers = useLayerStore(state => state.layers);

  // Filter visible texts
  const visibleTexts = useMemo(() => {
    return texts.filter(text => {
      const layer = layers.find(l => l.id === text.layerId);
      return text.visible && layer?.visible;
    });
  }, [texts, layers]);

  // Only render floating texts (labels rendered separately)
  const floatingTexts = useMemo(() => {
    return visibleTexts.filter(text => text.type === 'floating');
  }, [visibleTexts]);

  return (
    <group name="text-objects">
      {floatingTexts.map(text => (
        <TextObject
          key={text.id}
          text={text}
          isSelected={text.id === selectedTextId}
          onClick={() => selectText(text.id)}
        />
      ))}
    </group>
  );
};
```

**Validation:**
- [ ] Texts render in scene
- [ ] Selection works
- [ ] Layer visibility affects texts
- [ ] Performance is good

---

### Task 3.3: Integrate TextRenderer into SceneManager
**File:** `app/src/components/Scene/SceneManager.tsx`
**Estimated Time:** 30 minutes

- [ ] Import TextRenderer
- [ ] Add TextRenderer to scene
- [ ] Position after other renderers
- [ ] Test rendering

```typescript
// app/src/components/Scene/SceneManager.tsx
// Add import
import { TextRenderer } from '../Text/TextRenderer';

// Add in the Canvas component (after ShapeRenderer):
<TextRenderer />
```

**Validation:**
- [ ] Texts appear in 3D scene
- [ ] No console errors
- [ ] Performance maintained

---

## Phase 4: Text Tool & Selection (4-6 hours)

### Task 4.1: Add Text Tool to Ribbon
**File:** `app/src/components/UI/Ribbon.tsx`
**Estimated Time:** 45 minutes

- [ ] Add text tool button
- [ ] Add "T" icon (text icon)
- [ ] Wire up to setTool('text')
- [ ] Add active state styling
- [ ] Add tooltip "Text (T)"

```typescript
// app/src/components/UI/Ribbon.tsx
// Add after Line tool button:

<button
  onClick={() => setTool('text')}
  style={{
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: tool === 'text' ? '#EFF6FF' : 'transparent',
    color: tool === 'text' ? '#3B82F6' : '#374151',
    transition: 'all 200ms'
  }}
  title="Text (T)"
>
  <Icon name="text" size={18} />
  Text
</button>
```

**Validation:**
- [ ] Button appears in ribbon
- [ ] Active state works
- [ ] Tooltip shows
- [ ] Clicking activates text tool

---

### Task 4.2: Add Text Icon to Icon Component
**File:** `app/src/components/Icon.tsx`
**Estimated Time:** 20 minutes

- [ ] Add text icon SVG
- [ ] Style consistently with other icons

```typescript
// app/src/components/Icon.tsx
// Add in the switch statement:

case 'text':
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7V4h16v3M9 20h6M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
```

**Validation:**
- [ ] Icon renders correctly
- [ ] Size and color correct

---

### Task 4.3: Add "T" Keyboard Shortcut
**File:** `app/src/App.tsx`
**Estimated Time:** 15 minutes

- [ ] Add "T" key handler to activate text tool
- [ ] Add to existing keyboard shortcuts

```typescript
// app/src/App.tsx
// In the keyboard shortcut handler (handleKeyDown):

case 't':
case 'T':
  if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    e.preventDefault();
    setTool('text');
  }
  break;
```

**Validation:**
- [ ] Pressing "T" activates text tool
- [ ] No conflicts with other shortcuts

---

### Task 4.4: Add Text Tool Click Handling
**File:** `app/src/components/Scene/DrawingCanvas.tsx`
**Estimated Time:** 60 minutes

- [ ] Add text tool click handler
- [ ] Calculate click position in 3D
- [ ] Open TextModal with position
- [ ] Create text on modal save
- [ ] Add to undo/redo history

```typescript
// app/src/components/Scene/DrawingCanvas.tsx
// Add in onClick handler:

const handleTextToolClick = (e: ThreeEvent<MouseEvent>) => {
  if (tool !== 'text') return;

  const point = e.point;
  const position = {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.z / gridSize) * gridSize, // Note: z in 3D = y in 2D
    z: 0.1 // Above grid
  };

  // Store position for modal
  setTextPosition(position);
  setTextModalOpen(true);
};

const handleTextModalSave = (textData: Partial<TextObject>) => {
  const newText: TextObject = {
    ...createDefaultTextObject(textPosition!, currentLayerId),
    id: generateTextId(),
    content: textData.content!,
    ...textData
  };

  useTextStore.getState().addText(newText);

  // Add to undo/redo
  addToHistory({
    type: 'text_create',
    data: newText
  });

  // Deselect tool
  setTool('select');
};
```

**Validation:**
- [ ] Clicking canvas opens modal
- [ ] Text created at clicked position
- [ ] Undo works
- [ ] Tool deselects after creation

---

### Task 4.5: Add Text Selection Logic
**File:** `app/src/components/Scene/DrawingCanvas.tsx`
**Estimated Time:** 90 minutes

- [ ] Add text click detection
- [ ] Implement drag to move text
- [ ] Store drag state
- [ ] Update position on drag
- [ ] Add to undo/redo (throttled)

```typescript
// app/src/components/Scene/DrawingCanvas.tsx
// Add text drag handling:

const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
const [dragStartPos, setDragStartPos] = useState<Vector3 | null>(null);

const handleTextPointerDown = (e: ThreeEvent<PointerEvent>, textId: string) => {
  if (tool !== 'select') return;
  e.stopPropagation();

  useTextStore.getState().selectText(textId);
  setDraggedTextId(textId);
  setDragStartPos(e.point.clone());
};

const handleTextPointerMove = (e: ThreeEvent<PointerEvent>) => {
  if (!draggedTextId || !dragStartPos) return;

  const delta = e.point.clone().sub(dragStartPos);
  const text = useTextStore.getState().getTextById(draggedTextId);

  if (text) {
    const newPosition = {
      x: text.position.x + delta.x,
      y: text.position.y + delta.y,
      z: text.position.z
    };

    useTextStore.getState().updateTextPosition(draggedTextId, newPosition);
    setDragStartPos(e.point.clone());
  }
};

const handleTextPointerUp = () => {
  if (draggedTextId) {
    // Add to history
    const text = useTextStore.getState().getTextById(draggedTextId);
    if (text) {
      addToHistory({
        type: 'text_move',
        data: { id: draggedTextId, position: text.position }
      });
    }
  }

  setDraggedTextId(null);
  setDragStartPos(null);
};
```

**Validation:**
- [ ] Clicking text selects it
- [ ] Dragging text moves it
- [ ] Position updates smoothly
- [ ] Undo works for moves

---

## Phase 5: Shape Label Attachment (5-7 hours)

### Task 5.1: Add Double-Click Detection to Shapes
**File:** `app/src/components/Scene/ShapeRenderer.tsx`
**Estimated Time:** 60 minutes

- [ ] Track click times per shape
- [ ] Detect double-click (< 300ms between clicks)
- [ ] Open TextModal for label creation
- [ ] Pass shape ID to modal

```typescript
// app/src/components/Scene/ShapeRenderer.tsx
const [lastClickTime, setLastClickTime] = useState<Record<string, number>>({});

const handleShapeClick = (shapeId: string) => {
  const now = Date.now();
  const lastClick = lastClickTime[shapeId] || 0;

  if (now - lastClick < 300) {
    // Double-click detected
    handleShapeDoubleClick(shapeId);
  }

  setLastClickTime({ ...lastClickTime, [shapeId]: now });
};

const handleShapeDoubleClick = (shapeId: string) => {
  // Open label modal
  setLabelModalOpen(true);
  setLabelShapeId(shapeId);

  // Pre-fill with existing label if present
  const shape = shapes.find(s => s.id === shapeId);
  if (shape?.label) {
    setInitialLabelData(shape.label);
  }
};
```

**Validation:**
- [ ] Double-click detected correctly
- [ ] Modal opens on double-click
- [ ] Existing label pre-fills modal

---

### Task 5.2: Create ShapeLabelRenderer Component
**File:** `app/src/components/Text/ShapeLabelRenderer.tsx`
**Estimated Time:** 120 minutes

- [ ] Create ShapeLabelRenderer component
- [ ] Fetch shapes with labels
- [ ] Calculate label position (center + offset)
- [ ] Calculate label rotation (shape + label)
- [ ] Handle offset dragging
- [ ] Render labels

```typescript
// app/src/components/Text/ShapeLabelRenderer.tsx
import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTextStore } from '../../store/useTextStore';
import { TextObject } from './TextObject';
import { calculateLabelPosition } from '../../utils/textUtils';

export const ShapeLabelRenderer: React.FC = () => {
  const shapes = useAppStore(state => state.shapes);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const selectText = useTextStore(state => state.selectText);

  // Get shapes with labels
  const shapesWithLabels = useMemo(() => {
    return shapes.filter(shape => shape.label);
  }, [shapes]);

  return (
    <group name="shape-labels">
      {shapesWithLabels.map(shape => {
        if (!shape.label) return null;

        // Calculate shape center
        const centerX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
        const centerY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;

        // Calculate label position
        const labelPosition = calculateLabelPosition(
          { x: centerX, y: centerY },
          shape.rotation || 0,
          shape.label.offset || { x: 0, y: 0 }
        );

        // Calculate combined rotation
        const totalRotation = (shape.rotation || 0) + (shape.label.rotation || 0);

        // Create text object for rendering
        const textObject = {
          ...shape.label,
          position: labelPosition,
          rotation: totalRotation
        };

        return (
          <TextObject
            key={`label-${shape.id}`}
            text={textObject}
            isSelected={shape.label.id === selectedTextId}
            onClick={() => selectText(shape.label!.id)}
          />
        );
      })}
    </group>
  );
};
```

**Validation:**
- [ ] Labels render at shape centers
- [ ] Labels move with shapes
- [ ] Labels rotate with shapes
- [ ] Offset applied correctly

---

### Task 5.3: Add Label to Shape Data Model
**File:** `app/src/types/index.ts`
**Estimated Time:** 15 minutes

- [ ] Add optional label field to Shape interface

```typescript
// app/src/types/index.ts
import { TextObject } from './text';

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'polyline';
  points: Point[];
  color?: string;
  rotation?: number;
  label?: TextObject; // Add this
  // ... other fields
}
```

**Validation:**
- [ ] TypeScript compiles
- [ ] No type errors

---

### Task 5.4: Implement Label Duplication with Shape
**File:** `app/src/store/useAppStore.ts`
**Estimated Time:** 45 minutes

- [ ] Update duplicateShape to duplicate label
- [ ] Generate new label ID
- [ ] Preserve all label properties

```typescript
// app/src/store/useAppStore.ts
// In duplicateShape action:

duplicateShape: (shapeId) => set((state) => {
  const shape = state.shapes.find(s => s.id === shapeId);
  if (!shape) return state;

  const newShape = {
    ...shape,
    id: generateShapeId(),
    points: shape.points.map(p => ({ x: p.x + 1, y: p.y + 1 })),
    label: shape.label ? {
      ...shape.label,
      id: generateTextId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    } : undefined
  };

  return {
    shapes: [...state.shapes, newShape]
  };
}),
```

**Validation:**
- [ ] Ctrl+D duplicates shape with label
- [ ] New label has new ID
- [ ] Label properties preserved

---

## Phase 6: Properties Panel Integration (3-4 hours)

### Task 6.1: Create TextPropertiesPanel Component
**File:** `app/src/components/Text/TextPropertiesPanel.tsx`
**Estimated Time:** 120 minutes

- [ ] Create TextPropertiesPanel component
- [ ] Show when text selected
- [ ] "Edit Text Content" button
- [ ] Font, size, color controls with live update
- [ ] Alignment buttons
- [ ] Advanced section (expandable)
- [ ] Position display
- [ ] Delete button

```typescript
// app/src/components/Text/TextPropertiesPanel.tsx
import React, { useState } from 'react';
import { useTextStore } from '../../store/useTextStore';

export const TextPropertiesPanel: React.FC = () => {
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const text = useTextStore(state =>
    state.texts.find(t => t.id === selectedTextId)
  );
  const updateText = useTextStore(state => state.updateText);
  const deleteText = useTextStore(state => state.deleteText);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!text) return null;

  return (
    <div style={{
      padding: '16px',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#6B7280'
      }}>
        TEXT PROPERTIES
      </h3>

      {/* Edit Content Button */}
      <button
        onClick={() => setShowEditModal(true)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '16px',
          borderRadius: '6px',
          border: '2px solid #3B82F6',
          backgroundColor: '#EFF6FF',
          color: '#3B82F6',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Edit Text Content...
      </button>

      {/* Font Family */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#374151'
        }}>
          Font
        </label>
        <select
          value={text.fontFamily}
          onChange={(e) => updateText(text.id, { fontFamily: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '2px solid #E5E7EB',
            fontSize: '13px'
          }}
        >
          <option value="Nunito Sans">Nunito Sans</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Montserrat">Montserrat</option>
          <option value="Lato">Lato</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#374151'
        }}>
          Size
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            min="12"
            max="72"
            value={text.fontSize}
            onChange={(e) => updateText(text.id, { fontSize: Number(e.target.value) })}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: '2px solid #E5E7EB',
              fontSize: '13px'
            }}
          />
          <span style={{ fontSize: '12px', color: '#6B7280' }}>px</span>
        </div>
      </div>

      {/* Color */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#374151'
        }}>
          Color
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={text.color}
            onChange={(e) => updateText(text.id, { color: e.target.value })}
            style={{
              width: '40px',
              height: '32px',
              borderRadius: '6px',
              border: '2px solid #E5E7EB',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            value={text.color}
            onChange={(e) => updateText(text.id, { color: e.target.value })}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: '2px solid #E5E7EB',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
          />
        </div>
      </div>

      {/* Alignment */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#374151'
        }}>
          Align
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => updateText(text.id, { alignment: align })}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '4px',
                border: `2px solid ${text.alignment === align ? '#3B82F6' : '#E5E7EB'}`,
                backgroundColor: text.alignment === align ? '#EFF6FF' : '#FFFFFF',
                color: text.alignment === align ? '#3B82F6' : '#6B7280',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {align[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: showAdvanced ? '12px' : '16px',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{showAdvanced ? '▼' : '▶'} Advanced</span>
      </button>

      {/* Advanced Section */}
      {showAdvanced && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '6px',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB'
        }}>
          {/* Letter Spacing */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Letter Spacing: {text.letterSpacing}
            </label>
            <input
              type="range"
              min="-50"
              max="200"
              value={text.letterSpacing}
              onChange={(e) => updateText(text.id, { letterSpacing: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          {/* Line Height */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Line Height: {text.lineHeight}
            </label>
            <input
              type="range"
              min="0.8"
              max="3.0"
              step="0.1"
              value={text.lineHeight}
              onChange={(e) => updateText(text.id, { lineHeight: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          {/* Background */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Background: {text.backgroundColor ? text.backgroundColor : 'None'}
            </label>
          </div>

          {/* Rotation */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#374151'
            }}>
              Rotation: {text.rotation}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              value={text.rotation}
              onChange={(e) => updateText(text.id, { rotation: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Position */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: '#6B7280'
        }}>
          POSITION
        </h4>
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#374151' }}>
          <span>X: {text.position.x.toFixed(1)}m</span>
          <span>Y: {text.position.y.toFixed(1)}m</span>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => {
          if (confirm('Delete this text?')) {
            deleteText(text.id);
          }
        }}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '6px',
          border: '2px solid #EF4444',
          backgroundColor: '#FEF2F2',
          color: '#EF4444',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Delete Text
      </button>

      {/* Text Modal */}
      {showEditModal && (
        <TextModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={(data) => updateText(text.id, data)}
          initialData={text}
          mode="edit"
        />
      )}
    </div>
  );
};
```

**Validation:**
- [ ] Panel shows when text selected
- [ ] All controls work with live update
- [ ] Edit modal opens
- [ ] Delete button works

---

### Task 6.2: Integrate TextPropertiesPanel into Properties Component
**File:** `app/src/components/Properties.tsx`
**Estimated Time:** 30 minutes

- [ ] Import TextPropertiesPanel
- [ ] Show when text selected
- [ ] Position in properties panel

```typescript
// app/src/components/Properties.tsx
import { TextPropertiesPanel } from './Text/TextPropertiesPanel';
import { useTextStore } from '../store/useTextStore';

// In the component:
const selectedTextId = useTextStore(state => state.selectedTextId);

// Add after shape properties:
{selectedTextId && <TextPropertiesPanel />}
```

**Validation:**
- [ ] Text properties show in panel
- [ ] No layout issues
- [ ] Switching between shape/text works

---

## Phase 7-11: Remaining Tasks

Due to length constraints, I'll provide summaries for the remaining phases:

### Phase 7: Context Menu & Shortcuts (2-3 hours)
- Add text options to context menu
- Implement keyboard shortcuts
- Add Edit, Duplicate, Delete, Lock actions

### Phase 8: Undo/Redo Integration (2-3 hours)
- Integrate all text actions with history
- Test undo/redo for create, edit, move, delete

### Phase 9: Layer Integration (2-3 hours)
- Add text to layer system
- Show floating text in layers
- Show labels under shapes
- Implement visibility/locking

### Phase 10: Testing (6-8 hours)
- Write comprehensive unit tests
- Write component tests
- Write integration tests
- Performance tests
- Accessibility tests
- Target 70%+ coverage

### Phase 11: Polish & Edge Cases (3-4 hours)
- Handle all edge cases
- Add error messages
- Performance warnings
- Font loading fallbacks
- Final QA testing

---

## Completion Checklist

### Feature Complete
- [ ] All 11 phases completed
- [ ] All user stories fulfilled
- [ ] All functional requirements met
- [ ] All edge cases handled

### Quality Gates
- [ ] 70%+ test coverage achieved
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Build succeeds
- [ ] Performance: 60 FPS with 100 texts

### Constitution Compliance
- [ ] Article 1: Inline styles only ✓
- [ ] Article 2: TypeScript strict ✓
- [ ] Article 3: Zustand state ✓
- [ ] Article 4: React best practices ✓
- [ ] Article 5: 60 FPS performance ✓
- [ ] Article 6: 70% test coverage ✓
- [ ] Article 7: Security first ✓
- [ ] Article 8: Edit existing files ✓
- [ ] Article 9: Professional UX ✓
- [ ] Article 10: Proper organization ✓

### Documentation
- [ ] Code comments added
- [ ] JSDoc for public APIs
- [ ] CLAUDE.md updated
- [ ] Known issues documented

### Ready for Review
- [ ] Code reviewed
- [ ] Manual testing complete
- [ ] No known P0/P1 bugs
- [ ] Feature demo prepared

---

## Timeline Summary

| Phase | Estimated Time |
|-------|---------------|
| 1. Foundation | 4-6 hours |
| 2. Text Modal | 5-7 hours |
| 3. Text Rendering | 6-8 hours |
| 4. Text Tool & Selection | 4-6 hours |
| 5. Shape Label Attachment | 5-7 hours |
| 6. Properties Panel | 3-4 hours |
| 7. Context Menu | 2-3 hours |
| 8. Undo/Redo | 2-3 hours |
| 9. Layer Integration | 2-3 hours |
| 10. Testing | 6-8 hours |
| 11. Polish | 3-4 hours |
| **TOTAL** | **42-59 hours** |

---

## Next Steps

1. ✅ Specification created
2. ✅ Implementation plan created
3. ✅ Task breakdown created
4. **→ Run `/speckit.clarify`** if any ambiguities
5. **→ Run `/speckit.checklist`** to generate quality checklists
6. **→ Run `/speckit.analyze`** to verify consistency (target: 85+)
7. **→ Begin implementation** with `/speckit.implement`

---

**Ready to implement the Text feature!** 🎉
