import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Clock, X } from 'lucide-react';
import { realtimeManager } from '../services/realtimeManager.js';
import { soundSynth } from '../utils/soundSynth.js';

const QUICK_EMOJIS = [
  { emoji: '🔥', label: 'On Fire', anim: 'animate-emoji-fire' },
  { emoji: '👏', label: 'Good Game', anim: 'animate-emoji-clap' },
  { emoji: '😂', label: 'Laughing', anim: 'animate-emoji-laugh' },
  { emoji: '🤯', label: 'Mind Blown', anim: 'animate-emoji-mindblown' },
  { emoji: '🎯', label: 'Nice Move', anim: 'animate-emoji-target' },
  { emoji: '🏆', label: 'Champion', anim: 'animate-emoji-trophy' },
  { emoji: '👍', label: 'Well Done', anim: 'animate-emoji-thumbsup' },
  { emoji: '😱', label: 'Shocked', anim: 'animate-emoji-shock' },
  { emoji: '🤔', label: 'Thinking', anim: 'animate-emoji-thinking' },
  { emoji: '💀', label: 'Dead', anim: 'animate-emoji-skull' }
];

const QUICK_PHRASES = [
  "Nice move!",
  "Good game!",
  "Oops!",
  "Thinking...",
  "Well played!",
  "Rematch?"
];

function getEmojiAnimationClass(emoji) {
  const match = QUICK_EMOJIS.find(e => e.emoji === emoji);
  return match ? match.anim : 'animate-emoji-thumbsup';
}

export default function LiveEmojiReactionSystem({
  matchId,
  isOnline = false,
  playerName = 'You',
  userId = null,
  incomingReaction = null,
  incomingChat = null,
  onSendQuickChat = null
}) {
  const [activeReactions, setActiveReactions] = useState([]);
  const [activeSpeechBubbles, setActiveSpeechBubbles] = useState([]);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const cooldownTimerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Handle incoming reaction from opponent
  useEffect(() => {
    if (incomingReaction && incomingReaction.emoji) {
      if (incomingReaction.senderId && userId && incomingReaction.senderId === userId) {
        return;
      }
      spawnReaction(incomingReaction.emoji, incomingReaction.sender || 'Opponent', false);
    }
  }, [incomingReaction, userId]);

  // Handle incoming quick chat from opponent
  useEffect(() => {
    if (incomingChat && incomingChat.phrase) {
      if (incomingChat.senderId && userId && incomingChat.senderId === userId) {
        return;
      }
      const bubbleId = `${Date.now()}_${Math.random()}`;
      const newBubble = {
        id: bubbleId,
        text: incomingChat.phrase,
        sender: incomingChat.sender || 'Opponent',
        isSelf: false
      };

      setActiveSpeechBubbles(prev => [...prev.slice(-1), newBubble]);

      setTimeout(() => {
        setActiveSpeechBubbles(prev => prev.filter(b => b.id !== bubbleId));
      }, 3200);
    }
  }, [incomingChat, userId]);

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

    // Spawn local reaction ONCE (non-intrusive bottom-right side)
    spawnReaction(emojiObj.emoji, playerName || 'You', true);

    // Broadcast to opponent via Realtime Manager
    if (isOnline && matchId) {
      await realtimeManager.sendReaction(matchId, emojiObj.emoji, playerName || 'You', userId);
    }
  };

  const spawnReaction = (emoji, sender, isSelf = false) => {
    const reactionId = `${Date.now()}_${Math.random()}`;
    const newReaction = {
      id: reactionId,
      emoji,
      sender,
      isSelf,
      animClass: getEmojiAnimationClass(emoji)
    };

    setActiveReactions(prev => [...prev.slice(-2), newReaction]);

    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 1900);
  };

  const handleSelectPhrase = (phrase) => {
    soundSynth.playBulbLight();
    setChatDrawerOpen(false);

    const bubbleId = `${Date.now()}_${Math.random()}`;
    const newBubble = {
      id: bubbleId,
      text: phrase,
      sender: playerName || 'You',
      isSelf: true
    };

    setActiveSpeechBubbles(prev => [...prev.slice(-1), newBubble]);

    if (onSendQuickChat) {
      onSendQuickChat(phrase);
    }
    if (isOnline && matchId) {
      realtimeManager.broadcastToMatch(matchId, 'quick_chat', {
        phrase,
        sender: playerName || 'You',
        senderId: userId
      });
    }

    setTimeout(() => {
      setActiveSpeechBubbles(prev => prev.filter(b => b.id !== bubbleId));
    }, 3200);
  };


  return (
    <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 1. NON-INTRUSIVE FLOATING EMOJI REACTIONS (At the Sides, NOT blocking board) */}
      {activeReactions.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'fixed',
            bottom: item.isSelf ? '110px' : 'auto',
            top: item.isSelf ? 'auto' : '90px',
            right: '24px',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {/* Realistic Emoji Action Animation (Only emoji animates) */}
          <div className={item.animClass} style={{ display: 'inline-flex', fontSize: '38px', lineHeight: 1 }}>
            {item.emoji}
          </div>

          {/* Static Clean Sender Tag (No animation on text) */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '800',
            color: item.isSelf ? '#38BDF8' : '#FBBF24',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            whiteSpace: 'nowrap'
          }}>
            {item.sender}
          </div>
        </div>
      ))}

      {/* 2. NON-INTRUSIVE STATIC SPEECH BUBBLES (Clean text, no text distortion) */}
      {activeSpeechBubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="animate-speech-bubble"
          style={{
            position: 'fixed',
            bottom: bubble.isSelf ? '120px' : 'auto',
            top: bubble.isSelf ? 'auto' : '100px',
            left: '24px',
            pointerEvents: 'none',
            zIndex: 9999,
            background: '#FFFFFF',
            border: '1.5px solid #E4E4E7',
            padding: '7px 12px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <MessageSquare size={13} color="#2563EB" />
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#18181B' }}>
            {bubble.text}
          </span>
        </div>
      ))}

      {/* 3. QUICK CHAT POPUP DRAWER (Opens smoothly above bottom dock) */}
      {chatDrawerOpen && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          border: '1.5px solid #E4E4E7',
          borderRadius: '14px',
          padding: '10px',
          boxShadow: '0 12px 32px -4px rgba(0,0,0,0.18)',
          marginBottom: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 60,
          animation: 'speechBubblePop 0.15s ease-out forwards'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Tactical Chat
            </span>
            <button
              onClick={() => setChatDrawerOpen(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#71717A' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px'
          }}>
            {QUICK_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPhrase(phrase)}
                style={{
                  padding: '8px 6px',
                  background: '#F4F4F5',
                  border: '1px solid #E4E4E7',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#18181B',
                  cursor: 'pointer',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'background 0.1s ease, transform 0.1s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E4E4E7'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F4F4F5'}
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. MOBILE-RESPONSIVE DRAG-TO-REACT DOCK (Large Thumb Targets, Horizontal Scroll) */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        border: '1.5px solid #E4E4E7',
        borderRadius: '14px',
        padding: '4px 6px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        boxSizing: 'border-box',
        gap: '6px'
      }}>
        {/* Quick Chat Drawer Trigger Button */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playClick();
            setChatDrawerOpen(prev => !prev);
          }}
          title="Open Quick Chat Phrases"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '7px 10px',
            borderRadius: '10px',
            background: chatDrawerOpen ? '#EFF6FF' : '#F4F4F5',
            border: chatDrawerOpen ? '1px solid #BFDBFE' : '1px solid #E4E4E7',
            color: chatDrawerOpen ? '#2563EB' : '#18181B',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            flexShrink: 0,
            touchAction: 'manipulation'
          }}
        >
          <MessageSquare size={14} color={chatDrawerOpen ? '#2563EB' : '#52525B'} />
          <span>CHAT</span>
        </button>

        {/* Vertical Divider */}
        <div style={{ width: '1px', height: '22px', background: '#E4E4E7', flexShrink: 0 }} />

        {/* Drag & React / Swipeable Emoji Rail */}
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            touchAction: 'pan-x',
            flex: 1,
            padding: '2px 0'
          }}
        >
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
                fontSize: '22px',
                lineHeight: 1,
                cursor: cooldownSeconds > 0 ? 'not-allowed' : 'pointer',
                minWidth: '36px',
                height: '36px',
                borderRadius: '8px',
                transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: cooldownSeconds > 0 ? 0.35 : 1,
                flexShrink: 0,
                touchAction: 'manipulation',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (cooldownSeconds === 0) {
                  e.currentTarget.style.transform = 'scale(1.22)';
                  e.currentTarget.style.background = '#F4F4F5';
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
        </div>

        {/* Cooldown Timer Pill */}
        {cooldownSeconds > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '4px 7px',
            borderRadius: '8px',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            fontSize: '10px',
            fontWeight: '800',
            color: '#B45309',
            fontFamily: 'var(--font-mono)',
            flexShrink: 0
          }}>
            <Clock size={11} />
            <span>{cooldownSeconds}s</span>
          </div>
        )}
      </div>
    </div>
  );
}

