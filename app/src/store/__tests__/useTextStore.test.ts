/**
 * useTextStore Unit Tests
 *
 * Comprehensive test coverage for text store functionality.
 * Tests CRUD operations, selection, position/rotation updates, and selectors.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useTextStore } from '../useTextStore';
import type { TextObject } from '../../types/text';

// Mock useAppStore for history integration
vi.mock('../useAppStore', () => ({
  useAppStore: {
    getState: () => ({
      saveToHistory: vi.fn()
    })
  }
}));

beforeEach(() => {
  // Reset store state before each test
  useTextStore.setState({
    texts: [],
    selectedTextId: null
  });

  // Clear any existing window mocks
  if ((window as any).textStoreState) {
    delete (window as any).textStoreState;
  }
  if ((window as any).restoreTextState) {
    delete (window as any).restoreTextState;
  }
});

describe('useTextStore - Initial State', () => {
  test('should have empty texts array initially', () => {
    const state = useTextStore.getState();
    expect(state.texts).toEqual([]);
  });

  test('should have null selectedTextId initially', () => {
    const state = useTextStore.getState();
    expect(state.selectedTextId).toBeNull();
  });

  test('should have all required actions', () => {
    const state = useTextStore.getState();

    expect(typeof state.addText).toBe('function');
    expect(typeof state.updateText).toBe('function');
    expect(typeof state.deleteText).toBe('function');
    expect(typeof state.clearTexts).toBe('function');
    expect(typeof state.selectText).toBe('function');
    expect(typeof state.updateTextPosition).toBe('function');
    expect(typeof state.updateTextRotation).toBe('function');
  });

  test('should have all required selectors', () => {
    const state = useTextStore.getState();

    expect(typeof state.getTextById).toBe('function');
    expect(typeof state.getTextsByLayer).toBe('function');
    expect(typeof state.getSelectedText).toBe('function');
    expect(typeof state.getFloatingTexts).toBe('function');
    expect(typeof state.getLabels).toBe('function');
  });
});

describe('useTextStore - addText', () => {
  test('should add a floating text object', () => {
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
    expect(state.texts[0]).toEqual(text);
  });

  test('should add a label text object', () => {
    const { addText } = useTextStore.getState();

    const label: TextObject = {
      id: 'label-1',
      type: 'label',
      content: 'Shape Label',
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

  test('should add multiple text objects', () => {
    const { addText } = useTextStore.getState();

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
      content: 'Text 2',
      position: { x: 10, y: 10, z: 0.1 }
    };

    addText(text1);
    addText(text2);

    const state = useTextStore.getState();
    expect(state.texts).toHaveLength(2);
  });
});

describe('useTextStore - updateText', () => {
  test('should update text content', () => {
    const { addText, updateText } = useTextStore.getState();

    const text: TextObject = {
      id: 'text-1',
      type: 'floating',
      content: 'Original',
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
    updateText('text-1', { content: 'Updated' });

    const state = useTextStore.getState();
    expect(state.texts[0].content).toBe('Updated');
  });

  test('should update text styling', () => {
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
      fontSize: 24,
      color: '#ff0000',
      fontFamily: 'Roboto'
    });

    const state = useTextStore.getState();
    expect(state.texts[0].fontSize).toBe(24);
    expect(state.texts[0].color).toBe('#ff0000');
    expect(state.texts[0].fontFamily).toBe('Roboto');
  });

  test('should update text visibility and lock state', () => {
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
    updateText('text-1', { visible: false, locked: true });

    const state = useTextStore.getState();
    expect(state.texts[0].visible).toBe(false);
    expect(state.texts[0].locked).toBe(true);
  });

  test('should update updatedAt timestamp', () => {
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
      updatedAt: 1000
    };

    addText(text);

    const beforeUpdate = Date.now();
    updateText('text-1', { content: 'Updated' });
    const afterUpdate = Date.now();

    const state = useTextStore.getState();
    expect(state.texts[0].updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    expect(state.texts[0].updatedAt).toBeLessThanOrEqual(afterUpdate);
  });

  test('should not update non-existent text', () => {
    const { updateText } = useTextStore.getState();

    updateText('non-existent', { content: 'Updated' });

    const state = useTextStore.getState();
    expect(state.texts).toHaveLength(0);
  });
});

describe('useTextStore - deleteText', () => {
  test('should delete text by id', () => {
    const { addText, deleteText } = useTextStore.getState();

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
    expect(useTextStore.getState().texts).toHaveLength(1);

    deleteText('text-1');
    expect(useTextStore.getState().texts).toHaveLength(0);
  });

  test('should clear selection when deleting selected text', () => {
    const { addText, selectText, deleteText } = useTextStore.getState();

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
    selectText('text-1');

    expect(useTextStore.getState().selectedTextId).toBe('text-1');

    deleteText('text-1');

    expect(useTextStore.getState().selectedTextId).toBeNull();
  });

  test('should preserve selection when deleting different text', () => {
    const { addText, selectText, deleteText } = useTextStore.getState();

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
    selectText('text-1');

    deleteText('text-2');

    expect(useTextStore.getState().selectedTextId).toBe('text-1');
  });

  test('should handle deleting non-existent text', () => {
    const { deleteText } = useTextStore.getState();

    deleteText('non-existent');

    expect(useTextStore.getState().texts).toHaveLength(0);
  });
});

describe('useTextStore - clearTexts', () => {
  test('should clear all texts', () => {
    const { addText, clearTexts } = useTextStore.getState();

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

    expect(useTextStore.getState().texts).toHaveLength(2);

    clearTexts();

    expect(useTextStore.getState().texts).toHaveLength(0);
  });

  test('should clear selection when clearing all texts', () => {
    const { addText, selectText, clearTexts } = useTextStore.getState();

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
    selectText('text-1');

    clearTexts();

    expect(useTextStore.getState().selectedTextId).toBeNull();
  });
});

describe('useTextStore - selectText', () => {
  test('should select text by id', () => {
    const { addText, selectText } = useTextStore.getState();

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
    selectText('text-1');

    expect(useTextStore.getState().selectedTextId).toBe('text-1');
  });

  test('should deselect text with null', () => {
    const { addText, selectText } = useTextStore.getState();

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
    selectText('text-1');
    selectText(null);

    expect(useTextStore.getState().selectedTextId).toBeNull();
  });

  test('should change selection between texts', () => {
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

    selectText('text-1');
    expect(useTextStore.getState().selectedTextId).toBe('text-1');

    selectText('text-2');
    expect(useTextStore.getState().selectedTextId).toBe('text-2');
  });
});

describe('useTextStore - updateTextPosition', () => {
  test('should update text position', () => {
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
    updateTextPosition('text-1', { x: 10, y: 20, z: 0.2 });

    const state = useTextStore.getState();
    expect(state.texts[0].position).toEqual({ x: 10, y: 20, z: 0.2 });
  });

  test('should update updatedAt when position changes', () => {
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
      updatedAt: 1000
    };

    addText(text);

    const beforeUpdate = Date.now();
    updateTextPosition('text-1', { x: 10, y: 20, z: 0.1 });
    const afterUpdate = Date.now();

    const state = useTextStore.getState();
    expect(state.texts[0].updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    expect(state.texts[0].updatedAt).toBeLessThanOrEqual(afterUpdate);
  });
});

describe('useTextStore - updateTextRotation', () => {
  test('should update text rotation', () => {
    const { addText, updateTextRotation } = useTextStore.getState();

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
    updateTextRotation('text-1', 45);

    const state = useTextStore.getState();
    expect(state.texts[0].rotation).toBe(45);
  });

  test('should update updatedAt when rotation changes', () => {
    const { addText, updateTextRotation } = useTextStore.getState();

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
      updatedAt: 1000
    };

    addText(text);

    const beforeUpdate = Date.now();
    updateTextRotation('text-1', 90);
    const afterUpdate = Date.now();

    const state = useTextStore.getState();
    expect(state.texts[0].updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    expect(state.texts[0].updatedAt).toBeLessThanOrEqual(afterUpdate);
  });
});

describe('useTextStore - Selectors', () => {
  test('getTextById should return text by id', () => {
    const { addText, getTextById } = useTextStore.getState();

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

    const found = getTextById('text-1');
    expect(found).toEqual(text);
  });

  test('getTextById should return undefined for non-existent id', () => {
    const { getTextById } = useTextStore.getState();

    const found = getTextById('non-existent');
    expect(found).toBeUndefined();
  });

  test('getTextsByLayer should filter texts by layer', () => {
    const { addText, getTextsByLayer } = useTextStore.getState();

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
      content: 'Text 2',
      layerId: 'layer-2'
    };

    const text3: TextObject = {
      ...text1,
      id: 'text-3',
      content: 'Text 3',
      layerId: 'layer-1'
    };

    addText(text1);
    addText(text2);
    addText(text3);

    const layer1Texts = getTextsByLayer('layer-1');
    expect(layer1Texts).toHaveLength(2);
    expect(layer1Texts.map(t => t.id)).toEqual(['text-1', 'text-3']);
  });

  test('getSelectedText should return selected text', () => {
    const { addText, selectText, getSelectedText } = useTextStore.getState();

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
    selectText('text-1');

    const selected = getSelectedText();
    expect(selected).toEqual(text);
  });

  test('getSelectedText should return undefined when no selection', () => {
    const { getSelectedText } = useTextStore.getState();

    const selected = getSelectedText();
    expect(selected).toBeUndefined();
  });

  test('getFloatingTexts should return only floating texts', () => {
    const { addText, getFloatingTexts } = useTextStore.getState();

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
    expect(floatingTexts).toHaveLength(1);
    expect(floatingTexts[0].type).toBe('floating');
  });

  test('getLabels should return only labels', () => {
    const { addText, getLabels } = useTextStore.getState();

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

    const labels = getLabels();
    expect(labels).toHaveLength(1);
    expect(labels[0].type).toBe('label');
  });
});
