create or replace function public.chinese_group_review_state(
  p_dataset_id text,
  p_group_ids integer[]
)
returns table (
  group_id integer,
  practice_type char(1),
  full_count integer,
  clean_count integer,
  first_full_at timestamptz,
  last_full_at timestamptz,
  last_clean_at timestamptz,
  last_session_hint_count integer,
  reason text,
  due_at timestamptz,
  interval_days integer
)
language sql
security invoker
stable
set search_path = public
as $$
  with group_list as (
    select g.group_id::integer
    from unnest(p_group_ids) with ordinality as g(group_id, ord)
  ),
  practice_types as (
    select 's'::char(1) as practice_type
    union all
    select 'p'::char(1) as practice_type
  ),
  session_hints as (
    select
      gs.id,
      gs.group_id::integer,
      gs.practice_type::char(1),
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
    group by gs.id, gs.group_id, gs.practice_type, gs.started_at, gs.done_at
  ),
  progress as (
    select
      gl.group_id,
      pt.practice_type,
      count(sh.id)::integer as full_count,
      count(sh.id) filter (where sh.hint_count = 0)::integer as clean_count,
      min(sh.done_at) as first_full_at,
      max(sh.done_at) as last_full_at,
      max(sh.done_at) filter (where sh.hint_count = 0) as last_clean_at,
      (array_agg(sh.hint_count order by sh.done_at desc, sh.started_at desc, sh.id desc)
        filter (where sh.id is not null))[1] as last_session_hint_count
    from group_list gl
    cross join practice_types pt
    left join session_hints sh
      on sh.group_id = gl.group_id
      and sh.practice_type = pt.practice_type
    group by gl.group_id, pt.practice_type
  ),
  reviews as (
    select
      p.*,
      case
        when p.clean_count > 0 then power(2::numeric, p.clean_count - 1)::integer
        else null
      end as computed_interval_days
    from progress p
  )
  select
    r.group_id,
    r.practice_type,
    r.full_count,
    r.clean_count,
    r.first_full_at,
    r.last_full_at,
    r.last_clean_at,
    r.last_session_hint_count,
    case
      when r.full_count = 0 then 'new'
      when coalesce(r.last_session_hint_count, 0) > 0 then 'repeat'
      when r.last_clean_at + make_interval(days => r.computed_interval_days) <= now() then 'due'
      else 'upcoming'
    end as reason,
    case
      when r.full_count > 0
        and coalesce(r.last_session_hint_count, 0) = 0
        and r.last_clean_at is not null
        and r.computed_interval_days is not null
      then r.last_clean_at + make_interval(days => r.computed_interval_days)
      else null
    end as due_at,
    case
      when r.full_count > 0 and coalesce(r.last_session_hint_count, 0) = 0
      then r.computed_interval_days
      else null
    end as interval_days
  from reviews r;
$$;

create or replace function public.next_chinese_drill(
  p_dataset_id text,
  p_group_ids integer[]
)
returns table (
  group_id integer,
  practice_type char(1),
  reason text,
  due_at timestamptz,
  interval_days integer
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
    from public.chinese_group_review_state(p_dataset_id, p_group_ids) r
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
      r.due_at,
      r.interval_days,
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
      r.due_at,
      r.interval_days,
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
      r.due_at,
      r.interval_days,
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
      r.due_at,
      r.interval_days,
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
      r.due_at,
      r.interval_days,
      4 as rank,
      extract(epoch from r.due_at) as primary_order,
      r.ord as secondary_order,
      r.type_ord as tertiary_order
    from reviews r
    where r.reason = 'upcoming'
  )
  select
    c.group_id,
    c.practice_type,
    c.reason,
    c.due_at,
    c.interval_days
  from candidates c
  order by c.rank, c.primary_order, c.secondary_order, c.tertiary_order, c.group_id
  limit 1;
$$;

revoke execute on function public.chinese_group_review_state(text, integer[]) from public;
revoke execute on function public.chinese_group_review_state(text, integer[]) from anon;
grant execute on function public.chinese_group_review_state(text, integer[]) to authenticated;

revoke execute on function public.next_chinese_drill(text, integer[]) from public;
revoke execute on function public.next_chinese_drill(text, integer[]) from anon;
grant execute on function public.next_chinese_drill(text, integer[]) to authenticated;
