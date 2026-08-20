import { getServerSupabase, sendJsonResponse, checkRateLimit } from './_lib/supabaseServer.js';

function sanitizeError(err) {
  const msg = String(err?.message || '');
  if (msg.includes('password') || msg.includes('secret') || msg.includes('key')) return 'Internal processing error';
  if (msg.length > 120) return 'Internal server error';
  return msg || 'Internal server error';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  // Rate limit: 60 requests per minute per IP
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(`leaderboard:${ip}`)) {
    res.setHeader('Retry-After', '60');
    return sendJsonResponse(res, 429, { error: 'Too many requests. Please try again later.' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Database service unavailable' });
  }

  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const VALID_GAMES = ['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'];
    const gameFilter = VALID_GAMES.includes(req.query.game) ? req.query.game : (VALID_GAMES.includes(req.query.filter) ? req.query.filter : 'connect4');


    // 1. Fetch game_stats for the selected game
    const { data: gameStats, error: statsError } = await supabase
      .from('game_stats')
      .select('user_id, rating, level, xp, wins, losses, draws, updated_at')
      .eq('game_key', gameFilter)
      .order('rating', { ascending: false })
      .limit(100);

    if (statsError) {
      return sendJsonResponse(res, 500, { error: statsError.message });
    }

    const userIds = (gameStats || []).map(s => s.user_id).filter(Boolean);

    // 2. Fetch profiles for these users
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, display_name, username, avatar_id, avatar_url, status, last_seen')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach(p => profileMap.set(p.id, p));
      }
    }

    // 3. Merge & Filter for REAL HUMAN PLAYERS only
    const realPlayers = [];
    const seenNames = new Set();

    for (const stat of (gameStats || [])) {
      const profile = profileMap.get(stat.user_id);
      const rawName = profile?.display_name || profile?.username || profile?.name || '';
      const cleanName = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : `Guest_${String(stat.user_id).slice(-4)}`;

      // Deduplicate by name if multiple local IDs share the same player name
      const nameKey = cleanName.toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);


      const wins = Number(stat.wins) || 0;
      const losses = Number(stat.losses) || 0;
      const draws = Number(stat.draws) || 0;
      const totalMatches = wins + losses + draws;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      realPlayers.push({
        id: stat.user_id,
        name: cleanName,
        username: profile?.username || null,
        avatarId: profile?.avatar_id || profile?.avatar_url || '1',
        rating: Number(stat.rating) || 1200,
        level: Number(stat.level) || 1,
        xp: Number(stat.xp) || 0,
        wins,
        losses,
        draws,
        totalMatches,
        winRate,
        status: profile?.status || 'ONLINE',
        lastSeen: profile?.last_seen || null
      });
    }

    // Sort by rating desc, then wins desc
    realPlayers.sort((a, b) => b.rating - a.rating || b.wins - a.wins);

    // Assign dynamic ranks
    const rankedPlayers = realPlayers.slice(0, limit).map((p, idx) => ({
      ...p,
      rank: idx + 1
    }));

    // Cache headers on CDN edge (Cache 10s, serve stale for 60s)
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60');

    return sendJsonResponse(res, 200, {
      success: true,
      game: gameFilter,
      totalRealPlayers: rankedPlayers.length,
      players: rankedPlayers
    });
  } catch (err) {
    return sendJsonResponse(res, 500, { error: sanitizeError(err) });
  }
}
