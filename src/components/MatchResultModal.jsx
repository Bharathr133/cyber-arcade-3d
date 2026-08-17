import React, { useState } from 'react';
import { Trophy, ShieldAlert, MinusCircle, RotateCcw, LayoutGrid, Share2, Check, ArrowRight, Zap, Award, X } from 'lucide-react';
import { getTier } from '../utils/userProfile.js';

export default function MatchResultModal({
  isOpen,
  onClose,
  outcome, // 'WIN', 'LOSS', 'DRAW'
  gameTitle,
  opponentName = 'Opponent',
  ratingDelta = 0,
  xpGained = 0,
  currentRating = 1200,
  level = 1,
  xp = 0,
  movesCount = 0,
  onRematch,
  onGoHome
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !outcome) return null;

  const isWin = outcome === 'WIN';
  const isLoss = outcome === 'LOSS';
  const isDraw = outcome === 'DRAW';

  const tier = getTier(currentRating);
  const xpNeeded = level * 100;
  const xpPercentage = Math.min(100, Math.round((xp / xpNeeded) * 100));

  const handleShare = async () => {
    const text = `I just ${isWin ? 'won' : isDraw ? 'tied' : 'played'} a ${gameTitle} match against ${opponentName} on Championship Arena! Current Rating: ${currentRating} ELO.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Match Result', text, url: window.location.origin });
        return;
      } catch (e) {}
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 250,
      padding: '16px'
    }}>
      <div className="card-enterprise animate-pop-in" style={{
        width: '460px',
        padding: '32px 28px',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: '24px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Top Right 'X' Close Button */}
        <button
          onClick={onClose}
          title="Close and inspect board"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={18} />
        </button>

        {/* Outcome Icon Header */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: isWin ? '#f0fdf4' : isLoss ? '#fef2f2' : '#f8fafc',
          border: isWin ? '2px solid #86efac' : isLoss ? '2px solid #fca5a5' : '2px solid #cbd5e1',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: isWin ? '0 8px 24px rgba(22, 163, 74, 0.15)' : 'var(--shadow-xs)'
        }}>
          {isWin ? (
            <Trophy size={32} color="#15803d" />
          ) : isLoss ? (
            <ShieldAlert size={32} color="#991b1b" />
          ) : (
            <MinusCircle size={32} color="#475569" />
          )}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '22px',
          fontWeight: '900',
          color: isWin ? '#15803d' : isLoss ? '#991b1b' : '#0f172a',
          letterSpacing: '-0.02em',
          margin: '0 0 4px 0'
        }}>
          {isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'MATCH DRAW'}
        </h2>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: '#64748b',
          margin: '0 0 20px 0'
        }}>
          {gameTitle} match against <strong>{opponentName}</strong> completed.
        </p>

        {/* Rating & XP Rewards Banner */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Rating Delta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                COMPETITIVE RATING
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                {currentRating} ELO
              </span>
            </div>

            <div style={{
              padding: '4px 10px',
              borderRadius: '8px',
              background: ratingDelta > 0 ? '#dcfce7' : ratingDelta < 0 ? '#fee2e2' : '#f1f5f9',
              color: ratingDelta > 0 ? '#15803d' : ratingDelta < 0 ? '#991b1b' : '#64748b',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: '900'
            }}>
              {ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta} ELO
            </div>
          </div>

          {/* XP Progress Bar */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>
              <span>LEVEL {level}</span>
              <span>+{xpGained} XP GAINED</span>
            </div>
            <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${xpPercentage}%`,
                height: '100%',
                background: '#0f172a',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Moves Count */}
          {movesCount > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#64748b',
              paddingTop: '6px',
              borderTop: '1px dashed #cbd5e1'
            }}>
              <span>Total Moves Played:</span>
              <strong style={{ color: '#0f172a' }}>{movesCount}</strong>
            </div>
          )}
        </div>

        {/* Next Process Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Primary: Rematch / Play Again */}
          <button
            onClick={onRematch}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <RotateCcw size={16} />
            <span>PLAY AGAIN (REMATCH)</span>
          </button>

          {/* Secondary Actions Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={onGoHome}
              className="btn-secondary"
              style={{
                padding: '10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LayoutGrid size={15} />
              <span>ARCADE HUB</span>
            </button>

            <button
              onClick={handleShare}
              className="btn-secondary"
              style={{
                padding: '10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={15} color="#15803d" /> : <Share2 size={15} />}
              <span>{copied ? 'COPIED!' : 'SHARE RESULT'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
