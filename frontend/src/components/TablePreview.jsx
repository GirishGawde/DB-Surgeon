import React, { useState } from 'react';
import { Table, Eye, ShieldAlert, ShieldCheck, Database } from 'lucide-react';

export default function TablePreview({
  messyData,
  normalizedData,
  isMutated = false,
}) {
  const [selectedTable, setSelectedTable] = useState('raw'); // 'raw' or table name

  const isShowingRaw = selectedTable === 'raw' || !isMutated;

  let columns = [];
  let rows = [];
  let tableName = 'messy_orders';

  if (isShowingRaw && messyData) {
    tableName = messyData.tableName || 'messy_orders';
    columns = messyData.columns || [];
    rows = messyData.sampleRows || [];
  } else if (normalizedData && normalizedData.tables) {
    const tableObj =
      normalizedData.tables.find((t) => t.name === selectedTable) ||
      normalizedData.tables[0];
    if (tableObj) {
      tableName = tableObj.name;
      columns = tableObj.columns.map((c) => c.name);
      rows = tableObj.sampleRows || [];
    }
  }

  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Table Selector & Integrity State */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Live SQLite Records Inspector
          </span>
          <span
            className="mono"
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
            }}
          >
            table: {tableName}
          </span>
        </div>

        {/* Table Selector Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedTable('raw')}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: selectedTable === 'raw' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              background: selectedTable === 'raw' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: selectedTable === 'raw' ? '#f87171' : 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldAlert size={12} />
            Raw Messy Data
          </button>

          {isMutated &&
            normalizedData?.tables?.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTable(t.name)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedTable === t.name ? '1px solid var(--cloud-gemini)' : '1px solid var(--border-subtle)',
                  background: selectedTable === t.name ? 'var(--cloud-gemini-bg)' : 'transparent',
                  color: selectedTable === t.name ? 'var(--cloud-gemini)' : 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={12} />
                {t.name} (3NF)
              </button>
            ))}
        </div>
      </div>

      {/* Security Banner Hook for Demo */}
      {isShowingRaw ? (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
            <ShieldAlert size={14} />
            <span style={{ fontWeight: 600 }}>Critical Data Engineering Issues:</span>
            <span>Exposed UIDAI Aadhar numbers, repeating address blocks, raw phone formats.</span>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cloud-gemini)' }}>
            <ShieldCheck size={14} />
            <span style={{ fontWeight: 600 }}>Compliant 3NF State:</span>
            <span>Aadhar PII masked via SHA-256 / redactor, phone normalized to E.164.</span>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-input)',
        }}
      >
        <table
          className="mono"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-medium)' }}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '8px 10px',
                    color: col.includes('aadhar')
                      ? isShowingRaw
                        ? '#ef4444'
                        : 'var(--cloud-gemini)'
                      : 'var(--text-secondary)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map((col, cIdx) => {
                  const val = row[col];
                  const isAadhar = col.includes('aadhar');
                  return (
                    <td
                      key={cIdx}
                      style={{
                        padding: '7px 10px',
                        color: isAadhar
                          ? isShowingRaw
                            ? '#fca5a5'
                            : 'var(--cloud-gemini)'
                          : 'var(--text-main)',
                        fontWeight: isAadhar ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {val !== undefined ? String(val) : 'NULL'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
