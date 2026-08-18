import { getSupabase } from '../utils/supabaseClient.js';
import { saveUserProfile, generateUUID } from '../utils/userProfile.js';
import { fetchFromApi } from './apiClient.js';

// Secure SHA-256 Hashing for PINs
async function hashPin(pin) {
  const cleanPin = String(pin).trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(cleanPin + '_cyber_arcade_salt_2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < cleanPin.length; i++) {
    hash = ((hash << 5) - hash) + cleanPin.charCodeAt(i);
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

class AuthService {
  // 1. Register a unique GamerTag & PIN
  async registerGamerTag({ gamertag, displayName, pin, avatarId = '1' }) {
    // 1. Try Serverless Backend Proxy first (Zero Client Key Exposure)
    const apiRes = await fetchFromApi('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'register',
        gamertag,
        displayName,
        pin,
        avatarId
      })
    });

    if (apiRes.ok && apiRes.data?.success && apiRes.data?.profile) {
      saveUserProfile(apiRes.data.profile);
      return { success: true, profile: apiRes.data.profile };
    }

    if (apiRes.data?.error && apiRes.status !== 404 && apiRes.status !== 503) {
      return { success: false, error: apiRes.data.error };
    }

    // 2. Direct Fallback
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: apiRes.error || 'Database unavailable' };


    const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanName = String(displayName || gamertag).trim().substring(0, 18);
    const cleanPin = String(pin || '').trim();

    if (cleanTag.length < 3 || cleanTag.length > 16) {
      return { success: false, error: 'GamerTag must be 3–16 characters (letters, numbers, underscores)' };
    }
    if (cleanPin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits' };
    }

    try {
      // Check if GamerTag is already taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanTag)
        .maybeSingle();

      if (existing) {
        return { success: false, error: `@${cleanTag} is already taken. Please choose another GamerTag.` };
      }

      const pinHash = await hashPin(cleanPin);
      const userId = 'gamer_' + generateUUID().substring(0, 12);

      const newProfile = {
        id: userId,
        username: cleanTag,
        display_name: cleanName,
        avatar_url: String(avatarId),
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
        return { success: false, error: error.message };
      }

      const localProfile = {
        id: userId,
        gamertag: cleanTag,
        name: cleanName,
        avatarId: String(avatarId),
        rating: 1200,
        level: 1,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        isGuest: false,
        isRegistered: true,
        history: []
      };

      saveUserProfile(localProfile);
      return { success: true, profile: localProfile };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 2. Log in with GamerTag & PIN
  async loginGamerTag({ gamertag, pin }) {
    // 1. Try Serverless Backend Proxy first (Zero Client Key Exposure)
    const apiRes = await fetchFromApi('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        gamertag,
        pin
      })
    });

    if (apiRes.ok && apiRes.data?.success && apiRes.data?.profile) {
      saveUserProfile(apiRes.data.profile);
      return { success: true, profile: apiRes.data.profile };
    }

    if (apiRes.data?.error && apiRes.status !== 404 && apiRes.status !== 503) {
      return { success: false, error: apiRes.data.error };
    }

    // 2. Direct Fallback
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: apiRes.error || 'Database unavailable' };

    const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanPin = String(pin || '').trim();

    if (!cleanTag) return { success: false, error: 'Enter your GamerTag' };
    if (!cleanPin) return { success: false, error: 'Enter your PIN' };


    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanTag)
        .maybeSingle();

      if (error || !user) {
        return { success: false, error: `Account @${cleanTag} not found. Please check spelling or register.` };
      }

      const localProfile = {
        id: user.id,
        gamertag: user.username,
        name: user.display_name || user.username,
        avatarId: user.avatar_url || '1',
        rating: user.rating || 1200,
        level: user.level || 1,
        xp: user.xp || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
        draws: user.draws || 0,
        isGuest: false,
        isRegistered: true,
        history: []
      };

      saveUserProfile(localProfile);
      return { success: true, profile: localProfile };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 3. Claim / Upgrade Guest Account to permanent GamerTag
  async claimGuestAccount({ currentUserId, gamertag, displayName, pin, avatarId }) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Database unavailable' };

    const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanName = String(displayName || gamertag).trim().substring(0, 18);
    const cleanPin = String(pin || '').trim();

    if (cleanTag.length < 3 || cleanTag.length > 16) {
      return { success: false, error: 'GamerTag must be 3–16 characters' };
    }
    if (cleanPin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits' };
    }

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanTag)
        .neq('id', currentUserId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: `@${cleanTag} is already taken by another player.` };
      }

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          username: cleanTag,
          display_name: cleanName,
          avatar_url: String(avatarId || '1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const localProfile = {
        id: currentUserId,
        gamertag: cleanTag,
        name: cleanName,
        avatarId: String(avatarId || '1'),
        rating: updated?.rating || 1200,
        level: updated?.level || 1,
        xp: updated?.xp || 0,
        wins: updated?.wins || 0,
        losses: updated?.losses || 0,
        draws: updated?.draws || 0,
        isGuest: false,
        isRegistered: true,
        history: []
      };

      saveUserProfile(localProfile);
      return { success: true, profile: localProfile };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const authService = new AuthService();
