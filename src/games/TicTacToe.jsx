import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, X as IconX, Circle as IconO, Wifi, ArrowLeft } from 'lucide-react';
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

const DEFAULT_TTT_STATE = {
  board: Array(9).fill(null),
  isXNext: true,
  myRole: 'X',
  winner: null,
  winningLine: [],
  scores: { x: 0, o: 0, draws: 0 },
  history: []
};

export default function TicTacToe({ 
  profile, 
  initialMode = 'VS_COMPUTER', 
  onlineSession = null, 
  settings, 
  onMatchFinished, 
  onGoHome 
}) {
  const isOnline = initialMode === 'ONLINE_MATCH' && !!onlineSession?.matchId;
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;

  const [initialState] = useState(() => loadGameState('tictactoe', DEFAULT_TTT_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [isXNext, setIsXNext] = useState(initialState.isXNext);
  const [gameMode] = useState(isOnline ? 'ONLINE_MATCH' : initialMode);
  const [myRole, setMyRole] = useState(onlineSession?.myRole || 'X');
  const [winner, setWinner] = useState(initialState.winner);
  const [winningLine, setWinningLine] = useState(initialState.winningLine || []);
  const [scores, setScores] = useState(initialState.scores || { x: 0, o: 0, draws: 0 });
  const [history, setHistory] = useState(initialState.history || []);
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

  // Turn Clock & Forfeit State
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
  const isXNextRef = useRef(isXNext);
  isXNextRef.current = isXNext;
  const aiTimeoutRef = useRef(null);
  const resultModalTimeoutRef = useRef(null);

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

  // Realtime Integration for Online Match
  useEffect(() => {
    if (!isOnline || !onlineSession?.matchId) return;

    setMyRole(onlineSession.myRole || 'X');
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
        const incomingTurn = serverState.current_turn || serverState.turn;
        const incomingResult = serverState.status || serverState.result;
        const winnerId = serverState.winner_id || serverState.winnerId;

        if (incomingBoard) {
          setBoard(incomingBoard);
          setIsXNext(incomingTurn === 'X');
          
          if (incomingResult && incomingResult !== 'ACTIVE') {
            const isWin = incomingResult === 'WIN';
            const winSym = isWin ? (winnerId === profile?.id ? myRoleRef.current : (myRoleRef.current === 'X' ? 'O' : 'X')) : 'DRAW';
            setWinner(winSym);
            
            const outcome = winnerId === profile?.id ? 'WIN' : (incomingResult === 'DRAW' ? 'DRAW' : 'LOSS');
            const delta = outcome === 'WIN' ? 16 : (outcome === 'DRAW' ? 0 : -16);

            setResultModal({
              isOpen: true,
              outcome,
              ratingDelta: delta,
              xpGained: outcome === 'WIN' ? 30 : 10
            });

            if (onMatchFinished) {
              onMatchFinished('tictactoe', outcome, opponentProfile?.name || 'Opponent');
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
              onMatchFinished('tictactoe', 'WIN', opponentProfile?.name || 'Opponent');
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
          onMatchFinished('tictactoe', 'WIN', opponentProfile?.name || 'Opponent');
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
            if (rawBoard) {
              setBoard(rawBoard);
              setIsXNext(rawTurn === 'X');
              if (rawResult && rawResult !== 'ACTIVE') {
                const isWin = rawResult === 'WIN';
                const winSym = isWin ? (winnerId === profile?.id ? myRoleRef.current : (myRoleRef.current === 'X' ? 'O' : 'X')) : 'DRAW';
                setWinner(winSym);
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
    const emptyBoard = Array(9).fill(null);
    setBoard(emptyBoard);
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    setHistory([]);
    setTimeLeft(turnTimeLimit > 0 ? turnTimeLimit : 30);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });
  }, [turnTimeLimit]);

  const applyLocalMove = useCallback((index, symbol) => {
    const curBoard = boardRef.current;
    if (winnerRef.current || curBoard[index]) return;

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
        outcome = 'WIN';
        delta = 16;
        xp = 30;
      } else if (winResult.winner === 'O') {
        updatedScores.o = (updatedScores.o || 0) + 1;
        outcome = gameMode === 'VS_COMPUTER' ? 'LOSS' : 'WIN';
        delta = outcome === 'WIN' ? 16 : -10;
        xp = outcome === 'WIN' ? 30 : 10;
      } else {
        updatedScores.draws = (updatedScores.draws || 0) + 1;
      }

      setScores(updatedScores);
      if (winResult.winner !== 'DRAW' && outcome === 'WIN') {
        try { confetti({ particleCount: 65, spread: 55, origin: { y: 0.65 } }); } catch (e) {}
      }

      if (onMatchFinished) {
        onMatchFinished('tictactoe', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2');
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
      setIsXNext(symbol !== 'X');
    }
  }, [gameMode, scores, onMatchFinished]);

  const handleClick = async (index) => {
    if (winner || board[index] || isAiThinking || isSubmittingMove) return;

    const currentSymbol = isXNext ? 'X' : 'O';

    if (isOnline) {
      if (currentSymbol !== myRole) return;

      setIsSubmittingMove(true);
      soundSynth.playRotate();

      // Optimistic instant board update locally
      const optimisticBoard = [...board];
      optimisticBoard[index] = myRole;
      const nextTurn = myRole === 'X' ? 'O' : 'X';
      setBoard(optimisticBoard);
      setIsXNext(nextTurn === 'X');

      const winResult = checkWinner(optimisticBoard);
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
          index,
          board: optimisticBoard,
          turn: nextTurn,
          result: outcomeResult,
          winnerSymbol: winResult?.winner || null
        };
        const res = await gameEngineService.submitMove(onlineSession.matchId, movePayload, profile?.id);
        if (res?.success && res.state) {
          const finalBoard = res.state.board || optimisticBoard;
          setBoard(finalBoard);
          setIsXNext(res.state.turn === 'X');

          if (res.state.result && res.state.result !== 'ACTIVE') {
            const isWinMatch = res.state.result === 'WIN';
            const winSym = isWinMatch ? (res.state.winnerSymbol || myRole) : 'DRAW';
            setWinner(winSym);
            
            const outcome = res.state.winner_id === profile?.id ? 'WIN' : (res.state.result === 'DRAW' ? 'DRAW' : 'LOSS');
            const delta = outcome === 'WIN' ? 16 : (outcome === 'DRAW' ? 0 : -16);

            setResultModal({
              isOpen: true,
              outcome,
              ratingDelta: delta,
              xpGained: outcome === 'WIN' ? 30 : 10
            });

            if (onMatchFinished) {
              onMatchFinished('tictactoe', outcome, opponentProfile?.name || 'Opponent');
            }
          }
        }
      } catch (err) {
        console.error('[TicTacToe Move Exception]:', err);
      } finally {
        setIsSubmittingMove(false);
      }
    } else {
      if (gameMode === 'VS_COMPUTER') {
        if (!isXNext) return;
        applyLocalMove(index, 'X');
      } else {
        applyLocalMove(index, currentSymbol);
      }
    }
  };

  // Smart AI Handler
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && !isXNext && !winner) {
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        // 1. Immediate Win
        for (let i = 0; i < 9; i++) {
          if (!curBoard[i]) {
            const test = [...curBoard];
            test[i] = 'O';
            const res = checkWinner(test);
            if (res && res.winner === 'O') {
              applyLocalMove(i, 'O');
              return;
            }
          }
        }

        // 2. Block X
        for (let i = 0; i < 9; i++) {
          if (!curBoard[i]) {
            const test = [...curBoard];
            test[i] = 'X';
            const res = checkWinner(test);
            if (res && res.winner === 'X') {
              applyLocalMove(i, 'O');
              return;
            }
          }
        }

        // 3. Center Priority
        if (!curBoard[4]) {
          applyLocalMove(4, 'O');
          return;
        }

        // 4. Corners Priority
        const corners = [0, 2, 6, 8, 1, 3, 5, 7];
        for (let idx of corners) {
          if (!curBoard[idx]) {
            applyLocalMove(idx, 'O');
            return;
          }
        }
      }, 300);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [isXNext, gameMode, winner, applyLocalMove]);

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
            const myTurnNow = isXNextRef.current ? (myRoleRef.current === 'X') : (myRoleRef.current === 'O');
            if (myTurnNow) {
              setWinner(myRoleRef.current === 'X' ? 'O' : 'X');
              setResultModal({
                isOpen: true,
                outcome: 'LOSS',
                ratingDelta: -16,
                xpGained: 10,
                reason: 'Turn time expired'
              });
            } else {
              setWinner(myRoleRef.current);
              setResultModal({
                isOpen: true,
                outcome: 'WIN',
                ratingDelta: 16,
                xpGained: 30,
                reason: 'Opponent timed out'
              });
            }
          } else if (gameMode === 'VS_COMPUTER') {
            if (isXNextRef.current) {
              setWinner('O');
              setResultModal({
                isOpen: true,
                outcome: 'LOSS',
                ratingDelta: -10,
                xpGained: 10
              });
            }
          } else if (gameMode === 'LOCAL_2P') {
            setWinner(isXNextRef.current ? 'O' : 'X');
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
  }, [isXNext, winner, turnTimeLimit, isOnline, gameMode]);

  const currentSymbol = isXNext ? 'X' : 'O';
  const isMyTurn = isOnline ? (currentSymbol === myRole) : (gameMode === 'LOCAL_2P' || isXNext);


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
        {/* Mode Pill */}
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

        {isOnline && (
          <LiveEmojiReactionSystem
            matchId={onlineSession?.matchId}
            isOnline={isOnline}
            playerName={profile?.name}
          />
        )}
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
          background: isMyTurn ? '#ecfdf5' : '#f8fafc',
          border: isMyTurn ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
          color: isMyTurn ? '#065f46' : '#64748b',
          boxShadow: isMyTurn ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isMyTurn ? '#10b981' : '#94a3b8',
            display: 'inline-block'
          }} />
          <span>
            {isMyTurn 
              ? `YOUR TURN (${myRole}) — TAP A SQUARE TO PLAY` 
              : `WAITING FOR OPPONENT (${myRole === 'X' ? 'O' : 'X'}) TO MOVE...`}
          </span>
        </div>
      )}

      {/* Dual Player Bar */}
      <MatchPlayerBar
        p1Name={profile?.name || 'You'}
        p1AvatarId={profile?.avatarId || '1'}
        p1Rating={profile?.rating || 1200}
        p1Score={scores.x}
        p1Symbol="CROSS"
        p1Color="#1e3a8a"
        p2Name={isOnline ? (opponentProfile?.name || 'Opponent') : (gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2')}
        p2AvatarId={isOnline ? (opponentProfile?.avatarId || '2') : '2'}
        p2Rating={isOnline ? (opponentProfile?.rating || 1200) : 1200}
        p2Score={scores.o}
        p2Symbol="CIRCLE"
        p2Color="#881337"
        isP1Turn={isMyTurn}
        isGameOver={!!winner}
        gameMode={gameMode}
        winnerText={
          winner === 'X' ? (gameMode === 'VS_COMPUTER' ? 'YOU WIN' : 'X WINS') :
          winner === 'O' ? (gameMode === 'VS_COMPUTER' ? 'AI WINS' : 'O WINS') :
          winner === 'DRAW' ? 'DRAW' : null
        }
        timeLeft={timeLeft}
      />

      {/* 3x3 Grid Board with Center Emoji Reaction Mount */}
      <div style={{
        position: 'relative',
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
              disabled={!!cell || !!winner || !isMyTurn || isAiThinking || isSubmittingMove}
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
                cursor: !cell && !winner && isMyTurn && !isAiThinking && !isSubmittingMove ? 'pointer' : 'default',
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
        gameTitle="Tic-Tac-Toe (3×3)"
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
