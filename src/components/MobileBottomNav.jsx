import React from 'react';
import { Gamepad2, Trophy, BarChart3, Settings, User } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function MobileBottomNav({
  activeTab = 'home', // 'home', 'leaderboard', 'stats', 'rules', 'profile'
  onSelectTab,
  isInsideGame = false
}) {
  const TABS = [
    { id: 'home', label: 'Arenas', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Top 50', icon: Trophy },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'rules', label: 'Rules', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleTabClick = (tabId) => {
    soundSynth.playRotate();
    onSelectTab(tabId);
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1.5px solid #e2e8f0',
        padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)'
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
              gap: '3px',
              padding: '6px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              color: isActive ? '#1d4ed8' : '#64748b',
              transition: 'all 0.15s ease',
              minWidth: '54px',
              position: 'relative'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              background: isActive ? '#eff6ff' : 'transparent',
              transition: 'all 0.15s ease'
            }}>
              <IconComp size={18} strokeWidth={isActive ? 2.5 : 2} />
            </div>

            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? '900' : '700',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.01em'
            }}>
              {tab.label}
            </span>

            {/* Active Pill Indicator */}
            {isActive && (
              <span style={{
                position: 'absolute',
                top: '2px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#1d4ed8'
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
