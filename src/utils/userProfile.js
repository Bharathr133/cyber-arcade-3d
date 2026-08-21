// Enterprise User Profile & Per-Game Rating Management with Security Validation
import { securityEngine } from './securityEngine.js';
import { cloudSync } from './cloudSync.js';

const PROFILE_STORAGE_KEY = 'championship_user_profile';

export const AVATARS = [
  { id: '1', name: 'Commander', color: '#1e3a8a', bg: '#eff6ff' }, // Deep Oxford Navy
  { id: '2', name: 'Obsidian', color: '#0f172a', bg: '#f1f5f9' },  // Slate Charcoal
  { id: '3', name: 'Crimson', color: '#991b1b', bg: '#fef2f2' },   // Crimson Wine
  { id: '4', name: 'Forest', color: '#065f46', bg: '#ecfdf5' },    // Deep Forest
  { id: '5', name: 'Amber', color: '#92400e', bg: '#fffbeb' },     // Antique Amber
  { id: '6', name: 'Amethyst', color: '#581c87', bg: '#faf5ff' },  // Royal Purple
  { id: '7', name: 'Titanium', color: '#334155', bg: '#f8fafc' },  // Steel Titanium
  { id: '8', name: 'Rust', color: '#9a3412', bg: '#fff7ed' }       // Industrial Rust
];

export const getTier = (rating, totalMatches = null) => {
  if (totalMatches === 0) {
    return { name: 'Unranked', color: '#64748b', badge: 'PROV' };
  }
  const safeRating = Number.isFinite(rating) ? rating : 1200;
  if (safeRating >= 2000) return { name: 'Grandmaster', color: '#991b1b', badge: 'GM' };
  if (safeRating >= 1700) return { name: 'Master', color: '#581c87', badge: 'MASTER' };
  if (safeRating >= 1400) return { name: 'Diamond', color: '#0369a1', badge: 'DIAMOND' };
  if (safeRating >= 1200) return { name: 'Gold', color: '#92400e', badge: 'GOLD' };
  if (safeRating >= 1000) return { name: 'Silver', color: '#475569', badge: 'SILVER' };
  return { name: 'Bronze', color: '#78350f', badge: 'BRONZE' };
};

const DEFAULT_GAME_STATS = {
  gomoku: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
  connect4: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
  tictactoe: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
  memory: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
  ludo: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 }
};

export function generateDynamicGamerTag(idSuffix = '') {
  const titles = ['Grandmaster', 'Champion', 'Tactician', 'Strategist', 'Apex', 'Vanguard', 'Knight', 'Ace', 'Shadow', 'Striker'];
  const title = titles[Math.floor(Math.random() * titles.length)];
  const num = idSuffix ? idSuffix.replace(/\D/g, '').slice(-3) || Math.floor(100 + Math.random() * 900) : Math.floor(100 + Math.random() * 900);
  return `${title}_${num}`;
}

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = securityEngine.safeJsonParse(raw, null);
    
    if (parsed) {
      const generatedDefault = parsed.id ? `Player_${parsed.id.replace(/\D/g, '').slice(-4) || '77'}` : 'Player_77';
      const cleanName = parsed.name || parsed.display_name || parsed.username || generatedDefault;
      const { sanitizedName } = securityEngine.validatePlayerName(cleanName);

      const gameStats = {
        gomoku: { ...DEFAULT_GAME_STATS.gomoku, ...(parsed.gameStats?.gomoku || {}) },
        connect4: { ...DEFAULT_GAME_STATS.connect4, ...(parsed.gameStats?.connect4 || {}) },
        tictactoe: { ...DEFAULT_GAME_STATS.tictactoe, ...(parsed.gameStats?.tictactoe || {}) },
        memory: { ...DEFAULT_GAME_STATS.memory, ...(parsed.gameStats?.memory || {}) },
        ludo: { ...DEFAULT_GAME_STATS.ludo, ...(parsed.gameStats?.ludo || {}) }
      };

      const wins = Math.max(0, Number(parsed.wins) || 0);
      const losses = Math.max(0, Number(parsed.losses) || 0);
      const draws = Math.max(0, Number(parsed.draws) || 0);
      const totalMatches = wins + losses + draws;

      return {
        id: securityEngine.sanitizeText(parsed.id || 'guest_' + generateUUID().substring(0, 8), 36),
        name: sanitizedName,
        gamertag: parsed.gamertag || sanitizedName,
        avatarId: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(parsed.avatarId) ? parsed.avatarId : '1',
        level: Math.max(1, Math.min(100, Number(parsed.level) || 1)),
        xp: Math.max(0, Math.min(100000, Number(parsed.xp) || 0)),
        rating: Math.max(100, Math.min(3000, Number(parsed.rating) || 1200)),
        wins,
        losses,
        draws,
        totalMatches,
        dailyStreak: totalMatches > 0 ? Math.max(0, Number(parsed.dailyStreak) || 0) : 0,
        lastStreakDate: parsed.lastStreakDate || null,
        isGuest: parsed.isGuest !== false,
        hasCustomName: !!parsed.hasCustomName,
        isNewUser: parsed.isNewUser === true,
        authProvider: parsed.authProvider || (parsed.email ? 'email' : 'guest'),
        gameStats,
        history: Array.isArray(parsed.history) ? parsed.history.slice(0, 20) : [],
        isRegistered: !parsed.isGuest && !!(parsed.email || parsed.gamertag)
      };
    }

    // Default clean guest profile for brand new visitors
    const defaultAvatarId = '1';
    const defaultId = 'guest_' + generateUUID().substring(0, 8);
    const initialGamerTag = generateDynamicGamerTag(defaultId);
    const defaultProfile = {
      id: defaultId,
      name: initialGamerTag,
      gamertag: initialGamerTag,
      avatarId: defaultAvatarId,
      level: 1,
      xp: 0,
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      totalMatches: 0,
      dailyStreak: 0,
      lastStreakDate: null,
      isGuest: true,
      hasCustomName: false,
      isNewUser: true,
      authProvider: 'guest',
      gameStats: { ...DEFAULT_GAME_STATS },
      history: [],
      isRegistered: false
    };

    saveUserProfile(defaultProfile);
    return defaultProfile;
  } catch (e) {

    const fallbackTag = generateDynamicGamerTag();
    return {
      id: 'guest_' + generateUUID().substring(0, 8),
      name: fallbackTag,
      gamertag: fallbackTag,
      avatarId: '1',
      level: 1,
      xp: 0,

      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      totalMatches: 0,
      dailyStreak: 0,
      lastStreakDate: null,
      isGuest: true,
      hasCustomName: false,
      isNewUser: true,

      authProvider: 'guest',
      gameStats: { ...DEFAULT_GAME_STATS },
      history: [],
      isRegistered: false
    };
  }
}

export function saveUserProfile(updated) {
  try {
    const { sanitizedName } = securityEngine.validatePlayerName(updated.name || '');


    const gameStats = {
      gomoku: { ...DEFAULT_GAME_STATS.gomoku, ...(updated.gameStats?.gomoku || {}) },
      connect4: { ...DEFAULT_GAME_STATS.connect4, ...(updated.gameStats?.connect4 || {}) },
      tictactoe: { ...DEFAULT_GAME_STATS.tictactoe, ...(updated.gameStats?.tictactoe || {}) },
      memory: { ...DEFAULT_GAME_STATS.memory, ...(updated.gameStats?.memory || {}) },
      ludo: { ...DEFAULT_GAME_STATS.ludo, ...(updated.gameStats?.ludo || {}) }
    };

    const safeData = {
      id: securityEngine.sanitizeText(updated.id || `user_${Date.now()}`, 36),
      name: sanitizedName,
      gamertag: updated.gamertag || null,
      email: updated.email || null,
      avatarId: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(updated.avatarId) ? updated.avatarId : '1',
      level: Math.max(1, Math.min(100, Number(updated.level) || 1)),
      xp: Math.max(0, Math.min(100000, Number(updated.xp) || 0)),
      rating: Math.max(100, Math.min(3000, Number(updated.rating) || 1200)),
      wins: Math.max(0, Number(updated.wins) || 0),
      losses: Math.max(0, Number(updated.losses) || 0),
      draws: Math.max(0, Number(updated.draws) || 0),
      dailyStreak: Math.max(0, Number(updated.dailyStreak) || 0),
      lastStreakDate: updated.lastStreakDate || new Date().toISOString().split('T')[0],
      isGuest: updated.isGuest !== false,
      hasCustomName: updated.hasCustomName !== undefined ? !!updated.hasCustomName : true,
      isNewUser: updated.isNewUser === true,
      authProvider: updated.authProvider || (updated.email ? 'email' : 'guest'),
      gameStats,
      history: Array.isArray(updated.history) ? updated.history.slice(0, 20) : [],
      isRegistered: updated.isGuest === false && !!updated.email
    };


    // Attach cryptographic signature
    safeData._sig = securityEngine.generateSignature(safeData);

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(safeData));
    return safeData;
  } catch (e) {
    console.error(e);
  }
}

export function logoutUserProfile() {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
}

// Mathematical Elo Rating Calculator: R_new = R_old + K * (S - E)
export function calculateEloDelta(playerRating, opponentRating = 1200, outcome = 'WIN', kFactor = 32) {
  const pRating = Math.max(100, Number(playerRating) || 1200);
  const oppRating = Math.max(100, Number(opponentRating) || 1200);
  const expectedScore = 1 / (1 + Math.pow(10, (oppRating - pRating) / 400));
  const actualScore = outcome === 'WIN' ? 1 : outcome === 'LOSS' ? 0 : 0.5;
  const rawDelta = Math.round(kFactor * (actualScore - expectedScore));

  if (outcome === 'WIN') {
    return Math.max(14, Math.min(38, rawDelta));
  } else if (outcome === 'LOSS') {
    return Math.min(-8, Math.max(-28, rawDelta));
  } else {
    return Math.max(-5, Math.min(5, rawDelta));
  }
}

export function recordMatchResult(gameKey, outcome, opponentName = 'Computer', opponentRating = 1200) {
  const normalizedKey = gameKey.toLowerCase().includes('gomoku') ? 'gomoku' :
                        gameKey.toLowerCase().includes('connect') ? 'connect4' :
                        gameKey.toLowerCase().includes('memory') ? 'memory' :
                        gameKey.toLowerCase().includes('ludo') ? 'ludo' : 'tictactoe';
  const gameDisplayName = normalizedKey === 'gomoku' ? 'Gomoku (15×15)' :
                          normalizedKey === 'connect4' ? 'Connect 4 (7×6)' :
                          normalizedKey === 'memory' ? 'Memory Match' :
                          normalizedKey === 'ludo' ? 'Ludo Championship' : 'Tic-Tac-Toe (3×3)';

  const profile = getUserProfile() || {
    id: 'guest_' + Math.random().toString(36).substring(2, 10),
    name: 'Guest Player',
    avatarId: '1',
    level: 1,
    xp: 0,
    rating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    dailyStreak: 1,
    lastStreakDate: new Date().toISOString().split('T')[0],
    gameStats: { ...DEFAULT_GAME_STATS },
    history: [],
    isGuest: true,
    isRegistered: false
  };

  const currentRating = profile.gameStats[normalizedKey]?.rating || profile.rating || 1200;
  const ratingDelta = calculateEloDelta(currentRating, opponentRating, outcome);
  let xpGain = 15;

  if (outcome === 'WIN') {
    xpGain = 50;
    profile.wins = (profile.wins || 0) + 1;
    profile.gameStats[normalizedKey].wins = (profile.gameStats[normalizedKey].wins || 0) + 1;
  } else if (outcome === 'LOSS') {
    xpGain = 10;
    profile.losses = (profile.losses || 0) + 1;
    profile.gameStats[normalizedKey].losses = (profile.gameStats[normalizedKey].losses || 0) + 1;
  } else {
    xpGain = 20;
    profile.draws = (profile.draws || 0) + 1;
    profile.gameStats[normalizedKey].draws = (profile.gameStats[normalizedKey].draws || 0) + 1;
  }


  // Dynamic Real Daily Streak Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const lastActiveStr = profile.lastStreakDate || null;
  if (!lastActiveStr) {
    profile.dailyStreak = 1;
    profile.lastStreakDate = todayStr;
  } else if (lastActiveStr !== todayStr) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (lastActiveStr === yesterday) {
      profile.dailyStreak = (profile.dailyStreak || 1) + 1;
    } else {
      profile.dailyStreak = 1;
    }
    profile.lastStreakDate = todayStr;
  }

  // Update Global & Per-Game ELO
  profile.rating = Math.max(100, Math.min(3000, (profile.rating || 1200) + ratingDelta));
  profile.gameStats[normalizedKey].rating = Math.max(100, Math.min(3000, (profile.gameStats[normalizedKey].rating || 1200) + ratingDelta));

  // Update Global Level & XP
  profile.xp = (profile.xp || 0) + xpGain;
  const xpForNextLevel = profile.level * 100;
  if (profile.xp >= xpForNextLevel) {
    profile.level = Math.min(100, profile.level + 1);
    profile.xp -= xpForNextLevel;
  }

  // Update Per-Game Level & XP
  profile.gameStats[normalizedKey].xp = (profile.gameStats[normalizedKey].xp || 0) + xpGain;
  const gameXpNext = profile.gameStats[normalizedKey].level * 100;
  if (profile.gameStats[normalizedKey].xp >= gameXpNext) {
    profile.gameStats[normalizedKey].level = Math.min(100, profile.gameStats[normalizedKey].level + 1);
    profile.gameStats[normalizedKey].xp -= gameXpNext;
  }

  const sanitizedOpponent = securityEngine.sanitizeText(opponentName, 18);

  const matchEntry = {
    id: `m_${Date.now()}`,
    game: gameDisplayName,
    gameKey: normalizedKey,
    opponent: sanitizedOpponent,
    outcome: outcome === 'WIN' ? 'WIN' : outcome === 'LOSS' ? 'LOSS' : 'DRAW',
    ratingDelta,
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  profile.history = [matchEntry, ...(profile.history || [])].slice(0, 20);

  saveUserProfile(profile);
  try {
    cloudSync.syncProfileToCloud(profile, matchEntry);
  } catch (e) {}

  return {
    profile,
    ratingDelta,
    xpGain,
    gameRating: profile.gameStats[normalizedKey].rating,
    gameLevel: profile.gameStats[normalizedKey].level,
    gameXp: profile.gameStats[normalizedKey].xp
  };
}

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

