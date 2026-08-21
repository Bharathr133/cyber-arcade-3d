import React, { useState } from 'react';
import { 
  User, Trophy, Award, Dices, Layers, Grid, ArrowLeft, LogOut, Edit2, ShieldCheck, Flame, TrendingUp, Lock, Key, RefreshCw, Check, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { saveUserProfile, getTier } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';
import { adminService } from '../services/adminService.js';
import { authService } from '../services/authService.js';


export default function ProfilePage({
  profile,
  onProfileUpdated,
  onBackToHome,
  onLogout,
  onNavigateToAuth,
  onOpenAdmin
}) {

  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password Management State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);


  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const currentTier = getTier(profile?.rating || 1200, totalMatches);
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;
  const isRegistered = !profile?.isGuest && profile?.email;

  const GAME_LIST = [
    { key: 'connect4', label: 'Connect 4', icon: Grid, desc: 'Vertical 4-in-a-row strategy' },
    { key: 'tictactoe', label: 'Tic-Tac-Toe', icon: Award, desc: 'Classic 3x3 tactical grid' },
    { key: 'gomoku', label: 'Gomoku', icon: Trophy, desc: '15x15 Five Stones arena' },
    { key: 'memory', label: 'Memory Match', icon: Layers, desc: 'Rapid memory pair challenge' },
    { key: 'ludo', label: 'Ludo Championship', icon: Dices, desc: '4-Player classic dice race' }
  ];

  // Standard Profile Save Handler
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanName = displayName.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Display name must be at least 2 characters.');
      return;
    }

    if (cleanName.length > 25) {
      setErrorMessage('Display name cannot exceed 25 characters.');
      return;
    }

    const updated = saveUserProfile({
      ...profile,
      name: cleanName
    });

    if (onProfileUpdated) onProfileUpdated(updated);
    soundSynth.playVictory();
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Password Management Handler
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    const res = await authService.updatePassword(newPassword);
    setPasswordLoading(false);

    if (res.success) {
      soundSynth.playVictory();
      setPasswordSuccess('Password saved! You can now log in with both Google and this password.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordFormOpen(false);
        setPasswordSuccess('');
      }, 2500);
    } else {
      setPasswordError(res.error || 'Failed to update password.');
    }
  };


  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0',
      padding: '12px 0 32px 0',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>

      {/* Top Bar Navigation */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid #E4E4E7'
      }}>
        <button
          onClick={onBackToHome}
          className="btn-secondary"
          style={{
            padding: '7px 14px',
            fontSize: '13px',
            fontWeight: '700',
            gap: '6px'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Games</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isRegistered ? (
            <>
              <button
                onClick={() => onNavigateToAuth('login')}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Log In
              </button>
              <button
                onClick={() => onNavigateToAuth('signup')}
                className="btn-primary"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#DC2626',
                gap: '6px'
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Notifications */}
      {successMessage && (
        <div className="animate-pop-in" style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#16A34A',
          fontSize: '13px',
          fontWeight: '700'
        }}>
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="animate-pop-in" style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#DC2626',
          fontSize: '13px',
          fontWeight: '700'
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* 1. Hero Player Identity Banner (Left-Aligned, Full Width) */}
      <div 
        className="card-enterprise"
        style={{
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E4E4E7',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Avatar Initial */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            background: '#2563EB',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            fontWeight: '800',
            fontFamily: 'var(--font-heading)',
            flexShrink: 0
          }}>
            {profile?.name ? profile.name[0].toUpperCase() : 'G'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: '22px',
                fontWeight: '800',
                color: '#18181B',
                margin: 0,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em'
              }}>
                {profile?.name || 'Guest Player'}
              </h1>

              {/* Status Badges */}
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#F4F4F5',
                border: '1px solid #E4E4E7',
                color: '#52525B',
                fontFamily: 'var(--font-mono)'
              }}>
                {currentTier.name}
              </span>

              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                background: '#F4F4F5',
                color: '#52525B',
                border: '1px solid #E4E4E7',
                padding: '2px 8px',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)'
              }}>
                {isRegistered ? 'REGISTERED' : 'GUEST'}
              </span>

              {adminService.isAdmin(profile) && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  ADMIN
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '6px',
              fontSize: '13px',
              color: '#71717A',
              fontFamily: 'var(--font-mono)',
              flexWrap: 'wrap'
            }}>
              <span>
                Global Rating: <strong style={{ color: '#18181B' }}>{profile?.rating || 1200} ELO</strong>
              </span>
              <span>•</span>
              <span>Level {profile?.level || 1}</span>
              <span>•</span>
              <span>{profile?.dailyStreak || 0}d Daily Streak</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {adminService.isAdmin(profile) && (
            <button
              onClick={onOpenAdmin}
              className="btn-secondary"
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#2563EB',
                borderColor: '#BFDBFE',
                background: '#EFF6FF',
                gap: '6px'
              }}
            >
              <ShieldCheck size={15} color="#2563EB" />
              <span>Admin Console</span>
            </button>
          )}

          <button
            onClick={() => setIsEditing(prev => !prev)}
            className={isEditing ? 'btn-secondary' : 'btn-primary'}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              gap: '6px'
            }}
          >
            <Edit2 size={14} />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>


      {/* Inline Edit Form (When Active) */}
      {isEditing && (
        <form 
          onSubmit={handleSaveProfile} 
          className="animate-pop-in card-enterprise" 
          style={{
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E4E4E7',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box'
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#18181B', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Edit Profile
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#52525B', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                DISPLAY NAME
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={25}
                placeholder="e.g. Maverick"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #E4E4E7',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#18181B',
                  background: '#FAFAFA',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#52525B', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                ACCOUNT EMAIL
              </label>
              <input
                type="text"
                disabled
                value={profile?.email || 'Guest Account (Not registered)'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #E4E4E7',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#71717A',
                  background: '#F4F4F5',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 2. Key Performance Metrics (Left-Aligned Real-World Metric Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
        gap: '12px',
        width: '100%'
      }}>

        {/* Wins */}
        <div className="card-enterprise" style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E4E4E7',
          padding: '18px 20px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '11px', color: '#71717A', fontWeight: '700', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            TOTAL WINS
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16A34A', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            {profile?.wins || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            Victories recorded
          </div>
        </div>

        {/* Losses */}
        <div className="card-enterprise" style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E4E4E7',
          padding: '18px 20px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '11px', color: '#71717A', fontWeight: '700', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            TOTAL LOSSES
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#18181B', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            {profile?.losses || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            Defeats recorded
          </div>
        </div>

        {/* Draws */}
        <div className="card-enterprise" style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E4E4E7',
          padding: '18px 20px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '11px', color: '#71717A', fontWeight: '700', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            TOTAL DRAWS
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#18181B', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            {profile?.draws || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            Stalemate outcomes
          </div>
        </div>

        {/* Win Rate */}
        <div className="card-enterprise" style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E4E4E7',
          padding: '18px 20px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '11px', color: '#71717A', fontWeight: '700', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            CAREER WIN RATE
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#18181B', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
            {winRate}%
          </div>
          <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {totalMatches} matches played
          </div>
        </div>
      </div>

      {/* 3. Per-Game Competitive Breakdown (Left-Aligned Structured Grid) */}
      <div className="card-enterprise" style={{
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E4E4E7',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#18181B', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
              Per-Game Ratings & Performance
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717A' }}>
              Individual skill rating, match progression, and mastery levels across all five arena titles.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))',
          gap: '12px',
          width: '100%'
        }}>

          {GAME_LIST.map((g) => {
            const stats = profile?.gameStats?.[g.key] || { rating: 1200, wins: 0, losses: 0, draws: 0, level: 1 };
            const IconComp = g.icon;
            const gMatches = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
            const gWinRate = gMatches > 0 ? Math.round(((stats.wins || 0) / gMatches) * 100) : 0;

            return (
              <div 
                key={g.key} 
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #E4E4E7',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div 
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#F4F4F5',
                      border: '1px solid #E4E4E7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#18181B',
                      flexShrink: 0
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#18181B', margin: 0, fontFamily: 'var(--font-heading)' }}>
                      {g.label}
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
                      {stats.wins}W • {stats.losses}L • {stats.draws || 0}D ({gWinRate}% WR)
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#18181B', fontFamily: 'var(--font-mono)' }}>
                    {stats.rating} ELO
                  </div>
                  <div style={{ fontSize: '10px', color: '#71717A', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    Level {stats.level}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Match History Card */}
      <div className="card-enterprise" style={{
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E4E4E7',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#18181B', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Recent Match History
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717A' }}>
              Your latest competitive arena results and ELO rating adjustments.
            </p>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#71717A', fontWeight: '700' }}>
            {profile?.history?.length || 0} Matches Recorded
          </span>
        </div>

        {(!profile?.history || profile.history.length === 0) ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#FAFAFA', borderRadius: '12px', border: '1px dashed #E4E4E7' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#71717A', fontWeight: '600' }}>
              No matches recorded yet. Jump into an arena to start building your match record!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {profile.history.slice(0, 6).map((match, idx) => {
              const isWin = match.outcome === 'WIN';
              const isLoss = match.outcome === 'LOSS';
              return (
                <div
                  key={match.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#FAFAFA',
                    border: '1px solid #E4E4E7',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span
                      style={{
                        padding: '3px 7px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        fontFamily: 'var(--font-mono)',
                        background: isWin ? '#DCFCE7' : isLoss ? '#FEE2E2' : '#F4F4F5',
                        color: isWin ? '#166534' : isLoss ? '#991B1B' : '#52525B'
                      }}
                    >
                      {match.outcome}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#18181B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        vs {match.opponent || 'Opponent'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
                        {match.gameName || match.gameKey}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-mono)',
                      color: isWin ? '#16A34A' : isLoss ? '#DC2626' : '#71717A'
                    }}>
                      {match.ratingDelta > 0 ? `+${match.ratingDelta}` : match.ratingDelta} ELO
                    </div>
                    <div style={{ fontSize: '9px', color: '#A1A1AA', fontFamily: 'var(--font-mono)' }}>
                      {match.timestamp ? new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Account Security & Cloud Sync Session Card */}

      <div className="card-enterprise" style={{
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E4E4E7',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#18181B', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Account & Cloud Database Sync
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717A' }}>
              {isRegistered ? (
                <>Signed in as <strong style={{ color: '#18181B' }}>{profile?.email}</strong>. All ratings and match records are permanently saved to Supabase.</>
              ) : (
                <>You are playing as a Guest. Sign in to save your career ELO and compete on global leaderboards.</>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isRegistered ? (
              <button
                onClick={onLogout}
                className="btn-secondary"
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#DC2626',
                  borderColor: '#FECACA',
                  background: '#FEF2F2',
                  gap: '6px'
                }}
              >
                <LogOut size={14} />
                <span>Sign Out of Account</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onNavigateToAuth('login')}
                  className="btn-secondary"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigateToAuth('signup')}
                  className="btn-primary"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic In-App Password Setting for Google/OAuth Players */}
        {isRegistered && (
          <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #F4F4F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} color="#0F172A" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                    Account Password & Login Credentials
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#71717A' }}>
                  Set or update your password to sign in via Email & Password from any device.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPasswordFormOpen(prev => !prev);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  gap: '6px'
                }}
              >
                <Lock size={13} />
                <span>{isPasswordFormOpen ? 'Cancel' : 'Set / Update Password'}</span>
              </button>
            </div>

            {isPasswordFormOpen && (
              <form onSubmit={handleUpdatePassword} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
                {passwordError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 12px', color: '#DC2626', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '8px 12px', color: '#16A34A', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} style={{ flexShrink: 0 }} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>NEW PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      style={{ width: '100%', padding: '8px 36px 8px 10px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary"
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {passwordLoading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                  <span>{passwordLoading ? 'Saving...' : 'Save Password'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

