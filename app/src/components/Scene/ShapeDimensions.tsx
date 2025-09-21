import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';
import { precisionCalculator } from '@/services/precisionCalculations';
import type { Shape } from '@/types';

interface ShapeDimensionsProps {
  shape: Shape;
  elevation?: number;
  isSelected?: boolean;
  isResizeMode?: boolean;
}

const ShapeDimensions: React.FC<ShapeDimensionsProps> = ({
  shape,
  elevation = 0.01,
  isSelected = false,
  isResizeMode = false
}) => {
  const { camera } = useThree();
  const renderTrigger = useAppStore(state => state.renderTrigger);
  
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
        let midX = (center.x + radiusPoint.x) / 2;
        let midZ = (center.y + radiusPoint.y) / 2;
        
        // In resize mode, move radius text outward to avoid handles
        if (isResizeMode) {
          const dx = radiusPoint.x - center.x;
          const dz = radiusPoint.y - center.y;
          const length = Math.sqrt(dx * dx + dz * dz);
          
          if (length > 0) {
            const pushDistance = 2; // Units to push outward from radius line
            midX += (dx / length) * pushDistance;
            midZ += (dz / length) * pushDistance;
          }
        }
        
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
      if (shape.type === 'polyline' && points.length === 2 && i === points.length - 1) break;
      
      // Calculate distance between points
      const distance = precisionCalculator.calculateDistance(currentPoint, nextPoint);
      
      // Calculate midpoint for label placement
      let midX = (currentPoint.x + nextPoint.x) / 2;
      let midZ = (currentPoint.y + nextPoint.y) / 2;
      
      // In resize mode, move dimension text outward to avoid handles
      if (isResizeMode) {
        // Calculate the vector from shape center to midpoint
        let shapeCenter = { x: 0, y: 0 };
        if (shape.type === 'circle') {
          // For circles, calculate center from all points
          shapeCenter = {
            x: shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length,
            y: shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length
          };
        } else {
          // For other shapes, use all points
          shapeCenter = {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
          };
        }
        
        // Vector from center to midpoint
        const dx = midX - shapeCenter.x;
        const dz = midZ - shapeCenter.y;
        const length = Math.sqrt(dx * dx + dz * dz);
        
        // Move dimension text outward by a fixed distance
        if (length > 0) {
          const pushDistance = 3; // Units to push outward
          midX += (dx / length) * pushDistance;
          midZ += (dz / length) * pushDistance;
        }
      }
      
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
  }, [shape, elevation, isSelected, isResizeMode, scaleInfo]);

  // Add area label for closed shapes
  const areaLabel = useMemo(() => {
    // Only skip area calculation for true 2-point lines, not polylines with 3+ points
    if (shape.type === 'polyline' && shape.points.length <= 2) return null;
    
    // Calculate center position of shape
    let centerX = 0, centerY = 0;
    
    if (shape.type === 'circle' && shape.points.length >= 2) {
      centerX = shape.points[0].x;
      centerY = shape.points[0].y;
    } else if (shape.points.length > 0) {
      centerX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
      centerY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;
    }
    
    // Calculate area
    let area = 0;
    if (shape.type === 'circle' && shape.points.length >= 2) {
      const radius = Math.sqrt(
        Math.pow(shape.points[1].x - shape.points[0].x, 2) + 
        Math.pow(shape.points[1].y - shape.points[0].y, 2)
      );
      area = Math.PI * radius * radius;
    } else if (shape.points.length >= 3) {
      // Use shoelace formula for polygon area
      let sum = 0;
      for (let i = 0; i < shape.points.length; i++) {
        const j = (i + 1) % shape.points.length;
        sum += shape.points[i].x * shape.points[j].y;
        sum -= shape.points[j].x * shape.points[i].y;
      }
      area = Math.abs(sum) / 2;
    } else if (shape.points.length === 2) {
      // Rectangle defined by two corner points
      const width = Math.abs(shape.points[1].x - shape.points[0].x);
      const height = Math.abs(shape.points[1].y - shape.points[0].y);
      area = width * height;
      centerX = (shape.points[0].x + shape.points[1].x) / 2;
      centerY = (shape.points[0].y + shape.points[1].y) / 2;
    }
    
    if (area < 0.1) return null; // Don't show for very small areas
    
    return (
      <Html
        key={`area-${shape.id}`}
        position={[centerX, elevation + 0.2, centerY]}
        center
        sprite
        occlude={false}
        distanceFactor={scaleInfo.distanceFactor}
      >
        <div style={{
          background: 'rgba(34, 197, 94, 0.9)',
          color: 'white',
          padding: `${scaleInfo.padding * 1.5}px ${scaleInfo.padding * 3}px`,
          borderRadius: `${Math.max(6, scaleInfo.padding * 1.2)}px`,
          fontSize: `${scaleInfo.fontSize * 1.2}px`,
          fontWeight: '700',
          whiteSpace: 'nowrap',
          boxShadow: '0 3px 12px rgba(0,0,0,0.4)',
          border: '2px solid #22c55e',
          opacity: 1
        }}>
          {area.toFixed(0)} m²
        </div>
      </Html>
    );
  }, [shape, shape.points, shape.modified, elevation, isSelected, isResizeMode, scaleInfo, renderTrigger]);

  return (
    <group>
      {dimensionLabels}
      {areaLabel}
    </group>
  );
};

export default ShapeDimensions;