import React from 'react';

export const ContextMenuDivider: React.FC = () => {
  return (
    <div
      role="separator"
      style={{
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '4px 0',
      }}
    />
  );
};

export default ContextMenuDivider;
