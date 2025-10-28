/**
 * EmptyState Component
 *
 * Canva-inspired empty states for panels and lists
 * - Clear messaging when no content
 * - Optional call-to-action
 * - Helpful illustrations/icons
 * - Maintains visual hierarchy
 */

import React from 'react';
import Icon from '../Icon';

interface EmptyStateProps {
  /** Icon name from Icon component */
  icon?: string;
  /** Main heading */
  title: string;
  /** Descriptive message */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon size */
  iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  iconSize = 48,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        color: '#6b7280',
      }}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div
          style={{
            marginBottom: '16px',
            opacity: 0.4,
          }}
        >
          <Icon name={icon} size={iconSize} color="#9ca3af" />
        </div>
      )}

      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#6b7280',
            maxWidth: '400px',
            lineHeight: '1.5',
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'linear-gradient(135deg, #00C4CC 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 196, 204, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 196, 204, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 196, 204, 0.15)';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Specific empty state variants for common scenarios
 */

export const NoLayersEmptyState: React.FC<{ onCreateClick?: () => void }> = ({
  onCreateClick,
}) => (
  <EmptyState
    icon="layers"
    title="No layers yet"
    description="Create your first shape to get started with your land visualization."
    action={
      onCreateClick
        ? {
            label: 'Create Shape',
            onClick: onCreateClick,
          }
        : undefined
    }
  />
);

export const NoSelectionEmptyState: React.FC = () => (
  <EmptyState
    icon="mouse-pointer"
    title="No selection"
    description="Select a shape to view and edit its properties."
  />
);

export const NoComparisonObjectsEmptyState: React.FC<{
  onAddClick?: () => void;
}> = ({ onAddClick }) => (
  <EmptyState
    icon="grid"
    title="No comparison objects"
    description="Add reference objects to compare sizes and visualize your land area."
    action={
      onAddClick
        ? {
            label: 'Add Object',
            onClick: onAddClick,
          }
        : undefined
    }
  />
);

export const SearchNoResultsEmptyState: React.FC<{ searchQuery: string }> = ({
  searchQuery,
}) => (
  <EmptyState
    icon="search"
    title="No results found"
    description={`No items match "${searchQuery}". Try adjusting your search.`}
    iconSize={40}
  />
);

export const ErrorEmptyState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Something went wrong', message, onRetry }) => (
  <EmptyState
    icon="alert-circle"
    title={title}
    description={message}
    action={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
          }
        : undefined
    }
  />
);

export default EmptyState;
