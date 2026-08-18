import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Clock, Shuffle, User, X, Check, Timer } from 'lucide-react';
import { getGameSettings, saveGameSettings } from '../utils/gameSettings.js';

export default function MatchSettingsModal({
  isOpen,
  onClose,
  onSettingsSaved
}) {
  const [turnTime, setTurnTime] = useState(30);
  const [bankMinutes, setBankMinutes] = useState(5);
  const [firstPlayer, setFirstPlayer] = useState('random');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getGameSettings();
      setTurnTime(current.turnTimeLimit);
      setBankMinutes(current.playerBankMinutes);
      setFirstPlayer(current.firstPlayer);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const TURN_TIME_OPTIONS = [
    { label: '15s (Bullet)', value: 15 },
    { label: '30s (Blitz)', value: 30 },
    { label: '45s (Standard)', value: 45 },
    { label: '60s (Slow)', value: 60 },
    { label: 'Unlimited', value: 0 }
  ];

  const BANK_TIME_OPTIONS = [
    { label: '1 Min', value: 1 },
    { label: '3 Mins', value: 3 },
    { label: '5 Mins', value: 5 },
    { label: '10 Mins', value: 10 },
    { label: 'Unlimited', value: 0 }
  ];

  const FIRST_PLAYER_OPTIONS = [
    { label: 'Random (50/50)', value: 'random', icon: Shuffle },
    { label: 'You (First)', value: 'p1', icon: User },
    { label: 'Opponent (First)', value: 'p2', icon: User }
  ];

  const handleSave = () => {
    const updated = saveGameSettings({
      turnTimeLimit: turnTime,
      playerBankMinutes: bankMinutes,
      firstPlayer: firstPlayer
    });

    if (onSettingsSaved) {
      onSettingsSaved(updated);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 450);
  };

  const modalContent = (
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
        boxSizing: 'border-box',
        pointerEvents: 'auto'
      }}
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(95vw, 440px)',
          maxHeight: '90dvh',
          padding: 'clamp(14px, 4vw, 24px)',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          margin: 'auto'
        }}
      >

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '34px', height: '34px', borderRadius: '10px',
            background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8'
          }}>
            <Settings size={20} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              MATCH SETTINGS
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
              Time Limits & Turn Rules
            </span>
          </div>
        </div>

        {/* 1. Time Limit Per Turn */}
        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '800', color: '#0f172a',
            marginBottom: '8px'
          }}>
            <Clock size={14} color="#2563eb" />
            <span>TIME LIMIT PER TURN</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {TURN_TIME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTurnTime(opt.value)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '11px',
                  fontWeight: '800',
                  background: turnTime === opt.value ? '#0f172a' : '#f8fafc',
                  color: turnTime === opt.value ? '#ffffff' : '#334155',
                  border: turnTime === opt.value ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Total Match Bank Minutes */}
        <div style={{ marginBottom: '18px', textAlign: 'left' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '800', color: '#0f172a',
            marginBottom: '8px'
          }}>
            <Timer size={14} color="#15803d" />
            <span>PLAYER TOTAL BANK TIME</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {BANK_TIME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBankMinutes(opt.value)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '11px',
                  fontWeight: '800',
                  background: bankMinutes === opt.value ? '#15803d' : '#f8fafc',
                  color: bankMinutes === opt.value ? '#ffffff' : '#334155',
                  border: bankMinutes === opt.value ? '1.5px solid #15803d' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Who Plays First */}
        <div style={{ marginBottom: '22px', textAlign: 'left' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '800', color: '#0f172a',
            marginBottom: '8px'
          }}>
            <Shuffle size={14} color="#92400e" />
            <span>WHO PLAYS FIRST</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
            {FIRST_PLAYER_OPTIONS.map(opt => {
              const IconComp = opt.icon;
              const isSelected = firstPlayer === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFirstPlayer(opt.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    border: isSelected ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconComp size={15} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check size={16} color="#2563eb" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Settings Button */}
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '800',
            minHeight: '44px'
          }}
        >
          {savedSuccess ? <Check size={16} /> : <Settings size={16} />}
          <span>{savedSuccess ? 'SETTINGS SAVED!' : 'APPLY MATCH SETTINGS'}</span>
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
