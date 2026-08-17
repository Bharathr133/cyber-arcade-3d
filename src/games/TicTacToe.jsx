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

const DEFAULT_TTT_STATE = {
  board: Array(9).fill(null),
  isXNext: true,
  myRole: 'X',
  winner: null,
  winningLine: [],
  scores: { x: 0, o: 0, draws: 0 },
  history: []
};

export default function TicTacToe({ profile, initialMode = 'VS_COMPUTER', onMatchFinished, onGoHome }) {
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
  const isXNextRef = useRef(isXNext);
  isXNextRef.current = isXNext;
  const aiTimeoutRef = useRef(null);

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
    setIsAiThinking(false);
    const emptyBoard = Array(9).fill(null);
    setBoard(emptyBoard);
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    setHistory([]);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });

    persistCurrentState(emptyBoard, true, scores, null, [], []);

    if (sendSync && gameMode === 'ONLINE_QR') {
      standardMultiplayer.sendReset();
    }
  }, [gameMode, scores]);

  const applyMove = useCallback((index, symbol, isRemote = false) => {
    const curBoard = boardRef.current;
    if (winnerRef.current) return;

    // Anti-Cheat Validation
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

      setTimeout(() => {
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
        onMove: (move) => applyMoveRef.current(move.index, move.symbol, true),
        onReset: () => resetGameRef.current(false),
        onConnect: () => {
          setIsConnected(true);
          soundSynth.playVictory();
        },
        onDisconnect: () => setIsConnected(false)
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
  }, [gameMode]);

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
    <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
      />

      {/* 3x3 Grid Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 116px)',
        gridTemplateRows: 'repeat(3, 116px)',
        gap: '12px',
        padding: '18px',
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {board.map((cell, idx) => {
          const isWinning = winningLine.includes(idx);

          return (
            <button
              key={idx}
              disabled={!!cell || !!winner || !isMyTurn || isAiThinking}
              onClick={() => handleClick(idx)}
              style={{
                width: '116px',
                height: '116px',
                background: isWinning ? '#f0fdf4' : '#f8fafc',
                border: isWinning ? '2.5px solid #16a34a' : '1.5px solid #e2e8f0',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !cell && !winner && isMyTurn && !isAiThinking ? 'pointer' : 'default',
                boxShadow: isWinning ? '0 0 20px rgba(22, 163, 74, 0.25)' : 'none',
                transform: isWinning ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s ease'
              }}
            >
              {cell === 'X' && <IconX size={58} color="#1e3a8a" strokeWidth={2.6} className="animate-pop-in" />}
              {cell === 'O' && <IconO size={52} color="#881337" strokeWidth={2.6} className="animate-pop-in" />}
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

      {/* Post-Match Victory / Defeat / Draw Result Modal */}
      <MatchResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        outcome={resultModal.outcome}
        gameTitle="Tic-Tac-Toe (3x3)"
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
