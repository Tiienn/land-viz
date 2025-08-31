import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Point2D } from '@/types';

interface CoordinateDisplayProps {
  onCoordinateChange?: (worldPos: Point2D, screenPos: Point2D) => void;
}

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = () => {
  const [mousePosition] = useState<Point2D>({ x: 0, y: 0 });
  const [isMouseOver3D] = useState(false);
  
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const snapToGrid = useAppStore(state => state.drawing.snapToGrid);
  const gridSize = useAppStore(state => state.drawing.gridSize);


  // Only show coordinate display when using drawing tools
  if (activeTool === 'select' || !isMouseOver3D) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '80px', // Above the existing status overlay
      left: '16px',
      background: 'rgba(30, 30, 30, 0.95)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      minWidth: '140px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '14px' }}>📍</span>
        <span style={{ fontWeight: '600' }}>Mouse Position</span>
      </div>
      <div style={{ fontSize: '11px', opacity: 0.9 }}>
        <div>X: {mousePosition.x.toFixed(1)}m, Z: {mousePosition.y.toFixed(1)}m</div>
        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
          Grid: {snapToGrid ? `${gridSize}m snap` : 'Free move'} 
          {snapToGrid && <span style={{ color: '#22c55e', marginLeft: '4px' }}>📍</span>}
        </div>
      </div>
    </div>
  );
};

export default CoordinateDisplay;