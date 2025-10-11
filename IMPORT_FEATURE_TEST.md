# Site Plan Image Import - Testing Guide

**Date:** 2025-10-08
**Feature Status:** ✅ Complete and Ready for Testing

---

## Quick Test Instructions

### Step 1: Open Application
1. Navigate to: http://localhost:5173
2. Wait for the application to fully load
3. Verify the toolbar is visible at the top

### Step 2: Locate Import Button
1. Look for the **"Import"** section in the toolbar
2. It should be between **"Export"** and **"Templates"** sections
3. Click the **"Site Plan"** button with the download arrow icon

### Step 3: Upload Test Image
1. Modal should open with the title "Import Site Plan"
2. You'll see a drag-and-drop upload zone
3. **Test with any of these:**
   - JPG site plan image with dimension labels
   - PNG cadastral map with measurements
   - Any image with text labels showing dimensions (e.g., "21.45m", "50ft")

### Step 4: Watch Processing
You should see progress through these steps:
- ✓ Initializing computer vision libraries... (0-10%)
- ✓ Preprocessing image... (10-20%)
- ✓ Detecting property boundary... (20-35%)
- ✓ Extracting dimensions with OCR... (35-50%)
- ✓ Matching dimensions to edges... (50-65%)
- ✓ Calculating scale... (65-80%)
- ✓ Converting to 3D coordinates... (80-90%)
- ✓ Creating shape... (90-100%)

### Step 5: Verify Success
1. Green checkmark should appear
2. Message: "Your site plan has been added to the canvas"
3. Modal auto-closes after 2 seconds
4. Shape should appear on the 3D canvas

### Step 6: Verify Shape Properties
1. Click Select tool
2. Click on the imported shape
3. Check Properties panel:
   - Shape should have a name like "Imported: [filename]"
   - Should show area calculation
   - Should be on the "main" layer
   - Blue color (#3B82F6)

### Step 7: Test Undo/Redo
1. Press **Ctrl+Z** to undo import
2. Shape should disappear
3. Press **Ctrl+Y** to redo
4. Shape should reappear

---

## Expected Behaviors

### ✅ Valid Upload
**File Types:** JPG, PNG, PDF
**Max Size:** 10MB
**Result:** Progress bar → Success message → Shape on canvas

### ⚠️ Invalid Upload
**Scenarios:**
- File too large (>10MB): Shows error "File too large (XXmb). Maximum size is 10MB"
- Wrong file type: Shows error "Invalid file type. Please use JPG, PNG, or PDF"
- No boundary detected: Shows error with retry option
- No dimensions found: Shows warning "No dimensions found in image"

### 🎯 Edge Cases Handled
- **Low confidence boundary:** Warning message displayed
- **Insufficient dimensions:** Fallback to 1:1 pixel scale with warning
- **High scale variance:** Warning about inconsistent dimensions
- **Unmatched dimensions:** Warning showing X/Y dimensions matched

---

## Console Testing

### Check for Errors
Open browser DevTools (F12) and check Console tab:

**Expected logs:**
```
[ImportService] Starting site plan import...
[ImportService] File: example.jpg (XXkb)
[ImportService] Initializing OpenCV.js...
[OpenCV] Loading from CDN...
[OpenCV] Initialization complete
[Tesseract] Initializing worker...
[ImportService] Detected boundary with X vertices (confidence: XX%)
[ImportService] Extracted X dimensions
[ImportService] Matched X/X dimensions
[ImportService] Scale: XX.XX px/m (confidence: XX%, variance: X.X%)
[ImportService] Import successful in XXXXms
```

**Should NOT see:**
- ❌ TypeScript errors
- ❌ "Cannot read property of undefined"
- ❌ Memory leak warnings
- ❌ CORS errors
- ❌ 404 errors for OpenCV.js or Tesseract.js

---

## Performance Testing

### Library Loading Times
**First Import (Cold Start):**
- OpenCV.js download: ~8MB (~2-5 seconds on fast connection)
- Tesseract.js download: ~4MB (~1-3 seconds)
- Total initialization: ~5-10 seconds

**Subsequent Imports (Warm):**
- Libraries cached: ~0ms
- Processing only: ~2-5 seconds per image

### Processing Times by Image Size
- **Small (< 1MB):** 2-4 seconds
- **Medium (1-5MB):** 4-8 seconds
- **Large (5-10MB):** 8-15 seconds

---

## UI/UX Testing

### Modal Interactions
✅ **Keyboard Shortcuts:**
- ESC closes modal (except during processing)
- Click outside closes modal (except during processing)

✅ **Visual Feedback:**
- Hover effects on buttons
- Smooth animations (200ms transitions)
- Progress bar updates smoothly
- Spinner rotates during processing

✅ **Responsive Design:**
- Modal centers on screen
- Max width: 90vw (works on mobile)
- Scrolls if content exceeds viewport

---

## Automated Test Creation

### Unit Tests Needed
Create test file: `app/src/services/imageImport/__tests__/importService.test.ts`

```typescript
describe('ImportService', () => {
  it('should validate file type', () => {
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
    const error = importService.validateImageFile(invalidFile);
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Invalid file type');
  });

  it('should validate file size', () => {
    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)],
      'test.jpg',
      { type: 'image/jpeg' }
    );
    const error = importService.validateImageFile(largeFile);
    expect(error).not.toBeNull();
    expect(error?.message).toContain('too large');
  });

  it('should convert 3D points to 2D for drawing store', () => {
    const shape3D = {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 10, y: 10, z: 0 }
      ],
      type: 'polygon' as const
    };

    const shapeData = importService.convertToDrawingStoreShape(shape3D);
    expect(shapeData.points).toHaveLength(3);
    expect(shapeData.points[0]).toEqual({ x: 0, y: 0 });
  });
});
```

### Integration Tests Needed
Create test file: `app/src/components/ImageImport/__tests__/ImageImporterModal.test.tsx`

```typescript
describe('ImageImporterModal', () => {
  it('should render upload view by default', () => {
    render(<ImageImporterModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/upload a site plan/i)).toBeInTheDocument();
  });

  it('should close on ESC key', () => {
    const onClose = vi.fn();
    render(<ImageImporterModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

---

## Known Limitations

### Current Version
1. **Single parcel only:** Multi-parcel detection not yet supported
2. **No manual correction:** Review/correction UI marked for future enhancement
3. **Raster PDF only:** Vector PDFs are processed as images
4. **No perspective correction:** Image must be relatively flat/orthogonal

### Future Enhancements Planned
- Manual tracing fallback if detection fails
- Multi-parcel support with separate shapes
- PDF vector extraction for better quality
- Perspective correction for skewed images
- Batch import for multiple files
- Template recognition for common formats

---

## Troubleshooting

### Issue: Modal doesn't open
**Check:**
1. Browser console for errors
2. Import button is clickable
3. No other modals are blocking

### Issue: Libraries fail to load
**Check:**
1. Internet connection (CDN dependencies)
2. CORS settings
3. Browser console for 404 errors

### Issue: Processing hangs at 0%
**Check:**
1. Libraries finished initializing
2. File is valid image format
3. No console errors

### Issue: "No boundary detected"
**Possible causes:**
- Image quality too low
- Boundary lines too faint
- Image too small
- Try different preprocessing level (future enhancement)

### Issue: "No dimensions found"
**Possible causes:**
- Text too small or blurry
- Unsupported language (currently: English, French)
- Unusual unit format
- Handwritten text (OCR works best with printed text)

### Issue: Incorrect scale
**Possible causes:**
- Dimensions don't match actual edges
- Mixed units (some in meters, some in feet)
- OCR misread dimension values
- Check warnings for "high scale variance"

---

## Success Criteria

### ✅ Feature is Working If:
1. Import button appears in toolbar
2. Modal opens on click
3. File validation works (rejects invalid files)
4. Progress updates smoothly (0% → 100%)
5. Libraries download successfully
6. Shape appears on canvas after import
7. Undo/redo works correctly
8. No console errors
9. Performance is acceptable (<15s per image)
10. Error messages are clear and helpful

---

## Test Report Template

**Tester:** _____________
**Date:** _____________
**Browser:** _____________
**Test Image:** _____________

| Test Case | Result | Notes |
|-----------|--------|-------|
| Import button visible | ✅/❌ | |
| Modal opens | ✅/❌ | |
| File validation works | ✅/❌ | |
| Progress updates | ✅/❌ | |
| Libraries load | ✅/❌ | |
| Boundary detected | ✅/❌ | |
| Dimensions extracted | ✅/❌ | |
| Shape added to canvas | ✅/❌ | |
| Undo/redo works | ✅/❌ | |
| No console errors | ✅/❌ | |

**Overall Result:** ✅/❌

**Issues Found:**
-

**Recommendations:**
-

---

---

## Recent Fixes (January 2025)

### Boundary Detection Fix (January 12, 2025)
**Issue:** Boundary detection was incorrectly detecting 3 edges instead of 4 for quadrilaterals.

**Root Cause:** The Douglas-Peucker algorithm was using a single epsilon value of 8%, which was too aggressive and removed nearly-collinear corners.

**Solution:** Implemented adaptive multi-epsilon testing:
- Tests 7 different epsilon values (3%, 4%, 5%, 6%, 7%, 8%, 10%)
- Prioritizes 4-vertex quadrilaterals (most common site plan shape)
- Scoring system: 4 vertices = 100 points, 5 = 80, 3 = 75, 6 = 70
- Stops immediately when 4 vertices found for performance

**Result:** ✅ Now correctly detects 4-sided polygons in site plans

**File Modified:** `app/src/services/imageProcessing/shapeDetector.ts:433-512`

### Shape Reconstruction Fix (January 12, 2025)
**Issue:** Error: `geometryReconstructor.reconstructShape is not a function`

**Root Cause:** Wrong API call in ImageImporterModal:
- Called `reconstructShape()` instead of `reconstruct()`
- Passed `DimensionInput[]` instead of `number[]`
- Used unnecessary `async/await`

**Solution:**
- Fixed method call to `geometryReconstructor.reconstruct()`
- Added unit conversion logic (ft/yd → meters)
- Removed async/await from synchronous function

**Result:** ✅ Manual dimension entry now works end-to-end

**File Modified:** `app/src/components/ImageImport/ImageImporterModal.tsx:451-471`

### Hybrid Import Approach
**Current Flow:**
1. Upload image → Boundary detection (2s timeout)
2. OCR attempts dimension extraction (5s timeout)
3. **If OCR fails or times out → Manual entry mode**
   - Shows detected edge count (e.g., "4-sided shape")
   - User manually enters dimensions for each edge
   - Supports units: meters (m), feet (ft), yards (yd)
   - Preview reconstructed shape before adding to canvas
4. **If OCR succeeds → Review mode** (future enhancement)

**Manual Entry Workflow:**
1. System detects boundary: "Detected 4-sided shape"
2. Form displays 4 input fields (one per edge)
3. Enter dimensions: 50.71m, 22.09m, 39.49m, 21.45m
4. Click "Calculate Shape →"
5. Preview shows reconstructed polygon
6. Confirm to add to canvas

**Test Cases Updated:**
- ✅ Boundary detection works for 3, 4, 5, 6-sided polygons
- ✅ Manual entry accepts ft, yd, m units
- ✅ Shape reconstruction validates closure
- ✅ Preview shows geometry before import
- ✅ Error handling for invalid dimensions

---

**Last Updated:** 2025-01-12
**Next Review:** After user testing of manual entry workflow
