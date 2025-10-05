/**
 * Input sanitization and validation utilities
 * Prevents injection attacks and ensures data integrity
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 *
 * @param input - Raw string input
 * @param options - Sanitization options
 * @returns Sanitized string
 *
 * @example
 * const clean = sanitizeString('<script>alert("xss")</script>');
 * // Returns: 'scriptalert("xss")/script' (tags removed)
 */
export function sanitizeString(
  input: string,
  options: {
    /** Maximum allowed length */
    maxLength?: number;
    /** Allow HTML tags */
    allowHTML?: boolean;
    /** Trim whitespace */
    trim?: boolean;
  } = {}
): string {
  const {
    maxLength = 1000,
    allowHTML = false,
    trim = true
  } = options;

  let sanitized = input;

  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove HTML tags if not allowed
  if (!allowHTML) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate and sanitize numeric input
 *
 * @param input - Input value (string or number)
 * @param options - Validation options
 * @returns Sanitized number or null if invalid
 *
 * @example
 * const num = sanitizeNumber('42.5', { min: 0, max: 100 });
 * // Returns: 42.5
 *
 * const invalid = sanitizeNumber('abc', { min: 0 });
 * // Returns: null
 */
export function sanitizeNumber(
  input: string | number,
  options: {
    /** Minimum allowed value */
    min?: number;
    /** Maximum allowed value */
    max?: number;
    /** Allow decimal values */
    allowDecimals?: boolean;
    /** Default value if invalid */
    defaultValue?: number;
  } = {}
): number | null {
  const {
    min,
    max,
    allowDecimals = true,
    defaultValue = null
  } = options;

  // Convert to number
  const num = typeof input === 'string' ? parseFloat(input) : input;

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  // Check decimal restriction
  if (!allowDecimals && !Number.isInteger(num)) {
    return defaultValue;
  }

  // Check min/max bounds
  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Validate email format
 *
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize filename by removing path traversal characters
 *
 * @param filename - Raw filename
 * @returns Safe filename
 *
 * @example
 * const safe = sanitizeFilename('../../../etc/passwd');
 * // Returns: 'etcpasswd'
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '') // Remove invalid filename chars
    .replace(/^\.+/, '') // Remove leading dots (path traversal)
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255); // Limit filename length
}

/**
 * Validate URL format and protocol
 *
 * @param url - URL to validate
 * @param options - Validation options
 * @returns true if valid URL
 */
export function isValidURL(
  url: string,
  options: {
    /** Allowed protocols */
    allowedProtocols?: string[];
  } = {}
): boolean {
  const { allowedProtocols = ['http:', 'https:'] } = options;

  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize object by validating all properties
 *
 * @param obj - Object to sanitize
 * @param schema - Validation schema
 * @returns Sanitized object or null if validation fails
 *
 * @example
 * const clean = sanitizeObject(
 *   { name: 'John', age: '25', role: '<admin>' },
 *   {
 *     name: { type: 'string', maxLength: 50 },
 *     age: { type: 'number', min: 0, max: 150 },
 *     role: { type: 'string', maxLength: 20 }
 *   }
 * );
 * // Returns: { name: 'John', age: 25, role: 'admin' }
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: unknown,
  schema: Record<string, {
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    maxLength?: number;
    min?: number;
    max?: number;
  }>
): T | null {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return null;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = (obj as Record<string, unknown>)[key];

    // Check required fields
    if (rules.required && (value === undefined || value === null)) {
      return null;
    }

    // Skip undefined optional fields
    if (value === undefined || value === null) {
      continue;
    }

    // Type-specific validation
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          return null;
        }
        sanitized[key] = sanitizeString(value, {
          maxLength: rules.maxLength
        });
        break;

      case 'number':
        const numValue = sanitizeNumber(value, {
          min: rules.min,
          max: rules.max
        });
        if (numValue === null) {
          return null;
        }
        sanitized[key] = numValue;
        break;

      case 'boolean':
        sanitized[key] = Boolean(value);
        break;
    }
  }

  return sanitized as T;
}

/**
 * Validate array length and content
 *
 * @param arr - Array to validate
 * @param options - Validation options
 * @returns true if valid
 */
export function isValidArray<T>(
  arr: unknown,
  options: {
    /** Minimum array length */
    minLength?: number;
    /** Maximum array length */
    maxLength?: number;
    /** Item validator function */
    itemValidator?: (item: unknown) => boolean;
  } = {}
): arr is T[] {
  const { minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, itemValidator } = options;

  if (!Array.isArray(arr)) {
    return false;
  }

  if (arr.length < minLength || arr.length > maxLength) {
    return false;
  }

  if (itemValidator) {
    return arr.every(itemValidator);
  }

  return true;
}

/**
 * Sanitize JSON input with size limits
 *
 * @param jsonString - JSON string to parse
 * @param options - Parsing options
 * @returns Parsed object or null if invalid
 */
export function sanitizeJSON<T>(
  jsonString: string,
  options: {
    /** Maximum JSON size in bytes */
    maxSize?: number;
  } = {}
): T | null {
  const { maxSize = 5 * 1024 * 1024 } = options; // 5MB default

  // Check size limit
  if (jsonString.length > maxSize) {
    return null;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param text - Text to escape
 * @returns HTML-safe text
 */
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Validate Point2D coordinates
 *
 * @param point - Point to validate
 * @returns true if valid Point2D
 */
export function isValidPoint2D(point: unknown): point is { x: number; y: number } {
  if (!point || typeof point !== 'object') {
    return false;
  }

  const p = point as Record<string, unknown>;

  return (
    typeof p.x === 'number' &&
    typeof p.y === 'number' &&
    isFinite(p.x) &&
    isFinite(p.y)
  );
}
