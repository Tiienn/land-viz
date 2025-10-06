import React from 'react';
import { logger } from '../utils/logger';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Professional SVG icons designed for Land Visualizer
// Following Canva-inspired design principles: clean, rounded, stroke-based
const iconPaths: Record<string, React.ReactNode> = {
  // Left Panel Icons
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </>
  ),
  
  visualComparison: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6" />
      <path d="M12 17v6" />
      <path d="M4.22 4.22l1.42 1.42" />
      <path d="M18.36 18.36l1.42 1.42" />
      <path d="M1 12h6" />
      <path d="M17 12h6" />
      <path d="M4.22 19.78l1.42-1.42" />
      <path d="M18.36 5.64l1.42-1.42" />
    </>
  ),
  
  unitConverter: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <rect x="6" y="7" width="4" height="6" rx="1" />
      <rect x="14" y="7" width="4" height="6" rx="1" />
      <path d="M10 10h4" />
    </>
  ),
  
  quickTools: (
    <>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
    </>
  ),
  
  calculator: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="8" y="6" width="8" height="4" rx="1" />
      <rect x="6" y="12" width="2" height="2" rx="1" />
      <rect x="10" y="12" width="2" height="2" rx="1" />
      <rect x="14" y="12" width="2" height="2" rx="1" />
      <rect x="6" y="16" width="2" height="2" rx="1" />
      <rect x="10" y="16" width="2" height="2" rx="1" />
      <rect x="14" y="16" width="2" height="2" rx="1" />
      <rect x="6" y="20" width="2" height="2" rx="1" />
      <rect x="10" y="20" width="2" height="2" rx="1" />
      <rect x="14" y="20" width="2" height="2" rx="1" />
    </>
  ),
  
  layers: (
    <>
      <path d="M12 2l10 5-10 5L2 7l10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </>
  ),

  // Right Panel Icons
  landMetrics: (
    <>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-5 5" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="20" cy="4" r="1" />
    </>
  ),
  
  terrain: (
    <>
      <path d="M8 21l-2-1-1-5 1-5 1-2 2-1 2 1 1 2 1 5-1 5-2 1z" />
      <path d="M16 21l-1-1v-5l1-5v-2l1-1 1 1v2l1 5v5l-1 1-2-1z" />
      <path d="M12 21l-1-1v-5l1-5v-2l1-1 1 1v2l1 5v5l-1 1-2-1z" />
    </>
  ),
  
  dimensions: (
    <>
      <path d="M21 14H3l4-4h10l4 4z" />
      <path d="M21 19H3l4-4h10l4 4z" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="4" x2="9" y2="14" />
      <line x1="15" y1="4" x2="15" y2="14" />
    </>
  ),
  
  properties: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6" />
      <path d="M12 17v6" />
      <path d="M4.22 4.22l1.42 1.42" />
      <path d="M18.36 18.36l1.42 1.42" />
      <path d="M1 12h6" />
      <path d="M17 12h6" />
      <path d="M4.22 19.78l1.42-1.42" />
      <path d="M18.36 5.64l1.42-1.42" />
    </>
  ),

  // Alignment Icons
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),

  // Drawing Tool Icons
  select: (
    <>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </>
  ),

  rectangle: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </>
  ),

  circle: (
    <>
      <circle cx="12" cy="12" r="10" />
    </>
  ),

  polyline: (
    <>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </>
  ),

  line: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </>
  ),

  measure: (
    <>
      <path d="M3 12h18" />
      <path d="M3 6v12" />
      <path d="M21 6v12" />
      <path d="M7 8v8" />
      <path d="M11 8v8" />
      <path d="M15 8v8" />
    </>
  ),

  rotate: (
    <>
      <path d="M21.5 2v6h-6" />
      <path d="M2.5 22v-6h6" />
      <path d="M2 11.5a10 10 0 0 1 18.8-4.3" />
      <path d="M22 12.5a10 10 0 0 1-18.8 4.2" />
    </>
  ),

  edit: (
    <>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </>
  ),

  polygon: (
    <>
      <path d="M12 2l9 4.9V17L12 22l-9-5V6.9L12 2z" />
    </>
  ),

  // UI Icons
  keyboard: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01" />
      <path d="M10 8h.01" />
      <path d="M14 8h.01" />
      <path d="M18 8h.01" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
      <path d="M7 16h10" />
    </>
  ),

  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),

  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),

  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),

  // Context Menu Icons
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),

  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),

  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),

  unlock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </>
  ),

  group: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),

  'align-left': (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </>
  ),

  'align-right': (
    <>
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="12" x2="9" y2="12" />
      <line x1="21" y1="18" x2="6" y2="18" />
    </>
  ),

  'align-top': (
    <>
      <line x1="6" y1="3" x2="6" y2="21" transform="rotate(90 12 12)" />
      <line x1="12" y1="3" x2="12" y2="15" transform="rotate(90 12 12)" />
      <line x1="18" y1="3" x2="18" y2="18" transform="rotate(90 12 12)" />
    </>
  ),

  'align-bottom': (
    <>
      <line x1="6" y1="21" x2="6" y2="3" transform="rotate(90 12 12)" />
      <line x1="12" y1="21" x2="12" y2="9" transform="rotate(90 12 12)" />
      <line x1="18" y1="21" x2="18" y2="6" transform="rotate(90 12 12)" />
    </>
  ),

  'chevron-right': (
    <polyline points="9 18 15 12 9 6" />
  ),

  clipboard: (
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </>
  ),

  add: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),

  view: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),

  'distribute-h': (
    <>
      <rect x="4" y="8" width="4" height="8" />
      <rect x="10" y="8" width="4" height="8" />
      <rect x="16" y="8" width="4" height="8" />
    </>
  ),

  'distribute-v': (
    <>
      <rect x="8" y="4" width="8" height="4" />
      <rect x="8" y="10" width="8" height="4" />
      <rect x="8" y="16" width="8" height="4" />
    </>
  ),

  align: (
    <>
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </>
  ),

  distribute: (
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  )
};

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = 'currentColor', 
  strokeWidth = 2,
  className,
  style,
  ...props 
}) => {
  const iconContent = iconPaths[name];
  
  if (!iconContent) {
    logger.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {iconContent}
    </svg>
  );
};

export default Icon;