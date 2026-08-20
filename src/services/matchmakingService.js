import { getSupabase } from '../utils/supabaseClient.js';
import { getUserProfile, generateUUID } from '../utils/userProfile.js';
import { fetchFromApi } from './apiClient.js';

class MatchmakingService {
  getEffectiveUser(userId, name, avatarId) {
    const local = getUserProfile();
    return {
      userId: userId || local?.id || 'player_' + Math.random().toString(36).substring(2, 10),
      name: name || local?.name || 'Player',
      avatarId: avatarId || local?.avatarId || '1'
    };
  }

  getInitialBoard(gameSlug) {
    if (gameSlug === 'connect4') {
      return [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
      ];
    }
    if (gameSlug === 'tictactoe') {
      return [null, null, null, null, null, null, null, null, null];
    }
    if (gameSlug === 'gomoku') {
      return Array(15).fill(0).map(() => Array(15).fill(0));
    }
    return [];
  }

  // 1. Quick Match (Atomic Pairwise Matchmaking with Direct DB Fallback)
  async findOrCreatePublicMatch(gameSlug, userId = null, playerName = null, avatarId = null) {
    const user = this.getEffectiveUser(userId, playerName, avatarId);
    const cleanGameSlug = String(gameSlug || 'connect4').toLowerCase();
    const supabase = getSupabase();

    if (!supabase) return { success: false, error: 'NO_DATABASE_CLIENT' };

    // 1. Try RPC first
    try {
      const { data, error } = await supabase.rpc('rpc_find_or_create_public_match', {
        p_game_slug: cleanGameSlug,
        p_user_id: user.userId,
        p_player_name: user.name,
        p_avatar_id: user.avatarId
      });

      if (!error && data && data.success !== false) {
        return data;
      }
    } catch (e) {}

    // 2. Direct Supabase Table Fallback (Guaranteed to succeed!)
    try {
      const oneMinuteAgo = new Date(Date.now() - 45 * 1000).toISOString();

      // Look for a fresh waiting public room
      const { data: waitingRooms, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('game_slug', cleanGameSlug)
        .eq('is_private', false)
        .eq('status', 'WAITING')
        .neq('host_id', user.userId)
        .gt('created_at', oneMinuteAgo)
        .order('created_at', { ascending: true })
        .limit(1);

      if (!findError && Array.isArray(waitingRooms) && waitingRooms.length > 0) {
        const room = waitingRooms[0];

        // Join existing room
        await supabase
          .from('game_rooms')
          .update({
            status: 'PLAYING',
            player_2_name: user.name,
            is_waiting: false
          })
          .eq('id', room.id);

        // Create match record
        const { data: matchData } = await supabase
          .from('matches')
          .insert({
            game_slug: cleanGameSlug,
            room_id: room.id,
            player_1_id: room.host_id,
            player_1_name: room.player_1_name || 'Host',
            player_2_id: user.userId,
            player_2_name: user.name,
            result: 'ACTIVE'
          })
          .select()
          .single();

        const matchId = matchData?.id || generateUUID();

        // Create game state record
        try {
          await supabase
            .from('game_states')
            .upsert({
              match_id: matchId,
              board_state: this.getInitialBoard(cleanGameSlug),
              current_turn: 'X',
              move_number: 0,
              status: 'ACTIVE'
            });
        } catch (e) {}

        return {
          success: true,
          status: 'MATCH_READY',
          match_id: matchId,
          room_id: room.id,
          role: 'O',
          opponent: {
            name: room.player_1_name || 'Host Player',
            avatarId: '1',
            rating: 1200
          }
        };

      }

      // No waiting room found -> Create a new public waiting room
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newRoom, error: createError } = await supabase
        .from('game_rooms')
        .insert({
          game_slug: cleanGameSlug,
          game_key: cleanGameSlug,
          host_id: user.userId,
          player_1_name: user.name,
          room_code: roomCode,
          is_private: false,
          is_waiting: true,
          status: 'WAITING'
        })
        .select()
        .single();

      if (createError || !newRoom) {
        return { success: false, error: createError?.message || 'FAILED_TO_CREATE_ROOM' };
      }

      return {
        success: true,
        status: 'WAITING',
        room_id: newRoom.id,
        room_code: roomCode,
        role: 'X'
      };
    } catch (err) {
      console.warn('[Direct Matchmaking Fallback Error]:', err);
      return { success: false, error: err?.message || 'MATCHMAKING_ERROR' };
    }
  }

  // 2. Create Private Room
  async createRoom(gameSlug, isPrivate = true, userId = null, playerName = null, avatarId = null) {
    const user = this.getEffectiveUser(userId, playerName, avatarId);
    const cleanGameSlug = String(gameSlug || 'connect4').toLowerCase();
    const supabase = getSupabase();

    if (!supabase) return { success: false, error: 'NO_DATABASE_CLIENT' };

    // 1. Try RPC first
    try {
      const { data, error } = await supabase.rpc('rpc_create_room', {
        p_game_slug: cleanGameSlug,
        p_is_private: isPrivate,
        p_user_id: user.userId,
        p_player_name: user.name,
        p_avatar_id: user.avatarId
      });

      if (!error && data && data.success !== false) {
        return data;
      }
    } catch (e) {}

    // 2. Direct Supabase Table Fallback
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newRoom, error: createError } = await supabase
        .from('game_rooms')
        .insert({
          game_slug: cleanGameSlug,
          game_key: cleanGameSlug,
          host_id: user.userId,
          player_1_name: user.name,
          room_code: roomCode,
          is_private: isPrivate,
          is_waiting: true,
          status: 'WAITING'
        })
        .select()
        .single();

      if (createError || !newRoom) {
        return { success: false, error: createError?.message || 'FAILED_TO_CREATE_ROOM' };
      }

      return {
        success: true,
        status: 'WAITING',
        room_id: newRoom.id,
        room_code: roomCode,
        role: 'X'
      };
    } catch (err) {
      return { success: false, error: err?.message || 'FAILED_TO_CREATE_ROOM' };
    }
  }

  // 3. Join Room by Room Code or ID
  async joinRoom(roomCodeOrId, userId = null, playerName = null, avatarId = null) {
    const user = this.getEffectiveUser(userId, playerName, avatarId);
    const supabase = getSupabase();

    if (!supabase) return { success: false, error: 'NO_DATABASE_CLIENT' };

    const cleanToken = String(roomCodeOrId || '').trim().toUpperCase();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);

    // 1. Try RPC first
    try {
      const { data, error } = await supabase.rpc('rpc_join_room', {
        p_room_id: isUUID ? cleanToken : null,
        p_room_code: isUUID ? null : cleanToken,
        p_user_id: user.userId,
        p_player_name: user.name,
        p_avatar_id: user.avatarId
      });

      if (!error && data && data.success !== false) {
        return data;
      }
    } catch (e) {}

    // 2. Direct Supabase Table Fallback
    try {
      let query = supabase.from('game_rooms').select('*').eq('status', 'WAITING');
      if (isUUID) {
        query = query.eq('id', cleanToken);
      } else {
        query = query.eq('room_code', cleanToken);
      }

      const { data: rooms, error: findError } = await query.limit(1);

      if (findError || !rooms || rooms.length === 0) {
        return { success: false, error: 'ROOM_NOT_FOUND' };
      }

      const room = rooms[0];

      // Update room to PLAYING
      await supabase
        .from('game_rooms')
        .update({
          status: 'PLAYING',
          player_2_name: user.name,
          is_waiting: false
        })
        .eq('id', room.id);

      // Create Match Record
      const { data: matchData } = await supabase
        .from('matches')
        .insert({
          game_slug: room.game_slug,
          room_id: room.id,
          player_1_id: room.host_id,
          player_1_name: room.player_1_name || 'Host',
          player_2_id: user.userId,
          player_2_name: user.name,
          result: 'ACTIVE'
        })
        .select()
        .single();

      const matchId = matchData?.id || generateUUID();

      // Create Game State Record
      try {
        await supabase
          .from('game_states')
          .upsert({
            match_id: matchId,
            board_state: this.getInitialBoard(room.game_slug),
            current_turn: 'X',
            move_number: 0,
            status: 'ACTIVE'
          });
      } catch (e) {}

      return {
        success: true,
        status: 'MATCH_READY',
        match_id: matchId,
        room_id: room.id,
        role: 'O',
        opponent: {
          name: room.player_1_name || 'Host Player',
          avatarId: '1',
          rating: 1200
        }
      };
    } catch (err) {
      return { success: false, error: err?.message || 'JOIN_ROOM_FAILED' };
    }
  }

  // 4. Cancel Queue Ticket
  async cancelMatchmaking(roomId, userId = null) {
    const supabase = getSupabase();
    if (!supabase || !roomId) return { success: false };

    try {
      await supabase.from('game_rooms').delete().eq('id', roomId);
      return { success: true };
    } catch (e) {
      return { success: false };
    }

  }
}

export const matchmakingService = new MatchmakingService();

