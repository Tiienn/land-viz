import React from 'react';

interface AppHeaderProps {
  isProfessionalMode: boolean;
  setIsProfessionalMode: (mode: boolean) => void;
  getTotalArea: () => string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  isProfessionalMode,
  setIsProfessionalMode,
  getTotalArea
}) => {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
      borderBottom: '1px solid #e2e8f0', 
      padding: '24px 24px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img 
          src="/Land-Visualizer512.png" 
          alt="Land Visualizer Logo"
          style={{
            width: '40px', 
            height: '40px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        />
        <div>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            margin: 0, 
            color: '#000000'
          }}>
            Land Visualizer
          </h1>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            {isProfessionalMode ? 'Create Professional Land Visualizations' : 'Create Beautiful Land Visualizations'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Professional Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '12px', 
            color: isProfessionalMode ? '#1d4ed8' : '#000000',
            fontWeight: '500'
          }}>
            {isProfessionalMode ? (
              <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3.09 8.26L12 14L20.91 8.26L12 2Z"/>
                  <path d="M3.09 8.26L12 14.52L20.91 8.26"/>
                  <path d="M3.09 15.74L12 22L20.91 15.74"/>
                </svg>
                Professional
              </span>
            ) : (
              <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Standard
              </span>
            )}
          </span>
          <button
            onClick={() => setIsProfessionalMode(!isProfessionalMode)}
            style={{
              position: 'relative',
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              background: isProfessionalMode ? '#3b82f6' : '#d1d5db',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              boxShadow: isProfessionalMode ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
            }}
            title={`Switch to ${isProfessionalMode ? 'Standard' : 'Professional'} Mode`}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transform: `translateX(${isProfessionalMode ? '24px' : '0px'})`,
              transition: 'transform 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px'
            }}>
              {isProfessionalMode ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#3b82f6">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#6b7280">
                  <path d="M3 3v18h18v-18h-18zm8 16h-2v-6h2v6zm0-8h-2v-2h2v2zm4 8h-2v-8h2v8zm0-10h-2v-2h2v2z"/>
                </svg>
              )}
            </div>
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#000000' }}>
          <span>FPS: 60</span> | <span>Quality: 100%</span> | <strong>{getTotalArea()} SQUARE METERS</strong>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;