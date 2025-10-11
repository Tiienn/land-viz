# Feature Specification: Hybrid Image Import with Manual Dimension Entry

**Feature ID:** 004
**Status:** Draft
**Created:** 2025-10-09
**Last Updated:** 2025-10-09

## Overview

Replace the current unreliable image-based boundary detection with a hybrid approach that combines automated detection (best effort) with manual dimension entry (reliable fallback). This ensures users can always accurately import site plans regardless of image quality or OCR success.

## Problem Statement

### Current Issues
1. **Boundary Detection Failures**
   - Epsilon parameter too sensitive (0.05 = triangles, 0.02 = too many corners)
   - Small image features (notches, curves) incorrectly detected as vertices
   - Shape orientation unpredictable after Y-axis transformations

2. **OCR Consistently Fails**
   - User's site plan has clear dimension labels (21.45m, 50.71m, 39.49m, 22.09m)
   - OCR returns garbage text despite preprocessing (CLAHE, sharpening, thresholding)
   - Confidence scores low (~33%), making results unusable

3. **Manual Scale Calculation Errors**
   - Users must guess which edge corresponds to which dimension
   - Direction labels (Top/Bottom/Left/Right) don't match final canvas orientation
   - Small pixel measurement errors multiply into large dimension errors

4. **Poor User Experience**
   - Import fails silently or produces incorrect shapes
   - No clear feedback on what went wrong
   - No reliable path to success when automation fails

### Impact
- **User Frustration:** Multiple failed import attempts
- **Data Inaccuracy:** Wrong dimensions on imported shapes
- **Time Waste:** 5+ minutes per import attempt
- **Feature Abandonment:** Users may avoid import feature entirely

## Solution

### Hybrid Approach
Combine automated detection (fast when it works) with manual entry (always reliable) to ensure success for all users.

```
┌─────────────────────────────────────┐
│ 1. Upload Image                     │
│    ↓                                │
│ 2. Auto-Detection (5s timeout)      │
│    ├─ Boundary: Count edges/shape   │
│    └─ OCR: Try to find dimensions   │
│    ↓                                │
│ 3. Decision Point                   │
│    ├─ OCR Success → Review & Confirm│
│    └─ OCR Fail   → Manual Entry     │
│    ↓                                │
│ 4. Manual Dimension Entry           │
│    ├─ Visual edge preview           │
│    ├─ Edge reordering if wrong      │
│    ├─ Dimension input per edge      │
│    └─ Optional area validation      │
│    ↓                                │
│ 5. Geometry Reconstruction          │
│    ├─ Calculate shape from dims     │
│    ├─ Validate angles               │
│    └─ Show preview overlay          │
│    ↓                                │
│ 6. Import to Canvas                 │
└─────────────────────────────────────┘
```

## User Stories

### Story 1: Quick Import (OCR Success)
```
AS A user with a high-quality site plan image
I WANT the system to auto-detect dimensions
SO THAT I can import quickly without manual entry

GIVEN I upload a clear site plan with readable dimension labels
WHEN the OCR successfully detects all dimensions
THEN I see a review screen with detected values
AND I can accept them with one click
AND the shape imports in <10 seconds
```

### Story 2: Reliable Manual Entry (OCR Failure)
```
AS A user with a poor-quality or hand-drawn site plan
I WANT to manually enter dimensions
SO THAT I get accurate results regardless of image quality

GIVEN I upload a site plan with unreadable text
WHEN OCR fails after 5 seconds
THEN I immediately see a manual entry form
AND I can enter each edge dimension
AND the system validates my input
AND generates an accurate shape
```

### Story 3: Edge Reordering
```
AS A user whose edges were detected in wrong order
I WANT to reassign which edge is which
SO THAT my dimensions match the correct sides

GIVEN the system labeled edges incorrectly
WHEN I see the preview with edge labels
THEN I can click a dropdown to reassign edges
AND the preview updates in real-time
AND other edges auto-adjust accordingly
```

### Story 4: Template Reuse
```
AS A user who frequently imports similar lots
I WANT to save common shapes as templates
SO THAT I can quickly import standard configurations

GIVEN I successfully imported a rectangular lot
WHEN I click "Save as Template"
THEN I can name it "Standard 10m × 25m lot"
AND next time I can select this template
AND pre-fill dimensions with one click
```

## Functional Requirements

### FR1: Boundary Detection (Best Effort)
- **FR1.1:** Detect shape outline from uploaded image
- **FR1.2:** Count number of edges (3, 4, 5, 6+ sides)
- **FR1.3:** Generate rough preview polygon for reference
- **FR1.4:** Label edges with best-guess directions (Top/Right/Bottom/Left)
- **FR1.5:** Complete within 2 seconds or skip

### FR2: OCR Dimension Detection (Timeout)
- **FR2.1:** Attempt OCR text recognition on upload
- **FR2.2:** Timeout after 5 seconds maximum
- **FR2.3:** If timeout: skip to manual entry immediately
- **FR2.4:** If completes after timeout: show notification with option to review
- **FR2.5:** Extract dimension values and units (m, ft, yd)

### FR3: Manual Dimension Entry
- **FR3.1:** Show input form with one field per detected edge
- **FR3.2:** Display visual preview highlighting current edge
- **FR3.3:** Support units: meters (m), feet (ft), yards (yd)
- **FR3.4:** Validate input (positive numbers, reasonable values)
- **FR3.5:** Optional area field for validation
- **FR3.6:** Show real-time shape preview as dimensions entered

### FR4: Edge Reordering
- **FR4.1:** Each edge has dropdown: [Top, Right, Bottom, Left, Custom]
- **FR4.2:** Preview updates immediately on selection change
- **FR4.3:** Prevent duplicate assignments (warning if conflict)
- **FR4.4:** Auto-adjust remaining edges when one changes
- **FR4.5:** Highlight current edge in preview

### FR5: Geometry Reconstruction
- **FR5.1:** Calculate shape vertices from edge dimensions
- **FR5.2:** Use constraint-based solver for valid geometry
- **FR5.3:** Calculate and display corner angles
- **FR5.4:** Validate area if user provided it (warn if >5% difference)
- **FR5.5:** Detect impossible geometries (warn user)

### FR6: Angle Display & Validation
- **FR6.1:** Show calculated angle at each corner
- **FR6.2:** Highlight unusual angles (<45° or >135°)
- **FR6.3:** Show warning for suspicious geometries
- **FR6.4:** Provide angle tolerance setting (default: 5°)

### FR7: Template System
- **FR7.1:** Save current shape as named template
- **FR7.2:** Template library with built-in shapes:
  - Rectangle
  - L-Shape
  - Trapezoid
  - Pentagon
- **FR7.3:** Load template to pre-fill dimension form
- **FR7.4:** Edit/delete saved templates
- **FR7.5:** Export/import templates as JSON

### FR8: Preview & Confirmation
- **FR8.1:** Show side-by-side: original image + generated shape
- **FR8.2:** Overlay generated shape on original image (semi-transparent)
- **FR8.3:** Display all calculated measurements
- **FR8.4:** Allow user to go back and edit before importing
- **FR8.5:** Import to canvas with proper scale and orientation

## Non-Functional Requirements

### NFR1: Performance
- **NFR1.1:** Boundary detection completes in <2 seconds
- **NFR1.2:** OCR timeout at 5 seconds (no waiting)
- **NFR1.3:** Manual entry UI responds in <100ms
- **NFR1.4:** Preview updates in <200ms
- **NFR1.5:** Total import process <30 seconds (manual entry)

### NFR2: Usability
- **NFR2.1:** Clear visual feedback at each step
- **NFR2.2:** Obvious escape hatches (back/cancel buttons)
- **NFR2.3:** Inline validation errors (not just on submit)
- **NFR2.4:** Keyboard shortcuts for power users
- **NFR2.5:** Mobile-friendly (touch-optimized inputs)

### NFR3: Reliability
- **NFR3.1:** Never fail silently (always show error message)
- **NFR3.2:** Graceful degradation (OCR fails → manual entry)
- **NFR3.3:** Input validation prevents impossible shapes
- **NFR3.4:** Undo/redo support for all operations
- **NFR3.5:** Auto-save form data (survive page refresh)

### NFR4: Accuracy
- **NFR4.1:** Geometry calculation precision: 0.01m
- **NFR4.2:** Angle calculation precision: 0.1°
- **NFR4.3:** Area validation tolerance: 5%
- **NFR4.4:** Support dimensions up to 9999m per edge
- **NFR4.5:** Handle edge cases (very thin/wide shapes)

## Acceptance Criteria

### AC1: Hybrid Flow Works
```
GIVEN user uploads any site plan image
WHEN OCR fails to detect dimensions
THEN manual entry form appears within 5 seconds
AND user can enter dimensions for each edge
AND shape imports successfully with correct dimensions
```

### AC2: Edge Reordering Works
```
GIVEN edge detection labeled "Edge 1" as "Top" but it's actually "Bottom"
WHEN user clicks edge dropdown and selects "Bottom"
THEN preview updates immediately
AND other edges auto-adjust
AND final imported shape has correct orientation
```

### AC3: Angle Validation Works
```
GIVEN user enters edge dimensions: 10m, 20m, 10m, 5m
WHEN system calculates geometry
THEN warning appears: "Corner 4: 45° (very acute)"
AND user can review before importing
```

### AC4: Template System Works
```
GIVEN user successfully imported a 10m × 25m rectangular lot
WHEN user clicks "Save as Template" and names it "Standard Suburban"
THEN next import can load "Standard Suburban"
AND dimensions pre-fill: 10m, 25m, 10m, 25m
AND user can adjust if needed
```

### AC5: Area Validation Works
```
GIVEN user enters dimensions: 21.45m, 39.49m, 22.09m, 50.71m
AND user enters area: 1050m²
WHEN system calculates area: 1046.5m²
THEN shows: "✓ 0.3% difference - acceptable"
AND imports successfully
```

## Edge Cases

### E1: Impossible Geometry
```
INPUT: 3-sided shape with edges 10m, 20m, 50m
EXPECTED: Error - "These dimensions cannot form a valid triangle"
REASON: 10 + 20 < 50 (violates triangle inequality)
```

### E2: Very Thin Shape
```
INPUT: Rectangle 100m × 0.5m
EXPECTED: Warning - "Very thin shape (200:1 ratio). Is this correct?"
REASON: Likely user error (forgot decimal point?)
```

### E3: Area Mismatch
```
INPUT: Dimensions suggest 1000m², user enters area: 1500m²
EXPECTED: Error - "Calculated area (1000m²) differs from provided area (1500m²) by 50%"
REASON: Either wrong dimensions or wrong area
```

### E4: OCR Completes After Timeout
```
GIVEN: OCR times out at 5 seconds, user starts manual entry
WHEN: OCR completes at 8 seconds with results
THEN: Show notification: "💡 Auto-detected dimensions available"
AND: User can click to review detected values
AND: Can choose to use them or continue manual entry
```

### E5: Decimal Input Errors
```
INPUT: User enters "22,09" (European decimal separator)
EXPECTED: Auto-convert to "22.09"
REASON: Support international number formats
```

## UI/UX Requirements

### Visual Design
- **Canva-inspired**: Clean, modern, friendly aesthetics
- **Color Palette**:
  - Primary: `#3B82F6` (blue - for actionable elements)
  - Success: `#10B981` (green - for valid geometry)
  - Warning: `#F59E0B` (amber - for suspicious values)
  - Error: `#EF4444` (red - for invalid input)
- **Typography**: Nunito Sans throughout
- **Spacing**: 8px grid system
- **Animations**: 200ms transitions

### Interactive Elements
- **Edge Preview**: Hover to highlight edge, click to edit
- **Real-time Validation**: Immediate feedback on input
- **Progress Indicator**: Show current step (1 of 5)
- **Help Tooltips**: Inline explanations for complex fields
- **Keyboard Navigation**: Tab through fields, Enter to submit

### Responsive Design
- **Desktop (1440px+)**: Side-by-side preview
- **Tablet (768px-1439px)**: Stacked preview, full-width inputs
- **Mobile (375px-767px)**: Single column, touch-friendly buttons

## Technical Constraints

### TC1: Browser Compatibility
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile Safari 14+, Chrome Android 90+

### TC2: File Size Limits
- Max image upload: 10MB
- Supported formats: JPG, PNG, PDF (first page)

### TC3: Dependency Updates
- Keep OpenCV.js (boundary detection)
- Keep Tesseract.js (OCR, but demote to optional)
- Add constraint solver library (e.g., Cassowary.js)

### TC4: State Management
- Use existing Zustand store pattern
- Add new `useImportStore.ts` for import state
- Persist template library to localStorage

### TC5: Security
- Client-side only processing (no server uploads)
- Sanitize user input (prevent XSS in template names)
- Validate file types before processing

## Out of Scope (V1)

- ❌ AI-powered shape recognition
- ❌ Curved boundaries (only straight edges)
- ❌ Multi-parcel import (one shape per upload)
- ❌ Batch import (multiple files)
- ❌ Cloud template sync
- ❌ Import from CAD files (DXF, DWG)
- ❌ Automatic georeferencing
- ❌ Scale calibration using known objects

## Future Enhancements (V2+)

- 🔮 AI shape recognition (ML model)
- 🔮 Support curved boundaries (Bezier curves)
- 🔮 Import from CAD/GIS formats
- 🔮 Cloud template library
- 🔮 Collaborative template sharing
- 🔮 Mobile app (native iOS/Android)

## Success Metrics

### Quantitative
- **Import Success Rate:** >95% (currently ~30%)
- **Time to Import:** <30 seconds for manual entry
- **User Satisfaction:** 4.5/5 stars (NPS survey)
- **Feature Adoption:** 80% of users try import feature
- **Error Rate:** <5% invalid geometries submitted

### Qualitative
- Users report "easy to use" in feedback
- No complaints about incorrect dimensions
- Users trust the import feature
- Feature becomes primary way to add shapes

## Dependencies

### Internal
- `useAppStore.ts` - Main Zustand store (shape management)
- `importService.ts` - Import orchestration
- `GeometryCache.ts` - Shape rendering
- `logger.ts` - Debug logging

### External
- OpenCV.js (boundary detection)
- Tesseract.js (OCR, demoted to optional)
- New: Cassowary.js or similar (constraint solver)

## Ambiguities & Open Questions

### AMBIGUITY 1: Angle Calculation Algorithm
**Question:** How to calculate optimal angles given edge dimensions?
**Options:**
  - A) Use constraint solver (accurate but complex)
  - B) Assume right angles, adjust iteratively (simple but approximate)
  - C) Let user specify angles manually (most flexible)
**Decision Needed:** Discuss with user

### AMBIGUITY 2: Template Storage Format
**Question:** How to store templates?
**Options:**
  - A) localStorage (simple, client-side only)
  - B) IndexedDB (more storage, complex API)
  - C) Cloud sync (requires backend)
**Decision Needed:** Start with A, migrate to B/C later

### AMBIGUITY 3: OCR Background Processing
**Question:** If OCR completes after user started manual entry, what to do?
**Options:**
  - A) Discard OCR results silently
  - B) Show notification, let user review
  - C) Auto-fill remaining fields
**Decision Needed:** Option B (non-intrusive)

### AMBIGUITY 4: Edge Ordering for Non-Rectangular Shapes
**Question:** How to label edges for 5+ sided shapes?
**Options:**
  - A) Clockwise numbering (Edge 1, 2, 3...)
  - B) Directional labels where possible (Top-Left, Top-Right...)
  - C) Let user name edges custom
**Decision Needed:** Combine A (default) + C (optional custom names)

## References

- [OpenCV.js Documentation](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Cassowary.js Constraint Solver](https://github.com/slightlyoff/cassowary.js/)
- [Canva Design System](https://www.canva.com/design-system/)

---

**Next Steps:**
1. Review this spec with stakeholders
2. Resolve ambiguities (marked above)
3. Create technical implementation plan
4. Break down into development tasks
