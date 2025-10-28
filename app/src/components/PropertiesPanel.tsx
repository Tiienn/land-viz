import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTextStore } from '@/store/useTextStore';
import { TextPropertiesPanel } from './Text/TextPropertiesPanel';
import { TextFormattingControls } from './Text/TextFormattingControls';
import { TextModal } from './Text/TextModal';
import Icon from './Icon';
import type { TextObject } from '@/types/text';

interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ isOpen, onClose }) => {
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const isDrawing = useAppStore(state => state.drawing.isDrawing);
  const currentShape = useAppStore(state => state.drawing.currentShape);
  const snapToGrid = useAppStore(state => state.drawing.snapToGrid);
  const gridSize = useAppStore(state => state.drawing.gridSize);
  const toggleSnapToGrid = useAppStore(state => state.toggleSnapToGrid);
  const setGridSize = useAppStore(state => state.setGridSize);

  // Phase 6: Text editing state
  const [textEditModalOpen, setTextEditModalOpen] = useState(false);
  const [editingText, setEditingText] = useState<TextObject | undefined>(undefined);

  // Get selectedTextId from store with proper subscription
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const updateText = useTextStore(state => state.updateText);

  // Phase 6: Handle text edit from properties panel
  const handleTextEditClick = (text: TextObject) => {
    setEditingText(text);
    setTextEditModalOpen(true);
  };

  // Phase 6: Handle text modal save
  const handleTextModalSave = (textData: Partial<TextObject>) => {
    if (editingText) {
      updateText(editingText.id, textData);
    }
    setTextEditModalOpen(false);
    setEditingText(undefined);
  };

  const getToolInstructions = () => {
    switch (activeTool) {
      case 'rectangle':
        return {
          title: 'Rectangle Tool',
          icon: 'rectangle',
          instructions: [
            isDrawing 
              ? 'Click to set the opposite corner of your rectangle'
              : 'Click on the 3D scene to set the first corner of your rectangle',
            'The rectangle will be drawn with straight edges between the two corners',
            'Dimensions and area will be calculated automatically',
            'Right-click to cancel drawing at any time'
          ],
          tips: [
            'Use grid snap for precise measurements',
            'Dimensions are displayed in real-time as you draw',
            'Perfect for creating building footprints or land parcels'
          ]
        };
      
      case 'circle':
        return {
          title: 'Circle Tool',
          icon: 'circle',
          instructions: [
            isDrawing
              ? 'Click to set the radius of your circle'
              : 'Click on the 3D scene to set the center of your circle',
            'Move your mouse to adjust the radius',
            'The circle area will be calculated automatically',
            'Right-click to cancel drawing at any time'
          ],
          tips: [
            'Great for circular driveways or pond areas',
            'Radius and area are shown in real-time',
            'Use grid snap for standard radius measurements'
          ]
        };

      // Polygon tool removed per user request

      case 'polyline':
        return {
          title: 'Polyline Tool',
          icon: 'polyline',
          instructions: [
            isDrawing
              ? 'Click to add more points to your line'
              : 'Click on the 3D scene to start drawing your line',
            'Continue clicking to add additional points',
            'Click near the start point to close the shape',
            isDrawing && currentShape?.points && currentShape.points.length > 0
              ? `⚡ Press Ctrl+Z to undo the last point (${currentShape.points.length} points)`
              : 'Right-click to cancel drawing at any time'
          ].filter(Boolean), // Remove any false values
          tips: [
            'Useful for property boundaries or irregular shapes',
            'Creates closed polygons when completed',
            'Area is calculated automatically',
            isDrawing ? 'Use Ctrl+Z to remove individual points while drawing' : 'Precise point-by-point control'
          ]
        };

      case 'select':
      default:
        return {
          title: 'Select Tool',
          icon: 'select',
          instructions: [
            'Click on shapes to select and edit them',
            'Use the drawing tools above to create new shapes',
            'Selected shapes can be modified or deleted'
          ],
          tips: [
            'Switch to drawing tools to create new shapes',
            'Right-click for context menu options'
          ]
        };
    }
  };

  const toolInfo = getToolInstructions();

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'white'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#fafafa',
        flexShrink: 0
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 700,
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Properties
        </h3>
        <button
          onClick={onClose}
          style={{
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
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Collapse properties panel"
        >
          <Icon name="chevron-right" size={14} />
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {/* Canva-style inline text formatting - shown during inline editing */}
        <TextFormattingControls />

        {/* Phase 6: Text Properties Panel - shown when text is selected (PRIORITY VIEW) */}
        {selectedTextId ? (
          <TextPropertiesPanel onEditClick={handleTextEditClick} />
        ) : (
          <>
            {/* Current Tool Section - only shown when no text is selected */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Icon name={toolInfo.icon} size={24} color="#0c4a6e" strokeWidth={2} />
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#0c4a6e'
            }}>
              {toolInfo.title}
            </h3>
            {isDrawing && (
              <span style={{
                background: '#22c55e',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                DRAWING
              </span>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              How to Use:
            </h4>
            <ol style={{
              margin: 0,
              paddingLeft: '16px',
              color: '#6b7280',
              fontSize: '13px'
            }}>
              {toolInfo.instructions.map((instruction, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Tips:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              color: '#6b7280',
              fontSize: '13px'
            }}>
              {toolInfo.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Grid Settings */}
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Grid Settings
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151'
            }}>
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={toggleSnapToGrid}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              Enable Grid Snap
            </label>
            <p style={{
              margin: '4px 0 0 24px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              Snap cursor to grid points for precise measurements
            </p>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Grid Size: {gridSize}m
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#6b7280',
              marginTop: '2px'
            }}>
              <span>0.5m</span>
              <span>10m</span>
            </div>
          </div>
        </div>

        {/* Current Drawing Info */}
        {isDrawing && currentShape?.points && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#92400e'
            }}>
              Current Drawing
            </h3>
            <div style={{ fontSize: '14px', color: '#78350f' }}>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong>Points:</strong> {currentShape.points.length}
              </p>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong>Type:</strong> {currentShape.type}
              </p>
              {currentShape.points.length >= 2 && (
                <p style={{ margin: '0' }}>
                  <strong>Status:</strong> In progress...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Coordinate Display */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#15803d'
          }}>
            Mouse Coordinates
          </h3>
          <div style={{ fontSize: '14px', color: '#166534' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              Real-time coordinates are displayed in the 3D scene
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Format:</strong> X: [meters], Z: [meters]
            </p>
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              Grid snap: {snapToGrid ? `ON (${gridSize}m)` : 'OFF'}
              <br />
              Units: Meters (m)
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Phase 6: Text Edit Modal */}
      {textEditModalOpen && (
        <TextModal
          isOpen={textEditModalOpen}
          onClose={() => {
            setTextEditModalOpen(false);
            setEditingText(undefined);
          }}
          onSave={handleTextModalSave}
          initialData={editingText}
          mode="edit"
          isLabel={editingText?.type === 'label'}
        />
      )}
    </div>
  );
};

export default PropertiesPanel;