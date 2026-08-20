// Per-User Game Settings & Preference Isolation Engine
const GLOBAL_SETTINGS_KEY = 'championship_game_settings';

export const DEFAULT_SETTINGS = {
  turnTimeLimit: 30,    // 15, 30, 45, 60, 0 (0 = unlimited)
  playerBankMinutes: 5, // 1, 3, 5, 10, 0 (0 = unlimited)
  firstPlayer: 'random' // 'p1', 'p2', 'random'
};

function getStorageKey(userId) {
  return userId ? `championship_settings_${userId}` : GLOBAL_SETTINGS_KEY;
}

export function getGameSettings(userId = null) {
  try {
    const key = getStorageKey(userId);
    let raw = localStorage.getItem(key);
    if (!raw && userId) {
      raw = localStorage.getItem(GLOBAL_SETTINGS_KEY);
    }
    if (!raw) return { ...DEFAULT_SETTINGS };

    const parsed = JSON.parse(raw);
    return {
      turnTimeLimit: [15, 30, 45, 60, 0].includes(parsed.turnTimeLimit) ? parsed.turnTimeLimit : 30,
      playerBankMinutes: [1, 3, 5, 10, 0].includes(parsed.playerBankMinutes) ? parsed.playerBankMinutes : 5,
      firstPlayer: ['p1', 'p2', 'random'].includes(parsed.firstPlayer) ? parsed.firstPlayer : 'random'
    };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveGameSettings(settings, userId = null) {
  try {
    const safeSettings = {
      turnTimeLimit: [15, 30, 45, 60, 0].includes(settings.turnTimeLimit) ? settings.turnTimeLimit : 30,
      playerBankMinutes: [1, 3, 5, 10, 0].includes(settings.playerBankMinutes) ? settings.playerBankMinutes : 5,
      firstPlayer: ['p1', 'p2', 'random'].includes(settings.firstPlayer) ? settings.firstPlayer : 'random'
    };

    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(safeSettings));
    // Only update global fallback when saving for anonymous (no userId)
    if (!userId) {
      localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(safeSettings));
    }
    return safeSettings;
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}
