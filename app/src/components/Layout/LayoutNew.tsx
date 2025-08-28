import React from 'react';

interface LayoutNewProps {
  children: React.ReactNode;
}

export const LayoutNew: React.FC<LayoutNewProps> = ({ children }) => {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="bg-red-600 text-white p-4 mb-4 rounded-lg text-xl font-bold">
          🚨 NEW LAYOUT COMPONENT ACTIVE 🚨
        </div>
        <h1 className="text-4xl font-bold mb-4">Land Visualizer - New Layout</h1>
        <p className="text-xl mb-4">This confirms the new layout is loading!</p>
        <div className="bg-white/20 p-4 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};