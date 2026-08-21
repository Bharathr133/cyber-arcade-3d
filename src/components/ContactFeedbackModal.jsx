import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Send, CheckCircle2, AlertCircle, Bug, Sparkles, HelpCircle } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function ContactFeedbackModal({
  isOpen,
  onClose,
  currentUserProfile
}) {
  const [feedbackType, setFeedbackType] = useState('FEEDBACK'); // 'FEEDBACK', 'BUG', 'FEATURE', 'QUESTION'
  const [email, setEmail] = useState(() => currentUserProfile?.email || '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setSubmitted(false);
      setError('');
      setMessage('');
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanMsg = message.trim();
    if (!cleanMsg || cleanMsg.length < 5) {
      setError('Please provide a message with at least 5 characters.');
      return;
    }

    try {
      soundSynth.playVictory();
      // Save feedback to local storage dispatch queue
      const existing = JSON.parse(localStorage.getItem('arcade_feedback_submissions') || '[]');
      existing.push({
        id: Date.now(),
        type: feedbackType,
        email: email.trim(),
        message: cleanMsg,
        playerName: currentUserProfile?.name || 'Guest',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('arcade_feedback_submissions', JSON.stringify(existing));
    } catch (err) {}

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
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
          width: 'min(96vw, 520px)',
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
          padding: '18px 22px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #BFDBFE'
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Contact & Feedback
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                Share bugs, suggest features, or reach the dev team
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#FFFFFF', border: '1px solid #CBD5E1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748B', cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '22px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {submitted ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={28} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Feedback Received!
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Thank you for helping make <strong>games4u</strong> better. Your submission has been logged!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Feedback Type Tabs */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  FEEDBACK CATEGORY
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {[
                    { id: 'FEEDBACK', label: 'General' },
                    { id: 'BUG', label: 'Bug Report' },
                    { id: 'FEATURE', label: 'Feature' },
                    { id: 'QUESTION', label: 'Question' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFeedbackType(t.id)}
                      style={{
                        padding: '7px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                        border: feedbackType === t.id ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                        background: feedbackType === t.id ? '#EFF6FF' : '#F8FAFC',
                        color: feedbackType === t.id ? '#2563EB' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  YOUR EMAIL (OPTIONAL FOR REPLY)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1px solid #CBD5E1', fontSize: '13px', color: '#0F172A',
                    outline: 'none', background: '#FFFFFF', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  MESSAGE & DETAILS
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your suggestion, game bug, or message..."
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: error ? '1.5px solid #DC2626' : '1px solid #CBD5E1', fontSize: '13px',
                    color: '#0F172A', outline: 'none', background: '#FFFFFF',
                    boxSizing: 'border-box', resize: 'vertical'
                  }}
                />
              </div>

              {error && (
                <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: '700' }}>
                  {error}
                </div>
              )}

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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Send size={15} />
                <span>SUBMIT FEEDBACK</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
