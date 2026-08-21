import React, { useState } from 'react';
import { 
  Zap, Bot, Users, Lock, ArrowRight, Play, Settings2, Clock, Check
} from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';
import { saveUserProfile } from '../utils/userProfile.js';

export default function SidebarGameOptionsPanel({
  game,
  profile,
  onLaunch,
  onClose
}) {
  const isGuestWithoutName = (!profile?.hasCustomName || profile?.name === 'Guest Player') && !profile?.email;
  
  const [selectedMode, setSelectedMode] = useState('ONLINE_MATCH'); // 'ONLINE_MATCH' | 'VS_COMPUTER' | 'LOCAL_2P' | 'PRIVATE_ROOM'
  const [turnTimer, setTurnTimer] = useState(30); // 15, 30, 60
  const [aiDifficulty, setAiDifficulty] = useState('HARD'); // 'EASY' | 'MEDIUM' | 'HARD'
  const [playerNameInput, setPlayerNameInput] = useState(() => (profile?.hasCustomName && profile?.name !== 'Guest Player') ? profile.name : '');
  const [p2NameInput, setP2NameInput] = useState('');
  const [error, setError] = useState('');

  const isMemory = game.id === 'memory';
  const isLudo = game.id === 'ludo';

  const handleStart = (e) => {
    e.preventDefault();
    setError('');

    let currentName = profile?.name;

    // If new/guest user, validate their entered name
    if (isGuestWithoutName || !profile?.hasCustomName) {
      const clean = playerNameInput.trim();
      if (!clean || clean.length < 2) {
        setError('Please enter your name (min 2 chars).');
        return;
      }
      const saved = saveUserProfile({
        ...profile,
        name: clean,
        hasCustomName: true,
        isGuest: true,
        isRegistered: false
      });
      currentName = clean;
    }

    // If local 2P, check Player 2 name
    let localNames = null;
    if (selectedMode === 'LOCAL_2P' || selectedMode === 'LOCAL_4P') {
      const cleanP2 = p2NameInput.trim() || 'Friend';
      localNames = {
        p1: currentName,
        p2: cleanP2,
        count: isLudo ? 4 : 2
      };

      try {
        sessionStorage.setItem('arcade_local_players', JSON.stringify(localNames));
      } catch (err) {}
    }

    soundSynth.playVictory();

    if (onLaunch) {
      onLaunch({
        gameId: game.id,
        gameTitle: game.title,
        mode: selectedMode,
        settings: {
          turnTimeLimit: turnTimer,
          aiDifficulty
        },
        localPlayerNames: localNames
      });
    }
  };

  return (
    <div 
      className="animate-pop-in"
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #2563EB',
        borderRadius: '12px',
        padding: '10px',
        margin: '4px 0 6px',
        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Title & Mode Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Settings2 size={12} color="#2563EB" />
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
            {game.title} Launch Setup
          </span>
        </div>
        <span style={{ fontSize: '9px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', padding: '1px 5px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
          DIRECT
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div>
        <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          SELECT MATCH MODE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMemory ? '1fr 1fr 1fr' : 'repeat(4, 1fr)', gap: '3px' }}>
          {!isMemory && (
            <button
              type="button"
              onClick={() => { soundSynth.playClick(); setSelectedMode('ONLINE_MATCH'); }}
              style={{
                padding: '5px 2px', borderRadius: '6px', fontSize: '9px', fontWeight: '800',
                border: selectedMode === 'ONLINE_MATCH' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                background: selectedMode === 'ONLINE_MATCH' ? '#EFF6FF' : '#F8FAFC',
                color: selectedMode === 'ONLINE_MATCH' ? '#2563EB' : '#475569',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer'
              }}
            >
              <Zap size={12} />
              <span>Online</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => { soundSynth.playClick(); setSelectedMode('VS_COMPUTER'); }}
            style={{
              padding: '5px 2px', borderRadius: '6px', fontSize: '9px', fontWeight: '800',
              border: selectedMode === 'VS_COMPUTER' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
              background: selectedMode === 'VS_COMPUTER' ? '#EFF6FF' : '#F8FAFC',
              color: selectedMode === 'VS_COMPUTER' ? '#2563EB' : '#475569',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer'
            }}
          >
            <Bot size={12} />
            <span>Vs AI</span>
          </button>

          <button
            type="button"
            onClick={() => { soundSynth.playClick(); setSelectedMode(isLudo ? 'LOCAL_4P' : 'LOCAL_2P'); }}
            style={{
              padding: '5px 2px', borderRadius: '6px', fontSize: '9px', fontWeight: '800',
              border: (selectedMode === 'LOCAL_2P' || selectedMode === 'LOCAL_4P') ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
              background: (selectedMode === 'LOCAL_2P' || selectedMode === 'LOCAL_4P') ? '#EFF6FF' : '#F8FAFC',
              color: (selectedMode === 'LOCAL_2P' || selectedMode === 'LOCAL_4P') ? '#2563EB' : '#475569',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer'
            }}
          >
            <Users size={12} />
            <span>Pass/Play</span>
          </button>

          {!isMemory && (
            <button
              type="button"
              onClick={() => { soundSynth.playClick(); setSelectedMode('PRIVATE_ROOM'); }}
              style={{
                padding: '5px 2px', borderRadius: '6px', fontSize: '9px', fontWeight: '800',
                border: selectedMode === 'PRIVATE_ROOM' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                background: selectedMode === 'PRIVATE_ROOM' ? '#EFF6FF' : '#F8FAFC',
                color: selectedMode === 'PRIVATE_ROOM' ? '#2563EB' : '#475569',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer'
              }}
            >
              <Lock size={12} />
              <span>Private</span>
            </button>
          )}

          {isMemory && (
            <button
              type="button"
              onClick={() => { soundSynth.playClick(); setSelectedMode('SOLO_LEVELS'); }}
              style={{
                padding: '5px 2px', borderRadius: '6px', fontSize: '9px', fontWeight: '800',
                border: selectedMode === 'SOLO_LEVELS' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                background: selectedMode === 'SOLO_LEVELS' ? '#EFF6FF' : '#F8FAFC',
                color: selectedMode === 'SOLO_LEVELS' ? '#2563EB' : '#475569',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer'
              }}
            >
              <Play size={12} />
              <span>Levels</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Name Prompt Directly Inline */}
      {isGuestWithoutName && (
        <div style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#334155', marginBottom: '3px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            YOUR PLAYER NAME
          </label>
          <input
            type="text"
            value={playerNameInput}
            onChange={(e) => { setPlayerNameInput(e.target.value); setError(''); }}
            maxLength={18}
            placeholder="Enter your name"
            style={{
              width: '100%', padding: '6px 8px', borderRadius: '6px',
              border: error ? '1.5px solid #DC2626' : '1px solid #CBD5E1', fontSize: '11px',
              fontWeight: '700', color: '#0F172A', outline: 'none', background: '#FFFFFF',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Local 2P Friend Name Input */}
      {(selectedMode === 'LOCAL_2P' || selectedMode === 'LOCAL_4P') && (
        <div style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <label style={{ display: 'block', fontSize: '9px', fontWeight: '800', color: '#334155', marginBottom: '3px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            FRIEND / PLAYER 2 NAME
          </label>
          <input
            type="text"
            value={p2NameInput}
            onChange={(e) => setP2NameInput(e.target.value)}
            maxLength={18}
            placeholder="e.g. Friend's Name"
            style={{
              width: '100%', padding: '6px 8px', borderRadius: '6px',
              border: '1px solid #CBD5E1', fontSize: '11px',
              fontWeight: '700', color: '#0F172A', outline: 'none', background: '#FFFFFF',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Inline Settings: Timer & AI Difficulty */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedMode === 'VS_COMPUTER' ? '1fr 1fr' : '1fr', gap: '6px' }}>
        {/* Turn Timer */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: '800', color: '#64748B', marginBottom: '3px', fontFamily: 'var(--font-mono)' }}>
            <Clock size={10} />
            <span>TURN TIMER</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {[15, 30, 60].map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => setTurnTimer(sec)}
                style={{
                  padding: '3px', borderRadius: '4px', fontSize: '9px', fontWeight: '700',
                  border: turnTimer === sec ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  background: turnTimer === sec ? '#2563EB' : '#F8FAFC',
                  color: turnTimer === sec ? '#FFFFFF' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* AI Difficulty (If Vs AI Mode) */}
        {selectedMode === 'VS_COMPUTER' && (
          <div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748B', marginBottom: '3px', fontFamily: 'var(--font-mono)' }}>
              AI LEVEL
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
              {[
                { key: 'EASY', label: 'Easy' },
                { key: 'MEDIUM', label: 'Med' },
                { key: 'HARD', label: 'Pro' }
              ].map(diff => (
                <button
                  key={diff.key}
                  type="button"
                  onClick={() => setAiDifficulty(diff.key)}
                  style={{
                    padding: '3px', borderRadius: '4px', fontSize: '9px', fontWeight: '700',
                    border: aiDifficulty === diff.key ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    background: aiDifficulty === diff.key ? '#2563EB' : '#F8FAFC',
                    color: aiDifficulty === diff.key ? '#FFFFFF' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: '600' }}>
          {error}
        </span>
      )}

      {/* Start Button */}
      <button
        type="button"
        onClick={handleStart}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: '900',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
        }}
      >
        <span>START {selectedMode === 'ONLINE_MATCH' ? 'ONLINE MATCH' : selectedMode === 'VS_COMPUTER' ? 'VS AI' : selectedMode === 'PRIVATE_ROOM' ? 'PRIVATE ROOM' : 'MATCH'}</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
