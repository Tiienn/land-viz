/**
 * Toast Notification System
 *
 * Canva-inspired toast notifications for success/error/info feedback
 * - Auto-dismiss after 3 seconds
 * - Manual dismiss option
 * - Stacking support for multiple toasts
 * - Smooth slide-in/fade-out animations
 */

import React, { useEffect, useState } from 'react';
import Icon from '../Icon';
import { tokens } from '../../styles/tokens';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // milliseconds, default 3000
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3000;

    // Start exit animation before removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300); // Start exit 300ms before removal

    // Remove toast
    const removeTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast, onDismiss]);

  const getToastStyles = () => {
    const baseStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing[3],
      padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      borderRadius: tokens.radius.md,
      boxShadow: tokens.shadows.lg,
      marginBottom: tokens.spacing[2],
      minWidth: '300px',
      maxWidth: '500px',
      animation: isExiting ? `fadeOut ${tokens.animation.timing.noticeable} ease-out` : `slideIn ${tokens.animation.timing.noticeable} ease-out`,
      fontSize: tokens.typography.body.size,
      fontWeight: tokens.typography.button.weight.toString(),
    };

    switch (toast.type) {
      case 'success':
        return {
          ...baseStyles,
          background: tokens.colors.semantic.success,
          color: 'white',
        };
      case 'error':
        return {
          ...baseStyles,
          background: tokens.colors.semantic.error,
          color: 'white',
        };
      case 'warning':
        return {
          ...baseStyles,
          background: tokens.colors.semantic.warning,
          color: 'white',
        };
      case 'info':
        return {
          ...baseStyles,
          background: tokens.colors.semantic.info,
          color: 'white',
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Icon name="check-circle" size={20} color="white" />;
      case 'error':
        return <Icon name="alert-circle" size={20} color="white" />;
      case 'warning':
        return <Icon name="warning" size={20} color="white" />;
      case 'info':
        return <Icon name="info" size={20} color="white" />;
      default:
        return null;
    }
  };

  return (
    <div style={getToastStyles()} role="alert" aria-live="polite">
      {getIcon()}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: tokens.spacing[1],
          display: 'flex',
          alignItems: 'center',
          opacity: 0.7,
          transition: `opacity ${tokens.animation.timing.smooth} ease`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
      >
        <Icon name="x" size={16} color="white" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px', // Below header
        right: tokens.spacing[5],
        zIndex: tokens.zIndex.toast,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};

/**
 * Toast Manager Hook
 *
 * Usage:
 * const { toasts, showToast, dismissToast } = useToast();
 *
 * showToast('success', 'Shape created successfully!');
 * showToast('error', 'Failed to export file');
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    dismissToast,
  };
};

export default ToastContainer;
