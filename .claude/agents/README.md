# Land Visualizer Sub-Agents Collection

This directory contains specialized Claude Code sub-agents designed specifically for the Land Visualizer project. Each agent is an expert in their domain and can be automatically invoked by Claude Code based on context or explicitly called when needed.

## 📋 Available Agents

### 🌍 geospatial-processor
**Model**: Sonnet  
**Description**: Process, analyze, and manipulate geospatial data for land parcels, property boundaries, and coordinate systems.

**When to use**:
- Processing shapefiles, GeoJSON, KML, or DXF files
- Converting between coordinate systems (WGS84, UTM, State Plane)
- Calculating geodetic areas with survey-grade precision
- Validating property boundaries and topology
- Handling metes and bounds descriptions
- Working with cadastral data and PLSS

**Example triggers**:
- "Process this shapefile and extract property boundaries"
- "Convert these lat/lon coordinates to UTM"
- "Calculate the precise area of this parcel"
- "Validate if this polygon is topologically correct"

---

### 🎨 3d-scene-specialist
**Model**: Sonnet  
**Description**: Manage Three.js scene rendering, camera controls, lighting, materials, and WebGL optimization.

**When to use**:
- Setting up or optimizing the 3D visualization scene
- Implementing camera controls and navigation
- Creating custom shaders or materials
- Optimizing rendering performance
- Working with React Three Fiber components
- Implementing LOD systems or instanced rendering

**Example triggers**:
- "Optimize the 3D scene for better FPS"
- "Add dynamic lighting to the terrain"
- "Implement first-person camera controls"
- "Create a custom shader for water surfaces"

---

### 🎯 ui-ux-designer
**Model**: Sonnet  
**Description**: Design and implement user interfaces with Canva-inspired modern design principles.

**When to use**:
- Creating new UI components or layouts
- Improving user workflows and interactions
- Implementing responsive designs
- Ensuring accessibility compliance
- Designing with the established design system
- Creating smooth animations and micro-interactions

**Example triggers**:
- "Design a new property details panel"
- "Make this interface mobile-responsive"
- "Improve the drawing tools workflow"
- "Add keyboard navigation support"

---

### ⚡ performance-optimizer
**Model**: Sonnet  
**Description**: Optimize application performance including bundle size, rendering speed, and memory usage.

**When to use**:
- Analyzing and reducing bundle sizes
- Optimizing React component re-renders
- Improving Three.js rendering performance
- Implementing code splitting and lazy loading
- Setting up performance monitoring
- Optimizing for mobile devices

**Example triggers**:
- "The app is running slowly on mobile"
- "Reduce the initial bundle size"
- "Implement lazy loading for heavy components"
- "Profile and optimize the drawing performance"

---

### 🧪 test-automation
**Model**: Sonnet  
**Description**: Design and implement comprehensive testing strategies across all testing levels.

**When to use**:
- Writing unit tests for new features
- Creating integration tests
- Setting up E2E tests with Cypress
- Implementing accessibility tests
- Creating performance test suites
- Setting up CI/CD test pipelines

**Example triggers**:
- "Write tests for the area calculation service"
- "Create E2E tests for the drawing workflow"
- "Set up accessibility testing"
- "Add visual regression tests"

---

### 🔧 chili3d-integration
**Model**: Opus (for complex CAD operations)  
**Description**: Integrate Chili3D CAD engine for professional precision and CAD export formats.

**When to use**:
- Implementing survey-grade precision calculations
- Setting up WebAssembly modules
- Creating boolean operations (union, difference, intersection)
- Implementing CAD export (STEP, IGES, DXF)
- Working with OpenCascade geometry kernel
- Optimizing WASM performance

**Example triggers**:
- "Integrate Chili3D for precision calculations"
- "Export to STEP format for CAD software"
- "Implement property subdivision with boolean operations"
- "Set up WebAssembly compilation for Chili3D"

---

### 🌐 land-viz-specialist
**Model**: Haiku  
**Description**: General Land Visualizer project specialist for quick tasks and project navigation.

**When to use**:
- Quick file lookups and navigation
- Understanding project structure
- Simple code modifications
- Project documentation queries

---

## 🚀 How to Use These Agents

### Automatic Invocation
Claude Code will automatically delegate to the appropriate agent based on your task. Simply describe what you need:

```
"I need to calculate the precise area of this property boundary"
→ Automatically uses geospatial-processor

"The 3D scene is lagging on mobile devices"
→ Automatically uses performance-optimizer

"Create tests for the new export feature"
→ Automatically uses test-automation
```

### Explicit Invocation
You can also explicitly request a specific agent:

```
"Use the chili3d-integration agent to set up STEP export"
"Ask the ui-ux-designer to create a new toolbar design"
```

## 📊 Agent Capabilities Summary

| Agent | Expertise Level | Best For |
|-------|-----------------|----------|
| geospatial-processor | Expert | GIS data, coordinate systems, precision calculations |
| 3d-scene-specialist | Expert | Three.js, WebGL, 3D rendering optimization |
| ui-ux-designer | Expert | Interface design, user experience, accessibility |
| performance-optimizer | Expert | Speed optimization, bundle size, memory management |
| test-automation | Expert | All testing levels, CI/CD, quality assurance |
| chili3d-integration | Expert | CAD precision, WASM, professional exports |
| land-viz-specialist | Specialist | Project navigation, quick fixes |

## 🔄 Agent Coordination

These agents can work together on complex tasks:

1. **Feature Implementation Flow**:
   - `ui-ux-designer` → Design the interface
   - `3d-scene-specialist` → Implement 3D visualization
   - `test-automation` → Create tests
   - `performance-optimizer` → Optimize implementation

2. **Professional Mode Flow**:
   - `chili3d-integration` → Set up precision engine
   - `geospatial-processor` → Handle coordinate transformations
   - `performance-optimizer` → Optimize WASM loading

3. **Data Import Flow**:
   - `geospatial-processor` → Parse and validate data
   - `3d-scene-specialist` → Visualize in 3D
   - `ui-ux-designer` → Create import UI

## 🛠️ Installation

These agents are automatically available in your `.claude/agents/` directory. Claude Code will detect and load them on startup.

To verify agents are loaded:
```bash
ls ~/.claude/agents/
```

## 📝 Agent Development Guidelines

When creating or modifying agents:

1. **Specificity**: Each agent should be an expert in their domain
2. **Context**: Provide comprehensive context about Land Visualizer
3. **Examples**: Include code examples and patterns
4. **Integration**: Show how to integrate with existing code
5. **Communication**: Define clear communication style

## 🎯 Recommended Workflows

### Starting a New Feature
1. Describe your feature to Claude Code
2. Let agents automatically coordinate
3. Review generated code and tests
4. Request optimizations if needed

### Debugging Issues
1. Describe the problem
2. Relevant agent will analyze
3. Get specific, targeted solutions
4. Implementation with best practices

### Performance Optimization
1. Report performance issues
2. `performance-optimizer` analyzes
3. Get optimization recommendations
4. Implementation with measurements

## 📚 Additional Resources

- [Land Visualizer Documentation](../../docs/)
- [Chili3D Integration Guide](../../docs/technical/chili3d-integration.md)
- [Testing Strategy](../../docs/technical/TESTING.md)
- [API Documentation](../../docs/technical/API.md)

## 🤝 Contributing

To add new agents or improve existing ones:
1. Follow the agent template structure
2. Include comprehensive expertise sections
3. Add practical code examples
4. Document when to use the agent
5. Test agent effectiveness

---

*These agents are optimized for the Land Visualizer project and will continue to evolve as the project grows.*