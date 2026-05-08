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
-- SUBMISSIONS (attempt logs; mainly incorrect)
-- ============================================================
create table if not exists public.submissions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  team_id      uuid references public.teams(id) on delete set null,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  is_correct   boolean not null,
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- SOLVES (normalized)
-- ============================================================
create table if not exists public.user_solves (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  points_awarded integer not null,
  solved_at    timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create table if not exists public.team_solves (
  id           uuid primary key default uuid_generate_v4(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  solved_by    uuid references public.profiles(id) on delete set null,
  points_awarded integer not null,
  blood_rank   integer,
  solved_at    timestamptz not null default now(),
  unique (team_id, challenge_id)
);

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
  coalesce(sum(us.points_awarded), 0)::int as score,
  count(us.id)::int as solves,
  max(us.solved_at) as last_solve,
  rank() over (
    order by coalesce(sum(us.points_awarded),0) desc,
    max(us.solved_at) asc
  ) as position
from public.profiles p
left join public.user_solves us on us.user_id = p.id
group by p.id;

-- Team scoreboard (public)
create or replace view public.team_scoreboard_public as
select
  t.id,
  t.name,
  coalesce(sum(ts.points_awarded), 0)::int as score,
  count(ts.id)::int as solves,
  max(ts.solved_at) as last_solve,
  rank() over (
    order by coalesce(sum(ts.points_awarded),0) desc,
    max(ts.solved_at) asc
  ) as position
from public.teams t
left join public.team_solves ts on ts.team_id = t.id
where t.deleted_at is null
group by t.id;

-- Per-user solved challenges lookup
create or replace view public.user_solves_view
with (security_invoker = true) as
select
  us.user_id,
  us.challenge_id
from public.user_solves us;

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

-- Verify a bcrypt-hashed flag (pgcrypto lives in schema 'extensions' in Supabase)
create or replace function public.verify_flag(submitted_flag text, stored_hash text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select extensions.crypt(submitted_flag, stored_hash) = stored_hash;
$$;

-- Dynamic scoring:
--  - base points diminish as more TEAMS solve the challenge
--  - first/second/third blood bonus for teams: +100/+50/+25
create or replace function public.compute_team_points(p_challenge_id uuid)
returns table(points integer, blood_rank integer)
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
  select c.points into base_points
  from public.challenges c
  where c.id = p_challenge_id and c.is_active = true and c.deleted_at is null;

  if base_points is null then
    raise exception 'Challenge not found' using errcode = '22023';
  end if;

  select count(*) into team_solves_before
  from (
    select distinct ts.team_id
    from public.team_solves ts
    where ts.challenge_id = p_challenge_id
  ) t;

  solve_rank := team_solves_before + 1;
  if solve_rank = 1 then
    bonus := 100;
  elsif solve_rank = 2 then
    bonus := 50;
  elsif solve_rank = 3 then
    bonus := 25;
  end if;

  diminished := greatest(1, (base_points / (1 + (team_solves_before / 5))));

  return query select diminished + bonus, solve_rank;
end;
$$;

grant execute on function public.compute_team_points(uuid) to authenticated;

-- Atomic submit_flag
create or replace function public.submit_flag(challenge_id uuid, submitted_flag text)
returns table (correct boolean, already_solved boolean, team_points_awarded integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid;
  my_team uuid;
  ch record;
  ok boolean;
  user_inserted boolean := false;
  team_inserted boolean := false;
  team_points int;
  team_rank int;
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
    insert into public.submissions(user_id, challenge_id, team_id, is_correct)
    values (uid, challenge_id, (select team_id from public.team_members where user_id = uid), false);
    return query select false, false, null;
    return;
  end if;

  -- Individual solve
  begin
    insert into public.user_solves(user_id, challenge_id, points_awarded)
    values (uid, challenge_id, ch.points);
    user_inserted := true;

    update public.profiles
    set score = score + ch.points
    where id = uid;

    update public.challenges
    set solves = solves + 1
    where id = challenge_id;
  exception when unique_violation then
    user_inserted := false;
  end;

  -- Team solve
  select tm.team_id into my_team
  from public.team_members tm
  where tm.user_id = uid;

  if my_team is not null then
    select points, blood_rank into team_points, team_rank
    from public.compute_team_points(challenge_id);

    begin
      insert into public.team_solves(team_id, challenge_id, solved_by, points_awarded, blood_rank)
      values (my_team, challenge_id, uid, team_points, team_rank);
      team_inserted := true;
    exception when unique_violation then
      team_inserted := false;
    end;
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
alter table public.user_solves  enable row level security;
alter table public.team_solves  enable row level security;

create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    AND score = (select p.score from public.profiles p where p.id = auth.uid())
  );

create policy "teams_select_public" on public.teams for select using (deleted_at is null);
create policy "team_members_select" on public.team_members for select using (true);

create policy "categories_select" on public.categories for select using (true);

create policy "challenges_admin_all" on public.challenges
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "submissions_insert" on public.submissions
  for insert with check (auth.uid() = user_id);
create policy "submissions_select" on public.submissions
  for select using (auth.uid() = user_id);

create policy "user_solves_select" on public.user_solves
  for select using (auth.uid() = user_id);

create policy "team_solves_select_team" on public.team_solves
  for select using (
    public.is_admin()
    OR exists (
      select 1 from public.team_members tm
      where tm.team_id = team_solves.team_id and tm.user_id = auth.uid()
    )
  );

create policy "badges_select" on public.badges for select using (true);
create policy "user_badges_select" on public.user_badges for select using (true);

grant select on public.challenges_public to anon, authenticated;
grant select on public.scoreboard_public to anon, authenticated;
grant select on public.team_scoreboard_public to anon, authenticated;
grant select on public.user_solves_view to authenticated;

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
