import React, { useState, useEffect } from 'react';
import { 
  Trophy, ShieldAlert, MinusCircle, RotateCcw, Home, Zap, 
  TrendingUp, TrendingDown, Check, X, UserX, Loader2, Clock 
} from 'lucide-react';

export default function InGameResultBar({
  outcome, // 'WIN', 'LOSS', 'DRAW'
  ratingDelta = 0,
  xpGained = 0,
  onRematch,
  onAcceptRematch,
  onDeclineRematch,
  onGoHome,
  isOnline = false,
  rematchStatus = 'IDLE', // 'IDLE' | 'OFFERED' | 'RECEIVED' | 'ACCEPTED' | 'DECLINED' | 'OPPONENT_LEFT'
  opponentName = ''
}) {
  const FINISH_KEY = 'arcade_match_finished_timestamp';

  const [autoHomeSeconds, setAutoHomeSeconds] = useState(() => {
    try {
      const savedTime = sessionStorage.getItem(FINISH_KEY);
      if (savedTime) {
        const elapsed = Math.floor((Date.now() - parseInt(savedTime, 10)) / 1000);
        return Math.max(0, 10 - elapsed);
      }
      sessionStorage.setItem(FINISH_KEY, Date.now().toString());
      return 10;
    } catch (e) {
      return 10;
    }
  });

  // 10-Second Auto-Return Countdown with Exact Refresh Persistence
  useEffect(() => {
    if (!isOnline || rematchStatus === 'OFFERED' || rematchStatus === 'RECEIVED' || rematchStatus === 'ACCEPTED') {
      return;
    }

    const savedTime = sessionStorage.getItem(FINISH_KEY);
    let initialRemaining = 10;
    if (savedTime) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTime, 10)) / 1000);
      initialRemaining = Math.max(0, 10 - elapsed);
    } else {
      try { sessionStorage.setItem(FINISH_KEY, Date.now().toString()); } catch (e) {}
    }

    if (initialRemaining <= 0) {
      try { sessionStorage.removeItem(FINISH_KEY); } catch (e) {}
      if (onGoHome) onGoHome();
      return;
    }

    setAutoHomeSeconds(initialRemaining);

    const timer = setInterval(() => {
      const currentSavedTime = sessionStorage.getItem(FINISH_KEY);
      const elapsed = currentSavedTime ? Math.floor((Date.now() - parseInt(currentSavedTime, 10)) / 1000) : 0;
      const remaining = Math.max(0, 10 - elapsed);

      setAutoHomeSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        try { sessionStorage.removeItem(FINISH_KEY); } catch (e) {}
        if (onGoHome) onGoHome();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOnline, rematchStatus, onGoHome]);


  if (!outcome) return null;

  const isWin = outcome === 'WIN';
  const isLoss = outcome === 'LOSS';
  const isDraw = outcome === 'DRAW';

  const theme = isWin
    ? {
        bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
        border: '1.5px solid #10B981',
        shadow: '0 8px 24px -4px rgba(16, 185, 129, 0.25)',
        badgeBg: '#10B981',
        badgeColor: '#FFFFFF',
        title: 'YOU WON!',
        textColor: '#065F46',
        icon: <Trophy size={18} color="#FFFFFF" />
      }
    : isLoss
    ? {
        bg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
        border: '1.5px solid #EF4444',
        shadow: '0 8px 24px -4px rgba(239, 68, 68, 0.25)',
        badgeBg: '#EF4444',
        badgeColor: '#FFFFFF',
        title: 'YOU LOST!',
        textColor: '#991B1B',
        icon: <ShieldAlert size={18} color="#FFFFFF" />
      }
    : {
        bg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        border: '1.5px solid #94A3B8',
        shadow: '0 8px 24px -4px rgba(148, 163, 184, 0.25)',
        badgeBg: '#64748B',
        badgeColor: '#FFFFFF',
        title: 'DRAW MATCH!',
        textColor: '#334155',
        icon: <MinusCircle size={18} color="#FFFFFF" />
      };

  return (
    <div
      className="animate-pop-in"
      style={{
        width: '100%',
        background: theme.bg,
        border: theme.border,
        borderRadius: '14px',
        padding: '10px 14px',
        boxShadow: theme.shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '6px',
        marginBottom: '6px',
        boxSizing: 'border-box',
        zIndex: 50,
        position: 'relative'
      }}
    >
      {/* 1. Outcome Badge & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: theme.badgeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {theme.icon}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '14px',
              fontWeight: '900',
              color: theme.textColor,
              letterSpacing: '0.04em',
              lineHeight: '1.1'
            }}
          >
            {theme.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            {/* Rating Delta */}
            {ratingDelta !== 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: isWin ? '#059669' : '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {isWin ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isWin ? `+${ratingDelta}` : ratingDelta} ELO
              </span>
            )}
            {/* XP Gained */}
            {xpGained > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <Zap size={11} />
                +{xpGained} XP
              </span>
            )}
          </div>
        </div>
      </div>


      {/* 2. Interactive Rematch & Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* State A: Opponent Left the Game */}
        {rematchStatus === 'OPPONENT_LEFT' ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#FEE2E2',
              border: '1px solid #F87171',
              color: '#991B1B',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            <UserX size={14} />
            <span>{opponentName} left the game</span>
          </div>
        ) : rematchStatus === 'RECEIVED' ? (
          /* State B: Opponent Offered Rematch (Accept or Decline) */
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E293B', marginRight: '4px' }}>
              {opponentName} wants a rematch:
            </span>
            <button
              onClick={onAcceptRematch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Check size={13} />
              <span>ACCEPT</span>
            </button>
            <button
              onClick={onDeclineRematch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
              }}
            >
              <X size={13} />
              <span>DECLINE</span>
            </button>
          </div>
        ) : rematchStatus === 'OFFERED' ? (
          /* State C: Waiting for Opponent to Accept */
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#EFF6FF',
              border: '1px solid #93C5FD',
              color: '#1D4ED8',
              fontSize: '11px',
              fontWeight: '800'
            }}
          >
            <Loader2 size={13} className="animate-spin" />
            <span>Waiting for {opponentName}...</span>
          </div>
        ) : rematchStatus === 'DECLINED' ? (
          /* State D: Opponent Declined Rematch */
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: '#F3F4F6',
              border: '1px solid #D1D5DB',
              color: '#4B5563',
              fontSize: '11px',
              fontWeight: '800'
            }}
          >
            <X size={12} />
            <span>Rematch declined</span>
          </div>
        ) : rematchStatus === 'ACCEPTED' ? (
          /* State E: Rematch Accepted (Starting...) */
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              color: '#047857',
              fontSize: '11px',
              fontWeight: '800'
            }}
          >
            <RotateCcw size={13} className="animate-spin" />
            <span>Starting Rematch...</span>
          </div>
        ) : (
          /* State F: Default Rematch Button */
          onRematch && (
            <button
              onClick={onRematch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: isWin ? '#10B981' : '#18181B',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: '800',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s ease'
              }}
            >
              <RotateCcw size={13} />
              <span>REMATCH</span>
            </button>
          )
        )}

        {/* Auto-Return Countdown Pill for Online Matches */}
        {isOnline && (rematchStatus === 'IDLE' || rematchStatus === 'DECLINED' || rematchStatus === 'OPPONENT_LEFT') && (

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              color: '#0F172A',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: '800'
            }}
          >
            <Clock size={13} color="#2563EB" />
            <span>Leaving in {autoHomeSeconds}s</span>
          </div>
        )}

        {/* Lobby / Home Button */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#334155',
              border: '1.5px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
          >
            <Home size={13} />
            <span>{isOnline ? 'LOBBY' : 'HOME'}</span>
          </button>
        )}
      </div>

    </div>
  );
}
