import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RotateCcw, User, Bot, Wifi, Lightbulb, Undo2, 
  MessageSquare, Award, ChevronDown, Zap, X
} from 'lucide-react';

import { soundSynth } from '../utils/soundSynth.js';


import { realtimeManager } from '../services/realtimeManager.js';
import { gameEngineService } from '../services/gameEngineService.js';
import { saveGameState, loadGameState } from '../utils/gameStateStorage.js';
import { getUserProfile } from '../utils/userProfile.js';
import { getSupabase } from '../utils/supabaseClient.js';
import LiveEmojiReactionSystem from '../components/LiveEmojiReactionSystem.jsx';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import InGameResultBar from '../components/InGameResultBar.jsx';
import InBoardVictoryBadge from '../components/InBoardVictoryBadge.jsx';




const COLS = 7;
const ROWS = 6;
const EMPTY = 0;
const RED = 1; // Player 1 (Host / Red)
const YELLOW = 2; // Player 2 (Guest / Yellow)

const DEFAULT_C4_STATE = {
  board: Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)),
  currentPlayer: RED,
  myRole: RED,
  winner: null,
  winningCells: [],
  scores: { red: 0, yellow: 0, draws: 0 },
  history: []
};

const QUICK_PHRASES = [
  "Nice move!",
  "Good game!",
  "Oops!",
  "Thinking...",
  "Well played!",
  "Rematch?"
];

// ==========================================
// CONNECT 4 MINIMAX & HEURISTIC ENGINE
// ==========================================

function evaluateWindow(window, piece) {
  const oppPiece = piece === RED ? YELLOW : RED;
  let score = 0;
  const pieceCount = window.filter(c => c === piece).length;
  const emptyCount = window.filter(c => c === EMPTY).length;
  const oppCount = window.filter(c => c === oppPiece).length;

  if (pieceCount === 4) score += 10000;
  else if (pieceCount === 3 && emptyCount === 1) score += 120;
  else if (pieceCount === 2 && emptyCount === 2) score += 12;

  if (oppCount === 3 && emptyCount === 1) score -= 110;
  else if (oppCount === 2 && emptyCount === 2) score -= 10;
  return score;
}

function scorePosition(grid, piece) {
  let score = 0;

  // Center column strategic bonus
  const centerCol = Math.floor(COLS / 2);
  const centerPieces = grid.map(row => row[centerCol]).filter(c => c === piece).length;
  score += centerPieces * 6;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const win = [grid[r][c], grid[r][c+1], grid[r][c+2], grid[r][c+3]];
      score += evaluateWindow(win, piece);
    }
  }

  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      const win = [grid[r][c], grid[r+1][c], grid[r+2][c], grid[r+3][c]];
      score += evaluateWindow(win, piece);
    }
  }

  // Diagonal Up-Right windows
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const win = [grid[r][c], grid[r-1][c+1], grid[r-2][c+2], grid[r-3][c+3]];
      score += evaluateWindow(win, piece);
    }
  }

  // Diagonal Down-Right windows
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const win = [grid[r][c], grid[r+1][c+1], grid[r+2][c+2], grid[r+3][c+3]];
      score += evaluateWindow(win, piece);
    }
  }

  return score;
}

function getValidColumns(grid) {
  const valid = [];
  // Center-out ordering for optimal Alpha-Beta pruning speed
  const order = [3, 2, 4, 1, 5, 0, 6];
  for (let c of order) {
    if (grid[0][c] === EMPTY) valid.push(c);
  }
  return valid;
}

function minimax(grid, depth, alpha, beta, isMaximizing, piece, checkWinFn) {
  const oppPiece = piece === RED ? YELLOW : RED;
  const win = checkWinFn(grid);
  if (win) {
    if (win.winner === piece) return { score: 100000 + depth };
    if (win.winner === oppPiece) return { score: -100000 - depth };
    if (win.winner === 'DRAW') return { score: 0 };
  }
  if (depth === 0) {
    return { score: scorePosition(grid, piece) };
  }

  const validCols = getValidColumns(grid);
  if (validCols.length === 0) return { score: 0 };

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestCol = validCols[0];
    for (let c of validCols) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (grid[row][c] === EMPTY) { r = row; break; }
      }
      if (r !== -1) {
        const nextGrid = grid.map(row => [...row]);
        nextGrid[r][c] = piece;
        const evaluation = minimax(nextGrid, depth - 1, alpha, beta, false, piece, checkWinFn).score;
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestCol = c;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
    }
    return { score: maxEval, col: bestCol };
  } else {
    let minEval = Infinity;
    let bestCol = validCols[0];
    for (let c of validCols) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (grid[row][c] === EMPTY) { r = row; break; }
      }
      if (r !== -1) {
        const nextGrid = grid.map(row => [...row]);
        nextGrid[r][c] = oppPiece;
        const evaluation = minimax(nextGrid, depth - 1, alpha, beta, true, piece, checkWinFn).score;
        if (evaluation < minEval) {
          minEval = evaluation;
          bestCol = c;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
    }
    return { score: minEval, col: bestCol };
  }
}

export default function ConnectFour({ 
  profile, 
  initialMode = 'VS_COMPUTER', 
  onlineSession = null, 
  localPlayerNames = null,
  settings, 
  onMatchFinished, 
  onGoHome 
}) {
  const isOnline = initialMode === 'ONLINE_MATCH' && !!onlineSession?.matchId;
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;


  const [initialState] = useState(() => isOnline ? DEFAULT_C4_STATE : loadGameState('connect4', DEFAULT_C4_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [gameMode] = useState(isOnline ? 'ONLINE_MATCH' : initialMode);
  const [myRole, setMyRole] = useState(onlineSession?.myRole === 'O' ? YELLOW : RED);
  const [winner, setWinner] = useState(initialState.winner);
  const [winningCells, setWinningCells] = useState(initialState.winningCells || []);

  const [scores, setScores] = useState(initialState.scores || { red: 0, yellow: 0, draws: 0 });
  const [history, setHistory] = useState(initialState.history || []);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED');
  const [disconnectCountdown, setDisconnectCountdown] = useState(null);

  // Enhancements: AI Difficulty, Hints (Limited to 3 per match), Quick Chat, Series Tracker
  const [aiDifficulty, setAiDifficulty] = useState('HARD'); // 'EASY' | 'MEDIUM' | 'HARD'
  const [hintCol, setHintCol] = useState(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [quickChatOpen, setQuickChatOpen] = useState(false);
  const [activeSpeechBubble, setActiveSpeechBubble] = useState(null); // { text, sender: 'p1' | 'p2' }
  const [seriesTarget] = useState(2); // Best of 3 (first to 2 wins)


  // Result Modal State
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    outcome: null,
    ratingDelta: 0,
    xpGained: 0
  });

  const [timeLeft, setTimeLeft] = useState(30);
  const [opponentProfile, setOpponentProfile] = useState(onlineSession?.opponent || null);

  const [incomingReaction, setIncomingReaction] = useState(null);

  const [incomingChat, setIncomingChat] = useState(null);
  const [rematchStatus, setRematchStatus] = useState('IDLE'); // 'IDLE' | 'OFFERED' | 'RECEIVED' | 'ACCEPTED' | 'DECLINED' | 'OPPONENT_LEFT'


  const boardRef = useRef(board);
  boardRef.current = board;
  const historyRef = useRef(history);
  historyRef.current = history;
  const winnerRef = useRef(winner);
  winnerRef.current = winner;
  const myRoleRef = useRef(myRole);
  myRoleRef.current = myRole;
  const currentPlayerRef = useRef(currentPlayer);
  currentPlayerRef.current = currentPlayer;
  const aiTimeoutRef = useRef(null);
  const resultModalTimeoutRef = useRef(null);
  const hintTimeoutRef = useRef(null);
  const speechTimeoutRef = useRef(null);



  const normalizeC4Cell = (cell) => {
    if (cell === RED || cell === 1 || cell === '1' || cell === 'RED' || cell === 'X') return RED;
    if (cell === YELLOW || cell === 2 || cell === '2' || cell === 'YELLOW' || cell === 'O') return YELLOW;
    return EMPTY;
  };

  const checkWin = (grid) => {
    if (!grid || !Array.isArray(grid)) return null;
    const nGrid = grid.map(row => (Array.isArray(row) ? row.map(normalizeC4Cell) : []));

    // 1. Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = nGrid[r][c];
        if (val !== EMPTY && val === nGrid[r][c+1] && val === nGrid[r][c+2] && val === nGrid[r][c+3]) {
          return { winner: val, cells: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
        }
      }
    }

    // 2. Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 3; r++) {
        const val = nGrid[r][c];
        if (val !== EMPTY && val === nGrid[r+1][c] && val === nGrid[r+2][c] && val === nGrid[r+3][c]) {
          return { winner: val, cells: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
        }
      }
    }

    // 3. Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = nGrid[r][c];
        if (val !== EMPTY && val === nGrid[r-1][c+1] && val === nGrid[r-2][c+2] && val === nGrid[r-3][c+3]) {
          return { winner: val, cells: [[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]] };
        }
      }
    }

    // 4. Diagonal Down-Right
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = nGrid[r][c];
        if (val !== EMPTY && val === nGrid[r+1][c+1] && val === nGrid[r+2][c+2] && val === nGrid[r+3][c+3]) {
          return { winner: val, cells: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
        }
      }
    }

    // 5. Draw
    const isFull = nGrid[0] && nGrid[0].every(cell => cell !== EMPTY);
    if (isFull) return { winner: 'DRAW', cells: [] };

    return null;
  };


  const getLowestEmptyRow = (col, currentGrid = board) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (currentGrid[r][col] === EMPTY) return r;
    }
    return -1;
  };

  const disconnectIntervalRef = useRef(null);
  const matchFinalizedRef = useRef(false);
  const submitLockTimeoutRef = useRef(null);

  // Idempotent Result Finalizer (Guarantees match result is processed ONCE and ONLY ONCE)
  const handleFinalizeMatch = useCallback((outcome, reason = '', winningPiece = null) => {
    if (matchFinalizedRef.current) return;
    matchFinalizedRef.current = true;

    const isWin = outcome === 'WIN';
    const isDraw = outcome === 'DRAW';
    const finalPiece = winningPiece || (isWin ? myRoleRef.current : (isDraw ? 'DRAW' : (myRoleRef.current === RED ? YELLOW : RED)));
    setWinner(finalPiece);

    const delta = isWin ? 16 : (isDraw ? 0 : -16);
    const xp = isWin ? 30 : 10;

    setResultModal({
      outcome,
      ratingDelta: delta,
      xpGained: xp,
      reason
    });

    if (isWin) {
      soundSynth.playVictory();
    } else if (!isDraw) {
      soundSynth.playDefeat();
    }

    if (onMatchFinished) {
      onMatchFinished('connect4', outcome, opponentProfile?.name || (gameMode === 'VS_COMPUTER' ? 'Grandmaster AI' : localPlayerNames?.p2));
    }
  }, [gameMode, onMatchFinished, opponentProfile?.name, localPlayerNames?.p2]);



  const handleFinalizeMatchRef = useRef(handleFinalizeMatch);
  handleFinalizeMatchRef.current = handleFinalizeMatch;

  // Realtime Integration for Online Match (Subscribes ONCE per matchId)
  useEffect(() => {
    if (!isOnline || !onlineSession?.matchId) return;

    setMyRole(onlineSession.myRole === 'O' ? YELLOW : RED);
    if (onlineSession.opponent) {
      setOpponentProfile(onlineSession.opponent);
    }

    const matchId = onlineSession.matchId;

    // Real-time Supabase Match & Opponent Profile Resolution
    const resolveRealOpponent = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data: match } = await supabase
          .from('matches')
          .select('player_1_id, player_1_name, player_2_id, player_2_name')
          .eq('id', matchId)
          .single();

        if (match) {
          const isPlayer1 = match.player_1_id === profile?.id;
          const oppName = isPlayer1 ? match.player_2_name : match.player_1_name;
          const oppId = isPlayer1 ? match.player_2_id : match.player_1_id;

          if (oppName && oppName !== 'Opponent' && oppName !== 'Player 1' && oppName !== 'Player 2') {
            setOpponentProfile(prev => ({ ...prev, name: oppName, id: oppId }));
          }

          if (oppId) {
            const { data: oppProf } = await supabase
              .from('profiles')
              .select('name, display_name, username, avatar_id, rating')
              .eq('id', oppId)
              .single();

            if (oppProf) {
              const finalName = oppProf.display_name || oppProf.name || (oppProf.username ? `@${oppProf.username}` : null);
              if (finalName) {
                setOpponentProfile(prev => ({
                  ...prev,
                  name: finalName,
                  avatarId: oppProf.avatar_id || prev.avatarId,
                  rating: oppProf.rating || prev.rating,
                  id: oppId
                }));
              }
            }
          }
        }
      } catch (e) {}
    };

    resolveRealOpponent();


    realtimeManager.subscribeToMatch(matchId, profile?.id, {
      onReactionEmoji: (reactionData) => {
        if (reactionData) {
          setIncomingReaction({
            emoji: reactionData.emoji,
            sender: reactionData.sender,
            senderId: reactionData.senderId,
            timestamp: Date.now()
          });
        }
      },
      onQuickChat: (chatData) => {
        if (chatData?.phrase) {
          soundSynth.playBulbLight();
          setIncomingChat({
            phrase: chatData.phrase,
            sender: chatData.sender,
            senderId: chatData.senderId,
            timestamp: Date.now()
          });
        }
      },

      onRematchOffer: (data) => {
        setRematchStatus('RECEIVED');
        try { soundSynth.playBulbLight(); } catch (e) {}
      },

      onRematchAccept: () => {
        setRematchStatus('ACCEPTED');
        setTimeout(() => {
          resetGame();
          setRematchStatus('IDLE');
        }, 600);
      },

      onRematchDecline: () => {
        setRematchStatus('DECLINED');
      },

      onPlayerLeft: () => {
        setRematchStatus('OPPONENT_LEFT');
        setConnectionStatus('OPPONENT_LEFT');
      },

      onStateUpdate: (serverState) => {
        if (!serverState) return;
        const incomingBoard = serverState.board_state || serverState.board;
        const rawTurn = serverState.current_turn || serverState.turn;
        const incomingTurn = (rawTurn === 'X' || rawTurn === 'RED' || rawTurn === 'P1' || rawTurn === 1 || rawTurn === '1' || rawTurn === RED) ? RED : YELLOW;
        const incomingResult = serverState.status || serverState.result;
        const winnerId = serverState.winner_id || serverState.winnerId;

        if (incomingBoard && Array.isArray(incomingBoard)) {
          // Merge server board with local board so no discs (regular or winning) are ever lost
          const finalBoard = incomingBoard.map((row, r) =>
            Array.isArray(row)
              ? row.map((cell, c) => {
                  const normInc = normalizeC4Cell(cell);
                  const normLoc = (boardRef.current && boardRef.current[r]) ? normalizeC4Cell(boardRef.current[r][c]) : EMPTY;
                  return normInc !== EMPTY ? normInc : normLoc;
                })
              : []
          );

          setBoard(finalBoard);
          setCurrentPlayer(incomingTurn);

          const winResult = checkWin(finalBoard);
          if (winResult?.cells && winResult.cells.length > 0) {
            setWinningCells(winResult.cells);
          }

          if (incomingResult && incomingResult !== 'ACTIVE') {
            const isWin = incomingResult === 'WIN' || incomingResult === 'FINISHED';
            const isMyWin = isWin && (
              winnerId === profile?.id ||
              serverState.winnerSymbol === myRoleRef.current ||
              serverState.winner === myRoleRef.current ||
              winResult?.winner === myRoleRef.current
            );
            const isDraw = incomingResult === 'DRAW' || winResult?.winner === 'DRAW';
            const outcome = isMyWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
            const winPiece = isWin ? (isMyWin ? myRoleRef.current : (myRoleRef.current === RED ? YELLOW : RED)) : 'DRAW';

            handleFinalizeMatchRef.current(outcome, '', winPiece);
          }
        }
      },


      onOpponentDisconnect: () => {
        if (disconnectIntervalRef.current) clearInterval(disconnectIntervalRef.current);

        const isGameOver = !!(winnerRef.current || matchFinalizedRef.current);
        let count = isGameOver ? 6 : 35; // 6s grace for post-match reload, 35s during active play
        setConnectionStatus('OPPONENT_DISCONNECTED');
        setDisconnectCountdown(count);

        disconnectIntervalRef.current = setInterval(() => {
          count -= 1;
          setDisconnectCountdown(count);
          if (count <= 0) {
            if (disconnectIntervalRef.current) {
              clearInterval(disconnectIntervalRef.current);
              disconnectIntervalRef.current = null;
            }
            setConnectionStatus('OPPONENT_LEFT');
            setRematchStatus('OPPONENT_LEFT');
            if (!isGameOver) {
              handleFinalizeMatchRef.current('WIN', 'Opponent disconnected (Abandonment)');
            }
          }
        }, 1000);
      },
      onOpponentReconnect: () => {
        if (disconnectIntervalRef.current) {
          clearInterval(disconnectIntervalRef.current);
          disconnectIntervalRef.current = null;
        }
        setConnectionStatus('CONNECTED');
        setDisconnectCountdown(null);
        setRematchStatus((prev) => (prev === 'OPPONENT_LEFT' ? 'IDLE' : prev));
      },
      onMatchAbandoned: () => {
        if (disconnectIntervalRef.current) {
          clearInterval(disconnectIntervalRef.current);
          disconnectIntervalRef.current = null;
        }
        setConnectionStatus('OPPONENT_LEFT');
        setRematchStatus('OPPONENT_LEFT');
        if (!winnerRef.current && !matchFinalizedRef.current) {
          handleFinalizeMatchRef.current('WIN', 'Opponent abandoned the match');
        }
      }
    });


    async function syncLatestState() {
      try {
        const supabase = getSupabase();
        if (supabase && matchId) {
          let latestBoard = null;
          let latestWinResult = null;

          const { data: stateData } = await supabase
            .from('game_states')
            .select('*')
            .eq('match_id', matchId)
            .maybeSingle();

          if (stateData) {
            const rawBoard = stateData.board_state || stateData.board;
            const rawTurn = stateData.current_turn || stateData.turn;
            const rawResult = stateData.status || stateData.result;
            const winnerId = stateData.winner_id || stateData.winnerId;
            if (rawBoard && Array.isArray(rawBoard)) {
              const finalBoard = rawBoard.map((row, r) =>
                Array.isArray(row)
                  ? row.map((cell, c) => {
                      const normInc = normalizeC4Cell(cell);
                      const normLoc = (boardRef.current && boardRef.current[r]) ? normalizeC4Cell(boardRef.current[r][c]) : EMPTY;
                      return normInc !== EMPTY ? normInc : normLoc;
                    })
                  : []
              );

              latestBoard = finalBoard;
              setBoard(finalBoard);
              const incomingTurn = (rawTurn === 'X' || rawTurn === 'RED' || rawTurn === 'P1') ? RED : YELLOW;
              setCurrentPlayer(incomingTurn);
              latestWinResult = checkWin(finalBoard);
              if (latestWinResult?.cells && latestWinResult.cells.length > 0) {
                setWinningCells(latestWinResult.cells);
              }
              if (rawResult && rawResult !== 'ACTIVE') {
                const isWin = rawResult === 'WIN' || rawResult === 'FINISHED';
                const isMyWin = isWin && (winnerId === profile?.id || stateData.winnerSymbol === myRoleRef.current || latestWinResult?.winner === myRoleRef.current);
                const isDraw = rawResult === 'DRAW' || latestWinResult?.winner === 'DRAW';
                const outcome = isMyWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
                const winPiece = isWin ? (isMyWin ? myRoleRef.current : (myRoleRef.current === RED ? YELLOW : RED)) : 'DRAW';
                handleFinalizeMatchRef.current(outcome, '', winPiece);
              }
            }
          }


          const { data: matchData } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .maybeSingle();

          if (matchData) {
            const oppId = (matchData.player_1_id === profile?.id) ? matchData.player_2_id : matchData.player_1_id;
            if (oppId) {
              const { data: oppProfile } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .eq('id', oppId)
                .maybeSingle();

              if (oppProfile) {
                setOpponentProfile({
                  name: oppProfile.display_name || oppProfile.name || (oppProfile.username ? `@${oppProfile.username}` : ''),
                  avatarId: oppProfile.avatar_url || '2',
                  rating: 1200
                });
              }

            }

            if (matchData.result === 'FINISHED' || matchData.result === 'DRAW') {
              const isMyWin = matchData.winner_id === profile?.id;
              const isDraw = matchData.result === 'DRAW';
              const outcome = isMyWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
              const winPiece = isMyWin ? myRoleRef.current : (myRoleRef.current === RED ? YELLOW : RED);
              if (latestBoard) {
                const wr = checkWin(latestBoard);
                if (wr?.cells && wr.cells.length > 0) {
                  setWinningCells(wr.cells);
                }
              }
              handleFinalizeMatchRef.current(outcome, '', winPiece);
            }
          }
        }
      } catch (e) {}
    }


    syncLatestState();

    // Tab Visibility Re-Sync Handler (Instant catch-up upon returning to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLatestState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (disconnectIntervalRef.current) {
        clearInterval(disconnectIntervalRef.current);
        disconnectIntervalRef.current = null;
      }
      if (submitLockTimeoutRef.current) {
        clearTimeout(submitLockTimeoutRef.current);
        submitLockTimeoutRef.current = null;
      }
      realtimeManager.leaveMatch(matchId);
    };
  }, [isOnline, onlineSession?.matchId, profile?.id]);

  const resetGame = useCallback(() => {
    matchFinalizedRef.current = false;
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (resultModalTimeoutRef.current) clearTimeout(resultModalTimeoutRef.current);
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
    setIsAiThinking(false);
    setIsSubmittingMove(false);
    const emptyBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    setBoard(emptyBoard);
    setCurrentPlayer(RED);
    setWinner(null);
    setWinningCells([]);
    setHistory([]);
    setHoveredCol(null);
    setLastMove(null);
    setHintCol(null);
    setHintsRemaining(3);
    setRematchStatus('IDLE');
    setTimeLeft(turnTimeLimit > 0 ? turnTimeLimit : 30);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });
  }, [turnTimeLimit]);


  const handleOfferRematch = useCallback(() => {
    if (isOnline && onlineSession?.matchId) {
      setRematchStatus('OFFERED');
      realtimeManager.requestRematch(onlineSession.matchId, profile?.id, profile?.name || 'You');
    } else {
      resetGame();
    }
  }, [isOnline, onlineSession?.matchId, profile?.id, profile?.name, resetGame]);

  const handleAcceptRematch = useCallback(async () => {
    if (!isOnline || !onlineSession?.matchId) return;
    setRematchStatus('ACCEPTED');
    realtimeManager.acceptRematch(onlineSession.matchId, profile?.id);
    const emptyBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    await gameEngineService.resetMatchState(onlineSession.matchId, emptyBoard, RED);
    setTimeout(() => {
      resetGame();
      setRematchStatus('IDLE');
    }, 600);
  }, [isOnline, onlineSession?.matchId, profile?.id, resetGame]);

  const handleDeclineRematch = useCallback(() => {
    if (isOnline && onlineSession?.matchId) {
      setRematchStatus('DECLINED');
      realtimeManager.declineRematch(onlineSession.matchId, profile?.id);
    }
  }, [isOnline, onlineSession?.matchId, profile?.id]);

  const handleGoHome = useCallback(() => {
    if (isOnline && onlineSession?.matchId) {
      realtimeManager.notifyPlayerLeft(onlineSession.matchId, profile?.id);
      realtimeManager.leaveMatch(onlineSession.matchId);
    }
    if (onGoHome) onGoHome();
  }, [isOnline, onlineSession?.matchId, profile?.id, onGoHome]);




  const handleDropToken = async (colIdx) => {
    if (winner || isAiThinking || isSubmittingMove) return;

    const targetRow = getLowestEmptyRow(colIdx, board);
    if (targetRow === -1) return;

    setHintCol(null);

    if (isOnline) {
      if (currentPlayer !== myRole) return;

      setIsSubmittingMove(true);
      // Auto-unlock safety timeout after 3.5s in case of network freeze
      if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
      submitLockTimeoutRef.current = setTimeout(() => {
        setIsSubmittingMove(false);
      }, 3500);

      soundSynth.playDiscDrop();

      // Optimistic instant board update
      const optimisticBoard = board.map(row => [...row]);
      optimisticBoard[targetRow][colIdx] = myRole;
      const nextTurn = myRole === RED ? YELLOW : RED;
      setBoard(optimisticBoard);
      setLastMove({ row: targetRow, col: colIdx, player: myRole });
      setCurrentPlayer(nextTurn);

      const winResult = checkWin(optimisticBoard);
      const isWin = winResult?.winner && winResult.winner !== 'DRAW';
      const isDraw = winResult?.winner === 'DRAW';
      const outcomeResult = isWin ? 'WIN' : (isDraw ? 'DRAW' : 'ACTIVE');

      if (winResult?.cells && winResult.cells.length > 0) {
        setWinningCells(winResult.cells);
      }

      realtimeManager.broadcastToMatch(onlineSession.matchId, 'match_move', {
        board: optimisticBoard,
        turn: nextTurn,
        result: outcomeResult,
        winner_id: isWin ? profile?.id : null,
        winnerSymbol: isWin ? myRole : null,
        winningCells: winResult?.cells || [],
        senderId: profile?.id
      });

      if (isWin || isDraw) {
        handleFinalizeMatch(outcomeResult === 'WIN' ? 'WIN' : 'DRAW', '', myRole);
      }

      try {
        const movePayload = {
          column: colIdx,
          row: targetRow,
          board: optimisticBoard,
          turn: nextTurn,
          result: outcomeResult,
          winnerSymbol: winResult?.winner || null
        };
        const res = await gameEngineService.submitMove(onlineSession.matchId, movePayload, profile?.id);
        if (res?.success && res.state) {
          const finalBoard = res.state.board || optimisticBoard;
          setBoard(finalBoard);
          const rawTurn = res.state.turn || res.state.current_turn;
          setCurrentPlayer((rawTurn === 'X' || rawTurn === 'RED' || rawTurn === 'P1') ? RED : YELLOW);

          if (res.state.result && res.state.result !== 'ACTIVE') {
            const isWinMatch = res.state.result === 'WIN' || res.state.result === 'FINISHED';
            const isMyWin = isWinMatch && (res.state.winner_id === profile?.id || res.state.winnerSymbol === myRole);
            const isDrawMatch = res.state.result === 'DRAW';
            const outcome = isMyWin ? 'WIN' : (isDrawMatch ? 'DRAW' : 'LOSS');
            const winPiece = isWinMatch ? (isMyWin ? myRole : (myRole === RED ? YELLOW : RED)) : 'DRAW';

            handleFinalizeMatch(outcome, '', winPiece);
          }
        }
      } catch (e) {

        console.error('[Connect4 Move Exception]:', e);
      } finally {
        if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
        setIsSubmittingMove(false);
      }
    } else {
      // Local / AI Mode
      soundSynth.playDiscDrop();
      const newBoard = board.map(row => [...row]);
      newBoard[targetRow][colIdx] = currentPlayer;

      const newHistory = [...history, { row: targetRow, col: colIdx, player: currentPlayer }];
      setBoard(newBoard);
      setHistory(newHistory);
      setLastMove({ row: targetRow, col: colIdx, player: currentPlayer });

      const winResult = checkWin(newBoard);

      if (winResult) {
        setWinningCells(winResult.cells || []);
        const isWin = winResult.winner === RED;
        const isLoss = winResult.winner === YELLOW;
        const outcome = isWin ? 'WIN' : (isLoss ? 'LOSS' : 'DRAW');

        handleFinalizeMatch(outcome, '', winResult.winner);
      } else {
        const nextPlayer = currentPlayer === RED ? YELLOW : RED;
        setCurrentPlayer(nextPlayer);
      }
    }
  };


  // Tactical Hint Calculation (Human Player, max 3 per match)
  const handleGetHint = () => {
    if (winner || isAiThinking || !isMyTurn || hintsRemaining <= 0) return;
    setHintsRemaining(prev => prev - 1);
    soundSynth.playHint();
    const result = minimax(board, 4, -Infinity, Infinity, true, RED, checkWin);
    if (result && result.col !== undefined) {
      setHintCol(result.col);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setHintCol(null);
      }, 3500);
    }
  };


  // Undo Move (Local & Vs Computer)
  const handleUndo = () => {
    if (isOnline || history.length === 0 || winner || isAiThinking) return;
    soundSynth.playRotate();

    let movesToUndo = 1;
    if (gameMode === 'VS_COMPUTER') {
      movesToUndo = history.length >= 2 ? 2 : 1;
    }

    const newHistory = history.slice(0, history.length - movesToUndo);
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    newHistory.forEach(m => {
      newBoard[m.row][m.col] = m.player;
    });

    setBoard(newBoard);
    setHistory(newHistory);
    setLastMove(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null);
    setCurrentPlayer(RED);
    setWinner(null);
    setWinningCells([]);
    setHintCol(null);
  };

  // Send Quick Chat
  const handleSendQuickChat = (phrase) => {
    soundSynth.playBulbLight();
    setQuickChatOpen(false);

    setActiveSpeechBubble({
      text: phrase,
      sender: 'p1'
    });

    if (isOnline && onlineSession?.matchId) {
      realtimeManager.broadcastToMatch(onlineSession.matchId, 'quick_chat', {
        phrase,
        sender: profile?.name || 'You'
      });
    }

    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      setActiveSpeechBubble(null);
    }, 3500);
  };

  // Smart 3-Tier Connect 4 AI
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && currentPlayer === YELLOW && !winner) {
      setIsAiThinking(true);

      const delay = aiDifficulty === 'HARD' ? 450 : 300;
      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        const validCols = getValidColumns(curBoard);
        if (validCols.length === 0) return;

        let chosenCol = validCols[0];

        if (aiDifficulty === 'EASY') {
          // 40% random move, 60% immediate win/block
          if (Math.random() < 0.4) {
            chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
          } else {
            const aiRes = minimax(curBoard, 1, -Infinity, Infinity, true, YELLOW, checkWin);
            chosenCol = aiRes.col !== undefined ? aiRes.col : validCols[0];
          }
        } else if (aiDifficulty === 'MEDIUM') {
          // Depth 2 minimax (blocks immediate threats, sets up doubles)
          const aiRes = minimax(curBoard, 2, -Infinity, Infinity, true, YELLOW, checkWin);
          chosenCol = aiRes.col !== undefined ? aiRes.col : validCols[0];
        } else {
          // Grandmaster: Depth 4 Minimax with Alpha-Beta Pruning
          const aiRes = minimax(curBoard, 4, -Infinity, Infinity, true, YELLOW, checkWin);
          chosenCol = aiRes.col !== undefined ? aiRes.col : validCols[0];
        }

        handleDropToken(chosenCol);
      }, delay);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [currentPlayer, gameMode, winner, aiDifficulty]);

  // Turn Clock
  useEffect(() => {
    if (winner || turnTimeLimit <= 0) return;

    setTimeLeft(turnTimeLimit);
    const turnEndTime = Date.now() + (turnTimeLimit * 1000);

    const timer = setInterval(() => {
      const remainingSec = Math.ceil((turnEndTime - Date.now()) / 1000);
      setTimeLeft(Math.max(0, remainingSec));

      if (isOnline) {
        const myTurnNow = (currentPlayer === myRole);
        if (myTurnNow) {
          if (remainingSec <= 0) {
            clearInterval(timer);
            // Official Competitive Rule: Timeout = Forfeit Loss (NO automatic moves)
            handleFinalizeMatch('LOSS', 'Time expired (Timeout forfeit)');
          }
        } else {
          // Opponent's turn: 4-second grace buffer to prevent false timeout claims from latency
          if (remainingSec <= -4) {
            clearInterval(timer);
            handleFinalizeMatch('WIN', 'Opponent timed out');
          }
        }
      } else {
        if (remainingSec <= 0) {
          clearInterval(timer);
          if (gameMode === 'VS_COMPUTER') {
            if (currentPlayer === RED) {
              handleFinalizeMatch('LOSS', 'Time expired');
            }
          } else if (gameMode === 'LOCAL_2P') {
            setWinner(currentPlayer === RED ? YELLOW : RED);
          }
        }
      }


      if (remainingSec <= 5 && remainingSec > 0) {
        try { soundSynth.playRotate(); } catch (e) {}
      }
    }, 500);



    return () => clearInterval(timer);
  }, [currentPlayer, winner, turnTimeLimit, isOnline, gameMode, myRole]);

  const isMyTurn = isOnline ? (currentPlayer === myRole) : (gameMode === 'LOCAL_2P' || currentPlayer === RED);

  return (
    <div style={{
      width: '100%',
      maxWidth: 'min(440px, calc(100dvh - 110px), 100vw)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* 1. TOP HEADER & TACTICAL TOOLBAR */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        flexWrap: 'nowrap',
        gap: '6px'
      }}>
        {/* Game Mode / Difficulty Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid #E4E4E7',
            padding: '5px 10px',
            borderRadius: '8px',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: '800',
            color: '#18181B'
          }}>
            {isOnline ? (
              <>
                <Wifi size={13} color="#16A34A" />
                <span>ONLINE</span>
              </>
            ) : gameMode === 'VS_COMPUTER' ? (
              <>
                <Bot size={13} color="#2563EB" />
                <span>AI DUEL</span>
              </>
            ) : (
              <>
                <User size={13} color="#18181B" />
                <span>2P LOCAL</span>
              </>
            )}
          </div>

          {/* AI Difficulty Selector (VS_COMPUTER) */}
          {gameMode === 'VS_COMPUTER' && !isOnline && (
            <div style={{
              display: 'flex',
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px'
            }}>
              {[
                { id: 'EASY', label: 'EASY' },
                { id: 'MEDIUM', label: 'MED' },
                { id: 'HARD', label: 'MASTER' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    soundSynth.playClick();
                    setAiDifficulty(d.id);
                  }}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '6px',
                    fontSize: '9px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)',
                    border: 'none',
                    background: aiDifficulty === d.id ? '#2563EB' : 'transparent',
                    color: aiDifficulty === d.id ? '#FFFFFF' : '#71717A',
                    cursor: 'pointer'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tactical Actions Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Tactical Hint (Vs AI or Local, max 3 per match) */}
          {!isOnline && (
            <button
              onClick={handleGetHint}
              disabled={isAiThinking || !isMyTurn || !!winner || hintsRemaining <= 0}
              title={hintsRemaining > 0 ? `Get Tactical Hint (${hintsRemaining} left)` : "No hints remaining for this match"}
              style={{
                padding: '5px 8px',
                borderRadius: '8px',
                background: hintCol !== null ? '#FEF3C7' : '#FFFFFF',
                border: hintCol !== null ? '1px solid #FDE68A' : '1px solid #E4E4E7',
                color: hintCol !== null ? '#B45309' : (hintsRemaining > 0 ? '#52525B' : '#A1A1AA'),
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: (isAiThinking || !isMyTurn || !!winner || hintsRemaining <= 0) ? 'not-allowed' : 'pointer',
                opacity: (isAiThinking || !isMyTurn || !!winner || hintsRemaining <= 0) ? 0.4 : 1
              }}
            >
              <Lightbulb size={13} color={hintCol !== null ? '#B45309' : (hintsRemaining > 0 ? '#52525B' : '#A1A1AA')} />
              <span>HINT ({hintsRemaining})</span>
            </button>
          )}


          {/* Undo Move (Vs AI or Local) */}
          {!isOnline && (
            <button
              onClick={handleUndo}
              disabled={history.length === 0 || isAiThinking || !!winner}
              title="Undo last move"
              style={{
                padding: '5px 8px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                color: '#52525B',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                opacity: (history.length === 0 || isAiThinking || !!winner) ? 0.4 : 1
              }}
            >
              <Undo2 size={13} />
            </button>
          )}

          {/* Reset Board Button */}
          {!isOnline && (
            <button
              onClick={resetGame}
              title="Reset Board"
              style={{
                padding: '5px 8px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                color: '#52525B',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>


      {/* Disconnect Alert Banner (During active game only) */}
      {!winner && !matchFinalizedRef.current && connectionStatus === 'OPPONENT_DISCONNECTED' && (
        <div style={{
          width: '100%', background: '#FFFBEB', border: '1.5px solid #F59E0B',
          borderRadius: '10px', padding: '7px 12px', marginBottom: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#92400E', fontSize: '11px', fontWeight: '800'
        }}>
          <span>Opponent reconnecting • Waiting {disconnectCountdown || 35}s...</span>
        </div>
      )}

      {/* Opponent Left Alert Banner */}
      {!winner && !matchFinalizedRef.current && connectionStatus === 'OPPONENT_LEFT' && (
        <div style={{
          width: '100%', background: '#FEF2F2', border: '1.5px solid #FCA5A5',
          borderRadius: '10px', padding: '7px 12px', marginBottom: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#991B1B', fontSize: '11px', fontWeight: '800'
        }}>
          <span>Opponent left the match.</span>
        </div>
      )}


      {/* Dynamic Turn Alert Banner */}
      {!winner && (
        <div style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: '8px',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '11px',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.02em',
          background: isMyTurn ? '#EFF6FF' : '#FAFAFA',
          border: isMyTurn ? '1px solid #BFDBFE' : '1px solid #E4E4E7',
          color: isMyTurn ? '#1D4ED8' : '#71717A'
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: isMyTurn ? (currentPlayer === RED ? '#EF4444' : '#EAB308') : '#A1A1AA',
            display: 'inline-block'
          }} />
          <span>
            {isMyTurn 
              ? `YOUR TURN (${currentPlayer === RED ? 'RED' : 'YELLOW'}) — DROP A DISC` 
              : (isAiThinking ? 'AI IS THINKING (ANALYZING GRID)...' : `WAITING FOR OPPONENT TO MOVE...`)}
          </span>
        </div>
      )}

      {/* Floating Quick Chat Speech Bubbles */}
      {activeSpeechBubble && (
        <div 
          className="animate-speech-bubble"
          style={{
            position: 'relative',
            background: '#18181B',
            color: '#FAFAFA',
            padding: '5px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            marginBottom: '4px',
            alignSelf: activeSpeechBubble.sender === 'p1' ? 'flex-start' : 'flex-end'
          }}
        >
          <span>{activeSpeechBubble.text}</span>
        </div>
      )}

      {/* Dual Player Bar & Series Tracker */}
      <div style={{ width: '100%', position: 'relative' }}>
        <MatchPlayerBar
          p1Name={profile?.display_name || profile?.name}
          p1AvatarId={profile?.avatarId || '1'}
          p1Rating={profile?.rating || 1200}
          p1Score={scores.red}
          p1Symbol={isOnline ? (myRole === RED ? 'RED DISC' : 'YELLOW DISC') : 'RED DISC'}
          p1Color={isOnline ? (myRole === RED ? '#ef4444' : '#eab308') : '#ef4444'}
          p2Name={isOnline ? (opponentProfile?.display_name || opponentProfile?.name) : (gameMode === 'VS_COMPUTER' ? (aiDifficulty === 'HARD' ? 'Grandmaster AI' : aiDifficulty === 'MEDIUM' ? 'Smart AI' : 'Casual AI') : localPlayerNames?.p2)}
          p2AvatarId={isOnline ? (opponentProfile?.avatarId || '2') : '2'}
          p2Rating={isOnline ? (opponentProfile?.rating || 1200) : (aiDifficulty === 'HARD' ? 1750 : aiDifficulty === 'MEDIUM' ? 1400 : 1100)}
          p2Score={scores.yellow}
          p2Symbol={isOnline ? (myRole === RED ? 'YELLOW DISC' : 'RED DISC') : 'YELLOW DISC'}
          p2Color={isOnline ? (myRole === RED ? '#eab308' : '#ef4444') : '#eab308'}
          isP1Turn={isMyTurn}
          isGameOver={!!winner}
          gameMode={gameMode}
          winnerText={
            isOnline ? (
              winner === myRole ? `${profile?.display_name || profile?.name} Won!` :
              winner && winner !== 'DRAW' ? `${opponentProfile?.display_name || opponentProfile?.name} Won!` :
              winner === 'DRAW' ? 'Draw Match!' : null
            ) : (
              winner === RED ? `${gameMode === 'LOCAL_2P' ? (localPlayerNames?.p1 || profile?.name) : profile?.name} Won!` :
              winner === YELLOW ? (gameMode === 'VS_COMPUTER' ? 'AI Bot Won!' : `${localPlayerNames?.p2} Won!`) :
              winner === 'DRAW' ? 'Draw Match!' : null
            )
          }
          timeLeft={timeLeft}
        />






        {/* Series Best-of-3 Round Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '3px',
          marginBottom: '3px',
          fontSize: '9px',
          fontWeight: '700',
          color: '#71717A',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>RED:</span>
            {[...Array(seriesTarget)].map((_, i) => (
              <span
                key={i}
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: i < (scores.red || 0) ? '#EF4444' : '#E4E4E7',
                  border: i < (scores.red || 0) ? '1px solid #DC2626' : '1px solid #D4D4D8'
                }}
              />
            ))}
          </div>

          <span style={{ color: '#A1A1AA' }}>• BEST OF 3 •</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>YELLOW:</span>
            {[...Array(seriesTarget)].map((_, i) => (
              <span
                key={i}
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: i < (scores.yellow || 0) ? '#EAB308' : '#E4E4E7',
                  border: i < (scores.yellow || 0) ? '1px solid #CA8A04' : '1px solid #D4D4D8'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE COLUMN TOP DROP INDICATOR STRIP */}
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 'clamp(4px, 1.2vw, 8px)',
        height: '24px',
        alignItems: 'center',
        padding: '0 clamp(8px, 2vw, 14px)',
        boxSizing: 'border-box'
      }}>
        {[...Array(COLS)].map((_, c) => {
          const isHovered = hoveredCol === c && isMyTurn && !winner && !isAiThinking;
          const isHinted = hintCol === c;
          return (
            <div
              key={c}
              onClick={() => handleDropToken(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isMyTurn && !winner && !isAiThinking ? 'pointer' : 'default',
                height: '100%'
              }}
            >
              {isHovered ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: currentPlayer === RED ? '#EF4444' : '#EAB308',
                  boxShadow: `0 0 8px ${currentPlayer === RED ? '#EF4444' : '#EAB308'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ChevronDown size={11} color="#FFFFFF" />
                </div>
              ) : isHinted ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#FACC15',
                  boxShadow: '0 0 10px #FACC15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={11} color="#18181B" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* 3. CONNECT 4 VERTICAL GRID BOARD */}
      <div style={{
        position: 'relative',
        background: '#1E3A8A',
        padding: 'clamp(8px, 2vw, 14px)',
        borderRadius: '18px',
        border: '3px solid #172554',
        boxShadow: '0 20px 35px -5px rgba(30, 58, 138, 0.45), inset 0 2px 4px rgba(255,255,255,0.2)',
        width: '100%',
        aspectRatio: '7 / 6',
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gap: 'clamp(4px, 1.2vw, 8px)',
        boxSizing: 'border-box'
      }}>
        {/* Realistic Physical Interlocking Metallic Chain Across 4 Winning Discs */}
        {winningCells && winningCells.length >= 4 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 25
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="goldChainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="25%" stopColor="#FACC15" />
                <stop offset="55%" stopColor="#B45309" />
                <stop offset="80%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <filter id="realisticChainShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0.5" dy="1.2" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.65" />
              </filter>
            </defs>
            {winningCells.slice(0, -1).map(([r1, c1], idx) => {
              const [r2, c2] = winningCells[idx + 1];
              const x1 = ((c1 + 0.5) / COLS) * 100;
              const y1 = ((r1 + 0.5) / ROWS) * 100;
              const x2 = ((c2 + 0.5) / COLS) * 100;
              const y2 = ((r2 + 0.5) / ROWS) * 100;
              const midX1 = x1 + (x2 - x1) * 0.33;
              const midY1 = y1 + (y2 - y1) * 0.33;
              const midX2 = x1 + (x2 - x1) * 0.67;
              const midY2 = y1 + (y2 - y1) * 0.67;
              const deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
              return (
                <g key={`chain-seg-${idx}`} filter="url(#realisticChainShadow)">
                  <line
                    x1={`${x1}%`} y1={`${y1}%`}
                    x2={`${x2}%`} y2={`${y2}%`}
                    stroke="#FACC15"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <g transform={`translate(${midX1}, ${midY1}) rotate(${deg})`}>
                    <rect
                      x="-3.6" y="-2"
                      width="7.2" height="4"
                      rx="2"
                      fill="none"
                      stroke="url(#goldChainGrad)"
                      strokeWidth="1.2"
                    />
                    <line x1="-2.2" y1="0" x2="2.2" y2="0" stroke="rgba(255,255,255,0.8)" strokeWidth="0.6" />
                  </g>
                  <g transform={`translate(${midX2}, ${midY2}) rotate(${deg})`}>
                    <rect
                      x="-3.2" y="-1.5"
                      width="6.4" height="3"
                      rx="1.5"
                      fill="url(#goldChainGrad)"
                      stroke="#78350F"
                      strokeWidth="0.4"
                    />
                  </g>
                </g>
              );
            })}
            {winningCells.map(([r, c], i) => {
              const cx = ((c + 0.5) / COLS) * 100;
              const cy = ((r + 0.5) / ROWS) * 100;
              return (
                <g key={`rivet-${i}`} filter="url(#realisticChainShadow)">
                  <circle
                    cx={`${cx}%`}
                    cy={`${cy}%`}
                    r="3.4"
                    fill="url(#goldChainGrad)"
                    stroke="#FEF08A"
                    strokeWidth="0.6"
                  />
                  <circle
                    cx={`${cx}%`}
                    cy={`${cy}%`}
                    r="1.2"
                    fill="#FFFFFF"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {board.map((row, r) =>
          row.map((cell, c) => {
            const isWinningCell = winningCells.some(([wr, wc]) => wr === r && wc === c);
            const isLastMove = lastMove && lastMove.row === r && lastMove.col === c;
            const targetRowForCol = getLowestEmptyRow(c, board);
            const isGhostCell = hoveredCol === c && targetRowForCol === r && cell === EMPTY && isMyTurn && !winner && !isAiThinking;
            const isHintCell = hintCol === c && targetRowForCol === r && cell === EMPTY;
            const isRedToken = cell === RED || cell === 1 || cell === '1' || cell === 'RED' || cell === 'X' || (isWinningCell && (winner === RED || winner === 1 || winner === 'RED' || winner === 'X'));
            const isYellowToken = cell === YELLOW || cell === 2 || cell === '2' || cell === 'YELLOW' || cell === 'O' || (isWinningCell && (winner === YELLOW || winner === 2 || winner === 'YELLOW' || winner === 'O'));

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleDropToken(c)}
                onMouseEnter={() => setHoveredCol(c)}
                onMouseLeave={() => setHoveredCol(null)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#0F172A',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isMyTurn && !winner && !isAiThinking && !isSubmittingMove ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.6)'
                }}
              >
                {isRedToken && (
                  <div
                    className={isWinningCell ? "animate-winner-pulse" : (isLastMove ? "animate-disc-drop" : "animate-pop-in")}
                    style={{
                      width: '90%', height: '90%', borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #f87171, #dc2626 60%, #991b1b)',
                      boxShadow: isWinningCell ? '0 0 24px #ef4444, inset 0 2px 4px rgba(255,255,255,0.7)' : 'inset 0 2px 4px rgba(255,255,255,0.4)',
                      border: isWinningCell ? '3px solid #FACC15' : (isLastMove ? '2px solid rgba(255,255,255,0.6)' : 'none'),
                      transform: isWinningCell ? 'scale(1.12)' : 'scale(1)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: isWinningCell ? 10 : 1
                    }}
                  >
                    {isLastMove && !isWinningCell && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF', opacity: 0.8 }} />
                    )}
                  </div>
                )}
                {isYellowToken && (
                  <div
                    className={isWinningCell ? "animate-winner-pulse" : (isLastMove ? "animate-disc-drop" : "animate-pop-in")}
                    style={{
                      width: '90%', height: '90%', borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #fde047, #eab308 60%, #a16207)',
                      boxShadow: isWinningCell ? '0 0 24px #eab308, inset 0 2px 4px rgba(255,255,255,0.7)' : 'inset 0 2px 4px rgba(255,255,255,0.4)',
                      border: isWinningCell ? '3px solid #FFFFFF' : (isLastMove ? '2px solid rgba(255,255,255,0.6)' : 'none'),
                      transform: isWinningCell ? 'scale(1.12)' : 'scale(1)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: isWinningCell ? 10 : 1
                    }}
                  >
                    {isLastMove && !isWinningCell && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF', opacity: 0.8 }} />
                    )}
                  </div>
                )}
                {isGhostCell && (
                  <div
                    className="animate-ghost-pulse"
                    style={{
                      width: '85%',
                      height: '85%',
                      borderRadius: '50%',
                      background: myRole === RED ? 'rgba(239, 68, 68, 0.45)' : 'rgba(234, 179, 8, 0.45)',
                      border: myRole === RED ? '2px dashed #EF4444' : '2px dashed #EAB308',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
                {isHintCell && (
                  <div
                    className="animate-pulse"
                    style={{
                      width: '85%',
                      height: '85%',
                      borderRadius: '50%',
                      background: 'rgba(250, 204, 21, 0.35)',
                      border: '2px solid #FACC15',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>
            );
          })
        )}

        {/* Premium In-Board Victory Tag */}
        {winner && (
          <InBoardVictoryBadge
            winner={winner}
            myRole={myRole}
            gameType="connect4"
            outcome={resultModal.outcome}
          />
        )}
      </div>


      {winner && (
        <InGameResultBar
          outcome={resultModal.outcome || (winner === myRole ? 'WIN' : (winner === 'DRAW' ? 'DRAW' : 'LOSS'))}
          ratingDelta={resultModal.ratingDelta}
          xpGained={resultModal.xpGained}
          onRematch={handleOfferRematch}
          onAcceptRematch={handleAcceptRematch}
          onDeclineRematch={handleDeclineRematch}
          onGoHome={handleGoHome}
          isOnline={isOnline}
          rematchStatus={rematchStatus}
          opponentName={opponentProfile?.name || (gameMode === 'VS_COMPUTER' ? 'Grandmaster AI' : localPlayerNames?.p2)}
        />

      )}


      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '4px' }}>
        <LiveEmojiReactionSystem
          matchId={onlineSession?.matchId}
          isOnline={isOnline}
          playerName={profile?.name || 'You'}
          userId={profile?.id}
          incomingReaction={incomingReaction}
          incomingChat={incomingChat}
        />
      </div>
    </div>
  );
}

