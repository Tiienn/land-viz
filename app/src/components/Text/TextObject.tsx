/**
 * TextObject Component
 *
 * Renders a single text object in 3D space using drei's Html component.
 * Text always faces the camera (billboard effect).
 * Uses font loader for proper fallbacks.
 */

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { TextObject as TextObjectType } from '../../types/text';
import { getFontStack } from '../../utils/fontLoader';
import { useAppStore } from '../../store/useAppStore';

interface TextObjectProps {
  text: TextObjectType;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: (screenX: number, screenY: number) => void; // Double-click to edit text with screen coordinates
  onContextMenu?: (event: React.MouseEvent) => void; // Phase 7: Context menu support
}

export const TextObject: React.FC<TextObjectProps> = ({ text, isSelected, onClick, onDoubleClick, onContextMenu }) => {
  // Get view mode to adjust text rendering
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);

  // Phase 11: Use font stack with fallbacks
  const fontStack = useMemo(() => getFontStack(text.fontFamily), [text.fontFamily]);

  const textStyle = useMemo(() => ({
    fontFamily: fontStack,
    fontSize: `${text.fontSize}px`,
    color: text.color,
    textAlign: text.alignment as 'left' | 'center' | 'right',
    letterSpacing: `${text.letterSpacing / 100}em`,
    lineHeight: text.lineHeight,
    opacity: text.opacity ?? 1, // Text opacity (0-1)
    fontWeight: text.bold ? 'bold' : 'normal',
    fontStyle: text.italic ? 'italic' : 'normal',
    textDecoration: text.underline ? 'underline' : 'none',
    textTransform: text.uppercase ? 'uppercase' as const : 'none' as const,
    margin: 0,
    padding: text.backgroundColor ? '8px 12px' : 0,
    backgroundColor: text.backgroundColor
      ? `${text.backgroundColor}${Math.round((text.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
      : 'transparent',
    borderRadius: text.backgroundColor ? '6px' : 0,
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
    maxWidth: '400px',
    userSelect: 'none' as const,
    cursor: 'pointer',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    transition: 'all 200ms ease-out',
    // Phase 11: Improved text wrapping
    overflowWrap: 'break-word' as const,
    wordBreak: 'break-word' as const
  }), [text, isSelected, fontStack]);

  // Conditional rendering based on view mode
  // 2D mode: flat on ground (no billboard)
  // 3D mode: billboard facing camera from all angles

  if (is2DMode) {
    // 2D Mode: Flat text for orthographic top-down view
    // Convert plain newlines to <br> tags for rendering (whiteSpace: nowrap ignores \n)
    const contentWith2DBreaks = text.content.replace(/\n/g, '<br>');

    return (
      <Html
        position={[text.position.x, text.position.y, text.position.z]}
        center // Center the HTML element on the position
        occlude={false}
        zIndexRange={[1, 0]} // Scene-level z-index for proper layering below UI panels
        distanceFactor={2.5} // Lower value = smaller text (50% reduction again)
        style={{
          pointerEvents: text.locked ? 'none' : 'auto'
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            // CRITICAL: Set flag FIRST, synchronously, before any async operations
            // This prevents DrawingCanvas from deselecting text immediately after selection
            if ((window as any).__textClickedRef) {
              (window as any).__textClickedRef.current = true;
            }

            // Then select the text (may trigger React state updates)
            onClick?.();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDoubleClick?.(e.clientX, e.clientY);
          }}
          onPointerDown={(e) => {
            // Only stop propagation if text is NOT selected
            // This allows TextTransformControls to handle drag when selected
            if (!isSelected) {
              e.stopPropagation();
            }
            // Set flag for text click detection
            if ((window as any).__textClickedRef) {
              (window as any).__textClickedRef.current = true;
            }
          }}
          onContextMenu={onContextMenu}
          style={{
            ...textStyle,
            whiteSpace: 'nowrap', // CRITICAL: Prevent text wrapping in 2D mode
            maxWidth: 'none', // Remove width constraint
            writingMode: 'horizontal-tb' as const, // Force horizontal text rendering in 2D mode
            transform: `rotate(${text.rotation || 0}deg)`, // Apply text rotation in 2D mode
          }}
          dangerouslySetInnerHTML={{ __html: contentWith2DBreaks }}
        />

      </Html>
    );
  }

  // 3D Mode: Billboard text that faces camera from ALL angles including top-down
  return (
    <Html
      position={[text.position.x, text.position.y, text.position.z]}
      transform // Enable billboard - text always faces camera
      sprite // Enhanced billboard that works from all angles including top-down
      occlude={false}
      zIndexRange={[1, 0]} // Scene-level z-index for proper layering below UI panels
      distanceFactor={20} // Higher value for 3D viewing
      style={{
        transform: `rotate(${text.rotation}deg)`,
        pointerEvents: text.locked ? 'none' : 'auto'
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          // CRITICAL: Set flag FIRST, synchronously, before any async operations
          // This prevents DrawingCanvas from deselecting text immediately after selection
          if ((window as any).__textClickedRef) {
            (window as any).__textClickedRef.current = true;
          }

          // Then select the text (may trigger React state updates)
          onClick?.();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDoubleClick?.(e.clientX, e.clientY);
        }}
        onPointerDown={(e) => {
          // Only stop propagation if text is NOT selected
          // This allows TextTransformControls to handle drag when selected
          if (!isSelected) {
            e.stopPropagation();
          }
          // Set flag for text click detection
          if ((window as any).__textClickedRef) {
            (window as any).__textClickedRef.current = true;
          }
        }}
        onContextMenu={onContextMenu}
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: text.content }}
      />
    </Html>
  );
};
