import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';

function sanitizeError(err) {
  const msg = String(err?.message || '');
  if (msg.includes('password') || msg.includes('secret') || msg.includes('key')) return 'Internal processing error';
  if (msg.length > 120) return 'Internal server error';
  return msg || 'Internal server error';
}

const VALID_GAMES = ['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Matchmaking service unavailable' });
  }

  const { action, gameType, player, matchId, winnerId, moveData, roomCode, isPrivate } = req.body || {};

  if (!player || !player.id) {
    return sendJsonResponse(res, 400, { error: 'Valid player payload required' });
  }

  // Sanitize player input
  const safePlayer = {
    id: String(player.id).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64),
    name: String(player.name || player.username || 'Player').substring(0, 20),
    rating: Math.min(9999, Math.max(100, Number(player.rating) || 1200)),
    avatarId: String(player.avatarId || player.avatar || '1').substring(0, 10)
  };

  const safeGameSlug = String(gameType || 'connect4').toLowerCase();
  if (!VALID_GAMES.includes(safeGameSlug)) {
    return sendJsonResponse(res, 400, { error: 'Invalid game type' });
  }

  try {
    // 1. FIND OR CREATE MATCH VIA RPC
    if (action === 'find-or-create') {
      const { data, error } = await supabase.rpc('rpc_find_or_create_public_match', {
        p_game_slug: safeGameSlug,
        p_user_id: safePlayer.id,
        p_player_name: safePlayer.name,
        p_avatar_id: safePlayer.avatarId
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 2. CREATE PRIVATE ROOM
    if (action === 'create-room') {
      const { data, error } = await supabase.rpc('rpc_create_room', {
        p_game_slug: safeGameSlug,
        p_is_private: isPrivate !== false,
        p_user_id: safePlayer.id,
        p_player_name: safePlayer.name,
        p_avatar_id: safePlayer.avatarId
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 3. JOIN PRIVATE ROOM
    if (action === 'join-room') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomCode);
      const cleanCode = String(roomCode || '').trim().toUpperCase().substring(0, 10);

      const { data, error } = await supabase.rpc('rpc_join_room', {
        p_room_id: isUUID ? cleanCode : null,
        p_room_code: isUUID ? null : cleanCode,
        p_user_id: safePlayer.id,
        p_player_name: safePlayer.name,
        p_avatar_id: safePlayer.avatarId
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 4. SUBMIT MOVE
    if (action === 'submit-move') {
      const safeMatchId = String(matchId || '').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64);
      if (!safeMatchId) {
        return sendJsonResponse(res, 400, { error: 'Invalid match ID' });
      }
      const { data, error } = await supabase.rpc('rpc_submit_game_move', {
        p_match_id: safeMatchId,
        p_player_id: safePlayer.id,
        p_move_data: moveData || {}
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    // 5. FINISH MATCH
    if (action === 'finish-match') {
      const safeMatchId = String(matchId || '').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64);
      const { data, error } = await supabase.rpc('rpc_finish_match', {
        p_match_id: safeMatchId,
        p_winner_id: winnerId ? String(winnerId) : null
      });

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true, result: data });
    }

    return sendJsonResponse(res, 400, { error: 'Unknown action' });
  } catch (err) {
    return sendJsonResponse(res, 500, { error: sanitizeError(err) });
  }
}
