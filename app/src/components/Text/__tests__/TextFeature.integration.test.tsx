/**
 * Text Feature Integration Tests
 *
 * Tests the complete text feature workflow:
 * - Creating floating text and labels
 * - Text editing and updates
 * - Context menu interactions
 * - Layer panel integration
 * - Undo/redo operations
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTextStore } from '../../../store/useTextStore';
import { useAppStore } from '../../../store/useAppStore';
import type { TextObject } from '../../../types/text';

// Mock useAppStore for history integration
vi.mock('../../../store/useAppStore', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      saveToHistory: vi.fn()
    }))
  }
}));

beforeEach(() => {
  // Reset text store
  useTextStore.setState({
    texts: [],
    selectedTextId: null
  });

  // Reset app store mock
  const mockSaveToHistory = vi.fn();
  vi.mocked(useAppStore.getState).mockReturnValue({
    saveToHistory: mockSaveToHistory
  } as any);
});

describe('Text Feature Integration - Text Creation', () => {
  test('should create floating text with default properties', () => {
    const { addText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Hello World',
      position: { x: 10, y: 20, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);

    const state = useTextStore.getState();
    expect(state.texts).toHaveLength(1);
    expect(state.texts[0].content).toBe('Hello World');
    expect(state.texts[0].type).toBe('floating');
  });

  test('should create label attached to shape', () => {
    const { addText } = useTextStore.getState();

    const label: TextObject = {
      id: 'label-1',
      type: 'label',
      content: 'Property Boundary',
      position: { x: 5, y: 5, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 14,
      color: '#3b82f6',
      alignment: 'center',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 80,
      backgroundColor: '#ffffff',
      rotation: 0,
      attachedToShapeId: 'shape-1',
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(label);

    const state = useTextStore.getState();
    expect(state.texts).toHaveLength(1);
    expect(state.texts[0].type).toBe('label');
    expect(state.texts[0].attachedToShapeId).toBe('shape-1');
  });
});

describe('Text Feature Integration - Text Selection and Editing', () => {
  test('should select and edit text content', () => {
    const { addText, selectText, updateText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Original Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);
    selectText('text-1');

    expect(useTextStore.getState().selectedTextId).toBe('text-1');

    updateText('text-1', { content: 'Updated Text' });

    const state = useTextStore.getState();
    expect(state.texts[0].content).toBe('Updated Text');
  });

  test('should update multiple text properties at once', () => {
    const { addText, updateText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);
    updateText('text-1', {
      content: 'New Content',
      fontSize: 24,
      color: '#ff0000',
      fontFamily: 'Roboto',
      alignment: 'center'
    });

    const state = useTextStore.getState();
    expect(state.texts[0].content).toBe('New Content');
    expect(state.texts[0].fontSize).toBe(24);
    expect(state.texts[0].color).toBe('#ff0000');
    expect(state.texts[0].fontFamily).toBe('Roboto');
    expect(state.texts[0].alignment).toBe('center');
  });
});

describe('Text Feature Integration - Text Visibility and Locking', () => {
  test('should lock text to prevent editing', () => {
    const { addText, updateText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);
    updateText('text-1', { locked: true });

    const state = useTextStore.getState();
    expect(state.texts[0].locked).toBe(true);
  });

  test('should hide text while preserving it in store', () => {
    const { addText, updateText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);
    updateText('text-1', { visible: false });

    const state = useTextStore.getState();
    expect(state.texts).toHaveLength(1);
    expect(state.texts[0].visible).toBe(false);
  });

  test('should toggle visibility multiple times', () => {
    const { addText, updateText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);

    updateText('text-1', { visible: false });
    expect(useTextStore.getState().texts[0].visible).toBe(false);

    updateText('text-1', { visible: true });
    expect(useTextStore.getState().texts[0].visible).toBe(true);
  });
});

describe('Text Feature Integration - Layer Management', () => {
  test('should filter texts by layer', () => {
    const { addText, getTextsByLayer } = useTextStore.getState();

    const text1: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Layer 1 Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'layer-1',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const text2: TextObject = {
      ...text1,
      id: 'text-2',
      content: 'Layer 2 Text',
      layerId: 'layer-2'
    };

    addText(text1);
    addText(text2);

    const layer1Texts = getTextsByLayer('layer-1');
    const layer2Texts = getTextsByLayer('layer-2');

    expect(layer1Texts).toHaveLength(1);
    expect(layer2Texts).toHaveLength(1);
    expect(layer1Texts[0].content).toBe('Layer 1 Text');
    expect(layer2Texts[0].content).toBe('Layer 2 Text');
  });

  test('should separate floating texts from labels', () => {
    const { addText, getFloatingTexts, getLabels } = useTextStore.getState();

    const floating: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Floating',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const label: TextObject = {
      ...floating,
      id: 'label-1',
      type: 'label',
      content: 'Label',
      attachedToShapeId: 'shape-1'
    };

    addText(floating);
    addText(label);

    const floatingTexts = getFloatingTexts();
    const labels = getLabels();

    expect(floatingTexts).toHaveLength(1);
    expect(labels).toHaveLength(1);
    expect(floatingTexts[0].type).toBe('floating');
    expect(labels[0].type).toBe('label');
  });
});

describe('Text Feature Integration - Undo/Redo Operations', () => {
  test('should call saveToHistory when adding text', () => {
    const { addText } = useTextStore.getState();
    const mockSaveToHistory = vi.mocked(useAppStore.getState().saveToHistory);

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);

    expect(mockSaveToHistory).toHaveBeenCalled();
  });

  test('should call saveToHistory when updating text', () => {
    const { addText, updateText } = useTextStore.getState();
    const mockSaveToHistory = vi.mocked(useAppStore.getState().saveToHistory);

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);
    mockSaveToHistory.mockClear();

    updateText('text-1', { content: 'Updated' });

    expect(mockSaveToHistory).toHaveBeenCalled();
  });

  test('should call saveToHistory when deleting text', () => {
    const { addText, deleteText } = useTextStore.getState();
    const mockSaveToHistory = vi.mocked(useAppStore.getState().saveToHistory);

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);
    mockSaveToHistory.mockClear();

    deleteText('text-1');

    expect(mockSaveToHistory).toHaveBeenCalled();
  });
});

describe('Text Feature Integration - Multi-Text Operations', () => {
  test('should handle multiple text objects in different layers', () => {
    const { addText, getTextsByLayer } = useTextStore.getState();

    const texts = [
      {
        id: 'text-1',
        type: 'floating' as const,
        content: 'Layer 1 - Text 1',
        position: { x: 0, y: 0, z: 0.1 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left' as const,
        letterSpacing: 0,
        lineHeight: 1.5,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-1',
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'text-2',
        type: 'floating' as const,
        content: 'Layer 1 - Text 2',
        position: { x: 10, y: 10, z: 0.1 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left' as const,
        letterSpacing: 0,
        lineHeight: 1.5,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-1',
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'text-3',
        type: 'floating' as const,
        content: 'Layer 2 - Text 1',
        position: { x: 20, y: 20, z: 0.1 },
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: '#000000',
        alignment: 'left' as const,
        letterSpacing: 0,
        lineHeight: 1.5,
        backgroundOpacity: 0,
        rotation: 0,
        layerId: 'layer-2',
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    texts.forEach(text => addText(text));

    const layer1Texts = getTextsByLayer('layer-1');
    const layer2Texts = getTextsByLayer('layer-2');

    expect(layer1Texts).toHaveLength(2);
    expect(layer2Texts).toHaveLength(1);
  });

  test('should handle mixed floating texts and labels', () => {
    const { addText, getFloatingTexts, getLabels } = useTextStore.getState();

    const floating1: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Floating 1',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const label1: TextObject = {
      ...floating1,
      id: 'label-1',
      type: 'label',
      content: 'Label 1',
      attachedToShapeId: 'shape-1'
    };

    const floating2: TextObject = {
      ...floating1,
      id: 'text-2',
      content: 'Floating 2'
    };

    const label2: TextObject = {
      ...label1,
      id: 'label-2',
      content: 'Label 2',
      attachedToShapeId: 'shape-2'
    };

    addText(floating1);
    addText(label1);
    addText(floating2);
    addText(label2);

    const floatingTexts = getFloatingTexts();
    const labels = getLabels();

    expect(floatingTexts).toHaveLength(2);
    expect(labels).toHaveLength(2);
    expect(useTextStore.getState().texts).toHaveLength(4);
  });

  test('should delete all texts in a layer', () => {
    const { addText, deleteText, getTextsByLayer } = useTextStore.getState();

    const text1: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text 1',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'layer-1',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const text2: TextObject = {
      ...text1,
      id: 'text-2',
      content: 'Text 2'
    };

    addText(text1);
    addText(text2);

    expect(getTextsByLayer('layer-1')).toHaveLength(2);

    deleteText('text-1');
    deleteText('text-2');

    expect(getTextsByLayer('layer-1')).toHaveLength(0);
  });
});

describe('Text Feature Integration - Edge Cases', () => {
  test('should handle empty content', () => {
    const { addText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: '',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);

    const state = useTextStore.getState();
    expect(state.texts).toHaveLength(1);
    expect(state.texts[0].content).toBe('');
  });

  test('should handle multiline content', () => {
    const { addText } = useTextStore.getState();

    const multilineContent = 'Line 1\nLine 2\nLine 3';

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: multilineContent,
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);

    const state = useTextStore.getState();
    expect(state.texts[0].content).toBe(multilineContent);
  });

  test('should handle very long content', () => {
    const { addText } = useTextStore.getState();

    const longContent = 'A'.repeat(1000);

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: longContent,
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);

    const state = useTextStore.getState();
    expect(state.texts[0].content).toHaveLength(1000);
  });

  test('should handle rapid selection changes', () => {
    const { addText, selectText } = useTextStore.getState();

    const text1: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text 1',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const text2: TextObject = {
      ...text1,
      id: 'text-2',
      content: 'Text 2'
    };

    addText(text1);
    addText(text2);

    // Rapid selection changes
    selectText('text-1');
    selectText('text-2');
    selectText(null);
    selectText('text-1');

    expect(useTextStore.getState().selectedTextId).toBe('text-1');
  });

  test('should handle position updates at boundaries', () => {
    const { addText, updateTextPosition } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Text',
      position: { x: 0, y: 0, z: 0.1 },
      fontFamily: 'Nunito Sans',
      fontSize: 16,
      color: '#000000',
      alignment: 'left',
      letterSpacing: 0,
      lineHeight: 1.5,
      backgroundOpacity: 0,
      rotation: 0,
      layerId: 'main',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    addText(text);

    // Test extreme positions
    updateTextPosition('text-1', { x: -1000, y: -1000, z: 0 });
    expect(useTextStore.getState().texts[0].position).toEqual({ x: -1000, y: -1000, z: 0 });

    updateTextPosition('text-1', { x: 1000, y: 1000, z: 100 });
    expect(useTextStore.getState().texts[0].position).toEqual({ x: 1000, y: 1000, z: 100 });
  });
});
