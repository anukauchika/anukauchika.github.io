create or replace function public.restore_chinese_stats()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  with sessions as (
    select gs.*
    from public.group_session gs
    where gs.user_id = (select auth.uid())
    order by gs.started_at
  ),
  words as (
    select wa.*
    from public.word_attempt wa
    join sessions s on s.id = wa.group_session_id
    order by wa.started_at
  ),
  chars as (
    select cl.*
    from public.char_log cl
    join words w on w.id = cl.word_attempt_id
    order by cl.word_attempt_id, cl.char_index
  )
  select jsonb_build_object(
    'sessions', coalesce((select jsonb_agg(to_jsonb(s)) from sessions s), '[]'::jsonb),
    'words', coalesce((select jsonb_agg(to_jsonb(w)) from words w), '[]'::jsonb),
    'chars', coalesce((select jsonb_agg(to_jsonb(c)) from chars c), '[]'::jsonb)
  );
$$;

revoke execute on function public.restore_chinese_stats() from public;
revoke execute on function public.restore_chinese_stats() from anon;
grant execute on function public.restore_chinese_stats() to authenticated;
