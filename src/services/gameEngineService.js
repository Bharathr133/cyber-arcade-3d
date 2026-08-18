// Authoritative Game Engine Move Submitter & Validator
import { getSupabase } from '../utils/supabaseClient.js';
import { getUserProfile, generateUUID } from '../utils/userProfile.js';

class GameEngineService {
  async submitMove(matchId, movePayload, userId = null) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'NO_DATABASE_CLIENT' };

    let effectiveId = userId;
    if (!effectiveId) {
      const local = getUserProfile();
      effectiveId = local?.id || generateUUID();
    }
    const clientMoveId = generateUUID();

    try {
      const { data, error } = await supabase.rpc('rpc_submit_game_move', {
        p_match_id: matchId,
        p_move_data: movePayload,
        p_user_id: effectiveId,
        p_client_move_id: clientMoveId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const gameEngineService = new GameEngineService();
