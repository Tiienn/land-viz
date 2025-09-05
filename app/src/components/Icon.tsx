import React from 'react';

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
    console.warn(`Icon "${name}" not found`);
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