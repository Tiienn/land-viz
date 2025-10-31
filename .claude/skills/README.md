# Land Visualizer Custom Skills

This directory contains custom Claude Code skills specifically designed for the Land Visualizer project. These skills enhance Claude's capabilities when working with geospatial data, 3D visualization, performance optimization, UI/UX design, and testing.

## 🎯 What Are Skills?

Skills are specialized folders containing instructions, scripts, and resources that Claude loads dynamically to improve performance on specialized tasks. They provide:

- **Composable**: Multiple skills work together seamlessly
- **Portable**: Build once, work across Claude platforms
- **Efficient**: Only load when needed
- **Powerful**: Can include executable code

## 📚 Available Skills

### 1. Geospatial Processor
**Location**: `.claude/skills/geospatial-processor/`
**Description**: Process, analyze, and manipulate geospatial data for land parcels, property boundaries, and geographic coordinate systems.

**Key Capabilities**:
- Coordinate system transformations (WGS84, UTM, State Plane)
- Property boundary validation and calculations
- Area and perimeter calculations (planar and geodetic)
- GeoJSON, Shapefile, KML, DXF format handling
- Survey-grade precision (±0.01%)

**When to Use**:
- Converting between coordinate systems
- Calculating property areas with precision
- Validating parcel boundaries
- Processing GIS data formats

### 2. 3D Scene Specialist
**Location**: `.claude/skills/3d-scene-specialist/`
**Description**: Manage Three.js scene rendering, camera controls, lighting systems, and 3D visualization.

**Key Capabilities**:
- React Three Fiber optimization patterns
- Camera management (orthographic/perspective)
- Instanced rendering for performance
- Material and shader creation
- Interactive element handling

**When to Use**:
- Optimizing Three.js performance
- Implementing camera controls
- Creating materials and lighting
- Debugging rendering issues

### 3. Land Visualizer Specialist
**Location**: `.claude/skills/land-viz-specialist/`
**Description**: Domain-specific expertise for land visualization, property measurements, and visual comparison systems.

**Key Capabilities**:
- Drawing tools (rectangle, circle, polyline, measurement)
- Visual comparison system (soccer fields, houses, etc.)
- Unit conversion (12+ area units)
- Direct dimension input
- CAD-style precision features

**When to Use**:
- Implementing drawing tools
- Creating visual comparison systems
- Unit conversion logic
- Property boundary editing

### 4. Performance Optimizer
**Location**: `.claude/skills/performance-optimizer/`
**Description**: Optimize application performance including bundle size, rendering speed, memory usage, and runtime efficiency.

**Key Capabilities**:
- Performance budget enforcement
- React optimization patterns
- Code splitting and lazy loading
- Memory leak prevention
- Performance profiling and monitoring

**When to Use**:
- Optimizing bundle size
- Improving FPS
- Reducing memory usage
- Setting up performance monitoring

### 5. UI/UX Designer
**Location**: `.claude/skills/ui-ux-designer/`
**Description**: Design and implement Canva-inspired design system with WCAG 2.1 AA accessibility compliance.

**Key Capabilities**:
- Canva-inspired design system
- Component library (buttons, toasts, loaders)
- Animation library (pulse, shake, shimmer)
- WCAG 2.1 AA accessibility
- Responsive design (375/768/1024/1440px)

**When to Use**:
- Designing new UI components
- Implementing design system
- Ensuring accessibility
- Creating responsive layouts

### 6. Test Automation
**Location**: `.claude/skills/test-automation/`
**Description**: Comprehensive testing strategies including unit, integration, performance, and accessibility tests.

**Key Capabilities**:
- Unit testing (Vitest + React Testing Library)
- Integration testing (user workflows)
- Performance regression tests
- Accessibility testing (jest-axe)
- Test coverage optimization

**When to Use**:
- Writing unit tests
- Creating integration tests
- Performance testing
- Accessibility compliance testing

## 🚀 How to Use

### Installation

These skills are already installed in the project. Claude Code will automatically load them when relevant to your task.

### Verification

To verify the skills are available:

```bash
# List all skills
ls -la .claude/skills/

# Check a specific skill
cat .claude/skills/geospatial-processor/SKILL.md | head -20
```

### Activation

Skills are activated automatically when Claude detects relevant work. You can also explicitly invoke a skill:

```
"Use the geospatial-processor skill to help me convert coordinates from WGS84 to UTM"
```

## 📖 Skill Structure

Each skill follows this structure:

```
skill-name/
├── SKILL.md           # Required: Main skill file
├── REFERENCE.md       # Optional: Extended documentation
├── resources/         # Optional: Supporting files
└── scripts/          # Optional: Executable code
```

### SKILL.md Format

```markdown
---
name: "Skill Name"
description: "Brief description of what the skill does (max 200 chars)"
version: "1.0.0"
dependencies:
  - "package@version"
---

# Skill content in markdown...
```

## 🔄 Updating Skills

To update a skill:

1. Edit the appropriate `SKILL.md` file
2. Update the `version` field in the frontmatter
3. Document changes in the skill content
4. Restart Claude Code to reload skills

## 🎯 Skill Composition

Skills are designed to work together automatically. For example:

- **Geospatial Processor** + **3D Scene Specialist** = Accurate 3D property visualization
- **Land Viz Specialist** + **UI/UX Designer** = Beautiful, functional drawing tools
- **Performance Optimizer** + **Test Automation** = High-performance, tested code

## 📊 Coverage Matrix

| Feature Area | Primary Skill | Supporting Skills |
|--------------|---------------|-------------------|
| Coordinate Systems | Geospatial Processor | - |
| 3D Rendering | 3D Scene Specialist | Performance Optimizer |
| Drawing Tools | Land Viz Specialist | UI/UX Designer |
| Measurements | Land Viz Specialist | Geospatial Processor |
| Visual Design | UI/UX Designer | - |
| Performance | Performance Optimizer | 3D Scene Specialist |
| Testing | Test Automation | All skills |

## 🔧 Development Guidelines

### Creating New Skills

1. **Create directory**: `.claude/skills/new-skill-name/`
2. **Create SKILL.md** with proper frontmatter
3. **Write focused content** (one domain per skill)
4. **Test the skill** by asking Claude to use it
5. **Document usage** in this README

### Best Practices

1. **Keep skills focused** - One domain per skill
2. **Write clear descriptions** - Claude uses this to decide when to load the skill
3. **Include examples** - Show code patterns and usage
4. **Update versions** - Increment version on changes
5. **Test regularly** - Ensure skills load correctly

## 📝 Skill Maintenance

### Regular Updates

- Review skills quarterly for relevance
- Update dependencies to latest versions
- Add new patterns as project evolves
- Remove outdated information

### Version History

| Skill | Version | Last Updated | Changes |
|-------|---------|--------------|---------|
| Geospatial Processor | 1.0.0 | 2025-01-31 | Initial creation |
| 3D Scene Specialist | 1.0.0 | 2025-01-31 | Initial creation |
| Land Viz Specialist | 1.0.0 | 2025-01-31 | Initial creation |
| Performance Optimizer | 1.0.0 | 2025-01-31 | Initial creation |
| UI/UX Designer | 1.0.0 | 2025-01-31 | Initial creation |
| Test Automation | 1.0.0 | 2025-01-31 | Initial creation |

## 🎓 Learning Resources

- **Skills Documentation**: https://www.anthropic.com/news/skills
- **Skills Repository**: https://github.com/anthropics/skills
- **Help Center**: https://support.claude.com/en/articles/12512198

## 🤝 Contributing

When adding new skills:

1. Follow the established structure
2. Write comprehensive documentation
3. Include code examples
4. Test with real tasks
5. Update this README

## 📞 Support

For issues with skills:

1. Check skill file syntax (YAML frontmatter)
2. Verify Claude Code has restarted after changes
3. Review skill description for clarity
4. Test skill invocation explicitly

---

**Created**: January 31, 2025
**Project**: Land Visualizer
**Purpose**: Enhance Claude Code capabilities for geospatial 3D visualization development
