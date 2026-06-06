create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  session_id text not null,
  display_name text not null,
  joined_at timestamptz default now(),
  unique(room_id, session_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  session_id text not null,
  display_name text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table members enable row level security;
alter table messages enable row level security;

drop policy if exists "members_read" on members;
drop policy if exists "members_insert" on members;
drop policy if exists "members_upsert" on members;
drop policy if exists "messages_read" on messages;
drop policy if exists "messages_insert" on messages;

drop policy if exists "Allow room members to read member display list" on members;
drop policy if exists "Allow room members to write own display member" on members;
drop policy if exists "Allow room members to update own display member" on members;
drop policy if exists "Allow room members to read messages" on messages;
drop policy if exists "Allow room members to create messages" on messages;

create policy "Allow room members to read member display list"
on members
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = members.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to write own display member"
on members
for insert
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = members.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to update own display member"
on members
for update
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = members.room_id
      and room_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = members.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to read messages"
on messages
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = messages.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to create messages"
on messages
for insert
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = messages.room_id
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
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'members'
  ) then
    alter publication supabase_realtime add table members;
  end if;
end $$;
