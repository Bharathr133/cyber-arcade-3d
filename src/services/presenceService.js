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
    this.gameCounts = {
      connect4: 0,
      tictactoe: 0,
      gomoku: 0,
      memory: 0,
      ludo: 0
    };
    this.listeners = new Set();
    this.gameListeners = new Set();
    this.currentUserId = null;
    this.currentGameId = null;
    this.pollInterval = null;
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
    const playerName = local?.name;
    const avatarId = local?.avatarId || '1';



    this.channel = supabase.channel('arcade_global_presence', {
      config: {
        presence: {
          key: this.currentUserId
        }
      }
    });

    const updatePresenceState = () => {
      const state = this.channel.presenceState();
      const entries = Object.values(state).flat();
      this.onlineCount = Math.max(1, Object.keys(state).length);

      // Aggregate live counts by game from presence state
      const liveByGame = { connect4: 0, tictactoe: 0, gomoku: 0, memory: 0, ludo: 0 };
      entries.forEach(p => {
        if (p.gameId && liveByGame[p.gameId] !== undefined) {
          liveByGame[p.gameId] += 1;
        }
      });

      this.gameCounts = { ...this.gameCounts, ...liveByGame };
      this.notifyListeners();
      this.notifyGameListeners();
    };

    this.channel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, updatePresenceState)
      .on('presence', { event: 'leave' }, updatePresenceState);

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await this.channel.track({
            userId: this.currentUserId,
            name: playerName,
            avatarId: avatarId,
            gameId: this.currentGameId || null,
            onlineAt: new Date().toISOString()
          });
        } catch (e) {}
      }
    });

    // Start DB Active Rooms polling for per-game counts
    this.fetchDbPerGameCounts();
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => this.fetchDbPerGameCounts(), 15000);
  }

  // Update current game tracking for presence
  async setCurrentGame(gameId) {
    this.currentGameId = gameId;
    if (this.channel) {
      try {
        const local = getUserProfile();
        await this.channel.track({
          userId: this.currentUserId,
          name: local?.name,
          avatarId: local?.avatarId || '1',


          gameId: gameId || null,
          onlineAt: new Date().toISOString()
        });
      } catch (e) {}
    }
  }

  // Fetch real active rooms count from Supabase database
  async fetchDbPerGameCounts() {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: activeRooms, error } = await supabase
        .from('game_rooms')
        .select('game_slug, status')
        .in('status', ['WAITING', 'PLAYING'])
        .gt('created_at', thirtyMinutesAgo);

      if (!error && Array.isArray(activeRooms)) {
        const dbCounts = { connect4: 0, tictactoe: 0, gomoku: 0, memory: 0, ludo: 0 };
        activeRooms.forEach(room => {
          const slug = String(room.game_slug || '').toLowerCase();
          if (dbCounts[slug] !== undefined) {
            // PLAYING room has 2 players, WAITING has 1
            dbCounts[slug] += (room.status === 'PLAYING' ? 2 : 1);
          }
        });

        // Merge DB room players with presence
        this.gameCounts = {
          connect4: Math.max(dbCounts.connect4, this.gameCounts.connect4 || 0),
          tictactoe: Math.max(dbCounts.tictactoe, this.gameCounts.tictactoe || 0),
          gomoku: Math.max(dbCounts.gomoku, this.gameCounts.gomoku || 0),
          memory: Math.max(dbCounts.memory, this.gameCounts.memory || 0),
          ludo: Math.max(dbCounts.ludo, this.gameCounts.ludo || 0)
        };

        this.notifyGameListeners();
      }
    } catch (e) {}
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.onlineCount);
    return () => this.listeners.delete(listener);
  }

  subscribeGameCounts(listener) {
    this.gameListeners.add(listener);
    listener(this.gameCounts);
    return () => this.gameListeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(this.onlineCount); } catch (e) {}
    });
  }

  notifyGameListeners() {
    this.gameListeners.forEach(fn => {
      try { fn(this.gameCounts); } catch (e) {}
    });
  }

  getOnlineCount() {
    return this.onlineCount;
  }

  getGameCounts() {
    return this.gameCounts;
  }

  cleanup() {
    if (this.channel) {
      const supabase = getSupabase();
      if (supabase) {
        try { supabase.removeChannel(this.channel); } catch (e) {}
      }
      this.channel = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    this.gameListeners.clear();
    this.onlineCount = 1;
  }
}

export const presenceService = new PresenceService();

