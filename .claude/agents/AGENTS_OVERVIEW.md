# Land Visualizer - Specialized Agents Overview

This document describes the specialized AI agents created for the Land Visualizer project, based on patterns from the awesome-claude-code-agents repository.

## 🚀 New Agents Created (October 2025)

### 1. **3D Scene Optimizer** (`3d-scene-optimizer.md`)
- **Color**: Cyan
- **Purpose**: Three.js and React Three Fiber performance optimization specialist
- **Key Capabilities**:
  - WebGL profiling and bottleneck identification
  - Geometry instancing and batching strategies
  - Level of Detail (LOD) implementation
  - Memory leak detection in 3D contexts
  - Frame rate optimization (target: 60 FPS)
- **Use Cases**:
  - Optimizing shape rendering when you have 100+ shapes
  - Implementing infinite grid with viewport culling
  - Reducing draw calls and memory usage
- **Invocation**: `@3d-scene-optimizer` or use Task tool with `subagent_type: "3d-scene-optimizer"`

### 2. **CAD Feature Builder** (`cad-feature-builder.md`)
- **Color**: Purple
- **Purpose**: AutoCAD-style functionality implementation specialist
- **Key Capabilities**:
  - Precision drawing tools (ortho lock, polar tracking, OSNAP)
  - Dimensioning systems (linear, angular, radial)
  - Command line interface implementation
  - Dynamic input and coordinate entry
  - Advanced drawing features (splines, hatches, blocks)
- **Use Cases**:
  - Implementing OFFSET command
  - Creating smart dimension placement
  - Building AutoCAD-style command system
- **Invocation**: `@cad-feature-builder` or use Task tool with `subagent_type: "cad-feature-builder"`

### 3. **Land Documentation Generator** (`land-documentation-generator.md`)
- **Color**: Orange
- **Purpose**: Professional land documentation and report generation specialist
- **Key Capabilities**:
  - Survey report generation
  - Legal descriptions (metes and bounds)
  - Professional plot plans with scales
  - Multi-format export (PDF, Excel, DXF, GeoJSON, HTML)
  - Survey certificates and plat documents
- **Use Cases**:
  - Generating professional survey reports
  - Creating legal property descriptions
  - Exporting to various industry formats
- **Invocation**: `@land-documentation-generator` or use Task tool with `subagent_type: "land-documentation-generator"`

### 4. **Testing Orchestrator** (`testing-orchestrator.md`)
- **Color**: Blue
- **Purpose**: Comprehensive testing specialist for 3D web applications
- **Key Capabilities**:
  - Unit, integration, and E2E test design
  - Three.js/WebGL testing strategies
  - Performance and visual regression testing
  - Accessibility compliance (WCAG 2.1 AA)
  - Test coverage analysis and gap identification
- **Use Cases**:
  - Setting up comprehensive test suites
  - Testing 3D scene interactions
  - Performance benchmarking
- **Invocation**: `@testing-orchestrator` or use Task tool with `subagent_type: "testing-orchestrator"`

### 5. **Shape Precision Engineer** (`shape-precision-engineer.md`)
- **Color**: Indigo
- **Purpose**: Geometric precision and accuracy specialist
- **Key Capabilities**:
  - Robust geometric predicates
  - Exact arithmetic implementations
  - Shape validation and topology checking
  - Boolean operations (union, intersection, difference)
  - Survey-grade accuracy (±0.01m)
- **Use Cases**:
  - Validating imported survey data
  - Implementing precise geometric operations
  - Detecting and fixing self-intersections
- **Invocation**: `@shape-precision-engineer` or use Task tool with `subagent_type: "shape-precision-engineer"`

## 📚 Existing Agents (Previously Created)

### 6. **Geospatial Processor** (`geospatial-processor.md`)
- **Purpose**: Process and analyze geospatial data for land parcels
- **Capabilities**: Coordinate transformations, boundary calculations, GIS format conversions
- **Status**: Already existed - enhanced version available

### 7. **Performance Optimizer** (`performance-optimizer.md`)
- **Purpose**: Application performance optimization
- **Capabilities**: Bundle size, rendering speed, memory usage optimization
- **Status**: Already existed - complements 3D Scene Optimizer

### 8. **UI/UX Designer** (`ui-ux-designer.md`)
- **Purpose**: Design and improve user interfaces
- **Capabilities**: UI component design, responsive layouts, accessibility
- **Status**: Already existed

### 9. **3D Scene Specialist** (`3d-scene-specialist.md`)
- **Purpose**: Three.js scene rendering and 3D visualization
- **Capabilities**: Camera controls, lighting, materials, mesh optimization
- **Status**: Already existed

### 10. **Test Automation** (`test-automation.md`)
- **Purpose**: Comprehensive testing strategies
- **Capabilities**: Unit tests, integration tests, E2E tests
- **Status**: Already existed

## 🎯 How to Use These Agents

### Method 1: Direct Agent Invocation
```bash
# Using the Task tool in your conversation
@agent 3d-scene-optimizer

# Or with the Task tool programmatically
Task(
  subagent_type="3d-scene-optimizer",
  prompt="Optimize the shape rendering for 500+ polygons",
  description="Performance optimization"
)
```

### Method 2: Combined Agent Workflows
```bash
# Example: Implementing a new CAD feature with testing
1. @cad-feature-builder - Design the feature
2. @shape-precision-engineer - Ensure geometric accuracy
3. @testing-orchestrator - Create comprehensive tests
4. @3d-scene-optimizer - Optimize performance
```

### Method 3: Parallel Agent Execution
```javascript
// Run multiple agents concurrently for different aspects
Task(subagent_type="cad-feature-builder", prompt="Implement dimension tool")
Task(subagent_type="shape-precision-engineer", prompt="Validate dimension calculations")
Task(subagent_type="testing-orchestrator", prompt="Create dimension tool tests")
```

## 🔧 Common Use Case Combinations

### **Importing Survey Data**
1. **Geospatial Processor**: Parse and transform coordinate data
2. **Shape Precision Engineer**: Validate geometry and fix issues
3. **Land Documentation Generator**: Generate import report

### **Implementing New Drawing Tool**
1. **CAD Feature Builder**: Design tool architecture
2. **Shape Precision Engineer**: Implement precise calculations
3. **3D Scene Optimizer**: Ensure smooth performance
4. **Testing Orchestrator**: Create comprehensive tests

### **Optimizing Large Projects**
1. **3D Scene Optimizer**: Profile and optimize rendering
2. **Performance Optimizer**: General app optimization
3. **Testing Orchestrator**: Create performance benchmarks

### **Generating Professional Reports**
1. **Land Documentation Generator**: Create report structure
2. **Geospatial Processor**: Process measurement data
3. **Shape Precision Engineer**: Validate all calculations

## 📋 Agent Selection Guide

| Task | Recommended Agent |
|------|-------------------|
| Fix rendering performance issues | 3D Scene Optimizer |
| Implement AutoCAD-like features | CAD Feature Builder |
| Create survey reports | Land Documentation Generator |
| Validate imported geometry | Shape Precision Engineer |
| Set up testing infrastructure | Testing Orchestrator |
| Process GIS data | Geospatial Processor |
| Design UI improvements | UI/UX Designer |

## 🚦 Agent Capabilities Matrix

| Agent | Performance | Accuracy | UI/UX | Testing | Documentation |
|-------|------------|----------|-------|---------|---------------|
| 3D Scene Optimizer | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐ |
| CAD Feature Builder | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Land Documentation Generator | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| Shape Precision Engineer | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Testing Orchestrator | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 💡 Tips for Effective Agent Usage

1. **Be Specific**: Provide clear, detailed prompts with context
2. **Chain Agents**: Use multiple agents in sequence for complex tasks
3. **Leverage Expertise**: Each agent has deep specialized knowledge
4. **Review Output**: Agents provide detailed analysis and code
5. **Iterate**: Use agent feedback to refine implementations

## 🔄 Integration with Existing Workflow

These agents integrate seamlessly with your existing development workflow:

1. **During Planning**: Use agents to explore implementation strategies
2. **During Development**: Get specialized code implementations
3. **During Testing**: Generate comprehensive test suites
4. **During Optimization**: Profile and improve performance
5. **During Documentation**: Generate professional reports

## 📝 Notes

- All agents follow the pattern established by awesome-claude-code-agents
- Each agent has a specialized system prompt optimized for its domain
- Agents can be invoked individually or in combination
- Agent outputs include working code, not just suggestions
- All agents are aware of the Land Visualizer project context

---

*Created: October 2025*
*Based on: github.com/EricTechPro/awesome-claude-code-agents patterns*
*Project: Land Visualizer - Professional 3D Land Visualization Tool*