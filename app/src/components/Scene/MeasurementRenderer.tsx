import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Measurement, Point2D } from '@/types';
import { MeasurementUtils } from '../../utils/measurementUtils';

interface MeasurementRendererProps {
  elevation?: number;
}

// Component to render a single measurement line with label
const MeasurementLine: React.FC<{
  measurement: Measurement;
  elevation: number;
  isSelected: boolean;
  isPreview?: boolean;
}> = ({ measurement, elevation, isSelected, isPreview = false }) => {

  const linePoints = useMemo(() => {
    const startPos = new Vector3(
      measurement.startPoint.position.x,
      elevation,
      measurement.startPoint.position.y
    );
    const endPos = new Vector3(
      measurement.endPoint.position.x,
      elevation,
      measurement.endPoint.position.y
    );
    return [startPos, endPos];
  }, [measurement.startPoint.position, measurement.endPoint.position, elevation]);

  // Colors based on state
  const lineColor = isSelected ? '#3b82f6' : (isPreview ? '#10b981' : '#e11d48');

  if (!measurement.visible && !isPreview) {
    return null;
  }

  return (
    <group>
      {/* Measurement line */}
      <Line
        points={linePoints}
        color={lineColor}
        lineWidth={isSelected ? 3 : 2}
        transparent
        opacity={isPreview ? 0.7 : 1}
      />

      {/* Start point indicator */}
      <mesh position={linePoints[0]}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color={lineColor} transparent opacity={isPreview ? 0.7 : 1} />
      </mesh>

      {/* End point indicator */}
      <mesh position={linePoints[1]}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color={lineColor} transparent opacity={isPreview ? 0.7 : 1} />
      </mesh>

    </group>
  );
};

// Component to render measurement preview during measurement
const MeasurementPreview: React.FC<{
  startPoint: Point2D;
  endPoint: Point2D;
  elevation: number;
  unit: 'metric' | 'imperial';
}> = ({ startPoint, endPoint, elevation, unit }) => {

  const previewMeasurement = useMemo(() => {
    const distance = MeasurementUtils.calculateDistance(startPoint, endPoint);
    return {
      id: 'preview',
      startPoint: {
        id: 'preview-start',
        position: startPoint,
        timestamp: new Date(),
      },
      endPoint: {
        id: 'preview-end',
        position: endPoint,
        timestamp: new Date(),
      },
      distance,
      unit,
      created: new Date(),
      visible: true,
    } as Measurement;
  }, [startPoint, endPoint, unit]);

  return (
    <MeasurementLine
      measurement={previewMeasurement}
      elevation={elevation}
      isSelected={false}
      isPreview={true}
    />
  );
};

export const MeasurementRenderer: React.FC<MeasurementRendererProps> = ({
  elevation = 0.03
}) => {
  // Get measurement state from store
  const measurements = useAppStore(state => state.drawing.measurement.measurements);
  const selectedMeasurementId = useAppStore(state => state.drawing.measurement.selectedMeasurementId);
  const showMeasurements = useAppStore(state => state.drawing.measurement.showMeasurements);
  const unit = useAppStore(state => state.drawing.measurement.unit);

  // Get measurement preview state
  const isMeasuring = useAppStore(state => state.drawing.measurement.isMeasuring);
  const startPoint = useAppStore(state => state.drawing.measurement.startPoint);
  const previewEndPoint = useAppStore(state => state.drawing.measurement.previewEndPoint);

  // Don't render anything if measurements are hidden
  if (!showMeasurements) {
    return null;
  }

  return (
    <group>
      {/* Render all completed measurements */}
      {measurements.map((measurement) => (
        <MeasurementLine
          key={measurement.id}
          measurement={measurement}
          elevation={elevation}
          isSelected={measurement.id === selectedMeasurementId}
        />
      ))}

      {/* Render measurement preview during active measurement */}
      {isMeasuring && startPoint && previewEndPoint && (
        <MeasurementPreview
          startPoint={startPoint.position}
          endPoint={previewEndPoint}
          elevation={elevation + 0.01} // Slightly above other measurements
          unit={unit}
        />
      )}
    </group>
  );
};

export default MeasurementRenderer;