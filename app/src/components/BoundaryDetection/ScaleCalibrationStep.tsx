/**
 * Scale Calibration Step
 *
 * Allows user to calibrate scale by clicking two points on a known dimension.
 * Converts pixel measurements to real-world units (meters, feet, etc.).
 *
 * Features:
 * - Interactive canvas for point selection
 * - Reference line visualization
 * - Unit conversion (feet, meters, yards, etc.)
 * - Real-time scale calculation
 */

import { useEffect, useRef, useState } from 'react';
import { tokens } from '../../styles/tokens';
import { calculateScale, convertToMeters } from '../../services/boundaryDetection/coordinateUtils';
import type { BoundaryDetectionResult, ScaleCalibration, TerrainType, FenceStyle } from '../../services/boundaryDetection/types';

interface ScaleCalibrationStepProps {
  result: BoundaryDetectionResult;
  onScaleCalculated: (scale: ScaleCalibration) => void;
  onNext: () => void;
  onBack: () => void;
  onGenerate3DWorld?: (config: { terrainType: TerrainType; fenceStyle: FenceStyle; fenceHeight: number }) => void;
}

const UNITS = [
  { value: 'meters', label: 'Meters (m)' },
  { value: 'feet', label: 'Feet (ft)' },
  { value: 'yards', label: 'Yards (yd)' },
  { value: 'inches', label: 'Inches (in)' },
  { value: 'centimeters', label: 'Centimeters (cm)' },
  { value: 'kilometers', label: 'Kilometers (km)' },
  { value: 'miles', label: 'Miles (mi)' },
];

// Phase 1: Terrain and fence options for 3D world generation
const TERRAIN_TYPES: { value: TerrainType; label: string; icon: string }[] = [
  { value: 'grass', label: 'Grass', icon: '🌿' },
  { value: 'concrete', label: 'Concrete', icon: '🏗️' },
  { value: 'dirt', label: 'Dirt', icon: '🟤' },
  { value: 'gravel', label: 'Gravel', icon: '⚫' },
  { value: 'sand', label: 'Sand', icon: '🏖️' },
];

const FENCE_STYLES: { value: FenceStyle; label: string; icon: string }[] = [
  { value: 'wooden', label: 'Wooden Fence', icon: '🪵' },
  { value: 'metal', label: 'Metal Fence', icon: '🔩' },
  { value: 'stone', label: 'Stone Wall', icon: '🧱' },
  { value: 'hedge', label: 'Hedge', icon: '🌳' },
  { value: 'none', label: 'No Fence', icon: '❌' },
];

export default function ScaleCalibrationStep({
  result,
  onScaleCalculated,
  onNext,
  onBack,
  onGenerate3DWorld,
}: ScaleCalibrationStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [point1, setPoint1] = useState<[number, number] | null>(null);
  const [point2, setPoint2] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [unit, setUnit] = useState<string>('feet');
  const [scale, setScale] = useState<ScaleCalibration | null>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<[number, number]>([0, 0]);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<[number, number] | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<[number, number] | null>(null);

  // Phase 1: 3D World generation options
  const [terrainType, setTerrainType] = useState<TerrainType>('grass');
  const [fenceStyle, setFenceStyle] = useState<FenceStyle>('wooden');
  const [fenceHeight, setFenceHeight] = useState<number>(1.5);

  // Zoom and prevent modal scroll (native event listener)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();

      // Calculate actual displayed content area (accounting for objectFit: contain)
      const canvasAspect = canvas.width / canvas.height;
      const displayAspect = rect.width / rect.height;

      let displayWidth, displayHeight, offsetX, offsetY;

      if (canvasAspect > displayAspect) {
        displayWidth = rect.width;
        displayHeight = rect.width / canvasAspect;
        offsetX = 0;
        offsetY = (rect.height - displayHeight) / 2;
      } else {
        displayWidth = rect.height * canvasAspect;
        displayHeight = rect.height;
        offsetX = (rect.width - displayWidth) / 2;
        offsetY = 0;
      }

      // Get mouse position relative to actual content area
      const contentX = e.clientX - rect.left - offsetX;
      const contentY = e.clientY - rect.top - offsetY;

      // Convert to canvas internal coordinates
      const scaleX = canvas.width / displayWidth;
      const scaleY = canvas.height / displayHeight;
      const mouseX = contentX * scaleX;
      const mouseY = contentY * scaleY;

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

  // Draw image and reference line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
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

    // Draw reference line
    if (point1) {
      // Draw first point
      ctx.fillStyle = '#00C4CC';
      ctx.beginPath();
      ctx.arc(point1[0], point1[1], 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (point2) {
        // Draw line
        ctx.strokeStyle = '#00C4CC';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(point1[0], point1[1]);
        ctx.lineTo(point2[0], point2[1]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw second point
        ctx.fillStyle = '#00C4CC';
        ctx.beginPath();
        ctx.arc(point2[0], point2[1], 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw distance label
        const midX = (point1[0] + point2[0]) / 2;
        const midY = (point1[1] + point2[1]) / 2;
        const pixelDist = Math.sqrt(
          Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2)
        );

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = 'bold 16px sans-serif';
        const label = `${pixelDist.toFixed(0)} pixels`;
        const metrics = ctx.measureText(label);
        const padding = 8;

        ctx.fillRect(
          midX - metrics.width / 2 - padding,
          midY - 12 - padding,
          metrics.width + padding * 2,
          24 + padding * 2
        );

        ctx.fillStyle = '#00C4CC';
        ctx.fillText(label, midX - metrics.width / 2, midY + 4);
      }
    }

    // Restore context state
    ctx.restore();
  }, [result, point1, point2, zoom, panOffset]);

  // Calculate scale when distance changes
  useEffect(() => {
    if (point1 && point2 && distance) {
      const distanceNum = parseFloat(distance);
      if (!isNaN(distanceNum) && distanceNum > 0) {
        const distanceInMeters = convertToMeters(distanceNum, unit);
        const calculatedScale = calculateScale(point1, point2, distanceInMeters, unit);
        setScale(calculatedScale);
        onScaleCalculated(calculatedScale);
      } else {
        setScale(null);
      }
    }
  }, [point1, point2, distance, unit, onScaleCalculated]);



  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Track mouse down position for click detection
    setMouseDownPos([e.clientX, e.clientY]);

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

  // Mouse up handler
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Check if this was a click (mouse didn't move much)
    if (mouseDownPos && !isPanning) {
      const dx = e.clientX - mouseDownPos[0];
      const dy = e.clientY - mouseDownPos[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If mouse moved less than 5 pixels, treat as a click
      if (distance < 5) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();

          // Calculate actual displayed content area (accounting for objectFit: contain)
          const canvasAspect = canvas.width / canvas.height;
          const displayAspect = rect.width / rect.height;

          let displayWidth, displayHeight, offsetX, offsetY;

          if (canvasAspect > displayAspect) {
            // Canvas is wider - fit to width, letterbox top/bottom
            displayWidth = rect.width;
            displayHeight = rect.width / canvasAspect;
            offsetX = 0;
            offsetY = (rect.height - displayHeight) / 2;
          } else {
            // Canvas is taller - fit to height, letterbox left/right
            displayWidth = rect.height * canvasAspect;
            displayHeight = rect.height;
            offsetX = (rect.width - displayWidth) / 2;
            offsetY = 0;
          }

          // Get mouse position relative to actual content area
          const contentX = e.clientX - rect.left - offsetX;
          const contentY = e.clientY - rect.top - offsetY;

          // Convert to canvas internal coordinates
          const scaleX = canvas.width / displayWidth;
          const scaleY = canvas.height / displayHeight;
          const canvasX = contentX * scaleX;
          const canvasY = contentY * scaleY;

          // Apply inverse zoom and pan transform
          const x = (canvasX - panOffset[0]) / zoom;
          const y = (canvasY - panOffset[1]) / zoom;

          if (!point1) {
            setPoint1([x, y]);
          } else if (!point2) {
            setPoint2([x, y]);
          } else {
            // Reset and start over
            setPoint1([x, y]);
            setPoint2(null);
            setScale(null);
          }
        }
      }
    }

    setIsPanning(false);
    setLastMousePos(null);
    setMouseDownPos(null);
  };

  const handleReset = () => {
    setPoint1(null);
    setPoint2(null);
    setDistance('');
    setScale(null);
    setZoom(1);
    setPanOffset([0, 0]);
  };

  const canProceed = point1 && point2 && scale && parseFloat(distance) > 0;

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
          Scale Calibration
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: tokens.colors.neutral[600],
            margin: 0,
          }}
        >
          Click two points on a known dimension, then enter the real-world distance
        </p>
      </div>

      {/* Instructions */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(0, 196, 204, 0.05)',
          border: `1px solid rgba(0, 196, 204, 0.2)`,
          borderRadius: '8px',
        }}
      >
        <div style={{ fontSize: '13px', color: tokens.colors.neutral[700] }}>
          <strong>Instructions:</strong>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Click the first point on a dimension you know (e.g., edge of property)</li>
            <li>Click the second point at the other end of that dimension</li>
            <li>Enter the real-world distance between those points</li>
          </ol>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          border: `2px solid ${tokens.colors.brand.teal}`,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsPanning(false);
            setLastMousePos(null);
            setMouseDownPos(null);
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '400px',
            objectFit: 'contain',
            cursor: isPanning ? 'grabbing' : 'crosshair',
          }}
        />
        {(!point1 || !point2) && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#00C4CC',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              pointerEvents: 'none',
            }}
          >
            {!point1 ? 'Click first point' : 'Click second point'}
          </div>
        )}
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

      {/* Distance Input */}
      {point1 && point2 && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: tokens.colors.neutral[900],
                marginBottom: '8px',
              }}
            >
              Known Distance
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="Enter distance"
              min="0"
              step="0.1"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: `1px solid ${tokens.colors.neutral[300]}`,
                borderRadius: '8px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = tokens.colors.brand.teal;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = tokens.colors.neutral[300];
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: tokens.colors.neutral[900],
                marginBottom: '8px',
              }}
            >
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: `1px solid ${tokens.colors.neutral[300]}`,
                borderRadius: '8px',
                backgroundColor: tokens.colors.background.primary,
                cursor: 'pointer',
              }}
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              color: tokens.colors.neutral[700],
              backgroundColor: 'transparent',
              border: `1px solid ${tokens.colors.neutral[300]}`,
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Scale Info */}
      {scale && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.05)',
            border: `1px solid rgba(34, 197, 94, 0.2)`,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E', marginBottom: '8px' }}>
            ✓ Scale Calculated
          </div>
          <div style={{ fontSize: '13px', color: tokens.colors.neutral[700] }}>
            <strong>Scale:</strong> 1 pixel = {(1 / scale.pixelsPerMeter).toFixed(4)} meters
            <br />
            <strong>Real distance:</strong> {distance} {unit} = {convertToMeters(parseFloat(distance), unit).toFixed(2)} meters
          </div>
        </div>
      )}

      {/* Phase 1: 3D World Generation Options */}
      {scale && onGenerate3DWorld && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'rgba(0, 196, 204, 0.05)',
            border: `1px solid rgba(0, 196, 204, 0.2)`,
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: tokens.colors.brand.teal,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🌍 Generate 3D World
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Terrain Type */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: tokens.colors.neutral[700],
                  marginBottom: '8px',
                }}
              >
                Terrain Type
              </label>
              <select
                value={terrainType}
                onChange={(e) => setTerrainType(e.target.value as TerrainType)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: '8px',
                  backgroundColor: tokens.colors.background.primary,
                  cursor: 'pointer',
                }}
              >
                {TERRAIN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fence Style */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: tokens.colors.neutral[700],
                  marginBottom: '8px',
                }}
              >
                Fence Style
              </label>
              <select
                value={fenceStyle}
                onChange={(e) => setFenceStyle(e.target.value as FenceStyle)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: '8px',
                  backgroundColor: tokens.colors.background.primary,
                  cursor: 'pointer',
                }}
              >
                {FENCE_STYLES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.icon} {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fence Height */}
            {fenceStyle !== 'none' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: tokens.colors.neutral[700],
                    marginBottom: '8px',
                  }}
                >
                  Fence Height (m)
                </label>
                <input
                  type="number"
                  value={fenceHeight}
                  onChange={(e) => setFenceHeight(parseFloat(e.target.value) || 1.5)}
                  min="0.5"
                  max="3"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${tokens.colors.neutral[300]}`,
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}
          </div>

          {/* Generate 3D World Button */}
          <button
            onClick={() => onGenerate3DWorld({ terrainType, fenceStyle, fenceHeight })}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff',
              background: `linear-gradient(135deg, ${tokens.colors.brand.teal}, ${tokens.colors.brand.purple})`,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              boxShadow: '0 4px 12px rgba(0, 196, 204, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 196, 204, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 196, 204, 0.3)';
            }}
          >
            🚶 Generate 3D World & Walk Through
          </button>

          <p
            style={{
              fontSize: '12px',
              color: tokens.colors.neutral[500],
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            Experience your property in first-person 3D walkthrough mode
          </p>
        </div>
      )}

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
          disabled={!canProceed}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            backgroundColor: canProceed ? tokens.colors.brand.teal : tokens.colors.neutral[300],
            border: 'none',
            borderRadius: '8px',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            opacity: canProceed ? 1 : 0.6,
          }}
        >
          Import Boundaries →
        </button>
      </div>
    </div>
  );
}
