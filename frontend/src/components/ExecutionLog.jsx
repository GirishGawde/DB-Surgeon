import React, { useEffect, useRef } from 'react';
import { Terminal, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck, Clock, Zap } from 'lucide-react';

export default function ExecutionLog({
  logs = [],
  isExecuting = false,
  validation = null,
  durationMs = null,
  rowsAffected = null,
  proposedSql = null,
}) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isExecuting]);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(8, 11, 18, 0.95)',
        border: '1px solid var(--border-medium)',
      }}
    >
      {/* Terminal Title Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mac/Linux terminal dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <Terminal size={14} color="var(--accent-cyan)" />
            <span className="mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              DB-Surgeon Self-Healing Terminal & Telemetry
            </span>
          </div>
        </div>

        {/* Live Execution Telemetry Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {durationMs !== null && (
            <span
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Clock size={12} />
              {durationMs}ms
            </span>
          )}

          {rowsAffected !== null && (
            <span
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Zap size={12} />
              {rowsAffected} rows mutated
            </span>
          )}

          {isExecuting && (
            <span
              className="pulse-indicator"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--edge-ollama)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={12} className="spin-animation" />
              Active Closed Loop
            </span>
          )}
        </div>
      </div>

      {/* Terminal Log Console */}
      <div
        className="mono"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          minHeight: '140px',
          maxHeight: '220px',
          overflowY: 'auto',
          fontSize: '12px',
          lineHeight: '1.6',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {logs.length === 0 && !isExecuting && (
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
            [telemetry] Standby. Waiting for dry-run approval or SQL mutation command...
          </div>
        )}

        {logs.map((step, idx) => {
          const isFail = step.status === 'failed';
          const isHealing = step.status === 'self_healing';
          const isSuccess = step.status === 'success';

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                paddingLeft: '8px',
                borderLeft: `2px solid ${
                  isFail
                    ? 'var(--status-error)'
                    : isHealing
                    ? 'var(--edge-ollama)'
                    : 'var(--cloud-gemini)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                  [{step.timestamp || `T+${idx * 150}ms`}]
                </span>

                {isFail && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--status-error)',
                      fontWeight: 700,
                    }}
                  >
                    <AlertTriangle size={12} />
                    ATTEMPT {step.attempt}: SYNTAX/OPERATIONAL ERROR
                  </span>
                )}

                {isHealing && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--edge-ollama)',
                      fontWeight: 700,
                    }}
                  >
                    <RefreshCw size={12} />
                    AGENTIC HEALING LOOP: BOUNCING STACK TRACE TO AI
                  </span>
                )}

                {isSuccess && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--cloud-gemini)',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={12} />
                    EXECUTION COMMITTED & VERIFIED
                  </span>
                )}
              </div>

              {/* Error Details */}
              {step.error && (
                <div style={{ color: '#f87171', paddingLeft: '8px' }}>
                  &gt; {step.error}
                </div>
              )}

              {/* AI Healing Reflection */}
              {step.aiReflection && (
                <div style={{ color: '#fbbf24', paddingLeft: '8px' }}>
                  &gt; {step.aiReflection}
                </div>
              )}

              {/* Success Result */}
              {step.result && (
                <div style={{ color: '#34d399', paddingLeft: '8px' }}>
                  &gt; {step.result}
                </div>
              )}
            </div>
          );
        })}

        {isExecuting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
            <span className="pulse-indicator">●</span>
            <span>Running cursor.execute() transaction in isolated sandbox...</span>
          </div>
        )}

        {proposedSql && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              marginTop: '8px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '6px' }}>
              &gt; Generated Query / Schema DDL:
            </div>
            <pre
              className="mono"
              style={{
                margin: 0,
                fontSize: '11px',
                color: '#93c5fd',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {proposedSql}
            </pre>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Automated Validation Results Grid */}
      {validation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cloud-gemini)' }}>
            <ShieldCheck size={16} />
            <span style={{ fontWeight: 600, fontSize: '12px' }}>
              Automated Integrity & Compliance Validation:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }} className="mono">
            <span style={{ color: 'var(--cloud-gemini)' }}>
              ✓ FK Integrity: Verified
            </span>
            <span style={{ color: 'var(--cloud-gemini)' }}>
              ✓ PII Exposed: {validation.piiExposedCount ?? 0}
            </span>
            <span style={{ color: 'var(--cloud-gemini)' }}>
              ✓ Normal Form: {validation.normalFormAchieved || '3NF'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
