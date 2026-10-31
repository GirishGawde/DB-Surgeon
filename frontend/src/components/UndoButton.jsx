import React, { useState } from 'react';
import { RotateCcw, AlertOctagon, Check } from 'lucide-react';

export default function UndoButton({
  onRollback,
  isRollingBack = false,
  canUndo = true,
  className = '',
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [justReverted, setJustReverted] = useState(false);

  const handleClick = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setShowConfirm(false);
    if (onRollback) {
      await onRollback();
      setJustReverted(true);
      setTimeout(() => setJustReverted(false), 3000);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        disabled={isRollingBack || (!canUndo && !justReverted)}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 16px',
          borderRadius: 'var(--radius-sm)',
          border: showConfirm
            ? '1px solid #f87171'
            : '1px solid rgba(239, 68, 68, 0.4)',
          background: showConfirm
            ? 'linear-gradient(135deg, #b91c1c, #991b1b)'
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '12px',
          cursor: isRollingBack || (!canUndo && !justReverted) ? 'not-allowed' : 'pointer',
          boxShadow: isRollingBack || (!canUndo && !justReverted)
            ? 'none'
            : 'var(--glow-red)',
          transition: 'var(--transition)',
          userSelect: 'none',
        }}
      >
        {isRollingBack ? (
          <>
            <RotateCcw size={14} className="spin-animation pulse-indicator" />
            <span>Restoring Physical Snapshot...</span>
          </>
        ) : justReverted ? (
          <>
            <Check size={14} />
            <span>Reverted to Messy State</span>
          </>
        ) : showConfirm ? (
          <>
            <AlertOctagon size={14} />
            <span>Click to Confirm Rollback</span>
          </>
        ) : (
          <>
            <RotateCcw size={14} />
            <span>Undo Mutation</span>
          </>
        )}
      </button>

      {/* Confirmation Dismiss helper */}
      {showConfirm && (
        <button
          onClick={handleCancel}
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-muted)',
            fontSize: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Cancel"
        >
          ✕
        </button>
      )}
    </div>
  );
}
