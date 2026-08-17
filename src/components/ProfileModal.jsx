import React, { useState } from 'react';
import { User, X, Check, Award, History, Sparkles, LogOut, Shield } from 'lucide-react';
import { AVATARS, getTier, saveUserProfile } from '../utils/userProfile.js';

export default function ProfileModal({ isOpen, onClose, profile, onProfileUpdated, onLogout }) {
  const [name, setName] = useState(profile?.name || 'Champion Player');
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile?.avatarId || '1');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !profile) return null;

  const currentTier = getTier(profile.rating || 1200);
  const xpNeeded = (profile.level || 1) * 100;
  const currentXp = profile.xp || 0;
  const xpPercentage = Math.min(100, Math.round((currentXp / xpNeeded) * 100));

  const handleSave = () => {
    const updated = {
      ...profile,
      name: name.trim() || 'Champion Player',
      avatarId: selectedAvatarId
    };
    saveUserProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="card-enterprise animate-pop-in" style={{
        width: 'min(94vw, 540px)',
        maxHeight: '90vh',
        padding: 'clamp(18px, 4vw, 32px)',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: '20px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <User size={22} color="#2563eb" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              PLAYER PROFILE
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
              Identity & Career Performance
            </span>
          </div>
        </div>

        {/* Rank & Level Banner */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: `${currentTier.color}15`,
                border: `1.5px solid ${currentTier.color}`,
                color: currentTier.color,
                fontFamily: 'var(--font-heading)',
                fontSize: '12px',
                fontWeight: '900'
              }}>
                {currentTier.badge}
              </div>

              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  {profile.rating || 1200} ELO
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                  • Level {profile.level || 1}
                </span>
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
              W: <span style={{ color: '#16a34a' }}>{profile.wins || 0}</span> | L: <span style={{ color: '#f43f5e' }}>{profile.losses || 0}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>
              <span>LEVEL {profile.level || 1}</span>
              <span>{currentXp} / {xpNeeded} XP ({xpPercentage}%)</span>
            </div>
            <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${xpPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Player Name Input */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            PLAYER NAME
          </label>
          <input
            type="text"
            maxLength={18}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontFamily: 'var(--font-heading)',
              fontSize: '14px',
              fontWeight: '700',
              color: '#0f172a',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
          />
        </div>

        {/* Avatar Picker */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            AVATAR STYLE
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            {AVATARS.map((av) => {
              const isSelected = selectedAvatarId === av.id;

              return (
                <div
                  key={av.id}
                  onClick={() => setSelectedAvatarId(av.id)}
                  style={{
                    background: av.bg,
                    border: isSelected ? `2.5px solid ${av.color}` : '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isSelected ? `0 4px 12px ${av.color}30` : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '900'
                  }}>
                    {av.name[0]}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#0f172a', fontWeight: '700' }}>
                    {av.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Match History */}
        {profile.history && profile.history.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <History size={14} color="#64748b" />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                RECENT MATCHES
              </span>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              maxHeight: '130px', overflowY: 'auto', paddingRight: '4px'
            }}>
              {profile.history.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '2px 6px', borderRadius: '4px',
                      background: m.outcome === 'WIN' ? '#dcfce7' : m.outcome === 'LOSS' ? '#fee2e2' : '#f1f5f9',
                      color: m.outcome === 'WIN' ? '#16a34a' : m.outcome === 'LOSS' ? '#dc2626' : '#64748b',
                      fontWeight: '800'
                    }}>
                      {m.outcome}
                    </span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{m.game}</span>
                    <span style={{ color: '#64748b' }}>vs {m.opponent}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontWeight: '800',
                      color: m.ratingDelta > 0 ? '#16a34a' : m.ratingDelta < 0 ? '#dc2626' : '#64748b'
                    }}>
                      {m.ratingDelta > 0 ? `+${m.ratingDelta}` : m.ratingDelta}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={onLogout}
            style={{ padding: '9px 14px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5' }}
          >
            <LogOut size={14} color="#dc2626" />
            <span>SWITCH PLAYER</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-secondary"
              onClick={onClose}
              style={{ padding: '9px 16px' }}
            >
              CANCEL
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              style={{ padding: '9px 22px' }}
            >
              {savedSuccess ? <Check size={16} /> : <Sparkles size={16} />}
              <span>{savedSuccess ? 'SAVED' : 'SAVE PROFILE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
