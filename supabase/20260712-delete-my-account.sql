-- Account deletion for F-01
-- Prefer running 20260713-apply-account-rpcs.sql (includes disconnect + delete).

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
