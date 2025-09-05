import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface LayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ isOpen, onClose }) => {
  const layers = useAppStore(state => state.layers);
  const shapes = useAppStore(state => state.shapes);
  const activeLayerId = useAppStore(state => state.activeLayerId);
  const createLayer = useAppStore(state => state.createLayer);
  const updateLayer = useAppStore(state => state.updateLayer);
  const deleteLayer = useAppStore(state => state.deleteLayer);
  const setActiveLayer = useAppStore(state => state.setActiveLayer);
  const moveLayerToFront = useAppStore(state => state.moveLayerToFront);
  const moveLayerForward = useAppStore(state => state.moveLayerForward);
  const moveLayerBackward = useAppStore(state => state.moveLayerBackward);
  const moveLayerToBack = useAppStore(state => state.moveLayerToBack);

  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [colorPaletteOpen, setColorPaletteOpen] = useState<string | null>(null);
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null);

  // Color palette options - matching reference image layout
  const colorPalette = [
    // Top row
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    // Bottom row  
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#EF4444',
    '#6B7280', '#4B5563', '#374151', '#000000'
  ];

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setColorPaletteOpen(null);
    };
    if (colorPaletteOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [colorPaletteOpen]);

  if (!isOpen) return null;

  const getLayerShapeCount = (layerId: string) => {
    return shapes.filter(shape => shape.layerId === layerId).length;
  };

  // Filter layers by search term
  const filteredLayers = layers.filter(layer => 
    layer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get shape info for a layer
  const getLayerShapeInfo = (layerId: string) => {
    const layerShapes = shapes.filter(shape => shape.layerId === layerId);
    const shape = layerShapes[0]; // Get first shape in layer
    const layer = layers.find(l => l.id === layerId);
    
    if (!shape || !layer) return { type: 'Empty', dimensions: 'm × m', area: '0 m²' };
    
    // Calculate dimensions directly from shape points
    const calculateDimensions = (shape: any) => {
      if (!shape.points || shape.points.length === 0) {
        return { dimensions: 'm × m', area: '0 m²' };
      }
      
      if (shape.type === 'rectangle') {
        if (shape.points.length >= 2) {
          // For 2-point rectangles (diagonal corners)
          if (shape.points.length === 2) {
            const width = Math.abs(shape.points[1].x - shape.points[0].x);
            const height = Math.abs(shape.points[1].y - shape.points[0].y);
            const area = width * height;
            return {
              dimensions: `${width.toFixed(1)} × ${height.toFixed(1)} m`,
              area: `${area.toFixed(1)} m²`
            };
          }
          // For 4-point rectangles, calculate width and height
          else if (shape.points.length >= 4) {
            const width = Math.abs(shape.points[1].x - shape.points[0].x);
            const height = Math.abs(shape.points[3].y - shape.points[0].y);
            const area = width * height;
            return {
              dimensions: `${width.toFixed(1)} × ${height.toFixed(1)} m`,
              area: `${area.toFixed(1)} m²`
            };
          }
        }
      } else if (shape.type === 'circle') {
        if (shape.points.length >= 2) {
          // Calculate radius from center to edge point
          const center = shape.points[0];
          const edge = shape.points[1] || shape.points[shape.points.length - 1];
          const radius = Math.sqrt(Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2));
          const area = Math.PI * radius * radius;
          return {
            dimensions: `r=${radius.toFixed(1)} m`,
            area: `${area.toFixed(1)} m²`
          };
        }
      } else {
        // For polylines and other shapes, calculate area using shoelace formula
        const points = shape.points;
        if (points.length >= 3) {
          let area = 0;
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
          }
          area = Math.abs(area) / 2;
          return {
            dimensions: 'path',
            area: `${area.toFixed(1)} m²`
          };
        }
      }
      
      return { dimensions: 'm × m', area: '0 m²' };
    };
    
    const measurements = calculateDimensions(shape);
    
    return { 
      type: `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} Tool`, 
      dimensions: measurements.dimensions, 
      area: measurements.area 
    };
  };


  const handleToggleLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  };

  const handleToggleLayerLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  };

  const handleLayerNameEdit = (layerId: string, newName: string) => {
    if (newName.trim()) {
      updateLayer(layerId, { name: newName.trim() });
    }
    setEditingLayer(null);
  };

  const handleDeleteLayer = (layerId: string) => {
    const shapeCount = getLayerShapeCount(layerId);
    if (shapeCount > 0) {
      const confirmed = window.confirm(`This layer contains ${shapeCount} shapes. Are you sure you want to delete it?`);
      if (!confirmed) return;
    }
    deleteLayer(layerId);
  };

  const handleColorChange = (layerId: string, newColor: string) => {
    updateLayer(layerId, { color: newColor });
    setColorPaletteOpen(null);
  };

  const handleLayerOrder = (layerId: string, action: 'forward' | 'backward' | 'front' | 'back') => {
    switch (action) {
      case 'forward':
        moveLayerForward(layerId);
        break;
      case 'backward':
        moveLayerBackward(layerId);
        break;
      case 'front':
        moveLayerToFront(layerId);
        break;
      case 'back':
        moveLayerToBack(layerId);
        break;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLayer(layerId);
  };

  const handleDragLeave = () => {
    setDragOverLayer(null);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (draggedLayer && draggedLayer !== targetLayerId) {
      // Simple reordering: move dragged layer to position of target layer
      const draggedIndex = layers.findIndex(l => l.id === draggedLayer);
      const targetIndex = layers.findIndex(l => l.id === targetLayerId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Move layer to the target position
        if (draggedIndex < targetIndex) {
          // Moving down - insert after target
          for (let i = 0; i < targetIndex - draggedIndex; i++) {
            moveLayerForward(draggedLayer);
          }
        } else {
          // Moving up - insert before target
          for (let i = 0; i < draggedIndex - targetIndex; i++) {
            moveLayerBackward(draggedLayer);
          }
        }
      }
    }
    setDraggedLayer(null);
    setDragOverLayer(null);
  };

  const handleDragEnd = () => {
    setDraggedLayer(null);
    setDragOverLayer(null);
  };

  return (
    <>
    <div style={{
      position: 'fixed',
      top: 0,
      right: isOpen ? 0 : '-350px',
      width: '350px',
      height: '100vh',
      backgroundColor: 'white',
      border: '1px solid #e5e5e5',
      boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'right 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#111827'
        }}>
          Layers
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '16px',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          ✕
        </button>
      </div>

      {/* Search Box */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f3f4f6',
        background: 'white'
      }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search layers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              background: '#f9fafb',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: '#9ca3af'
          }}>
            🔍
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Layer Count and Info */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #f3f4f6',
        background: '#f9fafb',
        fontSize: '14px',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: '500' }}>
          {filteredLayers.length} Layer{filteredLayers.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          Auto-created
        </span>
      </div>

      {/* Layer List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredLayers.map(layer => {
          const isActive = layer.id === activeLayerId;
          const shapeCount = getLayerShapeCount(layer.id);
          const isEditing = editingLayer === layer.id;
          const shapeInfo = getLayerShapeInfo(layer.id);

          return (
            <div
              key={layer.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={handleDragEnd}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6',
                background: 
                  dragOverLayer === layer.id && draggedLayer !== layer.id 
                    ? '#e0f2fe' 
                    : isActive 
                      ? '#f0f9ff' 
                      : 'white',
                cursor: draggedLayer === layer.id ? 'grabbing' : 'pointer',
                position: 'relative',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                opacity: draggedLayer === layer.id ? 0.5 : 1,
                transition: 'background-color 0.2s, opacity 0.2s'
              }}
              onClick={() => setActiveLayer(layer.id)}
            >
              {/* Tool Type Header */}
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                {shapeInfo.type}
              </div>

              {/* Main Layer Content */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '8px'
              }}>
                {/* Drag Handle */}
                <div 
                  style={{
                    color: draggedLayer === layer.id ? '#3b82f6' : '#9ca3af',
                    fontSize: '14px',
                    cursor: draggedLayer === layer.id ? 'grabbing' : 'grab',
                    padding: '2px',
                    transition: 'color 0.2s'
                  }} 
                  title="Drag to reorder"
                  onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                  onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                >
                  ⋮⋮
                </div>

                {/* Layer Color Indicator - Clickable */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setColorPaletteOpen(colorPaletteOpen === layer.id ? null : layer.id);
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      background: layer.color,
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb',
                      flexShrink: 0,
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Change layer color"
                  />
                  
                  {/* Inline Color Palette Window */}
                  {colorPaletteOpen === layer.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: '20px', // Position to the right of the color button
                        top: '0px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1000,
                        width: '120px'
                      }}
                    >
                      {/* Color Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '4px',
                        marginBottom: '4px'
                      }}>
                        {colorPalette.slice(0, 10).map((color, index) => (
                          <button
                            key={index}
                            onClick={() => handleColorChange(layer.id, color)}
                            style={{
                              width: '16px',
                              height: '16px',
                              background: color,
                              border: layer.color === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title={`Change to ${color}`}
                          />
                        ))}
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '4px'
                      }}>
                        {colorPalette.slice(10, 20).map((color, index) => (
                          <button
                            key={index + 10}
                            onClick={() => handleColorChange(layer.id, color)}
                            style={{
                              width: '16px',
                              height: '16px',
                              background: color,
                              border: layer.color === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title={`Change to ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>

                {/* Layer Name - Directly clickable to edit */}
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={layer.name.split(' (')[0]} // Only edit the name part, not dimensions
                    onBlur={(e) => {
                      const namePart = layer.name.split(' (');
                      const dimensionsPart = namePart[1] ? ` (${namePart[1]}` : '';
                      handleLayerNameEdit(layer.id, e.target.value + dimensionsPart);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const namePart = layer.name.split(' (');
                        const dimensionsPart = namePart[1] ? ` (${namePart[1]}` : '';
                        handleLayerNameEdit(layer.id, e.currentTarget.value + dimensionsPart);
                      } else if (e.key === 'Escape') {
                        setEditingLayer(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      border: '1px solid #3b82f6',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: 'white'
                    }}
                  />
                ) : (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLayer(layer.id);
                    }}
                    style={{
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'text',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={`Click to edit: ${layer.name}`}
                  >
                    {layer.name.length > 15 ? layer.name.substring(0, 15) + '...' : layer.name}
                  </span>
                )}

                {/* Action Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLayerVisibility(layer.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      opacity: layer.visible ? 1 : 0.4
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    👁️
                  </button>

                  {/* Layer Order Menu */}
                  {!isEditing && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLayer(expandedLayer === layer.id ? null : layer.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '14px',
                          color: '#6b7280',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Layer order"
                      >
                        📝
                      </button>
                      
                    </div>
                  )}

                  {/* Delete Button */}
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayer(layer.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '14px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      title="Delete layer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Dimensions Display */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#6b7280',
                paddingLeft: '28px', // Align with layer name
                marginBottom: '8px'
              }}>
                <span>{shapeInfo.dimensions}</span>
                <span style={{ fontWeight: '600' }}>{shapeInfo.area}</span>
              </div>

              {/* Opacity Control */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: '28px', // Align with layer name
                  fontSize: '11px',
                  color: '#6b7280'
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
              >
                <span style={{ minWidth: '45px' }}>Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { opacity: parseFloat(e.target.value) });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                  style={{
                    flex: 1,
                    height: '4px',
                    background: '#e5e7eb',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ 
                  minWidth: '30px', 
                  textAlign: 'right',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>

              {/* Inline Layer Order Controls - Shows when expanded */}
              {expandedLayer === layer.id && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f3f4f6',
                  paddingLeft: '28px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    <span style={{ fontSize: '14px' }}>📚</span>
                    Layer Order
                  </div>
                  
                  {/* Order Buttons - 2x2 Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerOrder(layer.id, 'front');
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      ⏭ To Front
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerOrder(layer.id, 'forward');
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      ↑ Forward
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerOrder(layer.id, 'backward');
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      ↓ Backward
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerOrder(layer.id, 'back');
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e2e8f0';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      ⏮ To Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredLayers.length === 0 && (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>📄</div>
            <div style={{ marginBottom: '4px' }}>No layers found</div>
            <div style={{ fontSize: '12px' }}>
              {searchTerm ? 'Try a different search term' : 'Draw your first shape to create a layer'}
            </div>
          </div>
        )}
      </div>

      {/* Layer Statistics */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Total Layers:</span>
          <span style={{ fontWeight: '500', color: '#374151' }}>{layers.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Total Shapes:</span>
          <span style={{ fontWeight: '500', color: '#374151' }}>{shapes.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Visible Layers:</span>
          <span style={{ fontWeight: '500', color: '#374151' }}>
            {layers.filter(l => l.visible).length}
          </span>
        </div>
      </div>
    </div>


    </>
  );
};

export default LayerPanel;