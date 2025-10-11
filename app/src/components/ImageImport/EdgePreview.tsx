/**
 * Edge Preview Component
 *
 * Visual preview showing detected boundary with highlighted selected edge.
 * Helps users identify which edge corresponds to which side of their property.
 *
 * FEATURES:
 * - Draws detected boundary polygon on canvas
 * - Highlights selected edge in bright color
 * - Shows edge numbers
 * - Auto-scales to fit container
 * - Responsive canvas sizing
 *
 * @example
 * ```tsx
 * <EdgePreview
 *   vertices={[{x: 0, y: 0}, {x: 100, y: 0}, {x: 100, y: 100}, {x: 0, y: 100}]}
 *   selectedEdgeIndex={0}
 * />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import type { Point2D } from '../../types/imageImport';

interface EdgePreviewProps {
  /** Boundary vertices in pixel coordinates */
  vertices: Point2D[];
  /** Index of currently selected edge */
  selectedEdgeIndex: number;
  /** Canvas width (default: 400) */
  width?: number;
  /** Canvas height (default: 300) */
  height?: number;
}

export const EdgePreview: React.FC<EdgePreviewProps> = ({
  vertices,
  selectedEdgeIndex,
  width = 400,
  height = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || vertices.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate bounding box for auto-scaling
    const minX = Math.min(...vertices.map(v => v.x));
    const maxX = Math.max(...vertices.map(v => v.x));
    const minY = Math.min(...vertices.map(v => v.y));
    const maxY = Math.max(...vertices.map(v => v.y));

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    // Add 10% padding
    const padding = 40;
    const scale = Math.min(
      (width - padding * 2) / boundsWidth,
      (height - padding * 2) / boundsHeight
    );

    // Transform point from image coordinates to canvas coordinates
    const transformPoint = (p: Point2D): { x: number; y: number } => {
      return {
        x: (p.x - minX) * scale + padding,
        y: (p.y - minY) * scale + padding,
      };
    };

    const transformedVertices = vertices.map(transformPoint);

    // Draw polygon background
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Light blue fill
    ctx.beginPath();
    ctx.moveTo(transformedVertices[0].x, transformedVertices[0].y);
    for (let i = 1; i < transformedVertices.length; i++) {
      ctx.lineTo(transformedVertices[i].x, transformedVertices[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw all edges (unselected)
    ctx.strokeStyle = '#6B7280'; // Gray
    ctx.lineWidth = 2;
    for (let i = 0; i < transformedVertices.length; i++) {
      if (i === selectedEdgeIndex) continue; // Skip selected edge for now

      const p1 = transformedVertices[i];
      const p2 = transformedVertices[(i + 1) % transformedVertices.length];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Draw selected edge (highlighted)
    const selectedP1 = transformedVertices[selectedEdgeIndex];
    const selectedP2 = transformedVertices[(selectedEdgeIndex + 1) % transformedVertices.length];

    ctx.strokeStyle = '#EF4444'; // Bright red
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(selectedP1.x, selectedP1.y);
    ctx.lineTo(selectedP2.x, selectedP2.y);
    ctx.stroke();

    // Draw edge label on selected edge (simple numbering, no direction)
    const midX = (selectedP1.x + selectedP2.x) / 2;
    const midY = (selectedP1.y + selectedP2.y) / 2;

    // Simple label without direction (direction was unreliable)
    const label = `Edge ${selectedEdgeIndex + 1}`;
    ctx.font = 'bold 14px "Nunito Sans", sans-serif';
    const metrics = ctx.measureText(label);
    const labelWidth = metrics.width + 16;
    const labelHeight = 24;

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(
      midX - labelWidth / 2,
      midY - labelHeight / 2,
      labelWidth,
      labelHeight,
      4
    );
    ctx.fill();

    // Draw label text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX, midY);

    // Draw vertices as small circles
    transformedVertices.forEach((p, i) => {
      ctx.fillStyle = i === selectedEdgeIndex || i === ((selectedEdgeIndex + 1) % transformedVertices.length)
        ? '#EF4444' // Red for selected edge vertices
        : '#3B82F6'; // Blue for others
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw vertex numbers
      ctx.fillStyle = '#1F2937';
      ctx.font = '12px "Nunito Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, p.x, p.y - 15);
    });

  }, [vertices, selectedEdgeIndex, width, height]);

  if (vertices.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B7280',
          fontSize: '14px',
          fontFamily: 'Nunito Sans, sans-serif',
        }}
      >
        No boundary data available
      </div>
    );
  }

  return (
    <div
      style={{
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '8px',
        backgroundColor: 'white',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
      <div
        style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#6B7280',
          textAlign: 'center',
          fontFamily: 'Nunito Sans, sans-serif',
        }}
      >
        <span style={{ color: '#EF4444', fontWeight: '600' }}>Red edge</span> is the selected edge to measure
      </div>
    </div>
  );
};

export default EdgePreview;
