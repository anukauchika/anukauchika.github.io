-- chinese_group_review_state took ~2.2s through its SQL-function generic plan,
-- while the same query with concrete arguments took ~38ms. Dynamic EXECUTE in
-- PL/pgSQL replans the statement for the actual dataset and group array on each
-- call. Values remain bound parameters; no user input is interpolated into SQL.

create or replace function public.chinese_group_review_state(
  p_dataset_id text,
  p_group_ids integer[],
  p_timezone text
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
language plpgsql
security invoker
stable
set search_path = public
as $function$
begin
  return query execute $query$
    with group_list as (
      select g.group_id::integer
      from unnest($2) with ordinality as g(group_id, ord)
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
        and gs.dataset_id = $1
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
    ),
    due_times as (
      select
        r.*,
        case
          when r.full_count > 0
            and coalesce(r.last_session_hint_count, 0) = 0
            and r.last_clean_at is not null
            and r.computed_interval_days is not null
          then r.last_clean_at + make_interval(days => r.computed_interval_days)
          else null
        end as computed_due_at
      from reviews r
    )
    select
      d.group_id,
      d.practice_type,
      d.full_count,
      d.clean_count,
      d.first_full_at,
      d.last_full_at,
      d.last_clean_at,
      d.last_session_hint_count,
      case
        when d.full_count = 0 then 'new'
        when coalesce(d.last_session_hint_count, 0) > 0 then 'repeat'
        when (d.computed_due_at at time zone $3)::date <= (now() at time zone $3)::date then 'due'
        else 'upcoming'
      end as reason,
      d.computed_due_at as due_at,
      case
        when d.full_count > 0 and coalesce(d.last_session_hint_count, 0) = 0
        then d.computed_interval_days
        else null
      end as interval_days
    from due_times d
  $query$ using p_dataset_id, p_group_ids, p_timezone;
end;
$function$;
