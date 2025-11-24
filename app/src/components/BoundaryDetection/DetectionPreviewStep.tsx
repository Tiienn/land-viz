/**
 * Detection Preview Step
 *
 * Shows detected boundaries overlaid on the original image.
 * Allows user to select which boundaries to import.
 *
 * Features:
 * - Canvas overlay with detected boundaries
 * - Color-coded confidence levels
 * - Individual boundary selection
 * - Preview metadata (area, perimeter, confidence)
 */

import { useEffect, useRef, useState } from 'react';
import { tokens } from '../../styles/tokens';
import type { DetectedBoundary, BoundaryDetectionResult } from '../../services/boundaryDetection/types';

interface DetectionPreviewStepProps {
  result: BoundaryDetectionResult;
  onSelectedBoundariesChange: (selectedIds: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DetectionPreviewStep({
  result,
  onSelectedBoundariesChange,
  onNext,
  onBack,
}: DetectionPreviewStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundaryListRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [selectedBoundaryIds, setSelectedBoundaryIds] = useState<Set<string>>(
    new Set(result.boundaries.map(b => b.id))
  );
  const [highlightedBoundaryId, setHighlightedBoundaryId] = useState<string | null>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<[number, number]>([0, 0]);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<[number, number] | null>(null);

  // Zoom and prevent modal scroll (native event listener)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Get mouse position in canvas coordinates
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      // Calculate zoom delta
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(5, zoom * delta));

      // Adjust pan to keep mouse position fixed
      const newPanX = mouseX - ((mouseX - panOffset[0]) / zoom) * newZoom;
      const newPanY = mouseY - ((mouseY - panOffset[1]) / zoom) * newZoom;

      setZoom(newZoom);
      setPanOffset([newPanX, newPanY]);
    };

    // Add listener with { passive: false } to allow preventDefault
    canvas.addEventListener('wheel', handleWheelNative, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [zoom, panOffset]);

  // Draw boundaries on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = result.metadata.imageWidth;
    canvas.height = result.metadata.imageHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply zoom and pan transforms
    ctx.translate(panOffset[0], panOffset[1]);
    ctx.scale(zoom, zoom);

    // Draw original image
    ctx.drawImage(result.originalImage, 0, 0);

    // Draw detected boundaries
    result.boundaries.forEach((boundary) => {
      const isSelected = selectedBoundaryIds.has(boundary.id);
      const alpha = isSelected ? 0.6 : 0.3;

      // Color based on confidence
      let color: string;
      if (boundary.confidence >= 0.7) {
        color = `rgba(34, 197, 94, ${alpha})`; // Green (high confidence)
      } else if (boundary.confidence >= 0.5) {
        color = `rgba(234, 179, 8, ${alpha})`; // Yellow (medium confidence)
      } else {
        color = `rgba(239, 68, 68, ${alpha})`; // Red (low confidence)
      }

      // Draw filled polygon
      ctx.fillStyle = color;
      ctx.beginPath();
      boundary.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
      });
      ctx.closePath();
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = isSelected ? '#00C4CC' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Draw points
      boundary.points.forEach((point) => {
        ctx.fillStyle = isSelected ? '#00C4CC' : 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(point[0], point[1], isSelected ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw label
      const centerX = boundary.points.reduce((sum, p) => sum + p[0], 0) / boundary.points.length;
      const centerY = boundary.points.reduce((sum, p) => sum + p[1], 0) / boundary.points.length;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = '14px sans-serif';
      const label = `${boundary.type} (${(boundary.confidence * 100).toFixed(0)}%)`;
      const metrics = ctx.measureText(label);
      const padding = 6;

      ctx.fillRect(
        centerX - metrics.width / 2 - padding,
        centerY - 10 - padding,
        metrics.width + padding * 2,
        20 + padding * 2
      );

      ctx.fillStyle = '#fff';
      ctx.fillText(label, centerX - metrics.width / 2, centerY + 4);
    });

    // Restore context state
    ctx.restore();
  }, [result, selectedBoundaryIds, zoom, panOffset]);

  const toggleBoundary = (id: string) => {
    const newSelected = new Set(selectedBoundaryIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBoundaryIds(newSelected);
    onSelectedBoundariesChange(Array.from(newSelected));
  };

  const selectAll = () => {
    const allIds = new Set(result.boundaries.map(b => b.id));
    setSelectedBoundaryIds(allIds);
    onSelectedBoundariesChange(Array.from(allIds));
  };

  const deselectAll = () => {
    setSelectedBoundaryIds(new Set());
    onSelectedBoundariesChange([]);
  };


  // Mouse down handler for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Right-click or middle-click or Shift+click for panning
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setLastMousePos([e.clientX, e.clientY]);
    }
  };

  // Mouse move handler for panning
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning || !lastMousePos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const dx = (e.clientX - lastMousePos[0]) * scaleX;
    const dy = (e.clientY - lastMousePos[1]) * scaleY;

    setPanOffset([panOffset[0] + dx, panOffset[1] + dy]);
    setLastMousePos([e.clientX, e.clientY]);
  };

  // Mouse up handler for panning
  const handleMouseUp = () => {
    setIsPanning(false);
    setLastMousePos(null);
  };

  // Point-in-polygon detection using ray casting algorithm
  const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Canvas click handler to detect which polygon was clicked
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't select if we were panning
    if (isPanning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get canvas coordinates
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Apply inverse zoom and pan transform to get image coordinates
    const x = (canvasX - panOffset[0]) / zoom;
    const y = (canvasY - panOffset[1]) / zoom;

    // Find which boundary was clicked (check in reverse order to prioritize top-most)
    for (let i = result.boundaries.length - 1; i >= 0; i--) {
      const boundary = result.boundaries[i];
      if (isPointInPolygon([x, y], boundary.points)) {
        // Highlight this boundary
        setHighlightedBoundaryId(boundary.id);

        // Scroll to this boundary in the list
        const element = boundaryListRef.current[boundary.id];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Flash effect: clear highlight after 2 seconds
        setTimeout(() => {
          setHighlightedBoundaryId(null);
        }, 2000);

        break;
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: tokens.colors.neutral[900],
            marginBottom: '8px',
          }}
        >
          Detection Results
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: tokens.colors.neutral[600],
            margin: 0,
          }}
        >
          Found {result.boundaries.length} boundaries in {result.metadata.processingTime.toFixed(0)}ms
        </p>
      </div>

      {/* Canvas Preview */}
      <div
        ref={containerRef}
        style={{
          border: `1px solid ${tokens.colors.neutral[200]}`,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '400px',
            objectFit: 'contain',
            cursor: isPanning ? 'grabbing' : 'pointer',
          }}
        />
        {/* Zoom indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            padding: '6px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            pointerEvents: 'none',
          }}
        >
          {zoom.toFixed(1)}x
        </div>
        {/* Help text */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            padding: '6px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: tokens.colors.neutral[400],
            fontSize: '11px',
            borderRadius: '6px',
            pointerEvents: 'none',
          }}
        >
          Scroll to zoom • Shift+Drag to pan
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '12px',
          backgroundColor: tokens.colors.background.secondary,
          borderRadius: '8px',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(34, 197, 94, 0.6)', borderRadius: '2px' }} />
          <span>High Confidence (≥70%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(234, 179, 8, 0.6)', borderRadius: '2px' }} />
          <span>Medium Confidence (50-69%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(239, 68, 68, 0.6)', borderRadius: '2px' }} />
          <span>Low Confidence (&lt;50%)</span>
        </div>
      </div>

      {/* Boundary List */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: tokens.colors.neutral[900],
              margin: 0,
            }}
          >
            Select Boundaries to Import
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={selectAll}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                color: tokens.colors.neutral[700],
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.neutral[300]}`,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                color: tokens.colors.neutral[700],
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.neutral[300]}`,
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Deselect All
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {result.boundaries.map((boundary, index) => {
            const isSelected = selectedBoundaryIds.has(boundary.id);
            const isHighlighted = highlightedBoundaryId === boundary.id;
            return (
              <div
                key={boundary.id}
                ref={(el) => (boundaryListRef.current[boundary.id] = el)}
                onClick={() => toggleBoundary(boundary.id)}
                style={{
                  padding: '12px',
                  border: `2px solid ${
                    isHighlighted
                      ? '#7C3AED'
                      : isSelected
                      ? tokens.colors.brand.teal
                      : tokens.colors.neutral[200]
                  }`,
                  borderRadius: '8px',
                  backgroundColor: isHighlighted
                    ? 'rgba(124, 58, 237, 0.1)'
                    : isSelected
                    ? 'rgba(0, 196, 204, 0.05)'
                    : tokens.colors.background.primary,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  boxShadow: isHighlighted ? '0 0 0 4px rgba(124, 58, 237, 0.2)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: tokens.colors.neutral[900] }}>
                      Boundary #{index + 1} - {boundary.type}
                    </div>
                    <div style={{ fontSize: '13px', color: tokens.colors.neutral[600], marginTop: '4px' }}>
                      {boundary.points.length} points • {boundary.area.toFixed(0)} px² •
                      {boundary.simplified && ' simplified'}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor:
                        boundary.confidence >= 0.7
                          ? 'rgba(34, 197, 94, 0.1)'
                          : boundary.confidence >= 0.5
                          ? 'rgba(234, 179, 8, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                      color:
                        boundary.confidence >= 0.7
                          ? '#22C55E'
                          : boundary.confidence >= 0.5
                          ? '#EAB308'
                          : '#EF4444',
                    }}
                  >
                    {(boundary.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(0, 196, 204, 0.05)',
          border: `1px solid rgba(0, 196, 204, 0.2)`,
          borderRadius: '8px',
          fontSize: '13px',
          color: tokens.colors.neutral[700],
        }}
      >
        💡 <strong>Next:</strong> You'll calibrate the scale by selecting a known dimension on the image.
        This converts pixel measurements to real-world meters.
      </div>

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: tokens.colors.neutral[700],
            backgroundColor: 'transparent',
            border: `1px solid ${tokens.colors.neutral[300]}`,
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedBoundaryIds.size === 0}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: selectedBoundaryIds.size > 0 ? tokens.colors.brand.teal : tokens.colors.neutral[300],
            border: 'none',
            borderRadius: '8px',
            cursor: selectedBoundaryIds.size > 0 ? 'pointer' : 'not-allowed',
            opacity: selectedBoundaryIds.size > 0 ? 1 : 0.6,
          }}
        >
          Next: Scale Calibration →
        </button>
      </div>
    </div>
  );
}
