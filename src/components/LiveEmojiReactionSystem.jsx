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
  const containerRef = useRef(null);
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  // Close popup when clicking outside on Desktop
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setChatDrawerOpen(false);
        setHighlightedIndex(null);
      }
    };

    if (chatDrawerOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [chatDrawerOpen]);

  // Mobile Touch Drag-to-Select Listener
  useEffect(() => {
    const onTouchMove = (e) => {
      if (!isDraggingRef.current || !e.touches || !e.touches[0]) return;
      const touch = e.touches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      if (targetEl) {
        const itemEl = targetEl.closest('[data-phrase-index]');
        if (itemEl) {
          const idx = parseInt(itemEl.getAttribute('data-phrase-index'), 10);
          if (!isNaN(idx)) {
            if (highlightedIndexRef.current !== idx) {
              try { soundSynth.playRotate(); } catch (err) {}
            }
            setHighlightedIndex(idx);
            return;
          }
        }
      }
      setHighlightedIndex(null);
    };

    const onTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setChatDrawerOpen(false);
        const currentIdx = highlightedIndexRef.current;
        if (currentIdx !== null && QUICK_PHRASES[currentIdx]) {
          handleSelectPhrase(QUICK_PHRASES[currentIdx].text);
        }
        setHighlightedIndex(null);
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
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

  // Unified 5-Second Cooldown for Both Emoji & Chat Actions (Only 1 Action at Once)
  const startCooldown = (seconds = 5) => {
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
    startCooldown(5);

    // Spawn local reaction ONCE
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
    if (cooldownSeconds > 0) return;

    soundSynth.playBulbLight();
    startCooldown(5);
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
      {/* 1. NEATLY ANCHORED EMOJI REACTIONS (Player 1 Left, Player 2 Right) */}
      {activeReactions.map((item) => {
        const isLeft = item.isSelf; // Player 1 (You) on Left, Opponent on Right

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              bottom: '54px',
              left: isLeft ? '18%' : '82%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              animation: 'speechBubblePop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {/* Realistic Emoji Action Animation */}
            <div className={item.animClass} style={{ display: 'inline-flex', fontSize: '36px', lineHeight: 1, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}>
              {item.emoji}
            </div>

            {/* Static Clean Sender Tag */}
            <div style={{
              background: isLeft ? '#2563EB' : '#DC2626',
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              border: '1.5px solid rgba(255, 255, 255, 0.9)',
              whiteSpace: 'nowrap',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.18)'
            }}>
              {item.sender}
            </div>
          </div>
        );
      })}

      {/* 2. NEATLY ANCHORED SPEECH BUBBLES (Player 1 Left, Player 2 Right) */}
      {activeSpeechBubbles.map((bubble) => {
        const isLeft = bubble.isSelf;

        return (
          <div
            key={bubble.id}
            className="animate-speech-bubble"
            style={{
              position: 'absolute',
              bottom: '56px',
              left: isLeft ? '28%' : '72%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 9999,
              background: '#FFFFFF',
              border: isLeft ? '1.5px solid #2563EB' : '1.5px solid #DC2626',
              padding: '7px 12px',
              borderRadius: '14px',
              boxShadow: isLeft ? '0 10px 28px -4px rgba(37,99,235,0.22), 0 2px 6px rgba(0,0,0,0.06)' : '0 10px 28px -4px rgba(220,38,38,0.22), 0 2px 6px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              animation: 'speechBubblePop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <MessageSquare size={13} color={isLeft ? '#2563EB' : '#DC2626'} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
              {bubble.text}
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: '4px',
              background: isLeft ? '#EFF6FF' : '#FEF2F2',
              color: isLeft ? '#1D4ED8' : '#B91C1C'
            }}>
              {bubble.sender}
            </span>
          </div>
        );
      })}

      {/* 3. DOCK WITH UPWARD POPUP CHAT MENU */}
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: '#FFFFFF',
          border: '1.5px solid #E4E4E7',
          borderRadius: '14px',
          padding: '4px 6px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box',
          gap: '6px'
        }}
      >
        {/* Upward Floating Tactical Chat Menu (Clean Light Theme with Vivid Hover) */}
        {chatDrawerOpen && (
          <div 
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '0',
              width: '240px',
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: '0 20px 48px -6px rgba(15, 23, 42, 0.2), 0 4px 14px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 99999,
              pointerEvents: 'auto',
              animation: 'speechBubblePop 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <div style={{ padding: '3px 6px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                QUICK TACTICAL CHAT
              </span>
              <span style={{ fontSize: '9px', fontWeight: '800', color: '#2563EB', background: '#EFF6FF', padding: '1px 6px', borderRadius: '4px' }}>
                Tap or Slide
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {QUICK_PHRASES.map((item, idx) => {
                const isSelected = highlightedIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    data-phrase-index={idx}
                    onClick={() => handleSelectPhrase(item.text)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseLeave={() => setHighlightedIndex(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      background: isSelected ? '#EFF6FF' : '#F8FAFC',
                      border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      color: isSelected ? '#1D4ED8' : '#1E293B',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transform: isSelected ? 'scale(1.02) translateX(3px)' : 'scale(1)',
                      boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.16)' : 'none',
                      transition: 'all 0.12s ease',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.emoji}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.text}</span>
                    {isSelected && (
                      <span style={{ fontSize: '9px', fontWeight: '900', color: '#2563EB', background: '#DBEAFE', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                        SEND ↵
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}


        {/* Quick Chat Trigger Button */}
        <button
          type="button"
          disabled={cooldownSeconds > 0}
          onClick={() => {
            if (cooldownSeconds > 0) return;
            soundSynth.playClick();
            setChatDrawerOpen(prev => !prev);
          }}
          onTouchStart={(e) => {
            if (cooldownSeconds > 0) return;
            isDraggingRef.current = true;
            setChatDrawerOpen(true);
            setHighlightedIndex(null);
            try { soundSynth.playClick(); } catch (err) {}
          }}
          title={cooldownSeconds > 0 ? `Cooldown (${cooldownSeconds}s)` : "Click or Hold to select message"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '7px 11px',
            borderRadius: '10px',
            background: chatDrawerOpen ? '#2563EB' : (cooldownSeconds > 0 ? '#F4F4F5' : '#F8FAFC'),
            border: chatDrawerOpen ? '1px solid #1D4ED8' : '1px solid #CBD5E1',
            color: chatDrawerOpen ? '#FFFFFF' : (cooldownSeconds > 0 ? '#A1A1AA' : '#0F172A'),
            fontSize: '11px',
            fontWeight: '900',
            cursor: cooldownSeconds > 0 ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            opacity: cooldownSeconds > 0 ? 0.45 : 1,
            touchAction: 'none',
            userSelect: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={14} color={chatDrawerOpen ? '#FFFFFF' : (cooldownSeconds > 0 ? '#A1A1AA' : '#2563EB')} />
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

        {/* Unified 5-Second Cooldown Timer Pill */}
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


