# ImageImport Components

React components for the site plan image import feature.

## Components

- **ImageImporter.tsx** - Main modal component orchestrating the import workflow
- **UploadZone.tsx** - Drag-and-drop file upload zone with validation
- **ImagePreview.tsx** - Preview of uploaded image with zoom controls
- **ProcessingProgress.tsx** - Step-by-step progress indicator during processing
- **ReviewCorrection.tsx** - UI for reviewing and manually correcting detected shapes/dimensions
- **ImportResults.tsx** - Success/error display after import completion

## Usage

```tsx
import { ImageImporter } from './ImageImport';

<ImageImporter
  isOpen={isOpen}
  onClose={handleClose}
  onImportComplete={handleImportComplete}
/>
```

## Design Philosophy

All components follow the Canva-inspired design system:
- Inline styles only (no CSS files)
- 8-12px border radius for friendly appearance
- Smooth 200ms transitions
- Clear visual hierarchy with proper spacing
- Nunito Sans typography

## Testing

Run component tests:
```bash
npm test -- ImageImport
```
