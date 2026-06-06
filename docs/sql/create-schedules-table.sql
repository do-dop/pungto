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

drop policy if exists "Allow public schedule read" on schedules;
drop policy if exists "Allow public schedule insert" on schedules;
drop policy if exists "Allow public schedule update" on schedules;
drop policy if exists "Allow public schedule delete" on schedules;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow room members to read schedules'
  ) then
    create policy "Allow room members to read schedules"
    on schedules
    for select
    using (
      exists (
        select 1
        from room_members
        where room_members.room_id = schedules.room_id
          and room_members.user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow room members to create schedules'
  ) then
    create policy "Allow room members to create schedules"
    on schedules
    for insert
    with check (
      exists (
        select 1
        from room_members
        where room_members.room_id = schedules.room_id
          and room_members.user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow room members to update schedules'
  ) then
    create policy "Allow room members to update schedules"
    on schedules
    for update
    using (
      exists (
        select 1
        from room_members
        where room_members.room_id = schedules.room_id
          and room_members.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from room_members
        where room_members.room_id = schedules.room_id
          and room_members.user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'Allow room members to delete schedules'
  ) then
    create policy "Allow room members to delete schedules"
    on schedules
    for delete
    using (
      exists (
        select 1
        from room_members
        where room_members.room_id = schedules.room_id
          and room_members.user_id = auth.uid()
      )
    );
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
