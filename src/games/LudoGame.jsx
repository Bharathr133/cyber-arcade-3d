import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RotateCcw, Trophy, Star, Bot, User, Dices, Clock, Flame, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/soundSynth.js';
import MatchResultModal from '../components/MatchResultModal.jsx';

// 4 Classic Tournament Player Themes & Colors (Realistic Board Palette)
export const LUDO_PLAYERS = [
  { id: 0, key: 'red', name: 'Red', color: '#dc2626', darkColor: '#991b1b', lightBg: '#fef2f2', border: '#b91c1c', startPos: 0, baseSlots: [{ r: 10, c: 1 }, { r: 10, c: 3 }, { r: 12, c: 1 }, { r: 12, c: 3 }] },
  { id: 1, key: 'green', name: 'Green', color: '#16a34a', darkColor: '#14532d', lightBg: '#f0fdf4', border: '#15803d', startPos: 13, baseSlots: [{ r: 1, c: 1 }, { r: 1, c: 3 }, { r: 3, c: 1 }, { r: 3, c: 3 }] },
  { id: 2, key: 'yellow', name: 'Yellow', color: '#ca8a04', darkColor: '#713f12', lightBg: '#fefce8', border: '#a16207', startPos: 26, baseSlots: [{ r: 1, c: 10 }, { r: 1, c: 12 }, { r: 3, c: 10 }, { r: 3, c: 12 }] },
  { id: 3, key: 'blue', name: 'Blue', color: '#2563eb', darkColor: '#1e3a8a', lightBg: '#eff6ff', border: '#1d4ed8', startPos: 39, baseSlots: [{ r: 10, c: 10 }, { r: 10, c: 12 }, { r: 12, c: 10 }, { r: 12, c: 12 }] }
];

// 52 Common Perimeter Grid Coordinates
export const MAIN_TRACK_COORDS = [
  // Red Track (0 - 4: Up)
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  // Left branch (5 - 10: Left & Up)
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 }, { r: 6, c: 0 },
  // Green Track (13 - 17: Right)
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  // Top branch (18 - 23: Up & Right)
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 }, { r: 0, c: 8 },
  // Yellow Track (26 - 30: Down)
  { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  // Right branch (31 - 36: Right & Down)
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 }, { r: 8, c: 14 },
  // Blue Track (39 - 43: Left)
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  // Bottom branch (44 - 51: Down & Left)
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 }, { r: 14, c: 6 }
];

export const SAFE_STAR_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export const HOME_RUN_COORDS = {
  0: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }], // Red
  1: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }], // Green
  2: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }], // Yellow
  3: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }]  // Blue
};

const createInitialTokens = () => [
  { id: 0, step: -1 },
  { id: 1, step: -1 },
  { id: 2, step: -1 },
  { id: 3, step: -1 }
];

// Realistic Dice Face (1 to 6 Pips)
function RealisticDiceFace({ value, size = 34 }) {
  const pips = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [25, 75], [75, 25], [75, 75]],
    5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
    6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]]
  };

  const points = pips[value] || pips[1];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#ffffff" stroke="#0f172a" strokeWidth="6" />
      {points.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={value === 1 ? 12 : 9} fill={value === 1 ? '#dc2626' : '#0f172a'} />
      ))}
    </svg>
  );
}

export default function LudoGame({
  profile,
  initialMode = 'VS_COMPUTER', // 'VS_COMPUTER', 'LOCAL_2P', 'LOCAL_4P'
  onMatchFinished,
  onGoHome
}) {
  const [playerCount, setPlayerCount] = useState(initialMode === 'LOCAL_4P' ? 4 : (initialMode === 'LOCAL_2P' ? 2 : 4));
  const [isBotMode, setIsBotMode] = useState(initialMode === 'VS_COMPUTER');

  const activePlayers = playerCount === 2 
    ? [LUDO_PLAYERS[0], LUDO_PLAYERS[2]] // Red vs Yellow
    : playerCount === 3 
      ? [LUDO_PLAYERS[0], LUDO_PLAYERS[1], LUDO_PLAYERS[2]]
      : LUDO_PLAYERS; // 4P

  const [tokens, setTokens] = useState({
    0: createInitialTokens(),
    1: createInitialTokens(),
    2: createInitialTokens(),
    3: createInitialTokens()
  });

  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [movableTokenIds, setMovableTokenIds] = useState([]);
  const [winner, setWinner] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25);
  const [logMessage, setLogMessage] = useState('Roll the dice to start your turn.');

  const [resultModal, setResultModal] = useState({
    isOpen: false,
    outcome: null,
    ratingDelta: 0,
    xpGained: 0,
    reason: ''
  });

  const currentPlayerObj = activePlayers[currentTurnIdx] || activePlayers[0];
  const isCurrentPlayerBot = isBotMode && currentPlayerObj.id !== 0;

  // Turn Countdown Timer
  useEffect(() => {
    if (winner) return;

    setTimeLeft(25);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTurnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTurnIdx, winner]);

  const handleTurnTimeout = () => {
    soundSynth.playRotate();
    setDiceValue(null);
    setMovableTokenIds([]);
    advanceToNextPlayer();
  };

  const handleResetGame = () => {
    soundSynth.playRotate();
    setTokens({
      0: createInitialTokens(),
      1: createInitialTokens(),
      2: createInitialTokens(),
      3: createInitialTokens()
    });
    setCurrentTurnIdx(0);
    setDiceValue(null);
    setIsRolling(false);
    setMovableTokenIds([]);
    setWinner(null);
    setTimeLeft(25);
    setLogMessage('Game restarted. Roll the dice!');
  };

  const advanceToNextPlayer = useCallback(() => {
    setDiceValue(null);
    setMovableTokenIds([]);
    setCurrentTurnIdx(prev => (prev + 1) % activePlayers.length);
  }, [activePlayers.length]);

  const getMovableTokens = (pId, roll) => {
    const playerTokens = tokens[pId];
    const valid = [];

    playerTokens.forEach(t => {
      if (t.step === -1) {
        if (roll === 6) valid.push(t.id);
      } else if (t.step >= 0 && t.step < 56) {
        if (t.step + roll <= 56) {
          valid.push(t.id);
        }
      }
    });

    return valid;
  };

  // Roll Dice Action
  const handleRollDice = () => {
    if (isRolling || diceValue !== null || winner) return;

    setIsRolling(true);
    soundSynth.playClick();

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 6) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        soundSynth.playVictory();
        processDiceRoll(finalRoll);
      }
    }, 60);
  };

  // Process Roll
  const processDiceRoll = (roll) => {
    const pId = currentPlayerObj.id;
    const movable = getMovableTokens(pId, roll);
    setMovableTokenIds(movable);

    if (movable.length === 0) {
      setLogMessage(`${currentPlayerObj.name} rolled a ${roll}. No valid move.`);
      setTimeout(advanceToNextPlayer, 800);
    } else if (movable.length === 1 && !isCurrentPlayerBot) {
      // Auto move single option
      setLogMessage(`${currentPlayerObj.name} rolled a ${roll}. Moving piece...`);
      setTimeout(() => {
        handleMoveToken(movable[0], roll);
      }, 300);
    } else {
      setLogMessage(`${currentPlayerObj.name} rolled a ${roll}. Select a piece to advance.`);
    }
  };

  // Move Token
  const handleMoveToken = (tokenId, rollOverride = null) => {
    const roll = rollOverride || diceValue;
    if (!roll || !movableTokenIds.includes(tokenId)) return;

    const pId = currentPlayerObj.id;
    const playerTokens = [...tokens[pId]];
    const tokenIndex = playerTokens.findIndex(t => t.id === tokenId);
    if (tokenIndex === -1) return;

    soundSynth.playClick();

    let newStep;
    if (playerTokens[tokenIndex].step === -1 && roll === 6) {
      newStep = 0;
      setLogMessage(`${currentPlayerObj.name} brought a piece out.`);
    } else {
      newStep = playerTokens[tokenIndex].step + roll;
    }

    const updatedPlayerTokens = playerTokens.map(t =>
      t.id === tokenId ? { ...t, step: newStep } : t
    );

    const newTokens = { ...tokens, [pId]: updatedPlayerTokens };
    const targetToken = updatedPlayerTokens.find(t => t.id === tokenId);

    // Check Capture
    let capturedOpponent = false;
    if (targetToken.step >= 0 && targetToken.step <= 50) {
      const myGlobalPos = (currentPlayerObj.startPos + targetToken.step) % 52;
      const isSafeCell = SAFE_STAR_INDICES.includes(myGlobalPos);

      if (!isSafeCell) {
        activePlayers.forEach(opp => {
          if (opp.id !== pId) {
            const oppTokens = newTokens[opp.id];
            const updatedOppTokens = oppTokens.map(oppT => {
              if (oppT.step >= 0 && oppT.step <= 50) {
                const oppGlobalPos = (opp.startPos + oppT.step) % 52;
                if (oppGlobalPos === myGlobalPos) {
                  capturedOpponent = true;
                  soundSynth.playDefeat();
                  setLogMessage(`💥 ${currentPlayerObj.name} captured ${opp.name}! Bonus roll awarded.`);
                  return { ...oppT, step: -1 };
                }
              }
              return oppT;
            });
            newTokens[opp.id] = updatedOppTokens;
          }
        });
      }
    }

    setTokens(newTokens);
    setMovableTokenIds([]);

    // Check Victory
    const homeTokensCount = playerTokens.filter(t => t.step >= 56).length;
    if (homeTokensCount === 4) {
      handlePlayerVictory(pId);
      return;
    }

    // Bonus Turn on 6 or capture
    if (roll === 6 || capturedOpponent) {
      setDiceValue(null);
      if (roll === 6 && capturedOpponent) {
        setLogMessage(`${currentPlayerObj.name} rolled a 6 and captured! Double bonus turn!`);
      } else if (roll === 6) {
        setLogMessage(`${currentPlayerObj.name} rolled a 6 and gets another turn!`);
      } else {
        setLogMessage(`${currentPlayerObj.name} captured! Bonus turn!`);
      }
    } else {
      setTimeout(advanceToNextPlayer, 500);
    }
  };

  // Bot Turn Automation
  useEffect(() => {
    if (winner || !isCurrentPlayerBot || isRolling) return;

    const botTimer = setTimeout(() => {
      if (diceValue === null) {
        handleRollDice();
      } else if (movableTokenIds.length > 0) {
        const pId = currentPlayerObj.id;
        const playerTokens = tokens[pId];

        let bestTokenId = movableTokenIds[0];
        let maxScore = -1;

        movableTokenIds.forEach(tId => {
          const tok = playerTokens.find(t => t.id === tId);
          let score = 0;
          if (tok.step === -1 && diceValue === 6) score += 60;
          else if (tok.step + diceValue >= 56) score += 90;
          else score += tok.step;

          if (score > maxScore) {
            maxScore = score;
            bestTokenId = tId;
          }
        });

        setTimeout(() => {
          handleMoveToken(bestTokenId);
        }, 350);
      }
    }, 500);

    return () => clearTimeout(botTimer);
  }, [currentTurnIdx, diceValue, movableTokenIds, isCurrentPlayerBot, winner]);

  // Victory Handler
  const handlePlayerVictory = (winningPlayerId) => {
    const winningPlayer = LUDO_PLAYERS.find(p => p.id === winningPlayerId);
    setWinner(winningPlayer);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    soundSynth.playVictory();

    const isHumanWinner = winningPlayerId === 0;
    setResultModal({
      isOpen: true,
      outcome: isHumanWinner ? 'WIN' : 'LOSS',
      ratingDelta: isHumanWinner ? 25 : -12,
      xpGained: isHumanWinner ? 60 : 20,
      reason: `${winningPlayer.name} reached home with all 4 pieces and won!`
    });

    if (onMatchFinished) {
      onMatchFinished('ludo', isHumanWinner ? 'WIN' : 'LOSS', winningPlayer.name);
    }
  };

  const getTokenCoordinates = (playerObj, token) => {
    if (token.step === -1) {
      return playerObj.baseSlots[token.id] || { r: 1, c: 1 };
    }
    if (token.step >= 0 && token.step <= 50) {
      const trackIdx = (playerObj.startPos + token.step) % 52;
      return MAIN_TRACK_COORDS[trackIdx] || { r: 7, c: 7 };
    }
    const homeStep = token.step - 51;
    const homeRun = HOME_RUN_COORDS[playerObj.id];
    return homeRun[Math.min(homeStep, 5)] || { r: 7, c: 7 };
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '520px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Top Header: Mode & Timer */}
      <div style={{
        width: '100%',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box'
      }}>
        {/* Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => {
              setIsBotMode(true);
              setPlayerCount(4);
              handleResetGame();
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: isBotMode ? '#0f172a' : '#f1f5f9',
              color: isBotMode ? '#ffffff' : '#64748b',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Vs 3 Bots (Solo)
          </button>
          <button
            onClick={() => {
              setIsBotMode(false);
              setPlayerCount(2);
              handleResetGame();
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: !isBotMode && playerCount === 2 ? '#0f172a' : '#f1f5f9',
              color: !isBotMode && playerCount === 2 ? '#ffffff' : '#64748b',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            2P Classic
          </button>
          <button
            onClick={() => {
              setIsBotMode(false);
              setPlayerCount(4);
              handleResetGame();
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: !isBotMode && playerCount === 4 ? '#0f172a' : '#f1f5f9',
              color: !isBotMode && playerCount === 4 ? '#ffffff' : '#64748b',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            4P Local
          </button>
        </div>

        {/* Turn Timer & Restart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: timeLeft <= 5 ? '#fee2e2' : '#f1f5f9',
            color: timeLeft <= 5 ? '#ef4444' : '#0f172a',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '900',
            fontFamily: 'var(--font-mono)'
          }}>
            <Clock size={13} />
            <span>{timeLeft}s</span>
          </div>

          <button
            onClick={handleResetGame}
            title="Restart Match"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Turn Banner */}
      <div style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '14px',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: currentPlayerObj.color
          }} />
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
            {currentPlayerObj.name}'s Turn {isCurrentPlayerBot && '(Bot)'}
          </span>
        </div>

        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          {logMessage}
        </span>
      </div>

      {/* Classic Championship Ludo Board */}
      <div style={{
        width: '100%',
        aspectRatio: '1 / 1',
        background: '#ffffff',
        border: '4px solid #0f172a',
        borderRadius: '20px',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(15, 1fr)',
        gridTemplateRows: 'repeat(15, 1fr)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.15)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '2px'
      }}>
        {/* 4 Quadrants Bases */}
        {/* Red Base (Bottom-Left) */}
        <div style={{
          gridColumn: '1 / 7',
          gridRow: '10 / 16',
          background: '#dc2626',
          borderRadius: '16px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '80%', height: '80%', borderRadius: '12px', background: '#ffffff', border: '2px solid #b91c1c' }} />
        </div>

        {/* Green Base (Top-Left) */}
        <div style={{
          gridColumn: '1 / 7',
          gridRow: '1 / 7',
          background: '#16a34a',
          borderRadius: '16px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '80%', height: '80%', borderRadius: '12px', background: '#ffffff', border: '2px solid #15803d' }} />
        </div>

        {/* Yellow Base (Top-Right) */}
        <div style={{
          gridColumn: '10 / 16',
          gridRow: '1 / 7',
          background: '#ca8a04',
          borderRadius: '16px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '80%', height: '80%', borderRadius: '12px', background: '#ffffff', border: '2px solid #a16207' }} />
        </div>

        {/* Blue Base (Bottom-Right) */}
        <div style={{
          gridColumn: '10 / 16',
          gridRow: '10 / 16',
          background: '#2563eb',
          borderRadius: '16px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '80%', height: '80%', borderRadius: '12px', background: '#ffffff', border: '2px solid #1d4ed8' }} />
        </div>

        {/* Center Home Victory Area */}
        <div style={{
          gridColumn: '7 / 10',
          gridRow: '7 / 10',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #334155'
        }}>
          <Trophy size={26} color="#fbbf24" />
        </div>

        {/* 52 Track Cells */}
        {MAIN_TRACK_COORDS.map((coord, idx) => {
          const isSafeStar = SAFE_STAR_INDICES.includes(idx);
          let bg = '#ffffff';
          let border = '0.5px solid #cbd5e1';

          if (idx === 0) bg = '#fee2e2';
          else if (idx === 13) bg = '#dcfce7';
          else if (idx === 26) bg = '#fef9c3';
          else if (idx === 39) bg = '#dbeafe';

          return (
            <div
              key={`track_${idx}`}
              style={{
                gridRow: coord.r + 1,
                gridColumn: coord.c + 1,
                background: bg,
                border: border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}
            >
              {isSafeStar && <Star size={10} color="#b45309" fill="#f59e0b" />}
            </div>
          );
        })}

        {/* Home Run Tracks */}
        {HOME_RUN_COORDS[0].slice(0, 5).map((c, i) => (
          <div key={`hr_red_${i}`} style={{ gridRow: c.r + 1, gridColumn: c.c + 1, background: '#dc2626', border: '0.5px solid #b91c1c' }} />
        ))}
        {HOME_RUN_COORDS[1].slice(0, 5).map((c, i) => (
          <div key={`hr_green_${i}`} style={{ gridRow: c.r + 1, gridColumn: c.c + 1, background: '#16a34a', border: '0.5px solid #15803d' }} />
        ))}
        {HOME_RUN_COORDS[2].slice(0, 5).map((c, i) => (
          <div key={`hr_yellow_${i}`} style={{ gridRow: c.r + 1, gridColumn: c.c + 1, background: '#ca8a04', border: '0.5px solid #a16207' }} />
        ))}
        {HOME_RUN_COORDS[3].slice(0, 5).map((c, i) => (
          <div key={`hr_blue_${i}`} style={{ gridRow: c.r + 1, gridColumn: c.c + 1, background: '#2563eb', border: '0.5px solid #1d4ed8' }} />
        ))}

        {/* Classic Enamel Pawn Tokens */}
        {activePlayers.map(pObj => {
          const playerToks = tokens[pObj.id];

          return playerToks.map(t => {
            if (t.step >= 57) return null;

            const pos = getTokenCoordinates(pObj, t);
            const isMovable = pObj.id === currentPlayerObj.id && movableTokenIds.includes(t.id);

            return (
              <div
                key={`tok_${pObj.id}_${t.id}`}
                onClick={() => {
                  if (isMovable) handleMoveToken(t.id);
                }}
                style={{
                  gridRow: pos.r + 1,
                  gridColumn: pos.c + 1,
                  zIndex: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isMovable ? 'pointer' : 'default'
                }}
              >
                <div style={{
                  width: '80%',
                  height: '80%',
                  borderRadius: '50%',
                  background: pObj.color,
                  border: '2.5px solid #ffffff',
                  boxShadow: isMovable 
                    ? `0 0 14px ${pObj.color}, inset 0 2px 4px rgba(255,255,255,0.7)` 
                    : '0 3px 6px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)',
                  transform: isMovable ? 'scale(1.22)' : 'scale(1)',
                  animation: isMovable ? 'pulse 1s infinite' : 'none',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>
            );
          });
        })}
      </div>

      {/* Classic Dice Roller Box */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        padding: '12px 18px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: currentPlayerObj.color, color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '900', fontSize: '15px'
          }}>
            {currentPlayerObj.name[0]}
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
              {currentPlayerObj.name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              {isCurrentPlayerBot ? 'Computer' : 'Player'}
            </div>
          </div>
        </div>

        {/* Dice Action */}
        <button
          onClick={handleRollDice}
          disabled={isRolling || diceValue !== null || isCurrentPlayerBot || !!winner}
          style={{
            padding: '8px 18px',
            borderRadius: '12px',
            background: isRolling || diceValue !== null || isCurrentPlayerBot ? '#f1f5f9' : '#0f172a',
            color: isRolling || diceValue !== null || isCurrentPlayerBot ? '#64748b' : '#ffffff',
            border: 'none',
            fontSize: '13px',
            fontWeight: '900',
            cursor: !isRolling && diceValue === null && !isCurrentPlayerBot && !winner ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: !isRolling && diceValue === null && !isCurrentPlayerBot ? '0 4px 14px rgba(15, 23, 42, 0.2)' : 'none'
          }}
        >
          {diceValue !== null ? (
            <RealisticDiceFace value={diceValue} size={32} />
          ) : (
            <Dices size={20} />
          )}

          <span>{isRolling ? 'ROLLING...' : diceValue !== null ? `ROLLED ${diceValue}` : 'ROLL DICE'}</span>
        </button>
      </div>

      {/* Match Result Modal */}
      <MatchResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        outcome={resultModal.outcome}
        gameTitle="Ludo Championship"
        ratingDelta={resultModal.ratingDelta}
        xpGained={resultModal.xpGained}
        currentRating={profile?.rating || 1200}
        onRematch={handleResetGame}
        onGoHome={onGoHome}
      />
    </div>
  );
}
