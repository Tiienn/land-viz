# Agent Workflow Quick Reference

## 🚀 Common Workflows - Copy & Paste Commands

### New Feature Implementation
```bash
# Complete feature cycle
@strategy-analyzer "Plan implementation of [FEATURE_NAME]"
@ui-ux-designer "Design interface for [FEATURE_NAME]"
@land-viz-specialist "Define domain logic for [FEATURE_NAME]"
@3d-scene-specialist "Implement 3D visualization for [FEATURE_NAME]"
@performance-optimizer "Optimize [FEATURE_NAME] performance"
@test-automation "Create test suite for [FEATURE_NAME]"
@design-review "Review [FEATURE_NAME] implementation"
```

### Bug Fix
```bash
# Rapid bug resolution
@strategy-analyzer "Analyze root cause of [BUG_DESCRIPTION]"
@performance-optimizer "Profile memory/performance issue in [COMPONENT]"
@[SPECIALIST_AGENT] "Fix [BUG] based on analysis"
@test-automation "Create regression test for [BUG]"
```

### Performance Optimization
```bash
# Performance improvement cycle
@performance-optimizer "Profile [SLOW_FEATURE] performance bottlenecks"
@3d-scene-optimizer "Optimize Three.js rendering for [FEATURE]"
@land-viz-specialist "Optimize data structures for [FEATURE]"
@test-automation "Create performance benchmarks"
```

### UI/UX Update
```bash
# Design update workflow
@ui-ux-designer "Redesign [UI_COMPONENT] with modern patterns"
@design-review "Review [UI_COMPONENT] for accessibility and responsiveness"
@test-automation "Create UI tests for [UI_COMPONENT]"
```

### Code Review
```bash
# Comprehensive review
@design-review "Review PR #[NUMBER] UI changes"
@test-automation "Verify test coverage for PR #[NUMBER]"
@performance-optimizer "Check performance impact of PR #[NUMBER]"
```

---

## ⚡ Parallel Execution Patterns

### Independent Tasks (Run Together)
```bash
# UI and Backend simultaneously
@ui-ux-designer "Design dashboard layout"
@land-viz-specialist "Design data API structure"
@test-automation "Plan test scenarios"
```

### Comprehensive Analysis (Multiple Perspectives)
```bash
# Get multiple viewpoints
@strategy-analyzer "Analyze architecture for [FEATURE]"
@performance-optimizer "Analyze performance implications"
@land-viz-specialist "Analyze domain requirements"
```

### Multi-Component Implementation
```bash
# Build different parts simultaneously
@3d-scene-specialist "Implement 3D visualization"
@ui-ux-designer "Create control panel"
@shape-precision-engineer "Implement calculations"
```

---

## 🔄 Sequential Patterns

### Design → Build → Test
```bash
# Step 1: Design
@ui-ux-designer "Create mockups for [FEATURE]"

# Step 2: Build (after design approval)
@3d-scene-specialist "Implement [FEATURE] based on mockups"

# Step 3: Test
@test-automation "Test [FEATURE] implementation"
```

### Analyze → Optimize → Verify
```bash
# Step 1: Analysis
@performance-optimizer "Profile current performance"

# Step 2: Optimization
@3d-scene-optimizer "Apply optimization techniques"

# Step 3: Verification
@test-automation "Verify performance improvements"
```

---

## 🎯 Agent Selection Guide

### By Task Type

**UI/UX Tasks**
- Design: `@ui-ux-designer`
- Review: `@design-review`
- Accessibility: `@design-review`

**3D/Graphics Tasks**
- Implementation: `@3d-scene-specialist`
- Optimization: `@3d-scene-optimizer`
- Performance: `@performance-optimizer`

**Domain/Business Logic**
- Land features: `@land-viz-specialist`
- GIS/Spatial: `@geospatial-processor`
- Measurements: `@shape-precision-engineer`

**Architecture/Planning**
- Single strategy: `@strategy-analyzer`
- Multiple strategies: `@strategy-consensus-implementer`
- Documentation: `@land-documentation-generator`

**Quality Assurance**
- Testing: `@test-automation`
- Test orchestration: `@testing-orchestrator`
- UI Review: `@design-review`

**Specialized Integration**
- CAD: `@chili3d-integration`
- CAD features: `@cad-feature-builder`

---

## 📊 Decision Matrix

| Scenario | Primary Agent | Supporting Agents |
|----------|--------------|-------------------|
| New UI Component | `ui-ux-designer` | `design-review`, `test-automation` |
| 3D Performance Issue | `3d-scene-optimizer` | `performance-optimizer`, `3d-scene-specialist` |
| Complex Algorithm | `shape-precision-engineer` | `test-automation`, `land-viz-specialist` |
| System Architecture | `strategy-consensus-implementer` | `strategy-analyzer` (×8) |
| Mobile Optimization | `performance-optimizer` | `ui-ux-designer`, `design-review` |
| CAD Integration | `chili3d-integration` | `shape-precision-engineer`, `3d-scene-specialist` |
| Bug Investigation | `strategy-analyzer` | `performance-optimizer`, relevant specialist |
| Documentation | `land-documentation-generator` | All relevant agents for content |

---

## 💡 Pro Tips

### Maximize Efficiency
```bash
# ✅ Good: Parallel independent tasks
@ui-ux-designer "Design header"
@3d-scene-specialist "Implement grid system"
@test-automation "Setup test framework"

# ❌ Bad: Sequential when parallel possible
@ui-ux-designer "Design header"
# Wait...
@3d-scene-specialist "Implement grid system"
# Wait...
@test-automation "Setup test framework"
```

### Clear Context Passing
```bash
# ✅ Good: Reference previous outputs
@strategy-analyzer "Plan user authentication"
# Get output: {approach: "JWT", storage: "localStorage"}

@land-viz-specialist "Implement JWT auth with localStorage as designed above"

# ❌ Bad: No context
@strategy-analyzer "Plan user authentication"
@land-viz-specialist "Implement authentication" # Missing context!
```

### Right Tool for the Job
```bash
# ✅ Good: Specialist for specific task
@shape-precision-engineer "Calculate exact polygon area with floating point precision"

# ❌ Bad: General agent for specialized task
@strategy-analyzer "Calculate polygon area" # Wrong agent!
```

---

## 🔥 Hotkeys & Shortcuts

### Quick Feature Development
```bash
alias landfeature='@strategy-analyzer && @ui-ux-designer && @land-viz-specialist && @3d-scene-specialist && @test-automation'
```

### Quick Performance Check
```bash
alias landperf='@performance-optimizer && @3d-scene-optimizer && @test-automation "performance benchmarks"'
```

### Quick Review Cycle
```bash
alias landreview='@design-review && @test-automation "coverage report" && @performance-optimizer "impact analysis"'
```

---

## 📈 Workflow Metrics

Track these metrics to optimize your workflows:

- **Parallel Efficiency**: % of tasks run in parallel vs sequential
- **First-Time Success**: % of tasks completed without rework
- **Agent Utilization**: Which agents are used most/least
- **Handoff Time**: Average time between agent tasks
- **Completion Velocity**: Features completed per sprint

---

## 🚨 Emergency Workflows

### Production Bug (Critical)
```bash
# IMMEDIATE (5 min)
@strategy-analyzer "Emergency analysis of [CRITICAL_BUG]"
@performance-optimizer "Profile production issue"

# FIX (15 min)
@[SPECIALIST] "Hotfix for [CRITICAL_BUG]"

# VERIFY (5 min)
@test-automation "Smoke test hotfix"
```

### Performance Crisis
```bash
# DIAGNOSE (10 min)
@performance-optimizer "Emergency profiling of [SLOW_FEATURE]"
@3d-scene-optimizer "Identify rendering bottlenecks"

# MITIGATE (20 min)
@3d-scene-specialist "Apply emergency optimizations"

# VALIDATE (10 min)
@test-automation "Verify performance restored"
```

---

## 📝 Template Library

### Copy-Paste Templates

**Feature Template**
```bash
@strategy-analyzer "Plan [FEATURE]: [DESCRIPTION]"
@ui-ux-designer "Design [FEATURE] with requirements: [LIST]"
@land-viz-specialist "[FEATURE] domain logic with constraints: [LIST]"
@3d-scene-specialist "Implement [FEATURE] 3D components: [LIST]"
@test-automation "Test [FEATURE] scenarios: [LIST]"
```

**Optimization Template**
```bash
@performance-optimizer "Profile [COMPONENT] with focus on [METRIC]"
@3d-scene-optimizer "Optimize [COMPONENT] targeting [FPS/MEMORY/DRAWCALLS]"
@test-automation "Benchmark [COMPONENT] improvements"
```

**Review Template**
```bash
@design-review "Review [PR/FEATURE] for [accessibility|responsiveness|performance]"
@test-automation "Verify [PR/FEATURE] test coverage >= [PERCENTAGE]%"
```

---

## 🎮 Interactive Workflow Builder

```javascript
// Quick workflow generator
function buildWorkflow(type, feature) {
  const workflows = {
    'feature': [
      `@strategy-analyzer "Plan ${feature}"`,
      `@ui-ux-designer "Design ${feature}"`,
      `@land-viz-specialist "Implement ${feature} logic"`,
      `@test-automation "Test ${feature}"`
    ],
    'bugfix': [
      `@strategy-analyzer "Analyze ${feature} bug"`,
      `@performance-optimizer "Profile ${feature}"`,
      `@test-automation "Create regression test"`
    ],
    'optimize': [
      `@performance-optimizer "Profile ${feature}"`,
      `@3d-scene-optimizer "Optimize ${feature}"`,
      `@test-automation "Benchmark ${feature}"`
    ]
  };

  return workflows[type].join('\n');
}

// Usage
console.log(buildWorkflow('feature', 'terrain elevation'));
```

---

*Quick Reference Version 1.0*
*Copy, Paste, and Customize for Your Needs*
*Land Visualizer Agent Workflows*