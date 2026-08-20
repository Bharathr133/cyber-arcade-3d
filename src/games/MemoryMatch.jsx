import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RotateCcw, Trophy, Star, Shield, Crown, Anchor, Compass, 
  Key, Target, Flame, Gem, Rocket, Zap, Lock, ArrowRight, Play,
  Clock, Award, Layers, Bot, User, Check, Heart, Globe, Cpu, Atom, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '../utils/soundSynth.js';
import MatchPlayerBar from '../components/MatchPlayerBar.jsx';
import MatchResultModal from '../components/MatchResultModal.jsx';

const STORAGE_UNLOCKED_LEVEL_KEY = 'cyber_arcade_memory_unlocked_level';

// 18 Bespoke Hand-Curated Vector Symbols with Realistic Tonal Palettes
export const MEMORY_CARDS_CATALOG = [
  { id: 'crown', name: 'Crown', icon: Crown, color: '#b45309', border: '#d97706', bg: '#fffbeb' },
  { id: 'shield', name: 'Shield', icon: Shield, color: '#1d4ed8', border: '#3b82f6', bg: '#eff6ff' },
  { id: 'flame', name: 'Flame', icon: Flame, color: '#b91c1c', border: '#ef4444', bg: '#fef2f2' },
  { id: 'compass', name: 'Compass', icon: Compass, color: '#047857', border: '#10b981', bg: '#ecfdf5' },
  { id: 'anchor', name: 'Anchor', icon: Anchor, color: '#0369a1', border: '#0ea5e9', bg: '#f0f9ff' },
  { id: 'key', name: 'Key', icon: Key, color: '#6d28d9', border: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'sword', name: 'Target', icon: Target, color: '#be123c', border: '#f43f5e', bg: '#fff1f2' },
  { id: 'gem', name: 'Gem', icon: Gem, color: '#7e22ce', border: '#a855f7', bg: '#faf5ff' },
  { id: 'rocket', name: 'Rocket', icon: Rocket, color: '#0e7490', border: '#06b6d4', bg: '#ecfeff' },
  { id: 'zap', name: 'Lightning', icon: Zap, color: '#a16207', border: '#eab308', bg: '#fefce8' },
  { id: 'trophy', name: 'Trophy', icon: Trophy, color: '#92400e', border: '#f59e0b', bg: '#fffbeb' },
  { id: 'heart', name: 'Heart', icon: Heart, color: '#be123c', border: '#e11d48', bg: '#fff1f2' },
  { id: 'globe', name: 'Globe', icon: Globe, color: '#15803d', border: '#22c55e', bg: '#f0fdf4' },
  { id: 'cpu', name: 'Chip', icon: Cpu, color: '#334155', border: '#64748b', bg: '#f8fafc' },
  { id: 'atom', name: 'Atom', icon: Atom, color: '#0f766e', border: '#14b8a6', bg: '#f0fdfa' },
  { id: 'star', name: 'Star', icon: Star, color: '#b45309', border: '#f59e0b', bg: '#fffbeb' },
  { id: 'award', name: 'Award', icon: Award, color: '#4338ca', border: '#6366f1', bg: '#eef2ff' },
  { id: 'layers', name: 'Layers', icon: Layers, color: '#374151', border: '#4b5563', bg: '#f9fafb' }
];

export const CAMPAIGN_LEVELS = [
  { level: 1, name: 'Level 1', pairs: 6, cols: 4, rows: 3, timeLimit: 45, threeStarMoves: 9, twoStarMoves: 13 },
  { level: 2, name: 'Level 2', pairs: 8, cols: 4, rows: 4, timeLimit: 45, threeStarMoves: 13, twoStarMoves: 18 },
  { level: 3, name: 'Level 3', pairs: 10, cols: 5, rows: 4, timeLimit: 50, threeStarMoves: 17, twoStarMoves: 24 },
  { level: 4, name: 'Level 4', pairs: 12, cols: 6, rows: 4, timeLimit: 55, threeStarMoves: 21, twoStarMoves: 30 },
  { level: 5, name: 'Level 5', pairs: 18, cols: 6, rows: 6, timeLimit: 70, threeStarMoves: 32, twoStarMoves: 44 }
];

export default function MemoryMatch({
  profile,
  initialMode = 'SOLO_LEVELS', // 'SOLO_LEVELS', 'VS_COMPUTER', 'LOCAL_2P'
  onMatchFinished,
  onGoHome
}) {
  const [gameMode, setGameMode] = useState(initialMode);

  // Highest unlocked level saved in localStorage
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_UNLOCKED_LEVEL_KEY);
      return saved ? Math.min(5, Math.max(1, parseInt(saved))) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [selectedLevel, setSelectedLevel] = useState(1);
  const currentConfig = CAMPAIGN_LEVELS.find(c => c.level === selectedLevel) || CAMPAIGN_LEVELS[0];

  // Game Engine State
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentConfig.timeLimit);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [p1Matches, setP1Matches] = useState(0);
  const [p2Matches, setP2Matches] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(1); // 1 = P1, 2 = P2
  const [turnBannerMessage, setTurnBannerMessage] = useState('');

  // Result & Celebration Modal State
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    outcome: null, // 'WIN', 'LOSS', 'DRAW'
    ratingDelta: 0,
    xpGained: 0,
    stars: 3,
    moves: 0,
    timeRemaining: 0,
    reason: '',
    nextUnlocked: false
  });

  const aiMemoryRef = useRef(new Map());
  const isBusyRef = useRef(false);

  const TURN_TIME_LIMIT = 15; // 15 seconds per turn in 2P / AI Duel
  const [turnResetKey, setTurnResetKey] = useState(0);

  // Setup Deck
  const initGame = useCallback((lvlNum = selectedLevel, mode = gameMode) => {
    const cfg = CAMPAIGN_LEVELS.find(c => c.level === lvlNum) || CAMPAIGN_LEVELS[0];
    const pairsCount = mode === 'SOLO_LEVELS' ? cfg.pairs : 8; // 8 pairs (16 cards) for 2P match
    const chosen = MEMORY_CARDS_CATALOG.slice(0, pairsCount);

    const deck = [];
    chosen.forEach((sym) => {
      deck.push({ id: `${sym.id}_1`, symId: sym.id, data: sym });
      deck.push({ id: `${sym.id}_2`, symId: sym.id, data: sym });
    });

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds([]);
    setMoves(0);
    setTimeLeft(mode === 'SOLO_LEVELS' ? cfg.timeLimit : TURN_TIME_LIMIT);
    setIsGameOver(false);
    setIsAiThinking(false);
    setP1Matches(0);
    setP2Matches(0);
    setCurrentTurn(1);
    setTurnBannerMessage('');
    setResultModal({
      isOpen: false,
      outcome: null,
      ratingDelta: 0,
      xpGained: 0,
      stars: 3,
      moves: 0,
      timeRemaining: 0,
      reason: '',
      nextUnlocked: false
    });
    aiMemoryRef.current.clear();
    isBusyRef.current = false;
  }, [selectedLevel, gameMode]);

  useEffect(() => {
    initGame(selectedLevel, gameMode);
  }, [initGame, selectedLevel, gameMode]);

  // Turn Countdown Timer (Solo = Stage Timer; 2P/AI = Fresh 15s Per Turn)
  useEffect(() => {
    if (isGameOver || cards.length === 0 || resultModal.isOpen) return;

    if (gameMode !== 'SOLO_LEVELS') {
      setTimeLeft(TURN_TIME_LIMIT);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, cards.length, resultModal.isOpen, currentTurn, turnResetKey, gameMode]);

  // Handle Time Expire
  const handleTimeExpire = () => {
    if (gameMode === 'SOLO_LEVELS') {
      // Solo Campaign: stage timer expired -> Stage Loss
      setIsGameOver(true);
      soundSynth.playDefeat();
      setResultModal({
        isOpen: true,
        outcome: 'LOSS',
        ratingDelta: -10,
        xpGained: 15,
        stars: 0,
        moves,
        timeRemaining: 0,
        reason: 'Time expired before completing all pairs!',
        nextUnlocked: false
      });
    } else {
      // 2P / AI Duel: turn clock expired -> Pass turn with fresh 15s timer so match can finish!
      soundSynth.playRotate();
      setFlippedIndices([]);
      isBusyRef.current = false;
      const timedOutPlayer = currentTurn === 1 ? (profile?.name || 'Player 1') : (gameMode === 'VS_COMPUTER' ? 'AI Bot' : 'Player 2');
      setTurnBannerMessage(`⏱️ ${timedOutPlayer} ran out of time! Turn passed.`);

      setTimeout(() => {
        setCurrentTurn(prev => (prev === 1 ? 2 : 1));
        setTurnBannerMessage('');
      }, 700);
    }
  };

  // Card Flip Handler
  const handleCardClick = (idx) => {
    if (
      isGameOver || 
      isAiThinking || 
      isBusyRef.current || 
      flippedIndices.includes(idx) || 
      matchedIds.includes(cards[idx]?.symId) ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    soundSynth.playClick();
    aiMemoryRef.current.set(idx, cards[idx].symId);

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      isBusyRef.current = true;
      const newMoveCount = moves + 1;
      setMoves(prev => prev + 1);

      const [firstIdx, secondIdx] = newFlipped;
      const card1 = cards[firstIdx];
      const card2 = cards[secondIdx];

      if (card1.symId === card2.symId) {
        // MATCH FOUND!
        soundSynth.playVictory();
        const nextMatched = [...matchedIds, card1.symId];
        setMatchedIds(nextMatched);
        setFlippedIndices([]);
        isBusyRef.current = false;

        // In 2P / AI Mode: scoring a match grants another turn & resets the 15s turn timer!
        if (currentTurn === 1) {
          setP1Matches(prev => prev + 1);
          setTurnBannerMessage('✨ Pair found! Extra turn!');
        } else {
          setP2Matches(prev => prev + 1);
          setTurnBannerMessage('✨ Opponent found a pair! Extra turn!');
        }
        setTurnResetKey(prev => prev + 1); // Refresh 15s turn timer for extra turn

        const totalPairs = gameMode === 'SOLO_LEVELS' ? currentConfig.pairs : 8;
        if (nextMatched.length === totalPairs) {
          handleAllMatchedVictory(nextMatched.length, p1Matches + (currentTurn === 1 ? 1 : 0), p2Matches + (currentTurn === 2 ? 1 : 0), newMoveCount);
        }
      } else {
        // NO MATCH -> Flip back after 700ms and switch turn
        setTurnBannerMessage('No match. Turn switches.');
        setTimeout(() => {
          setFlippedIndices([]);
          isBusyRef.current = false;
          setTurnBannerMessage('');
          if (gameMode === 'LOCAL_2P' || gameMode === 'VS_COMPUTER') {
            setCurrentTurn(prev => (prev === 1 ? 2 : 1));
          }
        }, 700);
      }
    }
  };

  // AI Turn Execution

  useEffect(() => {
    if (gameMode !== 'VS_COMPUTER' || currentTurn !== 2 || isGameOver || isBusyRef.current) return;

    setIsAiThinking(true);

    const aiTimer = setTimeout(() => {
      let firstChoice = null;
      let secondChoice = null;

      const memory = aiMemoryRef.current;
      const available = cards
        .map((c, i) => i)
        .filter(i => !matchedIds.includes(cards[i].symId));

      if (available.length === 0) return;

      // Scan memory for known pair
      const seen = new Map();
      for (const [idx, symId] of memory.entries()) {
        if (!matchedIds.includes(symId)) {
          if (seen.has(symId)) {
            firstChoice = seen.get(symId);
            secondChoice = idx;
            break;
          } else {
            seen.set(symId, idx);
          }
        }
      }

      if (firstChoice === null) {
        firstChoice = available[Math.floor(Math.random() * available.length)];
      }

      soundSynth.playClick();
      setFlippedIndices([firstChoice]);
      aiMemoryRef.current.set(firstChoice, cards[firstChoice].symId);

      setTimeout(() => {
        if (secondChoice === null) {
          const revealedSym = cards[firstChoice].symId;
          for (const [idx, symId] of memory.entries()) {
            if (idx !== firstChoice && symId === revealedSym && !matchedIds.includes(symId)) {
              secondChoice = idx;
              break;
            }
          }
        }

        if (secondChoice === null) {
          const rem = available.filter(i => i !== firstChoice);
          secondChoice = rem[Math.floor(Math.random() * rem.length)];
        }

        soundSynth.playClick();
        aiMemoryRef.current.set(secondChoice, cards[secondChoice].symId);
        setFlippedIndices([firstChoice, secondChoice]);
        setMoves(prev => prev + 1);

        if (cards[firstChoice].symId === cards[secondChoice].symId) {
          soundSynth.playVictory();
          const nextMatched = [...matchedIds, cards[firstChoice].symId];
          setMatchedIds(nextMatched);
          setFlippedIndices([]);
          setP2Matches(prev => prev + 1);

          const totalPairs = gameMode === 'SOLO_LEVELS' ? currentConfig.pairs : 8;
          if (nextMatched.length === totalPairs) {
            handleAllMatchedVictory(nextMatched.length, p1Matches, p2Matches + 1, moves + 1);
          }
          // Do NOT set isAiThinking(false) here — AI gets extra turn, effect will handle it
        } else {
          setTimeout(() => {
            setFlippedIndices([]);
            setCurrentTurn(1);
            setIsAiThinking(false);
          }, 700);
        }
      }, 500);

    }, 600);

    return () => clearTimeout(aiTimer);
  }, [currentTurn, gameMode, isGameOver, cards, matchedIds, p1Matches, p2Matches]);

  // Victory Celebration Handler with Full ELO Rating & Stars Breakdown
  const handleAllMatchedVictory = (totalMatchedCount, finalP1Score = p1Matches, finalP2Score = p2Matches, finalMoves = moves) => {
    setIsGameOver(true);
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
    soundSynth.playVictory();

    // Solo Campaign Mode
    if (gameMode === 'SOLO_LEVELS') {
      let earnedStars = 1;
      if (finalMoves <= currentConfig.threeStarMoves && timeLeft >= 10) earnedStars = 3;
      else if (finalMoves <= currentConfig.twoStarMoves) earnedStars = 2;

      let didUnlock = false;
      if (selectedLevel >= maxUnlockedLevel && selectedLevel < CAMPAIGN_LEVELS.length) {
        const nextLvl = selectedLevel + 1;
        setMaxUnlockedLevel(nextLvl);
        didUnlock = true;
        try { localStorage.setItem(STORAGE_UNLOCKED_LEVEL_KEY, nextLvl.toString()); } catch (e) {}
      }

      setResultModal({
        isOpen: true,
        outcome: 'WIN',
        ratingDelta: 25 + earnedStars * 5,
        xpGained: 50 + earnedStars * 15,
        stars: earnedStars,
        moves: finalMoves,
        timeRemaining: timeLeft,
        reason: `Level ${selectedLevel} Mastered with ${earnedStars} Stars!`,
        nextUnlocked: didUnlock
      });

      if (onMatchFinished) {
        onMatchFinished('memory', 'WIN', `Level ${selectedLevel}`);
      }
    } else {
      // 2P / AI Mode
      const isWinner = finalP1Score >= finalP2Score;
      const isDraw = finalP1Score === finalP2Score;
      const outcome = isDraw ? 'DRAW' : isWinner ? 'WIN' : 'LOSS';

      setResultModal({
        isOpen: true,
        outcome,
        ratingDelta: outcome === 'WIN' ? 25 : outcome === 'LOSS' ? -15 : 0,
        xpGained: outcome === 'WIN' ? 60 : 20,
        stars: outcome === 'WIN' ? 3 : 1,
        moves: finalMoves,
        timeRemaining: timeLeft,
        reason: outcome === 'WIN' 
          ? `You won the match ${finalP1Score} to ${finalP2Score}!` 
          : outcome === 'DRAW' 
            ? `Tied match with ${finalP1Score} pairs each.` 
            : `Opponent won ${finalP2Score} to ${finalP1Score}.`,
        nextUnlocked: false
      });

      if (onMatchFinished) {
        onMatchFinished('memory', outcome, gameMode === 'VS_COMPUTER' ? 'AI Bot' : 'Player 2');
      }
    }
  };

  const currentCols = gameMode === 'SOLO_LEVELS' ? currentConfig.cols : 4;
  const currentTotalPairs = gameMode === 'SOLO_LEVELS' ? currentConfig.pairs : 8;

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
      {/* Mode Selector Header Bar */}
      <div style={{
        width: '100%',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box'
      }}>
        {/* Game Mode Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => {
              soundSynth.playClick();
              setGameMode('SOLO_LEVELS');
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: gameMode === 'SOLO_LEVELS' ? '#0f172a' : '#f1f5f9',
              color: gameMode === 'SOLO_LEVELS' ? '#ffffff' : '#64748b',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Campaign (Solo)
          </button>
          <button
            onClick={() => {
              soundSynth.playClick();
              setGameMode('VS_COMPUTER');
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: gameMode === 'VS_COMPUTER' ? '#0f172a' : '#f1f5f9',
              color: gameMode === 'VS_COMPUTER' ? '#ffffff' : '#64748b',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Vs AI Duel
          </button>
          <button
            onClick={() => {
              soundSynth.playClick();
              setGameMode('LOCAL_2P');
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: gameMode === 'LOCAL_2P' ? '#0f172a' : '#f1f5f9',
              color: gameMode === 'LOCAL_2P' ? '#ffffff' : '#64748b',
              fontWeight: '900',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            2P Local Duel
          </button>
        </div>

        {/* Turn Timer & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: (gameMode === 'SOLO_LEVELS' ? timeLeft <= 10 : timeLeft <= 4) ? '#fee2e2' : '#f1f5f9',
            color: (gameMode === 'SOLO_LEVELS' ? timeLeft <= 10 : timeLeft <= 4) ? '#ef4444' : '#0f172a',
            padding: '5px 8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '900',
            fontFamily: 'var(--font-mono)'
          }}>
            <Clock size={13} />
            <span>{timeLeft}s</span>
          </div>


          <button
            onClick={() => {
              soundSynth.playRotate();
              initGame(selectedLevel, gameMode);
            }}
            title="Restart Match"
            style={{
              width: '30px',
              height: '30px',
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

      {/* Campaign Level Selector (Shown in Solo Mode) */}
      {gameMode === 'SOLO_LEVELS' ? (
        <div style={{
          width: '100%',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', fontFamily: 'var(--font-heading)' }}>
              STAGE:
            </span>
            {CAMPAIGN_LEVELS.map(lvl => {
              const isUnlocked = lvl.level <= maxUnlockedLevel;
              const isCurrent = lvl.level === selectedLevel;

              return (
                <button
                  key={lvl.level}
                  onClick={() => {
                    if (isUnlocked) {
                      soundSynth.playClick();
                      setSelectedLevel(lvl.level);
                    }
                  }}
                  disabled={!isUnlocked}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    border: isCurrent ? '2px solid #0f172a' : '1px solid #e2e8f0',
                    background: isCurrent ? '#0f172a' : isUnlocked ? '#f8fafc' : '#f1f5f9',
                    color: isCurrent ? '#ffffff' : isUnlocked ? '#0f172a' : '#94a3b8',
                    fontWeight: '900',
                    fontSize: '11px',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isUnlocked ? lvl.level : <Lock size={11} />}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>
            MOVES: <strong style={{ color: '#0f172a' }}>{moves}</strong> • PAIRS: <strong style={{ color: '#0f172a' }}>{matchedIds.length}/{currentTotalPairs}</strong>
          </div>
        </div>
      ) : (
        // 2-Player Turn Match Status Bar
        <MatchPlayerBar
          p1Name={profile?.name || 'You'}
          p1AvatarId={profile?.avatarId || '1'}
          p1Rating={profile?.rating || 1200}
          p1Score={p1Matches}
          p1Symbol="PAIRS"
          p1Color="#2563eb"
          p2Name={gameMode === 'VS_COMPUTER' ? 'Smart AI Bot' : 'Player 2'}
          p2AvatarId="2"
          p2Rating={gameMode === 'VS_COMPUTER' ? 1200 : 1200}
          p2Score={p2Matches}
          p2Symbol="PAIRS"
          p2Color="#dc2626"
          isP1Turn={currentTurn === 1}
          isGameOver={isGameOver}
          gameMode={gameMode}
          winnerText={isGameOver ? (p1Matches > p2Matches ? 'YOU WON!' : p1Matches < p2Matches ? 'OPPONENT WON!' : 'TIED MATCH!') : null}
          timeLeft={timeLeft}
          maxTime={currentConfig.timeLimit}
        />
      )}

      {/* Turn Banner Message */}
      {turnBannerMessage && (
        <div className="animate-pop-in" style={{
          width: '100%',
          padding: '6px 12px',
          borderRadius: '8px',
          background: turnBannerMessage.includes('Extra') ? '#ecfdf5' : '#f8fafc',
          border: turnBannerMessage.includes('Extra') ? '1px solid #86efac' : '1px solid #e2e8f0',
          color: turnBannerMessage.includes('Extra') ? '#15803d' : '#475569',
          fontSize: '11px',
          fontWeight: '800',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          {turnBannerMessage}
        </div>
      )}

      {/* Realistic Linen Card Deck Canvas */}
      <div style={{
        width: '100%',
        background: '#0f172a',
        border: '3px solid #1e293b',
        borderRadius: '20px',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: `repeat(${currentCols}, 1fr)`,
        gap: '8px',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.25)',
        boxSizing: 'border-box'
      }}>
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx);
          const isMatched = matchedIds.includes(card.symId);
          const IconComp = card.data.icon;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={isMatched || isFlipped || isAiThinking}
              style={{
                aspectRatio: '1 / 1.18',
                width: '100%',
                borderRadius: '12px',
                border: isMatched
                  ? `2px solid ${card.data.border}`
                  : isFlipped
                    ? '2px solid #cbd5e1'
                    : '1.5px solid rgba(255, 255, 255, 0.12)',
                background: isFlipped || isMatched
                  ? '#ffffff'
                  : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                boxShadow: isMatched
                  ? '0 2px 8px rgba(0, 0, 0, 0.08)'
                  : isFlipped
                    ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                    : '0 3px 6px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !isMatched && !isFlipped && !isAiThinking ? 'pointer' : 'default',
                padding: '4px',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isMatched ? 'scale(0.96)' : isFlipped ? 'scale(1.02)' : 'scale(1)',
                boxSizing: 'border-box'
              }}
            >
              {isFlipped || isMatched ? (
                <>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: card.data.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: currentCols <= 4 ? '2px' : '0'
                  }}>
                    <IconComp
                      size={currentCols > 4 ? 20 : 24}
                      color={card.data.color}
                      strokeWidth={2.2}
                    />
                  </div>
                  {currentCols <= 4 && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      color: '#0f172a',
                      fontFamily: 'var(--font-heading)',
                      marginTop: '2px'
                    }}>
                      {card.data.name}
                    </span>
                  )}
                </>
              ) : (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    background: '#38bdf8',
                    opacity: 0.6
                  }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Match Result Modal with Full Celebration, ELO Rating & Career XP */}
      <MatchResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        outcome={resultModal.outcome}
        gameTitle={gameMode === 'SOLO_LEVELS' ? `Memory Match • Level ${selectedLevel}` : 'Memory Match Duel'}
        ratingDelta={resultModal.ratingDelta}
        xpGained={resultModal.xpGained}
        currentRating={profile?.rating || 1200}
        movesCount={moves}
        onRematch={() => initGame(selectedLevel, gameMode)}
        onGoHome={onGoHome}
      />
    </div>
  );
}
