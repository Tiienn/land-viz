import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '../../store/useAppStore';
import type { AlignmentGuide } from '../../services/alignmentService';

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
  visible?: boolean;
  showLabels?: boolean;
}

interface AnimatedGuide {
  guide: AlignmentGuide;
  opacity: number;
  targetOpacity: number;
  createdAt: number;
  line?: THREE.Line;
  label?: THREE.Sprite;
}

export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ 
  guides, 
  visible = true,
  showLabels = true
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [animatedGuides, setAnimatedGuides] = useState<Map<string, AnimatedGuide>>(new Map());

  // Enhanced guide materials with professional styling
  const guideMaterials = useMemo(() => {
    return {
      center: new THREE.LineDashedMaterial({
        color: '#06B6D4', // Cyan for center alignment
        dashSize: 3,
        gapSize: 2,
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false
      }),
      edge: new THREE.LineDashedMaterial({
        color: '#EC4899', // Pink for edge alignment (Canva-style)
        dashSize: 2,
        gapSize: 2,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
        depthTest: false,
        depthWrite: false
      }),
      spacing: new THREE.LineDashedMaterial({
        color: '#8B5CF6', // Purple for spacing alignment
        dashSize: 4,
        gapSize: 3,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.7,
        depthTest: false,
        depthWrite: false
      })
    };
  }, []);

  // Create animated label sprite with proper resource management
  const createLabelSprite = useMemo(() => {
    return (text: string, color: string): THREE.Sprite => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      const fontSize = 12;
      const padding = 4;
      
      // Set canvas dimensions (reduced for better performance)
      canvas.width = 64;
      canvas.height = 16;
      
      // Style the text
      context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Add subtle background
      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      context.fillStyle = color;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false; // Prevent mipmap generation for better performance
      
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      
      const sprite = new THREE.Sprite(material);
      
      // Add cleanup method to sprite for proper resource disposal
      (sprite as any).dispose = () => {
        if (material.map) {
          material.map.dispose();
        }
        material.dispose();
      };
      
      return sprite;
    };
  }, []);

  // Get material based on alignment type with dotted lines
  const getMaterial = (guide: AlignmentGuide): THREE.Material => {
    switch (guide.alignmentType) {
      case 'center':
        return new THREE.LineDashedMaterial({
          color: '#06B6D4', // Cyan for center alignment
          dashSize: 3,
          gapSize: 2,
          linewidth: 2,
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          depthWrite: false
        });
      case 'equal-spacing':
        return new THREE.LineDashedMaterial({
          color: '#8B5CF6', // Purple for spacing alignment
          dashSize: 4,
          gapSize: 3,
          linewidth: 1.5,
          transparent: true,
          opacity: 0.7,
          depthTest: false,
          depthWrite: false
        });
      case 'edge-start':
      case 'edge-end':
      default:
        return new THREE.LineDashedMaterial({
          color: '#EC4899', // Pink for edge alignment (Canva-style)
          dashSize: 2,
          gapSize: 2,
          linewidth: 2,
          transparent: true,
          opacity: 0.8,
          depthTest: false,
          depthWrite: false
        });
    }
  };

  // Animation frame handler for smooth fade effects
  useFrame((state, delta) => {
    if (!visible) return;
    
    setAnimatedGuides(prev => {
      const updated = new Map(prev);
      let hasChanges = false;
      
      // Update opacity animations
      updated.forEach((animatedGuide, id) => {
        const targetReached = Math.abs(animatedGuide.opacity - animatedGuide.targetOpacity) < 0.01;
        
        if (!targetReached) {
          const speed = 5; // Animation speed
          const diff = animatedGuide.targetOpacity - animatedGuide.opacity;
          animatedGuide.opacity += diff * speed * delta;
          
          // Update Three.js objects
          if (animatedGuide.line?.material) {
            (animatedGuide.line.material as THREE.Material).opacity = animatedGuide.opacity;
          }
          if (animatedGuide.label?.material) {
            animatedGuide.label.material.opacity = animatedGuide.opacity;
          }
          
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });
  });

  // Update animated guides when guides prop changes
  useEffect(() => {
    if (!visible) return;
    
    const currentTime = Date.now();
    const newAnimatedGuides = new Map(animatedGuides);
    
    // Mark existing guides for fade out
    newAnimatedGuides.forEach(animatedGuide => {
      if (!guides.find(g => g.id === animatedGuide.guide.id)) {
        animatedGuide.targetOpacity = 0;
      }
    });
    
    // Add or update guides
    guides.forEach(guide => {
      const existing = newAnimatedGuides.get(guide.id);
      
      if (existing) {
        // Update existing guide
        existing.guide = guide;
        existing.targetOpacity = 1;
      } else {
        // Create new animated guide
        newAnimatedGuides.set(guide.id, {
          guide,
          opacity: 0,
          targetOpacity: 1,
          createdAt: currentTime
        });
      }
    });
    
    setAnimatedGuides(newAnimatedGuides);
  }, [guides, visible]);

  // Update Three.js objects when animated guides change
  useEffect(() => {
    if (!groupRef.current || !visible) {
      // Debug logging removed to reduce console noise
      return;
    }

    // Clear existing objects
    groupRef.current.clear();

    // Debug logging removed to reduce console noise

    // Create and add new objects for each animated guide
    animatedGuides.forEach((animatedGuide, id) => {
      const { guide, opacity } = animatedGuide;
      
      // Debug logging removed to reduce console noise
      
      // Create guide line
      const geometry = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(guide.start.x, 0.05, guide.start.y),
        new THREE.Vector3(guide.end.x, 0.05, guide.end.y)
      ];
      geometry.setFromPoints(points);

      const material = getMaterial(guide).clone();
      material.opacity = opacity;
      
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      line.renderOrder = 999;
      
      // Debug logging removed to reduce console noise
      
      // Store reference for animation updates
      animatedGuide.line = line;
      groupRef.current!.add(line);

      // Create label if enabled and has description
      if (showLabels && guide.metadata?.description && opacity > 0.1) {
        const color = material.color.getHexString();
        const labelText = guide.alignmentType === 'equal-spacing' 
          ? `${guide.metadata.description} (${Math.round(guide.metadata.spacing || 0)}px)`
          : guide.metadata.description;
          
        const label = createLabelSprite(labelText, `#${color}`);
        label.material.opacity = opacity * 0.8;
        
        // Position label at midpoint
        const midPoint = {
          x: (guide.start.x + guide.end.x) / 2,
          y: (guide.start.y + guide.end.y) / 2
        };
        
        label.position.set(midPoint.x, 0.2, midPoint.y);
        label.scale.set(0.5, 0.25, 1);
        label.renderOrder = 1000;
        
        // Store reference for animation updates
        animatedGuide.label = label;
        groupRef.current!.add(label);
      }
    });

    // Cleanup function
    return () => {
      animatedGuides.forEach(animatedGuide => {
        if (animatedGuide.line?.geometry) {
          animatedGuide.line.geometry.dispose();
        }
        if (animatedGuide.line?.material) {
          (animatedGuide.line.material as THREE.Material).dispose();
        }
        if (animatedGuide.label) {
          // Use the custom dispose method if available
          if ((animatedGuide.label as any).dispose) {
            (animatedGuide.label as any).dispose();
          } else {
            // Fallback cleanup
            if (animatedGuide.label.material?.map) {
              animatedGuide.label.material.map.dispose();
            }
            if (animatedGuide.label.material) {
              animatedGuide.label.material.dispose();
            }
          }
        }
      });
    };
  }, [animatedGuides, visible, showLabels, getMaterial, createLabelSprite]);

  // Cleanup expired guides (fully faded out)
  useEffect(() => {
    const cleanup = () => {
      setAnimatedGuides(prev => {
        const updated = new Map();
        const currentTime = Date.now();
        
        prev.forEach((animatedGuide, id) => {
          // Keep guides that are visible or still fading
          if (animatedGuide.opacity > 0.01 || animatedGuide.targetOpacity > 0) {
            updated.set(id, animatedGuide);
          } else {
            // Dispose of expired guide resources
            if (animatedGuide.line?.geometry) {
              animatedGuide.line.geometry.dispose();
            }
            if (animatedGuide.line?.material) {
              (animatedGuide.line.material as THREE.Material).dispose();
            }
            if (animatedGuide.label?.material) {
              if (animatedGuide.label.material.map) {
                animatedGuide.label.material.map.dispose();
              }
              animatedGuide.label.material.dispose();
            }
          }
        });
        
        return updated.size !== prev.size ? updated : prev;
      });
    };

    const intervalId = setInterval(cleanup, 1000); // Cleanup every second
    return () => clearInterval(intervalId);
  }, []);

  if (!visible) return null;

  return <group ref={groupRef} />;
};

export default AlignmentGuides;