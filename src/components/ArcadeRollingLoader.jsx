import React, { useState, useEffect } from 'react';
import { 
  TicTacToeIcon, 
  ConnectFourIcon, 
  GomokuIcon, 
  MemoryMatchIcon, 
  LudoIcon 
} from './GameIcons.jsx';

const ARCADE_GAMES = [
  { id: 'connect4', name: 'Connect 4', icon: ConnectFourIcon, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: '#38BDF8' },
  { id: 'tictactoe', name: 'Tic-Tac-Toe', icon: TicTacToeIcon, color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)', border: '#F43F5E' },
  { id: 'gomoku', name: 'Gomoku', icon: GomokuIcon, color: '#2DD4BF', bg: 'rgba(45, 212, 191, 0.12)', border: '#2DD4BF' },
  { id: 'memory', name: 'Memory Match', icon: MemoryMatchIcon, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: '#A855F7' },
  { id: 'ludo', name: 'Ludo Championship', icon: LudoIcon, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B' }
];

export default function ArcadeRollingLoader({
  message = 'Loading games4u Arena...',
  submessage = 'Connecting to real-time engine',
  size = 'default', // 'default' | 'compact' | 'fullscreen'
  isOverlay = false
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Smoothly roll through each game icon in sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ARCADE_GAMES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const currentGame = ARCADE_GAMES[activeIndex];
  const ActiveIcon = currentGame.icon;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        userSelect: 'none'
      }}
    >
      {/* 1. Orbiting & Rolling Reel Stage */}
      <div
        style={{
          position: 'relative',
          width: size === 'compact' ? '80px' : '110px',
          height: size === 'compact' ? '80px' : '110px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Outer Rotating Glowing Orbit Ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            animation: 'spin 12s linear infinite'
          }}
        />

        {/* 5 Orbiting Game Icons on Ring */}
        {ARCADE_GAMES.map((game, idx) => {
          const angle = (idx / ARCADE_GAMES.length) * 2 * Math.PI - Math.PI / 2;
          const radius = size === 'compact' ? 36 : 48;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSelected = idx === activeIndex;
          const IconComp = game.icon;

          return (
            <div
              key={game.id}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                width: size === 'compact' ? '22px' : '28px',
                height: size === 'compact' ? '22px' : '28px',
                borderRadius: '8px',
                background: isSelected ? game.bg : '#18181B',
                border: isSelected ? `1.5px solid ${game.border}` : '1px solid #27272A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? `0 0 14px ${game.color}66` : '0 2px 5px rgba(0,0,0,0.3)',
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                scale: isSelected ? '1.25' : '0.9',
                opacity: isSelected ? 1 : 0.45,
                zIndex: isSelected ? 5 : 2
              }}
            >
              <IconComp size={size === 'compact' ? 13 : 16} />
            </div>
          );
        })}

        {/* Center Main Rolling Icon Showcase */}
        <div
          key={currentGame.id}
          className="animate-pop-in"
          style={{
            width: size === 'compact' ? '44px' : '56px',
            height: size === 'compact' ? '44px' : '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #18181B 0%, #09090B 100%)',
            border: `2px solid ${currentGame.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 25px ${currentGame.color}55, inset 0 0 15px ${currentGame.color}22`,
            zIndex: 10,
            transition: 'all 0.4s ease'
          }}
        >
          <ActiveIcon size={size === 'compact' ? 24 : 32} />
        </div>
      </div>

      {/* 2. Text Indicator & Live Game Ticker */}
      <div style={{ textAlign: 'center', maxWidth: '280px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '8px'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: currentGame.color,
              boxShadow: `0 0 8px ${currentGame.color}`
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: '800',
              color: '#F4F4F5',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            {currentGame.name}
          </span>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: size === 'compact' ? '14px' : '16px',
            fontWeight: '800',
            color: '#FAFAFA',
            margin: '0 0 3px 0',
            letterSpacing: '-0.01em'
          }}
        >
          {message}
        </h3>

        {submessage && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: '#A1A1AA',
              margin: 0
            }}
          >
            {submessage}
          </p>
        )}
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(9, 9, 11, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
