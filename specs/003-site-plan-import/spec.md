# Feature Specification: Site Plan Image Import

**Spec ID**: 003
**Feature**: Site Plan Image Import
**Status**: Draft
**Created**: 2025-10-08
**Priority**: High
**Estimated Effort**: 4-6 weeks

---

## 1. Overview

### 1.1 Problem Statement
Users have existing site plan images (scanned documents, photos, PDFs) showing land parcels with dimensions and labels. Currently, they must manually recreate these plans in Land Visualizer by:
- Drawing each edge manually
- Entering dimensions one by one
- Positioning shapes by trial and error

This is time-consuming, error-prone, and creates a barrier to adoption for users who already have professional site plans.

### 1.2 Proposed Solution
An intelligent image import system that:
1. Accepts site plan images (JPG, PNG, PDF)
2. Automatically detects property boundaries using computer vision
3. Extracts dimension text using OCR
4. Matches dimensions to detected edges
5. Calculates scale and converts to real-world coordinates
6. Creates accurate 3D shapes in the canvas

### 1.3 User Story
```
AS A property owner with an existing site plan
I WANT TO upload my site plan image
SO THAT the system automatically recreates it in 3D
WITHOUT manually tracing and measuring everything
```

### 1.4 Success Criteria
- ✅ 85%+ successful boundary detection on clear site plans
- ✅ 90%+ accuracy in dimension extraction
- ✅ Processing completes in <15 seconds for typical images
- ✅ User can manually correct any errors before finalizing
- ✅ Works with common site plan formats (residential, commercial)

---

## 2. Functional Requirements

### 2.1 Image Upload (FR-001)
**Requirement**: System shall accept image uploads via drag-and-drop or file picker

**Details**:
- Supported formats: JPG, PNG, PDF (single page)
- Max file size: 10MB
- Min resolution: 800x600px
- Max resolution: 8000x8000px
- Image preview before processing

**Acceptance Criteria**:
- User can drag image onto upload zone
- User can click to browse files
- System validates file type and size
- Preview shows uploaded image with zoom controls
- Error messages for invalid files

### 2.2 Boundary Detection (FR-002)
**Requirement**: System shall automatically detect property boundary polygon

**Details**:
- Uses OpenCV.js contour detection
- Applies image preprocessing (grayscale, edge detection, filtering)
- Approximates contours to polygons (Douglas-Peucker algorithm)
- Identifies largest closed polygon as primary boundary
- Supports 3-20 vertices

**Acceptance Criteria**:
- Detects rectangular shapes (4 vertices) with 95% accuracy
- Detects quadrilaterals (4 vertices, non-rectangular) with 90% accuracy
- Detects complex polygons (5-10 vertices) with 80% accuracy
- Shows detected boundary overlay on image
- User can see confidence score

**AMBIGUITY**: How to handle multiple disconnected parcels in one image?
**RESOLUTION NEEDED**: Define MVP scope - single parcel only, or multi-parcel support?

### 2.3 Dimension Extraction (FR-003)
**Requirement**: System shall extract dimension measurements from text

**Details**:
- Uses Tesseract.js OCR engine
- Detects numbers followed by units (m, ft, meters, feet)
- Supports multiple languages (English, French)
- Extracts dimension position (bounding box)
- Filters low-confidence results (<70%)

**Acceptance Criteria**:
- Extracts dimensions in format "21.45m", "50.71m", etc.
- Handles decimal numbers (e.g., 39.49)
- Recognizes common abbreviations (m, ft, yd)
- Returns position of each dimension text
- Works with different font sizes and styles

**AMBIGUITY**: How to handle handwritten dimensions?
**RESOLUTION NEEDED**: MVP excludes handwritten text; require printed/typed plans

### 2.4 Dimension-to-Edge Matching (FR-004)
**Requirement**: System shall intelligently match extracted dimensions to polygon edges

**Details**:
- Calculates perpendicular distance from dimension text to each edge
- Assigns dimension to closest edge (within threshold)
- Handles edge cases (corners, overlapping text)
- Detects contradictions (edge has multiple conflicting dimensions)

**Acceptance Criteria**:
- Correctly matches 90%+ of dimensions to edges
- Shows visual indicators of matches (lines connecting text to edges)
- Flags unmatched dimensions for user review
- Flags conflicting dimensions (same edge, different values)
- User can manually reassign dimensions

### 2.5 Scale Calculation (FR-005)
**Requirement**: System shall calculate pixel-to-meter scale from known dimensions

**Details**:
- Uses matched dimensions to calculate pixels-per-meter ratio
- Averages multiple scale calculations for accuracy
- Detects scale inconsistencies (>10% variance)
- Converts pixel coordinates to real-world meters

**Acceptance Criteria**:
- Calculates scale with <5% error (compared to manual measurement)
- Requires minimum 2 matched dimensions
- Warns user if scale confidence is low (<80%)
- Shows calculated scale factor (e.g., "1 pixel = 0.05m")
- Allows manual scale override

**AMBIGUITY**: What if dimensions contradict each other?
**RESOLUTION NEEDED**: Use median scale, flag outliers, allow manual correction

### 2.6 Shape Creation (FR-006)
**Requirement**: System shall create accurate 3D shape from extracted data

**Details**:
- Converts scaled coordinates to 3D canvas space
- Creates polyline shape with extracted vertices
- Applies extracted dimensions as metadata
- Positions shape at canvas origin
- Maintains aspect ratio and proportions

**Acceptance Criteria**:
- Created shape matches original plan (within 5% error)
- Shape is editable after import (move, rotate, resize)
- Dimensions are preserved as shape metadata
- Shape integrates with existing measurement tools
- Undo/redo works for import operation

### 2.7 Manual Correction Interface (FR-007)
**Requirement**: System shall provide UI for reviewing and correcting import results

**Details**:
- Shows side-by-side comparison (original image vs. detected shape)
- Allows vertex adjustment (drag to reposition)
- Allows dimension reassignment (click dimension, click edge)
- Allows scale adjustment (input field)
- Preview updates in real-time

**Acceptance Criteria**:
- User can drag vertices to adjust shape
- User can click to add/remove vertices
- User can edit dimension values
- User can adjust scale factor
- Changes update 3D preview immediately
- "Accept" button finalizes import
- "Cancel" button discards import

### 2.8 Label Detection (FR-008) [OPTIONAL]
**Requirement**: System should detect and preserve labels (street names, lot numbers)

**Details**:
- Uses OCR to find non-dimension text
- Classifies text (road labels, property IDs, notes)
- Positions labels in 3D space
- Allows user to edit label text and position

**Acceptance Criteria**:
- Detects text like "CHEMIN COMMUN", "LOT 42"
- Positions labels near relevant edges/areas
- Labels are editable after import
- Labels render in 3D with proper scaling

**AMBIGUITY**: How to distinguish labels from dimensions?
**RESOLUTION NEEDED**: Use heuristics (position, format, keywords)

---

## 3. Non-Functional Requirements

### 3.1 Performance (NFR-001)
- Image processing: <10 seconds for typical image (2000x2000px)
- OCR processing: <5 seconds
- UI remains responsive during processing (web worker)
- Max memory usage: <500MB
- Progressive feedback (show steps: "Detecting edges... 30%")

### 3.2 Usability (NFR-002)
- No learning curve - drag and drop interface
- Clear error messages for common issues
- Visual feedback at each step
- Ability to retry with different settings
- Help tooltips explaining each step

### 3.3 Compatibility (NFR-003)
- Works in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Desktop and tablet support (mobile optional for MVP)
- WASM support required (graceful fallback message)
- Works offline after initial library load

### 3.4 Reliability (NFR-004)
- Handles corrupted/malformed images gracefully
- Detects and reports processing failures clearly
- No crashes on edge cases (empty image, pure text, etc.)
- Maintains app state if import fails

### 3.5 Security (NFR-005)
- Images processed client-side only (no upload to server)
- No data leaves user's browser
- Sanitize file inputs to prevent XSS
- Limit file size to prevent memory exhaustion

---

## 4. User Interface Requirements

### 4.1 Import Button (UI-001)
**Location**: Toolbar → Geometry section
**Label**: "Import Plan"
**Icon**: Document with arrow up
**Behavior**: Opens import modal

### 4.2 Upload Modal (UI-002)
**Layout**:
```
┌─────────────────────────────────────┐
│  Import Site Plan                 ✕ │
├─────────────────────────────────────┤
│                                     │
│   ┌───────────────────────────┐   │
│   │   Drag image here         │   │
│   │   or click to browse      │   │
│   │                           │   │
│   │   [📁 Browse Files]       │   │
│   └───────────────────────────┘   │
│                                     │
│   Supports: JPG, PNG, PDF          │
│   Max size: 10MB                   │
│                                     │
└─────────────────────────────────────┘
```

### 4.3 Processing View (UI-003)
**Layout**:
```
┌─────────────────────────────────────┐
│  Processing Image...              ✕ │
├─────────────────────────────────────┤
│                                     │
│   [████████░░░░░░░░] 45%           │
│                                     │
│   Current step:                    │
│   Detecting property boundaries... │
│                                     │
│   Steps completed:                 │
│   ✓ Image loaded                   │
│   ✓ Preprocessing complete         │
│   ⟳ Detecting boundaries...        │
│   ○ Extracting dimensions          │
│   ○ Calculating scale              │
│                                     │
└─────────────────────────────────────┘
```

### 4.4 Review & Correction View (UI-004)
**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Review Import                                        ✕ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Original Image  │  │   Detected Shape │           │
│  │                  │  │                  │           │
│  │  [Image with     │  │  [3D preview     │           │
│  │   detected       │  │   with detected  │           │
│  │   boundaries     │  │   shape]         │           │
│  │   highlighted]   │  │                  │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                         │
│  Detected Dimensions:                                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Edge 1: 21.45m  [Confidence: 95%]  [Edit]      │  │
│  │ Edge 2: 50.71m  [Confidence: 88%]  [Edit]      │  │
│  │ Edge 3: 22.09m  [Confidence: 92%]  [Edit]      │  │
│  │ Edge 4: 39.49m  [Confidence: 78%]  [Edit]      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Scale: 1px = 0.042m [Confidence: 91%] [Adjust]       │
│                                                         │
│  ⚠ 1 dimension has low confidence (Edge 4)            │
│                                                         │
│  [Cancel]                    [Import to Canvas]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.5 Error Handling (UI-005)
**Common errors**:
- "No boundary detected - please check image quality"
- "Too few dimensions found - need at least 2 measurements"
- "Scale calculation failed - dimensions may be inconsistent"
- "File too large - max 10MB"
- "Unsupported format - use JPG, PNG, or PDF"

---

## 5. Edge Cases & Error Handling

### 5.1 Image Quality Issues
**Case**: Blurry, low-contrast, or noisy images
**Handling**:
- Show warning: "Image quality is low - results may be inaccurate"
- Provide preprocessing options (contrast adjustment, denoise)
- Allow retry with adjusted settings

### 5.2 No Boundary Detected
**Case**: OpenCV can't find closed polygon
**Handling**:
- Show error with suggestions (check if plan is visible, try cropping)
- Offer manual tracing mode as fallback
- Provide examples of good vs. bad images

### 5.3 Dimension Extraction Failure
**Case**: OCR can't read any dimensions
**Handling**:
- Show warning: "No dimensions detected"
- Allow manual dimension input per edge
- Import shape without scale (user sets later)

### 5.4 Scale Inconsistency
**Case**: Extracted dimensions contradict each other (e.g., image is distorted)
**Handling**:
- Flag inconsistent dimensions with warnings
- Use median scale, ignore outliers
- Allow user to select which dimensions to trust
- Show scale variance percentage

### 5.5 Multiple Shapes in Image
**Case**: Image contains multiple parcels or reference objects
**Handling**:
- Detect all closed polygons
- Let user select which one is the property
- MVP: Only import largest polygon, ignore others

### 5.6 Rotated or Skewed Images
**Case**: Image is at angle or has perspective distortion
**Handling**:
- Auto-detect rotation using Hough lines
- Offer manual rotation slider
- Advanced: Perspective correction (post-MVP)

### 5.7 PDF Files
**Case**: User uploads multi-page PDF or vector PDF
**Handling**:
- MVP: Only process first page, convert to image
- Extract vectors if possible (better accuracy)
- Future: Let user select page

---

## 6. Dependencies & Integration

### 6.1 External Libraries
- **@techstark/opencv-js** (4.x) - Computer vision
  - WASM module (~8MB)
  - Loaded lazily on first import
  - Memory management critical

- **tesseract.js** (5.x) - OCR
  - Worker-based (non-blocking)
  - Language data (~4MB for eng+fra)
  - Loaded lazily

### 6.2 Existing System Integration
- **useDrawingStore** - Add imported shape to store
- **DrawingCanvas** - Render imported shape (no changes needed)
- **ShapeRenderer** - Render as standard polyline
- **History system** - Support undo for import
- **Measurement tools** - Work with imported shapes

### 6.3 New Services Required
- `imageProcessing/opencvSetup.ts` - OpenCV initialization
- `imageProcessing/tesseractSetup.ts` - Tesseract configuration
- `imageProcessing/preprocessor.ts` - Image preprocessing
- `imageProcessing/shapeDetector.ts` - Boundary detection
- `imageProcessing/dimensionExtractor.ts` - OCR processing
- `imageProcessing/dimensionMatcher.ts` - Matching algorithm
- `imageProcessing/scaleCalculator.ts` - Scale computation
- `imageImport/importService.ts` - Orchestration service

### 6.4 New Types
```typescript
interface ImportResult {
  success: boolean;
  shape?: ShapeData;
  error?: string;
  confidence: number;
  warnings: string[];
}

interface DetectedBoundary {
  vertices: Point2D[];
  confidence: number;
}

interface ExtractedDimension {
  value: number;
  unit: string;
  position: Point2D;
  bbox: BoundingBox;
  confidence: number;
}

interface DimensionMatch {
  edgeIndex: number;
  dimension: ExtractedDimension;
  distance: number; // distance from text to edge
}

interface ScaleInfo {
  pixelsPerMeter: number;
  confidence: number;
  variance: number;
}
```

---

## 7. Testing Requirements

### 7.1 Unit Tests (70% coverage minimum)
- `ImagePreprocessor.test.ts` - Preprocessing functions
- `ShapeDetector.test.ts` - Contour detection
- `DimensionExtractor.test.ts` - OCR parsing
- `DimensionMatcher.test.ts` - Matching algorithm
- `ScaleCalculator.test.ts` - Scale calculation

### 7.2 Integration Tests
- Full import pipeline with sample images
- Error handling for each failure mode
- Manual correction workflow
- Undo/redo behavior

### 7.3 Test Images Required
- Simple rectangle (4 sides, clear text) - PASS baseline
- Quadrilateral (trapezoid shape) - PASS 90%
- Pentagon (5 sides) - PASS 85%
- Hexagon (6 sides) - PASS 80%
- Low quality scan - FAIL gracefully
- Rotated image (45°) - PASS with rotation
- Image without dimensions - PARTIAL import
- Image with handwritten dimensions - FAIL with message

### 7.4 Performance Tests
- Processing time for images (500x500 to 5000x5000)
- Memory usage during import
- WASM load time
- UI responsiveness during processing

---

## 8. Open Questions & Ambiguities

### Q1: Multi-Parcel Support?
**Question**: Should MVP support multiple parcels in one image?
**Impact**: High complexity, significant scope increase
**Recommendation**: MVP = single parcel only, add multi-parcel in v2

### Q2: Handwritten Dimensions?
**Question**: Should we support handwritten text?
**Impact**: OCR accuracy drops to 50-60%
**Recommendation**: Exclude from MVP, require typed/printed plans

### Q3: PDF Vector Extraction?
**Question**: Should we extract vectors from PDF instead of rasterizing?
**Impact**: Better accuracy but complex implementation
**Recommendation**: MVP rasterizes PDF, vector extraction in v2

### Q4: Offline Support?
**Question**: Should import work offline?
**Impact**: Must bundle WASM and language data (~12MB)
**Recommendation**: Yes, lazy load on first use, cache for offline

### Q5: Manual Tracing Fallback?
**Question**: If automatic import fails, offer manual tracing mode?
**Impact**: Requires additional UI for tracing over image
**Recommendation**: Yes, Phase 2 feature - simpler than full auto import

---

## 9. Success Metrics

### 9.1 Technical Metrics
- **Accuracy**: 85%+ shapes imported correctly without manual correction
- **Performance**: <15 seconds total processing time
- **Reliability**: <5% failure rate on valid images
- **Coverage**: 70%+ unit test coverage

### 9.2 User Metrics
- **Adoption**: 50%+ of users with existing plans try import feature
- **Satisfaction**: 4+ star rating on feature
- **Completion**: 80%+ of imports completed (not abandoned)
- **Support**: <10% of imports require support tickets

### 9.3 Business Metrics
- **Time Saved**: 90% reduction vs. manual tracing (15 min → 90 sec)
- **Error Reduction**: 80% fewer dimension entry errors
- **Retention**: +20% user retention (users with plans stay longer)

---

## 10. Future Enhancements (Post-MVP)

### Phase 2 Features
- **Manual Tracing Mode**: Overlay image, user traces boundary
- **Multi-Parcel Import**: Detect and import multiple shapes
- **Batch Import**: Process multiple images at once
- **Template Recognition**: Detect common plan layouts

### Phase 3 Features
- **PDF Vector Extraction**: Use actual vector data from PDFs
- **Perspective Correction**: Fix distorted/angled photos
- **Auto-Orientation**: Detect and correct rotation
- **Mobile Camera Capture**: Take photo of plan with phone

### Advanced Features
- **AI Model Training**: Custom model for site plan recognition
- **Historical Plan Database**: Match against known plan formats
- **Collaborative Correction**: Users help improve OCR accuracy
- **Integration with GIS**: Import from geodata sources

---

## 11. Constitution Compliance

### Article 1: Inline Styles Only ✓
All new components use inline styles, no CSS files

### Article 2: TypeScript Strict Mode ✓
All new files use TypeScript with strict type checking

### Article 3: Zustand State Management ✓
Import results added to `useDrawingStore`

### Article 4: React Best Practices ✓
Functional components, hooks, proper error boundaries

### Article 5: 3D Rendering Standards ✓
Imported shapes render using existing Three.js pipeline

### Article 6: Testing Requirements ✓
70%+ unit test coverage for all new services

### Article 7: Security First ✓
Client-side only processing, no data uploaded

### Article 8: Prefer Editing Existing Files ✓
Integrates with existing stores and renderers

### Article 9: Professional UX ✓
Canva-inspired upload UI, smooth animations

---

## 12. Approval & Sign-off

**Specification Author**: Claude (AI Assistant)
**Date**: 2025-10-08
**Status**: Draft - Pending Review

**Reviewers**:
- [ ] Product Owner - Feature scope and requirements
- [ ] Tech Lead - Architecture and feasibility
- [ ] UX Designer - Interface and user flow
- [ ] QA Lead - Testing strategy

**Approved By**:
- [ ] _________________ (Project Lead)
- [ ] _________________ (Development Lead)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-08
**Next Review**: After stakeholder feedback
