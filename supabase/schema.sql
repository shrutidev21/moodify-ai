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
