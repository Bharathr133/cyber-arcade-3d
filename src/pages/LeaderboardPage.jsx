import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Trophy, Search, RefreshCw, Crown, 
  Medal, ShieldCheck, User, Zap, ArrowRight 
} from 'lucide-react';
import { cloudSync } from '../utils/cloudSync.js';
import { isCloudConfigured } from '../utils/supabaseClient.js';
import { AVATARS, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';

export default function LeaderboardPage({ onBackToHome, currentUserProfile }) {
  const [activeTab, setActiveTab] = useState('connect4');
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCloud, setHasCloud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const configured = isCloudConfigured();
    setHasCloud(configured);
    loadLeaderboard(activeTab);
  }, [activeTab]);

  const loadLeaderboard = async (tab) => {
    setIsLoading(true);
    try {
      const data = await cloudSync.fetchGlobalLeaderboard(tab);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (e) {
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredList = leaderboard.filter(p => 
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Trophy size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black font-heading tracking-tight text-slate-900 m-0">
              Global Top 50 Leaderboard
            </h1>
            <p className="text-[11px] text-slate-500 font-medium m-0">
              Verified mathematical Elo ratings across all arena disciplines
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundSynth.playClick();
            loadLeaderboard(activeTab);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Game Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { id: 'connect4', label: 'Connect 4' },
          { id: 'tictactoe', label: 'Tic-Tac-Toe' },
          { id: 'gomoku', label: 'Gomoku' },
          { id: 'memory', label: 'Memory' },
          { id: 'ludo', label: 'Ludo' }
        ].map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              soundSynth.playClick();
              setActiveTab(g.id);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold font-heading transition-all cursor-pointer ${
              activeTab === g.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search player by name..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs font-mono text-slate-500 font-bold animate-pulse">
            LOADING GLOBAL STANDINGS...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 font-medium">
            No ranked competitors found for this discipline. Play a match to claim the #1 spot!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((player, idx) => {
              const isCurrentUser = currentUserProfile?.name && player.name.toLowerCase() === currentUserProfile.name.toLowerCase();
              const tier = getTier(player.rating || 1200, (player.wins || 0) + (player.losses || 0));

              return (
                <div
                  key={player.id || idx}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isCurrentUser ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Rank & Player Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 flex items-center justify-center font-mono font-black text-sm">
                      {idx === 0 ? <Crown size={20} className="text-amber-500" /> :
                       idx === 1 ? <Medal size={20} className="text-slate-400" /> :
                       idx === 2 ? <Medal size={20} className="text-amber-700" /> :
                       <span className="text-slate-400">#{idx + 1}</span>}
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black font-heading text-sm">
                      {player.name ? player.name[0].toUpperCase() : 'G'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 truncate">
                          {player.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {tier.name}
                      </span>
                    </div>
                  </div>

                  {/* Rating & Win Rate */}
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:block">
                      <div className="text-xs font-black text-slate-900">
                        {player.wins || 0}W - {player.losses || 0}L
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {(player.wins || 0) + (player.losses || 0)} Matches
                      </div>
                    </div>

                    <div className="w-20">
                      <div className="text-sm font-black font-mono text-blue-600">
                        {player.rating || 1200}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                        ELO
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
