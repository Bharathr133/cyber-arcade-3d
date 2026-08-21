import React, { useState, useEffect } from 'react';
import { X, Zap, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { adminService } from '../services/adminService.js';

import { getSupabase } from '../utils/supabaseClient.js';

export default function BroadcastBanner({ isInsideGame = false, isInsideAdmin = false }) {
  const [broadcast, setBroadcast] = useState(() => adminService.getBroadcastConfig());
  const [dismissedMessage, setDismissedMessage] = useState(() => {
    try {
      return localStorage.getItem('games4u_dismissed_announcement') || 
             sessionStorage.getItem('games4u_dismissed_announcement') || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    // 0. Fetch latest from Supabase on mount
    adminService.fetchBroadcastFromCloud().then((cloudConfig) => {
      if (cloudConfig) {
        setBroadcast(cloudConfig);
      }
    }).catch(() => {});

    // 1. Local event listener for same-tab / same-browser changes
    const handleBroadcastChange = (e) => {
      if (e.detail) {
        setBroadcast(e.detail);
      }
    };
    window.addEventListener('games4u_broadcast_change', handleBroadcastChange);

    // 2. Supabase Realtime channel for live multi-player & multi-device broadcast
    const supabase = getSupabase();
    let channel = null;
    if (supabase) {
      channel = supabase.channel('platform_announcements');
      channel
        .on('broadcast', { event: 'announcement_update' }, (eventData) => {
          if (eventData?.payload) {
            setBroadcast(eventData.payload);
          }
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('games4u_broadcast_change', handleBroadcastChange);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleDismiss = () => {
    const msg = broadcast?.message || '';
    if (msg) {
      setDismissedMessage(msg);
      try {
        localStorage.setItem('games4u_dismissed_announcement', msg);
        sessionStorage.setItem('games4u_dismissed_announcement', msg);
      } catch (e) {}
    }
    setBroadcast(prev => ({ ...prev, active: false }));
  };

  const storedDismissed = (() => {
    try {
      return localStorage.getItem('games4u_dismissed_announcement') || 
             sessionStorage.getItem('games4u_dismissed_announcement') || '';
    } catch (e) {
      return '';
    }
  })();

  // DO NOT display during active gameplay, inside admin console, or if inactive/dismissed
  if (isInsideGame || isInsideAdmin || !broadcast?.active || !broadcast?.message) {
    return null;
  }

  // If the user already dismissed this specific message permanently, do not show
  if (dismissedMessage === broadcast.message || storedDismissed === broadcast.message) {
    return null;
  }



  const type = broadcast.type || 'info';

  const typeStyles = {
    event: {
      bg: 'bg-purple-700 text-white border-purple-800 shadow-md',
      badge: 'bg-purple-900/60 text-purple-100 border-purple-400/40',
      icon: Zap
    },

    warning: {
      bg: 'bg-amber-600 text-white border-amber-700 shadow-md',
      badge: 'bg-amber-800/60 text-amber-100 border-amber-300/40',
      icon: AlertTriangle
    },
    critical: {
      bg: 'bg-red-600 text-white border-red-700 shadow-md',
      badge: 'bg-red-800/60 text-red-100 border-red-300/40',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-600 text-white border-blue-700 shadow-md',
      badge: 'bg-blue-800/60 text-blue-100 border-blue-300/40',
      icon: Info
    }
  };

  const style = typeStyles[type] || typeStyles.info;
  const IconComp = style.icon;

  return (
    <div className={`w-full border-b ${style.bg} px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md z-[90] relative animate-pop-in`}>
      <div className="flex items-center gap-3 mx-auto max-w-4xl min-w-0 pr-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono flex-shrink-0 ${style.badge}`}>
          <IconComp size={12} className="stroke-[2.5]" />
          <span>NOTICE</span>
        </span>
        <span className="truncate text-white font-bold">{broadcast.message}</span>
      </div>

      {/* Prominent, High-Contrast Dismiss 'X' Button */}
      <button
        onClick={handleDismiss}
        className="p-1.5 rounded-lg bg-black/25 hover:bg-black/50 active:scale-95 text-white border border-white/30 hover:border-white/60 transition-all flex-shrink-0 cursor-pointer shadow-sm flex items-center justify-center ml-2"
        title="Dismiss announcement"
        aria-label="Dismiss announcement"
      >
        <X size={15} className="stroke-[2.5]" />
      </button>

    </div>
  );
}

