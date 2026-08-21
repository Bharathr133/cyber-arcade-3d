import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, User, ArrowRight, X, Swords } from 'lucide-react';
import { AVATARS } from '../utils/userProfile.js';
import { soundSynth } from '../utils/soundSynth.js';

export default function LocalPlayersSetupModal({
  isOpen,
  gameId = 'connect4',
  gameTitle = 'Connect 4',
  currentUserProfile,
  onClose,
  onStartMatch
}) {
  const isLudo = gameId === 'ludo';

  const [p1Name, setP1Name] = useState(() => currentUserProfile?.name || '');
  const [p2Name, setP2Name] = useState('');
  const [p3Name, setP3Name] = useState('');
  const [p4Name, setP4Name] = useState('');
  const [playerCount, setPlayerCount] = useState(2); // 2, 3, 4 for Ludo
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanP1 = p1Name.trim();
    const cleanP2 = p2Name.trim();
    const cleanP3 = p3Name.trim();
    const cleanP4 = p4Name.trim();

    if (!cleanP1 || cleanP1.length < 2) {
      setError('Please enter Player 1 name (at least 2 characters).');
      return;
    }
    if (!cleanP2 || cleanP2.length < 2) {
      setError('Please enter Player 2 name (at least 2 characters).');
      return;
    }
    if (cleanP1.toLowerCase() === cleanP2.toLowerCase()) {
      setError('Player 1 and Player 2 must have different names.');
      return;
    }

    if (isLudo && playerCount >= 3 && (!cleanP3 || cleanP3.length < 2)) {
      setError('Please enter Player 3 name.');
      return;
    }
    if (isLudo && playerCount >= 4 && (!cleanP4 || cleanP4.length < 2)) {
      setError('Please enter Player 4 name.');
      return;
    }

    soundSynth.playVictory();

    const playerNames = {
      p1: cleanP1,
      p2: cleanP2,
      p3: cleanP3,
      p4: cleanP4,
      count: isLudo ? playerCount : 2
    };

    try {
      sessionStorage.setItem('arcade_local_players', JSON.stringify(playerNames));
    } catch (err) {}

    if (onStartMatch) {
      onStartMatch(playerNames);
    }
    onClose();
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
          width: 'min(100%, 420px)',
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
              <Swords size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Local 2-Player Setup
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontFamily: 'var(--font-body)' }}>
                {gameTitle} • Enter players sitting together
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

        {/* Ludo Player Count Selector */}
        {isLudo && (
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              NUMBER OF LOCAL PLAYERS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPlayerCount(num)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: playerCount === num ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    background: playerCount === num ? '#EFF6FF' : '#F8FAFC',
                    color: playerCount === num ? '#2563EB' : '#475569',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  {num} Players
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Player 1 (Red / Cross / Black) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
              <span>PLAYER 1 NAME</span>
            </label>
            <input
              type="text"
              value={p1Name}
              onChange={(e) => {
                setP1Name(e.target.value);
                setError('');
              }}
              maxLength={18}
              placeholder="e.g. Your Name"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #E2E8F0',
                fontSize: '13px',
                fontWeight: '700',
                color: '#0F172A',
                outline: 'none',
                background: '#F8FAFC',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Player 2 (Yellow / Circle / White) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EAB308' }} />
              <span>PLAYER 2 NAME</span>
            </label>
            <input
              type="text"
              value={p2Name}
              onChange={(e) => {
                setP2Name(e.target.value);
                setError('');
              }}
              maxLength={18}
              placeholder="e.g. Friend's Name"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #E2E8F0',
                fontSize: '13px',
                fontWeight: '700',
                color: '#0F172A',
                outline: 'none',
                background: '#F8FAFC',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Optional Player 3 (Ludo) */}
          {isLudo && playerCount >= 3 && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }} />
                <span>PLAYER 3 NAME</span>
              </label>
              <input
                type="text"
                value={p3Name}
                onChange={(e) => {
                  setP3Name(e.target.value);
                  setError('');
                }}
                maxLength={18}
                placeholder="e.g. Third Player"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#0F172A',
                  outline: 'none',
                  background: '#F8FAFC',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Optional Player 4 (Ludo) */}
          {isLudo && playerCount >= 4 && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />
                <span>PLAYER 4 NAME</span>
              </label>
              <input
                type="text"
                value={p4Name}
                onChange={(e) => {
                  setP4Name(e.target.value);
                  setError('');
                }}
                maxLength={18}
                placeholder="e.g. Fourth Player"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#0F172A',
                  outline: 'none',
                  background: '#F8FAFC',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {error && (
            <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '600', display: 'block' }}>
              {error}
            </span>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '800',
              marginTop: '4px',
              gap: '8px'
            }}
          >
            <span>Start 2-Player Match</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
