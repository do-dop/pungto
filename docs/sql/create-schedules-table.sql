create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  title text not null,
  description text,
  scheduled_date date not null,
  created_by text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_schedules_room_id
on schedules(room_id);