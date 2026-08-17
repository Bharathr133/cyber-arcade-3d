-- ==============================================================================
-- CHAMPIONSHIP ARENA 3D: MASTER SUPABASE SQL SCHEMA & PERMISSIONS FIX
-- Copy and paste this into your Supabase Dashboard -> SQL Editor and click RUN.
-- ==============================================================================

-- 1. PROFILES TABLE (Player Identity, Overall Career ELO & Level)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_id TEXT DEFAULT '1',
  rating INTEGER DEFAULT 1200,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAME_STATS TABLE (Per-Game Ratings & Records: Gomoku, Connect 4, Tic-Tac-Toe)
CREATE TABLE IF NOT EXISTS public.game_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_key TEXT NOT NULL,
  rating INTEGER DEFAULT 1200,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_key)
);

-- 3. MATCHES TABLE (Global Match History & Audit Logs)
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_key TEXT NOT NULL,
  game_title TEXT NOT NULL,
  opponent_name TEXT NOT NULL,
  outcome TEXT NOT NULL,
  rating_delta INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERFORMANCE INDEXES FOR REAL-TIME LEADERBOARDS
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_rating ON public.game_stats(game_key, rating DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user ON public.matches(user_id, created_at DESC);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 6. PUBLIC ACCESS POLICIES
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public Insert Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public Update Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Game Stats" ON public.game_stats;
DROP POLICY IF EXISTS "Public Insert Game Stats" ON public.game_stats;
DROP POLICY IF EXISTS "Public Update Game Stats" ON public.game_stats;
CREATE POLICY "Public Read Game Stats" ON public.game_stats FOR SELECT USING (true);
CREATE POLICY "Public Insert Game Stats" ON public.game_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Game Stats" ON public.game_stats FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Matches" ON public.matches;
DROP POLICY IF EXISTS "Public Insert Matches" ON public.matches;
CREATE POLICY "Public Read Matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public Insert Matches" ON public.matches FOR INSERT WITH CHECK (true);

-- 7. GRANT ROLE PERMISSIONS (Fixes "permission denied for table profiles")
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
