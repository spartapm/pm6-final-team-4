-- Moaseong: reset app data, keep chore_templates
-- Run in Supabase SQL Editor.
-- Does NOT delete auth.users or chore_templates.
-- After running, re-login / re-pair partners as needed.

begin;

-- Child → parent order (TRUNCATE ... CASCADE also works, but explicit is safer to review)
truncate table
  chore_reactions,
  notifications,
  letters,
  weekly_stats,
  weekly_chores,
  weekly_cycles,
  invite_codes,
  couples,
  profiles
restart identity cascade;

-- chore_templates intentionally NOT truncated

commit;

-- Optional check:
-- select
--   (select count(*) from chore_templates) as templates,
--   (select count(*) from couples) as couples,
--   (select count(*) from weekly_chores) as chores,
--   (select count(*) from letters) as letters,
--   (select count(*) from profiles) as profiles;
