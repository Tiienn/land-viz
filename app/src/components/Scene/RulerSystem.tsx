/**
 * Professional Ruler System for Land Visualizer
 * Provides CAD-style rulers with click-to-create guides
 */

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { logger } from '../../utils/logger';
import type { Point2D } from '../../types';

interface RulerSystemProps {
  visible?: boolean;
  showMarkers?: boolean;
  unit?: 'px' | 'm' | 'ft';
  precision?: number;
}

interface GuideClick {
  position: number;
  type: 'horizontal' | 'vertical';
  timestamp: number;
}

export const RulerSystem: React.FC<RulerSystemProps> = ({
  visible = true,
  showMarkers = true,
  unit = 'm',
  precision = 1
}) => {
  const { camera, size, gl } = useThree();
  const [cursorPosition, setCursorPosition] = useState<Point2D>({ x: 0, y: 0 });
  const [staticGuides, setStaticGuides] = useState<GuideClick[]>([]);
  const rulerRef = useRef<HTMLDivElement>(null);

  const gridConfig = useAppStore(state => state.drawing.grid);
  const updateDrawingState = useAppStore(state => state.updateDrawingState);

  // Convert world units to display units
  const convertUnit = useCallback((value: number): { value: number; label: string } => {
    switch (unit) {
      case 'ft':
        return { value: value * 3.28084, label: 'ft' };
      case 'px':
        return { value: value * 10, label: 'px' }; // Assuming 1m = 10px scale
      case 'm':
      default:
        return { value: value, label: 'm' };
    }
  }, [unit]);

  // Get viewport bounds in world coordinates
  const viewportBounds = useMemo(() => {
    if (!camera) return { left: -50, right: 50, top: 50, bottom: -50 };

    // Calculate world space bounds based on camera position and size
    const distance = camera.position.y || 10;
    const aspect = size.width / size.height;
    const fov = (camera as any).fov ? (camera as any).fov * Math.PI / 180 : 0.75;
    
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * aspect;
    
    return {
      left: camera.position.x - width / 2,
      right: camera.position.x + width / 2,
      top: camera.position.z + height / 2,
      bottom: camera.position.z - height / 2,
    };
  }, [camera, size]);

  // Generate ruler tick marks
  const generateTicks = useCallback((start: number, end: number, isVertical: boolean) => {
    const ticks: Array<{ position: number; isMajor: boolean; label?: string }> = [];
    const range = Math.abs(end - start);
    
    // Determine tick spacing based on zoom level
    let majorSpacing = 10;
    let minorSpacing = 2;
    
    if (range < 20) {
      majorSpacing = 2;
      minorSpacing = 0.5;
    } else if (range < 100) {
      majorSpacing = 5;
      minorSpacing = 1;
    } else if (range > 500) {
      majorSpacing = 50;
      minorSpacing = 10;
    }

    // Generate major ticks
    const majorStart = Math.ceil(start / majorSpacing) * majorSpacing;
    for (let pos = majorStart; pos <= end; pos += majorSpacing) {
      const converted = convertUnit(pos);
      ticks.push({
        position: pos,
        isMajor: true,
        label: converted.value.toFixed(precision)
      });
    }

    // Generate minor ticks
    const minorStart = Math.ceil(start / minorSpacing) * minorSpacing;
    for (let pos = minorStart; pos <= end; pos += minorSpacing) {
      if (ticks.find(t => Math.abs(t.position - pos) < 0.01)) continue;
      ticks.push({
        position: pos,
        isMajor: false
      });
    }

    return ticks;
  }, [convertUnit, precision]);

  // Handle mouse movement for cursor tracking
  useEffect(() => {
    if (!visible) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Convert to world coordinates (simplified)
      const worldX = (x * (viewportBounds.right - viewportBounds.left)) / 2 + 
                   (viewportBounds.right + viewportBounds.left) / 2;
      const worldY = (y * (viewportBounds.top - viewportBounds.bottom)) / 2 + 
                   (viewportBounds.top + viewportBounds.bottom) / 2;
      
      setCursorPosition({ x: worldX, y: worldY });
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove);
  }, [visible, gl.domElement, viewportBounds]);

  // Handle ruler clicks to create guides
  const handleRulerClick = useCallback((position: number, type: 'horizontal' | 'vertical') => {
    const newGuide: GuideClick = {
      position,
      type,
      timestamp: Date.now()
    };
    
    setStaticGuides(prev => [...prev, newGuide]);
    
    // TODO: Integrate with main guide system
    logger.log(`Created ${type} guide at ${position}`);
  }, []);

  // Generate horizontal ruler ticks
  const horizontalTicks = useMemo(() => 
    generateTicks(viewportBounds.left, viewportBounds.right, false),
    [generateTicks, viewportBounds.left, viewportBounds.right]
  );

  // Generate vertical ruler ticks  
  const verticalTicks = useMemo(() =>
    generateTicks(viewportBounds.bottom, viewportBounds.top, true),
    [generateTicks, viewportBounds.bottom, viewportBounds.top]
  );

  // Ruler styles
  const rulerContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 100,
  };

  const horizontalRulerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '30px',
    right: 0,
    height: '30px',
    background: 'rgba(248, 250, 252, 0.95)',
    borderBottom: '1px solid #E2E8F0',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
    pointerEvents: 'auto',
  };

  const verticalRulerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '30px',
    left: 0,
    bottom: 0,
    width: '30px',
    background: 'rgba(248, 250, 252, 0.95)',
    borderRight: '1px solid #E2E8F0',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    overflow: 'hidden',
    pointerEvents: 'auto',
  };

  const cornerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30px',
    height: '30px',
    background: 'rgba(248, 250, 252, 0.95)',
    borderRight: '1px solid #E2E8F0',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#64748B',
    fontWeight: '500',
    backdropFilter: 'blur(4px)',
  };

  const cursorMarkerStyle: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 101,
  };

  if (!visible) return null;

  return (
    <Html
      prepend
      center={false}
      style={rulerContainerStyle}
      transform={false}
      occlude={false}
    >
      <div ref={rulerRef} style={{ width: '100%', height: '100%' }}>
        {/* Corner Logo/Unit */}
        <div style={cornerStyle}>
          {convertUnit(1).label}
        </div>

        {/* Horizontal Ruler */}
        <div style={horizontalRulerStyle}>
          {horizontalTicks.map((tick, index) => {
            const leftPercent = 
              ((tick.position - viewportBounds.left) / 
               (viewportBounds.right - viewportBounds.left)) * 100;
            
            return (
              <div
                key={`h-${index}`}
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  height: tick.isMajor ? '15px' : '8px',
                  width: '1px',
                  background: tick.isMajor ? '#475569' : '#94A3B8',
                  bottom: 0,
                  cursor: 'pointer',
                }}
                onClick={() => handleRulerClick(tick.position, 'vertical')}
                title={tick.isMajor ? `Create vertical guide at ${tick.label}${convertUnit(1).label}` : ''}
              >
                {tick.isMajor && tick.label && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '2px',
                      fontSize: '9px',
                      color: '#475569',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {tick.label}
                  </span>
                )}
              </div>
            );
          })}
          
          {/* Horizontal Cursor Marker */}
          {showMarkers && (
            <div
              style={{
                ...cursorMarkerStyle,
                left: `${((cursorPosition.x - viewportBounds.left) / 
                         (viewportBounds.right - viewportBounds.left)) * 100}%`,
                top: '-2px',
                width: '1px',
                height: '34px',
                background: '#EF4444',
                boxShadow: '0 0 3px rgba(239, 68, 68, 0.5)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  left: '-15px',
                  width: '30px',
                  height: '12px',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '2px',
                  fontWeight: '500',
                }}
              >
                {convertUnit(cursorPosition.x).value.toFixed(precision)}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Ruler */}
        <div style={verticalRulerStyle}>
          {verticalTicks.map((tick, index) => {
            const topPercent = 
              ((viewportBounds.top - tick.position) / 
               (viewportBounds.top - viewportBounds.bottom)) * 100;
            
            return (
              <div
                key={`v-${index}`}
                style={{
                  position: 'absolute',
                  top: `${topPercent}%`,
                  width: tick.isMajor ? '15px' : '8px',
                  height: '1px',
                  background: tick.isMajor ? '#475569' : '#94A3B8',
                  right: 0,
                  cursor: 'pointer',
                }}
                onClick={() => handleRulerClick(tick.position, 'horizontal')}
                title={tick.isMajor ? `Create horizontal guide at ${tick.label}${convertUnit(1).label}` : ''}
              >
                {tick.isMajor && tick.label && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '-4px',
                      fontSize: '9px',
                      color: '#475569',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center',
                    }}
                  >
                    {tick.label}
                  </span>
                )}
              </div>
            );
          })}
          
          {/* Vertical Cursor Marker */}
          {showMarkers && (
            <div
              style={{
                ...cursorMarkerStyle,
                top: `${((viewportBounds.top - cursorPosition.y) / 
                        (viewportBounds.top - viewportBounds.bottom)) * 100}%`,
                left: '-2px',
                width: '34px',
                height: '1px',
                background: '#EF4444',
                boxShadow: '0 0 3px rgba(239, 68, 68, 0.5)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '32px',
                  top: '-6px',
                  width: '30px',
                  height: '12px',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '2px',
                  fontWeight: '500',
                }}
              >
                {convertUnit(cursorPosition.y).value.toFixed(precision)}
              </div>
            </div>
          )}
        </div>

        {/* Static Guides */}
        {staticGuides.map((guide, index) => (
          <div
            key={`guide-${index}`}
            style={{
              position: 'absolute',
              background: 'rgba(139, 92, 246, 0.8)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              ...(guide.type === 'horizontal'
                ? {
                    top: `${((viewportBounds.top - guide.position) / 
                            (viewportBounds.top - viewportBounds.bottom)) * 100}%`,
                    left: '30px',
                    right: 0,
                    height: '1px',
                  }
                : {
                    left: `${((guide.position - viewportBounds.left) / 
                             (viewportBounds.right - viewportBounds.left)) * 100}%`,
                    top: '30px',
                    bottom: 0,
                    width: '1px',
                  }),
            }}
            onClick={() => {
              setStaticGuides(prev => prev.filter((_, i) => i !== index));
            }}
            title={`Click to remove ${guide.type} guide`}
          />
        ))}
      </div>
    </Html>
  );
};

export default RulerSystem;