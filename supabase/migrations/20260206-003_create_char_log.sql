create table char_log (
  word_attempt_id  bigint not null references word_attempt(id),
  char_index       smallint not null,
  started_at       timestamptz not null,
  done_at          timestamptz not null,
  error_count      smallint not null default 0,
  primary key (word_attempt_id, char_index)
);

alter table char_log enable row level security;

create policy "select own char logs"
  on char_log for select
  using (word_attempt_id in (
    select id from word_attempt where group_session_id in (
      select id from group_session where user_id = auth.uid()
    )
  ));

create policy "insert own char logs"
  on char_log for insert
  with check (word_attempt_id in (
    select id from word_attempt where group_session_id in (
      select id from group_session where user_id = auth.uid()
    )
  ));

create index idx_char_log_word_attempt
  on char_log(word_attempt_id);
