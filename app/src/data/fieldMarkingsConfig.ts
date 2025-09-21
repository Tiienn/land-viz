/**
 * Field markings configurations for different sports
 * All dimensions are in meters and follow official standards
 */

import type { FieldMarkingConfig } from '../types/fieldMarkings';

/**
 * FIFA regulation soccer field markings
 * Standard dimensions: 105m × 68m
 */
export const SOCCER_FIELD_CONFIG: FieldMarkingConfig = {
  sport: 'soccer',
  standardDimensions: {
    length: 105,
    width: 68
  },
  lineWidth: 0.12 / 68, // 12cm lines as percentage of field width
  colors: {
    lines: '#FFFFFF',
    fill: '#FFFFFF',
    background: '#2d8f47' // Soccer field green background
  },
  markings: {
    lines: [
      // Boundary lines (drawn as part of rectangles)

      // Halfway line
      { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },

      // Goal lines are part of penalty/goal area rectangles
    ],

    circles: [
      // Center circle
      { center: { x: 0.5, y: 0.5 }, radius: 9.15 / 105, filled: false, strokeWidth: 0.12 / 68 },

      // Center spot
      { center: { x: 0.5, y: 0.5 }, radius: 0.3 / 105, filled: true },

      // Penalty spots
      { center: { x: 11 / 105, y: 0.5 }, radius: 0.15 / 105, filled: true },
      { center: { x: (105 - 11) / 105, y: 0.5 }, radius: 0.15 / 105, filled: true }
    ],

    arcs: [
      // Penalty arcs (outside penalty area)
      // Left penalty arc
      {
        center: { x: 11 / 105, y: 0.5 },
        radius: 9.15 / 105,
        startAngle: -Math.asin(20.16 / 68 / (9.15 / 68)),
        endAngle: Math.asin(20.16 / 68 / (9.15 / 68)),
        strokeWidth: 0.12 / 68
      },
      // Right penalty arc
      {
        center: { x: (105 - 11) / 105, y: 0.5 },
        radius: 9.15 / 105,
        startAngle: Math.PI - Math.asin(20.16 / 68 / (9.15 / 68)),
        endAngle: Math.PI + Math.asin(20.16 / 68 / (9.15 / 68)),
        strokeWidth: 0.12 / 68
      },

      // Corner arcs
      { center: { x: 0, y: 0 }, radius: 1 / 105, startAngle: 0, endAngle: Math.PI / 2, strokeWidth: 0.12 / 68 },
      { center: { x: 1, y: 0 }, radius: 1 / 105, startAngle: Math.PI / 2, endAngle: Math.PI, strokeWidth: 0.12 / 68 },
      { center: { x: 0, y: 1 }, radius: 1 / 105, startAngle: -Math.PI / 2, endAngle: 0, strokeWidth: 0.12 / 68 },
      { center: { x: 1, y: 1 }, radius: 1 / 105, startAngle: Math.PI, endAngle: 3 * Math.PI / 2, strokeWidth: 0.12 / 68 }
    ],

    rectangles: [
      // Field boundary
      { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 }, filled: false, strokeWidth: 0.12 / 68 },

      // Left penalty area (18-yard box)
      {
        topLeft: { x: 0, y: (68 - 40.32) / 2 / 68 },
        bottomRight: { x: 16.5 / 105, y: (68 + 40.32) / 2 / 68 },
        filled: false,
        strokeWidth: 0.12 / 68
      },

      // Right penalty area
      {
        topLeft: { x: (105 - 16.5) / 105, y: (68 - 40.32) / 2 / 68 },
        bottomRight: { x: 1, y: (68 + 40.32) / 2 / 68 },
        filled: false,
        strokeWidth: 0.12 / 68
      },

      // Left goal area (6-yard box)
      {
        topLeft: { x: 0, y: (68 - 18.32) / 2 / 68 },
        bottomRight: { x: 5.5 / 105, y: (68 + 18.32) / 2 / 68 },
        filled: false,
        strokeWidth: 0.12 / 68
      },

      // Right goal area
      {
        topLeft: { x: (105 - 5.5) / 105, y: (68 - 18.32) / 2 / 68 },
        bottomRight: { x: 1, y: (68 + 18.32) / 2 / 68 },
        filled: false,
        strokeWidth: 0.12 / 68
      },

      // Left goal
      {
        topLeft: { x: -0.01, y: (68 - 7.32) / 2 / 68 },
        bottomRight: { x: 0, y: (68 + 7.32) / 2 / 68 },
        filled: false,
        strokeWidth: 0.12 / 68
      },

      // Right goal
      {
        topLeft: { x: 1, y: (68 - 7.32) / 2 / 68 },
        bottomRight: { x: 1.01, y: (68 + 7.32) / 2 / 68 },
        filled: false,
        strokeWidth: 0.12 / 68
      }
    ]
  }
};

/**
 * Basketball court markings (FIBA standard)
 * Standard dimensions: 28m × 15m
 */
export const BASKETBALL_COURT_CONFIG: FieldMarkingConfig = {
  sport: 'basketball',
  standardDimensions: {
    length: 28,
    width: 15
  },
  lineWidth: 0.05 / 15, // 5cm lines
  colors: {
    lines: '#FFFFFF',
    fill: '#FFFFFF',
    background: '#DEB887' // Basketball court maple hardwood color (Burlywood)
  },
  markings: {
    lines: [
      // Center line
      { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },

      // Free throw lines
      { start: { x: 5.8 / 28, y: (15 - 4.9) / 2 / 15 }, end: { x: 5.8 / 28, y: (15 + 4.9) / 2 / 15 } },
      { start: { x: (28 - 5.8) / 28, y: (15 - 4.9) / 2 / 15 }, end: { x: (28 - 5.8) / 28, y: (15 + 4.9) / 2 / 15 } }
    ],

    circles: [
      // Center circles
      { center: { x: 0.5, y: 0.5 }, radius: 1.8 / 28, filled: false, strokeWidth: 0.05 / 15 },
      { center: { x: 0.5, y: 0.5 }, radius: 0.6 / 28, filled: false, strokeWidth: 0.05 / 15 },

      // Free throw circles (semi-circles)
      { center: { x: 5.8 / 28, y: 0.5 }, radius: 1.8 / 28, filled: false, strokeWidth: 0.05 / 15 },
      { center: { x: (28 - 5.8) / 28, y: 0.5 }, radius: 1.8 / 28, filled: false, strokeWidth: 0.05 / 15 }
    ],

    arcs: [
      // Three-point lines
      {
        center: { x: 1.575 / 28, y: 0.5 },
        radius: 6.75 / 28,
        startAngle: -Math.acos(7.5 / 15 / (6.75 / 15)),
        endAngle: Math.acos(7.5 / 15 / (6.75 / 15)),
        strokeWidth: 0.05 / 15
      },
      {
        center: { x: (28 - 1.575) / 28, y: 0.5 },
        radius: 6.75 / 28,
        startAngle: Math.PI - Math.acos(7.5 / 15 / (6.75 / 15)),
        endAngle: Math.PI + Math.acos(7.5 / 15 / (6.75 / 15)),
        strokeWidth: 0.05 / 15
      }
    ],

    rectangles: [
      // Court boundary
      { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 }, filled: false, strokeWidth: 0.05 / 15 },

      // Left paint area (key)
      {
        topLeft: { x: 0, y: (15 - 4.9) / 2 / 15 },
        bottomRight: { x: 5.8 / 28, y: (15 + 4.9) / 2 / 15 },
        filled: false,
        strokeWidth: 0.05 / 15
      },

      // Right paint area
      {
        topLeft: { x: (28 - 5.8) / 28, y: (15 - 4.9) / 2 / 15 },
        bottomRight: { x: 1, y: (15 + 4.9) / 2 / 15 },
        filled: false,
        strokeWidth: 0.05 / 15
      }
    ]
  }
};

/**
 * Tennis court markings (ITF standard)
 * Standard dimensions: 23.77m × 10.97m (doubles)
 */
export const TENNIS_COURT_CONFIG: FieldMarkingConfig = {
  sport: 'tennis',
  standardDimensions: {
    length: 23.77,
    width: 10.97
  },
  lineWidth: 0.05 / 10.97, // 5cm lines
  colors: {
    lines: '#FFFFFF',
    fill: '#FFFFFF',
    background: '#1E8FD5' // Tennis court blue (US Open style)
  },
  markings: {
    lines: [
      // Net line
      { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },

      // Service lines
      { start: { x: 6.4 / 23.77, y: 1.37 / 10.97 }, end: { x: 6.4 / 23.77, y: (10.97 - 1.37) / 10.97 } },
      { start: { x: (23.77 - 6.4) / 23.77, y: 1.37 / 10.97 }, end: { x: (23.77 - 6.4) / 23.77, y: (10.97 - 1.37) / 10.97 } },

      // Center service line
      { start: { x: 6.4 / 23.77, y: 0.5 }, end: { x: (23.77 - 6.4) / 23.77, y: 0.5 } },

      // Singles sidelines
      { start: { x: 0, y: 1.37 / 10.97 }, end: { x: 1, y: 1.37 / 10.97 } },
      { start: { x: 0, y: (10.97 - 1.37) / 10.97 }, end: { x: 1, y: (10.97 - 1.37) / 10.97 } }
    ],

    circles: [],
    arcs: [],

    rectangles: [
      // Court boundary (doubles)
      { topLeft: { x: 0, y: 0 }, bottomRight: { x: 1, y: 1 }, filled: false, strokeWidth: 0.05 / 10.97 }
    ]
  }
};

// Export all configs for easy access
export const FIELD_MARKING_CONFIGS: Record<SportType, FieldMarkingConfig> = {
  soccer: SOCCER_FIELD_CONFIG,
  basketball: BASKETBALL_COURT_CONFIG,
  tennis: TENNIS_COURT_CONFIG,
  football: SOCCER_FIELD_CONFIG // Placeholder, will implement American football later
};