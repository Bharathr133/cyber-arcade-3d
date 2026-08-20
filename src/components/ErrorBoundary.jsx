import React, { Component } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Errors logged strictly in developer console
    console.error('UI Runtime Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && !key.startsWith('championship_arena_stats')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#FAFAFA',
          color: '#18181B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)'
        }}>
          <div style={{
            width: 'min(92vw, 440px)',
            background: '#FFFFFF',
            border: '1px solid #E4E4E7',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={24} />
            </div>

            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading, system-ui, sans-serif)',
                fontSize: '18px',
                fontWeight: '800',
                margin: '0 0 6px 0',
                color: '#18181B',
                letterSpacing: '-0.01em'
              }}>
                Something went wrong
              </h1>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#71717A',
                lineHeight: '1.5'
              }}>
                An unexpected issue occurred.
              </p>

            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              width: '100%',
              marginTop: '8px'
            }}>
              <button
                onClick={this.handleReload}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  gap: '6px'
                }}
              >
                <RotateCcw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleReset}
                className="btn-secondary"
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  gap: '6px'
                }}
              >
                <Home size={14} />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
