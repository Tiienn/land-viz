/**
 * TextFormattingControls Component
 *
 * Compact formatting controls that appear in properties panel during inline text editing.
 * Provides live formatting updates in Canva style.
 */

import React, { useCallback } from 'react';
import { useTextStore } from '../../store/useTextStore';
import { getAvailableFonts } from '../../utils/textUtils';

export const TextFormattingControls: React.FC = () => {
  const isInlineEditing = useTextStore(state => state.isInlineEditing);
  const inlineEditingTextId = useTextStore(state => state.inlineEditingTextId);
  const texts = useTextStore(state => state.texts);
  const updateText = useTextStore(state => state.updateText);

  // Get the text being edited
  const editingText = React.useMemo(() => {
    return inlineEditingTextId ? texts.find(t => t.id === inlineEditingTextId) : undefined;
  }, [inlineEditingTextId, texts]);

  const handleFontChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (inlineEditingTextId) {
      updateText(inlineEditingTextId, { fontFamily: e.target.value });
    }
  }, [inlineEditingTextId, updateText]);

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (inlineEditingTextId) {
      const size = parseInt(e.target.value, 10);
      if (!isNaN(size) && size >= 8 && size <= 72) {
        updateText(inlineEditingTextId, { fontSize: size });
      }
    }
  }, [inlineEditingTextId, updateText]);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (inlineEditingTextId) {
      updateText(inlineEditingTextId, { color: e.target.value });
    }
  }, [inlineEditingTextId, updateText]);

  const handleAlignmentChange = useCallback((alignment: 'left' | 'center' | 'right') => {
    if (inlineEditingTextId) {
      updateText(inlineEditingTextId, { alignment });
    }
  }, [inlineEditingTextId, updateText]);

  if (!isInlineEditing || !editingText) {
    return null;
  }

  const fonts = getAvailableFonts();

  return (
    <div
      style={{
        padding: '16px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB'
      }}
    >
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Text Properties
      </div>
    </div>
  );
};
