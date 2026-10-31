import React, { useState } from 'react';
import { Send, Sparkles, Terminal, Shield, Database, Users } from 'lucide-react';

export default function CommandChat({ onSendCommand, isExecuting, lastCommand }) {
  const [input, setInput] = useState('');

  const quickPrompts = [
    {
      label: 'Normalize & Mask PII',
      icon: Shield,
      color: 'var(--accent-cyan)',
      prompt: 'Normalize this database, separate the users, and mask the PII.',
    },
    {
      label: 'Generate Goan Dummy Data',
      icon: Users,
      color: 'var(--edge-ollama)',
      prompt: 'Generate 50 rows of dummy Goan user data.',
    },
    {
      label: 'Scan UIDAI Violations',
      icon: Terminal,
      color: 'var(--accent-purple)',
      prompt: 'Scan table for unmasked Aadhar and phone numbers and verify 3NF.',
    },
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isExecuting) return;
    if (onSendCommand) onSendCommand(input.trim());
    setInput('');
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    if (onSendCommand) onSendCommand(prompt);
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Autonomous DBA Command Interface
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Natural Language to SQL
        </span>
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {quickPrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(item.prompt)}
              disabled={isExecuting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <Icon size={12} color={item.color} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Command Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isExecuting}
            placeholder="Instruct the agent (e.g., 'Normalize this database and mask PII')..."
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              transition: 'var(--transition)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isExecuting}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: isExecuting
              ? 'var(--border-medium)'
              : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px',
            cursor: !input.trim() || isExecuting ? 'not-allowed' : 'pointer',
            boxShadow: !input.trim() || isExecuting ? 'none' : 'var(--glow-cyan)',
            transition: 'var(--transition)',
          }}
        >
          {isExecuting ? (
            <span className="pulse-indicator">Reasoning...</span>
          ) : (
            <>
              <span>Execute</span>
              <Send size={14} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
