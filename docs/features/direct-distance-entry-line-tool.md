# Direct Distance Entry Line Tool

## Overview

The Direct Distance Entry (DDE) Line Tool provides AutoCAD-style precision line drawing with exact distance input. Users can create both single lines and multi-segment polylines by entering precise distances rather than relying on mouse positioning accuracy.

## Features

### Single Line Mode
- Click to place first point
- Enter precise distance in meters
- Mouse direction determines line angle
- Creates individual line shapes

### Multi-Line Mode
- Polyline-style workflow with distance entry at each segment
- Automatic shape closing when near start point
- Manual completion for open polylines
- Segment counter and progress tracking

### Precision Controls
- Grid snapping integration (1m snap grid)
- Real-time preview with cursor tracking
- Mathematical precision using direction vectors
- Support for decimal distances

## User Interface

### Distance Input Modal
- **Position**: Fixed beside mouse position indicator
- **Size**: 120px minimum width with responsive padding
- **Styling**: Blue border (#3b82f6) with semi-transparent background
- **Focus**: Auto-focus and text selection on appearance

### Mode Indicators
```
Single Mode: "Enter to confirm, Tab for multi-line, ESC to cancel"
Multi Mode: "Enter for next segment • Space to complete • ESC to cancel"
             "Multi-Line Mode • Segment N"
```

### Keyboard Shortcuts
- **Enter**: Confirm distance and create segment
- **Tab**: Enable multi-line mode (single mode only)
- **Space**: Complete multi-line drawing (multi mode only)
- **ESC**: Cancel current operation

## Workflow

### Single Line Creation
1. Click **Line** button (or press 'L')
2. Click first point on 3D scene
3. Distance input modal appears
4. Type distance (e.g., "5.5")
5. Press **Enter** to confirm
6. Line created in cursor direction

### Multi-Line Creation
1. Click **Line** button (or press 'L')
2. Click first point on 3D scene
3. Type distance for first segment
4. Press **Tab** to enable multi-line mode
5. Press **Enter** to confirm first segment
6. Repeat: type distance → **Enter** for each segment
7. **Complete**:
   - **Auto-close**: Click near start point (4m threshold)
   - **Manual**: Press **Space** to finish open polyline

## Technical Implementation

### Store Integration
- **State**: `useAppStore.drawing.lineTool`
- **Actions**: `startLineDrawing`, `confirmLineDistance`, `enableMultiSegmentMode`
- **Data**: Segments array, current distance, preview points

### Shape Creation
- **Single**: Creates `type: 'line'` with 2 points
- **Multi**: Creates `type: 'polyline'` with all segment points
- **Closed**: Polyline with start/end points connected

### Mathematical Precision
```typescript
// Direction calculation
const direction = calculateDirection(startPoint, cursorPoint);

// Distance application
const endPoint = applyDistance(startPoint, direction, distance);
```

### Grid Snapping
- **Integration**: Works with existing snap grid system
- **Precision**: 1-meter snap increments
- **Visual**: Snap indicators and alignment guides

## Component Architecture

### Core Components
- **DistanceInput**: Modal input with keyboard handling
- **PrecisionLinePreview**: 3D line preview rendering
- **DrawingCanvas**: 3D interaction and click handling

### Data Flow
```
User Input → DistanceInput → Store Actions → Shape Creation → 3D Rendering
```

### Props Interface
```typescript
interface DistanceInputProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
  isMultiSegment?: boolean;
  segmentCount?: number;
  onEnableMultiSegment?: () => void;
  onCompleteMultiSegment?: () => void;
}
```

## Integration Points

### Toolbar Integration
- **Button**: Line tool button with 'L' keyboard shortcut
- **State**: Active tool indication and cursor changes
- **Mode**: Switches from select tool automatically

### 3D Scene Integration
- **Raycasting**: Ground plane intersection for point placement
- **Preview**: Real-time line rendering during input
- **Snapping**: Integration with alignment and grid systems

### Shape Management
- **Creation**: Automatic shape naming (`Line N`, `Multi-Line N`)
- **Layer**: Uses active layer for new shapes
- **Area**: Lines excluded from total area calculations

## Performance Considerations

### Optimization Features
- **Throttled Updates**: 16ms preview update cycle
- **Vector Caching**: Reused vector objects for calculations
- **Limited Segments**: Practical limits for complex polylines

### Memory Management
- **Cleanup**: Automatic state reset on tool deactivation
- **References**: Proper cleanup of preview geometries

## Error Handling

### Input Validation
- **Format**: Numbers and decimal points only (`/^\d*\.?\d*$/`)
- **Range**: Positive values required
- **Empty**: Graceful handling of empty input

### Edge Cases
- **Snap Conflicts**: Priority system for overlapping snap points
- **Precision**: Floating-point math with proper rounding
- **State**: Proper cleanup on mode switches

## Future Enhancements

### Planned Features
- **Angle Entry**: Combined distance and angle input
- **Arc Segments**: Curved segments in multi-line mode
- **Relative Coordinates**: Offset-based positioning
- **Distance Units**: Support for feet, inches, etc.

### UI Improvements
- **Visual Feedback**: Enhanced preview rendering
- **Touch Support**: Mobile-optimized input
- **Undo/Redo**: Individual segment operations

## Testing

### Manual Test Cases
1. **Basic Line**: Create single 10m line
2. **Multi-Line**: Create 3-segment polyline
3. **Shape Closing**: Close polyline near start point
4. **Keyboard**: Test all keyboard shortcuts
5. **Snap Integration**: Verify grid snapping works
6. **Error Cases**: Invalid input, cancellation, mode switches

### Integration Tests
- **Store Actions**: Verify all state transitions
- **3D Rendering**: Confirm shapes render correctly
- **Performance**: Check preview update frequency

## Documentation Updates

This implementation adds to the existing tool ecosystem:
- **Measurement Tool**: Point-to-point distance measurement
- **Drawing Tools**: Rectangle, circle, polyline shapes
- **Edit Tools**: Shape manipulation and transformation

The DDE Line Tool provides professional CAD-style precision while maintaining the intuitive workflow of the Land Visualizer application.