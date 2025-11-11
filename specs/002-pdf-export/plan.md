# Implementation Plan: PDF Export with Selective Filters

**Feature ID**: 002-pdf-export
**Plan Version**: 1.0
**Created**: 2025-11-04
**Status**: Ready for Implementation

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌──────────────┐           ┌─────────────────────────┐     │
│  │ Export Button│───────────│   Export Modal Dialog   │     │
│  │  (Toolbar)   │           │  - Filter Checkboxes    │     │
│  └──────────────┘           │  - Select All/None      │     │
│                             │  - Export/Cancel Buttons │     │
│                             └────────────┬────────────┘     │
└──────────────────────────────────────────┼──────────────────┘
                                           │
┌──────────────────────────────────────────┼──────────────────┐
│                    Business Logic Layer  │                   │
│                             ┌────────────▼────────────┐      │
│                             │  PDF Export Service     │      │
│                             │  - Filter shape data    │      │
│                             │  - Generate PDF content │      │
│                             │  - Format tables        │      │
│                             └────────────┬────────────┘      │
└──────────────────────────────────────────┼──────────────────┘
                                           │
┌──────────────────────────────────────────┼──────────────────┐
│                    Data Layer            │                   │
│  ┌──────────────────┐        ┌──────────▼──────────┐        │
│  │ useDrawingStore  │───────►│  Shape Data Model   │        │
│  │  - shapes[]      │        │  - id, type, props  │        │
│  │  - selectedIds   │        │  - dimensions       │        │
│  └──────────────────┘        └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────┼──────────────────┐
│                    External Libraries    │                   │
│                             ┌────────────▼────────────┐      │
│                             │      pdf-lib            │      │
│                             │  - Document creation    │      │
│                             │  - Table rendering      │      │
│                             └────────────┬────────────┘      │
│                                          │                   │
│                             ┌────────────▼────────────┐      │
│                             │     file-saver          │      │
│                             │  - Trigger download     │      │
│                             └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### New Components

#### 1. ExportButton.tsx
**Location**: `app/src/components/UI/ExportButton.tsx`
**Purpose**: Toolbar button to trigger export dialog
**Props**: None (reads from store)
**State**: None (stateless, triggers modal)

```typescript
interface ExportButtonProps {
  // No props - reads from Zustand store
}

// Renders:
// - SVG export icon
// - "Export" label
// - Tooltip with keyboard shortcut
// - Disabled state when no shapes
```

#### 2. ExportModal.tsx
**Location**: `app/src/components/Modals/ExportModal.tsx`
**Purpose**: Main export configuration dialog
**Props**:
- `isOpen: boolean`
- `onClose: () => void`
- `onExport: (filters: ExportFilters) => void`

**State**:
- `selectedFilters: Set<string>` - Which properties to include
- `isExporting: boolean` - Loading state during PDF generation

```typescript
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters) => Promise<void>;
}

interface ExportFilters {
  basicInfo: boolean;
  dimensions: boolean;
  position: boolean;
  visual: boolean;
  metadata: boolean;
  // Granular sub-filters
  includeShapeType: boolean;
  includeShapeId: boolean;
  includeArea: boolean;
  includePerimeter: boolean;
  includeRotation: boolean;
  includeColors: boolean;
  includeTimestamps: boolean;
}
```

#### 3. ExportFilterPanel.tsx
**Location**: `app/src/components/Modals/ExportFilterPanel.tsx`
**Purpose**: Filter checkbox list within modal
**Props**:
- `filters: ExportFilters`
- `onChange: (filters: ExportFilters) => void`

**Features**:
- Collapsible category sections
- Select All / Deselect All buttons
- Live property count
- Checkbox groups with indentation

### New Services

#### 1. pdfExportService.ts
**Location**: `app/src/services/pdfExportService.ts`
**Purpose**: Core PDF generation logic

**Key Functions**:

```typescript
// Main export function
export async function exportToPDF(
  shapes: DrawableShape[],
  filters: ExportFilters,
  options?: ExportOptions
): Promise<Blob>

// Generate PDF document
async function createPDFDocument(
  shapes: DrawableShape[],
  filters: ExportFilters
): Promise<PDFDocument>

// Create header section
function createHeader(page: PDFPage, options: PDFHeaderOptions): void

// Create summary section
function createSummary(page: PDFPage, shapes: DrawableShape[]): void

// Create shape table
function createShapeTable(
  page: PDFPage,
  shapes: DrawableShape[],
  filters: ExportFilters
): void

// Format shape data for table
function formatShapeData(
  shape: DrawableShape,
  filters: ExportFilters
): Record<string, string>

// Calculate table columns based on filters
function getTableColumns(filters: ExportFilters): TableColumn[]

// Apply brand styling to PDF
function applyBrandStyling(page: PDFPage): void
```

#### 2. exportUtils.ts
**Location**: `app/src/utils/exportUtils.ts`
**Purpose**: Helper functions for export operations

**Key Functions**:

```typescript
// Generate filename with timestamp
export function generateFilename(projectName?: string): string

// Sanitize filename for safe download
export function sanitizeFilename(filename: string): string

// Calculate total area of all shapes
export function calculateTotalArea(shapes: DrawableShape[]): number

// Get shape type breakdown (e.g., "3 rectangles, 2 circles")
export function getShapeTypeBreakdown(shapes: DrawableShape[]): string

// Format area with appropriate unit
export function formatArea(area: number, unit: string): string

// Trigger file download in browser
export function downloadFile(blob: Blob, filename: string): void

// Validate export filters (at least one selected)
export function validateFilters(filters: ExportFilters): boolean
```

### Modified Files

#### 1. App.tsx
**Changes**:
- Add ExportButton to ribbon toolbar
- Add ExportModal to app root (controlled by store)
- Register Ctrl+E keyboard shortcut

```typescript
// Add export modal state to render
{isExportModalOpen && (
  <ExportModal
    isOpen={isExportModalOpen}
    onClose={closeExportModal}
    onExport={handleExport}
  />
)}

// Add keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      openExportModal();
    }
  };
  // ...
}, []);
```

#### 2. useAppStore.ts (Zustand Store)
**Changes**:
- Add `isExportModalOpen` state
- Add `openExportModal()` action
- Add `closeExportModal()` action
- Add `exportFilters` state (persist user preferences)

```typescript
interface AppState {
  // ... existing state
  isExportModalOpen: boolean;
  exportFilters: ExportFilters;

  // ... existing actions
  openExportModal: () => void;
  closeExportModal: () => void;
  setExportFilters: (filters: ExportFilters) => void;
}
```

#### 3. KeyboardShortcuts.tsx
**Changes**:
- Add Ctrl+E shortcut to help dialog
- Add entry in shortcuts list: "Ctrl+E - Export to PDF"

## Data Flow

### Export Workflow Sequence

```
1. User clicks Export button (or presses Ctrl+E)
   └─> App.tsx: openExportModal() called
       └─> Store: isExportModalOpen = true

2. ExportModal renders with default filters
   └─> ExportFilterPanel: Shows checkboxes
       └─> User selects/deselects filters

3. User clicks "Export" button in modal
   └─> ExportModal: onExport(filters) called
       └─> pdfExportService.exportToPDF(shapes, filters)
           ├─> Filter shape data based on selected filters
           ├─> Create PDF document with pdf-lib
           ├─> Add header, summary, table
           ├─> Apply brand styling
           └─> Return PDF Blob

4. PDF generation complete
   └─> exportUtils.downloadFile(blob, filename)
       ├─> Create download URL
       ├─> Trigger browser download
       └─> Revoke URL after download

5. Show success feedback
   └─> Toast: "PDF exported successfully!"
       └─> ExportModal: Close modal
```

### Data Transformation Pipeline

```
DrawableShape[] (from store)
  │
  ├─> Filter by selected properties
  │   └─> ExportFilters determines which fields to include
  │
  ├─> Transform to table rows
  │   └─> formatShapeData() converts shapes to row objects
  │
  ├─> Calculate summary statistics
  │   ├─> Total area
  │   ├─> Shape count
  │   └─> Type breakdown
  │
  ├─> Generate PDF structure
  │   ├─> Header (title, date, branding)
  │   ├─> Summary (totals, counts)
  │   └─> Table (filtered shape data)
  │
  └─> Output: PDF Blob
      └─> Trigger download
```

## Technical Implementation Details

### PDF Generation with pdf-lib

**Library Choice Rationale**:
- **pdf-lib**: Chosen for robust client-side PDF creation, rich API, TypeScript support
- **Alternatives considered**:
  - jsPDF: Less feature-rich, no table support out of box
  - pdfmake: Larger bundle size, more complex API
  - react-pdf: Server-side rendering, not suitable for client-only

**Basic Usage Pattern**:

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function createPDFDocument(shapes: DrawableShape[], filters: ExportFilters) {
  // Create document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Brand colors (teal accent)
  const tealColor = rgb(0, 196 / 255, 204 / 255);
  const blackColor = rgb(0, 0, 0);

  // Draw header
  page.drawText('Land Visualizer Export Report', {
    x: 50,
    y: 750,
    size: 20,
    font: boldFont,
    color: tealColor,
  });

  // Draw table (manual positioning)
  let yPosition = 700;
  const columns = getTableColumns(filters);
  const rowHeight = 25;

  // Table header
  columns.forEach((col, i) => {
    page.drawText(col.label, {
      x: 50 + i * 100,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: blackColor,
    });
  });

  // Table rows
  yPosition -= rowHeight;
  shapes.forEach((shape) => {
    const rowData = formatShapeData(shape, filters);
    columns.forEach((col, i) => {
      page.drawText(rowData[col.key] || '', {
        x: 50 + i * 100,
        y: yPosition,
        size: 10,
        font: font,
        color: blackColor,
      });
    });
    yPosition -= rowHeight;
  });

  // Serialize to bytes
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

### File Download Implementation

```typescript
import { saveAs } from 'file-saver';

export function downloadFile(blob: Blob, filename: string): void {
  // Use file-saver for cross-browser compatibility
  saveAs(blob, filename);

  // Alternative: Manual download (if file-saver not used)
  /*
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  */
}
```

### Filename Generation

```typescript
export function generateFilename(projectName?: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .split('.')[0]; // Format: YYYYMMDD-HHmmss

  if (projectName) {
    const sanitized = sanitizeFilename(projectName);
    return `${sanitized}-export-${timestamp}.pdf`;
  }

  return `land-viz-export-${timestamp}.pdf`;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .toLowerCase();
}
```

## State Management

### Zustand Store Updates

```typescript
// Add to useAppStore.ts

interface AppState {
  // ... existing state

  // Export modal state
  isExportModalOpen: boolean;
  exportFilters: ExportFilters;

  // Export actions
  openExportModal: () => void;
  closeExportModal: () => void;
  setExportFilters: (filters: ExportFilters) => void;
}

const useAppStore = create<AppState>()((set) => ({
  // ... existing state

  // Default export filters (Basic Info + Dimensions)
  exportFilters: {
    basicInfo: true,
    dimensions: true,
    position: false,
    visual: false,
    metadata: false,
    includeShapeType: true,
    includeShapeId: true,
    includeArea: true,
    includePerimeter: true,
    includeRotation: false,
    includeColors: false,
    includeTimestamps: false,
  },

  isExportModalOpen: false,

  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
  setExportFilters: (filters) => set({ exportFilters: filters }),
}));
```

### Filter Persistence (Optional - Future Enhancement)

```typescript
// Persist user's filter preferences in localStorage
const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ... state
    }),
    {
      name: 'land-viz-storage',
      partialize: (state) => ({
        exportFilters: state.exportFilters, // Persist filters
      }),
    }
  )
);
```

## Styling & Design

### Modal Design (Canva-Inspired)

```typescript
// ExportModal inline styles
const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },
  header: {
    fontSize: '24px',
    fontWeight: 700,
    fontFamily: 'Nunito Sans, sans-serif',
    color: '#1A1A1A',
    marginBottom: '24px',
  },
  filterSection: {
    marginBottom: '24px',
  },
  categoryHeader: {
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Nunito Sans, sans-serif',
    color: '#333333',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    paddingLeft: '24px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  primaryButton: {
    backgroundColor: '#00C4CC',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Nunito Sans, sans-serif',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    color: '#333333',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Nunito Sans, sans-serif',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
};
```

### Export Button Styling

```typescript
const exportButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E5E5',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 200ms ease',
  fontFamily: 'Nunito Sans, sans-serif',
  fontSize: '14px',
  fontWeight: 600,
  color: '#333333',
};

const disabledStyle = {
  ...exportButtonStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
};
```

## Performance Optimization

### Async PDF Generation

```typescript
// Use Web Worker for large PDF generation (future optimization)
async function exportToPDFAsync(
  shapes: DrawableShape[],
  filters: ExportFilters
): Promise<Blob> {
  // Show loading indicator
  const toast = showToast('Generating PDF...', { type: 'loading' });

  try {
    // Generate PDF asynchronously (doesn't block UI)
    const blob = await createPDFDocument(shapes, filters);

    toast.dismiss();
    showToast('PDF exported successfully!', { type: 'success' });

    return blob;
  } catch (error) {
    toast.dismiss();
    showToast('Export failed. Please try again.', { type: 'error' });
    throw error;
  }
}
```

### Bundle Size Optimization

```typescript
// Lazy load PDF library (reduce initial bundle size)
export async function exportToPDF(
  shapes: DrawableShape[],
  filters: ExportFilters
): Promise<Blob> {
  // Dynamic import - only load when needed
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  // ... PDF generation logic
}
```

## Error Handling

### Comprehensive Error Handling Strategy

```typescript
export async function exportToPDF(
  shapes: DrawableShape[],
  filters: ExportFilters
): Promise<Blob> {
  try {
    // Validate inputs
    if (!shapes || shapes.length === 0) {
      throw new Error('No shapes to export');
    }

    if (!validateFilters(filters)) {
      throw new Error('At least one filter must be selected');
    }

    // Generate PDF
    const blob = await createPDFDocument(shapes, filters);

    // Validate output
    if (!blob || blob.size === 0) {
      throw new Error('PDF generation failed - empty document');
    }

    return blob;

  } catch (error) {
    // Log error (dev mode only)
    if (import.meta.env.DEV) {
      console.error('PDF export error:', error);
    }

    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw new Error(`Export failed: ${error.message}`);
    }

    throw new Error('An unexpected error occurred during export');
  }
}
```

### User-Facing Error Messages

```typescript
const ERROR_MESSAGES = {
  NO_SHAPES: 'No shapes to export. Please create some shapes first.',
  NO_FILTERS: 'Please select at least one property to export.',
  GENERATION_FAILED: 'PDF generation failed. Please try again.',
  DOWNLOAD_BLOCKED: 'Download blocked by browser. Please allow downloads and try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};
```

## Testing Strategy

### Unit Tests

**Test File**: `app/src/services/__tests__/pdfExportService.test.ts`

```typescript
describe('pdfExportService', () => {
  describe('exportToPDF', () => {
    it('should generate PDF blob with correct MIME type', async () => {
      const shapes = createMockShapes(5);
      const filters = defaultFilters;

      const blob = await exportToPDF(shapes, filters);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should throw error when no shapes provided', async () => {
      await expect(exportToPDF([], defaultFilters)).rejects.toThrow('No shapes to export');
    });

    it('should include only selected properties', async () => {
      const shapes = createMockShapes(3);
      const filters = { ...defaultFilters, position: false };

      const blob = await exportToPDF(shapes, filters);
      const pdfText = await extractTextFromPDF(blob);

      expect(pdfText).toContain('Rectangle');
      expect(pdfText).not.toContain('Position');
    });
  });

  describe('formatShapeData', () => {
    it('should format rectangle data correctly', () => {
      const rectangle = createMockRectangle();
      const data = formatShapeData(rectangle, defaultFilters);

      expect(data.type).toBe('Rectangle');
      expect(data.area).toMatch(/\d+ m²/);
    });
  });
});
```

### Integration Tests

**Test File**: `app/src/__tests__/exportWorkflow.test.tsx`

```typescript
describe('PDF Export Workflow', () => {
  it('should open modal when export button clicked', () => {
    render(<App />);

    // Draw a shape first
    const canvas = screen.getByRole('canvas');
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    // Click export button
    const exportBtn = screen.getByText('Export');
    fireEvent.click(exportBtn);

    // Modal should appear
    expect(screen.getByText('Export to PDF')).toBeInTheDocument();
  });

  it('should export PDF when Export button in modal clicked', async () => {
    const { user } = setup(<App />);

    // Create shapes
    createTestShapes(3);

    // Open modal
    await user.click(screen.getByText('Export'));

    // Click export
    const exportBtn = screen.getByRole('button', { name: /export/i });
    await user.click(exportBtn);

    // Should show success toast
    expect(await screen.findByText('PDF exported successfully!')).toBeInTheDocument();
  });
});
```

### Accessibility Tests

```typescript
describe('Export Modal Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ExportModal isOpen={true} onClose={vi.fn()} onExport={vi.fn()} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should trap focus within modal', () => {
    render(<ExportModal isOpen={true} onClose={vi.fn()} onExport={vi.fn()} />);

    // Tab should cycle through modal elements only
    const firstElement = screen.getByRole('button', { name: /close/i });
    const lastElement = screen.getByRole('button', { name: /export/i });

    firstElement.focus();
    userEvent.tab();
    expect(lastElement).toHaveFocus();

    userEvent.tab();
    expect(firstElement).toHaveFocus();
  });
});
```

## Dependencies & Installation

### Package Installation

```bash
# In app/ directory
npm install pdf-lib@^1.17.1
npm install file-saver@^2.0.5
npm install @types/file-saver@^2.0.7 --save-dev
```

### Package.json Updates

```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

### Bundle Size Impact

- **pdf-lib**: ~140KB gzipped
- **file-saver**: ~1KB gzipped
- **Total addition**: ~141KB gzipped

**Optimization Strategy**:
- Lazy load pdf-lib (only when export triggered)
- Tree-shake unused pdf-lib features
- Consider compression for very large PDFs

## Security Considerations

### Input Validation

```typescript
// Sanitize project names to prevent XSS
export function sanitizeProjectName(name: string): string {
  return name
    .replace(/[<>'"]/g, '') // Remove HTML chars
    .trim()
    .slice(0, 100); // Max length
}

// Validate filter object structure
export function validateFilters(filters: unknown): filters is ExportFilters {
  if (typeof filters !== 'object' || filters === null) {
    return false;
  }

  // Check required properties
  const requiredKeys = ['basicInfo', 'dimensions', 'position', 'visual', 'metadata'];
  return requiredKeys.every(key => key in filters);
}
```

### Content Security

- **No external requests**: All PDF generation happens client-side
- **No embedded scripts**: PDF contains only static content
- **No sensitive metadata**: Don't include user IPs, emails, or tracking data
- **Safe downloads**: Use blob URLs, revoke after download

## Constitution Compliance Checklist

- ✅ **Article 1**: Inline styles only (no CSS files)
- ✅ **Article 2**: TypeScript strict mode
- ✅ **Article 3**: Zustand for state management
- ✅ **Article 4**: React best practices (hooks, functional components)
- ✅ **Article 5**: N/A (no 3D rendering in PDF)
- ✅ **Article 6**: Unit tests for services, integration tests for workflow
- ✅ **Article 7**: Security first (input validation, sanitization)
- ✅ **Article 8**: Prefer editing existing files (App.tsx, useAppStore.ts)
- ✅ **Article 9**: Canva-inspired UX (modal design, brand colors)

## Migration & Rollout Plan

### Phase 1: Core Export (Week 1)
- Install dependencies
- Create ExportButton component
- Add button to toolbar
- Create basic ExportModal (no filters yet)
- Implement simple PDF generation (all properties)
- Test file download

**Success Criteria**: Users can export basic PDF with all shape data

### Phase 2: Selective Filtering (Week 2)
- Create ExportFilterPanel component
- Add filter checkboxes to modal
- Implement filter logic in pdfExportService
- Add Select All/Deselect All
- Persist filter preferences

**Success Criteria**: Users can customize which properties are exported

### Phase 3: Polish & Optimization (Week 3)
- Apply brand styling to PDF
- Add professional table formatting
- Optimize PDF generation performance
- Add loading indicators
- Implement error handling
- Add success/error toasts

**Success Criteria**: PDF looks professional, loads quickly, handles errors gracefully

### Phase 4: Testing & Documentation (Week 4)
- Write unit tests (70% coverage target)
- Write integration tests
- Accessibility audit
- Performance benchmarking
- Update CLAUDE.md
- Create user documentation

**Success Criteria**: All tests pass, 100% WCAG AA compliance, <3s generation time

## Monitoring & Success Metrics

### Performance Metrics
- **PDF Generation Time**: P50 < 1s, P95 < 3s (50 shapes)
- **File Size**: P50 < 200KB, P95 < 500KB
- **Bundle Size Impact**: < 150KB gzipped

### Quality Metrics
- **Test Coverage**: > 70%
- **Accessibility Score**: 100% WCAG 2.1 AA
- **Error Rate**: < 1%

### Usage Metrics (Post-Launch)
- **Adoption Rate**: % of users who export PDFs
- **Export Frequency**: Exports per user per session
- **Filter Preferences**: Most commonly selected filters

## Future Enhancements (Out of Scope)

1. **Multi-page PDFs**: Split large tables across pages
2. **Custom templates**: User-defined PDF layouts
3. **Charts & visualizations**: Embed charts in PDF
4. **Excel/CSV export**: Alternative export formats
5. **Image export**: PNG/JPG of 3D scene
6. **Cloud storage**: Direct upload to Google Drive, Dropbox
7. **Email integration**: Send PDF via email
8. **PDF preview**: Show thumbnail before download
9. **Batch export**: Export multiple projects at once
10. **Import from PDF**: Reverse engineering PDF back to shapes

---

**Plan Version**: 1.0
**Last Updated**: 2025-11-04
**Next Steps**: Begin Phase 1 implementation
