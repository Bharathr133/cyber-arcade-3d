import React from 'react';
import { Gamepad2, KeyRound, Trophy, BookOpen, User } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function MobileBottomNav({
  activeTab = 'home', // 'home', 'join', 'leaderboard', 'rules', 'profile'
  onSelectTab,
  isInsideGame = false
}) {
  if (isInsideGame) return null;

  const TABS = [
    { id: 'home', label: 'Arenas', icon: Gamepad2 },
    { id: 'join', label: 'Join Room', icon: KeyRound },
    { id: 'leaderboard', label: 'Top 50', icon: Trophy },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleTabClick = (tabId) => {
    soundSynth.playRotate();
    onSelectTab(tabId);
  };

  return (
    <nav
      className="mobile-only mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #E4E4E7',
        padding: '4px 6px calc(6px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        boxSizing: 'border-box'
      }}
    >
      {TABS.map((tab) => {
        const IconComp = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            style={{
              background: isActive ? '#EFF6FF' : 'transparent',
              border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              color: isActive ? '#2563EB' : '#71717A',
              padding: '4px 6px',
              borderRadius: '10px',
              cursor: 'pointer',
              flex: 1,
              maxWidth: '72px',
              minHeight: '44px',
              touchAction: 'manipulation',
              transition: 'all 0.15s ease'
            }}
          >
            <IconComp size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '10px',
              fontWeight: isActive ? '800' : '600',
              lineHeight: 1.1,
              whiteSpace: 'nowrap'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
