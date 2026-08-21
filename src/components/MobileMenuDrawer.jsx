import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Trophy, BarChart3, Settings, User, 
  KeyRound, ChevronRight, Zap, ShieldCheck, Flame, Compass, ArrowRight,
  LogOut, LogIn, BookOpen
} from 'lucide-react';

import { AVATARS, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon, MemoryMatchIcon, LudoIcon } from './GameIcons.jsx';
import { adminService } from '../services/adminService.js';
import SidebarGameOptionsPanel from './SidebarGameOptionsPanel.jsx';


export default function MobileMenuDrawer({
  isOpen,
  onClose,
  profile,
  isMuted,
  onToggleSound,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenRules,
  onOpenProfile,
  onOpenAdmin,
  onSelectGame,
  onJoinPrivateRoom,
  onLogout,
  onNavigateToAuth

}) {
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [joinSelectedGame, setJoinSelectedGame] = useState('connect4');
  const [expandedGameId, setExpandedGameId] = useState(null);


  // Prevent background body scrolling while mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const currentAvatar = AVATARS.find(a => a.id === profile?.avatarId) || AVATARS[0];
  const tier = getTier(profile?.rating || 1200, totalMatches);
  const isRegistered = !profile?.isGuest && profile?.email;
  const displayName = profile?.name || (profile?.email ? profile.email.split('@')[0] : 'Guest Player');
  const displayInitial = (displayName && displayName[0]) ? displayName[0].toUpperCase() : 'G';
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;
  const currentXp = (profile?.xp || 0) % 100;


  const GAMES = [
    { id: 'connect4', title: 'Connect 4', tag: '7×6 GRID', badge: 'POPULAR', icon: ConnectFourIcon },
    { id: 'tictactoe', title: 'Tic Tac Toe', tag: '3×3 FAST', badge: 'BLITZ', icon: TicTacToeIcon },
    { id: 'gomoku', title: 'Gomoku', tag: '15×15 PRO', badge: 'STRATEGY', icon: GomokuIcon },
    { id: 'memory', title: 'Memory Match', tag: '5 LEVELS', badge: 'SOLO', icon: MemoryMatchIcon },
    { id: 'ludo', title: 'Ludo', tag: '2-4 PLAYERS', badge: 'CLASSIC', icon: LudoIcon }
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
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(24, 24, 27, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'flex-start',
        overscrollBehavior: 'contain'
      }}
      onClick={onClose}
    >
      {/* Slide-in Drawer Container */}
      <div
        className="animate-drawer-panel"
        onWheel={(e) => e.stopPropagation()}
        style={{
          width: 'min(86vw, 320px)',
          height: '100%',
          maxHeight: '100vh',
          background: '#FFFFFF',
          color: '#18181B',
          boxShadow: '20px 0 50px rgba(0, 0, 0, 0.1)',
          borderRight: '1px solid #E4E4E7',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 14px calc(16px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
          overflow: 'hidden',
          overscrollBehavior: 'contain'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Middle Scrollable Section (Header + Profile Card + Games) */}
        <div 
          style={{ 
            flex: 1, 
            minHeight: 0, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '14px',
            paddingRight: '2px',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Header Row: Title & Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src="/brand-logo.jpg" 
                alt="games4u Logo" 
                style={{ width: '28px', height: '28px', borderRadius: '7px', objectFit: 'cover' }}
              />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '15px',
                fontWeight: '900',
                color: '#18181B',
                letterSpacing: '-0.01em'
              }}>
                games4u
              </span>
            </div>


            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px', borderRadius: '6px',
                background: '#F4F4F5', border: '1px solid #E4E4E7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#71717A', cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* User Profile Card */}
          <div style={{
            background: '#F4F4F5',
            border: '1px solid #E4E4E7',
            borderRadius: '12px',
            padding: '12px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div
                onClick={() => handleActionClick(onOpenProfile)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: isRegistered ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#18181B', 
                  color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800',
                  boxShadow: isRegistered ? '0 2px 6px rgba(37,99,235,0.3)' : 'none',
                  flexShrink: 0
                }}>
                  {displayInitial}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </span>
                    <span style={{
                      fontSize: '8px', fontWeight: '700', padding: '1px 4px',
                      borderRadius: '4px', 
                      background: isRegistered ? '#EFF6FF' : '#E4E4E7', 
                      color: isRegistered ? '#2563EB' : '#52525B',
                      border: isRegistered ? '1px solid #BFDBFE' : 'none',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {tier.name}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#71717A', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    <strong style={{ color: '#18181B' }}>{profile?.rating || 1200}</strong> ELO
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleActionClick(onOpenSettings)}
                title="Settings & Audio"
                style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: '#FFFFFF', border: '1px solid #E4E4E7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#71717A'
                }}
              >
                <Settings size={14} />
              </button>
            </div>

            {/* Quick Sign In / Sign Up Action Bar for Guests on Mobile */}
            {!isRegistered && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #E4E4E7'
              }}>
                <button
                  type="button"
                  onClick={() => handleActionClick(() => onNavigateToAuth ? onNavigateToAuth('login') : onOpenProfile())}

                  style={{
                    padding: '7px 8px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #D4D4D8',
                    color: '#0F172A',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <LogIn size={12} color="#64748B" />
                  <span>Log In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleActionClick(() => onNavigateToAuth ? onNavigateToAuth('signup') : onOpenProfile())}
                  style={{
                    padding: '7px 8px',
                    borderRadius: '8px',
                    background: '#2563EB',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                  }}
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>


          {/* Section: COMPETITIVE */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#A1A1AA', letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px' }}>
              COMPETITIVE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => handleActionClick(onOpenLeaderboard)}
                style={{
                  width: '100%', padding: '9px 10px', borderRadius: '8px',
                  background: '#F4F4F5', border: '1px solid #E4E4E7', color: '#18181B',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={15} color="#52525B" />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Leaderboard</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: '#E4E4E7', color: '#52525B', fontFamily: 'var(--font-mono)' }}>
                  TOP 50
                </span>
              </button>

              <button
                onClick={() => handleActionClick(onOpenRules)}
                style={{
                  width: '100%', padding: '9px 10px', borderRadius: '8px',
                  background: '#F4F4F5', border: '1px solid #E4E4E7', color: '#18181B',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={15} color="#2563EB" />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>How to Play</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: '#EFF6FF', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                  RULES
                </span>
              </button>

              <button
                onClick={() => handleActionClick(onOpenSettings)}
                style={{
                  width: '100%', padding: '9px 10px', borderRadius: '8px',
                  background: '#F4F4F5', border: '1px solid #E4E4E7', color: '#18181B',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={15} color="#52525B" />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Match Settings</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: '#E4E4E7', color: '#52525B', fontFamily: 'var(--font-mono)' }}>
                  CONFIG
                </span>
              </button>

              {adminService.isAdmin(profile) && (
                <button
                  onClick={() => handleActionClick(onOpenAdmin)}
                  style={{
                    width: '100%', padding: '9px 10px', borderRadius: '8px',
                    background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={15} color="#2563EB" />
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Admin Backoffice</span>
                  </div>
                  <span style={{ fontSize: '8px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', background: '#2563EB', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                    PORTAL
                  </span>
                </button>
              )}
            </div>
          </div>




          {/* Section: GAMES DIRECTORY */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#A1A1AA', letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px' }}>
              GAMES DIRECTORY
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {GAMES.map((g) => {
                const IconComp = g.icon;

                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      soundSynth.playClick();
                      onClose();
                      onSelectGame(g.id);
                    }}
                    style={{
                      width: '100%', padding: '9px 10px', borderRadius: '8px',
                      background: '#F4F4F5', border: '1px solid #E4E4E7', color: '#18181B',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: '#E4E4E7', color: '#18181B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComp size={14} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>{g.title}</span>
                    </div>

                    <span style={{
                      fontSize: '8px', fontWeight: '700', padding: '1px 4px',
                      borderRadius: '4px', background: '#E4E4E7', color: '#52525B', fontFamily: 'var(--font-mono)'
                    }}>
                      {g.badge}
                    </span>
                  </button>
                );
              })}

            </div>

          </div>
        </div>

        {/* Bottom Section: Quick Room Join & Sign Out (Permanently Fixed at Bottom) */}
        <div style={{ flexShrink: 0, paddingTop: '10px', marginTop: '6px', borderTop: '1px solid #E4E4E7', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          <div style={{ background: '#F4F4F5', border: '1px solid #E4E4E7', borderRadius: '10px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <KeyRound size={13} color="#2563EB" />
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#18181B' }}>
                  PRIVATE ROOM
                </span>
              </div>

              {/* Game Selector Pills */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {['connect4', 'tictactoe', 'gomoku', 'memory', 'ludo'].map((gKey) => (
                  <button
                    key={gKey}
                    type="button"
                    onClick={() => setJoinSelectedGame(gKey)}
                    style={{
                      padding: '2px 4px', borderRadius: '4px', fontSize: '8px', fontWeight: '700',
                      border: 'none',
                      background: joinSelectedGame === gKey ? '#2563EB' : '#E4E4E7',
                      color: joinSelectedGame === gKey ? '#FFFFFF' : '#52525B',
                      cursor: 'pointer'
                    }}
                  >
                    {gKey === 'connect4' ? 'C4' : gKey === 'tictactoe' ? 'TTT' : gKey === 'gomoku' ? 'GMK' : gKey === 'memory' ? 'MEM' : 'LUD'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleDirectJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <input
                type="text"
                maxLength={6}
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="6-LETTER CODE"

                style={{
                  width: '100%', padding: '6px', borderRadius: '6px',
                  border: '1px solid #E4E4E7', fontSize: '11px', fontWeight: '700',
                  letterSpacing: '2px', textAlign: 'center', fontFamily: 'var(--font-mono)',
                  outline: 'none', background: '#FFFFFF', color: '#18181B', boxSizing: 'border-box'
                }}
              />

              <button
                type="submit"
                disabled={quickJoinCode.trim().length < 4}
                className="btn-primary"
                style={{
                  padding: '7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                  opacity: quickJoinCode.trim().length >= 4 ? 1 : 0.4
                }}
              >
                <span>JOIN ROOM</span>
                <ArrowRight size={11} />
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={11} color="#16A34A" />
              <span>Anti-Cheat Engine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#16A34A', fontWeight: '700' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#16A34A' }} />
              <span>ACTIVE</span>
            </div>
          </div>

          {/* Account Auth Action (Sign Out / Log In) */}
          {!profile?.isGuest && profile?.email ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              borderRadius: '8px',
              gap: '6px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#52525B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>
                  {profile.email}
                </span>
              </div>
              <button
                onClick={() => handleActionClick(onLogout)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#DC2626',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  flexShrink: 0
                }}
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>

  );


  return createPortal(drawerContent, document.body);
}
