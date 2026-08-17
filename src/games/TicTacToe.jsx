import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, X as IconX, Circle as IconO, QrCode, Wifi } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/soundSynth.js';
import { standardMultiplayer } from '../utils/multiplayerPeer.js';
import { securityEngine } from '../utils/securityEngine.js';
import { saveGameState, loadGameState } from '../utils/gameStateStorage.js';
import StandardQrModal from '../components/StandardQrModal.jsx';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import MatchResultModal from '../components/MatchResultModal.jsx';
import MatchLobbyReadyModal from '../components/MatchLobbyReadyModal.jsx';

const DEFAULT_TTT_STATE = {
  board: Array(9).fill(null),
  isXNext: true,
  myRole: 'X',
  winner: null,
  winningLine: [],
  scores: { x: 0, o: 0, draws: 0 },
  history: []
};

export default function TicTacToe({ profile, initialMode = 'VS_COMPUTER', settings, onMatchFinished, onGoHome }) {
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;
  const isJoinedGuest = typeof window !== 'undefined' && window.location.search.includes('join=');
  const effectiveMode = isJoinedGuest ? 'ONLINE_QR' : initialMode;

  const [initialState] = useState(() => loadGameState('tictactoe', DEFAULT_TTT_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [isXNext, setIsXNext] = useState(initialState.isXNext);
  const [gameMode] = useState(effectiveMode);
  const [myRole, setMyRole] = useState(isJoinedGuest ? 'O' : 'X');
  const [winner, setWinner] = useState(initialState.winner);
  const [winningLine, setWinningLine] = useState(initialState.winningLine || []);
  const [scores, setScores] = useState(initialState.scores || { x: 0, o: 0, draws: 0 });
  const [history, setHistory] = useState(initialState.history || []);
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
  const isXNextRef = useRef(isXNext);
  isXNextRef.current = isXNext;
  const aiTimeoutRef = useRef(null);
  const resultModalTimeoutRef = useRef(null);

  const persistCurrentState = (updatedBoard, nextTurn, updatedScores, curWinner, curLine, updatedHistory) => {
    saveGameState('tictactoe', {
      board: updatedBoard,
      isXNext: nextTurn,
      scores: updatedScores,
      winner: curWinner,
      winningLine: curLine,
      history: updatedHistory,
      gameMode,
      myRole: myRoleRef.current
    });
  };

  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const checkWinner = (squares) => {
    for (let combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: combo };
      }
    }
    if (squares.every(sq => sq !== null)) {
      return { winner: 'DRAW', line: [] };
    }
    return null;
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
    const emptyBoard = Array(9).fill(null);
    setBoard(emptyBoard);
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    setHistory([]);
    setTimeLeft(turnTimeLimit > 0 ? turnTimeLimit : 30);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });

    persistCurrentState(emptyBoard, true, scores, null, [], []);

    if (sendSync && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendReset();
    }
  }, [gameMode, scores, turnTimeLimit]);

  const applyMove = useCallback((index, symbol, isRemote = false) => {
    const curBoard = boardRef.current;
    if (winnerRef.current) return;

    if (isRemote) {
      const isValid = securityEngine.validateTicTacToeMove(
        { index, symbol },
        curBoard,
        myRoleRef.current === 'X' ? 'O' : 'X',
        isXNextRef.current
      );
      if (!isValid) {
        console.warn('Anti-Cheat: Rejected remote Tic-Tac-Toe move:', { index, symbol });
        return;
      }
    } else {
      if (curBoard[index]) return;
    }

    soundSynth.playRotate();

    const newBoard = [...curBoard];
    newBoard[index] = symbol;
    const newHistory = [...historyRef.current, { index, symbol }];

    setBoard(newBoard);
    setHistory(newHistory);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningLine(winResult.line);
      soundSynth.playVictory();

      let outcome = 'DRAW';
      let delta = 2;
      let xp = 15;

      const updatedScores = { ...scores };

      if (winResult.winner === 'X') {
        updatedScores.x = (updatedScores.x || 0) + 1;
        outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current !== 'X') ? 'LOSS' : 'WIN';
        delta = outcome === 'WIN' ? 16 : -10;
        xp = outcome === 'WIN' ? 30 : 10;
      } else if (winResult.winner === 'O') {
        updatedScores.o = (updatedScores.o || 0) + 1;
        outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current === 'O') ? 'WIN' : (gameMode === 'VS_COMPUTER' ? 'LOSS' : 'WIN');
        delta = outcome === 'WIN' ? 16 : -10;
        xp = outcome === 'WIN' ? 30 : 10;
      } else {
        updatedScores.draws = (updatedScores.draws || 0) + 1;
      }

      setScores(updatedScores);
      persistCurrentState(newBoard, symbol !== 'X', updatedScores, winResult.winner, winResult.line, newHistory);

      if (winResult.winner !== 'DRAW' && outcome === 'WIN') {
        try { confetti({ particleCount: 65, spread: 55, origin: { y: 0.65 } }); } catch (e) {}
      }

      if (onMatchFinished) {
        onMatchFinished('tictactoe', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2');
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
      const nextTurn = symbol !== 'X';
      setIsXNext(nextTurn);
      persistCurrentState(newBoard, nextTurn, scores, null, [], newHistory);
    }

    if (!isRemote && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendMove({ index, symbol });
    }
  }, [gameMode, scores, onMatchFinished]);

  const handleTimeoutForfeit = useCallback((timedOutSymbol) => {
    if (winnerRef.current) return;
    const winningSymbol = timedOutSymbol === 'X' ? 'O' : 'X';
    setWinner(winningSymbol);
    soundSynth.playVictory();

    const outcome = (gameMode === 'ONLINE_QR' && myRoleRef.current !== winningSymbol) ? 'LOSS' : (gameMode === 'VS_COMPUTER' && timedOutSymbol === 'X' ? 'LOSS' : 'WIN');
    const delta = outcome === 'WIN' ? 20 : -10;
    const xp = outcome === 'WIN' ? 40 : 10;

    const updatedScores = { ...scores };
    if (winningSymbol === 'X') updatedScores.x = (updatedScores.x || 0) + 1;
    else updatedScores.o = (updatedScores.o || 0) + 1;
    setScores(updatedScores);

    if (outcome === 'WIN') {
      try { confetti({ particleCount: 75, spread: 65, origin: { y: 0.65 } }); } catch (e) {}
    }

    if (onMatchFinished) {
      onMatchFinished('tictactoe', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Opponent');
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
  }, [isXNext, winner, turnTimeLimit]);

  // Safe Timeout Trigger (Runs cleanly outside reducer only when match has started)
  useEffect(() => {
    if (timeLeft === 0 && !winner && turnTimeLimit > 0 && history.length > 0) {
      handleTimeoutForfeitRef.current(isXNext ? 'X' : 'O');
    }
  }, [timeLeft, winner, turnTimeLimit, isXNext, history.length]);

  // Online Disconnect Forfeit (15s Reconnect Grace Period)
  useEffect(() => {
    let disconnectTimer = null;
    if (gameMode === 'ONLINE_QR' && !isConnected && !winner && history.length > 0) {
      disconnectTimer = setTimeout(() => {
        if (!isConnected && !winnerRef.current) {
          handleTimeoutForfeitRef.current(myRoleRef.current === 'X' ? 'O' : 'X');
        }
      }, 15000);
    }
    return () => {
      if (disconnectTimer) clearTimeout(disconnectTimer);
    };
  }, [gameMode, isConnected, winner, history.length]);

  const applyMoveRef = useRef(applyMove);
  applyMoveRef.current = applyMove;
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
        onMove: (move) => applyMoveRef.current(move.index, move.symbol, true),
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
        setMyRole('O');
        setIsConnected(false);
        standardMultiplayer.joinRoom(joinParam, handlers);
      } else {
        setMyRole('X');
        setIsConnected(false);
        const { shareUrl: url } = standardMultiplayer.createRoom('tictactoe', handlers);
        setShareUrl(url);
        setIsQrModalOpen(true);
      }

      return () => {
        standardMultiplayer.cleanup();
      };
    }
  }, [gameMode, profile?.name, profile?.avatarId, profile?.rating]);

  const handleClick = (index) => {
    if (isAiThinking || winner) return;
    const currentSymbol = isXNext ? 'X' : 'O';

    if (gameMode === 'ONLINE_QR') {
      if (currentSymbol !== myRole || !isConnected) return;
      applyMove(index, myRole, false);
    } else if (gameMode === 'VS_COMPUTER') {
      if (!isXNext) return;
      applyMove(index, 'X', false);
    } else {
      applyMove(index, currentSymbol, false);
    }
  };

  // Smart Tic-Tac-Toe AI
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && !isXNext && !winner) {
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        // 1. Check if AI can win immediately
        for (let i = 0; i < 9; i++) {
          if (!curBoard[i]) {
            const test = [...curBoard];
            test[i] = 'O';
            const res = checkWinner(test);
            if (res && res.winner === 'O') {
              applyMove(i, 'O', false);
              return;
            }
          }
        }

        // 2. Check if AI must block X
        for (let i = 0; i < 9; i++) {
          if (!curBoard[i]) {
            const test = [...curBoard];
            test[i] = 'X';
            const res = checkWinner(test);
            if (res && res.winner === 'X') {
              applyMove(i, 'O', false);
              return;
            }
          }
        }

        // 3. Center Priority
        if (!curBoard[4]) {
          applyMove(4, 'O', false);
          return;
        }

        // 4. Corners Priority
        const corners = [0, 2, 6, 8, 1, 3, 5, 7];
        for (let idx of corners) {
          if (!curBoard[idx]) {
            applyMove(idx, 'O', false);
            return;
          }
        }
      }, 300);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [isXNext, gameMode, winner, applyMove]);

  const currentSymbol = isXNext ? 'X' : 'O';
  const isMyTurn = gameMode === 'LOCAL_2P' || (gameMode === 'ONLINE_QR' ? currentSymbol === myRole : isXNext);

  return (
    <div style={{
      width: '100%',
      maxWidth: 'min(380px, calc(100dvh - 125px), 100vw)',
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
        p1Score={scores.x}
        p1Symbol="CROSS"
        p1Color="#1e3a8a"
        p2Name={gameMode === 'VS_COMPUTER' ? 'Smart AI' : (gameMode === 'ONLINE_QR' ? 'Player 2' : 'Player 2')}
        p2AvatarId="2"
        p2Rating={1200}
        p2Score={scores.o}
        p2Symbol="CIRCLE"
        p2Color="#881337"
        isP1Turn={isXNext}
        isGameOver={!!winner}
        gameMode={gameMode}
        winnerText={
          winner === 'X' ? (gameMode === 'VS_COMPUTER' ? 'YOU WIN' : 'X WINS') :
          winner === 'O' ? (gameMode === 'VS_COMPUTER' ? 'AI WINS' : 'O WINS') :
          winner === 'DRAW' ? 'DRAW' : null
        }
        timeLeft={timeLeft}
      />

      {/* 100% Fluid Mobile 3x3 Grid Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 'clamp(6px, 2vw, 12px)',
        padding: 'clamp(10px, 3vw, 18px)',
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        aspectRatio: '1 / 1',
        boxSizing: 'border-box'
      }}>
        {board.map((cell, idx) => {
          const isWinning = winningLine.includes(idx);

          return (
            <button
              key={idx}
              disabled={!!cell || !!winner || !isMyTurn || isAiThinking}
              onClick={() => handleClick(idx)}
              style={{
                width: '100%',
                height: '100%',
                background: isWinning ? '#f0fdf4' : '#f8fafc',
                border: isWinning ? '2.5px solid #16a34a' : '1.5px solid #e2e8f0',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !cell && !winner && isMyTurn && !isAiThinking ? 'pointer' : 'default',
                boxShadow: isWinning ? '0 0 20px rgba(22, 163, 74, 0.25)' : 'none',
                transform: isWinning ? 'scale(1.04)' : 'scale(1)',
                transition: 'all 0.15s ease',
                touchAction: 'manipulation'
              }}
            >
              {cell === 'X' && (
                <IconX
                  size={typeof window !== 'undefined' && window.innerWidth < 480 ? 38 : 54}
                  color="#1e3a8a"
                  strokeWidth={2.6}
                  className="animate-pop-in"
                />
              )}
              {cell === 'O' && (
                <IconO
                  size={typeof window !== 'undefined' && window.innerWidth < 480 ? 34 : 48}
                  color="#881337"
                  strokeWidth={2.6}
                  className="animate-pop-in"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Standard QR Modal */}
      <StandardQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        shareUrl={shareUrl}
        isConnected={isConnected}
        gameTitle="TIC-TAC-TOE"
      />

      {/* Match Lobby Ready Modal (Synchronized START for both players) */}
      <MatchLobbyReadyModal
        isOpen={isLobbyReady}
        gameTitle="TIC-TAC-TOE"
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
        gameTitle="Tic-Tac-Toe (3×3)"
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
