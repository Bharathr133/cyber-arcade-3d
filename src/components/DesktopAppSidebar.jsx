import React, { useState } from 'react';
import { 
  Trophy, BarChart3, Settings, KeyRound, PanelLeftClose, PanelLeftOpen,
  ShieldCheck, Zap, Sparkles, User, Flame, Compass, Radio, ArrowRight
} from 'lucide-react';

import { AVATARS, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon } from './GameIcons.jsx';

export default function DesktopAppSidebar({
  profile,
  onSelectGame,
  onStartQuickMatch,
  onOpenProfile,
  onOpenStats,
  onOpenSettings,
  onOpenLeaderboard,
  onJoinPrivateRoom
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [joinSelectedGame, setJoinSelectedGame] = useState('connect4');

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

  const handleDirectJoinSubmit = (e) => {
    e.preventDefault();
    if (!quickJoinCode.trim()) return;
    soundSynth.playVictory();
    onJoinPrivateRoom(joinSelectedGame, quickJoinCode.trim().toUpperCase());
  };

  const toggleSidebar = () => {
    soundSynth.playRotate();
    setIsExpanded(prev => !prev);
  };

  return (
    <aside
      className="desktop-only"
      style={{
        width: isExpanded ? '250px' : '68px',
        minWidth: isExpanded ? '250px' : '68px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        background: 'linear-gradient(180deg, #0b1329 0%, #090e1f 100%)',
        color: '#f8fafc',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '6px 0 25px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isExpanded ? '14px 14px 18px' : '14px 8px 18px',
        boxSizing: 'border-box',
        zIndex: 100,
        transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.28s cubic-bezier(0.16, 1, 0.3, 1), padding 0.28s ease',
        flexShrink: 0,
        userSelect: 'none'
      }}
    >
      {/* TOP SECTION: Top-Left Toggle + User Profile + Navigation + Games */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
        
        {/* Top Header Row with Toggle on the Top Left */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          paddingBottom: '2px'
        }}>
          {isExpanded ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={toggleSidebar}
                title="Collapse sidebar"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#cbd5e1';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <PanelLeftClose size={16} />
              </button>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '12px',
                fontWeight: '900',
                color: '#94a3b8',
                letterSpacing: '0.06em'
              }}>
                CYBER ARCADE
              </span>
            </div>
          ) : (
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#cbd5e1';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>

        {/* 1. Advanced Profile Card */}
        {isExpanded ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '12px',

            boxSizing: 'border-box',
            position: 'relative',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div
                onClick={onOpenProfile}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', flex: 1, minWidth: 0 }}
              >
                {/* Avatar with Glow */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: '900',
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

                  <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <strong style={{ color: '#ffffff' }}>{profile?.rating || 1200}</strong> ELO • Lv {profile?.level || 1}
                  </div>
                </div>
              </div>

              {/* Settings Gear */}
              <button
                onClick={onOpenSettings}
                title="Settings & Audio"
                style={{
                  width: '28px', height: '28px', borderRadius: '7px',
                  background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Settings size={14} />
              </button>
            </div>

            {/* XP Progress Indicator */}
            <div style={{ marginTop: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '3px' }}>
                <span>XP {currentXp}/100</span>
                <span>Lv {profile?.level || 1}</span>
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
        ) : (
          /* Collapsed Mode */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onOpenProfile}
              title={`${profile?.name || 'Player'} (${profile?.rating || 1200} ELO)`}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: currentAvatar.color, color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: '900',
                border: 'none', cursor: 'pointer',
                boxShadow: `0 0 10px ${currentAvatar.color}88`
              }}
            >
              {profile?.name ? profile.name[0].toUpperCase() : 'P'}
            </button>

            <button
              onClick={onOpenSettings}
              title="Settings & Audio"
              style={{
                width: '30px', height: '30px', borderRadius: '7px',
                background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', cursor: 'pointer'
              }}
            >
              <Settings size={14} />
            </button>
          </div>
        )}

        {/* 2. Section: COMPETITIVE ARENA */}
        <div>
          {isExpanded && (
            <div style={{
              fontSize: '10px', fontWeight: '800', color: '#64748b',
              letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <Compass size={11} color="#64748b" />
              <span>COMPETITIVE</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isExpanded ? 'stretch' : 'center' }}>
            {/* Global Leaderboard */}
            <button
              onClick={onOpenLeaderboard}
              title="Global Tournament Leaderboard"
              style={{
                width: isExpanded ? '100%' : '36px',
                height: isExpanded ? 'auto' : '36px',
                padding: isExpanded ? '8px 10px' : '0',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid transparent',
                color: '#cbd5e1',
                display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Trophy size={16} color="#f59e0b" />
                {isExpanded && <span>Leaderboard</span>}
              </div>
              {isExpanded && (
                <span style={{
                  fontSize: '9px', fontWeight: '800', padding: '1px 5px',
                  borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24',
                  fontFamily: 'var(--font-mono)'
                }}>
                  TOP 50
                </span>
              )}
            </button>

            {/* Career Stats */}
            <button
              onClick={onOpenStats}
              title={`Career Statistics (${winRate}% Win Rate)`}
              style={{
                width: isExpanded ? '100%' : '36px',
                height: isExpanded ? 'auto' : '36px',
                padding: isExpanded ? '8px 10px' : '0',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid transparent',
                color: '#cbd5e1',
                display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <BarChart3 size={16} color="#38bdf8" />
                {isExpanded && <span>Career Stats</span>}
              </div>
              {isExpanded && (
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>
                  {winRate}% WR
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 3. Section: TOURNAMENT GAMES */}
        <div>
          {isExpanded && (
            <div style={{
              fontSize: '10px', fontWeight: '800', color: '#64748b',
              letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <Flame size={11} color="#64748b" />
              <span>GAMES DIRECTORY</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isExpanded ? 'stretch' : 'center' }}>
            {GAMES.map((g) => {
              const IconComp = g.icon;

              return (
                <button
                  key={g.id}
                  onClick={() => {
                    if (onSelectGame) onSelectGame(g.id);
                    else onStartQuickMatch(g.id, g.title);
                  }}
                  title={`Play ${g.title} (${g.tag})`}
                  style={{
                    width: isExpanded ? '100%' : '36px',
                    height: isExpanded ? 'auto' : '36px',
                    padding: isExpanded ? '8px 10px' : '0',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    color: '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                    fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#e2e8f0';
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
                    {isExpanded && <span>{g.title}</span>}
                  </div>

                  {isExpanded && (
                    <span style={{
                      fontSize: '8px', fontWeight: '900', padding: '2px 5px',
                      borderRadius: '4px', background: `${g.badgeColor}22`,
                      color: g.badgeColor, fontFamily: 'var(--font-mono)'
                    }}>
                      {g.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Join Room Hub & Real-time Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isExpanded ? (
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
        ) : (
          <button
            onClick={() => onJoinPrivateRoom('connect4')}
            title="Join Private Match with Code"
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', margin: '0 auto',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <KeyRound size={16} color="#38bdf8" />
          </button>
        )}

        {/* Real-time Security & Engine Status */}
        {isExpanded && (
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
        )}
      </div>
    </aside>
  );
}
