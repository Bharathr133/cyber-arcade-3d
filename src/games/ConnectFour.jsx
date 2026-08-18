import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, User, Bot, Wifi } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/soundSynth.js';
import { realtimeManager } from '../services/realtimeManager.js';
import { gameEngineService } from '../services/gameEngineService.js';
import { saveGameState, loadGameState } from '../utils/gameStateStorage.js';
import { getUserProfile } from '../utils/userProfile.js';
import LiveEmojiReactionSystem from '../components/LiveEmojiReactionSystem.jsx';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import MatchResultModal from '../components/MatchResultModal.jsx';

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

export default function ConnectFour({ 
  profile, 
  initialMode = 'VS_COMPUTER', 
  onlineSession = null, 
  settings, 
  onMatchFinished, 
  onGoHome 
}) {
  const isOnline = initialMode === 'ONLINE_MATCH' && !!onlineSession?.matchId;
  const turnTimeLimit = settings?.turnTimeLimit !== undefined ? settings.turnTimeLimit : 30;

  const [initialState] = useState(() => loadGameState('connect4', DEFAULT_C4_STATE));

  const [board, setBoard] = useState(initialState.board);
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [gameMode] = useState(isOnline ? 'ONLINE_MATCH' : initialMode);
  const [myRole, setMyRole] = useState(onlineSession?.myRole === 'O' ? YELLOW : RED);
  const [winner, setWinner] = useState(initialState.winner);
  const [winningCells, setWinningCells] = useState(initialState.winningCells || []);
  const [scores, setScores] = useState(initialState.scores || { red: 0, yellow: 0, draws: 0 });
  const [history, setHistory] = useState(initialState.history || []);
  const [hoveredCol, setHoveredCol] = useState(null);
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


  const checkWin = (grid) => {
    // 1. Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = grid[r][c];
        if (val !== EMPTY && val === grid[r][c+1] && val === grid[r][c+2] && val === grid[r][c+3]) {
          return { winner: val, cells: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
        }
      }
    }

    // 2. Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 3; r++) {
        const val = grid[r][c];
        if (val !== EMPTY && val === grid[r+1][c] && val === grid[r+2][c] && val === grid[r+3][c]) {
          return { winner: val, cells: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
        }
      }
    }

    // 3. Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = grid[r][c];
        if (val !== EMPTY && val === grid[r-1][c+1] && val === grid[r-2][c+2] && val === grid[r-3][c+3]) {
          return { winner: val, cells: [[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]] };
        }
      }
    }

    // 4. Diagonal Down-Right
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = grid[r][c];
        if (val !== EMPTY && val === grid[r+1][c+1] && val === grid[r+2][c+2] && val === grid[r+3][c+3]) {
          return { winner: val, cells: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
        }
      }
    }

    // 5. Draw
    const isFull = grid[0].every(cell => cell !== EMPTY);
    if (isFull) return { winner: 'DRAW', cells: [] };

    return null;
  };

  // Realtime Integration for Online Match
  useEffect(() => {
    if (!isOnline || !onlineSession?.matchId) return;

    setMyRole(onlineSession.myRole === 'O' ? YELLOW : RED);
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
        const incomingTurn = (rawTurn === 'X' || rawTurn === 'RED' || rawTurn === 'P1' || rawTurn === 1 || rawTurn === '1' || rawTurn === RED) ? RED : YELLOW;
        const incomingResult = serverState.status || serverState.result;

        const winnerId = serverState.winner_id || serverState.winnerId;

        if (incomingBoard) {
          setBoard(incomingBoard);
          setCurrentPlayer(incomingTurn);

          if (incomingResult && incomingResult !== 'ACTIVE') {
            const isWin = incomingResult === 'WIN';
            const winPiece = isWin ? (winnerId === profile?.id ? myRoleRef.current : (myRoleRef.current === RED ? YELLOW : RED)) : 'DRAW';
            setWinner(winPiece);

            const outcome = winnerId === profile?.id ? 'WIN' : (incomingResult === 'DRAW' ? 'DRAW' : 'LOSS');
            const delta = outcome === 'WIN' ? 16 : (outcome === 'DRAW' ? 0 : -16);

            setResultModal({
              isOpen: true,
              outcome,
              ratingDelta: delta,
              xpGained: outcome === 'WIN' ? 30 : 10
            });

            if (onMatchFinished) {
              onMatchFinished('connect4', outcome, opponentProfile?.name || 'Opponent');
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
              onMatchFinished('connect4', 'WIN', opponentProfile?.name || 'Opponent');
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
          onMatchFinished('connect4', 'WIN', opponentProfile?.name || 'Opponent');
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
              const incomingTurn = (rawTurn === 'X' || rawTurn === 'RED' || rawTurn === 'P1') ? RED : YELLOW;
              setCurrentPlayer(incomingTurn);
              if (rawResult && rawResult !== 'ACTIVE') {
                const isWin = rawResult === 'WIN';
                const winPiece = isWin ? (winnerId === profile?.id ? myRoleRef.current : (myRoleRef.current === RED ? YELLOW : RED)) : 'DRAW';
                setWinner(winPiece);
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
    const emptyBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    setBoard(emptyBoard);
    setCurrentPlayer(RED);
    setWinner(null);
    setWinningCells([]);
    setHistory([]);
    setHoveredCol(null);
    setTimeLeft(turnTimeLimit > 0 ? turnTimeLimit : 30);
    setResultModal({ isOpen: false, outcome: null, ratingDelta: 0, xpGained: 0 });
  }, [turnTimeLimit]);

  const handleDropToken = async (colIdx) => {
    if (winner || isAiThinking || isSubmittingMove) return;

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][colIdx] === EMPTY) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) return;

    if (isOnline) {
      if (currentPlayer !== myRole) return;

      setIsSubmittingMove(true);
      soundSynth.playRotate();

      // Optimistic instant board update
      const optimisticBoard = board.map(row => [...row]);
      optimisticBoard[targetRow][colIdx] = myRole;
      const nextTurn = myRole === RED ? YELLOW : RED;
      setBoard(optimisticBoard);
      setCurrentPlayer(nextTurn);

      const winResult = checkWin(optimisticBoard);
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
              onMatchFinished('connect4', outcome, opponentProfile?.name || 'Opponent');
            }
          }
        }
      } catch (e) {
        console.error('[Connect4 Move Exception]:', e);
      } finally {
        setIsSubmittingMove(false);
      }
    } else {
      // Local Mode
      soundSynth.playRotate();
      const newBoard = board.map(row => [...row]);
      newBoard[targetRow][colIdx] = currentPlayer;
      const newHistory = [...historyRef.current, { col: colIdx, row: targetRow, player: currentPlayer }];

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
          outcome = 'WIN';
          delta = 16;
          xp = 30;
        } else if (winResult.winner === YELLOW) {
          updatedScores.yellow = (updatedScores.yellow || 0) + 1;
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
          onMatchFinished('connect4', outcome, gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2');
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
        const nextPlayer = currentPlayer === RED ? YELLOW : RED;
        setCurrentPlayer(nextPlayer);
      }
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

        // Find valid columns
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
          if (curBoard[0][c] === EMPTY) validCols.push(c);
        }
        if (validCols.length === 0) return;

        // 1. AI Immediate Win
        for (let c of validCols) {
          let r = -1;
          for (let row = ROWS - 1; row >= 0; row--) {
            if (curBoard[row][c] === EMPTY) { r = row; break; }
          }
          if (r !== -1) {
            const test = curBoard.map(row => [...row]);
            test[r][c] = YELLOW;
            const res = checkWin(test);
            if (res && res.winner === YELLOW) {
              handleDropToken(c);
              return;
            }
          }
        }

        // 2. Block Opponent Win
        for (let c of validCols) {
          let r = -1;
          for (let row = ROWS - 1; row >= 0; row--) {
            if (curBoard[row][c] === EMPTY) { r = row; break; }
          }
          if (r !== -1) {
            const test = curBoard.map(row => [...row]);
            test[r][c] = RED;
            const res = checkWin(test);
            if (res && res.winner === RED) {
              handleDropToken(c);
              return;
            }
          }
        }

        // 3. Center Column Priority
        if (validCols.includes(3)) {
          handleDropToken(3);
          return;
        }

        // 4. Random from remaining
        const randomCol = validCols[Math.floor(Math.random() * validCols.length)];
        handleDropToken(randomCol);
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
              setWinner(myRole === RED ? YELLOW : RED);
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
                reason: 'Opponent ran out of time'
              });
            }
          } else if (gameMode === 'VS_COMPUTER') {
            if (currentPlayer === RED) {
              setWinner(YELLOW);
              setResultModal({
                isOpen: true,
                outcome: 'LOSS',
                ratingDelta: -10,
                xpGained: 10
              });
            }
          } else if (gameMode === 'LOCAL_2P') {
            setWinner(currentPlayer === RED ? YELLOW : RED);
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

  const isMyTurn = isOnline ? (currentPlayer === myRole) : (gameMode === 'LOCAL_2P' || currentPlayer === RED);


  return (
    <div style={{
      width: '100%',
      maxWidth: 'min(420px, calc(100dvh - 120px), 100vw)',
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
          background: isMyTurn ? '#eff6ff' : '#f8fafc',
          border: isMyTurn ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
          color: isMyTurn ? '#1e3a8a' : '#64748b',
          boxShadow: isMyTurn ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isMyTurn ? (myRole === RED ? '#ef4444' : '#eab308') : '#94a3b8',
            display: 'inline-block'
          }} />
          <span>
            {isMyTurn 
              ? `YOUR TURN (${myRole === RED ? 'RED' : 'YELLOW'}) — DROP A DISC` 
              : `WAITING FOR OPPONENT (${myRole === RED ? 'YELLOW' : 'RED'}) TO MOVE...`}
          </span>
        </div>
      )}

      {/* Dual Player Bar */}
      <MatchPlayerBar
        p1Name={profile?.name || 'You'}
        p1AvatarId={profile?.avatarId || '1'}
        p1Rating={profile?.rating || 1200}
        p1Score={scores.red}
        p1Symbol="RED DISC"
        p1Color="#ef4444"
        p2Name={isOnline ? (opponentProfile?.name || 'Opponent') : (gameMode === 'VS_COMPUTER' ? 'Smart AI' : 'Player 2')}
        p2AvatarId={isOnline ? (opponentProfile?.avatarId || '2') : '2'}
        p2Rating={isOnline ? (opponentProfile?.rating || 1200) : 1200}
        p2Score={scores.yellow}
        p2Symbol="YELLOW DISC"
        p2Color="#eab308"
        isP1Turn={isMyTurn}
        isGameOver={!!winner}
        gameMode={gameMode}
        winnerText={
          winner === RED ? (gameMode === 'VS_COMPUTER' ? 'YOU WIN' : 'RED WINS') :
          winner === YELLOW ? (gameMode === 'VS_COMPUTER' ? 'AI WINS' : 'YELLOW WINS') :
          winner === 'DRAW' ? 'DRAW' : null
        }
        timeLeft={timeLeft}
      />

      {/* Connect 4 Vertical Board */}
      <div style={{
        position: 'relative',
        background: '#1e3a8a',
        padding: 'clamp(8px, 2vw, 14px)',
        borderRadius: '20px',
        border: '3px solid #172554',
        boxShadow: '0 20px 35px -5px rgba(30, 58, 138, 0.45)',
        width: '100%',
        aspectRatio: '7 / 6',
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gap: 'clamp(4px, 1.2vw, 8px)',
        boxSizing: 'border-box'
      }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isWinningCell = winningCells.some(([wr, wc]) => wr === r && wc === c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleClickCol(c)}
                onMouseEnter={() => setHoveredCol(c)}
                onMouseLeave={() => setHoveredCol(null)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#0f172a',
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
                {cell === RED && (
                  <div
                    className="animate-pop-in"
                    style={{
                      width: '90%', height: '90%', borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #f87171, #dc2626 60%, #991b1b)',
                      boxShadow: isWinningCell ? '0 0 20px #ef4444, inset 0 2px 4px rgba(255,255,255,0.4)' : 'inset 0 2px 4px rgba(255,255,255,0.4)',
                      border: isWinningCell ? '2px solid #ffffff' : 'none',
                      transform: isWinningCell ? 'scale(1.08)' : 'scale(1)'
                    }}
                  />
                )}
                {cell === YELLOW && (
                  <div
                    className="animate-pop-in"
                    style={{
                      width: '90%', height: '90%', borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #fde047, #eab308 60%, #a16207)',
                      boxShadow: isWinningCell ? '0 0 20px #eab308, inset 0 2px 4px rgba(255,255,255,0.4)' : 'inset 0 2px 4px rgba(255,255,255,0.4)',
                      border: isWinningCell ? '2px solid #ffffff' : 'none',
                      transform: isWinningCell ? 'scale(1.08)' : 'scale(1)'
                    }}
                  />
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
        gameTitle="Connect Four (7×6)"
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

  function handleClickCol(colIdx) {
    handleDropToken(colIdx);
  }
}
