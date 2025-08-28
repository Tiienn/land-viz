import { Activity, Maximize2, Minimize2 } from 'lucide-react';
import type { DrawingTool } from '@/types';

interface StatusBarProps {
  activeTool: DrawingTool;
  coordinates: { x: number; y: number };
  units: 'metric' | 'imperial';
  snapToGrid: boolean;
  scale?: string;
  zoom?: string;
  status?: string;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeTool,
  coordinates,
  units,
  snapToGrid,
  scale = '1:1000',
  zoom = '100%',
  status = 'Ready',
  onFullscreenToggle,
  isFullscreen = false,
}) => {
  return (
    <div className="status-bar flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-primary-400" />
          <span className="text-xs">{status}</span>
        </div>
        
        <div className="flex items-center space-x-4 font-mono text-xs">
          <span>X: {coordinates.x.toFixed(2)}</span>
          <span>Y: {coordinates.y.toFixed(2)}</span>
          <span className="text-neutral-400">|</span>
          <span>{units === 'metric' ? 'meters' : 'feet'}</span>
        </div>
        
        <div className="text-xs">
          <span className="text-neutral-400">Tool:</span>
          <span className="ml-1 capitalize">{activeTool}</span>
        </div>

        <div className="text-xs">
          <span className="text-neutral-400">Grid:</span>
          <span className="ml-1">{snapToGrid ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-xs">
          <span className="text-neutral-400">Scale:</span>
          <span className="ml-1">{scale}</span>
        </div>
        
        <div className="text-xs">
          <span className="text-neutral-400">Zoom:</span>
          <span className="ml-1">{zoom}</span>
        </div>

        {onFullscreenToggle && (
          <button
            type="button"
            onClick={onFullscreenToggle}
            className="btn-ghost p-1 text-xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};