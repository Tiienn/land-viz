# /speckit.analyze - Cross-Artifact Consistency Analysis

Analyze specifications, plans, and tasks for consistency, coverage, and quality issues.

## Usage

```
/speckit.analyze [feature-name]
/speckit.analyze [spec-directory]
```

**When to use:** After `/speckit.tasks`, before `/speckit.implement`

## What This Command Does

Performs comprehensive analysis across all spec artifacts:

1. **Consistency checks** - Do spec, plan, and tasks align?
2. **Coverage analysis** - Are all requirements addressed?
3. **Dependency validation** - Are dependencies complete?
4. **Risk assessment** - What could go wrong?
5. **Quality scoring** - How complete is the specification?
6. **Constitution compliance** - Does plan follow all articles?

## Why Analysis Matters

**Without analysis:**
- Plan doesn't match specification
- Tasks miss key requirements
- Dependencies discovered during coding
- Implementation fails quality checks

**With analysis:**
- ✅ All artifacts aligned
- ✅ 100% requirement coverage
- ✅ Dependencies identified upfront
- ✅ High confidence before coding

## Analysis Process

### Phase 1: Load Artifacts
```
Loading specification artifacts...
✓ specs/001-export-functionality/spec.md (12 requirements)
✓ specs/001-export-functionality/plan.md (6 phases)
✓ specs/001-export-functionality/tasks.md (24 tasks)

Scanning dependencies...
✓ memory/constitution.md
✓ app/src/store/useAppStore.ts
✓ app/package.json
```

### Phase 2: Consistency Analysis
```
Checking cross-artifact consistency...

Requirement → Plan Mapping:
✅ REQ-1: Export to Excel → Phase 2, Tasks 2.1-2.4
✅ REQ-2: Export to CSV → Phase 3, Tasks 3.1-3.2
✅ REQ-3: Export to DXF → Phase 4, Tasks 4.1-4.3
⚠️ REQ-4: Progress indicator → Not found in plan
❌ REQ-5: Error handling → Missing from tasks

Plan → Task Mapping:
✅ Phase 1 → Tasks 1.1-1.4 (complete)
✅ Phase 2 → Tasks 2.1-2.4 (complete)
⚠️ Phase 3 → Tasks 3.1-3.2 (missing edge cases)
❌ Phase 4 → No tasks defined

Issues found: 4
```

### Phase 3: Coverage Analysis
```
Requirement Coverage:

Functional Requirements: 10/12 (83%)
  ✅ Export formats
  ✅ Data selection
  ✅ File naming
  ⚠️ Progress indicator (mentioned but not detailed)
  ❌ Batch export (missing)
  ❌ Export history (missing)

Non-Functional Requirements: 3/5 (60%)
  ✅ Performance targets
  ✅ Browser support
  ⚠️ Accessibility (partial)
  ❌ Mobile support (not addressed)
  ❌ Offline capability (not addressed)

Edge Cases: 6/10 (60%)
  ✅ Empty data
  ✅ Large datasets
  ⚠️ Network errors (mentioned, not detailed)
  ❌ Concurrent exports (not considered)
  ❌ File system errors (not addressed)
  [... 5 more edge cases ...]

Coverage Score: 72% (needs improvement)
```

### Phase 4: Dependency Validation
```
Dependency Analysis:

External Dependencies:
  ✅ xlsx (^0.18.5) - in package.json
  ✅ file-saver (^2.0.5) - in package.json
  ❌ dxf-writer - NOT in package.json (required for DXF export)

Internal Dependencies:
  ✅ useAppStore - exists
  ✅ ShapeRenderer - exists
  ⚠️ ExportService - to be created
  ❌ DXFConverter - not in plan

Type Dependencies:
  ⚠️ ExportFormat type - defined in spec but not in types/
  ⚠️ ExportOptions interface - needs creation

Missing dependencies: 3
```

### Phase 5: Risk Assessment
```
Risk Analysis:

High Risk (3):
  🔴 DXF export complexity underestimated
     Impact: Implementation may take 2x longer
     Mitigation: Research DXF format, add buffer time

  🔴 Large dataset performance not tested
     Impact: May not hit 60 FPS target
     Mitigation: Add performance tests before implementation

  🔴 Browser file size limits not considered
     Impact: Large exports may fail
     Mitigation: Add chunked downloads or compression

Medium Risk (5):
  🟡 Error recovery not fully specified
  🟡 Mobile export UX not designed
  🟡 Concurrent export handling unclear
  🟡 File naming conflicts not addressed
  🟡 Export cancellation not mentioned

Low Risk (2):
  🟢 Excel format well-understood
  🟢 CSV export straightforward

Total risks: 10 (3 high, 5 medium, 2 low)
```

### Phase 6: Quality Scoring
```
Overall Quality Score: 74/100

Breakdown:
  Specification Quality: 82/100
    + Clear requirements
    + Good user stories
    - Missing edge cases
    - Some ambiguities remain

  Plan Quality: 68/100
    + Good architecture
    + Phases well-defined
    - Missing risk mitigation
    - Dependencies incomplete

  Task Quality: 72/100
    + Good task breakdown
    + Clear time estimates
    - Missing test tasks
    - Validation criteria vague

  Constitution Compliance: 95/100
    + All articles addressed
    - Minor concerns with Article 6 (testing)

Recommendation: Address gaps before implementation
```

### Phase 7: Constitution Compliance
```
Constitution Compliance Check:

Article 1: Inline Styles Only
  ✅ Plan specifies inline styles for all UI
  Status: COMPLIANT

Article 2: TypeScript Strict Mode
  ✅ All new files will use TypeScript
  ⚠️ Some type definitions missing
  Status: MOSTLY COMPLIANT

Article 3: State Management
  ✅ Uses Zustand store
  ✅ No local state for shared data
  Status: COMPLIANT

Article 4: React Best Practices
  ✅ Functional components
  ✅ Error boundaries planned
  ⚠️ React.memo usage not mentioned
  Status: MOSTLY COMPLIANT

Article 5: 3D Rendering Standards
  ⚠️ Performance impact not fully analyzed
  ⚠️ No frame rate testing planned
  Status: NEEDS REVIEW

Article 6: Testing Requirements
  ❌ Test coverage only 45% planned
  ❌ Missing integration tests
  Status: NON-COMPLIANT (needs 70%)

[... Articles 7-10 ...]

Overall Compliance: 85%
Blockers: Article 6 (testing)
```

## Analysis Report

Final report structure:

```markdown
# Analysis Report: Export Functionality

**Date:** Jan 12, 2025
**Artifacts Analyzed:** spec.md, plan.md, tasks.md
**Overall Score:** 74/100

## Executive Summary
The specification is well-structured with clear requirements, but has
significant gaps in coverage and testing. Recommend addressing 12 issues
before proceeding with implementation.

## Critical Issues (Must Fix)
1. ❌ Missing DXF export dependency
2. ❌ Test coverage below 70% threshold
3. ❌ Performance testing not planned
4. ❌ Mobile support not addressed

## Warnings (Should Fix)
1. ⚠️ Progress indicator not detailed in tasks
2. ⚠️ Error handling incomplete
3. ⚠️ Edge case coverage at 60%
4. ⚠️ Type definitions missing
5. ⚠️ Risk mitigation incomplete

## Recommendations
1. Add missing dependency: dxf-writer
2. Increase test tasks to reach 70% coverage
3. Add performance testing phase
4. Clarify mobile export workflow
5. Detail progress indicator implementation
6. Expand error handling in all tasks
7. Add edge case tests
8. Create type definition file
9. Document risk mitigation strategies

## Gaps in Coverage
- Requirement REQ-4: Progress indicator (not in tasks)
- Requirement REQ-5: Error handling (partially covered)
- Edge case: Concurrent exports (not considered)
- Edge case: File system errors (not addressed)

## Next Steps
1. Run /speckit.clarify to resolve ambiguities
2. Update plan.md with missing dependencies
3. Add test tasks to reach 70% coverage
4. Run /speckit.analyze again to verify
5. Proceed with /speckit.implement when score > 85

**Status:** NOT READY FOR IMPLEMENTATION
```

## Example Usage

```
/speckit.analyze export-functionality

> Analyzing specification artifacts...
>
> Loading:
> ✓ spec.md (12 requirements)
> ✓ plan.md (6 phases)
> ✓ tasks.md (24 tasks)
>
> Running analysis...
> ⏳ Consistency check...
> ⏳ Coverage analysis...
> ⏳ Dependency validation...
> ⏳ Risk assessment...
> ⏳ Quality scoring...
> ⏳ Constitution compliance...
>
> === Analysis Complete ===
>
> Overall Score: 74/100
> Status: NOT READY
>
> Critical Issues: 4
> Warnings: 5
> Recommendations: 9
>
> [Full report generated]
>
> Next Action:
> → Fix 4 critical issues
> → Run analysis again
> → Proceed when score > 85
```

## Integration with Workflow

```mermaid
/speckit.specify  → spec.md
      ↓
/speckit.clarify  → spec.md (updated)
      ↓
/speckit.plan     → plan.md
      ↓
/speckit.tasks    → tasks.md
      ↓
/speckit.analyze  → analysis report
      ↓
[Fix issues]      → update artifacts
      ↓
/speckit.analyze  → verify (score > 85)
      ↓
/speckit.implement → build feature
```

## Analysis Metrics

### Consistency Score
- 100% = All requirements mapped to plan and tasks
- 80-99% = Minor gaps, should fix
- < 80% = Major gaps, must fix

### Coverage Score
- 100% = All requirements, edge cases, and tests covered
- 80-99% = Good coverage, minor gaps
- < 80% = Significant gaps

### Quality Score
- 90-100% = Excellent, ready to implement
- 85-89% = Good, proceed with caution
- 70-84% = Fair, fix issues first
- < 70% = Poor, major rework needed

## Related Commands

- `/speckit.specify` - Create specification
- `/speckit.clarify` - Resolve ambiguities
- `/speckit.plan` - Create implementation plan
- `/speckit.tasks` - Generate task breakdown
- `/speckit.checklist` - Generate quality checklists
- `/speckit.implement` - Execute implementation

## Quick Start

```
/speckit.analyze [feature-name]
```

Verify your specification is complete and consistent before implementation!
