# Contributing to Land Visualizer
**Welcome to the Land Visualizer community! 🎉**  
*Version 1.0 | August 2025*

Thank you for your interest in contributing to Land Visualizer! We're building the future of land visualization together, and every contribution matters - from fixing typos to implementing major features.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, or nationality.

### Expected Behavior

- **Be Respectful**: Value each other's ideas, styles, and viewpoints
- **Be Direct but Professional**: Constructive criticism is welcome
- **Be Inclusive**: Seek diverse perspectives
- **Be Collaborative**: Work together towards common goals
- **Be Patient**: Remember everyone was new once

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that could reasonably be considered inappropriate

**Reporting**: Email conduct@landvisualizer.com or message a maintainer directly.

---

## 🤝 How Can I Contribute?

### 🐛 Report Bugs

Found a bug? Help us fix it!

**Before Submitting:**
1. Check [existing issues](https://github.com/landvisualizer/issues)
2. Verify it's reproducible
3. Collect relevant information

**Bug Report Template:**
```markdown
## Bug Description
Clear and concise description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 116]
- Device: [e.g., iPhone 14]
- Version: [e.g., 1.2.3]

## Screenshots
If applicable, add screenshots

## Additional Context
Any other relevant information
```

### 💡 Suggest Features

Have an idea? We'd love to hear it!

**Feature Request Template:**
```markdown
## Feature Description
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## User Story
As a [type of user], I want [goal] so that [benefit]

## Mockups/Examples
Visual representations if applicable
```

### 🔧 Submit Code

Ready to code? Awesome! Here's what you can work on:

#### Good First Issues
Perfect for newcomers:
- Fix typos in documentation
- Add missing tests
- Improve error messages
- Enhance tooltips
- Add loading states

#### Help Wanted
More challenging tasks:
- Implement new comparison objects
- Optimize performance
- Add accessibility features
- Create new export formats
- Enhance mobile experience

#### Major Features
Coordinate with maintainers first:
- New calculation algorithms
- Chili3D integration enhancements
- Architecture changes
- New service integrations

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
node >= 18.0.0
npm >= 9.0.0
git >= 2.30.0

# Optional but recommended
VS Code with extensions:
- ESLint
- Prettier
- TypeScript
- GitLens
```

### Environment Setup

1. **Fork the Repository**
   ```bash
   # Click 'Fork' on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/land-visualizer.git
   cd land-visualizer
   ```

2. **Set Upstream Remote**
   ```bash
   git remote add upstream https://github.com/landvisualizer/land-visualizer.git
   git fetch upstream
   ```

3. **Install Dependencies**
   ```bash
   npm install
   
   # Install optional tools
   npm install -g commitizen
   npm install -g conventional-changelog-cli
   ```

4. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

5. **Build WASM Modules** (if working on Chili3D)
   ```bash
   npm run wasm:setup
   npm run wasm:build
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

7. **Run Tests**
   ```bash
   npm test
   npm run test:watch  # Watch mode
   ```

---

## 💻 Development Workflow

### Branch Strategy

```
main
  ├── develop
  │     ├── feature/add-soccer-field-comparison
  │     ├── feature/chili3d-integration
  │     └── feature/mobile-gestures
  ├── hotfix/critical-calculation-bug
  └── release/v1.2.0
```

### Workflow Steps

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   ```bash
   # Code your feature
   # Add tests
   # Update documentation
   ```

3. **Commit Often**
   ```bash
   git add .
   git commit -m "feat: add parking space comparison object"
   ```

4. **Stay Updated**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Select `develop` as base branch
   - Fill out PR template

---

## 📝 Code Standards

### TypeScript/JavaScript

```typescript
// ✅ DO: Use descriptive names
const calculatePropertyArea = (points: Point[]): number => {
  // Implementation
};

// ❌ DON'T: Use single letters
const calc = (p) => { };

// ✅ DO: Handle errors gracefully
try {
  const result = await precisionCalculator.calculate(shape);
  return result;
} catch (error) {
  logger.error('Calculation failed:', error);
  return fallbackCalculation(shape);
}

// ❌ DON'T: Ignore errors
const result = await precisionCalculator.calculate(shape);

// ✅ DO: Use TypeScript strictly
interface CalculationOptions {
  precision: 'standard' | 'professional';
  unit: UnitType;
}

// ❌ DON'T: Use 'any' type
const options: any = {};
```

### React Components

```tsx
// ✅ DO: Functional components with hooks
const ShapeDrawer: React.FC<ShapeDrawerProps> = ({ onComplete }) => {
  const [points, setPoints] = useState<Point[]>([]);
  
  return (
    <Canvas>
      {/* Component JSX */}
    </Canvas>
  );
};

// ❌ DON'T: Class components (unless necessary)
class ShapeDrawer extends React.Component { }

// ✅ DO: Proper prop types
interface ShapeDrawerProps {
  onComplete: (shape: Shape) => void;
  options?: DrawingOptions;
}

// ✅ DO: Memoize expensive computations
const expensiveArea = useMemo(
  () => calculateComplexArea(points),
  [points]
);
```

### CSS/Styling

```scss
// ✅ DO: Use CSS modules or styled-components
.shape-drawer {
  &__canvas {
    width: 100%;
    height: 100%;
  }
  
  &--active {
    border: 2px solid $accent-color;
  }
}

// ❌ DON'T: Use inline styles (except for dynamic values)
<div style={{ color: 'red' }}>

// ✅ DO: Use CSS variables for theming
:root {
  --color-primary: #ff4444;
  --spacing-unit: 8px;
}
```

### File Organization

```
// ✅ DO: One component per file
src/
  components/
    ShapeDrawer/
      ShapeDrawer.tsx
      ShapeDrawer.test.tsx
      ShapeDrawer.module.scss
      index.ts

// ❌ DON'T: Multiple components in one file
src/
  components/
    AllComponents.tsx  // Contains 10 components
```

### Performance Guidelines

```typescript
// ✅ DO: Lazy load heavy components
const Chili3DPanel = lazy(() => import('./Chili3DPanel'));

// ✅ DO: Debounce expensive operations
const debouncedCalculate = useMemo(
  () => debounce(calculate, 300),
  []
);

// ✅ DO: Use React.memo for pure components
const ComparisonObject = React.memo(({ object }) => {
  return <mesh>{/* 3D object */}</mesh>;
});

// ✅ DO: Optimize re-renders
const handleClick = useCallback((e) => {
  // Handle click
}, [dependencies]);
```

---

## 💬 Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add subdivision tool` |
| `fix` | Bug fix | `fix: resolve mobile rotation crash` |
| `docs` | Documentation | `docs: update API examples` |
| `style` | Formatting, no code change | `style: format with prettier` |
| `refactor` | Code restructuring | `refactor: extract calculation service` |
| `perf` | Performance improvement | `perf: optimize shape rendering` |
| `test` | Adding tests | `test: add area calculation tests` |
| `chore` | Maintenance | `chore: update dependencies` |
| `build` | Build system | `build: configure WASM compilation` |
| `ci` | CI/CD changes | `ci: add performance check` |

### Examples

```bash
# Feature
git commit -m "feat(drawing): add polygon validation"

# Bug fix
git commit -m "fix(mobile): prevent rotation crash on iOS"

# Breaking change
git commit -m "feat(api)!: change area calculation endpoint

BREAKING CHANGE: The /calculate endpoint now requires precision parameter"

# Multi-line with details
git commit -m "perf(rendering): optimize Three.js scene updates

- Implement frustum culling for off-screen objects
- Use instanced rendering for comparison objects  
- Reduce draw calls by 60%

Closes #234"
```

### Commit Hooks

We use Husky for automated checks:

```json
// .husky/pre-commit
- ESLint validation
- Prettier formatting
- TypeScript compilation
- Unit tests for changed files

// .husky/commit-msg
- Conventional commit format validation
```

---

## 🔄 Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ fierce] Tests pass locally (`npm test`)
- [ ] Documentation updated
- [ ] Commits follow convention
- [ ] Branch is up-to-date with `develop`
- [ ] No console.log statements
- [ ] Performance impact considered
- [ ] Accessibility checked

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List specific changes
- Include relevant details
- Reference related issues

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
Before/After if applicable

## Performance Impact
- Bundle size change: +X KB
- Load time impact: None/+Xms
- FPS impact: None/Improved/-X

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No warnings generated
- [ ] Dependent changes merged

## Related Issues
Fixes #123
Relates to #456
```

### Review Process

1. **Automated Checks** (5 minutes)
   - CI/CD pipeline runs
   - Tests execute
   - Coverage reported
   - Performance checked

2. **Code Review** (24-48 hours)
   - At least 1 approval required
   - 2 approvals for breaking changes
   - Address all feedback

3. **Final Checks**
   - Squash commits if needed
   - Update branch
   - Verify all checks pass

4. **Merge**
   - Maintainer merges to `develop`
   - Auto-deploy to staging

### Review Guidelines for Reviewers

```typescript
// When reviewing, look for:

// 1. Logic and functionality
- Does it solve the problem?
- Are edge cases handled?
- Is it performant?

// 2. Code quality
- Is it readable?
- Is it maintainable?
- Does it follow patterns?

// 3. Testing
- Are tests comprehensive?
- Do they cover edge cases?
- Are they maintainable?

// 4. Security
- Input validation?
- XSS prevention?
- No sensitive data exposed?

// 5. Accessibility
- Keyboard navigable?
- Screen reader friendly?
- WCAG compliant?
```

---

## 🧪 Testing Requirements

### Test Coverage Goals

| Type | Required | Current |
|------|----------|---------|
| Unit Tests | 80% | 45% |
| Integration | 60% | 20% |
| E2E Critical Paths | 100% | 30% |

### Writing Tests

```typescript
// Unit Test Example
describe('CalculationService', () => {
  let service: CalculationService;
  
  beforeEach(() => {
    service = new CalculationService();
  });
  
  describe('calculateArea', () => {
    it('should calculate square area correctly', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      
      const result = service.calculateArea(square);
      
      expect(result.value).toBe(10000);
      expect(result.unit).toBe('m2');
    });
    
    it('should handle invalid shapes gracefully', () => {
      const invalid = [{ x: 0, y: 0 }];
      
      expect(() => service.calculateArea(invalid))
        .toThrow('Insufficient points');
    });
  });
});

// Component Test Example
describe('ShapeDrawer', () => {
  it('should complete shape after minimum points', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <ShapeDrawer onComplete={onComplete} />
    );
    
    const canvas = getByTestId('drawing-canvas');
    
    // Add minimum points
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    fireEvent.click(canvas, { clientX: 200, clientY: 100 });
    fireEvent.click(canvas, { clientX: 150, clientY: 200 });
    
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        points: expect.arrayHaving(3),
        closed: true
      })
    );
  });
});
```

### Test Files Location

```
src/
  components/
    ShapeDrawer/
      ShapeDrawer.tsx
      ShapeDrawer.test.tsx  // Component tests here
  services/
    calculations.ts
    calculations.test.ts    // Service tests here
tests/
  e2e/                     // Cypress E2E tests
  integration/             // Integration tests
  fixtures/                // Test data
```

---

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Calculate the area of a polygon using the shoelace formula
 * @param points - Array of points forming the polygon
 * @param options - Calculation options
 * @returns Calculated area with metadata
 * @throws {InvalidShapeError} If polygon is invalid
 * @example
 * const area = calculateArea([
 *   { x: 0, y: 0 },
 *   { x: 100, y: 0 },
 *   { x: 100, y: 100 },
 *   { x: 0, y: 100 }
 * ]);
 */
export function calculateArea(
  points: Point[],
  options?: CalculationOptions
): CalculationResult {
  // Implementation
}
```

### README Updates

When adding features, update relevant sections:
- Features list
- Usage examples
- API documentation
- Configuration options

### Inline Comments

```typescript
// ✅ DO: Explain WHY, not WHAT
// Use shoelace formula for better precision with irregular polygons
const area = calculateShoelace(points);

// ❌ DON'T: State the obvious
// Set area to calculated value
const area = calculated;

// ✅ DO: Document complex algorithms
// Ramer-Douglas-Peucker algorithm for polygon simplification
// This reduces points while maintaining shape accuracy within epsilon
const simplified = douglasPeucker(points, epsilon);
```

---

## 👥 Community

### Communication Channels

- **Discord**: [Join our server](https://discord.gg/landviz)
- **GitHub Discussions**: Questions and ideas
- **Twitter**: [@landvisualizer](https://twitter.com/landvisualizer)
- **Email**: dev@landvisualizer.com

### Getting Help

1. **Documentation**: Check docs first
2. **Discord #help**: Quick questions
3. **GitHub Discussions**: Detailed questions
4. **Stack Overflow**: Tag `land-visualizer`

### Recognition

We value all contributions! Contributors are:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Given Discord roles
- Invited to contributor calls

### Core Team

| Name | Role | GitHub | Focus Area |
|------|------|--------|------------|
| Sarah Chen | Frontend Lead | @sarahchen | UI/UX, React |
| Alex Rodriguez | Backend Lead | @alexrod | Chili3D, WASM |
| Mike Thompson | 3D Graphics | @mikethompson | Three.js |
| Jennifer Park | UX Design | @jenpark | Design System |
| Tom Wilson | DevOps | @tomwilson | CI/CD, Deploy |

---

## 🎯 Current Priorities

### High Priority Issues

1. **Mobile Performance** (#001)
   - Fix rotation crash
   - Optimize rendering
   - Improve touch handling

2. **Chili3D Integration** (#045)
   - Complete precision calculator
   - Add boolean operations
   - Implement CAD export

3. **Accessibility** (#078)
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

### Good First Issues

- [ ] Add hectare unit conversion (#102)
- [ ] Improve error messages (#103)
- [ ] Add loading animations (#104)
- [ ] Fix typos in documentation (#105)
- [ ] Add tooltip to tools (#106)

---

## 📋 Resources

### Development Resources
- [Architecture Overview](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Testing Guide](TESTING.md)
- [Design Principles](design-principles.md)

### External Resources
- [React Documentation](https://react.dev)
- [Three.js Documentation](https://threejs.org/docs)
- [Chili3D Documentation](https://chili3d.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Learning Materials
- [Three.js Journey](https://threejs-journey.com/) - 3D graphics
- [Testing Library](https://testing-library.com/) - Testing React
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit format

---

## 🙏 Thank You!

Every contribution makes Land Visualizer better. Whether you're fixing a typo, adding a test, implementing a feature, or sharing ideas - you're helping make land visualization accessible to everyone.

**Welcome to the team! Let's build something amazing together. 🚀**

---

*Last Updated: August 27, 2025*  
*Maintainer: @landvisualizer/core-team*