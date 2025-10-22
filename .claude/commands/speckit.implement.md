# /speckit.implement - Execute Feature Implementation

Execute all tasks to build the feature according to the specification and implementation plan.

## Usage

```
/speckit.implement [feature-name]
/speckit.implement [spec-directory]
```

## What This Command Does

Systematically implements a feature by:

1. **Loading the task list** from `tasks.md`
2. **Executing each task** in order
3. **Running full test cycle** after every code block
4. **Verifying constitution compliance** throughout
5. **Tracking progress** and updating status
6. **Handling errors** and retrying if needed

## Prerequisites

Before running `/speckit.implement`, ensure:

- ✅ Specification exists (`spec.md`)
- ✅ Implementation plan exists (`plan.md`)
- ✅ Task breakdown exists (`tasks.md`)
- ✅ Optional: `/speckit.analyze` has been run
- ✅ All dependencies installed
- ✅ Dev environment working

## Implementation Cycle

After **EVERY** code block:

```bash
1. npm run lint          # Verify code style
2. npm run build         # Verify compilation
3. Write tests           # Create corresponding tests
4. npm test              # Run test suite
5. Fix issues            # Address any failures
```

**IMPORTANT:** Do not proceed to next code block until all checks pass.

## Workflow

### Phase 1: Preparation
```
1. Read specification
2. Load implementation plan
3. Parse task list
4. Verify dependencies
5. Set up tracking
```

### Phase 2: Implementation
```
For each task in tasks.md:
  1. Display task details
  2. Show code example
  3. Implement solution
  4. Run lint
  5. Run build
  6. Write tests
  7. Run tests
  8. Mark task complete
  9. Commit changes
```

### Phase 3: Validation
```
1. Run full test suite
2. Verify 70% coverage
3. Check performance
4. Review constitution compliance
5. Generate completion report
```

## Implementation Rules

### Code Quality
- ✅ **Elegant, clean code** that solves the problem
- ✅ **TypeScript strict mode** - no `any` types
- ✅ **Inline styles only** - no CSS files
- ✅ **Constitution compliant** - all 10 articles
- ❌ **No backward compatibility** unless requested
- ❌ **No Playwright MCP tools** in implementation

### Testing Requirements
- Unit tests for all logic
- Component tests for all UI
- Integration tests for workflows
- 70% minimum coverage
- All critical paths tested

### Error Handling
- Graceful error recovery
- Clear error messages
- User-friendly feedback
- Logging for debugging

## Task Format

Each task in `tasks.md` follows this structure:

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

## Progress Tracking

The command automatically:

- ✅ Marks completed tasks in `tasks.md`
- ✅ Updates progress percentage
- ✅ Tracks time spent vs estimated
- ✅ Logs issues encountered
- ✅ Creates implementation report

## Example Usage

```
/speckit.implement export-functionality

> Loading specification: specs/001-export-functionality/
> ✓ spec.md found
> ✓ plan.md found
> ✓ tasks.md found
>
> Starting implementation: 24 tasks total
>
> === Phase 1: Foundation (4 tasks) ===
>
> Task 1.1: Install dependencies
> Running: npm install xlsx
> ✓ Dependencies installed
> ✓ Lint passed
> ✓ Build successful
> ✓ Tests passed
> [✓] Task 1.1 complete (5 min)
>
> Task 1.2: Define types
> Creating: src/types/export.ts
> [Implementation happens...]
> ✓ Lint passed
> ✓ Build successful
> ✓ Tests passed
> [✓] Task 1.2 complete (15 min)
>
> [Continue through all tasks...]
>
> === Implementation Complete ===
> ✅ 24/24 tasks completed
> ✅ All tests passing (87% coverage)
> ✅ Constitution compliant
> ⏱️ Time: 14.5 hours (estimated: 14 hours)
>
> Feature ready for review!
```

## Error Recovery

If a task fails:

```
❌ Task 2.3 failed: Build errors

Errors:
- Type error in ExportService.ts:45
- Missing import in ExcelExporter.ts:12

Options:
1. Fix and retry task
2. Skip task (mark for later)
3. Abort implementation

> [User chooses option]
```

## Constitution Compliance

Every implementation is verified against:

- **Article 1:** Inline styles only ✓
- **Article 2:** TypeScript strict ✓
- **Article 3:** Zustand state ✓
- **Article 4:** React best practices ✓
- **Article 5:** 60 FPS performance ✓
- **Article 6:** 70% test coverage ✓
- **Article 7:** Security first ✓
- **Article 8:** Edit existing files ✓
- **Article 9:** Professional UX ✓
- **Article 10:** Proper organization ✓

## Completion Report

After implementation:

```markdown
# Implementation Report: Export Functionality

## Summary
- Start: Jan 12, 2025 10:00 AM
- End: Jan 13, 2025 12:30 AM
- Duration: 14.5 hours
- Tasks completed: 24/24 (100%)

## Metrics
- Test coverage: 87%
- Build time: 3.2s
- Performance: 60 FPS maintained
- Lint warnings: 0
- Type errors: 0

## Files Modified
- 12 files edited
- 3 files created
- 2 files deleted
- 450 lines added
- 120 lines removed

## Constitution Compliance
✅ All 10 articles verified

## Next Steps
- [ ] Code review
- [ ] Manual testing
- [ ] Update documentation
- [ ] Create pull request
```

## Integration with Git

The command can optionally:

- Create feature branch
- Commit after each phase
- Push to remote
- Create PR when done

```
/speckit.implement export-functionality --git

> Creating branch: feature/export-functionality
> [Implements tasks...]
> Committing: Phase 1 complete
> Committing: Phase 2 complete
> [...]
> Pushing to origin
> Creating PR: Export Functionality Implementation
```

## Related Commands

- `/speckit.specify` - Create specification first
- `/speckit.plan` - Create implementation plan
- `/speckit.tasks` - Generate task breakdown
- `/speckit.analyze` - Analyze before implementing
- `/spec-status` - Check implementation progress

## Tips for Success

1. **Run `/speckit.analyze` first** - Catch issues early
2. **Test incrementally** - Don't skip testing cycles
3. **Commit frequently** - After each phase
4. **Monitor performance** - Keep 60 FPS target
5. **Stay compliant** - Constitution is non-negotiable
6. **Ask for help** - Mark blockers immediately

## Quick Start

```
/speckit.implement [feature-name]
```

Execute all tasks and build your feature according to the spec!
