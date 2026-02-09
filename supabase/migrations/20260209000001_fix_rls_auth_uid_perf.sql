-- Fix: wrap auth.uid() in (select ...) so it's evaluated once per query, not per row.

-- group_session
drop policy "select own sessions" on group_session;
drop policy "insert own sessions" on group_session;
drop policy "update own sessions" on group_session;

create policy "select own sessions"
  on group_session for select
  using ((select auth.uid()) = user_id);

create policy "insert own sessions"
  on group_session for insert
  with check ((select auth.uid()) = user_id);

create policy "update own sessions"
  on group_session for update
  using ((select auth.uid()) = user_id);

-- word_attempt
drop policy "select own word attempts" on word_attempt;
drop policy "insert own word attempts" on word_attempt;

create policy "select own word attempts"
  on word_attempt for select
  using (group_session_id in (select id from group_session where user_id = (select auth.uid())));

create policy "insert own word attempts"
  on word_attempt for insert
  with check (group_session_id in (select id from group_session where user_id = (select auth.uid())));

-- char_log
drop policy "select own char logs" on char_log;
drop policy "insert own char logs" on char_log;

create policy "select own char logs"
  on char_log for select
  using (word_attempt_id in (
    select id from word_attempt where group_session_id in (
      select id from group_session where user_id = (select auth.uid())
    )
  ));

create policy "insert own char logs"
  on char_log for insert
  with check (word_attempt_id in (
    select id from word_attempt where group_session_id in (
      select id from group_session where user_id = (select auth.uid())
    )
  ));
