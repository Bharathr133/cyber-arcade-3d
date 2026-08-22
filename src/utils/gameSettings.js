// Per-Game Specific Settings & Customization Engine with AI Progression Tiers

export const GAME_SPECIFIC_DEFAULTS = {
  connect4: {
    turnTimeLimit: 30,
    playerBankMinutes: 5,
    firstPlayer: 'random',
    aiDifficulty: 'EASY',
    discTheme: 'CLASSIC'
  },
  tictactoe: {
    turnTimeLimit: 15,
    playerBankMinutes: 3,
    firstPlayer: 'random',
    aiDifficulty: 'EASY',
    symbolStyle: 'NEON'
  },
  gomoku: {
    turnTimeLimit: 30,
    playerBankMinutes: 5,
    firstPlayer: 'p1',
    aiDifficulty: 'EASY',
    boardTheme: 'WOOD'
  },
  memory: {
    turnTimeLimit: 30,
    gridSize: '4x4',
    flipDuration: 1.0,
    aiDifficulty: 'EASY',
    cardTheme: 'ARCADE'
  },
  ludo: {
    turnTimeLimit: 20,
    tokenCount: 4,
    safeSquares: true,
    aiDifficulty: 'EASY',
    animationSpeed: 'FAST'
  }
};

/**
 * Get the list of unlocked AI difficulty tiers for a specific game and user.
 * Tiers: ['EASY'] by default. Unlocks 'MEDIUM' upon beating EASY, and 'HARD' upon beating MEDIUM.
 */
export function getUnlockedAiTiers(gameId = 'connect4', userId = null) {
  try {
    const key = `arcade_ai_unlocked_${gameId}${userId ? '_' + userId : ''}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.includes('EASY')) parsed.unshift('EASY');
        return parsed;
      }
    }
  } catch (e) {}
  return ['EASY'];
}

/**
 * Record a victory against the AI bot and unlock the next tier if applicable.
 */
export function recordAiWinAndUnlock(gameId, currentDifficulty = 'EASY', userId = null) {
  try {
    const unlocked = getUnlockedAiTiers(gameId, userId);
    let newUnlock = null;

    if (currentDifficulty === 'EASY' && !unlocked.includes('MEDIUM')) {
      unlocked.push('MEDIUM');
      newUnlock = 'MEDIUM';
    } else if (currentDifficulty === 'MEDIUM' && !unlocked.includes('HARD')) {
      unlocked.push('HARD');
      newUnlock = 'HARD';
    }

    if (newUnlock) {
      const key = `arcade_ai_unlocked_${gameId}${userId ? '_' + userId : ''}`;
      localStorage.setItem(key, JSON.stringify(unlocked));

      // Auto-update game settings to newly unlocked difficulty
      const currentSettings = getPerGameSettings(gameId, userId);
      savePerGameSettings(gameId, { ...currentSettings, aiDifficulty: newUnlock }, userId);
    }

    return { unlockedTiers: unlocked, newUnlock };
  } catch (e) {
    return { unlockedTiers: ['EASY'], newUnlock: null };
  }
}

export function getPerGameSettings(gameId = 'connect4', userId = null) {
  try {
    const key = `arcade_settings_${gameId}${userId ? '_' + userId : ''}`;
    const raw = localStorage.getItem(key);
    const defaults = GAME_SPECIFIC_DEFAULTS[gameId] || GAME_SPECIFIC_DEFAULTS.connect4;
    const settings = raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };

    // Enforce that AI difficulty must be an unlocked tier
    const unlockedTiers = getUnlockedAiTiers(gameId, userId);
    if (!unlockedTiers.includes(settings.aiDifficulty)) {
      settings.aiDifficulty = unlockedTiers[unlockedTiers.length - 1] || 'EASY';
    }

    return settings;
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
