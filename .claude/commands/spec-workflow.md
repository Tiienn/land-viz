# /spec-workflow - Complete Specification Workflow

Execute the full Specification-Driven Development workflow for a new feature.

## Usage

```
/spec-workflow [feature-name]
```

## What This Command Does

Guides you through the complete Spec-Kit workflow:

1. **📋 Specification** - Define what to build
2. **📐 Planning** - Determine how to build it
3. **✅ Tasks** - Break down into actionable steps
4. **🚀 Implementation** - Ready-to-code roadmap

## Interactive Workflow

### Step 1: Feature Discovery 🔍
I'll ask about:
- Problem being solved
- Target users
- Key requirements
- Success criteria
- UI/UX needs

### Step 2: Specification Creation 📝
I'll generate:
- User stories
- Acceptance criteria
- Functional requirements
- Edge cases
- Ambiguities marked

### Step 3: Technical Planning 🏗️
I'll create:
- Architecture approach
- Dependency analysis
- File structure
- Testing strategy
- Risk assessment

### Step 4: Task Breakdown 📌
I'll provide:
- Detailed task list
- Code examples
- Time estimates
- Validation criteria
- Test requirements

## Output Structure

```
specs/
└── XXX-feature-name/
    ├── spec.md       # Complete specification
    ├── plan.md       # Implementation plan
    └── tasks.md      # Task breakdown
```

## Example Usage

```
/spec-workflow layer-management

User: /spec-workflow layer-management
Assistant: I'll guide you through creating a complete specification for the layer management feature.

First, let me understand the requirements:
1. What problem does layer management solve for users?
2. What operations should users be able to perform?
3. How should layers interact with existing shapes?

[Interactive process continues...]
```

## Workflow Phases

### Phase 1: Requirements Gathering
- Problem statement
- User needs
- Functional requirements
- Non-functional requirements

### Phase 2: Specification Writing
- User stories
- Acceptance criteria
- Technical constraints
- UI/UX requirements

### Phase 3: Technical Planning
- Architecture design
- Component structure
- State management
- Performance considerations

### Phase 4: Task Generation
- Foundation tasks
- Implementation tasks
- Testing tasks
- Polish tasks

## Constitution Compliance

Every step ensures compliance with:

| Article | Requirement | Verification |
|---------|------------|--------------|
| 1 | Inline styles only | ✅ UI components |
| 2 | TypeScript strict | ✅ All files |
| 3 | Zustand store | ✅ State management |
| 4 | React best practices | ✅ Components |
| 5 | 3D standards | ✅ Performance |
| 6 | 70% test coverage | ✅ Test tasks |
| 7 | Security first | ✅ Client-side |
| 8 | Prefer editing | ✅ File updates |
| 9 | Professional UX | ✅ Design |

## Quick Workflow

```
/spec-workflow

> What feature would you like to specify?
> layer-management

> Creating specification for layer management...
> [Questions about requirements]
> [Generates spec.md]

> Creating implementation plan...
> [Analyzes architecture]
> [Generates plan.md]

> Breaking down into tasks...
> [Creates detailed tasks]
> [Generates tasks.md]

> ✅ Complete! Ready to implement.
```

## Benefits

- **Comprehensive** - Nothing is missed
- **Consistent** - Same quality every time
- **Efficient** - 12-hour process → 15 minutes
- **Traceable** - Clear documentation
- **Testable** - Built-in validation

## Next Steps After Workflow

1. **Review generated files** in `specs/XXX-feature/`
2. **Install dependencies** if needed
3. **Start with Phase 1** tasks
4. **Test frequently** during implementation
5. **Update specs** as you learn

## Tips

- Answer questions thoroughly for better specs
- Mark uncertainties for later clarification
- Review constitution.md before starting
- Use existing code as reference
- Test early and often

## Related Commands

- `/specify` - Just create specification
- `/spec-plan` - Just create plan
- `/spec-tasks` - Just create tasks
- `/review-plan` - Review existing plan

## Quick Start

Simply type:
```
/spec-workflow
```

And I'll guide you through the entire process!