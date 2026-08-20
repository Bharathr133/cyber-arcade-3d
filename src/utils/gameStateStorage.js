// Enterprise Game State Persistence & Instant Hydration Engine

const STORAGE_PREFIX = 'arena_game_state_';

export function saveGameState(gameId, state) {
  try {
    if (!gameId || !state) return;
    const payload = {
      ...state,
      _savedAt: Date.now()
    };
    localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function loadGameState(gameId, fallbackState) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
    if (!raw) return fallbackState;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallbackState;

    // Discard stale states older than 24 hours
    if (parsed._savedAt && Date.now() - parsed._savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${STORAGE_PREFIX}${gameId}`);
      return fallbackState;
    }

    const { _savedAt, ...stateOnly } = parsed;
    return {
      ...fallbackState,
      ...stateOnly
    };
  } catch (e) {
    return fallbackState;
  }
}

export function clearGameState(gameId) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${gameId}`);
  } catch (e) {
    console.error('Failed to clear game state:', e);
  }
}
