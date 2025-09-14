# Implementation Plan: Export Functionality

**Feature:** Multi-Format Export System
**Specification:** [spec.md](./spec.md)
**Date:** January 2025

## Technical Context

### Current Architecture
- **Framework:** React 18 + TypeScript + Vite
- **3D Engine:** Three.js + React Three Fiber
- **State Management:** Zustand (useAppStore)
- **Styling:** Inline styles only
- **Testing:** Vitest + React Testing Library
- **Existing Export UI:** ExportSettingsDialog component exists

### Dependencies Needed
- [x] xlsx (for Excel export) - 0.18.5
- [x] jspdf (for PDF export) - 2.5.1
- [x] jspdf-autotable (for PDF tables) - 3.5.31
- [ ] dxf-writer (for DXF export) - 1.0.0

## Implementation Approach

### Phase 1: Foundation (2 hours)
**Goal:** Set up core export infrastructure

1. **Data Models** (`src/types/index.ts`)
   ```typescript
   export interface ExportOptions {
     format: 'excel' | 'dxf' | 'pdf' | 'geojson';
     settings: {
       includeMetadata: boolean;
       units: 'metric' | 'imperial';
       precision: number;
       pageSize?: 'A4' | 'letter';
       dxfVersion?: string;
     };
   }

   export interface ExportResult {
     success: boolean;
     filename: string;
     error?: string;
   }
   ```

2. **Service Layer** (`src/services/exportService.ts`)
   ```typescript
   class ExportService {
     async exportToExcel(shapes: Shape[], options: ExportOptions): Promise<ExportResult>
     async exportToDXF(shapes: Shape[], options: ExportOptions): Promise<ExportResult>
     async exportToPDF(shapes: Shape[], options: ExportOptions): Promise<ExportResult>
     async exportToGeoJSON(shapes: Shape[], options: ExportOptions): Promise<ExportResult>
   }
   ```

3. **Store Updates** (`src/store/useAppStore.ts`)
   - Add `exportInProgress: boolean`
   - Add `exportProgress: number`
   - Add `setExportProgress` action
   - Add `exportShapes` action

### Phase 2: Excel Export Implementation (3 hours)
**Goal:** Complete Excel export functionality

1. **Excel Service** (`src/services/export/excelExport.ts`)
   - Create workbook with 3 sheets
   - Format cells with borders and colors
   - Add formulas for totals
   - Include metadata header

2. **Data Formatting**
   - Convert coordinates to table format
   - Calculate areas and perimeters
   - Format numbers with appropriate precision
   - Add units to measurements

### Phase 3: DXF Export Implementation (3 hours)
**Goal:** CAD-compatible export

1. **DXF Service** (`src/services/export/dxfExport.ts`)
   - Convert shapes to DXF entities
   - Handle coordinate transformations
   - Create layers for organization
   - Add dimension entities

2. **Shape Conversion**
   - Rectangle → POLYLINE
   - Circle → CIRCLE
   - Polyline → LWPOLYLINE
   - Preserve exact coordinates

### Phase 4: PDF Export Implementation (3 hours)
**Goal:** Professional report generation

1. **PDF Service** (`src/services/export/pdfExport.ts`)
   - Render scene to image
   - Create data tables
   - Add headers and footers
   - Format for printing

2. **Layout Design**
   - Title page with project info
   - Visual representation
   - Measurement tables
   - Professional styling

### Phase 5: GeoJSON Export Implementation (1 hour)
**Goal:** GIS-compatible export

1. **GeoJSON Service** (`src/services/export/geojsonExport.ts`)
   - Create FeatureCollection
   - Add properties to features
   - Handle coordinate systems
   - Validate output

### Phase 6: UI Integration (2 hours)
**Goal:** Connect exports to existing UI

1. **Update ExportSettingsDialog**
   - Add format selector
   - Add settings for each format
   - Add progress indicator
   - Handle success/error states

2. **Progress Feedback**
   - Progress bar component
   - Cancel button
   - Success/error notifications

## File Structure

```
app/src/
├── components/
│   └── ExportSettingsDialog.tsx (update existing)
├── services/
│   ├── exportService.ts (new)
│   └── export/
│       ├── excelExport.ts (new)
│       ├── dxfExport.ts (new)
│       ├── pdfExport.ts (new)
│       └── geojsonExport.ts (new)
├── types/
│   └── index.ts (update with export types)
└── store/
    └── useAppStore.ts (update with export state)
```

## Testing Strategy

### Unit Tests
- Each export service function
- Data transformation functions
- Coordinate conversions
- Format validations

### Integration Tests
- Full export flow for each format
- Error handling scenarios
- Large dataset exports
- Progress tracking

### Manual Testing
- Visual verification of exports
- Import into target applications
- Performance with large datasets

## Performance Considerations

- Use Web Workers for large exports
- Chunk processing for >100 shapes
- Lazy load export libraries
- Stream large files if possible
- Target: <3 seconds for 1000 shapes

## Security Considerations

- Sanitize file names
- Validate all inputs
- No external API calls
- Client-side only processing
- Respect browser download policies

## Constitution Compliance

✅ **Article 1:** Inline styles for all UI components
✅ **Article 2:** Full TypeScript typing
✅ **Article 3:** Integrated with Zustand store
✅ **Article 4:** Functional components with hooks
✅ **Article 5:** No impact on 3D rendering
✅ **Article 6:** Comprehensive test coverage
✅ **Article 7:** Client-side only, secure
✅ **Article 8:** Updates existing ExportSettingsDialog
✅ **Article 9:** Maintains Canva-inspired design

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Large file memory issues | Medium | High | Implement chunking and streaming |
| Browser compatibility | Low | Medium | Test on major browsers |
| Library bundle size | Medium | Medium | Lazy load export libraries |
| Export accuracy | Low | High | Extensive testing and validation |

## Implementation Checklist

- [ ] Install required dependencies
- [ ] Create export service architecture
- [ ] Implement Excel export
- [ ] Implement DXF export
- [ ] Implement PDF export
- [ ] Implement GeoJSON export
- [ ] Update UI components
- [ ] Add progress tracking
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Browser compatibility testing
- [ ] Documentation update

## Estimated Timeline

- **Total Estimate:** 14 hours
- **Phase 1:** 2 hours (Foundation)
- **Phase 2:** 3 hours (Excel)
- **Phase 3:** 3 hours (DXF)
- **Phase 4:** 3 hours (PDF)
- **Phase 5:** 1 hour (GeoJSON)
- **Phase 6:** 2 hours (UI Integration)

## Next Steps

1. Install dependencies
2. Create service architecture
3. Start with Excel export (highest priority)
4. Test with existing shape data
5. Iterate based on feedback