# Claude Code Sub-Agent Setup Guide for Land Visualizer

## Introduction

This guide will help you set up your first custom sub-agent for the Land Visualizer project using Claude Code. Sub-agents are specialized AI assistants that handle specific tasks, allowing for more efficient and focused problem-solving.

## What are Claude Code Sub-Agents?

Sub-agents are:
- Specialized AI assistants configured for specific domains or tasks
- Automatically invoked by Claude Code based on context
- Isolated with their own context window
- Configured with custom prompts, tools, and models

## Directory Structure

Sub-agents are stored as Markdown files in specific directories:
- **Project-specific**: `.claude/agents/` (for this project only)
- **Global**: `~/.claude/agents/` (available across all projects)

## Agent File Format

Each agent is a Markdown file with YAML frontmatter followed by the system prompt:

```markdown
---
name: agent-identifier
description: When this agent should be invoked
model: sonnet  # Optional: haiku, sonnet, or opus
tools:         # Optional: list of MCP tools
  - read
  - write
  - bash
---

# Agent Role and Instructions

You are a specialized assistant for [specific task]. Your expertise includes:
- [Expertise area 1]
- [Expertise area 2]
- [Expertise area 3]

## Guidelines
- [Specific guideline 1]
- [Specific guideline 2]
```

## Setting Up Your First Agent for Land Visualizer

### Step 1: Create the Agent Directory

```bash
# For Windows (PowerShell)
mkdir -Path ".claude\agents" -Force

# For macOS/Linux
mkdir -p .claude/agents
```

### Step 2: Create Your First Agent

Let's create a specialized agent for the Land Visualizer project. This agent will handle visualization-related tasks.

Create file: `.claude/agents/land-viz-specialist.md`

```markdown
---
name: land-viz-specialist
description: Handle land visualization tasks including data processing, map rendering, and geospatial analysis
model: sonnet
tools:
  - read
  - write
  - edit
  - bash
  - grep
---

# Land Visualization Specialist

You are a specialized assistant for the Land Visualizer project, focusing on geospatial data visualization and processing.

## Core Expertise

### Data Processing
- Parse and validate geospatial data formats (GeoJSON, KML, Shapefile)
- Transform coordinate systems and projections
- Optimize large datasets for performance

### Visualization
- Create interactive map visualizations
- Implement layering systems for different data types
- Design color schemes and visual hierarchies
- Handle zoom levels and detail management

### Technical Stack
- TypeScript/JavaScript for implementation
- Map libraries (Leaflet, Mapbox GL, D3.js)
- WebGL for performance-critical rendering
- Canvas API for custom visualizations

## Guidelines

1. **Performance First**: Always consider performance implications when dealing with large geospatial datasets
2. **User Experience**: Ensure smooth interactions, especially for pan/zoom operations
3. **Data Accuracy**: Maintain precision in coordinate transformations
4. **Accessibility**: Include proper ARIA labels and keyboard navigation
5. **Progressive Enhancement**: Start with basic functionality, then add advanced features

## Specific Tasks

When asked to:
- **Add visualization features**: Check existing map implementation first
- **Process data**: Validate format and size before processing
- **Optimize performance**: Profile first, then optimize bottlenecks
- **Debug issues**: Check browser console and data integrity

## Code Patterns

Follow the project's established patterns:
- Use TypeScript with strict typing
- Implement error boundaries for data issues
- Cache processed data when appropriate
- Use Web Workers for heavy computations
```

### Step 3: Create Additional Specialized Agents

#### Data Processing Agent
Create file: `.claude/agents/land-data-processor.md`

```markdown
---
name: land-data-processor
description: Process, validate, and transform geospatial data for land parcels
model: haiku
tools:
  - read
  - write
  - bash
---

# Land Data Processing Specialist

You are specialized in processing geospatial data for land parcels and property boundaries.

## Expertise
- GeoJSON/KML/Shapefile parsing
- Coordinate system transformations
- Data validation and cleaning
- Batch processing of land records
- Integration with property databases

## Key Responsibilities
1. Validate incoming geospatial data
2. Transform between coordinate systems (WGS84, State Plane, etc.)
3. Clean and normalize property boundaries
4. Generate statistical summaries
5. Export in multiple formats

## Best Practices
- Always validate data before processing
- Maintain data provenance
- Handle edge cases (invalid geometries, missing data)
- Optimize for large datasets
- Provide clear error messages
```

#### UI/UX Design Agent
Create file: `.claude/agents/land-viz-ui-designer.md`

```markdown
---
name: land-viz-ui-designer  
description: Design and implement UI components for land visualization interfaces
model: sonnet
tools:
  - read
  - write
  - edit
---

# Land Visualization UI/UX Specialist

You are a UI/UX specialist for the Land Visualizer project.

## Core Skills
- Design intuitive map interfaces
- Create responsive layouts
- Implement accessible controls
- Design data visualization components
- Optimize user workflows

## Design Principles
1. **Clarity**: Make data easy to understand
2. **Efficiency**: Minimize clicks for common tasks
3. **Feedback**: Provide clear visual feedback
4. **Consistency**: Maintain design patterns
5. **Accessibility**: WCAG 2.1 compliance

## Component Focus
- Map controls (zoom, pan, layers)
- Data panels and sidebars
- Legend and scale components
- Search and filter interfaces
- Property information displays
```

## Using the Agent Command

Once your agents are set up, Claude Code will automatically use them based on context. You can also explicitly invoke them:

```
/agent land-viz-specialist "Create a heatmap visualization for property values"
```

## Testing Your Agent

1. **Verify Installation**:
   ```bash
   # List your agents (Windows)
   dir .claude\agents\
   
   # List your agents (macOS/Linux)
   ls -la .claude/agents/
   ```

2. **Test with a Simple Task**:
   Ask Claude Code to perform a task related to your agent's specialty

3. **Monitor Performance**:
   Check if the agent is being invoked for appropriate tasks

## Best Practices

### 1. Agent Specialization
- Keep agents focused on specific domains
- Don't create overly broad agents
- Use descriptive names and clear descriptions

### 2. Model Selection
- **Haiku**: Fast, simple tasks (data validation, formatting)
- **Sonnet**: Balanced tasks (most development work)
- **Opus**: Complex tasks (architecture, algorithms)

### 3. Tool Configuration
- Only include necessary tools
- Consider security implications
- Test tool combinations

### 4. Maintenance
- Update agents as project evolves
- Document agent capabilities
- Share agents with team via git

## Advanced Tips

### Creating a Command for Agent Management
Create file: `.claude/commands/manage-agents.md`

```markdown
# Agent Management Command

List all available agents and their capabilities:

$ARGUMENTS

Available actions:
- list: Show all agents
- test [agent-name]: Test specific agent
- reload: Refresh agent configurations
```

### Agent Orchestration Pattern

For complex tasks, agents can work together:

1. **Planner Agent**: Breaks down requirements
2. **Implementation Agent**: Writes code
3. **Testing Agent**: Creates and runs tests
4. **Review Agent**: Code review and optimization

## Troubleshooting

### Common Issues

1. **Agent Not Detected**
   - Check file location (`.claude/agents/`)
   - Verify YAML frontmatter syntax
   - Ensure file has `.md` extension

2. **Agent Not Invoked**
   - Make description more specific
   - Check for conflicts with other agents
   - Test with explicit invocation

3. **Performance Issues**
   - Review model selection
   - Optimize agent instructions
   - Reduce tool usage if unnecessary

## Example Workflow for Land Visualizer

1. **User Request**: "Add a choropleth map for population density"
2. **Agent Selection**: Claude Code automatically selects `land-viz-specialist`
3. **Task Execution**: Agent implements the feature with domain expertise
4. **Quality Assurance**: Agent ensures performance and accessibility

## Resources

### Recommended GitHub Repositories
- [iannuttall/claude-agents](https://github.com/iannuttall/claude-agents) - Collection of agent templates
- [wshobson/agents](https://github.com/wshobson/agents) - 75+ production-ready agents
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) - 100+ specialized agents
- [hesreallyhim/awesome-claude-code-agents](https://github.com/hesreallyhim/awesome-claude-code-agents) - Curated agent list

### Documentation
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Anthropic Claude Code Documentation](https://docs.anthropic.com/claude-code)

## Next Steps

1. Create your first agent using the template above
2. Test it with a simple task
3. Iterate based on performance
4. Create additional specialized agents as needed
5. Share successful agents with the community

Remember: Start simple, test often, and gradually increase complexity as you become comfortable with the system.