import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, ShieldAlert, MinusCircle, RotateCcw, LayoutGrid, Share2, Check, X, Crown, Flame, Award } from 'lucide-react';

import confetti from 'canvas-confetti';
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

  // Confetti explosion & lock background body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (outcome === 'WIN') {
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, outcome]);

  if (!isOpen || !outcome) return null;

  const isWin = outcome === 'WIN';
  const isLoss = outcome === 'LOSS';
  const isDraw = outcome === 'DRAW';

  const tier = getTier(currentRating);
  const xpNeeded = level * 100;
  const xpPercentage = Math.min(100, Math.round((xp / xpNeeded) * 100));

  const handleShare = async () => {
    const text = `I just ${isWin ? 'won' : isDraw ? 'tied' : 'played'} a ${gameTitle} match against ${opponentName} on games4u Arena! Current Rating: ${currentRating} ELO.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Match Result', text, url: window.location.origin });
        return;
      } catch (e) {}
    }
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(10, 15, 30, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
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
      {/* Centered Modern Celebratory Card */}
      <div
        className="animate-pop-in"
        style={{
          width: 'min(92vw, 440px)',
          maxHeight: '94dvh',
          padding: 'clamp(20px, 4.5vw, 32px) clamp(16px, 4vw, 28px)',
          background: '#ffffff',
          boxShadow: isWin 
            ? '0 25px 60px -10px rgba(22, 163, 74, 0.35), 0 0 0 1px rgba(22, 163, 74, 0.2)' 
            : '0 25px 60px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          borderRadius: '28px',
          textAlign: 'center',
          position: 'relative',
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right 'X' Dismiss Button */}
        <button
          onClick={onClose}
          title="Inspect Final Board"
          className="modal-close-btn"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Celebratory Icon Crest */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: isWin 
            ? 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' 
            : isLoss 
            ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
            : 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: isWin 
            ? '0 12px 28px rgba(34, 197, 94, 0.4), 0 0 0 4px rgba(34, 197, 94, 0.15)' 
            : '0 12px 28px rgba(0, 0, 0, 0.25)',
          color: '#ffffff'
        }}>
          {isWin ? (
            <Trophy size={42} className="stroke-[2.2]" />
          ) : isLoss ? (
            <ShieldAlert size={42} className="stroke-[2.2]" />
          ) : (
            <MinusCircle size={42} className="stroke-[2.2]" />
          )}
        </div>

        {/* Status Pill Badge */}
        <div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 12px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            background: isWin ? '#dcfce7' : isLoss ? '#fee2e2' : '#f1f5f9',
            color: isWin ? '#15803d' : isLoss ? '#b91c1c' : '#475569',
            border: isWin ? '1px solid #86efac' : isLoss ? '1px solid #fca5a5' : '1px solid #cbd5e1',
            marginBottom: '8px'
          }}>
            {isWin && <Crown size={12} color="#15803D" />}
            <span>{isWin ? 'VICTORY ACHIEVED' : isLoss ? 'MATCH DEFEAT' : 'MATCH TIED'}</span>
          </span>

        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(26px, 6vw, 30px)',
          fontWeight: '900',
          color: isWin ? '#15803d' : isLoss ? '#991b1b' : '#0f172a',
          letterSpacing: '-0.03em',
          margin: '0 0 6px 0',
          lineHeight: '1.1'
        }}>
          {isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'}
        </h2>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: '#64748b',
          margin: '0 0 20px 0',
          lineHeight: 1.4
        }}>
          {gameTitle} match against <strong>{opponentName}</strong> completed.
        </p>

        {/* Rewards & Rating Card */}
        <div style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '16px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* ELO Rating Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', fontWeight: '800', letterSpacing: '0.04em' }}>
                COMPETITIVE RATING
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                {currentRating} ELO
              </span>
            </div>

            <div style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: ratingDelta > 0 ? '#22c55e' : ratingDelta < 0 ? '#ef4444' : '#64748b',
              color: '#ffffff',
              fontFamily: 'var(--font-heading)',
              fontSize: '14px',
              fontWeight: '900',
              boxShadow: ratingDelta > 0 ? '0 4px 12px rgba(34, 197, 94, 0.35)' : 'none'
            }}>
              {ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta} ELO
            </div>
          </div>

          {/* XP Progress Bar */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#475569', marginBottom: '6px', fontWeight: '800' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={13} className="text-blue-600" />
                <span>LEVEL {level}</span>
              </span>
              <span style={{ color: '#16a34a', fontWeight: '900' }}>+{xpGained} XP GAINED</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${xpPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '6px',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
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
              paddingTop: '8px',
              borderTop: '1px dashed #cbd5e1'
            }}>
              <span>Total Moves:</span>
              <strong style={{ color: '#0f172a' }}>{movesCount}</strong>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Primary: Rematch / Play Again */}
          <button
            onClick={onRematch}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.25)',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={17} />
            <span>PLAY AGAIN (REMATCH)</span>
          </button>

          {/* Secondary Actions Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={onGoHome}
              className="btn-secondary"
              style={{
                padding: '11px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minHeight: '42px',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={15} />
              <span>ARCADE HUB</span>
            </button>

            <button
              onClick={handleShare}
              className="btn-secondary"
              style={{
                padding: '11px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minHeight: '42px',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={15} color="#15803d" /> : <Share2 size={15} />}
              <span>{copied ? 'COPIED!' : 'SHARE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

