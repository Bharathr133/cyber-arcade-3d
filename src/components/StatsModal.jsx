import React from 'react';
import { Trophy, X, RotateCcw, Award, Flame } from 'lucide-react';

export default function StatsModal({ isOpen, onClose, stats, onResetStats }) {
  if (!isOpen) return null;

  const getWinRate = (wins, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
  };

  const GAME_STATS_CONFIG = [
    { key: 'gomoku', title: 'Gomoku (Five in a Row)', color: '#0f172a' },
    { key: 'connect4', title: 'Connect 4', color: '#2563eb' },
    { key: 'tictactoe', title: 'Tic-Tac-Toe', color: '#f43f5e' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200
    }}>
      <div className="card-enterprise animate-pop-in" style={{
        width: 'min(94vw, 540px)',
        padding: 'clamp(18px, 4vw, 32px)',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: '20px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Trophy size={20} color="#d97706" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              MATCH STATISTICS & RECORDS
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
              Lifetime Performance Tracker
            </span>
          </div>
        </div>

        {/* Stats Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {GAME_STATS_CONFIG.map(({ key, title, color }) => {
            const st = stats[key] || { p1Wins: 0, p2Wins: 0, draws: 0, totalMatches: 0 };
            const total = (st.p1Wins || 0) + (st.p2Wins || 0) + (st.draws || 0);

            return (
              <div
                key={key}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: '800', color }}>
                    {title}
                  </h4>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                    WIN RATE: {getWinRate(st.p1Wins, total)}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>P1 WINS</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>{st.p1Wins || 0}</span>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>P2 WINS</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#f43f5e' }}>{st.p2Wins || 0}</span>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>DRAWS</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748b' }}>{st.draws || 0}</span>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>TOTAL</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{total}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={onResetStats}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            <RotateCcw size={14} />
            <span>RESET RECORDS</span>
          </button>

          <button
            className="btn-primary"
            onClick={onClose}
            style={{ padding: '8px 20px', fontSize: '12px' }}
          >
            <span>CLOSE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
