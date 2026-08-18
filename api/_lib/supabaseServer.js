// Serverless Private Supabase Client (Zero Client-Side Exposure)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let serverSupabaseInstance = null;

export function getServerSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Serverless Backend: SUPABASE_URL or SUPABASE_KEY missing in environment.');
    return null;
  }

  if (!serverSupabaseInstance) {
    serverSupabaseInstance = createClient(supabaseUrl.trim(), supabaseKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return serverSupabaseInstance;
}

// Standard JSON Response Helper with Security Headers
export function sendJsonResponse(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(statusCode).json(data);
}
