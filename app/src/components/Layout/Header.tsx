import { useState } from 'react';
import {
  Download,
  Settings,
  HelpCircle,
  ChevronDown,
  Save,
  FolderOpen,
  FileText,
  Globe,
  MapPin,
} from 'lucide-react';
import { logger } from '../../utils/logger';

interface HeaderProps {
  projectName?: string;
  coordinateSystem?: string;
  currentCoordinates?: { x: number; y: number };
  units?: 'metric' | 'imperial';
  onUnitsToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName = 'Untitled Project',
  coordinateSystem = 'WGS84',
  currentCoordinates = { x: 0, y: 0 },
  units = 'metric',
  onUnitsToggle,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportOptions = [
    { label: 'PDF Report', format: 'pdf', icon: FileText },
    { label: 'DXF/CAD', format: 'dxf', icon: FileText },
    { label: 'Shapefile', format: 'shp', icon: Globe },
    { label: 'GeoJSON', format: 'geojson', icon: MapPin },
  ];

  return (
    <header className="panel border-b-0 rounded-none">
      <div className="panel-header border-b-0 bg-white">
        <div className="flex items-center justify-between">
          {/* Brand and Project Info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center">
                <img 
                  src="/favicon.png" 
                  alt="Land Visualizer" 
                  className="h-8 w-8 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-red-600">🚨 CHANGES ACTIVE - Land Visualizer 🚨</h1>
                <span className="text-xs text-red-500">🔥 NEW VERSION LOADING 🔥</span>
              </div>
            </div>

            {/* Project Info */}
            <div className="hidden md:flex items-center space-x-4 border-l border-neutral-200 pl-6">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-700">{projectName}</span>
                <span className="text-xs text-neutral-500">Coordinate System: {coordinateSystem}</span>
              </div>
            </div>
          </div>

          {/* Coordinate Display and Actions */}
          <div className="flex items-center space-x-4">
            {/* Live Coordinates */}
            <div className="hidden lg:flex items-center space-x-3 rounded-lg bg-neutral-50 px-3 py-2">
              <MapPin className="h-4 w-4 text-neutral-500" />
              <div className="flex flex-col text-xs">
                <span className="coordinate-display">
                  X: {currentCoordinates.x.toFixed(2)} {units === 'metric' ? 'm' : 'ft'}
                </span>
                <span className="coordinate-display">
                  Y: {currentCoordinates.y.toFixed(2)} {units === 'metric' ? 'm' : 'ft'}
                </span>
              </div>
            </div>

            {/* Units Toggle */}
            <button
              type="button"
              onClick={onUnitsToggle}
              className="btn-ghost text-xs font-mono px-2 py-1"
              title="Toggle units"
            >
              {units === 'metric' ? 'm' : 'ft'}
            </button>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button type="button" className="btn-ghost p-2" title="Open Project">
                <FolderOpen className="h-4 w-4" />
              </button>

              <button type="button" className="btn-ghost p-2" title="Save Project">
                <Save className="h-4 w-4" />
              </button>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl bg-white shadow-strong ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-2">
                    {exportOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.format}
                          type="button"
                          onClick={() => {
                            logger.log(`Export as ${option.format}`);
                            setShowExportMenu(false);
                          }}
                          className="flex w-full items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                          <Icon className="mr-3 h-4 w-4 text-neutral-400" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Settings and Help */}
            <div className="flex items-center space-x-1 border-l border-neutral-200 pl-4">
              <button type="button" className="btn-ghost p-2" title="Settings">
                <Settings className="h-4 w-4" />
              </button>

              <button type="button" className="btn-ghost p-2" title="Help & Documentation">
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};