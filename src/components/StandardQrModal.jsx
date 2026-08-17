import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Check, X, UserCheck, ShieldCheck, QrCode, ArrowRight } from 'lucide-react';

export default function StandardQrModal({
  isOpen,
  onClose,
  shareUrl,
  isConnected,
  gameTitle
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Play ${gameTitle} with me!`,
          text: `Join my live 2-player ${gameTitle} match:`,
          url: shareUrl
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="card-enterprise animate-pop-in" style={{
        width: 'min(94vw, 420px)',
        padding: 'clamp(20px, 5vw, 30px) clamp(16px, 4vw, 24px)',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: '20px',
        textAlign: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '12px', background: '#eff6ff',
          color: '#2563eb', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '800',
          marginBottom: '8px'
        }}>
          <QrCode size={14} />
          <span>INVITE A FRIEND</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0' }}>
          PLAY {gameTitle} (2-PLAYER)
        </h2>

        {/* QR Code */}
        <div style={{
          display: 'inline-flex',
          padding: '14px',
          background: '#ffffff',
          border: isConnected ? '2.5px solid #16a34a' : '2px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '16px',
          transition: 'all 0.3s ease'
        }}>
          <QRCodeSVG
            value={shareUrl}
            size={180}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: '16px' }}>
          {isConnected ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 18px',
              borderRadius: '20px',
              background: '#ecfdf5',
              border: '1.5px solid #10b981',
              color: '#059669',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              <UserCheck size={16} />
              <span>FRIEND CONNECTED! READY TO PLAY</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <span>Scan QR code or share the link with your friend</span>
            </div>
          )}
        </div>

        {/* Share & Copy Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={handleNativeShare}
            className="btn-primary"
            style={{ flex: 1, padding: '10px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Share2 size={15} />
            <span>{shared ? 'OPENED SHARE!' : 'SHARE TO APPS'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
          </button>
        </div>

        {/* Start Game Button when connected */}
        {isConnected && (
          <button
            onClick={onClose}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '13px',
              background: '#16a34a',
              borderColor: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>START MATCH</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
