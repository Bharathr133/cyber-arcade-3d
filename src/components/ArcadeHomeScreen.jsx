import React from 'react';
import { 
  Bot, User, Zap, Lock, Check
} from 'lucide-react';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon } from './GameIcons.jsx';

// Clean, Minimalist Vector Board Previews (Monochrome & Slate)
function TicTacToeTilePreview() {
  return (
    <div style={{
      width: '100%',
      height: '170px',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderRadius: '14px',
      border: '1px solid #f1f5f9',
      boxSizing: 'border-box'
    }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', maxWidth: '130px' }}>
        {/* Crisp Slate Grid Lines */}
        <line x1="40" y1="14" x2="40" y2="106" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="14" x2="80" y2="106" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="14" y1="40" x2="106" y2="40" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="14" y1="80" x2="106" y2="80" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />

        {/* Minimalist Dark X Marks */}
        <g stroke="#0f172a" strokeWidth="5" strokeLinecap="round">
          <line x1="20" y1="20" x2="34" y2="34" />
          <line x1="34" y1="20" x2="20" y2="34" />

          <line x1="58" y1="58" x2="72" y2="72" />
          <line x1="72" y1="58" x2="58" y2="72" />

          <line x1="96" y1="58" x2="110" y2="72" />
          <line x1="110" y1="58" x2="96" y2="72" />
        </g>

        {/* Minimalist Slate O Marks */}
        <circle cx="103" cy="27" r="9" stroke="#64748b" strokeWidth="4" fill="none" />
        <circle cx="27" cy="65" r="9" stroke="#64748b" strokeWidth="4" fill="none" />
        <circle cx="103" cy="103" r="9" stroke="#64748b" strokeWidth="4" fill="none" />
      </svg>
    </div>
  );
}

function ConnectFourTilePreview() {
  return (
    <div style={{
      width: '100%',
      height: '170px',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderRadius: '14px',
      border: '1px solid #f1f5f9',
      boxSizing: 'border-box'
    }}>
      <svg viewBox="0 0 140 120" style={{ width: '100%', height: '100%', maxWidth: '140px' }}>
        {[0, 1, 2, 3, 4, 5].map((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) => {
            const cx = 15 + col * 18;
            const cy = 15 + row * 18;
            let fill = '#e2e8f0';
            if (row === 5 && (col === 1 || col === 2 || col === 3 || col === 4)) fill = '#0f172a';
            else if (row === 4 && (col === 2 || col === 3 || col === 4)) fill = '#64748b';
            else if (row === 3 && (col === 3 || col === 4)) fill = '#0f172a';
            else if (row === 2 && col === 3) fill = '#64748b';
            else if (row === 5 && (col === 0 || col === 6)) fill = '#64748b';

            return (
              <circle
                key={`${row}-${col}`}
                cx={cx}
                cy={cy}
                r="7"
                fill={fill}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

function GomokuTilePreview() {
  return (
    <div style={{
      width: '100%',
      height: '170px',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderRadius: '14px',
      border: '1px solid #f1f5f9',
      boxSizing: 'border-box'
    }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', maxWidth: '130px' }}>
        {[20, 36, 52, 68, 84, 100].map((pos) => (
          <React.Fragment key={pos}>
            <line x1="20" y1={pos} x2="100" y2={pos} stroke="#e2e8f0" strokeWidth="1.5" />
            <line x1={pos} y1="20" x2={pos} y2="100" stroke="#e2e8f0" strokeWidth="1.5" />
          </React.Fragment>
        ))}

        {/* Minimalist Dark Winning Stones */}
        <circle cx="36" cy="84" r="6" fill="#0f172a" />
        <circle cx="52" cy="68" r="6" fill="#0f172a" />
        <circle cx="68" cy="52" r="6" fill="#0f172a" />
        <circle cx="84" cy="36" r="6" fill="#0f172a" />
        <circle cx="100" cy="20" r="6" fill="#0f172a" />

        {/* Minimalist Muted Stones */}
        <circle cx="52" cy="84" r="6" fill="#94a3b8" />
        <circle cx="68" cy="68" r="6" fill="#94a3b8" />
        <circle cx="84" cy="52" r="6" fill="#94a3b8" />
        <circle cx="36" cy="52" r="6" fill="#94a3b8" />
      </svg>
    </div>
  );
}

export default function ArcadeHomeScreen({
  onSelectGame,
  onStartQuickMatch,
  onCreatePrivateRoom
}) {
  const GAMES = [
    {
      id: 'connect4',
      title: 'CONNECT 4',
      subtitle: '7 × 6 Gravity Grid',
      specBadge: '7×6 GRID',
      icon: ConnectFourIcon,
      preview: <ConnectFourTilePreview />
    },
    {
      id: 'tictactoe',
      title: 'TIC TAC TOE',
      subtitle: '3 × 3 Fast Arena',
      specBadge: '3×3 FAST',
      icon: TicTacToeIcon,
      preview: <TicTacToeTilePreview />
    },
    {
      id: 'gomoku',
      title: 'GOMOKU',
      subtitle: '15 × 15 Tournament Grid',
      specBadge: '15×15 PRO',
      icon: GomokuIcon,
      preview: <GomokuTilePreview />
    }
  ];

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      paddingBottom: '24px',
      boxSizing: 'border-box'
    }}>
      {/* 3 Clean, Minimalist, Responsive Game Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
        gap: '20px',
        width: '100%'
      }}>

        {GAMES.map((game) => {
          const IconComp = game.icon;

          return (
            <div
              key={game.id}
              className="card-enterprise animate-pop-in"
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '18px',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.04)';
              }}
            >
              {/* Header: Title + Spec Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0
                  }}>
                    <IconComp size={18} />
                  </div>

                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '17px',
                      fontWeight: '900',
                      color: '#0f172a',
                      margin: 0,
                      letterSpacing: '-0.01em'
                    }}>
                      {game.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {game.subtitle}
                    </p>
                  </div>
                </div>

                {/* Minimalist Spec Tag */}
                <span style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '3px 7px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em'
                }}>
                  {game.specBadge}
                </span>
              </div>

              {/* Minimalist Preview Canvas */}
              <div>
                {game.preview}
              </div>

              {/* 4 Direct Launch Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {/* 1. Quick Match (Online) */}
                <button
                  onClick={() => onStartQuickMatch(game.id, game.title)}
                  style={{
                    padding: '9px 6px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Zap size={13} fill="#ffffff" />
                  <span>Online</span>
                </button>

                {/* 2. Play Solo AI */}
                <button
                  onClick={() => onSelectGame(game.id, 'VS_COMPUTER')}
                  className="btn-secondary"
                  style={{
                    padding: '9px 6px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <Bot size={13} color="#0f172a" />
                  <span>Vs AI</span>
                </button>

                {/* 3. 2P Pass & Play (Local) */}
                <button
                  onClick={() => onSelectGame(game.id, 'LOCAL_2P')}
                  className="btn-secondary"
                  style={{
                    padding: '9px 6px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <User size={13} color="#0f172a" />
                  <span>2P Local</span>
                </button>

                {/* 4. Private Friend Room */}
                <button
                  onClick={() => onCreatePrivateRoom(game.id, game.title)}
                  className="btn-secondary"
                  style={{
                    padding: '9px 6px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    color: '#475569'
                  }}
                >
                  <Lock size={13} color="#64748b" />
                  <span>Room</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Minimalist Tagline */}
      <div style={{
        textAlign: 'center',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: '900',
          color: '#0f172a',
          margin: 0
        }}>
          A unique gaming platform
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          flexWrap: 'wrap',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: '700',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={14} color="#0f172a" strokeWidth={2.5} />
            <span>100% Free</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={14} color="#0f172a" strokeWidth={2.5} />
            <span>Realtime Multiplayer</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={14} color="#0f172a" strokeWidth={2.5} />
            <span>Anti-Cheat Verified</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={14} color="#0f172a" strokeWidth={2.5} />
            <span>20s Blitz Timers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
