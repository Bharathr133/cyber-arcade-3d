import React, { useState } from 'react';
import { Zap, ArrowRight, Sparkles, Users } from 'lucide-react';
import { AVATARS, saveUserProfile } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';

export default function WelcomeLoginScreen({ onLoginSuccess, existingProfile, isInvited = false }) {
  const [name, setName] = useState(existingProfile?.name || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(existingProfile?.avatarId || '1');
  const [error, setError] = useState('');

  const selectedAvatar = AVATARS.find(a => a.id === selectedAvatarId) || AVATARS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your player name to continue.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Player name must be at least 2 characters.');
      return;
    }

    soundSynth.playVictory();

    const profileData = {
      ...(existingProfile || {}),
      id: existingProfile?.id || `user_${Math.floor(1000 + Math.random() * 9000)}`,
      name: trimmedName,
      avatarId: selectedAvatarId,
      level: existingProfile?.level || 1,
      xp: existingProfile?.xp || 0,
      rating: existingProfile?.rating || 1200,
      wins: existingProfile?.wins || 0,
      losses: existingProfile?.losses || 0,
      draws: existingProfile?.draws || 0,
      history: existingProfile?.history || [],
      isRegistered: true
    };

    saveUserProfile(profileData);
    onLoginSuccess(profileData);
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card-enterprise animate-pop-in" style={{
        width: '460px',
        padding: '36px 30px',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: '24px',
        border: '1.5px solid #e2e8f0',
        textAlign: 'center'
      }}>
        {/* Brand / Invite Icon */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: '#0f172a',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
          marginBottom: '16px'
        }}>
          {isInvited ? <Users size={24} /> : <Zap size={24} />}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '22px',
          fontWeight: '900',
          color: '#0f172a',
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0'
        }}>
          {isInvited ? "YOU'RE INVITED TO PLAY" : 'WELCOME TO THE ARENA'}
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: '#64748b',
          margin: '0 0 22px 0',
          lineHeight: 1.5
        }}>
          {isInvited
            ? 'Enter your name to join your friend in the live match.'
            : 'Set up your player profile to compete in strategy games.'}
        </p>

        {/* Selected Avatar Live Preview */}
        <div style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '18px',
          padding: '10px 20px',
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: selectedAvatar.color, color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '900',
            boxShadow: `0 4px 14px ${selectedAvatar.color}35`,
            marginBottom: '6px'
          }}>
            {name ? name[0].toUpperCase() : selectedAvatar.name[0]}
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#0f172a'
          }}>
            {name.trim() || 'Your Name'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
            {selectedAvatar.name} Style
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {/* Player Name Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '6px'
            }}>
              ENTER YOUR NAME
            </label>
            <input
              type="text"
              maxLength={18}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Alex"
              autoFocus
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '12px',
                border: error ? '2px solid #991b1b' : '1.5px solid #cbd5e1',
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                background: '#ffffff',
                boxShadow: 'var(--shadow-xs)',
                transition: 'border-color 0.15s ease'
              }}
            />
            {error && (
              <span style={{ display: 'block', color: '#991b1b', fontFamily: 'var(--font-body)', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                {error}
              </span>
            )}
          </div>

          {/* Avatar Color Picker */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              CHOOSE AVATAR STYLE
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {AVATARS.map((av) => {
                const isSelected = selectedAvatarId === av.id;

                return (
                  <button
                    type="button"
                    key={av.id}
                    onClick={() => setSelectedAvatarId(av.id)}
                    style={{
                      background: av.bg,
                      border: isSelected ? `2.5px solid ${av.color}` : '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                      boxShadow: isSelected ? `0 4px 12px ${av.color}25` : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: '900'
                    }}>
                      {av.name[0]}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#0f172a', fontWeight: '700' }}>
                      {av.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '800',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{isInvited ? 'JOIN MATCH' : 'ENTER THE ARENA'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
