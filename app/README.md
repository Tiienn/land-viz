# Land Visualizer - Application

**Professional 3D Land Visualization Tool**
Built with React 18 + TypeScript + Vite + Three.js + React Three Fiber

## Quick Start

```bash
npm install
npm run dev
```

Application runs on: http://localhost:5173

## Features

### Core Drawing & Editing
- **Professional 3D Scene**: Three.js + React Three Fiber rendering with 2D/3D toggle
- **Drawing Tools**: Rectangle, Circle, Polyline, Line, Measurement
- **Text Tool**: Canva-style inline editing with live formatting, cursor rotation
- **Shape Editing**: Professional resize handles, rotation system, flip (Shift+H/V)
- **Direct Dimension Input**: Pre-sized shapes (e.g., "10x15", "33ft x 50ft")
- **Equal Spacing System**: Professional alignment with magnetic snapping

### Walkthrough Mode
- **First-Person Exploration**: Walk through your land site in 3D
- **WASD Controls**: Move at 1.5 m/s, Sprint (Shift) at 3.0 m/s
- **Physics System**: Realistic jump, gravity, ground collision
- **3D Environment**: Buildings, terrain textures, billboard labels
- **Minimap**: Real-time position tracking (150x150px)
- See `docs/features/WALKTHROUGH_MODE.md`

### AI Boundary Detection
- **Automatic Detection**: Upload site plan images (PNG/JPG/PDF)
- **OpenCV.js Engine**: Computer vision boundary detection
- **Scale Calibration**: Click two points, enter real-world distance
- **Smart Import**: Boundaries become drawable shapes
- See `docs/features/BOUNDARY_DETECTION.md`

### Export & Reports
- **PDF Export**: AutoCAD-style technical drawings with visual preview
- **Multi-page Support**: Automatic pagination for large datasets
- **Scene Capture**: High-resolution snapshots (2x resolution)
- **Ctrl+E** keyboard shortcut

## Project Structure

```
src/
├── components/
│   ├── Scene/           # 3D visualization (ShapeRenderer, WalkthroughCamera, etc.)
│   ├── Text/            # Text editing components
│   ├── UI/              # User interface components
│   └── BoundaryDetection/ # AI boundary detection modal
├── store/               # Zustand state management
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── services/            # Business logic (PDF export, boundary detection)
```

## Recent Updates (January 2025)

- Walkthrough Mode: First-person 3D site exploration with physics
- AI Boundary Detection: OpenCV.js automatic boundary detection
- Text Cursor Rotation: Unified rotation for shapes and text
- Export Optimizations: O(n2)->O(1) duplicate detection, memory limits
- Z-Fighting Fix: Eliminated 100% of shape flickering in 3D mode
- 2D Camera Fix: Grid/shapes no longer compress when drawing

## Development

### Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run test:all         # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage    # Generate coverage report
```

### Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety and strict configuration
- **Vite** - Fast build tool and dev server
- **Three.js** - 3D graphics and WebGL rendering
- **React Three Fiber** - React renderer for Three.js
- **Drei** - Three.js utilities and helpers
- **Zustand** - Lightweight state management
- **OpenCV.js** - Computer vision for boundary detection
- **pdf-lib** - PDF generation

### Architecture

- **Inline Styles**: All styling done inline to avoid CSS compilation issues
- **Component Isolation**: Each scene component handles its own state
- **Performance**: Optimized for 60fps with efficient re-rendering
- **Type Safety**: Full TypeScript coverage with strict configuration
- **Design System**: Canva-inspired (teal #00C4CC, purple #7C3AED, pink #EC4899)

### Known Issues

- Use inline styles exclusively to avoid CSS compilation issues
- Kill node processes if hot reload stops working: `taskkill /f /im node.exe`
- Only run one dev server at a time to avoid port conflicts
- Text bounds estimation affects resize handle alignment for long text

## Documentation

- [Main Documentation](../CLAUDE.md) - Comprehensive project docs
- [Walkthrough Mode](../docs/features/WALKTHROUGH_MODE.md) - First-person exploration
- [Boundary Detection](../docs/features/BOUNDARY_DETECTION.md) - AI detection system
- [Keyboard Shortcuts](../docs/features/KEYBOARD_SHORTCUTS.md) - All shortcuts
- [Design Principles](../context/design-principles.md) - S-Tier SaaS standards
