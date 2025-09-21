/**
 * Types for sports field markings system
 */

export type SportType = 'soccer' | 'basketball' | 'tennis' | 'football';

export interface FieldDimensions {
  length: number; // in meters
  width: number;  // in meters
}

export interface Point2D {
  x: number;
  y: number;
}

export interface LineMarking {
  start: Point2D;
  end: Point2D;
  width?: number;
}

export interface CircleMarking {
  center: Point2D;
  radius: number;
  filled?: boolean;
  strokeWidth?: number;
}

export interface ArcMarking {
  center: Point2D;
  radius: number;
  startAngle: number;
  endAngle: number;
  strokeWidth?: number;
}

export interface RectangleMarking {
  topLeft: Point2D;
  bottomRight: Point2D;
  filled?: boolean;
  strokeWidth?: number;
}

export interface FieldMarkingConfig {
  sport: SportType;
  standardDimensions: FieldDimensions;
  markings: {
    lines: LineMarking[];
    circles: CircleMarking[];
    arcs: ArcMarking[];
    rectangles: RectangleMarking[];
  };
  colors: {
    lines: string;
    fill?: string;
    background?: string;
  };
  lineWidth: number; // Standard line width as percentage of field width
}

export interface TextureOptions {
  resolution: 1024 | 2048 | 4096;
  antiAlias: boolean;
  format: 'png' | 'jpeg';
}

export interface CachedTexture {
  texture: any; // Three.js texture - using any to avoid import
  timestamp: number;
  usage: number;
}