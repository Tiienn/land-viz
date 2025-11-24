/**
 * Image Upload Step
 *
 * First step in boundary detection workflow.
 * Allows user to upload site plan image (PNG, JPG, PDF).
 *
 * Features:
 * - Drag-and-drop upload
 * - File type validation
 * - File size validation (max 10MB)
 * - Image preview
 */

import { useCallback, useState } from 'react';
import { tokens } from '../../styles/tokens';

interface ImageUploadStepProps {
  onImageLoaded: (image: HTMLImageElement, file: File) => void;
  onError: (error: string) => void;
}

export default function ImageUploadStep({
  onImageLoaded,
  onError,
}: ImageUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      onError(
        'Invalid file type. Please upload a PNG, JPG, or PDF file.'
      );
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      onError(
        'File is too large. Please upload an image smaller than 10MB.'
      );
      return false;
    }

    return true;
  };

  const loadImage = useCallback(
    async (file: File) => {
      setIsLoading(true);

      try {
        // Create image from file
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          setPreview(imageUrl);
          setIsLoading(false);
          onImageLoaded(img, file);
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          setIsLoading(false);
          onError('Failed to load image. Please try a different file.');
        };

        img.src = imageUrl;
      } catch (error) {
        setIsLoading(false);
        onError('Failed to load image. Please try again.');
      }
    },
    [onImageLoaded, onError]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        loadImage(file);
      }
    },
    [loadImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
  }, [preview]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: tokens.colors.neutral[900],
            marginBottom: '8px',
          }}
        >
          Upload Site Plan Image
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: tokens.colors.neutral[600],
            margin: 0,
          }}
        >
          Upload a site plan, CAD drawing, or property map to automatically
          detect boundaries
        </p>
      </div>

      {/* Upload Area */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${
              isDragging
                ? tokens.colors.brand.teal
                : tokens.colors.neutral[200]
            }`,
            borderRadius: '12px',
            padding: '60px 40px',
            textAlign: 'center',
            backgroundColor: isDragging
              ? 'rgba(0, 196, 204, 0.05)'
              : tokens.colors.background.secondary,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png,image/jpeg,image/jpg,application/pdf';
            input.onchange = handleFileInput;
            input.click();
          }}
        >
          {isLoading ? (
            <div>
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  animation: 'spin 1s linear infinite',
                }}
              >
                ⏳
              </div>
              <p
                style={{
                  fontSize: '16px',
                  color: tokens.colors.neutral[600],
                  margin: 0,
                }}
              >
                Loading image...
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: '64px',
                  marginBottom: '16px',
                }}
              >
                📁
              </div>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: tokens.colors.neutral[900],
                  marginBottom: '8px',
                }}
              >
                Drop image here or click to browse
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: tokens.colors.neutral[600],
                  marginBottom: '20px',
                }}
              >
                Supported formats: PNG, JPG, PDF
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: tokens.colors.neutral[500],
                  margin: 0,
                }}
              >
                Maximum file size: 10MB
              </p>
            </>
          )}
        </div>
      ) : (
        /* Preview */
        <div
          style={{
            border: `1px solid ${tokens.colors.neutral[200]}`,
            borderRadius: '12px',
            padding: '20px',
            backgroundColor: tokens.colors.background.secondary,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: tokens.colors.neutral[900],
                margin: 0,
              }}
            >
              Preview
            </p>
            <button
              onClick={handleRemove}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                color: tokens.colors.semantic.error,
                backgroundColor: 'transparent',
                border: `1px solid ${'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Remove
            </button>
          </div>
          <img
            src={preview}
            alt="Uploaded site plan"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'contain',
              borderRadius: '8px',
              backgroundColor: '#000',
            }}
          />
        </div>
      )}

      {/* Tips */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(0, 196, 204, 0.05)',
          border: `1px solid rgba(0, 196, 204, 0.2)`,
          borderRadius: '8px',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: tokens.colors.brand.teal,
            marginBottom: '8px',
          }}
        >
          💡 Tips for best results:
        </p>
        <ul
          style={{
            fontSize: '13px',
            color: tokens.colors.neutral[600],
            margin: 0,
            paddingLeft: '20px',
          }}
        >
          <li>Use high-contrast scans or exports (black lines on white background)</li>
          <li>Ensure boundaries are clearly visible and closed</li>
          <li>Higher resolution images (300+ DPI) work best</li>
          <li>Clean, straight boundaries are easier to detect</li>
        </ul>
      </div>
    </div>
  );
}
