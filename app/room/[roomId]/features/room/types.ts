export type Message = {
  id: string
  display_name: string
  content: string
  session_id: string
  created_at: string
}

export type PageKey = 'dashboard' | 'chat' | 'kanban' | 'schedule' | 'docs' | 'notif' | 'todo'
export type ShellBackgroundKey = 'default' | 'rolophus'

export type TodoItem = {
  id: number
  text: string
  due: string
  urgent?: boolean
  done?: boolean
}

export type KanbanColumnKey = 'todo' | 'doing' | 'review' | 'done'

export type KanbanTask = {
  id: number
  title: string
  category: string
  categoryClass: string
  due: string
  description: string
  owner: string
  status: KanbanColumnKey
  overdue?: boolean
}

export type TaskRow = {
  id: number
  room_id: string
  title: string
  description: string
  status: KanbanColumnKey
  category: string
  category_class: string
  owner_name: string
  due_text: string
  is_overdue: boolean
  position: number
  created_by_session_id: string | null
  created_at: string
  updated_at: string
}

export type DashboardLink = {
  id: number
  label: string
  url: string
  kind: 'github' | 'figma' | 'notion' | 'docs' | 'etc'
}

export type TeamRole = {
  id: number
  name: string
  role: string
}

export type DashboardMetaRow = {
  room_id: string
  project_name?: string
  summary: string
  goal: string
  updated_at: string
}

export type DashboardLinkRow = {
  id: number
  room_id: string
  label: string
  url: string
  kind: DashboardLink['kind']
  position: number
  created_at: string
}

export type TeamRoleRow = {
  id: number
  room_id: string
  name: string
  role: string
  position: number
  created_at: string
  updated_at: string
}

export type DocumentItem = {
  ext: string
  className: string
  name: string
  meta: string
}

export type NotificationItem = {
  tone: string
  title: string
  time: string
  unread?: boolean
}
