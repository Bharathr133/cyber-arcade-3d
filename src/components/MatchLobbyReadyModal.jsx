import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Clock, Shuffle, User, Zap, Wifi, Settings, ShieldCheck } from 'lucide-react';
import { AVATARS, getTier } from '../utils/userProfile.js';

export default function MatchLobbyReadyModal({
  isOpen,
  gameTitle = 'GOMOKU',
  myProfile,
  opponentProfile,
  settings,
  onUpdateSettings,
  onStartMatch
}) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const myAvatar = AVATARS.find(a => a.id === myProfile?.avatarId) || AVATARS[0];
  const oppAvatar = AVATARS.find(a => a.id === opponentProfile?.avatarId) || AVATARS[1];

  const myTier = getTier(myProfile?.rating || 1200);
  const oppTier = getTier(opponentProfile?.rating || 1200);

  const turnTimeLabel = settings?.turnTimeLimit === 0 ? 'Unlimited' : `${settings?.turnTimeLimit || 30}s / turn`;
  const firstPlayerLabel = settings?.firstPlayer === 'p1' ? 'You First' : settings?.firstPlayer === 'p2' ? 'Opponent First' : 'Random Coin Toss';

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto'
      }}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(94vw, 440px)',
          maxHeight: '90vh',
          padding: 'clamp(24px, 5vw, 32px)',
          background: '#ffffff',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxSizing: 'border-box',
          margin: 'auto'
        }}
      >
        {/* Connected Pulse Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px',
          borderRadius: '20px',
          background: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: '800',
          color: '#065f46'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span>PEER CONNECTED • ZERO-LATENCY</span>
        </div>

        {/* Title */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(20px, 4.5vw, 24px)',
            fontWeight: '900',
            color: '#0f172a',
            margin: '0 0 4px 0',
            letterSpacing: '-0.02em'
          }}>
            MATCH READY!
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: '#64748b',
            margin: 0
          }}>
            Both players are connected. Either player can start the match!
          </p>
        </div>

        {/* Dual Players Matchup Card */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '8px',
          alignItems: 'center',
          background: '#f8fafc',
          padding: '14px 12px',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0'
        }}>
          {/* Player 1 (You) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: myAvatar.color, color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '900',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
            }}>
              {myProfile?.name ? myProfile.name[0].toUpperCase() : 'P1'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                {myProfile?.name || 'You'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                {myProfile?.rating || 1200} ELO
              </span>
            </div>
          </div>

          {/* VS Divider */}
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            fontWeight: '900',
            color: '#94a3b8',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            VS
          </div>

          {/* Player 2 (Opponent) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: oppAvatar.color, color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '900',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
            }}>
              {opponentProfile?.name ? opponentProfile.name[0].toUpperCase() : 'P2'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                {opponentProfile?.name || 'Opponent'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                {opponentProfile?.rating || 1200} ELO
              </span>
            </div>
          </div>
        </div>

        {/* Match Rules Summary */}
        <div style={{
          width: '100%',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#475569'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="#2563eb" />
            <span>{turnTimeLabel}</span>
          </div>
          <span>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shuffle size={14} color="#92400e" />
            <span>{firstPlayerLabel}</span>
          </div>
        </div>

        {/* Big Prominent START MATCH Button */}
        <button
          onClick={onStartMatch}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
            minHeight: '48px',
            cursor: 'pointer'
          }}
        >
          <Play size={18} fill="#ffffff" />
          <span>START MATCH NOW</span>
        </button>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#94a3b8' }}>
          Tapping Start initiates the game immediately on both devices.
        </span>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
