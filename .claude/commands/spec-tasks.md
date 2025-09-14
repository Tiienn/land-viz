# /spec-tasks - Generate Task Breakdown from Plan

Break down an implementation plan into specific, actionable tasks.

## Usage

```
/spec-tasks [plan-file-path]
```

Or if you're in a specification directory:
```
/spec-tasks
```

## What This Command Does

Converts a high-level implementation plan into:

1. **Detailed task list** with clear actions
2. **Code examples** for each task
3. **Time estimates** for planning
4. **Validation checklists** for quality
5. **Test requirements** for each component

## Input Requirements

- An existing plan file (plan.md)
- Or an existing specification to derive tasks from

## Output

Creates `tasks.md` with:

### 1. Prerequisites Checklist
- Environment setup
- Dependencies installed
- Current state validation

### 2. Phase-by-Phase Tasks
Each task includes:
- Task number and name
- Target file(s)
- Time estimate
- Code example
- Validation criteria

### 3. Quick Test Commands
```bash
npm test
npm run type-check
npm run lint
npm run dev
```

### 4. Validation Checklists
- Before starting
- After each task
- Before completion

## Task Format

```markdown
### Task X.Y: [Task Name]
**File:** `src/path/to/file.ts`
**Estimated Time:** XX minutes

- [ ] Sub-task 1
- [ ] Sub-task 2
- [ ] Write tests
- [ ] Verify functionality

```typescript
// Code example
```
```

## Example Usage

```
/spec-tasks specs/001-export-functionality/plan.md

/spec-tasks  # When in a spec directory

/spec-tasks "Based on the export implementation plan..."
```

## Task Categories

### Foundation Tasks
- Type definitions
- Store updates
- Service creation
- Utility functions

### Implementation Tasks
- Component creation
- Business logic
- Integration points
- Event handlers

### Testing Tasks
- Unit tests
- Integration tests
- Component tests
- E2E tests

### Polish Tasks
- Performance optimization
- Error handling
- Documentation
- Code cleanup

## Key Principles

All tasks follow:
- **Small, atomic actions** (30-120 minutes)
- **Clear success criteria**
- **Testable outcomes**
- **Constitution compliance**
- **Inline styles for UI**

## Task Prioritization

Tasks are ordered by:
1. Dependencies (foundation first)
2. Core functionality
3. UI integration
4. Testing
5. Polish

## Related Commands

- `/specify` - Create complete specification
- `/spec-plan` - Generate implementation plan
- `/review-plan` - Validate approach

## Quick Start

```
/spec-tasks
```

I'll break down your plan into specific, actionable tasks with code examples!