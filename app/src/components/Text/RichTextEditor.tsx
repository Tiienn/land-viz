/**
 * RichTextEditor Component
 *
 * Inline rich text editor with support for partial formatting (bold, italic, underline, uppercase).
 * Uses the same pattern as TextPropertiesPanel for consistent behavior.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import type { TextPosition } from '../../types/text';
import { getFontStack } from '../../utils/fontLoader';
import { useAppStore } from '../../store/useAppStore';
import { useTextStore } from '../../store/useTextStore';

interface RichTextEditorProps {
  position: TextPosition;
  textId: string;
  initialContent?: string;
  initialFontFamily?: string;
  initialFontSize?: number;
  initialColor?: string;
  initialAlignment?: 'left' | 'center' | 'right';
  initialLetterSpacing?: number;
  initialLineHeight?: number;
  initialRotation?: number;
  onContentChange: (content: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = React.memo(({
  position,
  textId,
  initialContent = '',
  initialFontFamily = 'Nunito Sans',
  initialFontSize = 16,
  initialColor = '#000000',
  initialAlignment = 'center',
  initialLetterSpacing = 0,
  initialLineHeight = 1.4,
  initialRotation = 0,
  onContentChange,
  onFinish,
  onCancel
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get view mode
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);

  // Get text store for direct updates (same as TextPropertiesPanel)
  const updateText = useTextStore(state => state.updateText);

  // Save and restore cursor position (copied from TextPropertiesPanel)
  const saveCursorPosition = useCallback(() => {
    if (!editorRef.current) return null;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  }, []);

  const restoreCursorPosition = useCallback((position: number | null) => {
    if (!editorRef.current || position === null) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let charCount = 0;
    let nodeStack: Node[] = [editorRef.current];
    let node: Node | undefined;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextCharCount = charCount + (node.textContent?.length || 0);
        if (position >= charCount && position <= nextCharCount) {
          range.setStart(node, position - charCount);
          range.setEnd(node, position - charCount);
          foundStart = true;
        }
        charCount = nextCharCount;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    if (foundStart) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);

  // Auto-focus on mount and mark as initialized
  useEffect(() => {
    if (!editorRef.current) return;

    setHasInitialized(true);

    // Focus and set cursor at end
    editorRef.current.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    if (editorRef.current.childNodes.length > 0) {
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  // Sync content when it changes externally (e.g., from Properties Panel formatting)
  // Note: Cursor restoration is handled by applyFormatting in TextPropertiesPanel
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    // Skip if not initialized yet (will use dangerouslySetInnerHTML on first render)
    if (!hasInitialized) {
      return;
    }

    // CRITICAL: Don't sync if user is actively editing (element has focus)
    // This prevents destroying the cursor position that applyFormatting just restored
    if (document.activeElement === editorRef.current) {
      return;
    }

    // Only update if content actually changed and is different from current DOM
    if (editorRef.current.innerHTML !== initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent, hasInitialized]);

  // Handle content changes - SAME AS TextPropertiesPanel
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!textId) return;

    // Save cursor position before update
    const cursorPos = saveCursorPosition();

    // Update content directly in store (no debounce)
    const newContent = e.currentTarget.innerHTML;
    updateText(textId, { content: newContent });
    onContentChange(newContent);

    // Restore cursor position after React re-renders
    requestAnimationFrame(() => {
      restoreCursorPosition(cursorPos);
    });
  }, [textId, updateText, onContentChange, saveCursorPosition, restoreCursorPosition]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onFinish();
    }
    // Ctrl+Enter and Shift+Enter allow new lines (default behavior)
  }, [onFinish, onCancel]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (editorRef.current === document.activeElement) {
        return;
      }

      const text = editorRef.current?.textContent || '';
      if (text.trim() === '') {
        onCancel();
      } else {
        onFinish();
      }
    }, 300);
  }, [onCancel, onFinish]);

  // Get font stack
  const fontStack = getFontStack(initialFontFamily);

  const editorStyle: React.CSSProperties = {
    fontFamily: fontStack,
    fontSize: `${initialFontSize}px`,
    color: initialColor,
    textAlign: initialAlignment,
    letterSpacing: `${initialLetterSpacing / 100}em`,
    lineHeight: initialLineHeight,
    margin: 0,
    padding: 0,
    border: 'none',
    borderRadius: 0,
    backgroundColor: 'transparent',
    minWidth: 'auto',
    minHeight: 'auto',
    maxWidth: is2DMode ? 'none' : '400px',
    outline: 'none',
    boxShadow: 'none',
    cursor: 'text',
    whiteSpace: is2DMode ? 'nowrap' as const : 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    wordBreak: 'break-word' as const,
    caretColor: '#000000'
  };

  const containerStyle: React.CSSProperties = is2DMode
    ? { pointerEvents: 'auto' as const }
    : {
        transform: `rotate(${initialRotation}deg)`,
        pointerEvents: 'auto' as const
      };

  return (
    <Html
      position={[position.x, position.y, position.z]}
      center={is2DMode}
      transform={!is2DMode}
      sprite={!is2DMode}
      occlude={false}
      zIndexRange={is2DMode ? [100, 0] : [10, 0]}
      distanceFactor={is2DMode ? 2.5 : 20}
      style={containerStyle}
    >
      <div style={{ position: 'relative', pointerEvents: 'auto' }}>
        <div
          key={editorKey}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          {...(!hasInitialized && { dangerouslySetInnerHTML: { __html: initialContent } })}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          style={editorStyle}
          spellCheck={false}
        />
      </div>
    </Html>
  );
}, (prevProps, nextProps) => {
  if (prevProps.textId !== nextProps.textId) return false;

  // NOTE: We DON'T check initialContent here because we handle it manually in useEffect
  // This prevents unnecessary re-renders that would destroy the cursor position

  const posChanged =
    Math.abs(prevProps.position.x - nextProps.position.x) > 0.01 ||
    Math.abs(prevProps.position.y - nextProps.position.y) > 0.01 ||
    Math.abs(prevProps.position.z - nextProps.position.z) > 0.01;
  if (posChanged) return false;

  if (prevProps.initialFontFamily !== nextProps.initialFontFamily) return false;
  if (prevProps.initialFontSize !== nextProps.initialFontSize) return false;
  if (prevProps.initialColor !== nextProps.initialColor) return false;
  if (prevProps.initialAlignment !== nextProps.initialAlignment) return false;
  if (prevProps.initialLetterSpacing !== nextProps.initialLetterSpacing) return false;
  if (prevProps.initialLineHeight !== nextProps.initialLineHeight) return false;
  if (prevProps.initialRotation !== nextProps.initialRotation) return false;

  return true;
});

RichTextEditor.displayName = 'RichTextEditor';
