import React, { useState, useEffect } from 'react';
import EnterpriseHeader from './components/EnterpriseHeader.jsx';
import EnterpriseFooter from './components/EnterpriseFooter.jsx';
import ArcadeHomeScreen from './components/ArcadeHomeScreen.jsx';
import StatsModal from './components/StatsModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import MatchSettingsModal from './components/MatchSettingsModal.jsx';
import GlobalLeaderboardModal from './components/GlobalLeaderboardModal.jsx';
import OnlineMatchmakingModal from './components/OnlineMatchmakingModal.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import GameLaunchModal from './components/GameLaunchModal.jsx';
import { CustomAlertProvider, useCustomAlert } from './components/CustomAlertProvider.jsx';





import DesktopAppSidebar from './components/DesktopAppSidebar.jsx';
import GomokuGame from './games/GomokuGame.jsx';
import ConnectFour from './games/ConnectFour.jsx';
import TicTacToe from './games/TicTacToe.jsx';
import { soundSynth } from './utils/soundSynth.js';
import { getUserProfile, recordMatchResult, logoutUserProfile } from './utils/userProfile.js';

import { getGameSettings } from './utils/gameSettings.js';
import { cloudSync } from './utils/cloudSync.js';
import { presenceService } from './services/presenceService.js';

const STATS_STORAGE_KEY = 'championship_arena_stats';
const ACTIVE_ONLINE_SESSION_KEY = 'championship_active_online_session';

const DEFAULT_STATS = {
  gomoku: { p1Wins: 0, p2Wins: 0, draws: 0 },
  connect4: { p1Wins: 0, p2Wins: 0, draws: 0 },
  tictactoe: { p1Wins: 0, p2Wins: 0, draws: 0 }
};

// Route Metadata for Dynamic SEO Titles & Descriptions
const ROUTE_META = {
  home: {
    title: 'Online Free Games — 2-Player Multiplayer Gomoku, Connect 4 & Tic-Tac-Toe',
    desc: 'Play free competitive 2-player games online with instant matchmaking and global ratings.'
  },
  gomoku: {
    title: 'Gomoku Online (15×15) — Online Free Games',
    desc: 'Play Gomoku Five in a Row online against AI or real players with blitz turn timers.'
  },
  connect4: {
    title: 'Connect 4 Online (7×6) — Online Free Games',
    desc: 'Play Connect Four multiplayer online with instant server-authoritative matchmaking.'
  },
  tictactoe: {
    title: 'Tic-Tac-Toe Online (3×3) — Online Free Games',
    desc: 'Play real-time 3×3 Tic-Tac-Toe with friends via room codes or test your skills against Smart AI.'
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

      if (joinParam || modeParam === 'online') return 'ONLINE_MATCH';
      if (modeParam === 'local') return 'LOCAL_2P';
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

  // Online Matchmaking Modal State
  const [matchmakingModal, setMatchmakingModal] = useState({
    isOpen: false,
    mode: 'QUICK_MATCH',
    gameId: 'tictactoe',
    gameTitle: 'Tic-Tac-Toe'
  });

  // Game Launch Options Modal State (AI / Local / Online / Room + Settings)
  const [launchModal, setLaunchModal] = useState({
    isOpen: false,
    gameId: 'connect4'
  });


  // Active Online Session State (Restored from sessionStorage on refresh)
  const [activeOnlineSession, setActiveOnlineSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem(ACTIVE_ONLINE_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

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

  // Initialize Global Platform Presence
  useEffect(() => {
    if (profile) {
      presenceService.initPresence(profile);
    }
    return () => {
      presenceService.cleanup();
    };
  }, [profile?.id, profile?.name, profile?.avatarId]);

  // Deep Link ?join= Handling on Startup
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get('join');
      const gameParam = params.get('game') || 'tictactoe';
      if (joinParam && !activeOnlineSession) {
        setMatchmakingModal({
          isOpen: true,
          mode: 'JOIN_PRIVATE',
          gameId: gameParam,
          gameTitle: gameParam === 'connect4' ? 'Connect 4' : (gameParam === 'gomoku' ? 'Gomoku' : 'Tic-Tac-Toe')
        });
      }
    } catch (e) {}
  }, []);

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

  // Protect against accidental browser tab closes / reloads while inside an active match
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (activeGameId && activeGameId !== 'home') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeGameId]);

  const customAlert = useCustomAlert();


  // Guard navigation when user is actively inside a game
  const confirmExitIfInGame = async (callback) => {
    const isInside = activeGameId && activeGameId !== 'home';
    if (isInside) {
      const confirmed = await customAlert.show({
        type: 'confirm',
        title: 'Exit Current Game?',
        message: 'You have an active match in progress. Are you sure you want to leave and return to the main hub?',
        confirmText: 'Exit Match',
        cancelText: 'Keep Playing',
        isDestructive: true
      });
      if (!confirmed) return;
    }
    if (callback) callback();
  };

  // Navigate to dedicated game page with chosen mode & clean URL update
  const handleNavigate = (gameId, mode = 'VS_COMPUTER') => {
    const isInside = activeGameId && activeGameId !== 'home';
    if (isInside && gameId !== activeGameId) {
      confirmExitIfInGame(() => {
        executeNavigate(gameId, mode);
      });
    } else {
      executeNavigate(gameId, mode);
    }
  };

  const executeNavigate = (gameId, mode = 'VS_COMPUTER') => {
    setActiveGameId(gameId);
    setActiveGameMode(mode);
    setIsLeaderboardOpen(false);
    setIsStatsOpen(false);
    setIsSettingsOpen(false);
    setIsProfileOpen(false);

    if (gameId === 'home') {
      setActiveOnlineSession(null);
      try { sessionStorage.removeItem(ACTIVE_ONLINE_SESSION_KEY); } catch (e) {}
      window.history.pushState({}, '', window.location.pathname);
    } else {
      const modeSlug = mode === 'LOCAL_2P' ? 'local' : mode === 'ONLINE_MATCH' ? 'online' : 'ai';
      window.history.pushState({}, '', `?game=${gameId}&mode=${modeSlug}`);
    }
  };

  // Launch Online Match from Matchmaking Modal
  const handleLaunchOnlineGame = (sessionData) => {
    setActiveOnlineSession(sessionData);
    try {
      sessionStorage.setItem(ACTIVE_ONLINE_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {}

    const gameId = matchmakingModal.gameId;
    setMatchmakingModal(prev => ({ ...prev, isOpen: false }));
    executeNavigate(gameId, 'ONLINE_MATCH');
  };

  // Open Game Launch Options Modal (Vs AI / 2P Local / Online / Private + Name + Settings)
  const handleOpenGameOptions = (gameId) => {
    confirmExitIfInGame(() => {
      setLaunchModal({
        isOpen: true,
        gameId: gameId || 'connect4'
      });
    });
  };

  // Matchmaking Triggers from Home Cards

  const handleStartQuickMatch = (gameId, gameTitle) => {
    confirmExitIfInGame(() => {
      setMatchmakingModal({
        isOpen: true,
        mode: 'QUICK_MATCH',
        gameId,
        gameTitle
      });
    });
  };

  const handleCreatePrivateRoom = (gameId, gameTitle) => {
    confirmExitIfInGame(() => {
      setMatchmakingModal({
        isOpen: true,
        mode: 'CREATE_PRIVATE',
        gameId,
        gameTitle
      });
    });
  };

  const handleJoinPrivateRoom = (gameId = 'connect4', roomCode = null) => {
    confirmExitIfInGame(() => {
      const titles = {
        connect4: 'Connect 4',
        tictactoe: 'Tic-Tac-Toe',
        gomoku: 'Gomoku'
      };
      if (roomCode && typeof roomCode === 'string' && roomCode.length <= 6) {
        window.history.replaceState({}, '', `?join=${roomCode.toUpperCase()}&game=${gameId}`);
      }
      setMatchmakingModal({
        isOpen: true,
        mode: 'JOIN_PRIVATE',
        gameId,
        gameTitle: titles[gameId] || 'Private Match'
      });
    });
  };

  const handleOpenJoinPrivate = handleJoinPrivateRoom;

  // Open dedicated modal route and update URL bar
  const handleOpenPage = (pageName) => {
    const isInside = activeGameId && activeGameId !== 'home';
    if (isInside) {
      confirmExitIfInGame(() => {
        executeOpenPage(pageName);
      });
    } else {
      executeOpenPage(pageName);
    }
  };

  const executeOpenPage = (pageName) => {
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
      const modeSlug = activeGameMode === 'LOCAL_2P' ? 'local' : activeGameMode === 'ONLINE_MATCH' ? 'online' : 'ai';
      window.history.pushState({}, '', `?game=${activeGameId}&mode=${modeSlug}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const getActiveMobileTab = () => {
    if (isLeaderboardOpen) return 'leaderboard';
    if (isStatsOpen) return 'stats';
    if (isSettingsOpen) return 'rules';
    if (isProfileOpen) return 'profile';
    return 'home';
  };

  const handleMobileTabSelect = (tabId) => {
    if (tabId === 'home') {
      handleCloseModals();
      if (activeGameId !== 'home') {
        handleNavigate('home');
      }
    } else {
      handleOpenPage(tabId);
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

  const toggleSound = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);

    soundSynth.setMuted(newMute);
  };

  const handleLogout = async () => {
    logoutUserProfile();
    const freshProfile = getUserProfile();
    setProfile(freshProfile);
    handleCloseModals();
    soundSynth.playVictory();
    alert.show({
      type: 'success',
      title: 'Logged Out Successfully',
      message: 'Your profile has been reset to a fresh Guest account. You can log into any GamerTag anytime from Profile Settings.'
    });
  };



  const renderActiveView = () => {
    switch (activeGameId) {
      case 'gomoku':
        return (
          <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GomokuGame
              profile={profile}
              initialMode={activeGameMode}
              onlineSession={activeOnlineSession}
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
              onlineSession={activeOnlineSession}
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
              onlineSession={activeOnlineSession}
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
              onSelectGame={handleOpenGameOptions}
              onStartQuickMatch={handleStartQuickMatch}
              onCreatePrivateRoom={handleCreatePrivateRoom}
              onJoinPrivateRoom={handleJoinPrivateRoom}
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

      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'row',
      background: '#f8fafc',
      boxSizing: 'border-box'
    }}>
      {/* Full-Height Desktop Navigation Sidebar Drawer (Papergames Style) */}
      <DesktopAppSidebar
        profile={profile}
        onSelectGame={handleOpenGameOptions}
        onStartQuickMatch={handleStartQuickMatch}
        onOpenProfile={() => handleOpenPage('profile')}
        onOpenStats={() => handleOpenPage('stats')}
        onOpenSettings={() => handleOpenPage('rules')}
        onOpenLeaderboard={() => handleOpenPage('leaderboard')}
        onJoinPrivateRoom={handleJoinPrivateRoom}
      />


      {/* Main Content Area */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: isInsideGame ? '100dvh' : 'auto',
        minHeight: isInsideGame ? '100dvh' : '100vh',
        maxHeight: isInsideGame ? '100dvh' : 'none',
        overflowY: isInsideGame ? 'hidden' : 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isInsideGame ? 'space-between' : 'flex-start',
        padding: isInsideGame ? 'clamp(6px, 1.2vw, 10px) clamp(6px, 2vw, 12px)' : '0 clamp(14px, 2.5vw, 28px) 24px',
        boxSizing: 'border-box'
      }}>

        {/* Enterprise Header with Exit Hub & Live Players Counter */}
        <EnterpriseHeader
          activeGameId={activeGameId}
          onSelectGame={handleNavigate}
          onOpenStats={() => handleOpenPage('stats')}
          onOpenProfile={() => handleOpenPage('profile')}
          onOpenSettings={() => handleOpenPage('rules')}
          onOpenLeaderboard={() => handleOpenPage('leaderboard')}
          onJoinPrivateRoom={handleJoinPrivateRoom}
          profile={profile}
          isMuted={isMuted}
          onToggleSound={toggleSound}
        />

        {/* Dedicated Page Viewport */}
        <main style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: isInsideGame ? 'center' : 'flex-start',
          flex: 1,
          overflow: isInsideGame ? 'hidden' : 'visible',
          boxSizing: 'border-box'
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
      </div>


      {/* Online Matchmaking Modal */}
      <OnlineMatchmakingModal
        isOpen={matchmakingModal.isOpen}
        mode={matchmakingModal.mode}
        gameId={matchmakingModal.gameId}
        gameTitle={matchmakingModal.gameTitle}
        currentUserProfile={profile}
        onClose={() => setMatchmakingModal(prev => ({ ...prev, isOpen: false }))}
        onLaunchOnlineGame={handleLaunchOnlineGame}
        onLaunchAiGame={() => {
          setMatchmakingModal(prev => ({ ...prev, isOpen: false }));
          handleNavigate(matchmakingModal.gameId, 'VS_COMPUTER');
        }}
        onProfileUpdated={(updated) => setProfile({ ...updated })}
      />



      {/* Stats Modal / Route */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={handleCloseModals}
        profile={profile}
        stats={stats}
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

      {/* Game Launch Options Modal (Vs AI / 2P Local / Online / Private + Name + Settings) */}
      <GameLaunchModal
        isOpen={launchModal.isOpen}
        gameId={launchModal.gameId}
        profile={profile}
        onClose={() => setLaunchModal(prev => ({ ...prev, isOpen: false }))}
        onLaunchGame={(gameId, mode) => {
          handleNavigate(gameId, mode);
        }}
        onStartQuickMatch={(gameId, gameTitle) => {
          handleStartQuickMatch(gameId, gameTitle);
        }}
        onCreatePrivateRoom={(gameId, gameTitle) => {
          handleCreatePrivateRoom(gameId, gameTitle);
        }}
        onJoinPrivateRoom={(gameId, code) => {
          handleJoinPrivateRoom(gameId, code);
        }}
        onProfileUpdated={(updated) => setProfile({ ...updated })}
      />

      {/* Mobile Bottom Navigation Bar (Dock) */}
      <MobileBottomNav
        activeTab={getActiveMobileTab()}
        onSelectTab={handleMobileTabSelect}
        isInsideGame={isInsideGame}
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

