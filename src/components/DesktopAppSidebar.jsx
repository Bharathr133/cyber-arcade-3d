import React, { useState } from 'react';
import { 
  Trophy, BarChart3, Settings, KeyRound, PanelLeftClose, PanelLeftOpen,
  ShieldCheck, Zap, User, Flame, Compass, Radio, ArrowRight,
  LogOut, LogIn, BookOpen
} from 'lucide-react';


import { AVATARS, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon, MemoryMatchIcon, LudoIcon } from './GameIcons.jsx';
import { adminService } from '../services/adminService.js';
import SidebarGameOptionsPanel from './SidebarGameOptionsPanel.jsx';

// Hover Connected Flyout Tooltip for Collapsed Sidebar
function FlyoutTooltip({ title, subtitle, badge, badgeColor = 'blue' }) {
  return (
    <div className="sidebar-flyout-tooltip">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '800', color: '#18181B', fontSize: '12px' }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: '9px',
            fontWeight: '800',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            borderRadius: '4px',
            background: badgeColor === 'amber' ? '#FEF3C7' : badgeColor === 'green' ? '#DCFCE7' : '#EFF6FF',
            color: badgeColor === 'amber' ? '#B45309' : badgeColor === 'green' ? '#15803D' : '#1D4ED8',
            border: badgeColor === 'amber' ? '1px solid #FDE68A' : badgeColor === 'green' ? '1px solid #BBF7D0' : '1px solid #BFDBFE'
          }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <span style={{ fontSize: '10px', color: '#71717A', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}


export default function DesktopAppSidebar({
  isExpanded: controlledExpanded,
  onToggleExpand,
  activeGameId,
  activePage,
  profile,
  onSelectGame,
  onStartQuickMatch,
  onOpenProfile,
  onOpenSettings,
  onOpenRules,
  onOpenLeaderboard,
  onOpenAdmin,
  onLogout,
  onNavigateToAuth,
  onJoinPrivateRoom

}) {
  const [localExpanded, setLocalExpanded] = useState(true);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;
  const [expandedGameId, setExpandedGameId] = useState(null);

  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const tier = getTier(profile?.rating || 1200, totalMatches);
  const isRegistered = !profile?.isGuest && profile?.email;
  const displayName = profile?.name || (profile?.email ? profile.email.split('@')[0] : 'Guest Player');
  const displayInitial = (displayName && displayName[0]) ? displayName[0].toUpperCase() : 'G';
  const currentAvatar = AVATARS.find(a => a.id === profile?.avatarId) || AVATARS[0];
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;
  const currentXp = (profile?.xp || 0) % 100;

  const GAMES = [
    { id: 'connect4', title: 'Connect 4', tag: '7×6 GRID', badge: 'POPULAR', icon: ConnectFourIcon },
    { id: 'tictactoe', title: 'Tic Tac Toe', tag: '3×3 FAST', badge: 'BLITZ', icon: TicTacToeIcon },
    { id: 'gomoku', title: 'Gomoku', tag: '15×15 PRO', badge: 'STRATEGY', icon: GomokuIcon },
    { id: 'memory', title: 'Memory Match', tag: '5 LEVELS', badge: 'SOLO', icon: MemoryMatchIcon },
    { id: 'ludo', title: 'Ludo', tag: '2-4 PLAYERS', badge: 'CLASSIC', icon: LudoIcon }
  ];

  const toggleSidebar = () => {

    soundSynth.playRotate();
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded(prev => !prev);
    }
  };

  return (
    <aside
      className="desktop-only desktop-fixed-sidebar"
      onWheel={(e) => e.stopPropagation()}
      style={{
        width: isExpanded ? '260px' : '72px',
        minWidth: isExpanded ? '260px' : '72px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: '#F4F4F5',
        color: '#18181B',
        borderRight: '1px solid #E4E4E7',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isExpanded ? '12px 12px 14px' : '12px 8px 14px',
        boxSizing: 'border-box',
        zIndex: 90,
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease',
        flexShrink: 0,
        userSelect: 'none',
        overflow: isExpanded ? 'hidden' : 'visible',
        overscrollBehavior: 'contain'
      }}
    >
      {/* 1. TOP HEADER (Toggle Button & Brand) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center', paddingBottom: '10px', borderBottom: '1px solid #E4E4E7', flexShrink: 0 }}>
        {isExpanded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar"
              style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: '#FFFFFF', border: '1px solid #E4E4E7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#52525B', cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              <PanelLeftClose size={15} />
            </button>
            <div 
              onClick={() => onSelectGame('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
            >
              <img 
                src="/brand-logo.jpg" 
                alt="games4u Logo" 
                style={{ width: '22px', height: '22px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#18181B', letterSpacing: '-0.01em' }}>
                games4u
              </span>
            </div>
          </div>
        ) : (

          <div className="sidebar-item-wrapper">
            <button
              onClick={toggleSidebar}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#FFFFFF', border: '1px solid #E4E4E7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#52525B', cursor: 'pointer'
              }}
            >
              <PanelLeftOpen size={16} />
            </button>
            <FlyoutTooltip title="Expand Sidebar" />
          </div>
        )}
      </div>

      {/* 2. MIDDLE SCROLLABLE CONTAINER */}
      <div 
        className="sidebar-scrollable-container"
        style={{
          flex: 1, minHeight: 0, overflowY: isExpanded ? 'auto' : 'visible', overflowX: 'visible',
          padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '14px',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          overscrollBehavior: 'contain'
        }}
      >


        {/* User Card */}
        {isExpanded ? (
          <div style={{
            background: activePage === 'profile' ? '#FFFFFF' : '#FFFFFF',
            border: activePage === 'profile' ? '1.5px solid #2563EB' : '1px solid #E4E4E7',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: activePage === 'profile' ? '0 0 0 1px #2563EB, 0 2px 6px rgba(37,99,235,0.08)' : '0 1px 2px rgba(0,0,0,0.03)',
            position: 'relative',
            transition: 'all 0.15s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div
                onClick={onOpenProfile}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '8px',
                  background: isRegistered ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : (activePage === 'profile' ? '#2563EB' : '#18181B'), 
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
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </span>
                    <span style={{
                      fontSize: '8px', fontWeight: '700', padding: '1px 4px',
                      borderRadius: '4px', 
                      background: isRegistered ? '#EFF6FF' : '#F4F4F5', 
                      color: isRegistered ? '#2563EB' : '#52525B',
                      border: isRegistered ? '1px solid #BFDBFE' : 'none',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {tier.name}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: '#71717A', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                    <strong style={{ color: '#18181B' }}>{profile?.rating || 1200}</strong> ELO
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenSettings}
                title="Settings & Audio"
                style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  background: activePage === 'rules' || activePage === 'settings' ? '#2563EB' : '#F4F4F5',
                  border: '1px solid #E4E4E7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activePage === 'rules' || activePage === 'settings' ? '#FFFFFF' : '#71717A',
                  cursor: 'pointer'
                }}
              >
                <Settings size={13} />
              </button>
            </div>

            {/* Quick Sign In / Sign Up Action Bar for Guests */}
            {!isRegistered && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #F4F4F5'
              }}>
                <button
                  type="button"
                  onClick={() => onNavigateToAuth ? onNavigateToAuth('login') : onOpenProfile()}

                  style={{
                    padding: '6px 8px',
                    borderRadius: '7px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#0F172A',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <LogIn size={11} color="#64748B" />
                  <span>Log In</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToAuth ? onNavigateToAuth('signup') : onOpenProfile()}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '7px',
                    background: '#2563EB',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 3px rgba(37,99,235,0.2)'
                  }}
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        ) : (

          <div className="sidebar-item-wrapper">
            <button
              onClick={onOpenProfile}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: activePage === 'profile' ? '#2563EB' : '#18181B', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800',
                border: activePage === 'profile' ? '2px solid #2563EB' : 'none',
                cursor: 'pointer', margin: '0 auto'
              }}
            >
              {profile?.hasCustomName && profile?.name ? profile.name[0].toUpperCase() : 'G'}
            </button>
            <FlyoutTooltip
              title={profile?.hasCustomName ? profile.name : 'Guest Competitor'}
              subtitle={`${profile?.rating || 1200} ELO • ${tier.name}`}
              badge={tier.name}
            />
          </div>
        )}

        {/* Section: COMPETITIVE */}
        <div>
          {isExpanded && (
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#A1A1AA', letterSpacing: '0.06em', marginBottom: '4px', paddingLeft: '4px' }}>
              COMPETITIVE
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div className={isExpanded ? '' : 'sidebar-item-wrapper'}>
              <button
                onClick={onOpenLeaderboard}
                style={{
                  width: '100%', padding: isExpanded ? '7px 8px' : '7px 0',
                  borderRadius: '8px',
                  background: activePage === 'leaderboard' ? '#FFFFFF' : 'transparent',
                  border: activePage === 'leaderboard' ? '1px solid #E4E4E7' : '1px solid transparent',
                  color: activePage === 'leaderboard' ? '#2563EB' : '#52525B',
                  display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                  fontSize: '12px', fontWeight: activePage === 'leaderboard' ? '700' : '600', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={15} color={activePage === 'leaderboard' ? '#2563EB' : '#52525B'} />
                  {isExpanded && <span>Leaderboard</span>}
                </div>
                {isExpanded && (
                  <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 4px', borderRadius: '4px', background: '#E4E4E7', color: '#52525B', fontFamily: 'var(--font-mono)' }}>
                    TOP 50
                  </span>
                )}
              </button>
              {!isExpanded && (
                <FlyoutTooltip title="Leaderboard" subtitle="Top 50 Global Rankings" badge="TOP 50" badgeColor="amber" />
              )}
            </div>

            {adminService.isAdmin(profile) && (
              <div className={isExpanded ? '' : 'sidebar-item-wrapper'}>
                <button
                  onClick={onOpenAdmin}
                  style={{
                    width: '100%', padding: isExpanded ? '7px 8px' : '7px 0',
                    borderRadius: '8px',
                    background: activePage === 'admin' ? '#2563EB' : '#EFF6FF',
                    border: activePage === 'admin' ? '1px solid #2563EB' : '1px solid #BFDBFE',
                    color: activePage === 'admin' ? '#FFFFFF' : '#2563EB',
                    display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={15} color={activePage === 'admin' ? '#FFFFFF' : '#2563EB'} />
                    {isExpanded && <span>Admin Backoffice</span>}
                  </div>
                  {isExpanded && (
                    <span style={{ fontSize: '8px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', background: activePage === 'admin' ? '#FFFFFF' : '#2563EB', color: activePage === 'admin' ? '#2563EB' : '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      PORTAL
                    </span>
                  )}
                </button>
                {!isExpanded && (
                  <FlyoutTooltip title="Admin Backoffice" subtitle="Live Management Portal" badge="PORTAL" />
                )}
              </div>
            )}

            {/* Match Settings in Sidebar */}
            <div className={isExpanded ? '' : 'sidebar-item-wrapper'}>
              <button
                onClick={onOpenSettings}
                style={{
                  width: '100%', padding: isExpanded ? '7px 8px' : '7px 0',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#52525B',
                  display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={15} color="#52525B" />
                  {isExpanded && <span>Match Settings</span>}
                </div>
                {isExpanded && (
                  <span style={{ fontSize: '8px', fontWeight: '700', padding: '1px 4px', borderRadius: '4px', background: '#F4F4F5', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
                    CONFIG
                  </span>
                )}
              </button>
              {!isExpanded && (
                <FlyoutTooltip title="Match Settings" subtitle="Timer & Match Preferences" badge="CONFIG" />
              )}
            </div>

            {/* How to Play Rules in Sidebar */}
            <div className={isExpanded ? '' : 'sidebar-item-wrapper'}>
              <button
                onClick={onOpenRules}
                style={{
                  width: '100%', padding: isExpanded ? '7px 8px' : '7px 0',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#52525B',
                  display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={15} color="#52525B" />
                  {isExpanded && <span>How to Play</span>}
                </div>
                {isExpanded && (
                  <span style={{ fontSize: '8px', fontWeight: '700', padding: '1px 4px', borderRadius: '4px', background: '#EFF6FF', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                    RULES
                  </span>
                )}
              </button>
              {!isExpanded && (
                <FlyoutTooltip title="How to Play" subtitle="5 Game Strategy Guides" badge="RULES" />
              )}
            </div>

          </div>
        </div>





        {/* Section: GAMES DIRECTORY */}

        <div>
          {isExpanded && (
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#A1A1AA', letterSpacing: '0.06em', marginBottom: '4px', paddingLeft: '4px' }}>
              GAMES DIRECTORY
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {GAMES.map((g) => {
              const IconComp = g.icon;
              const isActive = !activePage && activeGameId === g.id;
              const isPanelOpen = expandedGameId === g.id && isExpanded;


              return (
                <div key={g.id} className={isExpanded ? '' : 'sidebar-item-wrapper'}>
                  <button
                    onClick={() => {
                      soundSynth.playClick();
                      onSelectGame(g.id);
                    }}
                    style={{
                      width: '100%', padding: isExpanded ? '7px 8px' : '7px 0',
                      borderRadius: '8px',
                      background: isActive ? '#FFFFFF' : 'transparent',
                      border: isActive ? '1px solid #E4E4E7' : '1px solid transparent',
                      color: isActive ? '#2563EB' : '#52525B',
                      display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center',
                      fontSize: '12px', fontWeight: isActive ? '700' : '600', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconComp size={15} color={isActive ? '#2563EB' : '#52525B'} />
                      {isExpanded && <span>{g.title}</span>}
                    </div>
                    {isExpanded && (
                      <span style={{
                        fontSize: '8px', fontWeight: '700', padding: '1px 4px',
                        borderRadius: '4px',
                        background: isActive ? '#EFF6FF' : '#F4F4F5',
                        color: isActive ? '#2563EB' : '#71717A',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {g.badge}
                      </span>
                    )}
                  </button>

                  {!isExpanded && (
                    <FlyoutTooltip title={g.title} subtitle={g.tag} badge={g.badge} />
                  )}
                </div>

              );
            })}

          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: Footer */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid #E4E4E7', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        {/* Real-time Anti-Cheat Engine Status */}
        {isExpanded && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px', color: '#71717A', fontFamily: 'var(--font-mono)', padding: '2px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={11} color="#16A34A" />
              <span>Anti-Cheat Engine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#16A34A', fontWeight: '700' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#16A34A' }} />
              <span>ACTIVE</span>
            </div>
          </div>
        )}

        {/* 4. FOOTER: Account Auth Action (Sign Out / Log In) */}
        {!profile?.isGuest && profile?.email ? (
          isExpanded ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: '#FFFFFF',
              border: '1px solid #E4E4E7',
              borderRadius: '8px',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#52525B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                  {profile.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#DC2626',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  flexShrink: 0
                }}
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="sidebar-item-wrapper">
              <button
                onClick={onLogout}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#FFFFFF', border: '1px solid #E4E4E7',
                  color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', margin: '0 auto'
                }}
              >
                <LogOut size={15} />
              </button>
              <FlyoutTooltip title="Sign Out" subtitle={profile.email} badgeColor="red" />
            </div>
          )
        ) : (
          !isExpanded ? (
            <div className="sidebar-item-wrapper">
              <button
                onClick={() => onNavigateToAuth ? onNavigateToAuth('login') : onOpenProfile()}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#2563EB', border: 'none',
                  color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', margin: '0 auto'
                }}
              >
                <LogIn size={15} />
              </button>
              <FlyoutTooltip title="Log In / Sign Up" subtitle="Save ratings & history" badge="FREE" />
            </div>
          ) : null
        )}
      </div>


    </aside>
  );
}

