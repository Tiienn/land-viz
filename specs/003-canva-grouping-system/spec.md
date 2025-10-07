# Specification: Canva-Style Grouping System

**Feature ID**: 003
**Status**: Draft
**Created**: 2025-01-07
**Updated**: 2025-01-07

## Overview

Implement a Canva-style grouping system where shapes can be grouped together to move, rotate, resize, and duplicate as a single unit while maintaining their individual properties.

## User Stories

### US-001: Group Shapes
**As a** user
**I want to** group multiple selected shapes
**So that** I can manipulate them as a single unit

**Acceptance Criteria:**
- ✅ User can select 2+ shapes and press `Ctrl+G` to group
- ✅ Grouped shapes receive a shared `groupId`
- ✅ Individual shape properties (color, name, rotation) are preserved
- ✅ Group boundary appears as purple dashed rectangle

### US-002: Group Selection
**As a** user
**I want to** click any shape in a group to select the entire group
**So that** I can quickly manipulate all grouped shapes

**Acceptance Criteria:**
- ✅ Clicking one grouped shape selects all shapes in that group
- ✅ Clicked shape is highlighted with stronger visual feedback
- ✅ All shapes in group show selection indicators
- ✅ Group boundary displays around all shapes

### US-003: Group Hover State
**As a** user
**I want to** see the group boundary when hovering over any grouped shape
**So that** I can identify which shapes are grouped

**Acceptance Criteria:**
- ✅ Hovering over grouped shape shows group boundary
- ✅ Boundary disappears when mouse leaves (unless group is selected)
- ✅ Boundary persists when group is selected

### US-004: Group Operations
**As a** user
**I want to** perform operations on grouped shapes
**So that** I can efficiently edit my design

**Acceptance Criteria:**
- ✅ **Move**: Dragging moves all shapes maintaining relative positions
- ✅ **Rotate**: Rotates all shapes around group center
- ✅ **Resize**: Scales all shapes proportionally from group center
- ✅ **Duplicate** (`Ctrl+D`): Creates new group with all shapes
- ✅ **Delete**: Removes all shapes in group
- ✅ **Arrow keys**: Nudges entire group

### US-005: Ungroup Shapes
**As a** user
**I want to** ungroup shapes with `Ctrl+Shift+G`
**So that** I can manipulate shapes individually again

**Acceptance Criteria:**
- ✅ `Ctrl+Shift+G` removes `groupId` from all shapes
- ✅ Shapes remain selected after ungrouping
- ✅ Group boundary disappears
- ✅ Individual manipulation is restored

## Functional Requirements

### FR-001: Group Data Model
- Shapes store `groupId?: string` (not a separate group entity)
- Group ID is a unique string (e.g., `group_${Date.now()}`)
- No nested groups in v1 (one `groupId` per shape)

### FR-002: Group Visual Feedback
- **Boundary Color**: Purple (`#9333EA`)
- **Boundary Style**: 2px dashed line
- **Boundary Padding**: 8px from outermost shape edges
- **Display Conditions**:
  - Show on hover (any shape in group)
  - Show when group is selected
  - Hide when not hovered and not selected

### FR-003: Selection Behavior
- Clicking grouped shape → select ALL shapes with same `groupId`
- Store clicked shape ID in `highlightedShapeId`
- Highlighted shape gets stronger visual (e.g., thicker outline)
- `selectedShapeIds` contains all group member IDs

### FR-004: Transformation Behavior
- **Move**: Apply same offset to all shapes
- **Rotate**: Calculate group center, rotate all shapes around it
- **Resize**: Scale from group center, maintain aspect ratios
- **Duplicate**: Clone all shapes with new `groupId`

## Non-Functional Requirements

### NFR-001: Performance
- Group boundary calculation: <16ms (60 FPS)
- Support groups up to 100 shapes without lag
- Use memoization for boundary calculations

### NFR-002: Compatibility
- Works with existing rotation system
- Compatible with layer system (groups can span layers)
- Undo/redo supports group operations

### NFR-003: Visual Polish
- Smooth 200ms fade in/out for boundary
- No visual flicker during group operations
- Boundary updates in real-time during drag

## Edge Cases

### EC-001: Cross-Layer Grouping
**Scenario**: User groups shapes from different layers
**Behavior**: Allowed. Shapes maintain their layer assignments.

### EC-002: Locked Shapes
**Scenario**: User tries to group a locked shape
**Behavior**: Locked shapes CAN be grouped but group operations respect lock state.

### EC-003: Rotated Shapes
**Scenario**: Group contains rotated shapes
**Behavior**: Boundary calculated from world-space points (using rotation transforms).

### EC-004: Empty Group
**Scenario**: All shapes in a group are deleted except one
**Behavior**: Last shape loses `groupId` automatically (no point in 1-shape group).

## Technical Constraints

- Must use inline styles (Article 1)
- Must use Zustand store (Article 3)
- Must preserve CAD precision (Article 5)
- Must support undo/redo (existing system)

## Out of Scope (V1)

- ❌ Nested groups (groups within groups)
- ❌ Named groups
- ❌ Group-level properties (color, opacity)
- ❌ Lock entire group
- ❌ Group in layer panel

## Success Metrics

- ✅ Users can group/ungroup shapes with keyboard shortcuts
- ✅ Group operations feel smooth (60 FPS)
- ✅ No regressions in existing shape operations
- ✅ 70%+ test coverage for grouping logic
