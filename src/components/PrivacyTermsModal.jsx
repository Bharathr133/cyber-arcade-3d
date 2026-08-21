import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyTermsModal({
  isOpen,
  onClose
}) {
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="animate-pop-in"
        style={{
          width: 'min(96vw, 600px)',
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #BFDBFE'
            }}>
              <Lock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Privacy Policy & Terms of Service
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                Your data protection, privacy rights, and fair usage terms
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #CBD5E1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748B', cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '22px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Privacy Policy */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              1. Privacy Policy & Local Storage Isolation
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              At <strong>games4u</strong>, we believe in privacy-by-design. We do not track personal identity, sell personal information, or run third-party advertising trackers.
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
              <li><strong>Guest Mode:</strong> All guest player scores and nicknames are stored exclusively on your device in browser <code>localStorage</code>.</li>
              <li><strong>Registered Accounts:</strong> Emails and encrypted credentials are used solely for authentication and cross-device sync via Supabase.</li>
              <li><strong>Realtime Match Sessions:</strong> Temporary match channels expire immediately after match conclusion.</li>
            </ul>
          </div>

          {/* Terms of Service */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              2. Terms of Service & Fair Play Agreement
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              By accessing and playing on the <strong>games4u</strong> arena, you agree to:
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
              <li>Refrain from using automated bots, engine scripts, or game-state tampering tools in online matches.</li>
              <li>Maintain respectful player usernames and communication.</li>
              <li>Acknowledge that match ratings and leaderboards are managed algorithmically without manual favoritism.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            ACCEPT & CLOSE
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
