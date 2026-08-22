import React from 'react';
import { Trophy, Crown, Zap, ShieldAlert, MinusCircle } from 'lucide-react';

export default function InBoardVictoryBadge({
  winner,
  myRole,
  gameType = 'connect4', // 'connect4' | 'tictactoe' | 'gomoku'
  outcome = null // 'WIN' | 'LOSS' | 'DRAW'
}) {

  if (!winner) return null;

  const isDraw = winner === 'DRAW' || outcome === 'DRAW';
  const isMyWin = outcome === 'WIN' || (myRole && (winner === myRole || (myRole === 1 && (winner === 1 || winner === 'RED' || winner === 'X')) || (myRole === 2 && (winner === 2 || winner === 'YELLOW' || winner === 'O'))));
  const isMyLoss = outcome === 'LOSS' || (myRole && !isDraw && !isMyWin);

  let title = 'YOU WON!';
  let winnerColor = '#4ADE80';
  let badgeGradient = 'linear-gradient(135deg, #16A34A 0%, #15803D 50%, #14532D 100%)';
  let borderColor = '#86EFAC';
  let glowColor = 'rgba(34, 197, 94, 0.7)';

  if (isDraw) {
    title = 'DRAW MATCH!';
    winnerColor = '#E2E8F0';
    badgeGradient = 'linear-gradient(135deg, rgba(51, 65, 85, 0.95), rgba(15, 23, 42, 0.95))';
    borderColor = '#94A3B8';
    glowColor = 'rgba(148, 163, 184, 0.4)';
  } else if (isMyLoss) {
    title = 'YOU LOST!';
    winnerColor = '#F87171';
    badgeGradient = 'linear-gradient(135deg, #DC2626 0%, #991B1B 50%, #7F1D1D 100%)';
    borderColor = '#FCA5A5';
    glowColor = 'rgba(239, 68, 68, 0.7)';
  } else if (isMyWin) {
    title = 'YOU WON!';
    winnerColor = '#4ADE80';
    badgeGradient = 'linear-gradient(135deg, #16A34A 0%, #15803D 50%, #14532D 100%)';
    borderColor = '#86EFAC';
    glowColor = 'rgba(34, 197, 94, 0.7)';
  } else {
    // Local Pass & Play Fallbacks
    if (gameType === 'connect4') {
      const isRed = winner === 1 || winner === '1' || winner === 'RED' || winner === 'X';
      title = isRed ? 'RED WINS!' : 'YELLOW WINS!';
      winnerColor = isRed ? '#F87171' : '#FDE047';
      badgeGradient = isRed ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 50%, #7F1D1D 100%)' : 'linear-gradient(135deg, #CA8A04 0%, #A16207 50%, #713F12 100%)';
      borderColor = isRed ? '#FCA5A5' : '#FEF08A';
      glowColor = isRed ? 'rgba(239, 68, 68, 0.7)' : 'rgba(234, 179, 8, 0.7)';
    } else if (gameType === 'tictactoe') {
      const isX = winner === 'X' || winner === 1;
      title = isX ? 'PLAYER X WINS!' : 'PLAYER O WINS!';
      winnerColor = isX ? '#38BDF8' : '#F472B6';
      badgeGradient = isX ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%)' : 'linear-gradient(135deg, #DB2777 0%, #BE185D 50%, #9D174D 100%)';
      borderColor = isX ? '#7DD3FC' : '#F9A8D4';
      glowColor = isX ? 'rgba(14, 165, 233, 0.7)' : 'rgba(236, 72, 153, 0.7)';
    } else if (gameType === 'gomoku') {
      const isBlack = winner === 1 || winner === '1' || winner === 'BLACK';
      title = isBlack ? 'BLACK WINS!' : 'WHITE WINS!';
      winnerColor = isBlack ? '#E2E8F0' : '#18181B';
      badgeGradient = isBlack ? 'linear-gradient(135deg, #18181B 0%, #09090B 50%, #000000 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #CBD5E1 100%)';
      borderColor = isBlack ? '#E2E8F0' : '#000000';
      glowColor = isBlack ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    }
  }


  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 60,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '90%',
        maxWidth: '360px'
      }}
    >
      {/* Premium Metallic Victory Tag Badge */}
      <div
        className="animate-pop-in"
        style={{
          background: badgeGradient,
          border: `2px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '12px 24px',
          boxShadow: `0 0 30px ${glowColor}, 0 10px 25px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.4)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Shimmer Light Sweep across badge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
            transform: 'skewX(-25deg)',
            animation: 'shimmer-sweep 2.4s infinite ease-in-out'
          }}
        />

        {/* Crown / Shield Header with Pulse Glow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
          }}
        >
          {isMyLoss ? (
            <>
              <ShieldAlert size={18} color="#FCA5A5" fill="#EF4444" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  letterSpacing: '0.18em',
                  color: '#FCA5A5',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                DEFEAT
              </span>
              <ShieldAlert size={18} color="#FCA5A5" fill="#EF4444" />
            </>
          ) : isDraw ? (
            <>
              <MinusCircle size={18} color="#CBD5E1" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  letterSpacing: '0.18em',
                  color: '#CBD5E1',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                MATCH TIED
              </span>
              <MinusCircle size={18} color="#CBD5E1" />
            </>
          ) : (
            <>
              <Crown size={20} color="#FEF08A" fill="#FACC15" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  letterSpacing: '0.18em',
                  color: '#FEF08A',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                VICTORY
              </span>
              <Crown size={20} color="#FEF08A" fill="#FACC15" />
            </>
          )}
        </div>


        {/* Winner Tag Text (e.g. "RED WINS!") */}
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(20px, 5.5vw, 26px)',
            fontWeight: '900',
            fontFamily: 'var(--font-heading)',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            textShadow: `0 2px 10px rgba(0,0,0,0.8), 0 0 16px ${borderColor}`,
            lineHeight: 1.1
          }}
        >
          {title}
        </h2>
      </div>

      <style>{`
        @keyframes shimmer-sweep {
          0% {
            left: -100%;
          }
          60% {
            left: 140%;
          }
          100% {
            left: 140%;
          }
        }
      `}</style>
    </div>
  );
}
