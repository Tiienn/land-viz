/**
 * Professional Alignment Controls Panel
 * Provides Canva/CAD-style controls for alignment guides and snapping
 */

import React, { useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';

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
  )
};

interface AlignmentControlsProps {
  className?: string;
  compact?: boolean;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Store state
  const alignmentConfig = useAppStore(state => state.drawing.alignment?.config);
  const snapConfig = useAppStore(state => state.drawing.snap?.config);
  const gridConfig = useAppStore(state => state.drawing.grid);
  const updateDrawingState = useAppStore(state => state.updateDrawingState);

  // Toggle functions
  const toggleAlignment = useCallback(() => {
    if (!alignmentConfig) return;
    updateDrawingState({
      alignment: {
        config: { ...alignmentConfig, enabled: !alignmentConfig.enabled },
        activeGuides: [],
        draggingShapeId: null
      }
    });
  }, [alignmentConfig, updateDrawingState]);

  const toggleGrid = useCallback(() => {
    updateDrawingState({
      grid: { ...gridConfig, enabled: !gridConfig.enabled }
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
      alignment: {
        config: { ...alignmentConfig, [key]: value },
        activeGuides: [],
        draggingShapeId: null
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

  // Styles following Land Visualizer's inline pattern
  const containerStyle: React.CSSProperties = {
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

  const headerStyle: React.CSSProperties = {
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
    fontWeight: '600',
    fontSize: '14px',
    margin: 0,
  };

  const toggleButtonStyle: React.CSSProperties = {
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

  if (compact && !isExpanded) {
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
        <h3 style={titleStyle}>🎯 Alignment & Guides</h3>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            style={toggleButtonStyle}
            title="Collapse"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Controls */}
      <div style={sectionStyle}>
        {/* Master Toggle */}
        <div style={controlRowStyle}>
          <label style={labelStyle}>
            <Icons.Target />
            Enable Snapping
          </label>
          <button
            onClick={toggleAlignment}
            style={switchStyle(alignmentConfig?.enabled || false)}
            title="Toggle alignment guides"
          >
            <div style={switchKnobStyle(alignmentConfig?.enabled || false)} />
          </button>
        </div>

        {/* Grid Toggle */}
        <div style={controlRowStyle}>
          <label style={labelStyle}>
            <Icons.Grid />
            Show Grid
          </label>
          <button
            onClick={toggleGrid}
            style={switchStyle(gridConfig?.enabled || false)}
            title="Toggle grid visibility"
          >
            <div style={switchKnobStyle(gridConfig?.enabled || false)} />
          </button>
        </div>

        {/* Snap Threshold */}
        {alignmentConfig?.enabled && (
          <div style={{ ...controlRowStyle, marginBottom: '16px' }}>
            <label style={labelStyle}>
              Threshold: {alignmentConfig.alignmentThreshold}px
            </label>
            <input
              type="range"
              min="3"
              max="15"
              value={alignmentConfig.alignmentThreshold}
              onChange={(e) => updateAlignmentSetting('alignmentThreshold', parseInt(e.target.value))}
              style={sliderStyle}
            />
          </div>
        )}

        {/* Snap Strength */}
        {alignmentConfig?.enabled && (
          <div style={controlRowStyle}>
            <label style={labelStyle}>
              Strength: {Math.round((alignmentConfig.snapStrength || 0.8) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={alignmentConfig.snapStrength}
              onChange={(e) => updateAlignmentSetting('snapStrength', parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </div>
        )}
      </div>

      {/* Alignment Types */}
      {alignmentConfig?.enabled && (
        <div style={sectionStyle}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Alignment Types
            </span>
          </div>

          <div style={groupStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={alignmentConfig.showCenterGuides}
                onChange={(e) => updateAlignmentSetting('showCenterGuides', e.target.checked)}
                style={checkboxStyle(alignmentConfig.showCenterGuides)}
              />
              <Icons.Center />
              Centers
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={alignmentConfig.showEdgeGuides}
                onChange={(e) => updateAlignmentSetting('showEdgeGuides', e.target.checked)}
                style={checkboxStyle(alignmentConfig.showEdgeGuides)}
              />
              <Icons.Edge />
              Edges
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={alignmentConfig.showSpacingGuides}
                onChange={(e) => updateAlignmentSetting('showSpacingGuides', e.target.checked)}
                style={checkboxStyle(alignmentConfig.showSpacingGuides)}
              />
              <Icons.Spacing />
              Spacing
            </label>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      <div style={sectionStyle}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6B7280',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 0',
          }}
        >
          <Icons.Settings />
          Advanced Settings
          <span style={{ 
            transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease' 
          }}>
            ▼
          </span>
        </button>

        {showAdvanced && alignmentConfig?.enabled && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
            <div style={controlRowStyle}>
              <label style={labelStyle}>
                Max Guides: {alignmentConfig.maxGuides}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={alignmentConfig.maxGuides}
                onChange={(e) => updateAlignmentSetting('maxGuides', parseInt(e.target.value))}
                style={sliderStyle}
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Hints */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(0, 196, 204, 0.05)',
        borderTop: '1px solid rgba(0, 196, 204, 0.1)',
        borderRadius: '0 0 11px 11px',
      }}>
        <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>S</kbd> Toggle Snapping</div>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>G</kbd> Toggle Grid</div>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>Shift</kbd> Disable Temporarily</div>
          <div><kbd style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '2px', fontSize: '10px' }}>Alt</kbd> Show All Points</div>
        </div>
      </div>
    </div>
  );
};

export default AlignmentControls;