import React from 'react';
import { 
  Zap, Trophy, ShieldCheck, BookOpen, MessageSquare, 
  Info, Lock, ArrowUp, Globe, Bot, Users, Sparkles, Heart,
  ChevronRight, Gamepad2, Award
} from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function EnterpriseFooter({
  onSelectGame,
  onOpenRules,
  onOpenLeaderboard,
  onOpenAbout,
  onOpenContact,
  onOpenFairPlay,
  onOpenPrivacy
}) {
  const scrollToTop = () => {
    soundSynth.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full mt-auto bg-[#F4F4F5] border-t border-[#E4E4E7] text-zinc-800 transition-colors box-border pb-28 sm:pb-8">
      
      {/* 1. TOP VALUE RIBBON / TRUST BADGES */}
      <div className="border-b border-[#E4E4E7]/80 bg-white/50 backdrop-blur-sm px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
            <span className="font-bold text-zinc-900">Live Global Multiplayer</span>
            <span className="text-zinc-400 hidden sm:inline">•</span>
            <span className="text-zinc-500 hidden sm:inline">Zero Lag WebSockets</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] font-semibold text-zinc-500">
            <span className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Zap size={13} className="text-blue-500" />
              <span>Instant Browser Play</span>
            </span>
            <span className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>100% Free &amp; Private</span>
            </span>
            <span className="inline-flex items-center gap-1.5 hover:text-purple-600 transition-colors">
              <Globe size={13} className="text-purple-500" />
              <span>Worldwide Matches</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN STRUCTURED 4-COLUMN CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Elevator Pitch (4 cols on lg) */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <img 
                src="/brand-logo.jpg" 
                alt="games4u Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-md shadow-blue-500/20 border border-zinc-200"
              />
              <div>
                <span className="font-heading text-xl font-black text-zinc-900 tracking-tight block leading-none">
                  games4u
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block mt-0.5">
                  Strategy Board Arena
                </span>
              </div>
            </div>


            <p className="text-xs text-zinc-600 leading-relaxed m-0 font-medium max-w-sm">
              Free real-time multiplayer strategy board game platform. Battle friends across the globe with 6-letter room codes, practice against smart AI bots, or compete for certified ELO ranks.
            </p>


            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-[11px] font-mono font-bold text-zinc-700 shadow-sm">
                <Globe size={12} className="text-blue-500" />
                <span>Global Free Access</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-[11px] font-mono font-bold text-emerald-700 shadow-sm">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>No Ads • No Installs</span>
              </span>
            </div>
          </div>

          {/* Column 2: Classic Arena Games (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="text-[11px] font-mono font-extrabold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <Gamepad2 size={13} className="text-blue-600" />
              <span>CLASSIC GAMES</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {[
                { id: 'connect4', title: 'Connect 4', detail: '7×6 Gravity Grid', tag: 'Popular' },
                { id: 'tictactoe', title: 'Tic-Tac-Toe', detail: '3×3 Blitz Duel', tag: 'Fast' },
                { id: 'gomoku', title: 'Gomoku (15×15)', detail: 'Five-in-a-Row Strategy', tag: 'Pro' },
                { id: 'memory', title: 'Memory Match', detail: 'Icon Card Pairing', tag: 'Brain' },
                { id: 'ludo', title: 'Ludo Championship', detail: '2–4 Player Board', tag: 'Classic' }
              ].map(game => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    soundSynth.playClick();
                    if (onSelectGame) onSelectGame(game.id);
                  }}
                  className="group flex items-center justify-between px-3 py-2 rounded-xl text-left bg-transparent hover:bg-white border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer min-h-[40px]"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 group-hover:text-blue-600 transition-colors">
                      {game.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-500 font-medium">
                      {game.detail}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {game.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Play Modes & Competition (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="text-[11px] font-mono font-extrabold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-500" />
              <span>PLAY &amp; COMPETE</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playClick();
                  if (onOpenRules) onOpenRules();
                }}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer min-h-[40px]"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800 group-hover:text-blue-600 transition-colors">
                    How to Play &amp; Rules
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">Interactive guides for all 5 games</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundSynth.playClick();
                  if (onOpenLeaderboard) onOpenLeaderboard();
                }}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer min-h-[40px]"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Trophy size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800 group-hover:text-blue-600 transition-colors">
                    Global Top 50 Rankings
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">Grandmaster leaderboards</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundSynth.playClick();
                  if (onOpenFairPlay) onOpenFairPlay();
                }}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer min-h-[40px]"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800 group-hover:text-blue-600 transition-colors">
                    Fair Play &amp; Skill Rating
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">Certified ELO rating system</span>
                </div>
              </button>
            </div>
          </div>

          {/* Column 4: Platform & Support (2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="text-[11px] font-mono font-extrabold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <Info size={13} className="text-purple-600" />
              <span>PLATFORM</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playClick();
                  if (onOpenAbout) onOpenAbout();
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-white border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer min-h-[38px]"
              >
                <Info size={13} className="text-zinc-400 group-hover:text-blue-600" />
                <span className="text-xs font-bold text-zinc-700 group-hover:text-blue-600 transition-colors">
                  About Us
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundSynth.playClick();
                  if (onOpenContact) onOpenContact();
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-white border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer min-h-[38px]"
              >
                <MessageSquare size={13} className="text-zinc-400 group-hover:text-blue-600" />
                <span className="text-xs font-bold text-zinc-700 group-hover:text-blue-600 transition-colors">
                  Contact &amp; Feedback
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundSynth.playClick();
                  if (onOpenPrivacy) onOpenPrivacy();
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-white border border-transparent hover:border-zinc-200/80 transition-all cursor-pointer min-h-[38px]"
              >
                <Lock size={13} className="text-zinc-400 group-hover:text-blue-600" />
                <span className="text-xs font-bold text-zinc-700 group-hover:text-blue-600 transition-colors">
                  Privacy &amp; Terms
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. BOTTOM BAR WITH COPYRIGHT & BACK TO TOP BUTTON */}
      <div className="border-t border-[#E4E4E7] bg-[#F4F4F5] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-medium">
          
          {/* Copyright text */}
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} <strong className="text-zinc-900 font-extrabold">games4u Arena</strong>.</span>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <span>Free online multiplayer board games for players around the world.</span>
          </div>

          {/* Back to top button */}
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-zinc-200 hover:border-blue-200 text-zinc-700 hover:text-blue-600 text-xs font-bold shadow-sm transition-all cursor-pointer touch-manipulation"
          >
            <span>Back to Top</span>
            <ArrowUp size={13} />
          </button>
        </div>
      </div>

    </footer>
  );
}
