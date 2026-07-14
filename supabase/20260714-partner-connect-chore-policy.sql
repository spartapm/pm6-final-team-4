-- F-01 partner connect chore merge policy
-- Run in Supabase SQL Editor (safe to re-run).

drop function if exists redeem_invite_code(text);

create or replace function current_week_start_moaseong()
returns date
language sql
stable
as $$
  -- ISO week: Monday start (matches app currentWeekRange)
  select date_trunc('week', timezone('Asia/Seoul', now()))::date;
$$;

create or replace function couple_current_week_chore_count(p_couple_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_week_start date := current_week_start_moaseong();
  v_cycle_id uuid;
  v_count integer := 0;
begin
  select id into v_cycle_id
  from weekly_cycles
  where couple_id = p_couple_id
    and week_start = v_week_start
  limit 1;

  if v_cycle_id is null then
    return 0;
  end if;

  select count(*)::integer into v_count
  from weekly_chores
  where cycle_id = v_cycle_id;

  return coalesce(v_count, 0);
end;
$$;

create or replace function enterer_solo_current_week_chore_count(p_user_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_week_start date := current_week_start_moaseong();
  v_count integer := 0;
begin
  select coalesce(sum(sub.cnt), 0)::integer into v_count
  from (
    select count(wc.id) as cnt
    from couples c
    join weekly_cycles cy on cy.couple_id = c.id and cy.week_start = v_week_start
    left join weekly_chores wc on wc.cycle_id = cy.id
    where c.user_a_id = p_user_id
      and c.user_b_id is null
    group by cy.id
  ) sub;

  return coalesce(v_count, 0);
end;
$$;

create or replace function preview_invite_connect(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_couple_id uuid;
  v_created_by uuid;
  v_enterer uuid := auth.uid();
  v_gen_count integer := 0;
  v_ent_count integer := 0;
begin
  if v_enterer is null then
    raise exception 'not_authenticated';
  end if;

  select couple_id, created_by
    into v_couple_id, v_created_by
  from invite_codes
  where code = v_code
    and used_by is null;

  if v_couple_id is null then
    raise exception 'invalid_invite_code';
  end if;

  if v_created_by = v_enterer then
    raise exception 'cannot_use_own_invite_code';
  end if;

  v_gen_count := couple_current_week_chore_count(v_couple_id);
  v_ent_count := enterer_solo_current_week_chore_count(v_enterer);

  return json_build_object(
    'generator_has_chores', v_gen_count > 0,
    'enterer_has_chores', v_ent_count > 0,
    'needs_confirm', (v_gen_count > 0 and v_ent_count > 0)
  );
end;
$$;

grant execute on function preview_invite_connect(text) to authenticated;

-- Generator chores win when present; else move enterer chores.
-- When both have chores, p_confirm_replace must be true.
create or replace function redeem_invite_code(p_code text, p_confirm_replace boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_generator_couple_id uuid;
  v_created_by uuid;
  v_enterer uuid := auth.uid();
  v_week_start date := current_week_start_moaseong();
  v_week_end date;
  v_gen_cycle_id uuid;
  v_gen_count integer := 0;
  v_ent_count integer := 0;
  v_solo record;
  v_solo_cycle_id uuid;
begin
  if v_enterer is null then
    raise exception 'not_authenticated';
  end if;

  v_week_end := v_week_start + 6;

  select couple_id, created_by
    into v_generator_couple_id, v_created_by
  from invite_codes
  where code = v_code
    and used_by is null
  for update;

  if v_generator_couple_id is null then
    raise exception 'invalid_invite_code';
  end if;

  if v_created_by = v_enterer then
    raise exception 'cannot_use_own_invite_code';
  end if;

  if exists (
    select 1 from couples
    where user_b_id = v_enterer
       or (user_a_id = v_enterer and user_b_id is not null)
  ) then
    raise exception 'already_connected';
  end if;

  v_gen_count := couple_current_week_chore_count(v_generator_couple_id);
  v_ent_count := enterer_solo_current_week_chore_count(v_enterer);

  if v_gen_count > 0 and v_ent_count > 0 and not coalesce(p_confirm_replace, false) then
    raise exception 'chores_conflict_needs_confirm';
  end if;

  update couples
  set user_b_id = v_enterer,
      connected_at = now()
  where id = v_generator_couple_id
    and user_b_id is null;

  if not found then
    raise exception 'already_connected';
  end if;

  select id into v_gen_cycle_id
  from weekly_cycles
  where couple_id = v_generator_couple_id
    and week_start = v_week_start
  limit 1;

  if v_gen_count > 0 then
    null;
  elsif v_ent_count > 0 then
    if v_gen_cycle_id is null then
      insert into weekly_cycles (couple_id, week_start, week_end)
      values (v_generator_couple_id, v_week_start, v_week_end)
      returning id into v_gen_cycle_id;
    end if;

    for v_solo in
      select c.id as couple_id
      from couples c
      where c.user_a_id = v_enterer
        and c.user_b_id is null
        and c.id <> v_generator_couple_id
    loop
      select id into v_solo_cycle_id
      from weekly_cycles
      where couple_id = v_solo.couple_id
        and week_start = v_week_start
      limit 1;

      if v_solo_cycle_id is not null then
        insert into weekly_chores (cycle_id, title, category, assignee, completed_by, completed_at)
        select v_gen_cycle_id, title, category, 'none'::assignee_type, null, null
        from weekly_chores
        where cycle_id = v_solo_cycle_id;
      end if;
    end loop;
  end if;

  delete from couples
  where user_a_id = v_enterer
    and user_b_id is null
    and id <> v_generator_couple_id;

  update invite_codes
  set used_by = v_enterer,
      used_at = now()
  where code = v_code;

  return v_generator_couple_id;
end;
$$;

grant execute on function redeem_invite_code(text, boolean) to authenticated;
