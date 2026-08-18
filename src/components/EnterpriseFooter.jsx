import React from 'react';
import { ExternalLink, Heart, ShieldCheck, Zap, Globe, Github } from 'lucide-react';

export default function EnterpriseFooter() {
  return (
    <footer
      className="desktop-footer"
      style={{
        width: '100%',
        maxWidth: '100%',
        marginTop: 'auto',
        paddingTop: '40px',
        paddingBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid #e2e8f0'
      }}
    >


      {/* Top Footer Row */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand & Dev Credit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Zap size={14} />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
            2-PLAYER ARENA
          </span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#64748b' }}>
            Developed by{' '}
            <a
              href="https://bharathr.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              Bharath R
              <ExternalLink size={11} />
            </a>
          </span>
        </div>

        {/* Live Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#475569'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
          <span>WebRTC P2P • Anti-Cheat Active</span>
        </div>
      </div>

      {/* Bottom Subtext */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <span>© {new Date().getFullYear()} Championship Arena. Zero-Latency Peer Gaming.</span>
        <div style={{ display: 'flex', gap: '14px' }}>
          <a
            href="https://bharathr.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Globe size={12} />
            <span>Portfolio</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
