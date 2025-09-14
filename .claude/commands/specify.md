# /specify - Specification-Driven Development Workflow

Create comprehensive feature specifications using the Spec-Kit methodology for the Land Visualizer project.

## Usage

```
/specify [feature-name]
```

## What This Command Does

This command initiates a specification-driven development workflow that:

1. **Creates a feature specification** following the project's standards
2. **Generates an implementation plan** with technical details
3. **Breaks down into actionable tasks** with time estimates
4. **Ensures constitution compliance** with project principles
5. **Provides a complete development roadmap** for the feature

## Workflow Steps

### Step 1: Feature Specification
- Gather requirements and user stories
- Define acceptance criteria
- Identify functional requirements
- Mark ambiguities explicitly
- Document edge cases
- Specify UI/UX requirements

### Step 2: Implementation Plan
- Analyze technical approach
- Define architecture and dependencies
- Create file structure
- Plan testing strategy
- Assess performance impact
- Verify constitution compliance

### Step 3: Task Breakdown
- Create detailed task list
- Provide code examples
- Estimate time for each task
- Define validation criteria
- Set up testing requirements

## Command Execution

When you run `/specify [feature-name]`, I will:

1. **Ask clarifying questions** about the feature requirements
2. **Create a new specification** in `specs/XXX-feature-name/`
3. **Generate three documents**:
   - `spec.md` - Feature specification
   - `plan.md` - Technical implementation plan
   - `tasks.md` - Detailed task breakdown

## Example Usage

```
/specify layer-management

/specify measurement-tools

/specify mobile-optimization
```

## Output Structure

```
specs/
└── 002-layer-management/
    ├── spec.md       # What to build
    ├── plan.md       # How to build it
    └── tasks.md      # Step-by-step tasks
```

## Constitution Compliance

All specifications will automatically comply with:

- **Article 1**: Inline styles only
- **Article 2**: TypeScript strict mode
- **Article 3**: Zustand state management
- **Article 4**: React best practices
- **Article 5**: 3D rendering standards
- **Article 6**: Testing requirements (70% coverage)
- **Article 7**: Security first approach
- **Article 8**: Prefer editing existing files
- **Article 9**: Professional UX (Canva-inspired)

## Interactive Process

The command will guide you through:

1. **Feature Discovery**
   - What problem does this solve?
   - Who are the users?
   - What are the key requirements?

2. **Technical Assessment**
   - What components need updates?
   - What new services are required?
   - What are the performance implications?

3. **Risk Analysis**
   - What could go wrong?
   - What are the edge cases?
   - What are the dependencies?

## Templates Used

The command leverages these templates:
- `templates/spec-template.md`
- `templates/plan-template.md`
- `templates/tasks-template.md`

## Benefits

- **Consistent specifications** across all features
- **Clear implementation roadmap** before coding
- **Reduced ambiguity** and rework
- **Better time estimates** for planning
- **Automatic compliance** with project standards

## Related Commands

- `/plan` - Generate only the implementation plan
- `/tasks` - Generate only the task breakdown
- `/review-plan` - Review and validate existing plans

## Quick Start

Simply type:
```
/specify
```

And I'll guide you through creating a complete specification for your next Land Visualizer feature!

## Notes

- Specifications are living documents - update them as you learn
- Mark all ambiguities with `AMBIGUITY:` for later clarification
- Each specification gets a unique number (002, 003, etc.)
- All generated files follow the project's established patterns