-- Run after moaseong-schema.sql

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chore_id uuid references weekly_chores(id) on delete set null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications(user_id);

alter table notifications enable row level security;

drop policy if exists "notifications visible to owner" on notifications;
create policy "notifications visible to owner" on notifications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
