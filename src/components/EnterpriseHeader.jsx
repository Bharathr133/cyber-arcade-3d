import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, Zap, Menu, User } from 'lucide-react';
import { presenceService } from '../services/presenceService.js';
import { AVATARS } from '../utils/userProfile.js';
import MobileMenuDrawer from './MobileMenuDrawer.jsx';

export const GAME_DETAILS = {
  gomoku: { title: 'GOMOKU', subtitle: '15 × 15 Grid' },
  connect4: { title: 'CONNECT 4', subtitle: '7 × 6 Grid' },
  tictactoe: { title: 'TIC-TAC-TOE', subtitle: '3 × 3 Grid' },
  memory: { title: 'MEMORY MATCH', subtitle: 'Icon Match Blitz' },
  ludo: { title: 'LUDO CHAMPIONSHIP', subtitle: '2-4 Player Arena' }
};

export default function EnterpriseHeader({
  activeGameId,
  onSelectGame,
  profile,
  isMuted,
  onToggleSound,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenProfile,
  onOpenAdmin,
  onJoinPrivateRoom,
  onLogout,
  onNavigateToAuth
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
        zIndex: 80,
        background: 'rgba(250, 250, 250, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '10px 0',
        marginBottom: isInsideGame ? '8px' : '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        borderBottom: '1px solid #E4E4E7'
      }}>
        {/* Left Side: Exit / Abort Match (Inside Game) OR Brand Hub Logo (Home) */}
        {isInsideGame ? (
          <button
            onClick={() => onSelectGame('home')}
            className="btn-secondary"
            style={{
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#DC2626',
              border: '1px solid #FECACA',
              background: '#FEF2F2',
              cursor: 'pointer'
            }}
            title="Exit / Abort current match"
          >
            <ArrowLeft size={14} color="#DC2626" />
            <span>EXIT MATCH</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="btn-secondary mobile-menu-btn"
              title="Open Navigation Menu"
              style={{
                width: '34px', height: '34px', padding: 0,
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Menu size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '16px',
                fontWeight: '800',
                color: '#18181B',
                letterSpacing: '-0.02em'
              }}>
                games4u
              </span>
            </div>

          </div>
        )}

        {/* Center: In-Game Game Title */}
        {isInsideGame && currentGame && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '14px',
              fontWeight: '800',
              color: '#18181B'
            }}>
              {currentGame.title}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: '#71717A',
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#F4F4F5',
              border: '1px solid #E4E4E7'
            }}>
              {currentGame.subtitle}
            </span>
          </div>
        )}

        {/* Right Side: Settings + Mute Toggle + Online Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isInsideGame && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 9px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #E4E4E7',
              fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700',
              color: '#18181B'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
              <span>{onlineCount}</span>
              <span style={{ fontSize: '9px', color: '#71717A', fontWeight: '500' }}>ONLINE</span>
            </div>
          )}

          {/* In-Game Match Settings Modal Button */}
          {isInsideGame && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#FFFFFF', border: '1px solid #E4E4E7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#52525B', cursor: 'pointer'
              }}
              title="Game Settings"
            >
              <Menu size={15} />
            </button>
          )}

          {/* Sound Toggle Button */}
          <button
            onClick={onToggleSound}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #E4E4E7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#52525B', cursor: 'pointer'
            }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} color="#DC2626" /> : <Volume2 size={15} />}
          </button>
        </div>
      </header>



      {/* Mobile Drawer Menu Portal */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
        onOpenAdmin={onOpenAdmin}
        onSelectGame={onSelectGame}
        onJoinPrivateRoom={onJoinPrivateRoom}
        onLogout={onLogout}
        onNavigateToAuth={onNavigateToAuth}
      />
    </>
  );
}

