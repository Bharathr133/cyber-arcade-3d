// Per-Game Specific Settings & Customization Engine

export const GAME_SPECIFIC_DEFAULTS = {
  connect4: {
    turnTimeLimit: 30,
    playerBankMinutes: 5,
    firstPlayer: 'random',
    aiDifficulty: 'HARD',
    discTheme: 'CLASSIC'
  },
  tictactoe: {
    turnTimeLimit: 15,
    playerBankMinutes: 3,
    firstPlayer: 'random',
    aiDifficulty: 'HARD',
    symbolStyle: 'NEON'
  },
  gomoku: {
    turnTimeLimit: 30,
    playerBankMinutes: 5,
    firstPlayer: 'p1',
    aiDifficulty: 'HARD',
    boardTheme: 'WOOD'
  },
  memory: {
    turnTimeLimit: 30,
    gridSize: '4x4',
    flipDuration: 1.0,
    aiDifficulty: 'MEDIUM',
    cardTheme: 'ARCADE'
  },
  ludo: {
    turnTimeLimit: 20,
    tokenCount: 4,
    safeSquares: true,
    aiDifficulty: 'MEDIUM',
    animationSpeed: 'FAST'
  }
};

export function getPerGameSettings(gameId = 'connect4', userId = null) {
  try {
    const key = `arcade_settings_${gameId}${userId ? '_' + userId : ''}`;
    const raw = localStorage.getItem(key);
    const defaults = GAME_SPECIFIC_DEFAULTS[gameId] || GAME_SPECIFIC_DEFAULTS.connect4;
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch (e) {
    return { ...(GAME_SPECIFIC_DEFAULTS[gameId] || GAME_SPECIFIC_DEFAULTS.connect4) };
  }
}

export function savePerGameSettings(gameId, newSettings, userId = null) {
  try {
    const key = `arcade_settings_${gameId}${userId ? '_' + userId : ''}`;
    const defaults = GAME_SPECIFIC_DEFAULTS[gameId] || GAME_SPECIFIC_DEFAULTS.connect4;
    const merged = { ...defaults, ...newSettings };
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  } catch (e) {
    return newSettings;
  }
}

// Backward-compatible general accessors
export function getGameSettings(userId = null) {
  return getPerGameSettings('connect4', userId);
}

export function saveGameSettings(settings, userId = null) {
  return savePerGameSettings('connect4', settings, userId);
}

export function saveSettingsToAllGames(baseSettings, userId = null) {
  const games = ['connect4', 'tictactoe', 'gomoku', 'memory', 'ludo'];
  const updatedAll = {};
  games.forEach(gId => {
    const existing = getPerGameSettings(gId, userId);
    const updated = savePerGameSettings(gId, {
      ...existing,
      turnTimeLimit: baseSettings.turnTimeLimit !== undefined ? baseSettings.turnTimeLimit : existing.turnTimeLimit,
      aiDifficulty: baseSettings.aiDifficulty !== undefined ? baseSettings.aiDifficulty : existing.aiDifficulty
    }, userId);
    updatedAll[gId] = updated;
  });
  return updatedAll;
}

