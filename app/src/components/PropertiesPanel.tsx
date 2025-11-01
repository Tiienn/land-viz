import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTextStore } from '@/store/useTextStore';
import { TextPropertiesPanel } from './Text/TextPropertiesPanel';
import { TextFormattingControls } from './Text/TextFormattingControls';
import { TextModal } from './Text/TextModal';
import Icon from './Icon';
import { tokens } from '@/styles/tokens';
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
        padding: `${tokens.spacing[4]} ${tokens.spacing[5]}`,
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        backgroundColor: tokens.colors.neutral[50],
        flexShrink: 0
      }}>
        <h3 style={{
          margin: 0,
          fontSize: tokens.typography.body.size,
          fontWeight: tokens.typography.h1.weight,
          color: tokens.colors.neutral[700],
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[2]
        }}>
          Properties
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: tokens.typography.h1.size,
            cursor: 'pointer',
            color: tokens.colors.neutral[500],
            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
            borderRadius: tokens.radius.sm,
            transition: `all ${tokens.animation.timing.smooth} ease`,
            lineHeight: 1,
            fontWeight: 300
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = tokens.colors.neutral[100];
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
              background: `${tokens.colors.semantic.info}10`, // 10% opacity
              border: `1px solid ${tokens.colors.semantic.info}`,
              borderRadius: tokens.radius.md,
              padding: tokens.spacing[4],
              marginBottom: tokens.spacing[5]
            }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing[2],
            marginBottom: tokens.spacing[3]
          }}>
            <Icon name={toolInfo.icon} size={24} color={tokens.colors.semantic.info} strokeWidth={2} />
            <h3 style={{
              margin: 0,
              fontSize: tokens.typography.h3.size,
              fontWeight: tokens.typography.h3.weight,
              color: tokens.colors.semantic.info
            }}>
              {toolInfo.title}
            </h3>
            {isDrawing && (
              <span style={{
                background: tokens.colors.semantic.success,
                color: 'white',
                padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                borderRadius: tokens.radius.sm,
                fontSize: tokens.typography.caption.size,
                fontWeight: tokens.typography.label.weight
              }}>
                DRAWING
              </span>
            )}
          </div>

          <div style={{ marginBottom: tokens.spacing[4] }}>
            <h4 style={{
              margin: `0 0 ${tokens.spacing[2]} 0`,
              fontSize: tokens.typography.body.size,
              fontWeight: tokens.typography.h3.weight,
              color: tokens.colors.neutral[700]
            }}>
              How to Use:
            </h4>
            <ol style={{
              margin: 0,
              paddingLeft: tokens.spacing[4],
              color: tokens.colors.neutral[500],
              fontSize: tokens.typography.bodySmall.size
            }}>
              {toolInfo.instructions.map((instruction, index) => (
                <li key={index} style={{ marginBottom: tokens.spacing[1] }}>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 style={{
              margin: `0 0 ${tokens.spacing[2]} 0`,
              fontSize: tokens.typography.body.size,
              fontWeight: tokens.typography.h3.weight,
              color: tokens.colors.neutral[700]
            }}>
              Tips:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: tokens.spacing[4],
              color: tokens.colors.neutral[500],
              fontSize: tokens.typography.bodySmall.size
            }}>
              {toolInfo.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: tokens.spacing[1] }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Grid Settings */}
        <div style={{
          background: tokens.colors.neutral[50],
          border: `1px solid ${tokens.colors.neutral[200]}`,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing[4],
          marginBottom: tokens.spacing[5]
        }}>
          <h3 style={{
            margin: `0 0 ${tokens.spacing[3]} 0`,
            fontSize: tokens.typography.body.size,
            fontWeight: tokens.typography.h3.weight,
            color: tokens.colors.neutral[900]
          }}>
            Grid Settings
          </h3>

          <div style={{ marginBottom: tokens.spacing[3] }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[2],
              cursor: 'pointer',
              fontSize: tokens.typography.body.size,
              color: tokens.colors.neutral[700]
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
              margin: `${tokens.spacing[1]} 0 0 ${tokens.spacing[6]}`,
              fontSize: tokens.typography.bodySmall.size,
              color: tokens.colors.neutral[500]
            }}>
              Snap cursor to grid points for precise measurements
            </p>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: tokens.typography.body.size,
              fontWeight: tokens.typography.label.weight,
              color: tokens.colors.neutral[700],
              marginBottom: tokens.spacing[1]
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
              fontSize: tokens.typography.caption.size,
              color: tokens.colors.neutral[500],
              marginTop: tokens.spacing[1]
            }}>
              <span>0.5m</span>
              <span>10m</span>
            </div>
          </div>
        </div>

        {/* Current Drawing Info */}
        {isDrawing && currentShape?.points && (
          <div style={{
            background: `${tokens.colors.semantic.warning}20`, // 20% opacity
            border: `1px solid ${tokens.colors.semantic.warning}`,
            borderRadius: tokens.radius.md,
            padding: tokens.spacing[4],
            marginBottom: tokens.spacing[5]
          }}>
            <h3 style={{
              margin: `0 0 ${tokens.spacing[3]} 0`,
              fontSize: tokens.typography.body.size,
              fontWeight: tokens.typography.h3.weight,
              color: tokens.colors.semantic.warning
            }}>
              Current Drawing
            </h3>
            <div style={{ fontSize: tokens.typography.body.size, color: tokens.colors.semantic.warning }}>
              <p style={{ margin: `0 0 ${tokens.spacing[1]} 0` }}>
                <strong>Points:</strong> {currentShape.points.length}
              </p>
              <p style={{ margin: `0 0 ${tokens.spacing[1]} 0` }}>
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
          background: `${tokens.colors.semantic.success}10`, // 10% opacity
          border: `1px solid ${tokens.colors.semantic.success}`,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing[4]
        }}>
          <h3 style={{
            margin: `0 0 ${tokens.spacing[3]} 0`,
            fontSize: tokens.typography.body.size,
            fontWeight: tokens.typography.h3.weight,
            color: tokens.colors.semantic.success
          }}>
            Mouse Coordinates
          </h3>
          <div style={{ fontSize: tokens.typography.body.size, color: tokens.colors.semantic.success }}>
            <p style={{ margin: `0 0 ${tokens.spacing[1]} 0` }}>
              Real-time coordinates are displayed in the 3D scene
            </p>
            <p style={{ margin: `0 0 ${tokens.spacing[2]} 0` }}>
              <strong>Format:</strong> X: [meters], Z: [meters]
            </p>
            <div style={{
              background: `${tokens.colors.semantic.success}20`, // 20% opacity
              padding: tokens.spacing[2],
              borderRadius: tokens.radius.sm,
              fontSize: tokens.typography.bodySmall.size,
              fontFamily: tokens.typography.fontFamily.mono
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