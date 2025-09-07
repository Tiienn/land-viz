import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AlignmentGuides } from './AlignmentGuides';
import type { AlignmentGuide } from '../../services/alignmentService';


export const DraggableShapes: React.FC = () => {
  const alignmentGuides = useAppStore(state => state.drawing.alignment?.activeGuides || []);
  const alignmentConfig = useAppStore(state => state.drawing.alignment?.config);
  const isDragging = useAppStore(state => state.dragState.isDragging);

  // Render alignment guides
  return (
    <>
      {/* Temporarily disabled AlignmentGuides to remove the white 'm' square 
      <AlignmentGuides 
        guides={alignmentGuides}
        visible={alignmentConfig?.enabled && isDragging}
        showLabels={false}
      />
      */}
      
      {/* Note: Removed conflicting invisible meshes - using existing ShapeRenderer interaction */}
    </>
  );
};

export default DraggableShapes;