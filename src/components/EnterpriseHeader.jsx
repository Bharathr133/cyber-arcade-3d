import React from 'react';
import { ArrowLeft, Volume2, VolumeX, BarChart3, Wifi, Zap, User, LogOut } from 'lucide-react';
import { AVATARS, getTier } from '../utils/userProfile.js';

export const GAME_DETAILS = {
  gomoku: { title: 'GOMOKU', subtitle: '15 × 15 Five in a Row', color: '#0f172a' },
  connect4: { title: 'CONNECT 4', subtitle: '7 × 6 Four in a Row', color: '#1e3a8a' },
  tictactoe: { title: 'TIC-TAC-TOE', subtitle: '3 × 3 Fast Match', color: '#881337' }
};

export default function EnterpriseHeader({
  activeGameId,
  onSelectGame,
  onOpenStats,
  onOpenProfile,
  profile,
  isMuted,
  onToggleSound,
  isOnlineActive
}) {
  const currentAvatar = AVATARS.find(a => a.id === profile?.avatarId) || AVATARS[0];
  const currentTier = getTier(profile?.rating || 1200);

  const isInsideGame = activeGameId && activeGameId !== 'home';
  const currentGame = isInsideGame ? GAME_DETAILS[activeGameId] : null;

  return (
    <header style={{
      width: '100%',
      maxWidth: '1000px',
      marginBottom: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Dynamic Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left Side: Exit Room Button (Inside Game) OR Brand Hub Logo (On Home) */}
        {isInsideGame ? (
          <button
            onClick={() => onSelectGame('home')}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0f172a',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1'
            }}
          >
            <ArrowLeft size={16} />
            <span>EXIT ROOM (HUB)</span>
          </button>
        ) : (
          <div
            onClick={() => onSelectGame('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
            }}>
              <Zap size={18} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: '900',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  CHAMPIONSHIP ARENA
                </h1>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
                Strategy Gaming Suite
              </span>
            </div>
          </div>
        )}

        {/* Center: Active Game Title (When inside a game) */}
        {isInsideGame && currentGame && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '14px',
              fontWeight: '900',
              color: currentGame.color
            }}>
              {currentGame.title}
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#64748b',
              fontWeight: '700'
            }}>
              {currentGame.subtitle}
            </span>
          </div>
        )}

        {/* Right Side: Profile Pill & Quick Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* User Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="card-enterprise"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1'
            }}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: currentAvatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: '900'
            }}>
              {profile?.name ? profile.name[0].toUpperCase() : 'P'}
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                  {profile?.name || 'Player'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: '800',
                  color: currentTier.color, background: `${currentTier.color}15`,
                  padding: '1px 5px', borderRadius: '4px'
                }}>
                  {profile?.rating || 1200}
                </span>
              </div>
            </div>
          </button>

          {/* Stats Button */}
          <button
            className="btn-secondary"
            onClick={onOpenStats}
            title="View Match History & Win Rates"
            style={{ padding: '8px 12px' }}
          >
            <BarChart3 size={16} color="#475569" />
          </button>

          {/* Sound Toggle */}
          <button
            className="btn-secondary"
            onClick={onToggleSound}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            style={{ padding: '8px 12px' }}
          >
            {isMuted ? <VolumeX size={16} color="#94a3b8" /> : <Volume2 size={16} color="#0f172a" />}
          </button>
        </div>
      </div>
    </header>
  );
}
