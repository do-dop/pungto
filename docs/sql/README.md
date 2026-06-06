# SQL execution order

Run these files in this order in the Supabase SQL Editor:

1. `create-room-access.sql`
   - `rooms`, room password hashes, anonymous-auth room membership, room entry RPCs
2. `create-messages-table.sql`
   - display members and chat messages
3. `create-schedules-table.sql`
   - schedules and schedule RLS
4. `create-tasks-table.sql`
   - kanban tasks and task RLS
5. `create-dashboard-tables.sql`
   - dashboard metadata, links, and team roles

`room_members` is the authorization table used by the feature-specific RLS policies, so room access must be created before the feature tables.
