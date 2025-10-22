# /spec-plan - Generate Implementation Plan from Specification

Create a detailed technical implementation plan from a feature specification.

## Usage

```
/spec-plan [spec-file-path]
```

Or if you're in a specification directory:
```
/spec-plan
```

## What This Command Does

Generates a comprehensive implementation plan that includes:

1. **Technical architecture** and approach
2. **Dependency analysis** and requirements
3. **File structure** and component organization
4. **Phase-by-phase implementation** strategy
5. **Testing and validation** approach
6. **Performance and security** considerations

## Input Requirements

- An existing specification file (spec.md)
- Or a clear description of the feature requirements

## Output

Creates `plan.md` with:

### 1. Technical Context
- Current architecture review
- Required dependencies
- Integration points

### 2. Implementation Phases
- Foundation setup
- Core functionality
- UI integration
- Testing phases
- Polish and optimization

### 3. File Structure
```
app/src/
├── components/
├── services/
├── types/
└── store/
```

### 4. Risk Assessment
- Technical risks
- Performance impacts
- Mitigation strategies

### 5. Constitution Compliance Checklist
- Verifies all 10 articles
- Ensures project standards

## Example Usage

```
/spec-plan specs/001-export-functionality/spec.md

/spec-plan  # When in a spec directory

/spec-plan "Based on the layer management specification..."
```

## Plan Structure

```markdown
# Implementation Plan: [Feature]

## Technical Context
- Architecture
- Dependencies
- Constraints

## Implementation Approach
### Phase 1: Foundation
### Phase 2: Core Features
### Phase 3: Integration
### Phase 4: Testing

## File Structure
## Testing Strategy
## Performance Considerations
## Security Considerations
## Constitution Compliance
## Risk Assessment
## Implementation Checklist
```

## Key Considerations

The plan will always:
- **Use inline styles** for all UI components
- **Integrate with Zustand** store
- **Follow TypeScript** strict mode
- **Prefer editing** existing files
- **Maintain 60 FPS** performance
- **Include comprehensive tests**

## Time Estimates

Each phase includes:
- Realistic time estimates
- Task complexity ratings
- Dependency indicators

## Related Commands

- `/specify` - Create complete specification
- `/spec-tasks` - Generate task breakdown
- `/review-plan` - Validate existing plan

## Quick Start

```
/spec-plan
```

I'll analyze your specification and generate a complete implementation plan!