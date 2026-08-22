import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Volume2, VolumeX, Zap, Menu, User, 
  Trophy, Settings, ChevronRight, Info, Shield
} from 'lucide-react';

import { presenceService } from '../services/presenceService.js';
import { AVATARS, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import MobileMenuDrawer from './MobileMenuDrawer.jsx';

export const GAME_DETAILS = {
  gomoku: { title: 'GOMOKU', subtitle: '15 × 15 Grid' },
  connect4: { title: 'CONNECT 4', subtitle: '7 × 6 Grid' },
  tictactoe: { title: 'TIC-TAC-TOE', subtitle: '3 × 3 Grid' },
  memory: { title: 'MEMORY MATCH', subtitle: 'Icon Match Blitz' },
  ludo: { title: 'LUDO CHAMPIONSHIP', subtitle: '2-4 Player Arena' }
};

export const PAGE_TITLES = {
  leaderboard: { title: 'Top 50 Leaderboard', icon: Trophy },
  rules: { title: 'How to Play & Rules', icon: Settings },
  howtoplay: { title: 'How to Play & Rules', icon: Settings },
  about: { title: 'About games4u', icon: Info },
  contact: { title: 'Contact & Feedback', icon: User },
  feedback: { title: 'Contact & Feedback', icon: User },
  fairplay: { title: 'Fair Play & ELO', icon: Shield },
  elo: { title: 'Fair Play & ELO', icon: Shield },
  privacy: { title: 'Privacy & Terms', icon: Shield },
  terms: { title: 'Privacy & Terms', icon: Shield },
  profile: { title: 'Player Profile', icon: User }
};

export default function EnterpriseHeader({

  activeGameId,
  activePage,
  isSidebarExpanded = false,
  onSelectGame,
  profile,
  isMuted,
  onToggleSound,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenRules,
  onOpenProfile,
  onOpenAdmin,
  onJoinPrivateRoom,
  onLogout,
  onNavigateToAuth
}) {
  const [onlineCount, setOnlineCount] = useState(() => presenceService.getOnlineCount());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Subscribe to live online presence
  useEffect(() => {
    const unsub = presenceService.subscribe((count) => setOnlineCount(count));
    return () => unsub();
  }, []);

  // Lightweight throttled scroll listener (avoids frame drops / lag on scroll)
  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const scrolled = currentScrollY > 10;
          if (scrolled !== lastScrolled) {
            lastScrolled = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const isInsideGame = activeGameId && activeGameId !== 'home';
  const currentGame = isInsideGame ? GAME_DETAILS[activeGameId] : null;
  const currentPage = activePage ? PAGE_TITLES[activePage] : null;
  const headerLeftOffset = isInsideGame ? '0px' : (isSidebarExpanded ? '240px' : '64px');

  // Player Tier & Display computations
  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const tier = getTier(profile?.rating || 1200, totalMatches);
  const isRegistered = !profile?.isGuest && profile?.email;
  const displayName = profile?.name || (profile?.email ? profile.email.split('@')[0] : 'Guest');
  const displayInitial = (displayName && displayName[0]) ? displayName[0].toUpperCase() : 'G';

  return (
    <>
      <header 
        className="app-enterprise-header"
        style={{
          position: 'fixed',
          top: 0,
          left: headerLeftOffset,
          right: 0,
          height: isInsideGame ? '54px' : '60px',
          zIndex: 80,
          background: isScrolled ? 'rgba(244, 244, 245, 0.94)' : '#F4F4F5',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '0 clamp(16px, 2.5vw, 32px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid #E4E4E7',
          boxShadow: isScrolled ? '0 4px 20px -2px rgba(0, 0, 0, 0.06)' : 'none',
          boxSizing: 'border-box',
          transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* LEFT ZONE: Brand & Navigation Breadcrumb */}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {/* Mobile Hamburger Menu Trigger (Only when outside active game) */}
            {!isInsideGame && (
              <button
                onClick={() => {
                  soundSynth.playClick();
                  setIsMobileMenuOpen(true);
                }}
                className="btn-secondary mobile-menu-btn"
                title="Open Navigation Menu"
                style={{
                  width: '36px', height: '36px', padding: 0,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  background: '#FFFFFF',
                  border: '1px solid #E4E4E7',
                  color: '#18181B'
                }}
              >
                <Menu size={17} />
              </button>
            )}

            {/* Logo / Brand Mark with luxury crest */}
            <div 
              onClick={() => onSelectGame('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', userSelect: 'none' }}
              title="games4u Home"
            >
              <img 
                src="/brand-logo.jpg" 
                alt="games4u Logo" 
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
                  border: '1px solid rgba(228, 228, 231, 0.8)',
                  flexShrink: 0
                }}
              />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '17px',
                fontWeight: '900',
                color: '#18181B',
                letterSpacing: '-0.02em'
              }}>
                games4u
              </span>
            </div>

            {/* Dynamic Context Breadcrumb on Game or Subpages */}
            {isInsideGame && currentGame && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium pl-2 border-l border-zinc-300">
                <ChevronRight size={13} className="text-zinc-400 flex-shrink-0" />
                <span className="font-bold text-zinc-800 truncate max-w-[130px] sm:max-w-[200px]">
                  {currentGame.title}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-zinc-500 font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-200/60 ml-1">
                  {currentGame.subtitle}
                </span>
              </div>
            )}

            {currentPage && !isInsideGame && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium pl-2 border-l border-zinc-300">
                <ChevronRight size={13} className="text-zinc-400 flex-shrink-0" />
                <span className="font-bold text-zinc-800 truncate max-w-[140px] sm:max-w-[220px]">
                  {currentPage.title}
                </span>
              </div>
            )}
          </div>
        </div>


        {/* RIGHT ZONE: Utility, Audio & Mini Player Rank Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>


          {/* Sound Mute / Unmute Toggle */}
          <button
            onClick={() => {
              soundSynth.playClick();
              onToggleSound();
            }}
            style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #E4E4E7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#52525B', cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease'
            }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={16} color="#DC2626" /> : <Volume2 size={16} />}
          </button>

          {/* Mini Player Profile & Rating Badge */}
          {!isInsideGame && (
            <button
              onClick={() => {
                soundSynth.playClick();
                onOpenProfile();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 8px 3px 4px',
                borderRadius: '9px',
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}
              title="View Profile & Career Stats"
            >
              {/* Avatar circle */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '6px',
                background: isRegistered ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#18181B',
                color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: '800',
                flexShrink: 0
              }}>
                {displayInitial}
              </div>

              {/* Player Name & Rating */}
              <div className="hidden sm:flex flex-col text-left" style={{ minWidth: 0, maxWidth: '100px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '700', color: '#18181B',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {displayName}
                </span>
                <span style={{ fontSize: '9px', color: '#2563EB', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                  {profile?.rating || 1200} ELO
                </span>
              </div>
            </button>
          )}

          {/* Quick Settings Gear Trigger */}
          <button
            onClick={() => {
              soundSynth.playClick();
              onOpenSettings();
            }}
            style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #E4E4E7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#52525B', cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease'
            }}
            title="Settings & Match Options"
          >
            <Settings size={15} />
          </button>

        </div>
      </header>

      {/* Mobile Drawer Menu Portal */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenSettings={onOpenSettings}
        onOpenRules={onOpenRules}
        onOpenProfile={onOpenProfile}
        onOpenAdmin={onOpenAdmin}
        onSelectGame={onSelectGame}
        onJoinPrivateRoom={onJoinPrivateRoom}
        onLogout={onLogout}
        onNavigateToAuth={onNavigateToAuth}
      />
    </>
  );
}
