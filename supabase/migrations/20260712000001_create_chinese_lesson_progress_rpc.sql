create or replace function public.chinese_lesson_progress(
  p_dataset_id text,
  p_group_ids integer[]
)
returns table (
  group_id integer,
  drilled_words integer
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
  progress as (
    -- Same indexed session -> word-attempt path used by the `words` CTE in
    -- chinese_home_summary, grouped once here to return per-lesson counts.
    select
      gs.group_id::integer as group_id,
      count(distinct wa.word_id)::integer as drilled_words
    from public.group_session gs
    join group_list gl on gl.group_id = gs.group_id
    join public.word_attempt wa on wa.group_session_id = gs.id
    where gs.user_id = (select auth.uid())
      and gs.dataset_id = p_dataset_id
      and gs.practice_type in ('s', 'p')
      and wa.done_at is not null
    group by gs.group_id
  )
  select
    gl.group_id,
    coalesce(p.drilled_words, 0)::integer as drilled_words
  from group_list gl
  left join progress p on p.group_id = gl.group_id
  order by gl.group_id;
$$;

revoke execute on function public.chinese_lesson_progress(text, integer[]) from public;
revoke execute on function public.chinese_lesson_progress(text, integer[]) from anon;
grant execute on function public.chinese_lesson_progress(text, integer[]) to authenticated;
