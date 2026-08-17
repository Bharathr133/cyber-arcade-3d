import React from 'react';
import { Trophy, Bot, MinusCircle, Clock } from 'lucide-react';
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
  gameMode,
  timeLeft = 30,
  maxTime = 30
}) {
  const p1Avatar = AVATARS.find(a => a.id === p1AvatarId) || AVATARS[0];
  const p2Avatar = AVATARS.find(a => a.id === p2AvatarId) || AVATARS[1];

  const isVsAi = gameMode === 'VS_COMPUTER';
  const isUrgent = timeLeft <= 5 && !isGameOver;

  return (
    <div style={{
      width: '100%',
      marginBottom: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      {/* Winner Notification Banner */}
      {isGameOver && winnerText && (
        <div className="animate-pop-in" style={{
          background: winnerText.includes('WIN') ? '#f0fdf4' : '#f8fafc',
          border: winnerText.includes('WIN') ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
          color: winnerText.includes('WIN') ? '#15803d' : '#334155',
          borderRadius: '12px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontFamily: 'var(--font-heading)',
          fontSize: '12px',
          fontWeight: '900',
          letterSpacing: '0.02em',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {winnerText.includes('WIN') ? <Trophy size={15} color="#15803d" /> : <MinusCircle size={15} color="#64748b" />}
          <span>{winnerText}</span>
        </div>
      )}

      {/* Dual Player Card Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 'clamp(4px, 1.5vw, 8px)',
        alignItems: 'stretch',
        width: '100%'
      }}>
        {/* Player 1 (You) */}
        <div className="card-enterprise" style={{
          padding: 'clamp(6px, 1.6vw, 10px)',
          background: '#ffffff',
          border: !isGameOver && isP1Turn ? (isUrgent ? '2px solid #ef4444' : '2px solid #2563eb') : '1.5px solid #e2e8f0',
          boxShadow: !isGameOver && isP1Turn ? (isUrgent ? '0 4px 16px rgba(239, 68, 68, 0.2)' : '0 4px 16px rgba(37, 99, 235, 0.15)') : 'var(--shadow-xs)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1.5vw, 8px)',
          transition: 'all 0.15s ease',
          minWidth: 0
        }}>
          {/* Avatar Icon */}
          <div style={{
            width: 'clamp(26px, 6.5vw, 34px)',
            height: 'clamp(26px, 6.5vw, 34px)',
            borderRadius: '8px',
            background: p1Avatar.color, color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '900',
            flexShrink: 0
          }}>
            {p1Name ? p1Name[0].toUpperCase() : 'P1'}
          </div>

          <div style={{ minWidth: 0, flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                fontWeight: '800', color: '#0f172a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {p1Name}
              </span>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(9px, 1.8vw, 10px)',
              color: '#64748b',
              display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              <span style={{ fontWeight: '800', color: p1Color }}>{p1Symbol}</span>
              <span>•</span>
              <span>{p1Rating}</span>
            </div>
          </div>

          {/* Turn / Score Badge */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: '900', color: '#0f172a' }}>
              {p1Score}
            </div>
            {!isGameOver && isP1Turn && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: '800',
                color: isUrgent ? '#ef4444' : '#2563eb',
                background: isUrgent ? '#fef2f2' : '#eff6ff',
                padding: '1px 4px', borderRadius: '4px',
                display: 'inline-block'
              }}>
                {timeLeft}s
              </span>
            )}
          </div>
        </div>

        {/* Center Countdown / VS Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 2px'
        }}>
          {!isGameOver ? (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: '900',
              color: isUrgent ? '#ef4444' : '#0f172a',
              background: isUrgent ? '#fee2e2' : '#f8fafc',
              border: `1.5px solid ${isUrgent ? '#fca5a5' : '#e2e8f0'}`,
              padding: '3px 7px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: isUrgent ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none',
              animation: isUrgent ? 'pulseGlow 0.6s infinite alternate' : 'none'
            }}>
              <Clock size={11} color={isUrgent ? '#ef4444' : '#64748b'} />
              <span>{timeLeft}s</span>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: '900',
              color: '#94a3b8',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '2px 5px',
              borderRadius: '6px'
            }}>
              VS
            </div>
          )}
        </div>

        {/* Player 2 (AI / Friend) */}
        <div className="card-enterprise" style={{
          padding: 'clamp(6px, 1.6vw, 10px)',
          background: '#ffffff',
          border: !isGameOver && !isP1Turn ? (isUrgent ? '2px solid #ef4444' : '2px solid #2563eb') : '1.5px solid #e2e8f0',
          boxShadow: !isGameOver && !isP1Turn ? (isUrgent ? '0 4px 16px rgba(239, 68, 68, 0.2)' : '0 4px 16px rgba(37, 99, 235, 0.15)') : 'var(--shadow-xs)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(4px, 1.5vw, 8px)',
          transition: 'all 0.15s ease',
          minWidth: 0
        }}>
          {/* Turn / Score Badge */}
          <div style={{ textAlign: 'left', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: '900', color: '#0f172a' }}>
              {p2Score}
            </div>
            {!isGameOver && !isP1Turn && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: '800',
                color: isUrgent ? '#ef4444' : '#2563eb',
                background: isUrgent ? '#fef2f2' : '#eff6ff',
                padding: '1px 4px', borderRadius: '4px',
                display: 'inline-block'
              }}>
                {timeLeft}s
              </span>
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1, textAlign: 'right', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                fontWeight: '800', color: '#0f172a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {p2Name}
              </span>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(9px, 1.8vw, 10px)',
              color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '1px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              <span>{isVsAi ? 'AI' : `${p2Rating}`}</span>
              <span>•</span>
              <span style={{ fontWeight: '800', color: p2Color }}>{p2Symbol}</span>
            </div>
          </div>

          {/* Avatar Icon */}
          <div style={{
            width: 'clamp(26px, 6.5vw, 34px)',
            height: 'clamp(26px, 6.5vw, 34px)',
            borderRadius: '8px',
            background: isVsAi ? '#f1f5f9' : p2Avatar.color,
            color: isVsAi ? '#475569' : '#ffffff',
            border: isVsAi ? '1px solid #cbd5e1' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '900',
            flexShrink: 0
          }}>
            {isVsAi ? <Bot size={15} color="#475569" /> : (p2Name ? p2Name[0].toUpperCase() : 'P2')}
          </div>
        </div>
      </div>
    </div>
  );
}
