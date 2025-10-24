/**
 * InlineTextEditor Component
 *
 * Canva-style inline text editor that appears directly in the 3D scene.
 * Allows immediate typing without modal interruption.
 * Syncs with properties panel for live formatting.
 */

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import type { TextPosition } from '../../types/text';
import { getFontStack } from '../../utils/fontLoader';
import { useAppStore } from '../../store/useAppStore';

interface InlineTextEditorProps {
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

export const InlineTextEditor: React.FC<InlineTextEditorProps> = React.memo(({
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef(initialContent); // Use ref instead of state for immediate updates
  const [isFocused, setIsFocused] = useState(true);
  const savedCursorPosition = useRef<number | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false); // Track if user is actively typing

  // Get view mode to match text rendering
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);

  // Auto-focus ONLY on mount (not on content changes)
  useEffect(() => {
    console.log('[InlineTextEditor] Mount - initialContent:', JSON.stringify(initialContent));
    console.log('[InlineTextEditor] Has newlines:', initialContent.includes('\n'));
    console.log('[InlineTextEditor] Has BR tags:', initialContent.includes('<br>'));

    const focusTextarea = () => {
      if (textareaRef.current) {
        console.log('[InlineTextEditor] Textarea value:', JSON.stringify(textareaRef.current.value));
        console.log('[InlineTextEditor] Textarea defaultValue:', JSON.stringify(textareaRef.current.defaultValue));

        // Force focus
        textareaRef.current.focus();

        // Place cursor at the end ONLY on initial mount
        if (initialContent) {
          const length = initialContent.length;
          textareaRef.current.setSelectionRange(length, length);
        } else {
          textareaRef.current.setSelectionRange(0, 0);
        }
      }
    };

    // Focus immediately on mount
    focusTextarea();

    // Single retry after 100ms
    const timer = setTimeout(focusTextarea, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Handle content changes with debounced store updates to prevent cursor jumping
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;

    // Mark as actively typing to block prop updates
    isTypingRef.current = true;

    // Update ref immediately (no re-render, no cursor jump!)
    contentRef.current = newContent;

    // NO CURSOR POSITION SAVING - let browser handle it naturally
    // The uncontrolled component will maintain cursor position automatically

    // Debounce store updates to avoid triggering parent re-renders while typing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Update store after user stops typing for 150ms
      onContentChange(newContent);
      isTypingRef.current = false;
    }, 150); // 150ms delay - fast enough for live preview, slow enough to avoid cursor jumping
  }, [onContentChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // No useLayoutEffect needed! Uncontrolled component maintains cursor automatically
  // The browser handles cursor position natively without React interference

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      // Clear any pending store updates
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // ESC should CANCEL changes, not finish
      onCancel();
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      // Enter without modifiers = confirm/finish
      e.preventDefault();
      e.stopPropagation();
      // Flush any pending store updates immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        onContentChange(contentRef.current);
      }
      onFinish();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter = new line
      e.preventDefault();
      e.stopPropagation();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = textarea.value;
      const newContent = currentContent.substring(0, start) + '\n' + currentContent.substring(end);

      // Update textarea value directly (uncontrolled)
      textarea.value = newContent;
      contentRef.current = newContent;

      // Move cursor after the inserted newline
      textarea.selectionStart = textarea.selectionEnd = start + 1;

      // Debounce store update
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onContentChange(newContent);
        isTypingRef.current = false;
      }, 150);
    }
    // Note: Shift+Enter also allows new line (default textarea behavior)
  }, [onContentChange, onFinish, onCancel]);

  // Handle blur (finish editing when clicking away)
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Longer delay to prevent premature blur
    setTimeout(() => {
      if (textareaRef.current === document.activeElement) {
        // Still focused, don't blur
        setIsFocused(true);
        return;
      }

      // Flush any pending store updates before finishing
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        onContentChange(contentRef.current);
      }

      if (contentRef.current.trim() === '') {
        onCancel(); // Cancel if empty
      } else {
        onFinish(); // Finish if has content
      }
    }, 300);
  }, [onCancel, onFinish, onContentChange]);

  // Prevent blur when clicking the textarea itself
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Get font stack with fallbacks
  const fontStack = getFontStack(initialFontFamily);

  // Canva-style: Transparent editor that looks like the text itself
  const editorStyle: React.CSSProperties = {
    fontFamily: fontStack,
    fontSize: `${initialFontSize}px`, // Same size as original text
    color: initialColor,
    textAlign: initialAlignment,
    letterSpacing: `${initialLetterSpacing / 100}em`,
    lineHeight: initialLineHeight,
    margin: 0,
    padding: 0, // No padding - looks like text
    border: 'none', // No border - invisible
    borderRadius: 0,
    backgroundColor: 'transparent', // Transparent - blend with canvas
    minWidth: 'auto',
    minHeight: 'auto',
    maxWidth: is2DMode ? 'none' : '400px', // No width constraint in 2D
    resize: 'none' as const,
    outline: 'none', // No outline
    boxShadow: 'none', // No shadow
    cursor: 'text',
    whiteSpace: 'pre-wrap' as const, // Always allow multi-line editing
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    wordBreak: 'break-word' as const,
    caretColor: '#000000' // Black caret for visibility
  };

  // CRITICAL: Match TextObject rotation behavior EXACTLY
  // TextObject in 2D mode: NO rotation applied (line 60-111 in TextObject.tsx)
  // TextObject in 3D mode: rotation via Html style (line 124)
  const containerStyle: React.CSSProperties = is2DMode
    ? { pointerEvents: 'auto' as const }
    : {
        transform: `rotate(${initialRotation}deg)`,
        pointerEvents: 'auto' as const
      };

  // In 2D mode: NO rotation (match TextObject behavior)
  // In 3D mode: rotation already applied at Html level
  const outerDivStyle: React.CSSProperties = {
    position: 'relative',
    pointerEvents: 'auto'
  };

  return (
    <Html
      position={[position.x, position.y, position.z]}
      center={is2DMode} // CRITICAL: Center in 2D mode to match TextObject
      transform={!is2DMode} // Billboard in 3D mode only
      sprite={!is2DMode} // Sprite effect in 3D mode only
      occlude={false}
      zIndexRange={is2DMode ? [100, 0] : [10, 0]} // Match TextObject z-index
      distanceFactor={is2DMode ? 2.5 : 20} // Match TextObject scale exactly
      style={containerStyle}
    >
      <style>{`
        /* Make caret thick and visible */
        textarea {
          caret-color: #000000;
        }

        /* Force caret visibility */
        textarea:focus {
          caret-color: #000000 !important;
        }
      `}</style>
      <div style={outerDivStyle}>
        <textarea
          ref={textareaRef}
          defaultValue={initialContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onClick={(e) => {
            e.stopPropagation();
            // Ensure focus when clicking (but don't move cursor)
            if (textareaRef.current && document.activeElement !== textareaRef.current) {
              textareaRef.current.focus();
            }
          }}
          placeholder=""
          style={editorStyle}
          rows={1}
          autoFocus
          tabIndex={0}
          spellCheck={false}
        />
      </div>
    </Html>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders during active editing
  // Only re-render if position, textId, or formatting props change significantly
  // DO NOT re-render when parent updates due to store changes (which would reset cursor)

  // Always re-render if textId changes (editing different text)
  if (prevProps.textId !== nextProps.textId) {
    return false;
  }

  // Always re-render if position changes significantly (text moved)
  const posChanged =
    Math.abs(prevProps.position.x - nextProps.position.x) > 0.01 ||
    Math.abs(prevProps.position.y - nextProps.position.y) > 0.01 ||
    Math.abs(prevProps.position.z - nextProps.position.z) > 0.01;
  if (posChanged) {
    return false;
  }

  // Allow formatting updates (font, size, color, alignment) to pass through
  // These come from Properties Panel and should update immediately
  if (prevProps.initialFontFamily !== nextProps.initialFontFamily) {
    return false;
  }
  if (prevProps.initialFontSize !== nextProps.initialFontSize) {
    return false;
  }
  if (prevProps.initialColor !== nextProps.initialColor) {
    return false;
  }
  if (prevProps.initialAlignment !== nextProps.initialAlignment) {
    return false;
  }
  if (prevProps.initialLetterSpacing !== nextProps.initialLetterSpacing) {
    return false;
  }
  if (prevProps.initialLineHeight !== nextProps.initialLineHeight) {
    return false;
  }
  if (prevProps.initialRotation !== nextProps.initialRotation) {
    return false;
  }

  // CRITICAL: Block re-renders when only initialContent changes
  // This happens when store updates due to our own typing, which would reset cursor
  // The component manages its own content state, so we don't need prop updates

  return true; // Props are "equal" - prevent re-render
});
