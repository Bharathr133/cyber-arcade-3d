import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Trophy, BarChart3, Settings, User, Volume2, VolumeX, 
  KeyRound, ChevronRight, Zap, ShieldCheck, Flame, Compass, ArrowRight, Sparkles
} from 'lucide-react';
import { AVATARS, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon } from './GameIcons.jsx';

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  profile,
  isMuted,
  onToggleSound,
  onOpenLeaderboard,
  onOpenStats,
  onOpenSettings,
  onOpenProfile,
  onSelectGame,
  onJoinPrivateRoom
}) {
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [joinSelectedGame, setJoinSelectedGame] = useState('connect4');

  if (!isOpen) return null;

  const currentAvatar = AVATARS.find(a => a.id === profile?.avatarId) || AVATARS[0];
  const tier = getTier(profile?.rating || 1200);

  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;
  const currentXp = (profile?.xp || 0) % 100;

  const GAMES = [
    { 
      id: 'connect4', 
      title: 'Connect 4', 
      tag: '7×6 GRID', 
      badge: 'POPULAR',
      badgeColor: '#38bdf8',
      icon: ConnectFourIcon,
      color: '#38bdf8' 
    },
    { 
      id: 'tictactoe', 
      title: 'Tic Tac Toe', 
      tag: '3×3 FAST', 
      badge: 'BLITZ',
      badgeColor: '#f43f5e',
      icon: TicTacToeIcon,
      color: '#f43f5e' 
    },
    { 
      id: 'gomoku', 
      title: 'Gomoku', 
      tag: '15×15 PRO', 
      badge: 'STRATEGY',
      badgeColor: '#10b981',
      icon: GomokuIcon,
      color: '#10b981' 
    }
  ];

  const handleActionClick = (actionFn) => {
    soundSynth.playRotate();
    onClose();
    if (actionFn) actionFn();
  };

  const handleDirectJoinSubmit = (e) => {
    e.preventDefault();
    if (!quickJoinCode.trim()) return;
    soundSynth.playVictory();
    onClose();
    onJoinPrivateRoom(joinSelectedGame, quickJoinCode.trim().toUpperCase());
  };

  const drawerContent = (
    <div
      className="animate-drawer-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 9999999,
        display: 'flex',
        justifyContent: 'flex-start'
      }}
      onClick={onClose}
    >
      {/* Slide-in Drawer Container */}
      <div
        className="animate-drawer-panel"
        style={{
          width: 'min(86vw, 320px)',
          height: '100%',
          background: 'linear-gradient(180deg, #0b1329 0%, #090e1f 100%)',
          color: '#f8fafc',
          boxShadow: '20px 0 50px rgba(0, 0, 0, 0.5)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          borderTopRightRadius: '24px',
          borderBottomRightRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '18px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Header Row: Title & Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Zap size={15} fill="#38bdf8" />
              </div>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '0.04em'
              }}>
                CYBER ARCADE
              </span>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* 1. Advanced Esports Profile Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '12px',
            boxSizing: 'border-box',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div
                onClick={() => handleActionClick(onOpenProfile)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
              >
                {/* Glowing Avatar */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '900',
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${currentAvatar.color}88`
                }}>
                  {profile?.name ? profile.name[0].toUpperCase() : 'P'}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                      fontSize: '13px', fontWeight: '900', color: '#ffffff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {profile?.name || 'Player'}
                    </span>
                    <span style={{
                      fontSize: '8px', fontWeight: '900', padding: '1px 4px',
                      borderRadius: '4px', background: 'rgba(255, 255, 255, 0.12)', color: '#38bdf8',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {tier.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    <strong style={{ color: '#ffffff' }}>{profile?.rating || 1200}</strong> ELO • Lv {profile?.level || 1}
                  </div>
                </div>
              </div>

              {/* Quick Mute & Settings Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={onToggleSound}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  style={{
                    width: '28px', height: '28px', borderRadius: '7px',
                    background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    border: isMuted ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isMuted ? '#f87171' : '#94a3b8', cursor: 'pointer'
                  }}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>

                <button
                  onClick={() => handleActionClick(onOpenSettings)}
                  title="Settings & Audio"
                  style={{
                    width: '28px', height: '28px', borderRadius: '7px',
                    background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94a3b8', cursor: 'pointer'
                  }}
                >
                  <Settings size={13} />
                </button>
              </div>
            </div>

            {/* XP Progress */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '3px' }}>
                <span>XP {currentXp}/100</span>
                <span>Level {profile?.level || 1}</span>
              </div>
              <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div style={{
                  width: `${currentXp}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          </div>

          {/* 2. Section: COMPETITIVE */}
          <div>
            <div style={{
              fontSize: '10px', fontWeight: '800', color: '#64748b',
              letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <Compass size={11} color="#64748b" />
              <span>COMPETITIVE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Leaderboard */}
              <button
                onClick={() => handleActionClick(onOpenLeaderboard)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Trophy size={16} color="#f59e0b" />
                  <span>Leaderboard</span>
                </div>
                <span style={{
                  fontSize: '9px', fontWeight: '800', padding: '1px 5px',
                  borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24',
                  fontFamily: 'var(--font-mono)'
                }}>
                  TOP 50
                </span>
              </button>

              {/* Career Stats */}
              <button
                onClick={() => handleActionClick(onOpenStats)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <BarChart3 size={16} color="#38bdf8" />
                  <span>Career Stats</span>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>
                  {winRate}% WR
                </span>
              </button>
            </div>
          </div>

          {/* 3. Section: TOURNAMENT GAMES */}
          <div>
            <div style={{
              fontSize: '10px', fontWeight: '800', color: '#64748b',
              letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <Flame size={11} color="#64748b" />
              <span>GAMES DIRECTORY</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {GAMES.map((g) => {
                const IconComp = g.icon;

                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      onClose();
                      if (onSelectGame) onSelectGame(g.id);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComp size={15} />
                      </div>
                      <span>{g.title}</span>
                    </div>

                    <span style={{
                      fontSize: '8px', fontWeight: '900', padding: '2px 5px',
                      borderRadius: '4px', background: `${g.badgeColor}22`,
                      color: g.badgeColor, fontFamily: 'var(--font-mono)'
                    }}>
                      {g.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Join Room & Anti-Cheat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
          
          {/* Private Room Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '14px',
            padding: '12px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <KeyRound size={13} color="#38bdf8" />
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.04em' }}>
                  PRIVATE ROOM
                </span>
              </div>

              {/* Game Selector Pills */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {['connect4', 'tictactoe', 'gomoku'].map((gKey) => (
                  <button
                    key={gKey}
                    type="button"
                    onClick={() => setJoinSelectedGame(gKey)}
                    style={{
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '8px',
                      fontWeight: '800',
                      border: 'none',
                      background: joinSelectedGame === gKey ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                      color: joinSelectedGame === gKey ? '#0f172a' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {gKey === 'connect4' ? 'C4' : gKey === 'tictactoe' ? 'TTT' : 'GMK'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleDirectJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                type="text"
                maxLength={6}
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                placeholder="6-LETTER CODE"
                style={{
                  width: '100%', padding: '7px', borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '12px', fontWeight: '900',
                  letterSpacing: '2px', textAlign: 'center', fontFamily: 'var(--font-mono)',
                  outline: 'none', background: 'rgba(0, 0, 0, 0.35)', color: '#38bdf8', boxSizing: 'border-box'
                }}
              />

              <button
                type="submit"
                disabled={quickJoinCode.trim().length < 4}
                style={{
                  padding: '7px', borderRadius: '7px', fontSize: '11px', fontWeight: '900',
                  background: '#ffffff',
                  color: '#0f172a', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  opacity: quickJoinCode.trim().length >= 4 ? 1 : 0.4,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>ENTER ROOM</span>
                <ArrowRight size={12} />
              </button>
            </form>
          </div>

          {/* Real-time Security & Engine Status */}
          <div style={{
            fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={12} color="#10b981" />
              <span style={{ color: '#94a3b8' }}>Anti-Cheat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '800' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
