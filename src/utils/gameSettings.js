const SETTINGS_STORAGE_KEY = 'championship_game_settings';

export const DEFAULT_SETTINGS = {
  turnTimeLimit: 30,    // 15, 30, 45, 60, 0 (0 = unlimited)
  playerBankMinutes: 5, // 1, 3, 5, 10, 0 (0 = unlimited)
  firstPlayer: 'random' // 'p1', 'p2', 'random'
};

export function getGameSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
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

export function saveGameSettings(settings) {
  try {
    const safeSettings = {
      turnTimeLimit: [15, 30, 45, 60, 0].includes(settings.turnTimeLimit) ? settings.turnTimeLimit : 30,
      playerBankMinutes: [1, 3, 5, 10, 0].includes(settings.playerBankMinutes) ? settings.playerBankMinutes : 5,
      firstPlayer: ['p1', 'p2', 'random'].includes(settings.firstPlayer) ? settings.firstPlayer : 'random'
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(safeSettings));
    return safeSettings;
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}
