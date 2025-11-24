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

