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

export const getTier = (rating) => {
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
  tictactoe: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 }
};

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = securityEngine.safeJsonParse(raw, null);
    if (!parsed || !parsed.isRegistered) return null;

    const { sanitizedName } = securityEngine.validatePlayerName(parsed.name || 'Player');

    // Anti-DevTools Tampering: Verify signature if present
    if (parsed._sig) {
      const isValid = securityEngine.verifySignature(parsed, parsed._sig);
      if (!isValid) {
        console.warn('⚠️ Security Alert: LocalStorage profile signature mismatch. Tampering detected & sanitized.');
      }
    }

    const gameStats = {
      gomoku: { ...DEFAULT_GAME_STATS.gomoku, ...(parsed.gameStats?.gomoku || {}) },
      connect4: { ...DEFAULT_GAME_STATS.connect4, ...(parsed.gameStats?.connect4 || {}) },
      tictactoe: { ...DEFAULT_GAME_STATS.tictactoe, ...(parsed.gameStats?.tictactoe || {}) }
    };

    return {
      id: securityEngine.sanitizeText(parsed.id || 'user_1', 20),
      name: sanitizedName,
      avatarId: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(parsed.avatarId) ? parsed.avatarId : '1',
      level: Math.max(1, Math.min(100, Number(parsed.level) || 1)),
      xp: Math.max(0, Math.min(100000, Number(parsed.xp) || 0)),
      rating: Math.max(100, Math.min(3000, Number(parsed.rating) || 1200)),
      wins: Math.max(0, Number(parsed.wins) || 0),
      losses: Math.max(0, Number(parsed.losses) || 0),
      draws: Math.max(0, Number(parsed.draws) || 0),
      gameStats,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 20) : [],
      isRegistered: true
    };
  } catch (e) {
    return null;
  }
}

export function saveUserProfile(updated) {
  try {
    if (!updated || typeof updated !== 'object') return;
    const { sanitizedName } = securityEngine.validatePlayerName(updated.name || 'Player');

    const gameStats = {
      gomoku: { ...DEFAULT_GAME_STATS.gomoku, ...(updated.gameStats?.gomoku || {}) },
      connect4: { ...DEFAULT_GAME_STATS.connect4, ...(updated.gameStats?.connect4 || {}) },
      tictactoe: { ...DEFAULT_GAME_STATS.tictactoe, ...(updated.gameStats?.tictactoe || {}) }
    };

    const safeData = {
      id: securityEngine.sanitizeText(updated.id || `user_${Date.now()}`, 24),
      name: sanitizedName,
      avatarId: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(updated.avatarId) ? updated.avatarId : '1',
      level: Math.max(1, Math.min(100, Number(updated.level) || 1)),
      xp: Math.max(0, Math.min(100000, Number(updated.xp) || 0)),
      rating: Math.max(100, Math.min(3000, Number(updated.rating) || 1200)),
      wins: Math.max(0, Number(updated.wins) || 0),
      losses: Math.max(0, Number(updated.losses) || 0),
      draws: Math.max(0, Number(updated.draws) || 0),
      gameStats,
      history: Array.isArray(updated.history) ? updated.history.slice(0, 20) : [],
      isRegistered: true
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

export function recordMatchResult(gameKey, outcome, opponentName = 'Computer') {
  const normalizedKey = gameKey.toLowerCase().includes('gomoku') ? 'gomoku' :
                        gameKey.toLowerCase().includes('connect') ? 'connect4' : 'tictactoe';
  const gameDisplayName = normalizedKey === 'gomoku' ? 'Gomoku (15×15)' :
                          normalizedKey === 'connect4' ? 'Connect 4 (7×6)' : 'Tic-Tac-Toe (3×3)';

  const profile = getUserProfile() || {
    id: 'user_default',
    name: 'Player',
    avatarId: '1',
    level: 1,
    xp: 0,
    rating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    gameStats: { ...DEFAULT_GAME_STATS },
    history: [],
    isRegistered: true
  };

  let ratingDelta = 0;
  let xpGain = 10;

  if (outcome === 'WIN') {
    ratingDelta = 25;
    xpGain = 50;
    profile.wins = (profile.wins || 0) + 1;
    profile.gameStats[normalizedKey].wins = (profile.gameStats[normalizedKey].wins || 0) + 1;
  } else if (outcome === 'LOSS') {
    ratingDelta = -10;
    xpGain = 10;
    profile.losses = (profile.losses || 0) + 1;
    profile.gameStats[normalizedKey].losses = (profile.gameStats[normalizedKey].losses || 0) + 1;
  } else {
    ratingDelta = 2;
    xpGain = 15;
    profile.draws = (profile.draws || 0) + 1;
    profile.gameStats[normalizedKey].draws = (profile.gameStats[normalizedKey].draws || 0) + 1;
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
