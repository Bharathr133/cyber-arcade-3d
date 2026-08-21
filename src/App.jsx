import React, { useState, useEffect, useRef } from 'react';

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
import { ShieldCheck, RefreshCw } from 'lucide-react';


import BroadcastBanner from './components/BroadcastBanner.jsx';
import ExitMatchConfirmModal from './components/ExitMatchConfirmModal.jsx';
import ArcadeRollingLoader from './components/ArcadeRollingLoader.jsx';
import GuestNamePromptModal from './components/GuestNamePromptModal.jsx';
import LocalPlayersSetupModal from './components/LocalPlayersSetupModal.jsx';
import GameModeSelectionHub from './components/GameModeSelectionHub.jsx';
import GameRulesModal from './components/GameRulesModal.jsx';
import AboutPlatformModal from './components/AboutPlatformModal.jsx';
import ContactFeedbackModal from './components/ContactFeedbackModal.jsx';
import FairPlayEloModal from './components/FairPlayEloModal.jsx';
import PrivacyTermsModal from './components/PrivacyTermsModal.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import FairPlayPage from './pages/FairPlayPage.jsx';
import PrivacyTermsPage from './pages/PrivacyTermsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';



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

// Route Metadata for High-Intent Dynamic Google SEO Titles & Descriptions
const ROUTE_META = {
  home: {
    title: 'games4u — Free Online Games, 2-Player, 4-Player & Solo Board Games',
    desc: 'Play free online games on games4u: Connect 4, Tic-Tac-Toe, Gomoku, Memory Match, and Ludo. 2-player, 4-player, and solo vs smart AI. Instant play in any browser with no download.',
    keywords: 'online free games, free online games, 2 player games, 4 player games, solo games, connect 4 online, tic tac toe 2 player, ludo online, gomoku 15x15, memory match, browser games unblocked, play games with friends online'
  },
  gomoku: {
    title: 'Gomoku Online (15×15 Five in a Row) — 2-Player & Solo Strategy Game | games4u',
    desc: 'Play 15×15 Gomoku (Five in a Row) online for free. Battle real players worldwide or practice vs Grandmaster AI bot. Free instant browser strategy game with zero downloads.',
    keywords: 'gomoku online, five in a row online, 15x15 gomoku, 2 player gomoku, play gomoku free, gomoku multiplayer, online board games'
  },
  connect4: {
    title: 'Connect 4 Online (7×6 Gravity Grid) — 2-Player Free Board Game | games4u',
    desc: 'Play Connect 4 multiplayer online for free. Real-time 2-player matchmaking, private 6-letter room codes with friends, or solo play vs smart AI bot.',
    keywords: 'connect 4 online, connect four 2 player, free connect 4, play connect 4 with friends, 2 player board games online, connect 4 unblocked'
  },
  tictactoe: {
    title: 'Tic-Tac-Toe Online (3×3 Blitz) — 2-Player Multiplayer & AI Game | games4u',
    desc: 'Play free 2-player Tic-Tac-Toe online in real time. Invite friends with private codes or challenge the impossible AI engine. Zero lag, instant play.',
    keywords: 'tic tac toe online, tic tac toe 2 player, free tic tac toe, 3x3 tic tac toe multiplayer, play tic tac toe with friends'
  },
  memory: {
    title: 'Memory Match Online — Solo Campaign & 2-Player Brain Game | games4u',
    desc: 'Train your brain with free Memory Match game. 5 progressive campaign levels, combo score streaks, and 2-player pass & play modes. 100% free.',
    keywords: 'memory match online, memory card games, brain training games, free memory games, solo memory game, 2 player memory game'
  },
  ludo: {
    title: 'Ludo Championship (2–4 Player Online & Solo) — Free Board Game | games4u',
    desc: 'Play 2-player, 3-player, and 4-player Ludo online for free. Real-time multiplayer, safe star zones, 3D animated dice, and smart AI bot matches.',
    keywords: 'ludo online, ludo 2 player, ludo 4 player, play ludo with friends online, free ludo game, ludo multiplayer, online board games ludo'
  },
  leaderboard: {
    title: 'Global Top 50 Leaderboard & ELO Rankings — games4u',
    desc: 'View live global Grandmaster rankings, player ratings, and win rates across Connect 4, Tic-Tac-Toe, Gomoku, Memory, and Ludo.',
    keywords: 'game leaderboards, global elo rankings, grandmaster players, top board game players'
  },
  rules: {
    title: 'How to Play & Game Rules Guide — Strategy Tactics | games4u',
    desc: 'Learn winning tactics and complete official rules for Connect 4, Tic-Tac-Toe, Gomoku, Memory Match, and Ludo Championship.',
    keywords: 'how to play connect 4, gomoku rules, ludo rules, tic tac toe strategy, board game guides'
  },
  about: {
    title: 'About games4u — Free 2-Player & 4-Player Strategy Board Game Platform',
    desc: 'Discover games4u: The free browser-based strategy arena built for players worldwide with zero downloads, zero ads, and instant multiplayer.',
    keywords: 'about games4u, free gaming platform, online browser games, indie board games'
  },
  contact: {
    title: 'Contact & Feedback Center — Support & Bug Reports | games4u',
    desc: 'Contact the games4u development team. Submit feedback, bug reports, feature suggestions, or reach out directly.',
    keywords: 'contact games4u, game support, submit game feedback'
  },
  fairplay: {
    title: 'Fair Play & Certified ELO Rating System — Anti-Cheat Arena | games4u',
    desc: 'Certified ELO matchmaking system and fair play anti-cheat protection on games4u.',
    keywords: 'fair play gaming, elo rating system, anti-cheat board games'
  },
  privacy: {
    title: 'Privacy Policy & Terms of Service — games4u',
    desc: 'Read the games4u Privacy Policy and Terms of Service. 100% transparent data practices, zero tracker sales, and player privacy rights.',
    keywords: 'privacy policy, terms of service, player data privacy'
  },
  admin: {
    title: 'Platform Operations Backoffice — games4u',
    desc: 'Platform administration, player directory, live arenas, and anti-cheat operations.',
    keywords: 'admin console, platform backoffice'
  }
};




function MainApp() {
  const alert = useCustomAlert();

  const getRouteFromUrl = () => {
    try {
      const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase() : '';
      const hash = typeof window !== 'undefined' ? (window.location.hash || '') : '';
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const gameParam = params.get('game');
      const pageParam = params.get('page');
      const joinParam = params.get('join');

      // Check for password recovery deep link
      if (hash.includes('type=recovery') || params.get('type') === 'recovery' || pageParam === 'reset' || pageParam === 'recovery' || pathname === 'reset') {
        return { gameId: 'home', page: 'reset' };
      }

      // Check clean pathnames directly (e.g. /rules, /leaderboard, /about, /contact, /fair-play, /privacy, /connect4)
      if (pathname === 'rules' || pathname === 'how-to-play' || pathname === 'howtoplay') {
        return { gameId: 'home', page: 'rules' };
      }
      if (pathname === 'leaderboard' || pathname === 'rankings') {
        return { gameId: 'home', page: 'leaderboard' };
      }
      if (pathname === 'about') {
        return { gameId: 'home', page: 'about' };
      }
      if (pathname === 'contact' || pathname === 'feedback') {
        return { gameId: 'home', page: 'contact' };
      }
      if (pathname === 'fair-play' || pathname === 'fairplay' || pathname === 'elo') {
        return { gameId: 'home', page: 'fairplay' };
      }
      if (pathname === 'privacy' || pathname === 'terms' || pathname === 'legal') {
        return { gameId: 'home', page: 'privacy' };
      }
      if (pathname === 'profile') {
        return { gameId: 'home', page: 'profile' };
      }
      if (pathname === 'admin') {
        return { gameId: 'home', page: 'admin' };
      }
      if (pathname === 'login' || pathname === 'signin') {
        return { gameId: 'home', page: 'login' };
      }
      if (pathname === 'signup' || pathname === 'register') {
        return { gameId: 'home', page: 'signup' };
      }

      // Clean game pathnames (e.g. /connect4, /tictactoe, /gomoku, /memory, /ludo, /play/connect4)
      const cleanGamePath = pathname.replace(/^play\//, '');
      if (['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'].includes(cleanGamePath)) {
        return { gameId: cleanGamePath, page: null };
      }

      // Query param fallbacks
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
      const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      const joinParam = params.get('join');

      if (joinParam || modeParam === 'online' || pathname.includes('/online')) return 'ONLINE_MATCH';
      if (modeParam === 'local' || pathname.includes('/local')) return 'LOCAL_2P';
      if (modeParam === 'campaign' || pathname.includes('/campaign')) return 'SOLO_LEVELS';
      if (modeParam === 'lobby' || pathname.includes('/lobby')) return 'LOBBY';
    } catch (e) {}
    return 'LOBBY';
  };


  const initialRoute = getRouteFromUrl();
  const [activeGameId, setActiveGameId] = useState(initialRoute.gameId);
  const [activeGameMode, setActiveGameMode] = useState(getModeFromUrl);
  const [activePage, setActivePage] = useState(initialRoute.page);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(initialRoute.page === 'settings');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(initialRoute.page === 'rules');
  const [rulesActiveGameId, setRulesActiveGameId] = useState('connect4');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(initialRoute.page === 'about');
  const [isContactModalOpen, setIsContactModalOpen] = useState(initialRoute.page === 'contact');
  const [isFairPlayModalOpen, setIsFairPlayModalOpen] = useState(initialRoute.page === 'fairplay');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(initialRoute.page === 'privacy' || initialRoute.page === 'terms');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(initialRoute.page === 'leaderboard');
  const [isMuted, setIsMuted] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isWelcomeCelebrationOpen, setIsWelcomeCelebrationOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isCurrentMatchFinished, setIsCurrentMatchFinished] = useState(false);
  const [gameLaunchLoading, setGameLaunchLoading] = useState(null);
  const [isGuestNamePromptOpen, setIsGuestNamePromptOpen] = useState(() => {
    const prof = getUserProfile();
    const isGameRoute = initialRoute.gameId && initialRoute.gameId !== 'home';
    const isGuestWithoutName = (!prof?.hasCustomName || !prof?.name) && !prof?.email;
    return Boolean(isGameRoute && isGuestWithoutName);
  });
  const pendingGuestActionRef = useRef(null);


  const [pendingAction, setPendingAction] = useState(null);


  const [localPlayersModal, setLocalPlayersModal] = useState({ isOpen: false, gameId: 'connect4', gameTitle: 'Connect 4' });
  const [localPlayerNames, setLocalPlayerNames] = useState(() => {
    try {
      const s = sessionStorage.getItem('arcade_local_players');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });




  const [isVerifyingAuth, setIsVerifyingAuth] = useState(() => {
    try {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      // Don't show full-screen verification blocker for password recovery - show reset screen instead
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        return false;
      }
      return hash.includes('access_token') || 
             hash.includes('type=signup') || 
             hash.includes('type=email_confirmation') || 
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

    const unsubscribeAuth = authService.setupAuthListener((verifiedProfile, event) => {
      setProfile({ ...verifiedProfile });

      const hash = typeof window !== 'undefined' ? (window.location.hash || '') : '';
      const isRecovery = event === 'PASSWORD_RECOVERY' || hash.includes('type=recovery');

      if (isRecovery) {
        setIsVerifyingAuth(false);
        setActivePage('reset');
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) {}
        return;
      }

      if (isFromVerification || hash.includes('access_token') || window.location.search.includes('code=')) {
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
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Automatically scroll to the very top whenever navigating to any page or game
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainEl = document.querySelector('.app-main-content');
      if (mainEl) mainEl.scrollTop = 0;
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [activePage, activeGameId, activeGameMode]);

  // Synchronize document title, meta tags, and OpenGraph with active route for Google SEO
  useEffect(() => {
    let key = 'home';
    if (activePage && ROUTE_META[activePage]) key = activePage;
    else if (activeGameId && activeGameId !== 'home' && ROUTE_META[activeGameId]) key = activeGameId;
    else if (isLeaderboardOpen) key = 'leaderboard';
    else if (isSettingsOpen) key = 'rules';

    const meta = ROUTE_META[key] || ROUTE_META.home;
    document.title = meta.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', meta.desc);

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && meta.keywords) metaKeywords.setAttribute('content', meta.keywords);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.desc);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', meta.title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', meta.desc);
  }, [activePage, activeGameId, isLeaderboardOpen, isSettingsOpen]);



  // Helper to ensure player has entered their real GamerTag before entering any game or match
  const checkGuestNameBeforeAction = (actionCallback) => {
    const currentProf = getUserProfile();
    const isGuestWithoutName = (!currentProf?.hasCustomName || !currentProf?.name) && !currentProf?.email;
    if (isGuestWithoutName) {
      pendingGuestActionRef.current = actionCallback;
      setIsGuestNamePromptOpen(true);
      return false;
    }
    return true;
  };

  const handleGuestNameSaved = (updatedProfile) => {
    setProfile(updatedProfile);
    setIsGuestNamePromptOpen(false);
    const action = pendingGuestActionRef.current;
    pendingGuestActionRef.current = null;
    if (action && typeof action === 'function') {
      // Immediately execute the chosen game & option seamlessly
      setTimeout(() => {
        action(updatedProfile);
      }, 30);
    }
  };

  const handleCloseGuestPrompt = () => {
    setIsGuestNamePromptOpen(false);
    pendingGuestActionRef.current = null;
    // If currently on a game page without a valid name, return to home arena
    const currentProf = getUserProfile();
    if ((!currentProf?.hasCustomName || !currentProf?.name) && !currentProf?.email) {
      if (activeGameId && activeGameId !== 'home') {
        executeNavigate('home');
      }
    }
  };

  const handleLocalPlayersConfirmed = (playerData) => {
    setLocalPlayerNames(playerData);
    setLocalPlayersModal(prev => ({ ...prev, isOpen: false }));
    executeNavigate(localPlayersModal.gameId, localPlayersModal.mode || 'LOCAL_2P');
  };

  // Navigate to dedicated game page with chosen mode & clean URL update
  const handleNavigate = (gameId, mode = 'LOBBY') => {
    if (gameId !== 'home') {
      const allowed = checkGuestNameBeforeAction(() => handleNavigate(gameId, mode));
      if (!allowed) return;
    }


    // If starting a local 2P or 4P match without custom names, open local setup modal
    if ((mode === 'LOCAL_2P' || mode === 'LOCAL_4P') && gameId !== 'home') {
      if (!localPlayerNames?.p2) {
        const titles = { connect4: 'Connect 4', tictactoe: 'Tic-Tac-Toe', gomoku: 'Gomoku', memory: 'Memory Match', ludo: 'Ludo Championship' };
        setLocalPlayersModal({
          isOpen: true,
          gameId,
          gameTitle: titles[gameId] || '2-Player Local',
          mode
        });
        return;
      }
    }

    // If currently inside an active ongoing game (match NOT finished) and trying to exit or switch game, ask confirmation
    if (activeGameId && activeGameId !== 'home' && gameId !== activeGameId && !isCurrentMatchFinished) {
      setPendingAction({ type: 'NAVIGATE', gameId, mode });
      setIsExitConfirmOpen(true);
      return;
    }
    executeNavigate(gameId, mode);
  };


  const executeNavigate = (gameId, mode = 'LOBBY') => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {}

    const titles = { connect4: 'Connect 4', tictactoe: 'Tic-Tac-Toe', gomoku: 'Gomoku', memory: 'Memory Match', ludo: 'Ludo Championship' };

    if (gameId !== 'home') {
      setGameLaunchLoading({
        message: `Loading ${titles[gameId] || 'Arena'}...`,
        submessage: mode === 'ONLINE_MATCH' ? 'Connecting to real-time multiplayer' : mode === 'LOCAL_2P' || mode === 'LOCAL_4P' ? 'Setting up pass & play board' : mode === 'LOBBY' ? 'Opening game options & settings' : 'Initializing AI Grandmaster engine'
      });
      setTimeout(() => {
        setGameLaunchLoading(null);
      }, 450);
    } else {
      setGameLaunchLoading(null);
    }

    setActiveGameId(gameId);
    setActiveGameMode(mode);
    setIsCurrentMatchFinished(false);
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
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${gameId}`);
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
    const allowed = checkGuestNameBeforeAction(() => handleStartQuickMatch(gameId, gameTitle));
    if (!allowed) return;

    setMatchmakingModal({
      isOpen: true,
      mode: 'QUICK_MATCH',
      gameId,
      gameTitle: gameTitle || 'Matchmaking'
    });
  };

  const handleCreatePrivateRoom = (gameId, gameTitle) => {
    const allowed = checkGuestNameBeforeAction(() => handleCreatePrivateRoom(gameId, gameTitle));
    if (!allowed) return;

    setMatchmakingModal({
      isOpen: true,
      mode: 'CREATE_PRIVATE',
      gameId,
      gameTitle: gameTitle || 'Private Room'
    });
  };

  const handleJoinPrivateRoom = (gameId = 'connect4', roomCode = null) => {
    const allowed = checkGuestNameBeforeAction(() => handleJoinPrivateRoom(gameId, roomCode));
    if (!allowed) return;

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
    // Only Match Settings remains a quick modal
    if (pageName === 'settings') {
      setIsSettingsOpen(true);
      return;
    }

    // Only show exit confirmation if user is actively in the middle of an unfinished gameplay match
    if (activeGameId && activeGameId !== 'home' && activeGameMode !== 'LOBBY' && pageName && !isCurrentMatchFinished) {
      setPendingAction({ type: 'PAGE', pageName });
      setIsExitConfirmOpen(true);
      return;
    }
    executeOpenPage(pageName);
  };



  const executeOpenPage = (pageName) => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {}

    setActivePage(pageName);
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
    setIsRulesModalOpen(false);
    setIsAboutModalOpen(false);
    setIsContactModalOpen(false);
    setIsFairPlayModalOpen(false);
    setIsPrivacyModalOpen(false);
    setIsLeaderboardOpen(false);


    if (pageName) {
      setActiveGameId('home');
      const slugMap = {
        rules: '/rules',
        howtoplay: '/rules',
        leaderboard: '/leaderboard',
        about: '/about',
        contact: '/contact',
        feedback: '/contact',
        fairplay: '/fair-play',
        elo: '/fair-play',
        privacy: '/privacy',
        terms: '/privacy',
        profile: '/profile',
        admin: '/admin',
        login: '/login',
        signup: '/signup',
        reset: '/reset'
      };
      const cleanUrl = slugMap[pageName] || `/${pageName}`;
      window.history.pushState({}, '', cleanUrl);
    } else {
      setActiveGameId('home');
      window.history.pushState({}, '', '/');
    }
  };


  // Exit Match Confirmation Handlers
  const handleConfirmExitMatch = () => {
    setIsExitConfirmOpen(false);
    if (pendingAction) {
      if (pendingAction.type === 'NAVIGATE') {
        executeNavigate(pendingAction.gameId, pendingAction.mode);
      } else if (pendingAction.type === 'PAGE') {
        executeOpenPage(pendingAction.pageName);
      }
      setPendingAction(null);
    } else {
      executeNavigate('home', 'VS_COMPUTER');
    }
  };

  const handleCancelExitMatch = () => {
    setIsExitConfirmOpen(false);
    setPendingAction(null);
  };

  // Close modals / return to game lobby
  const handleCloseModals = () => {
    setIsLeaderboardOpen(false);
    setIsSettingsOpen(false);
    setIsProfileOpen(false);
    setIsRulesModalOpen(false);
    setIsAboutModalOpen(false);
    setIsContactModalOpen(false);
    setIsFairPlayModalOpen(false);
    setIsPrivacyModalOpen(false);
    setActivePage(null);

    if (activeGameId && activeGameId !== 'home') {
      window.history.pushState({}, '', `/${activeGameId}`);
    } else {
      window.history.pushState({}, '', '/');
    }

  };




  const getActiveMobileTab = () => {
    if (activePage === 'profile' || isProfileOpen) return 'profile';
    if (activePage === 'leaderboard' || isLeaderboardOpen) return 'leaderboard';
    if (activePage === 'rules' || activePage === 'settings' || isSettingsOpen) return 'rules';
    if (matchmakingModal.isOpen && matchmakingModal.mode === 'JOIN_PRIVATE') return 'join';
    return 'home';
  };

  const handleMobileTabSelect = (tabId) => {
    if (tabId === 'home') {
      handleCloseModals();
      if (activeGameId !== 'home') {
        handleNavigate('home');
      }
    } else if (tabId === 'join') {
      handleJoinPrivateRoom('connect4');
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
  const handleMatchFinished = (gameKey, outcome, opponentName = '') => {
    setIsCurrentMatchFinished(true);
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

    if (activePage === 'forgot' || activePage === 'forgot_password') {
      return (
        <AuthPage
          initialMode="forgot"
          profile={profile}
          onProfileUpdated={(up) => setProfile(up)}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'reset' || activePage === 'reset_password' || activePage === 'recovery') {
      return (
        <AuthPage
          initialMode="reset"
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

    if (activePage === 'rules' || activePage === 'howtoplay') {
      return (
        <RulesPage
          initialGameId={rulesActiveGameId}
          onBackToHome={() => handleOpenPage(null)}
          onLaunchGame={(gId) => handleNavigate(gId, 'LOBBY')}
        />
      );
    }

    if (activePage === 'leaderboard') {
      return (
        <LeaderboardPage
          currentUserProfile={profile}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'about') {
      return (
        <AboutPage
          onBackToHome={() => handleOpenPage(null)}
          onExploreGames={() => handleNavigate('home')}
        />
      );
    }

    if (activePage === 'contact' || activePage === 'feedback') {
      return (
        <ContactPage
          currentUserProfile={profile}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'fairplay' || activePage === 'elo') {
      return (
        <FairPlayPage
          currentUserProfile={profile}
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }

    if (activePage === 'privacy' || activePage === 'terms' || activePage === 'legal') {
      return (
        <PrivacyTermsPage
          onBackToHome={() => handleOpenPage(null)}
        />
      );
    }




    if (activeGameMode === 'LOBBY' && activeGameId && activeGameId !== 'home') {
      return (
        <div className="animate-pop-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <GameModeSelectionHub
            gameId={activeGameId}
            profile={profile}
            settings={settings}
            onStartMode={(m, cfg) => {
              if (cfg?.localPlayers) {
                setLocalPlayerNames(cfg.localPlayers);
              }
              executeNavigate(activeGameId, m);
            }}
            onStartQuickMatch={handleStartQuickMatch}
            onCreatePrivateRoom={handleCreatePrivateRoom}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onGoBack={() => handleNavigate('home')}

          />
        </div>
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
              localPlayerNames={localPlayerNames}
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
              localPlayerNames={localPlayerNames}
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
              localPlayerNames={localPlayerNames}
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
              localPlayerNames={localPlayerNames}
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
              localPlayerNames={localPlayerNames}
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
  const isAuthPage = activePage === 'login' || 
                     activePage === 'signup' || 
                     activePage === 'forgot' || 
                     activePage === 'reset' || 
                     activePage === 'signin' || 
                     activePage === 'register' || 
                     activePage === 'recovery' || 
                     activePage === 'reset_password' || 
                     activePage === 'forgot_password';

  return (
    <div className="app-layout-wrapper" style={{
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'row',
      background: '#F8FAFC',
      color: '#0F172A',
      boxSizing: 'border-box'
    }}>


      {/* Full-Height Desktop Navigation Sidebar (Hidden during active match play or on Auth pages) */}
      {!isInsideGame && !isAuthPage && (
        <DesktopAppSidebar
          isExpanded={isSidebarExpanded}
          onToggleExpand={() => setIsSidebarExpanded(prev => !prev)}
          activeGameId={activeGameId}
          activePage={activePage}
          profile={profile}
          onSelectGame={handleNavigate}
          onStartQuickMatch={handleStartQuickMatch}
          onOpenProfile={() => handleOpenPage('profile')}
          onOpenSettings={() => handleOpenPage('settings')}
          onOpenRules={() => handleOpenPage('rules')}
          onOpenLeaderboard={() => handleOpenPage('leaderboard')}
          onOpenAdmin={() => handleOpenPage('admin')}
          onLogout={handleLogout}
          onNavigateToAuth={(m) => handleOpenPage(m)}
          onJoinPrivateRoom={handleJoinPrivateRoom}
        />

      )}

      {/* Main Content Area (100% full-width during games and on auth pages) */}
      <div 
        className={`app-main-content ${isInsideGame || isAuthPage ? 'in-game-fullscreen' : (isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed')}`}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: isAuthPage ? 'center' : 'flex-start',
          padding: 0,
          boxSizing: 'border-box',
          transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >

        {/* Global Platform Broadcast Announcement Banner (Hidden during match play, in Admin, or on Auth pages) */}
        {!isAuthPage && <BroadcastBanner isInsideGame={isInsideGame} isInsideAdmin={activePage === 'admin'} />}

        {/* Enterprise Header with Exit Hub & Live Players Counter (Hidden on Auth pages) */}
        {!isAuthPage && (
          <>
            <EnterpriseHeader
              activeGameId={activeGameId}
              activePage={activePage}
              isSidebarExpanded={isSidebarExpanded}
              onSelectGame={handleNavigate}
              onOpenProfile={() => handleOpenPage('profile')}
              onOpenSettings={() => handleOpenPage('settings')}
              onOpenRules={() => handleOpenPage('rules')}
              onOpenLeaderboard={() => handleOpenPage('leaderboard')}
              onOpenAdmin={() => handleOpenPage('admin')}
              onJoinPrivateRoom={handleJoinPrivateRoom}
              onLogout={handleLogout}
              onNavigateToAuth={(m) => handleOpenPage(m)}
              profile={profile}
              isMuted={isMuted}
              onToggleSound={toggleSound}
            />
            {/* Fixed Header Height Spacer to guarantee zero overlap */}
            <div style={{ height: isInsideGame ? '54px' : '60px', flexShrink: 0 }} />
          </>
        )}


        {/* Dedicated Page Viewport */}
        <main style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          flex: 1,
          padding: isAuthPage ? '0' : (isInsideGame ? '0 clamp(8px, 2vw, 20px) 16px' : '0 clamp(12px, 2.5vw, 28px) 24px'),
          boxSizing: 'border-box'
        }}>
          {renderActiveView()}
        </main>


        {/* Standard Enterprise 4-Column Footer (Hidden on Auth pages and in games) */}
        {!isInsideGame && !isAuthPage ? (
          <EnterpriseFooter
            onSelectGame={(gId) => handleNavigate(gId, 'LOBBY')}
            onOpenRules={(gId) => {
              setRulesActiveGameId(gId || 'connect4');
              handleOpenPage('rules');
            }}
            onOpenLeaderboard={() => handleOpenPage('leaderboard')}
            onOpenAbout={() => handleOpenPage('about')}
            onOpenContact={() => handleOpenPage('contact')}
            onOpenFairPlay={() => handleOpenPage('fairplay')}
            onOpenPrivacy={() => handleOpenPage('privacy')}
          />

        ) : isInsideGame ? (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: '#94a3b8',
            paddingTop: '2px',
            textAlign: 'center'
          }}>
            games4u • Realtime Strategy Arena
          </div>
        ) : null}

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

      {/* Match Settings Modal / Route (Per-Game Isolated Settings) */}
      <MatchSettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseModals}
        activeGameId={activeGameId}
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

      {/* Verification Loading State Overlay with Smooth Arcade Game Icons */}
      {isVerifyingAuth && (
        <ArcadeRollingLoader
          isOverlay={true}
          message="Authenticating session..."
          submessage="Verifying credentials & syncing ELO ratings"
        />
      )}

      {/* Game Launch Transition Rolling Loader Overlay */}
      {gameLaunchLoading && (
        <ArcadeRollingLoader
          isOverlay={true}
          message={gameLaunchLoading.message}
          submessage={gameLaunchLoading.submessage}
        />
      )}

      {/* Interactive How to Play Rules Modal (All 5 Games) */}
      <GameRulesModal
        isOpen={isRulesModalOpen}
        initialGameId={rulesActiveGameId}
        onClose={handleCloseModals}
        onSelectGameToPlay={(gId) => handleNavigate(gId, 'LOBBY')}
      />


      {/* About Platform & Developer Modal */}
      <AboutPlatformModal
        isOpen={isAboutModalOpen}
        onClose={handleCloseModals}
        onExploreGames={() => handleNavigate('home')}
      />

      {/* Contact & Feedback Modal */}
      <ContactFeedbackModal
        isOpen={isContactModalOpen}
        onClose={handleCloseModals}
        currentUserProfile={profile}
      />

      {/* Fair Play & ELO System Guide Modal */}
      <FairPlayEloModal
        isOpen={isFairPlayModalOpen}
        onClose={handleCloseModals}
        currentUserProfile={profile}
      />

      {/* Privacy Policy & Terms Modal */}
      <PrivacyTermsModal
        isOpen={isPrivacyModalOpen}
        onClose={handleCloseModals}
      />

      {/* Exit Match Confirmation Dialog (Prevents Accidental Misclicks/Forfeits) */}
      <ExitMatchConfirmModal
        isOpen={isExitConfirmOpen}
        isOnline={Boolean(activeOnlineSession)}
        onConfirmExit={handleConfirmExitMatch}
        onCancel={handleCancelExitMatch}
      />


      {/* Mandatory Real GamerTag Onboarding Modal */}
      <GuestNamePromptModal
        isOpen={isGuestNamePromptOpen}
        onClose={handleCloseGuestPrompt}
        currentUserProfile={profile}
        onNameSaved={handleGuestNameSaved}
      />


      {/* Local 2-Player & Multiplayer Real Names Setup Modal */}
      <LocalPlayersSetupModal
        isOpen={localPlayersModal.isOpen}
        gameId={localPlayersModal.gameId}
        gameTitle={localPlayersModal.gameTitle}
        currentUserProfile={profile}
        onClose={() => setLocalPlayersModal(prev => ({ ...prev, isOpen: false }))}
        onStartMatch={handleLocalPlayersConfirmed}
      />



      {/* Mobile Bottom Navigation Bar (Dock - Hidden during games or on Auth pages) */}
      {!isInsideGame && !isAuthPage && (
        <MobileBottomNav
          activeTab={getActiveMobileTab()}
          onSelectTab={handleMobileTabSelect}
          isInsideGame={isInsideGame}
        />
      )}
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

