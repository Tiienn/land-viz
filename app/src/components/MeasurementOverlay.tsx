import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Vector3 } from 'three';
import type { Measurement } from '@/types';
import { MeasurementUtils } from '../utils/measurementUtils';

interface MeasurementOverlayProps {
  camera?: any;
  canvas?: HTMLCanvasElement;
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({ camera, canvas }) => {
  const measurements = useAppStore(state => state.drawing.measurement.measurements);
  const showMeasurements = useAppStore(state => state.drawing.measurement.showMeasurements);
  const selectedMeasurementId = useAppStore(state => state.drawing.measurement.selectedMeasurementId);
  const unit = useAppStore(state => state.drawing.measurement.unit);

  // Preview state
  const isMeasuring = useAppStore(state => state.drawing.measurement.isMeasuring);
  const startPoint = useAppStore(state => state.drawing.measurement.startPoint);
  const previewEndPoint = useAppStore(state => state.drawing.measurement.previewEndPoint);

  const [labelPositions, setLabelPositions] = useState<Array<{ id: string; x: number; y: number; text: string; color: string; isPreview?: boolean }>>([]);

  useEffect(() => {
    if (!camera || !canvas || !showMeasurements) {
      setLabelPositions([]);
      return;
    }

    const updatePositions = () => {
      const rect = canvas.getBoundingClientRect();
      const positions: Array<{ id: string; x: number; y: number; text: string; color: string; isPreview?: boolean }> = [];

      // Add completed measurements
      measurements.forEach(measurement => {
        if (!measurement.visible) return;

        const midPoint = new Vector3(
          (measurement.startPoint.position.x + measurement.endPoint.position.x) / 2,
          0.03,
          (measurement.startPoint.position.y + measurement.endPoint.position.y) / 2
        );

        const screenPos = midPoint.clone().project(camera);

        if (screenPos.z < 1) { // In front of camera
          const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
          const y = (screenPos.y * -0.5 + 0.5) * rect.height + rect.top;

          const distance = MeasurementUtils.formatDistance(measurement.distance, measurement.unit);
          const isSelected = measurement.id === selectedMeasurementId;

          positions.push({
            id: measurement.id,
            x,
            y,
            text: distance,
            color: isSelected ? '#3b82f6' : '#e11d48'
          });
        }
      });

      // Add preview measurement
      if (isMeasuring && startPoint && previewEndPoint) {
        const midPoint = new Vector3(
          (startPoint.position.x + previewEndPoint.x) / 2,
          0.04,
          (startPoint.position.y + previewEndPoint.y) / 2
        );

        const screenPos = midPoint.clone().project(camera);

        if (screenPos.z < 1) {
          const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
          const y = (screenPos.y * -0.5 + 0.5) * rect.height + rect.top;

          const distance = MeasurementUtils.calculateDistance(startPoint.position, previewEndPoint);
          const formattedDistance = MeasurementUtils.formatDistance(distance, unit);

          positions.push({
            id: 'preview',
            x,
            y,
            text: formattedDistance,
            color: '#10b981',
            isPreview: true
          });
        }
      }

      setLabelPositions(positions);
    };

    // Only update positions once, not in an animation loop
    updatePositions();

    return () => {
      // No cleanup needed since we're not using requestAnimationFrame
    };
  }, [camera, canvas, measurements, showMeasurements, selectedMeasurementId, unit, isMeasuring, startPoint, previewEndPoint]);

  if (!showMeasurements) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1000 }}>
      {labelPositions.map(({ id, x, y, text, color, isPreview }) => (
        <div
          key={id}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: '"Nunito Sans", system-ui, sans-serif',
            border: `1px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            opacity: isPreview ? 0.7 : 1
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
};