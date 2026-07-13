-- Account deletion for F-01
-- Run after 20260712-disconnect-partner.sql (optional; independent)

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

  -- Detach from shared couples so the partner keeps chores/history
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

  -- Remove any remaining couples owned by this user (solo cycles cascade)
  delete from couples
  where user_a_id = v_uid
     or user_b_id = v_uid;

  delete from chore_templates where owner_id = v_uid;
  delete from notifications where user_id = v_uid;
  delete from profiles where user_id = v_uid;

  -- Removes auth identity; related FKs cascade / set null per schema
  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function delete_my_account() to authenticated;
