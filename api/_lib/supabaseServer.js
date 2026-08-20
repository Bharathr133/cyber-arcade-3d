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

// Simple in-memory rate limiter (resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;

export function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

// Sanitize error messages to prevent info leakage
export function sanitizeError(err) {
  const msg = String(err?.message || '');
  if (msg.includes('password') || msg.includes('secret') || msg.includes('key') || msg.includes('token'))
    return 'Internal processing error';
  if (msg.length > 120) return 'Internal server error';
  return msg || 'Internal server error';
}
