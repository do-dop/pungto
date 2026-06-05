create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  title text not null,
  description text,
  scheduled_date date not null,
  color text not null default 'purple',
  created_by text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table schedules
add column if not exists color text not null default 'purple';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schedules_color_check'
  ) then
    alter table schedules
    add constraint schedules_color_check
    check (color in ('purple', 'teal', 'coral'));
  end if;
end $$;

create index if not exists idx_schedules_room_id
on schedules(room_id);

alter table schedules replica identity full;

alter table schedules enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow public schedule read'
  ) then
    create policy "Allow public schedule read"
    on schedules
    for select
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow public schedule insert'
  ) then
    create policy "Allow public schedule insert"
    on schedules
    for insert
    with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow public schedule update'
  ) then
    create policy "Allow public schedule update"
    on schedules
    for update
    using (true)
    with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow public schedule delete'
  ) then
    create policy "Allow public schedule delete"
    on schedules
    for delete
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'schedules'
  ) then
    alter publication supabase_realtime add table schedules;
  end if;
end $$;
