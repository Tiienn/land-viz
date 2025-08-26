<!-- 
Thank you for contributing to Land Visualizer! 
Please fill out this template to help reviewers understand your changes.
-->

## 📋 Pull Request Summary

### 🎯 What does this PR do?
<!-- Provide a brief description of the changes -->

### 🔗 Related Issues
<!-- Link related issues using #issue_number -->
Fixes #
Relates to #
Closes #

### 🏷️ Type of Change
<!-- Check all that apply -->
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] ⚡ Performance improvement
- [ ] ♿ Accessibility improvement
- [ ] 🎨 UI/UX improvement
- [ ] 🔧 Refactoring (no functional changes)
- [ ] 🧪 Test update
- [ ] 🏗️ Build/CI update

---

## 📝 Detailed Description

### Changes Made
<!-- List the specific changes made in this PR -->
- 
- 
- 

### Implementation Details
<!-- Describe how you implemented the solution -->

### Technical Decisions
<!-- Explain any significant technical decisions and why you made them -->

---

## 📸 Screenshots/Videos
<!-- For UI changes, include before/after screenshots or videos -->
<details>
<summary>Visual Changes</summary>

### Before
<!-- Add before screenshots -->

### After
<!-- Add after screenshots -->

</details>

---

## 🧪 Testing

### Test Coverage
<!-- Describe the testing you've done -->
- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] New tests added for changes
- [ ] All existing tests still pass

### Manual Testing Performed
<!-- List the manual testing steps performed -->
1. 
2. 
3. 

### Test Configuration
<!-- Browsers and devices tested -->
- **Browsers Tested:**
  - [ ] Chrome (version: )
  - [ ] Firefox (version: )
  - [ ] Safari (version: )
  - [ ] Edge (version: )
  
- **Devices Tested:**
  - [ ] Desktop
  - [ ] Mobile (iOS)
  - [ ] Mobile (Android)
  - [ ] Tablet

### Specific Test Cases
```javascript
// Add any specific test cases or scenarios
describe('Feature/Fix', () => {
  it('should...', () => {
    // Test case
  });
});
```

---

## ⚡ Performance Impact

### Performance Metrics
<!-- Complete if there are performance implications -->
- **Bundle Size Change**: +/- ___ KB
- **Load Time Impact**: +/- ___ ms
- **FPS Impact**: None / Improved / Degraded by ___
- **Memory Usage**: +/- ___ MB
- **Calculation Speed**: +/- ___ ms

### Performance Testing
- [ ] Lighthouse score checked (Score: ___)
- [ ] Bundle analyzer reviewed
- [ ] Memory profiling completed
- [ ] FPS monitoring on complex shapes

---

## 📋 Checklist

### Code Quality
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have removed all `console.log` statements
- [ ] I have checked for any hardcoded values

### Documentation
- [ ] I have updated the documentation accordingly
- [ ] I have updated the README if needed
- [ ] I have added/updated JSDoc comments
- [ ] I have updated TypeScript types
- [ ] I have updated the CHANGELOG.md

### Testing
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] Test coverage hasn't decreased
- [ ] I have tested edge cases

### Accessibility
- [ ] Keyboard navigation works correctly
- [ ] Screen reader compatibility verified
- [ ] Color contrast requirements met (WCAG 2.1 AA)
- [ ] Focus indicators are visible
- [ ] ARIA labels are appropriate

### Security
- [ ] No sensitive information exposed
- [ ] Input validation implemented
- [ ] No new security warnings from npm audit
- [ ] CSP headers still work correctly

### Chili3D/WASM (if applicable)
- [ ] WASM modules compile successfully
- [ ] Fallback to JavaScript works
- [ ] Memory management verified (no leaks)
- [ ] Precision mode tested
- [ ] CAD export formats working

---

## 🚀 Deployment Notes

### Migration Steps
<!-- Any database migrations or special deployment steps needed? -->
- N/A

### Environment Variables
<!-- Any new environment variables added? -->
- N/A

### Feature Flags
<!-- Any feature flags added or modified? -->
- N/A

### Breaking Changes
<!-- List any breaking changes and migration guide -->
- N/A

---

## 👥 Reviewer Notes

### Areas Needing Special Attention
<!-- Point reviewers to specific areas that need careful review -->
- 
- 

### Questions for Reviewers
<!-- Any specific questions you have for reviewers -->
- 
- 

### Known Issues/TODOs
<!-- Any known issues or future work -->
- [ ] 
- [ ] 

---

## 📊 PR Size Guidelines

This PR is:
- [ ] **Small** (<100 lines changed) - Quick review expected
- [ ] **Medium** (100-500 lines) - Standard review
- [ ] **Large** (500-1000 lines) - Thorough review needed
- [ ] **Extra Large** (>1000 lines) - Consider splitting

---

## 🔄 Post-Merge Actions

- [ ] Deploy to staging environment
- [ ] Verify in staging
- [ ] Update release notes
- [ ] Notify team in Slack/Discord
- [ ] Monitor error tracking (Sentry)
- [ ] Check performance metrics

---

<!-- For Reviewers -->
## 📝 Review Checklist (for reviewers)

### Code Review
- [ ] Code follows project conventions
- [ ] No obvious bugs or issues
- [ ] Performance implications considered
- [ ] Security implications considered
- [ ] Tests are adequate and pass

### Functionality Review
- [ ] Feature/fix works as described
- [ ] Edge cases handled
- [ ] User experience is good
- [ ] Accessibility maintained

### Documentation Review
- [ ] Code is well-documented
- [ ] User-facing changes documented
- [ ] API changes documented

---

## 🏷️ PR Labels to Add

### Status
- [ ] `ready-for-review`
- [ ] `work-in-progress`
- [ ] `needs-tests`
- [ ] `needs-documentation`
- [ ] `blocked`

### Size
- [ ] `size/XS` (<10 lines)
- [ ] `size/S` (10-100 lines)
- [ ] `size/M` (100-500 lines)
- [ ] `size/L` (500-1000 lines)
- [ ] `size/XL` (>1000 lines)

### Priority
- [ ] `priority/critical`
- [ ] `priority/high`
- [ ] `priority/medium`
- [ ] `priority/low`

---

**Thank you for contributing to Land Visualizer! 🎉**