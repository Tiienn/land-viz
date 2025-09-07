# Grid System Architecture

*Technical documentation for the unified Grid system in Land Visualizer*

## Overview

The Grid system in Land Visualizer provides a unified approach to visual grid display, coordinate snapping, and background management. This system was completely redesigned to fix a major bug where the Grid button was disconnected from its intended functionality.

## Architecture Components

### 1. BackgroundManager Component

**File**: `app/src/components/Scene/BackgroundManager.tsx`

**Purpose**: Manages scene background colors based on grid state

**Key Features**:
- Automatically sets background to `#f5f5f5` when Grid is OFF
- Lets GridBackground component handle background when Grid is ON  
- Uses Three.js scene background API directly
- Provides cleanup on component unmount

```typescript
interface BackgroundManagerProps {
  showGrid: boolean;
  gridOffColor?: string; // Defaults to '#f5f5f5'
}
```

### 2. Unified State Management

**File**: `app/src/store/useAppStore.ts`

**Purpose**: Single source of truth for grid state

**Key State**:
```typescript
drawing: {
  snapping: {
    config: {
      activeTypes: Set<'grid' | 'shape'>;
      gridSize: number;
    };
  };
}
```

**Grid State Check**: `drawing.snapping.config.activeTypes.has('grid')`

### 3. Status Bar Integration

**File**: `app/src/App.tsx` (Status bar section)

**Implementation**:
```typescript
Grid: {drawing.snapping?.config?.activeTypes?.has?.('grid') ? `${drawing.gridSize}m snap` : 'Free move'} 
{drawing.snapping?.config?.activeTypes?.has?.('grid') && <span style={{ color: '#22c55e', marginLeft: '4px' }}>📍</span>}
```

**Behavior**:
- Shows "1m snap" + green pin emoji when Grid is ON
- Shows "Free move" when Grid is OFF

### 4. Visual Grid Integration

**File**: `app/src/App.tsx` (SceneManager configuration)

**Implementation**:
```typescript
showGrid: drawing.snapping?.config?.activeTypes?.has?.('grid') ?? false,
```

**Behavior**:
- Visual grid appears when Grid button is ON
- Visual grid disappears when Grid button is OFF

### 5. Drawing Snapping Integration

**File**: `app/src/components/Scene/DrawingCanvas.tsx`

**Implementation**:
```typescript
const snapToGridPoint = useCallback((point: Vector3): Vector3 => {
  if (!gridSnap) return point;
  
  const snappedX = Math.round(point.x / gridSize) * gridSize;
  const snappedZ = Math.round(point.z / gridSize) * gridSize;
  
  return new Vector3(snappedX, 0, snappedZ);
}, [gridSnap, gridSize]);
```

**Behavior**:
- Points snap to 1m grid when Grid button is ON
- Points draw freely when Grid button is OFF

## Problem Solved

### Original Issue
The Grid button was completely non-functional due to disconnected systems:
- Status bar always showed "1m snap" regardless of Grid button state
- Visual grid was always visible regardless of Grid button state  
- Snapping functionality was always enabled regardless of Grid button state
- Each system used different state variables with no synchronization

### Solution Implementation
1. **Unified State**: All systems now use `drawing.snapping.config.activeTypes.has('grid')` as single source of truth
2. **Synchronized Updates**: Grid button changes propagate to all dependent systems immediately
3. **Background Management**: Added BackgroundManager to provide visual feedback when grid is disabled
4. **Simplified Logic**: Removed complex legacy snapping system, replaced with simple unified approach

## Data Flow

```
Grid Button Click
       ↓
Zustand Store Update (activeTypes Set)
       ↓
├─ Status Bar Update (1m snap / Free move)
├─ Visual Grid Toggle (show/hide)  
├─ Background Manager (neutral/natural colors)
└─ Drawing Snapping (enabled/disabled)
```

## Testing Strategy

**Test File**: `app/src/test/grid-functionality.test.ts`

**Key Test Cases**:
1. Grid button toggles all systems simultaneously
2. Status bar reflects correct grid state
3. Visual grid visibility matches button state
4. Snapping functionality matches button state
5. Background colors change correctly

## Background Color System

### Grid ON State
- **Background**: Handled by `GridBackground.tsx` 
- **Color**: `#f5f5f5` (light neutral background)
- **Management**: GridBackground component sets scene.background

### Grid OFF State  
- **Background**: Handled by `BackgroundManager.tsx`
- **Color**: `#f5f5f5` (same neutral color for consistency)
- **Management**: BackgroundManager component sets scene.background

### Coordination
- Both components use the same background color (`#f5f5f5`) for visual consistency
- GridBackground takes precedence when grid is ON
- BackgroundManager takes over when grid is OFF
- Proper cleanup prevents conflicts between the two systems

## Performance Considerations

1. **Minimal Re-renders**: State changes only trigger necessary component updates
2. **Direct Three.js Access**: Background changes use direct scene.background API
3. **Set-based State**: Using Set for activeTypes provides O(1) lookup performance
4. **Callback Optimization**: useCallback prevents unnecessary re-renders in snapping logic

## Future Enhancements

1. **Multiple Snap Types**: Framework supports adding 'shape', 'vertex', etc. snapping
2. **Custom Grid Sizes**: Easy to extend for different grid dimensions
3. **Advanced Snapping**: Can add angle snapping, distance snapping, etc.
4. **Grid Styles**: BackgroundManager can support multiple color schemes

## Development Notes

- **State Management**: Always use the unified state check `drawing.snapping.config.activeTypes.has('grid')`
- **Testing**: Grid functionality must be tested across all affected systems
- **Performance**: Background changes are lightweight Three.js operations
- **Debugging**: Grid state is visible in React DevTools Zustand extension