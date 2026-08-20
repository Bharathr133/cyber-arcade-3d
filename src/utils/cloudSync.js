import { getSupabase } from './supabaseClient.js';

// Global Cloud Sync & Leaderboard Service (Direct Supabase Integration)
class CloudSyncService {

  // 1. Direct Supabase Profile & Game Stats Sync
  async syncProfileToCloud(profile, latestMatch = null) {
    if (!profile?.id) return { success: false, reason: 'NO_PROFILE' };

    // STRICT: Only real registered/authenticated users with an email are saved to Supabase profiles.
    // Guests only keep their local session in localStorage.
    const isGuest = profile.isGuest || 
                    !profile.email || 
                    !profile.isRegistered ||
                    profile.id.startsWith('player_') || 
                    profile.id.startsWith('user_') || 
                    profile.id.startsWith('guest_') ||
                    profile.id.startsWith('anon_');

    if (isGuest) {
      return { success: true, localOnly: true };
    }


    const supabase = getSupabase();
    if (!supabase) return { success: false, reason: 'NO_DB' };

    try {
      // 1. Upsert Main Profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: profile.id,
        display_name: String(profile.name || 'Player').substring(0, 25),
        avatar_url: String(profile.avatarId || '1'),
        rating: Number(profile.rating) || 1200,
        level: Number(profile.level) || 1,
        xp: Number(profile.xp) || 0,
        wins: Number(profile.wins) || 0,
        losses: Number(profile.losses) || 0,
        draws: Number(profile.draws) || 0,
        last_seen: new Date().toISOString()
      });

      if (profileError) {
        console.warn('Cloud profile sync note:', profileError.message);
      }

      // 2. Upsert Per-Game Stats
      if (profile.gameStats && typeof profile.gameStats === 'object') {
        const VALID_GAMES = ['gomoku', 'connect4', 'tictactoe', 'memory', 'ludo'];
        const statRows = Object.entries(profile.gameStats)
          .filter(([gameKey]) => VALID_GAMES.includes(gameKey))
          .map(([gameKey, stat]) => ({
            user_id: profile.id,
            game_key: gameKey,
            rating: Number(stat.rating) || 1200,
            level: Number(stat.level) || 1,
            xp: Number(stat.xp) || 0,
            wins: Number(stat.wins) || 0,
            losses: Number(stat.losses) || 0,
            draws: Number(stat.draws) || 0,
            updated_at: new Date().toISOString()
          }));

        if (statRows.length > 0) {
          await supabase.from('game_stats').upsert(statRows, { onConflict: 'user_id,game_key' }).catch(() => {});
        }
      }

      // 3. Log match if provided
      if (latestMatch && latestMatch.gameKey) {
        await supabase.from('matches').insert({
          game_slug: latestMatch.gameKey,
          player_1_id: profile.id,
          player_2_id: String(latestMatch.opponentName || 'Opponent').substring(0, 50),
          result: ['WIN', 'LOSS', 'DRAW'].includes(latestMatch.outcome) ? latestMatch.outcome : 'WIN',
          created_at: new Date().toISOString()
        }).catch(() => {});
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  // 2. Fetch Complete Profile & Game Stats from Supabase
  async fetchProfileFromCloud(userId) {
    if (!userId) return null;
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      // 1. Fetch Profile
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (pErr || !prof) return null;

      // 2. Fetch Game Stats
      const { data: statsRows } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', userId);

      const gameStats = {
        gomoku: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
        connect4: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
        tictactoe: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
        memory: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 },
        ludo: { rating: 1200, level: 1, xp: 0, wins: 0, losses: 0, draws: 0 }
      };

      if (Array.isArray(statsRows)) {
        statsRows.forEach(row => {
          if (row.game_key && gameStats[row.game_key]) {
            gameStats[row.game_key] = {
              rating: Number(row.rating) || 1200,
              level: Number(row.level) || 1,
              xp: Number(row.xp) || 0,
              wins: Number(row.wins) || 0,
              losses: Number(row.losses) || 0,
              draws: Number(row.draws) || 0
            };
          }
        });
      }

      return {
        id: prof.id,
        name: prof.display_name || 'Player',
        avatarId: prof.avatar_url || '1',
        rating: Number(prof.rating) || 1200,
        level: Number(prof.level) || 1,
        xp: Number(prof.xp) || 0,
        wins: Number(prof.wins) || 0,
        losses: Number(prof.losses) || 0,
        draws: Number(prof.draws) || 0,
        gameStats,
        isGuest: false,
        isRegistered: true,
        hasCustomName: true
      };
    } catch (e) {
      return null;
    }
  }

  // 3. Direct Supabase Leaderboard Query
  async fetchGlobalLeaderboard(gameKey = 'connect4', limit = 50) {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, rating, level, wins, losses, avatar_url')
        .order('rating', { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        return data.map((u, idx) => ({
          rank: idx + 1,
          id: u.id,
          username: u.display_name || 'Player',
          name: u.display_name || 'Player',
          avatar_url: u.avatar_url || '1',
          rating: Number(u.rating) || 1200,
          level: Number(u.level) || 1,
          wins: Number(u.wins) || 0,
          losses: Number(u.losses) || 0
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

export const cloudSync = new CloudSyncService();
