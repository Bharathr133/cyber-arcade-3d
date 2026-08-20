import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';

function sanitizeError(err) {
  const msg = String(err?.message || '');
  if (msg.includes('password') || msg.includes('secret') || msg.includes('key')) return 'Internal processing error';
  if (msg.length > 120) return 'Internal server error';
  return msg || 'Internal server error';
}

const MAX_RATING = 9999;
const MIN_RATING = 100;
const MAX_STAT_VALUE = 999999;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Backend database service unavailable' });
  }

  const { profile, gameStats, lastMatch } = req.body || {};

  if (!profile || !profile.id) {
    return sendJsonResponse(res, 400, { error: 'Valid profile payload required' });
  }

  // Sanitize profile ID (prevent injection)
  const cleanId = String(profile.id).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 64);
  if (!cleanId) {
    return sendJsonResponse(res, 400, { error: 'Invalid profile ID' });
  }

  try {
    // 1. Sync User Profile (with allowlist + bounds)
    const safeRating = Math.min(MAX_RATING, Math.max(MIN_RATING, Number(profile.rating) || 1200));
    const safeLevel = Math.min(999, Math.max(1, Number(profile.level) || 1));
    const safeXp = Math.min(MAX_STAT_VALUE, Math.max(0, Number(profile.xp) || 0));
    const safeWins = Math.min(MAX_STAT_VALUE, Math.max(0, Number(profile.wins) || 0));
    const safeLosses = Math.min(MAX_STAT_VALUE, Math.max(0, Number(profile.losses) || 0));
    const safeDraws = Math.min(MAX_STAT_VALUE, Math.max(0, Number(profile.draws) || 0));

    const profilePayload = {
      id: cleanId,
      username: (profile.gamertag || profile.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 16),
      display_name: String(profile.name || 'Player').substring(0, 20),
      avatar_url: String(profile.avatarId || '1').substring(0, 10),
      rating: safeRating,
      level: safeLevel,
      xp: safeXp,
      wins: safeWins,
      losses: safeLosses,
      draws: safeDraws,
      status: 'ONLINE',
      last_seen: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload);

    if (profileError) {
      return sendJsonResponse(res, 500, { error: 'Failed to sync profile' });
    }

    // 2. Sync Per-Game Stats (with bounds)
    if (gameStats && typeof gameStats === 'object') {
      const VALID_GAMES = ['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'];
      const statRows = Object.entries(gameStats)
        .filter(([gameKey]) => VALID_GAMES.includes(gameKey))
        .map(([gameKey, stat]) => ({
          user_id: cleanId,
          game_key: gameKey,
          rating: Math.min(MAX_RATING, Math.max(MIN_RATING, Number(stat.rating) || 1200)),
          level: Math.min(999, Math.max(1, Number(stat.level) || 1)),
          xp: Math.min(MAX_STAT_VALUE, Math.max(0, Number(stat.xp) || 0)),
          wins: Math.min(MAX_STAT_VALUE, Math.max(0, Number(stat.wins) || 0)),
          losses: Math.min(MAX_STAT_VALUE, Math.max(0, Number(stat.losses) || 0)),
          draws: Math.min(MAX_STAT_VALUE, Math.max(0, Number(stat.draws) || 0)),
          updated_at: new Date().toISOString()
        }));

      if (statRows.length > 0) {
        await supabase
          .from('game_stats')
          .upsert(statRows, { onConflict: 'user_id,game_key' });
      }
    }

    // 3. Log Last Match if provided
    if (lastMatch && lastMatch.gameKey) {
      const VALID_GAMES = ['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'];
      if (VALID_GAMES.includes(lastMatch.gameKey)) {
        await supabase.from('matches').insert({
          game_slug: lastMatch.gameKey,
          player_1_id: cleanId,
          player_2_id: String(lastMatch.opponentName || 'Computer').substring(0, 50),
          result: ['WIN', 'LOSS', 'DRAW'].includes(lastMatch.outcome) ? lastMatch.outcome : 'WIN',
          duration_seconds: Math.min(7200, Math.max(0, Number(lastMatch.duration) || 60)),
          ended_at: new Date().toISOString()
        });
      }
    }

    return sendJsonResponse(res, 200, { success: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    return sendJsonResponse(res, 500, { error: sanitizeError(err) });
  }
}
