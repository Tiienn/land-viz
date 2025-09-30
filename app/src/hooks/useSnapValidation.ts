import { useMemo, useCallback } from 'react';
import type { SnapPoint, Point2D } from '../types';

interface UseSnapValidationProps {
  snapPoints: SnapPoint[];
  cursorPosition: Point2D | null;
  snapRadius: number;
  maxPoints?: number;
}

/**
 * Hook for validating snap point proximity and filtering
 * Provides reusable snap validation logic across components
 */
export const useSnapValidation = ({
  snapPoints,
  cursorPosition,
  snapRadius,
  maxPoints = 25
}: UseSnapValidationProps) => {

  /**
   * Validate if a snap point is within proximity of cursor
   */
  const validateProximity = useCallback((point: SnapPoint, cursor: Point2D): boolean => {
    const distance = Math.sqrt(
      Math.pow(cursor.x - point.position.x, 2) +
      Math.pow(cursor.y - point.position.y, 2)
    );
    return distance <= snapRadius;
  }, [snapRadius]);

  /**
   * Calculate distance between two points
   */
  const calculateDistance = useCallback((point1: Point2D, point2: Point2D): number => {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) +
      Math.pow(point1.y - point2.y, 2)
    );
  }, []);

  /**
   * Filter and validate snap points based on cursor proximity
   */
  const validSnapPoints = useMemo(() => {
    if (!snapPoints || !cursorPosition) return [];

    // Filter by proximity and sort by distance
    const proximityFiltered = snapPoints
      .filter(point => validateProximity(point, cursorPosition))
      .map(point => ({
        ...point,
        distance: calculateDistance(point.position, cursorPosition)
      }))
      .sort((a, b) => a.distance - b.distance) // Closest first
      .slice(0, maxPoints); // Limit for performance

    return proximityFiltered.map(({ distance, ...point }) => point);
  }, [snapPoints, cursorPosition, validateProximity, calculateDistance, maxPoints]);

  /**
   * Find the nearest valid snap point
   */
  const nearestSnapPoint = useMemo(() => {
    if (validSnapPoints.length === 0) return null;
    return validSnapPoints[0]; // Already sorted by distance
  }, [validSnapPoints]);

  /**
   * Check if cursor is near any snap points
   */
  const hasValidPoints = validSnapPoints.length > 0;

  /**
   * Get snap points by type
   */
  const getSnapPointsByType = useCallback((type: string) => {
    return validSnapPoints.filter(point => point.type === type);
  }, [validSnapPoints]);

  /**
   * Check if a specific snap type is available
   */
  const hasSnapType = useCallback((type: string): boolean => {
    return validSnapPoints.some(point => point.type === type);
  }, [validSnapPoints]);

  return {
    validSnapPoints,
    nearestSnapPoint,
    hasValidPoints,
    validateProximity,
    calculateDistance,
    getSnapPointsByType,
    hasSnapType,
    // Statistics
    totalPoints: snapPoints.length,
    validCount: validSnapPoints.length,
    filteringRatio: snapPoints.length > 0 ? validSnapPoints.length / snapPoints.length : 0
  };
};