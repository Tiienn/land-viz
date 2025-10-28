/**
 * GroupBoundaryManager Component
 * Manages rendering of all group boundaries in the scene
 * Shows boundaries for hovered groups and groups with selected elements
 * Phase 5: Updated to support mixed groups (shapes + text)
 */

import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTextStore } from '../../store/useTextStore'; // Phase 4: For text grouping
import { GroupBoundary } from './GroupBoundary';
import type { Element } from '../../types';

export const GroupBoundaryManager: React.FC = () => {
  // Get shapes from store (groups are created on shapes, not elements)
  const shapes = useAppStore(state => state.shapes);
  const hoveredGroupId = useAppStore(state => state.hoveredGroupId);
  const selectedShapeIds = useAppStore(state => state.selectedShapeIds);
  const dragState = useAppStore(state => state.dragState); // For live drag preview
  const cursorRotationMode = useAppStore(state => state.cursorRotationMode); // Check if in rotation mode

  // Phase 4: Get text objects for mixed groups
  const texts = useTextStore(state => state.texts);
  const selectedTextId = useTextStore(state => state.selectedTextId);

  // Determine which groups should show boundaries
  const visibleGroups = useMemo(() => {
    const groupMap = new Map<string, any[]>();

    // Collect all shapes that have a groupId
    const groupedShapes = shapes.filter(shape => shape.groupId);

    // Phase 4: Also collect text objects that have groupId
    const groupedTexts = texts.filter(text => text.groupId);

    // Group shapes by their groupId
    groupedShapes.forEach(shape => {
      const groupId = shape.groupId!;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId)!.push(shape);
    });

    // Phase 4: Also add text objects to their respective groups
    groupedTexts.forEach((text: any) => {
      const groupId = text.groupId!;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId)!.push(text);
    });

    // Determine which groups are visible (hovered OR selected)
    const visibleGroupIds = new Set<string>();

    // Add hovered group
    // BUT: Don't show hover boundary if in rotation mode (RotationControls + MultiSelectionBoundary handle that)
    if (hoveredGroupId && !cursorRotationMode) {
      visibleGroupIds.add(hoveredGroupId);
    }

    // Add groups with selected shapes OR text
    // Phase 4: Show boundary if ANY element in the group is selected (shape or text)
    // This ensures mixed groups (shapes + text) show purple boundary
    if (!cursorRotationMode) {
      // Check selected shapes
      selectedShapeIds?.forEach(selectedId => {
        const selectedShape = shapes.find(s => s.id === selectedId);
        if (selectedShape?.groupId) {
          visibleGroupIds.add(selectedShape.groupId);
        }
      });

      // Phase 4: Also check selected text
      if (selectedTextId) {
        const selectedText = texts.find(t => t.id === selectedTextId);
        if (selectedText?.groupId) {
          visibleGroupIds.add(selectedText.groupId);
        }
      }
    }

    // Build result: array of { groupId, elements, isVisible }
    const result = Array.from(groupMap.entries()).map(([groupId, groupElements]) => {
      const isVisible = visibleGroupIds.has(groupId);

      return {
        groupId,
        elements: groupElements, // Keep 'elements' key for compatibility with GroupBoundary component
        isVisible,
      };
    });

    return result;
  }, [shapes, texts, hoveredGroupId, selectedShapeIds, selectedTextId, cursorRotationMode]);

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
