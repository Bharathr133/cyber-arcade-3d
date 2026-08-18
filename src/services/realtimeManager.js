// Enterprise Realtime Manager (Zero-Latency Move Broadcasting, Presence, Emoji Reactions & Sync)
import { getSupabase } from '../utils/supabaseClient.js';

class RealtimeManager {
  constructor() {
    this.activeChannels = new Map();
    this.activePollTimers = new Map();
    this.localVersions = new Map();
    this.disconnectTimers = new Map();
  }

  // 1. Subscribe to Match Channel (Move Broadcasting, Ephemeral Emojis & Real-time State Sync)
  subscribeToMatch(matchId, userId, callbacks = {}) {
    const supabase = getSupabase();
    if (!supabase || !matchId) return;

    this.leaveMatch(matchId);

    const channelName = `game_match:${matchId}`;

    // Purge duplicate cached channels from Supabase client registry
    try {
      const existing = (supabase.getChannels ? supabase.getChannels() : []).find(
        ch => ch.topic === `realtime:${channelName}` || ch.topic === channelName || ch.subTopic === channelName
      );
      if (existing) {
        supabase.removeChannel(existing);
      }
    } catch (e) {}

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: true },
        presence: { key: userId || matchId }
      }
    });

    // 1.A Zero-Latency Move Broadcast Listener (<10ms WebSocket)
    channel.on('broadcast', { event: 'match_move' }, (payload) => {
      const moveData = payload.payload || payload;
      if (callbacks.onStateUpdate && moveData) {
        callbacks.onStateUpdate(moveData);
      }
    });

    // 1.B Ephemeral In-Game Emoji Reaction Listener (Zero DB overhead)
    channel.on('broadcast', { event: 'reaction_emoji' }, (payload) => {
      const data = payload.payload || payload;
      if (callbacks.onReactionEmoji && data) {
        callbacks.onReactionEmoji(data);
      }
    });

    // 1.C Authoritative PostgreSQL State Change Listener
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_states', filter: `match_id=eq.${matchId}` },
      (payload) => {
        if (!payload.new) return;
        const incomingVersion = payload.new.state_version || 0;
        const localVersion = this.localVersions.get(matchId) || 0;

        if (incomingVersion >= localVersion) {
          this.localVersions.set(matchId, incomingVersion);
          if (callbacks.onStateUpdate) callbacks.onStateUpdate(payload.new);
        }
      }
    );

    // 1.D Opponent Presence & Disconnect Handling (Robust 30s Grace Period)
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const isOpponent = leftPresences.some(p => p.presence_ref !== userId);
      if (isOpponent) {
        this._startDisconnectGracePeriod(matchId, callbacks);
      }
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      const isOpponent = newPresences.some(p => p.presence_ref !== userId);
      if (isOpponent) {
        this._clearDisconnectGracePeriod(matchId);
        if (callbacks.onOpponentReconnect) callbacks.onOpponentReconnect();
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({ userId: userId || 'player', onlineAt: new Date().toISOString() });
        } catch (e) {}
      }
    });

    // 1.E Reliable Polling Fallback (Every 1.2s to guarantee move delivery even across cellular firewalls)
    const matchPollTimer = setInterval(async () => {
      try {
        const { data: latestState } = await supabase
          .from('game_states')
          .select('*')
          .eq('match_id', matchId)
          .maybeSingle();

        if (latestState) {
          const incomingVer = latestState.state_version || 0;
          const currentVer = this.localVersions.get(matchId) || 0;
          if (incomingVer > currentVer) {
            this.localVersions.set(matchId, incomingVer);
            if (callbacks.onStateUpdate) callbacks.onStateUpdate(latestState);
          }
        }
      } catch (e) {}
    }, 1200);

    this.activePollTimers.set(channelName, matchPollTimer);
    this.activeChannels.set(channelName, channel);
    return channel;
  }

  // 2. Send Ephemeral In-Game Reaction Emoji (Zero DB Storage)
  async sendReaction(matchId, emoji, senderName = 'Player') {
    if (!matchId || !emoji) return;
    const channelName = `game_match:${matchId}`;
    let channel = this.activeChannels.get(channelName);
    const supabase = getSupabase();
    if (!channel && supabase) {
      channel = supabase.channel(channelName);
      channel.subscribe();
    }
    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'reaction_emoji',
          payload: {
            emoji,
            senderName,
            timestamp: Date.now()
          }
        });
      } catch (e) {}
    }
  }

  // 3. Subscribe to Room Channel (Lobby, Match Ready & Start Game Broadcast)
  subscribeToRoom(roomId, userId, callbacks = {}) {
    const supabase = getSupabase();
    if (!supabase || !roomId) return;

    this.leaveRoom(roomId);

    const channelName = `game_room:${roomId}`;

    try {
      const existing = (supabase.getChannels ? supabase.getChannels() : []).find(
        ch => ch.topic === `realtime:${channelName}` || ch.topic === channelName || ch.subTopic === channelName
      );
      if (existing) {
        supabase.removeChannel(existing);
      }
    } catch (e) {}

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: true },
        presence: { key: userId || roomId }
      }
    });

    // 3.A Start Game Broadcast Listener
    channel.on('broadcast', { event: 'start_game' }, () => {
      if (callbacks.onGameStartRequested) callbacks.onGameStartRequested();
    });

    // 3.B Instant Player Joined Broadcast Listener (<10ms)
    channel.on('broadcast', { event: 'player_joined' }, (payload) => {
      const data = payload.payload || payload;
      if (callbacks.onPlayerJoined && data) {
        callbacks.onPlayerJoined(data);
      }
    });

    const handleRoomPlaying = async (roomRecord) => {
      try {
        const { data: matchData } = await supabase
          .from('matches')
          .select('id, room_id, player_1_id, player_2_id')
          .eq('room_id', roomId)
          .eq('result', 'ACTIVE')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const matchId = matchData?.id || roomRecord.id;
        const opponentId = (matchData?.player_1_id === userId) ? matchData?.player_2_id : matchData?.player_1_id;

        let oppName = 'Opponent';
        let oppAvatar = '2';
        if (opponentId) {
          const { data: oppProfile } = await supabase
            .from('profiles')
            .select('id, username, display_name, name, avatar_url, avatar_id')
            .eq('id', opponentId)
            .maybeSingle();

          if (oppProfile) {
            oppName = oppProfile.display_name || oppProfile.name || oppProfile.username || 'Opponent';
            oppAvatar = oppProfile.avatar_url || oppProfile.avatar_id || '2';
          }
        }

        const payload = {
          match_id: matchId,
          room_id: roomId,
          opponent: {
            name: oppName,
            avatarId: oppAvatar,
            rating: 1200
          }
        };

        if (callbacks.onPlayerJoined) callbacks.onPlayerJoined(payload);
      } catch (e) {}
    };

    // 3.C Room State Change Listener
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
      async (payload) => {
        if (!payload.new) return;
        if (payload.new.status === 'PLAYING') {
          await handleRoomPlaying(payload.new);
        } else if (payload.new.status === 'CANCELLED' || payload.new.status === 'EXPIRED') {
          if (callbacks.onRoomClosed) callbacks.onRoomClosed(payload.new.status);
        }
      }
    );

    // 3.D Room Polling Fallback
    const pollInterval = setInterval(async () => {
      try {
        const { data: room } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
        if (room?.status === 'PLAYING') {
          clearInterval(pollInterval);
          await handleRoomPlaying(room);
        } else if (room?.status === 'CANCELLED' || room?.status === 'EXPIRED') {
          clearInterval(pollInterval);
          if (callbacks.onRoomClosed) callbacks.onRoomClosed(room.status);
        }
      } catch (e) {}
    }, 1500);

    this.activePollTimers.set(channelName, pollInterval);
    channel.subscribe();
    this.activeChannels.set(channelName, channel);
    return channel;
  }

  // 4. Broadcast Event to Room
  async broadcastToRoom(roomId, event, payload = {}) {
    const channelName = `game_room:${roomId}`;
    let channel = this.activeChannels.get(channelName);
    const supabase = getSupabase();
    if (!channel && supabase) {
      channel = supabase.channel(channelName);
      channel.subscribe();
    }
    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: event,
          payload: payload
        });
      } catch (e) {}
    }
  }

  // 5. Broadcast Event to Match (Moves & State Updates)
  async broadcastToMatch(matchId, event, payload = {}) {
    const channelName = `game_match:${matchId}`;
    let channel = this.activeChannels.get(channelName);
    const supabase = getSupabase();
    if (!channel && supabase) {
      channel = supabase.channel(channelName);
      channel.subscribe();
    }
    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: event,
          payload: payload
        });
      } catch (e) {}
    }
  }

  // 5.B Send In-Game Emoji Reaction
  async sendReaction(matchId, emoji, senderName) {
    await this.broadcastToMatch(matchId, 'reaction_emoji', {
      emoji,
      sender: senderName,
      timestamp: Date.now()
    });
  }


  // 6. Cleanup
  leaveMatch(matchId) {
    this._clearDisconnectGracePeriod(matchId);
    this.localVersions.delete(matchId);
    const channelName = `game_match:${matchId}`;
    if (this.activePollTimers.has(channelName)) {
      clearInterval(this.activePollTimers.get(channelName));
      this.activePollTimers.delete(channelName);
    }
    if (this.activeChannels.has(channelName)) {
      const channel = this.activeChannels.get(channelName);
      const supabase = getSupabase();
      if (supabase) supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
    }
  }

  leaveRoom(roomId) {
    const channelName = `game_room:${roomId}`;
    if (this.activePollTimers.has(channelName)) {
      clearInterval(this.activePollTimers.get(channelName));
      this.activePollTimers.delete(channelName);
    }
    if (this.activeChannels.has(channelName)) {
      const channel = this.activeChannels.get(channelName);
      const supabase = getSupabase();
      if (supabase) supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
    }
  }

  unsubscribe() {
    this.activePollTimers.forEach(timer => clearInterval(timer));
    this.activePollTimers.clear();
    this.activeChannels.forEach((channel) => {
      const supabase = getSupabase();
      if (supabase) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
    });
    this.activeChannels.clear();
    this.disconnectTimers.forEach(timer => clearTimeout(timer));
    this.disconnectTimers.clear();
  }

  _startDisconnectGracePeriod(matchId, callbacks) {
    this._clearDisconnectGracePeriod(matchId);
    if (callbacks.onOpponentDisconnect) callbacks.onOpponentDisconnect();

    // 30-Second Robust Disconnect Grace Period (Gives opponent ample time to reconnect/switch apps)
    const timer = setTimeout(() => {
      if (callbacks.onMatchAbandoned) callbacks.onMatchAbandoned();
      this.disconnectTimers.delete(matchId);
    }, 30000);

    this.disconnectTimers.set(matchId, timer);
  }

  _clearDisconnectGracePeriod(matchId) {
    if (this.disconnectTimers.has(matchId)) {
      clearTimeout(this.disconnectTimers.get(matchId));
      this.disconnectTimers.delete(matchId);
    }
  }
}

export const realtimeManager = new RealtimeManager();
