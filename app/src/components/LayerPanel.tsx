import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTextStore } from '@/store/useTextStore'; // Phase 9: Text integration (legacy)
import type { Shape, Element } from '@/types';
import { isShapeElement, isTextElement } from '@/types';
import Icon from './Icon';
import LayerThumbnail from './LayerPanel/LayerThumbnail';
import { NoLayersEmptyState, SearchNoResultsEmptyState } from './UI/EmptyState'; // Phase 2: Empty states

interface LayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}

const LayerPanel: React.FC<LayerPanelProps> = ({ isOpen, onClose, inline = false }) => {
  const layers = useAppStore(state => state.layers);
  const shapes = useAppStore(state => state.shapes);
  const activeLayerId = useAppStore(state => state.activeLayerId);
  const selectedLayerIds = useAppStore(state => state.selectedLayerIds) || []; // Phase 2: Multi-selection (safe fallback)
  // const createLayer = useAppStore(state => state.createLayer);
  const updateLayer = useAppStore(state => state.updateLayer);
  const deleteLayer = useAppStore(state => state.deleteLayer);
  const setActiveLayer = useAppStore(state => state.setActiveLayer);
  const selectLayer = useAppStore(state => state.selectLayer); // Phase 2: Multi-selection
  const selectLayerRange = useAppStore(state => state.selectLayerRange); // Phase 2: Multi-selection
  // Phase 3: Folder management
  const createFolder = useAppStore(state => state.createFolder);
  const moveToFolder = useAppStore(state => state.moveToFolder);
  const deleteFolder = useAppStore(state => state.deleteFolder);
  const toggleFolderCollapse = useAppStore(state => state.toggleFolderCollapse);
  const getFolderDepth = useAppStore(state => state.getFolderDepth);
  const folderContains = useAppStore(state => state.folderContains);
  const moveLayerToFront = useAppStore(state => state.moveLayerToFront);
  const moveLayerForward = useAppStore(state => state.moveLayerForward);
  const moveLayerBackward = useAppStore(state => state.moveLayerBackward);
  const moveLayerToBack = useAppStore(state => state.moveLayerToBack);

  // Phase 6: Element integration (unified elements array)
  const elements = useAppStore(state => state.elements);
  const selectedElementIds = useAppStore(state => state.selectedElementIds);
  const selectElement = useAppStore(state => state.selectElement);
  const updateElement = useAppStore(state => state.updateElement);
  const deleteElement = useAppStore(state => state.deleteElement);

  // Phase 9: Text store integration (legacy - still used for backwards compatibility)
  const texts = useTextStore(state => state.texts);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const selectText = useTextStore(state => state.selectText);
  const updateText = useTextStore(state => state.updateText);
  const deleteText = useTextStore(state => state.deleteText);

  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [colorPaletteOpen, setColorPaletteOpen] = useState<string | null>(null);
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null);
  const [isUsingOpacitySlider, setIsUsingOpacitySlider] = useState(false);
  const [lastClickedLayerId, setLastClickedLayerId] = useState<string | null>(null); // Phase 2: For range selection
  const [checkboxMode, setCheckboxMode] = useState(false); // Phase 2: Show checkboxes for multi-selection
  // Phase 3: Enhanced drag-and-drop for folder nesting
  const [dropZone, setDropZone] = useState<'above' | 'below' | 'inside' | null>(null);
  const [dropValid, setDropValid] = useState<boolean>(true);
  // Phase 3: Delete confirmation modal for folders
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  // Statistics panel collapse state
  const [statisticsExpanded, setStatisticsExpanded] = useState(true);

  // Phase 2: Multi-selection click handler
  // Phase 3: Extended to support text layer selection
  const handleLayerClick = (layerId: string, event: React.MouseEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    // Phase 3: Check if this is a text layer
    const layerTexts = texts.filter(text => text.layerId === layerId);
    const textInLayer = layerTexts[0];

    if (isShift && lastClickedLayerId) {
      // Range selection: Select all layers between last clicked and current
      selectLayerRange(lastClickedLayerId, layerId);
    } else if (isCtrlOrCmd) {
      // Toggle selection: Add/remove this layer from selection
      selectLayer(layerId, true);
      setLastClickedLayerId(layerId);

      // Phase 3: If text layer, also select the text object
      if (textInLayer) {
        selectText(textInLayer.id);
      }
    } else {
      // Single selection: Clear all and select this one
      selectLayer(layerId, false);
      setLastClickedLayerId(layerId);

      // Phase 3: If text layer, select the text object (deselect shapes)
      if (textInLayer) {
        selectText(textInLayer.id);
        // Deselect any selected shapes
        useAppStore.getState().setSelectedShapeIds([]);
      } else {
        // If shape layer, deselect text
        selectText(null);
      }
    }
  };

  // Cleanup opacity slider state on unmount or when panel closes
  useEffect(() => {
    if (!isOpen) {
      setIsUsingOpacitySlider(false);
    }
  }, [isOpen]);

  // Cleanup opacity slider state on window events (fallback)
  useEffect(() => {
    const handleMouseUp = () => setIsUsingOpacitySlider(false);
    const handlePointerUp = () => setIsUsingOpacitySlider(false);
    const handleTouchEnd = () => setIsUsingOpacitySlider(false);
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

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

  // Phase 9: Get text count for a layer
  const getLayerTextCount = (layerId: string) => {
    return texts.filter(text => text.layerId === layerId && text.type === 'floating').length;
  };

  // Phase 9: Get label count for a shape
  const getShapeLabelCount = (shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    return shape?.label ? 1 : 0;
  };

  // Phase 6: Get elements for a layer, sorted by creation time
  const getLayerElements = useMemo(() => {
    return (layerId: string): Element[] => {
      // Safe fallback: elements might be undefined if migration hasn't run yet
      return (elements || [])
        .filter((el) => el.layerId === layerId)
        .sort((a, b) => a.created.getTime() - b.created.getTime());
    };
  }, [elements]);

  // Filter layers by search term AND hide empty layers
  const filteredLayers = layers.filter(layer => {
    const matchesSearch = layer.name.toLowerCase().includes(searchTerm.toLowerCase());
    // Check elements, shapes, AND text objects (Phase 4: include text)
    const hasElements = getLayerElements(layer.id).length > 0 ||
                        shapes.filter(s => s.layerId === layer.id).length > 0 ||
                        texts.filter(t => t.layerId === layer.id).length > 0 || // Phase 4: Show text layers
                        layer.type === 'folder';
    return matchesSearch && hasElements;
  });

  // Phase 3: Get root-level layers (no parent) for folder hierarchy
  const rootLayers = filteredLayers.filter(layer => !layer.parentId);

  // Phase 3: Get children of a folder
  const getChildLayers = (parentId: string) => {
    return filteredLayers.filter(layer => layer.parentId === parentId);
  };

  // Helper function to get shape info for a layer
  const getLayerShapeInfo = (layerId: string) => {
    // Check if this is a text layer
    const layerTexts = texts.filter(text => text.layerId === layerId);
    const text = layerTexts[0]; // Get first text in layer

    if (text) {
      // This is a text layer - return text-specific info
      const textContent = text.content.trim() || '(Empty text)';
      const textPreview = textContent.substring(0, 30) + (textContent.length > 30 ? '...' : '');
      return {
        type: 'Text',
        dimensions: '', // No dimensions for text
        area: '', // No area for text
        isText: true,
        textContent: textPreview
      };
    }

    // Otherwise, check for shapes
    const layerShapes = shapes.filter(shape => shape.layerId === layerId);
    const shape = layerShapes[0]; // Get first shape in layer
    const layer = layers.find(l => l.id === layerId);

    if (!shape || !layer) return { type: 'Empty', dimensions: 'm × m', area: '0 m²', isText: false };
    
    // Calculate dimensions directly from shape points
    const calculateDimensions = (shape: Shape) => {
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
      area: measurements.area,
      isText: false
    };
  };


  // Phase 3: Extended to support text visibility toggle
  const handleToggleLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newVisibility = !layer.visible;

      // Update layer visibility
      updateLayer(layerId, { visible: newVisibility });

      // Phase 3: If this is a text layer, also toggle text visibility
      const layerTexts = texts.filter(text => text.layerId === layerId);
      layerTexts.forEach(text => {
        updateText(text.id, { visible: newVisibility });
      });
    }
  };

  // const handleToggleLayerLock = (layerId: string) => {
  //   const layer = layers.find(l => l.id === layerId);
  //   if (layer) {
  //     updateLayer(layerId, { locked: !layer.locked });
  //   }
  // };

  const handleLayerNameEdit = (layerId: string, newName: string) => {
    if (newName.trim()) {
      updateLayer(layerId, { name: newName.trim() });
    }
    setEditingLayer(null);
  };

  const handleDeleteLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);

    // Phase 3: Special handling for folder deletion
    if (layer?.type === 'folder') {
      setFolderToDelete(layerId);
      setDeleteModalOpen(true);
      return;
    }

    // Regular layer deletion with confirmation
    const shapeCount = getLayerShapeCount(layerId);
    const textCount = getLayerTextCount(layerId); // Phase 9: Include text count
    const totalItems = shapeCount + textCount;

    if (totalItems > 0) {
      let message = `This layer contains ${shapeCount} shape${shapeCount !== 1 ? 's' : ''}`;
      if (textCount > 0) {
        message += ` and ${textCount} text object${textCount !== 1 ? 's' : ''}`;
      }
      message += '. Are you sure you want to delete it?';

      const confirmed = window.confirm(message);
      if (!confirmed) return;
    }

    // Phase 3: Delete all text objects in this layer first
    const layerTexts = texts.filter(text => text.layerId === layerId);
    layerTexts.forEach(text => {
      deleteText(text.id);
    });

    // Then delete the layer (which will also delete shapes)
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
    // Prevent layer dragging when opacity slider is being used
    if (isUsingOpacitySlider) {
      e.preventDefault();
      return;
    }
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();

    if (!draggedLayer || draggedLayer === layerId) {
      setDragOverLayer(null);
      setDropZone(null);
      return;
    }

    const targetLayer = layers.find(l => l.id === layerId);
    const draggedLayerObj = layers.find(l => l.id === draggedLayer);

    if (!targetLayer || !draggedLayerObj) return;

    // Check if target is a folder
    const isFolder = targetLayer.type === 'folder';

    // Calculate drop zone based on mouse Y position relative to the element
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const height = rect.height;

    let zone: 'above' | 'below' | 'inside' = 'above';

    if (isFolder) {
      // For folders, divide into three zones: top 30%, middle 40%, bottom 30%
      if (relativeY < height * 0.3) {
        zone = 'above';
      } else if (relativeY > height * 0.7) {
        zone = 'below';
      } else {
        zone = 'inside';
      }
    } else {
      // For layers, divide into two zones: top 50%, bottom 50%
      zone = relativeY < height * 0.5 ? 'above' : 'below';
    }

    // Validate drop is allowed
    let valid = true;

    if (zone === 'inside' && isFolder) {
      // Check circular nesting: can't drop folder into itself or its descendants
      if (draggedLayerObj.type === 'folder') {
        if (draggedLayer === layerId || folderContains(draggedLayer, layerId)) {
          valid = false;
        }
      }
    }

    e.dataTransfer.dropEffect = valid ? 'move' : 'none';
    setDragOverLayer(layerId);
    setDropZone(zone);
    setDropValid(valid);
  };

  const handleDragLeave = () => {
    setDragOverLayer(null);
    setDropZone(null);
    setDropValid(true);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();

    if (!draggedLayer || draggedLayer === targetLayerId || !dropValid) {
      setDraggedLayer(null);
      setDragOverLayer(null);
      setDropZone(null);
      setDropValid(true);
      return;
    }

    const targetLayer = layers.find(l => l.id === targetLayerId);
    const draggedLayerObj = layers.find(l => l.id === draggedLayer);

    if (!targetLayer || !draggedLayerObj) {
      setDraggedLayer(null);
      setDragOverLayer(null);
      setDropZone(null);
      setDropValid(true);
      return;
    }

    // Phase 3: Handle drop into folder
    if (dropZone === 'inside' && targetLayer.type === 'folder') {
      // Move dragged item into the folder
      moveToFolder(draggedLayer, targetLayerId);
    } else {
      // Phase 3: Reordering (above/below) - maintain existing logic
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
    setDropZone(null);
    setDropValid(true);
  };

  const handleDragEnd = () => {
    setDraggedLayer(null);
    setDragOverLayer(null);
    setDropZone(null);
    setDropValid(true);
  };

  return (
    <div style={{
      width: '100%',
      height: inline ? '100%' : '100vh',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* Header */}
      {inline && (
        <div style={headerStyles.header}>
          <h3 style={headerStyles.title}>
            Layers
          </h3>
          <button
            style={headerStyles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Collapse layers panel"
          >
            ◀
          </button>
        </div>
      )}

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
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

      {/* Layer Count and Info - Only show if there are non-empty layers */}
      {filteredLayers.length > 0 && (
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
            {selectedLayerIds.length > 1 && (
              <span style={{ marginLeft: '8px', color: '#3b82f6', fontSize: '13px' }}>
                ({selectedLayerIds.length} selected)
              </span>
            )}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Phase 3: New Folder Button */}
            <button
              onClick={() => {
                const folderCount = layers.filter(l => l.type === 'folder').length;
                createFolder(`Folder ${folderCount + 1}`);
              }}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Create new folder"
            >
              <Icon name="folder" size={16} style={{ marginRight: '6px' }} />
              New Folder
            </button>
            <button
              onClick={() => setCheckboxMode(!checkboxMode)}
              style={{
                background: checkboxMode ? '#3b82f6' : 'transparent',
                color: checkboxMode ? 'white' : '#6b7280',
                border: `1px solid ${checkboxMode ? '#3b82f6' : '#d1d5db'}`,
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                if (!checkboxMode) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.color = '#3b82f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!checkboxMode) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
              title={checkboxMode ? 'Exit multi-select mode' : 'Enter multi-select mode'}
            >
              {checkboxMode ? '✓ Multi-Select' : 'Multi-Select'}
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: Bulk Operations Toolbar */}
      {selectedLayerIds.length > 1 && (
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #f3f4f6',
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#1e40af',
            marginRight: '8px'
          }}>
            Bulk Actions:
          </span>

          {/* Delete Selected Layers */}
          <button
            onClick={() => {
              if (window.confirm(`Delete ${selectedLayerIds.length} selected layers?`)) {
                selectedLayerIds.forEach(id => deleteLayer(id));
              }
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            title="Delete all selected layers"
          >
            <Icon name="trash" size={16} style={{ marginRight: '6px' }} />
            Delete
          </button>

          {/* Toggle Visibility */}
          <button
            onClick={() => {
              const allVisible = selectedLayerIds.every(id =>
                layers.find(l => l.id === id)?.visible
              );
              selectedLayerIds.forEach(id => {
                const layer = layers.find(l => l.id === id);
                if (layer) {
                  updateLayer(id, { visible: !allVisible });
                }
              });
            }}
            style={{
              background: 'white',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#1f2937';
            }}
            title="Toggle visibility for all selected layers"
          >
            <Icon name="eye" size={16} style={{ marginRight: '6px' }} />
            Toggle Visibility
          </button>

          {/* Toggle Lock */}
          <button
            onClick={() => {
              const allLocked = selectedLayerIds.every(id =>
                layers.find(l => l.id === id)?.locked
              );
              selectedLayerIds.forEach(id => {
                const layer = layers.find(l => l.id === id);
                if (layer) {
                  updateLayer(id, { locked: !allLocked });
                }
              });
            }}
            style={{
              background: 'white',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#1f2937';
            }}
            title="Toggle lock for all selected layers"
          >
            <Icon name="lock" size={16} style={{ marginRight: '6px' }} />
            Toggle Lock
          </button>

          {/* Opacity Slider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px'
          }}>
            <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '12px' }}>
              Opacity:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="100"
              onChange={(e) => {
                const opacity = parseInt(e.target.value) / 100;
                selectedLayerIds.forEach(id => {
                  updateLayer(id, { opacity });
                });
              }}
              style={{
                width: '80px',
                cursor: 'pointer',
                accentColor: '#3b82f6'
              }}
              title="Set opacity for all selected layers"
            />
            <span style={{
              color: '#6b7280',
              fontSize: '11px',
              minWidth: '35px',
              textAlign: 'right'
            }}>
              {Math.round((layers.find(l => l.id === selectedLayerIds[0])?.opacity || 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Layer List */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {/* Phase 3: Recursive folder rendering function */}
        {(() => {
          const renderLayer = (layer: typeof layers[0], depth: number = 0): React.ReactNode => {
            const isActive = layer.id === activeLayerId;
            const isSelected = selectedLayerIds.includes(layer.id);
            const isEditing = editingLayer === layer.id;
            const shapeInfo = getLayerShapeInfo(layer.id);
            const isFolder = layer.type === 'folder';
            const isCollapsed = layer.collapsed;
            const children = isFolder ? getChildLayers(layer.id) : [];
            const indentPx = depth * 20;

          return (
            <React.Fragment key={layer.id}>
              <div
                draggable={true}
                onDragStart={(e) => handleDragStart(e, layer.id)}
                onDragOver={(e) => handleDragOver(e, layer.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, layer.id)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: '16px 20px',
                  paddingLeft: `${20 + indentPx}px`, // Phase 3: Indentation for folder hierarchy
                  background:
                    dragOverLayer === layer.id && draggedLayer !== layer.id
                      ? dropZone === 'inside'
                        ? dropValid ? '#dbeafe' : '#fee2e2'  // Blue for valid drop into folder, red for invalid
                        : '#f3f4f6'  // Light gray for above/below
                      : isSelected
                        ? '#f0f9ff'
                        : 'white',
                  cursor: draggedLayer === layer.id ? 'grabbing' : 'pointer',
                  position: 'relative',
                  borderLeft: isActive ? '3px solid #3b82f6' : isSelected ? '3px solid #93c5fd' : '3px solid transparent',
                  opacity: draggedLayer === layer.id ? 0.5 : 1,
                  transition: 'background-color 0.2s, opacity 0.2s',
                  // Phase 3: Drop zone indicator borders
                  borderTop: dragOverLayer === layer.id && dropZone === 'above' && dropValid ? '2px solid #3b82f6' : undefined,
                  borderBottom: dragOverLayer === layer.id && dropZone === 'below' && dropValid ? '2px solid #3b82f6' : '1px solid #f3f4f6',
                }}
                onClick={(e) => handleLayerClick(layer.id, e)}
              >
              {/* Tool Type Header */}
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '8px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>
                  {isFolder ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="folder" size={14} color="#6B7280" />
                      <span>Folder ({children.length} items)</span>
                    </span>
                  ) : shapeInfo.isText ? (
                    // Text layer - show text icon and content preview
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="text" size={14} color="#6B7280" />
                      <span style={{ color: '#374151', fontWeight: '500' }}>
                        {shapeInfo.textContent}
                      </span>
                    </span>
                  ) : (
                    // Shape layer - show type
                    shapeInfo.type
                  )}
                </span>
                {/* Phase 3: Drop into folder indicator */}
                {isFolder && dragOverLayer === layer.id && dropZone === 'inside' && (
                  <span style={{
                    fontSize: '11px',
                    color: dropValid ? '#3b82f6' : '#ef4444',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: dropValid ? '#eff6ff' : '#fef2f2'
                  }}>
                    {dropValid ? '↓ Drop into folder' : '✕ Cannot drop here'}
                  </span>
                )}
              </div>

              {/* Main Layer Content */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                {/* Phase 3: Folder expand/collapse icon */}
                {isFolder ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderCollapse(layer.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '2px',
                      color: '#6b7280',
                      flexShrink: 0,
                      width: '18px',
                      textAlign: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                    title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
                  >
                    <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} size={14} />
                  </button>
                ) : checkboxMode && (
                  <div style={{ width: '18px', flexShrink: 0 }} />
                )}

                {/* Phase 2: Checkbox for multi-selection mode */}
                {checkboxMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      selectLayer(layer.id, true);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                      flexShrink: 0
                    }}
                    title="Select layer"
                  />
                )}

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

                {/* Layer Thumbnail - Phase 1: Visual preview (not for folders or text layers) */}
                {!isFolder && !shapeInfo.isText && <LayerThumbnail layer={layer} size={40} />}
                {/* Phase 4: Text layer icon */}
                {!isFolder && shapeInfo.isText && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    color: '#6B7280'
                  }}>
                    <Icon name="text" size={20} color="#6B7280" />
                  </div>
                )}
                {/* Phase 3: Folder icon */}
                {isFolder && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon name="folder" size={24} color="#6B7280" />
                  </div>
                )}

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
                      opacity: layer.visible ? 1 : 0.4,
                      color: '#6b7280'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>

                  {/* Lock/Unlock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle locked state for all elements in this layer
                      const layerElements = getLayerElements(layer.id);
                      const newLockedState = !layer.locked;
                      layerElements.forEach(element => {
                        updateElement(element.id, { locked: newLockedState });
                      });
                      updateLayer(layer.id, { locked: newLockedState });

                      // Phase 3: Also toggle lock for text objects in this layer
                      const layerTexts = texts.filter(text => text.layerId === layer.id);
                      layerTexts.forEach(text => {
                        updateText(text.id, { locked: newLockedState });
                      });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      opacity: layer.locked ? 1 : 0.4,
                      color: '#6b7280'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {layer.locked ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                      </svg>
                    )}
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"/>
                          <line x1="8" y1="12" x2="21" y2="12"/>
                          <line x1="8" y1="18" x2="21" y2="18"/>
                          <line x1="3" y1="6" x2="3.01" y2="6"/>
                          <line x1="3" y1="12" x2="3.01" y2="12"/>
                          <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
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
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onDragStart={(e) => e.preventDefault()}
                onDrag={(e) => e.stopPropagation()}
                onDragEnd={(e) => e.stopPropagation()}
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
                  onInput={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { opacity: parseFloat((e.target as HTMLInputElement).value) });
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsUsingOpacitySlider(true);
                  }}
                  onMouseMove={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    setIsUsingOpacitySlider(false);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setIsUsingOpacitySlider(true);
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    setIsUsingOpacitySlider(false);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsUsingOpacitySlider(true);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    setIsUsingOpacitySlider(false);
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrag={(e) => {
                    e.stopPropagation();
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                  }}
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
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

            {/* Phase 3: Recursive children rendering for folders */}
            {isFolder && !isCollapsed && children.length > 0 && (
              <React.Fragment key={`children-${layer.id}`}>
                {children.slice().reverse().map(child => renderLayer(child, depth + 1))}
              </React.Fragment>
            )}
          </React.Fragment>
          );
        };

        // Phase 3: Render root-level layers (no parent)
        return rootLayers.slice().reverse().map(layer => renderLayer(layer, 0));
      })()}

        {rootLayers.length === 0 && (
          searchTerm ? (
            <SearchNoResultsEmptyState searchQuery={searchTerm} />
          ) : (
            <NoLayersEmptyState />
          )
        )}
      </div>

      {/* Layer Statistics - Only show if there are elements */}
      {/* Safe fallback: elements might be undefined if migration hasn't run yet */}
      {elements && elements.length > 0 && (
        <div style={{
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          fontSize: '12px',
          color: '#6b7280',
          flexShrink: 0
        }}>
          {/* Statistics Header with Toggle */}
          <div
            onClick={() => setStatisticsExpanded(!statisticsExpanded)}
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: '#f3f4f6',
              borderBottom: statisticsExpanded ? '1px solid #e5e7eb' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '13px',
              color: '#374151'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                transition: 'transform 0.2s',
                transform: statisticsExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
              }}>
                <Icon name="chevron-right" size={14} />
              </span>
              Statistics
            </div>
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {filteredLayers.length} layers · {elements.length} elements
            </div>
          </div>

          {/* Statistics Content - Collapsible */}
          {statisticsExpanded && (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Total Layers:</span>
                <span style={{ fontWeight: '500', color: '#374151' }}>{filteredLayers.length}</span>
              </div>
              {/* Phase 6: Element statistics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Total Elements:</span>
                <span style={{ fontWeight: '500', color: '#374151' }}>{elements.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>- Shapes:</span>
                <span style={{ fontWeight: '500', color: '#374151' }}>
                  {elements.filter(el => isShapeElement(el)).length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>- Text:</span>
                <span style={{ fontWeight: '500', color: '#374151' }}>
                  {elements.filter(el => isTextElement(el)).length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Visible Layers:</span>
                <span style={{ fontWeight: '500', color: '#374151' }}>
                  {filteredLayers.filter(l => l.visible).length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase 3: Folder Delete Confirmation Modal */}
      {deleteModalOpen && folderToDelete && (() => {
        const folder = layers.find(l => l.id === folderToDelete);
        const children = folder ? getChildLayers(folderToDelete) : [];
        const childCount = children.length;

        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={() => {
              setDeleteModalOpen(false);
              setFolderToDelete(null);
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '450px',
                width: '90%',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon name="warning" size={24} color="#f59e0b" />
                Delete Folder
              </div>

              {/* Message */}
              <div style={{
                fontSize: '14px',
                color: '#4b5563',
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                {childCount === 0 ? (
                  <p>Are you sure you want to delete the folder <strong>"{folder?.name}"</strong>?</p>
                ) : (
                  <>
                    <p style={{ marginBottom: '12px' }}>
                      The folder <strong>"{folder?.name}"</strong> contains <strong>{childCount}</strong> item{childCount !== 1 ? 's' : ''}.
                    </p>
                    <p>What would you like to do?</p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {childCount > 0 && (
                  <>
                    {/* Move children to parent */}
                    <button
                      onClick={() => {
                        deleteFolder(folderToDelete, false);
                        setDeleteModalOpen(false);
                        setFolderToDelete(null);
                      }}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="folder" size={16} />
                        Delete folder only
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        Move {childCount} item{childCount !== 1 ? 's' : ''} to parent folder
                      </div>
                    </button>

                    {/* Delete folder and all contents */}
                    <button
                      onClick={() => {
                        deleteFolder(folderToDelete, true);
                        setDeleteModalOpen(false);
                        setFolderToDelete(null);
                      }}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="trash" size={16} />
                        Delete folder and all contents
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        Permanently delete {childCount} item{childCount !== 1 ? 's' : ''} inside
                      </div>
                    </button>
                  </>
                )}

                {childCount === 0 && (
                  <button
                    onClick={() => {
                      deleteFolder(folderToDelete, false);
                      setDeleteModalOpen(false);
                      setFolderToDelete(null);
                    }}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                  >
                    <Icon name="trash" size={16} style={{ marginRight: '6px' }} />
                    Delete Folder
                  </button>
                )}

                {/* Cancel button */}
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setFolderToDelete(null);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// Header styles matching ComparisonPanel
const headerStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
    flexShrink: 0
  },

  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  titleIcon: {
    color: '#6b7280',
    flexShrink: 0
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 200ms ease',
    lineHeight: 1,
    fontWeight: 300
  }
};

export default LayerPanel;