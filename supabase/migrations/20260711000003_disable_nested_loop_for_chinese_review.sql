-- The planner's hidden plan for chinese_group_review_state nested the
-- historical session/attempt/char aggregation under the group list, repeating
-- that work across groups. Production EXPLAIN measurements:
--
--   default plan:          ~2.3s,  ~76k shared buffer hits
--   enable_nestloop = off: ~152ms, ~2.6k shared buffer hits
--
-- Scope the planner setting to this function only. PostgreSQL restores the
-- caller's setting when the function returns.

alter function public.chinese_group_review_state(text, integer[], text)
  set enable_nestloop = off;
