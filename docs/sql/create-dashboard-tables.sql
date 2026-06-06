create table if not exists room_dashboard (
  room_id text primary key references rooms(id) on delete cascade,
  project_name text not null default 'Pungto',
  summary text not null default '',
  goal text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists dashboard_links (
  id bigint generated always as identity primary key,
  room_id text not null references rooms(id) on delete cascade,
  label text not null,
  url text not null,
  kind text not null default 'etc'
    check (kind in ('github', 'figma', 'notion', 'docs', 'etc')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists team_roles (
  id bigint generated always as identity primary key,
  room_id text not null references rooms(id) on delete cascade,
  name text not null,
  role text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table room_dashboard
add column if not exists project_name text not null default 'Pungto';

create index if not exists dashboard_links_room_id_idx
on dashboard_links(room_id, position);

create index if not exists team_roles_room_id_idx
on team_roles(room_id, position);

create or replace function set_room_dashboard_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function set_team_roles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_room_dashboard_updated_at_trigger on room_dashboard;
drop trigger if exists set_team_roles_updated_at_trigger on team_roles;

create trigger set_room_dashboard_updated_at_trigger
before update on room_dashboard
for each row
execute function set_room_dashboard_updated_at();

create trigger set_team_roles_updated_at_trigger
before update on team_roles
for each row
execute function set_team_roles_updated_at();

alter table room_dashboard enable row level security;
alter table dashboard_links enable row level security;
alter table team_roles enable row level security;

drop policy if exists "Allow room members to read room dashboard" on room_dashboard;
drop policy if exists "Allow room members to upsert room dashboard" on room_dashboard;
drop policy if exists "Allow room members to read dashboard links" on dashboard_links;
drop policy if exists "Allow room members to create dashboard links" on dashboard_links;
drop policy if exists "Allow room members to update dashboard links" on dashboard_links;
drop policy if exists "Allow room members to delete dashboard links" on dashboard_links;
drop policy if exists "Allow room members to read team roles" on team_roles;
drop policy if exists "Allow room members to create team roles" on team_roles;
drop policy if exists "Allow room members to update team roles" on team_roles;
drop policy if exists "Allow room members to delete team roles" on team_roles;

create policy "Allow room members to read room dashboard"
on room_dashboard
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = room_dashboard.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to upsert room dashboard"
on room_dashboard
for all
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = room_dashboard.room_id
      and room_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = room_dashboard.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to read dashboard links"
on dashboard_links
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = dashboard_links.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to create dashboard links"
on dashboard_links
for insert
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = dashboard_links.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to update dashboard links"
on dashboard_links
for update
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = dashboard_links.room_id
      and room_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = dashboard_links.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to delete dashboard links"
on dashboard_links
for delete
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = dashboard_links.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to read team roles"
on team_roles
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = team_roles.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to create team roles"
on team_roles
for insert
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = team_roles.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to update team roles"
on team_roles
for update
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = team_roles.room_id
      and room_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = team_roles.room_id
      and room_members.user_id = auth.uid()
  )
);

create policy "Allow room members to delete team roles"
on team_roles
for delete
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = team_roles.room_id
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
      and tablename = 'room_dashboard'
  ) then
    alter publication supabase_realtime add table room_dashboard;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dashboard_links'
  ) then
    alter publication supabase_realtime add table dashboard_links;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'team_roles'
  ) then
    alter publication supabase_realtime add table team_roles;
  end if;
end $$;
