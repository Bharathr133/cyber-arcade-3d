import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X, RotateCcw, Award, Flame, Circle, CircleDot, Hash, Layers, Dices } from 'lucide-react';
import { getTier } from '../utils/userProfile.js';

export default function StatsModal({
  isOpen,
  onClose,
  profile,
  stats,
  onResetStats
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

  const gameStats = profile?.gameStats || {
    gomoku: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
    connect4: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
    tictactoe: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
    memory: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
    ludo: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 }
  };

  const calculateTotal = (gameData) => {
    const wins = gameData.wins || 0;
    const losses = gameData.losses || 0;
    const draws = gameData.draws || 0;
    const total = wins + losses + draws;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { wins, losses, draws, total, winRate, rating: gameData.rating || 1200, level: gameData.level || 1, xp: gameData.xp || 0 };
  };

  const gomoku = calculateTotal(gameStats.gomoku || {});
  const connect4 = calculateTotal(gameStats.connect4 || {});
  const tictactoe = calculateTotal(gameStats.tictactoe || {});
  const memory = calculateTotal(gameStats.memory || {});
  const ludo = calculateTotal(gameStats.ludo || {});

  const allWins = (profile?.wins || 0);
  const allLosses = (profile?.losses || 0);
  const allDraws = (profile?.draws || 0);
  const allTotal = allWins + allLosses + allDraws;
  const allWinRate = allTotal > 0 ? Math.round((allWins / allTotal) * 100) : 0;

  const STAT_CARDS = [
    { title: 'Gomoku (15×15)', key: 'gomoku', icon: Circle, data: gomoku, color: '#0f172a', bg: '#f1f5f9' },
    { title: 'Connect 4 (7×6)', key: 'connect4', icon: CircleDot, data: connect4, color: '#1e3a8a', bg: '#eff6ff' },
    { title: 'Tic-Tac-Toe (3×3)', key: 'tictactoe', icon: Hash, data: tictactoe, color: '#881337', bg: '#fff1f2' },
    { title: 'Memory Match', key: 'memory', icon: Layers, data: memory, color: '#d97706', bg: '#fffbeb' },
    { title: 'Ludo Championship', key: 'ludo', icon: Dices, data: ludo, color: '#dc2626', bg: '#fef2f2' }
  ];


  const overallTier = getTier(profile?.rating || 1200);

  const modalContent = (
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
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(95vw, 480px)',
          maxHeight: '90dvh',
          padding: 'clamp(14px, 4vw, 24px)',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-close-btn"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
          }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Trophy size={22} color="#d97706" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              CAREER STATS & LEVELS
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
              Per-Game Progression & Rating Tracker
            </span>
          </div>
        </div>

        {/* Global Summary Card */}
        <div style={{
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '16px 18px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '900' }}>
                {profile?.rating || 1200} ELO
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: '900',
                padding: '2px 6px', borderRadius: '4px', background: `${overallTier.color}30`, color: '#ffffff'
              }}>
                {overallTier.badge}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              Career Level {profile?.level || 1} • {allWinRate}% Win Rate
            </span>
          </div>

          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div style={{ color: '#4ade80', fontWeight: '800' }}>{allWins} WINS</div>
            <div style={{ color: '#f87171', fontWeight: '800' }}>{allLosses} LOSSES</div>
            <div style={{ color: '#94a3b8' }}>{allDraws} DRAWS</div>
          </div>
        </div>

        {/* Individual Game Breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          {STAT_CARDS.map((card) => {
            const IconComp = card.icon;
            const gameTier = getTier(card.data.rating);
            const xpReq = card.data.level * 100;
            const xpPercent = Math.min(100, Math.round((card.data.xp / xpReq) * 100));

            return (
              <div key={card.title} style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <IconComp size={16} color={card.color} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: card.color }}>
                        {card.title}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', display: 'block' }}>
                        Level <strong>{card.data.level}</strong> • <strong>{card.data.rating}</strong> ELO ({gameTier.badge})
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                      {card.data.winRate}% WR
                    </span>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>
                      <strong style={{ color: '#065f46' }}>{card.data.wins}W</strong> - <strong style={{ color: '#991b1b' }}>{card.data.losses}L</strong> - {card.data.draws}D
                    </div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#64748b', marginBottom: '3px' }}>
                    <span>XP: {card.data.xp} / {xpReq}</span>
                    <span>{xpPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${xpPercent}%`, height: '100%', background: card.color, borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Official Career Verification Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '11px',
          color: '#64748b',
          fontFamily: 'var(--font-mono)'
        }}>
          <Award size={13} color="#0f172a" />
          <span>Official Competitive Record • Verified ELO & History</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

