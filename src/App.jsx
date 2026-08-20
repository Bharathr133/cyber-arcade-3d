import React, { useState, useEffect } from 'react';
import EnterpriseHeader from './components/EnterpriseHeader.jsx';
import EnterpriseFooter from './components/EnterpriseFooter.jsx';
import ArcadeHomeScreen from './components/ArcadeHomeScreen.jsx';
import ProfileModal from './components/ProfileModal.jsx';

import MatchSettingsModal from './components/MatchSettingsModal.jsx';
import GlobalLeaderboardModal from './components/GlobalLeaderboardModal.jsx';
import OnlineMatchmakingModal from './components/OnlineMatchmakingModal.jsx';
import WelcomeCelebrationModal from './components/WelcomeCelebrationModal.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import { CustomAlertProvider, useCustomAlert } from './components/CustomAlertProvider.jsx';
import DesktopAppSidebar from './components/DesktopAppSidebar.jsx';
import { ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';

import BroadcastBanner from './components/BroadcastBanner.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';


import GomokuGame from './games/GomokuGame.jsx';
import ConnectFour from './games/ConnectFour.jsx';
import TicTacToe from './games/TicTacToe.jsx';
import MemoryMatch from './games/MemoryMatch.jsx';
import LudoGame from './games/LudoGame.jsx';
import { soundSynth } from './utils/soundSynth.js';
import { getUserProfile, recordMatchResult, logoutUserProfile } from './utils/userProfile.js';
import { authService } from './services/authService.js';


import { getGameSettings } from './utils/gameSettings.js';
import { cloudSync } from './utils/cloudSync.js';
import { presenceService } from './services/presenceService.js';
import { realtimeManager } from './services/realtimeManager.js';
import { matchmakingService } from './services/matchmakingService.js';

const STATS_STORAGE_KEY = 'championship_arena_stats';
const ACTIVE_ONLINE_SESSION_KEY = 'championship_active_online_session';

const DEFAULT_STATS = {
  gomoku: { p1Wins: 0, p2Wins: 0, draws: 0 },
  connect4: { p1Wins: 0, p2Wins: 0, draws: 0 },
  tictactoe: { p1Wins: 0, p2Wins: 0, draws: 0 },
  memory: { p1Wins: 0, p2Wins: 0, draws: 0 },
  ludo: { p1Wins: 0, p2Wins: 0, draws: 0 }
};

// Route Metadata for Dynamic SEO Titles & Descriptions
const ROUTE_META = {
  home: {
    title: 'Online Free Games — 2-Player Multiplayer Connect 4, Tic-Tac-Toe, Gomoku, Memory & Ludo',
    desc: 'Play free competitive games online with instant matchmaking and global ratings.'
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
  memory: {
    title: 'Memory Match Online — Level-Based Icon Matching & Blitz Timers',
    desc: 'Play speed Memory Match card pairs with level progression, combo multipliers, and Smart AI memory bot.'
  },
  ludo: {
    title: 'Ludo Championship (2-4P) — Online Free Games',
    desc: 'Play 2-4 player Ludo tournament board with smart AI bots, safe star zones, and animated 3D dice.'
  },
  leaderboard: {
    title: 'Global Grandmasters Leaderboard — Online Free Games',
    desc: 'Top 50 global player rankings and competitive ELO leaderboards.'
  },
  stats: {
    title: 'Career Records & Match Statistics — Online Free Games',
    desc: 'View your lifetime wins, losses, ELO progress, and win rates across all game modes.'
  },
  rules: {
    title: 'Game Settings & Blitz Timers — Online Free Games',
    desc: 'Customize turn timers, bank times, and first-player rules for competitive matches.'
  },
  admin: {
    title: 'Platform Operations Backoffice — games4u',
    desc: 'Platform administration, player directory, live arenas, and anti-cheat operations.'
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

      if (gameParam && ['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'].includes(gameParam)) {
        return { gameId: gameParam, page: null };
      }
      if (pageParam) {
        if (['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'].includes(pageParam)) {
          return { gameId: pageParam, page: null };
        }
        return { gameId: 'home', page: pageParam };
      }
      if (joinParam) {
        if (joinParam.includes('connect4')) return { gameId: 'connect4', page: null };
        if (joinParam.includes('tictactoe')) return { gameId: 'tictactoe', page: null };
        if (joinParam.includes('memory')) return { gameId: 'memory', page: null };
        if (joinParam.includes('ludo')) return { gameId: 'ludo', page: null };
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
  const [activePage, setActivePage] = useState(initialRoute.page);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(initialRoute.page === 'rules' || initialRoute.page === 'settings');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(initialRoute.page === 'leaderboard');
  const [isMuted, setIsMuted] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isWelcomeCelebrationOpen, setIsWelcomeCelebrationOpen] = useState(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(() => {
    try {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      return hash.includes('access_token') || 
             hash.includes('type=signup') || 
             hash.includes('type=email_confirmation') || 
             hash.includes('type=recovery') ||
             search.includes('code=');
    } catch (e) {
      return false;
    }
  });

  // Online Matchmaking Modal State
  const [matchmakingModal, setMatchmakingModal] = useState({
    isOpen: false,
    mode: 'QUICK_MATCH',
    gameId: 'tictactoe',
    gameTitle: 'Tic-Tac-Toe'
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

  // Per-User Game Settings State (Strictly Isolated per User)
  const [settings, setSettings] = useState(() => getGameSettings(profile?.id));

  // Sync settings when active user changes
  useEffect(() => {
    if (profile?.id) {
      setSettings(getGameSettings(profile.id));
    }
  }, [profile?.id]);

  // Lifetime Match Stats
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
    } catch (e) {
      return DEFAULT_STATS;
    }
  });

  // Live Supabase Auth Session Listener with Verification Celebration
  useEffect(() => {
    const isFromVerification = isVerifyingAuth;

    const unsubscribeAuth = authService.setupAuthListener((verifiedProfile) => {
      setProfile({ ...verifiedProfile });

      if (isFromVerification || window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
        // Smoothly clear URL token hash
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) {}

        // Small delay for smooth verification transition
        setTimeout(() => {
          setIsVerifyingAuth(false);
          setIsWelcomeCelebrationOpen(true);
        }, 900);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [isVerifyingAuth]);




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


  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromUrl();
      const mode = getModeFromUrl();
      setActiveGameId(route.gameId);
      setActiveGameMode(mode);
      setIsLeaderboardOpen(route.page === 'leaderboard');
      setIsSettingsOpen(route.page === 'rules' || route.page === 'settings');
      setIsProfileOpen(route.page === 'profile');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize document title and metadata with active route
  useEffect(() => {
    let key = 'home';
    if (activeGameId && activeGameId !== 'home') key = activeGameId;
    else if (isLeaderboardOpen) key = 'leaderboard';
    else if (isSettingsOpen) key = 'rules';

    const meta = ROUTE_META[key] || ROUTE_META.home;
    document.title = meta.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', meta.desc);
  }, [activeGameId, isLeaderboardOpen, isSettingsOpen]);

  // Navigate to dedicated game page with chosen mode & clean URL update
  const handleNavigate = (gameId, mode = 'VS_COMPUTER') => {
    executeNavigate(gameId, mode);
  };

  const executeNavigate = (gameId, mode = 'VS_COMPUTER') => {
    setActiveGameId(gameId);
    setActiveGameMode(mode);
    setActivePage(null);
    setIsLeaderboardOpen(false);
    setIsSettingsOpen(false);
    setIsProfileOpen(false);

    try {
      presenceService.setCurrentGame(gameId === 'home' ? null : gameId);
    } catch (e) {}

    if (gameId === 'home') {
      setActiveOnlineSession(null);
      try { sessionStorage.removeItem(ACTIVE_ONLINE_SESSION_KEY); } catch (e) {}
      window.history.pushState({}, '', window.location.pathname);
    } else {
      const modeSlug = mode === 'LOCAL_2P' ? 'local' : mode === 'LOCAL_4P' ? '4p' : mode === 'ONLINE_MATCH' ? 'online' : mode === 'SOLO_LEVELS' ? 'campaign' : 'ai';
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



  // Matchmaking Triggers from Home Cards
  const handleStartQuickMatch = (gameId, gameTitle) => {
    setMatchmakingModal({
      isOpen: true,
      mode: 'QUICK_MATCH',
      gameId,
      gameTitle: gameTitle || 'Matchmaking'
    });
  };

  const handleCreatePrivateRoom = (gameId, gameTitle) => {
    setMatchmakingModal({
      isOpen: true,
      mode: 'CREATE_PRIVATE',
      gameId,
      gameTitle: gameTitle || 'Private Room'
    });
  };

  const handleJoinPrivateRoom = (gameId = 'connect4', roomCode = null) => {
    const titles = {
      connect4: 'Connect 4',
      tictactoe: 'Tic-Tac-Toe',
      gomoku: 'Gomoku',
      memory: 'Memory Match',
      ludo: 'Ludo Championship'
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
  };



  const handleOpenJoinPrivate = handleJoinPrivateRoom;

  // Open dedicated full-page or modal route and update URL bar
  const handleOpenPage = (pageName) => {
    setActivePage(pageName);
    setIsLeaderboardOpen(pageName === 'leaderboard');
    setIsSettingsOpen(pageName === 'rules' || pageName === 'settings');
    setIsProfileOpen(false);

    if (pageName) {
      if (['login', 'signup', 'forgot', 'profile'].includes(pageName)) {
        setActiveGameId('home');
      }
      window.history.pushState({}, '', `?page=${pageName}`);
    } else {
      setActiveGameId('home');
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  // Close modals / return to game lobby
  const handleCloseModals = () => {
    setIsLeaderboardOpen(false);
    setIsSettingsOpen(false);
    setIsProfileOpen(false);
    setActivePage(null);

    if (activeGameId && activeGameId !== 'home') {
      const modeSlug = activeGameMode === 'LOCAL_2P' ? 'local' : activeGameMode === 'ONLINE_MATCH' ? 'online' : 'ai';
      window.history.pushState({}, '', `?game=${activeGameId}&mode=${modeSlug}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };


  const getActiveMobileTab = () => {
    if (activePage === 'profile' || isProfileOpen) return 'profile';
    if (activePage === 'leaderboard' || isLeaderboardOpen) return 'leaderboard';
    if (activePage === 'rules' || activePage === 'settings' || isSettingsOpen) return 'rules';
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
      cloudSync.syncProfileToCloud(updatedProfile, {
        gameKey,
        outcome,
        opponentName
      });
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
    const confirmed = await alert.show({
      type: 'confirm',
      isDestructive: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?'
    });


    if (!confirmed) return;

    await authService.signOut();
    const freshProfile = getUserProfile();
    setProfile(freshProfile);
    handleCloseModals();
    soundSynth.playRotate();
    alert.show({
      type: 'success',
      title: 'Signed Out',
      message: 'You have been signed out.'
    });
  };





  const renderActiveView = () => {
    // Dedicated Full Pages
    if (activePage === 'login' || activePage === 'signin') {
      return (
        <AuthPage
          initialMode="login"
          profile={profile}
          onProfileUpdated={(up) => setProfile(up)}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'signup' || activePage === 'register') {
      return (
        <AuthPage
          initialMode="signup"
          profile={profile}
          onProfileUpdated={(up) => setProfile(up)}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'forgot' || activePage === 'reset_password') {
      return (
        <AuthPage
          initialMode="forgot"
          profile={profile}
          onProfileUpdated={(up) => setProfile(up)}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'admin') {
      return (
        <AdminPage
          profile={profile}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'profile') {
      return (
        <ProfilePage
          profile={profile}
          onProfileUpdated={(up) => setProfile(up)}
          onBackToHome={() => handleOpenPage(null)}
          onLogout={handleLogout}
          onNavigateToAuth={(m) => handleOpenPage(m)}
          onOpenAdmin={() => handleOpenPage('admin')}
        />
      );
    }



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
      case 'memory':
        return (
          <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <MemoryMatch
              profile={profile}
              initialMode={activeGameMode}
              onlineSession={activeOnlineSession}
              settings={settings}
              onMatchFinished={handleMatchFinished}
              onGoHome={() => handleNavigate('home')}
            />
          </div>
        );
      case 'ludo':
        return (
          <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <LudoGame
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
              onSelectGame={handleNavigate}
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
    <div className="app-layout-wrapper" style={{
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'row',
      background: '#FAFAFA',
      color: '#18181B',
      boxSizing: 'border-box'
    }}>


      {/* Full-Height Desktop Navigation Sidebar (Hidden during active match play) */}
      {!isInsideGame && (
        <DesktopAppSidebar
          isExpanded={isSidebarExpanded}
          onToggleExpand={() => setIsSidebarExpanded(prev => !prev)}
          activeGameId={activeGameId}
          activePage={activePage}
          profile={profile}
          onSelectGame={handleNavigate}
          onStartQuickMatch={handleStartQuickMatch}
          onOpenProfile={() => handleOpenPage('profile')}
          onOpenSettings={() => handleOpenPage('rules')}
          onOpenLeaderboard={() => handleOpenPage('leaderboard')}
          onOpenAdmin={() => handleOpenPage('admin')}
          onLogout={handleLogout}
          onNavigateToAuth={(m) => handleOpenPage(m)}
          onJoinPrivateRoom={handleJoinPrivateRoom}
        />
      )}

      {/* Main Content Area (100% full-width during games) */}
      <div 
        className={`app-main-content ${isInsideGame ? 'in-game-fullscreen' : (isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed')}`}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          padding: isInsideGame ? '0 clamp(8px, 2vw, 20px) 16px' : '0 clamp(12px, 2.5vw, 28px) 24px',
          boxSizing: 'border-box',
          transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >


        {/* Global Platform Broadcast Announcement Banner (Hidden during active match play or inside Admin Backoffice) */}
        <BroadcastBanner isInsideGame={isInsideGame} isInsideAdmin={activePage === 'admin'} />



        {/* Enterprise Header with Exit Hub & Live Players Counter */}
        <EnterpriseHeader
          activeGameId={activeGameId}
          onSelectGame={handleNavigate}
          onOpenProfile={() => handleOpenPage('profile')}
          onOpenSettings={() => handleOpenPage('rules')}
          onOpenLeaderboard={() => handleOpenPage('leaderboard')}
          onOpenAdmin={() => handleOpenPage('admin')}
          onJoinPrivateRoom={handleJoinPrivateRoom}
          onLogout={handleLogout}
          onNavigateToAuth={(m) => handleOpenPage(m)}
          profile={profile}
          isMuted={isMuted}
          onToggleSound={toggleSound}
        />


        {/* Dedicated Page Viewport */}
        <main style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          flex: 1,
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
            games4u • Realtime Strategy Arena
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
        onClose={() => {
          matchmakingService.cancelMatchmaking().catch(() => {});
          realtimeManager.leaveRoom(matchmakingModal.gameId);
          setMatchmakingModal(prev => ({ ...prev, isOpen: false }));
        }}
        onLaunchOnlineGame={handleLaunchOnlineGame}
        onLaunchAiGame={() => {
          setMatchmakingModal(prev => ({ ...prev, isOpen: false }));
          handleNavigate(matchmakingModal.gameId, 'VS_COMPUTER');
        }}
        onProfileUpdated={(updated) => setProfile({ ...updated })}
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
        profile={profile}
        onSettingsSaved={(newSettings) => setSettings(newSettings)}
      />

      {/* Global Leaderboard Modal / Route (Top 50 Grandmasters) */}
      <GlobalLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={handleCloseModals}
        currentUserProfile={profile}
      />

      {/* Verified Email Welcome Celebration Modal (Sound, Confetti, Rewards) */}
      <WelcomeCelebrationModal
        isOpen={isWelcomeCelebrationOpen}
        profile={profile}
        onClose={() => setIsWelcomeCelebrationOpen(false)}
        onStartQuickMatch={handleStartQuickMatch}
      />

      {/* Verification Loading State Overlay */}
      {isVerifyingAuth && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(9, 9, 11, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#18181B',
            border: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <RefreshCw size={22} className="animate-spin text-blue-500" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: '700',
              color: '#FAFAFA',
              margin: '0 0 4px 0'
            }}>
              Authenticating session...
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: '#A1A1AA',
              margin: 0
            }}>
              Verifying credentials and syncing profile
            </p>
          </div>
        </div>
      )}

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

