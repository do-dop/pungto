create extension if not exists pgcrypto;

create table if not exists rooms (
  id text primary key,
  title text not null default '새 방',
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

create table if not exists room_members (
  room_id text not null references rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  joined_at timestamp with time zone default now(),
  primary key (room_id, user_id)
);

create table if not exists room_secrets (
  room_id text primary key references rooms(id) on delete cascade,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

alter table room_members
add column if not exists display_name text;

create index if not exists idx_room_members_user_id
on room_members(user_id);

alter table rooms enable row level security;
alter table room_members enable row level security;
alter table room_secrets enable row level security;

drop policy if exists "rooms_read" on rooms;
drop policy if exists "rooms_insert" on rooms;
drop policy if exists "Allow public room read" on rooms;
drop policy if exists "Allow room members to read rooms" on rooms;
drop policy if exists "Allow users to join rooms from invite link" on room_members;

create policy "Allow room members to read rooms"
on rooms
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = rooms.id
      and room_members.user_id = auth.uid()
  )
);

create or replace function get_public_room_title(p_room_id text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(nullif(trim(title), ''), 'Pungto')
  from rooms
  where id = p_room_id
$$;

create or replace function create_room_with_password(
  p_room_id text,
  p_title text,
  p_password text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_password text := nullif(trim(p_password), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_password is null or length(v_password) < 4 then
    raise exception 'Room password must be at least 4 characters';
  end if;

  insert into rooms(id, title)
  values (p_room_id, coalesce(nullif(trim(p_title), ''), '새 방'));

  insert into room_secrets(room_id, password_hash)
  values (p_room_id, extensions.crypt(v_password, extensions.gen_salt('bf')));

  insert into room_members(room_id, user_id)
  values (p_room_id, v_user_id)
  on conflict (room_id, user_id) do nothing;

  return p_room_id;
end;
$$;

create or replace function join_room_with_password(
  p_room_id text,
  p_password text,
  p_display_name text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_password text := nullif(trim(p_password), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_password is null then
    raise exception 'Room password is required';
  end if;

  if not exists (
    select 1
    from room_secrets
    where room_id = p_room_id
      and password_hash = extensions.crypt(v_password, password_hash)
  ) then
    raise exception 'Invalid room password';
  end if;

  insert into room_members(room_id, user_id, display_name)
  values (p_room_id, v_user_id, nullif(trim(p_display_name), ''))
  on conflict (room_id, user_id)
  do update set
    display_name = excluded.display_name,
    joined_at = now();

  return true;
end;
$$;

revoke execute on function create_room_with_password(text, text, text) from public;
revoke execute on function join_room_with_password(text, text, text) from public;
revoke execute on function get_public_room_title(text) from public;
revoke execute on function create_room_with_password(text, text, text) from anon;
revoke execute on function join_room_with_password(text, text, text) from anon;
grant execute on function get_public_room_title(text) to anon;
grant execute on function create_room_with_password(text, text, text) to authenticated;
grant execute on function join_room_with_password(text, text, text) to authenticated;
grant execute on function get_public_room_title(text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'room_members'
      and policyname = 'Allow users to read own room memberships'
  ) then
    create policy "Allow users to read own room memberships"
    on room_members
    for select
    using (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'room_members'
      and policyname = 'Allow users to update own room memberships'
  ) then
    create policy "Allow users to update own room memberships"
    on room_members
    for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;
