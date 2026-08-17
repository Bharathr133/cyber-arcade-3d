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

export default function ConnectFour({ profile, initialMode = 'VS_COMPUTER', onMatchFinished, onGoHome }) {
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

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
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
    setIsAiThinking(false);
    const emptyBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    setBoard(emptyBoard);
    setCurrentPlayer(RED);
    setWinner(null);
    setWinningCells([]);
    setHistory([]);
    setHoveredCol(null);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });

    persistCurrentState(emptyBoard, RED, scores, null, [], []);

    if (sendSync && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendReset();
    }
  }, [gameMode, scores]);

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

    // Anti-Cheat Validation
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

      setTimeout(() => {
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

  const applyDropTokenRef = useRef(applyDropToken);
  applyDropTokenRef.current = applyDropToken;
  const resetGameRef = useRef(resetGame);
  resetGameRef.current = resetGame;

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
          soundSynth.playVictory();
        },
        onDisconnect: () => setIsConnected(false)
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
  }, [gameMode]);

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

  // Smart Connect 4 AI
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && currentPlayer === YELLOW && !winner) {
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        // 1. Check if AI can win on next move
        for (let c = 0; c < COLS; c++) {
          const testBoard = curBoard.map(r => [...r]);
          for (let r = ROWS - 1; r >= 0; r--) {
            if (testBoard[r][c] === EMPTY) {
              testBoard[r][c] = YELLOW;
              const res = checkWin(testBoard);
              if (res && res.winner === YELLOW) {
                applyDropToken(c, YELLOW, false);
                return;
              }
              break;
            }
          }
        }

        // 2. Check if AI must block Player 1 from winning
        for (let c = 0; c < COLS; c++) {
          const testBoard = curBoard.map(r => [...r]);
          for (let r = ROWS - 1; r >= 0; r--) {
            if (testBoard[r][c] === EMPTY) {
              testBoard[r][c] = RED;
              const res = checkWin(testBoard);
              if (res && res.winner === RED) {
                applyDropToken(c, YELLOW, false);
                return;
              }
              break;
            }
          }
        }

        // 3. Strategic column priority: Center (3), then 2, 4, 1, 5, 0, 6
        const preferredCols = [3, 2, 4, 1, 5, 0, 6];
        for (let col of preferredCols) {
          if (curBoard[0][col] === EMPTY) {
            applyDropToken(col, YELLOW, false);
            return;
          }
        }
      }, 350);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [currentPlayer, gameMode, winner, applyDropToken]);

  const isMyTurn = gameMode === 'LOCAL_2P' || (gameMode === 'ONLINE_QR' ? currentPlayer === myRole : currentPlayer === RED);

  return (
    <div style={{
      width: '100%',
      maxWidth: '680px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Focused Match Controls: Only shows active mode badge and relevant actions */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Left Side: Single Active Mode Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          padding: '6px 14px',
          borderRadius: '10px',
          fontFamily: 'var(--font-heading)',
          fontSize: '12px',
          fontWeight: '800',
          color: '#0f172a'
        }}>
          {gameMode === 'VS_COMPUTER' ? (
            <>
              <Bot size={16} color="#0f172a" />
              <span>VS SMART AI</span>
            </>
          ) : gameMode === 'LOCAL_2P' ? (
            <>
              <User size={16} color="#0f172a" />
              <span>2-PLAYER LOCAL</span>
            </>
          ) : (
            <>
              <Wifi size={16} color={isConnected ? '#16a34a' : '#d97706'} />
              <span>ONLINE MATCH {isConnected ? '(CONNECTED)' : '(WAITING FOR FRIEND)'}</span>
            </>
          )}
        </div>

        {/* Right Side: QR Re-open & Reset */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {gameMode === 'ONLINE_QR' && (
            <button
              className="btn-secondary"
              onClick={() => setIsQrModalOpen(true)}
              style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', color: '#1e3a8a' }}
            >
              <QrCode size={14} />
              <span>ROOM QR</span>
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={() => resetGame(true)}
            title="Reset Board"
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={15} />
            <span>RESET BOARD</span>
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
      />

      {/* Hover Drop Slot Preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 62px)`,
        gap: '10px',
        height: '24px',
        marginBottom: '6px'
      }}>
        {Array.from({ length: COLS }).map((_, c) => {
          const isHovered = hoveredCol === c && board[0][c] === EMPTY && !winner && isMyTurn && !isAiThinking;
          return (
            <div key={`h-${c}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {isHovered && (
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: currentPlayer === RED ? '#991b1b' : '#d97706',
                  boxShadow: `0 0 10px ${currentPlayer === RED ? '#991b1b' : '#d97706'}`
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Connect 4 Board */}
      <div style={{
        background: '#1e3a8a',
        padding: '16px',
        borderRadius: '20px',
        boxShadow: '0 16px 40px rgba(30, 58, 138, 0.25)',
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${COLS}, 62px)`,
        gap: '10px'
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
                  width: '62px',
                  height: '62px',
                  borderRadius: '50%',
                  background: cell === RED ? '#991b1b' : cell === YELLOW ? '#d97706' : '#ffffff',
                  boxShadow: isWinningCell
                    ? '0 0 24px #ffffff, inset 0 0 10px rgba(0,0,0,0.3)'
                    : cell !== EMPTY
                      ? 'inset 0 -3px 6px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)'
                      : 'inset 0 3px 6px rgba(0,0,0,0.25)',
                  border: isWinningCell ? '3.5px solid #ffffff' : 'none',
                  cursor: board[0][c] === EMPTY && !winner && isMyTurn && !isAiThinking ? 'pointer' : 'default',
                  transform: isWinningCell ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
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

      {/* Post-Match Victory / Defeat / Draw Result Modal */}
      <MatchResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        outcome={resultModal.outcome}
        gameTitle="Connect 4 (7x6)"
        opponentName={gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2'}
        ratingDelta={resultModal.ratingDelta}
        xpGained={resultModal.xpGained}
        currentRating={profile?.rating || 1200}
        level={profile?.level || 1}
        xp={profile?.xp || 0}
        movesCount={history.length}
        onRematch={() => resetGame(true)}
        onGoHome={onGoHome}
      />
    </div>
  );
}
