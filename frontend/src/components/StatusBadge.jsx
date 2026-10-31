import React from 'react';
import { Cloud, Cpu, WifiOff, RefreshCw, Zap } from 'lucide-react';

export default function StatusBadge({
  status,
  isEdgeMode = false,
  onToggleEdge,
  className = '',
}) {
  const isCloud = !isEdgeMode && status?.active_provider === 'gemini';
  const isEdge = isEdgeMode || status?.active_provider === 'ollama';
  const isOffline = !isCloud && !isEdge && !status?.online;

  return (
    <div
      className={`status-badge-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(13, 18, 28, 0.85)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-full)',
        padding: '5px 14px 5px 8px',
        boxShadow: isCloud
          ? '0 0 16px var(--cloud-gemini-glow)'
          : isEdge
          ? '0 0 16px var(--edge-ollama-glow)'
          : 'none',
        transition: 'var(--transition)',
        userSelect: 'none',
      }}
    >
      {/* Status Dot with Ripple */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isCloud
              ? 'var(--cloud-gemini)'
              : isEdge
              ? 'var(--edge-ollama)'
              : 'var(--status-error)',
            boxShadow: isCloud
              ? '0 0 10px var(--cloud-gemini)'
              : isEdge
              ? '0 0 10px var(--edge-ollama)'
              : '0 0 10px var(--status-error)',
          }}
          className="pulse-indicator"
        />
      </div>

      {/* Provider Details */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isCloud ? (
            <>
              <Cloud size={14} color="var(--cloud-gemini)" />
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>
                Cloud API (Gemini)
              </span>
            </>
          ) : isEdge ? (
            <>
              <Cpu size={14} color="var(--edge-ollama)" />
              <span style={{ fontWeight: 600, color: 'var(--edge-ollama)', fontSize: '13px' }}>
                Edge Fallback (Ollama)
              </span>
            </>
          ) : (
            <>
              <WifiOff size={14} color="var(--status-error)" />
              <span style={{ fontWeight: 600, color: 'var(--status-error)', fontSize: '13px' }}>
                Node Offline
              </span>
            </>
          )}

          {/* Model tag */}
          <span
            className="mono"
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-secondary)',
            }}
          >
            {isCloud ? '256K Context' : isEdge ? 'RTX 2050 Local' : 'No link'}
          </span>
        </div>
      </div>

      {/* Interactive Demo Simulation Switch */}
      {onToggleEdge && (
        <button
          onClick={onToggleEdge}
          title={isEdge ? 'Switch back to Gemini Cloud' : 'Simulate Wi-Fi Drop (Edge Fallback)'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            marginLeft: '4px',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Zap size={14} color={isEdge ? 'var(--edge-ollama)' : 'var(--text-muted)'} />
        </button>
      )}
    </div>
  );
}
