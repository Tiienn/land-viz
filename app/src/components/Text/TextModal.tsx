/**
 * Text Modal Component
 *
 * Modal dialog for creating and editing text objects.
 * Supports both floating text and shape labels.
 */

import React, { useEffect, useState } from 'react';
import type { TextObject } from '../../types/text';

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (textData: Partial<TextObject>) => void;
  initialData?: TextObject;
  mode: 'create' | 'edit';
  isLabel?: boolean;
}

export const TextModal: React.FC<TextModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
  isLabel = false
}) => {
  const [content, setContent] = useState('');
  const [fontFamily, setFontFamily] = useState(initialData?.fontFamily || 'Nunito Sans');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 18);
  const [color, setColor] = useState(initialData?.color || '#000000');
  const [alignment, setAlignment] = useState(initialData?.alignment || 'center');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset state when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setContent(initialData?.content || '');
      setFontFamily(initialData?.fontFamily || 'Nunito Sans');
      setFontSize(initialData?.fontSize || 18);
      setColor(initialData?.color || '#000000');
      setAlignment(initialData?.alignment || 'center');
      setShowAdvanced(false);

      // Auto-focus the textarea after a short delay to ensure modal is rendered
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder="Enter text here..."]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }
  }, [isOpen, initialData]);

  // Advanced options
  const [letterSpacing, setLetterSpacing] = useState(initialData?.letterSpacing || 0);
  const [lineHeight, setLineHeight] = useState(initialData?.lineHeight || 1.5);
  const [hasBackground, setHasBackground] = useState(!!initialData?.backgroundColor);
  const [backgroundColor, setBackgroundColor] = useState(initialData?.backgroundColor || '#FFFFFF');
  const [backgroundOpacity, setBackgroundOpacity] = useState(initialData?.backgroundOpacity || 100);
  const [rotation, setRotation] = useState(initialData?.rotation || 0);

  // Apply data-modal-open pattern
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-modal-open');
    }
    return () => document.body.removeAttribute('data-modal-open');
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Validation
    if (content.length === 0 || content.length > 500) return;

    const textData: Partial<TextObject> = {
      content,
      fontFamily,
      fontSize,
      color,
      alignment,
      letterSpacing,
      lineHeight,
      backgroundColor: hasBackground ? backgroundColor : undefined,
      backgroundOpacity,
      rotation
    };

    onSave(textData);
    onClose();
  };

  const title = mode === 'create'
    ? (isLabel ? 'Add Label to Shape' : 'Add Text')
    : 'Edit Text';
  const buttonText = mode === 'create' ? 'Add Text' : 'Update Text';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 200ms ease-out'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        width: '450px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              color: '#6B7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Text Content */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
            Text Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter text here..."
            maxLength={500}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              borderRadius: '8px',
              border: `2px solid ${content.length === 0 ? '#EF4444' : '#E5E7EB'}`,
              fontSize: '14px',
              fontFamily: 'Nunito Sans',
              resize: 'vertical'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '12px',
            color: content.length > 450 ? '#F59E0B' : '#6B7280'
          }}>
            <span>{content.length === 0 ? 'Text cannot be empty' : ''}</span>
            <span>{content.length} / 500</span>
          </div>
        </div>

        {/* Font Family */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
            Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #E5E7EB',
              fontSize: '14px',
              fontFamily: fontFamily
            }}
          >
            <option value="Nunito Sans" style={{ fontFamily: 'Nunito Sans' }}>Nunito Sans</option>
            <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
            <option value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
            <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
            <option value="Lato" style={{ fontFamily: 'Lato' }}>Lato</option>
            <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
          </select>
        </div>

        {/* Font Size */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
            Font Size
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: '70px',
                padding: '8px',
                borderRadius: '6px',
                border: '2px solid #E5E7EB',
                fontSize: '14px'
              }}
            />
            <span style={{ fontSize: '14px', color: '#6B7280' }}>px</span>
          </div>
        </div>

        {/* Text Color */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
            Text Color
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: '50px',
                height: '40px',
                borderRadius: '6px',
                border: '2px solid #E5E7EB',
                cursor: 'pointer'
              }}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: '2px solid #E5E7EB',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </div>
        </div>

        {/* Advanced Section */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            <span>{showAdvanced ? '▼' : '▶'} Advanced</span>
          </button>

          {showAdvanced && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB'
            }}>
              {/* Letter Spacing */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                  Letter Spacing: {letterSpacing}
                </label>
                <input
                  type="range"
                  min="-50"
                  max="200"
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Line Height */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                  Line Height: {lineHeight}
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="3.0"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Background Color */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={hasBackground}
                    onChange={(e) => setHasBackground(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label style={{ fontWeight: 500, fontSize: '14px' }}>Background Color</label>
                </div>
                {hasBackground && (
                  <>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        style={{
                          width: '50px',
                          height: '40px',
                          borderRadius: '6px',
                          border: '2px solid #E5E7EB',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '6px',
                          border: '2px solid #E5E7EB',
                          fontSize: '14px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                        Opacity: {backgroundOpacity}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={backgroundOpacity}
                        onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Rotation */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Alignment */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
            Alignment
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => setAlignment(align)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: `2px solid ${alignment === align ? '#3B82F6' : '#E5E7EB'}`,
                  backgroundColor: alignment === align ? '#EFF6FF' : '#FFFFFF',
                  color: alignment === align ? '#3B82F6' : '#6B7280',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {align[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '2px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={content.length === 0 || content.length > 500}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: content.length === 0 || content.length > 500
                ? '#E5E7EB'
                : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: '#FFFFFF',
              fontWeight: 500,
              cursor: content.length === 0 || content.length > 500 ? 'not-allowed' : 'pointer',
              opacity: content.length === 0 || content.length > 500 ? 0.5 : 1
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
