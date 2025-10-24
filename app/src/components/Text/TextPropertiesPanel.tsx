/**
 * TextPropertiesPanel Component
 *
 * Phase 6: Properties panel section for editing selected text objects.
 * Shows text properties and provides quick edit button to open full modal.
 */

import React, { useCallback, useState, useRef } from 'react';
import { useTextStore } from '../../store/useTextStore';
import Icon from '../Icon';
import type { TextObject } from '../../types/text';

interface TextPropertiesPanelProps {
  onEditClick?: (text: TextObject) => void;
}

export const TextPropertiesPanel: React.FC<TextPropertiesPanelProps> = ({ onEditClick }) => {
  const selectedTextId = useTextStore(state => state.selectedTextId);
  // IMPORTANT: Subscribe to texts array directly, not via getSelectedText()
  // This ensures re-renders when text content changes
  const selectedText = useTextStore(state =>
    state.selectedTextId ? state.texts.find(t => t.id === state.selectedTextId) : undefined
  );
  const updateText = useTextStore(state => state.updateText);
  const deleteText = useTextStore(state => state.deleteText);
  const selectText = useTextStore(state => state.selectText);

  // Get inline editing state
  const isInlineEditing = useTextStore(state => state.isInlineEditing);
  const finishInlineEdit = useTextStore(state => state.finishInlineEdit);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const [editorKey, setEditorKey] = useState(0);
  const isEditingRef = useRef(false); // Track if user is actively typing
  const lastContentRef = useRef<string>(''); // Track last content to prevent unnecessary updates

  // Initialize content on mount and when text selection changes
  React.useEffect(() => {
    if (editableRef.current && selectedText) {
      editableRef.current.innerHTML = selectedText.content;
      lastContentRef.current = selectedText.content;
    }
  }, [selectedTextId]); // Only run when text selection changes, not content

  // Sync external content changes (from canvas editing) to the textarea
  // But ONLY when user is not actively typing in the textarea
  React.useEffect(() => {
    if (!isEditingRef.current && editableRef.current && selectedText) {
      // Only update if content is different from what we last set
      if (selectedText.content !== lastContentRef.current) {
        editableRef.current.innerHTML = selectedText.content;
        lastContentRef.current = selectedText.content;
      }
    }
  }, [selectedText?.content]);

  // Save and restore cursor position
  const saveCursorPosition = useCallback(() => {
    if (!editableRef.current) return null;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  }, []);

  const restoreCursorPosition = useCallback((position: number | null) => {
    if (!editableRef.current || position === null) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let charCount = 0;
    let nodeStack: Node[] = [editableRef.current];
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

  const handleEditClick = useCallback(() => {
    if (selectedText && onEditClick) {
      onEditClick(selectedText);
    }
  }, [selectedText, onEditClick]);

  const handleDelete = useCallback(() => {
    if (selectedTextId) {
      deleteText(selectedTextId);
      selectText(null);
    }
  }, [selectedTextId, deleteText, selectText]);

  const handleLockToggle = useCallback(() => {
    if (selectedTextId && selectedText) {
      updateText(selectedTextId, { locked: !selectedText.locked });
    }
  }, [selectedTextId, selectedText, updateText]);

  const handleVisibilityToggle = useCallback(() => {
    if (selectedTextId && selectedText) {
      updateText(selectedTextId, { visible: !selectedText.visible });
    }
  }, [selectedTextId, selectedText, updateText]);

  // Generic cursor position save/restore for any contentEditable element
  const saveCursorPositionFor = useCallback((element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  }, []);

  const restoreCursorPositionFor = useCallback((element: HTMLElement, position: number | null) => {
    if (!element || position === null) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    let charCount = 0;
    let nodeStack: Node[] = [element];
    let node: Node | undefined;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextCharCount = charCount + (node.textContent?.length || 0);

        if (position >= charCount && position <= nextCharCount) {
          const offset = position - charCount;
          range.setStart(node, offset);
          range.setEnd(node, offset);
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

  // Format selected text with HTML tags (or entire text if nothing selected)
  const applyFormatting = useCallback((format: 'bold' | 'italic' | 'underline' | 'uppercase') => {
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    // Find the target contentEditable element
    let targetElement: HTMLElement | null = null;
    let range: Range;
    let isFullText = false;

    // First, check if there's a selection in a contentEditable element (canvas or panel)
    if (selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      let parentElement = currentRange.commonAncestorContainer.parentElement;

      // Walk up to find contentEditable element
      // CRITICAL: Must find the ACTUAL element with contentEditable="true" attribute, not just isContentEditable
      while (parentElement) {
        // Check if this element has the contentEditable attribute explicitly set (not inherited)
        if (parentElement.getAttribute('contenteditable') === 'true') {
          targetElement = parentElement;
          break;
        }
        parentElement = parentElement.parentElement;
      }
    }

    // If no contentEditable found, use the panel's editableRef
    if (!targetElement && editableRef.current) {
      targetElement = editableRef.current;
    }

    if (!targetElement) {
      return;
    }

    // Save cursor position BEFORE making any DOM changes
    const cursorPos = saveCursorPositionFor(targetElement);

    // Get or create range
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      // No selection - format entire text
      range = document.createRange();
      range.selectNodeContents(targetElement);
      isFullText = true;
    } else {
      range = selection.getRangeAt(0);
    }

    const selectedText = range.toString();

    if (!selectedText) {
      return;
    }

    // Check if selection is already formatted
    const tagMap = {
      bold: 'STRONG',
      italic: 'EM',
      underline: 'U',
      uppercase: 'SPAN'
    };

    const targetTag = tagMap[format];

    // Check if selection is already formatted
    let isAlreadyFormatted = false;
    let formatElement: HTMLElement | null = null;

    if (isFullText) {
      // For full text, check if the ENTIRE content is ONLY a single tag of the target type
      // This means: only one child node, and it's an element of the target type
      const children = targetElement.childNodes;

      if (children.length === 1 && children[0].nodeType === Node.ELEMENT_NODE) {
        const onlyChild = children[0] as HTMLElement;

        if (onlyChild.tagName === targetTag) {
          if (format === 'uppercase') {
            const style = onlyChild.getAttribute('style');
            if (style?.includes('text-transform: uppercase')) {
              isAlreadyFormatted = true;
              formatElement = onlyChild;
            }
          } else {
            isAlreadyFormatted = true;
            formatElement = onlyChild;
          }
        }
      }
    } else {
      // For partial selection, check if the START of the selection is inside a format tag
      // Walk up from startContainer (the actual text node), not commonAncestorContainer
      let parentElement = range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement);

      while (parentElement && parentElement !== targetElement) {
        if (parentElement.tagName === targetTag) {
          // For uppercase, also check if it has the text-transform style
          if (format === 'uppercase') {
            const style = parentElement.getAttribute('style');
            if (style?.includes('text-transform: uppercase')) {
              isAlreadyFormatted = true;
              formatElement = parentElement;
              break;
            }
          } else {
            isAlreadyFormatted = true;
            formatElement = parentElement;
            break;
          }
        }
        parentElement = parentElement.parentElement;
      }
    }

    // Toggle: Remove formatting if already formatted
    if (isAlreadyFormatted && formatElement) {
      if (isFullText) {
        // For full text: preserve inner HTML to keep nested formatting
        const innerContent = formatElement.innerHTML;
        targetElement.innerHTML = innerContent;
      } else {
        // For partial selection: unwrap the format tag by replacing it with its contents
        const fragment = document.createDocumentFragment();
        while (formatElement.firstChild) {
          const child = formatElement.firstChild;
          fragment.appendChild(child);
        }
        formatElement.parentNode?.replaceChild(fragment, formatElement);

        // Normalize to merge adjacent text nodes
        targetElement.normalize();
      }
    } else {
      // Add formatting
      if (isFullText) {
        // For full text: wrap existing HTML content (preserves existing formatting)
        const currentHTML = targetElement.innerHTML;
        let wrappedHTML = '';
        switch (format) {
          case 'bold':
            wrappedHTML = `<strong>${currentHTML}</strong>`;
            break;
          case 'italic':
            wrappedHTML = `<em>${currentHTML}</em>`;
            break;
          case 'underline':
            wrappedHTML = `<u>${currentHTML}</u>`;
            break;
          case 'uppercase':
            wrappedHTML = `<span style="text-transform: uppercase;">${currentHTML}</span>`;
            break;
        }
        targetElement.innerHTML = wrappedHTML;
      } else {
        // For partial selection: wrap selected text only
        let formattedHTML = '';
        switch (format) {
          case 'bold':
            formattedHTML = `<strong>${selectedText}</strong>`;
            break;
          case 'italic':
            formattedHTML = `<em>${selectedText}</em>`;
            break;
          case 'underline':
            formattedHTML = `<u>${selectedText}</u>`;
            break;
          case 'uppercase':
            formattedHTML = `<span style="text-transform: uppercase;">${selectedText}</span>`;
            break;
        }

        range.deleteContents();
        const template = document.createElement('template');
        template.innerHTML = formattedHTML;
        range.insertNode(template.content.firstChild!);
      }
    }

    // Check if we're editing in the Properties Panel (editableRef) or canvas editor
    const isPropertiesPanel = targetElement === editableRef.current;

    // Update store with new HTML content
    if (selectedTextId) {
      updateText(selectedTextId, { content: targetElement.innerHTML });

      // Force re-render of the contentEditable div to show updated HTML (only affects panel editor)
      if (isPropertiesPanel) {
        setEditorKey(prev => prev + 1);
      }
    }

    // Restore cursor position for BOTH Properties Panel and Canvas editor
    if (isPropertiesPanel) {
      // Single requestAnimationFrame is enough for Properties Panel
      requestAnimationFrame(() => {
        if (!isFullText) {
          restoreCursorPositionFor(targetElement, cursorPos);
        } else {
          selection.removeAllRanges();
        }
      });
    } else {
      // For canvas editor, use double requestAnimationFrame to wait for React to finish re-rendering
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isFullText) {
            restoreCursorPositionFor(targetElement, cursorPos);
          } else {
            selection.removeAllRanges();
          }
        });
      });
    }
  }, [selectedTextId, updateText, saveCursorPositionFor, restoreCursorPositionFor]);

  // Don't render if no text is selected
  if (!selectedText) {
    return null;
  }

  const isLabel = selectedText.type === 'label';

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e5e5',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Icon name="text" size={20} color="#111827" strokeWidth={2} />
          Text Properties
          {isLabel && (
            <span style={{
              background: '#dbeafe',
              color: '#1e40af',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              LABEL
            </span>
          )}
        </h3>
      </div>

      {/* Editable Text Box */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e5e5',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '12px',
        maxHeight: '100px',
        overflowY: 'auto'
      }}>
        <div
          key={editorKey}
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={(e) => {
            // If inline editing is active (overlay is showing), exit it
            // This allows the Properties Panel to take full control
            if (isInlineEditing) {
              finishInlineEdit();
            }
            // Mark that user started editing
            isEditingRef.current = true;
          }}
          onBlur={(e) => {
            // Mark that user stopped editing and save final content
            isEditingRef.current = false;
            if (selectedTextId) {
              const finalContent = e.currentTarget.innerHTML;
              updateText(selectedTextId, { content: finalContent });
              lastContentRef.current = finalContent;
            }
          }}
          onKeyDown={(e) => {
            // Press Enter to confirm/finish editing (Shift+Enter for new line)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur(); // Remove focus to confirm
            }
          }}
          onInput={(e) => {
            if (!selectedTextId) return;

            const newContent = e.currentTarget.innerHTML;

            // Track the content we're setting
            lastContentRef.current = newContent;

            // Direct store update without triggering component re-render
            useTextStore.getState().updateText(selectedTextId, { content: newContent });
          }}
          style={{
            width: '100%',
            minHeight: '60px',
            fontFamily: selectedText.fontFamily,
            fontSize: `${selectedText.fontSize}px`,
            color: selectedText.color,
            textAlign: selectedText.alignment as 'left' | 'center' | 'right',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            border: 'none',
            outline: 'none',
            background: 'transparent'
          }}
        />
      </div>

      {/* Inline Editing Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Font Family Dropdown */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Font
          </label>
          <select
            value={selectedText.fontFamily}
            onChange={(e) => {
              if (selectedTextId) {
                updateText(selectedTextId, { fontFamily: e.target.value });
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="Nunito Sans">Nunito Sans</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Lato">Lato</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>

        {/* Font Size Control */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Size: {selectedText.fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="72"
            step="2"
            value={selectedText.fontSize}
            onChange={(e) => {
              if (selectedTextId) {
                updateText(selectedTextId, { fontSize: parseInt(e.target.value) });
              }
            }}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: '#3B82F6'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#9ca3af',
            marginTop: '2px'
          }}>
            <span>12px</span>
            <span>72px</span>
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Color
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={selectedText.color}
              onChange={(e) => {
                if (selectedTextId) {
                  updateText(selectedTextId, { color: e.target.value });
                }
              }}
              style={{
                width: '48px',
                height: '36px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                padding: '2px'
              }}
            />
            <input
              type="text"
              value={selectedText.color}
              onChange={(e) => {
                if (selectedTextId && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  updateText(selectedTextId, { color: e.target.value });
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Text Opacity */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Text Opacity: {Math.round((selectedText.opacity ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedText.opacity ?? 1}
            onChange={(e) => {
              if (selectedTextId) {
                updateText(selectedTextId, { opacity: parseFloat(e.target.value) });
              }
            }}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: '#3B82F6'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#9ca3af',
            marginTop: '2px'
          }}>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Alignment Controls */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Alignment
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => {
                  if (selectedTextId) {
                    updateText(selectedTextId, { alignment: align });
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: selectedText.alignment === align ? '#3B82F6' : 'white',
                  color: selectedText.alignment === align ? 'white' : '#6b7280',
                  border: '1px solid',
                  borderColor: selectedText.alignment === align ? '#3B82F6' : '#d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (selectedText.alignment !== align) {
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedText.alignment !== align) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                <Icon
                  name={`align-${align}`}
                  size={16}
                  color={selectedText.alignment === align ? 'white' : '#6b7280'}
                  strokeWidth={2}
                />
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Text Formatting - Works on highlighted text or entire text */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Formatting
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormatting('bold');
              }}
              title="Bold - Highlight part or click to format all. Click again to remove."
              style={{
                flex: 1,
                padding: '8px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              B
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormatting('italic');
              }}
              title="Italic - Highlight part or click to format all. Click again to remove."
              style={{
                flex: 1,
                padding: '8px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontStyle: 'italic',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              I
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormatting('underline');
              }}
              title="Underline - Highlight part or click to format all. Click again to remove."
              style={{
                flex: 1,
                padding: '8px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                textDecoration: 'underline',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              U
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormatting('uppercase');
              }}
              title="Uppercase - Highlight part or click to format all. Click again to remove."
              style={{
                flex: 1,
                padding: '8px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              AA
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <button
          onClick={handleLockToggle}
          style={{
            flex: 1,
            padding: '8px',
            background: 'white',
            color: selectedText.locked ? '#ef4444' : '#6b7280',
            border: '1px solid',
            borderColor: selectedText.locked ? '#ef4444' : '#d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Icon name={selectedText.locked ? 'lock' : 'unlock'} size={14} color={selectedText.locked ? '#ef4444' : '#6b7280'} strokeWidth={2} />
          {selectedText.locked ? 'Unlock' : 'Lock'}
        </button>

        <button
          onClick={handleVisibilityToggle}
          style={{
            flex: 1,
            padding: '8px',
            background: 'white',
            color: selectedText.visible ? '#6b7280' : '#9ca3af',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Icon name={selectedText.visible ? 'eye' : 'eye-off'} size={14} color={selectedText.visible ? '#6b7280' : '#9ca3af'} strokeWidth={2} />
          {selectedText.visible ? 'Hide' : 'Show'}
        </button>

        <button
          onClick={handleDelete}
          style={{
            flex: 1,
            padding: '8px',
            background: 'white',
            color: '#ef4444',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Icon name="trash" size={14} color="#ef4444" strokeWidth={2} />
          Delete
        </button>
      </div>

      {/* Advanced Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'white',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.background = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.background = 'white';
          }}
        >
          <Icon name="sliders" size={16} color="#6b7280" strokeWidth={2} />
          Advanced
          <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} color="#6b7280" strokeWidth={2} />
        </button>

        {/* Dropdown Content */}
        {showAdvanced && (
          <div style={{
            marginTop: '8px',
            background: 'white',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Letter Spacing */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Letter Spacing: {selectedText.letterSpacing}px
              </label>
              <input
                type="range"
                min="-2"
                max="10"
                step="0.5"
                value={selectedText.letterSpacing}
                onChange={(e) => {
                  if (selectedTextId) {
                    updateText(selectedTextId, { letterSpacing: parseFloat(e.target.value) });
                  }
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: '#3B82F6'
                }}
              />
            </div>

            {/* Text Height (font size) */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Text Height: {selectedText.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="72"
                step="2"
                value={selectedText.fontSize}
                onChange={(e) => {
                  if (selectedTextId) {
                    updateText(selectedTextId, { fontSize: parseInt(e.target.value) });
                  }
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: '#3B82F6'
                }}
              />
            </div>

            {/* Line Spacing */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Line Spacing: {selectedText.lineHeight}
              </label>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.1"
                value={selectedText.lineHeight}
                onChange={(e) => {
                  if (selectedTextId) {
                    updateText(selectedTextId, { lineHeight: parseFloat(e.target.value) });
                  }
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: '#3B82F6'
                }}
              />
            </div>

            {/* Background Color */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Background Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={selectedText.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    if (selectedTextId) {
                      updateText(selectedTextId, { backgroundColor: e.target.value });
                    }
                  }}
                  style={{
                    width: '48px',
                    height: '36px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                />
                <input
                  type="text"
                  value={selectedText.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    if (selectedTextId && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      updateText(selectedTextId, { backgroundColor: e.target.value });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Background Opacity */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Background Opacity: {Math.round(selectedText.backgroundOpacity)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={selectedText.backgroundOpacity}
                onChange={(e) => {
                  if (selectedTextId) {
                    updateText(selectedTextId, { backgroundOpacity: parseFloat(e.target.value) });
                  }
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: '#3B82F6'
                }}
              />
            </div>

            {/* Rotation */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Rotation: {selectedText.rotation}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedText.rotation}
                onChange={(e) => {
                  if (selectedTextId) {
                    updateText(selectedTextId, { rotation: parseInt(e.target.value) });
                  }
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: '#3B82F6'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextPropertiesPanel;
