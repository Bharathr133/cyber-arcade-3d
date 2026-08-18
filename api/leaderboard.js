import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Database service unavailable' });
  }

  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const gameFilter = req.query.game || req.query.filter || 'connect4'; // 'connect4', 'tictactoe', 'gomoku'

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
      const rawName = profile?.name || profile?.display_name || profile?.username || '';
      const cleanName = typeof rawName === 'string' ? rawName.trim() : '';

      // Filter out invalid / dummy / bot names
      const isInvalidName = !cleanName ||
        cleanName.toLowerCase() === 'player' ||
        cleanName.toLowerCase().startsWith('player_') ||
        cleanName.toLowerCase().startsWith('user_') ||
        cleanName.toLowerCase().startsWith('diagnostic_') ||
        cleanName.toLowerCase().startsWith('test_user_');

      if (isInvalidName) {
        continue;
      }

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
    return sendJsonResponse(res, 500, { error: err.message || 'Internal server error' });
  }
}
