// Enterprise Security & Anti-Cheat Validation Engine

class SecurityEngine {
  constructor() {
    // Sliding window packet rate limiter (Max 8 packets per second)
    this.packetTimestamps = [];
    this.MAX_PACKETS_PER_SECOND = 8;
  }

  // 1. Strict String Sanitizer (Prevents XSS, Script Injection, Control Chars)
  sanitizeText(input, maxLength = 24) {
    if (typeof input !== 'string') return '';
    // Strip HTML tags, angle brackets, quotes, and dangerous control characters
    const clean = input
      .replace(/<[^>]*>?/gm, '')
      .replace(/[&<>"'`=\/\\;]/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();
    return clean.slice(0, maxLength);
  }

  // 2. Player Name Validator
  validatePlayerName(name) {
    const sanitized = this.sanitizeText(name, 18);
    // Allow letters, numbers, spaces, and hyphens/underscores
    const isValid = /^[a-zA-Z0-9 _-]{2,18}$/.test(sanitized);
    return {
      isValid,
      sanitizedName: isValid ? sanitized : 'Player'
    };
  }

  // 3. Room ID Validator (Prevents path traversal and parameter tampering)
  validateRoomId(roomId) {
    if (typeof roomId !== 'string') return false;
    // Format must strictly be: room-[gameType]-[4-digit code]
    return /^room-(gomoku|connect4|tictactoe)-[0-9]{4,6}$/.test(roomId);
  }

  // 4. Rate Limiter (Prevents packet flooding / DoS attacks)
  checkRateLimit() {
    const now = Date.now();
    this.packetTimestamps = this.packetTimestamps.filter(t => now - t < 1000);
    if (this.packetTimestamps.length >= this.MAX_PACKETS_PER_SECOND) {
      console.warn('⚠️ Anti-Cheat: Inbound packet rate exceeded. Throttling spam packet.');
      return false; // Reject packet
    }
    this.packetTimestamps.push(now);
    return true; // Allow packet
  }

  // 5. Anti-Cheat Move Validator for Gomoku
  validateGomokuMove(moveData, board, expectedPlayer, currentTurn) {
    if (!moveData || typeof moveData !== 'object') return false;
    const { r, c, player } = moveData;

    // Check types and bounds (0 to 14)
    if (!Number.isInteger(r) || r < 0 || r >= 15) return false;
    if (!Number.isInteger(c) || c < 0 || c >= 15) return false;

    // Check player identity and turn
    if (player !== expectedPlayer || currentTurn !== expectedPlayer) return false;

    // Check that target cell is actually empty (prevents overwriting occupied cells)
    if (board[r][c] !== 0) return false;

    return true;
  }

  // 6. Anti-Cheat Move Validator for Connect 4
  validateConnectFourMove(moveData, board, expectedPlayer, currentTurn) {
    if (!moveData || typeof moveData !== 'object') return false;
    const { colIdx, player } = moveData;

    // Check column bounds (0 to 6)
    if (!Number.isInteger(colIdx) || colIdx < 0 || colIdx >= 7) return false;

    // Check player identity and turn
    if (player !== expectedPlayer || currentTurn !== expectedPlayer) return false;

    // Check that column is not full (top row must be empty)
    if (board[0][colIdx] !== 0) return false;

    return true;
  }

  // 7. Anti-Cheat Move Validator for Tic-Tac-Toe
  validateTicTacToeMove(moveData, board, expectedSymbol, isXNext) {
    if (!moveData || typeof moveData !== 'object') return false;
    const { index, symbol } = moveData;

    // Check index bounds (0 to 8)
    if (!Number.isInteger(index) || index < 0 || index >= 9) return false;

    // Check symbol and turn consistency
    if (symbol !== expectedSymbol) return false;
    if ((symbol === 'X' && !isXNext) || (symbol === 'O' && isXNext)) return false;

    // Check square is empty
    if (board[index] !== null) return false;

    return true;
  }

  // 8. Safe JSON Parsing with Schema Guard
  safeJsonParse(rawString, fallbackDefault) {
    if (!rawString || typeof rawString !== 'string') return fallbackDefault;
    try {
      const parsed = JSON.parse(rawString);
      return parsed && typeof parsed === 'object' ? parsed : fallbackDefault;
    } catch (e) {
      return fallbackDefault;
    }
  }
}

export const securityEngine = new SecurityEngine();
