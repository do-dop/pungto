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
