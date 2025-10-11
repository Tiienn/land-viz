# Task Breakdown: Site Plan Image Import

**Spec ID**: 003
**Total Estimated Time**: 21-29 days (4-6 weeks)
**Created**: 2025-10-08

---

## Task Organization

Tasks are organized by phase with time estimates, dependencies, and validation criteria.

**Legend**:
- ⏱️ Time estimate (hours or days)
- 🔗 Dependencies
- ✅ Validation criteria
- 💡 Implementation notes

---

## Phase 1: Foundation & Setup

**Total Time**: 2-3 days

### Task 1.1: Install Dependencies
⏱️ **30 minutes**
🔗 Dependencies: None

**Subtasks**:
```bash
cd app
npm install @techstark/opencv-js tesseract.js
```

✅ **Validation**:
- [ ] Packages appear in package.json
- [ ] No installation errors
- [ ] npm run dev still works

---

### Task 1.2: Create Directory Structure
⏱️ **15 minutes**
🔗 Dependencies: None

**Subtasks**:
```bash
mkdir -p app/src/components/ImageImport
mkdir -p app/src/services/imageProcessing
mkdir -p app/src/services/imageImport
mkdir -p app/public/test-images
```

✅ **Validation**:
- [ ] All directories exist
- [ ] README.md in each service directory explaining purpose

💡 **Note**: Create index.ts barrel files for clean imports

---

### Task 1.3: Create TypeScript Types
⏱️ **1 hour**
🔗 Dependencies: 1.2

**File**: `app/src/types/imageImport.ts`

**Code**:
```typescript
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface DetectedBoundary {
  vertices: Point2D[];
  confidence: number;
  area?: number;
}

export interface ExtractedDimension {
  value: number;
  unit: 'm' | 'ft' | 'yd';
  position: Point2D;
  bbox: BoundingBox;
  confidence: number;
  text?: string;
}

export interface Edge {
  index: number;
  start: Point2D;
  end: Point2D;
  midpoint: Point2D;
  length: number;
  angle: number;
}

export interface DimensionMatch {
  edgeIndex: number;
  dimension: ExtractedDimension;
  distance: number;
}

export interface ScaleInfo {
  pixelsPerMeter: number;
  confidence: number;
  variance: number;
  matchCount: number;
}

export interface ImportProgress {
  step: 'upload' | 'preprocess' | 'detect' | 'ocr' | 'match' | 'scale' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface ImportResult {
  success: boolean;
  shape?: {
    id: string;
    type: 'polyline';
    points: Point3D[];
    metadata: ImportMetadata;
  };
  error?: string;
  warnings: string[];
}

export interface ImportMetadata {
  source: 'image_import';
  originalImage: string;
  detectedBoundary: DetectedBoundary;
  dimensions: DimensionMatch[];
  scale: ScaleInfo;
  timestamp: number;
}

export interface ProcessingOptions {
  maxImageSize?: number;
  preprocessingLevel?: 'low' | 'medium' | 'high';
  ocrLanguages?: string[];
  polygonEpsilon?: number;
  minConfidence?: number;
}
```

✅ **Validation**:
- [ ] File compiles without errors
- [ ] All interfaces exported
- [ ] JSDoc comments added for complex types

---

### Task 1.4: Setup OpenCV.js Initialization
⏱️ **2 hours**
🔗 Dependencies: 1.1, 1.2, 1.3

**File**: `app/src/services/imageProcessing/opencvSetup.ts`

**Implementation**:
```typescript
import { logger } from '../../utils/logger';

declare global {
  interface Window {
    cv: any;
  }
}

export class OpenCVSetup {
  private static instance: OpenCVSetup;
  private cvReady = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): OpenCVSetup {
    if (!OpenCVSetup.instance) {
      OpenCVSetup.instance = new OpenCVSetup();
    }
    return OpenCVSetup.instance;
  }

  async initialize(): Promise<void> {
    if (this.cvReady) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.cv && window.cv.getBuildInformation) {
        this.cvReady = true;
        logger.info('OpenCV already loaded');
        resolve();
        return;
      }

      logger.info('Loading OpenCV.js...');

      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      script.async = true;

      script.onload = () => {
        // OpenCV needs time to initialize
        const checkReady = setInterval(() => {
          if (window.cv && window.cv.getBuildInformation) {
            clearInterval(checkReady);
            this.cvReady = true;
            logger.info('OpenCV loaded successfully');
            logger.info(window.cv.getBuildInformation());
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkReady);
          reject(new Error('OpenCV initialization timeout'));
        }, 10000);
      };

      script.onerror = (error) => {
        logger.error('Failed to load OpenCV', error);
        reject(new Error('Failed to load OpenCV script'));
      };

      document.body.appendChild(script);
    });

    return this.loadPromise;
  }

  isReady(): boolean {
    return this.cvReady;
  }

  getCV(): any {
    if (!this.cvReady) {
      throw new Error('OpenCV not initialized. Call initialize() first.');
    }
    return window.cv;
  }
}

export const opencv = OpenCVSetup.getInstance();
```

✅ **Validation**:
- [ ] Can load OpenCV successfully
- [ ] Handles already-loaded case
- [ ] Timeout works (test by blocking network)
- [ ] Singleton pattern works
- [ ] Logs appropriate messages

💡 **Testing**:
```typescript
// Manual test in browser console
import { opencv } from './opencvSetup';

opencv.initialize()
  .then(() => console.log('OpenCV ready:', opencv.isReady()))
  .catch(err => console.error('Failed:', err));
```

---

### Task 1.5: Setup Tesseract.js Configuration
⏱️ **2 hours**
🔗 Dependencies: 1.1, 1.2, 1.3

**File**: `app/src/services/imageProcessing/tesseractSetup.ts`

**Implementation**:
```typescript
import { createWorker, Worker, PSM } from 'tesseract.js';
import { logger } from '../../utils/logger';

export class TesseractSetup {
  private static instance: TesseractSetup;
  private worker: Worker | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): TesseractSetup {
    if (!TesseractSetup.instance) {
      TesseractSetup.instance = new TesseractSetup();
    }
    return TesseractSetup.instance;
  }

  async initialize(languages: string[] = ['eng', 'fra']): Promise<void> {
    if (this.initialized && this.worker) {
      return;
    }

    try {
      logger.info('Initializing Tesseract worker...');

      this.worker = await createWorker(languages.join('+'), 1, {
        logger: (m) => logger.debug('Tesseract:', m)
      });

      // Configure for dimension recognition
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789.,mftydFTYD CHEMIN',
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: '1'
      });

      this.initialized = true;
      logger.info('Tesseract worker initialized');

    } catch (error) {
      logger.error('Failed to initialize Tesseract', error);
      throw new Error('Failed to initialize OCR engine');
    }
  }

  getWorker(): Worker {
    if (!this.worker || !this.initialized) {
      throw new Error('Tesseract not initialized. Call initialize() first.');
    }
    return this.worker;
  }

  isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
      logger.info('Tesseract worker terminated');
    }
  }
}

export const tesseract = TesseractSetup.getInstance();
```

✅ **Validation**:
- [ ] Worker initializes successfully
- [ ] Can terminate and reinitialize
- [ ] Parameters are set correctly
- [ ] Handles errors gracefully

---

### Task 1.6: Create Basic Upload Component
⏱️ **3 hours**
🔗 Dependencies: 1.2, 1.3

**File**: `app/src/components/ImageImport/UploadZone.tsx`

**Implementation**:
```typescript
import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'application/pdf']
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Unsupported file type. Please use JPG, PNG, or PDF.`;
    }

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return `File too large. Maximum size is ${maxMB}MB.`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed #3b82f6' : '2px dashed #e5e7eb',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#eff6ff' : '#ffffff',
          transition: 'all 0.2s ease'
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDragging ? '#3b82f6' : '#9ca3af'}
          strokeWidth="2"
          style={{ margin: '0 auto 16px' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
          Drag site plan image here
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
          or click to browse files
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          Supports: JPG, PNG, PDF (max {Math.round(maxSize / (1024 * 1024))}MB)
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};
```

✅ **Validation**:
- [ ] Drag-and-drop works
- [ ] Click to browse works
- [ ] File validation works (size, type)
- [ ] Error messages display correctly
- [ ] Visual feedback for drag state

---

## Phase 1 Summary

**Estimated time**: 2-3 days
**Deliverables**:
- ✅ Dependencies installed
- ✅ TypeScript types defined
- ✅ OpenCV.js setup and loading
- ✅ Tesseract.js worker configuration
- ✅ Basic upload UI component

**Phase 1 Validation**:
```bash
# Run this test before moving to Phase 2
npm test -- imageImport
```

Should show:
- All setup tests passing
- Can load OpenCV
- Can initialize Tesseract
- Upload component renders

---

## Phase 2: Computer Vision Pipeline

**Total Time**: 3-4 days

### Task 2.1: Implement Image Preprocessor
⏱️ **4 hours**
🔗 Dependencies: 1.4, 1.5

**File**: `app/src/services/imageProcessing/preprocessor.ts`

**Implementation**: See plan.md Phase 2 for full code

**Key functions**:
- `prepareImage(file: File): Promise<cv.Mat>`
- `convertToGrayscale(src: cv.Mat): cv.Mat`
- `applyBilateralFilter(src: cv.Mat): cv.Mat`
- `detectEdges(src: cv.Mat): cv.Mat`
- `morphologicalClose(src: cv.Mat): cv.Mat`

✅ **Validation**:
- [ ] Each function has unit test
- [ ] Properly cleans up cv.Mat objects
- [ ] Handles errors gracefully
- [ ] Visual output looks correct

---

### Task 2.2: Implement Shape Detector
⏱️ **6 hours**
🔗 Dependencies: 2.1

**File**: `app/src/services/imageProcessing/shapeDetector.ts`

**Key functions**:
- `detectBoundary(processed: cv.Mat): DetectedBoundary`
- `findLargestContour(contours: cv.MatVector): cv.Mat`
- `approximatePolygon(contour: cv.Mat, epsilon: number): cv.Mat`
- `extractVertices(approx: cv.Mat): Point2D[]`
- `calculateConfidence(approx: cv.Mat, original: cv.Mat): number`

✅ **Validation**:
- [ ] Detects rectangles (4 vertices) correctly
- [ ] Detects quadrilaterals correctly
- [ ] Detects 5-10 sided polygons
- [ ] Returns confidence score
- [ ] Handles no-shape case

---

### Task 2.3: Create Test Image Suite
⏱️ **2 hours**
🔗 Dependencies: None

**Create test images**:
1. `simple-rectangle.jpg` - 4 sides, 90° corners, clear
2. `quadrilateral.jpg` - 4 sides, non-rectangular
3. `pentagon.jpg` - 5 sides
4. `hexagon.jpg` - 6 sides
5. `low-quality.jpg` - Blurry/noisy
6. `rotated-45.jpg` - Rotated plan
7. `no-dimensions.jpg` - Shape but no text
8. `multiple-shapes.jpg` - Multiple parcels

✅ **Validation**:
- [ ] All images in `public/test-images/`
- [ ] README documenting each image's purpose
- [ ] Each image has expected output documented

---

### Task 2.4: Write Computer Vision Tests
⏱️ **4 hours**
🔗 Dependencies: 2.1, 2.2, 2.3

**Files**:
- `preprocessor.test.ts`
- `shapeDetector.test.ts`

✅ **Validation**:
- [ ] 70%+ coverage
- [ ] All test images tested
- [ ] Edge cases covered
- [ ] Performance benchmarks

---

## Phase 2 Summary

**Estimated time**: 3-4 days
**Key milestone**: Can detect shapes from images

---

## Phase 3-7 Task Breakdown

[Continue with similar detailed breakdowns for remaining phases...]

---

## Quick Reference: Commands

### Development
```bash
npm run dev                    # Start dev server
npm test                       # Run all tests
npm test -- imageImport       # Test image import only
```

### Testing Individual Components
```bash
npm test -- preprocessor      # Test preprocessing
npm test -- shapeDetector     # Test shape detection
npm test -- dimensionExtractor # Test OCR
```

### Build
```bash
npm run build                 # Production build
npm run analyze               # Analyze bundle size
```

---

## Progress Tracking

Update this checklist as you complete tasks:

### Phase 1: Foundation ✓
- [x] Task 1.1: Install dependencies
- [ ] Task 1.2: Create directory structure
- [ ] Task 1.3: Create TypeScript types
- [ ] Task 1.4: Setup OpenCV.js
- [ ] Task 1.5: Setup Tesseract.js
- [ ] Task 1.6: Create upload component

### Phase 2: Computer Vision
- [ ] Task 2.1: Image preprocessor
- [ ] Task 2.2: Shape detector
- [ ] Task 2.3: Test image suite
- [ ] Task 2.4: CV tests

### Phase 3: OCR
- [ ] Task 3.1: Dimension extractor
- [ ] Task 3.2: Label detector
- [ ] Task 3.3: OCR tests

### Phase 4: Matching
- [ ] Task 4.1: Dimension matcher
- [ ] Task 4.2: Conflict detection
- [ ] Task 4.3: Matching tests

### Phase 5: Scale & Coordinates
- [ ] Task 5.1: Scale calculator
- [ ] Task 5.2: Coordinate converter
- [ ] Task 5.3: Scale tests

### Phase 6: Integration
- [ ] Task 6.1: Import service
- [ ] Task 6.2: Store integration
- [ ] Task 6.3: History support
- [ ] Task 6.4: Integration tests

### Phase 7: UI
- [ ] Task 7.1: Upload modal
- [ ] Task 7.2: Processing progress
- [ ] Task 7.3: Review UI
- [ ] Task 7.4: Error handling
- [ ] Task 7.5: Toolbar integration

---

**Document Version**: 1.0
**Last Updated**: 2025-10-08
