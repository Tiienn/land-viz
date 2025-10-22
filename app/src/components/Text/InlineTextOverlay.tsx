/**
 * InlineTextOverlay - HTML overlay text editor
 *
 * Simple inline text editor that appears as an HTML overlay on the screen.
 * Works in both 2D and 3D modes without any billboard issues.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTextStore } from '../../store/useTextStore';

interface InlineTextOverlayProps {
  position: { x: number; y: number }; // Screen position in pixels
}

export const InlineTextOverlay: React.FC<InlineTextOverlayProps> = ({ position }) => {
  const draftTextContent = useTextStore(state => state.draftTextContent);
  const [content, setContent] = useState(draftTextContent || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateDraftContent = useTextStore(state => state.updateDraftContent);
  const finishInlineEdit = useTextStore(state => state.finishInlineEdit);
  const cancelInlineEdit = useTextStore(state => state.cancelInlineEdit);

  useEffect(() => {
    // Auto-focus on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Update draft content as user types
    updateDraftContent(content);
  }, [content, updateDraftContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelInlineEdit();
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      // Enter without modifiers = confirm/finish
      e.preventDefault();
      e.stopPropagation();
      finishInlineEdit();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter = new line
      e.preventDefault();
      e.stopPropagation();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '\n' + content.substring(end);
      setContent(newContent);
      // Move cursor after the inserted newline
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
    // Note: Shift+Enter also allows new line (default textarea behavior)
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10000,
        pointerEvents: 'auto'
      }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your text..."
        style={{
          fontFamily: 'Nunito Sans',
          fontSize: '18px',
          color: '#000000',
          padding: '12px 16px',
          border: '2px solid #3B82F6',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          minWidth: '300px',
          minHeight: '60px',
          resize: 'both',
          outline: 'none',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 0 4px rgba(59, 130, 246, 0.1)',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          caretColor: '#000000' // Black caret for visibility
        }}
      />
      <div
        style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#6B7280',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <strong>Enter</strong> to confirm • <strong>Ctrl+Enter</strong> for new line • <strong>ESC</strong> to cancel
      </div>
    </div>
  );
};
