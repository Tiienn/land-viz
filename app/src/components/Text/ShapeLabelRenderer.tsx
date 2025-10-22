/**
 * ShapeLabelRenderer Component
 *
 * Renders text labels attached to shapes.
 * Labels inherit position and rotation from their parent shapes.
 */

import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTextStore } from '../../store/useTextStore';
import { useLayerStore } from '../../store/useLayerStore';
import { TextObject as TextObjectComponent } from './TextObject';
import { calculateLabelPosition } from '../../utils/textUtils';
import type { TextObject } from '../../types/text';

export const ShapeLabelRenderer: React.FC = () => {
  const shapes = useAppStore(state => state.shapes);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const selectText = useTextStore(state => state.selectText);
  const layers = useLayerStore(state => state.layers);

  // Get shapes with labels and filter by layer visibility
  // IMPORTANT: Check both layer visibility AND parent folder visibility recursively
  const shapesWithLabels = useMemo(() => {
    // Helper function to check if layer is visible (including parent folders)
    const isLayerVisible = (layerId: string): boolean => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) return false;

      // Layer itself must be visible
      if (layer.visible === false) return false;

      // If layer has a parent folder, check parent visibility recursively
      if (layer.parentId) {
        return isLayerVisible(layer.parentId);
      }

      // No parent or all parents are visible
      return true;
    };

    return shapes.filter(shape => {
      return shape.label && isLayerVisible(shape.layerId);
    });
  }, [shapes, layers]);

  // Render labels with calculated positions
  const labelRenders = useMemo(() => {
    return shapesWithLabels.map(shape => {
      if (!shape.label) return null;

      // Calculate shape center
      const centerX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
      const centerY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;

      // Calculate label position with offset and rotation
      const labelPosition = calculateLabelPosition(
        { x: centerX, y: centerY },
        shape.rotation?.angle || 0,
        shape.label.offset || { x: 0, y: 0 }
      );

      // Calculate combined rotation (shape + label)
      const totalRotation = (shape.rotation?.angle || 0) + (shape.label.rotation || 0);

      // Create text object with calculated position and rotation
      const textObject: TextObject = {
        ...shape.label,
        position: labelPosition,
        rotation: totalRotation
      };

      return (
        <TextObjectComponent
          key={`label-${shape.id}`}
          text={textObject}
          isSelected={shape.label.id === selectedTextId}
          onClick={() => selectText(shape.label!.id)}
        />
      );
    });
  }, [shapesWithLabels, selectedTextId, selectText]);

  return (
    <group name="shape-labels">
      {labelRenders}
    </group>
  );
};
