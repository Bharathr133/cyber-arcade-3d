import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, ArrowRight, X, Shield } from 'lucide-react';
import { AVATARS, saveUserProfile } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';

export default function GuestNamePromptModal({
  isOpen,
  onClose,
  currentUserProfile,
  onNameSaved
}) {
  const [nameInput, setNameInput] = useState(() => {
    return currentUserProfile?.hasCustomName && currentUserProfile?.name !== 'Guest Player' 
      ? currentUserProfile.name 
      : '';
  });
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentUserProfile?.avatarId || '1');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please enter at least 2 characters.');
      return;
    }
    if (cleanName.length > 20) {
      setError('Name cannot exceed 20 characters.');
      return;
    }

    soundSynth.playVictory();

    const updated = saveUserProfile({
      ...currentUserProfile,
      name: cleanName,
      avatarId: selectedAvatarId,
      hasCustomName: true,
      isGuest: true,
      isRegistered: false
    });

    if (onNameSaved && updated) {
      onNameSaved(updated);
    } else {
      onClose();
    }
  };


  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(100%, 400px)',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: '#2563EB', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Enter Your Player Name
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontFamily: 'var(--font-body)' }}>
                Your display name in active games
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#94A3B8',
              cursor: 'pointer', padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              YOUR NAME
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setError('');
              }}
              maxLength={20}
              placeholder="Enter your name"
              autoFocus
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: error ? '1.5px solid #DC2626' : '1.5px solid #E2E8F0',
                fontSize: '14px',
                fontWeight: '700',
                color: '#0F172A',
                outline: 'none',
                background: '#F8FAFC',
                boxSizing: 'border-box'
              }}
            />
            {error && (
              <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                {error}
              </span>
            )}
          </div>


          {/* Avatar Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              CHOOSE AVATAR COLOR
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(av.id)}
                  style={{
                    height: '36px',
                    borderRadius: '8px',
                    background: av.color,
                    color: '#FFFFFF',
                    border: selectedAvatarId === av.id ? '2.5px solid #0F172A' : 'none',
                    fontSize: '13px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: selectedAvatarId === av.id ? '0 0 0 2px #3B82F6' : 'none'
                  }}
                >
                  {nameInput ? nameInput[0].toUpperCase() : 'P'}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Storage Note */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={14} color="#64748B" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.3' }}>
              Guest scores are saved locally on this browser. Create an account anytime to rank on the Global Leaderboard.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '800',
              gap: '8px'
            }}
          >
            <span>Continue to Match</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
