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
  -- RBAC: manually assigned in Supabase dashboard / SQL editor
  role        text not null default 'user' check (role in ('user','admin','staff')),
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
-- TEAMS
-- ============================================================
create table if not exists public.teams (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null check (length(name) between 3 and 40),
  captain_id  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.team_members (
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('captain','member')),
  joined_at   timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- Ensure 1 team per user
create unique index if not exists uq_team_members_user
  on public.team_members(user_id);

create table if not exists public.team_invites (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  code_hash   text not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  used_at     timestamptz,
  used_by     uuid references public.profiles(id) on delete set null
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
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
create table if not exists public.submissions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  team_id      uuid references public.teams(id) on delete set null,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  is_correct   boolean not null,
  points_awarded integer,
  submitted_at timestamptz not null default now()
);

-- Only one successful solve per user per challenge
create unique index if not exists uq_user_challenge_solved
  on public.submissions (user_id, challenge_id)
  where is_correct = true;

-- Team cannot solve same challenge multiple times (optional but typical)
create unique index if not exists uq_team_challenge_solved
  on public.submissions (team_id, challenge_id)
  where is_correct = true and team_id is not null;

-- ============================================================
-- PUBLIC VIEWS (NO flag_hash)
-- ============================================================
create or replace view public.challenges_public as
select
  c.id,
  c.title,
  c.description,
  c.category_id,
  c.points,
  c.difficulty,
  c.hints,
  c.files,
  c.is_active,
  c.solves,
  c.author,
  c.created_at,
  c.updated_at
from public.challenges c
where c.is_active = true and c.deleted_at is null;

-- Individual scoreboard (public)
create or replace view public.scoreboard_public as
select
  p.id,
  p.username,
  p.avatar_url,
  p.score,
  count(s.id) filter (where s.is_correct)::int as solves,
  max(s.submitted_at) filter (where s.is_correct) as last_solve,
  rank() over (
    order by p.score desc,
    max(s.submitted_at) filter (where s.is_correct) asc
  ) as position
from public.profiles p
left join public.submissions s on s.user_id = p.id
group by p.id;

-- Team scoreboard (public)
create or replace view public.team_scoreboard_public as
select
  t.id,
  t.name,
  coalesce(sum(s.points_awarded), 0)::int as score,
  count(s.id) filter (where s.is_correct)::int as solves,
  max(s.submitted_at) filter (where s.is_correct) as last_solve,
  rank() over (
    order by coalesce(sum(s.points_awarded),0) desc,
    max(s.submitted_at) filter (where s.is_correct) asc
  ) as position
from public.teams t
left join public.submissions s on s.team_id = t.id and s.is_correct = true
where t.deleted_at is null
group by t.id;

-- Per-user solved challenges lookup (must be secure)
create or replace view public.user_solves
with (security_invoker = true) as
select
  s.user_id,
  s.challenge_id
from public.submissions s
where s.is_correct = true;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
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

create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

-- Admin helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Verify a bcrypt-hashed flag
create or replace function public.verify_flag(submitted_flag text, stored_hash text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select crypt(submitted_flag, stored_hash) = stored_hash;
$$;

-- Dynamic scoring:
--  - base points diminish as more TEAMS solve the challenge
--  - first/second/third blood bonus for teams: +100/+50/+25
create or replace function public.compute_team_points(p_challenge_id uuid, p_team_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_points int;
  team_solves_before int;
  solve_rank int;
  bonus int := 0;
  diminished int;
begin
  -- Get base points from challenge
  select c.points into base_points
  from public.challenges c
  where c.id = p_challenge_id and c.is_active = true and c.deleted_at is null;

  if base_points is null then
    raise exception 'Challenge not found' using errcode = '22023';
  end if;

  -- How many distinct teams already have a correct solve for this challenge?
  select count(*) into team_solves_before
  from (
    select distinct s.team_id
    from public.submissions s
    where s.challenge_id = p_challenge_id
      and s.is_correct = true
      and s.team_id is not null
  ) t;

  -- Rank for blood bonus = team_solves_before + 1
  solve_rank := team_solves_before + 1;
  if solve_rank = 1 then
    bonus := 100;
  elsif solve_rank = 2 then
    bonus := 50;
  elsif solve_rank = 3 then
    bonus := 25;
  end if;

  -- Diminish: base / (1 + floor(team_solves_before/5)) as a simple curve
  -- You can tune the curve later.
  diminished := greatest(1, (base_points / (1 + (team_solves_before / 5))));

  return diminished + bonus;
end;
$$;

grant execute on function public.compute_team_points(uuid, uuid) to authenticated;

-- Atomic submit_flag: user solve (for individual scoreboard) and team solve (team points)
create or replace function public.submit_flag(challenge_id uuid, submitted_flag text)
returns table (correct boolean, already_solved boolean, points_awarded integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid;
  ch record;
  ok boolean;
  inserted_user_id uuid;
  inserted_team_id uuid;
  my_team uuid;
  team_points int;
  team_inserted boolean := false;
  user_inserted boolean := false;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Unauthorized' using errcode = '28000';
  end if;

  select id, flag_hash, points
  into ch
  from public.challenges
  where id = challenge_id and is_active = true and deleted_at is null;

  if ch.id is null then
    raise exception 'Challenge not found' using errcode = '22023';
  end if;

  ok := public.verify_flag(trim(submitted_flag), ch.flag_hash);

  if ok is false then
    insert into public.submissions(user_id, challenge_id, is_correct)
    values (uid, challenge_id, false);

    return query select false, false, null;
    return;
  end if;

  -- Insert user solve (one per user)
  insert into public.submissions(user_id, challenge_id, is_correct)
  values (uid, challenge_id, true)
  on conflict do nothing
  returning id into inserted_user_id;

  if inserted_user_id is not null then
    user_inserted := true;
    -- Increment individual profile score by base challenge points
    update public.profiles
    set score = score + ch.points
    where id = uid;

    -- Increment challenge solves counter (total solves)
    update public.challenges
    set solves = solves + 1
    where id = challenge_id;
  end if;

  -- Team solve if user is in a team
  select tm.team_id into my_team
  from public.team_members tm
  where tm.user_id = uid;

  if my_team is not null then
    team_points := public.compute_team_points(challenge_id, my_team);

    insert into public.submissions(user_id, team_id, challenge_id, is_correct, points_awarded)
    values (uid, my_team, challenge_id, true, team_points)
    on conflict do nothing
    returning id into inserted_team_id;

    if inserted_team_id is not null then
      team_inserted := true;
    end if;
  end if;

  if user_inserted is false then
    return query select true, true, null;
  else
    return query select true, false, case when team_inserted then team_points else null end;
  end if;
end;
$$;

grant execute on function public.submit_flag(uuid, text) to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles     enable row level security;
alter table public.badges       enable row level security;
alter table public.user_badges  enable row level security;
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;
alter table public.categories   enable row level security;
alter table public.challenges   enable row level security;
alter table public.submissions  enable row level security;

-- profiles: public read, owner write (score/rank are server-only)
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    AND score = (select p.score from public.profiles p where p.id = auth.uid())
  );

-- teams: public read (basic), members read their team, captains/admin manage
create policy "teams_select_public" on public.teams for select using (deleted_at is null);
create policy "team_members_select" on public.team_members for select using (true);

-- categories are public read via client
create policy "categories_select" on public.categories for select using (true);

-- challenges: PUBLIC MUST NOT SELECT DIRECTLY (flag_hash). Use challenges_public view.
-- Admin can manage challenges.
create policy "challenges_admin_all" on public.challenges
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- submissions: users insert/read their own rows.
create policy "submissions_insert" on public.submissions
  for insert with check (auth.uid() = user_id);
create policy "submissions_select" on public.submissions
  for select using (auth.uid() = user_id);

-- badges public read
create policy "badges_select" on public.badges for select using (true);
create policy "user_badges_select" on public.user_badges for select using (true);

-- Grants for public views
grant select on public.challenges_public to anon, authenticated;
grant select on public.scoreboard_public to anon, authenticated;
grant select on public.team_scoreboard_public to anon, authenticated;
grant select on public.user_solves to authenticated;

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
