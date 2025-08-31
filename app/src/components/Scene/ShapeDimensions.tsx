import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { precisionCalculator } from '@/services/precisionCalculations';
import type { Shape } from '@/types';

interface ShapeDimensionsProps {
  shape: Shape;
  elevation?: number;
  isSelected?: boolean;
}

const ShapeDimensions: React.FC<ShapeDimensionsProps> = ({ 
  shape, 
  elevation = 0.01, 
  isSelected = false 
}) => {
  const { camera } = useThree();
  
  // Calculate scale factor based on camera distance for consistent sizing
  const scaleInfo = useMemo(() => {
    // Get camera distance from ground plane
    const cameraHeight = camera.position.y;
    
    // Base sizes that look good at reference distance
    const baseFontSize = 14;
    const baseAreaFontSize = 16;
    const referenceHeight = 30; // Reference camera height
    
    // Scale inversely with camera height (higher = smaller text)
    // Use smooth scaling to prevent jarring transitions
    const scale = Math.max(0.4, Math.min(2.0, referenceHeight / cameraHeight));
    
    return {
      fontSize: Math.round(baseFontSize * scale),
      areaFontSize: Math.round(baseAreaFontSize * scale), 
      padding: Math.max(3, Math.round(4 * scale)),
      areaPadding: Math.max(4, Math.round(5 * scale))
    };
  }, [camera.position.y]); // Only depend on Y position for consistent scaling
  
  const dimensionLabels = useMemo(() => {
    if (!shape.points || shape.points.length < 2) return null;
    
    // For circles, only show radius dimension, not segment dimensions
    if (shape.type === 'circle') {
      if (shape.points.length >= 2) {
        const center = shape.points[0];
        const radiusPoint = shape.points[1];
        const radius = precisionCalculator.calculateDistance(center, radiusPoint);
        
        // Show radius line midpoint
        const midX = (center.x + radiusPoint.x) / 2;
        const midZ = (center.y + radiusPoint.y) / 2;
        
        return (
          <group>
            <Html
              key={`radius-${shape.id}`}
              position={[midX, elevation + 0.15, midZ]}
              center
              sprite
              occlude={false}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 1000
              }}
            >
              <div style={{
                background: isSelected ? 'rgba(29, 78, 216, 0.9)' : 'rgba(30, 30, 30, 0.85)',
                color: 'white',
                padding: `${scaleInfo.padding}px ${scaleInfo.padding * 2}px`,
                borderRadius: `${Math.max(4, scaleInfo.padding)}px`,
                fontSize: `${scaleInfo.fontSize}px`,
                fontWeight: '700',
                whiteSpace: 'nowrap',
                boxShadow: '0 3px 12px rgba(0,0,0,0.4)',
                border: isSelected ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.2)',
                opacity: isSelected ? 1 : 0.9
              }}>
                r = {parseFloat(radius).toFixed(1)}m
              </div>
            </Html>
          </group>
        );
      }
      return null;
    }
    
    // Expand rectangle points to 4 corners if needed
    let points = shape.points;
    if (shape.type === 'rectangle' && shape.points.length === 2) {
      const [topLeft, bottomRight] = shape.points;
      points = [
        { x: topLeft.x, y: topLeft.y },      // Top left
        { x: bottomRight.x, y: topLeft.y },  // Top right
        { x: bottomRight.x, y: bottomRight.y }, // Bottom right
        { x: topLeft.x, y: bottomRight.y }   // Bottom left
      ];
    }
    
    const labels: React.ReactElement[] = [];
    
    // Calculate dimension for each line segment (for non-circle shapes)
    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];
      
      // Skip the last segment for simple 2-point lines (not closed shapes)
      // But allow it for multi-point polylines that should be closed
      if (shape.type === 'line' && points.length === 2 && i === points.length - 1) break;
      
      // Calculate distance between points
      const distance = precisionCalculator.calculateDistance(currentPoint, nextPoint);
      
      // Calculate midpoint for label placement
      const midX = (currentPoint.x + nextPoint.x) / 2;
      const midZ = (currentPoint.y + nextPoint.y) / 2;
      
      labels.push(
        <Html
          key={`dimension-${shape.id}-${i}`}
          position={[midX, elevation + 0.15, midZ]}
          center
          sprite
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1000
          }}
        >
          <div style={{
            background: isSelected ? 'rgba(29, 78, 216, 0.9)' : 'rgba(30, 30, 30, 0.85)',
            color: 'white',
            padding: `${scaleInfo.padding}px ${scaleInfo.padding * 2}px`,
            borderRadius: `${Math.max(4, scaleInfo.padding)}px`,
            fontSize: `${scaleInfo.fontSize}px`,
            fontWeight: '700',
            whiteSpace: 'nowrap',
            boxShadow: '0 3px 12px rgba(0,0,0,0.4)',
            border: isSelected ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.2)',
            opacity: isSelected ? 1 : 0.9
          }}>
            {parseFloat(distance).toFixed(1)}m
          </div>
        </Html>
      );
    }
    
    return <group>{labels}</group>;
  }, [shape, elevation, isSelected, scaleInfo]);

  // Add area label for closed shapes
  const areaLabel = useMemo(() => {
    // Show area for all shapes except pure lines (polylines with 3+ points can have area)
    if (!shape.points || shape.points.length < 2) return null;
    
    // Rectangles and circles only need 2 points, polygons/polylines need 3+
    if (shape.type === 'line' && shape.points.length < 3) return null;
    if ((shape.type === 'polygon') && shape.points.length < 3) return null;
    
    const measurements = precisionCalculator.calculateShapeMeasurements(shape);
    
    
    // Calculate centroid for area label placement
    // Use expanded points for rectangles
    let points = shape.points;
    if (shape.type === 'rectangle' && shape.points.length === 2) {
      const [topLeft, bottomRight] = shape.points;
      points = [
        { x: topLeft.x, y: topLeft.y },      // Top left
        { x: bottomRight.x, y: topLeft.y },  // Top right
        { x: bottomRight.x, y: bottomRight.y }, // Bottom right
        { x: topLeft.x, y: bottomRight.y }   // Bottom left
      ];
    }
    
    const centroid = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    centroid.x /= points.length;
    centroid.y /= points.length;
    
    return (
      <Html
        position={[centroid.x, elevation + 0.25, centroid.y]}
        center
        sprite
        occlude={false}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1000
        }}
      >
        <div style={{
          background: isSelected ? 'rgba(34, 197, 94, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: 'white',
          padding: `${scaleInfo.areaPadding}px ${scaleInfo.areaPadding * 2}px`,
          borderRadius: `${Math.max(6, scaleInfo.areaPadding)}px`,
          fontSize: `${scaleInfo.areaFontSize}px`,
          fontWeight: '800',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,0.7)',
          border: '3px solid rgba(255,255,255,0.8)',
          opacity: 1,
          zIndex: 1000
        }}>
          {measurements.area.squareMeters} m²
        </div>
      </Html>
    );
  }, [shape, elevation, isSelected, scaleInfo]);

  return (
    <group>
      {dimensionLabels}
      {areaLabel}
    </group>
  );
};

export default ShapeDimensions;