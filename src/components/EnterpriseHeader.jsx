import React from 'react';
import { ArrowLeft, Volume2, VolumeX, BarChart3, Zap } from 'lucide-react';
import { AVATARS, getTier } from '../utils/userProfile.js';

export const GAME_DETAILS = {
  gomoku: { title: 'GOMOKU', subtitle: '15 × 15 Grid', color: '#0f172a' },
  connect4: { title: 'CONNECT 4', subtitle: '7 × 6 Grid', color: '#1e3a8a' },
  tictactoe: { title: 'TIC-TAC-TOE', subtitle: '3 × 3 Grid', color: '#881337' }
};

export default function EnterpriseHeader({
  activeGameId,
  onSelectGame,
  onOpenStats,
  onOpenProfile,
  profile,
  isMuted,
  onToggleSound
}) {
  const currentAvatar = AVATARS.find(a => a.id === profile?.avatarId) || AVATARS[0];
  const currentTier = getTier(profile?.rating || 1200);

  const isInsideGame = activeGameId && activeGameId !== 'home';
  const currentGame = isInsideGame ? GAME_DETAILS[activeGameId] : null;

  return (
    <header style={{
      width: '100%',
      maxWidth: '1000px',
      marginBottom: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Dynamic Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: '8px',
        width: '100%'
      }}>
        {/* Left Side: Exit Room Button (Inside Game) OR Brand Hub Logo (On Home) */}
        {isInsideGame ? (
          <button
            onClick={() => onSelectGame('home')}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
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
              flexShrink: 0,
              minHeight: '38px'
            }}
          >
            <ArrowLeft size={15} />
            <span>EXIT (HUB)</span>
          </button>
        ) : (
          <div
            onClick={() => onSelectGame('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: '34px', height: '34px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)'
            }}>
              <Zap size={16} />
            </div>

            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(14px, 4vw, 18px)',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1
              }}>
                CHAMPIONSHIP
              </h1>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b' }}>
                Arena 3D
              </span>
            </div>
          </div>
        )}

        {/* Center: Active Game Title (When inside a game, hidden on ultra-small screens to preserve room) */}
        {isInsideGame && currentGame && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            padding: '4px 10px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: '900',
              color: currentGame.color,
              whiteSpace: 'nowrap'
            }}>
              {currentGame.title}
            </span>
          </div>
        )}

        {/* Right Side: Profile Pill & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* User Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="card-enterprise"
            style={{
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              minHeight: '38px'
            }}
          >
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: currentAvatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: '900',
              flexShrink: 0
            }}>
              {profile?.name ? profile.name[0].toUpperCase() : 'P'}
            </div>

            <div style={{ textAlign: 'left' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: '800',
                color: currentTier.color, background: `${currentTier.color}15`,
                padding: '1px 4px', borderRadius: '4px'
              }}>
                {profile?.rating || 1200}
              </span>
            </div>
          </button>

          {/* Stats Button */}
          <button
            className="btn-secondary"
            onClick={onOpenStats}
            title="Career Stats"
            style={{ padding: '6px 10px', minHeight: '38px' }}
          >
            <BarChart3 size={15} color="#475569" />
          </button>

          {/* Sound Toggle */}
          <button
            className="btn-secondary"
            onClick={onToggleSound}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            style={{ padding: '6px 10px', minHeight: '38px' }}
          >
            {isMuted ? <VolumeX size={15} color="#94a3b8" /> : <Volume2 size={15} color="#0f172a" />}
          </button>
        </div>
      </div>
    </header>
  );
}
