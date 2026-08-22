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
  { text: "Nice move!", emoji: "🎯" },
  { text: "Good game!", emoji: "🤝" },
  { text: "Well played!", emoji: "👏" },
  { text: "Thinking...", emoji: "🤔" },
  { text: "Oops!", emoji: "😅" },
  { text: "Almost had it!", emoji: "🔥" },
  { text: "One more game?", emoji: "⚔️" },
  { text: "Rematch!", emoji: "🏆" }
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
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const cooldownTimerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  // Window Touch Drag-to-Select Listener for Mobile Gestures
  useEffect(() => {
    const handleWindowTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      const touch = e.touches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      if (targetEl) {
        const itemEl = targetEl.closest('[data-phrase-index]');
        if (itemEl) {
          const idx = parseInt(itemEl.getAttribute('data-phrase-index'), 10);
          if (!isNaN(idx)) {
            setHighlightedIndex(idx);
            return;
          }
        }
      }
      setHighlightedIndex(null);
    };

    const handleWindowTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        const currentIdx = highlightedIndexRef.current;
        if (currentIdx !== null && QUICK_PHRASES[currentIdx]) {
          handleSelectPhrase(QUICK_PHRASES[currentIdx].text);
        }
        setHighlightedIndex(null);
      }
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handleWindowTouchEnd);
    window.addEventListener('touchcancel', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
    };
  }, []);


  // Handle incoming reaction from opponent
  useEffect(() => {
    if (incomingReaction && incomingReaction.emoji) {
      if (incomingReaction.senderId && userId && incomingReaction.senderId === userId) {
        return;
      }
      spawnReaction(incomingReaction.emoji, incomingReaction.sender, false);
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
        sender: incomingChat.sender,
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
    <div style={{ width: '100%', maxWidth: '440px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 1. MEANINGFUL ANCHORED EMOJI REACTIONS (Directly above the game dock near players) */}
      {activeReactions.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            bottom: item.isSelf ? '56px' : 'auto',
            top: item.isSelf ? 'auto' : '-55px',
            left: item.isSelf ? '75%' : '25%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Realistic Emoji Action Animation */}
          <div className={item.animClass} style={{ display: 'inline-flex', fontSize: '38px', lineHeight: 1 }}>
            {item.emoji}
          </div>

          {/* Static Clean Sender Tag */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '800',
            color: item.isSelf ? '#38BDF8' : '#FBBF24',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            {item.sender}
          </div>
        </div>
      ))}

      {/* 2. MEANINGFUL ANCHORED SPEECH BUBBLES (Directly near player sides) */}
      {activeSpeechBubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="animate-speech-bubble"
          style={{
            position: 'absolute',
            bottom: bubble.isSelf ? '56px' : 'auto',
            top: bubble.isSelf ? 'auto' : '-50px',
            left: bubble.isSelf ? '70%' : '30%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 9999,
            background: '#FFFFFF',
            border: '1.5px solid #2563EB',
            padding: '6px 12px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px -4px rgba(37,99,235,0.25), 0 2px 6px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <MessageSquare size={13} color="#2563EB" />
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#18181B' }}>
            {bubble.text}
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: '800',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            borderRadius: '4px',
            background: bubble.isSelf ? '#EFF6FF' : '#FEF3C7',
            color: bubble.isSelf ? '#2563EB' : '#B45309'
          }}>
            {bubble.sender}
          </span>
        </div>
      ))}


      {/* 3. QUICK CHAT VERTICAL POPUP DRAWER (With Hold & Slide Drag-to-Select Support) */}
      {chatDrawerOpen && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          border: '1.5px solid #CBD5E1',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.22), 0 2px 8px rgba(0, 0, 0, 0.06)',
          marginBottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 60,
          animation: 'speechBubblePop 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Tactical Chat
              </span>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>
                • Tap or Slide
              </span>
            </div>
            <button
              onClick={() => {
                soundSynth.playClick();
                setChatDrawerOpen(false);
              }}
              style={{ background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Vertical Message List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '260px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingRight: '2px'
          }}>
            {QUICK_PHRASES.map((item, idx) => {
              const isSelected = highlightedIndex === idx;

              return (
                <button
                  key={idx}
                  data-phrase-index={idx}
                  onClick={() => handleSelectPhrase(item.text)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    background: isSelected ? '#EFF6FF' : '#F8FAFC',
                    border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: isSelected ? '#1D4ED8' : '#1E293B',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    boxSizing: 'border-box',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.18)' : 'none',
                    transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
                    userSelect: 'none',
                    touchAction: 'manipulation'
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseLeave={() => setHighlightedIndex(null)}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>
                    {item.emoji}
                  </span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.text}
                  </span>
                  {isSelected && (
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                      SEND ↵
                    </span>
                  )}
                </button>
              );
            })}
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
        {/* Quick Chat Drawer Trigger Button with Hold & Slide Gesture */}
        <button
          type="button"
          onClick={() => {
            soundSynth.playClick();
            setChatDrawerOpen(prev => !prev);
          }}
          onTouchStart={() => {
            isDraggingRef.current = true;
            setChatDrawerOpen(true);
          }}
          title="Tap or Hold & Drag up to select message"
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
            touchAction: 'none'
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

