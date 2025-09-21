import React from 'react';

interface SearchSectionProps {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

export function SearchSection({ value, onChange, onReset }: SearchSectionProps) {
  return (
    <div style={styles.searchSection}>
      <div style={styles.searchInput}>
        <input
          type="text"
          placeholder="Find objects..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.input}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          aria-label="Search reference objects"
        />
        <div style={styles.searchIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        {value && (
          <button
            style={styles.clearButton}
            onClick={onReset}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Clear search"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  searchSection: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    background: 'white'
  },

  searchInput: {
    position: 'relative' as const
  },

  searchIcon: {
    position: 'absolute' as const,
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    color: '#9ca3af'
  },

  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#f9fafb',
    outline: 'none',
    boxSizing: 'border-box' as const
  },

  clearButton: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px'
  }
};