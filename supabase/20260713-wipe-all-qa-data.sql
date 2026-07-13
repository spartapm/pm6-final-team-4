-- Moaseong full QA wipe
-- Run in Supabase SQL Editor when you want a clean slate for partner-connect / onboarding QA.
-- WARNING: deletes ALL app data and ALL auth users (Kakao accounts in this project).

begin;

truncate table
  chore_reactions,
  notifications,
  letters,
  weekly_stats,
  weekly_chores,
  weekly_cycles,
  invite_codes,
  chore_templates,
  couples,
  profiles
restart identity cascade;

-- Removes Kakao login accounts for this project
delete from auth.users;

commit;

-- Quick check (optional):
-- select
--   (select count(*) from auth.users) as auth_users,
--   (select count(*) from profiles) as profiles,
--   (select count(*) from couples) as couples,
--   (select count(*) from chore_templates) as templates;
