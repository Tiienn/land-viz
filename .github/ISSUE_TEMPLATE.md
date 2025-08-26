---
name: '🐛 Bug Report'
about: Report a bug to help us improve Land Visualizer
title: '[BUG] '
labels: 'bug, needs-triage'
assignees: ''
---

<!-- 
Thank you for reporting a bug! Please fill out this template to help us understand and fix the issue quickly.
Please search existing issues before creating a new one: https://github.com/landvisualizer/issues
-->

## 🐛 Bug Description
<!-- A clear and concise description of what the bug is -->

## 🔄 Steps to Reproduce
<!-- Steps to reproduce the behavior -->
1. Go to '...'
2. Click on '...'
3. Draw shape with '...'
4. See error

## ✅ Expected Behavior
<!-- What you expected to happen -->

## ❌ Actual Behavior
<!-- What actually happened -->

## 📸 Screenshots/Videos
<!-- If applicable, add screenshots or videos to help explain the problem -->
<details>
<summary>Screenshots</summary>

<!-- Drag and drop images here -->

</details>

## 🌍 Environment
<!-- Please complete the following information -->

**Browser & Version:**
- [ ] Chrome (version: )
- [ ] Firefox (version: )
- [ ] Safari (version: )
- [ ] Edge (version: )
- [ ] Other: 

**Device:**
- [ ] Desktop
- [ ] Mobile (iOS)
- [ ] Mobile (Android)
- [ ] Tablet

**Operating System:**
- OS: [e.g., Windows 11, macOS 13, Ubuntu 22.04]
- Version: 

**Land Visualizer Details:**
- Version: [e.g., 1.0.0]
- Precision Mode: [ ] Enabled / [ ] Disabled
- Performance Mode: [ ] Enabled / [ ] Disabled

## 📋 Additional Context
<!-- Add any other context about the problem here -->

### Error Messages
```
<!-- Paste any error messages from the console here -->
```

### Related Issues
<!-- Link any related issues -->
- #

### Possible Solution
<!-- If you have suggestions on how to fix the bug -->

---

<!-- For Land Visualizer Team Use -->
## 🏷️ Labels to Add
- [ ] `critical` - Blocks core functionality
- [ ] `high-priority` - Major feature affected
- [ ] `performance` - Performance issue
- [ ] `accessibility` - Accessibility issue
- [ ] `mobile` - Mobile-specific issue
- [ ] `chili3d` - Related to CAD integration
- [ ] `calculation` - Calculation accuracy issue

---
---
name: '✨ Feature Request'
about: Suggest a new feature for Land Visualizer
title: '[FEATURE] '
labels: 'enhancement, needs-triage'
assignees: ''
---

## 💡 Feature Description
<!-- Clear description of the feature you'd like -->

## 🎯 Problem Statement
<!-- What problem does this feature solve? -->

## 💭 Proposed Solution
<!-- How should this feature work? -->

## 🔄 Alternatives Considered
<!-- What alternatives have you considered? -->

## 📖 User Story
<!-- As a [type of user], I want [goal] so that [benefit] -->
As a ____________, I want ____________ so that ____________.

## ✅ Acceptance Criteria
<!-- What needs to be true for this feature to be complete? -->
- [ ] 
- [ ] 
- [ ] 

## 🎨 Mockups/Examples
<!-- Visual representations or examples if applicable -->

## 📊 Priority/Impact
<!-- Help us understand the importance -->
- **User Impact**: [Low/Medium/High]
- **Frequency of Use**: [Rarely/Sometimes/Often/Always]
- **User Type**: [All Users/Pro Users/Specific Industry]

---
---
name: '📚 Documentation'
about: Report documentation issues or improvements
title: '[DOCS] '
labels: 'documentation'
assignees: ''
---

## 📄 Documentation Issue

**Page/Section:**
<!-- Where is the issue in the documentation? -->

**Issue Type:**
- [ ] Incorrect information
- [ mysterious or unclear instructions
- [ ] Missing information
- [ ] Typo/Grammar
- [ ] Code example issue
- [ ] Other: 

**Description:**
<!-- Describe the issue -->

**Suggested Fix:**
<!-- How should it be corrected? -->

---
---
name: '⚡ Performance Issue'
about: Report performance problems
title: '[PERF] '
labels: 'performance, needs-triage'
assignees: ''
---

## ⚡ Performance Issue

### Issue Description
<!-- Describe the performance problem -->

### Performance Metrics
<!-- Provide specific metrics if possible -->
- **FPS**: Current: ___ / Expected: 60
- **Load Time**: Current: ___s / Expected: <3s
- **Memory Usage**: Current: ___MB / Expected: <500MB
- **Calculation Time**: Current: ___ms / Expected: <100ms

### Reproduction Steps
1. 
2. 
3. 

### Test Data
<!-- Describe the data that causes the issue -->
- Number of points: 
- Shape complexity: 
- Comparison objects: 
- File size (if importing): 

### Device Specifications
- CPU: 
- RAM: 
- GPU: 
- Network: [ ] 3G / [ ] 4G / [ ] WiFi / [ ] Ethernet

### Performance Profile
<!-- If you have Chrome DevTools performance profile, please export and attach -->

---
---
name: '🔒 Security Vulnerability'
about: Report security issues (or email security@landvisualizer.com)
title: '[SECURITY] '
labels: 'security'
assignees: ''
---

<!-- 
⚠️ IMPORTANT: For sensitive security issues, please email security@landvisualizer.com instead of creating a public issue.
-->

## 🔒 Security Issue

### Vulnerability Type
- [ ] XSS (Cross-Site Scripting)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] Information Disclosure
- [ ] Authentication/Authorization
- [ ] Input Validation
- [ ] Other: 

### Description
<!-- Describe the security issue -->

### Impact
<!-- What could an attacker do with this vulnerability? -->

### Steps to Reproduce
<!-- Only if safe to disclose publicly -->
1. 
2. 
3. 

### Suggested Fix
<!-- If you have suggestions -->

---
---
name: '❓ Question/Support'
about: Ask questions or get help
title: '[QUESTION] '
labels: 'question'
assignees: ''
---

## ❓ Question

### What would you like to know?
<!-- Your question here -->

### What have you tried?
<!-- What attempts have you made to find the answer? -->

### Related Documentation
<!-- Have you checked these resources? -->
- [ ] [User Guide](docs/user-guide.md)
- [ ] [Developer Guide](docs/developer-guide.md)
- [ ] [FAQ Section](docs/user-guide.md#frequently-asked-questions)
- [ ] [Video Tutorials](https://landvisualizer.com/tutorials)

### Context
<!-- Any additional context -->

---
---
name: '🎯 Chili3D Integration Issue'
about: Issues specific to CAD/precision features
title: '[CHILI3D] '
labels: 'chili3d, needs-triage'
assignees: ''
---

## 🎯 Chili3D Integration Issue

### Component Affected
- [ ] Precision Calculator
- [ ] Boolean Operations
- [ ] CAD Export (DXF/STEP)
- [ ] WASM Module
- [ ] Setback Calculations
- [ ] Subdivision Tools

### Issue Description
<!-- Describe the issue -->

### Precision Mode Settings
- Enabled: [ ] Yes / [ ] No
- WASM Loaded: [ ] Yes / [ ] No / [ ] Unknown
- Calculation Method Used: [ ] WASM / [ ] Chili3D / [ ] JavaScript Fallback

### Test Case
```javascript
// Provide sample data that reproduces the issue
const testPoints = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  // ...
];
```

### Expected vs Actual Results
- **Expected Area**: ___ m²
- **Actual Area**: ___ m²
- **Precision**: ±___% 

### Browser Console Output
```
<!-- Any relevant console messages -->
```

---

## 🏷️ Issue Labels Guide

### Priority Labels
- `critical`: System breaking, data loss, security
- `high-priority`: Major feature broken
- `medium-priority`: Important but not urgent
- `low-priority`: Nice to have

### Type Labels
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements
- `performance`: Performance issues
- `security`: Security vulnerabilities
- `question`: Questions and support

### Component Labels
- `ui`: User interface issues
- `calculation`: Calculation engine
- `3d-rendering`: Three.js rendering
- `mobile`: Mobile-specific
- `chili3d`: CAD integration
- `export`: Export functionality
- `drawing`: Drawing tools

### Status Labels
- `needs-triage`: Awaiting initial review
- `confirmed`: Issue confirmed
- `in-progress`: Being worked on
- `needs-info`: More information needed
- `blocked`: Blocked by another issue
- `ready-for-review`: PR ready