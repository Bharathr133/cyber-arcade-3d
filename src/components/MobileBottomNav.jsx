import React from 'react';
import { Gamepad2, Trophy, Settings, User } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function MobileBottomNav({
  activeTab = 'home', // 'home', 'leaderboard', 'rules', 'profile'
  onSelectTab,
  isInsideGame = false
}) {
  if (isInsideGame) return null;

  const TABS = [
    { id: 'home', label: 'Arenas', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Top 50', icon: Trophy },
    { id: 'rules', label: 'Rules', icon: Settings },
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
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #E4E4E7',
        padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)'
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
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              color: isActive ? '#2563EB' : '#71717A',
              padding: '4px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              minWidth: '50px',
              minHeight: '44px'
            }}
          >
            <IconComp size={18} />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '10px',
              fontWeight: isActive ? '800' : '600'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
