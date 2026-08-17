import React from 'react';
import { Circle, CircleDot, Hash, Trophy, Sparkles, ArrowRight, Bot, User, QrCode } from 'lucide-react';
import { AVATARS, getTier } from '../utils/userProfile.js';

export default function ArcadeHomeScreen({
  profile,
  onSelectGame,
  onOpenProfile,
  onOpenStats,
  onOpenSettings,
  onOpenLeaderboard,
  stats
}) {
  const currentAvatar = AVATARS.find(a => a.id === profile?.avatarId) || AVATARS[0];
  const tier = getTier(profile?.rating || 1200);

  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;

  const GAMES = [
    {
      id: 'gomoku',
      title: 'Gomoku',
      subtitle: '15x15 Five in a Row',
      tagline: 'Deep tactical stone placement on a tournament intersection grid.',
      icon: Circle,
      color: '#0f172a',
      accentColor: '#0f172a',
      bgGradient: '#f1f5f9',
      gridSize: '15 × 15 Grid'
    },
    {
      id: 'connect4',
      title: 'Connect 4',
      subtitle: '7x6 Four in a Row',
      tagline: 'Drop tokens to connect four in a row horizontally, vertically, or diagonally.',
      icon: CircleDot,
      color: '#1e3a8a',
      accentColor: '#1e3a8a',
      bgGradient: '#eff6ff',
      gridSize: '7 × 6 Grid'
    },
    {
      id: 'tictactoe',
      title: 'Tic-Tac-Toe',
      subtitle: '3x3 Fast Match',
      tagline: 'Rapid 3-in-a-row reflexes with instant turns and animations.',
      icon: Hash,
      color: '#881337',
      accentColor: '#881337',
      bgGradient: '#fff1f2',
      gridSize: '3 × 3 Grid'
    }
  ];

  return (
    <div style={{
      width: '100%',
      maxWidth: '1000px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      paddingBottom: '20px'
    }}>
      {/* Player Profile Hero Card */}
      <div className="card-enterprise animate-pop-in" style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* User Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={onOpenProfile}
            style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: currentAvatar.color, color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '900',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {profile?.name ? profile.name[0].toUpperCase() : 'P'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: '900',
                color: '#0f172a',
                margin: 0
              }}>
                {profile?.name || 'Player'}
              </h2>
              <span style={{
                padding: '3px 8px',
                borderRadius: '6px',
                background: `${tier.color}15`,
                border: `1.5px solid ${tier.color}`,
                color: tier.color,
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: '900'
              }}>
                {tier.badge}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#64748b',
              marginTop: '4px'
            }}>
              <span><strong>{profile?.rating || 1200}</strong> ELO</span>
              <span>•</span>
              <span>Level <strong>{profile?.level || 1}</strong></span>
              <span>•</span>
              <span style={{ color: '#065f46', fontWeight: '800' }}>{profile?.wins || 0}W</span>
              <span style={{ color: '#991b1b', fontWeight: '800' }}>{profile?.losses || 0}L</span>
            </div>
          </div>
        </div>

        {/* Quick Career Stats / Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenLeaderboard}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px', borderColor: '#fde68a', background: '#fffbeb', color: '#b45309' }}
          >
            <Trophy size={14} color="#d97706" />
            <span>GLOBAL TOP 50</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            <Sparkles size={14} color="#2563eb" />
            <span>RULES & TIMERS</span>
          </button>

          <button
            onClick={onOpenStats}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            <span>CAREER STATS ({winRate}% WR)</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            <span>EDIT PROFILE</span>
          </button>
        </div>
      </div>

      {/* Select Game Section Title */}
      <div style={{ textAlign: 'left', marginTop: '4px' }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '18px',
          fontWeight: '900',
          color: '#0f172a',
          margin: '0 0 4px 0'
        }}>
          SELECT A GAME & MODE
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: '#64748b',
          margin: 0
        }}>
          Choose a game and mode to launch directly into an isolated match room.
        </p>
      </div>

      {/* Game Cards Grid (Mobile Responsive) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: 'clamp(12px, 3vw, 20px)'
      }}>
        {GAMES.map((game) => {
          const IconComp = game.icon;

          return (
            <div
              key={game.id}
              className="card-enterprise"
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: game.bgGradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${game.accentColor}30`
                  }}>
                    <IconComp size={22} color={game.accentColor} />
                  </div>

                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#64748b'
                  }}>
                    {game.gridSize}
                  </span>
                </div>

                {/* Game Info */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '18px',
                    fontWeight: '900',
                    color: '#0f172a',
                    margin: '0 0 4px 0'
                  }}>
                    {game.title}
                  </h4>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: game.accentColor,
                    marginBottom: '8px'
                  }}>
                    {game.subtitle}
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {game.tagline}
                  </p>
                </div>
              </div>

              {/* Dedicated Mode Launch Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {/* 1. VS Smart Robot (Primary) */}
                <button
                  onClick={() => onSelectGame(game.id, 'VS_COMPUTER')}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Bot size={16} />
                  <span>PLAY VS SMART AI</span>
                  <ArrowRight size={15} />
                </button>

                {/* 2. 2P Local & QR Invite Secondary Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => onSelectGame(game.id, 'LOCAL_2P')}
                    className="btn-secondary"
                    style={{
                      padding: '9px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <User size={14} />
                    <span>2P LOCAL</span>
                  </button>

                  <button
                    onClick={() => onSelectGame(game.id, 'ONLINE_QR')}
                    className="btn-secondary"
                    style={{
                      padding: '9px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#1e3a8a',
                      borderColor: '#bfdbfe'
                    }}
                  >
                    <QrCode size={14} />
                    <span>INVITE (QR)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
