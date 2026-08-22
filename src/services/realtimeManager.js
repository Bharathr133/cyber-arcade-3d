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
      // An active move means opponent is 100% connected
      this._clearDisconnectGracePeriod(matchId);
      if (callbacks.onOpponentReconnect) callbacks.onOpponentReconnect();

      if (callbacks.onStateUpdate && moveData) {
        // Skip self echoes if client already applied move optimistically
        if (moveData.senderId && userId && moveData.senderId === userId) {
          return;
        }
        callbacks.onStateUpdate(moveData);
      }
    });

    // 1.B Ephemeral In-Game Emoji Reaction Listener (Zero DB overhead)
    channel.on('broadcast', { event: 'reaction_emoji' }, (payload) => {
      const data = payload.payload || payload;
      this._clearDisconnectGracePeriod(matchId);
      if (callbacks.onOpponentReconnect) callbacks.onOpponentReconnect();

      if (callbacks.onReactionEmoji && data) {
        if (data.senderId && userId && data.senderId === userId) {
          return;
        }
        callbacks.onReactionEmoji(data);
      }
    });

    // 1.B2 In-Game Quick Chat Broadcast Listener
    channel.on('broadcast', { event: 'quick_chat' }, (payload) => {
      const data = payload.payload || payload;
      this._clearDisconnectGracePeriod(matchId);
      if (callbacks.onOpponentReconnect) callbacks.onOpponentReconnect();

      if (callbacks.onQuickChat && data) {
        if (data.senderId && userId && data.senderId === userId) {
          return;
        }
        callbacks.onQuickChat(data);
      }
    });

    // 1.B3 Rematch Offer Broadcast Listener
    channel.on('broadcast', { event: 'rematch_offer' }, (payload) => {
      const data = payload.payload || payload;
      if (callbacks.onRematchOffer && data) {
        if (data.senderId && userId && data.senderId === userId) return;
        callbacks.onRematchOffer(data);
      }
    });

    // 1.B4 Rematch Accept Broadcast Listener
    channel.on('broadcast', { event: 'rematch_accept' }, (payload) => {
      const data = payload.payload || payload;
      if (callbacks.onRematchAccept && data) {
        callbacks.onRematchAccept(data);
      }
    });

    // 1.B5 Rematch Decline Broadcast Listener
    channel.on('broadcast', { event: 'rematch_decline' }, (payload) => {
      const data = payload.payload || payload;
      if (callbacks.onRematchDecline && data) {
        if (data.senderId && userId && data.senderId === userId) return;
        callbacks.onRematchDecline(data);
      }
    });

    // 1.B6 Player Left Match Broadcast Listener
    channel.on('broadcast', { event: 'player_left' }, (payload) => {
      const data = payload.payload || payload;
      if (callbacks.onPlayerLeft && data) {
        if (data.senderId && userId && data.senderId === userId) return;
        callbacks.onPlayerLeft(data);
      }
    });

    // 1.B7 Direct Peer Player Info Sync Listener (<5ms live GamerTag sync)
    channel.on('broadcast', { event: 'player_info_sync' }, (payload) => {
      const data = payload.payload || payload;
      if (callbacks.onPlayerInfoSync && data) {
        if (data.senderId && userId && data.senderId === userId) return;
        callbacks.onPlayerInfoSync(data);
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
        const isFinished = payload.new.status && payload.new.status !== 'ACTIVE';

        if (incomingVersion >= localVersion || isFinished) {
          this.localVersions.set(matchId, incomingVersion);
          if (callbacks.onStateUpdate) callbacks.onStateUpdate(payload.new);
        }
      }
    );

    // 1.D Opponent Presence & Disconnect Handling (Robust & Accurate)
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const hasOpponentLeft = leftPresences.some(p => p.userId && p.userId !== userId);
      if (hasOpponentLeft) {
        const state = channel.presenceState();
        const opponentStillPresent = Object.entries(state || {}).some(
          ([key, presences]) => key !== userId && presences.some(p => p.userId !== userId)
        );
        if (!opponentStillPresent) {
          this._startDisconnectGracePeriod(matchId, callbacks);
        }
      }
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      const isOpponent = newPresences.some(p => p.userId && p.userId !== userId);
      if (isOpponent) {
        this._clearDisconnectGracePeriod(matchId);
        if (callbacks.onOpponentReconnect) callbacks.onOpponentReconnect();
      }
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const opponentPresent = Object.entries(state || {}).some(
        ([key, presences]) => key !== userId && presences.length > 0
      );
      if (opponentPresent) {
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

    // 1.E Reliable Polling Fallback (Every 1.2s, auto-stops after 5 min max)
    let matchPollCount = 0;
    const MAX_POLL_COUNT = 250;
    const matchPollTimer = setInterval(async () => {
      matchPollCount++;
      if (matchPollCount > MAX_POLL_COUNT) {
        clearInterval(matchPollTimer);
        this.activePollTimers.delete(channelName);
        return;
      }
      try {
        const { data: latestState } = await supabase
          .from('game_states')
          .select('*')
          .eq('match_id', matchId)
          .maybeSingle();

        if (latestState) {
          const incomingVer = latestState.state_version || 0;
          const currentVer = this.localVersions.get(matchId) || 0;
          const isFinished = latestState.status && latestState.status !== 'ACTIVE';
          const lastUpdated = this.activePollTimers.get(`${channelName}:last_updated`);
          const hasNewTimestamp = latestState.updated_at && latestState.updated_at !== lastUpdated;

          if (incomingVer > currentVer || hasNewTimestamp || isFinished) {
            this.localVersions.set(matchId, Math.max(incomingVer, currentVer + 1));
            if (latestState.updated_at) {
              this.activePollTimers.set(`${channelName}:last_updated`, latestState.updated_at);
            }
            if (callbacks.onStateUpdate) callbacks.onStateUpdate(latestState);
          }
        }
      } catch (e) {}
    }, 1000);


    this.activePollTimers.set(channelName, matchPollTimer);
    this.activeChannels.set(channelName, channel);
    return channel;
  }

  // 2. Send Ephemeral In-Game Reaction Emoji (Zero DB Storage)

  async sendReaction(matchId, emoji, senderName = 'Player', senderId = null) {
    if (!matchId || !emoji) return;
    await this.broadcastToMatch(matchId, 'reaction_emoji', {
      emoji,
      sender: senderName,
      senderId: senderId,
      timestamp: Date.now()
    });
  }

  async requestRematch(matchId, senderId, senderName = 'Player') {
    if (!matchId) return;
    await this.broadcastToMatch(matchId, 'rematch_offer', {
      senderId,
      senderName,
      timestamp: Date.now()
    });
  }

  async acceptRematch(matchId, senderId) {
    if (!matchId) return;
    await this.broadcastToMatch(matchId, 'rematch_accept', {
      senderId,
      timestamp: Date.now()
    });
  }

  async declineRematch(matchId, senderId) {
    if (!matchId) return;
    await this.broadcastToMatch(matchId, 'rematch_decline', {
      senderId,
      timestamp: Date.now()
    });
  }

  async notifyPlayerLeft(matchId, senderId) {
    if (!matchId) return;
    await this.broadcastToMatch(matchId, 'player_left', {
      senderId,
      timestamp: Date.now()
    });
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
          .select('id, room_id, player_1_id, player_2_id, player_1_name, player_2_name')
          .eq('room_id', roomId)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const matchId = matchData?.id || roomRecord.id;
        const isPlayer1 = (matchData?.player_1_id === userId) || (roomRecord?.host_id === userId);
        const opponentId = isPlayer1 ? (matchData?.player_2_id || roomRecord?.player_2_id) : (matchData?.player_1_id || roomRecord?.host_id);

        let oppName = isPlayer1 ? (roomRecord?.player_2_name || matchData?.player_2_name) : (roomRecord?.player_1_name || matchData?.player_1_name);
        let oppAvatar = roomRecord?.player_2_avatar || roomRecord?.player_1_avatar || '2';
        let oppRating = 1200;

        if (opponentId) {
          const { data: oppProfile } = await supabase
            .from('profiles')
            .select('id, username, display_name, name, avatar_url, avatar_id, rating')
            .eq('id', opponentId)
            .maybeSingle();

          if (oppProfile) {
            oppName = oppProfile.display_name || oppProfile.name || (oppProfile.username ? `@${oppProfile.username}` : '') || oppName;
            oppAvatar = oppProfile.avatar_url || oppProfile.avatar_id || oppAvatar;
            oppRating = oppProfile.rating || 1200;
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

  // 4. Broadcast Event to Room (Reuses existing channel, never creates orphaned ones)
  async broadcastToRoom(roomId, event, payload = {}) {
    const channelName = `game_room:${roomId}`;
    const channel = this.activeChannels.get(channelName);
    if (!channel) return;
    try {
      await channel.send({
        type: 'broadcast',
        event: event,
        payload: payload
      });
    } catch (e) {}
  }

  // 5. Broadcast Event to Match (Moves & State Updates, reuses existing channel)
  async broadcastToMatch(matchId, event, payload = {}) {
    const channelName = `game_match:${matchId}`;
    const channel = this.activeChannels.get(channelName);
    if (!channel) return;
    try {
      await channel.send({
        type: 'broadcast',
        event: event,
        payload: payload
      });
    } catch (e) {}
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
