create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  display_name text,
  avatar_url text,
  preferences jsonb not null default '{"darkMode": true, "defaultLanguage": "Any", "explicitContent": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  prompt text not null,
  mood text,
  genre text,
  language text,
  activity text,
  ai_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  search_id uuid references public.searches(id) on delete set null,
  title text not null,
  description text,
  prompt text,
  cover_url text,
  mood text,
  genre text,
  language text,
  activity text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_songs (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  channel_title text,
  thumbnail_url text,
  duration text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.searches enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;

create policy "Users can read own profile" on public.users
  for select using (auth.uid() = auth_user_id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = auth_user_id);

create policy "Users own searches" on public.searches
  for all using (user_id in (select id from public.users where auth_user_id = auth.uid()));

create policy "Users own playlists" on public.playlists
  for all using (user_id in (select id from public.users where auth_user_id = auth.uid()));

create policy "Users own playlist songs" on public.playlist_songs
  for all using (
    playlist_id in (
      select p.id from public.playlists p
      join public.users u on u.id = p.user_id
      where u.auth_user_id = auth.uid()
    )
  );

-- Profiles table for user metadata (keeps parity with API upsert logic)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (
    id in (select id from public.users where auth_user_id = auth.uid())
  );

create policy "Users can update own profile" on public.profiles
  for update using (
    id in (select id from public.users where auth_user_id = auth.uid())
  );

-- Mood history table to store each recommendation request
create table if not exists public.mood_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  user_input text not null,
  primary_mood text,
  secondary_mood text,
  recommended_songs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.mood_history enable row level security;

create policy "Users own mood history" on public.mood_history
  for all using (
    user_id in (select id from public.users where auth_user_id = auth.uid())
  );

-- Add a JSONB songs snapshot to playlists for simple persistence of generated lists
alter table public.playlists
  add column if not exists songs jsonb not null default '[]'::jsonb;

-- Cache AI prompt analysis to avoid repeated Gemini calls for repeated prompts/categories.
create table if not exists public.ai_analysis_cache (
  prompt_key text primary key,
  category_key text not null,
  prompt text not null,
  mood text not null,
  genre text not null,
  language text not null,
  activity text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_analysis_cache_category_key_idx
  on public.ai_analysis_cache(category_key);
