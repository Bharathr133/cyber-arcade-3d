import React from 'react';

// Custom Crisp Vector Icon for Tic-Tac-Toe
export function TicTacToeIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* 3x3 Grid Lines */}
      <line x1="8" y1="2" x2="8" y2="22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="16" y1="2" x2="16" y2="22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="2" y1="8" x2="22" y2="8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="2" y1="16" x2="22" y2="16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Mini X (Coral / Rose) */}
      <line x1="3.5" y1="3.5" x2="6.5" y2="6.5" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
      <line x1="6.5" y1="3.5" x2="3.5" y2="6.5" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />

      {/* Mini O (Teal / Cyan) */}
      <circle cx="12" cy="12" r="2.2" stroke="#06b6d4" strokeWidth="2" fill="none" />

      {/* Mini X2 */}
      <line x1="17.5" y1="17.5" x2="20.5" y2="20.5" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
      <line x1="20.5" y1="17.5" x2="17.5" y2="20.5" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Custom Crisp Vector Icon for Connect 4
export function ConnectFourIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* 4 Connected Dropped Tokens */}
      <circle cx="5" cy="18" r="3.2" fill="#38bdf8" />
      <circle cx="9.5" cy="14" r="3.2" fill="#38bdf8" />
      <circle cx="14.5" cy="10" r="3.2" fill="#38bdf8" />
      <circle cx="19" cy="6" r="3.2" fill="#38bdf8" />

      {/* Opponent Blockers */}
      <circle cx="5" cy="10" r="2.8" fill="#e2e8f0" opacity="0.35" />
      <circle cx="14.5" cy="18" r="2.8" fill="#f59e0b" />
      <circle cx="19" cy="14" r="2.8" fill="#f59e0b" />
    </svg>
  );
}

// Custom Crisp Vector Icon for Gomoku
export function GomokuIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Intersection Grid Lines */}
      <line x1="4" y1="12" x2="20" y2="12" stroke="#94a3b8" strokeWidth="1.5" opacity="0.6" />
      <line x1="12" y1="4" x2="12" y2="20" stroke="#94a3b8" strokeWidth="1.5" opacity="0.6" />
      <line x1="6" y1="6" x2="18" y2="18" stroke="#94a3b8" strokeWidth="1.2" opacity="0.3" />
      <line x1="6" y1="18" x2="18" y2="6" stroke="#94a3b8" strokeWidth="1.2" opacity="0.3" />

      {/* Tactical Stones */}
      <circle cx="12" cy="12" r="3.5" fill="#2dd4bf" stroke="#0f172a" strokeWidth="1" />
      <circle cx="6" cy="6" r="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
      <circle cx="18" cy="18" r="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
    </svg>
  );
}
