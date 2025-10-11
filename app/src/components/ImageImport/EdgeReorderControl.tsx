/**
 * EdgeReorderControl Component
 *
 * Allows users to reassign edge labels when auto-detection is incorrect.
 * Features:
 * - Dropdown for each edge to select its label (Edge 1, Edge 2, etc.)
 * - Duplicate label detection with warnings
 * - Auto-adjustment of dimension values when labels change
 * - Visual feedback for selected edge
 * - Integration with EdgePreview for click-to-select
 *
 * @example
 * <EdgeReorderControl
 *   edgeCount={4}
 *   currentMapping={{ 0: 0, 1: 1, 2: 2, 3: 3 }}
 *   onMappingChange={(mapping) => console.log('New mapping:', mapping)}
 *   selectedEdgeIndex={0}
 *   onSelectEdge={(index) => setSelectedEdge(index)}
 * />
 */

import React, { useState, useEffect } from 'react';
import { useImportStore } from '../../store/useImportStore';

export interface EdgeMapping {
  [visualIndex: number]: number; // visualIndex -> logicalLabel
}

export interface EdgeReorderControlProps {
  /** Number of edges detected in the boundary */
  edgeCount: number;
  /** Current edge label mapping (visual index -> logical label) */
  currentMapping: EdgeMapping;
  /** Callback when mapping changes */
  onMappingChange: (mapping: EdgeMapping) => void;
  /** Currently selected edge index (for highlighting) */
  selectedEdgeIndex: number;
  /** Callback when edge is selected */
  onSelectEdge: (index: number) => void;
}

export const EdgeReorderControl: React.FC<EdgeReorderControlProps> = ({
  edgeCount,
  currentMapping,
  onMappingChange,
  selectedEdgeIndex,
  onSelectEdge,
}) => {
  const dimensions = useImportStore((state) => state.dimensions);
  const setDimension = useImportStore((state) => state.setDimension);

  const [localMapping, setLocalMapping] = useState<EdgeMapping>(currentMapping);
  const [duplicates, setDuplicates] = useState<number[]>([]);

  // Initialize local mapping
  useEffect(() => {
    setLocalMapping(currentMapping);
  }, [currentMapping]);

  // Detect duplicate labels
  useEffect(() => {
    const labelCounts: Record<number, number> = {};
    Object.values(localMapping).forEach((label) => {
      labelCounts[label] = (labelCounts[label] || 0) + 1;
    });

    const duplicateLabels = Object.entries(labelCounts)
      .filter(([, count]) => count > 1)
      .map(([label]) => parseInt(label));

    setDuplicates(duplicateLabels);
  }, [localMapping]);

  /**
   * Handle edge label change
   * Auto-adjusts dimension values based on new mapping
   */
  const handleLabelChange = (visualIndex: number, newLabel: number) => {
    const oldLabel = localMapping[visualIndex];

    // Create new mapping
    const newMapping = { ...localMapping };
    newMapping[visualIndex] = newLabel;

    // Update local state
    setLocalMapping(newMapping);

    // Swap dimension values if needed
    if (oldLabel !== newLabel) {
      // Find which visual index currently has the new label
      const swapIndex = Object.entries(localMapping).find(
        ([, label]) => label === newLabel
      )?.[0];

      if (swapIndex !== undefined) {
        const swapIndexNum = parseInt(swapIndex);

        // Swap the dimension values
        const temp = { ...dimensions[visualIndex] };
        setDimension(visualIndex, {
          ...dimensions[swapIndexNum],
          edgeIndex: visualIndex,
        });
        setDimension(swapIndexNum, {
          ...temp,
          edgeIndex: swapIndexNum,
        });

        // Update mapping for the swapped edge
        newMapping[swapIndexNum] = oldLabel;
      }
    }

    // Notify parent
    onMappingChange(newMapping);
  };

  /**
   * Reset to default sequential mapping
   */
  const handleReset = () => {
    const defaultMapping: EdgeMapping = {};
    for (let i = 0; i < edgeCount; i++) {
      defaultMapping[i] = i;
    }
    setLocalMapping(defaultMapping);
    onMappingChange(defaultMapping);
  };

  const hasDuplicates = duplicates.length > 0;

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#1F2937',
              marginBottom: '4px',
            }}
          >
            Edge Label Assignment
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Click on the preview or use dropdowns to reassign edge labels
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            color: '#3B82F6',
            backgroundColor: 'white',
            border: '1px solid #3B82F6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EFF6FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          Reset to Default
        </button>
      </div>

      {/* Duplicate Warning */}
      {hasDuplicates && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '6px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#92400E',
                  marginBottom: '2px',
                }}
              >
                Duplicate Labels Detected
              </div>
              <div style={{ fontSize: '12px', color: '#92400E' }}>
                Multiple edges are assigned the same label:{' '}
                {duplicates.map((label) => `Edge ${label + 1}`).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edge Label Dropdowns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {Array.from({ length: edgeCount }).map((_, visualIndex) => {
          const currentLabel = localMapping[visualIndex];
          const isSelected = visualIndex === selectedEdgeIndex;
          const isDuplicate = duplicates.includes(currentLabel);

          return (
            <div
              key={visualIndex}
              onClick={() => onSelectEdge(visualIndex)}
              style={{
                padding: '12px',
                backgroundColor: isSelected ? '#EFF6FF' : 'white',
                border: `2px solid ${
                  isDuplicate
                    ? '#F59E0B'
                    : isSelected
                    ? '#3B82F6'
                    : '#E5E7EB'
                }`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = isDuplicate
                    ? '#F59E0B'
                    : '#E5E7EB';
                }
              }}
            >
              {/* Visual Index Label */}
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Position {visualIndex + 1}
              </div>

              {/* Dropdown */}
              <select
                value={currentLabel}
                onChange={(e) => {
                  e.stopPropagation();
                  handleLabelChange(visualIndex, parseInt(e.target.value));
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1F2937',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {Array.from({ length: edgeCount }).map((_, label) => (
                  <option key={label} value={label}>
                    Edge {label + 1}
                  </option>
                ))}
              </select>

              {/* Current Dimension Value */}
              {dimensions[visualIndex] && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6B7280',
                  }}
                >
                  {dimensions[visualIndex].value > 0
                    ? `${dimensions[visualIndex].value} ${dimensions[visualIndex].unit}`
                    : 'Not entered'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div
        style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#6B7280',
          lineHeight: '1.5',
        }}
      >
        <strong style={{ color: '#1F2937' }}>💡 Tip:</strong> If the edge
        labels don't match your site plan, use the dropdowns to reassign them.
        When you change a label, the dimension values will automatically swap to
        maintain consistency.
      </div>
    </div>
  );
};
