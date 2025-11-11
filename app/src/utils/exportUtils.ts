/**
 * Trigger file download in browser using native approach
 */
export function downloadFile(blob: Blob, filename: string): void {
  // Validate blob
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('Invalid blob provided to downloadFile');
  }

  if (blob.size === 0) {
    throw new Error('Blob is empty (size = 0)');
  }

  // Create object URL from blob
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 * Format: land-viz-export-YYYYMMDD-HHmmss.pdf
 */
export function generateFilename(projectName?: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .split('.')[0]; // YYYYMMDD-HHmmss

  if (projectName) {
    const sanitized = sanitizeFilename(projectName);
    return `${sanitized}-export-${timestamp}.pdf`;
  }

  return `land-viz-export-${timestamp}.pdf`;
}

/**
 * Sanitize filename for safe download
 * Replaces invalid characters with hyphens
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .toLowerCase();
}

/**
 * Calculate total area of all shapes
 */
export function calculateTotalArea(shapes: Array<{ area?: number }>): number {
  return shapes.reduce((sum, shape) => sum + (shape.area || 0), 0);
}

/**
 * Get shape type breakdown (e.g., "3 rectangles, 2 circles")
 */
export function getShapeTypeBreakdown(shapes: Array<{ type: string }>): string {
  const counts: Record<string, number> = {};

  shapes.forEach(shape => {
    counts[shape.type] = (counts[shape.type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');
}

/**
 * Format area with appropriate unit
 */
export function formatArea(area: number, unit: string): string {
  return `${area.toFixed(2)} ${unit}`;
}
