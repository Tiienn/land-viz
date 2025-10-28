/**
 * GroupBoundary Component
 * Renders a purple dashed boundary around grouped elements (Canva-style)
 * Shows on hover or when group is selected
 * Phase 5: Updated to support mixed groups (shapes + text)
 *
 * FIXED: Properly wraps rotated groups using OBB (Oriented Bounding Box) algorithm
 * - Transforms points to world space (apply individual rotations)
 * - Calculates centroid from transformed points
 * - Un-rotates to get tight local bounds
 * - Rotates boundary back around centroid
 */

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { Element, DragState, Point2D } from '../../types';
import { isShapeElement } from '../../types';
import { calculateBoundingBox } from '../../utils/geometryTransforms';
import { useAppStore } from '../../store/useAppStore';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

// Ground plane for raycasting (same as ResizableShapeControls)
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

interface GroupBoundaryProps {
  groupId: string;
  elements: Element[]; // Phase 5: Changed from shapes to elements
  isVisible: boolean;
  dragState?: DragState; // For live drag preview
}

/**
 * Type guard to check if element is a TextObject (from useTextStore)
 * TextObject has: type ('floating' | 'label'), position, content
 * ShapeElement has: points, shapeType
 */
function isTextObject(element: any): boolean {
  return element.type === 'floating' || element.type === 'label';
}

/**
 * Calculate bounds for text elements
 * Text has: position, fontSize, content, letterSpacing, lineHeight, backgroundColor
 *
 * CRITICAL: Must match TextObject.tsx rendering exactly!
 * - TextObject uses drei's Html component with distanceFactor
 * - distanceFactor controls CSS pixel → world unit scaling
 * - Formula: visual_size_in_world = CSS_size / distanceFactor
 *
 * From TextObject.tsx:
 * - 2D mode: distanceFactor = 2.5 (line 76)
 * - 3D mode: distanceFactor = 20 (line 130)
 */
function calculateTextBounds(element: any): { minX: number; minY: number; maxX: number; maxY: number } {
  const pos = element.position;
  const fontSize = element.fontSize || 16;
  const letterSpacing = (element.letterSpacing || 0) / 100; // Convert to em (adds to char width)
  const lineHeight = element.lineHeight || 1.5;
  const content = element.content || '';

  // Split content into lines for multi-line support
  const lines = content.split('\n');
  const lineCount = Math.max(lines.length, 1);
  const longestLineLength = Math.max(...lines.map(line => line.length), 1);

  // MATCH TextObject.tsx distanceFactor!
  // In 2D mode (which we're always in for the group boundary view), distanceFactor = 2.5
  // This means: world_size = CSS_pixels / distanceFactor
  const DISTANCE_FACTOR = 2.5; // From TextObject.tsx line 76 (2D mode)

  // Calculate height in world units
  // The browser renders text with full lineHeight spacing, so we use the full value
  // without reduction. The visual text box height matches fontSize * lineHeight * lineCount.
  const lineHeightWorld = (fontSize * lineHeight) / DISTANCE_FACTOR;
  const textHeight = lineHeightWorld * lineCount;

  // Calculate width in world units
  // Average character width is ~0.6em (60% of fontSize)
  const avgCharWidthCss = fontSize * (0.6 + letterSpacing); // CSS pixels
  const avgCharWidthWorld = avgCharWidthCss / DISTANCE_FACTOR; // World units
  const textWidth = longestLineLength * avgCharWidthWorld;

  // Add padding if background is present
  const paddingXCss = element.backgroundColor ? 24 : 0; // 12px each side (CSS pixels)
  const paddingYCss = element.backgroundColor ? 16 : 0; // 8px each side (CSS pixels)
  const paddingXWorld = paddingXCss / DISTANCE_FACTOR;
  const paddingYWorld = paddingYCss / DISTANCE_FACTOR;

  // Add generous buffer for visual accuracy (text rendering can be unpredictable)
  // Note: Extra vertical buffer needed because browser renders line-height with
  // additional space for ascenders/descenders and CSS box model
  const widthBufferFactor = 1.3;
  const heightBufferFactor = 1.8; // Increased to 1.8 for generous coverage
  const totalWidth = (textWidth + paddingXWorld) * widthBufferFactor;
  const totalHeight = (textHeight + paddingYWorld) * heightBufferFactor;

  // Calculate bounds in world space (centered on position)
  const halfWidth = totalWidth / 2;
  const halfHeight = totalHeight / 2;

  const bounds = {
    minX: pos.x - halfWidth,
    minY: pos.y - halfHeight,
    maxX: pos.x + halfWidth,
    maxY: pos.y + halfHeight
  };

  return bounds;
}

const BOUNDARY_COLOR = '#9333EA'; // Purple matching highlighted shape
const PADDING = 0.08; // 8px padding in world units (0.08m)
const HANDLE_SIZE = 1.0; // Size of resize handles (increased for better visibility)

/**
 * ThickDashedLine Component
 * Uses multiple segments to create a visible dashed line
 * SIMPLER APPROACH: Draw individual line segments with MeshBasicMaterial
 */
const ThickDashedLine: React.FC<{ points: number[][]; color: string; lineWidth: number }> = ({ points, color }) => {
  // Create line segments for dashed effect
  const segments = useMemo(() => {
    const dashLength = 0.4; // 40cm dash
    const gapLength = 0.3; // 30cm gap
    const totalDashCycle = dashLength + gapLength;

    const result: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];

    // For each pair of points
    for (let i = 0; i < points.length - 1; i++) {
      const start = new THREE.Vector3(points[i][0], points[i][1], points[i][2]);
      const end = new THREE.Vector3(points[i + 1][0], points[i + 1][1], points[i + 1][2]);

      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      direction.normalize();

      // Create dashes along this segment
      let currentDist = 0;
      while (currentDist < length) {
        const dashStart = currentDist;
        const dashEnd = Math.min(currentDist + dashLength, length);

        const segStart = new THREE.Vector3()
          .copy(start)
          .add(direction.clone().multiplyScalar(dashStart));
        const segEnd = new THREE.Vector3()
          .copy(start)
          .add(direction.clone().multiplyScalar(dashEnd));

        result.push({ start: segStart, end: segEnd });

        currentDist += totalDashCycle;
      }
    }

    return result;
  }, [points]);

  // Render each dash as a tube
  return (
    <group>
      {segments.map((seg, index) => {
        const direction = new THREE.Vector3().subVectors(seg.end, seg.start);
        const length = direction.length();
        const midpoint = new THREE.Vector3().addVectors(seg.start, seg.end).multiplyScalar(0.5);

        // Create a cylinder oriented along the segment
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          axis,
          direction.clone().normalize()
        );

        return (
          <mesh key={index} position={midpoint} quaternion={quaternion}>
            <cylinderGeometry args={[0.04, 0.04, length, 8]} />
            <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.9} />
          </mesh>
        );
      })}
    </group>
  );
};

export const GroupBoundary: React.FC<GroupBoundaryProps> = ({
  groupId,
  elements,
  isVisible,
  dragState,
}) => {
  const { camera, raycaster, gl } = useThree();

  // Get resize methods from store
  const resizeMultiSelection = useAppStore(state => state.resizeMultiSelection);
  const resizeMultiSelectionLive = useAppStore(state => state.resizeMultiSelectionLive);
  const saveToHistory = useAppStore(state => state.saveToHistory);

  // Track drag state for resize
  const resizeDragState = useRef<{
    isDragging: boolean;
    handleIndex: number;
    handleType: 'corner' | 'edge';
    startWorldPos: { x: number; y: number }; // World space position when drag started
    originalBounds: { minX: number; minY: number; maxX: number; maxY: number };
    originalElements: Map<string, Element>;
  } | null>(null);

  // Track hover state
  const [hoveredHandle, setHoveredHandle] = React.useState<number | null>(null);
  const [cursorOverride, setCursorOverride] = React.useState<string | null>(null);

  // Track current bounds during drag (for handle positioning only)
  const [currentBounds, setCurrentBounds] = React.useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);

  // Apply cursor to the canvas element
  useEffect(() => {
    if (cursorOverride) {
      gl.domElement.style.cursor = cursorOverride;
    } else if (!resizeDragState.current?.isDragging) {
      gl.domElement.style.cursor = '';
    }
  }, [cursorOverride, gl.domElement]);

  // Detect common rotation angle for Canva-style rotated boundaries
  const groupRotation = useMemo(() => {
    if (!elements || elements.length === 0) return null;

    // Elements passed are already Shape objects, no filtering needed
    // Check if all shapes have rotation metadata
    const firstShape = elements[0] as any;
    if (!firstShape.rotation) return null;

    const firstAngle = firstShape.rotation.angle;

    // Check if all shapes have the same rotation angle
    const allSameRotation = elements.every((shape: any) =>
      shape.rotation && Math.abs(shape.rotation.angle - firstAngle) < 0.1
    );

    if (!allSameRotation) return null;

    return firstAngle;
  }, [elements]);

  // Calculate bounding box and rotation center for all elements
  // For rotated groups: calculate in LOCAL (unrotated) space for tight wrap
  const boundsData = useMemo(() => {
    if (!elements || elements.length === 0) return null;

    // Elements are already Shape objects, no filtering needed
    const shouldUnrotate = groupRotation !== null && groupRotation !== 0;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let actualRotationCenter: { x: number; y: number } | null = null;

    if (shouldUnrotate) {
      // STEP 1: Transform all points to world space (apply individual element rotations)
      // Phase 4: Support both shapes (with points) and text (with position)
      const transformedPointsPerElement: Point2D[][] = elements.map((element: any) => {
        // Phase 4: Handle text elements
        if (isTextObject(element)) {
          // For text, calculate bounding box corners
          const textBounds = calculateTextBounds(element);
          const corners = [
            { x: textBounds.minX, y: textBounds.minY },
            { x: textBounds.maxX, y: textBounds.minY },
            { x: textBounds.maxX, y: textBounds.maxY },
            { x: textBounds.minX, y: textBounds.maxY },
          ];

          // Apply text rotation if any
          if (element.rotation && element.rotation !== 0) {
            const angleRad = (element.rotation * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const centerX = element.position.x;
            const centerY = element.position.y;

            return corners.map(corner => {
              const dx = corner.x - centerX;
              const dy = corner.y - centerY;
              return {
                x: centerX + (dx * cos - dy * sin),
                y: centerY + (dx * sin + dy * cos)
              };
            });
          }

          return corners;
        }

        // Handle shape elements
        if (!element.rotation || element.rotation.angle === 0) {
          return element.points; // No rotation needed
        }

        // Apply shape's own rotation to its points
        const shapeAngle = element.rotation.angle;
        const shapeCenter = element.rotation.center;
        const angleRad = (shapeAngle * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        return element.points.map((point: Point2D) => {
          const dx = point.x - shapeCenter.x;
          const dy = point.y - shapeCenter.y;
          return {
            x: shapeCenter.x + (dx * cos - dy * sin),
            y: shapeCenter.y + (dx * sin + dy * cos)
          };
        });
      });

      // STEP 2: Calculate centroid from transformed points (Canva approach)
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      transformedPointsPerElement.forEach(points => {
        points.forEach(point => {
          sumX += point.x;
          sumY += point.y;
          count++;
        });
      });
      const rotationCenter = { x: sumX / count, y: sumY / count };

      actualRotationCenter = rotationCenter;
      const groupCenterX = rotationCenter.x;
      const groupCenterY = rotationCenter.y;

      // STEP 3: UN-ROTATE transformed points around centroid to get tight local bounds
      const angleRadians = (-groupRotation * Math.PI) / 180; // Negative to un-rotate
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      transformedPointsPerElement.forEach(points => {
        points.forEach(point => {
          const dx = point.x - groupCenterX;
          const dy = point.y - groupCenterY;
          const unrotatedX = groupCenterX + (dx * cos - dy * sin);
          const unrotatedY = groupCenterY + (dx * sin + dy * cos);

          minX = Math.min(minX, unrotatedX);
          minY = Math.min(minY, unrotatedY);
          maxX = Math.max(maxX, unrotatedX);
          maxY = Math.max(maxY, unrotatedY);
        });
      });
      // STEP 4: Boundary will be rotated back in boundaryPoints calculation
    } else {
      // No rotation or mixed rotations: use normal axis-aligned bounds
      // Phase 4: Handle both shapes (with points) and text (with position)
      elements.forEach((element: any) => {
        // Phase 4: Handle text elements
        if (isTextObject(element)) {
          const textBounds = calculateTextBounds(element);
          minX = Math.min(minX, textBounds.minX);
          minY = Math.min(minY, textBounds.minY);
          maxX = Math.max(maxX, textBounds.maxX);
          maxY = Math.max(maxY, textBounds.maxY);
        }
        // Handle shape elements
        else if (element.points) {
          element.points.forEach((point: Point2D) => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        }
      });
    }

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return null;
    }

    return {
      bounds: { minX, minY, maxX, maxY },
      rotationCenter: actualRotationCenter
    };
  }, [elements]);

  // Calculate boundary points with padding (Canva-style: rotates with shapes)
  const boundaryPoints = useMemo(() => {
    if (!isVisible || !boundsData) {
      return null;
    }

    const { bounds, rotationCenter } = boundsData;

    // Check if any element in this group is being dragged
    const isGroupBeingDragged = dragState?.isDragging &&
      elements.some(el => el.id === dragState.draggedShapeId || dragState?.originalShapesData?.has(el.id));

    const boundMinX = bounds.minX - PADDING;
    const boundMinY = bounds.minY - PADDING;
    const boundMaxX = bounds.maxX + PADDING;
    const boundMaxY = bounds.maxY + PADDING;

    // Create boundary corners
    let boundaryCorners = [
      { x: boundMinX, y: boundMinY }, // Bottom-left
      { x: boundMaxX, y: boundMinY }, // Bottom-right
      { x: boundMaxX, y: boundMaxY }, // Top-right
      { x: boundMinX, y: boundMaxY }, // Top-left
      { x: boundMinX, y: boundMinY }, // Close the loop
    ];

    // Canva-style: Rotate boundary if all shapes share the same rotation
    if (groupRotation !== null && groupRotation !== 0 && rotationCenter) {
      // Use the ACTUAL rotation center, not the center of bounds!
      const centerX = rotationCenter.x;
      const centerY = rotationCenter.y;
      const angleRadians = (groupRotation * Math.PI) / 180;
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      boundaryCorners = boundaryCorners.map(corner => {
        const dx = corner.x - centerX;
        const dy = corner.y - centerY;
        return {
          x: centerX + (dx * cos - dy * sin),
          y: centerY + (dx * sin + dy * cos)
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
    const threeJsPoints = boundaryCorners.map(corner => [corner.x, 0.01, corner.y]);

    return threeJsPoints;
  }, [boundsData, groupRotation, dragState]);

  // Extract bounds for backward compatibility
  const bounds = boundsData?.bounds ?? null;

  // Calculate resize handles (4 corners + 4 edges) - Canva-style: rotates with boundary
  const resizeHandles = useMemo(() => {
    if (!bounds || !boundsData) return [];

    // Use currentBounds during drag (follows cursor), otherwise use actual bounds
    const activeBounds = currentBounds || bounds;

    const boundMinX = activeBounds.minX - PADDING;
    const boundMinY = activeBounds.minY - PADDING;
    const boundMaxX = activeBounds.maxX + PADDING;
    const boundMaxY = activeBounds.maxY + PADDING;

    const centerX = (boundMinX + boundMaxX) / 2;
    const centerY = (boundMinY + boundMaxY) / 2;

    // Create handles in unrotated orientation
    let handles = [
      // Corners
      { x: boundMinX, y: boundMinY, type: 'corner' as const, cursor: 'nwse-resize' }, // 0: Bottom-left
      { x: boundMaxX, y: boundMinY, type: 'corner' as const, cursor: 'nesw-resize' }, // 1: Bottom-right
      { x: boundMaxX, y: boundMaxY, type: 'corner' as const, cursor: 'nwse-resize' }, // 2: Top-right
      { x: boundMinX, y: boundMaxY, type: 'corner' as const, cursor: 'nesw-resize' }, // 3: Top-left
      // Edges
      { x: centerX, y: boundMinY, type: 'edge' as const, cursor: 'ns-resize' },        // 4: Bottom edge
      { x: boundMaxX, y: centerY, type: 'edge' as const, cursor: 'ew-resize' },        // 5: Right edge
      { x: centerX, y: boundMaxY, type: 'edge' as const, cursor: 'ns-resize' },        // 6: Top edge
      { x: boundMinX, y: centerY, type: 'edge' as const, cursor: 'ew-resize' },        // 7: Left edge
    ];

    // Canva-style: Rotate handles if group has rotation
    if (groupRotation !== null && groupRotation !== 0 && boundsData.rotationCenter) {
      // Use the ACTUAL rotation center, not the center of bounds!
      const handleCenterX = boundsData.rotationCenter.x;
      const handleCenterY = boundsData.rotationCenter.y;
      const angleRadians = (groupRotation * Math.PI) / 180;
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      handles = handles.map(handle => {
        const dx = handle.x - handleCenterX;
        const dy = handle.y - handleCenterY;
        return {
          ...handle,
          x: handleCenterX + (dx * cos - dy * sin),
          y: handleCenterY + (dx * sin + dy * cos)
        };
      });
    }

    return handles;
  }, [bounds, boundsData, currentBounds, groupRotation]);

  // Handle pointer move (attached to document during drag)
  const handlePointerMove = useCallback((event: MouseEvent) => {
    if (!resizeDragState.current?.isDragging) return;

    const { handleIndex, startWorldPos, originalBounds } = resizeDragState.current;

    // Get current world position using raycasting
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, intersection)) {
      return; // No intersection, skip this frame
    }

    const currentWorldPos = { x: intersection.x, y: intersection.z };

    // DELTA-BASED APPROACH: Calculate how much cursor moved from start
    // This matches single-shape resize behavior exactly
    const deltaX = currentWorldPos.x - startWorldPos.x;
    const deltaY = currentWorldPos.y - startWorldPos.y;

    // Apply delta to ORIGINAL bounds (not current bounds)
    let newMinX = originalBounds.minX;
    let newMinY = originalBounds.minY;
    let newMaxX = originalBounds.maxX;
    let newMaxY = originalBounds.maxY;

    // Handle corners (0-3)
    if (handleIndex === 0) {
      // Bottom-left corner: move left and bottom edges by delta
      newMinX = originalBounds.minX + deltaX;
      newMinY = originalBounds.minY + deltaY;
    } else if (handleIndex === 1) {
      // Bottom-right corner: move right and bottom edges by delta
      newMaxX = originalBounds.maxX + deltaX;
      newMinY = originalBounds.minY + deltaY;
    } else if (handleIndex === 2) {
      // Top-right corner: move right and top edges by delta
      newMaxX = originalBounds.maxX + deltaX;
      newMaxY = originalBounds.maxY + deltaY;
    } else if (handleIndex === 3) {
      // Top-left corner: move left and top edges by delta
      newMinX = originalBounds.minX + deltaX;
      newMaxY = originalBounds.maxY + deltaY;
    }
    // Handle edges (4-7)
    else if (handleIndex === 4) {
      // Bottom edge: move bottom edge by delta
      newMinY = originalBounds.minY + deltaY;
    } else if (handleIndex === 5) {
      // Right edge: move right edge by delta
      newMaxX = originalBounds.maxX + deltaX;
    } else if (handleIndex === 6) {
      // Top edge: move top edge by delta
      newMaxY = originalBounds.maxY + deltaY;
    } else if (handleIndex === 7) {
      // Left edge: move left edge by delta
      newMinX = originalBounds.minX + deltaX;
    }

    // Calculate scale factors
    const originalWidth = originalBounds.maxX - originalBounds.minX;
    const originalHeight = originalBounds.maxY - originalBounds.minY;
    const newWidth = newMaxX - newMinX;
    const newHeight = newMaxY - newMinY;

    if (originalWidth === 0 || originalHeight === 0 || newWidth <= 0 || newHeight <= 0) {
      return;
    }

    const scaleX = newWidth / originalWidth;
    const scaleY = newHeight / originalHeight;

    // UNIFORM SCALING: Shapes maintain aspect ratio (squares stay squares, circles stay circles)
    let uniformScale: number;
    if (handleIndex >= 0 && handleIndex <= 3) {
      uniformScale = Math.max(scaleX, scaleY);
    } else if (handleIndex === 4 || handleIndex === 6) {
      uniformScale = scaleY;
    } else {
      uniformScale = scaleX;
    }

    const translateX = newMinX - originalBounds.minX;
    const translateY = newMinY - originalBounds.minY;

    // Update current bounds for handle positioning
    setCurrentBounds({ minX: newMinX, minY: newMinY, maxX: newMaxX, maxY: newMaxY });

    // Apply live resize preview with UNIFORM SCALING
    resizeMultiSelectionLive(
      Array.from(resizeDragState.current.originalElements.keys()),
      originalBounds,
      { minX: newMinX, minY: newMinY, maxX: newMaxX, maxY: newMaxY },
      uniformScale,  // Same scale for X
      uniformScale,  // Same scale for Y
      translateX,
      translateY
    );
  }, [resizeMultiSelectionLive, gl.domElement, camera, raycaster]);

  // Handle pointer up (attached to document during drag)
  const handlePointerUp = useCallback((event: MouseEvent) => {
    if (!resizeDragState.current?.isDragging) return;

    const { handleIndex, startWorldPos, originalBounds } = resizeDragState.current;

    // Get final world position using raycasting
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, intersection)) {
      // No intersection, cancel resize
      resizeDragState.current = null;
      setCursorOverride(null);
      setCurrentBounds(null);
      // Remove document listeners
      document.removeEventListener('pointermove', handlePointerMove as any);
      document.removeEventListener('pointerup', handlePointerUp as any);
      return;
    }

    const currentWorldPos = { x: intersection.x, y: intersection.z };

    // DELTA-BASED APPROACH: Same as pointer move
    const deltaX = currentWorldPos.x - startWorldPos.x;
    const deltaY = currentWorldPos.y - startWorldPos.y;

    let newMinX = originalBounds.minX;
    let newMinY = originalBounds.minY;
    let newMaxX = originalBounds.maxX;
    let newMaxY = originalBounds.maxY;

    if (handleIndex === 0) {
      newMinX = originalBounds.minX + deltaX;
      newMinY = originalBounds.minY + deltaY;
    } else if (handleIndex === 1) {
      newMaxX = originalBounds.maxX + deltaX;
      newMinY = originalBounds.minY + deltaY;
    } else if (handleIndex === 2) {
      newMaxX = originalBounds.maxX + deltaX;
      newMaxY = originalBounds.maxY + deltaY;
    } else if (handleIndex === 3) {
      newMinX = originalBounds.minX + deltaX;
      newMaxY = originalBounds.maxY + deltaY;
    } else if (handleIndex === 4) {
      newMinY = originalBounds.minY + deltaY;
    } else if (handleIndex === 5) {
      newMaxX = originalBounds.maxX + deltaX;
    } else if (handleIndex === 6) {
      newMaxY = originalBounds.maxY + deltaY;
    } else if (handleIndex === 7) {
      newMinX = originalBounds.minX + deltaX;
    }

    const originalWidth = originalBounds.maxX - originalBounds.minX;
    const originalHeight = originalBounds.maxY - originalBounds.minY;
    const newWidth = newMaxX - newMinX;
    const newHeight = newMaxY - newMinY;

    if (originalWidth > 0 && originalHeight > 0 && newWidth > 0 && newHeight > 0) {
      const scaleX = newWidth / originalWidth;
      const scaleY = newHeight / originalHeight;

      // UNIFORM SCALING: Same logic as pointer move
      let uniformScale: number;
      if (handleIndex >= 0 && handleIndex <= 3) {
        uniformScale = Math.max(scaleX, scaleY);
      } else if (handleIndex === 4 || handleIndex === 6) {
        uniformScale = scaleY;
      } else {
        uniformScale = scaleX;
      }

      const translateX = newMinX - originalBounds.minX;
      const translateY = newMinY - originalBounds.minY;

      // Apply final resize with UNIFORM SCALING
      resizeMultiSelection(
        Array.from(resizeDragState.current.originalElements.keys()),
        originalBounds,
        { minX: newMinX, minY: newMinY, maxX: newMaxX, maxY: newMaxY },
        uniformScale,  // Same scale for X
        uniformScale,  // Same scale for Y
        translateX,
        translateY
      );

      // Save to history
      saveToHistory();
    }

    // Reset drag state
    resizeDragState.current = null;
    setCursorOverride(null);
    setCurrentBounds(null); // Clear current bounds

    // Remove document listeners
    document.removeEventListener('pointermove', handlePointerMove as any);
    document.removeEventListener('pointerup', handlePointerUp as any);
  }, [resizeMultiSelection, saveToHistory, gl.domElement, camera, raycaster, handlePointerMove]);

  // Handle pointer down on resize handles (defined AFTER handlePointerMove/Up)
  const handlePointerDown = useCallback((event: any, handleIndex: number) => {
    if (!bounds || !resizeHandles[handleIndex]) return;

    event.stopPropagation();

    // Get initial world position using raycasting
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, intersection)) {
      return; // No intersection, can't start drag
    }

    // Save initial state with world space position
    resizeDragState.current = {
      isDragging: true,
      handleIndex,
      handleType: resizeHandles[handleIndex].type,
      startWorldPos: { x: intersection.x, y: intersection.z },
      originalBounds: { ...bounds },
      originalElements: new Map(elements.map(el => [el.id, { ...el, points: isShapeElement(el) ? [...el.points] : [] }])),
    };

    // Set cursor
    setCursorOverride(resizeHandles[handleIndex].cursor);

    // Attach move/up listeners to document so they work even when cursor leaves the handle
    document.addEventListener('pointermove', handlePointerMove as any);
    document.addEventListener('pointerup', handlePointerUp as any);
  }, [bounds, resizeHandles, elements, gl.domElement, camera, raycaster, handlePointerMove, handlePointerUp]);

  // Cleanup on unmount - use refs to avoid recreating effect on every render
  const handlePointerMoveRef = useRef(handlePointerMove);
  const handlePointerUpRef = useRef(handlePointerUp);

  // Update refs when handlers change
  useEffect(() => {
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerUpRef.current = handlePointerUp;
  }, [handlePointerMove, handlePointerUp]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      if (resizeDragState.current?.isDragging) {
        resizeDragState.current = null;
        setCursorOverride(null);
        // Remove document listeners using refs (always has latest handler)
        document.removeEventListener('pointermove', handlePointerMoveRef.current as any);
        document.removeEventListener('pointerup', handlePointerUpRef.current as any);
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // Don't render if not visible or no points
  if (!isVisible || !boundaryPoints) {
    return null;
  }

  return (
    <group>
      {/* Dashed border - using Line2 for thick dashed lines in WebGL */}
      <ThickDashedLine
        key={groupId}
        points={boundaryPoints}
        color={BOUNDARY_COLOR}
        lineWidth={3}
      />

      {/* Resize handles */}
      {resizeHandles.map((handle, index) => (
        <Box
          key={`handle-${index}`}
          args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
          position={[handle.x, 0.02, handle.y]}
          onPointerDown={(e) => handlePointerDown(e, index)}
          onPointerEnter={() => {
            setHoveredHandle(index);
            if (!resizeDragState.current?.isDragging) {
              setCursorOverride(handle.cursor);
            }
          }}
          onPointerLeave={() => {
            setHoveredHandle(null);
            if (!resizeDragState.current?.isDragging) {
              setCursorOverride(null);
            }
          }}
        >
          <meshBasicMaterial
            color={hoveredHandle === index ? '#FFD700' : '#FFFFFF'} // Gold on hover, white otherwise
            transparent
            opacity={0.9}
          />
        </Box>
      ))}
    </group>
  );
};
