import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, Zap, ShieldCheck, Code, Globe, Heart, Award, ArrowRight } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function AboutPlatformModal({
  isOpen,
  onClose,
  onExploreGames
}) {
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
          width: 'min(96vw, 600px)',
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
              <Info size={18} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                About games4u Arena
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                Modern browser-based realtime competitive board game platform
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
          gap: '16px'
        }}>
          {/* Mission Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            borderRadius: '16px', padding: '18px 20px', color: '#FFFFFF'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', opacity: 0.85, textTransform: 'uppercase', marginBottom: '4px' }}>
              OUR VISION & PLATFORM
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>
              Accessible, Competitive Classic Strategy
            </h3>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, opacity: 0.95, fontWeight: '500' }}>
              <strong>games4u</strong> was engineered to bring classic board games into the modern web with zero friction: no app downloads, no ads, instant WebSockets matchmaking, real Elo ratings, and challenging Grandmaster AI.
            </p>
          </div>

          {/* Core Pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <Zap size={16} color="#2563EB" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                Zero Downloads
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: '500' }}>
                Instant play in any modern mobile or desktop browser.
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <ShieldCheck size={16} color="#16A34A" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                Verified ELO Rating
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: '500' }}>
                Chess-standard rating formula for fair competitive matches.
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <Code size={16} color="#9333EA" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                Modern Tech Stack
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: '500' }}>
                Built with React 18, Supabase Realtime, and Web Audio synths.
              </div>
            </div>
          </div>

          {/* Platform Specifications */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              PLATFORM SPECIFICATIONS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <div>• <strong>Engine:</strong> React 18 + Vite SPA</div>
              <div>• <strong>Multiplayer:</strong> Supabase WebSockets</div>
              <div>• <strong>Latency:</strong> Sub-15ms Live Sync</div>
              <div>• <strong>Audio:</strong> Web Audio Synth Engine</div>
              <div>• <strong>Storage:</strong> Isolated Local & Cloud Profiles</div>
              <div>• <strong>Disciplines:</strong> 5 Tournament Games</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
            Crafted for speed, strategy, and fair play.
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onExploreGames) onExploreGames();
            }}
            className="btn-primary"
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <span>EXPLORE ARENA GAMES</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
