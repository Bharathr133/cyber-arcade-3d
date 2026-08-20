import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';



function sanitizeError(err) {
  const msg = String(err?.message || err || '');
  if (msg.includes('password') || msg.includes('PIN') || msg.includes('secret')) return 'Internal processing error';
  if (msg.length > 120) return 'Internal server error';
  return msg || 'Internal server error';
}

export default async function handler(req, res) {
  const authHeader = req.headers['x-admin-secret'] || req.headers['authorization'] || '';
  const cleanPass = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!ADMIN_SECRET || cleanPass !== ADMIN_SECRET) {
    return sendJsonResponse(res, 401, { error: 'Unauthorized. Invalid Admin Passcode.' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Backend database service unavailable' });
  }

  const method = req.method;
  const body = req.body || {};
  const query = req.query || {};

  try {
    // 1. GET ALL USERS / ANALYTICS
    if (method === 'GET') {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(100);

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      let totalMatches = 0;
      let activeToday = 0;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      (users || []).forEach(u => {
        totalMatches += (u.wins || 0) + (u.losses || 0) + (u.draws || 0);
        if (u.last_seen && u.last_seen > oneDayAgo) activeToday++;
      });

      return sendJsonResponse(res, 200, {
        success: true,
        users: users || [],
        analytics: {
          totalUsers: users?.length || 0,
          activeToday,
          totalMatches,
          topTierCount: (users || []).filter(u => (u.rating || 1200) >= 1700).length
        }
      });
    }

    // 2. UPDATE USER DETAILS (Allowlist of editable fields)
    if (method === 'POST' && body.action === 'update_user') {
      const { userId, updates } = body;
      if (!userId || !updates || typeof updates !== 'object') {
        return sendJsonResponse(res, 400, { error: 'userId and updates are required' });
      }

      const ALLOWED_FIELDS = ['rating', 'level', 'xp', 'wins', 'losses', 'draws', 'display_name', 'avatar_url'];
      const safeUpdates = {};
      for (const key of Object.keys(updates)) {
        if (ALLOWED_FIELDS.includes(key)) {
          safeUpdates[key] = updates[key];
        }
      }
      safeUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', userId);

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true });
    }

    // 3. DELETE USER
    if (method === 'POST' && body.action === 'delete_user') {
      const { userId } = body;
      if (!userId) {
        return sendJsonResponse(res, 400, { error: 'userId is required' });
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, { success: true });
    }

    return sendJsonResponse(res, 400, { error: 'Invalid request' });
  } catch (err) {
    return sendJsonResponse(res, 500, { error: sanitizeError(err) });
  }
}
