/**
 * ElementRenderer Component
 *
 * Phase 3: Text as Layers - Unified Element Rendering
 *
 * Renders all elements from the unified elements array, handling both
 * ShapeElements and TextElements with proper visibility, layering, and grouping.
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { isShapeElement, isTextElement } from '../../types';
import type { ShapeElement, TextElement, Element, Point2D } from '../../types';
import { ShapeElementRenderer } from './ShapeElementRenderer';
import { TextElementRenderer } from './TextElementRenderer';

interface ElementRendererProps {
  elevation?: number;
  hideDimensions?: boolean;
  renderShape?: (element: ShapeElement) => React.ReactNode;
  renderText?: (element: TextElement) => React.ReactNode;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  elevation = 0.01,
  hideDimensions = false,
  renderShape,
  renderText,
}) => {
  // Three.js context for coordinate conversion
  const { camera, raycaster, gl } = useThree();
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Get elements from unified array
  const elements = useAppStore(state => state.elements);
  const layers = useAppStore(state => state.layers);

  // Phase 4: Element drag state and actions
  const dragState = useAppStore(state => state.dragState);
  const selectedElementIds = useAppStore(state => state.selectedElementIds);
  const startElementDrag = useAppStore(state => state.startElementDrag);
  const updateElementDragPosition = useAppStore(state => state.updateElementDragPosition);
  const finishElementDrag = useAppStore(state => state.finishElementDrag);
  const selectElement = useAppStore(state => state.selectElement);
  const toggleElementSelection = useAppStore(state => state.toggleElementSelection);
  const enterResizeMode = useAppStore(state => state.enterResizeMode);
  const activeTool = useAppStore(state => state.drawing.activeTool);
  const openContextMenu = useAppStore(state => state.openContextMenu);

  // Convert screen coordinates to world coordinates
  const getWorldPosition = useCallback((clientX: number, clientY: number): Point2D | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();

    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersection = new THREE.Vector3();
    const hasIntersection = raycaster.ray.intersectPlane(groundPlane.current, intersection);

    if (hasIntersection) {
      return { x: intersection.x, y: intersection.z };
    }

    return null;
  }, [camera, raycaster, gl.domElement]);

  // Element click handler
  const handleElementClick = useCallback((elementId: string, elementType: 'shape' | 'text') => (event: any) => {
    event.stopPropagation();

    // Multi-selection with Shift key
    if (event.shiftKey) {
      toggleElementSelection(elementId);
      return; // Don't enter resize mode for multi-selection
    }

    // Single selection
    selectElement(elementId);

    // Automatically enter resize mode for shape elements when in select mode
    // CRITICAL: Only enter resize mode for single-element selection
    if (elementType === 'shape' && activeTool === 'select') {
      setTimeout(() => {
        const currentSelectedIds = useAppStore.getState().selectedElementIds;
        const isSingleSelection = !currentSelectedIds || currentSelectedIds.length <= 1;
        if (isSingleSelection) {
          enterResizeMode(elementId);
        }
      }, 0);
    }
  }, [selectElement, toggleElementSelection, enterResizeMode, activeTool]);

  // Context menu handler
  const handleElementContextMenu = useCallback((elementId: string, elementType: 'shape' | 'text') => (event: any) => {
    // Stop both Three.js event and native DOM event propagation
    event.stopPropagation();
    if (event.nativeEvent) {
      event.nativeEvent.preventDefault();
      event.nativeEvent.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
    }


    // Determine menu type based on selection and element type
    let menuType: 'shape' | 'text' | 'multi-selection' = elementType;

    if (elementType === 'shape') {
      const isMultiSelected = selectedElementIds.length > 1 && selectedElementIds.includes(elementId);
      menuType = isMultiSelected ? 'multi-selection' : 'shape';
    }

    openContextMenu(menuType, {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    }, elementId);
  }, [selectedElementIds, openContextMenu]);

  // Element pointer down - start drag
  const handleElementPointerDown = useCallback((elementId: string, elementType: 'shape' | 'text') => (event: any) => {
    if (event.button !== 0) return; // Only left mouse button

    event.stopPropagation();

    const worldPos = getWorldPosition(event.clientX, event.clientY);
    if (worldPos) {
      startElementDrag(elementId, elementType, worldPos);

      // Add global listeners for drag move and up
      const handleGlobalPointerMove = (e: PointerEvent) => {
        const newWorldPos = getWorldPosition(e.clientX, e.clientY);
        if (newWorldPos) {
          updateElementDragPosition(newWorldPos);
        }
      };

      const handleGlobalPointerUp = () => {
        finishElementDrag();
        document.removeEventListener('pointermove', handleGlobalPointerMove);
        document.removeEventListener('pointerup', handleGlobalPointerUp);
      };

      document.addEventListener('pointermove', handleGlobalPointerMove);
      document.addEventListener('pointerup', handleGlobalPointerUp);
    }
  }, [getWorldPosition, startElementDrag, updateElementDragPosition, finishElementDrag]);

  // Filter visible elements based on layer visibility
  // IMPORTANT: Check both element/layer visibility AND parent folder visibility recursively
  const visibleElements = useMemo(() => {
    // Helper function to check if layer is visible (including parent folders)
    const isLayerVisible = (layerId: string): boolean => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) return false;

      // Layer itself must be visible
      if (layer.visible === false) return false;

      // If layer has a parent folder, check parent visibility recursively
      if (layer.parentId) {
        return isLayerVisible(layer.parentId);
      }

      // No parent or all parents are visible
      return true;
    };

    // Safe fallback: elements might be undefined if migration hasn't run yet
    const filtered = (elements || []).filter(element => {
      // Check element visibility
      if (!element.visible) return false;

      // Check layer visibility (including parent folders)
      if (!isLayerVisible(element.layerId)) return false;

      return true;
    });

    return filtered;
  }, [elements, layers]);

  // Sort elements by layer order (layers rendered bottom-to-top)
  const sortedElements = useMemo(() => {
    return visibleElements.sort((a, b) => {
      const layerAIndex = layers.findIndex(l => l.id === a.layerId);
      const layerBIndex = layers.findIndex(l => l.id === b.layerId);

      // Higher index = rendered later (on top)
      return layerAIndex - layerBIndex;
    });
  }, [visibleElements, layers]);

  // Separate elements by type
  const { shapeElements, textElements } = useMemo(() => {
    const shapes: ShapeElement[] = [];
    const texts: TextElement[] = [];

    sortedElements.forEach(element => {
      if (isShapeElement(element)) {
        shapes.push(element);
      } else if (isTextElement(element)) {
        texts.push(element);
      }
    });

    return { shapeElements: shapes, textElements: texts };
  }, [sortedElements]);

  return (
    <group name="element-renderer">
      {/* Render shape elements */}
      {shapeElements.map(element => {
        // Use custom renderer if provided, otherwise use default ShapeElementRenderer
        if (renderShape) {
          return <React.Fragment key={element.id}>{renderShape(element)}</React.Fragment>;
        }

        // Compute element state
        const isSelected = selectedElementIds.includes(element.id);
        // MULTI-SELECTION FIX: Check if element is in draggedElementIds array
        const isDragging = dragState.isDragging && (
          dragState.draggedElementId === element.id ||
          dragState.draggedElementIds?.includes(element.id)
        );

        return (
          <ShapeElementRenderer
            key={element.id}
            element={element}
            elevation={elevation}
            hideDimensions={hideDimensions}
            isSelected={isSelected}
            isDragging={isDragging}
            onClick={handleElementClick(element.id, 'shape')}
            onPointerDown={isSelected ? handleElementPointerDown(element.id, 'shape') : undefined}
            onContextMenu={handleElementContextMenu(element.id, 'shape')}
          />
        );
      })}

      {/* Render text elements */}
      {textElements.map(element => {
        // Use custom renderer if provided, otherwise use default TextElementRenderer
        if (renderText) {
          return <React.Fragment key={element.id}>{renderText(element)}</React.Fragment>;
        }

        // Compute element state
        const isSelected = selectedElementIds.includes(element.id);

        // Create text-specific pointer down handler
        const handleTextPointerDown = (e: React.MouseEvent) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          e.preventDefault();

          // Convert React mouse event to world position
          const worldPos = getWorldPosition(e.clientX, e.clientY);
          if (worldPos) {
            startElementDrag(element.id, 'text', worldPos);

            const handleGlobalPointerMove = (event: PointerEvent) => {
              const newWorldPos = getWorldPosition(event.clientX, event.clientY);
              if (newWorldPos) {
                updateElementDragPosition(newWorldPos);
              }
            };

            const handleGlobalPointerUp = () => {
              finishElementDrag();
              document.removeEventListener('pointermove', handleGlobalPointerMove);
              document.removeEventListener('pointerup', handleGlobalPointerUp);
            };

            document.addEventListener('pointermove', handleGlobalPointerMove);
            document.addEventListener('pointerup', handleGlobalPointerUp);
          }
        };

        return (
          <TextElementRenderer
            key={element.id}
            element={element}
            isSelected={isSelected}
            onClick={handleElementClick(element.id, 'text')}
            onPointerDown={isSelected ? handleTextPointerDown : undefined}
            onContextMenu={handleElementContextMenu(element.id, 'text')}
          />
        );
      })}
    </group>
  );
};

export default ElementRenderer;
