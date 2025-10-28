import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTextStore } from '@/store/useTextStore';
import type { MenuItem } from '@/types/contextMenu';
import type { ContextMenuType } from '@/types/contextMenu';

export const useContextMenuItems = (
  type: ContextMenuType | null,
  targetShapeId?: string | null,
  targetTextId?: string | null
): MenuItem[] => {
  const {
    shapes,
    elements,
    selectedShapeIds,
    setActiveTool,
    deleteShape,
    duplicateShape,
    toggleViewMode,
    closeContextMenu,
    flipSelectedShapes,
    groupShapes,
    ungroupShapes,
    groupSelectedElements, // Phase 4: Unified grouping (shapes + text)
    ungroupSelectedElements // Phase 4: Unified ungrouping (shapes + text)
  } = useAppStore();

  // Phase 7: Text store actions
  const {
    texts,
    updateText,
    deleteText,
    selectText
  } = useTextStore();

  return useMemo(() => {
    if (!type) return [];

    if (type === 'canvas') {
      return [
        {
          id: 'paste',
          label: 'Paste',
          icon: 'clipboard',
          shortcut: 'Ctrl+V',
          disabled: true, // TODO: Check clipboard
          disabledReason: 'No shape to paste',
          action: () => {
            // TODO: Implement paste functionality
          },
        },
        { type: 'divider' },
        {
          id: 'add-shape',
          label: 'Add Shape',
          icon: 'add',
          submenu: [
            {
              id: 'add-rectangle',
              label: 'Rectangle',
              icon: 'rectangle',
              shortcut: 'R',
              action: () => setActiveTool('rectangle'),
            },
            {
              id: 'add-circle',
              label: 'Circle',
              icon: 'circle',
              shortcut: 'C',
              action: () => setActiveTool('circle'),
            },
            {
              id: 'add-polyline',
              label: 'Polyline',
              icon: 'polyline',
              shortcut: 'P',
              action: () => setActiveTool('polyline'),
            },
            {
              id: 'add-line',
              label: 'Line',
              icon: 'line',
              shortcut: 'L',
              action: () => setActiveTool('line'),
            },
          ],
        },
        { type: 'divider' },
        {
          id: 'view',
          label: 'View',
          icon: 'view',
          submenu: [
            {
              id: 'reset-camera',
              label: 'Reset Camera',
              shortcut: '0',
              action: () => {
                // Camera reset will be handled via App component's camera controller ref
                // Dispatch custom event that App component will listen to
                window.dispatchEvent(new CustomEvent('resetCamera'));
                closeContextMenu();
              },
            },
            {
              id: 'toggle-2d-3d',
              label: 'Toggle 2D/3D',
              shortcut: 'V',
              action: () => {
                toggleViewMode();
                closeContextMenu();
              },
            },
          ],
        },
      ];
    }

    if (type === 'shape') {
      // CRITICAL FIX: Check BOTH shapes and elements arrays during migration
      // Safe fallback: elements might be undefined if migration hasn't run yet
      const targetShape = shapes.find((s) => s.id === targetShapeId) ||
                          (elements || []).find((el) => el.id === targetShapeId && el.elementType === 'shape');

      const menuItems: MenuItem[] = [
        {
          id: 'duplicate',
          label: 'Duplicate',
          icon: 'copy',
          shortcut: 'Ctrl+D',
          action: () => {
            if (targetShapeId) {
              duplicateShape(targetShapeId);
              closeContextMenu();
            }
          },
        },
      ];

      // Add Ungroup option if this shape is part of a group
      if (targetShape?.groupId) {
        menuItems.push({
          id: 'ungroup',
          label: 'Ungroup',
          icon: 'ungroup',
          shortcut: 'Ctrl+Shift+G',
          action: () => {
            // Phase 4: Use unified function to support both shapes and text
            ungroupSelectedElements();
            closeContextMenu();
          },
        });
      }

      menuItems.push({ type: 'divider' });

      return [
        ...menuItems,
        {
          id: 'flip-horizontal',
          label: 'Flip Horizontally',
          icon: 'flipHorizontal',
          shortcut: 'Shift+H',
          action: () => {
            if (targetShapeId) {
              flipSelectedShapes('horizontal');
              closeContextMenu();
            }
          },
        },
        {
          id: 'flip-vertical',
          label: 'Flip Vertically',
          icon: 'flipVertical',
          shortcut: 'Shift+V',
          action: () => {
            if (targetShapeId) {
              flipSelectedShapes('vertical');
              closeContextMenu();
            }
          },
        },
        { type: 'divider' },
        {
          id: 'lock',
          label: targetShape?.locked ? 'Unlock Position' : 'Lock Position',
          icon: 'lock',
          action: () => {
            if (targetShapeId) {
              // Toggle lock state
              const { updateShape } = useAppStore.getState();
              updateShape(targetShapeId, { locked: !targetShape?.locked });
              closeContextMenu();
            }
          },
        },
        {
          id: 'properties',
          label: 'Properties',
          icon: 'settings',
          action: () => {
            // Open properties panel - this could be expanded later
            // For now, just select the shape to show properties
            const { selectShape } = useAppStore.getState();
            selectShape(targetShapeId || null);
            closeContextMenu();
          },
        },
        { type: 'divider' },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'trash',
          shortcut: 'Del',
          destructive: true,
          action: () => {
            if (targetShapeId) {
              deleteShape(targetShapeId);
              closeContextMenu();
            }
          },
        },
      ];
    }

    if (type === 'multi-selection') {
      const alignShapes = (direction: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
        const { shapes, elements, updateShape } = useAppStore.getState();
        // CRITICAL FIX: Check BOTH shapes and elements arrays during migration
        // Safe fallback: elements might be undefined if migration hasn't run yet
        const allShapes = [
          ...shapes,
          ...(elements || []).filter(el => el.elementType === 'shape').map(el => ({
            id: el.id,
            points: el.points
          }))
        ];
        const selectedShapes = allShapes.filter(s => selectedShapeIds.includes(s.id));

        if (selectedShapes.length < 2) return;

        // Calculate bounds for each shape
        const shapeBounds = selectedShapes.map(shape => {
          const points = shape.points;
          const minX = Math.min(...points.map(p => p.x));
          const maxX = Math.max(...points.map(p => p.x));
          const minY = Math.min(...points.map(p => p.y));
          const maxY = Math.max(...points.map(p => p.y));
          return { shape, minX, maxX, minY, maxY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
        });

        // Determine reference position
        let refValue: number;
        switch (direction) {
          case 'left':
            refValue = Math.min(...shapeBounds.map(b => b.minX));
            break;
          case 'right':
            refValue = Math.max(...shapeBounds.map(b => b.maxX));
            break;
          case 'top':
            refValue = Math.min(...shapeBounds.map(b => b.minY));
            break;
          case 'bottom':
            refValue = Math.max(...shapeBounds.map(b => b.maxY));
            break;
          case 'center-h':
            refValue = shapeBounds.reduce((sum, b) => sum + b.centerX, 0) / shapeBounds.length;
            break;
          case 'center-v':
            refValue = shapeBounds.reduce((sum, b) => sum + b.centerY, 0) / shapeBounds.length;
            break;
        }

        // Align each shape
        shapeBounds.forEach(({ shape, minX, maxX, minY, maxY, centerX, centerY }) => {
          let offsetX = 0, offsetY = 0;

          switch (direction) {
            case 'left':
              offsetX = refValue - minX;
              break;
            case 'right':
              offsetX = refValue - maxX;
              break;
            case 'top':
              offsetY = refValue - minY;
              break;
            case 'bottom':
              offsetY = refValue - maxY;
              break;
            case 'center-h':
              offsetX = refValue - centerX;
              break;
            case 'center-v':
              offsetY = refValue - centerY;
              break;
          }

          if (offsetX !== 0 || offsetY !== 0) {
            const newPoints = shape.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
            updateShape(shape.id, {
              points: newPoints,
              modified: new Date()
            });
          }
        });
      };

      const distributeShapes = (direction: 'horizontal' | 'vertical') => {
        const { shapes, elements, updateShape } = useAppStore.getState();
        // CRITICAL FIX: Check BOTH shapes and elements arrays during migration
        // Safe fallback: elements might be undefined if migration hasn't run yet
        const allShapes = [
          ...shapes,
          ...(elements || []).filter(el => el.elementType === 'shape').map(el => ({
            id: el.id,
            points: el.points
          }))
        ];
        const selectedShapes = allShapes.filter(s => selectedShapeIds.includes(s.id));

        if (selectedShapes.length < 3) return; // Need at least 3 shapes to distribute

        // Calculate centers
        const shapeData = selectedShapes.map(shape => {
          const points = shape.points;
          const minX = Math.min(...points.map(p => p.x));
          const maxX = Math.max(...points.map(p => p.x));
          const minY = Math.min(...points.map(p => p.y));
          const maxY = Math.max(...points.map(p => p.y));
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          return { shape, centerX, centerY };
        });

        // Sort by position
        if (direction === 'horizontal') {
          shapeData.sort((a, b) => a.centerX - b.centerX);
        } else {
          shapeData.sort((a, b) => a.centerY - b.centerY);
        }

        // Calculate even spacing
        const first = shapeData[0];
        const last = shapeData[shapeData.length - 1];
        const totalSpace = direction === 'horizontal'
          ? last.centerX - first.centerX
          : last.centerY - first.centerY;
        const spacing = totalSpace / (shapeData.length - 1);

        // Distribute shapes (skip first and last)
        shapeData.forEach((data, index) => {
          if (index === 0 || index === shapeData.length - 1) return; // Keep first and last in place

          const targetPos = direction === 'horizontal'
            ? first.centerX + spacing * index
            : first.centerY + spacing * index;

          const currentPos = direction === 'horizontal' ? data.centerX : data.centerY;
          const offset = targetPos - currentPos;

          const newPoints = data.shape.points.map(p =>
            direction === 'horizontal'
              ? { x: p.x + offset, y: p.y }
              : { x: p.x, y: p.y + offset }
          );

          updateShape(data.shape.id, {
            points: newPoints,
            modified: new Date()
          });
        });
      };

      // Check if any selected shapes are grouped
      const selectedShapes = shapes.filter(s => selectedShapeIds?.includes(s.id));
      const hasGroupedShapes = selectedShapes.some(s => s.groupId);

      const menuItems: MenuItem[] = [
        {
          id: 'group',
          label: 'Group',
          icon: 'group',
          shortcut: 'Ctrl+G',
          disabled: false, // Always enabled for multi-selection context menu
          action: () => {
            // Phase 4: Use unified function to support both shapes and text
            groupSelectedElements();
            closeContextMenu();
          },
        },
      ];

      // Only show Ungroup if at least one selected shape is grouped
      if (hasGroupedShapes) {
        menuItems.push({
          id: 'ungroup',
          label: 'Ungroup',
          icon: 'ungroup',
          shortcut: 'Ctrl+Shift+G',
          disabled: false,
          action: () => {
            // Phase 4: Use unified function to support both shapes and text
            ungroupSelectedElements();
            closeContextMenu();
          },
        });
      }

      menuItems.push({ type: 'divider' });

      return [
        ...menuItems,
        {
          id: 'flip-horizontal',
          label: 'Flip Horizontally',
          icon: 'flipHorizontal',
          shortcut: 'Shift+H',
          action: () => {
            flipSelectedShapes('horizontal');
            closeContextMenu();
          },
        },
        {
          id: 'flip-vertical',
          label: 'Flip Vertically',
          icon: 'flipVertical',
          shortcut: 'Shift+V',
          action: () => {
            flipSelectedShapes('vertical');
            closeContextMenu();
          },
        },
        { type: 'divider' },
        {
          id: 'align',
          label: 'Align',
          icon: 'align',
          submenu: [
            {
              id: 'align-left',
              label: 'Left',
              icon: 'align-left',
              shortcut: 'Ctrl+L',
              action: () => {
                alignShapes('left');
                closeContextMenu();
              },
            },
            {
              id: 'align-right',
              label: 'Right',
              icon: 'align-right',
              shortcut: 'Ctrl+R',
              action: () => {
                alignShapes('right');
                closeContextMenu();
              },
            },
            {
              id: 'align-top',
              label: 'Top',
              icon: 'align-top',
              shortcut: 'Ctrl+T',
              action: () => {
                alignShapes('top');
                closeContextMenu();
              },
            },
            {
              id: 'align-bottom',
              label: 'Bottom',
              icon: 'align-bottom',
              shortcut: 'Ctrl+B',
              action: () => {
                alignShapes('bottom');
                closeContextMenu();
              },
            },
          ],
        },
        {
          id: 'distribute',
          label: 'Distribute',
          icon: 'distribute',
          submenu: [
            {
              id: 'distribute-h',
              label: 'Horizontally',
              icon: 'distribute-h',
              shortcut: 'Ctrl+H',
              action: () => {
                distributeShapes('horizontal');
                closeContextMenu();
              },
            },
            {
              id: 'distribute-v',
              label: 'Vertically',
              icon: 'distribute-v',
              shortcut: 'Alt+V',
              action: () => {
                distributeShapes('vertical');
                closeContextMenu();
              },
            },
          ],
        },
        { type: 'divider' },
        {
          id: 'delete-all',
          label: 'Delete All',
          icon: 'trash',
          shortcut: 'Del',
          destructive: true,
          action: () => {
            selectedShapeIds.forEach(id => deleteShape(id));
            closeContextMenu();
          },
        },
      ];
    }

    // Phase 7: Text context menu
    if (type === 'text') {
      const targetText = texts.find((t) => t.id === targetTextId);

      return [
        {
          id: 'edit-text',
          label: 'Edit Text Content',
          icon: 'edit',
          shortcut: 'Enter',
          action: () => {
            if (targetTextId && targetText) {
              // Dispatch event to open text edit modal
              window.dispatchEvent(new CustomEvent('editTextObject', {
                detail: { textId: targetTextId }
              }));
              closeContextMenu();
            }
          },
        },
        {
          id: 'duplicate-text',
          label: 'Duplicate',
          icon: 'copy',
          shortcut: 'Ctrl+D',
          action: () => {
            if (targetText) {
              // Create duplicate text with offset
              const newText = {
                ...targetText,
                id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                position: {
                  x: targetText.position.x + 20,
                  y: targetText.position.y + 20,
                  z: targetText.position.z
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
              };

              const { addText } = useTextStore.getState();
              addText(newText);
              closeContextMenu();
            }
          },
        },
        { type: 'divider' },
        {
          id: 'lock-text',
          label: targetText?.locked ? 'Unlock Text' : 'Lock Text',
          icon: 'lock',
          action: () => {
            if (targetTextId && targetText) {
              updateText(targetTextId, { locked: !targetText.locked });
              closeContextMenu();
            }
          },
        },
        {
          id: 'toggle-visibility',
          label: targetText?.visible ? 'Hide Text' : 'Show Text',
          icon: 'eye',
          action: () => {
            if (targetTextId && targetText) {
              updateText(targetTextId, { visible: !targetText.visible });
              closeContextMenu();
            }
          },
        },
        { type: 'divider' },
        {
          id: 'text-properties',
          label: 'Text Properties',
          icon: 'settings',
          action: () => {
            // Select text to show properties panel
            if (targetTextId) {
              selectText(targetTextId);
              closeContextMenu();
            }
          },
        },
        { type: 'divider' },
        {
          id: 'delete-text',
          label: 'Delete',
          icon: 'trash',
          shortcut: 'Del',
          destructive: true,
          disabled: targetText?.locked,
          disabledReason: 'Text is locked',
          action: () => {
            if (targetTextId && !targetText?.locked) {
              deleteText(targetTextId);
              closeContextMenu();
            }
          },
        },
      ];
    }

    return [];
  }, [type, targetShapeId, targetTextId, shapes, elements, selectedShapeIds, texts, setActiveTool, deleteShape, duplicateShape, toggleViewMode, closeContextMenu, flipSelectedShapes, updateText, deleteText, selectText]);
};
