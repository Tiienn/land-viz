/**
 * Text Performance Monitoring
 *
 * Monitors text object count and provides performance warnings.
 */

import { logger } from './logger';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  TEXT_COUNT_WARNING: 50,
  TEXT_COUNT_CRITICAL: 100,
  LONG_TEXT_WARNING: 200,
  LONG_TEXT_CRITICAL: 400
} as const;

/**
 * Check text count performance and log warnings if needed
 *
 * @param textCount - Current number of text objects
 * @returns Performance warning level
 */
export function checkTextCountPerformance(textCount: number): {
  level: 'ok' | 'warning' | 'critical';
  message?: string;
} {
  if (textCount >= PERFORMANCE_THRESHOLDS.TEXT_COUNT_CRITICAL) {
    logger.warn('[TextPerformance] Critical: Too many text objects', {
      count: textCount,
      threshold: PERFORMANCE_THRESHOLDS.TEXT_COUNT_CRITICAL
    });
    return {
      level: 'critical',
      message: `Performance critical: ${textCount} text objects (recommended maximum: ${PERFORMANCE_THRESHOLDS.TEXT_COUNT_WARNING})`
    };
  }

  if (textCount >= PERFORMANCE_THRESHOLDS.TEXT_COUNT_WARNING) {
    logger.warn('[TextPerformance] Warning: Many text objects', {
      count: textCount,
      threshold: PERFORMANCE_THRESHOLDS.TEXT_COUNT_WARNING
    });
    return {
      level: 'warning',
      message: `Performance warning: ${textCount} text objects may impact performance`
    };
  }

  return { level: 'ok' };
}

/**
 * Check individual text content length and log warnings if needed
 *
 * @param content - Text content to check
 * @param textId - ID of text object for logging
 * @returns Performance warning level
 */
export function checkTextLengthPerformance(
  content: string,
  textId: string
): {
  level: 'ok' | 'warning' | 'critical';
  message?: string;
} {
  const length = content.length;

  if (length >= PERFORMANCE_THRESHOLDS.LONG_TEXT_CRITICAL) {
    logger.warn('[TextPerformance] Critical: Very long text content', {
      textId,
      length,
      threshold: PERFORMANCE_THRESHOLDS.LONG_TEXT_CRITICAL
    });
    return {
      level: 'critical',
      message: `Text is very long (${length} characters). Consider splitting into multiple text objects.`
    };
  }

  if (length >= PERFORMANCE_THRESHOLDS.LONG_TEXT_WARNING) {
    logger.info('[TextPerformance] Warning: Long text content', {
      textId,
      length,
      threshold: PERFORMANCE_THRESHOLDS.LONG_TEXT_WARNING
    });
    return {
      level: 'warning',
      message: `Text is quite long (${length} characters). This may impact rendering performance.`
    };
  }

  return { level: 'ok' };
}

/**
 * Get performance recommendations based on current text usage
 *
 * @param textCount - Total number of text objects
 * @param averageLength - Average text length
 * @returns Performance recommendations
 */
export function getPerformanceRecommendations(
  textCount: number,
  averageLength: number
): string[] {
  const recommendations: string[] = [];

  if (textCount > PERFORMANCE_THRESHOLDS.TEXT_COUNT_WARNING) {
    recommendations.push(
      'Consider grouping related text objects into a single multi-line text'
    );
    recommendations.push(
      'Use layer visibility to hide text objects when not needed'
    );
  }

  if (averageLength > PERFORMANCE_THRESHOLDS.LONG_TEXT_WARNING) {
    recommendations.push(
      'Keep text content concise for better rendering performance'
    );
    recommendations.push(
      'Split very long text into multiple paragraphs'
    );
  }

  if (textCount > PERFORMANCE_THRESHOLDS.TEXT_COUNT_CRITICAL) {
    recommendations.push(
      '⚠️ Critical: Delete unused text objects to improve performance'
    );
  }

  return recommendations;
}

/**
 * Calculate text statistics for performance monitoring
 *
 * @param texts - Array of text objects
 * @returns Text statistics
 */
export function calculateTextStatistics(texts: Array<{ content: string; visible: boolean }>): {
  total: number;
  visible: number;
  hidden: number;
  averageLength: number;
  totalCharacters: number;
} {
  const total = texts.length;
  const visible = texts.filter(t => t.visible).length;
  const hidden = total - visible;
  const totalCharacters = texts.reduce((sum, t) => sum + t.content.length, 0);
  const averageLength = total > 0 ? totalCharacters / total : 0;

  return {
    total,
    visible,
    hidden,
    averageLength: Math.round(averageLength),
    totalCharacters
  };
}
