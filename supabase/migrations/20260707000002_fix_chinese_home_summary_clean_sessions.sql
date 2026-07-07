-- chinese_home_summary counted every session done today, including ones that
-- used hints and left the group in 'repeat' state. That double-counts a
-- lesson: it inflates today_sessions while the same group stays in due_count.
-- "Lessons done" should only count clean (no-hint) sessions — the ones that
-- actually advance the group past review. Duration keeps summing all of
-- today's sessions (time spent), unaffected by this fix.

create or replace function public.chinese_home_summary(
  p_dataset_id text,
  p_group_ids integer[],
  p_timezone text
)
returns table (
  today_sessions integer,
  today_duration_ms bigint,
  due_count integer,
  drilled_words integer,
  next_group_id integer,
  next_practice_type char(1),
  next_reason text
)
language sql
security invoker
stable
set search_path = public
as $$
  with group_list as (
    select g.group_id::integer, g.ord::integer
    from unnest(p_group_ids) with ordinality as g(group_id, ord)
  ),
  type_order as (
    select 's'::char(1) as practice_type, 1 as type_ord
    union all
    select 'p'::char(1) as practice_type, 2 as type_ord
  ),
  reviews as (
    select
      r.*,
      gl.ord,
      t.type_ord
    from public.chinese_group_review_state(p_dataset_id, p_group_ids, p_timezone) r
    join group_list gl on gl.group_id = r.group_id
    join type_order t on t.practice_type = r.practice_type
  ),
  active_groups as (
    select group_id, ord
    from reviews
    group by group_id, ord
    having sum(full_count) > 0
  ),
  active_boundary as (
    select max(ord) as max_active_ord
    from active_groups
  ),
  next_new_group as (
    select gl.group_id
    from group_list gl
    cross join active_boundary ab
    where not exists (
        select 1
        from active_groups ag
        where ag.group_id = gl.group_id
      )
      and (
        ab.max_active_ord is null
        or gl.ord > ab.max_active_ord
      )
    order by gl.ord
    limit 1
  ),
  candidates as (
    select
      r.group_id,
      r.practice_type,
      r.reason,
      0 as rank,
      -extract(epoch from r.last_full_at) as primary_order,
      r.ord as secondary_order,
      r.type_ord as tertiary_order
    from reviews r
    where r.reason = 'repeat'

    union all

    select
      r.group_id,
      r.practice_type,
      r.reason,
      1 as rank,
      extract(epoch from r.due_at) as primary_order,
      r.ord as secondary_order,
      r.type_ord as tertiary_order
    from reviews r
    where r.reason = 'due'

    union all

    select
      r.group_id,
      r.practice_type,
      r.reason,
      2 as rank,
      r.ord as primary_order,
      r.type_ord as secondary_order,
      0 as tertiary_order
    from reviews r
    where r.reason = 'new'
      and exists (
        select 1
        from active_groups ag
        where ag.group_id = r.group_id
      )

    union all

    select
      r.group_id,
      r.practice_type,
      r.reason,
      3 as rank,
      r.ord as primary_order,
      r.type_ord as secondary_order,
      0 as tertiary_order
    from reviews r
    join next_new_group nng on nng.group_id = r.group_id
    where r.practice_type = 's'

    union all

    select
      r.group_id,
      r.practice_type,
      r.reason,
      4 as rank,
      extract(epoch from r.due_at) as primary_order,
      r.ord as secondary_order,
      r.type_ord as tertiary_order
    from reviews r
    where r.reason = 'upcoming'
  ),
  next_drill as (
    select
      c.group_id,
      c.practice_type,
      c.reason
    from candidates c
    order by c.rank, c.primary_order, c.secondary_order, c.tertiary_order, c.group_id
    limit 1
  ),
  today_sessions_raw as (
    select
      gs.id,
      gs.started_at,
      gs.done_at,
      coalesce(sum(cl.hint_count), 0)::integer as hint_count
    from public.group_session gs
    join group_list gl on gl.group_id = gs.group_id
    left join public.word_attempt wa on wa.group_session_id = gs.id
    left join public.char_log cl on cl.word_attempt_id = wa.id
    where gs.user_id = (select auth.uid())
      and gs.dataset_id = p_dataset_id
      and gs.practice_type in ('s', 'p')
      and gs.done_at is not null
      and (gs.done_at at time zone p_timezone)::date = (now() at time zone p_timezone)::date
    group by gs.id, gs.started_at, gs.done_at
  ),
  today as (
    select
      count(*) filter (where hint_count = 0)::integer as sessions,
      coalesce(sum(
        least(
          greatest(extract(epoch from done_at - started_at) * 1000, 0),
          7200000
        )
      ), 0)::bigint as duration_ms
    from today_sessions_raw
  ),
  words as (
    select count(distinct (gs.group_id, wa.word_id))::integer as drilled
    from public.group_session gs
    join group_list gl on gl.group_id = gs.group_id
    join public.word_attempt wa on wa.group_session_id = gs.id
    where gs.user_id = (select auth.uid())
      and gs.dataset_id = p_dataset_id
      and gs.practice_type in ('s', 'p')
      and wa.done_at is not null
  ),
  due as (
    select count(*)::integer as due_count
    from reviews r
    where r.reason in ('repeat', 'due')
  )
  select
    t.sessions,
    t.duration_ms,
    d.due_count,
    w.drilled,
    nd.group_id,
    nd.practice_type,
    nd.reason
  from today t
  cross join words w
  cross join due d
  left join next_drill nd on true;
$$;
