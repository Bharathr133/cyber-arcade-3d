import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X, RefreshCw, Database, ShieldAlert } from 'lucide-react';
import { cloudSync } from '../utils/cloudSync.js';
import { isCloudConfigured } from '../utils/supabaseClient.js';
import { AVATARS, getTier } from '../utils/userProfile.js';

export default function GlobalLeaderboardModal({
  isOpen,
  onClose,
  currentUserProfile
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'gomoku', 'connect4', 'tictactoe'
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCloud, setHasCloud] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const configured = isCloudConfigured();
      setHasCloud(configured);
      loadLeaderboard(activeTab);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, activeTab]);

  const loadLeaderboard = async (tab) => {
    setIsLoading(true);
    try {
      const data = await cloudSync.fetchGlobalLeaderboard(tab);
      setLeaderboard(data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const TABS = [
    { id: 'all', label: 'OVERALL' },
    { id: 'gomoku', label: 'GOMOKU' },
    { id: 'connect4', label: 'CONNECT 4' },
    { id: 'tictactoe', label: 'TIC-TAC-TOE' }
  ];

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto'
      }}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(94vw, 560px)',
          height: 'min(90vh, 680px)',
          maxHeight: '90vh',
          padding: 'clamp(20px, 4vw, 28px)',
          background: '#ffffff',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          margin: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingRight: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: '#fef3c7', border: '1px solid #fde68a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706'
            }}>
              <Trophy size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                GLOBAL LEADERBOARD
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: '800',
                  color: hasCloud ? '#15803d' : '#64748b',
                  background: hasCloud ? '#ecfdf5' : '#f1f5f9',
                  padding: '2px 6px', borderRadius: '4px'
                }}>
                  <Database size={11} />
                  {hasCloud ? 'SUPABASE CLOUD CONNECTED' : 'OFFLINE MODE'}
                </span>
              </div>
            </div>
          </div>

          {hasCloud && (
            <button
              onClick={() => loadLeaderboard(activeTab)}
              disabled={isLoading}
              className="btn-secondary"
              style={{ padding: '6px 10px', minHeight: '34px' }}
              title="Refresh Leaderboard"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '12px'
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 2px',
                borderRadius: '8px',
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? '#0f172a' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table / List View */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          paddingRight: '2px'
        }}>
          {!hasCloud ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '240px', gap: '12px', padding: '20px', textAlign: 'center',
              background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #cbd5e1'
            }}>
              <ShieldAlert size={36} color="#64748b" />
              <div>
                <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Cloud Database Not Configured in .env
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b', maxWidth: '380px', lineHeight: 1.4 }}>
                  Add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your environment variables to enable live global player rankings.
                </span>
              </div>
            </div>
          ) : isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px' }}>
              <RefreshCw size={24} className="animate-spin" color="#2563eb" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
                Fetching Live Grandmaster Rankings...
              </span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px' }}>
              <Trophy size={32} color="#cbd5e1" />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', color: '#64748b' }}>
                No rankings recorded in database yet. Play a match to claim #1!
              </span>
            </div>
          ) : (
            leaderboard.map((player) => {
              const avatar = AVATARS.find(a => a.id === player.avatarId) || AVATARS[0];
              const tier = getTier(player.rating);
              const isCurrentUser = currentUserProfile?.name === player.name;

              return (
                <div
                  key={player.id || player.rank}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr auto',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: isCurrentUser ? '#eff6ff' : player.rank <= 3 ? '#f8fafc' : '#ffffff',
                    border: isCurrentUser ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {player.rank === 1 ? (
                      <span style={{ fontSize: '18px' }}>🥇</span>
                    ) : player.rank === 2 ? (
                      <span style={{ fontSize: '18px' }}>🥈</span>
                    ) : player.rank === 3 ? (
                      <span style={{ fontSize: '18px' }}>🥉</span>
                    ) : (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontWeight: '900',
                        color: '#64748b'
                      }}>
                        #{player.rank}
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: avatar.color, color: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '900',
                      flexShrink: 0
                    }}>
                      {player.name ? player.name[0].toUpperCase() : 'P'}
                    </div>

                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '13px',
                          fontWeight: '800',
                          color: isCurrentUser ? '#1d4ed8' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {player.name} {isCurrentUser && '(You)'}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          fontWeight: '900',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          background: `${tier.color}15`,
                          color: tier.color
                        }}>
                          {tier.badge}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b' }}>
                        Lvl {player.level || 1} • {player.wins}W / {player.losses}L ({player.winRate}% WR)
                      </span>
                    </div>
                  </div>

                  {/* ELO Rating */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '15px',
                      fontWeight: '900',
                      color: '#0f172a'
                    }}>
                      {player.rating}
                    </span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#64748b' }}>
                      ELO
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#94a3b8'
        }}>
          <span>Top 50 Grandmasters • Real-Time Cloud Data</span>
          <span>Competitive ELO Ranking</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
