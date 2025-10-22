# /speckit.constitution - Project Constitution Management

Create, update, or view the Land Visualizer project constitution and governing principles.

## Usage

```
/speckit.constitution                    # View current constitution
/speckit.constitution update [article]   # Update specific article
/speckit.constitution review             # Review compliance
```

## What This Command Does

Manages the project's foundational principles and development guidelines that govern all implementation decisions.

### View Constitution
- Displays all 10 articles
- Shows compliance status
- Lists recent updates

### Update Constitution
- Propose changes to existing articles
- Add new articles if justified
- Document rationale for changes
- Ensure team consensus

### Review Compliance
- Check recent code against constitution
- Identify violations
- Suggest remediation

## Current Constitution Location

```
memory/constitution.md
```

## The 10 Articles

### Article 1: Inline Styles Only
All styling must use inline styles. No CSS files or className props allowed.

### Article 2: TypeScript Strict Mode
Full TypeScript coverage with strict configuration. No `any` types unless necessary.

### Article 3: State Management
Use Zustand store for all application state. No local component state for shared data.

### Article 4: React Best Practices
- Functional components with hooks
- Error boundaries for major sections
- Performance optimization with React.memo and useMemo
- No class components

### Article 5: 3D Rendering Standards
- Three.js + React Three Fiber
- 60 FPS target on desktop
- Efficient scene optimization
- Custom camera controls

### Article 6: Testing Requirements
- Vitest for unit tests
- React Testing Library for components
- Minimum 70% coverage
- All critical paths tested

### Article 7: Security First
- Comprehensive security headers
- Environment-based logging
- No sensitive data exposure
- Client-side only architecture

### Article 8: Development Practices
- Prefer editing existing files
- Never create docs proactively
- Kill node processes if needed
- One dev server at a time

### Article 9: Professional UX
- Canva-inspired design
- Nunito Sans typography
- 200ms transitions
- 8-12px border radius
- Modern gradient buttons

### Article 10: Code Organization
- Components in `src/components/`
- Services in `src/services/`
- Types in `src/types/`
- Utils in `src/utils/`
- Store in `src/store/`

## Governance Process

Changes to the constitution require:

1. **Clear Justification**
   - Why is the change necessary?
   - What problem does it solve?
   - What are the alternatives?

2. **Team Consensus**
   - All developers agree
   - No blocking concerns
   - Benefits outweigh costs

3. **Documentation Update**
   - Update constitution.md
   - Update CLAUDE.md if needed
   - Add migration notes

4. **Migration Plan**
   - How to update existing code
   - Timeline for compliance
   - Automated tooling if possible

## Compliance Verification

All code reviews should verify:

- ✅ Inline styles used (Article 1)
- ✅ TypeScript strict mode (Article 2)
- ✅ Zustand for state (Article 3)
- ✅ React best practices (Article 4)
- ✅ 60 FPS performance (Article 5)
- ✅ 70% test coverage (Article 6)
- ✅ Security headers present (Article 7)
- ✅ Existing files edited (Article 8)
- ✅ Professional UX (Article 9)
- ✅ Proper file organization (Article 10)

## Example Usage

```
/speckit.constitution

> Displaying Land Visualizer Constitution
> [Shows all 10 articles]
> Last updated: January 2025
> Compliance rate: 98%

/speckit.constitution update Article 6

> Current: Minimum 70% test coverage
> Proposed change? [User provides update]
> Justification? [User explains why]
> [Initiates governance process]

/speckit.constitution review

> Reviewing recent commits...
> ✅ All commits comply with constitution
> ⚠️ Warning: PR #123 has inline style violations
> 🔴 Blocker: Feature XYZ missing tests (Article 6)
```

## When to Update

Update the constitution when:

- New architectural patterns emerge
- Team practices evolve
- Technical constraints change
- Industry standards shift
- Project scope expands

Do NOT update for:

- Individual feature preferences
- Temporary workarounds
- One-off exceptions
- Personal coding styles

## Related Commands

- `/speckit.specify` - Create specifications (must comply)
- `/speckit.plan` - Create plans (must comply)
- `/speckit.implement` - Implement features (must comply)
- `/speckit.checklist` - Validate compliance

## Quick Start

```
/speckit.constitution
```

View the current project constitution and ensure all development follows these foundational principles!
