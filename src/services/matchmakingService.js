import { getSupabase } from '../utils/supabaseClient.js';
import { getUserProfile, generateUUID } from '../utils/userProfile.js';
import { fetchFromApi } from './apiClient.js';

class MatchmakingService {
  getEffectiveUser(userId, name, avatarId) {
    const local = getUserProfile();
    return {
      userId: userId || local?.id || generateUUID(),
      name: name || local?.name || 'Player',
      avatarId: avatarId || local?.avatarId || '1'
    };
  }

  // 1. Quick Match (Atomic Pairwise Matchmaking)
  async findOrCreatePublicMatch(gameSlug, userId = null, playerName = null, avatarId = null) {
    const user = this.getEffectiveUser(userId, playerName, avatarId);

    // 1. Try Serverless Backend Proxy first
    const apiRes = await fetchFromApi('/api/matchmaking', {
      method: 'POST',
      body: JSON.stringify({
        action: 'find-or-create',
        gameType: gameSlug,
        player: {
          id: user.userId,
          name: user.name,
          avatarId: user.avatarId
        }
      })
    });

    if (apiRes.ok && apiRes.data?.success && apiRes.data?.result) {
      return apiRes.data.result;
    }

    // 2. Direct Fallback
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'NO_DATABASE_CLIENT' };


    try {
      const { data, error } = await supabase.rpc('rpc_find_or_create_public_match', {
        p_game_slug: gameSlug,
        p_user_id: user.userId,
        p_player_name: user.name,
        p_avatar_id: user.avatarId
      });

      if (error) {
        console.error('[Matchmaking RPC Error]:', error);
        return { success: false, error: error.message || error.details || 'MATCHMAKING_ERROR' };
      }

      return data;
    } catch (e) {
      console.error('[Matchmaking Exception]:', e);
      return { success: false, error: e.message };
    }
  }

  // 2. Create Private Room
  async createRoom(gameSlug, isPrivate = false, userId = null, playerName = null, avatarId = null) {
    const user = this.getEffectiveUser(userId, playerName, avatarId);

    // 1. Try Serverless Backend Proxy first
    const apiRes = await fetchFromApi('/api/matchmaking', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create-room',
        gameType: gameSlug,
        isPrivate,
        player: {
          id: user.userId,
          name: user.name,
          avatarId: user.avatarId
        }
      })
    });

    if (apiRes.ok && apiRes.data?.success && apiRes.data?.result) {
      return apiRes.data.result;
    }

    // 2. Direct Fallback
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'NO_DATABASE_CLIENT' };

    try {
      const { data, error } = await supabase.rpc('rpc_create_room', {
        p_game_slug: gameSlug,
        p_is_private: isPrivate,
        p_user_id: user.userId,
        p_player_name: user.name,
        p_avatar_id: user.avatarId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 3. Join Room by Room Code or ID
  async joinRoom(roomCodeOrId, userId = null, playerName = null, avatarId = null) {
    const user = this.getEffectiveUser(userId, playerName, avatarId);

    // 1. Try Serverless Backend Proxy first
    const apiRes = await fetchFromApi('/api/matchmaking', {
      method: 'POST',
      body: JSON.stringify({
        action: 'join-room',
        roomCode: String(roomCodeOrId || '').trim().toUpperCase(),
        player: {
          id: user.userId,
          name: user.name,
          avatarId: user.avatarId
        }
      })
    });

    if (apiRes.ok && apiRes.data?.success && apiRes.data?.result) {
      return apiRes.data.result;
    }

    // 2. Direct Fallback
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'NO_DATABASE_CLIENT' };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomCodeOrId);

    try {
      const { data, error } = await supabase.rpc('rpc_join_room', {
        p_room_id: isUUID ? roomCodeOrId : null,
        p_room_code: isUUID ? null : roomCodeOrId,
        p_user_id: user.userId,
        p_player_name: user.name,
        p_avatar_id: user.avatarId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }


  // 4. Cancel Queue Ticket
  async cancelMatchmaking(roomId, userId = null) {
    const supabase = getSupabase();
    if (!supabase || !roomId) return { success: false };

    const user = this.getEffectiveUser(userId);

    try {
      await supabase.rpc('rpc_cancel_matchmaking', {
        p_room_id: roomId,
        p_user_id: user.userId
      });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}

export const matchmakingService = new MatchmakingService();
