import React, { useState } from 'react';
import { GitFork, Key, CheckCircle, Play, Code2, Layers, ArrowRight } from 'lucide-react';

export default function SchemaGraph({
  schema,
  onApprove,
  isExecuting,
  isExecuted,
}) {
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'sql'

  if (!schema || !schema.tables) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          minHeight: '280px',
          justifyContent: 'center',
        }}
      >
        <Layers size={36} color="var(--border-medium)" />
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Dry-Run Schema Sandbox Empty
        </div>
        <div style={{ fontSize: '12px', maxWidth: '360px' }}>
          Upload a <span className="mono" style={{ color: 'var(--accent-cyan)' }}>.db</span> file or submit a command to generate a dry-run relational schema graph.
        </div>
      </div>
    );
  }

  const { tables = [], relations = [], proposedSql = '', summary = '' } = schema;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
      }}
    >
      {/* Header with Title and Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitFork size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                Proposed Relational 3NF Architecture
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-cyan-bg)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                }}
              >
                Dry-Run Preview
              </span>
            </div>
            {summary && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* View Switcher & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('graph')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'graph' ? 'var(--accent-cyan-bg)' : 'transparent',
                color: viewMode === 'graph' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Layers size={12} />
              Schema Nodes
            </button>
            <button
              onClick={() => setViewMode('sql')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'sql' ? 'var(--accent-purple-bg)' : 'transparent',
                color: viewMode === 'sql' ? 'var(--accent-purple)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Code2 size={12} />
              Proposed DDL
            </button>
          </div>

          {/* Approve & Execute CTA */}
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={isExecuting || isExecuted}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isExecuted
                  ? 'var(--cloud-gemini-bg)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: isExecuted ? 'var(--cloud-gemini)' : '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: isExecuting || isExecuted ? 'default' : 'pointer',
                boxShadow: isExecuted ? 'none' : '0 0 16px var(--cloud-gemini-glow)',
                transition: 'var(--transition)',
              }}
            >
              {isExecuted ? (
                <>
                  <CheckCircle size={14} />
                  <span>Executed & Verified</span>
                </>
              ) : isExecuting ? (
                <>
                  <Play size={14} className="pulse-indicator" />
                  <span>Self-Healing Engine Running...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Approve & Execute</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'graph' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Relational Table Node Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {tables.map((table, tIdx) => (
              <div
                key={tIdx}
                className="glass-panel"
                style={{
                  background: 'rgba(18, 24, 38, 0.9)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Table Header */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span className="mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-cyan)' }}>
                    {table.name}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {table.columns.length} cols
                  </span>
                </div>

                {/* Columns List */}
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {table.columns.map((col, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        padding: '2px 0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {col.pk ? (
                          <span
                            title="Primary Key"
                            style={{
                              color: '#fbbf24',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Key size={11} />
                          </span>
                        ) : col.name.endsWith('_id') ? (
                          <span
                            title="Foreign Key Reference"
                            style={{
                              color: 'var(--accent-purple)',
                              fontWeight: 700,
                              fontSize: '9px',
                              border: '1px solid var(--accent-purple)',
                              borderRadius: '2px',
                              padding: '0 2px',
                            }}
                          >
                            FK
                          </span>
                        ) : (
                          <span style={{ width: '11px' }} />
                        )}

                        <span
                          className="mono"
                          style={{
                            color: col.pk
                              ? '#fbbf24'
                              : col.name.includes('masked')
                              ? 'var(--cloud-gemini)'
                              : 'var(--text-main)',
                            fontWeight: col.pk ? 600 : 400,
                          }}
                        >
                          {col.name}
                        </span>
                      </div>

                      <span
                        className="mono"
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {col.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Foreign Key Relations Bar */}
          {relations.length > 0 && (
            <div
              style={{
                background: 'rgba(9, 13, 21, 0.7)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active Foreign Key Referential Integrity:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {relations.map((rel, rIdx) => (
                  <div
                    key={rIdx}
                    className="mono"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <span style={{ color: 'var(--accent-purple)' }}>{rel.from}</span>
                    <ArrowRight size={10} color="var(--text-muted)" />
                    <span style={{ color: 'var(--accent-cyan)' }}>{rel.to}</span>
                    {rel.type && (
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        ({rel.type})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Raw Proposed SQL Preview */
        <div
          style={{
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            padding: '12px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          <pre
            className="mono"
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {proposedSql || '-- No SQL generated yet'}
          </pre>
        </div>
      )}
    </div>
  );
}
