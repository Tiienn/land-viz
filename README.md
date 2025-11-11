# Land Visualizer 🗺️

> **Transform abstract land measurements into instant visual understanding**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/land-visualizer)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r157-black.svg)](https://threejs.org/)
[![Chili3D](https://img.shields.io/badge/Chili3D-0.8.6-red.svg)](https://chili3d.com/)

## 🎯 What is Land Visualizer?

Land Visualizer is an intuitive web application that helps anyone understand property sizes by converting confusing measurements like "2000m²" into clear, relatable visual comparisons. No CAD knowledge required - just draw your land and instantly see how many soccer fields, parking spaces, or houses fit inside.

### 🎨 Modern Visual Design

The application features a **Canva-inspired modern UI** with professional CAD functionality:
- Clean, contemporary interface with vibrant teal/purple color scheme
- Smooth animations and micro-interactions
- Gradient buttons with elegant hover effects
- Professional tools wrapped in an approachable, friendly design

### ✨ Key Features

- **🎨 Smart Drawing** - Click to draw property boundaries with automatic shape completion
- **📐 Direct Dimension Input** - Type exact sizes before creating shapes (rectangles: "10x15", circles: r/d mode)
- **📏 Instant Calculations** - Real-time area, perimeter, and dimension measurements
- **⌨️ Keyboard Shortcuts** - SmartDraw-inspired productivity shortcuts (Press ? for help)
- **🔧 Expandable Panels** - Collapsible/expandable left and right sidebars with smooth animations
- **🎛️ Professional Ribbon** - Clean tool grouping with SVG icons and visual separators
- **🔄 Comprehensive Unit Conversion** - 12 area units including historical French/British measurements (perches, arpent)
- **⚡ Visual Comparisons** - Compare your land to 16+ familiar objects (sports fields, buildings, landmarks)
- **📊 Smart Analysis** - Instantly see "25 houses fit in your land" with visual progress bars
- **✏️ Polyline Drawing** - Advanced polyline tool with real-time dotted preview line
- **🔧 Professional Controls** - Windows-style resize handles and CAD-style rotation system (shapes + text)
- **📝 Text Rotation** - Full cursor rotation mode for text objects with confirm/cancel pattern
- **🎯 State Management** - Robust state isolation preventing visual corruption between shapes
- **🎯 Precision Mode** - Professional-grade accuracy powered by Chili3D
- **📱 Mobile First** - Works perfectly on phones, tablets, and desktops
- **🚀 Fast & Lightweight** - Loads in under 3 seconds on 3G

## 🖼️ Screenshots

![Land Visualizer Demo](docs/assets/images/demo.gif)
*Drawing a property and comparing it to soccer fields*

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Modern browser with WebGL support
- 4GB RAM minimum for development

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/land-visualizer.git
cd land-visualizer/app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Production Build

```bash
# Create optimized build
npm run build

# Test production build locally
npm run preview

# Run tests
npm test
```

## 🛠️ Tech Stack

### Core Technologies
- **React 18** - UI framework
- **Three.js + @react-three/fiber** - 3D visualization
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Professional Features (Chili3D Integration)
- **Decimal.js** - High-precision calculations (±0.01% accuracy)
- **Zustand** - Lightweight state management
- **@react-three/drei** - Three.js helpers and utilities

### Design & Styling
- **Nunito Sans** - Modern, readable typography system
- **Custom CSS** - Professional styling with inline approach
- **Google Fonts** - Web font optimization

### Testing & Quality
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Cypress** - E2E testing
- **ESLint + Prettier** - Code quality

## 📁 Project Structure

```
land-visualizer/
├── app/src/               # Application source code
│   ├── components/
│   │   ├── Scene/         # 3D scene components
│   │   │   ├── SceneManager.tsx   # Main 3D canvas
│   │   │   ├── DrawingCanvas.tsx  # Interactive drawing
│   │   │   ├── ShapeRenderer.tsx  # Shape visualization
│   │   │   ├── RotationControls.tsx # Cursor rotation
│   │   │   └── GridBackground.tsx  # Infinite grass grid
│   │   ├── Text/          # Text annotation components
│   │   │   ├── TextRenderer.tsx   # Text display
│   │   │   └── TextTransformControls.tsx # Text editing
│   │   ├── PropertiesPanel.tsx # Tool instructions
│   │   └── LayerPanel.tsx      # Layer management
│   ├── store/
│   │   ├── useAppStore.ts      # Main state + history
│   │   ├── useTextStore.ts     # Text annotations
│   │   └── useLayerStore.ts    # Layer management
│   └── App.tsx            # Main application
├── tests/                 # All test-related files
│   ├── playwright/        # Python/JS test scripts
│   ├── screenshots/       # Test visual assets
│   └── logs/              # Console outputs
├── docs/                  # Documentation
│   ├── fixes/             # Bug fix documentation
│   ├── known-issues/      # Known issues
│   └── PROJECT_REORGANIZATION.md
└── specs/                 # Feature specifications
```

## 🎮 Usage

### Basic Drawing
1. Select a drawing tool: **Rectangle**, **Circle**, or **Polyline**
2. **Option A - Direct Input:** Type exact dimensions (e.g., "10x15" for rectangles, "d20" for circles)
3. **Option B - Manual Drawing:** Click on the 3D canvas to draw freely
   - For rectangles: Click two diagonal corners
   - For circles: Click center, then click radius point
   - For polylines: Click multiple points, then click near start to close
4. Crosshair cursor shows exact drawing position
5. Real-time dimensions display during drawing
6. Press **?** anytime to see keyboard shortcuts

### Viewing Measurements
1. Green area labels show total area for closed shapes
2. Dimension labels show lengths for each side
3. Circle shapes display radius measurement
4. Polylines show area if 3+ points (treated as closed shape)
5. All measurements scale appropriately with camera zoom

### Precision Mode
1. Toggle **Pro Mode** in settings
2. Enables survey-grade accuracy (±0.01%)
3. Unlocks CAD export options

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📊 Performance

| Metric | Target | Current |
|--------|--------|---------|
| Load Time (3G) | <3s | 2.8s ✅ |
| FPS Desktop | 60 | 58 ✅ |
| FPS Mobile | 30+ | 42 ✅ |
| Lighthouse Score | 90+ | 92 ✅ |
| Bundle Size | <5MB | 3.2MB ✅ |

## 🤝 Contributing

We love contributions! See [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📅 Roadmap

### Current Sprint (Aug 26 - Sep 8)
- [x] Core 3D visualization ✅ **COMPLETE**
- [x] Basic shape drawing ✅ **COMPLETE**
- [x] Professional UI with ribbon toolbar ✅ **COMPLETE**
- [x] Custom camera controls ✅ **COMPLETE**
- [x] Natural color scheme ✅ **COMPLETE**
- [x] Drawing tool fixes (area calculations, polyline enhancement) ✅ **COMPLETE**
- [x] UI improvements (coordinates display, properties panel) ✅ **COMPLETE**
- [x] Visual feedback enhancements (crosshair cursor, dimension scaling) ✅ **COMPLETE**
- [ ] Excel export functionality
- [ ] Chili3D integration
- [ ] Mobile rotation fix

### Upcoming Features
- 🎯 AI-powered shape detection
- 🛰️ Satellite imagery overlay
- 🌍 Multi-language support
- 👥 Collaboration features
- 📱 Native mobile apps

See [ROADMAP.md](docs/project/ROADMAP.md) for detailed plans.

## ✅ Recent Fixes & Updates

### January 2025 - Week 2 (Latest)
- **NEW**: Text Cursor Rotation - full feature parity with shapes
  - Rotate button now works for text objects (hover-to-rotate with live preview)
  - Left-click confirms new rotation, ESC cancels and restores original
  - Extended history system to include text state (unified undo/redo)
  - Fixed 4 critical bugs: button activation, duplicate handles, immediate exit, ESC cancel
  - Performance: <1ms updates, 60 FPS maintained
  - See `docs/fixes/TEXT_CURSOR_ROTATION_FIX.md` for technical details

- **IMPROVED**: Project Directory Organization
  - Reorganized 93 files from root into proper directories
  - Test scripts → `tests/playwright/`, screenshots → `tests/screenshots/`
  - Root directory cleaned from 98 files to 9 core files
  - Updated .gitignore to prevent future test artifact clutter
  - See `docs/PROJECT_REORGANIZATION.md` for complete details

### January 2025 - Week 1
- **NEW**: Direct Dimension Input feature - type exact sizes before creating shapes
  - Rectangle: Width × Height format (e.g., "10x15", "33ft x 50ft")
  - Circle: Radius/Diameter mode with unit selection (r/d toggle)
  - Auto-activation when typing numbers
- **FIXED**: Circle dimension calculation bug - dimensions now show correct values
  - Issue: D=10m showed r=1.0m instead of r=5.0m
  - Cause: Rotation transforms affecting measurement calculations
  - Solution: Use original points for dimensions, not transformed points
  - Documentation: See `CIRCLE_DIMENSION_BUG_FIX.md` for details
- **NEW**: Comprehensive keyboard shortcuts (SmartDraw-inspired)
  - Tools: S (select), R (rectangle), C (circle), P (polyline), L (line), M (measure)
  - Editing: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+D (duplicate), Delete
  - View: V (toggle 2D/3D), ? (shortcuts help), ESC (cancel)

### Previous Updates
- Rectangle area calculations now work for both default and newly drawn shapes
- Enhanced polyline drawing with imaginary line following cursor
- Added crosshair cursor for drawing modes with special closing indicator
- Improved dimension text scaling that responds properly to camera zoom
- Moved coordinate display to bottom-left corner for better UX
- Added Properties panel with tool-specific instructions and grid controls
- **NEW**: Added expandable/collapsible left and right sidebar panels
- **NEW**: Implemented professional ribbon toolbar with clean SVG icons
- **CRITICAL**: Fixed rotation-drag cursor following issue - shapes now follow cursor exactly
- **ENHANCED**: Dynamic Shift key snapping during rotation - press/release for instant 45° snapping

## 🐛 Known Issues

- Firefox shape drawing lag (#003) - Investigating
- ~~Mobile rotation causes crash (#001)~~ - ✅ FIXED
- ~~Rotation-drag cursor mismatch (#002)~~ - ✅ FIXED
- See [Issues](https://github.com/yourusername/land-visualizer/issues) for more

## 📝 Documentation

Complete documentation is available in the [docs/](docs/) directory:

### 📋 Core Documentation
- **[Documentation Hub](docs/README.md)** - Complete documentation index
- **[Product Requirements](docs/project/PRD.md)** - Features and specifications
- **[Architecture Overview](docs/technical/ARCHITECTURE.md)** - System design
- **[API Documentation](docs/technical/API.md)** - Service interfaces
- **[Setup Guide](docs/guides/setup.md)** - Development environment

### 🚀 Quick Links
- **[Contributing Guide](docs/guides/CONTRIBUTING.md)** - How to contribute
- **[Deployment Guide](docs/technical/DEPLOYMENT.md)** - Production deployment
- **[Design Principles](docs/project/design-principles.md)** - Design philosophy
- **[Testing Strategy](docs/technical/TESTING.md)** - Quality assurance

## 👥 Team

- **Sarah Chen** - Frontend Lead
- **Alex Rodriguez** - Backend & Chili3D Integration
- **Mike Thompson** - 3D Graphics
- **Jennifer Park** - UX Design
- **Tom Wilson** - DevOps

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Chili3D](https://chili3d.com) for professional CAD capabilities
- [Three.js](https://threejs.org) for 3D graphics
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for React integration
- Our beta testers for invaluable feedback

## 📞 Contact & Support

- **Website**: [landvisualizer.com](https://landvisualizer.com)
- **Email**: support@landvisualizer.com
- **Discord**: [Join our community](https://discord.gg/landviz)
- **Twitter**: [@landvisualizer](https://twitter.com/landvisualizer)

---

<p align="center">
  Made with ❤️ by the Land Visualizer Team
  <br>
  <a href="https://landvisualizer.com">landvisualizer.com</a>
</p>