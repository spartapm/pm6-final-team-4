-- Apply F-01 partner disconnect + account delete RPCs (safe to re-run)

-- 1) Partner disconnect
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

  insert into couples (user_a_id)
  values (auth.uid())
  returning id into v_new_couple_id;

  return v_new_couple_id;
end;
$$;

grant execute on function disconnect_partner() to authenticated;

-- 2) Account delete
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_couple couples%rowtype;
  v_partner uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  for v_couple in
    select *
    from couples
    where user_a_id = v_uid
       or user_b_id = v_uid
    for update
  loop
    if v_couple.user_b_id is null then
      continue;
    end if;

    if v_couple.user_a_id = v_uid then
      v_partner := v_couple.user_b_id;
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
  end loop;

  delete from couples
  where user_a_id = v_uid
     or user_b_id = v_uid;

  delete from invite_codes where created_by = v_uid or used_by = v_uid;
  delete from letters where sender_id = v_uid or receiver_id = v_uid;
  delete from chore_templates where owner_id = v_uid;
  delete from notifications where user_id = v_uid;
  delete from profiles where user_id = v_uid;

  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function delete_my_account() to authenticated;
