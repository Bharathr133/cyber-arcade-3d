// Enterprise Admin Service (Authenticated via verified admin email)
import { getSupabase } from '../utils/supabaseClient.js';
import { getUserProfile, getTier } from '../utils/userProfile.js';

const SYSTEM_BROADCAST_STORAGE_KEY = 'games4u_system_broadcast';

class AdminService {
  // 1. Strict Authentication & Role-Based Access Control
  isAdmin(profile = null) {
    const p = profile || getUserProfile();
    if (!p) return false;

    // 1. Check database role
    if (p.role === 'admin' || p.role === 'superadmin') return true;

    // 2. Check verified email against environment whitelist
    if (!p.email) return false;
    const email = p.email.toLowerCase().trim();
    const envEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    return envEmails.includes(email);
  }


  // 2. Fetch Users with Search, Filters, Sorting & Pagination
  async fetchUsersPaginated({
    search = '',
    tier = 'ALL',
    status = 'ALL', // 'ALL' | 'ACTIVE' | 'BANNED' | 'GRANDMASTER'
    sortBy = 'last_seen', // 'last_seen' | 'rating' | 'level' | 'wins' | 'display_name'
    sortOrder = 'desc',
    page = 1,
    pageSize = 25
  } = {}) {
    const supabase = getSupabase();
    if (!supabase) {
      const local = getUserProfile();
      return {
        success: true,
        users: local ? [{
          id: local.id,
          username: local.name,
          display_name: local.name,
          email: local.email || '',
          avatar_id: local.avatarId || 1,

          rating: local.rating || 1200,
          level: local.level || 1,
          xp: local.xp || 0,
          wins: local.wins || 0,
          losses: local.losses || 0,
          draws: local.draws || 0,
          is_banned: Boolean(local.isBanned),
          ban_reason: local.banReason || '',
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString()
        }] : [],
        total: 1,
        page: 1,
        totalPages: 1
      };
    }

    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      // Apply Search Filter (by display name or ID)
      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`display_name.ilike.%${term}%,id.ilike.%${term}%`);
      }

      // Apply Status Filter
      if (status === 'BANNED') {
        query = query.eq('is_banned', true);
      } else if (status === 'ACTIVE') {
        query = query.or('is_banned.is.null,is_banned.eq.false');
      } else if (status === 'GRANDMASTER') {
        query = query.gte('rating', 1800);
      }

      // Filter out legacy guest IDs unless ALL is explicitly requested
      if (status !== 'ALL_INCLUDING_GUESTS') {
        query = query.not('id', 'like', 'player_%')
                     .not('id', 'like', 'diagnostic_%')
                     .not('id', 'like', 'test_%')
                     .not('id', 'like', 'anon_%');
      }

      // Apply Sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });


      // Apply Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        return { success: false, error: error.message, users: [], total: 0 };
      }

      const users = (data || []).map(u => {
        const totalMatches = (Number(u.wins) || 0) + (Number(u.losses) || 0) + (Number(u.draws) || 0);
        const rating = Number(u.rating) || 1200;
        const tierInfo = getTier(rating, totalMatches);

        return {
          id: u.id,
          username: u.display_name || 'Player',
          display_name: u.display_name || 'Player',
          email: u.email || '',
          avatar_id: u.avatar_id || u.avatarId || 1,

          rating,
          level: Number(u.level) || 1,
          xp: Number(u.xp) || 0,
          wins: Number(u.wins) || 0,
          losses: Number(u.losses) || 0,
          draws: Number(u.draws) || 0,
          totalMatches,
          winRate: totalMatches > 0 ? Math.round(((Number(u.wins) || 0) / totalMatches) * 100) : 0,
          tierName: tierInfo?.name || 'Bronze',
          is_banned: Boolean(u.is_banned),
          ban_reason: u.ban_reason || '',
          last_seen: u.last_seen || new Date().toISOString(),
          created_at: u.created_at || u.last_seen || new Date().toISOString()
        };
      });

      return {
        success: true,
        users,
        total: count || users.length,
        page,
        totalPages: Math.ceil((count || users.length) / pageSize) || 1
      };
    } catch (e) {
      return { success: false, error: e?.message, users: [], total: 0 };
    }
  }

  // 3. Fetch Specific Player's Per-Game Stats Breakdown
  async fetchUserGameBreakdown(userId) {
    const supabase = getSupabase();
    const defaultBreakdown = {
      connect4: { rating: 1200, level: 1, wins: 0, losses: 0, draws: 0 },
      tictactoe: { rating: 1200, level: 1, wins: 0, losses: 0, draws: 0 },
      gomoku: { rating: 1200, level: 1, wins: 0, losses: 0, draws: 0 },
      memory: { rating: 1200, level: 1, wins: 0, losses: 0, draws: 0 },
      ludo: { rating: 1200, level: 1, wins: 0, losses: 0, draws: 0 }
    };

    if (!supabase || !userId) return defaultBreakdown;

    try {
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return defaultBreakdown;

      const breakdown = { ...defaultBreakdown };
      data.forEach(stat => {
        if (stat.game_key && breakdown[stat.game_key]) {
          breakdown[stat.game_key] = {
            rating: Number(stat.rating) || 1200,
            level: Number(stat.level) || 1,
            xp: Number(stat.xp) || 0,
            wins: Number(stat.wins) || 0,
            losses: Number(stat.losses) || 0,
            draws: Number(stat.draws) || 0
          };
        }
      });
      return breakdown;
    } catch (e) {
      return defaultBreakdown;
    }
  }

  // 4. Update Player Career Data (ELO, Level, XP, Wins, Losses, Draws)
  async updateUserCareer(userId, updates) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database client unavailable' };

    try {
      const payload = {
        updated_at: new Date().toISOString()
      };
      if (updates.display_name !== undefined) payload.display_name = String(updates.display_name).trim();
      if (updates.rating !== undefined) payload.rating = Math.max(100, Math.min(3500, Number(updates.rating)));
      if (updates.level !== undefined) payload.level = Math.max(1, Math.min(100, Number(updates.level)));
      if (updates.xp !== undefined) payload.xp = Math.max(0, Number(updates.xp));
      if (updates.wins !== undefined) payload.wins = Math.max(0, Number(updates.wins));
      if (updates.losses !== undefined) payload.losses = Math.max(0, Number(updates.losses));
      if (updates.draws !== undefined) payload.draws = Math.max(0, Number(updates.draws));

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  // 5. Ban or Unban Player Account
  async setPlayerBanStatus(userId, { isBanned = true, reason = '' } = {}) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database client unavailable' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: isBanned,
          ban_reason: isBanned ? (reason.trim() || 'Terms of Service Violation') : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  // 6. Reset Player Stats back to Baseline (1200 ELO, 0 W/L)
  async resetPlayerCareer(userId) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database client unavailable' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          rating: 1200,
          level: 1,
          xp: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };

      // Also reset game_stats if present
      await supabase
        .from('game_stats')
        .update({
          rating: 1200,
          level: 1,
          xp: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  // 7. Delete Player Record
  async deletePlayerRecord(userId) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database client unavailable' };

    try {
      await supabase.from('game_stats').delete().eq('user_id', userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  // 7b. Purge Legacy Guest Rows from Database
  async purgeLegacyGuestRows() {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database client unavailable' };

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .or('id.like.player_%,id.like.user_%,id.like.diagnostic_%,id.like.test_%,id.like.anon_%');

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }


  // 8. Fetch Active Live Multiplayer Game Rooms
  async fetchActiveGameRooms({ statusFilter = 'ACTIVE_ONLY' } = {}) {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      let query = supabase
        .from('game_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'ACTIVE_ONLY') {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        query = query.in('status', ['WAITING', 'PLAYING', 'ACTIVE'])
                     .gt('created_at', sixHoursAgo);
      }

      const { data, error } = await query.limit(50);

      if (error || !data) return [];
      return data.map(r => ({
        roomCode: r.room_code || r.id,
        gameKey: r.game_slug || r.game_key || 'arena',
        player1: r.player_1_name || (r.host_id ? `Player (${r.host_id.substring(0, 6)})` : 'Host'),
        player2: r.player_2_name || (r.is_waiting ? 'Waiting for opponent...' : 'Opponent'),
        status: r.status || (r.is_waiting ? 'WAITING' : 'IN_PROGRESS'),
        createdAt: r.created_at || new Date().toISOString()
      }));
    } catch (e) {
      return [];
    }
  }

  // 8b. Purge Inactive / Expired / Cancelled Game Rooms
  async purgeInactiveRooms() {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database unavailable' };

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('game_rooms')
        .delete()
        .or(`status.eq.CANCELLED,status.eq.EXPIRED,status.eq.FINISHED,created_at.lt.${oneHourAgo}`);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }


  // 9. Force Terminate / Close Stuck Game Room
  async forceTerminateRoom(roomCode) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database client unavailable' };

    try {
      const { error } = await supabase
        .from('game_rooms')
        .delete()
        .eq('room_code', roomCode);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  // 10. Fetch Global Match History
  async fetchGlobalMatches({ limit = 50, gameFilter = 'ALL' } = {}) {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      let query = supabase.from('matches').select('*').order('created_at', { ascending: false }).limit(limit);
      if (gameFilter !== 'ALL') {
        query = query.eq('game_slug', gameFilter);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map(m => ({
        id: m.id,
        gameSlug: m.game_slug,
        player1Name: m.player_1_name || 'Player 1',
        player2Name: m.player_2_name || 'Player 2',
        result: m.result, // 'WIN', 'LOSS', 'DRAW'
        winnerName: m.winner_name || (m.result === 'WIN' ? m.player_1_name : m.result === 'LOSS' ? m.player_2_name : 'Draw'),
        createdAt: m.created_at || new Date().toISOString()
      }));
    } catch (e) {
      return [];
    }
  }

  // 11. Anti-Cheat Heuristic Scanner
  async scanAntiCheatAnomalies() {
    const res = await this.fetchUsersPaginated({ pageSize: 100, sortBy: 'rating', sortOrder: 'desc' });
    if (!res.success || !res.users) return [];

    const flagged = [];
    res.users.forEach(u => {
      const total = u.totalMatches;
      const reasons = [];

      // Flag 1: Impossibly high win rate with non-trivial matches
      if (total >= 10 && u.winRate >= 95) {
        reasons.push(`Suspiciously high win-rate: ${u.winRate}% (${u.wins}W / ${u.losses}L)`);
      }

      // Flag 2: Extreme rating velocity / Grandmaster with low games
      if (u.rating >= 2100 && total < 15) {
        reasons.push(`Grandmaster rating (${u.rating} ELO) with only ${total} matches`);
      }

      // Flag 3: Excessive loss streak / possible rating manipulation
      if (total >= 20 && u.losses > 0 && u.wins === 0) {
        reasons.push(`0% Win Rate with ${total} consecutive losses (possible ELO deflation)`);
      }

      if (reasons.length > 0) {
        flagged.push({
          ...u,
          flags: reasons,
          riskLevel: reasons.length > 1 ? 'CRITICAL' : 'ELEVATED'
        });
      }
    });

    return flagged;
  }

  // 12. System Broadcast Announcement Manager
  async fetchBroadcastFromCloud() {
    const supabase = getSupabase();
    if (!supabase) return this.getBroadcastConfig();

    try {
      const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .eq('id', 'global_broadcast')
        .maybeSingle();

      if (!error && data) {
        const payload = {
          active: Boolean(data.is_active),
          message: String(data.message || '').trim(),
          type: data.type || 'info',
          updatedAt: data.updated_at || new Date().toISOString()
        };
        localStorage.setItem(SYSTEM_BROADCAST_STORAGE_KEY, JSON.stringify(payload));
        return payload;
      }
    } catch (e) {}

    return this.getBroadcastConfig();
  }

  getBroadcastConfig() {
    try {
      const saved = localStorage.getItem(SYSTEM_BROADCAST_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      active: false,
      message: '',
      type: 'info',
      updatedAt: null
    };
  }

  async setBroadcastConfig(config) {
    try {
      const payload = {
        active: Boolean(config.active),
        message: String(config.message || '').trim(),
        type: config.type || 'info',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(SYSTEM_BROADCAST_STORAGE_KEY, JSON.stringify(payload));
      
      // 1. Dispatch custom event for local window/tabs
      window.dispatchEvent(new CustomEvent('games4u_broadcast_change', { detail: payload }));

      // 2. Persist to Supabase database
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase
            .from('system_announcements')
            .upsert({
              id: 'global_broadcast',
              message: payload.message,
              type: payload.type,
              is_active: payload.active,
              updated_at: payload.updatedAt
            });
        } catch (e) {}

        // 3. Broadcast to all active players across devices via Supabase Realtime channel
        const channel = supabase.channel('platform_announcements');
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'announcement_update',
              payload
            }).then(() => {
              supabase.removeChannel(channel);
            }).catch(() => {});
          }
        });
      }

      return { success: true, broadcast: payload };

    } catch (e) {
      return { success: false, error: e?.message };
    }
  }



  // 13. Fetch Aggregated Platform Metrics & Analytics
  async fetchAggregatedPlatformMetrics() {
    const supabase = getSupabase();
    const emptyStats = {
      totalUsers: 0,
      activeToday: 0,
      totalMatches: 0,
      grandmasterCount: 0,
      tierDistribution: { Grandmaster: 0, Master: 0, Diamond: 0, Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 },
      gamePopularity: {
        connect4: 0,
        tictactoe: 0,
        gomoku: 0,
        memory: 0,
        ludo: 0
      }
    };

    if (!supabase) return emptyStats;

    try {
      // 1. Fetch real profiles (excluding guests)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, wins, losses, draws, rating, last_seen, is_banned')
        .not('id', 'like', 'player_%')
        .not('id', 'like', 'diagnostic_%')
        .not('id', 'like', 'test_%')
        .not('id', 'like', 'anon_%');

      if (error || !data) return emptyStats;

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      let totalMatches = 0;
      let activeToday = 0;
      let grandmasterCount = 0;

      const tierCounts = {
        Grandmaster: 0,
        Master: 0,
        Diamond: 0,
        Platinum: 0,
        Gold: 0,
        Silver: 0,
        Bronze: 0
      };

      data.forEach(u => {
        const matches = (Number(u.wins) || 0) + (Number(u.losses) || 0) + (Number(u.draws) || 0);
        const rating = Number(u.rating) || 1200;
        totalMatches += matches;

        if (u.last_seen && u.last_seen > oneDayAgo) activeToday++;
        if (rating >= 1800) grandmasterCount++;

        const tier = getTier(rating, matches);
        if (tier?.name && tierCounts[tier.name] !== undefined) {
          tierCounts[tier.name]++;
        } else {
          tierCounts.Bronze++;
        }
      });

      // 2. Fetch real game stats breakdown to calculate actual game popularity
      const gamePopularity = {
        connect4: 0,
        tictactoe: 0,
        gomoku: 0,
        memory: 0,
        ludo: 0
      };

      const { data: statsData } = await supabase
        .from('game_stats')
        .select('game_key, wins, losses, draws');

      if (Array.isArray(statsData) && statsData.length > 0) {
        statsData.forEach(st => {
          if (st.game_key && gamePopularity[st.game_key] !== undefined) {
            const played = (Number(st.wins) || 0) + (Number(st.losses) || 0) + (Number(st.draws) || 0);
            gamePopularity[st.game_key] += played;
          }
        });
      }

      return {
        totalUsers: data.length,
        activeToday,
        totalMatches,
        grandmasterCount,
        tierDistribution: tierCounts,
        gamePopularity
      };
    } catch (e) {
      return emptyStats;
    }
  }


  // 14. Export Helpers
  exportUsersAsCsv(users) {
    if (!users || users.length === 0) return false;
    const headers = ['User ID', 'Display Name', 'Email', 'Rating', 'Level', 'XP', 'Wins', 'Losses', 'Draws', 'Win Rate %', 'Tier', 'Banned', 'Last Seen', 'Created At'];
    const rows = users.map(u => [
      `"${u.id || ''}"`,
      `"${(u.display_name || u.username || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      u.rating || 1200,
      u.level || 1,
      u.xp || 0,
      u.wins || 0,
      u.losses || 0,
      u.draws || 0,
      u.winRate || 0,
      `"${u.tierName || 'Bronze'}"`,
      u.is_banned ? 'YES' : 'NO',
      `"${u.last_seen || ''}"`,
      `"${u.created_at || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this._downloadFile(csvContent, `games4u_users_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    return true;
  }

  exportMatchesAsCsv(matches) {
    if (!matches || matches.length === 0) return false;
    const headers = ['Match ID', 'Game', 'Player 1', 'Player 2', 'Result', 'Winner', 'Timestamp'];
    const rows = matches.map(m => [
      `"${m.id || ''}"`,
      `"${m.gameSlug || ''}"`,
      `"${(m.player1Name || '').replace(/"/g, '""')}"`,
      `"${(m.player2Name || '').replace(/"/g, '""')}"`,
      `"${m.result || ''}"`,
      `"${(m.winnerName || '').replace(/"/g, '""')}"`,
      `"${m.createdAt || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this._downloadFile(csvContent, `games4u_matches_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    return true;
  }

  exportSystemReportJson(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    this._downloadFile(jsonStr, `games4u_system_audit_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    return true;
  }

  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const adminService = new AdminService();
