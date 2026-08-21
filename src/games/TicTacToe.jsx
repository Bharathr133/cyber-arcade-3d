import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, X as IconX, Circle as IconO, Wifi, ArrowLeft } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

import { realtimeManager } from '../services/realtimeManager.js';
import { gameEngineService } from '../services/gameEngineService.js';
import { saveGameState, loadGameState } from '../utils/gameStateStorage.js';
import { getUserProfile } from '../utils/userProfile.js';
import LiveEmojiReactionSystem from '../components/LiveEmojiReactionSystem.jsx';
import { getSupabase } from '../utils/supabaseClient.js';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import InGameResultBar from '../components/InGameResultBar.jsx';
import InBoardVictoryBadge from '../components/InBoardVictoryBadge.jsx';




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
  localPlayerNames = null,
  settings, 
  onMatchFinished, 
  onGoHome 
}) {
  const isOnline = initialMode === 'ONLINE_MATCH' && !!onlineSession?.matchId;
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;


  const [initialState] = useState(() => isOnline ? DEFAULT_TTT_STATE : loadGameState('tictactoe', DEFAULT_TTT_STATE));

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

  const [timeLeft, setTimeLeft] = useState(turnTimeLimit || 30);
  const [opponentProfile, setOpponentProfile] = useState(onlineSession?.opponent || { name: 'Opponent', avatarId: '2', rating: 1200 });
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

  const disconnectIntervalRef = useRef(null);
  const matchFinalizedRef = useRef(false);
  const submitLockTimeoutRef = useRef(null);

  // Idempotent Result Finalizer (Guarantees match result is processed ONCE and ONLY ONCE)
  const handleFinalizeMatch = useCallback((outcome, reason = '', winningSymbol = null) => {
    if (matchFinalizedRef.current) return;
    matchFinalizedRef.current = true;

    const isWin = outcome === 'WIN';
    const isDraw = outcome === 'DRAW';
    const finalSymbol = winningSymbol || (isWin ? myRoleRef.current : (isDraw ? 'DRAW' : (myRoleRef.current === 'X' ? 'O' : 'X')));
    setWinner(finalSymbol);

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
      onMatchFinished('tictactoe', outcome, opponentProfile?.name || (gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Opponent'));
    }
  }, [gameMode, onMatchFinished, opponentProfile?.name]);


  const handleFinalizeMatchRef = useRef(handleFinalizeMatch);
  handleFinalizeMatchRef.current = handleFinalizeMatch;

  // Realtime Integration for Online Match (Subscribes ONCE per matchId)
  useEffect(() => {
    if (!isOnline || !onlineSession?.matchId) return;

    setMyRole(onlineSession.myRole || 'X');
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
        const incomingTurn = serverState.current_turn || serverState.turn;
        const incomingResult = serverState.status || serverState.result;
        const winnerId = serverState.winner_id || serverState.winnerId;

        if (incomingBoard && Array.isArray(incomingBoard)) {
          // Merge server board with local board so no mark is ever erased
          const finalBoard = incomingBoard.map((cell, i) =>
            cell !== null ? cell : (boardRef.current && boardRef.current[i] !== null ? boardRef.current[i] : null)
          );

          setBoard(finalBoard);
          setIsXNext(incomingTurn === 'X');

          const winResult = checkWinner(finalBoard);
          if (winResult?.line && winResult.line.length > 0) {
            setWinningLine(winResult.line);
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
            const winSym = isWin ? (isMyWin ? myRoleRef.current : (myRoleRef.current === 'X' ? 'O' : 'X')) : 'DRAW';

            handleFinalizeMatchRef.current(outcome, '', winSym);
          }
        }
      },
      onOpponentDisconnect: () => {
        if (disconnectIntervalRef.current) clearInterval(disconnectIntervalRef.current);

        const isGameOver = !!(winnerRef.current || matchFinalizedRef.current);
        let count = isGameOver ? 6 : 35;
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



    // Refresh Recovery: Synchronize current authoritative match state & opponent profile
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
              const finalBoard = rawBoard.map((cell, i) =>
                cell !== null ? cell : (boardRef.current && boardRef.current[i] !== null ? boardRef.current[i] : null)
              );

              latestBoard = finalBoard;
              setBoard(finalBoard);
              setIsXNext(rawTurn === 'X');
              latestWinResult = checkWinner(finalBoard);
              if (latestWinResult?.line && latestWinResult.line.length > 0) {
                setWinningLine(latestWinResult.line);
              }
              if (rawResult && rawResult !== 'ACTIVE') {
                const isWin = rawResult === 'WIN' || rawResult === 'FINISHED';
                const isMyWin = isWin && (winnerId === profile?.id || stateData.winnerSymbol === myRoleRef.current || latestWinResult?.winner === myRoleRef.current);
                const isDraw = rawResult === 'DRAW' || latestWinResult?.winner === 'DRAW';
                const outcome = isMyWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
                const winSym = isWin ? (isMyWin ? myRoleRef.current : (myRoleRef.current === 'X' ? 'O' : 'X')) : 'DRAW';
                handleFinalizeMatchRef.current(outcome, '', winSym);
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
                  name: oppProfile.display_name || oppProfile.username || 'Opponent',
                  avatarId: oppProfile.avatar_url || '2',
                  rating: 1200
                });
              }
            }

            if (matchData.result === 'FINISHED' || matchData.result === 'DRAW') {
              const isMyWin = matchData.winner_id === profile?.id;
              const isDraw = matchData.result === 'DRAW';
              const outcome = isMyWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
              const winSym = isMyWin ? myRoleRef.current : (myRoleRef.current === 'X' ? 'O' : 'X');
              if (latestBoard) {
                const wr = checkWinner(latestBoard);
                if (wr?.line && wr.line.length > 0) {
                  setWinningLine(wr.line);
                }
              }
              handleFinalizeMatchRef.current(outcome, '', winSym);
            }
          }
        }
      } catch (e) {}
    }


    syncLatestState();

    // Tab Visibility Re-Sync Handler
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
    if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
    setIsAiThinking(false);
    setIsSubmittingMove(false);
    const emptyBoard = Array(9).fill(null);
    setBoard(emptyBoard);
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    setHistory([]);
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
    const emptyBoard = Array(9).fill(null);
    await gameEngineService.resetMatchState(onlineSession.matchId, emptyBoard, 'X');
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
      setWinningLine(winResult.line || []);
      const isWin = winResult.winner === 'X';
      const isLoss = winResult.winner === 'O';
      const outcome = isWin ? 'WIN' : (isLoss ? 'LOSS' : 'DRAW');

      handleFinalizeMatch(outcome, '', winResult.winner);
    } else {
      setIsXNext(symbol !== 'X');
    }

  }, [handleFinalizeMatch]);

  const handleClick = async (index) => {
    if (winner || board[index] || isAiThinking || isSubmittingMove) return;

    const currentSymbol = isXNext ? 'X' : 'O';

    if (isOnline) {
      if (currentSymbol !== myRole) return;

      setIsSubmittingMove(true);
      // Auto-unlock safety timeout
      if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
      submitLockTimeoutRef.current = setTimeout(() => {
        setIsSubmittingMove(false);
      }, 3500);

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

      if (winResult?.line && winResult.line.length > 0) {
        setWinningLine(winResult.line);
      }

      // Zero-latency broadcast to opponent (<10ms)
      realtimeManager.broadcastToMatch(onlineSession.matchId, 'match_move', {
        board: optimisticBoard,
        turn: nextTurn,
        result: outcomeResult,
        winner_id: isWin ? profile?.id : null,
        winnerSymbol: isWin ? myRole : null,
        winningLine: winResult?.line || [],
        senderId: profile?.id
      });

      if (isWin || isDraw) {
        handleFinalizeMatch(outcomeResult === 'WIN' ? 'WIN' : 'DRAW', '', myRole);
      }

      try {
        const movePayload = {
          position: index,
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
          setIsXNext(rawTurn === 'X');

          if (res.state.result && res.state.result !== 'ACTIVE') {
            const isWinMatch = res.state.result === 'WIN' || res.state.result === 'FINISHED';
            const isMyWin = isWinMatch && (res.state.winner_id === profile?.id || res.state.winnerSymbol === myRole);
            const isDrawMatch = res.state.result === 'DRAW';
            const outcome = isMyWin ? 'WIN' : (isDrawMatch ? 'DRAW' : 'LOSS');
            const winSym = isWinMatch ? (isMyWin ? myRole : (myRole === 'X' ? 'O' : 'X')) : 'DRAW';

            handleFinalizeMatch(outcome, '', winSym);
          }
        }
      } catch (e) {

        console.error('[TicTacToe Move Exception]:', e);
      } finally {
        if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
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

  // Unbeatable Minimax AI Handler
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && !isXNext && !winner) {
      setIsAiThinking(true);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        // Minimax with alpha-beta pruning
        const checkResult = (b) => {
          const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
          for (const [a,c,d] of lines) {
            if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
          }
          if (b.every(c => c !== null)) return 'DRAW';
          return null;
        };

        const minimax = (b, depth, isMax) => {
          const res = checkResult(b);
          if (res === 'O') return 10 - depth;
          if (res === 'X') return depth - 10;
          if (res === 'DRAW') return 0;

          if (isMax) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
              if (!b[i]) { b[i] = 'O'; best = Math.max(best, minimax(b, depth + 1, false)); b[i] = null; }
            }
            return best;
          } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
              if (!b[i]) { b[i] = 'X'; best = Math.min(best, minimax(b, depth + 1, true)); b[i] = null; }
            }
            return best;
          }
        };

        let bestScore = -Infinity;
        let bestMove = -1;
        for (let i = 0; i < 9; i++) {
          if (!curBoard[i]) {
            curBoard[i] = 'O';
            const score = minimax(curBoard, 0, false);
            curBoard[i] = null;
            if (score > bestScore) {
              bestScore = score;
              bestMove = i;
            }
          }
        }

        if (bestMove !== -1) {
          applyLocalMove(bestMove, 'O');
        }
      }, 300);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [isXNext, gameMode, winner, applyLocalMove]);

  // Active Turn Countdown Timer with Monotonic Timestamps
  useEffect(() => {
    if (winner || turnTimeLimit <= 0) return;

    setTimeLeft(turnTimeLimit);
    const turnEndTime = Date.now() + (turnTimeLimit * 1000);

    const timer = setInterval(() => {
      const remainingSec = Math.ceil((turnEndTime - Date.now()) / 1000);
      setTimeLeft(Math.max(0, remainingSec));

      if (isOnline) {
        const myTurnNow = isXNextRef.current ? (myRoleRef.current === 'X') : (myRoleRef.current === 'O');
        if (myTurnNow) {
          if (remainingSec <= 0) {
            clearInterval(timer);
            // Official Competitive Rule: Timeout = Forfeit Loss (NO automatic moves)
            handleFinalizeMatch('LOSS', 'Time expired (Timeout forfeit)');
          }
        } else {
          // Opponent's turn: 4-second grace buffer past 0 for network latency
          if (remainingSec <= -4) {
            clearInterval(timer);
            handleFinalizeMatch('WIN', 'Opponent timed out');
          }
        }
      } else {
        if (remainingSec <= 0) {
          clearInterval(timer);
          if (gameMode === 'VS_COMPUTER') {
            if (isXNextRef.current) {
              handleFinalizeMatch('LOSS', 'Time expired');
            }
          } else if (gameMode === 'LOCAL_2P') {
            const timeOutWinner = isXNextRef.current ? 'O' : 'X';
            setWinner(timeOutWinner);
          }
        }
      }


      if (remainingSec <= 5 && remainingSec > 0) {
        try { soundSynth.playRotate(); } catch (e) {}
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isXNext, winner, turnTimeLimit, isOnline, gameMode, handleFinalizeMatch]);


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
      </div>


      {/* Disconnect Alert Banner (During active game only) */}
      {!winner && !matchFinalizedRef.current && connectionStatus === 'OPPONENT_DISCONNECTED' && (
        <div style={{
          width: '100%', background: '#FFFBEB', border: '1.5px solid #F59E0B',
          borderRadius: '12px', padding: '8px 14px', marginBottom: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#92400E', fontSize: '12px', fontWeight: '800'
        }}>
          <span>Opponent reconnecting • Waiting {disconnectCountdown || 35}s...</span>
        </div>
      )}

      {/* Opponent Left Alert Banner */}
      {!winner && !matchFinalizedRef.current && connectionStatus === 'OPPONENT_LEFT' && (
        <div style={{
          width: '100%', background: '#FEF2F2', border: '1.5px solid #FCA5A5',
          borderRadius: '12px', padding: '8px 14px', marginBottom: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#991B1B', fontSize: '12px', fontWeight: '800'
        }}>
          <span>Opponent left the match.</span>
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
        p1Name={isOnline ? profile?.name : (gameMode === 'LOCAL_2P' ? (localPlayerNames?.p1 || profile?.name) : profile?.name)}
        p1AvatarId={profile?.avatarId || '1'}
        p1Rating={profile?.rating || 1200}
        p1Score={scores.x}
        p1Symbol="CROSS"
        p1Color="#1e3a8a"
        p2Name={isOnline ? opponentProfile?.name : (gameMode === 'VS_COMPUTER' ? 'Grandmaster AI' : (localPlayerNames?.p2 || 'Opponent'))}
        p2AvatarId={isOnline ? (opponentProfile?.avatarId || '2') : '2'}
        p2Rating={isOnline ? (opponentProfile?.rating || 1200) : (gameMode === 'VS_COMPUTER' ? 1450 : 1200)}
        p2Score={scores.o}
        p2Symbol="CIRCLE"
        p2Color="#881337"
        isP1Turn={isMyTurn}
        isGameOver={!!winner}
        gameMode={gameMode}
        winnerText={
          winner === 'X' ? `${isOnline ? profile?.name : (gameMode === 'LOCAL_2P' ? (localPlayerNames?.p1 || profile?.name) : profile?.name)} Won!` :
          winner === 'O' ? (gameMode === 'VS_COMPUTER' ? 'AI Bot Won!' : `${isOnline ? opponentProfile?.name : (localPlayerNames?.p2 || 'Opponent')} Won!`) :
          winner === 'DRAW' ? 'Draw Match!' : null
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
        {/* Clean Minimal Connection Line Across 3 Winning Squares */}
        {winningLine && winningLine.length === 3 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 20
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1={`${(((winningLine[0] % 3) + 0.5) / 3) * 100}%`}
              y1={`${((Math.floor(winningLine[0] / 3) + 0.5) / 3) * 100}%`}
              x2={`${(((winningLine[2] % 3) + 0.5) / 3) * 100}%`}
              y2={`${((Math.floor(winningLine[2] / 3) + 0.5) / 3) * 100}%`}
              stroke="#16A34A"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
        )}


        {board.map((cell, idx) => {
          const isWinning = winningLine.includes(idx);


          return (
            <button
              key={idx}
              disabled={!!cell || !!winner || !isMyTurn || isAiThinking || isSubmittingMove}
              onClick={() => handleClick(idx)}
              className={isWinning ? "animate-winner-pulse" : ""}
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

        {/* Premium In-Board Victory Tag */}
        {winner && (
          <InBoardVictoryBadge
            winner={winner}
            myRole={myRole}
            gameType="tictactoe"
            outcome={resultModal.outcome}
          />
        )}
      </div>


      {/* 4. IN-GAME RESULT BAR (No blocking popup) */}
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
          opponentName={opponentProfile?.name || 'Opponent'}
        />
      )}


      {/* 5. In-Game Live Reaction Toolbar (With Cooldown & Center Floating Animation) */}
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



