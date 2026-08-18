import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Sparkles, Check, X, LogOut, KeyRound, ShieldCheck, Trophy, Lock, 
  ArrowRight, UserCheck, AlertCircle, RefreshCw, UserPlus, LogIn, ChevronLeft
} from 'lucide-react';
import { AVATARS, saveUserProfile, getTier } from '../utils/userProfile.js';
import { authService } from '../services/authService.js';
import { soundSynth } from '../utils/soundSynth.js';
import { formatErrorMessage } from '../utils/errorHandler.js';

export default function ProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onLogout
}) {
  // Navigation View: 'DASHBOARD' (View/Edit), 'LOGIN' (Sign in), 'REGISTER' (Create account)
  const [viewMode, setViewMode] = useState('DASHBOARD');

  // Edit Profile State
  const [name, setName] = useState(profile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarId || '1');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Auth Form State (Login / Register)
  const [gamertagInput, setGamertagInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setViewMode('DASHBOARD');
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setSelectedAvatar(profile.avatarId || '1');
      setErrorMessage('');
      setSavedSuccess(false);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const currentAvatar = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];
  const currentTier = getTier(profile?.rating || 1200);
  const totalMatches = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0);
  const winRate = totalMatches > 0 ? Math.round(((profile?.wins || 0) / totalMatches) * 100) : 0;
  const isRegistered = !profile?.isGuest && profile?.gamertag;

  // 1. Save Profile Changes (Display Name & Avatar)
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a valid player name.');
      return;
    }

    const updated = saveUserProfile({
      ...profile,
      name: name.trim().slice(0, 16),
      avatarId: selectedAvatar
    });

    if (onProfileUpdated) {
      onProfileUpdated(updated);
    }

    soundSynth.playVictory();
    setSavedSuccess(true);
    setErrorMessage('');
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  // 2. Sign In to Existing Account
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await authService.loginGamerTag({
        gamertag: gamertagInput.trim(),
        pin: pinInput.trim()
      });

      if (res.success && res.profile) {
        if (onProfileUpdated) onProfileUpdated(res.profile);
        soundSynth.playVictory();
        setSavedSuccess(true);
        setGamertagInput('');
        setPinInput('');
        setTimeout(() => {
          setSavedSuccess(false);
          setViewMode('DASHBOARD');
          onClose();
        }, 600);
      } else {
        const formatted = formatErrorMessage(res.error || 'Invalid credentials', 'Authentication');
        setErrorMessage(formatted.message);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Register New Permanent Account
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const cleanTag = gamertagInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanName = displayNameInput.trim() || cleanTag;

      if (cleanTag.length < 3) {
        setErrorMessage('GamerTag must be at least 3 characters.');
        setLoading(false);
        return;
      }
      if (pinInput.trim().length < 4) {
        setErrorMessage('PIN / Password must be at least 4 digits.');
        setLoading(false);
        return;
      }

      const res = await authService.registerGamerTag({
        gamertag: cleanTag,
        displayName: cleanName,
        pin: pinInput.trim(),
        avatarId: selectedAvatar
      });

      if (res.success && res.profile) {
        if (onProfileUpdated) onProfileUpdated(res.profile);
        soundSynth.playVictory();
        setSavedSuccess(true);
        setGamertagInput('');
        setPinInput('');
        setDisplayNameInput('');
        setTimeout(() => {
          setSavedSuccess(false);
          setViewMode('DASHBOARD');
          onClose();
        }, 600);
      } else {
        const formatted = formatErrorMessage(res.error || 'Failed to create account', 'Registration');
        setErrorMessage(formatted.message);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout / Switch Account
  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    soundSynth.playRotate();
    setViewMode('LOGIN');
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.82)',
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
          width: 'min(95vw, 480px)',
          maxHeight: '90dvh',
          background: '#ffffff',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
          borderRadius: '24px',
          border: '1.5px solid #e2e8f0',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: 'clamp(14px, 4vw, 24px)',
          gap: '14px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {viewMode !== 'DASHBOARD' && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setViewMode('DASHBOARD');
                }}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: '#f1f5f9', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0f172a', cursor: 'pointer'
                }}
                title="Back to Dashboard"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: '#0f172a', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {viewMode === 'LOGIN' ? <LogIn size={18} /> : viewMode === 'REGISTER' ? <UserPlus size={18} /> : <User size={18} />}
            </div>

            <div>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: '900',
                color: '#0f172a',
                margin: 0
              }}>
                {viewMode === 'LOGIN' ? 'SIGN IN' : viewMode === 'REGISTER' ? 'CREATE ACCOUNT' : 'PLAYER PROFILE'}
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                {viewMode === 'LOGIN' ? 'Access your cloud ranking & records' : viewMode === 'REGISTER' ? 'Register your permanent GamerTag' : 'Manage your identity and theme'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#f1f5f9', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#b91c1c',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: PLAYER PROFILE DASHBOARD (VIEW / EDIT IDENTITY) */}
        {/* ======================================================== */}
        {viewMode === 'DASHBOARD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Player Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Selected Avatar Preview */}
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '12px',
                    background: currentAvatar.color, color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: '18px',
                    boxShadow: `0 0 12px ${currentAvatar.color}99`
                  }}>
                    {name ? name[0].toUpperCase() : 'P'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900' }}>
                        {name || 'Player'}
                      </span>
                      {isRegistered ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          fontSize: '9px', fontWeight: '900', padding: '1px 5px',
                          borderRadius: '4px', background: '#38bdf8', color: '#0f172a',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <ShieldCheck size={10} />
                          @{profile.gamertag}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '9px', fontWeight: '800', padding: '1px 5px',
                          borderRadius: '4px', background: 'rgba(255, 255, 255, 0.15)', color: '#94a3b8',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          GUEST
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      <strong style={{ color: '#38bdf8' }}>{profile?.rating || 1200}</strong> ELO • {currentTier.name} ({currentTier.badge})
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#38bdf8' }}>
                    Level {profile?.level || 1}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {winRate}% Win Rate
                  </div>
                </div>
              </div>

              {/* Competitive Lifetime Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '10px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)'
              }}>
                <div>
                  <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>MATCHES</span>
                  <span style={{ fontSize: '12px', fontWeight: '900' }}>{totalMatches}</span>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#86efac', display: 'block' }}>WINS</span>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#4ade80' }}>{profile?.wins || 0}</span>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#fca5a5', display: 'block' }}>LOSSES</span>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#f87171' }}>{profile?.losses || 0}</span>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>DRAWS</span>
                  <span style={{ fontSize: '12px', fontWeight: '900' }}>{profile?.draws || 0}</span>
                </div>
              </div>
            </div>

            {/* Profile Customizer Form */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  PLAYER DISPLAY NAME
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your GamerTag / Name..."
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '10px',
                    border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc'
                  }}
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  CHOOSE AVATAR THEME
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '6px' }}>
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '10px',
                        background: selectedAvatar === av.id ? '#0f172a' : '#f8fafc',
                        color: selectedAvatar === av.id ? '#ffffff' : '#0f172a',
                        border: selectedAvatar === av.id ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}
                    >
                      <span style={{
                        width: '14px', height: '14px', borderRadius: '4px',
                        background: av.color, flexShrink: 0
                      }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Save Changes Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: savedSuccess ? '#16a34a' : '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.15s ease'
                }}
              >
                {savedSuccess ? <Check size={16} /> : <Sparkles size={16} />}
                <span>{savedSuccess ? 'SAVED SUCCESSFULLY' : 'SAVE PROFILE CHANGES'}</span>
              </button>
            </form>

            {/* Account Status & Action Bar */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                  {isRegistered ? `Signed in as @${profile.gamertag}` : 'Playing as Guest'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  {isRegistered ? 'Cloud sync and rankings active' : 'Sign in to sync your ratings across devices'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {isRegistered ? (
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#b91c1c',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <LogOut size={12} />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setViewMode('LOGIN');
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#0f172a',
                        cursor: 'pointer'
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setViewMode('REGISTER');
                      }}
                      style={{
                        background: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: SIGN IN (LOGIN TO EXISTING ACCOUNT)              */}
        {/* ======================================================== */}
        {viewMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                GAMERTAG / USERNAME
              </label>
              <input
                type="text"
                value={gamertagInput}
                onChange={(e) => setGamertagInput(e.target.value)}
                placeholder="e.g. bharath"
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                  color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                SECRET PIN / PASSWORD
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                maxLength={8}
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '800',
                  color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px'
              }}
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <LogIn size={15} />}
              <span>{loading ? 'SIGNING IN...' : 'SIGN IN TO ACCOUNT'}</span>
            </button>

            {/* Toggle Link */}
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setViewMode('REGISTER');
                }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '800', cursor: 'pointer', padding: 0 }}
              >
                Create one now
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: CREATE ACCOUNT (REGISTER NEW PERMANENT ACCOUNT)  */}
        {/* ======================================================== */}
        {viewMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                CHOOSE GAMERTAG / HANDLE
              </label>
              <input
                type="text"
                value={gamertagInput}
                onChange={(e) => setGamertagInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. bharath_king"
                maxLength={16}
                required
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                  color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                }}
                autoFocus
              />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '3px' }}>
                Letters, numbers, and underscores (3–16 characters)
              </span>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                DISPLAY NAME (OPTIONAL)
              </label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Your Public In-Game Name"
                maxLength={18}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800',
                  color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                CREATE 4-DIGIT PIN / PASSWORD
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                maxLength={8}
                required
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '800',
                  color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px'
              }}
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <UserPlus size={15} />}
              <span>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & SYNC PROGRESS'}</span>
            </button>

            {/* Toggle Link */}
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setViewMode('LOGIN');
                }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '800', cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
