import React from 'react';
import { ExternalLink, ShieldCheck, Zap } from 'lucide-react';

export default function EnterpriseFooter() {
  return (
    <footer
      className="desktop-footer"
      style={{
        width: '100%',
        maxWidth: '100%',
        marginTop: 'auto',
        paddingTop: '36px',
        paddingBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid #E4E4E7'
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
        {/* Brand & Platform Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: '#18181B', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={13} fill="#FFFFFF" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: '800', color: '#18181B' }}>
            games4u
          </span>
          <span style={{ color: '#A1A1AA' }}>•</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#52525B' }}>
            Competitive 3D Board & Strategy Arena
          </span>
        </div>

        {/* Live Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '8px',
          background: '#FFFFFF',
          border: '1px solid #E4E4E7',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#52525B'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
          <span>Multiplayer Realtime Engine • Low Latency</span>
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
        color: '#A1A1AA'
      }}>
        <span>© {new Date().getFullYear()} games4u. All rights reserved.</span>

        <div style={{ display: 'flex', gap: '14px' }}>
          <span>Free Online Strategy Games</span>
        </div>
      </div>
    </footer>


  );
}
