import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, QrCode, Hash, Wifi } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/soundSynth.js';
import { standardMultiplayer } from '../utils/multiplayerPeer.js';
import { securityEngine } from '../utils/securityEngine.js';
import { saveGameState, loadGameState } from '../utils/gameStateStorage.js';
import StandardQrModal from '../components/StandardQrModal.jsx';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import MatchResultModal from '../components/MatchResultModal.jsx';

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1; // Player 1 (Host / Human)
const WHITE = 2; // Player 2 (Guest / AI)
const COORD_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

const DEFAULT_GOMOKU_STATE = {
  board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY)),
  currentPlayer: BLACK,
  myRole: BLACK,
  winner: null,
  winningStones: [],
  history: [],
  scores: { black: 0, white: 0, draws: 0 }
};

export default function GomokuGame({ profile, initialMode = 'VS_COMPUTER', onMatchFinished, onGoHome }) {
  const isJoinedGuest = typeof window !== 'undefined' && window.location.search.includes('join=');
  const effectiveMode = isJoinedGuest ? 'ONLINE_QR' : initialMode;

  const [initialState] = useState(() => loadGameState('gomoku', DEFAULT_GOMOKU_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [gameMode] = useState(effectiveMode);
  const [myRole, setMyRole] = useState(isJoinedGuest ? WHITE : BLACK);
  const [winner, setWinner] = useState(initialState.winner);
  const [winningStones, setWinningStones] = useState(initialState.winningStones || []);
  const [history, setHistory] = useState(initialState.history || []);
  const [scores, setScores] = useState(initialState.scores || { black: 0, white: 0, draws: 0 });
  const [showMoveNumbers, setShowMoveNumbers] = useState(false);
  const [hoverCoord, setHoverCoord] = useState(null);
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

  const persistCurrentState = (updatedBoard, nextPlayer, updatedScores, updatedHistory, curWinner, curWinningStones) => {
    saveGameState('gomoku', {
      board: updatedBoard,
      currentPlayer: nextPlayer,
      scores: updatedScores,
      history: updatedHistory,
      winner: curWinner,
      winningStones: curWinningStones,
      gameMode,
      myRole: myRoleRef.current
    });
  };

  const checkWin = (grid, lastR, lastC, player) => {
    const DIRS = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal Down-Right
      { dr: 1, dc: -1 }  // Diagonal Down-Left
    ];

    for (let { dr, dc } of DIRS) {
      let count = 1;
      const stones = [[lastR, lastC]];

      let r = lastR + dr;
      let c = lastC + dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === player) {
        count++;
        stones.push([r, c]);
        r += dr;
        c += dc;
      }

      r = lastR - dr;
      c = lastC - dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && grid[r][c] === player) {
        count++;
        stones.push([r, c]);
        r -= dr;
        c -= dc;
      }

      if (count >= 5) {
        return { winner: player, stones };
      }
    }

    const isFull = grid.every(row => row.every(cell => cell !== EMPTY));
    if (isFull) return { winner: 'DRAW', stones: [] };

    return null;
  };

  const resetGame = useCallback((sendSync = false) => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsAiThinking(false);

    const emptyBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    setBoard(emptyBoard);
    setCurrentPlayer(BLACK);
    setWinner(null);
    setWinningStones([]);
    setHistory([]);
    setHoverCoord(null);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });

    persistCurrentState(emptyBoard, BLACK, scores, [], null, []);

    if (sendSync && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendReset();
    }
  }, [gameMode, scores]);

  const applyMove = useCallback((r, c, player, isRemote = false) => {
    const curBoard = boardRef.current;
    if (winnerRef.current) return false;

    if (isRemote) {
      const isValid = securityEngine.validateGomokuMove(
        { r, c, player },
        curBoard,
        myRoleRef.current === BLACK ? WHITE : BLACK,
        currentPlayerRef.current
      );
      if (!isValid) {
        console.warn('Anti-Cheat: Rejected remote move:', { r, c, player });
        return false;
      }
    } else {
      if (curBoard[r][c] !== EMPTY) return false;
    }

    soundSynth.playRotate();

    const newBoard = curBoard.map(row => [...row]);
    newBoard[r][c] = player;
    const newHistory = [...historyRef.current, { r, c, player }];

    setBoard(newBoard);
    setHistory(newHistory);

    const winResult = checkWin(newBoard, r, c, player);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningStones(winResult.stones);
      soundSynth.playVictory();

      let outcome = 'DRAW';
      let delta = 2;
      let xp = 15;

      const updatedScores = { ...scores };

      if (winResult.winner === BLACK) {
        updatedScores.black = (updatedScores.black || 0) + 1;
        outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current !== BLACK) ? 'LOSS' : 'WIN';
        delta = outcome === 'WIN' ? 16 : -10;
        xp = outcome === 'WIN' ? 30 : 10;
      } else if (winResult.winner === WHITE) {
        updatedScores.white = (updatedScores.white || 0) + 1;
        outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current === WHITE) ? 'WIN' : (gameMode === 'VS_COMPUTER' ? 'LOSS' : 'WIN');
        delta = outcome === 'WIN' ? 16 : -10;
        xp = outcome === 'WIN' ? 30 : 10;
      } else {
        updatedScores.draws = (updatedScores.draws || 0) + 1;
      }

      setScores(updatedScores);
      persistCurrentState(newBoard, player, updatedScores, newHistory, winResult.winner, winResult.stones);

      if (winResult.winner !== 'DRAW' && outcome === 'WIN') {
        try { confetti({ particleCount: 75, spread: 65, origin: { y: 0.65 } }); } catch (e) {}
      }

      if (onMatchFinished) {
        onMatchFinished('gomoku', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2');
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
      const nextTurn = player === BLACK ? WHITE : BLACK;
      setCurrentPlayer(nextTurn);
      persistCurrentState(newBoard, nextTurn, scores, newHistory, null, []);
    }

    if (!isRemote && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendMove({ r, c, player });
    }

    return true;
  }, [gameMode, scores, onMatchFinished]);

  const applyMoveRef = useRef(applyMove);
  applyMoveRef.current = applyMove;
  const resetGameRef = useRef(resetGame);
  resetGameRef.current = resetGame;

  // Stable WebRTC Setup
  useEffect(() => {
    if (gameMode === 'ONLINE_QR') {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get('join');

      const handlers = {
        onMove: (move) => applyMoveRef.current(move.r, move.c, move.player, true),
        onReset: () => resetGameRef.current(false),
        onConnect: () => {
          setIsConnected(true);
          soundSynth.playVictory();
        },
        onDisconnect: () => setIsConnected(false)
      };

      if (joinParam) {
        setMyRole(WHITE);
        setIsConnected(false);
        standardMultiplayer.joinRoom(joinParam, handlers);
      } else {
        setMyRole(BLACK);
        setIsConnected(false);
        const { shareUrl: url } = standardMultiplayer.createRoom('gomoku', handlers);
        setShareUrl(url);
        setIsQrModalOpen(true);
      }

      return () => {
        standardMultiplayer.cleanup();
      };
    }
  }, [gameMode]);

  const handleCellClick = (r, c) => {
    if (isAiThinking || winner) return;

    if (gameMode === 'ONLINE_QR') {
      if (currentPlayer !== myRole || !isConnected) return;
      applyMove(r, c, myRole, false);
    } else if (gameMode === 'VS_COMPUTER') {
      if (currentPlayer !== BLACK) return;
      applyMove(r, c, BLACK, false);
    } else {
      applyMove(r, c, currentPlayer, false);
    }
  };

  // Smart Gomoku AI Engine
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && currentPlayer === WHITE && !winner) {
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        let bestScore = -1;
        let bestMoves = [];

        const evaluateDirection = (r, c, dr, dc, player) => {
          let count = 0;
          let openEnds = 0;

          let tr = r + dr;
          let tc = c + dc;
          while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && curBoard[tr][tc] === player) {
            count++;
            tr += dr;
            tc += dc;
          }
          if (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && curBoard[tr][tc] === EMPTY) openEnds++;

          tr = r - dr;
          tc = c - dc;
          while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && curBoard[tr][tc] === player) {
            count++;
            tr -= dr;
            tc -= dc;
          }
          if (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && curBoard[tr][tc] === EMPTY) openEnds++;

          if (count >= 4) return 100000;
          if (count === 3 && openEnds === 2) return 10000;
          if (count === 3 && openEnds === 1) return 1500;
          if (count === 2 && openEnds === 2) return 800;
          if (count === 2 && openEnds === 1) return 120;
          if (count === 1 && openEnds === 2) return 50;
          return 0;
        };

        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (curBoard[r][c] === EMPTY) {
              let hasNeighbor = false;
              for (let dr = -2; dr <= 2 && !hasNeighbor; dr++) {
                for (let dc = -2; dc <= 2 && !hasNeighbor; dc++) {
                  const nr = r + dr;
                  const nc = c + dc;
                  if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && curBoard[nr][nc] !== EMPTY) {
                    hasNeighbor = true;
                  }
                }
              }

              if (!hasNeighbor && historyRef.current.length > 0) continue;

              const DIRS = [{ dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }];
              let attackScore = 0;
              let defenseScore = 0;

              DIRS.forEach(({ dr, dc }) => {
                attackScore += evaluateDirection(r, c, dr, dc, WHITE);
                defenseScore += evaluateDirection(r, c, dr, dc, BLACK);
              });

              let cellScore = (attackScore * 1.15) + (defenseScore * 1.05);
              const distFromCenter = Math.abs(r - 7) + Math.abs(c - 7);
              cellScore += (14 - distFromCenter);

              if (cellScore > bestScore) {
                bestScore = cellScore;
                bestMoves = [{ r, c }];
              } else if (cellScore === bestScore) {
                bestMoves.push({ r, c });
              }
            }
          }
        }

        if (bestMoves.length > 0) {
          const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
          applyMove(chosen.r, chosen.c, WHITE, false);
        } else {
          applyMove(7, 7, WHITE, false);
        }
      }, 350);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [currentPlayer, gameMode, winner, applyMove]);

  const lastMove = history[history.length - 1];
  const isMyTurn = gameMode === 'LOCAL_2P' || (gameMode === 'ONLINE_QR' ? currentPlayer === myRole : currentPlayer === BLACK);

  return (
    <div style={{
      width: '100%',
      maxWidth: '560px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 4px'
    }}>
      {/* Focused Match Controls: Mobile Adaptive Header */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
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
          <button
            className="btn-secondary"
            onClick={() => setShowMoveNumbers(!showMoveNumbers)}
            title="Toggle Move Numbers"
            style={{ padding: '6px 10px', borderRadius: '8px', minHeight: '36px' }}
          >
            <Hash size={14} color={showMoveNumbers ? '#0f172a' : '#64748b'} />
          </button>

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
        p1Score={scores.black}
        p1Symbol="BLACK"
        p1Color="#0f172a"
        p2Name={gameMode === 'VS_COMPUTER' ? 'Smart AI' : (gameMode === 'ONLINE_QR' ? 'Player 2' : 'Player 2')}
        p2AvatarId="2"
        p2Rating={1200}
        p2Score={scores.white}
        p2Symbol="WHITE"
        p2Color="#475569"
        isP1Turn={currentPlayer === BLACK}
        isGameOver={!!winner}
        gameMode={gameMode}
        winnerText={
          winner === BLACK ? (gameMode === 'VS_COMPUTER' ? 'YOU WIN' : 'BLACK WINS') :
          winner === WHITE ? (gameMode === 'VS_COMPUTER' ? 'AI WINS' : 'WHITE WINS') :
          winner === 'DRAW' ? 'DRAW' : null
        }
      />

      {/* 100% Fluid Mobile-Responsive 15x15 Gomoku Sheet */}
      <div style={{
        background: '#e4d5b7',
        padding: 'clamp(6px, 2vw, 16px)',
        borderRadius: '16px',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
        border: '2.5px solid #b8a581',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Top Coordinates (A-O) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          width: '100%',
          textAlign: 'center',
          marginBottom: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(8px, 1.8vw, 10px)',
          fontWeight: '700',
          color: '#78694a'
        }}>
          {COORD_LETTERS.map(letter => (
            <span key={letter} style={{ overflow: 'hidden' }}>{letter}</span>
          ))}
        </div>

        {/* Board 15x15 Grid with Fluid Aspect Ratio */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
          width: '100%',
          aspectRatio: '1 / 1',
          gap: '0px'
        }}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWinning = winningStones.some(([wr, wc]) => wr === r && wc === c);
              const isLast = lastMove && lastMove.r === r && lastMove.c === c;
              const moveIdx = history.findIndex(h => h.r === r && h.c === c);
              const isHovered = hoverCoord && hoverCoord.r === r && hoverCoord.c === c && cell === EMPTY && !winner && isMyTurn && !isAiThinking;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => setHoverCoord({ r, c })}
                  onMouseLeave={() => setHoverCoord(null)}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: cell === EMPTY && !winner && isMyTurn && !isAiThinking ? 'pointer' : 'default',
                    touchAction: 'manipulation'
                  }}
                >
                  {/* Grid Lines */}
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: c === 0 ? '50%' : 0, right: c === BOARD_SIZE - 1 ? '50%' : 0,
                    height: '1.2px', background: '#78694a', zIndex: 0
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%', top: r === 0 ? '50%' : 0, bottom: r === BOARD_SIZE - 1 ? '50%' : 0,
                    width: '1.2px', background: '#78694a', zIndex: 0
                  }} />

                  {/* Star Points (Hoshi) */}
                  {((r === 3 || r === 11 || r === 7) && (c === 3 || c === 11 || c === 7)) && (
                    <div style={{
                      position: 'absolute', width: '4px', height: '4px',
                      borderRadius: '50%', background: '#78694a', zIndex: 1
                    }} />
                  )}

                  {/* Placed Stone - 100% Scaled to Grid Cell */}
                  {cell !== EMPTY && (
                    <div style={{
                      width: '88%',
                      height: '88%',
                      borderRadius: '50%',
                      background: cell === BLACK
                        ? 'radial-gradient(circle at 35% 35%, #475569, #0f172a)'
                        : 'radial-gradient(circle at 35% 35%, #ffffff, #e2e8f0)',
                      boxShadow: isWinning
                        ? '0 0 12px #eab308, 0 2px 4px rgba(0,0,0,0.4)'
                        : '0 1.5px 3px rgba(0,0,0,0.3)',
                      border: isWinning
                        ? '2px solid #eab308'
                        : (cell === WHITE ? '1px solid #cbd5e1' : 'none'),
                      zIndex: 2,
                      transform: isWinning ? 'scale(1.15)' : 'scale(1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cell === BLACK ? '#ffffff' : '#0f172a',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(7px, 1.6vw, 10px)',
                      fontWeight: '800',
                      transition: 'transform 0.15s ease'
                    }}>
                      {showMoveNumbers && moveIdx !== -1 ? (
                        moveIdx + 1
                      ) : isLast ? (
                        <div style={{
                          width: '24%', height: '24%', borderRadius: '50%',
                          background: cell === BLACK ? '#ffffff' : '#0f172a'
                        }} />
                      ) : null}
                    </div>
                  )}

                  {/* Ghost Hover Preview */}
                  {isHovered && (
                    <div style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '50%',
                      background: currentPlayer === BLACK ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                      border: '1px dashed #78694a',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Standard QR Modal */}
      <StandardQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        shareUrl={shareUrl}
        isConnected={isConnected}
        gameTitle="GOMOKU"
      />

      {/* Post-Match Victory / Defeat / Draw Result Modal */}
      <MatchResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        outcome={resultModal.outcome}
        gameTitle="Gomoku (15x15)"
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
