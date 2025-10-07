/**
 * GroupBoundaryManager Component
 * Manages rendering of all group boundaries in the scene
 * Shows boundaries for hovered groups and groups with selected shapes
 */

import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GroupBoundary } from './GroupBoundary';
import type { Shape } from '../../types';

export const GroupBoundaryManager: React.FC = () => {
  // Get state from store
  const shapes = useAppStore(state => state.shapes);
  const hoveredGroupId = useAppStore(state => state.hoveredGroupId);
  const selectedShapeIds = useAppStore(state => state.selectedShapeIds);
  const dragState = useAppStore(state => state.dragState); // For live drag preview

  // Determine which groups should show boundaries
  const visibleGroups = useMemo(() => {
    const groupMap = new Map<string, Shape[]>();

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
    if (hoveredGroupId) {
      visibleGroupIds.add(hoveredGroupId);
    }

    // Add groups with selected shapes
    selectedShapeIds?.forEach(selectedId => {
      const selectedShape = shapes.find(s => s.id === selectedId);
      if (selectedShape?.groupId) {
        visibleGroupIds.add(selectedShape.groupId);
      }
    });

    // Build result: array of { groupId, shapes, isVisible }
    const result = Array.from(groupMap.entries()).map(([groupId, groupShapes]) => ({
      groupId,
      shapes: groupShapes,
      isVisible: visibleGroupIds.has(groupId),
    }));

    return result;
  }, [shapes, hoveredGroupId, selectedShapeIds]);

  // Render boundaries for all visible groups
  return (
    <>
      {visibleGroups.map(({ groupId, shapes, isVisible }) => (
        <GroupBoundary
          key={groupId}
          groupId={groupId}
          shapes={shapes}
          isVisible={isVisible}
          dragState={dragState}
        />
      ))}
    </>
  );
};
