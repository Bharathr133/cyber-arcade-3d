// Global Platform Presence Service (Real-time Online Players Counter & Heartbeat)
import { getSupabase } from '../utils/supabaseClient.js';
import { getUserProfile, generateUUID } from '../utils/userProfile.js';

function getLocalUUID() {
  if (typeof generateUUID === 'function') return generateUUID();
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'u_' + Math.random().toString(36).substring(2, 11);
}


class PresenceService {
  constructor() {
    this.channel = null;
    this.onlineCount = 1;
    this.listeners = new Set();
    this.currentUserId = null;
  }

  // Subscribe to global platform presence channel
  initPresence(userProfile = null) {
    const supabase = getSupabase();
    if (!supabase) return;

    if (this.channel) {
      try { supabase.removeChannel(this.channel); } catch (e) {}
      this.channel = null;
    }

    const local = userProfile || getUserProfile();
    this.currentUserId = local?.id || getLocalUUID();
    const playerName = local?.name || 'Player';

    const avatarId = local?.avatarId || '1';

    this.channel = supabase.channel('arcade_global_presence', {
      config: {
        presence: {
          key: this.currentUserId
        }
      }
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        const keys = Object.keys(state);
        // Calculate count, ensure at least 1 (self)
        this.onlineCount = Math.max(1, keys.length);
        this.notifyListeners();
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const state = this.channel.presenceState();
        this.onlineCount = Math.max(1, Object.keys(state).length);
        this.notifyListeners();
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const state = this.channel.presenceState();
        this.onlineCount = Math.max(1, Object.keys(state).length);
        this.notifyListeners();
      });

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await this.channel.track({
            userId: this.currentUserId,
            name: playerName,
            avatarId: avatarId,
            onlineAt: new Date().toISOString()
          });
        } catch (e) {}
      }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.onlineCount);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(this.onlineCount); } catch (e) {}
    });
  }

  getOnlineCount() {
    return this.onlineCount;
  }

  cleanup() {
    if (this.channel) {
      const supabase = getSupabase();
      if (supabase) {
        try { supabase.removeChannel(this.channel); } catch (e) {}
      }
      this.channel = null;
    }
  }
}

export const presenceService = new PresenceService();
