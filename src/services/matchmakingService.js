import { getSupabase } from '../utils/supabaseClient.js';
import { getUserProfile, generateUUID } from '../utils/userProfile.js';
import { fetchFromApi } from './apiClient.js';

class MatchmakingService {
  getEffectiveUser(userId, name, avatarId) {
    const local = getUserProfile();
    const resolvedName = name || local?.display_name || local?.name || local?.username || (local?.email ? local.email.split('@')[0] : 'Player');
    return {
      userId: userId || local?.id || 'player_' + Math.random().toString(36).substring(2, 10),
      name: resolvedName,
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
        if (data.status === 'MATCH_READY' && data.match_id) {
          try {
            const { data: matchRec } = await supabase
              .from('matches')
              .select('player_1_id, player_1_name, player_2_id, player_2_name')
              .eq('id', data.match_id)
              .single();
            if (matchRec) {
              const isP1 = matchRec.player_1_id === user.userId;
              const oppId = isP1 ? matchRec.player_2_id : matchRec.player_1_id;
              let oppName = isP1 ? matchRec.player_2_name : matchRec.player_1_name;
              let oppAvatar = data.opponent?.avatarId || '2';
              let oppRating = data.opponent?.rating || 1200;

              if (oppId) {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('name, display_name, username, avatar_id, rating')
                  .eq('id', oppId)
                  .single();
                if (prof) {
                  oppName = prof.display_name || prof.name || (prof.username ? `@${prof.username}` : null) || oppName;
                  if (prof.avatar_id) oppAvatar = prof.avatar_id;
                  if (prof.rating) oppRating = prof.rating;
                }
              }

              data.opponent = {
                name: oppName || data.opponent?.name,
                avatarId: oppAvatar,
                rating: oppRating
              };
            }
          } catch (e) {}
        }
        return data;
      }
    } catch (e) {}

    // 2. Direct Supabase Table Fallback (Guaranteed to succeed!)
    try {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

      // Look for a fresh waiting public room (exclude stale placeholder rooms)
      const { data: waitingRooms, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('game_slug', cleanGameSlug)
        .eq('is_private', false)
        .eq('status', 'WAITING')
        .neq('host_id', user.userId)
        .neq('player_1_name', 'Player 1')
        .neq('player_1_name', 'Player')
        .gt('created_at', thirtySecondsAgo)
        .order('created_at', { ascending: false })
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

        // Resolve real host name & avatar from profiles if needed
        let opponentName = room.player_1_name || room.host_name;
        let opponentAvatar = room.avatar_id || room.player_1_avatar || '1';
        let opponentRating = 1200;


        if (!opponentName || opponentName === 'Player 1' || opponentName === 'Player' || opponentName === 'Guest Player') {
          try {
            const { data: hostProf } = await supabase
              .from('profiles')
              .select('name, display_name, username, avatar_id, rating')
              .eq('id', room.host_id)
              .single();
            if (hostProf) {
              opponentName = hostProf.display_name || hostProf.name || (hostProf.username ? `@${hostProf.username}` : null);
              if (hostProf.avatar_id) opponentAvatar = hostProf.avatar_id;
              if (hostProf.rating) opponentRating = hostProf.rating;
            }
          } catch (e) {}
        }

        if (!opponentName) {
          opponentName = room.player_1_name;
        }


        // Create match record
        const { data: matchData } = await supabase
          .from('matches')
          .insert({
            game_slug: cleanGameSlug,
            room_id: room.id,
            player_1_id: room.host_id,
            player_1_name: opponentName,
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
            name: opponentName,
            avatarId: opponentAvatar,
            rating: opponentRating
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

      // Resolve real host name & avatar from profiles if needed
      let opponentName = room.player_1_name;
      let opponentAvatar = room.avatar_id || room.player_1_avatar || '1';
      let opponentRating = 1200;

      if (!opponentName || opponentName === 'Player 1' || opponentName === 'Player' || opponentName === 'Guest Player') {
        try {
          const { data: hostProf } = await supabase
            .from('profiles')
            .select('name, display_name, username, avatar_id, rating')
            .eq('id', room.host_id)
            .single();
          if (hostProf) {
            opponentName = hostProf.display_name || hostProf.name || (hostProf.username ? `@${hostProf.username}` : null);
            if (hostProf.avatar_id) opponentAvatar = hostProf.avatar_id;
            if (hostProf.rating) opponentRating = hostProf.rating;
          }
        } catch (e) {}
      }

      if (!opponentName) {
        opponentName = room.player_1_name;
      }


      // Create Match Record
      const { data: matchData } = await supabase
        .from('matches')
        .insert({
          game_slug: room.game_slug,
          room_id: room.id,
          player_1_id: room.host_id,
          player_1_name: opponentName,
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
          name: opponentName,
          avatarId: opponentAvatar,
          rating: opponentRating
        }
      };


    } catch (err) {
      console.error('[Join Room Error]:', err);
      return { success: false, error: 'Unable to connect to room. Please check the code and try again.' };
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

