import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, Zap, Menu } from 'lucide-react';
import { presenceService } from '../services/presenceService.js';
import MobileMenuDrawer from './MobileMenuDrawer.jsx';

export const GAME_DETAILS = {
  gomoku: { title: 'GOMOKU', subtitle: '15 × 15 Grid', color: '#0f172a' },
  connect4: { title: 'CONNECT 4', subtitle: '7 × 6 Grid', color: '#1e3a8a' },
  tictactoe: { title: 'TIC-TAC-TOE', subtitle: '3 × 3 Grid', color: '#881337' }
};

export default function EnterpriseHeader({
  activeGameId,
  onSelectGame,
  profile,
  isMuted,
  onToggleSound,
  onOpenLeaderboard,
  onOpenStats,
  onOpenSettings,
  onOpenProfile,
  onJoinPrivateRoom
}) {
  const [onlineCount, setOnlineCount] = useState(() => presenceService.getOnlineCount());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = presenceService.subscribe((count) => setOnlineCount(count));
    return () => unsub();
  }, []);

  const isInsideGame = activeGameId && activeGameId !== 'home';
  const currentGame = isInsideGame ? GAME_DETAILS[activeGameId] : null;

  return (
    <>
      <header style={{
        width: '100%',
        maxWidth: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        background: 'rgba(248, 250, 252, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '8px 0',
        marginBottom: isInsideGame ? '6px' : '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
      }}>


        {/* Left Side: Exit Hub (Inside Game) OR Brand Hub Logo (Home) */}
        {isInsideGame ? (
          <button
            onClick={() => onSelectGame('home')}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0f172a',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              minHeight: '36px'
            }}
          >
            <ArrowLeft size={15} />
            <span>EXIT (HUB)</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mobile Hamburger Menu Button on Left */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="btn-secondary mobile-menu-btn"
              title="Open Navigation Menu"
              style={{
                width: '36px', height: '36px', padding: 0,
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#ffffff',
                borderColor: '#cbd5e1',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <Menu size={18} />
            </button>

            <div
              onClick={() => onSelectGame('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
              }}>
                <Zap size={18} fill="#ffffff" />
              </div>

              <div>
                <h1 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(16px, 4vw, 19px)',
                  fontWeight: '900',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}>
                  CYBER ARCADE 3D
                </h1>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: '#64748b',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Multiplayer Game Arena
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Center Game Indicator (Inside Game) */}
        {isInsideGame && currentGame && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            padding: '4px 12px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
              {currentGame.title}
            </span>
          </div>
        )}

        {/* Right Side Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Online count badge */}
          <div
            title={`${onlineCount} Players Online Realtime`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: '800',
              color: '#059669',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '4px 9px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span>{onlineCount} ONLINE</span>
          </div>


          {/* Sound Toggle (Desktop) */}
          <button
            onClick={onToggleSound}
            className="btn-secondary desktop-sound-btn"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            style={{
              width: '36px', height: '36px', padding: 0,
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isMuted ? '#fff1f2' : '#ffffff',
              borderColor: isMuted ? '#fecdd3' : '#cbd5e1',
              color: isMuted ? '#e11d48' : '#0f172a'
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>


      {/* Mobile Slide-in Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenStats={onOpenStats}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
        onSelectGame={onSelectGame}
        onJoinPrivateRoom={onJoinPrivateRoom}
      />
    </>
  );
}

