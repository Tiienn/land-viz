import * as THREE from 'three';
import { logger } from './logger';

/**
 * Dynamic geometry loader with lazy loading and caching
 * Prevents heavy 3D geometries from being included in the initial bundle
 */

export interface GeometryLoadResult {
  geometry: THREE.Group | THREE.Mesh | null;
  isLoading: boolean;
  error: string | null;
}

export interface GeometryLoaderOptions {
  enableCache?: boolean;
  maxCacheSize?: number;
  errorRetryCount?: number;
  loadTimeout?: number;
}

class GeometryLoaderService {
  private cache = new Map<string, THREE.Group | THREE.Mesh>();
  private loadingPromises = new Map<string, Promise<THREE.Group | THREE.Mesh>>();
  private options: Required<GeometryLoaderOptions>;
  private retryCount = new Map<string, number>();

  constructor(options: GeometryLoaderOptions = {}) {
    this.options = {
      enableCache: true,
      maxCacheSize: 50,
      errorRetryCount: 3,
      loadTimeout: 10000,
      ...options,
    };
  }

  /**
   * Dynamically loads a 3D geometry with lazy loading
   */
  async loadGeometry(geometryType: string, options: any = {}): Promise<THREE.Group | THREE.Mesh> {
    const cacheKey = `${geometryType}_${JSON.stringify(options)}`;

    // Return cached geometry if available
    if (this.options.enableCache && this.cache.has(cacheKey)) {
      logger.info('Geometry loaded from cache', { geometryType, cacheKey });
      return this.cache.get(cacheKey)!.clone();
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      logger.info('Geometry loading in progress, waiting...', { geometryType });
      return this.loadingPromises.get(cacheKey)!;
    }

    // Start new loading process
    const loadingPromise = this.loadGeometryInternal(geometryType, options, cacheKey);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const geometry = await loadingPromise;

      // Cache the result
      if (this.options.enableCache) {
        this.cacheGeometry(cacheKey, geometry);
      }

      // Clear loading promise
      this.loadingPromises.delete(cacheKey);

      // Reset retry count on success
      this.retryCount.delete(cacheKey);

      return geometry.clone();
    } catch (error) {
      // Clean up loading promise
      this.loadingPromises.delete(cacheKey);

      // Handle retry logic
      const currentRetries = this.retryCount.get(cacheKey) || 0;
      if (currentRetries < this.options.errorRetryCount) {
        this.retryCount.set(cacheKey, currentRetries + 1);
        logger.warn('Geometry loading failed, retrying...', {
          geometryType,
          attempt: currentRetries + 1,
          maxRetries: this.options.errorRetryCount
        });

        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetries)));
        return this.loadGeometry(geometryType, options);
      }

      logger.error('Geometry loading failed after all retries', { geometryType, error });
      throw error;
    }
  }

  /**
   * Internal geometry loading logic with dynamic imports
   */
  private async loadGeometryInternal(
    geometryType: string,
    options: any,
    cacheKey: string
  ): Promise<THREE.Group | THREE.Mesh> {

    const startTime = Date.now();
    logger.info('Starting geometry load', { geometryType, options });

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Geometry loading timeout: ${geometryType}`)), this.options.loadTimeout);
    });

    try {
      let geometryPromise: Promise<THREE.Group | THREE.Mesh>;

      // Dynamic import based on geometry type
      switch (geometryType) {
        case 'eiffel-tower':
          geometryPromise = this.loadEiffelTower(options);
          break;

        case 'statue-of-liberty':
          geometryPromise = this.loadStatueOfLiberty(options);
          break;

        case 'soccer-field':
          geometryPromise = this.loadSoccerField(options);
          break;

        case 'basketball-court':
          geometryPromise = this.loadBasketballCourt(options);
          break;

        case 'tennis-court':
          geometryPromise = this.loadTennisCourt(options);
          break;

        case 'house':
          geometryPromise = this.loadHouse(options);
          break;

        case 'parking-space':
          geometryPromise = this.loadParkingSpace(options);
          break;

        default:
          throw new Error(`Unknown geometry type: ${geometryType}`);
      }

      // Race between geometry loading and timeout
      const geometry = await Promise.race([geometryPromise, timeoutPromise]);

      const loadTime = Date.now() - startTime;
      logger.info('Geometry loaded successfully', {
        geometryType,
        loadTime: `${loadTime}ms`,
        triangles: this.getTriangleCount(geometry)
      });

      return geometry;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      logger.error('Geometry loading error', {
        geometryType,
        loadTime: `${loadTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Dynamic import for Eiffel Tower geometry
   */
  private async loadEiffelTower(options: any): Promise<THREE.Group> {
    const { EiffelTowerGeometry } = await import('../geometries/EiffelTowerGeometry');
    const tower = new EiffelTowerGeometry(options);
    return tower.build();
  }

  /**
   * Dynamic import for Statue of Liberty geometry
   */
  private async loadStatueOfLiberty(options: any): Promise<THREE.Group> {
    const { StatueOfLibertyGeometry } = await import('../geometries/StatueOfLibertyGeometry');
    const statue = new StatueOfLibertyGeometry(options);
    return statue.build();
  }

  /**
   * Dynamic import for field markings service
   */
  private async loadSoccerField(_options: any): Promise<THREE.Group> {
    const { getFieldMarkingsService } = await import('../services/FieldMarkingsService');
    const service = getFieldMarkingsService();
    const texture = service.generateFieldTexture('soccer');

    const group = new THREE.Group();
    if (texture) {
      const geometry = new THREE.PlaneGeometry(105, 68); // FIFA standard soccer field
      const material = new THREE.MeshLambertMaterial({ map: texture });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      group.add(plane);
    }
    return group;
  }

  private async loadBasketballCourt(_options: any): Promise<THREE.Group> {
    const { getFieldMarkingsService } = await import('../services/FieldMarkingsService');
    const service = getFieldMarkingsService();
    const texture = service.generateFieldTexture('basketball');

    const group = new THREE.Group();
    if (texture) {
      const geometry = new THREE.PlaneGeometry(28, 15); // NBA standard court
      const material = new THREE.MeshLambertMaterial({ map: texture });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      group.add(plane);
    }
    return group;
  }

  private async loadTennisCourt(_options: any): Promise<THREE.Group> {
    const { getFieldMarkingsService } = await import('../services/FieldMarkingsService');
    const service = getFieldMarkingsService();
    const texture = service.generateFieldTexture('tennis');

    const group = new THREE.Group();
    if (texture) {
      const geometry = new THREE.PlaneGeometry(23.77, 10.97); // ITF standard tennis court
      const material = new THREE.MeshLambertMaterial({ map: texture });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      group.add(plane);
    }
    return group;
  }

  /**
   * Simple geometric objects (no dynamic import needed)
   */
  private async loadHouse(_options: any): Promise<THREE.Group> {
    const group = new THREE.Group();

    // Simple house geometry
    const wallGeometry = new THREE.BoxGeometry(8, 3, 8);
    const roofGeometry = new THREE.ConeGeometry(6, 2, 4);

    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);

    walls.position.y = 1.5;
    roof.position.y = 4;
    roof.rotation.y = Math.PI / 4;

    group.add(walls);
    group.add(roof);

    return group;
  }

  private async loadParkingSpace(_options: any): Promise<THREE.Group> {
    const group = new THREE.Group();

    // Simple parking space outline
    const geometry = new THREE.PlaneGeometry(2.5, 5);
    const material = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.7
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;

    // Add lines for parking space boundaries
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.25, 0.01, -2.5),
      new THREE.Vector3(1.25, 0.01, -2.5),
      new THREE.Vector3(1.25, 0.01, 2.5),
      new THREE.Vector3(-1.25, 0.01, 2.5),
      new THREE.Vector3(-1.25, 0.01, -2.5),
    ]);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.Line(lineGeometry, lineMaterial);

    group.add(plane);
    group.add(line);

    return group;
  }

  /**
   * Cache management
   */
  private cacheGeometry(key: string, geometry: THREE.Group | THREE.Mesh): void {
    // Check cache size limit
    if (this.cache.size >= this.options.maxCacheSize) {
      // Remove oldest entry (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const oldGeometry = this.cache.get(firstKey);

        // Dispose of geometry resources
        if (oldGeometry) {
          this.disposeGeometry(oldGeometry);
        }
        this.cache.delete(firstKey);
      }

      logger.info('Cache size limit reached, removed oldest geometry', { removedKey: firstKey });
    }

    this.cache.set(key, geometry.clone());
    logger.info('Geometry cached', { key, cacheSize: this.cache.size });
  }

  /**
   * Utility methods
   */
  private getTriangleCount(object: THREE.Object3D): number {
    let triangles = 0;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        if (geometry.index) {
          triangles += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          triangles += geometry.attributes.position.count / 3;
        }
      }
    });

    return Math.floor(triangles);
  }

  private disposeGeometry(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  /**
   * Public methods for cache management
   */
  clearCache(): void {
    this.cache.forEach((geometry) => {
      this.disposeGeometry(geometry);
    });
    this.cache.clear();
    this.loadingPromises.clear();
    logger.info('Geometry cache cleared');
  }

  getCacheStats(): { size: number; maxSize: number; loadingCount: number } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxCacheSize,
      loadingCount: this.loadingPromises.size,
    };
  }
}

// Singleton instance
const geometryLoader = new GeometryLoaderService();

export { geometryLoader };

/**
 * React hook for loading geometries with state management
 */
export function useGeometryLoader(geometryType: string | null, options: any = {}): GeometryLoadResult {
  const [result, setResult] = React.useState<GeometryLoadResult>({
    geometry: null,
    isLoading: false,
    error: null,
  });

  React.useEffect(() => {
    if (!geometryType) {
      setResult({ geometry: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;

    setResult(prev => ({ ...prev, isLoading: true, error: null }));

    geometryLoader.loadGeometry(geometryType, options)
      .then((geometry) => {
        if (!cancelled) {
          setResult({ geometry, isLoading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setResult({
            geometry: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load geometry'
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [geometryType, JSON.stringify(options)]);

  return result;
}

// Add React import for the hook
import React from 'react';