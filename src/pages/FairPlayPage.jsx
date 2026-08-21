import React from 'react';
import { 
  ArrowLeft, ShieldCheck, Trophy, Award, Lock, 
  CheckCircle2, AlertTriangle, ArrowRight, Zap 
} from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';
import { getTier } from '../utils/userProfile.js';

export default function FairPlayPage({ onBackToHome, currentUserProfile }) {
  const currentTier = getTier(currentUserProfile?.rating || 1200, (currentUserProfile?.wins || 0) + (currentUserProfile?.losses || 0));

  const TIERS = [
    { name: 'Bronze Novice', elo: '0 - 1199', desc: 'Starting rank tier for new challengers.', color: '#94A3B8', bg: '#F1F5F9' },
    { name: 'Silver Tactician', elo: '1200 - 1399', desc: 'Solid fundamentals, understanding corner & center traps.', color: '#64748B', bg: '#F8FAFC' },
    { name: 'Gold Strategist', elo: '1400 - 1599', desc: 'Advanced board control, open-four chains, and timing.', color: '#EAB308', bg: '#FEFCE8' },
    { name: 'Platinum Master', elo: '1600 - 1799', desc: 'Tournament contender, executes complex forks and traps.', color: '#06B6D4', bg: '#ECFEFF' },
    { name: 'Diamond Grandmaster', elo: '1800+', desc: 'Elite top percentile competitor on the global leaderboard.', color: '#8B5CF6', bg: '#F5F3FF' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 box-border animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
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
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black font-heading tracking-tight text-slate-900 m-0">
              Fair Play & Certified ELO System
            </h1>
            <p className="text-[11px] text-slate-500 font-medium m-0">
              Standardized rating mathematics & competitive integrity
            </p>
          </div>
        </div>

        <div className="w-10" />
      </div>

      {/* Your Standing Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black font-heading shadow-md">
            {currentUserProfile?.hasCustomName && currentUserProfile?.name ? currentUserProfile.name[0].toUpperCase() : 'G'}
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">YOUR COMPETITIVE RANK</div>
            <h2 className="text-xl font-black font-heading text-slate-900 m-0">
              {currentUserProfile?.hasCustomName ? currentUserProfile.name : 'Guest Player'}
            </h2>
            <div className="text-xs text-slate-600 font-medium mt-0.5">
              Rating: <strong className="text-blue-600 font-black">{currentUserProfile?.rating || 1200} ELO</strong> • Tier: <strong>{currentTier.name}</strong>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
          <ShieldCheck size={16} />
          <span>ACCOUNT IN GOOD STANDING</span>
        </div>
      </div>

      {/* 5 Ranks Grid */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider px-1">
          COMPETITIVE RANK TIERS & THRESHOLDS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {TIERS.map(t => (
            <div
              key={t.name}
              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-2 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: t.bg, color: t.color }}>
                  {t.elo}
                </span>
              </div>
              <h3 className="text-sm font-black font-heading text-slate-900 m-0">{t.name}</h3>
              <p className="text-[11px] text-slate-500 font-medium m-0 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ELO Mathematics & Anti-Cheat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            <Trophy size={14} className="text-blue-600" />
            <span>THE ELO MATHEMATICAL FORMULA</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">
            We use the international chess standard Elo rating system (\(K = 32\)). After each match, ratings adjust dynamically:
          </p>

          <ul className="text-xs text-slate-600 flex flex-col gap-2 pl-4 m-0 leading-relaxed font-medium">
            <li><strong>Beating Higher ELO:</strong> Huge rating windfall (+24 to +32 points).</li>
            <li><strong>Beating Lower ELO:</strong> Standard expected win (+8 to +16 points).</li>
            <li><strong>Draws / Ties:</strong> Slight rating adjustments based on predicted win expectancy.</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>FAIR PLAY & INTEGRITY RULES</span>
          </div>

          <ul className="text-xs text-slate-600 flex flex-col gap-2 pl-4 m-0 leading-relaxed font-medium">
            <li><strong>Anti-Forfeit Protection:</strong> Closing the browser or leaving past the turn timer counts as a match loss.</li>
            <li><strong>No Automated Cheats:</strong> Using automated bot solvers or unfair software in ranked matches is strictly prohibited.</li>
            <li><strong>Fair Win Verification:</strong> All game moves and board lines are verified to guarantee that every victory is earned fairly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

