import { saveUserProfile, getUserProfile, logoutUserProfile } from '../utils/userProfile.js';
import { validateEmail } from '../utils/validation.js';
import { getSupabase } from '../utils/supabaseClient.js';
import { cloudSync } from '../utils/cloudSync.js';

class AuthService {
  // 1. Google OAuth 1-Click Sign In
  async signInWithGoogle() {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
          return {
            success: false,
            error: 'Google Sign-In is not enabled in your Supabase Dashboard. Go to Authentication → Providers → Google and toggle it ON, or sign in with Email & Password below.'
          };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (e) {
      return { success: false, error: e?.message || 'Google Sign-In request failed.' };
    }
  }

  // 2. Standard Email & Password Signup (Supabase Auth)
  async signUpWithEmail({ email, password, name }) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const cleanEmail = emailValidation.sanitizedEmail;
    const cleanName = (name || cleanEmail.split('@')[0]).trim().substring(0, 25);
    const supabase = getSupabase();

    if (!supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName,
            name: cleanName
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If Supabase has email confirmation enabled, session will be null until verified
      if (data?.user && !data.session) {
        return {
          success: true,
          requiresVerification: true,
          email: cleanEmail,
          message: 'Verification link sent! Please check your inbox to activate your account.'
        };
      }

      if (data?.user && data.session) {
        const guest = getUserProfile();
        const verifiedProfile = {
          id: data.user.id,
          email: data.user.email,
          name: cleanName,
          rating: guest?.rating || 1200,
          wins: guest?.wins || 0,
          losses: guest?.losses || 0,
          draws: guest?.draws || 0,
          level: guest?.level || 1,
          xp: guest?.xp || 0,
          gameStats: guest?.gameStats,
          isGuest: false,
          isRegistered: true,
          hasCustomName: true,
          authProvider: 'email'
        };

        saveUserProfile(verifiedProfile);
        await cloudSync.syncProfileToCloud(verifiedProfile);
        return { success: true, requiresVerification: false, profile: verifiedProfile, user: data.user, session: data.session };
      }

      return { success: true, requiresVerification: true, email: cleanEmail, message: 'Account created! Please check your email to confirm registration.' };
    } catch (e) {
      return { success: false, error: e?.message || 'Sign up failed.' };
    }
  }

  // 3. Standard Email & Password Login (Supabase Auth)
  async signInWithEmail({ email, password }) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Please enter your password.' };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitizedEmail,
        password
      });

      if (error) {
        const isUnconfirmed = error.message?.toLowerCase().includes('email not confirmed') || 
                              error.message?.toLowerCase().includes('not confirmed') ||
                              error.status === 400 && error.message?.includes('Email');

        if (isUnconfirmed) {
          return {
            success: false,
            unconfirmed: true,
            email: emailValidation.sanitizedEmail,
            error: 'Your email address is not verified yet. Please check your inbox or click Resend below.'
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Fetch persistent data from database
        const cloudData = await cloudSync.fetchProfileFromCloud(data.user.id);
        const metadata = data.user.user_metadata || {};

        const verifiedProfile = {
          id: data.user.id,
          email: data.user.email,
          name: cloudData?.name || metadata.display_name || metadata.name || data.user.email.split('@')[0],
          avatarId: cloudData?.avatarId || metadata.avatarId || '1',
          rating: cloudData?.rating || Number(metadata.rating) || 1200,
          wins: cloudData?.wins || Number(metadata.wins) || 0,
          losses: cloudData?.losses || Number(metadata.losses) || 0,
          draws: cloudData?.draws || Number(metadata.draws) || 0,
          level: cloudData?.level || Number(metadata.level) || 1,
          xp: cloudData?.xp || Number(metadata.xp) || 0,
          gameStats: cloudData?.gameStats || undefined,
          isGuest: false,
          isRegistered: true,
          hasCustomName: true,
          authProvider: data.user.app_metadata?.provider || 'email'
        };

        saveUserProfile(verifiedProfile);
        await cloudSync.syncProfileToCloud(verifiedProfile);
        return { success: true, profile: verifiedProfile, user: data.user, session: data.session };
      }

      return { success: false, error: 'Login failed. Please verify your credentials.' };
    } catch (e) {
      return { success: false, error: e?.message || 'Sign in failed.' };
    }
  }

  // 3.5 Resend Email Verification Link
  async resendVerificationEmail(email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailValidation.sanitizedEmail,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Verification link resent! Please check your inbox.' };
    } catch (e) {
      return { success: false, error: e?.message || 'Failed to resend verification email.' };
    }
  }


  // 4. Password Reset via Supabase
  async sendPasswordResetEmail(email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.sanitizedEmail, {
        redirectTo: window.location.origin
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Password recovery email sent! Check your inbox.' };
    } catch (e) {
      return { success: false, error: e?.message || 'Failed to send recovery email.' };
    }
  }

  // 5. Update Account Password (Supabase Auth)
  async updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Password updated successfully!' };
    } catch (e) {
      return { success: false, error: e?.message || 'Failed to update password.' };
    }
  }

  // 6. Sign Out
  async signOut() {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {}

    logoutUserProfile();
    return { success: true };
  }

  // 7. Live Auth State Listener (Supabase onAuthStateChange)
  setupAuthListener(callback) {
    try {
      const supabase = getSupabase();
      if (!supabase?.auth?.onAuthStateChange) {
        return () => {};
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && callback) {
          const user = session.user;
          // Fetch existing data from database
          const cloudData = await cloudSync.fetchProfileFromCloud(user.id);
          const metadata = user.user_metadata || {};

          const verifiedProfile = {
            id: user.id,
            email: user.email,
            name: cloudData?.name || metadata.display_name || metadata.name || user.email?.split('@')[0] || 'Player',
            avatarId: cloudData?.avatarId || metadata.avatarId || '1',
            rating: cloudData?.rating || Number(metadata.rating) || 1200,
            level: cloudData?.level || Number(metadata.level) || 1,
            xp: cloudData?.xp || Number(metadata.xp) || 0,
            wins: cloudData?.wins || Number(metadata.wins) || 0,
            losses: cloudData?.losses || Number(metadata.losses) || 0,
            draws: cloudData?.draws || Number(metadata.draws) || 0,
            gameStats: cloudData?.gameStats || undefined,
            isGuest: false,
            isRegistered: true,
            hasCustomName: true,
            authProvider: user.app_metadata?.provider || 'email'
          };

          saveUserProfile(verifiedProfile);
          // Ensure DB has the latest snapshot
          await cloudSync.syncProfileToCloud(verifiedProfile);
          callback(verifiedProfile);
        } else if (event === 'SIGNED_OUT' && callback) {
          const guestProfile = getUserProfile();
          callback(guestProfile);
        }
      });

      return () => {
        if (subscription?.unsubscribe) subscription.unsubscribe();
      };
    } catch (e) {
      return () => {};
    }
  }
}

export const authService = new AuthService();
