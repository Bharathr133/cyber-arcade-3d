import React from 'react';
import { Undo2, Check, X, ShieldAlert, Clock } from 'lucide-react';

export default function UndoConfirmModal({
  isOpen,
  isWaiting,
  requesterName = 'Opponent',
  onAccept,
  onDecline
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 260,
      padding: '16px'
    }}>
      <div className="card-enterprise animate-pop-in" style={{
        width: '420px',
        padding: '28px 24px',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-xl)',
        textAlign: 'center'
      }}>
        {/* Header Icon */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '16px',
          background: isWaiting ? '#eff6ff' : '#fef3c7',
          border: isWaiting ? '1.5px solid #bfdbfe' : '1.5px solid #fde68a',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '14px'
        }}>
          {isWaiting ? (
            <Clock size={26} color="#1d4ed8" className="pulse-active-glow" />
          ) : (
            <Undo2 size={26} color="#b45309" />
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '18px',
          fontWeight: '900',
          color: '#0f172a',
          margin: '0 0 6px 0'
        }}>
          {isWaiting ? 'UNDO REQUEST SENT' : 'UNDO MOVE REQUEST'}
        </h3>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: '#64748b',
          margin: '0 0 22px 0',
          lineHeight: 1.4
        }}>
          {isWaiting
            ? `Waiting for ${requesterName} to accept or decline your undo request...`
            : `${requesterName} has requested to undo their previous move. Do you allow it?`}
        </p>

        {/* Actions */}
        {isWaiting ? (
          <button
            onClick={onDecline}
            className="btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '700' }}
          >
            <span>CANCEL REQUEST</span>
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={onDecline}
              className="btn-secondary"
              style={{
                padding: '10px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <X size={16} />
              <span>DECLINE</span>
            </button>

            <button
              onClick={onAccept}
              className="btn-primary"
              style={{
                padding: '10px',
                fontSize: '13px',
                fontWeight: '800',
                background: '#047857',
                borderColor: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              <span>ALLOW UNDO</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
