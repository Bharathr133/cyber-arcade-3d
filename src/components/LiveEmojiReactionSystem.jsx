import React, { useState, useEffect, useRef } from 'react';
import { Smile, Clock } from 'lucide-react';
import { realtimeManager } from '../services/realtimeManager.js';
import { soundSynth } from '../utils/soundSynth.js';

const QUICK_EMOJIS = [
  { emoji: '👏', label: 'Good Game' },
  { emoji: '🔥', label: 'On Fire' },
  { emoji: '🧠', label: 'Big Brain' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😱', label: 'Shocked' },
  { emoji: '🤔', label: 'Thinking' }
];

export default function LiveEmojiReactionSystem({
  matchId,
  isOnline = false,
  playerName = 'You',
  incomingReaction = null
}) {
  const [activeReactions, setActiveReactions] = useState([]);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimerRef = useRef(null);

  // Handle incoming reaction from opponent
  useEffect(() => {
    if (incomingReaction && incomingReaction.emoji) {
      spawnReaction(incomingReaction.emoji, incomingReaction.sender || 'Opponent', false);
    }
  }, [incomingReaction]);

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = (seconds = 3) => {
    setCooldownSeconds(seconds);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);

    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendEmoji = async (emojiObj) => {
    if (cooldownSeconds > 0) return;

    soundSynth.playRotate();
    startCooldown(3);

    // Spawn local reaction
    spawnReaction(emojiObj.emoji, playerName || 'You', true);

    // Broadcast to opponent via Realtime Manager
    if (isOnline && matchId) {
      await realtimeManager.sendReaction(matchId, emojiObj.emoji, playerName || 'Opponent');
    }
  };

  const spawnReaction = (emoji, sender, isSelf = false) => {
    const reactionId = `${Date.now()}_${Math.random()}`;
    const newReaction = {
      id: reactionId,
      emoji,
      sender,
      isSelf
    };

    setActiveReactions(prev => [...prev.slice(-2), newReaction]);

    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 1800);
  };

  return (
    <>
      {/* 1. Center of the Board Floating Reaction (Smooth & Non-Intrusive) */}
      {activeReactions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {activeReactions.map((item) => (
            <div
              key={item.id}
              className="animate-center-emoji"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '8px 16px',
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}
            >
              <span style={{ fontSize: '34px', lineHeight: '1', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                {item.emoji}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                color: item.isSelf ? '#38bdf8' : '#fbbf24',
                letterSpacing: '0.03em',
                marginTop: '4px',
                fontFamily: 'var(--font-mono)'
              }}>
                {item.sender}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 2. Compact Reaction Toolbar with Anti-Spam Cooldown Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '3px 6px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box'
      }}>
        {QUICK_EMOJIS.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={cooldownSeconds > 0}
            onClick={() => handleSendEmoji(item)}
            title={cooldownSeconds > 0 ? `Cooldown (${cooldownSeconds}s)` : item.label}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              lineHeight: 1,
              cursor: cooldownSeconds > 0 ? 'not-allowed' : 'pointer',
              padding: '4px 5px',
              borderRadius: '6px',
              transition: 'transform 0.15s ease, background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: cooldownSeconds > 0 ? 0.4 : 1
            }}
            onMouseEnter={(e) => {
              if (cooldownSeconds === 0) {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.emoji}
          </button>
        ))}

        {/* Cooldown Timer Pill */}
        {cooldownSeconds > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 6px',
            borderRadius: '6px',
            background: '#f1f5f9',
            fontSize: '10px',
            fontWeight: '800',
            color: '#64748b',
            fontFamily: 'var(--font-mono)',
            marginLeft: '2px'
          }}>
            <Clock size={10} />
            <span>{cooldownSeconds}s</span>
          </div>
        )}
      </div>
    </>
  );
}
