import React, { useState } from 'react';
import { 
  Zap, Bot, Users, Lock, ArrowRight, Play, ArrowLeft, ShieldCheck
} from 'lucide-react';


import { soundSynth } from '../utils/soundSynth.js';
import { saveUserProfile, getTier, AVATARS } from '../utils/userProfile.js';
import { 
  TicTacToeIcon, 
  ConnectFourIcon, 
  GomokuIcon, 
  MemoryMatchIcon, 
  LudoIcon 
} from './GameIcons.jsx';

export const GAME_DIRECTORY = {
  connect4: {
    id: 'connect4',
    title: 'Connect 4',
    subtitle: '7 × 6 Tactical Gravity Arena',
    icon: ConnectFourIcon,
    tag: 'STRATEGY • 2 PLAYERS',
    badge: 'POPULAR',
    accentColor: '#2563EB',
    gradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
    bgLight: '#EFF6FF',
    borderLight: '#BFDBFE',
    description: 'Drop colored discs into the vertical grid. First player to connect 4 consecutive discs horizontally, vertically, or diagonally wins the match.',
    tactic: 'Control the center column early to maximize diagonal and horizontal combinations.'
  },
  tictactoe: {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    subtitle: '3 × 3 Fast Blitz Duel',
    icon: TicTacToeIcon,
    tag: 'BLITZ • 2 PLAYERS',
    badge: 'FAST',
    accentColor: '#DC2626',
    gradient: 'linear-gradient(135deg, #991B1B 0%, #EF4444 100%)',
    bgLight: '#FEF2F2',
    borderLight: '#FECACA',
    description: 'The timeless duel of Xs and Os. Place 3 of your marks in a row horizontally, vertically, or diagonally to claim victory.',
    tactic: 'Claiming the center gives you 4 potential winning lines, while corners provide 3 lines.'
  },
  gomoku: {
    id: 'gomoku',
    title: 'Gomoku',
    subtitle: '15 × 15 Five in a Row Grandmaster',
    icon: GomokuIcon,
    tag: 'PRO • 2 PLAYERS',
    badge: 'GRANDMASTER',
    accentColor: '#0D9488',
    gradient: 'linear-gradient(135deg, #115E59 0%, #14B8A6 100%)',
    bgLight: '#F0FDFA',
    borderLight: '#99F6E4',
    description: 'Ancient strategy board game. Place stones on grid intersections to create an unbroken row of 5 stones before your opponent.',
    tactic: 'Build open-ended three-stone threats that force your opponent into pure defensive reactions.'
  },
  memory: {
    id: 'memory',
    title: 'Memory Match',
    subtitle: 'Icon Memory Blitz & Solo Campaign',
    icon: MemoryMatchIcon,
    tag: 'SOLO & DUEL • 1-2 PLAYERS',
    badge: '5 LEVELS',
    accentColor: '#9333EA',
    gradient: 'linear-gradient(135deg, #6B21A8 0%, #A855F7 100%)',
    bgLight: '#FAF5FF',
    borderLight: '#E9D5FF',
    description: 'Flip pairs of hidden symbols. Complete the 5-level solo star campaign or challenge AI and friends in turn-based duels.',
    tactic: 'Memorize quadrant corners first to uncover matching symbol pairs in fewer turns.'
  },
  ludo: {
    id: 'ludo',
    title: 'Ludo Championship',
    subtitle: '2–4 Player Tournament Arena',
    icon: LudoIcon,
    tag: 'PARTY • 2-4 PLAYERS',
    badge: 'CLASSIC',
    accentColor: '#D97706',
    gradient: 'linear-gradient(135deg, #92400E 0%, #F59E0B 100%)',
    bgLight: '#FEFCE8',
    borderLight: '#FEF08A',
    description: 'Roll the dice and race your 4 tokens across the perimeter into your home triangle. Capture enemy pieces for bonus rolls.',
    tactic: 'Anchor your tokens on safe star squares to block opponent runs and protect your home stretch.'
  }
};

export default function GameModeSelectionHub({
  gameId = 'connect4',
  profile,
  onStartMode,
  onStartQuickMatch,
  onCreatePrivateRoom,
  onOpenSettings,
  onGoBack
}) {
  const game = GAME_DIRECTORY[gameId] || GAME_DIRECTORY.connect4;
  const IconComp = game.icon;

  const isGuestWithoutName = (!profile?.hasCustomName || profile?.name === 'Guest Player') && !profile?.email;
  const [playerNameInput, setPlayerNameInput] = useState(() => (profile?.hasCustomName && profile?.name !== 'Guest Player') ? profile.name : '');
  const [localP2Name, setLocalP2Name] = useState('');
  const [error, setError] = useState('');

  const isMemory = game.id === 'memory';
  const isLudo = game.id === 'ludo';

  const [chosenMode, setChosenMode] = useState(isMemory ? 'SOLO_LEVELS' : 'ONLINE_MATCH');

  const MODES = isMemory ? [
    {
      id: 'SOLO_LEVELS',
      title: 'Solo Campaign',
      subtitle: '5 Star Challenge Levels (Single Player)',
      icon: Play,
      tag: 'SOLO • 1P'
    },
    {
      id: 'VS_COMPUTER',
      title: 'Solo Vs AI Bot',
      subtitle: 'Turn-Based Bot Duel',
      icon: Bot,
      tag: 'SOLO'
    },
    {
      id: 'LOCAL_2P',
      title: '2P Pass & Play',
      subtitle: 'Duel on Same Device',
      icon: Users,
      tag: '2 PLAYERS'
    }
  ] : isLudo ? [
    {
      id: 'VS_COMPUTER',
      title: 'Solo Vs 3 AI Bots',
      subtitle: 'Play Alone vs 3 Smart Bots',
      icon: Bot,
      tag: 'SOLO • 1P'
    },
    {
      id: 'ONLINE_MATCH',
      title: 'Online Quick Match',
      subtitle: 'Ranked Elo Matchmaking',
      icon: Zap,
      tag: 'RANKED'
    },
    {
      id: 'LOCAL_4P',
      title: '2–4P Pass & Play',
      subtitle: 'Local Same-Screen Arena',
      icon: Users,
      tag: 'LOCAL'
    },
    {
      id: 'PRIVATE_ROOM',
      title: 'Private Room',
      subtitle: 'Invite Friend with Code',
      icon: Lock,
      tag: 'FRIENDS'
    }
  ] : [
    {
      id: 'VS_COMPUTER',
      title: 'Solo Vs AI Bot',
      subtitle: 'Grandmaster Bot Duel (Play Single)',
      icon: Bot,
      tag: 'SOLO • 1P'
    },
    {
      id: 'ONLINE_MATCH',
      title: 'Online Quick Match',
      subtitle: 'Ranked Elo Matchmaking',
      icon: Zap,
      tag: 'RANKED'
    },
    {
      id: 'LOCAL_2P',
      title: '2P Pass & Play',
      subtitle: 'Local Same-Screen Duel',
      icon: Users,
      tag: 'LOCAL'
    },
    {
      id: 'PRIVATE_ROOM',
      title: 'Private Room',
      subtitle: 'Invite Friend with Code',
      icon: Lock,
      tag: 'FRIENDS'
    }
  ];


  const handleLaunch = () => {
    setError('');
    let activeName = profile?.name;

    // Validate Guest Name if new
    if (isGuestWithoutName || !profile?.hasCustomName) {
      const clean = playerNameInput.trim();
      if (!clean || clean.length < 2) {
        setError('Please enter your player name (min 2 characters).');
        return;
      }
      saveUserProfile({
        ...profile,
        name: clean,
        hasCustomName: true,
        isGuest: true,
        isRegistered: false
      });
      activeName = clean;
    }

    soundSynth.playVictory();

    // Route directly to real project functions
    if (chosenMode === 'ONLINE_MATCH') {
      onStartQuickMatch(game.id, game.title);
    } else if (chosenMode === 'PRIVATE_ROOM') {
      onCreatePrivateRoom(game.id, game.title);
    } else if (chosenMode === 'LOCAL_2P' || chosenMode === 'LOCAL_4P') {
      const cleanP2 = localP2Name.trim();
      const localPlayers = {
        p1: activeName,
        p2: cleanP2,
        count: isLudo ? 4 : 2
      };

      try {
        sessionStorage.setItem('arcade_local_players', JSON.stringify(localPlayers));
      } catch (e) {}
      onStartMode(chosenMode, { localPlayers });
    } else {
      // VS_COMPUTER or SOLO_LEVELS
      onStartMode(chosenMode);
    }
  };

  return (
    <div 
      className="animate-pop-in" 
      style={{
        width: 'min(100%, 680px)',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '6px 0 24px',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button
          onClick={onGoBack}
          className="btn-secondary"
          style={{
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            background: '#FFFFFF',
            border: '1px solid #E4E4E7'
          }}
        >
          <ArrowLeft size={14} />
          <span>Home Arena</span>
        </button>
      </div>


      {/* Hero Showcase Card */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid #E4E4E7',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Game Title & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '18px',
            background: game.gradient, color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 10px 24px ${game.accentColor}35`,
            flexShrink: 0
          }}>
            <IconComp size={32} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                {game.title}
              </h1>
              <span style={{
                fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)',
                padding: '2px 8px', borderRadius: '6px', background: game.bgLight, color: game.accentColor,
                border: `1px solid ${game.borderLight}`
              }}>
                {game.badge}
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
              {game.subtitle}
            </p>
          </div>
        </div>

        {/* Game Description */}
        <p style={{
          margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6', fontWeight: '500'
        }}>
          {game.description}
        </p>

        {/* 1. MATCH MODE SELECTOR GRID */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', letterSpacing: '0.08em', marginBottom: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            SELECT MATCH MODE
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMemory ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '10px' }}>
            {MODES.map((m) => {
              const ModeIcon = m.icon;
              const isSelected = chosenMode === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playClick();
                    setChosenMode(m.id);
                  }}
                  style={{
                    padding: '16px 14px',
                    borderRadius: '16px',
                    border: isSelected ? `2px solid ${game.accentColor}` : '1.5px solid #E2E8F0',
                    background: isSelected ? game.bgLight : '#F8FAFC',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? `0 4px 14px ${game.accentColor}20` : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: isSelected ? game.accentColor : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? 'none' : '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isSelected ? `0 4px 10px ${game.accentColor}35` : '0 1px 2px rgba(0,0,0,0.04)'
                    }}>
                      <ModeIcon size={18} />
                    </div>

                    <span style={{
                      fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)',
                      padding: '2px 6px', borderRadius: '4px',
                      background: isSelected ? '#FFFFFF' : '#E2E8F0',
                      color: isSelected ? game.accentColor : '#64748B'
                    }}>
                      {m.tag}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                      {m.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. GUEST PLAYER NAME INPUT (Only if new player) */}
        {isGuestWithoutName && (
          <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              YOUR DISPLAY NAME
            </label>
            <input
              type="text"
              value={playerNameInput}
              onChange={(e) => { setPlayerNameInput(e.target.value); setError(''); }}
              maxLength={18}
              placeholder="e.g. Bharath"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '12px',
                border: error ? '1.5px solid #DC2626' : '1.5px solid #CBD5E1', fontSize: '14px',
                fontWeight: '700', color: '#0F172A', outline: 'none', background: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* 3. LOCAL PLAYER 2 NAME INPUT (Only if local mode) */}
        {(chosenMode === 'LOCAL_2P' || chosenMode === 'LOCAL_4P') && (
          <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              PLAYER 2 / FRIEND NAME
            </label>
            <input
              type="text"
              value={localP2Name}
              onChange={(e) => setLocalP2Name(e.target.value)}
              maxLength={18}
              placeholder="e.g. Friend's Name"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '12px',
                border: '1.5px solid #CBD5E1', fontSize: '14px',
                fontWeight: '700', color: '#0F172A', outline: 'none', background: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* 4. STRATEGY & TACTIC HINT CARD */}
        <div style={{
          background: game.bgLight, borderRadius: '14px', padding: '12px 16px',
          border: `1px solid ${game.borderLight}`, display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <ShieldCheck size={18} color={game.accentColor} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#1E293B', fontWeight: '600', lineHeight: 1.5 }}>
            <strong style={{ color: game.accentColor }}>Strategy:</strong> {game.tactic}
          </div>
        </div>


        {error && (
          <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: '700' }}>
            {error}
          </span>
        )}

        {/* 5. MAIN START BUTTON */}
        <button
          type="button"
          onClick={handleLaunch}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '900',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: game.gradient,
            border: 'none',
            boxShadow: `0 8px 24px ${game.accentColor}40`,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span>
            {chosenMode === 'ONLINE_MATCH' ? 'START ONLINE MATCH' :
             chosenMode === 'PRIVATE_ROOM' ? 'CREATE PRIVATE ROOM' :
             chosenMode === 'LOCAL_2P' || chosenMode === 'LOCAL_4P' ? 'START LOCAL DUEL' :
             chosenMode === 'SOLO_LEVELS' ? 'START SOLO CAMPAIGN' :
             isLudo ? 'PLAY SOLO (VS 3 BOTS)' : 'PLAY SOLO (VS AI BOT)'}
          </span>
          <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}
