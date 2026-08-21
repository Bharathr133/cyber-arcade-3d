import React, { useState } from 'react';
import { 
  BookOpen, ArrowLeft, ArrowRight, Trophy, Play, Check, 
  HelpCircle, ArrowDown
} from 'lucide-react';
import { 
  TicTacToeIcon, 
  ConnectFourIcon, 
  GomokuIcon, 
  MemoryMatchIcon, 
  LudoIcon 
} from '../components/GameIcons.jsx';
import { soundSynth } from '../utils/soundSynth.js';

// ==========================================
// 1. CONNECT 4: 3 ILLUSTRATED ANGLES
// ==========================================
function Connect4Diagram({ angleType }) {
  // angleType: 'horizontal' | 'vertical' | 'diagonal'
  let winningSlots = [];
  let redSlots = [];
  let yellowSlots = [];

  if (angleType === 'horizontal') {
    winningSlots = [[5, 1], [5, 2], [5, 3], [5, 4]];
    redSlots = [[5, 0], [4, 2], [4, 3], [5, 5]];
    yellowSlots = [[4, 1], [3, 2], [4, 4]];
  } else if (angleType === 'vertical') {
    winningSlots = [[5, 3], [4, 3], [3, 3], [2, 3]];
    redSlots = [[5, 2], [5, 4], [4, 2]];
    yellowSlots = [[5, 1], [4, 4], [3, 4]];
  } else if (angleType === 'diagonal') {
    winningSlots = [[4, 1], [3, 2], [2, 3], [1, 4]];
    redSlots = [[5, 1], [5, 2], [4, 2], [5, 3], [5, 4], [4, 3]];
    yellowSlots = [[5, 0], [4, 0], [3, 3]];
  }

  return (
    <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-center w-full max-w-[320px] mx-auto shadow-inner">
      <div className="bg-blue-600 p-2 sm:p-2.5 rounded-xl border border-blue-500 grid grid-cols-7 gap-1.5 w-full">
        {Array.from({ length: 6 }).map((_, r) => (
          <React.Fragment key={r}>
            {Array.from({ length: 7 }).map((_, c) => {
              const isWin = winningSlots.some(([wr, wc]) => wr === r && wc === c);
              const isRed = redSlots.some(([rr, rc]) => rr === r && rc === c);
              const isYellow = yellowSlots.some(([yr, yc]) => yr === r && yc === c);

              let bg = '#0F172A';
              let border = 'rgba(255,255,255,0.08)';

              if (isWin) {
                bg = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)';
                border = '#93C5FD';
              } else if (isRed) {
                bg = 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)';
                border = '#FCA5A5';
              } else if (isYellow) {
                bg = 'linear-gradient(135deg, #EAB308 0%, #A16207 100%)';
                border = '#FDE047';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    background: bg,
                    border: `1.5px solid ${border}`,
                    boxShadow: isWin ? '0 0 10px rgba(59,130,246,0.9)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isWin && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-80" />}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2. TIC-TAC-TOE: 3 ILLUSTRATED ANGLES
// ==========================================
function TicTacToeDiagram({ angleType }) {
  // angleType: 'horizontal' | 'vertical' | 'diagonal'
  let tiles = [];

  if (angleType === 'horizontal') {
    tiles = [
      { mark: 'X', isWin: true }, { mark: 'X', isWin: true }, { mark: 'X', isWin: true },
      { mark: 'O', isWin: false }, { mark: 'O', isWin: false }, { mark: null, isWin: false },
      { mark: null, isWin: false }, { mark: null, isWin: false }, { mark: 'O', isWin: false }
    ];
  } else if (angleType === 'vertical') {
    tiles = [
      { mark: 'O', isWin: false }, { mark: 'X', isWin: true }, { mark: null, isWin: false },
      { mark: 'O', isWin: false }, { mark: 'X', isWin: true }, { mark: null, isWin: false },
      { mark: null, isWin: false }, { mark: 'X', isWin: true }, { mark: 'O', isWin: false }
    ];
  } else if (angleType === 'diagonal') {
    tiles = [
      { mark: 'X', isWin: true }, { mark: 'O', isWin: false }, { mark: 'O', isWin: false },
      { mark: null, isWin: false }, { mark: 'X', isWin: true }, { mark: null, isWin: false },
      { mark: 'O', isWin: false }, { mark: null, isWin: false }, { mark: 'X', isWin: true }
    ];
  }

  return (
    <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-center w-full max-w-[200px] mx-auto shadow-inner">
      <div className="relative bg-slate-800/80 p-2 rounded-xl border border-slate-700 grid grid-cols-3 gap-1.5 w-[160px] h-[160px]">
        {/* Strike Line Overlay */}
        <div className="absolute top-[8px] left-[8px] w-[144px] h-[144px] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {angleType === 'horizontal' && (
              <line x1="10" y1="18" x2="90" y2="18" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
            )}
            {angleType === 'vertical' && (
              <line x1="50" y1="10" x2="50" y2="90" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
            )}
            {angleType === 'diagonal' && (
              <line x1="15" y1="15" x2="85" y2="85" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
            )}
          </svg>
        </div>

        {tiles.map((tile, i) => (
          <div
            key={i}
            className={`rounded-lg flex items-center justify-center font-heading font-black text-xl border ${
              tile.isWin 
                ? 'bg-red-500/20 border-red-400 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                : tile.mark === 'O' 
                  ? 'bg-slate-700/60 border-slate-600 text-blue-400' 
                  : 'bg-slate-800/40 border-slate-700/60'
            }`}
          >
            {tile.mark}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. GOMOKU: 3 ILLUSTRATED ANGLES
// ==========================================
function GomokuDiagram({ angleType }) {
  // angleType: 'horizontal' | 'vertical' | 'diagonal'
  return (
    <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-center w-full max-w-[220px] mx-auto shadow-inner">
      <div className="relative bg-[#D97706]/90 p-3 rounded-xl shadow-inner border border-amber-900 w-[180px] h-[180px] flex items-center justify-center">
        <svg viewBox="0 0 140 140" className="w-full h-full">
          {/* Grid lines */}
          {Array.from({ length: 7 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={10 + i * 20} y1="10" x2={10 + i * 20} y2="130" stroke="#78350F" strokeWidth="1.5" />
              <line x1="10" y1={10 + i * 20} x2="130" y2={10 + i * 20} stroke="#78350F" strokeWidth="1.5" />
            </React.Fragment>
          ))}

          {angleType === 'horizontal' && (
            <>
              {[30, 50, 70, 90, 110].map((cx, i) => (
                <circle key={i} cx={cx} cy={70} r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
              ))}
              <circle cx="50" cy="50" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="70" cy="90" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            </>
          )}

          {angleType === 'vertical' && (
            <>
              {[30, 50, 70, 90, 110].map((cy, i) => (
                <circle key={i} cx={70} cy={cy} r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
              ))}
              <circle cx="50" cy="70" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="90" cy="90" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            </>
          )}

          {angleType === 'diagonal' && (
            <>
              {[30, 50, 70, 90, 110].map((pos, i) => (
                <circle key={i} cx={pos} cy={pos} r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
              ))}
              <circle cx="50" cy="90" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="90" cy="50" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 4. MEMORY MATCH: 3 ILLUSTRATED STEPS
// ==========================================
function MemoryDiagram({ stepType }) {
  // stepType: 'flip1' | 'flip2_match' | 'mismatch'
  let cards = [];

  if (stepType === 'flip1') {
    cards = [
      { icon: '⭐', state: 'active' }, { icon: '❓', state: 'closed' },
      { icon: '❓', state: 'closed' }, { icon: '❓', state: 'closed' }
    ];
  } else if (stepType === 'flip2_match') {
    cards = [
      { icon: '⭐', state: 'matched' }, { icon: '❓', state: 'closed' },
      { icon: '❓', state: 'closed' }, { icon: '⭐', state: 'matched' }
    ];
  } else if (stepType === 'mismatch') {
    cards = [
      { icon: '⭐', state: 'mismatch' }, { icon: '❓', state: 'closed' },
      { icon: '💎', state: 'mismatch' }, { icon: '❓', state: 'closed' }
    ];
  }

  return (
    <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-center w-full max-w-[220px] mx-auto shadow-inner">
      <div className="grid grid-cols-2 gap-2 w-[160px] p-2 bg-slate-800/80 rounded-xl border border-slate-700">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`h-14 rounded-lg flex items-center justify-center text-xl font-bold border ${
              card.state === 'matched'
                ? 'bg-purple-600/40 border-purple-400 text-yellow-300 shadow-[0_0_10px_rgba(147,51,234,0.6)] animate-pulse'
                : card.state === 'active'
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                  : card.state === 'mismatch'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-700/60 border-slate-600 text-slate-400'
            }`}
          >
            {card.icon}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 5. LUDO CHAMPIONSHIP: 3 ILLUSTRATED ANGLES
// ==========================================
function LudoDiagram({ angleType }) {
  // angleType: 'roll6' | 'star_safe' | 'home_finish'
  return (
    <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-center w-full max-w-[200px] mx-auto shadow-inner">
      <div className="w-[160px] h-[160px] bg-white rounded-xl border-2 border-slate-800 p-2 relative shadow-inner">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Base quadrants */}
          <rect x="10" y="10" width="40" height="40" rx="4" fill="#EF4444" opacity="0.9" />
          <circle cx="30" cy="30" r="5" fill="#FFFFFF" />
          <rect x="70" y="10" width="40" height="40" rx="4" fill="#22C55E" opacity="0.9" />
          <circle cx="90" cy="30" r="5" fill="#FFFFFF" />
          <rect x="10" y="70" width="40" height="40" rx="4" fill="#3B82F6" opacity="0.9" />
          <circle cx="30" cy="90" r="5" fill="#FFFFFF" />
          <rect x="70" y="70" width="40" height="40" rx="4" fill="#EAB308" opacity="0.9" />
          <circle cx="90" cy="90" r="5" fill="#FFFFFF" />

          {/* Center Triangle */}
          <polygon points="60,45 75,60 60,75 45,60" fill="#0F172A" />

          {angleType === 'roll6' && (
            <>
              {/* Token exiting onto start square */}
              <circle cx="20" cy="55" r="5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" className="animate-bounce" />
              <rect x="75" y="45" width="22" height="22" rx="4" fill="#0F172A" />
              <text x="86" y="60" fontSize="12" fill="#FFF" fontWeight="bold" textAnchor="middle">6</text>
            </>
          )}

          {angleType === 'star_safe' && (
            <>
              {/* Star Safe Square */}
              <circle cx="20" cy="55" r="7" fill="#EAB308" stroke="#78350F" strokeWidth="1" />
              <text x="20" y="58" fontSize="7" textAnchor="middle" fill="#000" fontWeight="bold">★</text>
              <circle cx="20" cy="55" r="3.5" fill="#3B82F6" />
            </>
          )}

          {angleType === 'home_finish' && (
            <>
              {/* Home Triangle Victory */}
              <circle cx="60" cy="60" r="6" fill="#22C55E" stroke="#FFFFFF" strokeWidth="1.5" className="animate-pulse" />
              <text x="60" y="63" fontSize="8" textAnchor="middle" fill="#FFF" fontWeight="bold">🏆</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// MASTER RULES CONFIGURATION (3 ANGLES PER GAME)
// ==========================================
export const GAME_RULES_DATA = {
  connect4: {
    id: 'connect4',
    title: 'Connect 4',
    subtitle: '7 × 6 Tactical Grid',
    icon: ConnectFourIcon,
    objective: 'Be the first player to connect 4 of your colored discs in a straight unbroken line (horizontal, vertical, or diagonal).',
    angles: [
      {
        number: '1',
        title: 'Angle 1: Horizontal Line (Left to Right)',
        desc: 'Take turns dropping your discs into any open column. Align 4 discs consecutively in a straight horizontal line across the board to win.',
        diagram: <Connect4Diagram angleType="horizontal" />
      },
      {
        number: '2',
        title: 'Angle 2: Vertical Column (Bottom to Top)',
        desc: 'Stack 4 of your discs directly on top of each other in the same column. Discs always fall to the lowest unoccupied slot.',
        diagram: <Connect4Diagram angleType="vertical" />
      },
      {
        number: '3',
        title: 'Angle 3: Diagonal Line (Slanted Up / Down)',
        desc: 'Connect 4 discs diagonally across rows and columns. Diagonal lines can slope up from bottom-left or down from top-left.',
        diagram: <Connect4Diagram angleType="diagonal" />
      }
    ]
  },
  tictactoe: {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    subtitle: '3 × 3 Grid Duel',
    icon: TicTacToeIcon,
    objective: 'Be the first player to mark 3 consecutive squares in a straight row, column, or diagonal line.',
    angles: [
      {
        number: '1',
        title: 'Angle 1: Horizontal Row (3 in a Line Across)',
        desc: 'Select any open square on your turn. Align 3 of your marks (X or O) across any of the 3 horizontal rows to win the round.',
        diagram: <TicTacToeDiagram angleType="horizontal" />
      },
      {
        number: '2',
        title: 'Angle 2: Vertical Column (3 in a Line Down)',
        desc: 'Align 3 of your marks straight down through any of the 3 vertical columns from top to bottom.',
        diagram: <TicTacToeDiagram angleType="vertical" />
      },
      {
        number: '3',
        title: 'Angle 3: Diagonal Strike (Corner to Corner)',
        desc: 'Align 3 of your marks along either of the 2 corner-to-corner diagonal lines across the center square.',
        diagram: <TicTacToeDiagram angleType="diagonal" />
      }
    ]
  },
  gomoku: {
    id: 'gomoku',
    title: 'Gomoku (Five in a Row)',
    subtitle: '15 × 15 Intersection Board',
    icon: GomokuIcon,
    objective: 'Be the first player to place an unbroken chain of 5 stones of your color on the grid line intersections.',
    angles: [
      {
        number: '1',
        title: 'Angle 1: Horizontal 5-in-a-Row',
        desc: 'Stones are placed on line intersections (not inside tiles). Form a straight line of 5 stones horizontally across the board.',
        diagram: <GomokuDiagram angleType="horizontal" />
      },
      {
        number: '2',
        title: 'Angle 2: Vertical 5-in-a-Row',
        desc: 'Place 5 stones in an unbroken chain straight down along any vertical grid line.',
        diagram: <GomokuDiagram angleType="vertical" />
      },
      {
        number: '3',
        title: 'Angle 3: Diagonal 5-in-a-Row',
        desc: 'Connect 5 stones diagonally across intersecting grid coordinates. Once placed, stones cannot be moved or captured.',
        diagram: <GomokuDiagram angleType="diagonal" />
      }
    ]
  },
  memory: {
    id: 'memory',
    title: 'Memory Match',
    subtitle: 'Card Recall & Symbol Pairs',
    icon: MemoryMatchIcon,
    objective: 'Flip cards face-up to find matching pairs of arcade symbols before the countdown timer runs out.',
    angles: [
      {
        number: '1',
        title: 'Angle 1: Flip 1st Card to Inspect Symbol',
        desc: 'Click on any face-down tile to flip it face-up and view its hidden symbol (e.g. ⭐ Star, 💎 Diamond, ⚡ Lightning).',
        diagram: <MemoryDiagram stepType="flip1" />
      },
      {
        number: '2',
        title: 'Angle 2: Flip 2nd Card to Complete Match',
        desc: 'Click a second card. If both revealed cards show the exact same symbol, the pair is cleared and you earn points (+ an extra turn in duels)!',
        diagram: <MemoryDiagram stepType="flip2_match" />
      },
      {
        number: '3',
        title: 'Angle 3: Mismatch Peek (Memorize & Reset)',
        desc: 'If the 2 cards do not match, they will flip back face-down after a brief peek. Memorize their locations for future turns.',
        diagram: <MemoryDiagram stepType="mismatch" />
      }
    ]
  },
  ludo: {
    id: 'ludo',
    title: 'Ludo Championship',
    subtitle: '2–4 Player Board Race',
    icon: LudoIcon,
    objective: 'Navigate all 4 of your colored tokens clockwise around the perimeter track and into your center home triangle.',
    angles: [
      {
        number: '1',
        title: 'Angle 1: Roll a 6 to Exit Base',
        desc: 'You must roll a 6 on the die to move a token out of your starting yard and place it onto the track. Rolling a 6 also awards a bonus roll.',
        diagram: <LudoDiagram angleType="roll6" />
      },
      {
        number: '2',
        title: 'Angle 2: Move Clockwise & Safe Star Squares',
        desc: 'Move tokens clockwise around the outer track. Tokens resting on marked golden star squares are safe and cannot be captured by opponents.',
        diagram: <LudoDiagram angleType="star_safe" />
      },
      {
        number: '3',
        title: 'Angle 3: Enter Home Triangle to Win',
        desc: 'Guide all 4 tokens into your colored home runway on an exact die roll count. The first player to bring all 4 tokens home wins!',
        diagram: <LudoDiagram angleType="home_finish" />
      }
    ]
  }
};

export default function RulesPage({
  initialGameId = 'connect4',
  onBackToHome,
  onLaunchGame
}) {
  const [selectedGameKey, setSelectedGameKey] = useState(initialGameId || 'connect4');

  const currentGame = GAME_RULES_DATA[selectedGameKey] || GAME_RULES_DATA.connect4;
  const IconComp = currentGame.icon;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-12 box-border animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => {
            soundSynth.playClick();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>BACK TO ARENA</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <BookOpen size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black font-heading tracking-tight text-slate-900 m-0">
              How to Play Illustrated Guide
            </h1>
            <p className="text-[11px] text-slate-500 font-medium m-0">
              3 Illustrated winning angles & move rules for all 5 games
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playVictory();
            onLaunchGame(currentGame.id);
          }}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
        >
          <span>PLAY NOW</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 5-Game Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {Object.values(GAME_RULES_DATA).map((g) => {
          const TabIcon = g.icon;
          const isActive = selectedGameKey === g.id;

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                soundSynth.playClick();
                setSelectedGameKey(g.id);
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm font-bold' 
                  : 'bg-white border-transparent text-slate-600 hover:bg-slate-100 font-semibold'
              }`}
            >
              <TabIcon size={16} />
              <span className="text-xs font-heading">{g.title}</span>
            </button>
          );
        })}
      </div>

      {/* Game Header Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm">
            <IconComp size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black font-heading text-slate-900 m-0">{currentGame.title}</h2>
            <p className="text-xs text-slate-500 font-medium m-0">{currentGame.subtitle}</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs text-slate-800 font-semibold">
          <Trophy size={18} className="text-amber-500 flex-shrink-0" />
          <span><strong>Objective:</strong> {currentGame.objective}</span>
        </div>
      </div>

      {/* 3 Illustrated Angles Stacked One Under One */}
      <div className="flex flex-col gap-4">
        <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider px-1">
          HOW TO PLAY: 3 ILLUSTRATED ANGLES & RULES
        </div>

        {currentGame.angles.map((ang) => (
          <div
            key={ang.number}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center gap-6"
          >
            {/* Visual Board Diagram */}
            <div className="w-full md:w-[260px] flex-shrink-0 flex items-center justify-center">
              {ang.diagram}
            </div>

            {/* Clear Plain English Explanation */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black font-mono flex-shrink-0">
                  {ang.number}
                </span>
                <h3 className="text-sm sm:text-base font-black font-heading text-slate-900 m-0">
                  {ang.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium m-0 pl-8">
                {ang.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Play Action CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black font-heading text-slate-900">Ready to test your skills?</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Jump into a match with solo AI or challenge players worldwide.</div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playVictory();
            onLaunchGame(currentGame.id);
          }}
          className="btn-primary py-3 px-6 rounded-xl font-heading font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md w-full sm:w-auto"
        >
          <Play size={15} fill="#FFFFFF" />
          <span>START PLAYING {currentGame.title.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
}
