import polygonClipping from 'polygon-clipping';
import type { Point2D, Shape } from '@/types';
import { precisionCalculator } from './precisionCalculations';

export interface BooleanResult {
  success: boolean;
  shapes: Shape[];
  totalArea: string;
  operation: string;
  timestamp: Date;
}

export interface SubdivisionSettings {
  method: 'parallel' | 'perpendicular' | 'radial' | 'custom';
  segments: number;
  setbackDistance: number; // in meters
  preserveOriginal: boolean;
}

export class BooleanOperationEngine {
  private static instance: BooleanOperationEngine;
  
  public static getInstance(): BooleanOperationEngine {
    if (!BooleanOperationEngine.instance) {
      BooleanOperationEngine.instance = new BooleanOperationEngine();
    }
    return BooleanOperationEngine.instance;
  }

  /**
   * Convert Point2D array to polygon-clipping coordinate format
   */
  private convertToPolygonFormat(points: Point2D[]): number[][] {
    return points.map(p => [p.x, p.y]);
  }

  /**
   * Convert polygon-clipping result back to Point2D array
   */
  private convertFromPolygonFormat(coordinates: number[][]): Point2D[] {
    return coordinates.map(([x, y]) => ({ x, y }));
  }

  /**
   * Generate unique ID for boolean operation results
   */
  private generateBooleanId(operation: string): string {
    return `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Union operation - combines multiple shapes into one
   */
  public union(shapes: Shape[]): BooleanResult {
    if (shapes.length < 2) {
      return {
        success: false,
        shapes: [],
        totalArea: '0',
        operation: 'union',
        timestamp: new Date()
      };
    }

    try {
      // Convert shapes to polygon format
      const polygons = shapes.map(shape => [this.convertToPolygonFormat(shape.points)]);
      
      // Perform union operation - using any to bypass complex polygon-clipping types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = polygonClipping.union(polygons[0] as any, ...(polygons.slice(1) as any));
      
      // Convert result back to shapes
      const resultShapes: Shape[] = result.map((polygon, index) => ({
        id: this.generateBooleanId('union'),
        type: 'polygon' as const,
        name: `Union Result ${index + 1}`,
        points: this.convertFromPolygonFormat(polygon[0]), // Take outer ring
        color: '#10B981', // Green for union results
        visible: true,
        layerId: 'default-layer', // Assign to default layer for boolean results
        created: new Date(),
        modified: new Date()
      }));

      // Calculate total area
      const totalArea = resultShapes.reduce((sum, shape) => {
        const measurement = precisionCalculator.calculateShapeMeasurements(shape);
        return sum + parseFloat(measurement.area.squareMeters);
      }, 0).toFixed(2);

      return {
        success: true,
        shapes: resultShapes,
        totalArea,
        operation: 'union',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Union operation failed:', error);
      return {
        success: false,
        shapes: [],
        totalArea: '0',
        operation: 'union',
        timestamp: new Date()
      };
    }
  }

  /**
   * Intersection operation - finds overlapping areas
   */
  public intersection(shapeA: Shape, shapeB: Shape): BooleanResult {
    try {
      const polygonA = [this.convertToPolygonFormat(shapeA.points)];
      const polygonB = [this.convertToPolygonFormat(shapeB.points)];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = polygonClipping.intersection(polygonA as any, polygonB as any);
      
      const resultShapes: Shape[] = result.map((polygon, index) => ({
        id: this.generateBooleanId('intersection'),
        type: 'polygon' as const,
        name: `Intersection ${index + 1}`,
        points: this.convertFromPolygonFormat(polygon[0]),
        color: '#F59E0B', // Amber for intersection
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      }));

      const totalArea = resultShapes.reduce((sum, shape) => {
        const measurement = precisionCalculator.calculateShapeMeasurements(shape);
        return sum + parseFloat(measurement.area.squareMeters);
      }, 0).toFixed(2);

      return {
        success: true,
        shapes: resultShapes,
        totalArea,
        operation: 'intersection',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Intersection operation failed:', error);
      return {
        success: false,
        shapes: [],
        totalArea: '0',
        operation: 'intersection',
        timestamp: new Date()
      };
    }
  }

  /**
   * Difference operation - subtracts one shape from another
   */
  public difference(minuend: Shape, subtrahend: Shape): BooleanResult {
    try {
      const polygonA = [this.convertToPolygonFormat(minuend.points)];
      const polygonB = [this.convertToPolygonFormat(subtrahend.points)];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = polygonClipping.difference(polygonA as any, polygonB as any);
      
      const resultShapes: Shape[] = result.map((polygon, index) => ({
        id: this.generateBooleanId('difference'),
        type: 'polygon' as const,
        name: `Difference ${index + 1}`,
        points: this.convertFromPolygonFormat(polygon[0]),
        color: '#EF4444', // Red for difference
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      }));

      const totalArea = resultShapes.reduce((sum, shape) => {
        const measurement = precisionCalculator.calculateShapeMeasurements(shape);
        return sum + parseFloat(measurement.area.squareMeters);
      }, 0).toFixed(2);

      return {
        success: true,
        shapes: resultShapes,
        totalArea,
        operation: 'difference',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Difference operation failed:', error);
      return {
        success: false,
        shapes: [],
        totalArea: '0',
        operation: 'difference',
        timestamp: new Date()
      };
    }
  }

  /**
   * XOR operation - finds areas that don't overlap
   */
  public exclusiveOr(shapeA: Shape, shapeB: Shape): BooleanResult {
    try {
      const polygonA = [this.convertToPolygonFormat(shapeA.points)];
      const polygonB = [this.convertToPolygonFormat(shapeB.points)];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = polygonClipping.xor(polygonA as any, polygonB as any);
      
      const resultShapes: Shape[] = result.map((polygon, index) => ({
        id: this.generateBooleanId('xor'),
        type: 'polygon' as const,
        name: `XOR ${index + 1}`,
        points: this.convertFromPolygonFormat(polygon[0]),
        color: '#8B5CF6', // Purple for XOR
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      }));

      const totalArea = resultShapes.reduce((sum, shape) => {
        const measurement = precisionCalculator.calculateShapeMeasurements(shape);
        return sum + parseFloat(measurement.area.squareMeters);
      }, 0).toFixed(2);

      return {
        success: true,
        shapes: resultShapes,
        totalArea,
        operation: 'xor',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('XOR operation failed:', error);
      return {
        success: false,
        shapes: [],
        totalArea: '0',
        operation: 'xor',
        timestamp: new Date()
      };
    }
  }

  /**
   * Property subdivision - splits a property into equal or specified segments
   */
  public subdivideProperty(shape: Shape, settings: SubdivisionSettings): BooleanResult {
    try {
      const { method, segments, setbackDistance } = settings;
      
      // Get shape measurements for calculations
      const measurements = precisionCalculator.calculateShapeMeasurements(shape);
      const centroid = measurements.centroid;
      
      let resultShapes: Shape[] = [];
      
      switch (method) {
        case 'parallel':
          resultShapes = this.parallelSubdivision(shape, segments, setbackDistance);
          break;
        case 'perpendicular':
          resultShapes = this.perpendicularSubdivision(shape, segments, setbackDistance);
          break;
        case 'radial':
          resultShapes = this.radialSubdivision(shape, segments, centroid, setbackDistance);
          break;
        case 'custom':
          // Custom subdivision logic would be implemented here
          resultShapes = this.parallelSubdivision(shape, segments, setbackDistance);
          break;
      }

      const totalArea = resultShapes.reduce((sum, shape) => {
        const measurement = precisionCalculator.calculateShapeMeasurements(shape);
        return sum + parseFloat(measurement.area.squareMeters);
      }, 0).toFixed(2);

      return {
        success: true,
        shapes: resultShapes,
        totalArea,
        operation: `subdivision_${method}`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Property subdivision failed:', error);
      return {
        success: false,
        shapes: [],
        totalArea: '0',
        operation: 'subdivision',
        timestamp: new Date()
      };
    }
  }

  /**
   * Parallel subdivision - creates parallel strips
   */
  private parallelSubdivision(shape: Shape, segments: number, setback: number): Shape[] {
    // Get bounding box
    const points = shape.points;
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    
    // Calculate strip width
    const totalWidth = maxX - minX - (2 * setback);
    const stripWidth = totalWidth / segments;
    
    const resultShapes: Shape[] = [];
    
    for (let i = 0; i < segments; i++) {
      const stripMinX = minX + setback + (i * stripWidth);
      const stripMaxX = stripMinX + stripWidth;
      
      // Create clipping rectangle
      const clipRectangle: Point2D[] = [
        { x: stripMinX, y: minY + setback },
        { x: stripMaxX, y: minY + setback },
        { x: stripMaxX, y: maxY - setback },
        { x: stripMinX, y: maxY - setback }
      ];
      
      // Create temporary shape for clipping
      const clipShape: Shape = {
        id: 'temp_clip',
        type: 'polygon',
        points: clipRectangle,
        name: 'Clip Rectangle',
        color: '#000000',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };
      
      // Perform intersection to get the subdivision
      const intersection = this.intersection(shape, clipShape);
      
      if (intersection.success && intersection.shapes.length > 0) {
        const subdivisionShape = {
          ...intersection.shapes[0],
          id: this.generateBooleanId('subdivision'),
          name: `Subdivision ${i + 1}`,
          color: `hsl(${(i * 360) / segments}, 70%, 60%)` // Different color for each subdivision
        };
        
        resultShapes.push(subdivisionShape);
      }
    }
    
    return resultShapes;
  }

  /**
   * Perpendicular subdivision - creates perpendicular strips
   */
  private perpendicularSubdivision(shape: Shape, segments: number, setback: number): Shape[] {
    // Similar to parallel but rotated 90 degrees
    const points = shape.points;
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    
    const totalHeight = maxY - minY - (2 * setback);
    const stripHeight = totalHeight / segments;
    
    const resultShapes: Shape[] = [];
    
    for (let i = 0; i < segments; i++) {
      const stripMinY = minY + setback + (i * stripHeight);
      const stripMaxY = stripMinY + stripHeight;
      
      const clipRectangle: Point2D[] = [
        { x: minX + setback, y: stripMinY },
        { x: maxX - setback, y: stripMinY },
        { x: maxX - setback, y: stripMaxY },
        { x: minX + setback, y: stripMaxY }
      ];
      
      const clipShape: Shape = {
        id: 'temp_clip',
        type: 'polygon',
        points: clipRectangle,
        name: 'Clip Rectangle',
        color: '#000000',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };
      
      const intersection = this.intersection(shape, clipShape);
      
      if (intersection.success && intersection.shapes.length > 0) {
        const subdivisionShape = {
          ...intersection.shapes[0],
          id: this.generateBooleanId('subdivision'),
          name: `Subdivision ${i + 1}`,
          color: `hsl(${(i * 360) / segments}, 70%, 60%)`
        };
        
        resultShapes.push(subdivisionShape);
      }
    }
    
    return resultShapes;
  }

  /**
   * Radial subdivision - creates pie-slice segments from center
   */
  private radialSubdivision(shape: Shape, segments: number, centroid: Point2D, setback: number): Shape[] {
    const resultShapes: Shape[] = [];
    const angleStep = (2 * Math.PI) / segments;
    
    // Calculate radius for creating sectors
    const points = shape.points;
    const maxDistance = Math.max(...points.map(p => 
      Math.sqrt(Math.pow(p.x - centroid.x, 2) + Math.pow(p.y - centroid.y, 2))
    )) - setback;
    
    for (let i = 0; i < segments; i++) {
      const startAngle = i * angleStep;
      const endAngle = (i + 1) * angleStep;
      
      // Create sector points
      const sectorPoints: Point2D[] = [centroid];
      
      // Add points along the arc
      const arcSegments = 20; // Resolution of the arc
      for (let j = 0; j <= arcSegments; j++) {
        const angle = startAngle + (j * (endAngle - startAngle)) / arcSegments;
        sectorPoints.push({
          x: centroid.x + Math.cos(angle) * maxDistance,
          y: centroid.y + Math.sin(angle) * maxDistance
        });
      }
      
      const sectorShape: Shape = {
        id: 'temp_sector',
        type: 'polygon',
        points: sectorPoints,
        name: 'Sector',
        color: '#000000',
        visible: true,
        layerId: 'default-layer',
        created: new Date(),
        modified: new Date()
      };
      
      const intersection = this.intersection(shape, sectorShape);
      
      if (intersection.success && intersection.shapes.length > 0) {
        const subdivisionShape = {
          ...intersection.shapes[0],
          id: this.generateBooleanId('subdivision'),
          name: `Sector ${i + 1}`,
          color: `hsl(${(i * 360) / segments}, 70%, 60%)`
        };
        
        resultShapes.push(subdivisionShape);
      }
    }
    
    return resultShapes;
  }
}

// Export singleton instance
export const booleanOperationEngine = BooleanOperationEngine.getInstance();