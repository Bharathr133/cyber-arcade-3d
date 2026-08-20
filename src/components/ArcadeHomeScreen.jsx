import React, { useState, useEffect } from 'react';
import { 
  Bot, User, Zap, Lock, Play, Layers, Dices, Users, Swords, Sparkles, Trophy, 
  ArrowRight, ShieldCheck, Flame, Compass, ChevronDown, ChevronUp, Clock, Award, Globe, Radio, KeyRound
} from 'lucide-react';
import { TicTacToeIcon, ConnectFourIcon, GomokuIcon, MemoryMatchIcon, LudoIcon } from './GameIcons.jsx';
import { presenceService } from '../services/presenceService.js';
import { getTier } from '../utils/userProfile.js';

// Clean Vector Board Previews
function TicTacToeTilePreview() {
  return (
    <div className="w-full h-[130px] bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-colors">
      <svg viewBox="0 0 120 120" className="w-full h-full max-w-[110px]">
        <line x1="40" y1="14" x2="40" y2="106" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="14" x2="80" y2="106" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="40" x2="106" y2="40" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="80" x2="106" y2="80" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />

        <g stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round">
          <line x1="20" y1="20" x2="34" y2="34" />
          <line x1="34" y1="20" x2="20" y2="34" />
          <line x1="58" y1="58" x2="72" y2="72" />
          <line x1="72" y1="58" x2="58" y2="72" />
          <line x1="96" y1="58" x2="110" y2="72" />
          <line x1="110" y1="58" x2="96" y2="72" />
        </g>

        <circle cx="103" cy="27" r="8" stroke="#3B82F6" strokeWidth="3.5" fill="none" />
        <circle cx="27" cy="65" r="8" stroke="#3B82F6" strokeWidth="3.5" fill="none" />
        <circle cx="103" cy="103" r="8" stroke="#3B82F6" strokeWidth="3.5" fill="none" />
      </svg>
    </div>
  );
}

function ConnectFourTilePreview() {
  return (
    <div className="w-full h-[130px] bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-colors">
      <svg viewBox="0 0 140 120" className="w-full h-full max-w-[120px]">
        {[0, 1, 2, 3, 4, 5].map((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) => {
            const cx = 15 + col * 18;
            const cy = 15 + row * 18;
            let fill = '#E2E8F0';
            if (row === 5 && (col === 1 || col === 2 || col === 3 || col === 4)) fill = '#EF4444';
            else if (row === 4 && (col === 2 || col === 3 || col === 4)) fill = '#EAB308';
            else if (row === 3 && (col === 3 || col === 4)) fill = '#EF4444';
            else if (row === 2 && col === 3) fill = '#EAB308';
            else if (row === 5 && (col === 0 || col === 6)) fill = '#EAB308';

            return (
              <circle
                key={`${row}-${col}`}
                cx={cx}
                cy={cy}
                r="6.5"
                fill={fill}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

function GomokuTilePreview() {
  return (
    <div className="w-full h-[130px] bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-colors">
      <svg viewBox="0 0 120 120" className="w-full h-full max-w-[110px]">
        {[20, 36, 52, 68, 84, 100].map((pos) => (
          <React.Fragment key={pos}>
            <line x1="20" y1={pos} x2="100" y2={pos} stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1={pos} y1="20" x2={pos} y2="100" stroke="#E2E8F0" strokeWidth="1.5" />
          </React.Fragment>
        ))}

        <circle cx="36" cy="84" r="5.5" fill="#0F172A" />
        <circle cx="52" cy="68" r="5.5" fill="#0F172A" />
        <circle cx="68" cy="52" r="5.5" fill="#0F172A" />
        <circle cx="84" cy="36" r="5.5" fill="#0F172A" />
        <circle cx="100" cy="20" r="5.5" fill="#0F172A" />

        <circle cx="52" cy="84" r="5.5" fill="#94A3B8" />
        <circle cx="68" cy="68" r="5.5" fill="#94A3B8" />
        <circle cx="84" cy="52" r="5.5" fill="#94A3B8" />
        <circle cx="36" cy="52" r="5.5" fill="#94A3B8" />
      </svg>
    </div>
  );
}

function MemoryMatchTilePreview() {
  return (
    <div className="w-full h-[130px] bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-colors">
      <svg viewBox="0 0 140 120" className="w-full h-full max-w-[120px]">
        <rect x="14" y="14" width="24" height="34" rx="4" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.5" />
        <circle cx="26" cy="31" r="5" fill="#3B82F6" />

        <rect x="44" y="14" width="24" height="34" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />

        <rect x="74" y="14" width="24" height="34" rx="4" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.5" />
        <circle cx="86" cy="31" r="5" fill="#3B82F6" />

        <rect x="104" y="14" width="24" height="34" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="14" y="58" width="24" height="34" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />

        <rect x="44" y="58" width="24" height="34" rx="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.5" />
        <rect x="51" y="68" width="10" height="14" rx="2" fill="#10B981" />

        <rect x="74" y="58" width="24" height="34" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="104" y="58" width="24" height="34" rx="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.5" />
        <rect x="111" y="68" width="10" height="14" rx="2" fill="#10B981" />
      </svg>
    </div>
  );
}

function LudoTilePreview() {
  return (
    <div className="w-full h-[130px] bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-colors">
      <svg viewBox="0 0 120 120" className="w-full h-full max-w-[110px]">
        <rect x="10" y="10" width="100" height="100" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />

        <rect x="14" y="14" width="38" height="38" rx="4" fill="#EF4444" opacity="0.85" />
        <circle cx="33" cy="33" r="6" fill="#FFFFFF" />

        <rect x="68" y="14" width="38" height="38" rx="4" fill="#22C55E" opacity="0.85" />
        <circle cx="87" cy="33" r="6" fill="#FFFFFF" />

        <rect x="14" y="68" width="38" height="38" rx="4" fill="#3B82F6" opacity="0.85" />
        <circle cx="33" cy="87" r="6" fill="#FFFFFF" />

        <rect x="68" y="68" width="38" height="38" rx="4" fill="#EAB308" opacity="0.85" />
        <circle cx="87" cy="87" r="6" fill="#FFFFFF" />

        <polygon points="60,48 72,60 60,72 48,60" fill="#0F172A" />
        <circle cx="60" cy="60" r="3" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

export default function ArcadeHomeScreen({
  profile,
  stats,
  onSelectGame,
  onStartQuickMatch,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenStats,
  onOpenSettings
}) {
  const [gameCounts, setGameCounts] = useState(() => presenceService.getGameCounts());
  const [totalOnline, setTotalOnline] = useState(() => presenceService.getOnlineCount());
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [expandedTip, setExpandedTip] = useState(null);

  useEffect(() => {
    const unsubPresence = presenceService.subscribe((count) => setTotalOnline(count));
    const unsubGameCounts = presenceService.subscribeGameCounts((counts) => setGameCounts(counts));

    return () => {
      unsubPresence();
      unsubGameCounts();
    };
  }, []);

  const handleJoinCodeSubmit = (e) => {
    e.preventDefault();
    const clean = roomCodeInput.trim().toUpperCase();
    if (clean.length >= 4) {
      onJoinPrivateRoom('connect4', clean);
      setRoomCodeInput('');
    }
  };

  const GAMES = [
    {
      id: 'connect4',
      title: 'Connect 4',
      subtitle: '7 × 6 Gravity Grid',
      specBadge: '7×6 GRID',
      difficulty: 'Medium',
      duration: '3–5 min',
      strategyTag: 'Vertical Traps',
      type: 'GRID',
      icon: ConnectFourIcon,
      accentColor: '#3B82F6',
      preview: <ConnectFourTilePreview />,
      tip: 'Control the center column (Col 4) early to maximize horizontal, vertical, and diagonal winning combinations.'
    },
    {
      id: 'tictactoe',
      title: 'Tic-Tac-Toe',
      subtitle: '3 × 3 Fast Arena',
      specBadge: '3×3 FAST',
      difficulty: 'Fast',
      duration: '1–2 min',
      strategyTag: 'Corner Forks',
      type: 'GRID',
      icon: TicTacToeIcon,
      accentColor: '#6366F1',
      preview: <TicTacToeTilePreview />,
      tip: 'Opening with corners gives you multiple diagonal and cross-vector trap possibilities against aggressive opponents.'
    },
    {
      id: 'gomoku',
      title: 'Gomoku',
      subtitle: '15 × 15 Pro Tournament Grid',
      specBadge: '15×15 PRO',
      difficulty: 'High Strategy',
      duration: '5–10 min',
      strategyTag: 'Open-Four Chains',
      type: 'GRID',
      icon: GomokuIcon,
      accentColor: '#0F172A',
      preview: <GomokuTilePreview />,
      tip: 'Create an unblocked three-in-a-row (Open Three) to force your opponent into defense while setting up double-attack branches.'
    },
    {
      id: 'memory',
      title: 'Memory Match',
      subtitle: '5-Level Campaign & Blitz',
      specBadge: '5 LEVELS',
      difficulty: 'Cognitive',
      duration: '2–4 min',
      strategyTag: 'Visual Recall',
      type: 'CAMPAIGN',
      icon: MemoryMatchIcon,
      accentColor: '#10B981',
      preview: <MemoryMatchTilePreview />,
      tip: 'Memorize tiles in corner clusters first to eliminate grid quadrants and achieve high multiplier score streaks.'
    },
    {
      id: 'ludo',
      title: 'Ludo Championship',
      subtitle: '2–4 Player Battle Arena',
      specBadge: '2–4 PLAYERS',
      difficulty: 'Strategy & Luck',
      duration: '8–15 min',
      strategyTag: 'Safe Zone Tactics',
      type: 'LUDO',
      icon: LudoIcon,
      accentColor: '#F59E0B',
      preview: <LudoTilePreview />,
      tip: 'Keep tokens stationed on star/safe zones until an opponent passes, then strike from behind for maximum board control.'
    }
  ];

  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const tier = getTier(profile?.rating || 1200, totalMatches);
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;
  const xpProgress = Math.min(100, Math.round(((profile?.xp || 0) % 100)));

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-8 box-border">
      
      {/* 1. BALANCED PREMIUM SLATE HERO BANNER */}
      <div className="w-full rounded-2xl bg-slate-900 text-white p-6 sm:p-7 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-black uppercase font-mono tracking-wider mb-2.5">
              <Zap size={13} className="text-blue-400" />
              <span>Realtime Strategy Arena</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight leading-tight m-0 text-white">
              Play Classic Board Games <span className="text-blue-400">Live with Players Worldwide</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              Zero downloads. Instant matchmaking. Climb verified ELO ranks, challenge Grandmaster AI, or create private rooms to battle friends.
            </p>

            {/* Platform Metrics Bar */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 pt-3.5 border-t border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span><strong className="text-white font-bold">{totalOnline}</strong> Live Players Online</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Trophy size={14} className="text-amber-400" />
                <span>5 Competitive Disciplines</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck size={14} className="text-blue-400" />
                <span>Certified ELO Skill Rating</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock size={14} className="text-emerald-400" />
                <span>Sub-15ms Latency</span>
              </div>
            </div>
          </div>

          {/* Right Side: Competitor Standing / Quick Stats Profile Card */}
          <div className="w-full lg:w-auto min-w-[270px] sm:min-w-[300px] p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400">
                ARENA STANDING
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {tier.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black font-heading text-sm shadow-sm">
                {profile?.hasCustomName && profile?.name ? profile.name[0].toUpperCase() : 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">
                  {profile?.hasCustomName ? profile.name : 'Guest Competitor'}
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                  <span><strong className="text-white font-bold">{profile?.rating || 1200}</strong> ELO</span>
                  <span>•</span>
                  <span>{totalMatches} Matches</span>
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-700/60 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between items-center">
                <span>XP Level {profile?.level || 1}</span>
                <span className="text-slate-300">{xpProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                onClick={onOpenProfile}
                className="py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold transition-colors text-center cursor-pointer"
              >
                Profile Stats
              </button>
              <button
                onClick={onOpenLeaderboard}
                className="py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors text-center cursor-pointer"
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>




      {/* 2. FIVE DISTINCT GAME CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-900 font-heading uppercase tracking-wider m-0">Arena Game Disciplines</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">Select a game to battle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map((game) => {
            const IconComp = game.icon;
            const liveCount = gameCounts[game.id] || 0;
            const isTipOpen = expandedTip === game.id;

            return (
              <div
                key={game.id}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 p-5 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between gap-3.5 relative"
              >
                {/* Top Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 flex-shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                    >
                      <IconComp size={20} />
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 font-heading tracking-tight m-0 leading-snug">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                        {game.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Dynamic Player Count Badge from DB */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{liveCount > 0 ? `${liveCount} LIVE` : 'ACTIVE'}</span>
                    </span>
                  </div>
                </div>

                {/* Vector Board Preview */}
                <div className="cursor-pointer" onClick={() => onSelectGame(game.id, 'VS_COMPUTER')}>
                  {game.preview}
                </div>

                {/* Game Specs & Strategy Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold text-slate-600">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">{game.specBadge}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">{game.duration}</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">{game.strategyTag}</span>
                </div>

                {/* Strategy Tip Accordion */}
                <div className="border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedTip(isTipOpen ? null : game.id)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors py-0.5 cursor-pointer bg-transparent border-none"
                  >
                    <span className="flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" />
                      <span>Winning Tactic & Rules</span>
                    </span>
                    {isTipOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {isTipOpen && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed font-medium animate-pop-in">
                      {game.tip}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {game.type === 'CAMPAIGN' ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onSelectGame('memory', 'SOLO_LEVELS')}
                      className="col-span-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                    >
                      <Play size={14} fill="#FFFFFF" />
                      <span>PLAY CAMPAIGN (5 LEVELS)</span>
                    </button>

                    <button
                      onClick={() => onSelectGame('memory', 'VS_COMPUTER')}
                      className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <Bot size={13} />
                      <span>Vs AI Bot</span>
                    </button>

                    <button
                      onClick={() => onSelectGame('memory', 'LOCAL_2P')}
                      className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <Users size={13} />
                      <span>2P Pass & Play</span>
                    </button>
                  </div>
                ) : game.type === 'LUDO' ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onStartQuickMatch('ludo', 'Ludo Championship')}
                      className="col-span-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                    >
                      <Zap size={14} fill="#FFFFFF" />
                      <span>ONLINE QUICK MATCH</span>
                    </button>

                    <button
                      onClick={() => onSelectGame('ludo', 'VS_BOTS')}
                      className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <Bot size={13} />
                      <span>Vs 3 AI Bots</span>
                    </button>

                    <button
                      onClick={() => onSelectGame('ludo', 'LOCAL_PASS_PLAY')}
                      className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <Dices size={13} />
                      <span>2–4P Pass & Play</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => onStartQuickMatch(game.id, game.title)}
                      className="col-span-3 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                    >
                      <Zap size={14} fill="#FFFFFF" />
                      <span>ONLINE QUICK MATCH</span>
                    </button>

                    <button
                      onClick={() => onSelectGame(game.id, 'VS_COMPUTER')}
                      className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer transition-colors"
                      title="Practice against Smart AI"
                    >
                      <Bot size={13} />
                      <span>Vs AI</span>
                    </button>

                    <button
                      onClick={() => onSelectGame(game.id, 'LOCAL_2P')}
                      className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer transition-colors"
                      title="2 Players on the same screen"
                    >
                      <User size={13} />
                      <span>2P Local</span>
                    </button>

                    <button
                      onClick={() => onCreatePrivateRoom(game.id, game.title)}
                      className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer transition-colors"
                      title="Create private room to invite a friend"
                    >
                      <Lock size={13} />
                      <span>Room</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PLATFORM VALUE PILLARS ("Why Players Choose games4u") */}
      <div className="mt-4 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs font-mono font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Engineered For Performance
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2 m-0">
            Why Competitive Players Choose games4u Arena
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Zap size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 m-0">Sub-15ms Realtime</h3>
            <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
              Instant WebSockets and Supabase Realtime ensure lightning-fast moves with zero latency.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Trophy size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 m-0">ELO Skill Ranking</h3>
            <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
              Ascend from Bronze to Grandmaster with certified competitive match rating tracking.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Globe size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 m-0">Cross-Platform Web</h3>
            <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
              Instant play on Mobile, Tablet, and Desktop browsers with zero installs or ads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-900 m-0">Anti-Cheat Engine</h3>
            <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
              Server-verified move legality and heuristic win-rate tracking ensure 100% fair play.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

