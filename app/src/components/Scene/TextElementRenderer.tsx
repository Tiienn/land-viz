/**
 * TextElementRenderer Component
 *
 * Phase 3: Text as Layers - Text Element Rendering
 *
 * Renders a single TextElement from the unified elements array.
 * Wraps the TextObject component to work with TextElement type.
 */

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { TextElement } from '../../types';
import { getFontStack } from '../../utils/fontLoader';
import { useAppStore } from '../../store/useAppStore';

interface TextElementRendererProps {
  element: TextElement;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: (screenX: number, screenY: number) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  onPointerDown?: (event: React.MouseEvent) => void;
}

export const TextElementRenderer: React.FC<TextElementRendererProps> = ({
  element,
  isSelected,
  onClick,
  onDoubleClick,
  onContextMenu,
  onPointerDown
}) => {
  // Get view mode to adjust text rendering
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);

  // Use font stack with fallbacks
  const fontStack = useMemo(() => getFontStack(element.fontFamily), [element.fontFamily]);

  const textStyle = useMemo(() => ({
    fontFamily: fontStack,
    fontSize: `${element.fontSize}px`,
    color: element.color,
    textAlign: element.alignment as 'left' | 'center' | 'right',
    letterSpacing: `${element.letterSpacing / 100}em`,
    lineHeight: element.lineHeight,
    opacity: element.opacity ?? 1,
    fontWeight: element.bold ? 'bold' : 'normal',
    fontStyle: element.italic ? 'italic' : 'normal',
    textDecoration: element.underline ? 'underline' : 'none',
    textTransform: element.uppercase ? 'uppercase' as const : 'none' as const,
    margin: 0,
    padding: element.backgroundColor ? '8px 12px' : 0,
    backgroundColor: element.backgroundColor
      ? `${element.backgroundColor}${Math.round((element.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`
      : 'transparent',
    borderRadius: element.backgroundColor ? '6px' : 0,
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
    maxWidth: '400px',
    userSelect: 'none' as const,
    cursor: 'pointer',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    transition: 'all 200ms ease-out',
    overflowWrap: 'break-word' as const,
    wordBreak: 'break-word' as const
  }), [element, isSelected, fontStack]);

  // 2D Mode: Flat text for orthographic top-down view
  if (is2DMode) {
    return (
      <Html
        position={[element.position.x, element.z, element.position.y]}
        center
        occlude={false}
        zIndexRange={[1, 0]} // Scene-level z-index for proper layering below UI panels
        distanceFactor={2.5}
        style={{
          pointerEvents: element.locked ? 'none' : 'auto'
        }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            if ((window as any).__textClickedRef) {
              (window as any).__textClickedRef.current = true;
            }

            onClick?.();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDoubleClick?.(e.clientX, e.clientY);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if ((window as any).__textClickedRef) {
              (window as any).__textClickedRef.current = true;
            }
            onPointerDown?.(e);
          }}
          onContextMenu={onContextMenu}
          style={{
            ...textStyle,
            whiteSpace: 'nowrap',
            maxWidth: 'none',
            writingMode: 'horizontal-tb' as const
          }}
          dangerouslySetInnerHTML={{ __html: element.content }}
        />
      </Html>
    );
  }

  // 3D Mode: Billboard text that faces camera from all angles
  return (
    <Html
      position={[element.position.x, element.z, element.position.y]}
      transform
      sprite
      occlude={false}
      zIndexRange={[1, 0]} // Scene-level z-index for proper layering below UI panels
      distanceFactor={20}
      style={{
        transform: `rotate(${element.rotation}deg)`,
        pointerEvents: element.locked ? 'none' : 'auto'
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          if ((window as any).__textClickedRef) {
            (window as any).__textClickedRef.current = true;
          }

          onClick?.();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDoubleClick?.(e.clientX, e.clientY);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if ((window as any).__textClickedRef) {
            (window as any).__textClickedRef.current = true;
          }
          onPointerDown?.(e);
        }}
        onContextMenu={onContextMenu}
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: element.content }}
      />
    </Html>
  );
};

export default TextElementRenderer;
