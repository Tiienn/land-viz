/**
 * Professional keyboard shortcuts for alignment system
 * Provides CAD-style keyboard controls following professional standards
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

interface UseAlignmentKeyboardOptions {
  enabled?: boolean;
  preventDefaults?: boolean;
}

export const useAlignmentKeyboard = (options: UseAlignmentKeyboardOptions = {}) => {
  const { enabled = true, preventDefaults = true } = options;
  
  const keysPressed = useRef<Set<string>>(new Set());
  const alignmentConfig = useAppStore(state => state.drawing.alignment?.config);
  const snapConfig = useAppStore(state => state.drawing.snap?.config);
  const gridConfig = useAppStore(state => state.drawing.grid);
  const updateDrawingState = useAppStore(state => state.updateDrawingState);
  const selectedShapeId = useAppStore(state => state.selectedShapeId);

  // Toggle alignment system
  const toggleAlignment = useCallback(() => {
    if (!alignmentConfig) return;
    updateDrawingState({
      alignment: {
        config: { ...alignmentConfig, enabled: !alignmentConfig.enabled },
        activeGuides: [],
        draggingShapeId: null
      }
    });
  }, [alignmentConfig, updateDrawingState]);

  // Toggle grid system
  const toggleGrid = useCallback(() => {
    updateDrawingState({
      grid: { ...gridConfig, enabled: !gridConfig.enabled }
    });
  }, [gridConfig, updateDrawingState]);

  // Toggle snapping temporarily
  const toggleSnapTemporary = useCallback((disable: boolean) => {
    if (!snapConfig) return;
    updateDrawingState({
      snap: {
        ...useAppStore.getState().drawing.snap,
        config: { ...snapConfig, temporarilyDisabled: disable }
      }
    });
  }, [snapConfig, updateDrawingState]);

  // Show/hide all snap points for debugging
  const toggleShowAllSnapPoints = useCallback((show: boolean) => {
    if (!snapConfig) return;
    updateDrawingState({
      snap: {
        ...useAppStore.getState().drawing.snap,
        config: { ...snapConfig, showAllPoints: show }
      }
    });
  }, [snapConfig, updateDrawingState]);

  // Create horizontal guide at cursor position
  const createHorizontalGuide = useCallback(() => {
    // This would need cursor position from the scene
    console.log('Create horizontal guide at cursor');
    // TODO: Implement guide creation
  }, []);

  // Create vertical guide at cursor position
  const createVerticalGuide = useCallback(() => {
    // This would need cursor position from the scene
    console.log('Create vertical guide at cursor');
    // TODO: Implement guide creation
  }, []);

  // Clear all alignment guides
  const clearAllGuides = useCallback(() => {
    updateDrawingState({
      alignment: {
        ...useAppStore.getState().drawing.alignment,
        activeGuides: []
      }
    });
  }, [updateDrawingState]);

  // Cycle through snap types
  const cycleSnapTypes = useCallback(() => {
    if (!snapConfig) return;
    
    const currentTypes = Array.from(snapConfig.activeTypes || new Set());
    const allTypes = ['grid', 'endpoint', 'midpoint', 'center', 'intersection'];
    
    // Find next combination
    let nextIndex = 0;
    if (currentTypes.length > 0) {
      const currentCombination = currentTypes.sort().join(',');
      const combinations = [
        ['grid'],
        ['endpoint'],
        ['midpoint'], 
        ['center'],
        ['grid', 'endpoint'],
        ['grid', 'endpoint', 'midpoint'],
        ['grid', 'endpoint', 'midpoint', 'center'],
        allTypes
      ];
      
      const currentIdx = combinations.findIndex(combo => 
        combo.sort().join(',') === currentCombination
      );
      nextIndex = (currentIdx + 1) % combinations.length;
    }
    
    const nextTypes = [['grid'], ['endpoint'], ['midpoint'], ['center'], 
                      ['grid', 'endpoint'], ['grid', 'endpoint', 'midpoint'], 
                      ['grid', 'endpoint', 'midpoint', 'center'], allTypes][nextIndex];
    
    updateDrawingState({
      snap: {
        ...useAppStore.getState().drawing.snap,
        config: { ...snapConfig, activeTypes: new Set(nextTypes) }
      }
    });
  }, [snapConfig, updateDrawingState]);

  // Keyboard event handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const key = event.key.toLowerCase();
    const { ctrlKey, altKey, shiftKey, metaKey } = event;
    const modifierKey = ctrlKey || metaKey;
    
    keysPressed.current.add(key);

    // Prevent default for our shortcuts (but allow Ctrl+R for refresh)
    const shouldPreventDefault = preventDefaults && (
      key === 's' || key === 'g' || key === 'h' || 
      (key === 'r' && !modifierKey) || // Only prevent 'r' if no modifier keys
      (modifierKey && (key === ';' || key === '\'' || key === 'g')) ||
      (altKey && key === 'tab')
    );

    if (shouldPreventDefault) {
      event.preventDefault();
    }

    // Handle key combinations
    switch (true) {
      // S - Toggle Snapping
      case key === 's' && !modifierKey && !altKey && !shiftKey:
        toggleAlignment();
        break;

      // G - Toggle Grid
      case key === 'g' && !modifierKey && !altKey && !shiftKey:
        toggleGrid();
        break;

      // H - Toggle Guides (show/hide alignment guides)
      case key === 'h' && !modifierKey && !altKey && !shiftKey:
        if (alignmentConfig) {
          updateDrawingState({
            alignment: {
              config: { 
                ...alignmentConfig, 
                showCenterGuides: !alignmentConfig.showCenterGuides,
                showEdgeGuides: !alignmentConfig.showEdgeGuides,
                showSpacingGuides: !alignmentConfig.showSpacingGuides
              },
              activeGuides: [],
              draggingShapeId: null
            }
          });
        }
        break;

      // Shift - Temporarily disable snapping (hold)
      case shiftKey && !keysPressed.current.has('shift_handled'):
        keysPressed.current.add('shift_handled');
        toggleSnapTemporary(true);
        break;

      // Alt - Show all snap points (hold)
      case altKey && !keysPressed.current.has('alt_handled'):
        keysPressed.current.add('alt_handled');
        toggleShowAllSnapPoints(true);
        break;

      // Ctrl+; - Add horizontal guide at cursor
      case modifierKey && key === ';':
        createHorizontalGuide();
        break;

      // Ctrl+' - Add vertical guide at cursor  
      case modifierKey && key === '\'':
        createVerticalGuide();
        break;

      // Ctrl+Alt+G - Clear all guides
      case modifierKey && altKey && key === 'g':
        clearAllGuides();
        break;

      // Tab - Cycle snap types (when Alt is held)
      case altKey && key === 'tab':
        cycleSnapTypes();
        break;

      // Escape - Cancel any active guide operations
      case key === 'escape':
        clearAllGuides();
        break;
    }
  }, [enabled, preventDefaults, alignmentConfig, toggleAlignment, toggleGrid, 
      updateDrawingState, toggleSnapTemporary, toggleShowAllSnapPoints,
      createHorizontalGuide, createVerticalGuide, clearAllGuides, cycleSnapTypes]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const key = event.key.toLowerCase();
    const { shiftKey, altKey } = event;
    
    keysPressed.current.delete(key);

    // Handle modifier key releases
    if (!shiftKey && keysPressed.current.has('shift_handled')) {
      keysPressed.current.delete('shift_handled');
      toggleSnapTemporary(false);
    }

    if (!altKey && keysPressed.current.has('alt_handled')) {
      keysPressed.current.delete('alt_handled');
      toggleShowAllSnapPoints(false);
    }
  }, [enabled, toggleSnapTemporary, toggleShowAllSnapPoints]);

  // Window focus handlers to reset state
  const handleWindowBlur = useCallback(() => {
    keysPressed.current.clear();
    toggleSnapTemporary(false);
    toggleShowAllSnapPoints(false);
  }, [toggleSnapTemporary, toggleShowAllSnapPoints]);

  // Attach event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, handleKeyDown, handleKeyUp, handleWindowBlur]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      keysPressed.current.clear();
      toggleSnapTemporary(false);
      toggleShowAllSnapPoints(false);
    };
  }, [toggleSnapTemporary, toggleShowAllSnapPoints]);

  return {
    // Current state
    isShiftPressed: keysPressed.current.has('shift'),
    isAltPressed: keysPressed.current.has('alt'),
    
    // Manual control functions
    toggleAlignment,
    toggleGrid,
    clearAllGuides,
    cycleSnapTypes,
    createHorizontalGuide,
    createVerticalGuide,
    
    // Keyboard shortcuts reference
    shortcuts: {
      'S': 'Toggle Snapping',
      'G': 'Toggle Grid', 
      'H': 'Toggle All Guide Types',
      'Shift (hold)': 'Temporarily Disable Snapping',
      'Alt (hold)': 'Show All Snap Points',
      'Ctrl+;': 'Add Horizontal Guide',
      'Ctrl+\'': 'Add Vertical Guide',
      'Ctrl+Alt+G': 'Clear All Guides',
      'Alt+Tab': 'Cycle Snap Types',
      'Escape': 'Cancel Operations'
    }
  };
};

export default useAlignmentKeyboard;