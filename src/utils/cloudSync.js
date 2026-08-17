import { getSupabase, isCloudConfigured } from './supabaseClient.js';
import { securityEngine } from './securityEngine.js';

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
  async fetchGlobalLeaderboard(filter = 'all') {
    if (!isCloudConfigured()) {
      return [];
    }

    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      if (filter === 'all') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_id, rating, level, xp, wins, losses, draws')
          .order('rating', { ascending: false })
          .limit(50);

        if (error || !data) return [];

        return data.map((row, index) => ({
          rank: index + 1,
          id: row.id,
          name: row.name,
          avatarId: row.avatar_id,
          rating: row.rating,
          level: row.level,
          wins: row.wins,
          losses: row.losses,
          draws: row.draws,
          winRate: (row.wins + row.losses + row.draws) > 0
            ? Math.round((row.wins / (row.wins + row.losses + row.draws)) * 100)
            : 0
        }));
      } else {
        // Filter by game: 'gomoku', 'connect4', 'tictactoe'
        const { data, error } = await supabase
          .from('game_stats')
          .select(`
            user_id,
            rating,
            level,
            xp,
            wins,
            losses,
            draws,
            profiles ( name, avatar_id )
          `)
          .eq('game_key', filter)
          .order('rating', { ascending: false })
          .limit(50);

        if (error || !data) return [];

        return data.map((row, index) => ({
          rank: index + 1,
          id: row.user_id,
          name: row.profiles?.name || 'Player',
          avatarId: row.profiles?.avatar_id || '1',
          rating: row.rating,
          level: row.level,
          wins: row.wins,
          losses: row.losses,
          draws: row.draws,
          winRate: (row.wins + row.losses + row.draws) > 0
            ? Math.round((row.wins / (row.wins + row.losses + row.draws)) * 100)
            : 0
        }));
      }
    } catch (e) {
      console.warn('Leaderboard fetch error:', e);
      return [];
    }
  }
}

export const cloudSync = new CloudSyncService();
