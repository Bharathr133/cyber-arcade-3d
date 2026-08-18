import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Matchmaking service unavailable' });
  }

  const { action, gameType, player, matchId, winnerId, moveData, roomCode, isPrivate } = req.body || {};

  try {
    // 1. FIND OR CREATE MATCH VIA RPC
    if (action === 'find-or-create') {
      const { data, error } = await supabase.rpc('rpc_find_or_create_public_match', {
        p_game_type: gameType,
        p_user_id: player.id,
        p_username: player.username || player.name,
        p_rating: player.rating || 1200,
        p_avatar: player.avatarId || '1'
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 2. CREATE PRIVATE ROOM
    if (action === 'create-room') {
      const { data, error } = await supabase.rpc('rpc_create_room', {
        p_game_type: gameType,
        p_user_id: player.id,
        p_username: player.username || player.name,
        p_rating: player.rating || 1200,
        p_avatar: player.avatarId || '1',
        p_is_private: isPrivate !== false,
        p_room_code: roomCode || null
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 3. JOIN PRIVATE ROOM
    if (action === 'join-room') {
      const { data, error } = await supabase.rpc('rpc_join_room', {
        p_room_code: roomCode,
        p_user_id: player.id,
        p_username: player.username || player.name,
        p_rating: player.rating || 1200,
        p_avatar: player.avatarId || '1'
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 4. SUBMIT MOVE
    if (action === 'submit-move') {
      const { data, error } = await supabase.rpc('rpc_submit_game_move', {
        p_match_id: matchId,
        p_user_id: player.id,
        p_move_data: moveData
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 5. FINISH MATCH (Update player stats & ELO)
    if (action === 'finish-match') {
      const { data, error } = await supabase.rpc('rpc_finish_match', {
        p_match_id: matchId,
        p_winner_id: winnerId
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    return sendJsonResponse(res, 400, { error: 'Invalid action' });
  } catch (err) {
    return sendJsonResponse(res, 500, { error: err.message || 'Internal server error' });
  }
}
