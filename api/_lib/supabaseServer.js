// Private Serverless Supabase Client (Zero Client-Side Exposure)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let serverSupabaseInstance = null;

export function getServerSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Serverless Backend: SUPABASE_URL or SUPABASE_KEY missing in server environment.');
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

// Allowed Domains for CORS & Origin Protection (Anti-Leeching)
const ALLOWED_ORIGINS = [
  'localhost',
  '127.0.0.1',
  '.vercel.app',
  'cyber-arcade-3d'
];

export function validateOrigin(req) {
  const origin = req.headers['origin'] || req.headers['referer'] || '';
  if (!origin) return true; // Direct server-to-server or same-origin request

  const isAllowed = ALLOWED_ORIGINS.some(domain => origin.includes(domain));
  return isAllowed;
}

// Standard JSON Response Helper with Security Headers & CORS Lockdown
export function sendJsonResponse(res, statusCode, data, req = null) {
  if (req && !validateOrigin(req)) {
    return res.status(403).json({ error: 'Access Forbidden: Unauthorized Domain.' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(statusCode).json(data);
}

// In-memory rate limiter per IP / client key (resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 80;

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

// Sanitize error messages to prevent database credential leaks
export function sanitizeError(err) {
  const msg = String(err?.message || err || '');
  if (msg.includes('password') || msg.includes('secret') || msg.includes('key') || msg.includes('token') || msg.includes('supabase')) {
    return 'Internal processing error';
  }
  if (msg.length > 120) return 'Internal server error';
  return msg || 'Internal server error';
}
