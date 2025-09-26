/**
 * Professional Alignment Controls Panel
 * Provides Canva/CAD-style controls for alignment guides and snapping
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AlignmentService } from '../../services/alignmentService';
// import { TidyUpService, type TidyUpOptions } from '../../services/tidyUpService';

// Icon components (simplified inline SVGs for now)
const Icons = {
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
  ),
  Ruler: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M3 3h18v18H3zM9 3v6m6-6v6M3 9h6m-6 6h6m6 0h6m-6-6h6"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 8v6m11-5-6-3-6 3 6 3 6-3z"/>
    </svg>
  ),
  Center: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <line x1="12" y1="1" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="23"/>
      <line x1="1" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="23" y2="12"/>
    </svg>
  ),
  Edge: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="3" x2="21" y2="3" strokeWidth="3"/>
    </svg>
  ),
  Spacing: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="2" y="6" width="4" height="12"/>
      <rect x="10" y="6" width="4" height="12"/>
      <rect x="18" y="6" width="4" height="12"/>
      <path d="M6 12h4m4 0h4" strokeDasharray="2 2"/>
    </svg>
  ),
  Clear: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  TidyUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M8 12h8m-8-4h8m-8 8h8"/>
      <circle cx="6" cy="8" r="1"/>
      <circle cx="6" cy="12" r="1"/>
      <circle cx="6" cy="16" r="1"/>
    </svg>
  ),
  DistributeHorizontal: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="4" y="6" width="3" height="12"/>
      <rect x="10.5" y="6" width="3" height="12"/>
      <rect x="17" y="6" width="3" height="12"/>
      <path d="M2 3v18M22 3v18"/>
    </svg>
  ),
  DistributeVertical: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="6" y="4" width="12" height="3"/>
      <rect x="6" y="10.5" width="12" height="3"/>
      <rect x="6" y="17" width="12" height="3"/>
      <path d="M3 2h18M3 22h18"/>
    </svg>
  )
};

interface AlignmentControlsProps {
  className?: string;
  compact?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  inline?: boolean;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  className = '',
  compact = false,
  expanded = false,
  onToggle,
  inline = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Store state
  const alignmentConfig = useAppStore(state => state.drawing?.guides?.config?.alignmentGuides);
  const snapConfig = useAppStore(state => state.drawing?.snap?.config);
  const gridConfig = useAppStore(state => state.drawing?.grid?.config);
  const updateDrawingState = useAppStore(state => state.updateDrawingState);
  const shapes = useAppStore(state => state.shapes || []);
  const updateShape = useAppStore(state => state.updateShape);

  // Get selected shape IDs from store and memoize selected shapes to avoid infinite re-renders
  const selectedShapeIds = useAppStore(state => state.selectedShapeIds || []);
  const selectedShapes = useMemo(() =>
    shapes.filter(shape => selectedShapeIds.includes(shape.id)),
    [shapes, selectedShapeIds]
  );

  // TidyUp service (temporarily disabled to prevent infinite loops)
  // const [tidyUpService] = useState(() => new TidyUpService());
  const [alignmentService] = useState(() => new AlignmentService());
  const [tidyUpInProgress, setTidyUpInProgress] = useState(false);
  const [originalShapePositions, setOriginalShapePositions] = useState<Map<string, { bounds: any, points: any[] }>>(new Map());

  // Helper function to capture original positions - simplified approach
  const getOrCaptureOriginalPositions = useCallback((shapes: typeof selectedShapes) => {
    // Build result positions
    const resultPositions = new Map();
    let needsUpdate = false;

    shapes.forEach(shape => {
      if (!originalShapePositions.has(shape.id)) {
        // Capture new original position
        const originalData = {
          bounds: alignmentService.calculateShapeBounds(shape),
          points: JSON.parse(JSON.stringify(shape.points)) // Deep copy
        };
        resultPositions.set(shape.id, originalData);
        needsUpdate = true;
      } else {
        // Use existing original position
        resultPositions.set(shape.id, originalShapePositions.get(shape.id));
      }
    });

    // Update state if needed
    if (needsUpdate) {
      setOriginalShapePositions(prev => {
        const updated = new Map(prev);
        resultPositions.forEach((value, key) => {
          if (!prev.has(key)) {
            updated.set(key, value);
          }
        });
        return updated;
      });
    }

    return resultPositions;
  }, [alignmentService, originalShapePositions]);

  // Clear original positions when selection changes
  useEffect(() => {
    const currentShapeIds = selectedShapes.map(s => s.id);
    const storedShapeIds = Array.from(originalShapePositions.keys());

    // If selection has changed, clear stored positions
    const selectionChanged = currentShapeIds.length !== storedShapeIds.length ||
      !currentShapeIds.every(id => storedShapeIds.includes(id));

    if (selectionChanged) {
      setOriginalShapePositions(new Map());
    }
  }, [selectedShapes]);

  // Toggle functions
  const toggleAlignment = useCallback(() => {
    if (!alignmentConfig) return;
    updateDrawingState({
      guides: {
        config: {
          alignmentGuides: { ...alignmentConfig, enabled: !alignmentConfig.enabled }
        }
      }
    });
  }, [alignmentConfig, updateDrawingState]);

  const toggleGrid = useCallback(() => {
    updateDrawingState({
      grid: {
        config: { ...gridConfig, enabled: !gridConfig?.enabled }
      }
    });
  }, [gridConfig, updateDrawingState]);

  const toggleSnapping = useCallback(() => {
    if (!snapConfig) return;
    updateDrawingState({
      snap: {
        ...useAppStore.getState().drawing.snap,
        config: { ...snapConfig, enabled: !snapConfig.enabled }
      }
    });
  }, [snapConfig, updateDrawingState]);

  const updateAlignmentSetting = useCallback((key: string, value: any) => {
    if (!alignmentConfig) return;
    updateDrawingState({
      guides: {
        config: {
          alignmentGuides: { ...alignmentConfig, [key]: value }
        }
      }
    });
  }, [alignmentConfig, updateDrawingState]);

  const updateSnapSetting = useCallback((key: string, value: any) => {
    if (!snapConfig) return;
    updateDrawingState({
      snap: {
        ...useAppStore.getState().drawing.snap,
        config: { ...snapConfig, [key]: value }
      }
    });
  }, [snapConfig, updateDrawingState]);

  // TidyUp functions (simplified to prevent infinite loops)
  const handleTidyUp = useCallback(async () => {
    if (selectedShapes.length < 3) {
      console.warn('TidyUp requires at least 3 selected shapes');
      return;
    }

    setTidyUpInProgress(true);
    try {
      // Capture original positions on first run
      const originalPositions = getOrCaptureOriginalPositions(selectedShapes);

      // Use original bounds for stable distribution
      const shapesWithOriginalBounds = selectedShapes.map(shape => {
        const original = originalPositions.get(shape.id);
        return {
          shape,
          originalBounds: original.bounds
        };
      });

      const sortedShapes = shapesWithOriginalBounds.slice().sort((a, b) => a.originalBounds.centerX - b.originalBounds.centerX);

      if (sortedShapes.length >= 3) {
        // Find the overall bounding box using ORIGINAL positions
        const allOriginalCentersX = shapesWithOriginalBounds.map(sb => sb.originalBounds.centerX);
        const leftMost = Math.min(...allOriginalCentersX);
        const rightMost = Math.max(...allOriginalCentersX);
        const totalWidth = rightMost - leftMost;

        // If shapes are already perfectly aligned, use a minimum spacing
        const minSpacing = 50; // Minimum 50 units between centers
        const calculatedSpacing = sortedShapes.length > 1 ? totalWidth / (sortedShapes.length - 1) : 0;
        const spacing = Math.max(calculatedSpacing, minSpacing);

        sortedShapes.forEach(({ shape, originalBounds }, index) => {
          const newCenterX = leftMost + (spacing * index);
          const originalShape = originalPositions.get(shape.id);

          // Calculate offset from original center to new center
          const offsetX = newCenterX - originalBounds.centerX;

          // Apply offset to original points
          const updatedPoints = originalShape.points.map(point => ({
            ...point,
            x: point.x + offsetX
          }));

          updateShape(shape.id, { points: updatedPoints });
        });

        console.log(`TidyUp completed: distributed ${sortedShapes.length} shapes`);
        console.log('Original positions used:', originalPositions.size);
        console.log('updateShape function:', updateShape);
        console.log('Current selectedShapes:', selectedShapes.map(s => ({ id: s.id, points: s.points })));

        // Add a small delay to check if shapes update in the store
        setTimeout(() => {
          const currentShapes = useAppStore.getState().shapes;
          console.log('Shapes in store after TidyUp:', currentShapes.filter(s => selectedShapes.some(sel => sel.id === s.id)).map(s => ({ id: s.id, points: s.points })));

          // Force a re-render by updating the selected shapes
          console.log('Forcing re-render...');
        }, 100);

        console.log('Shape movements:', sortedShapes.map(({ shape, originalBounds }, index) => {
          const newCenterX = leftMost + (spacing * index);
          const offsetX = newCenterX - originalBounds.centerX;
          const originalShape = originalPositions.get(shape.id);
          return {
            shapeId: shape.id,
            originalCenter: { x: originalBounds.centerX, y: originalBounds.centerY },
            newCenter: { x: newCenterX, y: originalBounds.centerY },
            offsetX,
            originalPoints: originalShape.points,
            hasOriginalData: !!originalShape
          };
        }));
      }
    } catch (error) {
      console.error('TidyUp failed:', error);
    } finally {
      setTidyUpInProgress(false);
    }
  }, [selectedShapes, updateShape]);

  const handleSpaceEvenly = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedShapes.length < 3) return;

    setTidyUpInProgress(true);
    try {
      // Capture original positions on first run
      const originalPositions = getOrCaptureOriginalPositions(selectedShapes);

      if (direction === 'horizontal') {
        // Horizontal distribution using original center points
        const shapesWithOriginalBounds = selectedShapes.map(shape => {
          const original = originalPositions.get(shape.id);
          return {
            shape,
            originalBounds: original.bounds
          };
        });

        const sortedShapes = shapesWithOriginalBounds.slice().sort((a, b) => a.originalBounds.centerX - b.originalBounds.centerX);

        // Find the overall bounding box using ORIGINAL positions
        const allOriginalCentersX = shapesWithOriginalBounds.map(sb => sb.originalBounds.centerX);
        const leftMost = Math.min(...allOriginalCentersX);
        const rightMost = Math.max(...allOriginalCentersX);
        const totalWidth = rightMost - leftMost;

        // If shapes are already perfectly aligned, use a minimum spacing
        const minSpacing = 50; // Minimum 50 units between centers
        const calculatedSpacing = sortedShapes.length > 1 ? totalWidth / (sortedShapes.length - 1) : 0;
        const spacing = Math.max(calculatedSpacing, minSpacing);

        sortedShapes.forEach(({ shape, originalBounds }, index) => {
          const newCenterX = leftMost + (spacing * index);
          const originalShape = originalPositions.get(shape.id);

          // Calculate offset from original center to new center
          const offsetX = newCenterX - originalBounds.centerX;

          // Apply offset to original points
          const updatedPoints = originalShape.points.map(point => ({
            ...point,
            x: point.x + offsetX
          }));

          updateShape(shape.id, { points: updatedPoints });
        });
      } else {
        // Vertical distribution using original center points
        const shapesWithOriginalBounds = selectedShapes.map(shape => {
          const original = originalPositions.get(shape.id);
          return {
            shape,
            originalBounds: original.bounds
          };
        });

        const sortedShapes = shapesWithOriginalBounds.slice().sort((a, b) => a.originalBounds.centerY - b.originalBounds.centerY);

        // Find the overall bounding box using ORIGINAL positions
        const allOriginalCentersY = shapesWithOriginalBounds.map(sb => sb.originalBounds.centerY);
        const topMost = Math.min(...allOriginalCentersY);
        const bottomMost = Math.max(...allOriginalCentersY);
        const totalHeight = bottomMost - topMost;

        // If shapes are already perfectly aligned, use a minimum spacing
        const minSpacing = 50; // Minimum 50 units between centers
        const calculatedSpacing = sortedShapes.length > 1 ? totalHeight / (sortedShapes.length - 1) : 0;
        const spacing = Math.max(calculatedSpacing, minSpacing);

        sortedShapes.forEach(({ shape, originalBounds }, index) => {
          const newCenterY = topMost + (spacing * index);
          const originalShape = originalPositions.get(shape.id);

          // Calculate offset from original center to new center
          const offsetY = newCenterY - originalBounds.centerY;

          // Apply offset to original points
          const updatedPoints = originalShape.points.map(point => ({
            ...point,
            y: point.y + offsetY
          }));

          updateShape(shape.id, { points: updatedPoints });
        });
      }

      console.log(`Space evenly completed: ${direction} distribution`);
    } catch (error) {
      console.error('Space evenly failed:', error);
    } finally {
      setTidyUpInProgress(false);
    }
  }, [selectedShapes, updateShape]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if no input/textarea is focused and at least 3 shapes are selected
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        selectedShapes.length < 3 ||
        tidyUpInProgress
      ) {
        return;
      }

      if (event.key.toLowerCase() === 't' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handleTidyUp();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedShapes.length, tidyUpInProgress, handleTidyUp]);

  // Styles following Land Visualizer's inline pattern
  const containerStyle: React.CSSProperties = inline ? {
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
    color: '#1f2937',
  } : {
    position: 'absolute',
    top: '80px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    zIndex: 1000,
    minWidth: compact ? '60px' : '280px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const headerStyle: React.CSSProperties = inline ? {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontWeight: '600',
    fontSize: '16px',
  } : {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
    color: 'white',
    borderRadius: '11px 11px 0 0',
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: '700',
    fontSize: '16px',
    margin: 0,
  };

  const toggleButtonStyle: React.CSSProperties = inline ? {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '24px',
    transition: 'all 200ms ease',
    lineHeight: 1,
    fontWeight: 300
  } : {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    padding: '4px',
    transition: 'all 0.2s ease',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  };

  const controlRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const switchStyle = (enabled: boolean): React.CSSProperties => ({
    position: 'relative',
    width: '44px',
    height: '24px',
    background: enabled ? '#00C4CC' : '#D1D5DB',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  });

  const switchKnobStyle = (enabled: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '2px',
    left: enabled ? '22px' : '2px',
    width: '20px',
    height: '20px',
    background: 'white',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  });

  const sliderStyle: React.CSSProperties = {
    width: '80px',
    height: '4px',
    background: '#E5E7EB',
    borderRadius: '2px',
    appearance: 'none',
    outline: 'none',
    cursor: 'pointer',
  };

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '8px',
  };

  const checkboxStyle = (checked: boolean): React.CSSProperties => ({
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '2px solid',
    borderColor: checked ? '#00C4CC' : '#D1D5DB',
    background: checked ? '#00C4CC' : 'transparent',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  });

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    userSelect: 'none',
  };

  // Skip compact mode when inline
  if (compact && !isExpanded && !inline) {
    return (
      <div style={containerStyle} className={className}>
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            ...toggleButtonStyle,
            background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
            color: 'white',
            width: '40px',
            height: '40px',
            margin: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Open Alignment Controls"
        >
          <Icons.Target />
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {/* Header */}
      <div style={headerStyle}>
        {inline ? (
          <>
            <h3 style={titleStyle}>TidyUp</h3>
            {onToggle && (
              <button
                onClick={onToggle}
                style={toggleButtonStyle}
                title="Close"
              >
                ◀
              </button>
            )}
          </>
        ) : (
          <>
            <h3 style={titleStyle}>TidyUp</h3>
            {compact && onToggle && (
              <button
                onClick={onToggle}
                style={toggleButtonStyle}
                title="Collapse"
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>

      {/* Content wrapper for inline mode */}
      <div style={inline ? {
        overflow: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      } : {}}>

      {/* Canva-Style TidyUp Section */}
      <div style={sectionStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Smart Distribution
          </span>
          {selectedShapes.length >= 3 && (
            <span style={{
              fontSize: '11px',
              background: 'rgba(0, 196, 204, 0.1)',
              color: '#0891B2',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              {selectedShapes.length} selected
            </span>
          )}
        </div>

        {/* One-Click TidyUp (Canva's signature feature) */}
        <button
          onClick={() => handleTidyUp()}
          disabled={selectedShapes.length < 3 || tidyUpInProgress}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '12px',
            background: selectedShapes.length >= 3
              ? 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)'
              : '#F3F4F6',
            color: selectedShapes.length >= 3 ? 'white' : '#9CA3AF',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedShapes.length >= 3 ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            opacity: tidyUpInProgress ? 0.6 : 1
          }}
          title={
            selectedShapes.length < 3
              ? 'Select 3+ shapes to use TidyUp'
              : 'Auto-distribute and align selected shapes'
          }
        >
          {tidyUpInProgress ? 'Tidying Up...' : 'Tidy Up'}
        </button>

        {/* Space Evenly Controls */}
        {selectedShapes.length >= 3 && (
          <div>
            <div style={{
              fontSize: '12px',
              color: '#6B7280',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Distribute Direction:
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <button
                onClick={() => handleSpaceEvenly('horizontal')}
                disabled={tidyUpInProgress}
                style={{
                  padding: '8px 12px',
                  background: tidyUpInProgress ? '#F3F4F6' : 'rgba(0, 196, 204, 0.1)',
                  color: tidyUpInProgress ? '#9CA3AF' : '#0891B2',
                  border: '1px solid rgba(0, 196, 204, 0.2)',
                  borderRadius: '6px',
                  cursor: tidyUpInProgress ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
                title="Space evenly horizontally"
              >
                Horizontal
              </button>

              <button
                onClick={() => handleSpaceEvenly('vertical')}
                disabled={tidyUpInProgress}
                style={{
                  padding: '8px 12px',
                  background: tidyUpInProgress ? '#F3F4F6' : 'rgba(124, 58, 237, 0.1)',
                  color: tidyUpInProgress ? '#9CA3AF' : '#7C3AED',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '6px',
                  cursor: tidyUpInProgress ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
                title="Space evenly vertically"
              >
                Vertical
              </button>
            </div>

            <div style={{
              fontSize: '11px',
              color: '#6B7280',
              padding: '8px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '4px',
              lineHeight: '1.4'
            }}>
              💡 <strong>Tip:</strong> Select shapes and click "Tidy Up" for automatic smart distribution, or choose a specific direction.
            </div>
          </div>
        )}

        {selectedShapes.length < 3 && (
          <div style={{
            fontSize: '11px',
            color: '#9CA3AF',
            textAlign: 'center',
            padding: '12px',
            background: '#F9FAFB',
            borderRadius: '6px',
            border: '1px dashed rgba(156, 163, 175, 0.4)'
          }}>
            Select 3 or more shapes to enable smart distribution
          </div>
        )}
      </div>

      </div>

      {/* Keyboard Hints */}
      <div style={inline ? {
        padding: '12px 20px',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        marginTop: 'auto',
      } : {
        padding: '12px 20px',
        background: 'rgba(0, 196, 204, 0.05)',
        borderTop: '1px solid rgba(0, 196, 204, 0.1)',
        borderRadius: '0 0 11px 11px',
      }}>
        <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>S</kbd> Toggle Snapping</div>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>G</kbd> Toggle Grid</div>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>T</kbd> TidyUp (3+ shapes)</div>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>Shift</kbd> Disable Temporarily</div>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>Alt</kbd> Show All Points</div>
        </div>
      </div>
    </div>
  );
};

export default AlignmentControls;