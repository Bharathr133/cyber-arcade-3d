import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';

const CustomAlertContext = createContext(null);

export function CustomAlertProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    subtitle: '',
    meta: null,
    type: 'success', // success, error, warning, confirm
    confirmText: 'OK',
    cancelText: 'Cancel',
    isDestructive: false
  });

  const resolverRef = useRef(null);

  const show = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        isOpen: true,
        title: options.title || 'Notification',
        message: options.message || '',
        subtitle: options.subtitle || '',
        meta: options.meta || null,
        type: options.type || 'success',
        confirmText: options.confirmText || (options.type === 'confirm' ? 'Confirm' : 'OK'),
        cancelText: options.cancelText || 'Cancel',
        isDestructive: options.isDestructive || false
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
    if (resolverRef.current) resolverRef.current(true);
  }, []);

  const handleCancel = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
    if (resolverRef.current) resolverRef.current(false);
  }, []);

  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);

  // Lock body scroll when open
  useEffect(() => {
    if (state.isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [state.isOpen]);

  // Auto-focus primary action button on modal open
  useEffect(() => {
    if (!state.isOpen) return;

    const timer = setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 30);

    return () => clearTimeout(timer);
  }, [state.isOpen]);

  // Keyboard accessibility: Escape cancels, Arrow Left/Right toggles button focus
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (state.type === 'confirm' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        if (document.activeElement === confirmBtnRef.current && cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        } else if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, state.type, handleCancel]);

  const alertModal = state.isOpen ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 999999,
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        animation: 'alertFadeIn 0.15s ease-out forwards'
      }}
    >
      <div
        className="card-enterprise"
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1.5px solid #e2e8f0',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          animation: 'alertScaleUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          boxSizing: 'border-box',
          margin: 'auto'
        }}
      >
        {/* Dynamic Type Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state.type === 'success' && (
            <div style={{
              width: '56px', height: '56px', color: '#10b981', background: '#ecfdf5',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #a7f3d0', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle size={32} />
            </div>
          )}
          {state.type === 'error' && (
            <div style={{
              width: '56px', height: '56px', color: '#ef4444', background: '#fef2f2',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #fecaca', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)'
            }}>
              <AlertCircle size={32} />
            </div>
          )}
          {state.type === 'warning' && (
            <div style={{
              width: '56px', height: '56px', color: '#f59e0b', background: '#fffbeb',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #fde68a', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.2)'
            }}>
              <AlertTriangle size={32} />
            </div>
          )}
          {state.type === 'confirm' && (
            <div style={{
              width: '56px', height: '56px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${state.isDestructive ? '#fecaca' : '#bfdbfe'}`,
              color: state.isDestructive ? '#ef4444' : '#2563eb',
              background: state.isDestructive ? '#fef2f2' : '#eff6ff',
              boxShadow: `0 8px 20px ${state.isDestructive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.2)'}`
            }}>
              {state.isDestructive ? <AlertTriangle size={32} /> : <HelpCircle size={32} />}
            </div>
          )}
        </div>

        {/* Optional Subtitle Badge */}
        {state.subtitle && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '800',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {state.subtitle}
          </span>
        )}

        {/* Title & Message */}
        <div style={{ width: '100%' }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '17px',
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0'
          }}>
            {state.title}
          </h3>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: '#64748b',
            lineHeight: 1.4,
            fontWeight: '500',
            margin: 0,
            padding: '0 8px'
          }}>
            {state.message}
          </p>
        </div>

        {/* Optional Metadata Details Box */}
        {state.meta && (
          <div style={{
            width: '100%',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '12px 14px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '140px',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}>
            {Object.entries(state.meta).map(([key, val]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#64748b'
              }}>
                <span style={{ textTransform: 'uppercase', fontWeight: '700' }}>{key}:</span>
                <span style={{ color: '#0f172a', fontWeight: '800' }}>{val || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ width: '100%', marginTop: '4px' }}>
          {state.type === 'confirm' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
                style={{
                  padding: '11px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '800',
                  minHeight: '44px'
                }}
              >
                {state.cancelText}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: '11px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  background: state.isDestructive ? '#dc2626' : '#2563eb',
                  boxShadow: state.isDestructive ? '0 4px 12px rgba(220, 38, 38, 0.3)' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                  minHeight: '44px',
                  transition: 'all 0.15s ease'
                }}
              >
                {state.confirmText}
              </button>
            </div>
          ) : (
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={handleConfirm}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '800',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                background: state.type === 'error' ? '#dc2626' : state.type === 'warning' ? '#d97706' : '#0f172a',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '44px',
                transition: 'all 0.15s ease'
              }}
            >
              {state.confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <CustomAlertContext.Provider value={{ show }}>
      {children}
      {typeof document !== 'undefined' && alertModal && createPortal(alertModal, document.body)}
      <style>{`
        @keyframes alertFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes alertScaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </CustomAlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within a CustomAlertProvider');
  }
  return context;
}
