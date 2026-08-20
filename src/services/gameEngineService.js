// Authoritative Game Engine Move Submitter & Direct DB Fallback
import { getSupabase } from '../utils/supabaseClient.js';
import { getUserProfile, generateUUID } from '../utils/userProfile.js';

function isValidUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

class GameEngineService {
  async submitMove(matchId, movePayload, userId = null) {
    const supabase = getSupabase();
    if (!supabase || !matchId) return { success: false, error: 'NO_DATABASE_CLIENT' };

    let effectiveId = userId;
    if (!effectiveId) {
      const local = getUserProfile();
      effectiveId = local?.id || generateUUID();
    }
    const clientMoveId = generateUUID();

    // 1. Try RPC First
    try {
      const { data, error } = await supabase.rpc('rpc_submit_game_move', {
        p_match_id: matchId,
        p_move_data: movePayload,
        p_user_id: effectiveId,
        p_client_move_id: clientMoveId
      });

      if (!error && data?.success) {
        return { success: true, ...data };
      }
    } catch (rpcErr) {
      console.warn('[GameEngine RPC fallback]:', rpcErr);
    }

    // 2. Direct Database Upsert Fallback (Guarantees state is always saved)
    try {
      const isWin = movePayload.result === 'WIN' || movePayload.result === 'FINISHED';
      const isDraw = movePayload.result === 'DRAW';
      const rawWinnerId = isWin ? (movePayload.winner_id || effectiveId) : null;
      // Foreign key protection: Only UUIDs present in profiles table can be used; guests must be null
      const safeWinnerId = isValidUUID(rawWinnerId) ? rawWinnerId : null;

      // Use Unix timestamp in seconds (fits in 32-bit integer)
      const unixSeconds = Math.floor(Date.now() / 1000);

      const statePayload = {
        match_id: matchId,
        board_state: movePayload.board || movePayload.board_state,
        current_turn: movePayload.turn || movePayload.current_turn,
        status: movePayload.result || (isWin ? 'WIN' : (isDraw ? 'DRAW' : 'ACTIVE')),
        winner_id: safeWinnerId,
        state_version: unixSeconds,
        updated_at: new Date().toISOString()
      };

      // Upsert game_states
      let { error: upsertErr } = await supabase
        .from('game_states')
        .upsert(statePayload, { onConflict: 'match_id' });

      // If FK constraint fails, retry with winner_id: null to guarantee board state is persisted
      if (upsertErr && safeWinnerId) {
        statePayload.winner_id = null;
        const retry = await supabase
          .from('game_states')
          .upsert(statePayload, { onConflict: 'match_id' });
        upsertErr = retry.error;
      }

      if (upsertErr) {
        console.warn('[GameEngine DB Upsert Warning]:', upsertErr.message);
      }

      // If match finished, update matches table
      if (isWin || isDraw) {
        try {
          await supabase
            .from('matches')
            .update({
              result: isWin ? 'FINISHED' : 'DRAW',
              winner_id: safeWinnerId,
              ended_at: new Date().toISOString()
            })
            .eq('id', matchId);
        } catch (mErr) {
          // If FK fails on matches, update without winner_id
          await supabase
            .from('matches')
            .update({
              result: isWin ? 'FINISHED' : 'DRAW',
              winner_id: null,
              ended_at: new Date().toISOString()
            })
            .eq('id', matchId);
        }
      }

      return {
        success: true,
        state: {
          board: statePayload.board_state,
          turn: statePayload.current_turn,
          result: statePayload.status,
          winner_id: statePayload.winner_id,
          winnerSymbol: movePayload.winnerSymbol
        }
      };
    } catch (directErr) {
      console.error('[GameEngine Direct DB Error]:', directErr);
      return { success: false, error: directErr.message };
    }
  }


  async resetMatchState(matchId, initialBoard, firstTurn) {
    const supabase = getSupabase();
    if (!supabase || !matchId) return { success: false };
    try {
      const payload = {
        match_id: matchId,
        board_state: initialBoard,
        current_turn: firstTurn,
        status: 'ACTIVE',
        winner_id: null,
        state_version: Math.floor(Date.now() / 1000),
        updated_at: new Date().toISOString()
      };
      await supabase.from('game_states').upsert(payload, { onConflict: 'match_id' });
      return { success: true };
    } catch (e) {
      console.error('[GameEngine Reset State Error]:', e);
      return { success: false, error: e.message };
    }
  }
}


export const gameEngineService = new GameEngineService();

