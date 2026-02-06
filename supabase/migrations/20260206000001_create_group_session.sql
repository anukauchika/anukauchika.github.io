create table group_session (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id),
  dataset_id char(2) not null,
  practice_type char(1) not null,
  group_id   smallint not null,
  started_at timestamptz not null,
  done_at    timestamptz
);

alter table group_session enable row level security;

create policy "select own sessions"
  on group_session for select
  using (auth.uid() = user_id);

create policy "insert own sessions"
  on group_session for insert
  with check (auth.uid() = user_id);

create policy "update own sessions"
  on group_session for update
  using (auth.uid() = user_id);

create index idx_group_session_user_dataset
  on group_session(user_id, dataset_id);

create index idx_group_session_user_dataset_group
  on group_session(user_id, dataset_id, group_id);

alter table group_session
  add constraint uq_group_session
  unique (user_id, dataset_id, practice_type, group_id, started_at);
