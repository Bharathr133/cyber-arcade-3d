import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, BookOpen, ArrowRight, ShieldCheck, CheckCircle2, 
  Sparkles, Trophy, Zap, Play, Layers, HelpCircle, Swords, AlertCircle
} from 'lucide-react';
import { 
  TicTacToeIcon, 
  ConnectFourIcon, 
  GomokuIcon, 
  MemoryMatchIcon, 
  LudoIcon 
} from './GameIcons.jsx';
import { soundSynth } from '../utils/soundSynth.js';

export const GAME_RULES_DATA = {
  connect4: {
    id: 'connect4',
    title: 'Connect 4',
    subtitle: '7 × 6 Tactical Gravity Grid',
    icon: ConnectFourIcon,
    accentColor: '#2563EB',
    bgLight: '#EFF6FF',
    borderLight: '#BFDBFE',
    tag: 'STRATEGY • 2 PLAYERS',
    overview: 'Connect 4 is a two-player vertical grid strategy game. Players alternate dropping colored discs into a 7-column, 6-row suspended grid. Pieces fall straight down, occupying the lowest available space within the column.',
    objective: 'Be the first player to form a continuous horizontal, vertical, or diagonal line of 4 of your own colored discs.',
    rules: [
      { title: 'Turn Progression', desc: 'Players take turns selecting a column (1 to 7) to drop their disc.' },
      { title: 'Gravity Constraint', desc: 'Discs always fall to the lowest unoccupied slot in the chosen column.' },
      { title: 'Win Condition', desc: 'The match ends immediately when a player aligns 4 consecutive discs in any direction.' },
      { title: 'Stalemate / Draw', desc: 'If all 42 slots are filled and neither player has connected 4, the match is declared a draw.' }
    ],
    tactics: [
      { title: 'Center Column Dominance', desc: 'Column 4 (the center) is mathematically part of the highest number of potential winning lines. Controlling it early gives you immense tactical leverage.' },
      { title: 'Double Threat Traps (7-Trap)', desc: 'Set up two separate winning lines simultaneously (e.g. horizontal and diagonal). Your opponent can only block one, guaranteeing your win on the next turn.' },
      { title: 'Parity and Zugzwang', desc: 'Avoid placing discs directly beneath a square that would give your opponent an immediate 4-in-a-row.' }
    ]
  },
  tictactoe: {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    subtitle: '3 × 3 Fast Blitz Duel',
    icon: TicTacToeIcon,
    accentColor: '#DC2626',
    bgLight: '#FEF2F2',
    borderLight: '#FECACA',
    tag: 'BLITZ • 2 PLAYERS',
    overview: 'Tic-Tac-Toe is the world’s most popular fast-paced duel played on a 3×3 grid. One player marks spaces with X and the other with O in alternating turns.',
    objective: 'Be the first player to align 3 of your marks in a horizontal, vertical, or diagonal row.',
    rules: [
      { title: 'Grid Selection', desc: 'Players choose any open square from the 9 available tiles on their turn.' },
      { title: 'First Mover', desc: 'Player 1 plays as X and moves first; Player 2 plays as O.' },
      { title: 'Win Condition', desc: 'Placing 3 marks in an unbroken straight line wins the round immediately.' },
      { title: 'Cats Game (Draw)', desc: 'If all 9 squares are occupied without 3-in-a-row, the duel ends in a tie.' }
    ],
    tactics: [
      { title: 'Center Square Control', desc: 'The center square participates in 4 possible winning lines (1 horizontal, 1 vertical, 2 diagonals), making it the most critical opening tile.' },
      { title: 'Corner Fork Trap', desc: 'Claim two opposite or adjacent corners. By building a two-way threat across the center, you create an unblockable fork.' },
      { title: 'Blocking Counter-Threats', desc: 'Always prioritize blocking an opponent who has 2 in a row before launching a new offensive line.' }
    ]
  },
  gomoku: {
    id: 'gomoku',
    title: 'Gomoku (Five in a Row)',
    subtitle: '15 × 15 Grandmaster Intersection Board',
    icon: GomokuIcon,
    accentColor: '#0D9488',
    bgLight: '#F0FDFA',
    borderLight: '#99F6E4',
    tag: 'PRO • 2 PLAYERS',
    overview: 'Gomoku is a traditional Japanese & East Asian abstract strategy board game played on a 15×15 grid of line intersections using black and white stones.',
    objective: 'Create an unbroken straight chain of 5 stones of your color horizontally, vertically, or diagonally.',
    rules: [
      { title: 'Intersection Placement', desc: 'Stones are placed on the grid line intersections (not inside the squares).' },
      { title: 'Stone Permanence', desc: 'Once placed on an intersection, stones cannot be moved or captured.' },
      { title: 'Black Moves First', desc: 'Player 1 (Black stones) makes the opening move, followed by Player 2 (White stones).' },
      { title: 'Winning Line', desc: 'First to get exactly 5 stones in a continuous straight row wins.' }
    ],
    tactics: [
      { title: 'Open-Ended Threes (San-San)', desc: 'Build an unbroken line of 3 stones with both ends unobstructed (e.g. .XXX.). Once formed, your opponent cannot block both sides on a single turn.' },
      { title: 'Four-Three Dual Forks', desc: 'Construct a move that creates both an open three and a four simultaneously. This guarantees an unstoppable victory on the subsequent stone.' },
      { title: 'Continuous Initiative (Sente)', desc: 'Force your opponent to respond defensively on every turn by placing continuous attacking 3-stone and 4-stone threats.' }
    ]
  },
  memory: {
    id: 'memory',
    title: 'Memory Match Blitz',
    subtitle: 'Symbol Recognition & Solo Campaign',
    icon: MemoryMatchIcon,
    accentColor: '#9333EA',
    bgLight: '#FAF5FF',
    borderLight: '#E9D5FF',
    tag: 'SOLO & DUEL • 1-2 PLAYERS',
    overview: 'Memory Match tests cognitive recall, visual pattern recognition, and focus. A grid of face-down cards hides matching pairs of unique arcade symbols.',
    objective: 'Uncover all matching pairs of cards in the fewest flips, or score more pairs than your opponent in turn-based duels.',
    rules: [
      { title: 'Card Reveal', desc: 'Flip 2 cards face-up on each turn to inspect their hidden icons.' },
      { title: 'Matching Pairs', desc: 'If the 2 revealed cards match, they are cleared and you earn points (+ an extra turn in duel mode).' },
      { title: 'Mismatching Cards', desc: 'If the cards do not match, they flip back face-down after a brief peek window.' },
      { title: 'Solo Campaign Levels', desc: 'Beat the countdown timer and reach 3-star accuracy across 5 progressive difficulty levels.' }
    ],
    tactics: [
      { title: 'Quadrant Scanning', desc: 'Mentally divide the board into 4 quadrants and memorize symbols in clusters rather than scanning randomly.' },
      { title: 'Corner Anchor Strategy', desc: 'Start by revealing the 4 outer corner cards first. Corners are easiest to recall during late-game pair combinations.' },
      { title: 'Process of Elimination', desc: 'When looking for a pair, systematically check tiles adjacent to previously seen symbols.' }
    ]
  },
  ludo: {
    id: 'ludo',
    title: 'Ludo Championship',
    subtitle: '2–4 Player Tournament Board',
    icon: LudoIcon,
    accentColor: '#D97706',
    bgLight: '#FEFCE8',
    borderLight: '#FEF08A',
    tag: 'PARTY • 2-4 PLAYERS',
    overview: 'Ludo is a classic cross-and-circle board game derived from the ancient game of Pachisi. 2 to 4 players race their tokens clockwise around the perimeter track to reach their home triangle.',
    objective: 'Be the first player to navigate all 4 of your colored tokens around the board and into your home column.',
    rules: [
      { title: 'Rolling a 6 (Exit Base)', desc: 'You must roll a 6 on the die to move a token out of your starting base and onto the first track square.' },
      { title: 'Bonus Rolls', desc: 'Rolling a 6 or capturing an opponent token grants an immediate bonus roll.' },
      { title: 'Capturing Enemy Pieces', desc: 'Landing on an opponent’s token sends it straight back to their base (unless they are on a Safe Star square).' },
      { title: 'Safe Star Squares', desc: 'The 8 marked star squares on the board are safe zones where tokens cannot be captured.' },
      { title: 'Exact Roll to Finish', desc: 'Tokens must enter the home triangle on an exact dice roll count.' }
    ],
    tactics: [
      { title: 'Safe Star Anchoring', desc: 'Park tokens on star squares to observe opponent movements safely and wait for the ideal moment to strike.' },
      { title: 'Staggered Token Advancement', desc: 'Never leave all 4 tokens in base. Advance multiple tokens around the board simultaneously to maximize target opportunities.' },
      { title: 'Rear-Guard Hunter Strikes', desc: 'Position a token 4 to 6 spaces behind an enemy piece to apply immense capture pressure.' }
    ]
  }
};

export default function GameRulesModal({
  isOpen,
  onClose,
  initialGameId = 'connect4',
  onSelectGameToPlay
}) {
  const [selectedTab, setSelectedTab] = useState('connect4');

  useEffect(() => {
    if (isOpen) {
      const valid = ['connect4', 'tictactoe', 'gomoku', 'memory', 'ludo'].includes(initialGameId) ? initialGameId : 'connect4';
      setSelectedTab(valid);
    }
  }, [isOpen, initialGameId]);

  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentGame = GAME_RULES_DATA[selectedTab] || GAME_RULES_DATA.connect4;
  const IconComp = currentGame.icon;

  const handlePlayNow = () => {
    onClose();
    if (onSelectGameToPlay) {
      onSelectGameToPlay(currentGame.id);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="animate-pop-in"
        style={{
          width: 'min(96vw, 680px)',
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #BFDBFE'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                How to Play & Game Rules
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                Complete strategy guides, victory mechanics & tournament rules
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #CBD5E1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748B', cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 5-Game Switcher Tabs */}
        <div style={{
          padding: '8px 12px',
          background: '#F1F5F9',
          borderBottom: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px'
        }}>
          {Object.values(GAME_RULES_DATA).map((g) => {
            const TabIcon = g.icon;
            const isTabActive = selectedTab === g.id;

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  soundSynth.playClick();
                  setSelectedTab(g.id);
                }}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: isTabActive ? `1.5px solid ${g.accentColor}` : '1px solid transparent',
                  background: isTabActive ? '#FFFFFF' : 'transparent',
                  color: isTabActive ? g.accentColor : '#64748B',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: isTabActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <TabIcon size={16} />
                <span style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' }}>
                  {g.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div style={{
          padding: '22px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* Game Title & Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 16px', borderRadius: '16px', background: currentGame.bgLight,
            border: `1px solid ${currentGame.borderLight}`
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: '#FFFFFF', color: currentGame.accentColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: `1px solid ${currentGame.borderLight}`,
              flexShrink: 0
            }}>
              <IconComp size={26} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                  {currentGame.title}
                </h3>
                <span style={{
                  fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)',
                  padding: '2px 6px', borderRadius: '4px', background: '#FFFFFF', color: currentGame.accentColor,
                  border: `1px solid ${currentGame.borderLight}`
                }}>
                  {currentGame.tag}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                {currentGame.subtitle}
              </p>
            </div>
          </div>

          {/* Overview & Objective */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              GAMEPLAY OBJECTIVE
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569', lineHeight: 1.6, fontWeight: '500' }}>
              {currentGame.overview}
            </p>
            <div style={{
              background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0',
              fontSize: '12px', color: '#0F172A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Trophy size={16} color={currentGame.accentColor} style={{ flexShrink: 0 }} />
              <span><strong>Winning Condition:</strong> {currentGame.objective}</span>
            </div>
          </div>

          {/* Core Rules List */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              CORE MATCH RULES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {currentGame.rules.map((r, i) => (
                <div 
                  key={i}
                  style={{
                    background: '#FFFFFF', padding: '10px 14px', borderRadius: '12px',
                    border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '10px'
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '6px',
                    background: currentGame.bgLight, color: currentGame.accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)',
                    flexShrink: 0, marginTop: '2px'
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', marginTop: '1px', lineHeight: 1.5 }}>
                      {r.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grandmaster Strategy & Tactics */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              GRANDMASTER TACTICS & TIPS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {currentGame.tactics.map((t, i) => (
                <div 
                  key={i}
                  style={{
                    background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px',
                    border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '10px'
                  }}
                >
                  <ShieldCheck size={16} color={currentGame.accentColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', marginTop: '1px', lineHeight: 1.5 }}>
                      {t.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer with Play Now CTA */}
        <div style={{
          padding: '16px 22px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
            Ready to test your strategy?
          </div>

          <button
            type="button"
            onClick={handlePlayNow}
            className="btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <span>PLAY {currentGame.title.toUpperCase()} NOW</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
