import type { Shape, Point2D } from '../types';
import type {
  ReferenceObject,
  ComparisonCalculations
} from '../types/referenceObjects';

export class ComparisonCalculator {
  /**
   * Calculate comparisons between land shapes and reference objects
   */
  static calculate(
    landShapes: Shape[],
    referenceObjects: ReferenceObject[]
  ): ComparisonCalculations {
    const totalArea = this.calculateTotalLandArea(landShapes);

    const objectComparisons = referenceObjects.map(obj => {
      const quantity = totalArea / obj.area;
      const ratio = totalArea / obj.area;

      return {
        objectId: obj.id,
        objectName: obj.name,
        quantityThatFits: Math.floor(quantity * 10) / 10, // Round to 1 decimal
        sizeRatio: Math.floor(ratio * 100) / 100, // Round to 2 decimals
        description: this.generateDescription(totalArea, obj),
        percentage: Math.floor((obj.area / totalArea) * 1000) / 10 // Round to 1 decimal
      };
    });

    return {
      totalLandArea: totalArea,
      objectComparisons: objectComparisons.sort((a, b) => b.sizeRatio - a.sizeRatio),
      lastCalculated: new Date()
    };
  }

  /**
   * Calculate total area of all shapes
   */
  private static calculateTotalLandArea(shapes: Shape[]): number {
    return shapes.reduce((total, shape) => {
      // Skip invisible shapes
      if (!shape.visible) return total;

      return total + this.calculateShapeArea(shape);
    }, 0);
  }

  /**
   * Calculate area of a single shape
   */
  private static calculateShapeArea(shape: Shape): number {
    switch (shape.type) {
      case 'rectangle':
        return this.calculateRectangleArea(shape.points);
      case 'circle':
        return this.calculateCircleArea(shape.points);
      case 'polygon':
      case 'polyline':
        return this.calculatePolygonArea(shape.points);
      default:
        return 0;
    }
  }

  /**
   * Calculate rectangle area from corner points
   */
  private static calculateRectangleArea(points: Point2D[]): number {
    if (points.length !== 4) return 0;

    // Calculate distances between adjacent points
    const width = this.distance(points[0], points[1]);
    const height = this.distance(points[1], points[2]);

    return width * height;
  }

  /**
   * Calculate circle area from center and radius points
   */
  private static calculateCircleArea(points: Point2D[]): number {
    if (points.length < 2) return 0;

    // Circle is defined by center and a point on circumference
    const radius = this.distance(points[0], points[1]);
    return Math.PI * radius * radius;
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private static calculatePolygonArea(points: Point2D[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Calculate distance between two points
   */
  private static distance(p1: Point2D, p2: Point2D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Generate human-readable description of size comparison
   */
  private static generateDescription(
    landArea: number,
    object: ReferenceObject
  ): string {
    const ratio = landArea / object.area;

    if (ratio >= 1) {
      if (ratio >= 100) {
        return `Your land is ${Math.floor(ratio)}x larger than ${this.articleFor(object.name)} ${object.name.toLowerCase()}`;
      } else if (ratio >= 10) {
        return `Your land is ${Math.floor(ratio * 10) / 10}x larger than ${this.articleFor(object.name)} ${object.name.toLowerCase()}`;
      } else {
        // For smaller ratios, show how many fit
        const fits = Math.floor(ratio * 10) / 10;
        if (fits === 1) {
          return `Your land is about the same size as ${this.articleFor(object.name)} ${object.name.toLowerCase()}`;
        } else {
          return `${fits} ${this.pluralize(object.name, fits)} fit in your land`;
        }
      }
    } else {
      const inverseRatio = object.area / landArea;
      if (inverseRatio >= 10) {
        return `${object.name} is ${Math.floor(inverseRatio)}x larger than your land`;
      } else {
        return `${object.name} is ${Math.floor(inverseRatio * 10) / 10}x larger than your land`;
      }
    }
  }

  /**
   * Get appropriate article (a/an) for a noun
   */
  private static articleFor(noun: string): string {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    return vowels.includes(noun[0].toLowerCase()) ? 'an' : 'a';
  }

  /**
   * Pluralize object name if needed
   */
  private static pluralize(name: string, count: number): string {
    if (count === 1) return name;

    // Handle special cases
    if (name.toLowerCase().includes('field')) {
      return name + 's';
    }
    if (name.toLowerCase().includes('court')) {
      return name + 's';
    }
    if (name.toLowerCase().includes('house')) {
      return name.replace(/house/i, 'houses');
    }
    if (name.toLowerCase().includes('space')) {
      return name + 's';
    }

    // Default: just add 's'
    return name + 's';
  }

  /**
   * Format area value with appropriate units
   */
  static formatArea(area: number, unit: 'metric' | 'imperial' = 'metric'): string {
    if (unit === 'metric') {
      if (area < 10000) {
        return `${Math.floor(area).toLocaleString()} m²`;
      } else {
        const hectares = area / 10000;
        return `${(Math.floor(hectares * 10) / 10).toLocaleString()} hectares`;
      }
    } else {
      // Convert to square feet
      const sqft = area * 10.764;
      if (sqft < 43560) {
        return `${Math.floor(sqft).toLocaleString()} ft²`;
      } else {
        const acres = sqft / 43560;
        return `${(Math.floor(acres * 100) / 100).toLocaleString()} acres`;
      }
    }
  }

  /**
   * Get a summary of comparisons for display
   */
  static getComparisonSummary(calculations: ComparisonCalculations | null): string {
    if (!calculations || calculations.objectComparisons.length === 0) {
      return 'Select reference objects to see comparisons';
    }

    const { objectComparisons } = calculations;

    // Find the most relevant comparison (closest to 1:1 ratio)
    const closest = objectComparisons.reduce((prev, curr) => {
      const prevDiff = Math.abs(1 - prev.sizeRatio);
      const currDiff = Math.abs(1 - curr.sizeRatio);
      return currDiff < prevDiff ? curr : prev;
    });

    if (closest.quantityThatFits >= 0.5 && closest.quantityThatFits <= 2) {
      return `Your land is about the size of ${closest.quantityThatFits.toFixed(1)} ${closest.objectName.toLowerCase()}`;
    } else if (closest.quantityThatFits > 2) {
      return `${closest.quantityThatFits.toFixed(1)} ${closest.objectName.toLowerCase()} would fit in your land`;
    } else {
      return `Your land is ${(1 / closest.quantityThatFits).toFixed(1)}x smaller than ${this.articleFor(closest.objectName)} ${closest.objectName.toLowerCase()}`;
    }
  }
}