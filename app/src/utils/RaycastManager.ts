import { Raycaster, Camera, Vector2, Vector3, Object3D } from 'three';
import type { Intersection } from 'three';

/**
 * Optimized raycasting manager with adaptive frequency and performance monitoring
 */
export class RaycastManager {
  private raycaster: Raycaster;
  private lastRaycast = 0;
  private baseInterval = 16; // ~60 FPS baseline
  private isDrawing = false;
  private snapEnabled = false;
  private performanceMode: 'low' | 'medium' | 'high' = 'high';
  
  constructor() {
    this.raycaster = new Raycaster();
  }

  /**
   * Determines if raycasting should be performed based on timing and activity
   */
  shouldRaycast(timestamp: number): boolean {
    // If this is the first raycast, allow it and set the timestamp
    if (this.lastRaycast === 0) {
      this.lastRaycast = timestamp;
      return true;
    }
    
    const timeSinceLastRaycast = timestamp - this.lastRaycast;
    
    // Adaptive frequency based on activity and performance mode
    let targetInterval: number;
    
    switch (this.performanceMode) {
      case 'low':
        targetInterval = this.isDrawing ? 32 : 50; // 30-20 FPS
        break;
      case 'medium':
        targetInterval = this.isDrawing ? 16 : 33; // 60-30 FPS
        break;
      case 'high':
      default:
        targetInterval = this.isDrawing ? 8 : // 120 FPS when actively drawing
                        this.snapEnabled ? 16 : // 60 FPS when snap enabled  
                        33; // 30 FPS for basic interactions
    }
    
    const shouldPerform = timeSinceLastRaycast >= targetInterval;
    
    // Update timestamp if raycast should be performed
    if (shouldPerform) {
      this.lastRaycast = timestamp;
    }
    
    return shouldPerform;
  }

  /**
   * Perform optimized raycasting with intersection filtering
   */
  performRaycast(
    camera: Camera, 
    mouse: Vector2, 
    targets: Object3D[],
    maxDistance?: number
  ): Intersection[] {
    this.lastRaycast = performance.now();
    this.raycaster.setFromCamera(mouse, camera);
    
    // Set max distance for performance if provided
    if (maxDistance !== undefined) {
      this.raycaster.far = maxDistance;
    }
    
    const intersections = this.raycaster.intersectObjects(targets, false);
    
    // Reset far distance
    this.raycaster.far = Infinity;
    
    return intersections;
  }

  /**
   * Fast ground plane intersection without full scene raycasting
   */
  intersectGroundPlane(
    camera: Camera, 
    mouse: Vector2, 
    groundY: number = 0
  ): Vector3 | null {
    this.lastRaycast = performance.now();
    this.raycaster.setFromCamera(mouse, camera);
    
    // Calculate intersection with ground plane (y = groundY)
    const ray = this.raycaster.ray;
    
    // If ray is parallel to ground plane, no intersection
    if (Math.abs(ray.direction.y) < 0.0001) {
      return null;
    }
    
    // Calculate t parameter for intersection
    const t = (groundY - ray.origin.y) / ray.direction.y;
    
    // If intersection is behind camera, no valid intersection
    if (t < 0) {
      return null;
    }
    
    // Calculate intersection point
    const intersectionPoint = new Vector3();
    intersectionPoint.copy(ray.origin).add(ray.direction.clone().multiplyScalar(t));
    
    return intersectionPoint;
  }

  /**
   * Update activity states for adaptive frequency
   */
  setDrawing(drawing: boolean): void {
    this.isDrawing = drawing;
  }

  setSnapEnabled(enabled: boolean): void {
    this.snapEnabled = enabled;
  }

  /**
   * Set performance mode based on system performance
   */
  setPerformanceMode(mode: 'low' | 'medium' | 'high'): void {
    this.performanceMode = mode;
  }

  /**
   * Get current raycasting statistics
   */
  getStats() {
    return {
      lastRaycast: this.lastRaycast,
      isDrawing: this.isDrawing,
      snapEnabled: this.snapEnabled,
      performanceMode: this.performanceMode
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Raycaster doesn't need explicit disposal, but we can reset state
    this.lastRaycast = 0;
    this.isDrawing = false;
    this.snapEnabled = false;
  }
}