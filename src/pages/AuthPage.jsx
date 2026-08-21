import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Lock, User, Check, AlertCircle, RefreshCw, Eye, EyeOff, Send, Inbox, ShieldCheck, ExternalLink
} from 'lucide-react';

import { authService } from '../services/authService.js';
import { soundSynth } from '../utils/soundSynth.js';
import { evaluatePasswordStrength, validateEmail } from '../utils/validation.js';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

export default function AuthPage({
  initialMode = 'login', // 'login' | 'signup' | 'forgot' | 'verify'
  onProfileUpdated,
  onBackToHome
}) {
  const [mode, setMode] = useState(initialMode);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [suggestGoogle, setSuggestGoogle] = useState(false);

  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setSuggestGoogle(false);
  }, [mode]);


  // Resend Cooldown Timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Password strength check
  const passwordStrength = evaluatePasswordStrength(passwordInput);
  const passwordsMatch = mode === 'signup' ? (passwordInput && passwordInput === confirmPasswordInput) : true;

  // Google OAuth Login
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setGoogleLoading(true);

    const res = await authService.signInWithGoogle();
    if (!res.success) {
      setGoogleLoading(false);
      setErrorMessage(res.error || 'Failed to initialize Google Sign-In.');
    }
  };

  // Resend Email Verification Handler
  const handleResendVerification = async (targetEmail) => {
    const emailToUse = targetEmail || emailInput || pendingVerificationEmail;
    if (!emailToUse) return;

    setResendLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await authService.resendVerificationEmail(emailToUse);
    setResendLoading(false);

    if (res.success) {
      setSuccessMessage('Verification link resent! Please check your email.');
      setResendCooldown(60);
    } else {
      setErrorMessage(res.error || 'Failed to resend verification email.');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSuggestGoogle(false);

    if (mode === 'signup') {
      if (passwordInput !== confirmPasswordInput) {
        setErrorMessage('Passwords do not match. Please verify your confirmation password.');
        return;
      }
      if (passwordInput.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await authService.signUpWithEmail({
          email: emailInput,
          password: passwordInput,
          name: nameInput
        });

        setLoading(false);
        if (res.success) {
          soundSynth.playVictory();
          if (res.requiresVerification) {
            setPendingVerificationEmail(res.email || emailInput);
            setMode('verify');
          } else {
            if (res.profile && onProfileUpdated) {
              onProfileUpdated(res.profile);
            }
            setSuccessMessage(res.message || 'Account created successfully!');
            setTimeout(() => onBackToHome(), 1200);
          }
        } else {
          if (res.suggestGoogle || res.alreadyRegistered) {
            setSuggestGoogle(true);
          }
          setErrorMessage(res.error || 'Sign up failed.');
        }
      } else if (mode === 'login') {
        const res = await authService.signInWithEmail({
          email: emailInput,
          password: passwordInput
        });

        setLoading(false);
        if (res.success) {
          soundSynth.playVictory();
          if (res.profile && onProfileUpdated) {
            onProfileUpdated(res.profile);
          }
          setSuccessMessage('Welcome back! Loading your profile...');
          setTimeout(() => onBackToHome(), 800);
        } else {
          if (res.unconfirmed) {
            setPendingVerificationEmail(res.email || emailInput);
          }
          if (res.suggestGoogle) {
            setSuggestGoogle(true);
          }
          setErrorMessage(res.error || 'Invalid email or password.');
        }
      } else if (mode === 'forgot') {
        const res = await authService.sendPasswordResetEmail(emailInput);
        setLoading(false);
        if (res.success) {
          soundSynth.playVictory();
          setSuccessMessage(res.message || 'Password reset link sent to your email.');
        } else {
          setErrorMessage(res.error || 'Failed to send reset link.');
        }
      } else if (mode === 'reset') {
        if (passwordInput !== confirmPasswordInput) {
          setLoading(false);
          setErrorMessage('Passwords do not match. Please verify your confirmation password.');
          return;
        }
        if (passwordInput.length < 6) {
          setLoading(false);
          setErrorMessage('Password must be at least 6 characters.');
          return;
        }
        const res = await authService.updatePassword(passwordInput);
        setLoading(false);
        if (res.success) {
          soundSynth.playVictory();
          setSuccessMessage('Password updated successfully! You can now sign in using either Google or your new password.');
          setTimeout(() => {
            setMode('login');
            setPasswordInput('');
            setConfirmPasswordInput('');
          }, 2000);
        } else {
          setErrorMessage(res.error || 'Failed to update password.');
        }
      }

    } catch (err) {
      setLoading(false);
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    }

  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>

      <div 
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(100%, 440px)',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '24px',
          padding: 'clamp(20px, 4vw, 32px)',
          boxShadow: '0 10px 35px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxSizing: 'border-box'
        }}
      >
        {/* Back Button & Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onBackToHome}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: '900',
            color: '#0F172A',
            letterSpacing: '-0.02em'
          }}>
            games4u
          </span>
        </div>

        {/* 1. TOP SEGMENTED TABS (Sign In / Create Account) */}
        {mode !== 'verify' && mode !== 'forgot' && mode !== 'reset' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '14px',
            gap: '4px'
          }}>

            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                padding: '10px 0',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'login' ? '#FFFFFF' : 'transparent',
                color: mode === 'login' ? '#0F172A' : '#64748B',
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: mode === 'login' ? '800' : '600',
                boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setMode('signup')}
              style={{
                padding: '10px 0',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'signup' ? '#FFFFFF' : 'transparent',
                color: mode === 'signup' ? '#0F172A' : '#64748B',
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: mode === 'signup' ? '800' : '600',
                boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* 2. EMAIL VERIFICATION INBOX SCREEN */}
        {mode === 'verify' ? (
          <div className="animate-pop-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '22px',
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: '#2563EB',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.18)'
            }}>
              <Inbox size={34} />
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: '0 0 6px 0' }}>
                Check Your Inbox
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                We sent an activation link to: <br />
                <strong style={{ color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{pendingVerificationEmail || emailInput}</strong>
              </p>
            </div>

            {/* Quick Mail App Openers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: 'none',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Open Gmail</span>
                <ExternalLink size={12} color="#64748B" />
              </a>

              <a
                href="https://outlook.live.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: 'none',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Open Outlook</span>
                <ExternalLink size={12} color="#64748B" />
              </a>
            </div>

            {/* Resend Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => handleResendVerification(pendingVerificationEmail)}
                disabled={resendLoading || resendCooldown > 0}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {resendLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>
                  {resendCooldown > 0 
                    ? `Resend Link in ${resendCooldown}s` 
                    : 'Resend Verification Link'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '800'
                }}
              >
                Sign In to Account
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: '900',
                color: '#0F172A',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Player Profile'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'reset' && 'Set New Password'}
              </h1>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: '#64748B',
                margin: '3px 0 0 0'
              }}>
                {mode === 'login' && 'Sign in to access your ratings, ranks, and match records.'}
                {mode === 'signup' && 'Play with a certified ELO rating and save stats across devices.'}
                {mode === 'forgot' && "Enter your email and we'll send a recovery link."}
                {mode === 'reset' && 'Create a password for your account to enable email and password sign-in.'}
              </p>

            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="animate-pop-in" style={{
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
                borderRadius: '12px',
                padding: '12px 14px',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>

                {pendingVerificationEmail && (
                  <button
                    type="button"

                    onClick={() => handleResendVerification(pendingVerificationEmail)}
                    disabled={resendLoading || resendCooldown > 0}
                    style={{
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      alignSelf: 'flex-start'
                    }}
                  >
                    {resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Verification Email'}
                  </button>
                )}
              </div>
            )}


            {successMessage && (
              <div className="animate-pop-in" style={{
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: '12px',
                padding: '12px 14px',
                color: '#16A34A',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={16} style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 3. 1-Click Google OAuth Button */}
            {mode !== 'forgot' && mode !== 'reset' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0'
                  }}
                >
                  <GoogleIcon />
                  <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>

                {/* Divider */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '0'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                    OR EMAIL & PASSWORD
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                </div>
              </>
            )}

            {/* 4. Form Fields */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                    PLAYER USERNAME / GAMERTAG
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Grandmaster99"
                      maxLength={20}
                      minLength={2}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #E2E8F0',
                        background: '#FAFAFA',
                        fontSize: '13px',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {mode !== 'reset' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                    REAL EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #E2E8F0',
                        background: '#FAFAFA',
                        fontSize: '13px',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {mode !== 'forgot' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                      {mode === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={mode === 'reset' ? 'Create new password (min. 6 chars)' : 'Min. 6 characters'}
                      minLength={6}
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #E2E8F0',
                        background: '#FAFAFA',
                        fontSize: '13px',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password Field for Sign Up and Reset Password */}
              {(mode === 'signup' || mode === 'reset') && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                    {mode === 'reset' ? 'CONFIRM NEW PASSWORD' : 'CONFIRM PASSWORD'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder={mode === 'reset' ? 'Confirm your new password' : 'Re-enter password'}
                      minLength={6}
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 38px',
                        borderRadius: '10px',
                        border: confirmPasswordInput && !passwordsMatch ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                        background: '#FAFAFA',
                        fontSize: '13px',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPasswordInput && !passwordsMatch && (
                    <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700', marginTop: '3px', display: 'block' }}>
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || ((mode === 'signup' || mode === 'reset') && confirmPasswordInput && !passwordsMatch)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '800',
                  marginTop: '4px',
                  cursor: 'pointer'
                }}
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : mode === 'login' ? (
                  'Sign In'
                ) : mode === 'signup' ? (
                  'Create & Verify Account'
                ) : mode === 'forgot' ? (
                  'Send Reset Link'
                ) : (
                  'Save New Password'
                )}
              </button>
            </form>

            {/* Forgot / Reset Mode Switch Back */}
            {(mode === 'forgot' || mode === 'reset') && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontWeight: '800',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}


