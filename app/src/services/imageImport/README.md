# Image Import Services

Orchestration and integration services for the import pipeline.

## Services

- **importService.ts** - Main orchestrator coordinating the entire import pipeline
- **errorHandling.ts** - Error classification and user-friendly messages
- **validationService.ts** - Input validation (file type, size, format)

## Import Pipeline

```
User uploads file
    ↓
Validation (file type, size)
    ↓
Image preprocessing (OpenCV)
    ↓
Shape detection (contour extraction)
    ↓
OCR processing (Tesseract)
    ↓
Dimension matching (geometric algorithm)
    ↓
Scale calculation (pixel-to-meter)
    ↓
Coordinate conversion (2D → 3D)
    ↓
Integration with drawing store
    ↓
Shape rendered in 3D canvas
```

## Usage

```typescript
import { ImportService } from './imageImport';

const service = new ImportService();

const result = await service.importFromImage(
  imageFile,
  {
    onProgress: (progress) => console.log(`${progress.step}: ${progress.progress}%`),
    maxImageSize: 4000,
    minConfidence: 70
  }
);

if (result.success) {
  // Add shape to drawing store
  drawingStore.addShape(result.shape);
}
```

## Error Handling

All errors are classified into user-friendly categories:
- `NO_BOUNDARY_DETECTED` - Shape not found
- `DIMENSION_EXTRACTION_FAILED` - OCR failed
- `SCALE_INCONSISTENT` - Dimensions contradict
- `FILE_TOO_LARGE` - Exceeds size limit
- `UNSUPPORTED_FORMAT` - Wrong file type

## Testing

```bash
npm test -- imageImport
npm test -- integration  # Full pipeline test
```
