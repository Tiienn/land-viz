# Task Breakdown: PDF Export with Selective Filters

**Feature ID**: 002-pdf-export
**Tasks Version**: 1.0
**Created**: 2025-11-04
**Total Estimated Time**: 32-40 hours (4-5 days)

## Phase 1: Core Export (Week 1) - 12-16 hours

### Task 1.1: Install Dependencies
**Time Estimate**: 30 minutes
**Priority**: Critical
**Dependencies**: None

**Steps**:
1. Navigate to `app/` directory
2. Run `npm install pdf-lib@^1.17.1`
3. Run `npm install file-saver@^2.0.5`
4. Run `npm install @types/file-saver@^2.0.7 --save-dev`
5. Verify installation: Check `package.json` and `package-lock.json`
6. Test build: Run `npm run build` to ensure no conflicts

**Validation**:
- [ ] All packages installed successfully
- [ ] No version conflicts in package.json
- [ ] Build passes without errors
- [ ] TypeScript recognizes new types

**Code Example**:
```bash
cd app
npm install pdf-lib@^1.17.1 file-saver@^2.0.5
npm install @types/file-saver@^2.0.7 --save-dev
npm run build
```

---

### Task 1.2: Create ExportButton Component
**Time Estimate**: 2 hours
**Priority**: Critical
**Dependencies**: None

**Steps**:
1. Create `app/src/components/UI/ExportButton.tsx`
2. Import necessary dependencies (React, Zustand store)
3. Create SVG export icon (download icon with arrow)
4. Implement button with inline styles (Canva-inspired)
5. Add disabled state (when no shapes exist)
6. Add hover/active states with 200ms transition
7. Add tooltip with keyboard shortcut hint
8. Connect to store's `openExportModal()` action

**Validation**:
- [ ] Button renders in UI
- [ ] SVG icon displays correctly
- [ ] Button disabled when no shapes
- [ ] Button enabled when shapes exist
- [ ] Hover state works (200ms transition)
- [ ] Tooltip shows "Export to PDF (Ctrl+E)"
- [ ] Clicking button triggers modal (after Task 1.3)

**Code Example**:
```typescript
// app/src/components/UI/ExportButton.tsx
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useDrawingStore } from '../../store/useDrawingStore';

export const ExportButton: React.FC = () => {
  const openExportModal = useAppStore((state) => state.openExportModal);
  const shapes = useDrawingStore((state) => state.shapes);
  const hasShapes = shapes.length > 0;

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    cursor: hasShapes ? 'pointer' : 'not-allowed',
    transition: 'all 200ms ease',
    fontFamily: 'Nunito Sans, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    color: hasShapes ? '#333333' : '#999999',
    opacity: hasShapes ? 1 : 0.5,
  };

  return (
    <button
      onClick={openExportModal}
      disabled={!hasShapes}
      style={buttonStyle}
      title="Export to PDF (Ctrl+E)"
      aria-label="Export to PDF"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16Z"
          fill="currentColor"
        />
        <path
          d="M5 20C4.45 20 3.979 19.804 3.587 19.412C3.195 19.02 3 18.55 3 18V15H5V18H19V15H21V18C21 18.55 20.804 19.02 20.412 19.412C20.02 19.804 19.55 20 19 20H5Z"
          fill="currentColor"
        />
      </svg>
      <span>Export</span>
    </button>
  );
};
```

---

### Task 1.3: Create Basic ExportModal Component
**Time Estimate**: 3 hours
**Priority**: Critical
**Dependencies**: Task 1.2

**Steps**:
1. Create `app/src/components/Modals/ExportModal.tsx`
2. Define `ExportModalProps` interface
3. Implement modal overlay with backdrop blur
4. Create modal container with Canva-inspired styling
5. Add modal header ("Export to PDF")
6. Add close button (X icon) in top-right
7. Add Export/Cancel buttons in footer
8. Implement keyboard handling (Esc to close, Enter to export)
9. Add focus trap for accessibility
10. Add ARIA labels and roles

**Validation**:
- [ ] Modal opens when ExportButton clicked
- [ ] Modal closes on Cancel button
- [ ] Modal closes on Esc key
- [ ] Modal closes on backdrop click
- [ ] Focus trapped within modal
- [ ] Export button triggers onExport callback
- [ ] No accessibility violations (axe-core)

**Code Example**:
```typescript
// app/src/components/Modals/ExportModal.tsx
import React, { useEffect, useRef } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        <h2
          id="export-modal-title"
          style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: 'Nunito Sans, sans-serif',
            color: '#1A1A1A',
            marginBottom: '24px',
            marginTop: 0,
          }}
        >
          Export to PDF
        </h2>

        {/* Filter panel will go here in Phase 2 */}
        <p>Export all shapes with all properties.</p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
          }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
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
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              backgroundColor: '#00C4CC',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Nunito Sans, sans-serif',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              opacity: isExporting ? 0.7 : 1,
            }}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### Task 1.4: Add Export Modal to App.tsx
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: Task 1.3

**Steps**:
1. Open `app/src/App.tsx`
2. Import `ExportButton` and `ExportModal` components
3. Add `ExportButton` to ribbon toolbar (before Help button)
4. Add `ExportModal` to app root (controlled by store)
5. Create `handleExport` function (placeholder for now)
6. Test modal open/close workflow

**Validation**:
- [ ] ExportButton appears in toolbar
- [ ] ExportModal opens when button clicked
- [ ] Modal closes properly
- [ ] No layout issues or z-index conflicts

**Code Example**:
```typescript
// app/src/App.tsx (additions)
import { ExportButton } from './components/UI/ExportButton';
import { ExportModal } from './components/Modals/ExportModal';
import { useAppStore } from './store/useAppStore';

function App() {
  const isExportModalOpen = useAppStore((state) => state.isExportModalOpen);
  const closeExportModal = useAppStore((state) => state.closeExportModal);

  const handleExport = async () => {
    // Will implement in Task 1.6
    console.log('Export triggered');
  };

  return (
    <>
      {/* ... existing app content */}

      {/* Add to ribbon toolbar */}
      <div style={toolbarStyle}>
        {/* ... existing buttons */}
        <ExportButton />
      </div>

      {/* Add modal at app root */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={closeExportModal}
          onExport={handleExport}
        />
      )}
    </>
  );
}
```

---

### Task 1.5: Update Zustand Store
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: None

**Steps**:
1. Open `app/src/store/useAppStore.ts`
2. Add `isExportModalOpen: boolean` to state interface
3. Add `openExportModal()` action
4. Add `closeExportModal()` action
5. Initialize `isExportModalOpen` to `false`

**Validation**:
- [ ] Store compiles without TypeScript errors
- [ ] Modal state updates correctly
- [ ] Actions trigger re-renders

**Code Example**:
```typescript
// app/src/store/useAppStore.ts (additions)
interface AppState {
  // ... existing state

  // Export modal state
  isExportModalOpen: boolean;

  // Export actions
  openExportModal: () => void;
  closeExportModal: () => void;
}

const useAppStore = create<AppState>()((set) => ({
  // ... existing state

  isExportModalOpen: false,

  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
}));
```

---

### Task 1.6: Create PDF Export Service (Basic)
**Time Estimate**: 4 hours
**Priority**: Critical
**Dependencies**: Task 1.1

**Steps**:
1. Create `app/src/services/pdfExportService.ts`
2. Import `pdf-lib` and `file-saver`
3. Implement `exportToPDF()` function
4. Create basic PDF with header
5. Add simple shape table (all properties)
6. Return PDF Blob
7. Test with sample data

**Validation**:
- [ ] PDF generates without errors
- [ ] PDF contains correct shape data
- [ ] File size < 1MB for 20 shapes
- [ ] PDF opens in browser/Adobe Reader

**Code Example**:
```typescript
// app/src/services/pdfExportService.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { DrawableShape } from '../types';

export async function exportToPDF(shapes: DrawableShape[]): Promise<Blob> {
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Brand colors
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

  // Draw date
  const now = new Date().toLocaleDateString();
  page.drawText(`Export Date: ${now}`, {
    x: 50,
    y: 720,
    size: 12,
    font: font,
    color: blackColor,
  });

  // Draw table headers
  let yPosition = 680;
  const headers = ['Type', 'Width', 'Height', 'Area'];
  headers.forEach((header, i) => {
    page.drawText(header, {
      x: 50 + i * 120,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: blackColor,
    });
  });

  // Draw shape rows
  yPosition -= 25;
  shapes.forEach((shape) => {
    const row = [
      shape.type,
      `${shape.width?.toFixed(2) || 'N/A'} m`,
      `${shape.height?.toFixed(2) || 'N/A'} m`,
      `${(shape.area || 0).toFixed(2)} m²`,
    ];

    row.forEach((cell, i) => {
      page.drawText(cell, {
        x: 50 + i * 120,
        y: yPosition,
        size: 10,
        font: font,
        color: blackColor,
      });
    });

    yPosition -= 20;
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

---

### Task 1.7: Implement File Download
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: Task 1.6

**Steps**:
1. Create `app/src/utils/exportUtils.ts`
2. Implement `downloadFile()` function using `file-saver`
3. Implement `generateFilename()` with timestamp
4. Wire up download in `App.tsx`'s `handleExport`
5. Test download in browser

**Validation**:
- [ ] PDF downloads automatically
- [ ] Filename follows convention (land-viz-export-YYYYMMDD-HHmmss.pdf)
- [ ] File opens correctly after download
- [ ] No console errors

**Code Example**:
```typescript
// app/src/utils/exportUtils.ts
import { saveAs } from 'file-saver';

export function downloadFile(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}

export function generateFilename(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .split('.')[0]; // YYYYMMDD-HHmmss

  return `land-viz-export-${timestamp}.pdf`;
}

// Usage in App.tsx
import { exportToPDF } from './services/pdfExportService';
import { downloadFile, generateFilename } from './utils/exportUtils';
import { useDrawingStore } from './store/useDrawingStore';

const handleExport = async () => {
  const shapes = useDrawingStore.getState().shapes;
  const blob = await exportToPDF(shapes);
  const filename = generateFilename();
  downloadFile(blob, filename);
};
```

---

### Task 1.8: Add Keyboard Shortcut (Ctrl+E)
**Time Estimate**: 30 minutes
**Priority**: High
**Dependencies**: Task 1.4

**Steps**:
1. Open `app/src/App.tsx`
2. Add `useEffect` hook for keyboard listener
3. Listen for Ctrl+E (or Cmd+E on Mac)
4. Prevent default browser behavior
5. Trigger `openExportModal()`
6. Update keyboard shortcuts help dialog

**Validation**:
- [ ] Ctrl+E opens export modal
- [ ] Cmd+E works on Mac (if testable)
- [ ] Shortcut listed in help dialog (? key)
- [ ] No conflicts with browser shortcuts

**Code Example**:
```typescript
// app/src/App.tsx (addition)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+E or Cmd+E for export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      const hasShapes = useDrawingStore.getState().shapes.length > 0;
      if (hasShapes) {
        useAppStore.getState().openExportModal();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Phase 2: Selective Filtering (Week 2) - 10-12 hours

### Task 2.1: Define Filter Types
**Time Estimate**: 30 minutes
**Priority**: Critical
**Dependencies**: None

**Steps**:
1. Create `app/src/types/export.ts`
2. Define `ExportFilters` interface
3. Define `ExportOptions` interface
4. Export types for use in components

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] Types imported successfully in components

**Code Example**:
```typescript
// app/src/types/export.ts
export interface ExportFilters {
  // Category toggles
  basicInfo: boolean;
  dimensions: boolean;
  position: boolean;
  visual: boolean;
  metadata: boolean;

  // Granular filters
  includeShapeType: boolean;
  includeShapeId: boolean;
  includeArea: boolean;
  includePerimeter: boolean;
  includeWidth: boolean;
  includeHeight: boolean;
  includeRotation: boolean;
  includePosition: boolean;
  includeColors: boolean;
  includeTimestamps: boolean;
}

export const DEFAULT_FILTERS: ExportFilters = {
  basicInfo: true,
  dimensions: true,
  position: false,
  visual: false,
  metadata: false,
  includeShapeType: true,
  includeShapeId: true,
  includeArea: true,
  includePerimeter: true,
  includeWidth: true,
  includeHeight: true,
  includeRotation: false,
  includePosition: false,
  includeColors: false,
  includeTimestamps: false,
};
```

---

### Task 2.2: Create ExportFilterPanel Component
**Time Estimate**: 4 hours
**Priority**: Critical
**Dependencies**: Task 2.1

**Steps**:
1. Create `app/src/components/Modals/ExportFilterPanel.tsx`
2. Define props interface
3. Create category sections (Basic Info, Dimensions, etc.)
4. Add checkboxes for each filter
5. Implement "Select All" / "Deselect All" buttons
6. Add live property count display
7. Style with Canva-inspired design

**Validation**:
- [ ] All checkboxes render correctly
- [ ] Checking parent category checks all children
- [ ] Select All/Deselect All work
- [ ] Live count updates
- [ ] Accessible (keyboard navigation, screen readers)

**Code Example**:
```typescript
// app/src/components/Modals/ExportFilterPanel.tsx
import React from 'react';
import type { ExportFilters } from '../../types/export';

interface ExportFilterPanelProps {
  filters: ExportFilters;
  onChange: (filters: ExportFilters) => void;
}

export const ExportFilterPanel: React.FC<ExportFilterPanelProps> = ({
  filters,
  onChange,
}) => {
  const handleCategoryToggle = (category: keyof ExportFilters) => {
    onChange({ ...filters, [category]: !filters[category] });
  };

  const handleSelectAll = () => {
    const allSelected = Object.fromEntries(
      Object.keys(filters).map((key) => [key, true])
    ) as ExportFilters;
    onChange(allSelected);
  };

  const handleDeselectAll = () => {
    const allDeselected = Object.fromEntries(
      Object.keys(filters).map((key) => [key, false])
    ) as ExportFilters;
    onChange(allDeselected);
  };

  const selectedCount = Object.values(filters).filter(Boolean).length;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {selectedCount} properties selected
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSelectAll}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: '1px solid #E5E5E5',
              borderRadius: '6px',
              backgroundColor: '#FFF',
              cursor: 'pointer',
            }}
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: '1px solid #E5E5E5',
              borderRadius: '6px',
              backgroundColor: '#FFF',
              cursor: 'pointer',
            }}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Basic Info Section */}
      <FilterCategory
        title="Basic Information"
        checked={filters.basicInfo}
        onToggle={() => handleCategoryToggle('basicInfo')}
        filters={filters}
        onChange={onChange}
        items={[
          { key: 'includeShapeType', label: 'Shape Type' },
          { key: 'includeShapeId', label: 'Shape ID' },
        ]}
      />

      {/* More categories... */}
    </div>
  );
};

// Helper component for filter categories
const FilterCategory: React.FC<{
  title: string;
  checked: boolean;
  onToggle: () => void;
  filters: ExportFilters;
  onChange: (filters: ExportFilters) => void;
  items: Array<{ key: keyof ExportFilters; label: string }>;
}> = ({ title, checked, onToggle, filters, onChange, items }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 600 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          style={{ marginRight: '8px' }}
        />
        {title}
      </label>
      <div style={{ paddingLeft: '24px', marginTop: '8px' }}>
        {items.map((item) => (
          <label
            key={item.key}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '6px' }}
          >
            <input
              type="checkbox"
              checked={filters[item.key] as boolean}
              onChange={(e) => onChange({ ...filters, [item.key]: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '14px' }}>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
```

---

### Task 2.3: Integrate Filter Panel into Modal
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: Task 2.2

**Steps**:
1. Open `app/src/components/Modals/ExportModal.tsx`
2. Add `filters` state (initialize with `DEFAULT_FILTERS`)
3. Import and render `ExportFilterPanel`
4. Pass filters and onChange handler
5. Update `onExport` to pass filters

**Validation**:
- [ ] Filter panel renders in modal
- [ ] Filter changes update state
- [ ] Export button receives current filters

**Code Example**:
```typescript
// app/src/components/Modals/ExportModal.tsx (updated)
import { ExportFilterPanel } from './ExportFilterPanel';
import { DEFAULT_FILTERS, type ExportFilters } from '../../types/export';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [filters, setFilters] = React.useState<ExportFilters>(DEFAULT_FILTERS);

  const handleExport = async () => {
    await onExport(filters); // Pass filters to export function
  };

  return (
    // ... modal structure
    <div>
      <h2>Export to PDF</h2>
      <ExportFilterPanel filters={filters} onChange={setFilters} />
      {/* ... buttons */}
    </div>
  );
};
```

---

### Task 2.4: Update PDF Service with Filtering Logic
**Time Estimate**: 3 hours
**Priority**: Critical
**Dependencies**: Task 2.3

**Steps**:
1. Open `app/src/services/pdfExportService.ts`
2. Update `exportToPDF()` to accept `filters` parameter
3. Implement `getTableColumns(filters)` function
4. Implement `formatShapeData(shape, filters)` function
5. Update table rendering to use filtered columns
6. Test with different filter combinations

**Validation**:
- [ ] PDF includes only selected properties
- [ ] Table columns match selected filters
- [ ] Data formatted correctly
- [ ] No data leakage (unselected properties not shown)

**Code Example**:
```typescript
// app/src/services/pdfExportService.ts (updated)
import type { ExportFilters } from '../types/export';

interface TableColumn {
  key: string;
  label: string;
  width: number;
}

export async function exportToPDF(
  shapes: DrawableShape[],
  filters: ExportFilters
): Promise<Blob> {
  // ... create PDF

  const columns = getTableColumns(filters);

  // Draw table headers
  columns.forEach((col, i) => {
    page.drawText(col.label, {
      x: 50 + i * col.width,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
  });

  // Draw shape rows
  shapes.forEach((shape) => {
    const rowData = formatShapeData(shape, filters);
    columns.forEach((col, i) => {
      page.drawText(rowData[col.key] || '', {
        x: 50 + i * col.width,
        y: yPosition,
        size: 10,
        font: font,
      });
    });
    yPosition -= 20;
  });

  // ... return blob
}

function getTableColumns(filters: ExportFilters): TableColumn[] {
  const columns: TableColumn[] = [];

  if (filters.includeShapeType) {
    columns.push({ key: 'type', label: 'Type', width: 100 });
  }
  if (filters.includeShapeId) {
    columns.push({ key: 'id', label: 'ID', width: 80 });
  }
  if (filters.includeWidth) {
    columns.push({ key: 'width', label: 'Width', width: 80 });
  }
  if (filters.includeHeight) {
    columns.push({ key: 'height', label: 'Height', width: 80 });
  }
  if (filters.includeArea) {
    columns.push({ key: 'area', label: 'Area', width: 80 });
  }
  // ... more columns

  return columns;
}

function formatShapeData(
  shape: DrawableShape,
  filters: ExportFilters
): Record<string, string> {
  const data: Record<string, string> = {};

  if (filters.includeShapeType) {
    data.type = shape.type;
  }
  if (filters.includeShapeId) {
    data.id = shape.id.slice(0, 8); // Truncate for readability
  }
  if (filters.includeWidth) {
    data.width = shape.width ? `${shape.width.toFixed(2)} m` : 'N/A';
  }
  if (filters.includeHeight) {
    data.height = shape.height ? `${shape.height.toFixed(2)} m` : 'N/A';
  }
  if (filters.includeArea) {
    data.area = `${(shape.area || 0).toFixed(2)} m²`;
  }
  // ... more properties

  return data;
}
```

---

### Task 2.5: Add Filter Validation
**Time Estimate**: 1 hour
**Priority**: High
**Dependencies**: Task 2.4

**Steps**:
1. Open `app/src/utils/exportUtils.ts`
2. Implement `validateFilters()` function
3. Update modal to disable Export button if no filters selected
4. Show warning message when no filters selected

**Validation**:
- [ ] Export button disabled when all filters deselected
- [ ] Warning message displays correctly
- [ ] Button re-enables when filters selected

**Code Example**:
```typescript
// app/src/utils/exportUtils.ts
export function validateFilters(filters: ExportFilters): boolean {
  // At least one granular filter must be selected
  return Object.entries(filters).some(
    ([key, value]) => key.startsWith('include') && value === true
  );
}

// In ExportModal.tsx
const isValid = validateFilters(filters);

<button
  onClick={handleExport}
  disabled={!isValid || isExporting}
  style={{
    backgroundColor: '#00C4CC',
    opacity: !isValid || isExporting ? 0.5 : 1,
    cursor: !isValid || isExporting ? 'not-allowed' : 'pointer',
  }}
>
  Export
</button>

{!isValid && (
  <p style={{ color: '#E53E3E', fontSize: '14px', marginTop: '8px' }}>
    Please select at least one property to export.
  </p>
)}
```

---

## Phase 3: Polish & Optimization (Week 3) - 6-8 hours

### Task 3.1: Apply Professional PDF Formatting
**Time Estimate**: 2 hours
**Priority**: High
**Dependencies**: Phase 2 complete

**Steps**:
1. Update PDF service with brand colors (teal accents)
2. Add alternating row colors for table
3. Add table borders and grid lines
4. Improve spacing and alignment
5. Add footer with page numbers
6. Add "Generated by Land Visualizer" watermark

**Validation**:
- [ ] PDF looks professional (S-Tier quality)
- [ ] Brand colors applied consistently
- [ ] Table is readable and well-spaced
- [ ] Footer displays correctly

---

### Task 3.2: Add Toast Notifications
**Time Estimate**: 1 hour
**Priority**: High
**Dependencies**: None

**Steps**:
1. Create or update toast notification system
2. Add success toast: "PDF exported successfully!"
3. Add error toast: "Export failed. Please try again."
4. Add loading toast during generation

**Validation**:
- [ ] Success toast shows after download
- [ ] Error toast shows on failure
- [ ] Loading toast shows during export
- [ ] Toasts dismiss automatically

---

### Task 3.3: Performance Optimization
**Time Estimate**: 2 hours
**Priority**: Medium
**Dependencies**: Phase 2 complete

**Steps**:
1. Lazy load pdf-lib (dynamic import)
2. Add progress indicator for large exports (>50 shapes)
3. Optimize PDF generation algorithm
4. Benchmark generation time
5. Optimize file size (compression)

**Validation**:
- [ ] P95 generation time < 3s for 50 shapes
- [ ] File size < 500KB for typical projects
- [ ] No UI blocking during generation

---

### Task 3.4: Error Handling & Edge Cases
**Time Estimate**: 1.5 hours
**Priority**: High
**Dependencies**: None

**Steps**:
1. Handle browser download blocking
2. Handle PDF generation errors
3. Handle empty shape list
4. Handle special characters in data
5. Add retry logic for failures

**Validation**:
- [ ] Errors handled gracefully
- [ ] User-friendly error messages
- [ ] Console errors logged (dev mode only)
- [ ] No uncaught exceptions

---

## Phase 4: Testing & Documentation (Week 4) - 4-6 hours

### Task 4.1: Write Unit Tests
**Time Estimate**: 2 hours
**Priority**: Critical
**Dependencies**: Phase 3 complete

**Steps**:
1. Create `app/src/services/__tests__/pdfExportService.test.ts`
2. Test `exportToPDF()` function
3. Test `getTableColumns()` function
4. Test `formatShapeData()` function
5. Test error handling
6. Achieve 70%+ code coverage

**Validation**:
- [ ] All tests pass
- [ ] Coverage > 70%
- [ ] Edge cases covered

---

### Task 4.2: Write Integration Tests
**Time Estimate**: 1.5 hours
**Priority**: High
**Dependencies**: Phase 3 complete

**Steps**:
1. Create `app/src/__tests__/exportWorkflow.test.tsx`
2. Test full export workflow (button → modal → export → download)
3. Test filter interactions
4. Test keyboard shortcuts

**Validation**:
- [ ] All integration tests pass
- [ ] End-to-end workflow works

---

### Task 4.3: Accessibility Audit
**Time Estimate**: 1 hour
**Priority**: Critical
**Dependencies**: Phase 3 complete

**Steps**:
1. Run axe-core on ExportModal
2. Test keyboard navigation
3. Test screen reader compatibility
4. Fix any violations

**Validation**:
- [ ] 100% WCAG 2.1 AA compliance
- [ ] No axe violations
- [ ] Fully keyboard accessible

---

### Task 4.4: Update Documentation
**Time Estimate**: 30 minutes
**Priority**: High
**Dependencies**: Phase 4 complete

**Steps**:
1. Update `CLAUDE.md` with export feature
2. Add to keyboard shortcuts list
3. Update Quick Start section
4. Document export formats and filters

**Validation**:
- [ ] Documentation accurate and complete
- [ ] Examples provided
- [ ] Screenshots included (optional)

---

## Summary

**Total Tasks**: 23
**Total Time Estimate**: 32-40 hours
**Phases**: 4 (over 4 weeks)

### Critical Path
1. Install dependencies → Create button → Create modal → Basic export → File download
2. Add filters → Update PDF service → Validation
3. Polish formatting → Error handling
4. Testing → Documentation

### Risk Mitigation
- **Risk**: PDF generation too slow
  - **Mitigation**: Lazy load library, optimize algorithm, add progress indicator

- **Risk**: Browser download blocking
  - **Mitigation**: User-friendly error message, retry logic

- **Risk**: Accessibility issues
  - **Mitigation**: Early testing, axe-core integration, keyboard testing

### Success Criteria
- ✅ Export button in toolbar
- ✅ Modal with filter selection
- ✅ Professional PDF output
- ✅ < 3s generation time (50 shapes)
- ✅ 100% WCAG AA compliance
- ✅ 70%+ test coverage

---

**Ready to begin Phase 1!**
