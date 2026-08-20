import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Bot, User, Zap, Lock, Settings, Clock, Check, Play, Edit3, UserCheck, ShieldCheck
} from 'lucide-react';
import { AVATARS, saveUserProfile, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { getGameSettings, saveGameSettings } from '../utils/gameSettings.js';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon, MemoryMatchIcon, LudoIcon } from './GameIcons.jsx';

export default function GameLaunchModal({
  isOpen,
  gameId = 'connect4',
  profile,
  onClose,
  onLaunchGame,
  onStartQuickMatch,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onProfileUpdated
}) {
  const [selectedMode, setSelectedMode] = useState('VS_COMPUTER'); // 'VS_COMPUTER', 'LOCAL_2P', 'ONLINE_MATCH', 'PRIVATE_ROOM'
  const [turnTime, setTurnTime] = useState(20);
  const [playerName, setPlayerName] = useState('');
  const [avatarId, setAvatarId] = useState('1');
  const [joinCode, setJoinCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (gameId === 'memory') {
        setSelectedMode('SOLO_LEVELS');
      } else {
        setSelectedMode('VS_COMPUTER');
      }

      const hasCustomName = profile?.name && profile.name !== 'Player' && profile.name.trim().length > 0;
      const currentName = hasCustomName ? profile.name : (profile?.name || '');
      setPlayerName(currentName);
      setAvatarId(profile?.avatarId || '1');
      setIsEditingName(!hasCustomName); // If no saved name, open edit box directly
      setNameError('');

      const saved = getGameSettings(profile?.id);
      setTurnTime(saved.turnTimeLimit || 20);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, profile, gameId]);


  if (!isOpen) return null;

  const GAME_INFO = {
    connect4: { title: 'Connect 4', subtitle: '7 × 6 Gravity Grid', icon: ConnectFourIcon, tag: '7×6 GRID' },
    tictactoe: { title: 'Tic-Tac-Toe', subtitle: '3 × 3 Fast Arena', icon: TicTacToeIcon, tag: '3×3 FAST' },
    gomoku: { title: 'Gomoku', subtitle: '15 × 15 Tournament Grid', icon: GomokuIcon, tag: '15×15 PRO' },
    memory: { title: 'Memory Match', subtitle: 'Icon Match Blitz (5 Levels)', icon: MemoryMatchIcon, tag: '5 LEVELS' },
    ludo: { title: 'Ludo Championship', subtitle: '2-4 Player Battle Arena', icon: LudoIcon, tag: '2-4 PLAYERS' }
  };


  const game = GAME_INFO[gameId] || GAME_INFO.connect4;
  const GameIcon = game.icon;
  const currentAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  const tier = getTier(profile?.rating || 1200);

  const handleStartGame = () => {
    const finalName = playerName.trim();
    if (!finalName) {
      setNameError('Please enter your player name / handle before starting.');
      setIsEditingName(true);
      return;
    }
    if (finalName.length < 2) {
      setNameError('Player name must be at least 2 characters.');
      setIsEditingName(true);
      return;
    }

    // Save profile with user's customized name & avatar if changed
    if (finalName !== profile?.name || avatarId !== profile?.avatarId) {
      const updated = saveUserProfile({
        ...profile,
        name: finalName,
        avatarId
      });
      if (onProfileUpdated) onProfileUpdated(updated);
    }

    // Save game settings
    saveGameSettings({ turnTimeLimit: turnTime });

    soundSynth.playVictory();
    onClose();

    if (selectedMode === 'ONLINE_MATCH') {
      onStartQuickMatch(gameId, game.title);
    } else if (selectedMode === 'PRIVATE_ROOM') {
      if (joinCode.trim().length >= 4) {
        onJoinPrivateRoom(gameId, joinCode.trim().toUpperCase());
      } else {
        onCreatePrivateRoom(gameId, game.title);
      }
    } else {
      // VS_COMPUTER or LOCAL_2P
      onLaunchGame(gameId, selectedMode);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(95vw, 460px)',
          maxHeight: '90dvh',
          background: '#ffffff',
          borderRadius: '24px',
          padding: 'clamp(14px, 4vw, 24px)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal Header: Game Info + Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: '#0f172a', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GameIcon size={20} />
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '19px',
                fontWeight: '900',
                color: '#0f172a',
                margin: 0
              }}>
                {game.title}
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                {game.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close-btn"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Smart Player Identity Bar (Saved Badge OR Interactive Edit Mode) */}
        <div style={{
          background: '#f8fafc',
          border: nameError ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {!isEditingName ? (
            /* A. SAVED PLAYER IDENTITY CARD (Fast 1-click start) */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '15px', flexShrink: 0
                }}>
                  {playerName ? playerName[0].toUpperCase() : 'P'}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {playerName}
                    </span>
                    <span style={{
                      fontSize: '8px', fontWeight: '800', padding: '1px 5px',
                      borderRadius: '4px', background: '#e2e8f0', color: '#475569',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {tier.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    <strong>{profile?.rating || 1200}</strong> ELO • Saved Profile
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditingName(true)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
              >
                <Edit3 size={12} />
                <span>Change</span>
              </button>
            </div>
          ) : (
            /* B. EDIT / CHOOSE PLAYER NAME & AVATAR */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em' }}>
                  CHOOSE YOUR PLAYER NAME
                </label>
                {playerName && playerName !== 'Player' && (
                  <button
                    onClick={() => setIsEditingName(false)}
                    style={{ background: 'none', border: 'none', fontSize: '10px', color: '#0f172a', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                  >
                    Done
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Live Avatar Preview */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '15px', flexShrink: 0
                }}>
                  {playerName ? playerName[0].toUpperCase() : (currentAvatar.name ? currentAvatar.name[0] : 'P')}
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="Enter your GamerTag / Name..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              {/* Avatar Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between', paddingTop: '2px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Theme:</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarId(av.id)}
                      title={av.name}
                      style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: av.color, color: '#ffffff',
                        border: avatarId === av.id ? '2px solid #0f172a' : '1px solid transparent',
                        cursor: 'pointer', fontWeight: '800', fontSize: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: avatarId === av.id ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {av.name ? av.name[0].toUpperCase() : av.id}
                    </button>
                  ))}
                </div>
              </div>

              {nameError && (
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
                  {nameError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Mode Selector (4 Options) */}
        <div>
          <label style={{
            fontSize: '11px', fontWeight: '800', color: '#64748b',
            letterSpacing: '0.04em', display: 'block', marginBottom: '8px'
          }}>
            SELECT GAME MODE
          </label>

          {gameId === 'memory' ? (
            /* Memory Match Tailored Modes: Campaign, Vs AI, 2P Duel */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedMode('SOLO_LEVELS')}
                style={{
                  gridColumn: '1 / -1',
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'SOLO_LEVELS' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'SOLO_LEVELS' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'SOLO_LEVELS' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Play size={16} fill={selectedMode === 'SOLO_LEVELS' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '13px', fontWeight: '900' }}>Play Campaign (5 Levels)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('VS_COMPUTER')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'VS_COMPUTER' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'VS_COMPUTER' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'VS_COMPUTER' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Bot size={18} color={selectedMode === 'VS_COMPUTER' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>Vs AI Bot Duel</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>Singleplayer</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('LOCAL_2P')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'LOCAL_2P' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'LOCAL_2P' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'LOCAL_2P' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={18} color={selectedMode === 'LOCAL_2P' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>2P Local Duel</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>Same Device</span>
              </button>
            </div>
          ) : gameId === 'ludo' ? (
            /* Ludo Championship Tailored Modes: Vs 3 Bots, 2P Classic, 4P Local */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedMode('VS_COMPUTER')}
                style={{
                  gridColumn: '1 / -1',
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'VS_COMPUTER' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'VS_COMPUTER' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'VS_COMPUTER' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Bot size={16} color={selectedMode === 'VS_COMPUTER' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '13px', fontWeight: '900' }}>Vs 3 Bots (1P + 3 Smart Bots)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('LOCAL_2P')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'LOCAL_2P' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'LOCAL_2P' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'LOCAL_2P' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={18} color={selectedMode === 'LOCAL_2P' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>2P Classic</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>Red vs Yellow</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('LOCAL_4P')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'LOCAL_4P' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'LOCAL_4P' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'LOCAL_4P' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={18} color={selectedMode === 'LOCAL_4P' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>4P Battle</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>4 Players Local</span>
              </button>
            </div>
          ) : (
            /* Connect4, TicTacToe, Gomoku Modes: AI, 2P Local, Online Match, Private Room */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedMode('VS_COMPUTER')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'VS_COMPUTER' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'VS_COMPUTER' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'VS_COMPUTER' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Bot size={18} color={selectedMode === 'VS_COMPUTER' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>Play Vs AI</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>Singleplayer</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('LOCAL_2P')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'LOCAL_2P' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'LOCAL_2P' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'LOCAL_2P' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={18} color={selectedMode === 'LOCAL_2P' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>2P Local</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>Same Device</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('ONLINE_MATCH')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'ONLINE_MATCH' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'ONLINE_MATCH' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'ONLINE_MATCH' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={18} color={selectedMode === 'ONLINE_MATCH' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>Online Match</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>Ranked Arena</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('PRIVATE_ROOM')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: selectedMode === 'PRIVATE_ROOM' ? '#0f172a' : '#f8fafc',
                  color: selectedMode === 'PRIVATE_ROOM' ? '#ffffff' : '#0f172a',
                  border: selectedMode === 'PRIVATE_ROOM' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Lock size={18} color={selectedMode === 'PRIVATE_ROOM' ? '#ffffff' : '#0f172a'} />
                <span style={{ fontSize: '12px', fontWeight: '800' }}>Private Room</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>Invite Friends</span>
              </button>
            </div>
          )}
        </div>


        {/* 3. Conditional Private Room Code Input */}
        {selectedMode === 'PRIVATE_ROOM' && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px'
          }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
              HAVE A 6-LETTER ROOM CODE? (OPTIONAL)
            </label>
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="LEAVE EMPTY TO CREATE NEW ROOM"
              style={{
                width: '100%', padding: '8px', borderRadius: '8px',
                border: '1.5px solid #cbd5e1', fontSize: '12px', fontWeight: '800',
                letterSpacing: '1px', textAlign: 'center', fontFamily: 'var(--font-mono)',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* 4. Collapsible Turn Timer & Rules */}
        <div>
          <button
            type="button"
            onClick={() => setShowSettings(prev => !prev)}
            style={{
              background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: '800', color: '#475569',
              cursor: 'pointer', padding: 0
            }}
          >
            <Settings size={13} />
            <span>{showSettings ? 'Hide Options & Timers' : 'Customize Turn Timers & Rules'}</span>
          </button>

          {showSettings && (
            <div style={{
              marginTop: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '5px' }}>
                  TURN TIME LIMIT
                </label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[
                    { label: '15s (Blitz)', val: 15 },
                    { label: '20s (Default)', val: 20 },
                    { label: '30s (Slow)', val: 30 },
                    { label: 'Unlimited', val: 0 }
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setTurnTime(t.val)}
                      style={{
                        flex: 1,
                        padding: '6px 2px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        background: turnTime === t.val ? '#0f172a' : '#ffffff',
                        color: turnTime === t.val ? '#ffffff' : '#0f172a',
                        border: turnTime === t.val ? '1px solid #0f172a' : '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Big Start Game Launch Button */}
        <button
          onClick={handleStartGame}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '12px',
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
        >
          <Play size={16} fill="#ffffff" />
          <span>START {game.title}</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
