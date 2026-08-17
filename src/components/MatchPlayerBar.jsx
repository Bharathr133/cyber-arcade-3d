import React from 'react';
import { Trophy, Bot, User, Circle, Disc, Hash, MinusCircle, CheckCircle2 } from 'lucide-react';
import { AVATARS, getTier } from '../utils/userProfile.js';

export default function MatchPlayerBar({
  p1Name,
  p1AvatarId,
  p1Rating,
  p1Score,
  p1Symbol,
  p1Color,
  p2Name,
  p2AvatarId,
  p2Rating,
  p2Score,
  p2Symbol,
  p2Color,
  isP1Turn,
  isGameOver,
  winnerText,
  gameMode
}) {
  const p1Avatar = AVATARS.find(a => a.id === p1AvatarId) || AVATARS[0];
  const p2Avatar = AVATARS.find(a => a.id === p2AvatarId) || AVATARS[1];

  const p1Tier = getTier(p1Rating || 1200);
  const p2Tier = getTier(p2Rating || 1200);

  const isVsAi = gameMode === 'VS_COMPUTER';

  return (
    <div style={{
      width: '100%',
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Winner Notification Banner */}
      {isGameOver && winnerText && (
        <div className="animate-pop-in" style={{
          background: winnerText.includes('WIN') ? '#f0fdf4' : '#f8fafc',
          border: winnerText.includes('WIN') ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
          color: winnerText.includes('WIN') ? '#15803d' : '#334155',
          borderRadius: '12px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontFamily: 'var(--font-heading)',
          fontSize: '14px',
          fontWeight: '900',
          letterSpacing: '0.02em',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {winnerText.includes('WIN') ? <Trophy size={18} color="#15803d" /> : <MinusCircle size={18} color="#64748b" />}
          <span>{winnerText}</span>
        </div>
      )}

      {/* Dual Player Card Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '10px',
        alignItems: 'stretch'
      }}>
        {/* Player 1 (You) */}
        <div className="card-enterprise" style={{
          padding: '12px 14px',
          background: '#ffffff',
          border: !isGameOver && isP1Turn ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
          boxShadow: !isGameOver && isP1Turn ? '0 4px 16px rgba(37, 99, 235, 0.15)' : 'var(--shadow-xs)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.15s ease'
        }}>
          {/* Avatar Icon */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: p1Avatar.color, color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: '900',
            flexShrink: 0
          }}>
            {p1Name ? p1Name[0].toUpperCase() : 'P1'}
          </div>

          <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#0f172a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {p1Name}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: '800',
                padding: '1px 5px', borderRadius: '4px',
                background: `${p1Tier.color}15`, color: p1Tier.color
              }}>
                {p1Tier.badge}
              </span>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b',
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px'
            }}>
              <span style={{ fontWeight: '700', color: p1Color }}>{p1Symbol}</span>
              <span>•</span>
              <span>{p1Rating} ELO</span>
            </div>
          </div>

          {/* Turn / Score Badge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
              {p1Score}
            </div>
            {!isGameOver && isP1Turn && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: '800',
                color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px'
              }}>
                TURN
              </span>
            )}
          </div>
        </div>

        {/* Center VS Matchup Divider */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: '900',
            color: '#94a3b8',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            VS
          </div>
        </div>

        {/* Player 2 (AI / Friend) */}
        <div className="card-enterprise" style={{
          padding: '12px 14px',
          background: '#ffffff',
          border: !isGameOver && !isP1Turn ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
          boxShadow: !isGameOver && !isP1Turn ? '0 4px 16px rgba(37, 99, 235, 0.15)' : 'var(--shadow-xs)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          transition: 'all 0.15s ease'
        }}>
          {/* Turn / Score Badge */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
              {p2Score}
            </div>
            {!isGameOver && !isP1Turn && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: '800',
                color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px'
              }}>
                TURN
              </span>
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#0f172a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {p2Name}
              </span>
              {!isVsAi && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: '800',
                  padding: '1px 5px', borderRadius: '4px',
                  background: `${p2Tier.color}15`, color: p2Tier.color
                }}>
                  {p2Tier.badge}
                </span>
              )}
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '2px'
            }}>
              <span>{isVsAi ? 'AI Engine' : `${p2Rating} ELO`}</span>
              <span>•</span>
              <span style={{ fontWeight: '700', color: p2Color }}>{p2Symbol}</span>
            </div>
          </div>

          {/* Avatar Icon */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: isVsAi ? '#f1f5f9' : p2Avatar.color,
            color: isVsAi ? '#475569' : '#ffffff',
            border: isVsAi ? '1px solid #cbd5e1' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: '900',
            flexShrink: 0
          }}>
            {isVsAi ? <Bot size={20} color="#475569" /> : (p2Name ? p2Name[0].toUpperCase() : 'P2')}
          </div>
        </div>
      </div>
    </div>
  );
}
