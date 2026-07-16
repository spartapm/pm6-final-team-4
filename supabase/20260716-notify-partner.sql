-- Partner notifications: allow authenticated users to notify their couple partner.
-- Previous RLS (auth.uid() = user_id) blocked inserts to the partner's inbox.

create or replace function public.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_chore_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ok boolean := false;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_user_id is null then
    raise exception 'invalid_user';
  end if;

  if p_user_id = v_uid then
    v_ok := true;
  else
    select exists (
      select 1
      from couples c
      where (c.user_a_id = v_uid and c.user_b_id = p_user_id)
         or (c.user_b_id = v_uid and c.user_a_id = p_user_id)
    ) into v_ok;
  end if;

  if not v_ok then
    raise exception 'not_allowed_to_notify';
  end if;

  insert into notifications (user_id, chore_id, title, body)
  values (p_user_id, p_chore_id, p_title, p_body);
end;
$$;

revoke all on function public.notify_user(uuid, text, text, uuid) from public;
grant execute on function public.notify_user(uuid, text, text, uuid) to authenticated;

-- Keep owner-only read/update/delete. Inserts go through notify_user (security definer).
drop policy if exists "notifications visible to owner" on notifications;
drop policy if exists "notifications select own" on notifications;
drop policy if exists "notifications update own" on notifications;
drop policy if exists "notifications delete own" on notifications;
drop policy if exists "notifications insert own" on notifications;

create policy "notifications select own" on notifications
  for select to authenticated
  using (auth.uid() = user_id);

create policy "notifications update own" on notifications
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications delete own" on notifications
  for delete to authenticated
  using (auth.uid() = user_id);
