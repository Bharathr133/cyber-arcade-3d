import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';

function sanitizeError(err) {
  const msg = String(err?.message || '');
  if (msg.includes('password') || msg.includes('secret') || msg.includes('key')) return 'Internal processing error';
  if (msg.length > 120) return 'Internal server error';
  return msg || 'Internal server error';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Backend database service unavailable' });
  }

  const { userId, gameKey, outcome, opponentName } = req.body || {};

  if (!userId || !gameKey || !outcome) {
    return sendJsonResponse(res, 400, { error: 'userId, gameKey, and outcome are required' });
  }

  if (!['WIN', 'LOSS', 'DRAW'].includes(outcome)) {
    return sendJsonResponse(res, 400, { error: 'outcome must be WIN, LOSS, or DRAW' });
  }

  const VALID_GAMES = ['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'];
  if (!VALID_GAMES.includes(gameKey)) {
    return sendJsonResponse(res, 400, { error: 'Invalid gameKey' });
  }

  try {
    // 1. Try Authoritative RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_record_match_result', {
      p_user_id: userId,
      p_game_key: gameKey,
      p_outcome: outcome,
      p_opponent_name: (opponentName || 'Computer').substring(0, 50)
    });

    if (!rpcError && rpcData) {
      return sendJsonResponse(res, 200, { success: true, result: rpcData });
    }

    // 2. Fallback: Direct DB update (only if RPC is pending/missing)
    const delta = outcome === 'WIN' ? 25 : outcome === 'LOSS' ? -10 : 2;
    const xpGain = outcome === 'WIN' ? 50 : outcome === 'LOSS' ? 10 : 15;

    // Actually write stats instead of fabricating response
    const { data: existing } = await supabase
      .from('game_stats')
      .select('rating, xp, wins, losses, draws')
      .eq('user_id', userId)
      .eq('game_key', gameKey)
      .maybeSingle();

    const old = existing || { rating: 1200, xp: 0, wins: 0, losses: 0, draws: 0 };
    const updatePayload = {
      user_id: userId,
      game_key: gameKey,
      rating: Math.max(100, (old.rating || 1200) + delta),
      xp: (old.xp || 0) + xpGain,
      wins: (old.wins || 0) + (outcome === 'WIN' ? 1 : 0),
      losses: (old.losses || 0) + (outcome === 'LOSS' ? 1 : 0),
      draws: (old.draws || 0) + (outcome === 'DRAW' ? 1 : 0),
      updated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from('game_stats')
      .upsert(updatePayload, { onConflict: 'user_id,game_key' });

    if (upsertError) {
      return sendJsonResponse(res, 500, { error: 'Failed to save match result' });
    }

    // Also update profile aggregate stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('wins, losses, draws, rating')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      await supabase.from('profiles').upsert({
        id: userId,
        wins: (profile.wins || 0) + (outcome === 'WIN' ? 1 : 0),
        losses: (profile.losses || 0) + (outcome === 'LOSS' ? 1 : 0),
        draws: (profile.draws || 0) + (outcome === 'DRAW' ? 1 : 0),
        rating: Math.max(100, (profile.rating || 1200) + delta)
      });
    }

    return sendJsonResponse(res, 200, {
      success: true,
      result: {
        rating_delta: delta,
        xp_gain: xpGain,
        new_rating: Math.max(100, (old.rating || 1200) + delta),
        new_xp: (old.xp || 0) + xpGain
      }
    });
  } catch (err) {
    return sendJsonResponse(res, 500, { error: sanitizeError(err) });
  }
}
