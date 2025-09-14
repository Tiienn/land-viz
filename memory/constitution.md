# Land Visualizer Development Constitution

## Core Principles

### Article 1: Inline Styles Only
All styling must use inline styles. No CSS files or className props are allowed. This is a non-negotiable architectural decision to avoid CSS compilation issues.

### Article 2: TypeScript Strict Mode
Maintain full TypeScript coverage with strict configuration. All code must be properly typed with no `any` types unless absolutely necessary.

### Article 3: State Management
Use Zustand store (`useAppStore`) for all application state. No local component state for shared data.

### Article 4: React Best Practices
- Functional components with hooks only
- Proper error boundaries for all major sections
- Performance optimization through React.memo and useMemo where appropriate
- No class components

### Article 5: 3D Rendering Standards
- Three.js + React Three Fiber for all 3D visualization
- Target 60 FPS performance on desktop
- Efficient re-rendering with proper scene optimization
- Custom camera controls (right-orbit, middle-pan)

### Article 6: Testing Requirements
- Vitest for unit tests
- React Testing Library for component testing
- Minimum 70% test coverage for new features
- All critical paths must have tests

### Article 7: Security First
- Maintain comprehensive security headers in index.html
- Environment-based logging (no console logs in production)
- No sensitive data exposure
- Client-side only architecture

### Article 8: Development Practices
- Prefer editing existing files over creating new ones
- Never proactively create documentation unless requested
- Kill node processes if hot reload fails: `taskkill /f /im node.exe`
- Only run one dev server at a time (port 5173)

### Article 9: Professional UX
- Maintain Canva-inspired design with professional CAD functionality
- Nunito Sans typography
- Smooth 200ms transitions
- 8-12px border radius for UI elements
- Modern gradient buttons with hover effects

### Article 10: Code Organization
- Components in `src/components/`
- Services in `src/services/`
- Types in `src/types/`
- Utils in `src/utils/`
- Store in `src/store/`

## Governance

These principles are considered fundamental to the project and should not be violated. Any changes to these principles require:

1. Clear justification
2. Team consensus
3. Documentation update
4. Migration plan for existing code

## Compliance

All code reviews should verify compliance with these principles. Non-compliant code should be rejected or refactored before merging.