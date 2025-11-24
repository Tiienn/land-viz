import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { ViewMode } from '@/types';
import type { FenceStyle, TerrainType } from '@/services/boundaryDetection/types';

// SVG Icons
const Cube3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Square2DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
  </svg>
);

const WalkthroughIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 9C12 9 10 9 10 11L9 16L7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9C12 9 14 9 14 11L15 16L17 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11L16 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// View mode configurations
// Note: Walkthrough mode is only accessible via "3D World" button
const VIEW_MODE_CONFIG: Record<ViewMode, {
  icon: JSX.Element;
  label: string;
  gradient: string;
  nextMode: string;
}> = {
  '2d': {
    icon: <Square2DIcon />,
    label: '2D View',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    nextMode: '3D Orbit'
  },
  '3d-orbit': {
    icon: <Cube3DIcon />,
    label: '3D Orbit',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
    nextMode: '2D View'
  },
  '3d-walkthrough': {
    // Fallback config - walkthrough is accessed via 3D World button
    icon: <WalkthroughIcon />,
    label: 'Walkthrough',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    nextMode: '2D View'
  }
};

// Generate 3D World Icon
const Generate3DIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9L12 2L21 9V20C21 21 20 22 19 22H5C4 22 3 21 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 9L12 15L21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

/**
 * Generate 3D World Button - Creates walkable boundaries from shapes and enters walkthrough mode
 * Used for testing fence rendering with drawn shapes
 */
export const Generate3DWorldButton: React.FC = () => {
  const shapes = useAppStore(state => state.shapes);
  const addWalkableBoundary = useAppStore(state => state.addWalkableBoundary);
  const clearWalkableBoundaries = useAppStore(state => state.clearWalkableBoundaries);

  const [isHovered, setIsHovered] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);
  const [terrainType, setTerrainType] = React.useState<TerrainType>('grass');
  const [fenceStyle, setFenceStyle] = React.useState<FenceStyle>('wooden');
  const [enableAITexture, setEnableAITexture] = React.useState(false);
  const [aiTexturePrompt, setAITexturePrompt] = React.useState('');

  const handleGenerate = () => {
    if (shapes.length === 0) {
      alert('Draw a shape first! Use Rectangle (R), Circle (C), or Polygon (P) tools.');
      return;
    }

    // Clear existing walkable boundaries
    clearWalkableBoundaries();

    // Convert each shape to a walkable boundary
    shapes.forEach(shape => {
      const points = shape.points.map(p => ({ x: p.x, y: p.y }));

      // Calculate area using shoelace formula
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      area = Math.abs(area) / 2;

      // Calculate perimeter
      let perimeter = 0;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        perimeter += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      }

      addWalkableBoundary({
        points,
        area,
        perimeter,
        terrainType,
        fenceStyle,
        fenceHeight: 1.5,
        enableAITexture,
        aiTexturePrompt: enableAITexture ? aiTexturePrompt : undefined,
      });
    });

    // Enter walkthrough mode
    useAppStore.setState(state => ({
      viewState: {
        ...state.viewState,
        viewMode: '3d-walkthrough',
        is2DMode: false,
      }
    }));

    setShowOptions(false);
  };

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '160px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
    background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
    boxShadow: isHovered
      ? '0 8px 25px rgba(0, 196, 204, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 4px 15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    fontFamily: 'Nunito Sans, sans-serif',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    userSelect: 'none'
  };

  const optionsStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '75px',
    right: '160px',
    padding: '16px',
    borderRadius: '12px',
    background: 'white',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
    zIndex: 1001,
    display: showOptions ? 'block' : 'none',
    minWidth: '200px',
  };

  return (
    <>
      <button
        onClick={() => setShowOptions(!showOptions)}
        style={buttonStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Generate 3D World from shapes (G)"
        aria-label="Generate 3D World with fences from drawn shapes"
      >
        <Generate3DIcon />
        <span>3D World</span>
      </button>

      {/* Options Panel */}
      <div style={optionsStyle}>
        <div style={{ marginBottom: '12px', fontWeight: 600, color: '#333' }}>
          Generate 3D World
        </div>

        {/* Terrain Type */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Terrain
          </label>
          <select
            value={terrainType}
            onChange={(e) => setTerrainType(e.target.value as TerrainType)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '13px',
            }}
          >
            <option value="grass">🌿 Grass</option>
            <option value="concrete">🏗️ Concrete</option>
            <option value="dirt">🟤 Dirt</option>
            <option value="gravel">⚫ Gravel</option>
            <option value="sand">🏖️ Sand</option>
          </select>
        </div>

        {/* Fence Style */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Fence Style
          </label>
          <select
            value={fenceStyle}
            onChange={(e) => setFenceStyle(e.target.value as FenceStyle)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '13px',
            }}
          >
            <option value="wooden">🪵 Wooden Fence</option>
            <option value="metal">🔩 Metal Fence</option>
            <option value="stone">🧱 Stone Wall</option>
            <option value="hedge">🌳 Hedge</option>
            <option value="none">❌ No Fence</option>
          </select>
        </div>

        {/* AI Texture Toggle */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#333',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={enableAITexture}
              onChange={(e) => setEnableAITexture(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>✨ AI Texture</span>
            <span style={{ fontSize: '10px', color: '#999', marginLeft: 'auto' }}>Beta</span>
          </label>
        </div>

        {/* AI Texture Prompt (shown when enabled) */}
        {enableAITexture && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Describe your terrain
            </label>
            <textarea
              value={aiTexturePrompt}
              onChange={(e) => setAITexturePrompt(e.target.value)}
              placeholder="e.g., lush green grass with wildflowers..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '13px',
                minHeight: '60px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
              Demo mode - uses preset textures
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🚶 Generate & Walk Through
        </button>

        <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
          {shapes.length} shape{shapes.length !== 1 ? 's' : ''} will become walkable areas
        </div>
      </div>
    </>
  );
};

export const View2DToggleButton: React.FC = () => {
  const viewMode = useAppStore(state => state.viewState?.viewMode || '3d-orbit');
  const toggleViewMode = useAppStore(state => state.toggleViewMode);

  const [isHovered, setIsHovered] = React.useState(false);

  const config = VIEW_MODE_CONFIG[viewMode];

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
    background: config.gradient,
    boxShadow: isHovered
      ? '0 8px 25px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 4px 15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    fontFamily: 'Nunito Sans, sans-serif',
    minWidth: '130px',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    userSelect: 'none'
  };

  return (
    <button
      onClick={toggleViewMode}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Switch to ${config.nextMode} (V)`}
      aria-label={`Current: ${config.label}. Click to switch to ${config.nextMode}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </button>
  );
};

export default View2DToggleButton;
