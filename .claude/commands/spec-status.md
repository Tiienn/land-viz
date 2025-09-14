# /spec-status - Check Specification Status

View the status of all specifications and their implementation progress.

## Usage

```
/spec-status
```

Or for a specific feature:
```
/spec-status [feature-name]
```

## What This Command Does

Provides a comprehensive overview of:

1. **All specifications** in the project
2. **Implementation status** for each feature
3. **Task completion** progress
4. **Time estimates** vs actual
5. **Blocked items** and dependencies

## Output Format

```
📊 Land Visualizer - Specification Status

✅ 001-export-functionality
   Status: Ready for Implementation
   Files: ✓ spec.md ✓ plan.md ✓ tasks.md
   Tasks: 0/24 completed
   Estimate: 14 hours
   Priority: HIGH

🚧 002-layer-management
   Status: In Progress
   Files: ✓ spec.md ✓ plan.md ⏳ tasks.md
   Tasks: 5/18 completed (28%)
   Estimate: 10 hours (3 hours spent)

📝 003-measurement-tools
   Status: Specification Phase
   Files: ✓ spec.md ⏳ plan.md ⏳ tasks.md
   Priority: MEDIUM

⏳ Upcoming Features:
   - mobile-optimization
   - chili3d-integration
   - terrain-tools
```

## Status Indicators

### Specification Status
- 📝 **Specification Phase** - Writing requirements
- 📐 **Planning Phase** - Creating technical plan
- ✅ **Ready for Implementation** - All docs complete
- 🚧 **In Progress** - Implementation started
- ✓ **Complete** - Feature implemented
- 🔴 **Blocked** - Has dependencies

### File Status
- ✓ Complete
- ⏳ In progress
- ❌ Not started

### Priority Levels
- 🔴 **HIGH** - Critical path
- 🟡 **MEDIUM** - Important
- 🟢 **LOW** - Nice to have

## Detailed View

For specific features:
```
/spec-status export-functionality

📋 Export Functionality - Detailed Status

Specification: ✅ Complete
- User stories: 4/4
- Requirements: 12/12
- Ambiguities: 3 marked

Plan: ✅ Complete
- Phases: 6 defined
- Dependencies: 4 packages
- Risk items: 4 identified

Tasks: 🚧 In Progress
Phase 1: Foundation (2h)
  ✅ Task 1.1: Install dependencies
  ✅ Task 1.2: Define types
  ⏳ Task 1.3: Update store
  ⏳ Task 1.4: Create service base

Phase 2: Excel Export (3h)
  ⏳ Not started

[... more phases ...]

Time Tracking:
- Estimated: 14 hours
- Spent: 2.5 hours
- Remaining: 11.5 hours

Next Action:
→ Complete Task 1.3: Update store
```

## Command Options

### Filter by Status
```
/spec-status --ready        # Ready for implementation
/spec-status --in-progress  # Currently being worked on
/spec-status --blocked      # Blocked features
```

### Sort Options
```
/spec-status --sort=priority  # By priority
/spec-status --sort=progress  # By completion %
/spec-status --sort=estimate   # By time estimate
```

## Integration with Tasks

The command checks:
- Task completion in tasks.md files
- TODO markers in code
- Test coverage reports
- Git commit history

## Quick Actions

From the status report, you can:
1. **Continue** incomplete tasks
2. **Review** completed specifications
3. **Update** progress markers
4. **Identify** blockers

## File Structure Scanned

```
specs/
├── 001-export-functionality/
│   ├── spec.md ✓
│   ├── plan.md ✓
│   └── tasks.md ✓
├── 002-layer-management/
│   ├── spec.md ✓
│   └── plan.md ⏳
└── .../
```

## Related Commands

- `/specify` - Create new specification
- `/spec-workflow` - Complete workflow
- `/spec-tasks` - View specific tasks
- `/review-plan` - Review implementation plan

## Quick Start

```
/spec-status
```

I'll scan all specifications and show you the current implementation status!