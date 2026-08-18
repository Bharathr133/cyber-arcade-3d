import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, Wifi, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/soundSynth.js';
import { realtimeManager } from '../services/realtimeManager.js';
import { gameEngineService } from '../services/gameEngineService.js';
import { saveGameState, loadGameState } from '../utils/gameStateStorage.js';
import { getUserProfile } from '../utils/userProfile.js';
import LiveEmojiReactionSystem from '../components/LiveEmojiReactionSystem.jsx';
import { getSupabase } from '../utils/supabaseClient.js';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import MatchResultModal from '../components/MatchResultModal.jsx';

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1; // Player 1 (Host / Black)
const WHITE = 2; // Player 2 (Guest / White)
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

export default function GomokuGame({ 
  profile, 
  initialMode = 'VS_COMPUTER', 
  onlineSession = null, 
  settings, 
  onMatchFinished, 
  onGoHome 
}) {
  const isOnline = initialMode === 'ONLINE_MATCH' && !!onlineSession?.matchId;
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;

  const [initialState] = useState(() => loadGameState('gomoku', DEFAULT_GOMOKU_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [gameMode] = useState(isOnline ? 'ONLINE_MATCH' : initialMode);
  const [myRole, setMyRole] = useState(onlineSession?.myRole === 'O' ? WHITE : BLACK);
  const [winner, setWinner] = useState(initialState.winner);
  const [winningStones, setWinningStones] = useState(initialState.winningStones || []);
  const [history, setHistory] = useState(initialState.history || []);
  const [scores, setScores] = useState(initialState.scores || { black: 0, white: 0, draws: 0 });
  const [showMoveNumbers, setShowMoveNumbers] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED');
  const [disconnectCountdown, setDisconnectCountdown] = useState(null);

  // Result Modal State
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    outcome: null,
    ratingDelta: 0,
    xpGained: 0
  });

  // Turn Clock
  const [timeLeft, setTimeLeft] = useState(30);
  const [opponentProfile, setOpponentProfile] = useState(onlineSession?.opponent || { name: 'Opponent', avatarId: '2', rating: 1200 });
  const [incomingReaction, setIncomingReaction] = useState(null);

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

  // Realtime Integration for Online Match
  useEffect(() => {
    if (!isOnline || !onlineSession?.matchId) return;

    setMyRole(onlineSession.myRole === 'O' ? WHITE : BLACK);
    if (onlineSession.opponent) setOpponentProfile(onlineSession.opponent);

    const matchId = onlineSession.matchId;

    realtimeManager.subscribeToMatch(matchId, profile?.id, {
      onReactionEmoji: (reactionData) => {
        if (reactionData) {
          setIncomingReaction({
            emoji: reactionData.emoji,
            sender: reactionData.sender,
            timestamp: Date.now()
          });
        }
      },
      onStateUpdate: (serverState) => {

        if (!serverState) return;
        const incomingBoard = serverState.board_state || serverState.board;
        const rawTurn = serverState.current_turn || serverState.turn;
        const incomingTurn = (rawTurn === 'X' || rawTurn === 'BLACK' || rawTurn === 'P1') ? BLACK : WHITE;
        const incomingResult = serverState.status || serverState.result;
        const winnerId = serverState.winner_id || serverState.winnerId;

        if (incomingBoard && Array.isArray(incomingBoard) && incomingBoard.length === BOARD_SIZE) {
          setBoard(incomingBoard);
          setCurrentPlayer(incomingTurn);

          if (incomingResult && incomingResult !== 'ACTIVE') {
            const isWin = incomingResult === 'WIN';
            const winStone = isWin ? (winnerId === profile?.id ? myRoleRef.current : (myRoleRef.current === BLACK ? WHITE : BLACK)) : 'DRAW';
            setWinner(winStone);

            const outcome = winnerId === profile?.id ? 'WIN' : (incomingResult === 'DRAW' ? 'DRAW' : 'LOSS');
            const delta = outcome === 'WIN' ? 16 : (outcome === 'DRAW' ? 0 : -16);

            setResultModal({
              isOpen: true,
              outcome,
              ratingDelta: delta,
              xpGained: outcome === 'WIN' ? 30 : 10
            });

            if (onMatchFinished) {
              onMatchFinished('gomoku', outcome, opponentProfile?.name || 'Opponent');
            }
          }
        }
      },
      onOpponentDisconnect: () => {
        setConnectionStatus('OPPONENT_DISCONNECTED');
        let count = 30;
        setDisconnectCountdown(count);
        const timer = setInterval(() => {
          count -= 1;
          setDisconnectCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            setWinner(myRoleRef.current);
            setResultModal({
              isOpen: true,
              outcome: 'WIN',
              ratingDelta: 16,
              xpGained: 30
            });
            if (onMatchFinished) {
              onMatchFinished('gomoku', 'WIN', opponentProfile?.name || 'Opponent');
            }
          }
        }, 1000);
      },
      onOpponentReconnect: () => {
        setConnectionStatus('CONNECTED');
        setDisconnectCountdown(null);
      },
      onMatchAbandoned: () => {
        setWinner(myRoleRef.current);
        setResultModal({
          isOpen: true,
          outcome: 'WIN',
          ratingDelta: 16,
          xpGained: 30
        });
        if (onMatchFinished) {
          onMatchFinished('gomoku', 'WIN', opponentProfile?.name || 'Opponent');
        }
      }
    });


    // Refresh Recovery: Synchronize current authoritative match state & opponent profile
    async function syncLatestState() {
      try {
        const supabase = getSupabase();
        if (supabase && matchId) {
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
            if (rawBoard && Array.isArray(rawBoard) && rawBoard.length === BOARD_SIZE) {
              setBoard(rawBoard);
              const incomingTurn = (rawTurn === 'X' || rawTurn === 'BLACK' || rawTurn === 'P1') ? BLACK : WHITE;
              setCurrentPlayer(incomingTurn);
              if (rawResult && rawResult !== 'ACTIVE') {
                const isWin = rawResult === 'WIN';
                const winStone = isWin ? (winnerId === profile?.id ? myRoleRef.current : (myRoleRef.current === BLACK ? WHITE : BLACK)) : 'DRAW';
                setWinner(winStone);
              }
            }
          }

          const { data: matchData } = await supabase
            .from('matches')
            .select('player_1_id, player_2_id')
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
                  name: oppProfile.display_name || oppProfile.username || 'Opponent',
                  avatarId: oppProfile.avatar_url || '2',
                  rating: 1200
                });
              }
            }
          }
        }
      } catch (e) {}
    }

    syncLatestState();

    return () => {
      realtimeManager.unsubscribe();
    };
  }, [isOnline, onlineSession?.matchId, profile?.id, onGoHome]);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (resultModalTimeoutRef.current) clearTimeout(resultModalTimeoutRef.current);
    setIsAiThinking(false);
    const emptyBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    setBoard(emptyBoard);
    setCurrentPlayer(BLACK);
    setWinner(null);
    setWinningStones([]);
    setHistory([]);
    setTimeLeft(turnTimeLimit > 0 ? turnTimeLimit : 30);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });
  }, [turnTimeLimit]);

  const handlePlaceStone = async (r, c) => {
    if (winner || board[r][c] !== EMPTY || isAiThinking || isSubmittingMove) return;

    if (isOnline) {
      if (currentPlayer !== myRole) return;

      setIsSubmittingMove(true);
      soundSynth.playRotate();

      // Optimistic instant board update
      const optimisticBoard = board.map(row => [...row]);
      optimisticBoard[r][c] = myRole;
      const nextTurn = myRole === BLACK ? WHITE : BLACK;
      setBoard(optimisticBoard);
      setCurrentPlayer(nextTurn);

      const winResult = checkWin(optimisticBoard, r, c, myRole);
      const isWin = winResult?.winner && winResult.winner !== 'DRAW';
      const isDraw = winResult?.winner === 'DRAW';
      const outcomeResult = isWin ? 'WIN' : (isDraw ? 'DRAW' : 'ACTIVE');

      // Zero-latency broadcast to opponent (<10ms)
      realtimeManager.broadcastToMatch(onlineSession.matchId, 'match_move', {
        board: optimisticBoard,
        turn: nextTurn,
        result: outcomeResult,
        winner_id: isWin ? profile?.id : null
      });

      try {
        const movePayload = {
          row: r,
          col: c,
          board: optimisticBoard,
          turn: nextTurn,
          result: outcomeResult,
          winnerSymbol: winResult?.winner || null
        };
        const res = await gameEngineService.submitMove(onlineSession.matchId, movePayload, profile?.id);
        if (res?.success && res.state) {
          const finalBoard = res.state.board || optimisticBoard;
          if (Array.isArray(finalBoard) && finalBoard.length === BOARD_SIZE) {
            setBoard(finalBoard);
          }
          const rawTurn = res.state.turn || res.state.current_turn;
          setCurrentPlayer((rawTurn === 'X' || rawTurn === 'BLACK' || rawTurn === 'P1') ? BLACK : WHITE);

          if (res.state.result && res.state.result !== 'ACTIVE') {
            const isWinMatch = res.state.result === 'WIN';
            setWinner(isWinMatch ? myRole : 'DRAW');

            const outcome = res.state.winner_id === profile?.id ? 'WIN' : (res.state.result === 'DRAW' ? 'DRAW' : 'LOSS');
            const delta = outcome === 'WIN' ? 16 : (outcome === 'DRAW' ? 0 : -16);

            setResultModal({
              isOpen: true,
              outcome,
              ratingDelta: delta,
              xpGained: outcome === 'WIN' ? 30 : 10
            });

            if (onMatchFinished) {
              onMatchFinished('gomoku', outcome, opponentProfile?.name || 'Opponent');
            }
          }
        }
      } catch (e) {
        console.error('[Gomoku Move Exception]:', e);
      } finally {
        setIsSubmittingMove(false);
      }
    } else {
      // Local Mode
      soundSynth.playRotate();
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = currentPlayer;
      const newHistory = [...historyRef.current, { r, c, player: currentPlayer }];

      setBoard(newBoard);
      setHistory(newHistory);

      const winResult = checkWin(newBoard, r, c, currentPlayer);
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
          outcome = 'WIN';
          delta = 16;
          xp = 30;
        } else if (winResult.winner === WHITE) {
          updatedScores.white = (updatedScores.white || 0) + 1;
          outcome = gameMode === 'VS_COMPUTER' ? 'LOSS' : 'WIN';
          delta = outcome === 'WIN' ? 16 : -10;
          xp = outcome === 'WIN' ? 30 : 10;
        } else {
          updatedScores.draws = (updatedScores.draws || 0) + 1;
        }

        setScores(updatedScores);
        if (winResult.winner !== 'DRAW' && outcome === 'WIN') {
          try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 } }); } catch (e) {}
        }

        if (onMatchFinished) {
          onMatchFinished('gomoku', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2');
        }

        resultModalTimeoutRef.current = setTimeout(() => {
          setResultModal({
            isOpen: true,
            outcome,
            ratingDelta: delta,
            xpGained: xp
          });
        }, 450);
      } else {
        const nextPlayer = currentPlayer === BLACK ? WHITE : BLACK;
        setCurrentPlayer(nextPlayer);
      }
    }
  };

  // Smart Gomoku AI
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && currentPlayer === WHITE && !winner) {
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        // Collect available spots near played stones
        let bestR = 7, bestC = 7;
        let placed = false;

        // If center is free, take center
        if (curBoard[7][7] === EMPTY) {
          handlePlaceStone(7, 7);
          return;
        }

        // Simple adjacency heuristic
        for (let r = 0; r < BOARD_SIZE && !placed; r++) {
          for (let c = 0; c < BOARD_SIZE && !placed; c++) {
            if (curBoard[r][c] === EMPTY) {
              // Check if neighboring cells have stones
              let hasNeighbor = false;
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  const nr = r + dr;
                  const nc = c + dc;
                  if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && curBoard[nr][nc] !== EMPTY) {
                    hasNeighbor = true;
                    break;
                  }
                }
                if (hasNeighbor) break;
              }

              if (hasNeighbor) {
                bestR = r;
                bestC = c;
                placed = true;
              }
            }
          }
        }

        handlePlaceStone(bestR, bestC);
      }, 350);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [currentPlayer, gameMode, winner]);

  // Active Turn Countdown Timer & Timeout Forfeit Handler
  useEffect(() => {
    if (winner || turnTimeLimit <= 0) return;

    setTimeLeft(turnTimeLimit);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Handle Timeout
          if (isOnline) {
            const myTurnNow = (currentPlayer === myRole);
            if (myTurnNow) {
              setWinner(myRole === BLACK ? WHITE : BLACK);
              setResultModal({
                isOpen: true,
                outcome: 'LOSS',
                ratingDelta: -16,
                xpGained: 10,
                reason: 'Turn time expired'
              });
            } else {
              setWinner(myRole);
              setResultModal({
                isOpen: true,
                outcome: 'WIN',
                ratingDelta: 16,
                xpGained: 30,
                reason: 'Opponent timed out'
              });
            }
          } else if (gameMode === 'VS_COMPUTER') {
            if (currentPlayer === BLACK) {
              setWinner(WHITE);
              setResultModal({
                isOpen: true,
                outcome: 'LOSS',
                ratingDelta: -10,
                xpGained: 10
              });
            }
          } else if (gameMode === 'LOCAL_2P') {
            setWinner(currentPlayer === BLACK ? WHITE : BLACK);
          }
          return 0;
        }

        // Warning tick on last 5 seconds
        if (prev <= 5) {
          try { soundSynth.playRotate(); } catch (e) {}
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPlayer, winner, turnTimeLimit, isOnline, gameMode, myRole]);

  const isMyTurn = isOnline ? (currentPlayer === myRole) : (gameMode === 'LOCAL_2P' || currentPlayer === BLACK);


  return (
    <div style={{
      width: '100%',
      maxWidth: 'min(480px, calc(100dvh - 120px), 100vw)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Top Status Header */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        flexWrap: 'nowrap',
        gap: '6px'
      }}>
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
          {isOnline ? (
            <>
              <Wifi size={15} color="#16a34a" />
              <span>ONLINE MATCH</span>
            </>
          ) : gameMode === 'VS_COMPUTER' ? (
            <>
              <Bot size={15} color="#0f172a" />
              <span>VS SMART AI</span>
            </>
          ) : (
            <>
              <User size={15} color="#0f172a" />
              <span>2P LOCAL</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowMoveNumbers(p => !p)}
            title="Toggle Move Numbers"
            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', minHeight: '36px' }}
          >
            <Hash size={13} />
            <span>{showMoveNumbers ? 'HIDE #' : 'SHOW #'}</span>
          </button>

          {isOnline && (
            <LiveEmojiReactionSystem
              matchId={onlineSession?.matchId}
              isOnline={isOnline}
              playerName={profile?.name}
            />
          )}

          {!isOnline && (
            <button
              className="btn-secondary"
              onClick={resetGame}
              title="Reset Board"
              style={{ padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', minHeight: '36px' }}
            >
              <RotateCcw size={13} />
              <span>RESET</span>
            </button>
          )}
        </div>
      </div>

      {/* Disconnect Alert Banner (30s Grace Period) */}
      {connectionStatus === 'OPPONENT_DISCONNECTED' && (
        <div style={{
          width: '100%', background: '#fffbeb', border: '1.5px solid #f59e0b',
          borderRadius: '12px', padding: '8px 14px', marginBottom: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: '#92400e', fontSize: '12px', fontWeight: '800'
        }}>
          <span>📡 Opponent temporary connection drop • Waiting {disconnectCountdown || 30}s for reconnect...</span>
          <button
            onClick={() => {
              setWinner(myRoleRef.current);
              setResultModal({
                isOpen: true,
                outcome: 'WIN',
                ratingDelta: 16,
                xpGained: 30
              });
            }}
            style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
          >
            Claim Win
          </button>
        </div>
      )}


      {/* Dynamic Turn Alert Banner */}
      {!winner && isOnline && (
        <div style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '12px',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: '900',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.04em',
          background: isMyTurn ? '#f1f5f9' : '#f8fafc',
          border: isMyTurn ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
          color: isMyTurn ? '#0f172a' : '#64748b',
          boxShadow: isMyTurn ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isMyTurn ? (myRole === BLACK ? '#0f172a' : '#94a3b8') : '#cbd5e1',
            display: 'inline-block'
          }} />
          <span>
            {isMyTurn 
              ? `YOUR TURN (${myRole === BLACK ? 'BLACK' : 'WHITE'}) — TAP AN INTERSECTION` 
              : `WAITING FOR OPPONENT (${myRole === BLACK ? 'WHITE' : 'BLACK'}) TO MOVE...`}
          </span>
        </div>
      )}

      {/* Dual Player Bar */}
      <MatchPlayerBar
        p1Name={profile?.name || 'You'}
        p1AvatarId={profile?.avatarId || '1'}
        p1Rating={profile?.rating || 1200}
        p1Score={scores.black}
        p1Symbol="BLACK STONE"
        p1Color="#0f172a"
        p2Name={isOnline ? (opponentProfile?.name || 'Opponent') : (gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2')}
        p2AvatarId={isOnline ? (opponentProfile?.avatarId || '2') : '2'}
        p2Rating={isOnline ? (opponentProfile?.rating || 1200) : 1200}
        p2Score={scores.white}
        p2Symbol="WHITE STONE"
        p2Color="#94a3b8"
        isP1Turn={isMyTurn}
        isGameOver={!!winner}
        gameMode={gameMode}
        winnerText={
          winner === BLACK ? (gameMode === 'VS_COMPUTER' ? 'YOU WIN' : 'BLACK WINS') :
          winner === WHITE ? (gameMode === 'VS_COMPUTER' ? 'AI WINS' : 'WHITE WINS') :
          winner === 'DRAW' ? 'DRAW' : null
        }
        timeLeft={timeLeft}
      />

      {/* 15x15 Gomoku Grid Board */}
      <div style={{
        background: '#e2d3b3',
        padding: 'clamp(6px, 1.8vw, 12px)',
        borderRadius: '16px',
        border: '2px solid #b89c72',
        boxShadow: '0 20px 35px -5px rgba(184, 156, 114, 0.45)',
        width: '100%',
        aspectRatio: '1 / 1',
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isWinning = winningStones.some(([wr, wc]) => wr === r && wc === c);
            const moveIndex = history.findIndex(h => h.r === r && h.c === c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handlePlaceStone(r, c)}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isMyTurn && cell === EMPTY && !winner && !isAiThinking && !isSubmittingMove ? 'pointer' : 'default'
                }}
              >
                {/* Board grid intersection lines */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: c === 0 ? '50%' : 0,
                  right: c === BOARD_SIZE - 1 ? '50%' : 0,
                  height: '1px',
                  background: '#8c704f'
                }} />
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: r === 0 ? '50%' : 0,
                  bottom: r === BOARD_SIZE - 1 ? '50%' : 0,
                  width: '1px',
                  background: '#8c704f'
                }} />

                {/* Star points (Tengen & Hoshi) */}
                {((r === 3 || r === 7 || r === 11) && (c === 3 || c === 7 || c === 11)) && cell === EMPTY && (
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%', background: '#8c704f', position: 'relative', zIndex: 1
                  }} />
                )}

                {/* Black Stone */}
                {cell === BLACK && (
                  <div
                    className="animate-pop-in"
                    style={{
                      width: '88%', height: '88%', borderRadius: '50%',
                      background: 'radial-gradient(circle at 30% 30%, #475569, #0f172a 70%, #020617)',
                      boxShadow: isWinning ? '0 0 16px #10b981' : '0 2px 5px rgba(0,0,0,0.5)',
                      border: isWinning ? '2px solid #10b981' : 'none',
                      position: 'relative', zIndex: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff', fontSize: '9px', fontWeight: '800'
                    }}
                  >
                    {showMoveNumbers && moveIndex !== -1 && (moveIndex + 1)}
                  </div>
                )}

                {/* White Stone */}
                {cell === WHITE && (
                  <div
                    className="animate-pop-in"
                    style={{
                      width: '88%', height: '88%', borderRadius: '50%',
                      background: 'radial-gradient(circle at 30% 30%, #ffffff, #e2e8f0 70%, #94a3b8)',
                      boxShadow: isWinning ? '0 0 16px #10b981' : '0 2px 5px rgba(0,0,0,0.3)',
                      border: isWinning ? '2px solid #10b981' : '1px solid #cbd5e1',
                      position: 'relative', zIndex: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#0f172a', fontSize: '9px', fontWeight: '800'
                    }}
                  >
                    {showMoveNumbers && moveIndex !== -1 && (moveIndex + 1)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* In-Game Live Reaction Toolbar (With Cooldown & Center Floating Animation) */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <LiveEmojiReactionSystem
          matchId={onlineSession?.matchId}
          isOnline={isOnline}
          playerName={profile?.name || 'You'}
          incomingReaction={incomingReaction}
        />
      </div>

      {/* Result Modal */}

      <MatchResultModal
        isOpen={resultModal.isOpen}
        onClose={() => {
          setResultModal(prev => ({ ...prev, isOpen: false }));
          if (isOnline) {
            if (onGoHome) onGoHome();
          } else {
            resetGame();
          }
        }}
        outcome={resultModal.outcome}
        gameTitle="Gomoku (15×15)"
        opponentName={isOnline ? (opponentProfile?.name || 'Opponent') : (gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2')}
        ratingDelta={resultModal.ratingDelta}
        xpGained={resultModal.xpGained}
        currentRating={profile?.rating || 1200}
        level={profile?.level || 1}
        xp={profile?.xp || 0}
        movesCount={history.length}
        onRematch={() => {
          setResultModal(prev => ({ ...prev, isOpen: false }));
          if (isOnline) {
            if (onGoHome) onGoHome();
          } else {
            resetGame();
          }
        }}
        onGoHome={() => {
          setResultModal(prev => ({ ...prev, isOpen: false }));
          if (onGoHome) onGoHome();
        }}
      />
    </div>
  );
}
