# Land Visualizer - Application

**Professional 3D Land Visualization Tool**  
Built with React 18 + TypeScript + Vite + Three.js

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Application runs on: http://localhost:5173

## 🎯 Features

- **Professional 3D Scene**: Three.js + React Three Fiber rendering
- **Advanced Drawing Tools**: Rectangle, Circle, Polyline with real-time preview
- **Shape Editing**: Professional resize handles and rotation system
- **State Management**: Zustand store with robust state isolation
- **Clean Architecture**: Inline styles, TypeScript, performance optimized

## 📁 Project Structure

```
src/
├── components/Scene/     # 3D visualization components
├── store/               # Zustand state management
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── services/            # Business logic services
```

## 🔧 Recent Updates

- ✅ **State Corruption Fix**: Resolved liveResizePoints leaking across shape selections
- ✅ **Tool Switching Enhancement**: Clean state transitions between drawing tools  
- ✅ **Imaginary Line Feature**: Polyline drawing with dotted cursor preview
- ✅ **Debug Console Cleanup**: Production-ready logging with clean output

## 🛠️ Development

### Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run test       # Run tests
```

### Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety and better developer experience  
- **Vite** - Fast build tool and dev server
- **Three.js** - 3D graphics and WebGL rendering
- **React Three Fiber** - React renderer for Three.js
- **Zustand** - Lightweight state management
- **Drei** - Three.js utilities and helpers

### Architecture

- **Inline Styles**: All styling done inline to avoid CSS compilation issues
- **Component Isolation**: Each scene component handles its own state
- **Performance**: Optimized for 60fps with efficient re-rendering
- **Type Safety**: Full TypeScript coverage with strict configuration

### Known Issues

- Use inline styles exclusively to avoid CSS compilation issues
- Kill node processes if hot reload stops working: `taskkill /f /im node.exe`
- Only run one dev server at a time to avoid port conflicts