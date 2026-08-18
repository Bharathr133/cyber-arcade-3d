// Centralized Enterprise Error Normalizer & User-Facing Message Formatter

export class EnterpriseError extends Error {
  constructor(code, title, message, actionLabel = 'OK', isCritical = false) {
    super(message);
    this.name = 'EnterpriseError';
    this.code = code;
    this.title = title;
    this.userMessage = message;
    this.actionLabel = actionLabel;
    this.isCritical = isCritical;
  }
}

/**
 * Normalizes any caught exception, network error, or backend code into a polished user-facing message.
 * @param {Error|string|object} error - Raw error
 * @param {string} [fallbackContext] - Optional context description (e.g. 'Matchmaking', 'Login')
 * @returns {{ title: string, message: string, code: string, type: 'error'|'warning' }}
 */
export function formatErrorMessage(error, fallbackContext = 'Operation') {
  if (!error) {
    return {
      title: 'Action Failed',
      message: `An unexpected issue occurred while completing ${fallbackContext.toLowerCase()}. Please try again.`,
      code: 'ERR_UNKNOWN',
      type: 'error'
    };
  }

  // Already formatted EnterpriseError
  if (error instanceof EnterpriseError) {
    return {
      title: error.title,
      message: error.userMessage,
      code: error.code,
      type: error.isCritical ? 'error' : 'warning'
    };
  }

  const raw = String(error?.message || error?.error || error || '').trim();

  // 1. Network & Connectivity Errors
  if (
    raw.includes('Failed to fetch') ||
    raw.includes('NetworkError') ||
    raw.includes('ERR_CONNECTION') ||
    raw.includes('NO_DATABASE_CLIENT') ||
    raw.includes('Network request failed') ||
    raw.includes('Offline')
  ) {
    return {
      title: 'Connection Offline',
      message: 'Unable to reach the game server. Please verify your internet connection and try again.',
      code: 'NET_DISCONNECTED',
      type: 'error'
    };
  }

  // 2. Room & Matchmaking Errors
  if (raw.includes('ROOM_NOT_FOUND') || raw.includes('Room not found') || raw.includes('PGRST116')) {
    return {
      title: 'Room Not Found',
      message: 'The 6-letter room code could not be found or has expired. Please check the code with your friend.',
      code: 'ROOM_NOT_FOUND',
      type: 'warning'
    };
  }

  if (raw.includes('ROOM_FULL') || raw.includes('Room is full') || raw.includes('match_occupied')) {
    return {
      title: 'Match Room Full',
      message: 'This match lobby already has 2 active players. Please start a Quick Match or create a new private room.',
      code: 'ROOM_FULL',
      type: 'warning'
    };
  }

  if (raw.includes('MATCHMAKING_TIMEOUT') || raw.includes('Queue timeout')) {
    return {
      title: 'Matchmaking Timed Out',
      message: 'No opponent joined in time. You can search again or invite a friend via a 6-letter room code.',
      code: 'MATCH_TIMEOUT',
      type: 'warning'
    };
  }

  // 3. Authentication & Account Errors
  if (raw.includes('already taken') || raw.includes('23505') || raw.includes('duplicate key')) {
    return {
      title: 'GamerTag Unavailable',
      message: 'This GamerTag is already claimed by another player. Please choose a unique GamerTag.',
      code: 'AUTH_TAG_TAKEN',
      type: 'warning'
    };
  }

  if (raw.includes('Invalid PIN') || raw.includes('Incorrect PIN') || raw.includes('password') || raw.includes('auth_failed')) {
    return {
      title: 'Invalid Security PIN',
      message: 'The PIN entered does not match this GamerTag. Please double check your 4-digit code.',
      code: 'AUTH_INVALID_PIN',
      type: 'error'
    };
  }

  if (raw.includes('not found') && raw.includes('Account')) {
    return {
      title: 'Account Not Found',
      message: 'No registered player was found with that GamerTag. Please check the spelling or register a new profile.',
      code: 'AUTH_USER_MISSING',
      type: 'warning'
    };
  }

  // 4. Rate Limiting & Anti-Cheat Throttling
  if (raw.includes('Rate exceeded') || raw.includes('Throttling') || raw.includes('429')) {
    return {
      title: 'Action Throttled',
      message: 'You are submitting moves too quickly. Please wait a moment for the anti-cheat verification to clear.',
      code: 'SECURITY_THROTTLED',
      type: 'warning'
    };
  }

  // 5. Illegal Move & Turn Order
  if (raw.includes('ILLEGAL_MOVE') || raw.includes('Occupied') || raw.includes('Out of bounds')) {
    return {
      title: 'Invalid Move',
      message: 'That move is not permitted according to tournament rules or the cell is already occupied.',
      code: 'GAME_ILLEGAL_MOVE',
      type: 'warning'
    };
  }

  if (raw.includes('NOT_YOUR_TURN')) {
    return {
      title: 'Wait For Your Turn',
      message: 'It is currently your opponent’s turn to play.',
      code: 'GAME_OUT_OF_TURN',
      type: 'warning'
    };
  }

  // Fallback Clean Error
  const cleanMessage = raw.length > 0 && raw.length < 120 ? raw : `An issue occurred while processing ${fallbackContext.toLowerCase()}. Please try again.`;
  return {
    title: `${fallbackContext} Notice`,
    message: cleanMessage,
    code: 'SYS_NOTICE',
    type: 'error'
  };
}
