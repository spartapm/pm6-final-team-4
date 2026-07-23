-- Allow connected partners to read each other's nickname/avatar (C-03, D-01, etc.).
-- Own profile write remains restricted to the owner via the existing ALL policy.
-- Safe to re-run in Supabase SQL Editor.

drop policy if exists "profiles are visible to couple partners" on profiles;
create policy "profiles are visible to couple partners" on profiles
  for select to authenticated
  using (
    exists (
      select 1
      from couples
      where couples.user_b_id is not null
        and (
          (couples.user_a_id = auth.uid() and couples.user_b_id = profiles.user_id)
          or (couples.user_b_id = auth.uid() and couples.user_a_id = profiles.user_id)
        )
    )
  );
