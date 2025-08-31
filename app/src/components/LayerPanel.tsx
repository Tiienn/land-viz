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
  const [orderMenuOpen, setOrderMenuOpen] = useState<string | null>(null);
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
      setOrderMenuOpen(null);
      setColorPaletteOpen(null);
    };
    if (orderMenuOpen || colorPaletteOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [orderMenuOpen, colorPaletteOpen]);

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
    
    // Extract dimensions from layer name
    const layerNameMatch = layer.name.match(/\((.*?)\)/);
    if (layerNameMatch) {
      const dimensionPart = layerNameMatch[1];
      const areaMatch = dimensionPart.match(/([\d.]+)m²/);
      const area = areaMatch ? `${areaMatch[1]} m²` : '0 m²';
      
      if (shape.type === 'rectangle') {
        const sizeMatch = dimensionPart.match(/([\d.]+)×([\d.]+)m/);
        const dimensions = sizeMatch ? `${sizeMatch[1]} × ${sizeMatch[2]} m` : 'm × m';
        return { type: 'Rectangle Tool', dimensions, area };
      } else if (shape.type === 'circle') {
        const radiusMatch = dimensionPart.match(/r=([\d.]+)m/);
        const dimensions = radiusMatch ? `r=${radiusMatch[1]} m` : 'r=0 m';
        return { type: 'Circle Tool', dimensions, area };
      } else {
        return { type: 'Polyline Tool', dimensions: 'path', area };
      }
    }
    
    return { 
      type: `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} Tool`, 
      dimensions: 'm × m', 
      area: '0 m²' 
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
    setOrderMenuOpen(null);
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
                  
                </div>

                {/* Layer Name */}
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
                    style={{
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={layer.name}
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
                          setOrderMenuOpen(orderMenuOpen === layer.id ? null : layer.id);
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

    {/* Color Palette Modal */}
    {colorPaletteOpen && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setColorPaletteOpen(null)}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '320px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>⋮⋮</div>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  background: layers.find(l => l.id === colorPaletteOpen)?.color || '#3B82F6',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '500', 
                color: '#111827'
              }}>
                {layers.find(l => l.id === colorPaletteOpen)?.name?.split(' (')[0] || 'Layer'}
              </span>
            </div>
            <button
              onClick={() => setColorPaletteOpen(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Dimensions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <span>m × m</span>
            <span style={{ fontWeight: '600' }}>158 m²</span>
          </div>

          {/* Choose Color */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '16px' }}>🎨</span>
              Choose Color
            </div>

            {/* Color Grid - First Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '6px',
              marginBottom: '8px'
            }}>
              {colorPalette.slice(0, 10).map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(colorPaletteOpen, color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: color,
                    border: layers.find(l => l.id === colorPaletteOpen)?.color === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
            </div>
            
            {/* Color Grid - Second Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '6px',
              marginBottom: '12px'
            }}>
              {colorPalette.slice(10, 20).map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(colorPaletteOpen, color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: color,
                    border: layers.find(l => l.id === colorPaletteOpen)?.color === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
            </div>

            {/* Black Bar */}
            <button
              onClick={() => handleColorChange(colorPaletteOpen, '#000000')}
              style={{
                width: '100%',
                height: '32px',
                background: '#000000',
                border: layers.find(l => l.id === colorPaletteOpen)?.color === '#000000' ? '2px solid #1f2937' : '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      </div>
    )}

    {/* Layer Order Modal */}
    {orderMenuOpen && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setOrderMenuOpen(null)}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '320px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>⋮⋮</div>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  background: layers.find(l => l.id === orderMenuOpen)?.color || '#3B82F6',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '500', 
                color: '#111827'
              }}>
                {layers.find(l => l.id === orderMenuOpen)?.name?.split(' (')[0] || 'Layer'}
              </span>
            </div>
            <button
              onClick={() => setOrderMenuOpen(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Dimensions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <span>m × m</span>
            <span style={{ fontWeight: '600' }}>158 m²</span>
          </div>

          {/* Layer Order */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '16px' }}>📚</span>
              Layer Order
            </div>

            {/* Order Buttons Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={() => handleLayerOrder(orderMenuOpen, 'front')}
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ⏭ To Front
              </button>
              
              <button
                onClick={() => handleLayerOrder(orderMenuOpen, 'forward')}
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ↑ Forward
              </button>
              
              <button
                onClick={() => handleLayerOrder(orderMenuOpen, 'backward')}
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ↓ Backward
              </button>
              
              <button
                onClick={() => handleLayerOrder(orderMenuOpen, 'back')}
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ⏮ To Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default LayerPanel;