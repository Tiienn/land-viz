# /speckit.clarify - Clarify Underspecified Areas

Clarify ambiguous, incomplete, or underspecified areas in your specification before planning.

## Usage

```
/speckit.clarify [spec-file]
/speckit.clarify [feature-name]
```

**When to use:** After `/speckit.specify`, before `/speckit.plan`

## What This Command Does

Identifies and resolves specification gaps by:

1. **Scanning for ambiguities** marked with `AMBIGUITY:` tags
2. **Detecting vague requirements** that need detail
3. **Identifying missing information** (edge cases, constraints)
4. **Asking targeted questions** to fill gaps
5. **Updating specification** with clarifications
6. **Verifying completeness** before planning

## Why Clarification Matters

**Without clarification:**
- Implementation plans make wrong assumptions
- Tasks miss critical edge cases
- Rework required after implementation
- Features don't meet user needs

**With clarification:**
- ✅ Clear requirements before coding
- ✅ Fewer surprises during implementation
- ✅ Better time estimates
- ✅ Higher quality features

## Clarification Process

### Phase 1: Scan Specification
```
Reading: specs/001-export-functionality/spec.md

Found issues:
⚠️ 3 marked ambiguities
⚠️ 2 vague requirements
⚠️ 4 missing edge cases
⚠️ 1 undefined constraint

Total: 10 items need clarification
```

### Phase 2: Ask Questions
```
AMBIGUITY #1: "User can export data"
Questions:
1. Which export formats? (Excel, CSV, PDF, DXF?)
2. What data fields are included?
3. Can user customize what to export?
4. What's the maximum data size supported?
5. Should export be synchronous or async?

> [User provides answers]
```

### Phase 3: Update Specification
```
Updating spec.md...

Before:
> User can export data

After:
> User can export land measurements in multiple formats:
> - Excel (.xlsx) - all shape data + measurements
> - CSV (.csv) - tabular data for spreadsheets
> - DXF (.dxf) - CAD format for AutoCAD import
>
> Export includes:
> - Shape coordinates
> - Area calculations
> - Layer information
> - Timestamps
>
> Constraints:
> - Maximum 10,000 shapes per export
> - Async export for > 1,000 shapes
> - Progress indicator for large exports
```

### Phase 4: Verify Completeness
```
✅ All ambiguities resolved
✅ Requirements specific and measurable
✅ Edge cases documented
✅ Constraints defined
✅ Ready for planning

Specification completeness: 95%
```

## Common Ambiguities to Clarify

### Functional Requirements
- **Vague:** "User can manage layers"
- **Clear:** "User can create, rename, delete, reorder, show/hide, and lock/unlock layers via sidebar panel"

### User Interface
- **Vague:** "Nice modal dialog"
- **Clear:** "Modal with title, close button, form fields, Cancel/Submit buttons, 400px width, centered on screen"

### Performance
- **Vague:** "Should be fast"
- **Clear:** "Render 1,000 shapes at 60 FPS on desktop, 30 FPS on mobile, max 500ms initial load"

### Error Handling
- **Vague:** "Handle errors gracefully"
- **Clear:** "Show toast notification for network errors, inline validation for form errors, error boundary for crashes"

### Data Constraints
- **Vague:** "Support reasonable file sizes"
- **Clear:** "Max file size: 10MB, max shapes: 10,000, timeout after 30s, show progress for > 1,000 shapes"

## Question Categories

### 1. Scope Questions
- What's included in MVP vs future phases?
- What features are explicitly out of scope?
- What are the must-haves vs nice-to-haves?

### 2. User Experience Questions
- How do users discover this feature?
- What's the expected workflow?
- What happens on errors?
- What feedback does user get?

### 3. Technical Questions
- What are the performance requirements?
- What browsers/devices must we support?
- What are the data size limits?
- What are the security requirements?

### 4. Edge Case Questions
- What happens with zero items?
- What happens with maximum items?
- What happens with invalid data?
- What happens offline?

### 5. Integration Questions
- How does this interact with existing features?
- What data does this share with other components?
- What happens to existing data?
- Are there migration requirements?

## Example Usage

```
/speckit.clarify export-functionality

> Analyzing specification...
> Found 10 items needing clarification
>
> === Question 1/10 ===
> Context: "User can export to multiple formats"
>
> Please clarify:
> 1. Which specific formats should be supported?
>    - Excel (.xlsx)
>    - CSV (.csv)
>    - DXF (.dxf)
>    - PDF (.pdf)
>    - Other?
>
> User: Excel, CSV, and DXF
>
> Follow-up: Should format selection be:
> a) Dropdown in export dialog
> b) Separate button for each format
> c) Multi-select checkboxes
>
> User: Dropdown in export dialog
>
> ✅ Clarification recorded
>
> [Continues through all 10 questions...]
>
> === Clarification Complete ===
> Updated: specs/001-export-functionality/spec.md
> Completeness: 95% → 98%
> Ready for: /speckit.plan
```

## Integration with Workflow

```
/speckit.specify export → Creates spec.md with ambiguities
/speckit.clarify export → Resolves all ambiguities
/speckit.plan export    → Creates detailed plan
/speckit.tasks export   → Breaks down into tasks
/speckit.implement export → Builds the feature
```

## Output Format

Updated specification includes:

```markdown
## Clarifications (Added: Jan 12, 2025)

### Export Formats
**Question:** Which formats should be supported?
**Answer:** Excel (.xlsx), CSV (.csv), and DXF (.dxf)
**Rationale:** Excel for analysis, CSV for compatibility, DXF for CAD integration

### Format Selection UI
**Question:** How should user choose format?
**Answer:** Dropdown in export dialog with format icons
**Rationale:** Clean UI, familiar pattern, easy to extend

### Performance Requirements
**Question:** What's acceptable export time?
**Answer:** < 1s for 100 shapes, < 10s for 1,000 shapes, async with progress for more
**Rationale:** Keeps UI responsive, user knows what's happening

[... all clarifications documented ...]
```

## Related Commands

- `/speckit.specify` - Create initial specification
- `/speckit.plan` - Create plan after clarification
- `/speckit.checklist` - Validate completeness
- `/speckit.analyze` - Cross-check consistency

## Tips for Effective Clarification

1. **Mark ambiguities as you write specs** using `AMBIGUITY:` tags
2. **Be specific** - vague answers lead to vague implementations
3. **Document rationale** - explains why decisions were made
4. **Consider edge cases** - they always come up during implementation
5. **Update estimates** - clarifications may change scope

## Quick Start

```
/speckit.clarify [feature-name]
```

Resolve all ambiguities before planning to save time and reduce rework!
