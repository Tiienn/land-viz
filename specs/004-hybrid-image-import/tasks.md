# Task Breakdown: Hybrid Image Import

**Feature ID:** 004
**Total Estimated Time:** 32-40 hours
**Priority:** P0 (Critical - Current import is broken)

---

## Phase 1: Simplify Current System (4-6 hours)

### Task 1.1: Simplify Boundary Detection
**Time Estimate:** 1-2 hours
**Priority:** P0
**Files:** `app/src/services/imageProcessing/shapeDetector.ts`

**Description:**
Remove precise vertex detection. Only detect edge count and rough outline.

**Changes:**
```typescript
// Before: Precise vertex detection with epsilon tuning
detectBoundary(epsilon = 0.05): DetectedBoundary

// After: Simple edge counting
detectBoundary(): SimpleBoundaryDetection {
  return {
    edgeCount: number;     // 3, 4, 5, 6+
    roughOutline: Point2D[]; // Approximate vertices for preview only
    confidence: number;
  }
}
```

**Validation:**
- [ ] Returns correct edge count for test images (3, 4, 5 sides)
- [ ] Completes in <2 seconds
- [ ] No crashes on poor quality images

---

### Task 1.2: Add OCR Timeout
**Time Estimate:** 1 hour
**Priority:** P0
**Files:** `app/src/services/imageImport/ImportService.ts`

**Description:**
Make OCR non-blocking with 5-second timeout.

**Implementation:**
```typescript
async importSitePlan(file: File): Promise<ImportResult> {
  // Start both in parallel
  const boundaryPromise = this.boundaryDetector.detect(file);
  const ocrPromise = this.ocrDetector.detect(file);

  // Wait for boundary (fast)
  const boundary = await boundaryPromise;

  // OCR with timeout
  const ocr = await Promise.race([
    ocrPromise,
    new Promise((resolve) =>
      setTimeout(() => resolve({ status: 'timeout' }), 5000)
    )
  ]);

  // If timeout, proceed to manual entry immediately
  if (ocr.status === 'timeout') {
    return {
      boundary,
      ocr: null,
      requiresManualEntry: true
    };
  }

  return { boundary, ocr };
}
```

**Validation:**
- [ ] OCR stops after 5 seconds
- [ ] Manual entry screen appears immediately on timeout
- [ ] No memory leaks (Tesseract worker terminated)

---

### Task 1.3: Remove Edge Direction Labeling
**Time Estimate:** 30 minutes
**Priority:** P1
**Files:**
- `app/src/components/ImageImport/EdgePreview.tsx`
- `app/src/components/ImageImport/ImageImporterModal.tsx`

**Description:**
Remove unreliable "Top/Bottom/Left/Right" auto-detection. Use simple numbering (Edge 1, 2, 3, 4).

**Changes:**
- Remove angle-based direction calculation
- Use sequential numbering only
- Update dropdown to show "Edge 1, Edge 2, ..." instead of directions

**Validation:**
- [ ] Edge preview shows numbered edges
- [ ] No directional labels in UI
- [ ] Dropdown lists edges by number

---

### Task 1.4: Update Modal Flow for Manual Entry
**Time Estimate:** 1-1.5 hours
**Priority:** P0
**Files:** `app/src/components/ImageImport/ImageImporterModal.tsx`

**Description:**
Add route to manual entry screen when OCR fails/times out.

**New View States:**
```typescript
type ViewState =
  | 'upload'
  | 'processing'       // Show for boundary + OCR (max 5s)
  | 'ocr_review'       // If OCR succeeded
  | 'manual_entry'     // If OCR failed/timeout
  | 'preview'
  | 'success'
  | 'error';
```

**Validation:**
- [ ] Routes to manual_entry after 5s timeout
- [ ] Routes to ocr_review if OCR succeeds
- [ ] User can switch between views

---

## Phase 2: Manual Entry UI (8-10 hours)

### Task 2.1: Create useImportStore
**Time Estimate:** 1.5-2 hours
**Priority:** P0
**Files:** `app/src/store/useImportStore.ts` (NEW)

**Description:**
Create Zustand store for import state management.

**Implementation:**
```typescript
interface ImportStore {
  // Upload
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;

  // Detection
  boundaryDetection: SimpleBoundaryDetection | null;
  ocrDetection: OcrDetectionResult | null;
  setBoundaryDetection: (result: SimpleBoundaryDetection) => void;
  setOcrDetection: (result: OcrDetectionResult | null) => void;

  // Manual Entry
  dimensions: DimensionInput[];
  area: number | null;
  edgeLabels: Record<number, string>;
  setDimension: (index: number, value: DimensionInput) => void;
  setArea: (area: number | null) => void;
  setEdgeLabel: (index: number, label: string) => void;

  // Reconstructed Shape
  reconstructedShape: ReconstructedShape | null;
  setReconstructedShape: (shape: ReconstructedShape) => void;

  // UI State
  currentStep: ViewState;
  goToStep: (step: ViewState) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

export const useImportStore = create<ImportStore>((set) => ({
  // ... implementation
}));
```

**Validation:**
- [ ] Store initializes correctly
- [ ] All actions work as expected
- [ ] Reset clears all state
- [ ] No memory leaks

---

### Task 2.2: Create ManualEntryForm Component
**Time Estimate:** 3-4 hours
**Priority:** P0
**Files:** `app/src/components/ImageImport/ManualEntryForm.tsx` (NEW)

**Description:**
Build main manual entry UI with dimension inputs.

**Layout:**
```tsx
<div style={{ ... }}>
  <h2>Manual Dimension Entry</h2>

  {/* Instructions */}
  <div style={{ backgroundColor: '#EFF6FF', padding: '16px', ... }}>
    <p>Enter the length of each edge. Use the preview to identify edges.</p>
  </div>

  {/* Edge Preview */}
  <EdgePreview
    vertices={roughOutline}
    selectedEdge={selectedEdgeIndex}
    onEdgeSelect={setSelectedEdgeIndex}
  />

  {/* Dimension Inputs */}
  {dimensions.map((dim, index) => (
    <div key={index} style={{ marginBottom: '16px' }}>
      <label>Edge {index + 1}</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="number"
          value={dim.value || ''}
          onChange={(e) => handleDimensionChange(index, e.target.value)}
          placeholder="0.00"
          style={{ flex: 1, ... }}
        />
        <select
          value={dim.unit}
          onChange={(e) => handleUnitChange(index, e.target.value)}
          style={{ width: '80px', ... }}
        >
          <option value="m">m</option>
          <option value="ft">ft</option>
          <option value="yd">yd</option>
        </select>
      </div>
      {errors[index] && (
        <p style={{ color: '#EF4444', fontSize: '12px' }}>
          {errors[index]}
        </p>
      )}
    </div>
  ))}

  {/* Optional Area Input */}
  <div style={{ marginTop: '24px', ... }}>
    <label>Total Area (optional)</label>
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="number"
        value={area || ''}
        onChange={(e) => setArea(parseFloat(e.target.value))}
        placeholder="0.00"
        style={{ flex: 1, ... }}
      />
      <select value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)}>
        <option value="m²">m²</option>
        <option value="ft²">ft²</option>
        <option value="yd²">yd²</option>
      </select>
    </div>
    <p style={{ fontSize: '12px', color: '#6B7280' }}>
      Used to validate calculated area
    </p>
  </div>

  {/* Actions */}
  <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
    <button onClick={onCancel} style={{ ... }}>
      ← Back
    </button>
    <button
      onClick={handleSubmit}
      disabled={!isValid}
      style={{ ... }}
    >
      Calculate Shape →
    </button>
  </div>
</div>
```

**Validation Logic:**
```typescript
function validateDimension(value: string): string | null {
  const num = parseFloat(value);

  if (isNaN(num)) return 'Please enter a number';
  if (num <= 0) return 'Must be greater than 0';
  if (num < 0.1) return 'Too small (min: 0.1m)';
  if (num > 9999) return 'Too large (max: 9999m)';

  return null; // Valid
}
```

**Validation:**
- [ ] Renders all edge inputs based on edge count
- [ ] Real-time validation shows errors
- [ ] Submit disabled until all fields valid
- [ ] Unit conversion works correctly
- [ ] Connects to useImportStore

---

### Task 2.3: Enhance EdgePreview for Selection
**Time Estimate:** 1.5-2 hours
**Priority:** P1
**Files:** `app/src/components/ImageImport/EdgePreview.tsx`

**Description:**
Make edge preview interactive - click edge to select, highlight selected edge.

**New Props:**
```typescript
interface EdgePreviewProps {
  vertices: Point2D[];
  selectedEdge: number;
  onEdgeSelect: (edgeIndex: number) => void;
  edgeLabels?: Record<number, string>; // Custom labels (e.g., "Top", "Left")
}
```

**Interaction:**
```typescript
// Detect clicks on edges
function handleCanvasClick(event: React.MouseEvent) {
  const rect = canvasRef.current.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  // Find closest edge
  const closestEdge = findClosestEdge(clickX, clickY, transformedVertices);

  if (closestEdge !== null) {
    onEdgeSelect(closestEdge);
  }
}
```

**Visual States:**
- Unselected edge: Gray (#6B7280), 2px width
- Selected edge: Blue (#3B82F6), 4px width
- Hovered edge: Light blue, 3px width, cursor pointer

**Validation:**
- [ ] Click selects edge
- [ ] Selected edge highlighted
- [ ] Hover shows feedback
- [ ] Edge labels displayed correctly

---

### Task 2.4: Add Input Validation & Error Display
**Time Estimate:** 1-1.5 hours
**Priority:** P0
**Files:** `app/src/components/ImageImport/ManualEntryForm.tsx`

**Description:**
Real-time validation with inline error messages.

**Validation Rules:**
```typescript
const validationRules = {
  dimension: {
    min: 0.1,
    max: 9999,
    required: true,
    message: {
      min: 'Minimum dimension is 0.1m',
      max: 'Maximum dimension is 9999m',
      required: 'This field is required'
    }
  },
  area: {
    min: 0.01,
    max: 999999,
    required: false
  }
};
```

**Error Display:**
```tsx
{errors[index] && (
  <div
    style={{
      color: '#EF4444',
      fontSize: '12px',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}
  >
    <span>⚠️</span>
    <span>{errors[index]}</span>
  </div>
)}
```

**Validation:**
- [ ] Shows error immediately on blur
- [ ] Clears error when fixed
- [ ] Submit button disabled if errors exist
- [ ] Error messages clear and helpful

---

### Task 2.5: Add Unit Conversion Support
**Time Estimate:** 1 hour
**Priority:** P1
**Files:** `app/src/utils/unitConversion.ts` (NEW)

**Description:**
Convert between meters, feet, yards for dimensions and area.

**Implementation:**
```typescript
export const UNIT_CONVERSIONS = {
  // Length
  length: {
    'm_to_ft': 3.28084,
    'm_to_yd': 1.09361,
    'ft_to_m': 0.3048,
    'ft_to_yd': 0.333333,
    'yd_to_m': 0.9144,
    'yd_to_ft': 3
  },
  // Area
  area: {
    'm²_to_ft²': 10.7639,
    'm²_to_yd²': 1.19599,
    'ft²_to_m²': 0.092903,
    'ft²_to_yd²': 0.111111,
    'yd²_to_m²': 0.836127,
    'yd²_to_ft²': 9
  }
};

export function convertLength(
  value: number,
  fromUnit: 'm' | 'ft' | 'yd',
  toUnit: 'm' | 'ft' | 'yd'
): number {
  if (fromUnit === toUnit) return value;

  const key = `${fromUnit}_to_${toUnit}` as keyof typeof UNIT_CONVERSIONS.length;
  return value * UNIT_CONVERSIONS.length[key];
}

export function convertArea(
  value: number,
  fromUnit: 'm²' | 'ft²' | 'yd²',
  toUnit: 'm²' | 'ft²' | 'yd²'
): number {
  if (fromUnit === toUnit) return value;

  const key = `${fromUnit}_to_${toUnit}` as keyof typeof UNIT_CONVERSIONS.area;
  return value * UNIT_CONVERSIONS.area[key];
}
```

**Validation:**
- [ ] Converts length correctly (m ↔ ft ↔ yd)
- [ ] Converts area correctly (m² ↔ ft² ↔ yd²)
- [ ] Handles edge cases (0, very large numbers)
- [ ] Unit tests pass

---

## Phase 3: Geometry Reconstruction (6-8 hours)

### Task 3.1: Create Geometry Reconstructor Service
**Time Estimate:** 3-4 hours
**Priority:** P0
**Files:** `app/src/services/imageImport/geometryReconstructor.ts` (NEW)

**Description:**
Build shape vertices from edge dimensions.

**Algorithm for Rectangles:**
```typescript
export class GeometryReconstructor {
  reconstructRectangle(dimensions: [number, number, number, number]): ReconstructedShape {
    const [top, right, bottom, left] = dimensions;

    // Validate it's a rectangle (opposite sides equal)
    const topBottomDiff = Math.abs(top - bottom);
    const leftRightDiff = Math.abs(left - right);

    if (topBottomDiff > 0.1 || leftRightDiff > 0.1) {
      throw new ValidationWarning(
        'Opposite sides are not equal. This may not be a perfect rectangle.'
      );
    }

    // Use average of opposite sides
    const width = (top + bottom) / 2;
    const height = (left + right) / 2;

    // Build vertices (centered at origin)
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return {
      vertices: [
        { x: -halfWidth, y: halfHeight, z: 0 },  // Top-left
        { x: halfWidth, y: halfHeight, z: 0 },   // Top-right
        { x: halfWidth, y: -halfHeight, z: 0 },  // Bottom-right
        { x: -halfWidth, y: -halfHeight, z: 0 }  // Bottom-left
      ],
      angles: [90, 90, 90, 90],
      area: width * height,
      warnings: []
    };
  }
}
```

**Algorithm for Flexible Shapes:**
```typescript
reconstructFlexible(dimensions: number[]): ReconstructedShape {
  // Use constraint-based solver
  // For now, use simplified approach: place vertices iteratively

  const vertices: Point3D[] = [];
  let currentAngle = 0;
  let currentPos = { x: 0, y: 0 };

  // Place first vertex at origin
  vertices.push({ x: 0, y: 0, z: 0 });

  // Place subsequent vertices
  for (let i = 0; i < dimensions.length - 1; i++) {
    const length = dimensions[i];

    // Move in current direction
    currentPos = {
      x: currentPos.x + length * Math.cos(currentAngle),
      y: currentPos.y + length * Math.sin(currentAngle)
    };

    vertices.push({ ...currentPos, z: 0 });

    // Turn (assume equal angles for now)
    const turnAngle = (2 * Math.PI) / dimensions.length;
    currentAngle += turnAngle;
  }

  // Calculate actual angles
  const angles = this.calculateAngles(vertices);

  // Validate polygon closes
  const lastVertex = vertices[vertices.length - 1];
  const closureError = Math.sqrt(lastVertex.x ** 2 + lastVertex.y ** 2);

  if (closureError > 0.1) {
    throw new ValidationError(
      `These dimensions cannot form a closed polygon (gap: ${closureError.toFixed(2)}m)`
    );
  }

  return {
    vertices,
    angles,
    area: this.calculateArea(vertices),
    warnings: []
  };
}
```

**Validation:**
- [ ] Builds valid rectangle from 4 dimensions
- [ ] Calculates correct area
- [ ] Detects impossible geometries
- [ ] Throws clear error messages
- [ ] Unit tests pass

---

### Task 3.2: Create Angle Calculator Utility
**Time Estimate:** 1-1.5 hours
**Priority:** P0
**Files:** `app/src/services/imageImport/angleCalculator.ts` (NEW)

**Description:**
Calculate corner angles from vertices.

**Implementation:**
```typescript
export function calculateAngles(vertices: Point3D[]): number[] {
  const angles: number[] = [];

  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    // Vectors
    const v1 = {
      x: prev.x - current.x,
      y: prev.y - current.y
    };
    const v2 = {
      x: next.x - current.x,
      y: next.y - current.y
    };

    // Angle between vectors
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(cosAngle) * (180 / Math.PI);

    angles.push(angle);
  }

  return angles;
}

export function validateAngles(
  angles: number[],
  thresholds: { min: number; max: number } = { min: 45, max: 135 }
): AngleWarning[] {
  const warnings: AngleWarning[] = [];

  angles.forEach((angle, index) => {
    if (angle < thresholds.min) {
      warnings.push({
        corner: index + 1,
        angle,
        severity: 'warning',
        message: `Corner ${index + 1}: ${angle.toFixed(1)}° (very acute)`
      });
    } else if (angle > thresholds.max) {
      warnings.push({
        corner: index + 1,
        angle,
        severity: 'warning',
        message: `Corner ${index + 1}: ${angle.toFixed(1)}° (very obtuse)`
      });
    }
  });

  return warnings;
}
```

**Validation:**
- [ ] Calculates correct angles for square (all 90°)
- [ ] Detects acute angles (<45°)
- [ ] Detects obtuse angles (>135°)
- [ ] Unit tests pass

---

### Task 3.3: Add Area Validation Logic
**Time Estimate:** 1 hour
**Priority:** P1
**Files:** `app/src/services/imageImport/geometryReconstructor.ts`

**Description:**
Compare calculated area with user-provided area.

**Implementation:**
```typescript
export function validateArea(
  calculatedArea: number,
  providedArea: number | null,
  tolerance: number = 0.05 // 5%
): AreaValidation {
  if (providedArea === null) {
    return {
      status: 'not_provided',
      message: 'No area provided for validation'
    };
  }

  const difference = Math.abs(calculatedArea - providedArea);
  const percentDiff = difference / providedArea;

  if (percentDiff <= tolerance) {
    return {
      status: 'valid',
      calculatedArea,
      providedArea,
      difference,
      percentDiff,
      message: `✓ ${(percentDiff * 100).toFixed(1)}% difference - acceptable`
    };
  } else {
    return {
      status: 'mismatch',
      calculatedArea,
      providedArea,
      difference,
      percentDiff,
      message: `⚠️ Calculated area (${calculatedArea.toFixed(1)}m²) differs from provided area (${providedArea.toFixed(1)}m²) by ${(percentDiff * 100).toFixed(1)}%`
    };
  }
}
```

**Validation:**
- [ ] Accepts areas within 5% tolerance
- [ ] Warns about larger differences
- [ ] Handles null (no provided area)
- [ ] Unit tests pass

---

### Task 3.4: Create AngleDisplay Component
**Time Estimate:** 1.5-2 hours
**Priority:** P1
**Files:** `app/src/components/ImageImport/AngleDisplay.tsx` (NEW)

**Description:**
Visual display of calculated angles with warnings.

**Layout:**
```tsx
<div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
  <h3 style={{ marginBottom: '16px' }}>Shape Angles</h3>

  {/* Visual angle diagram */}
  <canvas
    ref={canvasRef}
    width={300}
    height={200}
    style={{ display: 'block', margin: '0 auto' }}
  />

  {/* Angle list */}
  <div style={{ marginTop: '16px' }}>
    {angles.map((angle, index) => (
      <div
        key={index}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px',
          backgroundColor: isUnusual(angle) ? '#FEF3C7' : 'transparent'
        }}
      >
        <span>Corner {index + 1}:</span>
        <span style={{ fontWeight: '600' }}>{angle.toFixed(1)}°</span>
      </div>
    ))}
  </div>

  {/* Warnings */}
  {warnings.length > 0 && (
    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
      <p style={{ fontWeight: '600', marginBottom: '8px' }}>⚠️ Unusual angles detected:</p>
      <ul style={{ paddingLeft: '20px' }}>
        {warnings.map((warning, index) => (
          <li key={index}>{warning.message}</li>
        ))}
      </ul>
      <p style={{ marginTop: '8px', fontSize: '12px' }}>
        Double-check your dimensions!
      </p>
    </div>
  )}
</div>
```

**Validation:**
- [ ] Displays all angles
- [ ] Highlights unusual angles
- [ ] Shows warnings clearly
- [ ] Canvas diagram renders correctly

---

## Phase 4: Edge Reordering (3-4 hours)

### Task 4.1: Create EdgeReorderControl Component
**Time Estimate:** 2-2.5 hours
**Priority:** P1
**Files:** `app/src/components/ImageImport/EdgeReorderControl.tsx` (NEW)

**Description:**
Dropdown to reassign edge labels.

**Implementation:**
```tsx
interface EdgeReorderControlProps {
  edgeIndex: number;
  currentLabel: string;
  onLabelChange: (newLabel: string) => void;
}

export const EdgeReorderControl: React.FC<EdgeReorderControlProps> = ({
  edgeIndex,
  currentLabel,
  onLabelChange
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '14px', fontWeight: '500' }}>
        Edge {edgeIndex + 1}:
      </label>

      <select
        value={currentLabel}
        onChange={(e) => onLabelChange(e.target.value)}
        style={{
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        <option value="top">Top</option>
        <option value="right">Right</option>
        <option value="bottom">Bottom</option>
        <option value="left">Left</option>
        <option value="custom">Custom...</option>
      </select>

      {currentLabel === 'custom' && (
        <input
          type="text"
          placeholder="Enter custom label"
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
        />
      )}
    </div>
  );
};
```

**Validation:**
- [ ] Dropdown shows available labels
- [ ] Custom label input appears when selected
- [ ] onChange fires correctly
- [ ] Integrates with ManualEntryForm

---

### Task 4.2: Implement Auto-Adjustment Logic
**Time Estimate:** 1-1.5 hours
**Priority:** P1
**Files:** `app/src/store/useImportStore.ts`

**Description:**
When user changes one edge label, intelligently adjust others.

**Logic:**
```typescript
function autoAdjustEdgeLabels(
  changedIndex: number,
  newLabel: string,
  currentLabels: Record<number, string>
): Record<number, string> {
  const updatedLabels = { ...currentLabels };
  updatedLabels[changedIndex] = newLabel;

  // Detect conflicts (duplicate labels)
  const labelCounts: Record<string, number> = {};
  Object.values(updatedLabels).forEach(label => {
    labelCounts[label] = (labelCounts[label] || 0) + 1;
  });

  // If duplicate detected, warn user
  const hasDuplicates = Object.values(labelCounts).some(count => count > 1);
  if (hasDuplicates) {
    // Show warning
    console.warn('Duplicate edge labels detected');
  }

  return updatedLabels;
}
```

**Validation:**
- [ ] Detects duplicate labels
- [ ] Shows warning to user
- [ ] Suggests corrections

---

## Phase 5: Template System (4-5 hours)

### Task 5.1: Enhance TemplateService
**Time Estimate:** 1.5-2 hours
**Priority:** P2
**Files:** `app/src/services/templateService.ts`

**Description:**
Add CRUD operations for saving/loading dimension templates.

**Implementation:**
```typescript
export class TemplateService {
  private readonly STORAGE_KEY = 'land-viz-dimension-templates';

  save(name: string, dimensions: DimensionInput[], edgeCount: number): SavedTemplate {
    const templates = this.getAll();

    const template: SavedTemplate = {
      id: `template_${Date.now()}`,
      name,
      dimensions,
      edgeCount,
      createdAt: new Date().toISOString()
    };

    templates.push(template);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));

    return template;
  }

  getAll(): SavedTemplate[] {
    const json = localStorage.getItem(this.STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  }

  delete(id: string): void {
    const templates = this.getAll().filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
  }

  load(id: string): SavedTemplate | null {
    return this.getAll().find(t => t.id === id) || null;
  }
}
```

**Validation:**
- [ ] Saves template to localStorage
- [ ] Loads template correctly
- [ ] Deletes template
- [ ] Handles localStorage quota exceeded

---

### Task 5.2: Create TemplateLibrary Component
**Time Estimate:** 2-2.5 hours
**Priority:** P2
**Files:** `app/src/components/ImageImport/TemplateLibrary.tsx` (NEW)

**Description:**
UI for browsing and loading templates.

**Layout:**
```tsx
<div style={{ padding: '16px' }}>
  <h3>Template Library</h3>

  {/* Built-in Templates */}
  <section style={{ marginBottom: '24px' }}>
    <h4>Built-in Templates</h4>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
      <TemplateCard
        name="Rectangle"
        description="Standard rectangular lot"
        onLoad={() => loadBuiltInTemplate('rectangle')}
      />
      <TemplateCard
        name="L-Shape"
        description="L-shaped corner lot"
        onLoad={() => loadBuiltInTemplate('l-shape')}
      />
    </div>
  </section>

  {/* User Templates */}
  <section>
    <h4>Your Templates</h4>
    {userTemplates.length === 0 ? (
      <p style={{ color: '#6B7280', fontSize: '14px' }}>
        No saved templates yet. Create one by saving your current shape!
      </p>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {userTemplates.map(template => (
          <TemplateCard
            key={template.id}
            name={template.name}
            description={`${template.edgeCount} edges`}
            onLoad={() => loadUserTemplate(template.id)}
            onDelete={() => deleteTemplate(template.id)}
          />
        ))}
      </div>
    )}
  </section>
</div>
```

**Validation:**
- [ ] Displays built-in templates
- [ ] Displays user templates
- [ ] Load button works
- [ ] Delete button works
- [ ] Empty state shows correctly

---

### Task 5.3: Add Save Template Dialog
**Time Estimate:** 30 minutes
**Priority:** P2
**Files:** `app/src/components/ImageImport/SaveTemplateDialog.tsx` (NEW)

**Description:**
Modal for saving current dimensions as template.

**Implementation:**
```tsx
<div style={{ /* modal overlay */ }}>
  <div style={{ /* modal content */ }}>
    <h3>Save as Template</h3>

    <label>Template Name</label>
    <input
      type="text"
      value={templateName}
      onChange={(e) => setTemplateName(e.target.value)}
      placeholder="e.g., Standard 10m × 25m lot"
      style={{ width: '100%', padding: '8px', ... }}
    />

    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={handleSave} disabled={!templateName}>
        Save Template
      </button>
    </div>
  </div>
</div>
```

**Validation:**
- [ ] Opens on button click
- [ ] Validates name (non-empty)
- [ ] Saves to templateService
- [ ] Closes after save

---

## Phase 6: Integration & Polish (6-7 hours)

### Task 6.1: Integrate All Components into Modal
**Time Estimate:** 2-2.5 hours
**Priority:** P0
**Files:** `app/src/components/ImageImport/ImageImporterModal.tsx`

**Description:**
Wire up all new components in main import flow.

**Updated Flow:**
```tsx
{view === 'manual_entry' && (
  <ManualEntryForm
    edgeCount={boundaryDetection.edgeCount}
    onSubmit={handleManualEntrySubmit}
    onCancel={() => setView('upload')}
  />
)}

{view === 'preview' && (
  <GeometryPreview
    originalImage={uploadedFile}
    reconstructedShape={reconstructedShape}
    onConfirm={handleImportConfirm}
    onBack={() => setView('manual_entry')}
  />
)}
```

**Validation:**
- [ ] All views flow correctly
- [ ] Data passed between components
- [ ] No prop drilling (use store)
- [ ] Navigation works

---

### Task 6.2: Create GeometryPreview Component
**Time Estimate:** 2-2.5 hours
**Priority:** P0
**Files:** `app/src/components/ImageImport/GeometryPreview.tsx` (NEW)

**Description:**
Side-by-side preview of original image + generated shape.

**Layout:**
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
  {/* Original Image */}
  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
    <h4>Original Image</h4>
    <img src={imageUrl} style={{ width: '100%', height: 'auto' }} />
  </div>

  {/* Generated Shape */}
  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
    <h4>Generated Shape</h4>
    <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />

    {/* Measurements */}
    <div style={{ marginTop: '16px' }}>
      <p><strong>Area:</strong> {area.toFixed(2)}m²</p>
      <p><strong>Perimeter:</strong> {perimeter.toFixed(2)}m</p>
      {areaValidation.status === 'valid' && (
        <p style={{ color: '#10B981' }}>✓ {areaValidation.message}</p>
      )}
    </div>
  </div>
</div>
```

**Validation:**
- [ ] Shows original image
- [ ] Renders shape correctly
- [ ] Displays measurements
- [ ] Shows validation status

---

### Task 6.3: Add Keyboard Shortcuts
**Time Estimate:** 1 hour
**Priority:** P2
**Files:** `app/src/components/ImageImport/ManualEntryForm.tsx`

**Description:**
Keyboard shortcuts for power users.

**Shortcuts:**
- `Tab` / `Shift+Tab`: Navigate between dimension fields
- `Enter`: Submit form (if valid)
- `Escape`: Cancel/go back
- `Ctrl+S`: Save as template

**Implementation:**
```typescript
useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && isValid) {
      handleSubmit();
    } else if (event.key === 'Escape') {
      onCancel();
    } else if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      openSaveTemplateDialog();
    }
  }

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isValid, handleSubmit, onCancel]);
```

**Validation:**
- [ ] Enter submits form
- [ ] Escape cancels
- [ ] Ctrl+S opens save dialog
- [ ] Tab navigation works

---

### Task 6.4: Add Auto-Save (Survive Page Refresh)
**Time Estimate:** 30 minutes
**Priority:** P2
**Files:** `app/src/store/useImportStore.ts`

**Description:**
Persist form data to sessionStorage.

**Implementation:**
```typescript
// Save to sessionStorage on every change
useEffect(() => {
  const state = useImportStore.getState();
  sessionStorage.setItem('import-draft', JSON.stringify({
    dimensions: state.dimensions,
    area: state.area,
    edgeLabels: state.edgeLabels
  }));
}, [dimensions, area, edgeLabels]);

// Restore on mount
useEffect(() => {
  const draft = sessionStorage.getItem('import-draft');
  if (draft) {
    const data = JSON.parse(draft);
    // Restore state
  }
}, []);
```

**Validation:**
- [ ] Form data persists across refresh
- [ ] Clears after successful import
- [ ] Doesn't interfere with new imports

---

## Phase 7: Testing & Documentation (3-4 hours)

### Task 7.1: Write Unit Tests
**Time Estimate:** 1.5-2 hours
**Priority:** P0
**Files:**
- `app/src/services/imageImport/__tests__/geometryReconstructor.test.ts`
- `app/src/services/imageImport/__tests__/angleCalculator.test.ts`
- `app/src/utils/__tests__/unitConversion.test.ts`

**Test Coverage Target:** 70%+

**Key Test Cases:**
```typescript
describe('GeometryReconstructor', () => {
  it('builds valid rectangle', () => { ... });
  it('throws error for impossible triangle', () => { ... });
  it('warns about thin shapes', () => { ... });
  it('validates area correctly', () => { ... });
});

describe('AngleCalculator', () => {
  it('calculates angles for square', () => { ... });
  it('detects acute angles', () => { ... });
  it('detects obtuse angles', () => { ... });
});

describe('UnitConversion', () => {
  it('converts length correctly', () => { ... });
  it('converts area correctly', () => { ... });
});
```

---

### Task 7.2: Write Integration Tests
**Time Estimate:** 1-1.5 hours
**Priority:** P1
**Files:** `app/src/components/ImageImport/__tests__/manualEntry.integration.test.tsx`

**Test Scenarios:**
- Upload → Timeout → Manual Entry → Import
- Upload → OCR Success → Review → Import
- Manual Entry → Edge Reorder → Import
- Manual Entry → Save Template → Load Template

---

### Task 7.3: Update Documentation
**Time Estimate:** 30 minutes
**Priority:** P1
**Files:**
- `CLAUDE.md`
- `docs/project/image-import-guide.md` (NEW)

**Documentation:**
- User guide for manual dimension entry
- Troubleshooting guide
- Template system usage
- Developer notes for future enhancements

---

## Total Time Estimate: 32-40 hours

### Priority Breakdown:
- **P0 (Critical):** 20-24 hours
- **P1 (High):** 8-11 hours
- **P2 (Medium):** 4-5 hours

### Recommended Implementation Order:
1. Phase 1 (Simplify) - 4-6 hours
2. Phase 2 (Manual Entry UI) - 8-10 hours
3. Phase 3 (Geometry Reconstruction) - 6-8 hours
4. Phase 6 (Integration) - 6-7 hours
5. Phase 4 (Edge Reordering) - 3-4 hours
6. Phase 5 (Templates) - 4-5 hours
7. Phase 7 (Testing) - 3-4 hours

---

**Ready to start coding?** Begin with **Phase 1, Task 1.1** (Simplify Boundary Detection).
