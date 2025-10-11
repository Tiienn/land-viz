/**
 * UploadZone Component
 *
 * Drag-and-drop file upload zone for site plan images.
 *
 * Features:
 * - Drag-and-drop support
 * - Click to browse files
 * - File type and size validation
 * - Visual feedback (hover states, errors)
 * - Canva-inspired design
 *
 * @example
 * ```tsx
 * <UploadZone
 *   onFileSelect={(file) => handleFileUpload(file)}
 *   maxSize={10 * 1024 * 1024} // 10MB
 *   acceptedFormats={['image/jpeg', 'image/png', 'application/pdf']}
 * />
 * ```
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

// ============================================================================
// Types
// ============================================================================

interface UploadZoneProps {
  /** Callback when file is selected and validated */
  onFileSelect: (file: File) => void;

  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;

  /** Accepted MIME types (default: JPG, PNG, PDF) */
  acceptedFormats?: string[];

  /** Whether upload is disabled */
  disabled?: boolean;

  /** Additional CSS for container */
  style?: React.CSSProperties;
}

// ============================================================================
// Component
// ============================================================================

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'application/pdf'],
  disabled = false,
  style = {},
}) => {
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate file type and size
   * Returns error message or null if valid
   */
  const validateFile = (file: File): string | null => {
    // Check format
    if (!acceptedFormats.includes(file.type)) {
      const formats = acceptedFormats
        .map((mime) => {
          if (mime === 'image/jpeg') return 'JPG';
          if (mime === 'image/png') return 'PNG';
          if (mime === 'application/pdf') return 'PDF';
          return mime;
        })
        .join(', ');

      return `Unsupported file type "${file.type}". Please use: ${formats}`;
    }

    // Check size
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      const fileMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File too large (${fileMB}MB). Maximum size is ${maxMB}MB.`;
    }

    return null; // Valid
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle file selection (from drop or browse)
   */
  const handleFile = (file: File) => {
    if (disabled) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Valid file
    setError(null);
    onFileSelect(file);
  };

  /**
   * Drag enter - show drop zone active state
   */
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  /**
   * Drag leave - hide drop zone active state
   */
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if we're actually leaving the drop zone
    // (not just entering a child element)
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  /**
   * Drag over - required to allow drop
   */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Drop - handle file drop
   */
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]); // Only take first file
    }
  };

  /**
   * File input change - handle browse selection
   */
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Click handler - open file browser
   */
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // ============================================================================
  // Styles
  // ============================================================================

  const containerStyle: React.CSSProperties = {
    ...style,
  };

  const dropZoneStyle: React.CSSProperties = {
    border: isDragging ? '2px dashed #3b82f6' : '2px dashed #e5e7eb',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: isDragging
      ? '#eff6ff' // Light blue when dragging
      : disabled
      ? '#f9fafb' // Light gray when disabled
      : '#ffffff', // White normally
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
  };

  const iconColor = isDragging ? '#3b82f6' : disabled ? '#d1d5db' : '#9ca3af';

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '500',
    color: disabled ? '#9ca3af' : '#1f2937',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  };

  const infoStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9ca3af',
  };

  const errorStyle: React.CSSProperties = {
    marginTop: '12px',
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
    textAlign: 'left',
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div style={containerStyle}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={dropZoneStyle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload site plan image"
        aria-disabled={disabled}
      >
        {/* Upload Icon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ margin: '0 auto 16px', display: 'block' }}
        >
          {/* Cloud with arrow up */}
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        {/* Text */}
        <div style={titleStyle}>
          {isDragging ? 'Drop image here' : 'Drag site plan image here'}
        </div>

        <div style={subtitleStyle}>or click to browse files</div>

        <div style={infoStyle}>
          Supports: JPG, PNG, PDF • Max {Math.round(maxSize / (1024 * 1024))}MB
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={errorStyle} role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
        aria-label="File input"
      />
    </div>
  );
};

/**
 * Default export for convenience
 */
export default UploadZone;
