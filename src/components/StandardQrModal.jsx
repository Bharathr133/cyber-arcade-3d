import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, X, QrCode } from 'lucide-react';

export default function StandardQrModal({
  isOpen,
  onClose,
  shareUrl,
  isConnected,
  gameTitle = 'GOMOKU'
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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
          text: `Join my live 2-player ${gameTitle} match on Championship Arena:`,
          url: shareUrl
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
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
    >
      <div
        className="card-enterprise animate-pop-in"
        style={{
          width: 'min(92vw, 400px)',
          padding: 'clamp(24px, 5vw, 32px) clamp(18px, 4vw, 24px)',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          textAlign: 'center',
          position: 'relative',
          boxSizing: 'border-box',
          margin: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          title="Close Dialog"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={20} />
        </button>

        {/* Header Icon */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '18px',
          background: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          color: '#1d4ed8'
        }}>
          <QrCode size={26} />
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(20px, 4.5vw, 22px)',
          fontWeight: '900',
          color: '#0f172a',
          margin: '0 0 4px 0',
          letterSpacing: '-0.02em'
        }}>
          INVITE A FRIEND
        </h2>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: '#64748b',
          margin: '0 0 16px 0',
          lineHeight: 1.4
        }}>
          Scan QR or share link to play live <strong>{gameTitle}</strong> with 0ms lag!
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#ffffff',
          padding: '14px',
          borderRadius: '18px',
          border: '2px solid #e2e8f0',
          display: 'inline-flex',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '16px'
        }}>
          {shareUrl ? (
            <QRCodeSVG
              value={shareUrl}
              size={170}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          ) : (
            <div style={{ width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#94a3b8' }}>Generating QR...</span>
            </div>
          )}
        </div>

        {/* Live Status Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: isConnected ? '#ecfdf5' : '#f8fafc',
          border: `1.5px solid ${isConnected ? '#a7f3d0' : '#e2e8f0'}`,
          marginBottom: '18px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: '700',
          color: isConnected ? '#065f46' : '#64748b'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#10b981' : '#f59e0b',
            display: 'inline-block'
          }} />
          <span>{isConnected ? 'OPPONENT CONNECTED' : 'WAITING FOR OPPONENT TO SCAN...'}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{
              padding: '11px',
              borderRadius: '12px',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '42px'
            }}
          >
            {copied ? <Check size={16} color="#15803d" /> : <Copy size={16} />}
            <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="btn-primary"
            style={{
              padding: '11px',
              borderRadius: '12px',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '42px'
            }}
          >
            {shared ? <Check size={16} /> : <Share2 size={16} />}
            <span>{shared ? 'SHARED!' : 'SHARE APP'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
