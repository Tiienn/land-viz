/**
 * GroupBoundaryManager Component
 * Manages rendering of all group boundaries in the scene
 * Shows boundaries for hovered groups and groups with selected elements
 * Phase 5: Updated to support mixed groups (shapes + text)
 */

import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GroupBoundary } from './GroupBoundary';
import type { Element } from '../../types';

export const GroupBoundaryManager: React.FC = () => {
  // Get shapes from store (groups are created on shapes, not elements)
  const shapes = useAppStore(state => state.shapes);
  const hoveredGroupId = useAppStore(state => state.hoveredGroupId);
  const selectedShapeIds = useAppStore(state => state.selectedShapeIds);
  const dragState = useAppStore(state => state.dragState); // For live drag preview
  const cursorRotationMode = useAppStore(state => state.cursorRotationMode); // Check if in rotation mode

  // Determine which groups should show boundaries
  const visibleGroups = useMemo(() => {
    const groupMap = new Map<string, any[]>();

    // Collect all shapes that have a groupId
    const groupedShapes = shapes.filter(shape => shape.groupId);

    // Group shapes by their groupId
    groupedShapes.forEach(shape => {
      const groupId = shape.groupId!;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId)!.push(shape);
    });

    // Determine which groups are visible (hovered OR selected)
    const visibleGroupIds = new Set<string>();

    // Add hovered group
    // BUT: Don't show hover boundary if in rotation mode (RotationControls + MultiSelectionBoundary handle that)
    if (hoveredGroupId && !cursorRotationMode) {
      visibleGroupIds.add(hoveredGroupId);
    }

    // Add groups with selected shapes
    // BUT: Skip if ALL shapes in the group are selected (MultiSelectionBoundary handles that case)
    // ALSO: Skip if in rotation mode (RotationControls + MultiSelectionBoundary handle that)
    if (!cursorRotationMode) {
      selectedShapeIds?.forEach(selectedId => {
        const selectedShape = shapes.find(s => s.id === selectedId);
        if (selectedShape?.groupId) {
          // Check if ALL shapes in this group are selected
          const groupShapes = groupMap.get(selectedShape.groupId);
          if (groupShapes) {
            const allShapesSelected = groupShapes.every(shape =>
              selectedShapeIds.includes(shape.id)
            );

            // Only show GroupBoundary if NOT all shapes are selected
            // (when all are selected, MultiSelectionBoundary will handle it)
            if (!allShapesSelected) {
              visibleGroupIds.add(selectedShape.groupId);
            }
          }
        }
      });
    }

    // Build result: array of { groupId, elements, isVisible }
    const result = Array.from(groupMap.entries()).map(([groupId, groupShapes]) => ({
      groupId,
      elements: groupShapes, // Keep 'elements' key for compatibility with GroupBoundary component
      isVisible: visibleGroupIds.has(groupId),
    }));

    return result;
  }, [shapes, hoveredGroupId, selectedShapeIds, cursorRotationMode]);

  // Render boundaries for all visible groups
  return (
    <>
      {visibleGroups.map(({ groupId, elements, isVisible }) => (
        <GroupBoundary
          key={groupId}
          groupId={groupId}
          elements={elements}
          isVisible={isVisible}
          dragState={dragState}
        />
      ))}
    </>
  );
};
