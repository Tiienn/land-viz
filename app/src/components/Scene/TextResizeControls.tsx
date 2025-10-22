/**
 * TextResizeControls Component
 *
 * Phase 4B: Text as Layers - Text Element Resize Operations
 *
 * Renders 8 resize handles for text elements with different scaling behavior:
 * - Corner handles (4): Scale fontSize AND text box proportionally
 * - Edge handles (4): Scale one dimension, fontSize adjusts to fit
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Box, Sphere } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import type { TextElement, Point2D } from '@/types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { logger } from '@/utils/logger';

// Font size constraints from spec (FR-2)
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 200;

interface TextBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  center: { x: number; y: number };
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface TextResizeControlsProps {
  element: TextElement;
  elevation?: number;
}

/**
 * Calculate estimated text bounding box
 * Formula from plan.md lines 1513-1549
 */
function calculateTextBounds(element: TextElement): TextBounds {
  // Estimate based on fontSize and content length
  const estimatedWidth = element.fontSize * element.content.length * 0.6;
  const estimatedHeight = element.fontSize * element.lineHeight;

  const left = element.position.x - estimatedWidth / 2;
  const top = element.position.y - estimatedHeight / 2;

  return {
    left,
    top,
    width: estimatedWidth,
    height: estimatedHeight,
    center: {
      x: element.position.x,
      y: element.position.y,
    },
    minX: left,
    minY: top,
    maxX: left + estimatedWidth,
    maxY: top + estimatedHeight,
  };
}

/**
 * Calculate resize handles positions for text element
 */
function calculateHandlePositions(bounds: TextBounds) {
  const { minX, maxX, minY, maxY } = bounds;

  // Corner handles (4 positions)
  const corners = [
    { x: minX, y: minY }, // Top-left (0)
    { x: maxX, y: minY }, // Top-right (1)
    { x: maxX, y: maxY }, // Bottom-right (2)
    { x: minX, y: maxY }, // Bottom-left (3)
  ];

  // Edge handles (4 midpoints)
  const edges = [
    { x: (minX + maxX) / 2, y: minY }, // Top (0)
    { x: maxX, y: (minY + maxY) / 2 }, // Right (1)
    { x: (minX + maxX) / 2, y: maxY }, // Bottom (2)
    { x: minX, y: (minY + maxY) / 2 }, // Left (3)
  ];

  return { corners, edges };
}

export const TextResizeControls: React.FC<TextResizeControlsProps> = ({
  element,
  elevation = 0.01,
}) => {
  const { camera, raycaster, gl } = useThree();

  // Store actions
  const updateElement = useAppStore(state => state.updateElement);
  const saveToHistory = useAppStore(state => state.saveToHistory);
  const selectedElementIds = useAppStore(state => state.selectedElementIds);
  const activeTool = useAppStore(state => state.drawing.activeTool);

  // Hover state
  const [hoveredHandle, setHoveredHandle] = useState<{ type: 'corner' | 'edge'; index: number } | null>(null);
  const [cursorOverride, setCursorOverride] = useState<string | null>(null);

  // Drag state
  const dragState = useRef({
    isDragging: false,
    handleType: null as 'corner' | 'edge' | null,
    handleIndex: null as number | null,
    originalFontSize: element.fontSize,
    originalBounds: null as TextBounds | null,
    pointerId: null as number | null,
  });

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  // Apply cursor to canvas
  useEffect(() => {
    if (cursorOverride) {
      gl.domElement.style.cursor = cursorOverride;
    } else {
      gl.domElement.style.cursor = '';
    }
    return () => {
      gl.domElement.style.cursor = '';
    };
  }, [cursorOverride, gl.domElement]);

  // Check if this element is selected and select tool is active
  const isActive = useMemo(() => {
    return selectedElementIds.includes(element.id) && activeTool === 'select';
  }, [selectedElementIds, element.id, activeTool]);

  // Calculate current text bounds
  const textBounds = useMemo(() => calculateTextBounds(element), [element]);

  // Calculate handle positions
  const handles = useMemo(() => calculateHandlePositions(textBounds), [textBounds]);

  /**
   * Corner Handle Scaling (Proportional)
   * Formula from plan.md lines 1431-1456
   */
  const calculateCornerScaleFactor = useCallback((
    dragPoint: Point2D,
    originalBounds: TextBounds
  ): number => {
    // Calculate diagonal distance from center to drag position
    const dragDiagonal = Math.sqrt(
      Math.pow(dragPoint.x - originalBounds.center.x, 2) +
      Math.pow(dragPoint.y - originalBounds.center.y, 2)
    );

    // Calculate original diagonal
    const originalDiagonal = Math.sqrt(
      Math.pow(originalBounds.width / 2, 2) +
      Math.pow(originalBounds.height / 2, 2)
    );

    // Scale factor
    return dragDiagonal / originalDiagonal;
  }, []);

  /**
   * Edge Handle Scaling (Dimensional)
   * Formula from plan.md lines 1458-1510
   */
  const calculateEdgeScaleFactor = useCallback((
    dragPoint: Point2D,
    handleIndex: number,
    originalBounds: TextBounds
  ): number => {
    // handleIndex: 0=Top, 1=Right, 2=Bottom, 3=Left
    if (handleIndex === 0 || handleIndex === 2) {
      // North/South handles - adjust height
      const newHeight = handleIndex === 0
        ? originalBounds.height + (originalBounds.top - dragPoint.y)  // North: dragging upward increases height
        : dragPoint.y - originalBounds.top;  // South: dragging downward increases height

      return newHeight / originalBounds.height;
    } else {
      // East/West handles - adjust width
      const newWidth = handleIndex === 1
        ? dragPoint.x - originalBounds.left  // East: dragging rightward increases width
        : originalBounds.width + (originalBounds.left - dragPoint.x);  // West: dragging leftward increases width

      return newWidth / originalBounds.width;
    }
  }, []);

  /**
   * Pointer move handler for live resize
   */
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (
      !dragState.current.isDragging ||
      !dragState.current.handleType ||
      dragState.current.handleIndex === null ||
      !dragState.current.originalBounds ||
      (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Convert mouse position to world coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const dragPoint: Point2D = { x: intersection.x, y: intersection.z };

      // Calculate scale factor based on handle type
      let scaleFactor: number;
      if (dragState.current.handleType === 'corner') {
        scaleFactor = calculateCornerScaleFactor(dragPoint, dragState.current.originalBounds);
      } else {
        scaleFactor = calculateEdgeScaleFactor(
          dragPoint,
          dragState.current.handleIndex,
          dragState.current.originalBounds
        );
      }

      // Calculate new font size
      const newFontSize = Math.max(
        MIN_FONT_SIZE,
        Math.min(MAX_FONT_SIZE, dragState.current.originalFontSize * scaleFactor)
      );

      // Update element with new font size
      updateElement(element.id, { fontSize: newFontSize });
    }
  }, [
    camera,
    raycaster,
    gl.domElement,
    groundPlane,
    calculateCornerScaleFactor,
    calculateEdgeScaleFactor,
    element.id,
    updateElement,
  ]);

  /**
   * Pointer up handler to finish resize
   */
  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (
      !dragState.current.isDragging ||
      (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)
    ) {
      return;
    }

    logger.info('[TextResizeControls] Finishing resize', {
      elementId: element.id,
      oldSize: dragState.current.originalFontSize,
      newSize: element.fontSize,
    });

    // Clean up drag state
    dragState.current.isDragging = false;
    dragState.current.handleType = null;
    dragState.current.handleIndex = null;
    dragState.current.originalBounds = null;
    dragState.current.pointerId = null;

    // Remove event listeners
    document.removeEventListener('pointermove', handlePointerMove, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointercancel', handlePointerUp, true);

    // Reset cursor
    setCursorOverride(null);
  }, [handlePointerMove, element.id, element.fontSize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Don't render if element is not selected or tool is not select
  if (!isActive) {
    return null;
  }

  return (
    <group name="text-resize-controls">
      {/* Corner Handles - Proportional Scaling */}
      {handles.corners.map((point, index) => {
        const isHovered = hoveredHandle?.type === 'corner' && hoveredHandle?.index === index;

        // Cursor based on corner position
        let cornerCursor = 'nw-resize';
        if (index === 1) cornerCursor = 'ne-resize';
        else if (index === 2) cornerCursor = 'se-resize';
        else if (index === 3) cornerCursor = 'sw-resize';

        return (
          <Sphere
            key={`text-resize-corner-${index}`}
            position={[point.x, elevation + 0.3, point.y]}
            args={[0.6]}
            onPointerDown={(event) => {
              event.stopPropagation();

              logger.info('[TextResizeControls] Starting corner resize', {
                elementId: element.id,
                handleIndex: index,
              });

              // Save to history before starting resize
              saveToHistory();

              // Set up drag state
              dragState.current.isDragging = true;
              dragState.current.handleType = 'corner';
              dragState.current.handleIndex = index;
              dragState.current.originalFontSize = element.fontSize;
              dragState.current.originalBounds = textBounds;
              dragState.current.pointerId = event.nativeEvent.pointerId;

              // Set cursor
              setCursorOverride(cornerCursor);

              // Capture pointer
              try {
                event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
              } catch (error) {
                logger.warn('[TextResizeControls] Failed to capture pointer:', error);
              }

              // Add global listeners
              document.addEventListener('pointermove', handlePointerMove, true);
              document.addEventListener('pointerup', handlePointerUp, true);
              document.addEventListener('pointercancel', handlePointerUp, true);
            }}
            onPointerEnter={() => {
              setHoveredHandle({ type: 'corner', index });
              if (!dragState.current.isDragging) {
                setCursorOverride(cornerCursor);
              }
            }}
            onPointerLeave={() => {
              setHoveredHandle(null);
              if (!dragState.current.isDragging) {
                setCursorOverride(null);
              }
            }}
            cursor={cornerCursor}
          >
            <meshBasicMaterial
              color={isHovered ? '#CCCCCC' : '#FFFFFF'}
              transparent={false}
              opacity={1.0}
            />
          </Sphere>
        );
      })}

      {/* Edge Handles - Dimensional Scaling */}
      {handles.edges.map((point, index) => {
        const isHovered = hoveredHandle?.type === 'edge' && hoveredHandle?.index === index;

        // Cursor based on edge direction
        // 0=Top, 1=Right, 2=Bottom, 3=Left
        let edgeCursor = 'ns-resize'; // Top/Bottom
        let handleArgs: [number, number, number] = [1.5, 0.3, 0.3]; // Horizontal handle

        if (index === 1 || index === 3) {
          // Right/Left
          edgeCursor = 'ew-resize';
          handleArgs = [0.3, 0.3, 1.5]; // Vertical handle
        }

        return (
          <Box
            key={`text-resize-edge-${index}`}
            position={[point.x, elevation + 0.15, point.y]}
            args={handleArgs}
            onPointerDown={(event) => {
              event.stopPropagation();

              logger.info('[TextResizeControls] Starting edge resize', {
                elementId: element.id,
                handleIndex: index,
              });

              // Save to history before starting resize
              saveToHistory();

              // Set up drag state
              dragState.current.isDragging = true;
              dragState.current.handleType = 'edge';
              dragState.current.handleIndex = index;
              dragState.current.originalFontSize = element.fontSize;
              dragState.current.originalBounds = textBounds;
              dragState.current.pointerId = event.nativeEvent.pointerId;

              // Set cursor
              setCursorOverride(edgeCursor);

              // Capture pointer
              try {
                event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
              } catch (error) {
                logger.warn('[TextResizeControls] Failed to capture pointer:', error);
              }

              // Add global listeners
              document.addEventListener('pointermove', handlePointerMove, true);
              document.addEventListener('pointerup', handlePointerUp, true);
              document.addEventListener('pointercancel', handlePointerUp, true);
            }}
            onPointerEnter={() => {
              setHoveredHandle({ type: 'edge', index });
              if (!dragState.current.isDragging) {
                setCursorOverride(edgeCursor);
              }
            }}
            onPointerLeave={() => {
              setHoveredHandle(null);
              if (!dragState.current.isDragging) {
                setCursorOverride(null);
              }
            }}
            cursor={edgeCursor}
          >
            <meshBasicMaterial
              color={isHovered ? '#CCCCCC' : '#FFFFFF'}
              transparent={false}
              opacity={1.0}
            />
          </Box>
        );
      })}
    </group>
  );
};

export default TextResizeControls;
