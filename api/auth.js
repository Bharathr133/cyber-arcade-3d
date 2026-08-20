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

  const body = req.body || {};
  const { action, email, password, gamertag, displayName, avatarId, pin, guestStats } = body;

  try {
    // 1. EMAIL + PASSWORD SIGN UP
    if (action === 'signup') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanName = String(displayName || gamertag).trim().substring(0, 20);

      if (!cleanEmail || !password) {
        return sendJsonResponse(res, 400, { error: 'Email and password are required' });
      }

      // Check if GamerTag already exists
      if (cleanTag) {
        const { data: existingTag } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanTag)
          .maybeSingle();

        if (existingTag) {
          return sendJsonResponse(res, 409, { error: `@${cleanTag} is already taken. Please choose another GamerTag.` });
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            gamertag: cleanTag,
            display_name: cleanName,
            avatar_id: String(avatarId || '1')
          }
        }
      });

      if (authError) {
        return sendJsonResponse(res, 400, { error: authError.message });
      }

      const user = authData?.user;
      if (!user) {
        return sendJsonResponse(res, 400, { error: 'Failed to create user account.' });
      }

      // Upsert into public.profiles
      const initialRating = guestStats?.rating || 1200;
      const initialLevel = guestStats?.level || 1;
      const initialXp = guestStats?.xp || 0;
      const initialWins = guestStats?.wins || 0;
      const initialLosses = guestStats?.losses || 0;
      const initialDraws = guestStats?.draws || 0;

      const profilePayload = {
        id: user.id,
        username: cleanTag || split_part_email(cleanEmail),
        display_name: cleanName || cleanTag || 'Player',
        avatar_url: String(avatarId || '1'),
        rating: initialRating,
        level: initialLevel,
        xp: initialXp,
        wins: initialWins,
        losses: initialLosses,
        draws: initialDraws,
        status: 'ONLINE',
        last_seen: new Date().toISOString()
      };

      await supabase.from('profiles').upsert(profilePayload);

      return sendJsonResponse(res, 200, {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: profilePayload.display_name,
          gamertag: profilePayload.username,
          avatarId: profilePayload.avatar_url,
          rating: profilePayload.rating,
          level: profilePayload.level,
          xp: profilePayload.xp,
          wins: profilePayload.wins,
          losses: profilePayload.losses,
          draws: profilePayload.draws,
          isGuest: false
        }
      });
    }

    // 2. EMAIL + PASSWORD SIGN IN
    if (action === 'signin') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !password) {
        return sendJsonResponse(res, 400, { error: 'Email and password are required' });
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError) {
        return sendJsonResponse(res, 401, { error: authError.message });
      }

      const user = authData?.user;
      if (!user) {
        return sendJsonResponse(res, 401, { error: 'Invalid email or password.' });
      }

      // Fetch user profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const userMeta = user.user_metadata || {};
      const verifiedProfile = {
        id: user.id,
        email: user.email,
        name: profile?.display_name || userMeta.display_name || 'Player',
        gamertag: profile?.username || userMeta.gamertag || 'player',
        avatarId: profile?.avatar_url || userMeta.avatar_id || '1',
        rating: Number(profile?.rating) || 1200,
        level: Number(profile?.level) || 1,
        xp: Number(profile?.xp) || 0,
        wins: Number(profile?.wins) || 0,
        losses: Number(profile?.losses) || 0,
        draws: Number(profile?.draws) || 0,
        isGuest: false
      };

      return sendJsonResponse(res, 200, {
        success: true,
        user: verifiedProfile,
        session: authData.session
      });
    }

    // 3. PASSWORD RESET REQUEST
    if (action === 'reset_password') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${req.headers.origin || 'http://localhost:3000'}?action=reset_password`
      });

      if (resetError) {
        return sendJsonResponse(res, 400, { error: resetError.message });
      }

      return sendJsonResponse(res, 200, { success: true, message: 'Password recovery email sent!' });
    }

    // 4. GAMERTAG & PIN REGISTRATION (Casual Fast Auth)
    if (action === 'register_gamertag') {
      const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanName = String(displayName || gamertag).trim().substring(0, 18);
      const cleanPin = String(pin || '').trim();

      if (cleanTag.length < 3 || cleanTag.length > 16) {
        return sendJsonResponse(res, 400, { error: 'GamerTag must be 3–16 characters' });
      }
      if (cleanPin.length < 4) {
        return sendJsonResponse(res, 400, { error: 'PIN must be at least 4 digits' });
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanTag)
        .maybeSingle();

      if (existing) {
        return sendJsonResponse(res, 409, { error: `@${cleanTag} is already taken.` });
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

      await supabase.from('profiles').insert(newProfile);
      try {
        await supabase.from('player_pins').upsert({
          player_id: newUserId,
          pin_hash: pinHash
        });
      } catch (e) {}

      return sendJsonResponse(res, 200, {

        success: true,
        user: {
          id: newUserId,
          name: cleanName,
          gamertag: cleanTag,
          avatarId: String(avatarId || '1'),
          rating: 1200,
          level: 1,
          xp: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          isGuest: false
        }
      });
    }

    // 5. GAMERTAG & PIN LOGIN
    if (action === 'login_gamertag') {
      const cleanTag = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanPin = String(pin || '').trim();

      if (!cleanTag || cleanTag.length < 3) {
        return sendJsonResponse(res, 400, { error: 'GamerTag must be at least 3 characters' });
      }
      if (!cleanPin || cleanPin.length < 4) {
        return sendJsonResponse(res, 400, { error: 'PIN must be at least 4 digits' });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanTag)
        .maybeSingle();

      if (!profile) {
        return sendJsonResponse(res, 401, { error: 'Invalid GamerTag or PIN.' });
      }

      // Verify PIN hash
      const pinHash = hashPinServer(cleanPin);
      const { data: storedPin, error: pinError } = await supabase
        .from('player_pins')
        .select('pin_hash')
        .eq('player_id', profile.id)
        .maybeSingle();

      if (pinError || !storedPin || storedPin.pin_hash !== pinHash) {
        return sendJsonResponse(res, 401, { error: 'Invalid GamerTag or PIN.' });
      }

      return sendJsonResponse(res, 200, {
        success: true,
        user: {
          id: profile.id,
          name: profile.display_name,
          gamertag: profile.username,
          avatarId: profile.avatar_url,
          rating: Number(profile.rating) || 1200,
          level: Number(profile.level) || 1,
          xp: Number(profile.xp) || 0,
          wins: Number(profile.wins) || 0,
          losses: Number(profile.losses) || 0,
          draws: Number(profile.draws) || 0,
          isGuest: false
        }
      });
    }

    return sendJsonResponse(res, 400, { error: 'Unknown action specified' });
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('password') || msg.includes('PIN') || msg.includes('token'))
      return sendJsonResponse(res, 500, { error: 'Internal processing error' });
    return sendJsonResponse(res, 500, { error: 'Internal server error' });
  }
}

function split_part_email(email) {
  return email.split('@')[0] || 'player';
}
