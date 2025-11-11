import React, { useRef, useEffect, KeyboardEvent } from 'react';

export interface DistanceInputProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
  isMultiSegment?: boolean;
  segmentCount?: number;
  onEnableMultiSegment?: () => void;
  onCompleteMultiSegment?: () => void;
  onUndoLastSegment?: () => void;
}

export const DistanceInput: React.FC<DistanceInputProps> = ({
  value,
  onChange,
  onConfirm,
  onCancel,
  visible,
  isMultiSegment = false,
  segmentCount = 0,
  onEnableMultiSegment,
  onCompleteMultiSegment,
  onUndoLastSegment
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [visible]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      // Spacebar always confirms the current segment/distance
      onConfirm();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isMultiSegment && onCompleteMultiSegment) {
        // In multi-segment mode, Enter completes the entire drawing
        onCompleteMultiSegment();
      } else {
        // In single mode, Enter confirms the distance
        onConfirm();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab' && !isMultiSegment) {
      e.preventDefault();
      if (onEnableMultiSegment) {
        onEnableMultiSegment();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      // Ctrl+Z: Undo last segment in multi-line mode
      if (isMultiSegment && segmentCount > 0 && onUndoLastSegment) {
        onUndoLastSegment();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow numbers, decimal points, and empty string
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '220px', // Right next to mouse position box with extra spacing
        bottom: '80px', // Same as mouse position box
        background: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 15000, // Above inline panels (10000)
        fontFamily: 'Nunito Sans, sans-serif',
        minWidth: '120px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Distance (m)"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: '14px',
          fontFamily: 'Nunito Sans, sans-serif',
          width: '80px',
          textAlign: 'center',
          color: '#1f2937',
          fontWeight: '500',
        }}
      />
      {/* Mode indicator */}
      {isMultiSegment && (
        <div style={{
          fontSize: '10px',
          color: '#3b82f6',
          textAlign: 'center',
          marginTop: '2px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Multi-Line Mode {segmentCount > 0 && `• Segment ${segmentCount + 1}`}
        </div>
      )}

      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center',
        marginTop: '4px',
        whiteSpace: 'nowrap',
      }}>
        {isMultiSegment
          ? 'Space for next segment • Enter to complete • Ctrl+Z to undo • ESC to cancel'
          : 'Space to confirm • Tab for multi-line • ESC to cancel'
        }
      </div>

      {/* Keyboard shortcuts help */}
      {!isMultiSegment && (
        <div style={{
          fontSize: '10px',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: '2px',
        }}>
          Press Tab for multi-line mode
        </div>
      )}
    </div>
  );
};