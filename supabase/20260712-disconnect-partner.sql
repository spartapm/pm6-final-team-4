-- Partner disconnect for F-01
-- Run in Supabase SQL Editor after moaseong-schema.sql

create or replace function disconnect_partner()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple couples%rowtype;
  v_partner uuid;
  v_new_couple_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select *
    into v_couple
  from couples
  where user_a_id = auth.uid()
     or user_b_id = auth.uid()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'couple_not_found';
  end if;

  if v_couple.user_b_id is null then
    raise exception 'no_partner_connected';
  end if;

  if v_couple.user_a_id = auth.uid() then
    v_partner := v_couple.user_b_id;
  else
    v_partner := v_couple.user_a_id;
  end if;

  -- Keep existing couple + chores with the other partner only
  if v_couple.user_a_id = auth.uid() then
    update couples
    set user_a_id = v_partner,
        user_b_id = null,
        connected_at = null
    where id = v_couple.id;
  else
    update couples
    set user_b_id = null,
        connected_at = null
    where id = v_couple.id;
  end if;

  -- Initiator gets a fresh solo couple (empty chores after client prepares A-06)
  insert into couples (user_a_id)
  values (auth.uid())
  returning id into v_new_couple_id;

  return v_new_couple_id;
end;
$$;

grant execute on function disconnect_partner() to authenticated;
