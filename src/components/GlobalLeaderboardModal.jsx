import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Trophy, X, RefreshCw, Database, Search, Crown, Medal, Flame,
  ShieldCheck, ArrowUpRight, User, CircleDot, Hash, Circle, Layers, Dices
} from 'lucide-react';
import { cloudSync } from '../utils/cloudSync.js';
import { isCloudConfigured } from '../utils/supabaseClient.js';
import { AVATARS, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';

export default function GlobalLeaderboardModal({
  isOpen,
  onClose,
  currentUserProfile
}) {
  const [activeTab, setActiveTab] = useState('connect4'); // 'connect4', 'tictactoe', 'gomoku', 'memory', 'ludo'
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCloud, setHasCloud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isOpen) {
      const configured = isCloudConfigured();
      setHasCloud(configured);
      document.body.style.overflow = 'hidden';
      if (configured) {
        loadLeaderboard(activeTab);
      }
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, activeTab]);

  const loadLeaderboard = async (tab) => {
    setIsLoading(true);
    try {
      const data = await cloudSync.fetchGlobalLeaderboard(tab);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    soundSynth.playRotate();
    setActiveTab(newTab);
    setSearchQuery('');
  };

  const TABS = [
    { id: 'connect4', label: 'Connect 4', icon: CircleDot, tag: '7×6 GRID' },
    { id: 'tictactoe', label: 'Tic-Tac-Toe', icon: Hash, tag: '3×3 FAST' },
    { id: 'gomoku', label: 'Gomoku', icon: Circle, tag: '15×15 PRO' },
    { id: 'memory', label: 'Memory', icon: Layers, tag: 'SPEED' },
    { id: 'ludo', label: 'Ludo', icon: Dices, tag: '2-4P' }
  ];


  // Dynamic Leaderboard: Combines cloud database records or initializes with current user's live stats
  const activeLeaderboardList = useMemo(() => {
    if (leaderboard && leaderboard.length > 0) return leaderboard;
    if (currentUserProfile) {
      const currentGameKey = activeTab;
      const gameStat = currentUserProfile.gameStats?.[currentGameKey] || {};
      const wins = Number(gameStat.wins || currentUserProfile.wins || 0);
      const losses = Number(gameStat.losses || currentUserProfile.losses || 0);
      const draws = Number(gameStat.draws || currentUserProfile.draws || 0);
      const total = wins + losses + draws;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      return [{
        id: currentUserProfile.id,
        rank: 1,
        name: currentUserProfile.name,
        gamertag: currentUserProfile.gamertag,
        avatarId: currentUserProfile.avatarId || '1',
        rating: Number(gameStat.rating || currentUserProfile.rating || 1200),
        level: Number(gameStat.level || currentUserProfile.level || 1),
        xp: Number(gameStat.xp || currentUserProfile.xp || 0),
        wins,
        losses,
        draws,
        totalMatches: total,
        winRate,
        status: 'ONLINE'
      }];
    }
    return [];
  }, [leaderboard, currentUserProfile, activeTab]);

  // Filter players based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return activeLeaderboardList;
    const q = searchQuery.toLowerCase().trim();
    return activeLeaderboardList.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.rank?.toString() === q ||
      p.rating?.toString().includes(q)
    );
  }, [activeLeaderboardList, searchQuery]);

  // Current player's ranking in this list
  const currentRankIndex = useMemo(() => {
    if (!currentUserProfile?.name) return -1;
    const myName = currentUserProfile.name.toLowerCase().trim();
    return activeLeaderboardList.findIndex(p => p.name?.toLowerCase().trim() === myName || p.id === currentUserProfile.id);
  }, [activeLeaderboardList, currentUserProfile]);

  const myCurrentRank = currentRankIndex !== -1 ? activeLeaderboardList[currentRankIndex] : null;

  // Top 3 Podium
  const top1 = activeLeaderboardList[0];
  const top2 = activeLeaderboardList[1];
  const top3 = activeLeaderboardList[2];


  if (!isOpen) return null;

  const modalContent = (
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
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(96vw, 620px)',
          height: 'min(94dvh, 760px)',
          maxHeight: '94dvh',
          background: '#ffffff',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
          borderRadius: '24px',
          border: '1.5px solid #e2e8f0',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: 'clamp(14px, 3.5vw, 24px)',
          gap: '12px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header: Title, Cloud Badge & Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#0f172a', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Trophy size={20} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '19px',
                fontWeight: '900',
                color: '#0f172a',
                margin: 0
              }}>
                GLOBAL GRANDMASTERS
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: '800',
                  color: '#15803d', background: '#ecfdf5',
                  padding: '2px 6px', borderRadius: '4px'
                }}>
                  <Database size={10} />
                  LIVE REAL-TIME DATABASE
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => loadLeaderboard(activeTab)}
              disabled={isLoading}
              style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: '#f8fafc', border: '1px solid #cbd5e1',
                color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Refresh Leaderboard"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={onClose}
              className="modal-close-btn"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 5 Tournament Game Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
          gap: '6px',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '14px'
        }}>

          {TABS.map((tab) => {
            const IconComp = tab.icon;
            const isSel = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSel ? '#ffffff' : 'transparent',
                  color: isSel ? '#0f172a' : '#64748b',
                  boxShadow: isSel ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '800',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp size={14} color={isSel ? '#0f172a' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top 3 Podium Showcase (Rendered when we have real players) */}
        {leaderboard.length > 0 && !searchQuery && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.15fr 1fr',
            gap: '8px',
            alignItems: 'flex-end',
            padding: '10px 4px 4px'
          }}>
            {/* 🥈 2nd Place */}
            {top2 ? (
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b' }}>🥈 #2</span>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: AVATARS.find(a => a.id === top2.avatarId)?.color || '#1e3a8a',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '13px'
                }}>
                  {top2.name ? top2.name[0].toUpperCase() : 'P'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {top2.name}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                  {top2.rating} ELO
                </div>
              </div>
            ) : <div />}

            {/* 🥇 1st Place Champion */}
            {top1 && (
              <div style={{
                background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '16px',
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '5px',
                boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.25)',
                transform: 'translateY(-4px)'
              }}>
                <Crown size={18} color="#d97706" />
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#b45309' }}>🥇 CHAMPION</span>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: AVATARS.find(a => a.id === top1.avatarId)?.color || '#0f172a',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '16px',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)'
                }}>
                  {top1.name ? top1.name[0].toUpperCase() : 'P'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#78350f', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {top1.name}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#92400e', fontFamily: 'var(--font-mono)' }}>
                  {top1.rating} ELO
                </div>
              </div>
            )}

            {/* 🥉 3rd Place */}
            {top3 ? (
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#92400e' }}>🥉 #3</span>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: AVATARS.find(a => a.id === top3.avatarId)?.color || '#991b1b',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '13px'
                }}>
                  {top3.name ? top3.name[0].toUpperCase() : 'P'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {top3.name}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                  {top3.rating} ELO
                </div>
              </div>
            ) : <div />}
          </div>
        )}

        {/* Live Search Bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search real players by GamerTag or Rank..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              fontSize: '12px',
              fontWeight: '700',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
              background: '#f8fafc'
            }}
          />
        </div>

        {/* Leaderboard Table / Scrollable List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: '#64748b' }}>
              <RefreshCw size={22} className="animate-spin" />
              <span style={{ fontSize: '12px', fontWeight: '700' }}>Fetching real tournament records...</span>
            </div>
          ) : !hasCloud ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', textAlign: 'center', gap: '8px' }}>
              <Database size={32} color="#cbd5e1" />
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                Cloud Leaderboard Not Configured
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, maxWidth: '280px' }}>
                Connect to Supabase to enable global tournament rankings and cross-device profile sync.
              </p>
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', textAlign: 'center', gap: '8px' }}>
              <Trophy size={32} color="#cbd5e1" />
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                No Ranked Records Found Yet
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, maxWidth: '280px' }}>
                Play a ranked online match in {TABS.find(t => t.id === activeTab)?.label} to claim the #1 Grandmaster spot!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredLeaderboard.map((player) => {
                const isMe = (currentUserProfile?.name && player.name?.toLowerCase() === currentUserProfile.name?.toLowerCase()) || player.id === currentUserProfile?.id;
                const avatar = AVATARS.find(a => a.id === player.avatarId) || AVATARS[0];
                const playerTier = getTier(player.rating);

                return (
                  <div
                    key={player.id || player.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: '1px solid #e2e8f0',
                      background: isMe ? '#eff6ff' : '#ffffff',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Rank + Player Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '24px',
                        fontSize: '12px',
                        fontWeight: '900',
                        fontFamily: 'var(--font-mono)',
                        color: player.rank === 1 ? '#d97706' : player.rank === 2 ? '#64748b' : player.rank === 3 ? '#b45309' : '#0f172a',
                        textAlign: 'center'
                      }}>
                        #{player.rank}
                      </div>

                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: avatar.color, color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '900', fontSize: '13px', flexShrink: 0
                      }}>
                        {player.name ? player.name[0].toUpperCase() : 'P'}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: isMe ? '#1d4ed8' : '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {player.name}
                          </span>
                          {isMe && (
                            <span style={{
                              fontSize: '8px', fontWeight: '900', padding: '1px 4px',
                              borderRadius: '4px', background: '#2563eb', color: '#ffffff'
                            }}>
                              YOU
                            </span>
                          )}
                          <span style={{
                            fontSize: '8px', fontWeight: '800', padding: '1px 4px',
                            borderRadius: '4px', background: '#f1f5f9', color: '#475569',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {playerTier.badge}
                          </span>
                        </div>

                        <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          <strong style={{ color: '#065f46' }}>{player.wins}W</strong> - <strong style={{ color: '#991b1b' }}>{player.losses}L</strong> ({player.winRate}% WR)
                        </div>
                      </div>
                    </div>

                    {/* Rating & Level */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                        {player.rating} ELO
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        Level {player.level || 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Your Standing Banner */}
        <div style={{
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} color="#38bdf8" />
            <div style={{ fontSize: '12px', fontWeight: '800' }}>
              {currentUserProfile?.name || 'Your Standing'}:
            </div>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>
              {myCurrentRank ? `Rank #${myCurrentRank.rank}` : 'Unranked (Play a match)'}
            </span>
          </div>

          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
            <strong>{currentUserProfile?.rating || 1200}</strong> ELO
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
