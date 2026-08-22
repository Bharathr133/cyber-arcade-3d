import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, Wifi, Hash } from 'lucide-react';
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




const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1; // Player 1 (Host / Black)
const WHITE = 2; // Player 2 (Guest / White)
const COORD_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

const normalizeGomokuRole = (role) => {
  if (role === 2 || role === '2' || role === 'O' || role === 'WHITE' || role === 'P2' || role === 'GUEST') return WHITE;
  return BLACK;
};

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
  localPlayerNames = null,
  settings, 
  onMatchFinished, 
  onGoHome 
}) {
  const isOnline = initialMode === 'ONLINE_MATCH' && !!onlineSession?.matchId;
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;

  const [initialState] = useState(() => isOnline ? DEFAULT_GOMOKU_STATE : loadGameState('gomoku', DEFAULT_GOMOKU_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [gameMode] = useState(isOnline ? 'ONLINE_MATCH' : initialMode);
  const [myRole, setMyRole] = useState(() => normalizeGomokuRole(onlineSession?.myRole));
  const [winner, setWinner] = useState(initialState.winner);
  const [winningStones, setWinningStones] = useState(initialState.winningStones || []);
  const [history, setHistory] = useState(initialState.history || []);
  const [scores, setScores] = useState(initialState.scores || { black: 0, white: 0, draws: 0 });
  const [showMoveNumbers, setShowMoveNumbers] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(() => settings?.aiDifficulty || 'EASY');

  // Synchronize when settings change from Match Settings Modal
  useEffect(() => {
    if (settings?.aiDifficulty) {
      setAiDifficulty(settings.aiDifficulty);
    }
  }, [settings?.aiDifficulty]);

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

  const scanBoardForWinner = (grid) => {
    if (!grid || !Array.isArray(grid)) return null;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = grid[r]?.[c];
        if (cell && cell !== EMPTY) {
          const res = checkWin(grid, r, c, cell);
          if (res?.winner && res.winner !== 'DRAW') return res;
        }
      }
    }
    const isFull = grid.every(row => row.every(cell => cell !== EMPTY));
    if (isFull) return { winner: 'DRAW', stones: [] };
    return null;
  };

  const disconnectIntervalRef = useRef(null);

  const matchFinalizedRef = useRef(false);
  const submitLockTimeoutRef = useRef(null);

  // Idempotent Result Finalizer (Guarantees match result is processed ONCE and ONLY ONCE)
  const handleFinalizeMatch = useCallback((outcome, reason = '', winningStone = null) => {
    if (matchFinalizedRef.current) return;
    matchFinalizedRef.current = true;

    const isWin = outcome === 'WIN';
    const isDraw = outcome === 'DRAW';
    const finalStone = winningStone || (isWin ? myRoleRef.current : (isDraw ? 'DRAW' : (myRoleRef.current === BLACK ? WHITE : BLACK)));
    setWinner(finalStone);

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
      onMatchFinished('gomoku', outcome, opponentProfile?.name || (gameMode === 'VS_COMPUTER' ? 'Grandmaster AI' : localPlayerNames?.p2));
    }
  }, [gameMode, onMatchFinished, opponentProfile?.name, localPlayerNames?.p2]);



  const handleFinalizeMatchRef = useRef(handleFinalizeMatch);
  handleFinalizeMatchRef.current = handleFinalizeMatch;

  // Realtime Integration for Online Match (Subscribes ONCE per matchId)
  useEffect(() => {
    if (!isOnline || !onlineSession?.matchId) return;

    setMyRole(normalizeGomokuRole(onlineSession.myRole));
    if (onlineSession.opponent?.name) {
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
          .select('player_1_id, player_1_name, player_2_id, player_2_name, board_state, current_turn, status')
          .eq('id', matchId)
          .single();

        if (match) {
          const isPlayer1 = match.player_1_id === profile?.id;
          setMyRole(isPlayer1 ? BLACK : WHITE);

          // Reconnect Board State Restoration
          if (match.board_state && Array.isArray(match.board_state) && match.board_state.length === BOARD_SIZE) {
            setBoard(match.board_state);
            if (match.current_turn !== undefined && match.current_turn !== null) {
              const nextTurn = (match.current_turn === 1 || match.current_turn === '1' || match.current_turn === 'X' || match.current_turn === 'BLACK' || match.current_turn === 'P1' || match.current_turn === 'RED') ? BLACK : WHITE;
              setCurrentPlayer(nextTurn);
            }
          }

          const oppName = isPlayer1 ? match.player_2_name : match.player_1_name;
          const oppId = isPlayer1 ? match.player_2_id : match.player_1_id;

          if (oppName && oppName !== 'Opponent' && !oppName.startsWith('Player')) {
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
              if (finalName && !finalName.startsWith('Player')) {
                setOpponentProfile(prev => ({
                  ...prev,
                  name: finalName,
                  avatarId: oppProf.avatar_id || prev?.avatarId || '2',
                  rating: oppProf.rating || prev?.rating || 1200,
                  id: oppId
                }));
              }
            }
          }
        }
      } catch (e) {}
    };

    resolveRealOpponent();

    // Multi-Stage Direct Peer Handshake Engine (Ensures 100% mutual delivery across all network speeds)
    const syncMyInfo = () => {
      const myName = profile?.name || profile?.display_name;
      if (myName) {
        realtimeManager.broadcastToMatch(matchId, 'player_info_sync', {
          senderId: profile?.id,
          name: myName,
          avatarId: profile?.avatarId || '1',
          rating: profile?.rating || 1200,
          isEcho: false
        });
      }
    };

    const t1 = setTimeout(syncMyInfo, 100);
    const t2 = setTimeout(syncMyInfo, 400);
    const t3 = setTimeout(syncMyInfo, 1200);
    const t4 = setTimeout(syncMyInfo, 2500);

    realtimeManager.subscribeToMatch(matchId, profile?.id, {
      onPlayerInfoSync: (info) => {
        if (info?.name && !info.name.startsWith('Player')) {
          setOpponentProfile(prev => ({
            ...prev,
            name: info.name,
            avatarId: info.avatarId || prev?.avatarId || '2',
            rating: info.rating || prev?.rating || 1200,
            id: info.senderId
          }));

          // Mutual Handshake Echo: Reply immediately if this wasn't already an echo
          if (!info.isEcho) {
            const myName = profile?.name || profile?.display_name;
            if (myName) {
              realtimeManager.broadcastToMatch(matchId, 'player_info_sync', {
                senderId: profile?.id,
                name: myName,
                avatarId: profile?.avatarId || '1',
                rating: profile?.rating || 1200,
                isEcho: true
              });
            }
          }
        }
      },
      onReactionEmoji: (reactionData) => {
        if (reactionData) {
          if (reactionData.sender && !reactionData.sender.startsWith('Player')) {
            setOpponentProfile(prev => ({
              ...prev,
              name: reactionData.sender,
              avatarId: reactionData.senderAvatarId || prev?.avatarId || '2',
              rating: reactionData.senderRating || prev?.rating || 1200
            }));
          }
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
          if (chatData.sender && !chatData.sender.startsWith('Player')) {
            setOpponentProfile(prev => ({
              ...prev,
              name: chatData.sender,
              avatarId: chatData.senderAvatarId || prev?.avatarId || '2',
              rating: chatData.senderRating || prev?.rating || 1200
            }));
          }
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

        // Auto-extract and lock opponent profile from live move payload
        if (serverState.senderName && serverState.senderId !== profile?.id && !serverState.senderName.startsWith('Player')) {
          setOpponentProfile(prev => ({
            ...prev,
            name: serverState.senderName,
            avatarId: serverState.senderAvatarId || prev?.avatarId || '2',
            rating: serverState.senderRating || prev?.rating || 1200,
            id: serverState.senderId
          }));
        }

        const incomingBoard = serverState.board_state || serverState.board;

        const rawTurn = serverState.current_turn !== undefined ? serverState.current_turn : serverState.turn;
        const incomingTurn = (rawTurn === 1 || rawTurn === '1' || rawTurn === 'X' || rawTurn === 'BLACK' || rawTurn === 'P1' || rawTurn === 'RED') ? BLACK : WHITE;
        const incomingResult = serverState.status || serverState.result;
        const winnerId = serverState.winner_id || serverState.winnerId;

        if (incomingBoard && Array.isArray(incomingBoard) && incomingBoard.length === BOARD_SIZE) {
          // Merge server board with local board so no stone is ever erased
          const finalBoard = incomingBoard.map((row, r) =>
            Array.isArray(row)
              ? row.map((cell, c) => (cell !== EMPTY ? cell : (boardRef.current && boardRef.current[r] ? boardRef.current[r][c] : EMPTY)))
              : []
          );

          setBoard(finalBoard);
          setCurrentPlayer(incomingTurn);
          setIsSubmittingMove(false);
          soundSynth.playRotate();

          const winResult = scanBoardForWinner(finalBoard);
          if (winResult?.stones && winResult.stones.length > 0) {
            setWinningStones(winResult.stones);
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
            const winStone = isWin ? (isMyWin ? myRoleRef.current : (myRoleRef.current === BLACK ? WHITE : BLACK)) : 'DRAW';

            handleFinalizeMatchRef.current(outcome, '', winStone);
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
            if (rawBoard && Array.isArray(rawBoard) && rawBoard.length === BOARD_SIZE) {
              const finalBoard = rawBoard.map((row, r) =>
                Array.isArray(row)
                  ? row.map((cell, c) => (cell !== EMPTY ? cell : (boardRef.current && boardRef.current[r] ? boardRef.current[r][c] : EMPTY)))
                  : []
              );

              latestBoard = finalBoard;
              setBoard(finalBoard);
              const incomingTurn = (rawTurn === 'X' || rawTurn === 'BLACK' || rawTurn === 'P1') ? BLACK : WHITE;
              setCurrentPlayer(incomingTurn);
              latestWinResult = scanBoardForWinner(finalBoard);
              if (latestWinResult?.stones && latestWinResult.stones.length > 0) {
                setWinningStones(latestWinResult.stones);
              }
              if (rawResult && rawResult !== 'ACTIVE') {
                const isWin = rawResult === 'WIN' || rawResult === 'FINISHED';
                const isMyWin = isWin && (winnerId === profile?.id || stateData.winnerSymbol === myRoleRef.current || latestWinResult?.winner === myRoleRef.current);
                const isDraw = rawResult === 'DRAW' || latestWinResult?.winner === 'DRAW';
                const outcome = isMyWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
                const winStone = isWin ? (isMyWin ? myRoleRef.current : (myRoleRef.current === BLACK ? WHITE : BLACK)) : 'DRAW';
                handleFinalizeMatchRef.current(outcome, '', winStone);
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
            let dbOppName = (matchData.player_1_id === profile?.id) ? matchData.player_2_name : matchData.player_1_name;
            if (dbOppName && dbOppName !== 'Opponent' && !dbOppName.startsWith('Player')) {
              setOpponentProfile(prev => ({ ...prev, name: dbOppName, id: oppId }));
            }
            if (oppId) {
              const { data: oppProfile } = await supabase
                .from('profiles')
                .select('id, username, display_name, name, avatar_url, avatar_id, rating')
                .eq('id', oppId)
                .maybeSingle();

              if (oppProfile) {
                const finalName = oppProfile.display_name || oppProfile.name || (oppProfile.username ? `@${oppProfile.username}` : '') || dbOppName;
                if (finalName && !finalName.startsWith('Player')) {
                  setOpponentProfile(prev => ({
                    ...prev,
                    name: finalName,
                    avatarId: oppProfile.avatar_url || oppProfile.avatar_id || prev?.avatarId || '2',
                    rating: oppProfile.rating || prev?.rating || 1200
                  }));
                }
              }
            }


            if (matchData.result === 'FINISHED' || matchData.result === 'DRAW') {
              const isMyWin = matchData.winner_id === profile?.id;
              const isDraw = matchData.result === 'DRAW';
              const outcome = isMyWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
              const winStone = isMyWin ? myRoleRef.current : (myRoleRef.current === BLACK ? WHITE : BLACK);
              if (latestBoard) {
                const wr = scanBoardForWinner(latestBoard);
                if (wr?.stones && wr.stones.length > 0) {
                  setWinningStones(wr.stones);
                }
              }
              handleFinalizeMatchRef.current(outcome, '', winStone);
            }
          }
        }
      } catch (e) {}
    };



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
    const emptyBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    setBoard(emptyBoard);
    setCurrentPlayer(BLACK);
    setWinner(null);
    setWinningStones([]);
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
    const emptyBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    await gameEngineService.resetMatchState(onlineSession.matchId, emptyBoard, BLACK);
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


  const handlePlaceStone = async (r, c) => {
    if (winner || board[r][c] !== EMPTY || isAiThinking || isSubmittingMove) return;

    if (isOnline) {
      if (currentPlayer !== myRole) return;

      setIsSubmittingMove(true);
      // Auto-unlock safety timeout
      if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
      submitLockTimeoutRef.current = setTimeout(() => {
        setIsSubmittingMove(false);
      }, 3500);

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

      if (winResult?.stones && winResult.stones.length > 0) {
        setWinningStones(winResult.stones);
      }

      // Zero-latency broadcast to opponent (<10ms)
      realtimeManager.broadcastToMatch(onlineSession.matchId, 'match_move', {
        board: optimisticBoard,
        turn: nextTurn,
        result: outcomeResult,
        winner_id: isWin ? profile?.id : null,
        winnerSymbol: isWin ? myRole : null,
        winningStones: winResult?.stones || [],
        senderId: profile?.id,
        senderName: profile?.name || profile?.display_name,
        senderAvatarId: profile?.avatarId || '1',
        senderRating: profile?.rating || 1200
      });


      if (isWin || isDraw) {
        handleFinalizeMatch(outcomeResult === 'WIN' ? 'WIN' : 'DRAW', '', myRole);
      }

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
          const rawTurn = res.state.current_turn !== undefined ? res.state.current_turn : res.state.turn;
          if (rawTurn !== undefined && rawTurn !== null) {
            setCurrentPlayer((rawTurn === 1 || rawTurn === '1' || rawTurn === 'X' || rawTurn === 'BLACK' || rawTurn === 'P1' || rawTurn === 'RED') ? BLACK : WHITE);
          }


          if (res.state.result && res.state.result !== 'ACTIVE') {
            const isWinMatch = res.state.result === 'WIN' || res.state.result === 'FINISHED';
            const isMyWin = isWinMatch && (res.state.winner_id === profile?.id || res.state.winnerSymbol === myRole);
            const isDrawMatch = res.state.result === 'DRAW';
            const outcome = isMyWin ? 'WIN' : (isDrawMatch ? 'DRAW' : 'LOSS');
            const winStone = isWinMatch ? (isMyWin ? myRole : (myRole === BLACK ? WHITE : BLACK)) : 'DRAW';

            handleFinalizeMatch(outcome, '', winStone);
          }
        }
      } catch (e) {

        console.error('[Gomoku Move Exception]:', e);
      } finally {
        if (submitLockTimeoutRef.current) clearTimeout(submitLockTimeoutRef.current);
        setIsSubmittingMove(false);
      }
    } else {
      // Local Mode
      soundSynth.playRotate();
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = currentPlayer;
      const newHistory = [...history, { r, c, player: currentPlayer }];

      setBoard(newBoard);
      setHistory(newHistory);

      const winResult = checkWin(newBoard, r, c, currentPlayer);
      if (winResult) {
        setWinningStones(winResult.stones || []);
        const isWin = winResult.winner === BLACK;
        const isLoss = winResult.winner === WHITE;
        const outcome = isWin ? 'WIN' : (isLoss ? 'LOSS' : 'DRAW');

        handleFinalizeMatch(outcome, '', winResult.winner);
      } else {
        const nextPlayer = currentPlayer === BLACK ? WHITE : BLACK;
        setCurrentPlayer(nextPlayer);
      }
    }
  };


  // 3-Tier Tactical Gomoku AI (EASY, MEDIUM, HARD)
  useEffect(() => {
    if (gameMode === 'VS_COMPUTER' && currentPlayer === WHITE && !winner) {
      setIsAiThinking(true);

      const delay = aiDifficulty === 'HARD' ? 450 : 300;
      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const curBoard = boardRef.current;
        if (winnerRef.current) return;

        // If center is free on initial move, take center
        if (curBoard[7][7] === EMPTY) {
          handlePlaceStone(7, 7);
          return;
        }

        // Collect all candidates with neighbors
        const candidates = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (curBoard[r][c] === EMPTY) {
              let hasNeighbor = false;
              for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
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
                candidates.push({ r, c });
              }
            }
          }
        }

        if (candidates.length === 0) {
          handlePlaceStone(7, 7);
          return;
        }

        // Helper to count consecutive stones in a direction
        const countLine = (grid, r, c, dr, dc, player) => {
          let count = 0;
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && grid[nr][nc] === player) {
            count++;
            nr += dr;
            nc += dc;
          }
          return count;
        };

        const evaluateSpot = (grid, r, c, player) => {
          const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
          let maxStreak = 0;
          for (const [dr, dc] of DIRS) {
            const count = 1 + countLine(grid, r, c, dr, dc, player) + countLine(grid, r, c, -dr, -dc, player);
            if (count > maxStreak) maxStreak = count;
          }
          return maxStreak;
        };

        // 1. EASY AI: 50% Random candidate, 50% basic streak
        if (aiDifficulty === 'EASY') {
          if (Math.random() < 0.5) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            handlePlaceStone(pick.r, pick.c);
            return;
          }
        }

        // 2. Scan for instant win (5 in a row for AI White)
        for (const spot of candidates) {
          if (evaluateSpot(curBoard, spot.r, spot.c, WHITE) >= 5) {
            handlePlaceStone(spot.r, spot.c);
            return;
          }
        }

        // 3. Scan for critical block (Opponent Black 4 in a row)
        for (const spot of candidates) {
          if (evaluateSpot(curBoard, spot.r, spot.c, BLACK) >= 5) {
            handlePlaceStone(spot.r, spot.c);
            return;
          }
        }

        // 4. MEDIUM AI: Block 3-in-a-row or build own 3/4
        if (aiDifficulty === 'MEDIUM') {
          let bestMove = candidates[0];
          let bestScore = -1;

          for (const spot of candidates) {
            const myStreak = evaluateSpot(curBoard, spot.r, spot.c, WHITE);
            const oppStreak = evaluateSpot(curBoard, spot.r, spot.c, BLACK);
            const score = (myStreak * 2) + (oppStreak * 1.5) + (Math.random() * 0.5);
            if (score > bestScore) {
              bestScore = score;
              bestMove = spot;
            }
          }

          handlePlaceStone(bestMove.r, bestMove.c);
          return;
        }

        // 5. HARD AI (Grandmaster Strategic Pattern Heuristic)
        let bestMove = candidates[0];
        let highestScore = -Infinity;

        for (const spot of candidates) {
          const myStreak = evaluateSpot(curBoard, spot.r, spot.c, WHITE);
          const oppStreak = evaluateSpot(curBoard, spot.r, spot.c, BLACK);

          // Center distance weight
          const centerDist = Math.abs(spot.r - 7) + Math.abs(spot.c - 7);
          const centerScore = (14 - centerDist) * 2;

          let score = centerScore;
          if (myStreak >= 4) score += 5000;
          else if (myStreak === 3) score += 500;
          else if (myStreak === 2) score += 50;

          if (oppStreak >= 4) score += 4000;
          else if (oppStreak === 3) score += 450;
          else if (oppStreak === 2) score += 40;

          if (score > highestScore) {
            highestScore = score;
            bestMove = spot;
          }
        }

        handlePlaceStone(bestMove.r, bestMove.c);
      }, delay);

      return () => {
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      };
    }
  }, [currentPlayer, gameMode, winner, aiDifficulty]);


  // Active Turn Countdown Timer with Monotonic Timestamps
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
          // Opponent's turn: 6-second grace buffer past 0 for network latency
          if (remainingSec <= -6) {
            clearInterval(timer);
            handleFinalizeMatch('WIN', 'Opponent timed out');
          }
        }
      } else {
        if (remainingSec <= 0) {
          clearInterval(timer);
          if (gameMode === 'VS_COMPUTER') {
            if (currentPlayer === BLACK) {
              handleFinalizeMatch('LOSS', 'Time expired');
            }
          } else if (gameMode === 'LOCAL_2P') {
            setWinner(currentPlayer === BLACK ? WHITE : BLACK);
          }
        }
      }


      if (remainingSec <= 5 && remainingSec > 0) {
        try { soundSynth.playRotate(); } catch (e) {}
      }
    }, 500);

    return () => clearInterval(timer);
  }, [currentPlayer, winner, turnTimeLimit, isOnline, gameMode, myRole, handleFinalizeMatch]);

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
        p1Name={profile?.display_name || profile?.name}
        p1AvatarId={profile?.avatarId || '1'}
        p1Rating={profile?.rating || 1200}
        p1Score={isOnline ? (myRole === BLACK ? scores.black : scores.white) : scores.black}
        p1Symbol={isOnline ? (myRole === BLACK ? 'BLACK STONE' : 'WHITE STONE') : 'BLACK STONE'}
        p1Color={isOnline ? (myRole === BLACK ? '#0f172a' : '#94a3b8') : '#0f172a'}
        p2Name={isOnline ? (opponentProfile?.display_name || opponentProfile?.name) : (gameMode === 'VS_COMPUTER' ? 'Grandmaster AI' : localPlayerNames?.p2)}
        p2AvatarId={isOnline ? (opponentProfile?.avatarId || '2') : '2'}
        p2Rating={isOnline ? (opponentProfile?.rating || 1200) : (gameMode === 'VS_COMPUTER' ? 1650 : 1200)}
        p2Score={isOnline ? (myRole === BLACK ? scores.white : scores.black) : scores.white}
        p2Symbol={isOnline ? (myRole === BLACK ? 'WHITE STONE' : 'BLACK STONE') : 'WHITE STONE'}
        p2Color={isOnline ? (myRole === BLACK ? '#94a3b8' : '#0f172a') : '#94a3b8'}
        isP1Turn={isMyTurn}
        isGameOver={!!winner}
        gameMode={gameMode}

        winnerText={
          isOnline ? (
            winner === myRole ? 'YOU WON!' :
            winner && winner !== 'DRAW' ? 'YOU LOST!' :
            winner === 'DRAW' ? 'DRAW MATCH!' : null
          ) : (
            winner === BLACK ? (gameMode === 'LOCAL_2P' ? `${localPlayerNames?.p1 || profile?.name} Won!` : 'YOU WON!') :
            winner === WHITE ? (gameMode === 'VS_COMPUTER' ? 'AI Bot Won!' : `${localPlayerNames?.p2} Won!`) :
            winner === 'DRAW' ? 'DRAW MATCH!' : null
          )
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

        {/* Premium In-Board Victory Tag */}
        {winner && (
          <InBoardVictoryBadge
            winner={winner}
            myRole={myRole}
            gameType="gomoku"
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
          opponentName={opponentProfile?.name || (gameMode === 'VS_COMPUTER' ? 'Grandmaster AI' : localPlayerNames?.p2)}
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


