import { createClient } from '@supabase/supabase-js';

// Environment-Only Supabase Configuration (Industry Standard & Secure)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    supabaseInstance = null;
  }
}

export function getSupabase() {
  return supabaseInstance;
}

export function isCloudConfigured() {
  return !!supabaseInstance;
}
