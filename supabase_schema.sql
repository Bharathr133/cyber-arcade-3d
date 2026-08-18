-- ==============================================================================
-- ENTERPRISE ARCADE PLATFORM: MASTER SUPABASE SQL SCHEMA & AUTHORITATIVE RPCS
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor and click RUN.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Dynamically drop all existing/overloaded versions of RPC functions without ambiguity
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.proname, oidvectortypes(p.proargtypes) as argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN ('rpc_create_room', 'rpc_join_room', 'rpc_find_or_create_public_match', 'rpc_submit_game_move')
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
    END LOOP;
END $$;

-- 2. Non-destructive table schema updates (Zero data loss)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  display_name TEXT NOT NULL DEFAULT 'Player',
  avatar_url TEXT DEFAULT '1',
  rating INTEGER DEFAULT 1200,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ONLINE',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on existing profiles table without dropping data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Player';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Player';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT '1';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '1';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 1200;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS draws INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ONLINE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop NOT NULL constraints if they were set on legacy columns
ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN display_name DROP NOT NULL;



-- -- Drop strict foreign keys from session tables to profiles (Allows guests to play without creating profile rows)
ALTER TABLE public.game_rooms DROP CONSTRAINT IF EXISTS game_rooms_host_id_fkey;
ALTER TABLE public.room_players DROP CONSTRAINT IF EXISTS room_players_user_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_player_1_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_player_2_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_winner_id_fkey;
ALTER TABLE public.game_moves DROP CONSTRAINT IF EXISTS game_moves_player_id_fkey;
ALTER TABLE public.game_stats DROP CONSTRAINT IF EXISTS game_stats_user_id_fkey;

-- Clean up any lingering guest profiles from the profiles table (Keeps only real registered accounts)
DELETE FROM public.profiles 
WHERE id LIKE 'player_%' 
   OR id LIKE 'diagnostic_%' 
   OR id LIKE 'test_user_%' 
   OR id LIKE 'anon_%';

-- 2. GAME STATS TABLE (Per-Game Ratings & Records)
CREATE TABLE IF NOT EXISTS public.game_stats (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
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

-- 3. GAME ROOMS TABLE (Lobbies & Matchmaking)
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug TEXT NOT NULL,
  host_id TEXT NOT NULL,
  room_code TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'WAITING',
  max_players INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 4. ROOM PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.room_players (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  player_slot INTEGER NOT NULL,
  is_ready BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 5. MATCHES TABLE (Active & Historical Matches)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug TEXT NOT NULL,
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE SET NULL,
  player_1_id TEXT NOT NULL,
  player_2_id TEXT NOT NULL,
  result TEXT DEFAULT 'ACTIVE',
  winner_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 6. GAME STATES TABLE (Authoritative Real-Time Game Board & Turns)
CREATE TABLE IF NOT EXISTS public.game_states (
  id BIGSERIAL PRIMARY KEY,
  match_id UUID UNIQUE NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  board_state JSONB NOT NULL,
  current_turn TEXT NOT NULL,
  move_number INTEGER DEFAULT 0,
  state_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'ACTIVE',
  winner_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. GAME MOVES TABLE (Granular Move Audit Trail)
CREATE TABLE IF NOT EXISTS public.game_moves (
  id BIGSERIAL PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  move_number INTEGER NOT NULL,
  move_data JSONB NOT NULL,
  client_move_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_rating ON public.game_stats(game_key, rating DESC);
CREATE INDEX IF NOT EXISTS idx_game_rooms_queue ON public.game_rooms(game_slug, status, is_private, created_at);
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_matches_players ON public.matches(player_1_id, player_2_id, result);
CREATE INDEX IF NOT EXISTS idx_game_states_match ON public.game_states(match_id);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- 10. PUBLIC RLS POLICIES
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

DROP POLICY IF EXISTS "Public Read Rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Public Insert Rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Public Update Rooms" ON public.game_rooms;
CREATE POLICY "Public Read Rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Public Insert Rooms" ON public.game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Rooms" ON public.game_rooms FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Room Players" ON public.room_players;
DROP POLICY IF EXISTS "Public Insert Room Players" ON public.room_players;
CREATE POLICY "Public Read Room Players" ON public.room_players FOR SELECT USING (true);
CREATE POLICY "Public Insert Room Players" ON public.room_players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Matches" ON public.matches;
DROP POLICY IF EXISTS "Public Insert Matches" ON public.matches;
DROP POLICY IF EXISTS "Public Update Matches" ON public.matches;
CREATE POLICY "Public Read Matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public Insert Matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Matches" ON public.matches FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Game States" ON public.game_states;
DROP POLICY IF EXISTS "Public Insert Game States" ON public.game_states;
DROP POLICY IF EXISTS "Public Update Game States" ON public.game_states;
CREATE POLICY "Public Read Game States" ON public.game_states FOR SELECT USING (true);
CREATE POLICY "Public Insert Game States" ON public.game_states FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Game States" ON public.game_states FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Game Moves" ON public.game_moves;
DROP POLICY IF EXISTS "Public Insert Game Moves" ON public.game_moves;
CREATE POLICY "Public Read Game Moves" ON public.game_moves FOR SELECT USING (true);
CREATE POLICY "Public Insert Game Moves" ON public.game_moves FOR INSERT WITH CHECK (true);

-- 11. GRANT PERMISSIONS TO ANON & AUTHENTICATED ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ==============================================================================
-- 12. AUTHORITATIVE STORED PROCEDURES (RPCS)
-- ==============================================================================

-- RPC 1: rpc_create_room (With real user name and avatar)
CREATE OR REPLACE FUNCTION public.rpc_create_room(
  p_game_slug TEXT,
  p_is_private BOOLEAN DEFAULT FALSE,
  p_user_id TEXT DEFAULT NULL,
  p_player_name TEXT DEFAULT NULL,
  p_avatar_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id TEXT;
  v_room_code TEXT;
  v_room_row RECORD;
BEGIN
  -- Only update profile if this user has an existing saved/claimed profile (DO NOT insert for guests!)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles
    SET display_name = COALESCE(p_player_name, display_name),
        name = COALESCE(p_player_name, name),
        avatar_url = COALESCE(p_avatar_id, avatar_url),
        avatar_id = COALESCE(p_avatar_id, avatar_id),
        status = 'ONLINE',
        last_seen = NOW()
    WHERE id = v_user_id;
  END IF;

  v_room_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));


  INSERT INTO public.game_rooms (
    game_slug,
    host_id,
    room_code,
    is_private,
    status,
    max_players,
    expires_at
  ) VALUES (
    p_game_slug,
    v_user_id,
    v_room_code,
    p_is_private,
    'WAITING',
    2,
    NOW() + INTERVAL '24 hours'
  )
  RETURNING * INTO v_room_row;

  INSERT INTO public.room_players (
    room_id,
    user_id,
    player_slot,
    is_ready
  ) VALUES (
    v_room_row.id,
    v_user_id,
    1,
    TRUE
  );

  RETURN json_build_object(
    'success', true,
    'room_id', v_room_row.id,
    'room_code', v_room_code,
    'game_slug', p_game_slug,
    'is_private', p_is_private,
    'status', v_room_row.status,
    'created_at', v_room_row.created_at
  );
END;
$$;

-- RPC 2: rpc_join_room (With real user name and avatar)
CREATE OR REPLACE FUNCTION public.rpc_join_room(
  p_room_id UUID DEFAULT NULL,
  p_room_code TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_player_name TEXT DEFAULT NULL,
  p_avatar_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id TEXT;
  v_room RECORD;
  v_match RECORD;
  v_init_board JSONB;
  v_host_profile RECORD;
BEGIN

  v_user_id := COALESCE(p_user_id, 'player_' || substring(gen_random_uuid()::text from 1 for 8));

  -- Only update profile if this user has an existing saved/claimed profile (DO NOT insert for guests!)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles
    SET display_name = COALESCE(p_player_name, display_name),
        name = COALESCE(p_player_name, name),
        avatar_url = COALESCE(p_avatar_id, avatar_url),
        avatar_id = COALESCE(p_avatar_id, avatar_id),
        status = 'ONLINE',
        last_seen = NOW()
    WHERE id = v_user_id;
  END IF;

  IF p_room_id IS NOT NULL THEN

    SELECT * INTO v_room FROM public.game_rooms WHERE id = p_room_id AND status = 'WAITING' AND expires_at > NOW() FOR UPDATE;
  ELSIF p_room_code IS NOT NULL THEN
    SELECT * INTO v_room FROM public.game_rooms WHERE room_code = upper(p_room_code) AND status = 'WAITING' AND expires_at > NOW() FOR UPDATE;
  ELSE
    RAISE EXCEPTION 'INVALID_PARAMETERS: Provide p_room_id or p_room_code';
  END IF;

  IF v_room.id IS NULL THEN
    RAISE EXCEPTION 'ROOM_NOT_FOUND: Room does not exist, expired, or already full';
  END IF;

  IF v_room.host_id = v_user_id THEN
    RAISE EXCEPTION 'ALREADY_IN_ROOM: Host cannot join as guest';
  END IF;

  INSERT INTO public.room_players (room_id, user_id, player_slot, is_ready)
  VALUES (v_room.id, v_user_id, 2, TRUE)
  ON CONFLICT (room_id, user_id) DO NOTHING;

  UPDATE public.game_rooms SET status = 'PLAYING' WHERE id = v_room.id;

  INSERT INTO public.matches (
    game_slug,
    room_id,
    player_1_id,
    player_2_id,
    result,
    started_at
  ) VALUES (
    v_room.game_slug,
    v_room.id,
    v_room.host_id,
    v_user_id,
    'ACTIVE',
    NOW()
  )
  RETURNING * INTO v_match;

  IF v_room.game_slug = 'tictactoe' THEN
    v_init_board := jsonb_build_array(NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
  ELSIF v_room.game_slug = 'connect4' THEN
    v_init_board := jsonb_build_array(
      jsonb_build_array(0,0,0,0,0,0,0), jsonb_build_array(0,0,0,0,0,0,0),
      jsonb_build_array(0,0,0,0,0,0,0), jsonb_build_array(0,0,0,0,0,0,0),
      jsonb_build_array(0,0,0,0,0,0,0), jsonb_build_array(0,0,0,0,0,0,0)
    );
  ELSE
    v_init_board := '[]'::jsonb;
  END IF;

  INSERT INTO public.game_states (
    match_id,
    board_state,
    current_turn,
    move_number,
    state_version,
    status
  ) VALUES (
    v_match.id,
    v_init_board,
    'X',
    0,
    1,
    'ACTIVE'
  );

  SELECT display_name, avatar_url, rating INTO v_host_profile 
  FROM public.profiles WHERE id = v_room.host_id;

  RETURN json_build_object(
    'success', true,
    'match_id', v_match.id,
    'room_id', v_room.id,
    'player_slot', 2,
    'role', 'O',
    'status', 'PLAYING',
    'opponent', json_build_object(
      'name', COALESCE(v_host_profile.display_name, 'Host Player'),
      'avatarId', COALESCE(v_host_profile.avatar_url, '1'),
      'rating', COALESCE(v_host_profile.rating, 1200)
    )
  );
END;
$$;


-- RPC 3: rpc_find_or_create_public_match (Atomic Matchmaking Queue)
CREATE OR REPLACE FUNCTION public.rpc_find_or_create_public_match(
  p_game_slug TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_player_name TEXT DEFAULT NULL,
  p_avatar_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id TEXT;
  v_waiting_room RECORD;
  v_new_room RECORD;
  v_match RECORD;
  v_init_board JSONB;
  v_host_profile RECORD;
  v_room_code TEXT;
BEGIN
  v_user_id := COALESCE(p_user_id, 'player_' || substring(gen_random_uuid()::text from 1 for 8));

  -- Only update profile if this user has an existing saved/claimed profile (DO NOT insert for guests!)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles
    SET display_name = COALESCE(p_player_name, display_name),
        name = COALESCE(p_player_name, name),
        avatar_url = COALESCE(p_avatar_id, avatar_url),
        avatar_id = COALESCE(p_avatar_id, avatar_id),
        status = 'ONLINE',
        last_seen = NOW()
    WHERE id = v_user_id;
  END IF;

  -- Automatically expire stale waiting rooms older than 30 seconds

  UPDATE public.game_rooms
  SET status = 'EXPIRED'
  WHERE status = 'WAITING'
    AND is_private = FALSE
    AND created_at < (NOW() - INTERVAL '30 seconds');

  -- 1. Try to find a FRESH existing waiting room (<30s old)
  SELECT * INTO v_waiting_room
  FROM public.game_rooms
  WHERE game_slug = p_game_slug
    AND is_private = FALSE
    AND status = 'WAITING'
    AND host_id != v_user_id
    AND created_at > (NOW() - INTERVAL '30 seconds')
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;


  IF v_waiting_room.id IS NOT NULL THEN
    -- Join as Guest (Player 2 / O)
    INSERT INTO public.room_players (room_id, user_id, player_slot, is_ready)
    VALUES (v_waiting_room.id, v_user_id, 2, TRUE)
    ON CONFLICT (room_id, user_id) DO NOTHING;

    UPDATE public.game_rooms SET status = 'PLAYING' WHERE id = v_waiting_room.id;

    INSERT INTO public.matches (
      game_slug,
      room_id,
      player_1_id,
      player_2_id,
      result,
      started_at
    ) VALUES (
      p_game_slug,
      v_waiting_room.id,
      v_waiting_room.host_id,
      v_user_id,
      'ACTIVE',
      NOW()
    )
    RETURNING * INTO v_match;

    IF p_game_slug = 'tictactoe' THEN
      v_init_board := jsonb_build_array(NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
    ELSIF p_game_slug = 'connect4' THEN
      v_init_board := jsonb_build_array(
        jsonb_build_array(0,0,0,0,0,0,0), jsonb_build_array(0,0,0,0,0,0,0),
        jsonb_build_array(0,0,0,0,0,0,0), jsonb_build_array(0,0,0,0,0,0,0),
        jsonb_build_array(0,0,0,0,0,0,0), jsonb_build_array(0,0,0,0,0,0,0)
      );
    ELSE
      v_init_board := '[]'::jsonb;
    END IF;

    INSERT INTO public.game_states (
      match_id,
      board_state,
      current_turn,
      move_number,
      state_version,
      status
    ) VALUES (
      v_match.id,
      v_init_board,
      'X',
      0,
      1,
      'ACTIVE'
    );

    SELECT display_name, avatar_url, rating INTO v_host_profile 
    FROM public.profiles WHERE id = v_waiting_room.host_id;

    RETURN json_build_object(
      'status', 'MATCH_READY',
      'match_id', v_match.id,
      'room_id', v_waiting_room.id,
      'role', 'O',
      'opponent', json_build_object(
        'name', COALESCE(v_host_profile.display_name, 'Player 1'),
        'avatarId', COALESCE(v_host_profile.avatar_url, '1'),
        'rating', COALESCE(v_host_profile.rating, 1200)
      )
    );
  ELSE
    -- Create as Host (Player 1 / X)
    v_room_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

    INSERT INTO public.game_rooms (
      game_slug,
      host_id,
      room_code,
      is_private,
      status,
      max_players,
      expires_at
    ) VALUES (
      p_game_slug,
      v_user_id,
      v_room_code,
      FALSE,
      'WAITING',
      2,
      NOW() + INTERVAL '24 hours'
    )
    RETURNING * INTO v_new_room;

    INSERT INTO public.room_players (
      room_id,
      user_id,
      player_slot,
      is_ready
    ) VALUES (
      v_new_room.id,
      v_user_id,
      1,
      TRUE
    );

    RETURN json_build_object(
      'status', 'WAITING',
      'room', json_build_object(
        'id', v_new_room.id,
        'room_code', v_room_code,
        'status', 'WAITING'
      ),
      'role', 'X'
    );
  END IF;
END;
$$;

-- RPC 4: rpc_cancel_matchmaking (Cancel waiting queue ticket)
CREATE OR REPLACE FUNCTION public.rpc_cancel_matchmaking(
  p_room_id UUID,
  p_user_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.game_rooms
  SET status = 'CANCELLED'
  WHERE id = p_room_id AND host_id = p_user_id AND status = 'WAITING';

  RETURN json_build_object('success', true);
END;
$$;



-- RPC 4: rpc_submit_game_move (Universal Move Processing & ELO Rating Delta Calculation)
CREATE OR REPLACE FUNCTION public.rpc_submit_game_move(
  p_match_id UUID,
  p_move_data JSONB,
  p_user_id TEXT DEFAULT NULL,
  p_client_move_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id TEXT;
  v_match RECORD;
  v_state RECORD;
  v_new_board JSONB;
  v_next_sym TEXT := 'O';
  v_is_win BOOLEAN := FALSE;
  v_is_draw BOOLEAN := FALSE;
  v_winner_id TEXT := NULL;
  v_other_user_id TEXT := NULL;
BEGIN
  v_user_id := p_user_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User ID required';
  END IF;

  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;

  IF v_match.result != 'ACTIVE' THEN
    RAISE EXCEPTION 'MATCH_ALREADY_FINISHED';
  END IF;

  IF v_user_id != v_match.player_1_id AND v_user_id != v_match.player_2_id THEN
    RAISE EXCEPTION 'NOT_A_MATCH_PLAYER';
  END IF;

  SELECT * INTO v_state FROM public.game_states WHERE match_id = p_match_id FOR UPDATE;
  IF v_state.id IS NULL THEN
    RAISE EXCEPTION 'GAME_STATE_NOT_FOUND';
  END IF;

  IF v_user_id = v_match.player_1_id THEN
    v_other_user_id := v_match.player_2_id;
  ELSE
    v_other_user_id := v_match.player_1_id;
  END IF;

  -- Process client-authoritative move payload
  IF p_move_data ? 'board' THEN
    v_new_board := p_move_data->'board';
    IF p_move_data ? 'turn' THEN
      v_next_sym := p_move_data->>'turn';
    END IF;
    IF (p_move_data->>'result') = 'WIN' THEN
      v_is_win := TRUE;
      v_winner_id := v_user_id;
    ELSIF (p_move_data->>'result') = 'DRAW' THEN
      v_is_draw := TRUE;
    END IF;
  ELSE
    v_new_board := v_state.board_state;
  END IF;

  -- Record move in audit log
  INSERT INTO public.game_moves (
    match_id, player_id, move_number, move_data, client_move_id
  ) VALUES (
    p_match_id, v_user_id, v_state.move_number + 1, p_move_data, p_client_move_id
  );

  -- Terminal Win or Draw Handling with ELO updates
  IF v_is_win OR v_is_draw THEN
    UPDATE public.matches
    SET result = CASE WHEN v_is_win THEN 'WIN' ELSE 'DRAW' END,
        winner_id = v_winner_id,
        ended_at = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_match.started_at))::INT
    WHERE id = p_match_id;

    UPDATE public.game_states
    SET board_state = v_new_board,
        status = CASE WHEN v_is_win THEN 'WIN' ELSE 'DRAW' END,
        winner_id = v_winner_id,
        state_version = v_state.state_version + 1,
        updated_at = NOW()
    WHERE match_id = p_match_id;

    -- Update Player 1 & Player 2 Career Stats
    IF v_is_win THEN
      UPDATE public.profiles
      SET rating = GREATEST(100, rating + 16),
          wins = wins + 1,
          xp = xp + 30,
          level = LEAST(100, 1 + (xp + 30) / 100),
          updated_at = NOW()
      WHERE id = v_user_id 
        AND (id NOT LIKE 'player_%' AND id NOT LIKE 'anon_%' AND id NOT LIKE 'diagnostic_%');

      UPDATE public.profiles
      SET rating = GREATEST(100, rating - 16),
          losses = losses + 1,
          xp = xp + 10,
          level = LEAST(100, 1 + (xp + 10) / 100),
          updated_at = NOW()
      WHERE id = v_other_user_id 
        AND (id NOT LIKE 'player_%' AND id NOT LIKE 'anon_%' AND id NOT LIKE 'diagnostic_%');
    ELSIF v_is_draw THEN
      UPDATE public.profiles
      SET draws = draws + 1,
          xp = xp + 15,
          level = LEAST(100, 1 + (xp + 15) / 100),
          updated_at = NOW()
      WHERE id IN (v_user_id, v_other_user_id) 
        AND (id NOT LIKE 'player_%' AND id NOT LIKE 'anon_%' AND id NOT LIKE 'diagnostic_%');
    END IF;


    RETURN json_build_object(
      'success', true,
      'state', json_build_object(
        'board', v_new_board,
        'turn', v_next_sym,
        'move_number', v_state.move_number + 1,
        'version', v_state.state_version + 1,
        'result', CASE WHEN v_is_win THEN 'WIN' ELSE 'DRAW' END,
        'winner_id', v_winner_id
      )
    );
  ELSE
    -- Match remains active
    UPDATE public.game_states
    SET board_state = v_new_board,
        current_turn = v_next_sym,
        move_number = v_state.move_number + 1,
        state_version = v_state.state_version + 1,
        updated_at = NOW()
    WHERE match_id = p_match_id;

    RETURN json_build_object(
      'success', true,
      'state', json_build_object(
        'board', v_new_board,
        'turn', v_next_sym,
        'move_number', v_state.move_number + 1,
        'version', v_state.state_version + 1,
        'result', 'ACTIVE'
      )
    );
  END IF;
END;
$$;


-- 13. REALTIME PUBLICATION CONFIGURATION
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

