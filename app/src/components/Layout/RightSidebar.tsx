import React from 'react';
import {
  BarChart3,
  Mountain,
  Ruler,
  Settings,
  Maximize2,
  Calendar,
} from 'lucide-react';

interface RightSidebarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

interface SidebarPanel {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  activePanel,
  onPanelChange,
}) => {
  const sidebarPanels: SidebarPanel[] = [
    {
      id: 'land-metrics',
      icon: BarChart3,
      label: 'Land Metrics',
    },
    {
      id: 'terrain',
      icon: Mountain,
      label: 'Terrain',
    },
    {
      id: 'dimensions',
      icon: Ruler,
      label: 'Dimensions',
    },
    {
      id: 'properties',
      icon: Settings,
      label: 'Properties',
    },
    {
      id: 'fullscreen',
      icon: Maximize2,
      label: 'Fullscreen',
    },
    {
      id: 'calendar',
      icon: Calendar,
      label: 'Calendar',
    },
  ];

  return (
    <div className="w-16 bg-white border-l border-neutral-200 flex flex-col shadow-soft">
      {/* Panel Tools */}
      <div className="flex-1 py-4">
        <nav className="space-y-1">
          {sidebarPanels.map((panel) => {
            const Icon = panel.icon;
            const isActive = activePanel === panel.id;
            
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => onPanelChange(panel.id)}
                className={`
                  w-full flex flex-col items-center justify-center py-3 px-2 relative group
                  transition-all duration-150 hover:bg-neutral-50
                  ${isActive 
                    ? 'text-primary-600 bg-primary-50 border-l-2 border-primary-600' 
                    : 'text-neutral-600 hover:text-neutral-800'
                  }
                `}
                title={panel.label}
              >
                {/* Blue circle indicator for active state */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-l-full"></div>
                )}
                
                <Icon className={`h-6 w-6 ${isActive ? 'text-primary-600' : ''}`} />
                
                <span className={`text-xs font-medium mt-1 leading-tight text-center ${
                  isActive ? 'text-primary-600' : ''
                }`}>
                  {panel.label}
                </span>

                {/* Tooltip */}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 px-2 py-1 
                              bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                              transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                  {panel.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};