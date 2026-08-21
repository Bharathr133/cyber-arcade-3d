import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Settings, Clock, Shuffle, User, X, Check, Timer, Bot, 
  Palette, Eye, LayoutGrid, Dices, ShieldCheck, Globe
} from 'lucide-react';
import { 
  getPerGameSettings, 
  savePerGameSettings, 
  saveSettingsToAllGames,
  GAME_SPECIFIC_DEFAULTS 
} from '../utils/gameSettings.js';

import { 
  TicTacToeIcon, 
  ConnectFourIcon, 
  GomokuIcon, 
  MemoryMatchIcon, 
  LudoIcon 
} from './GameIcons.jsx';
import { soundSynth } from '../utils/soundSynth.js';

const GAMES_LIST = [
  { id: 'connect4', title: 'Connect 4', icon: ConnectFourIcon, color: '#2563EB' },
  { id: 'tictactoe', title: 'Tic-Tac-Toe', icon: TicTacToeIcon, color: '#DC2626' },
  { id: 'gomoku', title: 'Gomoku', icon: GomokuIcon, color: '#0D9488' },
  { id: 'memory', title: 'Memory Match', icon: MemoryMatchIcon, color: '#9333EA' },
  { id: 'ludo', title: 'Ludo Arena', icon: LudoIcon, color: '#D97706' }
];

export default function MatchSettingsModal({
  isOpen,
  onClose,
  activeGameId = 'connect4',
  profile,
  onSettingsSaved
}) {
  const [selectedGameTab, setSelectedGameTab] = useState('connect4');
  const [gameSettings, setGameSettings] = useState(() => getPerGameSettings('connect4', profile?.id));
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync active game tab on modal open
  useEffect(() => {
    if (isOpen) {
      const target = (activeGameId && activeGameId !== 'home') ? activeGameId : 'connect4';
      setSelectedGameTab(target);
      setGameSettings(getPerGameSettings(target, profile?.id));
    }
  }, [isOpen, activeGameId, profile?.id]);

  // Handle switching tabs
  const handleSwitchTab = (gId) => {
    soundSynth.playClick();
    setSelectedGameTab(gId);
    setGameSettings(getPerGameSettings(gId, profile?.id));
    setSavedSuccess(false);
  };

  // Prevent background scroll while modal open
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateSetting = (key, val) => {
    setGameSettings(prev => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    soundSynth.playVictory();
    const updated = savePerGameSettings(selectedGameTab, gameSettings, profile?.id);
    if (onSettingsSaved) {
      onSettingsSaved(updated);
    }
    setSavedSuccess('THIS');
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 450);
  };

  const handleSaveAll = () => {
    soundSynth.playVictory();
    saveSettingsToAllGames(gameSettings, profile?.id);
    if (onSettingsSaved) {
      onSettingsSaved(gameSettings);
    }
    setSavedSuccess('ALL');
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 550);
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
        boxSizing: 'border-box',
        pointerEvents: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="animate-pop-in"
        style={{
          width: 'min(95vw, 480px)',
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #BFDBFE'
            }}>
              <Settings size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Game Match Settings
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                Per-game isolated rules & preferences
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #CBD5E1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748B', cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Game Switcher Tabs */}
        <div style={{
          padding: '8px 12px',
          background: '#F1F5F9',
          borderBottom: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px'
        }}>
          {GAMES_LIST.map((g) => {
            const IconComp = g.icon;
            const isTabActive = selectedGameTab === g.id;

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSwitchTab(g.id)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: isTabActive ? `1.5px solid ${g.color}` : '1px solid transparent',
                  background: isTabActive ? '#FFFFFF' : 'transparent',
                  color: isTabActive ? g.color : '#64748B',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: isTabActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp size={16} />
                <span style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' }}>
                  {g.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Game-Specific Settings Form */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* 1. TURN TIME LIMIT */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              <Clock size={13} color="#2563EB" />
              <span>TURN TIME LIMIT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
              {[
                { label: '15s', val: 15 },
                { label: '30s', val: 30 },
                { label: '45s', val: 45 },
                { label: '60s', val: 60 },
                { label: 'Inf', val: 0 }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => updateSetting('turnTimeLimit', opt.val)}
                  style={{
                    padding: '8px 2px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                    border: gameSettings.turnTimeLimit === opt.val ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    background: gameSettings.turnTimeLimit === opt.val ? '#EFF6FF' : '#F8FAFC',
                    color: gameSettings.turnTimeLimit === opt.val ? '#2563EB' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. AI BOT DIFFICULTY */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              <Bot size={13} color="#2563EB" />
              <span>AI BOT DIFFICULTY</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { key: 'EASY', label: 'Casual (Fun)' },
                { key: 'MEDIUM', label: 'Smart (Balanced)' },
                { key: 'HARD', label: 'Pro (Grandmaster)' }
              ].map(diff => (
                <button
                  key={diff.key}
                  type="button"
                  onClick={() => updateSetting('aiDifficulty', diff.key)}
                  style={{
                    padding: '8px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                    border: gameSettings.aiDifficulty === diff.key ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    background: gameSettings.aiDifficulty === diff.key ? '#EFF6FF' : '#F8FAFC',
                    color: gameSettings.aiDifficulty === diff.key ? '#2563EB' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. GAME-SPECIFIC CUSTOMIZATIONS */}

          {/* CONNECT 4 SPECIFIC */}
          {selectedGameTab === 'connect4' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                <Shuffle size={13} color="#2563EB" />
                <span>FIRST DROP TURN</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { key: 'random', label: 'Random (50/50)' },
                  { key: 'p1', label: 'You First' },
                  { key: 'p2', label: 'Opponent First' }
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => updateSetting('firstPlayer', p.key)}
                    style={{
                      padding: '8px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                      border: gameSettings.firstPlayer === p.key ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                      background: gameSettings.firstPlayer === p.key ? '#EFF6FF' : '#F8FAFC',
                      color: gameSettings.firstPlayer === p.key ? '#2563EB' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TIC TAC TOE SPECIFIC */}
          {selectedGameTab === 'tictactoe' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                <Palette size={13} color="#DC2626" />
                <span>MARK THEME STYLE</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { key: 'NEON', label: 'Neon Glow' },
                  { key: 'MINIMAL', label: 'Minimal Ink' },
                  { key: 'LASER', label: 'Laser Cyber' }
                ].map(thm => (
                  <button
                    key={thm.key}
                    type="button"
                    onClick={() => updateSetting('symbolStyle', thm.key)}
                    style={{
                      padding: '8px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                      border: gameSettings.symbolStyle === thm.key ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
                      background: gameSettings.symbolStyle === thm.key ? '#FEF2F2' : '#F8FAFC',
                      color: gameSettings.symbolStyle === thm.key ? '#DC2626' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {thm.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GOMOKU SPECIFIC */}
          {selectedGameTab === 'gomoku' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                <Timer size={13} color="#0D9488" />
                <span>PLAYER TIME BANK</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {[
                  { label: '3 Mins', val: 3 },
                  { label: '5 Mins', val: 5 },
                  { label: '10 Mins', val: 10 },
                  { label: 'Unlimited', val: 0 }
                ].map(bank => (
                  <button
                    key={bank.val}
                    type="button"
                    onClick={() => updateSetting('playerBankMinutes', bank.val)}
                    style={{
                      padding: '8px 2px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                      border: gameSettings.playerBankMinutes === bank.val ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                      background: gameSettings.playerBankMinutes === bank.val ? '#F0FDFA' : '#F8FAFC',
                      color: gameSettings.playerBankMinutes === bank.val ? '#0D9488' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {bank.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MEMORY MATCH SPECIFIC */}
          {selectedGameTab === 'memory' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                <LayoutGrid size={13} color="#9333EA" />
                <span>GRID BOARD SIZE</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { key: '4x4', label: '4 × 4 (8 Pairs)' },
                  { key: '5x4', label: '5 × 4 (10 Pairs)' },
                  { key: '6x4', label: '6 × 4 (12 Pairs)' }
                ].map(sz => (
                  <button
                    key={sz.key}
                    type="button"
                    onClick={() => updateSetting('gridSize', sz.key)}
                    style={{
                      padding: '8px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                      border: gameSettings.gridSize === sz.key ? '1.5px solid #9333EA' : '1px solid #E2E8F0',
                      background: gameSettings.gridSize === sz.key ? '#FAF5FF' : '#F8FAFC',
                      color: gameSettings.gridSize === sz.key ? '#9333EA' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LUDO SPECIFIC */}
          {selectedGameTab === 'ludo' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                <Dices size={13} color="#D97706" />
                <span>TOKENS PER PLAYER</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {[
                  { val: 2, label: '2 Tokens (Quick Match)' },
                  { val: 4, label: '4 Tokens (Tournament)' }
                ].map(tok => (
                  <button
                    key={tok.val}
                    type="button"
                    onClick={() => updateSetting('tokenCount', tok.val)}
                    style={{
                      padding: '8px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                      border: gameSettings.tokenCount === tok.val ? '1.5px solid #D97706' : '1px solid #E2E8F0',
                      background: gameSettings.tokenCount === tok.val ? '#FEFCE8' : '#F8FAFC',
                      color: gameSettings.tokenCount === tok.val ? '#D97706' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {tok.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Dual Apply Buttons */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
          {/* Apply to All Games */}
          <button
            type="button"
            onClick={handleSaveAll}
            className="btn-secondary"
            style={{
              padding: '11px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: savedSuccess === 'ALL' ? '#EFF6FF' : '#FFFFFF',
              border: savedSuccess === 'ALL' ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
              color: savedSuccess === 'ALL' ? '#2563EB' : '#334155'
            }}
          >
            {savedSuccess === 'ALL' ? <Check size={15} color="#2563EB" /> : <Globe size={15} color="#2563EB" />}
            <span>{savedSuccess === 'ALL' ? 'APPLIED TO ALL 5!' : 'APPLY TO ALL GAMES'}</span>
          </button>

          {/* Apply to Current Game */}
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary"
            style={{
              padding: '11px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            {savedSuccess === 'THIS' ? <Check size={15} /> : <Settings size={15} />}
            <span>{savedSuccess === 'THIS' ? 'SAVED!' : `APPLY TO ${selectedGameTab.toUpperCase()}`}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
