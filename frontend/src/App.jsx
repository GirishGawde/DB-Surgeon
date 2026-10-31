import React, { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  Layers,
  Table as TableIcon,
  GitFork,
  Terminal,
  Image as ImageIcon,
  RotateCcw,
  LayoutGrid,
  ChevronLeft,
  ArrowRight,
  Radio,
  Sparkles,
  Cpu,
} from 'lucide-react';

// Components
import DashboardHub from './components/DashboardHub';
import StatusBadge from './components/StatusBadge';
import UploadZone from './components/UploadZone';
import CommandChat from './components/CommandChat';
import SchemaGraph from './components/SchemaGraph';
import ExecutionLog from './components/ExecutionLog';
import UndoButton from './components/UndoButton';
import TablePreview from './components/TablePreview';

// API Service
import {
  getProviderStatus,
  analyzeSchema,
  executeMutation,
  rollbackDatabase,
  executeCommand,
  getInitialMessyData,
} from './services/api';

export default function App() {
  // Navigation View: 'hub' | 'schema' | 'records' | 'terminal' | 'ingest' | 'studio'
  const [currentScreen, setCurrentScreen] = useState('hub');

  // Global App States
  const [providerStatus, setProviderStatus] = useState(null);
  const [isEdgeSimulated, setIsEdgeSimulated] = useState(false);

  // Database & Schema States
  const [currentDbName, setCurrentDbName] = useState('messy_orders.db');
  const [messyData, setMessyData] = useState(getInitialMessyData());
  const [schemaData, setSchemaData] = useState(null);

  // Execution & Self-Healing States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExecuted, setIsExecuted] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Telemetry & Logs
  const [executionLogs, setExecutionLogs] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [metrics, setMetrics] = useState({ durationMs: null, rowsAffected: null });

  // Studio Sub-tab: 'schema' | 'data'
  const [studioStageTab, setStudioStageTab] = useState('schema');

  // Load Initial Status and Default Dry-Run Analysis on Mount
  useEffect(() => {
    async function init() {
      const status = await getProviderStatus(isEdgeSimulated);
      setProviderStatus(status);

      try {
        const initialAnalysis = await analyzeSchema(
          'Normalize this database, separate the users, and mask the PII.',
          currentDbName
        );
        setSchemaData(initialAnalysis.schema);
      } catch (err) {
        console.error('Initial analysis error:', err);
      }
    }
    init();
  }, [isEdgeSimulated]);

  // Handle Edge Fallback Toggle (Demo Script Step 3)
  const handleToggleEdge = async () => {
    const nextEdgeState = !isEdgeSimulated;
    setIsEdgeSimulated(nextEdgeState);
    const updatedStatus = await getProviderStatus(nextEdgeState);
    setProviderStatus(updatedStatus);
  };

  // Handle DB File Uploaded
  const handleDbLoaded = (result) => {
    setCurrentDbName(result.filename || 'messy_orders.db');
    setIsExecuted(false);
    setExecutionLogs([]);
    setValidationResult(null);
    setMetrics({ durationMs: null, rowsAffected: null });
    handleCommand('Analyze uploaded SQLite database and propose 3NF schema with PII masking.');
  };

  // Handle Whiteboard ER Uploaded
  const handleWhiteboardLoaded = (result) => {
    if (result.schema) {
      setSchemaData(result.schema);
    }
    setCurrentScreen('schema');
  };

  // Handle Command Submission
  const handleCommand = async (commandText) => {
    setIsAnalyzing(true);
    try {
      const res = await executeCommand(commandText);

      // 1. Update Schema if proposed/generated
      if (res.schema) {
        setSchemaData(res.schema);
      }

      // 2. Update Self-Healing Execution Logs
      if (res.logs && res.logs.length > 0) {
        setExecutionLogs(res.logs);
      } else if (res.message) {
        setExecutionLogs([
          {
            attempt: 1,
            status: 'success',
            action: `agent.execute("${commandText}")`,
            result: res.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }

      // 3. Update Validation & Metrics
      if (res.validation) {
        setValidationResult(res.validation);
      }
      if (res.totalDurationMs !== undefined || res.rowsAffected !== undefined) {
        setMetrics({
          durationMs: res.totalDurationMs || 312,
          rowsAffected: res.rowsAffected !== undefined ? res.rowsAffected : (res.rowsInserted || 12),
        });
      }
    } catch (err) {
      console.error('Command handling failed:', err);
      setExecutionLogs([
        {
          attempt: 1,
          status: 'failed',
          action: `agent.execute("${commandText}")`,
          error: err.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle "Approve & Execute" (Demo Script Step 2)
  const handleApproveAndExecute = async () => {
    if (!schemaData || isExecuting || isExecuted) return;
    setIsExecuting(true);

    try {
      const result = await executeMutation(schemaData.proposedSql);
      setExecutionLogs(result.logs || []);
      setValidationResult(result.validation || null);
      setMetrics({
        durationMs: result.totalDurationMs || 482,
        rowsAffected: result.rowsAffected || 450,
      });
      setIsExecuted(true);
    } catch (err) {
      console.error('Execution mutation failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle "Undo Mutation" / Rollback (Demo Script Step 4)
  const handleRollback = async () => {
    setIsRollingBack(true);
    try {
      await rollbackDatabase();
      setIsExecuted(false);
      setExecutionLogs([
        {
          attempt: 1,
          status: 'success',
          action: 'shutil.copy2(backup.db, database.db)',
          result: 'HOT-SWAP RESTORATION: Reverted SQLite database back to messy unnormalized state.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setValidationResult(null);
      setMetrics({ durationMs: 45, rowsAffected: 0 });
    } catch (err) {
      console.error('Rollback failed:', err);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="app-container">
      {/* 1. TOP COMMAND BAR */}
      <header
        className="glass-panel"
        style={{
          margin: '12px 16px 8px 16px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-medium)',
        }}
      >
        {/* Brand & Identity */}
        <div
          onClick={() => setCurrentScreen('hub')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          title="Return to Dashboard Overview"
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Activity size={20} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '-0.3px',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                DB-SURGEON
              </h1>
              <span
                className="mono"
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  fontWeight: 600,
                }}
              >
                AUTONOMOUS DBA
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              Schema Healing & Hybrid Edge-Cloud Infrastructure
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentScreen('hub')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: currentScreen === 'hub' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              background: currentScreen === 'hub' ? 'var(--accent-cyan-bg)' : 'transparent',
              color: currentScreen === 'hub' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <LayoutGrid size={14} />
            <span>Dashboard Hub</span>
          </button>

          <button
            onClick={() => setCurrentScreen('schema')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: currentScreen === 'schema' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              background: currentScreen === 'schema' ? 'var(--accent-cyan-bg)' : 'transparent',
              color: currentScreen === 'schema' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <GitFork size={14} />
            <span>Schema Architect</span>
          </button>

          <button
            onClick={() => setCurrentScreen('records')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: currentScreen === 'records' ? '1px solid #8b5cf6' : '1px solid transparent',
              background: currentScreen === 'records' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: currentScreen === 'records' ? '#c084fc' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <TableIcon size={14} />
            <span>Data Inspector</span>
          </button>

          <button
            onClick={() => setCurrentScreen('terminal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: currentScreen === 'terminal' ? '1px solid var(--edge-ollama)' : '1px solid transparent',
              background: currentScreen === 'terminal' ? 'var(--edge-ollama-bg)' : 'transparent',
              color: currentScreen === 'terminal' ? 'var(--edge-ollama)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <Terminal size={14} />
            <span>Self-Healing Logs</span>
          </button>

          <button
            onClick={() => setCurrentScreen('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: currentScreen === 'studio' ? '1px solid #10b981' : '1px solid transparent',
              background: currentScreen === 'studio' ? 'var(--cloud-gemini-bg)' : 'transparent',
              color: currentScreen === 'studio' ? 'var(--cloud-gemini)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <Layers size={14} />
            <span>Studio View</span>
          </button>
        </nav>

        {/* Database Attached Badge + Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="mono"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 12px',
              fontSize: '12px',
            }}
          >
            <Database size={13} color="var(--accent-cyan)" />
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{currentDbName}</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                background: isExecuted ? 'var(--cloud-gemini-bg)' : 'rgba(239, 68, 68, 0.15)',
                color: isExecuted ? 'var(--cloud-gemini)' : '#f87171',
                fontWeight: 600,
              }}
            >
              {isExecuted ? '3NF' : 'RAW'}
            </span>
          </div>

          <StatusBadge
            status={providerStatus}
            isEdgeMode={isEdgeSimulated}
            onToggleEdge={handleToggleEdge}
          />

          <UndoButton
            onRollback={handleRollback}
            isRollingBack={isRollingBack}
            canUndo={isExecuted}
          />
        </div>
      </header>

      {/* 2. BODY CONTENT ROUTER */}
      <main style={{ padding: '8px 16px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* VIEW 1: DASHBOARD HUB (FEATURE LAUNCHER) */}
        {currentScreen === 'hub' && (
          <DashboardHub
            onSelectFeature={(featId) => {
              if (featId === 'rollback') {
                handleRollback();
              } else if (featId === 'edge') {
                handleToggleEdge();
              } else {
                setCurrentScreen(featId);
              }
            }}
            currentDbName={currentDbName}
            isExecuted={isExecuted}
            isEdgeMode={isEdgeSimulated}
            schemaData={schemaData}
            messyData={messyData}
          />
        )}

        {/* VIEW 2: DEDICATED SCHEMA ARCHITECT */}
        {currentScreen === 'schema' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentScreen('hub')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <ChevronLeft size={16} />
                Back to Dashboard Hub
              </button>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Demo Step 2: Proposed 3NF Relational Graph & Execution Sandbox
              </span>
            </div>

            <SchemaGraph
              schema={schemaData}
              onApprove={handleApproveAndExecute}
              isExecuting={isExecuting}
              isExecuted={isExecuted}
            />

            <CommandChat
              onSendCommand={handleCommand}
              isExecuting={isAnalyzing || isExecuting}
              lastCommand=""
            />
          </div>
        )}

        {/* VIEW 3: DEDICATED DATA INSPECTOR */}
        {currentScreen === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentScreen('hub')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <ChevronLeft size={16} />
                Back to Dashboard Hub
              </button>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Demo Step 1: Inspecting Messy SQLite Records & Exposed UIDAI Aadhar Numbers
              </span>
            </div>

            <TablePreview
              messyData={messyData}
              normalizedData={schemaData}
              isMutated={isExecuted}
            />
          </div>
        )}

        {/* VIEW 4: DEDICATED SELF-HEALING TERMINAL */}
        {currentScreen === 'terminal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentScreen('hub')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <ChevronLeft size={16} />
                Back to Dashboard Hub
              </button>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Autonomous Closed-Loop Telemetry & Automated Integrity Validation
              </span>
            </div>

            <CommandChat
              onSendCommand={handleCommand}
              isExecuting={isAnalyzing || isExecuting}
              lastCommand=""
            />

            <ExecutionLog
              logs={executionLogs}
              isExecuting={isExecuting}
              validation={validationResult}
              durationMs={metrics.durationMs}
              rowsAffected={metrics.rowsAffected}
              proposedSql={schemaData?.proposedSql}
            />
          </div>
        )}

        {/* VIEW 5: DEDICATED INGEST STUDIO */}
        {currentScreen === 'ingest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentScreen('hub')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <ChevronLeft size={16} />
                Back to Dashboard Hub
              </button>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Dual-Mode Ingest: SQLite Target & Whiteboard ER Vision Ingestion
              </span>
            </div>

            <UploadZone
              onDbLoaded={handleDbLoaded}
              onWhiteboardLoaded={handleWhiteboardLoaded}
              currentFileName={currentDbName}
            />
          </div>
        )}

        {/* VIEW 6: ALL-IN-ONE STUDIO WORKSTATION */}
        {currentScreen === 'studio' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '380px 1fr',
              gap: '14px',
              flex: 1,
            }}
          >
            {/* Left Column: Ingest & Commands */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <UploadZone
                onDbLoaded={handleDbLoaded}
                onWhiteboardLoaded={handleWhiteboardLoaded}
                currentFileName={currentDbName}
              />

              <CommandChat
                onSendCommand={handleCommand}
                isExecuting={isAnalyzing || isExecuting}
                lastCommand=""
              />

              <div
                className="glass-panel"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <Radio size={13} color="var(--accent-cyan)" />
                  <span>Architecture Specifications:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} className="mono">
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rollback:</span>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>shutil.copy2()</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Self-Healing:</span>
                    <div style={{ color: 'var(--cloud-gemini)', fontWeight: 600 }}>3 Retries Max</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Stage & Terminal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="glass-panel" style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => setStudioStageTab('schema')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: studioStageTab === 'schema' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                      background: studioStageTab === 'schema' ? 'var(--accent-cyan-bg)' : 'transparent',
                      color: studioStageTab === 'schema' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Layers size={14} />
                    Schema Sandbox
                  </button>

                  <button
                    onClick={() => setStudioStageTab('data')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: studioStageTab === 'data' ? '1px solid #8b5cf6' : '1px solid transparent',
                      background: studioStageTab === 'data' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      color: studioStageTab === 'data' ? '#c084fc' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <TableIcon size={14} />
                    Live SQLite Records
                  </button>
                </div>

                <div style={{ padding: '10px 8px' }}>
                  {studioStageTab === 'schema' ? (
                    <SchemaGraph
                      schema={schemaData}
                      onApprove={handleApproveAndExecute}
                      isExecuting={isExecuting}
                      isExecuted={isExecuted}
                    />
                  ) : (
                    <TablePreview
                      messyData={messyData}
                      normalizedData={schemaData}
                      isMutated={isExecuted}
                    />
                  )}
                </div>
              </div>

              <ExecutionLog
                logs={executionLogs}
                isExecuting={isExecuting}
                validation={validationResult}
                durationMs={metrics.durationMs}
                rowsAffected={metrics.rowsAffected}
                proposedSql={schemaData?.proposedSql}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
