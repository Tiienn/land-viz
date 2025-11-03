# Equal Spacing Distribution System - Design Document

## Overview
Implementation of Canva-style equal spacing distribution system that guides users to maintain consistent spacing between multiple shapes during drag operations.

## Current vs Target Behavior

### Current System (Incorrect)
- **2 shapes**: Shows 2 badges for 1 spacing measurement (wrong)
- Limited to pairwise spacing detection only
- No equal distribution guidance

### Target System (Canva-style)
- **2 shapes**: 1 spacing badge showing distance between them
- **3 shapes**: 2 spacing badges (A↔B + B↔C spacings)
- **4 shapes**: 3 spacing badges (A↔B + B↔C + C↔D spacings)
- Equal distribution guidance when dragging shapes

## System Requirements

### 1. Basic Spacing Logic
- **One badge per shape pair** (not artificial dual badges)
- Multiple badges appear naturally from multiple shape pairs
- Clear, readable measurements like dimension text

### 2. Multi-Shape Detection
- Detect sequences of 3+ aligned shapes (horizontal or vertical)
- Identify existing spacing patterns between consecutive shapes
- Calculate whether spacings are equal or should be equal

### 3. Equal Distribution Guidance
- When dragging a shape in a sequence, show all relevant spacing measurements
- Highlight when equal distribution is achieved
- Provide visual feedback for maintaining consistent spacing

### 4. Smart Positioning
- Suggest snap positions for equal distribution
- Guide shape placement to match existing spacing patterns
- Real-time feedback during drag operations

## Implementation Phases

### Phase 1: Fix Current Dual Badge Issue ✅ COMPLETE
- ✅ Reverted artificial dual badge logic
- ✅ Ensured 1 badge per shape pair measurement
- ✅ Tested with 2 shapes → shows exactly 1 badge

### Phase 2: Multi-Shape Sequence Detection ✅ COMPLETE
- ✅ Algorithm to detect aligned shape sequences (3+ shapes)
- ✅ Sort shapes by position (left-to-right or top-to-bottom)
- ✅ Calculate consecutive spacing measurements

### Phase 3: Equal Distribution Logic ✅ COMPLETE
- ✅ Detect when spacings in a sequence are equal (within tolerance)
- ✅ Identify the "pattern spacing" for a sequence
- ✅ Show measurements for all pairs in the sequence
- ✅ Visual feedback with color-coded badges (purple, blue, dark)

### Phase 4: Distribution Guidance ✅ COMPLETE
- ✅ **Magnetic Snapping**: Automatic shape positioning for equal distribution
- ✅ **Preview Snap Indicators**: Green crosshairs show suggested positions
- ✅ **Drag Integration**: Real-time snapping during shape manipulation
- ✅ **Visual Confirmation**: "SNAP" badge and consistent measurements
- ✅ **Performance Optimized**: Throttled detection with 8m snap threshold

## Technical Architecture

### SpacingMeasurement Interface
```typescript
interface SpacingMeasurement {
  id: string;
  distance: number;
  position: { x: number; y: number };
  direction: 'horizontal' | 'vertical';
  fromShape: string;
  toShape: string;
  isEqualDistribution?: boolean; // New property
  sequenceId?: string; // Group related measurements
}
```

### ShapeSequence Detection
```typescript
interface ShapeSequence {
  id: string;
  shapes: string[]; // Ordered shape IDs
  direction: 'horizontal' | 'vertical';
  spacings: number[]; // Distances between consecutive shapes
  isEquallySpaced: boolean;
  patternSpacing?: number; // Target spacing for equal distribution
}
```

### Enhanced SimpleAlignment Class
- `detectShapeSequences()`: Find aligned shape sequences
- `calculateEqualDistribution()`: Determine equal spacing guidance
- `generateDistributionGuides()`: Create appropriate spacing measurements

## User Experience Goals

### Visual Feedback
- Spacing measurements appear as professional badges (like dimension text)
- Equal distribution highlighted with consistent styling
- Clear indication when optimal spacing is achieved

### Interaction Flow
1. User has shapes A and B with 66m spacing
2. User drags shape C near the sequence
3. System shows:
   - Existing A↔B spacing (66m)
   - Preview B↔C spacing as user drags
   - Snapping guidance when B↔C approaches 66m
4. When equal distribution achieved, both measurements confirmed

### Performance Considerations
- Efficient sequence detection (avoid O(n²) calculations)
- Throttled updates during drag operations
- Minimal re-calculations when shapes are stationary

## Success Criteria ✅ ALL ACHIEVED
- ✅ **2 shapes → exactly 1 spacing badge**: Implemented and tested
- ✅ **3 shapes → 2 spacing badges showing equal distribution**: Functional with sequence detection
- ✅ **Smooth drag guidance for maintaining equal spacing**: Real-time magnetic snapping active
- ✅ **Visual consistency with existing dimension text**: Camera-scaled UI elements
- ✅ **Performance: <16ms update cycles during drag operations**: Throttled alignment detection

## Implementation Status: 🟢 **PRODUCTION READY**

### **Completed Features (September 2025)**
- ✅ **Canva-Style Visual Design**: Purple dashed lines, spacing badges, green snap indicators
- ✅ **4-Phase Implementation**: All phases successfully completed and integrated
- ✅ **Magnetic Snapping System**: 8-meter threshold with smooth positioning
- ✅ **Multi-Shape Intelligence**: Automatic sequence detection for 3+ aligned shapes
- ✅ **Real-Time Feedback**: Dynamic color coding and visual confirmation
- ✅ **Performance Optimization**: Throttled calculations with cleanup systems

## Implementation Notes
- Reuse existing camera scaling and styling from ShapeDimensions
- Integrate with current alignment guide system
- Maintain compatibility with existing shape drag operations
- Consider edge cases: overlapping shapes, very small spacings, rotated shapes