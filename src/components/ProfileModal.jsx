import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Sparkles, Check, X, LogOut } from 'lucide-react';
import { AVATARS, saveUserProfile, getTier } from '../utils/userProfile.js';

export default function ProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onLogout
}) {
  const [name, setName] = useState(profile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarId || '1');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setSelectedAvatar(profile.avatarId || '1');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const currentTier = getTier(profile?.rating || 1200);

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = saveUserProfile({
      name: name.trim(),
      avatarId: selectedAvatar
    });

    if (onProfileUpdated) {
      onProfileUpdated(updated);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          width: 'min(92vw, 460px)',
          maxHeight: '90vh',
          padding: 'clamp(24px, 5vw, 32px)',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxSizing: 'border-box',
          margin: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #cbd5e1'
          }}>
            <User size={22} color="#0f172a" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              PLAYER PROFILE
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
              Customization & Career Ranking
            </span>
          </div>
        </div>

        {/* Rating & Tier Card */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
              CURRENT COMPETITIVE TIER
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: '900',
                color: currentTier.color
              }}>
                {currentTier.name}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '900',
                padding: '2px 6px',
                borderRadius: '6px',
                background: `${currentTier.color}15`,
                color: currentTier.color,
                border: `1px solid ${currentTier.color}30`
              }}>
                {currentTier.badge}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
              RATING & LEVEL
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
              {profile?.rating || 1200} ELO • Lv. {profile?.level || 1}
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name Field */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: '800',
              color: '#334155',
              marginBottom: '6px'
            }}>
              DISPLAY NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="Enter your name"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: '800',
              color: '#334155',
              marginBottom: '8px'
            }}>
              SELECT BADGE COLOR
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: '12px',
                      background: av.color,
                      border: isSelected ? '3px solid #0f172a' : '1px solid transparent',
                      color: '#ffffff',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '14px',
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 12px rgba(15, 23, 42, 0.4)' : 'none',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {name ? name[0].toUpperCase() : 'P'}
                  </button>
                );
              })}
            </div>
          </div>

            {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '800',
                minHeight: '44px'
              }}
            >
              {savedSuccess ? <Check size={16} /> : <Sparkles size={16} />}
              <span>{savedSuccess ? 'SAVED SUCCESSFULLY!' : 'SAVE PROFILE'}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#991b1b',
                  borderColor: '#fecaca',
                  minHeight: '38px'
                }}
              >
                <LogOut size={14} />
                <span>SWITCH / LOGOUT PROFILE</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
