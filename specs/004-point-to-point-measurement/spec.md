# Specification: Point-to-Point Measurement Feature

**Spec ID**: 004
**Feature**: Point-to-Point Measurement
**Version**: 1.0
**Date**: 2025-09-18
**Status**: Draft

## 1. Overview

### 1.1 Purpose
Implement a precise point-to-point measurement tool that allows users to measure distances between any two points in the 3D land visualization scene with professional accuracy and visual feedback.

### 1.2 Scope
- Add measurement tool to existing ribbon toolbar
- Implement precise 3D distance calculations
- Provide real-time visual feedback during measurement
- Integrate with existing snapping system for accuracy
- Display measurement results with proper units
- Manage measurement history and visibility

### 1.3 Out of Scope
- Area/perimeter measurements (future feature)
- Angle measurements (future feature)
- Elevation/height measurements (requires 3D elevation data)
- Advanced measurement tools (offset, parallel, etc.)

## 2. User Stories

### 2.1 Primary User Stories

**US-001: Basic Point-to-Point Measurement**
- As a land surveyor, I want to measure the distance between two points on the land visualization
- So that I can verify dimensions and create accurate property assessments

**US-002: Precise Measurement with Snapping**
- As a user, I want measurements to snap to existing shape corners and grid points
- So that I can get accurate measurements aligned with drawn shapes

**US-003: Visual Measurement Feedback**
- As a user, I want to see a live preview of the measurement line as I move my cursor
- So that I can position the second point accurately before confirming

**US-004: Measurement Management**
- As a user, I want to view, hide, and delete previous measurements
- So that I can manage multiple measurements without cluttering the scene

### 2.2 Secondary User Stories

**US-005: Measurement Export**
- As a professional user, I want measurements included in Excel exports
- So that I can include distance data in my reports

**US-006: Unit Conversion**
- As a user, I want to see measurements in both metric and imperial units
- So that I can work with my preferred measurement system

## 3. Functional Requirements

### 3.1 Core Functionality

**FR-001: Measurement Tool Integration**
- Add "Measure" tool to the ribbon toolbar
- Tool icon: Ruler (Lucide React icon)
- Tool positioning: In the "Tools" group alongside existing drawing tools
- Tool state management: Follows existing DrawingTool pattern

**FR-002: Two-Point Measurement Process**
1. User clicks "Measure" tool to activate measurement mode
2. User clicks first point in 3D scene (with snapping support)
3. System shows first point marker and live measurement line to cursor
4. User clicks second point to complete measurement
5. System displays final measurement with distance label

**FR-003: Precision and Snapping**
- Integrate with existing SnapGrid system
- Support snapping to: grid points, shape endpoints, midpoints, intersections
- Maintain existing snap tolerance and visual feedback
- Use existing coordinate precision (6 decimal places)

**FR-004: Visual Feedback**
- **Measurement line**: Blue dashed line during preview, solid line when complete
- **Point markers**: Green circle (start), red circle (end), 8px diameter
- **Distance label**: White background, rounded corners, positioned at line midpoint
- **Cursor feedback**: Crosshair with ruler icon in measurement mode

**FR-005: Measurement Results**
- Distance calculation using Euclidean formula: √[(x₂-x₁)² + (y₂-y₁)²]
- Display precision: 2 decimal places for metric, 3 for imperial
- Unit display: Primary unit (m, ft) with secondary unit in parentheses
- Automatic unit selection based on user preference

### 3.2 State Management

**FR-006: Measurement State**
- Add measurement mode to existing DrawingState
- Store active measurements in Zustand store
- Support undo/redo for measurement operations
- Persist measurement visibility settings

**FR-007: Measurement Data Structure**
```typescript
interface Measurement {
  id: string;
  startPoint: Point2D;
  endPoint: Point2D;
  distance: number;
  unit: 'metric' | 'imperial';
  created: Date;
  visible: boolean;
  label?: string;
}
```

### 3.3 User Interface

**FR-008: Ribbon Integration**
- Add "Measure" button to existing ribbon toolbar
- Button styling: Consistent with existing tool buttons
- Active state: Blue background when measurement tool is active
- Tooltip: "Measure distances (M)"

**FR-009: Measurement Panel**
- Add "Measurements" section to Properties panel
- Display list of all measurements with:
  - Sequential numbering (M1, M2, M3...)
  - Distance value with units
  - Show/hide toggle per measurement
  - Delete button per measurement
- "Clear All Measurements" button
- Collapse/expand functionality

**FR-010: Keyboard Shortcuts**
- **M**: Activate measurement tool
- **Escape**: Cancel current measurement or exit measurement mode
- **Delete**: Delete selected measurement (when measurement is selected)

## 4. Non-Functional Requirements

### 4.1 Performance
- Measurement calculations must complete within 10ms
- Live preview updates limited to 30fps for smooth interaction
- Support for up to 100 active measurements without performance degradation
- Memory usage: No memory leaks from measurement objects

### 4.2 Accuracy
- Coordinate precision: 6 decimal places (sub-millimeter accuracy)
- Distance calculation precision: Maintains coordinate precision
- Snapping tolerance: Consistent with existing snapping system (5px)

### 4.3 Usability
- Tool activation within 1 click from any state
- Visual feedback appears within 100ms of user interaction
- Measurement completion within 2 clicks + cursor movement
- Clear visual distinction between preview and final measurements

### 4.4 Compatibility
- Works with existing camera controls (orbit, pan, zoom)
- Compatible with all existing drawing tools
- Maintains performance across all supported devices
- Integrates with existing export functionality

## 5. User Interface Specifications

### 5.1 Visual Design
- **Design language**: Canva-inspired professional styling
- **Color scheme**: Primary blue (#3B82F6) for measurement lines
- **Typography**: Nunito Sans for measurement labels
- **Styling approach**: Inline styles only (project requirement)

### 5.2 Responsive Design
- **Desktop**: Full functionality with hover states
- **Tablet**: Touch-optimized point selection (12px minimum targets)
- **Mobile**: Simplified measurement interface with gesture support

### 5.3 Accessibility
- **Keyboard navigation**: Full keyboard accessibility
- **Screen readers**: ARIA labels for measurement elements
- **Color contrast**: WCAG 2.1 AA compliance for all measurement UI
- **Focus indicators**: Clear focus states for interactive elements

## 6. Technical Constraints

### 6.1 Architecture Constraints
- **State management**: Must use Zustand store pattern
- **Styling**: Inline styles only (no CSS files)
- **3D rendering**: Three.js/React Three Fiber integration
- **Coordinate system**: Point2D (x, y) where y maps to z in 3D space

### 6.2 Integration Constraints
- **Existing systems**: Must integrate with DrawingCanvas, SnapGrid, RaycastManager
- **Tool pattern**: Follow existing tool switching and state management patterns
- **Error handling**: Use existing error boundary and logging systems

## 7. Acceptance Criteria

### 7.1 Core Functionality
- [ ] User can activate measurement tool from ribbon
- [ ] User can click two points to create a measurement
- [ ] Distance is calculated and displayed accurately
- [ ] Measurements integrate with snapping system
- [ ] Visual feedback is clear and professional

### 7.2 User Experience
- [ ] Tool feels native to existing application
- [ ] Measurement process is intuitive (no training required)
- [ ] Visual feedback is immediate and clear
- [ ] Keyboard shortcuts work as specified
- [ ] Multiple measurements can be managed effectively

### 7.3 Technical
- [ ] Performance meets specified requirements
- [ ] No memory leaks or performance degradation
- [ ] Integration with existing systems is seamless
- [ ] Code follows existing patterns and conventions
- [ ] Unit tests achieve 70%+ coverage

## 8. Edge Cases and Error Handling

### 8.1 Edge Cases
- **Same point clicked twice**: Show error message, require different second point
- **Points outside visible area**: Ensure measurement line is still visible and accessible
- **Maximum measurements reached**: Warn user and suggest clearing old measurements
- **Rapid clicking**: Debounce measurement creation to prevent duplicates

### 8.2 Error Scenarios
- **Invalid coordinates**: Validate point coordinates and show user-friendly error
- **Calculation overflow**: Handle extremely large distances gracefully
- **Snapping failures**: Fall back to exact cursor position if snapping fails
- **Memory constraints**: Implement measurement limit and cleanup old measurements

## 9. Testing Strategy

### 9.1 Unit Tests
- Distance calculation accuracy
- Coordinate transformation functions
- State management actions
- Utility functions

### 9.2 Integration Tests
- Tool switching behavior
- Snapping system integration
- 3D scene interaction
- Export functionality

### 9.3 User Experience Tests
- End-to-end measurement workflows
- Keyboard navigation
- Multi-measurement scenarios
- Performance with many measurements

## 10. Future Considerations

### 10.1 Planned Enhancements
- Area measurement tool (measure enclosed regions)
- Angle measurement tool
- Measurement annotations and labels
- Advanced measurement tools (offset, parallel)

### 10.2 Potential Integrations
- Elevation data for 3D distance measurements
- Integration with survey data import/export
- Measurement templates and presets
- Collaborative measurement sharing

## 11. Dependencies

### 11.1 Internal Dependencies
- Existing DrawingCanvas component
- SnapGrid utility system
- RaycastManager for 3D interaction
- Zustand store infrastructure
- Existing UI component patterns

### 11.2 External Dependencies
- Three.js for 3D rendering
- React Three Fiber for React integration
- Lucide React for icons
- TypeScript for type safety

## 12. Risks and Mitigations

### 12.1 Technical Risks
- **Performance impact**: Mitigate with optimized rendering and limited measurement count
- **Precision issues**: Use established coordinate system and validated calculations
- **Browser compatibility**: Test across target browsers and devices

### 12.2 User Experience Risks
- **Complexity**: Keep interface simple and follow existing patterns
- **Discoverability**: Use familiar icon and position in logical toolbar location
- **Learning curve**: Provide clear visual feedback and follow measurement tool conventions

---

**AMBIGUITY**: Need clarification on whether measurements should persist across browser sessions or remain session-only.

**AMBIGUITY**: Export format for measurements - should they be included as separate sheet/layer or integrated with shape data?

**AMBIGUITY**: Maximum number of active measurements - need to define reasonable limit based on performance testing.