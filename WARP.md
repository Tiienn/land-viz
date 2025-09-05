# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Land Visualizer is a professional 3D land visualization tool with CAD-style interface. It's a React-based web application that allows users to draw, edit, and measure land areas with precise calculations. The project features a modern Canva-inspired UI while maintaining full professional CAD functionality.

## Essential Development Commands

All commands should be run from the `app/` directory:

```bash
# Development workflow
cd app
npm run dev              # Start development server (http://localhost:5173)
npm run build           # Production build
npm run preview         # Test production build locally

# Code quality
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format with Prettier
npm run format:check    # Check Prettier formatting
npm run type-check      # TypeScript check without compilation

# Testing
npm run test            # Run tests in watch mode
npm run test:run        # Run tests once
```

## Architecture Overview

### Core Technology Stack
- **React 18** + **TypeScript** - Main UI framework with type safety
- **Vite** - Build tool and dev server (fast HMR)
- **Three.js** + **@react-three/fiber** + **@react-three/drei** - 3D graphics engine
- **Zustand** - Lightweight state management
- **Inline styles only** - NO CSS files (critical for build stability)

### Key Architectural Patterns

**State Management (Zustand)**
- Single store pattern in `src/store/useAppStore.ts`
- Immutable state updates with history tracking (undo/redo)
- Separation of drawing state, shape data, and UI state

**3D Scene Architecture**
- `SceneManager.tsx` - Main 3D canvas wrapper and scene setup
- `DrawingCanvas.tsx` - Interactive drawing with raycasting
- `ShapeRenderer.tsx` - Shape visualization with rotation transforms
- Professional camera controls (right-click orbit, middle-click pan, left-click disabled)

**Shape System**
- Unified shape interface supporting rectangles, circles, polylines
- Professional editing system with draggable sphere corners
- Rotation metadata preservation with transform matrices
- Layer-based organization

### Critical Implementation Constraints

**Styling System**
- **NEVER import CSS files** - build will break
- **Use inline styles exclusively** throughout the codebase
- Consistent pattern: `style={{ property: 'value' }}`

**Development Environment**
- Always run from `app/` directory, not root
- Default dev server port: 5173 (may increment if in use)
- If changes don't reflect: `taskkill /f /im node.exe` on Windows
- Only one dev server at a time to avoid port conflicts

## Directory Structure

```
app/src/
├── App.tsx                    # Main application with ribbon UI
├── components/
│   ├── Scene/                 # 3D scene components
│   │   ├── SceneManager.tsx   # Canvas wrapper & lighting
│   │   ├── DrawingCanvas.tsx  # Interactive drawing logic
│   │   ├── ShapeRenderer.tsx  # Shape visualization
│   │   ├── EditableShapeControls.tsx  # Corner editing
│   │   ├── ResizableShapeControls.tsx # Professional resize handles
│   │   ├── RotationControls.tsx       # CAD-style rotation
│   │   └── GridBackground.tsx # Infinite grass grid
│   ├── ExportSettingsDialog.tsx
│   ├── PropertiesPanel.tsx
│   └── Icon.tsx
├── store/
│   └── useAppStore.ts         # Zustand state management
├── types/
│   └── index.ts              # TypeScript definitions
└── services/                 # Calculation & export services
```

## Feature Implementation Status

### ✅ Complete Features
- **3D Scene**: Full Three.js integration with professional controls
- **Drawing Tools**: Rectangle, circle, polyline with real-time feedback
- **Shape Editing**: Complete edit mode with draggable sphere corners
- **Professional Rotation**: CAD-style rotation with angle snapping (Shift key)
- **Professional Resize**: Windows-style handles with aspect ratio control
- **Layer System**: Layer management with visibility/opacity controls
- **Undo/Redo**: History system with keyboard shortcuts (Ctrl+Z/Ctrl+Y)
- **Visual Design**: Canva-inspired modern UI with professional functionality
- **Expandable Panels**: Left (layers) and right (properties) sidebar panels

### 🚧 In Progress / Next Steps
- **Excel Export**: Button implemented but needs service completion
- **Mobile Responsiveness**: Basic support exists, needs touch optimization
- **Advanced Measurements**: Distance and angle measurement tools

## Important Development Notes

### User Interface Patterns
- **Ribbon Toolbar**: Professional tool grouping with visual separators
- **Expandable Panels**: Layers expand right, Properties expand left
- **Modern Visual Design**: Teal/purple gradients, 8-12px border radius, smooth animations
- **Professional Mode Toggle**: Unlocks advanced features and precision display

### 3D Scene Controls
- **Right-click + drag**: Orbit camera around scene
- **Middle-click + drag**: Pan view
- **Mouse wheel**: Zoom in/out (2x speed)
- **Left-click**: Drawing mode (when tool selected) or shape selection
- **ESC key**: Universal cancel for all operations

### Shape Interaction Modes
- **Select Mode**: Default mode for shape selection and manipulation
- **Edit Mode**: Enter via Edit button to modify shape corners
- **Resize Mode**: Auto-activated when clicking selected shape
- **Rotate Mode**: Enter via Rotate button or rotation handle

### Performance Considerations
- 60 FPS target maintained through optimized rendering
- Infinite grid with custom texture for performance
- Efficient raycasting for shape interaction
- Zustand minimizes unnecessary re-renders

## Code Quality Standards

### TypeScript Usage
- Strict type checking enabled
- All props and state properly typed
- Shape and drawing interfaces in `types/index.ts`

### Component Patterns
- Functional components with hooks
- Custom hooks for complex logic (drawing, editing)
- Event handlers optimized to prevent excessive renders
- Inline styling pattern consistently applied

## Testing Strategy

The project uses Vitest for unit testing and React Testing Library for component testing:
- Unit tests for calculation logic
- Component tests for UI interactions
- Integration tests for drawing workflows

## Critical Gotchas

1. **CSS Compilation**: Never import CSS - use inline styles only
2. **Hot Reload Issues**: Kill all node processes if changes don't reflect
3. **Camera Controls**: Users specifically requested current setup - don't modify
4. **Color Scheme**: Green grass + blue sky is intentional - maintain
5. **Port Conflicts**: Only run one dev server instance
6. **Directory Context**: Always `cd app` before running npm commands

## Professional Features

### Precision System
- High-precision calculations using Decimal.js
- Survey-grade accuracy (±0.01%) in Professional Mode
- Real-time area and dimension calculations

### Export Capabilities
- Excel (.xlsx) - Shape data with measurements
- DXF (.dxf) - CAD-compatible format
- PDF (.pdf) - Professional reports
- GeoJSON - Geographic data interchange

### Advanced Editing
- Corner manipulation (add/delete)
- Shape rotation with live preview
- Resize handles with aspect ratio preservation
- Snap-to-grid functionality

This architecture provides a solid foundation for professional land visualization while maintaining modern web development practices. The codebase is designed for scalability and maintainability, with clear separation of concerns between UI, state management, and 3D rendering systems.
