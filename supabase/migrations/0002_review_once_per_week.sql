-- One review per user per week.
--
-- The weekly review is the scheduler, so its record is the thing you trust
-- months later when asking what you actually decided. Filing it twice should
-- amend the week's entry, not leave two competing versions of it.

-- Collapse any duplicate weeks that predate the constraint, keeping the most
-- recently created row for each. No-op on a database that never had any.
delete from public.reviews r
using public.reviews newer
where r.user_id = newer.user_id
  and r.week_of = newer.week_of
  and (r.created_at, r.id) < (newer.created_at, newer.id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reviews_user_week_unique'
  ) then
    alter table public.reviews
      add constraint reviews_user_week_unique unique (user_id, week_of);
  end if;
end $$;
