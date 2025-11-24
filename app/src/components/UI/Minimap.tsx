import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Shape } from '@/types';

/**
 * Minimap - Top-down navigation overlay for walkthrough mode
 *
 * Features:
 * - 150x150px canvas in bottom-right corner
 * - Shows all shapes from top-down view
 * - Player position indicator (red dot)
 * - Player direction indicator (arrow)
 * - Site boundary visualization
 * - Real-time updates (60 FPS)
 */

interface MinimapProps {
  /**
   * Size of minimap in pixels (default: 150)
   */
  size?: number;

  /**
   * Position from edges (default: 20px)
   */
  margin?: number;
}

/**
 * Get shape color with slight variation
 */
function getShapeColor(shape: Shape, index: number): string {
  if (shape.color) return shape.color;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  return colors[index % colors.length];
}

/**
 * Calculate bounding box of all shapes for minimap scaling
 * Includes player position to ensure they're always visible
 */
function calculateSceneBounds(
  shapes: Shape[],
  playerPosition?: { x: number; z: number }
): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
  width: number;
  height: number;
} {
  if (shapes.length === 0 && !playerPosition) {
    return {
      minX: -10,
      maxX: 10,
      minZ: -10,
      maxZ: 10,
      centerX: 0,
      centerZ: 0,
      width: 20,
      height: 20,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  // Include all shape points
  shapes.forEach(shape => {
    shape.points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z || point.y);
      maxZ = Math.max(maxZ, point.z || point.y);
    });
  });

  // Include player position to ensure they're always visible on minimap
  if (playerPosition) {
    minX = Math.min(minX, playerPosition.x);
    maxX = Math.max(maxX, playerPosition.x);
    minZ = Math.min(minZ, playerPosition.z);
    maxZ = Math.max(maxZ, playerPosition.z);
  }

  // Add padding (10% on each side)
  const width = maxX - minX;
  const height = maxZ - minZ;
  const padding = Math.max(width, height) * 0.1;

  minX -= padding;
  maxX += padding;
  minZ -= padding;
  maxZ += padding;

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    height: maxZ - minZ,
  };
}

/**
 * Transform world coordinates to minimap canvas coordinates
 */
function worldToMinimap(
  worldX: number,
  worldZ: number,
  bounds: ReturnType<typeof calculateSceneBounds>,
  canvasSize: number
): { x: number; y: number } {
  // Normalize to 0-1 range
  const normalizedX = (worldX - bounds.minX) / bounds.width;
  const normalizedZ = (worldZ - bounds.minZ) / bounds.height;

  // Map to canvas coordinates (with padding)
  const padding = 10; // pixels
  const effectiveSize = canvasSize - padding * 2;

  return {
    x: padding + normalizedX * effectiveSize,
    y: padding + normalizedZ * effectiveSize, // Z maps to Y in top-down view
  };
}

export default function Minimap({
  size = 150,
  margin = 20,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Get state from store
  const shapes = useAppStore(state => state.shapes);
  const layers = useAppStore(state => state.layers);
  const walkthroughState = useAppStore(state => state.viewState.walkthroughState);

  // Filter visible shapes
  const visibleShapes = React.useMemo(() => {
    const layerVisibilityMap = new Map<string, boolean>();
    layers.forEach(layer => {
      layerVisibilityMap.set(layer.id, layer.visible !== false);
    });

    return shapes.filter(shape =>
      layerVisibilityMap.get(shape.layerId) !== false
    );
  }, [shapes, layers]);

  // Calculate scene bounds for scaling (include player position)
  const sceneBounds = React.useMemo(() => {
    const playerPos = walkthroughState
      ? { x: walkthroughState.position.x, z: walkthroughState.position.z }
      : undefined;
    return calculateSceneBounds(visibleShapes, playerPos);
  }, [visibleShapes, walkthroughState]);

  // Render minimap
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background
    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
    ctx.fillRect(0, 0, size, size);

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    // Draw site boundary
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(10, 10, size - 20, size - 20);
    ctx.setLineDash([]); // Reset line dash

    // Draw shapes
    visibleShapes.forEach((shape, index) => {
      const color = getShapeColor(shape, index);

      if (shape.type === 'circle' && shape.points.length >= 2) {
        // Draw circle
        const center = worldToMinimap(
          shape.points[0].x,
          shape.points[0].z || shape.points[0].y,
          sceneBounds,
          size
        );

        const radiusPoint = worldToMinimap(
          shape.points[1].x,
          shape.points[1].z || shape.points[1].y,
          sceneBounds,
          size
        );

        const radius = Math.sqrt(
          Math.pow(radiusPoint.x - center.x, 2) +
          Math.pow(radiusPoint.y - center.y, 2)
        );

        ctx.fillStyle = color + '80'; // 50% opacity
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (shape.points.length >= 2) {
        // Draw polygon/rectangle/line
        ctx.fillStyle = color + '80'; // 50% opacity
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        const firstPoint = worldToMinimap(
          shape.points[0].x,
          shape.points[0].z || shape.points[0].y,
          sceneBounds,
          size
        );
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < shape.points.length; i++) {
          const point = worldToMinimap(
            shape.points[i].x,
            shape.points[i].z || shape.points[i].y,
            sceneBounds,
            size
          );
          ctx.lineTo(point.x, point.y);
        }

        // Close path for filled shapes
        if (shape.type === 'rectangle' || shape.type === 'polygon') {
          ctx.closePath();
          ctx.fill();
        }

        ctx.stroke();
      }
    });

    // Draw player position and direction
    if (walkthroughState) {
      const playerPos = worldToMinimap(
        walkthroughState.position.x,
        walkthroughState.position.z,
        sceneBounds,
        size
      );

      // Draw player circle (red)
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw direction arrow (yellow)
      const directionLength = 12;
      const angle = -walkthroughState.rotation.y; // Negate for correct minimap orientation

      const arrowEndX = playerPos.x + Math.cos(angle) * directionLength;
      const arrowEndY = playerPos.y + Math.sin(angle) * directionLength;

      // Arrow shaft
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playerPos.x, playerPos.y);
      ctx.lineTo(arrowEndX, arrowEndY);
      ctx.stroke();

      // Arrow head
      const arrowHeadLength = 5;
      const arrowHeadAngle = Math.PI / 6; // 30 degrees

      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(
        arrowEndX - arrowHeadLength * Math.cos(angle - arrowHeadAngle),
        arrowEndY - arrowHeadLength * Math.sin(angle - arrowHeadAngle)
      );
      ctx.lineTo(
        arrowEndX - arrowHeadLength * Math.cos(angle + arrowHeadAngle),
        arrowEndY - arrowHeadLength * Math.sin(angle + arrowHeadAngle)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw compass (N indicator)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', size / 2, 20);

    // Draw small arrow pointing north
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 28);
    ctx.lineTo(size / 2, 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size / 2, 28);
    ctx.lineTo(size / 2 - 3, 32);
    ctx.moveTo(size / 2, 28);
    ctx.lineTo(size / 2 + 3, 32);
    ctx.stroke();
  }, [size, visibleShapes, sceneBounds, walkthroughState]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `${margin}px`,
        right: `${margin}px`,
        width: `${size}px`,
        height: `${size}px`,
        zIndex: 1000,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        pointerEvents: 'none', // Don't block clicks
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '5px',
          left: '5px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '600',
        }}
      >
        <span style={{ color: '#EF4444' }}>●</span> You
      </div>
    </div>
  );
}
