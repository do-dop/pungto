create table if not exists tasks (
  id bigint generated always as identity primary key,
  room_id text not null references rooms(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'doing', 'review', 'done')),
  category text not null default '',
  category_class text not null default 'tag-p'
    check (category_class in ('tag-p', 'tag-t', 'tag-a')),
  owner_name text not null default '',
  due_text text not null default '',
  is_overdue boolean not null default false,
  position integer not null default 0,
  created_by_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_room_id_idx
on tasks(room_id);

create index if not exists tasks_room_id_status_idx
on tasks(room_id, status);

create index if not exists tasks_room_id_position_idx
on tasks(room_id, position);

create or replace function set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at_trigger on tasks;

create trigger set_tasks_updated_at_trigger
before update on tasks
for each row
execute function set_tasks_updated_at();

alter table tasks enable row level security;

drop policy if exists "tasks_read" on tasks;
drop policy if exists "tasks_insert" on tasks;
drop policy if exists "tasks_update" on tasks;
drop policy if exists "tasks_delete" on tasks;

drop policy if exists "Allow room members to read tasks" on tasks;
drop policy if exists "Allow room members to create tasks" on tasks;
drop policy if exists "Allow room members to update tasks" on tasks;
drop policy if exists "Allow room members to delete tasks" on tasks;

create policy "Allow room members to read tasks"
on tasks
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = tasks.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to create tasks"
on tasks
for insert
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = tasks.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to update tasks"
on tasks
for update
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = tasks.room_id
      and room_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = tasks.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to delete tasks"
on tasks
for delete
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = tasks.room_id
      and room_members.user_id = auth.uid()
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;
end $$;
