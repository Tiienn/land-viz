import React from 'react';
import {
  Home,
  Eye,
  Calculator,
  Zap,
  Layers,
  Upload,
  Image,
  Edit,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface LeftSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface SidebarTool {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const sidebarTools: SidebarTool[] = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      shortcut: 'H',
    },
    {
      id: 'visual-comparison',
      icon: Eye,
      label: 'Visual Comparison',
      shortcut: 'V',
    },
    {
      id: 'unit-converter',
      icon: Calculator,
      label: 'Unit Converter',
      shortcut: 'U',
    },
    {
      id: 'quick-tools',
      icon: Zap,
      label: 'Quick Tools',
      shortcut: 'Q',
    },
    {
      id: 'layers',
      icon: Layers,
      label: 'Layers',
      shortcut: 'L',
    },
    {
      id: 'uploads',
      icon: Upload,
      label: 'Uploads',
      shortcut: 'P',
    },
    {
      id: 'photos',
      icon: Image,
      label: 'Photos',
      shortcut: 'I',
    },
    {
      id: 'draw',
      icon: Edit,
      label: 'Draw',
      shortcut: 'D',
    },
    {
      id: 'projects',
      icon: FileText,
      label: 'Projects',
      shortcut: 'R',
    },
  ];

  return (
    <div className="w-16 bg-white border-r border-neutral-200 flex flex-col shadow-soft">
      {/* Navigation Tools */}
      <div className="flex-1 py-4">
        <nav className="space-y-1">
          {sidebarTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeSection === tool.id;
            
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSectionChange(tool.id)}
                className={`
                  w-full flex flex-col items-center justify-center py-3 px-2 relative group
                  transition-all duration-150 hover:bg-neutral-50
                  ${isActive 
                    ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-600' 
                    : 'text-neutral-600 hover:text-neutral-800'
                  }
                `}
                title={tool.label}
              >
                {/* Blue circle indicator for active state */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>
                )}
                
                <Icon className={`h-6 w-6 ${isActive ? 'text-primary-600' : ''}`} />
                
                <span className={`text-xs font-medium mt-1 leading-tight ${
                  isActive ? 'text-primary-600' : ''
                }`}>
                  {tool.label}
                </span>

                {/* Tooltip */}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-2 py-1 
                              bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                              transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                  {tool.label}
                  {tool.shortcut && (
                    <span className="ml-2 text-neutral-300">({tool.shortcut})</span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Help Button */}
      <div className="border-t border-neutral-200 py-2">
        <button
          type="button"
          className="w-full flex flex-col items-center justify-center py-3 px-2 text-neutral-400 
                   hover:text-neutral-600 hover:bg-neutral-50 transition-all duration-150 group"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-xs font-medium mt-1">Help</span>

          {/* Tooltip */}
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-2 py-1 
                        bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                        transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
            Help & Support
          </div>
        </button>
      </div>
    </div>
  );
};