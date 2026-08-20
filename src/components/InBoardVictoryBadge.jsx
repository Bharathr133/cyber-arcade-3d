import React from 'react';
import { Trophy, Crown, Sparkles, Zap, Flame } from 'lucide-react';

export default function InBoardVictoryBadge({
  winner,
  myRole,
  gameType = 'connect4', // 'connect4' | 'tictactoe' | 'gomoku'
  outcome = null // 'WIN' | 'LOSS' | 'DRAW'
}) {
  if (!winner) return null;

  const isDraw = winner === 'DRAW' || outcome === 'DRAW';
  let title = 'VICTORY!';
  let winnerColor = '#FACC15';
  let badgeGradient = 'linear-gradient(135deg, rgba(234, 179, 8, 0.95), rgba(161, 98, 7, 0.95))';
  let borderColor = '#FEF08A';
  let glowColor = 'rgba(234, 179, 8, 0.6)';

  if (gameType === 'connect4') {
    const isRed = winner === 1 || winner === '1' || winner === 'RED' || winner === 'X';
    const isYellow = winner === 2 || winner === '2' || winner === 'YELLOW' || winner === 'O';
    if (isDraw) {
      title = 'MATCH DRAW!';
      badgeGradient = 'linear-gradient(135deg, rgba(51, 65, 85, 0.95), rgba(15, 23, 42, 0.95))';
      borderColor = '#94A3B8';
      glowColor = 'rgba(148, 163, 184, 0.4)';
    } else if (isRed) {
      title = 'RED WINS!';
      winnerColor = '#F87171';
      badgeGradient = 'linear-gradient(135deg, #DC2626 0%, #991B1B 50%, #7F1D1D 100%)';
      borderColor = '#FCA5A5';
      glowColor = 'rgba(239, 68, 68, 0.7)';
    } else if (isYellow) {
      title = 'YELLOW WINS!';
      winnerColor = '#FDE047';
      badgeGradient = 'linear-gradient(135deg, #CA8A04 0%, #A16207 50%, #713F12 100%)';
      borderColor = '#FEF08A';
      glowColor = 'rgba(234, 179, 8, 0.7)';
    }
  } else if (gameType === 'tictactoe') {
    const isX = winner === 'X' || winner === 1;
    const isO = winner === 'O' || winner === 2;
    if (isDraw) {
      title = 'MATCH DRAW!';
      badgeGradient = 'linear-gradient(135deg, rgba(51, 65, 85, 0.95), rgba(15, 23, 42, 0.95))';
      borderColor = '#94A3B8';
      glowColor = 'rgba(148, 163, 184, 0.4)';
    } else if (isX) {
      title = 'PLAYER X WINS!';
      winnerColor = '#38BDF8';
      badgeGradient = 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%)';
      borderColor = '#7DD3FC';
      glowColor = 'rgba(14, 165, 233, 0.7)';
    } else if (isO) {
      title = 'PLAYER O WINS!';
      winnerColor = '#F472B6';
      badgeGradient = 'linear-gradient(135deg, #DB2777 0%, #BE185D 50%, #9D174D 100%)';
      borderColor = '#F9A8D4';
      glowColor = 'rgba(236, 72, 153, 0.7)';
    }
  } else if (gameType === 'gomoku') {
    const isBlack = winner === 1 || winner === '1' || winner === 'BLACK';
    const isWhite = winner === 2 || winner === '2' || winner === 'WHITE';
    if (isDraw) {
      title = 'MATCH DRAW!';
      badgeGradient = 'linear-gradient(135deg, rgba(51, 65, 85, 0.95), rgba(15, 23, 42, 0.95))';
      borderColor = '#94A3B8';
      glowColor = 'rgba(148, 163, 184, 0.4)';
    } else if (isBlack) {
      title = 'BLACK WINS!';
      winnerColor = '#E2E8F0';
      badgeGradient = 'linear-gradient(135deg, #18181B 0%, #09090B 50%, #000000 100%)';
      borderColor = '#E2E8F0';
      glowColor = 'rgba(255, 255, 255, 0.4)';
    } else if (isWhite) {
      title = 'WHITE WINS!';
      winnerColor = '#18181B';
      badgeGradient = 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #CBD5E1 100%)';
      borderColor = '#000000';
      glowColor = 'rgba(0, 0, 0, 0.4)';
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
      {/* 1. Smooth Rising Energy Sparks / Blaster Ray Streamers (100% GPU CSS) */}
      <div
        style={{
          position: 'absolute',
          inset: '-40px -20px',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        {/* Rising Golden Star Particles */}
        {[
          { left: '15%', delay: '0s', dur: '1.8s', size: 14 },
          { left: '30%', delay: '0.4s', dur: '2.1s', size: 18 },
          { left: '50%', delay: '0.2s', dur: '1.6s', size: 22 },
          { left: '70%', delay: '0.6s', dur: '2.0s', size: 16 },
          { left: '85%', delay: '0.3s', dur: '1.7s', size: 20 },
        ].map((spark, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              bottom: '10px',
              left: spark.left,
              animation: `smooth-rise-sparkle ${spark.dur} infinite ease-out ${spark.delay}`,
              opacity: 0,
              filter: `drop-shadow(0 0 8px ${borderColor})`
            }}
          >
            <Sparkles size={spark.size} color={borderColor} />
          </div>
        ))}
      </div>

      {/* 2. Premium Metallic Victory Tag Badge */}
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

        {/* Crown / Trophy Icon with Pulse Glow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
          }}
        >
          <Crown size={22} color="#FEF08A" fill="#FACC15" />
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
          <Crown size={22} color="#FEF08A" fill="#FACC15" />
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
        @keyframes smooth-rise-sparkle {
          0% {
            transform: translate3d(0, 0, 0) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          30% {
            opacity: 1;
            transform: translate3d(0, -25px, 0) scale(1.1) rotate(45deg);
          }
          70% {
            opacity: 0.8;
            transform: translate3d(0, -65px, 0) scale(0.9) rotate(90deg);
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -100px, 0) scale(0.2) rotate(135deg);
          }
        }
        @keyframes shimmer-sweep {
          0% { left: -100%; }
          40% { left: 160%; }
          100% { left: 160%; }
        }
      `}</style>
    </div>
  );
}
