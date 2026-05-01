-- ============================================================
-- HACK-CTF Platform — Supabase Schema
-- ============================================================

-- Enable required Postgres extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (length(username) between 3 and 30),
  avatar_url  text,
  bio         text,
  score       integer not null default 0,
  rank        integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Badges earned by each user
create table if not exists public.badges (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  description text,
  icon        text,          -- emoji or icon name
  color       text default '#00f3ff'
);

create table if not exists public.user_badges (
  user_id     uuid references public.profiles(id) on delete cascade,
  badge_id    uuid references public.badges(id)   on delete cascade,
  earned_at   timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ============================================================
-- CHALLENGES
-- ============================================================
create table if not exists public.categories (
  id    uuid primary key default uuid_generate_v4(),
  name  text unique not null,
  color text default '#00f3ff'
);

create table if not exists public.challenges (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text not null,
  category_id uuid references public.categories(id),
  points      integer not null default 100,
  difficulty  text not null check (difficulty in ('easy','medium','hard','insane')) default 'medium',
  flag_hash   text not null,   -- bcrypt hash of the flag
  hints       jsonb  default '[]',
  files       jsonb  default '[]',   -- [{name, url}]
  is_active   boolean not null default true,
  solves      integer not null default 0,
  author      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
create table if not exists public.submissions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  is_correct   boolean not null,
  submitted_at timestamptz not null default now()
);

-- Only one successful solve per user per challenge
create unique index if not exists uq_user_challenge_solved
  on public.submissions (user_id, challenge_id)
  where is_correct = true;

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- Scoreboard view (ranks users by score, then by earliest solve)
create or replace view public.scoreboard as
select
  p.id,
  p.username,
  p.avatar_url,
  p.score,
  count(s.id) filter (where s.is_correct)::int as solves,
  max(s.submitted_at) filter (where s.is_correct) as last_solve,
  rank() over (order by p.score desc, max(s.submitted_at) filter (where s.is_correct) asc) as position
from public.profiles p
left join public.submissions s on s.user_id = p.id
group by p.id;

-- Per-user solved challenges lookup
create or replace view public.user_solves as
select
  s.user_id,
  s.challenge_id
from public.submissions s
where s.is_correct = true;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Automatically create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_challenges_updated_at
  before update on public.challenges
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles   enable row level security;
alter table public.badges      enable row level security;
alter table public.user_badges enable row level security;
alter table public.categories  enable row level security;
alter table public.challenges  enable row level security;
alter table public.submissions enable row level security;

-- profiles: public read, owner write (score/rank are server-only)
create policy "profiles_select"  on public.profiles for select using (true);
-- Users may only update editable fields (username, bio, avatar_url).
-- The WITH CHECK prevents any client-initiated change to score or rank by
-- verifying that the proposed new value matches the current persisted value.
-- Security-definer RPCs (increment_score) bypass RLS entirely and are unaffected.
create policy "profiles_update"  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    AND score = (select p.score from public.profiles p where p.id = auth.uid())
  );

-- badges: public read
create policy "badges_select"    on public.badges    for select using (true);
create policy "user_badges_select" on public.user_badges for select using (true);

-- categories & challenges: public read
create policy "categories_select" on public.categories for select using (true);
create policy "challenges_select" on public.challenges  for select using (is_active = true);

-- submissions: users can insert their own, read their own
create policy "submissions_insert" on public.submissions
  for insert with check (auth.uid() = user_id);
create policy "submissions_select" on public.submissions
  for select using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

insert into public.categories (name, color) values
  ('Web',            '#00f3ff'),
  ('Cryptography',   '#00ff41'),
  ('Reverse',        '#ff00ff'),
  ('Pwn',            '#ff6600'),
  ('Forensics',      '#ffff00'),
  ('OSINT',          '#00ffff'),
  ('Steganography',  '#ff0066'),
  ('Misc',           '#aaaaaa')
on conflict (name) do nothing;

insert into public.badges (name, description, icon, color) values
  ('First Blood',   'First player to solve a challenge',        '🩸', '#ff0000'),
  ('Speedrunner',   'Solved 5 challenges within one hour',      '⚡', '#ffff00'),
  ('Crypto King',   'Solved all cryptography challenges',       '🔐', '#00ff41'),
  ('Web Wizard',    'Solved all web challenges',                '🌐', '#00f3ff'),
  ('Ghost',         'Submitted a flag within 60 seconds',       '👻', '#aaaaaa'),
  ('Completionist', 'Solved every challenge in the platform',   '🏆', '#ffd700')
on conflict (name) do nothing;

-- ============================================================
-- RPC HELPERS (called from the API route)
-- ============================================================

-- Verify a bcrypt-hashed flag
create or replace function public.verify_flag(submitted_flag text, stored_hash text)
returns boolean language sql security definer as $$
  select crypt(submitted_flag, stored_hash) = stored_hash;
$$;

-- Increment challenge solve counter
create or replace function public.increment_solves(challenge_id uuid)
returns void language sql security definer as $$
  update public.challenges
  set solves = solves + 1
  where id = challenge_id;
$$;

-- Increment user score
create or replace function public.increment_score(user_id uuid, points integer)
returns void language sql security definer as $$
  update public.profiles
  set score = score + points
  where id = user_id;
$$;
