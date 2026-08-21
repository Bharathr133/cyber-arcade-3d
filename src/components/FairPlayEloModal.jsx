import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Trophy, Award, Lock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { getTier } from '../utils/userProfile.js';

export default function FairPlayEloModal({
  isOpen,
  onClose,
  currentUserProfile
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

  const currentTier = getTier(currentUserProfile?.rating || 1200, (currentUserProfile?.wins || 0) + (currentUserProfile?.losses || 0));

  const TIERS = [
    { name: 'Bronze Novice', elo: '0 - 1199', color: '#94A3B8', bg: '#F1F5F9' },
    { name: 'Silver Tactician', elo: '1200 - 1399', color: '#64748B', bg: '#F8FAFC' },
    { name: 'Gold Strategist', elo: '1400 - 1599', color: '#EAB308', bg: '#FEFCE8' },
    { name: 'Platinum Master', elo: '1600 - 1799', color: '#06B6D4', bg: '#ECFEFF' },
    { name: 'Diamond Grandmaster', elo: '1800+', color: '#8B5CF6', bg: '#F5F3FF' }
  ];

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
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                Fair Play & ELO System
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                Standardized mathematical rating & anti-cheat integrity
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
          {/* ELO Formula Overview */}
          <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              MATHEMATICAL ELO FORMULA
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              <strong>games4u</strong> implements the international chess standard Elo rating algorithm (\(K = 32\)). Your rating reflects your calculated skill relative to your opponents:
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
              <li>Defeating a higher-ranked player awards significant bonus rating points.</li>
              <li>Defeating a lower-ranked player yields a standard victory increment.</li>
              <li>Ties / draws adjust ratings slightly based on expected win probability.</li>
            </ul>
          </div>

          {/* Arena Tiers */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              COMPETITIVE RANK TIERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
              {TIERS.map(t => (
                <div
                  key={t.name}
                  style={{
                    background: t.bg, border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '12px',
                    display: 'flex', flexDirection: 'column', gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: t.color }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                    {t.elo} ELO
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fair Play Policy */}
          <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              FAIR PLAY & INTEGRITY RULES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569' }}>
              <div>• <strong>Anti-Forfeit Protections:</strong> Disconnecting or intentionally stalling turns forfeits the active match.</div>
              <div>• <strong>Deterministic State Verification:</strong> All board moves are cryptographically validated by WebSockets state.</div>
              <div>• <strong>No Engine Assistance:</strong> Third-party solvers or automated bots in ranked online matches are strictly prohibited.</div>
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
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
