import React, { useState } from 'react';
import { useToolHistoryStore } from '../../store/useToolHistoryStore';
import Icon from '../Icon';

export const QuickWorkflows: React.FC = () => {
  const workflows = useToolHistoryStore((state) => state.workflows);
  const startWorkflow = useToolHistoryStore((state) => state.startWorkflow);
  const deleteWorkflow = useToolHistoryStore((state) => state.deleteWorkflow);
  const duplicateWorkflow = useToolHistoryStore((state) => state.duplicateWorkflow);
  const startRecording = useToolHistoryStore((state) => state.startRecording);
  const recording = useToolHistoryStore((state) => state.recording);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleExecuteWorkflow = (id: string) => {
    startWorkflow(id);
    setMenuOpen(null);
  };

  const handleDuplicate = (id: string) => {
    duplicateWorkflow(id);
    setMenuOpen(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
      setMenuOpen(null);
    }
  };

  const handleStartRecording = () => {
    if (recording.isRecording) {
      alert('Already recording a workflow!');
      return;
    }
    startRecording();
    alert('Recording started! All your actions will be captured. Use the 🎬 button to stop recording.');
  };

  return (
    <div
      style={{
        marginBottom: '20px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="zap" size={14} color="#3b82f6" strokeWidth={2.5} />
          <h3
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#6b7280',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Quick Workflows ({workflows.length})
          </h3>
        </div>
        <button
          onClick={handleStartRecording}
          aria-label={recording.isRecording ? 'Stop recording workflow' : 'Start recording new workflow'}
          aria-pressed={recording.isRecording}
          role="button"
          tabIndex={0}
          style={{
            padding: '6px 12px',
            background: recording.isRecording
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            boxShadow: recording.isRecording
              ? '0 2px 6px rgba(239, 68, 68, 0.3)'
              : '0 2px 6px rgba(59, 130, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = recording.isRecording
              ? '0 6px 12px rgba(239, 68, 68, 0.4)'
              : '0 6px 12px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = recording.isRecording
              ? '0 2px 6px rgba(239, 68, 68, 0.3)'
              : '0 2px 6px rgba(59, 130, 246, 0.3)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid #3b82f6';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
          title={recording.isRecording ? 'Recording in progress...' : 'Start recording a workflow'}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {recording.isRecording ? (
              <>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></span>
                Recording...
              </>
            ) : (
              <>+ Record</>
            )}
          </span>
        </button>
      </div>

      {workflows.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px dashed #e5e7eb',
          }}
        >
          No workflows yet.
          <br />
          Click "+ Record" to create your first workflow.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <button
                onClick={() => handleExecuteWorkflow(workflow.id)}
                aria-label={`Execute workflow: ${workflow.name}`}
                role="button"
                tabIndex={0}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid #3b82f6';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <Icon name={workflow.icon} size={16} color="#ffffff" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: '#1f2937',
                      fontWeight: '500',
                      fontSize: '13px',
                    }}
                  >
                    {workflow.name}
                  </div>
                  <div
                    style={{
                      color: '#6b7280',
                      fontSize: '11px',
                      marginTop: '2px',
                    }}
                  >
                    {workflow.description}
                  </div>
                </div>
                <Icon name="play" size={16} color="#3b82f6" strokeWidth={2} />
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(menuOpen === workflow.id ? null : workflow.id)}
                  aria-label={`Options for ${workflow.name}`}
                  aria-haspopup="true"
                  aria-expanded={menuOpen === workflow.id}
                  role="button"
                  tabIndex={0}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '16px',
                    lineHeight: 1,
                    color: '#6b7280',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '2px solid #3b82f6';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  title="More options"
                >
                  ⋯
                </button>

                {menuOpen === workflow.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '4px',
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 1000,
                      minWidth: '140px',
                    }}
                  >
                    <button
                      onClick={() => handleDuplicate(workflow.id)}
                      aria-label={`Duplicate workflow: ${workflow.name}`}
                      role="menuitem"
                      tabIndex={0}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '13px',
                        color: '#1f2937',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.outline = '2px solid #3b82f6';
                        e.currentTarget.style.outlineOffset = '-2px';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.outline = 'none';
                      }}
                    >
                      <Icon name="copy" size={14} color="#6b7280" strokeWidth={2} />
                      Duplicate
                    </button>
                    {!workflow.isBuiltIn && (
                      <button
                        onClick={() => handleDelete(workflow.id)}
                        aria-label={`Delete workflow: ${workflow.name}`}
                        role="menuitem"
                        tabIndex={0}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px',
                          color: '#ef4444',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.outline = '2px solid #ef4444';
                          e.currentTarget.style.outlineOffset = '-2px';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.outline = 'none';
                        }}
                      >
                        <Icon name="trash" size={14} color="#ef4444" strokeWidth={2} />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
