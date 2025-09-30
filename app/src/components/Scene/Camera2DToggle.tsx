import React, { useMemo } from 'react';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';

export const Camera2DToggle: React.FC = () => {
  const is2DMode = useAppStore(state => state.viewState?.is2DMode || false);
  const zoom2D = useAppStore(state => state.viewState?.zoom2D || 1);

  const viewport = useThree(state => state.viewport);

  // Calculate orthographic camera bounds based on viewport
  const orthoBounds = useMemo(() => {
    const aspect = viewport.width / viewport.height;
    const viewSize = 100; // Base view size in world units
    const zoom = zoom2D || 1;

    return {
      left: -aspect * viewSize / (2 * zoom),
      right: aspect * viewSize / (2 * zoom),
      top: viewSize / (2 * zoom),
      bottom: -viewSize / (2 * zoom),
      near: -1000,
      far: 1000
    };
  }, [viewport.width, viewport.height, zoom2D]);

  return (
    <>
      <PerspectiveCamera
        makeDefault={!is2DMode}
        position={[0, 80, 80]}
        fov={75}
        near={0.1}
        far={10000}
      />
      <OrthographicCamera
        makeDefault={is2DMode}
        position={[0, 100, 0.1]} // Slightly offset Z to avoid z-fighting
        rotation={[-Math.PI / 2, 0, 0]} // Look straight down
        zoom={1}
        {...orthoBounds}
      />
    </>
  );
};

export default Camera2DToggle;