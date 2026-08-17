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

// Route Metadata for Dynamic SEO Titles & Descriptions
const ROUTE_META = {
  home: {
    title: 'Online Free Games — 2-Player Multiplayer Gomoku, Connect 4 & Tic-Tac-Toe',
    desc: 'Play free competitive 2-player games online with instant QR matchmaking and global ratings.'
  },
  gomoku: {
    title: 'Gomoku Online (15×15) — Online Free Games',
    desc: 'Play Gomoku Five in a Row online against AI or real friends with blitz turn timers.'
  },
  connect4: {
    title: 'Connect 4 Online (7×6) — Online Free Games',
    desc: 'Play Connect Four multiplayer online with instant WebRTC matchmaking.'
  },
  tictactoe: {
    title: 'Tic-Tac-Toe Online (3×3) — Online Free Games',
    desc: 'Play real-time 3×3 Tic-Tac-Toe with friends via QR code or test your skills against Smart AI.'
  },
  leaderboard: {
    title: 'Global Grandmasters Leaderboard — Online Free Games',
    desc: 'Top 50 global player rankings and competitive ELO leaderboards for Gomoku, Connect 4, and Tic-Tac-Toe.'
  },
  stats: {
    title: 'Career Records & Match Statistics — Online Free Games',
    desc: 'View your lifetime wins, losses, ELO progress, and win rates across all game modes.'
  },
  rules: {
    title: 'Game Settings & Blitz Timers — Online Free Games',
    desc: 'Customize turn timers, bank times, and first-player rules for competitive matches.'
  }
};

function MainApp() {
  const alert = useCustomAlert();

  const getRouteFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      const pageParam = params.get('page');
      const joinParam = params.get('join');

      if (gameParam && ['gomoku', 'connect4', 'tictactoe'].includes(gameParam)) {
        return { gameId: gameParam, page: null };
      }
      if (pageParam) {
        if (['gomoku', 'connect4', 'tictactoe'].includes(pageParam)) {
          return { gameId: pageParam, page: null };
        }
        return { gameId: 'home', page: pageParam };
      }
      if (joinParam) {
        if (joinParam.includes('connect4')) return { gameId: 'connect4', page: null };
        if (joinParam.includes('tictactoe')) return { gameId: 'tictactoe', page: null };
        return { gameId: 'gomoku', page: null };
      }
    } catch (e) {}
    return { gameId: 'home', page: null };
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

  const initialRoute = getRouteFromUrl();
  const [activeGameId, setActiveGameId] = useState(initialRoute.gameId);
  const [activeGameMode, setActiveGameMode] = useState(getModeFromUrl);
  const [isStatsOpen, setIsStatsOpen] = useState(initialRoute.page === 'stats');
  const [isProfileOpen, setIsProfileOpen] = useState(initialRoute.page === 'profile');
  const [isSettingsOpen, setIsSettingsOpen] = useState(initialRoute.page === 'rules' || initialRoute.page === 'settings');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(initialRoute.page === 'leaderboard');
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

  // Synchronize document title and metadata with active route
  useEffect(() => {
    let key = 'home';
    if (activeGameId && activeGameId !== 'home') key = activeGameId;
    else if (isLeaderboardOpen) key = 'leaderboard';
    else if (isStatsOpen) key = 'stats';
    else if (isSettingsOpen) key = 'rules';

    const meta = ROUTE_META[key] || ROUTE_META.home;
    document.title = meta.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', meta.desc);
  }, [activeGameId, isLeaderboardOpen, isStatsOpen, isSettingsOpen]);

  // Navigate to dedicated game page with chosen mode & clean URL update
  const handleNavigate = (gameId, mode = 'VS_COMPUTER') => {
    setActiveGameId(gameId);
    setActiveGameMode(mode);
    setIsLeaderboardOpen(false);
    setIsStatsOpen(false);
    setIsSettingsOpen(false);
    setIsProfileOpen(false);

    if (gameId === 'home') {
      window.history.pushState({}, '', window.location.pathname);
    } else {
      const modeSlug = mode === 'LOCAL_2P' ? 'local' : mode === 'ONLINE_QR' ? 'online' : 'ai';
      window.history.pushState({}, '', `?game=${gameId}&mode=${modeSlug}`);
    }
  };

  // Open dedicated modal route and update URL bar
  const handleOpenPage = (pageName) => {
    setIsLeaderboardOpen(pageName === 'leaderboard');
    setIsStatsOpen(pageName === 'stats');
    setIsSettingsOpen(pageName === 'rules' || pageName === 'settings');
    setIsProfileOpen(pageName === 'profile');

    if (pageName) {
      window.history.pushState({}, '', `?page=${pageName}`);
    }
  };

  // Close modals and restore URL
  const handleCloseModals = () => {
    setIsLeaderboardOpen(false);
    setIsStatsOpen(false);
    setIsSettingsOpen(false);
    setIsProfileOpen(false);

    if (activeGameId && activeGameId !== 'home') {
      const modeSlug = activeGameMode === 'LOCAL_2P' ? 'local' : activeGameMode === 'ONLINE_QR' ? 'online' : 'ai';
      window.history.pushState({}, '', `?game=${activeGameId}&mode=${modeSlug}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  // Listen to browser Back/Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromUrl();
      setActiveGameId(route.gameId);
      setActiveGameMode(getModeFromUrl());
      setIsStatsOpen(route.page === 'stats');
      setIsProfileOpen(route.page === 'profile');
      setIsSettingsOpen(route.page === 'rules' || route.page === 'settings');
      setIsLeaderboardOpen(route.page === 'leaderboard');
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
    handleCloseModals();
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
              onOpenProfile={() => handleOpenPage('profile')}
              onOpenStats={() => handleOpenPage('stats')}
              onOpenSettings={() => handleOpenPage('rules')}
              onOpenLeaderboard={() => handleOpenPage('leaderboard')}
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
        onOpenStats={() => handleOpenPage('stats')}
        onOpenProfile={() => handleOpenPage('profile')}
        onOpenSettings={() => handleOpenPage('rules')}
        onOpenLeaderboard={() => handleOpenPage('leaderboard')}
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
          Online Free Games • Developed by <a href="https://bharathr.vercel.app/" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '700' }}>Bharath R</a>
        </div>
      )}

      {/* Stats Modal / Route */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={handleCloseModals}
        profile={profile}
        stats={stats}
        onResetStats={handleResetStats}
      />

      {/* Profile Modal / Route */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={handleCloseModals}
        profile={profile}
        onProfileUpdated={(updated) => setProfile({ ...updated })}
        onLogout={handleLogout}
      />

      {/* Match Settings Modal / Route */}
      <MatchSettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseModals}
        onSettingsSaved={(newSettings) => setSettings(newSettings)}
      />

      {/* Global Leaderboard Modal / Route (Top 50 Grandmasters) */}
      <GlobalLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={handleCloseModals}
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
