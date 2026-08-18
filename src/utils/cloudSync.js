import { getSupabase, isCloudConfigured } from './supabaseClient.js';
import { securityEngine } from './securityEngine.js';
import { fetchFromApi } from '../services/apiClient.js';

// Global Cloud Sync & Analytics Service (100% Real Data, Zero Mock Data)
class CloudSyncService {

  // Sync entire local profile, per-game stats, and latest match to Supabase
  async syncProfileToCloud(profile, latestMatch = null) {
    if (!isCloudConfigured() || !profile?.id) return { success: false, reason: 'NOT_CONFIGURED' };

    const supabase = getSupabase();
    if (!supabase) return { success: false, reason: 'NO_CLIENT' };

    try {
      // 1. Upsert Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          name: securityEngine.sanitizeText(profile.name, 20),
          avatar_id: profile.avatarId || '1',
          rating: Number(profile.rating) || 1200,
          level: Number(profile.level) || 1,
          xp: Number(profile.xp) || 0,
          wins: Number(profile.wins) || 0,
          losses: Number(profile.losses) || 0,
          draws: Number(profile.draws) || 0,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('Cloud profile sync notice:', profileError.message);
      }

      // 2. Upsert Per-Game Stats
      if (profile.gameStats) {
        const gameEntries = Object.entries(profile.gameStats).map(([gameKey, data]) => ({
          user_id: profile.id,
          game_key: gameKey,
          rating: Number(data.rating) || 1200,
          level: Number(data.level) || 1,
          xp: Number(data.xp) || 0,
          wins: Number(data.wins) || 0,
          losses: Number(data.losses) || 0,
          draws: Number(data.draws) || 0,
          updated_at: new Date().toISOString()
        }));

        if (gameEntries.length > 0) {
          const { error: statsError } = await supabase
            .from('game_stats')
            .upsert(gameEntries, { onConflict: 'user_id,game_key' });

          if (statsError) {
            console.warn('Cloud game stats sync notice:', statsError.message);
          }
        }
      }

      // 3. Insert Match History Record
      if (latestMatch) {
        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            id: latestMatch.id || `m_${Date.now()}`,
            user_id: profile.id,
            game_key: latestMatch.gameKey || 'gomoku',
            game_title: latestMatch.game || 'Game',
            opponent_name: securityEngine.sanitizeText(latestMatch.opponent, 20),
            outcome: latestMatch.outcome,
            rating_delta: latestMatch.ratingDelta || 0
          });

        if (matchError) {
          console.warn('Cloud match history sync notice:', matchError.message);
        }
      }

      return { success: true };
    } catch (e) {
      console.warn('Cloud sync error:', e);
      return { success: false, error: e };
    }
  }

  // Fetch Global Top 50 Leaderboard (Strictly Real Supabase Cloud Data)
  async fetchGlobalLeaderboard(gameKey = 'connect4') {
    const safeGame = ['connect4', 'tictactoe', 'gomoku'].includes(gameKey) ? gameKey : 'connect4';

    // 1. Try Serverless Backend Proxy first (Zero Client Key Exposure)
    const apiRes = await fetchFromApi(`/api/leaderboard?limit=50&game=${safeGame}`);
    if (apiRes.ok && apiRes.data?.success && Array.isArray(apiRes.data?.players)) {
      return apiRes.data.players;
    }

    // 2. Direct Fallback
    if (!isCloudConfigured()) {
      return [];
    }

    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      // 1. Fetch game_stats for the selected game
      const { data: stats, error: statsError } = await supabase
        .from('game_stats')
        .select('*')
        .eq('game_key', safeGame)
        .order('rating', { ascending: false })
        .limit(100);

      if (statsError || !stats) return [];

      const userIds = stats.map(s => s.user_id).filter(Boolean);

      // 2. Fetch corresponding profiles
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

      // 3. Filter for REAL users only
      const realPlayers = [];
      const seenNames = new Set();

      for (const s of stats) {
        const p = profileMap.get(s.user_id);
        const rawName = p?.name || p?.display_name || p?.username || '';
        const cleanName = typeof rawName === 'string' ? rawName.trim() : '';

        // Ignore dummy, player_ and test names
        const isInvalidName = !cleanName ||
          cleanName.toLowerCase() === 'player' ||
          cleanName.toLowerCase().startsWith('player_') ||
          cleanName.toLowerCase().startsWith('user_') ||
          cleanName.toLowerCase().startsWith('diagnostic_') ||
          cleanName.toLowerCase().startsWith('test_user_');

        if (isInvalidName) continue;

        const nameKey = cleanName.toLowerCase();
        if (seenNames.has(nameKey)) continue;
        seenNames.add(nameKey);

        const wins = Number(s.wins) || 0;
        const losses = Number(s.losses) || 0;
        const draws = Number(s.draws) || 0;
        const total = wins + losses + draws;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

        realPlayers.push({
          id: s.user_id,
          name: cleanName,
          avatarId: p?.avatar_id || p?.avatar_url || '1',
          rating: Number(s.rating) || 1200,
          level: Number(s.level) || 1,
          xp: Number(s.xp) || 0,
          wins,
          losses,
          draws,
          totalMatches: total,
          winRate,
          status: p?.status || 'ONLINE'
        });
      }

      realPlayers.sort((a, b) => b.rating - a.rating || b.wins - a.wins);

      return realPlayers.slice(0, 50).map((row, index) => ({
        ...row,
        rank: index + 1
      }));
    } catch (e) {
      console.warn('Leaderboard fetch error:', e);
      return [];
    }
  }
}

export const cloudSync = new CloudSyncService();
