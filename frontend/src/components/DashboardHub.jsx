import React from 'react';
import {
  GitFork,
  Table,
  Terminal,
  Activity,
  Image as ImageIcon,
  RotateCcw,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
  Database,
  Layers,
} from 'lucide-react';

export default function DashboardHub({
  onSelectFeature,
  currentDbName,
  isExecuted,
  isEdgeMode,
  schemaData,
  messyData,
}) {
  const features = [
    {
      id: 'schema',
      title: '3NF Schema Architect (Dry Run)',
      badge: 'Relational Graph',
      badgeColor: 'var(--accent-cyan)',
      icon: GitFork,
      iconColor: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.15)',
      description:
        'Interactive visual node graph showing 3rd Normal Form tables, primary keys (PK), foreign keys (FK), and DDL SQL dry-run preview with 1-click execution approval.',
      metric: schemaData ? `${schemaData.tables?.length || 4} Normalized Tables` : '4 Tables Proposed',
      demoStep: 'Demo Step 2: Core Execution',
    },
    {
      id: 'records',
      title: 'SQLite Records Inspector',
      badge: isExecuted ? 'UIDAI Compliant' : 'Exposed PII Detected',
      badgeColor: isExecuted ? 'var(--cloud-gemini)' : 'var(--status-error)',
      icon: Table,
      iconColor: isExecuted ? '#10b981' : '#f87171',
      bgGlow: isExecuted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      description:
        'Live tabular data inspector. Inspect raw unnormalized tables with exposed UIDAI Aadhar numbers and dirty phone formats, and verify masked results.',
      metric: `${messyData?.rowCount || 450} SQLite Records`,
      demoStep: 'Demo Step 1: Garbage Data Hook',
    },
    {
      id: 'terminal',
      title: 'Self-Healing Terminal & Telemetry',
      badge: 'Closed-Loop AI',
      badgeColor: 'var(--edge-ollama)',
      icon: Terminal,
      iconColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      description:
        'Real-time transaction stream that catches sqlite3.OperationalError syntax errors, feeds error stack traces back to the AI router, and repairs transactions autonomously.',
      metric: 'Max 3 Autonomous Retries',
      demoStep: 'Demo Step 2: Auto-Correction',
    },
    {
      id: 'ingest',
      title: 'Whiteboard & DB Ingest Studio',
      badge: 'Multimodal Vision',
      badgeColor: 'var(--accent-purple)',
      icon: ImageIcon,
      iconColor: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.15)',
      description:
        'Dual-target ingestion: drop raw SQLite .db files or upload whiteboard ER diagram photos for Gemma 4 Vision multimodal schema extraction.',
      metric: 'SQLite 3 & Base64 Vision',
      demoStep: 'Multimodal Architecture',
    },
    {
      id: 'rollback',
      title: 'Time-Travel Physical Rollback',
      badge: 'Zero Data Loss',
      badgeColor: '#ef4444',
      icon: RotateCcw,
      iconColor: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      description:
        'Physical state manager using Python shutil.copy2(). Restores the database file to its exact pre-mutation binary state with one instant hot-swap click.',
      metric: 'shutil.copy2() Hot-Swap',
      demoStep: 'Demo Step 4: Safety Net',
    },
    {
      id: 'edge',
      title: 'Hybrid Edge-Cloud Node Monitor',
      badge: isEdgeMode ? '🟠 Edge Active' : '🟢 Cloud Active',
      badgeColor: isEdgeMode ? 'var(--edge-ollama)' : 'var(--cloud-gemini)',
      icon: Cpu,
      iconColor: isEdgeMode ? '#f59e0b' : '#10b981',
      bgGlow: isEdgeMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
      description:
        'High-availability routing. Automatically routes reasoning to local Ollama (gemma4:e4b on RTX 2050) when internet is severed or API limits are reached.',
      metric: isEdgeMode ? 'RTX 2050 (4GB VRAM)' : 'Gemini 2.5 (256K Context)',
      demoStep: 'Demo Step 3: Edge Flex',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '6px' }}>
      {/* Hero Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background:
            'linear-gradient(135deg, rgba(13, 18, 28, 0.95) 0%, rgba(20, 27, 42, 0.95) 100%)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '640px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-cyan-bg)',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} />
              AUTONOMOUS DBA CONTROL CENTER
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Hacktoberfest Hack Day • Don Bosco College of Engineering
            </span>
          </div>

          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}
          >
            Surgical Database Healing & Edge AI Infrastructure
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Select any feature below to inspect raw data, execute dry-run schema refactoring, watch closed-loop
            self-healing SQL correction, or test offline Edge failover.
          </p>
        </div>

        {/* Quick Launch Studio CTA */}
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <button
            onClick={() => onSelectFeature('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: 'var(--glow-cyan)',
              transition: 'var(--transition)',
            }}
          >
            <Layers size={16} />
            <span>Open All-in-One Studio</span>
            <ArrowRight size={14} />
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
            Target: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{currentDbName}</span>
          </span>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              onClick={() => onSelectFeature(feat.id)}
              className="glass-panel"
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(13, 18, 28, 0.75)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = feat.badgeColor;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 12px 30px ${feat.bgGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              {/* Top Row: Icon + Badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    background: feat.bgGlow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${feat.badgeColor}33`,
                  }}
                >
                  <Icon size={22} color={feat.iconColor} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: feat.badgeColor,
                      border: `1px solid ${feat.badgeColor}44`,
                    }}
                  >
                    {feat.badge}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    {feat.demoStep}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: '6px',
                  }}
                >
                  {feat.title}
                </h3>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {feat.description}
                </p>
              </div>

              {/* Bottom Row: Metric & Action Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  marginTop: '4px',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Database size={11} color="var(--accent-cyan)" />
                  {feat.metric}
                </span>

                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: feat.iconColor,
                  }}
                >
                  Launch Feature
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
