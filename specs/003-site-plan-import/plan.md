# Implementation Plan: Site Plan Image Import

**Spec ID**: 003
**Plan Version**: 1.0
**Created**: 2025-10-08
**Estimated Timeline**: 4-6 weeks

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ ImageUploader  │  │ Processing   │  │ Review &       │  │
│  │ Component      │→ │ Progress     │→ │ Correction UI  │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                  Image Import Service Layer                  │
│                  (importService.ts)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Orchestrates entire import pipeline                  │  │
│  │  - Coordinates all processing steps                   │  │
│  │  - Manages state and error handling                   │  │
│  │  - Provides progress callbacks                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   Computer     │  │      OCR        │  │   Geometric    │
│    Vision      │  │   Processing    │  │  Calculation   │
│   Services     │  │   Services      │  │   Services     │
├────────────────┤  ├─────────────────┤  ├────────────────┤
│• Preprocessor  │  │• Dimension      │  │• Dimension     │
│• ShapeDetector │  │  Extractor      │  │  Matcher       │
│• OpenCV Setup  │  │• Tesseract      │  │• Scale         │
│                │  │  Setup          │  │  Calculator    │
└────────────────┘  └─────────────────┘  └────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                ┌────────────▼────────────┐
                │  Integration Layer      │
                │  - useDrawingStore      │
                │  - DrawingCanvas        │
                │  - ShapeRenderer        │
                │  - History System       │
                └─────────────────────────┘
```

### 1.2 Data Flow

```
1. User uploads image
   ↓
2. File validation & preview
   ↓
3. OpenCV.js WASM loads (if not cached)
   ↓
4. Image preprocessing
   - Convert to grayscale
   - Apply bilateral filter
   - Edge detection (Canny)
   - Morphological operations
   ↓
5. Contour detection
   - Find all contours
   - Select largest closed contour
   - Approximate to polygon (Douglas-Peucker)
   - Extract vertices
   ↓
6. Tesseract.js worker starts
   ↓
7. OCR on original image
   - Extract all text with positions
   - Parse dimension patterns
   - Filter by confidence
   ↓
8. Dimension-to-edge matching
   - Calculate edge midpoints
   - Find closest edge for each dimension
   - Validate matches
   ↓
9. Scale calculation
   - Use matched dimensions
   - Calculate pixels-per-meter
   - Detect inconsistencies
   ↓
10. Coordinate conversion
    - Apply scale to vertices
    - Convert to 3D space
    - Center on origin
    ↓
11. Preview in review UI
    - Show original vs detected
    - Allow manual corrections
    ↓
12. User confirms → Add to drawing store
```

---

## 2. Technical Stack & Dependencies

### 2.1 Required Libraries

| Library | Version | Size | Purpose | Load Strategy |
|---------|---------|------|---------|---------------|
| @techstark/opencv-js | 4.x | ~8MB | Computer vision, contour detection | Lazy load on first import |
| tesseract.js | 5.x | ~4MB | OCR for dimension extraction | Lazy load on first import |
| tesseract.js-core | - | Bundled | WASM OCR engine | Auto with tesseract.js |
| eng.traineddata | - | ~2MB | English OCR language | Auto download |
| fra.traineddata | - | ~2MB | French OCR language | Auto download |

**Total bundle increase**: ~16MB (lazy loaded, cached after first use)

### 2.2 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebAssembly | 57+ | 52+ | 11+ | 16+ |
| Web Workers | All | All | All | All |
| FileReader API | All | All | All | All |
| Canvas API | All | All | All | All |

**Minimum**: Chrome 90, Firefox 88, Safari 14, Edge 90

### 2.3 Performance Budget

| Metric | Target | Maximum |
|--------|--------|---------|
| WASM load time | <500ms | 1s |
| Image preprocessing | <3s | 5s |
| OCR processing | <5s | 10s |
| Total processing | <10s | 15s |
| Memory usage | <300MB | 500MB |
| UI frame rate | 60fps | 30fps |

---

## 3. File Structure

```
app/src/
├── components/
│   └── ImageImport/
│       ├── index.ts                          # Barrel exports
│       ├── ImageImporter.tsx                 # Main component
│       ├── UploadZone.tsx                    # Drag-and-drop area
│       ├── ImagePreview.tsx                  # Preview uploaded image
│       ├── ProcessingProgress.tsx            # Progress indicator
│       ├── ReviewCorrection.tsx              # Review & edit UI
│       ├── ImportResults.tsx                 # Success/error display
│       └── __tests__/
│           ├── ImageUploader.test.tsx
│           ├── ProcessingProgress.test.tsx
│           └── ReviewCorrection.test.tsx
│
├── services/
│   ├── imageProcessing/
│   │   ├── index.ts                          # Service exports
│   │   ├── opencvSetup.ts                    # OpenCV initialization
│   │   ├── tesseractSetup.ts                 # Tesseract configuration
│   │   ├── preprocessor.ts                   # Image preprocessing
│   │   ├── shapeDetector.ts                  # Boundary detection
│   │   ├── dimensionExtractor.ts             # OCR & parsing
│   │   ├── dimensionMatcher.ts               # Matching algorithm
│   │   ├── scaleCalculator.ts                # Scale computation
│   │   └── __tests__/
│   │       ├── preprocessor.test.ts
│   │       ├── shapeDetector.test.ts
│   │       ├── dimensionExtractor.test.ts
│   │       ├── dimensionMatcher.test.ts
│   │       └── scaleCalculator.test.ts
│   │
│   └── imageImport/
│       ├── index.ts
│       ├── importService.ts                  # Main orchestrator
│       ├── errorHandling.ts                  # Error classification
│       ├── validationService.ts              # Input validation
│       └── __tests__/
│           ├── importService.test.ts
│           └── integration.test.ts
│
├── types/
│   └── imageImport.ts                        # TypeScript interfaces
│
├── utils/
│   ├── geometryHelpers.ts                    # Geometry utilities
│   └── __tests__/
│       └── geometryHelpers.test.ts
│
├── hooks/
│   └── useImageImport.ts                     # Custom hook for state
│
└── public/
    └── test-images/                          # Sample test images
        ├── simple-rectangle.jpg
        ├── quadrilateral.jpg
        ├── pentagon.jpg
        └── low-quality.jpg
```

---

## 4. Phase-by-Phase Implementation

### Phase 1: Foundation & Setup (Days 1-5)

#### Goals
- Install dependencies
- Create basic UI components
- Setup library initialization
- Validate approach with simple test

#### Deliverables
1. **Dependencies installed** - opencv.js, tesseract.js
2. **Upload component** - Working drag-and-drop
3. **OpenCV setup** - WASM loading with error handling
4. **Tesseract setup** - Worker initialization
5. **Simple test** - Load image, detect edges, show result

#### Success Criteria
- User can upload image and see preview
- OpenCV loads and can process test image
- Tesseract can extract text from test image
- No crashes or errors in console

#### Code Example
```typescript
// app/src/services/imageProcessing/opencvSetup.ts
export class OpenCVSetup {
  private static instance: OpenCVSetup;
  private cvReady = false;

  static getInstance() {
    if (!OpenCVSetup.instance) {
      OpenCVSetup.instance = new OpenCVSetup();
    }
    return OpenCVSetup.instance;
  }

  async initialize(): Promise<void> {
    if (this.cvReady) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.x/opencv.js';
      script.async = true;

      script.onload = () => {
        if (cv.getBuildInformation) {
          this.cvReady = true;
          resolve();
        } else {
          reject(new Error('OpenCV failed to initialize'));
        }
      };

      script.onerror = () => reject(new Error('Failed to load OpenCV'));
      document.body.appendChild(script);
    });
  }

  isReady(): boolean {
    return this.cvReady;
  }
}
```

---

### Phase 2: Computer Vision Pipeline (Days 6-12)

#### Goals
- Implement image preprocessing
- Build shape detection system
- Test with various image types

#### Deliverables
1. **Preprocessing service** - Grayscale, filtering, edge detection
2. **Shape detector** - Contour detection, polygon approximation
3. **Vertex extraction** - Get coordinates from detected shape
4. **Visual feedback** - Show detected boundary overlay
5. **Unit tests** - 70%+ coverage

#### Success Criteria
- Detects rectangles with 95% accuracy
- Detects quadrilaterals with 90% accuracy
- Detects 5-10 sided polygons with 80% accuracy
- Handles edge cases gracefully (no shape, multiple shapes)

#### Code Example
```typescript
// app/src/services/imageProcessing/shapeDetector.ts
export class ShapeDetector {
  detectBoundary(processedMat: any): DetectedBoundary {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
      // Find contours
      cv.findContours(
        processedMat,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      // Find largest contour
      let maxArea = 0;
      let maxContourIndex = -1;

      for (let i = 0; i < contours.size(); i++) {
        const area = cv.contourArea(contours.get(i));
        if (area > maxArea) {
          maxArea = area;
          maxContourIndex = i;
        }
      }

      if (maxContourIndex === -1) {
        throw new Error('No contours detected');
      }

      // Get largest contour
      const largestContour = contours.get(maxContourIndex);

      // Approximate to polygon
      const perimeter = cv.arcLength(largestContour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(
        largestContour,
        approx,
        0.02 * perimeter,
        true
      );

      // Extract vertices
      const vertices = this.extractVertices(approx);
      const confidence = this.calculateConfidence(approx, largestContour);

      // Cleanup
      approx.delete();
      contours.delete();
      hierarchy.delete();

      return {
        vertices,
        confidence
      };

    } catch (error) {
      contours.delete();
      hierarchy.delete();
      throw error;
    }
  }

  private extractVertices(approxPoly: any): Point2D[] {
    const vertices: Point2D[] = [];
    for (let i = 0; i < approxPoly.rows; i++) {
      vertices.push({
        x: approxPoly.data32S[i * 2],
        y: approxPoly.data32S[i * 2 + 1]
      });
    }
    return vertices;
  }

  private calculateConfidence(approx: any, original: any): number {
    // Calculate how well approximation matches original
    const approxArea = cv.contourArea(approx);
    const originalArea = cv.contourArea(original);
    return Math.min((approxArea / originalArea) * 100, 100);
  }
}
```

---

### Phase 3: OCR & Dimension Extraction (Days 13-19)

#### Goals
- Implement OCR processing
- Parse dimension text patterns
- Extract position data

#### Deliverables
1. **Tesseract service** - Worker-based OCR
2. **Dimension parser** - Regex patterns for numbers + units
3. **Label detector** - Identify non-dimension text
4. **Confidence filtering** - Remove low-confidence results
5. **Unit tests** - Test dimension parsing logic

#### Success Criteria
- Extracts dimensions like "21.45m", "50ft" with 90%+ accuracy
- Correctly identifies dimension position
- Handles decimal numbers and different units
- Filters out non-dimension text

#### Code Example
```typescript
// app/src/services/imageProcessing/dimensionExtractor.ts
export class DimensionExtractor {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    this.worker = await createWorker('eng+fra');
    await this.worker.setParameters({
      tessedit_char_whitelist: '0123456789.,mftydFTYD CHEMIN',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO
    });
  }

  async extractDimensions(imageFile: File): Promise<ExtractedDimension[]> {
    if (!this.worker) {
      throw new Error('Tesseract worker not initialized');
    }

    const { data } = await this.worker.recognize(imageFile);

    const textRegions = data.words.map(word => ({
      text: word.text,
      confidence: word.confidence,
      bbox: {
        x0: word.bbox.x0,
        y0: word.bbox.y0,
        x1: word.bbox.x1,
        y1: word.bbox.y1
      },
      center: {
        x: word.bbox.x0 + (word.bbox.x1 - word.bbox.x0) / 2,
        y: word.bbox.y0 + (word.bbox.y1 - word.bbox.y0) / 2
      }
    }));

    return this.parseDimensions(textRegions);
  }

  private parseDimensions(textRegions: any[]): ExtractedDimension[] {
    const dimensions: ExtractedDimension[] = [];

    // Patterns for different formats
    const patterns = [
      /(\d+\.?\d*)\s*m(?:eters?)?/i,  // 21.45m, 21.45 meters
      /(\d+\.?\d*)\s*ft|feet/i,        // 50ft, 50 feet
      /(\d+\.?\d*)\s*yd|yards?/i       // 30yd, 30 yards
    ];

    textRegions.forEach(region => {
      if (region.confidence < 70) return; // Skip low confidence

      for (const pattern of patterns) {
        const match = region.text.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          const unit = this.extractUnit(region.text);

          dimensions.push({
            value,
            unit,
            position: region.center,
            bbox: region.bbox,
            confidence: region.confidence
          });
          break;
        }
      }
    });

    return dimensions;
  }

  private extractUnit(text: string): string {
    if (/m(?:eters?)?/i.test(text)) return 'm';
    if (/ft|feet/i.test(text)) return 'ft';
    if (/yd|yards?/i.test(text)) return 'yd';
    return 'm'; // default
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
```

---

### Phase 4: Intelligent Matching (Days 20-26)

#### Goals
- Match dimensions to polygon edges
- Handle ambiguous cases
- Validate matches

#### Deliverables
1. **Matching algorithm** - Distance-based edge assignment
2. **Conflict detection** - Multiple dimensions per edge
3. **Validation** - Geometric consistency checks
4. **Visual indicators** - Show matches in UI
5. **Unit tests** - Test matching logic

#### Success Criteria
- Correctly matches 90%+ dimensions to edges
- Detects and flags conflicts
- Handles corner cases (dimensions at vertices)
- Performance: <100ms for typical case

#### Code Example
```typescript
// app/src/services/imageProcessing/dimensionMatcher.ts
export class DimensionMatcher {
  matchDimensionsToEdges(
    vertices: Point2D[],
    dimensions: ExtractedDimension[]
  ): DimensionMatch[] {
    const edges = this.calculateEdges(vertices);
    const matches: DimensionMatch[] = [];

    dimensions.forEach(dim => {
      const closestEdge = this.findClosestEdge(dim.position, edges);

      matches.push({
        edgeIndex: closestEdge.index,
        dimension: dim,
        distance: closestEdge.distance
      });
    });

    // Detect conflicts (multiple dims per edge)
    this.detectConflicts(matches);

    return matches;
  }

  private calculateEdges(vertices: Point2D[]): Edge[] {
    return vertices.map((v, i) => {
      const next = vertices[(i + 1) % vertices.length];
      return {
        index: i,
        start: v,
        end: next,
        midpoint: {
          x: (v.x + next.x) / 2,
          y: (v.y + next.y) / 2
        },
        length: Math.hypot(next.x - v.x, next.y - v.y),
        angle: Math.atan2(next.y - v.y, next.x - v.x)
      };
    });
  }

  private findClosestEdge(
    position: Point2D,
    edges: Edge[]
  ): { index: number; distance: number } {
    let minDist = Infinity;
    let closestIndex = -1;

    edges.forEach((edge, index) => {
      const dist = this.pointToSegmentDistance(
        position,
        edge.start,
        edge.end
      );

      if (dist < minDist) {
        minDist = dist;
        closestIndex = index;
      }
    });

    return { index: closestIndex, distance: minDist };
  }

  private pointToSegmentDistance(
    point: Point2D,
    segStart: Point2D,
    segEnd: Point2D
  ): number {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return Math.hypot(point.x - segStart.x, point.y - segStart.y);
    }

    let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const projX = segStart.x + t * dx;
    const projY = segStart.y + t * dy;

    return Math.hypot(point.x - projX, point.y - projY);
  }

  private detectConflicts(matches: DimensionMatch[]): void {
    const edgeMap = new Map<number, DimensionMatch[]>();

    matches.forEach(match => {
      if (!edgeMap.has(match.edgeIndex)) {
        edgeMap.set(match.edgeIndex, []);
      }
      edgeMap.get(match.edgeIndex)!.push(match);
    });

    // Flag edges with multiple different dimensions
    edgeMap.forEach((edgeMatches, edgeIndex) => {
      if (edgeMatches.length > 1) {
        const values = edgeMatches.map(m => m.dimension.value);
        const unique = new Set(values);

        if (unique.size > 1) {
          console.warn(`Edge ${edgeIndex} has conflicting dimensions:`, values);
        }
      }
    });
  }
}
```

---

### Phase 5: Scale & Coordinates (Days 27-31)

#### Goals
- Calculate pixel-to-meter scale
- Convert coordinates to 3D space
- Handle scale inconsistencies

#### Deliverables
1. **Scale calculator** - Multi-dimension averaging
2. **Coordinate converter** - Pixel to meter transformation
3. **Inconsistency detection** - Flag scale variations
4. **Unit tests** - Test scale calculation accuracy

#### Success Criteria
- Scale calculation accurate within 5%
- Handles 2-10 dimensions robustly
- Detects inconsistencies >10%
- Performance: <10ms

---

### Phase 6: Integration & Shape Creation (Days 32-36)

#### Goals
- Connect to existing drawing system
- Create importable shapes
- Support undo/redo

#### Deliverables
1. **Import service** - Orchestrates entire pipeline
2. **Store integration** - Add shapes to useDrawingStore
3. **History support** - Undo/redo for imports
4. **Metadata** - Preserve import data on shapes

#### Success Criteria
- Imported shapes work with all existing tools
- Undo/redo functions correctly
- No regression in existing features

---

### Phase 7: UI & User Experience (Days 37-42)

#### Goals
- Create polished upload interface
- Build review/correction UI
- Add error handling

#### Deliverables
1. **Upload modal** - Drag-and-drop with preview
2. **Progress indicator** - Step-by-step feedback
3. **Review UI** - Side-by-side comparison
4. **Error messages** - Clear, actionable feedback
5. **Toolbar integration** - Import button

#### Success Criteria
- User can complete import without confusion
- Errors are understandable
- UI matches Canva-inspired design system

---

## 5. Testing Strategy

### 5.1 Unit Tests (70%+ coverage)

**Services to test**:
- `preprocessor.ts` - Each preprocessing function
- `shapeDetector.ts` - Contour detection, polygon approximation
- `dimensionExtractor.ts` - OCR parsing, dimension patterns
- `dimensionMatcher.ts` - Matching algorithm, distance calculations
- `scaleCalculator.ts` - Scale computation, variance detection
- `importService.ts` - Pipeline orchestration, error handling

**Example test**:
```typescript
describe('ShapeDetector', () => {
  let detector: ShapeDetector;

  beforeEach(() => {
    detector = new ShapeDetector();
  });

  it('should detect rectangle from simple image', () => {
    const testImage = loadTestImage('simple-rectangle.jpg');
    const processed = preprocessImage(testImage);

    const result = detector.detectBoundary(processed);

    expect(result.vertices).toHaveLength(4);
    expect(result.confidence).toBeGreaterThan(90);
  });

  it('should handle image with no shapes', () => {
    const blankImage = createBlankImage();
    const processed = preprocessImage(blankImage);

    expect(() => {
      detector.detectBoundary(processed);
    }).toThrow('No contours detected');
  });
});
```

### 5.2 Integration Tests

**Test scenarios**:
1. **Happy path** - Simple rectangle, clear dimensions
2. **Complex shape** - Hexagon with 6 dimensions
3. **Partial data** - Shape detected but no dimensions
4. **Poor quality** - Blurry image, test graceful degradation
5. **Rotated image** - Test rotation handling
6. **Multiple shapes** - Test largest shape selection

### 5.3 Performance Tests

**Metrics to measure**:
- WASM load time (target: <500ms)
- Preprocessing time vs. image size
- OCR time vs. text complexity
- Memory usage during processing
- UI responsiveness (should stay >30fps)

### 5.4 Manual Testing

**Test images needed**:
1. Simple rectangle (baseline - must pass)
2. Quadrilateral/trapezoid (common case)
3. Pentagon, hexagon (complex shapes)
4. Low quality scan (error handling)
5. Rotated 45° (rotation handling)
6. No dimensions (partial import)
7. Multiple parcels (ambiguity handling)

---

## 6. Risk Management

### 6.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenCV.js performance too slow | Medium | High | Optimize preprocessing, use Web Workers, progressive feedback |
| OCR accuracy below target | High | Medium | Add manual correction UI, allow dimension input |
| Bundle size too large | Medium | Medium | Lazy load libraries, cache aggressively |
| Memory leaks in WASM | Medium | High | Proper cleanup, memory profiling, leak detection |
| Browser compatibility issues | Low | Medium | Polyfills, graceful degradation, clear requirements |

### 6.2 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User uploads poor quality images | High | Medium | Provide guidelines, show examples, preprocessing options |
| User confused by errors | Medium | High | Clear error messages, contextual help, examples |
| Import takes too long | Medium | High | Progressive feedback, background processing, time estimates |
| Results require too much correction | High | Medium | Smart defaults, easy correction UI, "good enough" threshold |

### 6.3 Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | High | Strict MVP definition, parking lot for v2 features |
| Timeline overrun | Medium | Medium | Buffer time, regular check-ins, agile adjustments |
| Resource availability | Low | Medium | Clear documentation, pairing sessions |

---

## 7. Performance Optimization

### 7.1 Bundle Size Optimization
- **Lazy load** OpenCV.js and Tesseract.js (load on first use)
- **Cache** WASM modules in service worker
- **CDN** for library assets
- **Code splitting** for import components

### 7.2 Processing Optimization
- **Web Workers** for non-blocking processing
- **Progressive feedback** to keep UI responsive
- **Throttle** real-time preview updates
- **Optimize** OpenCV parameters (smaller kernels, fewer iterations)

### 7.3 Memory Optimization
- **Cleanup** cv.Mat objects immediately after use
- **Limit** image size (scale down if too large)
- **Monitor** memory usage with Performance API
- **Detect** memory leaks in development

---

## 8. Deployment & Rollout

### 8.1 Feature Flags
```typescript
const features = {
  imageImport: process.env.REACT_APP_IMAGE_IMPORT === 'true',
  imageImportPDF: process.env.REACT_APP_IMAGE_IMPORT_PDF === 'true',
  imageImportAdvanced: process.env.REACT_APP_IMAGE_IMPORT_ADVANCED === 'true'
};
```

### 8.2 Rollout Phases

**Phase 1: Internal Testing (Week 1)**
- Dev team only
- Fix critical bugs
- Performance tuning

**Phase 2: Beta Users (Week 2-3)**
- Invite 10-20 users
- Collect feedback
- Monitor errors

**Phase 3: Public Release (Week 4)**
- All users
- Monitor adoption
- Support tickets

### 8.3 Success Metrics
- **Adoption rate**: 50%+ users try feature within first month
- **Completion rate**: 80%+ imports completed successfully
- **Error rate**: <5% failures
- **Support tickets**: <10% of imports require help

---

## 9. Documentation Requirements

### 9.1 User Documentation
- **Getting Started** guide with examples
- **Supported Formats** and quality requirements
- **Troubleshooting** common issues
- **Video tutorial** showing import process

### 9.2 Developer Documentation
- **Architecture** overview and data flow
- **API Reference** for all services
- **Contributing** guide for extending feature
- **Testing** guide with sample images

---

## 10. Future Enhancements

### Post-MVP Priorities

**Quick Wins** (1-2 weeks each):
1. Manual tracing mode (fallback for failed auto-import)
2. Batch import (multiple images)
3. PDF vector extraction (better than raster)

**Medium Features** (3-4 weeks each):
4. Multi-parcel support (detect multiple shapes)
5. Perspective correction (fix distorted photos)
6. Template recognition (common plan formats)

**Advanced Features** (6+ weeks):
7. Custom AI model training
8. Mobile camera capture
9. GIS integration

---

**Plan Version**: 1.0
**Last Updated**: 2025-10-08
**Next Review**: After Phase 1 completion
