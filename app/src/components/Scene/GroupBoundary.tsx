/**
 * GroupBoundary Component
 * Renders a purple dashed boundary around grouped shapes (Canva-style)
 * Shows on hover or when group is selected
 */

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Shape, DragState } from '../../types';
import { getWorldPoints, calculateBoundingBox } from '../../utils/geometryTransforms';

interface GroupBoundaryProps {
  groupId: string;
  shapes: Shape[];
  isVisible: boolean;
  dragState?: DragState; // For live drag preview
}

const BOUNDARY_COLOR = '#9333EA'; // Purple matching highlighted shape
const PADDING = 0.08; // 8px padding in world units (0.08m)

export const GroupBoundary: React.FC<GroupBoundaryProps> = ({
  groupId,
  shapes,
  isVisible,
  dragState,
}) => {
  // Calculate boundary points with padding (including drag offset for live preview)
  const boundaryPoints = useMemo(() => {
    if (!isVisible || shapes.length === 0) {
      return null;
    }

    // Check if any shape in this group is being dragged
    const isGroupBeingDragged = dragState?.isDragging &&
      shapes.some(s => s.id === dragState.draggedShapeId || dragState.originalShapesData?.has(s.id));

    // Calculate bounding box from ORIGINAL (unrotated) points
    // This keeps the boundary size constant
    const allOriginalPoints = shapes.flatMap(shape => shape.points);
    if (allOriginalPoints.length === 0) return null;

    const originalBbox = calculateBoundingBox(allOriginalPoints);

    // Get the group's rotation (use first shape's rotation as they all rotate together)
    const groupRotation = shapes[0]?.rotation;
    const rotationAngle = groupRotation?.angle || 0;
    const rotationCenter = groupRotation?.center || {
      x: (originalBbox.minX + originalBbox.maxX) / 2,
      y: (originalBbox.minY + originalBbox.maxY) / 2
    };

    // Calculate boundary rectangle corners (with padding) in original orientation
    const minX = originalBbox.minX - PADDING;
    const minY = originalBbox.minY - PADDING;
    const maxX = originalBbox.maxX + PADDING;
    const maxY = originalBbox.maxY + PADDING;

    // Create boundary corners
    let boundaryCorners = [
      { x: minX, y: minY }, // Bottom-left
      { x: maxX, y: minY }, // Bottom-right
      { x: maxX, y: maxY }, // Top-right
      { x: minX, y: maxY }, // Top-left
      { x: minX, y: minY }, // Close the loop
    ];

    // Rotate boundary corners if group is rotated
    if (rotationAngle !== 0) {
      const angleRadians = (rotationAngle * Math.PI) / 180;
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      boundaryCorners = boundaryCorners.map(corner => {
        const dx = corner.x - rotationCenter.x;
        const dy = corner.y - rotationCenter.y;
        return {
          x: rotationCenter.x + (dx * cos - dy * sin),
          y: rotationCenter.y + (dx * sin + dy * cos)
        };
      });
    }

    // Apply drag offset for live preview
    if (isGroupBeingDragged && dragState?.startPosition && dragState?.currentPosition) {
      const offsetX = dragState.currentPosition.x - dragState.startPosition.x;
      const offsetY = dragState.currentPosition.y - dragState.startPosition.y;

      boundaryCorners = boundaryCorners.map(corner => ({
        x: corner.x + offsetX,
        y: corner.y + offsetY
      }));
    }

    // Convert to Three.js coordinates
    // Coordinate mapping: Point2D.x → Three.js X, Point2D.y → Three.js Z, height → Three.js Y
    const points = boundaryCorners.map(corner => [corner.x, 0.01, corner.y]);

    return points;
  }, [shapes, isVisible, groupId, dragState?.isDragging, dragState?.draggedShapeId, dragState?.startPosition, dragState?.currentPosition, dragState?.originalShapesData, shapes.map(s => s.rotation?.angle || 0).join('|')]);

  // Don't render if not visible or no points
  if (!isVisible || !boundaryPoints) {
    return null;
  }

  return (
    <Line
      key={groupId}
      points={boundaryPoints}
      color={BOUNDARY_COLOR}
      lineWidth={3}
      dashed={true}
      dashScale={5}
      dashSize={2}
      dashOffset={0}
      gapSize={2}
    />
  );
};
