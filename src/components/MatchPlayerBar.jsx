import React from 'react';
import { Trophy, Bot, MinusCircle, Clock } from 'lucide-react';
import { AVATARS } from '../utils/userProfile.js';

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
          background: winnerText.includes('WIN') ? '#F0FDF4' : '#F4F4F5',
          border: winnerText.includes('WIN') ? '1px solid #BBF7D0' : '1px solid #E4E4E7',
          color: winnerText.includes('WIN') ? '#16A34A' : '#18181B',
          borderRadius: '10px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontFamily: 'var(--font-heading)',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          {winnerText.includes('WIN') ? <Trophy size={14} color="#16A34A" /> : <MinusCircle size={14} color="#71717A" />}
          <span>{winnerText}</span>
        </div>
      )}

      {/* Dual Player Card Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 'clamp(6px, 1.5vw, 10px)',
        alignItems: 'stretch',
        width: '100%'
      }}>
        {/* Player 1 (You) */}
        <div className="card-enterprise" style={{
          padding: 'clamp(6px, 1.6vw, 10px)',
          background: '#FFFFFF',
          border: !isGameOver && isP1Turn ? (isUrgent ? '1.5px solid #DC2626' : '1.5px solid #2563EB') : '1px solid #E4E4E7',
          boxShadow: !isGameOver && isP1Turn ? (isUrgent ? '0 0 10px rgba(220, 38, 38, 0.15)' : '0 0 10px rgba(37, 99, 235, 0.15)') : '0 1px 2px rgba(0,0,0,0.03)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 8px)',
          transition: 'all 0.15s ease',
          minWidth: 0
        }}>
          {/* Avatar Icon */}
          <div style={{
            width: 'clamp(28px, 6vw, 34px)',
            height: 'clamp(28px, 6vw, 34px)',
            borderRadius: '8px',
            background: '#18181B', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '800',
            flexShrink: 0
          }}>
            {p1Name ? p1Name[0].toUpperCase() : ''}
          </div>


          <div style={{ minWidth: 0, flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                fontWeight: '700', color: '#18181B',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {p1Name}
              </span>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(9px, 1.8vw, 10px)',
              color: '#71717A',
              display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              <span style={{ fontWeight: '700', color: '#18181B' }}>{p1Symbol}</span>
              <span>•</span>
              <span>{p1Rating}</span>
            </div>
          </div>

          {/* Turn / Score Badge */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: '800', color: '#18181B' }}>
              {p1Score}
            </div>
            {!isGameOver && isP1Turn && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: '700',
                color: isUrgent ? '#DC2626' : '#2563EB',
                background: isUrgent ? '#FEF2F2' : '#EFF6FF',
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
              fontWeight: '700',
              color: isUrgent ? '#DC2626' : '#18181B',
              background: isUrgent ? '#FEF2F2' : '#FFFFFF',
              border: `1px solid ${isUrgent ? '#FCA5A5' : '#E4E4E7'}`,
              padding: '3px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Clock size={11} color={isUrgent ? '#DC2626' : '#71717A'} />
              <span>{timeLeft}s</span>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: '700',
              color: '#71717A',
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              padding: '2px 5px',
              borderRadius: '4px'
            }}>
              VS
            </div>
          )}
        </div>

        {/* Player 2 (Opponent / Bot) */}
        <div className="card-enterprise" style={{
          padding: 'clamp(6px, 1.6vw, 10px)',
          background: '#FFFFFF',
          border: !isGameOver && !isP1Turn ? (isUrgent ? '1.5px solid #DC2626' : '1.5px solid #2563EB') : '1px solid #E4E4E7',
          boxShadow: !isGameOver && !isP1Turn ? (isUrgent ? '0 0 10px rgba(220, 38, 38, 0.15)' : '0 0 10px rgba(37, 99, 235, 0.15)') : '0 1px 2px rgba(0,0,0,0.03)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(6px, 1.5vw, 8px)',
          transition: 'all 0.15s ease',
          minWidth: 0
        }}>
          {/* Turn / Score Badge */}
          <div style={{ textAlign: 'left', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: '800', color: '#18181B' }}>
              {p2Score}
            </div>
            {!isGameOver && !isP1Turn && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: '700',
                color: isUrgent ? '#DC2626' : '#2563EB',
                background: isUrgent ? '#FEF2F2' : '#EFF6FF',
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
                fontWeight: '700', color: '#18181B',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {p2Name}
              </span>
              {isVsAi && <Bot size={12} color="#71717A" />}
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(9px, 1.8vw, 10px)',
              color: '#71717A',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '1px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              <span>{p2Rating}</span>
              <span>•</span>
              <span style={{ fontWeight: '700', color: '#18181B' }}>{p2Symbol}</span>
            </div>
          </div>

          {/* Avatar Icon */}
          <div style={{
            width: 'clamp(28px, 6vw, 34px)',
            height: 'clamp(28px, 6vw, 34px)',
            borderRadius: '8px',
            background: isVsAi ? '#E4E4E7' : '#18181B', color: isVsAi ? '#18181B' : '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '800',
            flexShrink: 0
          }}>
            {isVsAi ? <Bot size={16} /> : (p2Name ? p2Name[0].toUpperCase() : '')}
          </div>

        </div>
      </div>
    </div>
  );
}
