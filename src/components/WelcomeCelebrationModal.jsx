import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ArrowRight, X, Award, Shield, Zap } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function WelcomeCelebrationModal({
  isOpen,
  profile,
  onClose,
  onStartQuickMatch
}) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      try {
        soundSynth.playVictory();
      } catch (e) {}

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playerName = profile?.name;
  const playerRating = profile?.rating || 1200;



  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(9, 9, 11, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="animate-pop-in"
        style={{
          width: 'min(100%, 420px)',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E4E4E7',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
          padding: '28px 24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '18px',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            border: 'none',
            background: '#F4F4F5',
            color: '#71717A',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
        >
          <X size={15} />
        </button>

        {/* Minimal Verified Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#16A34A',
          marginTop: '4px'
        }}>
          <CheckCircle2 size={30} strokeWidth={2} />
        </div>

        {/* Header Content */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: '#F4F4F5',
            color: '#52525B',
            fontSize: '11px',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            padding: '3px 8px',
            borderRadius: '6px',
            marginBottom: '10px'
          }}>
            <span>VERIFIED ACCOUNT</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '20px',
            fontWeight: '800',
            color: '#18181B',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em'
          }}>
            Welcome, {playerName}
          </h2>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: '#71717A',
            margin: 0,
            lineHeight: 1.5
          }}>
            Your email has been authenticated. You can now compete in rated matches and climb the global rankings.
          </p>
        </div>

        {/* Account Details Row */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          background: '#FAFAFA',
          border: '1px solid #E4E4E7',
          borderRadius: '12px',
          padding: '12px 8px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717A', fontFamily: 'var(--font-mono)' }}>STARTING RATING</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '800', color: '#18181B', marginTop: '2px' }}>{playerRating} ELO</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #E4E4E7', borderRight: '1px solid #E4E4E7' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717A', fontFamily: 'var(--font-mono)' }}>TIER</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>Bronze I</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717A', fontFamily: 'var(--font-mono)' }}>BONUS</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '800', color: '#16A34A', marginTop: '2px' }}>+50 XP</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
          <button
            onClick={() => {
              onClose();
              if (onStartQuickMatch) onStartQuickMatch('connect4', 'Connect 4');
            }}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <span>Start Quick Match</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

