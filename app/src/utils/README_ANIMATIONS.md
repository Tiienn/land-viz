# Micro-Animation System

**Canva-Inspired Animation Guidelines for Land Visualizer**

## Overview

This animation system provides smooth, delightful micro-interactions following the Canva design philosophy. All animations are optimized for performance and accessibility.

## Quick Start

```typescript
import {
  animateToolSelection,
  animateSuccess,
  animateError,
  createHoverHandlers,
  toolButtonStyle,
} from '../utils/animations';
```

## Animation Types

### 1. Button Hover Elevation

**Use Case**: All interactive buttons
**Timing**: 200ms
**Effect**: Subtle lift with shadow

```typescript
// Example: Tool button with hover
<button
  style={toolButtonStyle(isActive)}
  {...createHoverHandlers(isActive)}
  onClick={() => handleToolSelect()}
>
  Tool Name
</button>
```

**Manual Implementation**:
```typescript
<button
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}
  style={{
    transition: 'all 0.2s ease',
    // ... other styles
  }}
>
  Button
</button>
```

### 2. Tool Selection Animation

**Use Case**: Tool button clicks
**Timing**: 200ms
**Effect**: Scale pulse (1 → 1.05 → 1)

```typescript
// Example: Tool selection with animation
<button
  onClick={(e) => {
    animateToolSelection(e.currentTarget);
    setActiveTool('rectangle');
  }}
>
  Rectangle Tool
</button>
```

### 3. Success Feedback

**Use Case**: Save, export, confirmation actions
**Timing**: 600ms
**Effect**: Green pulse expanding outward

```typescript
// Example: Export success
const handleExport = () => {
  // ... export logic
  const button = document.getElementById('export-button');
  if (button) {
    animateSuccess(button);
  }
};
```

### 4. Error Feedback

**Use Case**: Validation errors, failed operations
**Timing**: 300ms
**Effect**: Horizontal shake

```typescript
// Example: Form validation error
const handleSubmit = () => {
  if (!isValid) {
    const input = document.getElementById('input-field');
    if (input) {
      animateError(input);
    }
    return;
  }
  // ... submit logic
};
```

## Pre-Built Style Functions

### Primary Button
```typescript
import { primaryButtonStyle } from '../utils/animations';

<button
  style={primaryButtonStyle}
  {...createHoverHandlers()}
>
  Save Changes
</button>
```

### Secondary Button
```typescript
import { secondaryButtonStyle } from '../utils/animations';

<button
  style={secondaryButtonStyle}
  {...createHoverHandlers()}
>
  Cancel
</button>
```

### Tool Button
```typescript
import { toolButtonStyle } from '../utils/animations';

const isActive = activeTool === 'rectangle';

<button
  style={toolButtonStyle(isActive)}
  {...createHoverHandlers(isActive)}
  onClick={(e) => {
    animateToolSelection(e.currentTarget);
    setActiveTool('rectangle');
  }}
>
  <Icon name="rectangle" />
  <span>Rectangle</span>
</button>
```

## Animation Timing Constants

```typescript
import { ANIMATION_TIMING } from '../utils/animations';

// Quick feedback (100ms) - Immediate response
transition: `all ${ANIMATION_TIMING.QUICK} ease`;

// Smooth (200ms) - Standard transitions
transition: `all ${ANIMATION_TIMING.SMOOTH} ease`;

// Noticeable (300ms) - Deliberate animations
transition: `all ${ANIMATION_TIMING.NOTICEABLE} ease`;

// Celebration (600ms) - Success feedback
transition: `all ${ANIMATION_TIMING.CELEBRATION} ease`;
```

## Best Practices

### ✅ DO
- Use hover effects on all clickable elements
- Add selection animation to tool buttons
- Show success feedback for important actions
- Keep transitions consistent (200ms standard)
- Test animations at 60 FPS

### ❌ DON'T
- Animate during drag operations (performance)
- Use animations longer than 600ms
- Stack multiple animations simultaneously
- Animate layout-shifting properties
- Add animations to frequently updating elements

## Accessibility

All animations respect `prefers-reduced-motion`:

```typescript
// Automatically disabled when user prefers reduced motion
// No additional code needed - browser handles it
```

## Performance Guidelines

### Optimal Properties to Animate
- `transform` (translateY, scale)
- `opacity`
- `box-shadow`
- `color`

### Avoid Animating
- `width`, `height` (triggers layout)
- `top`, `left` (use transform instead)
- `border-width` (use border-color instead)

## Examples

### Complete Tool Button Example
```typescript
import {
  animateToolSelection,
  toolButtonStyle,
  createHoverHandlers,
} from '../utils/animations';

const ToolButton = ({ tool, isActive, onSelect }) => {
  return (
    <button
      style={toolButtonStyle(isActive)}
      {...createHoverHandlers(isActive)}
      onClick={(e) => {
        animateToolSelection(e.currentTarget);
        onSelect(tool);
      }}
    >
      <Icon name={tool} size={20} />
      <span>{tool}</span>
    </button>
  );
};
```

### Complete Save Button Example
```typescript
import {
  primaryButtonStyle,
  animateSuccess,
  animateError,
  createHoverHandlers,
} from '../utils/animations';

const SaveButton = ({ onSave }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSave = async () => {
    try {
      await onSave();
      if (buttonRef.current) {
        animateSuccess(buttonRef.current);
      }
    } catch (error) {
      if (buttonRef.current) {
        animateError(buttonRef.current);
      }
    }
  };

  return (
    <button
      ref={buttonRef}
      style={primaryButtonStyle}
      {...createHoverHandlers()}
      onClick={handleSave}
    >
      Save Changes
    </button>
  );
};
```

## Migration Guide

### Updating Existing Buttons

**Before**:
```typescript
<button
  style={{
    background: '#3B82F6',
    color: 'white',
    // ... other styles
  }}
  onClick={handleClick}
>
  Click Me
</button>
```

**After**:
```typescript
<button
  style={{
    ...primaryButtonStyle,
    // ... custom overrides
  }}
  {...createHoverHandlers()}
  onClick={(e) => {
    animateToolSelection(e.currentTarget);
    handleClick();
  }}
>
  Click Me
</button>
```

## Testing

Test animations on:
- Desktop Chrome/Firefox/Safari
- Mobile iOS Safari
- Mobile Android Chrome
- Reduced motion preference enabled
- 60 FPS performance monitoring

## References

- **Design System**: `docs/project/canva-design-system.md`
- **Animation Source**: `src/utils/animations.ts`
- **Global Keyframes**: `app/index.html` (lines 32-71)
