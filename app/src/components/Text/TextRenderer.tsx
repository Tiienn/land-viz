/**
 * TextRenderer Component
 *
 * Manages rendering of all floating text objects in the scene.
 * Filters by layer visibility and handles text selection.
 * Includes performance monitoring and warnings.
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useTextStore } from '../../store/useTextStore';
import { useLayerStore } from '../../store/useLayerStore';
import { useAppStore } from '../../store/useAppStore';
import { TextObject } from './TextObject';
import { RichTextEditor } from './RichTextEditor';
import { checkTextCountPerformance, calculateTextStatistics } from '../../utils/textPerformance';
import { logger } from '../../utils/logger';

export const TextRenderer: React.FC = () => {
  const texts = useTextStore(state => state.texts);
  const selectedTextId = useTextStore(state => state.selectedTextId);
  const selectText = useTextStore(state => state.selectText);
  const layers = useLayerStore(state => state.layers);

  // Debug: Log when texts array changes
  React.useEffect(() => {
    console.log('[TextRenderer] texts array updated:', texts.map(t => ({ id: t.id, content: t.content })));
  }, [texts]);

  // Inline editing state (Canva-style)
  const isInlineEditing = useTextStore(state => state.isInlineEditing);
  const inlineEditingTextId = useTextStore(state => state.inlineEditingTextId);
  const inlineEditPosition = useTextStore(state => state.inlineEditPosition);
  const inlineEditScreenPosition = useTextStore(state => state.inlineEditScreenPosition);
  const updateDraftContent = useTextStore(state => state.updateDraftContent);
  const finishInlineEdit = useTextStore(state => state.finishInlineEdit);
  const cancelInlineEdit = useTextStore(state => state.cancelInlineEdit);

  // Phase 7: Context menu support
  const openContextMenu = useAppStore(state => state.openContextMenu);

  // Filter visible texts
  // IMPORTANT: Check both text/layer visibility AND parent folder visibility recursively
  const visibleTexts = useMemo(() => {
    console.log('[TextRenderer] visibleTexts recalculating with texts:', texts.length, texts.map(t => ({ id: t.id, content: t.content })));

    // Helper function to check if layer is visible (including parent folders)
    const isLayerVisible = (layerId: string): boolean => {
      const layer = layers.find(l => l.id === layerId);

      // IMPORTANT: If layer doesn't exist, show the text anyway (backwards compatible)
      // This prevents texts from being hidden if layer references are broken
      if (!layer) {
        return true;
      }

      // Layer itself must be visible
      if (layer.visible === false) return false;

      // If layer has a parent folder, check parent visibility recursively
      if (layer.parentId) {
        return isLayerVisible(layer.parentId);
      }

      // No parent or all parents are visible
      return true;
    };

    return texts.filter(text => {
      return text.visible && isLayerVisible(text.layerId);
    });
  }, [texts, layers]);

  // Only render floating texts (labels rendered separately)
  const floatingTexts = useMemo(() => {
    return visibleTexts.filter(text => text.type === 'floating');
  }, [visibleTexts]);

  // Phase 11: Performance monitoring
  useEffect(() => {
    if (texts.length === 0) return;

    // Check text count performance
    const performanceCheck = checkTextCountPerformance(texts.length);
    if (performanceCheck.level !== 'ok' && performanceCheck.message) {
      logger.warn('[TextRenderer] Performance warning', {
        level: performanceCheck.level,
        message: performanceCheck.message
      });
    }

    // Calculate statistics
    const stats = calculateTextStatistics(texts);
    if (stats.total > 50) {
      logger.info('[TextRenderer] Text statistics', stats);
    }
  }, [texts.length, texts]);

  // Phase 7: Context menu handler
  const handleContextMenu = useCallback((textId: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    openContextMenu(
      'text',
      { x: event.clientX, y: event.clientY },
      undefined, // No shape ID
      textId      // Pass text ID
    );
  }, [openContextMenu]);

  // Double-click handler to start inline editing (3D in-place editing)
  const handleDoubleClick = useCallback((textId: string) => (screenX: number, screenY: number) => {
    const text = texts.find(t => t.id === textId);
    if (!text) return;

    // Select the text first
    selectText(textId);

    // Start inline editing WITHOUT screen position to use 3D editor
    const startInlineEdit = useTextStore.getState().startInlineEdit;
    startInlineEdit(textId, text.position, text.content);

    // Notify App.tsx to open Properties panel (via custom event)
    window.dispatchEvent(new CustomEvent('openPropertiesPanel'));
  }, [texts, selectText]);

  // Get the text being edited (if any)
  const editingText = useMemo(() => {
    return inlineEditingTextId ? texts.find(t => t.id === inlineEditingTextId) : undefined;
  }, [inlineEditingTextId, texts]);

  return (
    <group name="text-objects">
      {/* Render text objects - hide the one being edited to show editor clearly */}
      {floatingTexts.map(text => {
        // Hide the text being edited when using 3D editor (no screen position)
        if (isInlineEditing && text.id === inlineEditingTextId && !inlineEditScreenPosition) {
          return null;
        }

        return (
          <TextObject
            key={text.id}
            text={text}
            isSelected={text.id === selectedTextId}
            onClick={() => {
              selectText(text.id);
            }}
            onDoubleClick={handleDoubleClick(text.id)}
            onContextMenu={handleContextMenu(text.id)}
          />
        );
      })}

      {/* Render rich text editor when editing text - but NOT if we're using the overlay (screen position set) */}
      {isInlineEditing && editingText && !inlineEditScreenPosition && (
        <RichTextEditor
          position={editingText.position}
          textId={editingText.id}
          initialContent={editingText.content}
          initialFontFamily={editingText.fontFamily}
          initialFontSize={editingText.fontSize}
          initialColor={editingText.color}
          initialAlignment={editingText.alignment}
          initialLetterSpacing={editingText.letterSpacing}
          initialLineHeight={editingText.lineHeight}
          initialRotation={editingText.rotation}
          onContentChange={updateDraftContent}
          onFinish={finishInlineEdit}
          onCancel={cancelInlineEdit}
        />
      )}
    </group>
  );
};
