# Image Processing Services

Computer vision and OCR services for site plan image import.

## Services

### Core Processing
- **opencvSetup.ts** - OpenCV.js initialization and WASM loading singleton
- **tesseractSetup.ts** - Tesseract.js worker configuration for OCR
- **preprocessor.ts** - Image preprocessing (grayscale, filtering, edge detection)
- **shapeDetector.ts** - Boundary detection using contour extraction and polygon approximation
- **dimensionExtractor.ts** - OCR processing and dimension text parsing
- **dimensionMatcher.ts** - Intelligent matching of dimensions to polygon edges
- **scaleCalculator.ts** - Scale calculation from known dimensions

### Key Technologies
- **OpenCV.js** (~8MB) - Computer vision library (WASM)
- **Tesseract.js** (~4MB) - OCR engine (Web Worker based)

## Critical: Memory Management

⚠️ **All OpenCV cv.Mat objects MUST be explicitly deleted:**

```typescript
const mat = new cv.Mat();
try {
  // Use mat
} finally {
  mat.delete(); // ALWAYS clean up
}
```

Memory leaks in WASM will crash the browser!

## Usage Example

```typescript
import { opencv } from './opencvSetup';
import { preprocessor } from './preprocessor';
import { shapeDetector } from './shapeDetector';

// Initialize
await opencv.initialize();

// Process image
const processed = await preprocessor.prepareImage(imageFile);
const boundary = shapeDetector.detectBoundary(processed);

// Always cleanup
processed.delete();
```

## Testing

```bash
npm test -- imageProcessing
npm test -- preprocessor
npm test -- shapeDetector
```
