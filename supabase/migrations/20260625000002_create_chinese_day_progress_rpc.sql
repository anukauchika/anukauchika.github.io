create or replace function public.chinese_day_progress(
  p_dataset_id text,
  p_group_ids integer[]
)
returns table (
  date_key date,
  count integer,
  duration_ms integer,
  sessions integer
)
language sql
security invoker
stable
set search_path = public
as $$
  with group_list as (
    select g.group_id::integer
    from unnest(p_group_ids) as g(group_id)
  ),
  sessions_by_day as (
    select
      (gs.done_at at time zone 'UTC')::date as date_key,
      sum(
        least(
          greatest(
            extract(epoch from gs.done_at - gs.started_at) * 1000,
            0
          ),
          7200000
        )
      )::integer as duration_ms,
      count(*)::integer as sessions
    from public.group_session gs
    join group_list gl on gl.group_id = gs.group_id
    where gs.user_id = (select auth.uid())
      and gs.dataset_id = p_dataset_id
      and gs.practice_type in ('s', 'p')
      and gs.done_at is not null
    group by (gs.done_at at time zone 'UTC')::date
  ),
  words_by_day as (
    select
      (wa.done_at at time zone 'UTC')::date as date_key,
      count(distinct gs.group_id::text || '::' || wa.word_id::text)::integer as count
    from public.group_session gs
    join group_list gl on gl.group_id = gs.group_id
    join public.word_attempt wa on wa.group_session_id = gs.id
    where gs.user_id = (select auth.uid())
      and gs.dataset_id = p_dataset_id
      and gs.practice_type in ('s', 'p')
      and wa.done_at is not null
    group by (wa.done_at at time zone 'UTC')::date
  )
  select
    coalesce(s.date_key, w.date_key) as date_key,
    coalesce(w.count, 0)::integer as count,
    coalesce(s.duration_ms, 0)::integer as duration_ms,
    coalesce(s.sessions, 0)::integer as sessions
  from sessions_by_day s
  full outer join words_by_day w on w.date_key = s.date_key
  order by date_key;
$$;

revoke execute on function public.chinese_day_progress(text, integer[]) from public;
revoke execute on function public.chinese_day_progress(text, integer[]) from anon;
grant execute on function public.chinese_day_progress(text, integer[]) to authenticated;
