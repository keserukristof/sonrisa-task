-- Increment 2 (#4, "News alerts need a keyword"): a news alert must have at
-- least one keyword, or every article would notify it.
--
-- Existing active news alerts with no keyword are paused first, so the check
-- can be added without rejecting rows that were valid before. A paused alert
-- may keep no keyword; resuming it without adding one is refused by the
-- check, which the alert form turns into its message.

update public.alerts
set active = false
where category = 'news'
  and cardinality(keywords) = 0
  and active;

alter table public.alerts
  add constraint alerts_news_needs_keywords
  check (category <> 'news' or cardinality(keywords) > 0 or not active);

comment on constraint alerts_news_needs_keywords on public.alerts is
  'An active news alert has at least one keyword. Violations surface as "News alerts need at least one keyword, or every article would notify you."';
