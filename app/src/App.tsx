import React, { useState, useEffect } from 'react';
import SceneManager from './components/Scene/SceneManager';
import { useAppStore } from './store/useAppStore';
import type { Point3D, Point2D } from './types';

function App(): React.JSX.Element {
  // Local UI state for performance (reduces re-renders)
  const [activeTool, setActiveTool] = useState('select');
  
  // Connect to the 3D scene store
  const { drawing, shapes, setActiveTool: setStoreActiveTool, clearAll } = useAppStore();

  // Sync local state with store state when store changes
  useEffect(() => {
    if (drawing.activeTool !== activeTool) {
      setActiveTool(drawing.activeTool);
    }
  }, [drawing.activeTool, activeTool]);

  // 3D Scene event handlers
  const handleCoordinateChange = (worldPos: Point2D, screenPos: Point2D) => {
    // Handle coordinate changes for measurements display
    // This could be used to show real-time coordinates in the UI
  };

  const handleCameraChange = (position: Point3D, target: Point3D) => {
    // Handle camera changes if needed for UI updates
    // Could be used for camera presets or view saving
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfd' }}>
      
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px' }}></div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#111827' }}>Land Visualizer</h1>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Advanced 3D land measurement and analysis tool</span>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          <span>FPS: 60</span> | <span>Quality: 100%</span> | <strong>5,000 SQUARE METERS</strong>
        </div>
      </div>

      {/* Ribbon Toolbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f3f4f6', background: '#fcfcfd' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Tools & Functions</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            {/* Area Configuration */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Area Configuration</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', borderRadius: '8px', minWidth: '60px', height: '64px', color: '#6b7280', background: 'white', border: '1px solid #e5e5e5', cursor: 'pointer' }}>
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>➕</span>
                  <span style={{ fontSize: '12px' }}>Insert Area</span>
                </button>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', borderRadius: '8px', minWidth: '60px', height: '64px', color: '#6b7280', background: 'white', border: '1px solid #e5e5e5', cursor: 'pointer' }}>
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>➕</span>
                  <span style={{ fontSize: '12px' }}>Add Area</span>
                </button>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', borderRadius: '8px', minWidth: '60px', height: '64px', color: '#6b7280', background: 'white', border: '1px solid #e5e5e5', cursor: 'pointer' }}>
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>⚏</span>
                  <span style={{ fontSize: '12px' }}>Presets</span>
                </button>
              </div>
            </div>

            {/* Drawing Tools */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Drawing Tools</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => {
                    setActiveTool('select');
                    setStoreActiveTool('select');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px', 
                    borderRadius: '8px', 
                    minWidth: '60px', 
                    height: '64px', 
                    border: '1px solid #e5e5e5',
                    cursor: 'pointer',
                    background: activeTool === 'select' ? '#dbeafe' : 'white',
                    color: activeTool === 'select' ? '#1d4ed8' : '#6b7280'
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>↖</span>
                  <span style={{ fontSize: '12px' }}>Select</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTool('rectangle');
                    setStoreActiveTool('rectangle');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px', 
                    borderRadius: '8px', 
                    minWidth: '60px', 
                    height: '64px', 
                    border: '1px solid #e5e5e5',
                    cursor: 'pointer',
                    background: activeTool === 'rectangle' ? '#dbeafe' : 'white',
                    color: activeTool === 'rectangle' ? '#1d4ed8' : '#6b7280'
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>⬜</span>
                  <span style={{ fontSize: '12px' }}>Rectangle</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTool('polyline');
                    setStoreActiveTool('polyline');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px', 
                    borderRadius: '8px', 
                    minWidth: '60px', 
                    height: '64px', 
                    border: '1px solid #e5e5e5',
                    cursor: 'pointer',
                    background: activeTool === 'polyline' ? '#dbeafe' : 'white',
                    color: activeTool === 'polyline' ? '#1d4ed8' : '#6b7280'
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>📐</span>
                  <span style={{ fontSize: '12px' }}>Polyline</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTool('circle');
                    setStoreActiveTool('circle');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px', 
                    borderRadius: '8px', 
                    minWidth: '60px', 
                    height: '64px', 
                    border: '1px solid #e5e5e5',
                    cursor: 'pointer',
                    background: activeTool === 'circle' ? '#dbeafe' : 'white',
                    color: activeTool === 'circle' ? '#1d4ed8' : '#6b7280'
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>⭕</span>
                  <span style={{ fontSize: '12px' }}>Circle</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTool('polygon');
                    setStoreActiveTool('polygon');
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '8px', 
                    borderRadius: '8px', 
                    minWidth: '60px', 
                    height: '64px', 
                    border: '1px solid #e5e5e5',
                    cursor: 'pointer',
                    background: activeTool === 'polygon' ? '#dbeafe' : 'white',
                    color: activeTool === 'polygon' ? '#1d4ed8' : '#6b7280'
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>🔷</span>
                  <span style={{ fontSize: '12px' }}>Polygon</span>
                </button>
              </div>
            </div>

            {/* Corner Controls */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Corner Controls</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', borderRadius: '8px', minWidth: '60px', height: '64px', color: '#6b7280', background: 'white', border: '1px solid #e5e5e5', cursor: 'pointer' }}>
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>📍</span>
                  <span style={{ fontSize: '12px' }}>Add Corner</span>
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Clear all shapes? This cannot be undone.')) {
                      clearAll();
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', borderRadius: '8px', minWidth: '60px', height: '64px', color: '#6b7280', background: 'white', border: '1px solid #e5e5e5', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>🗑</span>
                  <span style={{ fontSize: '12px' }}>Clear All</span>
                </button>
              </div>
            </div>

            {/* Export */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Export</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', borderRadius: '8px', minWidth: '60px', height: '64px', color: '#6b7280', background: 'white', border: '1px solid #e5e5e5', cursor: 'pointer' }}>
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>💾</span>
                  <span style={{ fontSize: '12px' }}>Excel Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar */}
        <div style={{ width: '64px', background: 'white', borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '16px' }}>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Home">🏠</button>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Visual Comparison">👁</button>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Unit Converter">🔢</button>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Quick Tools">⚡</button>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Layers">📄</button>
        </div>

        {/* Central 3D Canvas */}
        <main style={{ flex: 1, position: 'relative', background: '#3b82f6', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <SceneManager 
              onCoordinateChange={handleCoordinateChange}
              onCameraChange={handleCameraChange}
              settings={{
                gridSize: 100,
                gridDivisions: 50,
                showGrid: true,
                backgroundColor: 'transparent',
                cameraPosition: { x: 0, y: 30, z: 30 },
                cameraTarget: { x: 0, y: 0, z: 0 },
                enableOrbitControls: true,
                maxPolarAngle: Math.PI / 2.1,
                minDistance: 5,
                maxDistance: 200
              }}
            />
          </div>
          
          {/* Status overlay - shows active tool and current measurements */}
          <div style={{ 
            position: 'absolute', 
            bottom: '16px', 
            left: '16px', 
            background: 'rgba(255,255,255,0.95)', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span><strong>Tool:</strong> {activeTool}</span>
            <div style={{ width: '1px', height: '16px', background: '#d1d5db' }}></div>
            <span><strong>Shapes:</strong> {drawing.isDrawing ? 'Drawing...' : `${shapes.length} total`}</span>
          </div>
        </main>

        {/* Right Sidebar */}
        <div style={{ width: '64px', background: 'white', borderLeft: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '16px' }}>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Land Metrics">📊</button>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Terrain">🏔</button>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Dimensions">📏</button>
          <button style={{ padding: '8px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Properties">⚙️</button>
        </div>
      </div>
    </div>
  );
}

export default App;