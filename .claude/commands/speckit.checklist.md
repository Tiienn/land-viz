# /speckit.checklist - Generate Quality Validation Checklists

Generate custom quality checklists that validate requirements completeness, clarity, and consistency.

## Usage

```
/speckit.checklist [feature-name]
/speckit.checklist [spec-directory]
/speckit.checklist [checklist-type]
```

**Think of it as:** "Unit tests for English" - systematic validation of specifications

## What This Command Does

Creates comprehensive checklists to validate:

1. **Requirements quality** - Clear, testable, complete
2. **Specification completeness** - Nothing missing
3. **Consistency across artifacts** - Spec, plan, tasks align
4. **Constitution compliance** - All 10 articles followed
5. **Implementation readiness** - Ready to code

## Checklist Types

### 1. Specification Quality Checklist
Validates the specification document itself:

```markdown
## Specification Quality Checklist

### Clarity
- [ ] Each requirement uses clear, unambiguous language
- [ ] No vague terms like "fast", "user-friendly", "nice"
- [ ] Technical terms are defined
- [ ] Acronyms are explained on first use
- [ ] Examples provided for complex requirements

### Completeness
- [ ] All user stories have acceptance criteria
- [ ] All functional requirements identified
- [ ] Non-functional requirements specified
- [ ] Edge cases documented
- [ ] Error scenarios defined
- [ ] Success criteria measurable

### Consistency
- [ ] No conflicting requirements
- [ ] Terminology used consistently
- [ ] References are accurate
- [ ] Numbering/versioning correct

### Testability
- [ ] Each requirement is verifiable
- [ ] Acceptance criteria are specific
- [ ] Success can be measured
- [ ] Failure can be detected

### Traceability
- [ ] Requirements linked to user stories
- [ ] Dependencies identified
- [ ] Assumptions documented
- [ ] Constraints specified

Score: __/25
```

### 2. Implementation Plan Checklist
Validates the technical plan:

```markdown
## Implementation Plan Checklist

### Architecture
- [ ] Technical approach clearly described
- [ ] Components and their responsibilities defined
- [ ] Data flow documented
- [ ] Integration points identified
- [ ] Performance targets specified

### Dependencies
- [ ] External packages listed with versions
- [ ] Internal dependencies identified
- [ ] API contracts defined
- [ ] Database schema specified
- [ ] Asset requirements documented

### Phases
- [ ] Implementation broken into logical phases
- [ ] Each phase has clear deliverables
- [ ] Dependencies between phases identified
- [ ] Phase order is optimal
- [ ] Time estimates provided

### Testing Strategy
- [ ] Unit test approach defined
- [ ] Integration test strategy specified
- [ ] Performance test plan included
- [ ] Accessibility testing addressed
- [ ] Coverage targets set (≥70%)

### Risk Management
- [ ] Technical risks identified
- [ ] Mitigation strategies defined
- [ ] Fallback plans documented
- [ ] Blockers identified
- [ ] Contingency time allocated

### Constitution Compliance
- [ ] Article 1: Inline styles only ✓
- [ ] Article 2: TypeScript strict ✓
- [ ] Article 3: Zustand state ✓
- [ ] Article 4: React best practices ✓
- [ ] Article 5: 60 FPS target ✓
- [ ] Article 6: 70% test coverage ✓
- [ ] Article 7: Security first ✓
- [ ] Article 8: Edit existing files ✓
- [ ] Article 9: Professional UX ✓
- [ ] Article 10: Proper organization ✓

Score: __/35
```

### 3. Task Breakdown Checklist
Validates the task list:

```markdown
## Task Breakdown Checklist

### Task Quality
- [ ] Each task is atomic (30-120 min)
- [ ] Tasks have clear success criteria
- [ ] Code examples provided
- [ ] Files to modify identified
- [ ] Time estimates realistic

### Coverage
- [ ] All requirements have corresponding tasks
- [ ] All plan phases have tasks
- [ ] Foundation tasks included
- [ ] Testing tasks for each component
- [ ] Polish tasks included

### Dependencies
- [ ] Task order respects dependencies
- [ ] Blocking tasks identified
- [ ] Parallel tasks noted
- [ ] Prerequisites clear

### Testing
- [ ] Unit test tasks for all logic
- [ ] Component test tasks for all UI
- [ ] Integration test tasks for workflows
- [ ] Coverage target achievable (≥70%)

### Validation
- [ ] Each task has validation criteria
- [ ] Manual testing steps provided
- [ ] Automated test commands listed
- [ ] Rollback plan if task fails

Score: __/25
```

### 4. Implementation Readiness Checklist
Final check before coding:

```markdown
## Implementation Readiness Checklist

### Documentation
- [ ] Specification complete and approved
- [ ] Implementation plan reviewed
- [ ] Task breakdown validated
- [ ] All ambiguities resolved
- [ ] /speckit.analyze score > 85

### Environment
- [ ] Development environment set up
- [ ] All dependencies installed
- [ ] Build process working
- [ ] Tests running
- [ ] Git branch created

### Team Alignment
- [ ] Requirements understood
- [ ] Technical approach agreed
- [ ] Time estimates accepted
- [ ] Risks acknowledged
- [ ] Blockers resolved

### Quality Gates
- [ ] Constitution compliance verified
- [ ] Code review process defined
- [ ] Testing strategy approved
- [ ] Deployment plan ready
- [ ] Rollback plan documented

### Artifacts
- [ ] spec.md exists and complete
- [ ] plan.md exists and reviewed
- [ ] tasks.md exists and detailed
- [ ] constitution.md compliance verified
- [ ] Templates/examples ready

Score: __/25

Status: [ ] READY TO IMPLEMENT
```

### 5. Constitution Compliance Checklist
Project-wide governance validation:

```markdown
## Constitution Compliance Checklist

### Article 1: Inline Styles Only
- [ ] No CSS files in plan
- [ ] No className props mentioned
- [ ] All styling uses inline objects
- [ ] Style constants defined in components

### Article 2: TypeScript Strict Mode
- [ ] All new files use .ts/.tsx extension
- [ ] No 'any' types without justification
- [ ] Type definitions for all interfaces
- [ ] tsconfig.json strict mode enabled

### Article 3: State Management
- [ ] Uses Zustand useAppStore
- [ ] No Redux or other state libs
- [ ] No local state for shared data
- [ ] Store updates follow patterns

### Article 4: React Best Practices
- [ ] Functional components only
- [ ] Error boundaries planned
- [ ] React.memo for performance
- [ ] useMemo/useCallback where needed
- [ ] No class components

### Article 5: 3D Rendering Standards
- [ ] Uses Three.js + React Three Fiber
- [ ] 60 FPS target specified
- [ ] Performance testing planned
- [ ] Scene optimization strategy
- [ ] Custom camera controls maintained

### Article 6: Testing Requirements
- [ ] Vitest for unit tests
- [ ] React Testing Library for components
- [ ] 70% minimum coverage target
- [ ] Critical paths have tests
- [ ] Test tasks in breakdown

### Article 7: Security First
- [ ] Security headers maintained
- [ ] No console.log in production
- [ ] No sensitive data exposed
- [ ] Client-side only architecture
- [ ] Environment-based logging

### Article 8: Development Practices
- [ ] Prefer editing existing files
- [ ] No proactive documentation
- [ ] Development process documented
- [ ] Hot reload handling noted

### Article 9: Professional UX
- [ ] Canva-inspired design
- [ ] Nunito Sans typography
- [ ] 200ms transitions
- [ ] 8-12px border radius
- [ ] Gradient buttons with hover

### Article 10: Code Organization
- [ ] Components in src/components/
- [ ] Services in src/services/
- [ ] Types in src/types/
- [ ] Utils in src/utils/
- [ ] Store in src/store/

Score: __/50 (must be 50/50 to proceed)
```

## Example Usage

```
/speckit.checklist export-functionality

> Generating quality checklists...
> Feature: Export Functionality
>
> Creating 5 checklists:
> ✓ Specification Quality Checklist
> ✓ Implementation Plan Checklist
> ✓ Task Breakdown Checklist
> ✓ Implementation Readiness Checklist
> ✓ Constitution Compliance Checklist
>
> Saved to: specs/001-export-functionality/checklists.md
>
> === Auto-Validation Results ===
>
> Specification Quality: 22/25 (88%)
>   ✓ Clarity: Excellent
>   ⚠ Completeness: 2 edge cases missing
>   ✓ Consistency: Good
>   ✓ Testability: Good
>
> Implementation Plan: 32/35 (91%)
>   ✓ Architecture: Well-defined
>   ⚠ Dependencies: 1 missing (dxf-writer)
>   ✓ Phases: Clear
>   ⚠ Testing: Coverage at 65% (need 70%)
>
> Task Breakdown: 23/25 (92%)
>   ✓ Task Quality: Excellent
>   ✓ Coverage: Complete
>   ⚠ Testing: Missing 2 test tasks
>
> Implementation Readiness: 21/25 (84%)
>   ✓ Documentation: Complete
>   ⚠ Environment: Dependencies not installed
>   ✓ Team Alignment: Ready
>   ⚠ Quality Gates: Testing below threshold
>
> Constitution Compliance: 48/50 (96%)
>   ✓ Articles 1-5: Compliant
>   ⚠ Article 6: Test coverage gap
>   ✓ Articles 7-10: Compliant
>
> Overall: 146/160 (91%)
> Status: ALMOST READY
> Action Required: Fix 4 items
```

## Checklist Generation Options

### Generate All Checklists
```
/speckit.checklist export-functionality
```
Creates all 5 checklists for the feature

### Generate Specific Checklist
```
/speckit.checklist export-functionality --type=specification
/speckit.checklist export-functionality --type=plan
/speckit.checklist export-functionality --type=tasks
/speckit.checklist export-functionality --type=readiness
/speckit.checklist export-functionality --type=constitution
```

### Auto-Validate
```
/speckit.checklist export-functionality --validate
```
Automatically checks items that can be verified programmatically

## Integration with Workflow

```
/speckit.specify    → Create spec
/speckit.clarify    → Resolve ambiguities
/speckit.plan       → Create plan
/speckit.tasks      → Create tasks
/speckit.checklist  → Generate validation checklists
/speckit.analyze    → Cross-check everything
[Fix issues identified]
/speckit.checklist  → Verify fixes (--validate)
/speckit.implement  → Build feature
```

## Auto-Validation

The command can automatically verify:

✅ **Can Auto-Check:**
- File existence (spec.md, plan.md, tasks.md)
- Constitution.md compliance verification
- TypeScript strict mode enabled
- Inline styles in code (no CSS files)
- Zustand usage (grep for useAppStore)
- Test file existence
- Package.json dependencies
- Git branch existence

❌ **Requires Manual Review:**
- Requirements clarity
- User story quality
- Architecture soundness
- Time estimate accuracy
- Team consensus
- User experience quality

## Benefits

### "Unit Tests for English"
Just like unit tests catch code bugs, these checklists catch specification bugs:

- Missing requirements
- Ambiguous language
- Incomplete coverage
- Inconsistent terminology
- Untestable criteria

### Early Problem Detection
Catch issues in the specification phase, not during implementation:

- 1 hour to fix spec issue
- 10 hours to fix during implementation
- 100 hours if found in production

### Quality Assurance
Systematic validation ensures:

- Nothing is overlooked
- Standards are maintained
- Team alignment
- Professional output

## Output Format

Generated checklist file:

```markdown
# Quality Validation Checklists
## Export Functionality Feature

**Generated:** Jan 12, 2025
**Spec Version:** 1.0
**Analyst:** Claude

---

## 1. Specification Quality Checklist
[... complete checklist ...]

## 2. Implementation Plan Checklist
[... complete checklist ...]

## 3. Task Breakdown Checklist
[... complete checklist ...]

## 4. Implementation Readiness Checklist
[... complete checklist ...]

## 5. Constitution Compliance Checklist
[... complete checklist ...]

---

## Validation Summary

Total Items: 160
Auto-Verified: 82 (51%)
Manual Review Required: 78 (49%)

Passed: 146/160 (91%)
Failed: 4/160 (3%)
Pending: 10/160 (6%)

Status: ALMOST READY
Next Action: Fix 4 failed items
```

## Related Commands

- `/speckit.specify` - Create specification
- `/speckit.clarify` - Resolve ambiguities
- `/speckit.plan` - Create implementation plan
- `/speckit.tasks` - Generate task breakdown
- `/speckit.analyze` - Cross-artifact analysis
- `/speckit.implement` - Execute implementation

## Quick Start

```
/speckit.checklist [feature-name]
```

Generate comprehensive quality validation checklists for your feature!
