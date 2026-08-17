import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, QrCode, Wifi } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/soundSynth.js';
import { standardMultiplayer } from '../utils/multiplayerPeer.js';
import { securityEngine } from '../utils/securityEngine.js';
import { saveGameState, loadGameState } from '../utils/gameStateStorage.js';
import StandardQrModal from '../components/StandardQrModal.jsx';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import MatchResultModal from '../components/MatchResultModal.jsx';
import MatchLobbyReadyModal from '../components/MatchLobbyReadyModal.jsx';

const COLS = 7;
const ROWS = 6;
const EMPTY = 0;
const RED = 1; // Player 1 / Human
const YELLOW = 2; // Player 2 / AI / Guest

const DEFAULT_C4_STATE = {
  board: Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)),
  currentPlayer: RED,
  myRole: RED,
  winner: null,
  winningCells: [],
  scores: { red: 0, yellow: 0, draws: 0 },
  history: []
};

export default function ConnectFour({ profile, initialMode = 'VS_COMPUTER', settings, onMatchFinished, onGoHome }) {
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;
  const isJoinedGuest = typeof window !== 'undefined' && window.location.search.includes('join=');
  const effectiveMode = isJoinedGuest ? 'ONLINE_QR' : initialMode;

  const [initialState] = useState(() => loadGameState('connect4', DEFAULT_C4_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [gameMode] = useState(effectiveMode);
  const [myRole, setMyRole] = useState(isJoinedGuest ? YELLOW : RED);
  const [winner, setWinner] = useState(initialState.winner);
  const [winningCells, setWinningCells] = useState(initialState.winningCells || []);
  const [scores, setScores] = useState(initialState.scores || { red: 0, yellow: 0, draws: 0 });
  const [history, setHistory] = useState(initialState.history || []);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Result Modal State
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    outcome: null,
    ratingDelta: 0,
    xpGained: 0
  });

  // Turn Clock & Forfeit State (30s per turn)
  const [timeLeft, setTimeLeft] = useState(30);

  // QR & Lobby Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLobbyReady, setIsLobbyReady] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState({ name: 'Opponent', avatarId: '2', rating: 1200 });
  const [shareUrl, setShareUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);

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

  const persistCurrentState = (updatedBoard, nextPlayer, updatedScores, curWinner, curWinningCells, updatedHistory) => {
    saveGameState('connect4', {
      board: updatedBoard,
      currentPlayer: nextPlayer,
      scores: updatedScores,
      winner: curWinner,
      winningCells: curWinningCells,
      history: updatedHistory,
      gameMode,
      myRole: myRoleRef.current
    });
  };

  const resetGame = useCallback((sendSync = false) => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    if (resultModalTimeoutRef.current) {
      clearTimeout(resultModalTimeoutRef.current);
      resultModalTimeoutRef.current = null;
    }
    setIsAiThinking(false);
    const emptyBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    setBoard(emptyBoard);
    setCurrentPlayer(RED);
    setWinner(null);
    setWinningCells([]);
    setHistory([]);
    setHoveredCol(null);
    setTimeLeft(turnTimeLimit > 0 ? turnTimeLimit : 30);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });

    persistCurrentState(emptyBoard, RED, scores, null, [], []);

    if (sendSync && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendReset();
    }
  }, [gameMode, scores, turnTimeLimit]);

  const checkWin = (grid) => {
    // 1. Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p !== EMPTY && p === grid[r][c+1] && p === grid[r][c+2] && p === grid[r][c+3]) {
          return { winner: p, cells: [[r,c], [r,c+1], [r,c+2], [r,c+3]] };
        }
      }
    }
    // 2. Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const p = grid[r][c];
        if (p !== EMPTY && p === grid[r+1][c] && p === grid[r+2][c] && p === grid[r+3][c]) {
          return { winner: p, cells: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
        }
      }
    }
    // 3. Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p !== EMPTY && p === grid[r-1][c+1] && p === grid[r-2][c+2] && p === grid[r-3][c+3]) {
          return { winner: p, cells: [[r,c], [r-1,c+1], [r-2,c+2], [r-3,c+3]] };
        }
      }
    }
    // 4. Diagonal Down-Right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p !== EMPTY && p === grid[r+1][c+1] && p === grid[r+2][c+2] && p === grid[r+3][c+3]) {
          return { winner: p, cells: [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]] };
        }
      }
    }

    const isFull = grid.every(row => row.every(cell => cell !== EMPTY));
    if (isFull) return { winner: 'DRAW', cells: [] };

    return null;
  };

  const applyDropToken = useCallback((colIdx, playerToDrop, isRemote = false) => {
    const curBoard = boardRef.current;
    if (winnerRef.current) return false;

    if (isRemote) {
      const isValid = securityEngine.validateConnectFourMove(
        { colIdx, player: playerToDrop },
        curBoard,
        myRoleRef.current === RED ? YELLOW : RED,
        currentPlayerRef.current
      );
      if (!isValid) {
        console.warn('Anti-Cheat: Rejected remote Connect 4 move:', { colIdx, playerToDrop });
        return false;
      }
    }

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (curBoard[r][colIdx] === EMPTY) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return false;

    soundSynth.playRotate();

    const newBoard = curBoard.map(row => [...row]);
    newBoard[targetRow][colIdx] = playerToDrop;
    const newHistory = [...historyRef.current, { r: targetRow, c: colIdx, player: playerToDrop }];

    setBoard(newBoard);
    setHistory(newHistory);

    const winResult = checkWin(newBoard);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningCells(winResult.cells);
      soundSynth.playVictory();

      let outcome = 'DRAW';
      let delta = 2;
      let xp = 15;

      const updatedScores = { ...scores };

      if (winResult.winner === RED) {
        updatedScores.red = (updatedScores.red || 0) + 1;
        outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current !== RED) ? 'LOSS' : 'WIN';
        delta = outcome === 'WIN' ? 16 : -10;
        xp = outcome === 'WIN' ? 30 : 10;
      } else if (winResult.winner === YELLOW) {
        updatedScores.yellow = (updatedScores.yellow || 0) + 1;
        outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current === YELLOW) ? 'WIN' : (gameMode === 'VS_COMPUTER' ? 'LOSS' : 'WIN');
        delta = outcome === 'WIN' ? 16 : -10;
        xp = outcome === 'WIN' ? 30 : 10;
      } else {
        updatedScores.draws = (updatedScores.draws || 0) + 1;
      }

      setScores(updatedScores);
      persistCurrentState(newBoard, playerToDrop, updatedScores, winResult.winner, winResult.cells, newHistory);

      if (winResult.winner !== 'DRAW' && outcome === 'WIN') {
        try { confetti({ particleCount: 75, spread: 65, origin: { y: 0.65 } }); } catch (e) {}
      }

      if (onMatchFinished) {
        onMatchFinished('connect4', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2');
      }

      if (resultModalTimeoutRef.current) clearTimeout(resultModalTimeoutRef.current);
      resultModalTimeoutRef.current = setTimeout(() => {
        setResultModal({
          isOpen: true,
          outcome,
          ratingDelta: delta,
          xpGained: xp
        });
      }, 450);
    } else {
      const nextTurn = playerToDrop === RED ? YELLOW : RED;
      setCurrentPlayer(nextTurn);
      persistCurrentState(newBoard, nextTurn, scores, null, [], newHistory);
    }

    if (!isRemote && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendMove({ colIdx, player: playerToDrop });
    }

    return true;
  }, [gameMode, scores, onMatchFinished]);

  const handleTimeoutForfeit = useCallback((timedOutPlayer) => {
    if (winnerRef.current) return;
    const winningPlayer = timedOutPlayer === RED ? YELLOW : RED;
    setWinner(winningPlayer);
    soundSynth.playVictory();

    const outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current !== winningPlayer) ? 'LOSS' : (gameMode === 'VS_COMPUTER' && timedOutPlayer === RED ? 'LOSS' : 'WIN');
    const delta = outcome === 'WIN' ? 25 : -10;
    const xp = outcome === 'WIN' ? 50 : 10;

    const updatedScores = { ...scores };
    if (winningPlayer === RED) updatedScores.red = (updatedScores.red || 0) + 1;
    else updatedScores.yellow = (updatedScores.yellow || 0) + 1;
    setScores(updatedScores);

    if (outcome === 'WIN') {
      try { confetti({ particleCount: 75, spread: 65, origin: { y: 0.65 } }); } catch (e) {}
    }

    if (onMatchFinished) {
      onMatchFinished('connect4', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Opponent');
    }

    if (resultModalTimeoutRef.current) clearTimeout(resultModalTimeoutRef.current);
    resultModalTimeoutRef.current = setTimeout(() => {
      setResultModal({
        isOpen: true,
        outcome,
        ratingDelta: delta,
        xpGained: xp
      });
    }, 400);
  }, [gameMode, scores, onMatchFinished]);

  const handleTimeoutForfeitRef = useRef(handleTimeoutForfeit);
  handleTimeoutForfeitRef.current = handleTimeoutForfeit;

  // Active Blitz Turn Timer (Customizable)
  useEffect(() => {
    if (winner || turnTimeLimit === 0) return;
    setTimeLeft(turnTimeLimit);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 5 && next > 0) {
          soundSynth.playClick();
        }
        return next >= 0 ? next : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayer, winner, turnTimeLimit]);

  // Safe Timeout Trigger (Runs cleanly outside reducer only when match has started)
  useEffect(() => {
    if (timeLeft === 0 && !winner && turnTimeLimit > 0 && history.length > 0) {
      handleTimeoutForfeitRef.current(currentPlayer);
    }
  }, [timeLeft, winner, turnTimeLimit, currentPlayer, history.length]);

  // Online Disconnect Forfeit (15s Reconnect Grace Period)
  useEffect(() => {
    let disconnectTimer = null;
    if (gameMode === 'ONLINE_QR' && !isConnected && !winner && history.length > 0) {
      disconnectTimer = setTimeout(() => {
        if (!isConnected && !winnerRef.current) {
          handleTimeoutForfeitRef.current(myRoleRef.current === RED ? YELLOW : RED);
        }
      }, 15000);
    }
    return () => {
      if (disconnectTimer) clearTimeout(disconnectTimer);
    };
  }, [gameMode, isConnected, winner, history.length]);

  const applyDropTokenRef = useRef(applyDropToken);
  applyDropTokenRef.current = applyDropToken;
  const resetGameRef = useRef(resetGame);
  resetGameRef.current = resetGame;

  const handleStartMatch = useCallback((broadcast = true) => {
    setIsLobbyReady(false);
    setIsQrModalOpen(false);
    soundSynth.playVictory();
    if (broadcast && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendStartMatch({});
    }
  }, [gameMode]);

  const handleStartMatchRef = useRef(handleStartMatch);
  handleStartMatchRef.current = handleStartMatch;

  // Stable WebRTC Setup
  useEffect(() => {
    if (gameMode === 'ONLINE_QR') {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get('join');

      const handlers = {
        onMove: (move) => applyDropTokenRef.current(move.colIdx, move.player, true),
        onReset: () => resetGameRef.current(false),
        onConnect: () => {
          setIsConnected(true);
          setIsQrModalOpen(false);
          setIsLobbyReady(true);
          soundSynth.playVictory();
          // Send profile info to peer
          standardMultiplayer.sendPeerProfile({
            name: profile?.name || 'Player',
            avatarId: profile?.avatarId || '1',
            rating: profile?.rating || 1200
          });
        },
        onPeerProfile: (peerProfile) => {
          if (peerProfile) {
            setOpponentProfile(peerProfile);
          }
        },
        onStartMatch: () => {
          handleStartMatchRef.current(false);
        },
        onDisconnect: () => {
          setIsConnected(false);
          setIsLobbyReady(false);
        }
      };

      if (joinParam) {
        setMyRole(YELLOW);
        setIsConnected(false);
        standardMultiplayer.joinRoom(joinParam, handlers);
      } else {
        setMyRole(RED);
        setIsConnected(false);
        const { shareUrl: url } = standardMultiplayer.createRoom('connect4', handlers);
        setShareUrl(url);
        setIsQrModalOpen(true);
      }

      return () => {
        standardMultiplayer.cleanup();
      };
    }
  }, [gameMode, profile?.name, profile?.avatarId, profile?.rating]);

  const handleColumnClick = (c) => {
    if (isAiThinking || winner) return;

    if (gameMode === 'ONLINE_QR') {
      if (currentPlayer !== myRole || !isConnected) return;
      applyDropToken(c, myRole, false);
    } else if (gameMode === 'VS_COMPUTER') {
      if (currentPlayer !== RED) return;
      applyDropToken(c, RED, false);
    } else {
      applyDropToken(c, currentPlayer, false);
    }
  };

  // Heuristic evaluation of a 4-token window for Connect 4 AI
  const evaluateWindow = (window, piece) => {
    let score = 0;
    const oppPiece = piece === RED ? YELLOW : RED;
    let pieceCount = 0;
    let emptyCount = 0;
    let oppCount = 0;

    for (let i = 0; i < 4; i++) {
      if (window[i] === piece) pieceCount++;
      else if (window[i] === EMPTY) emptyCount++;
      else if (window[i] === oppPiece) oppCount++;
    }

    if (pieceCount === 4) {
      score += 100000;
    } else if (pieceCount === 3 && emptyCount === 1) {
      score += 1200;
    } else if (pieceCount === 2 && emptyCount === 2) {
      score += 150;
    }

    if (oppCount === 3 && emptyCount === 1) {
      score -= 2200; // Heavy defense against opponent 3-in-a-row threats
    } else if (oppCount === 2 && emptyCount === 2) {
      score -= 200;
    }

    return score;
  };

  // Full board positional scoring with center-column bias
  const scorePosition = (grid, piece) => {
    let score = 0;

    // Center column control (Column 3 has highest strategic connectivity)
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][3] === piece) centerCount++;
    }
    score += centerCount * 45;

    // Inner columns (2 and 4)
    let innerCount = 0;
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][2] === piece) innerCount++;
      if (grid[r][4] === piece) innerCount++;
    }
    score += innerCount * 20;

    // Horizontal 4-windows
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += evaluateWindow([grid[r][c], grid[r][c + 1], grid[r][c + 2], grid[r][c + 3]], piece);
      }
    }

    // Vertical 4-windows
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        score += evaluateWindow([grid[r][c], grid[r + 1][c], grid[r + 2][c], grid[r + 3][c]], piece);
      }
    }

    // Diagonal Down-Right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += evaluateWindow([grid[r][c], grid[r + 1][c + 1], grid[r + 2][c + 2], grid[r + 3][c + 3]], piece);
      }
    }

    // Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += evaluateWindow([grid[r][c], grid[r - 1][c + 1], grid[r - 2][c + 2], grid[r - 3][c + 3]], piece);
      }
    }

    return score;
  };

  const getValidLocations = (grid) => {
    const valid = [];
    const searchOrder = [3, 2, 4, 1, 5, 0, 6]; // Center-out search maximizes Alpha-Beta cutoffs
    for (let c of searchOrder) {
      if (grid[0][c] === EMPTY) {
        valid.push(c);
      }
    }
    return valid;
  };

  const getNextOpenRow = (grid, col) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][col] === EMPTY) return r;
    }
    return -1;
  };

  // Grandmaster Minimax with Alpha-Beta Pruning
  const minimax = (grid, depth, alpha, beta, isMaximizing) => {
    const validLocations = getValidLocations(grid);
    const winResult = checkWin(grid);

    if (winResult) {
      if (winResult.winner === YELLOW) {
        return { col: null, score: 1000000 + depth * 1000 };
      } else if (winResult.winner === RED) {
        return { col: null, score: -1000000 - depth * 1000 };
      } else {
        return { col: null, score: 0 }; // Draw
      }
    }

    if (depth === 0 || validLocations.length === 0) {
      return { col: null, score: scorePosition(grid, YELLOW) };
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      let bestCol = validLocations[0];

      for (let col of validLocations) {
        const row = getNextOpenRow(grid, col);
        if (row === -1) continue;

        grid[row][col] = YELLOW;
        const evalResult = minimax(grid, depth - 1, alpha, beta, false);
        grid[row][col] = EMPTY;

        if (evalResult.score > maxScore) {
          maxScore = evalResult.score;
          bestCol = col;
        }

        alpha = Math.max(alpha, maxScore);
        if (alpha >= beta) break; // Alpha-Beta Cutoff
      }

      return { col: bestCol, score: maxScore };
    } else {
      let minScore = Infinity;
      let bestCol = validLocations[0];

      for (let col of validLocations) {
        const row = getNextOpenRow(grid, col);
        if (row === -1) continue;

        grid[row][col] = RED;
        const evalResult = minimax(grid, depth - 1, alpha, beta, true);
        grid[row][col] = EMPTY;

        if (evalResult.score < minScore) {
          minScore = evalResult.score;
          bestCol = col;
        }

        beta = Math.min(beta, minScore);
        if (alpha >= beta) break; // Alpha-Beta Cutoff
      }

      return { col: bestCol, score: minScore };
    }
  };

  // Master Connect 4 AI
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && currentPlayer === YELLOW && !winner) {
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        // 1. Immediate Win Check (Depth 1 Instant Finisher)
        for (let c of [3, 2, 4, 1, 5, 0, 6]) {
          const r = getNextOpenRow(curBoard, c);
          if (r !== -1) {
            curBoard[r][c] = YELLOW;
            const res = checkWin(curBoard);
            curBoard[r][c] = EMPTY;
            if (res && res.winner === YELLOW) {
              applyDropToken(c, YELLOW, false);
              return;
            }
          }
        }

        // 2. Immediate Block Check (Depth 1 Instant Saver)
        for (let c of [3, 2, 4, 1, 5, 0, 6]) {
          const r = getNextOpenRow(curBoard, c);
          if (r !== -1) {
            curBoard[r][c] = RED;
            const res = checkWin(curBoard);
            curBoard[r][c] = EMPTY;
            if (res && res.winner === RED) {
              applyDropToken(c, YELLOW, false);
              return;
            }
          }
        }

        // 3. Deep Minimax Lookahead (Depth 5 for Master Tactical Play)
        const boardCopy = curBoard.map(row => [...row]);
        const bestMove = minimax(boardCopy, 5, -Infinity, Infinity, true);

        if (bestMove && bestMove.col !== null && curBoard[0][bestMove.col] === EMPTY) {
          applyDropToken(bestMove.col, YELLOW, false);
        } else {
          // Fallback to center preference
          const valid = getValidLocations(curBoard);
          if (valid.length > 0) {
            applyDropToken(valid[0], YELLOW, false);
          }
        }
      }, 300);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [currentPlayer, gameMode, winner, applyDropToken]);

  const isMyTurn = gameMode === 'LOCAL_2P' || (gameMode === 'ONLINE_QR' ? currentPlayer === myRole : currentPlayer === RED);

  return (
    <div style={{
      width: '100%',
      maxWidth: 'min(480px, calc(100dvh - 125px), 100vw)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Focused Match Controls: Mobile Adaptive Header */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        flexWrap: 'nowrap',
        gap: '6px'
      }}>
        {/* Active Mode Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          padding: '6px 12px',
          borderRadius: '10px',
          fontFamily: 'var(--font-heading)',
          fontSize: '11px',
          fontWeight: '800',
          color: '#0f172a'
        }}>
          {gameMode === 'VS_COMPUTER' ? (
            <>
              <Bot size={15} color="#0f172a" />
              <span>VS SMART AI</span>
            </>
          ) : gameMode === 'LOCAL_2P' ? (
            <>
              <User size={15} color="#0f172a" />
              <span>2P LOCAL</span>
            </>
          ) : (
            <>
              <Wifi size={15} color={isConnected ? '#16a34a' : '#d97706'} />
              <span>ONLINE {isConnected ? '(CONNECTED)' : '(WAITING)'}</span>
            </>
          )}
        </div>

        {/* Action Tools */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {gameMode === 'ONLINE_QR' && (
            <button
              className="btn-secondary"
              onClick={() => setIsQrModalOpen(true)}
              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', color: '#1e3a8a', minHeight: '36px' }}
            >
              <QrCode size={13} />
              <span>QR</span>
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={() => resetGame(true)}
            title="Reset Board"
            style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', minHeight: '36px' }}
          >
            <RotateCcw size={13} />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Dual Player Bar */}
      <MatchPlayerBar
        p1Name={profile?.name || 'You'}
        p1AvatarId={profile?.avatarId || '1'}
        p1Rating={profile?.rating || 1200}
        p1Score={scores.red}
        p1Symbol="RED"
        p1Color="#991b1b"
        p2Name={gameMode === 'VS_COMPUTER' ? 'Smart AI' : (gameMode === 'ONLINE_QR' ? 'Player 2' : 'Player 2')}
        p2AvatarId="2"
        p2Rating={1200}
        p2Score={scores.yellow}
        p2Symbol="YELLOW"
        p2Color="#92400e"
        isP1Turn={currentPlayer === RED}
        isGameOver={!!winner}
        gameMode={gameMode}
        winnerText={
          winner === RED ? (gameMode === 'VS_COMPUTER' ? 'YOU WIN' : 'RED WINS') :
          winner === YELLOW ? (gameMode === 'VS_COMPUTER' ? 'AI WINS' : 'YELLOW WINS') :
          winner === 'DRAW' ? 'DRAW' : null
        }
        timeLeft={timeLeft}
      />

      {/* Hover Drop Slot Preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 'clamp(4px, 1.5vw, 8px)',
        width: '100%',
        height: '20px',
        marginBottom: '6px',
        padding: '0 clamp(8px, 2vw, 14px)',
        boxSizing: 'border-box'
      }}>
        {Array.from({ length: COLS }).map((_, c) => {
          const isHovered = hoveredCol === c && board[0][c] === EMPTY && !winner && isMyTurn && !isAiThinking;
          return (
            <div key={`h-${c}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {isHovered && (
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: currentPlayer === RED ? '#991b1b' : '#d97706',
                  boxShadow: `0 0 8px ${currentPlayer === RED ? '#991b1b' : '#d97706'}`
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* 100% Fluid Mobile Connect 4 Board */}
      <div style={{
        background: '#1e3a8a',
        padding: 'clamp(8px, 2.5vw, 16px)',
        borderRadius: '18px',
        boxShadow: '0 12px 32px rgba(30, 58, 138, 0.22)',
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 'clamp(4px, 1.5vw, 8px)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isWinningCell = winningCells.some(([wr, wc]) => wr === r && wc === c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleColumnClick(c)}
                onMouseEnter={() => setHoveredCol(c)}
                onMouseLeave={() => setHoveredCol(null)}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  background: cell === RED ? '#991b1b' : cell === YELLOW ? '#d97706' : '#ffffff',
                  boxShadow: isWinningCell
                    ? '0 0 20px #ffffff, inset 0 0 8px rgba(0,0,0,0.3)'
                    : cell !== EMPTY
                      ? 'inset 0 -2px 5px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)'
                      : 'inset 0 2px 5px rgba(0,0,0,0.25)',
                  border: isWinningCell ? '3px solid #ffffff' : 'none',
                  cursor: board[0][c] === EMPTY && !winner && isMyTurn && !isAiThinking ? 'pointer' : 'default',
                  transform: isWinningCell ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                  touchAction: 'manipulation'
                }}
              />
            );
          })
        )}
      </div>

      {/* Standard QR Modal */}
      <StandardQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        shareUrl={shareUrl}
        isConnected={isConnected}
        gameTitle="CONNECT 4"
      />

      {/* Match Lobby Ready Modal (Synchronized START for both players) */}
      <MatchLobbyReadyModal
        isOpen={isLobbyReady}
        gameTitle="CONNECT 4"
        myProfile={profile}
        opponentProfile={opponentProfile}
        settings={settings}
        onStartMatch={() => handleStartMatch(true)}
      />

      {/* Post-Match Victory / Defeat / Draw Result Modal */}
      <MatchResultModal
        isOpen={resultModal.isOpen}
        onClose={() => {
          setResultModal(prev => ({ ...prev, isOpen: false }));
          resetGame(true);
        }}
        outcome={resultModal.outcome}
        gameTitle="Connect 4 (7×6)"
        opponentName={gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Opponent'}
        ratingDelta={resultModal.ratingDelta}
        xpGained={resultModal.xpGained}
        currentRating={profile?.rating || 1200}
        level={profile?.level || 1}
        xp={profile?.xp || 0}
        movesCount={history.length}
        onRematch={() => {
          setResultModal(prev => ({ ...prev, isOpen: false }));
          resetGame(true);
        }}
        onGoHome={() => {
          setResultModal(prev => ({ ...prev, isOpen: false }));
          resetGame(true);
          onGoHome();
        }}
      />
    </div>
  );
}
