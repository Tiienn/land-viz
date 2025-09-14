# Task List: Export Functionality

**Feature:** Multi-Format Export System
**Plan:** [plan.md](./plan.md)
**Date:** January 2025

## Prerequisites
- [x] Development environment ready (port 5173)
- [x] Project running without errors
- [ ] Install export dependencies
- [ ] Review existing ExportSettingsDialog component

## Phase 1: Foundation Tasks (2 hours)

### Task 1.1: Install Dependencies
**Estimated Time:** 15 minutes

```bash
cd app
npm install xlsx jspdf jspdf-autotable dxf-writer
npm install --save-dev @types/jspdf
```

### Task 1.2: Define Export Types
**File:** `src/types/index.ts`
**Estimated Time:** 30 minutes

```typescript
// Add to existing types
export interface ExportOptions {
  format: 'excel' | 'dxf' | 'pdf' | 'geojson';
  includeMetadata: boolean;
  units: 'metric' | 'imperial';
  precision: number;
  pageSize?: 'A4' | 'letter';
  dxfVersion?: string;
}

export interface ExportProgress {
  inProgress: boolean;
  progress: number;
  message: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  error?: string;
}
```

### Task 1.3: Update Store
**File:** `src/store/useAppStore.ts`
**Estimated Time:** 45 minutes

- [ ] Add export state properties
- [ ] Add export actions
- [ ] Add progress tracking
- [ ] Test store updates

```typescript
// Add to store
exportProgress: {
  inProgress: false,
  progress: 0,
  message: ''
},
setExportProgress: (progress: ExportProgress) => set({ exportProgress: progress }),
exportShapes: async (options: ExportOptions) => { /* implementation */ }
```

### Task 1.4: Create Export Service Base
**File:** `src/services/exportService.ts`
**Estimated Time:** 30 minutes

```typescript
import { Shape } from '@/types';
import { ExportOptions, ExportResult } from '@/types';

export class ExportService {
  static async export(shapes: Shape[], options: ExportOptions): Promise<ExportResult> {
    switch (options.format) {
      case 'excel':
        return await this.exportToExcel(shapes, options);
      case 'dxf':
        return await this.exportToDXF(shapes, options);
      case 'pdf':
        return await this.exportToPDF(shapes, options);
      case 'geojson':
        return await this.exportToGeoJSON(shapes, options);
    }
  }

  // Stub methods for each format
}
```

## Phase 2: Excel Export Tasks (3 hours)

### Task 2.1: Create Excel Export Service
**File:** `src/services/export/excelExport.ts`
**Estimated Time:** 90 minutes

- [ ] Import xlsx library
- [ ] Create workbook structure
- [ ] Add summary sheet
- [ ] Add details sheet
- [ ] Add coordinates sheet
- [ ] Format cells and borders
- [ ] Add metadata

### Task 2.2: Excel Data Formatting
**File:** `src/services/export/excelExport.ts`
**Estimated Time:** 60 minutes

- [ ] Convert shapes to rows
- [ ] Calculate totals
- [ ] Format numbers
- [ ] Add units
- [ ] Handle different shape types

### Task 2.3: Test Excel Export
**File:** `src/test/excelExport.test.ts`
**Estimated Time:** 30 minutes

- [ ] Test with sample shapes
- [ ] Verify calculations
- [ ] Check formatting
- [ ] Test edge cases

## Phase 3: DXF Export Tasks (3 hours)

### Task 3.1: Create DXF Export Service
**File:** `src/services/export/dxfExport.ts`
**Estimated Time:** 90 minutes

- [ ] Setup DXF writer
- [ ] Convert coordinate system
- [ ] Create layers
- [ ] Add entities

### Task 3.2: Shape to DXF Conversion
**File:** `src/services/export/dxfExport.ts`
**Estimated Time:** 60 minutes

- [ ] Rectangle to POLYLINE
- [ ] Circle to CIRCLE
- [ ] Polyline to LWPOLYLINE
- [ ] Add dimensions

### Task 3.3: Test DXF Export
**File:** `src/test/dxfExport.test.ts`
**Estimated Time:** 30 minutes

- [ ] Validate DXF structure
- [ ] Test in CAD viewer
- [ ] Check coordinate accuracy

## Phase 4: PDF Export Tasks (3 hours)

### Task 4.1: Create PDF Export Service
**File:** `src/services/export/pdfExport.ts`
**Estimated Time:** 90 minutes

- [ ] Setup jsPDF
- [ ] Create document layout
- [ ] Add title page
- [ ] Render scene image
- [ ] Add data tables

### Task 4.2: PDF Formatting
**File:** `src/services/export/pdfExport.ts`
**Estimated Time:** 60 minutes

- [ ] Style tables
- [ ] Add headers/footers
- [ ] Format page breaks
- [ ] Add metadata

### Task 4.3: Test PDF Export
**File:** `src/test/pdfExport.test.ts`
**Estimated Time:** 30 minutes

- [ ] Verify PDF generation
- [ ] Check layout
- [ ] Test printing

## Phase 5: GeoJSON Export Tasks (1 hour)

### Task 5.1: Create GeoJSON Export Service
**File:** `src/services/export/geojsonExport.ts`
**Estimated Time:** 45 minutes

- [ ] Create FeatureCollection
- [ ] Convert shapes to features
- [ ] Add properties
- [ ] Validate structure

### Task 5.2: Test GeoJSON Export
**File:** `src/test/geojsonExport.test.ts`
**Estimated Time:** 15 minutes

- [ ] Validate against schema
- [ ] Test in GIS software
- [ ] Check coordinate system

## Phase 6: UI Integration Tasks (2 hours)

### Task 6.1: Update Export Dialog
**File:** `src/components/ExportSettingsDialog.tsx`
**Estimated Time:** 60 minutes

- [ ] Add format selector
- [ ] Add settings panel for each format
- [ ] Wire up to export service
- [ ] Add inline styles

### Task 6.2: Add Progress Indicator
**File:** `src/components/ExportSettingsDialog.tsx`
**Estimated Time:** 30 minutes

- [ ] Create progress bar
- [ ] Show export message
- [ ] Add cancel button
- [ ] Handle completion

### Task 6.3: Error Handling
**File:** `src/components/ExportSettingsDialog.tsx`
**Estimated Time:** 30 minutes

- [ ] Show error messages
- [ ] Retry mechanism
- [ ] Graceful fallbacks

## Validation Checklist

### Before Starting Each Phase
- [ ] Previous phase complete
- [ ] Tests passing
- [ ] No console errors

### After Each Task
- [ ] Code compiles
- [ ] Inline styles only
- [ ] TypeScript strict mode
- [ ] Tests written

### Before Completion
- [ ] All formats working
- [ ] Performance acceptable
- [ ] Error handling complete
- [ ] UI polished
- [ ] Tests passing
- [ ] Documentation updated

## Quick Test Commands

```bash
# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Dev server
npm run dev
```

## Notes

- Remember: Use inline styles only in components
- Export services can use regular TypeScript
- Test with actual shape data from the app
- Consider memory limits for large exports
- Progress feedback is important for UX