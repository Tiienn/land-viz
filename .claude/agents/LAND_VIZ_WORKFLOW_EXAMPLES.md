# Land Visualizer Agent Workflow Examples

## Real-World Feature Implementation Examples

These are actual workflow examples for specific Land Visualizer features, showing exact agent commands and expected outputs.

---

## 📐 Example 1: Direct Dimension Input Feature

**Feature**: Allow users to type exact dimensions before creating shapes (e.g., "10m x 15m")

### Day 1: Planning & Design

```bash
# Morning: Strategic Planning
@strategy-analyzer "Plan direct dimension input feature allowing users to type exact measurements (10m x 15m) before creating shapes, similar to AutoCAD"

# Expected Output:
# - Input parsing strategy (regex patterns)
# - UI placement recommendations
# - Unit conversion approach
# - Keyboard activation triggers

# Parallel: UI Design
@ui-ux-designer "Design dimension input UI that appears when user types numbers, with fields for width/height (rectangles) and radius/diameter toggle (circles)"

# Expected Output:
# - Floating input panel mockup
# - Input field designs with unit dropdowns
# - Error state designs
# - Keyboard shortcut overlay
```

### Day 2: Implementation

```bash
# Morning: Core Implementation
@land-viz-specialist "Implement dimension parser that handles formats like '10x15', '33ft x 50ft', '10m', with unit conversion to meters"

# Expected Output:
# - DimensionParser class
# - Unit conversion utilities
# - Validation functions
# - Test cases for edge cases

# Parallel: 3D Integration
@3d-scene-specialist "Create preview ghost shapes that show dimension input results before confirmation"

# Expected Output:
# - Ghost shape rendering
# - Real-time size updates
# - Confirmation animation
# - ESC cancellation logic
```

### Day 3: Polish & Testing

```bash
# Testing Suite
@test-automation "Create comprehensive tests for dimension input including invalid formats, unit conversions, and keyboard interactions"

# Design Review
@design-review "Review dimension input UI on desktop and mobile, checking for accessibility and usability"

# Performance Check
@performance-optimizer "Ensure dimension input preview doesn't impact drawing performance"
```

---

## 🔄 Example 2: Shape Flip Operations

**Feature**: Add horizontal and vertical flip functionality for shapes

### Complete Workflow

```bash
# Phase 1: Strategy
@strategy-analyzer "Design flip operation architecture supporting horizontal/vertical flip for all shape types with multi-selection"

# Output: Transformation matrix approach, center point calculation strategy

# Phase 2: Implementation (Parallel)
@shape-precision-engineer "Implement geometric flip transformations maintaining shape properties"
@ui-ux-designer "Design flip controls: toolbar dropdown, context menu items, keyboard shortcuts (Shift+H/V)"

# Phase 3: Integration
@3d-scene-specialist "Update shape renderer to apply flip transformations to Three.js geometries"

# Phase 4: Testing
@test-automation "Test flip operations with rectangles, circles, polylines, including edge cases like single-point shapes"

# Phase 5: Documentation
@land-documentation-generator "Document flip feature API and user guide"
```

### Actual Code Produced by Agents:

```javascript
// shape-precision-engineer output
export function flipShapeHorizontal(points, center) {
  return points.map(point => ({
    x: 2 * center.x - point.x,
    y: point.y
  }));
}

// ui-ux-designer output
const FlipButton = () => (
  <Dropdown
    icon="flip"
    items={[
      { label: "Flip Horizontally", shortcut: "Shift+H", onClick: flipH },
      { label: "Flip Vertically", shortcut: "Shift+V", onClick: flipV }
    ]}
  />
);
```

---

## 📊 Example 3: Area Comparison Tool

**Feature**: Compare land area to reference objects (football fields, city blocks, etc.)

### Strategic Planning Phase

```bash
@strategy-consensus-implementer "Analyze 8 different approaches for implementing area comparison with reference objects"

# Consensus Output:
# - Approach: Lazy-loaded 3D models with 2D fallbacks
# - Data structure: Hierarchical categories
# - Rendering: Instanced meshes for multiple references
# - UI: Inline panel with search and favorites
```

### Implementation Phase

```bash
# Parallel Development (Single Message)
@ui-ux-designer "Create comparison panel UI with categories, search, visual previews, and statistics display"
@land-viz-specialist "Design reference object data structure with categories, sizes, and metadata"
@3d-scene-specialist "Implement reference object rendering with proper scaling and positioning"
@geospatial-processor "Calculate accurate area comparisons with unit conversions"

# Sequential Integration
@performance-optimizer "Optimize reference object loading with lazy loading and caching"
@test-automation "Test comparison calculations and UI interactions"
@design-review "Review comparison tool across devices"
```

---

## 🏔️ Example 4: Terrain Elevation System

**Feature**: Add 3D terrain with elevation data

### Week-Long Implementation

#### Monday: Research & Planning
```bash
@strategy-analyzer "Research terrain elevation approaches: height maps vs TIN vs point clouds for Land Visualizer"
@land-viz-specialist "Design elevation data pipeline from GeoTIFF import to 3D mesh generation"
```

#### Tuesday: Core Development
```bash
@geospatial-processor "Implement GeoTIFF parser with elevation extraction and coordinate transformation"
@shape-precision-engineer "Create elevation interpolation algorithms for smooth terrain"
```

#### Wednesday: 3D Implementation
```bash
@3d-scene-specialist "Build terrain mesh generator with LOD system"
@3d-scene-optimizer "Implement GPU-based terrain tessellation for performance"
```

#### Thursday: UI & Controls
```bash
@ui-ux-designer "Design elevation controls: exaggeration slider, color maps, contour lines"
@land-viz-specialist "Implement contour line generation at specified intervals"
```

#### Friday: Optimization & Testing
```bash
@performance-optimizer "Optimize terrain rendering for large datasets (10km²+)"
@test-automation "Create terrain feature test suite"
@design-review "Final review of terrain visualization"
```

---

## 🎯 Example 5: Measurement Tool Enhancement

**Feature**: Upgrade measurement tool with area, perimeter, and angle measurements

### Rapid Development Sprint

```bash
# Day 1: Design & Architecture
@strategy-analyzer "Plan measurement tool upgrade with area, perimeter, angle modes"
@ui-ux-designer "Design unified measurement UI with mode selector and results panel"

# Day 2: Implementation
@shape-precision-engineer "Implement precise area calculation using shoelace formula"
@land-viz-specialist "Add measurement modes: distance, area, perimeter, angle"
@3d-scene-specialist "Create measurement overlays for each mode with appropriate visuals"

# Day 3: Integration & Polish
@performance-optimizer "Ensure measurements update at 60fps during shape drawing"
@test-automation "Test measurement accuracy with known shapes"
@design-review "Review measurement UI for clarity and accessibility"
```

---

## 🏗️ Example 6: Multi-Story Building Mode

**Feature**: Support for multi-story building visualization

### Complex Feature Workflow

```bash
# Week 1: Architecture
@strategy-consensus-implementer "Evaluate 8 approaches for multi-story building representation"
@cad-feature-builder "Design floor management system with elevation controls"

# Week 2: Core Implementation
@chili3d-integration "Implement building solid modeling with floor plates"
@shape-precision-engineer "Calculate building volumes and floor areas"
@land-viz-specialist "Create floor navigation and visibility controls"

# Week 3: Visualization
@3d-scene-specialist "Implement floor transparency and cutaway views"
@ui-ux-designer "Design building mode UI with floor selector and 3D preview"

# Week 4: Optimization
@3d-scene-optimizer "Optimize building rendering with occlusion culling"
@performance-optimizer "Implement level-of-detail for distant buildings"

# Week 5: Testing & Documentation
@test-automation "Comprehensive building mode test suite"
@design-review "Review building interface on desktop/mobile"
@land-documentation-generator "Create building mode user documentation"
```

---

## 📱 Example 7: Mobile Touch Controls

**Feature**: Complete mobile touch control system

### Mobile-First Development

```bash
# Design Phase
@ui-ux-designer "Design mobile-first controls: pinch zoom, two-finger pan, tap to select, long-press context menu"

# Output: Touch gesture map, UI adaptations, thumb-reachable zones

# Implementation Phase (Parallel)
@3d-scene-specialist "Implement touch controls for 3D camera: pinch zoom, two-finger pan, single-finger rotate"
@land-viz-specialist "Add touch drawing: tap points for polyline, drag for rectangle, two-finger circle"
@performance-optimizer "Optimize for mobile GPU constraints, target 30fps on mid-range devices"

# Testing Phase
@test-automation "Create mobile gesture test suite with touch simulation"
@design-review "Test on iOS Safari, Chrome Android, tablets (iPad, Galaxy Tab)"

# Final Polish
@ui-ux-designer "Refine touch targets to meet 44px minimum, adjust UI for thumb reach"
```

---

## 🔧 Example 8: CAD File Import

**Feature**: Import DWG/DXF CAD files

### Integration Workflow

```bash
# Phase 1: Research
@chili3d-integration "Research DWG/DXF parsing libraries and WebAssembly integration"
@strategy-analyzer "Plan CAD import pipeline with entity mapping and layer preservation"

# Phase 2: Parser Implementation
@cad-feature-builder "Implement DWG/DXF parser with entity extraction"
@geospatial-processor "Handle CAD coordinate systems and unit conversions"

# Phase 3: Conversion Pipeline
@shape-precision-engineer "Convert CAD entities to Land Visualizer shapes"
@land-viz-specialist "Map CAD layers to Land Visualizer layer system"

# Phase 4: Visualization
@3d-scene-specialist "Render imported CAD geometry with proper styling"
@ui-ux-designer "Create import wizard UI with preview and options"

# Phase 5: Optimization
@performance-optimizer "Optimize large CAD file handling (>10MB files)"
@test-automation "Test with various CAD file formats and versions"
```

---

## 🚀 Example 9: Real-time Collaboration

**Feature**: Multiple users editing simultaneously

### Distributed System Workflow

```bash
# Architecture Phase
@strategy-consensus-implementer "Design real-time collaboration architecture with 8 different approaches"

# Consensus: WebSocket + CRDT approach

# Backend Implementation
@strategy-analyzer "Design WebSocket message protocol and state synchronization"
@land-viz-specialist "Implement conflict resolution for simultaneous edits"

# Frontend Implementation
@3d-scene-specialist "Add user cursors and selection highlights in 3D space"
@ui-ux-designer "Design collaboration UI: user avatars, presence indicators, activity feed"

# Integration
@performance-optimizer "Optimize WebSocket message batching and compression"
@shape-precision-engineer "Ensure shape transformations are commutative for CRDT"

# Testing
@test-automation "Create collaboration test suite with simulated users"
@testing-orchestrator "Orchestrate multi-user testing scenarios"
```

---

## 📈 Example 10: Performance Crisis Response

**Scenario**: App becomes unusably slow with 5000+ shapes

### Emergency Response Workflow

```bash
# Immediate Diagnosis (15 minutes)
@performance-optimizer "EMERGENCY: Profile app with 5000 shapes, identify bottlenecks"
# Found: No instancing, no culling, no LOD

@3d-scene-optimizer "Analyze Three.js scene for rendering inefficiencies"
# Found: 5000 draw calls, no geometry merging

# Rapid Mitigation (1 hour)
@3d-scene-specialist "URGENT: Implement instanced rendering for repeated shapes"
@3d-scene-optimizer "URGENT: Add frustum culling and geometry batching"
@land-viz-specialist "URGENT: Implement spatial indexing for viewport queries"

# Verification (30 minutes)
@test-automation "Performance smoke test with 5000, 10000, 20000 shapes"
@performance-optimizer "Verify 60fps achieved with 5000 shapes"

# Long-term Fix (Next Day)
@strategy-analyzer "Design comprehensive performance optimization strategy"
@performance-optimizer "Implement progressive loading and virtualization"
@test-automation "Create performance regression test suite"
```

---

## 🎨 Example 11: Design System Overhaul

**Feature**: Complete UI redesign to match modern SaaS standards

### Design-Led Workflow

```bash
# Week 1: Design Audit
@design-review "Comprehensive audit of current UI against modern standards (Stripe, Linear, Figma)"
@ui-ux-designer "Create new design system: colors, typography, spacing, components"

# Week 2: Component Library
@ui-ux-designer "Design core components: buttons, inputs, panels, modals, tooltips"
@test-automation "Create visual regression test suite for components"

# Week 3: Implementation
@3d-scene-specialist "Update 3D overlays to match new design system"
@land-viz-specialist "Refactor UI components to use design tokens"

# Week 4: Accessibility
@design-review "WCAG 2.1 AA compliance audit of new design"
@ui-ux-designer "Fix accessibility issues: contrast, focus states, ARIA labels"

# Week 5: Rollout
@performance-optimizer "Ensure new design doesn't impact performance"
@test-automation "Full E2E test suite with new UI"
@land-documentation-generator "Update UI documentation and style guide"
```

---

## 📝 Example 12: Specification-Driven Development

**Feature**: Building a feature from detailed specifications

### Specification Workflow

```bash
# Specification Analysis
@strategy-analyzer "Analyze specification document for FEATURE_NAME, identify requirements and constraints"

# Technical Design
@strategy-consensus-implementer "Generate 8 different technical approaches for specification implementation"

# Detailed Planning
@land-viz-specialist "Map specification requirements to Land Visualizer architecture"
@ui-ux-designer "Create UI designs that fulfill all specification requirements"

# Implementation
@3d-scene-specialist "Implement 3D components per specification section 3.2"
@shape-precision-engineer "Implement calculations per specification section 4.1"

# Validation
@test-automation "Create tests for each specification requirement"
@design-review "Verify implementation matches specification"

# Documentation
@land-documentation-generator "Generate compliance documentation showing specification coverage"
```

---

## Quick Command Templates

### For New Features
```bash
# Replace [FEATURE] with your feature name
@strategy-analyzer "Plan [FEATURE] for Land Visualizer"
@ui-ux-designer "Design [FEATURE] interface"
@land-viz-specialist "Implement [FEATURE] domain logic"
@3d-scene-specialist "Add 3D support for [FEATURE]"
@test-automation "Test [FEATURE]"
```

### For Bug Fixes
```bash
# Replace [BUG] with bug description
@strategy-analyzer "Root cause analysis for [BUG]"
@performance-optimizer "Profile [BUG] impact"
@[SPECIALIST] "Fix [BUG]"
@test-automation "Regression test for [BUG]"
```

### For Performance Issues
```bash
# Replace [COMPONENT] with slow component
@performance-optimizer "Profile [COMPONENT] performance"
@3d-scene-optimizer "Optimize [COMPONENT] rendering"
@test-automation "Benchmark [COMPONENT]"
```

---

## Workflow Success Metrics

Track these for each workflow:

- **Time to Completion**: How long from start to deployment
- **Agent Efficiency**: Number of agents used vs needed
- **Rework Rate**: How often agent output needs revision
- **Parallelization**: % of tasks run in parallel
- **Quality Score**: Bugs found post-implementation

---

## Tips for Effective Workflows

1. **Start with Strategy**: Always begin with `@strategy-analyzer` for complex features
2. **Parallel When Possible**: Run independent agents simultaneously
3. **Test Early**: Include `@test-automation` throughout, not just at the end
4. **Review Often**: Use `@design-review` at milestones
5. **Document Everything**: End with `@land-documentation-generator`

---

*Land Visualizer Agent Workflow Examples*
*Real-world tested patterns for efficient development*
*Version 1.0 - October 2025*