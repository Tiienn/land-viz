/**
 * Geometry Preview Component
 *
 * Side-by-side comparison of original image and reconstructed shape.
 * Shows validation results, statistics, and warnings before final import.
 *
 * FEATURES:
 * - Original image preview on left
 * - Reconstructed shape visualization on right (2D canvas)
 * - Shape statistics (area, perimeter, edge lengths, angles)
 * - Area validation results with color-coded status
 * - Warning display for suspicious geometries
 * - Confirm/Edit/Cancel actions
 *
 * @example
 * ```tsx
 * <GeometryPreview
 *   imageUrl="blob:..."
 *   reconstructedShape={shape}
 *   onConfirm={() => addToCanvas()}
 *   onEdit={() => backToForm()}
 *   onCancel={() => close()}
 * />
 * ```
 */

import React, { useRef, useEffect } from 'react';
import type { ReconstructedShape, Point3D } from '../../types/imageImport';

export interface GeometryPreviewProps {
  /** URL of the original uploaded image */
  imageUrl?: string;
  /** Reconstructed shape data */
  reconstructedShape: ReconstructedShape;
  /** Callback when user confirms the import */
  onConfirm: () => void;
  /** Callback when user wants to edit dimensions */
  onEdit: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

export const GeometryPreview: React.FC<GeometryPreviewProps> = ({
  imageUrl,
  reconstructedShape,
  onConfirm,
  onEdit,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw reconstructed shape on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with light background
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vertices = reconstructedShape.vertices;
    if (vertices.length === 0) return;

    // Calculate bounds
    const xCoords = vertices.map((v) => v.x);
    const yCoords = vertices.map((v) => v.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const width = maxX - minX;
    const height = maxY - minY;

    // Calculate scale to fit canvas with padding
    const padding = 40;
    const availableWidth = canvas.width - 2 * padding;
    const availableHeight = canvas.height - 2 * padding;

    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    const scale = Math.min(scaleX, scaleY);

    // Center the shape
    const offsetX = (canvas.width - width * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - height * scale) / 2 - minY * scale;

    // Transform point to canvas coordinates
    const toCanvas = (p: Point3D) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    });

    // Draw shape outline
    ctx.beginPath();
    const firstPoint = toCanvas(vertices[0]);
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < vertices.length; i++) {
      const p = toCanvas(vertices[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();

    // Fill shape
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Blue fill
    ctx.fill();

    // Stroke outline
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw vertices
    vertices.forEach((v, i) => {
      const p = toCanvas(v);

      // Vertex circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#1F2937';
      ctx.fill();

      // Vertex label
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px "Nunito Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, p.x, p.y - 15);
    });

    // Draw edge labels with lengths
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const p1 = toCanvas(v1);
      const p2 = toCanvas(v2);

      // Calculate edge midpoint
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Calculate edge length
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Draw edge length label
      ctx.fillStyle = 'white';
      ctx.fillRect(midX - 30, midY - 10, 60, 20);

      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - 30, midY - 10, 60, 20);

      ctx.fillStyle = '#1F2937';
      ctx.font = '11px "Nunito Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${length.toFixed(2)}m`, midX, midY);
    }
  }, [reconstructedShape]);

  const hasWarnings = reconstructedShape.warnings.length > 0;
  const areaValidation = reconstructedShape.areaValidation;

  return (
    <div style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#1F2937',
          }}
        >
          🔍 Preview Reconstructed Shape
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
          Verify the reconstructed geometry before adding to canvas
        </p>
      </div>

      {/* Side-by-Side Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: imageUrl ? '1fr 1fr' : '1fr',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Original Image */}
        {imageUrl && (
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px',
              }}
            >
              Original Image
            </div>
            <div
              style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px solid #E5E7EB',
              }}
            >
              <img
                src={imageUrl}
                alt="Original site plan"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        )}

        {/* Reconstructed Shape */}
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            Reconstructed Shape
          </div>
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            style={{
              width: '100%',
              height: '300px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              border: '2px solid #E5E7EB',
            }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '12px',
          }}
        >
          📊 Shape Statistics
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Vertices */}
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
              Vertices
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
              {reconstructedShape.vertices.length}
            </div>
          </div>

          {/* Area */}
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
              Area
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
              {reconstructedShape.area.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              m²
            </div>
          </div>

          {/* Perimeter */}
          <div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
              Perimeter
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
              {reconstructedShape.perimeter.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              m
            </div>
          </div>
        </div>

        {/* Angles */}
        {reconstructedShape.angles.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                color: '#6B7280',
                marginBottom: '6px',
              }}
            >
              Corner Angles
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {reconstructedShape.angles.map((angle, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    backgroundColor: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  ∠{index + 1}: {angle.toFixed(1)}°
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Area Validation */}
      {areaValidation && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor:
              areaValidation.status === 'valid' ? '#D1FAE5' : '#FEF3C7',
            borderRadius: '8px',
            marginBottom: '16px',
            border: `2px solid ${
              areaValidation.status === 'valid' ? '#10B981' : '#F59E0B'
            }`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>
              {areaValidation.status === 'valid' ? '✓' : '⚠️'}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: areaValidation.status === 'valid' ? '#065F46' : '#92400E',
                  marginBottom: '4px',
                }}
              >
                {areaValidation.status === 'valid'
                  ? 'Area Validation Passed'
                  : 'Area Validation Warning'}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: areaValidation.status === 'valid' ? '#065F46' : '#92400E',
                }}
              >
                {areaValidation.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEF3C7',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '2px solid #F59E0B',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#92400E',
              marginBottom: '8px',
            }}
          >
            ⚠️ Geometry Warnings ({reconstructedShape.warnings.length})
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {reconstructedShape.warnings.map((warning, index) => (
              <li
                key={index}
                style={{
                  fontSize: '12px',
                  color: '#92400E',
                  marginBottom: '4px',
                }}
              >
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            backgroundColor: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E5E7EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
          }}
        >
          Cancel
        </button>

        <button
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#3B82F6',
            backgroundColor: 'white',
            border: '2px solid #3B82F6',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EFF6FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          ← Edit Dimensions
        </button>

        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'white',
            backgroundColor: '#10B981',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ✓ Confirm & Import
        </button>
      </div>
    </div>
  );
};

export default GeometryPreview;
