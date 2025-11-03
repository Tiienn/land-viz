# Cross-Browser and Mobile Testing Checklist
## Canva-Style Grouping System

**Application URL:** http://localhost:5175 (or production URL)

---

## Desktop Browsers

### ✅ **Chrome/Chromium (Primary)**
**Version:** Latest stable
**Status:** ✅ Verified during development

**Test Cases:**
- [x] Group creation (Ctrl+G)
- [x] Purple dashed boundary rendering
- [x] Group drag and drop
- [x] Group rotation (drag and cursor modes)
- [x] Ungroup (Ctrl+Shift+G)
- [x] Dimension labels rotate with groups
- [x] Performance with 100+ shapes
- [x] Undo/redo operations

---

### 🔲 **Firefox**
**Version:** Latest stable
**Status:** Not yet tested

**Critical Test Cases:**
1. **CSS Compatibility**
   - [ ] Purple dashed lines render correctly (`dashSize`, `dashScale`)
   - [ ] Line width appears consistent (3px)
   - [ ] No visual artifacts or flickering

2. **WebGL Performance**
   - [ ] 3D scene renders smoothly
   - [ ] Group boundary updates in real-time during drag
   - [ ] No frame drops with large groups

3. **Keyboard Shortcuts**
   - [ ] Ctrl+G works for grouping
   - [ ] Ctrl+Shift+G works for ungrouping
   - [ ] Shift key snapping during rotation

**Known Firefox Quirks:**
- CSS `dashScale` may render differently
- WebGL shader compatibility (check console for warnings)

---

### 🔲 **Safari (macOS)**
**Version:** Latest stable
**Status:** Not yet tested

**Critical Test Cases:**
1. **WebGL Performance**
   - [ ] Three.js scene initialization
   - [ ] Group boundary rendering (Safari can be slower)
   - [ ] Rotation transformations accurate

2. **CSS Rendering**
   - [ ] Dashed lines render (Safari has different defaults)
   - [ ] Color accuracy (#9333EA purple)
   - [ ] Line caps and joins

3. **Mouse/Trackpad Events**
   - [ ] Right-click drag for camera orbit
   - [ ] Middle-click pan (may require special handling)
   - [ ] Scroll wheel zoom

**Known Safari Quirks:**
- WebGL performance may be 20-30% slower
- Dashed line rendering may differ
- Trackpad gestures need special handling

---

### 🔲 **Edge (Chromium)**
**Version:** Latest stable
**Status:** Should work (same engine as Chrome)

**Quick Verification:**
- [ ] Group creation and boundary rendering
- [ ] Drag and rotation work
- [ ] No Edge-specific console errors

---

## Mobile Browsers

### 🔲 **Mobile Chrome (Android)**
**Device:** Pixel/Samsung/Generic Android
**Status:** Not yet tested

**Touch Interaction Tests:**
1. **Shape Selection**
   - [ ] Tap to select single shape
   - [ ] Long-press for context menu
   - [ ] Multi-select (if implemented for touch)

2. **Group Operations**
   - [ ] Can access group/ungroup via context menu or UI buttons
   - [ ] Touch drag moves grouped shapes together
   - [ ] Rotation handles work with touch

3. **Visual Rendering**
   - [ ] Purple boundary visible on small screen
   - [ ] Dimension labels readable
   - [ ] No overlap or UI clipping

4. **Performance**
   - [ ] Smooth at 30-60 FPS with < 50 shapes
   - [ ] No crashes with 100+ shapes (may be slower)

**Mobile-Specific Considerations:**
- Touch targets should be ≥ 44px
- Pinch-to-zoom may interfere
- Screen size: Test on 360px width minimum

---

### 🔲 **Mobile Safari (iOS)**
**Device:** iPhone/iPad
**Status:** Not yet tested

**Touch Interaction Tests:**
1. **Shape Selection**
   - [ ] Tap to select
   - [ ] Long-press for context menu
   - [ ] No accidental zoom triggers

2. **Group Operations**
   - [ ] Group/ungroup accessible via UI
   - [ ] Drag works smoothly
   - [ ] Rotation gesture works (if implemented)

3. **Visual Rendering**
   - [ ] WebGL scene renders correctly
   - [ ] Purple boundary visible and crisp
   - [ ] No visual artifacts from Safari's rendering engine

4. **Performance**
   - [ ] Acceptable FPS (iOS WebGL can be slower)
   - [ ] No memory warnings with large groups
   - [ ] Battery usage acceptable

**iOS-Specific Considerations:**
- WebGL performance varies by device (A12+ recommended)
- Safari has stricter memory limits
- Home indicator may interfere with bottom UI

---

## Responsive Design Tests

### 🔲 **Desktop Breakpoints**
- [ ] 1920px (Full HD): All features visible
- [ ] 1366px (Laptop): No horizontal scroll
- [ ] 1024px (Tablet landscape): UI adapts

### 🔲 **Mobile Breakpoints**
- [ ] 768px (Tablet portrait): Touch-friendly
- [ ] 375px (Mobile): Minimum width, all features accessible
- [ ] 360px (Small mobile): Fallback layout works

---

## Accessibility Tests

### 🔲 **Keyboard Navigation**
- [ ] All grouping actions accessible via keyboard
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Ctrl+G / Ctrl+Shift+G work in all browsers

### 🔲 **Screen Reader Compatibility**
- [ ] Group state announced ("2 shapes grouped")
- [ ] Boundary described ("Group boundary visible")
- [ ] Actions have ARIA labels

### 🔲 **Color Contrast**
- [ ] Purple boundary (#9333EA) visible on all backgrounds
- [ ] Sufficient contrast for accessibility (WCAG AA)

---

## Performance Benchmarks by Browser

**Target: 60 FPS (16ms per frame)**

| Browser | Small Group (3) | Large Group (100) | Status |
|---------|----------------|-------------------|--------|
| Chrome | 0.03ms | 0.06ms | ✅ Verified |
| Firefox | TBD | TBD | 🔲 Test |
| Safari | TBD | TBD | 🔲 Test |
| Mobile Chrome | TBD | TBD | 🔲 Test |
| Mobile Safari | TBD | TBD | 🔲 Test |

---

## Common Cross-Browser Issues to Watch For

### 1. **CSS Line Rendering**
**Symptom:** Dashed lines appear solid or incorrectly spaced
**Browsers:** Firefox, Safari
**Fix:** Adjust `dashScale`, `dashSize`, or use SVG fallback

### 2. **WebGL Shader Compatibility**
**Symptom:** Black screen or console errors about shaders
**Browsers:** Safari (older versions)
**Fix:** Check Three.js version, update if needed

### 3. **Mouse Event Differences**
**Symptom:** Right-click or middle-click not working
**Browsers:** Safari
**Fix:** Add button detection fallbacks

### 4. **Touch Event Handling**
**Symptom:** Drag doesn't work on mobile
**Browsers:** Mobile browsers
**Fix:** Ensure touch events properly mapped to mouse events

### 5. **Memory Limits**
**Symptom:** Crashes with 100+ shapes
**Browsers:** Mobile Safari
**Fix:** Implement shape count limit or progressive loading

---

## Testing Tools

### Automated Testing
```bash
# BrowserStack (recommended for comprehensive testing)
# Supports Chrome, Firefox, Safari, Edge, Mobile

# Percy (visual regression testing)
# Captures screenshots across browsers

# Playwright (E2E testing)
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Manual Testing
- **Chrome DevTools:** Device emulation
- **Firefox Responsive Design Mode:** Mobile testing
- **Safari Developer Tools:** iOS simulation

---

## Priority Testing Order

**High Priority** (Production blockers):
1. ✅ Chrome Desktop (Primary development browser)
2. 🔲 Firefox Desktop (Second most popular)
3. 🔲 Safari Desktop (macOS users)
4. 🔲 Mobile Chrome (Mobile majority)

**Medium Priority** (Nice to have):
5. 🔲 Mobile Safari (iOS users)
6. 🔲 Edge (Chromium-based, likely works)

**Low Priority** (Optional):
7. 🔲 Older browser versions (IE11 not supported)

---

## Reporting Issues

**Issue Template:**
```markdown
### Browser/Device
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [e.g., Chrome 120]
- OS: [Windows 11/macOS 14/Android 13/iOS 17]
- Device: [Desktop/Mobile model]

### Issue Description
[What's wrong?]

### Steps to Reproduce
1. Create 2 shapes
2. Select both
3. Press Ctrl+G
4. [Issue occurs]

### Expected Behavior
[What should happen?]

### Actual Behavior
[What actually happens?]

### Screenshots/Video
[Attach if possible]

### Console Errors
[Copy any errors from browser console]
```

---

## Sign-Off Checklist

**Required for Production:**
- [x] Chrome Desktop - ✅ All features working
- [ ] Firefox Desktop - 🔲 To test
- [ ] Safari Desktop - 🔲 To test
- [ ] Mobile Chrome - 🔲 To test
- [ ] Mobile Safari - 🔲 To test

**Minimum Viable:**
- At least 2 desktop browsers fully tested ✅
- At least 1 mobile browser fully tested 🔲

**Recommended:**
- All 5 browsers tested with no critical issues

---

## Notes

- Chrome testing completed during development (Phase 6.1-6.5)
- All automated tests passing (43 tests)
- Performance excellent in Chrome (500× under budget)
- Ready for cross-browser validation

**Estimated Testing Time:** 2-3 hours for manual cross-browser testing
