import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { DrawingTool } from '@/types';

interface LayoutProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  snapToGrid: boolean;
  onSnapToggle: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTool,
  onToolChange,
  snapToGrid,
  onSnapToggle,
  children,
}) => {
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [currentCoordinates] = useState({ x: 123.45, y: 678.90 });

  return (
    <div className="flex h-screen flex-col bg-neutral-25">
      {/* Header with logo and project info */}
      <Header
        projectName="Land Visualizer Project"
        coordinateSystem="WGS84 / UTM Zone 33N"
        currentCoordinates={currentCoordinates}
        units={units}
        onUnitsToggle={() => setUnits(prev => prev === 'metric' ? 'imperial' : 'metric')}
      />
      
      {/* 🎯 RIBBON TOOLBAR - Now using the transformed Sidebar as horizontal ribbon */}
      <Sidebar
        activeTool={activeTool}
        onToolChange={onToolChange}
        snapToGrid={snapToGrid}
        onSnapToggle={onSnapToggle}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation - Coming Soon */}
        <div className="w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4">
          <div className="text-xs text-neutral-500 writing-vertical-rl rotate-180">Navigation</div>
        </div>
        
        {/* Central 3D Scene */}
        <main className="flex-1 relative bg-gradient-to-br from-teal-200 to-green-300">
          <div className="h-full w-full canvas-container">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="bg-white/90 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🎨 3D Canvas Ready</h2>
                <p className="text-gray-600">This is where the 3D scene will render</p>
              </div>
            </div>
            {children}
          </div>
        </main>
        
        {/* Right Properties Panel - Coming Soon */}
        <div className="w-16 bg-white border-l border-neutral-200 flex flex-col items-center py-4">
          <div className="text-xs text-neutral-500 writing-vertical-lr">Properties</div>
        </div>
      </div>
    </div>
  );
};