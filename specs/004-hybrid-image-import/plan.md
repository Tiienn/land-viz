# Implementation Plan: Hybrid Image Import

**Feature ID:** 004
**Plan Version:** 1.0
**Created:** 2025-10-09

## Architecture Overview

### High-Level Components

```
┌──────────────────────────────────────────────────┐
│         ImageImporterModal (UI)                  │
│  ┌────────────────────────────────────────────┐ │
│  │  UploadZone → ProcessingView → ManualEntry │ │
│  │      ↓              ↓              ↓        │ │
│  │  EdgePreview → AngleDisplay → TemplateLib  │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│          Import Services Layer                    │
│  ┌────────────────────────────────────────────┐ │
│  │  boundaryDetector (OpenCV)                  │ │
│  │  ocrDetector (Tesseract, optional)          │ │
│  │  geometryReconstructor (Constraint Solver)  │ │
│  │  templateService (localStorage)             │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│          State Management                         │
│  ┌────────────────────────────────────────────┐ │
│  │  useImportStore (Zustand)                   │ │
│  │  - Upload state                              │ │
│  │  - Detection results                         │ │
│  │  - Manual entry data                         │ │
│  │  - Template library                          │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│          Canvas Integration                       │
│  ┌────────────────────────────────────────────┐ │
│  │  useAppStore.addShape()                     │ │
│  │  ShapeRenderer                               │ │
│  │  GeometryCache                               │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Data Flow

```
1. User uploads image
     ↓
2. boundaryDetector.detect(image) [2s max]
   ├─ Success: { edgeCount: 4, vertices: [...] }
   └─ Failure: { edgeCount: 0, error: "..." }
     ↓
3. ocrDetector.detect(image) [5s timeout]
   ├─ Success: { dimensions: [21.45, 39.49, ...], confidence: 0.85 }
   ├─ Timeout: Skip, show manual entry
   └─ Failure: { dimensions: [], confidence: 0 }
     ↓
4. Manual entry form
   ├─ User inputs: [21.45m, 39.49m, 22.09m, 50.71m]
   ├─ Optional area: 1050m²
   └─ Edge reordering if needed
     ↓
5. geometryReconstructor.build(dimensions)
   ├─ Calculate vertices
   ├─ Validate angles
   ├─ Check area (if provided)
   └─ Returns: { vertices: [...], angles: [...], area: 1046.5 }
     ↓
6. Preview confirmation
     ↓
7. useAppStore.addShape(shape)
```

## File Structure

### New Files to Create

```
app/src/
├── components/ImageImport/
│   ├── ManualEntryForm.tsx          # Main manual entry UI (NEW)
│   ├── EdgeReorderControl.tsx       # Edge dropdown & reordering (NEW)
│   ├── AngleDisplay.tsx              # Show calculated angles (NEW)
│   ├── TemplateLibrary.tsx           # Template UI (NEW)
│   ├── TemplateCard.tsx              # Single template item (NEW)
│   └── GeometryPreview.tsx           # Side-by-side preview (NEW)
│
├── services/imageImport/
│   ├── geometryReconstructor.ts     # Constraint-based shape building (NEW)
│   ├── templateService.ts           # Template CRUD operations (EXISTS - enhance)
│   └── angleCalculator.ts            # Angle math utilities (NEW)
│
├── store/
│   └── useImportStore.ts             # Import-specific state (NEW)
│
└── types/
    └── importTypes.ts                # Extended type definitions (UPDATE)
```

### Files to Modify

```
app/src/
├── components/ImageImport/
│   ├── ImageImporterModal.tsx       # Add manual entry flow
│   └── EdgePreview.tsx               # Enhance with edge selection
│
├── services/imageImport/
│   ├── ImportService.ts              # Add timeout logic, orchestration
│   ├── shapeDetector.ts              # Simplify (just count edges)
│   └── dimensionExtractor.ts         # Make OCR optional/skippable
│
└── types/
    └── imageImport.ts                # Add manual entry types
```

## Component Design

### 1. ManualEntryForm.tsx

**Purpose:** Main UI for manual dimension entry

**Props:**
```typescript
interface ManualEntryFormProps {
  edgeCount: number;
  detectedEdges?: EdgeDetection[];
  onSubmit: (data: ManualEntryData) => void;
  onCancel: () => void;
}

interface ManualEntryData {
  dimensions: Array<{
    edge: number;
    value: number;
    unit: 'm' | 'ft' | 'yd';
    label: 'Top' | 'Right' | 'Bottom' | 'Left' | string;
  }>;
  area?: {
    value: number;
    unit: 'm²' | 'ft²' | 'yd²';
  };
}
```

**State:**
```typescript
const [dimensions, setDimensions] = useState<DimensionInput[]>([]);
const [area, setArea] = useState<number | null>(null);
const [errors, setErrors] = useState<Record<number, string>>({});
const [selectedEdge, setSelectedEdge] = useState<number>(0);
```

**Validation:**
- Positive numbers only
- Reasonable range: 0.1m - 9999m
- Check for impossible geometries
- Area validation (if provided)

**Layout:**
```
┌────────────────────────────────────────┐
│  Manual Dimension Entry                │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │   [Edge Preview Component]       │ │
│  │   Shows current shape with       │ │
│  │   highlighted selected edge      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Edge 1 (Top)      [21.45] [m ▼]     │
│  Edge 2 (Right)    [39.49] [m ▼]     │
│  Edge 3 (Bottom)   [22.09] [m ▼]     │
│  Edge 4 (Left)     [50.71] [m ▼]     │
│                                        │
│  Total Area (optional): [1050] [m² ▼] │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Calculated Results:             │ │
│  │  Area: 1046.5m²                  │ │
│  │  Difference: 0.3% ✓              │ │
│  └──────────────────────────────────┘ │
│                                        │
│       [← Back]  [Import to Canvas →] │
└────────────────────────────────────────┘
```

### 2. EdgeReorderControl.tsx

**Purpose:** Allow users to reassign edge labels

**Props:**
```typescript
interface EdgeReorderControlProps {
  edgeIndex: number;
  currentLabel: string;
  availableLabels: string[];
  onLabelChange: (newLabel: string) => void;
}
```

**Behavior:**
- Dropdown with available positions
- Highlight current edge in preview
- Auto-adjust other edges on change
- Warn if duplicate assignment

### 3. AngleDisplay.tsx

**Purpose:** Show calculated corner angles

**Props:**
```typescript
interface AngleDisplayProps {
  angles: number[];
  threshold: {
    min: number; // Default: 45°
    max: number; // Default: 135°
  };
  onWarning?: (warnings: AngleWarning[]) => void;
}

interface AngleWarning {
  corner: number;
  angle: number;
  severity: 'warning' | 'error';
  message: string;
}
```

**Layout:**
```
┌────────────────────────────────────┐
│  Shape Angles                      │
├────────────────────────────────────┤
│      91° ┌────┐ 89°               │
│         /      \                   │
│    92° └────────┘ 88°              │
│                                    │
│  ✓ All angles reasonable           │
│    (Near 90° for rectangle)        │
└────────────────────────────────────┘

OR (with warnings):

┌────────────────────────────────────┐
│  Shape Angles                      │
├────────────────────────────────────┤
│      145° ┌───┐ 35°               │
│           /     \                  │
│     90° └───────┘ 90°              │
│                                    │
│  ⚠️ Unusual angles detected:       │
│  • Corner 1: 145° (very obtuse)   │
│  • Corner 2: 35° (very acute)     │
│                                    │
│  Double-check your dimensions!     │
└────────────────────────────────────┘
```

### 4. GeometryReconstructor Service

**Purpose:** Build shape from dimensions using constraints

**Algorithm:**
```typescript
class GeometryReconstructor {
  /**
   * Build shape from edge dimensions
   *
   * @param dimensions - Array of edge lengths
   * @param constraintType - 'flexible' | 'rectangular' | 'custom'
   * @returns Calculated vertices, angles, area
   */
  reconstruct(
    dimensions: number[],
    constraintType: ConstraintType = 'flexible'
  ): ReconstructedShape {

    // Step 1: Validate input
    this.validateDimensions(dimensions);

    // Step 2: Choose reconstruction strategy
    switch (constraintType) {
      case 'rectangular':
        return this.buildRectangle(dimensions);

      case 'flexible':
        return this.buildFlexibleShape(dimensions);

      case 'custom':
        return this.buildCustomShape(dimensions);
    }
  }

  private buildRectangle(dimensions: number[]): ReconstructedShape {
    // Simple case: 4 dimensions, assume right angles
    const [width, height] = [dimensions[0], dimensions[1]];

    return {
      vertices: [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
      ],
      angles: [90, 90, 90, 90],
      area: width * height
    };
  }

  private buildFlexibleShape(dimensions: number[]): ReconstructedShape {
    // Complex case: Use constraint solver
    const solver = new ConstraintSolver();

    // Add edge length constraints
    dimensions.forEach((length, i) => {
      solver.addConstraint({
        type: 'edge-length',
        edge: i,
        value: length
      });
    });

    // Add closure constraint (polygon must close)
    solver.addConstraint({
      type: 'closed-polygon',
      tolerance: 0.01
    });

    // Optimize for natural angles (prefer right angles)
    solver.setObjective('minimize-angle-variance');

    // Solve
    const solution = solver.solve();

    return {
      vertices: solution.vertices,
      angles: this.calculateAngles(solution.vertices),
      area: this.calculateArea(solution.vertices)
    };
  }

  private validateDimensions(dimensions: number[]): void {
    // Check triangle inequality for triangles
    if (dimensions.length === 3) {
      const [a, b, c] = dimensions.sort((x, y) => x - y);
      if (a + b <= c) {
        throw new ValidationError(
          'These dimensions cannot form a valid triangle'
        );
      }
    }

    // Check for very thin shapes (ratio > 100:1)
    const max = Math.max(...dimensions);
    const min = Math.min(...dimensions);
    if (max / min > 100) {
      throw new ValidationWarning(
        `Very thin shape (${(max/min).toFixed(0)}:1 ratio). Is this correct?`
      );
    }

    // Check for unreasonable sizes
    if (dimensions.some(d => d < 0.1 || d > 9999)) {
      throw new ValidationError(
        'Dimensions must be between 0.1m and 9999m'
      );
    }
  }
}
```

### 5. useImportStore (Zustand)

**State Structure:**
```typescript
interface ImportState {
  // Upload
  uploadedFile: File | null;
  uploadProgress: number;

  // Detection Results
  boundaryDetection: {
    status: 'pending' | 'success' | 'failed';
    edgeCount: number;
    vertices: Point2D[];
    confidence: number;
  } | null;

  ocrDetection: {
    status: 'pending' | 'success' | 'timeout' | 'failed';
    dimensions: DetectedDimension[];
    confidence: number;
  } | null;

  // Manual Entry
  manualEntry: {
    dimensions: DimensionInput[];
    area: number | null;
    edgeLabels: Record<number, string>;
  };

  // Geometry Reconstruction
  reconstructedShape: {
    vertices: Point3D[];
    angles: number[];
    area: number;
    warnings: ValidationWarning[];
  } | null;

  // Templates
  templates: SavedTemplate[];

  // UI State
  currentStep: 'upload' | 'detection' | 'manual_entry' | 'preview' | 'success';
  error: string | null;
}

interface ImportActions {
  // Upload
  setUploadedFile: (file: File) => void;
  clearUpload: () => void;

  // Detection
  setBoundaryDetection: (result: BoundaryDetectionResult) => void;
  setOcrDetection: (result: OcrDetectionResult) => void;

  // Manual Entry
  setDimension: (index: number, value: DimensionInput) => void;
  setArea: (area: number | null) => void;
  reorderEdge: (index: number, newLabel: string) => void;

  // Reconstruction
  reconstructGeometry: () => Promise<void>;

  // Templates
  saveTemplate: (name: string) => void;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;

  // Navigation
  goToStep: (step: ImportState['currentStep']) => void;
  reset: () => void;
}
```

## Technical Implementation

### Phase 1: Simplify Current System (Refactor)

**Goal:** Remove fragile auto-detection, prepare for manual entry

**Tasks:**
1. Modify `shapeDetector.ts` to only count edges (not precise vertices)
2. Make `dimensionExtractor.ts` non-blocking with 5s timeout
3. Remove edge direction labeling logic (unreliable)
4. Update `ImageImporterModal.tsx` to show "manual entry" immediately on timeout

### Phase 2: Manual Entry UI

**Goal:** Build core manual entry form

**Tasks:**
1. Create `ManualEntryForm.tsx` component
2. Add dimension input fields (one per edge)
3. Implement unit selection (m, ft, yd)
4. Add inline validation
5. Connect to `useImportStore`

### Phase 3: Geometry Reconstruction

**Goal:** Calculate shape from dimensions

**Tasks:**
1. Create `geometryReconstructor.ts` service
2. Implement rectangular shape builder (simple case)
3. Implement flexible shape builder (constraint solver)
4. Add angle calculation utilities
5. Add area validation logic

### Phase 4: Edge Reordering

**Goal:** Let users fix incorrect edge labels

**Tasks:**
1. Create `EdgeReorderControl.tsx` component
2. Add dropdown for edge label selection
3. Update `EdgePreview.tsx` to highlight selected edge
4. Implement auto-adjustment of other edges
5. Add duplicate detection warning

### Phase 5: Angle Display & Validation

**Goal:** Show angles, warn about suspicious geometry

**Tasks:**
1. Create `AngleDisplay.tsx` component
2. Visualize angles on shape preview
3. Implement angle threshold warnings
4. Add validation for impossible geometries

### Phase 6: Template System

**Goal:** Save/load common shapes

**Tasks:**
1. Create `TemplateLibrary.tsx` component
2. Enhance `templateService.ts` with CRUD operations
3. Add template save dialog
4. Add template load/apply logic
5. Implement localStorage persistence

### Phase 7: Integration & Polish

**Goal:** Connect all pieces, refine UX

**Tasks:**
1. Update `ImageImporterModal.tsx` with full flow
2. Add side-by-side preview
3. Implement keyboard shortcuts
4. Add auto-save (survive page refresh)
5. Polish animations and transitions

## Testing Strategy

### Unit Tests

```typescript
// geometryReconstructor.test.ts
describe('GeometryReconstructor', () => {
  it('builds valid rectangle from 4 dimensions', () => {
    const result = reconstructor.reconstruct([10, 20, 10, 20]);
    expect(result.vertices).toHaveLength(4);
    expect(result.angles).toEqual([90, 90, 90, 90]);
    expect(result.area).toBe(200);
  });

  it('throws error for impossible triangle', () => {
    expect(() => {
      reconstructor.reconstruct([10, 20, 50]);
    }).toThrow('cannot form a valid triangle');
  });

  it('warns about very thin shapes', () => {
    const result = reconstructor.reconstruct([100, 0.5, 100, 0.5]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ type: 'thin-shape' })
    );
  });
});

// angleCalculator.test.ts
describe('AngleCalculator', () => {
  it('calculates correct angles for square', () => {
    const vertices = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];
    const angles = angleCalculator.calculate(vertices);
    expect(angles).toEqual([90, 90, 90, 90]);
  });
});
```

### Integration Tests

```typescript
// manualEntry.integration.test.ts
describe('Manual Entry Flow', () => {
  it('completes full manual entry workflow', async () => {
    // Upload image
    render(<ImageImporterModal isOpen={true} />);
    const file = new File(['dummy'], 'site-plan.jpg', { type: 'image/jpeg' });
    await uploadFile(file);

    // Wait for timeout (OCR fails)
    await waitFor(() => {
      expect(screen.getByText(/manual entry/i)).toBeInTheDocument();
    }, { timeout: 6000 });

    // Enter dimensions
    await userEvent.type(screen.getByLabelText(/edge 1/i), '21.45');
    await userEvent.type(screen.getByLabelText(/edge 2/i), '39.49');
    await userEvent.type(screen.getByLabelText(/edge 3/i), '22.09');
    await userEvent.type(screen.getByLabelText(/edge 4/i), '50.71');

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /import/i }));

    // Verify shape added to canvas
    await waitFor(() => {
      const shapes = useAppStore.getState().shapes;
      expect(shapes).toHaveLength(1);
      expect(shapes[0].type).toBe('polygon');
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// import.spec.ts
test('manual import with edge reordering', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Click import button
  await page.click('text=Import Plan');

  // Upload file
  await page.setInputFiles('input[type="file"]', 'test-site-plan.jpg');

  // Wait for manual entry screen
  await page.waitForSelector('text=Manual Dimension Entry', { timeout: 6000 });

  // Notice Edge 1 is labeled wrong
  await page.click('button:has-text("Edge 1") >> text=Top');
  await page.selectOption('select', 'Bottom');

  // Enter dimensions
  await page.fill('input[aria-label="Edge 1 dimension"]', '22.09');
  await page.fill('input[aria-label="Edge 2 dimension"]', '50.71');
  await page.fill('input[aria-label="Edge 3 dimension"]', '21.45');
  await page.fill('input[aria-label="Edge 4 dimension"]', '39.49');

  // Verify angles shown
  await expect(page.locator('text=/90°/i')).toHaveCount(4);

  // Import
  await page.click('button:has-text("Import to Canvas")');

  // Verify shape on canvas
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('text=22.09m')).toBeVisible(); // Bottom edge label
});
```

## Performance Considerations

### Optimization Targets

1. **Boundary Detection:** <2 seconds
   - Use lower resolution for detection (downscale to 800px)
   - Skip complex polygon approximation
   - Just count edges, rough outline

2. **OCR Timeout:** 5 seconds max
   - Run in Web Worker to avoid blocking UI
   - Kill worker if timeout reached
   - Show manual entry immediately

3. **Geometry Reconstruction:** <100ms
   - Cache constraint solver results
   - Use simplified algorithm for rectangles
   - Progressive refinement for complex shapes

4. **Preview Rendering:** <200ms
   - Debounce input changes (300ms)
   - Use canvas for preview (not Three.js)
   - Update only on final value

### Memory Management

- **Image Processing:** Release OpenCV Mats immediately after use
- **Web Workers:** Terminate workers after timeout
- **Template Storage:** Limit to 50 templates (localStorage quota)

## Security Considerations

### Input Validation

```typescript
// Sanitize template names (prevent XSS)
function sanitizeTemplateName(name: string): string {
  return name
    .replace(/[<>]/g, '') // Remove HTML tags
    .slice(0, 50); // Max 50 chars
}

// Validate dimension input
function validateDimension(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0 || num > 9999) {
    throw new ValidationError('Invalid dimension');
  }
  return num;
}
```

### File Upload Security

- Validate file type (check MIME type)
- Limit file size (10MB max)
- Process client-side only (no server upload)
- Sanitize file names

## Deployment Plan

### Rollout Strategy

1. **Alpha (Internal Testing)**
   - Deploy to staging environment
   - Test with 10 real site plan images
   - Gather feedback from team

2. **Beta (Limited Users)**
   - Feature flag: `enable_hybrid_import`
   - Enable for 20% of users
   - Monitor error rates, completion rates

3. **General Availability**
   - Enable for 100% of users
   - Deprecate old import flow
   - Update documentation

### Rollback Plan

If critical issues found:
1. Disable feature flag
2. Revert to old import modal
3. Fix issues in staging
4. Re-deploy after testing

## Migration from Current System

### Backward Compatibility

- Keep existing `ImportService.ts` interface
- Add new `ManualImportService.ts` alongside
- Route based on feature flag

### Data Migration

No migration needed (client-side only, no stored data)

### User Communication

- Add banner: "New improved import feature available!"
- Provide video tutorial
- Update help documentation

## Success Criteria

### Technical Metrics

- [ ] Import success rate >95%
- [ ] Manual entry completion time <30s
- [ ] Geometry validation accuracy >99%
- [ ] Zero crashes/errors in production
- [ ] 70%+ test coverage

### User Metrics

- [ ] 80%+ feature adoption (users try import)
- [ ] 4.5/5 user satisfaction score
- [ ] <5% support tickets related to import
- [ ] 90%+ users complete import on first try

---

**Next Step:** Create detailed task breakdown (tasks.md)
