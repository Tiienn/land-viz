# Phase 1: AI/ML Boundary Detection - Specification

## Overview
Implement automatic boundary detection from uploaded site plan images using computer vision techniques (OpenCV.js). This enables users to upload a site plan image and automatically extract property boundaries as drawable shapes.

## Goals
1. **Automatic Extraction**: Detect closed boundaries from site plan images
2. **High Accuracy**: 85%+ detection rate for clean site plans
3. **User Refinement**: Manual tools to adjust detected boundaries
4. **Scale Calibration**: Convert image pixels to real-world measurements
5. **Performance**: <3 seconds processing time for typical images

## Technology Stack
- **OpenCV.js** (v4.x): Computer vision library via WebAssembly
- **Canvas API**: Image preprocessing and rendering
- **React**: UI components for upload and refinement

## Workflow

### 1. Image Upload
```
User uploads site plan image → Display preview → Proceed to detection
```
- Supported formats: PNG, JPG, PDF (convert first page to image)
- Max file size: 10MB
- Recommended: High contrast, clean scans, 300+ DPI

### 2. Preprocessing
```
Grayscale → Gaussian Blur → Adaptive Threshold → Morphological Operations
```
- **Grayscale**: Convert to single channel for edge detection
- **Gaussian Blur**: Reduce noise (kernel size: 5x5)
- **Adaptive Threshold**: Handle varying lighting conditions
- **Morphological Operations**: Close gaps, remove small artifacts

### 3. Edge Detection & Contour Extraction
```
Canny Edge Detection → Find Contours → Filter & Sort
```
- **Canny**: Hysteresis thresholds (50, 150) for edge detection
- **Find Contours**: Extract all closed boundaries
- **Filter**: Remove contours <100px² or >90% of image
- **Sort**: By area (largest first, likely property boundary)

### 4. Polygon Approximation
```
Douglas-Peucker Algorithm → Simplify contours to polygons
```
- **Epsilon**: 0.02 * perimeter (2% tolerance)
- **Result**: Simplified polygon with key corner points

### 5. Scale Calibration
```
User draws reference line → Inputs known dimension → Calculate pixels/meter
```
- **Reference Line**: User clicks two points on known dimension
- **Known Dimension**: User inputs real-world length (e.g., "50 feet")
- **Calculation**: `scale = pixelDistance / realWorldDistance`

### 6. Coordinate Transformation
```
Image coordinates (px) → World coordinates (meters)
```
- **Transform**: `worldX = (imageX - centerX) * scale`
- **Origin**: Image center maps to world origin (0, 0)

### 7. Import to Scene
```
Detected polygons → Create shapes → Add to scene
```
- **Polygon** → Create as polyline shape
- **Rectangle** (4 corners, 90° angles) → Create as rectangle
- **Circle** (detected via Hough Circle Transform) → Create as circle

## Architecture

### Components

#### `BoundaryDetectionModal.tsx`
Main UI component with multi-step wizard:
1. Upload image
2. Preview and detect
3. Refine detection
4. Scale calibration
5. Confirm and import

#### `BoundaryDetectionService.ts`
Core OpenCV.js processing logic:
```typescript
class BoundaryDetectionService {
  // Initialize OpenCV.js
  async init(): Promise<void>

  // Process image and detect boundaries
  async detectBoundaries(image: HTMLImageElement): Promise<DetectedBoundary[]>

  // Preprocess image (grayscale, blur, threshold)
  private preprocessImage(src: cv.Mat): cv.Mat

  // Extract contours
  private extractContours(processed: cv.Mat): cv.MatVector

  // Approximate polygons
  private approximatePolygons(contours: cv.MatVector): Polygon[]

  // Detect circles (Hough Circle Transform)
  private detectCircles(src: cv.Mat): Circle[]
}
```

#### `BoundaryRefinementCanvas.tsx`
Interactive canvas for manual adjustment:
- **Add Point**: Click on boundary to insert point
- **Move Point**: Drag existing points
- **Delete Point**: Right-click point to remove
- **Undo/Redo**: Ctrl+Z/Y for refinement history

### Data Structures

```typescript
interface DetectedBoundary {
  id: string;
  type: 'polygon' | 'rectangle' | 'circle';
  points: [number, number][]; // Image coordinates (px)
  area: number; // Pixels²
  confidence: number; // 0-1 score
  simplified: boolean; // Applied Douglas-Peucker?
}

interface ScaleCalibration {
  imagePoint1: [number, number]; // Start point (px)
  imagePoint2: [number, number]; // End point (px)
  realWorldDistance: number; // Meters
  pixelsPerMeter: number; // Calculated scale
}

interface BoundaryDetectionResult {
  boundaries: DetectedBoundary[];
  scale: ScaleCalibration;
  originalImage: HTMLImageElement;
  processedImage: HTMLCanvasElement;
}
```

## UI/UX Design

### Upload Step
```
┌─────────────────────────────────────┐
│  Upload Site Plan Image             │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │   Drop image here or click    │  │
│  │         📁 Browse Files        │  │
│  │                                │  │
│  │  Supported: PNG, JPG, PDF      │  │
│  │  Max size: 10MB                │  │
│  └───────────────────────────────┘  │
│                                      │
│  Tips:                               │
│  • High contrast scans work best     │
│  • Clean, straight boundaries        │
│  • 300+ DPI recommended              │
└─────────────────────────────────────┘
```

### Detection Step
```
┌─────────────────────────────────────┐
│  Detected Boundaries (3 found)       │
├─────────────────────────────────────┤
│  ┌─────────────────┬───────────────┐│
│  │                 │ Boundary #1   ││
│  │                 │ Area: 1,250 m²││
│  │  Image Preview  │ Type: Polygon ││
│  │  with overlays  │ Points: 12    ││
│  │                 │               ││
│  │                 │ [✓] Import    ││
│  └─────────────────┴───────────────┘│
│                                      │
│  [< Back]  [Refine]  [Next: Scale >]│
└─────────────────────────────────────┘
```

### Scale Calibration Step
```
┌─────────────────────────────────────┐
│  Scale Calibration                   │
├─────────────────────────────────────┤
│  Instructions:                       │
│  1. Click two points on a known      │
│     dimension in the image           │
│  2. Enter the real-world distance    │
│                                      │
│  ┌─────────────────────────────────┐│
│  │  [Image with reference line]    ││
│  │         ●─────────●              ││
│  │                                  ││
│  └─────────────────────────────────┘│
│                                      │
│  Distance: [50] [feet ▼]             │
│  Scale: 1px = 0.024 meters           │
│                                      │
│  [< Back]          [Import Shapes >]│
└─────────────────────────────────────┘
```

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| **OpenCV.js Load Time** | <2 seconds | Lazy load on first use |
| **Detection Time** | <3 seconds | Typical 2000x2000px image |
| **Memory Usage** | <100MB | Process and release matrices |
| **Accuracy** | 85%+ | Clean site plans, manual refinement available |

## Testing Strategy

### Unit Tests
- Preprocessing algorithms (grayscale, blur, threshold)
- Contour filtering logic
- Polygon approximation
- Coordinate transformation

### Integration Tests
- Full detection pipeline with sample images
- Scale calibration accuracy
- Shape creation and import

### E2E Tests (Playwright)
- Upload workflow
- Manual refinement interactions
- Import to scene verification

### Test Images
Create 10 sample site plans:
1. Simple rectangle property
2. L-shaped property
3. Irregular polygon (8+ sides)
4. Multiple parcels
5. Low contrast scan
6. Noisy/hand-drawn
7. CAD screenshot
8. PDF scan
9. Rotated image
10. High resolution (5000x5000px)

## Error Handling

### Common Issues & Solutions

| Issue | Detection | Solution |
|-------|-----------|----------|
| **No boundaries found** | Zero contours | Suggest adjusting contrast/brightness |
| **Too many boundaries** | 20+ contours | Auto-select largest, allow manual selection |
| **Low confidence** | Score <0.5 | Show warning, enable manual refinement |
| **Image too large** | >10MB or >5000px | Auto-resize to 2000px max dimension |
| **OpenCV.js load failure** | Network error | Show retry button, fallback to manual drawing |

## Accessibility

- **Keyboard Navigation**: Tab through upload, detection, refinement steps
- **Screen Reader**: Announce detection results ("3 boundaries found")
- **High Contrast**: Ensure boundary overlays visible (yellow/cyan)
- **Error Messages**: Clear, actionable error descriptions

## Future Enhancements

### Phase 1.1 (Current)
- Basic contour detection
- Polygon approximation
- Manual refinement
- Scale calibration

### Phase 1.2 (Future)
- **Circle Detection**: Hough Circle Transform for curved features
- **Text OCR**: Extract dimensions from labels (Tesseract.js)
- **ML-based Refinement**: TensorFlow.js model for semantic segmentation

### Phase 1.3 (Future)
- **Batch Processing**: Upload multiple images
- **Auto-alignment**: Stitch multiple scans
- **3D Elevation**: Extract elevation contours

## Implementation Plan

### Step 1: Setup OpenCV.js (Phase 1.2)
- Install OpenCV.js via CDN or npm package
- Create lazy loading mechanism
- Test basic image processing

### Step 2: Core Detection Service (Phase 1.3)
- Implement preprocessing pipeline
- Implement contour extraction
- Implement polygon approximation
- Add unit tests

### Step 3: UI Components (Phase 1.5)
- Create upload modal
- Create detection preview
- Create refinement canvas
- Create scale calibration UI

### Step 4: Integration (Phase 1.4)
- Convert detected boundaries to shapes
- Import to scene
- Update app store

### Step 5: Testing & Documentation (Phase 1.6)
- Create test image suite
- Write integration tests
- Document usage in CLAUDE.md

## Success Criteria

✅ User can upload site plan image
✅ System detects at least one boundary (85% success rate on clean images)
✅ User can refine detected boundaries manually
✅ User can calibrate scale with known dimension
✅ Detected boundaries import as drawable shapes
✅ Processing completes in <3 seconds
✅ No performance degradation (maintains 60 FPS)
✅ Comprehensive documentation and tests

## Dependencies

- **OpenCV.js**: 4.x (via CDN or npm)
- **File API**: Native browser support
- **Canvas API**: Native browser support
- **React**: Already installed
- **Zustand**: Already installed (app store)

## File Structure

```
app/src/
  services/
    boundaryDetection/
      BoundaryDetectionService.ts          # Core OpenCV.js logic
      preprocessingUtils.ts                # Image preprocessing
      contourUtils.ts                      # Contour extraction
      polygonUtils.ts                      # Polygon approximation
      coordinateUtils.ts                   # Coordinate transformation
      __tests__/
        BoundaryDetectionService.test.ts
  components/
    BoundaryDetection/
      BoundaryDetectionModal.tsx           # Main modal wizard
      ImageUploadStep.tsx                  # Step 1: Upload
      DetectionPreviewStep.tsx             # Step 2: Preview
      RefinementCanvas.tsx                 # Step 3: Refine
      ScaleCalibrationStep.tsx             # Step 4: Scale
      BoundaryOverlay.tsx                  # Canvas overlay renderer
      __tests__/
        BoundaryDetectionModal.test.tsx
  utils/
    opencvLoader.ts                        # Lazy load OpenCV.js
docs/
  features/
    BOUNDARY_DETECTION.md                  # User documentation
  specs/
    018-boundary-detection/
      spec.md                               # This file
      plan.md                               # Implementation plan
      test-images/                          # Sample site plans
```

## References

- OpenCV.js Documentation: https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html
- Canny Edge Detection: https://docs.opencv.org/4.x/dd/d1a/group__imgproc__feature.html#ga04723e007ed888ddf11d9ba04e2232de
- Find Contours: https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html#ga17ed9f5d79ae97bd4c7cf18403e1689a
- Douglas-Peucker Algorithm: https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
