# Changelog

All notable changes to the Land Visualizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Historical Land Measurement Units (2025-09-22)
- **Comprehensive Regional Support**: 5 new historical land measurement units with regional accuracy
  - **Perches (British)**: 25.29 m² - Standard imperial land measurement
  - **Perches (Mauritius)**: 42.21 m² - Island territory regional standard
  - **Arpent (North America)**: 3,419 m² - Historical North American territories measurement
  - **Arpent (Paris)**: 5,107 m² - Historical Parisian land measurement standard
  - **Arpent (Mauritius)**: 4,221 m² - Mauritius island territory standard

- **Professional Unit Conversion System**: Enhanced conversion engine
  - Real-time conversions between all 12 supported area units
  - High-precision calculations with historically accurate values
  - Professional display names with regional context
  - Optimized conversion factors based on official historical standards

- **User Interface Integration**: Seamless integration across all components
  - Convert Panel: All units available with descriptive symbols
  - Insert Area Modal: Complete unit selection with regional descriptions
  - Add Area Feature: Historical context included in unit descriptions
  - Real-time conversion display with professional formatting

- **Educational Value**: Complete coverage for international users
  - Historical accuracy for real estate and research applications
  - Regional variations properly distinguished and documented
  - Professional-grade precision for land measurement professionals

#### Visual Comparison Tool (2024-01-19)
- **Reference Object Database**: 16 carefully curated reference objects across 4 categories
  - Sports venues: Soccer fields, basketball courts, tennis courts, football fields, Olympic pools
  - Buildings: Average houses, parking spaces, city blocks, Walmart supercenters
  - Landmarks: Eiffel Tower base, Statue of Liberty base, Big Ben tower base
  - Nature: Central Park, traditional acres, garden plots, football fields

- **Interactive Comparison Panel**: Modern UI with expandable sections and real-time search
  - Category-based filtering (All, Sports, Buildings, Landmarks, Nature)
  - Debounced search functionality across object names and descriptions
  - Toggle switches for individual object visibility
  - Live calculation display with visual progress bars

- **3D Object Visualization**: Smart positioning and rendering system
  - Spiral pattern algorithm prevents object overlaps
  - Collision detection ensures proper spacing from user's land
  - Interactive hover effects with detailed object labels
  - Semi-transparent rendering maintains land visibility

- **Advanced Calculation Engine**: Real-time comparison analytics
  - Quantity calculations: "25 houses fit in your land"
  - Percentage analysis: "4.0% of your land"
  - Handles objects larger than user's land: "1.4x your land size"
  - Human-readable descriptions with contextual explanations

- **Mobile Responsiveness**: Touch-optimized interface
  - Bottom sheet modal design for mobile devices
  - Tabbed interface separating objects and comparisons
  - Automatic responsive detection at 768px breakpoint
  - Touch-friendly controls and swipe gestures

- **Integration Features**: Seamless connection with existing systems
  - Real-time updates when land shapes change
  - Integration with undo/redo history system
  - Compatible with all drawing tools and shape types
  - Works with measurement system and grid snapping

### Technical Improvements
- **State Management**: Extended Zustand store with comparison state
- **Performance**: Memoized calculations and debounced search (300ms)
- **Architecture**: Modular component design with compound components
- **Type Safety**: Comprehensive TypeScript interfaces for all comparison types
- **Error Handling**: Robust fallback positioning and calculation error handling

### Fixed
- **ES6 Import Issue**: Resolved Node.js-style require() statements in browser environment
- **Mobile Detection**: Proper responsive breakpoint handling
- **Calculation Accuracy**: Precise polygon area calculations using shoelace formula

## [0.1.0] - 2024-01-15

### Added
- Initial release of Land Visualizer
- Basic drawing tools (rectangle, circle, polyline)
- Measurement system with point-to-point distance calculation
- Professional 3D scene with Three.js integration
- Shape editing with draggable corners
- Rotation system with angle snapping
- Custom camera controls
- Green grass grid with snapping system
- Modern Canva-inspired UI design
- Mobile-responsive interface
- Security hardening for production

### Technical Features
- React 18 + TypeScript + Vite
- Three.js + React Three Fiber + Drei
- Zustand state management
- Inline styles architecture
- Professional error handling
- Development tooling (ESLint, Prettier, Vitest)