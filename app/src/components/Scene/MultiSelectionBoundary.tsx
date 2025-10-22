/**
 * MultiSelectionBoundary Component
 * Renders a purple dashed boundary around multiple selected shapes with resize handles
 * Similar to Canva's multi-selection behavior
 */

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Line, Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D, Shape } from '@/types';
import * as THREE from 'three';

// Ground plane for raycasting (same as ResizableShapeControls)
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

interface MultiSelectionBoundaryProps {
  elevation?: number;
}

const BOUNDARY_COLOR = '#9333EA'; // Purple matching highlighted shape
const PADDING = 0.08; // 8px padding in world units (0.08m)
const HANDLE_SIZE = 1.0; // Size of resize handles (increased for better visibility)

export const MultiSelectionBoundary: React.FC<MultiSelectionBoundaryProps> = ({ elevation = 0.02 }) => {
  const { camera, raycaster, gl } = useThree();

  const selectedShapeIds = useAppStore(state => state.selectedShapeIds);
  const shapes = useAppStore(state => state.shapes);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const resizeMultiSelection = useAppStore(state => state.resizeMultiSelection);
  const resizeMultiSelectionLive = useAppStore(state => state.resizeMultiSelectionLive);
  const saveToHistory = useAppStore(state => state.saveToHistory);

  // Track drag state
  const dragState = useRef<{
    isDragging: boolean;
    handleIndex: number;
    handleType: 'corner' | 'edge';
    startWorldPos: { x: number; y: number }; // World space position when drag started
    originalBounds: { minX: number; minY: number; maxX: number; maxY: number };
    originalShapes: Map<string, Shape>;
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
    } else if (!dragState.current?.isDragging) {
      gl.domElement.style.cursor = '';
    }
  }, [cursorOverride, gl.domElement]);

  // Only show if:
  // 1. Multiple shapes are selected (2 or more)
  // 2. Active tool is 'select'
  // 3. Not in resize mode for a single shape
  const shouldShow = useMemo(() => {
    const isResizeMode = useAppStore.getState().drawing.isResizeMode;
    return (
      selectedShapeIds.length >= 2 &&
      activeTool === 'select' &&
      !isResizeMode
    );
  }, [selectedShapeIds, activeTool]);

  // Get selected shapes (excluding locked shapes)
  const selectedShapes = useMemo(() => {
    if (!shouldShow) return [];
    return shapes.filter(shape =>
      selectedShapeIds.includes(shape.id) && !shape.locked
    );
  }, [shapes, selectedShapeIds, shouldShow]);

  // Detect common rotation angle for Canva-style rotated boundaries
  const groupRotation = useMemo(() => {
    if (selectedShapes.length === 0) return null;

    // Check if all shapes have rotation metadata
    const firstShape = selectedShapes[0];
    if (!firstShape.rotation) return null;

    const firstAngle = firstShape.rotation.angle;

    // Check if all shapes have the same rotation angle
    const allSameRotation = selectedShapes.every(shape =>
      shape.rotation && Math.abs(shape.rotation.angle - firstAngle) < 0.1
    );

    if (!allSameRotation) return null;

    return firstAngle;
  }, [selectedShapes]);

  // Calculate bounding box and rotation center for all selected shapes
  // For rotated groups: calculate in LOCAL (unrotated) space for tight wrap
  const boundsData = useMemo(() => {
    if (selectedShapes.length === 0) return null;

    const shouldUnrotate = groupRotation !== null && groupRotation !== 0;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let actualRotationCenter: { x: number; y: number } | null = null;

    if (shouldUnrotate) {
      // STEP 1: Transform all points to world space (apply individual shape rotations)
      const transformedPointsPerShape: Point2D[][] = selectedShapes.map(shape => {
        if (!shape.rotation || shape.rotation.angle === 0) {
          return shape.points; // No rotation needed
        }

        // Apply shape's own rotation to its points
        const shapeAngle = shape.rotation.angle;
        const shapeCenter = shape.rotation.center;
        const angleRad = (shapeAngle * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        return shape.points.map(point => {
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
      transformedPointsPerShape.forEach(points => {
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

      transformedPointsPerShape.forEach(points => {
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
      selectedShapes.forEach(shape => {
        shape.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });
    }

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return null;
    }

    return {
      bounds: { minX, minY, maxX, maxY },
      rotationCenter: actualRotationCenter
    };
  }, [selectedShapes, groupRotation]);

  // Extract bounds for backward compatibility
  const bounds = boundsData?.bounds ?? null;

  // Calculate boundary points with padding (Canva-style: rotates with shapes)
  const boundaryPoints = useMemo(() => {
    if (!bounds || !boundsData) return null;

    const boundMinX = bounds.minX - PADDING;
    const boundMinY = bounds.minY - PADDING;
    const boundMaxX = bounds.maxX + PADDING;
    const boundMaxY = bounds.maxY + PADDING;

    // Create boundary corners
    let corners = [
      { x: boundMinX, y: boundMinY }, // Bottom-left
      { x: boundMaxX, y: boundMinY }, // Bottom-right
      { x: boundMaxX, y: boundMaxY }, // Top-right
      { x: boundMinX, y: boundMaxY }, // Top-left
      { x: boundMinX, y: boundMinY }, // Close the loop
    ];

    // Canva-style: Rotate boundary if all shapes share the same rotation
    if (groupRotation !== null && groupRotation !== 0 && boundsData.rotationCenter) {
      // Use the ACTUAL rotation center, not the center of bounds!
      const centerX = boundsData.rotationCenter.x;
      const centerY = boundsData.rotationCenter.y;
      const angleRadians = (groupRotation * Math.PI) / 180;
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      corners = corners.map(corner => {
        const dx = corner.x - centerX;
        const dy = corner.y - centerY;
        return {
          x: centerX + (dx * cos - dy * sin),
          y: centerY + (dx * sin + dy * cos)
        };
      });
    }

    // Convert to Three.js coordinates
    return corners.map(corner => [corner.x, elevation, corner.y]);
  }, [bounds, boundsData, elevation, groupRotation]);

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
    if (!dragState.current?.isDragging) return;

    const { handleIndex, startWorldPos, originalBounds } = dragState.current;

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
    let deltaX = currentWorldPos.x - startWorldPos.x;
    let deltaY = currentWorldPos.y - startWorldPos.y;

    // ROTATION FIX: Transform delta by inverse rotation if group is rotated
    // This makes handles follow cursor correctly for rotated groups
    if (groupRotation !== null && groupRotation !== 0) {
      const angleRadians = (-groupRotation * Math.PI) / 180; // Negative to un-rotate
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      const rotatedDeltaX = deltaX * cos - deltaY * sin;
      const rotatedDeltaY = deltaX * sin + deltaY * cos;

      deltaX = rotatedDeltaX;
      deltaY = rotatedDeltaY;
    }

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
      return; // Prevent degenerate transforms
    }

    const scaleX = newWidth / originalWidth;
    const scaleY = newHeight / originalHeight;

    // UNIFORM SCALING: Shapes maintain aspect ratio (squares stay squares, circles stay circles)
    // Determine uniform scale factor based on handle type
    let uniformScale: number;
    if (handleIndex >= 0 && handleIndex <= 3) {
      // Corner handles (0-3): use the larger scale (dominant direction)
      uniformScale = Math.max(scaleX, scaleY);
    } else if (handleIndex === 4 || handleIndex === 6) {
      // Top/Bottom edges (4, 6): use Y scale for both dimensions
      uniformScale = scaleY;
    } else {
      // Left/Right edges (5, 7): use X scale for both dimensions
      uniformScale = scaleX;
    }

    // Calculate translation (to keep the opposite corner fixed)
    const translateX = newMinX - originalBounds.minX;
    const translateY = newMinY - originalBounds.minY;

    // Update current bounds for handle positioning
    setCurrentBounds({ minX: newMinX, minY: newMinY, maxX: newMaxX, maxY: newMaxY });

    // Apply live resize preview with UNIFORM SCALING
    resizeMultiSelectionLive(
      Array.from(dragState.current.originalShapes.keys()),
      originalBounds,
      { minX: newMinX, minY: newMinY, maxX: newMaxX, maxY: newMaxY },
      uniformScale,  // Same scale for X
      uniformScale,  // Same scale for Y
      translateX,
      translateY
    );
  }, [resizeMultiSelectionLive, gl.domElement, camera, raycaster, groupRotation]);

  // Handle pointer up (attached to document during drag)
  const handlePointerUp = useCallback((event: MouseEvent) => {
    if (!dragState.current?.isDragging) return;

    const { handleIndex, startWorldPos, originalBounds } = dragState.current;

    // Get final world position using raycasting
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, intersection)) {
      // No intersection, cancel resize
      dragState.current = null;
      setCursorOverride(null);
      setCurrentBounds(null);
      // Remove document listeners
      document.removeEventListener('pointermove', handlePointerMove as any);
      document.removeEventListener('pointerup', handlePointerUp as any);
      return;
    }

    const currentWorldPos = { x: intersection.x, y: intersection.z };

    // DELTA-BASED APPROACH: Same as pointer move
    let deltaX = currentWorldPos.x - startWorldPos.x;
    let deltaY = currentWorldPos.y - startWorldPos.y;

    // ROTATION FIX: Transform delta by inverse rotation if group is rotated
    // This makes handles follow cursor correctly for rotated groups
    if (groupRotation !== null && groupRotation !== 0) {
      const angleRadians = (-groupRotation * Math.PI) / 180; // Negative to un-rotate
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);

      const rotatedDeltaX = deltaX * cos - deltaY * sin;
      const rotatedDeltaY = deltaX * sin + deltaY * cos;

      deltaX = rotatedDeltaX;
      deltaY = rotatedDeltaY;
    }

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
        Array.from(dragState.current.originalShapes.keys()),
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
    dragState.current = null;
    setCursorOverride(null);
    setCurrentBounds(null); // Clear current bounds

    // Remove document listeners
    document.removeEventListener('pointermove', handlePointerMove as any);
    document.removeEventListener('pointerup', handlePointerUp as any);
  }, [resizeMultiSelection, saveToHistory, gl.domElement, camera, raycaster, handlePointerMove, groupRotation]);

  // Handle pointer down on resize handles
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
    dragState.current = {
      isDragging: true,
      handleIndex,
      handleType: resizeHandles[handleIndex].type,
      startWorldPos: { x: intersection.x, y: intersection.z },
      originalBounds: { ...bounds },
      originalShapes: new Map(selectedShapes.map(shape => [shape.id, { ...shape, points: [...shape.points] }])),
    };

    // Set cursor
    setCursorOverride(resizeHandles[handleIndex].cursor);

    // Attach move/up listeners to document so they work even when cursor leaves the handle
    document.addEventListener('pointermove', handlePointerMove as any);
    document.addEventListener('pointerup', handlePointerUp as any);
  }, [bounds, resizeHandles, selectedShapes, gl.domElement, camera, raycaster, handlePointerMove, handlePointerUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragState.current?.isDragging) {
        dragState.current = null;
        setCursorOverride(null);
        // Remove document listeners if still attached
        document.removeEventListener('pointermove', handlePointerMove as any);
        document.removeEventListener('pointerup', handlePointerUp as any);
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  if (!shouldShow || !boundaryPoints || !bounds) {
    return null;
  }

  return (
    <group>
      {/* Dashed border */}
      <Line
        points={boundaryPoints}
        color={BOUNDARY_COLOR}
        lineWidth={3}
        dashed={true}
        dashScale={5}
        dashSize={2}
        dashOffset={0}
        gapSize={2}
      />

      {/* Resize handles */}
      {resizeHandles.map((handle, index) => (
        <Box
          key={`handle-${index}`}
          args={[HANDLE_SIZE, HANDLE_SIZE, HANDLE_SIZE]}
          position={[handle.x, elevation + 0.01, handle.y]}
          onPointerDown={(e) => handlePointerDown(e, index)}
          onPointerEnter={() => {
            setHoveredHandle(index);
            if (!dragState.current?.isDragging) {
              setCursorOverride(handle.cursor);
            }
          }}
          onPointerLeave={() => {
            setHoveredHandle(null);
            if (!dragState.current?.isDragging) {
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
