import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, LogOut, X } from 'lucide-react';

export default function ExitMatchConfirmModal({
  isOpen,
  isOnline = false,
  onConfirmExit,
  onCancel
}) {
  if (!isOpen) return null;

  const content = (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onCancel}
    >
      <div 
        className="animate-pop-in"
        style={{
          width: 'min(100%, 420px)',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Danger Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#FEE2E2',
              border: '1.5px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              flexShrink: 0
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <span style={{
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#DC2626',
                fontFamily: 'var(--font-mono)'
              }}>
                CONFIRMATION
              </span>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '900',
                fontFamily: 'var(--font-heading)',
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                Exit Current Match?
              </h2>
            </div>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#475569',
          lineHeight: '1.5',
          fontFamily: 'var(--font-body)'
        }}>
          {isOnline ? (
            <>
              Are you sure you want to leave this match? Leaving an active <strong>ranked online match</strong> will count as a forfeit and result in an ELO penalty.
            </>
          ) : (
            <>
              Are you sure you want to exit? Your current in-progress match will be terminated and unsaved progress will be lost.
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '4px'
        }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            style={{
              padding: '11px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '800',
              justifyContent: 'center'
            }}
          >
            Stay in Match
          </button>

          <button
            type="button"
            onClick={onConfirmExit}
            style={{
              padding: '11px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '800',
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
            }}
          >
            <LogOut size={15} />
            <span>Exit Match</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
