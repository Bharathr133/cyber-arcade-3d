import React, { Component } from 'react';
import { AlertTriangle, RotateCcw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL UNCAUGHT UI ERROR:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(180deg, #0b1329 0%, #090e1f 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-body)'
        }}>
          <div style={{
            width: 'min(94vw, 460px)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
            }}>
              <ShieldAlert size={30} />
            </div>

            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: '900',
                margin: '0 0 6px 0',
                color: '#ffffff'
              }}>
                Match Session Interrupted
              </h1>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#94a3b8',
                lineHeight: '1.5'
              }}>
                The client encountered an unexpected runtime state. Your competitive ratings and account are safely preserved.
              </p>
            </div>

            {this.state.error?.message && (
              <div style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#fca5a5',
                textAlign: 'left',
                overflowX: 'auto',
                boxSizing: 'border-box'
              }}>
                {this.state.error.message.slice(0, 150)}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '10px',
              width: '100%',
              marginTop: '8px'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={15} />
                <span>Reload Arena</span>
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Home size={15} />
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
