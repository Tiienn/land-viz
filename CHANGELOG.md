# Changelog

All notable changes to the Land Visualizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Text Cursor Rotation Feature (2025-01-11)
- **Cursor Rotation Mode for Text Objects**: Full feature parity with shape rotation
  - Rotate button now works when text objects are selected
  - Hover-to-rotate with live preview (60 FPS maintained)
  - Shift key for 45° angle snapping
  - Left-click confirms new rotation
  - ESC cancels and restores original rotation

- **History System Integration**: Extended undo/redo to support text state
  - Text store state now included in history snapshots
  - Undo/redo properly restores text rotation and selection
  - Text changes save to unified history (app store manages all history)
  - Minimal overhead: ~1-5KB per history snapshot

- **Four Critical Fixes**:
  1. **Rotate Button Activation**: Text objects now activate cursor rotation mode
  2. **Duplicate Handles**: Eliminated two rotation handles appearing simultaneously
  3. **Immediate Exit Bug**: Fixed mode exiting immediately after entering (200ms delay guard)
  4. **ESC Cancel**: Pressing ESC now properly restores original text rotation

- **Technical Implementation**:
  - Unified shape/text handling via type discriminators
  - `updateTextLive()` method for preview updates (no history save)
  - `updateText()` for final changes (saves to history)
  - Conditional rendering prevents duplicate rotation handles
  - Selection validation checks both `selectedShapeId` and `selectedTextId`

- **Performance**: <1ms rotation updates, maintained 60 FPS, no visual lag
- **Documentation**: Complete fix analysis in `docs/fixes/TEXT_CURSOR_ROTATION_FIX.md`

### Changed

#### Project Directory Reorganization (2025-01-11)
- **Directory Structure**: Organized test files and documentation into proper directories
  - Created `tests/playwright/` for Python/JS test scripts (26 files)
  - Created `tests/screenshots/` for test screenshot assets (65 files)
  - Created `tests/logs/` for console output logs (2 files)
  - Moved resize snap documentation to `docs/fixes/` (4 files)

- **Root Directory Cleanup**: Reduced clutter from 98 files to 9 core files
  - Before: Test scripts, screenshots, logs scattered at root level
  - After: Only essential project files (README, CLAUDE, CHANGELOG, package.json, etc.)
  - Professional appearance with organized structure

- **Git Protection**: Updated `.gitignore` to prevent future test artifact clutter
  - Added patterns: `/test_*.py`, `/test_*.png`, `/*_console_output.txt`, etc.
  - Prevents accidental commits of test artifacts to root

- **Documentation**: Complete reorganization guide in `docs/PROJECT_REORGANIZATION.md`
  - Migration guide for test script paths
  - Benefits and impact assessment
  - Future recommendations

### Added

#### Direct Dimension Input Feature (2025-01-10)
- **Rectangle Dimension Input**: Enter exact sizes before creating rectangles
  - Width × Height format (e.g., "10x15", "10 x 15", "33ft x 50ft")
  - Auto-activation when typing numbers (no button click needed)
  - Real-time validation with error messages
  - Supports meters (m), feet (ft), and yards (yd)
  - Click to place rectangle with exact dimensions

- **Circle Dimension Input**: Precision circle creation with radius/diameter modes
  - Radius mode: Direct radius input (e.g., "10", "r10", "5m")
  - Diameter mode: Diameter input auto-converts to radius (e.g., "d20")
  - Unit selection dropdown (m, ft, yd)
  - r/d toggle for switching between radius and diameter modes
  - Auto-focus input field when typing numbers
  - Real-time conversion and validation

- **Enhanced Toolbar UI**: Professional dimension input interface
  - Canva-inspired styling with smooth transitions
  - Fixed positioning beside Tools & Functions ribbon
  - Clear visual feedback for active/inactive states
  - Error messages with helpful validation hints
  - Clear button to reset input quickly

- **Integration Features**: Seamless connection with existing drawing workflow
  - Works with grid snapping for precise placement
  - Compatible with alignment guides and magnetic snapping
  - Proper unit conversion to meters for internal storage
  - Dimension calculations use original points (not rotated/transformed)

### Changed

#### Grouping System Production Cleanup (2025-01-07)
- **Console Log Removal**: Removed all debug console logs from grouping system
  - Cleaned `GroupBoundary.tsx` (removed 4 debug logs)
  - Cleaned `GroupBoundaryManager.tsx` (removed 3 debug logs)
  - Updated `GroupBoundary.test.tsx` (8 tests now verify rendering instead of console output)
  - Result: Silent production code without debug clutter
  - All 21 GroupBoundary tests still passing
  - Zero functionality changes
  - Professional user experience with clean console output
  - Performance monitoring logic preserved (internal calculations only)

### Fixed

#### Circle Dimension Calculation Bug (2025-01-10)
- **Issue**: Incorrect radius and area displayed when using dimension input
  - D=10m showed r=1.0m, area=3 m² (expected: r=5.0m, area=78.54 m²)
  - r=10m showed r=1.6m, area=8 m² (expected: r=10.0m, area=314.16 m²)
  - Affected both 2D and 3D view modes

- **Root Cause**: ShapeDimensions component receiving rotated/transformed points
  - Visual rendering applies rotation transforms for display
  - Dimension calculations were using transformed points instead of original stored points
  - Rotation transforms should only affect visual mesh, not measurements

- **Solution**: Pass original shape data to ShapeDimensions (ShapeRenderer.tsx:1002)
  - Changed from: `shape={{...shape, points: transformedPoints}}`
  - Changed to: `shape={shape}`
  - Ensures dimension calculations always use untransformed points
  - Maintains separation between visual transforms and data calculations

- **Documentation**: Complete debugging process and prevention guidelines in `CIRCLE_DIMENSION_BUG_FIX.md`

### Added

#### Direct Distance Entry Line Tool with Multi-Line Mode (2025-09-26)
- **AutoCAD-Style Precision Line Drawing**: Professional CAD workflow with exact distance input
  - Single line mode: Click first point → enter distance → creates precise line in cursor direction
  - Multi-line mode: Tab to enable → polyline-style workflow with distance entry at each segment
  - Mathematical precision using direction vectors and distance calculations
  - Real-time preview with cursor tracking and grid snapping integration

- **Multi-Segment Polyline Creation**: Advanced polyline workflow with distance control
  - Automatic shape closing when clicking near start point (4m threshold)
  - Manual completion with Space key for open polylines
  - Segment counter and progress tracking during multi-line creation
  - Connected line chains with precise distance control at each segment

- **Enhanced Distance Input Interface**: Professional input modal with keyboard shortcuts
  - Fixed positioning beside mouse position indicator (no overlap)
  - Dynamic instruction text based on current mode (single vs multi-line)
  - Keyboard shortcuts: Tab (enable multi-line), Space (complete), ESC (cancel)
  - Auto-focus and text selection for efficient distance entry

- **Integration Features**: Seamless connection with existing drawing systems
  - Works with existing grid snapping (1m snap increments)
  - Compatible with alignment guides and magnetic snapping
  - Lines excluded from total area calculations (lines don't have area)
  - Proper shape naming: "Line N" for single lines, "Multi-Line N" for polylines

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