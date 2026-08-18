import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';
import crypto from 'crypto';

// Server-side SHA-256 Hashing with private server salt
function hashPinServer(pin) {
  const clean = String(pin || '').trim();
  const salt = process.env.PIN_SALT || '_cyber_arcade_salt_2026';
  return crypto.createHash('sha256').update(clean + salt).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return sendJsonResponse(res, 503, { error: 'Backend database service unavailable' });
  }

  const { action, gamertag, displayName, pin, avatarId, userId, statsUpdate } = req.body || {};

  try {
    // 1. REGISTER GAMERTAG & PIN
    if (action === 'register') {
      const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanName = String(displayName || gamertag).trim().substring(0, 18);
      const cleanPin = String(pin || '').trim();

      if (cleanTag.length < 3 || cleanTag.length > 16) {
        return sendJsonResponse(res, 400, { error: 'GamerTag must be 3–16 characters (letters, numbers, underscores)' });
      }
      if (cleanPin.length < 4) {
        return sendJsonResponse(res, 400, { error: 'PIN must be at least 4 digits' });
      }

      // Check if GamerTag is already taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanTag)
        .maybeSingle();

      if (existing) {
        return sendJsonResponse(res, 409, { error: `@${cleanTag} is already taken. Please choose another GamerTag.` });
      }

      const pinHash = hashPinServer(cleanPin);
      const newUserId = 'gamer_' + crypto.randomBytes(6).toString('hex');

      const newProfile = {
        id: newUserId,
        username: cleanTag,
        display_name: cleanName,
        avatar_url: String(avatarId || '1'),
        rating: 1200,
        level: 1,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        status: 'ONLINE',
        last_seen: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').insert(newProfile);
      if (error) {
        return sendJsonResponse(res, 500, { error: error.message });
      }

      return sendJsonResponse(res, 200, {
        success: true,
        profile: {
          id: newUserId,
          gamertag: cleanTag,
          name: cleanName,
          avatarId: String(avatarId || '1'),
          rating: 1200,
          level: 1,
          xp: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          isGuest: false,
          isRegistered: true,
          history: []
        }
      });
    }

    // 2. LOGIN WITH GAMERTAG & PIN
    if (action === 'login') {
      const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanPin = String(pin || '').trim();

      if (!cleanTag || !cleanPin) {
        return sendJsonResponse(res, 400, { error: 'Please enter both GamerTag and PIN' });
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanTag)
        .maybeSingle();

      if (error || !profile) {
        return sendJsonResponse(res, 404, { error: `GamerTag @${cleanTag} not found. Please register first.` });
      }

      return sendJsonResponse(res, 200, {
        success: true,
        profile: {
          id: profile.id,
          gamertag: profile.username,
          name: profile.display_name || profile.username,
          avatarId: profile.avatar_url || '1',
          rating: profile.rating || 1200,
          level: profile.level || 1,
          xp: profile.xp || 0,
          wins: profile.wins || 0,
          losses: profile.losses || 0,
          draws: profile.draws || 0,
          isGuest: false,
          isRegistered: true,
          history: []
        }
      });
    }

    // 3. CHECK GAMERTAG AVAILABILITY
    if (action === 'check-gamertag') {
      const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanTag)
        .maybeSingle();

      return sendJsonResponse(res, 200, { available: !existing });
    }

    return sendJsonResponse(res, 400, { error: 'Invalid action' });
  } catch (err) {
    return sendJsonResponse(res, 500, { error: err.message || 'Internal server error' });
  }
}
