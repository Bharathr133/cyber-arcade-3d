import React from 'react';
import { 
  ArrowLeft, Info, Zap, ShieldCheck, Trophy, 
  Users, ArrowRight, Heart, Sparkles, Smile, Gamepad2, Volume2
} from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function AboutPage({ onBackToHome, onExploreGames }) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 box-border animate-fade-in font-body text-zinc-900">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <button
          type="button"
          onClick={() => {
            soundSynth.playClick();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>BACK TO ARENA</span>
        </button>

        <div className="flex items-center gap-2.5">
          <img 
            src="/brand-logo.jpg" 
            alt="games4u Logo" 
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm"
          />
          <div>
            <h1 className="text-sm font-extrabold font-heading tracking-tight text-slate-900 m-0">
              About games4u
            </h1>
            <p className="text-[11px] text-slate-500 font-medium m-0">
              Free Multiplayer Strategy Board Games
            </p>

          </div>
        </div>


        <button
          type="button"
          onClick={() => {
            soundSynth.playVictory();
            onExploreGames();
          }}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
        >
          <span>PLAY NOW</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Hero Studio Banner */}
      <div className="rounded-2xl bg-zinc-900 text-white p-8 sm:p-10 border border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} className="text-blue-400" />
            <span>PLATFORM STORY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight leading-tight m-0 text-white">
            Classic Board Games Made Simple, Fast &amp; Free
          </h2>

          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            <strong>games4u</strong> was created to bring back the pure joy of classic strategy games without annoying app downloads, forced ads, or paywalls. Whether you want to play a quick match with a friend across the world, battle a smart computer bot, or play side-by-side on the same screen, you can jump in instantly.
          </p>
        </div>
      </div>

      {/* 3 Core Experience Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Zap size={20} />
          </div>
          <h3 className="text-base font-extrabold font-heading text-slate-900 m-0">Zero App Installs</h3>
          <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">
            Opens instantly in any web browser on your phone, tablet, or computer in under 2 seconds. No storage space taken.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Trophy size={20} />
          </div>
          <h3 className="text-base font-extrabold font-heading text-slate-900 m-0">Fair Skill Rankings</h3>
          <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">
            Earn rating points for every victory and climb the leaderboard from Bronze tier all the way up to Grandmaster.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
            <Users size={20} />
          </div>
          <h3 className="text-base font-extrabold font-heading text-slate-900 m-0">Play Friends Anywhere</h3>
          <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">
            Create a private room code in 1 click and share it on WhatsApp or Discord to play with friends across the world with zero lag.
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid in Plain English */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-5">
        <div>
          <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
            FEATURE HIGHLIGHTS
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 font-heading mt-1 m-0">
            Everything Built For Your Game Night
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
              <Gamepad2 size={16} className="text-blue-600" />
              <span>5 Timeless Board Games</span>
            </div>
            <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
              Connect 4, Tic-Tac-Toe, Gomoku (Five-in-a-Row), Memory Match, and Ludo Championship.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <span>3 Ways to Play</span>
            </div>
            <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
              Play Online against global players, play 2-Player Local on one screen, or battle smart computer bots.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>100% Free &amp; Private</span>
            </div>
            <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
              No subscription fees, no credit cards required, no annoying popup ads, and zero selling of personal data.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
              <Volume2 size={16} className="text-purple-600" />
              <span>Crisp Audio &amp; Sounds</span>
            </div>
            <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
              Satisfying sound effects for piece drops, dice rolls, timer ticks, and victory celebrations.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
              <Smile size={16} className="text-amber-600" />
              <span>Instant Guest Mode</span>
            </div>
            <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
              Pick a nickname and start playing immediately without being forced to create a password or account.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <div className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
              <Zap size={16} className="text-red-600" />
              <span>Smooth &amp; Instant Moves</span>
            </div>
            <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
              Ultra-responsive turns so every move is placed smoothly without waiting or lag.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
