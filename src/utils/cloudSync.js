// 100% Zero-Exposure Cloud Sync & Leaderboard Client
// Dispatches all sync operations exclusively through secure serverless backend endpoints (/api/*).

class CloudSyncService {

  // 1. Sync Profile & Stats via Serverless API Proxy
  async syncProfileToCloud(profile, latestMatch = null) {
    if (!profile?.id) return { success: false, reason: 'NO_PROFILE' };

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

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            id: profile.id,
            name: profile.name,
            avatarId: profile.avatarId || '1',

            rating: profile.rating || 1200,
            level: profile.level || 1,
            xp: profile.xp || 0,
            wins: profile.wins || 0,
            losses: profile.losses || 0,
            draws: profile.draws || 0
          },
          gameStats: profile.gameStats || {},
          lastMatch: latestMatch
        })
      });

      if (res.ok) {
        return { success: true };
      } else {
        return { success: false, status: res.status };
      }
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }

  // 2. Fetch Profile from Cloud via Serverless API
  async fetchProfileFromCloud(userId) {
    if (!userId) return null;
    try {
      const res = await fetch(`/api/sync?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.profile || null;
      }
    } catch (e) {}
    return null;
  }

  // 3. Fetch Global Leaderboard from Serverless API
  async fetchGlobalLeaderboard(gameKey = 'connect4', limit = 50) {
    try {
      const res = await fetch(`/api/leaderboard?game=${encodeURIComponent(gameKey)}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.leaderboard) ? data.leaderboard : (Array.isArray(data) ? data : []);
      }
    } catch (e) {}
    return [];
  }
}

export const cloudSync = new CloudSyncService();
