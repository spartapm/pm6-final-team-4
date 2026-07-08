-- Moaseong (team-final-4) Supabase setup
-- Run this once in the Supabase SQL editor after Auth providers are configured.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'assignee_type') then
    create type assignee_type as enum ('me', 'partner', 'none');
  end if;

  if not exists (select 1 from pg_type where typname = 'letter_kind') then
    create type letter_kind as enum ('instant', 'weekly');
  end if;
end $$;

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 10),
  avatar_emoji text not null default '🏰',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid references auth.users(id) on delete set null,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  constraint couples_distinct_users check (user_b_id is null or user_a_id <> user_b_id)
);

create table if not exists invite_codes (
  code text primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists chore_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists weekly_cycles (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (couple_id, week_start)
);

create table if not exists weekly_chores (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references weekly_cycles(id) on delete cascade,
  title text not null,
  category text not null,
  assignee assignee_type not null default 'none',
  assigned_user_id uuid references auth.users(id) on delete set null,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists chore_reactions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references weekly_chores(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now()
);

create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references weekly_cycles(id) on delete cascade,
  chore_id uuid references weekly_chores(id) on delete set null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete set null,
  kind letter_kind not null default 'instant',
  body text not null check (char_length(body) between 1 and 1000),
  reaction text,
  created_at timestamptz not null default now()
);

create table if not exists weekly_stats (
  cycle_id uuid primary key references weekly_cycles(id) on delete cascade,
  completion_rate integer not null default 0 check (completion_rate between 0 and 100),
  me_completed_count integer not null default 0,
  partner_completed_count integer not null default 0,
  sent_letter_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists couples_user_a_idx on couples(user_a_id);
create index if not exists couples_user_b_idx on couples(user_b_id);
create index if not exists invite_codes_couple_idx on invite_codes(couple_id);
create index if not exists chore_templates_owner_idx on chore_templates(owner_id);
create index if not exists weekly_cycles_couple_idx on weekly_cycles(couple_id);
create index if not exists weekly_chores_cycle_idx on weekly_chores(cycle_id);
create index if not exists chore_reactions_chore_idx on chore_reactions(chore_id);
create index if not exists letters_cycle_idx on letters(cycle_id);
create index if not exists letters_sender_idx on letters(sender_id);
create index if not exists letters_receiver_idx on letters(receiver_id);

create or replace function redeem_invite_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_couple_id uuid;
  v_created_by uuid;
begin
  select couple_id, created_by
    into v_couple_id, v_created_by
  from invite_codes
  where code = v_code
    and used_by is null
  for update;

  if v_couple_id is null then
    raise exception 'invalid_invite_code';
  end if;

  if v_created_by = auth.uid() then
    raise exception 'cannot_use_own_invite_code';
  end if;

  update couples
  set user_b_id = auth.uid(),
      connected_at = now()
  where id = v_couple_id
    and user_b_id is null;

  if not found then
    raise exception 'already_connected';
  end if;

  update invite_codes
  set used_by = auth.uid(),
      used_at = now()
  where code = v_code;

  return v_couple_id;
end;
$$;

grant execute on function redeem_invite_code(text) to authenticated;

alter table profiles enable row level security;
alter table couples enable row level security;
alter table invite_codes enable row level security;
alter table chore_templates enable row level security;
alter table weekly_cycles enable row level security;
alter table weekly_chores enable row level security;
alter table chore_reactions enable row level security;
alter table letters enable row level security;
alter table weekly_stats enable row level security;

drop policy if exists "profiles are owned by user" on profiles;
create policy "profiles are owned by user" on profiles
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "couples are visible to members" on couples;
create policy "couples are visible to members" on couples
  for select to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "users can create own couple" on couples;
create policy "users can create own couple" on couples
  for insert to authenticated
  with check (auth.uid() = user_a_id);

drop policy if exists "members can update own couple" on couples;
create policy "members can update own couple" on couples
  for update to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id)
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "invite codes are visible to creator or unused joiner" on invite_codes;
create policy "invite codes are visible to creator or unused joiner" on invite_codes
  for select to authenticated
  using (auth.uid() = created_by or used_by is null or auth.uid() = used_by);

drop policy if exists "users can create own invite code" on invite_codes;
create policy "users can create own invite code" on invite_codes
  for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "users can mark invite code used" on invite_codes;
create policy "users can mark invite code used" on invite_codes
  for update to authenticated
  using (used_by is null or auth.uid() = used_by or auth.uid() = created_by)
  with check (auth.uid() = used_by or auth.uid() = created_by);

drop policy if exists "chore templates are owned by user" on chore_templates;
create policy "chore templates are owned by user" on chore_templates
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "weekly cycles are visible to couple members" on weekly_cycles;
create policy "weekly cycles are visible to couple members" on weekly_cycles
  for all to authenticated
  using (
    exists (
      select 1 from couples
      where couples.id = weekly_cycles.couple_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  )
  with check (
    exists (
      select 1 from couples
      where couples.id = weekly_cycles.couple_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  );

drop policy if exists "weekly chores are visible to cycle members" on weekly_chores;
create policy "weekly chores are visible to cycle members" on weekly_chores
  for all to authenticated
  using (
    exists (
      select 1
      from weekly_cycles
      join couples on couples.id = weekly_cycles.couple_id
      where weekly_cycles.id = weekly_chores.cycle_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  )
  with check (
    exists (
      select 1
      from weekly_cycles
      join couples on couples.id = weekly_cycles.couple_id
      where weekly_cycles.id = weekly_chores.cycle_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  );

drop policy if exists "chore reactions are visible to chore cycle members" on chore_reactions;
create policy "chore reactions are visible to chore cycle members" on chore_reactions
  for all to authenticated
  using (
    exists (
      select 1
      from weekly_chores
      join weekly_cycles on weekly_cycles.id = weekly_chores.cycle_id
      join couples on couples.id = weekly_cycles.couple_id
      where weekly_chores.id = chore_reactions.chore_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  )
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from weekly_chores
      join weekly_cycles on weekly_cycles.id = weekly_chores.cycle_id
      join couples on couples.id = weekly_cycles.couple_id
      where weekly_chores.id = chore_reactions.chore_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  );

drop policy if exists "letters are visible to sender and receiver" on letters;
create policy "letters are visible to sender and receiver" on letters
  for all to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id);

drop policy if exists "weekly stats are visible to cycle members" on weekly_stats;
create policy "weekly stats are visible to cycle members" on weekly_stats
  for all to authenticated
  using (
    exists (
      select 1
      from weekly_cycles
      join couples on couples.id = weekly_cycles.couple_id
      where weekly_cycles.id = weekly_stats.cycle_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  )
  with check (
    exists (
      select 1
      from weekly_cycles
      join couples on couples.id = weekly_cycles.couple_id
      where weekly_cycles.id = weekly_stats.cycle_id
        and (auth.uid() = couples.user_a_id or auth.uid() = couples.user_b_id)
    )
  );
