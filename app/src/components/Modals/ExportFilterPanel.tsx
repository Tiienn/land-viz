import React from 'react';
import type { ExportFilters, FilterCategory } from '../../types/export';
import { FILTER_CATEGORIES } from '../../types/export';

interface ExportFilterPanelProps {
  filters: ExportFilters;
  onChange: (filters: ExportFilters) => void;
}

export const ExportFilterPanel: React.FC<ExportFilterPanelProps> = ({
  filters,
  onChange,
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(['basicInfo', 'dimensions']) // Expand basic info and dimensions by default
  );

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const handleCategoryToggle = (category: FilterCategory) => {
    const newValue = !filters[category.key];
    const updates: Partial<ExportFilters> = {
      [category.key]: newValue,
    };

    // Update all sub-filters to match category state
    category.subFilters.forEach((subFilter) => {
      updates[subFilter.key] = newValue;
    });

    onChange({ ...filters, ...updates });
  };

  const handleSubFilterToggle = (category: FilterCategory, subFilterKey: keyof ExportFilters) => {
    const newValue = !filters[subFilterKey];
    const updates: Partial<ExportFilters> = {
      [subFilterKey]: newValue,
    };

    // If turning on a sub-filter, turn on the parent category
    if (newValue) {
      updates[category.key] = true;
    } else {
      // If all sub-filters are off, turn off the category
      const allSubFiltersOff = category.subFilters.every(
        (sf) => sf.key === subFilterKey ? false : !filters[sf.key]
      );
      if (allSubFiltersOff) {
        updates[category.key] = false;
      }
    }

    onChange({ ...filters, ...updates });
  };

  const handleSelectAll = () => {
    const allEnabled: Partial<ExportFilters> = {
      basicInfo: true,
      dimensions: true,
    };

    // Enable all sub-filters
    FILTER_CATEGORIES.forEach((category) => {
      category.subFilters.forEach((subFilter) => {
        allEnabled[subFilter.key] = true;
      });
    });

    onChange({ ...filters, ...allEnabled });
  };

  const handleDeselectAll = () => {
    const allDisabled: Partial<ExportFilters> = {
      basicInfo: false,
      dimensions: false,
    };

    // Disable all sub-filters
    FILTER_CATEGORIES.forEach((category) => {
      category.subFilters.forEach((subFilter) => {
        allDisabled[subFilter.key] = false;
      });
    });

    onChange({ ...filters, ...allDisabled });
  };

  // Count enabled filters
  const enabledCount = FILTER_CATEGORIES.filter((cat) => filters[cat.key]).length;

  return (
    <div>
      {/* Header with Select All / Deselect All buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          fontSize: '14px',
          fontFamily: 'Nunito Sans, sans-serif',
          color: '#666666',
        }}>
          {enabledCount} of {FILTER_CATEGORIES.length} categories selected
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSelectAll}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: 'Nunito Sans, sans-serif',
              fontWeight: 600,
              color: '#00C4CC',
              backgroundColor: 'transparent',
              border: '1px solid #00C4CC',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00C4CC10';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: 'Nunito Sans, sans-serif',
              fontWeight: 600,
              color: '#666666',
              backgroundColor: 'transparent',
              border: '1px solid #CCCCCC',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Filter categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {FILTER_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.key);
          const isEnabled = filters[category.key];

          return (
            <div
              key={category.key}
              style={{
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: isEnabled ? '#F9FAFB' : '#FFFFFF',
                transition: 'all 200ms ease',
              }}
            >
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handleCategoryToggle(category)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    marginTop: '2px',
                  }}
                  aria-label={`Toggle ${category.label}`}
                />

                {/* Category info */}
                <div style={{ flex: 1 }}>
                  <div
                    onClick={() => toggleCategory(category.key)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    {/* Expand/collapse arrow */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease',
                      }}
                    >
                      <path
                        d="M4 2 L8 6 L4 10"
                        stroke="#666666"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: 'Nunito Sans, sans-serif',
                      color: '#333333',
                      margin: 0,
                    }}>
                      {category.label}
                    </h4>
                  </div>

                  <p style={{
                    fontSize: '12px',
                    fontFamily: 'Nunito Sans, sans-serif',
                    color: '#666666',
                    margin: '0 0 0 20px',
                  }}>
                    {category.description}
                  </p>

                  {/* Sub-filters (collapsible) */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '12px',
                      paddingLeft: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      {category.subFilters.map((subFilter) => (
                        <label
                          key={subFilter.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontFamily: 'Nunito Sans, sans-serif',
                            color: '#555555',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={filters[subFilter.key] || false}
                            onChange={() => handleSubFilterToggle(category, subFilter.key)}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                            }}
                            disabled={!isEnabled}
                            aria-label={subFilter.label}
                          />
                          <span style={{ opacity: isEnabled ? 1 : 0.5 }}>
                            {subFilter.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
