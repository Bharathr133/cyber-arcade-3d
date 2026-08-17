import React, { useState, useEffect } from 'react';
import EnterpriseHeader from './components/EnterpriseHeader.jsx';
import EnterpriseFooter from './components/EnterpriseFooter.jsx';
import ArcadeHomeScreen from './components/ArcadeHomeScreen.jsx';
import StatsModal from './components/StatsModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import MatchSettingsModal from './components/MatchSettingsModal.jsx';
import GlobalLeaderboardModal from './components/GlobalLeaderboardModal.jsx';
import WelcomeLoginScreen from './components/WelcomeLoginScreen.jsx';
import { CustomAlertProvider, useCustomAlert } from './components/CustomAlertProvider.jsx';
import GomokuGame from './games/GomokuGame.jsx';
import ConnectFour from './games/ConnectFour.jsx';
import TicTacToe from './games/TicTacToe.jsx';
import { soundSynth } from './utils/soundSynth.js';
import { getUserProfile, recordMatchResult, logoutUserProfile } from './utils/userProfile.js';
import { getGameSettings } from './utils/gameSettings.js';
import { cloudSync } from './utils/cloudSync.js';

const STATS_STORAGE_KEY = 'championship_arena_stats';

const DEFAULT_STATS = {
  gomoku: { p1Wins: 0, p2Wins: 0, draws: 0 },
  connect4: { p1Wins: 0, p2Wins: 0, draws: 0 },
  tictactoe: { p1Wins: 0, p2Wins: 0, draws: 0 }
};

function MainApp() {
  const alert = useCustomAlert();

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // User Profile State
  const [profile, setProfile] = useState(() => getUserProfile());

  // Game Settings State
  const [settings, setSettings] = useState(() => getGameSettings());

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

  // Initial cloud sync on load
  useEffect(() => {
    if (profile) {
      try {
        cloudSync.syncProfileToCloud(profile);
      } catch (e) {}
    }
  }, [profile?.name, profile?.rating, profile?.level]);

  // Update Match Records and User Career Rating
  const handleMatchFinished = (gameKey, outcome, opponentName = 'Opponent') => {
    const { profile: updatedProfile } = recordMatchResult(
      gameKey,
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

  const handleResetStats = async () => {
    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Reset Career Statistics?',
      message: 'Are you sure you want to reset all lifetime wins, losses, and draw records? This action cannot be undone.',
      confirmText: 'Reset Stats',
      cancelText: 'Keep Stats'
    });

    if (!confirmed) return;

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

    alert.show({
      type: 'success',
      title: 'Stats Cleared',
      message: 'Your career records have been reset to zero.'
    });
  };

  const toggleSound = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    soundSynth.setMuted(newMute);
  };

  const handleLogout = async () => {
    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Switch / Logout Profile?',
      message: 'Are you sure you want to log out of this profile? You will be prompted to create or sign into a player name.',
      confirmText: 'Log Out',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    logoutUserProfile();
    setProfile(null);
    setIsProfileOpen(false);
  };

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
              settings={settings}
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
              settings={settings}
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
              settings={settings}
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
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            />
          </div>
        );
    }
  };

  const isInsideGame = activeGameId && activeGameId !== 'home';

  return (
    <div style={{
      height: isInsideGame ? '100dvh' : 'auto',
      minHeight: isInsideGame ? '100dvh' : '100vh',
      maxHeight: isInsideGame ? '100dvh' : 'none',
      overflowY: isInsideGame ? 'hidden' : 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: isInsideGame ? 'space-between' : 'flex-start',
      padding: isInsideGame ? 'clamp(6px, 1.2vw, 10px) clamp(6px, 2vw, 12px)' : 'clamp(12px, 3vw, 24px) clamp(8px, 2.5vw, 16px)',
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
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        profile={profile}
        isMuted={isMuted}
        onToggleSound={toggleSound}
      />

      {/* Dedicated Page Viewport */}
      <main style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        overflow: 'hidden'
      }}>
        {renderActiveView()}
      </main>

      {/* Standard Developer Footer */}
      {!isInsideGame ? (
        <EnterpriseFooter />
      ) : (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: '#94a3b8',
          paddingTop: '2px',
          textAlign: 'center'
        }}>
          Championship Arena • Developed by <a href="https://bharathr.vercel.app/" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '700' }}>Bharath R</a>
        </div>
      )}

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        profile={profile}
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

      {/* Match Settings Modal */}
      <MatchSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={(newSettings) => setSettings(newSettings)}
      />

      {/* Global Leaderboard Modal (Top 50 Grandmasters) */}
      <GlobalLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUserProfile={profile}
      />
    </div>
  );
}

export default function App() {
  return (
    <CustomAlertProvider>
      <MainApp />
    </CustomAlertProvider>
  );
}
