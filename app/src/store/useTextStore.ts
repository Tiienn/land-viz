/**
 * Text Store
 *
 * Zustand store for managing text annotations and shape labels.
 * Handles text creation, updates, selection, and persistence.
 */

import { create } from 'zustand';
import type { TextObject, TextPosition } from '../types/text';
import { useAppStore } from './useAppStore'; // Phase 8: For history integration

interface TextStore {
  // State
  texts: TextObject[];
  selectedTextId: string | null;

  // Inline editing state (Canva-style)
  isInlineEditing: boolean;
  inlineEditingTextId: string | null;
  inlineEditPosition: TextPosition | null;
  inlineEditScreenPosition: { x: number; y: number } | null;
  draftTextContent: string;
  originalTextContent: string; // Save original for cancel

  // Actions - CRUD operations
  addText: (text: TextObject) => void;
  updateText: (id: string, updates: Partial<TextObject>) => void;
  deleteText: (id: string) => void;
  clearTexts: () => void;

  // Actions - Selection
  selectText: (id: string | null) => void;

  // Actions - Position & Transform
  updateTextPosition: (id: string, position: TextPosition) => void;
  updateTextRotation: (id: string, rotation: number) => void;

  // Actions - Inline Editing (Canva-style)
  startInlineEdit: (textId: string, position: TextPosition, initialContent?: string, screenPosition?: { x: number; y: number }) => void;
  updateDraftContent: (content: string) => void;
  finishInlineEdit: () => void;
  cancelInlineEdit: () => void;

  // Selectors
  getTextById: (id: string) => TextObject | undefined;
  getTextsByLayer: (layerId: string) => TextObject[];
  getSelectedText: () => TextObject | undefined;
  getFloatingTexts: () => TextObject[];
  getLabels: () => TextObject[];
}

/**
 * Text store implementation using Zustand
 */
export const useTextStore = create<TextStore>((set, get) => ({
  // Initial state
  texts: [],
  selectedTextId: null,

  // Inline editing initial state
  isInlineEditing: false,
  inlineEditingTextId: null,
  inlineEditPosition: null,
  inlineEditScreenPosition: null,
  draftTextContent: '',
  originalTextContent: '', // Save original for cancel

  // Add a new text object
  addText: (text: TextObject) => {
    // Phase 8: Save state before adding (for undo)
    useAppStore.getState().saveToHistory();

    set((state) => ({
      texts: [...state.texts, text]
    }));
  },

  // Update an existing text object
  updateText: (id: string, updates: Partial<TextObject>) => {
    console.log('[updateText] Updating text:');
    console.log('  id:', id);
    console.log('  updates.content:', updates.content);

    // Only save to history if the text already has content (not during initial creation)
    const existingText = get().texts.find(t => t.id === id);
    if (existingText && existingText.content && existingText.content.trim() !== '') {
      useAppStore.getState().saveToHistory();
    }

    set((state) => ({
      texts: state.texts.map((text) =>
        text.id === id
          ? { ...text, ...updates, updatedAt: Date.now() }
          : text
      )
    }));

    const updatedText = get().texts.find(t => t.id === id);
    console.log('[updateText] Text updated. New content:', updatedText?.content);
  },

  // Delete a text object
  deleteText: (id: string) => {
    // Phase 8: Save state before deleting (for undo)
    useAppStore.getState().saveToHistory();

    set((state) => ({
      texts: state.texts.filter((text) => text.id !== id),
      selectedTextId: state.selectedTextId === id ? null : state.selectedTextId
    }));

    // NOTE: Do NOT call useAppStore.deleteElement() here to avoid circular deletion
    // The unified deleteElement() function already handles deletion from useTextStore
  },

  // Clear all texts
  clearTexts: () =>
    set({
      texts: [],
      selectedTextId: null
    }),

  // Select a text object (or deselect if null)
  selectText: (id: string | null) => {
    set({ selectedTextId: id });
  },

  // Update text position
  updateTextPosition: (id: string, position: TextPosition) =>
    set((state) => ({
      texts: state.texts.map((text) =>
        text.id === id
          ? { ...text, position, updatedAt: Date.now() }
          : text
      )
    })),

  // Update text rotation
  updateTextRotation: (id: string, rotation: number) =>
    set((state) => ({
      texts: state.texts.map((text) =>
        text.id === id
          ? { ...text, rotation, updatedAt: Date.now() }
          : text
      )
    })),

  // Start inline editing (Canva-style)
  startInlineEdit: (textId: string, position: TextPosition, initialContent = '', screenPosition?: { x: number; y: number }) => {
    set({
      isInlineEditing: true,
      inlineEditingTextId: textId,
      inlineEditPosition: position,
      inlineEditScreenPosition: screenPosition || null,
      draftTextContent: initialContent,
      originalTextContent: initialContent // Save original for cancel
    });
  },

  // Update draft content as user types
  updateDraftContent: (content: string) => {
    const state = get();
    const { inlineEditingTextId } = state;

    // Update both draft and the actual text object for live preview
    set((state) => ({
      draftTextContent: content,
      texts: inlineEditingTextId
        ? state.texts.map((text) =>
            text.id === inlineEditingTextId
              ? { ...text, content, updatedAt: Date.now() }
              : text
          )
        : state.texts
    }));

    // NOTE: Do NOT call useAppStore.updateElement() here to avoid circular updates
    // The unified updateElement() function already handles updates to useTextStore
    // if (inlineEditingTextId) {
    //   useAppStore.getState().updateElement(inlineEditingTextId, {
    //     content,
    //     name: `Text: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`,
    //   });
    // }
  },

  // Finish inline editing and save the text
  finishInlineEdit: () => {
    const state = get();
    const { inlineEditingTextId, draftTextContent, inlineEditPosition } = state;

    if (!inlineEditingTextId || !inlineEditPosition) {
      // Clear editing state
      set({
        isInlineEditing: false,
        inlineEditingTextId: null,
        inlineEditPosition: null,
        inlineEditScreenPosition: null,
        draftTextContent: '',
        originalTextContent: ''
      });
      return;
    }

    // Check if content is empty - if so, delete the text
    const trimmedContent = draftTextContent.trim();

    if (trimmedContent === '') {
      // Delete the text object if content is empty
      get().deleteText(inlineEditingTextId);

      // Clear editing state
      set({
        isInlineEditing: false,
        inlineEditingTextId: null,
        inlineEditPosition: null,
        inlineEditScreenPosition: null,
        draftTextContent: '',
        originalTextContent: ''
      });
      return;
    }

    // Check if text already exists (editing) or is new (creating)
    const existingText = state.texts.find((t) => t.id === inlineEditingTextId);

    if (existingText) {
      // ATOMIC UPDATE: Update text content AND clear editing state in ONE set() call
      // This ensures React sees both changes together and triggers proper re-render
      set((state) => ({
        // Update text content (without calling updateText to avoid double history save)
        texts: state.texts.map((text) =>
          text.id === inlineEditingTextId
            ? { ...text, content: trimmedContent, updatedAt: Date.now() }
            : text
        ),
        // Clear editing state
        isInlineEditing: false,
        inlineEditingTextId: null,
        inlineEditPosition: null,
        inlineEditScreenPosition: null,
        draftTextContent: '',
        originalTextContent: ''
      }));

      // NOTE: Do NOT call useAppStore.updateElement() here to avoid circular updates
      // The unified updateElement() function already handles updates to useTextStore
      // useAppStore.getState().updateElement(inlineEditingTextId, {
      //   content: trimmedContent,
      //   name: `Text: ${trimmedContent.substring(0, 20)}${trimmedContent.length > 20 ? '...' : ''}`,
      // });

      // Save to history after the atomic update
      useAppStore.getState().saveToHistory();
    } else {

      // Clear editing state even if text not found
      set({
        isInlineEditing: false,
        inlineEditingTextId: null,
        inlineEditPosition: null,
        inlineEditScreenPosition: null,
        draftTextContent: '',
        originalTextContent: ''
      });
    }
  },

  // Cancel inline editing without saving - REVERT changes
  cancelInlineEdit: () => {
    const state = get();
    const { inlineEditingTextId, originalTextContent } = state;

    // Revert text to original content
    if (inlineEditingTextId) {
      const text = state.texts.find((t) => t.id === inlineEditingTextId);

      // If original was empty, delete the text
      if (originalTextContent.trim() === '') {
        get().deleteText(inlineEditingTextId);
      } else if (text) {
        // Otherwise, restore original content
        set((state) => ({
          texts: state.texts.map((t) =>
            t.id === inlineEditingTextId
              ? { ...t, content: originalTextContent, updatedAt: Date.now() }
              : t
          )
        }));
      }
    }

    // Clear editing state
    set({
      isInlineEditing: false,
      inlineEditingTextId: null,
      inlineEditPosition: null,
      inlineEditScreenPosition: null,
      draftTextContent: '',
      originalTextContent: ''
    });
  },

  // Get text by ID
  getTextById: (id: string) =>
    get().texts.find((text) => text.id === id),

  // Get all texts in a specific layer
  getTextsByLayer: (layerId: string) =>
    get().texts.filter((text) => text.layerId === layerId),

  // Get currently selected text
  getSelectedText: () => {
    const { texts, selectedTextId } = get();
    return selectedTextId ? texts.find((t) => t.id === selectedTextId) : undefined;
  },

  // Get all floating texts (not attached to shapes)
  getFloatingTexts: () =>
    get().texts.filter((text) => text.type === 'floating'),

  // Get all labels (attached to shapes)
  getLabels: () =>
    get().texts.filter((text) => text.type === 'label')
}));

// Phase 8: Expose text store state for history integration
if (typeof window !== 'undefined') {
  // Subscribe to state changes and expose via window
  useTextStore.subscribe((state) => {
    (window as any).textStoreState = {
      texts: state.texts,
      selectedTextId: state.selectedTextId
    };
  });

  // Initialize immediately
  (window as any).textStoreState = {
    texts: useTextStore.getState().texts,
    selectedTextId: useTextStore.getState().selectedTextId
  };

  // Provide restore function for undo/redo
  (window as any).restoreTextState = (texts: TextObject[], selectedTextId: string | null) => {
    useTextStore.setState({
      texts,
      selectedTextId
    });
  };
}
