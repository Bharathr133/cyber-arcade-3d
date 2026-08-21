import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Check, X, LogOut, KeyRound, ShieldCheck, Trophy, Lock, 
  ArrowRight, UserCheck, AlertCircle, RefreshCw, UserPlus, LogIn, ChevronLeft,
  Mail, Download, Shield, Eye, EyeOff, Globe, Award, Flame, Zap, Dices, Layers, Grid
} from 'lucide-react';

import { AVATARS, saveUserProfile, getTier } from '../utils/userProfile.js';
import { authService } from '../services/authService.js';
import { validateEmail, evaluatePasswordStrength, validateGamerTag, validateDisplayName } from '../utils/validation.js';
import { soundSynth } from '../utils/soundSynth.js';

export default function ProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onLogout
}) {
  // Navigation View: 'DASHBOARD' | 'SIGNIN' | 'REGISTER' | 'SECURITY' | 'FORGOT_PASSWORD'
  const [viewMode, setViewMode] = useState('DASHBOARD');

  // Edit Profile State (Dashboard)
  const [name, setName] = useState(profile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarId || '1');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Auth Inputs (Sign In / Register / Security)
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [gamertagInput, setGamertagInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Live Password Strength
  const passwordStrength = evaluatePasswordStrength(passwordInput);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setViewMode('DASHBOARD');
      setErrorMessage('');
      setSuccessMessage('');
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setSelectedAvatar(profile.avatarId || '1');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const currentAvatar = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];
  const currentTier = getTier(profile?.rating || 1200, totalMatches);
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;
  const isRegisteredAccount = !profile?.isGuest && (profile?.email || profile?.gamertag);


  const GAME_LIST = [
    { key: 'connect4', label: 'Connect 4', icon: Grid, color: '#1e3a8a' },
    { key: 'tictactoe', label: 'Tic-Tac-Toe', icon: Award, color: '#881337' },
    { key: 'gomoku', label: 'Gomoku', icon: Trophy, color: '#0f172a' },
    { key: 'memory', label: 'Memory Match', icon: Layers, color: '#7e22ce' },
    { key: 'ludo', label: 'Ludo Championship', icon: Dices, color: '#ea580c' }
  ];

  // 1. Save Profile Changes (Display Name & Avatar)
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const validation = validateDisplayName(name);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    const updated = saveUserProfile({
      ...profile,
      name: validation.sanitizedName,
      avatarId: selectedAvatar
    });

    if (onProfileUpdated) {
      onProfileUpdated(updated);
    }

    soundSynth.playVictory();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  // 2. Sign In with Email & Password
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      let res;
      if (emailInput.includes('@')) {
        res = await authService.signInWithEmail({
          email: emailInput.trim(),
          password: passwordInput
        });
      } else {
        res = await authService.loginGamerTag({
          gamertag: emailInput.trim(),
          pin: passwordInput
        });
      }

      if (res.success && res.profile) {
        soundSynth.playVictory();
        if (onProfileUpdated) onProfileUpdated(res.profile);
        setSuccessMessage('Successfully signed in!');
        setTimeout(() => {
          setViewMode('DASHBOARD');
          onClose();
        }, 600);
      } else {
        soundSynth.playRotate();
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Create Cloud Account (with Guest Migration)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await authService.signUpWithEmail({
        email: emailInput.trim(),
        password: passwordInput,
        gamertag: gamertagInput.trim(),
        displayName: displayNameInput.trim() || gamertagInput.trim(),
        avatarId: selectedAvatar,
        guestProfileToMigrate: profile
      });

      if (res.success && res.profile) {
        soundSynth.playVictory();
        if (onProfileUpdated) onProfileUpdated(res.profile);
        setSuccessMessage('Account registered successfully! All ratings migrated.');
        setTimeout(() => {
          setViewMode('DASHBOARD');
          onClose();
        }, 800);
      } else {
        soundSynth.playRotate();
        setErrorMessage(res.error || 'Registration failed. Please check your inputs.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Google 1-Tap OAuth
  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    setErrorMessage('');
    const res = await authService.signInWithOAuth(provider);
    if (!res.success) {
      setErrorMessage(res.error || `Could not sign in with ${provider}.`);
      setLoading(false);
    }
  };

  // 5. Password Reset Request
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authService.sendPasswordResetEmail(emailInput.trim());
    setLoading(false);

    if (res.success) {
      soundSynth.playVictory();
      setSuccessMessage(res.message);
    } else {
      soundSynth.playRotate();
      setErrorMessage(res.error || 'Could not send recovery email.');
    }
  };

  // 6. GDPR Data Export
  const handleExportData = () => {
    const res = authService.exportUserData(profile);
    if (res.success) {
      soundSynth.playVictory();
      setSuccessMessage('Career data exported successfully as JSON!');
    } else {
      setErrorMessage('Export failed: ' + res.error);
    }
  };

  // 7. Update Password
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authService.updatePassword(newPasswordInput.trim());
    setLoading(false);

    if (res.success) {
      soundSynth.playVictory();
      setSuccessMessage(res.message || 'Password updated successfully!');
      setNewPasswordInput('');
    } else {
      soundSynth.playRotate();
      setErrorMessage(res.error || 'Failed to update password.');
    }
  };

  // 8. Log Out
  const handleSignOut = () => {
    if (onLogout) onLogout();
    setViewMode('DASHBOARD');
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
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(95vw, 490px)',
          maxHeight: '92dvh',
          background: '#ffffff',
          borderRadius: '24px',
          padding: 'clamp(16px, 4vw, 24px)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          border: '1.5px solid #e2e8f0',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          gap: '14px',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewMode !== 'DASHBOARD' && (
              <button
                onClick={() => {
                  setViewMode('DASHBOARD');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '8px',
                  width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#0f172a'
                }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={18} color="#0f172a" />
              <h2 style={{
                fontSize: '16px', fontWeight: '900', color: '#0f172a',
                margin: 0, fontFamily: 'var(--font-heading)'
              }}>
                {viewMode === 'DASHBOARD' && 'Player Profile & Career'}
                {viewMode === 'SIGNIN' && 'Sign In to Arena'}
                {viewMode === 'REGISTER' && 'Create Cloud Account'}
                {viewMode === 'FORGOT_PASSWORD' && 'Account Recovery'}
                {viewMode === 'SECURITY' && 'Security & Data Controls'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close-btn"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Global Alert Messages */}
        {errorMessage && (
          <div className="animate-pop-in" style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
            padding: '10px 12px', color: '#b91c1c', fontSize: '12px', fontWeight: '800',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={15} flexShrink={0} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="animate-pop-in" style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px',
            padding: '10px 12px', color: '#065f46', fontSize: '12px', fontWeight: '800',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Check size={15} flexShrink={0} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Navigation Tabs (Top Selector) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isRegisteredAccount ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: '6px',
          background: '#f8fafc',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => { setViewMode('DASHBOARD'); setErrorMessage(''); }}
            style={{
              padding: '7px 10px', borderRadius: '8px', border: 'none',
              background: viewMode === 'DASHBOARD' ? '#ffffff' : 'transparent',
              color: viewMode === 'DASHBOARD' ? '#0f172a' : '#64748b',
              fontWeight: '900', fontSize: '11px', cursor: 'pointer',
              boxShadow: viewMode === 'DASHBOARD' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Dashboard
          </button>

          {!isRegisteredAccount ? (
            <>
              <button
                onClick={() => { setViewMode('SIGNIN'); setErrorMessage(''); }}
                style={{
                  padding: '7px 10px', borderRadius: '8px', border: 'none',
                  background: viewMode === 'SIGNIN' ? '#ffffff' : 'transparent',
                  color: viewMode === 'SIGNIN' ? '#0f172a' : '#64748b',
                  fontWeight: '900', fontSize: '11px', cursor: 'pointer',
                  boxShadow: viewMode === 'SIGNIN' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setViewMode('REGISTER'); setErrorMessage(''); }}
                style={{
                  padding: '7px 10px', borderRadius: '8px', border: 'none',
                  background: viewMode === 'REGISTER' ? '#ffffff' : 'transparent',
                  color: viewMode === 'REGISTER' ? '#0f172a' : '#64748b',
                  fontWeight: '900', fontSize: '11px', cursor: 'pointer',
                  boxShadow: viewMode === 'REGISTER' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Create Account
              </button>
            </>
          ) : (
            <button
              onClick={() => { setViewMode('SECURITY'); setErrorMessage(''); }}
              style={{
                padding: '7px 10px', borderRadius: '8px', border: 'none',
                background: viewMode === 'SECURITY' ? '#ffffff' : 'transparent',
                color: viewMode === 'SECURITY' ? '#0f172a' : '#64748b',
                fontWeight: '900', fontSize: '11px', cursor: 'pointer',
                boxShadow: viewMode === 'SECURITY' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Security
            </button>
          )}
        </div>

        {/* VIEW 1: DASHBOARD */}
        {viewMode === 'DASHBOARD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* User Identity Card */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: currentAvatar.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '18px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}>
                  {name ? name[0].toUpperCase() : 'P'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                      {name || 'Player'}
                    </span>
                    <span style={{
                      fontSize: '9px', fontWeight: '900', padding: '2px 6px',
                      borderRadius: '6px', background: currentTier.color, color: '#ffffff'
                    }}>
                      {currentTier.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    <strong>{profile?.rating || 1200}</strong> ELO • Level {profile?.level || 1} • <span style={{ color: '#ea580c', fontWeight: '800' }}>🔥 {profile?.dailyStreak || 1}d Streak</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              {isRegisteredAccount ? (
                <span style={{ fontSize: '10px', fontWeight: '900', background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px' }}>
                  SYNCED
                </span>
              ) : (
                <button
                  onClick={() => setViewMode('REGISTER')}
                  style={{
                    fontSize: '10px', fontWeight: '900', background: '#0f172a', color: '#ffffff',
                    padding: '5px 9px', borderRadius: '8px', border: 'none', cursor: 'pointer'
                  }}
                >
                  Claim Cloud
                </button>
              )}
            </div>

            {/* Lifetime Career Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800' }}>WINS</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#16a34a', marginTop: '1px' }}>{profile?.wins || 0}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800' }}>LOSSES</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#dc2626', marginTop: '1px' }}>{profile?.losses || 0}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800' }}>DRAWS</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#475569', marginTop: '1px' }}>{profile?.draws || 0}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800' }}>WIN RATE</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', marginTop: '1px' }}>{winRate}%</div>
              </div>
            </div>

            {/* Per-Game Career Standings (All 5 Games) */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                PER-GAME RATINGS & STATS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {GAME_LIST.map(g => {
                  const Icon = g.icon;
                  const gStat = profile?.gameStats?.[g.key] || {};
                  const gRating = gStat.rating || 1200;
                  const gWins = gStat.wins || 0;
                  const gLosses = gStat.losses || 0;
                  return (
                    <div key={g.key} style={{
                      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                      padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon size={14} color={g.color} />
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>{g.label}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                          {gRating} ELO
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          {gWins}W • {gLosses}L
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Edit Name & Avatar Theme */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  CHANGE DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  placeholder="e.g. Maverick"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                    color: '#0f172a', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  AVATAR COLOR THEME
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                  {AVATARS.map(av => {
                    const isSelected = av.id === selectedAvatar;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.id)}
                        style={{
                          aspectRatio: '1', borderRadius: '10px', background: av.color,
                          border: isSelected ? '2.5px solid #0f172a' : '1px solid transparent',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ffffff', fontWeight: '900', fontSize: '12px', transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? <Check size={14} /> : av.name[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  padding: '11px', borderRadius: '12px',
                  background: savedSuccess ? '#16a34a' : '#0f172a', color: '#ffffff',
                  border: 'none', fontSize: '13px', fontWeight: '900', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  marginTop: '4px'
                }}
              >
                {savedSuccess ? <Check size={16} /> : <UserCheck size={16} />}
                <span>{savedSuccess ? 'Profile Saved!' : 'Save Changes'}</span>
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: SIGN IN (Gold Standard OAuth Top + Form) */}
        {viewMode === 'SIGNIN' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top 1-Tap Google OAuth */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              style={{
                width: '100%', padding: '11px', borderRadius: '12px',
                border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a',
                fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <Globe size={16} color="#2563eb" />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800' }}>OR SIGN IN WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                EMAIL ADDRESS / GAMERTAG
              </label>
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="player@example.com or @gamertag"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                  color: '#0f172a', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setViewMode('FORGOT_PASSWORD')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 36px 10px 12px', borderRadius: '10px',
                    border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                    color: '#0f172a', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', borderRadius: '12px',
                background: '#0f172a', color: '#ffffff', border: 'none',
                fontSize: '13px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '4px'
              }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <LogIn size={16} />}
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Don't have a verified account yet?{' '}
              <button
                type="button"
                onClick={() => { setViewMode('REGISTER'); setErrorMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '900', cursor: 'pointer', padding: 0 }}
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: CREATE ACCOUNT (Gold Standard OAuth Top + Full Form) */}
        {viewMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {/* Top 1-Tap Google OAuth */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              style={{
                width: '100%', padding: '11px', borderRadius: '12px',
                border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a',
                fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <Globe size={16} color="#2563eb" />
              <span>Sign Up with Google</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800' }}>OR SIGN UP WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="player@example.com"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                  color: '#0f172a', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  GAMERTAG HANDLE
                </label>
                <input
                  type="text"
                  required
                  value={gamertagInput}
                  onChange={(e) => setGamertagInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. shadow_ninja"
                  maxLength={16}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                    color: '#0f172a', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="e.g. Alex"
                  maxLength={20}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                    color: '#0f172a', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                PASSWORD (MIN 8 CHARS)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 36px 10px 12px', borderRadius: '10px',
                    border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                    color: '#0f172a', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Visual Meter */}
              {passwordInput.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        style={{
                          flex: 1,
                          background: step <= passwordStrength.score ? passwordStrength.color : '#e2e8f0',
                          borderRadius: '2px',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', color: passwordStrength.color, fontWeight: '800', marginTop: '3px' }}>
                    {passwordStrength.feedback[0] || 'Password strength'}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', borderRadius: '12px',
                background: '#0f172a', color: '#ffffff', border: 'none',
                fontSize: '13px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '4px'
              }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
              <span>{loading ? 'Creating Cloud Account...' : 'Create Account'}</span>
            </button>

            <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setViewMode('SIGNIN'); setErrorMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '900', cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: FORGOT PASSWORD */}
        {viewMode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Enter your registered account email address. We will send a secure password reset link directly to your inbox.
            </p>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>
                REGISTERED EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="player@example.com"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                  color: '#0f172a', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', borderRadius: '12px',
                background: '#0f172a', color: '#ffffff', border: 'none',
                fontSize: '13px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
              <span>{loading ? 'Sending Recovery Link...' : 'Send Recovery Email'}</span>
            </button>
          </form>
        )}

        {/* VIEW 5: SECURITY & GDPR DATA EXPORT */}
        {viewMode === 'SECURITY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Account Details */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                Account Security ID: <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>{profile?.id}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Provider: {profile?.authProvider || 'Verified Cloud'} • Status: Online
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>
                CHANGE ACCOUNT PASSWORD
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: '8px',
                    border: '1.5px solid #cbd5e1', fontSize: '12px', fontWeight: '800',
                    color: '#0f172a', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !newPasswordInput}
                  style={{
                    padding: '8px 12px', borderRadius: '8px',
                    background: '#0f172a', color: '#ffffff', border: 'none',
                    fontSize: '11px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                  }}
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>

            {/* GDPR Data Export */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Export Match Data (GDPR)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Download all your match history & career ratings as JSON</div>
              </div>
              <button
                onClick={handleExportData}
                className="btn-secondary"
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}
              >
                <Download size={13} />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Sign Out Action */}
            <button
              onClick={handleSignOut}
              style={{
                padding: '12px', borderRadius: '12px',
                background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca',
                fontSize: '13px', fontWeight: '900', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '8px'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
