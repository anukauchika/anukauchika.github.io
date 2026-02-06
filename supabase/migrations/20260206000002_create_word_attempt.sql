create table word_attempt (
  id                bigint generated always as identity primary key,
  group_session_id  bigint not null references group_session(id),
  word_id           smallint not null,
  started_at        timestamptz not null,
  done_at           timestamptz not null
);

alter table word_attempt enable row level security;

create policy "select own word attempts"
  on word_attempt for select
  using (group_session_id in (select id from group_session where user_id = auth.uid()));

create policy "insert own word attempts"
  on word_attempt for insert
  with check (group_session_id in (select id from group_session where user_id = auth.uid()));

create index idx_word_attempt_session
  on word_attempt(group_session_id);

alter table word_attempt
  add constraint uq_word_attempt
  unique (group_session_id, word_id, started_at);
