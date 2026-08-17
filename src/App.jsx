import React, { useState, useEffect } from 'react';
import EnterpriseHeader from './components/EnterpriseHeader.jsx';
import EnterpriseFooter from './components/EnterpriseFooter.jsx';
import ArcadeHomeScreen from './components/ArcadeHomeScreen.jsx';
import StatsModal from './components/StatsModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import WelcomeLoginScreen from './components/WelcomeLoginScreen.jsx';
import GomokuGame from './games/GomokuGame.jsx';
import ConnectFour from './games/ConnectFour.jsx';
import TicTacToe from './games/TicTacToe.jsx';
import { soundSynth } from './utils/soundSynth.js';
import { getUserProfile, recordMatchResult, logoutUserProfile } from './utils/userProfile.js';

const STATS_STORAGE_KEY = 'championship_arena_stats';

const DEFAULT_STATS = {
  gomoku: { p1Wins: 0, p2Wins: 0, draws: 0 },
  connect4: { p1Wins: 0, p2Wins: 0, draws: 0 },
  tictactoe: { p1Wins: 0, p2Wins: 0, draws: 0 }
};

export default function App() {
  const getGameFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      const joinParam = params.get('join');

      if (gameParam && ['gomoku', 'connect4', 'tictactoe'].includes(gameParam)) {
        return gameParam;
      }
      if (joinParam) {
        if (joinParam.includes('connect4')) return 'connect4';
        if (joinParam.includes('tictactoe')) return 'tictactoe';
        return 'gomoku';
      }
    } catch (e) {}
    return 'home';
  };

  const getModeFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      const joinParam = params.get('join');

      if (joinParam) return 'ONLINE_QR';
      if (modeParam === 'local') return 'LOCAL_2P';
      if (modeParam === 'online') return 'ONLINE_QR';
    } catch (e) {}
    return 'VS_COMPUTER';
  };

  const [activeGameId, setActiveGameId] = useState(getGameFromUrl);
  const [activeGameMode, setActiveGameMode] = useState(getModeFromUrl);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // User Profile State
  const [profile, setProfile] = useState(() => getUserProfile());

  // Lifetime Match Stats
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
    } catch (e) {
      return DEFAULT_STATS;
    }
  });

  // Navigate to dedicated game page with chosen mode
  const handleNavigate = (gameId, mode = 'VS_COMPUTER') => {
    setActiveGameId(gameId);
    setActiveGameMode(mode);

    if (gameId === 'home') {
      window.history.pushState({}, '', window.location.pathname);
    } else {
      const modeSlug = mode === 'LOCAL_2P' ? 'local' : mode === 'ONLINE_QR' ? 'online' : 'ai';
      window.history.pushState({}, '', `?game=${gameId}&mode=${modeSlug}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveGameId(getGameFromUrl());
      setActiveGameMode(getModeFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update Match Records and User Career Rating
  const handleMatchFinished = (gameKey, outcome, opponentName = 'Opponent') => {
    const { profile: updatedProfile } = recordMatchResult(
      gameKey === 'gomoku' ? 'Gomoku' : gameKey === 'connect4' ? 'Connect 4' : 'Tic-Tac-Toe',
      outcome,
      opponentName
    );

    if (updatedProfile) {
      setProfile({ ...updatedProfile });
    }

    setStats((prev) => {
      const gameStats = prev[gameKey] || { p1Wins: 0, p2Wins: 0, draws: 0 };
      const updated = {
        ...prev,
        [gameKey]: {
          p1Wins: outcome === 'WIN' ? (gameStats.p1Wins || 0) + 1 : (gameStats.p1Wins || 0),
          p2Wins: outcome === 'LOSS' ? (gameStats.p2Wins || 0) + 1 : (gameStats.p2Wins || 0),
          draws: outcome === 'DRAW' ? (gameStats.draws || 0) + 1 : (gameStats.draws || 0)
        }
      };
      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleResetStats = () => {
    const emptyStats = {
      gomoku: { p1Wins: 0, p2Wins: 0, draws: 0 },
      connect4: { p1Wins: 0, p2Wins: 0, draws: 0 },
      tictactoe: { p1Wins: 0, p2Wins: 0, draws: 0 }
    };
    setStats(emptyStats);
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(emptyStats));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSound = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    soundSynth.setMuted(newMute);
  };

  const handleLogout = () => {
    logoutUserProfile();
    setProfile(null);
    setIsProfileOpen(false);
  };

  // If user hasn't registered a profile yet, show Welcome Login Screen
  if (!profile) {
    const isInvited = window.location.search.includes('join=');
    return (
      <WelcomeLoginScreen
        isInvited={isInvited}
        onLoginSuccess={(newProfile) => setProfile(newProfile)}
      />
    );
  }

  const renderActiveView = () => {
    switch (activeGameId) {
      case 'gomoku':
        return (
          <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GomokuGame
              profile={profile}
              initialMode={activeGameMode}
              onMatchFinished={handleMatchFinished}
              onGoHome={() => handleNavigate('home')}
            />
          </div>
        );
      case 'connect4':
        return (
          <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ConnectFour
              profile={profile}
              initialMode={activeGameMode}
              onMatchFinished={handleMatchFinished}
              onGoHome={() => handleNavigate('home')}
            />
          </div>
        );
      case 'tictactoe':
        return (
          <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TicTacToe
              profile={profile}
              initialMode={activeGameMode}
              onMatchFinished={handleMatchFinished}
              onGoHome={() => handleNavigate('home')}
            />
          </div>
        );
      case 'home':
      default:
        return (
          <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ArcadeHomeScreen
              profile={profile}
              stats={stats}
              onSelectGame={handleNavigate}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenStats={() => setIsStatsOpen(true)}
            />
          </div>
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(12px, 3vw, 24px) clamp(8px, 2.5vw, 16px)',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Enterprise Header with Exit Room / Hub switch */}
      <EnterpriseHeader
        activeGameId={activeGameId}
        onSelectGame={handleNavigate}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        profile={profile}
        isMuted={isMuted}
        onToggleSound={toggleSound}
        isOnlineActive={activeGameMode === 'ONLINE_QR'}
      />

      {/* Dedicated Page Viewport */}
      <main style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 1
      }}>
        {renderActiveView()}
      </main>

      {/* Standard Developer Footer */}
      <EnterpriseFooter />

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onResetStats={handleResetStats}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile({ ...updated })}
        onLogout={handleLogout}
      />
    </div>
  );
}
