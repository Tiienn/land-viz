/**
 * TextTransformControls Component
 *
 * Phase 5: Text as Layers - Complete Transform Controls for Text Objects
 *
 * Provides drag-to-move, resize handles (8), and rotation handle for selected text.
 * Adapted from TextResizeControls and TextRotationControls to work with TextObject + useTextStore.
 *
 * Features:
 * - Drag-to-move: Click and drag text to reposition
 * - Resize: 4 corner handles (proportional) + 4 edge handles (dimensional)
 * - Rotate: Green handle above text with live preview and Shift snapping
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Html } from '@react-three/drei';
import { useTextStore } from '../../store/useTextStore';
import { useAppStore } from '../../store/useAppStore';
import type { TextObject, Point2D } from '../../types';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { logger } from '../../utils/logger';
import { tokens } from '../../styles/tokens';

// Font size constraints
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 200;

interface TextTransformControlsProps {
  text: TextObject;
  elevation?: number;
}

// Helper functions for rotation
const calculateAngle = (center: Point2D, point: Point2D): number => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

const snapAngleToIncrement = (angle: number, increment: number = 45): number => {
  return Math.round(angle / increment) * increment;
};

const normalizeAngle = (angle: number): number => {
  while (angle > 180) angle -= 360;
  while (angle <= -180) angle += 360;
  return angle;
};

// Calculate text bounding box accounting for distanceFactor and multi-line content
function calculateTextBounds(text: TextObject, is2DMode: boolean, isSelected: boolean = true) {
  // distanceFactor controls CSS pixel → world unit conversion
  // 2D mode: 2.5 (smaller scaling), 3D mode: 20 (larger scaling)
  const distanceFactor = is2DMode ? 2.5 : 20;

  // Split into lines for accurate multi-line measurement
  const lines = text.content.split('\n').filter(line => line.length > 0);
  const lineCount = Math.max(lines.length, 1);
  const maxLineLength = Math.max(...lines.map(line => line.length), 1);

  // Character width factor - tuned to 0.5 for accurate alignment with rendered text
  // Browser text rendering with whiteSpace: nowrap and no maxWidth uses natural character width
  // This accounts for: letter spacing, font rendering, CSS box model, and browser text layout
  const charWidthFactor = 0.5;

  // Calculate CSS pixel dimensions (what the browser renders)
  const cssFontSize = text.fontSize;
  const cssWidth = cssFontSize * maxLineLength * charWidthFactor;
  const cssHeight = cssFontSize * text.lineHeight * lineCount;

  // Convert CSS pixels to world units using distanceFactor
  // World units = CSS pixels / distanceFactor
  let worldWidth = cssWidth / distanceFactor;
  let worldHeight = cssHeight / distanceFactor;

  // Account for padding if background color is present
  // Padding: 8px top/bottom, 12px left/right (from TextObject style)
  if (text.backgroundColor) {
    const paddingHorizontalPx = 12 * 2; // 12px each side = 24px total
    const paddingVerticalPx = 8 * 2;    // 8px each side = 16px total
    const paddingWidthWorld = paddingHorizontalPx / distanceFactor;
    const paddingHeightWorld = paddingVerticalPx / distanceFactor;

    worldWidth += paddingWidthWorld;
    worldHeight += paddingHeightWorld;
  }

  // Account for selection border (2px on all sides = 4px to width/height)
  // This makes handles align with the visible blue border
  if (isSelected) {
    const borderPx = 2 * 2; // 2px border on each side = 4px total
    const borderWidthWorld = borderPx / distanceFactor;
    const borderHeightWorld = borderPx / distanceFactor;

    worldWidth += borderWidthWorld;
    worldHeight += borderHeightWorld;
  }

  const left = text.position.x - worldWidth / 2;
  const top = text.position.z - worldHeight / 2;

  return {
    left,
    top,
    width: worldWidth,
    height: worldHeight,
    center: { x: text.position.x, y: text.position.z },
    minX: left,
    minY: top,
    maxX: left + worldWidth,
    maxY: top + worldHeight,
  };
}

// Calculate handle positions
function calculateHandlePositions(bounds: ReturnType<typeof calculateTextBounds>) {
  const { minX, maxX, minY, maxY } = bounds;

  const corners = [
    { x: minX, y: minY }, // Top-left
    { x: maxX, y: minY }, // Top-right
    { x: maxX, y: maxY }, // Bottom-right
    { x: minX, y: maxY }, // Bottom-left
  ];

  const edges = [
    { x: (minX + maxX) / 2, y: minY }, // Top
    { x: maxX, y: (minY + maxY) / 2 }, // Right
    { x: (minX + maxX) / 2, y: maxY }, // Bottom
    { x: minX, y: (minY + maxY) / 2 }, // Left
  ];

  return { corners, edges };
}

export const TextTransformControls: React.FC<TextTransformControlsProps> = ({
  text,
  elevation = 0.01,
}) => {
  const { camera, raycaster, gl } = useThree();

  // Store actions
  const updateText = useTextStore(state => state.updateText);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const saveToHistory = useAppStore(state => state.saveToHistory);
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);

  // Local state
  const [hoveredHandle, setHoveredHandle] = useState<{ type: 'corner' | 'edge' | 'rotate' | 'drag'; index?: number } | null>(null);
  const [cursorOverride, setCursorOverride] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(text.rotation || 0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Check if controls would overlap with panels
  const [shouldHideControls, setShouldHideControls] = useState(false);
  const { size } = useThree();

  // Panel dimensions
  const PANEL_WIDTH = 320;
  const HANDLE_BUFFER = 150; // Extra space needed for handles

  // Refs for drag state
  const shiftPressedRef = useRef(false);
  const angleRef = useRef(text.rotation || 0);
  const hasDraggedRef = useRef(false);

  const dragState = useRef({
    isDragging: false,
    dragType: null as 'move' | 'resize-corner' | 'resize-edge' | 'rotate' | null,
    handleIndex: null as number | null,
    startPosition: null as Point2D | null,
    originalFontSize: text.fontSize,
    originalBounds: null as ReturnType<typeof calculateTextBounds> | null,
    startMouseAngle: 0,
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

  // Check if this text is selected and select tool is active
  const isActive = useMemo(() => {
    return selectedTextId === text.id && activeTool === 'select';
  }, [selectedTextId, text.id, activeTool]);

  // Calculate current text bounds (accounting for 2D/3D mode distanceFactor and selection border)
  // NOTE: Since bounds are ESTIMATED (not DOM-measured), we only recalculate when text properties change.
  // Camera position doesn't affect estimated bounds. See TEXT_BOUNDS_ESTIMATION_ISSUE.md for details.
  const textBounds = useMemo(() => {
    return calculateTextBounds(text, is2DMode, true);
  }, [
    text.position.x,
    text.position.z,
    text.fontSize,
    text.content,
    text.lineHeight,
    text.letterSpacing,
    text.backgroundColor,
    is2DMode
  ]);

  // Calculate handle positions
  const handles = useMemo(() => calculateHandlePositions(textBounds), [textBounds]);

  // Calculate rotation handle position
  const rotationHandlePosition = useMemo(() => {
    const handleOffset = 4.0;
    return {
      x: text.position.x,
      y: text.position.z - handleOffset,
      center: { x: text.position.x, y: text.position.z },
    };
  }, [text.position]);

  /**
   * Pointer move handler for all transforms
   */
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (
      !dragState.current.isDragging ||
      !dragState.current.dragType ||
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
      const worldPoint: Point2D = { x: intersection.x, y: intersection.z };

      hasDraggedRef.current = true;

      // Handle different drag types
      if (dragState.current.dragType === 'move') {
        // Drag-to-move
        updateText(text.id, {
          position: {
            ...text.position,
            x: worldPoint.x,
            z: worldPoint.y,  // worldPoint.y is Three.js Z (vertical on screen)
          }
        });
      } else if (dragState.current.dragType === 'resize-corner' && dragState.current.originalBounds) {
        // Corner resize - proportional scaling
        const dragDiagonal = Math.sqrt(
          Math.pow(worldPoint.x - dragState.current.originalBounds.center.x, 2) +
          Math.pow(worldPoint.y - dragState.current.originalBounds.center.y, 2)
        );
        const originalDiagonal = Math.sqrt(
          Math.pow(dragState.current.originalBounds.width / 2, 2) +
          Math.pow(dragState.current.originalBounds.height / 2, 2)
        );
        const scaleFactor = dragDiagonal / originalDiagonal;
        const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, dragState.current.originalFontSize * scaleFactor));
        updateText(text.id, { fontSize: newFontSize });
      } else if (dragState.current.dragType === 'resize-edge' && dragState.current.originalBounds && dragState.current.handleIndex !== null) {
        // Edge resize - dimensional scaling
        const handleIndex = dragState.current.handleIndex;
        let scaleFactor: number;

        if (handleIndex === 0 || handleIndex === 2) {
          // North/South handles
          const newHeight = handleIndex === 0
            ? dragState.current.originalBounds.height + (dragState.current.originalBounds.top - worldPoint.y)
            : worldPoint.y - dragState.current.originalBounds.top;
          scaleFactor = newHeight / dragState.current.originalBounds.height;
        } else {
          // East/West handles
          const newWidth = handleIndex === 1
            ? worldPoint.x - dragState.current.originalBounds.left
            : dragState.current.originalBounds.width + (dragState.current.originalBounds.left - worldPoint.x);
          scaleFactor = newWidth / dragState.current.originalBounds.width;
        }

        const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, dragState.current.originalFontSize * scaleFactor));
        updateText(text.id, { fontSize: newFontSize });
      } else if (dragState.current.dragType === 'rotate') {
        // Rotation
        const currentMouseAngle = calculateAngle(rotationHandlePosition.center, worldPoint);
        let rotationAngle = currentMouseAngle - dragState.current.startMouseAngle;
        rotationAngle = normalizeAngle(rotationAngle);

        const originalAngle = text.rotation || 0;
        let finalAngle = originalAngle + rotationAngle;

        if (shiftPressedRef.current) {
          finalAngle = snapAngleToIncrement(finalAngle, 45);
          finalAngle = normalizeAngle(finalAngle);
        }

        setCurrentAngle(finalAngle);
        angleRef.current = finalAngle;
        updateText(text.id, { rotation: finalAngle });
      }
    }
  }, [
    camera,
    raycaster,
    gl.domElement,
    groundPlane,
    text.id,
    text.position,
    text.rotation,
    rotationHandlePosition,
    updateText,
  ]);

  /**
   * Pointer up handler to finish drag
   */
  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (
      !dragState.current.isDragging ||
      (dragState.current.pointerId !== null && event.pointerId !== dragState.current.pointerId)
    ) {
      return;
    }

    if (hasDraggedRef.current) {
      logger.info('[TextTransformControls] Finishing transform', {
        textId: text.id,
        dragType: dragState.current.dragType,
      });

      // Save to history
      saveToHistory();
    }

    // Clean up drag state
    dragState.current.isDragging = false;
    dragState.current.dragType = null;
    dragState.current.handleIndex = null;
    dragState.current.originalBounds = null;
    dragState.current.pointerId = null;
    hasDraggedRef.current = false;

    setIsRotating(false);
    setCursorOverride(null);

    // Remove event listeners
    document.removeEventListener('pointermove', handlePointerMove, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointercancel', handlePointerUp, true);
  }, [handlePointerMove, text.id, saveToHistory]);

  // Keyboard event handlers for Shift key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && !shiftPressedRef.current) {
        shiftPressedRef.current = true;
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && shiftPressedRef.current) {
        shiftPressedRef.current = false;
        setIsShiftPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Check overlap with panels on every frame
  useEffect(() => {
    const checkOverlap = () => {
      // Project 3D position to 2D screen coordinates
      const vector = new THREE.Vector3(text.position.x, text.position.y, text.position.z);
      vector.project(camera);

      // Behind camera
      if (vector.z > 1) {
        setShouldHideControls(true);
        return;
      }

      const screenX = (vector.x * 0.5 + 0.5) * size.width;

      // Check if too close to left edge (LayerPanel area)
      if (screenX < PANEL_WIDTH + HANDLE_BUFFER) {
        setShouldHideControls(true);
        return;
      }

      // Check if too close to right edge (PropertiesPanel area)
      if (screenX > size.width - (PANEL_WIDTH + HANDLE_BUFFER)) {
        setShouldHideControls(true);
        return;
      }

      setShouldHideControls(false);
    };

    checkOverlap();
    const interval = setInterval(checkOverlap, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [text.position, camera, size.width]);

  // Don't render if text is not selected, tool is not select, or would overlap panels
  if (!isActive || text.locked || shouldHideControls) {
    return null;
  }

  /**
   * Start drag-to-move
   */
  const startDrag = (event: any) => {
    event.stopPropagation();

    logger.info('[TextTransformControls] Starting drag', { textId: text.id });

    saveToHistory();

    dragState.current.isDragging = true;
    dragState.current.dragType = 'move';
    dragState.current.pointerId = event.nativeEvent.pointerId;
    hasDraggedRef.current = false;

    setCursorOverride('grabbing');

    try {
      event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
    } catch (error) {
      logger.warn('[TextTransformControls] Failed to capture pointer:', error);
    }

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointercancel', handlePointerUp, true);
  };

  /**
   * Start corner resize
   */
  const startCornerResize = (index: number) => (event: any) => {
    event.stopPropagation();

    logger.info('[TextTransformControls] Starting corner resize', {
      textId: text.id,
      handleIndex: index,
    });

    saveToHistory();

    dragState.current.isDragging = true;
    dragState.current.dragType = 'resize-corner';
    dragState.current.handleIndex = index;
    dragState.current.originalFontSize = text.fontSize;
    dragState.current.originalBounds = textBounds;
    dragState.current.pointerId = event.nativeEvent.pointerId;
    hasDraggedRef.current = false;

    const cornerCursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];
    setCursorOverride(cornerCursors[index]);

    try {
      event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
    } catch (error) {
      logger.warn('[TextTransformControls] Failed to capture pointer:', error);
    }

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointercancel', handlePointerUp, true);
  };

  /**
   * Start edge resize
   */
  const startEdgeResize = (index: number) => (event: any) => {
    event.stopPropagation();

    logger.info('[TextTransformControls] Starting edge resize', {
      textId: text.id,
      handleIndex: index,
    });

    saveToHistory();

    dragState.current.isDragging = true;
    dragState.current.dragType = 'resize-edge';
    dragState.current.handleIndex = index;
    dragState.current.originalFontSize = text.fontSize;
    dragState.current.originalBounds = textBounds;
    dragState.current.pointerId = event.nativeEvent.pointerId;
    hasDraggedRef.current = false;

    const edgeCursor = (index === 1 || index === 3) ? 'ew-resize' : 'ns-resize';
    setCursorOverride(edgeCursor);

    try {
      event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
    } catch (error) {
      logger.warn('[TextTransformControls] Failed to capture pointer:', error);
    }

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointercancel', handlePointerUp, true);
  };

  /**
   * Start rotation
   */
  const startRotation = (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    logger.info('[TextTransformControls] Starting rotation', {
      textId: text.id,
      currentRotation: text.rotation,
    });

    setIsRotating(true);

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      const mousePoint: Point2D = { x: intersection.x, y: intersection.z };
      const mouseAngle = calculateAngle(rotationHandlePosition.center, mousePoint);

      saveToHistory();

      dragState.current.isDragging = true;
      dragState.current.dragType = 'rotate';
      dragState.current.startMouseAngle = mouseAngle;
      dragState.current.pointerId = event.nativeEvent.pointerId;
      hasDraggedRef.current = false;

      setCursorOverride('grab');

      try {
        event.currentTarget.setPointerCapture(event.nativeEvent.pointerId);
      } catch (error) {
        logger.warn('[TextTransformControls] Failed to capture pointer:', error);
      }

      document.addEventListener('pointermove', handlePointerMove, true);
      document.addEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('pointercancel', handlePointerUp, true);
    }
  };

  return (
    <group name="text-transform-controls">
      {/* Drag area - invisible box over text */}
      <mesh
        position={[text.position.x, elevation + 0.1, text.position.z]}
        onPointerDown={startDrag}
        onPointerEnter={() => !dragState.current.isDragging && setCursorOverride('grab')}
        onPointerLeave={() => !dragState.current.isDragging && setCursorOverride(null)}
      >
        <boxGeometry args={[textBounds.width, 0.1, textBounds.height]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Corner Handles - Proportional Scaling (Html for consistent sizing) */}
      {handles.corners.map((point, index) => {
        const isHovered = hoveredHandle?.type === 'corner' && hoveredHandle?.index === index;
        const cornerCursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];

        return (
          <Html
            key={`text-resize-corner-${index}`}
            position={[point.x, elevation + 0.3, point.y]}
            center // Always use center for handles (not sprite) for correct positioning
            occlude={false}
            distanceFactor={is2DMode ? 2.5 : 20}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              zIndex: tokens.zIndex.scene,
            }}
          >
            <div
              onPointerDown={startCornerResize(index)}
              onPointerEnter={() => {
                setHoveredHandle({ type: 'corner', index });
                if (!dragState.current.isDragging) {
                  setCursorOverride(cornerCursors[index]);
                }
              }}
              onPointerLeave={() => {
                setHoveredHandle(null);
                if (!dragState.current.isDragging) {
                  setCursorOverride(null);
                }
              }}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: isHovered ? '#CCCCCC' : '#FFFFFF',
                border: '1px solid #3B82F6',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                cursor: cornerCursors[index],
                transition: 'background-color 0.15s ease',
              }}
            />
          </Html>
        );
      })}

      {/* Edge Handles - Dimensional Scaling (Html for consistent sizing) */}
      {handles.edges.map((point, index) => {
        const isHovered = hoveredHandle?.type === 'edge' && hoveredHandle?.index === index;
        const edgeCursor = (index === 1 || index === 3) ? 'ew-resize' : 'ns-resize';
        const isVertical = index === 1 || index === 3; // Right/Left edges

        return (
          <Html
            key={`text-resize-edge-${index}`}
            position={[point.x, elevation + 0.15, point.y]}
            center // Always use center for handles (not sprite) for correct positioning
            occlude={false}
            distanceFactor={is2DMode ? 2.5 : 20}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              zIndex: tokens.zIndex.scene,
            }}
          >
            <div
              onPointerDown={startEdgeResize(index)}
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
              style={{
                width: isVertical ? '4px' : '16px',
                height: isVertical ? '16px' : '4px',
                borderRadius: '2px',
                backgroundColor: isHovered ? '#CCCCCC' : '#FFFFFF',
                border: '1px solid #3B82F6',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                cursor: edgeCursor,
                transition: 'background-color 0.15s ease',
              }}
            />
          </Html>
        );
      })}

      {/* Rotation Handle */}
      <Html
        position={[rotationHandlePosition.x, elevation + 0.3, rotationHandlePosition.y]}
        center // Always use center for handles (not sprite) for correct positioning
        occlude={false}
        distanceFactor={is2DMode ? 2.5 : 20}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          zIndex: tokens.zIndex.scene,
        }}
      >
        <div
          onPointerDown={startRotation}
          onPointerEnter={() => setCursorOverride('grab')}
          onPointerLeave={() => !isRotating && setCursorOverride(null)}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isRotating ? 'rgba(29, 78, 216, 0.95)' : 'rgba(34, 197, 94, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            transform: isRotating ? 'scale(1.1)' : 'scale(1)',
          }}
          title="Drag to rotate text"
        >
          ↻
        </div>
      </Html>

      {/* Angle Display - Show during rotation */}
      {isRotating && (
        <Html
          position={[text.position.x, elevation + 0.8, text.position.z]}
          center // Always use center for correct positioning
          occlude={false}
          distanceFactor={is2DMode ? 2.5 : 20}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: tokens.zIndex.scene,
          }}
        >
          <div
            style={{
              background: 'rgba(29, 78, 216, 0.95)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.9)',
            }}
          >
            {Math.round(currentAngle)}°
            {isShiftPressed && (
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>⇧ 45°</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default TextTransformControls;
